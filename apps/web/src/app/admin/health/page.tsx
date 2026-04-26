'use client';

import { useEffect, useState } from 'react';
import { HeartPulse, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

interface HealthCheck {
  name: string;
  url: string;
  status: 'ok' | 'error' | 'pending';
  latencyMs?: number;
  detail?: string;
}

async function checkEndpoint(name: string, url: string): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const latencyMs = Math.round(performance.now() - start);
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      return { name, url, status: 'ok', latencyMs, detail: body.status ?? 'healthy' };
    }
    return { name, url, status: 'error', latencyMs, detail: `HTTP ${res.status}` };
  } catch (e: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return { name, url, status: 'error', latencyMs, detail: e instanceof Error ? e.message : 'Connection refused' };
  }
}

const CHECKS = [
  { name: 'API Health', url: `${BASE_URL}/health` },
  { name: 'Profiles endpoint', url: `${BASE_URL}/profiles/` },
  { name: 'Model Status', url: `${BASE_URL}/model/status` },
];

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<HealthCheck[]>(CHECKS.map(c => ({ ...c, status: 'pending' })));
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = async () => {
    setRunning(true);
    const results = await Promise.all(CHECKS.map(c => checkEndpoint(c.name, c.url)));
    setChecks(results);
    setLastRun(new Date());
    setRunning(false);
  };

  useEffect(() => { runChecks(); }, []);

  const allOk = checks.every(c => c.status === 'ok');
  const hasError = checks.some(c => c.status === 'error');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <HeartPulse size={26} className="text-orange-400" />
            System Health
          </h1>
          <p className="text-slate-400 text-sm mt-1">Backend connectivity and runtime checks — admin only.</p>
        </div>
        <button onClick={runChecks} disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm transition-all">
          <RefreshCw size={14} className={cn(running && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Overall status */}
      <div className={cn('px-5 py-4 rounded-xl border font-medium text-sm flex items-center gap-2',
        allOk ? 'bg-green-500/10 border-green-500/20 text-green-400' :
        hasError ? 'bg-red-500/10 border-red-500/20 text-red-400' :
        'bg-slate-500/10 border-slate-500/20 text-slate-400')}>
        {allOk ? <CheckCircle2 size={16} /> : hasError ? <XCircle size={16} /> : <Loader2 size={16} className="animate-spin" />}
        {allOk ? 'All systems operational' : hasError ? 'One or more checks failed' : 'Checking…'}
        {lastRun && <span className="ml-auto text-xs opacity-60">Last checked {lastRun.toLocaleTimeString()}</span>}
      </div>

      {/* Check results */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/3 text-xs text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Check</th>
              <th className="text-left px-5 py-3 font-medium">Endpoint</th>
              <th className="text-center px-5 py-3 font-medium">Status</th>
              <th className="text-center px-5 py-3 font-medium">Latency</th>
              <th className="text-left px-5 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {checks.map(c => (
              <tr key={c.name}>
                <td className="px-5 py-3 text-white font-medium">{c.name}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs truncate max-w-[160px]">{c.url.replace(BASE_URL, '')}</td>
                <td className="px-5 py-3 text-center">
                  {c.status === 'ok' ? <CheckCircle2 size={16} className="text-green-400 mx-auto" /> :
                   c.status === 'error' ? <XCircle size={16} className="text-red-400 mx-auto" /> :
                   <Loader2 size={16} className="text-slate-500 mx-auto animate-spin" />}
                </td>
                <td className="px-5 py-3 text-center text-slate-400 text-xs">
                  {c.latencyMs != null ? `${c.latencyMs}ms` : '—'}
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">{c.detail ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-5 space-y-2">
        <h3 className="text-white font-semibold text-sm">Environment</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">API Base URL</span>
            <span className="text-slate-300 font-mono">{BASE_URL}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">App Version</span>
            <span className="text-slate-300">v0.1.0 — Local MVP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Auth Mode</span>
            <span className="text-orange-300">localStorage (MVP only)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
