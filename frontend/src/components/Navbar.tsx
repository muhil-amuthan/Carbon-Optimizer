import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  Building2,
} from 'lucide-react';
import { getCIColor, getCIBgClass, formatCI } from '../utils/formatters';

interface NavbarProps {
  currentFactory: string;
  onFactoryChange: (factory: string) => void;
  gridIntensity?: number;
  gridStatus?: 'low' | 'medium' | 'high';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentFactory,
  onFactoryChange,
  gridIntensity = 420,
  gridStatus = 'medium',
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/data', label: 'Data & Emissions', icon: UploadCloud },
    { to: '/optimize', label: 'Budget Optimizer', icon: Sparkles },
    { to: '/simulator', label: 'What-If Simulator', icon: Sliders },
    { to: '/automation', label: 'Grid & IoT', icon: Zap },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-[#0d1321]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                  CarbonWise
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  AI Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Industrial Emission Intelligence & Optimization
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls: Factory Selector & Grid Live Pill */}
          <div className="flex items-center space-x-3">
            {/* Factory Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <select
                value={currentFactory}
                onChange={(e) => onFactoryChange(e.target.value)}
                className="bg-transparent border-none text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="FACTORY_A" className="bg-slate-900 text-slate-200">Plant Alpha (Tamil Nadu)</option>
                <option value="FACTORY_B" className="bg-slate-900 text-slate-200">Plant Beta (Gujarat)</option>
                <option value="FACTORY_C" className="bg-slate-900 text-slate-200">Plant Gamma (Maharashtra)</option>
              </select>
            </div>

            {/* Live Grid Indicator */}
            <div
              className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getCIBgClass(
                gridStatus
              )}`}
              title="Regional Power Grid Carbon Intensity"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: getCIColor(gridStatus) }}
                ></span>
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: getCIColor(gridStatus) }}
                ></span>
              </span>
              <span>Grid: {formatCI(gridIntensity)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
