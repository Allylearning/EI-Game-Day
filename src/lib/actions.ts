'use server';

import { getPlayerReport, type GetPlayerReportInput } from '@/ai/flows/get-player-report';
import { transcribeAudio, type TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import type { MatchEvent, QuizResult, UserData } from './types';
import { addPlayerScore } from './db';
import { getOverallScore } from './helpers';

export async function gradeAllAnswersAction(
  {answers, events, userData}: {answers: Record<string, string>, events: MatchEvent[], userData: UserData}
): Promise<{ success: boolean; data: QuizResult; error?: string }> {
  try {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    

    // --- n8n Integration Placeholder ---
    // In the future, trigger an n8n webhook here to send user data for further automation.
    // Example:
    //   await fetch('https://your-n8n-instance.com/webhook/your-webhook-id', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       firstName: userData.firstName,
    //       lastName: userData.lastName,
    //       email: userData.email,
    //       club: userData.club
    //     }),
    //   });
    // Note: This section is commented out as a placeholder for future n8n integration.

    const reportInput: GetPlayerReportInput = {
      scenario1: answers['scenario1'] || 'No answer provided.',
      scenario2: answers['scenario2'] || 'No answer provided.',
      scenario3: answers['scenario3'] || 'No answer provided.',
      scenario4: answers['scenario4'] || 'No answer provided.',
      scenario5: answers['scenario5'] || 'No answer provided.',
      scenario6: answers['scenario6'] || 'No answer provided.',
    };

    const playerReport = await getPlayerReport(reportInput);
    
    const overallScore = getOverallScore(playerReport.eqScores);

    if (userData.leaderboardOptIn) {
      await addPlayerScore({
        name: fullName,
        club: userData.club,
        score: overallScore,
        selfie: userData.selfie,
      });
    }

    const finalData: QuizResult = {
      eqScores: playerReport.eqScores,
      matchEvents: events,
      position: playerReport.position,
      playerComparison: playerReport.playerComparison,
    };

    return { success: true, data: finalData };
  } catch (error) {
    console.error('Error grading all answers:', error);
    // Create a fallback result object if the AI call fails
    const fallbackData: QuizResult = {
        eqScores: {
            patience: 50,
            empathy: 50,
            resilience: 50,
            focus: 50,
            teamwork: 50,
            confidence: 50,
        },
        matchEvents: events,
        position: 'CM',
        playerComparison: 'Luka Modric', // A safe, well-rounded fallback
        isFallback: true, // Add a flag to indicate this is fallback data
    };
    return { success: false, data: fallbackData, error: 'Failed to get AI-powered report. Displaying match result only.' };
  }
}

export async function transcribeAudioAction(
  { audio }: TranscribeAudioInput
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const result = await transcribeAudio({ audio });
    return { success: true, text: result.text };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return { success: false, error: 'Failed to transcribe audio. Please try again.' };
  }
}
