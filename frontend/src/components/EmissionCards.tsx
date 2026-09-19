import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCO2, formatNumber } from '../utils/formatters';

interface EmissionCardsProps {
  total: number;
  scope1: number;
  scope2: number;
  scope3: number;
  intensity: number;
  totalChangePct?: number;
}

export const EmissionCards: React.FC<EmissionCardsProps> = ({
  total,
  scope1,
  scope2,
  scope3,
  intensity,
  totalChangePct = -6.4,
}) => {
  const metrics = [
    {
      label: 'Total Emissions',
      value: formatCO2(total),
      subtext: `${formatNumber(total)} kg CO₂e`,
      delta: totalChangePct,
      deltaLabel: 'from last month',
      category: 'Overall Footprint',
    },
    {
      label: 'Scope 1',
      value: formatCO2(scope1),
      subtext: 'Direct combustion & process',
      delta: -3.2,
      deltaLabel: 'from last month',
      category: 'Direct',
    },
    {
      label: 'Scope 2',
      value: formatCO2(scope2),
      subtext: 'Purchased electricity',
      delta: -8.7,
      deltaLabel: 'from last month',
      category: 'Purchased Power',
    },
    {
      label: 'Scope 3',
      value: formatCO2(scope3),
      subtext: 'Supply chain & waste',
      delta: -1.5,
      deltaLabel: 'from last month',
      category: 'Value Chain',
    },
    {
      label: 'Carbon Intensity',
      value: `${intensity.toFixed(2)}`,
      subtext: 'kg CO₂e / production unit',
      delta: -5.1,
      deltaLabel: 'efficiency improvement',
      category: 'Efficiency',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {metrics.map((m, i) => {
        const isReduction = m.delta < 0;
        return (
          <div
            key={i}
            className="bg-white border border-[#E3E9E5] rounded-xl p-4 shadow-card hover:border-[#D0DBD3] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#768E82]">
                  {m.label}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F4F1] text-[#486255] font-medium">
                  {m.category}
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-[#1A2E24] mt-0.5">
                {m.value}
              </div>
              <p className="text-xs text-[#768E82] mt-0.5">{m.subtext}</p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#F0F4F1] flex items-center justify-between text-xs">
              <div
                className={`inline-flex items-center space-x-1 font-medium ${
                  isReduction ? 'text-[#168A5B]' : 'text-[#D97706]'
                }`}
              >
                {isReduction ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                )}
                <span>{Math.abs(m.delta)}%</span>
              </div>
              <span className="text-[11px] text-[#768E82] truncate ml-1">{m.deltaLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
