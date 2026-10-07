function journeyStorageKey() {
  return 'hw_journey_' + (window.LESSON_ID || location.pathname);
}

/* Which stop to reopen on is a fact about ONE lesson, so it is keyed like the
   journey map above. It used to be the single global 'hw_last_tab': a family
   that finished 3-5 on the Done stop then opened 3-6 for the FIRST time landed
   on its celebration + parent sign-off screen, never saw Learn/Words/Together/
   Check/Play, and updateJourneyMap immediately ticked that untouched lesson
   'done'. The old key is cleared on sight so nobody inherits that landing. */
function lastTabStorageKey() {
  return 'hw_last_tab_' + (window.LESSON_ID || location.pathname);
}

/* ── Family Game Break (Together tab) ─────────────────────────────────────
   Two content-free game engines; the content ships as the JSON island
   window.__HW_FAMGAMES__ rendered by renderFamilyGameBreak(). No timers. */
var famMem = { first: null, lock: false, matches: 0, flips: 0 };
var famTf = { idx: 0, score: 0, answered: 0 };

function famGamesData() {
  var d = window.__HW_FAMGAMES__;
  return d && Array.isArray(d.pairs) && Array.isArray(d.tf) ? d : null;
}

function resetMemoryGame() {
  var data = famGamesData();
  var grid = document.getElementById('fam_memory_grid');
  if (!data || !grid) return;
  famMem = { first: null, lock: false, matches: 0, flips: 0 };
  var win = document.getElementById('fam_memory_win');
  if (win) win.hidden = true;
  updateMemoryStatus();
  var faces = [];
  data.pairs.forEach(function (p, i) {
    faces.push({ pair: i, text: p.a });
    faces.push({ pair: i, text: p.b });
  });
  // Runtime shuffle on purpose — each rematch deals a fresh layout.
  for (var i = faces.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = faces[i]; faces[i] = faces[j]; faces[j] = t;
  }
  grid.innerHTML = '';
  faces.forEach(function (f) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fam-mem-card';
    btn.dataset.pair = String(f.pair);
    btn.setAttribute('aria-label', 'Face-down card');
    var inner = document.createElement('span');
    inner.className = 'fam-mem-face';
    inner.textContent = f.text;
    btn.appendChild(inner);
    btn.addEventListener('click', function () { flipMemoryCard(btn); });
    grid.appendChild(btn);
  });
}

function updateMemoryStatus() {
  ['fam_mem_matches', 'fam_mem_matches_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(famMem.matches);
  });
  ['fam_mem_flips', 'fam_mem_flips_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(famMem.flips);
  });
}

function flipMemoryCard(btn) {
  if (famMem.lock || btn.classList.contains('is-up') || btn.classList.contains('is-matched')) return;
  btn.classList.add('is-up');
  btn.setAttribute('aria-label', btn.querySelector('.fam-mem-face').textContent);
  famMem.flips++;
  updateMemoryStatus();
  if (!famMem.first) { famMem.first = btn; return; }
  var a = famMem.first;
  famMem.first = null;
  if (a.dataset.pair === btn.dataset.pair) {
    a.classList.add('is-matched');
    btn.classList.add('is-matched');
    famMem.matches++;
    updateMemoryStatus();
    if (typeof playCorrectSound === 'function') playCorrectSound();
    if (famMem.matches >= 4) {
      var win = document.getElementById('fam_memory_win');
      if (win) win.hidden = false;
      if (typeof triggerCelebration === 'function') triggerCelebration();
    }
  } else {
    famMem.lock = true;
    setTimeout(function () {
      a.classList.remove('is-up');
      btn.classList.remove('is-up');
      a.setAttribute('aria-label', 'Face-down card');
      btn.setAttribute('aria-label', 'Face-down card');
      famMem.lock = false;
    }, 950);
  }
}

/* The page has three language modes (bilingual default / en / es), carried by
   CSS on .lang-en/.lang-es spans — so JS-written text uses the SAME span pair
   and inherits whichever mode the family picked, live. */
function setBiText(el, en, es) {
  if (!el) return;
  el.textContent = '';
  var a = document.createElement('span');
  a.className = 'lang-en';
  a.textContent = en;
  var b = document.createElement('span');
  b.className = 'lang-es';
  b.setAttribute('lang', 'es');
  b.textContent = es;
  el.appendChild(a);
  el.appendChild(b);
}

function renderTfQuestion() {
  var data = famGamesData();
  if (!data) return;
  var q = data.tf[famTf.idx];
  var turnEl = document.getElementById('fam_tf_turn');
  var stEl = document.getElementById('fam_tf_statement');
  var fb = document.getElementById('fam_tf_feedback');
  var doneEl = document.getElementById('fam_tf_done');
  var btnT = document.getElementById('fam_tf_true_btn');
  var btnF = document.getElementById('fam_tf_false_btn');
  if (!q) {
    if (stEl) stEl.textContent = '';
    if (turnEl) turnEl.textContent = '';
    if (btnT) btnT.hidden = true;
    if (btnF) btnF.hidden = true;
    if (fb) fb.hidden = true;
    if (doneEl) {
      doneEl.hidden = false;
      var perfect = famTf.score === data.tf.length;
      var lead = perfect ? '🏆 ' : '🎉 ';
      setBiText(
        doneEl,
        lead + 'Team score: ' + famTf.score + ' out of ' + data.tf.length + (perfect ? ' — perfect game!' : '. Read the whys together and rematch!'),
        lead + 'Resultado del equipo: ' + famTf.score + ' de ' + data.tf.length + (perfect ? ' — ¡puntuación perfecta!' : '. Revisen los porqués y jueguen otra vez.'),
      );
      if (typeof triggerCelebration === 'function' && perfect) triggerCelebration();
    }
    return;
  }
  if (doneEl) doneEl.hidden = true;
  if (btnT) { btnT.hidden = false; btnT.disabled = false; }
  if (btnF) { btnF.hidden = false; btnF.disabled = false; }
  if (fb) fb.hidden = true;
  var who = famTf.idx % 2 === 0;
  var pos = ' · ' + (famTf.idx + 1) + ' / ' + data.tf.length;
  setBiText(
    turnEl,
    (who ? "🧑‍🎓 Student's turn" : "👪 Family member's turn") + pos,
    (who ? '🧑‍🎓 Turno del estudiante' : '👪 Turno de la familia') + pos,
  );
  setBiText(stEl, q.en, q.es);
  updateTfScore();
}

function updateTfScore() {
  var el = document.getElementById('fam_tf_score');
  if (!el) return;
  var tail = famTf.score + ' / ' + famTf.answered;
  setBiText(el, 'Team score: ' + tail, 'Puntos del equipo: ' + tail);
}

function answerTf(saidTrue) {
  var data = famGamesData();
  var q = data && data.tf[famTf.idx];
  if (!q) return;
  var btnT = document.getElementById('fam_tf_true_btn');
  var btnF = document.getElementById('fam_tf_false_btn');
  if (btnT) btnT.disabled = true;
  if (btnF) btnF.disabled = true;
  var right = saidTrue === q.answer;
  famTf.answered++;
  if (right) famTf.score++;
  var verdict = document.getElementById('fam_tf_verdict');
  var why = document.getElementById('fam_tf_why');
  var fb = document.getElementById('fam_tf_feedback');
  if (verdict) {
    setBiText(
      verdict,
      right ? '✅ Correct!' : '❌ Not quite — it was ' + (q.answer ? 'TRUE.' : 'FALSE.'),
      right ? '✅ ¡Correcto!' : '❌ No exactamente — era ' + (q.answer ? 'VERDADERO.' : 'FALSO.'),
    );
    verdict.className = 'fam-tf-verdict ' + (right ? 'is-right' : 'is-wrong');
  }
  setBiText(why, q.whyEn, q.whyEs);
  if (fb) fb.hidden = false;
  if (right && typeof playCorrectSound === 'function') playCorrectSound();
  updateTfScore();
}

function nextTf() {
  famTf.idx++;
  renderTfQuestion();
}

function resetTfGame() {
  famTf = { idx: 0, score: 0, answered: 0 };
  renderTfQuestion();
}

/* ── Arcade picker: one game visible at a time ─────────────────────────── */
function showArcadeGame(id) {
  document.querySelectorAll('[data-arcade-panel]').forEach(function (p) {
    p.hidden = p.dataset.arcadePanel !== id;
  });
  document.querySelectorAll('[data-arcade-game]').forEach(function (c) {
    const on = c.dataset.arcadeGame === id;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  // The two games that used to be tabs boot the same way they did then: the
  // quiz on first view, and the Phaser arcade iframe only once someone asks for
  // it, so it never costs the rest of the page anything.
  if (id === 'quiz' && typeof initHomeworkGame === 'function') initHomeworkGame();
  if (id === 'full') {
    var af = document.querySelector('.arcade-frame');
    if (af && !af.getAttribute('src') && af.dataset.src) af.setAttribute('src', af.dataset.src);
  }
  if (typeof playTabSwitchSound === 'function') playTabSwitchSound();
}

/* ── Sort It! — tap a card, tap a bin ──────────────────────────────────── */
var famSort = { picked: null, placed: 0, right: 0 };

function resetSortGame() {
  const data = famGamesData();
  const wrap = document.getElementById('fam_sort_cards');
  if (!data || !data.sort || !wrap) return;
  famSort = { picked: null, placed: 0, right: 0 };
  setBiText(document.getElementById('fam_sort_bin0'), data.sort.a.en, data.sort.a.es);
  setBiText(document.getElementById('fam_sort_bin1'), data.sort.b.en, data.sort.b.es);
  document.getElementById('fam_sort_bin0_count').textContent = '0';
  document.getElementById('fam_sort_bin1_count').textContent = '0';
  const fb = document.getElementById('fam_sort_feedback');
  if (fb) fb.textContent = '';
  const done = document.getElementById('fam_sort_done');
  if (done) done.hidden = true;

  const cards = data.sort.cards.slice();
  for (var i = cards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = cards[i]; cards[i] = cards[j]; cards[j] = t;
  }
  wrap.innerHTML = '';
  cards.forEach(function (c, idx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fam-sort-card';
    btn.textContent = c.t;
    btn.dataset.bucket = String(c.bucket);
    btn.dataset.whyEn = c.en;
    btn.dataset.whyEs = c.es;
    btn.dataset.idx = String(idx);
    btn.addEventListener('click', function () { pickSortCard(btn); });
    wrap.appendChild(btn);
  });
}

function pickSortCard(btn) {
  if (btn.classList.contains('is-placed')) return;
  document.querySelectorAll('.fam-sort-card').forEach(function (c) { c.classList.remove('is-picked'); });
  btn.classList.add('is-picked');
  famSort.picked = btn;
  setBiText(
    document.getElementById('fam_sort_feedback'),
    'Now tap the bin where "' + btn.textContent + '" belongs.',
    'Ahora toquen el cesto donde va "' + btn.textContent + '".',
  );
}

function dropSortCard(bin) {
  const data = famGamesData();
  const btn = famSort.picked;
  const fb = document.getElementById('fam_sort_feedback');
  if (!data || !btn) {
    setBiText(fb, 'Tap a card first, then tap a bin.', 'Primero toquen una tarjeta y luego un cesto.');
    return;
  }
  const correct = Number(btn.dataset.bucket) === bin;
  famSort.placed++;
  if (correct) {
    famSort.right++;
    btn.classList.add('is-placed', 'is-right');
    const countEl = document.getElementById('fam_sort_bin' + bin + '_count');
    countEl.textContent = String(Number(countEl.textContent) + 1);
    setBiText(fb, '✅ Yes — ' + btn.dataset.whyEn, '✅ Sí — ' + btn.dataset.whyEs);
    if (typeof playCorrectSound === 'function') playCorrectSound();
  } else {
    btn.classList.add('is-wrong');
    setTimeout(function () { btn.classList.remove('is-wrong'); }, 600);
    setBiText(fb, '❌ Other bin — ' + btn.dataset.whyEn, '❌ El otro cesto — ' + btn.dataset.whyEs);
  }
  btn.classList.remove('is-picked');
  famSort.picked = null;

  const remaining = document.querySelectorAll('.fam-sort-card:not(.is-placed)').length;
  if (remaining === 0) {
    const done = document.getElementById('fam_sort_done');
    if (done) {
      done.hidden = false;
      const tries = famSort.placed;
      setBiText(
        done,
        '🎉 All sorted! You placed 6 cards in ' + tries + ' tries.',
        '🎉 ¡Todo clasificado! Colocaron 6 tarjetas en ' + tries + ' intentos.',
      );
    }
    if (typeof triggerCelebration === 'function') triggerCelebration();
  }
}

/* ── Would You Rather? — vote, then reveal the mathematics ─────────────── */
var famWyr = { idx: 0, voted: false };

function resetWyrGame() {
  famWyr = { idx: 0, voted: false };
  renderWyr();
}

function renderWyr() {
  const data = famGamesData();
  if (!data || !data.wyr) return;
  const round = data.wyr[famWyr.idx];
  const a = document.getElementById('fam_wyr_a');
  const b = document.getElementById('fam_wyr_b');
  const reveal = document.getElementById('fam_wyr_reveal');
  const prog = document.getElementById('fam_wyr_progress');
  if (!round) {
    setBiText(
      prog,
      '🏆 That is every round — start over any time, or argue about the last one a while longer.',
      '🏆 Esas son todas las rondas. Empiecen de nuevo cuando quieran, o sigan discutiendo la última.',
    );
    if (a) a.hidden = true;
    if (b) b.hidden = true;
    if (reveal) reveal.hidden = true;
    return;
  }
  famWyr.voted = false;
  if (a) { a.hidden = false; a.classList.remove('is-chosen'); setBiText(a, round.a.en, round.a.es); }
  if (b) { b.hidden = false; b.classList.remove('is-chosen'); setBiText(b, round.b.en, round.b.es); }
  if (reveal) reveal.hidden = true;
  setBiText(
    prog,
    'Round ' + (famWyr.idx + 1) + ' of ' + data.wyr.length + ' · everyone votes, then say why',
    'Ronda ' + (famWyr.idx + 1) + ' de ' + data.wyr.length + ' · todos votan y dicen por qué',
  );
}

function voteWyr(which) {
  const data = famGamesData();
  const round = data && data.wyr[famWyr.idx];
  if (!round || famWyr.voted) return;
  famWyr.voted = true;
  const chosen = document.getElementById(which === 0 ? 'fam_wyr_a' : 'fam_wyr_b');
  if (chosen) chosen.classList.add('is-chosen');
  setBiText(document.getElementById('fam_wyr_why'), round.en, round.es);
  const reveal = document.getElementById('fam_wyr_reveal');
  if (reveal) reveal.hidden = false;
}

function nextWyr() {
  famWyr.idx++;
  renderWyr();
}

function initFamilyGames() {
  if (!famGamesData() || !document.getElementById('fam_game_break')) return;
  resetMemoryGame();
  resetTfGame();
  resetSortGame();
  resetWyrGame();
}

/* ── Family route chooser ───────────────────────────────────────────────
   A route is a real contract, not decorative copy: it controls which stops
   are in the path, how many practice problems count, the remaining-time
   display, and every Continue button. */
var HOMEWORK_ROUTES = {
  quick: { tabs: ['learn', 'check', 'done'], total: 10, problemLimit: 2, minutes: { learn: 3, check: 5, done: 2 } },
  core: { tabs: ['learn', 'together', 'check', 'done'], total: 20, problemLimit: 6, minutes: { learn: 5, together: 6, check: 7, done: 2 } },
  full: { tabs: ['learn', 'words', 'together', 'check', 'play', 'done'], total: 30, problemLimit: 6, minutes: { learn: 5, words: 3, together: 6, check: 8, play: 5, done: 3 } }
};

function routeStorageKey() {
  return 'hw_route_' + (window.LESSON_ID || location.pathname);
}

function activeHomeworkRoute() {
  var id = document.body.dataset.homeworkRoute || 'core';
  return HOMEWORK_ROUTES[id] || HOMEWORK_ROUTES.core;
}

function setHomeworkRoute(mode, options) {
  options = options || {};
  if (!Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTES, mode)) mode = 'core';
  var route = HOMEWORK_ROUTES[mode];
  document.body.dataset.homeworkRoute = mode;

  document.querySelectorAll('[data-route-mode]').forEach(function (btn) {
    var active = btn.dataset.routeMode === mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  var visibleIndex = 0;
  document.querySelectorAll('.homework-tab-btn').forEach(function (btn) {
    var included = route.tabs.indexOf(btn.dataset.tab) !== -1;
    btn.hidden = !included;
    if (!included) {
      btn.setAttribute('aria-selected', 'false');
      btn.removeAttribute('aria-current');
      return;
    }
    visibleIndex++;
    var step = btn.querySelector('.tab-step');
    if (step) step.textContent = String(visibleIndex);
    // The tab's minutes are the ROUTE's minutes; the static label said 8 for
    // Check while the 20-minute route budgets 7 and the Check intro said 7.
    var mins = route.minutes[btn.dataset.tab];
    var minEl = btn.querySelector('.tab-min');
    if (mins && minEl) minEl.textContent = mins + ' min';
    if (mins) btn.dataset.min = String(mins);
    var label = btn.querySelector('.tab-en');
    var labelEs = btn.querySelector('.tab-es');
    btn.dataset.ariaEn = (label ? label.textContent : btn.dataset.tab) + ' — stop ' + visibleIndex + ' of ' + route.tabs.length;
    btn.dataset.ariaEs = (labelEs ? labelEs.textContent : btn.dataset.tab) + ' — parada ' + visibleIndex + ' de ' + route.tabs.length;
    btn.setAttribute('aria-label', document.documentElement.lang === 'es' ? btn.dataset.ariaEs : btn.dataset.ariaEn);
  });
  document.querySelectorAll('.homework-tab-extra').forEach(function (btn) {
    btn.hidden = mode !== 'full';
  });
  var shell = document.querySelector('.homework-tabs-shell');
  if (shell) shell.dataset.tabCount = String(route.tabs.length);
  ['hw_hero_stop_count', 'hw_hero_stop_count_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(route.tabs.length);
  });
  ['hw_hero_minutes', 'hw_hero_minutes_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(route.total);
  });

  var warmups = document.querySelectorAll('.practice-tier-warmup .problem-section');
  warmups.forEach(function (problem, index) { problem.hidden = index >= route.problemLimit; });
  var challenge = document.querySelector('.practice-tier-challenge');
  if (challenge) challenge.hidden = mode === 'quick';
  var more = document.querySelector('.more-practice');
  if (more) more.hidden = mode === 'quick';
  ['hw_goal_count', 'hw_goal_count_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(route.problemLimit);
  });
  ['hw_check_problem_count', 'hw_check_problem_count_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(route.problemLimit);
  });
  ['hw_check_minutes', 'hw_check_minutes_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(route.minutes.check);
  });
  var progress = document.getElementById('progress_text');
  if (progress) {
    var completed = Array.from(document.querySelectorAll('.problem-section.correct, .problem-section.reviewed'))
      .filter(function (problem) { return !problem.hidden && !problem.closest('[hidden]') && !problem.closest('.more-practice'); })
      .length;
    progress.textContent = completed + ' / ' + route.problemLimit;
  }
  if (typeof updateProgress === 'function') updateProgress();

  var note = document.getElementById('hw_route_note');
  if (note) {
    var copy = {
      quick: ['Quick practice: read one example, try 2 problems, explain one answer, and stop. About 5–10 minutes; no Together or Play stop.', 'Práctica breve: lee un ejemplo, intenta 2 problemas, explica una respuesta y termina. Unos 5–10 minutos; sin las paradas Juntos ni Jugar.'],
      core: ['Learn & practice: read, try one together, complete 6 problems, and explain. Then stop. About 20 minutes.', 'Ruta de aprendizaje: 4 paradas y los 6 problemas, unos 20 minutos.'],
      full: ['Family math night: 6 problems, key words, one home activity, and one game. Explain and stop. About 30 minutes.', 'Noche familiar: 6 problemas, palabras clave, una actividad en casa y un juego. Explica y termina. Unos 30 minutos.']
    }[mode];
    setBiText(note, copy[0], copy[1]);
  }

  try { localStorage.setItem(routeStorageKey(), mode); } catch (e) {}
  initHomeworkShareLinks();

  var current = document.body.dataset.activeTab;
  if (current && route.tabs.indexOf(current) === -1 && !options.keepTab) {
    switchHomeworkTab(route.tabs[0]);
  } else if (current) {
    switchHomeworkTab(current);
  } else {
    updateHomeworkRouteTime(route.total);
  }
  if (!options.silent) {
    var chooser = document.querySelector('.hw-route-chooser');
    if (chooser) chooser.classList.add('route-just-changed');
    setTimeout(function () { if (chooser) chooser.classList.remove('route-just-changed'); }, 500);
  }
}

function updateHomeworkRouteTime(minutes) {
  var timeEl = document.getElementById('hw_time_remaining');
  if (!timeEl) return;
  timeEl.innerHTML = '⏱️ <span class="lang-en">~' + minutes + ' min left</span><span class="lang-es" lang="es">~' + minutes + ' min restantes</span>';
}

function restoreHomeworkRoute() {
  var mode = 'core';
  try { mode = localStorage.getItem(routeStorageKey()) || 'core'; } catch (e) {}
  if (!Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTES, mode)) mode = 'core';
  var requested = new URLSearchParams(location.search).get('route');
  if (Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTES, requested)) mode = requested;
  setHomeworkRoute(mode, { silent: true, keepTab: true });
}

function goNextHomeworkStop(current) {
  var tabs = activeHomeworkRoute().tabs;
  var index = tabs.indexOf(current);
  var next = tabs[Math.min(index + 1, tabs.length - 1)] || tabs[0];
  switchHomeworkTab(next);
}

/* Reveal the requested rung and every earlier rung. A family cannot jump to
   the strongest nudge without also seeing the noticing and strategy prompts. */
function revealCoachStep(btn) {
  var step = btn.closest('.coach-ladder-step');
  var list = step && step.parentElement;
  if (!step || !list) return;
  var steps = Array.from(list.querySelectorAll('.coach-ladder-step'));
  var stop = steps.indexOf(step);
  steps.forEach(function (item, index) {
    if (index > stop) return;
    item.classList.add('is-revealed');
    var help = item.querySelector('.coach-step-help');
    var trigger = item.querySelector('button');
    if (help) help.hidden = false;
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  });
  var help = step.querySelector('.coach-step-help');
  if (help) help.focus && help.focus();
}

/* ── Trackable hands-on mission ───────────────────────────────────────── */
function familyMissionStorageKey() {
  return 'hw_family_mission_' + (window.LESSON_ID || location.pathname);
}

function showFamilyMissionState(index, celebrate) {
  var cards = Array.from(document.querySelectorAll('[data-family-activity]'));
  cards.forEach(function (card, cardIndex) {
    var done = cardIndex === index;
    card.classList.toggle('is-mission-complete', done);
    var btn = card.querySelector('[data-mission-complete]');
    if (btn) {
      btn.classList.toggle('is-complete', done);
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
    }
  });
  var badge = document.getElementById('badge_achieve_mission');
  if (badge) badge.classList.toggle('is-unlocked', index >= 0);
  var status = document.getElementById('family_mission_status');
  if (status && index >= 0 && cards[index]) {
    var titleEn = cards[index].querySelector('.fam-act-titles .lang-en');
    var titleEs = cards[index].querySelector('.fam-act-titles .lang-es');
    setBiText(
      status,
      'Mission complete: ' + (titleEn ? titleEn.textContent : 'family activity') + '. Home Explorer badge unlocked!',
      'Misión completada: ' + (titleEs ? titleEs.textContent : 'actividad familiar') + '. ¡Insignia de Explorador del Hogar desbloqueada!',
    );
  }
  if (celebrate && index >= 0) {
    if (typeof triggerConfettiBurst === 'function') triggerConfettiBurst(null, null, 45);
    if (typeof playSuccessArpeggio === 'function') playSuccessArpeggio();
  }
}

function pickFamilyMission() {
  var cards = Array.from(document.querySelectorAll('[data-family-activity]'));
  if (!cards.length) return;
  var index = Math.floor(Math.random() * cards.length);
  cards.forEach(function (card, cardIndex) {
    card.open = cardIndex === index;
    card.classList.toggle('is-mission-picked', cardIndex === index);
    if (cardIndex === index) { var alternatives = card.closest('.family-mission-alternatives'); if (alternatives) alternatives.open = true; }
  });
  var titleEn = cards[index].querySelector('.fam-act-titles .lang-en');
  var titleEs = cards[index].querySelector('.fam-act-titles .lang-es');
  setBiText(
    document.getElementById('family_mission_status'),
    "Tonight's mission: " + (titleEn ? titleEn.textContent : 'family activity') + '.',
    'Misión de hoy: ' + (titleEs ? titleEs.textContent : 'actividad familiar') + '.',
  );
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  cards[index].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
}

function completeFamilyMission(index) {
  var current = -1;
  try {
    var saved = localStorage.getItem(familyMissionStorageKey());
    if (saved !== null) current = Number(saved);
  } catch (e) {}
  var next = current === index ? -1 : index;
  try {
    if (next >= 0) localStorage.setItem(familyMissionStorageKey(), String(next));
    else localStorage.removeItem(familyMissionStorageKey());
  } catch (e) {}
  showFamilyMissionState(next, next >= 0);
}

function restoreFamilyMission() {
  var index = -1;
  try {
    var saved = localStorage.getItem(familyMissionStorageKey());
    if (saved !== null) index = Number(saved);
  } catch (e) {}
  showFamilyMissionState(Number.isInteger(index) ? index : -1, false);
}

/* Tonight's Path roadmap: light up the current stop, keep a persistent check
   on every stop the family has visited for THIS lesson. */
/* Progress lives ON the tab bar now, not on a second rail underneath it: each
   tab gets a tick once it has been opened, and the hairline under the bar fills
   to the furthest stop reached. One control, one answer to "where are we". */
/* A stop is ticked when the family moves ON from it. Ticking on arrival put a
   ✓ on Learn the moment any page opened, before anything had been read. */
function updateJourneyMap(tabId, leftTabId) {
  const tabs = Array.from(document.querySelectorAll('.homework-tab-btn')).filter(function (btn) { return !btn.hidden; });
  if (!tabs.length) return;
  let visited = {};
  try { visited = JSON.parse(localStorage.getItem(journeyStorageKey()) || '{}') || {}; } catch (e) {}
  if (leftTabId && !visited[leftTabId]) {
    visited[leftTabId] = true;
    try { localStorage.setItem(journeyStorageKey(), JSON.stringify(visited)); } catch (e) {}
  }
  let furthest = -1;
  tabs.forEach(function (btn, i) {
    const id = btn.dataset.tab;
    const done = !!visited[id];
    btn.classList.toggle('is-done', done);
    if (done || id === tabId) furthest = i;
  });
  const fill = document.getElementById('hw_tab_track_fill');
  if (fill) {
    const pct = furthest <= 0 ? 0 : (furthest / (tabs.length - 1)) * 100;
    fill.style.width = pct + '%';
  }
}

/* Help is a drawer over the current stop, not a place you travel to. Opening it
   never takes a family off the problem they are stuck on. */
function toggleHelpDrawer() {
  const drawer = document.getElementById('hw_help_drawer');
  const fab = document.getElementById('hw_stuck_fab');
  if (!drawer) return;
  const open = drawer.hidden;
  drawer.hidden = !open;
  document.body.classList.toggle('hw-drawer-open', open);
  if (fab) fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    drawer.querySelector('.hw-help-drawer-close')?.focus();
  } else if (fab) {
    fab.focus();
  }
}

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const drawer = document.getElementById('hw_help_drawer');
  if (drawer && !drawer.hidden) toggleHelpDrawer();
});

function syncHomeworkChromeHeights() {
  const status = document.querySelector('.bottom-status-bar');
  const tabBar = document.querySelector('.homework-tab-bar');
  const statusH = status ? Math.ceil(status.getBoundingClientRect().height) : 104;
  const tabH = tabBar ? Math.ceil(tabBar.getBoundingClientRect().height) : 72;
  document.documentElement.style.setProperty('--hw-status-height', statusH + 'px');
  document.documentElement.style.setProperty('--hw-tab-height', tabH + 'px');
  // Tab bar is a sticky TOP bar, so only the BOTTOM chrome needs reserving —
  // but that is the status bar AND the floating pills stacked above it. The
  // status bar now shows only on the Check stop, so on every other stop the
  // reservation was 16px and the two pills sat on top of the panel's own
  // "Next" button: on Together the Stuck? pill covered "Next: Try the
  // problems". Measure the tallest floating control's real top edge instead.
  var floatTop = 0;
  // The math keypad is a bottom-fixed control like the pills, and the tallest
  // one when it is open; left out, the last answer field on a stop sat under it.
  document.querySelectorAll('.hw-stuck-fab, #nsr-root, .mathpad:not([hidden])').forEach(function (el) {
    if (window.getComputedStyle(el).position !== 'fixed') return;
    var r = el.getBoundingClientRect();
    if (r.height) floatTop = Math.max(floatTop, Math.ceil(window.innerHeight - r.top));
  });
  document.body.style.paddingBottom = (Math.max(statusH, floatTop) + 24) + 'px';
}

/* Set once the page has restored its stop. Before that, switching tabs is the
   page booting, not the family moving: focusing and scrolling the tab button
   then opened every homework page ~970px down, past its title and the
   20/30-minute choice. */
var hwTabsBooted = false;

function switchHomeworkTab(tabId) {
  const leaving = document.body.dataset.activeTab;
  const allTabs = document.querySelectorAll('.homework-tab-btn');
  const tabs = Array.from(allTabs).filter(function (btn) { return !btn.hidden; });
  const extras = document.querySelectorAll('.homework-tab-extra');
  const panels = document.querySelectorAll('[data-tab-panel]');
  let idx = 0;
  extras.forEach(function(btn) {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  allTabs.forEach(function(btn) {
    if (!btn.hidden) return;
    btn.classList.remove('is-active');
    btn.setAttribute('aria-selected', 'false');
    btn.removeAttribute('aria-current');
  });
  tabs.forEach(function(btn, i) {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
    if (active) {
      idx = i + 1;
      btn.setAttribute('aria-current', 'step');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
  panels.forEach(function(p) {
    p.hidden = p.dataset.tabPanel !== tabId;
  });
  document.body.dataset.activeTab = tabId;
  // Practice is inside the Check panel. Recalculate only after that panel is
  // visible so route-aware scoring sees the two or six active core problems
  // instead of treating every problem as hidden behind its tab panel.
  if (tabId === 'check' && typeof updateProgress === 'function') updateProgress();
  // The bottom bar exists on one stop, so its height changes as you move
  // between them, and the floating controls are positioned off that height.
  if (typeof syncHomeworkChromeHeights === 'function') syncHomeworkChromeHeights();
  // "3 of 6" and the minutes left describe tonight's PATH. An extra stop is not
  // on it, so idx is 0 and both readings are left showing the last numbered
  // stop the family was on, rather than reporting "0 of 6" and reading
  // tabs[-1].dataset for the time sum.
  if (idx > 0) {
    const prog = document.getElementById('hw_tab_progress');
    const total = document.querySelector('.homework-tabs-shell')?.dataset.tabCount
      || String(tabs.length);
    if (prog) prog.textContent = idx + ' of ' + total + ' / ' + idx + ' de ' + total;
    const fill = document.getElementById('tab_progress_fill');
    if (fill) fill.style.width = ((idx / parseInt(total, 10)) * 100) + '%';

    // Dynamic time remaining calculation
    var minsLeft = 0;
    var route = activeHomeworkRoute();
    for (var k = idx - 1; k < tabs.length; k++) {
      minsLeft += route.minutes[tabs[k].dataset.tab] || parseInt(tabs[k].dataset.min || '5', 10);
    }
    var timeEl = document.getElementById('hw_time_remaining');
    if (timeEl) {
      timeEl.innerHTML = '⏱️ <span class="lang-en">~' + minsLeft + ' min left</span><span class="lang-es" lang="es">~' + minsLeft + ' min restantes</span>';
    }
  }

  if (typeof updateJourneyMap === 'function') updateJourneyMap(tabId, leaving !== tabId ? leaving : '');
  if (typeof playTabSwitchSound === 'function') playTabSwitchSound();
  if (tabId === 'done' && typeof updateCelebrationTab === 'function') {
    updateCelebrationTab();
  }
  if (tabId === 'play' && !window.hwFamilyGamesReady) { initFamilyGames(); window.hwFamilyGamesReady = true; }
  if (tabId === 'photobooth' && typeof initPhotobooth === 'function') {
    initPhotobooth();
  } else if (typeof stopPhotoboothStream === 'function') {
    stopPhotoboothStream();
  }
  const activeBtn = document.getElementById('hw_tab_' + tabId);
  if (activeBtn && hwTabsBooted) {
    activeBtn.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    activeBtn.focus({ preventScroll: true });
  }
  try { localStorage.setItem(lastTabStorageKey(), tabId); } catch(e) {}
  if (typeof initHomeworkVocabPopups === 'function') {
    initHomeworkVocabPopups();
  }
}

function openHelpModalFromBtn(btn) {
  try {
    const data = JSON.parse(btn.getAttribute('data-help') || '{}');
    openHelpModal(data);
  } catch(e) {}
}

function openHelpModal(data) {
  const overlay = document.getElementById('help_modal_overlay');
  if (!overlay) return;
  document.getElementById('help_modal_title').textContent =
    (data.titleEn || 'Help') + ' / ' + (data.titleEs || 'Ayuda');
  document.getElementById('help_modal_en').textContent = data.en || '';
  document.getElementById('help_modal_es').textContent = data.es || '';
  var vis = document.getElementById('help_modal_visual');
  if (vis) {
    if (data.visual) { vis.innerHTML = data.visual; vis.hidden = false; }
    else { vis.innerHTML = ''; vis.hidden = true; }
  }
  var frame = document.getElementById('help_modal_frame');
  if (frame) {
    if (data.frameEn || data.frameEs) {
      document.getElementById('help_modal_frame_en').textContent = data.frameEn || '';
      document.getElementById('help_modal_frame_es').textContent = data.frameEs || '';
      frame.hidden = false;
    } else {
      frame.hidden = true;
    }
  }
  overlay.hidden = false;
  document.body.classList.add('help-modal-open');
  overlay.querySelector('.help-modal-close')?.focus();
}

function closeHelpModal(ev) {
  if (ev && ev.target !== ev.currentTarget) return;
  const overlay = document.getElementById('help_modal_overlay');
  if (overlay) overlay.hidden = true;
  document.body.classList.remove('help-modal-open');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeHelpModal();
});

function triggerCelebration() {
  document.querySelector('.section-celebrate')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* The document language has to move WITH the toggle. It used to stay lang="en"
   in Spanish mode, so a screen reader read a fully Spanish page with English
   phonemes and browser auto-translate mis-fired on it. Bilingual stays "en":
   the page's own prose is English and the Spanish half already carries its own
   lang="es" on every .lang-es span. */
function syncDocumentLanguage(mode) {
  document.documentElement.lang = mode === 'es' ? 'es' : 'en';
}

/* English and Spanish are the languages this page is WRITTEN in — every string
   on it is a .lang-en / .lang-es pair. Kreyol, Portugues and Arabic were also
   offered, and picking one set a body class no stylesheet reads: the page
   stayed bilingual, so the buttons promised a translation that does not exist.
   Arabic additionally flipped the document to RTL, mirroring the layout of a
   page still written left-to-right. Removed rather than stubbed, because an
   offer a family cannot use is worse than no offer. */
function setLanguageMode(mode) {
  if (mode !== 'en' && mode !== 'es') mode = 'bilingual';
  try { localStorage.setItem('hw_lang_mode', mode); } catch(e) {}
  document.body.classList.remove('lang-mode-bilingual', 'lang-mode-en', 'lang-mode-es');
  document.body.classList.add('lang-mode-' + mode);
  syncDocumentLanguage(mode);
  document.body.dataset.homeworkLanguage = mode;
  initHomeworkShareLinks();
  document.querySelectorAll('[data-aria-en]').forEach(function (el) { el.setAttribute('aria-label', mode === 'es' ? el.dataset.ariaEs : el.dataset.ariaEn); });
  document.querySelectorAll('.lang-toggle-btn').forEach(function(btn) {
    const active = btn.getAttribute('data-lang-mode') === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function toggleCoOpMode() {
  var active = document.body.classList.toggle('coop-mode-active');
  var btn = document.getElementById('btn_toggle_coop');
  if (btn) {
    btn.innerHTML = active
      ? '<span class="lang-en">✓ Co-Op Active (2-Player)</span><span class="lang-es" lang="es">✓ Co-Op Activo (2 Jugadores)</span>'
      : '<span class="lang-en">Turn On Co-Op</span><span class="lang-es" lang="es">Activar Co-Op</span>';
    if (active) {
      btn.style.background = '#22c55e';
      btn.style.color = '#ffffff';
    } else {
      btn.style.background = '#ffffff';
      btn.style.color = '#15803d';
    }
  }
}
window.toggleCoOpMode = toggleCoOpMode;

function preparePaperPractice() {
  alert("For offline work, print now or choose Save as PDF in the print dialog. Open the saved PDF before disconnecting. This website has not downloaded an offline copy. / Para trabajar sin internet, imprime ahora o elige Guardar como PDF. Abre el PDF guardado antes de desconectarte. Este sitio no ha descargado una copia sin conexión.");
  printProblemsOnly();
}
window.preparePaperPractice = preparePaperPractice;

var currentVoiceMemoData = '';
var voiceMediaRecorder = null;
var voiceAudioChunks = [];
var voiceRecordTimer = null;
var voiceRecordSeconds = 0;

function toggleVoiceRecording() {
  if (voiceMediaRecorder && voiceMediaRecorder.state === 'recording') {
    voiceMediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Audio recording is not supported in this browser. / La grabación no es compatible en este navegador.");
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    voiceAudioChunks = [];
    voiceMediaRecorder = new MediaRecorder(stream);
    voiceMediaRecorder.ondataavailable = function(e) {
      if (e.data && e.data.size > 0) voiceAudioChunks.push(e.data);
    };
    voiceMediaRecorder.onstop = function() {
      clearInterval(voiceRecordTimer);
      var timerEl = document.getElementById('voice_timer');
      if (timerEl) timerEl.style.display = 'none';
      var labelEl = document.getElementById('record_voice_label');
      if (labelEl) labelEl.innerHTML = '<span class="lang-en">Record Again</span><span class="lang-es" lang="es">Grabar otra vez</span>';
      var iconEl = document.getElementById('record_voice_icon');
      if (iconEl) iconEl.textContent = '🎙️';
      stream.getTracks().forEach(function(t) { t.stop(); });

      var blob = new Blob(voiceAudioChunks, { type: 'audio/webm' });
      var reader = new FileReader();
      reader.onload = function(evt) {
        currentVoiceMemoData = evt.target.result;
        var player = document.getElementById('voice_audio_player');
        var wrap = document.getElementById('voice_player_wrap');
        if (player && wrap) {
          player.src = currentVoiceMemoData;
          wrap.style.display = 'inline-flex';
        }
      };
      reader.readAsDataURL(blob);
    };

    voiceMediaRecorder.start();
    voiceRecordSeconds = 0;
    var timerEl = document.getElementById('voice_timer');
    if (timerEl) {
      timerEl.textContent = '0:00';
      timerEl.style.display = 'inline';
    }
    var labelEl = document.getElementById('record_voice_label');
    if (labelEl) labelEl.innerHTML = '<span class="lang-en">Stop (Recording...)</span><span class="lang-es" lang="es">Detener (Grabando...)</span>';
    var iconEl = document.getElementById('record_voice_icon');
    if (iconEl) iconEl.textContent = '⏹️';

    voiceRecordTimer = setInterval(function() {
      voiceRecordSeconds++;
      if (timerEl) {
        var m = Math.floor(voiceRecordSeconds / 60);
        var s = voiceRecordSeconds % 60;
        timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      }
      if (voiceRecordSeconds >= 30) {
        if (voiceMediaRecorder && voiceMediaRecorder.state === 'recording') {
          voiceMediaRecorder.stop();
        }
      }
    }, 1000);
  }).catch(function() {
    alert("Microphone access was blocked. Please allow mic permissions to record. / Se bloqueó el acceso al micrófono.");
  });
}
window.toggleVoiceRecording = toggleVoiceRecording;

function deleteVoiceRecording() {
  currentVoiceMemoData = '';
  var player = document.getElementById('voice_audio_player');
  var wrap = document.getElementById('voice_player_wrap');
  if (player && wrap) {
    player.src = '';
    wrap.style.display = 'none';
  }
}
window.deleteVoiceRecording = deleteVoiceRecording;

function toggleSignoffSubmitBtn() {
  var submitBtn = document.getElementById('submit_signoff_btn');
  if (submitBtn) submitBtn.disabled = false;
}

function homeworkShareUrl() {
  var url = new URL(window.location.href);
  var route = document.body.dataset.homeworkRoute || 'core';
  url.searchParams.set('route', Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTES, route) ? route : 'core');
  url.searchParams.set('lang', document.body.dataset.homeworkLanguage || preferredLanguageMode());
  return url.href;
}

function copyHomeworkLink() {
  var url = homeworkShareUrl();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      alert("Link copied with your route and language. / Enlace copiado con tu ruta e idioma.");
    }).catch(function() { window.prompt('Copy this link / Copia este enlace:', url); });
  } else window.prompt('Copy this link / Copia este enlace:', url);
}

function startHomework() {
  var last = document.body.dataset.activeTab || 'learn';
  switchHomeworkTab(last);
  document.getElementById('hw_panel_' + last)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function printProblemsOnly() {
  document.body.classList.add('print-problems-only');
  window.print();
  setTimeout(function() {
    document.body.classList.remove('print-problems-only');
  }, 1000);
}

function printAnswerSheet() {
  document.body.classList.add('print-answer-sheet');
  window.print();
  setTimeout(function() {
    document.body.classList.remove('print-answer-sheet');
  }, 1000);
}
window.printAnswerSheet = printAnswerSheet;

function printRefrigeratorSheet() {
  printProblemsOnly();
}
window.printRefrigeratorSheet = printRefrigeratorSheet;

function speakHomeworkText(enText, esText) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var isEs = document.body.classList.contains('lang-mode-es') || document.documentElement.lang === 'es';
    var text = (isEs && esText) ? esText : (enText || esText);
    var lang = (isEs && esText) ? 'es-US' : 'en-US';
    if (!text || !text.trim()) return;
    var utter = new SpeechSynthesisUtterance(text.trim());
    utter.lang = lang;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch(e) {}
}
window.speakHomeworkText = speakHomeworkText;
window.speakSectionText = speakHomeworkText;

function selectFeeling(btn, feeling) {
  document.querySelectorAll('.btn-feeling').forEach(function(b) { b.classList.remove('is-selected'); });
  btn.classList.add('is-selected');
  var input = document.getElementById('family_feeling_input');
  if (input) input.value = feeling;
}
window.selectFeeling = selectFeeling;

var currentWorkPhotoData = '';
function previewWorkPhoto(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      try {
        var canvas = document.createElement('canvas');
        var maxDim = 800;
        var w = img.width;
        var h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        currentWorkPhotoData = canvas.toDataURL('image/jpeg', 0.75);
      } catch (err) {
        currentWorkPhotoData = e.target.result;
      }
      var preview = document.getElementById('work_photo_preview');
      var wrap = document.getElementById('work_photo_preview_wrap');
      if (preview && wrap) {
        preview.src = currentWorkPhotoData;
        wrap.hidden = false;
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
window.previewWorkPhoto = previewWorkPhoto;

function clearWorkPhoto() {
  currentWorkPhotoData = '';
  var input = document.getElementById('student_work_photo_input');
  if (input) input.value = '';
  var wrap = document.getElementById('work_photo_preview_wrap');
  if (wrap) wrap.hidden = true;
}
window.clearWorkPhoto = clearWorkPhoto;

function initHomeworkShareLinks() {
  var url = encodeURIComponent(homeworkShareUrl());
  var title = encodeURIComponent(document.title || "Family Math Homework");
  var textBtn = document.getElementById("hw_text_link");
  if (textBtn) textBtn.href = "sms:?&body=" + title + "%20" + url;
  var emailBtn = document.getElementById("hw_email_link");
  if (emailBtn) emailBtn.href = "mailto:?subject=" + title + "&body=" + title + "%0A%0A" + url;
}

function getFamilyStreakCount() {
  try {
    var streakKey = 'hw_family_streak_history';
    var history = JSON.parse(localStorage.getItem(streakKey) || '[]');
    if (!history.length) return 1;
    var streak = 1;
    for (var i = history.length - 2; i >= 0; i--) {
      var prev = new Date(history[i]);
      var next = new Date(history[i + 1]);
      var diffDays = Math.round((next - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) streak++;
      else if (diffDays === 0) continue;
      else break;
    }
    return streak;
  } catch(e) {
    return 1;
  }
}

function saveParentSignoff() {
  const nameVal = document.getElementById('parent_name_input')?.value.trim();
  const noteVal = document.getElementById('parent_note_input')?.value.trim();
  const reflVal = document.getElementById('parent_reflection_input')?.value.trim();
  const feelingVal = document.getElementById('family_feeling_input')?.value || 'smooth';
  const lessonId = window.LESSON_ID || 'general';
  const lessonTitle = window.LESSON_TITLE || "Tonight's Lesson";


  const signoffDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Track consecutive nights practiced
  try {
    var todayKey = new Date().toISOString().slice(0, 10);
    var streakKey = 'hw_family_streak_history';
    var streakHistory = JSON.parse(localStorage.getItem(streakKey) || '[]');
    if (streakHistory.indexOf(todayKey) === -1) {
      streakHistory.push(todayKey);
      streakHistory.sort();
      localStorage.setItem(streakKey, JSON.stringify(streakHistory));
    }
  } catch(e) {}

  const payload = {
    parentName: nameVal,
    note: noteVal,
    reflection: reflVal,
    feeling: feelingVal,
    photo: currentWorkPhotoData ? 'present' : '',
    photoData: currentWorkPhotoData || '',
    voiceMemoData: currentVoiceMemoData || '',
    date: signoffDate,
    lessonTitle: lessonTitle
  };

  try {
    localStorage.setItem('hw_parent_signoff_' + lessonId, JSON.stringify(payload));
  } catch(e) {
    alert('This reflection could not be saved on this device. Copy it before leaving. / No se pudo guardar esta reflexión. Cópiala antes de salir.');
    return;
  }

  updateSignoffUI(payload);
}

function updateSignoffUI(data) {
  const nameEl = document.getElementById('display_parent_name');
  if (nameEl) nameEl.textContent = data.parentName;

  const dateEl = document.getElementById('display_signoff_date');
  if (dateEl) dateEl.textContent = data.date;

  const noteBox = document.getElementById('display_parent_note_box');
  const noteEl = document.getElementById('display_parent_note');
  if (noteBox && noteEl) {
    if (data.note) {
      noteEl.textContent = data.note;
      noteBox.hidden = false;
    } else {
      noteBox.hidden = true;
    }
  }

  const reflBox = document.getElementById('display_parent_reflection_box');
  const reflEl = document.getElementById('display_parent_reflection');
  if (reflBox && reflEl) {
    if (data.reflection) {
      reflEl.textContent = data.reflection;
      reflBox.hidden = false;
    } else {
      reflBox.hidden = true;
    }
  }

  const feelingBadge = document.getElementById('display_family_feeling_badge');
  const feelingBox = document.getElementById('display_family_feeling_box');
  if (feelingBadge && feelingBox) {
    if (data.feeling === 'challenge') {
      feelingBadge.innerHTML = '<span class="lang-en">🔴 Tough battle tonight</span><span class="lang-es" lang="es">🔴 Nos costó trabajo hoy</span>';
      feelingBox.hidden = false;
    } else if (data.feeling === 'discussion') {
      feelingBadge.innerHTML = '<span class="lang-en">🟡 Needed some discussion</span><span class="lang-es" lang="es">🟡 Con algo de ayuda</span>';
      feelingBox.hidden = false;
    } else if (data.feeling === 'smooth') {
      feelingBadge.innerHTML = '<span class="lang-en">🟢 Smooth sailing tonight</span><span class="lang-es" lang="es">🟢 ¡Muy bien hoy!</span>';
      feelingBox.hidden = false;
    } else {
      feelingBox.hidden = true;
    }
  }

  const photoBox = document.getElementById('display_family_photo_box');
  const photoEl = document.getElementById('display_family_photo');
  if (photoBox && photoEl) {
    var photoSrc = data.photoData || currentWorkPhotoData;
    if (photoSrc) {
      photoEl.src = photoSrc;
      photoBox.hidden = false;
    } else {
      photoBox.hidden = true;
    }
  }

  const voiceBox = document.getElementById('display_family_voice_box');
  const voicePlayer = document.getElementById('display_family_voice_player');
  if (voiceBox && voicePlayer) {
    var voiceSrc = data.voiceMemoData || currentVoiceMemoData;
    if (voiceSrc) {
      voicePlayer.src = voiceSrc;
      voiceBox.hidden = false;
    } else {
      voiceBox.hidden = true;
    }
  }

  const streakText = document.getElementById('display_family_streak_text');
  if (streakText) {
    var sc = getFamilyStreakCount();
    streakText.innerHTML = '<span class="lang-en">' + sc + (sc === 1 ? ' Night Streak' : ' Nights Streak') + '</span><span class="lang-es" lang="es">Racha de ' + sc + (sc === 1 ? ' noche' : ' noches') + '</span>';
  }

  const formWrap = document.getElementById('signoff_form_wrapper');
  const confWrap = document.getElementById('signoff_confirmed_wrapper');
  if (formWrap) formWrap.hidden = true;
  if (confWrap) confWrap.hidden = false;

  const printTitle = document.getElementById('print_lesson_title');
  if (printTitle) printTitle.textContent = data.lessonTitle;

  const printName = document.getElementById('print_parent_name');
  if (printName) printName.textContent = data.parentName;

  const printDate = document.getElementById('print_signoff_date');
  if (printDate) printDate.textContent = data.date.split(' at ')[0];

  const printNoteWrapper = document.getElementById('print_parent_note_wrapper');
  const printNote = document.getElementById('print_parent_note');
  if (printNoteWrapper && printNote) {
    if (data.note) {
      printNote.textContent = data.note;
      printNoteWrapper.style.display = 'block';
    } else {
      printNoteWrapper.style.display = 'none';
    }
  }

  const printCert = document.getElementById('print_only_certificate');
  if (printCert) printCert.classList.add('is-signed');
}

function editParentSignoff() {
  const formWrap = document.getElementById('signoff_form_wrapper');
  const confWrap = document.getElementById('signoff_confirmed_wrapper');
  if (formWrap) formWrap.hidden = false;
  if (confWrap) confWrap.hidden = true;

  const printCert = document.getElementById('print_only_certificate');
  if (printCert) printCert.classList.remove('is-signed');
}

function preferredLanguageMode() {
  var requested = new URLSearchParams(location.search).get('lang');
  if (['en', 'es', 'bilingual'].indexOf(requested) !== -1) return requested;
  try {
    const saved = localStorage.getItem('hw_lang_mode');
    if (saved === 'en' || saved === 'es' || saved === 'bilingual') return saved;
  } catch (e) {}
  try {
    const langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];
    if (langs.some(function (l) { return String(l).toLowerCase().indexOf('es') === 0; })) return 'es';
  } catch (e) {}
  return 'en';
}

function restoreParentSignoff() {
  setLanguageMode(preferredLanguageMode());

  const lessonId = window.LESSON_ID || 'general';
  try {
    const saved = localStorage.getItem('hw_parent_signoff_' + lessonId);
    if (saved) {
      const data = JSON.parse(saved);
      const nameInput = document.getElementById('parent_name_input');
      const noteInput = document.getElementById('parent_note_input');
      const reflInput = document.getElementById('parent_reflection_input');
      const checkbox = document.getElementById('parent_reviewed_checkbox');
      if (nameInput) nameInput.value = data.parentName || '';
      if (noteInput) noteInput.value = data.note || '';
      if (reflInput) reflInput.value = data.reflection || '';
      if (checkbox) checkbox.checked = true;
      toggleSignoffSubmitBtn();
      var extrasMore = document.getElementById('homework_extras_more');
      if (extrasMore) extrasMore.open = true;

      updateSignoffUI(data);
    }
  } catch(e) {}
}

function initHomeworkPage() {
  var utilities = document.getElementById("hw_utility_controls");
  var help = document.getElementById("hw_stuck_fab");
  if (utilities && help) utilities.appendChild(help);
  syncHomeworkChromeHeights();
  window.addEventListener('resize', syncHomeworkChromeHeights);
  initHomeworkShareLinks();
  // Measure again once fonts and images have settled: a reading taken mid
  // layout reported the status bar three times its rendered height, and the
  // floating launchers are positioned off that number.
  function placeSaveControl() {
    var save = document.getElementById('nsr-root');
    if (!utilities || !save) return false;
    utilities.appendChild(save);
    syncHomeworkChromeHeights();
    return true;
  }
  if (!placeSaveControl()) {
    var saveObserver = new MutationObserver(function () {
      if (document.getElementById('nsr-root')) { saveObserver.disconnect(); placeSaveControl(); }
    });
    saveObserver.observe(document.body, { childList: true, subtree: true });
  }
  window.addEventListener('load', syncHomeworkChromeHeights);
  document.querySelectorAll('[data-tab-panel]').forEach(function(p, i) {
    p.hidden = i > 0;
  });
  restoreHomeworkRoute();
  try {
    localStorage.removeItem('hw_last_tab');
    const last = localStorage.getItem(lastTabStorageKey());
    const lastBtn = last ? document.getElementById('hw_tab_' + last) : null;
    if (lastBtn && !lastBtn.hidden) {
      switchHomeworkTab(last);
      setBiText(document.getElementById('hw_resume_note'), 'Welcome back. Your saved plan and answers are on this device. Continue at ' + lastBtn.querySelector('.tab-en').textContent + '.', 'Bienvenido de nuevo. Tu plan y tus respuestas están guardados en este dispositivo. Continúa en ' + lastBtn.querySelector('.tab-es').textContent + '.');
    }
    else switchHomeworkTab('learn');
  } catch(e) {}
  setTimeout(function () { hwTabsBooted = true; }, 0);
  restoreParentSignoff();
  initHomeworkShareLinks();
  var start = document.getElementById('hw_start_button');
  if (start && document.body.dataset.activeTab !== 'learn') setBiText(start, 'Continue homework', 'Continuar la tarea');
  restoreFamilyMission();
  initDrawCanvases();
  initHomeworkVocabPopups();
  // Family games initialize when Play is opened.
  // Entrance motion is opt-in and only after boot: its start state is
  // opacity:0, so gating it on this class means a page whose script failed
  // still shows every word instead of an empty cream rectangle.
  document.body.classList.add('hw-motion-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeworkPage);
} else {
  initHomeworkPage();
}

// Tap-to-define vocab glossary. Mirrors the lesson engine's underlineVocabTerms +
// objective-term popup so math words in the family notes/practice get the SAME
// simple EN/ES definition + picture. All term matching (regex source + normalized
// lookup, including prime/composite-style aliases) is precomputed in Node and
// handed over as window.__HW_VOCAB_MATCH__, so the browser only walks text nodes.
function initHomeworkVocabPopups() {
  var list = Array.isArray(window.__HW_VOCAB__) ? window.__HW_VOCAB__ : [];
  var match = window.__HW_VOCAB_MATCH__ || null;
  var container = document.getElementById('hw_tab_panels');
  if (!container || !list.length || !match || !match.regexSource) return;
  var lookup = match.lookup || {};
  // Mirrors normalizeVocabSurface in engine/core/vocab-match.js, which built the
  // lookup keys: lowercase, collapse spaces, and undo the plural — including the
  // "-y" head that takes "-ies" ("identity properties" -> "identity property").
  function norm(s) {
    var t = String(s || '').toLowerCase().trim().replace(/s+/g, ' ');
    if (/[^aeiou]ies$/.test(t)) return t.replace(/ies$/, 'y');
    return t.replace(/s$/, '');
  }
  // Mirrors surfaceMatchesEntry: an acronym entry answers only to its exact
  // written form, so "MAD" opens the popup and "mad" in a sentence never does.
  function surfaceFits(surface, entry) {
    if (!entry || !entry.cs) return true;
    return String(surface || '').replace(/(?:es|s)$/, '') === String(entry.term);
  }
  var re = new RegExp(match.regexSource, 'gi');
  // Never rewrite inside controls, inputs, the vocab flashcards (already defined
  // there), an already-wrapped term, or the popup itself.
  var EXCL = 'button, a[href], input, textarea, select, option, label, summary, script, style, svg, code, kbd, .obj-term, .obj-popup-backdrop, .vocab-card, .vocab-container, [data-no-vocab]'
    // Headings, badges and chips are LABELS. A dotted underline inside
    // "⚡ SKILL POWER-UP" or "📖 What we're learning tonight" is not an offer of
    // help, it is a heading that has been vandalised — and "POWER" genuinely
    // became a tappable definition button on lesson 6-1 because the bank
    // defines "power" as an exponent.
    + ', h1, h2, h3, h4, .section-title, .fam-game-badge, .fam-game-h3, .step-badge'
    + ', .tier-badge, .spotlight-badge, .workbench-badge, .hw-hero, .hw-hero *'
    + ', .learning-word-chips, .homework-tab-bar, .powerup-badge, .achieve-name';
  var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      var parent = node.parentElement;
      if (!node.textContent || !node.textContent.trim() || !parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(EXCL)) return NodeFilter.FILTER_REJECT;
      re.lastIndex = 0;
      return re.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  var nodes = [];
  for (var n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  // ONCE PER TERM, PER PANEL. The matcher is fed the whole 349-term Grade 6
  // vocabulary bank and used to wrap EVERY occurrence of every hit, which on
  // lesson 6-1 produced 236 dotted-underline buttons — five of them inside one
  // sentence: "we use models to [divide] BOTH ways: a [whole number] divided by
  // a [fraction], and a [fraction] divided by a [whole number]". A page where
  // every other word is a control does not read as helpful, it reads as
  // technical, and the second offer of the same definition helps nobody. The
  // first sighting in each panel keeps the link; the rest stay plain text.
  var seenInPanel = Object.create(null);
  nodes.forEach(function(textNode) {
    var panel = textNode.parentElement && textNode.parentElement.closest('[data-tab-panel]');
    var panelId = (panel && panel.dataset.tabPanel) || '_';
    var text = textNode.textContent;
    var frag = document.createDocumentFragment();
    var cursor = 0, changed = false, m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      var key = norm(m[0]);
      var idx = Object.prototype.hasOwnProperty.call(lookup, key) ? lookup[key] : -1;
      if (idx < 0 || !surfaceFits(m[0], list[idx])) continue;
      // The matcher's word boundaries are ASCII: JS \b treats an accented
      // letter as a non-word character, so "rate" matched INSIDE the Spanish
      // "asegurate" (written with an accent) and turned the middle of a Spanish
      // sentence into a definition button. Re-check both edges against Unicode
      // letters before wrapping anything.
      var before = m.index > 0 ? text.charAt(m.index - 1) : '';
      var after = text.charAt(m.index + m[0].length);
      // Escaped twice on purpose: this file is the CSS/JS source, emitted through
      // a template literal, so a single backslash here reaches the page as none.
      if ((before && /\p{L}/u.test(before)) || (after && /\p{L}/u.test(after))) continue;
      var seenKey = panelId + '|' + key;
      if (seenInPanel[seenKey]) continue;
      seenInPanel[seenKey] = true;
      frag.appendChild(document.createTextNode(text.slice(cursor, m.index)));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'obj-term';
      btn.setAttribute('data-term-idx', String(idx));
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-label', m[0] + ': open definition');
      btn.textContent = m[0];
      frag.appendChild(btn);
      cursor = m.index + m[0].length;
      changed = true;
    }
    if (!changed) return;
    frag.appendChild(document.createTextNode(text.slice(cursor)));
    textNode.parentNode.replaceChild(frag, textNode);
  });

  var backdrop = null, lastFocus = null, keyHandler = null;
  function closePopup() {
    var bd = window.__hwVocabBackdrop || backdrop;
    if (!bd) return;
    bd.setAttribute('hidden', '');
    bd.hidden = true;
    bd.style.display = 'none';
    document.body.classList.remove('obj-popup-open');
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch(_e) {}
    }
    lastFocus = null;
  }
  window.__closeHwVocabPopup = closePopup;

  function getPopup() {
    if (window.__hwVocabBackdrop && document.body.contains(window.__hwVocabBackdrop)) {
      backdrop = window.__hwVocabBackdrop;
      return backdrop;
    }
    backdrop = document.createElement('div');
    backdrop.className = 'obj-popup-backdrop';
    backdrop.setAttribute('hidden', '');
    backdrop.hidden = true;
    backdrop.style.display = 'none';
    backdrop.innerHTML =
      '<div class="obj-popup" role="dialog" aria-modal="true" aria-labelledby="hw-obj-term">' +
      '<button type="button" class="obj-popup-close" aria-label="Close" onclick="window.__closeHwVocabPopup && window.__closeHwVocabPopup()">&times;</button>' +
      '<h3 id="hw-obj-term" class="obj-popup-term"></h3>' +
      '<p class="obj-popup-translation"><span class="obj-popup-tr-label">Español:</span> <span class="obj-popup-tr-es" lang="es"></span></p>' +
      '<p class="obj-popup-def"></p>' +
      '<p class="obj-popup-def-es" lang="es"></p>' +
      '<figure class="obj-popup-visual"><img class="obj-popup-img" alt="" /><figcaption class="obj-popup-example"></figcaption></figure>' +
      '</div>';
    document.body.appendChild(backdrop);
    window.__hwVocabBackdrop = backdrop;
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      }
    });
    var closeBtn = backdrop.querySelector('.obj-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      });
      closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      });
    }
    return backdrop;
  }
  function openPopup(entry) {
    if (!entry) return;
    var bd = getPopup();
    bd.querySelector('.obj-popup-term').textContent = entry.term ? String(entry.term) : '';
    var trRow = bd.querySelector('.obj-popup-translation');
    var trEs = bd.querySelector('.obj-popup-tr-es');
    if (entry.termEs) { trEs.textContent = String(entry.termEs); trRow.hidden = false; }
    else { trEs.textContent = ''; trRow.hidden = true; }
    var img = bd.querySelector('.obj-popup-img');
    if (entry.img) { img.src = entry.img; img.alt = entry.imgAlt || ''; img.hidden = false; }
    else { img.removeAttribute('src'); img.alt = ''; img.hidden = true; }
    var ex = bd.querySelector('.obj-popup-example');
    ex.textContent = entry.example ? String(entry.example) : '';
    ex.hidden = !entry.example;
    var fig = bd.querySelector('.obj-popup-visual');
    if (fig) fig.hidden = !entry.img && !entry.example;
    bd.querySelector('.obj-popup-def').textContent = entry.def ? String(entry.def) : '';
    var esEl = bd.querySelector('.obj-popup-def-es');
    if (entry.defEs) { esEl.textContent = String(entry.defEs); esEl.hidden = false; }
    else { esEl.textContent = ''; esEl.hidden = true; }
    lastFocus = document.activeElement;
    bd.removeAttribute('hidden');
    bd.hidden = false;
    bd.style.display = 'flex';
    document.body.classList.add('obj-popup-open');
    var cb = bd.querySelector('.obj-popup-close');
    if (cb && cb.focus) cb.focus();
    keyHandler = function(e) { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', keyHandler);
  }
  container.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.obj-term') : null;
    if (!btn || !container.contains(btn)) return;
    e.preventDefault();
    var idx = Number(btn.getAttribute('data-term-idx'));
    if (Number.isInteger(idx)) openPopup(list[idx]);
  });
}

// Make every "Draw your model" grid an actual drawable surface (mouse + touch + stylus).
/* Canvases set up lazily: a page carries up to 14 drawing frames, mostly in
   closed <details> or inactive tabs. Visible frames start at boot; any other
   frame starts on its first touch, through the capture-phase listener below,
   which runs before the canvas's own pointerdown listener is consulted. */
function initDrawCanvases() {
  document.querySelectorAll('[data-draw-frame]').forEach(function(frame) {
    const r = frame.getBoundingClientRect();
    if (r.width && r.height) initDrawFrame(frame);
  });
}
document.addEventListener('pointerdown', function(event) {
  const canvas = event.target.closest && event.target.closest('[data-draw-canvas]');
  const frame = canvas && canvas.closest('[data-draw-frame]');
  if (frame) initDrawFrame(frame);
}, true);

function initDrawFrame(frame) {
  const canvas = frame.querySelector('[data-draw-canvas]');
  if (!canvas || canvas.dataset.ready) return;
  canvas.dataset.ready = '1';
  const ctx = canvas.getContext('2d');
  let drawing = false, last = null;
  function resize() {
    const r = frame.getBoundingClientRect();
    if (!r.width) return;
    const width = Math.round(r.width), height = Math.round(r.height);
    if (!width || !height || (canvas.width === width && canvas.height === height)) return;
    const prev = document.createElement('canvas');
    prev.width = canvas.width; prev.height = canvas.height;
    prev.getContext('2d').drawImage(canvas, 0, 0);
    canvas.width = width; canvas.height = height;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#12355b';
    ctx.drawImage(prev, 0, 0, width, height);
  }
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * canvas.width / r.width,
      y: (t.clientY - r.top) * canvas.height / r.height };
  }
  function start(e) {
    resize();
    drawing = true; last = pos(e); e.preventDefault();
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; e.preventDefault();
  }
  function end() { drawing = false; }
  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);
  const clearBtn = frame.querySelector('[data-draw-clear]');
  if (clearBtn) clearBtn.addEventListener('click', function(){ ctx.clearRect(0,0,canvas.width,canvas.height); });
  resize();
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(frame);
}

/* ── Photobooth Studio with Math Work ─────────────────────────────────── */
/* This is a camera pointed at a notebook page on a family's phone, so every
   path that can fail has to fail politely: a denied permission, a browser with
   no getUserMedia, a tab switch mid-countdown, an iPad that will not download a
   data: URL. Two rules keep it honest — the viewfinder's three states go
   through one renderer (renderPhotoboothStage) rather than six call sites each
   toggling their own flags, and nothing here ever calls alert(), because a
   blocked dialog strands the whole homework page behind it. */
var pbState = {
  stream: null,
  facingMode: 'user',
  frame: 'champion',
  stickers: [],
  caption: '',
  capturedDataUrl: '',
  countdownTimer: null,
  flashTimer: null,
  cameraRequestId: 0,
  downloadUrl: '',
  exportRequestId: 0,
};

function pbEl(id) { return document.getElementById(id); }

function pbSection() { return document.querySelector('.section-photobooth'); }

function pbDisplayId() {
  var sec = pbSection();
  var id = sec ? sec.getAttribute('data-pb-display-id') : '';
  return id || window.LESSON_ID || '';
}

function setPhotoboothStatus(en, es, tone) {
  var box = pbEl('pb_status');
  if (!box) return;
  if (!en && !es) {
    box.hidden = true;
    box.textContent = '';
    return;
  }
  box.className = 'pb-status' + (tone ? ' is-' + tone : '');
  box.textContent = '';
  var spanEn = document.createElement('span');
  spanEn.className = 'lang-en';
  spanEn.textContent = en || '';
  var spanEs = document.createElement('span');
  spanEs.className = 'lang-es';
  spanEs.setAttribute('lang', 'es');
  spanEs.textContent = es || '';
  box.appendChild(spanEn);
  box.appendChild(spanEs);
  box.hidden = false;
}
window.setPhotoboothStatus = setPhotoboothStatus;

/* The single source of truth for what the viewfinder shows: 'idle' (the
   placeholder and its Start Camera button), 'live' (video + frame overlay,
   shutter enabled) or 'captured' (the finished composite + review buttons). */
function renderPhotoboothStage(mode) {
  var isLive = mode === 'live';
  var isShot = mode === 'captured';

  var placeholder = pbEl('pb_idle_placeholder');
  if (placeholder) placeholder.hidden = isLive || isShot;

  var video = pbEl('pb_video');
  if (video) {
    video.hidden = !isLive;
    // Only the selfie camera is mirrored. The rear camera reads the notebook
    // page, and a mirrored preview of writing is unusable.
    if (isLive && pbState.facingMode === 'user') video.classList.add('is-mirrored');
    else video.classList.remove('is-mirrored');
  }

  var overlay = pbEl('pb_frame_overlay');
  if (overlay) overlay.hidden = !isLive;

  var shot = pbEl('pb_captured_img');
  if (shot) shot.hidden = !isShot;

  var live = pbEl('pb_actions_live');
  if (live) live.hidden = isShot;

  var review = pbEl('pb_actions_review');
  if (review) review.hidden = !isShot;

  var snapBtn = pbEl('pb_snap_btn');
  if (snapBtn) snapBtn.disabled = !isLive;

  var flipBtn = pbEl('pb_flip_btn');
  if (flipBtn) flipBtn.disabled = !isLive;
}

function initPhotobooth() {
  var dEl = pbEl('pb_frame_date');
  if (dEl) {
    try {
      dEl.textContent = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch(e) {
      dEl.textContent = 'Tonight';
    }
  }
  var sName = '';
  try {
    var stored = localStorage.getItem('hw_signoff_' + (window.LESSON_ID || location.pathname));
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed.student) sName = parsed.student;
    }
  } catch(e) {}
  var capInput = pbEl('pb_caption_input');
  if (capInput && !capInput.value && sName) {
    capInput.value = sName + ' · Math Champion!';
    updatePhotoboothCaption(capInput.value);
  }
  // Re-entering the tab must not resurrect a stale state: if a photo is still
  // held, show it; otherwise show the idle placeholder, never a dead video.
  renderPhotoboothStage(pbState.capturedDataUrl ? 'captured' : 'idle');
}
window.initPhotobooth = initPhotobooth;

function startPhotoboothCamera() {
  if (!window.isSecureContext && location.protocol !== 'file:') {
    setPhotoboothStatus(
      'This page needs a secure (https) connection to open the camera. Use "Upload Work" to pick a photo instead.',
      'Esta página necesita una conexión segura (https) para abrir la cámara. Usen "Subir Foto" para elegir una foto.',
      'warn');
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setPhotoboothStatus(
      'This browser cannot open the camera here. Tap "Upload Work" to pick a photo from your camera roll.',
      'Este navegador no puede abrir la cámara aquí. Toquen "Subir Foto" para elegir una foto del carrete.',
      'warn');
    return;
  }

  // Starting over a running stream leaves the old camera light on, so stop
  // first. stopPhotoboothStream() also clears any countdown still ticking.
  stopPhotoboothStream({ keepStage: true });
  var requestId = pbState.cameraRequestId;

  var startBtn = pbEl('pb_start_btn');
  if (startBtn) startBtn.disabled = true;
  setPhotoboothStatus('Opening the camera…', 'Abriendo la cámara…', 'info');

  var constraints = {
    video: {
      facingMode: pbState.facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      if (requestId !== pbState.cameraRequestId) {
        stream.getTracks().forEach(function(track) { track.stop(); });
        return;
      }
      pbState.stream = stream;
      var video = pbEl('pb_video');
      if (video) {
        video.srcObject = stream;
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function() {});
      }
      renderPhotoboothStage('live');
      setPhotoboothStatus('', '', '');
      if (startBtn) startBtn.disabled = false;
    })
    .catch(function(err) {
      if (requestId !== pbState.cameraRequestId) return;
      console.warn('Camera access denied or unavailable:', err);
      var name = (err && err.name) || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPhotoboothStatus(
          'The camera is blocked for this site. Allow camera access in your browser settings, or tap "Upload Work" to choose a photo instead.',
          'La cámara está bloqueada para este sitio. Permitan el acceso en la configuración del navegador, o toquen "Subir Foto" para elegir una foto.',
          'warn');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setPhotoboothStatus(
          'No camera was found on this device. Tap "Upload Work" to choose a photo of the notebook page.',
          'No se encontró ninguna cámara en este dispositivo. Toquen "Subir Foto" para elegir una foto del cuaderno.',
          'warn');
      } else {
        setPhotoboothStatus(
          'The camera could not start. Tap "Upload Work" to choose a photo of the notebook page instead.',
          'No se pudo iniciar la cámara. Toquen "Subir Foto" para elegir una foto del cuaderno.',
          'warn');
      }
      renderPhotoboothStage(pbState.capturedDataUrl ? 'captured' : 'idle');
      if (startBtn) startBtn.disabled = false;
    });
}
window.startPhotoboothCamera = startPhotoboothCamera;

function cancelPhotoboothCountdown() {
  if (pbState.countdownTimer) {
    clearInterval(pbState.countdownTimer);
    pbState.countdownTimer = null;
  }
  var countdown = pbEl('pb_countdown');
  if (countdown) countdown.hidden = true;
}

function stopPhotoboothStream(opts) {
  pbState.cameraRequestId++;
  var startBtn = pbEl('pb_start_btn');
  if (startBtn) startBtn.disabled = false;
  cancelPhotoboothCountdown();
  if (pbState.stream) {
    try {
      pbState.stream.getTracks().forEach(function(t) { t.stop(); });
    } catch(e) {}
    pbState.stream = null;
  }
  var video = pbEl('pb_video');
  if (video) {
    try { video.srcObject = null; } catch(e) {}
  }
  if (opts && opts.keepStage) return;
  renderPhotoboothStage(pbState.capturedDataUrl ? 'captured' : 'idle');
}
window.stopPhotoboothStream = stopPhotoboothStream;

function flipPhotoboothCamera() {
  pbState.facingMode = (pbState.facingMode === 'user') ? 'environment' : 'user';
  startPhotoboothCamera();
}
window.flipPhotoboothCamera = flipPhotoboothCamera;

function setPhotoboothFrame(frameKey, btn) {
  pbState.frame = frameKey;
  document.querySelectorAll('.pb-frame-btn').forEach(function(b) {
    var on = b === btn;
    b.classList.toggle('is-selected', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });

  var overlay = pbEl('pb_frame_overlay');
  if (overlay) {
    var wasHidden = overlay.hidden;
    overlay.className = 'pb-frame-overlay frame-' + frameKey;
    overlay.hidden = wasHidden;
  }
  if (pbState.capturedDataUrl) {
    renderPhotoboothComposite();
  }
}
window.setPhotoboothFrame = setPhotoboothFrame;

function togglePhotoboothSticker(emoji) {
  var idx = pbState.stickers.indexOf(emoji);
  if (idx > -1) {
    pbState.stickers.splice(idx, 1);
  } else {
    if (pbState.stickers.length >= 6) {
      pbState.stickers.shift();
    }
    pbState.stickers.push(emoji);
  }
  renderPhotoboothStickers();
  if (pbState.capturedDataUrl) {
    renderPhotoboothComposite();
  }
}
window.togglePhotoboothSticker = togglePhotoboothSticker;

function clearPhotoboothStickers() {
  pbState.stickers = [];
  renderPhotoboothStickers();
  if (pbState.capturedDataUrl) {
    renderPhotoboothComposite();
  }
}
window.clearPhotoboothStickers = clearPhotoboothStickers;

function renderPhotoboothStickers() {
  var layer = pbEl('pb_stickers_layer');
  if (layer) {
    layer.innerHTML = '';
    pbState.stickers.forEach(function(st) {
      var span = document.createElement('span');
      span.className = 'pb-sticker-stamp';
      span.textContent = st;
      layer.appendChild(span);
    });
  }
  document.querySelectorAll('.pb-sticker-chip[data-sticker]').forEach(function(chip) {
    var on = pbState.stickers.indexOf(chip.getAttribute('data-sticker')) > -1;
    chip.classList.toggle('is-selected', on);
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function updatePhotoboothCaption(val) {
  pbState.caption = val;
  var el = pbEl('pb_frame_title');
  var fallback = pbDisplayId() ? 'Lesson ' + pbDisplayId() : "Tonight's Math Work";
  if (el) el.textContent = val || fallback;
  if (pbState.capturedDataUrl) renderPhotoboothComposite();
}
window.updatePhotoboothCaption = updatePhotoboothCaption;

function snapPhotoboothPicture() {
  var video = pbEl('pb_video');
  if (!pbState.stream || !video) {
    setPhotoboothStatus(
      'Start the camera first, or tap "Upload Work" to choose a photo.',
      'Primero inicien la cámara, o toquen "Subir Foto" para elegir una foto.',
      'warn');
    return;
  }
  if (pbState.countdownTimer) return;

  var countdown = pbEl('pb_countdown');
  var snapBtn = pbEl('pb_snap_btn');
  if (snapBtn) snapBtn.disabled = true;
  setPhotoboothStatus('', '', '');

  var count = 3;
  if (countdown) {
    countdown.textContent = String(count);
    countdown.hidden = false;
  }

  pbState.countdownTimer = setInterval(function() {
    count--;
    if (count > 0) {
      if (countdown) countdown.textContent = String(count);
      return;
    }
    cancelPhotoboothCountdown();
    var flash = pbEl('pb_flash');
    if (flash) {
      flash.hidden = false;
      flash.classList.add('is-active');
      if (pbState.flashTimer) clearTimeout(pbState.flashTimer);
      pbState.flashTimer = setTimeout(function() {
        flash.classList.remove('is-active');
        flash.hidden = true;
      }, 400);
    }
    captureFrameFromVideo(video);
  }, 1000);
}
window.snapPhotoboothPicture = snapPhotoboothPicture;

function captureFrameFromVideo(video) {
  var canvas = pbEl('pb_canvas');
  if (!video || !canvas) return;

  var w = video.videoWidth;
  var h = video.videoHeight;
  // A stream that has not delivered a frame yet reports 0×0. Drawing it would
  // bake a black rectangle and call it the student's work.
  if (!w || !h) {
    setPhotoboothStatus(
      'The camera was not ready. Give it a second and tap "Take Photo" again.',
      'La cámara no estaba lista. Esperen un segundo y toquen "Tomar Foto" otra vez.',
      'warn');
    var snapBtn = pbEl('pb_snap_btn');
    if (snapBtn) snapBtn.disabled = false;
    return;
  }

  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // The selfie preview is mirrored, so the capture is mirrored to match what
  // the family just saw. The rear camera is not, so writing stays readable.
  if (pbState.facingMode === 'user') {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  pbState.capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
  stopPhotoboothStream({ keepStage: true });
  renderPhotoboothComposite();
}

function uploadPhotoboothImage(input) {
  if (!input || !input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.type && file.type.indexOf('image/') !== 0) {
    setPhotoboothStatus(
      'That file is not a photo. Choose a picture of the notebook page.',
      'Ese archivo no es una foto. Elijan una imagen de la página del cuaderno.',
      'warn');
    input.value = '';
    return;
  }
  setPhotoboothStatus('Loading your photo…', 'Cargando la foto…', 'info');

  var reader = new FileReader();
  reader.onerror = function() {
    setPhotoboothStatus(
      'That photo could not be read. Try choosing it again.',
      'No se pudo leer esa foto. Intenten elegirla de nuevo.',
      'warn');
    input.value = '';
  };
  reader.onload = function(e) {
    var img = new Image();
    img.onerror = function() {
      setPhotoboothStatus(
        'That photo could not be opened. Try a different picture.',
        'No se pudo abrir esa foto. Prueben con otra imagen.',
        'warn');
      input.value = '';
    };
    img.onload = function() {
      var canvas = pbEl('pb_canvas');
      if (!canvas) return;
      var maxDim = 1200;
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (!w || !h) {
        setPhotoboothStatus(
          'That photo could not be opened. Try a different picture.',
          'No se pudo abrir esa foto. Prueben con otra imagen.',
          'warn');
        input.value = '';
        return;
      }
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      pbState.capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopPhotoboothStream({ keepStage: true });
      renderPhotoboothComposite();
      // Without this, picking the same file twice fires no change event and
      // the second upload silently does nothing.
      input.value = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
window.uploadPhotoboothImage = uploadPhotoboothImage;

/* Canvas has no text wrapping, so anything that could overflow the frame gets
   measured and ellipsised rather than running off the edge of the photo. */
function pbFitText(ctx, text, maxWidth) {
  var t = String(text == null ? '' : text);
  if (maxWidth <= 0) return '';
  if (ctx.measureText(t).width <= maxWidth) return t;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1);
  }
  while (t.length > 1 && t.charAt(t.length - 1) === ' ') t = t.slice(0, -1);
  return t + '…';
}

function renderPhotoboothComposite() {
  if (!pbState.capturedDataUrl) return;
  var img = new Image();
  img.onload = function() {
    var canvas = pbEl('pb_canvas');
    if (!canvas) return;
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    var frameColor = '#f59e0b';
    if (pbState.frame === 'notebook') frameColor = '#0284c7';
    else if (pbState.frame === 'stars') frameColor = '#8b5cf6';
    else if (pbState.frame === 'polaroid') frameColor = '#ffffff';

    var borderW = Math.max(12, Math.round(w * 0.025));
    ctx.lineWidth = borderW;
    ctx.strokeStyle = frameColor;
    ctx.strokeRect(borderW / 2, borderW / 2, w - borderW, h - borderW);

    var pad = borderW + 8;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    var bannerH = Math.max(36, Math.round(h * 0.08));
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, w, bannerH);
    ctx.fillStyle = (pbState.frame === 'polaroid') ? '#0f172a' : '#ffffff';
    ctx.font = 'bold ' + Math.round(bannerH * 0.5) + 'px system-ui, sans-serif';
    var displayId = pbDisplayId();
    var banner = '🏆 MATH CHAMPION' + (displayId ? ' · LESSON ' + displayId.toUpperCase() : '');
    ctx.fillText(pbFitText(ctx, banner, w - pad * 2), pad, bannerH / 2);

    var footH = Math.max(44, Math.round(h * 0.1));
    var footMid = h - footH / 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, h - footH, w, footH);

    // Stickers claim the right end of the footer first; the caption is then
    // fitted to whatever is left, so the two can never overlap.
    var stickerW = 0;
    if (pbState.stickers.length) {
      var stickerSize = Math.round(footH * 0.6);
      var stickerStep = Math.round(footH * 0.72);
      ctx.font = stickerSize + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'right';
      var stX = w - pad;
      for (var s = pbState.stickers.length - 1; s >= 0; s--) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(pbState.stickers[s], stX, footMid);
        stX -= stickerStep;
      }
      ctx.textAlign = 'left';
      stickerW = pbState.stickers.length * stickerStep;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(footH * 0.42) + 'px system-ui, sans-serif';
    var caption = pbState.caption || "Tonight's Math Work Done Together!";
    ctx.fillText(pbFitText(ctx, caption, w - pad * 2 - stickerW), pad, footMid);

    var compositeUrl = canvas.toDataURL('image/jpeg', 0.9);
    var resImg = pbEl('pb_captured_img');
    if (resImg) resImg.src = compositeUrl;
    currentWorkPhotoData = compositeUrl;
    preparePhotoboothDownload(canvas, compositeUrl);
    renderPhotoboothStage('captured');
    setPhotoboothStatus(
      'Looking good! Download it, print it, or add it to your optional reflection.',
      '¡Se ve muy bien! Descárguenla, imprímanla o agréguenla a la reflexión opcional.',
      'ok');
  };
  img.onerror = function() {
    setPhotoboothStatus(
      'That photo could not be opened. Try taking or choosing it again.',
      'No se pudo abrir esa foto. Intenten tomarla o elegirla de nuevo.',
      'warn');
  };
  img.src = pbState.capturedDataUrl;
}

function retakePhotobooth() {
  pbState.exportRequestId++;
  if (pbState.downloadUrl) URL.revokeObjectURL(pbState.downloadUrl);
  pbState.downloadUrl = '';
  var downloadLink = pbEl('pb_download_link');
  if (downloadLink) downloadLink.removeAttribute('href');
  pbState.capturedDataUrl = '';
  currentWorkPhotoData = '';
  var resImg = pbEl('pb_captured_img');
  if (resImg) resImg.removeAttribute('src');
  var attachBtn = pbEl('pb_attach_btn');
  if (attachBtn) {
    attachBtn.innerHTML = '📎 <span class="lang-en">Add to optional reflection</span><span class="lang-es" lang="es">Añadir a la reflexión opcional</span>';
    attachBtn.disabled = false;
  }
  setPhotoboothStatus('', '', '');
  renderPhotoboothStage('idle');
  startPhotoboothCamera();
}
window.retakePhotobooth = retakePhotobooth;

// Prepare the file before the tap. A synthetic click inside toBlob's async
// callback loses the browser's user gesture and is blocked by some webviews.
function preparePhotoboothDownload(canvas, fallbackUrl) {
  var link = pbEl('pb_download_link');
  if (!link) return;
  var requestId = ++pbState.exportRequestId;
  if (pbState.downloadUrl) URL.revokeObjectURL(pbState.downloadUrl);
  pbState.downloadUrl = '';
  link.href = fallbackUrl;
  link.download = 'Math-Work-Photobooth-' + (window.LESSON_ID || 'night') + '.jpg';
  if (canvas.toBlob && URL.createObjectURL) {
    canvas.toBlob(function(blob) {
      if (!blob || requestId !== pbState.exportRequestId) return;
      pbState.downloadUrl = URL.createObjectURL(blob);
      link.href = pbState.downloadUrl;
    }, 'image/jpeg', 0.92);
  }
}

function downloadPhotoboothPhoto() {
  var link = pbEl('pb_download_link');
  if (link && link.getAttribute('href')) link.click();
}
window.downloadPhotoboothPhoto = downloadPhotoboothPhoto;

function printPhotoboothPhoto() {
  var canvas = pbEl('pb_canvas');
  if (!canvas || !pbState.capturedDataUrl) {
    setPhotoboothStatus(
      'Take or upload a photo first, then print it.',
      'Primero tomen o suban una foto, y luego imprímanla.',
      'warn');
    return;
  }

  // The print sheet is built now and hung directly off <body>. Built in place
  // it would sit inside the tab panel, where "print only this" can only be
  // expressed as visibility:hidden — which leaves every other stop of the
  // homework occupying blank pages behind the photo.
  var existing = pbEl('pb_print_portal');
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

  var sec = pbSection();
  var lessonLine = sec ? (sec.getAttribute('data-pb-lesson-line') || '') : '';

  var portal = document.createElement('div');
  portal.id = 'pb_print_portal';
  portal.className = 'pb-print-portal';
  portal.setAttribute('aria-hidden', 'true');

  var inner = document.createElement('div');
  inner.className = 'pb-print-inner';

  var title = document.createElement('h2');
  title.className = 'pb-print-title';
  title.textContent = 'EduWonderLab Family Math Champion · Grade 6';

  var meta = document.createElement('p');
  meta.className = 'pb-print-meta';
  meta.textContent = lessonLine;

  var wrap = document.createElement('div');
  wrap.className = 'pb-print-img-wrap';
  var photo = document.createElement('img');
  photo.className = 'pb-print-img';
  photo.alt = 'Student math work printout';
  wrap.appendChild(photo);

  var cap = document.createElement('p');
  cap.className = 'pb-print-caption';
  cap.textContent = pbState.caption || 'Student Math Notebook & Family Verification';

  var foot = document.createElement('div');
  foot.className = 'pb-print-footer';
  var footLeft = document.createElement('span');
  footLeft.textContent = 'Verified Family Practice · eduwonderlab.com';
  var footRight = document.createElement('span');
  footRight.textContent = new Date().toLocaleDateString();
  foot.appendChild(footLeft);
  foot.appendChild(footRight);

  inner.appendChild(title);
  if (lessonLine) inner.appendChild(meta);
  inner.appendChild(wrap);
  inner.appendChild(cap);
  inner.appendChild(foot);
  portal.appendChild(inner);
  document.body.appendChild(portal);

  var printed = false;
  var go = function() {
    if (printed) return;
    printed = true;
    document.body.classList.add('print-photobooth-only');
    try { window.print(); } catch(e) {}
    setTimeout(function() {
      document.body.classList.remove('print-photobooth-only');
      if (portal.parentNode) portal.parentNode.removeChild(portal);
    }, 600);
  };

  // window.print() is synchronous: fire it before the data: URL has decoded
  // and the sheet prints with an empty box where the photo should be.
  photo.onload = go;
  photo.onerror = go;
  photo.src = canvas.toDataURL('image/jpeg', 0.92);
  setTimeout(go, 2000);
}
window.printPhotoboothPhoto = printPhotoboothPhoto;

function attachPhotoboothToSignoff() {
  if (!currentWorkPhotoData) {
    setPhotoboothStatus(
      'Take or upload a photo first, then add it to the optional reflection.',
      'Primero tomen o suban una foto, y luego agréguenla a la reflexión opcional.',
      'warn');
    return;
  }
  var previewImg = pbEl('work_photo_preview');
  var previewWrap = pbEl('work_photo_preview_wrap');
  var extrasMore = document.getElementById('homework_extras_more');
  if (extrasMore) extrasMore.open = true;
  if (previewImg) previewImg.src = currentWorkPhotoData;
  if (previewWrap) previewWrap.hidden = false;

  var attachBtn = pbEl('pb_attach_btn');
  if (attachBtn) {
    attachBtn.innerHTML = '✅ <span class="lang-en">Attached!</span><span class="lang-es" lang="es">¡Adjuntado!</span>';
  }
  var certPhoto = pbEl('display_family_photo');
  var certPhotoBox = pbEl('display_family_photo_box');
  if (certPhoto) certPhoto.src = currentWorkPhotoData;
  if (certPhotoBox) certPhotoBox.hidden = false;

  setTimeout(function() {
    switchHomeworkTab('done');
    var formEl = pbEl('signoff_form_wrapper');
    if (formEl) {
      editParentSignoff();
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, 600);
}
window.attachPhotoboothToSignoff = attachPhotoboothToSignoff;

// Leaving the page with a live camera leaves the indicator light on. Hiding
// the tab (backgrounding the browser on a phone) counts as leaving.
window.addEventListener('pagehide', function() { stopPhotoboothStream({ keepStage: true }); });
document.addEventListener('visibilitychange', function() {
  if (document.hidden) stopPhotoboothStream({ keepStage: true });
});


let hwGameRound = 0;
let hwGameScore = 0;
let hwGameRounds = [];
let hwGameSelectedCard = null;

function initHomeworkGame() {
  const mc = document.querySelector('.hw-game-mc[data-rounds]');
  if (mc && !mc.dataset.initialized) {
    mc.dataset.initialized = '1';
    try { hwGameRounds = JSON.parse(mc.dataset.rounds || '[]'); } catch(e) { hwGameRounds = []; }
    hwGameRound = 0; hwGameScore = 0;
    hwGameShowRound();
  }
}

function hwGameShowRound() {
  const qEl = document.getElementById('hw_game_question');
  const cEl = document.getElementById('hw_game_choices');
  const sEl = document.getElementById('hw_game_score');
  const fEl = document.getElementById('hw_game_feedback');
  const rBtn = document.getElementById('hw_game_restart');
  if (!qEl || !cEl || !hwGameRounds.length) return;
  if (hwGameRound >= hwGameRounds.length) {
    qEl.textContent = '';
    cEl.innerHTML = '';
    if (sEl) sEl.innerHTML = '<span class="lang-en">Score: ' + hwGameScore + '/' + hwGameRounds.length + '</span><span class="lang-es" lang="es">Puntaje: ' + hwGameScore + '/' + hwGameRounds.length + '</span>';
    if (fEl) {
      fEl.innerHTML = hwGameScore === hwGameRounds.length
        ? '<span class="lang-en">🎉 Perfect!</span><span class="lang-es" lang="es">🎉 ¡Perfecto!</span>' : '<span class="lang-en">Nice work!</span><span class="lang-es" lang="es">¡Buen trabajo!</span>';
      fEl.className = 'hw-game-feedback success';
    }
    if (rBtn) rBtn.hidden = false;
    if (typeof triggerCelebration === 'function') triggerCelebration();
    return;
  }
  const round = hwGameRounds[hwGameRound];
  if (sEl) sEl.innerHTML = '<span class="lang-en">Round ' + (hwGameRound + 1) + '</span><span class="lang-es" lang="es">Ronda ' + (hwGameRound + 1) + '</span>';
  qEl.textContent = round.q || '';
  cEl.innerHTML = '';
  if (fEl) { fEl.textContent = round.hint ? '💡 ' + round.hint : ''; fEl.className = 'hw-game-feedback'; }
  (round.choices || []).forEach((ch, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hw-game-choice-btn';
    btn.textContent = ch.text || ch;
    btn.onclick = function() {
      const ok = ch.isCorrect || (round.correct === idx);
      if (ok) { hwGameScore++; btn.classList.add('correct'); }
      else btn.classList.add('incorrect');
      setTimeout(function() { hwGameRound++; hwGameShowRound(); }, 600);
    };
    cEl.appendChild(btn);
  });
}

document.getElementById('hw_game_restart')?.addEventListener('click', function() {
  hwGameRound = 0; hwGameScore = 0;
  const mc = document.querySelector('.hw-game-mc[data-rounds]');
  if (mc) mc.dataset.initialized = '';
  this.hidden = true;
  initHomeworkGame();
});

function hwGameDragStart(ev) {
  ev.dataTransfer.setData('text/plain', ev.target.id);
  hwGameSelectedCard = ev.target;
}
function hwGameAllowDrop(ev) { ev.preventDefault(); }
function hwGameDrop(ev, bucket) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData('text/plain');
  let card = document.getElementById(id);
  if (!card && hwGameSelectedCard) card = hwGameSelectedCard;
  if (!card) return;
  let target = ev.currentTarget;
  if (target.classList.contains('hw-game-bucket-slots') || target.id === 'hw_game_pile') {
    target.appendChild(card);
  } else if (bucket) {
    const slots = document.getElementById('bucket_' + bucket);
    if (slots) slots.appendChild(card);
  } else {
    document.getElementById('hw_game_pile')?.appendChild(card);
  }
  hwGameSelectedCard = null;
}
function hwGameTapCard(card) {
  if (hwGameSelectedCard === card) { card.style.outline = ''; hwGameSelectedCard = null; return; }
  if (hwGameSelectedCard) hwGameSelectedCard.style.outline = '';
  hwGameSelectedCard = card;
  card.style.outline = '3px solid var(--teal)';
}
document.querySelectorAll('.hw-game-bucket, #hw_game_pile').forEach(function(zone) {
  zone.addEventListener('click', function() {
    if (!hwGameSelectedCard) return;
    if (zone.classList.contains('hw-game-bucket')) {
      const slots = zone.querySelector('.hw-game-bucket-slots');
      if (slots) slots.appendChild(hwGameSelectedCard);
    } else zone.appendChild(hwGameSelectedCard);
    hwGameSelectedCard.style.outline = '';
    hwGameSelectedCard = null;
  });
});
function hwGameCheckSort() {
  const fEl = document.getElementById('hw_game_feedback');
  let ok = true;
  document.querySelectorAll('.hw-game-card').forEach(function(card) {
    const parent = card.closest('.hw-game-bucket-slots');
    const bucket = parent ? parent.id.replace('bucket_', '') : '';
    if (bucket !== card.dataset.bucket) ok = false;
  });
  if (fEl) {
    fEl.textContent = ok ? '🎉 All sorted! / ¡Todo clasificado!' : 'Try again — some cards are in the wrong bucket. / Intenten otra vez.';
    fEl.className = 'hw-game-feedback ' + (ok ? 'success' : 'error');
  }
  if (ok && typeof triggerCelebration === 'function') triggerCelebration();
}


(function () {
  "use strict";
  function initRatioComparison(lab) {
    var fields = ['a-cocoa', 'a-milk', 'b-cocoa', 'b-milk'].map(function(key){return lab.querySelector('[data-ratio-'+key+']');});
    function update() {
      var nums = fields.map(function(field){return Number(field.value);});
      var verdict = lab.querySelector('[data-ratio-verdict]');
      if (nums.some(function(n){return !Number.isInteger(n) || n < 1 || n > 30;})) {
        verdict.querySelector('.lang-en').textContent = 'Enter whole numbers from 1 to 30 in all four boxes.';
        verdict.querySelector('.lang-es').textContent = 'Escribe números enteros del 1 al 30 en las cuatro casillas.';
        ['a','b'].forEach(function(key){var box=lab.querySelector('[data-ratio-'+key+'-result]');box.querySelector('.lang-en').textContent='';box.querySelector('.lang-es').textContent='';lab.querySelector('[data-ratio-'+key+'-bar]').style.width='0';});
        return;
      }
      var a = nums[0] / nums[1], b = nums[2] / nums[3];
      [['a','Reyes',nums[0],nums[1],a],['b','Tran',nums[2],nums[3],b]].forEach(function(row){
        var box=lab.querySelector('[data-ratio-'+row[0]+'-result]');
        box.querySelector('.lang-en').textContent = row[2]+' ÷ '+row[3]+' = '+row[4].toFixed(2)+' tablespoons per 1 ounce';
        box.querySelector('.lang-es').textContent = row[2]+' ÷ '+row[3]+' = '+row[4].toFixed(2)+' cucharadas por 1 onza';
        lab.querySelector('[data-ratio-'+row[0]+'-bar]').style.width = (row[4]/Math.max(a,b)*100)+'%';
      });
      var common = nums[1]*nums[3], cocoaA = nums[0]*nums[3], cocoaB = nums[2]*nums[1];
      var winner = cocoaA > cocoaB ? 'Reyes' : 'Tran';
      verdict.querySelector('.lang-en').textContent = 'For '+common+' ounces of milk: Reyes uses '+cocoaA+' tablespoons; Tran uses '+cocoaB+'. '+(cocoaA===cocoaB?'Both recipes have the same cocoa strength.':winner+' has more cocoa for the same milk.');
      verdict.querySelector('.lang-es').textContent = 'Para '+common+' onzas de leche: Reyes usa '+cocoaA+' cucharadas; Tran usa '+cocoaB+'. '+(cocoaA===cocoaB?'Ambas recetas tienen la misma intensidad de cacao.':winner+' tiene más cacao para la misma cantidad de leche.');
    }
    fields.forEach(function(field){field.addEventListener('input',update);});
    update();
  }
  function initRatioComparisons(){document.querySelectorAll('[data-ratio-compare]').forEach(initRatioComparison);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initRatioComparisons);else initRatioComparisons();
  var NS = "http://www.w3.org/2000/svg";
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function svgWrap(body, label) { return '<svg viewBox="0 0 560 280" role="img" aria-label="' + label + '"><rect x="8" y="8" width="544" height="264" rx="24" fill="#f8fbf2" stroke="#173a5e" stroke-width="3"/>' + body + '</svg>'; }
  function text(x,y,value,cls,anchor){return '<text x="'+x+'" y="'+y+'" class="'+(cls||'lab-label')+'" text-anchor="'+(anchor||'start')+'">'+value+'</text>';}
  function circle(x,y,r,cls){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" class="'+(cls||'lab-teal')+'"/>';}
  function rect(x,y,w,h,cls,rx){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx||0)+'" class="'+(cls||'lab-teal')+'"/>';}
  function line(x1,y1,x2,y2,cls){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(cls||'lab-axis')+'"/>';}
  function gridLines(x,y,cols,rows,cell){var s='';for(var c=0;c<=cols;c++)s+=line(x+c*cell,y,x+c*cell,y+rows*cell,'lab-grid');for(var r=0;r<=rows;r++)s+=line(x,y+r*cell,x+cols*cell,y+r*cell,'lab-grid');return s;}
  function dots(count,cols,startX,startY,gap){var s='';for(var i=0;i<count;i++)s+=circle(startX+(i%cols)*gap,startY+Math.floor(i/cols)*gap,Math.min(12,gap*.28),i%2?'lab-accent':'lab-teal');return s;}
  function result(svg,equation,observation,status,mini){return{svg:svg,equation:equation,observation:observation,status:status,mini:mini||Math.min(18,Math.max(3,parseInt(equation,10)||8))};}
  function render(topic,v){
    var body='',eq='',obs='',status='',mini=8;
    if(topic==='exponents'){var total=Math.pow(v.base,v.power);for(var i=0;i<v.power;i++){body+=rect(70+i*105,92,72,72,i%2?'lab-accent':'lab-teal',14)+text(106+i*105,138,String(v.base),'lab-big','middle');if(i<v.power-1)body+=text(160+i*105,138,'×','lab-big','middle');}body+=text(280,220,'Multiply '+v.base+' a total of '+v.power+' times','lab-label','middle');eq=Array(v.power).fill(v.base).join(' × ')+' = '+total;obs='The exponent tells how many equal factors to use.';status=v.base+' to the power of '+v.power+' equals '+total;mini=v.power;}
    else if(topic==='ratios'){var a=v.batches*v.blue,b=v.batches*3;body+=dots(a,v.blue,90,72,36)+dots(b,3,350,72,36)+text(150,224,a+' blue','lab-big','middle')+text(410,224,b+' coral','lab-big','middle')+text(280,46,v.batches+' equivalent batch'+(v.batches===1?'':'es'),'lab-label','middle');eq=a+' : '+b+' = '+v.blue+' : 3';obs='Both parts are multiplied by the same number of batches.';status='The ratio is '+a+' to '+b;mini=Math.min(18,a+b);}
    else if(topic==='equations'){var totalEq=v.unknown+v.add;body+=line(90,105,470,105)+line(280,105,280,235)+rect(235,235,90,18,'lab-sun',6)+rect(80,125,180,70,'lab-teal',14)+rect(300,125,180,70,'lab-accent',14)+text(170,167,'x  +  '+v.add,'lab-big','middle')+text(390,167,String(totalEq),'lab-big','middle')+text(280,58,'Both sides have the same value','lab-label','middle');eq='x + '+v.add+' = '+totalEq+'  →  x = '+v.unknown;obs='Removing the same amount from both sides keeps the scale balanced.';status='The unknown value is '+v.unknown;mini=v.add;}
    else if(topic==='inequalities'){var start=70,step=42,y=145;body+=line(start,y,start+10*step,y);for(var ni=-5;ni<=5;ni++){var nx=start+(ni+5)*step;body+=line(nx,y-8,nx,y+8,'lab-axis')+text(nx,y+30,String(ni),'lab-small','middle');}var bx=start+(v.boundary+5)*step;body+='<rect x="'+bx+'" y="125" width="'+(start+10*step-bx)+'" height="40" fill="#0b8f87" opacity=".28"/>'+circle(bx,y,11,'lab-accent');var tx=start+(v.test+5)*step;body+=circle(tx,82,12,v.test>v.boundary?'lab-teal':'lab-sun')+line(tx,94,tx,126,'lab-axis')+text(280,52,'Shaded values are greater than '+v.boundary,'lab-label','middle');eq='x > '+v.boundary;obs=v.test+(v.test>v.boundary?' is':' is not')+' in the shaded solution set.';status='Test point '+v.test+(v.test>v.boundary?' works':' does not work');mini=Math.abs(v.test-v.boundary)+2;}
    else if(topic==='properties'){var cols=v.left+v.right,cell=Math.min(34,300/cols),gx=130,gy=58;body+=gridLines(gx,gy,cols,v.rows,cell);body+='<rect x="'+gx+'" y="'+gy+'" width="'+(v.left*cell)+'" height="'+(v.rows*cell)+'" fill="#0b8f87" opacity=".55"/><rect x="'+(gx+v.left*cell)+'" y="'+gy+'" width="'+(v.right*cell)+'" height="'+(v.rows*cell)+'" fill="#ff775f" opacity=".55"/>';body+=text(280,245,v.rows+' rows split into '+v.left+' and '+v.right+' columns','lab-label','middle');eq=v.rows+'('+v.left+' + '+v.right+') = '+(v.rows*v.left)+' + '+(v.rows*v.right)+' = '+(v.rows*cols);obs='Splitting the array does not change its total number of squares.';status='Total area: '+(v.rows*cols)+' square units';mini=Math.min(18,v.rows*cols);}
    else if(topic==='expressions'){for(var xt=0;xt<v.coefficient;xt++)body+=rect(55+xt*76,65,54,120,xt%2?'lab-accent':'lab-teal',9)+text(82+xt*76,135,'x','lab-big','middle');body+=dots(v.constant,5,135,225,33)+text(280,42,'Algebra tiles','lab-label','middle');eq=v.coefficient+'x + '+v.constant;obs='Long tiles represent x; small tiles represent units.';status=v.coefficient+' variable tiles and '+v.constant+' unit tiles';mini=v.coefficient+v.constant;}
    else if(topic==='area'){var cellA=Math.min(30,300/v.width,150/v.height),ax=130,ay=52;body+=gridLines(ax,ay,v.width,v.height,cellA)+'<rect x="'+ax+'" y="'+ay+'" width="'+(v.width*cellA)+'" height="'+(v.height*cellA)+'" fill="#0b8f87" opacity=".38"/>';body+=text(ax+v.width*cellA/2,ay+v.height*cellA+35,v.width+' columns','lab-label','middle')+text(75,ay+v.height*cellA/2,v.height+' rows','lab-label','middle');eq=v.width+' × '+v.height+' = '+(v.width*v.height)+' square units';obs='Area counts every square inside the shape.';status='Area: '+(v.width*v.height)+' square units';mini=Math.min(18,v.width*v.height);}
    else if(topic==='volume'){var layer=v.length*v.width,totalV=layer*v.height;for(var z=0;z<v.height;z++){var ox=105+z*18,oy=165-z*30;body+='<polygon points="'+ox+','+oy+' '+(ox+v.length*38)+','+oy+' '+(ox+v.length*38+v.width*18)+','+(oy-v.width*18)+' '+(ox+v.width*18)+','+(oy-v.width*18)+'" fill="'+(z%2?'#ff775f':'#0b8f87')+'" opacity=".52" stroke="#173a5e" stroke-width="2"/>';}body+=text(280,45,v.height+' layer'+(v.height===1?'':'s')+' · '+layer+' cubes each','lab-label','middle')+text(280,242,totalV+' unit cubes','lab-big','middle');eq=v.length+' × '+v.width+' × '+v.height+' = '+totalV+' cubic units';obs='Each layer has length × width cubes.';status='Volume: '+totalV+' cubic units';mini=Math.min(18,totalV);}
    else if(topic==='surface-area'){var scale=18,l=v.length*scale,w=v.width*scale,h=v.height*scale,cx=280,cy=135;body+=rect(cx-l/2,cy-h/2,l,h,'lab-teal')+rect(cx-l/2,cy-h/2-w,l,w,'lab-sun')+rect(cx-l/2,cy+h/2,l,w,'lab-sun')+rect(cx-l/2-w,cy-h/2,w,h,'lab-accent')+rect(cx+l/2,cy-h/2,w,h,'lab-accent')+rect(cx-l/2,cy+h/2+w,l,w,'lab-teal');var sa=2*(v.length*v.width+v.length*v.height+v.width*v.height);body+=text(280,45,'Six faces unfold into one net','lab-label','middle')+text(280,255,'Add every face','lab-label','middle');eq='2('+v.length+'×'+v.width+' + '+v.length+'×'+v.height+' + '+v.width+'×'+v.height+') = '+sa;obs='Opposite faces have matching dimensions and areas.';status='Surface area: '+sa+' square units';mini=6;}
    else if(topic==='statistics'){var vals=[v.center-v.spread,v.center-1,v.center,v.center,v.center+1,v.center+v.spread];var counts={},dataMin=Math.min.apply(null,vals)-1,dataMax=Math.max.apply(null,vals)+1,dataSpan=dataMax-dataMin;vals.forEach(function(n){counts[n]=(counts[n]||0)+1;});body+=line(70,220,490,220);for(var sn=dataMin;sn<=dataMax;sn++){var sx=70+(sn-dataMin)*(420/dataSpan);body+=line(sx,212,sx,228,'lab-axis')+text(sx,250,String(sn),'lab-small','middle');}Object.keys(counts).forEach(function(k){for(var di=0;di<counts[k];di++)body+=circle(70+(Number(k)-dataMin)*(420/dataSpan),195-di*32,11,Number(k)===v.center?'lab-accent':'lab-teal');});body+=text(280,45,'Data values: '+vals.join(', '),'lab-label','middle');eq='center = '+v.center+' · range = '+(Math.max.apply(null,vals)-Math.min.apply(null,vals));obs='A larger spread moves the outside dots farther from the center.';status='Six data points centered near '+v.center;mini=6;}
    else if(topic==='coordinate-plane'){var ox=280,oy=140,st=22;for(var gi=-5;gi<=5;gi++){body+=line(ox+gi*st,30,ox+gi*st,250,'lab-grid')+line(170,oy+gi*st,390,oy+gi*st,'lab-grid');}body+=line(160,oy,400,oy)+line(ox,20,ox,260)+circle(ox+v.x*st,oy-v.y*st,13,'lab-accent')+line(ox,oy-v.y*st,ox+v.x*st,oy-v.y*st,'lab-grid')+line(ox+v.x*st,oy,ox+v.x*st,oy-v.y*st,'lab-grid')+text(ox+v.x*st+18,oy-v.y*st-10,'('+v.x+', '+v.y+')','lab-label');eq='(x, y) = ('+v.x+', '+v.y+')';obs='Move across for x first, then move up or down for y.';status='Point at '+v.x+', '+v.y;mini=Math.abs(v.x)+Math.abs(v.y)+2;}
    else if(topic==='number-line'){var nstart=70,nstep=14,ny=150;body+=line(nstart,ny,nstart+30*nstep,ny);for(var nn=-15;nn<=15;nn++){var xx=nstart+(nn+15)*nstep;body+=line(xx,ny-7,xx,ny+7,'lab-axis');if(nn%5===0)body+=text(xx,ny+28,String(nn),'lab-small','middle');}var end=v.point+v.jump,p1=nstart+(v.point+15)*nstep,p2=nstart+(end+15)*nstep;body+=circle(p1,ny,12,'lab-teal')+circle(p2,ny,12,'lab-accent')+'<path d="M'+p1+' 115 Q'+((p1+p2)/2)+' 68 '+p2+' 115" fill="none" stroke="#ff775f" stroke-width="5"/>';body+=text(280,48,'Start '+v.point+' · jump '+v.jump,'lab-label','middle');eq=v.point+(v.jump>=0?' + ':' − ')+Math.abs(v.jump)+' = '+end;obs='Positive jumps move right; negative jumps move left.';status='The jump lands on '+end;mini=Math.abs(v.jump)+3;}
    else if(topic==='fractions'){var den=v.denominator,num=clamp(v.numerator,0,12),barCount=Math.max(1,Math.ceil(num/den)),bw=380/den,barH=Math.min(38,150/barCount),barGap=8,fy=64;for(var fb=0;fb<barCount;fb++){for(var fi=0;fi<den;fi++){var part=fb*den+fi;body+=rect(90+fi*bw,fy+fb*(barH+barGap),bw,barH,part<num?'lab-teal':'lab-sun',0);}}body+=text(280,42,num+' shaded parts · '+den+' equal parts per whole','lab-label','middle')+text(280,250,num+'/'+den,'lab-big','middle');eq=num+' / '+den;obs='The denominator sets equal parts in each whole; the numerator counts all shaded parts.';status=num+' parts are shaded in groups of '+den;mini=Math.min(18,Math.max(den,num));}
    else if(topic==='decimals'){var hv=v.hundredths,cellD=18,dx=190,dy=38;body+=gridLines(dx,dy,10,10,cellD);for(var hi=0;hi<hv;hi++)body+='<rect x="'+(dx+(hi%10)*cellD)+'" y="'+(dy+Math.floor(hi/10)*cellD)+'" width="'+cellD+'" height="'+cellD+'" fill="'+(hi%10===0?'#ff775f':'#0b8f87')+'" opacity=".75"/>';body+=text(110,126,(hv/100).toFixed(2),'lab-big','middle')+text(450,126,hv+'%','lab-big','middle');eq=hv+'/100 = '+(hv/100).toFixed(2)+' = '+hv+'%';obs='Each small square is one hundredth of the whole grid.';status=hv+' hundredths are shaded';mini=Math.min(18,Math.ceil(hv/6));}
    else if(topic==='division'){var dNum=clamp(v.dividend||1344,10,9999),qDiv=clamp(v.divisor||12,1,99),quot=Math.floor(dNum/qDiv),rem=dNum%qDiv,curStep=clamp(v.step||4,1,4);body+=rect(30,30,500,220,'lab-sun',16);body+=text(140,88,String(qDiv),'lab-big','end')+line(150,55,150,102,'lab-axis')+line(150,55,340,55,'lab-axis')+text(165,88,String(dNum),'lab-big','start')+text(165,46,curStep>=1?String(quot):'?','lab-big','start');var stepLetters=['D','M','S','B'],stepLabels=['Divide','Multiply','Subtract','Bring down'],stepNames=['1. D — Divide: determine quotient digit','2. M — Multiply: multiply quotient digit × divisor','3. S — Subtract: find difference (must be < divisor)','4. B — Bring down: bring next digit down and repeat'];for(var si=0;si<4;si++){var px=45+si*118,py=120,isAct=(si+1)===curStep;body+=rect(px,py,110,34,isAct?'lab-accent':(si+1<curStep?'lab-teal':'lab-sun'),8)+circle(px+16,py+17,10,isAct?'lab-sun':'lab-teal')+text(px+16,py+22,stepLetters[si],'lab-small','middle')+text(px+34,py+22,stepLabels[si],'lab-small','start');}body+=text(280,188,stepNames[curStep-1],'lab-label','middle')+text(280,225,dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' R '+rem:''),'lab-big','middle');eq=dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' R '+rem:'');obs='Long division standard algorithm: Divide → Multiply → Subtract → Bring down (DMSB).';status=dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' with remainder '+rem:'')+' · Check: '+qDiv+' × '+quot+(rem>0?' + '+rem:'')+' = '+dNum;mini=4;}
    else{var total=v.groups*v.items;for(var gr=0;gr<v.groups;gr++){body+=rect(45+gr*82,70,66,130,gr%2?'lab-accent':'lab-teal',14)+text(78+gr*82,58,'Group '+(gr+1),'lab-small','middle')+dots(v.items,2,66+gr*82,95,25);}eq=v.groups+' × '+v.items+' = '+total;obs='Equal groups connect a picture to multiplication.';status=total+' items in all';mini=Math.min(18,total);}
    return result(svgWrap(body,status||'Interactive math visual'),eq,obs,status,mini);
  }
  function values(lab){var out={};lab.querySelectorAll('[data-lab-input]').forEach(function(input){out[input.getAttribute('data-lab-input')]=Number(input.value);});return out;}
  function update(lab){var v=values(lab),topic=lab.getAttribute('data-visual-lab')||'fallback',r=render(topic,v);lab.querySelector('[data-lab-stage]').innerHTML=r.svg;lab.querySelector('[data-lab-equation]').textContent=r.equation;lab.querySelector('[data-lab-observation]').textContent=r.observation;lab.querySelector('[data-lab-status]').textContent=r.status;lab.querySelectorAll('[data-lab-output]').forEach(function(o){o.value=v[o.getAttribute('data-lab-output')];o.textContent=v[o.getAttribute('data-lab-output')];});var mini=lab.querySelector('[data-lab-mini]');mini.innerHTML='';for(var i=0;i<r.mini;i++){var dot=document.createElement('span');dot.className='mini-dot';mini.appendChild(dot);}}
  function init(lab){var initial={};lab.querySelectorAll('[data-lab-input]').forEach(function(input){initial[input.getAttribute('data-lab-input')]=input.value;input.addEventListener('input',function(){lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});update(lab);});});lab.querySelectorAll('[data-preset]').forEach(function(btn){btn.addEventListener('click',function(){try{var vals=JSON.parse(btn.getAttribute('data-preset'));lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});btn.classList.add('is-active');Object.keys(vals).forEach(function(k){var inp=lab.querySelector('[data-lab-input="'+k+'"]');if(inp)inp.value=vals[k];});update(lab);}catch(e){}});});lab.querySelector('[data-lab-reset]').addEventListener('click',function(){lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});lab.querySelectorAll('[data-lab-input]').forEach(function(input){input.value=initial[input.getAttribute('data-lab-input')];});update(lab);});lab.querySelector('[data-lab-random]').addEventListener('click',function(){lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});lab.querySelectorAll('[data-lab-input]').forEach(function(input){var min=Number(input.min),max=Number(input.max);input.value=Math.floor(Math.random()*(max-min+1))+min;});update(lab);});update(lab);}
  function initAll(){document.querySelectorAll('[data-visual-lab]').forEach(function(lab){if(lab.getAttribute('data-visual-ready')||lab.querySelector('[data-lesson-model-host]'))return;lab.setAttribute('data-visual-ready','1');init(lab);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAll);else initAll();
})();


/* ── Math keypad ─────────────────────────────────────────────────────────────
   Inserts math symbols at the caret of whichever answer field has focus. Only
   symbols the shared answer matcher understands are offered, so nothing a
   family can tap here can turn a correct answer red. */
var MATHPAD_SELECTOR =
  "input.custom-input:not([type=\"hidden\"]), input.table-input, input.ladder-input" + ", " + "textarea.custom-textarea";
var MATHPAD_OFF_KEY = "hw_mathpad_off";
var mathpadTarget = null;
var mathpadDismissed = false;

try {
  mathpadDismissed = localStorage.getItem(MATHPAD_OFF_KEY) === "1";
} catch (e) {}

function mathpadEl() {
  return document.getElementById("math_keypad");
}

function mathpadEsc(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Render the typed answer the way it is meant to read: 3/4 stacked, 2^3 as a
   power. Display only — the field still holds the plain text that gets graded. */
function mathpadPretty(raw) {
  var text = String(raw == null ? "" : raw);
  if (!text.trim()) return "";
  var html = mathpadEsc(text);
  html = html.replace(/(\d+(?:\.\d+)?)\s*\^\s*(-?\d+)/g, function (whole, base, power) {
    return base + "<sup>" + power + "</sup>";
  });
  html = html.replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g, function (whole, num, den) {
    return (
      '<span class="mathpad-frac"><span class="mathpad-frac-num">' +
      num +
      '</span><span class="mathpad-frac-den">' +
      den +
      "</span></span>"
    );
  });
  return html;
}

function mathpadUpdatePreview() {
  var preview = document.getElementById("mathpad_preview");
  if (!preview) return;
  preview.innerHTML = mathpadTarget ? mathpadPretty(mathpadTarget.value) : "";
  preview.scrollLeft = preview.scrollWidth;
}

/* Keep the sticky Check bar and the end of the page clear of the open keypad. */
function mathpadSyncHeight() {
  var pad = mathpadEl();
  if (!pad || pad.hidden) {
    document.body.classList.remove("mathpad-open");
    document.body.style.removeProperty("--mathpad-h");
    if (typeof syncHomeworkChromeHeights === "function") syncHomeworkChromeHeights();
    return;
  }
  document.body.classList.add("mathpad-open");
  document.body.style.setProperty("--mathpad-h", pad.offsetHeight + "px");
  if (typeof syncHomeworkChromeHeights === "function") syncHomeworkChromeHeights();
}

/* A phone's on-screen keyboard shrinks the VISUAL viewport but not the layout
   viewport, so a bottom-fixed panel sits behind it. Lift the keypad by the
   difference so it rides on top of the keyboard where it can be reached. */
function mathpadSyncViewport() {
  var pad = mathpadEl();
  if (!pad) return;
  var vv = window.visualViewport;
  if (!vv) return;
  var lift = window.innerHeight - vv.height - vv.offsetTop;
  pad.style.transform = lift > 1 ? "translateY(" + -lift + "px)" : "";
}

function mathpadSetTarget(field) {
  if (mathpadTarget && mathpadTarget !== field) {
    mathpadTarget.classList.remove("mathpad-active-field");
  }
  mathpadTarget = field || null;
  if (mathpadTarget) mathpadTarget.classList.add("mathpad-active-field");
}

function showMathKeypad(field) {
  var pad = mathpadEl();
  if (!pad) return;
  mathpadSetTarget(field);
  var fab = document.getElementById("mathpad_fab");
  if (mathpadDismissed) {
    if (fab) fab.hidden = false;
    return;
  }
  if (fab) fab.hidden = true;
  pad.hidden = false;
  mathpadSyncHeight();
  mathpadSyncViewport();
  mathpadUpdatePreview();
}

function hideMathKeypad() {
  var pad = mathpadEl();
  if (!pad) return;
  mathpadDismissed = true;
  try {
    localStorage.setItem(MATHPAD_OFF_KEY, "1");
  } catch (e) {}
  pad.hidden = true;
  mathpadSyncHeight();
  var fab = document.getElementById("mathpad_fab");
  if (fab) fab.hidden = !mathpadTarget;
}

function reopenMathKeypad() {
  mathpadDismissed = false;
  try {
    localStorage.removeItem(MATHPAD_OFF_KEY);
  } catch (e) {}
  var fab = document.getElementById("mathpad_fab");
  if (fab) fab.hidden = true;
  var pad = mathpadEl();
  if (pad) {
    pad.hidden = false;
    mathpadSyncHeight();
    mathpadSyncViewport();
    mathpadUpdatePreview();
  }
  if (mathpadTarget) mathpadTarget.focus();
}

function mathpadCloseAll() {
  var pad = mathpadEl();
  if (pad) pad.hidden = true;
  var fab = document.getElementById("mathpad_fab");
  if (fab) fab.hidden = true;
  mathpadSetTarget(null);
  mathpadSyncHeight();
}

/* Splice text in at the caret and let the field's own oninput handlers
   (saveState, updateProgress) run exactly as if it had been typed. */
function mathpadInsert(text, caretBack) {
  var field = mathpadTarget;
  if (!field) return;
  var start = field.selectionStart;
  var end = field.selectionEnd;
  if (start == null || end == null) {
    start = field.value.length;
    end = start;
  }
  field.value = field.value.slice(0, start) + text + field.value.slice(end);
  var caret = start + text.length - (caretBack || 0);
  field.focus();
  try {
    field.setSelectionRange(caret, caret);
  } catch (e) {}
  field.dispatchEvent(new Event("input", { bubbles: true }));
  mathpadUpdatePreview();
}

function mathpadBackspace() {
  var field = mathpadTarget;
  if (!field) return;
  var start = field.selectionStart;
  var end = field.selectionEnd;
  if (start == null || end == null) {
    start = field.value.length;
    end = start;
  }
  if (start === end) {
    if (start === 0) return;
    start -= 1;
  }
  field.value = field.value.slice(0, start) + field.value.slice(end);
  field.focus();
  try {
    field.setSelectionRange(start, start);
  } catch (e) {}
  field.dispatchEvent(new Event("input", { bubbles: true }));
  mathpadUpdatePreview();
}

function mathpadSelectGroup(id) {
  var pad = mathpadEl();
  if (!pad) return;
  var tabs = pad.querySelectorAll(".mathpad-tab");
  for (var i = 0; i < tabs.length; i++) {
    var on = tabs[i].getAttribute("data-mathpad-group") === id;
    tabs[i].classList.toggle("is-active", on);
    tabs[i].setAttribute("aria-selected", on ? "true" : "false");
  }
  var panels = pad.querySelectorAll("[data-mathpad-panel]");
  for (var j = 0; j < panels.length; j++) {
    panels[j].hidden = panels[j].getAttribute("data-mathpad-panel") !== id;
  }
  mathpadSyncHeight();
}

(function initMathKeypad() {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
  ready(function () {
    var pad = mathpadEl();
    if (!pad) return;

    /* Tapping a key must not move focus off the field being written into.
       preventDefault on mousedown is enough for that on both pointer and
       touch; cancelling touchstart would also cancel the click that follows
       it on iOS, which would leave the keypad inert on the phones most of
       these families use. */
    pad.addEventListener("mousedown", function (event) {
      if (event.target.closest(".mathpad-key, .mathpad-util, .mathpad-tab")) {
        event.preventDefault();
      }
    });

    pad.addEventListener("click", function (event) {
      var tab = event.target.closest(".mathpad-tab");
      if (tab) {
        mathpadSelectGroup(tab.getAttribute("data-mathpad-group"));
        return;
      }
      var action = event.target.closest("[data-mathpad-action]");
      if (action) {
        if (action.getAttribute("data-mathpad-action") === "backspace") mathpadBackspace();
        else hideMathKeypad();
        return;
      }
      var key = event.target.closest(".mathpad-key");
      if (!key) return;
      mathpadInsert(key.getAttribute("data-ins"), Number(key.getAttribute("data-caret")) || 0);
    });

    document.addEventListener("focusin", function (event) {
      var node = event.target;
      if (!node || !node.closest) return;
      var field = node.closest(MATHPAD_SELECTOR);
      if (field) {
        showMathKeypad(field);
      } else if (!node.closest(".mathpad, .mathpad-fab")) {
        mathpadCloseAll();
      }
    });

    document.addEventListener("input", function (event) {
      if (mathpadTarget && event.target === mathpadTarget) mathpadUpdatePreview();
    });

    window.addEventListener("resize", mathpadSyncHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", mathpadSyncViewport);
      window.visualViewport.addEventListener("scroll", mathpadSyncViewport);
    }
  });
})();

// Sound engine
let soundEnabled = true;
let audioCtx = null;
let currentStreak = 0;

/* How many times each problem has been checked, so a multiple-choice question
   can coach before it answers itself.
   The page used to reveal on the FIRST wrong tap: it turned the chosen option
   red, the right one green, and printed the full walkthrough — and its own
   Parent Coach line then asked "why does the highlighted green choice fit
   best?", which only makes sense once the answer is already exposed. A family
   guessing gets the answer for free, and the page's own framing ("Ask
   questions — let your student do the thinking") stops being true at the first
   mistake. Now: attempt 1 wrong shows the trap written for THAT choice and
   invites another go; attempt 2 reveals, and so does the explicit
   "Show me how" button, because a stuck family should never have to burn a
   wrong answer to get help. */
const problemAttempts = {};
const revealForced = {};
function revealIsDue(idx) {
  return (problemAttempts[idx] || 0) >= 3 || revealForced[idx] === true;
}
function forceReveal(idx) {
  revealForced[idx] = true;
  checkProblem(idx);
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("sound_toggle");
  if (btn) {
    btn.textContent = soundEnabled ? "🔊" : "🔇";
    btn.title = soundEnabled ? "Mute Sound Effects" : "Unmute Sound Effects";
  }
}

function playTabSwitchSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {}
}

function playMatchSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    [440, 659.25].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.22);
    });
  } catch (e) {}
}

function playFanfareSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      gain.gain.setValueAtTime(0.09, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  } catch (e) {}
}

function speakMathWord(termEn, termEs) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const isEs = document.body.classList.contains("lang-mode-es");
    const text = isEs && termEs ? termEs : termEn;
    const lang = isEs && termEs ? "es-US" : "en-US";
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

// Confetti Particle Engine
function triggerConfettiBurst(originX, originY, count = 50) {
  try {
    let canvas = document.getElementById("hw_confetti_canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "hw_confetti_canvas";
      canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
      document.body.appendChild(canvas);
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    const colors = ["#1fa6a2", "#f2c15b", "#d9795d", "#12355b", "#10b981", "#8b5cf6"];
    const particles = [];
    const startX = originX || window.innerWidth / 2;
    const startY = originY || window.innerHeight / 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.016 + Math.random() * 0.016,
      });
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      for (let p of particles) {
        if (p.life > 0) {
          active = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.22;
          p.rotation += p.rSpeed;
          p.life -= p.decay;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (active) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(frame);
  } catch (e) {}
}

// Skill Power-Up Challenge Engine
function checkSkillPowerUp(btn, choiceIdx, correctIdx) {
  const container = document.getElementById("powerup_choices");
  const feedbackBox = document.getElementById("powerup_feedback_box");
  const contentEl = document.getElementById("powerup_feedback_content");
  if (!container || !feedbackBox || !contentEl) return;

  const buttons = container.querySelectorAll(".powerup-choice-btn");
  const isCorrect = choiceIdx === correctIdx;

  if (isCorrect) {
    btn.classList.add("is-correct");
    btn.classList.remove("is-wrong");
    buttons.forEach((b) => {
      if (b !== btn) b.disabled = true;
    });
    feedbackBox.className = "powerup-feedback-box is-success";
    feedbackBox.hidden = false;
    contentEl.innerHTML = '<span class="lang-en">🎉 <strong>Power-Up Unlocked!</strong> You earned +1 Star and mastered the key concept.</span><span class="lang-es" lang="es">🎉 <strong>¡Poder Desbloqueado!</strong> Ganaste +1 Estrella y dominaste el concepto clave.</span>';
    const badge = document.getElementById("tab_badge_learn");
    if (badge) badge.textContent = "★";
    const starBadge = document.getElementById("powerup_star_badge");
    if (starBadge) {
      starBadge.classList.add("is-unlocked");
      starBadge.innerHTML = '<span class="lang-en">★ Earned!</span><span class="lang-es" lang="es">★ ¡Ganada!</span>';
    }
    if (typeof playFanfareSound === "function") playFanfareSound();
    if (typeof triggerConfettiBurst === "function") triggerConfettiBurst();
    try {
      localStorage.setItem(STORAGE_KEY + "_powerup_solved", "1");
    } catch (e) {}
  } else {
    btn.classList.add("is-wrong");
    feedbackBox.className = "powerup-feedback-box is-hint";
    feedbackBox.hidden = false;
    const hintEn = btn.dataset.hintEn || "Think carefully about the visual model!";
    const hintEs = btn.dataset.hintEs || "¡Piensa cuidadosamente en el modelo visual!";
    contentEl.innerHTML = '<span class="lang-en">💡 <strong>Almost!</strong> ' + hintEn + ' Give it another shot!</span><span class="lang-es" lang="es">💡 <strong>¡Casi!</strong> ' + hintEs + ' ¡Inténtalo de nuevo!</span>';
    if (typeof playFailureSound === "function") playFailureSound();
    setTimeout(() => btn.classList.remove("is-wrong"), 600);
  }
}

// Vocab Match & Master Challenge Engine
let selectedVocabChip = null;
let matchedVocabCount = 0;

function selectVocabMatchChip(chip) {
  if (chip.classList.contains("is-matched")) return;

  if (!selectedVocabChip) {
    selectedVocabChip = chip;
    chip.classList.add("is-selected");
    if (typeof playTabSwitchSound === "function") playTabSwitchSound();
    return;
  }

  if (selectedVocabChip === chip) {
    chip.classList.remove("is-selected");
    selectedVocabChip = null;
    return;
  }

  if (selectedVocabChip.dataset.side === chip.dataset.side) {
    selectedVocabChip.classList.remove("is-selected");
    selectedVocabChip = chip;
    chip.classList.add("is-selected");
    return;
  }

  const id1 = selectedVocabChip.dataset.vocabId;
  const id2 = chip.dataset.vocabId;
  const c1 = selectedVocabChip;
  const c2 = chip;
  selectedVocabChip = null;
  c1.classList.remove("is-selected");

  if (id1 === id2) {
    c1.classList.add("is-matched");
    c2.classList.add("is-matched");
    c1.disabled = true;
    c2.disabled = true;
    matchedVocabCount++;
    const countEl = document.getElementById("vocab_match_count");
    if (countEl) countEl.textContent = matchedVocabCount;
    if (typeof playMatchSound === "function") playMatchSound();

    const shell = document.getElementById("vocab_match_shell");
    const total = parseInt(shell?.dataset.vocabTotal || "0", 10);
    if (matchedVocabCount >= total && total > 0) {
      const winEl = document.getElementById("vocab_match_win");
      if (winEl) winEl.hidden = false;
      const badge = document.getElementById("tab_badge_words");
      if (badge) badge.textContent = "★";
      if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 70);
      if (typeof playSuccessArpeggio === "function") playSuccessArpeggio();
      try {
        localStorage.setItem(STORAGE_KEY + "_vocab_won", "1");
      } catch (e) {}
    }
  } else {
    c1.classList.add("is-mismatch");
    c2.classList.add("is-mismatch");
    if (typeof playFailureSound === "function") playFailureSound();
    setTimeout(() => {
      c1.classList.remove("is-mismatch");
      c2.classList.remove("is-mismatch");
    }, 600);
  }
}

function resetVocabMatchGame() {
  matchedVocabCount = 0;
  selectedVocabChip = null;
  const countEl = document.getElementById("vocab_match_count");
  if (countEl) countEl.textContent = "0";
  const winEl = document.getElementById("vocab_match_win");
  if (winEl) winEl.hidden = true;
  document.querySelectorAll(".vocab-match-chip").forEach((c) => {
    c.classList.remove("is-matched", "is-selected", "is-mismatch");
    c.disabled = false;
  });
}

function toggleVocabCardMastery(idx) {
  const btn = document.querySelector('.vocab-master-toggle[data-term-idx="' + idx + '"]');
  if (!btn) return;
  const isMastered = btn.classList.toggle("is-mastered");
  if (isMastered && typeof playTabSwitchSound === "function") playTabSwitchSound();
  try {
    localStorage.setItem(STORAGE_KEY + "_vocab_mastered_" + idx, isMastered ? "1" : "0");
  } catch (e) {}
}

function markVocabCardKnown(idx, known) {
  const card = document.getElementById("vocab_card_" + idx);
  const toggle = document.querySelector('.vocab-master-toggle[data-term-idx="' + idx + '"]');
  if (known) {
    if (card) card.classList.add("is-known");
    if (toggle) toggle.classList.add("is-mastered");
    if (typeof playMatchSound === "function") playMatchSound();
  } else {
    if (card) card.classList.remove("is-known");
    if (toggle) toggle.classList.remove("is-mastered");
  }
  try {
    localStorage.setItem(STORAGE_KEY + "_vocab_known_" + idx, known ? "1" : "0");
    const termEl = card ? card.querySelector('.term-text') : null;
    const term = termEl ? termEl.textContent.trim() : '';
    if (term) {
      let reviewDeck = JSON.parse(localStorage.getItem('hw_vocab_review_deck') || '[]');
      if (!known) {
        if (!reviewDeck.includes(term)) reviewDeck.push(term);
      } else {
        reviewDeck = reviewDeck.filter(t => t !== term);
      }
      localStorage.setItem('hw_vocab_review_deck', JSON.stringify(reviewDeck));
    }
  } catch (e) {}
}

// Scratchpad Engine
let scratchpadCanvas = null;
let scratchpadCtx = null;
let isDrawing = false;
let scratchpadColor = "#12355b";
let isEraser = false;

function initScratchpad() {
  scratchpadCanvas = document.getElementById("hw_scratchpad_canvas");
  if (!scratchpadCanvas) return;
  scratchpadCtx = scratchpadCanvas.getContext("2d");

  function getPos(e) {
    const rect = scratchpadCanvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * scratchpadCanvas.width,
      y: ((cy - rect.top) / rect.height) * scratchpadCanvas.height,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    scratchpadCtx.beginPath();
    scratchpadCtx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    scratchpadCtx.lineCap = "round";
    scratchpadCtx.lineJoin = "round";
    if (isEraser) {
      scratchpadCtx.strokeStyle = "#ffffff";
      scratchpadCtx.lineWidth = 18;
    } else {
      scratchpadCtx.strokeStyle = scratchpadColor;
      scratchpadCtx.lineWidth = 3.5;
    }
    scratchpadCtx.lineTo(pos.x, pos.y);
    scratchpadCtx.stroke();
  }

  function stopDraw() {
    if (isDrawing) {
      isDrawing = false;
      scratchpadCtx.closePath();
    }
  }

  scratchpadCanvas.addEventListener("pointerdown", startDraw);
  scratchpadCanvas.addEventListener("pointermove", draw);
  scratchpadCanvas.addEventListener("pointerup", stopDraw);
  scratchpadCanvas.addEventListener("pointercancel", stopDraw);
  scratchpadCanvas.addEventListener("pointerleave", stopDraw);
}

function toggleScratchpad() {
  const wrap = document.getElementById("hw_scratchpad_wrapper");
  if (!wrap) return;
  const isHidden = wrap.hidden;
  wrap.hidden = !isHidden;
  if (!wrap.hidden) {
    if (!scratchpadCtx) initScratchpad();
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function setScratchpadColor(color, btn) {
  scratchpadColor = color;
  isEraser = false;
  document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const eraserBtn = document.getElementById("scratchpad_eraser_btn");
  if (eraserBtn) eraserBtn.classList.remove("is-active");
}

function toggleScratchpadEraser() {
  isEraser = !isEraser;
  const eraserBtn = document.getElementById("scratchpad_eraser_btn");
  if (eraserBtn) eraserBtn.classList.toggle("is-active", isEraser);
  if (isEraser) {
    document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("is-active"));
  } else {
    const defaultDot = document.querySelector('.color-dot[data-color="' + scratchpadColor + '"]');
    if (defaultDot) defaultDot.classList.add("is-active");
  }
}

function clearScratchpad() {
  if (!scratchpadCanvas || !scratchpadCtx) return;
  scratchpadCtx.clearRect(0, 0, scratchpadCanvas.width, scratchpadCanvas.height);
}

// Celebration & High-Five Engine
function triggerHighFive() {
  if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 90);
  if (typeof playSuccessArpeggio === "function") playSuccessArpeggio();
  const btn = document.querySelector(".btn-high-five");
  if (btn) {
    btn.classList.add("is-celebrating");
    setTimeout(() => btn.classList.remove("is-celebrating"), 1000);
  }
}

function updateCelebrationTab() {
  // Read from the Done stop, so the Check panel itself is hidden: only a
  // hidden ancestor OTHER than a tab panel (the route's unused tier) excludes.
  const hiddenBelowPanel = (el) => {
    for (let n = el; n && !n.matches("[data-tab-panel]"); n = n.parentElement) {
      if (n.hidden) return true;
    }
    return false;
  };
  const problems = Array.from(document.querySelectorAll(".problem-section")).filter(
    (s) => !s.closest(".more-practice") && !hiddenBelowPanel(s),
  );
  const correctCount = problems.filter((s) => s.classList.contains("correct") || s.classList.contains("reviewed")).length;
  const practiceGoal = Math.min(
    3,
    typeof activeHomeworkRoute === "function" ? activeHomeworkRoute().problemLimit : 3,
  );

  const bLearn = document.getElementById("badge_achieve_learn");
  const bVocab = document.getElementById("badge_achieve_vocab");
  const bPractice = document.getElementById("badge_achieve_practice");
  const bArcade = document.getElementById("badge_achieve_arcade");
  const bMission = document.getElementById("badge_achieve_mission");

  if (bLearn) bLearn.classList.add("is-unlocked");
  // Game Master is earned on the Play stop, not handed out on arrival.
  try {
    const journey = JSON.parse(localStorage.getItem("hw_journey_" + (window.LESSON_ID || location.pathname)) || "{}");
    if (bArcade && journey.play) bArcade.classList.add("is-unlocked");
  } catch (e) {}

  /* Say how much is actually done. "Finished for today" and a badge shelf
     appeared at 2/6 exactly as at 6/6. */
  const summary = document.getElementById("hw_done_summary");
  if (summary) {
    const total = problems.length;
    const left = total - correctCount;
    if (total && left <= 0) {
      summary.className = "done-summary is-complete";
      summary.innerHTML = '<span class="lang-en">✓ All ' + total + ' problems checked. Great work tonight!</span><span class="lang-es" lang="es">✓ Revisaste los ' + total + ' problemas. ¡Buen trabajo hoy!</span>';
    } else if (total) {
      summary.className = "done-summary is-partial";
      summary.innerHTML = '<span class="lang-en">You checked ' + correctCount + ' of ' + total + ' problems. ' + left + ' left to finish.</span><span class="lang-es" lang="es">Revisaste ' + correctCount + ' de ' + total + ' problemas. Faltan ' + left + '.</span>' +
        '<br><button type="button" class="btn btn-secondary" onclick="switchHomeworkTab(&#39;check&#39;)"><span class="lang-en">Back to the problems</span><span class="lang-es" lang="es">Volver a los problemas</span></button>';
    }
  }
  if (bPractice && correctCount >= practiceGoal) bPractice.classList.add("is-unlocked");
  try {
    if (bVocab && localStorage.getItem(STORAGE_KEY + "_vocab_won")) {
      bVocab.classList.add("is-unlocked");
    }
    if (bMission && localStorage.getItem("hw_family_mission_" + (window.LESSON_ID || location.pathname)) !== null) {
      bMission.classList.add("is-unlocked");
    }
  } catch (e) {}

  if (correctCount >= practiceGoal) {
    if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 60);
  }
}

function updateCertStudentName(val) {
  try {
    localStorage.setItem(STORAGE_KEY + "_student_name", val);
  } catch (e) {}
}

function playSuccessArpeggio() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 major chord
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.1);

      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.35);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playFailureSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const freqs = [180, 140]; // Two low warning blips
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now + i * 0.12);

      gain.gain.setValueAtTime(0.08, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Drag & Drop engine
function allowDrop(ev) {
  ev.preventDefault();
  const zone = ev.currentTarget;
  if (zone && zone.classList) {
    zone.classList.add("over");
  }
}

function handleDragStart(ev) {
  const card = ev.currentTarget.closest(".drag-card");
  if (!card) return;
  ev.dataTransfer.setData("text/plain", card.id);
  ev.dataTransfer.effectAllowed = "move";
  card.classList.add("dragging");
}

function handleDragEnd(ev) {
  const el = ev.currentTarget;
  if (el) el.classList.remove("dragging");
  clearDragOver();
}

function clearDragOver() {
  document.querySelectorAll(".drag-column.over, .drag-source-pile.over, .drag-column-slots.over")
    .forEach((el) => el.classList.remove("over"));
}

function handleDrop(ev, probIdx, categoryId) {
  ev.preventDefault();
  clearDragOver();
  const cardId = ev.dataTransfer.getData("text/plain") || ev.dataTransfer.getData("text");
  const card = document.getElementById(cardId);
  if (!card) return;

  document.querySelectorAll(".drag-card.dragging").forEach((el) => el.classList.remove("dragging"));

  const prefix = "card_" + probIdx + "_";
  if (!card.id.startsWith(prefix)) return;

  let targetContainer;
  if (categoryId) {
    targetContainer = document.getElementById("slots_" + probIdx + "_" + categoryId);
  } else {
    targetContainer = document.getElementById("pile_" + probIdx);
  }

  if (targetContainer) {
    targetContainer.appendChild(card);
    const select = card.querySelector(".mobile-cat-select");
    if (select) select.value = categoryId || "";
    saveState();
    updateProgress();
  }
}

function handleOrderDragStart(ev) {
  const row = ev.currentTarget.closest(".drag-order-row");
  if (!row) return;
  ev.dataTransfer.setData("text/plain", row.id);
  ev.dataTransfer.effectAllowed = "move";
  row.classList.add("dragging");
}

function handleOrderDrop(ev, probIdx) {
  ev.preventDefault();
  const list = document.getElementById("orderlist_" + probIdx);
  const rowId = ev.dataTransfer.getData("text/plain") || ev.dataTransfer.getData("text");
  const row = document.getElementById(rowId);
  if (!list || !row || !row.id.startsWith("order_" + probIdx + "_")) return;
  document.querySelectorAll(".drag-order-row.dragging").forEach((el) => el.classList.remove("dragging"));

  const afterEl = getOrderInsertBefore(list, ev.clientY);
  if (afterEl) {
    list.insertBefore(row, afterEl);
  } else {
    list.appendChild(row);
  }
  renumberOrderRows(probIdx);
  saveState();
  updateProgress();
}

function getOrderInsertBefore(list, clientY) {
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  for (const child of rows) {
    const box = child.getBoundingClientRect();
    if (clientY < box.top + box.height / 2) return child;
  }
  return null;
}

function moveOrderRowByEl(probIdx, btn, direction) {
  const row = btn.closest(".drag-order-row");
  const list = document.getElementById("orderlist_" + probIdx);
  if (!row || !list) return;
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  const rowIdx = rows.indexOf(row);
  const nextIdx = rowIdx + direction;
  if (nextIdx < 0 || nextIdx >= rows.length) return;
  const neighbor = rows[nextIdx];
  if (direction < 0) {
    list.insertBefore(row, neighbor);
  } else {
    list.insertBefore(neighbor, row.nextSibling);
  }
  renumberOrderRows(probIdx);
  saveState();
  updateProgress();
}

function renumberOrderRows(probIdx) {
  const list = document.getElementById("orderlist_" + probIdx);
  if (!list) return;
  list.querySelectorAll(".drag-order-row").forEach((row, idx) => {
    const num = row.querySelector(".drag-order-num");
    if (num) num.textContent = String(idx + 1);
  });
}

function restoreOrderList(probIdx, order) {
  const list = document.getElementById("orderlist_" + probIdx);
  if (!list || !Array.isArray(order)) return;
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  const byText = new Map(rows.map((row) => [row.dataset.stepText, row]));
  list.innerHTML = "";
  order.forEach((text) => {
    const row = byText.get(text);
    if (row) {
      list.appendChild(row);
      row.classList.remove("is-correct", "is-incorrect");
    }
  });
  rows.forEach((row) => {
    if (!list.contains(row)) list.appendChild(row);
  });
  renumberOrderRows(probIdx);
}

function resetDragOrder(probIdx) {
  const workspace = document.getElementById("dragorder_" + probIdx);
  if (!workspace) return;
  let initial = [];
  try {
    initial = JSON.parse(workspace.dataset.initialOrder || "[]");
  } catch (e) {
    initial = [];
  }
  if (!initial.length) {
    shuffleOrderRows(probIdx);
  } else {
    restoreOrderList(probIdx, initial);
  }
  const pCard = document.getElementById("problem_" + probIdx);
  if (pCard) pCard.classList.remove("correct", "incorrect", "reviewed");
}

function shuffleOrderRows(probIdx) {
  const list = document.getElementById("orderlist_" + probIdx);
  if (!list) return;
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  if (rows.length < 2) return;
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  list.innerHTML = "";
  rows.forEach((row) => list.appendChild(row));
  if (rows.every((row, idx) => row.dataset.stepText === JSON.parse(document.getElementById("dragorder_" + probIdx).dataset.correctOrder || "[]")[idx])) {
    const last = rows.pop();
    rows.unshift(last);
    list.innerHTML = "";
    rows.forEach((row) => list.appendChild(row));
  }
  renumberOrderRows(probIdx);
}

function mobileMoveCard(select, cardId, probIdx) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const categoryId = select.value;
  let targetContainer;
  if (categoryId) {
    targetContainer = document.getElementById("slots_" + probIdx + "_" + categoryId);
  } else {
    targetContainer = document.getElementById("pile_" + probIdx);
  }
  if (targetContainer) {
    targetContainer.appendChild(card);
  }
}

function resetDragSort(probIdx) {
  const pile = document.getElementById("pile_" + probIdx);
  const slots = document.querySelectorAll("[id^='slots_" + probIdx + "_']");
  slots.forEach(slot => {
    const cards = Array.from(slot.children);
    cards.forEach(card => {
      pile.appendChild(card);
      const select = card.querySelector(".mobile-cat-select");
      if (select) select.value = "";
    });
  });

  // Clean all validation classes on items of this problem
  const allCards = pile.querySelectorAll(".drag-card");
  allCards.forEach(card => {
    card.classList.remove("is-correct", "is-incorrect");
  });

  const pCard = document.getElementById("problem_" + probIdx);
  if (pCard) pCard.classList.remove("correct", "incorrect", "reviewed");
}

// Open Response Word chip inserters
function insertWord(probIdx, word) {
  const textarea = document.getElementById("open_response_" + probIdx);
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const before = text.substring(0, start);
  const after = text.substring(end, text.length);

  // Insert word with trailing space
  textarea.value = before + (start > 0 && text[start - 1] !== " " ? " " : "") + word + " " + after;
  textarea.focus();

  // Move cursor after the inserted word
  const newPos = start + (start > 0 && text[start - 1] !== " " ? 1 : 0) + word.length + 1;
  textarea.setSelectionRange(newPos, newPos);

  saveState();
  updateProgress();
}

function insertSentenceStarter(probIdx, starter) {
  const textarea = document.getElementById("open_response_" + probIdx);
  if (!textarea) return;
  if (textarea.value.trim() === "") {
    textarea.value = starter + " ";
  } else {
    // Append at end if not empty
    textarea.value = textarea.value.trim() + " " + starter + " ";
  }
  textarea.focus();
  const len = textarea.value.length;
  textarea.setSelectionRange(len, len);
  saveState();
  updateProgress();
}

// State Persistence (localStorage)
const STORAGE_KEY = "hw_state_lesson_" + window.LESSON_ID;

function saveState() {
  const state = {
    inputs: {},
    dragPositions: {},
    orderPositions: {}
  };

  // Save text inputs, select dropdowns, textareas, and radios
  const inputs = document.querySelectorAll(".custom-input, .custom-select, .custom-textarea, input[type='radio']:checked");
  inputs.forEach(input => {
    if (input.type === "radio") {
      state.inputs[input.name] = input.value;
    } else {
      state.inputs[input.name || input.id] = input.value;
    }
  });

  const studentNameInput = document.getElementById("student_name_input");
  if (studentNameInput && studentNameInput.value) {
    state.studentName = studentNameInput.value;
  }
  state.currentStreak = currentStreak;

  // Save drag-sort item locations
  const dragCards = document.querySelectorAll(".drag-card");
  dragCards.forEach(card => {
    const parentContainer = card.parentElement;
    if (parentContainer) {
      state.dragPositions[card.id] = parentContainer.id;
    }
  });

  document.querySelectorAll(".drag-order-list").forEach((list) => {
    const probIdx = list.id.replace("orderlist_", "");
    state.orderPositions[probIdx] = Array.from(list.querySelectorAll(".drag-order-row")).map((row) => row.dataset.stepText);
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);

    // Restore text inputs, selects, textareas
    if (state.inputs) {
      for (const [id, val] of Object.entries(state.inputs)) {
        const input = document.getElementById(id) || document.querySelector("[name='" + id + "']");
        if (input) {
          if (input.type === "radio") {
            const rad = document.querySelector("input[name='" + id + "'][value='" + val + "']");
            if (rad) rad.checked = true;
          } else {
            input.value = val;
          }
        }
      }
    }

    // Restored ladder choices answer back again.
    document.querySelectorAll(".ladder-choices input:checked").forEach((i) => checkLadderChoice(i, true));

    if (state.studentName) {
      const studentNameInput = document.getElementById("student_name_input");
      if (studentNameInput) studentNameInput.value = state.studentName;
    }
    if (typeof state.currentStreak === "number") {
      currentStreak = state.currentStreak;
      const streakBanner = document.getElementById("hw_streak_banner");
      const streakCount = document.getElementById("hw_streak_count");
      const streakCountEs = document.getElementById("hw_streak_count_es");
      if (streakBanner && streakCount && currentStreak >= 2) {
        streakCount.textContent = currentStreak;
        if (streakCountEs) streakCountEs.textContent = currentStreak;
        streakBanner.hidden = false;
      }
    }
    try {
      if (localStorage.getItem(STORAGE_KEY + "_powerup_solved") === "1") {
        const badge = document.getElementById("tab_badge_learn");
        if (badge) badge.textContent = "★";
        const btn = document.querySelector(".powerup-choice-btn[data-is-correct='true']");
        if (btn) btn.classList.add("is-correct");
        const starBadge = document.getElementById("powerup_star_badge");
        if (starBadge) {
          starBadge.classList.add("is-unlocked");
          starBadge.innerHTML = '<span class="lang-en">★ Earned!</span><span class="lang-es" lang="es">★ ¡Ganada!</span>';
        }
      }
      if (localStorage.getItem(STORAGE_KEY + "_vocab_won") === "1") {
        const badge = document.getElementById("tab_badge_words");
        if (badge) badge.textContent = "★";
      }
      document.querySelectorAll(".vocab-master-toggle").forEach((btn) => {
        const idx = btn.dataset.termIdx;
        if (localStorage.getItem(STORAGE_KEY + "_vocab_mastered_" + idx) === "1" || localStorage.getItem(STORAGE_KEY + "_vocab_known_" + idx) === "1") {
          btn.classList.add("is-mastered");
          const card = document.getElementById("vocab_card_" + idx);
          if (card) card.classList.add("is-known");
        }
      });
    } catch(e) {}

    // Restore drag card positions
    if (state.dragPositions) {
      for (const [cardId, parentId] of Object.entries(state.dragPositions)) {
        const card = document.getElementById(cardId);
        const parent = document.getElementById(parentId);
        if (card && parent) {
          parent.appendChild(card);
          const select = card.querySelector(".mobile-cat-select");
          if (select) {
            const parts = parentId.split("_");
            if (parts.length >= 3 && parts[0] === "slots") {
              select.value = parts.slice(2).join("_");
            } else {
              select.value = "";
            }
          }
        }
      }
    }

    if (state.orderPositions) {
      for (const [probIdx, order] of Object.entries(state.orderPositions)) {
        const list = document.getElementById("orderlist_" + probIdx);
        if (!list || !Array.isArray(order)) continue;
        const rows = Array.from(list.querySelectorAll(".drag-order-row"));
        const byText = new Map(rows.map((row) => [row.dataset.stepText, row]));
        list.innerHTML = "";
        order.forEach((text) => {
          const row = byText.get(text);
          if (row) list.appendChild(row);
        });
        rows.forEach((row) => {
          if (!list.contains(row)) list.appendChild(row);
        });
        renumberOrderRows(probIdx);
      }
    }
  } catch (e) {
    console.error("Error restoring state:", e);
  }
}

// ── Shared answer matcher — generated from engine/core/answer-match.js.
// Do not edit here; edit that file and re-run the generator that emits it.
var NTAnswerMatch = (function () {
  // Single source of truth for student answer checking across the whole site —
  // lesson skill practice, Connect-check blanks, fill-in tables, homework pages,
  // and the small-group studio. Tolerant of the ways grade-6 students actually
  // type math: $ and comma formatting, fractions ("3/4"), mixed numbers
  // ("1 1/2"), × vs x, an optional variable label ("m = 4" and "4" are the same
  // answer), and optional trailing units ("24 sq. ft." and "24" are the same
  // answer) — while never crediting a bare number against a non-numeric answer
  // like "2 × 3 × 7".
  //
  // The rule this file encodes: a student is assessed on the VALUE they found,
  // not on the bookkeeping around it. Naming the variable and labelling the unit
  // are good habits worth suggesting, but they must never turn a correct answer
  // into a red X.

  const norm = (value) =>
    String(value ?? "")
      .toLowerCase()
      .trim()
      // Strip accents so "área" and "area" match. NFD (canonical) only — NFKD
      // would fold a superscript power like 2^3 into "23" and let a student's
      // "23" match it. (Powers are written out here rather than as glyphs: this
      // file is inlined into every homework page, and audit:homework reads a
      // literal superscript as "this page shows an exponents visual".)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[×·*]/g, "x")
      // Division was the one operation whose two spellings did NOT unify: "84/21"
      // normalised to "84/21" and "84 ÷ 21" stayed "84 ÷ 21", so a student who
      // typed the symbol on their keyboard instead of the one in the lesson was
      // marked wrong. Words are folded for the same reason (Joel, 2026-08-23:
      // "I don't want the tables to be so strict throughout").
      .replace(/÷/g, "/")
      .replace(/\bdivided by\b/g, "/")
      .replace(/\btimes\b/g, "x")
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/[.,;:]+$/, "")
      .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
      .replace(/\s*([x+\-=:/(),<>≤≥])\s*/g, "$1")
      .replace(/(\d)\s*r\s*(\d)/g, "$1r$2");

  // Strict full-string numeric parse: mixed number, fraction, or plain number
  // (with optional $ prefix / % suffix). Returns null for anything else — a
  // stem like "x + 2 = 4" must never collapse to its first digit.
  const numberOf = (value) => {
    const text = String(value ?? "")
      .replace(/[$,]/g, "")
      .replace(/%\s*$/, "")
      .trim();
    const mixed = text.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      const denominator = Number(mixed[4]);
      if (!denominator) return null;
      const sign = mixed[1] === "-" ? -1 : 1;
      return sign * (Number(mixed[2]) + Number(mixed[3]) / denominator);
    }
    const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
    // Accept ".5" as well as "0.5" — students drop the leading zero constantly.
    const plain = text.match(/^-?(?:\d+(?:\.\d+)?|\.\d+)$/);
    return plain ? Number.parseFloat(plain[0]) : null;
  };

  // "m = 4", "m=4", "m is 4", "4 = m" and "4" are the same answer: the variable
  // label restates the question, it is not the thing being assessed. ONLY "="
  // is stripped — an inequality ("x > 5") keeps its relation, because there a
  // bare "5" really is an incomplete answer. A multi-character left side
  // ("3x = 12") is left alone: that is an equation, not a labelled value.
  const LABEL_LEADING = /^([a-z][a-z0-9]?)\s*(?:=|\bis\b)\s*(.+)$/i;
  const LABEL_TRAILING = /^(.+?)\s*=\s*([a-z][a-z0-9]?)$/i;

  const stripLabel = (value) => {
    const text = String(value ?? "").trim();
    const leading = text.match(LABEL_LEADING);
    if (leading) return leading[2].trim();
    const trailing = text.match(LABEL_TRAILING);
    if (trailing) return trailing[1].trim();
    return text;
  };

  // Units and labels are optional on both sides. "24", "24 sq. ft.",
  // "24 square feet" and "24 boxes" are the same answer. The tail is only
  // dropped when it contains a letter AND a number is left behind, so a power
  // like 2^3 written with a superscript (no letter in the tail) and a word
  // answer like "quotient" (nothing left) are never hollowed out.
  const UNIT_TAIL = /[a-z°²³.\s/]+$/i;

  // "24 sq. ft." → "24". Returns the input unchanged when there is no unit to
  // drop, so it is safe to run over any answer.
  const stripUnit = (value) => {
    const text = String(value ?? "").trim();
    if (numberOf(text) != null) return text;
    const tail = text.match(UNIT_TAIL);
    if (!tail || !/[a-z]/i.test(tail[0])) return text;
    const head = text.slice(0, text.length - tail[0].length).trim();
    return head && numberOf(head) != null ? head : text;
  };

  const numericValue = (value) => numberOf(stripUnit(value));

  /* ── Phrasing ────────────────────────────────────────────────────────────────
     An answer that DESCRIBES a move has no single spelling: "Divide both sides
     by 3", "divide by 3" and "÷ 3" are one answer. phraseKey reduces such an
     answer to what it actually names — the operation and the number — with
     filler words and word order dropped.

     Word order has to be dropped for this to work at all, and dropping it is
     only safe while there is nothing for the order to mean. So the layer is
     refused the moment either side names TWO numbers: "56 ÷ 8" and "8 ÷ 56" are
     different answers, and no amount of flexibility may say otherwise. */

  const PHRASE_FILLER = new Set([
    "a",
    "an",
    "the",
    "and",
    "then",
    "so",
    "is",
    "are",
    "be",
    "to",
    "of",
    "it",
    "by",
    "on",
    "in",
    "with",
    "for",
    "each",
    "every",
    "both",
    "side",
    "sides",
    "step",
    "steps",
    "we",
    "i",
    "you",
    "my",
    "your",
    "answer",
    "value",
    "number",
    "equation",
    "problem",
    "result",
    "over",
    "use",
    "using",
    "same",
    "get",
  ]);

  const PHRASE_OPERATIONS = [
    [/\/|\bdividing\b|\bdivide\b|\bdivision\b/g, " divide "],
    // norm() has already folded × · * into "x" AND closed the spaces around it,
    // so "× 4" arrives as "x4" and "3 × 4" as "3x4". Read that x as multiply only
    // where a digit follows it; a trailing x ("3x = 12") is the variable and must
    // survive, or a coefficient would be torn off its term.
    [
      /(?<=\d)x(?=\d)|(?<=\s)x(?=\d)|(?<=\s)x(?=\s)|\bmultiplying\b|\bmultiply\b|\bmultiplication\b/g,
      " multiply ",
    ],
    [/\+|\badding\b|\badd\b|\baddition\b/g, " add "],
    [/\bsubtracting\b|\bsubtract\b|\bsubtraction\b/g, " subtract "],
  ];

  const NUMBER_WORDS = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    eleven: "11",
    twelve: "12",
  };

  function phraseKey(value) {
    // NOTE: no template literals anywhere in this file — it is inlined verbatim
    // into homework HTML inside one (scripts/homework-answer-match.mjs).
    let text = " " + norm(value) + " ";
    for (const [pattern, word] of PHRASE_OPERATIONS) text = text.replace(pattern, word);
    const tokens = text
      .split(/[^a-z0-9.]+/)
      .map((token) => NUMBER_WORDS[token] || token)
      .filter((token) => token && !PHRASE_FILLER.has(token));
    return tokens.sort().join("|");
  }

  /** How many distinct numbers a phrase names — the guard on word order above. */
  function numberCount(key) {
    return new Set(key.split("|").filter((token) => /^\d/.test(token))).size;
  }

  function phraseMatches(typed, answer) {
    // This layer exists for an answer that DESCRIBES a move in words. An answer
    // with no letters in it is notation, not description, and notation is already
    // handled by norm() — running it through a token bag can only lose
    // information. It did: phraseKey drops characters it has no token for, so
    // a power written with a superscript glyph reduced to its base, and 2^3 was
    // answered by 2. (Powers are written 2^3 here: audit:homework reads a literal
    // superscript in this file as "this page shows an exponents visual".)
    if (!/[a-z]/i.test(String(answer ?? ""))) return false;
    const answerKey = phraseKey(answer);
    const typedKey = phraseKey(typed);
    if (!answerKey || answerKey !== typedKey) return false;
    // Must name an operation — otherwise this is free prose, and two different
    // explanations built from the same words would compare equal.
    if (!/divide|multiply|add|subtract/.test(answerKey)) return false;
    return numberCount(answerKey) <= 1;
  }

  /* ── Either half of a stated equation ────────────────────────────────────────
     Work authored as "3x ÷ 3 = 21 ÷ 3" states the SAME move on both sides; a
     student who writes only the half that does the arithmetic has answered it.
     A half with no digit in it is refused, so "x = 7" is never answered by "x". */
  function equationHalves(value) {
    const text = String(value ?? "").trim();
    if (!text.includes("=")) return [];
    return text
      .split("=")
      .map((part) => part.trim())
      .filter((part) => part && /\d/.test(part));
  }

  function matchesOne(typed, answer) {
    if (answer == null) return false;
    if (norm(typed) === norm(answer)) return true;
    const typedCore = stripLabel(typed);
    const answerCore = stripLabel(answer);
    if (norm(typedCore) === norm(answerCore)) return true;
    if (phraseMatches(typed, answer)) return true;
    // Only the halves of the ANSWER are opened up. Splitting what the STUDENT
    // typed would credit "7 = 8" against 7.
    for (const half of equationHalves(answer)) {
      if (norm(typed) === norm(half)) return true;
      if (norm(typedCore) === norm(stripLabel(half))) return true;
    }
    const target = numericValue(answerCore);
    if (target == null) return false;
    const value = numericValue(typedCore);
    return value != null && Math.abs(value - target) < 1e-9;
  }

  // "answer" may be a single accepted form or an array of equivalent forms.
  function isRight(input, answer) {
    if (answer == null) return false;
    if (!String(input ?? "").trim()) return false;
    const accepted = Array.isArray(answer) ? answer : [answer];
    return accepted.some((one) => matchesOne(input, one));
  }

  // The fuller authored form ("m = 4", "24 sq. ft.") when the student's own
  // correct answer left the label or unit off. Callers use this to SUGGEST the
  // fuller form after crediting the answer — never to withhold credit. Returns
  // null when there is nothing extra worth showing.
  function fullerFormHint(input, answer) {
    const accepted = Array.isArray(answer) ? answer : [answer];
    const shown = accepted.find((a) => a != null && String(a).trim());
    if (shown == null) return null;
    const text = String(shown).trim();
    if (norm(input) === norm(text)) return null;
    // Only worth showing when the authored form adds a variable label or a unit
    // to a value the student already got right.
    const core = stripLabel(text);
    const addsLabel = core !== text;
    const addsUnit = numberOf(core) == null && numericValue(core) != null;
    return addsLabel || addsUnit ? text : null;
  }


  const sharedIsRight = isRight;
  const comparisonSymbols = (value) => String(value ?? "")
    .replace(/>=/g, "≥").replace(/<=/g, "≤");
  function simpleComparison(value) {
    const text = norm(comparisonSymbols(value));
    const parts = text.match(/^(.+?)([<>≤≥])(.+)$/);
    if (!parts) return null;
    const [, left, operator, right] = parts;
    const variable = /^[a-z][a-z0-9]?$/;
    const leftNumber = numericValue(left), rightNumber = numericValue(right);
    if (variable.test(left) && rightNumber != null) {
      return { variable: left, operator, boundary: rightNumber };
    }
    if (variable.test(right) && leftNumber != null) {
      return { variable: right, operator: {">":"<", "<":">", "≥":"≤", "≤":"≥"}[operator], boundary: leftNumber };
    }
    return null;
  }
  function equivalentHomeworkAnswer(input, answer) {
    const typed = comparisonSymbols(input), target = comparisonSymbols(answer);
    if (sharedIsRight(typed, target)) return true;
    const typedComparison = simpleComparison(typed), targetComparison = simpleComparison(target);
    if (typedComparison && targetComparison) {
      return typedComparison.variable === targetComparison.variable &&
        typedComparison.operator === targetComparison.operator &&
        Math.abs(typedComparison.boundary - targetComparison.boundary) < 1e-9;
    }
    // Only treat an authored equality as a numeric equivalence when every
    // side is numeric and equal. Never split or repair the student's input.
    if (!target.includes("=")) return false;
    const values = target.split("=").map((part) => numericValue(stripLabel(part.trim())));
    if (values.length < 2 || values.some((value) => value == null || Math.abs(value - values[0]) >= 1e-9)) return false;
    const studentValue = numericValue(stripLabel(typed));
    return studentValue != null && Math.abs(studentValue - values[0]) < 1e-9;
  }
  isRight = (input, answer) => {
    if (answer == null || !String(input ?? "").trim()) return false;
    return (Array.isArray(answer) ? answer : [answer]).some((value) =>
      value != null && equivalentHomeworkAnswer(input, value));
  };

  return { norm, numberOf, stripLabel, numericValue, isRight, fullerFormHint };
})();

function activeCoreProblems() {
  return Array.from(document.querySelectorAll(".problem-section")).filter(
    (section) =>
      !section.closest(".more-practice") &&
      !section.hidden &&
      !section.closest("[hidden]"),
  );
}

function activeHomeworkGoal() {
  return typeof activeHomeworkRoute === "function"
    ? activeHomeworkRoute().problemLimit
    : window.HW_CORE_COUNT || activeCoreProblems().length;
}

function updateProgress() {
  const problems = activeCoreProblems();
  let completedCount = 0;

  problems.forEach((section, idx) => {
    const type = section.dataset.problemType;
    let hasValue = false;

    if (type === "multiple-choice") {
      const selected = section.querySelector("input[type='radio']:checked");
      if (selected) hasValue = true;
    } else if (type === "matching-game") {
      const selects = Array.from(section.querySelectorAll(".matching-select"));
      const answered = selects.filter(s => s.value !== "");
      if (answered.length > 0) hasValue = true;
    } else if (type === "drag-sort") {
      if (section.dataset.problemSubtype === "drag-order") {
        hasValue = true;
      } else {
        const itemsInColumns = Array.from(section.querySelectorAll(".drag-column-slots .drag-card"));
        if (itemsInColumns.length > 0) hasValue = true;
      }
    } else if (type === "fill-table") {
      const inputs = Array.from(section.querySelectorAll(".table-input"));
      const filled = inputs.filter(i => i.value.trim() !== "");
      if (filled.length > 0) hasValue = true;
    } else if (type === "error-analysis") {
      const sel = section.querySelector(".error-step-select");
      const txt = section.querySelector(".error-explain-textarea");
      if ((sel && sel.value !== "") || (txt && txt.value.trim() !== "")) hasValue = true;
    } else if (type === "open-response") {
      const txt = section.querySelector(".open-response-textarea");
      if (txt && txt.value.trim() !== "") hasValue = true;
    }

    if (hasValue) completedCount++;
  });

  const total = problems.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;
  document.getElementById("progress_bar").style.width = pct + "%";
  // Bare "3 / 6". The word beside it is the label span in the bar, which is
  // language-switched; appending "Completed" here reintroduced English into a
  // Spanish page and wrapped mid-word ("Complete/d") in the 139px bar.
  document.getElementById("progress_text").textContent = completedCount + " / " + total;
}

function setProblemCheckResult(idx, isCorrect, message, tone) {
  const resultEl = document.getElementById("problem_result_" + idx);
  if (!resultEl) return;
  resultEl.textContent = message || "";
  resultEl.className = "problem-check-result";
  if (message) {
    resultEl.classList.add(tone || (isCorrect ? "is-correct" : "is-incorrect"));
  }
}

function playCheckSound(isCorrect) {
  if (isCorrect) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  } else {
    playFailureSound();
  }
}

/* Feedback text is built in JS, so it cannot use the .lang-en/.lang-es span
   pair the rest of the page toggles. Pick the language the family is actually
   reading; fall back to English whenever no Spanish was authored. */
function pickLangText(en, es) {
  const esText = (es || "").trim();
  if (esText && document.body.classList.contains("lang-mode-es")) return esText;
  return en || "";
}


/* A workspace with saved work reopens; printing opens them all so paper
   still has room to work. */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.querySelectorAll(".hw-workspace-toggle").forEach((d) => {
      const work = d.querySelector(".hw-work-input");
      const graph = d.querySelector("[data-graph-state]");
      if ((work && work.value.trim()) || (graph && graph.value)) d.open = true;
    });
  }, 0);
});
window.addEventListener("beforeprint", () => {
  document.querySelectorAll(".hw-workspace-toggle").forEach((d) => { d.open = true; });
});

/* Try Together ladder: a tapped choice answers back at once — green with the
   explanation when right, the authored reason for THAT mistake when not. */
function checkLadderChoice(input, silent) {
  const item = input.closest(".ladder-item");
  if (!item) return;
  const fbEl = item.querySelector(".ladder-feedback");
  item.querySelectorAll(".ladder-choice").forEach((l) => l.classList.remove("is-correct", "is-incorrect"));
  const right = input.dataset.correct === "true";
  input.closest(".ladder-choice")?.classList.add(right ? "is-correct" : "is-incorrect");
  if (fbEl) {
    const why = pickLangText(input.dataset.fb, input.dataset.fbEs);
    fbEl.className = "ladder-feedback " + (right ? "is-correct" : "is-incorrect");
    fbEl.textContent = right
      ? [pickLangText("✓ Yes!", "✓ ¡Sí!"), why].filter(Boolean).join(" ")
      : [pickLangText("Not quite.", "Todavía no."), why || pickLangText("Try another choice.", "Prueba otra opción.")].join(" ");
  }
  if (!silent) saveState();
}


function translateProblemOptions() {
  const es = document.body.classList.contains("lang-mode-es");
  document.querySelectorAll("option[data-text-en]").forEach(option => { option.textContent = es ? option.dataset.textEs : option.dataset.textEn; });
}
new MutationObserver(translateProblemOptions).observe(document.body, { attributes: true, attributeFilter: ["class"] });
document.addEventListener("DOMContentLoaded", translateProblemOptions);

// Speech Rate & Big Idea Narration
let vocabSpeechRate = 0.9;
function toggleVocabSpeed() {
  const btn = document.getElementById("vocab_speed_btn");
  const label = document.getElementById("vocab_speed_label");
  if (vocabSpeechRate === 0.9) {
    vocabSpeechRate = 0.65;
    if (label) label.textContent = "Slow";
  } else {
    vocabSpeechRate = 0.9;
    if (label) label.textContent = "Normal";
  }
}

function speakBigIdea(textEn, textEs) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const isEs = document.body.classList.contains("lang-mode-es");
    const text = isEs && textEs ? textEs : textEn;
    const lang = isEs && textEs ? "es-US" : "en-US";
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = vocabSpeechRate;
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}
window.speakHomeworkText = speakBigIdea;

// Math Talk Prompt Spinner
const mathTalkList = [
  {
    qEn: "Can you show me how you see that in your work or a quick sketch?",
    qEs: "¿Puedes mostrarme cómo ves eso en tu trabajo o en un dibujo rápido?",
    fEn: "Follow-up: Point to where each number from the problem shows up.",
    fEs: "Seguimiento: Señala dónde aparece cada número del problema.",
  },
  {
    qEn: "What would happen if we doubled the numbers in this problem?",
    qEs: "¿Qué pasaría si duplicamos los números de este problema?",
    fEn: "Follow-up: Does the relationship stay the same or change?",
    fEs: "Seguimiento: ¿La relación se mantiene igual o cambia?",
  },
  {
    qEn: "What is another way we could solve or explain this together?",
    qEs: "¿De qué otra forma podríamos resolverlo o explicarlo juntos?",
    fEn: "Follow-up: Can we check it using another model or tool?",
    fEs: "Seguimiento: ¿Podemos comprobarlo usando otra herramienta o modelo?",
  },
  {
    qEn: "How would you explain this step to a 5th grader?",
    qEs: "¿Cómo le explicarías este paso a un estudiante de 5.º grado?",
    fEn: "Follow-up: What vocabulary word makes the explanation clearest?",
    fEs: "Seguimiento: ¿Qué palabra de vocabulario hace más clara la explicación?",
  },
  {
    qEn: "Before we calculate, what is a reasonable estimate for the answer?",
    qEs: "¿Antes de calcular, cuál es una estimación razonable para la respuesta?",
    fEn: "Follow-up: Should the answer be bigger or smaller than the starting numbers?",
    fEs: "Seguimiento: ¿La respuesta debe ser mayor o menor que los números iniciales?",
  }
];
let currentTalkIdx = 0;

function spinMathTalkPrompt() {
  currentTalkIdx = (currentTalkIdx + 1) % mathTalkList.length;
  const item = mathTalkList[currentTalkIdx];
  const qEn = document.getElementById("math_talk_en");
  const qEs = document.getElementById("math_talk_es");
  const fEn = document.getElementById("math_talk_follow_en");
  const fEs = document.getElementById("math_talk_follow_es");
  if (qEn) qEn.textContent = item.qEn;
  if (qEs) qEs.textContent = item.qEs;
  if (fEn) fEn.textContent = item.fEn;
  if (fEs) fEs.textContent = item.fEs;
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
  const card = document.getElementById("math_talk_card");
  if (card) {
    card.classList.add("is-spinning");
    setTimeout(() => card.classList.remove("is-spinning"), 300);
  }
}

// Vocabulary Filter Engine
function filterVocabCards(filter, btn) {
  document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const cards = document.querySelectorAll(".vocab-card");
  cards.forEach(card => {
    const isMastered = card.querySelector(".vocab-master-toggle.is-mastered") !== null;
    if (filter === "all") {
      card.style.display = "";
    } else if (filter === "mastered") {
      card.style.display = isMastered ? "" : "none";
    } else if (filter === "review") {
      card.style.display = isMastered ? "none" : "";
    }
  });
}

// In-Page Workbench Tools
function openTogetherWorkbench(tool) {
  if (typeof switchHomeworkTab === "function") switchHomeworkTab("together");
  const drawer = document.querySelector(".workbench-drawer");
  if (!drawer) return;
  if (drawer) {
    drawer.open = true;
    drawer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const lessonTool = tool || drawer.dataset.workbenchTool || "";
  if (lessonTool && typeof switchWorkbenchTool === "function") {
    switchWorkbenchTool(lessonTool);
  }
}

function workbenchActionButton(labelEn, labelEs) {
  if (!document.querySelector(".workbench-drawer")) return "";
  return '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="openTogetherWorkbench()">' +
    '🧮 <span class="lang-en">' + labelEn + '</span><span class="lang-es" lang="es">' + labelEs + '</span></button>';
}

function switchWorkbenchTool(tool) {
  document.querySelectorAll(".wb-tool-tab").forEach(t => t.classList.remove("is-active"));
  document.querySelectorAll(".wb-panel").forEach(p => p.hidden = true);
  const activeTab = document.getElementById("wb_tab_" + tool);
  const activePanel = document.getElementById("wb_panel_" + tool);
  if (activeTab) activeTab.classList.add("is-active");
  if (activePanel) activePanel.hidden = false;
  if (tool === "coords") drawCoordGrid();
  if (tool === "tapes") updateTapeDiagram();
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
}

function addFractionBar(denom) {
  const stage = document.getElementById("fraction_stage_canvas");
  if (!stage) return;
  const row = document.createElement("div");
  row.className = "fraction-row";
  for (let i = 0; i < denom; i++) {
    const tile = document.createElement("div");
    tile.className = "frac-tile tile-" + denom;
    tile.textContent = "1/" + denom;
    row.appendChild(tile);
  }
  stage.appendChild(row);
  if (typeof playMatchSound === "function") playMatchSound();
}

function clearFractionBars() {
  const stage = document.getElementById("fraction_stage_canvas");
  if (!stage) return;
  stage.innerHTML = '<div class="fraction-row ref-row"><div class="frac-tile tile-1"><span class="lang-en">1 Whole (1.0)</span><span class="lang-es" lang="es">1 Entero (1.0)</span></div></div>';
}

function loadFractionComparison(type) {
  const stage = document.getElementById("fraction_stage_canvas");
  if (!stage) return;
  clearFractionBars();
  if (type === "half") {
    addFractionBar(2);
    addFractionBar(4);
  } else if (type === "third") {
    addFractionBar(3);
    addFractionBar(6);
  } else if (type === "threefourths") {
    addFractionBar(4);
    addFractionBar(8);
  }
  if (typeof playMatchSound === "function") playMatchSound();
}

function drawCoordGrid() {
  const svg = document.getElementById("interactive_coord_svg");
  if (!svg || svg.dataset.drawn) return;
  svg.dataset.drawn = "1";
  let content = "";
  for (let i = -5; i <= 5; i++) {
    const pos = i * 20;
    content += '<line x1="' + pos + '" y1="-100" x2="' + pos + '" y2="100" stroke="#e2e8f0" stroke-width="1" />';
    content += '<line x1="-100" y1="' + pos + '" x2="100" y2="' + pos + '" stroke="#e2e8f0" stroke-width="1" />';
  }
  content += '<line x1="-105" y1="0" x2="105" y2="0" stroke="#1e293b" stroke-width="2" />';
  content += '<line x1="0" y1="-105" x2="0" y2="105" stroke="#1e293b" stroke-width="2" />';
  content += '<circle id="coord_plot_dot" cx="0" cy="0" r="5" fill="#e11d48" />';
  svg.innerHTML = content;
}

function plotCoordPoint(x, y) {
  drawCoordGrid();
  const dot = document.getElementById("coord_plot_dot");
  if (dot) {
    dot.setAttribute("cx", x * 20);
    dot.setAttribute("cy", -y * 20);
  }
  let quad = "Axes";
  let quadEs = "Ejes";
  if (x > 0 && y > 0) { quad = "Quadrant I (+, +)"; quadEs = "Cuadrante I (+, +)"; }
  else if (x < 0 && y > 0) { quad = "Quadrant II (−, +)"; quadEs = "Cuadrante II (−, +)"; }
  else if (x < 0 && y < 0) { quad = "Quadrant III (−, −)"; quadEs = "Cuadrante III (−, −)"; }
  else if (x > 0 && y < 0) { quad = "Quadrant IV (+, −)"; quadEs = "Cuadrante IV (+, −)"; }
  else if (x === 0 && y === 0) { quad = "Origin (0, 0)"; quadEs = "Origen (0, 0)"; }
  const readout = document.getElementById("coord_readout");
  if (readout) {
    readout.innerHTML = "(x: " + x + ", y: " + y + ') — <span class="lang-en">' + quad + '</span><span class="lang-es" lang="es">' + quadEs + "</span>";
  }
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
}

function clickCoordGrid(e) {
  const svg = document.getElementById("interactive_coord_svg");
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  const gridX = Math.round(((rawX / rect.width) * 240 - 120) / 20);
  const gridY = Math.round(-(((rawY / rect.height) * 240 - 120) / 20));
  const clampedX = Math.max(-5, Math.min(5, gridX));
  const clampedY = Math.max(-5, Math.min(5, gridY));
  plotCoordPoint(clampedX, clampedY);
}

function loadRatioPreset(a, b, f) {
  const slA = document.getElementById("tape_slider_a");
  const slB = document.getElementById("tape_slider_b");
  const slF = document.getElementById("tape_slider_factor");
  if (slA) slA.value = a;
  if (slB) slB.value = b;
  if (slF) slF.value = f;
  updateTapeDiagram();
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
}

function loadDecimalPreset(topStr, botStr) {
  const table = document.querySelector(".dec-grid-table tbody");
  if (!table) return;
  const rows = table.querySelectorAll("tr");
  if (rows.length < 2) return;

  function populateRow(row, valStr) {
    const inputs = row.querySelectorAll("input.dg-cell");
    inputs.forEach(inp => inp.value = "");
    const parts = String(valStr).split(".");
    const whole = parts[0] || "";
    const frac = parts[1] || "";
    if (whole.length >= 1) inputs[2].value = whole[whole.length - 1];
    if (whole.length >= 2) inputs[1].value = whole[whole.length - 2];
    if (whole.length >= 3) inputs[0].value = whole[whole.length - 3];
    if (frac.length >= 1) inputs[3].value = frac[0];
    if (frac.length >= 2) inputs[4].value = frac[1];
    if (frac.length >= 3) inputs[5].value = frac[2];
  }

  populateRow(rows[0], topStr);
  populateRow(rows[1], botStr);
  if (typeof playMatchSound === "function") playMatchSound();
}

function updateTapeDiagram() {
  const a = parseInt(document.getElementById("tape_slider_a")?.value || "3", 10);
  const b = parseInt(document.getElementById("tape_slider_b")?.value || "4", 10);
  const f = parseInt(document.getElementById("tape_slider_factor")?.value || "2", 10);
  const valA = document.getElementById("tape_val_a");
  const valB = document.getElementById("tape_val_b");
  const valF = document.getElementById("tape_val_factor");
  if (valA) valA.textContent = a * f + " (" + a + "×" + f + ")";
  if (valB) valB.textContent = b * f + " (" + b + "×" + f + ")";
  if (valF) valF.textContent = "×" + f;

  const render = document.getElementById("tape_diagram_render");
  if (!render) return;
  let html = '<div class="tape-bar-row"><span class="tape-label">Part A (' + (a*f) + '):</span><div class="tape-blocks">';
  for (let i = 0; i < a; i++) html += '<div class="tape-block tape-block-a">' + f + '</div>';
  html += '</div></div><div class="tape-bar-row"><span class="tape-label">Part B (' + (b*f) + '):</span><div class="tape-blocks">';
  for (let j = 0; j < b; j++) html += '<div class="tape-block tape-block-b">' + f + '</div>';
  html += '</div></div>';
  render.innerHTML = html;
}

function setScratchpadGrid(gridType, btn) {
  document.querySelectorAll(".grid-btn").forEach(b => b.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const canvas = document.getElementById("hw_scratchpad_canvas");
  if (!canvas) return;
  canvas.classList.remove("canvas-bg-graph", "canvas-bg-dots");
  if (gridType === "graph") canvas.classList.add("canvas-bg-graph");
  if (gridType === "dots") canvas.classList.add("canvas-bg-dots");
}

function setCertRibbon(theme, btn) {
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const cert = document.querySelector(".print-cert-card");
  if (!cert) return;
  cert.classList.remove("theme-emerald", "theme-sapphire", "theme-ruby");
  if (theme !== "gold") cert.classList.add("theme-" + theme);
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
}

function updateCertParentName(val) {
  const pName = document.getElementById("cert_parent_name");
  if (pName) pName.textContent = val || "Family Coach";
}

function checkProblem(idx, options) {
  const silent = options && options.silent;
  const section = document.getElementById("problem_" + idx);
  if (!section) return { correct: false, message: "" };

  const type = section.dataset.problemType;
  let isProblemCorrect = true;
  let reviewOnly = false;
  let feedbackMessage = "";

  section.classList.remove("correct", "incorrect", "reviewed");
  const explanationBoxes = section.querySelectorAll(".explanation-box, .visual-explanation-card");
  explanationBoxes.forEach((b) => b.remove());

  if (type === "multiple-choice") {
      const container = section.querySelector(".mc-options");
      const selected = container.querySelector("input[type='radio']:checked");
      const correctIdx = container.dataset.correct;
      const explanation = pickLangText(container.dataset.explanation, container.dataset.explanationEs);
      let choiceFeedback = [];
      let choiceFeedbackEs = [];
      try {
        choiceFeedback = JSON.parse(container.dataset.choiceFeedback || "[]");
        choiceFeedbackEs = JSON.parse(container.dataset.choiceFeedbackEs || "[]");
      } catch (e) {
        choiceFeedback = [];
        choiceFeedbackEs = [];
      }

      // Reset radio option styles
      const labels = container.querySelectorAll(".mc-option-label");
      labels.forEach(l => l.classList.remove("is-correct", "is-incorrect"));

      let selectedFeedback = "";
      // A miss only counts as an attempt once an answer is actually chosen —
      // tapping Check on an empty question is not a try, and must not burn the
      // one coaching turn the student gets.
      let firstMiss = false;
      if (!selected) {
        isProblemCorrect = false;
      } else {
        const val = selected.value;
        if (val === correctIdx) {
          // Highlight selected label as correct
          const correctLabel = document.getElementById("label_q_" + idx + "_" + val);
          if (correctLabel) correctLabel.classList.add("is-correct");
        } else {
          isProblemCorrect = false;
          problemAttempts[idx] = (problemAttempts[idx] || 0) + 1;
          firstMiss = !revealIsDue(idx);
          // Highlight selected label as incorrect
          const incorrectLabel = document.getElementById("label_q_" + idx + "_" + val);
          if (incorrectLabel) incorrectLabel.classList.add("is-incorrect");
          // Show where the answer IS only once coaching has had its turn.
          if (!firstMiss) {
            const correctLabel = document.getElementById("label_q_" + idx + "_" + correctIdx);
            if (correctLabel) correctLabel.classList.add("is-correct");
          }
          const fbEn = choiceFeedback[val] || "";
          const fbEs = choiceFeedbackEs[val] || "";
          selectedFeedback = pickLangText(fbEn, fbEs);
        }
      }

      // Append visual explanation if checked
      if (selected) {
        const expDiv = document.createElement("div");
        expDiv.className = "visual-explanation-card explanation-box";
        if (isProblemCorrect) {
          let html = '<div class="exp-header"><span>✅ ' + pickLangText("Solved! How to understand it", "¡Resuelto! Por qué funciona") + '</span></div>';
          if (explanation) {
            html += '<div class="exp-why"><strong>💡 ' + pickLangText("Key Step:", "Paso clave:") + '</strong> ' + explanation + '</div>';
          }
          html += '<div class="exp-coach"><strong>💬 ' + pickLangText("Parent Coach Tip:", "Consejo para el tutor:") + '</strong> ' +
            pickLangText(
              'Ask your student: <em>“In your own words, why does this choice make mathematical sense?”</em>',
              'Pregunta a tu estudiante: <em>“En tus propias palabras, ¿por qué esta opción tiene sentido matemático?”</em>'
            ) + '</div>';
          expDiv.innerHTML = html;
        } else {
          const attempts = problemAttempts[idx] || 1;
          const tier = revealForced[idx] ? 3 : Math.min(3, attempts);

          if (tier === 1) {
            // Tier 1: Clarify & Trap
            expDiv.classList.add("is-nudge");
            let html = '<div class="exp-header"><span>🤔 ' + pickLangText("Hint 1 of 3 — Spot the Trap", "Pista 1 de 3 — Identifica la trampa") + '</span></div>';
            if (selectedFeedback) {
              html += '<div class="exp-trap"><strong>⚠️ ' + pickLangText("Common Trap:", "Trampa común:") + '</strong> ' + selectedFeedback + '</div>';
            } else {
              html += '<div class="exp-trap"><strong>⚠️ ' + pickLangText("Clarify:", "Aclaración:") + '</strong> ' +
                pickLangText("Check what quantity the question asks for and look at your units carefully.", "Revisa qué cantidad pide la pregunta y observa las unidades con atención.") + '</div>';
            }
            html += '<div class="exp-coach"><strong>💬 ' + pickLangText("Parent Coach Tip:", "Consejo para el tutor:") + '</strong> ' +
              pickLangText(
                'Ask your student: <em>“What is this problem asking you to find or compare?”</em> Then try another choice.',
                'Pregunta a tu estudiante: <em>“¿Qué te pide hallar o comparar este problema?”</em> Luego intenta otra opción.'
              ) + '</div>';
            html += '<div class="exp-retry" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;">' +
              '<button type="button" class="btn btn-sm btn-secondary hw-reveal-btn" onclick="forceReveal(' + idx + ')">' +
              '<span class="lang-en">Show me how</span><span class="lang-es" lang="es">Muéstrame cómo</span></button>' +
              workbenchActionButton("Try with tonight's tool", "Probar con la herramienta de hoy") + '</div>';
            expDiv.innerHTML = html;
          } else if (tier === 2) {
            // Tier 2: Strategy Clue & Model
            expDiv.classList.add("is-nudge");
            let html = '<div class="exp-header"><span>💡 ' + pickLangText("Hint 2 of 3 — Strategy & Math Clue", "Pista 2 de 3 — Estrategia y pista matemática") + '</span></div>';
            if (selectedFeedback) {
              html += '<div class="exp-trap"><strong>⚠️ ' + pickLangText("Remember:", "Recuerda:") + '</strong> ' + selectedFeedback + '</div>';
            }
            html += '<div class="exp-why"><strong>🎯 ' + pickLangText("Strategy Clue:", "Pista de estrategia:") + '</strong> ' +
              pickLangText(
                'Look at the relationship between the quantities. Can you write a fraction or divide Top ÷ Bottom to test the numbers?',
                'Observa la relación entre las cantidades. ¿Puedes escribir una fracción o dividir Arriba ÷ Abajo para probar los números?'
              ) + '</div>';
            html += '<div class="exp-coach"><strong>💬 ' + pickLangText("Parent Coach Tip:", "Consejo para el tutor:") + '</strong> ' +
              pickLangText(
                'Ask: <em>“Which number goes on top, and which goes on bottom?”</em> or use the Math Tools workbench below.',
                'Pregunta: <em>“¿Qué número va arriba y cuál va abajo?”</em> o usa las herramientas de matemáticas abajo.'
              ) + '</div>';
            html += '<div class="exp-retry" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;">' +
              '<button type="button" class="btn btn-sm btn-secondary hw-reveal-btn" onclick="forceReveal(' + idx + ')">' +
              '<span class="lang-en">Show me how</span><span class="lang-es" lang="es">Muéstrame cómo</span></button>' +
              workbenchActionButton("Open tonight's tool", "Abrir la herramienta de hoy") + '</div>';
            expDiv.innerHTML = html;
          } else {
            // Tier 3: Full Step-by-Step Walkthrough
            let html = '<div class="exp-header"><span>🔍 ' + pickLangText("Hint 3 of 3 — Step-by-Step Walkthrough", "Pista 3 de 3 — Repaso visual paso a paso") + '</span></div>';
            if (selectedFeedback) {
              html += '<div class="exp-trap"><strong>⚠️ ' + pickLangText("Trap to avoid:", "Trampa a evitar:") + '</strong> ' + selectedFeedback + '</div>';
            }
            if (explanation) {
              html += '<div class="exp-why"><strong>💡 ' + pickLangText("Key Step & Solution:", "Paso clave y solución:") + '</strong> ' + explanation + '</div>';
            }
            html += '<div class="exp-coach"><strong>💬 ' + pickLangText("Parent Coach Tip:", "Consejo para el tutor:") + '</strong> ' +
              pickLangText(
                'Ask your student: <em>“In your own words, how does the highlighted green answer solve the problem?”</em>',
                'Pregunta a tu estudiante: <em>“En tus propias palabras, ¿cómo la respuesta verde destacada resuelve el problema?”</em>'
              ) + '</div>';
            const workbenchButton = workbenchActionButton("Model with tonight's tool", "Modelar con la herramienta de hoy");
            if (workbenchButton) html += '<div class="exp-tool" style="margin-top:8px;">' + workbenchButton + '</div>';
            expDiv.innerHTML = html;
          }
        }
        container.appendChild(expDiv);
      }

    } else if (type === "matching-game") {
      const rows = section.querySelectorAll(".matching-row");

      rows.forEach(row => {
        const select = row.querySelector(".matching-select");
        const correct = row.dataset.correct;
        const feedbackBadge = row.querySelector(".feedback-badge");

        select.classList.remove("is-correct", "is-incorrect");
        feedbackBadge.className = "feedback-badge";

        if (select.value === "") {
          isProblemCorrect = false;
          select.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        } else if (select.value === correct) {
          select.classList.add("is-correct");
          feedbackBadge.classList.add("success-check");
        } else {
          isProblemCorrect = false;
          select.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        }
      });

    } else if (type === "drag-sort") {
      if (section.dataset.problemSubtype === "drag-order") {
        const workspace = section.querySelector(".drag-order-workspace");
        const list = section.querySelector(".drag-order-list");
        let correct = [];
        try {
          correct = JSON.parse(workspace?.dataset.correctOrder || "[]");
        } catch (e) {
          correct = [];
        }
        const rows = Array.from(list?.querySelectorAll(".drag-order-row") || []);
        rows.forEach((row, i) => {
          row.classList.remove("is-correct", "is-incorrect");
          if (row.dataset.stepText === correct[i]) {
            row.classList.add("is-correct");
          } else {
            isProblemCorrect = false;
            row.classList.add("is-incorrect");
          }
        });
      } else {
        const dragCards = section.querySelectorAll(".drag-card");

        dragCards.forEach(card => {
          card.classList.remove("is-correct", "is-incorrect");
          const correctCat = card.dataset.correctCategory;
          const parentCol = card.parentElement;

          const column = card.closest(".drag-column");
          if (column) {
            const actualCat = column.dataset.categoryId;
            if (actualCat === correctCat) {
              card.classList.add("is-correct");
            } else {
              isProblemCorrect = false;
              card.classList.add("is-incorrect");
            }
          } else {
            isProblemCorrect = false;
            card.classList.add("is-incorrect");
          }
        });
      }

    } else if (type === "fill-table") {
      const inputs = section.querySelectorAll(".table-input");

      inputs.forEach(input => {
        input.parentElement.querySelector(".table-sample")?.remove();
        if (input.dataset.selfReview === "true" && input.value.trim()) {
          const sample = document.createElement("p"); sample.className = "table-sample";
          sample.textContent = pickLangText("Compare your response with this example: ", "Compara tu respuesta con este ejemplo: ") + pickLangText(input.dataset.correct, input.dataset.correctEs);
          input.parentElement.append(sample);
        }
        input.classList.remove("is-correct", "is-incorrect");
        const wrapper = input.parentElement;
        const feedbackBadge = wrapper.querySelector(".feedback-badge");
        feedbackBadge.className = "feedback-badge";

        const correctVal = input.dataset.correct;
        const studentVal = input.value;

        if (studentVal.trim() === "") {
          isProblemCorrect = false;
          input.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        } else if (input.dataset.selfReview === "true" || NTAnswerMatch.isRight(studentVal, correctVal) || (input.dataset.correctEs && NTAnswerMatch.isRight(studentVal, input.dataset.correctEs))) {
          input.classList.add("is-correct");
          feedbackBadge.classList.add("success-check");
        } else {
          isProblemCorrect = false;
          input.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        }
      });

    } else if (type === "error-analysis") {
      const select = section.querySelector(".error-step-select");
      const textarea = section.querySelector(".error-explain-textarea");
      const revealBox = section.querySelector(".reveal-box");

      // Clean select and textarea validation states
      select.classList.remove("is-correct", "is-incorrect");
      textarea.classList.remove("is-correct", "is-incorrect");

      const selectBadge = select.parentElement.querySelector(".feedback-badge");
      const textareaBadge = textarea.parentElement.querySelector(".feedback-badge");
      selectBadge.className = "feedback-badge";
      textareaBadge.className = "feedback-badge";

      const correctStep = select.dataset.correct;

      // Highlight worked steps inside paper clipboard based on selection
      const workedSteps = section.querySelectorAll(".worked-step");
      workedSteps.forEach(s => s.classList.remove("highlighted"));

      if (select.value !== "") {
        const stepElement = document.getElementById("step_q_" + idx + "_" + select.value);
        if (stepElement) stepElement.classList.add("highlighted");
      }

      // Check step selection
      if (select.value === correctStep) {
        select.classList.add("is-correct");
        selectBadge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        select.classList.add("is-incorrect");
        selectBadge.classList.add("error-cross");
      }

      // Check written explanation
      if (textarea.value.trim().length >= 15) {
        textarea.classList.add("is-correct");
        textareaBadge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        textarea.classList.add("is-incorrect");
        textareaBadge.classList.add("error-cross");
      }

      // Show correct work reference for reinforcement
      if (revealBox) {
        revealBox.style.display = "block";
      }

    } else if (type === "open-response") {
      const textarea = section.querySelector(".open-response-textarea");
      textarea.classList.remove("is-correct", "is-incorrect");
      const badge = textarea.parentElement.querySelector(".feedback-badge");
      badge.className = "feedback-badge";

      const minLen = parseInt(textarea.dataset.minLength) || 15;
      const text = textarea.value.trim();

      /* A written explanation cannot be marked right by a script. It used to
         turn green and count as correct for ANY 15+ characters — a long wrong
         answer ("12 because you add 2 six times") scored 2/6. Now a long
         enough answer is SAVED for review: neutral colour, the answer key
         opens beside it, and the only thing claimed is whether the key result
         appears in what the student wrote. */
      if (text.length >= minLen) {
        reviewOnly = true;
        let keyNumbers = [];
        try { keyNumbers = JSON.parse(textarea.dataset.keyNumbers || "[]"); } catch (e) {}
        const said = (text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/g) || []);
        const hit = keyNumbers.find((n) => said.includes(n));
        feedbackMessage = !keyNumbers.length
          ? pickLangText("Saved. Now open the answer key below and compare your reasoning with it.", "Guardado. Ahora abre la clave de respuestas y compara tu razonamiento.")
          : hit
            ? pickLangText("Saved. Your answer includes " + hit + " — compare your reasoning with the answer key below.", "Guardado. Tu respuesta incluye " + hit + ": compara tu razonamiento con la clave de abajo.")
            : pickLangText("Saved, but the key result is not in your answer yet. Check your numbers against the answer key below.", "Guardado, pero el resultado clave todavía no aparece. Revisa tus números con la clave de abajo.");
        const key = section.querySelector(".hw-answer-key");
        if (key && !silent) key.open = true;
      } else {
        isProblemCorrect = false;
        textarea.classList.add("is-incorrect");
        badge.classList.add("error-cross");
        feedbackMessage = pickLangText("Write a bit more to explain your reasoning.", "Escribe un poco más para explicar tu razonamiento.");
      }
    }

  // Build per-problem feedback message
  if (!feedbackMessage) {
    if (type === "multiple-choice") {
      const container = section.querySelector(".mc-options");
      const explanation = pickLangText(container?.dataset.explanation, container?.dataset.explanationEs);
      if (isProblemCorrect) {
        feedbackMessage = pickLangText("✓ Correct! Read the explanation above.", "✓ ¡Correcto! Lee la explicación de arriba.");
      } else if (!section.querySelector("input[type='radio']:checked")) {
        feedbackMessage = pickLangText("Choose an answer, then check again.", "Elige una respuesta y revisa otra vez.");
      } else if (!revealIsDue(idx)) {
        const att = problemAttempts[idx] || 1;
        feedbackMessage = att === 1
          ? pickLangText("Not quite — check Hint 1 above and give it another shot!", "Todavía no: lee la Pista 1 arriba e inténtalo de nuevo.")
          : pickLangText("Still tricky — review Hint 2 above and test with Math Tools.", "Casi: revisa la Pista 2 arriba y prueba con las herramientas.");
      } else {
        feedbackMessage = pickLangText(
          "Review complete — the correct choice is highlighted in green. Review the visual walkthrough above!",
          "Repaso completo: la opción correcta está resaltada en verde. ¡Revisa la solución paso a paso arriba!"
        );
      }
    } else if (type === "matching-game") {
      const rows = section.querySelectorAll(".matching-row");
      const right = Array.from(rows).filter((row) => {
        const sel = row.querySelector(".matching-select");
        return sel && sel.value === row.dataset.correct;
      }).length;
      feedbackMessage = isProblemCorrect
        ? pickLangText("All " + rows.length + " matches are correct!", "¡Las " + rows.length + " parejas son correctas!")
        : pickLangText(right + " of " + rows.length + " matches correct. Fix the red dropdowns and check again.", right + " de " + rows.length + " parejas correctas. Revisa los menús rojos e intenta otra vez.");
    } else if (type === "drag-sort") {
      if (section.dataset.problemSubtype === "drag-order") {
        const rows = section.querySelectorAll(".drag-order-row");
        const right = Array.from(rows).filter((r) => r.classList.contains("is-correct")).length;
        feedbackMessage = isProblemCorrect
          ? pickLangText("Every step is in the right sequence!", "¡Todos los pasos están en el orden correcto!")
          : pickLangText(right + " of " + rows.length + " steps in the right spot. Use ▲ ▼ to rearrange.", right + " de " + rows.length + " pasos en el lugar correcto. Usa ▲ ▼ para reordenar.");
      } else {
        const cards = section.querySelectorAll(".drag-card");
        const right = Array.from(cards).filter((c) => c.classList.contains("is-correct")).length;
        feedbackMessage = isProblemCorrect
          ? pickLangText("Every card is sorted into the correct column!", "¡Todas las tarjetas están en la columna correcta!")
          : pickLangText(right + " of " + cards.length + " cards in the right place. Move the highlighted cards.", right + " de " + cards.length + " tarjetas en el lugar correcto. Mueve las tarjetas resaltadas.");
      }
    } else if (type === "fill-table") {
      const inputs = section.querySelectorAll(".table-input");
      const right = Array.from(inputs).filter((i) => i.classList.contains("is-correct")).length;
      feedbackMessage = isProblemCorrect
        ? (section.querySelector('[data-self-review="true"]') ? pickLangText("Responses recorded. Compare your explanations with the examples; other valid explanations are possible.", "Respuestas guardadas. Compara tus explicaciones con los ejemplos; hay otras explicaciones válidas.") : pickLangText("Table complete — checked answers are correct!", "Tabla completa: las respuestas comprobadas son correctas."))
        : pickLangText(right + " of " + inputs.length + " cells checked. Revisit the red boxes.", right + " de " + inputs.length + " casillas revisadas. Revisa las casillas rojas.");
    } else if (type === "error-analysis") {
      feedbackMessage = isProblemCorrect
        ? pickLangText("You found the error and wrote an explanation. Compare it with the reference.", "Encontraste el error y escribiste una explicación. Compárala con la referencia.")
        : pickLangText("Check the step you selected and write a fuller explanation (at least 15 characters).", "Revisa el paso elegido y escribe una explicación más completa (al menos 15 caracteres).");
    } else if (type === "open-response") {
      feedbackMessage = isProblemCorrect
        ? pickLangText("Response recorded. Read it back and check that it explains your reasoning.", "Respuesta guardada. Léela y comprueba que explique tu razonamiento.")
        : pickLangText(feedbackMessage || "Add more detail or key vocabulary, then check again.", "Agrega más detalles o vocabulario y revisa otra vez.");
    }
  }

  if (reviewOnly) {
    section.classList.add("reviewed");
    setProblemCheckResult(idx, true, feedbackMessage, "is-reviewed");
    if (!silent) updateScoreSummary();
    return { correct: false, done: true, message: feedbackMessage };
  }

  if (isProblemCorrect) {
    section.classList.add("correct");
    currentStreak++;
  } else {
    section.classList.add("incorrect");
    currentStreak = 0;
  }

  // Update live streak banner
  const streakBanner = document.getElementById("hw_streak_banner");
  const streakCount = document.getElementById("hw_streak_count");
  const streakCountEs = document.getElementById("hw_streak_count_es");
  if (streakBanner && streakCount) {
    if (currentStreak >= 2) {
      streakCount.textContent = currentStreak;
      if (streakCountEs) streakCountEs.textContent = currentStreak;
      streakBanner.hidden = false;
    } else {
      streakBanner.hidden = true;
    }
  }

  setProblemCheckResult(idx, isProblemCorrect, feedbackMessage);

  if (!silent) {
    playCheckSound(isProblemCorrect);
    if (isProblemCorrect) {
      triggerConfettiBurst(null, null, 40);
    }
    updateScoreSummary();
  }

  return { correct: isProblemCorrect, message: feedbackMessage };
}

function updateScoreSummary() {
  const problems = activeCoreProblems();
  const checked = problems.filter((s) => s.classList.contains("correct") || s.classList.contains("incorrect") || s.classList.contains("reviewed"));
  // "Done" = checked right, or a written answer saved and compared with the key.
  const correctCount = problems.filter((s) => s.classList.contains("correct") || s.classList.contains("reviewed")).length;
  const total = problems.length;
  if (checked.length > 0) {
    document.getElementById("progress_text").textContent = correctCount + " / " + total;
    document.getElementById("progress_bar").style.width = (correctCount / total * 100) + "%";
  } else {
    updateProgress();
  }

  // Goal milestone — the number the page states, not a hardcoded 3.
  if (correctCount >= activeHomeworkGoal()) {
    const goalBanner = document.getElementById("goal_reached_banner");
    if (goalBanner && goalBanner.hidden) {
      goalBanner.hidden = false;
      if (typeof playFanfareSound === "function") playFanfareSound();
      if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 100);
      const checkBadge = document.getElementById("tab_badge_check");
      if (checkBadge) checkBadge.textContent = "★★★";
    }
  }
}

function checkWorksheet() {
  const problems = activeCoreProblems();
  let correctCount = 0;

  problems.forEach((section) => {
    const idx = parseInt((section.id || "").replace("problem_", ""), 10);
    if (Number.isNaN(idx)) return;
    const result = checkProblem(idx, { silent: true });
    if (result.correct || result.done) correctCount++;
  });

  const total = problems.length;
  document.getElementById("progress_text").textContent = correctCount + " / " + total;
  document.getElementById("progress_bar").style.width = (correctCount / total * 100) + "%";

  if (correctCount >= activeHomeworkGoal()) {
    const goalBanner = document.getElementById("goal_reached_banner");
    if (goalBanner && goalBanner.hidden) {
      goalBanner.hidden = false;
      const checkBadge = document.getElementById("tab_badge_check");
      if (checkBadge) checkBadge.textContent = "★★★";
    }
    triggerConfettiBurst(null, null, 100);
    playFanfareSound();
  } else if (correctCount === total && total > 0) {
    playSuccessArpeggio();
  } else {
    playFailureSound();
  }
}

function resetWorksheet() {
  if (confirm("Are you sure you want to reset all your work?")) {
    localStorage.removeItem(STORAGE_KEY);

    // Clear normal text inputs, textareas, dropdowns, and radios
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach(t => {
      t.value = "";
      t.classList.remove("is-correct", "is-incorrect");
    });

    const inputs = document.querySelectorAll("input[type='text']");
    inputs.forEach(i => {
      i.value = "";
      i.classList.remove("is-correct", "is-incorrect");
    });

    const selects = document.querySelectorAll("select:not(.mobile-cat-select)");
    selects.forEach(s => {
      s.value = "";
      s.classList.remove("is-correct", "is-incorrect");
    });

    const radios = document.querySelectorAll("input[type='radio']");
    radios.forEach(r => r.checked = false);

    const labels = document.querySelectorAll(".mc-option-label, .ladder-choice");
    labels.forEach(l => l.classList.remove("is-correct", "is-incorrect"));
    document.querySelectorAll(".ladder-feedback").forEach((el) => { el.textContent = ""; el.className = "ladder-feedback"; });

    // Clear feedback badges and sections
    const badges = document.querySelectorAll(".feedback-badge");
    badges.forEach(b => b.className = "feedback-badge");

    const sections = document.querySelectorAll(".problem-section");
    document.querySelectorAll(".problem-check-result").forEach((el) => {
      el.textContent = "";
      el.className = "problem-check-result";
    });

    sections.forEach(s => {
      s.classList.remove("correct", "incorrect", "reviewed");
      const expBoxes = s.querySelectorAll(".explanation-box");
      expBoxes.forEach(b => b.remove());

      const workedSteps = s.querySelectorAll(".worked-step");
      workedSteps.forEach(ws => ws.classList.remove("highlighted"));

      const reveal = s.querySelector(".reveal-box");
      if (reveal) reveal.style.display = "none";

      const type = s.dataset.problemType;
      if (type === "drag-sort") {
        const parts = s.id.split("_");
        const idx = parts[1];
        if (s.dataset.problemSubtype === "drag-order") {
          resetDragOrder(idx);
          shuffleOrderRows(idx);
        } else {
          resetDragSort(idx);
        }
      }
    });

    // Save blank state
    saveState();
    updateProgress();

    // Play a reset click sound
    if (soundEnabled) {
      try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    }
  }
}

// ---- Interactive tap-to-graph widgets (number line / coordinate plane / grid) ----
// Progressive enhancement: hydrates the static .hw-visual-svg fallbacks into
// structured manipulatives. State persists via the hidden [data-graph-state] input,
// which rides the existing saveState()/loadState() pipeline.
var NeftGraph = (function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) { for (var k in attrs) e.setAttribute(k, attrs[k]); }
    return e;
  }
  function bi(en, es) {
    return '<span class="lang-en">' + en + '</span><span class="lang-es" lang="es">' + es + '</span>';
  }
  function readState(frame) {
    var inp = frame.querySelector("[data-graph-state]");
    if (!inp || !inp.value) return null;
    try { return JSON.parse(inp.value); } catch (e) { return null; }
  }
  function writeState(frame, state) {
    var inp = frame.querySelector("[data-graph-state]");
    if (inp) inp.value = state ? JSON.stringify(state) : "";
    if (typeof saveState === "function") saveState();
  }
  function setReadout(frame, html) {
    var r = frame.querySelector("[data-graph-readout]");
    if (r) r.innerHTML = html || "";
  }
  function makeBtn(html, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.innerHTML = html;
    b.addEventListener("click", onClick);
    return b;
  }

  function graphNumberInput(container, label, value) {
    var wrap = document.createElement("label");
    wrap.innerHTML = label + " ";
    var input = document.createElement("input");
    input.type = "number"; input.step = "any"; input.value = value;
    input.style.width = "6em"; input.style.minHeight = "44px";
    wrap.appendChild(input); container.appendChild(wrap);
    return input;
  }
  function graphHit(node, label, action) {
    node.setAttribute("role", "button"); node.setAttribute("tabindex", "0");
    node.setAttribute("aria-label", label);
    node.addEventListener("click", action);
    node.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); action(); }
    });
  }

  // ----- Number line: tap a tick to set the boundary, toggle open/closed, shade a ray -----
  function initNumberLine(frame) {
    var MIN = -5, MAX = 5, x0 = 24, x1 = 320, y = 46;
    var stepX = (x1 - x0) / (MAX - MIN);
    var state = readState(frame) || { v: null, closed: true, dir: null };
    var oldSvg = frame.querySelector(".hw-visual-svg");
    var svg = el("svg", { viewBox: "0 0 344 96", "class": "hw-visual-svg", role: "group", "aria-label": "Interactive number line" });
    var tickLayer = el("g"), rayLayer = el("g"), pointLayer = el("g");
    svg.appendChild(tickLayer);
    svg.appendChild(el("line", { x1: 14, y1: y, x2: 330, y2: y, stroke: "#12355b", "stroke-width": 2 }));
    svg.appendChild(el("polygon", { points: "330," + y + " 320," + (y - 5) + " 320," + (y + 5), fill: "#12355b" }));
    svg.appendChild(el("polygon", { points: "14," + y + " 24," + (y - 5) + " 24," + (y + 5), fill: "#12355b" }));
    function xFor(v) { return x0 + (v - MIN) * stepX; }
    function drawTicks() {
      tickLayer.replaceChildren();
      var tickStep = Math.max(1, Math.ceil(MAX / 5));
      for (var v = MIN; v <= MAX; v += tickStep) {
        var x = xFor(v);
        tickLayer.appendChild(el("line", { x1:x, y1:y-6, x2:x, y2:y+6, stroke:"#12355b" }));
        var lbl = el("text", { x:x, y:y+22, "text-anchor":"middle", "class":"ng-tick-lbl" });
        lbl.textContent = String(v); tickLayer.appendChild(lbl);
        (function(val, cx) {
          var hit = el("rect", { x:cx-stepX*tickStep/2, y:6, width:stepX*tickStep, height:60, "class":"ng-hit" });
          graphHit(hit, "Plot / Marcar " + val, function() { state.v=val; render(); });
          tickLayer.appendChild(hit);
        })(v,x);
      }
    }
    svg.appendChild(rayLayer);
    svg.appendChild(pointLayer);
    oldSvg.parentNode.replaceChild(svg, oldSvg);

    var controls = frame.querySelector("[data-graph-controls]");
    controls.innerHTML = "";
    var boundary = graphNumberInput(controls, bi("Boundary", "Límite"), state.v ?? "");
    boundary.addEventListener("change", function() {
      if (boundary.value === "") { state.v = null; render(); return; }
      var value = Number(boundary.value);
      if (Number.isFinite(value)) { state.v = value; render(); }
    });
    var bCircle = makeBtn("", function () { state.closed = !state.closed; render(); });
    var bLeft = makeBtn(bi("◀ Shade left", "◀ Sombrear izq."), function () { state.dir = state.dir === "left" ? null : "left"; render(); });
    var bRight = makeBtn(bi("Shade right ▶", "Sombrear der. ▶"), function () { state.dir = state.dir === "right" ? null : "right"; render(); });
    controls.appendChild(bCircle); controls.appendChild(bLeft); controls.appendChild(bRight);

    function render() {
      MAX = Math.max(5, Math.ceil(Math.abs(state.v || 0) / 5) * 5);
      MIN = -MAX; stepX = (x1-x0)/(MAX-MIN);
      boundary.value = state.v ?? "";
      drawTicks();
      while (rayLayer.firstChild) rayLayer.removeChild(rayLayer.firstChild);
      while (pointLayer.firstChild) pointLayer.removeChild(pointLayer.firstChild);
      bCircle.innerHTML = state.closed ? bi("● Closed", "● Cerrado") : bi("○ Open", "○ Abierto");
      bLeft.setAttribute("aria-pressed", state.dir === "left" ? "true" : "false");
      bRight.setAttribute("aria-pressed", state.dir === "right" ? "true" : "false");
      if (state.v != null) {
        var px = xFor(state.v);
        if (state.dir === "left") rayLayer.appendChild(el("line", { x1: 14, y1: y, x2: px, y2: y, "class": "ng-ray" }));
        if (state.dir === "right") rayLayer.appendChild(el("line", { x1: px, y1: y, x2: 330, y2: y, "class": "ng-ray" }));
        var pt = el("circle", { cx: px, cy: y, r: 7, "class": "ng-point" + (state.closed ? "" : " is-open") });
        pt.addEventListener("click", function () { state.closed = !state.closed; render(); });
        pointLayer.appendChild(pt);
      }
      if (state.v == null) {
        setReadout(frame, "");
      } else if (!state.dir) {
        setReadout(frame, bi("Point at " + state.v, "Punto en " + state.v));
      } else {
        var op = state.dir === "right" ? (state.closed ? "≥" : ">") : (state.closed ? "≤" : "<");
        setReadout(frame, bi("Your graph: x " + op + " " + state.v, "Tu gráfica: x " + op + " " + state.v));
      }
      writeState(frame, (state.v == null && state.dir == null) ? null : state);
    }
    frame.querySelector("[data-graph-reset]").addEventListener("click", function () {
      state = { v: null, closed: true, dir: null }; render();
    });
    render();
  }

  // ----- Coordinate plane: tap a lattice point to plot/remove an ordered pair -----
  function initCoordinatePlane(frame) {
    var MIN = -5, MAX = 5, O = 120, STEP = 20; // origin at (120,120); 5*20=100 -> 20..220
    var state = readState(frame) || { pts: [] };
    var oldSvg = frame.querySelector(".hw-visual-svg");
    var svg = el("svg", { viewBox: "0 0 240 240", "class": "hw-visual-svg", role: "group", "aria-label": "Interactive coordinate plane" });
    function sx(x) { return O + x * STEP; }
    function sy(yv) { return O - yv * STEP; }
    for (var i = MIN; i <= MAX; i++) {
      svg.appendChild(el("line", { x1: sx(i), y1: sy(MAX), x2: sx(i), y2: sy(MIN), stroke: "#d6e2ee", "stroke-width": 1 }));
      svg.appendChild(el("line", { x1: sx(MIN), y1: sy(i), x2: sx(MAX), y2: sy(i), stroke: "#d6e2ee", "stroke-width": 1 }));
    }
    svg.appendChild(el("line", { x1: O, y1: sy(MAX) - 6, x2: O, y2: sy(MIN) + 6, stroke: "#12355b", "stroke-width": 2 }));
    svg.appendChild(el("line", { x1: sx(MIN) - 6, y1: O, x2: sx(MAX) + 6, y2: O, stroke: "#12355b", "stroke-width": 2 }));
    var xlbl = el("text", { x: sx(MAX) + 2, y: O + 14, "class": "ng-axis-lbl" }); xlbl.textContent = "x"; svg.appendChild(xlbl);
    var ylbl = el("text", { x: O + 4, y: sy(MAX) + 2, "class": "ng-axis-lbl" }); ylbl.textContent = "y"; svg.appendChild(ylbl);
    var plotLayer = el("g"), hitLayer = el("g");
    svg.appendChild(hitLayer);
    svg.appendChild(plotLayer);
    oldSvg.parentNode.replaceChild(svg, oldSvg);

    var controls = frame.querySelector("[data-graph-controls]");
    var xInput = graphNumberInput(controls, "x", 0);
    var yInput = graphNumberInput(controls, "y", 0);
    controls.appendChild(makeBtn(bi("Plot / remove point", "Marcar / quitar punto"), function() {
      if (xInput.value === "" || yInput.value === "") return;
      var x = Number(xInput.value), y = Number(yInput.value);
      if (Number.isFinite(x) && Number.isFinite(y)) toggle(x,y);
    }));
    function drawGrid() {
      MAX = Math.max(5, ...state.pts.flat().map(function(v) { return Math.ceil(Math.abs(v)/5)*5; }));
      MIN = -MAX; STEP = 100/MAX;
      // Remove the old fixed grid and labels, keeping the plot and hit layers.
      Array.from(svg.children).forEach(function(child) {
        if (child !== plotLayer && child !== hitLayer) child.remove();
      });
      hitLayer.replaceChildren();
      var tickStep = Math.max(1, Math.ceil(MAX/5));
      for (var i=MIN; i<=MAX; i+=tickStep) {
        var shade = i === 0 ? "#12355b" : "#d6e2ee";
        svg.insertBefore(el("line", {x1:sx(i),y1:sy(MAX),x2:sx(i),y2:sy(MIN),stroke:shade}), hitLayer);
        svg.insertBefore(el("line", {x1:sx(MIN),y1:sy(i),x2:sx(MAX),y2:sy(i),stroke:shade}), hitLayer);
        var label = el("text", {x:sx(i), y:O+14, "class":"ng-tick-lbl", "text-anchor":"middle"});
        label.textContent = i; svg.insertBefore(label,hitLayer);
        if (i) {
          var yLabel = el("text", {x:O+4,y:sy(i)-3,"class":"ng-tick-lbl"});
          yLabel.textContent=i; svg.insertBefore(yLabel,hitLayer);
        }
        for (var j=MIN; j<=MAX; j+=tickStep) {
          (function(x,y) {
            var hit = el("circle", {cx:sx(x),cy:sy(y),r:8,"class":"ng-hit"});
            graphHit(hit,"Plot / Marcar ("+x+", "+y+")",function(){toggle(x,y);});
            hitLayer.appendChild(hit);
          })(i,j);
        }
      }
    }
    function toggle(x, y) {
      var idx = -1;
      for (var i = 0; i < state.pts.length; i++) { if (state.pts[i][0] === x && state.pts[i][1] === y) { idx = i; break; } }
      if (idx >= 0) state.pts.splice(idx, 1); else state.pts.push([x, y]);
      render();
    }
    function render() {
      drawGrid();
      while (plotLayer.firstChild) plotLayer.removeChild(plotLayer.firstChild);
      var parts = [];
      for (var i = 0; i < state.pts.length; i++) {
        var p = state.pts[i];
        plotLayer.appendChild(el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 4.5, "class": "ng-plot" }));
        var t = el("text", { x: sx(p[0]) + 6, y: sy(p[1]) - 5, "class": "ng-plot-lbl" });
        t.textContent = "(" + p[0] + ", " + p[1] + ")";
        plotLayer.appendChild(t);
        parts.push("(" + p[0] + ", " + p[1] + ")");
      }
      if (!parts.length) setReadout(frame, "");
      else setReadout(frame, bi("Points: " + parts.join("  "), "Puntos: " + parts.join("  ")));
      writeState(frame, state.pts.length ? state : null);
    }
    frame.querySelector("[data-graph-reset]").addEventListener("click", function () { state = { pts: [] }; render(); });
    render();
  }

  // ----- Grid: tap cells to shade a model / count square units -----
  function initGrid(frame) {
    var COLS = 12, ROWS = 6, CELL = 24, PAD = 6;
    var W = COLS * CELL + PAD * 2, H = ROWS * CELL + PAD * 2;
    var state = readState(frame) || { cells: [] };
    var on = {}; for (var i = 0; i < state.cells.length; i++) on[state.cells[i]] = true;
    var oldSvg = frame.querySelector(".hw-visual-svg");
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "hw-visual-svg", role: "group", "aria-label": "Interactive grid" });
    svg.appendChild(el("rect", { x: PAD, y: PAD, width: COLS * CELL, height: ROWS * CELL, fill: "#ffffff", stroke: "#12355b", "stroke-width": 1.5 }));
    var cellLayer = el("g");
    svg.appendChild(cellLayer);
    for (var c = 0; c <= COLS; c++) svg.appendChild(el("line", { x1: PAD + c * CELL, y1: PAD, x2: PAD + c * CELL, y2: PAD + ROWS * CELL, stroke: "#d6e2ee", "stroke-width": 1 }));
    for (var r = 0; r <= ROWS; r++) svg.appendChild(el("line", { x1: PAD, y1: PAD + r * CELL, x2: PAD + COLS * CELL, y2: PAD + r * CELL, stroke: "#d6e2ee", "stroke-width": 1 }));
    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        (function (row, col) {
          var key = row + "," + col;
          var rect = el("rect", { x: PAD + col * CELL, y: PAD + row * CELL, width: CELL, height: CELL, "class": "ng-cell" + (on[key] ? " is-on" : "") });
          graphHit(rect, "Square / Cuadro " + (row+1) + ", " + (col+1), function () {
            if (on[key]) { delete on[key]; rect.setAttribute("class", "ng-cell"); }
            else { on[key] = true; rect.setAttribute("class", "ng-cell is-on"); }
            commit();
          });
          cellLayer.appendChild(rect);
        })(rr, cc);
      }
    }
    oldSvg.parentNode.replaceChild(svg, oldSvg);
    function commit() {
      var keys = Object.keys(on);
      if (!keys.length) setReadout(frame, "");
      else setReadout(frame, bi("Shaded: " + keys.length + " square units", "Sombreado: " + keys.length + " unidades cuadradas"));
      writeState(frame, keys.length ? { cells: keys } : null);
    }
    frame.querySelector("[data-graph-reset]").addEventListener("click", function () {
      on = {};
      var rects = cellLayer.querySelectorAll(".ng-cell");
      for (var i = 0; i < rects.length; i++) rects[i].setAttribute("class", "ng-cell");
      commit();
    });
    commit();
  }

  function initAll() {
    var frames = document.querySelectorAll(".hw-visual-frame.hw-interactive");
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (f.getAttribute("data-ng-ready")) continue;
      f.setAttribute("data-ng-ready", "1");
      var type = f.getAttribute("data-interactive");
      try {
        if (type === "number-line") initNumberLine(f);
        else if (type === "coordinate-plane") initCoordinatePlane(f);
        else if (type === "grid") initGrid(f);
      } catch (e) { /* fail safe: keep static fallback */ }
    }
  }
  return { initAll: initAll };
})();

// Initial configuration
function initializeHomeworkState() {
  const hadSavedState = !!localStorage.getItem(STORAGE_KEY);
  loadState();
  if (!hadSavedState) {
    document.querySelectorAll(".drag-order-workspace").forEach((workspace) => {
      const probIdx = workspace.id.replace("dragorder_", "");
      shuffleOrderRows(probIdx);
    });
  }
  updateProgress();
  NeftGraph.initAll();

  document.addEventListener("dragend", function() {
    document.querySelectorAll(".drag-card.dragging, .drag-order-row.dragging")
      .forEach((el) => el.classList.remove("dragging"));
    clearDragOver();
  });

  document.querySelectorAll(".drag-card").forEach((card) => {
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  // Tap-to-move fallback for touch devices
  let selectedDragCard = null;
  document.querySelectorAll(".drag-card").forEach((card) => {
    card.addEventListener("click", function(e) {
      if (e.target.tagName === "SELECT" || e.target.tagName === "OPTION") return;
      e.stopPropagation();
      if (selectedDragCard === this) {
        this.style.borderColor = "var(--line)";
        selectedDragCard = null;
      } else {
        if (selectedDragCard) selectedDragCard.style.borderColor = "var(--line)";
        selectedDragCard = this;
        this.style.borderColor = "var(--teal)";
      }
    });
  });

  document.querySelectorAll(".drag-column, .drag-source-pile, .drag-column-slots").forEach((zone) => {
    zone.addEventListener("click", function(e) {
      if (!selectedDragCard) return;
      if (e.target.closest('.drag-card')) return;
      const probIdx = selectedDragCard.id.split("_")[1];
      if (this.closest('.drag-sort-workspace') !== selectedDragCard.closest('.drag-sort-workspace')) return;
      e.stopPropagation();

      let targetContainer = null;
      let categoryId = "";
      if (this.classList.contains("drag-column")) {
        categoryId = this.dataset.categoryId || "";
        targetContainer = this.querySelector(".drag-column-slots");
      } else if (this.classList.contains("drag-column-slots")) {
        categoryId = this.id.split("_").slice(2).join("_");
        targetContainer = this;
      } else if (this.classList.contains("drag-source-pile")) {
        targetContainer = this;
      }

      if (targetContainer) {
        targetContainer.appendChild(selectedDragCard);
        const select = selectedDragCard.querySelector(".mobile-cat-select");
        if (select) select.value = categoryId;
        selectedDragCard.style.borderColor = "var(--line)";
        selectedDragCard = null;
        saveState();
        updateProgress();
      }
    });
  });

  document.querySelectorAll(".drag-order-list").forEach((list) => {
    const probIdx = list.id.replace("orderlist_", "");
    list.addEventListener("dragover", allowDrop);
    list.addEventListener("drop", (ev) => handleOrderDrop(ev, probIdx));
    list.querySelectorAll(".drag-order-row").forEach((row) => {
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
    });
  });
}
// Restore before images and optional resources finish loading.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHomeworkState, { once: true });
} else {
  initializeHomeworkState();
}
