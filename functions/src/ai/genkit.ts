
import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export { type GenkitError };

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
  ],
});
