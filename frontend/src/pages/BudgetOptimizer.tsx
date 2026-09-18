import React, { useState } from 'react';
import { useOptimize } from '../hooks/useOptimize';
import { BudgetPlanner } from '../components/BudgetPlanner';
import { ActionPlanCard } from '../components/ActionPlanCard';
import { TimelineView } from '../components/TimelineView';
import { Sparkles, DollarSign, TrendingDown, Clock, ShieldCheck, Download } from 'lucide-react';
import { formatCurrencyUSD, formatNumber } from '../utils/formatters';

interface BudgetOptimizerProps {
  factoryId: string;
}

export const BudgetOptimizer: React.FC<BudgetOptimizerProps> = ({ factoryId }) => {
  const { actions, result, loading, run } = useOptimize();

  const handleOptimize = (budget: number, targetReduction: number, excludedIds: string[]) => {
    run(factoryId, budget, targetReduction, excludedIds);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Capital Budget & Emission Optimizer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic 0/1 Knapsack optimization algorithm to maximize decarbonization ROI
          </p>
        </div>

        {result && (
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Action Brief</span>
          </button>
        )}
      </div>

      {/* Input Slider Controls */}
      <BudgetPlanner actions={actions} onOptimize={handleOptimize} loading={loading} />

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-[#131b2e]/90 border border-emerald-500/30 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Total Decarbonization</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                -{result.total_reduction_pct}%
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ~{formatNumber(result.estimated_annual_savings_kg)} kg CO₂ avoided / yr
              </p>
            </div>

            <div className="rounded-2xl bg-[#131b2e]/90 border border-blue-500/30 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-slate-400">CAPEX Invested</span>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                {formatCurrencyUSD(result.total_cost)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Remaining: {formatCurrencyUSD(result.budget_remaining)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#131b2e]/90 border border-amber-500/30 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Blended Payback</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {result.roi_months} Months
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Energy & carbon credit payback</p>
            </div>

            <div className="rounded-2xl bg-[#131b2e]/90 border border-purple-500/30 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Action Portfolio</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {result.selected_actions.length} Interventions
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Across 3 execution phases</p>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4">
              Recommended Intervention Package
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.selected_actions.map((act, i) => (
                <ActionPlanCard
                  key={act.action_id}
                  action={act}
                  phase={(i === 0 ? 1 : i < 3 ? 2 : 3) as 1 | 2 | 3}
                />
              ))}
            </div>
          </div>

          {/* Phased Roadmap Timeline */}
          {result.timeline && result.timeline.length > 0 && (
            <TimelineView timeline={result.timeline} />
          )}
        </div>
      )}
    </div>
  );
};
