'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { BarChart3, Loader2, PlusCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { getProfiles, getAnalyticsSummary, getBenchmark, getRounds } from '@/lib/api';
import type { AnalyticsSummary, BenchmarkComparison, Round } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';
import { DataSourceBadge, DemoModeBanner } from '@/components/DataSourceBadge';
import { calcDifferential, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const DEMO_ANALYTICS: AnalyticsSummary = {
  profile_id: 1,
  num_rounds_analyzed: 10,
  scoring_average: 84.2,
  estimated_handicap: 12,
  fairway_percentage: 52,
  gir_percentage: 38,
  putts_per_round: 34.1,
  penalties_per_round: 1.4,
  scrambling_percentage: 38,
  par3_average: 3.8,
  par4_average: 4.6,
  par5_average: 5.4,
  recent_trend: 'improving',
  player_level: '10-14 Handicap',
};

const DEMO_SG: Record<string, number> = {
  sg_total: -2.1,
  sg_off_tee: -0.8,
  sg_approach: -0.8,
  sg_short_game: -0.3,
  sg_putting: -0.5,
};

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  benchmark?: number;
  better?: 'higher' | 'lower';
  color?: string;
}
function StatCard({ label, value, unit, benchmark, better, color = 'text-white' }: StatCardProps) {
  const numVal = parseFloat(String(value));
  let trend: 'up' | 'down' | null = null;
  if (benchmark != null && !isNaN(numVal)) {
    trend = (better === 'higher' ? numVal >= benchmark : numVal <= benchmark) ? 'up' : 'down';
  }
  return (
    <div className="glass-card p-5">
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{label}</div>
      <div className={cn('text-2xl font-bold mb-1', color)}>
        {value}{unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </div>
      {benchmark != null && trend && (
        <div className={cn('flex items-center gap-1 text-xs', trend === 'up' ? 'text-green-400' : 'text-orange-400')}>
          {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          Benchmark: {benchmark}{unit ?? ''}
        </div>
      )}
    </div>
  );
}

const Tip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-[#162035] border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  ) : null;

export default function AnalyticsPage() {
  const { numRounds, demoMode, setDemoMode, dataSource, loading: stateLoading } = useAppState();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkComparison | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profiles = await getProfiles();
      if (profiles.length > 0) {
        const [a, b, r] = await Promise.all([
          getAnalyticsSummary(profiles[0].id),
          getBenchmark(profiles[0].id),
          getRounds(profiles[0].id),
        ]);
        setAnalytics(a);
        setBenchmark(b);
        setRounds(r);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || stateLoading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2 size={24} className="animate-spin text-green-500" />
        <span className="text-slate-400">Loading analytics…</span>
      </div>
    );
  }

  const noRounds = numRounds === 0 && !demoMode;
  const a = demoMode ? DEMO_ANALYTICS : analytics;
  const sgProxy = demoMode ? DEMO_SG : benchmark?.strokes_gained_proxy ?? {};
  const benchmarkLabel = (demoMode ? '10 Handicap' : benchmark?.benchmark_group?.replace(/_/g, ' ')) ?? '10 Handicap';

  const sgData = [
    { name: 'Off Tee', value: sgProxy.sg_off_tee ?? 0 },
    { name: 'Approach', value: sgProxy.sg_approach ?? 0 },
    { name: 'Short Game', value: sgProxy.sg_short_game ?? 0 },
    { name: 'Putting', value: sgProxy.sg_putting ?? 0 },
  ];

  const skillGapsRecord = !demoMode ? benchmark?.skill_gaps ?? {} : {};
  const benchmarkCompare = Object.keys(skillGapsRecord).length > 0
    ? Object.entries(skillGapsRecord).slice(0, 6).map(([key, val]) => ({
        stat: key.replace(/_/g, ' ').replace('percentage', '%'),
        you: Math.round(val.player * 10) / 10,
        benchmark: Math.round(val.benchmark * 10) / 10,
      }))
    : a ? [
        { stat: 'Fairway %', you: (a.fairway_percentage ?? 0), benchmark: 62 },
        { stat: 'GIR %', you: (a.gir_percentage ?? 0), benchmark: 48 },
        { stat: 'Scrambling', you: (a.scrambling_percentage ?? 0), benchmark: 45 },
        { stat: 'Putts', you: (a.putts_per_round ?? 0), benchmark: 32 },
      ] : [];

  const differentials = rounds
    .filter(r => r.total_score && r.course?.course_rating && r.course?.slope_rating)
    .map(r => ({
      round: r,
      diff: calcDifferential(r.total_score!, r.course!.course_rating!, r.course!.slope_rating!),
    }))
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            {noRounds
              ? '0 rounds analyzed. Add at least 3 rounds for reliable analytics.'
              : demoMode
              ? 'Demo data shown — toggle off to see your real stats.'
              : `${a?.num_rounds_analyzed ?? numRounds} rounds analyzed`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataSourceBadge source={dataSource} />
          {a?.recent_trend && (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border',
              a.recent_trend === 'improving'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : a.recent_trend === 'declining'
                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            )}>
              {a.recent_trend === 'improving' ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {a.recent_trend}
            </div>
          )}
        </div>
      </div>

      <DemoModeBanner demoMode={demoMode} setDemoMode={setDemoMode} numRounds={numRounds} />

      {/* Empty state */}
      {noRounds && (
        <div className="glass-card p-12 text-center border border-white/5">
          <BarChart3 size={40} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-white font-semibold text-lg mb-2">No rounds analyzed yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Add at least 3 rounds to get scoring averages, GIR%, putting stats, strokes gained proxies, and benchmark comparisons.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/rounds/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-all">
              <PlusCircle size={18} />
              Add Your First Round
            </Link>
            <button onClick={() => setDemoMode(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm transition-all">
              Preview with demo data
            </button>
          </div>
        </div>
      )}

      {!noRounds && a && (
        <>
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Key Performance Stats</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Scoring Average" value={(a.scoring_average ?? 0).toFixed(1)} benchmark={82} better="lower" color="text-green-400" />
              <StatCard label="Estimated Handicap" value={a.estimated_handicap?.toFixed(1) ?? '—'} color="text-blue-400" />
              <StatCard label="Fairway %" value={(a.fairway_percentage ?? 0).toFixed(0)} unit="%" benchmark={62} better="higher" />
              <StatCard label="GIR %" value={(a.gir_percentage ?? 0).toFixed(0)} unit="%" benchmark={48} better="higher" />
              <StatCard label="Putts / Round" value={(a.putts_per_round ?? 0).toFixed(1)} benchmark={32} better="lower" color="text-purple-400" />
              <StatCard label="Penalties / Round" value={(a.penalties_per_round ?? 0).toFixed(1)} benchmark={1.0} better="lower" />
              <StatCard label="Scrambling %" value={(a.scrambling_percentage ?? 0).toFixed(0)} unit="%" benchmark={45} better="higher" color="text-orange-400" />
              <StatCard label="Par 3 Average" value={(a.par3_average ?? 0).toFixed(2)} benchmark={3.5} better="lower" />
              <StatCard label="Par 4 Average" value={(a.par4_average ?? 0).toFixed(2)} benchmark={4.4} better="lower" />
              <StatCard label="Par 5 Average" value={(a.par5_average ?? 0).toFixed(2)} benchmark={5.1} better="lower" />
              <StatCard label="Player Level" value={a.player_level ?? '—'} color="text-cyan-400" />
              <StatCard label="Closest Benchmark" value={benchmarkLabel} color="text-cyan-300" />
            </div>
            {demoMode && (
              <p className="text-xs text-orange-400/70 mt-2">
                All stats above are demo seed data — not your real performance.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">Estimated Strokes Gained</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Relative to scratch (0 = average)</p>
                </div>
                <DataSourceBadge source={dataSource} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sgData} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={75} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="value" name="Strokes Gained" radius={[0, 4, 4, 0]}>
                    {sgData.map((e, i) => <Cell key={i} fill={e.value >= 0 ? '#22c55e' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-slate-600 mt-2">
                Total SG: <span className={cn('font-semibold', (sgProxy.sg_total ?? 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {(sgProxy.sg_total ?? -2.1) >= 0 ? '+' : ''}{(sgProxy.sg_total ?? -2.1).toFixed(1)}
                </span>
              </div>
            </div>

            {benchmarkCompare.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">Benchmark Comparison</h3>
                    <p className="text-slate-500 text-xs mt-0.5">vs. {benchmarkLabel}</p>
                  </div>
                  <DataSourceBadge source={dataSource} />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={benchmarkCompare} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="stat" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="you" name="You" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="benchmark" name="Benchmark" fill="rgba(99,102,241,0.6)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {differentials.length > 0 && !demoMode && (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Handicap Differentials</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Best 8 of last 20 used for handicap estimate</p>
                </div>
                <DataSourceBadge source="real_rounds" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-slate-500 uppercase px-6 py-3">#</th>
                      <th className="text-left text-xs text-slate-500 uppercase px-4 py-3">Course</th>
                      <th className="text-left text-xs text-slate-500 uppercase px-4 py-3">Date</th>
                      <th className="text-center text-xs text-slate-500 uppercase px-4 py-3">Score</th>
                      <th className="text-center text-xs text-slate-500 uppercase px-4 py-3">Differential</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {differentials.map(({ round, diff }, i) => (
                      <tr key={round.id} className="hover:bg-white/[0.03]">
                        <td className="px-6 py-3 text-sm text-slate-400">#{i + 1}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{round.course?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(round.date_played)}</td>
                        <td className="px-4 py-3 text-center text-sm text-white font-medium">{round.total_score}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('text-sm font-bold',
                            diff <= 10 ? 'text-green-400' : diff <= 14 ? 'text-blue-400' : diff <= 18 ? 'text-orange-400' : 'text-red-400')}>
                            {diff.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
