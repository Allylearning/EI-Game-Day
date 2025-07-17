'use server';

/**
 * @fileOverview An AI agent that provides commentary on a single user answer.
 *
 * - getScenarioFeedback - A function that returns a commentator's verdict on an answer.
 * - GetScenarioFeedbackInput - The input type for the getScenarioFeedback function.
 * - GetScenarioFeedbackOutput - The return type for the getScenarioFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetScenarioFeedbackInputSchema = z.object({
  scenario: z.string().describe("The text of the scenario the user was presented with."),
  answer: z.string().describe("The user's answer to the scenario."),
});
export type GetScenarioFeedbackInput = z.infer<typeof GetScenarioFeedbackInputSchema>;

const GetScenarioFeedbackOutputSchema = z.object({
  commentary: z.string().describe("The commentator's verdict on the user's action, written in a concise and engaging style."),
});
export type GetScenarioFeedbackOutput = z.infer<typeof GetScenarioFeedbackOutputSchema>;

export async function getScenarioFeedback(input: GetScenarioFeedbackInput): Promise<GetScenarioFeedbackOutput> {
  return getScenarioFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getScenarioFeedbackPrompt',
  input: { schema: GetScenarioFeedbackInputSchema },
  output: { schema: GetScenarioFeedbackOutputSchema },
  prompt: `You are a football commentator. Your task is to provide a short, engaging "verdict" on a player's response to a specific in-game scenario. The commentary should be 1-2 sentences long.

Scenario: {{{scenario}}}

Player's Answer: {{{answer}}}

Provide your verdict as a single JSON object with a "commentary" field.`,
});

const getScenarioFeedbackFlow = ai.defineFlow(
  {
    name: 'getScenarioFeedbackFlow',
    inputSchema: GetScenarioFeedbackInputSchema,
    outputSchema: GetScenarioFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
