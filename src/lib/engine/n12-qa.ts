import type { QAResult, QACheck, QASeverity } from '@/lib/engine/types';
import type { CanonicalAnalysis } from '@/lib/schema/validation';
import type { ConfidenceLevel } from '@/lib/schema/value-lists';

/**
 * N12 — QA checks.
 * Runs 11 quality-assurance checks (Q01-Q11), rolls up confidence,
 * and determines whether the analysis can proceed.
 */
export function runQAChecks(analysis: CanonicalAnalysis): QAResult {
  const checks: QACheck[] = [
    q01_revenuePresent(analysis),
    q02_itSpendPresent(analysis),
    q03_opexCapexSum(analysis),
    q04_spendRatioReasonable(analysis),
    q05_multiYearConsistency(analysis),
    q06_employeeCountPresent(analysis),
    q07_transformationCoherence(analysis),
    q08_diagnosticLevelData(analysis),
    q09_duplicateYears(analysis),
    q10_negativeValues(analysis),
    q11_confidenceCoverage(analysis),
  ];

  const criticalFailures = checks.filter((c) => c.severity === 'Critical' && !c.passed).length;
  const warnings = checks.filter((c) => c.severity === 'Warning' && !c.passed).length;

  // Roll up confidence
  const confidenceReasons: string[] = [];
  let overallConfidence: ConfidenceLevel = 'High';

  if (criticalFailures > 0) {
    overallConfidence = 'Low';
    confidenceReasons.push(`${criticalFailures} critical check(s) failed.`);
  } else if (warnings >= 3) {
    overallConfidence = 'Low';
    confidenceReasons.push(`${warnings} warnings detected; data quality is uncertain.`);
  } else if (warnings >= 1) {
    overallConfidence = 'Medium';
    confidenceReasons.push(`${warnings} warning(s) detected; review recommended.`);
  } else {
    confidenceReasons.push('All checks passed.');
  }

  // Can proceed if no critical failures
  const canProceed = criticalFailures === 0;

  if (!canProceed) {
    confidenceReasons.push('Analysis cannot proceed until critical issues are resolved.');
  }

  return {
    checks,
    critical_failures: criticalFailures,
    warnings,
    overall_confidence: overallConfidence,
    confidence_reasons: confidenceReasons,
    can_proceed: canProceed,
  };
}

// ── Individual check implementations ──

function makeCheck(
  id: string,
  name: string,
  severity: QASeverity,
  passed: boolean,
  message: string,
): QACheck {
  return { check_id: id, check_name: name, severity, passed, message };
}

function getLatestYear(analysis: CanonicalAnalysis) {
  const sorted = [...analysis.fiscal_years].sort(
    (a, b) => b.fiscal_year_order - a.fiscal_year_order,
  );
  return sorted[0];
}

/** Q01: Revenue must be present for at least one year */
function q01_revenuePresent(analysis: CanonicalAnalysis): QACheck {
  const hasRevenue = analysis.fiscal_years.some((y) => y.revenue != null && y.revenue > 0);
  return makeCheck(
    'Q01',
    'Revenue Present',
    'Critical',
    hasRevenue,
    hasRevenue
      ? 'Revenue data found for at least one fiscal year.'
      : 'No revenue data provided. Revenue is required for KPI calculations.',
  );
}

/** Q02: Total IT spend must be present for at least one year */
function q02_itSpendPresent(analysis: CanonicalAnalysis): QACheck {
  const hasSpend = analysis.fiscal_years.some(
    (y) => y.total_it_spend != null && y.total_it_spend > 0,
  );
  return makeCheck(
    'Q02',
    'IT Spend Present',
    'Critical',
    hasSpend,
    hasSpend
      ? 'IT spend data found for at least one fiscal year.'
      : 'No IT spend data provided. Total IT spend is required for all analyses.',
  );
}

/** Q03: OpEx + CapEx should approximately equal total IT spend (within 5%) */
function q03_opexCapexSum(analysis: CanonicalAnalysis): QACheck {
  const latest = getLatestYear(analysis);
  if (
    latest?.total_it_spend == null ||
    latest?.it_opex_spend == null ||
    latest?.it_capex_spend == null
  ) {
    return makeCheck(
      'Q03',
      'OpEx + CapEx = IT Spend',
      'Warning',
      true,
      'Cannot verify OpEx/CapEx sum; one or more values not provided.',
    );
  }

  const sum = latest.it_opex_spend + latest.it_capex_spend;
  const diff = Math.abs(sum - latest.total_it_spend);
  const tolerance = latest.total_it_spend * 0.05;
  const passed = diff <= tolerance;

  return makeCheck(
    'Q03',
    'OpEx + CapEx = IT Spend',
    'Warning',
    passed,
    passed
      ? `OpEx + CapEx equals IT spend within 5% tolerance (diff: $${diff.toLocaleString()}).`
      : `OpEx ($${latest.it_opex_spend.toLocaleString()}) + CapEx ($${latest.it_capex_spend.toLocaleString()}) = $${sum.toLocaleString()}, but total IT spend is $${latest.total_it_spend.toLocaleString()}. Difference: $${diff.toLocaleString()}.`,
  );
}

/** Q04: IT spend / revenue ratio should be between 0.5% and 15% */
function q04_spendRatioReasonable(analysis: CanonicalAnalysis): QACheck {
  const latest = getLatestYear(analysis);
  if (latest?.total_it_spend == null || latest?.revenue == null || latest.revenue <= 0) {
    return makeCheck(
      'Q04',
      'Spend Ratio Reasonable',
      'Warning',
      true,
      'Cannot verify spend ratio; revenue or IT spend not available.',
    );
  }

  const ratio = latest.total_it_spend / latest.revenue;
  const passed = ratio >= 0.005 && ratio <= 0.15;

  return makeCheck(
    'Q04',
    'Spend Ratio Reasonable',
    'Warning',
    passed,
    passed
      ? `IT spend / revenue ratio is ${(ratio * 100).toFixed(1)}%, within expected range (0.5-15%).`
      : `IT spend / revenue ratio is ${(ratio * 100).toFixed(1)}%, which is outside the expected range of 0.5-15%. Please verify the inputs.`,
  );
}

/** Q05: Multi-year data should not show >50% YoY swings without transformation */
function q05_multiYearConsistency(analysis: CanonicalAnalysis): QACheck {
  const years = [...analysis.fiscal_years]
    .filter((y) => y.total_it_spend != null && y.total_it_spend > 0)
    .sort((a, b) => a.fiscal_year_order - b.fiscal_year_order);

  if (years.length < 2) {
    return makeCheck(
      'Q05',
      'Multi-Year Consistency',
      'Info',
      true,
      'Only one year of data; multi-year consistency check skipped.',
    );
  }

  const bigSwings: string[] = [];
  for (let i = 1; i < years.length; i++) {
    const prev = years[i - 1].total_it_spend!;
    const curr = years[i].total_it_spend!;
    const changePct = Math.abs((curr - prev) / prev);
    if (changePct > 0.50) {
      bigSwings.push(
        `${years[i - 1].fiscal_year_label} to ${years[i].fiscal_year_label}: ${(changePct * 100).toFixed(0)}% change`,
      );
    }
  }

  const passed = bigSwings.length === 0;
  return makeCheck(
    'Q05',
    'Multi-Year Consistency',
    'Warning',
    passed,
    passed
      ? 'Year-over-year IT spend changes are within expected range.'
      : `Large YoY swings detected: ${bigSwings.join('; ')}. Verify these are expected (e.g., transformation).`,
  );
}

/** Q06: Employee count should be present for workforce metrics */
function q06_employeeCountPresent(analysis: CanonicalAnalysis): QACheck {
  const hasEmployees = analysis.fiscal_years.some(
    (y) => y.employee_count != null && y.employee_count > 0,
  );
  return makeCheck(
    'Q06',
    'Employee Count Present',
    'Info',
    hasEmployees,
    hasEmployees
      ? 'Employee count data found; workforce metrics can be calculated.'
      : 'No employee count provided. Workforce metrics will be skipped.',
  );
}

/** Q07: Transformation fields should be coherent */
function q07_transformationCoherence(analysis: CanonicalAnalysis): QACheck {
  const yearsWithTransformation = analysis.fiscal_years.filter(
    (y) => y.transformation_status === 'Yes',
  );

  if (yearsWithTransformation.length === 0) {
    return makeCheck(
      'Q07',
      'Transformation Coherence',
      'Info',
      true,
      'No transformation indicated; coherence check not applicable.',
    );
  }

  const issues: string[] = [];
  for (const y of yearsWithTransformation) {
    if (!y.transformation_type || y.transformation_type.length === 0) {
      issues.push(`${y.fiscal_year_label}: transformation status is Yes but no type specified.`);
    }
  }

  const passed = issues.length === 0;
  return makeCheck(
    'Q07',
    'Transformation Coherence',
    'Warning',
    passed,
    passed
      ? 'Transformation data is coherent across all applicable years.'
      : `Transformation coherence issues: ${issues.join(' ')}`,
  );
}

/** Q08: Data sufficiency for requested diagnostic level */
function q08_diagnosticLevelData(analysis: CanonicalAnalysis): QACheck {
  const level = analysis.controls.target_diagnostic_level;
  const latest = getLatestYear(analysis);
  const issues: string[] = [];

  if (level === 'Standard Diagnostic' || level === 'Full Diagnostic' || level === 'Full Diagnostic with Vendor + Roadmap Intelligence') {
    // Standard+ needs OpEx/CapEx split
    if (latest?.it_opex_spend == null || latest?.it_capex_spend == null) {
      issues.push('OpEx/CapEx split required for Standard Diagnostic and above.');
    }
  }

  if (level === 'Full Diagnostic' || level === 'Full Diagnostic with Vendor + Roadmap Intelligence') {
    // Full needs workforce data
    if (!analysis.fiscal_years.some((y) => y.it_fte_count != null)) {
      issues.push('IT FTE count required for Full Diagnostic.');
    }
  }

  if (level === 'Full Diagnostic with Vendor + Roadmap Intelligence') {
    if (!analysis.vendor_detail_available) {
      issues.push('Vendor detail file required for Full Diagnostic with Vendor + Roadmap Intelligence.');
    }
    if (!analysis.project_portfolio_file_available) {
      issues.push('Project portfolio file required for Full Diagnostic with Vendor + Roadmap Intelligence.');
    }
  }

  const passed = issues.length === 0;
  return makeCheck(
    'Q08',
    'Diagnostic Level Data Sufficiency',
    'Warning',
    passed,
    passed
      ? `Data sufficient for requested level: ${level}.`
      : `Insufficient data for ${level}: ${issues.join(' ')}`,
  );
}

/** Q09: No duplicate fiscal year orders */
function q09_duplicateYears(analysis: CanonicalAnalysis): QACheck {
  const orders = analysis.fiscal_years.map((y) => y.fiscal_year_order);
  const uniqueOrders = new Set(orders);
  const passed = uniqueOrders.size === orders.length;

  return makeCheck(
    'Q09',
    'No Duplicate Fiscal Years',
    'Critical',
    passed,
    passed
      ? 'No duplicate fiscal year orders detected.'
      : `Duplicate fiscal year orders found: ${orders.filter((o, i) => orders.indexOf(o) !== i).join(', ')}.`,
  );
}

/** Q10: No negative values in financial fields */
function q10_negativeValues(analysis: CanonicalAnalysis): QACheck {
  const negatives: string[] = [];

  for (const y of analysis.fiscal_years) {
    if (y.revenue != null && y.revenue < 0) negatives.push(`${y.fiscal_year_label}: revenue`);
    if (y.total_it_spend != null && y.total_it_spend < 0) negatives.push(`${y.fiscal_year_label}: total_it_spend`);
    if (y.it_opex_spend != null && y.it_opex_spend < 0) negatives.push(`${y.fiscal_year_label}: it_opex_spend`);
    if (y.it_capex_spend != null && y.it_capex_spend < 0) negatives.push(`${y.fiscal_year_label}: it_capex_spend`);
  }

  const passed = negatives.length === 0;
  return makeCheck(
    'Q10',
    'No Negative Financial Values',
    'Critical',
    passed,
    passed
      ? 'No negative financial values detected.'
      : `Negative values found: ${negatives.join('; ')}.`,
  );
}

/** Q11: Confidence coverage — at least some fields have usable data */
function q11_confidenceCoverage(analysis: CanonicalAnalysis): QACheck {
  const latest = getLatestYear(analysis);
  let filledFields = 0;
  let totalFields = 0;

  const checkField = (val: unknown) => {
    totalFields++;
    if (val != null) filledFields++;
  };

  if (latest) {
    checkField(latest.revenue);
    checkField(latest.total_it_spend);
    checkField(latest.it_opex_spend);
    checkField(latest.it_capex_spend);
    checkField(latest.it_da_spend);
    checkField(latest.employee_count);
    checkField(latest.it_fte_count);
    checkField(latest.contractor_count);
  }

  const coverage = totalFields > 0 ? filledFields / totalFields : 0;
  const passed = coverage >= 0.25; // At least 25% of fields populated

  return makeCheck(
    'Q11',
    'Data Coverage',
    'Info',
    passed,
    passed
      ? `Data coverage: ${(coverage * 100).toFixed(0)}% of core fields populated (${filledFields}/${totalFields}).`
      : `Low data coverage: only ${(coverage * 100).toFixed(0)}% of core fields populated. Results will have low confidence.`,
  );
}
