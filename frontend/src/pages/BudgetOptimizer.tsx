import React from 'react';
import { useOptimize } from '../hooks/useOptimize';
import { BudgetPlanner } from '../components/BudgetPlanner';
import { ActionPlanCard } from '../components/ActionPlanCard';
import { TimelineView } from '../components/TimelineView';
import { Download } from 'lucide-react';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E3E9E5] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A2E24]">
            Capital Budget & Emission Optimizer
          </h1>
          <p className="text-xs text-[#768E82] mt-0.5">
            Dynamic knapsack optimization algorithm to maximize decarbonization return on investment
          </p>
        </div>

        {result && (
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#E3E9E5] hover:border-[#168A5B] bg-white text-xs text-[#486255] hover:text-[#1A2E24] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Action Plan</span>
          </button>
        )}
      </div>

      {/* Input Slider Controls */}
      <BudgetPlanner actions={actions} onOptimize={handleOptimize} loading={loading} />

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#D5E6DC] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
                Total Decarbonization
              </span>
              <div className="text-2xl font-bold font-mono text-[#168A5B] mt-1">
                -{result.total_reduction_pct}%
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">
                ~{formatNumber(result.estimated_annual_savings_kg)} kg CO₂ avoided / yr
              </p>
            </div>

            <div className="bg-white border border-[#E3E9E5] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
                CAPEX Required
              </span>
              <div className="text-2xl font-bold font-mono text-[#2563EB] mt-1">
                {formatCurrencyUSD(result.total_cost)}
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">
                Remaining: {formatCurrencyUSD(result.budget_remaining)}
              </p>
            </div>

            <div className="bg-white border border-[#E3E9E5] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
                Blended Payback
              </span>
              <div className="text-2xl font-bold font-mono text-[#D97706] mt-1">
                {result.roi_months} Months
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">Energy & carbon credit payback</p>
            </div>

            <div className="bg-white border border-[#E3E9E5] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
                Action Portfolio
              </span>
              <div className="text-2xl font-bold font-mono text-[#7C3AED] mt-1">
                {result.selected_actions.length} Interventions
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">Across 3 execution phases</p>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div>
            <h3 className="text-base font-semibold text-[#1A2E24] mb-3">
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
