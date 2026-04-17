'use strict';

// ══════════════════════════════════════════════════════════════
// View: Review — mirrors src/app/analysis/[id]/review/page.tsx
// ══════════════════════════════════════════════════════════════
function renderReviewView() {
  // Build review rows from whatever the user has entered in form/wizard/filedrop
  const src = gatherIntakeForReview();
  const rows = buildReviewRows(src);
  const confirmed = rows.filter(r => r.provided === 'Confirmed').length;
  const missing = rows.length - confirmed;
  const level = qualifyFromRows(rows);
  const companyName = src.company.company_name || 'Unnamed Analysis';

  const host = document.getElementById('view-review');
  host.innerHTML = `
    <button class="back-link" data-view="new" type="button">
      ${icoSvg(SVG.back)}
      Back to New Analysis
    </button>
    <div style="margin-top:16px">
      <span class="wm-overline">Review</span>
      <h1 class="page-title">Review: ${escapeHtml(companyName)}</h1>
      <p class="page-sub">Review your inputs before running the analysis. ${confirmed} confirmed, ${missing} missing.</p>
    </div>

    <div class="panel" style="margin-top:24px">
      <div class="row-between" style="margin-bottom:12px">
        <div>
          <span class="wm-overline">Qualification</span>
          <h3 style="margin:4px 0 0;font-size:18px">Qualified for: ${escapeHtml(level)}</h3>
        </div>
        <span class="wm-badge wm-badge-primary">${escapeHtml(level)}</span>
      </div>
      <p class="panel-sub" style="margin:0">Data quality sufficient for this diagnostic depth. Add more fields to unlock higher levels.</p>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="row" style="color:var(--wm-navy);margin-bottom:12px">
        ${icoSvg(SVG.fileSheet)}
        <h3 style="margin:0;font-size:16px">Confirmed Input Summary</h3>
      </div>
      <div style="overflow-x:auto">
        <table class="review-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Required for</th>
              <th>Status</th>
              <th>Value</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.metric_name)}</td>
                <td class="tdim">${escapeHtml(r.required_for_level)}</td>
                <td>
                  <span class="pill ${r.provided === 'Confirmed' ? 'pill-ok' : 'pill-miss'}">${r.provided}</span>
                </td>
                <td class="tmono">${r.value_preview ? escapeHtml(r.value_preview) : '—'}</td>
                <td class="tdim">${escapeHtml(r.confidence)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="action-bar">
      <div>
        <div style="font-size:13px;font-weight:600">Ready to run?</div>
        <div style="font-size:12px;color:var(--muted-foreground)">Your data qualifies for <strong>${escapeHtml(level)}</strong>.</div>
      </div>
      <button class="btn btn-primary" id="review-run">
        ${icoSvg(SVG.chevR)}
        Confirm &amp; Run Analysis
      </button>
    </div>
  `;
  $('#review-run', host).onclick = () => showView('results');
}

// Collect intake from whichever path the user went down
function gatherIntakeForReview() {
  // Prefer form data if present, otherwise use wizard answers
  const f = state.formData;
  if (f && (f.company.company_name || f.currentYear.revenue)) {
    return {
      company: f.company,
      fy: f.currentYear,
      workforce: f.workforce,
      transformation: f.transformation,
    };
  }
  const a = state.answers || {};
  // If file-drop was used, use fdCompany + fdParsed
  if (state.fdCompany && (state.fdCompany.company_name || Object.keys(state.fdParsed || {}).length)) {
    return {
      company: state.fdCompany,
      fy: state.fdParsed || {},
      workforce: state.fdParsed || {},
      transformation: {
        transformation_status: state.fdParsed?.transformation_status,
        transformation_spend_estimate: state.fdParsed?.transformation_spend_estimate,
      },
    };
  }
  // Otherwise wizard
  return {
    company: {
      company_name: a.company_name,
      industry_gics_group: a.industry,
      business_model: a.business_model,
      regulatory_complexity: a.regulatory_complexity,
      operating_complexity: a.operating_complexity,
      pricing_premium_complexity: a.pricing_complexity,
    },
    fy: {
      revenue: a.revenue,
      total_it_spend: a.total_it_spend,
      it_opex_spend: a.it_opex,
      it_capex_spend: a.it_capex,
      it_da_spend: a.it_da,
    },
    workforce: {
      employee_count: a.employee_count,
      it_fte_count: a.it_fte_count,
      contractor_count: a.contractor_count,
      contractor_spend: a.contractor_spend,
    },
    transformation: {
      transformation_status: a.transformation_status,
      transformation_type: a.transformation_types,
      transformation_spend_estimate: a.transformation_spend,
      roadmap_available: a.roadmap_available,
    },
  };
}

function buildReviewRows(src) {
  const { company, fy, workforce, transformation } = src;
  const rows = [];
  const add = (name, level, value) => {
    const provided = value != null && value !== '' && !(Array.isArray(value) && value.length === 0) ? 'Confirmed' : 'Missing';
    const confidence = provided === 'Confirmed' ? 'High' : 'Low';
    let preview = null;
    if (provided === 'Confirmed') {
      if (typeof value === 'number') {
        preview = value >= 1000 ? '$' + (value/1e6).toFixed(1) + 'M' : fmtNum(value);
      } else if (Array.isArray(value)) {
        preview = value.join(', ');
      } else if (typeof value === 'boolean') {
        preview = value ? 'Yes' : 'No';
      } else {
        preview = String(value);
      }
    }
    rows.push({ metric_name: name, required_for_level: level, provided, confidence, value_preview: preview });
  };
  add('Company name', 'Quick Read', company.company_name);
  add('Industry (GICS group)', 'Quick Read', company.industry_gics_group);
  add('Business model', 'Standard Diagnostic', company.business_model);
  add('Regulatory complexity', 'Standard Diagnostic', company.regulatory_complexity);
  add('Operating complexity', 'Standard Diagnostic', company.operating_complexity);
  add('Pricing complexity', 'Standard Diagnostic', company.pricing_premium_complexity);
  add('Revenue', 'Quick Read', fy.revenue);
  add('Total IT spend', 'Quick Read', fy.total_it_spend);
  add('IT OpEx spend', 'Standard Diagnostic', fy.it_opex_spend);
  add('IT CapEx spend', 'Standard Diagnostic', fy.it_capex_spend);
  add('Employee count', 'Standard Diagnostic', workforce.employee_count);
  add('IT FTE count', 'Standard Diagnostic', workforce.it_fte_count);
  add('Contractor count', 'Full Diagnostic', workforce.contractor_count);
  add('Contractor spend', 'Full Diagnostic', workforce.contractor_spend);
  add('Transformation active?', 'Quick Read', transformation.transformation_status);
  add('Transformation type(s)', 'Standard Diagnostic', transformation.transformation_type);
  add('Transformation spend estimate', 'Full Diagnostic', transformation.transformation_spend_estimate);
  add('Roadmap available?', 'Full Diagnostic', transformation.roadmap_available);
  return rows;
}

function qualifyFromRows(rows) {
  const has = (name) => rows.find(r => r.metric_name === name && r.provided === 'Confirmed');
  const quickRead = has('Company name') && has('Industry (GICS group)') && has('Revenue') && has('Total IT spend') && has('Transformation active?');
  const standard = quickRead && has('IT OpEx spend') && has('IT CapEx spend') && has('Employee count') && has('IT FTE count');
  if (standard) return 'Standard Diagnostic';
  if (quickRead) return 'Quick Read';
  return 'Incomplete';
}

// ══════════════════════════════════════════════════════════════
// View: Results — mirrors src/app/analysis/[id]/results/page.tsx
// Uses demo data since the real engine doesn't run client-side.
// ══════════════════════════════════════════════════════════════
const RESULTS_TABS = [
  { id: 'summary', label: 'Summary', iconPath: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>' },
  { id: 'benchmark', label: 'Benchmark', iconPath: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' },
  { id: 'opportunities', label: 'Opportunities', iconPath: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
  { id: 'findings', label: 'Findings', iconPath: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>' },
  { id: 'caveats', label: 'Caveats & QA', iconPath: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  { id: 'export', label: 'Export', iconPath: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
];

function renderResultsView() {
  const companyName = (gatherIntakeForReview().company.company_name) || 'Acme Corp';
  state.resultsTab = state.resultsTab || 'summary';

  const host = document.getElementById('view-results');
  host.innerHTML = `
    <button class="back-link" data-view="review" type="button">
      ${icoSvg(SVG.back)}
      Back to Review
    </button>
    <div style="margin-top:16px">
      <span class="wm-overline">Results</span>
      <h1 class="page-title">Analysis Results</h1>
      <p class="page-sub">IT Strategy Diagnostic for ${escapeHtml(companyName)} — Standard Diagnostic</p>
    </div>
    <div class="tabs-nav" id="results-tabs"></div>
    <div id="results-body" style="margin-top:24px"></div>
  `;
  renderResultsTabs();
  renderResultsBody(companyName);
}

function renderResultsTabs() {
  const host = $('#results-tabs');
  host.innerHTML = '';
  for (const t of RESULTS_TABS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn' + (state.resultsTab === t.id ? ' active' : '');
    btn.innerHTML = `${icoSvg(t.iconPath)} <span>${escapeHtml(t.label)}</span>`;
    btn.onclick = () => {
      state.resultsTab = t.id;
      renderResultsTabs();
      renderResultsBody();
    };
    host.appendChild(btn);
  }
}

// Demo results data — approximates what the engine returns
const DEMO_RESULTS = {
  kpis: [
    { label: 'IT Spend % Revenue', value: '3.6%', delta: '+0.8pp vs median' },
    { label: 'IT Spend per Employee', value: '$11.5K', delta: '-$2.1K vs median' },
    { label: 'IT FTE %', value: '1.6%', delta: '+0.2pp vs median' },
    { label: 'OpEx / CapEx Split', value: '70 / 30', delta: 'in line with peers' },
  ],
  yoy: { it: '+6.3%', rev: '+4.1%', comp: 'IT outpacing revenue' },
  gaps: [
    { metric: 'IT Spend % Revenue', actualFmt: '3.6%', medianFmt: '2.8%', gapPct: 0.008, gapDollars: 4040000 },
    { metric: 'IT Spend per Employee', actualFmt: '$11.5K', medianFmt: '$13.6K', gapPct: -0.154, gapDollars: -3360000 },
    { metric: 'IT FTE %', actualFmt: '1.6%', medianFmt: '1.4%', gapPct: 0.002, gapDollars: 320000 },
    { metric: 'Transformation Spend %', actualFmt: '25.5%', medianFmt: '18.0%', gapPct: 0.075, gapDollars: 3780000 },
  ],
  opportunities: [
    { name: 'Cloud cost optimization', low: 850000, base: 1400000, high: 2100000, confidence: 'High' },
    { name: 'Vendor rationalization', low: 600000, base: 1100000, high: 1800000, confidence: 'Medium' },
    { name: 'Automation / RPA', low: 300000, base: 650000, high: 1200000, confidence: 'Medium' },
    { name: 'Application sunsetting', low: 200000, base: 450000, high: 900000, confidence: 'Low' },
  ],
  findings: [
    'IT spend as a share of revenue is running 0.8 pp above the industry median, driven primarily by transformation-period elevation rather than steady-state overspend.',
    'IT spend per employee is 15% below median, suggesting an undercapitalized end-user services posture that may constrain productivity gains.',
    'Transformation spend share (25.5%) is well above the 18% median, consistent with an active ERP/Cloud modernization program rolling off in the next 18 months.',
    'OpEx/CapEx mix is in line with peers; no immediate rebalancing indicated.',
  ],
  whyItMatters: 'The elevated transformation spend is a temporary signal — the steady-state cost base is closer to industry norms than the headline IT/Revenue ratio suggests. Planning reinvestment (or return) of transformation-period dollars is the highest-leverage strategic decision over the next 12 months.',
  recommendations: [
    { title: 'Cloud cost optimization', priority: 'High', value: '$850K - $2.1M', confidence: 'High', description: 'Right-size reserved instances and implement FinOps practices. Tagging and budget alerts can recover 10-15% of cloud spend within two quarters.' },
    { title: 'Vendor rationalization', priority: 'Medium', value: '$600K - $1.8M', confidence: 'Medium', description: 'Consolidate overlapping SaaS tools, particularly in collaboration and security. Initial inventory shows ~15% redundancy.' },
    { title: 'Automation / RPA', priority: 'Medium', value: '$300K - $1.2M', confidence: 'Medium', description: 'Target manual finance and HR processes first; payback typically inside 12 months with internal labor savings.' },
    { title: 'Application sunsetting', priority: 'Low', value: '$200K - $900K', confidence: 'Low', description: 'Retire legacy apps identified in roadmap. Dependency mapping needed before committing dates.' },
  ],
  qa: {
    confidence: 'Medium',
    statement: 'Results are directionally reliable. Some supporting workforce data was inferred from defaults — add contractor detail to raise confidence.',
    checks: [
      { name: 'Revenue vs IT spend sanity', msg: 'Ratio within 0.5x–10x of industry median — looks plausible.', passed: true, severity: 'Info' },
      { name: 'OpEx + CapEx equals total', msg: 'Breakdown sums to 100% of reported total IT spend.', passed: true, severity: 'Info' },
      { name: 'IT FTE coverage', msg: 'IT FTEs count provided but contractor split missing — using industry ratio as fallback.', passed: false, severity: 'Warning' },
      { name: 'Benchmark data availability', msg: 'All four core KPIs matched Gartner 2026 industry percentiles.', passed: true, severity: 'Info' },
      { name: 'Transformation elevation factor applied', msg: 'Active transformation detected — baseline adjusted by -7%.', passed: true, severity: 'Info' },
    ],
    caveats: [
      'Contractor spend was estimated using industry ratio (~12% of labor) — confirm for precision.',
      'Benchmarks use Gartner 2026 midpoint values; actual peer distributions may differ.',
      'Opportunity ranges are illustrative; final business cases require detailed workstream scoping.',
    ],
  },
};

function renderResultsBody(companyName) {
  const host = $('#results-body');
  const data = DEMO_RESULTS;
  if (!companyName) companyName = (gatherIntakeForReview().company.company_name) || 'Acme Corp';

  if (state.resultsTab === 'summary') {
    host.innerHTML = `
      <div class="panel">
        <div class="row-between" style="margin-bottom:8px">
          <div>
            <span class="wm-overline">Executive Summary</span>
            <h3 style="margin:4px 0 0;font-size:18px">${escapeHtml(companyName)}</h3>
          </div>
          <span class="wm-badge wm-badge-primary">Standard Diagnostic</span>
        </div>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.65;color:var(--foreground)">
          ${escapeHtml(companyName)}'s IT spend is 3.6% of revenue, 0.8 percentage points above the industry median. This elevation reflects an active transformation program rather than steady-state overspend. Base-case opportunity identification totals <strong>$3.6M across four initiatives</strong> with high confidence on cloud cost optimization. Overall confidence is <strong>Medium</strong> — adding contractor breakdown and vendor detail would raise it.
        </p>
      </div>
      <div class="kpi-grid" style="margin-top:16px">
        ${data.kpis.map(k => `
          <div class="panel">
            <span class="wm-overline">${escapeHtml(k.label)}</span>
            <div class="kpi-val">${escapeHtml(k.value)}</div>
            <div class="kpi-delta">${escapeHtml(k.delta)}</div>
          </div>
        `).join('')}
      </div>
      <div class="panel" style="margin-top:16px">
        <span class="wm-overline">Year-over-Year</span>
        <h3 style="margin:4px 0 16px;font-size:16px">Trend Analysis</h3>
        <div class="yoy-grid">
          <div>
            <div class="ydim">IT Spend Change</div>
            <div class="ybig" style="color:var(--wm-magenta)">${escapeHtml(data.yoy.it)}</div>
          </div>
          <div>
            <div class="ydim">Revenue Change</div>
            <div class="ybig" style="color:var(--wm-magenta)">${escapeHtml(data.yoy.rev)}</div>
          </div>
          <div>
            <div class="ydim">Comparison</div>
            <div class="ymed">${escapeHtml(data.yoy.comp)}</div>
          </div>
        </div>
      </div>
    `;
  } else if (state.resultsTab === 'benchmark') {
    host.innerHTML = `
      <div class="panel">
        <span class="wm-overline">Benchmark</span>
        <h3 style="margin:4px 0 4px;font-size:16px">Core KPIs vs Industry Percentiles</h3>
        <p class="panel-sub">Vertical reference shows P10/P25/Median/P75/P90 bounds</p>
        <div class="bench-chart" id="bench-chart"></div>
      </div>
      <div class="panel" style="margin-top:16px">
        <span class="wm-overline">Benchmark</span>
        <h3 style="margin:4px 0 4px;font-size:16px">Gap Analysis Detail</h3>
        <p class="panel-sub">Dollar and percentage gaps vs benchmark tiers</p>
        <div style="overflow-x:auto">
          <table class="review-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th style="text-align:right">Actual</th>
                <th style="text-align:right">Median</th>
                <th style="text-align:right">Gap vs Median</th>
                <th style="text-align:right">Gap ($)</th>
              </tr>
            </thead>
            <tbody>
              ${data.gaps.map(g => `
                <tr>
                  <td><strong>${escapeHtml(g.metric)}</strong></td>
                  <td class="tmono" style="text-align:right">${escapeHtml(g.actualFmt)}</td>
                  <td class="tmono" style="text-align:right">${escapeHtml(g.medianFmt)}</td>
                  <td class="tmono" style="text-align:right;color:${g.gapPct > 0 ? 'var(--wm-red)' : '#0A7B3E'};font-weight:700">
                    ${g.gapPct > 0 ? '+' : ''}${(g.gapPct * 100).toFixed(1)}pp
                  </td>
                  <td class="tmono" style="text-align:right;color:${g.gapDollars > 0 ? 'var(--wm-red)' : '#0A7B3E'};font-weight:700">
                    ${g.gapDollars > 0 ? '' : '-'}$${fmt$(Math.abs(g.gapDollars))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    renderBenchmarkChart();
  } else if (state.resultsTab === 'opportunities') {
    const totalBase = data.opportunities.reduce((s, o) => s + o.base, 0);
    const totalLow = data.opportunities.reduce((s, o) => s + o.low, 0);
    const totalHigh = data.opportunities.reduce((s, o) => s + o.high, 0);
    host.innerHTML = `
      <div class="panel" style="display:flex;gap:24px;align-items:center">
        <div>
          <span class="wm-overline">Total Base-Case Opportunity</span>
          <div class="kpi-val" style="font-size:48px">$${fmt$(totalBase)}</div>
        </div>
        <div style="height:48px;width:1px;background:var(--border)"></div>
        <div>
          <div class="ydim">Range</div>
          <div style="font-size:16px;font-weight:700;color:var(--muted-foreground);margin-top:4px">
            $${fmt$(totalLow)} – $${fmt$(totalHigh)}
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:16px">
        <span class="wm-overline">Opportunity Detail</span>
        <h3 style="margin:4px 0 12px;font-size:16px">Modules</h3>
        <div style="overflow-x:auto">
          <table class="review-table">
            <thead>
              <tr>
                <th>Module</th>
                <th style="text-align:right">Low</th>
                <th style="text-align:right">Base</th>
                <th style="text-align:right">High</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${data.opportunities.map(o => `
                <tr>
                  <td><strong>${escapeHtml(o.name)}</strong></td>
                  <td class="tmono" style="text-align:right">$${fmt$(o.low)}</td>
                  <td class="tmono" style="text-align:right;color:var(--wm-magenta);font-weight:700">$${fmt$(o.base)}</td>
                  <td class="tmono" style="text-align:right">$${fmt$(o.high)}</td>
                  <td>${confidenceBadge(o.confidence)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (state.resultsTab === 'findings') {
    host.innerHTML = `
      <div class="panel">
        <span class="wm-overline">Analysis</span>
        <h3 style="margin:4px 0 16px;font-size:18px">Key Findings</h3>
        <ul class="findings">
          ${data.findings.map((f, i) => `
            <li><span class="f-num">${i + 1}</span><span>${escapeHtml(f)}</span></li>
          `).join('')}
        </ul>
      </div>
      <div class="key-message">
        <span class="wm-phase-overline" style="color:var(--wm-magenta);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Why It Matters</span>
        <p style="margin:8px 0 0;line-height:1.65;color:rgba(255,255,255,.9);font-size:14px">
          ${escapeHtml(data.whyItMatters)}
        </p>
      </div>
      <div style="margin-top:16px">
        <span class="wm-overline">Priorities</span>
        <h3 style="margin:4px 0 16px;font-size:18px">Recommendations</h3>
        <div class="rec-grid">
          ${data.recommendations.map(r => `
            <div class="panel rec-card rec-${r.priority.toLowerCase()}">
              <div class="row-between" style="margin-bottom:8px;align-items:flex-start">
                <h4 style="margin:0;font-size:15px">${escapeHtml(r.title)}</h4>
                ${confidenceBadge(r.confidence)}
              </div>
              <p style="margin:0 0 8px;font-size:12px;color:var(--muted-foreground)">
                <strong>Priority:</strong> ${escapeHtml(r.priority)} | <strong>Value:</strong> ${escapeHtml(r.value)}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:var(--muted-foreground)">${escapeHtml(r.description)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (state.resultsTab === 'caveats') {
    const passed = data.qa.checks.filter(c => c.passed).length;
    host.innerHTML = `
      <div class="panel">
        <span class="wm-overline">Quality</span>
        <h3 style="margin:4px 0 12px;font-size:18px">Overall Confidence</h3>
        <div class="row" style="gap:12px">
          ${confidenceBadge(data.qa.confidence)}
          <p style="margin:0;font-size:14px">${escapeHtml(data.qa.statement)}</p>
        </div>
      </div>
      <div class="panel" style="margin-top:16px">
        <h3 style="margin:0 0 4px;font-size:16px">Quality Assurance Checks</h3>
        <p class="panel-sub" style="margin:0 0 12px">${passed} of ${data.qa.checks.length} checks passed</p>
        <div class="stack-2">
          ${data.qa.checks.map(c => `
            <div class="alert ${c.passed ? 'alert-ok' : c.severity === 'Warning' ? 'alert-warn' : c.severity === 'Critical' ? 'alert-err' : 'alert-info'}">
              <span class="alert-dot"></span>
              <div style="flex:1;font-size:13px">
                <strong>${escapeHtml(c.name)}</strong>
                <span style="color:var(--muted-foreground);margin-left:6px">${escapeHtml(c.msg)}</span>
              </div>
              <span class="wm-badge ${c.severity === 'Critical' ? 'wm-badge-err' : c.severity === 'Warning' ? 'wm-badge-warn' : 'wm-badge-neutral'}">${escapeHtml(c.severity)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="panel" style="margin-top:16px">
        <span class="wm-overline">Limitations</span>
        <h3 style="margin:4px 0 12px;font-size:16px">Caveats</h3>
        <ul class="caveat-list">
          ${data.qa.caveats.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </div>
    `;
  } else if (state.resultsTab === 'export') {
    host.innerHTML = `
      <div class="panel">
        <span class="wm-overline">Deliverables</span>
        <h3 style="margin:4px 0 4px;font-size:18px">Export Reports</h3>
        <p class="panel-sub">Download diagnostic reports. Each report contains the full analysis with data, calculations, and narrative.</p>
        <div class="stack-3" style="margin-top:16px">
          ${exportRow('html', 'Interactive Report', 'Client-ready', 'Self-contained HTML with charts, tabs, benchmarks, and recommendations. Print to PDF.', true)}
          ${exportRow('summary', 'Executive Summary', 'Quick share', 'One-page markdown with KPIs, gaps, opportunities, and findings.')}
          ${exportRow('full', 'Full Report (10 Sheets)', 'Comprehensive', 'Complete structured report — financials, benchmarks, opportunities, workforce, and recommendations.')}
          ${exportRow('cot', 'Chain of Thought', 'Audit trail', 'Full audit showing every calculation, benchmark, and confidence assessment.')}
        </div>
      </div>
      <div class="key-message" style="margin-top:16px">
        <span class="wm-phase-overline" style="color:var(--wm-magenta);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Tip</span>
        <p style="margin:8px 0 0;line-height:1.65;color:rgba(255,255,255,.9);font-size:14px">
          The <strong>Interactive Report</strong> opens in any browser. Use <strong>Ctrl/Cmd+P</strong> to print as PDF. Markdown reports render in Notion, Confluence, or any viewer.
        </p>
      </div>
      <div class="alert alert-info" style="margin-top:16px;font-size:13px">
        <span class="alert-dot"></span>
        <div style="flex:1">Standalone preview — exports run server-side in the real app. This view shows the UI layout only.</div>
      </div>
    `;
  }
}

function exportRow(key, title, badge, desc, featured) {
  return `
    <div class="export-row ${featured ? 'featured' : ''}">
      <div class="export-icon">${icoSvg(SVG.upload)}</div>
      <div style="flex:1;min-width:0">
        <div class="row" style="gap:8px">
          <h4 style="margin:0;font-size:14px">${escapeHtml(title)}</h4>
          <span class="wm-badge ${featured ? 'wm-badge-primary' : 'wm-badge-neutral'}">${escapeHtml(badge)}</span>
        </div>
        <p style="margin:4px 0 0;font-size:12px;color:var(--muted-foreground)">${escapeHtml(desc)}</p>
      </div>
      <button class="btn ${featured ? 'btn-primary' : 'btn-outline'} btn-sm">${icoSvg(SVG.upload)} Download</button>
    </div>
  `;
}

function confidenceBadge(level) {
  const cls = level === 'High' ? 'wm-badge-ok' : level === 'Medium' ? 'wm-badge-warn' : 'wm-badge-err';
  const dot = level === 'High' ? '🟢' : level === 'Medium' ? '🟡' : '🔴';
  return `<span class="wm-badge ${cls}">${dot} ${escapeHtml(level)}</span>`;
}

// Horizontal bar chart of benchmark gaps
function renderBenchmarkChart() {
  const host = $('#bench-chart');
  if (!host) return;
  const data = DEMO_RESULTS.gaps;
  host.innerHTML = data.map(g => {
    const pct = Math.max(-0.5, Math.min(0.5, g.gapPct));
    const pctBar = (Math.abs(pct) / 0.5) * 50; // percentage of half-width
    const positive = g.gapPct > 0;
    return `
      <div class="bench-row">
        <div class="bench-label">${escapeHtml(g.metric)}</div>
        <div class="bench-track">
          <div class="bench-zero"></div>
          <div class="bench-bar ${positive ? 'pos' : 'neg'}" style="width:${pctBar}%; ${positive ? 'left:50%' : `right:50%`}"></div>
        </div>
        <div class="bench-val ${positive ? 'pos' : 'neg'}">${positive ? '+' : ''}${(g.gapPct * 100).toFixed(1)}pp</div>
      </div>
    `;
  }).join('');
}

function fmt$(n) {
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(0) + 'K';
  return Math.round(n).toString();
}
