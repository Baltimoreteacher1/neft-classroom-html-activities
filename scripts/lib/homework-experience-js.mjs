/**
 * Client behavior for the family experience layer (see homework-experience.mjs).
 * Inlined into the shared homework bundle. Written in the same plain ES5 style as
 * the rest of the shared script so it parses on every phone a family might own.
 */
import { GOAL_QUICK, GOAL_TARGET, ROUTE_TIMES } from "./homework-experience.mjs";

export const EXPERIENCE_JS = `
/* ── Family experience: goal, mystery, confidence, share, dialogs ─────────── */
var HW_GOAL_TARGET = ${GOAL_TARGET};
var HW_GOAL_QUICK = ${GOAL_QUICK};
var HW_ROUTE_TIMES = ${JSON.stringify(ROUTE_TIMES)};

function hwKey(name) { return 'hw_exp_' + (window.LESSON_ID || location.pathname) + '_' + name; }
function hwGet(name) { try { return localStorage.getItem(hwKey(name)); } catch (e) { return null; } }
/* Sign-off photos and voice notes (homework-guided-notes) are stored per lesson and are
   the bulk of what a device holds. When the device is full, drop them from every other
   lesson; the written reflection stays. */
function hwFreeSignoffMedia(keepLessonId) {
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (!key || key.indexOf('hw_parent_signoff_') !== 0 || key === 'hw_parent_signoff_' + keepLessonId) continue;
      var data = JSON.parse(localStorage.getItem(key) || '{}');
      if (!data.photoData && !data.voiceMemoData) continue;
      data.photoData = '';
      data.voiceMemoData = '';
      data.photo = '';
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {}
}
function hwSet(name, value) { try { localStorage.setItem(hwKey(name), value); } catch (e) {} }
function hwBi(en, es) {
  var cls = document.body.classList;
  if (cls.contains('lang-mode-es')) return es;
  if (cls.contains('lang-mode-bilingual')) return en + ' · ' + es;
  return en;
}
function hwReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

/* Toast and confirm: in the page, in both languages, never a native dialog that a
   phone browser can block and that only ever spoke English. */
var hwToastTimer = 0;
function hwToast(en, es, ms) {
  var el = document.getElementById('hw_toast');
  if (!el) return;
  var message = hwBi(en, es);
  el.textContent = message;
  el.hidden = false;
  /* The visible toast is hidden from screen readers; this region is always rendered, so
     a change in it is announced. */
  var live = document.getElementById('hw_toast_live');
  if (live) live.textContent = message;
  clearTimeout(hwToastTimer);
  hwToastTimer = setTimeout(function () { el.hidden = true; if (live) live.textContent = ''; }, ms || 5000);
}
function hwConfirm(en, es, yesEn, yesEs, noEn, noEs, onYes) {
  var dialog = document.getElementById('hw_dialog');
  if (!dialog || typeof dialog.showModal !== 'function') {
    if (window.confirm(hwBi(en, es))) onYes();
    return;
  }
  document.getElementById('hw_dialog_text').textContent = hwBi(en, es);
  document.getElementById('hw_dialog_yes').textContent = hwBi(yesEn, yesEs);
  document.getElementById('hw_dialog_no').textContent = hwBi(noEn, noEs);
  dialog.returnValue = '';
  dialog.onclose = function () {
    var answer = dialog.returnValue;
    dialog.returnValue = '';
    if (answer === 'yes') onYes();
  };
  dialog.showModal();
}
/* alert() replacement for strings written as "English / Español". */
function hwNotice(pair, ms) {
  var parts = String(pair).split(' / ');
  hwToast(parts[0], parts.length > 1 ? parts.slice(1).join(' / ') : parts[0], ms);
}

/* A tab panel the family is not looking at is hidden, so only a hidden ancestor
   BELOW the panel (the route's unused tier) excludes a problem. The goal, the share
   text and the Done summary all read this one list from any tab. */
function hiddenBelowPanel(el) {
  for (var n = el; n && !(n.matches && n.matches('[data-tab-panel]')); n = n.parentElement) {
    if (n.hidden) return true;
  }
  return false;
}
function activeCoreProblems() {
  return Array.prototype.filter.call(document.querySelectorAll('.problem-section'), function (section) {
    return !section.closest('.more-practice') && !hiddenBelowPanel(section);
  });
}

/* Tonight's goal. One definition of "done": solved, or a written answer compared
   with the key. The goal is four problems (two on Quick) out of the dozen on the
   page, so it is reachable in a busy evening and the rest is honest bonus. */
function hwGoalSnapshot() {
  var problems = activeCoreProblems();
  var done = problems.filter(function (section) {
    return section.classList.contains('correct') || section.classList.contains('reviewed');
  }).length;
  var route = typeof activeHomeworkRoute === 'function' ? activeHomeworkRoute() : { problemLimit: 0 };
  var cap = route.problemLimit > 0 ? HW_GOAL_QUICK : HW_GOAL_TARGET;
  var available = problems.length;
  return { done: done, goal: Math.max(1, Math.min(cap, available || cap)), available: available };
}

function hwDrawPips(el, shown, goal) {
  var html = '';
  for (var i = 0; i < goal; i++) html += '<span class="hw-pip' + (i < shown ? ' is-on' : '') + '"></span>';
  el.innerHTML = html;
  el.setAttribute('aria-label', hwBi("Tonight's goal: " + shown + ' of ' + goal, 'Meta de hoy: ' + shown + ' de ' + goal));
}

function hwCelebrate() {
  if (hwReducedMotion()) return;
  if (typeof playFanfareSound === 'function') playFanfareSound();
  if (typeof triggerConfettiBurst === 'function') triggerConfettiBurst(null, null, 90);
}

/* A solved problem stays solved after a reload: the radio the family chose is
   restored by the page, but the green "done" state is not, so tonight's meter
   would read 0 / 4 on a page they had already finished. */
var hwSolvedRestored = false;
function hwPersistSolved() {
  if (!hwSolvedRestored) return; // never overwrite saved progress before it has been read back
  var map = {};
  document.querySelectorAll('.problem-section').forEach(function (section) {
    if (section.closest('.more-practice')) return;
    var id = section.id.replace('problem_', '');
    if (section.classList.contains('correct')) map[id] = 'correct';
    else if (section.classList.contains('reviewed')) map[id] = 'reviewed';
  });
  hwSet('solved', JSON.stringify(map));
}
function hwRestoreSolved() {
  var map = {};
  try { map = JSON.parse(hwGet('solved') || '{}'); } catch (e) { map = {}; }
  Object.keys(map).forEach(function (id) {
    var section = document.getElementById('problem_' + id);
    if (section && !section.classList.contains('incorrect')) section.classList.add(map[id]);
  });
  hwSolvedRestored = true;
  var done = document.querySelector('[data-tab-panel="done"]');
  if (done && !done.hidden && typeof updateCelebrationTab === 'function') updateCelebrationTab();
}
function hwClearProgress() {
  hwSet('solved', '{}');
  hwSet('goal_met', '');
}

/* The single writer for goal progress. Called after every check, on load, and when
   the route or language changes. celebrate=false restores state without a fanfare. */
function hwRenderGoal(celebrate) {
  var snap = hwGoalSnapshot();
  var shown = Math.min(snap.done, snap.goal);
  var met = snap.done >= snap.goal;
  var text = document.getElementById('progress_text');
  if (text) text.textContent = shown + ' / ' + snap.goal;
  var bar = document.getElementById('progress_bar');
  if (bar) bar.style.width = (shown / snap.goal * 100) + '%';
  document.querySelectorAll('.hw-pips').forEach(function (el) { hwDrawPips(el, shown, snap.goal); });
  document.querySelectorAll('[data-hw-goal-count]').forEach(function (el) { el.textContent = String(snap.goal); });
  document.querySelectorAll('[data-hw-goal-avail]').forEach(function (el) { el.textContent = String(snap.available); });
  var bonus = Math.max(0, snap.done - snap.goal);
  document.querySelectorAll('[data-hw-bonus]').forEach(function (el) {
    el.hidden = bonus === 0;
    var count = el.querySelector('[data-hw-bonus-count]');
    if (count) count.textContent = String(bonus);
  });
  document.body.dataset.goalMet = met ? '1' : '0';
  if (celebrate !== false) hwPersistSolved();

  var banner = document.getElementById('goal_reached_banner');
  if (banner) banner.hidden = !met;
  if (met) {
    var celebrated = hwGet('goal_met') === '1';
    if (!celebrated) {
      hwSet('goal_met', '1');
      var badge = document.getElementById('tab_badge_check');
      if (badge) badge.textContent = '★★★';
      hwRecordNight();
      hwRenderNights();
      if (celebrate !== false) {
        hwCelebrate();
        hwToast("Goal reached! You did tonight's " + snap.goal + ' problems.', '¡Meta cumplida! Hicieron los ' + snap.goal + ' problemas de hoy.');
      }
    }
  }
  hwRenderMystery(met);
}

function hwRenderMystery(unlocked) {
  var box = document.getElementById('hw_mystery');
  if (!box) return;
  box.classList.toggle('is-unlocked', !!unlocked);
  var lock = document.getElementById('hw_mystery_lock');
  if (lock) lock.textContent = unlocked ? '🔓' : '🔒';
  var status = document.getElementById('hw_mystery_status');
  var state = unlocked ? 'open' : 'locked-' + hwGoalSnapshot().goal;
  if (status && status.dataset.state !== state) {
    status.dataset.state = state;
    status.innerHTML = unlocked
      ? '<span class="lang-en"><strong>Unlocked!</strong> Go crack it.</span><span class="lang-es" lang="es"><strong>¡Desbloqueado!</strong> Ve a resolverlo.</span>'
      : '<span class="lang-en">Locked. Finish <span data-hw-goal-count>' + hwGoalSnapshot().goal + '</span> problems and it opens.</span><span class="lang-es" lang="es">Bloqueado. Termina <span data-hw-goal-count>' + hwGoalSnapshot().goal + '</span> problemas y se abre.</span>';
  }
  var open = document.getElementById('hw_mystery_open');
  if (open) open.hidden = !unlocked;
  var quick = document.body.dataset.homeworkRoute === 'quick';
  document.querySelectorAll('.hw-banner-mystery').forEach(function (el) { el.hidden = !unlocked || quick; });
}

function hwOpenMystery() {
  var box = document.getElementById('hw_mystery');
  if (!box) return;
  if (typeof switchHomeworkTab === 'function') switchHomeworkTab('check');
  setTimeout(function () {
    var target = document.getElementById(box.dataset.problem);
    if (!target) return;
    target.scrollIntoView({ behavior: hwReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.classList.add('hw-spotlight');
    setTimeout(function () { target.classList.remove('hw-spotlight'); }, 2600);
  }, 60);
}

/* Confidence: a plant that grows, asked before and after. Kept on this device. */
function hwSetConfidence(phase, level) {
  hwSet('conf_' + phase, String(level));
  hwRenderConfidence();
}
function hwRenderConfidence() {
  ['before', 'after'].forEach(function (phase) {
    var value = hwGet('conf_' + phase);
    document.querySelectorAll('.hw-conf-btn[data-conf-phase="' + phase + '"]').forEach(function (btn) {
      var on = !!value && btn.dataset.confLevel === value;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });
  var growth = document.getElementById('hw_conf_growth');
  if (!growth) return;
  var before = parseInt(hwGet('conf_before') || '0', 10);
  var after = parseInt(hwGet('conf_after') || '0', 10);
  var icons = ['', '🌱', '🌿', '🌳'];
  if (!after) { growth.textContent = ''; return; }
  if (!before) growth.textContent = hwBi('Thank you for telling us how you feel.', 'Gracias por contarnos cómo te sientes.');
  else if (after > before) growth.textContent = hwBi('You grew from ' + icons[before] + ' to ' + icons[after] + '. That is learning!', 'Pasaste de ' + icons[before] + ' a ' + icons[after] + '. ¡Eso es aprender!');
  else if (after === before) growth.textContent = hwBi('Steady at ' + icons[after] + '. Practice keeps confidence growing.', 'Constante en ' + icons[after] + '. Practicar hace crecer la confianza.');
  else growth.textContent = hwBi('That is an honest answer. Hard things take time. You can ask Mr. Neft a question in ClassDojo.', 'Es una respuesta honesta. Lo difícil toma tiempo. Pueden hacerle una pregunta al Sr. Neft en ClassDojo.');
}

function hwRenderTonight() {
  var mode = document.body.dataset.homeworkRoute || 'full';
  var time = HW_ROUTE_TIMES[mode] || HW_ROUTE_TIMES.full;
  document.querySelectorAll('[data-hw-tonight-time]').forEach(function (el) { el.textContent = time; });
}

/* Family nights: the dates a family finished a goal, kept on this device. A streak counts
   school nights only (Monday to Friday), so a weekend never breaks it, and an unfinished
   tonight does not break it either. Nothing here is ever sent anywhere. */
var HW_NIGHTS_KEY = 'hw_family_nights_v1';
function hwNightsRead() {
  try {
    var list = JSON.parse(localStorage.getItem(HW_NIGHTS_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}
function hwDateKey(d) {
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
}
function hwRecordNight() {
  var key = hwDateKey(new Date());
  var nights = hwNightsRead();
  if (nights.indexOf(key) !== -1) return;
  nights.push(key);
  nights.sort();
  try { localStorage.setItem(HW_NIGHTS_KEY, JSON.stringify(nights.slice(-120))); } catch (e) {}
}
/* Counts back from today. A school night that was missed ends the streak; tonight not being
   finished yet does not; a weekend is never required, and counts if the family did one. */
function hwStreakCount(today) {
  var done = {};
  hwNightsRead().forEach(function (key) { done[key] = true; });
  var cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var count = 0;
  for (var step = 0; step < 400; step++) {
    var weekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    if (done[hwDateKey(cursor)]) count++;
    else if (!weekend && step > 0) break;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return count;
}
function hwRenderNights() {
  var week = document.getElementById('hw_nights_week');
  var streak = document.getElementById('hw_nights_streak');
  if (!week || !streak) return;
  var today = new Date();
  var monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  var done = {};
  hwNightsRead().forEach(function (key) { done[key] = true; });
  var es = document.body.classList.contains('lang-mode-es');
  var html = '';
  for (var i = 0; i < 5; i++) {
    var day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    var name = day.toLocaleDateString(es ? 'es' : 'en', { weekday: 'long' });
    var on = !!done[hwDateKey(day)];
    var short = day.toLocaleDateString(es ? 'es' : 'en', { weekday: 'short' }).replace('.', '');
    html += '<li class="hw-night' + (on ? ' is-on' : '') + '" aria-label="' + name + (on ? (es ? ': hecho' : ': done') : '') + '"><span aria-hidden="true">' + short + '</span></li>';
  }
  week.innerHTML = html;
  var n = hwStreakCount(today);
  streak.textContent = n === 0
    ? hwBi("Finish tonight's goal to start your family streak.", 'Cumplan la meta de hoy para empezar su racha familiar.')
    : hwBi('🔥 ' + n + (n === 1 ? ' night' : ' nights') + ' in a row', '🔥 ' + n + (n === 1 ? ' noche seguida' : ' noches seguidas'));
}

/* Share the win: the lesson name and a link, nothing else. */
function hwShareWin() {
  var snap = hwGoalSnapshot();
  var count = Math.min(snap.done, snap.goal) + ' / ' + snap.goal;
  var titleEn = window.LESSON_TITLE || 'Family Math Studio';
  var titleEs = window.LESSON_TITLE_ES || titleEn;
  var en = 'We did Family Math Studio tonight: ' + titleEn + ' (' + count + ' problems). Try it: ';
  var es = 'Hicimos el Estudio familiar de matemáticas hoy: ' + titleEs + ' (' + count + ' problemas). Pruébenlo: ';
  var url = location.origin + location.pathname;
  var text = document.body.classList.contains('lang-mode-es') ? es : document.body.classList.contains('lang-mode-bilingual') ? en + '\\n' + es : en;
  var full = text + url;
  var copyInstead = function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(full).then(
        function () { hwToast('Copied. Paste it into a message.', 'Copiado. Péguenlo en un mensaje.'); },
        function () { hwToast('Could not copy. Copy the page address instead.', 'No se pudo copiar. Copien la dirección de la página.'); }
      );
    } else hwToast('Copy the page address to share it.', 'Copien la dirección de la página para compartirla.');
  };
  if (navigator.share) {
    navigator.share({ title: 'Family Math Studio', text: text, url: url }).catch(function (error) {
      if (!error || error.name !== 'AbortError') copyInstead();
    });
    return;
  }
  copyInstead();
}

/* Language switches re-run the pieces that write their own text. */
function hwWrapLanguage() {
  if (typeof setLanguageMode !== 'function' || setLanguageMode.hwWrapped) return;
  var original = setLanguageMode;
  setLanguageMode = function (mode) {
    original(mode);
    hwRenderGoal(false);
    hwRenderConfidence();
    hwRenderNights();
  };
  setLanguageMode.hwWrapped = true;
}

document.addEventListener('DOMContentLoaded', function () {
  hwRestoreSolved();
  hwWrapLanguage();
  hwRenderTonight();
  hwRenderConfidence();
  hwRenderNights();
  setTimeout(function () { hwRenderGoal(false); }, 0);
  new MutationObserver(function () { hwRenderTonight(); hwRenderGoal(false); })
    .observe(document.body, { attributes: true, attributeFilter: ['data-homework-route'] });
});
window.addEventListener('load', function () { hwRestoreSolved(); hwRenderGoal(false); });
`;
