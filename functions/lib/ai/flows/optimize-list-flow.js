"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeList = optimizeList;
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const get_price_estimates_1 = require("./get-price-estimates");
const OptimizeListInputSchema = zod_1.z.object({
    shoppingList: zod_1.z.array(zod_1.z.string()).describe("The user's shopping list."),
    budget: zod_1.z.number().describe("The user's budget."),
});
const OptimizeListOutputSchema = zod_1.z.object({
    optimizedList: zod_1.z
        .array(zod_1.z.string())
        .describe('The new, optimized shopping list.'),
    newTotalPrice: zod_1.z.number().describe('The new total price of the optimized list.'),
    changes: zod_1.z
        .array(zod_1.z.string())
        .describe('A list of changes made to the list.'),
    isUnderBudget: zod_1.z
        .boolean()
        .describe('Whether the final list is under budget.'),
});
async function optimizeList(input) {
    return await optimizeListFlow(input);
}
const optimizeListFlow = genkit_1.ai.defineFlow({
    name: 'optimizeListFlow',
    inputSchema: OptimizeListInputSchema,
    outputSchema: OptimizeListOutputSchema,
}, async ({ shoppingList, budget }) => {
    // Get price estimates to find the cheapest price for each item.
    const priceData = await (0, get_price_estimates_1.getPriceEstimates)({ shoppingList });
    const itemPrices = {};
    // Find the minimum price for each item across all stores
    shoppingList.forEach(item => {
        let minPrice = Infinity;
        priceData.stores.forEach(store => {
            var _a;
            const itemPrice = (_a = store.priceBreakdown.find(p => p.item === item)) === null || _a === void 0 ? void 0 : _a.price;
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
    const changes = [];
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
    while (totalPrice > budget && currentList.length > 0) {
        const removedItem = currentList.shift();
        totalPrice -= removedItem.price;
        changes.push(`Removed ${removedItem.item} to save R${removedItem.price.toFixed(2)}.`);
    }
    return {
        optimizedList: currentList.map(i => i.item),
        newTotalPrice: totalPrice,
        changes,
        isUnderBudget: totalPrice <= budget,
    };
});
//# sourceMappingURL=optimize-list-flow.js.map