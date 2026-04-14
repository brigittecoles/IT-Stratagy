'use server';

import { v4 as uuidv4 } from 'uuid';
import { redirect } from 'next/navigation';
import {
  createAnalysis,
  getAnalysis,
  updateAnalysis,
} from '@/lib/store';
import { runAnalysisPipeline } from '@/lib/engine/pipeline';
import { selectBenchmarkFamily } from '@/lib/engine/n02-benchmark-select';
import { determineQualification } from '@/lib/resolver/qualification';
import type { CompanyProfile, FiscalYear, CanonicalAnalysis } from '@/lib/schema/validation';
import type { EngineResult } from '@/lib/engine/types';

// ── Results cache (server-side) ──
const resultsCache = new Map<string, EngineResult>();

// ── Create a new analysis and redirect to form ──
export async function createNewAnalysis(
  mode: 'form' | 'wizard' | 'file-drop',
  targetLevel?: string,
) {
  const analysis = createAnalysis({
    target_diagnostic_level: targetLevel,
  });
  redirect(`/analysis/${analysis.id}/${mode}`);
}

// ── Get analysis controls (for reading target level) ──
export async function getAnalysisControls(analysisId: string) {
  const analysis = getAnalysis(analysisId);
  if (!analysis) return null;
  return analysis.controls;
}

// ── Save intake data from form ──
export async function saveIntakeData(data: {
  analysisId: string;
  company: Partial<CompanyProfile>;
  currentYear: Partial<FiscalYear>;
  priorYear?: Partial<FiscalYear>;
  workforce: Partial<{
    employee_count: number | null;
    it_fte_count: number | null;
    contractor_count: number | null;
    contractor_spend: number | null;
    outsourced_spend: number | null;
    internal_labor_spend: number | null;
  }>;
  transformation: Partial<{
    transformation_status: 'Yes' | 'No' | 'Unsure' | null;
    transformation_type: string[] | null;
    transformation_spend_estimate: number | null;
    transformation_rolloff_timing: string | null;
    roadmap_available: boolean | null;
  }>;
}) {
  const { analysisId, company, currentYear, priorYear, workforce, transformation } = data;

  // Build the current fiscal year record
  const currentFY: FiscalYear = {
    fiscal_year_label: 'Current Fiscal Year',
    fiscal_year_order: 1,
    revenue: currentYear.revenue ?? null,
    total_it_spend: currentYear.total_it_spend ?? null,
    it_opex_spend: currentYear.it_opex_spend ?? null,
    it_capex_spend: currentYear.it_capex_spend ?? null,
    it_da_spend: currentYear.it_da_spend ?? null,
    employee_count: workforce.employee_count ?? null,
    it_fte_count: workforce.it_fte_count ?? null,
    contractor_count: workforce.contractor_count ?? null,
    contractor_spend: workforce.contractor_spend ?? null,
    outsourced_spend: workforce.outsourced_spend ?? null,
    internal_labor_spend: workforce.internal_labor_spend ?? null,
    transformation_status: transformation.transformation_status ?? null,
    transformation_type: (transformation.transformation_type as FiscalYear['transformation_type']) ?? null,
    transformation_spend_estimate: transformation.transformation_spend_estimate ?? null,
    transformation_rolloff_timing: transformation.transformation_rolloff_timing ?? null,
    roadmap_available: transformation.roadmap_available ?? null,
  };

  const fiscalYears: FiscalYear[] = [currentFY];

  // Add prior year if provided
  if (priorYear && (priorYear.revenue || priorYear.total_it_spend)) {
    fiscalYears.push({
      fiscal_year_label: 'Last Fiscal Year',
      fiscal_year_order: 2,
      revenue: priorYear.revenue ?? null,
      total_it_spend: priorYear.total_it_spend ?? null,
      it_opex_spend: priorYear.it_opex_spend ?? null,
      it_capex_spend: priorYear.it_capex_spend ?? null,
      it_da_spend: priorYear.it_da_spend ?? null,
      employee_count: null,
      it_fte_count: null,
      contractor_count: null,
      contractor_spend: null,
      outsourced_spend: null,
      internal_labor_spend: null,
      transformation_status: null,
      transformation_type: null,
      transformation_spend_estimate: null,
      transformation_rolloff_timing: null,
      roadmap_available: null,
    });
  }

  // Build the company profile
  const companyProfile: CompanyProfile = {
    company_name: company.company_name ?? '',
    industry_gics_group: company.industry_gics_group ?? 'Information Technology',
    business_model: company.business_model ?? null,
    regulatory_complexity: company.regulatory_complexity ?? null,
    operating_complexity: company.operating_complexity ?? null,
    pricing_premium_complexity: company.pricing_premium_complexity ?? null,
    complexity_notes: company.complexity_notes ?? null,
  };

  updateAnalysis(analysisId, {
    company: companyProfile,
    fiscal_years: fiscalYears,
  });

  redirect(`/analysis/${analysisId}/review`);
}

// ── Get analysis data for review page ──
export async function getAnalysisForReview(analysisId: string) {
  const analysis = getAnalysis(analysisId);
  if (!analysis) return null;

  const qualification = determineQualification(analysis);
  return { analysis, qualification };
}

// ── Run the full analysis pipeline ──
export async function runFullAnalysis(analysisId: string): Promise<{ success: boolean; error?: string }> {
  const analysis = getAnalysis(analysisId);
  if (!analysis) return { success: false, error: 'Analysis not found' };

  try {
    // Select benchmark family
    const benchmark = selectBenchmarkFamily(
      analysis.company.industry_gics_group,
      analysis.company.business_model
    );

    // Run the pipeline
    const result = await runAnalysisPipeline(
      analysis,
      benchmark.family ?? undefined,
      benchmark.metrics.length > 0 ? benchmark.metrics : undefined,
    );

    // Enhance narrative with AI if possible
    const enhancedResult = await enhanceWithAI(result, analysis);

    // Cache results
    resultsCache.set(analysisId, enhancedResult);

    // Update analysis status
    updateAnalysis(analysisId, {
      controls: {
        ...analysis.controls,
        proceed_status: 'complete',
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Pipeline error:', err);
    return { success: false, error: String(err) };
  }
}

// ── Get results ──
export async function getAnalysisResults(analysisId: string): Promise<EngineResult | null> {
  return resultsCache.get(analysisId) ?? null;
}

// ── AI-enhanced narrative generation ──
async function enhanceWithAI(result: EngineResult, analysis: CanonicalAnalysis): Promise<EngineResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('No ANTHROPIC_API_KEY set — using template narrative');
    return result;
  }

  try {
    const currentYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Current Fiscal Year');
    const kpiSummary = Object.entries(result.core_kpis)
      .filter(([, m]) => !m.suppressed)
      .map(([k, m]) => `${m.name}: ${m.formatted}`)
      .join(', ');

    const gapSummary = result.benchmark?.raw_gaps
      .map(g => `${g.metric_name}: ${(g.gap_vs_median_pct * 100).toFixed(1)}pp gap ($${(g.gap_vs_median_dollars / 1e6).toFixed(1)}M)`)
      .join('; ') ?? 'No benchmark comparison available';

    const oppSummary = result.opportunities
      .map(o => `${o.module_name}: $${(o.base_case / 1e6).toFixed(1)}M base case (${o.confidence} confidence)`)
      .join('; ');

    const prompt = `You are a senior IT strategy consultant writing an executive diagnostic report.

Company: ${analysis.company.company_name}
Industry: ${analysis.company.industry_gics_group}
Diagnostic Level: ${result.qualified_level}
Revenue: ${currentYear?.revenue ? `$${(currentYear.revenue / 1e6).toFixed(0)}M` : 'Unknown'}
Total IT Spend: ${currentYear?.total_it_spend ? `$${(currentYear.total_it_spend / 1e6).toFixed(1)}M` : 'Unknown'}

Key Metrics: ${kpiSummary}
Benchmark Gaps: ${gapSummary}
Opportunities: ${oppSummary}
Transformation Active: ${currentYear?.transformation_status ?? 'Unknown'}
Overall Confidence: ${result.qa.overall_confidence}

Write a concise but insightful analysis with these sections:
1. EXECUTIVE_SUMMARY: 2-3 sentences capturing the headline story
2. KEY_FINDINGS: 4-6 bullet points (most important findings)
3. WHY_IT_MATTERS: 2-3 sentences explaining business impact
4. CAVEATS: 2-4 bullet points about data limitations

Use specific numbers from the data. Be direct and actionable — this is for a CIO/CFO audience.
Write in the style of a top-tier management consulting firm.
Format each section header on its own line like "EXECUTIVE_SUMMARY:" followed by the content.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return result;
    }

    const aiResult = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };
    const text = aiResult.content?.[0]?.text ?? '';

    // Parse sections
    const execMatch = text.match(/EXECUTIVE_SUMMARY:\s*([\s\S]*?)(?=KEY_FINDINGS:|$)/);
    const findingsMatch = text.match(/KEY_FINDINGS:\s*([\s\S]*?)(?=WHY_IT_MATTERS:|$)/);
    const whyMatch = text.match(/WHY_IT_MATTERS:\s*([\s\S]*?)(?=CAVEATS:|$)/);
    const caveatsMatch = text.match(/CAVEATS:\s*([\s\S]*?)$/);

    const parseBullets = (text: string): string[] =>
      text.split('\n')
        .map(l => l.replace(/^[-*•]\s*/, '').trim())
        .filter(l => l.length > 0);

    if (execMatch || findingsMatch) {
      return {
        ...result,
        narrative: {
          executive_summary: execMatch?.[1]?.trim() ?? result.narrative.executive_summary,
          key_findings: findingsMatch ? parseBullets(findingsMatch[1]) : result.narrative.key_findings,
          why_it_matters: whyMatch?.[1]?.trim() ?? result.narrative.why_it_matters,
          caveats: caveatsMatch ? parseBullets(caveatsMatch[1]) : result.narrative.caveats,
          confidence_statement: result.narrative.confidence_statement,
        },
      };
    }
  } catch (err) {
    console.error('AI enhancement failed:', err);
  }

  return result;
}

// ── Bridge: EngineResult → AnalysisResults for report module ──

function bridgeToReportData(
  engineResult: EngineResult,
  analysis: CanonicalAnalysis,
): import('@/lib/report').AnalysisResults {
  const fy = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Current Fiscal Year') ?? analysis.fiscal_years[0];
  const priorFy = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Last Fiscal Year');

  return {
    company_name: analysis.company.company_name,
    industry: analysis.company.industry_gics_group,
    fiscal_year_label: fy?.fiscal_year_label ?? 'Current Fiscal Year',
    qualification_level: engineResult.qualified_level,

    revenue: fy?.revenue ?? 0,
    total_it_spend: fy?.total_it_spend ?? 0,
    it_opex_spend: fy?.it_opex_spend ?? 0,
    it_capex_spend: fy?.it_capex_spend ?? 0,
    employee_count: fy?.employee_count ?? 0,
    it_fte_count: fy?.it_fte_count ?? 0,

    prior_revenue: priorFy?.revenue ?? undefined,
    prior_it_spend: priorFy?.total_it_spend ?? undefined,
    prior_it_opex: priorFy?.it_opex_spend ?? undefined,
    prior_it_capex: priorFy?.it_capex_spend ?? undefined,

    it_spend_pct_revenue: engineResult.core_kpis.it_spend_pct_revenue.value,
    it_opex_pct_revenue: engineResult.core_kpis.opex_pct_revenue.suppressed ? undefined : engineResult.core_kpis.opex_pct_revenue.value,
    it_capex_pct_revenue: engineResult.core_kpis.capex_pct_revenue.suppressed ? undefined : engineResult.core_kpis.capex_pct_revenue.value,
    it_spend_per_employee: (fy?.employee_count && fy?.total_it_spend) ? fy.total_it_spend / fy.employee_count : undefined,
    it_fte_ratio: (fy?.it_fte_count && fy?.employee_count) ? fy.it_fte_count / fy.employee_count : undefined,

    benchmark_industry: engineResult.benchmark?.family.industry_gics_group ?? analysis.company.industry_gics_group,
    benchmark_median: engineResult.benchmark?.raw_gaps?.[0]?.benchmark_median ?? 0,
    benchmark_p25: undefined, // Not in BenchmarkGap type
    benchmark_p75: engineResult.benchmark?.raw_gaps?.[0]?.benchmark_p75,
    benchmark_gap_pct: engineResult.benchmark?.raw_gaps?.[0]?.gap_vs_median_pct,
    benchmark_gap_dollars: engineResult.benchmark?.raw_gaps?.[0]?.gap_vs_median_dollars,

    yoy_it_spend_change_pct: engineResult.yoy?.it_spend_change.delta_pct,
    yoy_it_spend_change_dollars: engineResult.yoy?.it_spend_change.delta_dollars,
    yoy_revenue_change_pct: engineResult.yoy?.revenue_change.delta_pct,

    transformation_status: fy?.transformation_status ?? undefined,
    transformation_types: (fy?.transformation_type as string[] | null) ?? undefined,
    transformation_spend: fy?.transformation_spend_estimate ?? undefined,

    opportunities: engineResult.opportunities.map(o => ({
      name: o.module_name,
      annual_value_low: o.low_case,
      annual_value_high: o.high_case,
      timeline: '12-24 months',
      complexity: o.confidence === 'High' ? 'Low' : o.confidence === 'Medium' ? 'Medium' : 'High',
      status: 'Identified',
      description: o.assumptions.join('. '),
    })),
    total_opportunity_low: engineResult.opportunities.reduce((s, o) => s + o.low_case, 0),
    total_opportunity_high: engineResult.opportunities.reduce((s, o) => s + o.high_case, 0),

    gap_components: engineResult.gap_attribution ? [
      {
        name: 'Temporary Transformation',
        amount: engineResult.gap_attribution.temporary_transformation.dollars,
        pct_of_gap: engineResult.gap_attribution.temporary_transformation.pct,
        nature: 'Temporary' as const,
        action: 'Monitor and plan for rolloff',
      },
      {
        name: 'Addressable Inefficiency',
        amount: engineResult.gap_attribution.addressable_inefficiency.dollars,
        pct_of_gap: engineResult.gap_attribution.addressable_inefficiency.pct,
        nature: 'Addressable' as const,
        action: 'Target for optimization',
      },
      {
        name: 'Structural Premium',
        amount: engineResult.gap_attribution.structural_premium.dollars,
        pct_of_gap: engineResult.gap_attribution.structural_premium.pct,
        nature: 'Structural' as const,
        action: 'Accept or restructure',
      },
    ] : undefined,

    qa_flags: engineResult.qa.checks.filter(c => !c.passed).map(c => `${c.check_name}: ${c.message}`),
    generated_narrative: engineResult.narrative.executive_summary,
  };
}

// ── Export: Executive Summary Markdown ──
export async function exportExecutiveSummary(analysisId: string): Promise<string | null> {
  const engineResult = resultsCache.get(analysisId);
  const analysis = getAnalysis(analysisId);
  if (!engineResult || !analysis) return null;

  const fy = analysis.fiscal_years[0];
  const gaps = engineResult.benchmark?.raw_gaps ?? [];
  const opps = engineResult.opportunities;

  const lines: string[] = [];
  lines.push(`# IT Strategy Diagnostic — Executive Summary`);
  lines.push(`**${analysis.company.company_name}** | ${analysis.company.industry_gics_group} | ${engineResult.qualified_level}`);
  lines.push(`*Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push(engineResult.narrative.executive_summary);
  lines.push('');

  // Key Metrics
  lines.push('## Key Metrics');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  Object.values(engineResult.core_kpis)
    .filter(k => !k.suppressed)
    .forEach(k => lines.push(`| ${k.name} | ${k.formatted} |`));
  if (fy?.revenue) lines.push(`| Revenue | $${(fy.revenue / 1e6).toFixed(0)}M |`);
  if (fy?.total_it_spend) lines.push(`| Total IT Spend | $${(fy.total_it_spend / 1e6).toFixed(1)}M |`);
  if (fy?.employee_count) lines.push(`| Employees | ${fy.employee_count.toLocaleString()} |`);
  if (fy?.it_fte_count) lines.push(`| IT FTEs | ${fy.it_fte_count} |`);
  lines.push('');

  // YoY
  if (engineResult.yoy) {
    lines.push('## Year-over-Year Trends');
    lines.push(`- IT Spend Change: ${engineResult.yoy.it_spend_change.formatted_delta}`);
    lines.push(`- Revenue Change: ${engineResult.yoy.revenue_change.formatted_delta}`);
    lines.push(`- Comparison: ${engineResult.yoy.spend_vs_revenue_growth}`);
    lines.push('');
  }

  // Benchmark Gaps
  if (gaps.length > 0) {
    lines.push('## Benchmark Comparison');
    lines.push(`*Industry: ${engineResult.benchmark?.family.industry_gics_group}*`);
    lines.push('');
    lines.push('| Metric | Actual | Median | Gap |');
    lines.push('|--------|--------|--------|-----|');
    gaps.forEach(g => {
      lines.push(`| ${g.metric_name.replace(/_/g, ' ')} | ${(g.actual_pct * 100).toFixed(1)}% | ${(g.benchmark_median * 100).toFixed(1)}% | ${g.gap_vs_median_pct > 0 ? '+' : ''}${(g.gap_vs_median_pct * 100).toFixed(1)}pp |`);
    });
    lines.push('');
  }

  // Opportunities
  if (opps.length > 0) {
    lines.push('## Opportunities');
    lines.push('| Opportunity | Low | Base | High | Confidence |');
    lines.push('|-------------|-----|------|------|------------|');
    opps.forEach(o => {
      lines.push(`| ${o.module_name} | $${fmtNum(o.low_case)} | $${fmtNum(o.base_case)} | $${fmtNum(o.high_case)} | ${o.confidence} |`);
    });
    const totalBase = opps.reduce((s, o) => s + o.base_case, 0);
    lines.push(`| **Total** | | **$${fmtNum(totalBase)}** | | |`);
    lines.push('');
  }

  // Key Findings
  lines.push('## Key Findings');
  engineResult.narrative.key_findings.forEach(f => lines.push(`- ${f}`));
  lines.push('');

  // Why It Matters
  lines.push('## Why It Matters');
  lines.push(engineResult.narrative.why_it_matters);
  lines.push('');

  // Caveats
  lines.push('## Caveats & Limitations');
  engineResult.narrative.caveats.forEach(c => lines.push(`- ${c}`));
  lines.push('');

  // QA
  const failedChecks = engineResult.qa.checks.filter(c => !c.passed);
  if (failedChecks.length > 0) {
    lines.push('## Quality Flags');
    failedChecks.forEach(c => lines.push(`- **${c.severity}**: ${c.check_name} — ${c.message}`));
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Overall Confidence: ${engineResult.qa.overall_confidence}*`);
  lines.push(`*${engineResult.narrative.confidence_statement}*`);

  return lines.join('\n');
}

// ── Export: Full Report (structured sections) ──
export async function exportFullReport(analysisId: string): Promise<string | null> {
  const engineResult = resultsCache.get(analysisId);
  const analysis = getAnalysis(analysisId);
  if (!engineResult || !analysis) return null;

  const { generateReport } = await import('@/lib/report');
  const reportData = bridgeToReportData(engineResult, analysis);
  const report = generateReport(reportData);

  const lines: string[] = [];
  lines.push(`# IT Strategy Diagnostic — Full Report`);
  lines.push(`**${report.meta.company_name}** | ${report.meta.industry} | ${report.meta.qualification_level}`);
  lines.push(`*Prepared: ${report.meta.prepared_date}*`);
  lines.push('');

  for (const section of report.sections) {
    lines.push(`---`);
    lines.push(`## Sheet ${section.sheet_number}: ${section.sheet_name}`);
    lines.push(`### ${section.section_title}`);
    lines.push('');

    if (section.data && section.data.length > 0) {
      const keys = Object.keys(section.data[0]);
      lines.push('| ' + keys.join(' | ') + ' |');
      lines.push('| ' + keys.map(() => '---').join(' | ') + ' |');
      section.data.forEach(row => {
        lines.push('| ' + keys.map(k => String(row[k] ?? '')).join(' | ') + ' |');
      });
      if (section.totals) {
        lines.push('| ' + keys.map(k => `**${String(section.totals![k] ?? '')}**`).join(' | ') + ' |');
      }
      lines.push('');
    }

    if (section.narrative_guidance) {
      lines.push('**Narrative Guidance:**');
      lines.push(section.narrative_guidance);
      lines.push('');
    }

    if (section.data_points && Object.keys(section.data_points).length > 0) {
      lines.push('**Key Data Points:**');
      Object.entries(section.data_points).forEach(([k, v]) => {
        lines.push(`- ${k}: ${v}`);
      });
      lines.push('');
    }

    if (section.calculations && section.calculations.length > 0) {
      lines.push('<details><summary>Calculations</summary>');
      lines.push('');
      section.calculations.forEach(c => lines.push(`- ${c}`));
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ── Export: Chain of Thought ──
export async function exportChainOfThought(analysisId: string): Promise<string | null> {
  const engineResult = resultsCache.get(analysisId);
  const analysis = getAnalysis(analysisId);
  if (!engineResult || !analysis) return null;

  const { generateChainOfThought, formatChainOfThoughtMarkdown } = await import('@/lib/report');
  const reportData = bridgeToReportData(engineResult, analysis);
  const cot = generateChainOfThought(reportData);
  return formatChainOfThoughtMarkdown(cot);
}

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}
