'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getProfiles, createProfile, updateProfile } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  age: z.number().min(5).max(120).optional(),
  gender: z.string().optional(),
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(30).max(300).optional(),
  dominant_hand: z.string().optional(),
  years_playing: z.number().min(0).max(100).optional(),
  handicap_index: z.number().min(-10).max(54).optional(),
  home_course: z.string().optional(),
  goals: z.string().optional(),
  practice_hours_per_week: z.number().min(0).max(60).optional(),
  fitness_notes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, error, required, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profiles = await getProfiles();
      if (profiles.length > 0) {
        const p = profiles[0];
        setProfile(p);
        reset({
          name: p.name,
          email: p.email ?? '',
          age: p.age,
          gender: p.gender ?? '',
          height_cm: p.height_cm,
          weight_kg: p.weight_kg,
          dominant_hand: p.dominant_hand ?? 'right',
          years_playing: p.years_playing,
          handicap_index: p.handicap_index,
          home_course: p.home_course ?? '',
          goals: p.goals ?? '',
          practice_hours_per_week: p.practice_hours_per_week,
          fitness_notes: p.fitness_notes ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setSubmitting(true);
    setStatus('idle');
    // Clean empty strings to undefined
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && !Number.isNaN(v))
    ) as ProfileFormData;
    try {
      let result: Profile | null;
      if (profile) {
        result = await updateProfile(profile.id, clean);
      } else {
        result = await createProfile(clean);
      }
      if (result) {
        setProfile(result);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setErrorMsg('Failed to save profile. Is the backend running on port 8000?');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={32} className="animate-spin text-green-500" />
        <span className="text-slate-400">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <User size={26} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {profile ? profile.name : 'Create Profile'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {profile ? 'Update your golfer profile' : 'Set up your golfer profile to get started'}
          </p>
        </div>
      </div>

      {/* Status messages */}
      {status === 'success' && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle size={20} />
          <span className="font-semibold">Profile saved successfully!</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={20} />
          <div>
            <div className="font-semibold">Error saving profile</div>
            <div className="text-xs text-red-400/70 mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name" required error={errors.name?.message}>
              <input {...register('name')} className={inputCls} placeholder="Your name" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" className={inputCls} placeholder="your@email.com" />
            </Field>
            <Field label="Age">
              <input {...register('age', { valueAsNumber: true })} type="number" className={inputCls} placeholder="e.g. 25" />
            </Field>
            <Field label="Gender">
              <select {...register('gender')} className={inputCls}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Field>
            <Field label="Height (cm)">
              <input {...register('height_cm', { valueAsNumber: true })} type="number" className={inputCls} placeholder="e.g. 180" />
            </Field>
            <Field label="Weight (kg)">
              <input {...register('weight_kg', { valueAsNumber: true })} type="number" className={inputCls} placeholder="e.g. 80" />
            </Field>
            <Field label="Dominant Hand">
              <select {...register('dominant_hand')} className={inputCls}>
                <option value="right">Right</option>
                <option value="left">Left</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Golf Profile */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Golf Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Years Playing" hint="How long have you been playing golf?">
              <input {...register('years_playing', { valueAsNumber: true })} type="number" className={inputCls} placeholder="e.g. 5" />
            </Field>
            <Field label="Handicap Index" hint="Your official or self-assessed handicap (−10 to 54)">
              <input
                {...register('handicap_index', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className={inputCls}
                placeholder="e.g. 12.4"
              />
            </Field>
            <Field label="Home Course">
              <input {...register('home_course')} className={inputCls} placeholder="e.g. Pebble Beach Golf Links" />
            </Field>
            <Field label="Weekly Practice Hours" hint="Hours per week dedicated to golf practice">
              <input
                {...register('practice_hours_per_week', { valueAsNumber: true })}
                type="number"
                step="0.5"
                className={inputCls}
                placeholder="e.g. 8"
              />
            </Field>
          </div>
          <Field label="Goals" hint="What are you working towards? e.g. 'Break 80 consistently'">
            <textarea
              {...register('goals')}
              className={cn(inputCls, 'resize-none h-20')}
              placeholder="Describe your golf goals..."
            />
          </Field>
        </div>

        {/* Fitness & Notes */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Fitness & Health Notes</h2>
          <Field label="Fitness Notes" hint="Any injuries, physical limitations, or fitness context (optional)">
            <textarea
              {...register('fitness_notes')}
              className={cn(inputCls, 'resize-none h-24')}
              placeholder="e.g. No injuries. Focusing on core strength for more distance."
            />
          </Field>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all text-white',
              submitting
                ? 'bg-green-500/40 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-400 shadow-lg'
            )}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {profile ? 'Update Profile' : 'Create Profile'}
          </button>
          {!profile && (
            <p className="text-xs text-slate-600">
              Start by creating your golfer profile to enable analytics and predictions.
            </p>
          )}
        </div>
      </form>

      {/* Profile metadata */}
      {profile && (
        <div className="glass-card p-4 flex items-center gap-6 text-xs text-slate-500">
          <span>Profile ID: <span className="text-slate-400">#{profile.id}</span></span>
          {profile.created_at && (
            <span>Created: <span className="text-slate-400">{new Date(profile.created_at).toLocaleDateString()}</span></span>
          )}
          {profile.updated_at && (
            <span>Updated: <span className="text-slate-400">{new Date(profile.updated_at).toLocaleDateString()}</span></span>
          )}
        </div>
      )}
    </div>
  );
}
