import React from 'react';
import { Database, Upload, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { DatasetMetadata } from '../types';

interface HeaderProps {
  metadata: DatasetMetadata | null;
  onOpenUpload: () => void;
  onResetDemo: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ metadata, onOpenUpload, onResetDemo, isLoading }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shadow-lg shadow-amber-500/5">
          🚕
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Uber Analytics Intelligence</h1>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              AI Agent Platform
            </span>
          </div>
          <p className="text-xs text-slate-400">Enterprise RAG & Autonomous Data Science Agent</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {metadata && (
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-slate-200 truncate max-w-[160px]">{metadata.name}</span>
              {metadata.isDemo ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DEMO DATASET
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  CUSTOM CSV
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Rows:</span>
              <span className="font-semibold text-slate-200">{metadata.rowCount.toLocaleString()}</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Health:</span>
              <span className="font-semibold text-emerald-400">{metadata.qualityScore}/100</span>
            </div>
          </div>
        )}

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-md shadow-amber-500/10 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Dataset</span>
        </button>

        <button
          onClick={onResetDemo}
          disabled={isLoading}
          title="Reset to synthetic Uber TLC dataset"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
