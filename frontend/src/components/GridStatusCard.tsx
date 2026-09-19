import React, { useState } from 'react';
import { Clock, Cpu } from 'lucide-react';
import { GridIntensity, OptimalWindow } from '../types';
import { APPLIANCES } from '../utils/constants';
import { formatCI, getCIColor } from '../utils/formatters';
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

  const bestWindow = optimalWindows[0] || {
    start: '12:00 PM',
    end: '03:00 PM',
    avg_ci: 290,
    co2_saving_kg: 42,
  };

  return (
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-5">
      {/* Grid Pulse Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F4F1] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getCIColor(grid.status) }}
            />
            <h3 className="text-base font-semibold text-[#1A2E24]">Live Grid Intensity Telemetry</h3>
          </div>
          <p className="text-xs text-[#768E82] mt-0.5">
            Regional Node: <span className="text-[#1A2E24] font-medium">{grid.location}</span> ({grid.source})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-[#1A2E24]">{formatCI(grid.value)}</div>
            <div className="text-[11px] uppercase tracking-wider text-[#768E82]">
              Status: <span className="font-semibold text-[#168A5B]">{grid.status.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Best Low-Carbon Window Card */}
      {bestWindow && (
        <div className="rounded-xl bg-[#EBF5F0] border border-[#D5E6DC] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white text-[#168A5B] shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#168A5B]">
                  Recommended Scheduling Window
                </span>
                <h4 className="text-base font-bold text-[#1A2E24]">
                  {bestWindow.start} – {bestWindow.end} hrs
                </h4>
                <p className="text-xs text-[#486255]">
                  Avg CI: {bestWindow.avg_ci} gCO₂/kWh • Save ~{bestWindow.co2_saving_kg} kg CO₂ per shift
                </p>
              </div>
            </div>
            <span className="hidden sm:block text-xs text-[#168A5B] font-semibold bg-white border border-[#D5E6DC] px-3 py-1.5 rounded-md">
              High Renewable Window
            </span>
          </div>
        </div>
      )}

      {/* IoT / MQTT Appliance Load Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#1A2E24] flex items-center space-x-1.5">
            <Cpu className="h-3.5 w-3.5 text-[#168A5B]" />
            <span>Industrial Load Controllers (MQTT / ESP32)</span>
          </span>
          <span className="text-[11px] text-[#768E82]">Automated shift during clean windows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {APPLIANCES.slice(0, 4).map((app) => {
            const st = deviceStatuses[app.id] || 'OFF';
            const isLoading = loadingDevice === app.id;
            return (
              <div
                key={app.id}
                className="p-3 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5] flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-[#1A2E24]">{app.name}</p>
                  <p className="text-[11px] text-[#768E82]">
                    {app.power_kw} kW • {app.category}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => scheduleDevice(app.id)}
                    disabled={isLoading}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                      st === 'SCHEDULED'
                        ? 'bg-[#EBF5F0] border-[#D5E6DC] text-[#168A5B] font-semibold'
                        : 'bg-white border-[#E3E9E5] text-[#768E82] hover:text-[#1A2E24]'
                    }`}
                  >
                    Auto-Shift
                  </button>
                  <button
                    onClick={() => toggleDevice(app.id, st)}
                    disabled={isLoading}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                      st === 'ON'
                        ? 'bg-[#EBF5F0] border-[#168A5B] text-[#168A5B]'
                        : 'bg-white border-[#E3E9E5] text-[#768E82]'
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
