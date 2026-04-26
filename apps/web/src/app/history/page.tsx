'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  History, Save, Loader2, CheckCircle2, AlertCircle, Trophy,
  Dumbbell, Target, Activity
} from 'lucide-react';
import { getProfiles, updateProfile, createProfile } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(5).max(120).optional().nullable(),
  age_started: z.number().min(3).max(80).optional().nullable(),
  years_playing: z.number().min(0).max(100).optional().nullable(),
  handicap_index: z.number().min(-10).max(54).optional().nullable(),
  best_handicap_ever: z.number().min(-10).max(54).optional().nullable(),
  best_score_ever: z.number().min(50).max(200).optional().nullable(),
  home_course: z.string().max(255).optional().nullable(),
  typical_tee_yardage: z.number().min(3000).max(8000).optional().nullable(),
  driving_distance: z.number().min(100).max(400).optional().nullable(),
  swing_speed: z.number().min(50).max(150).optional().nullable(),
  typical_miss: z.string().optional().nullable(),
  strongest_part: z.string().max(100).optional().nullable(),
  weakest_part: z.string().max(100).optional().nullable(),
  tournament_experience: z.string().optional().nullable(),
  num_tournaments: z.number().min(0).optional().nullable(),
  practice_hours_per_week: z.number().min(0).max(60).optional().nullable(),
  practice_split_driving: z.number().min(0).max(100).optional().nullable(),
  practice_split_approach: z.number().min(0).max(100).optional().nullable(),
  practice_split_short_game: z.number().min(0).max(100).optional().nullable(),
  practice_split_putting: z.number().min(0).max(100).optional().nullable(),
  practice_split_course_mgmt: z.number().min(0).max(100).optional().nullable(),
  coach_program: z.string().optional().nullable(),
  fitness_notes: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
});

type HistoryForm = z.infer<typeof schema>;

const inputCls = 'input-dark';
const labelCls = 'text-xs text-slate-400 font-medium';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 space-y-5">
      <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4">
        <Icon size={16} className="text-green-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

export default function HistoryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<HistoryForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    getProfiles().then(profiles => {
      const p = profiles[0] ?? null;
      setProfile(p);
      if (p) {
        reset({
          name: p.name,
          age: p.age ?? null,
          age_started: p.age_started ?? null,
          years_playing: p.years_playing ?? null,
          handicap_index: p.handicap_index ?? null,
          best_handicap_ever: p.best_handicap_ever ?? null,
          best_score_ever: p.best_score_ever ?? null,
          home_course: p.home_course ?? null,
          typical_tee_yardage: p.typical_tee_yardage ?? null,
          driving_distance: p.driving_distance ?? null,
          swing_speed: p.swing_speed ?? null,
          typical_miss: p.typical_miss ?? null,
          strongest_part: p.strongest_part ?? null,
          weakest_part: p.weakest_part ?? null,
          tournament_experience: p.tournament_experience ?? null,
          num_tournaments: p.num_tournaments ?? null,
          practice_hours_per_week: p.practice_hours_per_week ?? null,
          practice_split_driving: p.practice_split_driving ?? null,
          practice_split_approach: p.practice_split_approach ?? null,
          practice_split_short_game: p.practice_split_short_game ?? null,
          practice_split_putting: p.practice_split_putting ?? null,
          practice_split_course_mgmt: p.practice_split_course_mgmt ?? null,
          coach_program: p.coach_program ?? null,
          fitness_notes: p.fitness_notes ?? null,
          goals: p.goals ?? null,
        });
      }
    });
  }, [reset]);

  const onSubmit = async (data: HistoryForm) => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      // strip nulls to avoid overwriting with null
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined && v !== '') payload[k] = v;
      }
      let result: Profile | null = null;
      if (profile) {
        result = await updateProfile(profile.id, payload);
      } else {
        result = await createProfile({ name: data.name, ...payload });
      }
      if (result) {
        setProfile(result);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save. Check backend connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <History size={26} className="text-green-400" />
          Golf Life History
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Your complete golf background — used to personalize analytics, benchmarks, and coaching.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Section title="Player Identity" icon={Activity}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Display Name *">
              <input {...register('name')} type="text" className={inputCls} placeholder="Your name" />
            </Field>
            <Field label="Current Age">
              <input {...register('age', { valueAsNumber: true })} type="number" className={inputCls} placeholder="28" />
            </Field>
            <Field label="Age Started Playing">
              <input {...register('age_started', { valueAsNumber: true })} type="number" className={inputCls} placeholder="10" />
            </Field>
            <Field label="Years Playing">
              <input {...register('years_playing', { valueAsNumber: true })} type="number" className={inputCls} placeholder="8" />
            </Field>
            <Field label="Home Course">
              <input {...register('home_course')} type="text" className={inputCls} placeholder="Augusta National" />
            </Field>
            <Field label="Typical Tee Yardage">
              <input {...register('typical_tee_yardage', { valueAsNumber: true })} type="number" className={inputCls} placeholder="6400" />
            </Field>
          </div>
        </Section>

        {/* Handicap + Scoring */}
        <Section title="Handicap & Scoring" icon={Target}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Current Handicap Index">
              <input {...register('handicap_index', { valueAsNumber: true })} type="number" step="0.1" className={inputCls} placeholder="12.4" />
            </Field>
            <Field label="Best Handicap Ever">
              <input {...register('best_handicap_ever', { valueAsNumber: true })} type="number" step="0.1" className={inputCls} placeholder="8.2" />
            </Field>
            <Field label="Best Score Ever">
              <input {...register('best_score_ever', { valueAsNumber: true })} type="number" className={inputCls} placeholder="74" />
            </Field>
            <Field label="Tournament Experience">
              <select {...register('tournament_experience')} className={inputCls}>
                <option value="">Select level</option>
                <option value="none">None</option>
                <option value="local">Local club events</option>
                <option value="regional">Regional / county</option>
                <option value="national">National amateur</option>
                <option value="professional">Professional</option>
              </select>
            </Field>
            <Field label="Tournaments Played (career)">
              <input {...register('num_tournaments', { valueAsNumber: true })} type="number" className={inputCls} placeholder="20" />
            </Field>
          </div>
        </Section>

        {/* Ball Striking */}
        <Section title="Ball Striking" icon={Dumbbell}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Driving Distance (yards)">
              <input {...register('driving_distance', { valueAsNumber: true })} type="number" className={inputCls} placeholder="265" />
            </Field>
            <Field label="Swing Speed (mph)" hint="Optional">
              <input {...register('swing_speed', { valueAsNumber: true })} type="number" step="0.5" className={inputCls} placeholder="95.0" />
            </Field>
            <Field label="Typical Miss Direction">
              <select {...register('typical_miss')} className={inputCls}>
                <option value="">Select</option>
                <option value="straight">Straight</option>
                <option value="left">Left (hook/draw)</option>
                <option value="right">Right (fade/slice)</option>
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="thin">Thin / top</option>
                <option value="fat">Fat / chunk</option>
              </select>
            </Field>
            <Field label="Strongest Part of Game">
              <input {...register('strongest_part')} type="text" className={inputCls} placeholder="e.g. Putting, short game" />
            </Field>
            <Field label="Weakest Part of Game">
              <input {...register('weakest_part')} type="text" className={inputCls} placeholder="e.g. Approach shots from 150+" />
            </Field>
          </div>
        </Section>

        {/* Practice */}
        <Section title="Practice Habits" icon={Trophy}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Practice Hours / Week">
              <input {...register('practice_hours_per_week', { valueAsNumber: true })} type="number" step="0.5" className={inputCls} placeholder="5" />
            </Field>
          </div>
          <div>
            <p className={cn(labelCls, 'mb-3')}>Practice Split (%) — must total 100</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {([
                ['practice_split_driving', 'Driving'],
                ['practice_split_approach', 'Approach'],
                ['practice_split_short_game', 'Short Game'],
                ['practice_split_putting', 'Putting'],
                ['practice_split_course_mgmt', 'Course Mgmt'],
              ] as [keyof HistoryForm, string][]).map(([field, label]) => (
                <Field key={field} label={label}>
                  <input
                    {...register(field, { valueAsNumber: true })}
                    type="number"
                    min={0}
                    max={100}
                    className={inputCls}
                    placeholder="20"
                  />
                </Field>
              ))}
            </div>
          </div>
          <Field label="Coach / Training Program" hint="Optional — name of coach, academy, or online program">
            <input {...register('coach_program')} type="text" className={inputCls} placeholder="e.g. Rotary Swing, self-taught" />
          </Field>
        </Section>

        {/* Goals + Fitness */}
        <Section title="Goals & Fitness" icon={Activity}>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Goals">
              <textarea
                {...register('goals')}
                rows={3}
                className={cn(inputCls, 'resize-none')}
                placeholder="e.g. Break 80 by end of year, play in state amateur, reach scratch handicap"
              />
            </Field>
            <Field label="Injury / Fitness Limitations" hint="Optional — helps Coach recommendations">
              <textarea
                {...register('fitness_notes')}
                rows={2}
                className={cn(inputCls, 'resize-none')}
                placeholder="e.g. Lower back pain, limited shoulder rotation"
              />
            </Field>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all text-white',
              saving ? 'bg-green-500/40 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 shadow-lg'
            )}
          >
            {saving
              ? <Loader2 size={16} className="animate-spin" />
              : saved
              ? <CheckCircle2 size={16} />
              : <Save size={16} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Golf History'}
          </button>
          {saved && (
            <span className="text-green-400 text-sm flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              History saved successfully
            </span>
          )}
          {error && (
            <span className="text-red-400 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} />
              {error}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
