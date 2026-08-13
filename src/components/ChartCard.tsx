import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  seriesKeys?: string[];
  colors?: string[];
  height?: number;
  actionButton?: React.ReactNode;
}

const DEFAULT_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  type,
  data,
  xAxisKey,
  yAxisKey,
  seriesKeys,
  colors = DEFAULT_COLORS,
  height = 280,
  actionButton
}) => {
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-slate-500">
          No visualization data available for chart rendering.
        </div>
      );
    }

    // Auto-resolve x and y keys if specified key isn't in dataset objects
    let effectiveXKey = xAxisKey;
    let effectiveYKey = yAxisKey;
    if (data && data.length > 0 && data[0]) {
      const item = data[0];
      if (!(effectiveXKey in item)) {
        if ('month' in item) effectiveXKey = 'month';
        else if ('name' in item) effectiveXKey = 'name';
        else if ('hour' in item) effectiveXKey = 'hour';
        else if ('x' in item) effectiveXKey = 'x';
        else if ('location' in item) effectiveXKey = 'location';
      }
      if (!(effectiveYKey in item)) {
        if ('trips' in item) effectiveYKey = 'trips';
        else if ('count' in item) effectiveYKey = 'count';
        else if ('y' in item) effectiveYKey = 'y';
        else if ('value' in item) effectiveYKey = 'value';
        else if ('revenue' in item) effectiveYKey = 'revenue';
      }
    }

    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={effectiveXKey} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
            />
            {seriesKeys ? (
              seriesKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2.5} dot={{ r: 3 }} />
              ))
            ) : (
              <Line type="monotone" dataKey={effectiveYKey} stroke={colors[0]} strokeWidth={2.5} dot={{ r: 4, fill: colors[0] }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={effectiveXKey} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
            />
            <Bar dataKey={effectiveYKey} fill={colors[0]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={effectiveXKey} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey={effectiveYKey} stroke={colors[0]} fillOpacity={1} fill="url(#colorGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
            />
            <Pie data={data} dataKey={effectiveYKey} nameKey={effectiveXKey} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actionButton}
      </div>

      <div style={{ height }} className="w-full">
        {renderChart()}
      </div>
    </div>
  );
};
