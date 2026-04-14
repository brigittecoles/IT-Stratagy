/**
 * Chain-of-Thought Report Generator
 *
 * Produces a complete reasoning trace showing:
 *   - Every input used
 *   - Every calculation performed
 *   - Every classification decision and its confidence
 *   - Every benchmark comparison and its context
 *   - Every opportunity identified and how it was sized
 *   - Every QA flag raised
 *
 * This is the "show your work" document — essential for audit trail,
 * client review, and building trust in the analysis.
 */

import type { AnalysisResults } from './report-generator';

// ── Chain-of-Thought Section ──

export interface CoTSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Engine node that produced this data */
  source_node: string;
  /** Ordered steps of reasoning */
  steps: CoTStep[];
}

export interface CoTStep {
  /** What this step does */
  description: string;
  /** The actual calculation or reasoning */
  detail: string;
  /** The result */
  result?: string;
  /** Confidence level */
  confidence?: 'high' | 'medium' | 'low';
  /** Any flags or caveats */
  flags?: string[];
}

export interface ChainOfThought {
  /** Report metadata */
  title: string;
  generated: string;
  company: string;
  industry: string;

  /** Ordered sections following the engine pipeline */
  sections: CoTSection[];

  /** Summary statistics */
  summary: {
    total_calculations: number;
    high_confidence_count: number;
    medium_confidence_count: number;
    low_confidence_count: number;
    flag_count: number;
    data_completeness: string;
  };
}

// ── Formatting ──

function fmt$(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtFull$(v: number): string {
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtPct(v: number, d = 2): string {
  return `${(v * 100).toFixed(d)}%`;
}

// ── Main Generator ──

export function generateChainOfThought(results: AnalysisResults): ChainOfThought {
  const sections: CoTSection[] = [];
  let totalCalcs = 0;
  let highConf = 0;
  let medConf = 0;
  let lowConf = 0;
  let flagCount = 0;

  function addStep(section: CoTSection, step: CoTStep) {
    section.steps.push(step);
    totalCalcs++;
    if (step.confidence === 'high') highConf++;
    else if (step.confidence === 'medium') medConf++;
    else if (step.confidence === 'low') lowConf++;
    if (step.flags) flagCount += step.flags.length;
  }

  // ═══════════════════════════════════════════════════════
  // SECTION 1: Input Validation & Data Quality
  // ═══════════════════════════════════════════════════════

  const inputSection: CoTSection = {
    id: 'input_validation',
    title: '1. Input Validation & Data Quality',
    source_node: 'N00 Load + N01 Readiness',
    steps: [],
  };

  addStep(inputSection, {
    description: 'Company identification',
    detail: `Company: ${results.company_name}, Industry: ${results.industry}`,
    result: 'Identified',
    confidence: 'high',
  });

  addStep(inputSection, {
    description: 'Revenue validation',
    detail: `Revenue = ${fmtFull$(results.revenue)}`,
    result: results.revenue > 0 ? 'Valid' : 'MISSING — critical field',
    confidence: results.revenue > 0 ? 'high' : 'low',
    flags: results.revenue <= 0 ? ['Revenue is zero or negative'] : undefined,
  });

  addStep(inputSection, {
    description: 'IT spend validation',
    detail: `Total IT Spend = ${fmtFull$(results.total_it_spend)} (OPEX: ${fmtFull$(results.it_opex_spend)} + CAPEX: ${fmtFull$(results.it_capex_spend)})`,
    result: results.it_opex_spend + results.it_capex_spend === results.total_it_spend
      ? 'OPEX + CAPEX = Total ✓'
      : `OPEX + CAPEX = ${fmtFull$(results.it_opex_spend + results.it_capex_spend)} ≠ Total ${fmtFull$(results.total_it_spend)} — delta: ${fmtFull$(results.total_it_spend - results.it_opex_spend - results.it_capex_spend)} (may include D&A)`,
    confidence: 'high',
  });

  addStep(inputSection, {
    description: 'Workforce data validation',
    detail: `Employee count: ${results.employee_count.toLocaleString()}, IT FTEs: ${results.it_fte_count}`,
    result: results.it_fte_count > 0 ? 'Present' : 'IT FTE count not provided',
    confidence: results.it_fte_count > 0 ? 'high' : 'medium',
    flags: results.it_fte_count === 0 ? ['IT FTE count missing — per-head metrics will be unavailable'] : undefined,
  });

  addStep(inputSection, {
    description: 'Prior year data check',
    detail: results.prior_revenue
      ? `Prior revenue: ${fmtFull$(results.prior_revenue)}, Prior IT spend: ${fmtFull$(results.prior_it_spend ?? 0)}`
      : 'No prior year data provided',
    result: results.prior_revenue ? 'YoY analysis enabled' : 'YoY analysis unavailable',
    confidence: results.prior_revenue ? 'high' : 'medium',
  });

  addStep(inputSection, {
    description: 'Transformation status',
    detail: `Status: ${results.transformation_status ?? 'Not specified'}${results.transformation_types ? `, Types: ${results.transformation_types.join(', ')}` : ''}${results.transformation_spend ? `, Estimated spend: ${fmtFull$(results.transformation_spend)}` : ''}`,
    result: results.transformation_status === 'Yes' ? 'Active transformation — impacts gap interpretation' : 'No transformation flagged',
    confidence: results.transformation_status ? 'high' : 'low',
  });

  addStep(inputSection, {
    description: 'Qualification level determination',
    detail: `Based on data completeness: ${results.qualification_level}`,
    result: results.qualification_level,
    confidence: 'high',
  });

  sections.push(inputSection);

  // ═══════════════════════════════════════════════════════
  // SECTION 2: Benchmark Selection & Comparison
  // ═══════════════════════════════════════════════════════

  const benchSection: CoTSection = {
    id: 'benchmark',
    title: '2. Benchmark Selection & Comparison',
    source_node: 'N02 Benchmark Select + N09 Benchmark Compare',
    steps: [],
  };

  addStep(benchSection, {
    description: 'Industry benchmark selection',
    detail: `Industry: ${results.industry} → Benchmark family: ${results.benchmark_industry}`,
    result: `Selected Gartner ITKMD 2026 — ${results.benchmark_industry}`,
    confidence: 'high',
  });

  addStep(benchSection, {
    description: 'IT Spend % Revenue benchmark lookup',
    detail: `Median: ${fmtPct(results.benchmark_median)}${results.benchmark_p25 ? `, P25: ${fmtPct(results.benchmark_p25)}` : ''}${results.benchmark_p75 ? `, P75: ${fmtPct(results.benchmark_p75)}` : ''}`,
    result: `Company actual: ${fmtPct(results.it_spend_pct_revenue)}`,
    confidence: 'high',
  });

  const medianDollars = results.revenue * results.benchmark_median;
  const gapDollars = results.total_it_spend - medianDollars;
  const gapPct = results.it_spend_pct_revenue - results.benchmark_median;

  addStep(benchSection, {
    description: 'Gap to peer median calculation',
    detail: [
      `Company IT Spend % Revenue = ${fmtFull$(results.total_it_spend)} / ${fmtFull$(results.revenue)} = ${fmtPct(results.it_spend_pct_revenue)}`,
      `Peer Median = ${fmtPct(results.benchmark_median)}`,
      `Gap = ${fmtPct(results.it_spend_pct_revenue)} - ${fmtPct(results.benchmark_median)} = ${(gapPct * 100).toFixed(2)}pp`,
      `Dollar equivalent: ${fmtFull$(results.total_it_spend)} - (${fmtFull$(results.revenue)} × ${fmtPct(results.benchmark_median)}) = ${fmtFull$(results.total_it_spend)} - ${fmtFull$(medianDollars)} = ${fmt$(gapDollars)}`,
    ].join('\n'),
    result: gapDollars > 0
      ? `Above median by ${fmt$(gapDollars)} (${(gapPct * 100).toFixed(2)}pp)`
      : `Below median by ${fmt$(Math.abs(gapDollars))} (${(Math.abs(gapPct) * 100).toFixed(2)}pp)`,
    confidence: 'high',
  });

  if (results.benchmark_p75 !== undefined) {
    const position = results.it_spend_pct_revenue <= results.benchmark_p25!
      ? 'Below P25 (top quartile efficiency)'
      : results.it_spend_pct_revenue <= results.benchmark_median
        ? 'Between P25 and Median'
        : results.it_spend_pct_revenue <= results.benchmark_p75
          ? 'Between Median and P75'
          : 'Above P75 (highest spend quartile)';

    addStep(benchSection, {
      description: 'Distribution position determination',
      detail: `P25=${fmtPct(results.benchmark_p25!)}, Median=${fmtPct(results.benchmark_median)}, P75=${fmtPct(results.benchmark_p75)}, Actual=${fmtPct(results.it_spend_pct_revenue)}`,
      result: position,
      confidence: 'high',
    });
  }

  sections.push(benchSection);

  // ═══════════════════════════════════════════════════════
  // SECTION 3: Core KPI Calculations
  // ═══════════════════════════════════════════════════════

  const kpiSection: CoTSection = {
    id: 'core_kpis',
    title: '3. Core KPI Calculations',
    source_node: 'N04 Core KPI',
    steps: [],
  };

  addStep(kpiSection, {
    description: 'IT Spend % of Revenue',
    detail: `${fmtFull$(results.total_it_spend)} / ${fmtFull$(results.revenue)}`,
    result: fmtPct(results.it_spend_pct_revenue),
    confidence: 'high',
  });

  addStep(kpiSection, {
    description: 'OPEX % of Revenue',
    detail: `${fmtFull$(results.it_opex_spend)} / ${fmtFull$(results.revenue)}`,
    result: fmtPct(results.it_opex_spend / results.revenue),
    confidence: 'high',
  });

  addStep(kpiSection, {
    description: 'CAPEX % of Revenue',
    detail: `${fmtFull$(results.it_capex_spend)} / ${fmtFull$(results.revenue)}`,
    result: fmtPct(results.it_capex_spend / results.revenue),
    confidence: 'high',
  });

  addStep(kpiSection, {
    description: 'CAPEX % of Total IT Spend',
    detail: `${fmtFull$(results.it_capex_spend)} / ${fmtFull$(results.total_it_spend)}`,
    result: fmtPct(results.it_capex_spend / results.total_it_spend),
    confidence: 'high',
  });

  if (results.it_fte_count > 0) {
    addStep(kpiSection, {
      description: 'IT Spend per IT FTE',
      detail: `${fmtFull$(results.total_it_spend)} / ${results.it_fte_count}`,
      result: fmt$(results.total_it_spend / results.it_fte_count),
      confidence: 'high',
    });

    addStep(kpiSection, {
      description: 'IT Spend per Employee',
      detail: `${fmtFull$(results.total_it_spend)} / ${results.employee_count.toLocaleString()}`,
      result: fmt$(results.total_it_spend / results.employee_count),
      confidence: 'high',
    });

    addStep(kpiSection, {
      description: 'IT FTE Ratio',
      detail: `${results.it_fte_count} / ${results.employee_count.toLocaleString()} × 100`,
      result: `${((results.it_fte_count / results.employee_count) * 100).toFixed(1)} IT FTEs per 100 employees`,
      confidence: 'high',
    });
  }

  sections.push(kpiSection);

  // ═══════════════════════════════════════════════════════
  // SECTION 4: Year-over-Year Analysis
  // ═══════════════════════════════════════════════════════

  if (results.prior_revenue && results.prior_it_spend) {
    const yoySection: CoTSection = {
      id: 'yoy_analysis',
      title: '4. Year-over-Year Analysis',
      source_node: 'N05 YoY',
      steps: [],
    };

    const priorPctRev = results.prior_it_spend / results.prior_revenue;
    const spendDelta = results.total_it_spend - results.prior_it_spend;
    const revDelta = results.revenue - results.prior_revenue;

    addStep(yoySection, {
      description: 'IT Spend change',
      detail: `${fmtFull$(results.total_it_spend)} - ${fmtFull$(results.prior_it_spend)} = ${fmt$(spendDelta)}`,
      result: `${spendDelta >= 0 ? '+' : ''}${((spendDelta / results.prior_it_spend) * 100).toFixed(1)}%`,
      confidence: 'high',
    });

    addStep(yoySection, {
      description: 'Revenue change',
      detail: `${fmtFull$(results.revenue)} - ${fmtFull$(results.prior_revenue)} = ${fmt$(revDelta)}`,
      result: `${revDelta >= 0 ? '+' : ''}${((revDelta / results.prior_revenue) * 100).toFixed(1)}%`,
      confidence: 'high',
    });

    addStep(yoySection, {
      description: 'IT % Revenue change',
      detail: `Current: ${fmtPct(results.it_spend_pct_revenue)} - Prior: ${fmtPct(priorPctRev)}`,
      result: `${((results.it_spend_pct_revenue - priorPctRev) * 10000).toFixed(0)}bps change`,
      confidence: 'high',
    });

    addStep(yoySection, {
      description: 'Change decomposition: price vs. volume',
      detail: [
        `If revenue had stayed flat: IT % Rev would be ${fmtPct(results.total_it_spend / results.prior_revenue)}`,
        `Revenue effect: ${fmtPct(results.total_it_spend / results.prior_revenue)} - ${fmtPct(results.it_spend_pct_revenue)} = ${((results.total_it_spend / results.prior_revenue - results.it_spend_pct_revenue) * 10000).toFixed(0)}bps`,
        `Spend effect: remaining basis points`,
      ].join('\n'),
      result: 'Decomposed',
      confidence: 'medium',
    });

    sections.push(yoySection);
  }

  // ═══════════════════════════════════════════════════════
  // SECTION 5: Tower Classification
  // ═══════════════════════════════════════════════════════

  if (results.tower_shares && results.tower_shares.length > 0) {
    const towerSection: CoTSection = {
      id: 'tower_classification',
      title: '5. Tower Classification & Analysis',
      source_node: 'N08 Vendor',
      steps: [],
    };

    addStep(towerSection, {
      description: 'Tower classification method',
      detail: 'Gartner-aligned 8-tower framework. Vendors classified by: (1) known vendor name match, (2) keyword scoring on category/description, (3) fallback to Unassigned.',
      result: `${results.tower_shares.length} towers with spend data`,
      confidence: 'high',
    });

    for (const tower of results.tower_shares) {
      addStep(towerSection, {
        description: `${tower.tower} spend calculation`,
        detail: `Total: ${fmtFull$(tower.spend)} = ${fmtPct(tower.share)} of IT spend = ${fmtPct(tower.spend / results.revenue)} of revenue`,
        result: `${fmtPct(tower.share)} share`,
        confidence: 'medium',
      });
    }

    if (results.top_10_concentration !== undefined) {
      addStep(towerSection, {
        description: 'Top-10 vendor concentration',
        detail: `Top 10 vendors account for ${fmtPct(results.top_10_concentration)} of total vendor spend`,
        result: results.top_10_concentration > 0.80 ? 'High concentration — consolidation risk' : results.top_10_concentration > 0.60 ? 'Moderate concentration' : 'Well-distributed',
        confidence: 'high',
      });
    }

    sections.push(towerSection);
  }

  // ═══════════════════════════════════════════════════════
  // SECTION 6: Gap Attribution
  // ═══════════════════════════════════════════════════════

  if (results.gap_components && results.gap_components.length > 0) {
    const gapSection: CoTSection = {
      id: 'gap_attribution',
      title: '6. Gap Attribution & Decomposition',
      source_node: 'N10 Gap Attribution',
      steps: [],
    };

    addStep(gapSection, {
      description: 'Total gap to peer median',
      detail: `${fmtFull$(results.total_it_spend)} - ${fmtFull$(medianDollars)} = ${fmt$(gapDollars)}`,
      result: fmt$(gapDollars),
      confidence: 'high',
    });

    for (const gap of results.gap_components) {
      addStep(gapSection, {
        description: `${gap.name} (${gap.nature})`,
        detail: `${fmtFull$(gap.amount)} = ${fmtPct(gap.pct_of_gap)} of total gap. Action: ${gap.action}`,
        result: `${gap.nature}: ${fmt$(gap.amount)}`,
        confidence: gap.nature === 'Temporary' ? 'high' : gap.nature === 'Addressable' ? 'medium' : 'medium',
      });
    }

    const byNature = {
      Temporary: results.gap_components.filter(g => g.nature === 'Temporary').reduce((s, g) => s + g.amount, 0),
      Addressable: results.gap_components.filter(g => g.nature === 'Addressable').reduce((s, g) => s + g.amount, 0),
      Structural: results.gap_components.filter(g => g.nature === 'Structural').reduce((s, g) => s + g.amount, 0),
    };

    addStep(gapSection, {
      description: 'Gap nature summary',
      detail: [
        `Temporary: ${fmt$(byNature.Temporary)} (${fmtPct(byNature.Temporary / gapDollars)}) — will normalize without action`,
        `Addressable: ${fmt$(byNature.Addressable)} (${fmtPct(byNature.Addressable / gapDollars)}) — actionable with investment`,
        `Structural: ${fmt$(byNature.Structural)} (${fmtPct(byNature.Structural / gapDollars)}) — inherent to business model`,
      ].join('\n'),
      result: 'Decomposed',
      confidence: 'medium',
    });

    sections.push(gapSection);
  }

  // ═══════════════════════════════════════════════════════
  // SECTION 7: Opportunities
  // ═══════════════════════════════════════════════════════

  if (results.opportunities && results.opportunities.length > 0) {
    const oppSection: CoTSection = {
      id: 'opportunities',
      title: '7. Opportunity Identification & Sizing',
      source_node: 'N11 Opportunity',
      steps: [],
    };

    for (const opp of results.opportunities) {
      addStep(oppSection, {
        description: `${opp.name}`,
        detail: [
          `Annual value: ${fmt$(opp.annual_value_low)}-${fmt$(opp.annual_value_high)}`,
          `Timeline: ${opp.timeline}`,
          `Complexity: ${opp.complexity}`,
          `Status: ${opp.status}`,
          `Description: ${opp.description}`,
        ].join('\n'),
        result: `${fmt$(opp.annual_value_low)}-${fmt$(opp.annual_value_high)} annually`,
        confidence: opp.complexity === 'Low' ? 'high' : opp.complexity === 'Medium' ? 'medium' : 'low',
      });
    }

    addStep(oppSection, {
      description: 'Total opportunity sizing',
      detail: `Sum of all opportunity ranges: ${fmt$(results.total_opportunity_low ?? 0)}-${fmt$(results.total_opportunity_high ?? 0)}`,
      result: `${fmt$(results.total_opportunity_low ?? 0)}-${fmt$(results.total_opportunity_high ?? 0)} total annual value`,
      confidence: 'medium',
      flags: ['Opportunity ranges are estimates based on benchmark gaps and industry patterns. Actual results will vary based on execution.'],
    });

    sections.push(oppSection);
  }

  // ═══════════════════════════════════════════════════════
  // SECTION 8: QA & Validation
  // ═══════════════════════════════════════════════════════

  const qaSection: CoTSection = {
    id: 'qa_validation',
    title: '8. Quality Assurance & Validation',
    source_node: 'N12 QA',
    steps: [],
  };

  addStep(qaSection, {
    description: 'Spend arithmetic check',
    detail: `OPEX (${fmtFull$(results.it_opex_spend)}) + CAPEX (${fmtFull$(results.it_capex_spend)}) = ${fmtFull$(results.it_opex_spend + results.it_capex_spend)}`,
    result: results.it_opex_spend + results.it_capex_spend === results.total_it_spend ? 'PASS ✓' : `DELTA: ${fmtFull$(results.total_it_spend - results.it_opex_spend - results.it_capex_spend)} (may include D&A)`,
    confidence: 'high',
  });

  addStep(qaSection, {
    description: 'IT spend ratio reasonableness',
    detail: `IT % Revenue = ${fmtPct(results.it_spend_pct_revenue)}. Typical range: 1-10% depending on industry.`,
    result: results.it_spend_pct_revenue > 0.01 && results.it_spend_pct_revenue < 0.15 ? 'Within expected range ✓' : 'OUTSIDE TYPICAL RANGE — verify inputs',
    confidence: results.it_spend_pct_revenue > 0.01 && results.it_spend_pct_revenue < 0.15 ? 'high' : 'low',
    flags: results.it_spend_pct_revenue > 0.10 ? ['IT spend >10% of revenue — unusually high, verify data'] : undefined,
  });

  if (results.it_fte_count > 0) {
    const fteRatio = results.it_fte_count / results.employee_count;
    addStep(qaSection, {
      description: 'IT FTE ratio reasonableness',
      detail: `${results.it_fte_count} IT FTEs / ${results.employee_count.toLocaleString()} employees = ${(fteRatio * 100).toFixed(1)}%. Typical: 2-8%.`,
      result: fteRatio > 0.01 && fteRatio < 0.15 ? 'Within expected range ✓' : 'OUTSIDE TYPICAL RANGE — verify IT FTE count',
      confidence: fteRatio > 0.01 && fteRatio < 0.15 ? 'high' : 'low',
    });
  }

  if (results.qa_flags && results.qa_flags.length > 0) {
    for (const flag of results.qa_flags) {
      addStep(qaSection, {
        description: 'Engine QA flag',
        detail: flag,
        result: 'FLAGGED',
        confidence: 'medium',
        flags: [flag],
      });
    }
  }

  sections.push(qaSection);

  // ── Summary ──

  const dataFields = [
    results.revenue > 0, results.total_it_spend > 0,
    results.it_opex_spend > 0, results.it_capex_spend > 0,
    results.employee_count > 0, results.it_fte_count > 0,
    !!results.prior_revenue, !!results.prior_it_spend,
    !!results.transformation_status,
    (results.tower_shares?.length ?? 0) > 0,
    (results.opportunities?.length ?? 0) > 0,
    (results.gap_components?.length ?? 0) > 0,
  ];
  const completeness = dataFields.filter(Boolean).length / dataFields.length;

  return {
    title: `Chain of Thought: ${results.company_name} IT Spend Analysis`,
    generated: new Date().toISOString(),
    company: results.company_name,
    industry: results.industry,
    sections,
    summary: {
      total_calculations: totalCalcs,
      high_confidence_count: highConf,
      medium_confidence_count: medConf,
      low_confidence_count: lowConf,
      flag_count: flagCount,
      data_completeness: fmtPct(completeness, 0),
    },
  };
}

/**
 * Format the chain-of-thought as markdown for export.
 */
export function formatChainOfThoughtMarkdown(cot: ChainOfThought): string {
  const lines: string[] = [];

  lines.push(`# ${cot.title}`);
  lines.push(`**Generated:** ${cot.generated}`);
  lines.push(`**Company:** ${cot.company} | **Industry:** ${cot.industry}`);
  lines.push('');

  lines.push('## Summary');
  lines.push(`- **Total calculations:** ${cot.summary.total_calculations}`);
  lines.push(`- **High confidence:** ${cot.summary.high_confidence_count}`);
  lines.push(`- **Medium confidence:** ${cot.summary.medium_confidence_count}`);
  lines.push(`- **Low confidence:** ${cot.summary.low_confidence_count}`);
  lines.push(`- **Flags raised:** ${cot.summary.flag_count}`);
  lines.push(`- **Data completeness:** ${cot.summary.data_completeness}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const section of cot.sections) {
    lines.push(`## ${section.title}`);
    lines.push(`*Source: ${section.source_node}*`);
    lines.push('');

    for (const step of section.steps) {
      const confBadge = step.confidence === 'high' ? '🟢' : step.confidence === 'medium' ? '🟡' : '🔴';
      lines.push(`### ${confBadge} ${step.description}`);
      lines.push('');

      // Format multi-line detail as code block if it contains newlines
      if (step.detail.includes('\n')) {
        lines.push('```');
        lines.push(step.detail);
        lines.push('```');
      } else {
        lines.push(`> ${step.detail}`);
      }

      if (step.result) {
        lines.push('');
        lines.push(`**Result:** ${step.result}`);
      }

      if (step.flags && step.flags.length > 0) {
        lines.push('');
        for (const flag of step.flags) {
          lines.push(`> ⚠️ **Flag:** ${flag}`);
        }
      }

      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
