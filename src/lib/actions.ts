'use server';

import { getPlayerReport, type GetPlayerReportInput } from '@/ai/flows/get-player-report';
import { getScenarioFeedback, type GetScenarioFeedbackInput } from '@/ai/flows/get-scenario-feedback';
import { transcribeAudio, type TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import type { MatchEvent, QuizResult, UserData } from './types';
import { addPlayerScore } from './db';
import { getOverallScore } from './helpers';


export async function gradeAllAnswersAction(
  {answers, events, userData}: {answers: Record<string, string>, events: MatchEvent[], userData: UserData}
): Promise<{ success: boolean; data: QuizResult; error?: string }> {
  try {
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
        name: userData.name,
        club: userData.club,
        score: overallScore,
        selfie: userData.selfie,
      });
    }

    const finalData: QuizResult = {
      eqScores: playerReport.eqScores,
      matchEvents: events,
      position: playerReport.position,
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

export async function getScenarioFeedbackAction(
  input: GetScenarioFeedbackInput
): Promise<{ success: boolean; commentary?: string; error?: string }> {
  try {
    const result = await getScenarioFeedback(input);
    return { success: true, commentary: result.commentary };
  } catch (error) {
    console.error('Error getting scenario feedback:', error);
    return { success: false, error: 'Failed to get AI feedback.' };
  }
}
