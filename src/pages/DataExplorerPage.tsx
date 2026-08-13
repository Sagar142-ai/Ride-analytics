import React, { useEffect, useState } from 'react';
import { Search, Download, ArrowUpDown, Table, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Layers } from 'lucide-react';
import { DatasetMetadata, DataQualityReport } from '../types';

interface DataExplorerPageProps {
  metadata: DatasetMetadata | null;
}

export const DataExplorerPage: React.FC<DataExplorerPageProps> = ({ metadata }) => {
  const [activeSubTab, setActiveSubTab] = useState<'explorer' | 'quality'>('explorer');

  // Table State
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  // Quality Audit State
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [isQualityLoading, setIsQualityLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchQualityReport();
  }, []);

  const handleCleanDataset = async () => {
    try {
      setIsCleaning(true);
      setCleanMessage(null);
      const res = await fetch('/api/dataset/clean', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCleanMessage(`Successfully remediated ${data.remediatedCount} anomalous records! New Quality Score: ${data.newQualityScore}/100.`);
        fetchQualityReport();
        fetchRecords();
      } else {
        setCleanMessage('Failed to clean dataset.');
      }
    } catch (err) {
      console.error('Clean error:', err);
      setCleanMessage('Error remediating dataset.');
    } finally {
      setIsCleaning(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder
      });

      const res = await fetch(`/api/dataset/records?${queryParams}`);
      const data = await res.json();

      setRecords(data.records || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQualityReport = async () => {
    try {
      setIsQualityLoading(true);
      const res = await fetch('/api/dataset/quality');
      const data = await res.json();
      setQualityReport(data);
    } catch (err) {
      console.error('Failed to load quality report:', err);
    } finally {
      setIsQualityLoading(false);
    }
  };

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const exportToCsv = () => {
    if (records.length === 0) return;
    const keys = Object.keys(records[0]);
    let csv = keys.join(',') + '\n';

    records.forEach(r => {
      const row = keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(',');
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uber_dataset_export_${Date.now()}.csv`;
    a.click();
  };

  const columns = metadata?.columns || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header & Sub-Tab Navigation */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Data Explorer & Quality Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Interactive dataset table viewer, column profiling, full-text record search, and automated dataset quality & health checks.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('explorer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'explorer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Record Explorer</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quality')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'quality'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Data Quality Audit</span>
            {qualityReport && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">
                {qualityReport.score}/100
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: RECORD EXPLORER TABLE */}
      {activeSubTab === 'explorer' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search records by location, ID, payment, base..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Page <b>{page}</b> of <b>{totalPages}</b></span>
                <span className="text-slate-600">|</span>
                <span><b>{totalCount.toLocaleString()}</b> records</span>
              </div>

              <button
                onClick={exportToCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    {columns.map((col) => (
                      <th
                        key={col.name}
                        onClick={() => handleSort(col.name)}
                        className="py-3 px-4 cursor-pointer hover:text-indigo-400 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {isLoading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                        <span>Loading dataset records...</span>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="py-12 text-center text-slate-500 font-sans">
                        No matching records found for "{search}".
                      </td>
                    </tr>
                  ) : (
                    records.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-slate-500 text-[11px] font-sans">{(page - 1) * limit + idx + 1}</td>
                        {columns.map((col) => (
                          <td key={col.name} className="py-2.5 px-4 whitespace-nowrap text-[11px]">
                            {r[col.name] !== null && r[col.name] !== undefined ? String(r[col.name]) : <span className="text-slate-600 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-950/50">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer ${
                        page === pNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DATA QUALITY AUDIT */}
      {activeSubTab === 'quality' && (
        <div className="space-y-6">
          {qualityReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quality Score Gauge Card */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                      strokeDasharray={`${qualityReport.score}, 100`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{qualityReport.score}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">out of 100</span>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  qualityReport.status === 'Excellent' || qualityReport.status === 'Good'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {qualityReport.status} Grade
                </span>

                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  {qualityReport.summary}
                </p>

                {/* Auto-Remediate Anomalies Action */}
                <div className="w-full pt-2">
                  <button
                    onClick={handleCleanDataset}
                    disabled={isCleaning}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isCleaning ? 'Cleaning Anomalies...' : 'Auto-Remediate Anomalies'}</span>
                  </button>
                </div>

                {cleanMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-snug">
                    {cleanMessage}
                  </div>
                )}
              </div>

              {/* Quality Audit Checks Checklist */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Automated Audit Checklist ({qualityReport.checks.length} Audits Run)</span>
                </h3>

                <div className="space-y-3">
                  {qualityReport.checks.map((c, i) => (
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
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                    Sanitization & Cleaning Recommendations
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {qualityReport.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
              <span>Running automated dataset quality audit...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
