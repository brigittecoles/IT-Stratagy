import type { FiscalYear } from '@/lib/schema/validation';
import type {
  TransformationPhase,
  YearTransformation,
  TransformationContext,
} from '@/lib/engine/types';
import type { ConfidenceLevel } from '@/lib/schema/value-lists';

/**
 * Determine the transformation phase for a single fiscal year based on its
 * transformation_status, type, spend estimate, and rolloff timing.
 */
function classifyPhase(
  fy: FiscalYear,
  index: number,
  total: number,
): { phase: TransformationPhase; confidence: ConfidenceLevel } {
  const status = fy.transformation_status;

  // No transformation
  if (!status || status === 'No') {
    return { phase: 'steady_state', confidence: 'High' };
  }

  // Unsure — treat as steady state with low confidence
  if (status === 'Unsure') {
    return { phase: 'steady_state', confidence: 'Low' };
  }

  // status === 'Yes' — classify the active transformation phase
  const hasSpend = fy.transformation_spend_estimate != null && fy.transformation_spend_estimate > 0;
  const hasRolloff = fy.transformation_rolloff_timing != null && fy.transformation_rolloff_timing.trim() !== '';
  const hasTypes = fy.transformation_type != null && fy.transformation_type.length > 0;

  // If rolloff timing mentions the current year label, treat as roll_off
  if (hasRolloff) {
    const rolloffLower = fy.transformation_rolloff_timing!.toLowerCase();
    const labelLower = fy.fiscal_year_label.toLowerCase();
    if (rolloffLower.includes(labelLower) || rolloffLower.includes('current') || rolloffLower.includes('this year')) {
      return { phase: 'roll_off', confidence: hasSpend ? 'Medium' : 'Low' };
    }
  }

  // Last year in the series with active transformation may be post-transformation
  if (index === total - 1 && !hasSpend && hasRolloff) {
    return { phase: 'post_transformation', confidence: 'Low' };
  }

  // First year with transformation = ramp
  if (index === 0 || !hasSpend) {
    return { phase: 'ramp', confidence: hasTypes ? 'Medium' : 'Low' };
  }

  // Middle year with highest spend = peak_investment (heuristic: just mark as peak)
  return { phase: 'peak_investment', confidence: hasSpend ? 'Medium' : 'Low' };
}

/**
 * Estimate temporary vs structural spend portions.
 *
 * Heuristic:
 *   - ramp: 70% temporary, 30% structural
 *   - peak_investment: 60% temporary, 40% structural
 *   - roll_off: 30% temporary, 70% structural
 *   - post_transformation / steady_state: 0% temporary, 100% structural
 */
function estimateSpendSplit(
  phase: TransformationPhase,
  spendEstimate: number | null | undefined,
): { temporary: number | null; structural: number | null } {
  if (spendEstimate == null || spendEstimate <= 0) {
    return { temporary: null, structural: null };
  }

  const ratios: Record<TransformationPhase, [number, number]> = {
    ramp: [0.70, 0.30],
    peak_investment: [0.60, 0.40],
    roll_off: [0.30, 0.70],
    post_transformation: [0.0, 1.0],
    steady_state: [0.0, 1.0],
  };

  const [tempRatio, structRatio] = ratios[phase];
  return {
    temporary: Math.round(spendEstimate * tempRatio),
    structural: Math.round(spendEstimate * structRatio),
  };
}

/**
 * N06 — Transformation attribution.
 *
 * Classifies each fiscal year into a transformation phase and estimates
 * temporary vs structural spend portions.
 */
export function attributeTransformation(years: FiscalYear[]): TransformationContext {
  const sorted = [...years].sort((a, b) => a.fiscal_year_order - b.fiscal_year_order);

  const yearResults: YearTransformation[] = sorted.map((fy, idx) => {
    const { phase, confidence } = classifyPhase(fy, idx, sorted.length);
    const { temporary, structural } = estimateSpendSplit(phase, fy.transformation_spend_estimate);

    return {
      fiscal_year_label: fy.fiscal_year_label,
      fiscal_year_order: fy.fiscal_year_order,
      phase,
      temporary_spend_estimate: temporary,
      structural_spend_estimate: structural,
      confidence,
    };
  });

  const has_active_transformation = yearResults.some(
    (yr) => yr.phase !== 'steady_state' && yr.phase !== 'post_transformation'
  );

  const tempTotal = yearResults.reduce((sum, yr) => sum + (yr.temporary_spend_estimate ?? 0), 0);
  const structTotal = yearResults.reduce((sum, yr) => sum + (yr.structural_spend_estimate ?? 0), 0);

  return {
    years: yearResults,
    has_active_transformation,
    estimated_temporary_total: tempTotal > 0 ? tempTotal : null,
    estimated_structural_total: structTotal > 0 ? structTotal : null,
  };
}
