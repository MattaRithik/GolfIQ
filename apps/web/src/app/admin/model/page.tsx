'use client';

import { useEffect, useState } from 'react';
import { Brain, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { getModelStatus, trainModel } from '@/lib/api';
import type { ModelStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AdminModelPage() {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState('');
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    const s = await getModelStatus();
    setStatus(s);
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleTrain = async () => {
    setTraining(true);
    setTrainResult('');
    setError('');
    const result = await trainModel();
    if (result) {
      setTrainResult(result.message ?? 'Training complete.');
    } else {
      setError('Training failed — check backend logs.');
    }
    setTraining(false);
    fetchStatus();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Brain size={26} className="text-purple-400" />
          Model Status
        </h1>
        <p className="text-slate-400 text-sm mt-1">ML model management — admin only.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          Loading model status…
        </div>
      ) : status ? (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            {status.model_loaded
              ? <CheckCircle2 size={20} className="text-green-400" />
              : <XCircle size={20} className="text-slate-500" />}
            <div>
              <div className="text-white font-semibold">{status.model_loaded ? 'Model loaded' : 'No model loaded'}</div>
              <div className="text-xs text-slate-400 mt-0.5">{status.message}</div>
            </div>
          </div>
          {status.model_version && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <div className="text-xs text-slate-500">Version</div>
                <div className="text-sm text-white font-mono mt-0.5">{status.model_version}</div>
              </div>
              {status.last_trained && (
                <div>
                  <div className="text-xs text-slate-500">Last Trained</div>
                  <div className="text-sm text-white mt-0.5">{status.last_trained}</div>
                </div>
              )}
              {status.training_samples != null && (
                <div>
                  <div className="text-xs text-slate-500">Training Samples</div>
                  <div className="text-sm text-white mt-0.5">{status.training_samples}</div>
                </div>
              )}
              {status.metrics && (
                <div>
                  <div className="text-xs text-slate-500">Metrics</div>
                  <div className="text-sm font-mono text-white mt-0.5">{JSON.stringify(status.metrics, null, 0)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-6">
          <AlertCircle size={16} />
          Could not connect to backend to get model status.
        </div>
      )}

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-white font-semibold">Train / Retrain Model</h2>
        <p className="text-slate-400 text-sm">
          Trains on all stored rounds. Requires at least 5 rounds in the database.
        </p>
        <button
          onClick={handleTrain}
          disabled={training}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all',
            training ? 'bg-purple-500/40 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-400'
          )}
        >
          {training ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {training ? 'Training…' : 'Train Model'}
        </button>
        {trainResult && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle2 size={14} /> {trainResult}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
