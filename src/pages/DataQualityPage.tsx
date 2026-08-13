import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { DataQualityReport } from '../types';

export const DataQualityPage: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQualityReport();
  }, []);

  const fetchQualityReport = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/dataset/quality');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Failed to load quality report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Automated Data Quality & Health Audit Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates completeness, duplicate records, datetime formatting, fare sanity, and coordinate boundaries.
          </p>
        </div>

        <button
          onClick={fetchQualityReport}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quality Score Gauge Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overall Dataset Health Score
            </span>

            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeDasharray={`${report.score}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{report.score}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">out of 100</span>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              report.status === 'Excellent' || report.status === 'Good'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {report.status} Quality Grade
            </span>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              {report.summary}
            </p>
          </div>

          {/* Quality Audit Checks Checklist */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Automated Audit Checklist ({report.checks.length} Audits Run)</span>
            </h3>

            <div className="space-y-3">
              {report.checks.map((c, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3">
                    {c.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {c.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                    {c.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{c.check}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">({c.category})</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{c.details}</p>
                    </div>
                  </div>

                  {c.scoreImpact > 0 && (
                    <span className="font-mono text-rose-400 font-bold shrink-0">
                      -{c.scoreImpact} pts
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Sanitization Recommendations */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Sanitization & Cleaning Recommendations
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {report.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
