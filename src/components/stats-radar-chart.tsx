
'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { EqScores } from '@/lib/types';
import { statTitles } from '@/lib/helpers';

type StatsRadarChartProps = {
  scores: EqScores;
};

export default function StatsRadarChart({ scores }: StatsRadarChartProps) {
  const chartData = Object.entries(scores).map(([key, value]) => ({
    stat: statTitles[key as keyof EqScores],
    value: value,
  }));

  const chartConfig = {
    value: {
      label: 'Value',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full w-full">
      <RadarChart data={chartData}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <PolarAngleAxis dataKey="stat" tick={{ fill: 'white' }} />
        <PolarGrid />
        <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
        <Radar
          dataKey="value"
          fill="var(--color-value)"
          fillOpacity={0.6}
          stroke="var(--color-value)"
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  );
}
