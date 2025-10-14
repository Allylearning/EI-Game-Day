
'use client';

import { useRef, useTransition } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PlayerCard from './player-card';
import Leaderboard from './leaderboard';
import { Download, Share2, RefreshCw, Mail } from 'lucide-react';
import type { UserData, QuizResult } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Logo } from '@/components/icons';
import StatsRadarChart from './stats-radar-chart';
import { Card } from './ui/card';


type ResultsPageProps = {
  userData: UserData;
  quizResult: QuizResult;
  onRestart: () => void;
};

export default function ResultsPage({ userData, quizResult, onRestart }: ResultsPageProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isProcessing, startProcessingTransition] = useTransition();

  const generateCardImage = async (pixelRatio: number = 2): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    // This filter function helps html-to-image ignore external stylesheets
    const filter = (node: HTMLElement) => {
      if (node.tagName === 'LINK' && node.getAttribute('href')?.startsWith('https://fonts.googleapis.com')) {
        return false;
      }
      return true;
    };

    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio,
        filter: filter,
      });

      const blob = await (await fetch(dataUrl)).blob();
      return blob;
    } catch (err) {
      console.error('Failed to generate card image', err);
      // Fallback for when the above fails (e.g. CORS issues in some browsers)
      // This approach removes the font link temporarily.
      const fontLink = document.querySelector('link[href^="https://fonts.googleapis.com"]');
      if (fontLink) {
        fontLink.parentNode?.removeChild(fontLink);
      }
      try {
        const dataUrl = await toPng(cardRef.current, { 
          cacheBust: true, 
          pixelRatio,
        });
        if (fontLink) {
          document.head.appendChild(fontLink);
        }
        return await (await fetch(dataUrl)).blob();
      } catch (finalErr) {
        console.error('Final attempt to generate card image failed', finalErr);
        if (fontLink) {
            document.head.appendChild(fontLink);
        }
        return null;
      }
    }
  };


  const handleDownload = () => {
    startProcessingTransition(async () => {
      const blob = await generateCardImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fullName = `${userData.firstName} ${userData.lastName}`;
        link.download = `gameday-player-card-${fullName.toLowerCase().replace(/ /g, '-')}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast({
          title: 'Download Started',
          description: 'Your player card is being downloaded.',
        });
      } else {
        toast({
          title: 'Download Failed',
          description: 'Could not download the player card. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleShare = async () => {
     startProcessingTransition(async () => {
        const shareUrl = window.location.href;
        const shareText = `I just played Game Day! Think you can do better? Try it yourself:`;
        const fullMessage = `${shareText} ${shareUrl}`;

        const imageBlob = await generateCardImage(1);
        
        const fullName = `${userData.firstName} ${userData.lastName}`;

        if (imageBlob && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], 'card.png', { type: 'image/png' })] })) {
            const file = new File([imageBlob], `gameday-card-${fullName}.png`, { type: 'image/png' });
            try {
                await navigator.share({
                    title: 'My Game Day Results!',
                    text: shareText,
                    url: shareUrl,
                    files: [file],
                });
                toast({ title: 'Shared successfully!' });
            } catch (error) {
                 console.info('Share was cancelled or failed', error);
            }
        } else {
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
     });
  };


  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h2 className="font-headline text-3xl text-center font-extrabold">Your Game Day Report is Ready!</h2>
      
      <Tabs defaultValue="card" className="w-full flex flex-col items-center">
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="card">Player Card</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="card" className="w-full max-w-xl flex flex-col items-center mt-6 gap-6">
            <div className='w-full max-w-xs'>
              <PlayerCard ref={cardRef} userData={userData} quizResult={quizResult} />
            </div>
            
            <div className="h-80 w-full p-0">
                <StatsRadarChart scores={quizResult.eqScores} />
            </div>

        </TabsContent>
        <TabsContent value="leaderboard" className="w-full mt-6">
          <Leaderboard />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        <Button onClick={handleDownload} disabled={isProcessing} className="flex-1 font-extrabold">
          <Download className="mr-2 h-4 w-4" />
          {isProcessing ? 'Processing...' : 'Download Card'}
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 font-extrabold" disabled={isProcessing}>
          <Share2 className="mr-2 h-4 w-4" />
          {isProcessing ? 'Processing...' : 'Share Results'}
        </Button>
      </div>

       <Button onClick={onRestart} variant="ghost" className="mt-4 font-extrabold">
          <RefreshCw className="mr-2 h-4 w-4" />
          Play Again
        </Button>
        
        <div className="text-center mt-8 border-t border-border/50 pt-6 w-full max-w-lg flex flex-col items-center gap-4">
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
