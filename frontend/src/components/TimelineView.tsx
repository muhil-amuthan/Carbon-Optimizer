import React from 'react';
import { formatCurrencyUSD } from '../utils/formatters';

interface TimelineViewProps {
  timeline: any[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  return (
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-[#1A2E24]">Execution Roadmap & Milestones</h3>
        <p className="text-xs text-[#768E82] mt-0.5">Sequenced implementation roadmap based on ROI and technical complexity</p>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#E3E9E5]">
        {timeline.map((item, idx) => {
          // Check if it's a TimelinePhase
          if ('phase' in item && 'actions' in item) {
            return (
              <div key={item.phase || idx} className="relative pl-8">
                <div className="absolute left-1.5 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#168A5B] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#168A5B]" />
                </div>

                <div className="rounded-lg bg-[#F7FAF8] border border-[#E3E9E5] p-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#168A5B]">
                        Phase {item.phase} • {item.timeframe}
                      </span>
                      <h4 className="text-xs font-bold text-[#1A2E24]">{item.label}</h4>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {item.total_cost !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E3E9E5] text-[#1A2E24] font-mono text-[11px]">
                          Cost: {formatCurrencyUSD(item.total_cost)}
                        </span>
                      )}
                      {item.total_reduction_pct !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-[#EBF5F0] text-[#168A5B] border border-[#D5E6DC] font-mono font-semibold text-[11px]">
                          -{item.total_reduction_pct}% CO₂
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    {item.actions?.map((act: any) => (
                      <div
                        key={act.action_id}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded bg-white text-xs border border-[#E3E9E5]"
                      >
                        <span className="text-[#1A2E24] font-medium">{act.name}</span>
                        <span className="text-[#768E82] text-[11px]">
                          {formatCurrencyUSD(act.cost_usd)} • {act.payback_months}mo payback
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // Otherwise TimelineItem
          return (
            <div key={item.action_id || idx} className="relative pl-8">
              <div className="absolute left-1.5 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#168A5B] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#168A5B]" />
              </div>

              <div className="rounded-lg bg-[#F7FAF8] border border-[#E3E9E5] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#168A5B] px-1.5 py-0.5 rounded bg-[#EBF5F0] border border-[#D5E6DC]">
                      Week {item.start_week} – {item.end_week}
                    </span>
                    <span className="text-xs text-[#768E82]">Duration: {item.duration_weeks}w</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1A2E24] mt-1">{item.name}</h4>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-[#168A5B] bg-[#EBF5F0] border border-[#D5E6DC] px-2 py-0.5 rounded">
                    +{item.cumulative_reduction}% Cumulative CO₂ Saved
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
