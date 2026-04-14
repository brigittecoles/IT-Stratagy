import type { CanonicalAnalysis } from '@/lib/schema/validation';
import type { DiagnosticLevel } from '@/lib/schema/value-lists';

export interface ReadinessResult {
  qualified_level: DiagnosticLevel;
  blockers: string[];
  missing_for_next: string[];
}

/**
 * N01 — Determine the qualified diagnostic level based on available data.
 *
 * Levels (cumulative):
 *   Quick Read:  company_name, industry_gics_group, revenue (current year),
 *                total_it_spend (current year), transformation_status
 *   Standard:    + it_opex_spend, it_capex_spend, employee_count, it_fte_count
 *   Full:        + at least one detailed file
 *   Full+VR:     + vendor file AND roadmap file
 */
export function evaluateReadiness(analysis: CanonicalAnalysis): ReadinessResult {
  const blockers: string[] = [];
  const missing_for_next: string[] = [];

  // --- Quick Read checks ---
  const currentYear = analysis.fiscal_years.find(
    (fy) => fy.fiscal_year_label === 'Current Fiscal Year'
  ) ?? analysis.fiscal_years[analysis.fiscal_years.length - 1];

  if (!analysis.company.company_name) {
    blockers.push('company_name is required');
  }
  if (!analysis.company.industry_gics_group) {
    blockers.push('industry_gics_group is required');
  }
  if (!currentYear?.revenue) {
    blockers.push('revenue is required for the current year');
  }
  if (!currentYear?.total_it_spend) {
    blockers.push('total_it_spend is required for the current year');
  }
  if (!currentYear?.transformation_status) {
    blockers.push('transformation_status is required for the current year');
  }

  if (blockers.length > 0) {
    return { qualified_level: 'Quick Read', blockers, missing_for_next: [] };
  }

  // --- Standard checks (on top of Quick Read) ---
  const standardMissing: string[] = [];

  if (currentYear.it_opex_spend == null) {
    standardMissing.push('it_opex_spend for current year');
  }
  if (currentYear.it_capex_spend == null) {
    standardMissing.push('it_capex_spend for current year');
  }
  if (currentYear.employee_count == null) {
    standardMissing.push('employee_count for current year');
  }
  if (currentYear.it_fte_count == null) {
    standardMissing.push('it_fte_count for current year');
  }

  if (standardMissing.length > 0) {
    return {
      qualified_level: 'Quick Read',
      blockers: [],
      missing_for_next: standardMissing,
    };
  }

  // --- Full checks (at least one detailed file) ---
  const hasDetailedFile = analysis.detailed_file_available === true;

  if (!hasDetailedFile) {
    return {
      qualified_level: 'Standard Diagnostic',
      blockers: [],
      missing_for_next: ['At least one detailed file upload is required for Full Diagnostic'],
    };
  }

  // --- Full+VR checks (vendor file AND roadmap file) ---
  const hasVendorFile = analysis.vendor_detail_available === true;
  const hasRoadmapFile = analysis.project_portfolio_file_available === true;

  const vrMissing: string[] = [];
  if (!hasVendorFile) {
    vrMissing.push('Vendor detail file is required');
  }
  if (!hasRoadmapFile) {
    vrMissing.push('Project portfolio / roadmap file is required');
  }

  if (vrMissing.length > 0) {
    return {
      qualified_level: 'Full Diagnostic',
      blockers: [],
      missing_for_next: vrMissing,
    };
  }

  return {
    qualified_level: 'Full Diagnostic with Vendor + Roadmap Intelligence',
    blockers: [],
    missing_for_next: [],
  };
}
