'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, Loader2, AlertCircle, TrendingDown, TrendingUp, Minus, Info, PlusCircle } from 'lucide-react';
import { getProfiles, predictScore } from '@/lib/api';
import type { ScorePrediction } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';
import { DataSourceBadge, DemoModeBanner } from '@/components/DataSourceBadge';
import { cn } from '@/lib/utils';

const schema = z.object({
  course_name: z.string().optional(),
  course_par: z.number().min(54).max(78).optional(),
  yardage: z.number().min(3000).max(8000).optional(),
  course_rating: z.number().min(60).max(80).optional(),
  slope_rating: z.number().min(55).max(155).optional(),
  tee_box: z.string().optional(),
  weather_factor: z.number().min(-5).max(5).optional(),
  round_type: z.enum(['casual', 'tournament']).optional(),
  target_score: z.number().min(50).max(150).optional(),
});
type PredictForm = z.infer<typeof schema>;

const DEMO_PREDICTION: ScorePrediction = {
  profile_id: 1,
  predicted_score: 84,
  expected_score: 84,
  score_p10: 79,
  score_p50: 84,
  score_p90: 92,
  confidence_interval_low: 80,
  confidence_interval_high: 88,
  probability_break_90: 0.73,
  probability_break_80: 0.12,
  probability_break_75: 0.03,
  predicted_handicap: 12,
  confidence_level: 'low',
  handicap_trend: 'stable',
  model_version: 'demo',
  explanation: 'Demo prediction — add at least 3 real rounds to get a personalized forecast.',
  features_used: {},
};

interface ProbBadgeProps { label: string; prob: number; color: string; }
function ProbBadge({ label, prob, color }: ProbBadgeProps) {
  const pct = Math.round(prob * 100);
  return (
    <div className="glass-card p-4 text-center">
      <div className={cn('text-2xl font-bold mb-1', color)}>{pct}%</div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color.replace('text-', 'bg-'))} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PredictPage() {
  const { numRounds, demoMode, setDemoMode, dataSource, loading: stateLoading } = useAppState();
  const [prediction, setPrediction] = useState<ScorePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  const { register, handleSubmit } = useForm<PredictForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      course_par: 72,
      course_rating: 72.0,
      slope_rating: 113,
      weather_factor: 0,
      round_type: 'casual',
    },
  });

  const onSubmit = async (data: PredictForm) => {
    setLoading(true);
    setError('');
    setIsDemo(false);
    try {
      const profiles = await getProfiles();
      if (profiles.length === 0 || numRounds < 3) {
        setPrediction({ ...DEMO_PREDICTION, confidence_level: 'low' });
        setIsDemo(true);
        if (numRounds < 3) setError(`Need at least 3 rounds — you have ${numRounds}. Showing low-confidence demo.`);
        setLoading(false);
        return;
      }
      const result = await predictScore(profiles[0].id, {
        course_rating: data.course_rating,
        slope_rating: data.slope_rating,
        weather_factor: data.weather_factor,
      });
      if (result) {
        setPrediction(result);
      } else {
        setPrediction(DEMO_PREDICTION);
        setIsDemo(true);
        setError('Backend unavailable — showing demo prediction.');
      }
    } catch {
      setError('Failed to get prediction. Check backend connection.');
      setPrediction(DEMO_PREDICTION);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const p = prediction;
  const p10 = p?.score_p10 ?? 79;
  const p50 = p?.score_p50 ?? 84;
  const p90 = p?.score_p90 ?? 92;
  const expected = p?.expected_score ?? 84;
  const rangeMin = p10 - 2;
  const rangeMax = p90 + 2;
  const rangeSize = rangeMax - rangeMin || 1;

  const modelSource = isDemo || demoMode
    ? 'Demo seed data'
    : p?.model_version?.includes('ml') || p?.model_version?.includes('gradient')
    ? 'Trained model'
    : numRounds >= 3
    ? 'Statistical baseline (real rounds)'
    : 'Fallback rules';

  if (stateLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Score Prediction</h1>
          <p className="text-slate-400 text-sm mt-1">
            Forecast your next round based on your history and course conditions.
          </p>
        </div>
        <DataSourceBadge source={dataSource} />
      </div>

      <DemoModeBanner demoMode={demoMode} setDemoMode={setDemoMode} numRounds={numRounds} />

      {numRounds < 3 && !demoMode && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
          <AlertCircle size={16} />
          <span>
            You have {numRounds} round{numRounds !== 1 ? 's' : ''}. Add at least 3 rounds for a personalized prediction.{' '}
            <Link href="/rounds/new" className="underline text-blue-200 hover:text-white">Add a round</Link>
          </span>
        </div>
      )}

      {/* Form */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Target size={16} className="text-green-400" />
          Course Scenario
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Course Name (optional)</label>
              <input {...register('course_name')} type="text" className="input-dark" placeholder="Augusta National" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Par</label>
              <input {...register('course_par', { valueAsNumber: true })} type="number" className="input-dark" placeholder="72" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Yardage</label>
              <input {...register('yardage', { valueAsNumber: true })} type="number" className="input-dark" placeholder="6400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Course Rating</label>
              <input {...register('course_rating', { valueAsNumber: true })} type="number" step="0.1" className="input-dark" placeholder="72.0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Slope Rating</label>
              <input {...register('slope_rating', { valueAsNumber: true })} type="number" className="input-dark" placeholder="113" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Tee Box</label>
              <select {...register('tee_box')} className="input-dark">
                <option value="">Select tee</option>
                <option value="championship">Championship / Black</option>
                <option value="back">Back / Blue</option>
                <option value="middle">Middle / White</option>
                <option value="forward">Forward / Gold</option>
                <option value="ladies">Ladies / Red</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Weather (+ harder)</label>
              <input {...register('weather_factor', { valueAsNumber: true })} type="number" step="0.5" className="input-dark" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Round Type</label>
              <select {...register('round_type')} className="input-dark">
                <option value="casual">Casual</option>
                <option value="tournament">Tournament</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Target Score (optional)</label>
              <input {...register('target_score', { valueAsNumber: true })} type="number" className="input-dark" placeholder="80" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-orange-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className={cn('inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all text-white',
              loading ? 'bg-green-500/40 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 shadow-lg')}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Predicting…' : 'Predict My Score'}
          </button>
        </form>
      </div>

      {/* Results */}
      {p && (
        <div className="space-y-6 animate-fade-in">
          {(isDemo || numRounds < 3) && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
              <AlertCircle size={13} />
              {numRounds < 3
                ? `Low confidence — only ${numRounds} round${numRounds !== 1 ? 's' : ''} on record.`
                : 'Showing demo prediction — connect backend for real results.'}
            </div>
          )}

          {/* Main score card */}
          <div className="glass-card p-8 flex items-center gap-8 border border-green-500/15">
            <div className="text-center min-w-[120px]">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Expected Score</div>
              <div className="text-7xl font-extrabold text-green-400">{Math.round(expected)}</div>
              <div className="text-slate-500 text-sm mt-1">on par {p.features_used?.course_par ?? 72}</div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Optimistic</span><span>Most Likely</span><span>Pessimistic</span>
                </div>
                <div className="relative h-8 bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute top-0 h-full bg-green-500/20 rounded-full"
                    style={{ left: `${((p10 - rangeMin) / rangeSize) * 100}%`, width: `${((p90 - p10) / rangeSize) * 100}%` }} />
                  <div className="absolute top-0 h-full w-1 bg-green-400 rounded-full"
                    style={{ left: `${((p50 - rangeMin) / rangeSize) * 100}%` }} />
                  {[{ v: p10, color: 'text-green-300' }, { v: p50, color: 'text-white' }, { v: p90, color: 'text-red-300' }].map(({ v, color }) => (
                    <div key={v} className={cn('absolute top-1/2 text-xs font-bold', color)}
                      style={{ left: `${((v - rangeMin) / rangeSize) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}>
                      {v.toFixed(0)}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>P10</span><span>P50</span><span>P90</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-xs text-slate-500">Handicap Trend</div>
                  <div className={cn('text-sm font-semibold flex items-center gap-1 mt-0.5',
                    p.handicap_trend === 'improving' ? 'text-green-400' : p.handicap_trend === 'declining' ? 'text-red-400' : 'text-slate-300')}>
                    {p.handicap_trend === 'improving' ? <TrendingDown size={13} /> : p.handicap_trend === 'declining' ? <TrendingUp size={13} /> : <Minus size={13} />}
                    {p.handicap_trend}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className={cn('text-sm font-semibold mt-0.5 capitalize',
                    p.confidence_level === 'high' ? 'text-green-400' : p.confidence_level === 'medium' ? 'text-blue-400' : 'text-orange-400')}>
                    {p.confidence_level}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Predicted HCP</div>
                  <div className="text-sm font-semibold text-blue-400 mt-0.5">{p.predicted_handicap.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Model Source</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{modelSource}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Break probabilities */}
          <div>
            <h3 className="text-white font-semibold mb-4">Break Probabilities</h3>
            <div className="grid grid-cols-3 gap-4">
              <ProbBadge label="Break 90" prob={p.probability_break_90} color="text-blue-400" />
              <ProbBadge label="Break 80" prob={p.probability_break_80} color="text-green-400" />
              <ProbBadge label="Break 75" prob={p.probability_break_75} color="text-purple-400" />
            </div>
          </div>

          {/* Analysis */}
          {p.explanation && (
            <div className="glass-card p-6 border border-blue-500/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-400" />
                  <h3 className="text-white font-semibold">Analysis</h3>
                </div>
                <DataSourceBadge source={isDemo || demoMode ? 'demo_seed' : dataSource} />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{p.explanation}</p>
              <div className="mt-3 text-xs text-slate-600">
                Model: <span className="text-slate-500">{p.model_version}</span>
              </div>
            </div>
          )}

          {numRounds < 3 && !demoMode && (
            <div className="glass-card p-5 border border-blue-500/10 flex items-center gap-4">
              <PlusCircle size={20} className="text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-white font-medium text-sm">Improve prediction accuracy</div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Add {3 - numRounds} more round{3 - numRounds !== 1 ? 's' : ''} to unlock medium-confidence personalized predictions.
                </p>
              </div>
              <Link href="/rounds/new" className="ml-auto px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm font-medium transition-all whitespace-nowrap">
                Add Round
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
