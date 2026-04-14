import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis, updateAnalysis } from '@/lib/store';
import { runAnalysisPipeline } from '@/lib/engine/pipeline';
import { selectBenchmarkFamily } from '@/lib/engine/n02-benchmark-select';
import { resultsStore } from '@/lib/results-store';

// POST /api/analysis/[id]/run — Execute the full analysis pipeline
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const analysis = getAnalysis(id);
  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  try {
    const benchmark = selectBenchmarkFamily(
      analysis.company.industry_gics_group,
      analysis.company.business_model,
    );

    const result = await runAnalysisPipeline(
      analysis,
      benchmark.family ?? undefined,
      benchmark.metrics.length > 0 ? benchmark.metrics : undefined,
    );

    // Cache results
    resultsStore.set(id, result);

    // Update status
    updateAnalysis(id, {
      controls: { ...analysis.controls, proceed_status: 'complete' },
    });

    return NextResponse.json({
      success: true,
      qualified_level: result.qualified_level,
      kpi_count: Object.keys(result.core_kpis).length,
      opportunity_count: result.opportunities.length,
      confidence: result.qa.overall_confidence,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
