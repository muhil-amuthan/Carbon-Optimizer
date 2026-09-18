import { CI_THRESHOLDS } from './constants';

// ─── Number Formatters ───────────────────────────────────────────────────────

export function formatCO2(value: number, unit = 'kg'): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Mt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} t`;
  return `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} ${unit}`;
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(value: number, currency = '₹'): string {
  if (value >= 10_000_000) return `${currency}${(value / 10_000_000).toFixed(2)}Cr`;
  if (value >= 100_000) return `${currency}${(value / 100_000).toFixed(2)}L`;
  if (value >= 1_000) return `${currency}${(value / 1_000).toFixed(1)}K`;
  return `${currency}${value.toLocaleString('en-IN')}`;
}

export function formatCurrencyUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatPct(value: number, sign = false): string {
  const s = sign && value > 0 ? '+' : '';
  return `${s}${value.toFixed(1)}%`;
}

export function formatCI(value: number): string {
  return `${Math.round(value)} gCO₂/kWh`;
}

// ─── Date / Time Formatters ──────────────────────────────────────────────────

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

// ─── CI Status Helpers ───────────────────────────────────────────────────────

export function getCIStatus(value: number): 'low' | 'medium' | 'high' {
  if (value <= CI_THRESHOLDS.low) return 'low';
  if (value <= CI_THRESHOLDS.medium) return 'medium';
  return 'high';
}

export function getCIColor(status: 'low' | 'medium' | 'high'): string {
  return { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }[status];
}

export function getCIBgClass(status: 'low' | 'medium' | 'high'): string {
  return {
    low: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    medium: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20',
    high: 'bg-brand-red/10 text-brand-red border-brand-red/20',
  }[status];
}

// ─── Duration Formatters ─────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function formatWeeks(weeks: number): string {
  if (weeks < 4) return `${weeks}w`;
  const months = Math.round(weeks / 4.33);
  return `${months}mo`;
}
