import type { BenchmarkFamily, BenchmarkMetric } from '@/lib/engine/types';
import {
  getBenchmarkFamily,
  getBenchmarkMetrics,
  BENCHMARK_FAMILIES,
} from '@/lib/benchmarks/seed-data';

export interface BenchmarkSelectResult {
  family: BenchmarkFamily | null;
  metrics: BenchmarkMetric[];
  note: string;
}

/**
 * N02 — Select the correct benchmark family for a given industry
 * and optional business-model overlay.
 *
 * Resolution order:
 *   1. Match on industry_gics_group (exact, case-insensitive).
 *   2. If a business_model overlay is provided, note it for future
 *      adjustment (overlay data is not yet in seed — noted in output).
 *   3. If no match, return null family with an explanatory note.
 */
export function selectBenchmarkFamily(
  industry: string,
  businessModel?: string | null,
): BenchmarkSelectResult {
  if (!industry || industry.trim().length === 0) {
    return {
      family: null,
      metrics: [],
      note: 'No industry provided — cannot select benchmark family.',
    };
  }

  const family = getBenchmarkFamily(industry);

  if (!family) {
    const available = BENCHMARK_FAMILIES.map((f) => f.industry_gics_group).join(', ');
    return {
      family: null,
      metrics: [],
      note: `Industry "${industry}" not found in benchmark seed data. Available: ${available}.`,
    };
  }

  const metrics = getBenchmarkMetrics(family.family_id);

  let note = `Matched benchmark family "${family.family_id}" for ${family.industry_gics_group}.`;

  if (businessModel) {
    // Overlay logic — currently seed data does not carry business-model
    // overlays, so we note this for downstream interpretation.
    note += ` Business model overlay "${businessModel}" noted but no overlay-specific adjustments available in v2025.1.`;
  }

  if (metrics.length === 0) {
    note += ' Warning: no metrics found for this family — seed data may be incomplete.';
  }

  return { family, metrics, note };
}
