import type { GetPlayerReportOutput } from "@/ai/flows/get-player-report";

export type UserData = {
  firstName: string;
  lastName: string;
  email: string;
  club: string;
  selfie: string; // Will store as a data URL
  selfiePosition: { x: number; y: number };
  leaderboardOptIn: boolean;
};

export type EqScores = GetPlayerReportOutput['eqScores'];

export type MatchEvent = {
  minute: number;
  outcome: string;
  scoreChange: number; // 1 for goal for, -1 for goal against, 0 for no change
};

export type StatName = keyof EqScores;

export type QuizResult = {
  eqScores: EqScores;
  matchEvents: MatchEvent[];
  position: string;
  playerComparison: string;
  isFallback?: boolean; // Optional flag for fallback results
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  club?: string;
  score: number;
  selfie?: string;
};
