import React, { useState } from 'react';
import { DollarSign, Percent, Sparkles, Filter, CheckSquare } from 'lucide-react';
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
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>AI Knapsack Budget Optimizer</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic selection maximizing CO₂ reduction within CAPEX constraints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span>Investment Budget (CAPEX)</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>$10,000</span>
            <span>$100,000</span>
            <span>$200,000</span>
          </div>
        </div>

        {/* Target Reduction Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1">
              <Percent className="h-3.5 w-3.5 text-teal-400" />
              <span>Target Emission Reduction</span>
            </span>
            <span className="font-mono text-teal-400 font-bold text-sm bg-teal-950/40 border border-teal-500/20 px-2 py-0.5 rounded">
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>5% (Quick Wins)</span>
            <span>30% (Aggressive)</span>
            <span>60% (Net Zero Path)</span>
          </div>
        </div>
      </div>

      {/* Action Candidate Pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Eligible Reduction Actions ({actions.length})</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Uncheck to exclude specific actions from optimization solver
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
          {actions.map((action) => {
            const isExcluded = excludedIds.includes(action.action_id);
            return (
              <div
                key={action.action_id}
                onClick={() => toggleExclude(action.action_id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  !isExcluded
                    ? 'bg-slate-900/80 border-slate-700 text-slate-200'
                    : 'bg-slate-900/30 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div className="truncate mr-2">
                  <p className="font-semibold truncate">{action.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {formatCurrencyUSD(action.cost_usd)} • -{action.reduction_pct}% CO₂
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  onChange={() => {}}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
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
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        <span>{loading ? 'Running Knapsack Solver...' : 'Generate Optimal Investment Plan'}</span>
      </button>
    </div>
  );
};
