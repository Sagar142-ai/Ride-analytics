import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'up',
  icon: Icon,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="text-2xl font-black text-slate-100 tracking-tight group-hover:text-indigo-400 transition-colors">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          {trend && (
            <span
              className={`font-semibold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                trendDirection === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : trendDirection === 'down'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {trendDirection === 'up' ? '▲' : trendDirection === 'down' ? '▼' : '•'} {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-400 text-xs truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

