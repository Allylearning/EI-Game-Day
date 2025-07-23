
'use client';

import { useState } from 'react';
import type { UserData, QuizResult } from '@/lib/types';
import PreMatchForm from '@/components/pre-match-form';
import ScenarioQuiz from '@/components/scenario-quiz';
import ResultsPage from '@/components/results-page';
import { Card, CardContent } from '@/components/ui/card';
import { useConfetti } from '@/hooks/use-confetti';

type Step = 'form' | 'quiz' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('form');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const { showConfetti } = useConfetti();

  const handleFormSubmit = (data: UserData) => {
    setUserData(data);
    setStep('quiz');
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

  const renderStep = () => {
    switch (step) {
      case 'form':
        return <PreMatchForm onSubmit={handleFormSubmit} />;
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
