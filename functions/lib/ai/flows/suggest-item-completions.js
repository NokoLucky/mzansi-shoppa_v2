"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestItemCompletions = suggestItemCompletions;
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const SuggestItemCompletionsInputSchema = zod_1.z.object({
    query: zod_1.z.string().describe('The beginning of a shopping list item name'),
});
const SuggestItemCompletionsOutputSchema = zod_1.z.object({
    suggestions: zod_1.z
        .array(zod_1.z.string())
        .describe('A list of 8 suggestions for completing the shopping list item.'),
});
async function suggestItemCompletions(input) {
    const result = await suggestItemCompletionsFlow(input);
    return result;
}
const prompt = genkit_1.ai.definePrompt({
    name: 'suggestItemCompletionsPrompt',
    input: { schema: SuggestItemCompletionsInputSchema },
    output: { schema: SuggestItemCompletionsOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are an autocomplete agent for a shopping list app in South Africa. Given the user's input, suggest 8 likely completions for the item they are typing.

Only return likely product names.

Input:
{{query}}`,
});
const suggestItemCompletionsFlow = genkit_1.ai.defineFlow({
    name: 'suggestItemCompletionsFlow',
    inputSchema: SuggestItemCompletionsInputSchema,
    outputSchema: SuggestItemCompletionsOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output || { suggestions: [] };
});
//# sourceMappingURL=suggest-item-completions.js.map