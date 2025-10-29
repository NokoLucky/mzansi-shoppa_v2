
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { generateProductImage } from './generate-product-image';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

const PromotionSchema = z.object({
  title: z.string().describe('The headline of the promotion.'),
  store: z.string().describe('The store offering the promotion.'),
  img: z.string().describe('A URL for a relevant image.'),
  dataAiHint: z
    .string()
    .describe(
      'A 1-2 word hint for generating an image, e.g., "laundry detergent".'
    ),
  category: z.string().describe('The product category, e.g., "Dairy".'),
  discountPercent: z
    .number()
    .optional()
    .describe('The percentage discount, if applicable.'),
  validUntil: z
    .string()
    .optional()
    .describe('The expiration date of the promotion in YYYY-MM-DD format.'),
});

const GetCurrentPromotionsOutputSchema = z.object({
  promotions: z
    .array(PromotionSchema)
    .describe('A list of 5 current promotions.'),
});

// Define a schema for the cached data including a timestamp
const CachedPromotionsSchema = GetCurrentPromotionsOutputSchema.extend({
    cachedAt: z.string().datetime(),
});
type CachedPromotions = z.infer<typeof CachedPromotionsSchema>;


export async function getCurrentPromotions(): Promise<
  z.infer<typeof GetCurrentPromotionsOutputSchema>
> {
  return await getCurrentPromotionsFlow();
}

const prompt = ai.definePrompt({
  name: 'getCurrentPromotionsPrompt',
  output: { schema: GetCurrentPromotionsOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a promotions manager for a South African grocery app.
Generate a list of 5 realistic, appealing promotions currently available at major South African retailers (e.g., Checkers, Spar, Pick n Pay, Woolworths).

For each promotion, provide:
- A catchy title.
- The store name.
- A 1-2 word hint for generating a relevant image (dataAiHint).
- A product category.
- An optional discount percentage.
- An optional validity date (within the next month).
- For the 'img' field, use a temporary placeholder like "image_to_be_generated".`,
});

const getCurrentPromotionsFlow = ai.defineFlow(
  {
    name: 'getCurrentPromotionsFlow',
    outputSchema: GetCurrentPromotionsOutputSchema,
  },
  async () => {
    const cacheRef = db.collection('cache').doc('dailyDeals');
    const doc = await cacheRef.get();

    if (doc.exists) {
        const cachedData = doc.data() as CachedPromotions; // Cast the data to our defined type
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
    const llmResponse = await prompt({});
    const result = llmResponse.output!;

    // Generate real images in parallel
    const promotionsWithImages = await Promise.all(
      result.promotions.map(async (promo) => {
        const imageResponse = await generateProductImage({
          dataAiHint: promo.dataAiHint,
        });
        return {
          ...promo,
          img: imageResponse.imageUrl,
        };
      })
    );
    
    const newPromotions = { promotions: promotionsWithImages };

    // Save the newly generated promotions to the cache in Firestore
    const dataToCache: CachedPromotions = {
        ...newPromotions,
        cachedAt: new Date().toISOString(),
    };
    await cacheRef.set(dataToCache);
    console.log("New promotions saved to cache.");

    return newPromotions;
  }
);
