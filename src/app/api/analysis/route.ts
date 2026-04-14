import { NextRequest, NextResponse } from 'next/server';
import { createAnalysis, listAnalyses } from '@/lib/store';

// POST /api/analysis — Create a new analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_name, industry_gics_group, target_diagnostic_level } = body;

    if (!company_name || !industry_gics_group) {
      return NextResponse.json(
        { error: 'company_name and industry_gics_group are required' },
        { status: 400 },
      );
    }

    const analysis = createAnalysis({ target_diagnostic_level });

    // Set company info
    const { updateAnalysis } = await import('@/lib/store');
    updateAnalysis(analysis.id, {
      company: {
        company_name,
        industry_gics_group,
        business_model: body.business_model ?? null,
        regulatory_complexity: body.regulatory_complexity ?? null,
        operating_complexity: body.operating_complexity ?? null,
        pricing_premium_complexity: body.pricing_premium_complexity ?? null,
        complexity_notes: body.complexity_notes ?? null,
      },
    });

    return NextResponse.json({ id: analysis.id, company_name, industry_gics_group });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/analysis — List all analyses
export async function GET() {
  const analyses = listAnalyses();
  return NextResponse.json(
    analyses.map(a => ({
      id: a.id,
      company_name: a.company.company_name,
      industry: a.company.industry_gics_group,
      status: a.controls.proceed_status,
      level: a.controls.target_diagnostic_level,
    })),
  );
}
