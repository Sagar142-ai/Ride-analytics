import React, { useEffect, useState } from 'react';
import { FileText, Download, Printer, Sparkles, ShieldCheck, TrendingUp, CheckCircle2, Filter, FileSpreadsheet } from 'lucide-react';
import { ReportContent } from '../types';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<ReportContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [minFare, setMinFare] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reports/generate');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Failed to load executive report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await fetch(`/api/query?sql=${encodeURIComponent(`SELECT * FROM dataset WHERE fare_amount >= ${minFare} LIMIT 1000`)}`);
      const result = await res.json();
      const rows = result.data || [];

      let content = '';
      let filename = `tlc_rides_export_${Date.now()}.${exportFormat}`;
      let mimeType = 'text/csv';

      if (exportFormat === 'json') {
        content = JSON.stringify(rows, null, 2);
        mimeType = 'application/json';
      } else {
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]);
          content += keys.join(',') + '\n';
          rows.forEach((r: any) => {
            content += keys.map(k => JSON.stringify(r[k] ?? '')).join(',') + '\n';
          });
        }
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export dataset:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Executive Analytics Briefing & Custom Dataset Exporter</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auto-generated executive briefing compiling KPIs, seasonal demand trends, spatial hubs, and data export tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Filtered Data Exporter Control Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Custom Filtered Dataset Exporter</span>
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-slate-400 block text-[11px] font-medium mb-1">Export Format:</label>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`px-3 py-1 rounded font-bold text-xs cursor-pointer ${
                    exportFormat === 'csv' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  CSV
                </button>
                <button
                  onClick={() => setExportFormat('json')}
                  className={`px-3 py-1 rounded font-bold text-xs cursor-pointer ${
                    exportFormat === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block text-[11px] font-medium mb-1">Min Fare Filter ($):</label>
              <input
                type="number"
                value={minFare}
                onChange={(e) => setMinFare(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-200 w-28"
              />
            </div>
          </div>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Preparing Download...' : `Export Dataset (${exportFormat.toUpperCase()})`}</span>
          </button>
        </div>
      </div>

      {report && (
        <div id="printable-report" className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-8 shadow-xl text-slate-200">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-1">
                Ride Analytics Dashboard • Confidential Executive Briefing
              </div>
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">{report.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Dataset: <b>{report.datasetName}</b> • Generated on {report.generatedAt}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-2xl">
              🚕
            </div>
          </div>

          {/* Executive Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Executive Briefing</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {report.executiveSummary}
            </p>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {report.kpis.map((kpi, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">{kpi.label}</span>
                <div className="text-lg font-bold text-indigo-400">{kpi.value}</div>
                <span className="text-[10px] text-slate-400">{kpi.detail}</span>
              </div>
            ))}
          </div>

          {/* Major Key Findings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Empirical Analytical Findings</span>
            </h3>

            <div className="space-y-3">
              {report.keyFindings.map((kf, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                  <h4 className="font-bold text-slate-200">{i + 1}. {kf.title}</h4>
                  <p className="text-slate-400 leading-relaxed">{kf.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Overview */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Data Quality & Integrity Audit</span>
            </h3>
            <p className="text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 leading-relaxed">
              {report.qualityOverview}
            </p>
          </div>

          {/* Methodology */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
              Methodology & Analytical Integrity
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              {report.methodology}
            </p>
          </div>

          {/* Strategic Recommendations */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Operational Recommendations</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {report.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

