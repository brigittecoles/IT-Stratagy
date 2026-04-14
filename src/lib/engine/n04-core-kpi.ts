import type { FiscalYear } from '@/lib/schema/validation';
import type { KPIMetric, CoreKPISet } from '@/lib/engine/types';

// ── Formatting helpers ──

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// ── Metric builders ──

function suppressed(name: string, numField: string, denomField: string, reason: string): KPIMetric {
  return {
    name,
    value: 0,
    formatted: 'N/A',
    numerator_field: numField,
    denominator_field: denomField,
    suppressed: true,
    suppress_reason: reason,
  };
}

function pctMetric(
  name: string,
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  numField: string,
  denomField: string,
): KPIMetric {
  if (numerator == null || denominator == null || denominator <= 0) {
    const reasons: string[] = [];
    if (numerator == null) reasons.push(`${numField} is missing`);
    if (denominator == null) reasons.push(`${denomField} is missing`);
    else if (denominator <= 0) reasons.push(`${denomField} must be > 0`);
    return suppressed(name, numField, denomField, reasons.join('; '));
  }

  const value = numerator / denominator;
  return {
    name,
    value,
    formatted: formatPct(value),
    numerator_field: numField,
    denominator_field: denomField,
    suppressed: false,
  };
}

/**
 * N04 — Calculate core KPI metrics for a single fiscal year.
 *
 * Metrics:
 *   - IT Spend % Revenue          = total_it_spend / revenue
 *   - OpEx % Revenue              = it_opex_spend / revenue
 *   - CapEx % Revenue             = it_capex_spend / revenue
 *   - OpEx Mix                    = it_opex_spend / total_it_spend
 *   - CapEx Mix                   = it_capex_spend / total_it_spend
 *   - D&A % IT Spend              = it_da_spend / total_it_spend
 */
export function calculateCoreKPIs(fiscalYear: FiscalYear): CoreKPISet {
  const { revenue, total_it_spend, it_opex_spend, it_capex_spend, it_da_spend } = fiscalYear;

  return {
    it_spend_pct_revenue: pctMetric(
      'IT Spend % Revenue',
      total_it_spend, revenue,
      'total_it_spend', 'revenue',
    ),
    opex_pct_revenue: pctMetric(
      'OpEx % Revenue',
      it_opex_spend, revenue,
      'it_opex_spend', 'revenue',
    ),
    capex_pct_revenue: pctMetric(
      'CapEx % Revenue',
      it_capex_spend, revenue,
      'it_capex_spend', 'revenue',
    ),
    opex_mix: pctMetric(
      'OpEx Mix',
      it_opex_spend, total_it_spend,
      'it_opex_spend', 'total_it_spend',
    ),
    capex_mix: pctMetric(
      'CapEx Mix',
      it_capex_spend, total_it_spend,
      'it_capex_spend', 'total_it_spend',
    ),
    da_pct_it_spend: pctMetric(
      'D&A % IT Spend',
      it_da_spend, total_it_spend,
      'it_da_spend', 'total_it_spend',
    ),
  };
}
