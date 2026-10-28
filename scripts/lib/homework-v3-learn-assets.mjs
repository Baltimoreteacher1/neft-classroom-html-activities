/**
 * Styles and behavior for the Learn-stop modules in homework-v3-learn.mjs, the top bar, and the
 * grown-up layer. One delegated click listener, no inline handlers.
 *
 * The CSS for the old co-learning module (CO_LEARNING_CSS / CO_LEARNING_JS) was never injected into any
 * shipped page, which is why its buttons rendered as unstyled browser defaults and its answer checks
 * (transfer, spot the glitch, spiral) did nothing. This replaces it and does ship.
 *
 * A wrong pick is a gentle "try another look": no red, no shake, no answer revealed.
 */
export const V3_LEARN_CSS = `
@media screen {
.hw-topbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; margin: 0 auto 12px; max-width: 1100px; padding: 0 16px; }
.hw-persona-switcher { display: inline-flex; gap: 2px; padding: 4px; border: 1px solid var(--fp-rule, #d9d2c3); border-radius: 999px; background: #fff; }
.hw-topbar button { min-height: 44px; padding: 0 16px; border: 0; border-radius: 999px; background: transparent; color: var(--fp-ink, #17324d); font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; }
.hw-persona-btn.is-active, .hw-topbar button[aria-pressed="true"]:not(.hw-persona-btn) { background: var(--fp-unit-ink, #17324d); color: #fff; }
.hw-topbar button:focus-visible { outline: 3px solid var(--fp-unit-ink, #17324d); outline-offset: 2px; }
.hw-colearn-card { margin: 16px 0; padding: 20px; border: 1px solid var(--fp-rule, #d9d2c3); border-radius: 16px; background: #fff; color: var(--fp-ink, #17324d); }
.hw-colearn-title { margin: 0 0 8px; font-size: 1.25rem; line-height: 1.2; }
.hw-colearn-lead, .hw-colearn-stem, .hw-kitchen-offline-text { margin: 8px 0; font-size: 1rem; line-height: 1.5; max-width: 68ch; }
.hw-colearn-svg-stage { margin: 12px 0 0; }
.hw-colearn-svg-stage svg { display: block; width: 100%; height: auto; max-width: 640px; }
.hw-partner-steps { margin: 12px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.hw-partner-step { display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: start; }
.hw-partner-step-num { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--fp-unit-tint, #e8f4f3); color: var(--fp-unit-ink, #17324d); font-weight: 800; }
.hw-partner-step-body p { margin: 4px 0 0; font-size: 1rem; line-height: 1.5; }
.hw-subcard { margin: 16px 0 0; padding-top: 16px; border-top: 1px solid var(--fp-rule, #d9d2c3); }
.hw-subcard-tag { margin: 0 0 6px; font-size: 1rem; line-height: 1.3; }
.hw-transfer-choices, .hw-glitch-steps, .hw-spiral-options { display: grid; gap: 8px; margin: 12px 0 0; }
.hw-spiral-options { grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
.hw-transfer-choice-btn, .hw-glitch-step-btn, .hw-spiral-opt-btn { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 10px 14px; border: 2px solid var(--fp-rule, #d9d2c3); border-radius: 12px; background: #fff; color: inherit; font: inherit; font-size: 1rem; text-align: start; cursor: pointer; }
.hw-spiral-opt-btn { justify-content: center; }
.hw-transfer-choice-btn:focus-visible, .hw-glitch-step-btn:focus-visible, .hw-spiral-opt-btn:focus-visible { outline: 3px solid var(--fp-unit-ink, #17324d); outline-offset: 2px; }
.hw-choice-letter { display: grid; place-items: center; flex: 0 0 28px; height: 28px; border-radius: 50%; background: var(--fp-unit-tint, #e8f4f3); font-weight: 800; }
.is-correct { border-color: var(--fp-unit-ink, #17324d) !important; background: var(--fp-unit-tint, #e8f4f3) !important; }
.is-correct::after { content: "\\2713"; margin-inline-start: auto; font-weight: 800; }
.is-try-again { border-style: dashed !important; background: #fbf7ec !important; }
.hw-v3-nudge { margin: 8px 0 0; font-size: 1rem; font-weight: 700; }
.hw-glitch-instruction { margin: 8px 0 0; font-size: 1rem; line-height: 1.5; font-weight: 700; }
.hw-glitch-frame { margin: 8px 0 0; }
.hw-transfer-feedback, .hw-glitch-feedback, .hw-spiral-exp { margin: 12px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--fp-unit-tint, #e8f4f3); font-size: 1rem; line-height: 1.5; }
.hw-copilot-card { display: none; margin: 10px 0 0; padding: 10px 14px; border-radius: 12px; background: #fbf7ec; border: 1px solid var(--fp-rule, #d9d2c3); font-size: 1rem; }
body[data-persona-mode="copilot"] .hw-copilot-card { display: block; }
.hw-print-socratic-footer { display: none; }
@media (max-width: 480px) { .hw-spiral-options { grid-auto-flow: row; } .hw-colearn-card { padding: 16px; } }
@media (prefers-reduced-motion: no-preference) { .is-correct { transition: background-color 200ms ease, border-color 200ms ease; } }
}
@media print {
.hw-topbar, .hw-transfer-choices button, .hw-glitch-steps button { display: none !important; }
.hw-print-socratic-footer { display: block; margin-top: 16px; padding-top: 12px; border-top: 1px solid #000; font-size: 12pt; break-inside: avoid; }
}
`;

export const V3_LEARN_JS = `
(function () {
  var LESSON = window.LESSON_ID || 'default';
  function show(el) { if (el) el.hidden = false; }
  function nudge(btn) {
    btn.classList.add('is-try-again');
    var host = btn.closest('.hw-subcard, .hw-spiral-item');
    var n = host && host.querySelector('.hw-v3-nudge');
    if (n) { n.hidden = false; }
  }
  function settle(btn, host, group) {
    group.forEach(function (b) { b.classList.remove('is-try-again'); });
    btn.classList.add('is-correct');
    var n = host && host.querySelector('.hw-v3-nudge');
    if (n) n.hidden = true;
  }
  function persona(mode) {
    var m = mode === 'copilot' ? 'copilot' : 'student';
    document.body.setAttribute('data-persona-mode', m);
    document.querySelectorAll('[data-persona-btn]').forEach(function (b) {
      var on = b.getAttribute('data-persona-btn') === m;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (m === 'copilot') { var g = document.getElementById('hw_grownup'); if (g) g.open = true; }
    try { localStorage.setItem('hw_persona_' + LESSON, m); } catch (e) {}
  }
  function theme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var b = document.getElementById('hw_theme_toggle_btn');
    if (b) b.setAttribute('aria-pressed', dark ? 'true' : 'false');
    try { localStorage.setItem('hw_theme_pref', dark ? 'dark' : 'light'); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-persona-btn], #hw_theme_toggle_btn, .hw-transfer-choice-btn, .hw-glitch-step-btn, .hw-spiral-opt-btn');
    if (!t) return;
    if (t.hasAttribute('data-persona-btn')) return persona(t.getAttribute('data-persona-btn'));
    if (t.id === 'hw_theme_toggle_btn') return theme(document.documentElement.getAttribute('data-theme') !== 'dark');
    if (t.classList.contains('hw-transfer-choice-btn')) {
      var tHost = t.closest('.hw-subcard');
      if (t.getAttribute('data-correct') !== '1') return nudge(t);
      settle(t, tHost, tHost.querySelectorAll('.hw-transfer-choice-btn'));
      return show(tHost.querySelector('.hw-transfer-feedback'));
    }
    if (t.classList.contains('hw-glitch-step-btn')) {
      var gHost = t.closest('.hw-subcard');
      if (t.getAttribute('data-is-glitch') !== '1') return nudge(t);
      settle(t, gHost, gHost.querySelectorAll('.hw-glitch-step-btn'));
      return show(gHost.querySelector('.hw-glitch-feedback'));
    }
    var sHost = t.closest('.hw-spiral-item');
    if (t.getAttribute('data-correct') !== '1') return nudge(t);
    settle(t, sHost, sHost.querySelectorAll('.hw-spiral-opt-btn'));
    show(sHost.querySelector('.hw-spiral-exp'));
  });
  try {
    if (localStorage.getItem('hw_persona_' + LESSON) === 'copilot') persona('copilot');
    theme(localStorage.getItem('hw_theme_pref') === 'dark');
  } catch (e) { theme(false); }
})();
`;
