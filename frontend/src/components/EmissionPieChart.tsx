import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatCO2 } from '../utils/formatters';

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface EmissionPieChartProps {
  data?: PieDataPoint[];
  title?: string;
  totalKg?: number;
}

const DEFAULT_DATA: PieDataPoint[] = [
  { name: 'Scope 2: Electricity', value: 8400, color: '#3b82f6' },
  { name: 'Scope 1: Natural Gas', value: 3100, color: '#f59e0b' },
  { name: 'Scope 1: Diesel', value: 1600, color: '#ef4444' },
  { name: 'Scope 3: Waste & Water', value: 1200, color: '#8b5cf6' },
  { name: 'Scope 3: Logistics', value: 900, color: '#06b6d4' },
];

export const EmissionPieChart: React.FC<EmissionPieChartProps> = ({
  data = DEFAULT_DATA,
  title = 'Emissions by Scope & Source',
  totalKg,
}) => {
  const total = totalKg || data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">Proportional carbon footprint</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
          {formatCO2(total)}
        </span>
      </div>

      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0d1321" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0];
                  const val = p.value as number;
                  const pct = ((val / total) * 100).toFixed(1);
                  return (
                    <div className="rounded-lg bg-slate-900 border border-slate-700 p-2.5 shadow-xl text-xs">
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-emerald-400 font-mono mt-1">
                        {formatCO2(val)} ({pct}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
        {data.map((item, idx) => {
          const pct = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={idx} className="flex items-center justify-between text-slate-300 py-0.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 truncate max-w-[140px] sm:max-w-[170px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-slate-400 text-[11px]">
                <span>{formatCO2(item.value)}</span>
                <span className="text-slate-500">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
