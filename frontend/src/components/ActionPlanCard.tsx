import React from 'react';
import { Calendar, DollarSign, Clock, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';
import { ReductionAction } from '../types';
import { formatCurrencyUSD, formatWeeks } from '../utils/formatters';

interface ActionPlanCardProps {
  action: ReductionAction;
  phase?: 1 | 2 | 3;
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({ action, phase = 1 }) => {
  const phaseColors = {
    1: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    2: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    3: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const phaseNames = {
    1: 'Phase 1 (Immediate: 0-3 mo)',
    2: 'Phase 2 (Medium-term: 3-12 mo)',
    3: 'Phase 3 (Strategic: 1-3 yr)',
  };

  return (
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-5 shadow-lg transition-all hover:border-emerald-500/40 hover:shadow-xl relative overflow-hidden group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${phaseColors[phase]}`}>
              {phaseNames[phase]}
            </span>
            <span className="text-xs text-slate-400 font-medium">Scope {action.scope}</span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
            {action.name}
          </h4>
        </div>
        <div className="text-right">
          <div className="text-emerald-400 font-bold text-base font-mono">
            -{action.reduction_pct}%
          </div>
          <div className="text-[10px] text-slate-400">CO₂ Reduction</div>
        </div>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2 mb-4">{action.description}</p>

      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase">Est. Cost</span>
          <span className="font-semibold text-slate-200">{formatCurrencyUSD(action.cost_usd)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block uppercase">Payback</span>
          <span className="font-semibold text-slate-200">{action.payback_months} mo</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
          <span className="font-semibold text-slate-200">{formatWeeks(action.implementation_weeks)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400">
          Category: <span className="text-slate-300 font-medium">{action.category}</span>
        </span>
        <button className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          <span>Action Brief</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
