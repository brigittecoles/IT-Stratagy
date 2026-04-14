'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CompanyProfileForm } from '@/components/intake/CompanyProfileForm';
import { FinancialBaselineForm } from '@/components/intake/FinancialBaselineForm';
import { WorkforceForm } from '@/components/intake/WorkforceForm';
import { TransformationForm } from '@/components/intake/TransformationForm';
import { FileDropZone } from '@/components/intake/FileDropZone';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { saveIntakeData, getAnalysisControls } from '@/lib/actions';
import { DiagnosticLevelBanner } from '@/components/intake/DiagnosticLevelBanner';
import type { CompanyProfile, FiscalYear } from '@/lib/schema/validation';

const STEPS: readonly { label: string; key: string; optional?: boolean }[] = [
  { label: 'Company Profile', key: 'company' },
  { label: 'Financial Baseline', key: 'financial' },
  { label: 'Prior Year', key: 'prior', optional: true },
  { label: 'Workforce', key: 'workforce' },
  { label: 'Transformation', key: 'transformation' },
  { label: 'File Upload', key: 'files', optional: true },
];

type WorkforceFields = Pick<
  FiscalYear,
  | 'employee_count'
  | 'it_fte_count'
  | 'contractor_count'
  | 'contractor_spend'
  | 'outsourced_spend'
  | 'internal_labor_spend'
>;

type TransformationFields = Pick<
  FiscalYear,
  | 'transformation_status'
  | 'transformation_type'
  | 'transformation_spend_estimate'
  | 'transformation_rolloff_timing'
  | 'roadmap_available'
>;

interface FormState {
  company: Partial<CompanyProfile>;
  currentYear: Partial<FiscalYear>;
  priorYear: Partial<FiscalYear>;
  workforce: Partial<WorkforceFields>;
  transformation: Partial<TransformationFields>;
  files: Record<string, File | null>;
}

export default function FormIntakePage() {
  const params = useParams();
  const [step, setStep] = useState(0);
  const [priorExpanded, setPriorExpanded] = useState(false);

  const [formState, setFormState] = useState<FormState>({
    company: {},
    currentYear: {
      fiscal_year_label: 'Current Fiscal Year',
      fiscal_year_order: 1,
    },
    priorYear: {
      fiscal_year_label: 'Last Fiscal Year',
      fiscal_year_order: 2,
    },
    workforce: {},
    transformation: {},
    files: {},
  });

  const updateCompany = useCallback(
    (data: Partial<CompanyProfile>) =>
      setFormState((prev) => ({ ...prev, company: data })),
    []
  );

  const updateCurrentYear = useCallback(
    (data: Partial<FiscalYear>) =>
      setFormState((prev) => ({ ...prev, currentYear: data })),
    []
  );

  const updatePriorYear = useCallback(
    (data: Partial<FiscalYear>) =>
      setFormState((prev) => ({ ...prev, priorYear: data })),
    []
  );

  const updateWorkforce = useCallback(
    (data: Partial<WorkforceFields>) =>
      setFormState((prev) => ({ ...prev, workforce: data })),
    []
  );

  const updateTransformation = useCallback(
    (data: Partial<TransformationFields>) =>
      setFormState((prev) => ({ ...prev, transformation: data })),
    []
  );

  const updateFiles = useCallback(
    (files: Record<string, File | null>) =>
      setFormState((prev) => ({ ...prev, files })),
    []
  );

  const [submitting, setSubmitting] = useState(false);
  const [targetLevel, setTargetLevel] = useState<string>('Standard Diagnostic');

  // Load the target level from the analysis controls
  useEffect(() => {
    getAnalysisControls(params.id as string).then((controls) => {
      if (controls?.target_diagnostic_level) {
        setTargetLevel(controls.target_diagnostic_level);
      }
    });
  }, [params.id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveIntakeData({
        analysisId: params.id as string,
        company: formState.company,
        currentYear: formState.currentYear,
        priorYear: priorExpanded ? formState.priorYear : undefined,
        workforce: formState.workforce,
        transformation: formState.transformation,
      });
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitting(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  // Compute provided fields for level banner
  const providedFields: string[] = [];
  if (formState.company.company_name) providedFields.push('company_name');
  if (formState.company.industry_gics_group) providedFields.push('industry_gics_group');
  if (formState.currentYear.revenue) providedFields.push('revenue');
  if (formState.currentYear.total_it_spend) providedFields.push('total_it_spend');
  if (formState.transformation.transformation_status) providedFields.push('transformation_status');
  if (formState.currentYear.it_opex_spend) providedFields.push('it_opex_spend');
  if (formState.currentYear.it_capex_spend) providedFields.push('it_capex_spend');
  if (formState.workforce.employee_count) providedFields.push('employee_count');
  if (formState.workforce.it_fte_count) providedFields.push('it_fte_count');
  const hasDetailedFile = Object.values(formState.files).some(f => f !== null);
  if (hasDetailedFile) providedFields.push('detailed_file_available');

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          IT Strategy Diagnostic
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete each section to build your diagnostic profile.
        </p>
      </div>

      {/* Diagnostic level requirements */}
      <div className="mb-8">
        <DiagnosticLevelBanner
          targetLevel={targetLevel}
          providedFields={providedFields}
          compact
        />
      </div>

      {/* Step Indicator */}
      <nav className="mb-8">
        <ol className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <li key={s.key} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex w-full flex-col items-center gap-1 text-center transition-colors ${
                    isActive
                      ? 'text-primary'
                      : isComplete
                        ? 'text-primary/70'
                        : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isComplete
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input bg-background'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="size-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="hidden text-xs sm:block">
                    {s.label}
                    {s.optional && (
                      <span className="ml-0.5 text-muted-foreground">
                        *
                      </span>
                    )}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 hidden h-px flex-1 sm:block ${
                      isComplete ? 'bg-primary' : 'bg-input'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Form Content */}
      <div className="rounded-xl border border-input bg-background p-6 shadow-sm">
        {step === 0 && (
          <CompanyProfileForm
            data={formState.company}
            onChange={updateCompany}
          />
        )}

        {step === 1 && (
          <FinancialBaselineForm
            data={formState.currentYear}
            yearIndex={0}
            onChange={updateCurrentYear}
          />
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Prior Year Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Optional. Providing prior year data enables trend analysis.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPriorExpanded(!priorExpanded)}
              >
                {priorExpanded ? 'Collapse' : 'Add Prior Year'}
              </Button>
            </div>
            {priorExpanded && (
              <FinancialBaselineForm
                data={formState.priorYear}
                yearIndex={1}
                onChange={updatePriorYear}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <WorkforceForm
            data={formState.workforce}
            onChange={updateWorkforce}
          />
        )}

        {step === 4 && (
          <TransformationForm
            data={formState.transformation}
            onChange={updateTransformation}
          />
        )}

        {step === 5 && (
          <FileDropZone
            files={formState.files}
            onChange={updateFiles}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="size-4" data-icon="inline-start" />
          Back
        </Button>

        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Check className="size-4" data-icon="inline-start" />
            )}
            {submitting ? 'Saving...' : 'Review'}
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next
            <ChevronRight className="size-4" data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}
