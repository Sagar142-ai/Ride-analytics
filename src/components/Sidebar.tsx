import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Table, 
  BarChart3, 
  BookOpen, 
  Settings,
  MapPin,
  Calculator
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyst', label: 'AI Analyst', icon: Bot, badge: 'Agent' },
    { id: 'live_map', label: 'Live Map', icon: MapPin },
    { id: 'estimator', label: 'Fare Estimator', icon: Calculator },
    { id: 'explorer', label: 'Data Explorer & Quality', icon: Table },
    { id: 'visualizations', label: 'Visualizations', icon: BarChart3 },
    { id: 'rag', label: 'RAG Knowledge', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between py-4 shrink-0">
      <div className="px-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-500/20 text-indigo-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 mx-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 font-medium">Model Engine</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="font-semibold text-slate-200">Gemini 2.5 Flash</div>
        <p className="text-[10px] text-slate-500 mt-0.5">Autonomous Agent & RAG Hybrid</p>
      </div>
    </aside>
  );
};
