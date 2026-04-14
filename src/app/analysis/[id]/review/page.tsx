'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReviewMatrix } from '@/components/review/ReviewMatrix';
import { QualificationCard } from '@/components/review/QualificationCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge';
import { getAnalysisForReview, runFullAnalysis } from '@/lib/actions';
import type { ReviewMatrixRow } from '@/lib/schema/validation';
import type { DiagnosticLevel, ConfidenceLevel } from '@/lib/schema/value-lists';
import { ArrowRight, ClipboardCheck, ListChecks, FileText, Loader2 } from 'lucide-react';

// Build review matrix rows from real analysis data
function buildReviewRows(
  analysis: { company: Record<string, unknown>; fiscal_years: Record<string, unknown>[] },
  qualification: { level: string }
): ReviewMatrixRow[] {
  const fy = analysis.fiscal_years?.[0] ?? {};
  const company = analysis.company ?? {};
  const rows: ReviewMatrixRow[] = [];

  const addRow = (
    name: string,
    level: string,
    value: unknown,
    source?: string,
  ) => {
    const provided = value != null && value !== '' && value !== false
      ? 'Confirmed' as const
      : 'Missing' as const;
    const confidence = provided === 'Confirmed' ? 'High' as const : 'Low' as const;
    const preview = provided === 'Confirmed'
      ? typeof value === 'number'
        ? value >= 1000 ? `$${(value / 1e6).toFixed(1)}M` : String(value)
        : String(value)
      : null;
    rows.push({
      metric_name: name,
      required_for_level: level,
      provided,
      file_source_used: source ?? (provided === 'Confirmed' ? 'Form' : null),
      mapping_assumptions: null,
      confidence,
      final_value_preview: preview,
      notes_flags: null,
    });
  };

  addRow('Company name', 'Quick Read', company.company_name);
  addRow('Industry (GICS group)', 'Quick Read', company.industry_gics_group);
  addRow('Business model', 'Standard Diagnostic', company.business_model);
  addRow('Regulatory complexity', 'Standard Diagnostic', company.regulatory_complexity);
  addRow('Operating complexity', 'Standard Diagnostic', company.operating_complexity);
  addRow('Pricing / service premium complexity', 'Standard Diagnostic', company.pricing_premium_complexity);
  addRow('Revenue (current year)', 'Quick Read', fy.revenue);
  addRow('Total IT spend (current year)', 'Quick Read', fy.total_it_spend);
  addRow('IT OpEx spend', 'Standard Diagnostic', fy.it_opex_spend);
  addRow('IT CapEx spend', 'Standard Diagnostic', fy.it_capex_spend);
  addRow('Employee count', 'Standard Diagnostic', fy.employee_count);
  addRow('IT FTE count', 'Standard Diagnostic', fy.it_fte_count);
  addRow('Contractor count', 'Full Diagnostic', fy.contractor_count);
  addRow('Contractor spend', 'Full Diagnostic', fy.contractor_spend);
  addRow('Outsourced / managed service spend', 'Full Diagnostic', fy.outsourced_spend);
  addRow('Internal labor spend', 'Full Diagnostic', fy.internal_labor_spend);
  addRow('Transformation active?', 'Quick Read', fy.transformation_status);
  addRow('Transformation type(s)', 'Standard Diagnostic', fy.transformation_type);
  addRow('Transformation spend estimate', 'Full Diagnostic', fy.transformation_spend_estimate);
  addRow('Roadmap available?', 'Full Diagnostic', fy.roadmap_available);

  return rows;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    rows: ReviewMatrixRow[];
    qualifiedLevel: DiagnosticLevel;
    missingForNext: { level: string; fields: string[] }[];
    confidence: ConfidenceLevel;
    companyName: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getAnalysisForReview(analysisId);
        if (!result) {
          setError('Analysis not found. Please start a new analysis.');
          setLoading(false);
          return;
        }
        const { analysis, qualification } = result;
        const rows = buildReviewRows(
          analysis as unknown as { company: Record<string, unknown>; fiscal_years: Record<string, unknown>[] },
          qualification
        );
        setReviewData({
          rows,
          qualifiedLevel: qualification.level as DiagnosticLevel,
          missingForNext: qualification.missing_for_next,
          confidence: qualification.overall_confidence,
          companyName: analysis.company.company_name || 'Unnamed Analysis',
        });
      } catch (err) {
        setError('Failed to load analysis data.');
      }
      setLoading(false);
    }
    load();
  }, [analysisId]);

  const handleRunAnalysis = async () => {
    setRunning(true);
    try {
      const result = await runFullAnalysis(analysisId);
      if (result.success) {
        router.push(`/analysis/${analysisId}/results`);
      } else {
        setError(result.error || 'Analysis failed');
        setRunning(false);
      }
    } catch (err) {
      setError('Failed to run analysis');
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-destructive">{error || 'No data available'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/analysis/new')}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  const confirmedCount = reviewData.rows.filter(r => r.provided === 'Confirmed').length;
  const missingCount = reviewData.rows.filter(r => r.provided === 'Missing').length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Review: {reviewData.companyName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your inputs before running the analysis. {confirmedCount} confirmed, {missingCount} missing.
        </p>
      </div>

      {/* Qualification */}
      <QualificationCard
        qualifiedLevel={reviewData.qualifiedLevel}
        targetLevel={reviewData.qualifiedLevel}
        confidence={reviewData.confidence}
        missingForNextLevel={reviewData.missingForNext.flatMap(m => m.fields)}
        onProceed={handleRunAnalysis}
        onAddMore={() => router.back()}
        onEditAssumptions={() => {}}
      />

      {/* Review Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="size-5" />
            Confirmed Input Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewMatrix rows={reviewData.rows} />
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex items-center justify-between rounded-lg border border-input bg-muted/50 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Ready to run?</p>
          <p className="text-xs text-muted-foreground">
            Your data qualifies for <strong>{reviewData.qualifiedLevel}</strong>.
          </p>
        </div>
        <Button onClick={handleRunAnalysis} disabled={running} size="lg">
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Running Analysis...
            </>
          ) : (
            <>
              <ArrowRight className="size-4" />
              Confirm &amp; Run Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
