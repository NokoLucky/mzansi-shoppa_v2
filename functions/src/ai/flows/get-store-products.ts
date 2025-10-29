
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { generateProductImage } from './generate-product-image';


const GetStoreProductsInputSchema = z.object({
  storeName: z.string().describe('The name of the store.'),
  existingProducts: z
    .array(z.string())
    .optional()
    .describe('A list of product names already displayed to the user.'),
});

const ProductSchema = z.object({
  id: z.number().describe('A unique ID for the product.'),
  name: z.string().describe('The full name of the product.'),
  price: z.string().describe('The current price of the product.'),
  onSpecial: z.boolean().describe('Whether the product is currently on special.'),
  originalPrice: z
    .string()
    .optional()
    .describe('The original price if the product is on special.'),
  image: z.string().describe('A placeholder image URL for the product.'),
  dataAiHint: z
    .string()
    .describe(
      'A 1-2 word hint for generating an image, e.g., "milk carton".'
    ),
});

const GetStoreProductsOutputSchema = z.object({
  products: z
    .array(ProductSchema)
    .describe('A list of 10 products available at the store.'),
});

export async function getStoreProducts(
  input: z.infer<typeof GetStoreProductsInputSchema>
): Promise<z.infer<typeof GetStoreProductsOutputSchema>> {
  return await getStoreProductsFlow(input);
}

const prompt = ai.definePrompt({
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

const getStoreProductsFlow = ai.defineFlow(
  {
    name: 'getStoreProductsFlow',
    inputSchema: GetStoreProductsInputSchema,
    outputSchema: GetStoreProductsOutputSchema,
  },
  async (input) => {
    console.log(`➡️  Starting product generation for store: "${input.storeName}"`);
    
    const llmResponse = await prompt(input);
    const result = llmResponse.output!;

    console.log(`🤖 LLM generated ${result.products.length} product suggestions. Now generating images...`);

    // Generate real images in parallel instead of using placeholders
    const productsWithImages = await Promise.all(
        result.products.map(async (p) => {
            const imageResponse = await generateProductImage({ 
                dataAiHint: p.dataAiHint,
                width: 200,
                height: 200,
            });
            return {
                ...p,
                image: imageResponse.imageUrl,
            };
        })
    );
    
    console.log(`🖼️  Image generation complete for all products at "${input.storeName}".`);
    return { products: productsWithImages };
  }
);
