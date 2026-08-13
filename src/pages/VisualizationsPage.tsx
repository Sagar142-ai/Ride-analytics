import React, { useEffect, useState } from 'react';
import { BarChart3, Sliders, LineChart, PieChart, Sparkles } from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { DatasetMetadata } from '../types';

interface VisualizationsPageProps {
  metadata: DatasetMetadata | null;
}

export const VisualizationsPage: React.FC<VisualizationsPageProps> = ({ metadata }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<'line' | 'bar' | 'area' | 'pie'>('bar');
  const [selectedX, setSelectedX] = useState<string>('pickup_location');
  const [selectedY, setSelectedY] = useState<string>('fare_amount');
  const [customChartData, setCustomChartData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dataset/insights')
      .then(r => r.json())
      .then(data => setInsights(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Generate custom chart data from dataset records based on X & Y selection
    fetch(`/api/dataset/records?limit=100`)
      .then(r => r.json())
      .then(res => {
        const records = res.records || [];
        const aggMap: Record<string, number> = {};
        records.forEach((r: any) => {
          const xVal = String(r[selectedX] || 'Other');
          const yVal = Number(r[selectedY]) || 1;
          aggMap[xVal] = (aggMap[xVal] || 0) + yVal;
        });

        const formatted = Object.entries(aggMap)
          .slice(0, 10)
          .map(([x, y]) => ({ x, y: Number(y.toFixed(2)) }));

        setCustomChartData(formatted);
      });
  }, [selectedX, selectedY]);

  const monthlyInsight = insights.find(i => i.id === 'ins-demand-peak');
  const locInsight = insights.find(i => i.id === 'ins-location-hub');
  const hourInsight = insights.find(i => i.id === 'ins-peak-hour');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Visualization Studio & Multi-Dimension Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive chart suite for spatial-temporal ride-hailing demand patterns, fare yields, and peak trip distributions.
          </p>
        </div>
      </div>

      {/* Custom Interactive Chart Builder Section */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Interactive Custom Chart Builder</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Dimension (X-Axis)</label>
            <select
              value={selectedX}
              onChange={(e) => setSelectedX(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              {metadata?.columns.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Metric (Y-Axis Aggregation)</label>
            <select
              value={selectedY}
              onChange={(e) => setSelectedY(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              {metadata?.columns.filter(c => c.type === 'number').map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Chart Format</label>
            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              {(['bar', 'line', 'area', 'pie'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedChartType(type)}
                  className={`flex-1 py-1 rounded-lg text-center font-semibold capitalize transition-colors cursor-pointer ${
                    selectedChartType === type ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <ChartCard
            title={`Custom Aggregation: ${selectedY} by ${selectedX}`}
            type={selectedChartType}
            data={customChartData}
            xAxisKey="x"
            yAxisKey="y"
            height={300}
          />
        </div>
      </div>

      {/* NYC Cross-Borough Origin-Destination Flow Heat Matrix */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>NYC Cross-Borough Flow & Yield Heat Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Origin-to-Destination spatial volume and average trip yield heat density.</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Spatial Flow
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-left">Pickup ↓ / Dropoff →</th>
                <th className="py-2.5 px-3">Manhattan</th>
                <th className="py-2.5 px-3">Queens (JFK/LGA)</th>
                <th className="py-2.5 px-3">Brooklyn</th>
                <th className="py-2.5 px-3">Bronx</th>
                <th className="py-2.5 px-3">Staten Island</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-300 bg-slate-950/60">Manhattan</td>
                <td className="p-2.5 bg-indigo-950/80 text-indigo-200 border border-indigo-900/40">1,840 trips ($21.50)</td>
                <td className="p-2.5 bg-emerald-950/90 text-emerald-200 border border-emerald-900/40 font-black">940 trips ($68.00)</td>
                <td className="p-2.5 bg-indigo-900/60 text-indigo-200 border border-indigo-900/40">620 trips ($34.20)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">180 trips ($28.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">45 trips ($52.00)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-300 bg-slate-950/60">Queens (JFK/LGA)</td>
                <td className="p-2.5 bg-emerald-950/90 text-emerald-200 border border-emerald-900/40 font-black">1,120 trips ($72.50)</td>
                <td className="p-2.5 bg-indigo-900/50 text-indigo-200 border border-indigo-900/40">310 trips ($24.00)</td>
                <td className="p-2.5 bg-indigo-900/60 text-indigo-200 border border-indigo-900/40">480 trips ($42.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">110 trips ($38.50)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">28 trips ($78.00)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-300 bg-slate-950/60">Brooklyn</td>
                <td className="p-2.5 bg-indigo-900/60 text-indigo-200 border border-indigo-900/40">780 trips ($29.80)</td>
                <td className="p-2.5 bg-indigo-900/70 text-indigo-200 border border-indigo-900/40">410 trips ($48.00)</td>
                <td className="p-2.5 bg-indigo-950/80 text-indigo-200 border border-indigo-900/40">890 trips ($18.50)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">65 trips ($41.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">32 trips ($45.00)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-300 bg-slate-950/60">Bronx</td>
                <td className="p-2.5 bg-indigo-900/40 text-indigo-300 border border-indigo-900/40">210 trips ($32.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">95 trips ($44.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">70 trips ($46.00)</td>
                <td className="p-2.5 bg-indigo-900/50 text-indigo-300 border border-indigo-900/40">340 trips ($16.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-500 border border-slate-800">12 trips ($85.00)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-300 bg-slate-950/60">Staten Island</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">52 trips ($58.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">35 trips ($82.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-400 border border-slate-800">42 trips ($48.00)</td>
                <td className="p-2.5 bg-slate-950 text-slate-500 border border-slate-800">15 trips ($88.00)</td>
                <td className="p-2.5 bg-indigo-900/50 text-indigo-300 border border-indigo-900/40">190 trips ($15.00)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-built Analytical Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Demand Acceleration"
          subtitle="Total trips aggregated by month"
          type="line"
          data={monthlyInsight?.chartData || [
            { x: 'Jan', y: 48 }, { x: 'Feb', y: 52 }, { x: 'Mar', y: 64 },
            { x: 'Apr', y: 71 }, { x: 'May', y: 85 }, { x: 'Jun', y: 110 }
          ]}
          xAxisKey="x"
          yAxisKey="y"
          colors={['#f59e0b']}
          height={260}
        />

        <ChartCard
          title="Geographic Location Origination Share"
          subtitle="Top pickup zones market share"
          type="pie"
          data={locInsight?.chartData || [
            { x: 'Midtown', y: 92 }, { x: 'JFK Airport', y: 78 }, { x: 'Fin District', y: 65 },
            { x: 'Williamsburg', y: 54 }, { x: 'LaGuardia', y: 46 }
          ]}
          xAxisKey="x"
          yAxisKey="y"
          colors={['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']}
          height={260}
        />

        <ChartCard
          title="24-Hour Trip Density & Surge Hours"
          subtitle="Pickups per hour of day"
          type="bar"
          data={hourInsight?.chartData || [
            { x: '8 AM', y: 24 }, { x: '12 PM', y: 18 }, { x: '5 PM', y: 42 },
            { x: '6 PM', y: 58 }, { x: '7 PM', y: 49 }, { x: '10 PM', y: 31 }
          ]}
          xAxisKey="x"
          yAxisKey="y"
          colors={['#10b981']}
          height={260}
        />

        <ChartCard
          title="Passenger Capacity Distribution"
          subtitle="Frequency breakdown of passenger counts"
          type="area"
          data={[
            { x: '1 Pax', y: 180 }, { x: '2 Pax', y: 110 },
            { x: '3 Pax', y: 65 }, { x: '4 Pax', y: 45 }
          ]}
          xAxisKey="x"
          yAxisKey="y"
          colors={['#8b5cf6']}
          height={260}
        />
      </div>
    </div>
  );
};
