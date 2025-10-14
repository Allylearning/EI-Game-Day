
import type { EqScores, MatchEvent, StatName } from "./types";

export const statTitles: Record<StatName, string> = {
    patience: 'Patience',
    empathy: 'Empathy',
    resilience: 'Resilience',
    focus: 'Focus',
    teamwork: 'Teamwork',
    confidence: 'Confidence',
};

export const statAbbreviations: Record<StatName, string> = {
    patience: 'PAT',
    empathy: 'EMP',
    resilience: 'RES',
    focus: 'FOC',
    teamwork: 'TMW',
    confidence: 'CON',
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
