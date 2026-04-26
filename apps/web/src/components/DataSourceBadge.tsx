'use client';

import { cn } from '@/lib/utils';
import type { DataSource } from '@/lib/useAppState';
import { DATA_SOURCE_LABELS, DATA_SOURCE_COLORS } from '@/lib/useAppState';

interface Props {
  source: DataSource;
  className?: string;
}

export function DataSourceBadge({ source, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
        DATA_SOURCE_COLORS[source],
        className
      )}
    >
      {DATA_SOURCE_LABELS[source]}
    </span>
  );
}

interface DemoModeBannerProps {
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  numRounds: number;
}

export function DemoModeBanner({ demoMode, setDemoMode, numRounds }: DemoModeBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-medium',
        demoMode
          ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
          : 'bg-slate-800/60 border-slate-700/40 text-slate-400'
      )}
    >
      <span>
        {demoMode
          ? 'Demo Mode — sample data shown'
          : numRounds === 0
          ? 'No rounds yet — add your first round for real analytics'
          : `${numRounds} real round${numRounds !== 1 ? 's' : ''} in your account`}
      </span>
      <button
        onClick={() => setDemoMode(!demoMode)}
        className={cn(
          'ml-4 px-3 py-1 rounded-lg border text-[10px] uppercase tracking-wider font-semibold transition-all',
          demoMode
            ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
            : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'
        )}
      >
        {demoMode ? 'Use real data' : 'Use demo data'}
      </button>
    </div>
  );
}
