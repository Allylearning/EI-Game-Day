
'use server';

import { ai } from '@/ai/genkit';
import { scenarios } from '@/lib/scenarios';
import { z } from 'zod';

const GradeAnswersInputSchema = z.object({
  answers: z.record(z.string()).describe('A dictionary of answers, with keys like "scenario1", "scenario2", etc.'),
});

const GradeAnswersOutputSchema = z.object({
  patience: z.number().min(0).max(100).describe('Score for Patience'),
  empathy: z.number().min(0).max(100).describe('Score for Empathy'),
  resilience: z.number().min(0).max(100).describe('Score for Resilience'),
  focus: z.number().min(0).max(100).describe('Score for Focus'),
  teamwork: z.number().min(0).max(100).describe('Score for Teamwork'),
  confidence: z.number().min(0).max(100).describe('Score for Confidence'),
});

export type GradeAnswersInput = z.infer<typeof GradeAnswersInputSchema>;
export type GradeAnswersOutput = z.infer<typeof GradeAnswersOutputSchema>;

export async function gradeAnswers(input: GradeAnswersInput): Promise<GradeAnswersOutput> {
  return gradeAnswersFlow(input);
}

const scenariosText = scenarios.map(s => `Scenario ${s.id} (${s.minute}' minute): ${s.text} - ${s.description}`).join('\n');

const prompt = ai.definePrompt({
  name: 'gradeAnswersPrompt',
  input: { schema: GradeAnswersInputSchema },
  output: { schema: GradeAnswersOutputSchema },
  prompt: `
    You are an expert sports psychologist assessing a player's emotional intelligence based on their responses to match-day scenarios.
    
    The player was presented with the following scenarios:
    ${scenariosText}

    Here are the player's answers:
    - Scenario 1: {{{answers.scenario1}}}
    - Scenario 2: {{{answers.scenario2}}}
    - Scenario 3: {{{answers.scenario3}}}
    - Scenario 4: {{{answers.scenario4}}}
    - Scenario 5: {{{answers.scenario5}}}
    - Scenario 6: {{{answers.scenario6}}}

    Based on these answers, you MUST critically evaluate the player on the following emotional intelligence attributes. Provide a score from 0 (very low) to 100 (elite).

    **CRITICAL SCORING INSTRUCTIONS:**
    You must be a tough and discerning judge. Do not give high scores for low-effort or poor-quality answers.
    Use the following rubric to determine scores. Think step-by-step and justify your scores internally before outputting the final JSON.

    - **0-20 (Poor):** The answer is irrelevant, nonsensical, one-word, "rubbish", or demonstrates the opposite of the desired trait (e.g., impatience, selfishness).
    - **21-40 (Developing):** The answer is very basic, shows minimal understanding, or is a generic response without specific detail.
    - **41-60 (Average):** The answer is reasonable but lacks depth or pro-active thinking. It addresses the scenario adequately but not impressively.
    - **61-80 (Good):** The answer demonstrates a solid understanding of the trait. It is thoughtful, constructive, and shows good self-awareness or team-awareness.
    - **81-100 (Elite):** The answer is exceptional. It not only addresses the situation well but also shows leadership, deep empathy, strategic thinking, or a pro-active approach to turning the situation into a positive.

    **ATTRIBUTES TO EVALUATE:**
    - **Patience:** Staying calm under pressure, not rushing decisions. (Relevant in scenarios 1, 3, 6)
    - **Empathy:** Understanding and considering teammates' feelings and positions. (Relevant in scenarios 3, 5, 6)
    - **Resilience:** Bouncing back from setbacks, maintaining a positive attitude. (Relevant in scenarios 1, 4)
    - **Focus:** Maintaining concentration despite distractions or pressure. (Relevant in scenarios 2, 3)
    - **Teamwork:** Prioritizing the team's success, communicating effectively. (Relevant in scenarios 3, 5, 6)
    - **Confidence:** Believing in one's own ability to succeed. (Relevant in scenarios 1, 2)

    Return ONLY the scores as a JSON object matching the required output schema. Do not include any other text or explanation in your response.
  `,
});

const gradeAnswersFlow = ai.defineFlow(
  {
    name: 'gradeAnswersFlow',
    inputSchema: GradeAnswersInputSchema,
    outputSchema: GradeAnswersOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
