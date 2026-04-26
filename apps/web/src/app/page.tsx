import Link from 'next/link';
import {
  BarChart3,
  Target,
  Users,
  BookOpen,
  TrendingUp,
  Lock,
  ChevronRight,
  Activity,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Score Prediction',
    description:
      'ML-powered score predictions tailored to your handicap, history, and course conditions. Know what to expect before you tee off.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    icon: BarChart3,
    title: 'Strokes Gained Analytics',
    description:
      'Deep dive into every aspect of your game. Identify where you lose and gain strokes compared to your benchmark level.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: Users,
    title: 'Player Benchmarking',
    description:
      'Compare your stats to 11 handicap benchmark levels. See exactly where you stand and what separates you from the next tier.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: BookOpen,
    title: 'Practice Recommendations',
    description:
      'Get a personalized weekly practice plan based on your biggest weaknesses and fastest improvement opportunities.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
];

const stats = [
  { label: 'Benchmark Levels', value: '11', icon: Users },
  { label: 'ML-Powered Predictions', value: 'AI', icon: Zap },
  { label: 'Local & Private', value: '100%', icon: Lock },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative pt-12 pb-20">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-8">
            <Activity size={14} />
            AI-Powered Golf Analytics Platform
          </div>

          {/* Heading */}
          <h1 className="text-6xl font-extrabold text-white leading-none tracking-tight mb-6">
            GolfIQ{' '}
            <span className="gradient-text">Benchmark</span>
          </h1>

          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mb-10">
            Track every round, benchmark your game against 11 handicap levels, predict your
            next score with machine learning, and get a personalized practice plan — all
            running locally on your machine.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-glow hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
            >
              Open Dashboard
              <ChevronRight size={18} />
            </Link>
            <Link
              href="/rounds/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              Add New Round
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-16 max-w-2xl">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="glass-card px-5 py-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What GolfIQ Does</h2>
        <p className="text-slate-500 mb-8">
          Four core pillars to systematically improve your game.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, description, color, bg, border }) => (
            <div
              key={title}
              className={`glass-card p-6 border ${border} hover:border-opacity-40 transition-all duration-300 hover:-translate-y-0.5`}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5.5 h-5.5 ${color}`} size={22} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start CTA */}
      <div className="mt-16 glass-card p-8 border border-green-500/10 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Ready to analyze your game?</h3>
          <p className="text-slate-400 text-sm">Start by creating your profile or logging your first round.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/profile"
            className="px-5 py-2.5 bg-white/8 hover:bg-white/12 text-white text-sm font-medium rounded-lg border border-white/10 transition-all"
          >
            Create Profile
          </Link>
          <Link
            href="/rounds/new"
            className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold rounded-lg transition-all shadow-glow"
          >
            Log Round
          </Link>
        </div>
      </div>

      {/* Trend indicator */}
      <div className="mt-8 flex items-center gap-2 text-slate-600 text-xs">
        <TrendingUp size={14} />
        <span>All data is stored locally. Your game stats never leave your machine.</span>
      </div>
    </div>
  );
}
