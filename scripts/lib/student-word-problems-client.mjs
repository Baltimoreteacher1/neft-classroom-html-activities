import { ENGINE_JS } from "./word-problems-engine.mjs";

/**
 * The student word-problems page's own styles and script (tabs, header, progress), as strings the
 * page builder inlines; the shared problem engine comes from word-problems-engine.mjs.
 * Look and feel come from assets/u4-studio.css (the Unit 4 practice studios); only what that
 * sheet has no rule for lives here. The script reads the page's #wp-data JSON, which the
 * generator computes, so no answer is typed in by hand.
 */

export const STUDENT_CSS = `
.wp-target { margin: 0 0 14px; padding: 10px 16px; border-radius: var(--radius-md); background: var(--brand-tint); border-left: 6px solid var(--brand); color: var(--brand-dark); font-weight: 800; display: flex; gap: 10px; align-items: baseline; }
.wp-target .t-es { display: none; font-weight: 600; margin-top: 2px; }
body.show-es .wp-target .t-es { display: block; }
.wp-card { margin-top: 16px; }
.wp-card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
.wp-card-head h3 { margin: 0; font-size: 0.84rem; font-weight: 800; color: var(--brand); }
.wp-card-head .es-text { margin: 0; }
.wp-stem { font-family: var(--font-display); font-size: 1.25rem; color: var(--brand); margin: 0 0 4px; }
.wp-think { margin: 12px 0 0; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--sun-tint); border: 1px solid var(--sun-deep); color: var(--sun-ink); font-size: 0.95rem; }
.wp-think strong { display: block; }
.wp-fields { display: flex; flex-wrap: wrap; gap: 14px 24px; margin: 16px 0 0; }
.wp-field label { display: block; font-weight: 800; color: var(--brand); margin-bottom: 4px; }
.wp-field-row { display: flex; align-items: center; gap: 6px; font-weight: 800; color: var(--brand); }
.wp-field .num-input { width: 130px; }
.wp-question { margin: 16px 0 0; }
.wp-question > p { margin: 0; font-weight: 800; color: var(--brand); }
.wp-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 0; }
.wp-hint-text, .wp-steps-box { margin: 12px 0 0; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--brand-tint); border: 1px solid var(--brand-line); color: var(--brand); }
.wp-hint-text[hidden], .wp-steps-box[hidden], .wp-actions .btn[hidden] { display: none; }
.wp-steps-box ol, .feedback-box ol { margin: 6px 0 0; padding-left: 22px; }
.feedback-box ol.es-text { margin-top: 8px; }
.plan-list { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 12px; counter-reset: plan; }
.plan-step { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: start; background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-md); padding: 14px 18px; }
.plan-step::before { counter-increment: plan; content: counter(plan); width: 44px; height: 44px; border-radius: 50%; background: var(--brand); color: #fff; font: 800 1.3rem var(--font-display); display: grid; place-items: center; }
.plan-step h3 { margin: 0 0 2px; font-size: 1.1rem; color: var(--brand); }
.plan-step p { margin: 0; }
.example-card { margin-top: 20px; }
.example-card h3 { margin: 0 0 6px; color: var(--brand); }
.example-steps { margin: 14px 0 0; padding-left: 22px; display: grid; gap: 10px; }
.example-steps strong { color: var(--brand); }
.example-steps .es-text { margin: 2px 0 0; }
.wp-go { margin-top: 20px; }
@media print {
  .app-header .header-actions, .tab-bar, .wp-actions, .wp-go, .app-footer { display: none !important; }
  .tab-panel { display: block !important; }
  .wp-card { break-inside: avoid; }
}
`;

export const STUDENT_JS = `${ENGINE_JS}
(function () {
  var DATA = JSON.parse(document.getElementById('wp-data').textContent);
  var state = { solved: {}, first: {}, es: false };
  try {
    var saved = JSON.parse(localStorage.getItem(DATA.key) || 'null');
    if (saved && typeof saved === 'object') {
      state.solved = saved.solved && typeof saved.solved === 'object' ? saved.solved : {};
      state.first = saved.first && typeof saved.first === 'object' ? saved.first : {};
      state.es = !!saved.es;
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(DATA.key, JSON.stringify(state)); } catch (e) {} }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return [].slice.call(document.querySelectorAll(sel)); }

  /* Progress: header count and a check on every tab whose problems are all solved. */
  function refresh() {
    var done = DATA.problems.filter(function (p) { return state.solved[p.id]; }).length;
    $('#solved-count').textContent = done + ' / ' + DATA.problems.length;
    Object.keys(DATA.tabs).forEach(function (tab) {
      var ids = DATA.tabs[tab];
      var all = ids.length > 0 && ids.every(function (id) { return state.solved[id]; });
      $('#tab-' + tab).classList.toggle('tab-complete', all);
    });
  }
  wpEngine(DATA, state, { save: save, changed: refresh, speakSpanish: function () { return state.es; } });

  /* Tabs. */
  var tabs = $$('.tab-btn');
  function show(id, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $$('.tab-panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + id); });
    try { localStorage.setItem(DATA.key + '_tab', id); } catch (e) {}
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.dataset.tab, false); });
    t.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (j < 0 || j >= tabs.length) return;
      e.preventDefault();
      show(tabs[j].dataset.tab, true);
    });
  });
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.goto, false); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });

  /* Header actions. */
  var esBtn = $('#toggle-es-btn');
  function setEs(on) {
    state.es = on;
    document.body.classList.toggle('show-es', on);
    esBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    save();
  }
  esBtn.addEventListener('click', function () { setEs(!state.es); });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  var resetBtn = $('#reset-all-btn');
  var armed = null;
  resetBtn.addEventListener('click', function () {
    if (!armed) {
      resetBtn.textContent = DATA.ui.resetSure;
      armed = setTimeout(function () { armed = null; resetBtn.textContent = DATA.ui.reset; }, 4000);
      return;
    }
    state.solved = {};
    state.first = {};
    save();
    location.reload();
  });

  setEs(state.es);
  refresh();
  var start = location.hash.slice(1);
  if (!$('#tab-' + start)) { try { start = localStorage.getItem(DATA.key + '_tab'); } catch (e) { start = null; } }
  show($('#tab-' + start) ? start : 'plan', false);
})();
`;
