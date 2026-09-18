import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrencyUSD } from '../utils/formatters';

interface TimelineViewProps {
  timeline: any[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  return (
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-white">Execution Roadmap & Milestones</h3>
        <p className="text-xs text-slate-400">Sequenced implementation roadmap based on ROI and complexity</p>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
        {timeline.map((item, idx) => {
          // Check if it's a TimelinePhase
          if ('phase' in item && 'actions' in item) {
            return (
              <div key={item.phase || idx} className="relative pl-10">
                <div className="absolute left-2.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>

                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Phase {item.phase} • {item.timeframe}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.label}</h4>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      {item.total_cost !== undefined && (
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                          Cost: {formatCurrencyUSD(item.total_cost)}
                        </span>
                      )}
                      {item.total_reduction_pct !== undefined && (
                        <span className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-mono">
                          -{item.total_reduction_pct}% CO₂
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {item.actions?.map((act: any) => (
                      <div
                        key={act.action_id}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-950/60 text-xs border border-slate-800/60"
                      >
                        <span className="text-slate-200 font-medium">{act.name}</span>
                        <span className="text-slate-400 text-[11px]">
                          {formatCurrencyUSD(act.cost_usd)} • {act.payback_months}mo payback
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // Otherwise it's a TimelineItem (start_week, end_week)
          return (
            <div key={item.action_id || idx} className="relative pl-10">
              <div className="absolute left-2.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Week {item.start_week} – {item.end_week}
                    </span>
                    <span className="text-xs text-slate-400">Duration: {item.duration_weeks}w</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{item.name}</h4>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
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
