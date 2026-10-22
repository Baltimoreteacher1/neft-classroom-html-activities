/**
 * The student word-problems page's own styles and script, as strings the page builder inlines.
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

export const STUDENT_JS = `
(function () {
  var DATA = JSON.parse(document.getElementById('wp-data').textContent);
  var state = { solved: {}, es: false };
  try {
    var saved = JSON.parse(localStorage.getItem(DATA.key) || 'null');
    if (saved && typeof saved === 'object') {
      state.solved = saved.solved && typeof saved.solved === 'object' ? saved.solved : {};
      state.es = !!saved.es;
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(DATA.key, JSON.stringify(state)); } catch (e) {} }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function problem(id) { return DATA.problems.filter(function (p) { return p.id === id; })[0]; }

  /* Feedback: English, then the Spanish line that shows when Español is on. */
  function say(card, kind, msg, steps) {
    var box = $('.feedback-box', card);
    box.className = 'feedback-box show ' + kind;
    box.textContent = '';
    box.appendChild(make('div', '', msg.en));
    box.appendChild(make('div', 'es-text', msg.es));
    if (steps) {
      ['en', 'es'].forEach(function (lang) {
        var list = make('ol', lang === 'es' ? 'es-text' : '');
        steps[lang].forEach(function (line) { list.appendChild(make('li', '', line)); });
        box.appendChild(list);
      });
    }
  }

  function parseNum(v) {
    var t = String(v).replace(/[$,\\s]/g, '');
    if (t === '') return NaN;
    var n = Number(t);
    return isFinite(n) ? n : NaN;
  }

  function lock(card) {
    $$('input, .choice-btn', card).forEach(function (el) { el.disabled = true; });
    $$('.wp-actions .btn', card).forEach(function (b) { b.hidden = true; });
    card.classList.add('wp-solved');
  }

  function solved(card, P) {
    state.solved[P.id] = true;
    save();
    lock(card);
    say(card, 'ok', DATA.ui.correct, P.steps);
    refresh();
  }

  function miss(card, P, msg) {
    var tries = (Number(card.dataset.tries) || 0) + 1;
    card.dataset.tries = String(tries);
    say(card, 'err', msg);
    $('.hint-btn', card).hidden = false;
    if (tries >= 2) $('.steps-btn', card).hidden = false;
  }

  function checkNumbers(card, P) {
    var inputs = $$('input.num-input', card);
    var vals = inputs.map(function (i) { return parseNum(i.value); });
    if (vals.some(function (v) { return isNaN(v); })) { say(card, 'warn', DATA.ui.fill); return; }
    var wrong = -1;
    inputs.forEach(function (inp, i) {
      var ok = Math.abs(vals[i] - P.fields[i].answer) < 0.005;
      inp.classList.toggle('ok', ok);
      inp.classList.toggle('err', !ok);
      if (!ok && wrong < 0) wrong = i;
    });
    if (wrong < 0) { solved(card, P); return; }
    var field = P.fields[wrong];
    var msg = field.generic;
    field.wrong.forEach(function (w) { if (Math.abs(w.value - vals[wrong]) < 0.005) msg = w.msg; });
    miss(card, P, msg);
  }

  function choose(card, P, btn) {
    var q = P.questions[Number(btn.dataset.q)];
    var i = Number(btn.dataset.i);
    var group = $$('.choice-btn[data-q="' + btn.dataset.q + '"]', card);
    if (i === q.correct) {
      group.forEach(function (b) { b.disabled = true; });
      btn.classList.add('correct');
      card.dataset['q' + btn.dataset.q] = 'ok';
      var all = P.questions.every(function (_, k) { return card.dataset['q' + k] === 'ok'; });
      if (all) solved(card, P); else say(card, 'ok', DATA.ui.next);
      return;
    }
    btn.classList.add('wrong');
    btn.disabled = true;
    miss(card, P, q.wrong[i]);
  }

  function restore(card, P) {
    $$('input.num-input', card).forEach(function (inp, i) { inp.value = String(P.fields[i].answer); inp.classList.add('ok'); });
    $$('.choice-btn', card).forEach(function (b) {
      if (P.questions[Number(b.dataset.q)].correct === Number(b.dataset.i)) b.classList.add('correct');
    });
    lock(card);
    say(card, 'ok', DATA.ui.correct, P.steps);
  }

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

  /* Cards. */
  $$('.wp-card').forEach(function (card) {
    var P = problem(card.dataset.id);
    $('.check-btn', card) && $('.check-btn', card).addEventListener('click', function () { checkNumbers(card, P); });
    $$('input.num-input', card).forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkNumbers(card, P); });
    });
    $$('.choice-btn', card).forEach(function (b) { b.addEventListener('click', function () { choose(card, P, b); }); });
    $('.hint-btn', card).addEventListener('click', function () { var h = $('.wp-hint-text', card); h.hidden = !h.hidden; });
    $('.steps-btn', card).addEventListener('click', function () {
      var box = $('.wp-steps-box', card);
      if (!box.firstChild) {
        ['en', 'es'].forEach(function (lang) {
          var list = make('ol', lang === 'es' ? 'es-text' : '');
          P.steps[lang].forEach(function (line) { list.appendChild(make('li', '', line)); });
          box.appendChild(list);
        });
      }
      box.hidden = !box.hidden;
    });
    var speak = $('.speak-btn', card);
    if (!('speechSynthesis' in window)) speak.hidden = true;
    else speak.addEventListener('click', function () {
      window.speechSynthesis.cancel();
      var say1 = new SpeechSynthesisUtterance($('.wp-stem', card).textContent);
      say1.lang = 'en-US';
      window.speechSynthesis.speak(say1);
      if (state.es) {
        var say2 = new SpeechSynthesisUtterance($('.wp-stem-es', card).textContent);
        say2.lang = 'es-US';
        window.speechSynthesis.speak(say2);
      }
    });
    if (state.solved[P.id]) restore(card, P);
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
