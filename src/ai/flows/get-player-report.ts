'use server';

/**
 * @fileOverview An AI agent that analyzes user answers to generate EQ scores and a suggested player position.
 *
 * - getPlayerReport - A function that returns a complete player report.
 * - GetPlayerReportInput - The input type for the getPlayerReport function.
 * - GetPlayerReportOutput - The return type for the getPlayerReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetPlayerReportInputSchema = z.object({
  scenario1: z.string().describe("The user's answer to the first scenario."),
  scenario2: z.string().describe("The user's answer to the second scenario."),
  scenario3: z.string().describe("The user's answer to the third scenario."),
  scenario4: z.string().describe("The user's answer to the fourth scenario."),
  scenario5: z.string().describe("The user's answer to the fifth scenario."),
  scenario6: z.string().describe("The user's answer to the sixth scenario."),
});
export type GetPlayerReportInput = z.infer<typeof GetPlayerReportInputSchema>;

const GetPlayerReportOutputSchema = z.object({
  eqScores: z.object({
    patience: z.number().describe('Score for patience (0-100).'),
    empathy: z.number().describe('Score for empathy (0-100).'),
    resilience: z.number().describe('Score for resilience (0-100).'),
    focus: z.number().describe('Score for focus (0-100).'),
    teamwork: z.number().describe('Score for teamwork (0-100).'),
    confidence: z.number().describe('Score for confidence (0-100).'),
  }),
  position: z.string().describe("The assigned player position abbreviation (e.g., 'CM', 'GK', 'ST')."),
  playerComparison: z.string().describe("The name of a real-world player who has similar skills."),
});
export type GetPlayerReportOutput = z.infer<typeof GetPlayerReportOutputSchema>;

export async function getPlayerReport(input: GetPlayerReportInput): Promise<GetPlayerReportOutput> {
  return getPlayerReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPlayerReportPrompt',
  input: { schema: GetPlayerReportInputSchema },
  output: { schema: GetPlayerReportOutputSchema },
  prompt: `You are an expert in emotional intelligence and a British football scout. Your task is to analyse a player's answers to six scenarios, calculate their EQ scores, and assign them a football position.
First, score the player's answers based on six emotional intelligence categories: 

- Patience: The ability to wait for the right moment without frustration.
- Empathy: Understanding and responding to others' feelings or perspectives.
- Resilience: Recovering quickly from setbacks or negative events.
- Focus: Maintaining concentration under pressure or distractions.
- Teamwork: Willingness to collaborate and support team goals.
- Confidence: Self-belief and assertiveness in high-stakes situations.
Each score should be between 0 and 100.
Be sure to use the full range of scores; for answers that perfectly exemplify a trait, award a score of 95 or higher.
Second, based on the EQ scores you just calculated, assign a single football position abbreviation to the player.
Here are the available position abbreviations: GK, CB, FB, WB, DM, CM, WM, AM, WF, CF.
Use this mapping of EQ skills to positions as a guide:
- High Resilience and Focus: Essential for defensive roles. Suggests GK or CB.
- High Teamwork and Empathy: Key for midfielders who control the game. Suggests CM, DM, or AM.
- High Patience and Focus: Good for creative roles that wait for the right moment. Suggests AM or a deep-lying CM.
- High Confidence and Focus: Perfect for attackers who need to be decisive. Suggests CF or WF.
- A balanced profile might suggest versatile roles like FB, WB, or WM.

Third, based on the position and the EQ scores, provide a comparison to a real-world player known for similar qualities. For example:
- A CM with high teamwork and empathy could be compared to Kevin De Bruyne.
- A CF with high confidence and focus could be compared to Erling Haaland.
- A CB with high resilience and focus could be compared to Virgil van Dijk.
- An AM with high patience and creativity could be compared to Martin Ødegaard.

Here are the player's answers to the scenarios:
Scenario 1 (Not starting): {{{scenario1}}}
Scenario 2 (One-on-one): {{{scenario2}}}
Scenario 3 (Teammate conflict): {{{scenario3}}}
Scenario 4 (Halftime talk): {{{scenario4}}}
Scenario 5 (Defender mistake): {{{scenario5}}}
Scenario 6 (Final shot decision): {{{scenario6}}}

Provide your full analysis as a single JSON object containing the eqScores, position, and playerComparison.`,
});

const getPlayerReportFlow = ai.defineFlow(
  {
    name: 'getPlayerReportFlow',
    inputSchema: GetPlayerReportInputSchema,
    outputSchema: GetPlayerReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
