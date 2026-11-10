/**
 * Client runtime for Check & Improve (step 4): what each answer shows, a fix, a fresh try.
 * Plain ES5 in the shared page bundle, next to MISSION_JS (shares `hwMissionRead/Write`, `hwMissionSnapshot`,
 * `switchHomeworkTab`, `missionFreshTry`). Everything stays on this device; nothing is sent anywhere.
 *
 * Instructional feedback, not a verdict: for a miss it names what the picked choice shows (the lesson's
 * own authored per-choice feedback), shows the worked reasoning and the answer-key picture, and lets the
 * student correct the ORIGINAL problem before a fresh one. For a right answer it states why it works.
 */
import { MISSION_PRACTICE_COUNT } from "./homework-mission.mjs";

export const FLOW_JS = `
/* ── Check & Improve ─────────────────────────────────────────────────── */
function hwFlowCoreSections() {
  return Array.prototype.filter.call(document.querySelectorAll('.problem-section'), function (s) {
    return !s.closest('.more-practice') && !s.hidden;
  }).slice(0, ${MISSION_PRACTICE_COUNT});
}

/* Remember what a wrong pick showed, in both languages, so Check & Improve can name it later. */
function hwFlowRecordPick(section) {
  var idx = section.id.replace('problem_', '');
  var box = section.querySelector('.mc-options');
  var sel = box && box.querySelector("input[type='radio']:checked");
  if (!sel || sel.value === box.getAttribute('data-correct')) return;
  var fb = [], fbEs = [];
  try { fb = JSON.parse(box.dataset.choiceFeedback || '[]'); fbEs = JSON.parse(box.dataset.choiceFeedbackEs || '[]'); } catch (e) {}
  var label = sel.closest('label');
  var text = label && label.querySelector('.choice-text') ? label.querySelector('.choice-text').textContent.trim() : '';
  var ev = hwMissionRead('evidence', { problems: {} });
  ev.problems = ev.problems || {};
  var p = ev.problems[idx] || {};
  p.picks = (p.picks || []).filter(function (k) { return k.text !== text; });
  p.picks.push({ text: text, en: fb[sel.value] || '', es: fbEs[sel.value] || fb[sel.value] || '' });
  p.picks = p.picks.slice(-3);
  ev.problems[idx] = p;
  hwMissionWrite('evidence', ev);
}

function hwFlowEl(tag, cls, html) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
}
function hwFlowBi(en, es) {
  var wrap = document.createElement('span');
  wrap.innerHTML = '<span class="lang-en"></span><span class="lang-es" lang="es"></span>';
  wrap.querySelector('.lang-en').textContent = en;
  wrap.querySelector('.lang-es').textContent = es || en;
  return wrap.innerHTML;
}

function hwFlowImprove() {
  var host = document.getElementById('hw_improve');
  var empty = document.querySelector('[data-improve-empty]');
  if (!host) return;
  var ev = hwMissionSnapshot();
  var sections = hwFlowCoreSections();
  host.textContent = '';
  var any = false;
  var cards = [];
  sections.forEach(function (s) {
    var idx = s.id.replace('problem_', '');
    var p = (ev.problems || {})[idx] || {};
    var done = s.classList.contains('correct') || s.classList.contains('reviewed') || p.done;
    var tried = done || p.wrong > 0;
    if (tried) any = true;
    var supported = done && (p.wrong || p.hints || p.shown);
    var role = s.getAttribute('data-role') || '';
    var badge = s.querySelector('.problem-number-badge');
    var box = s.querySelector('.mc-options');
    var card = hwFlowEl('article', 'fp-review fp-review--' + (done ? (supported ? 'fixed' : 'clean') : (tried ? 'open' : 'new')));
    card.setAttribute('data-for', idx);
    var status = !tried ? ['Not tried yet', 'Todavía no lo intentas'] : !done ? ['Not yet', 'Todavía no'] : supported ? ['Fixed it', 'Lo corregiste'] : ['Got it', 'Lo lograste'];
    var head = hwFlowEl('header', 'fp-review-head', '<h3 class="fp-review-title">' + (badge ? badge.innerHTML : '') + '</h3><p class="fp-chip">' + hwFlowBi(status[0], status[1]) + '</p>');
    card.appendChild(head);
    var stem = s.querySelector('.problem-stem');
    if (stem) card.appendChild(hwFlowEl('p', 'fp-review-stem', stem.innerHTML));
    var last = (p.picks || []).slice(-1)[0];
    if (!done && last) {
      card.appendChild(hwFlowEl('p', 'fp-review-note', '<strong>' + hwFlowBi('What happened', 'Qué pasó') + '</strong> ' + hwFlowBi(last.en, last.es)));
    } else if (supported && last) {
      card.appendChild(hwFlowEl('p', 'fp-review-note', '<strong>' + hwFlowBi('What your first try showed', 'Qué mostró tu primer intento') + '</strong> ' + hwFlowBi(last.en, last.es)));
    }
    if (tried && box && (box.dataset.explanation || box.dataset.explanationEs)) {
      var why = hwFlowEl('div', 'fp-review-why', '<strong>' + hwFlowBi(supported || !done ? 'Worked reasoning' : 'Why it works', supported || !done ? 'Razonamiento resuelto' : 'Por qué funciona') + '</strong> ' + hwFlowBi(box.dataset.explanation || '', box.dataset.explanationEs || box.dataset.explanation || ''));
      var visual = s.querySelector('.hw-answer-key-visual');
      if (visual && (supported || !done)) why.appendChild(hwFlowEl('div', 'fp-review-visual', visual.innerHTML));
      card.appendChild(why);
    }
    var actions = hwFlowEl('div', 'fp-review-actions');
    var btn = function (act, label, cls) {
      return '<button type="button" class="btn ' + cls + '" data-act="' + act + '" data-args="[&quot;' + idx + '&quot;]">' + label + '</button>';
    };
    if (!tried) actions.innerHTML = btn('hwFlowFix', hwFlowBi('Go to this problem', 'Ir a este problema'), 'btn-primary');
    else if (!done) actions.innerHTML = btn('hwFlowFix', hwFlowBi('Fix my answer', 'Corregir mi respuesta'), 'btn-primary');
    else if (supported) actions.innerHTML = btn('missionFreshTry', hwFlowBi('Try a fresh problem', 'Probar un problema nuevo'), 'btn-primary');
    if (actions.innerHTML) card.appendChild(actions);
    var rank = !tried ? 3 : !done ? 0 : supported ? 1 : 2;
    cards.push({ rank: rank, order: cards.length, card: card });
  });
  /* Ten problems is a lot to read: what still needs attention first, the clean ones last and folded. */
  cards.sort(function (a, b) { return a.rank - b.rank || a.order - b.order; });
  cards.forEach(function (c) { host.appendChild(c.card); });
  if (empty) empty.hidden = any;
  host.hidden = !any;
}

/* Fix: back to the ORIGINAL problem, cleared, so the student corrects the answer they gave. */
function hwFlowFix(idx) {
  var s = document.getElementById('problem_' + idx);
  if (!s) return;
  switchHomeworkTab('check');
  if (!s.classList.contains('correct')) {
    s.querySelectorAll("input[type='radio']:checked").forEach(function (r) { r.checked = false; });
    s.querySelectorAll('.mc-option-label').forEach(function (l) { l.classList.remove('is-incorrect'); });
  }
  var box = s.parentElement;
  var bar = box && box.previousElementSibling;
  if (bar && bar.classList.contains('hw-stepper-bar')) {
    var items = Array.prototype.slice.call(box.querySelectorAll(':scope > .problem-section'));
    var dot = bar.querySelectorAll('.hw-stepper-dot')[items.indexOf(s)];
    if (dot) dot.click();
  }
  setTimeout(function () {
    s.scrollIntoView({ block: 'start', behavior: 'auto' });
    var first = s.querySelector("input[type='radio']");
    if (first) first.focus({ preventScroll: true });
  }, 60);
}
`;
