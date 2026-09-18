import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { AnomalyResult } from '../types';
import { formatCO2 } from '../utils/formatters';

interface AnomalyAlertProps {
  anomalies: AnomalyResult[];
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ anomalies }) => {
  const detected = anomalies.filter((a) => a.is_anomaly);

  if (detected.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-300">All Operations Normal</h4>
            <p className="text-xs text-slate-400">No carbon anomalies detected in latest telemetry cycles.</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Z-Score within 2.0σ
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {detected.map((item, idx) => {
        const isCritical = item.severity === 'critical';
        return (
          <div
            key={idx}
            className={`rounded-2xl p-4 border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isCritical
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-xl mt-0.5 ${
                  isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isCritical ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                    {item.severity.toUpperCase()} ANOMALY
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Date: {item.date}</span>
                </div>
                <p className="text-sm font-medium mt-1 text-white">
                  Actual: <span className="font-bold">{formatCO2(item.actual_emissions)}</span> vs Expected:{' '}
                  <span className="text-slate-400">{formatCO2(item.expected_emissions)}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Surge of +{item.deviation_pct.toFixed(1)}% above rolling industrial baseline. Recommend inspecting boiler line and compressor manifold.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end md:self-center">
              <div className="text-right">
                <div className="text-base font-bold text-rose-400 font-mono">
                  +{item.deviation_pct.toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase">Deviation</div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600 transition-colors">
                Investigate
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
