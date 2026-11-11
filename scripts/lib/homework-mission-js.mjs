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
/* hwFlowCoreSections, hwFlowRecordPick, hwFlowImprove: homework-flow-js.mjs, same page scope. */
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
      shown: !!(shown || prev.shown),
      picks: prev.picks || []
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

/* Finish: what was practiced, one strength (only when the family's own responses support it), one
   next step. Made only of what happened: no mastery percentage, no stars for clicking. */
function hwMissionSummary() {
  var host = document.getElementById('hw_mission_summary');
  if (!host) return;
  var ev = hwMissionSnapshot();
  var core = hwFlowCoreSections();
  var coreIds = core.map(function (s) { return s.id.replace('problem_', ''); });
  var ids = Object.keys(ev.problems || {}).filter(function (k) { return coreIds.indexOf(k) > -1; });
  var solved = ids.filter(function (k) { return ev.problems[k].done; });
  var clean = solved.filter(function (k) { var p = ev.problems[k]; return !p.wrong && !p.hints && !p.shown; });
  var supported = solved.filter(function (k) { var p = ev.problems[k]; return p.wrong || p.hints || p.shown; });
  var revised = solved.filter(function (k) { return ev.problems[k].wrong > 0; });
  var total = core.length;
  var wrap = host.closest('[data-mission-evidence]');
  if (wrap) wrap.hidden = !solved.length && !ev.modelMoves;
  if (!solved.length && !ev.modelMoves) { host.innerHTML = ''; return; }
  var title = window.LESSON_TITLE || '';
  var titleEs = window.LESSON_TITLE_ES || title;
  var roleOf = function (k) { var s = document.getElementById('problem_' + k); return (s && s.getAttribute('data-role')) || ''; };
  var rows = [];
  rows.push(['You practiced', 'Practicaron', title + (solved.length ? '. You solved ' + solved.length + (total ? ' of ' + total : '') + ' problems.' : '.'), titleEs + (solved.length ? '. Resolvieron ' + solved.length + (total ? ' de ' + total : '') + ' problemas.' : '.')]);
  if (clean.length) {
    var named = clean.map(roleOf).filter(Boolean);
    rows.push(['A strength', 'Una fortaleza', 'You solved ' + (named.length ? 'problem ' + named.join(', ') : clean.length + ' without help') + (named.length ? ' without a hint or a second try.' : '.'), 'Resolvieron ' + (named.length ? 'el problema ' + named.join(', ') : clean.length + ' sin ayuda') + (named.length ? ' sin pista ni segundo intento.' : '.')]);
  } else if (revised.length) {
    rows.push(['A strength', 'Una fortaleza', 'You changed an answer and got it right.', 'Cambiaron una respuesta y la corrigieron.']);
  } else if (ev.modelMoves) {
    rows.push(['A strength', 'Una fortaleza', 'You explored the model.', 'Exploraron el modelo.']);
  }
  var next;
  if (supported.length) next = ['Try one problem like this again tomorrow, without hints.', 'Mañana prueben otro problema como este, sin pistas.'];
  else if (total && solved.length < total) next = ['Finish the rest of Your Turn, or stop here. Both are fine.', 'Terminen el resto de Tu turno o paren aquí. Ambas opciones están bien.'];
  else next = ['Look for this idea in everyday life, or finish for tonight.', 'Busquen esta idea en la vida diaria o terminen por hoy.'];
  rows.push(['Next step', 'Siguiente paso', next[0], next[1]]);
  host.innerHTML = '<dl class="hw-evidence-list"></dl>';
  var dl = host.querySelector('dl');
  rows.forEach(function (r) {
    var dt = document.createElement('dt');
    dt.innerHTML = '<span class="lang-en"></span><span class="lang-es" lang="es"></span>';
    dt.querySelector('.lang-en').textContent = r[0];
    dt.querySelector('.lang-es').textContent = r[1];
    var dd = document.createElement('dd');
    dd.innerHTML = '<span class="lang-en"></span><span class="lang-es" lang="es"></span>';
    dd.querySelector('.lang-en').textContent = r[2];
    dd.querySelector('.lang-es').textContent = r[3];
    dl.appendChild(dt);
    dl.appendChild(dd);
  });
  var pre = document.querySelector('[data-mission-prereq]');
  if (pre) pre.hidden = !supported.length;
  hwRenderMathWin(ev, solved, clean, supported, revised, total, title, titleEs);
}

function hwRenderMathWin(ev, solved, clean, supported, revised, total, title, titleEs) {
  var winHost = document.getElementById('hw_math_win');
  if (!winHost) return;
  if (!solved.length && !ev.modelMoves) { winHost.hidden = true; winHost.innerHTML = ''; return; }
  winHost.hidden = false;
  var modelEl = document.getElementById('hw_mission_model');
  var fam = modelEl ? modelEl.getAttribute('data-family') : '';
  var modelNames = {
    exponents: ['Repeated-Multiplication Exponent Builder', 'Constructor de exponentes por multiplicación repetida'],
    ratio: ['Interactive Ratio & Double Number Line Model', 'Modelo interactivo de razones y recta numérica doble'],
    percent: ['Interactive Percent Grid & Bar Model', 'Cuadrícula de porcentaje y modelo de barras interactivo'],
    partition: ['Fraction Strip & Partition Model', 'Modelo de tiras de fracciones y partición'],
    balance: ['Algebraic Balance & Expression Model', 'Balanza algebraica y modelo de expresiones'],
    numberline: ['Signed Number Line & Inequality Model', 'Recta numérica con signo y modelo de desigualdades'],
    coordinate: ['Four-Quadrant Coordinate Plane', 'Plano de coordenadas de cuatro cuadrantes'],
    area: ['Interactive Geometric Area & Net Model', 'Modelo geométrico interactivo de área y desarrollo'],
    data: ['Interactive Dot Plot & Center/Spread Lab', 'Diagrama de puntos interactivo y laboratorio de centro/dispersión']
  };
  var mPair = modelNames[fam] || ['Visual Step-by-Step Diagram', 'Diagrama visual paso a paso'];
  var rescCount = Number(ev.rescuesCompleted || 0);
  var html = '<div class="hw-math-win__head">' +
    '<span class="hw-math-win__badge"><span class="lang-en">The Math Win · Personalized Summary</span><span class="lang-es" lang="es">El logro matemático · Resumen personalizado</span></span>' +
    '<h3 class="hw-math-win__title"><span class="lang-en">What Your Math Work Demonstrated</span><span class="lang-es" lang="es">Lo que demostró tu trabajo matemático</span></h3>' +
    '</div><dl class="hw-evidence-list hw-math-win__list">' +
    '<dt><span class="lang-en">Concept demonstrated</span><span class="lang-es" lang="es">Concepto demostrado</span></dt>' +
    '<dd><span class="lang-en">' + (title || 'Grade 6 Mathematics') + ' (' + solved.length + ' solved)</span><span class="lang-es" lang="es">' + (titleEs || 'Matemáticas de 6.º grado') + ' (' + solved.length + ' resueltos)</span></dd>' +
    '<dt><span class="lang-en">Mathematical model used</span><span class="lang-es" lang="es">Modelo matemático utilizado</span></dt>' +
    '<dd><span class="lang-en">' + mPair[0] + (ev.modelMoves ? ' (' + ev.modelMoves + ' interactive moves)' : '') + '</span><span class="lang-es" lang="es">' + mPair[1] + (ev.modelMoves ? ' (' + ev.modelMoves + ' movimientos interactivos)' : '') + '</span></dd>';
  if (revised.length || rescCount > 0) {
    html += '<dt><span class="lang-en">Misconception corrected</span><span class="lang-es" lang="es">Idea errónea corregida</span></dt>' +
      '<dd><span class="lang-en">Turned an initial error into a verified solution through revision' + (rescCount ? ' and Math Rescue.' : '.') + '</span><span class="lang-es" lang="es">Transformó un error inicial en una solución verificada mediante la revisión' + (rescCount ? ' y Rescate Matemático.' : '.') + '</span></dd>';
  }
  if (clean.length) {
    html += '<dt><span class="lang-en">Independent progress</span><span class="lang-es" lang="es">Progreso independiente</span></dt>' +
      '<dd><span class="lang-en">Solved ' + clean.length + (clean.length === 1 ? ' problem' : ' problems') + ' independently on the first attempt without hints.</span><span class="lang-es" lang="es">Resolvió ' + clean.length + (clean.length === 1 ? ' problema' : ' problemas') + ' de forma independiente en el primer intento y sin pistas.</span></dd>';
  }
  html += '</dl>' +
    '<div class="hw-math-win__actions">' +
    '<button type="button" class="btn btn-sm btn-outline-primary" data-act="printRefrigeratorSheet"><span aria-hidden="true">🖨️</span> <span class="lang-en">Print Family Summary</span><span class="lang-es" lang="es">Imprimir resumen familiar</span></button>' +
    '</div>';
  winHost.innerHTML = html;
}

function hwMissionBoot() {
  hwMissionNotes();
  var observer = new MutationObserver(function (list) {
    list.forEach(function (rec) {
      var el = rec.target;
      if (el.classList && el.classList.contains('problem-section')) {
        hwMissionSnapshot();
        if (el.classList.contains('incorrect')) hwFlowRecordPick(el);
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
    if (tab === 'improve') hwFlowImprove();
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
