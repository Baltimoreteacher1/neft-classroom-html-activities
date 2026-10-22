/**
 * The in-browser engine both word-problem pages share (student and family): it checks typed
 * answers and choices against the page's #wp-data JSON, gives a hint and a mix-up message on a
 * miss, shows the worked steps after two misses or a right answer, and remembers what was solved.
 * A page supplies its own look and its own tabs; the engine only needs this markup inside each
 * `.wp-card[data-id]`: `input.num-input` or `.choice-btn[data-q][data-i]`, `.check-btn`,
 * `.hint-btn` + `.wp-hint-text`, `.steps-btn` + `.wp-steps-box`, `.feedback-box`, and optionally
 * `.speak-btn` with `.wp-stem` / `.wp-stem-es`.
 */
export const ENGINE_JS = `
function wpEngine(DATA, state, hooks) {
  if (!state.first) state.first = {};
  var ui = DATA.ui;
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function problem(id) { return DATA.problems.filter(function (p) { return p.id === id; })[0]; }

  /* Feedback: English, then the Spanish line that shows when Spanish is on. */
  function say(card, kind, msg, steps) {
    var box = $('.feedback-box', card);
    box.className = 'feedback-box show ' + kind;
    box.textContent = '';
    box.appendChild(make('div', 'wp-fb-en', msg.en));
    box.appendChild(make('div', 'wp-fb-es es-text lang-es', msg.es));
    box.lastChild.lang = 'es';
    if (steps) {
      ['en', 'es'].forEach(function (lang) {
        var list = make('ol', lang === 'es' ? 'es-text lang-es' : 'lang-en');
        if (lang === 'es') list.lang = 'es';
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
    var firstTry = !Number(card.dataset.tries);
    state.solved[P.id] = true;
    if (firstTry) state.first[P.id] = true;
    hooks.save();
    lock(card);
    say(card, 'ok', (firstTry && ui.firstTry) || ui.correct, P.steps);
    hooks.changed(card, P);
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
    if (vals.some(function (v) { return isNaN(v); })) { say(card, 'warn', ui.fill); return; }
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
      if (all) solved(card, P); else say(card, 'ok', ui.next);
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
    say(card, 'ok', ui.correct, P.steps);
  }

  $$('.wp-card').forEach(function (card) {
    var P = problem(card.dataset.id);
    var check = $('.check-btn', card);
    if (check) check.addEventListener('click', function () { checkNumbers(card, P); });
    $$('input.num-input', card).forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkNumbers(card, P); });
    });
    $$('.choice-btn', card).forEach(function (b) { b.addEventListener('click', function () { choose(card, P, b); }); });
    $('.hint-btn', card).addEventListener('click', function () { var h = $('.wp-hint-text', card); h.hidden = !h.hidden; });
    $('.steps-btn', card).addEventListener('click', function () {
      var box = $('.wp-steps-box', card);
      if (!box.firstChild) {
        ['en', 'es'].forEach(function (lang) {
          var list = make('ol', lang === 'es' ? 'es-text lang-es' : 'lang-en');
          if (lang === 'es') list.lang = 'es';
          P.steps[lang].forEach(function (line) { list.appendChild(make('li', '', line)); });
          box.appendChild(list);
        });
      }
      box.hidden = !box.hidden;
    });
    var speak = $('.speak-btn', card);
    if (speak) {
      if (!('speechSynthesis' in window)) speak.hidden = true;
      else speak.addEventListener('click', function () {
        window.speechSynthesis.cancel();
        var en = new SpeechSynthesisUtterance($('.wp-stem', card).textContent);
        en.lang = 'en-US';
        window.speechSynthesis.speak(en);
        if (hooks.speakSpanish()) {
          var es = new SpeechSynthesisUtterance($('.wp-stem-es', card).textContent);
          es.lang = 'es-US';
          window.speechSynthesis.speak(es);
        }
      });
    }
    if (state.solved[P.id]) restore(card, P);
  });
}
`;
