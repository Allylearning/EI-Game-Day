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
  config: {
    temperature: 0.2,
    maxOutputTokens: 512,
    responseMimeType: 'application/json',
  },
  prompt: `You are an expert in emotional intelligence.
Analyse a player’s six scenario answers to generate EQ scores, assign a football position, and compare them to an active Premier League or Championship player.

Score six EQ traits from 0–100 using the full range (poor answers can be 0–10; excellent 95–100). Weight scenarios 2, 4, and 6 more strongly.

Mapping hints:
- High Resilience + Focus → GK or CB
- High Teamwork + Empathy → CM, DM, or AM
- High Patience + Focus → AM or deep-lying CM
- High Confidence + Focus → CF or WF
- Balanced profile → FB, WB, or WM

Player answers:
Scenario 1 (Not starting): {{{scenario1}}}
Scenario 2 (One-on-one): {{{scenario2}}}
Scenario 3 (Teammate conflict): {{{scenario3}}}
Scenario 4 (Halftime talk): {{{scenario4}}}
Scenario 5 (Defender mistake): {{{scenario5}}}
Scenario 6 (Final shot decision): {{{scenario6}}}

Output: Return **only** JSON in exactly this shape (no extra text, no markdown):
{
  "eqScores": {
    "patience": 0,
    "empathy": 0,
    "resilience": 0,
    "focus": 0,
    "teamwork": 0,
    "confidence": 0
  },
  "position": "CM",
  "playerComparison": "Player Name"
}`,
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

      // Additional recovery: try to read text from candidates[].content.parts[].text
      if (!out) {
        try {
          const parts = (((result as any)?.candidates?.[0]?.content?.parts) || []) as any[];
          const joined = parts.map((p) => (p?.text ?? '')).join('').trim();
          if (joined) {
            try {
              out = JSON.parse(joined) as GetPlayerReportOutput;
              console.warn('[getPlayerReportFlow] Recovered output from candidates parts JSON');
            } catch {}
          }
        } catch {}
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
