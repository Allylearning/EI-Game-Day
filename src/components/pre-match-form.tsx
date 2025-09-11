
'use client';

import { useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { UserData } from '@/lib/types';
import Image from 'next/image';
import { User, Plus } from 'lucide-react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Leaderboard from './leaderboard';


const formSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  club: z.string().min(1, { message: 'Organisation is required.' }),
  leaderboardOptIn: z.boolean().default(false),
});

type PreMatchFormProps = {
  onSubmit: (data: UserData) => void;
};

export default function PreMatchForm({ onSubmit }: PreMatchFormProps) {
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfiePosition, setSelfiePosition] = useState({ x: 50, y: 50 });
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: '', lastName: '', email: '', club: '', leaderboardOptIn: false },
  });

  const handleSelfieUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: 'Image too large',
          description: 'Please select an image smaller than 4MB.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelfie(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selfie) {
      toast({
        title: 'Selfie required',
        description: 'Please upload a selfie to continue.',
        variant: 'destructive',
      });
      return;
    }
    onSubmit({ ...values, selfie, selfiePosition });
  };

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary">Game Day</h1>
      
      <Tabs defaultValue="start" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="start">Kick Off</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="start" className="text-center">
            <p className="text-muted-foreground my-6">
                Test your emotional intelligence in 6 critical match-day scenarios. Get your official player card, see how you rank, and discover which professional footballer you're most like.
            </p>
      
            <div className="w-full flex flex-col items-center gap-4">
                <label htmlFor="selfie-upload" className="cursor-pointer">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/50 relative overflow-hidden group">
                    {selfie ? (
                    <Image 
                        src={selfie} 
                        alt="Selfie preview" 
                        layout="fill" 
                        objectFit="cover" 
                        style={{ objectPosition: `${selfiePosition.x}% ${selfiePosition.y}%` }}
                    />
                    ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-10 h-10 text-white" />
                    </div>
                </div>
                </label>
                <Input id="selfie-upload" type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />

                {selfie && (
                    <div className="w-full max-w-sm pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className='space-y-2'>
                            <Label className="font-extrabold">Adjust Vertical</Label>
                            <Slider
                                defaultValue={[50]}
                                onValueChange={([val]) => setSelfiePosition(p => ({ ...p, y: val }))}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label className="font-extrabold">Adjust Horizontal</Label>
                            <Slider
                                defaultValue={[50]}
                                onValueChange={([val]) => setSelfiePosition(p => ({ ...p, x: val }))}
                            />
                        </div>
                    </div>
                    </div>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 w-full mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="font-extrabold">First Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your First Name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="font-extrabold">Last Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your Last Name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-extrabold">Email</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="club"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-extrabold">Club / Organisation</FormLabel>
                        <FormControl>
                        <Input placeholder="Your Team" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="leaderboardOptIn"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                            <div className="space-y-1 leading-none text-left">
                            <FormLabel>
                                Join the Leaderboard
                            </FormLabel>
                            <FormDescription>
                                I agree to have my score and player card featured on the national leaderboard.
                            </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <Button type="submit" size="lg" className="w-full font-extrabold !mt-6">
                    Start the Match
                </Button>
                </form>
            </Form>
            <p className="text-xs text-muted-foreground max-w-sm mt-6 mx-auto text-center">
                By playing this game, you consent to subscribe to our communications list. You can unsubscribe at any time.
            </p>
        </TabsContent>
        <TabsContent value="leaderboard">
            <Leaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
