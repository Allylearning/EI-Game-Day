
'use server';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { players } from './schema';
import { desc } from 'drizzle-orm';
import type { LeaderboardEntry } from './types';

// Properly type the Neon database client
let db: ReturnType<typeof drizzle<typeof schema>>;
let sql: ReturnType<typeof neon> | null = null;

if (process.env.DATABASE_URL) {
  // Neon's serverless driver doesn't support the channel_binding parameter.
  // We'll remove it from the connection string if it exists.
  const connectionString = process.env.DATABASE_URL.replace('&channel_binding=require', '');
  sql = neon(connectionString);
  db = drizzle(sql, { schema });
} else {
  console.warn("DATABASE_URL is not set. Database operations will be skipped.");
}


// This function now fetches the top 10 players from the actual database
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!db) {
    console.log("Skipping getLeaderboard: no database connection.");
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
  club?: string;
  score: number;
  selfie?: string;
}) {
    if (!db) {
        console.log(`Skipping addPlayerScore for ${playerData.name}: no database connection.`);
        return;
    }
  try {
    // This will insert a new player or update the score if the name already exists.
    // Note: For a real production app, you'd want a more robust way to identify users,
    // like a unique user ID, instead of just their name.
    await db
      .insert(players)
      .values({
        name: playerData.name,
        club: playerData.club,
        score: playerData.score,
        selfie: playerData.selfie,
      })
      .onConflictDoUpdate({
        target: players.name, // Assuming name is unique.
        set: {
          score: playerData.score,
          // You might want to update other fields as well, e.g., if their selfie changes.
          selfie: playerData.selfie,
          club: playerData.club,
          updatedAt: new Date(),
        },
        // This condition ensures you only update the score if the new one is higher.
        // where: sql`${players.score} < ${playerData.score}`,
      });
    console.log(`Score for ${playerData.name} has been added/updated.`);
  } catch (error) {
    console.error('Error adding player score to database:', error);
  }
}
