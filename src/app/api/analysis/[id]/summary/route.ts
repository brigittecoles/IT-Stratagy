import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis } from '@/lib/store';
import { resultsStore } from '@/lib/results-store';

// GET /api/analysis/[id]/summary — Get markdown executive summary
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = resultsStore.get(id);
  const analysis = getAnalysis(id);
  if (!result || !analysis) {
    return NextResponse.json(
      { error: 'Results not found. Run the analysis first.' },
      { status: 404 },
    );
  }

  const fy = analysis.fiscal_years[0];
  const gaps = result.benchmark?.raw_gaps ?? [];
  const opps = result.opportunities;

  const fmtNum = (n: number): string => {
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toFixed(0);
  };

  const lines: string[] = [];
  lines.push(`# IT Strategy Diagnostic — Executive Summary`);
  lines.push(`**${analysis.company.company_name}** | ${analysis.company.industry_gics_group} | ${result.qualified_level}`);
  lines.push('');
  lines.push('## Executive Summary');
  lines.push(result.narrative.executive_summary);
  lines.push('');
  lines.push('## Key Metrics');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  Object.values(result.core_kpis)
    .filter(k => !k.suppressed)
    .forEach(k => lines.push(`| ${k.name} | ${k.formatted} |`));
  if (fy?.revenue) lines.push(`| Revenue | $${(fy.revenue / 1e6).toFixed(0)}M |`);
  if (fy?.total_it_spend) lines.push(`| Total IT Spend | $${(fy.total_it_spend / 1e6).toFixed(1)}M |`);
  lines.push('');

  if (gaps.length > 0) {
    lines.push('## Benchmark Comparison');
    lines.push('| Metric | Actual | Median | Gap |');
    lines.push('|--------|--------|--------|-----|');
    gaps.forEach(g => {
      lines.push(`| ${g.metric_name} | ${(g.actual_pct * 100).toFixed(1)}% | ${(g.benchmark_median * 100).toFixed(1)}% | ${g.gap_vs_median_pct > 0 ? '+' : ''}${(g.gap_vs_median_pct * 100).toFixed(1)}pp |`);
    });
    lines.push('');
  }

  if (opps.length > 0) {
    lines.push('## Opportunities');
    lines.push('| Opportunity | Base Case | Confidence |');
    lines.push('|-------------|-----------|------------|');
    opps.forEach(o => lines.push(`| ${o.module_name} | $${fmtNum(o.base_case)} | ${o.confidence} |`));
    lines.push('');
  }

  lines.push('## Key Findings');
  result.narrative.key_findings.forEach(f => lines.push(`- ${f}`));
  lines.push('');
  lines.push(`*Confidence: ${result.qa.overall_confidence}*`);

  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
