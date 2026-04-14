import type { FiscalYear } from '@/lib/schema/validation';
import type { YoYMetric, YoYResult } from '@/lib/engine/types';

// ── Formatting helpers ──

function formatDelta(dollars: number): string {
  const sign = dollars >= 0 ? '+' : '-';
  const abs = Math.abs(dollars);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatDeltaPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${(pct * 100).toFixed(1)}%`;
}

function buildYoYMetric(
  name: string,
  current: number,
  prior: number,
): YoYMetric {
  const delta_dollars = current - prior;
  const delta_pct = prior !== 0 ? delta_dollars / prior : 0;

  return {
    name,
    current_value: current,
    prior_value: prior,
    delta_dollars,
    delta_pct,
    formatted_delta: `${formatDelta(delta_dollars)} (${formatDeltaPct(delta_pct)})`,
  };
}

/**
 * N05 — Year-over-year math.
 *
 * Requires at least 2 fiscal years (sorted by fiscal_year_order).
 * Compares the two most recent years that have both revenue and total_it_spend.
 * Returns null if fewer than 2 qualifying years exist.
 */
export function calculateYoY(years: FiscalYear[]): YoYResult | null {
  // Sort ascending by fiscal_year_order (order 1 = current/most recent, 2 = prior)
  const sorted = [...years].sort((a, b) => a.fiscal_year_order - b.fiscal_year_order);

  // Filter to years that have both revenue and total_it_spend
  const qualifying = sorted.filter(
    (fy) => fy.revenue != null && fy.revenue > 0 && fy.total_it_spend != null && fy.total_it_spend > 0
  );

  if (qualifying.length < 2) return null;

  // fiscal_year_order 1 = current/most recent, higher numbers = older
  const current = qualifying[0];
  const prior = qualifying[1];

  const it_spend_change = buildYoYMetric(
    'IT Spend Change',
    current.total_it_spend!,
    prior.total_it_spend!,
  );

  const revenue_change = buildYoYMetric(
    'Revenue Change',
    current.revenue!,
    prior.revenue!,
  );

  // Compare growth rates
  const SIMILAR_THRESHOLD = 0.02; // within 2 percentage points
  const itGrowth = it_spend_change.delta_pct;
  const revGrowth = revenue_change.delta_pct;
  const diff = itGrowth - revGrowth;

  let spend_vs_revenue_growth: YoYResult['spend_vs_revenue_growth'];
  if (Math.abs(diff) <= SIMILAR_THRESHOLD) {
    spend_vs_revenue_growth = 'Growing at similar pace';
  } else if (diff > 0) {
    spend_vs_revenue_growth = 'IT growing faster';
  } else {
    spend_vs_revenue_growth = 'Revenue growing faster';
  }

  return {
    it_spend_change,
    revenue_change,
    spend_vs_revenue_growth,
  };
}
