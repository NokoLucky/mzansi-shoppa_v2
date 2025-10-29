
'use server';

import { ai } from '../genkit';
import { z } from 'zod';

const PriceBreakdownSchema = z.object({
  item: z.string().describe('The name of the shopping list item.'),
  price: z.number().describe('The estimated price of the item at this store in ZAR.'),
});

const StoreSchema = z.object({
  name: z.string().describe('The name of the store.'),
  distance: z
    .string()
    .describe(
      'The estimated distance to the nearest store from the user, if location is provided.'
    ),
  totalPrice: z
    .number()
    .describe(
      'The total estimated price of all available items in the shopping list at this store.'
    ),
  priceBreakdown: z
    .array(PriceBreakdownSchema)
    .describe(
      'An array of the prices for each item in the shopping list at this store.'
    ),
  isCheapest: z
    .boolean()
    .describe('Whether this store has the lowest total price.'),
});

const GetPriceEstimatesInputSchema = z.object({
  shoppingList: z.array(z.string()).describe("The user's shopping list."),
  latitude: z.number().optional().describe("The user's latitude."),
  longitude: z.number().optional().describe("The user's longitude."),
});

const GetPriceEstimatesOutputSchema = z.object({
  stores: z.array(StoreSchema).describe('A list of stores with price estimates.'),
});

export async function getPriceEstimates(
  input: z.infer<typeof GetPriceEstimatesInputSchema>
): Promise<z.infer<typeof GetPriceEstimatesOutputSchema>> {
  const result = await getPriceEstimatesFlow(input);
  return result;
}

const prompt = ai.definePrompt({
    name: 'priceEstimatorPrompt',
    input: { schema: GetPriceEstimatesInputSchema },
    output: { schema: GetPriceEstimatesOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are a Price Estimator Agent for a South African shopping app.
Your task is to provide realistic price estimates for a given shopping list at major South African retailers.

Retailers to consider:
- Checkers
- Shoprite
- Spar
- Woolworths
- Pick n Pay

For each item in the shopping list, provide a plausible price at each retailer. Sum these prices to get a total for each store.
Base your estimates on typical South African market prices. Woolworths is generally the most expensive, while Shoprite and Checkers are often cheaper.

Shopping List:
{{#each shoppingList}}
- {{this}}
{{/each}}

Identify the store with the lowest total price and set its 'isCheapest' flag to true.
Generate a plausible 'distance' for each store (e.g., "1.2 km", "5.8 km").
If an item is unlikely to be found at a store, you can omit it from that store's priceBreakdown.
Return an empty array for stores where no items from the list are typically sold.
`,
});


const getPriceEstimatesFlow = ai.defineFlow(
  {
    name: 'getPriceEstimatesFlow',
    inputSchema: GetPriceEstimatesInputSchema,
    outputSchema: GetPriceEstimatesOutputSchema,
  },
  async (input) => {
    if (input.shoppingList.length === 0) {
      return { stores: [] };
    }
    
    const { output } = await prompt(input);
    
    if (!output || !output.stores) {
      return { stores: [] };
    }

    // Ensure totalPrice is correctly calculated and isCheapest is set.
    // The model should handle this, but we can double-check here as a safeguard.
    if (output.stores.length > 0) {
      let minPrice = Infinity;
      let cheapestStoreIndex = -1;

      output.stores.forEach((store, index) => {
        // Recalculate total price just in case
        store.totalPrice = store.priceBreakdown.reduce((acc, item) => acc + item.price, 0);
        store.isCheapest = false; // Reset all first
        if (store.totalPrice < minPrice) {
          minPrice = store.totalPrice;
          cheapestStoreIndex = index;
        }
      });

      if (cheapestStoreIndex !== -1) {
        output.stores[cheapestStoreIndex].isCheapest = true;
      }
      
      // Sort by total price
      output.stores.sort((a, b) => a.totalPrice - b.totalPrice);
    }

    return output;
  }
);
