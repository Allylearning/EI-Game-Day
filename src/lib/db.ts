
'use server';

import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { players } from './schema';
import { desc } from 'drizzle-orm';
import type { LeaderboardEntry } from './types';

function getDb() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set.");
    return null;
  }
  
  // Required for Vercel deployments
  neonConfig.fetchOptions = {
    cache: 'no-store',
  };

  const connectionString = process.env.DATABASE_URL.replace('&channel_binding=require', '');
  const sql = neon(connectionString);
  
  return drizzle(sql, { schema });
}


// This function now fetches the top 10 players from the actual database
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const db = getDb();
  if (!db) {
    console.log("Skipping getLeaderboard: Database connection failed.");
    return [];
  }

  try {
    const topPlayers = await db.query.players.findMany({
      orderBy: [desc(players.score)],
      limit: 10,
    });

    // Add rank to each player
    return topPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Error fetching leaderboard from database:', error);
    // In case of an error, return an empty array
    // You might want to handle this more gracefully in a real app
    return [];
  }
}

// You will need a function to add or update a player's score
// This is a placeholder, you'll need to call this after a quiz is completed.
export async function addPlayerScore(playerData: {
  name: string;
  club: string;
  score: number;
  selfie?: string;
}) {
    const db = getDb();
    if (!db) {
        console.log(`Skipping addPlayerScore for ${playerData.name}: Database connection failed.`);
        return;
    }
  try {
    // This will insert a new player score every time.
    await db
      .insert(players)
      .values({
        name: playerData.name,
        club: playerData.club,
        score: playerData.score,
        selfie: playerData.selfie,
        updatedAt: new Date(),
      });
    console.log(`Score for ${playerData.name} has been added.`);
  } catch (error)
   {
    console.error('Error adding player score to database:', error);
  }
}
