/**
 * IT Spend Report Template Definitions
 *
 * Structured representation of the 10-sheet Excel report template
 * (IT_Spend_Report_Template_Tower_Aligned.xlsx).
 *
 * Each sheet definition includes:
 *   - Section layout (what goes where)
 *   - Data slots (placeholders that get populated)
 *   - Instructions for narrative generation
 *   - Visual cues (colors, emphasis) for formatting
 *
 * These definitions are used by:
 *   - report-generator.ts to populate sections from analysis data
 *   - MCP tools to return template instructions to Claude
 *   - Export functions to generate markdown/structured output
 */

// ── Section Types ──

export type SectionType =
  | 'banner'        // Colored header bar (e.g., "EXECUTIVE SUMMARY")
  | 'narrative'     // Multi-paragraph text block
  | 'table'         // Structured data table
  | 'metric_row'    // Single key metric with value, benchmark, assessment
  | 'priority'      // Numbered priority with issue/opportunity/actions
  | 'bullet_list'   // Numbered or bulleted items
  | 'distribution'  // Visual distribution/position chart
  | 'note';         // Explanatory footnote

export type BannerColor = 'navy' | 'green' | 'orange' | 'purple' | 'blue' | 'red' | 'gold';

export interface SectionSlot {
  /** Placeholder token (e.g., '[Company Name]') */
  token: string;
  /** Description of what should fill this slot */
  description: string;
  /** Source field from analysis results, if direct mapping */
  source_field?: string;
  /** Whether this requires narrative generation vs. direct data */
  requires_narrative: boolean;
}

export interface TableColumn {
  header: string;
  format: 'text' | 'currency' | 'percentage' | 'number' | 'assessment';
  width?: 'narrow' | 'medium' | 'wide';
}

export interface SheetSection {
  id: string;
  type: SectionType;
  title?: string;
  color?: BannerColor;
  columns?: TableColumn[];
  row_count?: number;
  slots: SectionSlot[];
  instructions: string;
}

export interface SheetDefinition {
  sheet_number: string;
  sheet_name: string;
  purpose: string;
  populate_with: string;
  output: string;
  sections: SheetSection[];
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS — ONE PER SHEET
// ═══════════════════════════════════════════════════════════════

export const SHEET_DEFINITIONS: SheetDefinition[] = [
  // ── Sheet 0: Template Guide ──
  {
    sheet_number: '0',
    sheet_name: 'Template Guide',
    purpose: 'Instructions for populating the report and tower framework reference',
    populate_with: 'Global inputs gathered from the analysis',
    output: 'Completed metadata fields used across all sheets',
    sections: [
      {
        id: 'global_inputs',
        type: 'table',
        title: 'Global Inputs to Gather Before Drafting',
        color: 'navy',
        columns: [
          { header: 'Field', format: 'text' },
          { header: 'Description', format: 'text' },
          { header: 'Value', format: 'text' },
        ],
        slots: [
          { token: '[Company Name]', description: 'Company name used in titles and narratives', source_field: 'company_name', requires_narrative: false },
          { token: '[FY2025]', description: 'Fiscal year or period under analysis', source_field: 'fiscal_year_label', requires_narrative: false },
          { token: '[Month YYYY]', description: 'Date shown on report cover', source_field: 'prepared_date', requires_narrative: false },
          { token: '[Revenue $]', description: 'Current-year company revenue', source_field: 'revenue', requires_narrative: false },
          { token: '[Prior-Year Revenue $]', description: 'Prior-year revenue for YoY analysis', source_field: 'prior_revenue', requires_narrative: false },
          { token: '[OPEX $]', description: 'Current-year total IT OPEX', source_field: 'it_opex_spend', requires_narrative: false },
          { token: '[CAPEX $]', description: 'Current-year total IT CAPEX', source_field: 'it_capex_spend', requires_narrative: false },
          { token: '[Total IT Spend $]', description: 'OPEX + CAPEX + D&A if used', source_field: 'total_it_spend', requires_narrative: false },
          { token: '[Spend %]', description: 'IT spend as % of revenue', source_field: 'it_spend_pct_revenue', requires_narrative: false },
          { token: '[Median % / Top Quartile %]', description: 'Peer benchmark median and top quartile', source_field: 'benchmark_median', requires_narrative: false },
          { token: '[Dollar / % split]', description: 'Gap decomposition: temporary vs structural vs addressable', requires_narrative: true },
          { token: '[ERP, WMS, cloud, cyber, AI, etc.]', description: 'Major transformation programs driving spend', source_field: 'transformation_types', requires_narrative: false },
          { token: '[1-2 sentence value story]', description: 'Normalization / automation / rationalization thesis', requires_narrative: true },
        ],
        row_count: 13,
        instructions: 'Populate all global inputs before drafting any sheet. These values propagate throughout the report.',
      },
    ],
  },

  // ── Sheet 1: Executive Summary ──
  {
    sheet_number: '1',
    sheet_name: 'Executive Summary',
    purpose: 'Board-ready one-page summary with key metrics, gap analysis, and value thesis',
    populate_with: 'N04 Core KPIs, N05 YoY, N09 Benchmark Compare, N11 Opportunity',
    output: '3-4 paragraph executive narrative, key metrics table, gap decomposition, value opportunity summary',
    sections: [
      {
        id: 'cover',
        type: 'banner',
        title: 'Cover Block',
        color: 'navy',
        slots: [
          { token: '[COMPANY NAME]', description: 'Company name in large bold', source_field: 'company_name', requires_narrative: false },
          { token: '[FISCAL YEAR / PERIOD]', description: 'Reporting period', source_field: 'fiscal_year_label', requires_narrative: false },
          { token: '[MONTH YYYY]', description: 'Preparation date', source_field: 'prepared_date', requires_narrative: false },
        ],
        instructions: 'Auto-populated from global inputs.',
      },
      {
        id: 'exec_summary_narrative',
        type: 'narrative',
        title: 'EXECUTIVE SUMMARY',
        color: 'navy',
        slots: [
          {
            token: '[executive_summary]',
            description: '3-4 paragraph executive summary covering: (1) current IT spend and IT spend as % of revenue, (2) comparison to peer benchmark and size of gap, (3) explanation of what is temporary vs structural vs addressable, (4) the 2-3 year normalization / value-creation thesis, and (5) a one-sentence stakeholder message or board-ready takeaway.',
            requires_narrative: true,
          },
        ],
        instructions: 'Write for a board audience. Lead with the headline number (IT spend % revenue), contextualize against benchmark, decompose the gap, then pivot to the value story. End with one board-ready sentence.',
      },
      {
        id: 'key_metrics',
        type: 'table',
        title: 'KEY METRICS AT A GLANCE',
        color: 'navy',
        columns: [
          { header: 'Metric', format: 'text' },
          { header: 'FY Prior', format: 'currency' },
          { header: 'FY Current', format: 'currency' },
          { header: 'Change', format: 'percentage' },
          { header: 'Benchmark', format: 'currency' },
          { header: 'Gap', format: 'currency' },
          { header: 'Assessment', format: 'assessment' },
        ],
        slots: [
          { token: '[revenue_row]', description: 'Revenue row with prior, current, change', source_field: 'revenue', requires_narrative: false },
          { token: '[total_it_spend_row]', description: 'Total IT Spend (highlighted) with benchmark gap', source_field: 'total_it_spend', requires_narrative: false },
          { token: '[it_pct_revenue_row]', description: 'IT % of Revenue with basis point change', source_field: 'it_spend_pct_revenue', requires_narrative: false },
          { token: '[opex_row]', description: 'IT OPEX row', source_field: 'it_opex_spend', requires_narrative: false },
          { token: '[capex_row]', description: 'IT CAPEX row', source_field: 'it_capex_spend', requires_narrative: false },
        ],
        row_count: 5,
        instructions: 'Populate from N04 Core KPIs and N05 YoY. Assessment column should be a 2-3 word characterization (e.g., "Strategic elevation", "Controlled", "Transformation peak").',
      },
      {
        id: 'bottom_line',
        type: 'narrative',
        title: 'THE BOTTOM LINE',
        color: 'green',
        slots: [
          {
            token: '[bottom_line]',
            description: 'Multi-paragraph narrative: (1) gap decomposition with percentages and dollar amounts for Temporary / Addressable / Structural, (2) the value creation thesis, (3) TOTAL VALUE OPPORTUNITY range.',
            requires_narrative: true,
          },
        ],
        instructions: 'Lead with "The gap is real but explainable." Break into three categories with % and $ for each. End with the total value opportunity range from N11.',
      },
      {
        id: 'value_opportunities',
        type: 'table',
        title: 'VALUE OPPORTUNITY SUMMARY',
        color: 'navy',
        columns: [
          { header: 'Priority', format: 'text' },
          { header: 'Annual Value', format: 'currency' },
          { header: 'Timeline', format: 'text' },
          { header: 'Complexity', format: 'text' },
          { header: 'Status', format: 'text' },
        ],
        slots: [
          { token: '[opportunity_rows]', description: 'Top 5 prioritized opportunities from N11', source_field: 'opportunities', requires_narrative: false },
          { token: '[total_opportunity]', description: 'Total value opportunity range', requires_narrative: false },
        ],
        row_count: 6,
        instructions: 'Ranked by annual value descending. Include a total row. Complexity: Low/Medium/High. Timeline: specific periods like "FY26-27" or "12-18 months".',
      },
    ],
  },

  // ── Sheet 2: Recommendations ──
  {
    sheet_number: '2',
    sheet_name: 'Recommendations',
    purpose: 'Top 5 strategic IT priorities with detailed issue/opportunity/actions for each',
    populate_with: 'N11 Opportunities, N10 Gap Attribution, all engine outputs',
    output: '5 priority pages, each with issue statement, opportunity, 5 recommended actions, and supporting metrics',
    sections: [
      {
        id: 'recs_exec_summary',
        type: 'narrative',
        title: 'EXECUTIVE SUMMARY',
        color: 'navy',
        slots: [
          {
            token: '[recs_intro]',
            description: 'Summarize why the organization is at an inflection point and how the 5 priorities create a cohesive transformation roadmap.',
            requires_narrative: true,
          },
        ],
        instructions: 'Frame as an inflection point. Reference the total value opportunity. Preview the 5 priorities as a cohesive thesis, not disconnected items.',
      },
      {
        id: 'value_at_stake',
        type: 'table',
        title: 'VALUE AT STAKE',
        columns: [
          { header: 'Priority', format: 'text' },
          { header: 'Annual Value', format: 'currency' },
          { header: 'Timeline', format: 'text' },
          { header: 'Investment', format: 'currency' },
          { header: 'Net 3-Year Impact', format: 'currency' },
        ],
        slots: [
          { token: '[value_at_stake_rows]', description: '5 priority rows + total from N11 opportunities', requires_narrative: false },
        ],
        row_count: 6,
        instructions: 'Mirror the executive summary table but add Investment Required and Net 3-Year Impact columns.',
      },
      {
        id: 'priority_template',
        type: 'priority',
        title: 'PRIORITY #[N] — [PRIORITY NAME]',
        slots: [
          { token: '[priority_name]', description: 'Short name for the priority (e.g., "Post-Transformation Normalization")', requires_narrative: true },
          { token: '[one_sentence]', description: 'One-sentence description of the priority', requires_narrative: true },
          { token: '[the_issue]', description: '2-3 paragraph description of the current issue with supporting data', requires_narrative: true },
          { token: '[the_opportunity]', description: '2-3 paragraph description of the opportunity with projected value', requires_narrative: true },
          { token: '[actions_1_through_5]', description: '5 numbered recommended actions, each 1-2 sentences', requires_narrative: true },
          { token: '[metrics_table]', description: 'Priority-specific metrics table (3-4 rows) with Current/Target/Timeline', requires_narrative: false },
        ],
        instructions: 'Each priority follows the same 4-part structure: (1) THE ISSUE (pink background) — data-driven problem statement, (2) THE OPPORTUNITY (green background) — value and approach, (3) RECOMMENDED ACTIONS (blue background) — 5 specific actions, (4) Supporting metrics table. Priority colors: #1=Red, #2=Orange, #3=Gold, #4=Green, #5=Navy.',
      },
    ],
  },

  // ── Sheet 3: Year-over-Year ──
  {
    sheet_number: '3',
    sheet_name: 'Year-over-Year',
    purpose: 'Year-over-year IT spend analysis with drivers and forward outlook',
    populate_with: 'N05 YoY, N06 Transformation, N04 Core KPIs',
    output: 'YoY metrics table, driver analysis, CAPEX breakdown, forward projections',
    sections: [
      {
        id: 'yoy_insight',
        type: 'narrative',
        title: 'EXECUTIVE INSIGHT',
        color: 'green',
        slots: [
          { token: '[yoy_insight]', description: 'Explain the year-over-year story: what changed, why, and what it means', requires_narrative: true },
        ],
        instructions: 'Lead with the headline change (e.g., "+22% IT spend increase"). Immediately explain whether this is alarming or strategic. Reference transformation programs.',
      },
      {
        id: 'yoy_metrics',
        type: 'table',
        title: 'KEY YEAR-OVER-YEAR METRICS',
        columns: [
          { header: 'Metric', format: 'text' },
          { header: 'FY Prior', format: 'currency' },
          { header: 'FY Current', format: 'currency' },
          { header: 'Change ($)', format: 'currency' },
          { header: 'Change (%)', format: 'percentage' },
          { header: 'Assessment', format: 'assessment' },
        ],
        slots: [
          { token: '[yoy_metric_rows]', description: 'Revenue, IT OPEX, IT CAPEX, Total IT Spend (highlighted), IT % of Revenue, Gap to Peer Median', requires_narrative: false },
        ],
        row_count: 6,
        instructions: 'Populate from N05 YoY results. Total IT Spend row highlighted yellow. Assessment is 2-3 word characterization.',
      },
      {
        id: 'yoy_drivers',
        type: 'narrative',
        title: 'WHAT DROVE THE CHANGE?',
        slots: [
          { token: '[driver_narrative]', description: 'One-sentence summary + CAPEX Investment Breakdown table (up to 10 project rows)', requires_narrative: true },
          { token: '[capex_breakdown]', description: 'Table: Project / FY Spend / % of CAPEX / Strategic Rationale', requires_narrative: false },
        ],
        instructions: 'Start with "The Story in One Sentence:" — distill the change to its essence. Then show the CAPEX breakdown table sorted by spend descending.',
      },
      {
        id: 'yoy_leadership',
        type: 'bullet_list',
        title: 'WHY LEADERSHIP SHOULD CARE',
        color: 'orange',
        slots: [
          { token: '[leadership_points]', description: '4 numbered points explaining why leadership should pay attention to the YoY trend', requires_narrative: true },
        ],
        instructions: 'Each point should connect a data observation to a strategic implication. Mix financial, competitive, and risk perspectives.',
      },
      {
        id: 'forward_outlook',
        type: 'table',
        title: 'FORWARD OUTLOOK: FY26-27 TRAJECTORY',
        columns: [
          { header: 'Metric', format: 'text' },
          { header: 'FY Current (Actual)', format: 'currency' },
          { header: 'FY+1 (Projected)', format: 'currency' },
          { header: 'FY+2 (Target)', format: 'currency' },
          { header: 'Commentary', format: 'text' },
        ],
        slots: [
          { token: '[forward_rows]', description: 'IT OPEX, IT CAPEX, Total IT Spend (highlighted), IT % of Revenue, Gap to Median', requires_narrative: true },
        ],
        row_count: 5,
        instructions: 'Project forward using transformation timeline and normalization assumptions. Total IT Spend row green. Commentary column explains the trajectory.',
      },
    ],
  },

  // ── Sheet 4: Benchmark Analysis ──
  {
    sheet_number: '4',
    sheet_name: 'Benchmark Analysis',
    purpose: 'Peer group benchmark comparison with gap decomposition and distribution position',
    populate_with: 'N02 Benchmark Select, N09 Benchmark Compare, N10 Gap Attribution',
    output: 'Benchmark comparison table, gap decomposition, distribution position chart',
    sections: [
      {
        id: 'bench_insight',
        type: 'narrative',
        title: 'EXECUTIVE INSIGHT',
        color: 'green',
        slots: [
          { token: '[bench_insight]', description: 'Explain where the company sits vs. peers and why the gap exists', requires_narrative: true },
        ],
        instructions: 'Lead with position (e.g., "above 75th percentile"). Immediately contextualize: temporary transformation investment vs. structural inefficiency.',
      },
      {
        id: 'bench_methodology',
        type: 'narrative',
        title: 'BENCHMARK METHODOLOGY & RATIONALE',
        color: 'purple',
        slots: [
          { token: '[methodology]', description: 'Describe peer group selection, data source (Gartner ITKMD 2026), and why this benchmark is appropriate', requires_narrative: true },
        ],
        instructions: 'Reference Gartner IT Key Metrics Data 2026. Explain industry match, size band considerations, and any adjustments made.',
      },
      {
        id: 'bench_comparison',
        type: 'table',
        title: 'BENCHMARK COMPARISON',
        columns: [
          { header: 'Benchmark', format: 'text' },
          { header: '% of Revenue', format: 'percentage' },
          { header: 'Dollar Equivalent', format: 'currency' },
          { header: 'Gap (pp)', format: 'percentage' },
          { header: 'Gap ($)', format: 'currency' },
          { header: 'Interpretation', format: 'text' },
        ],
        slots: [
          { token: '[bench_rows]', description: 'Top Quartile (P25), Peer Median, 75th Percentile, Company Actual', requires_narrative: false },
        ],
        row_count: 4,
        instructions: 'Populate from N09 benchmark results. P25 and Median from Gartner data. Company Actual highlighted yellow. Interpretation column: 1-phrase characterization.',
      },
      {
        id: 'gap_decomposition',
        type: 'table',
        title: 'DECOMPOSING THE GAP TO PEER MEDIAN',
        columns: [
          { header: 'Gap Component', format: 'text' },
          { header: 'Amount', format: 'currency' },
          { header: '% of Gap', format: 'percentage' },
          { header: 'Nature', format: 'text' },
          { header: 'Action Required', format: 'text' },
        ],
        slots: [
          { token: '[gap_components]', description: 'Up to 5 gap components from N10 Gap Attribution, plus Total row', requires_narrative: false },
          { token: '[gap_summary]', description: 'Summary: Temporary (green) / Addressable (blue) / Structural (yellow) with $ and % for each', requires_narrative: false },
        ],
        row_count: 8,
        instructions: 'Populate from N10 Gap Attribution. Each component has a Nature: Temporary, Addressable, or Structural. Total row highlighted yellow. Summary section below shows the three categories.',
      },
      {
        id: 'bench_leadership',
        type: 'bullet_list',
        title: 'WHY LEADERSHIP SHOULD CARE',
        color: 'orange',
        slots: [
          { token: '[bench_leadership_points]', description: '6 numbered points connecting benchmark position to strategic implications', requires_narrative: true },
        ],
        instructions: 'Mix points about current position, trajectory, competitive implications, and board-level messaging.',
      },
      {
        id: 'distribution_position',
        type: 'distribution',
        title: 'WHERE [COMPANY] SITS IN THE DISTRIBUTION',
        slots: [
          { token: '[distribution]', description: 'Vertical distribution showing: Top Quartile, Peer Median, Company Target (green), 75th Percentile, Company Actual (red)', requires_narrative: false },
        ],
        instructions: 'Show the company position on the P25/Median/P75 distribution. Company Target should be between Median and P75. Company Actual shown in red if above P75.',
      },
    ],
  },

  // ── Sheet 5: Key Spend Metrics ──
  {
    sheet_number: '5',
    sheet_name: 'Key Spend Metrics',
    purpose: '4 deep-dive metric sections: OpEx/CapEx, per-head, insource/outsource, automation potential',
    populate_with: 'N04 Core KPIs, N07 Workforce, N09 Benchmark Compare',
    output: '4 metric sections each with executive insight, rationale, and data table',
    sections: [
      {
        id: 'opex_capex',
        type: 'table',
        title: 'OPEX vs CAPEX DISTRIBUTION',
        columns: [
          { header: 'Metric', format: 'text' },
          { header: 'FY Prior', format: 'currency' },
          { header: 'FY Current', format: 'currency' },
          { header: 'YoY Delta', format: 'percentage' },
          { header: 'Implication', format: 'text' },
        ],
        slots: [
          { token: '[opex_capex_insight]', description: 'Executive insight on OpEx vs CapEx distribution and what it signals', requires_narrative: true },
          { token: '[opex_capex_rationale]', description: 'Rationale for why the current mix is appropriate or needs adjustment', requires_narrative: true },
          { token: '[opex_capex_rows]', description: 'IT OPEX, IT CAPEX, Total IT Spend, CAPEX % of Total', requires_narrative: false },
        ],
        row_count: 4,
        instructions: 'CAPEX % of Total is the key signal: >40% indicates heavy transformation investment. Compare to typical 25-35% range.',
      },
      {
        id: 'per_head',
        type: 'table',
        title: 'IT SPEND PER HEAD',
        columns: [
          { header: 'Metric', format: 'text' },
          { header: 'Company Value', format: 'currency' },
          { header: 'Benchmark', format: 'currency' },
          { header: 'Assessment', format: 'assessment' },
        ],
        slots: [
          { token: '[per_head_insight]', description: 'Executive insight on IT spend efficiency per head', requires_narrative: true },
          { token: '[per_head_rationale]', description: 'Rationale for per-head metrics context', requires_narrative: true },
          { token: '[per_head_rows]', description: 'IT FTEs, Spend per IT FTE, Spend per Employee, IT FTEs per 100, IT Labor % of Spend', requires_narrative: false },
        ],
        row_count: 5,
        instructions: 'Populate from N07 Workforce and N04 Core KPIs. Benchmark from Gartner industry data. Assessment: Under/At/Over benchmark.',
      },
      {
        id: 'insource_outsource',
        type: 'table',
        title: 'INSOURCE vs OUTSOURCE vs CONTRACTOR MIX',
        columns: [
          { header: 'Source Type', format: 'text' },
          { header: 'Amount', format: 'currency' },
          { header: '% of Total', format: 'percentage' },
          { header: 'Benchmark', format: 'percentage' },
          { header: 'Assessment', format: 'assessment' },
        ],
        slots: [
          { token: '[mix_insight]', description: 'Executive insight on workforce sourcing mix', requires_narrative: true },
          { token: '[mix_rationale]', description: 'Rationale for current mix and optimization opportunities', requires_narrative: true },
          { token: '[mix_rows]', description: 'INSOURCE (Internal FTEs), OUTSOURCE (SaaS/Managed), CONTRACTOR (Prof Services), TOTAL', requires_narrative: false },
        ],
        row_count: 4,
        instructions: 'Populate from N07 Workforce if contractor/outsource data available. If not, note as "Data not provided" and recommend collection.',
      },
      {
        id: 'automation_potential',
        type: 'table',
        title: 'AUTOMATION POTENTIAL vs ACHIEVED',
        columns: [
          { header: 'Domain', format: 'text' },
          { header: 'Current', format: 'percentage' },
          { header: 'Target', format: 'percentage' },
          { header: 'Gap', format: 'percentage' },
          { header: 'Priority Investment', format: 'text' },
        ],
        slots: [
          { token: '[auto_insight]', description: 'Executive insight on automation maturity and opportunity', requires_narrative: true },
          { token: '[auto_rationale]', description: 'Rationale for automation priorities', requires_narrative: true },
          { token: '[auto_rows]', description: '7 domain rows (IT Ops, App Dev, Security, Data, End User, Finance, HR) + AVERAGE', requires_narrative: true },
        ],
        row_count: 8,
        instructions: 'Use automability scores from workforce crosswalk. Current = estimated current automation level. Target = achievable with investment. Gap = opportunity.',
      },
    ],
  },

  // ── Sheet 6: Tower Analysis ──
  {
    sheet_number: '6',
    sheet_name: 'Tower Analysis',
    purpose: '8-tower IT spend breakdown with benchmark comparison per tower',
    populate_with: 'N08 Vendor/Tower, N09 Benchmark Compare, tower definitions',
    output: 'Tower-level spend table with OPEX/CAPEX/Total, % Revenue, benchmark gaps, and opportunities',
    sections: [
      {
        id: 'tower_table',
        type: 'table',
        title: 'IT SPEND BY TOWER',
        columns: [
          { header: 'Tower', format: 'text' },
          { header: 'Typical Scope', format: 'text', width: 'wide' },
          { header: 'OPEX ($)', format: 'currency' },
          { header: 'CAPEX ($)', format: 'currency' },
          { header: 'D&A ($)', format: 'currency' },
          { header: 'Total ($)', format: 'currency' },
          { header: '% Rev', format: 'percentage' },
          { header: 'Target Mix', format: 'percentage' },
          { header: 'Proxy BM %Rev (Median)', format: 'percentage' },
          { header: 'Tower BM %Rev (Median)', format: 'percentage' },
          { header: 'Excess vs Proxy (pp)', format: 'percentage' },
          { header: 'Proportional Alloc $', format: 'currency' },
          { header: 'Tower BM Gap $', format: 'currency' },
          { header: 'Selected Opportunity', format: 'text', width: 'wide' },
        ],
        slots: [
          { token: '[tower_rows]', description: '8 tower rows from N08 Vendor/Tower analysis', source_field: 'tower_shares', requires_narrative: false },
          { token: '[tower_totals]', description: 'Totals row summing OPEX, CAPEX, D&A, Total, % Rev', requires_narrative: false },
        ],
        row_count: 10,
        instructions: 'Populate from N08 tower_shares. Proxy BM = industry median IT spend × typical tower mix. Tower BM = industry-specific tower benchmark if available. Selected Opportunity = specific action for towers over benchmark.',
      },
    ],
  },

  // ── Sheet 7: Vendor Mapping ──
  {
    sheet_number: '7',
    sheet_name: 'Vendor Mapping',
    purpose: 'Vendor-level spend detail mapped to towers',
    populate_with: 'N08 Vendor data, tower-classifier results',
    output: 'Complete vendor list with tower classification, spend breakdown, and source tracking',
    sections: [
      {
        id: 'vendor_table',
        type: 'table',
        title: 'VENDOR SPEND MAPPING',
        columns: [
          { header: 'Vendor', format: 'text' },
          { header: 'Mapped Spend Tower', format: 'text' },
          { header: 'Category', format: 'text' },
          { header: 'Original Expense Category', format: 'text' },
          { header: 'OPEX ($)', format: 'currency' },
          { header: 'CAPEX ($)', format: 'currency' },
          { header: 'D&A ($)', format: 'currency' },
          { header: 'Total ($)', format: 'currency' },
          { header: '% Rev', format: 'percentage' },
          { header: 'Source', format: 'text' },
        ],
        slots: [
          { token: '[vendor_rows]', description: 'All vendors sorted by total spend descending', requires_narrative: false },
          { token: '[vendor_totals]', description: 'Total row', requires_narrative: false },
        ],
        row_count: 167,
        instructions: 'List all vendors sorted by Total ($) descending. Include tower classification from tower-classifier (note confidence level in Source column). Flag "Needs Review" vendors.',
      },
    ],
  },

  // ── Sheet 7b: Tower Summary ──
  {
    sheet_number: '7b',
    sheet_name: 'Tower Summary',
    purpose: 'Aggregated tower view from vendor mapping with peer comparison',
    populate_with: 'Aggregated from Sheet 7 vendor data',
    output: 'Tower totals with benchmark overlay and gap analysis',
    sections: [
      {
        id: 'tower_summary_table',
        type: 'table',
        title: 'TOWER SUMMARY (AGGREGATED FROM VENDOR MAPPING)',
        columns: [
          { header: 'Tower', format: 'text' },
          { header: 'Typical Scope', format: 'text', width: 'wide' },
          { header: 'OPEX ($)', format: 'currency' },
          { header: 'CAPEX ($)', format: 'currency' },
          { header: 'D&A ($)', format: 'currency' },
          { header: 'Total ($)', format: 'currency' },
          { header: '% Rev', format: 'percentage' },
          { header: 'Target Mix', format: 'percentage' },
          { header: 'Proxy BM %Rev', format: 'percentage' },
          { header: 'Tower BM %Rev', format: 'percentage' },
          { header: 'Excess vs Proxy', format: 'percentage' },
          { header: 'Proportional Alloc $', format: 'currency' },
          { header: 'Tower BM Gap $', format: 'currency' },
          { header: 'Selected Opportunity', format: 'text' },
        ],
        slots: [
          { token: '[summary_rows]', description: '8 tower rows aggregated from vendor mapping', requires_narrative: false },
          { token: '[summary_totals]', description: 'Totals row', requires_narrative: false },
          { token: '[peer_median_row]', description: 'Peer Median row (italic) showing benchmark equivalent', requires_narrative: false },
          { token: '[gap_to_median_row]', description: 'Gap to Peer Median row (bold, red) showing total gap', requires_narrative: false },
        ],
        row_count: 12,
        instructions: 'This sheet should be auto-calculated from Sheet 7 vendor data. Peer Median and Gap rows use N09 benchmark data.',
      },
    ],
  },

  // ── Sheet 8: Appendix ──
  {
    sheet_number: '8',
    sheet_name: 'Appendix',
    purpose: 'Methodology, data sources, assumptions, and limitations',
    populate_with: 'Analysis metadata, benchmark sources, engine parameters',
    output: '6 reference sections for audit trail and methodology transparency',
    sections: [
      {
        id: 'data_sources',
        type: 'narrative',
        title: 'DATA SOURCES',
        slots: [
          { token: '[primary_sources]', description: 'Primary data: client-provided files, interviews, system extracts', requires_narrative: true },
          { token: '[benchmark_sources]', description: 'Benchmark data: Gartner ITKMD 2026, peer group definition', requires_narrative: true },
        ],
        instructions: 'List all data sources used. Note data quality issues, missing fields, and any interpolations.',
      },
      {
        id: 'key_financial_data',
        type: 'narrative',
        title: 'KEY FINANCIAL DATA',
        slots: [
          { token: '[financial_data]', description: 'Current and prior year financial inputs with verification status', requires_narrative: false },
        ],
        instructions: 'List all financial inputs used in the analysis with their source and whether they were verified.',
      },
      {
        id: 'benchmark_methodology',
        type: 'narrative',
        title: 'BENCHMARK METHODOLOGY',
        slots: [
          { token: '[bench_method]', description: 'Peer group construction, calculation methodology, validation approach', requires_narrative: true },
        ],
        instructions: 'Explain: (1) how the peer group was selected (industry, size band), (2) which Gartner metrics were used, (3) any adjustments made for company-specific factors.',
      },
      {
        id: 'key_assumptions',
        type: 'bullet_list',
        title: 'KEY ASSUMPTIONS',
        slots: [
          { token: '[assumptions]', description: '7 key assumptions underpinning the analysis', requires_narrative: true },
        ],
        instructions: 'List assumptions about: revenue trajectory, transformation timeline, cost reduction achievability, benchmark applicability, data completeness, outsourcing feasibility, automation maturity.',
      },
      {
        id: 'tower_methodology',
        type: 'narrative',
        title: 'IT TOWER MAPPING METHODOLOGY',
        slots: [
          { token: '[tower_method]', description: 'Description of 8-tower classification approach and tie-out verification', requires_narrative: true },
        ],
        instructions: 'Describe the Gartner-aligned 8-tower framework, the auto-classification approach (vendor name → keyword → fallback), and the tie-out to total IT spend.',
      },
      {
        id: 'limitations',
        type: 'bullet_list',
        title: 'LIMITATIONS & CAVEATS',
        slots: [
          { token: '[limitations]', description: '6 limitations and caveats for the analysis', requires_narrative: true },
        ],
        instructions: 'Common limitations: benchmark vintage, single-year snapshot, self-reported data, tower mapping confidence, projection uncertainty, scope exclusions.',
      },
    ],
  },
];

// ── Lookup Helpers ──

const sheetMap = new Map(SHEET_DEFINITIONS.map(s => [s.sheet_number, s]));
const sheetByName = new Map(SHEET_DEFINITIONS.map(s => [s.sheet_name.toLowerCase(), s]));

/** Get a sheet definition by number (e.g., '1', '7b') */
export function getSheetDefinition(sheetNumber: string): SheetDefinition | undefined {
  return sheetMap.get(sheetNumber);
}

/** Get a sheet definition by name */
export function getSheetByName(name: string): SheetDefinition | undefined {
  return sheetByName.get(name.toLowerCase());
}

/** Get all sheet definitions */
export function getAllSheetDefinitions(): SheetDefinition[] {
  return SHEET_DEFINITIONS;
}

/** Get the flattened list of all data slots that need to be populated */
export function getAllSlots(): { sheet: string; section: string; slot: SectionSlot }[] {
  const result: { sheet: string; section: string; slot: SectionSlot }[] = [];
  for (const sheet of SHEET_DEFINITIONS) {
    for (const section of sheet.sections) {
      for (const slot of section.slots) {
        result.push({ sheet: sheet.sheet_name, section: section.id, slot });
      }
    }
  }
  return result;
}

/** Get only the narrative slots that require generation */
export function getNarrativeSlots(): { sheet: string; section: string; slot: SectionSlot }[] {
  return getAllSlots().filter(s => s.slot.requires_narrative);
}

/** Get only the data slots that can be auto-populated */
export function getDataSlots(): { sheet: string; section: string; slot: SectionSlot }[] {
  return getAllSlots().filter(s => !s.slot.requires_narrative && s.slot.source_field);
}
