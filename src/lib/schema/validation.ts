import { z } from 'zod';
import {
  GICS_GROUPS, BUSINESS_MODELS, COMPLEXITY_LEVELS,
  TRANSFORMATION_STATUS, TRANSFORMATION_TYPES, FISCAL_YEAR_LABELS,
  DIAGNOSTIC_LEVELS, CONFIDENCE_LEVELS, FILE_ZONES, PARSE_STATUS,
  INPUT_MODES, INTAKE_PREFERENCES, PROVIDED_STATUS,
} from './value-lists';

// ── Company-level fields ──
export const companyProfileSchema = z.object({
  company_name: z.string().min(2).max(100),
  industry_gics_group: z.enum(GICS_GROUPS),
  business_model: z.enum(BUSINESS_MODELS).nullable().optional(),
  regulatory_complexity: z.enum(COMPLEXITY_LEVELS).nullable().optional(),
  operating_complexity: z.enum(COMPLEXITY_LEVELS).nullable().optional(),
  pricing_premium_complexity: z.enum(COMPLEXITY_LEVELS).nullable().optional(),
  complexity_notes: z.string().max(500).nullable().optional(),
});

// ── Year-indexed fields (one set per fiscal year) ──
export const fiscalYearSchema = z.object({
  fiscal_year_label: z.enum(FISCAL_YEAR_LABELS),
  fiscal_year_order: z.number().int().positive(),
  revenue: z.number().positive().nullable().optional(),
  total_it_spend: z.number().positive().nullable().optional(),
  it_opex_spend: z.number().nonnegative().nullable().optional(),
  it_capex_spend: z.number().nonnegative().nullable().optional(),
  it_da_spend: z.number().nonnegative().nullable().optional(),
  employee_count: z.number().int().positive().nullable().optional(),
  it_fte_count: z.number().int().positive().nullable().optional(),
  contractor_count: z.number().int().nonnegative().nullable().optional(),
  contractor_spend: z.number().nonnegative().nullable().optional(),
  outsourced_spend: z.number().nonnegative().nullable().optional(),
  internal_labor_spend: z.number().nonnegative().nullable().optional(),
  transformation_status: z.enum(TRANSFORMATION_STATUS).nullable().optional(),
  transformation_type: z.array(z.enum(TRANSFORMATION_TYPES)).nullable().optional(),
  transformation_spend_estimate: z.number().nonnegative().nullable().optional(),
  transformation_rolloff_timing: z.string().max(100).nullable().optional(),
  roadmap_available: z.boolean().nullable().optional(),
});

// ── Analysis controls ──
export const analysisControlsSchema = z.object({
  target_diagnostic_level: z.enum(DIAGNOSTIC_LEVELS).default('Quick Read'),
  intake_preference: z.enum(INTAKE_PREFERENCES).default('Best Available'),
  proceed_status: z.enum(['draft', 'confirmed', 'running', 'complete', 'error']).default('draft'),
  analysis_name: z.string().max(200).nullable().optional(),
  analysis_owner: z.string().max(200).nullable().optional(),
});

// ── File upload ──
export const fileUploadSchema = z.object({
  zone: z.enum(FILE_ZONES),
  file_name: z.string(),
  status: z.enum(PARSE_STATUS).default('Uploaded'),
  years_detected: z.string().nullable().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ── Extracted value from file ──
export const extractedValueSchema = z.object({
  backend_field: z.string(),
  extracted_value: z.string().nullable().optional(),
  source_file: z.string().nullable().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).nullable().optional(),
  mapping_notes: z.string().nullable().optional(),
});

// ── Review matrix row ──
export const reviewMatrixRowSchema = z.object({
  metric_name: z.string(),
  required_for_level: z.string(),
  provided: z.enum(PROVIDED_STATUS),
  file_source_used: z.string().nullable().optional(),
  mapping_assumptions: z.string().nullable().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  final_value_preview: z.string().nullable().optional(),
  notes_flags: z.string().nullable().optional(),
});

// ── Canonical resolver row ──
export const canonicalValueSchema = z.object({
  group: z.string(),
  ux_label: z.string(),
  backend_field: z.string(),
  form_value: z.unknown().nullable().optional(),
  wizard_value: z.unknown().nullable().optional(),
  file_drop_value: z.unknown().nullable().optional(),
  final_value: z.unknown().nullable().optional(),
  selected_source: z.enum(INPUT_MODES).nullable().optional(),
  conflict_flag: z.enum(['OK', 'Check']).nullable().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ── Full analysis input (canonical record) ──
export const canonicalAnalysisSchema = z.object({
  id: z.string().uuid(),
  company: companyProfileSchema,
  fiscal_years: z.array(fiscalYearSchema).min(1),
  controls: analysisControlsSchema,
  file_uploads: z.array(fileUploadSchema).optional(),
  vendor_detail_available: z.boolean().default(false),
  project_portfolio_file_available: z.boolean().default(false),
  detailed_file_available: z.boolean().default(false),
});

// ── Inferred types ──
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type FiscalYear = z.infer<typeof fiscalYearSchema>;
export type AnalysisControls = z.infer<typeof analysisControlsSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type ExtractedValue = z.infer<typeof extractedValueSchema>;
export type ReviewMatrixRow = z.infer<typeof reviewMatrixRowSchema>;
export type CanonicalValue = z.infer<typeof canonicalValueSchema>;
export type CanonicalAnalysis = z.infer<typeof canonicalAnalysisSchema>;
