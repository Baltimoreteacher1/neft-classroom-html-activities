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

  /* ===========================================================================
     ENGAGEMENT LAYER (v2): sound, score stars, confetti, POW bursts, scratch
     pad, resume. Additive only — never touches the results-tracking contract
     (.choices / .choice.correct / #choicesComplete / #scene-complete).
     =========================================================================== */
  var RM =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PKEY =
    "ntgn:" + String(location.pathname || "").replace(/\/+$/, "").toLowerCase();

  function lsGet(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function lsSet(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }

  /* ---- score model: a "star" = a challenge solved on the FIRST try ---- */
  var SCORE = { total: 0, stars: 0, solved: {} };
  (S.acts || []).forEach(function (a) {
    (a.steps || []).forEach(function (st) {
      if (st.choices) SCORE.total++;
    });
  });
  var RESUMED = false;

  function updateHUD(bump) {
    var pill = $("gn-stars");
    if (!pill) return;
    pill.innerHTML = "⭐ " + SCORE.stars + "/" + SCORE.total;
    if (bump && !RM) {
      pill.classList.remove("bump");
      void pill.offsetWidth;
      pill.classList.add("bump");
    }
  }

  /* ---- synthesized sound (off by default, persisted, zero assets) ---- */
  var SND = { on: lsGet("ntgn:sound") === "on", ctx: null };
  function actx() {
    if (!SND.ctx) {
      try {
        SND.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return SND.ctx;
  }
  function tone(freq, dur, type, when, gain) {
    var c = actx();
    if (!c) return;
    var t = c.currentTime + (when || 0);
    var o = c.createOscillator(),
      g = c.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.16, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  function sfx(kind) {
    if (!SND.on) return;
    if (kind === "click") tone(420, 0.05, "square", 0, 0.05);
    else if (kind === "correct") {
      tone(660, 0.12, "sine", 0, 0.16);
      tone(990, 0.16, "sine", 0.1, 0.13);
    } else if (kind === "wrong") tone(150, 0.22, "sawtooth", 0, 0.09);
    else if (kind === "unlock") {
      tone(523, 0.1, "triangle", 0, 0.14);
      tone(784, 0.16, "triangle", 0.1, 0.14);
    } else if (kind === "win") {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(f, 0.24, "triangle", i * 0.12, 0.16);
      });
    }
  }

  /* ---- confetti burst (canvas; skipped under reduced-motion) ---- */
  function confetti(power) {
    if (RM) return;
    var cv = $("gn-confetti");
    if (!cv) {
      cv = el("canvas");
      cv.id = "gn-confetti";
      cv.setAttribute("aria-hidden", "true");
      document.body.appendChild(cv);
    }
    var ctx = cv.getContext("2d");
    var W = (cv.width = window.innerWidth),
      H = (cv.height = window.innerHeight);
    var colors = [
      "#f2b705",
      "#1d4ed8",
      "#b42318",
      "#047857",
      "#ff8a3d",
      "#3da5ff",
    ];
    var parts = [];
    for (var i = 0; i < (power || 120); i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.5,
        y: H * 0.32 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -11 - 4,
        g: 0.3 + Math.random() * 0.2,
        s: 6 + Math.random() * 7,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length],
      });
    }
    var frames = 0;
    (function tick() {
      frames++;
      ctx.clearRect(0, 0, W, H);
      var alive = false;
      parts.forEach(function (p) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        if (p.y < H + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (alive && frames < 240) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ---- POW! stamp on a panel for a correct answer ---- */
  function pow(panelEl, label) {
    if (!panelEl || RM) return;
    var p = el("div", "pow", label || "NICE!");
    panelEl.appendChild(p);
    setTimeout(function () {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 900);
  }

  /* ---- progress persistence (per page path; survives reloads) ---- */
  function saveProgress(extra) {
    var done = (S.acts || [])
      .filter(function (a) {
        return state[a.id];
      })
      .map(function (a) {
        return a.id;
      });
    var rec = {
      done: done,
      stars: SCORE.stars,
      total: SCORE.total,
      ts: Date.now(),
    };
    if (extra)
      Object.keys(extra).forEach(function (k) {
        rec[k] = extra[k];
      });
    lsSet(PKEY, JSON.stringify(rec));
  }
  function loadProgress() {
    try {
      return JSON.parse(lsGet(PKEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function nextActId() {
    for (var i = 0; i < S.acts.length; i++) {
      if (!state[S.acts[i].id]) return S.acts[i].id;
    }
    return null;
  }

  /* ---- scratch pad (canvas for showing math work) ---- */
  function openScratch() {
    var w = $("gn-scratch") || buildScratch();
    w.classList.add("show");
    var b = $("gn-scratch-btn");
    if (b) b.setAttribute("aria-expanded", "true");
    var cv = $("scratch-canvas");
    cv.width = cv.clientWidth;
    cv.height = cv.clientHeight;
    var ctx = cv.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1d4ed8";
  }
  function buildScratch() {
    var w = el("div", "scratch-wrap");
    w.id = "gn-scratch";
    w.innerHTML =
      '<div class="scratch-bar">' +
      '<span class="scratch-title">✏️ Scratch Pad — show your work</span>' +
      '<button class="iconbtn" id="scratch-clear">Clear</button>' +
      '<button class="iconbtn" id="scratch-close" aria-label="Close scratch pad">×</button>' +
      "</div>" +
      '<canvas id="scratch-canvas"></canvas>';
    document.body.appendChild(w);
    var cv = w.querySelector("#scratch-canvas");
    var ctx = cv.getContext("2d");
    var drawing = false;
    function pt(e) {
      var r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    cv.addEventListener("pointerdown", function (e) {
      drawing = true;
      var p = pt(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = pt(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      e.preventDefault();
    });
    window.addEventListener("pointerup", function () {
      drawing = false;
    });
    w.querySelector("#scratch-clear").onclick = function () {
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
    w.querySelector("#scratch-close").onclick = function () {
      w.classList.remove("show");
      var b = $("gn-scratch-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    };
    return w;
  }

  /* ---------- theme + document chrome ---------- */
  function applyTheme() {
    document.documentElement.lang = "en";
    document.title =
      "Graphic Novel #" + S.meta.version + " · " + stripTags(S.meta.title);
    if (S.meta.theme) {
      var r = document.documentElement;
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
  function whoTag(spkId, isMe) {
    var c = speaker(spkId);
    var inner;
    if (c.avatar) {
      inner =
        '<span class="av"><img src="' + art(c.avatar) + '" alt="" /></span>';
    } else {
      var initial = (c.tagIcon || c.name.charAt(0)).toString();
      inner = '<span class="av" aria-hidden="true">' + initial + "</span>";
    }
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

  /* ---------- bubble builder ---------- */
  function bubble(beat) {
    var c = speaker(beat.who);
    var isCap = c.role === "narrator" || beat.caption;
    var pos = beat.pos || (c.role === "protagonist" ? "right" : "left");
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
    return b;
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
    wireHUD();
    buildGlossList();
    restoreProgress();
    refreshLocks();
    updateProgress();
    updateHUD();
    showScene("cover");
  }

  /* restore previously-completed chapters so a returning student keeps unlocks */
  function restoreProgress() {
    var saved = loadProgress();
    if (!saved || !saved.done || !saved.done.length) return;
    saved.done.forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(state, id)) state[id] = true;
    });
    RESUMED = true;
    var note = $("resume-note");
    if (note) note.style.display = "";
    var cont = $("continue-btn");
    if (cont) {
      cont.style.display = "";
      cont.addEventListener("click", function () {
        sfx("click");
        var nid = nextActId();
        if (nid) showScene(nid);
        else showComplete();
      });
    }
  }

  function wireHUD() {
    var snd = $("gn-sound");
    if (snd)
      snd.addEventListener("click", function () {
        SND.on = !SND.on;
        lsSet("ntgn:sound", SND.on ? "on" : "off");
        this.setAttribute("aria-pressed", SND.on ? "true" : "false");
        this.innerHTML = SND.on ? "🔊" : "🔇";
        if (SND.on) {
          var c = actx();
          if (c && c.state === "suspended") c.resume();
          sfx("click");
        }
      });
    var scr = $("gn-scratch-btn");
    if (scr)
      scr.addEventListener("click", function () {
        var w = $("gn-scratch");
        if (w && w.classList.contains("show")) {
          w.classList.remove("show");
          this.setAttribute("aria-expanded", "false");
        } else {
          openScratch();
        }
      });
  }

  function buildTopbar() {
    var bar = el("div", "topbar");
    var inner = el("div", "topbar-inner");
    inner.innerHTML =
      '<a class="home" href="' +
      (S.meta.home || "../index.html") +
      '">&#8592; Home</a>' +
      '<span class="title"><span class="v">#' +
      S.meta.version +
      "</span> " +
      S.meta.title +
      "</span>" +
      '<div class="progress-wrap"><div class="progress" role="progressbar" ' +
      'aria-label="Mission progress" aria-valuemin="0" aria-valuemax="100" ' +
      'aria-valuenow="0"><i id="bar"></i></div>' +
      '<span class="progress-label" id="plabel">0%</span></div>' +
      '<div class="hud">' +
      '<span class="hud-stars" id="gn-stars" title="Stars earned by solving on the first try" aria-label="Stars earned">⭐ 0/' +
      SCORE.total +
      "</span>" +
      '<button class="iconbtn" id="gn-sound" aria-pressed="' +
      (SND.on ? "true" : "false") +
      '" aria-label="Toggle sound" title="Sound effects">' +
      (SND.on ? "🔊" : "🔇") +
      "</button>" +
      '<button class="iconbtn" id="gn-scratch-btn" aria-expanded="false" ' +
      'aria-label="Open scratch pad" title="Scratch pad — show your work">✏️</button>' +
      "</div>" +
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
      var av = c.avatar
        ? '<span class="av" style="background:' +
          c.color +
          '"><img src="' +
          art(c.avatar) +
          '" alt=""></span>'
        : '<span class="av" style="background:' +
          c.color +
          '">' +
          (c.tagIcon || c.name.charAt(0)) +
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
      (S.meta.standard
        ? '<span class="std-chip">Aligned to ' + S.meta.standard + "</span>"
        : "") +
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
      '<div class="start-row" style="display:flex;flex-wrap:wrap;gap:10px;' +
      'justify-content:center;align-items:center">' +
      '<button class="start" id="start-btn">' +
      (cv.startLabel || "Start &#128640;") +
      "</button>" +
      '<button class="continue-btn" id="continue-btn" style="display:none">↩ Continue</button>' +
      "</div>" +
      '<p class="resume-note" id="resume-note" style="display:none" role="status">' +
      "✓ Welcome back — your progress was saved.</p>";
    s.querySelector("#start-btn").addEventListener("click", function () {
      sfx("click");
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
      '<div class="result-stars" id="gn-result" aria-live="polite"></div>' +
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
    if (S.glossary && S.glossary.length) {
      var chips = S.glossary
        .slice(0, 8)
        .map(function (g) {
          return (
            '<span class="recap-chip">' + (g.ico || "📘") + " " + g.en + "</span>"
          );
        })
        .join("");
      html +=
        '<div class="recap"><span class="recap-tag">📚 Concepts you used' +
        (S.meta.standard ? " · " + S.meta.standard : "") +
        "</span>" +
        '<div class="recap-chips">' +
        chips +
        "</div></div>";
    }
    html +=
      '<button class="restart" id="restart-btn">Play again &#8635;</button>';
    s.innerHTML = html;
    return s;
  }

  /* ---- render the first-try star rating on the complete screen ---- */
  function fillResult() {
    var r = $("gn-result");
    if (!r) return;
    var t = SCORE.total || 1;
    var e = SCORE.stars;
    var ratio = e / t;
    var rating = ratio >= 1 ? 3 : ratio >= 0.6 ? 2 : 1;
    var stars = "";
    for (var i = 0; i < 3; i++)
      stars += '<span class="rs ' + (i < rating ? "on" : "") + '">★</span>';
    r.innerHTML =
      '<div class="rs-row">' +
      stars +
      "</div>" +
      '<div class="rs-line">First-try mastery: <b>' +
      e +
      "/" +
      t +
      "</b> (" +
      Math.round(ratio * 100) +
      "%)</div>";
    saveProgress({ pct: Math.round(ratio * 100), rating: rating });
    return rating;
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
    fillResult();
    wireMaster();
    sfx("win");
    confetti(180);
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
        sfx("click");
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
      wireChoices(step, act, function () {
        if (step.solveArt) setArt(step.solveArt, step.solveAlt);
        if (step.solveBeat) {
          speechEl.innerHTML = "";
          speechEl.appendChild(bubble(step.solveBeat));
        }
        stepIdx++;
        // small beat so the success feedback is read before the next panel
        setTimeout(playStep, 400);
      });
    }

    /* ---- challenge: optional bonus (does NOT gate; still scored) ----
       Renders this and any consecutive optional steps, then reveals advance. */
    function playOptional(step) {
      renderCard(step, true);
      wireChoices(step, act, function () {
        if (step.solveBeat) {
          speechEl.innerHTML = "";
          speechEl.appendChild(bubble(step.solveBeat));
        }
      });
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
      var choices =
        '<div class="reply-label">Choose your reply</div>' +
        '<div class="choices" id="choices-' +
        act.id +
        "-" +
        step.id +
        '">';
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
      saveProgress();
      sfx("unlock");
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
    var key = act.id + "-" + step.id;
    var panelEl = $("panel-" + act.id);
    var solved = false,
      missed = false;
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
              step.goodEn +
              (step.goodEs
                ? '<span class="es">' + step.goodEs + "</span>"
                : "");
            Array.prototype.slice
              .call($(groupId).querySelectorAll(".choice"))
              .forEach(function (b) {
                b.disabled = true;
              });
            // award a star only when solved on the first try
            if (!missed && !SCORE.solved[key]) {
              SCORE.solved[key] = true;
              SCORE.stars++;
              updateHUD(true);
            }
            sfx("correct");
            pow(panelEl, missed ? "GOT IT!" : "NICE!");
            confetti(40);
            if (onSolve) onSolve();
          } else {
            missed = true;
            btn.classList.add("wrong");
            btn.disabled = true;
            fb.className = "feedback show bad";
            fb.innerHTML =
              step.badEn +
              (step.badEs ? '<span class="es">' + step.badEs + "</span>" : "");
            sfx("wrong");
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
            sfx("win");
            confetti(160);
          } else {
            btn.classList.add("wrong");
            btn.disabled = true;
            fb.className = "feedback show bad";
            fb.style.display = "block";
            fb.innerHTML =
              m.badEn || "&#10060; Not quite. Review and try another option!";
            sfx("wrong");
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
