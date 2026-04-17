'use strict';

// ══════════════════════════════════════════════════════════════
// Global state + router
// ══════════════════════════════════════════════════════════════
const state = {
  selectedLevel: 'Quick Read', // matches screenshot state
  currentView: 'new',
  // Wizard state
  wizardIndex: 0,
  answers: {},
  // Form state
  formStep: 0,
  formPriorExpanded: false,
  formData: null,
  // File-drop state
  fdStep: 'upload',
  fdFiles: {},
  fdParsed: {},
  fdParseStatus: 'idle',
  fdParseMessages: [],
  fdCompany: {},
};

const VIEW_MAP = {
  new: { sel: '#view-new', init: renderNewAnalysisView },
  dashboard: { sel: '#view-dashboard', init: renderDashboardView },
  wizard: { sel: '#view-wizard', init: renderWizardView },
  form: { sel: '#view-form', init: renderFormView },
  'file-drop': { sel: '#view-filedrop', init: renderFileDropView },
  review: { sel: '#view-review', init: renderReviewView },
  results: { sel: '#view-results', init: renderResultsView },
};

function showView(view) {
  state.currentView = view;
  $$('.view').forEach(v => v.classList.remove('active'));
  const entry = VIEW_MAP[view] || VIEW_MAP.new;
  const target = document.querySelector(entry.sel);
  if (target) target.classList.add('active');
  if (typeof entry.init === 'function') entry.init();

  // Sidebar active state: any sub-view stays on "New Analysis" except dashboard
  $$('.sidebar nav a').forEach(a => a.classList.remove('active'));
  const sidebarView = view === 'dashboard' ? 'dashboard' : 'new';
  const activeLink = document.querySelector(`.sidebar nav a[data-view="${sidebarView}"]`);
  if (activeLink) activeLink.classList.add('active');

  window.scrollTo(0, 0);
}

// Global click delegation for [data-view] elements
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-view]');
  if (t && t.dataset.view) {
    e.preventDefault();
    showView(t.dataset.view);
  }
});

// Boot
showView('new');
