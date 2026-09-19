import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ReductionAction } from '../types';
import { formatCurrencyUSD, formatWeeks } from '../utils/formatters';

interface ActionPlanCardProps {
  action: ReductionAction;
  phase?: 1 | 2 | 3;
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({ action, phase = 1 }) => {
  const phaseStyles = {
    1: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    2: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    3: 'bg-[#F0FDFA] text-[#0D9488] border-[#99F6E4]',
  };

  const phaseNames = {
    1: 'Phase 1 (Immediate: 0-3 mo)',
    2: 'Phase 2 (Medium: 3-12 mo)',
    3: 'Phase 3 (Strategic: 1-3 yr)',
  };

  return (
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-4 shadow-card hover:border-[#D0DBD3] transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${phaseStyles[phase]}`}>
                {phaseNames[phase]}
              </span>
              <span className="text-[11px] text-[#768E82]">Scope {action.scope}</span>
            </div>
            <h4 className="text-sm font-semibold text-[#1A2E24]">
              {action.name}
            </h4>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#168A5B] font-bold text-sm font-mono">
              -{action.reduction_pct}%
            </div>
            <div className="text-[10px] text-[#768E82]">CO₂ Saved</div>
          </div>
        </div>

        <p className="text-xs text-[#486255] line-clamp-2 mb-3">{action.description}</p>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5] text-xs">
          <div>
            <span className="text-[10px] text-[#768E82] block uppercase">Est. Cost</span>
            <span className="font-semibold text-[#1A2E24]">{formatCurrencyUSD(action.cost_usd)}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#768E82] block uppercase">Payback</span>
            <span className="font-semibold text-[#1A2E24]">{action.payback_months} mo</span>
          </div>
          <div>
            <span className="text-[10px] text-[#768E82] block uppercase">Duration</span>
            <span className="font-semibold text-[#1A2E24]">{formatWeeks(action.implementation_weeks)}</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F0F4F1] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#768E82]">
            Category: <span className="text-[#486255] font-medium">{action.category}</span>
          </span>
          <button className="flex items-center space-x-1 text-[#168A5B] hover:text-[#13784F] font-medium transition-colors">
            <span>Action Brief</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
