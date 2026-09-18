import React from 'react';
import { useEmissions } from '../hooks/useEmissions';
import { EmissionCards } from '../components/EmissionCards';
import { EmissionTrendChart } from '../components/EmissionTrendChart';
import { EmissionPieChart } from '../components/EmissionPieChart';
import { AnomalyAlert } from '../components/AnomalyAlert';
import { Sparkles, Trophy, Award, TrendingDown, ArrowUpRight, RefreshCw } from 'lucide-react';
import { ACHIEVEMENT_DEFINITIONS } from '../utils/constants';

interface DashboardProps {
  factoryId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ factoryId }) => {
  const { summary, anomalies, forecast, breakdown, loading, refetch } = useEmissions(factoryId);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Industrial Carbon Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live ESG Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time GHG Protocol Scope 1, Scope 2 & Scope 3 emission accounting for{' '}
            <span className="text-slate-200 font-semibold">{factoryId}</span>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <EmissionCards
          total={summary.total_emissions_kg}
          scope1={summary.scope1_total}
          scope2={summary.scope2_total}
          scope3={summary.scope3_total}
          intensity={summary.avg_intensity}
        />
      )}

      {/* Anomaly Banner */}
      <AnomalyAlert anomalies={anomalies} />

      {/* Primary Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* Gamification & ESG Achievements Strip */}
      <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              ESG Milestone Badges & Industrial Gamification
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Carbon Level:</span>
            <span className="font-bold text-emerald-400 font-mono">Tier 4 • Eco Leader (1,850 pts)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {ACHIEVEMENT_DEFINITIONS.map((ach, i) => (
            <div
              key={ach.id}
              className={`p-3 rounded-xl border text-center transition-all ${
                i < 5
                  ? 'bg-slate-900/90 border-emerald-500/30 text-slate-200 shadow-sm shadow-emerald-500/5'
                  : 'bg-slate-900/30 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="text-2xl mb-1">{ach.icon}</div>
              <p className="text-[11px] font-bold truncate">{ach.name}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{ach.points} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
