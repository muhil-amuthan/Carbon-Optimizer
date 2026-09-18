import React from 'react';
import { Cloud, Flame, Zap, Truck, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
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
  const cards = [
    {
      label: 'Total Emissions',
      value: formatCO2(total),
      sub: `${formatNumber(total)} kg CO₂e`,
      icon: Cloud,
      color: 'from-emerald-500/20 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      delta: totalChangePct,
      deltaLabel: 'vs last month',
    },
    {
      label: 'Scope 1 (Direct)',
      value: formatCO2(scope1),
      sub: 'Fuel, gas & combustion',
      icon: Flame,
      color: 'from-amber-500/20 to-orange-500/5',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      delta: -3.2,
      deltaLabel: 'reduced fuel burn',
    },
    {
      label: 'Scope 2 (Electricity)',
      value: formatCO2(scope2),
      sub: 'Purchased grid power',
      icon: Zap,
      color: 'from-blue-500/20 to-indigo-500/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      delta: -8.7,
      deltaLabel: 'solar offset active',
    },
    {
      label: 'Scope 3 (Indirect)',
      value: formatCO2(scope3),
      sub: 'Supply chain & waste',
      icon: Truck,
      color: 'from-purple-500/20 to-pink-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      delta: -1.5,
      deltaLabel: 'material routing',
    },
    {
      label: 'Carbon Intensity',
      value: `${intensity.toFixed(2)}`,
      sub: 'kg CO₂e per prod unit',
      icon: Gauge,
      color: 'from-cyan-500/20 to-sky-500/5',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      delta: -5.1,
      deltaLabel: 'efficiency gain',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const isGood = c.delta < 0;
        return (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl bg-[#131b2e]/90 border ${c.borderColor} p-4 shadow-lg backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl`}
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.color} blur-2xl pointer-events-none`} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {c.label}
              </span>
              <div className={`p-2 rounded-xl bg-slate-800/80 ${c.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight text-white">{c.value}</div>
              <p className="text-xs text-slate-400">{c.sub}</p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className={`flex items-center space-x-1 font-medium ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isGood ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                <span>{Math.abs(c.delta)}%</span>
              </div>
              <span className="text-[11px] text-slate-500">{c.deltaLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
