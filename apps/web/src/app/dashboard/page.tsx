'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, BarChart3, AlertCircle,
  Activity, Loader2, PlusCircle, Flag,
} from 'lucide-react';
import { getProfiles, getAnalyticsSummary, getBenchmark, getRounds } from '@/lib/api';
import type { AnalyticsSummary, BenchmarkComparison, Round } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';
import { DataSourceBadge, DemoModeBanner } from '@/components/DataSourceBadge';
import { formatHandicap, getHandicapColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Demo data — ONLY used when demoMode is explicitly on
const DEMO_SCORE_TREND = [
  { round: 'R1', score: 92 }, { round: 'R2', score: 89 }, { round: 'R3', score: 91 },
  { round: 'R4', score: 87 }, { round: 'R5', score: 88 }, { round: 'R6', score: 85 },
  { round: 'R7', score: 86 }, { round: 'R8', score: 83 }, { round: 'R9', score: 84 },
  { round: 'R10', score: 81 },
];
const DEMO_SKILL_GAPS = [
  { skill: 'Scoring Avg', player: 84, benchmark: 82 },
  { skill: 'Fairway %', player: 52, benchmark: 62 },
  { skill: 'GIR %', player: 38, benchmark: 48 },
  { skill: 'Avg Putts', player: 34, benchmark: 32 },
  { skill: 'Scrambling', player: 38, benchmark: 45 },
];
const DEMO_RADAR = [
  { subject: 'Driving', player: 65, benchmark: 75 },
  { subject: 'Approach', player: 55, benchmark: 72 },
  { subject: 'Short Game', player: 60, benchmark: 70 },
  { subject: 'Putting', player: 58, benchmark: 68 },
  { subject: 'Course Mgmt', player: 70, benchmark: 75 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  trend?: 'up' | 'down';
}
function StatCard({ title, value, subtitle, icon: Icon, accent = 'text-green-400', trend }: StatCardProps) {
  return (
    <div className="glass-card p-5 hover:border-white/15 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon size={18} className={accent} />
        </div>
        {trend && (
          <span className={cn('text-xs', trend === 'up' ? 'text-green-400' : 'text-red-400')}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </span>
        )}
      </div>
      <div className={cn('text-2xl font-bold mb-0.5', accent)}>{value}</div>
      <div className="text-xs font-medium text-slate-300">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

const Tip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-[#162035] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  ) : null;

export default function DashboardPage() {
  const { numRounds, demoMode, setDemoMode, dataSource, loading: stateLoading } = useAppState();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkComparison | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profiles = await getProfiles();
        if (profiles.length > 0) {
          const pid = profiles[0].id;
          const [a, b, r] = await Promise.all([
            getAnalyticsSummary(pid),
            getBenchmark(pid),
            getRounds(pid),
          ]);
          setAnalytics(a);
          setBenchmark(b);
          setRounds(r);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hasRealData = numRounds >= 1;
  const showData = demoMode || hasRealData;

  // Score trend from real rounds or demo
  const scoreTrend = demoMode
    ? DEMO_SCORE_TREND
    : rounds
        .slice()
        .sort((a, b) => new Date(a.date_played).getTime() - new Date(b.date_played).getTime())
        .slice(-10)
        .map((r, i) => ({ round: `R${i + 1}`, score: r.total_score ?? 0 }))
        .filter(r => r.score > 0);

  const skillGapData = demoMode
    ? DEMO_SKILL_GAPS
    : benchmark
    ? Object.entries(benchmark.skill_gaps)
        .slice(0, 5)
        .map(([key, val]) => ({
          skill: key.replace(/_/g, ' ').replace('percentage', '%'),
          player: Math.round(val.player * 10) / 10,
          benchmark: Math.round(val.benchmark * 10) / 10,
        }))
    : [];

  const radarData = demoMode ? DEMO_RADAR : [];

  const handicap = demoMode ? 12 : analytics?.estimated_handicap;
  const scoringAvg = demoMode ? 84.2 : analytics?.scoring_average;
  const closestBenchmark = (demoMode ? '10 Handicap' : benchmark?.benchmark_group?.replace(/_/g, ' ')) ?? null;

  if (loading || stateLoading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2 size={24} className="animate-spin text-green-500" />
        <span className="text-slate-400">Loading your dashboard…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Your golf performance at a glance</p>
        </div>
        <DataSourceBadge source={dataSource} />
      </div>

      <DemoModeBanner demoMode={demoMode} setDemoMode={setDemoMode} numRounds={numRounds} />

      {/* Empty state */}
      {!showData && (
        <div className="glass-card p-12 text-center border border-white/5">
          <Flag size={40} className="mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-semibold text-white mb-2">Add your first round to unlock real analytics</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Your dashboard will show score trends, benchmark comparisons, and improvement opportunities once you have at least 1 round.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/rounds/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-all"
            >
              <PlusCircle size={18} />
              Add Your First Round
            </Link>
            <button
              onClick={() => setDemoMode(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              Preview with demo data
            </button>
          </div>
        </div>
      )}

      {showData && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Estimated Handicap" value={handicap != null ? formatHandicap(handicap) : '—'}
              subtitle="From your rounds" icon={Activity} accent={handicap != null ? getHandicapColor(handicap) : 'text-slate-400'} trend="down" />
            <StatCard title="Scoring Average" value={scoringAvg != null ? scoringAvg.toFixed(1) : '—'}
              subtitle="All tracked rounds" icon={BarChart3} accent="text-green-400" trend="down" />
            <StatCard title="Rounds Tracked" value={demoMode ? 10 : numRounds}
              subtitle={demoMode ? 'Demo rounds' : 'Real rounds'} icon={Flag} accent="text-blue-400" />
            {closestBenchmark && (
              <StatCard title="Closest Benchmark" value={closestBenchmark}
                subtitle="Your peer group" icon={TrendingUp} accent="text-purple-400" />
            )}
            {analytics && (
              <>
                <StatCard title="GIR %" value={analytics.gir_percentage != null ? `${(analytics.gir_percentage * 100).toFixed(0)}%` : '—'}
                  subtitle="Greens in regulation" icon={Target} accent="text-cyan-400" />
                <StatCard title="Putts / Round" value={analytics.putts_per_round?.toFixed(1) ?? '—'}
                  subtitle="Putting average" icon={Activity} accent="text-orange-400" />
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Trend */}
            {scoreTrend.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">Score Trend</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {demoMode ? 'Demo — last 10 rounds' : `Last ${scoreTrend.length} rounds`}
                    </p>
                  </div>
                  {demoMode && (
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Demo preview</span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={scoreTrend} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="round" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5}
                      dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4ade80' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Skill Gaps */}
            {skillGapData.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">Skill Gaps vs Benchmark</h3>
                    <p className="text-slate-500 text-xs mt-0.5">You vs {closestBenchmark ?? 'benchmark'}</p>
                  </div>
                  {demoMode && (
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Demo preview</span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={skillGapData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="player" name="You" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="benchmark" name="Benchmark" fill="rgba(99,102,241,0.6)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Radar — only with real data or demo */}
          {radarData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">Performance Radar</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Multi-dimension view</p>
                  </div>
                  {demoMode && (
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Demo preview</span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Radar name="You" dataKey="player" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke="rgba(99,102,241,0.8)" fill="rgba(99,102,241,0.1)" strokeWidth={1.5} strokeDasharray="4 4" />
                    <Tooltip content={<Tip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick links */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {[
                      { href: '/rounds/new', icon: PlusCircle, label: 'Log a round', desc: 'Add score, GIR, putts, fairways' },
                      { href: '/benchmark', icon: BarChart3, label: 'View full benchmark', desc: 'Compare vs all skill levels' },
                      { href: '/predict', icon: Target, label: 'Predict next score', desc: 'Course-specific forecast' },
                      { href: '/coach', icon: Activity, label: 'Get coaching plan', desc: 'Practice allocation + drills' },
                    ].map(({ href, icon: Icon, label, desc }) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/15 transition-all group">
                        <Icon size={16} className="text-green-400 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-white font-medium">{label}</div>
                          <div className="text-xs text-slate-500">{desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Minimal quick actions if no charts */}
          {radarData.length === 0 && (
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { href: '/rounds/new', icon: PlusCircle, label: 'Add Round' },
                  { href: '/benchmark', icon: BarChart3, label: 'Benchmark' },
                  { href: '/predict', icon: Target, label: 'Predict Score' },
                  { href: '/coach', icon: Activity, label: 'Get Coaching' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 hover:border-white/15 text-center transition-all">
                    <Icon size={20} className="text-green-400" />
                    <span className="text-sm text-slate-300">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
