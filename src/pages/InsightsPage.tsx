import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { InsightItem, AnomalyItem } from '../types';

export const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [insRes, anomRes] = await Promise.all([
        fetch('/api/dataset/insights'),
        fetch('/api/dataset/anomalies')
      ]);

      const insData = await insRes.json();
      const anomData = await anomRes.json();

      setInsights(insData || []);
      setAnomalies(anomData || []);
    } catch (err) {
      console.error('Failed to load insights/anomalies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Automated AI Insights & Statistical Anomaly Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Autonomous pattern detection across demand spikes, pricing outliers, location dependencies, and dataset health anomalies.
        </p>
      </div>

      {/* AI Insights Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Automated Dataset Key Findings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins) => (
            <div key={ins.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {ins.category}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  ins.impact === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {ins.impact} Impact
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100">{ins.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{ins.summary}</p>
                <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  {ins.detail}
                </p>
              </div>

              {ins.metric && (
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                  <span className="text-slate-500 font-medium">Quantified Metric:</span>
                  <span className="font-bold text-emerald-400">{ins.metric}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Detection Engine Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Statistical Anomaly Detection (IQR & Z-Score)</span>
          </h3>
          <span className="text-xs text-slate-400">
            {anomalies.length} anomalies detected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {anomalies.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No severe statistical anomalies or negative fare outliers detected in dataset.</span>
            </div>
          ) : (
            anomalies.map((anom) => (
              <div key={anom.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    anom.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{anom.type}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        anom.severity === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {anom.severity} Severity
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{anom.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0 sm:self-center self-end">
                  <div>
                    <span className="block text-[10px] text-slate-500">Recorded Value</span>
                    <span className="font-mono font-bold text-rose-400">{anom.value}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="block text-[10px] text-slate-500">Expected Normal</span>
                    <span className="font-mono text-slate-300">{anom.expectedRange}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
