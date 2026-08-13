import React, { useState } from 'react';
import { Settings, Cpu, Database, RefreshCw, Key, Shield, Check, Trash2, AlertCircle } from 'lucide-react';
import { DatasetMetadata } from '../types';

interface SettingsPageProps {
  metadata: DatasetMetadata | null;
  onResetDataset: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ metadata, onResetDataset }) => {
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSaveSettings = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span>System & AI Engine Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure Gemini model parameters, dataset storage engines, and RAG retrieval thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Agent Configuration Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Gemini AI Engine Configuration</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Model Alias</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fastest & Multi-Tool)</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Low Latency)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning & Large Context)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Temperature (Sampling Creativity)</span>
                <span className="font-mono text-amber-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Lower values (0.1 - 0.2) yield deterministic SQL & math queries.</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Max Generation Tokens</span>
                <span className="font-mono text-amber-400">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="512"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              {savedStatus ? <Check className="w-4 h-4 text-slate-950" /> : <Settings className="w-4 h-4" />}
              <span>{savedStatus ? 'Settings Applied!' : 'Save AI Settings'}</span>
            </button>
          </div>
        </div>

        {/* Dataset & Memory Management Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Dataset & In-Memory Engine</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Dataset Name</span>
              <div className="font-bold text-slate-200">{metadata?.filename || 'uber_trip_data.csv'}</div>
              <div className="text-[10px] text-slate-400">
                {metadata?.rowCount ? metadata.rowCount.toLocaleString() : '0'} rows • {metadata?.columns?.length || 0} columns
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Storage Layer Status</span>
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Pandas In-Memory DataFrame + SQLite Cache</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onResetDataset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer w-full justify-center"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset to Default Kaggle TLC Dataset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* App URLs & Deployment Endpoints Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Key className="w-4 h-4 text-indigo-400" />
          <span>Application URLs & Hosted Service Endpoints</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Development App URL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active Dev</span>
            </div>
            <p className="font-mono text-slate-200 text-[11px] break-all select-all bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              https://ais-dev-cps2vthuvk4cikmgobbr57-692365029299.asia-southeast1.run.app
            </p>
            <a
              href="https://ais-dev-cps2vthuvk4cikmgobbr57-692365029299.asia-southeast1.run.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline font-semibold text-[11px] mt-1"
            >
              <span>Open Development Link</span>
              <span>↗</span>
            </a>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Shared Preview App URL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Public Share</span>
            </div>
            <p className="font-mono text-slate-200 text-[11px] break-all select-all bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              https://ais-pre-cps2vthuvk4cikmgobbr57-692365029299.asia-southeast1.run.app
            </p>
            <a
              href="https://ais-pre-cps2vthuvk4cikmgobbr57-692365029299.asia-southeast1.run.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline font-semibold text-[11px] mt-1"
            >
              <span>Open Shared Preview Link</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
