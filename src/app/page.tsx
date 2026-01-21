
'use client';

import { useState } from 'react';
import type { UserData, QuizResult } from '@/lib/types';
import PreMatchForm from '@/components/pre-match-form';
import ScenarioQuiz from '@/components/scenario-quiz';
import ResultsPage from '@/components/results-page';
import { Card, CardContent } from '@/components/ui/card';
import { useConfetti } from '@/hooks/use-confetti';
import { sendToCrmAction } from '@/lib/actions';

type Step = 'form' | 'quiz' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('form');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const { showConfetti } = useConfetti();

  const handleFormSubmit = async (data: UserData) => {
    setUserData(data);
    setStep('quiz');

    // Trigger CRM webhook immediately
    console.log("Submitting user data to CRM...", data);
    try {
      await sendToCrmAction({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        club: data.club,
      });
    } catch (error) {
      console.error("Failed to submit to CRM in background", error);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setStep('results');

    // Show confetti for everyone on completion.
    // Add a small timeout to ensure the confetti component has time to mount.
    setTimeout(() => showConfetti(true), 100);

    // Send completion message to parent window if embedded
    if (window.parent && window.parent !== window) {
      window.parent.postMessage('complete', '*');
    }
  };

  const handleRestart = () => {
    setStep('form');
    setUserData(null);
    setQuizResult(null);
    showConfetti(false); // Make sure to hide confetti on restart
  };

  const handleSkip = () => {
    const dummyUserData: UserData = {
      firstName: 'Dev',
      lastName: 'Tester',
      email: 'dev@test.com',
      club: 'Debug FC',
      selfie: '/img/Placeholder.png',
      selfiePosition: { x: 50, y: 50 },
      leaderboardOptIn: true,
    };
    const dummyQuizResult: QuizResult = {
      eqScores: {
        patience: 88,
        empathy: 75,
        resilience: 92,
        focus: 95,
        teamwork: 85,
        confidence: 90,
      },
      matchEvents: [
        { minute: 15, outcome: 'Goal!', scoreChange: 1 },
        { minute: 45, outcome: 'Opponent scored.', scoreChange: -1 },
        { minute: 90, outcome: 'Winning Goal!', scoreChange: 1 },
      ],
    };
    setUserData(dummyUserData);
    handleQuizComplete(dummyQuizResult);
  };


  const renderStep = () => {
    switch (step) {
      case 'form':
        return <PreMatchForm onSubmit={handleFormSubmit} onSkip={handleSkip} />;
      case 'quiz':
        // We know userData is not null here because of the flow
        return <ScenarioQuiz userData={userData!} onQuizComplete={handleQuizComplete} />;
      case 'results':
        if (userData && quizResult) {
          return <ResultsPage userData={userData} quizResult={quizResult} onRestart={handleRestart} />;
        }
        // Fallback to form if data is missing
        handleRestart();
        return null;
      default:
        return <PreMatchForm onSubmit={handleFormSubmit} />;
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-black/60 z-10" />
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="https://me-learning.s3.eu-west-2.amazonaws.com/marketing-videos/EI/football.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="w-full max-w-2xl z-20">
        <Card className="relative bg-card/75 backdrop-blur-md border border-primary/20 shadow-2xl shadow-black/50">
          <CardContent className="p-4 sm:p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
