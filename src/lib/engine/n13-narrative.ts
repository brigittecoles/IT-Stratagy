import type {
  EngineResult,
  NarrativeResult,
  CoreKPISet,
  BenchmarkGap,
  OpportunityResult,
  QAResult,
  GapAttribution,
  TransformationContext,
} from '@/lib/engine/types';

type PartialResult = Omit<EngineResult, 'narrative' | 'metadata'>;

// ── Formatting helpers ──

function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * N13 — Narrative generation.
 * Produces executive summary, key findings, why-it-matters,
 * caveats, and confidence statement using template-based interpolation.
 * Detail level adjusts based on the diagnostic level.
 */
export function generateNarrative(result: PartialResult): NarrativeResult {
  const isFullDiagnostic =
    result.qualified_level === 'Full Diagnostic' ||
    result.qualified_level === 'Full Diagnostic with Vendor + Roadmap Intelligence';

  return {
    executive_summary: buildExecutiveSummary(result),
    key_findings: buildKeyFindings(result, isFullDiagnostic),
    why_it_matters: buildWhyItMatters(result),
    caveats: buildCaveats(result),
    confidence_statement: buildConfidenceStatement(result.qa),
  };
}

// ── Section builders ──

function buildExecutiveSummary(r: PartialResult): string {
  const spendPct = r.core_kpis.it_spend_pct_revenue;
  const spendStr = spendPct.suppressed
    ? 'IT spend as a percentage of revenue could not be determined'
    : `IT spend represents ${fmtPct(spendPct.value)} of revenue`;

  // Benchmark positioning
  let benchmarkStr = '';
  if (r.benchmark && r.benchmark.raw_gaps.length > 0) {
    const primaryGap = r.benchmark.raw_gaps.find((g) => g.metric_name === 'it_spend_pct_revenue');
    if (primaryGap) {
      if (primaryGap.gap_vs_median_pct > 0.005) {
        benchmarkStr = `, which is ${fmtPct(Math.abs(primaryGap.gap_vs_median_pct))} above the industry median`;
      } else if (primaryGap.gap_vs_median_pct < -0.005) {
        benchmarkStr = `, which is ${fmtPct(Math.abs(primaryGap.gap_vs_median_pct))} below the industry median`;
      } else {
        benchmarkStr = ', which is in line with the industry median';
      }
    }
  }

  // Transformation context
  let transformStr = '';
  if (r.transformation.has_active_transformation) {
    const tempTotal = r.transformation.estimated_temporary_total;
    transformStr = tempTotal
      ? ` The organization is currently undergoing an active transformation program with an estimated ${fmtCurrency(tempTotal)} in temporary spend.`
      : ' The organization is currently undergoing an active transformation program, which is expected to influence near-term cost profiles.';
  }

  // Opportunity summary
  const totalBaseCase = r.opportunities.reduce((sum, o) => sum + o.base_case, 0);
  let opportunityStr = '';
  if (totalBaseCase > 0) {
    opportunityStr = ` Across all opportunity modules, the base-case potential is estimated at ${fmtCurrency(totalBaseCase)}.`;
  }

  return `${spendStr}${benchmarkStr}.${transformStr}${opportunityStr}`;
}

function buildKeyFindings(r: PartialResult, detailed: boolean): string[] {
  const findings: string[] = [];

  // KPI finding
  const spendPct = r.core_kpis.it_spend_pct_revenue;
  if (!spendPct.suppressed) {
    findings.push(
      `IT spend as a percentage of revenue is ${fmtPct(spendPct.value)}.`,
    );
  }

  // OpEx/CapEx mix
  const opex = r.core_kpis.opex_mix;
  const capex = r.core_kpis.capex_mix;
  if (!opex.suppressed && !capex.suppressed) {
    findings.push(
      `The OpEx/CapEx mix is ${fmtPct(opex.value)} / ${fmtPct(capex.value)}.`,
    );
  }

  // YoY
  if (r.yoy) {
    findings.push(
      `Year-over-year IT spend changed by ${r.yoy.it_spend_change.formatted_delta}. ${r.yoy.spend_vs_revenue_growth}.`,
    );
  }

  // Benchmark gaps
  if (r.benchmark && r.benchmark.raw_gaps.length > 0) {
    const primaryGap = r.benchmark.raw_gaps.find((g) => g.metric_name === 'it_spend_pct_revenue');
    if (primaryGap && primaryGap.gap_vs_median_dollars !== 0) {
      const direction = primaryGap.gap_vs_median_dollars > 0 ? 'above' : 'below';
      findings.push(
        `The benchmark gap versus the industry median is ${fmtCurrency(Math.abs(primaryGap.gap_vs_median_dollars))} (${direction} median).`,
      );
    }
  }

  // Gap attribution
  if (r.gap_attribution && r.gap_attribution.total_gap_dollars > 0) {
    findings.push(
      `Of the total gap, approximately ${fmtPct(r.gap_attribution.temporary_transformation.pct)} is attributed to temporary transformation spend, ${fmtPct(r.gap_attribution.addressable_inefficiency.pct)} to addressable inefficiency, and ${fmtPct(r.gap_attribution.structural_premium.pct)} to structural complexity.`,
    );
  }

  // Opportunities (top 3 by base case)
  const activeOpps = [...r.opportunities]
    .filter((o) => o.base_case > 0)
    .sort((a, b) => b.base_case - a.base_case);

  if (activeOpps.length > 0) {
    const top = activeOpps.slice(0, detailed ? 5 : 3);
    for (const opp of top) {
      findings.push(
        `${opp.module_name}: base-case opportunity of ${fmtCurrency(opp.base_case)} (range: ${fmtCurrency(opp.low_case)} to ${fmtCurrency(opp.high_case)}).`,
      );
    }
  }

  // Vendor insights (detailed only)
  if (detailed && r.vendor) {
    findings.push(
      `Vendor landscape includes ${r.vendor.total_vendor_count} vendors with top-10 concentration at ${r.vendor.top_10_concentration.formatted}.`,
    );
    if (r.vendor.overlapping_categories.length > 0) {
      findings.push(
        `Overlapping vendor categories identified: ${r.vendor.overlapping_categories.join(', ')}.`,
      );
    }
  }

  // Workforce insights (detailed only)
  if (detailed && r.workforce) {
    if (!r.workforce.contractor_ratio.suppressed) {
      findings.push(
        `Contractor ratio is ${r.workforce.contractor_ratio.formatted}.`,
      );
    }
  }

  return findings;
}

function buildWhyItMatters(r: PartialResult): string {
  const parts: string[] = [];

  parts.push(
    'Understanding IT cost structure relative to industry benchmarks enables leadership to distinguish between strategic investment and operational inefficiency.',
  );

  if (r.transformation.has_active_transformation) {
    parts.push(
      'With an active transformation in progress, separating temporary program costs from the structural run-rate is critical for setting realistic post-transformation targets.',
    );
  }

  const totalBase = r.opportunities.reduce((sum, o) => sum + o.base_case, 0);
  if (totalBase > 0) {
    parts.push(
      `The identified opportunities, totaling ${fmtCurrency(totalBase)} in base-case potential, represent actionable levers that can be prioritized based on confidence level and implementation complexity.`,
    );
  }

  if (r.qa.overall_confidence === 'Low') {
    parts.push(
      'Note that overall data confidence is low, meaning these findings should be treated as directional rather than definitive. Improving data inputs will sharpen future analyses.',
    );
  }

  return parts.join(' ');
}

function buildCaveats(r: PartialResult): string[] {
  const caveats: string[] = [];

  // Confidence-based caveats
  if (r.qa.overall_confidence !== 'High') {
    caveats.push(
      'Data completeness is below ideal levels. Results should be validated with additional source data before committing to action plans.',
    );
  }

  // Benchmark caveats
  if (r.benchmark) {
    caveats.push(
      `Benchmarks are based on the ${r.benchmark.family.industry_gics_group} peer group. Company-specific factors may warrant adjustments beyond what is captured in complexity scoring.`,
    );
  }

  // Transformation caveat
  if (r.transformation.has_active_transformation) {
    if (r.transformation.estimated_temporary_total == null) {
      caveats.push(
        'Temporary transformation spend could not be precisely estimated. The attribution split between temporary and structural spend is based on heuristic assumptions.',
      );
    }
  }

  // Opportunity caveats
  const lowConfidenceOpps = r.opportunities.filter(
    (o) => o.base_case > 0 && o.confidence === 'Low',
  );
  if (lowConfidenceOpps.length > 0) {
    caveats.push(
      `${lowConfidenceOpps.length} opportunity module(s) have low confidence and are sized using industry heuristics rather than company-specific data.`,
    );
  }

  // Vendor caveat
  if (!r.vendor) {
    caveats.push(
      'No vendor detail data was provided. Vendor consolidation opportunities are not quantified.',
    );
  }

  // QA-derived caveats
  const failedChecks = r.qa.checks.filter((c) => !c.passed && c.severity !== 'Info');
  if (failedChecks.length > 0) {
    caveats.push(
      `${failedChecks.length} quality check(s) flagged issues that may affect the accuracy of the analysis.`,
    );
  }

  if (caveats.length === 0) {
    caveats.push(
      'Standard analytical assumptions apply. Findings should be reviewed in the context of ongoing strategic initiatives.',
    );
  }

  return caveats;
}

function buildConfidenceStatement(qa: QAResult): string {
  const level = qa.overall_confidence;
  const reasons = qa.confidence_reasons.join(' ');

  switch (level) {
    case 'High':
      return `Overall confidence in this analysis is HIGH. ${reasons} The data inputs are sufficient to support the conclusions and opportunity estimates presented.`;
    case 'Medium':
      return `Overall confidence in this analysis is MEDIUM. ${reasons} While the primary findings are well-supported, some secondary metrics and opportunity estimates rely on assumptions that could be refined with additional data.`;
    case 'Low':
      return `Overall confidence in this analysis is LOW. ${reasons} The findings presented are directional in nature and should be treated as preliminary estimates. Providing additional data inputs would materially improve the precision of this analysis.`;
  }
}
