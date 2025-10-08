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
  input: { schema: GetPlayerReportInputSchema },
  config: {
    temperature: 0.2,
    maxOutputTokens: 1024,
  },
  prompt: `You are an expert in emotional intelligence.
Analyse a player’s six scenario answers to produce EQ scores, a football position, and a player comparison. Output must be **only** JSON.

Scoring (0–100): patience, empathy, resilience, focus, teamwork, confidence. Use full range. Bad = 0–10, excellent = 95–100. Weight scenarios 2, 4, 6 more.

Mapping hints:
- High Resilience + Focus → GK/CB
- High Teamwork + Empathy → CM/DM/AM
- High Patience + Focus → AM or deep-lying CM
- High Confidence + Focus → CF/WF
- Balanced → FB/WB/WM

Player answers:
Scenario 1: {{{scenario1}}}
Scenario 2: {{{scenario2}}}
Scenario 3: {{{scenario3}}}
Scenario 4: {{{scenario4}}}
Scenario 5: {{{scenario5}}}
Scenario 6: {{{scenario6}}}

Example output (follow this shape exactly):
{
  "eqScores": {
    "patience": 72,
    "empathy": 64,
    "resilience": 83,
    "focus": 78,
    "teamwork": 70,
    "confidence": 76
  },
  "position": "CM",
  "playerComparison": "Declan Rice"
}

Return only a valid JSON object in the exact shape shown above. Do not include any extra text, explanations, or markdown.
Only return valid JSON and nothing else.`,
});

const getPlayerReportFlow = ai.defineFlow(
  {
    name: 'getPlayerReportFlow',
    inputSchema: GetPlayerReportInputSchema,
    outputSchema: GetPlayerReportOutputSchema,
  },
  async (input) => {
    const approxBytes = Buffer.byteLength(JSON.stringify(input));
    console.log('[getPlayerReportFlow] START', { approxBytes, model: 'default(genkit)' });
    try {
      const maxAttempts = 5;
      let out: GetPlayerReportOutput | null = null;
      let lastErr: any = null;

      for (let attempt = 1; attempt <= maxAttempts && !out; attempt++) {
        const result = await prompt(input);
        const dbg = {
          hasOutput: Boolean((result as any)?.output),
          hasText: Boolean((result as any)?.text),
          hasCandidates: Array.isArray((result as any)?.candidates),
        };
        console.log(`[getPlayerReportFlow] attempt ${attempt} result flags`, dbg);

        const preview = (((result as any)?.text ?? (result as any)?.outputText ?? '') as string).slice(0, 200);
        if (preview) console.log('[getPlayerReportFlow] text preview:', preview);

        // 1) Structured output path
        out = (result as any)?.output as GetPlayerReportOutput | null | undefined || null;

        // 2) Plain text fields
        if (!out) {
          const raw = ((result as any)?.text ?? (result as any)?.outputText ?? '').toString().trim();
          if (raw) {
            try {
              out = JSON.parse(raw) as GetPlayerReportOutput;
              console.warn('[getPlayerReportFlow] Recovered output from raw text JSON');
            } catch (e) {
              lastErr = e;
            }
          }
        }

        // 3) Candidates parts (common Gemini shape)
        if (!out) {
          try {
            const parts = (((result as any)?.candidates?.[0]?.content?.parts) || []) as any[];
            const joined = parts.map((p) => (p?.text ?? '')).join('').trim();
            if (joined) {
              try {
                out = JSON.parse(joined) as GetPlayerReportOutput;
                console.warn('[getPlayerReportFlow] Recovered output from candidates parts JSON');
              } catch (e) {
                lastErr = e;
              }
            }
          } catch (e) {
            lastErr = e;
          }
        }

        // 4) Validate against Zod; if invalid, clear out to trigger retry/fallback
        if (out) {
          const validated = GetPlayerReportOutputSchema.safeParse(out);
          if (!validated.success) {
            console.warn('[getPlayerReportFlow] Parsed output failed schema validation on attempt', attempt);
            out = null;
          } else {
            out = validated.data;
          }
        }

        // Backoff before next attempt if still no output
        if (!out && attempt < maxAttempts) {
          const delayMs = 600 * attempt; // simple linear backoff
          await new Promise((r) => setTimeout(r, delayMs));
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
