import React, { useState } from 'react';
import { DollarSign, Percent, Filter, SlidersHorizontal } from 'lucide-react';
import { ReductionAction } from '../types';
import { formatCurrencyUSD } from '../utils/formatters';

interface BudgetPlannerProps {
  actions: ReductionAction[];
  onOptimize: (budget: number, targetReduction: number, excludedIds: string[]) => void;
  loading?: boolean;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  actions,
  onOptimize,
  loading = false,
}) => {
  const [budget, setBudget] = useState<number>(65000);
  const [targetReduction, setTargetReduction] = useState<number>(25);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  const toggleExclude = (id: string) => {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-5">
      <div className="flex items-center justify-between border-b border-[#F0F4F1] pb-3">
        <div>
          <h3 className="text-base font-semibold text-[#1A2E24] flex items-center space-x-2">
            <SlidersHorizontal className="h-4 w-4 text-[#168A5B]" />
            <span>Knapsack Budget Allocation Parameters</span>
          </h3>
          <p className="text-xs text-[#768E82] mt-0.5">
            Algorithmic selection maximizing CO₂ reduction within CAPEX constraints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#486255] font-medium flex items-center space-x-1">
              <DollarSign className="h-3.5 w-3.5 text-[#168A5B]" />
              <span>Investment Budget (CAPEX)</span>
            </span>
            <span className="font-mono text-[#168A5B] font-bold text-xs bg-[#EBF5F0] border border-[#D5E6DC] px-2 py-0.5 rounded">
              {formatCurrencyUSD(budget)}
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={200000}
            step={5000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-[#E3E9E5] rounded-lg appearance-none cursor-pointer accent-[#168A5B]"
          />
          <div className="flex justify-between text-[11px] text-[#768E82]">
            <span>$10,000</span>
            <span>$100,000</span>
            <span>$200,000</span>
          </div>
        </div>

        {/* Target Reduction Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#486255] font-medium flex items-center space-x-1">
              <Percent className="h-3.5 w-3.5 text-[#0D9488]" />
              <span>Target Emission Reduction</span>
            </span>
            <span className="font-mono text-[#0D9488] font-bold text-xs bg-[#F0FDFA] border border-[#CCFBF1] px-2 py-0.5 rounded">
              {targetReduction}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={1}
            value={targetReduction}
            onChange={(e) => setTargetReduction(Number(e.target.value))}
            className="w-full h-2 bg-[#E3E9E5] rounded-lg appearance-none cursor-pointer accent-[#0D9488]"
          />
          <div className="flex justify-between text-[11px] text-[#768E82]">
            <span>5% (Quick Wins)</span>
            <span>30% (Moderate)</span>
            <span>60% (Net Zero Path)</span>
          </div>
        </div>
      </div>

      {/* Action Candidate Pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#768E82]">
          <span className="flex items-center space-x-1">
            <Filter className="h-3.5 w-3.5 text-[#768E82]" />
            <span>Eligible Reduction Actions ({actions.length})</span>
          </span>
          <span className="text-[11px] text-[#768E82]">
            Uncheck to exclude specific actions from optimization solver
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {actions.map((action) => {
            const isExcluded = excludedIds.includes(action.action_id);
            return (
              <div
                key={action.action_id}
                onClick={() => toggleExclude(action.action_id)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                  !isExcluded
                    ? 'bg-[#F7FAF8] border-[#D5E6DC] text-[#1A2E24]'
                    : 'bg-white border-[#E3E9E5] text-[#768E82] opacity-60'
                }`}
              >
                <div className="truncate mr-2">
                  <p className="font-semibold truncate">{action.name}</p>
                  <p className="text-[10px] text-[#768E82]">
                    {formatCurrencyUSD(action.cost_usd)} • -{action.reduction_pct}% CO₂
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  onChange={() => {}}
                  className="rounded border-[#D5DDD8] text-[#168A5B] focus:ring-0"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onOptimize(budget, targetReduction, excludedIds)}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[#168A5B] hover:bg-[#13784F] text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <span>{loading ? 'Running Knapsack Solver...' : 'Generate Optimal Investment Plan'}</span>
      </button>
    </div>
  );
};
