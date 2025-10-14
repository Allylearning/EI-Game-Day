import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY!,
    }),
  ],
  // Use provider-prefixed model id so Genkit resolves the registered model
  model: 'googleai/gemini-2.5-flash',
});

// Startup sanity check so missing keys are obvious in logs
if (!process.env.GEMINI_API_KEY) {
  console.error('[AI] Missing GEMINI_API_KEY environment variable');
}
