'use strict';

// ══════════════════════════════════════════════════════════════
// View: Wizard — mirrors src/app/analysis/[id]/wizard/page.tsx
// ══════════════════════════════════════════════════════════════
function renderWizardView() {
  const host = document.getElementById('view-wizard');
  host.innerHTML = `
    <button class="back-link" data-view="new" type="button">
      ${icoSvg(SVG.back)}
      Back to New Analysis
    </button>
    <div style="margin-top:24px">
      <h1 class="page-title">IT Strategy Diagnostic</h1>
      <p class="page-sub">Guided walkthrough — one question at a time.</p>
    </div>
    <div class="progress-wrap">
      <div class="progress-meta">
        <span id="step-label"></span>
        <span id="step-count"></span>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
    </div>
    <div class="q-card" id="q-card">
      <div class="q-head">
        <div class="q-icon">${icoSvg(SVG.msg)}</div>
        <div>
          <p class="q-prompt" id="q-prompt">—</p>
          <p class="q-help" id="q-help"></p>
          <p class="q-required hide" id="q-required">Required</p>
        </div>
      </div>
      <div class="q-input" id="q-input"></div>
    </div>
    <div class="nav-row">
      <button class="btn btn-outline" id="btn-back" disabled>
        ${icoSvg(SVG.chevL)}
        Back
      </button>
      <button class="btn btn-primary" id="btn-next">
        Next ${icoSvg(SVG.chevR)}
      </button>
    </div>
    <div id="completion-view" class="hide"></div>
  `;
  $('#btn-next').onclick = wizardNext;
  $('#btn-back').onclick = wizardBack;
  state.wizardIndex = 0;
  state.answers = {};
  renderQuestion();
}

function renderQuestion() {
  const q = WIZARD_QUESTIONS[state.wizardIndex];
  const progress = ((state.wizardIndex + 1) / WIZARD_QUESTIONS.length) * 100;
  $('#step-label').textContent = `Step ${q.step} of ${WIZARD_TOTAL_STEPS}: ${q.stepLabel}`;
  $('#step-count').textContent = `${state.wizardIndex + 1} / ${WIZARD_QUESTIONS.length}`;
  $('#progress-fill').style.width = progress + '%';
  $('#q-prompt').textContent = q.prompt;
  $('#q-help').textContent = q.helpText || '';
  $('#q-help').style.display = q.helpText ? '' : 'none';
  $('#q-required').classList.toggle('hide', !q.required);
  renderWizardInput(q);
  $('#btn-back').disabled = state.wizardIndex === 0;
  const isLast = state.wizardIndex === WIZARD_QUESTIONS.length - 1;
  $('#btn-next').innerHTML = isLast
    ? `${icoSvg(SVG.check)} Submit`
    : `${q.required ? 'Next' : 'Skip / Next'} ${icoSvg(SVG.chevR)}`;
  wizardUpdateNext();
}

function renderWizardInput(q) {
  const host = $('#q-input');
  host.innerHTML = '';
  const cur = state.answers[q.id];
  if (q.type === 'text') {
    const el = document.createElement('input');
    el.type = 'text';
    el.placeholder = 'Type your answer...';
    el.value = cur ?? '';
    el.oninput = () => { state.answers[q.id] = el.value; wizardUpdateNext(); };
    el.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); wizardNext(); } };
    host.appendChild(el);
    setTimeout(() => el.focus(), 50);
  } else if (q.type === 'number' || q.type === 'currency') {
    const wrap = q.type === 'currency' ? document.createElement('div') : null;
    if (wrap) {
      wrap.className = 'currency-wrap';
      const sym = document.createElement('span');
      sym.className = 'currency-sym'; sym.textContent = '$';
      wrap.appendChild(sym);
    }
    const el = document.createElement('input');
    el.type = 'text'; el.inputMode = 'numeric';
    el.placeholder = q.type === 'currency' ? '0' : 'Enter a number';
    el.value = fmtNum(cur);
    el.oninput = () => {
      state.answers[q.id] = q.type === 'currency' ? parseFloat10(el.value) : parseInt10(el.value);
      el.value = fmtNum(state.answers[q.id]);
      wizardUpdateNext();
    };
    el.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); wizardNext(); } };
    if (wrap) { wrap.appendChild(el); host.appendChild(wrap); } else { host.appendChild(el); }
    setTimeout(() => el.focus(), 50);
  } else if (q.type === 'select') {
    const el = document.createElement('select');
    el.innerHTML = `<option value="">Choose one...</option>` + q.options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    el.value = cur ?? '';
    el.onchange = () => { state.answers[q.id] = el.value || null; wizardUpdateNext(); };
    host.appendChild(el);
  } else if (q.type === 'multiselect') {
    const grid = document.createElement('div');
    grid.className = 'multi-grid';
    const selected = new Set(cur ?? []);
    for (const opt of q.options) {
      const label = document.createElement('label');
      label.className = 'multi-opt' + (selected.has(opt) ? ' checked' : '');
      const box = document.createElement('input');
      box.type = 'checkbox'; box.checked = selected.has(opt);
      box.onchange = () => {
        if (box.checked) selected.add(opt); else selected.delete(opt);
        label.classList.toggle('checked', box.checked);
        state.answers[q.id] = selected.size ? Array.from(selected) : null;
        wizardUpdateNext();
      };
      label.appendChild(box);
      label.appendChild(document.createTextNode(opt));
      grid.appendChild(label);
    }
    host.appendChild(grid);
  } else if (q.type === 'boolean') {
    const row = document.createElement('div');
    row.className = 'bool-row';
    for (const v of [true, false]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bool-btn' + (cur === v ? ' selected' : '');
      b.textContent = v ? 'Yes' : 'No';
      b.onclick = () => { state.answers[q.id] = v; renderWizardInput(q); wizardUpdateNext(); };
      row.appendChild(b);
    }
    host.appendChild(row);
  }
}

function wizardUpdateNext() {
  const q = WIZARD_QUESTIONS[state.wizardIndex];
  const v = state.answers[q.id];
  $('#btn-next').disabled = q.required && (v == null || v === '');
}

function wizardNext() {
  const q = WIZARD_QUESTIONS[state.wizardIndex];
  const v = state.answers[q.id];
  if (q.required && (v == null || v === '')) return;
  if (state.wizardIndex === WIZARD_QUESTIONS.length - 1) { renderWizardCompletion(); return; }
  if (q.id === 'has_prior_year' && v !== true) {
    const ns = WIZARD_QUESTIONS.findIndex(qq => qq.step === q.step + 1);
    if (ns !== -1) { state.wizardIndex = ns; renderQuestion(); return; }
  }
  state.wizardIndex = Math.min(WIZARD_QUESTIONS.length - 1, state.wizardIndex + 1);
  renderQuestion();
}

function wizardBack() {
  state.wizardIndex = Math.max(0, state.wizardIndex - 1);
  renderQuestion();
}

function qualifyLevel(a) {
  const has = (k) => a[k] != null && a[k] !== '';
  const base = has('company_name') && has('industry') && has('revenue') && has('total_it_spend') && has('transformation_status');
  const std = base && has('it_opex') && has('it_capex') && has('employee_count') && has('it_fte_count');
  if (std) return 'Standard Diagnostic';
  if (base) return 'Quick Read';
  return 'Incomplete — more inputs needed';
}

function renderWizardCompletion() {
  $('#q-card').classList.add('hide');
  $('.nav-row').classList.add('hide');
  $('.progress-wrap').style.display = 'none';
  const a = state.answers;
  const level = qualifyLevel(a);
  const createCall = { company_name: a.company_name, industry_gics_group: a.industry };
  const payload = { analysis_id: '<paste-from-create_analysis>' };
  const set = (k, v) => { if (v != null && v !== '') payload[k] = v; };
  set('revenue', a.revenue);
  set('total_it_spend', a.total_it_spend);
  set('it_opex_spend', a.it_opex);
  set('it_capex_spend', a.it_capex);
  set('it_da_spend', a.it_da);
  set('employee_count', a.employee_count);
  set('it_fte_count', a.it_fte_count);
  set('contractor_count', a.contractor_count);
  set('contractor_spend', a.contractor_spend);
  set('fiscal_year_label', a.fiscal_year_label);
  set('transformation_status', a.transformation_status);
  set('transformation_type', a.transformation_types);
  set('transformation_spend_estimate', a.transformation_spend);
  set('roadmap_available', a.roadmap_available);
  set('business_model', a.business_model);
  set('regulatory_complexity', a.regulatory_complexity);
  set('operating_complexity', a.operating_complexity);
  set('pricing_premium_complexity', a.pricing_complexity);

  const view = $('#completion-view');
  view.classList.remove('hide');
  view.innerHTML = `
    <div class="summary-card">
      <span class="wm-overline">Qualification</span>
      <h2 style="margin:4px 0 4px;font-size:20px">${escapeHtml(a.company_name || 'Unnamed company')}</h2>
      <span class="wm-badge wm-badge-primary">${escapeHtml(level)}</span>
    </div>
    <div class="summary-card">
      <span class="wm-overline">Step 1 · create_analysis</span>
      <pre class="payload" id="p1">${escapeHtml(JSON.stringify(createCall, null, 2))}</pre>
      <button class="copy-btn" data-target="p1">Copy JSON</button>
    </div>
    <div class="summary-card">
      <span class="wm-overline">Step 2 · submit_intake</span>
      <pre class="payload" id="p2">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
      <button class="copy-btn" data-target="p2">Copy JSON</button>
    </div>
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn btn-outline" id="btn-restart">Start over</button>
      <button class="btn btn-outline" data-view="new">Back to New Analysis</button>
    </div>
  `;
  view.querySelectorAll('.copy-btn').forEach(b => b.onclick = () => {
    const pre = document.getElementById(b.dataset.target);
    navigator.clipboard.writeText(pre.textContent).then(() => {
      const prev = b.textContent;
      b.textContent = 'Copied!';
      setTimeout(() => b.textContent = prev, 1500);
    });
  });
  $('#btn-restart').onclick = () => renderWizardView();
}
