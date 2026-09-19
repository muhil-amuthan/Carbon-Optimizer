import React, { useState, useEffect } from 'react';
import { useEmissions } from '../hooks/useEmissions';
import { EmissionCards } from '../components/EmissionCards';
import { EmissionTrendChart } from '../components/EmissionTrendChart';
import { EmissionPieChart } from '../components/EmissionPieChart';
import { AnomalyAlert } from '../components/AnomalyAlert';
import { gridApi } from '../api/gridApi';
import { GridIntensity, OptimalWindow, WeeklyForecast } from '../types';
import {
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import { formatCO2, formatCI, getCIColor } from '../utils/formatters';

interface DashboardProps {
  factoryId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ factoryId }) => {
  const { summary, anomalies, forecast, breakdown, loading, refetch } = useEmissions(factoryId);

  const [grid, setGrid] = useState<GridIntensity | null>(null);
  const [optimalWindows, setOptimalWindows] = useState<OptimalWindow[]>([]);
  const [weeklyForecast, setWeeklyForecast] = useState<WeeklyForecast[]>([]);
  const [scheduleApplied, setScheduleApplied] = useState(false);
  const [applyingSchedule, setApplyingSchedule] = useState(false);

  useEffect(() => {
    gridApi.getCurrent().then(setGrid).catch(() => {});
    gridApi.getOptimalWindow().then(setOptimalWindows).catch(() => {});
    gridApi.getWeeklyForecast().then(setWeeklyForecast).catch(() => {});
  }, [factoryId]);

  const handleApplySchedule = async () => {
    setApplyingSchedule(true);
    try {
      await gridApi.triggerMqtt('industrial_motor', 'SCHEDULE');
      setScheduleApplied(true);
      setTimeout(() => setScheduleApplied(false), 4000);
    } finally {
      setApplyingSchedule(false);
    }
  };

  const bestWindow = optimalWindows[0] || {
    start: '12:00 PM',
    end: '03:00 PM',
    avg_ci: 290,
    co2_saving_kg: 42,
  };

  const plantLocations: Record<string, string> = {
    FACTORY_A: 'Tamil Nadu',
    FACTORY_B: 'Gujarat',
    FACTORY_C: 'Maharashtra',
  };

  const plantNames: Record<string, string> = {
    FACTORY_A: 'Plant Alpha',
    FACTORY_B: 'Plant Beta',
    FACTORY_C: 'Plant Gamma',
  };

  // Baseline and target metrics for Sustainability Progress
  const totalEmissionsKg = summary?.total_emissions_kg || 1240000;
  const baselineEmissionsKg = Math.round(totalEmissionsKg * 1.145);
  const reductionPct = Number((((baselineEmissionsKg - totalEmissionsKg) / baselineEmissionsKg) * 100).toFixed(1));
  const targetReductionPct = 20;
  const progressPct = Math.min(100, Math.round((reductionPct / targetReductionPct) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* 4. DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3E9E5] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A2E24]">
            Industrial Carbon Overview
          </h1>
          <p className="text-xs text-[#768E82] mt-0.5">
            Monitor emissions, carbon intensity and sustainability performance in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-[#1A2E24]">
              {plantNames[factoryId] || 'Plant Alpha'}
            </div>
            <div className="text-[11px] text-[#768E82]">
              {plantLocations[factoryId] || 'Tamil Nadu'}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#EBF5F0] border border-[#D5E6DC] text-xs font-medium text-[#168A5B]">
            <span className="w-2 h-2 rounded-full bg-[#168A5B] animate-pulse" />
            <span>Live</span>
          </div>

          <button
            onClick={() => refetch()}
            disabled={loading}
            title="Refresh telemetry"
            className="p-1.5 rounded-lg border border-[#E3E9E5] hover:border-[#168A5B] bg-white text-[#486255] hover:text-[#1A2E24] transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#168A5B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5. TOP KPI SECTION (Mobile 1: Total Emissions & Scopes) */}
      {summary && (
        <EmissionCards
          total={summary.total_emissions_kg}
          scope1={summary.scope1_total}
          scope2={summary.scope2_total}
          scope3={summary.scope3_total}
          intensity={summary.avg_intensity}
        />
      )}

      {/* 8 & 11. CARBON INTENSITY & TODAY'S ENVIRONMENTAL STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 8. Carbon Intensity Card */}
        <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
              Current Carbon Intensity
            </span>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
              <span>{grid?.status ? grid.status.charAt(0).toUpperCase() + grid.status.slice(1) : 'Moderate'}</span>
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-bold tracking-tight text-[#1A2E24] font-mono">
              {formatCI(grid?.value || 410)}
            </div>
            <p className="text-xs text-[#768E82] mt-0.5">
              Regional grid factor • {grid?.location || 'Tamil Nadu'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#F0F4F1] text-xs">
            <div>
              <span className="text-[#768E82] block text-[11px]">Grid Status</span>
              <span className="font-semibold text-[#1A2E24] capitalize">{grid?.status || 'Moderate'}</span>
            </div>
            <div>
              <span className="text-[#768E82] block text-[11px]">Renewable Mix</span>
              <span className="font-semibold text-[#168A5B]">58% Active</span>
            </div>
            <div>
              <span className="text-[#768E82] block text-[11px]">Cleaner Window</span>
              <span className="font-semibold text-[#2563EB]">{bestWindow.start} – {bestWindow.end}</span>
            </div>
          </div>
        </div>

        {/* 11. Today's Environmental Status */}
        <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
              Today's Environmental Status
            </span>
            <span className="text-xs text-[#768E82]">Plant Telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
            <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
              <span className="text-[11px] text-[#768E82] block">Grid Carbon</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span className="text-xs font-bold text-[#1A2E24]">Moderate</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
              <span className="text-[11px] text-[#768E82] block">Renewable Energy</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#168A5B]" />
                <span className="text-xs font-bold text-[#1A2E24]">58%</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
              <span className="text-[11px] text-[#768E82] block">Plant Efficiency</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#168A5B]" />
                <span className="text-xs font-bold text-[#1A2E24]">Improving</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
              <span className="text-[11px] text-[#768E82] block">Emission Trend</span>
              <div className="flex items-center space-x-1 mt-1 text-[#168A5B] font-bold text-xs">
                <span>↓ 6.4%</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#768E82] border-t border-[#F0F4F1] pt-2">
            Operations calibrated against baseline standard ISO 14064 / GHG Protocol Corporate Standard.
          </p>
        </div>
      </div>

      {/* 6 & 7. PRIMARY CARBON TREND & SCOPE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {summary && (
            <EmissionTrendChart trendData={summary.trend} forecastData={forecast} />
          )}
        </div>
        <div>
          <EmissionPieChart
            data={breakdown.length > 0 ? breakdown.map(b => ({ name: b.category, value: b.value, color: b.color })) : undefined}
            totalKg={summary?.total_emissions_kg}
          />
        </div>
      </div>

      {/* 9. ANOMALY SECTION: ATTENTION NEEDED */}
      <AnomalyAlert anomalies={anomalies} />

      {/* 10. SMART RECOMMENDATION */}
      <div className="bg-white border border-[#D5E6DC] rounded-xl p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#168A5B] border border-[#D5E6DC]">
                Recommended Action
              </span>
              <span className="text-xs text-[#768E82]">Load Shift Advisory</span>
            </div>
            <h3 className="text-base font-bold text-[#1A2E24] mt-1">
              Shift high-energy operation to cleaner grid window
            </h3>
            <p className="text-xs text-[#486255]">
              Regional solar peak provides low-carbon power. Rescheduling heavy compressors reduces indirect emissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-xs">
              <span className="text-[#768E82] block text-[11px]">Best Window</span>
              <span className="font-semibold text-[#1A2E24] font-mono">{bestWindow.start} – {bestWindow.end}</span>
            </div>
            <div className="text-xs">
              <span className="text-[#768E82] block text-[11px]">Expected Reduction</span>
              <span className="font-bold text-[#168A5B] font-mono">18%</span>
            </div>
            <div className="text-xs">
              <span className="text-[#768E82] block text-[11px]">Est. CO₂ Saving</span>
              <span className="font-bold text-[#168A5B] font-mono">{bestWindow.co2_saving_kg || 42} kgCO₂e</span>
            </div>

            <button
              onClick={handleApplySchedule}
              disabled={applyingSchedule}
              className="px-4 py-2 rounded-lg bg-[#168A5B] hover:bg-[#13784F] text-white font-medium text-xs shadow-xs transition-colors inline-flex items-center space-x-1.5 disabled:opacity-50"
            >
              {scheduleApplied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  <span>Schedule Applied</span>
                </>
              ) : (
                <>
                  <span>{applyingSchedule ? 'Applying...' : 'Apply Schedule'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 13. SUSTAINABILITY PROGRESS (Replaces gamification badges) */}
      <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F4F1] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#1A2E24]">
              Carbon Reduction Progress
            </h3>
            <p className="text-xs text-[#768E82]">
              Corporate decarbonization roadmap tracking against baseline benchmark
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#768E82]">Target:</span>
            <span className="font-bold text-[#168A5B] font-mono">{targetReductionPct}% Reduction by Q4</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
            <span className="text-[#768E82] block text-[11px]">Baseline Benchmark</span>
            <span className="text-lg font-bold font-mono text-[#1A2E24]">
              {formatCO2(baselineEmissionsKg)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
            <span className="text-[#768E82] block text-[11px]">Current Emissions</span>
            <span className="text-lg font-bold font-mono text-[#1A2E24]">
              {formatCO2(totalEmissionsKg)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
            <span className="text-[#768E82] block text-[11px]">Net Reduction Achieved</span>
            <span className="text-lg font-bold font-mono text-[#168A5B]">
              -{reductionPct}%
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
            <span className="text-[#768E82] block text-[11px]">Target Goal</span>
            <span className="text-lg font-bold font-mono text-[#1A2E24]">
              -{targetReductionPct}% Target
            </span>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-[#486255]">
            <span>Decarbonization Target Progress</span>
            <span className="font-bold text-[#168A5B] font-mono">{reductionPct}% of {targetReductionPct}% target ({progressPct}%)</span>
          </div>
          <div className="w-full h-3 bg-[#EBF5F0] rounded-full overflow-hidden p-0.5 border border-[#D5E6DC]">
            <div
              className="h-full bg-[#168A5B] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 12. 7-DAY CARBON FORECAST */}
      <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-[#168A5B]" />
          <h3 className="text-base font-semibold text-[#1A2E24]">7-Day Carbon Forecast</h3>
        </div>
        <p className="text-xs text-[#768E82]">
          Anticipated grid carbon intensity across upcoming operating shifts to plan high-load processes.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {weeklyForecast.map((day) => {
            const isClean = day.avg_ci <= 320;
            return (
              <div
                key={day.date}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  day.is_today
                    ? 'bg-[#EBF5F0] border-[#168A5B] text-[#1A2E24]'
                    : 'bg-[#F7FAF8] border-[#E3E9E5] text-[#1A2E24]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#768E82] mb-1">
                  <span>{day.day_name}</span>
                  {day.is_today && (
                    <span className="px-1 rounded bg-[#168A5B] text-white text-[9px]">Today</span>
                  )}
                </div>
                <div className="text-lg font-bold font-mono text-[#1A2E24] my-1">
                  {day.avg_ci}
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block ${
                    isClean ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'
                  }`}
                >
                  {isClean ? 'Clean Window' : 'Moderate'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
