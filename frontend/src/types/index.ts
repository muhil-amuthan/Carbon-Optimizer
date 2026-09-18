// ─── Emission / Grid Types ───────────────────────────────────────────────────

export interface GridIntensity {
  value: number;            // gCO₂/kWh
  status: 'low' | 'medium' | 'high';
  timestamp: string;
  source: string;
  location: string;
  next_clean_window?: string;
}

export interface HourlyIntensity {
  hour: string;             // "00:00" – "23:00"
  intensity: number;
  is_clean: boolean;
}

export interface OptimalWindow {
  start: string;
  end: string;
  avg_ci: number;
  min_ci: number;
  max_ci: number;
  co2_saving_kg: number;
  recommended: boolean;
}

export interface WeeklyForecast {
  date: string;
  day_name: string;
  night_ci: number;
  day_ci: number;
  peak_ci: number;
  avg_ci: number;
  is_today: boolean;
}

// ─── Emission / Carbon Types ─────────────────────────────────────────────────

export interface EmissionData {
  factory_id: string;
  date: string;
  total_emissions: number;
  scope1_total: number;
  scope2_total: number;
  scope3_total: number;
  emission_intensity: number;
}

export interface EmissionSummary {
  factory_id: string;
  period: string;
  total_emissions_kg: number;
  scope1_total: number;
  scope2_total: number;
  scope3_total: number;
  avg_daily_emissions: number;
  avg_intensity: number;
  trend: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  total: number;
  scope1: number;
  scope2: number;
  scope3: number;
  intensity: number;
}

export interface EmissionBreakdown {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AnomalyResult {
  date: string;
  factory_id: string;
  actual_emissions: number;
  expected_emissions: number;
  deviation_pct: number;
  is_anomaly: boolean;
  severity: 'normal' | 'warning' | 'critical';
}

export interface ForecastPoint {
  date: string;
  predicted_emissions: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
}

// ─── Optimization Types ──────────────────────────────────────────────────────

export interface OptimizationRequest {
  factory_id: string;
  budget_usd: number;
  target_reduction_pct?: number;
  exclude_actions?: string[];
}

export interface ActionRecommendation {
  action_id: string;
  name: string;
  category: string;
  scope: string;
  reduction_pct: number;
  cost_usd: number;
  payback_months: number;
  implementation_weeks: number;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  cost_effectiveness: number;
  phase?: 1 | 2 | 3;
}

export interface OptimizationResult {
  factory_id: string;
  budget_usd: number;
  total_cost: number;
  budget_remaining: number;
  total_reduction_pct: number;
  estimated_annual_savings_kg: number;
  roi_months: number;
  selected_actions: ActionRecommendation[];
  timeline: TimelineItem[];
  created_at: string;
}

export interface TimelineItem {
  action_id: string;
  name: string;
  start_week: number;
  end_week: number;
  duration_weeks: number;
  cumulative_reduction: number;
}

// ─── Simulation Types ────────────────────────────────────────────────────────

export interface SimulationRequest {
  factory_id: string;
  electricity_change_pct?: number;
  gas_change_pct?: number;
  diesel_change_pct?: number;
  waste_change_pct?: number;
  renewable_energy_pct?: number;
  production_change_pct?: number;
  electricity_reduction_pct?: number;
  fuel_switching_pct?: number;
  waste_reduction_pct?: number;
  renewable_share_pct?: number;
}

export interface SimulationResult {
  factory_id: string;
  baseline_emissions: number;
  simulated_emissions: number;
  change_pct?: number;
  change_absolute?: number;
  reduction_kg?: number;
  reduction_pct?: number;
  scope1_reduction?: number;
  scope2_reduction?: number;
  scope3_reduction?: number;
  cost_impact_usd?: number;
  breakdown?: {
    baseline: ScopeBreakdown;
    simulated: ScopeBreakdown;
  };
}

export interface ScopeBreakdown {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

// ─── Appliance / IoT Types ───────────────────────────────────────────────────

export interface Appliance {
  id: string;
  name: string;
  power_kw: number;
  category: string;
}

export interface SmartScheduleRequest {
  appliance: string;
  power_kw: number;
  duration_min: number;
  deadline: string;
}

export interface IoTControlRequest {
  device_id: string;
  action: 'ON' | 'OFF' | 'SCHEDULE';
  scheduled_time?: string;
}

export interface IoTControlResponse {
  device_id: string;
  action: string;
  status: string;
  message: string;
}

// ─── Achievement / Gamification ──────────────────────────────────────────────

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  earned: boolean;
  earned_date?: string;
  points: number;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface BaselineVsOptimized {
  baseline_co2: number;
  optimized_co2: number;
  potential_reduction: number;
  reduction_pct: number;
}

export interface CO2Budget {
  daily_budget: number;
  used: number;
  remaining: number;
  unit: string;
}

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppSettings {
  factory_id: string;
  location: string;
  live_mode: boolean;
  auto_mode: boolean;
  selected_appliance: string;
  co2_budget: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Aliases and extensions for compatibility
export type ReductionAction = ActionRecommendation;

export interface TimelinePhase {
  phase: number;
  label: string;
  timeframe: string;
  total_cost: number;
  total_reduction_pct: number;
  actions: ActionRecommendation[];
}
