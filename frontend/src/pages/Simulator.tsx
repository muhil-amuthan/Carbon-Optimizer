import React, { useState, useEffect } from 'react';
import { SimulatorSlider } from '../components/SimulatorSlider';
import { optimizeApi } from '../api/optimizeApi';
import { SimulationResult } from '../types';
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
      <div className="border-b border-[#E3E9E5] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#1A2E24]">
          What-If Scenario Simulator
        </h1>
        <p className="text-xs text-[#768E82] mt-0.5">
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#E3E9E5] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
                Baseline Emissions
              </span>
              <div className="text-2xl font-bold font-mono text-[#1A2E24] mt-1">
                {formatCO2(simResult.baseline_emissions)}
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">Current operational benchmark</p>
            </div>

            <div className="bg-white border border-[#D5E6DC] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#168A5B]">
                Simulated Target
              </span>
              <div className="text-2xl font-bold font-mono text-[#168A5B] mt-1">
                {formatCO2(simResult.simulated_emissions)}
              </div>
              <p className="text-xs text-[#168A5B] mt-0.5">
                -{simResult.reduction_pct ?? 0}% net reduction
              </p>
            </div>

            <div className="bg-white border border-[#CCFBF1] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0D9488]">
                Net CO₂ Avoided
              </span>
              <div className="text-2xl font-bold font-mono text-[#0D9488] mt-1">
                {formatCO2(simResult.reduction_kg ?? 0)}
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">Annual greenhouse gas savings</p>
            </div>

            <div className="bg-white border border-[#FDE68A] rounded-xl p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">
                Annual OPEX Savings
              </span>
              <div className="text-2xl font-bold font-mono text-[#D97706] mt-1">
                {formatCurrencyUSD(simResult.cost_impact_usd ?? 0)}
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">Energy tariff & efficiency value</p>
            </div>
          </div>

          {/* Scope Reduction Breakdown Cards */}
          <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-semibold text-[#1A2E24] mb-3">Simulated Reduction Breakdown by Scope</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
                <span className="text-[#768E82] block text-[11px] font-sans">Scope 1 (Direct Fuel)</span>
                <span className="text-base font-bold text-[#D97706]">-{formatCO2(simResult.scope1_reduction ?? 0)}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
                <span className="text-[#768E82] block text-[11px] font-sans">Scope 2 (Electricity & Solar)</span>
                <span className="text-base font-bold text-[#2563EB]">-{formatCO2(simResult.scope2_reduction ?? 0)}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F7FAF8] border border-[#E3E9E5]">
                <span className="text-[#768E82] block text-[11px] font-sans">Scope 3 (Waste & Scrap)</span>
                <span className="text-base font-bold text-[#7C3AED]">-{formatCO2(simResult.scope3_reduction ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
