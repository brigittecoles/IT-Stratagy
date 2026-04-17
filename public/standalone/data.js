'use strict';

// Mirrors src/lib/schema/value-lists.ts
const GICS_GROUPS = ['Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Financials','Information Technology','Communication Services','Utilities','Real Estate'];
const BUSINESS_MODELS = ['Manufacturing','Distribution','Services','Software / SaaS','Healthcare delivery','Healthcare payer','Financial services','Retail / omnichannel','Hybrid / multi-model','Other'];
const COMPLEXITY_LEVELS = ['Low','Moderate','High'];
const TRANSFORMATION_STATUS = ['Yes','No','Unsure'];
const TRANSFORMATION_TYPES = ['ERP','WMS','Cloud','Data','Cybersecurity','AI','CRM','Network','Infrastructure','Other'];
const FISCAL_YEAR_LABELS = ['Last Fiscal Year','Current Fiscal Year','Assumption for Next Fiscal Year','Assumption for Following Fiscal Year','Custom'];
const FILE_ZONES = ['IT Financials','IT Vendors','IT FTEs and Contractors','Project Portfolio / Roadmap'];
const DIAGNOSTIC_LEVELS = [
  'Quick Read',
  'Standard Diagnostic',
  'Full Diagnostic',
  'Full Diagnostic with Vendor + Roadmap Intelligence',
];
const LEVEL_DESCRIPTIONS = {
  'Quick Read': 'High-level IT spend benchmarks. Requires minimal data.',
  'Standard Diagnostic': 'Spend, staffing, and transformation benchmarks with peer comparisons.',
  'Full Diagnostic': 'Comprehensive analysis including vendor concentration and roadmap assessment.',
  'Full Diagnostic with Vendor + Roadmap Intelligence': 'Everything plus detailed vendor and project portfolio intelligence.',
};

// Intake mode cards — from src/app/analysis/new/page.tsx
const INTAKE_MODES = [
  {
    key: 'form',
    title: 'Simple Form',
    description: 'Enter your numbers directly',
    detail: 'Best when you have IT spend figures, headcounts, and revenue numbers ready. Fastest path to a diagnostic.',
    badge: 'Fastest',
    badgeClass: 'wm-badge-neutral',
    iconPath: '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  },
  {
    key: 'wizard',
    title: 'Guided Wizard',
    description: 'Answer plain-language questions',
    detail: 'We walk you through each data point with context and guidance. Great if you are unsure what numbers to provide.',
    badge: 'Recommended',
    badgeClass: 'wm-badge-accent',
    iconPath: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M7 9h10"/><path d="M7 13h6"/>',
  },
  {
    key: 'file-drop',
    title: 'File Drop',
    description: 'Upload your data files',
    detail: 'Upload IT budgets, vendor lists, org charts, or project portfolios. Our parser will extract the key data points.',
    badge: 'Most data',
    badgeClass: 'wm-badge-neutral',
    iconPath: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  },
];

// Wizard questions — mirrors src/app/analysis/[id]/wizard/page.tsx
const WIZARD_QUESTIONS = [
  { id:'company_name', step:1, stepLabel:'Company Profile', prompt:'What is the name of the company?', type:'text', required:true },
  { id:'industry', step:1, stepLabel:'Company Profile', prompt:'Which GICS industry sector best describes this company?', type:'select', options:GICS_GROUPS, required:true },
  { id:'business_model', step:1, stepLabel:'Company Profile', prompt:'What is the primary business model?', helpText:'You can skip this if unsure.', type:'select', options:BUSINESS_MODELS },
  { id:'regulatory_complexity', step:1, stepLabel:'Company Profile', prompt:'How would you rate regulatory complexity?', type:'select', options:COMPLEXITY_LEVELS },
  { id:'operating_complexity', step:1, stepLabel:'Company Profile', prompt:'How would you rate operating complexity?', type:'select', options:COMPLEXITY_LEVELS },
  { id:'pricing_complexity', step:1, stepLabel:'Company Profile', prompt:'How would you rate pricing / premium complexity?', type:'select', options:COMPLEXITY_LEVELS },
  { id:'fiscal_year_label', step:2, stepLabel:'Financial Baseline', prompt:'Which fiscal year does this data represent?', type:'select', options:FISCAL_YEAR_LABELS, required:true },
  { id:'revenue', step:2, stepLabel:'Financial Baseline', prompt:'What is the annual revenue?', helpText:'Enter in USD.', type:'currency', required:true },
  { id:'total_it_spend', step:2, stepLabel:'Financial Baseline', prompt:'What is the total IT spend?', type:'currency', required:true },
  { id:'it_opex', step:2, stepLabel:'Financial Baseline', prompt:'What is the IT operating expenditure (OpEx)?', helpText:"Skip if you don't have this breakdown.", type:'currency' },
  { id:'it_capex', step:2, stepLabel:'Financial Baseline', prompt:'What is the IT capital expenditure (CapEx)?', type:'currency' },
  { id:'it_da', step:2, stepLabel:'Financial Baseline', prompt:'What is the IT depreciation and amortization (D&A)?', type:'currency' },
  { id:'has_prior_year', step:3, stepLabel:'Prior Year', prompt:'Do you have prior year financial data to provide?', helpText:'This enables trend analysis but is optional.', type:'boolean' },
  { id:'employee_count', step:4, stepLabel:'Workforce', prompt:'What is the total employee count?', type:'number', required:true },
  { id:'it_fte_count', step:4, stepLabel:'Workforce', prompt:'How many IT FTEs (full-time equivalents)?', type:'number', required:true },
  { id:'contractor_count', step:4, stepLabel:'Workforce', prompt:'How many IT contractors?', helpText:'Skip if unknown.', type:'number' },
  { id:'contractor_spend', step:4, stepLabel:'Workforce', prompt:'What is the total contractor spend?', type:'currency' },
  { id:'transformation_status', step:5, stepLabel:'Transformation', prompt:'Is a major transformation program currently active?', type:'select', options:TRANSFORMATION_STATUS },
  { id:'transformation_types', step:5, stepLabel:'Transformation', prompt:'What types of transformation are underway?', helpText:'Select all that apply.', type:'multiselect', options:TRANSFORMATION_TYPES },
  { id:'transformation_spend', step:5, stepLabel:'Transformation', prompt:'What is the estimated transformation spend?', type:'currency' },
  { id:'roadmap_available', step:5, stepLabel:'Transformation', prompt:'Is a technology roadmap available for upload?', type:'boolean' },
  { id:'has_files', step:6, stepLabel:'File Upload', prompt:'Do you have supporting files (financials, vendor lists, org charts, roadmaps) to upload?', helpText:'You can upload files after completing the wizard.', type:'boolean' },
];
const WIZARD_TOTAL_STEPS = 6;

// Form steps — mirrors src/app/analysis/[id]/form/page.tsx
const FORM_STEPS = [
  { label: 'Company Profile', key: 'company' },
  { label: 'Financial Baseline', key: 'financial' },
  { label: 'Prior Year', key: 'prior', optional: true },
  { label: 'Workforce', key: 'workforce' },
  { label: 'Transformation', key: 'transformation' },
  { label: 'File Upload', key: 'files', optional: true },
];

// File Drop steps — mirrors src/app/analysis/[id]/file-drop/page.tsx
const FILEDROP_STEPS = [
  { key: 'upload', label: 'Upload Files' },
  { key: 'company', label: 'Company Profile' },
  { key: 'review', label: 'Review & Submit' },
];

// Utilities
const $  = (s, root) => (root || document).querySelector(s);
const $$ = (s, root) => (root || document).querySelectorAll(s);
const fmtNum = (n) => (n == null || n === '') ? '' : Number(n).toLocaleString('en-US');
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function parseInt10(s) { const c = String(s).replace(/[^0-9]/g,''); return c ? parseInt(c, 10) : null; }
function parseFloat10(s) { const c = String(s).replace(/[^0-9.]/g,''); return c ? parseFloat(c) : null; }

// SVG path helpers (lucide-react shapes)
const SVG = {
  back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  chevL: '<polyline points="15 18 9 12 15 6"/>',
  chevR: '<polyline points="9 18 15 12 9 6"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  fileSheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
};
function icoSvg(path, cls) {
  return `<svg ${cls?`class="${cls}"`:''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
