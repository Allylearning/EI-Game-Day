'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/get-player-report.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/get-scenario-feedback.ts';
