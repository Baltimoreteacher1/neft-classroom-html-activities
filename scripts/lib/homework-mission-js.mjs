/**
 * Client runtime for the Family Math Mission: the Explore model loader, the notice/wonder notes,
 * the evidence recorder behind the Reflect summary, the fresh-try step after a supported
 * correction, and the Explore more sheet's actions. Plain ES5 inside the shared page bundle (it
 * shares globals with the rest of the page: `switchHomeworkTab`, `setHomeworkRoute`,
 * `problemAttempts`, `revealForced`, `activeCoreProblems`).
 *
 * Everything stays on this device. Nothing here sends data anywhere.
 */
export const MISSION_JS = `
/* ── Family Math Mission ─────────────────────────────────────────────── */
var HW_MISSION_MODEL_URL = '/assets/family-mission/models/index.mjs';
var HW_MISSION_MODEL_CSS = '/assets/family-mission/models/models.css';
var hwMissionModel = null;
var hwMissionModelLoading = false;

function hwMissionKey(name) { return 'hw_mission_' + name + '_' + (window.LESSON_ID || location.pathname); }
function hwMissionRead(name, fallback) {
  try { var raw = localStorage.getItem(hwMissionKey(name)); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}
function hwMissionWrite(name, value) {
  try { localStorage.setItem(hwMissionKey(name), JSON.stringify(value)); } catch (e) {}
}
function hwMissionLang() { return document.body.classList.contains('lang-mode-es') ? 'es' : 'en'; }
function hwMissionBi(en, es) { return document.body.classList.contains('lang-mode-es') ? es : en; }

/* Explore more sheet actions. The sheet is a <dialog>; closing it first returns focus to its opener. */
function hwCloseSheet() {
  var d = document.getElementById('hw_explore_sheet');
  if (d && d.open) d.close();
}
function openOptionalStop(id) {
  hwCloseSheet();
  switchHomeworkTab(id);
}
function chooseExtendedPractice() {
  hwCloseSheet();
  setHomeworkRoute('full', { keepTab: true });
  switchHomeworkTab('check');
}

/* Notice and wonder: saved as the family types, restored on reload. */
function hwMissionNotes() {
  var saved = hwMissionRead('notes', {});
  document.querySelectorAll('[data-mission-note]').forEach(function (box) {
    var id = box.getAttribute('data-mission-note');
    if (saved[id]) box.value = saved[id];
    box.addEventListener('input', function () {
      var cur = hwMissionRead('notes', {});
      cur[id] = box.value.slice(0, 280);
      hwMissionWrite('notes', cur);
    });
  });
}

/* Explore: the interactive model loads the first time the stage opens. */
function hwMissionMountModel() {
  var host = document.getElementById('hw_mission_model');
  if (!host || hwMissionModel || hwMissionModelLoading) return;
  var stage = host.querySelector('[data-mission-stage]');
  var status = host.querySelector('[data-mission-status]');
  var config;
  try { config = JSON.parse(host.getAttribute('data-config') || '{}'); } catch (e) { return; }
  hwMissionModelLoading = true;
  if (!document.querySelector('link[data-mission-models]')) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = HW_MISSION_MODEL_CSS;
    css.setAttribute('data-mission-models', '');
    document.head.appendChild(css);
  }
  import(HW_MISSION_MODEL_URL).then(function (mod) {
    var model = mod.mountModel(stage, host.getAttribute('data-family'), config, {
      lang: hwMissionLang(),
      onChange: function (state, note) {
        hwMissionWrite('model', model.serialize());
        var ev = hwMissionRead('evidence', {});
        ev.modelMoves = (ev.modelMoves || 0) + 1;
        hwMissionWrite('evidence', ev);
        if (status && note) status.textContent = note;
      }
    });
    var saved = null;
    try { saved = localStorage.getItem(hwMissionKey('model')); } catch (e) {}
    if (saved) { try { model.restore(JSON.parse(saved)); } catch (e) {} }
    hwMissionModel = model;
  }).catch(function () {
    /* The static picture and labs still teach; say so quietly instead of leaving a blank box. */
    if (stage) stage.textContent = hwMissionBi('The interactive model did not load. The picture above still works.', 'El modelo interactivo no cargó. El dibujo de arriba sí funciona.');
  }).then(function () { hwMissionModelLoading = false; });
}

/* Evidence: what the family actually did on each practice problem, kept on this device. */
function hwMissionSnapshot() {
  var ev = hwMissionRead('evidence', {});
  ev.problems = ev.problems || {};
  document.querySelectorAll('.problem-section').forEach(function (section) {
    if (section.closest('.more-practice')) return;
    var idx = section.id.replace('problem_', '');
    var done = section.classList.contains('correct') || section.classList.contains('reviewed');
    var wrong = typeof problemAttempts === 'object' ? (problemAttempts[idx] || 0) : 0;
    var hints = section.querySelectorAll('.coach-ladder-step.is-revealed').length;
    var shown = typeof revealForced === 'object' && revealForced[idx] === true;
    var prev = ev.problems[idx] || {};
    if (!done && !wrong && !hints && !prev.done) return;
    ev.problems[idx] = {
      done: !!(done || prev.done),
      wrong: Math.max(wrong, prev.wrong || 0),
      hints: Math.max(hints, prev.hints || 0),
      shown: !!(shown || prev.shown)
    };
  });
  hwMissionWrite('evidence', ev);
  return ev;
}

function hwMissionOfferFreshTry(section) {
  if (section.querySelector('.hw-fresh-try')) return;
  var idx = section.id.replace('problem_', '');
  var ev = hwMissionRead('evidence', { problems: {} });
  var p = (ev.problems || {})[idx] || {};
  if (!(p.wrong > 0 || p.shown)) return;
  var box = document.createElement('div');
  box.className = 'hw-fresh-try';
  box.setAttribute('role', 'status');
  box.innerHTML = '<p><strong><span class="lang-en">You fixed it. Now try a fresh problem to see if it sticks.</span><span class="lang-es" lang="es">Lo corrigieron. Ahora prueben un problema nuevo para ver si se les queda.</span></strong></p>' +
    '<button type="button" class="btn btn-sm btn-primary" data-act="missionFreshTry" data-args="[' + JSON.stringify(idx) + ']"><span class="lang-en">Try a fresh problem</span><span class="lang-es" lang="es">Probar un problema nuevo</span></button>';
  var anchor = section.querySelector('.explanation-box, .visual-explanation-card') || section.querySelector('.problem-body') || section;
  anchor.insertAdjacentElement('afterend', box);
}

/* A fresh problem is the next unsolved problem of this lesson. Today's mission shows three, so
   the extended set opens if the next one is not on screen. Authored items only, never invented. */
function missionFreshTry(idx) {
  var all = Array.prototype.filter.call(document.querySelectorAll('.problem-section'), function (s) { return !s.closest('.more-practice'); });
  var cur = document.getElementById('problem_' + idx);
  var from = all.indexOf(cur);
  var open = function (s) { return !s.classList.contains('correct') && !s.classList.contains('reviewed'); };
  var next = all.slice(from + 1).filter(open)[0] || all.filter(function (s) { return s !== cur && open(s); })[0];
  if (!next) { hwToast('No fresh problems left tonight. Great work!', 'No quedan problemas nuevos hoy. ¡Buen trabajo!', 5000); return; }
  if (next.hidden || next.closest('[hidden]')) setHomeworkRoute('full', { silent: true, keepTab: true });
  switchHomeworkTab('check');
  var box = next.parentElement;
  var bar = box && box.previousElementSibling;
  if (bar && bar.classList.contains('hw-stepper-bar')) {
    var items = Array.prototype.slice.call(box.querySelectorAll(':scope > .problem-section'));
    var dot = bar.querySelectorAll('.hw-stepper-dot')[items.indexOf(next)];
    if (dot) dot.click();
  }
  setTimeout(function () { next.scrollIntoView({ block: 'start', behavior: 'auto' }); }, 60);
}

/* Reflect: a summary made only of what happened. No mastery percentage, no stars for clicking. */
function hwMissionSummary() {
  var host = document.getElementById('hw_mission_summary');
  if (!host) return;
  var ev = hwMissionSnapshot();
  var ids = Object.keys(ev.problems || {});
  var solved = ids.filter(function (k) { return ev.problems[k].done; });
  var clean = solved.filter(function (k) { var p = ev.problems[k]; return !p.wrong && !p.hints && !p.shown; });
  var supported = solved.filter(function (k) { var p = ev.problems[k]; return p.wrong || p.hints || p.shown; });
  var revised = solved.filter(function (k) { return ev.problems[k].wrong > 0; });
  var total = document.querySelectorAll('.problem-section:not([hidden])').length;
  /* Nothing to say yet means nothing is shown: no "0 finished" line before the family has done anything. */
  var wrap = host.closest('[data-mission-evidence]');
  if (wrap) wrap.hidden = !solved.length && !ev.modelMoves;
  var en = [], es = [];
  var title = window.LESSON_TITLE || '';
  var titleEs = window.LESSON_TITLE_ES || title;
  en.push('Today\\'s math idea: ' + title + '.');
  es.push('La idea de hoy: ' + titleEs + '.');
  if (solved.length) {
    en.push('You solved ' + solved.length + (total ? ' of ' + total : '') + ' practice problems.');
    es.push('Resolvieron ' + solved.length + (total ? ' de ' + total : '') + ' problemas de práctica.');
    if (clean.length) { en.push(clean.length + ' without any help.'); es.push(clean.length + ' sin ayuda.'); }
    if (supported.length) { en.push(supported.length + ' with a hint or a second try. That is how learning works.'); es.push(supported.length + ' con una pista o un segundo intento. Así se aprende.'); }
    if (revised.length) { en.push('You changed an answer and got it right.'); es.push('Cambiaron una respuesta y la corrigieron.'); }
  }
  if (ev.modelMoves) { en.push('You explored the model.'); es.push('Exploraron el modelo.'); }
  var next;
  if (!solved.length) next = null;
  else if (supported.length) next = ['Next step: try one problem again tomorrow without hints.', 'Siguiente paso: mañana vuelvan a probar un problema sin pistas.'];
  else if (total && solved.length < total) next = ['Next step: finish the rest of the practice, or stop here. Both are fine.', 'Siguiente paso: terminen el resto de la práctica o paren aquí. Ambas opciones están bien.'];
  else next = ['Next step: try Explore more, or finish for tonight.', 'Siguiente paso: prueben Explorar más o terminen por hoy.'];
  if (!next) { host.innerHTML = ''; return; }
  host.innerHTML = '<ul class="hw-evidence-list"></ul><p class="hw-evidence-next"><strong></strong></p>';
  var ul = host.querySelector('ul');
  en.forEach(function (line, i) {
    var li = document.createElement('li');
    li.innerHTML = '<span class="lang-en"></span><span class="lang-es" lang="es"></span>';
    li.querySelector('.lang-en').textContent = line;
    li.querySelector('.lang-es').textContent = es[i];
    ul.appendChild(li);
  });
  host.querySelector('strong').innerHTML = '<span class="lang-en"></span><span class="lang-es" lang="es"></span>';
  host.querySelector('.lang-en').textContent = next[0];
  host.querySelector('.lang-es').textContent = next[1];
  var pre = document.querySelector('[data-mission-prereq]');
  if (pre) pre.hidden = !supported.length;
}

function hwMissionBoot() {
  hwMissionNotes();
  var observer = new MutationObserver(function (list) {
    list.forEach(function (rec) {
      var el = rec.target;
      if (el.classList && el.classList.contains('problem-section')) {
        hwMissionSnapshot();
        if (el.classList.contains('correct')) hwMissionOfferFreshTry(el);
      }
    });
  });
  document.querySelectorAll('.problem-section').forEach(function (s) { observer.observe(s, { attributes: true, attributeFilter: ['class'] }); });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.coach-ladder-step button')) setTimeout(hwMissionSnapshot, 0);
  });
  var tabWatch = new MutationObserver(function () {
    var tab = document.body.dataset.activeTab;
    if (tab === 'explore') hwMissionMountModel();
    if (tab === 'done') hwMissionSummary();
  });
  tabWatch.observe(document.body, { attributes: true, attributeFilter: ['data-active-tab'] });
  var langWatch = new MutationObserver(function () {
    if (hwMissionModel && hwMissionModel.setLang) hwMissionModel.setLang(hwMissionLang());
  });
  langWatch.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (document.body.dataset.activeTab === 'explore') hwMissionMountModel();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hwMissionBoot);
else hwMissionBoot();
`;
