/**
 * Client runtime for the deeper Family Practice: the three mission levels with their level-up moments,
 * the challenge round, the Finish celebration, and "Watch it" (the step-by-step picture). Plain ES5 in the
 * shared page bundle, after FLOW_JS (it shares `hwMissionRead/Write`, `hwMissionSnapshot`, `hwFlowBi`,
 * `hwReducedMotion`, `switchHomeworkTab`). The celebration and the explainer are ES modules under
 * assets/family-mission/, imported the first time they are needed; if an import fails the page keeps
 * its static summary and its static picture. Everything stays on this device.
 */
import { MISSION_LEVELS, MISSION_PRACTICE_COUNT } from "./homework-mission.mjs";

export const PRACTICE_JS = `
/* ── Levels, challenge round, celebration, Watch it ──────────────────── */
var HW_LEVELS = ${JSON.stringify(MISSION_LEVELS)};
var HW_MISSION_N = ${MISSION_PRACTICE_COUNT};
var HW_CELEBRATE_URL = '/assets/family-mission/celebrate/index.mjs';
var HW_CELEBRATE_CSS = '/assets/family-mission/celebrate/celebrate.css';
var HW_EXPLAIN_URL = '/assets/family-mission/explain/index.mjs';
var HW_EXPLAIN_CSS = '/assets/family-mission/explain/explain.css';
var HW_RESCUE_URL = '/assets/family-mission/rescue/index.mjs';
var HW_RESCUE_CSS = '/assets/family-mission/rescue/rescue.css';
var HW_MISSIONS_URL = '/assets/family-mission/missions/index.mjs';
var HW_MISSIONS_CSS = '/assets/family-mission/missions/missions.css';
var hwLevelsArmed = false;

function hwPracticeAllCore() {
  return Array.prototype.filter.call(document.querySelectorAll('.problem-section'), function (s) { return !s.closest('.more-practice'); });
}
function hwPracticeDone(s) {
  return s.classList.contains('correct') || s.classList.contains('reviewed');
}
function hwPracticeLink(href, id, attr) {
  if (document.querySelector('link[' + attr + ']')) return;
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  l.setAttribute(attr, id || '');
  document.head.appendChild(l);
}

/* The mission's levels over however many problems this lesson has (a lesson with fewer than ten has fewer levels). */
function hwLevelRanges(total) {
  var out = [], at = 0;
  HW_LEVELS.forEach(function (lv, i) {
    var last = i === HW_LEVELS.length - 1;
    var left = Math.max(0, total - at);
    var size = last ? left : Math.min(lv.size, left);
    if (size > 0) out.push({ id: lv.id, en: lv.en, es: lv.es, icon: lv.icon, from: at, to: at + size, size: size, done: 0, complete: false });
    at += size;
  });
  return out;
}
function hwLevelStats() {
  var mission = hwPracticeAllCore().slice(0, HW_MISSION_N);
  var ranges = hwLevelRanges(mission.length);
  ranges.forEach(function (r) {
    for (var k = r.from; k < r.to; k++) if (mission[k] && hwPracticeDone(mission[k])) r.done++;
    r.complete = r.done >= r.size;
  });
  return { mission: mission, ranges: ranges };
}

function hwLevelsRender() {
  var panel = document.getElementById('hw_panel_check') || document.querySelector('[data-tab-panel="check"]');
  if (!panel) return;
  var st = hwLevelStats();
  if (!st.ranges.length) return;
  var strip = document.getElementById('hw_levelstrip');
  if (!strip) {
    strip = document.createElement('div');
    strip.id = 'hw_levelstrip';
    strip.className = 'hw-levelstrip';
    var head = panel.querySelector('.fp-head');
    if (head && head.parentNode) head.parentNode.insertBefore(strip, head.nextSibling);
    else panel.insertBefore(strip, panel.firstChild);
  }
  var saved = hwMissionRead('levels', {});
  var current = -1;
  st.ranges.forEach(function (r, i) { if (current < 0 && !r.complete) current = i; });
  var html = '<ol class="hw-levels" aria-label="' + hwMissionBi('Practice levels', 'Niveles de práctica') + '">';
  st.ranges.forEach(function (r, i) {
    var state = r.complete ? 'is-done' : i === current ? 'is-current' : 'is-next';
    html += '<li class="hw-level ' + state + '"><button type="button" class="hw-level-btn" data-act="hwGoLevel" data-args="[' + i + ']"' + (i === current ? ' aria-current="step"' : '') + '>' +
      '<span class="hw-level-ico" aria-hidden="true">' + (r.complete ? '✓' : r.icon) + '</span>' +
      '<span class="hw-level-copy"><strong>' + hwFlowBi(r.en, r.es) + '</strong>' +
      '<small>' + r.done + '/' + r.size + '</small></span>' +
      '<span class="hw-level-bar" aria-hidden="true"><i style="inline-size:' + Math.round(r.done / r.size * 100) + '%"></i></span></button></li>';
  });
  html += '</ol><div class="hw-levelup-slot" data-levelup-slot></div>';
  var slot = strip.querySelector('[data-levelup-slot]');
  var keep = slot ? slot.innerHTML : '';
  strip.innerHTML = html;
  if (keep) strip.querySelector('[data-levelup-slot]').innerHTML = keep;

  /* The level strip names the level; only a challenge problem, past the mission, carries its own tag. */
  hwPracticeAllCore().forEach(function (s, idx) {
    var chip = s.querySelector('.hw-level-chip');
    if (idx < st.mission.length) { if (chip) chip.remove(); return; }
    if (!chip) {
      chip = document.createElement('span');
      var head = s.querySelector('.problem-header-row');
      if (head) head.insertBefore(chip, head.firstChild);
      else s.insertBefore(chip, s.firstChild);
    }
    chip.className = 'hw-level-chip hw-level-chip--boss';
    chip.innerHTML = '<span aria-hidden="true">⭐</span> ' + hwFlowBi('Challenge', 'Reto');
  });

  st.ranges.forEach(function (r, i) {
    if (r.complete && !saved[r.id]) {
      saved[r.id] = true;
      hwMissionWrite('levels', saved);
      if (hwLevelsArmed) hwLevelUp(r, i, st.ranges[i + 1]);
    }
  });
}

function hwLevelUp(r, i, next) {
  var slot = document.querySelector('[data-levelup-slot]');
  if (!slot) return;
  if (!hwReducedMotion()) {
    if (typeof triggerConfettiBurst === 'function') triggerConfettiBurst(null, null, next ? 45 : 90);
    if (typeof playSuccessArpeggio === 'function') playSuccessArpeggio();
  }
  var tail = next
    ? hwFlowBi('Next up: ' + next.icon + ' ' + next.en, 'Sigue: ' + next.icon + ' ' + next.es)
    : hwFlowBi('All three levels done. Go to Finish to celebrate!', '¡Los tres niveles listos! Vayan a Terminar para celebrar.');
  slot.innerHTML = '<div class="hw-levelup" role="status"><span class="hw-levelup-ico" aria-hidden="true">' + r.icon + '</span>' +
    '<p><strong>' + hwFlowBi('Level ' + (i + 1) + ' complete: ' + r.en + '!', '¡Nivel ' + (i + 1) + ' completo: ' + r.es + '!') + '</strong> ' + tail + '</p>' +
    (next ? '<button type="button" class="btn btn-secondary" data-act="openOptionalStop" data-args="[&quot;play&quot;]">' + hwFlowBi('🎮 Game break', '🎮 Pausa de juego') + '</button>' : '<button type="button" class="btn btn-primary" data-act="switchHomeworkTab" data-args="[&quot;done&quot;]">' + hwFlowBi('Go to Finish', 'Ir a Terminar') + '</button>') + '</div>';
  if (next) setTimeout(function () { var s2 = document.querySelector('[data-levelup-slot]'); if (s2) s2.innerHTML = ''; }, 9000);
}

/* Show one problem the way the stepper and the problem track expect: the stepper dot, then the track. */
function hwShowProblemSection(s) {
  var box = s.parentElement;
  var bar = box && box.previousElementSibling;
  if (bar && bar.classList.contains('hw-stepper-bar')) {
    var items = Array.prototype.slice.call(box.querySelectorAll(':scope > .problem-section'));
    var dot = bar.querySelectorAll('.hw-stepper-dot')[items.indexOf(s)];
    if (dot) dot.click();
  }
  var active = Array.prototype.filter.call(document.querySelectorAll('#hw_panel_check .problem-section'), function (p) { return !p.hidden && !(p.closest('.more-practice') && p.closest('.more-practice').hidden); });
  var at = active.indexOf(s);
  if (at > -1 && typeof fpShowProblem === 'function') fpShowProblem(at);
}
/* A level chip jumps to that level's first problem that is not done yet. */
function hwGoLevel(i) {
  var st = hwLevelStats();
  var r = st.ranges[i];
  if (!r) return;
  var target = null;
  for (var k = r.from; k < r.to; k++) if (!hwPracticeDone(st.mission[k])) { target = st.mission[k]; break; }
  hwShowProblemSection(target || st.mission[r.from]);
}

/* After a right answer: one big button straight to the next problem (or to Finish after the last one). */
function hwPracticeNextCta() {
  var list = typeof fpGetAllActiveProblems === 'function' ? fpGetAllActiveProblems() : hwPracticeAllCore();
  var openLeft = list.filter(function (s) { return !hwPracticeDone(s); }).length;
  hwPracticeAllCore().forEach(function (s) {
    var cta = s.querySelector('.hw-next-cta');
    if (!hwPracticeDone(s)) { if (cta) cta.remove(); return; }
    var idx = s.id.replace('problem_', '');
    var html = '<button type="button" class="fm-btn fm-btn--primary fm-btn--lg fm-btn--block" data-act="hwGoToNextPractice" data-args="[' + idx + ']">' +
      (openLeft ? hwFlowBi('Next problem →', 'Siguiente problema →') : hwFlowBi('Finish and celebrate →', 'Terminar y celebrar →')) + '</button>';
    if (!cta) {
      cta = document.createElement('div');
      cta.className = 'hw-next-cta';
      cta.setAttribute('role', 'status');
      var anchor = s.querySelector('.problem-body') || s.querySelector('.problem-check-row');
      if (anchor) anchor.insertAdjacentElement('afterend', cta); else s.appendChild(cta);
    }
    if (cta.innerHTML !== html) cta.innerHTML = html;
  });
}

/* Challenge round: the deeper problems that sit after the mission. */
function hwStartChallengeRound() {
  var all = hwPracticeAllCore();
  document.body.dataset.quickMore = '1';
  if (typeof setHomeworkRoute === 'function') setHomeworkRoute('quick', { silent: true, keepTab: true });
  switchHomeworkTab('check');
  var idx = Math.min(HW_MISSION_N, all.length - 1);
  setTimeout(function () {
    if (typeof fpShowProblem === 'function') fpShowProblem(idx);
    var t = all[idx];
    if (t) t.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, 80);
}

/* ── Finish celebration ─────────────────────────────────────────────── */
var hwCelebrateCtl = null;
var hwCelebrateMod = null;
function hwCelebrateData() {
  var ev = hwMissionSnapshot();
  var st = hwLevelStats();
  var all = hwPracticeAllCore();
  var solved = 0, first = 0, fixed = 0;
  st.mission.forEach(function (s) {
    var id = s.id.replace('problem_', '');
    var p = (ev.problems || {})[id] || {};
    if (!(hwPracticeDone(s) || p.done)) return;
    solved++;
    if (!p.wrong && !p.hints && !p.shown) first++;
    if (p.wrong > 0) fixed++;
  });
  var bonus = 0;
  all.slice(HW_MISSION_N).forEach(function (s) { if (hwPracticeDone(s)) bonus++; });
  var vocab = false, played = false;
  try { vocab = typeof STORAGE_KEY !== 'undefined' && !!localStorage.getItem(STORAGE_KEY + '_vocab_won'); } catch (e) {}
  try { played = !!JSON.parse(localStorage.getItem('hw_journey_' + (window.LESSON_ID || location.pathname)) || '{}').play; } catch (e) {}
  var disp = document.querySelector('[data-pb-display-id]');
  return {
    lessonId: window.LESSON_ID || location.pathname,
    displayId: disp ? disp.getAttribute('data-pb-display-id') : (window.LESSON_ID || ''),
    title: window.LESSON_TITLE || document.title,
    titleEs: window.LESSON_TITLE_ES || window.LESSON_TITLE || document.title,
    goal: Math.max(1, st.mission.length),
    done: solved, firstTry: first, fixed: fixed, bonus: bonus,
    levels: st.ranges.map(function (r) { return { id: r.id, size: r.size, done: r.done }; }),
    modelMoves: ev.modelMoves || 0, watched: ev.watched || 0, vocabWon: vocab, played: played
  };
}
function hwCelebrateHooks() {
  return {
    confetti: function (n) { if (!hwReducedMotion() && typeof triggerConfettiBurst === 'function') triggerConfettiBurst(null, null, n); },
    fanfare: function () { if (!hwReducedMotion() && typeof playFanfareSound === 'function') playFanfareSound(); },
    saveName: function (v) { if (typeof updateCertStudentName === 'function') updateCertStudentName(v); },
    photo: function (caption) {
      switchHomeworkTab('photobooth');
      setTimeout(function () {
        var input = document.getElementById('pb_caption_input');
        if (input && !input.value) {
          input.value = caption;
          if (typeof updatePhotoboothCaption === 'function') updatePhotoboothCaption(caption);
        }
      }, 150);
    }
  };
}
function hwMissionCelebrate() {
  var host = document.getElementById('hw_celebrate');
  if (!host) return;
  var all = hwPracticeAllCore();
  document.querySelectorAll('[data-celebrate-challenge]').forEach(function (b) { b.hidden = all.length <= HW_MISSION_N; });
  var data = hwCelebrateData();
  hwPracticeLink(HW_CELEBRATE_CSS, '', 'data-celebrate-css');
  import(HW_CELEBRATE_URL).then(function (mod) {
    hwCelebrateMod = mod;
    var hooks = hwCelebrateHooks();
    var res;
    if (hwCelebrateCtl) res = hwCelebrateCtl.refresh(data);
    else { hwCelebrateCtl = mod.mountCelebration(host, data, hooks); res = hwCelebrateCtl && hwCelebrateCtl.result; }
    if (!res) return;
    var prev = Number(hwGet('ce_stars') || 0);
    if (res.earned > prev) {
      hwSet('ce_stars', String(res.earned));
      hooks.confetti(40 + res.earned * 40);
      if (res.earned >= 2) hooks.fanfare();
    }
  }).catch(function () { /* the plain summary below still tells the story */ });
}

/* ── Watch it ───────────────────────────────────────────────────────── */
var hwExplainCtl = null;
var hwExplainPromise = null;
function hwExplainLoad() {
  hwPracticeLink(HW_EXPLAIN_CSS, '', 'data-explain-css');
  if (!hwExplainPromise) hwExplainPromise = import(HW_EXPLAIN_URL);
  return hwExplainPromise;
}
function hwExplainFigure() { return document.querySelector('#hw_panel_connect .hw-colearn-svg-stage'); }
function hwExplainSteps() {
  var items = document.querySelectorAll('#hw_panel_connect .fp-example .fp-steps > li');
  return Array.prototype.map.call(items, function (li) {
    var en = li.querySelector('.lang-en'), es = li.querySelector('.lang-es');
    return { en: en ? en.textContent : li.textContent, es: es ? es.textContent : '', el: li };
  });
}
function hwExplainRecord(info) {
  if (!info || !info.started) return;
  var ev = hwMissionRead('evidence', {});
  ev.watched = (ev.watched || 0) + 1;
  hwMissionWrite('evidence', ev);
}
function hwExplainMount() {
  if (hwExplainCtl) return;
  var figure = hwExplainFigure();
  var steps = hwExplainSteps();
  if (!figure || steps.length < 2) return;
  hwExplainLoad().then(function (mod) {
    if (hwExplainCtl) return;
    hwExplainCtl = mod.mountExplainer({ figure: figure, steps: steps, lang: hwMissionLang(), onView: hwExplainRecord });
  }).catch(function () { /* the finished picture is already on the page */ });
}
function hwSeeIt() {
  var figure = hwExplainFigure();
  var steps = hwExplainSteps().map(function (s) { return { en: s.en, es: s.es }; });
  if (!figure || steps.length < 2) return;
  hwExplainLoad().then(function (mod) {
    mod.openExplainerDialog({ figure: figure, steps: steps, lang: hwMissionLang(), onView: hwExplainRecord });
  }).catch(function () {});
}
/* After a problem is checked, its explanation offers the lesson picture again. */
function hwSeeItScan() {
  if (!hwExplainFigure()) return;
  document.querySelectorAll('.problem-section').forEach(function (s) {
    var box = s.querySelector('.explanation-box, .visual-explanation-card');
    if (!box || s.querySelector('.hw-see-it')) return;
    var wrap = document.createElement('div');
    wrap.className = 'hw-see-it';
    wrap.innerHTML = '<button type="button" data-act="hwSeeIt"><span aria-hidden="true">🎬</span> ' + hwFlowBi('Watch the picture again', 'Mira el dibujo otra vez') + '</button>';
    box.insertAdjacentElement('afterend', wrap);
  });
}

function hwPracticeBoot() {
  hwLevelsRender();
  setTimeout(function () { hwLevelsArmed = true; hwLevelsRender(); }, 1200);
  hwPracticeNextCta();
  hwAdaptiveMount();
  var obs = new MutationObserver(function (list) {
    hwLevelsRender();
    hwPracticeNextCta();
    setTimeout(hwSeeItScan, 60);
    if (list && list.forEach) {
      list.forEach(function (rec) {
        var el = rec.target;
        if (el && el.classList && el.classList.contains('problem-section') && el.classList.contains('incorrect')) {
          hwRescueOnError(el);
        }
      });
    }
    if (document.body.dataset.activeTab === 'done') hwMissionCelebrate();
  });
  document.querySelectorAll('.problem-section').forEach(function (s) { obs.observe(s, { attributes: true, attributeFilter: ['class'] }); });
  var tabWatch = new MutationObserver(function () {
    var tab = document.body.dataset.activeTab;
    if (tab === 'done') hwMissionCelebrate();
    if (tab === 'connect' || tab === 'explore') hwExplainMount();
    if (tab === 'check') { hwLevelsRender(); hwAdaptiveMount(); }
    if (tab === 'apply') hwApplyMissionMount();
  });
  tabWatch.observe(document.body, { attributes: true, attributeFilter: ['data-active-tab'] });
  var langWatch = new MutationObserver(function () {
    if (hwExplainCtl && hwExplainCtl.setLang) hwExplainCtl.setLang(hwMissionLang());
    hwLevelsRender();
  });
  langWatch.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  hwExplainMount();
  if (document.body.dataset.activeTab === 'done') hwMissionCelebrate();
  if (document.body.dataset.activeTab === 'apply') hwApplyMissionMount();
}

var hwRescuePromise = null;
function hwRescueLoad() {
  hwPracticeLink(HW_RESCUE_CSS, '', 'data-rescue-css');
  if (!hwRescuePromise) hwRescuePromise = import(HW_RESCUE_URL);
  return hwRescuePromise;
}

function hwRescueOnError(section) {
  if (!section || section.querySelector('[data-math-rescue]')) return;
  var stemEl = section.querySelector('.problem-stem .lang-en, .problem-stem, .question-text');
  var stemText = stemEl ? stemEl.textContent : '';
  var pickedBtn = section.querySelector('.mc-option.selected, .mc-option.is-selected, .choice-btn.selected');
  var studentVal = pickedBtn ? pickedBtn.textContent : '';
  var inputEl = section.querySelector('input[type="text"], input[type="number"]');
  if (!studentVal && inputEl) studentVal = inputEl.value || '';
  hwRescueLoad().then(function (mod) {
    mod.mountMathRescue(section, {
      lessonId: window.LESSON_ID || '',
      stemText: stemText,
      studentAnswer: studentVal,
      correctAnswer: section.getAttribute('data-answer') || '',
      onResolved: function () {
        var ev = hwMissionRead('evidence', {});
        ev.rescuesCompleted = (ev.rescuesCompleted || 0) + 1;
        hwMissionWrite('evidence', ev);
      }
    });
  }).catch(function () {});
}

var hwAdaptiveMounted = false;
function hwAdaptiveMount() {
  if (hwAdaptiveMounted) return;
  var panel = document.getElementById('hw_panel_check');
  if (!panel) return;
  hwAdaptiveMounted = true;
  hwRescueLoad().then(function (mod) {
    var ev = hwMissionSnapshot();
    var probs = Object.keys(ev.problems || {}).map(function (k) { return ev.problems[k]; });
    var total = probs.length;
    var firstTry = probs.filter(function (p) { return p.done && !p.wrong && !p.hints; }).length;
    var hints = probs.filter(function (p) { return p.hints > 0; }).length;
    var revised = probs.filter(function (p) { return p.done && p.wrong > 0; }).length;
    mod.mountAdaptiveControls(panel, {
      lessonId: window.LESSON_ID || '',
      evidence: { totalAttempts: total, firstTryCorrect: firstTry, hintsUsed: hints, revisedAfterError: revised },
      onShowAnotherWay: function () { switchHomeworkTab('explore'); },
      onChallengeMe: function () { hwStartChallengeRound(); }
    });
  }).catch(function () {});
}

var hwApplyMissionMounted = false;
function hwApplyMissionMount() {
  if (hwApplyMissionMounted) return;
  var panel = document.getElementById('hw_panel_apply');
  if (!panel) return;
  hwApplyMissionMounted = true;
  hwPracticeLink(HW_MISSIONS_CSS, '', 'data-missions-css');
  import(HW_MISSIONS_URL).then(function (mod) {
    mod.mountFamilyMission(panel, {
      lessonId: window.LESSON_ID || '',
      title: window.LESSON_TITLE || '',
      titleEs: window.LESSON_TITLE_ES || '',
      onComplete: function (res) {
        var ev = hwMissionRead('evidence', {});
        ev.missionRounds = res && res.roundsCompleted ? res.roundsCompleted : 1;
        hwMissionWrite('evidence', ev);
      }
    });
  }).catch(function () {});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hwPracticeBoot);
else hwPracticeBoot();
`;
