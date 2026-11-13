/*!
 * mentor-lab.js — Unit 0 · Choose Your Math Mentor.
 *
 * A five-screen guided choice: welcome → pick a thinking move → meet the people
 * who work that way → learn one properly → confirm. Plus an A–Z browse and a
 * "surprise me" for students who would rather not decide from a grid.
 *
 * ACCESS IS THE DESIGN, not a bolt-on (Level 1 / ESOL):
 *   - Every mentor leads with `simple` — one short plain-English sentence. The
 *     longer paragraphs sit underneath for students who want them.
 *   - EN/ES toggle swaps the UI chrome and the short mentor strings.
 *   - Read-aloud: tap any text to hear it, in the language currently selected.
 *     Mirrors the Level 0 read-aloud pattern already used across the site.
 *   - Each lab card carries two vocabulary words with definitions, because the
 *     lab card is the first thing a student reads and vocab-first is required.
 *
 * DESIGN RULES (docs/superpowers/specs/2026-07-30-mentor-lab-design.md):
 *   - The move screen is the real lesson. A student who quits after step 2 has
 *     still met all eight ways of thinking. Nothing is gated behind finishing.
 *   - Ordering shown to a student is by lab, or A–Z. NEVER by the roster's
 *     internal coverage tag, which this file does not read at all.
 *   - Mentor, not costume: no first-person copy, no "be" a real person.
 *
 * Writes the choice through window.NTMentor when the in-lesson layer is present
 * (single writer of `nt_mentor`), falling back to the same shape when it is not
 * — this page must work standalone.
 */
(function () {
  "use strict";

  var STORE_KEY = "nt_mentor";
  var STATE_VERSION = 2;

  var R = null;
  var lang = "en";
  var speakOn = false;
  var selectedLab = null;
  var viewing = null;
  var cameFromBrowse = false;

  var $ = function (id) {
    return document.getElementById(id);
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── UI strings ────────────────────────────────────────────────────────── */

  var T = {
    en: {
      s1: "Start",
      s2: "Your move",
      s3: "Meet them",
      s4: "Learn one",
      s5: "Done",
      readAloud: "🔊 Read to me",
      readAloudHint: "Read-aloud is on. Tap any words to hear them.",
      heroEyebrow: "A 60–90 second start",
      heroTitle: "Pick someone to think with.",
      heroBig: "You will choose a mathematician to work <strong>with</strong> this year.",
      heroF1: "You keep your own name.",
      heroF2: "They give you one <strong>move</strong> — a way to think.",
      heroF3: "Every one of them got stuck. They kept going.",
      heroStart: "Let's start →",
      showAll: "Show me everyone",
      surprise: "🎲 Surprise me",
      already: "You already have a mentor",
      backLessons: "Back to my lessons",
      changeOne: "Choose someone different",
      moveTitle: "Which one sounds most like you?",
      moveSub: "There is no wrong answer. Pick the one closest to how you already think.",
      matchTitle: "People who think like that",
      diffMove: "← Different move",
      backMoves: "← Back to the moves",
      allTitle: "Everyone in the lab",
      allSub: "Listed A to Z. Tap anyone to read about them.",
      footer:
        "These are real people. Nothing here asks you to be one of them — you are borrowing how they thought. The pictures are drawings, not photographs.",
      words: "Words to know",
      sayIt: "say it",
      theirMove: "Their move",
      thoughtAbout: "What they thought about",
      hardPart: "The hard part",
      tryIt: "Try their move — 10 seconds",
      showMe: "Show me",
      back: "← Back",
      workWith: "Work with",
      seeSomeone: "See someone else",
      youWork: "You are working with",
      doneNote:
        "Their name will be with you on every lesson. When you get stuck, that move is the first thing to try.",
      goLessons: "Go to my lessons →",
      changeIt: "Actually, let me change it",
      people: "people.",
      more: "Tell me more",
      failed: "The mentor list could not load. Refresh the page to try again.",
      saveFail: "Something went wrong saving that. Try again.",
    },
    es: {
      s1: "Inicio",
      s2: "Tu manera",
      s3: "Conócelos",
      s4: "Aprende de uno",
      s5: "Listo",
      readAloud: "🔊 Léemelo",
      readAloudHint: "La lectura en voz alta está activada. Toca cualquier texto para escucharlo.",
      heroEyebrow: "Un inicio de 60–90 segundos",
      heroTitle: "Escoge a alguien para pensar juntos.",
      heroBig: "Vas a escoger a un matemático para trabajar <strong>con</strong> él este año.",
      heroF1: "Tú conservas tu propio nombre.",
      heroF2: "Te dan una <strong>manera</strong> de pensar.",
      heroF3: "Todos ellos se atoraron. Y siguieron adelante.",
      heroStart: "Empecemos →",
      showAll: "Muéstrame a todos",
      surprise: "🎲 Sorpréndeme",
      already: "Ya tienes un mentor",
      backLessons: "Volver a mis lecciones",
      changeOne: "Escoger a otra persona",
      moveTitle: "¿Cuál se parece más a ti?",
      moveSub: "No hay respuesta incorrecta. Escoge la más parecida a cómo ya piensas.",
      matchTitle: "Personas que piensan así",
      diffMove: "← Otra manera",
      backMoves: "← Volver a las maneras",
      allTitle: "Todos en el laboratorio",
      allSub: "En orden de la A a la Z. Toca a cualquiera para leer sobre esa persona.",
      footer:
        "Son personas reales. Nada aquí te pide que seas una de ellas — estás tomando prestada su forma de pensar. Las imágenes son dibujos, no fotografías.",
      words: "Palabras para saber",
      sayIt: "se dice",
      theirMove: "Su manera",
      thoughtAbout: "En qué pensaban",
      hardPart: "La parte difícil",
      tryIt: "Prueba su manera — 10 segundos",
      showMe: "Muéstrame",
      back: "← Atrás",
      workWith: "Trabajar con",
      seeSomeone: "Ver a otra persona",
      youWork: "Estás trabajando con",
      doneNote:
        "Su nombre estará contigo en cada lección. Cuando te atores, esa manera es lo primero que debes probar.",
      goLessons: "Ir a mis lecciones →",
      changeIt: "Mejor déjame cambiarlo",
      people: "personas.",
      more: "Cuéntame más",
      failed: "No se pudo cargar la lista. Actualiza la página para intentar de nuevo.",
      saveFail: "Algo salió mal al guardar. Inténtalo de nuevo.",
    },
  };

  function t(key) {
    return (T[lang] && T[lang][key]) || T.en[key] || "";
  }

  /* Every mentor string a student reads follows the language toggle — the
     short lines AND the long ones (did, struggle). Nothing is left in English
     with a "use read-aloud" excuse. */
  function mThought(m) {
    return lang === "es" && m.es ? m.es.thought : m.thought;
  }
  function mSimple(m) {
    return lang === "es" && m.es ? m.es.simple : m.simple;
  }
  function mDid(m) {
    return lang === "es" && m.es && m.es.did ? m.es.did : m.did;
  }
  function mStruggle(m) {
    return lang === "es" && m.es && m.es.struggle ? m.es.struggle : m.struggle;
  }
  function mLoc(m, field) {
    return lang === "es" && m.es && m.es[field] ? m.es[field] : m[field];
  }
  function labField(lab, field) {
    return lang === "es" && lab.es && lab.es[field] ? lab.es[field] : lab[field];
  }

  /* ── read-aloud ────────────────────────────────────────────────────────── */

  /* Prefer a Latin American Spanish voice — these students are far more likely
     to be served by es-US/es-MX than by Castilian. Falls back to any es-* and
     then to whatever the browser picks. */
  var VOICE_ORDER = { es: ["es-US", "es-MX", "es-419", "es-ES", "es"], en: ["en-US", "en"] };

  function pickVoice() {
    try {
      var voices = window.speechSynthesis.getVoices() || [];
      var order = VOICE_ORDER[lang] || [];
      for (var i = 0; i < order.length; i++) {
        for (var v = 0; v < voices.length; v++) {
          var vl = (voices[v].lang || "").replace("_", "-");
          if (vl.toLowerCase().indexOf(order[i].toLowerCase()) === 0) return voices[v];
        }
      }
    } catch (_e) {
      /* ignore */
    }
    return null;
  }

  function speak(text) {
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, " ").trim());
      var voice = pickVoice();
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || (lang === "es" ? "es-US" : "en-US");
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (_e) {
      /* speech unavailable — silent, never fatal */
    }
  }

  function setSpeak(on) {
    speakOn = !!on;
    var btn = $("ml-speak-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", speakOn ? "true" : "false");
      btn.classList.toggle("is-on", speakOn);
    }
    var hint = $("ml-speak-hint");
    if (hint) hint.hidden = !speakOn;
    document.body.classList.toggle("ml-speaking", speakOn);
    if (!speakOn) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {
        /* ignore */
      }
    }
  }

  /* ── avatar ────────────────────────────────────────────────────────────── */

  function av(m, lab, size) {
    try {
      if (window.NTMentorAvatar) return window.NTMentorAvatar.svg(m, lab, size);
    } catch (_e) {
      /* ignore */
    }
    return "";
  }

  /* ── stored choice ─────────────────────────────────────────────────────── */

  function readChoice() {
    try {
      if (window.NTMentor && typeof window.NTMentor.get === "function")
        return window.NTMentor.get();
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function writeChoice(id) {
    try {
      if (window.NTMentor && typeof window.NTMentor.set === "function") {
        if (window.NTMentor.set(id)) return true;
      }
    } catch (_e) {
      /* fall through */
    }
    try {
      var m = R.getMentor(id);
      if (!m) return false;
      var prev = null;
      try {
        prev = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      } catch (_e2) {
        prev = null;
      }
      var moves = prev && Array.isArray(prev.moves) ? prev.moves.slice() : [];
      if (moves.indexOf(m.lab) === -1) moves.push(m.lab);
      var next = prev && typeof prev === "object" ? prev : {};
      next.version = STATE_VERSION;
      next.id = id;
      next.chosenAt = new Date().toISOString();
      next.moves = moves;
      next.seenStories = Array.isArray(next.seenStories) ? next.seenStories : [];
      next.lang = lang;
      next.studio = next.studio && typeof next.studio === "object" ? next.studio : {};
      next.journey =
        next.journey && typeof next.journey === "object"
          ? next.journey
          : { weeks: {}, moments: {}, experiences: {} };
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      return true;
    } catch (_e) {
      return false;
    }
  }

  /* Language lives on the shared mentor record, so the in-lesson layer shows
     the same language a student picked here. A preference that resets on every
     page is not a preference. */
  function saveLang() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var st = raw ? JSON.parse(raw) : {};
      st.lang = lang;
      localStorage.setItem(STORE_KEY, JSON.stringify(st));
    } catch (_e) {
      /* ignore */
    }
  }

  function loadLang() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var st = raw ? JSON.parse(raw) : null;
      if (st && st.lang === "es") lang = "es";
    } catch (_e) {
      /* ignore */
    }
  }

  /* ── step machine ──────────────────────────────────────────────────────── */

  function announce(msg) {
    var live = $("ml-live");
    if (live) live.textContent = msg;
  }

  function show(step) {
    var sections = document.querySelectorAll(".ml-step");
    for (var i = 0; i < sections.length; i++) {
      sections[i].hidden = sections[i].getAttribute("data-step") !== String(step);
    }
    var n = parseInt(step, 10);
    var items = document.querySelectorAll("#ml-steps li");
    for (var k = 0; k < items.length; k++) {
      var num = parseInt(items[k].getAttribute("data-step"), 10);
      var cur = !!n && num === n;
      items[k].classList.toggle("is-current", cur);
      items[k].classList.toggle("is-done", !!n && num < n);
      if (cur) items[k].setAttribute("aria-current", "step");
      else items[k].removeAttribute("aria-current");
    }
    var main = $("ml-main");
    if (main && main.focus) main.focus();
    try {
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (_e) {
      window.scrollTo(0, 0);
    }
  }

  /* ── renderers ─────────────────────────────────────────────────────────── */

  function heroStrip() {
    var host = $("ml-hero-strip");
    if (!host) return;
    var all = R.allMentors();
    // A fixed spread across the roster, so the strip is varied but stable.
    var picks = [];
    var stride = Math.max(1, Math.floor(all.length / 7));
    for (var i = 0; i < all.length && picks.length < 7; i += stride) picks.push(all[i]);
    var html = "";
    for (var k = 0; k < picks.length; k++) {
      html += '<span class="ml-strip-face">' + av(picks[k], R.getLab(picks[k].lab), 56) + "</span>";
    }
    host.innerHTML = html;
  }

  function renderLabs() {
    var ul = $("ml-labs");
    if (!ul) return;
    var html = "";
    for (var i = 0; i < R.labs.length; i++) {
      var lab = R.labs[i];
      var vocab = "";
      for (var v = 0; v < (lab.vocab || []).length; v++) {
        var w = lab.vocab[v];
        vocab +=
          '<span class="ml-word" title="' +
          esc(w.def) +
          '">' +
          esc(lang === "es" && w.es ? w.es : w.word) +
          "</span>";
      }
      html +=
        '<li><button class="ml-lab" type="button" data-lab="' +
        esc(lab.id) +
        '" style="--ml-color:' +
        esc(lab.color) +
        '">' +
        '<span class="ml-lab-emblem" aria-hidden="true">' +
        esc(lab.emblem) +
        "</span>" +
        '<span class="ml-lab-sounds">“' +
        esc(labField(lab, "sounds")) +
        "”</span>" +
        '<span class="ml-lab-move">' +
        esc(labField(lab, "move")) +
        "</span>" +
        '<span class="ml-lab-words">' +
        vocab +
        "</span>" +
        '<span class="ml-lab-name">' +
        esc(labField(lab, "name")) +
        "</span>" +
        "</button></li>";
    }
    ul.innerHTML = html;
  }

  function personCard(m) {
    var lab = R.getLab(m.lab);
    return (
      '<li><button class="ml-person" type="button" data-mentor="' +
      esc(m.id) +
      '" style="--ml-color:' +
      esc(lab ? lab.color : "#334155") +
      '">' +
      '<span class="ml-person-med" aria-hidden="true">' +
      av(m, lab, 66) +
      "</span>" +
      '<span class="ml-person-body">' +
      '<span class="ml-person-name">' +
      esc(m.name) +
      "</span>" +
      '<span class="ml-person-say">' +
      esc(t("sayIt")) +
      ": " +
      esc(m.say) +
      "</span>" +
      '<span class="ml-person-simple">' +
      esc(mSimple(m)) +
      "</span>" +
      '<span class="ml-person-lab"><i aria-hidden="true">' +
      esc(lab ? lab.emblem : "") +
      "</i> " +
      esc(lab ? labField(lab, "name") : "") +
      "</span>" +
      "</span>" +
      "</button></li>"
    );
  }

  function renderMatches(labId) {
    var lab = R.getLab(labId);
    if (!lab) return;
    var head = $("ml-labhead");
    if (head) {
      head.style.setProperty("--ml-color", lab.color);
      head.innerHTML =
        '<span class="ml-labhead-emblem" aria-hidden="true">' +
        esc(lab.emblem) +
        "</span>" +
        '<div><p class="ml-eyebrow">' +
        esc(labField(lab, "name")) +
        '</p><p class="ml-labhead-move">' +
        esc(labField(lab, "move")) +
        '</p><p class="ml-labhead-blurb">' +
        esc(labField(lab, "blurb")) +
        "</p></div>";
    }
    var ul = $("ml-people");
    if (!ul) return;
    var people = R.mentorsInLab(labId).sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    var html = "";
    for (var i = 0; i < people.length; i++) html += personCard(people[i]);
    ul.innerHTML = html;
  }

  function renderAll() {
    var ul = $("ml-all");
    if (!ul) return;
    var all = R.allMentors(); // A–Z: the only ordering a student ever sees
    var html = "";
    for (var i = 0; i < all.length; i++) html += personCard(all[i]);
    ul.innerHTML = html;
    var count = $("ml-count");
    if (count) count.textContent = " " + all.length + " " + t("people");
  }

  function renderDetail(id) {
    var m = R.getMentor(id);
    if (!m) return;
    viewing = m;
    var lab = R.getLab(m.lab);
    var host = $("ml-detail");
    if (!host) return;

    host.style.setProperty("--ml-color", lab ? lab.color : "#334155");
    var universe = window.NTMentorUniverse;
    var interaction = universe ? universe.interactionFor(m, lang) : null;
    var sources = universe ? universe.sourcesFor(m) : [];
    var enrichment = "";
    if (interaction) {
      enrichment =
        '<section class="ml-detail-sec mu-profile-lab"><h2>' +
        esc(lang === "es" ? "Prueba la estrategia" : "Try the strategy") +
        "</h2><p>" +
        esc(interaction.prompt) +
        '</p><label><span class="ml-sr">' +
        esc(lang === "es" ? "Tu respuesta" : "Your answer") +
        '</span><input data-mu-profile-answer="' +
        esc(m.id) +
        '" autocomplete="off"></label> ' +
        '<button class="ml-btn ml-btn-quiet" type="button" data-mu-profile-check="' +
        esc(m.id) +
        '">' +
        esc(lang === "es" ? "Revisar" : "Check") +
        '</button><p class="mu-profile-feedback" role="status" aria-live="polite"></p></section>';
    }
    if (sources.length) {
      enrichment +=
        '<section class="ml-detail-sec mu-sources"><h2>' +
        esc(lang === "es" ? "Fuentes para seguir leyendo" : "Sources and further reading") +
        "</h2><ul>" +
        sources
          .map(function (source) {
            return (
              '<li><a href="' +
              esc(source.href) +
              '" target="_blank" rel="noopener noreferrer">' +
              esc(source.label) +
              "</a></li>"
            );
          })
          .join("") +
        "</ul></section>";
    }

    host.innerHTML =
      '<button class="ml-back" type="button" data-back="1">' +
      esc(t("back")) +
      "</button>" +
      '<div class="ml-detail-head">' +
      '<div class="ml-detail-med" aria-hidden="true">' +
      av(m, lab, 108) +
      "</div>" +
      "<div>" +
      '<h1 id="ml-h4">' +
      esc(m.name) +
      "</h1>" +
      '<p class="ml-detail-say">' +
      esc(t("sayIt")) +
      ": " +
      esc(m.say) +
      "</p>" +
      '<p class="ml-detail-where">' +
      esc(mLoc(m, "years")) +
      " · " +
      esc(mLoc(m, "where")) +
      "</p>" +
      "</div>" +
      "</div>" +
      '<p class="ml-detail-simple">' +
      esc(mSimple(m)) +
      "</p>" +
      '<div class="ml-detail-move">' +
      '<span class="ml-detail-move-emblem" aria-hidden="true">' +
      esc(lab ? lab.emblem : "") +
      "</span>" +
      '<div><p class="ml-eyebrow">' +
      esc(t("theirMove")) +
      " · " +
      esc(lab ? labField(lab, "name") : "") +
      '</p><p class="ml-detail-move-line">' +
      esc(lab ? labField(lab, "move") : "") +
      "</p></div>" +
      "</div>" +
      '<details class="ml-more"><summary>' +
      esc(t("more")) +
      "</summary>" +
      '<section class="ml-detail-sec"><h2>' +
      esc(t("thoughtAbout")) +
      "</h2><p>" +
      esc(mThought(m)) +
      "</p><p>" +
      esc(mDid(m)) +
      "</p></section>" +
      "</details>" +
      '<section class="ml-detail-sec ml-detail-hard"><h2>' +
      esc(t("hardPart")) +
      "</h2><p>" +
      esc(mStruggle(m)) +
      "</p></section>" +
      (lab
        ? '<section class="ml-detail-sec ml-tryit"><h2>' +
          esc(t("tryIt")) +
          "</h2><p>" +
          esc(lab.tryIt.prompt) +
          "</p><details><summary>" +
          esc(t("showMe")) +
          "</summary><p>" +
          esc(lab.tryIt.answer) +
          "</p></details></section>"
        : "") +
      enrichment +
      '<div class="ml-actions ml-actions-sticky">' +
      '<button class="ml-btn ml-btn-go" type="button" data-choose="' +
      esc(m.id) +
      '">' +
      esc(t("workWith")) +
      " " +
      esc(m.name) +
      "</button>" +
      '<button class="ml-btn ml-btn-quiet" type="button" data-back="1">' +
      esc(t("seeSomeone")) +
      "</button>" +
      "</div>";
  }

  function renderDone(id) {
    var m = R.getMentor(id);
    if (!m) return;
    var lab = R.getLab(m.lab);
    var host = $("ml-done");
    if (!host) return;
    host.style.setProperty("--ml-color", lab ? lab.color : "#334155");
    host.innerHTML =
      '<div class="ml-done-burst" aria-hidden="true"></div>' +
      '<div class="ml-done-med" aria-hidden="true">' +
      av(m, lab, 124) +
      "</div>" +
      '<p class="ml-eyebrow">' +
      esc(t("youWork")) +
      "</p>" +
      '<h1 id="ml-h5">' +
      esc(m.name) +
      "</h1>" +
      '<p class="ml-done-lab"><span aria-hidden="true">' +
      esc(lab ? lab.emblem : "") +
      "</span> " +
      esc(lab ? labField(lab, "name") : "") +
      "</p>" +
      '<p class="ml-done-move">' +
      esc(lab ? labField(lab, "move") : "") +
      "</p>" +
      '<p class="ml-done-note">' +
      esc(t("doneNote")) +
      "</p>" +
      '<div class="ml-actions">' +
      '<a class="ml-btn ml-btn-go" href="/curriculum/">' +
      esc(t("goLessons")) +
      "</a>" +
      '<button class="ml-btn ml-btn-quiet" type="button" data-go="2">' +
      esc(t("changeIt")) +
      "</button>" +
      "</div>";
  }

  function renderWelcome() {
    var choice = readChoice();
    var hero = $("ml-hero");
    var cur = $("ml-current");
    if (!choice || !choice.id || !R.getMentor(choice.id)) {
      if (hero) hero.hidden = false;
      if (cur) cur.hidden = true;
      return;
    }
    var m = R.getMentor(choice.id);
    var lab = R.getLab(m.lab);
    if (hero) hero.hidden = true;
    if (cur) {
      cur.hidden = false;
      cur.style.setProperty("--ml-color", lab ? lab.color : "#334155");
    }
    var medHost = $("ml-current-med");
    if (medHost) medHost.innerHTML = av(m, lab, 72);
    var name = $("ml-current-name");
    if (name) name.textContent = m.name;
    var labEl = $("ml-current-lab");
    if (labEl) labEl.textContent = lab ? labField(lab, "name") + " · " + labField(lab, "move") : "";
  }

  /* ── language ──────────────────────────────────────────────────────────── */

  function applyLang() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (T[lang] && T[lang][key] != null) nodes[i].innerHTML = T[lang][key];
    }
    var universeCopy = document.querySelectorAll("[data-mu-en][data-mu-es]");
    for (var u = 0; u < universeCopy.length; u++) {
      universeCopy[u].textContent = universeCopy[u].getAttribute(
        lang === "es" ? "data-mu-es" : "data-mu-en",
      );
    }
    var btns = document.querySelectorAll("[data-lang]");
    for (var k = 0; k < btns.length; k++) {
      var on = btns[k].getAttribute("data-lang") === lang;
      btns[k].classList.toggle("is-on", on);
      btns[k].setAttribute("aria-pressed", on ? "true" : "false");
    }
    // Re-render anything already on screen so it follows the language.
    heroStrip();
    renderLabs();
    renderWelcome();
    if (selectedLab) renderMatches(selectedLab);
    if (viewing) renderDetail(viewing.id);
    renderAll();
    renderUniverseState();
    var lessons = window.__NT_MENTOR_LESSONS || [];
    if ($("mu-lesson-select") && lessons.length) {
      for (var n = 0; n < lessons.length; n++) {
        if (lessons[n].id === $("mu-lesson-select").value) renderMoment(lessons[n]);
      }
    }
  }

  /* ── collecting moves ──────────────────────────────────────────────────────
   * A move is collected by PRACTISING it — opening a lab's Try-It and working
   * the 10-second task. Not by mastering a lesson: the mentor's own lab is
   * already granted at selection, so tying collection to mastery would grant
   * nothing while looking like progress. This is the only path that adds moves,
   * and it is the only place a student actually does the thinking involved.
   */
  function collectMove(labId) {
    if (!labId) return;
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var st = raw ? JSON.parse(raw) : null;
      if (!st || !st.id) return; // no mentor yet — nothing to collect against
      var moves = Array.isArray(st.moves) ? st.moves : [];
      if (moves.indexOf(labId) !== -1) return;
      moves.push(labId);
      st.moves = moves;
      localStorage.setItem(STORE_KEY, JSON.stringify(st));
      var lab = R.getLab(labId);
      announce((lab ? labField(lab, "move") : "") + " — " + moves.length + "/8");
    } catch (_e) {
      /* storage unavailable — practising still worked, it just is not recorded */
    }
  }

  function onToggle(ev) {
    // `toggle` does not bubble, so this listener is capturing (see boot).
    var d = ev.target;
    if (!d || d.tagName !== "DETAILS" || !d.open) return;
    if (!d.closest || !d.closest(".ml-tryit")) return;
    var lab = viewing ? viewing.lab : selectedLab;
    collectMove(lab);
  }

  /* ── events ────────────────────────────────────────────────────────────── */

  function onClick(ev) {
    var el = ev.target;
    if (!el || !el.closest) return;

    var langBtn = el.closest("[data-lang]");
    if (langBtn) {
      lang = langBtn.getAttribute("data-lang") === "es" ? "es" : "en";
      saveLang();
      applyLang();
      return;
    }

    if (el.closest("#ml-speak-toggle")) {
      setSpeak(!speakOn);
      if (speakOn) speak(t("readAloudHint"));
      return;
    }

    var profileCheck = el.closest("[data-mu-profile-check]");
    if (profileCheck && window.NTMentorUniverse) {
      var mentorId = profileCheck.getAttribute("data-mu-profile-check");
      var mentor = R.getMentor(mentorId);
      var input = document.querySelector('[data-mu-profile-answer="' + mentorId + '"]');
      var feedback = profileCheck.parentNode.querySelector(".mu-profile-feedback");
      var result = window.NTMentorUniverse.checkInteraction(mentor, input ? input.value : "", lang);
      if (feedback) {
        feedback.textContent = result.correct
          ? lang === "es"
            ? "Correcto. Explica qué hizo útil la estrategia."
            : "Correct. Explain what made the move useful."
          : result.hint;
      }
      if (result.correct) window.NTMentorUniverse.markExperience("profile-" + mentorId, mentor.lab);
      return;
    }

    // Read-aloud mode: tapping text reads it, and does nothing else.
    if (speakOn) {
      var readable = el.closest(
        ".ml-lede, .ml-sub, h1, h2, .ml-person-simple, .ml-person-name, .ml-detail-simple," +
          " .ml-detail-sec p, .ml-detail-move-line, .ml-lab-sounds, .ml-lab-move, .ml-labhead-move," +
          " .ml-labhead-blurb, .ml-done-note, .ml-done-move, .ml-foot p, .ml-word," +
          " .mu-section p, .mu-section h2, .mu-section h3, .mu-section summary",
      );
      if (readable && !el.closest("button,a,summary")) {
        speak(readable.textContent);
        return;
      }
    }

    var go = el.closest("[data-go]");
    if (go) {
      var step = go.getAttribute("data-go");
      if (step === "2") cameFromBrowse = false;
      show(step);
      if (step === "2") announce(t("moveTitle"));
      return;
    }

    if (el.closest("[data-browse]")) {
      cameFromBrowse = true;
      renderAll();
      show("browse");
      announce(t("allTitle"));
      return;
    }

    if (el.closest("[data-surprise]")) {
      var all = R.allMentors();
      // Index derived from the clock only — no Math.random, so a repeated tap
      // still moves, but nothing here depends on unpredictability.
      var pick = all[new Date().getTime() % all.length];
      cameFromBrowse = false;
      selectedLab = pick.lab;
      renderDetail(pick.id);
      show(4);
      announce(pick.name);
      return;
    }

    var labBtn = el.closest("[data-lab]");
    if (labBtn) {
      selectedLab = labBtn.getAttribute("data-lab");
      cameFromBrowse = false;
      renderMatches(selectedLab);
      show(3);
      announce(t("matchTitle"));
      return;
    }

    var person = el.closest("[data-mentor]");
    if (person) {
      renderDetail(person.getAttribute("data-mentor"));
      show(4);
      announce(viewing ? viewing.name : "");
      return;
    }

    if (el.closest("[data-back]")) {
      if (cameFromBrowse) show("browse");
      else if (selectedLab) show(3);
      else show(2);
      return;
    }

    var choose = el.closest("[data-choose]");
    if (choose) {
      var id = choose.getAttribute("data-choose");
      if (writeChoice(id)) {
        renderDone(id);
        show(5);
        var m = R.getMentor(id);
        announce(t("youWork") + " " + (m ? m.name : ""));
      } else {
        announce(t("saveFail"));
      }
      return;
    }
  }

  /* ── yearlong universe ───────────────────────────────────────────────── */

  function universeState() {
    return window.NTMentorUniverse ? window.NTMentorUniverse.load() : null;
  }

  function renderUniverseState() {
    var U = window.NTMentorUniverse;
    if (!U) return;
    var state = U.load();
    var studio = state.studio || {};
    if ($("mu-studio-move")) $("mu-studio-move").value = studio.move || "";
    if ($("mu-studio-when")) $("mu-studio-when").value = studio.when || "";

    var select = $("mu-week");
    if (select && !select.options.length) {
      for (var week = 1; week <= 36; week++) {
        var option = document.createElement("option");
        option.value = String(week);
        option.textContent = (lang === "es" ? "Semana " : "Week ") + week;
        select.appendChild(option);
      }
    }
    var grid = $("mu-week-grid");
    if (grid) {
      var weeks = (state.journey && state.journey.weeks) || {};
      var html = "";
      for (var w = 1; w <= 36; w++) {
        html +=
          '<li class="' +
          (weeks[String(w)] ? "is-done" : "") +
          '"><button type="button" data-mu-week="' +
          w +
          '" aria-label="' +
          (lang === "es" ? "Semana " : "Week ") +
          w +
          (weeks[String(w)] ? ", complete" : "") +
          '">' +
          w +
          "</button></li>";
      }
      grid.innerHTML = html;
    }

    var a = $("mu-mash-a");
    var b = $("mu-mash-b");
    if (a && !a.options.length) {
      for (var i = 0; i < R.labs.length; i++) {
        var lab = R.labs[i];
        var oa = document.createElement("option");
        oa.value = lab.id;
        oa.textContent = labField(lab, "name");
        a.appendChild(oa);
        b.appendChild(oa.cloneNode(true));
      }
      if (b.options.length > 1) b.selectedIndex = 1;
    }

    var investigations = $("mu-investigations");
    if (investigations) {
      investigations.innerHTML = Object.keys(U.investigations)
        .map(function (unit) {
          var item = U.investigations[unit];
          return (
            "<li><strong>" +
            (lang === "es" ? "Unidad " : "Unit ") +
            esc(unit) +
            "</strong> — " +
            esc(item[lang === "es" ? "es" : "en"]) +
            "</li>"
          );
        })
        .join("");
    }
  }

  function renderMoment(lesson) {
    var U = window.NTMentorUniverse;
    var host = $("mu-moment-card");
    if (!U || !host || !lesson) return;
    var moment = U.momentFor(lesson, lang);
    var lab = R.getLab(moment.lab);
    host.style.setProperty("--ml-color", lab ? lab.color : "#17324D");
    host.innerHTML =
      '<p class="ml-eyebrow">' +
      esc(lesson.id + " · " + (lab ? labField(lab, "name") : "")) +
      "</p><h3>" +
      esc(lesson.title) +
      "</h3><p>" +
      esc(moment.text) +
      '</p><a href="/lessons/' +
      esc(lesson.id) +
      '/">' +
      esc(lang === "es" ? "Abrir la lección" : "Open lesson") +
      "</a>";
  }

  function loadMoments() {
    var select = $("mu-lesson-select");
    if (!select || !window.fetch) return;
    fetch("/data/curriculum-launch-manifest.json")
      .then(function (response) {
        if (!response.ok) throw new Error("manifest " + response.status);
        return response.json();
      })
      .then(function (manifest) {
        var lessons = manifest && Array.isArray(manifest.lessons) ? manifest.lessons : [];
        window.__NT_MENTOR_LESSONS = lessons;
        select.innerHTML = lessons
          .map(function (lesson) {
            return (
              '<option value="' +
              esc(lesson.id) +
              '">' +
              esc(lesson.id + " · " + lesson.title) +
              "</option>"
            );
          })
          .join("");
        if (lessons.length) renderMoment(lessons[0]);
      })
      .catch(function () {
        select.innerHTML = "<option>The lesson list is unavailable.</option>";
      });
  }

  function universeClick(ev) {
    var target = ev.target;
    if (!target || !target.closest || !window.NTMentorUniverse) return;
    var weekButton = target.closest("[data-mu-week]");
    if (weekButton) {
      $("mu-week").value = weekButton.getAttribute("data-mu-week");
      var state = universeState();
      var saved = state.journey.weeks[$("mu-week").value];
      $("mu-week-note").value = saved ? saved.reflection || "" : "";
      $("mu-week-note").focus();
      return;
    }
    var check = target.closest("[data-mu-check]");
    if (!check) return;
    var kind = check.getAttribute("data-mu-check");
    if (kind === "switchboard") {
      var strategy = document.querySelector('input[name="mu-first"]:checked');
      var answer = $("mu-switch-answer").value.trim();
      var reflection = $("mu-switch-reflect").value.trim();
      var ok = !!strategy && answer === "21" && reflection.length >= 12;
      $("mu-switch-feedback").textContent = ok
        ? lang === "es"
          ? "Guardado. 25% es un cuarto, y 84 ÷ 4 = 21."
          : "Saved. 25% is one fourth, and 84 ÷ 4 = 21."
        : lang === "es"
          ? "Escoge una estrategia, escribe 21 y compárala con una segunda estrategia en una oración completa."
          : "Choose a first strategy, enter 21, and compare it with a second strategy in a full sentence.";
      if (ok) window.NTMentorUniverse.markExperience("strategy-switchboard", strategy.value);
      return;
    }
    if (kind === "archive-expression") {
      var choice = document.querySelector('input[name="mu-expression"]:checked');
      var value = choice ? choice.value : "";
      var feedback =
        lang === "es"
          ? {
              "7t-24": "Correcto: 7t es el costo de los siete boletos y después se resta un cupón de $24.",
              "7(t-24)": "Esto resta el cupón de $24 de cada boleto: siete cupones. El cupón se aplica una vez al total.",
              "24-7t": "Esto invierte las cantidades y puede producir un total negativo. El costo de los boletos va primero.",
              "t(7-24)": "Esto multiplica t por un número negativo. El 24 es un cupón fijo, no una cantidad de boletos.",
            }
          : {
              "7t-24": "Correct: 7t is the cost of all seven tickets, then one $24 coupon is subtracted.",
              "7(t-24)": "This subtracts the $24 coupon from every ticket—seven coupons. The coupon applies once to the total.",
              "24-7t": "This reverses the quantities and can make the total negative. The ticket cost comes first; the coupon reduces it.",
              "t(7-24)": "This multiplies t by a negative number. The 24 is a fixed coupon, not a number of tickets.",
            };
      $("mu-archive-feedback").textContent = feedback[value] || "Choose an expression so the archive can respond to your model.";
      $("mu-archive-revision").hidden = false;
      if (value === "7t-24") $("mu-revised-expression").value = "7t - 24";
      return;
    }
    if (kind === "archive-transfer") {
      var expression = $("mu-revised-expression").value.replace(/\s/g, "").toLowerCase();
      var evaluation = $("mu-evaluate").value.trim();
      var transfer = $("mu-transfer").value.replace(/\s/g, "").toLowerCase();
      var complete = expression === "7t-24" && evaluation === "60" && transfer === "5m-18";
      $("mu-archive-feedback").textContent = complete
        ? lang === "es"
          ? "Archivo completo: el modelo, la corrección, la evaluación y la transferencia coinciden."
          : "Archive complete: model, revision, evaluation, and transfer all agree."
        : lang === "es"
          ? "Corrige a 7t − 24. Cuando t = 12, usa 84 − 24. En la transferencia, cinco pases de m dólares van antes de un cupón de $18."
          : "Revise to 7t − 24. At t = 12, use 84 − 24. In the transfer, five m-dollar passes come before one $18 coupon.";
      if (complete) window.NTMentorUniverse.markExperience("discovery-archive-6-5", "7t-24");
      return;
    }
    if (kind === "mashup") {
      var first = $("mu-mash-a").value;
      var second = $("mu-mash-b").value;
      var note = $("mu-mash-note").value.trim();
      var mashOk = first !== second && note.length >= 20;
      $("mu-mash-feedback").textContent = mashOk
        ? lang === "es"
          ? "Guardado. Tu explicación usa dos estrategias distintas en una decisión."
          : "Saved. Your explanation uses two distinct moves on one decision."
        : lang === "es"
          ? "Escoge dos estrategias diferentes y explica el trabajo de cada una."
          : "Choose two different moves and explain the job each one does.";
      if (mashOk) window.NTMentorUniverse.markExperience("mentor-mash-up", first + "+" + second);
    }
  }

  function bootUniverse() {
    if (!window.NTMentorUniverse) return;
    renderUniverseState();
    loadMoments();
    var form = $("mu-studio-form");
    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        window.NTMentorUniverse.update(function (state) {
          state.studio = {
            move: $("mu-studio-move").value.trim(),
            when: $("mu-studio-when").value.trim(),
            updatedAt: new Date().toISOString(),
          };
        });
        $("mu-studio-status").textContent =
          lang === "es" ? "Tu tarjeta se guardó en este dispositivo." : "Your strategy card is saved on this device.";
      });
    }
    if ($("mu-save-week")) {
      $("mu-save-week").addEventListener("click", function () {
        window.NTMentorUniverse.markWeek($("mu-week").value, $("mu-week-note").value);
        renderUniverseState();
      });
    }
    if ($("mu-lesson-select")) {
      $("mu-lesson-select").addEventListener("change", function () {
        var lessons = window.__NT_MENTOR_LESSONS || [];
        for (var i = 0; i < lessons.length; i++) {
          if (lessons[i].id === $("mu-lesson-select").value) renderMoment(lessons[i]);
        }
      });
    }
    document.addEventListener("click", universeClick);
  }

  /* ── boot ──────────────────────────────────────────────────────────────── */

  function boot() {
    R = window.NTMentorRoster;
    if (!R || !R.__loaded) {
      var live = $("ml-live");
      if (live) {
        live.textContent = t("failed");
        live.className = "ml-error";
      }
      return;
    }
    loadLang();
    applyLang();
    show(1);
    bootUniverse();
    document.addEventListener("click", onClick);
    // `toggle` does not bubble — capture it at the document instead.
    document.addEventListener("toggle", onToggle, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
