'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, login } = useAuth();
  const [golfiqId, setGolfiqId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [ready, user, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = login(golfiqId, password);
    if (!result) {
      setError('Invalid GolfIQ ID or password.');
      setSubmitting(false);
      return;
    }
    router.replace(result.role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f1629]">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-white font-bold text-2xl leading-none">GolfIQ</div>
            <div className="text-green-500 text-xs font-medium tracking-wider mt-1">BENCHMARK</div>
          </div>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Sign in</h1>
          <p className="text-sm text-slate-400 mb-6">
            Use your GolfIQ ID and password to continue.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">GolfIQ ID</label>
              <input
                type="text"
                value={golfiqId}
                onChange={e => setGolfiqId(e.target.value)}
                className="input-dark"
                placeholder="e.g. demo"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !golfiqId || !password}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-400 disabled:bg-green-500/40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Sign in
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-xs text-slate-500 leading-relaxed">
            <div className="font-medium text-slate-400 mb-1">Demo accounts (local MVP)</div>
            <div>Customer — <span className="text-slate-300">demo</span> / <span className="text-slate-300">demo123</span></div>
            <div>Admin — <span className="text-slate-300">admin</span> / <span className="text-slate-300">admin123</span></div>
            <div className="mt-2 text-slate-600">
              Local-only auth for development. Replace with secure auth before production.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
