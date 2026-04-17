'use strict';

// ══════════════════════════════════════════════════════════════
// View: Simple Form — mirrors src/app/analysis/[id]/form/page.tsx
// ══════════════════════════════════════════════════════════════
function renderFormView() {
  // reset state for this view
  state.formStep = 0;
  state.formPriorExpanded = false;
  state.formData = {
    company: {},
    currentYear: { fiscal_year_label: 'Current Fiscal Year' },
    priorYear: { fiscal_year_label: 'Last Fiscal Year' },
    workforce: {},
    transformation: {},
    files: {},
  };

  const host = document.getElementById('view-form');
  host.innerHTML = `
    <button class="back-link" data-view="new" type="button">
      ${icoSvg(SVG.back)}
      Back to New Analysis
    </button>
    <div style="margin-top:16px">
      <h1 class="page-title">IT Strategy Diagnostic</h1>
      <p class="page-sub">Complete each section to build your diagnostic profile.</p>
    </div>
    <div class="level-banner" style="margin-top:24px">
      <div class="bicon">${icoSvg(SVG.gauge)}</div>
      <div class="btxt">
        <div class="t">Target: ${escapeHtml(state.selectedLevel || 'Standard Diagnostic')}</div>
        <div class="s">Provide all required fields to qualify for this diagnostic level.</div>
      </div>
    </div>
    <nav class="step-nav" id="form-step-nav"></nav>
    <div class="panel" id="form-panel"></div>
    <div class="nav-row">
      <button class="btn btn-outline" id="form-back" disabled>
        ${icoSvg(SVG.chevL)}
        Back
      </button>
      <button class="btn btn-primary" id="form-next">
        Next ${icoSvg(SVG.chevR)}
      </button>
    </div>
  `;
  $('#form-back').onclick = () => { if (state.formStep > 0) { state.formStep--; renderFormBody(); } };
  $('#form-next').onclick = () => {
    if (state.formStep === FORM_STEPS.length - 1) {
      showView('review');
    } else {
      state.formStep++;
      renderFormBody();
    }
  };
  renderFormBody();
}

function renderFormBody() {
  renderFormStepNav();
  renderFormPanel();
  $('#form-back').disabled = state.formStep === 0;
  const isLast = state.formStep === FORM_STEPS.length - 1;
  $('#form-next').innerHTML = isLast
    ? `${icoSvg(SVG.check)} Review`
    : `Next ${icoSvg(SVG.chevR)}`;
}

function renderFormStepNav() {
  const host = $('#form-step-nav');
  host.innerHTML = '';
  FORM_STEPS.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = 'step-nav-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'step-nav-btn' + (i === state.formStep ? ' active' : i < state.formStep ? ' complete' : '');
    btn.innerHTML = `
      <div class="step-circle">${i < state.formStep ? icoSvg(SVG.check) : String(i+1)}</div>
      <span class="step-label">${escapeHtml(s.label)}${s.optional ? '<span class="opt">*</span>' : ''}</span>
    `;
    btn.onclick = () => { state.formStep = i; renderFormBody(); };
    item.appendChild(btn);
    if (i < FORM_STEPS.length - 1) {
      const line = document.createElement('div');
      line.className = 'step-line' + (i < state.formStep ? ' complete' : '');
      item.appendChild(line);
    }
    host.appendChild(item);
  });
}

// ── Panels — mirror the 4 intake components
function renderFormPanel() {
  const host = $('#form-panel');
  const step = FORM_STEPS[state.formStep];
  if (step.key === 'company') renderPanelCompany(host);
  else if (step.key === 'financial') renderPanelFinancial(host, 'currentYear', 0);
  else if (step.key === 'prior') renderPanelPrior(host);
  else if (step.key === 'workforce') renderPanelWorkforce(host);
  else if (step.key === 'transformation') renderPanelTransformation(host);
  else if (step.key === 'files') renderPanelFiles(host);
}

function renderPanelCompany(host) {
  const d = state.formData.company;
  host.innerHTML = `
    <h3>Company Profile</h3>
    <p class="panel-sub">Basic information about the company being assessed.</p>
    <div class="stack-4">
      <div>
        <label class="field-label" for="f-company-name">Company Name<span class="req">*</span></label>
        <input id="f-company-name" type="text" placeholder="Enter company name" value="${escapeHtml(d.company_name ?? '')}">
      </div>
      <div>
        <label class="field-label">Industry (GICS Sector)<span class="req">*</span></label>
        <select id="f-industry">
          <option value="">Select industry sector</option>
          ${GICS_GROUPS.map(g => `<option value="${escapeHtml(g)}" ${d.industry_gics_group === g ? 'selected' : ''}>${escapeHtml(g)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Business Model</label>
        <select id="f-biz">
          <option value="">Select business model (optional)</option>
          ${BUSINESS_MODELS.map(m => `<option value="${escapeHtml(m)}" ${d.business_model === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
        </select>
      </div>
      <div class="panel-section">
        <h4>Complexity Assessment</h4>
        <div class="field-grid-3">
          ${complexitySelect('f-reg', 'Regulatory Complexity', d.regulatory_complexity)}
          ${complexitySelect('f-ops', 'Operating Complexity', d.operating_complexity)}
          ${complexitySelect('f-price', 'Pricing Complexity', d.pricing_premium_complexity)}
        </div>
      </div>
      <div>
        <label class="field-label" for="f-notes">Complexity Notes</label>
        <textarea id="f-notes" rows="3" placeholder="Any additional context on complexity drivers (optional)">${escapeHtml(d.complexity_notes ?? '')}</textarea>
      </div>
    </div>
  `;
  $('#f-company-name', host).oninput = (e) => d.company_name = e.target.value;
  $('#f-industry', host).onchange = (e) => d.industry_gics_group = e.target.value || null;
  $('#f-biz', host).onchange = (e) => d.business_model = e.target.value || null;
  $('#f-reg', host).onchange = (e) => d.regulatory_complexity = e.target.value || null;
  $('#f-ops', host).onchange = (e) => d.operating_complexity = e.target.value || null;
  $('#f-price', host).onchange = (e) => d.pricing_premium_complexity = e.target.value || null;
  $('#f-notes', host).oninput = (e) => d.complexity_notes = e.target.value || null;
}

function complexitySelect(id, label, val) {
  return `
    <div>
      <label class="field-label" style="font-size:12px">${escapeHtml(label)}</label>
      <select id="${id}">
        <option value="">Select</option>
        ${COMPLEXITY_LEVELS.map(l => `<option value="${escapeHtml(l)}" ${val === l ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderPanelFinancial(host, key, yearIndex) {
  const d = state.formData[key];
  host.innerHTML = `
    <h3>Financial Baseline${yearIndex > 0 ? ` (Year ${yearIndex + 1})` : ''}</h3>
    <p class="panel-sub">IT financial data for benchmarking. Enter values in USD.</p>
    <div class="stack-4">
      <div>
        <label class="field-label">Fiscal Year<span class="req">*</span></label>
        <select id="f-fy">
          <option value="">Select fiscal year</option>
          ${FISCAL_YEAR_LABELS.map(l => `<option value="${escapeHtml(l)}" ${d.fiscal_year_label === l ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
        </select>
      </div>
      <div class="field-grid-2">
        ${currencyInput('f-rev', 'Revenue', d.revenue, true)}
        ${currencyInput('f-its', 'Total IT Spend', d.total_it_spend, true)}
      </div>
      <div class="panel-section">
        <h4>IT Spend Breakdown</h4>
        <div class="field-grid-3">
          ${currencyInput('f-opex', 'IT OpEx', d.it_opex_spend)}
          ${currencyInput('f-capex', 'IT CapEx', d.it_capex_spend)}
          ${currencyInput('f-da', 'IT D&A', d.it_da_spend)}
        </div>
      </div>
    </div>
  `;
  $('#f-fy', host).onchange = (e) => d.fiscal_year_label = e.target.value || null;
  bindCurrency(host, '#f-rev', (v) => d.revenue = v);
  bindCurrency(host, '#f-its', (v) => d.total_it_spend = v);
  bindCurrency(host, '#f-opex', (v) => d.it_opex_spend = v);
  bindCurrency(host, '#f-capex', (v) => d.it_capex_spend = v);
  bindCurrency(host, '#f-da', (v) => d.it_da_spend = v);
}

function currencyInput(id, label, val, required) {
  return `
    <div>
      <label class="field-label" style="font-size:12px">${escapeHtml(label)}${required ? '<span class="req">*</span>' : ''}</label>
      <div class="currency-wrap">
        <span class="currency-sym">$</span>
        <input id="${id}" type="text" inputmode="numeric" placeholder="0" value="${fmtNum(val)}">
      </div>
    </div>
  `;
}
function numberInput(id, label, val, required, placeholder) {
  return `
    <div>
      <label class="field-label" style="font-size:12px">${escapeHtml(label)}${required ? '<span class="req">*</span>' : ''}</label>
      <input id="${id}" type="text" inputmode="numeric" placeholder="${placeholder || 'Enter a number'}" value="${fmtNum(val)}">
    </div>
  `;
}
function bindCurrency(host, sel, setter) {
  const el = host.querySelector(sel);
  if (!el) return;
  el.oninput = () => { const v = parseFloat10(el.value); setter(v); el.value = fmtNum(v); };
}
function bindNumber(host, sel, setter) {
  const el = host.querySelector(sel);
  if (!el) return;
  el.oninput = () => { const v = parseInt10(el.value); setter(v); el.value = fmtNum(v); };
}

function renderPanelPrior(host) {
  host.innerHTML = `
    <div class="row-between" style="margin-bottom:16px">
      <div>
        <h3 style="margin:0 0 4px">Prior Year Data</h3>
        <p class="panel-sub" style="margin:0">Optional. Providing prior year data enables trend analysis.</p>
      </div>
      <button class="btn btn-outline btn-sm" id="f-prior-toggle">${state.formPriorExpanded ? 'Collapse' : 'Add Prior Year'}</button>
    </div>
    <div id="f-prior-content"></div>
  `;
  $('#f-prior-toggle', host).onclick = () => {
    state.formPriorExpanded = !state.formPriorExpanded;
    renderPanelPrior(host);
  };
  if (state.formPriorExpanded) {
    renderPanelFinancial($('#f-prior-content', host), 'priorYear', 1);
  }
}

function renderPanelWorkforce(host) {
  const d = state.formData.workforce;
  host.innerHTML = `
    <h3>Workforce &amp; Labor</h3>
    <p class="panel-sub">Headcount and labor cost data for IT benchmarking.</p>
    <div class="stack-4">
      <div class="field-grid-2">
        ${numberInput('f-emp', 'Total Employee Count', d.employee_count, true, 'e.g. 5,000')}
        ${numberInput('f-itfte', 'IT FTE Count', d.it_fte_count, true, 'e.g. 250')}
      </div>
      <div class="panel-section">
        <h4>Contractor &amp; Outsourcing Detail<span class="opt">(optional)</span></h4>
        <div class="field-grid-2">
          ${numberInput('f-con', 'Contractor Count', d.contractor_count, false, 'e.g. 100')}
          ${currencyInput('f-conSpend', 'Contractor Spend', d.contractor_spend)}
          ${currencyInput('f-outSpend', 'Outsourced Spend', d.outsourced_spend)}
          ${currencyInput('f-intLabor', 'Internal Labor Spend', d.internal_labor_spend)}
        </div>
      </div>
    </div>
  `;
  bindNumber(host, '#f-emp', (v) => d.employee_count = v);
  bindNumber(host, '#f-itfte', (v) => d.it_fte_count = v);
  bindNumber(host, '#f-con', (v) => d.contractor_count = v);
  bindCurrency(host, '#f-conSpend', (v) => d.contractor_spend = v);
  bindCurrency(host, '#f-outSpend', (v) => d.outsourced_spend = v);
  bindCurrency(host, '#f-intLabor', (v) => d.internal_labor_spend = v);
}

function renderPanelTransformation(host) {
  const d = state.formData.transformation;
  host.innerHTML = `
    <h3>Transformation Context</h3>
    <p class="panel-sub">Active or planned transformation programs that impact IT spend.</p>
    <div class="stack-4">
      <div>
        <label class="field-label">Is a transformation currently active?</label>
        <select id="f-tstatus">
          <option value="">Select status</option>
          ${TRANSFORMATION_STATUS.map(s => `<option value="${escapeHtml(s)}" ${d.transformation_status === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Transformation Types</label>
        <div class="chkgrid-5" id="f-ttypes"></div>
      </div>
      <div class="field-grid-2">
        ${currencyInput('f-tspend', 'Transformation Spend Estimate', d.transformation_spend_estimate)}
        <div>
          <label class="field-label" style="font-size:12px">Roll-off Timing</label>
          <input id="f-troll" type="text" placeholder='e.g. "Q4 2026" or "18 months"' value="${escapeHtml(d.transformation_rolloff_timing ?? '')}">
        </div>
      </div>
      <div>
        <label class="field-label">Roadmap Available?</label>
        <select id="f-roadmap">
          <option value="">Select</option>
          <option value="yes" ${d.roadmap_available === true ? 'selected' : ''}>Yes</option>
          <option value="no"  ${d.roadmap_available === false ? 'selected' : ''}>No</option>
        </select>
      </div>
    </div>
  `;
  $('#f-tstatus', host).onchange = (e) => d.transformation_status = e.target.value || null;
  bindCurrency(host, '#f-tspend', (v) => d.transformation_spend_estimate = v);
  $('#f-troll', host).oninput = (e) => d.transformation_rolloff_timing = e.target.value || null;
  $('#f-roadmap', host).onchange = (e) => {
    const v = e.target.value;
    d.roadmap_available = v === 'yes' ? true : v === 'no' ? false : null;
  };

  const grid = $('#f-ttypes', host);
  const selected = new Set(d.transformation_type ?? []);
  TRANSFORMATION_TYPES.forEach(t => {
    const label = document.createElement('label');
    label.className = 'multi-opt' + (selected.has(t) ? ' checked' : '');
    const box = document.createElement('input');
    box.type = 'checkbox'; box.checked = selected.has(t);
    box.onchange = () => {
      if (box.checked) selected.add(t); else selected.delete(t);
      label.classList.toggle('checked', box.checked);
      d.transformation_type = selected.size ? Array.from(selected) : null;
    };
    label.appendChild(box);
    label.appendChild(document.createTextNode(t));
    grid.appendChild(label);
  });
}

function renderPanelFiles(host) {
  host.innerHTML = `
    <h3>File Upload</h3>
    <p class="panel-sub">Upload supporting documents for automated data extraction. Accepts .xlsx, .xls, .csv, and .pdf files.</p>
    <div class="dropzone-grid" id="f-dropzones"></div>
  `;
  const zones = $('#f-dropzones', host);
  FILE_ZONES.forEach(zone => zones.appendChild(makeDropzone(zone, state.formData.files, 'form')));
}

function renderFormCompletion() {
  const d = state.formData;
  const companyName = d.company.company_name || 'Unnamed company';
  const host = document.getElementById('view-form');
  host.innerHTML = `
    <button class="back-link" data-view="new" type="button">${icoSvg(SVG.back)} Back to New Analysis</button>
    <div style="margin-top:24px">
      <span class="wm-overline">Review</span>
      <h1 class="page-title">${escapeHtml(companyName)}</h1>
      <p class="page-sub">Your intake is captured. Paste the MCP calls below to run the analysis.</p>
    </div>
    <div class="summary-card">
      <span class="wm-overline">Summary</span>
      <div class="data-grid" style="margin-top:12px">
        ${summaryPill('Industry', d.company.industry_gics_group)}
        ${summaryPill('Business model', d.company.business_model)}
        ${summaryPill('Revenue', d.currentYear.revenue != null ? '$' + fmtNum(d.currentYear.revenue) : null)}
        ${summaryPill('Total IT spend', d.currentYear.total_it_spend != null ? '$' + fmtNum(d.currentYear.total_it_spend) : null)}
        ${summaryPill('IT OpEx', d.currentYear.it_opex_spend != null ? '$' + fmtNum(d.currentYear.it_opex_spend) : null)}
        ${summaryPill('IT CapEx', d.currentYear.it_capex_spend != null ? '$' + fmtNum(d.currentYear.it_capex_spend) : null)}
        ${summaryPill('Employees', d.workforce.employee_count)}
        ${summaryPill('IT FTEs', d.workforce.it_fte_count)}
        ${summaryPill('Transformation', d.transformation.transformation_status)}
      </div>
    </div>
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn btn-outline" data-view="new">Back to New Analysis</button>
      <button class="btn btn-primary" id="form-edit">Edit answers</button>
    </div>
  `;
  $('#form-edit').onclick = () => { renderFormView(); };
}
function summaryPill(label, val) {
  if (val == null || val === '') return '';
  return `<div class="data-pill"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(String(val))}</span></div>`;
}
