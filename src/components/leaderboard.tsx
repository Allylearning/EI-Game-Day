'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LeaderboardEntry } from '@/lib/types';
import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/db';
import { Skeleton } from './ui/skeleton';

const LeaderboardRow = ({ entry }: { entry: LeaderboardEntry }) => (
  <TableRow>
    <TableCell className="font-medium text-center">
      {entry.rank === 1 ? (
        <Crown className="w-6 h-6 text-yellow-400" />
      ) : (
        entry.rank
      )}
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-3">
        <Avatar className='h-8 w-8' data-ai-hint="person avatar">
          {entry.selfie && <AvatarImage src={entry.selfie} alt={entry.name} />}
          <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <span className="font-medium">{entry.name}</span>
          {entry.club && <p className="text-xs text-muted-foreground">{entry.club}</p>}
        </div>
      </div>
    </TableCell>
    <TableCell className="text-right font-headline text-lg text-primary font-extrabold">{entry.score}</TableCell>
  </TableRow>
);

const LeaderboardSkeleton = () => (
    <>
        {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className='space-y-2'>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </TableCell>
                <TableCell><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </>
);


export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
        // Optionally, set some error state to show in the UI
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full">
      <h3 className="font-headline text-2xl text-center mb-4 text-primary font-extrabold">Weekly Top 10</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] font-extrabold">Rank</TableHead>
            <TableHead className="font-extrabold">Player</TableHead>
            <TableHead className="text-right font-extrabold">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             <LeaderboardSkeleton />
          ) : (
            leaderboard.map((entry) => (
                <LeaderboardRow key={entry.rank} entry={entry} />
            ))
          )}
           {!loading && leaderboard.length === 0 && (
            <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    The leaderboard is currently empty. Be the first!
                </TableCell>
            </TableRow>
           )}
        </TableBody>
      </Table>
    </div>
  );
}
