'use strict';

// ══════════════════════════════════════════════════════════════
// View: /analysis/new (pixel clone of screenshot)
// ══════════════════════════════════════════════════════════════
function renderNewAnalysisView() {
  const host = document.getElementById('view-new');
  host.innerHTML = `
    <div class="stack-8">
      <button class="back-link" data-view="dashboard" type="button">
        ${icoSvg(SVG.back)}
        Back to Dashboard
      </button>
      <div>
        <span class="wm-overline">New</span>
        <h1 class="page-title">New Analysis</h1>
        <p class="page-sub">Choose your diagnostic depth and preferred data intake method.</p>
      </div>
      <section class="stack-4">
        <div class="section-head">
          ${icoSvg(SVG.gauge)}
          <h2>Set Expectations</h2>
        </div>
        <p class="section-sub">Select the diagnostic level that matches the depth of insight you need. Higher levels require more data.</p>
        <div class="level-grid" id="level-grid"></div>
      </section>
      <section class="stack-4">
        <h2 style="font-size:18px;font-weight:700;margin:0">Choose Intake Method</h2>
        <p class="section-sub">Pick the way you would like to provide your data. You can combine methods later.</p>
        <div class="mode-grid" id="mode-grid"></div>
      </section>
    </div>
  `;
  renderLevels();
  renderModes();
}

function renderLevels() {
  const host = $('#level-grid');
  host.innerHTML = '';
  for (const level of DIAGNOSTIC_LEVELS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'level-btn' + (level === state.selectedLevel ? ' selected' : '');
    btn.innerHTML = `
      <div class="level-row">
        <span class="level-name">${escapeHtml(level)}</span>
        ${level === state.selectedLevel ? '<span class="wm-badge wm-badge-primary">Selected</span>' : ''}
      </div>
      <p class="level-desc">${escapeHtml(LEVEL_DESCRIPTIONS[level])}</p>
    `;
    btn.onclick = () => { state.selectedLevel = level; renderLevels(); };
    host.appendChild(btn);
  }
}

function renderModes() {
  const host = $('#mode-grid');
  host.innerHTML = '';
  for (const mode of INTAKE_MODES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn';
    btn.innerHTML = `
      <div class="mode-card">
        <div class="mode-header">
          <div class="mode-header-row">
            <div class="mode-icon-tile">${icoSvg(mode.iconPath)}</div>
            <span class="wm-badge ${mode.badgeClass}">${escapeHtml(mode.badge)}</span>
          </div>
          <h3 class="mode-title">${escapeHtml(mode.title)}</h3>
          <p class="mode-desc">${escapeHtml(mode.description)}</p>
        </div>
        <div class="mode-body">
          <p class="mode-detail">${escapeHtml(mode.detail)}</p>
        </div>
      </div>
    `;
    btn.onclick = () => showView(mode.key);
    host.appendChild(btn);
  }
}

// ══════════════════════════════════════════════════════════════
// View: /dashboard — mirrors src/app/dashboard/page.tsx
// ══════════════════════════════════════════════════════════════
function renderDashboardView() {
  const host = document.getElementById('view-dashboard');
  host.innerHTML = `
    <div class="stack-8">
      <div class="row-between">
        <div>
          <span class="wm-overline">Overview</span>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Manage your IT strategy diagnostic analyses.</p>
        </div>
        <button class="btn btn-primary" data-view="new">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
          New Analysis
        </button>
      </div>
      <div class="dash-stat-grid">
        <div class="dash-stat"><span class="wm-overline">Total Analyses</span><div class="val">0</div></div>
        <div class="dash-stat"><span class="wm-overline">In Progress</span><div class="val">0</div></div>
        <div class="dash-stat"><span class="wm-overline">Completed</span><div class="val">0</div></div>
      </div>
      <div class="dash-empty">
        <h3 style="margin:0 0 8px;font-size:20px">No analyses yet</h3>
        <p style="color:rgba(255,255,255,.7);margin:0 0 20px;font-size:14px">Start a new IT strategy diagnostic to benchmark your IT spending, staffing, and investment posture against <strong style="color:var(--wm-magenta)">industry peers</strong>.</p>
        <button class="btn btn-primary" data-view="new" style="background:var(--wm-magenta);border-color:var(--wm-magenta)">
          New Analysis
        </button>
      </div>
    </div>
  `;
}
