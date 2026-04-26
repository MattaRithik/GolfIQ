'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createRound, getProfiles } from '@/lib/api';
import { cn } from '@/lib/utils';

const holeSchema = z.object({
  hole_number: z.number().min(1).max(18),
  par: z.number().min(3).max(5),
  score: z.number().min(1).max(15),
  fairway_hit: z.boolean().optional(),
  green_in_regulation: z.boolean().optional(),
  putts: z.number().min(0).max(10).optional(),
  penalty_strokes: z.number().min(0).max(5).optional(),
});

const roundSchema = z.object({
  course_name: z.string().min(1, 'Course name is required'),
  course_location: z.string().optional(),
  tee_box: z.string().optional(),
  course_par: z.number().min(60).max(80).default(72),
  course_rating: z.number().min(60).max(80).default(72.0),
  slope_rating: z.number().min(55).max(155).default(113),
  yardage: z.number().min(3000).max(8500).optional(),
  date_played: z.string().min(1, 'Date is required'),
  total_score: z.number().min(50).max(150),
  weather_conditions: z.string().optional(),
  round_type: z.enum(['casual', 'tournament']).default('casual'),
  notes: z.string().optional(),
});

type RoundFormData = z.infer<typeof roundSchema>;

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

interface HoleEntry {
  hole_number: number;
  par: number;
  score: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  putts?: number;
  penalty_strokes?: number;
}

const defaultHoles: HoleEntry[] = Array.from({ length: 18 }, (_, i) => ({
  hole_number: i + 1,
  par: 4,
  score: 4,
  fairway_hit: undefined,
  green_in_regulation: undefined,
  putts: undefined,
  penalty_strokes: 0,
}));

export default function NewRoundPage() {
  const router = useRouter();
  const [showScorecard, setShowScorecard] = useState(false);
  const [holes, setHoles] = useState<HoleEntry[]>(defaultHoles);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RoundFormData>({
    resolver: zodResolver(roundSchema),
    defaultValues: {
      course_par: 72,
      course_rating: 72.0,
      slope_rating: 113,
      round_type: 'casual',
      date_played: new Date().toISOString().split('T')[0],
    },
  });

  const updateHole = (index: number, field: keyof HoleEntry, value: number | boolean | undefined) => {
    setHoles(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const totalFromScorecard = holes.reduce((s, h) => s + h.score, 0);

  const onSubmit = async (data: RoundFormData) => {
    setSubmitting(true);
    setStatus('idle');
    try {
      const profiles = await getProfiles();
      const profileId = profiles.length > 0 ? profiles[0].id : 1;

      const payload = {
        ...data,
        profile_id: profileId,
        holes: showScorecard ? holes : undefined,
      };

      const result = await createRound(payload);
      if (result) {
        setStatus('success');
        setTimeout(() => router.push('/rounds'), 1500);
      } else {
        setStatus('error');
        setErrorMsg('Failed to save round. Is the backend running?');
      }
    } catch {
      setStatus('error');
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'input-dark';
  const sectionCls = 'glass-card p-6 space-y-5';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Log New Round</h1>
        <p className="text-slate-400 text-sm mt-1">Record your round details and stats</p>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle size={20} />
          <div>
            <div className="font-semibold">Round saved successfully!</div>
            <div className="text-xs text-green-500/70 mt-0.5">Redirecting to rounds list...</div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={20} />
          <div>
            <div className="font-semibold">Error saving round</div>
            <div className="text-xs text-red-400/70 mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Course Details */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Course Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Course Name" required error={errors.course_name?.message}>
              <input
                {...register('course_name')}
                className={inputCls}
                placeholder="e.g. Pebble Beach Golf Links"
              />
            </Field>
            <Field label="Location">
              <input
                {...register('course_location')}
                className={inputCls}
                placeholder="e.g. Pebble Beach, CA"
              />
            </Field>
            <Field label="Tee Box">
              <input
                {...register('tee_box')}
                className={inputCls}
                placeholder="e.g. White, Blue, Back"
              />
            </Field>
            <Field label="Yardage">
              <input
                {...register('yardage', { valueAsNumber: true })}
                type="number"
                className={inputCls}
                placeholder="e.g. 6500"
              />
            </Field>
            <Field label="Course Par" required error={errors.course_par?.message}>
              <input
                {...register('course_par', { valueAsNumber: true })}
                type="number"
                className={inputCls}
                placeholder="72"
              />
            </Field>
            <Field label="Course Rating" required error={errors.course_rating?.message}>
              <input
                {...register('course_rating', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className={inputCls}
                placeholder="72.0"
              />
            </Field>
            <Field label="Slope Rating" required error={errors.slope_rating?.message}>
              <input
                {...register('slope_rating', { valueAsNumber: true })}
                type="number"
                className={inputCls}
                placeholder="113"
              />
            </Field>
          </div>
        </div>

        {/* Round Details */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Round Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Date Played" required error={errors.date_played?.message}>
              <input
                {...register('date_played')}
                type="date"
                className={inputCls}
              />
            </Field>
            <Field label="Total Score" required error={errors.total_score?.message}>
              <input
                {...register('total_score', { valueAsNumber: true })}
                type="number"
                className={cn(inputCls, 'text-xl font-bold')}
                placeholder="e.g. 84"
              />
            </Field>
            <Field label="Round Type">
              <select {...register('round_type')} className={inputCls}>
                <option value="casual">Casual</option>
                <option value="tournament">Tournament</option>
              </select>
            </Field>
            <Field label="Weather Conditions">
              <select {...register('weather_conditions')} className={inputCls}>
                <option value="">Select conditions</option>
                <option value="sunny">Sunny / Calm</option>
                <option value="cloudy">Cloudy / Mild</option>
                <option value="windy">Windy</option>
                <option value="rainy">Rainy</option>
                <option value="hot">Hot</option>
                <option value="cold">Cold</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              {...register('notes')}
              className={cn(inputCls, 'resize-none h-20')}
              placeholder="Any notes about the round, conditions, etc."
            />
          </Field>
        </div>

        {/* Scorecard (Optional, Expandable) */}
        <div className="glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowScorecard(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-white">Hole-by-Hole Scorecard</span>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/15">
                Optional
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              {showScorecard ? (
                <><span>Hide</span><ChevronUp size={18} /></>
              ) : (
                <><span>Expand</span><ChevronDown size={18} /></>
              )}
            </div>
          </button>

          {showScorecard && (
            <div className="px-6 pb-6">
              {showScorecard && (
                <div className="mb-3 text-sm text-slate-400 flex items-center justify-between">
                  <span>Enter scores for each hole</span>
                  <span className="text-white font-semibold">
                    Total: <span className="text-green-400">{totalFromScorecard}</span>
                  </span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Hole', 'Par', 'Score', 'Fairway', 'GIR', 'Putts', 'Penalties'].map(h => (
                        <th key={h} className="text-xs text-slate-500 uppercase tracking-wide font-medium px-2 py-2 text-center">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holes.map((hole, i) => (
                      <tr key={i} className="border-b border-white/3 hover:bg-white/3">
                        <td className="px-2 py-2 text-center text-slate-500 text-xs font-medium">{hole.hole_number}</td>
                        <td className="px-2 py-2">
                          <select
                            value={hole.par}
                            onChange={e => updateHole(i, 'par', Number(e.target.value))}
                            className="w-16 bg-navy-900/80 border border-white/10 text-white text-xs rounded px-1 py-1"
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={1}
                            max={15}
                            value={hole.score}
                            onChange={e => updateHole(i, 'score', Number(e.target.value))}
                            className={cn(
                              'w-16 bg-navy-900/80 border border-white/10 rounded px-2 py-1 text-center text-sm font-bold outline-none focus:border-green-500',
                              hole.score - hole.par < 0 ? 'text-yellow-400' :
                              hole.score - hole.par === 0 ? 'text-white' :
                              hole.score - hole.par === 1 ? 'text-orange-400' :
                              'text-red-400'
                            )}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={hole.fairway_hit ?? false}
                            onChange={e => updateHole(i, 'fairway_hit', e.target.checked)}
                            className="w-4 h-4 accent-green-500"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={hole.green_in_regulation ?? false}
                            onChange={e => updateHole(i, 'green_in_regulation', e.target.checked)}
                            className="w-4 h-4 accent-green-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={hole.putts ?? ''}
                            onChange={e => updateHole(i, 'putts', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-14 bg-navy-900/80 border border-white/10 text-white text-xs rounded px-2 py-1 text-center outline-none focus:border-green-500"
                            placeholder="—"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={hole.penalty_strokes ?? 0}
                            onChange={e => updateHole(i, 'penalty_strokes', Number(e.target.value))}
                            className="w-14 bg-navy-900/80 border border-white/10 text-white text-xs rounded px-2 py-1 text-center outline-none focus:border-green-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || status === 'success'}
            className={cn(
              'inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all text-white',
              submitting || status === 'success'
                ? 'bg-green-500/40 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-400 shadow-glow'
            )}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {status === 'success' ? 'Saved!' : 'Save Round'}
          </button>
          <a
            href="/rounds"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
