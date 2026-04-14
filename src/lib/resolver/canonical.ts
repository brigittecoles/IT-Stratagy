import type {
  CompanyProfile,
  FiscalYear,
  CanonicalValue,
} from '@/lib/schema/validation';
import type { IntakePreference, InputMode, ConfidenceLevel } from '@/lib/schema/value-lists';

// Fields we resolve, grouped for UX display
const FIELD_DEFINITIONS: {
  group: string;
  ux_label: string;
  backend_field: string;
}[] = [
  // Company profile
  { group: 'Company',   ux_label: 'Company Name',            backend_field: 'company_name' },
  { group: 'Company',   ux_label: 'Industry (GICS Group)',   backend_field: 'industry_gics_group' },
  { group: 'Company',   ux_label: 'Business Model',          backend_field: 'business_model' },
  { group: 'Company',   ux_label: 'Regulatory Complexity',   backend_field: 'regulatory_complexity' },
  { group: 'Company',   ux_label: 'Operating Complexity',    backend_field: 'operating_complexity' },
  // Fiscal year
  { group: 'Financials', ux_label: 'Revenue',                 backend_field: 'revenue' },
  { group: 'Financials', ux_label: 'Total IT Spend',          backend_field: 'total_it_spend' },
  { group: 'Financials', ux_label: 'IT OpEx Spend',           backend_field: 'it_opex_spend' },
  { group: 'Financials', ux_label: 'IT CapEx Spend',          backend_field: 'it_capex_spend' },
  { group: 'Financials', ux_label: 'IT D&A Spend',            backend_field: 'it_da_spend' },
  { group: 'Workforce',  ux_label: 'Employee Count',          backend_field: 'employee_count' },
  { group: 'Workforce',  ux_label: 'IT FTE Count',            backend_field: 'it_fte_count' },
  { group: 'Workforce',  ux_label: 'Contractor Count',        backend_field: 'contractor_count' },
  { group: 'Workforce',  ux_label: 'Contractor Spend',        backend_field: 'contractor_spend' },
  { group: 'Workforce',  ux_label: 'Outsourced Spend',        backend_field: 'outsourced_spend' },
  { group: 'Workforce',  ux_label: 'Internal Labor Spend',    backend_field: 'internal_labor_spend' },
  { group: 'Transform',  ux_label: 'Transformation Status',   backend_field: 'transformation_status' },
  { group: 'Transform',  ux_label: 'Transformation Type',     backend_field: 'transformation_type' },
  { group: 'Transform',  ux_label: 'Transformation Spend Est.',backend_field: 'transformation_spend_estimate' },
];

type DataMap = Partial<CompanyProfile & FiscalYear>;

/**
 * Returns the value for a field from a data object, handling null/undefined.
 */
function getFieldValue(data: DataMap | undefined | null, field: string): unknown {
  if (!data) return undefined;
  return (data as Record<string, unknown>)[field] ?? undefined;
}

/**
 * Determine whether a value is "present" (not null, not undefined, not empty string).
 */
function isPresent(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim().length === 0) return false;
  return true;
}

/**
 * Compare two values loosely for conflict detection.
 * Arrays are compared by sorted JSON. Numbers allow 1% tolerance.
 */
function valuesMatch(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!isPresent(a) || !isPresent(b)) return true; // missing is not a conflict

  // Numeric tolerance (1%)
  if (typeof a === 'number' && typeof b === 'number') {
    const avg = (Math.abs(a) + Math.abs(b)) / 2;
    if (avg === 0) return a === b;
    return Math.abs(a - b) / avg <= 0.01;
  }

  // Array / object comparison
  if (typeof a === 'object' || typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // String comparison (case-insensitive)
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase().trim() === b.toLowerCase().trim();
  }

  return String(a) === String(b);
}

/**
 * Source priority for "Best Available":
 *   File Drop > Wizard > Form
 * Other preferences lock to a single source.
 */
function pickSource(
  preference: IntakePreference,
  formVal: unknown,
  wizardVal: unknown,
  fileDropVal: unknown,
): { value: unknown; source: InputMode | null } {
  switch (preference) {
    case 'File Drop':
      return isPresent(fileDropVal)
        ? { value: fileDropVal, source: 'File Drop' }
        : { value: undefined, source: null };

    case 'Guided Wizard':
      return isPresent(wizardVal)
        ? { value: wizardVal, source: 'Wizard' }
        : { value: undefined, source: null };

    case 'Simple Form':
      return isPresent(formVal)
        ? { value: formVal, source: 'Form' }
        : { value: undefined, source: null };

    case 'Best Available':
    default:
      if (isPresent(fileDropVal)) return { value: fileDropVal, source: 'File Drop' };
      if (isPresent(wizardVal))   return { value: wizardVal,   source: 'Wizard' };
      if (isPresent(formVal))     return { value: formVal,     source: 'Form' };
      return { value: undefined, source: null };
  }
}

/**
 * Assign confidence based on source and conflict status.
 */
function assignConfidence(
  source: InputMode | null,
  hasConflict: boolean,
): ConfidenceLevel {
  if (!source) return 'Low';
  if (hasConflict) return 'Medium';
  if (source === 'File Drop') return 'High';
  if (source === 'Wizard') return 'High';
  return 'Medium'; // Form-only
}

/**
 * Resolve canonical values from up to three input sources.
 *
 * For each known field, the resolver:
 *   1. Reads the value from form, wizard, and file-drop data.
 *   2. Picks the winning value based on intake preference.
 *   3. Detects conflicts across sources (two+ present but different).
 *   4. Assigns a confidence level.
 */
export function resolveCanonicalValues(
  formData: DataMap,
  wizardData: DataMap,
  fileDropData: DataMap,
  preference: IntakePreference,
): CanonicalValue[] {
  const results: CanonicalValue[] = [];

  for (const def of FIELD_DEFINITIONS) {
    const formVal     = getFieldValue(formData,     def.backend_field);
    const wizardVal   = getFieldValue(wizardData,   def.backend_field);
    const fileDropVal = getFieldValue(fileDropData,  def.backend_field);

    // Detect conflicts: two or more sources present and disagreeing
    const presentValues = [
      { val: formVal,     label: 'Form' },
      { val: wizardVal,   label: 'Wizard' },
      { val: fileDropVal, label: 'File Drop' },
    ].filter((v) => isPresent(v.val));

    let hasConflict = false;
    if (presentValues.length >= 2) {
      for (let i = 1; i < presentValues.length; i++) {
        if (!valuesMatch(presentValues[0].val, presentValues[i].val)) {
          hasConflict = true;
          break;
        }
      }
    }

    const { value: finalValue, source: selectedSource } = pickSource(
      preference,
      formVal,
      wizardVal,
      fileDropVal,
    );

    const confidence = assignConfidence(selectedSource, hasConflict);

    let notes: string | null = null;
    if (hasConflict) {
      const sourceLabels = presentValues.map((v) => `${v.label}=${JSON.stringify(v.val)}`);
      notes = `Conflict detected: ${sourceLabels.join(' vs ')}. Using ${selectedSource ?? 'none'}.`;
    }

    results.push({
      group: def.group,
      ux_label: def.ux_label,
      backend_field: def.backend_field,
      form_value: formVal ?? null,
      wizard_value: wizardVal ?? null,
      file_drop_value: fileDropVal ?? null,
      final_value: finalValue ?? null,
      selected_source: selectedSource,
      conflict_flag: hasConflict ? 'Check' : 'OK',
      confidence,
      notes,
    });
  }

  return results;
}
