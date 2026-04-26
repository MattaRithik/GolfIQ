'use client';

import { useEffect, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Trophy, TrendingUp, AlertCircle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { getProfiles, getAnalyticsSummary, getBenchmark } from '@/lib/api';
import type { BenchmarkComparison, AnalyticsSummary } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';
import { DataSourceBadge, DemoModeBanner } from '@/components/DataSourceBadge';
import { cn } from '@/lib/utils';

// Seed benchmark reference data matching the backend
const BENCHMARK_GROUPS = [
  { key: '25_handicap', label: '25 Handicap', hcp: 25, scoringAvg: 97, gir: 22, fwy: 42, putts: 36.5, scrambling: 12 },
  { key: '20_handicap', label: '20 Handicap', hcp: 20, scoringAvg: 92, gir: 28, fwy: 48, putts: 34.5, scrambling: 18 },
  { key: '15_handicap', label: '15 Handicap', hcp: 15, scoringAvg: 87, gir: 36, fwy: 55, putts: 33.0, scrambling: 27 },
  { key: '10_handicap', label: '10 Handicap', hcp: 10, scoringAvg: 82, gir: 44, fwy: 60, putts: 31.5, scrambling: 38 },
  { key: '5_handicap',  label: '5 Handicap',  hcp: 5,  scoringAvg: 77, gir: 54, fwy: 66, putts: 30.5, scrambling: 50 },
  { key: 'scratch',     label: 'Scratch',     hcp: 0,  scoringAvg: 72, gir: 62, fwy: 70, putts: 29.5, scrambling: 60 },
  { key: 'elite_junior',  label: 'Elite Junior',   hcp: 1,  scoringAvg: 73, gir: 60, fwy: 69, putts: 29.5, scrambling: 58 },
  { key: 'college_golfer', label: 'College Golfer', hcp: -2, scoringAvg: 71, gir: 65, fwy: 72, putts: 29.0, scrambling: 62 },
  { key: 'elite_amateur',  label: 'Elite Amateur',  hcp: -3, scoringAvg: 70, gir: 68, fwy: 73, putts: 28.5, scrambling: 65 },
  { key: 'pga_tour_average', label: 'PGA Average', hcp: -7, scoringAvg: 70.5, gir: 67, fwy: 63, putts: 28.5, scrambling: 60 },
  { key: 'pga_top_50',  label: 'PGA Top 50',  hcp: -9, scoringAvg: 69.5, gir: 70, fwy: 65, putts: 28.2, scrambling: 63 },
  { key: 'pga_top_10',  label: 'PGA Top 10',  hcp: -11, scoringAvg: 68.5, gir: 73, fwy: 66, putts: 27.8, scrambling: 67 },
];

const NEXT_LEVEL_TIPS: Record<string, string[]> = {
  '25_handicap': ['Reduce 3-putts and 4-putts — focus on lag putting', 'Hit at least 4 greens per round', 'Eliminate penalty strokes with course management'],
  '20_handicap': ['Improve short game: chips within 6 feet', 'Get iron accuracy inside 150 yards', 'Develop consistent pre-shot routine'],
  '15_handicap': ['Hit 6+ GIR per round to reach 10 handicap level', 'Reduce putts per round to 32 or below', 'Improve fairway hit rate above 55%'],
  '10_handicap': ['Master 100-150 yard approach shots', 'Scrambling must reach 40%+ to stay competitive', 'Distance control on lag putts'],
  '5_handicap':  ['GIR 55%+ requires sharp iron striking', 'Scrambling 55%+ — develop versatile chip/pitch shots', 'Course management: play away from trouble'],
  'scratch':     ['Driving accuracy 70%+ while maintaining distance', 'GIR 62%+ through consistent iron play', 'Reduce putting to sub-30 per round'],
  'elite_junior': ['Tournament conditioning and mental game', 'Work with a coach on peak performance', 'Play competitive events regularly'],
  'college_golfer': ['World-class short game and putting', 'Mental resilience under competitive pressure', 'Fitness and physical conditioning'],
  'elite_amateur': ['Professional-level course strategy', 'Consistent ball striking across all clubs', 'Peak mental performance routine'],
  'pga_tour_average': ['Tour-level practice volume and specialization', 'Driving distance and accuracy combination', 'Statistical analysis of every round'],
  'pga_top_50': ['World-class in at least 2 strokes-gained categories', 'Optimize strengths while fixing weaknesses', 'Physical fitness and recovery program'],
  'pga_top_10': ['You are at the elite level — focus on peaking for majors', 'Marginal gains: driving, putting, mental'],
};

interface MetricRowProps {
  label: string;
  player: number | null;
  benchmark: number;
  unit?: string;
  lowerIsBetter?: boolean;
}

function MetricRow({ label, player, benchmark, unit = '', lowerIsBetter = false }: MetricRowProps) {
  const hasData = player !== null && !isNaN(player);
  const diff = hasData ? player! - benchmark : null;
  const better = diff !== null ? (lowerIsBetter ? diff < 0 : diff > 0) : false;
  const pct = hasData ? Math.min(Math.max((player! / benchmark) * 100, 10), 140) : 0;
  const benchPct = 100;

  return (
    <div className="grid grid-cols-[1fr_90px_90px_70px] gap-3 items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <div>
        {hasData ? (
          <span className={cn('text-sm font-semibold', better ? 'text-green-400' : diff !== null && diff !== 0 ? 'text-red-400' : 'text-white')}>
            {player!.toFixed(unit === '%' ? 1 : 1)}{unit}
          </span>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </div>
      <span className="text-sm text-slate-400">{benchmark.toFixed(1)}{unit}</span>
      <span className={cn('text-xs font-medium', better ? 'text-green-400' : diff !== null && diff !== 0 ? 'text-red-400' : 'text-slate-500')}>
        {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}${unit}` : '—'}
      </span>
    </div>
  );
}

export default function BenchmarkPage() {
  const { profile, numRounds, demoMode, setDemoMode, dataSource, loading: stateLoading } = useAppState();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('10_handicap');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profiles = await getProfiles();
        if (profiles.length > 0) {
          const [a, b] = await Promise.all([
            getAnalyticsSummary(profiles[0].id),
            getBenchmark(profiles[0].id),
          ]);
          setAnalytics(a);
          setBenchmark(b);
          if (b?.benchmark_group) setSelectedGroup(b.benchmark_group);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const noRounds = numRounds === 0 && !demoMode;

  // Player metrics from analytics or demo defaults
  const playerScoring = demoMode ? 84.2 : analytics?.scoring_average ?? null;
  const playerGIR = demoMode ? 38 : analytics?.gir_percentage != null ? analytics.gir_percentage * 100 : null;
  const playerFwy = demoMode ? 52 : analytics?.fairway_percentage != null ? analytics.fairway_percentage * 100 : null;
  const playerPutts = demoMode ? 34 : analytics?.putts_per_round ?? null;
  const playerScrambling = demoMode ? 34 : analytics?.scrambling_percentage != null ? analytics.scrambling_percentage * 100 : null;
  const playerHcp = demoMode ? 12 : analytics?.estimated_handicap ?? null;

  // Find closest benchmark group by scoring average
  const closestGroup = BENCHMARK_GROUPS.reduce((best, g) => {
    if (playerScoring === null) return best;
    return Math.abs(g.scoringAvg - playerScoring) < Math.abs(best.scoringAvg - playerScoring) ? g : best;
  }, BENCHMARK_GROUPS[3]);

  const selected = BENCHMARK_GROUPS.find(g => g.key === selectedGroup) ?? closestGroup;
  const scratchGroup = BENCHMARK_GROUPS.find(g => g.key === 'scratch')!;
  const pgaGroup = BENCHMARK_GROUPS.find(g => g.key === 'pga_tour_average')!;

  // Radar data
  const radarData = [
    { subject: 'Scoring', player: playerScoring ? Math.max(0, 100 - (playerScoring - 68)) : 0, benchmark: Math.max(0, 100 - (selected.scoringAvg - 68)) },
    { subject: 'GIR %', player: playerGIR ?? 0, benchmark: selected.gir },
    { subject: 'Fairways', player: playerFwy ?? 0, benchmark: selected.fwy },
    { subject: 'Putting', player: playerPutts ? Math.max(0, 100 - (playerPutts - 27)) : 0, benchmark: Math.max(0, 100 - (selected.putts - 27)) },
    { subject: 'Scrambling', player: playerScrambling ?? 0, benchmark: selected.scrambling },
  ];

  // Gap to scratch and PGA
  const gapToScratch = playerScoring !== null ? +(playerScoring - scratchGroup.scoringAvg).toFixed(1) : null;
  const gapToPGA = playerScoring !== null ? +(playerScoring - pgaGroup.scoringAvg).toFixed(1) : null;

  const nextLevelIdx = BENCHMARK_GROUPS.findIndex(g => g.key === closestGroup.key);
  const nextGroup = BENCHMARK_GROUPS[Math.max(0, nextLevelIdx - 1)];
  const tips = NEXT_LEVEL_TIPS[closestGroup.key] ?? [];

  if (loading || stateLoading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2 size={24} className="animate-spin text-green-500" />
        <span className="text-slate-400">Loading benchmark data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy size={26} className="text-green-400" />
            Benchmark
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Compare yourself against every level — from 25 handicap to PGA top 10.
          </p>
        </div>
        <DataSourceBadge source={dataSource} />
      </div>

      <DemoModeBanner demoMode={demoMode} setDemoMode={setDemoMode} numRounds={numRounds} />

      {noRounds && (
        <div className="glass-card p-8 text-center border border-white/5">
          <Trophy size={36} className="mx-auto mb-3 text-slate-600" />
          <h3 className="text-white font-semibold text-lg mb-2">No rounds yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Add at least 3 rounds to unlock real benchmark comparisons, or use demo data to preview what benchmarks look like.
          </p>
        </div>
      )}

      {!noRounds && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Closest Level</div>
              <div className="text-lg font-bold text-green-400">{closestGroup.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">Your peer group</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gap to Scratch</div>
              <div className={cn('text-lg font-bold', gapToScratch !== null && gapToScratch > 0 ? 'text-orange-400' : 'text-green-400')}>
                {gapToScratch !== null ? `+${gapToScratch} strokes` : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">vs scratch avg</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gap to PGA Avg</div>
              <div className="text-lg font-bold text-red-400">
                {gapToPGA !== null ? `+${gapToPGA} strokes` : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">vs tour average</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Handicap</div>
              <div className="text-lg font-bold text-blue-400">
                {playerHcp !== null ? playerHcp.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">estimated</div>
            </div>
          </div>

          {/* Benchmark selector + metrics */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Compare Against</h2>
              <select
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                className="input-dark text-sm w-48"
              >
                {BENCHMARK_GROUPS.map(g => (
                  <option key={g.key} value={g.key}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="grid grid-cols-[1fr_90px_90px_70px] gap-3 text-xs text-slate-500 uppercase tracking-wider pb-2 border-b border-white/10">
                <span>Metric</span>
                <span>You</span>
                <span>{selected.label}</span>
                <span>Gap</span>
              </div>
              <MetricRow label="Scoring Average" player={playerScoring} benchmark={selected.scoringAvg} lowerIsBetter />
              <MetricRow label="Greens in Regulation %" player={playerGIR} benchmark={selected.gir} unit="%" />
              <MetricRow label="Fairways Hit %" player={playerFwy} benchmark={selected.fwy} unit="%" />
              <MetricRow label="Putts per Round" player={playerPutts} benchmark={selected.putts} lowerIsBetter />
              <MetricRow label="Scrambling %" player={playerScrambling} benchmark={selected.scrambling} unit="%" />
            </div>
          </div>

          {/* Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-1">Performance Radar</h3>
              <p className="text-slate-500 text-xs mb-4">You vs {selected.label}</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name="You" dataKey="player" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name={selected.label} dataKey="benchmark" stroke="rgba(99,102,241,0.8)" fill="rgba(99,102,241,0.1)" strokeWidth={1.5} strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{ background: '#162035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500 inline-block" /> You</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-400 inline-block" /> {selected.label}</span>
              </div>
            </div>

            {/* Next level path */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-green-400" />
                <h3 className="text-white font-semibold">Path to Next Level</h3>
              </div>
              <p className="text-slate-500 text-xs mb-4">
                What you need to reach <span className="text-green-300">{nextGroup.label}</span>
              </p>
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <ArrowRight size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{tip}</span>
                  </div>
                ))}
              </div>
              {benchmark?.skill_gaps && Object.keys(benchmark.skill_gaps).length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-500">
                  <CheckCircle2 size={12} className="inline mr-1 text-green-500" />
                  Benchmark calculated from your last {numRounds} round{numRounds !== 1 ? 's' : ''}.
                </div>
              )}
            </div>
          </div>

          {/* All levels bar */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">Scoring Average Across All Levels</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  ...BENCHMARK_GROUPS.map(g => ({ name: g.label.replace(' Handicap', 'hcp').replace('PGA ', '').replace('Elite ', ''), score: g.scoringAvg, isPlayer: false })),
                  ...(playerScoring !== null ? [{ name: 'You', score: playerScoring, isPlayer: true }] : []),
                ].sort((a, b) => b.score - a.score)}
                margin={{ top: 5, right: 5, bottom: 30, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis domain={[65, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(1), 'Scoring Avg']}
                  contentStyle={{ background: '#162035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                />
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {[...BENCHMARK_GROUPS.map(g => ({ isPlayer: false })), ...(playerScoring !== null ? [{ isPlayer: true }] : [])].sort((a, b) => 0).map((entry, i) => (
                    <Cell key={i} fill={entry.isPlayer ? '#22c55e' : 'rgba(99,102,241,0.5)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-green-500 inline-block rounded-sm" /> You</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-indigo-400/50 inline-block rounded-sm" /> Benchmark level</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
