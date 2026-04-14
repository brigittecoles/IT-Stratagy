import type { CanonicalAnalysis } from '@/lib/schema/validation';
import type { DiagnosticLevel, ConfidenceLevel } from '@/lib/schema/value-lists';

export interface QualificationResult {
  level: DiagnosticLevel;
  missing_for_next: { level: string; fields: string[] }[];
  user_message: string;
  overall_confidence: ConfidenceLevel;
}

// ── Field requirements per diagnostic level ──

const QUICK_READ_FIELDS = [
  'company_name',
  'industry_gics_group',
  'revenue',
  'total_it_spend',
  'transformation_status',
] as const;

const STANDARD_ADDITIONAL_FIELDS = [
  'it_opex_spend',
  'it_capex_spend',
  'employee_count',
  'it_fte_count',
] as const;

const FULL_ADDITIONAL_FLAGS = [
  'detailed_file_available',
] as const;

const FULL_VR_ADDITIONAL_FLAGS = [
  'vendor_detail_available',
  'project_portfolio_file_available',
] as const;

/**
 * Safely retrieve a value from the canonical analysis, checking both
 * the company profile and the first fiscal year.
 */
function getAnalysisValue(analysis: CanonicalAnalysis, field: string): unknown {
  // Check company-level fields
  const companyVal = (analysis.company as Record<string, unknown>)[field];
  if (isPresent(companyVal)) return companyVal;

  // Check top-level flags
  const topVal = (analysis as Record<string, unknown>)[field];
  if (isPresent(topVal)) return topVal;

  // Check the first fiscal year (primary year for qualification)
  if (analysis.fiscal_years.length > 0) {
    const fyVal = (analysis.fiscal_years[0] as Record<string, unknown>)[field];
    if (isPresent(fyVal)) return fyVal;
  }

  return undefined;
}

function isPresent(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return true; // false is a valid present value
  if (typeof val === 'number') return true;
  if (typeof val === 'string' && val.trim().length === 0) return false;
  return true;
}

function findMissingFields(analysis: CanonicalAnalysis, fields: readonly string[]): string[] {
  return fields.filter((f) => !isPresent(getAnalysisValue(analysis, f)));
}

/**
 * Determine the highest diagnostic level the provided data qualifies for,
 * what fields are missing for each next level, and an overall confidence.
 *
 * Levels (cumulative):
 *   Quick Read          — company_name, industry, revenue, total_it_spend, transformation_status
 *   Standard Diagnostic — Quick Read + opex, capex, employee_count, it_fte_count
 *   Full Diagnostic     — Standard + detailed_file_available
 *   Full + VR           — Full + vendor_detail_available + project_portfolio_file_available
 */
export function determineQualification(analysis: CanonicalAnalysis): QualificationResult {
  const missingQuickRead = findMissingFields(analysis, QUICK_READ_FIELDS);
  const missingStandard  = findMissingFields(analysis, STANDARD_ADDITIONAL_FIELDS);
  const missingFull      = findMissingFields(analysis, FULL_ADDITIONAL_FLAGS);
  const missingFullVR    = findMissingFields(analysis, FULL_VR_ADDITIONAL_FLAGS);

  // Determine qualified level
  let level: DiagnosticLevel;

  if (missingQuickRead.length > 0) {
    // Cannot even run Quick Read
    level = 'Quick Read'; // lowest level, but will flag missing

    const missing_for_next: QualificationResult['missing_for_next'] = [];
    if (missingQuickRead.length > 0) {
      missing_for_next.push({ level: 'Quick Read', fields: missingQuickRead });
    }

    return {
      level,
      missing_for_next,
      user_message: buildMessage(null, missing_for_next),
      overall_confidence: 'Low',
    };
  }

  if (missingStandard.length === 0 && missingFull.length === 0 && missingFullVR.length === 0) {
    level = 'Full Diagnostic with Vendor + Roadmap Intelligence';
  } else if (missingStandard.length === 0 && missingFull.length === 0) {
    level = 'Full Diagnostic';
  } else if (missingStandard.length === 0) {
    level = 'Standard Diagnostic';
  } else {
    level = 'Quick Read';
  }

  // Build the "missing for next" ladder
  const missing_for_next: QualificationResult['missing_for_next'] = [];

  if (level === 'Quick Read' && missingStandard.length > 0) {
    missing_for_next.push({ level: 'Standard Diagnostic', fields: missingStandard });
  }
  if (level === 'Quick Read' || level === 'Standard Diagnostic') {
    if (missingFull.length > 0) {
      missing_for_next.push({ level: 'Full Diagnostic', fields: [...missingStandard, ...missingFull].filter(Boolean) });
    }
  }
  if (level !== 'Full Diagnostic with Vendor + Roadmap Intelligence') {
    if (missingFullVR.length > 0) {
      const allMissing = [...missingStandard, ...missingFull, ...missingFullVR].filter(
        (f, i, arr) => arr.indexOf(f) === i,
      );
      missing_for_next.push({
        level: 'Full Diagnostic with Vendor + Roadmap Intelligence',
        fields: allMissing,
      });
    }
  }

  // Overall confidence
  const overall_confidence = computeOverallConfidence(level, missing_for_next);

  return {
    level,
    missing_for_next,
    user_message: buildMessage(level, missing_for_next),
    overall_confidence,
  };
}

function computeOverallConfidence(
  level: DiagnosticLevel,
  missingForNext: QualificationResult['missing_for_next'],
): ConfidenceLevel {
  if (level === 'Full Diagnostic with Vendor + Roadmap Intelligence') return 'High';
  if (level === 'Full Diagnostic') return 'High';
  if (level === 'Standard Diagnostic') return 'Medium';
  return 'Low';
}

function buildMessage(
  qualifiedLevel: DiagnosticLevel | null,
  missingForNext: QualificationResult['missing_for_next'],
): string {
  if (!qualifiedLevel) {
    const fields = missingForNext[0]?.fields ?? [];
    return `Insufficient data for even a Quick Read. Please provide: ${fields.join(', ')}.`;
  }

  let msg = `Your data qualifies for a ${qualifiedLevel}.`;

  if (missingForNext.length > 0) {
    const next = missingForNext[0];
    msg += ` To unlock ${next.level}, please provide: ${next.fields.join(', ')}.`;
  }

  return msg;
}
