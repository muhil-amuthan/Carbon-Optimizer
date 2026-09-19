import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatCO2 } from '../utils/formatters';

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface EmissionPieChartProps {
  data?: PieDataPoint[];
  title?: string;
  totalKg?: number;
}

const DEFAULT_DATA: PieDataPoint[] = [
  { name: 'Scope 2: Purchased Electricity', value: 8400, color: '#2563EB' },
  { name: 'Scope 1: Natural Gas & Fuels', value: 4700, color: '#D97706' },
  { name: 'Scope 3: Supply Chain & Logistics', value: 2100, color: '#7C3AED' },
];

export const EmissionPieChart: React.FC<EmissionPieChartProps> = ({
  data = DEFAULT_DATA,
  title = 'Emission Breakdown',
  totalKg,
}) => {
  const total = totalKg || data.reduce((acc, curr) => acc + curr.value, 0);

  const scopeExplanations = [
    {
      scope: 'Scope 1',
      title: 'Direct emissions',
      desc: 'From on-site fuels, boilers, and industrial combustion processes.',
      color: '#D97706',
    },
    {
      scope: 'Scope 2',
      title: 'Purchased electricity',
      desc: 'Indirect emissions from electricity imported from the regional power grid.',
      color: '#2563EB',
    },
    {
      scope: 'Scope 3',
      title: 'Value chain & waste',
      desc: 'Other indirect emissions including logistics, water usage, and scrap handling.',
      color: '#7C3AED',
    },
  ];

  return (
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-[#1A2E24]">{title}</h3>
            <p className="text-xs text-[#768E82]">Proportion across GHG reporting scopes</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#F0F4F1] text-[#1A2E24] font-mono font-medium">
            {formatCO2(total)}
          </span>
        </div>

        {/* Clean Donut Chart */}
        <div className="h-44 w-full relative my-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0];
                    const val = p.value as number;
                    const pct = ((val / total) * 100).toFixed(1);
                    return (
                      <div className="rounded-lg bg-white border border-[#E3E9E5] p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-[#1A2E24]">{p.name}</p>
                        <p className="text-[#168A5B] font-mono font-semibold mt-0.5">
                          {formatCO2(val)} ({pct}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase text-[#768E82] font-medium tracking-wide">Total</span>
            <span className="text-xs font-bold font-mono text-[#1A2E24]">100%</span>
          </div>
        </div>
      </div>

      {/* Non-Technical Plain Explanations */}
      <div className="mt-2 space-y-2 border-t border-[#F0F4F1] pt-3">
        {scopeExplanations.map((item, idx) => (
          <div key={idx} className="flex items-start space-x-2 text-xs">
            <span
              className="w-2 h-2 rounded-full mt-1 shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="font-semibold text-[#1A2E24]">
                {item.scope} — <span className="font-normal text-[#486255]">{item.title}</span>
              </p>
              <p className="text-[11px] text-[#768E82] leading-tight mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
