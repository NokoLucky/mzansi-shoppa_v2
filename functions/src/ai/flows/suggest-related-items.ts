
'use server';

import { ai } from '../genkit';
import { z } from 'zod';

const SuggestRelatedItemsInputSchema = z.object({
  shoppingList: z
    .array(z.string())
    .describe('The current list of items in the shopping cart.'),
});

const SuggestRelatedItemsOutputSchema = z.object({
  relatedItems: z
    .array(z.string())
    .describe('A list of 3 suggested items related to the current list.'),
});

export async function suggestRelatedItems(
  input: z.infer<typeof SuggestRelatedItemsInputSchema>
): Promise<z.infer<typeof SuggestRelatedItemsOutputSchema>> {
  return await suggestRelatedItemsFlow(input);
}

const prompt = ai.definePrompt({
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

const suggestRelatedItemsFlow = ai.defineFlow(
  {
    name: 'suggestRelatedItemsFlow',
    inputSchema: SuggestRelatedItemsInputSchema,
    outputSchema: SuggestRelatedItemsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
