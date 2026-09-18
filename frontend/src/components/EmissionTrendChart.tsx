import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendPoint, ForecastPoint } from '../types';
import { formatCO2, formatShortDate } from '../utils/formatters';

interface EmissionTrendChartProps {
  trendData: TrendPoint[];
  forecastData?: ForecastPoint[];
}

export const EmissionTrendChart: React.FC<EmissionTrendChartProps> = ({
  trendData,
  forecastData = [],
}) => {
  const [activeView, setActiveView] = useState<'stacked' | 'total'>('stacked');

  const combinedData = [
    ...trendData.map((t) => ({
      date: t.date,
      total: t.total,
      scope1: t.scope1,
      scope2: t.scope2,
      scope3: t.scope3,
      forecast: null,
      isForecast: false,
    })),
    ...forecastData.map((f) => ({
      date: f.date,
      total: null,
      scope1: null,
      scope2: null,
      scope3: null,
      forecast: f.predicted_emissions,
      isForecast: true,
    })),
  ];

  return (
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Emission Trajectory & Scope Breakdown</h3>
          <p className="text-xs text-slate-400">Historical telemetry + AI 30-day forecast projection</p>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveView('stacked')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              activeView === 'stacked'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scope Stacks
          </button>
          <button
            onClick={() => setActiveView('total')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              activeView === 'total'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Total & Trend
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorScope3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => formatShortDate(v)}
            />
            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3 shadow-2xl text-xs backdrop-blur-md">
                      <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
                      {payload.map((entry: any, i: number) => {
                        if (entry.value === null || entry.value === undefined) return null;
                        return (
                          <div key={i} className="flex items-center justify-between space-x-4 py-0.5">
                            <span className="flex items-center space-x-1.5 text-slate-400">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span>{entry.name}:</span>
                            </span>
                            <span className="font-mono font-medium text-white">
                              {formatCO2(entry.value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

            {activeView === 'stacked' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="scope2"
                  name="Scope 2 (Power)"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="url(#colorScope2)"
                />
                <Area
                  type="monotone"
                  dataKey="scope1"
                  name="Scope 1 (Direct)"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="url(#colorScope1)"
                />
                <Area
                  type="monotone"
                  dataKey="scope3"
                  name="Scope 3 (Supply)"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="url(#colorScope3)"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="total"
                name="Historical Total"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorTotal)"
              />
            )}

            {forecastData.length > 0 && (
              <Area
                type="monotone"
                dataKey="forecast"
                name="AI Forecast (Projection)"
                stroke="#06b6d4"
                strokeDasharray="4 4"
                strokeWidth={2}
                fill="url(#colorForecast)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
