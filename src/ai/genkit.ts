import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY!,
      apiVersion: 'v1',
    }),
  ],
  // Use provider-prefixed model id so Genkit resolves the registered model
  model: 'googleai/gemini-2.5-pro',
});

// Startup sanity check so missing keys are obvious in logs
if (!process.env.GOOGLE_API_KEY) {
  console.error('[AI] Missing GOOGLE_API_KEY environment variable');
}
