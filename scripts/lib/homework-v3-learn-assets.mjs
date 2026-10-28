/**
 * Styles and behavior for the Learn-stop modules in homework-v3-learn.mjs and the grown-up layer.
 * The top bar is the hero's (homework-hero.mjs); this file only owns the Grown-up tips switch. One delegated click listener, no inline handlers.
 *
 * The CSS for the old co-learning module (CO_LEARNING_CSS / CO_LEARNING_JS) was never injected into any
 * shipped page, which is why its buttons rendered as unstyled browser defaults and its answer checks
 * (transfer, spot the glitch, spiral) did nothing. This replaces it and does ship.
 *
 * A wrong pick is a gentle "try another look": no red, no shake, no answer revealed.
 */
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
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-persona-btn], .hw-transfer-choice-btn, .hw-glitch-step-btn, .hw-spiral-opt-btn');
    if (!t) return;
    if (t.hasAttribute('data-persona-btn')) {
      var want = t.getAttribute('data-persona-btn');
      /* The top-bar button is one switch: pressing it again turns the grown-up tips off. */
      if (want === 'copilot' && t.getAttribute('aria-pressed') === 'true') want = 'student';
      return persona(want);
    }
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
  } catch (e) {}
})();
`;
