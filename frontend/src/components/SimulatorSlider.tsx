import React from 'react';
import { Sliders, Sun, Flame, Zap, Trash2, BatteryCharging } from 'lucide-react';
import { formatCurrencyUSD, formatCO2 } from '../utils/formatters';

interface SimulatorSliderProps {
  electricityPct: number;
  fuelPct: number;
  wastePct: number;
  renewablePct: number;
  onChange: (vals: {
    electricityPct: number;
    fuelPct: number;
    wastePct: number;
    renewablePct: number;
  }) => void;
}

export const SimulatorSlider: React.FC<SimulatorSliderProps> = ({
  electricityPct,
  fuelPct,
  wastePct,
  renewablePct,
  onChange,
}) => {
  const sliders = [
    {
      id: 'electricity',
      label: 'Electricity Efficiency Gain',
      desc: 'VFD motors, LED refits & HVAC setpoint tuning',
      icon: Zap,
      val: electricityPct,
      color: 'accent-blue-500',
      textColor: 'text-blue-400',
      key: 'electricityPct',
      max: 50,
    },
    {
      id: 'fuel',
      label: 'Fuel & Boiler Switching',
      desc: 'Biomass / electrification of boiler heating loads',
      icon: Flame,
      val: fuelPct,
      color: 'accent-amber-500',
      textColor: 'text-amber-400',
      key: 'fuelPct',
      max: 50,
    },
    {
      id: 'waste',
      label: 'Waste & Scrap Minimization',
      desc: 'Closed-loop reprocessing and material diversion',
      icon: Trash2,
      val: wastePct,
      color: 'accent-purple-500',
      textColor: 'text-purple-400',
      key: 'wastePct',
      max: 40,
    },
    {
      id: 'renewable',
      label: 'Rooftop Solar & PPA Renewable Share',
      desc: 'On-site solar PV generation & green tariff purchase',
      icon: Sun,
      val: renewablePct,
      color: 'accent-emerald-500',
      textColor: 'text-emerald-400',
      key: 'renewablePct',
      max: 100,
    },
  ];

  const handleSliderChange = (key: string, val: number) => {
    onChange({
      electricityPct: key === 'electricityPct' ? val : electricityPct,
      fuelPct: key === 'fuelPct' ? val : fuelPct,
      wastePct: key === 'wastePct' ? val : wastePct,
      renewablePct: key === 'renewablePct' ? val : renewablePct,
    });
  };

  const applyPreset = (e: number, f: number, w: number, r: number) => {
    onChange({ electricityPct: e, fuelPct: f, wastePct: w, renewablePct: r });
  };

  return (
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span>Interactive Parameter Sliders</span>
          </h3>
          <p className="text-xs text-slate-400">Simulate operational adjustments and see instantaneous emissions delta</p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-slate-500 text-[11px]">Presets:</span>
          <button
            onClick={() => applyPreset(10, 5, 10, 20)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Modest
          </button>
          <button
            onClick={() => applyPreset(25, 20, 20, 50)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Moderate
          </button>
          <button
            onClick={() => applyPreset(45, 40, 35, 90)}
            className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium transition-colors"
          >
            Net-Zero 2030
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {sliders.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${s.textColor}`} />
                  <div>
                    <span className="font-semibold text-slate-200">{s.label}</span>
                    <span className="text-[11px] text-slate-500 ml-2 hidden sm:inline">{s.desc}</span>
                  </div>
                </div>
                <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded bg-slate-900 border border-slate-700 ${s.textColor}`}>
                  +{s.val}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={s.max}
                value={s.val}
                onChange={(e) => handleSliderChange(s.key, Number(e.target.value))}
                className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${s.color}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
