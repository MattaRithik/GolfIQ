'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Database,
  Upload,
  Play,
  Brain,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Server,
} from 'lucide-react';
import { getDataStatus, uploadDataset, processDatasets, trainModel, getModelStatus } from '@/lib/api';
import type { DataStatus, ModelStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

type ProcessStatus = 'idle' | 'loading' | 'success' | 'error';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  status?: ProcessStatus;
  icon: React.ElementType;
  label: string;
  loadingLabel?: string;
  color?: string;
}

function ActionButton({ onClick, disabled, status, icon: Icon, label, loadingLabel, color = 'bg-green-500 hover:bg-green-400' }: ActionButtonProps) {
  const busy = status === 'loading';
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        'inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-all text-white',
        disabled || busy ? 'opacity-50 cursor-not-allowed bg-slate-700' : color
      )}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
      {busy ? (loadingLabel ?? 'Processing...') : label}
    </button>
  );
}

function FileListCard({
  title,
  icon: Icon,
  iconColor,
  files,
  emptyText,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  files: string[];
  emptyText: string;
}) {
  const exists = files.length > 0;
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className={iconColor} />
          <span className="text-white font-medium text-sm">{title}</span>
        </div>
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', exists ? 'bg-green-500' : 'bg-red-500')} />
      </div>
      {exists ? (
        <div className="space-y-1 text-xs text-slate-400">
          <div>Files: <span className="text-white">{files.length}</span></div>
          {files.slice(0, 3).map(f => (
            <div key={f} className="text-slate-600 truncate">{f}</div>
          ))}
          {files.length > 3 && (
            <div className="text-slate-700 text-[11px]">+{files.length - 3} more</div>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-600">{emptyText}</div>
      )}
    </div>
  );
}

export default function DataPage() {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<ProcessStatus>('idle');
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [trainStatus, setTrainStatus] = useState<ProcessStatus>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [processMsg, setProcessMsg] = useState('');
  const [trainMsg, setTrainMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState('raw');
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadStatus() {
    setLoadingStatus(true);
    const [d, m] = await Promise.all([getDataStatus(), getModelStatus()]);
    setDataStatus(d);
    setModelStatus(m);
    setLoadingStatus(false);
  }

  useEffect(() => { loadStatus(); }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus('loading');
    setUploadMsg('');
    const result = await uploadDataset(selectedFile, datasetType);
    if (result) {
      setUploadStatus('success');
      setUploadMsg(result.message ?? 'File uploaded successfully');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await loadStatus();
    } else {
      setUploadStatus('error');
      setUploadMsg('Upload failed. Is the backend running?');
    }
  };

  const handleProcess = async () => {
    setProcessStatus('loading');
    setProcessMsg('');
    const result = await processDatasets();
    if (result) {
      setProcessStatus('success');
      setProcessMsg(result.message ?? 'Datasets processed successfully');
      await loadStatus();
    } else {
      setProcessStatus('error');
      setProcessMsg('Processing failed. Is the backend running?');
    }
  };

  const handleTrain = async () => {
    setTrainStatus('loading');
    setTrainMsg('');
    const result = await trainModel();
    if (result) {
      setTrainStatus('success');
      setTrainMsg(result.message ?? 'Model trained successfully');
      await loadStatus();
    } else {
      setTrainStatus('error');
      setTrainMsg('Training failed. Is the backend running?');
    }
  };

  const seedFiles = dataStatus?.seed_files ?? [];
  const rawFiles = dataStatus?.raw_files ?? [];
  const processedFiles = dataStatus?.processed_files ?? [];
  const uploaded = dataStatus?.uploaded_datasets ?? [];
  const dbStats = dataStatus?.database_stats ?? {};
  const modelArtifacts = dataStatus?.model_artifacts ?? [];
  const metrics = modelStatus?.metrics ?? {};

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Data Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage benchmark datasets and ML model</p>
        </div>
        <button
          onClick={loadStatus}
          disabled={loadingStatus}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
        >
          <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-yellow-500/8 border border-yellow-500/25 text-yellow-300">
        <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-yellow-400 mb-0.5">MVP Seed Data Disclaimer</div>
          <p className="text-sm text-yellow-300/80 leading-relaxed">
            Demo benchmark data is <strong>MVP seed data for development purposes only</strong> — it is not official golf statistics.
            Benchmark levels (scratch, 5-hdcp, 10-hdcp, etc.) are approximated values used to test the analytics pipeline.
            Do not use these for official handicap purposes or competitive analysis.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database size={14} />
          Dataset Status
        </h2>
        {loadingStatus ? (
          <div className="glass-card p-8 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin text-green-500" />
            Checking data status...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileListCard title="Seed Data" icon={FileText} iconColor="text-blue-400" files={seedFiles} emptyText="No seed data found" />
            <FileListCard title="Raw Data" icon={Upload} iconColor="text-orange-400" files={rawFiles} emptyText="No raw data files" />
            <FileListCard title="Processed Data" icon={Server} iconColor="text-purple-400" files={processedFiles} emptyText="Not yet processed" />
          </div>
        )}
      </div>

      {Object.keys(dbStats).length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Database Statistics</h3>
          <p className="text-slate-500 text-xs mb-5">Current row counts in SQLite</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(dbStats).map(([table, count]) => (
              <div key={table} className="p-3 rounded-lg bg-white/3 border border-white/5">
                <div className="text-xs text-slate-500 capitalize">{table.replace(/_/g, ' ')}</div>
                <div className="font-semibold text-lg text-white mt-1">{count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploaded.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Uploaded Datasets</h3>
          <p className="text-slate-500 text-xs mb-5">User-uploaded files tracked in the database</p>
          <div className="space-y-2">
            {uploaded.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={14} className="text-green-400 flex-shrink-0" />
                  <span className="text-white truncate">{d.filename}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">({(d.file_size_bytes / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                  {d.row_count !== undefined && <span>{d.row_count} rows</span>}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-medium',
                    d.status === 'processed'
                      ? 'bg-green-500/15 text-green-400'
                      : d.status === 'failed'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-blue-500/15 text-blue-400'
                  )}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Upload size={18} className="text-green-400" />
          Upload Dataset
        </h2>
        <p className="text-slate-500 text-xs mb-5">Upload a CSV file to add to the raw data directory</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Dataset Type</label>
              <select
                value={datasetType}
                onChange={e => setDatasetType(e.target.value)}
                className="input-dark"
              >
                <option value="raw">Raw Golf Data</option>
                <option value="benchmark">Benchmark Data</option>
                <option value="tournament">Tournament Data</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">CSV File</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-500/20 file:text-green-400 hover:file:bg-green-500/30 file:cursor-pointer cursor-pointer"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileText size={13} className="text-green-400" />
              Selected: <span className="text-white">{selectedFile.name}</span>
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <div className="flex items-center gap-4">
            <ActionButton
              onClick={handleUpload}
              disabled={!selectedFile}
              status={uploadStatus}
              icon={Upload}
              label="Upload File"
              loadingLabel="Uploading..."
            />
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-green-400 text-sm">
                <CheckCircle size={14} />
                {uploadMsg}
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-400 text-sm">
                <AlertCircle size={14} />
                {uploadMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Play size={18} className="text-blue-400" />
          Data Pipeline
        </h2>
        <p className="text-slate-500 text-xs mb-5">Run processing and model training steps</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl border border-white/8 bg-white/3">
            <div className="text-sm font-semibold text-white mb-1">Step 1: Process Datasets</div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Clean, merge, and feature-engineer raw data into processed format ready for ML training.
            </p>
            <ActionButton
              onClick={handleProcess}
              status={processStatus}
              icon={Play}
              label="Process Datasets"
              loadingLabel="Processing..."
              color="bg-blue-600 hover:bg-blue-500"
            />
            {processStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-green-400 text-xs mt-3">
                <CheckCircle size={12} />
                {processMsg}
              </div>
            )}
            {processStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs mt-3">
                <AlertCircle size={12} />
                {processMsg}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-white/8 bg-white/3">
            <div className="text-sm font-semibold text-white mb-1">Step 2: Train ML Model</div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Train the score prediction model on processed data. Requires Step 1 to be completed first.
            </p>
            <ActionButton
              onClick={handleTrain}
              status={trainStatus}
              icon={Brain}
              label="Train Model"
              loadingLabel="Training..."
              color="bg-purple-600 hover:bg-purple-500"
            />
            {trainStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-green-400 text-xs mt-3">
                <CheckCircle size={12} />
                {trainMsg}
              </div>
            )}
            {trainStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs mt-3">
                <AlertCircle size={12} />
                {trainMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Brain size={18} className="text-purple-400" />
          Model Status
        </h2>
        <p className="text-slate-500 text-xs mb-5">
          {modelStatus?.message ?? 'Current ML model metrics and metadata'}
        </p>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Loading model status...
          </div>
        ) : modelStatus ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="text-xs text-slate-500 mb-1">Status</div>
                <div className={cn('font-semibold text-sm flex items-center gap-1.5', modelStatus.model_loaded ? 'text-green-400' : 'text-slate-400')}>
                  <div className={cn('w-2 h-2 rounded-full', modelStatus.model_loaded ? 'bg-green-400' : 'bg-slate-500')} />
                  {modelStatus.model_loaded ? 'Loaded' : 'Not Loaded'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="text-xs text-slate-500 mb-1">Version</div>
                <div className="font-semibold text-sm text-white truncate">{modelStatus.model_version ?? '—'}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="text-xs text-slate-500 mb-1">Last Trained</div>
                <div className="font-semibold text-sm text-white">
                  {modelStatus.last_trained ? new Date(modelStatus.last_trained).toLocaleDateString() : '—'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="text-xs text-slate-500 mb-1">Training Samples</div>
                <div className="font-semibold text-sm text-white">
                  {modelStatus.training_samples?.toLocaleString() ?? '—'}
                </div>
              </div>
            </div>
            {Object.keys(metrics).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {Object.entries(metrics).map(([key, val]) => (
                  <div key={key} className="p-4 rounded-xl bg-white/3 border border-white/8">
                    <div className="text-xs text-slate-500 mb-1 uppercase">{key}</div>
                    <div className="font-semibold text-sm text-green-400">
                      {typeof val === 'number' ? val.toFixed(3) : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {modelArtifacts.length > 0 && (
              <div className="mt-4 text-xs text-slate-500">
                Artifacts: {modelArtifacts.join(', ')}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
            <AlertCircle size={16} />
            No model status available — backend may not be running
          </div>
        )}
      </div>
    </div>
  );
}
