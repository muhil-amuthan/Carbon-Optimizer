import React from 'react';
import { Sliders, Sun, Flame, Zap, Trash2 } from 'lucide-react';

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
      accent: 'accent-[#2563EB]',
      textColor: 'text-[#2563EB]',
      bgColor: 'bg-[#EFF6FF]',
      borderColor: 'border-[#BFDBFE]',
      key: 'electricityPct',
      max: 50,
    },
    {
      id: 'fuel',
      label: 'Fuel & Boiler Switching',
      desc: 'Biomass / electrification of boiler heating loads',
      icon: Flame,
      val: fuelPct,
      accent: 'accent-[#D97706]',
      textColor: 'text-[#D97706]',
      bgColor: 'bg-[#FEF3C7]',
      borderColor: 'border-[#FDE68A]',
      key: 'fuelPct',
      max: 50,
    },
    {
      id: 'waste',
      label: 'Waste & Scrap Minimization',
      desc: 'Closed-loop reprocessing and material diversion',
      icon: Trash2,
      val: wastePct,
      accent: 'accent-[#7C3AED]',
      textColor: 'text-[#7C3AED]',
      bgColor: 'bg-[#F5F3FF]',
      borderColor: 'border-[#DDD6FE]',
      key: 'wastePct',
      max: 40,
    },
    {
      id: 'renewable',
      label: 'Rooftop Solar & Green Power Share',
      desc: 'On-site solar PV generation & green tariff purchase',
      icon: Sun,
      val: renewablePct,
      accent: 'accent-[#168A5B]',
      textColor: 'text-[#168A5B]',
      bgColor: 'bg-[#EBF5F0]',
      borderColor: 'border-[#D5E6DC]',
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
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F4F1] pb-3">
        <div>
          <h3 className="text-base font-semibold text-[#1A2E24] flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-[#168A5B]" />
            <span>Operational Parameter Sliders</span>
          </h3>
          <p className="text-xs text-[#768E82]">Adjust decarbonization levers and observe real-time emissions impact</p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-[#768E82] text-[11px]">Presets:</span>
          <button
            onClick={() => applyPreset(10, 5, 10, 20)}
            className="px-2.5 py-1 rounded-md border border-[#E3E9E5] bg-[#F7FAF8] hover:bg-white text-[#486255] font-medium transition-colors"
          >
            Modest
          </button>
          <button
            onClick={() => applyPreset(25, 20, 20, 50)}
            className="px-2.5 py-1 rounded-md border border-[#E3E9E5] bg-[#F7FAF8] hover:bg-white text-[#486255] font-medium transition-colors"
          >
            Moderate
          </button>
          <button
            onClick={() => applyPreset(45, 40, 35, 90)}
            className="px-2.5 py-1 rounded-md border border-[#D5E6DC] bg-[#EBF5F0] text-[#168A5B] font-semibold transition-colors"
          >
            Net-Zero 2030
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sliders.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${s.textColor}`} />
                  <div>
                    <span className="font-semibold text-[#1A2E24]">{s.label}</span>
                    <span className="text-[11px] text-[#768E82] ml-2 hidden sm:inline">{s.desc}</span>
                  </div>
                </div>
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${s.bgColor} ${s.borderColor} ${s.textColor}`}>
                  +{s.val}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={s.max}
                value={s.val}
                onChange={(e) => handleSliderChange(s.key, Number(e.target.value))}
                className={`w-full h-2 bg-[#E3E9E5] rounded-lg appearance-none cursor-pointer ${s.accent}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
