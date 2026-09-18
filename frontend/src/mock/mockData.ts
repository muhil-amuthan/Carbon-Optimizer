/**
 * MOCK DATA — Development fallback only.
 * These values are used ONLY when the real API is unavailable.
 * All types mirror the real API response shapes exactly.
 * When the backend responds successfully, this data is NEVER used.
 */

import type {
  GridIntensity, HourlyIntensity, WeeklyForecast, OptimalWindow,
  EmissionSummary, EmissionBreakdown, AnomalyResult, ForecastPoint,
  OptimizationResult, SimulationResult, Achievement,
  BaselineVsOptimized, CO2Budget,
} from '../types';
import { ACHIEVEMENT_DEFINITIONS, COLORS } from '../utils/constants';

// ─── Grid ────────────────────────────────────────────────────────────────────

export const mockGridIntensity: GridIntensity = {
  value: 420,
  status: 'medium',
  timestamp: new Date().toISOString(),
  source: 'Regional Grid Mix',
  location: 'Tamil Nadu, India',
  next_clean_window: '02:00 – 06:00',
};

export const mockHourlyIntensity: HourlyIntensity[] = Array.from({ length: 24 }, (_, i) => {
  const baseIntensities = [310,290,280,270,260,300,380,450,490,510,480,440,420,400,430,470,500,520,480,450,400,380,350,320];
  return {
    hour: `${String(i).padStart(2, '0')}:00`,
    intensity: baseIntensities[i] + Math.floor(Math.random() * 20 - 10),
    is_clean: baseIntensities[i] < 350,
  };
});

export const mockOptimalWindows: OptimalWindow[] = [
  { start: '02:00', end: '04:00', avg_ci: 265, min_ci: 240, max_ci: 290, co2_saving_kg: 4.2, recommended: true },
  { start: '03:00', end: '05:00', avg_ci: 278, min_ci: 255, max_ci: 300, co2_saving_kg: 3.8, recommended: false },
  { start: '13:00', end: '15:00', avg_ci: 310, min_ci: 290, max_ci: 330, co2_saving_kg: 2.9, recommended: false },
];

export const mockWeeklyForecast: WeeklyForecast[] = [
  { date: '2026-09-15', day_name: 'Mon', night_ci: 280, day_ci: 430, peak_ci: 540, avg_ci: 418, is_today: false },
  { date: '2026-09-16', day_name: 'Tue', night_ci: 295, day_ci: 460, peak_ci: 580, avg_ci: 445, is_today: false },
  { date: '2026-09-17', day_name: 'Wed', night_ci: 270, day_ci: 410, peak_ci: 520, avg_ci: 400, is_today: false },
  { date: '2026-09-18', day_name: 'Thu', night_ci: 260, day_ci: 390, peak_ci: 490, avg_ci: 380, is_today: true },
  { date: '2026-09-19', day_name: 'Fri', night_ci: 310, day_ci: 480, peak_ci: 600, avg_ci: 465, is_today: false },
  { date: '2026-09-20', day_name: 'Sat', night_ci: 250, day_ci: 370, peak_ci: 460, avg_ci: 360, is_today: false },
  { date: '2026-09-21', day_name: 'Sun', night_ci: 230, day_ci: 350, peak_ci: 430, avg_ci: 340, is_today: false },
];

// ─── Emissions ───────────────────────────────────────────────────────────────

export const mockEmissionSummary: EmissionSummary = {
  factory_id: 'FACTORY_A',
  period: '2026-06-01 to 2026-09-18',
  total_emissions_kg: 1_240_500,
  scope1_total: 372_150,
  scope2_total: 620_250,
  scope3_total: 248_100,
  avg_daily_emissions: 13_800,
  avg_intensity: 0.0138,
  trend: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    total: 12000 + Math.random() * 4000,
    scope1: 3600 + Math.random() * 1200,
    scope2: 6000 + Math.random() * 2000,
    scope3: 2400 + Math.random() * 800,
    intensity: 0.012 + Math.random() * 0.004,
  })),
};

export const mockBreakdown: EmissionBreakdown[] = [
  { category: 'Electricity', value: 620250, percentage: 50, color: COLORS.blue },
  { category: 'Production', value: 248100, percentage: 20, color: COLORS.purple },
  { category: 'Waste', value: 186075, percentage: 15, color: COLORS.amber },
  { category: 'Fuel', value: 124050, percentage: 10, color: COLORS.red },
  { category: 'Transport', value: 62025, percentage: 5, color: COLORS.cyan },
];

export const mockAnomalies: AnomalyResult[] = [
  { date: '2026-08-15', factory_id: 'FACTORY_A', actual_emissions: 21000, expected_emissions: 14000, deviation_pct: 50, is_anomaly: true, severity: 'critical' },
  { date: '2026-07-22', factory_id: 'FACTORY_A', actual_emissions: 17500, expected_emissions: 14000, deviation_pct: 25, is_anomaly: true, severity: 'warning' },
];

export const mockForecast: ForecastPoint[] = Array.from({ length: 30 }, (_, i) => {
  const base = 13500 + i * 50;
  return {
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    predicted_emissions: base + Math.random() * 1000,
    lower_bound: base * 0.9,
    upper_bound: base * 1.1,
    confidence: 0.85,
  };
});

// ─── Optimization ────────────────────────────────────────────────────────────

export const mockOptimizationResult: OptimizationResult = {
  factory_id: 'FACTORY_A',
  budget_usd: 100000,
  total_cost: 87500,
  budget_remaining: 12500,
  total_reduction_pct: 34.5,
  estimated_annual_savings_kg: 428250,
  roi_months: 24,
  selected_actions: [
    { action_id: 'ACT001', name: 'LED Lighting Retrofit', category: 'Energy Efficiency', scope: 'scope2', reduction_pct: 8, cost_usd: 12000, payback_months: 18, implementation_weeks: 4, priority: 'high', difficulty: 'easy', description: 'Replace all fluorescent fixtures with LED', cost_effectiveness: 0.00067, phase: 1 },
    { action_id: 'ACT002', name: 'Compressed Air Audit & Repair', category: 'Energy Efficiency', scope: 'scope2', reduction_pct: 6, cost_usd: 8000, payback_months: 12, implementation_weeks: 3, priority: 'high', difficulty: 'easy', description: 'Fix leaks and optimize compressed air system', cost_effectiveness: 0.00075, phase: 1 },
    { action_id: 'ACT003', name: 'Variable Frequency Drives', category: 'Motor Efficiency', scope: 'scope2', reduction_pct: 10, cost_usd: 25000, payback_months: 30, implementation_weeks: 8, priority: 'medium', difficulty: 'medium', description: 'Install VFDs on pump and fan motors', cost_effectiveness: 0.0004, phase: 2 },
    { action_id: 'ACT004', name: 'Rooftop Solar Installation', category: 'Renewable Energy', scope: 'scope2', reduction_pct: 15, cost_usd: 45000, payback_months: 60, implementation_weeks: 12, priority: 'medium', difficulty: 'hard', description: '200 kW rooftop solar PV system', cost_effectiveness: 0.000333, phase: 3 },
    { action_id: 'ACT005', name: 'Fleet Electrification', category: 'Transport', scope: 'scope3', reduction_pct: 5, cost_usd: 18000, payback_months: 36, implementation_weeks: 6, priority: 'low', difficulty: 'medium', description: 'Replace diesel delivery vehicles with EVs', cost_effectiveness: 0.000278, phase: 3 },
  ],
  timeline: [
    { action_id: 'ACT001', name: 'LED Lighting Retrofit', start_week: 0, end_week: 4, duration_weeks: 4, cumulative_reduction: 8 },
    { action_id: 'ACT002', name: 'Compressed Air Audit', start_week: 4, end_week: 7, duration_weeks: 3, cumulative_reduction: 14 },
    { action_id: 'ACT003', name: 'Variable Frequency Drives', start_week: 7, end_week: 15, duration_weeks: 8, cumulative_reduction: 24 },
    { action_id: 'ACT004', name: 'Rooftop Solar', start_week: 15, end_week: 27, duration_weeks: 12, cumulative_reduction: 34.5 },
  ],
  created_at: new Date().toISOString(),
};

// ─── Simulation ───────────────────────────────────────────────────────────────

export const mockSimulationResult: SimulationResult = {
  factory_id: 'FACTORY_A',
  baseline_emissions: 14000,
  simulated_emissions: 9800,
  change_pct: -30,
  change_absolute: -4200,
  breakdown: {
    baseline: { scope1: 4200, scope2: 7000, scope3: 2800, total: 14000 },
    simulated: { scope1: 3360, scope2: 4200, scope3: 2240, total: 9800 },
  },
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const mockBaselineVsOptimized: BaselineVsOptimized = {
  baseline_co2: 14000,
  optimized_co2: 9170,
  potential_reduction: 4830,
  reduction_pct: 34.5,
};

export const mockCO2Budget: CO2Budget = {
  daily_budget: 15000,
  used: 13800,
  remaining: 1200,
  unit: 'kg',
};

// ─── Achievements ────────────────────────────────────────────────────────────

export const mockAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((a, i) => ({
  ...a,
  earned: i < 3,
  earned_date: i < 3 ? new Date(Date.now() - i * 7 * 86400000).toISOString().split('T')[0] : undefined,
}));

export const mockEmissionBreakdown = mockBreakdown;
export const mockReductionActions = mockOptimizationResult.selected_actions;
