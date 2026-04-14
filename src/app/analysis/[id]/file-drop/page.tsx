'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileDropZone } from '@/components/intake/FileDropZone';
import { CompanyProfileForm } from '@/components/intake/CompanyProfileForm';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Building2,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { saveIntakeData, getAnalysisControls } from '@/lib/actions';
import { DiagnosticLevelBanner } from '@/components/intake/DiagnosticLevelBanner';
import type { CompanyProfile } from '@/lib/schema/validation';
import * as XLSX from 'xlsx';

// ── File parsing helpers ──

interface ParsedData {
  revenue?: number;
  total_it_spend?: number;
  it_opex_spend?: number;
  it_capex_spend?: number;
  employee_count?: number;
  it_fte_count?: number;
  contractor_count?: number;
  contractor_spend?: number;
  outsourced_spend?: number;
  internal_labor_spend?: number;
  transformation_status?: 'Yes' | 'No' | 'Unsure';
  transformation_spend_estimate?: number;
}

/** Try to extract a numeric value from a cell */
function extractNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s%]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  return undefined;
}

/** Known field aliases — maps spreadsheet labels to our canonical fields */
const FIELD_ALIASES: Record<string, keyof ParsedData> = {
  'revenue': 'revenue',
  'annual revenue': 'revenue',
  'total revenue': 'revenue',
  'gross revenue': 'revenue',
  'total it spend': 'total_it_spend',
  'it spend': 'total_it_spend',
  'it budget': 'total_it_spend',
  'technology spend': 'total_it_spend',
  'tech spend': 'total_it_spend',
  'it opex': 'it_opex_spend',
  'opex': 'it_opex_spend',
  'operating expense': 'it_opex_spend',
  'it operating expense': 'it_opex_spend',
  'it capex': 'it_capex_spend',
  'capex': 'it_capex_spend',
  'capital expense': 'it_capex_spend',
  'it capital expense': 'it_capex_spend',
  'employees': 'employee_count',
  'employee count': 'employee_count',
  'headcount': 'employee_count',
  'total headcount': 'employee_count',
  'total employees': 'employee_count',
  'fte': 'employee_count',
  'it fte': 'it_fte_count',
  'it ftes': 'it_fte_count',
  'it headcount': 'it_fte_count',
  'it staff': 'it_fte_count',
  'it employees': 'it_fte_count',
  'contractors': 'contractor_count',
  'contractor count': 'contractor_count',
  'it contractors': 'contractor_count',
  'contractor spend': 'contractor_spend',
  'outsourced spend': 'outsourced_spend',
  'outsourcing spend': 'outsourced_spend',
  'managed services spend': 'outsourced_spend',
  'internal labor': 'internal_labor_spend',
  'internal labor spend': 'internal_labor_spend',
  'transformation spend': 'transformation_spend_estimate',
  'transformation budget': 'transformation_spend_estimate',
};

/** Parse an Excel/CSV file and extract recognized fields */
async function parseSpreadsheet(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const parsed: ParsedData = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });

    for (const row of rows) {
      const values = Object.values(row);
      for (let i = 0; i < values.length - 1; i++) {
        const label = String(values[i] ?? '').toLowerCase().trim();
        const fieldKey = FIELD_ALIASES[label];
        if (fieldKey) {
          // Look at the next cell(s) for a numeric value
          for (let j = i + 1; j < Math.min(i + 4, values.length); j++) {
            const num = extractNumber(values[j]);
            if (num !== undefined) {
              (parsed as Record<string, unknown>)[fieldKey] = num;
              break;
            }
          }
        }
      }
    }
  }

  return parsed;
}

// ── Page Component ──

type Step = 'upload' | 'company' | 'review';

export default function FileDropPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [parsedData, setParsedData] = useState<ParsedData>({});
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [parseMessages, setParseMessages] = useState<string[]>([]);
  const [company, setCompany] = useState<Partial<CompanyProfile>>({});
  const [isPending, startTransition] = useTransition();
  const [targetLevel, setTargetLevel] = useState<string>('Standard Diagnostic');

  // Load the target level from the analysis controls
  useEffect(() => {
    getAnalysisControls(analysisId).then((controls) => {
      if (controls?.target_diagnostic_level) {
        setTargetLevel(controls.target_diagnostic_level);
      }
    });
  }, [analysisId]);

  const fileCount = Object.values(files).filter(Boolean).length;

  // Compute which fields are already provided (for the level banner)
  const providedFields: string[] = [];
  if (company.company_name) providedFields.push('company_name');
  if (company.industry_gics_group) providedFields.push('industry_gics_group');
  if (parsedData.revenue) providedFields.push('revenue');
  if (parsedData.total_it_spend) providedFields.push('total_it_spend');
  if (parsedData.transformation_status) providedFields.push('transformation_status');
  if (parsedData.it_opex_spend) providedFields.push('it_opex_spend');
  if (parsedData.it_capex_spend) providedFields.push('it_capex_spend');
  if (parsedData.employee_count) providedFields.push('employee_count');
  if (parsedData.it_fte_count) providedFields.push('it_fte_count');
  // File-based flags
  if (files['IT Financials'] || files['IT Vendors'] || files['IT FTEs and Contractors'])
    providedFields.push('detailed_file_available');
  if (files['IT Vendors']) providedFields.push('vendor_detail_available');
  if (files['Project Portfolio / Roadmap']) providedFields.push('project_portfolio_file_available');

  // Parse all uploaded files
  const handleParseFiles = useCallback(async () => {
    const uploadedFiles = Object.entries(files).filter(([, f]) => f !== null);
    if (uploadedFiles.length === 0) return;

    setParseStatus('parsing');
    setParseMessages([]);

    const merged: ParsedData = {};
    const messages: string[] = [];

    for (const [zone, file] of uploadedFiles) {
      if (!file) continue;
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        try {
          const data = await parseSpreadsheet(file);
          const fieldCount = Object.keys(data).length;
          messages.push(`✓ ${zone}: extracted ${fieldCount} field${fieldCount !== 1 ? 's' : ''} from ${file.name}`);
          Object.assign(merged, data);
        } catch {
          messages.push(`⚠ ${zone}: could not parse ${file.name}`);
        }
      } else if (ext === 'pdf') {
        messages.push(`○ ${zone}: PDF uploaded (${file.name}) — manual review needed`);
      } else {
        messages.push(`⚠ ${zone}: unsupported format (${file.name})`);
      }
    }

    const totalFields = Object.keys(merged).length;
    if (totalFields > 0) {
      messages.push(`\n→ ${totalFields} data point${totalFields !== 1 ? 's' : ''} extracted. Review below before proceeding.`);
    } else {
      messages.push('\n→ No structured data found. You can enter data manually in the next step.');
    }

    setParsedData(merged);
    setParseMessages(messages);
    setParseStatus('done');
  }, [files]);

  // Submit and redirect to review
  const handleSubmit = () => {
    startTransition(async () => {
      await saveIntakeData({
        analysisId,
        company,
        currentYear: {
          fiscal_year_label: 'Current Fiscal Year',
          fiscal_year_order: 1,
          revenue: parsedData.revenue ?? null,
          total_it_spend: parsedData.total_it_spend ?? null,
          it_opex_spend: parsedData.it_opex_spend ?? null,
          it_capex_spend: parsedData.it_capex_spend ?? null,
          employee_count: parsedData.employee_count ?? null,
          it_fte_count: parsedData.it_fte_count ?? null,
          contractor_count: parsedData.contractor_count ?? null,
          contractor_spend: parsedData.contractor_spend ?? null,
          outsourced_spend: parsedData.outsourced_spend ?? null,
          internal_labor_spend: parsedData.internal_labor_spend ?? null,
          transformation_status: parsedData.transformation_status ?? null,
          transformation_spend_estimate: parsedData.transformation_spend_estimate ?? null,
        },
        workforce: {
          employee_count: parsedData.employee_count ?? null,
          it_fte_count: parsedData.it_fte_count ?? null,
          contractor_count: parsedData.contractor_count ?? null,
          contractor_spend: parsedData.contractor_spend ?? null,
          outsourced_spend: parsedData.outsourced_spend ?? null,
          internal_labor_spend: parsedData.internal_labor_spend ?? null,
        },
        transformation: {
          transformation_status: parsedData.transformation_status ?? null,
          transformation_spend_estimate: parsedData.transformation_spend_estimate ?? null,
        },
      });
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <Link
        href={`/analysis/${analysisId}/form`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Switch to Form View
      </Link>

      <div className="mb-8">
        <span className="wm-overline">File Drop</span>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          Upload Your Data
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload spreadsheets with IT financials, vendor lists, org charts, or roadmaps.
          We&apos;ll extract what we can and let you review before running the diagnostic.
        </p>
      </div>

      {/* Diagnostic level requirements */}
      <DiagnosticLevelBanner
        targetLevel={targetLevel}
        providedFields={providedFields}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'company', 'review'] as const).map((s, i) => {
          const labels = ['Upload Files', 'Company Profile', 'Review & Submit'];
          const isActive = s === step;
          const isComplete =
            (s === 'upload' && (step === 'company' || step === 'review')) ||
            (s === 'company' && step === 'review');
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => {
                  if (isComplete) setStep(s);
                }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-wm-blue'
                    : isComplete
                      ? 'text-wm-navy cursor-pointer hover:text-wm-blue'
                      : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex items-center justify-center size-6 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-wm-blue text-white'
                      : isComplete
                        ? 'bg-wm-navy/10 text-wm-navy'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{labels[i]}</span>
              </button>
              {i < 2 && (
                <div
                  className={`flex-1 h-px ${
                    isComplete ? 'bg-wm-navy/20' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-input bg-background p-6 shadow-sm">
            <FileDropZone files={files} onChange={setFiles} />
          </div>

          {fileCount > 0 && parseStatus === 'idle' && (
            <div className="flex justify-center">
              <Button onClick={handleParseFiles} size="lg">
                <FileSpreadsheet className="size-4 mr-2" />
                Parse {fileCount} File{fileCount !== 1 ? 's' : ''}
              </Button>
            </div>
          )}

          {parseStatus === 'parsing' && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="size-4 animate-spin" />
              Parsing files...
            </div>
          )}

          {parseStatus === 'done' && (
            <div className="space-y-4">
              {/* Parse results */}
              <div className="rounded-lg border border-input bg-muted/30 p-4">
                <h4 className="text-sm font-semibold mb-2">Parse Results</h4>
                <div className="space-y-1">
                  {parseMessages.map((msg, i) => (
                    <p key={i} className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>

              {/* Extracted data preview */}
              {Object.keys(parsedData).length > 0 && (
                <div className="rounded-lg border border-input bg-background p-4">
                  <h4 className="text-sm font-semibold mb-3">Extracted Data</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(parsedData).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-1.5 px-3 rounded bg-muted/50"
                      >
                        <span className="text-xs text-muted-foreground">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium tabular-nums">
                          {typeof value === 'number'
                            ? value >= 1000
                              ? `$${(value / 1e6).toFixed(1)}M`
                              : value.toLocaleString()
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep('company')}>
                  Next: Company Profile
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {fileCount === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-4">
              <AlertCircle className="size-4" />
              Drop at least one file above to get started, or{' '}
              <button
                onClick={() => setStep('company')}
                className="text-wm-blue hover:underline font-medium"
              >
                skip to manual entry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Company Profile */}
      {step === 'company' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-input bg-background p-6 shadow-sm">
            <CompanyProfileForm data={company} onChange={setCompany} />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              <ArrowLeft className="size-4 mr-2" />
              Back to Files
            </Button>
            <Button
              onClick={() => setStep('review')}
              disabled={!company.company_name}
            >
              Next: Review
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Review & Submit */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Company summary */}
          <div className="rounded-xl border border-input bg-background p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="size-5 text-wm-navy" />
              <h3 className="font-semibold">Company</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{company.company_name || '—'}</div>
              <div className="text-muted-foreground">Industry</div>
              <div className="font-medium">{company.industry_gics_group || '—'}</div>
              {company.business_model && (
                <>
                  <div className="text-muted-foreground">Business Model</div>
                  <div className="font-medium">{company.business_model}</div>
                </>
              )}
            </div>
          </div>

          {/* Data summary */}
          <div className="rounded-xl border border-input bg-background p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="size-5 text-wm-navy" />
              <h3 className="font-semibold">
                Extracted Data ({Object.keys(parsedData).length} fields)
              </h3>
            </div>
            {Object.keys(parsedData).length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(parsedData).map(([key, value]) => (
                  <div key={key} className="contents">
                    <div className="text-muted-foreground py-1">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="font-medium tabular-nums py-1">
                      {typeof value === 'number'
                        ? value >= 1000
                          ? `$${(value / 1e6).toFixed(1)}M`
                          : value.toLocaleString()
                        : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No data extracted from files. You can add data manually after submission.
              </p>
            )}
          </div>

          {/* Files summary */}
          <div className="rounded-xl border border-input bg-background p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="size-5 text-wm-navy" />
              <h3 className="font-semibold">
                Files ({fileCount} uploaded)
              </h3>
            </div>
            <div className="space-y-2">
              {Object.entries(files)
                .filter(([, f]) => f !== null)
                .map(([zone, file]) => (
                  <div
                    key={zone}
                    className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50 text-sm"
                  >
                    <span className="text-muted-foreground">{zone}</span>
                    <span className="font-medium">{file!.name}</span>
                  </div>
                ))}
              {fileCount === 0 && (
                <p className="text-sm text-muted-foreground">No files uploaded.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep('company')}>
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Submit & Review
                  <ArrowRight className="size-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
