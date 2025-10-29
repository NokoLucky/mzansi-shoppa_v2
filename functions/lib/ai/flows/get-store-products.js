"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreProducts = getStoreProducts;
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const generate_product_image_1 = require("./generate-product-image");
const GetStoreProductsInputSchema = zod_1.z.object({
    storeName: zod_1.z.string().describe('The name of the store.'),
    existingProducts: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe('A list of product names already displayed to the user.'),
});
const ProductSchema = zod_1.z.object({
    id: zod_1.z.number().describe('A unique ID for the product.'),
    name: zod_1.z.string().describe('The full name of the product.'),
    price: zod_1.z.string().describe('The current price of the product.'),
    onSpecial: zod_1.z.boolean().describe('Whether the product is currently on special.'),
    originalPrice: zod_1.z
        .string()
        .optional()
        .describe('The original price if the product is on special.'),
    image: zod_1.z.string().describe('A placeholder image URL for the product.'),
    dataAiHint: zod_1.z
        .string()
        .describe('A 1-2 word hint for generating an image, e.g., "milk carton".'),
});
const GetStoreProductsOutputSchema = zod_1.z.object({
    products: zod_1.z
        .array(ProductSchema)
        .describe('A list of 10 products available at the store.'),
});
async function getStoreProducts(input) {
    return await getStoreProductsFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'getStoreProductsPrompt',
    input: { schema: GetStoreProductsInputSchema },
    output: { schema: GetStoreProductsOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are a product database generator for a South African grocery store app.
Generate a list of 10 plausible, common grocery products sold at a store called {{storeName}}.

Make about 20% of the items "onSpecial". If an item is on special, provide a realistic originalPrice.
For each product, provide a simple dataAiHint (1-2 words) for image generation.
Ensure the generated products are different from the provided list of existing products.

Existing Products to avoid:
{{#each existingProducts}}
- {{this}}
{{/each}}
`,
});
const getStoreProductsFlow = genkit_1.ai.defineFlow({
    name: 'getStoreProductsFlow',
    inputSchema: GetStoreProductsInputSchema,
    outputSchema: GetStoreProductsOutputSchema,
}, async (input) => {
    console.log(`➡️  Starting product generation for store: "${input.storeName}"`);
    const llmResponse = await prompt(input);
    const result = llmResponse.output;
    console.log(`🤖 LLM generated ${result.products.length} product suggestions. Now generating images...`);
    // Generate real images in parallel instead of using placeholders
    const productsWithImages = await Promise.all(result.products.map(async (p) => {
        const imageResponse = await (0, generate_product_image_1.generateProductImage)({
            dataAiHint: p.dataAiHint,
            width: 200,
            height: 200,
        });
        return Object.assign(Object.assign({}, p), { image: imageResponse.imageUrl });
    }));
    console.log(`🖼️  Image generation complete for all products at "${input.storeName}".`);
    return { products: productsWithImages };
});
//# sourceMappingURL=get-store-products.js.map