import type { CanonicalAnalysis } from '@/lib/schema/validation';
import type {
  EngineResult,
  RunMetadata,
  CoreKPISet,
  YoYResult,
  TransformationContext,
  ComplexityResult,
  WorkforceResult,
  VendorResult,
  BenchmarkResult,
  BenchmarkFamily,
  BenchmarkMetric,
  BenchmarkGap,
  GapAttribution,
  OpportunityResult,
  QAResult,
  NarrativeResult,
  RecommendationCard,
} from '@/lib/engine/types';
import type { DiagnosticLevel } from '@/lib/schema/value-lists';

// ── Node imports ──
import { loadCanonicalRecord } from '@/lib/engine/n00-load';
import { evaluateReadiness } from '@/lib/engine/n01-readiness';
import { selectBenchmarkFamily } from '@/lib/engine/n02-benchmark-select';
import { calculateComplexity } from '@/lib/engine/n03-complexity';
import { calculateCoreKPIs } from '@/lib/engine/n04-core-kpi';
import { calculateYoY } from '@/lib/engine/n05-yoy';
import { attributeTransformation } from '@/lib/engine/n06-transformation';
import { calculateWorkforce } from '@/lib/engine/n07-workforce';
import { calculateVendorMetrics, type VendorData } from '@/lib/engine/n08-vendor';
import { compareToBenchmarks } from '@/lib/engine/n09-benchmark-compare';
import { attributeGaps } from '@/lib/engine/n10-gap-attribution';
import { sizeOpportunities } from '@/lib/engine/n11-opportunity';
import { runQAChecks } from '@/lib/engine/n12-qa';
import { generateNarrative } from '@/lib/engine/n13-narrative';
import { packageOutput } from '@/lib/engine/n14-output';

// ── Helpers ──

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Pipeline orchestrator — runs all engine nodes N00-N14 in sequence.
 *
 * Each node is wrapped in a try/catch so that a failure in one node
 * degrades the output rather than aborting the entire pipeline.
 * The metadata records which nodes executed vs. were skipped.
 */
export async function runAnalysisPipeline(
  analysis: CanonicalAnalysis,
  benchmarkFamily?: BenchmarkFamily,
  benchmarkMetrics?: BenchmarkMetric[],
  vendorData?: VendorData,
): Promise<EngineResult> {
  const runId = generateRunId();
  const startedAt = isoNow();
  const nodesExecuted: string[] = [];
  const nodesSkipped: string[] = [];

  // ── N00: Load & normalize ──
  let normalized: CanonicalAnalysis = analysis;
  try {
    normalized = loadCanonicalRecord(analysis);
    nodesExecuted.push('N00');
  } catch (e) {
    nodesSkipped.push('N00');
    // Proceed with raw input
  }

  // ── N01: Readiness / level qualification ──
  let qualifiedLevel: DiagnosticLevel = normalized.controls.target_diagnostic_level;
  try {
    const readiness = evaluateReadiness(normalized);
    qualifiedLevel = readiness.qualified_level;
    nodesExecuted.push('N01');
  } catch (e) {
    nodesSkipped.push('N01');
  }

  // ── N02: Benchmark family selection ──
  let selectedFamily: BenchmarkFamily | null = benchmarkFamily ?? null;
  let selectedMetrics: BenchmarkMetric[] = benchmarkMetrics ?? [];
  let benchmarkVersionId: string | null = null;
  try {
    if (!benchmarkFamily) {
      const bmResult = selectBenchmarkFamily(
        normalized.company.industry_gics_group,
        normalized.company.business_model,
      );
      selectedFamily = bmResult.family;
      selectedMetrics = bmResult.metrics;
    }
    benchmarkVersionId = selectedFamily?.version_id ?? null;
    nodesExecuted.push('N02');
  } catch (e) {
    nodesSkipped.push('N02');
  }

  // ── N03: Complexity ──
  let complexity: ComplexityResult | null = null;
  try {
    complexity = calculateComplexity(normalized.company);
    nodesExecuted.push('N03');
  } catch (e) {
    nodesSkipped.push('N03');
  }

  // ── N04: Core KPIs ──
  // Use the current fiscal year (lowest fiscal_year_order = most current)
  const sortedYears = [...normalized.fiscal_years].sort(
    (a, b) => a.fiscal_year_order - b.fiscal_year_order,
  );
  const latestYear = sortedYears[0];
  const revenue = latestYear?.revenue ?? 0;

  let coreKpis: CoreKPISet;
  try {
    coreKpis = calculateCoreKPIs(latestYear);
    nodesExecuted.push('N04');
  } catch (e) {
    nodesSkipped.push('N04');
    // Provide a fallback with suppressed KPIs
    coreKpis = makeSuppressedKPIs();
  }

  // ── N05: Year-over-Year ──
  let yoy: YoYResult | null = null;
  try {
    yoy = calculateYoY(normalized.fiscal_years);
    nodesExecuted.push('N05');
  } catch (e) {
    nodesSkipped.push('N05');
  }

  // ── N06: Transformation attribution ──
  let transformation: TransformationContext;
  try {
    transformation = attributeTransformation(normalized.fiscal_years);
    nodesExecuted.push('N06');
  } catch (e) {
    nodesSkipped.push('N06');
    transformation = {
      years: [],
      has_active_transformation: false,
      estimated_temporary_total: null,
      estimated_structural_total: null,
    };
  }

  // ── N07: Workforce ──
  let workforce: WorkforceResult | null = null;
  try {
    workforce = calculateWorkforce(latestYear);
    nodesExecuted.push('N07');
  } catch (e) {
    nodesSkipped.push('N07');
  }

  // ── N08: Vendor ──
  let vendor: VendorResult | null = null;
  try {
    vendor = calculateVendorMetrics(vendorData ?? null);
    nodesExecuted.push('N08');
  } catch (e) {
    nodesSkipped.push('N08');
  }

  // ── N09: Benchmark comparison ──
  let benchmarkGaps: BenchmarkGap[] = [];
  try {
    if (selectedFamily && selectedMetrics.length > 0 && revenue > 0) {
      benchmarkGaps = compareToBenchmarks(coreKpis, selectedFamily, selectedMetrics, revenue);
      nodesExecuted.push('N09');
    } else {
      nodesSkipped.push('N09');
    }
  } catch (e) {
    nodesSkipped.push('N09');
  }

  // Build benchmark result
  const benchmarkResult: BenchmarkResult | null = selectedFamily
    ? {
        family: selectedFamily,
        complexity,
        raw_gaps: benchmarkGaps,
        adjusted_interpretation: complexity
          ? `Gaps adjusted for ${complexity.complexity_class} complexity (${complexity.adjustment_note}).`
          : 'No complexity adjustment applied.',
      }
    : null;

  // ── N10: Gap attribution ──
  let gapAttribution: GapAttribution | null = null;
  try {
    const primaryGap = benchmarkGaps.find((g) => g.metric_name === 'it_spend_pct_revenue');
    const totalGapDollars = primaryGap?.gap_vs_median_dollars ?? 0;
    if (totalGapDollars > 0) {
      gapAttribution = attributeGaps(totalGapDollars, transformation, complexity);
      nodesExecuted.push('N10');
    } else {
      nodesSkipped.push('N10');
    }
  } catch (e) {
    nodesSkipped.push('N10');
  }

  // ── N11: Opportunity sizing ──
  let opportunities: OpportunityResult[] = [];
  try {
    opportunities = sizeOpportunities(
      normalized,
      coreKpis,
      benchmarkGaps,
      transformation,
      workforce,
      vendor,
    );
    nodesExecuted.push('N11');
  } catch (e) {
    nodesSkipped.push('N11');
  }

  // ── N12: QA ──
  let qa: QAResult;
  try {
    qa = runQAChecks(normalized);
    nodesExecuted.push('N12');
  } catch (e) {
    nodesSkipped.push('N12');
    qa = {
      checks: [],
      critical_failures: 0,
      warnings: 0,
      overall_confidence: 'Low',
      confidence_reasons: ['QA node failed to execute.'],
      can_proceed: true,
    };
  }

  // ── Build partial result for narrative and output ──
  const partialResult = {
    analysis_id: normalized.id,
    qualified_level: qualifiedLevel,
    core_kpis: coreKpis,
    yoy,
    transformation,
    workforce,
    vendor,
    benchmark: benchmarkResult,
    gap_attribution: gapAttribution,
    opportunities,
    qa,
  };

  // ── N13: Narrative ──
  let narrative: NarrativeResult;
  try {
    narrative = generateNarrative(partialResult);
    nodesExecuted.push('N13');
  } catch (e) {
    nodesSkipped.push('N13');
    narrative = {
      executive_summary: 'Narrative generation encountered an error. Please review the raw data.',
      key_findings: [],
      why_it_matters: '',
      caveats: ['Narrative could not be generated due to a processing error.'],
      confidence_statement: 'Confidence could not be assessed.',
    };
  }

  // ── N14: Output packaging ──
  const resultWithNarrative = { ...partialResult, narrative };
  let _recommendationCards: RecommendationCard[] = [];
  try {
    _recommendationCards = packageOutput(resultWithNarrative);
    nodesExecuted.push('N14');
  } catch (e) {
    nodesSkipped.push('N14');
  }

  // ── Assemble final result ──
  const completedAt = isoNow();
  const metadata: RunMetadata = {
    run_id: runId,
    started_at: startedAt,
    completed_at: completedAt,
    benchmark_version_id: benchmarkVersionId,
    nodes_executed: nodesExecuted,
    nodes_skipped: nodesSkipped,
  };

  return {
    ...resultWithNarrative,
    metadata,
  };
}

// ── Fallback for suppressed KPIs ──

function makeSuppressedKPIs(): CoreKPISet {
  const suppressed = (name: string) => ({
    name,
    value: 0,
    formatted: 'N/A',
    numerator_field: '',
    denominator_field: '',
    suppressed: true,
    suppress_reason: 'Core KPI calculation failed.',
  });

  return {
    it_spend_pct_revenue: suppressed('IT Spend % Revenue'),
    opex_pct_revenue: suppressed('OpEx % Revenue'),
    capex_pct_revenue: suppressed('CapEx % Revenue'),
    opex_mix: suppressed('OpEx Mix'),
    capex_mix: suppressed('CapEx Mix'),
    da_pct_it_spend: suppressed('D&A % IT Spend'),
  };
}
