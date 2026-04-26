'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProfiles, getRounds, getModelStatus } from './api';
import type { Profile } from './types';

export type DataSource =
  | 'real_rounds'
  | 'profile_only'
  | 'demo_seed'
  | 'trained_model'
  | 'fallback_rules';

const DEMO_MODE_KEY = 'golfiq_demo_mode_v1';

export interface AppState {
  profile: Profile | null;
  numRounds: number;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  isModelTrained: boolean;
  dataSource: DataSource;
  loading: boolean;
  reload: () => void;
}

export function useAppState(): AppState {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [numRounds, setNumRounds] = useState(0);
  const [demoMode, _setDemoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(DEMO_MODE_KEY) === 'true';
  });
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const setDemoMode = useCallback((v: boolean) => {
    _setDemoMode(v);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEMO_MODE_KEY, String(v));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [profiles, modelStatus] = await Promise.all([
          getProfiles(),
          getModelStatus(),
        ]);
        if (cancelled) return;
        const p = profiles[0] ?? null;
        setProfile(p);
        setIsModelTrained(modelStatus?.model_loaded ?? false);
        if (p) {
          const rounds = await getRounds(p.id);
          if (!cancelled) setNumRounds(rounds.length);
        } else {
          setNumRounds(0);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setNumRounds(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tick]);

  const reload = useCallback(() => setTick(t => t + 1), []);

  let dataSource: DataSource;
  if (demoMode) {
    dataSource = 'demo_seed';
  } else if (isModelTrained && numRounds >= 5) {
    dataSource = 'trained_model';
  } else if (numRounds >= 3) {
    dataSource = 'real_rounds';
  } else if (profile) {
    dataSource = 'profile_only';
  } else {
    dataSource = 'fallback_rules';
  }

  return { profile, numRounds, demoMode, setDemoMode, isModelTrained, dataSource, loading, reload };
}

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  real_rounds: 'Based on your real rounds',
  profile_only: 'Based on profile only',
  demo_seed: 'Demo seed data',
  trained_model: 'Trained model',
  fallback_rules: 'Fallback rules',
};

export const DATA_SOURCE_COLORS: Record<DataSource, string> = {
  real_rounds: 'text-green-400 bg-green-500/10 border-green-500/20',
  profile_only: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  demo_seed: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  trained_model: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  fallback_rules: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};
