/* ===========================================================================
   Neft Teacher · Graphic-Novel Engine  ·  gn-engine.js
   Renders a STORY object (window.GN_STORY) into a panel-based, dialogue-driven
   comic. One engine, 20 novels. No build step needed at runtime; fully offline.

   STORY shape is documented in story.schema.md. Key contracts preserved for the
   existing Neft results pipeline (do NOT rename):
     • each math choice group is a .choices container holding .choice buttons
     • a solved choice's correct button gets class "correct"
     • the master-rank group has id="choicesComplete" (excluded from scoring)
     • the finish scene is #scene-complete and gets classes show/active when done
   The nt-results.js tracker at the bottom of each file reads exactly those.
   =========================================================================== */
(function () {
  "use strict";
  var S = window.GN_STORY;
  if (!S) {
    console.error("GN: window.GN_STORY missing");
    return;
  }

  /* ---------- tiny helpers ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function $(id) {
    return document.getElementById(id);
  }
  function art(file) {
    return (S.meta.artBase || "") + file;
  }
  function txt(v) {
    return v == null ? "" : v;
  }

  /* Read-aloud (text-to-speech) via the Web Speech API. Offline, no assets. */
  var TTS = (function () {
    var synth = window.speechSynthesis;
    function speak(text, lang) {
      if (!synth) return;
      synth.cancel();
      var u = new SpeechSynthesisUtterance(
        String(text).replace(/<[^>]+>/g, ""),
      );
      u.lang = lang === "es" ? "es-ES" : "en-US";
      u.rate = 0.95;
      synth.speak(u);
    }
    return { available: !!synth, speak: speak };
  })();

  /* Interaction + feature extensibility seams. */
  var INTERACTIONS = {}; // name -> { render(step, groupEl, onSolve) }  (must emit .choices/.choice.correct on solve)

  INTERACTIONS["evidence"] = {
    render: function (step, groupEl) {
      groupEl.classList.add("evidence");
      step.choices.forEach(function (c) {
        var b = el(
          "button",
          "choice ev",
          "&#128206; " +
            c.en +
            (c.es ? '<span class="es">' + c.es + "</span>" : ""),
        );
        b.dataset.correct = !!c.correct;
        groupEl.appendChild(b);
      });
    },
  };
  INTERACTIONS["sequence"] = {
    render: function (step, groupEl, onSolve) {
      groupEl.classList.add("sequence");
      var list = el("ol", "seq-list");
      // present in a shuffled-but-deterministic order so the answer isn't given away
      var order = step.items.map(function (_, i) {
        return i;
      });
      order.sort(function (a, b) {
        return (
          ((a * 7 + 3) % step.items.length) - ((b * 7 + 3) % step.items.length)
        );
      });
      order.forEach(function (idx) {
        var li = el("li", "seq-card");
        li.draggable = true;
        li.dataset.idx = idx;
        li.tabIndex = 0;
        li.innerHTML =
          '<span class="seq-h" aria-hidden="true">&#8942;</span>' +
          '<span class="seq-t">' +
          step.items[idx].en +
          (step.items[idx].es
            ? '<span class="es">' + step.items[idx].es + "</span>"
            : "") +
          "</span>" +
          '<span class="seq-ctl">' +
          '<button class="seq-up" type="button" aria-label="Move up">&#9650;</button>' +
          '<button class="seq-down" type="button" aria-label="Move down">&#9660;</button>' +
          "</span>";
        list.appendChild(li);
      });
      var btn = el("button", "next seq-check", "Check order");
      btn.type = "button";
      groupEl.appendChild(list);
      groupEl.appendChild(btn);

      function moveUp(li) {
        if (li.previousElementSibling)
          list.insertBefore(li, li.previousElementSibling);
      }
      function moveDown(li) {
        if (li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
      }
      list.addEventListener("click", function (e) {
        var up = e.target.closest(".seq-up"),
          dn = e.target.closest(".seq-down");
        if (up) moveUp(up.closest("li"));
        if (dn) moveDown(dn.closest("li"));
      });
      list.addEventListener("keydown", function (e) {
        var li = e.target.closest && e.target.closest("li");
        if (!li) return;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          moveUp(li);
          li.focus();
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          moveDown(li);
          li.focus();
        }
      });
      var dragged = null;
      list.addEventListener("dragstart", function (e) {
        dragged = e.target.closest("li");
      });
      list.addEventListener("dragover", function (e) {
        e.preventDefault();
        var li = e.target.closest("li");
        if (li && li !== dragged)
          list.insertBefore(dragged, li.nextSibling || li);
      });
      var solved = false;
      btn.addEventListener("click", function () {
        if (solved) return;
        var idxs = Array.prototype.map.call(list.children, function (li) {
          return +li.dataset.idx;
        });
        var ok = true;
        for (var i = 1; i < idxs.length; i++)
          if (step.items[idxs[i]].order < step.items[idxs[i - 1]].order)
            ok = false;
        if (ok) {
          solved = true;
          var mark = el("button", "choice correct");
          mark.style.display = "none";
          mark.dataset.correct = "true";
          groupEl.appendChild(mark);
          btn.disabled = true;
          list.classList.add("solved");
          if (onSolve) onSolve();
        } else {
          list.classList.add("nudge");
          setTimeout(function () {
            list.classList.remove("nudge");
          }, 500);
        }
      });
    },
  };
  var FEATURES = []; // [{ onBeat(beat,ctx), onSolve(step,ctx), onComplete(ctx) }]
  function fire(hook, a, b) {
    FEATURES.forEach(function (f) {
      if (f[hook])
        try {
          f[hook](a, b);
        } catch (e) {}
    });
  }
  function isComprehension(step) {
    return step.type === "comprehension";
  }
  var SKILLS = {
    vocab_in_context: "Vocabulary in Context",
    main_idea: "Determine Main Idea",
    key_details: "Key Details",
    sequence: "Sequence / Cause & Effect",
    inference: "Make an Inference",
    cite_evidence: "Cite Text Evidence",
    prediction: "Make a Prediction",
  };
  function SKILL_LABEL(k) {
    return SKILLS[k] || "Reading";
  }

  /* Per-unit signature colors so each world looks distinct (the comic shell is
     shared, but the accent/ink differ by unit; version 2 gets a deeper accent). */
  var UNIT_ACCENT = {
    1: "#1d4ed8",
    2: "#b42318",
    3: "#0d9488",
    4: "#7c3aed",
    5: "#ea580c",
    6: "#db2777",
    7: "#334155",
    8: "#047857",
    9: "#b45309",
    10: "#0891b2",
  };

  /* ---------- theme + document chrome ---------- */
  function applyTheme() {
    document.documentElement.lang = "en";
    document.title =
      "Graphic Novel #" + S.meta.version + " · " + stripTags(S.meta.title);
    var r = document.documentElement;
    var accent = UNIT_ACCENT[S.meta.unit] || "#1d4ed8";
    r.style.setProperty("--accent", accent);
    // Enrichment (#2) reads a touch deeper/darker so the two versions differ.
    if (S.meta.version === 2) r.style.setProperty("--accent2", "#0f172a");
    if (S.meta.theme) {
      Object.keys(S.meta.theme).forEach(function (k) {
        r.style.setProperty(k, S.meta.theme[k]);
      });
    }
  }
  function stripTags(s) {
    return String(s).replace(/<[^>]+>/g, "");
  }

  /* ---------- speaker rendering (optional avatar slot) ---------- */
  function speaker(id) {
    return (
      (S.cast && S.cast[id]) || { name: id, color: "#c2461d", avatar: null }
    );
  }
  /* Resolve a character portrait URL. Explicit avatar wins; otherwise auto-derive
     from the convention /graphic-novels/_art/characters/u{unit}-{key}.png so no
     per-story edits are needed. Narrators have no portrait. */
  function avatarSrc(spkId) {
    var c = speaker(spkId);
    if (c.avatar) {
      return c.avatar.charAt(0) === "/" || c.avatar.indexOf("../") === 0
        ? c.avatar
        : art(c.avatar);
    }
    if (c.role === "narrator") return null;
    return (
      "/graphic-novels/_art/characters/u" + S.meta.unit + "-" + spkId + ".png"
    );
  }
  function whoTag(spkId, isMe) {
    var c = speaker(spkId);
    var initial = (c.tagIcon || c.name.charAt(0)).toString();
    var src = avatarSrc(spkId);
    var inner = src
      ? '<span class="av"><img src="' +
        src +
        '" alt="" loading="lazy" onerror="this.parentNode.textContent=\'' +
        initial.replace(/'/g, "") +
        "'\" /></span>"
      : '<span class="av" aria-hidden="true">' + initial + "</span>";
    return (
      '<span class="who" style="--spk:' +
      (c.color || "#c2461d") +
      '">' +
      inner +
      "<span>" +
      c.name +
      "</span>" +
      (isMe || c.role === "protagonist"
        ? '<span class="me">· YOU</span>'
        : "") +
      "</span>"
    );
  }

  /* ---------- vocab markup: wrap term occurrences with a tappable tag ----------
     A beat/challenge may carry vocab:[{term,en,es}]. We wrap the FIRST literal
     occurrence of term in the English text. Definitions open in a popover. */
  var VOCAB_STORE = [];
  function injectVocab(htmlEn, vocab) {
    if (!vocab || !vocab.length) return htmlEn;
    vocab.forEach(function (v) {
      var i = VOCAB_STORE.push(v) - 1;
      var re = new RegExp("(" + escapeRe(v.term) + ")", "i");
      htmlEn = htmlEn.replace(
        re,
        '<button type="button" class="vocab-tag" data-vocab="' +
          i +
          '" aria-label="Definition of ' +
          stripTags(v.term) +
          '">$1</button>',
      );
    });
    return htmlEn;
  }
  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* ---------- popover (vocab + callout) ---------- */
  function openPop(anchor, title, en, es) {
    closePop();
    var back = el("div", "gn-pop-back");
    back.id = "gn-pop-back";
    back.addEventListener("click", closePop);
    var p = el("div", "gn-pop");
    p.id = "gn-pop";
    p.setAttribute("role", "dialog");
    p.setAttribute("aria-label", stripTags(title || "Definition"));
    p.innerHTML =
      '<button class="x" aria-label="Close">&times;</button>' +
      (title ? "<h4>" + title + "</h4>" : "") +
      '<div class="en">' +
      en +
      "</div>" +
      (es ? '<div class="es">' + es + "</div>" : "");
    document.body.appendChild(back);
    document.body.appendChild(p);
    p.querySelector(".x").addEventListener("click", closePop);
    // position near anchor, clamped to viewport
    var r = anchor.getBoundingClientRect();
    var pw = Math.min(280, window.innerWidth - 20);
    p.style.width = pw + "px";
    var left = Math.min(Math.max(10, r.left), window.innerWidth - pw - 10);
    var top = r.bottom + 8;
    if (top + p.offsetHeight > window.innerHeight - 10) {
      top = Math.max(10, r.top - p.offsetHeight - 8);
    }
    p.style.left = left + "px";
    p.style.top = top + "px";
    p.querySelector(".x").focus();
  }
  function closePop() {
    var a = $("gn-pop"),
      b = $("gn-pop-back");
    if (a) a.remove();
    if (b) b.remove();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePop();
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".vocab-tag");
    if (t) {
      var v = VOCAB_STORE[+t.dataset.vocab];
      if (v) openPop(t, v.term, v.en, v.es);
    }
  });

  /* ---------- bubble builder ----------
     Returns a fragment: the speaking character's large "stage" portrait pinned
     to the panel (for non-narrator beats) + the speech bubble itself. */
  function bubble(beat) {
    var c = speaker(beat.who);
    var isCap = c.role === "narrator" || beat.caption;
    var pos = beat.pos || (c.role === "protagonist" ? "right" : "left");
    var frag = document.createDocumentFragment();

    if (!isCap) {
      var src = avatarSrc(beat.who);
      if (src) {
        var fig = el("img", "speaker-fig " + pos);
        fig.src = src;
        fig.alt = c.name;
        fig.setAttribute("aria-hidden", "true");
        fig.onerror = function () {
          fig.remove();
        };
        frag.appendChild(fig);
      }
    }

    var b = el(
      "div",
      "bubble " +
        pos +
        (isCap ? " caption" : "") +
        (beat.misconception ? " misc" : ""),
    );
    var en = injectVocab(txt(beat.en), beat.vocab);
    b.innerHTML =
      whoTag(beat.who) +
      '<div class="en">' +
      en +
      "</div>" +
      (beat.es ? '<div class="es">' + beat.es + "</div>" : "");
    if (TTS.available) {
      var ctl =
        '<span class="tts">' +
        '<button class="tts-btn" type="button" data-tts-en aria-label="Read aloud">&#128266;</button>' +
        (beat.es
          ? '<button class="tts-btn" type="button" data-tts-es aria-label="Leer en voz alta">ES</button>'
          : "") +
        "</span>";
      b.insertAdjacentHTML("beforeend", ctl);
      b.querySelector("[data-tts-en]").addEventListener("click", function (e) {
        e.stopPropagation();
        TTS.speak(beat.en, "en");
      });
      if (beat.es)
        b.querySelector("[data-tts-es]").addEventListener(
          "click",
          function (e) {
            e.stopPropagation();
            TTS.speak(beat.es, "es");
          },
        );
    }
    frag.appendChild(b);
    return frag;
  }

  /* =========================================================================
     BUILD DOM
     ========================================================================= */
  var SCENE_IDS = []; // cover, act ids..., gloss

  function build() {
    applyTheme();
    document.body.appendChild(buildTopbar());
    var main = el("main");
    main.appendChild(buildCover());
    S.acts.forEach(function (act, i) {
      main.appendChild(buildAct(act, i));
    });
    main.appendChild(buildComplete());
    main.appendChild(buildGloss());
    document.body.appendChild(main);
    wireTabs();
    buildGlossList();
    refreshLocks();
    updateProgress();
    showScene("cover");
  }

  function buildTopbar() {
    var bar = el("div", "topbar");
    var inner = el("div", "topbar-inner");
    inner.innerHTML =
      '<span class="title"><span class="v">#' +
      S.meta.version +
      "</span> " +
      S.meta.title +
      "</span>" +
      '<div class="progress-wrap"><div class="progress" role="progressbar" ' +
      'aria-label="Mission progress" aria-valuemin="0" aria-valuemax="100" ' +
      'aria-valuenow="0"><i id="bar"></i></div>' +
      '<span class="progress-label" id="plabel">0%</span></div>' +
      '<button class="txtsize" id="txtsize" aria-label="Change text size" ' +
      'title="Text size">A+</button>';
    bar.appendChild(inner);

    var tabs = el("div", "tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Chapters");
    tabs.appendChild(tabBtn("cover", "Cover", false));
    S.acts.forEach(function (a, i) {
      tabs.appendChild(tabBtn(a.id, a.tab, i > 0));
    });
    tabs.appendChild(tabBtn("gloss", "Glossary", false));
    bar.appendChild(tabs);
    return bar;
  }
  function tabBtn(scene, label, locked) {
    var b = el("button", "tab" + (locked ? " locked" : ""));
    b.id = "tab-" + scene;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", scene === "cover" ? "true" : "false");
    b.dataset.scene = scene;
    b.dataset.label = label;
    b.innerHTML = (locked ? '<span class="lk">&#128274;</span> ' : "") + label;
    return b;
  }

  function buildCover() {
    var s = el("section", "scene active cover-card");
    s.id = "scene-cover";
    s.setAttribute("role", "tabpanel");
    s.setAttribute("aria-labelledby", "tab-cover");
    SCENE_IDS.push("cover");
    var cv = S.cover;
    var castChips = "";
    Object.keys(S.cast || {}).forEach(function (k) {
      var c = S.cast[k];
      if (c.role === "narrator") return;
      var psrc = avatarSrc(k);
      var initial = (c.tagIcon || c.name.charAt(0)).toString();
      var av = psrc
        ? '<span class="av" style="background:' +
          c.color +
          '"><img src="' +
          psrc +
          '" alt="" onerror="this.parentNode.textContent=\'' +
          initial.replace(/'/g, "") +
          "'\"></span>"
        : '<span class="av" style="background:' +
          c.color +
          '">' +
          initial +
          "</span>";
      castChips +=
        '<span class="cast-chip">' +
        av +
        "<b>" +
        c.name +
        "</b> <span>" +
        (c.blurb || c.role) +
        "</span></span>";
    });
    s.innerHTML =
      '<div class="panel"><img src="' +
      art(cv.art) +
      '" alt="' +
      txt(cv.alt) +
      '"></div>' +
      '<span class="level-pill">Graphic Novel #' +
      S.meta.version +
      " &middot; " +
      S.meta.level +
      "</span>" +
      "<h2>" +
      S.meta.title +
      "</h2>" +
      "<p>" +
      cv.blurbEn +
      "</p>" +
      (cv.blurbEs
        ? '<p style="font-size:0.92rem"><i>' + cv.blurbEs + "</i></p>"
        : "") +
      '<div class="cast-row">' +
      castChips +
      "</div>" +
      '<button class="start" id="start-btn">' +
      (cv.startLabel || "Start &#128640;") +
      "</button>";
    s.querySelector("#start-btn").addEventListener("click", function () {
      showScene(S.acts[0].id);
    });
    return s;
  }

  function buildAct(act, idx) {
    var s = el("section", "scene");
    s.id = "scene-" + act.id;
    s.setAttribute("role", "tabpanel");
    s.setAttribute("aria-labelledby", "tab-" + act.id);
    SCENE_IDS.push(act.id);

    var lock = el("div", "locked-note");
    lock.id = "lock-" + act.id;
    lock.innerHTML =
      "&#128274; Finish the previous chapter to unlock " +
      stripTags(act.title) +
      ".";
    s.appendChild(lock);

    var body = el("div");
    body.id = "body-" + act.id;
    body.innerHTML =
      '<div class="scene-head"><span class="act">' +
      act.kicker +
      "</span><h2>" +
      act.title +
      "</h2></div>" +
      '<div class="panel" id="panel-' +
      act.id +
      '">' +
      '<img id="art-' +
      act.id +
      '" src="" alt="">' +
      '<div class="speech" id="speech-' +
      act.id +
      '" aria-live="polite"></div></div>' +
      '<div class="dlg-row"><div class="dots" id="dots-' +
      act.id +
      '"></div>' +
      '<button class="next" id="next-' +
      act.id +
      '">Next &#9654;</button></div>' +
      '<div id="chal-' +
      act.id +
      '"></div>' +
      '<div class="scene-foot"><button class="advance" id="adv-' +
      act.id +
      '">' +
      (act.advanceLabel || "Continue &#9654;") +
      "</button></div>";
    s.appendChild(body);
    return s;
  }

  function buildComplete() {
    var s = el("section", "scene complete");
    s.id = "scene-complete";
    s.setAttribute("role", "tabpanel");
    s.setAttribute("aria-label", "Mission complete");
    var cp = S.complete;
    var html =
      '<div class="panel"><img src="' +
      art(cp.art) +
      '" alt="' +
      txt(cp.alt) +
      '"></div>' +
      '<span class="badge-done">' +
      (cp.badge || "&#127881;") +
      "</span>" +
      "<h2>" +
      (cp.titleEn || "Mission Complete!") +
      "</h2>" +
      "<p>" +
      cp.en +
      "</p>" +
      '<p style="color:var(--muted);font-size:0.92rem"><i>' +
      cp.es +
      "</i></p>";
    if (cp.master) {
      var m = cp.master,
        ch = "";
      m.choices.forEach(function (c) {
        ch +=
          '<button class="choice" data-correct="' +
          !!c.correct +
          '">' +
          c.en +
          (c.es ? '<span class="es">' + c.es + "</span>" : "") +
          "</button>";
      });
      html +=
        '<div class="challenge bonus" id="chalComplete">' +
        '<span class="bonus-tag">&#127942; MASTER RANK CHALLENGE</span>' +
        "<h3>" +
        (m.headingEn || "Prove your rank!") +
        "</h3>" +
        '<p class="prompt">' +
        m.promptEn +
        '<span class="es">' +
        m.promptEs +
        "</span></p>" +
        '<div class="choices" id="choicesComplete">' +
        ch +
        "</div>" +
        '<div class="feedback" id="fbComplete"></div></div>';
    }
    html +=
      '<button class="restart" id="restart-btn">Play again &#8635;</button>';
    s.innerHTML = html;
    return s;
  }

  function buildGloss() {
    var s = el("section", "scene");
    s.id = "scene-gloss";
    s.setAttribute("role", "tabpanel");
    s.setAttribute("aria-labelledby", "tab-gloss");
    SCENE_IDS.push("gloss");
    s.innerHTML =
      '<div class="scene-head"><span class="act">Reference</span>' +
      "<h2>Glossary &middot; Word Bank</h2></div>" +
      '<div class="gloss" id="gloss-list"></div>';
    return s;
  }
  function buildGlossList() {
    var list = $("gloss-list");
    (S.glossary || []).forEach(function (g) {
      var d = el("div", "term");
      d.innerHTML =
        '<div class="ico">' +
        g.ico +
        "</div><div><h3>" +
        g.en +
        ' <span class="es-term">(' +
        g.es +
        ")</span></h3><p>" +
        g.def +
        "</p></div>";
      list.appendChild(d);
    });
  }

  /* =========================================================================
     STATE + NAVIGATION
     ========================================================================= */
  var state = {};
  S.acts.forEach(function (a) {
    state[a.id] = false;
  });

  function updateProgress() {
    var done = 0;
    S.acts.forEach(function (a) {
      if (state[a.id]) done++;
    });
    var pct = Math.round((done / S.acts.length) * 100);
    $("bar").style.width = pct + "%";
    $("plabel").textContent = pct + "%";
    document.querySelector(".progress").setAttribute("aria-valuenow", pct);
  }

  function refreshLocks() {
    S.acts.forEach(function (a, i) {
      if (i === 0) return;
      var prevDone = state[S.acts[i - 1].id];
      setLock("tab-" + a.id, !prevDone, a.tab);
      $("lock-" + a.id).classList.toggle("show", !prevDone);
      $("body-" + a.id).style.display = prevDone ? "" : "none";
    });
  }
  function setLock(tabId, locked, label) {
    var t = $(tabId);
    if (!t) return;
    t.classList.toggle("locked", locked);
    t.innerHTML = (locked ? '<span class="lk">&#128274;</span> ' : "") + label;
  }

  function showScene(name) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    SCENE_IDS.forEach(function (s) {
      var sc = $("scene-" + s);
      if (sc) sc.classList.toggle("active", s === name);
      var tab = $("tab-" + s);
      if (tab) tab.setAttribute("aria-selected", s === name ? "true" : "false");
    });
    var cmp = $("scene-complete");
    cmp.classList.remove("active", "show");
    // (re)start the act's flow when entered
    var act = findAct(name);
    if (act && state.__started !== name) {
      state.__started = name;
      runAct(act);
    }
    closePop();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function findAct(id) {
    for (var i = 0; i < S.acts.length; i++)
      if (S.acts[i].id === id) return S.acts[i];
    return null;
  }
  function showComplete() {
    SCENE_IDS.forEach(function (s) {
      var sc = $("scene-" + s);
      if (sc) sc.classList.remove("active");
    });
    document.querySelectorAll(".tab").forEach(function (t) {
      t.setAttribute("aria-selected", "false");
    });
    var c = $("scene-complete");
    c.classList.add("active", "show");
    wireMaster();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function wireTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        if (tab.classList.contains("locked")) return;
        showScene(tab.dataset.scene);
      });
      tab.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(tab);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          (tabs[i + 1] || tabs[0]).focus();
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          (tabs[i - 1] || tabs[tabs.length - 1]).focus();
        }
      });
    });
    $("txtsize").addEventListener("click", cycleTextSize);
    $("restart-btn") &&
      $("restart-btn").addEventListener("click", function () {
        location.reload();
      });
  }
  function cycleTextSize() {
    var order = ["", "lg", "xl"],
      cur = document.body.dataset.text || "";
    var nxt = order[(order.indexOf(cur) + 1) % order.length];
    if (nxt) document.body.dataset.text = nxt;
    else delete document.body.dataset.text;
    $("txtsize").textContent = nxt === "lg" ? "A++" : nxt === "xl" ? "A" : "A+";
  }

  /* =========================================================================
     ACT RUNNER — plays an act's ordered steps:
       { type:"beats", art, alt, beats:[...] }   → panel + sequential bubbles
       { type:"challenge", ... }                 → voiced math, reply choices
     ========================================================================= */
  function runAct(act) {
    var stepIdx = 0;
    var imgEl = $("art-" + act.id);
    var speechEl = $("speech-" + act.id);
    var dotsEl = $("dots-" + act.id);
    var nextBtn = $("next-" + act.id);
    var chalHost = $("chal-" + act.id);
    var advBtn = $("adv-" + act.id);
    chalHost.innerHTML = "";

    function clearCallouts() {
      Array.prototype.slice
        .call($("panel-" + act.id).querySelectorAll(".callout"))
        .forEach(function (c) {
          c.remove();
        });
    }
    function setArt(file, alt) {
      if (file) {
        imgEl.src = art(file);
        imgEl.alt = txt(alt);
      }
    }

    function playStep() {
      var step = act.steps[stepIdx];
      if (!step) {
        advBtn.classList.add("show");
        return;
      }
      if (step.type === "beats") playBeats(step);
      else if (step.optional) playOptional(step);
      else playChallenge(step);
    }

    /* ---- beats ---- */
    function playBeats(step) {
      setArt(step.art, step.alt);
      clearCallouts();
      nextBtn.style.display = "";
      var bi = 0;
      dotsEl.innerHTML = "";
      step.beats.forEach(function () {
        dotsEl.appendChild(el("i"));
      });
      function renderBeat() {
        var beat = step.beats[bi];
        speechEl.innerHTML = "";
        speechEl.appendChild(bubble(beat));
        if (beat.callout) addCallout(beat.callout);
        Array.prototype.slice.call(dotsEl.children).forEach(function (d, k) {
          d.classList.toggle("on", k <= bi);
        });
        var last = bi === step.beats.length - 1;
        nextBtn.innerHTML = last
          ? step.lastLabel || "Continue &#9654;"
          : "Next &#9654;";
      }
      nextBtn.onclick = function () {
        if (bi < step.beats.length - 1) {
          bi++;
          renderBeat();
        } else {
          stepIdx++;
          playStep();
        }
      };
      renderBeat();
    }
    function addCallout(co) {
      var c = el("button", "callout", co.icon || "!");
      c.style.left = (co.x || 50) + "%";
      c.style.top = (co.y || 50) + "%";
      c.setAttribute("aria-label", "Callout: " + stripTags(co.en));
      c.addEventListener("click", function () {
        openPop(c, co.title || "", co.en, co.es);
      });
      $("panel-" + act.id).appendChild(c);
    }

    /* ---- challenge: gating (must solve to advance) ---- */
    function playChallenge(step) {
      renderCard(step, false);
      var onSolve = function () {
        if (step.solveArt) setArt(step.solveArt, step.solveAlt);
        if (step.solveBeat) {
          speechEl.innerHTML = "";
          speechEl.appendChild(bubble(step.solveBeat));
        }
        stepIdx++;
        // small beat so the success feedback is read before the next panel
        setTimeout(playStep, 400);
      };
      var grp = "choices-" + act.id + "-" + step.id;
      if (
        step.interaction &&
        step.interaction !== "mc" &&
        INTERACTIONS[step.interaction]
      ) {
        // render interaction FIRST so any .choice it creates exists for wireChoices
        INTERACTIONS[step.interaction].render(step, $(grp), onSolve);
      }
      wireChoices(step, act, onSolve);
    }

    /* ---- challenge: optional bonus (does NOT gate; still scored) ----
       Renders this and any consecutive optional steps, then reveals advance. */
    function playOptional(step) {
      renderCard(step, true);
      var onSolve = function () {
        if (step.solveBeat) {
          speechEl.innerHTML = "";
          speechEl.appendChild(bubble(step.solveBeat));
        }
      };
      var grp = "choices-" + act.id + "-" + step.id;
      if (
        step.interaction &&
        step.interaction !== "mc" &&
        INTERACTIONS[step.interaction]
      ) {
        // render interaction FIRST so any .choice it creates exists for wireChoices
        INTERACTIONS[step.interaction].render(step, $(grp), onSolve);
      }
      wireChoices(step, act, onSolve);
      stepIdx++;
      var nxt = act.steps[stepIdx];
      if (nxt && nxt.optional) playOptional(nxt);
      else advBtn.classList.add("show");
    }

    /* ---- shared challenge-card renderer ---- */
    function renderCard(step, optional) {
      if (step.art) setArt(step.art, step.alt);
      clearCallouts();
      nextBtn.style.display = "none";
      dotsEl.innerHTML = "";
      // the question is VOICED by a character, over the panel
      if (step.ask) {
        speechEl.innerHTML = "";
        speechEl.appendChild(
          bubble({
            who: step.ask.who,
            en: step.ask.en,
            es: step.ask.es,
            vocab: step.ask.vocab,
            misconception: step.ask.misconception,
            pos: step.ask.pos,
          }),
        );
        if (step.ask.callout) addCallout(step.ask.callout);
      }
      var wrap = el("div", "challenge" + (optional ? " bonus" : ""));
      wrap.id = "chal-" + act.id + "-" + step.id;
      if (optional) {
        wrap.innerHTML =
          '<span class="bonus-tag">' +
          (step.bonusTag || "&#11088; Bonus Challenge") +
          "</span>" +
          '<p class="prompt" style="font-size:0.82rem;color:var(--muted);' +
          'margin:6px 0">Optional — try it or press the button to move on.</p>';
      }
      var tools = '<div class="chal-tools">';
      if (step.hint) {
        tools +=
          '<button type="button" class="toolbtn" data-fold="hint-' +
          step.id +
          '" aria-expanded="false">&#128161; Need a hint?</button>';
      }
      if (step.frame) {
        tools +=
          '<button type="button" class="toolbtn" data-fold="coach-' +
          step.id +
          '" aria-expanded="false">&#9997;&#65039; Writing coach</button>';
      }
      tools += "</div>";
      var folds = "";
      if (step.hint) {
        folds +=
          '<div class="foldout" id="hint-' +
          step.id +
          '"><b>Hint:</b> ' +
          step.hint.en +
          (step.hint.es
            ? '<div class="es" style="margin-top:6px;' +
              'font-style:italic;color:#cdb89a">' +
              step.hint.es +
              "</div>"
            : "") +
          "</div>";
      }
      if (step.frame) {
        folds +=
          '<div class="foldout coach" id="coach-' +
          step.id +
          '"><b>Sentence frame:</b> ' +
          step.frame.en +
          (step.frame.es
            ? '<div class="es" style="margin-top:6px;font-style:' +
              'italic;color:#9fc0ef">' +
              step.frame.es +
              "</div>"
            : "") +
          "</div>";
      }
      var comp = isComprehension(step);
      var groupAttr = comp
        ? ' data-score-group="reading" data-standard="' +
          (step.standard || "") +
          '"'
        : "";
      var label = comp
        ? '<div class="reading-tag"><span class="rt-skill">' +
          SKILL_LABEL(step.skill) +
          "</span>" +
          '<span class="rt-std">' +
          (step.standard || "") +
          "</span>" +
          (step.dok ? '<span class="rt-dok">DOK ' + step.dok + "</span>" : "") +
          "</div>"
        : "";
      var choices =
        label +
        '<div class="reply-label">' +
        (comp ? "Choose the best answer" : "Choose your reply") +
        "</div>" +
        '<div class="choices" id="choices-' +
        act.id +
        "-" +
        step.id +
        '"' +
        groupAttr +
        ">";
      if (
        !step.interaction ||
        step.interaction === "mc" ||
        !INTERACTIONS[step.interaction]
      ) {
        step.choices.forEach(function (c) {
          choices +=
            '<button class="choice" data-correct="' +
            !!c.correct +
            '">' +
            c.en +
            (c.tree ? '<span class="tree">' + c.tree + "</span>" : "") +
            (c.es ? '<span class="es">' + c.es + "</span>" : "") +
            "</button>";
        });
      }
      choices += "</div>";
      wrap.innerHTML +=
        tools +
        folds +
        choices +
        '<div class="feedback" id="fb-' +
        act.id +
        "-" +
        step.id +
        '"></div>';
      chalHost.appendChild(wrap);
      wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      wireFolds(wrap);
    }

    playStep();

    /* advance button → unlock next chapter / finish */
    advBtn.onclick = function () {
      state[act.id] = true;
      updateProgress();
      refreshLocks();
      var i = S.acts.indexOf(act);
      if (i < S.acts.length - 1) showScene(S.acts[i + 1].id);
      else showComplete();
    };
  }

  function wireFolds(root) {
    Array.prototype.slice
      .call(root.querySelectorAll(".toolbtn"))
      .forEach(function (b) {
        b.addEventListener("click", function () {
          var f = $(b.dataset.fold);
          var open = f.classList.toggle("show");
          b.setAttribute("aria-expanded", open ? "true" : "false");
        });
      });
  }

  function wireChoices(step, act, onSolve) {
    var groupId = "choices-" + act.id + "-" + step.id;
    var fbId = "fb-" + act.id + "-" + step.id;
    var solved = false;
    Array.prototype.slice
      .call($(groupId).querySelectorAll(".choice"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (solved) return;
          var correct = btn.dataset.correct === "true";
          var fb = $(fbId);
          if (correct) {
            solved = true;
            btn.classList.add("correct");
            fb.className = "feedback show good";
            fb.innerHTML =
              (step.goodEn || "✓ Correct.") +
              (step.goodEs
                ? '<span class="es">' + step.goodEs + "</span>"
                : "");
            Array.prototype.slice
              .call($(groupId).querySelectorAll(".choice"))
              .forEach(function (b) {
                b.disabled = true;
              });
            if (onSolve) onSolve();
          } else {
            btn.classList.add("wrong");
            btn.disabled = true;
            fb.className = "feedback show bad";
            fb.innerHTML =
              (step.badEn || "Not quite — look back at the panel.") +
              (step.badEs ? '<span class="es">' + step.badEs + "</span>" : "");
          }
        });
      });
  }

  /* ---- master-rank challenge on the complete scene ---- */
  function wireMaster() {
    var group = $("choicesComplete");
    if (!group || group.dataset.wired) return;
    group.dataset.wired = "1";
    var fb = $("fbComplete");
    var solved = false;
    var m = S.complete.master || {};
    Array.prototype.slice
      .call(group.querySelectorAll(".choice"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (solved) return;
          var correct = btn.dataset.correct === "true";
          if (correct) {
            solved = true;
            btn.classList.add("correct");
            fb.className = "feedback show good";
            fb.style.display = "block";
            fb.innerHTML =
              m.goodEn ||
              "&#127942; <b>Master Rank Certified!</b> Perfect work! &#127775;";
            Array.prototype.slice
              .call(group.querySelectorAll(".choice"))
              .forEach(function (b) {
                b.disabled = true;
              });
            var h2 = document.querySelector("#scene-complete h2");
            if (h2 && m.certifyTitle) h2.innerHTML = m.certifyTitle;
          } else {
            btn.classList.add("wrong");
            btn.disabled = true;
            fb.className = "feedback show bad";
            fb.style.display = "block";
            fb.innerHTML =
              m.badEn || "&#10060; Not quite. Review and try another option!";
          }
        });
      });
  }

  /* ---------- go ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
