import { NextRequest, NextResponse } from 'next/server';
import { selectBenchmarkFamily } from '@/lib/engine/n02-benchmark-select';

// GET /api/benchmarks?industry=banking&metric=it_spend_pct_revenue
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry') ?? 'all';

  if (industry === 'all') {
    // Return list of available industries
    const industries = [
      'Banking', 'Insurance', 'Energy', 'Health Care', 'Retail',
      'Utilities', 'Telecom', 'Transportation', 'Chemicals',
      'Consumer Products', 'Industrial Manufacturing', 'Media',
      'Professional Services', 'Software', 'Government',
    ];
    return NextResponse.json({ industries });
  }

  try {
    const result = selectBenchmarkFamily(industry, null);
    if (!result.family) {
      return NextResponse.json(
        { error: `No benchmarks found for industry: ${industry}` },
        { status: 404 },
      );
    }

    const metric = searchParams.get('metric');
    if (metric) {
      const filtered = result.metrics.filter(m => m.metric_name === metric);
      return NextResponse.json({
        industry: result.family.industry_gics_group,
        metrics: filtered,
      });
    }

    return NextResponse.json({
      industry: result.family.industry_gics_group,
      family: result.family,
      metrics: result.metrics,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
