import type {
  CoreKPISet,
  BenchmarkFamily,
  BenchmarkMetric,
  BenchmarkGap,
} from '@/lib/engine/types';

/**
 * N09 — Benchmark comparison.
 * Compares actual KPIs to benchmark metrics and calculates gap %
 * and gap $ for each metric vs median, p75, and top quartile.
 */
export function compareToBenchmarks(
  kpis: CoreKPISet,
  _family: BenchmarkFamily,
  metrics: BenchmarkMetric[],
  revenue: number,
): BenchmarkGap[] {
  // Map KPI names to their actual values
  const kpiLookup: Record<string, number | null> = {
    it_spend_pct_revenue: kpis.it_spend_pct_revenue.suppressed ? null : kpis.it_spend_pct_revenue.value,
    opex_pct_revenue: kpis.opex_pct_revenue.suppressed ? null : kpis.opex_pct_revenue.value,
    capex_pct_revenue: kpis.capex_pct_revenue.suppressed ? null : kpis.capex_pct_revenue.value,
    opex_mix: kpis.opex_mix.suppressed ? null : kpis.opex_mix.value,
    capex_mix: kpis.capex_mix.suppressed ? null : kpis.capex_mix.value,
    da_pct_it_spend: kpis.da_pct_it_spend.suppressed ? null : kpis.da_pct_it_spend.value,
  };

  // All benchmark values are now stored as decimals (0.066 = 6.6%),
  // matching the KPI computation format. No unit conversion needed.

  const gaps: BenchmarkGap[] = [];

  for (const metric of metrics) {
    const actual = kpiLookup[metric.metric_name];

    // Skip metrics where we have no actual value
    if (actual === null || actual === undefined) {
      continue;
    }

    const benchMedian = metric.median;
    const benchP75 = metric.p75;
    const benchTopQ = metric.top_quartile;

    // Gap = actual - benchmark (positive means spending more than benchmark)
    const gapVsMedianPct = actual - benchMedian;
    const gapVsMedianDollars = gapVsMedianPct * revenue;

    const gapVsP75Pct = actual - benchP75;
    const gapVsP75Dollars = gapVsP75Pct * revenue;

    gaps.push({
      metric_name: metric.metric_name,
      actual_pct: actual,
      benchmark_median: benchMedian,
      benchmark_p75: benchP75,
      benchmark_top_quartile: benchTopQ,
      gap_vs_median_pct: round4(gapVsMedianPct),
      gap_vs_median_dollars: Math.round(gapVsMedianDollars),
      gap_vs_p75_pct: round4(gapVsP75Pct),
      gap_vs_p75_dollars: Math.round(gapVsP75Dollars),
    });
  }

  return gaps;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
