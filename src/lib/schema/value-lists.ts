// Controlled value lists — single source of truth for all enums
// Aligned to Product_Ready_Input_Dictionary_v2 Value_Lists sheet

export const GICS_GROUPS = [
  'Energy', 'Materials', 'Industrials', 'Consumer Discretionary',
  'Consumer Staples', 'Health Care', 'Financials',
  'Information Technology', 'Communication Services',
  'Utilities', 'Real Estate',
] as const;

export const BUSINESS_MODELS = [
  'Manufacturing', 'Distribution', 'Services', 'Software / SaaS',
  'Healthcare delivery', 'Healthcare payer', 'Financial services',
  'Retail / omnichannel', 'Hybrid / multi-model', 'Other',
] as const;

export const COMPLEXITY_LEVELS = ['Low', 'Moderate', 'High'] as const;

export const TRANSFORMATION_STATUS = ['Yes', 'No', 'Unsure'] as const;

export const TRANSFORMATION_TYPES = [
  'ERP', 'WMS', 'Cloud', 'Data', 'Cybersecurity',
  'AI', 'CRM', 'Network', 'Infrastructure', 'Other',
] as const;

export const FISCAL_YEAR_LABELS = [
  'Last Fiscal Year', 'Current Fiscal Year',
  'Assumption for Next Fiscal Year',
  'Assumption for Following Fiscal Year', 'Custom',
] as const;

export const DIAGNOSTIC_LEVELS = [
  'Quick Read', 'Standard Diagnostic', 'Full Diagnostic',
  'Full Diagnostic with Vendor + Roadmap Intelligence',
] as const;

export const PROVIDED_STATUS = [
  'Confirmed', 'Missing', 'Partial / Inferred',
] as const;

export const CONFIDENCE_LEVELS = ['High', 'Medium', 'Low'] as const;

// IT Spend Towers — Gartner-aligned cost taxonomy
// Used to classify vendor, application, and service spend into standard categories
export const IT_SPEND_TOWERS = [
  'Infrastructure & Operations',
  'Application Development & Support',
  'Enterprise Applications',
  'Security & Risk',
  'Data & Analytics',
  'End User Services',
  'Telecommunications',
  'IT Management & Strategy',
  'Unassigned',
] as const;

export const FILE_ZONES = [
  'IT Financials', 'IT Vendors',
  'IT FTEs and Contractors', 'Project Portfolio / Roadmap',
] as const;

export const PARSE_STATUS = [
  'Uploaded', 'Parsing', 'Extracted', 'Needs Review', 'Failed',
] as const;

export const INPUT_MODES = [
  'Form', 'Wizard', 'File Drop', 'File Drop Review', 'System',
] as const;

export const INTAKE_PREFERENCES = [
  'Best Available', 'Simple Form', 'Guided Wizard', 'File Drop',
] as const;

// Type exports
export type GicsGroup = typeof GICS_GROUPS[number];
export type BusinessModel = typeof BUSINESS_MODELS[number];
export type ComplexityLevel = typeof COMPLEXITY_LEVELS[number];
export type TransformationStatus = typeof TRANSFORMATION_STATUS[number];
export type TransformationType = typeof TRANSFORMATION_TYPES[number];
export type FiscalYearLabel = typeof FISCAL_YEAR_LABELS[number];
export type DiagnosticLevel = typeof DIAGNOSTIC_LEVELS[number];
export type ProvidedStatus = typeof PROVIDED_STATUS[number];
export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number];
export type FileZone = typeof FILE_ZONES[number];
export type ParseStatus = typeof PARSE_STATUS[number];
export type InputMode = typeof INPUT_MODES[number];
export type IntakePreference = typeof INTAKE_PREFERENCES[number];
export type ITSpendTower = typeof IT_SPEND_TOWERS[number];
