/**
 * Report Generator
 *
 * Takes completed analysis results from the engine pipeline and generates
 * populated report sections for each sheet of the deliverable.
 *
 * Output is structured data + narrative guidance — not the final formatted
 * document. The MCP tool returns this to Claude, who assembles the final
 * deliverable in the appropriate format (markdown, Excel instructions, etc.).
 *
 * Each section includes:
 *   - Populated data (tables, metrics, calculations)
 *   - Narrative instructions with specific data points to reference
 *   - Chain-of-thought trace showing how values were derived
 */

import type { SheetDefinition } from './template-definitions';
import { SHEET_DEFINITIONS } from './template-definitions';

// ── Analysis Result Types (matches engine output) ──

export interface AnalysisResults {
  company_name: string;
  industry: string;
  fiscal_year_label: string;
  qualification_level: string;

  // Core financials (current year)
  revenue: number;
  total_it_spend: number;
  it_opex_spend: number;
  it_capex_spend: number;
  employee_count: number;
  it_fte_count: number;

  // Prior year (if available)
  prior_revenue?: number;
  prior_it_spend?: number;
  prior_it_opex?: number;
  prior_it_capex?: number;

  // Core KPIs (from N04)
  it_spend_pct_revenue: number;
  it_opex_pct_revenue?: number;
  it_capex_pct_revenue?: number;
  it_spend_per_employee?: number;
  it_fte_ratio?: number;

  // Benchmark data (from N09)
  benchmark_industry: string;
  benchmark_median: number;
  benchmark_p25?: number;
  benchmark_p75?: number;
  benchmark_gap_pct?: number;
  benchmark_gap_dollars?: number;

  // YoY (from N05)
  yoy_it_spend_change_pct?: number;
  yoy_it_spend_change_dollars?: number;
  yoy_revenue_change_pct?: number;

  // Transformation (from N06)
  transformation_status?: string;
  transformation_types?: string[];
  transformation_spend?: number;

  // Tower analysis (from N08)
  tower_shares?: { tower: string; share: number; spend: number }[];
  top_10_concentration?: number;
  vendor_count?: number;

  // Opportunities (from N11)
  opportunities?: {
    name: string;
    annual_value_low: number;
    annual_value_high: number;
    timeline: string;
    complexity: string;
    status: string;
    description: string;
  }[];
  total_opportunity_low?: number;
  total_opportunity_high?: number;

  // Gap attribution (from N10)
  gap_components?: {
    name: string;
    amount: number;
    pct_of_gap: number;
    nature: 'Temporary' | 'Addressable' | 'Structural';
    action: string;
  }[];

  // QA (from N12)
  qa_flags?: string[];

  // Narrative (from N13)
  generated_narrative?: string;
}

// ── Report Section Output ──

export interface PopulatedSection {
  sheet_number: string;
  sheet_name: string;
  section_id: string;
  section_title: string;

  /** Populated data rows for tables */
  data?: Record<string, string | number>[];
  /** Total/summary row */
  totals?: Record<string, string | number>;

  /** Narrative generation guidance with specific data points */
  narrative_guidance?: string;
  /** Key data points to reference in narrative */
  data_points?: Record<string, string>;

  /** Calculation trace for this section */
  calculations?: string[];
}

export interface GeneratedReport {
  /** Report metadata */
  meta: {
    company_name: string;
    industry: string;
    fiscal_year: string;
    prepared_date: string;
    qualification_level: string;
    generation_timestamp: string;
  };

  /** Populated sections, one per sheet section */
  sections: PopulatedSection[];

  /** Global data points referenced across sections */
  global_data: Record<string, string>;

  /** Quality flags from QA node */
  qa_flags: string[];
}

// ── Formatting Helpers ──

function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtCurrencyFull(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtPct(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function fmtBps(value: number): string {
  const bps = Math.round(value * 10000);
  return `${bps >= 0 ? '+' : ''}${bps}bps`;
}

function fmtChange(current: number, prior: number): string {
  if (prior === 0) return 'N/A';
  const pct = (current - prior) / prior;
  return `${pct >= 0 ? '+' : ''}${(pct * 100).toFixed(1)}%`;
}

function assessmentWord(actual: number, benchmark: number, isHigherBetter: boolean): string {
  const ratio = actual / benchmark;
  if (isHigherBetter) {
    if (ratio >= 1.15) return 'Strong';
    if (ratio >= 0.95) return 'At benchmark';
    return 'Below benchmark';
  }
  // Lower is better (like spend ratios)
  if (ratio <= 0.85) return 'Efficient';
  if (ratio <= 1.05) return 'At benchmark';
  if (ratio <= 1.20) return 'Above benchmark';
  return 'Significantly above';
}

// ── Main Generation Function ──

/**
 * Generate the complete report from analysis results.
 * Returns populated sections for every sheet.
 */
export function generateReport(results: AnalysisResults): GeneratedReport {
  const now = new Date();

  const global_data: Record<string, string> = {
    company_name: results.company_name,
    industry: results.industry,
    fiscal_year: results.fiscal_year_label,
    prepared_date: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    revenue: fmtCurrency(results.revenue),
    revenue_full: fmtCurrencyFull(results.revenue),
    total_it_spend: fmtCurrency(results.total_it_spend),
    total_it_spend_full: fmtCurrencyFull(results.total_it_spend),
    it_opex: fmtCurrency(results.it_opex_spend),
    it_capex: fmtCurrency(results.it_capex_spend),
    it_spend_pct_revenue: fmtPct(results.it_spend_pct_revenue),
    benchmark_median: fmtPct(results.benchmark_median),
    benchmark_industry: results.benchmark_industry,
    employee_count: results.employee_count.toLocaleString(),
    it_fte_count: results.it_fte_count.toString(),
  };

  if (results.benchmark_gap_dollars !== undefined) {
    global_data.benchmark_gap_dollars = fmtCurrency(results.benchmark_gap_dollars);
    global_data.benchmark_gap_pct = fmtPct(results.benchmark_gap_pct ?? 0);
  }

  if (results.total_opportunity_low !== undefined) {
    global_data.total_opportunity = `${fmtCurrency(results.total_opportunity_low)}-${fmtCurrency(results.total_opportunity_high ?? results.total_opportunity_low)}`;
  }

  const sections: PopulatedSection[] = [];

  // ═══════════════════════════════════════════════════════
  // SHEET 1: Executive Summary
  // ═══════════════════════════════════════════════════════

  // Key Metrics table
  const keyMetricsData: Record<string, string | number>[] = [];
  const priorRev = results.prior_revenue ?? 0;
  const priorSpend = results.prior_it_spend ?? 0;

  if (priorRev > 0) {
    keyMetricsData.push({
      Metric: 'Revenue',
      'FY Prior': fmtCurrency(priorRev),
      'FY Current': fmtCurrency(results.revenue),
      Change: fmtChange(results.revenue, priorRev),
      Benchmark: '--',
      Gap: '--',
      Assessment: results.revenue >= priorRev ? 'Growth' : 'Contraction',
    });
  }

  keyMetricsData.push({
    Metric: 'Total IT Spend',
    'FY Prior': priorSpend > 0 ? fmtCurrency(priorSpend) : '--',
    'FY Current': fmtCurrency(results.total_it_spend),
    Change: priorSpend > 0 ? fmtChange(results.total_it_spend, priorSpend) : '--',
    Benchmark: results.benchmark_median ? fmtCurrency(results.revenue * results.benchmark_median) : '--',
    Gap: results.benchmark_gap_dollars !== undefined ? fmtCurrency(results.benchmark_gap_dollars) : '--',
    Assessment: results.transformation_status === 'Yes' ? 'Strategic elevation' : 'Review needed',
  });

  keyMetricsData.push({
    Metric: 'IT % of Revenue',
    'FY Prior': priorRev > 0 && priorSpend > 0 ? fmtPct(priorSpend / priorRev) : '--',
    'FY Current': fmtPct(results.it_spend_pct_revenue),
    Change: priorRev > 0 && priorSpend > 0 ? fmtBps(results.it_spend_pct_revenue - priorSpend / priorRev) : '--',
    Benchmark: fmtPct(results.benchmark_median),
    Gap: results.benchmark_gap_pct !== undefined ? `${(results.benchmark_gap_pct * 100).toFixed(2)}pp` : '--',
    Assessment: results.it_spend_pct_revenue > (results.benchmark_p75 ?? 999) ? 'Transformation peak' : 'Within range',
  });

  keyMetricsData.push({
    Metric: 'IT OPEX',
    'FY Prior': results.prior_it_opex ? fmtCurrency(results.prior_it_opex) : '--',
    'FY Current': fmtCurrency(results.it_opex_spend),
    Change: results.prior_it_opex ? fmtChange(results.it_opex_spend, results.prior_it_opex) : '--',
    Benchmark: '--',
    Gap: '--',
    Assessment: results.prior_it_opex && results.it_opex_spend <= results.prior_it_opex * 1.05 ? 'Controlled' : 'Increasing',
  });

  keyMetricsData.push({
    Metric: 'IT CAPEX',
    'FY Prior': results.prior_it_capex ? fmtCurrency(results.prior_it_capex) : '--',
    'FY Current': fmtCurrency(results.it_capex_spend),
    Change: results.prior_it_capex ? fmtChange(results.it_capex_spend, results.prior_it_capex) : '--',
    Benchmark: '--',
    Gap: '--',
    Assessment: results.transformation_status === 'Yes' ? 'Strategic investment' : 'Capital allocation',
  });

  sections.push({
    sheet_number: '1',
    sheet_name: 'Executive Summary',
    section_id: 'key_metrics',
    section_title: 'KEY METRICS AT A GLANCE',
    data: keyMetricsData,
    calculations: [
      `IT % of Revenue = Total IT Spend / Revenue = ${fmtCurrencyFull(results.total_it_spend)} / ${fmtCurrencyFull(results.revenue)} = ${fmtPct(results.it_spend_pct_revenue)}`,
      `Benchmark Median (${results.benchmark_industry}) = ${fmtPct(results.benchmark_median)}`,
      results.benchmark_gap_dollars !== undefined
        ? `Gap to Median = ${fmtPct(results.it_spend_pct_revenue)} - ${fmtPct(results.benchmark_median)} = ${fmtPct(results.benchmark_gap_pct ?? 0)} = ${fmtCurrency(results.benchmark_gap_dollars)}`
        : 'Gap to Median: benchmark data not available',
    ],
  });

  // Executive Summary narrative guidance
  sections.push({
    sheet_number: '1',
    sheet_name: 'Executive Summary',
    section_id: 'exec_summary_narrative',
    section_title: 'EXECUTIVE SUMMARY',
    narrative_guidance: `Write a 3-4 paragraph executive summary for ${results.company_name}. Structure:

PARAGRAPH 1 — THE HEADLINE:
${results.company_name}'s IT spend is ${fmtCurrency(results.total_it_spend)} (${fmtPct(results.it_spend_pct_revenue)} of revenue), ${results.benchmark_gap_pct !== undefined && results.benchmark_gap_pct > 0 ? `which is ${fmtPct(results.benchmark_gap_pct)} above` : 'compared to'} the ${results.benchmark_industry} peer median of ${fmtPct(results.benchmark_median)}.${priorSpend > 0 ? ` This represents a ${fmtChange(results.total_it_spend, priorSpend)} change year-over-year.` : ''}

PARAGRAPH 2 — CONTEXT & GAP DECOMPOSITION:
${results.transformation_status === 'Yes' ? `The company is in active transformation (${results.transformation_types?.join(', ')}), which accounts for a significant portion of the gap.` : 'The spend level requires decomposition to understand structural vs. addressable components.'}
${results.gap_components ? `Break the gap into: ${results.gap_components.map(g => `${g.nature} (${fmtCurrency(g.amount)}, ${fmtPct(g.pct_of_gap)})`).join(', ')}.` : 'Recommend gap decomposition analysis.'}

PARAGRAPH 3 — VALUE THESIS:
${results.total_opportunity_low !== undefined ? `Total addressable value opportunity: ${fmtCurrency(results.total_opportunity_low)}-${fmtCurrency(results.total_opportunity_high ?? results.total_opportunity_low)} annually.` : 'Quantify the value opportunity from normalization, automation, and rationalization.'}

PARAGRAPH 4 — BOARD TAKEAWAY:
End with one sentence suitable for a board presentation that frames IT spend as a strategic investment, not just a cost center.`,
    data_points: {
      it_spend: fmtCurrency(results.total_it_spend),
      it_pct_revenue: fmtPct(results.it_spend_pct_revenue),
      benchmark_median: fmtPct(results.benchmark_median),
      benchmark_industry: results.benchmark_industry,
      gap_dollars: results.benchmark_gap_dollars !== undefined ? fmtCurrency(results.benchmark_gap_dollars) : 'N/A',
      gap_pct: results.benchmark_gap_pct !== undefined ? fmtPct(results.benchmark_gap_pct) : 'N/A',
      transformation_status: results.transformation_status ?? 'Unknown',
      transformation_types: results.transformation_types?.join(', ') ?? 'None specified',
    },
  });

  // Bottom Line
  sections.push({
    sheet_number: '1',
    sheet_name: 'Executive Summary',
    section_id: 'bottom_line',
    section_title: 'THE BOTTOM LINE',
    narrative_guidance: `Write the "Bottom Line" section. Lead with "The gap is real but explainable." Structure:

1. GAP DECOMPOSITION (show each category):
${results.gap_components ? results.gap_components.map(g =>
  `   ${g.nature}: ${fmtCurrency(g.amount)} (${fmtPct(g.pct_of_gap)} of gap) — ${g.action}`
).join('\n') : '   [Recommend gap decomposition analysis with N10 data]'}

2. VALUE CREATION THESIS:
   Describe the path from current state to normalized spend over 2-3 years.

3. TOTAL VALUE OPPORTUNITY:
   ${results.total_opportunity_low !== undefined ? `${fmtCurrency(results.total_opportunity_low)}-${fmtCurrency(results.total_opportunity_high ?? results.total_opportunity_low)} annually` : '[Calculate from N11 opportunities]'}`,
    data_points: results.gap_components ? Object.fromEntries(
      results.gap_components.map((g, i) => [`gap_${i}`, `${g.name}: ${fmtCurrency(g.amount)} (${g.nature})`])
    ) : {},
  });

  // Value Opportunities table
  if (results.opportunities && results.opportunities.length > 0) {
    const oppData = results.opportunities.map((o, i) => ({
      Priority: `#${i + 1} ${o.name}`,
      'Annual Value': `${fmtCurrency(o.annual_value_low)}-${fmtCurrency(o.annual_value_high)}`,
      Timeline: o.timeline,
      Complexity: o.complexity,
      Status: o.status,
    }));
    oppData.push({
      Priority: 'TOTAL',
      'Annual Value': `${fmtCurrency(results.total_opportunity_low ?? 0)}-${fmtCurrency(results.total_opportunity_high ?? 0)}`,
      Timeline: '--',
      Complexity: '--',
      Status: '--',
    });

    sections.push({
      sheet_number: '1',
      sheet_name: 'Executive Summary',
      section_id: 'value_opportunities',
      section_title: 'VALUE OPPORTUNITY SUMMARY',
      data: oppData,
    });
  }

  // ═══════════════════════════════════════════════════════
  // SHEET 3: Year-over-Year
  // ═══════════════════════════════════════════════════════

  if (priorSpend > 0 && priorRev > 0) {
    const priorOpex = results.prior_it_opex ?? 0;
    const priorCapex = results.prior_it_capex ?? 0;
    const priorPctRev = priorSpend / priorRev;

    const yoyData: Record<string, string | number>[] = [
      {
        Metric: 'Revenue',
        'FY Prior': fmtCurrency(priorRev),
        'FY Current': fmtCurrency(results.revenue),
        'Change ($)': fmtCurrency(results.revenue - priorRev),
        'Change (%)': fmtChange(results.revenue, priorRev),
        Assessment: results.revenue >= priorRev ? 'Growth' : 'Soft market',
      },
    ];

    if (priorOpex > 0) {
      yoyData.push({
        Metric: 'IT OPEX',
        'FY Prior': fmtCurrency(priorOpex),
        'FY Current': fmtCurrency(results.it_opex_spend),
        'Change ($)': fmtCurrency(results.it_opex_spend - priorOpex),
        'Change (%)': fmtChange(results.it_opex_spend, priorOpex),
        Assessment: results.it_opex_spend <= priorOpex * 1.05 ? 'Controlled' : 'Increasing',
      });
    }

    if (priorCapex > 0) {
      yoyData.push({
        Metric: 'IT CAPEX',
        'FY Prior': fmtCurrency(priorCapex),
        'FY Current': fmtCurrency(results.it_capex_spend),
        'Change ($)': fmtCurrency(results.it_capex_spend - priorCapex),
        'Change (%)': fmtChange(results.it_capex_spend, priorCapex),
        Assessment: results.transformation_status === 'Yes' ? 'Strategic investment' : 'Capital allocation',
      });
    }

    yoyData.push({
      Metric: 'Total IT Spend',
      'FY Prior': fmtCurrency(priorSpend),
      'FY Current': fmtCurrency(results.total_it_spend),
      'Change ($)': fmtCurrency(results.total_it_spend - priorSpend),
      'Change (%)': fmtChange(results.total_it_spend, priorSpend),
      Assessment: 'See analysis',
    });

    yoyData.push({
      Metric: 'IT % of Revenue',
      'FY Prior': fmtPct(priorPctRev),
      'FY Current': fmtPct(results.it_spend_pct_revenue),
      'Change ($)': fmtBps(results.it_spend_pct_revenue - priorPctRev),
      'Change (%)': '--',
      Assessment: results.it_spend_pct_revenue > priorPctRev ? 'Elevated' : 'Declining',
    });

    sections.push({
      sheet_number: '3',
      sheet_name: 'Year-over-Year',
      section_id: 'yoy_metrics',
      section_title: 'KEY YEAR-OVER-YEAR METRICS',
      data: yoyData,
      calculations: [
        `YoY IT Spend Change = ${fmtCurrencyFull(results.total_it_spend)} - ${fmtCurrencyFull(priorSpend)} = ${fmtCurrency(results.total_it_spend - priorSpend)} (${fmtChange(results.total_it_spend, priorSpend)})`,
        `YoY Revenue Change = ${fmtCurrencyFull(results.revenue)} - ${fmtCurrencyFull(priorRev)} = ${fmtCurrency(results.revenue - priorRev)} (${fmtChange(results.revenue, priorRev)})`,
        `Prior IT % Rev = ${fmtCurrencyFull(priorSpend)} / ${fmtCurrencyFull(priorRev)} = ${fmtPct(priorPctRev)}`,
        `Current IT % Rev = ${fmtCurrencyFull(results.total_it_spend)} / ${fmtCurrencyFull(results.revenue)} = ${fmtPct(results.it_spend_pct_revenue)}`,
        `Basis point change = ${fmtBps(results.it_spend_pct_revenue - priorPctRev)}`,
      ],
    });

    sections.push({
      sheet_number: '3',
      sheet_name: 'Year-over-Year',
      section_id: 'yoy_insight',
      section_title: 'EXECUTIVE INSIGHT',
      narrative_guidance: `Write the YoY executive insight for ${results.company_name}:

IT spend ${results.total_it_spend > priorSpend ? 'increased' : 'decreased'} by ${fmtCurrency(Math.abs(results.total_it_spend - priorSpend))} (${fmtChange(results.total_it_spend, priorSpend)}) from ${fmtCurrency(priorSpend)} to ${fmtCurrency(results.total_it_spend)}.
${results.revenue < priorRev ? `Revenue declined ${fmtChange(results.revenue, priorRev)}, amplifying the IT spend ratio increase.` : ''}
${results.transformation_status === 'Yes' ? `Active transformation programs (${results.transformation_types?.join(', ')}) are the primary driver.${results.transformation_spend ? ` Transformation spend: ${fmtCurrency(results.transformation_spend)}.` : ''}` : ''}

Frame this as strategic context, not alarm. Explain whether the trajectory is expected and when normalization should occur.`,
      data_points: {
        yoy_change: fmtCurrency(results.total_it_spend - priorSpend),
        yoy_change_pct: fmtChange(results.total_it_spend, priorSpend),
        capex_pct_of_total: fmtPct(results.it_capex_spend / results.total_it_spend),
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  // SHEET 4: Benchmark Analysis
  // ═══════════════════════════════════════════════════════

  const benchData: Record<string, string | number>[] = [];

  if (results.benchmark_p25 !== undefined) {
    benchData.push({
      Benchmark: 'Top Quartile (Most Efficient)',
      '% of Revenue': fmtPct(results.benchmark_p25),
      'Dollar Equivalent': fmtCurrency(results.revenue * results.benchmark_p25),
      'Gap (pp)': `${((results.it_spend_pct_revenue - results.benchmark_p25) * 100).toFixed(2)}pp`,
      'Gap ($)': fmtCurrency(results.total_it_spend - results.revenue * results.benchmark_p25),
      Interpretation: 'Efficiency frontier',
    });
  }

  benchData.push({
    Benchmark: 'Peer Median',
    '% of Revenue': fmtPct(results.benchmark_median),
    'Dollar Equivalent': fmtCurrency(results.revenue * results.benchmark_median),
    'Gap (pp)': `${((results.it_spend_pct_revenue - results.benchmark_median) * 100).toFixed(2)}pp`,
    'Gap ($)': fmtCurrency(results.total_it_spend - results.revenue * results.benchmark_median),
    Interpretation: 'Industry norm',
  });

  if (results.benchmark_p75 !== undefined) {
    benchData.push({
      Benchmark: '75th Percentile',
      '% of Revenue': fmtPct(results.benchmark_p75),
      'Dollar Equivalent': fmtCurrency(results.revenue * results.benchmark_p75),
      'Gap (pp)': `${((results.it_spend_pct_revenue - results.benchmark_p75) * 100).toFixed(2)}pp`,
      'Gap ($)': fmtCurrency(results.total_it_spend - results.revenue * results.benchmark_p75),
      Interpretation: 'Higher-spend peer group',
    });
  }

  benchData.push({
    Benchmark: `${results.company_name} Actual`,
    '% of Revenue': fmtPct(results.it_spend_pct_revenue),
    'Dollar Equivalent': fmtCurrency(results.total_it_spend),
    'Gap (pp)': '--',
    'Gap ($)': '--',
    Interpretation: 'Current position',
  });

  sections.push({
    sheet_number: '4',
    sheet_name: 'Benchmark Analysis',
    section_id: 'bench_comparison',
    section_title: 'BENCHMARK COMPARISON',
    data: benchData,
    calculations: [
      `Benchmark source: Gartner IT Key Metrics Data 2026 — ${results.benchmark_industry}`,
      `Peer Median IT Spend % Revenue = ${fmtPct(results.benchmark_median)}`,
      `Peer Median Dollar Equivalent = ${fmtCurrencyFull(results.revenue)} × ${fmtPct(results.benchmark_median)} = ${fmtCurrency(results.revenue * results.benchmark_median)}`,
      `Company Actual = ${fmtPct(results.it_spend_pct_revenue)} = ${fmtCurrency(results.total_it_spend)}`,
      `Gap to Median = ${fmtPct(results.it_spend_pct_revenue)} - ${fmtPct(results.benchmark_median)} = ${((results.it_spend_pct_revenue - results.benchmark_median) * 100).toFixed(2)}pp`,
      `Gap in Dollars = ${fmtCurrency(results.total_it_spend)} - ${fmtCurrency(results.revenue * results.benchmark_median)} = ${fmtCurrency(results.total_it_spend - results.revenue * results.benchmark_median)}`,
    ],
  });

  // Gap decomposition
  if (results.gap_components && results.gap_components.length > 0) {
    const gapData: { 'Gap Component': string; Amount: string; '% of Gap': string; Nature: string; 'Action Required': string }[] = results.gap_components.map(g => ({
      'Gap Component': g.name,
      Amount: fmtCurrency(g.amount),
      '% of Gap': fmtPct(g.pct_of_gap),
      Nature: g.nature,
      'Action Required': g.action,
    }));

    const totalGap = results.gap_components.reduce((sum, g) => sum + g.amount, 0);
    gapData.push({
      'Gap Component': 'TOTAL GAP',
      Amount: fmtCurrency(totalGap),
      '% of Gap': '100%',
      Nature: '--',
      'Action Required': '--',
    });

    sections.push({
      sheet_number: '4',
      sheet_name: 'Benchmark Analysis',
      section_id: 'gap_decomposition',
      section_title: 'GAP DECOMPOSITION',
      data: gapData,
      calculations: results.gap_components.map(g =>
        `${g.name} (${g.nature}): ${fmtCurrency(g.amount)} = ${fmtPct(g.pct_of_gap)} of total gap`
      ),
    });
  }

  // ═══════════════════════════════════════════════════════
  // SHEET 5: Key Spend Metrics
  // ═══════════════════════════════════════════════════════

  // OpEx vs CapEx
  const capexPctTotal = results.it_capex_spend / results.total_it_spend;
  sections.push({
    sheet_number: '5',
    sheet_name: 'Key Spend Metrics',
    section_id: 'opex_capex',
    section_title: 'OPEX vs CAPEX DISTRIBUTION',
    data: [
      {
        Metric: 'IT OPEX',
        'FY Prior': results.prior_it_opex ? fmtCurrency(results.prior_it_opex) : '--',
        'FY Current': fmtCurrency(results.it_opex_spend),
        'YoY Delta': results.prior_it_opex ? fmtChange(results.it_opex_spend, results.prior_it_opex) : '--',
        Implication: 'Run-the-business cost base',
      },
      {
        Metric: 'IT CAPEX',
        'FY Prior': results.prior_it_capex ? fmtCurrency(results.prior_it_capex) : '--',
        'FY Current': fmtCurrency(results.it_capex_spend),
        'YoY Delta': results.prior_it_capex ? fmtChange(results.it_capex_spend, results.prior_it_capex) : '--',
        Implication: 'Strategic investment',
      },
      {
        Metric: 'Total IT Spend',
        'FY Prior': priorSpend > 0 ? fmtCurrency(priorSpend) : '--',
        'FY Current': fmtCurrency(results.total_it_spend),
        'YoY Delta': priorSpend > 0 ? fmtChange(results.total_it_spend, priorSpend) : '--',
        Implication: 'Total technology investment',
      },
      {
        Metric: 'CAPEX % of Total',
        'FY Prior': results.prior_it_capex && priorSpend > 0 ? fmtPct(results.prior_it_capex / priorSpend) : '--',
        'FY Current': fmtPct(capexPctTotal),
        'YoY Delta': '--',
        Implication: capexPctTotal > 0.40 ? 'Heavy transformation investment' : capexPctTotal > 0.30 ? 'Moderate capital allocation' : 'Low capital intensity',
      },
    ],
    calculations: [
      `CAPEX % of Total = ${fmtCurrencyFull(results.it_capex_spend)} / ${fmtCurrencyFull(results.total_it_spend)} = ${fmtPct(capexPctTotal)}`,
      `Typical range: 25-35%. Above 40% indicates heavy transformation investment.`,
      `OPEX % of Total = ${fmtPct(1 - capexPctTotal)}`,
    ],
  });

  // Per-head metrics
  if (results.it_fte_count > 0 && results.employee_count > 0) {
    const spendPerITFTE = results.total_it_spend / results.it_fte_count;
    const spendPerEmployee = results.total_it_spend / results.employee_count;
    const itFTEPer100 = (results.it_fte_count / results.employee_count) * 100;

    sections.push({
      sheet_number: '5',
      sheet_name: 'Key Spend Metrics',
      section_id: 'per_head',
      section_title: 'IT SPEND PER HEAD',
      data: [
        { Metric: 'Estimated IT FTEs', 'Company Value': results.it_fte_count, Benchmark: '--', Assessment: '--' },
        { Metric: 'IT Spend per IT FTE', 'Company Value': fmtCurrency(spendPerITFTE), Benchmark: '--', Assessment: '--' },
        { Metric: 'IT Spend per Employee', 'Company Value': fmtCurrency(spendPerEmployee), Benchmark: '--', Assessment: '--' },
        { Metric: 'IT FTEs per 100 Employees', 'Company Value': itFTEPer100.toFixed(1), Benchmark: '--', Assessment: '--' },
      ],
      calculations: [
        `IT Spend per IT FTE = ${fmtCurrencyFull(results.total_it_spend)} / ${results.it_fte_count} = ${fmtCurrency(spendPerITFTE)}`,
        `IT Spend per Employee = ${fmtCurrencyFull(results.total_it_spend)} / ${results.employee_count.toLocaleString()} = ${fmtCurrency(spendPerEmployee)}`,
        `IT FTE Ratio = ${results.it_fte_count} / ${results.employee_count.toLocaleString()} × 100 = ${itFTEPer100.toFixed(1)} per 100`,
      ],
    });
  }

  // ═══════════════════════════════════════════════════════
  // SHEET 6: Tower Analysis
  // ═══════════════════════════════════════════════════════

  if (results.tower_shares && results.tower_shares.length > 0) {
    const towerData = results.tower_shares.map(t => ({
      Tower: t.tower,
      'Total ($)': fmtCurrency(t.spend),
      '% Rev': fmtPct(t.spend / results.revenue),
      'Share of IT': fmtPct(t.share),
      'Proxy BM %Rev': fmtPct(results.benchmark_median * t.share),
    }));

    sections.push({
      sheet_number: '6',
      sheet_name: 'Tower Analysis',
      section_id: 'tower_table',
      section_title: 'IT SPEND BY TOWER',
      data: towerData,
      totals: {
        Tower: 'TOTAL',
        'Total ($)': fmtCurrency(results.total_it_spend),
        '% Rev': fmtPct(results.it_spend_pct_revenue),
        'Share of IT': '100%',
      },
      calculations: results.tower_shares.map(t =>
        `${t.tower}: ${fmtCurrency(t.spend)} = ${fmtPct(t.share)} of IT spend = ${fmtPct(t.spend / results.revenue)} of revenue`
      ),
    });
  }

  // ═══════════════════════════════════════════════════════
  // SHEET 2: Recommendations (narrative guidance for each priority)
  // ═══════════════════════════════════════════════════════

  if (results.opportunities && results.opportunities.length > 0) {
    const priorityColors = ['Red', 'Orange', 'Gold', 'Green', 'Navy'];

    for (let i = 0; i < Math.min(results.opportunities.length, 5); i++) {
      const opp = results.opportunities[i];
      sections.push({
        sheet_number: '2',
        sheet_name: 'Recommendations',
        section_id: `priority_${i + 1}`,
        section_title: `PRIORITY #${i + 1} — ${opp.name.toUpperCase()}`,
        narrative_guidance: `Write Priority #${i + 1} for ${results.company_name}. Color: ${priorityColors[i]}.

PRIORITY NAME: ${opp.name}
ONE-SENTENCE DESCRIPTION: ${opp.description}
ANNUAL VALUE: ${fmtCurrency(opp.annual_value_low)}-${fmtCurrency(opp.annual_value_high)}
TIMELINE: ${opp.timeline}
COMPLEXITY: ${opp.complexity}

THE ISSUE (pink background):
Write 2-3 paragraphs describing the current problem with supporting data from the analysis. Reference specific metrics, benchmarks, or tower data that justify this priority.

THE OPPORTUNITY (green background):
Write 2-3 paragraphs describing the opportunity with projected value. Be specific about the mechanism (e.g., "renegotiate contracts", "automate tier-1 support", "consolidate 3 ERP instances to 1").

RECOMMENDED ACTIONS (blue background):
Write 5 specific, numbered actions. Each should be 1-2 sentences with a clear owner and timeline.

METRICS TABLE:
Create a 3-4 row table with Metric / Current / Target / Timeline columns specific to this priority.`,
        data_points: {
          annual_value: `${fmtCurrency(opp.annual_value_low)}-${fmtCurrency(opp.annual_value_high)}`,
          timeline: opp.timeline,
          complexity: opp.complexity,
          status: opp.status,
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // SHEET 8: Appendix
  // ═══════════════════════════════════════════════════════

  sections.push({
    sheet_number: '8',
    sheet_name: 'Appendix',
    section_id: 'data_sources',
    section_title: 'DATA SOURCES',
    narrative_guidance: `Document all data sources used:

PRIMARY DATA:
- Client-provided financial data (revenue, IT spend, OpEx, CapEx)
- ${results.vendor_count ? `Vendor data: ${results.vendor_count} vendors mapped to ${results.tower_shares?.length ?? 0} towers` : 'No vendor-level data provided'}
- Workforce data: ${results.it_fte_count} IT FTEs, ${results.employee_count.toLocaleString()} total employees
- Transformation status: ${results.transformation_status ?? 'Not specified'}

BENCHMARK DATA:
- Gartner IT Key Metrics Data 2026
- Industry: ${results.benchmark_industry}
- Peer Median IT Spend % Revenue: ${fmtPct(results.benchmark_median)}
${results.benchmark_p25 ? `- P25 (Top Quartile): ${fmtPct(results.benchmark_p25)}` : ''}
${results.benchmark_p75 ? `- P75: ${fmtPct(results.benchmark_p75)}` : ''}`,
  });

  sections.push({
    sheet_number: '8',
    sheet_name: 'Appendix',
    section_id: 'key_assumptions',
    section_title: 'KEY ASSUMPTIONS',
    narrative_guidance: `Document key assumptions:

1. Revenue trajectory assumes ${results.revenue > (results.prior_revenue ?? 0) ? 'continued growth' : 'stabilization'} based on current trends
2. Transformation programs (${results.transformation_types?.join(', ') ?? 'N/A'}) are expected to complete within stated timelines
3. Cost reduction estimates are achievable within 2-3 years with appropriate investment
4. Gartner ${results.benchmark_industry} benchmarks are applicable to ${results.company_name}'s business model
5. ${results.vendor_count ? `Vendor spend data is substantially complete (${results.vendor_count} vendors captured)` : 'Vendor-level data was not provided; tower analysis uses estimates'}
6. Insourcing/outsourcing optimization does not require major organizational restructuring
7. Automation maturity assessments are based on industry patterns and role automability scores`,
  });

  return {
    meta: {
      company_name: results.company_name,
      industry: results.industry,
      fiscal_year: results.fiscal_year_label,
      prepared_date: global_data.prepared_date,
      qualification_level: results.qualification_level,
      generation_timestamp: now.toISOString(),
    },
    sections,
    global_data,
    qa_flags: results.qa_flags ?? [],
  };
}
