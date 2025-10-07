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

const MODEL_ID = 'googleai/gemini-2.5-flash';

const GetPlayerReportInputSchema = z.object({
  scenario1: z.string().min(1).max(4000).describe("The user's answer to the first scenario."),
  scenario2: z.string().min(1).max(4000).describe("The user's answer to the second scenario."),
  scenario3: z.string().min(1).max(4000).describe("The user's answer to the third scenario."),
  scenario4: z.string().min(1).max(4000).describe("The user's answer to the fourth scenario."),
  scenario5: z.string().min(1).max(4000).describe("The user's answer to the fifth scenario."),
  scenario6: z.string().min(1).max(4000).describe("The user's answer to the sixth scenario."),
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
  model: MODEL_ID,
  input: { schema: GetPlayerReportInputSchema },
  output: { schema: GetPlayerReportOutputSchema },
  config: {
    temperature: 0.6,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
  },
  prompt: `You are an expert in emotional intelligence.
Analyse a player’s six scenario answers to generate EQ scores, assign a football position, and compare them to an active Premier League or Championship player.

**Step 1 — Score EQ traits (0–100):**
- Patience: waiting calmly for the right moment.
- Empathy: understanding others’ feelings.
- Resilience: recovering quickly from setbacks.
- Focus: maintaining concentration under pressure.
- Teamwork: collaborating toward team goals.
- Confidence: self-belief in high-stakes situations.
Use the full 0–100 range. Give low scores (0–10) for poor EQ and high scores (95–100) for excellent EQ. Scenarios 2, 4, and 6 should influence results more strongly.

**Step 2 — Assign a football position** using EQ patterns:
- High Resilience + Focus → GK or CB
- High Teamwork + Empathy → CM, DM, or AM
- High Patience + Focus → AM or deep-lying CM
- High Confidence + Focus → CF or WF
- Balanced profile → FB, WB, or WM

**Step 3 — Suggest a player comparison** with a current Premier League or Championship player known for similar traits.

**Player answers:**
Scenario 1 (Not starting): {{{scenario1}}}
Scenario 2 (One-on-one): {{{scenario2}}}
Scenario 3 (Teammate conflict): {{{scenario3}}}
Scenario 4 (Halftime talk): {{{scenario4}}}
Scenario 5 (Defender mistake): {{{scenario5}}}
Scenario 6 (Final shot decision): {{{scenario6}}}

**Output:**
Return only a JSON object with keys `eqScores`, `position`, and `playerComparison`. Do not include extra commentary.`,
});

const getPlayerReportFlow = ai.defineFlow(
  {
    name: 'getPlayerReportFlow',
    inputSchema: GetPlayerReportInputSchema,
    outputSchema: GetPlayerReportOutputSchema,
  },
  async (input) => {
    const approxBytes = Buffer.byteLength(JSON.stringify(input));
    console.log('[getPlayerReportFlow] START', { approxBytes, model: MODEL_ID });
    try {
      const result = await prompt(input);
      let out = (result as any)?.output as GetPlayerReportOutput | null | undefined;

      // If structured output is missing, try to recover from raw text
      if (!out) {
        const raw = ((result as any)?.text ?? (result as any)?.outputText ?? '').toString().trim();
        if (raw) {
          try {
            out = JSON.parse(raw) as GetPlayerReportOutput;
            console.warn('[getPlayerReportFlow] Recovered output from raw text JSON');
          } catch {
            console.warn('[getPlayerReportFlow] Raw text was not valid JSON');
          }
        }
      }

      // Defensive fallback to avoid crashing the UX
      if (!out) {
        console.warn('[getPlayerReportFlow] Using defensive fallback output');
        out = {
          eqScores: {
            patience: 50,
            empathy: 50,
            resilience: 50,
            focus: 50,
            teamwork: 50,
            confidence: 50,
          },
          position: 'CM',
          playerComparison: 'Luka Modrić',
        };
      }

      console.log('[getPlayerReportFlow] DONE');
      return out as GetPlayerReportOutput;
    } catch (e: any) {
      console.error('[getPlayerReportFlow] ERROR', {
        name: e?.name,
        message: e?.message,
        code: e?.code,
        status: e?.status,
      });
      throw e;
    }
  }
);
