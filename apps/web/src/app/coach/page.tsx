'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, AlertCircle, Loader2, CheckSquare, Square, Zap, Target, PlusCircle, Brain } from 'lucide-react';
import { getProfiles, getCoachRecommendations } from '@/lib/api';
import type { CoachRecommendations } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';
import { DataSourceBadge, DemoModeBanner } from '@/components/DataSourceBadge';
import { cn } from '@/lib/utils';

const DEMO_COACH: CoachRecommendations = {
  profile_id: 1,
  benchmark_group: '15_handicap',
  skill_gaps: {},
  practice_plan: {
    allocation_percentages: {
      approach: 35, putting: 25, short_game: 20, driving: 12, course_management: 8,
    },
    drills: [
      '45 min: 100-150 yard approach shot targets',
      '20 min: Lag putting practice (30+ feet)',
      '30 min: Chipping from rough around green',
      '20 min: Bunker shots to targets',
      '20 min: Driver — alignment + tempo',
    ],
    next_round_tracking_goals: [
      'Aim for 6+ greens in regulation',
      'Target 32 or fewer total putts',
      'Hit 9+ fairways off the tee',
      'Make 3 pars from off the green',
      'Keep penalty strokes to 1 or fewer',
    ],
    explanation:
      "Based on a typical 15-handicap profile, your practice should focus on Approach and Putting. Add your real rounds to get personalized recommendations.",
  },
  top_priorities: [
    'Hit more greens in regulation',
    'Reduce total putts per round',
    'Improve scrambling (up-and-down)',
  ],
  explanation:
    'Demo recommendations — connect backend and add rounds for personalized coaching.',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'];
const PRIORITY_CONFIG = [
  { border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-400', label: 'Priority 1', bar: 'bg-red-500' },
  { border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400', label: 'Priority 2', bar: 'bg-orange-500' },
  { border: 'border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400', label: 'Priority 3', bar: 'bg-yellow-500' },
];
const AREA_LABELS: Record<string, string> = {
  driving: 'Driving', approach: 'Approach Shots', short_game: 'Short Game',
  putting: 'Putting', course_management: 'Course Management',
};

export default function CoachPage() {
  const { numRounds, demoMode, setDemoMode, dataSource, isModelTrained, loading: stateLoading } = useAppState();
  const [coach, setCoach] = useState<CoachRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [checkedGoals, setCheckedGoals] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profiles = await getProfiles();
      if (profiles.length > 0 && numRounds >= 3) {
        const result = await getCoachRecommendations(profiles[0].id);
        if (result) {
          setCoach(result);
        } else {
          setCoach(DEMO_COACH);
          setIsDemo(true);
        }
      } else {
        setCoach(DEMO_COACH);
        setIsDemo(numRounds < 3);
      }
      setLoading(false);
    }
    if (!stateLoading) load();
  }, [stateLoading, numRounds]);

  // Determine recommendation source
  const recSource: 'profile_only' | 'demo_seed' | 'real_rounds' | 'trained_model' =
    demoMode || isDemo
      ? 'demo_seed'
      : isModelTrained && numRounds >= 5
      ? 'trained_model'
      : numRounds >= 3
      ? 'real_rounds'
      : 'profile_only';

  const recSourceLabel =
    recSource === 'trained_model' ? 'Model-assisted recommendation' :
    recSource === 'real_rounds' ? 'Round-history-based recommendation' :
    recSource === 'profile_only' ? 'Profile-based recommendation' :
    'Demo recommendation';

  const c = coach ?? DEMO_COACH;
  const allocation = c.practice_plan?.allocation_percentages ?? {};
  const pieData = Object.entries(allocation).map(([name, value]) => ({
    name: AREA_LABELS[name] ?? name,
    value: Number(value),
  }));
  const drills = c.practice_plan?.drills ?? [];
  const goals = c.practice_plan?.next_round_tracking_goals ?? [];
  const priorities = c.top_priorities ?? [];

  const toggleGoal = (i: number) => {
    setCheckedGoals(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  if (loading || stateLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={32} className="animate-spin text-green-500" />
        <span className="text-slate-400">Loading coach recommendations…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Coach</h1>
          <p className="text-slate-400 text-sm mt-1">
            {recSourceLabel}
            {c.benchmark_group && (
              <span className="ml-2 text-slate-500">· vs <span className="text-green-400">{c.benchmark_group.replace(/_/g, ' ')}</span></span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isModelTrained && numRounds >= 5 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Brain size={10} />
              ML Model Active
            </span>
          )}
          <DataSourceBadge source={demoMode ? 'demo_seed' : recSource} />
        </div>
      </div>

      <DemoModeBanner demoMode={demoMode} setDemoMode={setDemoMode} numRounds={numRounds} />

      {/* Not enough rounds nudge */}
      {numRounds < 3 && !demoMode && (
        <div className="glass-card p-5 border border-blue-500/10 flex items-center gap-4">
          <PlusCircle size={20} className="text-blue-400 flex-shrink-0" />
          <div>
            <div className="text-white font-medium text-sm">Profile-based recommendations only</div>
            <p className="text-slate-400 text-xs mt-0.5">
              You have {numRounds} round{numRounds !== 1 ? 's' : ''}. Add {Math.max(0, 3 - numRounds)} more to unlock round-history-based coaching.
            </p>
          </div>
          <Link href="/rounds/new" className="ml-auto px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm font-medium whitespace-nowrap transition-all">
            Add Round
          </Link>
        </div>
      )}

      {priorities.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={14} />
            Top Priority Improvements
          </h2>
          <div className="space-y-4">
            {priorities.slice(0, 3).map((priority, i) => {
              const cfg = PRIORITY_CONFIG[i] ?? PRIORITY_CONFIG[2];
              return (
                <div key={i} className={cn('glass-card p-5 border', cfg.border)}>
                  <div className="flex items-start gap-4">
                    <div className={cn('mt-0.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap', cfg.badge)}>{cfg.label}</div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{priority}</p>
                      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', cfg.bar)} style={{ width: `${85 - i * 15}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Practice Allocation</h3>
              <p className="text-slate-500 text-xs mt-0.5">Recommended time distribution</p>
            </div>
            <DataSourceBadge source={demoMode ? 'demo_seed' : recSource} />
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={3} dataKey="value"
                    label={({ value }) => `${Math.round(Number(value))}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${Math.round(Number(v))}%`, 'Allocation']}
                    contentStyle={{ background: '#162035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{Math.round(item.value)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-sm py-12 text-center">No allocation data</div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Next Round Goals</h3>
          <p className="text-slate-500 text-xs mb-5">Track these targets in your next round</p>
          <div className="space-y-3">
            {goals.map((goal, i) => {
              const checked = checkedGoals.has(i);
              return (
                <button key={i} onClick={() => toggleGoal(i)}
                  className={cn('w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                    checked ? 'bg-green-500/10 border-green-500/25 text-green-300' : 'bg-white/3 border-white/8 text-slate-300 hover:border-white/15')}>
                  {checked ? <CheckSquare size={18} className="text-green-400 flex-shrink-0 mt-0.5" /> : <Square size={18} className="text-slate-600 flex-shrink-0 mt-0.5" />}
                  <span className={cn('text-sm', checked && 'line-through opacity-70')}>{goal}</span>
                </button>
              );
            })}
            {goals.length === 0 && <div className="text-slate-500 text-sm py-6 text-center">No tracking goals available</div>}
          </div>
          {goals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-500">
              {checkedGoals.size} of {goals.length} goals tracked
            </div>
          )}
        </div>
      </div>

      {drills.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-green-400" />
              <h3 className="text-white font-semibold">Recommended Drills</h3>
            </div>
            <DataSourceBadge source={demoMode ? 'demo_seed' : recSource} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {drills.map((drill, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                <span className="text-sm text-slate-300">{drill}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(c.explanation || c.practice_plan?.explanation) && (
        <div className="glass-card p-6 border border-blue-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-blue-400" />
              <h3 className="text-white font-semibold">Coach Analysis</h3>
            </div>
            <DataSourceBadge source={demoMode ? 'demo_seed' : recSource} />
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{c.explanation || c.practice_plan?.explanation}</p>
        </div>
      )}
    </div>
  );
}
