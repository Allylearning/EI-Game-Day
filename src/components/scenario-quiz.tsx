
'use client';

import { useState, useTransition, KeyboardEvent, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { scenarios } from '@/lib/scenarios';
import { gradeAllAnswersAction, transcribeAudioAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, Mic, Square, CheckCircle } from 'lucide-react';
import type { QuizResult, MatchEvent, UserData } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getFinalScore } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const formSchema = z.object({
  currentAnswer: z.string().min(1, 'Please describe your reaction.'),
});

type ScenarioQuizProps = {
  onQuizComplete: (result: QuizResult) => void;
  userData: UserData;
};

const CountdownTimer = ({ timeLeft, initialTime }: { timeLeft: number | null, initialTime: number | undefined }) => {
    if (timeLeft === null || !initialTime) return null;

    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const progress = (timeLeft / initialTime) * circumference;

    return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                    className="text-muted/20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    r={radius}
                    cx="24"
                    cy="24"
                />
                <circle
                    className="text-primary transition-all duration-1000 linear"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="24"
                    cy="24"
                />
            </svg>
            <span className="relative text-lg font-bold text-foreground">{timeLeft}</span>
        </div>
    );
};


export default function ScenarioQuiz({ onQuizComplete, userData }: ScenarioQuizProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [allAnswers, setAllAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  
  // Interaction state
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, startTranscribingTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

  const form = useForm<{ currentAnswer: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentAnswer: '' },
  });
  const { handleSubmit, reset, setValue } = form;
  const scenario = scenarios[currentScenario];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasSubmittedRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          audioChunksRef.current = [];
          startTranscribingTransition(async () => {
            const result = await transcribeAudioAction({ audio: base64Audio });
            if (result.success && result.text) {
              setValue('currentAnswer', result.text);
            } else {
              toast({ title: 'Transcription Failed', description: result.error, variant: 'destructive' });
            }
          });
        };
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Could not start recording", error);
      toast({ title: 'Recording Error', description: 'Could not access microphone.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  useEffect(() => {
    if (scenario.isMandatoryConcede) {
        const hasConceded = matchEvents.some(event => event.minute === scenario.minute && event.scoreChange < 0);
        if (!hasConceded) {
            setMatchEvents(prevEvents => [
                ...prevEvents,
                {
                    minute: scenario.minute,
                    outcome: 'The opposition scores just before the break, catching the defence off guard.',
                    scoreChange: -1
                }
            ]);
        }
    }
  }, [currentScenario, scenario, matchEvents]);


  useEffect(() => {
    if (scenario.timer) {
      setTimeLeft(scenario.timer);
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime === null) return null;
          if (prevTime <= 1) {
            stopTimer();
            setTimeout(() => {
                if (!hasSubmittedRef.current) {
                  let answer = "I hesitated and didn't make a decision in time.";
                   if (scenario.interaction === 'drag-and-drop') {
                        answer = droppedItems.length > 0 ? droppedItems.join('. ') : answer;
                    } else if (scenario.interaction === 'choice' && selectedChoice) {
                        answer = selectedChoice;
                    }
                  handleAnswerSubmit({ currentAnswer: answer });
                }
            }, 0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      stopTimer();
      setTimeLeft(null);
    }

    return () => stopTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScenario]);

  const getScoreChange = (minute: number, answer: string): number => {
    const lowerCaseAnswer = answer.toLowerCase();
    switch (minute) {
        case 30: // Teammate conflict
            return lowerCaseAnswer.includes('shout back') ? -1 : 0;
        case 60: // Defender mistake
            return lowerCaseAnswer.includes('sprint') || lowerCaseAnswer.includes('glare') ? -1 : 0;
        case 90+3: // Final shot
            return lowerCaseAnswer.includes('pass') || lowerCaseAnswer.includes('shot') ? 1 : 0;
        case 15: // One-on-one. A positive answer should result in a goal.
            const positiveKeywords = ['shoot', 'score', 'goal', 'place', 'slot', 'calmly', 'confident', 'finish', 'precision', 'corner', 'net', 'control', 'impact', 'change', 'pass', 'settle', 'compose', 'assist'];
            return positiveKeywords.some(kw => lowerCaseAnswer.includes(kw)) ? 1 : 0;
        default:
            return 0;
    }
  };


  const handleAnswerSubmit = async (values: { currentAnswer: string }) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    stopTimer(); 
    const currentAnswer = values.currentAnswer;
    if (!currentAnswer || currentAnswer.trim() === '') {
        toast({
            title: 'No answer provided',
            description: 'Please provide an answer before submitting.',
            variant: 'destructive',
        });
        hasSubmittedRef.current = false;
        return;
    }
    
    const scenario = scenarios[currentScenario];
    const scenarioKey = `scenario${scenario.id}`;
    const updatedAnswers = { ...allAnswers, [scenarioKey]: currentAnswer };
    setAllAnswers(updatedAnswers);
    
    const scoreChange = getScoreChange(scenario.minute, currentAnswer);
    const newEvent: MatchEvent = {
        minute: scenario.minute,
        outcome: `Action at minute ${scenario.minute}.`, // Placeholder outcome
        scoreChange: scoreChange,
    };
    setMatchEvents(prevEvents => [...prevEvents, newEvent]);

    const commentary = scenario.commentary || (scenario.interaction === 'choice' && scenario.options?.find(opt => opt.value === currentAnswer)?.commentary);
    
    if (commentary) {
      setShowFeedback(commentary);
    } else {
      proceedToNextStep(updatedAnswers);
    }
  };

  const proceedToNextStep = (finalAnswers?: Record<string, string>) => {
     setShowFeedback(null);
     setDroppedItems([]);
     setSelectedChoice(null);
     hasSubmittedRef.current = false;
     
     const answersToSubmit = finalAnswers || allAnswers;

    if (currentScenario === scenarios.length - 1) {
      startSubmittingTransition(async () => {
          const result = await gradeAllAnswersAction({answers: answersToSubmit, events: matchEvents, userData});
          
          onQuizComplete(result.data);

          if (!result.success && result.error) {
            toast({
              title: 'AI Report Failed',
              description: result.error,
              variant: 'destructive',
            });
          }
        });
    } else {
      setCurrentScenario(currentScenario + 1);
      reset({ currentAnswer: '' });
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(handleAnswerSubmit)();
    }
  };
  
  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData("text/plain", item);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    if (item && droppedItems.length < 2 && !droppedItems.includes(item)) {
        setDroppedItems([...droppedItems, item]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };


  const progress = ((currentScenario + 1) / scenarios.length) * 100;
  const currentMinute = scenario.minute;

  const score = getFinalScore(matchEvents);
  
  const isLoading = isSubmitting || isTranscribing;

  const handleChoiceClick = (value: string) => {
    setSelectedChoice(value);
  }

  const handleGeneralSubmit = () => {
    let answer = '';
    if (scenario.interaction === 'drag-and-drop') {
      if (droppedItems.length !== 2) {
          toast({ title: 'Selection Incomplete', description: 'Please drag two thoughts into the box.', variant: 'destructive' });
          return;
      }
      answer = droppedItems.join('. ');
    } else if (scenario.interaction === 'choice') {
      if (!selectedChoice) {
          toast({ title: 'No Choice Made', description: 'Please select an option.', variant: 'destructive' });
          return;
      }
      answer = selectedChoice;
    }
    
    handleAnswerSubmit({ currentAnswer: answer });
  };


  return (
    <div className="flex flex-col gap-6 w-full">
       <div className="flex items-center gap-4 w-full">
        <Avatar className="h-10 w-10 border-2 border-primary/50">
            <AvatarImage 
              src={userData.selfie} 
              alt={userData.name} 
              style={{ 
                objectFit: 'cover',
                objectPosition: `${userData.selfiePosition.x}% ${userData.selfiePosition.y}%` 
              }} 
            />
            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <Progress value={progress} className="w-full" />
      </div>

      <div className="text-center">
         <div className="flex items-center justify-between text-lg font-headline mb-4">
             <div className="flex items-center gap-2">
                 <Badge variant="secondary" className="font-extrabold">YOU</Badge>
                 <span className='text-2xl text-primary font-extrabold'>{score.goalsFor}</span>
             </div>
             <div className='flex flex-col items-center justify-center min-h-[50px]'>
                <div className="flex items-center gap-2 font-headline text-primary">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-extrabold">{currentMinute}'</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                 <span className='text-2xl text-muted-foreground font-extrabold'>{score.goalsAgainst}</span>
                 <Badge variant="outline" className="font-extrabold">OPP</Badge>
             </div>
         </div>
        <h2 className="text-xl font-semibold mt-2">{scenario.text}</h2>
        {scenario.description && <p className="text-muted-foreground mt-1">{scenario.description}</p>}
      </div>
      
        {showFeedback ? (
          <div className="flex flex-col gap-4 items-center">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-extrabold">Commentator's Verdict</AlertTitle>
              <AlertDescription>
                {showFeedback}
              </AlertDescription>
            </Alert>
            <Button onClick={() => proceedToNextStep()} className="font-extrabold">
              {currentScenario === scenarios.length - 1 ? 'Finish & See Results' : 'Continue'}
            </Button>
          </div>
        ) : (
        <>
          {scenario.interaction === 'drag-and-drop' && scenario.options && (
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scenario.options
                        .filter(opt => !droppedItems.includes(opt.value))
                        .map(option => (
                        <div
                            key={option.value}
                            draggable
                            onDragStart={(e) => handleDragStart(e, option.value)}
                            className="p-3 bg-muted rounded-md cursor-grab active:cursor-grabbing"
                        >
                            {option.text}
                        </div>
                    ))}
                </div>
                <div 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="mt-4 p-4 min-h-[120px] border-2 border-dashed border-primary/50 rounded-md flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                    {droppedItems.length > 0 ? (
                        droppedItems.map(item => {
                            const optionText = scenario.options?.find(opt => opt.value === item)?.text || item;
                            return <Badge key={item} variant="secondary" className="text-base py-1 px-3 font-extrabold">{optionText}</Badge>
                        })
                    ) : (
                        <p>Drop two thoughts here</p>
                    )}
                     {droppedItems.length > 0 && droppedItems.length < 2 && (
                         <p className='text-sm'>Drop one more thought</p>
                     )}
                </div>
            </div>
          )}
        
          {scenario.interaction === 'text' && (
            <Form {...form}>
              <form className="space-y-6" onSubmit={handleSubmit(handleAnswerSubmit)}>
              <FormField
                  control={form.control}
                  name={`currentAnswer`}
                  render={({ field }) => (
                  <FormItem>
                      <FormControl>
                      <Textarea
                          placeholder="Describe your reaction..."
                          className="min-h-[150px] resize-none"
                          {...field}
                          onKeyDown={handleKeyDown}
                          disabled={isLoading}
                      />
                      </FormControl>
                  </FormItem>
                  )}
              />
              <div className="flex justify-between items-center gap-4">
                  <Button type="button" variant="outline" onClick={handleAudioButtonClick} disabled={isLoading} className="font-extrabold">
                     {isRecording ? <Square className="mr-2 text-red-500 fill-current" /> : <Mic className="mr-2" />}
                     {isRecording ? 'Stop' : isTranscribing ? 'Transcribing...' : 'Record'}
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-extrabold">
                  {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                  ) : currentScenario === scenarios.length - 1 ? 'Finish & See Results' : 'Submit'}
                  </Button>
              </div>
              </form>
            </Form>
          )}

          {timeLeft !== null && (
            <div className="flex justify-center my-4">
                <CountdownTimer timeLeft={timeLeft} initialTime={scenario.timer} />
            </div>
          )}

          {scenario.interaction === 'choice' && scenario.options && (
            <div className="flex flex-col gap-4">
              {scenario.options.map(option => (
                <Button 
                  key={option.value}
                  onClick={() => handleChoiceClick(option.value)}
                  disabled={isLoading}
                  size="lg"
                  variant={selectedChoice === option.value ? "default" : "outline"}
                  className='justify-start h-auto py-3 font-extrabold'
                >
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.text}
                </Button>
              ))}
            </div>
          )}

          {(scenario.interaction === 'choice' || scenario.interaction === 'drag-and-drop') && (
             <div className="flex justify-end items-center gap-4 mt-4">
                  <Button 
                    onClick={handleGeneralSubmit} 
                    disabled={isLoading} 
                    className="font-extrabold"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : currentScenario === scenarios.length - 1 ? 'Finish & See Results' : 'Submit'}
                </Button>
              </div>
          )}
        </>
        )}
    </div>
  );
}
