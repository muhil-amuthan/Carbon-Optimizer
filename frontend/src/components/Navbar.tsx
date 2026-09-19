import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileBarChart2,
  SlidersHorizontal,
  Cpu,
  Leaf,
  Building2,
} from 'lucide-react';
import { getCIColor, formatCI } from '../utils/formatters';

interface NavbarProps {
  currentFactory: string;
  onFactoryChange: (factory: string) => void;
  gridIntensity?: number;
  gridStatus?: 'low' | 'medium' | 'high';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentFactory,
  onFactoryChange,
  gridIntensity = 410,
  gridStatus = 'medium',
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/data', label: 'Data & Emissions', icon: FileBarChart2 },
    { to: '/optimize', label: 'Budget Optimizer', icon: SlidersHorizontal },
    { to: '/simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
    { to: '/automation', label: 'Grid & IoT', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#E3E9E5] bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-[#EBF5F0] text-[#168A5B] flex items-center justify-center border border-[#D5E6DC]">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-[#1A2E24]">
                  CarbonWise
                </span>
              </div>
              <p className="text-[11px] text-[#768E82] hidden sm:block leading-none">
                Industrial Carbon Intelligence
              </p>
            </div>
          </div>

          {/* Minimal Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-[#EBF5F0] text-[#168A5B] font-semibold'
                        : 'text-[#486255] hover:text-[#1A2E24] hover:bg-[#F4F7F5]'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls: Plant Selector & Live Indicator */}
          <div className="flex items-center space-x-2.5">
            {/* Plant Selector */}
            <div className="flex items-center space-x-1.5 bg-[#F7FAF8] border border-[#E3E9E5] rounded-lg px-2.5 py-1 text-xs text-[#1A2E24]">
              <Building2 className="h-3.5 w-3.5 text-[#168A5B]" />
              <select
                value={currentFactory}
                onChange={(e) => onFactoryChange(e.target.value)}
                className="bg-transparent border-none text-xs font-medium text-[#1A2E24] focus:outline-none cursor-pointer"
              >
                <option value="FACTORY_A">Plant Alpha (Tamil Nadu)</option>
                <option value="FACTORY_B">Plant Beta (Gujarat)</option>
                <option value="FACTORY_C">Plant Gamma (Maharashtra)</option>
              </select>
            </div>

            {/* Clean Grid Status Pill */}
            <div
              className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full border border-[#E3E9E5] bg-[#F7FAF8] text-xs"
              title="Regional Grid Carbon Intensity"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getCIColor(gridStatus) }}
              />
              <span className="text-[#486255] font-medium">Grid:</span>
              <span className="font-mono text-[#1A2E24] font-semibold">{formatCI(gridIntensity)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
