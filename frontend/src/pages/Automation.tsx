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
import { Calendar } from 'lucide-react';
import { formatCI } from '../utils/formatters';

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
      <div className="border-b border-[#E3E9E5] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#1A2E24]">
          Grid Telemetry & Smart Load Automation
        </h1>
        <p className="text-xs text-[#768E82] mt-0.5">
          Dynamic demand-response scheduling synchronized with regional power grid emissions
        </p>
      </div>

      {/* Main Grid Telemetry and IoT Switcher */}
      {grid && <GridStatusCard grid={grid} optimalWindows={optimalWindows} />}

      {/* 24-Hour Intensity Profile Chart */}
      <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1A2E24]">24-Hour Carbon Intensity Forecast</h3>
            <p className="text-xs text-[#768E82]">Green shading indicates optimal low-emission operational windows</p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center space-x-1.5 text-[#486255]">
              <span className="w-2.5 h-2.5 rounded bg-[#D1FAE5] border border-[#168A5B]" />
              <span>Clean Operating Window (02:00 - 06:00)</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEFEA" vertical={false} />
              <XAxis dataKey="hour" stroke="#768E82" fontSize={11} tickLine={false} axisLine={{ stroke: '#E3E9E5' }} />
              <YAxis stroke="#768E82" fontSize={11} domain={[200, 600]} tickLine={false} axisLine={{ stroke: '#E3E9E5' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value as number;
                    return (
                      <div className="rounded-lg bg-white border border-[#E3E9E5] p-2.5 text-xs shadow-md font-mono">
                        <p className="text-[#768E82] font-sans">{label}</p>
                        <p className="text-[#168A5B] font-bold mt-0.5">{formatCI(val)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceArea x1="02:00" x2="06:00" strokeOpacity={0.2} fill="#168A5B" fillOpacity={0.08} />
              <Line
                type="monotone"
                dataKey="intensity"
                stroke="#168A5B"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#168A5B' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-[#168A5B]" />
          <h3 className="text-base font-semibold text-[#1A2E24]">7-Day Regional Carbon Outlook</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {weekly.map((day) => (
            <div
              key={day.date}
              className={`p-3 rounded-lg border text-center ${
                day.is_today
                  ? 'bg-[#EBF5F0] border-[#168A5B] text-[#1A2E24]'
                  : 'bg-[#F7FAF8] border-[#E3E9E5] text-[#1A2E24]'
              }`}
            >
              <p className="text-xs font-semibold">{day.day_name}</p>
              <p className="text-[10px] text-[#768E82] mb-1">{day.date.slice(5)}</p>
              <div className="text-base font-bold font-mono text-[#1A2E24]">{day.avg_ci}</div>
              <p className="text-[9px] uppercase text-[#768E82]">gCO₂/kWh</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
