import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AnomalyResult } from '../types';
import { formatCO2 } from '../utils/formatters';

interface AnomalyAlertProps {
  anomalies: AnomalyResult[];
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ anomalies }) => {
  const detected = anomalies.filter((a) => a.is_anomaly);

  if (detected.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-[#D5E6DC] p-3.5 flex items-center justify-between shadow-card">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#168A5B]" />
          <div>
            <span className="text-xs font-semibold text-[#1A2E24]">All Operations Normal</span>
            <span className="text-xs text-[#768E82] ml-2 hidden sm:inline">
              No carbon anomalies detected in latest telemetry cycles.
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#168A5B] bg-[#EBF5F0] px-2 py-0.5 rounded border border-[#D5E6DC]">
          Z-Score within 2.0σ
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#768E82]">
          Attention Needed
        </h4>
        <span className="text-[11px] text-[#768E82]">
          {detected.length} active flag{detected.length > 1 ? 's' : ''}
        </span>
      </div>

      {detected.map((item, idx) => {
        const isCritical = item.severity === 'critical';
        return (
          <div
            key={idx}
            className={`rounded-xl p-3.5 border bg-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCritical
                ? 'border-[#FCA5A5] border-l-4 border-l-[#DC2626]'
                : 'border-[#FCD34D] border-l-4 border-l-[#D97706]'
            }`}
          >
            <div className="flex items-start space-x-2.5">
              <div className="mt-0.5 shrink-0">
                {isCritical ? (
                  <ShieldAlert className="h-4 w-4 text-[#DC2626]" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                )}
              </div>
              <div className="text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-[#1A2E24]">
                    Boiler / Compressor energy surge (+{item.deviation_pct.toFixed(0)}%)
                  </span>
                  <span className="text-[10px] text-[#768E82] font-mono">{item.date}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[#486255]">
                  <span>
                    Expected: <strong className="font-mono text-[#1A2E24]">{formatCO2(item.expected_emissions)}</strong>
                  </span>
                  <span>
                    Actual: <strong className="font-mono text-[#1A2E24]">{formatCO2(item.actual_emissions)}</strong>
                  </span>
                  <span className="text-[#768E82]">
                    Possible cause: Boiler pressure regulation / compressor load
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => alert(`Initiating diagnostic telemetry for ${item.date} emission anomaly.`)}
                className="px-3 py-1 rounded-md text-xs font-medium border border-[#D5DDD8] hover:border-[#168A5B] hover:bg-[#F7FAF8] text-[#1A2E24] transition-colors"
              >
                Investigate
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
