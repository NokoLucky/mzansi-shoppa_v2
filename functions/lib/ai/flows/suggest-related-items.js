"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestRelatedItems = suggestRelatedItems;
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const SuggestRelatedItemsInputSchema = zod_1.z.object({
    shoppingList: zod_1.z
        .array(zod_1.z.string())
        .describe('The current list of items in the shopping cart.'),
});
const SuggestRelatedItemsOutputSchema = zod_1.z.object({
    relatedItems: zod_1.z
        .array(zod_1.z.string())
        .describe('A list of 3 suggested items related to the current list.'),
});
async function suggestRelatedItems(input) {
    return await suggestRelatedItemsFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'suggestRelatedItemsPrompt',
    input: { schema: SuggestRelatedItemsInputSchema },
    output: { schema: SuggestRelatedItemsOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are a shopping assistant in South Africa. Given the user's current shopping list, suggest up to 3 additional items they might also want to buy.

Do not suggest items already on the list.

Shopping List:
{{#each shoppingList}}- {{this}}
{{/each}}`,
});
const suggestRelatedItemsFlow = genkit_1.ai.defineFlow({
    name: 'suggestRelatedItemsFlow',
    inputSchema: SuggestRelatedItemsInputSchema,
    outputSchema: SuggestRelatedItemsOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
//# sourceMappingURL=suggest-related-items.js.map