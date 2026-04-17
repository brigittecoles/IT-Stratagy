'use strict';

// ══════════════════════════════════════════════════════════════
// View: File Drop — mirrors src/app/analysis/[id]/file-drop/page.tsx
// Note: real xlsx parsing is stubbed — the UI mirrors the flow.
// ══════════════════════════════════════════════════════════════
function renderFileDropView() {
  state.fdStep = 'upload';
  state.fdFiles = {};
  state.fdParsed = {};
  state.fdParseStatus = 'idle';
  state.fdParseMessages = [];
  state.fdCompany = {};

  const host = document.getElementById('view-filedrop');
  host.innerHTML = `
    <button class="back-link" data-view="new" type="button">
      ${icoSvg(SVG.back)}
      Back to New Analysis
    </button>
    <div style="margin-top:24px">
      <span class="wm-overline">File Drop</span>
      <h1 class="page-title">Upload Your Data</h1>
      <p class="page-sub">Upload spreadsheets with IT financials, vendor lists, org charts, or roadmaps. We'll extract what we can and let you review before running the diagnostic.</p>
    </div>
    <div class="level-banner" style="margin-top:24px">
      <div class="bicon">${icoSvg(SVG.gauge)}</div>
      <div class="btxt">
        <div class="t">Target: ${escapeHtml(state.selectedLevel || 'Standard Diagnostic')}</div>
        <div class="s">Upload one or more files below to extract data automatically.</div>
      </div>
    </div>
    <nav class="fdstep-nav" id="fd-step-nav"></nav>
    <div id="fd-body"></div>
  `;
  renderFdStepNav();
  renderFdBody();
}

function renderFdStepNav() {
  const host = $('#fd-step-nav');
  host.innerHTML = '';
  FILEDROP_STEPS.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = 'fdstep-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    const activeIdx = FILEDROP_STEPS.findIndex(x => x.key === state.fdStep);
    const isActive = s.key === state.fdStep;
    const isComplete = i < activeIdx;
    btn.className = 'fdstep-btn' + (isActive ? ' active' : isComplete ? ' complete' : '');
    btn.innerHTML = `
      <div class="fdstep-circle">${i + 1}</div>
      <span>${escapeHtml(s.label)}</span>
    `;
    btn.onclick = () => { if (isComplete) { state.fdStep = s.key; renderFdStepNav(); renderFdBody(); } };
    item.appendChild(btn);
    if (i < FILEDROP_STEPS.length - 1) {
      const line = document.createElement('div');
      line.className = 'fdstep-line' + (isComplete ? ' complete' : '');
      item.appendChild(line);
    }
    host.appendChild(item);
  });
}

function renderFdBody() {
  const host = $('#fd-body');
  if (state.fdStep === 'upload') renderFdUpload(host);
  else if (state.fdStep === 'company') renderFdCompany(host);
  else if (state.fdStep === 'review') renderFdReview(host);
}

function renderFdUpload(host) {
  const fileCount = Object.values(state.fdFiles).filter(Boolean).length;
  host.innerHTML = `
    <div class="panel"><div class="dropzone-grid" id="fd-dropzones"></div></div>
    <div id="fd-parse-ui" style="margin-top:20px"></div>
    ${fileCount === 0 ? `
      <div class="row" style="justify-content:center;margin-top:16px;color:var(--muted-foreground);font-size:13px;gap:4px">
        ${icoSvg(SVG.alert, 'alert-ico')}
        Drop at least one file above to get started, or
        <button class="back-link" style="color:var(--wm-blue);font-weight:500" type="button" id="fd-skip">skip to manual entry</button>
      </div>
    ` : ''}
  `;
  const zones = $('#fd-dropzones', host);
  FILE_ZONES.forEach(zone => zones.appendChild(makeDropzone(zone, state.fdFiles, 'filedrop')));

  const parseUi = $('#fd-parse-ui', host);
  if (state.fdParseStatus === 'idle' && fileCount > 0) {
    parseUi.innerHTML = `<div class="row" style="justify-content:center"><button class="btn btn-primary" id="fd-parse">${icoSvg(SVG.fileSheet)} Parse ${fileCount} File${fileCount !== 1 ? 's' : ''}</button></div>`;
    $('#fd-parse', parseUi).onclick = fdHandleParse;
  } else if (state.fdParseStatus === 'parsing') {
    parseUi.innerHTML = `<div class="row" style="justify-content:center;color:var(--muted-foreground);padding:16px">${icoSvg(SVG.loader)} Parsing files...</div>`;
  } else if (state.fdParseStatus === 'done') {
    parseUi.innerHTML = `
      <div class="parse-results">
        <h4>Parse Results</h4>
        ${state.fdParseMessages.map(m => `<p class="parse-line">${escapeHtml(m)}</p>`).join('')}
      </div>
      ${Object.keys(state.fdParsed).length > 0 ? `
        <div class="panel" style="margin-top:16px">
          <h4 style="margin:0 0 12px;font-size:13px;font-weight:600">Extracted Data</h4>
          <div class="data-grid">
            ${Object.entries(state.fdParsed).map(([k, v]) => `
              <div class="data-pill">
                <span class="label">${escapeHtml(k.replace(/_/g, ' '))}</span>
                <span class="value">${typeof v === 'number' ? (v >= 1000 ? '$' + (v/1e6).toFixed(1) + 'M' : fmtNum(v)) : escapeHtml(String(v))}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="row" style="justify-content:flex-end;margin-top:16px">
        <button class="btn btn-primary" id="fd-next1">Next: Company Profile ${icoSvg(SVG.chevR)}</button>
      </div>
    `;
    $('#fd-next1', parseUi).onclick = () => { state.fdStep = 'company'; renderFdStepNav(); renderFdBody(); };
  }

  const skip = $('#fd-skip', host);
  if (skip) skip.onclick = () => { state.fdStep = 'company'; renderFdStepNav(); renderFdBody(); };
}

// Stubbed parser — real implementation uses xlsx lib (see file-drop/page.tsx)
function fdHandleParse() {
  state.fdParseStatus = 'parsing';
  state.fdParseMessages = [];
  renderFdBody();
  setTimeout(() => {
    const msgs = [];
    const merged = {};
    for (const [zone, file] of Object.entries(state.fdFiles)) {
      if (!file) continue;
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        // Placeholder — show plausible demo values the real parser would extract
        msgs.push(`✓ ${zone}: parsed ${file.name} (demo values shown)`);
        if (zone === 'IT Financials') Object.assign(merged, { revenue: 505000000, total_it_spend: 18400000, it_opex_spend: 12900000, it_capex_spend: 5500000 });
        if (zone === 'IT FTEs and Contractors') Object.assign(merged, { employee_count: 1600, it_fte_count: 25 });
      } else if (ext === 'pdf') {
        msgs.push(`○ ${zone}: PDF uploaded (${file.name}) — manual review needed`);
      } else {
        msgs.push(`⚠ ${zone}: unsupported format (${file.name})`);
      }
    }
    const total = Object.keys(merged).length;
    msgs.push(total > 0
      ? `\n→ ${total} data point${total !== 1 ? 's' : ''} extracted. Review below before proceeding.`
      : `\n→ No structured data found. You can enter data manually in the next step.`
    );
    state.fdParsed = merged;
    state.fdParseMessages = msgs;
    state.fdParseStatus = 'done';
    renderFdBody();
  }, 500);
}

function renderFdCompany(host) {
  const d = state.fdCompany;
  host.innerHTML = `
    <div class="panel">
      <h3>Company Profile</h3>
      <p class="panel-sub">Basic information about the company being assessed.</p>
      <div class="stack-4">
        <div>
          <label class="field-label" for="fd-name">Company Name<span class="req">*</span></label>
          <input id="fd-name" type="text" placeholder="Enter company name" value="${escapeHtml(d.company_name ?? '')}">
        </div>
        <div>
          <label class="field-label">Industry (GICS Sector)<span class="req">*</span></label>
          <select id="fd-ind">
            <option value="">Select industry sector</option>
            ${GICS_GROUPS.map(g => `<option value="${escapeHtml(g)}" ${d.industry_gics_group === g ? 'selected' : ''}>${escapeHtml(g)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label">Business Model</label>
          <select id="fd-biz">
            <option value="">Select business model (optional)</option>
            ${BUSINESS_MODELS.map(m => `<option value="${escapeHtml(m)}" ${d.business_model === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="row-between" style="margin-top:16px">
      <button class="btn btn-outline" id="fd-back1">${icoSvg(SVG.chevL)} Back to Files</button>
      <button class="btn btn-primary" id="fd-next2" disabled>Next: Review ${icoSvg(SVG.chevR)}</button>
    </div>
  `;
  const refreshNext = () => { $('#fd-next2').disabled = !d.company_name; };
  $('#fd-name', host).oninput = (e) => { d.company_name = e.target.value; refreshNext(); };
  $('#fd-ind', host).onchange = (e) => { d.industry_gics_group = e.target.value || null; };
  $('#fd-biz', host).onchange = (e) => { d.business_model = e.target.value || null; };
  $('#fd-back1', host).onclick = () => { state.fdStep = 'upload'; renderFdStepNav(); renderFdBody(); };
  $('#fd-next2', host).onclick = () => { state.fdStep = 'review'; renderFdStepNav(); renderFdBody(); };
  refreshNext();
}

function renderFdReview(host) {
  const d = state.fdCompany;
  const parsedCount = Object.keys(state.fdParsed).length;
  const fileCount = Object.values(state.fdFiles).filter(Boolean).length;
  host.innerHTML = `
    <div class="panel">
      <div class="row" style="margin-bottom:12px;color:var(--wm-navy)">
        ${icoSvg(SVG.building)}
        <h3 style="margin:0;font-size:16px">Company</h3>
      </div>
      <div class="data-grid">
        <div class="data-pill"><span class="label">Name</span><span class="value">${escapeHtml(d.company_name || '—')}</span></div>
        <div class="data-pill"><span class="label">Industry</span><span class="value">${escapeHtml(d.industry_gics_group || '—')}</span></div>
        ${d.business_model ? `<div class="data-pill"><span class="label">Business model</span><span class="value">${escapeHtml(d.business_model)}</span></div>` : ''}
      </div>
    </div>
    <div class="panel" style="margin-top:16px">
      <div class="row" style="margin-bottom:12px;color:var(--wm-navy)">
        ${icoSvg(SVG.upload)}
        <h3 style="margin:0;font-size:16px">Extracted Data (${parsedCount} field${parsedCount !== 1 ? 's' : ''})</h3>
      </div>
      ${parsedCount > 0 ? `
        <div class="data-grid">
          ${Object.entries(state.fdParsed).map(([k, v]) => `
            <div class="data-pill">
              <span class="label">${escapeHtml(k.replace(/_/g, ' '))}</span>
              <span class="value">${typeof v === 'number' ? (v >= 1000 ? '$' + (v/1e6).toFixed(1) + 'M' : fmtNum(v)) : escapeHtml(String(v))}</span>
            </div>
          `).join('')}
        </div>
      ` : '<p style="color:var(--muted-foreground);margin:0;font-size:13px">No data extracted from files. You can add data manually after submission.</p>'}
    </div>
    <div class="panel" style="margin-top:16px">
      <div class="row" style="margin-bottom:12px;color:var(--wm-navy)">
        ${icoSvg(SVG.fileSheet)}
        <h3 style="margin:0;font-size:16px">Files (${fileCount} uploaded)</h3>
      </div>
      ${fileCount > 0 ? `
        <div class="stack-2">
          ${Object.entries(state.fdFiles).filter(([, f]) => f).map(([zone, file]) => `
            <div class="data-pill">
              <span class="label">${escapeHtml(zone)}</span>
              <span class="value">${escapeHtml(file.name)}</span>
            </div>
          `).join('')}
        </div>
      ` : '<p style="color:var(--muted-foreground);margin:0;font-size:13px">No files uploaded.</p>'}
    </div>
    <div class="row-between" style="margin-top:16px">
      <button class="btn btn-outline" id="fd-back2">${icoSvg(SVG.chevL)} Back</button>
      <button class="btn btn-primary" id="fd-submit">Submit &amp; Review ${icoSvg(SVG.chevR)}</button>
    </div>
  `;
  $('#fd-back2', host).onclick = () => { state.fdStep = 'company'; renderFdStepNav(); renderFdBody(); };
  $('#fd-submit', host).onclick = () => showView('review');
}

// ══════════════════════════════════════════════════════════════
// Shared dropzone component — used by Form step 6 and File Drop
// ══════════════════════════════════════════════════════════════
function makeDropzone(zone, fileStore, contextKey) {
  const el = document.createElement('div');
  el.className = 'dropzone';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls,.csv,.pdf';
  input.style.display = 'none';

  const refresh = () => {
    const file = fileStore[zone] || null;
    el.innerHTML = '';
    if (file) {
      el.classList.add('has-file');
      el.innerHTML = `
        ${icoSvg(SVG.fileSheet, 'dropzone-icon')}
        <div>
          <div class="dropzone-title" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(file.name)}</div>
          <div class="dropzone-hint">${(file.size / 1024).toFixed(1)} KB</div>
        </div>
        <button class="dropzone-remove" type="button" title="Remove">${icoSvg(SVG.x)}</button>
      `;
      el.querySelector('.dropzone-remove').onclick = (e) => { e.stopPropagation(); fileStore[zone] = null; refreshContainer(); };
    } else {
      el.classList.remove('has-file');
      el.innerHTML = `
        ${icoSvg(SVG.upload, 'dropzone-icon')}
        <div>
          <div class="dropzone-title">${escapeHtml(zone)}</div>
          <div class="dropzone-hint">Drop file here or click to browse</div>
        </div>
      `;
    }
    el.appendChild(input);
  };

  const refreshContainer = () => {
    // For file-drop view, re-render the whole body so buttons/count update.
    // For the form step, just refresh this tile.
    if (contextKey === 'filedrop') renderFdBody();
    else refresh();
  };

  el.onclick = () => input.click();
  el.ondragover = (e) => { e.preventDefault(); el.classList.add('drag'); };
  el.ondragleave = () => el.classList.remove('drag');
  el.ondrop = (e) => {
    e.preventDefault();
    el.classList.remove('drag');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) { fileStore[zone] = f; refreshContainer(); }
  };
  input.onchange = () => {
    const f = input.files && input.files[0];
    if (f) { fileStore[zone] = f; refreshContainer(); }
  };

  refresh();
  return el;
}
