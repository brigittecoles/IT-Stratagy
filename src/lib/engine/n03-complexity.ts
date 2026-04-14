import type { CompanyProfile } from '@/lib/schema/validation';
import type { ComplexityResult } from '@/lib/engine/types';
import type { ComplexityLevel } from '@/lib/schema/value-lists';

// Numeric mapping: Low=0, Moderate=1, High=2
const COMPLEXITY_SCORE: Record<string, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
};

// Weights
const W_REGULATORY = 0.35;
const W_OPERATING = 0.40;
const W_PRICING = 0.25;

/**
 * Classify a weighted score into a complexity level.
 *   0 - 0.49   = Low
 *   0.50 - 1.24 = Moderate
 *   1.25+       = High
 */
function classifyComplexity(score: number): ComplexityLevel {
  if (score < 0.50) return 'Low';
  if (score < 1.25) return 'Moderate';
  return 'High';
}

/**
 * Map complexity class to a basis-point adjustment range for benchmark interpretation.
 */
function bpsRange(level: ComplexityLevel): { low: number; high: number } | null {
  switch (level) {
    case 'Low':
      return { low: 0, high: 0 };
    case 'Moderate':
      return { low: 10, high: 30 };
    case 'High':
      return { low: 30, high: 75 };
    default:
      return null;
  }
}

/**
 * N03 — Calculate industry complexity weighting.
 *
 * Inputs come from the CompanyProfile: regulatory_complexity, operating_complexity,
 * pricing_premium_complexity. Missing values default to "Moderate" (1).
 */
export function calculateComplexity(company: CompanyProfile): ComplexityResult {
  const regulatoryRaw = company.regulatory_complexity ?? 'Moderate';
  const operatingRaw = company.operating_complexity ?? 'Moderate';
  const pricingRaw = company.pricing_premium_complexity ?? 'Moderate';

  const regulatory_score = COMPLEXITY_SCORE[regulatoryRaw] ?? 1;
  const operating_score = COMPLEXITY_SCORE[operatingRaw] ?? 1;
  const pricing_score = COMPLEXITY_SCORE[pricingRaw] ?? 1;

  const weighted_score =
    regulatory_score * W_REGULATORY +
    operating_score * W_OPERATING +
    pricing_score * W_PRICING;

  const roundedScore = Math.round(weighted_score * 100) / 100;
  const complexity_class = classifyComplexity(roundedScore);

  const defaulted: string[] = [];
  if (company.regulatory_complexity == null) defaulted.push('regulatory');
  if (company.operating_complexity == null) defaulted.push('operating');
  if (company.pricing_premium_complexity == null) defaulted.push('pricing');

  const adjustment_note =
    defaulted.length > 0
      ? `Defaulted ${defaulted.join(', ')} complexity to Moderate (not provided).`
      : 'All complexity dimensions were explicitly provided.';

  return {
    regulatory_score,
    operating_score,
    pricing_score,
    weighted_score: roundedScore,
    complexity_class,
    adjustment_note,
    bps_range: bpsRange(complexity_class),
  };
}
