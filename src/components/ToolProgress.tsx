import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface ToolProgressProps {
  steps?: {
    step: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }[];
}

export const ToolProgress: React.FC<ToolProgressProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1 flex items-center justify-between">
        <span>Agent Execution Plan</span>
        <span className="text-amber-400 font-mono">Gemini Toolchain</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2 text-slate-300">
            {s.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {s.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />}
            {s.status === 'pending' && <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            <span className={s.status === 'running' ? 'text-amber-300 font-medium' : s.status === 'completed' ? 'text-slate-300' : 'text-slate-500'}>
              {s.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
