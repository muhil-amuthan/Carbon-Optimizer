import React, { useState } from 'react';
import { Zap, Clock, ShieldCheck, Play, Power, CheckCircle, Radio } from 'lucide-react';
import { GridIntensity, OptimalWindow } from '../types';
import { APPLIANCES } from '../utils/constants';
import { formatCI, getCIColor, getCIBgClass } from '../utils/formatters';
import { gridApi } from '../api/gridApi';

interface GridStatusCardProps {
  grid: GridIntensity;
  optimalWindows: OptimalWindow[];
}

export const GridStatusCard: React.FC<GridStatusCardProps> = ({ grid, optimalWindows }) => {
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, 'ON' | 'OFF' | 'SCHEDULED'>>({
    ev_charger: 'SCHEDULED',
    compressor: 'ON',
    industrial_motor: 'OFF',
    refrigeration: 'ON',
  });
  const [loadingDevice, setLoadingDevice] = useState<string | null>(null);

  const toggleDevice = async (id: string, current: 'ON' | 'OFF' | 'SCHEDULED') => {
    const next = current === 'ON' ? 'OFF' : 'ON';
    setLoadingDevice(id);
    try {
      await gridApi.triggerMqtt(id, next);
      setDeviceStatuses((prev) => ({ ...prev, [id]: next }));
    } finally {
      setLoadingDevice(null);
    }
  };

  const scheduleDevice = async (id: string) => {
    setLoadingDevice(id);
    try {
      await gridApi.triggerMqtt(id, 'SCHEDULE');
      setDeviceStatuses((prev) => ({ ...prev, [id]: 'SCHEDULED' }));
    } finally {
      setLoadingDevice(null);
    }
  };

  const bestWindow = optimalWindows[0];

  return (
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Grid Pulse Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: getCIColor(grid.status) }}
              />
              <span
                className="relative inline-flex rounded-full h-3 w-3"
                style={{ backgroundColor: getCIColor(grid.status) }}
              />
            </span>
            <h3 className="text-base font-semibold text-white">Live Grid Intensity Telemetry</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Regional Node: <span className="text-slate-200">{grid.location}</span> ({grid.source})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">{formatCI(grid.value)}</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Status: <span className="font-semibold text-emerald-400">{grid.status.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Best Low-Carbon Window Card */}
      {bestWindow && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-900 border border-emerald-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Recommended Scheduling Window
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {bestWindow.start} – {bestWindow.end} hrs
                </h4>
                <p className="text-xs text-slate-300">
                  Avg CI: {bestWindow.avg_ci} gCO₂/kWh • Save ~{bestWindow.co2_saving_kg} kg CO₂ per shift
                </p>
              </div>
            </div>
            <span className="hidden sm:block text-xs text-emerald-400 font-mono font-semibold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              High Renewable Window
            </span>
          </div>
        </div>
      )}

      {/* IoT / MQTT Appliance Load Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            <span>Industrial Smart Load Controllers (MQTT / ESP32)</span>
          </span>
          <span className="text-[11px] text-slate-500">Automated shift during clean windows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {APPLIANCES.slice(0, 4).map((app) => {
            const st = deviceStatuses[app.id] || 'OFF';
            const isLoading = loadingDevice === app.id;
            return (
              <div
                key={app.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-200">{app.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {app.power_kw} kW • {app.category}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => scheduleDevice(app.id)}
                    disabled={isLoading}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                      st === 'SCHEDULED'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Auto-Shift
                  </button>
                  <button
                    onClick={() => toggleDevice(app.id, st)}
                    disabled={isLoading}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                      st === 'ON'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {isLoading ? '...' : st}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
