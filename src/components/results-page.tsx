
'use client';

import { useRef, useTransition } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PlayerCard from './player-card';
import Leaderboard from './leaderboard';
import { Download, Share2, RefreshCw, Mail, AlertTriangle } from 'lucide-react';
import type { UserData, QuizResult } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getHighestStat, getFinalScore, getOverallScore } from '@/lib/helpers';
import { statIcons, Logo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ResultsPageProps = {
  userData: UserData;
  quizResult: QuizResult;
  onRestart: () => void;
};

export default function ResultsPage({ userData, quizResult, onRestart }: ResultsPageProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDownloading, startDownloadTransition] = useTransition();

  const { eqScores, matchEvents, isFallback, playerComparison } = quizResult;
  const highestStat = getHighestStat(eqScores);
  const HighestStatIcon = statIcons[highestStat];

  const handleDownload = () => {
    if (!cardRef.current) return;
    startDownloadTransition(async () => {
      try {
        const dataUrl = await toPng(cardRef.current!, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `gameday-player-card-${userData.name.toLowerCase().replace(/ /g, '-')}.png`;
        link.href = dataUrl;
        link.click();
        toast({
          title: 'Download Started',
          description: 'Your player card is being downloaded.',
        });
      } catch (err) {
        toast({
          title: 'Download Failed',
          description: 'Could not download the player card. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleShare = async () => {
    const overallScore = getOverallScore(eqScores);
    const finalScore = getFinalScore(matchEvents);
    const shareUrl = window.location.href;
    const shareText = `I just scored ${overallScore}) on Game Day! My player comparison is ${playerComparison}. Think you can do better? Try it yourself:`;
    const fullMessage = `${shareText} ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Game Day Results!',
          text: shareText,
          url: shareUrl,
        });
        toast({
          title: 'Shared successfully!',
        });
      } catch (error) {
        // This can happen if the user cancels the share dialog, so we don't show an error.
        console.info('Share was cancelled or failed', error);
      }
    } else {
      // Fallback for browsers that do not support the Web Share API (e.g., desktop)
      try {
        await navigator.clipboard.writeText(fullMessage);
        toast({
          title: 'Link Copied!',
          description: 'Your results message has been copied to the clipboard.',
        });
      } catch (err) {
        toast({
          title: 'Copy Failed',
          description: 'Could not copy the results to your clipboard.',
          variant: 'destructive',
        });
      }
    }
  };


  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h2 className="font-headline text-3xl text-center font-extrabold">Your Game Day Report is Ready!</h2>
      
      {isFallback && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-extrabold">AI Analysis Failed</AlertTitle>
          <AlertDescription>
            We couldn't generate the AI-powered EQ scores and player position for you this time. Your match result is shown below. Please try again later!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="card" className="w-full flex flex-col items-center">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="card">Player Card</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="card" className="w-full max-w-md flex flex-col items-center mt-6 gap-6">
            <PlayerCard ref={cardRef} userData={userData} quizResult={quizResult} />
            {!isFallback && (
              <Alert>
                  <HighestStatIcon className="h-4 w-4" />
                  <AlertTitle className="font-extrabold">Player Comparison: {playerComparison}</AlertTitle>
                  <AlertDescription>
                      You were compared to {playerComparison} because your highest EQ score was in <span className="font-bold capitalize">{highestStat}</span>, a key trait for this player.
                  </AlertDescription>
              </Alert>
            )}
        </TabsContent>
        <TabsContent value="leaderboard" className="w-full mt-6">
          <Leaderboard />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button onClick={handleDownload} disabled={isDownloading} className="flex-1 font-extrabold">
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Downloading...' : 'Download Card'}
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 font-extrabold">
          <Share2 className="mr-2 h-4 w-4" />
          Share Results
        </Button>
      </div>
       <Button onClick={onRestart} variant="ghost" className="mt-4 font-extrabold">
          <RefreshCw className="mr-2 h-4 w-4" />
          Play Again
        </Button>
        
        <div className="text-center mt-8 border-t border-border/50 pt-6 w-full max-w-md flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground my-4">For more on emotional intelligence, get in touch with us today.</p>
            <a href="mailto:enquiries@melearning.co.uk">
                <Button className="font-extrabold">
                    <Mail className="mr-2 h-4 w-4" />
                    Get in Touch
                </Button>
            </a>
        </div>
    </div>
  );
}
