
'use server';

import { getPlayerReport, type GetPlayerReportInput } from '@/ai/flows/get-player-report';
import { transcribeAudio, type TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import type { MatchEvent, QuizResult, UserData } from './types';
import { addPlayerScore } from './db';
import { getOverallScore } from './helpers';

async function sendToCrmAction(data: { firstName: string; lastName: string; email: string; club: string }) {
  console.log('--- Starting Zapier Webhook Submission ---');
  
  const { firstName, lastName, email, club } = data;
  const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  if (!zapierWebhookUrl) {
    console.error('Zapier Webhook URL is not configured in .env file.');
    console.log('--- Zapier Webhook Submission Ended ---');
    return;
  }

  const payload = {
    firstName,
    lastName,
    email,
    club: club || 'N/A',
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  console.log('Sending to Zapier Webhook:', zapierWebhookUrl);
  console.log('Request Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    console.log('Zapier Webhook Response Status:', response.status, response.statusText);
    const responseBody = await response.json();
    console.log('Zapier Webhook Response Body:', responseBody);

    if (response.ok) {
        console.log('Successfully sent user data to Zapier.');
    } else {
        console.error('Failed to send data to Zapier. Webhook responded with an error.');
    }
  } catch (error) {
    console.error('An unexpected error occurred while submitting data to Zapier:', error);
  } finally {
    console.log('--- Zapier Webhook Submission Ended ---');
  }
}

export async function gradeAllAnswersAction(
  {answers, events, userData}: {answers: Record<string, string>, events: MatchEvent[], userData: UserData}
): Promise<{ success: boolean; data: QuizResult; error?: string }> {
  try {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    
    // Fire off the CRM submission. We don't wait for it to complete
    // so it doesn't slow down the user experience.
    sendToCrmAction({ 
      firstName: userData.firstName, 
      lastName: userData.lastName, 
      email: userData.email, 
      club: userData.club 
    });

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
