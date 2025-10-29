"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPromotions = getCurrentPromotions;
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const generate_product_image_1 = require("./generate-product-image");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
const PromotionSchema = zod_1.z.object({
    title: zod_1.z.string().describe('The headline of the promotion.'),
    store: zod_1.z.string().describe('The store offering the promotion.'),
    img: zod_1.z.string().describe('A URL for a relevant image.'),
    dataAiHint: zod_1.z
        .string()
        .describe('A 1-2 word hint for generating an image, e.g., "laundry detergent".'),
    category: zod_1.z.string().describe('The product category, e.g., "Dairy".'),
    discountPercent: zod_1.z
        .number()
        .optional()
        .describe('The percentage discount, if applicable.'),
    validUntil: zod_1.z
        .string()
        .optional()
        .describe('The expiration date of the promotion in YYYY-MM-DD format.'),
});
const GetCurrentPromotionsOutputSchema = zod_1.z.object({
    promotions: zod_1.z
        .array(PromotionSchema)
        .describe('A list of 5 current promotions.'),
});
// Define a schema for the cached data including a timestamp
const CachedPromotionsSchema = GetCurrentPromotionsOutputSchema.extend({
    cachedAt: zod_1.z.string().datetime(),
});
async function getCurrentPromotions() {
    return await getCurrentPromotionsFlow();
}
const prompt = genkit_1.ai.definePrompt({
    name: 'getCurrentPromotionsPrompt',
    output: { schema: GetCurrentPromotionsOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are a promotions manager for a South African grocery app.
Generate a list of 5 realistic, appealing promotions currently available at major South African retailers (e.g., Checkers, Spar, Pick n Pay, Woolworths).

Today's date is {{currentDate}}. Ensure the 'validUntil' date for each promotion is within the next month from today.

For each promotion, provide:
- A catchy title.
- The store name.
- A 1-2 word hint for generating a relevant image (dataAiHint).
- A product category.
- An optional discount percentage.
- A valid expiration date (validUntil).
- For the 'img' field, use a temporary placeholder like "image_to_be_generated".`,
});
const getCurrentPromotionsFlow = genkit_1.ai.defineFlow({
    name: 'getCurrentPromotionsFlow',
    outputSchema: GetCurrentPromotionsOutputSchema,
}, async () => {
    const cacheRef = db.collection('cache').doc('dailyDeals');
    const doc = await cacheRef.get();
    if (doc.exists) {
        const cachedData = doc.data(); // Cast the data to our defined type
        const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        // If cache is less than a day old, return it
        if (cacheAge < oneDay) {
            console.log("Returning cached promotions.");
            // Ensure the returned data matches the flow's output schema
            return { promotions: cachedData.promotions };
        }
    }
    // If cache is old or doesn't exist, generate new promotions
    console.log("Cache is stale or missing. Generating new promotions.");
    const llmResponse = await prompt({
        currentDate: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    });
    const result = llmResponse.output;
    // Generate real images in parallel
    const promotionsWithImages = await Promise.all(result.promotions.map(async (promo) => {
        const imageResponse = await (0, generate_product_image_1.generateProductImage)({
            dataAiHint: promo.dataAiHint,
        });
        return Object.assign(Object.assign({}, promo), { img: imageResponse.imageUrl });
    }));
    const newPromotions = { promotions: promotionsWithImages };
    // Save the newly generated promotions to the cache in Firestore
    const dataToCache = Object.assign(Object.assign({}, newPromotions), { cachedAt: new Date().toISOString() });
    await cacheRef.set(dataToCache);
    console.log("New promotions saved to cache.");
    return newPromotions;
});
//# sourceMappingURL=get-current-promotions.js.map