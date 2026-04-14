import type {
  GapAttribution,
  TransformationContext,
  ComplexityResult,
} from '@/lib/engine/types';
import type { ConfidenceLevel } from '@/lib/schema/value-lists';

/**
 * N10 — Gap attribution.
 * Splits benchmark gaps into three buckets:
 *   1. Temporary (transformation) — spend that will roll off post-transformation
 *   2. Addressable (inefficiency) — spend that can be reduced through optimization
 *   3. Structural (complexity premium) — spend driven by inherent business complexity
 *
 * Uses transformation context and complexity result to estimate proportions.
 */
export function attributeGaps(
  totalGapDollars: number,
  transformation: TransformationContext,
  complexity: ComplexityResult | null,
): GapAttribution {
  if (totalGapDollars <= 0) {
    return {
      total_gap_dollars: totalGapDollars,
      temporary_transformation: { pct: 0, dollars: 0, confidence: 'Low' },
      addressable_inefficiency: { pct: 0, dollars: 0, confidence: 'Low' },
      structural_premium: { pct: 0, dollars: 0, confidence: 'Low' },
      note: 'No positive gap to attribute; actual spending is at or below benchmark.',
    };
  }

  // ── Estimate temporary (transformation) share ──
  let tempPct = 0;
  let tempConfidence: ConfidenceLevel = 'Low';

  if (transformation.has_active_transformation) {
    const estimatedTemp = transformation.estimated_temporary_total ?? 0;
    if (estimatedTemp > 0 && totalGapDollars > 0) {
      // Cap temporary attribution at 60% of total gap
      tempPct = Math.min(estimatedTemp / totalGapDollars, 0.60);
      tempConfidence = estimatedTemp > 0 ? 'Medium' : 'Low';
    } else {
      // Active transformation but no estimate — use heuristic
      tempPct = 0.25;
      tempConfidence = 'Low';
    }

    // Boost confidence if we have year-level data
    const yearsWithEstimates = transformation.years.filter(
      (y) => y.temporary_spend_estimate !== null,
    );
    if (yearsWithEstimates.length >= 2) {
      tempConfidence = 'High';
    }
  }

  // ── Estimate structural (complexity premium) share ──
  let structPct = 0;
  let structConfidence: ConfidenceLevel = 'Low';

  if (complexity) {
    // Map complexity class to expected structural premium share
    switch (complexity.complexity_class) {
      case 'High':
        structPct = 0.30;
        structConfidence = 'Medium';
        break;
      case 'Moderate':
        structPct = 0.15;
        structConfidence = 'Medium';
        break;
      case 'Low':
        structPct = 0.05;
        structConfidence = 'High';
        break;
    }

    // Refine with bps_range if available
    if (complexity.bps_range) {
      const midBps = (complexity.bps_range.low + complexity.bps_range.high) / 2;
      const bpsAsDollars = midBps; // bps_range is already in dollar terms if available
      if (bpsAsDollars > 0 && totalGapDollars > 0) {
        const refinedPct = Math.min(bpsAsDollars / totalGapDollars, 0.50);
        structPct = refinedPct;
      }
    }
  } else {
    // No complexity data — assume moderate structural premium
    structPct = 0.10;
    structConfidence = 'Low';
  }

  // ── Addressable = remainder ──
  // Ensure all three sum to 1.0
  const rawTotal = tempPct + structPct;
  let addressablePct: number;

  if (rawTotal >= 1.0) {
    // Scale down temp and struct proportionally
    const scale = 0.90 / rawTotal; // leave 10% addressable minimum
    tempPct = tempPct * scale;
    structPct = structPct * scale;
    addressablePct = 0.10;
  } else {
    addressablePct = 1.0 - rawTotal;
  }

  // Addressable confidence depends on how much we know about the other two
  const addressableConfidence: ConfidenceLevel =
    tempConfidence === 'High' && structConfidence !== 'Low'
      ? 'Medium'
      : 'Low';

  // ── Build notes ──
  const notes: string[] = [];
  if (transformation.has_active_transformation) {
    notes.push('Active transformation detected; temporary spend estimate applied.');
  }
  if (complexity) {
    notes.push(`Complexity class: ${complexity.complexity_class}. ${complexity.adjustment_note}`);
  }
  if (!complexity && !transformation.has_active_transformation) {
    notes.push('Limited context available; attribution is heuristic-based.');
  }

  return {
    total_gap_dollars: Math.round(totalGapDollars),
    temporary_transformation: {
      pct: round2(tempPct),
      dollars: Math.round(totalGapDollars * tempPct),
      confidence: tempConfidence,
    },
    addressable_inefficiency: {
      pct: round2(addressablePct),
      dollars: Math.round(totalGapDollars * addressablePct),
      confidence: addressableConfidence,
    },
    structural_premium: {
      pct: round2(structPct),
      dollars: Math.round(totalGapDollars * structPct),
      confidence: structConfidence,
    },
    note: notes.join(' '),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
