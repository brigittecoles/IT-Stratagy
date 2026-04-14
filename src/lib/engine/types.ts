import type { ConfidenceLevel, DiagnosticLevel, ComplexityLevel } from '@/lib/schema/value-lists';

// ── Engine pipeline output types ──

export interface EngineResult {
  analysis_id: string;
  qualified_level: DiagnosticLevel;
  core_kpis: CoreKPISet;
  yoy: YoYResult | null;
  transformation: TransformationContext;
  workforce: WorkforceResult | null;
  vendor: VendorResult | null;
  benchmark: BenchmarkResult | null;
  gap_attribution: GapAttribution | null;
  opportunities: OpportunityResult[];
  qa: QAResult;
  narrative: NarrativeResult;
  metadata: RunMetadata;
}

export interface RunMetadata {
  run_id: string;
  started_at: string;
  completed_at: string;
  benchmark_version_id: string | null;
  nodes_executed: string[];
  nodes_skipped: string[];
}

// ── N04: Core KPI Math ──

export interface KPIMetric {
  name: string;
  value: number;
  formatted: string;
  numerator_field: string;
  denominator_field: string;
  suppressed: boolean;
  suppress_reason?: string;
}

export interface CoreKPISet {
  it_spend_pct_revenue: KPIMetric;
  opex_pct_revenue: KPIMetric;
  capex_pct_revenue: KPIMetric;
  opex_mix: KPIMetric;
  capex_mix: KPIMetric;
  da_pct_it_spend: KPIMetric;
}

// ── N05: Year-over-Year ──

export interface YoYMetric {
  name: string;
  current_value: number;
  prior_value: number;
  delta_dollars: number;
  delta_pct: number;
  formatted_delta: string;
}

export interface YoYResult {
  it_spend_change: YoYMetric;
  revenue_change: YoYMetric;
  spend_vs_revenue_growth: 'IT growing faster' | 'Revenue growing faster' | 'Growing at similar pace';
}

// ── N06: Transformation Attribution ──

export type TransformationPhase = 'steady_state' | 'ramp' | 'peak_investment' | 'roll_off' | 'post_transformation';

export interface YearTransformation {
  fiscal_year_label: string;
  fiscal_year_order: number;
  phase: TransformationPhase;
  temporary_spend_estimate: number | null;
  structural_spend_estimate: number | null;
  confidence: ConfidenceLevel;
}

export interface TransformationContext {
  years: YearTransformation[];
  has_active_transformation: boolean;
  estimated_temporary_total: number | null;
  estimated_structural_total: number | null;
}

// ── N03: Complexity ──

export interface ComplexityResult {
  regulatory_score: number;
  operating_score: number;
  pricing_score: number;
  weighted_score: number;
  complexity_class: ComplexityLevel;
  adjustment_note: string;
  bps_range: { low: number; high: number } | null;
}

// ── N07: Workforce + Sourcing ──

export interface WorkforceResult {
  spend_per_employee: KPIMetric;
  spend_per_it_fte: KPIMetric;
  it_fte_per_100_employees: KPIMetric;
  contractor_ratio: KPIMetric;
  outsourced_spend_ratio: KPIMetric;
  internal_vs_external: KPIMetric;
}

// ── N08: Vendor + Tower ──

export interface VendorResult {
  top_10_concentration: KPIMetric;
  unmapped_tail: KPIMetric;
  tower_shares: { tower: string; share: number; spend: number }[];
  overlapping_categories: string[];
  total_vendor_count: number;
}

// ── N02/N09: Benchmark ──

export interface BenchmarkFamily {
  family_id: string;
  industry_gics_group: string;
  business_model_overlay: string | null;
  source: string;
  effective_date: string;
  version_id: string;
}

export interface BenchmarkMetric {
  metric_name: string;
  median: number;
  p75: number;
  top_quartile: number;
  coverage: string;
}

export interface BenchmarkGap {
  metric_name: string;
  actual_pct: number;
  benchmark_median: number;
  benchmark_p75: number;
  benchmark_top_quartile: number;
  gap_vs_median_pct: number;
  gap_vs_median_dollars: number;
  gap_vs_p75_pct: number;
  gap_vs_p75_dollars: number;
}

export interface BenchmarkResult {
  family: BenchmarkFamily;
  complexity: ComplexityResult | null;
  raw_gaps: BenchmarkGap[];
  adjusted_interpretation: string;
}

// ── N10: Gap Attribution ──

export interface GapAttribution {
  total_gap_dollars: number;
  temporary_transformation: { pct: number; dollars: number; confidence: ConfidenceLevel };
  addressable_inefficiency: { pct: number; dollars: number; confidence: ConfidenceLevel };
  structural_premium: { pct: number; dollars: number; confidence: ConfidenceLevel };
  note: string;
}

// ── N11: Opportunity Math ──

export interface OpportunityModule {
  module_name: string;
  can_run: boolean;
  skip_reason?: string;
}

export interface OpportunityResult {
  module_name: string;
  low_case: number;
  base_case: number;
  high_case: number;
  confidence: ConfidenceLevel;
  assumptions: string[];
}

// ── N12: QA ──

export type QASeverity = 'Critical' | 'Warning' | 'Info';

export interface QACheck {
  check_id: string;
  check_name: string;
  severity: QASeverity;
  passed: boolean;
  message: string;
}

export interface QAResult {
  checks: QACheck[];
  critical_failures: number;
  warnings: number;
  overall_confidence: ConfidenceLevel;
  confidence_reasons: string[];
  can_proceed: boolean;
}

// ── N13: Narrative ──

export interface NarrativeResult {
  executive_summary: string;
  key_findings: string[];
  why_it_matters: string;
  caveats: string[];
  confidence_statement: string;
}

// ── N14: Output Pack ──

export interface RecommendationCard {
  title: string;
  description: string;
  value_range: string;
  confidence: ConfidenceLevel;
  priority: 'High' | 'Medium' | 'Low';
}
