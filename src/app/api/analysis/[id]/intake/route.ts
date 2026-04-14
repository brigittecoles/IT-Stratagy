import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis, updateAnalysis } from '@/lib/store';
import { determineQualification } from '@/lib/resolver/qualification';
import type { FiscalYear } from '@/lib/schema/validation';

// POST /api/analysis/[id]/intake — Submit intake data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const analysis = getAnalysis(id);
  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const fiscalYearLabel = body.fiscal_year_label ?? 'Current Fiscal Year';
    const fiscalYearOrder = body.fiscal_year_order ?? 1;

    // Build fiscal year from submitted fields
    const fy: FiscalYear = {
      fiscal_year_label: fiscalYearLabel,
      fiscal_year_order: fiscalYearOrder,
      revenue: body.revenue ?? null,
      total_it_spend: body.total_it_spend ?? null,
      it_opex_spend: body.it_opex_spend ?? null,
      it_capex_spend: body.it_capex_spend ?? null,
      it_da_spend: body.it_da_spend ?? null,
      employee_count: body.employee_count ?? null,
      it_fte_count: body.it_fte_count ?? null,
      contractor_count: body.contractor_count ?? null,
      contractor_spend: body.contractor_spend ?? null,
      outsourced_spend: body.outsourced_spend ?? null,
      internal_labor_spend: body.internal_labor_spend ?? null,
      transformation_status: body.transformation_status ?? null,
      transformation_type: body.transformation_type ?? null,
      transformation_spend_estimate: body.transformation_spend_estimate ?? null,
      transformation_rolloff_timing: body.transformation_rolloff_timing ?? null,
      roadmap_available: body.roadmap_available ?? null,
    };

    // Merge into existing fiscal years (replace same label, or add new)
    const existingYears = [...analysis.fiscal_years];
    const existingIndex = existingYears.findIndex(y => y.fiscal_year_label === fiscalYearLabel);
    if (existingIndex >= 0) {
      // Merge: keep existing non-null values, overlay new non-null values
      const existing = existingYears[existingIndex];
      existingYears[existingIndex] = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(fy).filter(([, v]) => v !== null),
        ),
      } as FiscalYear;
    } else {
      existingYears.push(fy);
    }

    // Update company-level fields if provided
    const companyUpdates: Record<string, unknown> = {};
    if (body.business_model) companyUpdates.business_model = body.business_model;
    if (body.regulatory_complexity) companyUpdates.regulatory_complexity = body.regulatory_complexity;
    if (body.operating_complexity) companyUpdates.operating_complexity = body.operating_complexity;
    if (body.pricing_premium_complexity) companyUpdates.pricing_premium_complexity = body.pricing_premium_complexity;

    const updated = updateAnalysis(id, {
      fiscal_years: existingYears,
      ...(Object.keys(companyUpdates).length > 0
        ? { company: { ...analysis.company, ...companyUpdates } }
        : {}),
    });

    const qualification = determineQualification(updated);
    return NextResponse.json({
      level: qualification.level,
      missing_for_next: qualification.missing_for_next,
      confidence: qualification.overall_confidence,
      fiscal_years_count: updated.fiscal_years.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
