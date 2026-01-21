
'use server';

import type { EqScores, MatchEvent, QuizResult, UserData } from './types';
import { addPlayerScore } from './db';
import { getOverallScore } from './helpers';
import { gradeAnswers } from '@/ai/flows/grade-answers-flow';

export async function sendToCrmAction(data: { firstName: string; lastName: string; email: string; club: string }) {
  console.log('--- Starting n8n Webhook Submission ---');

  const { firstName, lastName, email, club } = data;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    console.error('N8N Webhook URL is not configured in .env file.');
    console.log('--- n8n Webhook Submission Ended ---');
    return;
  }

  // Construct payload to match the n8n workflow expectations (which expects 'name', 'email', 'organization', etc.)
  // We use GET params because the n8n webhook is configured for GET requests.
  const params = new URLSearchParams({
    name: `${firstName} ${lastName}`,
    email: email,
    organization: club || 'N/A',
    job_title: '', // Left blank as it's not captured in the form
  });

  const urlWithParams = `${n8nWebhookUrl}?${params.toString()}`;

  console.log('Sending to n8n Webhook:', urlWithParams);

  try {
    const response = await fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('n8n Webhook Response Status:', response.status, response.statusText);

    if (response.ok) {
      const responseBody = await response.json();
      console.log('n8n Webhook Response Body:', responseBody);
      console.log('Successfully sent user data to n8n.');
    } else {
      const responseText = await response.text();
      console.error('Failed to send data to n8n. Webhook responded with an error.', responseText);
    }
  } catch (error) {
    console.error('An unexpected error occurred while submitting data to n8n:', error);
  } finally {
    console.log('--- n8n Webhook Submission Ended ---');
  }
}

export async function gradeAllAnswersAction(
  { answers, events, userData }: { answers: Record<string, string>, events: MatchEvent[], userData: UserData }
): Promise<{ success: boolean; data: QuizResult; error?: string }> {
  try {
    const fullName = `${userData.firstName} ${userData.lastName}`;

    // CRM submission moved to start of game

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
