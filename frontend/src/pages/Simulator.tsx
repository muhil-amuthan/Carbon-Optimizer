import React, { useState, useEffect } from 'react';
import { SimulatorSlider } from '../components/SimulatorSlider';
import { optimizeApi } from '../api/optimizeApi';
import { SimulationResult } from '../types';
import { Sliders, ArrowDownRight, DollarSign, Cloud, Zap, ShieldCheck } from 'lucide-react';
import { formatCO2, formatCurrencyUSD } from '../utils/formatters';

interface SimulatorProps {
  factoryId: string;
}

export const Simulator: React.FC<SimulatorProps> = ({ factoryId }) => {
  const [params, setParams] = useState({
    electricityPct: 20,
    fuelPct: 15,
    wastePct: 10,
    renewablePct: 35,
  });

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runSim = async () => {
    setLoading(true);
    try {
      const res = await optimizeApi.simulate({
        factory_id: factoryId,
        electricity_reduction_pct: params.electricityPct,
        fuel_switching_pct: params.fuelPct,
        waste_reduction_pct: params.wastePct,
        renewable_share_pct: params.renewablePct,
      });
      setSimResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runSim();
    }, 200);
    return () => clearTimeout(timer);
  }, [params, factoryId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          What-If Scenario Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Model changes in fuel switching, solar integration, and operational efficiency
        </p>
      </div>

      {/* Sliders Component */}
      <SimulatorSlider
        electricityPct={params.electricityPct}
        fuelPct={params.fuelPct}
        wastePct={params.wastePct}
        renewablePct={params.renewablePct}
        onChange={setParams}
      />

      {/* Simulation Output Dashboard */}
      {simResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Baseline Emissions</span>
              <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
                {formatCO2(simResult.baseline_emissions)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Current operational benchmark</p>
            </div>

            <div className="rounded-2xl bg-[#131b2e]/90 border border-emerald-500/30 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-emerald-400">Simulated Target</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatCO2(simResult.simulated_emissions)}
              </div>
              <p className="text-xs text-emerald-400/70 mt-0.5">
                -{simResult.reduction_pct ?? 0}% reduction
              </p>
            </div>

            <div className="rounded-2xl bg-[#131b2e]/90 border border-teal-500/30 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-teal-400">Net CO₂ Avoided</span>
              <div className="text-2xl font-bold font-mono text-teal-300 mt-1">
                {formatCO2(simResult.reduction_kg ?? 0)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Annual greenhouse gas savings</p>
            </div>

            <div className="rounded-2xl bg-[#131b2e]/90 border border-amber-500/30 p-4 shadow-lg">
              <span className="text-[11px] font-semibold uppercase text-amber-400">Annual OPEX Savings</span>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {formatCurrencyUSD(simResult.cost_impact_usd ?? 0)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Energy tariff & efficiency value</p>
            </div>
          </div>

          {/* Scope Reduction Breakdown Cards */}
          <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-4">Simulated Reduction Breakdown by Scope</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans">Scope 1 (Direct Fuel)</span>
                <span className="text-base font-bold text-amber-400">-{formatCO2(simResult.scope1_reduction ?? 0)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans">Scope 2 (Electricity & Solar)</span>
                <span className="text-base font-bold text-blue-400">-{formatCO2(simResult.scope2_reduction ?? 0)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans">Scope 3 (Waste & Scrap)</span>
                <span className="text-base font-bold text-purple-400">-{formatCO2(simResult.scope3_reduction ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
