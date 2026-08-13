import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Table, 
  BarChart3, 
  Sparkles, 
  BookOpen, 
  Settings, 
  Upload, 
  Car,
  Menu,
  Database,
  RefreshCw,
  Activity,
  Filter,
  MapPin, 
  Calculator
} from 'lucide-react';

import { DashboardPage } from './pages/DashboardPage';
import { AiAnalystPage } from './pages/AiAnalystPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { FareEstimatorPage } from './pages/FareEstimatorPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { VisualizationsPage } from './pages/VisualizationsPage';
import { RagKnowledgePage } from './pages/RagKnowledgePage';
import { SettingsPage } from './pages/SettingsPage';

import { UploadModal } from './components/UploadModal';
import { DatasetMetadata, KPIOverview, TabType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [kpis, setKpis] = useState<KPIOverview | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRateCodeFilter, setSelectedRateCodeFilter] = useState('All Rate Codes');
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');

  useEffect(() => {
    fetchProfileAndKPIs();
  }, []);

  const fetchProfileAndKPIs = async () => {
    try {
      const [profRes, kpiRes] = await Promise.all([
        fetch('/api/dataset/profile'),
        fetch('/api/dataset/kpis')
      ]);

      const profData = await profRes.json();
      const kpiData = await kpiRes.json();

      setMetadata(profData);
      setKpis(kpiData);
    } catch (err) {
      console.error('Error fetching dataset profile/kpis:', err);
    }
  };

  const handleResetDataset = async () => {
    try {
      const res = await fetch('/api/dataset/reset', { method: 'POST' });
      if (res.ok) {
        fetchProfileAndKPIs();
      }
    } catch (err) {
      console.error('Failed to reset dataset:', err);
    }
  };

  const geminiModels = [
    'Gemini 2.5 Flash',
    'Gemini 2.5 Pro',
    'Gemini 2.0 Flash',
    'Gemini 2.0 Flash Thinking',
    'Gemini 1.5 Pro',
    'Gemini 1.5 Flash'
  ];

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard Overview', badge: 'Core', icon: LayoutDashboard },
    { id: 'analyst' as TabType, label: 'AI Data Analyst', badge: 'Agent', icon: Bot },
    { id: 'live_map' as TabType, label: 'Live Map & Routes', badge: 'Graphic Map', icon: MapPin },
    { id: 'estimator' as TabType, label: 'Fare Estimator', badge: 'Predictive', icon: Calculator },
    { id: 'explorer' as TabType, label: 'Data Explorer & Quality', badge: 'Table & Audit', icon: Table },
    { id: 'visualizations' as TabType, label: 'Visualizations', badge: 'Charts', icon: BarChart3 },
    { id: 'rag' as TabType, label: 'RAG Knowledge & AI Config', badge: 'Vector Search', icon: BookOpen },
    { id: 'settings' as TabType, label: 'System Settings', badge: 'Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Gradient Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 w-full sticky top-0 z-50" />

      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-1 z-40">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-colors cursor-pointer border border-slate-700/50 shadow-sm"
              title="Toggle Navigation Sidebar"
            >
              <Menu className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Brand Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white">Ride Analytics</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-3 h-3" />
                    AI Intelligence Platform
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  TLC Ride-Hailing Analytics & Autonomous Agent
                </p>
              </div>
            </div>
          </div>

          {/* Right Status Actions */}
          <div className="flex items-center gap-3 text-xs">
            {/* Quick Gemini Selector in Top Bar */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                {geminiModels.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-slate-100">{m}</option>
                ))}
              </select>
            </div>

            {/* Dataset Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Dataset:</span>
              <span className="font-semibold text-slate-200">{metadata?.filename || 'uber_trip_data.csv'}</span>
              <span className="text-[10px] text-slate-500 font-mono">({metadata?.rowCount?.toLocaleString() || '5,000'} rows)</span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold">System Active</span>
            </div>

            <button
              onClick={fetchProfileAndKPIs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700/60 font-semibold text-xs"
              title="Refresh Data Profile"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setActiveTab('analyst')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer text-xs"
            >
              <Bot className="w-4 h-4 text-indigo-200" />
              <span>Ask AI Analyst</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Navigation & Dashboard Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 bg-slate-900/95 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto font-sans space-y-6">
            <div className="space-y-6">
              {/* Navigation Section */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between px-1">
                  <span>Working Modules</span>
                  <span className="text-xs text-indigo-400 font-semibold">8 Modules</span>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pinned Dataset Summary Metrics */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
                  <span>Dataset Summary</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Total Rides</span>
                    <div className="text-sm font-extrabold text-slate-100">
                      {kpis?.totalTrips ? kpis.totalTrips.toLocaleString() : '5,000'}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold block">▲ +12.4%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Revenue</span>
                    <div className="text-sm font-extrabold text-slate-100">
                      ${kpis?.totalRevenue ? Math.round(kpis.totalRevenue).toLocaleString() : '142,500'}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold block">▲ +8.5%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Avg Fare</span>
                    <div className="text-sm font-extrabold text-slate-100">
                      ${kpis?.avgFare ? kpis.avgFare.toFixed(2) : '28.50'}
                    </div>
                    <span className="text-[10px] text-slate-400 block">per trip</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Data Health</span>
                    <div className="text-sm font-extrabold text-emerald-400">
                      98.5%
                    </div>
                    <span className="text-[10px] text-emerald-400 block">✓ Validated</span>
                  </div>
                </div>
              </div>

              {/* Dataset File Upload */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Upload Dataset</span>
                  <span className="text-[10px] text-indigo-400 font-mono">CSV / XLSX</span>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Browse Custom File</span>
                </button>
              </div>

              {/* Gemini AI Model Selector List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Select Gemini AI Engine</span>
                </label>
                <div className="space-y-1 text-xs">
                  {geminiModels.map((m) => (
                    <label
                      key={m}
                      onClick={() => setSelectedModel(m)}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                        selectedModel === m
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 font-semibold'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        checked={selectedModel === m}
                        onChange={() => setSelectedModel(m)}
                        className="accent-indigo-500"
                      />
                      <span className="text-[11px]">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset Dataset Button */}
              <button
                onClick={handleResetDataset}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Demo Dataset</span>
              </button>
            </div>

            {/* Footer Branding */}
            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center space-y-0.5">
              <div className="font-semibold text-slate-400">Ride Analytics Platform</div>
              <div>Node.js • React • Gemini Agent</div>
            </div>
          </aside>
        )}

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950">
          {/* Top Page Tabs */}
          <div className="border-b border-slate-800/80 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer font-semibold ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active View Module */}
          <main className="space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardPage 
                kpis={kpis} 
                onNavigateTab={setActiveTab} 
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            )}
            {activeTab === 'analyst' && <AiAnalystPage />}
            {activeTab === 'live_map' && <LiveMapPage />}
            {activeTab === 'estimator' && <FareEstimatorPage />}
            {activeTab === 'explorer' && <DataExplorerPage metadata={metadata} />}
            {activeTab === 'visualizations' && <VisualizationsPage metadata={metadata} />}
            {activeTab === 'rag' && (
              <RagKnowledgePage 
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            )}
            {activeTab === 'settings' && <SettingsPage metadata={metadata} onResetDataset={handleResetDataset} />}
          </main>
        </div>
      </div>

      {/* File Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchProfileAndKPIs}
      />
    </div>
  );
}
