import type { FiscalYear } from '@/lib/schema/validation';
import type { KPIMetric, WorkforceResult } from '@/lib/engine/types';

// ── Formatting helpers ──

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatRatio(value: number): string {
  return value.toFixed(1);
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

function ratioMetric(
  name: string,
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  numField: string,
  denomField: string,
  formatter: (v: number) => string,
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
    formatted: formatter(value),
    numerator_field: numField,
    denominator_field: denomField,
    suppressed: false,
  };
}

/**
 * N07 — Workforce and sourcing metrics for a single fiscal year.
 *
 * Metrics:
 *   - Spend per Employee          = total_it_spend / employee_count
 *   - Spend per IT FTE            = total_it_spend / it_fte_count
 *   - IT FTE per 100 Employees    = (it_fte_count / employee_count) * 100
 *   - Contractor Ratio            = contractor_count / (it_fte_count + contractor_count)
 *   - Outsourced Spend Ratio      = outsourced_spend / total_it_spend
 *   - Internal vs External        = internal_labor_spend / (internal_labor_spend + outsourced_spend)
 *
 * Returns null if no workforce inputs exist at all.
 */
export function calculateWorkforce(fiscalYear: FiscalYear): WorkforceResult | null {
  const {
    total_it_spend,
    employee_count,
    it_fte_count,
    contractor_count,
    contractor_spend,
    outsourced_spend,
    internal_labor_spend,
  } = fiscalYear;

  // If none of the workforce-specific fields are present, return null
  const hasAnyWorkforceInput =
    employee_count != null ||
    it_fte_count != null ||
    contractor_count != null ||
    contractor_spend != null ||
    outsourced_spend != null ||
    internal_labor_spend != null;

  if (!hasAnyWorkforceInput) return null;

  const spend_per_employee = ratioMetric(
    'Spend per Employee',
    total_it_spend, employee_count,
    'total_it_spend', 'employee_count',
    formatCurrency,
  );

  const spend_per_it_fte = ratioMetric(
    'Spend per IT FTE',
    total_it_spend, it_fte_count,
    'total_it_spend', 'it_fte_count',
    formatCurrency,
  );

  // IT FTE per 100 employees: (it_fte_count / employee_count) * 100
  const it_fte_per_100_employees = (() => {
    if (it_fte_count == null || employee_count == null || employee_count <= 0) {
      const reasons: string[] = [];
      if (it_fte_count == null) reasons.push('it_fte_count is missing');
      if (employee_count == null) reasons.push('employee_count is missing');
      else if (employee_count <= 0) reasons.push('employee_count must be > 0');
      return suppressed('IT FTE per 100 Employees', 'it_fte_count', 'employee_count', reasons.join('; '));
    }
    const value = (it_fte_count / employee_count) * 100;
    return {
      name: 'IT FTE per 100 Employees',
      value,
      formatted: formatRatio(value),
      numerator_field: 'it_fte_count',
      denominator_field: 'employee_count',
      suppressed: false,
    } as KPIMetric;
  })();

  // Contractor ratio: contractor_count / (it_fte_count + contractor_count)
  const contractor_ratio = (() => {
    if (contractor_count == null || it_fte_count == null) {
      const reasons: string[] = [];
      if (contractor_count == null) reasons.push('contractor_count is missing');
      if (it_fte_count == null) reasons.push('it_fte_count is missing');
      return suppressed('Contractor Ratio', 'contractor_count', 'it_fte_count + contractor_count', reasons.join('; '));
    }
    const denom = it_fte_count + contractor_count;
    if (denom <= 0) {
      return suppressed('Contractor Ratio', 'contractor_count', 'it_fte_count + contractor_count', 'Total headcount must be > 0');
    }
    const value = contractor_count / denom;
    return {
      name: 'Contractor Ratio',
      value,
      formatted: formatPct(value),
      numerator_field: 'contractor_count',
      denominator_field: 'it_fte_count + contractor_count',
      suppressed: false,
    } as KPIMetric;
  })();

  const outsourced_spend_ratio = ratioMetric(
    'Outsourced Spend Ratio',
    outsourced_spend, total_it_spend,
    'outsourced_spend', 'total_it_spend',
    formatPct,
  );

  // Internal vs External: internal / (internal + outsourced)
  const internal_vs_external = (() => {
    if (internal_labor_spend == null || outsourced_spend == null) {
      const reasons: string[] = [];
      if (internal_labor_spend == null) reasons.push('internal_labor_spend is missing');
      if (outsourced_spend == null) reasons.push('outsourced_spend is missing');
      return suppressed('Internal vs External', 'internal_labor_spend', 'internal_labor_spend + outsourced_spend', reasons.join('; '));
    }
    const denom = internal_labor_spend + outsourced_spend;
    if (denom <= 0) {
      return suppressed('Internal vs External', 'internal_labor_spend', 'internal_labor_spend + outsourced_spend', 'Total labor spend must be > 0');
    }
    const value = internal_labor_spend / denom;
    return {
      name: 'Internal vs External',
      value,
      formatted: formatPct(value),
      numerator_field: 'internal_labor_spend',
      denominator_field: 'internal_labor_spend + outsourced_spend',
      suppressed: false,
    } as KPIMetric;
  })();

  return {
    spend_per_employee,
    spend_per_it_fte,
    it_fte_per_100_employees,
    contractor_ratio,
    outsourced_spend_ratio,
    internal_vs_external,
  };
}
