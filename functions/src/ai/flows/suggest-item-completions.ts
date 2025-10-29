
'use server';

import { ai } from '../genkit';
import { z } from 'zod';

const SuggestItemCompletionsInputSchema = z.object({
  query: z.string().describe('The beginning of a shopping list item name'),
});

const SuggestItemCompletionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'A list of 8 suggestions for completing the shopping list item.'
    ),
});

export async function suggestItemCompletions(
  input: z.infer<typeof SuggestItemCompletionsInputSchema>
): Promise<z.infer<typeof SuggestItemCompletionsOutputSchema>> {
  const result = await suggestItemCompletionsFlow(input);
  return result;
}

const prompt = ai.definePrompt({
  name: 'suggestItemCompletionsPrompt',
  input: { schema: SuggestItemCompletionsInputSchema },
  output: { schema: SuggestItemCompletionsOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an autocomplete agent for a shopping list app in South Africa. Given the user's input, suggest 8 likely completions for the item they are typing.

Only return likely product names.

Input:
{{query}}`,
});

const suggestItemCompletionsFlow = ai.defineFlow(
  {
    name: 'suggestItemCompletionsFlow',
    inputSchema: SuggestItemCompletionsInputSchema,
    outputSchema: SuggestItemCompletionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || { suggestions: [] };
  }
);
