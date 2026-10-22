/**
 * The family word-problems page's own look and script. The homework stylesheets (loaded by the page)
 * supply the hero, tabs, cards and language mode; this adds what they have no rule for: answer
 * boxes, choices, feedback, picture bars, the Grown-up corner, the percent-bar explorer, the
 * celebration and the certificate. The shared problem engine comes from word-problems-engine.mjs.
 */
import { ENGINE_JS } from "./word-problems-engine.mjs";

export const FAMILY_CSS = `
:root { --wp-ok: #0b6b3d; --wp-ok-tint: #e4f4ea; --wp-bad: #a3231a; --wp-bad-tint: #fdeceb; }
.wp-card { margin-top: 18px; break-inside: avoid; }
.wp-card .problem-number-badge { display: inline-flex; align-items: center; gap: 8px; }
.wp-emoji { font-size: 1.6rem; line-height: 1; }
.wp-card .problem-header-row { align-items: center; gap: 10px; flex-wrap: wrap; }
.wp-card .problem-stem { font-size: 1.3rem; line-height: 1.45; }
.wp-fields { display: flex; flex-wrap: wrap; gap: 14px 26px; margin: 16px 0 0; }
.wp-field label { display: block; font-weight: 800; color: var(--fp-unit-ink); margin-bottom: 4px; }
.wp-field-row { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.3rem; color: var(--fp-unit-ink); }
.wp-card .num-input { width: 150px; min-height: 52px; font: 800 1.35rem var(--fp-sans); color: var(--fp-ink); text-align: center; background: #fff; border: 3px solid var(--fp-unit); border-radius: 14px; padding: 6px 10px; }
.wp-card .num-input:focus { outline: 3px solid var(--fp-note); outline-offset: 2px; border-color: var(--fp-unit-ink); }
.wp-card .num-input.ok { border-color: var(--wp-ok); background: var(--wp-ok-tint); color: var(--wp-ok); }
.wp-card .num-input.err { border-color: var(--wp-bad); background: var(--wp-bad-tint); color: var(--wp-bad); }
.wp-question { margin: 16px 0 0; }
.wp-question > p { margin: 0 0 8px; font-weight: 800; color: var(--fp-unit-ink); }
.choice-stack { display: grid; gap: 10px; counter-reset: wpc; }
.choice-btn { appearance: none; display: flex; align-items: center; gap: 12px; text-align: left; font: 700 1.1rem var(--fp-sans); color: var(--fp-ink); background: #fff; border: 3px solid var(--fp-rule); border-radius: 14px; padding: 10px 16px; min-height: 56px; cursor: pointer; }
.choice-btn::before { counter-increment: wpc; content: counter(wpc, upper-alpha); flex: 0 0 34px; height: 34px; border-radius: 50%; background: var(--fp-unit-tint); color: var(--fp-unit-ink); font-weight: 800; display: grid; place-items: center; }
.choice-btn:hover:not([disabled]) { border-color: var(--fp-unit); background: var(--fp-unit-tint); }
.choice-btn.correct { border-color: var(--wp-ok); background: var(--wp-ok-tint); color: #064e2b; }
.choice-btn.correct::before { content: "\\2713"; background: var(--wp-ok); color: #fff; }
.choice-btn.wrong { border-color: var(--wp-bad); background: var(--wp-bad-tint); color: #7d1a13; }
.choice-btn.wrong::before { content: "\\2715"; background: var(--wp-bad); color: #fff; }
.wp-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 0; }
.wp-actions .btn[hidden], .wp-hint-text[hidden], .wp-steps-box[hidden] { display: none; }
.wp-hint-text, .wp-steps-box { margin: 12px 0 0; padding: 12px 16px; border-radius: 12px; background: var(--fp-note); color: var(--fp-note-ink); }
.feedback-box { display: none; margin: 14px 0 0; padding: 12px 16px; border-radius: 12px; font-weight: 600; }
.feedback-box.show { display: block; }
.feedback-box.ok { background: var(--wp-ok-tint); border: 2px solid var(--wp-ok); color: #064e2b; }
.feedback-box.err { background: var(--wp-bad-tint); border: 2px solid var(--wp-bad); color: #7d1a13; }
.feedback-box.warn { background: var(--fp-note); border: 2px solid #d9a400; color: var(--fp-note-ink); }
.feedback-box ol { margin: 8px 0 0; padding-left: 22px; font-weight: 500; }
.wp-corner, .wp-picture { margin-top: 12px; border: 2px solid var(--fp-rule); border-radius: 14px; background: #fff; }
.wp-corner summary, .wp-picture summary { cursor: pointer; font-weight: 800; color: var(--fp-unit-ink); padding: 12px 16px; min-height: 44px; }
.wp-corner > div, .wp-picture > div { padding: 0 16px 14px; }
.wp-corner p { margin: 8px 0 0; }
.wp-corner ul { margin: 6px 0 0; padding-left: 22px; }
.wp-bar { height: 30px; border: 2px solid var(--fp-unit-ink); border-radius: 10px; overflow: hidden; background: #fff repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), var(--fp-rule) calc(10% - 1px) 10%); margin: 6px 0; }
.wp-bar-fill { display: block; height: 100%; background: var(--fp-unit); }
.wp-pic-label { margin: 10px 0 0; font-weight: 700; }
.wp-pic-note { margin: 4px 0 0; color: var(--fp-ink-soft); }
.wp-team { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); margin: 14px 0 0; padding: 0; list-style: none; }
.wp-team li { background: #fff; border: 2px solid var(--fp-rule); border-radius: 16px; padding: 14px 16px; }
.wp-team .wp-role-emoji { font-size: 2rem; display: block; }
.wp-team h3 { margin: 4px 0 2px; font-size: 1.1rem; color: var(--fp-unit-ink); }
.wp-team p { margin: 0; }
.wp-explorer { margin-top: 18px; }
.wp-explorer h3 { margin: 0 0 4px; }
.wp-explorer-controls { display: flex; flex-wrap: wrap; gap: 14px 28px; align-items: end; margin: 12px 0 0; }
.wp-range-row { display: flex; align-items: center; gap: 12px; font-size: 1.2rem; color: var(--fp-unit-ink); }
.wp-explorer-controls label { display: block; font-weight: 800; color: var(--fp-unit-ink); margin-bottom: 4px; }
.wp-explorer input[type=range] { width: min(320px, 100%); accent-color: var(--fp-unit); min-height: 32px; }
.wp-explorer input[type=number] { width: 130px; min-height: 48px; font: 800 1.2rem var(--fp-sans); border: 3px solid var(--fp-unit); border-radius: 12px; padding: 4px 10px; text-align: center; }
.wp-cells { display: grid; grid-template-columns: repeat(20, 1fr); gap: 2px; margin: 14px 0 6px; }
.wp-cells span { height: 34px; border-radius: 4px; background: #fff; border: 1px solid var(--fp-rule); }
.wp-cells span.on { background: var(--fp-unit); border-color: var(--fp-unit-ink); }
.wp-bar-out { font-size: 1.2rem; font-weight: 800; color: var(--fp-unit-ink); margin: 6px 0 0; }
.wp-bar-out small { display: block; font-size: 1rem; font-weight: 600; color: var(--fp-ink-soft); }
.wp-stars { font-weight: 800; }
.wp-meter { height: 12px; border-radius: 99px; background: rgba(255,255,255,.3); overflow: hidden; margin: 10px 0 0; }
.wp-meter > span { display: block; height: 100%; width: 0; background: #ffd34d; transition: width .4s ease; }
.homework-tab-btn.wp-tab-complete .tab-label::after { content: " \\2713"; font-weight: 800; }
.wp-cert-wrap { margin-top: 18px; }
.wp-cert { position: relative; text-align: center; padding: 28px 22px; border: 6px double var(--fp-unit-ink); border-radius: 18px; background: #fffdf8; }
.wp-cert.locked { opacity: .45; filter: grayscale(.6); }
.wp-cert h3 { margin: 0; font: 700 1.7rem var(--fp-serif); color: var(--fp-unit-ink); }
.wp-cert .wp-cert-star { font-size: 2.4rem; }
.wp-cert input { font: 700 1.5rem var(--fp-serif); text-align: center; border: 0; border-bottom: 3px solid var(--fp-unit); background: transparent; width: min(420px, 100%); color: var(--fp-ink); padding: 6px; }
.wp-cert p { margin: 10px 0 0; }
.wp-celebrate-msg { margin: 14px 0 0; padding: 14px 18px; border-radius: 14px; background: var(--wp-ok-tint); border: 2px solid var(--wp-ok); font-weight: 700; color: #064e2b; }
.wp-hunt { margin-top: 18px; }
.wp-links { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; margin: 22px 0 0; }
.wp-links a { color: var(--fp-unit-ink); font-weight: 700; }
#wp-confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 9999; }
.wp-confetti { position: absolute; top: -20px; width: 10px; height: 16px; border-radius: 2px; }
@media (prefers-reduced-motion: no-preference) {
  .wp-card.wp-pop { animation: wp-pop .5s ease; }
  .wp-confetti { animation: wp-fall 2.6s ease-in forwards; }
  .homework-tab-btn.wp-pulse { animation: wp-pulse 1s ease 3; }
}
@keyframes wp-pop { 0% { transform: scale(1); } 40% { transform: scale(1.015); box-shadow: 0 0 0 6px var(--wp-ok-tint); } 100% { transform: scale(1); } }
@keyframes wp-fall { to { transform: translateY(110vh) rotate(540deg); opacity: .9; } }
@keyframes wp-pulse { 50% { box-shadow: 0 0 0 6px #ffd34d; } }
@media print {
  .hw-hero-controls, .homework-tab-chrome, .tab-flow-nav, .wp-links, .wp-actions, .wp-hint-text, .wp-steps-box, .hw-answer-key, .wp-explorer-controls, #wp-confetti { display: none !important; }
  [data-tab-panel][hidden] { display: block !important; }
  .wp-card .hw-work-input { min-height: 120px; }
  body.wp-print-cert * { visibility: hidden; }
  body.wp-print-cert #wp-cert, body.wp-print-cert #wp-cert * { visibility: visible; }
  body.wp-print-cert #wp-cert { position: absolute; left: 0; top: 0; width: 100%; opacity: 1; filter: none; }
}
`;

const FAMILY_STATE_JS = `
(function () {
  var DATA = JSON.parse(document.getElementById('wp-data').textContent);
  var state = { solved: {}, first: {}, name: '', celebrated: false };
  try {
    var saved = JSON.parse(localStorage.getItem(DATA.key) || 'null');
    if (saved && typeof saved === 'object') {
      state.solved = saved.solved && typeof saved.solved === 'object' ? saved.solved : {};
      state.first = saved.first && typeof saved.first === 'object' ? saved.first : {};
      state.name = typeof saved.name === 'string' ? saved.name : '';
      state.celebrated = !!saved.celebrated;
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(DATA.key, JSON.stringify(state)); } catch (e) {} }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return [].slice.call(document.querySelectorAll(sel)); }
  var motionOk = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var total = DATA.problems.length;

  /* Language: same storage key and body classes as the homework page. */
  var langButtons = $$('.lang-toggle-btn');
  function showLang(mode) {
    document.body.classList.remove('lang-mode-bilingual', 'lang-mode-en', 'lang-mode-es');
    document.body.classList.add('lang-mode-' + mode);
    document.documentElement.lang = mode === 'es' ? 'es' : 'en';
    $$('[data-aria-en]').forEach(function (el) {
      el.setAttribute('aria-label', mode === 'es' ? el.dataset.ariaEs : el.dataset.ariaEn);
    });
    langButtons.forEach(function (b) {
      var on = b.getAttribute('data-lang-mode') === mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var mode = b.getAttribute('data-lang-mode');
      try { localStorage.setItem('hw_lang_mode', mode); } catch (e) {}
      showLang(mode);
    });
  });
  showLang(document.body.className.match(/lang-mode-(bilingual|en|es)/)[1]);

  /* Confetti: skipped when the family has asked their device for less motion. */
  function confetti() {
    if (!motionOk) return;
    var box = $('#wp-confetti');
    var colors = ['#ffd34d', '#ff7a59', '#4cc3a5', '#5b8def', '#e86aa6'];
    for (var i = 0; i < 40; i++) {
      var piece = document.createElement('span');
      piece.className = 'wp-confetti';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      box.appendChild(piece);
    }
    setTimeout(function () { box.textContent = ''; }, 4200);
  }

  /* Progress: stars, the hero meter, a check on finished tabs, and the certificate. */
  function refresh() {
    var done = DATA.problems.filter(function (p) { return state.solved[p.id]; }).length;
    $('#wp-stars').textContent = String(done);
    $('#wp-meter-fill').style.width = (done / total) * 100 + '%';
    Object.keys(DATA.tabs).forEach(function (tab) {
      var ids = DATA.tabs[tab];
      $('#wp_tab_' + tab).classList.toggle('wp-tab-complete', ids.every(function (id) { return state.solved[id]; }));
    });
    var all = done === total;
    $('#wp-cert').classList.toggle('locked', !all);
    $('#wp-print-cert').disabled = !all;
    $('#wp-cert-locked').hidden = all;
    $('#wp-cert-done').hidden = !all;
    $('#wp-first').textContent = String(Object.keys(state.first).filter(function (id) { return state.solved[id]; }).length);
    if (all && !state.celebrated) {
      state.celebrated = true;
      save();
      confetti();
      $('#wp_tab_done').classList.add('wp-pulse');
    }
  }
  wpEngine(DATA, state, {
    save: save,
    changed: function (card) {
      if (card && motionOk) { card.classList.remove('wp-pop'); void card.offsetWidth; card.classList.add('wp-pop'); }
      refresh();
    },
    speakSpanish: function () { return !document.body.classList.contains('lang-mode-en'); }
  });

  /* Tabs: one stop at a time, #<stop> opens a stop, the last stop is remembered. */
  var tabs = $$('.homework-tab-btn');
  var panels = $$('[data-tab-panel]');
  var fill = $('#hw_tab_track_fill');
  var ids = tabs.map(function (t) { return t.dataset.tab; });
  function show(id, scroll) {
    if (ids.indexOf(id) < 0) id = ids[0];
    tabs.forEach(function (t, i) {
      var on = t.dataset.tab === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) {
        t.setAttribute('aria-current', 'step');
        t.classList.remove('wp-pulse');
        if (fill) fill.style.width = ((i + 1) / tabs.length) * 100 + '%';
      } else t.removeAttribute('aria-current');
    });
    panels.forEach(function (p) { p.hidden = p.dataset.tabPanel !== id; });
    try { localStorage.setItem(DATA.key + '_tab', id); } catch (e) {}
    var bar = $('.homework-tab-chrome');
    if (scroll && bar) bar.scrollIntoView({ block: 'start', behavior: motionOk ? 'smooth' : 'auto' });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { show(t.dataset.tab, false); });
    t.addEventListener('keydown', function (e) {
      var i = ids.indexOf(t.dataset.tab);
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : -1;
      if (j < 0 || j >= ids.length) return;
      e.preventDefault();
      show(ids[j], false);
      tabs[j].focus();
    });
  });
  $$('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.next, true); });
  });

  /* Percent-bar explorer. */
  var range = $('#wp-bar-percent');
  var whole = $('#wp-bar-whole');
  function trim(n) { return String(Math.round(n * 100) / 100); }
  function drawBar() {
    var p = Number(range.value);
    var w = Number(whole.value);
    if (!isFinite(w) || w < 0) w = 0;
    $('#wp-bar-pct').textContent = p + '%';
    var cells = $('#wp-cells');
    cells.textContent = '';
    for (var i = 0; i < 20; i++) {
      var c = document.createElement('span');
      if (i < p / 5) c.className = 'on';
      cells.appendChild(c);
    }
    var part = (p * w) / 100;
    var dec = trim(p / 100);
    var out = $('#wp-bar-out');
    out.textContent = '';
    var en = document.createElement('span');
    en.className = 'lang-en';
    en.innerHTML = '<span></span><small></small>';
    en.firstChild.textContent = p + '% of ' + trim(w) + ' = ' + trim(part);
    en.lastChild.textContent = 'As a decimal, ' + p + '% = ' + dec + ', so ' + dec + ' × ' + trim(w) + ' = ' + trim(part) + '.';
    var es = document.createElement('span');
    es.className = 'lang-es';
    es.lang = 'es';
    es.innerHTML = '<span></span><small></small>';
    es.firstChild.textContent = p + '% de ' + trim(w) + ' = ' + trim(part);
    es.lastChild.textContent = 'Como decimal, ' + p + '% = ' + dec + ', así que ' + dec + ' × ' + trim(w) + ' = ' + trim(part) + '.';
    out.appendChild(en);
    out.appendChild(es);
  }
  range.addEventListener('input', drawBar);
  whole.addEventListener('input', drawBar);
  drawBar();

  /* Certificate. */
  var nameBox = $('#wp-name');
  nameBox.value = state.name;
  function stamp() {
    $('#wp-cert-date').textContent = new Date().toLocaleDateString(document.documentElement.lang === 'es' ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  nameBox.addEventListener('input', function () { state.name = nameBox.value; save(); stamp(); });
  $('#wp-print-cert').addEventListener('click', function () {
    stamp();
    document.body.classList.add('wp-print-cert');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('wp-print-cert'); });
  stamp();

  $('#wp-reset').addEventListener('click', function () {
    var btn = $('#wp-reset');
    if (!btn.dataset.armed) {
      btn.dataset.armed = '1';
      btn.textContent = DATA.ui.resetSure;
      setTimeout(function () { delete btn.dataset.armed; btn.textContent = DATA.ui.reset; }, 4000);
      return;
    }
    state.solved = {};
    state.first = {};
    state.celebrated = false;
    save();
    location.reload();
  });

  refresh();
  var start = location.hash.slice(1);
  if (ids.indexOf(start) < 0) { try { start = localStorage.getItem(DATA.key + '_tab'); } catch (e) { start = null; } }
  show(start, false);
})();
`;

export const FAMILY_JS = `${ENGINE_JS}${FAMILY_STATE_JS}`;

// Same storage key and body classes as the homework page, so a family that picked Spanish there
// finds Spanish here. Runs before first paint and fails toward showing English.
export const LANGUAGE_BOOT = `(function () {
  var mode = 'bilingual';
  try {
    var asked = new URLSearchParams(location.search).get('lang');
    var saved = localStorage.getItem('hw_lang_mode');
    var ok = function (m) { return m === 'en' || m === 'es' || m === 'bilingual'; };
    if (ok(asked)) mode = asked;
    else if (ok(saved)) mode = saved;
    else {
      var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
      for (var i = 0; i < langs.length; i++) if (String(langs[i]).toLowerCase().indexOf('es') === 0) { mode = 'es'; break; }
    }
  } catch (e) {}
  document.body.classList.add('lang-mode-' + mode);
  document.documentElement.lang = mode === 'es' ? 'es' : 'en';
})();`;

export const LANGUAGE_SELECTOR = `<div class="lang-selector-card">
  <span class="lang-selector-title">Language / Idioma</span>
  <div class="lang-selector-buttons" role="group" aria-label="Language Mode Selector" data-aria-en="Language Mode Selector" data-aria-es="Seleccionar idioma">
    <button type="button" class="lang-toggle-btn active" data-lang-mode="bilingual" aria-pressed="true">🇺🇸🇪🇸 <span class="lang-btn-long">Bilingual / Bilingüe</span><span class="lang-btn-short">EN + ES</span></button>
    <button type="button" class="lang-toggle-btn" data-lang-mode="en" aria-pressed="false">🇺🇸 <span>English</span></button>
    <button type="button" class="lang-toggle-btn" data-lang-mode="es" aria-pressed="false">🇪🇸 <span>Español</span></button>
  </div>
</div>`;
