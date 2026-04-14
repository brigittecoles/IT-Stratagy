import type {
  OpportunityResult,
  CoreKPISet,
  BenchmarkGap,
  TransformationContext,
  WorkforceResult,
  VendorResult,
} from '@/lib/engine/types';
import type { CanonicalAnalysis } from '@/lib/schema/validation';
import type { ConfidenceLevel } from '@/lib/schema/value-lists';

// ── Helpers ──

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function getCurrentYear(analysis: CanonicalAnalysis) {
  const sorted = [...analysis.fiscal_years].sort(
    (a, b) => a.fiscal_year_order - b.fiscal_year_order,
  );
  return sorted[sorted.length - 1];
}

/**
 * N11 — Opportunity sizing.
 * Runs 5 opportunity modules, each returning low/base/high case.
 * Only runs modules supported by available data.
 *
 * Modules:
 *   1. Post-transformation normalization
 *   2. Automation gap closure
 *   3. Application rationalization
 *   4. Strategic insourcing
 *   5. Vendor consolidation
 */
export function sizeOpportunities(
  analysis: CanonicalAnalysis,
  kpis: CoreKPISet,
  gaps: BenchmarkGap[],
  transformation: TransformationContext,
  workforce: WorkforceResult | null,
  vendor: VendorResult | null,
): OpportunityResult[] {
  const results: OpportunityResult[] = [];
  const currentYear = getCurrentYear(analysis);
  const totalITSpend = currentYear?.total_it_spend ?? 0;
  const revenue = currentYear?.revenue ?? 0;

  // Find the primary gap (IT spend % revenue)
  const primaryGap = gaps.find((g) => g.metric_name === 'it_spend_pct_revenue');
  const gapDollarsVsMedian = primaryGap?.gap_vs_median_dollars ?? 0;

  // ── Module 1: Post-transformation normalization ──
  results.push(postTransformationNormalization(transformation, totalITSpend));

  // ── Module 2: Automation gap closure ──
  results.push(automationGapClosure(kpis, gapDollarsVsMedian, totalITSpend));

  // ── Module 3: Application rationalization ──
  results.push(appRationalization(analysis, totalITSpend));

  // ── Module 4: Strategic insourcing ──
  results.push(strategicInsourcing(workforce, totalITSpend));

  // ── Module 5: Vendor consolidation ──
  results.push(vendorConsolidation(vendor, totalITSpend));

  return results;
}

// ── Module implementations ──

function postTransformationNormalization(
  transformation: TransformationContext,
  totalITSpend: number,
): OpportunityResult {
  if (!transformation.has_active_transformation) {
    return {
      module_name: 'Post-Transformation Normalization',
      low_case: 0,
      base_case: 0,
      high_case: 0,
      confidence: 'Low',
      assumptions: ['No active transformation detected; module not applicable.'],
    };
  }

  const tempSpend = transformation.estimated_temporary_total ?? 0;

  if (tempSpend <= 0) {
    // Heuristic: assume 5-15% of IT spend is temporary during active transformation
    const low = Math.round(totalITSpend * 0.03);
    const base = Math.round(totalITSpend * 0.07);
    const high = Math.round(totalITSpend * 0.12);

    return {
      module_name: 'Post-Transformation Normalization',
      low_case: low,
      base_case: base,
      high_case: high,
      confidence: 'Low',
      assumptions: [
        'Temporary transformation spend not quantified; using heuristic range of 3-12% of IT spend.',
        'Assumes transformation programs will roll off within 18-24 months.',
      ],
    };
  }

  // Use estimated temporary spend with roll-off discounting
  const low = Math.round(tempSpend * 0.50);
  const base = Math.round(tempSpend * 0.70);
  const high = Math.round(tempSpend * 0.90);

  const confidence: ConfidenceLevel =
    transformation.years.filter((y) => y.temporary_spend_estimate !== null).length >= 2
      ? 'High'
      : 'Medium';

  return {
    module_name: 'Post-Transformation Normalization',
    low_case: low,
    base_case: base,
    high_case: high,
    confidence,
    assumptions: [
      `Estimated temporary spend: ${formatCurrency(tempSpend)}.`,
      'Roll-off range: 50% (conservative) to 90% (aggressive) of temporary spend.',
      'Timing assumes programs complete on current schedule.',
    ],
  };
}

function automationGapClosure(
  kpis: CoreKPISet,
  gapDollarsVsMedian: number,
  totalITSpend: number,
): OpportunityResult {
  // Automation opportunity derived from the addressable portion of benchmark gap
  if (gapDollarsVsMedian <= 0) {
    return {
      module_name: 'Automation Gap Closure',
      low_case: 0,
      base_case: 0,
      high_case: 0,
      confidence: 'Low',
      assumptions: [
        'No positive benchmark gap detected; IT spend is at or below median.',
        'Automation may still yield benefits but cannot be sized from benchmark data alone.',
      ],
    };
  }

  // Assume 15-40% of addressable gap can be captured via automation
  const low = Math.round(gapDollarsVsMedian * 0.10);
  const base = Math.round(gapDollarsVsMedian * 0.20);
  const high = Math.round(gapDollarsVsMedian * 0.35);

  return {
    module_name: 'Automation Gap Closure',
    low_case: low,
    base_case: base,
    high_case: high,
    confidence: 'Medium',
    assumptions: [
      `Benchmark gap vs median: ${formatCurrency(gapDollarsVsMedian)}.`,
      'Assumes 10-35% of the gap is addressable through automation and process improvement.',
      'Typical areas include service desk, provisioning, testing, and reporting.',
    ],
  };
}

function appRationalization(
  analysis: CanonicalAnalysis,
  totalITSpend: number,
): OpportunityResult {
  const hasDetailedFiles = analysis.detailed_file_available || analysis.project_portfolio_file_available;

  if (totalITSpend <= 0) {
    return {
      module_name: 'Application Rationalization',
      low_case: 0,
      base_case: 0,
      high_case: 0,
      confidence: 'Low',
      assumptions: ['Insufficient data to size application rationalization opportunity.'],
    };
  }

  // Industry heuristic: 5-15% of application spend can be rationalized
  // Application spend is typically 30-40% of total IT spend
  const estimatedAppSpend = totalITSpend * 0.35;
  const low = Math.round(estimatedAppSpend * 0.05);
  const base = Math.round(estimatedAppSpend * 0.10);
  const high = Math.round(estimatedAppSpend * 0.18);

  const confidence: ConfidenceLevel = hasDetailedFiles ? 'Medium' : 'Low';

  return {
    module_name: 'Application Rationalization',
    low_case: low,
    base_case: base,
    high_case: high,
    confidence,
    assumptions: [
      `Estimated application spend: ${formatCurrency(estimatedAppSpend)} (35% of IT spend).`,
      'Rationalization range: 5-18% of application spend.',
      hasDetailedFiles
        ? 'Detailed file data available; estimate informed by portfolio context.'
        : 'No detailed application portfolio provided; using industry heuristics.',
    ],
  };
}

function strategicInsourcing(
  workforce: WorkforceResult | null,
  totalITSpend: number,
): OpportunityResult {
  if (!workforce || totalITSpend <= 0) {
    return {
      module_name: 'Strategic Insourcing',
      low_case: 0,
      base_case: 0,
      high_case: 0,
      confidence: 'Low',
      assumptions: [
        'Workforce data not available; cannot size insourcing opportunity.',
      ],
    };
  }

  const contractorRatio = workforce.contractor_ratio.suppressed
    ? null
    : workforce.contractor_ratio.value;
  const outsourcedRatio = workforce.outsourced_spend_ratio.suppressed
    ? null
    : workforce.outsourced_spend_ratio.value;

  // If contractor ratio is high (>30%), there may be insourcing opportunity
  const externalRatio = outsourcedRatio ?? contractorRatio ?? 0;

  if (externalRatio < 0.20) {
    return {
      module_name: 'Strategic Insourcing',
      low_case: 0,
      base_case: 0,
      high_case: 0,
      confidence: 'Medium',
      assumptions: [
        `External sourcing ratio: ${(externalRatio * 100).toFixed(1)}%.`,
        'External spend is below 20%; limited insourcing opportunity.',
      ],
    };
  }

  // Opportunity: convert 10-25% of external spend to internal at ~30% savings
  const externalSpend = totalITSpend * externalRatio;
  const convertibleSpend = externalSpend * 0.20; // 20% of external is convertible
  const low = Math.round(convertibleSpend * 0.20); // 20% savings
  const base = Math.round(convertibleSpend * 0.30); // 30% savings
  const high = Math.round(convertibleSpend * 0.40); // 40% savings

  return {
    module_name: 'Strategic Insourcing',
    low_case: low,
    base_case: base,
    high_case: high,
    confidence: 'Medium',
    assumptions: [
      `External sourcing ratio: ${(externalRatio * 100).toFixed(1)}%.`,
      `Estimated convertible external spend: ${formatCurrency(convertibleSpend)}.`,
      'Assumes 20-40% savings on converted work through insourcing.',
      'Requires hiring capacity and knowledge transfer investment.',
    ],
  };
}

function vendorConsolidation(
  vendor: VendorResult | null,
  totalITSpend: number,
): OpportunityResult {
  if (!vendor || totalITSpend <= 0) {
    return {
      module_name: 'Vendor Consolidation',
      low_case: 0,
      base_case: 0,
      high_case: 0,
      confidence: 'Low',
      assumptions: [
        'Vendor data not available; cannot size consolidation opportunity.',
      ],
    };
  }

  const overlappingCount = vendor.overlapping_categories.length;
  const tailPct = vendor.unmapped_tail.suppressed ? 0 : vendor.unmapped_tail.value;
  const vendorCount = vendor.total_vendor_count;

  // Consolidation savings come from reducing overlap and negotiating volume
  // Typical: 5-15% savings on addressable vendor spend
  const addressableSpend = totalITSpend * (1 - vendor.top_10_concentration.value);
  const overlapMultiplier = Math.min(overlappingCount * 0.02, 0.10); // up to 10% boost
  const baseRate = 0.08 + overlapMultiplier;

  const low = Math.round(addressableSpend * (baseRate * 0.5));
  const base = Math.round(addressableSpend * baseRate);
  const high = Math.round(addressableSpend * (baseRate * 1.5));

  const confidence: ConfidenceLevel = vendorCount >= 20 ? 'Medium' : 'Low';

  return {
    module_name: 'Vendor Consolidation',
    low_case: low,
    base_case: base,
    high_case: high,
    confidence,
    assumptions: [
      `Total vendors: ${vendorCount}. Overlapping categories: ${overlappingCount}.`,
      `Addressable (non-top-10) spend: ${formatCurrency(addressableSpend)}.`,
      `Base consolidation rate: ${(baseRate * 100).toFixed(1)}%.`,
      'Savings from volume discounts, contract rationalization, and reduced management overhead.',
    ],
  };
}
