import type { EqScores, MatchEvent, StatName } from "./types";

export const statTitles: Record<StatName, string> = {
    patience: 'The Anchor',
    empathy: 'The Playmaker',
    resilience: 'The Fortress',
    focus: 'The Sniper',
    teamwork: 'The Captain',
    confidence: 'The Superstar',
};

export function getHighestStat(scores: EqScores): StatName {
    return (Object.keys(scores) as StatName[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
}

export function getOverallScore(scores: EqScores): number {
    const values = Object.values(scores);
    const sum = values.reduce((total, score) => total + score, 0);
    return Math.round(sum / values.length);
}

export function getFinalScore(matchEvents: MatchEvent[]): { goalsFor: number; goalsAgainst: number } {
    return matchEvents.reduce((acc, event) => {
        if (event.scoreChange > 0) acc.goalsFor++;
        if (event.scoreChange < 0) acc.goalsAgainst++;
        return acc;
    }, { goalsFor: 0, goalsAgainst: 0 });
}
