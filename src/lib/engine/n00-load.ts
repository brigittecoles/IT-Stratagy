import { canonicalAnalysisSchema } from '@/lib/schema/validation';
import type { CanonicalAnalysis } from '@/lib/schema/validation';

/**
 * N00 — Load and normalize the canonical analysis record.
 * Sorts fiscal years by fiscal_year_order. Attempts Zod validation
 * but falls back to the raw sorted record if validation fails
 * (partial data is expected during intake).
 */
export function loadCanonicalRecord(analysis: CanonicalAnalysis): CanonicalAnalysis {
  // Sort fiscal years ascending by fiscal_year_order
  const sorted: CanonicalAnalysis = {
    ...analysis,
    fiscal_years: [...analysis.fiscal_years].sort(
      (a, b) => a.fiscal_year_order - b.fiscal_year_order
    ),
  };

  // Attempt validation — if it fails, return sorted but unvalidated
  try {
    return canonicalAnalysisSchema.parse(sorted);
  } catch {
    // Partial data is common during intake; proceed with what we have
    return sorted;
  }
}
