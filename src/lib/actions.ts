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
