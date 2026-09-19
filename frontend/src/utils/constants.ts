// ─── CarbonWise Constants ────────────────────────────────────────────────────

export const COLORS = {
  green: '#10b981',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  red: '#ef4444',
  muted: '#64748b',
  border: '#1e293b',
  card: '#151d2e',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
} as const;

export const EMISSION_CATEGORY_COLORS: Record<string, string> = {
  Electricity: COLORS.blue,
  Production: COLORS.purple,
  Waste: COLORS.amber,
  Fuel: COLORS.red,
  Transport: COLORS.cyan,
};

export const CI_THRESHOLDS = {
  low: 300,       // gCO₂/kWh — green
  medium: 500,    // gCO₂/kWh — amber
  // > medium = high — red
} as const;

export const APPLIANCES = [
  { id: 'ev_charger', name: 'EV Charger', power_kw: 7, category: 'Transport' },
  { id: 'industrial_motor', name: 'Industrial Motor', power_kw: 15, category: 'Production' },
  { id: 'hvac', name: 'HVAC System', power_kw: 10, category: 'Building' },
  { id: 'compressor', name: 'Air Compressor', power_kw: 22, category: 'Production' },
  { id: 'welding_machine', name: 'Welding Machine', power_kw: 5, category: 'Production' },
  { id: 'conveyor', name: 'Conveyor Belt', power_kw: 8, category: 'Production' },
  { id: 'refrigeration', name: 'Cold Storage', power_kw: 12, category: 'Storage' },
  { id: 'lighting', name: 'Industrial Lighting', power_kw: 3, category: 'Building' },
] as const;

export const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_save', icon: '🌱', name: 'First Save', description: 'Made your first CO₂ reduction', points: 100 },
  { id: 'green_week', icon: '🌿', name: 'Green Week', description: 'Maintained low emissions for 7 days', points: 250 },
  { id: 'ton_saver', icon: '🏆', name: 'Ton Saver', description: 'Saved 1 ton of CO₂ emissions', points: 500 },
  { id: 'grid_optimizer', icon: '⚡', name: 'Grid Optimizer', description: 'Scheduled 10+ loads during clean windows', points: 300 },
  { id: 'eco_champion', icon: '🌍', name: 'Eco Champion', description: 'Achieved 30% emission reduction', points: 750 },
  { id: 'night_owl', icon: '🦉', name: 'Night Owl', description: 'Used overnight low-CI windows 5 times', points: 200 },
  { id: 'solar_surfer', icon: '☀️', name: 'Solar Surfer', description: 'Shifted loads to peak solar hours', points: 350 },
  { id: 'early_bird', icon: '🐦', name: 'Early Bird', description: 'Scheduled loads before 6 AM consistently', points: 200 },
] as const;

export const PHASE_LABELS = {
  1: { label: 'NOW', color: COLORS.red, description: 'Immediate actions (0–3 months)' },
  2: { label: 'NEAR TERM', color: COLORS.amber, description: 'Short-term actions (3–12 months)' },
  3: { label: 'LONG TERM', color: COLORS.blue, description: 'Strategic actions (1–3 years)' },
} as const;

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export const DEFAULT_FACTORY_ID = 'FACTORY_A';
