import React, { useEffect, useState } from 'react';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Sparkles, 
  ArrowRight,
  Printer,
  FileText,
  X,
  ShieldCheck,
  Download,
  Bot
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { KPIOverview, InsightItem, TabType, ReportContent } from '../types';

interface DashboardPageProps {
  kpis: KPIOverview | null;
  onNavigateTab: (tab: TabType) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  kpis, 
  onNavigateTab,
  selectedModel = 'Gemini 2.5 Flash',
  onModelChange
}) => {
  const DEFAULT_MONTHLY = [
    { month: 'Jan', trips: 320, revenue: 8960, x: 'Jan', y: 320 },
    { month: 'Feb', trips: 380, revenue: 10640, x: 'Feb', y: 380 },
    { month: 'Mar', trips: 450, revenue: 12825, x: 'Mar', y: 450 },
    { month: 'Apr', trips: 510, revenue: 14790, x: 'Apr', y: 510 },
    { month: 'May', trips: 620, revenue: 17980, x: 'May', y: 620 },
    { month: 'Jun', trips: 780, revenue: 22620, x: 'Jun', y: 780 }
  ];

  const DEFAULT_LOCATIONS = [
    { name: 'JFK Airport', count: 1250, x: 'JFK Airport', y: 1250 },
    { name: 'Midtown East', count: 980, x: 'Midtown East', y: 980 },
    { name: 'LaGuardia Airport', count: 820, x: 'LaGuardia Airport', y: 820 },
    { name: 'Financial District', count: 640, x: 'Financial District', y: 640 },
    { name: 'Williamsburg', count: 510, x: 'Williamsburg', y: 510 }
  ];

  const DEFAULT_HOURLY = [
    { hour: '12 AM', count: 120, x: '12 AM', y: 120 },
    { hour: '4 AM', count: 45, x: '4 AM', y: 45 },
    { hour: '8 AM', count: 420, x: '8 AM', y: 420 },
    { hour: '12 PM', count: 310, x: '12 PM', y: 310 },
    { hour: '5 PM', count: 680, x: '5 PM', y: 680 },
    { hour: '6 PM', count: 890, x: '6 PM', y: 890 },
    { hour: '7 PM', count: 750, x: '7 PM', y: 750 },
    { hour: '10 PM', count: 340, x: '10 PM', y: 340 }
  ];

  const [monthlyData, setMonthlyData] = useState<any[]>(DEFAULT_MONTHLY);
  const [topLocations, setTopLocations] = useState<any[]>(DEFAULT_LOCATIONS);
  const [hourlyData, setHourlyData] = useState<any[]>(DEFAULT_HOURLY);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [report, setReport] = useState<ReportContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [chartsRes, insightsRes, reportRes] = await Promise.all([
        fetch('/api/dataset/charts').catch(() => null),
        fetch('/api/dataset/insights').catch(() => null),
        fetch('/api/report').catch(() => null)
      ]);

      if (chartsRes && chartsRes.ok) {
        const chartsData = await chartsRes.json();
        if (chartsData.monthly && chartsData.monthly.length > 0) {
          setMonthlyData(chartsData.monthly);
        }
        if (chartsData.topLocations && chartsData.topLocations.length > 0) {
          setTopLocations(chartsData.topLocations);
        }
        if (chartsData.hourly && chartsData.hourly.length > 0) {
          setHourlyData(chartsData.hourly);
        }
      }

      if (insightsRes && insightsRes.ok) {
        const insightsList = await insightsRes.json();
        setInsights(insightsList);
      }

      if (reportRes && reportRes.ok) {
        const reportData = await reportRes.json();
        setReport(reportData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const geminiModels = [
    'Gemini 2.5 Flash',
    'Gemini 2.5 Pro',
    'Gemini 2.0 Flash',
    'Gemini 2.0 Flash Thinking',
    'Gemini 1.5 Pro',
    'Gemini 1.5 Flash'
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner with Quick Gemini Model Selector */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Autonomous Intelligence Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Ride Analytics Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Real-time TLC ride-hailing performance platform. Spatial-temporal profiling, fare yield analysis, and autonomous Gemini AI insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Quick Gemini Model Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-bold text-slate-400">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange && onModelChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
            >
              {geminiModels.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-slate-100">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Executive Report (PDF / Print)</span>
          </button>

          <button
            onClick={() => onNavigateTab('analyst')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <span>Ask AI Analyst</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Trips Analyzed"
          value={kpis?.totalTrips.toLocaleString() || '0'}
          change="+12.4% vs last period"
          isPositive={true}
          icon={Car}
        />
        <KpiCard
          title="Average Fare Yield"
          value={`$${kpis?.avgFare.toFixed(2) || '0.00'}`}
          change="+3.2% yield optimization"
          isPositive={true}
          icon={DollarSign}
        />
        <KpiCard
          title="Total Platform Revenue"
          value={`$${kpis?.totalRevenue ? Math.round(kpis.totalRevenue).toLocaleString() : '0'}`}
          change="+8.5% total gross"
          isPositive={true}
          icon={TrendingUp}
        />
        <KpiCard
          title="Busiest Demand Hub"
          value={kpis?.busiestLocation || 'JFK Airport'}
          change={`Peak hour: ${kpis?.peakHour || '18:00'}`}
          isPositive={true}
          icon={MapPin}
        />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Trip Demand Volume by Month"
          type="line"
          data={monthlyData}
          xAxisKey="month"
          yAxisKey="trips"
        />
        <ChartCard
          title="Top 5 Pickup Demand Hubs"
          type="bar"
          data={topLocations}
          xAxisKey="name"
          yAxisKey="count"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Hourly Demand Profile (24-Hour Cycle)"
            type="area"
            data={hourlyData}
            xAxisKey="hour"
            yAxisKey="count"
          />
        </div>

        {/* Autonomous AI Insights Sidebar Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Autonomous AI Findings</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {selectedModel}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {insights.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-200">
                    <span>{item.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      item.impact === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('analyst')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors cursor-pointer text-center mt-4"
          >
            Launch Deep AI Analyst Session →
          </button>
        </div>
      </div>

      {/* EXECUTIVE REPORT PRINT / PDF MODAL */}
      {showReportModal && report && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">{report.title}</h3>
                  <p className="text-xs text-slate-400">Generated at {report.generatedAt} • TLC Dataset Briefing</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Executive Summary</span>
                <p className="text-slate-200">{report.executiveSummary}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-200 block mb-2">Key Performance Indicators</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {report.kpis.map((kpi, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">{kpi.label}</span>
                      <span className="text-sm font-extrabold text-emerald-400">{kpi.value}</span>
                      <span className="text-[10px] text-slate-500 block">{kpi.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-200 block mb-2">Key Empirical Findings</span>
                <div className="space-y-2">
                  {report.keyFindings.map((finding, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-indigo-300 block">{finding.title}</span>
                      <p className="text-slate-300 text-[11px]">{finding.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Strategic Recommendations</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Briefing
              </button>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
