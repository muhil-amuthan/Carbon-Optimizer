import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
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
  const [activeView, setActiveView] = useState<'total' | 'stacked'>('total');

  // Compute a baseline (e.g. rolling reference baseline 10% above average or first point)
  const baseValue = trendData.length > 0 ? Math.round(trendData[0].total * 1.08) : 15000;

  const combinedData = [
    ...trendData.map((t) => ({
      date: t.date,
      total: t.total,
      baseline: baseValue,
      scope1: t.scope1,
      scope2: t.scope2,
      scope3: t.scope3,
      forecast: null,
    })),
    ...forecastData.map((f) => ({
      date: f.date,
      total: null,
      baseline: baseValue,
      scope1: null,
      scope2: null,
      scope3: null,
      forecast: f.predicted_emissions,
    })),
  ];

  return (
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#1A2E24]">Carbon Emission Trend</h3>
          <p className="text-xs text-[#768E82]">Monthly emission performance vs industrial baseline</p>
        </div>
        <div className="flex items-center space-x-1 bg-[#F0F4F1] p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveView('total')}
            className={`px-3 py-1 rounded-md transition-colors font-medium ${
              activeView === 'total'
                ? 'bg-white text-[#168A5B] font-semibold shadow-xs'
                : 'text-[#486255] hover:text-[#1A2E24]'
            }`}
          >
            Actual vs Baseline
          </button>
          <button
            onClick={() => setActiveView('stacked')}
            className={`px-3 py-1 rounded-md transition-colors font-medium ${
              activeView === 'stacked'
                ? 'bg-white text-[#168A5B] font-semibold shadow-xs'
                : 'text-[#486255] hover:text-[#1A2E24]'
            }`}
          >
            Scope Breakdown
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="ecoTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#168A5B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#168A5B" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="ecoForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="scope1Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="scope2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="scope3Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAEFEA" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#768E82"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E3E9E5' }}
              tickFormatter={(v) => formatShortDate(v)}
            />
            <YAxis
              stroke="#768E82"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E3E9E5' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg bg-white border border-[#E3E9E5] p-3 shadow-lg text-xs">
                      <p className="font-semibold text-[#1A2E24] mb-1.5">{label}</p>
                      {payload.map((entry: any, i: number) => {
                        if (entry.value === null || entry.value === undefined) return null;
                        return (
                          <div key={i} className="flex items-center justify-between space-x-3 py-0.5">
                            <span className="flex items-center space-x-1.5 text-[#486255]">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span>{entry.name}:</span>
                            </span>
                            <span className="font-mono font-medium text-[#1A2E24]">
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
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />

            {activeView === 'total' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Actual Emissions"
                  stroke="#168A5B"
                  strokeWidth={2.5}
                  fill="url(#ecoTotal)"
                  activeDot={{ r: 5, fill: '#168A5B' }}
                />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="Baseline Target"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                {forecastData.length > 0 && (
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    name="Projected Trend"
                    stroke="#0D9488"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    fill="url(#ecoForecast)"
                  />
                )}
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="scope2"
                  name="Scope 2 (Electricity)"
                  stackId="1"
                  stroke="#2563EB"
                  strokeWidth={1.5}
                  fill="url(#scope2Grad)"
                />
                <Area
                  type="monotone"
                  dataKey="scope1"
                  name="Scope 1 (Direct Fuel)"
                  stackId="1"
                  stroke="#D97706"
                  strokeWidth={1.5}
                  fill="url(#scope1Grad)"
                />
                <Area
                  type="monotone"
                  dataKey="scope3"
                  name="Scope 3 (Supply Chain)"
                  stackId="1"
                  stroke="#7C3AED"
                  strokeWidth={1.5}
                  fill="url(#scope3Grad)"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
