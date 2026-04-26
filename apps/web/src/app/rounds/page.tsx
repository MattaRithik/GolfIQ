'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Flag, AlertCircle, Loader2, Calendar, MapPin } from 'lucide-react';
import { getRounds, getProfiles } from '@/lib/api';
import type { Round } from '@/lib/types';
import { formatDate, formatScore, getScoreColor, calcDifferential } from '@/lib/utils';
import { cn } from '@/lib/utils';

const DEMO_ROUNDS: Round[] = [
  {
    id: 1,
    profile_id: 1,
    tee_box: 'White',
    date_played: '2024-03-15',
    total_score: 84,
    round_type: 'casual',
    course: {
      id: 1,
      name: 'Pebble Beach Golf Links',
      location: 'Pebble Beach, CA',
      par: 72,
      course_rating: 72.8,
      slope_rating: 131,
    },
  },
  {
    id: 2,
    profile_id: 1,
    tee_box: 'Member',
    date_played: '2024-03-08',
    total_score: 89,
    round_type: 'tournament',
    course: {
      id: 2,
      name: 'Augusta National',
      location: 'Augusta, GA',
      par: 72,
      course_rating: 76.2,
      slope_rating: 148,
    },
  },
  {
    id: 3,
    profile_id: 1,
    tee_box: 'Blue',
    date_played: '2024-02-24',
    total_score: 81,
    round_type: 'casual',
    course: {
      id: 3,
      name: 'Torrey Pines South',
      location: 'La Jolla, CA',
      par: 72,
      course_rating: 74.6,
      slope_rating: 144,
    },
  },
  {
    id: 4,
    profile_id: 1,
    tee_box: 'Back',
    date_played: '2024-02-10',
    total_score: 88,
    round_type: 'casual',
    course: {
      id: 4,
      name: 'Bethpage Black',
      location: 'Farmingdale, NY',
      par: 71,
      course_rating: 75.4,
      slope_rating: 148,
    },
  },
  {
    id: 5,
    profile_id: 1,
    tee_box: 'Blue',
    date_played: '2024-01-20',
    total_score: 86,
    round_type: 'tournament',
    course: {
      id: 5,
      name: 'TPC Sawgrass',
      location: 'Ponte Vedra Beach, FL',
      par: 72,
      course_rating: 74.0,
      slope_rating: 135,
    },
  },
];

export default function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profiles = await getProfiles();
      if (profiles.length > 0) {
        const data = await getRounds(profiles[0].id);
        if (data.length > 0) {
          setRounds(data);
        } else {
          setRounds(DEMO_ROUNDS);
          setIsDemo(true);
        }
      } else {
        setRounds(DEMO_ROUNDS);
        setIsDemo(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  const getCoursePar = (r: Round) => r.course?.par ?? 72;
  const getCourseRating = (r: Round) => r.course?.course_rating ?? 72.0;
  const getSlope = (r: Round) => r.course?.slope_rating ?? 113;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Rounds</h1>
          <p className="text-slate-400 text-sm mt-1">
            {rounds.length} round{rounds.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
              <AlertCircle size={13} />
              Demo data
            </div>
          )}
          <Link
            href="/rounds/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm rounded-xl transition-all shadow-lg"
          >
            <Plus size={16} />
            Add Round
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin text-green-500" />
          <span className="text-sm">Loading rounds...</span>
        </div>
      ) : rounds.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Flag size={28} className="text-slate-500" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">No rounds yet</h3>
            <p className="text-slate-500 text-sm">Log your first round to start tracking your progress.</p>
          </div>
          <Link
            href="/rounds/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm rounded-xl transition-all"
          >
            <Plus size={16} />
            Log Your First Round
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Course</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">Date</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">Score</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">+/- Par</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">Differential</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">Type</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">Tees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rounds.map((round) => {
                  const par = getCoursePar(round);
                  const rating = getCourseRating(round);
                  const slope = getSlope(round);
                  const score = round.total_score ?? 0;
                  const diff = calcDifferential(score, rating, slope);
                  const scoreColor = getScoreColor(score, par);
                  return (
                    <tr key={round.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white text-sm">
                          {round.course?.name ?? 'Unknown Course'}
                        </div>
                        {round.course?.location && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin size={11} />
                            {round.course.location}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Calendar size={13} className="text-slate-600" />
                          {formatDate(round.date_played)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn('text-xl font-bold', scoreColor)}>{score}</span>
                        <div className="text-xs text-slate-600">par {par}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn('text-sm font-semibold', scoreColor)}>
                          {formatScore(score, par)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-slate-300">{diff.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            round.round_type === 'tournament'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                              : 'bg-green-500/10 text-green-400 border border-green-500/15'
                          )}
                        >
                          {round.round_type ?? 'casual'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs text-slate-500">{round.tee_box ?? '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary row */}
      {rounds.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Best Score', value: Math.min(...rounds.map(r => r.total_score ?? 999)) },
            {
              label: 'Average Score',
              value: (
                rounds.reduce((s, r) => s + (r.total_score ?? 0), 0) / rounds.length
              ).toFixed(1),
            },
            { label: 'Total Rounds', value: rounds.length },
            {
              label: 'Best Diff.',
              value: Math.min(
                ...rounds.map(r =>
                  calcDifferential(r.total_score ?? 99, getCourseRating(r), getSlope(r))
                )
              ).toFixed(1),
            },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card px-5 py-4 text-center">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
