'use server';

import { getPlayerReport, type GetPlayerReportInput } from '@/ai/flows/get-player-report';
import { transcribeAudio, type TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import type { MatchEvent, QuizResult, UserData } from './types';
import { addPlayerScore } from './db';
import { getOverallScore } from './helpers';

async function sendToCrmAction(data: { name: string; email: string; club?: string }) {
  (async () => {
    console.log('--- Starting CRM Submission ---');
    const { name, email, club } = data;
    const crmEndpoint = process.env.FORCE24_API_ENDPOINT;
    const crmApiKey = process.env.FORCE24_API_KEY;
    const crmApiSecret = process.env.FORCE24_API_SECRET;

    if (!crmEndpoint || !crmApiKey || !crmApiSecret) {
      console.error('CRM Configuration Error: One or more environment variables are missing.');
      console.log('FORCE24_API_ENDPOINT:', crmEndpoint ? 'Loaded' : 'Missing');
      console.log('FORCE24_API_KEY:', crmApiKey ? 'Loaded' : 'Missing');
      console.log('FORCE24_API_SECRET:', crmApiSecret ? 'Loaded' : 'Missing');
      console.log('Skipping CRM submission.');
      console.log('--- CRM Submission Ended ---');
      return;
    }

    const fullEndpointUrl = `${crmEndpoint}/contact`;

    const payload = {
      name,
      email,
      club: club || 'N/A',
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': crmApiKey,
      'X-Api-Secret': crmApiSecret,
    };

    console.log('Sending to Endpoint:', fullEndpointUrl);
    console.log('Request Headers:', {
      ...headers,
      'X-Api-Secret': '********',
    });
    console.log('Request Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(fullEndpointUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      console.log('CRM API Response Status:', response.status, response.statusText);
      const responseBody = await response.text();
      console.log('CRM API Raw Response Body:', responseBody);

      if (response.ok) {
        console.log('Successfully sent user data to CRM.');
      } else {
        console.error('Failed to send data to CRM. API responded with an error.');
      }
    } catch (error) {
      console.error('An unexpected error occurred while submitting data to CRM:', error);
    } finally {
      console.log('--- CRM Submission Ended ---');
    }
  })();
}

export async function gradeAllAnswersAction(
  {answers, events, userData}: {answers: Record<string, string>, events: MatchEvent[], userData: UserData}
): Promise<{ success: boolean; data: QuizResult; error?: string }> {
  try {
    // Fire off the CRM submission. Await it to ensure logs/errors appear before function completes.
    await sendToCrmAction({ name: userData.name, email: userData.email, club: userData.club });

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
