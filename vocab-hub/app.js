/* Neft Teacher · Vocabulary Study Hub
   Self-contained vanilla JS. Loads vocab-bank.json, renders four study modes,
   bilingual EN/ES with speechSynthesis read-aloud, localStorage progress. */
(function () {
  "use strict";

  var STORE_KEY = "neft-vocab-hub-v1";
  var view = document.getElementById("view");
  var loadingEl = document.getElementById("loading");
  var live = document.getElementById("sr-live");

  var state = {
    items: [],
    meta: null,
    lang: "both", // en | es | both
    mode: "browse",
  };

  /* ---------------- storage ---------------- */
  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveStore(s) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch (e) {
      /* private mode: ignore */
    }
  }
  var store = loadStore();
  store.progress = store.progress || {}; // term -> "got" | "review"
  store.stars = store.stars || 0;
  store.theme = store.theme || null;
  store.lang = store.lang || "both";
  state.lang = store.lang;

  function awardStar(n) {
    store.stars += n || 1;
    saveStore(store);
  }

  /* ---------------- helpers ---------------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function announce(msg) {
    live.textContent = "";
    // re-set so repeated identical messages still fire
    window.setTimeout(function () {
      live.textContent = msg;
    }, 30);
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function sample(arr, n, exclude) {
    var pool = arr.filter(function (x) {
      return x !== exclude;
    });
    return shuffle(pool).slice(0, n);
  }

  /* ---------------- speech ---------------- */
  var synth = window.speechSynthesis || null;
  function say(text, lang) {
    if (!synth || !text) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "es" ? "es-ES" : "en-US";
      u.rate = 0.92;
      synth.speak(u);
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------------- 3D shape detection ---------------- */
  var SHAPE_MAP = {
    cube: "cube",
    "rectangular prism": "prism",
    prism: "prism",
    "triangular prism": "prism",
    "rectangular-prism": "prism",
    pyramid: "pyramid",
    "square pyramid": "pyramid",
    "triangular pyramid": "pyramid",
  };
  function shapeKindFor(item) {
    var key = (item.term || "").toLowerCase().trim();
    if (SHAPE_MAP[key]) return SHAPE_MAP[key];
    if (/\bcube\b/.test(key)) return "cube";
    if (/\bprism\b/.test(key)) return "prism";
    if (/\bpyramid\b/.test(key)) return "pyramid";
    return null;
  }
  function build3DSolid(kind) {
    var scene = el("div", "scene3d");
    var solid = el("div", "solid");
    scene.setAttribute("aria-hidden", "true");
    var faces = kind === "pyramid" ? 4 : 6;
    var s = 80; // half-size
    var transforms;
    if (kind === "pyramid") {
      transforms = [
        "rotateY(0deg) translateZ(" + s + "px) rotateX(28deg)",
        "rotateY(90deg) translateZ(" + s + "px) rotateX(28deg)",
        "rotateY(180deg) translateZ(" + s + "px) rotateX(28deg)",
        "rotateY(270deg) translateZ(" + s + "px) rotateX(28deg)",
      ];
    } else {
      var d = kind === "prism" ? s * 1.4 : s;
      transforms = [
        "rotateY(0deg) translateZ(" + d + "px)",
        "rotateY(180deg) translateZ(" + d + "px)",
        "rotateY(90deg) translateZ(" + s + "px)",
        "rotateY(-90deg) translateZ(" + s + "px)",
        "rotateX(90deg) translateZ(" + s + "px)",
        "rotateX(-90deg) translateZ(" + s + "px)",
      ];
    }
    for (var i = 0; i < faces; i++) {
      var f = el("div", "face");
      f.style.transform = transforms[i];
      solid.appendChild(f);
    }
    scene.appendChild(solid);
    var wrap = el("div", "shape-scene");
    wrap.appendChild(scene);
    return wrap;
  }

  /* ---------------- language classes ---------------- */
  function langClass() {
    if (state.lang === "en") return "lang-hide-es";
    if (state.lang === "es") return "lang-hide-en";
    return "";
  }

  function sayButtons(enText, esText) {
    var row = el("div", "say-row");
    if (enText) {
      var b = el("button", "say-btn en", "🔊 EN");
      b.type = "button";
      b.setAttribute("aria-label", "Read aloud in English: " + enText);
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        say(enText, "en");
      });
      row.appendChild(b);
    }
    if (esText) {
      var b2 = el("button", "say-btn es", "🔊 ES");
      b2.type = "button";
      b2.setAttribute("aria-label", "Leer en voz alta en español: " + esText);
      b2.addEventListener("click", function (ev) {
        ev.stopPropagation();
        say(esText, "es");
      });
      row.appendChild(b2);
    }
    return row;
  }

  /* ============================================================
     MODE 1 — WORD WALL / BROWSE
     ============================================================ */
  var browseFilter = { q: "", unit: "", standard: "" };

  function renderBrowse() {
    view.innerHTML = "";
    var controls = el("div", "controls");

    var search = el("input", "search");
    search.type = "search";
    search.placeholder = "Search words… / Buscar palabras…";
    search.setAttribute("aria-label", "Search words / Buscar palabras");
    search.value = browseFilter.q;
    search.addEventListener("input", function () {
      browseFilter.q = search.value.toLowerCase();
      drawWall();
    });

    var units = uniqueSorted(
      state.items.reduce(function (acc, i) {
        return acc.concat(i.units || []);
      }, [])
    );
    var unitSel = makeSelect(
      "Filter by unit / Unidad",
      [["", "All units / Todas"]].concat(
        units.map(function (u) {
          return [String(u), "Unit " + u];
        }),
      ),
      browseFilter.unit,
      function (v) {
        browseFilter.unit = v;
        drawWall();
      },
    );

    var stds = uniqueSorted(
      state.items.reduce(function (acc, i) {
        return acc.concat(i.standards || []);
      }, [])
    );
    var stdSel = makeSelect(
      "Filter by standard / Estándar",
      [["", "All standards"]].concat(
        stds.map(function (s) {
          return [s, s];
        }),
      ),
      browseFilter.standard,
      function (v) {
        browseFilter.standard = v;
        drawWall();
      },
    );

    var pill = el("span", "count-pill");
    pill.id = "wall-count";

    controls.appendChild(search);
    controls.appendChild(unitSel);
    controls.appendChild(stdSel);
    controls.appendChild(pill);
    view.appendChild(controls);

    var wall = el("div", "wall " + langClass());
    wall.id = "wall";
    view.appendChild(wall);
    drawWall();
  }

  function filteredItems() {
    return state.items.filter(function (it) {
      if (
        browseFilter.unit &&
        it.units.indexOf(Number(browseFilter.unit)) === -1 &&
        it.units.indexOf(browseFilter.unit) === -1
      )
        return false;
      if (
        browseFilter.standard &&
        it.standards.indexOf(browseFilter.standard) === -1
      )
        return false;
      if (browseFilter.q) {
        var hay = (
          it.term +
          " " +
          it.termEs +
          " " +
          it.definition +
          " " +
          it.definitionEs
        ).toLowerCase();
        if (hay.indexOf(browseFilter.q) === -1) return false;
      }
      return true;
    });
  }

  function drawWall() {
    var wall = document.getElementById("wall");
    if (!wall) return;
    wall.className = "wall " + langClass();
    var items = filteredItems();
    document.getElementById("wall-count").textContent = items.length + " words";
    wall.innerHTML = "";
    if (!items.length) {
      wall.appendChild(el("p", "empty", "No words match. / No hay palabras."));
      return;
    }
    items.forEach(function (it) {
      var card = el("article", "word-card");
      var img = el("img");
      img.src = it.image;
      img.alt = "Picture for " + esc(it.term);
      img.loading = "lazy";
      card.appendChild(img);
      card.appendChild(el("div", "term-en", esc(it.term)));
      if (it.termEs) card.appendChild(el("div", "term-es", esc(it.termEs)));
      card.appendChild(el("div", "def-en", esc(it.definition)));
      if (it.definitionEs)
        card.appendChild(el("div", "def-es", esc(it.definitionEs)));
      card.appendChild(sayButtons(it.term, it.termEs || it.definition));
      var tags = el("div", "card-tags");
      it.units.forEach(function (u) {
        tags.appendChild(el("span", "tag", "Unit " + u));
      });
      if (it.standard) tags.appendChild(el("span", "tag", esc(it.standard)));
      if (store.progress[it.term] === "got")
        tags.appendChild(el("span", "tag got-it", "✓ got it"));
      card.appendChild(tags);
      wall.appendChild(card);
    });
  }

  /* ============================================================
     MODE 2 — FLASHCARDS
     ============================================================ */
  var fc = { order: [], idx: 0, flipped: false };

  function renderFlashcards() {
    view.innerHTML = "";
    fc.order = shuffle(state.items);
    fc.idx = 0;
    fc.flipped = false;

    var stage = el("div", "fc-stage");
    var prog = el("div", "fc-progress");
    prog.innerHTML =
      '<span id="fc-pos"></span><span class="bar"><span id="fc-bar"></span></span><span id="fc-got"></span>';
    stage.appendChild(prog);

    var card = el("button", "flashcard");
    card.type = "button";
    card.id = "flashcard";
    card.setAttribute("aria-label", "Flashcard. Press to flip.");
    card.innerHTML = '<div class="fc-inner" id="fc-inner"></div>';
    card.addEventListener("click", flip);
    stage.appendChild(card);

    var row = el("div", "btn-row");
    row.innerHTML =
      '<button type="button" class="btn" id="fc-prev">← Back</button>' +
      '<button type="button" class="btn btn-warn" id="fc-review">🔁 Review</button>' +
      '<button type="button" class="btn btn-good" id="fc-got">✓ Got it</button>' +
      '<button type="button" class="btn" id="fc-next">Next →</button>' +
      '<button type="button" class="btn btn-ghost" id="fc-shuffle">🔀 Shuffle</button>';
    stage.appendChild(row);
    view.appendChild(stage);

    row.querySelector("#fc-prev").addEventListener("click", function () {
      go(-1);
    });
    row.querySelector("#fc-next").addEventListener("click", function () {
      go(1);
    });
    row.querySelector("#fc-shuffle").addEventListener("click", function () {
      fc.order = shuffle(state.items);
      fc.idx = 0;
      drawFlashcard();
      announce("Shuffled");
    });
    row.querySelector("#fc-got").addEventListener("click", function () {
      mark("got");
    });
    row.querySelector("#fc-review").addEventListener("click", function () {
      mark("review");
    });

    document.addEventListener("keydown", fcKeys);
    drawFlashcard();
  }

  function fcKeys(e) {
    if (state.mode !== "flashcards") return;
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === " " || e.key === "Enter") {
      if (document.activeElement === document.getElementById("flashcard")) {
        e.preventDefault();
        flip();
      }
    }
  }

  function flip() {
    fc.flipped = !fc.flipped;
    var c = document.getElementById("flashcard");
    if (c) c.classList.toggle("flipped", fc.flipped);
    var it = fc.order[fc.idx];
    if (it) {
      if (fc.flipped) say(it.definition, "en");
      else say(it.term, "en");
    }
  }

  function go(dir) {
    fc.idx = (fc.idx + dir + fc.order.length) % fc.order.length;
    fc.flipped = false;
    drawFlashcard();
  }

  function mark(kind) {
    var it = fc.order[fc.idx];
    if (!it) return;
    var prev = store.progress[it.term];
    store.progress[it.term] = kind;
    if (kind === "got" && prev !== "got") awardStar(1);
    saveStore(store);
    announce(kind === "got" ? "Marked got it" : "Marked for review");
    var gotCount = countGot();
    if (gotCount === state.items.length) {
      celebrate(
        "You learned all " +
          state.items.length +
          " words! · ¡Aprendiste todas!",
      );
    }
    go(1);
  }

  function countGot() {
    return state.items.filter(function (i) {
      return store.progress[i.term] === "got";
    }).length;
  }

  function drawFlashcard() {
    var inner = document.getElementById("fc-inner");
    var c = document.getElementById("flashcard");
    if (!inner) return;
    c.classList.remove("flipped");
    var it = fc.order[fc.idx];
    var lc = langClass();

    var front =
      '<div class="fc-face fc-front ' +
      lc +
      '">' +
      '<div class="fc-term term-en">' +
      esc(it.term) +
      "</div>" +
      (it.termEs
        ? '<div class="fc-term-es term-es">' + esc(it.termEs) + "</div>"
        : "") +
      '<div class="fc-hint">Tap / Space to flip · Toca para voltear</div>' +
      "</div>";
    var back =
      '<div class="fc-face fc-back ' +
      lc +
      '">' +
      '<img src="' +
      esc(it.image) +
      '" alt="Picture for ' +
      esc(it.term) +
      '">' +
      '<div class="fc-def def-en">' +
      esc(it.definition) +
      "</div>" +
      (it.definitionEs
        ? '<div class="fc-def-es def-es">' + esc(it.definitionEs) + "</div>"
        : "") +
      "</div>";
    inner.innerHTML = front + back;

    document.getElementById("fc-pos").textContent =
      fc.idx + 1 + " / " + fc.order.length;
    var got = countGot();
    document.getElementById("fc-bar").style.width =
      (got / state.items.length) * 100 + "%";
    document.getElementById("fc-got").textContent = "★ " + got + " got it";
  }

  /* ============================================================
     MODE 3 — MATCHING GAME
     ============================================================ */
  var mg = {};
  function renderMatch() {
    view.innerHTML = "";
    var bar = el("div", "scorebar");
    bar.innerHTML =
      '<span>⏱ <span id="mg-time">0s</span></span>' +
      '<span>✓ <span id="mg-score">0</span>/<span id="mg-total">0</span></span>' +
      '<span class="feedback" id="mg-fb"></span>';
    view.appendChild(bar);

    var toolbar = el("div", "btn-row");
    toolbar.innerHTML =
      '<button type="button" class="btn" id="mg-mode-def">Term ↔ Definition</button>' +
      '<button type="button" class="btn" id="mg-mode-img">Term ↔ Picture</button>' +
      '<button type="button" class="btn btn-primary" id="mg-new">New Round</button>';
    view.appendChild(toolbar);

    var grid = el("div", "match-grid");
    grid.id = "mg-grid";
    view.appendChild(grid);

    mg.mode = "def";
    toolbar
      .querySelector("#mg-mode-def")
      .addEventListener("click", function () {
        mg.mode = "def";
        newMatchRound();
      });
    toolbar
      .querySelector("#mg-mode-img")
      .addEventListener("click", function () {
        mg.mode = "img";
        newMatchRound();
      });
    toolbar.querySelector("#mg-new").addEventListener("click", newMatchRound);

    newMatchRound();
  }

  function newMatchRound() {
    clearInterval(mg.timer);
    var grid = document.getElementById("mg-grid");
    if (!grid) return;
    var picks = shuffle(state.items).slice(0, 5);
    mg.pairs = picks;
    mg.matched = 0;
    mg.selectedLeft = null;
    mg.start = Date.now();
    document.getElementById("mg-score").textContent = "0";
    document.getElementById("mg-total").textContent = String(picks.length);
    document.getElementById("mg-fb").textContent = "";
    mg.timer = setInterval(function () {
      var t = document.getElementById("mg-time");
      if (t) t.textContent = Math.round((Date.now() - mg.start) / 1000) + "s";
    }, 250);

    grid.innerHTML = "";
    var leftCol = el("div", "match-col");
    var rightCol = el("div", "match-col");
    var lc = langClass();

    var left = picks.map(function (p, i) {
      return { p: p, id: i };
    });
    var right = shuffle(left.slice());

    left.forEach(function (o) {
      var b = el("button", "match-item " + lc);
      b.type = "button";
      b.dataset.id = String(o.id);
      var html = '<span class="term-en">' + esc(o.p.term) + "</span>";
      if (o.p.termEs)
        html += ' <span class="term-es">/ ' + esc(o.p.termEs) + "</span>";
      b.innerHTML = html;
      b.addEventListener("click", function () {
        selectLeft(b, o.id);
      });
      leftCol.appendChild(b);
    });

    right.forEach(function (o) {
      var b = el("button", "match-item " + lc);
      b.type = "button";
      b.dataset.id = String(o.id);
      if (mg.mode === "img") {
        b.innerHTML =
          '<img src="' +
          esc(o.p.image) +
          '" alt="Picture for a math word"><span class="def-en">picture</span>';
      } else {
        var html = '<span class="def-en">' + esc(o.p.definition) + "</span>";
        if (o.p.definitionEs)
          html += '<span class="def-es"> ' + esc(o.p.definitionEs) + "</span>";
        b.innerHTML = html;
      }
      b.addEventListener("click", function () {
        selectRight(b, o.id);
      });
      rightCol.appendChild(b);
    });

    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    announce("New matching round. Match the word to its meaning.");
  }

  function selectLeft(btn, id) {
    if (btn.classList.contains("matched")) return;
    var prev = document.querySelector(
      "#mg-grid .match-col:first-child .selected",
    );
    if (prev) prev.classList.remove("selected");
    mg.selectedLeft = id;
    btn.classList.add("selected");
    var it = mg.pairs[id];
    if (it) say(it.term, "en");
  }

  function selectRight(btn, id) {
    if (btn.classList.contains("matched")) return;
    if (mg.selectedLeft == null) {
      flash("mg-fb", "Pick a word first · Elige una palabra", false);
      return;
    }
    if (mg.selectedLeft === id) {
      btn.classList.add("matched");
      var leftBtn = document.querySelector(
        '#mg-grid .match-col:first-child .match-item[data-id="' + id + '"]',
      );
      if (leftBtn) {
        leftBtn.classList.remove("selected");
        leftBtn.classList.add("matched");
      }
      mg.matched++;
      document.getElementById("mg-score").textContent = String(mg.matched);
      flash("mg-fb", pick(["Nice!", "¡Bien!", "Correct!", "Great!"]), true);
      mg.selectedLeft = null;
      if (mg.matched === mg.pairs.length) {
        clearInterval(mg.timer);
        var secs = Math.round((Date.now() - mg.start) / 1000);
        awardStar(2);
        celebrate("All matched in " + secs + "s! · ¡Todo emparejado!");
      }
    } else {
      btn.classList.add("wrong");
      flash("mg-fb", "Try again · Inténtalo otra vez", false);
      window.setTimeout(function () {
        btn.classList.remove("wrong");
      }, 350);
    }
  }

  function flash(id, msg, ok) {
    var e = document.getElementById(id);
    if (!e) return;
    e.textContent = msg;
    e.style.color = ok ? "var(--good)" : "var(--bad)";
    announce(msg);
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ============================================================
     MODE 4 — QUIZ / PRACTICE
     ============================================================ */
  var qz = {};
  function renderQuiz() {
    view.innerHTML = "";
    qz.questions = buildQuiz(10);
    qz.idx = 0;
    qz.score = 0;
    if (!qz.questions.length) {
      view.appendChild(el("p", "empty", "No quiz available."));
      return;
    }
    drawQuestion();
  }

  function buildQuiz(n) {
    var qs = [];
    var pool = shuffle(state.items);
    pool.forEach(function (it) {
      // 1. example vs non-example
      if (it.examples && it.examples.length >= 2) {
        var ex = it.examples.filter(function (e) {
          return e.isExample;
        });
        var non = it.examples.filter(function (e) {
          return !e.isExample;
        });
        if (ex.length && non.length) {
          var correct = pick(ex);
          var opts = shuffle([correct].concat(sample(non, 2)));
          qs.push({
            kind: "example",
            item: it,
            promptEn: 'Which is an example of "' + it.term + '"?',
            promptEs: it.termEs
              ? "¿Cuál es un ejemplo de «" + it.termEs + "»?"
              : "",
            options: opts.map(function (o) {
              return { text: o.text, correct: o === correct, why: o.why };
            }),
          });
        }
      }
      // 2. which sentence uses it correctly
      if (it.sentences && it.sentences.length >= 2) {
        var right = it.sentences.filter(function (s) {
          return s.correct;
        });
        var wrong = it.sentences.filter(function (s) {
          return !s.correct;
        });
        if (right.length && wrong.length) {
          var c = pick(right);
          var o2 = shuffle([c].concat(sample(wrong, 2)));
          qs.push({
            kind: "sentence",
            item: it,
            promptEn: "Which sentence uses the word correctly?",
            promptEs: "¿Qué oración usa la palabra correctamente?",
            options: o2.map(function (o) {
              return { text: o.text, correct: o === c };
            }),
          });
        }
      }
      // 3. cloze / fill the blank -> pick the right term
      if (it.cloze) {
        var distractors = sample(state.items, 3, it).map(function (d) {
          return d.term;
        });
        var clozeOpts = shuffle([it.term].concat(distractors));
        qs.push({
          kind: "cloze",
          item: it,
          promptEn: it.cloze.replace(/_+/g, "_____"),
          promptEs: "Completa el espacio. (Fill in the blank.)",
          options: clozeOpts.map(function (t) {
            return { text: t, correct: t === it.term };
          }),
        });
      } else {
        // 4. fallback: definition -> term
        var d2 = sample(state.items, 3, it).map(function (x) {
          return x.term;
        });
        var defOpts = shuffle([it.term].concat(d2));
        qs.push({
          kind: "define",
          item: it,
          promptEn: "Which word means: " + it.definition,
          promptEs: it.definitionEs
            ? "¿Qué palabra significa: " + it.definitionEs
            : "",
          options: defOpts.map(function (t) {
            return { text: t, correct: t === it.term };
          }),
        });
      }
    });
    return shuffle(qs).slice(0, n);
  }

  function drawQuestion() {
    view.innerHTML = "";
    var q = qz.questions[qz.idx];
    var bar = el("div", "scorebar");
    bar.innerHTML =
      "<span>Q " +
      (qz.idx + 1) +
      " / " +
      qz.questions.length +
      "</span><span>★ <span>" +
      qz.score +
      "</span></span>";
    view.appendChild(bar);

    var card = el("div", "quiz-card");
    var showEs = state.lang !== "en";
    var showEn = state.lang !== "es";

    if (showEn || !q.promptEs)
      card.appendChild(el("p", "quiz-prompt", esc(q.promptEn)));
    if (showEs && q.promptEs)
      card.appendChild(el("p", "quiz-prompt-es", esc(q.promptEs)));

    if (q.kind === "cloze" || q.kind === "define" || q.kind === "example") {
      var img = el("img", "quiz-img");
      img.src = q.item.image;
      img.alt = "Picture clue";
      card.appendChild(img);
    }

    card.appendChild(sayButtons(q.promptEn, q.promptEs || q.item.termEs));

    var optsWrap = el("div", "quiz-options");
    optsWrap.setAttribute("role", "group");
    q.options.forEach(function (o) {
      var b = el("button", "quiz-opt");
      b.type = "button";
      b.textContent = o.text;
      b.addEventListener("click", function () {
        answer(b, o, q, optsWrap);
      });
      optsWrap.appendChild(b);
    });
    card.appendChild(optsWrap);

    var fb = el("div", "quiz-feedback");
    fb.id = "qz-fb";
    card.appendChild(fb);
    view.appendChild(card);
    announce("Question " + (qz.idx + 1) + ". " + q.promptEn);
  }

  function answer(btn, opt, q, wrap) {
    var buttons = wrap.querySelectorAll(".quiz-opt");
    buttons.forEach(function (b) {
      b.disabled = true;
    });
    var fb = document.getElementById("qz-fb");
    if (opt.correct) {
      btn.classList.add("correct");
      qz.score++;
      awardStar(1);
      fb.className = "quiz-feedback ok";
      fb.textContent =
        pick(["Correct! · ¡Correcto!", "Yes! · ¡Sí!", "Great! · ¡Genial!"]) +
        (opt.why ? " " + opt.why : "");
    } else {
      btn.classList.add("wrong");
      fb.className = "quiz-feedback no";
      // reveal correct
      q.options.forEach(function (o, i) {
        if (o.correct) buttons[i].classList.add("correct");
      });
      fb.textContent = "Not quite · Casi. The answer is highlighted.";
    }
    saveStore(store);

    var nextBtn = el("button", "btn btn-primary");
    nextBtn.textContent =
      qz.idx + 1 < qz.questions.length
        ? "Next → · Siguiente"
        : "See score · Ver puntaje";
    nextBtn.style.marginTop = "14px";
    nextBtn.addEventListener("click", function () {
      qz.idx++;
      if (qz.idx < qz.questions.length) drawQuestion();
      else quizDone();
    });
    document.querySelector(".quiz-card").appendChild(nextBtn);
    nextBtn.focus();
  }

  function quizDone() {
    view.innerHTML = "";
    var pct = Math.round((qz.score / qz.questions.length) * 100);
    var card = el("div", "quiz-card");
    card.innerHTML =
      '<h2 style="text-align:center">Your score · Tu puntaje</h2>' +
      '<p style="text-align:center;font-size:2rem;font-weight:800" class="star">★ ' +
      qz.score +
      " / " +
      qz.questions.length +
      " (" +
      pct +
      "%)</p>";
    var row = el("div", "btn-row");
    row.innerHTML =
      '<button type="button" class="btn btn-primary" id="qz-again">Play again · Jugar otra vez</button>';
    card.appendChild(row);
    view.appendChild(card);
    row.querySelector("#qz-again").addEventListener("click", renderQuiz);
    if (pct >= 80) celebrate("You scored " + pct + "%! · ¡Lo lograste!");
    else announce("Quiz finished. Score " + pct + " percent.");
  }

  /* ============================================================
     SHARED UI
     ============================================================ */
  function makeSelect(label, options, value, onchange) {
    var s = el("select", "select");
    s.setAttribute("aria-label", label);
    options.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0];
      opt.textContent = o[1];
      if (String(o[0]) === String(value)) opt.selected = true;
      s.appendChild(opt);
    });
    s.addEventListener("change", function () {
      onchange(s.value);
    });
    return s;
  }
  function uniqueSorted(arr) {
    var seen = {};
    var out = [];
    arr.forEach(function (v) {
      var k = String(v);
      if (!seen[k]) {
        seen[k] = 1;
        out.push(v);
      }
    });
    return out.sort(function (a, b) {
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });
  }

  /* ---------------- celebration ---------------- */
  var celebrateEl = document.getElementById("celebrate");
  function celebrate(msg) {
    document.getElementById("celebrate-msg").textContent =
      msg + "  ★ " + store.stars + " stars total";
    celebrateEl.hidden = false;
    celebrateEl.setAttribute("aria-hidden", "false");
    var btn = document.getElementById("celebrate-close");
    btn.focus();
    announce(msg);
  }
  document
    .getElementById("celebrate-close")
    .addEventListener("click", function () {
      celebrateEl.hidden = true;
      celebrateEl.setAttribute("aria-hidden", "true");
    });

  /* ---------------- mode switching ---------------- */
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".tab").forEach(function (t) {
      var on = t.dataset.mode === mode;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.removeEventListener("keydown", fcKeys);
    clearInterval(mg.timer);
    if (mode === "browse") renderBrowse();
    else if (mode === "flashcards") renderFlashcards();
    else if (mode === "match") renderMatch();
    else if (mode === "quiz") renderQuiz();
    document.getElementById("main").focus();
  }

  function setLang(lang) {
    state.lang = lang;
    store.lang = lang;
    saveStore(store);
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      var on = b.dataset.lang === lang;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    setMode(state.mode); // re-render current view
  }

  /* ---------------- theme ---------------- */
  function applyTheme(theme) {
    if (theme === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    else if (theme === "light")
      document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  }
  function initTheme() {
    if (store.theme) applyTheme(store.theme);
    else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    )
      applyTheme("dark");
    document.getElementById("theme-btn").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      store.theme = next;
      saveStore(store);
      applyTheme(next);
    });
  }

  /* ---------------- boot ---------------- */
  function wire() {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        setMode(t.dataset.mode);
      });
    });
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        setLang(b.dataset.lang);
      });
    });
    // reflect stored lang
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      var on = b.dataset.lang === state.lang;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    initTheme();
  }

  fetch("/vocab-hub/vocab-bank.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (bank) {
      state.items = bank.items || [];
      state.meta = bank.meta || null;
      loadingEl.hidden = true;
      view.hidden = false;
      wire();
      setMode("browse");
    })
    .catch(function (err) {
      loadingEl.textContent =
        "Could not load vocabulary. Open this page from a web server. (" +
        err.message +
        ")";
    });
})();
