import React, { useState, useEffect } from 'react';
import { GridStatusCard } from '../components/GridStatusCard';
import { gridApi } from '../api/gridApi';
import { GridIntensity, OptimalWindow, HourlyIntensity, WeeklyForecast } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { Zap, Calendar, Radio, Activity } from 'lucide-react';
import { formatCI, getCIColor } from '../utils/formatters';

interface AutomationProps {
  factoryId: string;
}

export const Automation: React.FC<AutomationProps> = () => {
  const [grid, setGrid] = useState<GridIntensity | null>(null);
  const [optimalWindows, setOptimalWindows] = useState<OptimalWindow[]>([]);
  const [hourly, setHourly] = useState<HourlyIntensity[]>([]);
  const [weekly, setWeekly] = useState<WeeklyForecast[]>([]);

  useEffect(() => {
    gridApi.getCurrent().then(setGrid).catch(() => {});
    gridApi.getOptimalWindow().then(setOptimalWindows).catch(() => {});
    gridApi.getHourlyForecast().then(setHourly).catch(() => {});
    gridApi.getWeeklyForecast().then(setWeekly).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Grid Telemetry & Smart Load Automation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Dynamic demand-response scheduling synchronized with regional power grid emissions
        </p>
      </div>

      {/* Main Grid Telemetry and IoT Switcher */}
      {grid && <GridStatusCard grid={grid} optimalWindows={optimalWindows} />}

      {/* 24-Hour Intensity Profile Chart */}
      <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">24-Hour Carbon Intensity Forecast</h3>
            <p className="text-xs text-slate-400">Green shading indicates optimal low-emission operational windows</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" />
              <span>Clean Shift (02:00 - 06:00)</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[200, 600]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value as number;
                    return (
                      <div className="rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs shadow-xl font-mono">
                        <p className="text-slate-300 font-sans">{label}</p>
                        <p className="text-emerald-400 font-bold mt-0.5">{formatCI(val)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceArea x1="02:00" x2="06:00" strokeOpacity={0.3} fill="#10b981" fillOpacity={0.15} />
              <Line
                type="monotone"
                dataKey="intensity"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">7-Day Regional Carbon Outlook</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekly.map((day) => (
            <div
              key={day.date}
              className={`p-3 rounded-xl border text-center ${
                day.is_today
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <p className="text-xs font-bold">{day.day_name}</p>
              <p className="text-[10px] text-slate-500 mb-2">{day.date.slice(5)}</p>
              <div className="text-base font-bold font-mono text-white">{day.avg_ci}</div>
              <p className="text-[9px] uppercase text-slate-400">gCO₂/kWh</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
