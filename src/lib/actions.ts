'use server';

import { getPlayerReport, type GetPlayerReportInput } from '@/ai/flows/get-player-report';
import { getScenarioFeedback, type GetScenarioFeedbackInput } from '@/ai/flows/get-scenario-feedback';
import { transcribeAudio, type TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import type { MatchEvent, QuizResult, UserData } from './types';
import { addPlayerScore } from './db';
import { getOverallScore } from './helpers';

async function sendToCrmAction(data: { name: string; email: string; club?: string }) {
  const { name, email, club } = data;
  const crmEndpoint = process.env.FORCE24_API_ENDPOINT;
  const crmApiKey = process.env.FORCE24_API_KEY;
  const crmMarketingListId = process.env.FORCE24_MARKETING_LIST_ID;

  if (!crmEndpoint || !crmApiKey || !crmMarketingListId) {
    console.log('CRM credentials or Marketing List ID not found. Skipping CRM submission.');
    return; // Don't throw an error, just skip if not configured
  }

  try {
    const response = await fetch(crmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crmApiKey}`, // Assuming Bearer token auth
      },
      body: JSON.stringify({
        name,
        email,
        club: club || 'N/A',
        marketingListId: crmMarketingListId,
      }),
    });

    if (!response.ok) {
      // Log the error but don't let it crash the main application flow
      console.error('Failed to send data to CRM:', response.statusText);
      const errorBody = await response.text();
      console.error('CRM Error Body:', errorBody);
    } else {
      console.log('Successfully sent user data to CRM.');
    }
  } catch (error) {
    console.error('Error submitting data to CRM:', error);
  }
}

export async function gradeAllAnswersAction(
  {answers, events, userData}: {answers: Record<string, string>, events: MatchEvent[], userData: UserData}
): Promise<{ success: boolean; data: QuizResult; error?: string }> {
  try {
    // Fire off the CRM submission. We don't wait for it to complete
    // so it doesn't slow down the user experience.
    sendToCrmAction({ name: userData.name, email: userData.email, club: userData.club });

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
        email: userData.email,
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
