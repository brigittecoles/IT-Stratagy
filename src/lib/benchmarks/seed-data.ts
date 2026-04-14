import type { BenchmarkFamily, BenchmarkMetric } from '@/lib/engine/types';
import type { GicsGroup } from '@/lib/schema/value-lists';
import {
  BENCHMARK_DATABASE,
  getIndustryByGics,
  type IndustryBenchmark,
} from '@/lib/benchmarks/benchmark-database';

// ── Benchmark Families — one per industry in the Gartner database ──

function makeFamilyFromIndustry(industry: IndustryBenchmark): BenchmarkFamily {
  return {
    family_id: `bmk-${industry.industry_id}-2026`,
    industry_gics_group: industry.display_name,
    business_model_overlay: null,
    source: industry.source_ref,
    effective_date: '2026-01-01',
    version_id: 'v2026.1',
  };
}

export const BENCHMARK_FAMILIES: BenchmarkFamily[] =
  BENCHMARK_DATABASE.map(makeFamilyFromIndustry);

// ── Convert IndustryBenchmark → BenchmarkMetric[] ──
// All values stored as DECIMALS (0.066 = 6.6%)
// The engine KPIs also compute as decimals, so no conversion needed in N09.

function industryToMetrics(industry: IndustryBenchmark): BenchmarkMetric[] {
  const metrics: BenchmarkMetric[] = [];
  const dist = industry.it_spend_pct_revenue.distribution;

  if (dist) {
    // IT Spend % Revenue — the primary metric
    metrics.push({
      metric_name: 'it_spend_pct_revenue',
      median: dist.median,
      p75: dist.p75,
      top_quartile: dist.p25,  // P25 = "top quartile" for cost metrics (lower = better)
      coverage: 'Broad',
    });
  }

  // OpEx and CapEx as % of Revenue (derived from summary opex/capex split)
  if (dist) {
    const opexPct = industry.summary.opex_pct;
    const capexPct = industry.summary.capex_pct;
    metrics.push({
      metric_name: 'opex_pct_revenue',
      median: dist.median * opexPct,
      p75: dist.p75 * opexPct,
      top_quartile: dist.p25 * opexPct,
      coverage: 'Derived',
    });
    metrics.push({
      metric_name: 'capex_pct_revenue',
      median: dist.median * capexPct,
      p75: dist.p75 * capexPct,
      top_quartile: dist.p25 * capexPct,
      coverage: 'Derived',
    });
  }

  // OpEx / CapEx mix ratios
  metrics.push({
    metric_name: 'opex_mix',
    median: industry.summary.opex_pct,
    p75: industry.summary.opex_pct + 0.05,  // Typical spread
    top_quartile: industry.summary.opex_pct - 0.05,
    coverage: 'Broad',
  });
  metrics.push({
    metric_name: 'capex_mix',
    median: industry.summary.capex_pct,
    p75: industry.summary.capex_pct + 0.05,
    top_quartile: industry.summary.capex_pct - 0.05,
    coverage: 'Broad',
  });

  // IT Spend per Employee (in dollars — convert from $K)
  const empDist = industry.it_spend_per_employee_k.distribution;
  metrics.push({
    metric_name: 'spend_per_employee',
    median: empDist.median * 1000,
    p75: empDist.p75 * 1000,
    top_quartile: empDist.p25 * 1000,
    coverage: 'Broad',
  });

  // IT FTE per 100 employees
  metrics.push({
    metric_name: 'it_fte_per_100_employees',
    median: industry.summary.it_fte_pct_employees * 100,
    p75: industry.summary.it_fte_pct_employees * 100 * 1.3,  // ~30% above median spread
    top_quartile: industry.summary.it_fte_pct_employees * 100 * 0.7,
    coverage: 'Broad',
  });

  return metrics;
}

// Build the full metrics lookup: family_id → BenchmarkMetric[]
const INDUSTRY_METRICS: Record<string, BenchmarkMetric[]> = {};
for (const industry of BENCHMARK_DATABASE) {
  const familyId = `bmk-${industry.industry_id}-2026`;
  INDUSTRY_METRICS[familyId] = industryToMetrics(industry);
}

export const BENCHMARK_METRICS: Record<string, BenchmarkMetric[]> = INDUSTRY_METRICS;

// ── Lookup helpers ──

/**
 * Find a benchmark family by industry name.
 * Tries: exact display_name match → GICS group match → fuzzy match.
 */
export function getBenchmarkFamily(industry: string): BenchmarkFamily | null {
  // 1. Exact display name match
  const byName = BENCHMARK_FAMILIES.find(
    (f) => f.industry_gics_group.toLowerCase() === industry.toLowerCase(),
  );
  if (byName) return byName;

  // 2. GICS group match
  const byGics = getIndustryByGics(industry);
  if (byGics) {
    return BENCHMARK_FAMILIES.find(
      (f) => f.family_id === `bmk-${byGics.industry_id}-2026`,
    ) ?? null;
  }

  // 3. Fuzzy/partial match
  const lower = industry.toLowerCase();
  return BENCHMARK_FAMILIES.find(
    (f) => f.industry_gics_group.toLowerCase().includes(lower)
      || lower.includes(f.industry_gics_group.toLowerCase()),
  ) ?? null;
}

export function getBenchmarkMetrics(familyId: string): BenchmarkMetric[] {
  return BENCHMARK_METRICS[familyId] ?? [];
}
