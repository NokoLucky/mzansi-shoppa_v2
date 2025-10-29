
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { getPriceEstimates } from './get-price-estimates';

const OptimizeListInputSchema = z.object({
  shoppingList: z.array(z.string()).describe("The user's shopping list."),
  budget: z.number().describe("The user's budget."),
});

const OptimizeListOutputSchema = z.object({
  optimizedList: z
    .array(z.string())
    .describe('The new, optimized shopping list.'),
  newTotalPrice: z.number().describe('The new total price of the optimized list.'),
  changes: z
    .array(z.string())
    .describe('A list of changes made to the list.'),
  isUnderBudget: z
    .boolean()
    .describe('Whether the final list is under budget.'),
});

export async function optimizeList(
  input: z.infer<typeof OptimizeListInputSchema>
): Promise<z.infer<typeof OptimizeListOutputSchema>> {
  return await optimizeListFlow(input);
}


const optimizeListFlow = ai.defineFlow(
  {
    name: 'optimizeListFlow',
    inputSchema: OptimizeListInputSchema,
    outputSchema: OptimizeListOutputSchema,
  },
  async ({ shoppingList, budget }) => {
    // Get price estimates to find the cheapest price for each item.
    const priceData = await getPriceEstimates({ shoppingList });

    const itemPrices: { [item: string]: number } = {};

    // Find the minimum price for each item across all stores
    shoppingList.forEach(item => {
        let minPrice = Infinity;
        priceData.stores.forEach(store => {
            const itemPrice = store.priceBreakdown.find(p => p.item === item)?.price;
            if (itemPrice !== undefined && itemPrice < minPrice) {
                minPrice = itemPrice;
            }
        });
        if (minPrice !== Infinity) {
            itemPrices[item] = minPrice;
        }
    });

    let listWithPrices = shoppingList
        .map(item => ({ item, price: itemPrices[item] || 0 }))
        .filter(i => i.price > 0);
    
    let currentList = [...listWithPrices];
    const changes: string[] = [];
    
    let totalPrice = currentList.reduce((sum, item) => sum + item.price, 0);

    if (totalPrice <= budget) {
      return {
        optimizedList: shoppingList,
        newTotalPrice: totalPrice,
        changes: ["Your list was already under budget!"],
        isUnderBudget: true,
      };
    }
    
    // In a real app, alternative suggestions would be more dynamic.
    // For now, we will focus on removing items.
    
    // Start removing most expensive items
    currentList.sort((a, b) => b.price - a.price);

    while(totalPrice > budget && currentList.length > 0) {
        const removedItem = currentList.shift()!;
        totalPrice -= removedItem.price;
        changes.push(`Removed ${removedItem.item} to save R${removedItem.price.toFixed(2)}.`);
    }

    return {
      optimizedList: currentList.map(i => i.item),
      newTotalPrice: totalPrice,
      changes,
      isUnderBudget: totalPrice <= budget,
    };
  }
);
