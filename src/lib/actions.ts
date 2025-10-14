
'use server';

import type { EqScores, MatchEvent, QuizResult, UserData } from './types';
import { addPlayerScore } from './db';
import { getOverallScore } from './helpers';
import { gradeAnswers } from '@/ai/flows/grade-answers-flow';

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
    
    // Don't try to parse JSON if the response is not ok, as it might not be JSON.
    if (response.ok) {
        const responseBody = await response.json();
        console.log('Zapier Webhook Response Body:', responseBody);
        console.log('Successfully sent user data to Zapier.');
    } else {
        const responseText = await response.text();
        console.error('Failed to send data to Zapier. Webhook responded with an error.', responseText);
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
    
    sendToCrmAction({ 
      firstName: userData.firstName, 
      lastName: userData.lastName, 
      email: userData.email, 
      club: userData.club 
    });

    let eqScores: EqScores;

    try {
      eqScores = await gradeAnswers({ answers });
    } catch (aiError) {
      console.error('AI grading failed, using fallback.', aiError);
      eqScores = {
        patience: Math.floor(Math.random() * 50) + 50,
        empathy: Math.floor(Math.random() * 50) + 50,
        resilience: Math.floor(Math.random() * 50) + 50,
        focus: Math.floor(Math.random() * 50) + 50,
        teamwork: Math.floor(Math.random() * 50) + 50,
        confidence: Math.floor(Math.random() * 50) + 50,
      };
    }

    const quizResult: QuizResult = {
      eqScores,
      matchEvents: events,
    };

    const overallScore = getOverallScore(quizResult.eqScores);

    if (userData.leaderboardOptIn) {
      await addPlayerScore({
        name: fullName,
        club: userData.club,
        score: overallScore,
        selfie: userData.selfie,
      });
    }

    return { success: true, data: quizResult };
  } catch (error) {
    console.error('Error in gradeAllAnswersAction:', error);
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
        isFallback: true, 
    };
    return { success: false, data: fallbackData, error: 'An unexpected error occurred.' };
  }
}
