
'use client';

import {
  HeartHandshake,
  Hourglass,
  Shield,
  Crosshair,
  Users,
  Zap,
  TestTube2,
  type LucideProps,
} from 'lucide-react';
import Image from 'next/image';
import type { StatName } from '@/lib/types';
import { cn } from '@/lib/utils';

export const statIcons: Record<StatName, React.FC<LucideProps>> = {
  patience: Hourglass,
  empathy: HeartHandshake,
  resilience: Shield,
  focus: Crosshair,
  teamwork: Users,
  confidence: Zap,
};

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-2 text-2xl font-headline font-bold text-primary', className)}>
    <Image src="/img/me learning.svg" alt="Me learning" width={200} height={32} />
  </div>
);
