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
  store.coins = store.coins || 0;
  store.xp = store.xp || 0;
  store.questLevel = store.questLevel || 1;
  store.powerups = store.powerups || { halfHalf: 2, translate: 2, clue: 2 };
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
      if (lang === "es") u.lang = "es-ES";
      else if (lang === "vi") u.lang = "vi-VN";
      else if (lang === "ar") u.lang = "ar-SA";
      else u.lang = "en-US";
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
    if (state.lang === "en") return "lang-hide-es lang-hide-vi lang-hide-ar";
    if (state.lang === "es") return "lang-hide-en lang-hide-vi lang-hide-ar";
    if (state.lang === "vi") return "lang-hide-en lang-hide-es lang-hide-ar";
    if (state.lang === "ar") return "lang-hide-en lang-hide-es lang-hide-vi";
    if (state.lang === "both") return "lang-hide-vi lang-hide-ar";
    if (state.lang === "vi_both") return "lang-hide-es lang-hide-ar";
    if (state.lang === "ar_both") return "lang-hide-es lang-hide-vi";
    return "";
  }

  function sayButtons(enText, esText, viText, arText) {
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
    if (viText) {
      var b3 = el("button", "say-btn vi", "🔊 VI");
      b3.type = "button";
      b3.setAttribute("aria-label", "Đọc to bằng tiếng Việt: " + viText);
      b3.addEventListener("click", function (ev) {
        ev.stopPropagation();
        say(viText, "vi");
      });
      row.appendChild(b3);
    }
    if (arText) {
      var b4 = el("button", "say-btn ar", "🔊 AR");
      b4.type = "button";
      b4.setAttribute("aria-label", "القراءة بصوت عالي بالعربية: " + arText);
      b4.addEventListener("click", function (ev) {
        ev.stopPropagation();
        say(arText, "ar");
      });
      row.appendChild(b4);
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
          (it.termVi || "") +
          " " +
          (it.termAr || "") +
          " " +
          it.definition +
          " " +
          it.definitionEs +
          " " +
          (it.definitionVi || "") +
          " " +
          (it.definitionAr || "")
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
      if (it.termVi) card.appendChild(el("div", "term-vi", esc(it.termVi)));
      if (it.termAr) card.appendChild(el("div", "term-ar", esc(it.termAr)));
      card.appendChild(el("div", "def-en", esc(it.definition)));
      if (it.definitionEs)
        card.appendChild(el("div", "def-es", esc(it.definitionEs)));
      if (it.definitionVi)
        card.appendChild(el("div", "def-vi", esc(it.definitionVi)));
      if (it.definitionAr)
        card.appendChild(el("div", "def-ar", esc(it.definitionAr)));
      card.appendChild(sayButtons(
        it.term,
        it.termEs || it.definition,
        it.termVi || it.definitionVi,
        it.termAr || it.definitionAr
      ));
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
      if (fc.flipped) {
        if (state.lang === "es") say(it.definitionEs || it.definition, "es");
        else if (state.lang === "vi") say(it.definitionVi || it.definition, "vi");
        else if (state.lang === "ar") say(it.definitionAr || it.definition, "ar");
        else say(it.definition, "en");
      } else {
        if (state.lang === "es") say(it.termEs || it.term, "es");
        else if (state.lang === "vi") say(it.termVi || it.term, "vi");
        else if (state.lang === "ar") say(it.termAr || it.term, "ar");
        else say(it.term, "en");
      }
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
      (it.termVi
        ? '<div class="fc-term-vi term-vi">' + esc(it.termVi) + "</div>"
        : "") +
      (it.termAr
        ? '<div class="fc-term-ar term-ar">' + esc(it.termAr) + "</div>"
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
      (it.definitionVi
        ? '<div class="fc-def-vi def-vi">' + esc(it.definitionVi) + "</div>"
        : "") +
      (it.definitionAr
        ? '<div class="fc-def-ar def-ar">' + esc(it.definitionAr) + "</div>"
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
      if (o.p.termVi)
        html += ' <span class="term-vi">/ ' + esc(o.p.termVi) + "</span>";
      if (o.p.termAr)
        html += ' <span class="term-ar">/ ' + esc(o.p.termAr) + "</span>";
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
        if (o.p.definitionVi)
          html += '<span class="def-vi"> ' + esc(o.p.definitionVi) + "</span>";
        if (o.p.definitionAr)
          html += '<span class="def-ar"> ' + esc(o.p.definitionAr) + "</span>";
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
    .getElementById("celebrate-close")
    .addEventListener("click", function () {
      celebrateEl.hidden = true;
      celebrateEl.setAttribute("aria-hidden", "true");
    });

  /* ============================================================
     MODE 5 — ADVENTURE EXPEDITION (QUEST)
     ============================================================ */
  var qst = {
    activeUnit: null,
    questions: [],
    idx: 0,
    score: 0,
    halfHalfUsed: false,
    translateUsed: false,
    clueUsed: false
  };

  function getRank(xp) {
    if (xp < 100) return "Math Cadet 🛡️";
    if (xp < 300) return "Equation Explorer 🧭";
    if (xp < 600) return "Ratio Ranger 🏹";
    if (xp < 1000) return "Geometry Giant ⚔️";
    return "Algebra Archmage 🔮";
  }

  function renderQuest() {
    view.innerHTML = "";
    document.body.classList.remove("print-cert"); // ensure print class is removed
    
    // 1. Stats Bar
    var statsBar = el("div", "quest-stats");
    statsBar.innerHTML = 
      '<div class="quest-stat-item">🪙 <span id="qst-coins">' + store.coins + '</span> gold</div>' +
      '<div class="quest-stat-item">⚡ <span id="qst-xp">' + store.xp + '</span> XP</div>' +
      '<div class="quest-stat-item">🏆 Rank: <span id="qst-rank" style="color:var(--primary); font-weight:800;">' + getRank(store.xp) + '</span></div>';
    view.appendChild(statsBar);

    // 2. Powerups Shop
    var shop = el("div", "quest-shop");
    var shopTitle = el("div", "quest-shop-title", "🛍️ Adventurer's Power-up Shop");
    var shopItems = el("div", "quest-shop-items");
    
    var itemsData = [
      { key: "halfHalf", name: "50/50 Power-up 🃏", cost: 15, desc: "Removes 2 wrong choices" },
      { key: "translate", name: "Bilingual Clue 🗣️", cost: 10, desc: "Shows definition in Spanish" },
      { key: "clue", name: "Visual Clue 🔍", cost: 10, desc: "Highlights clue picture" }
    ];

    itemsData.forEach(function(item) {
      var card = el("div", "quest-shop-card");
      card.innerHTML = 
        '<div class="quest-shop-name">' + item.name + '</div>' +
        '<div class="quest-shop-qty">Owned: <span id="shop-qty-' + item.key + '">' + store.powerups[item.key] + '</span></div>' +
        '<div style="font-size:0.75rem; color:var(--ink-soft);">' + item.desc + '</div>';
        
      var buyBtn = el("button", "btn btn-primary", "Buy for 🪙" + item.cost);
      buyBtn.style.padding = "4px 8px";
      buyBtn.style.minHeight = "36px";
      buyBtn.style.fontSize = "0.85rem";
      buyBtn.style.marginTop = "6px";
      buyBtn.addEventListener("click", function() {
        if (store.coins >= item.cost) {
          store.coins -= item.cost;
          store.powerups[item.key]++;
          saveStore(store);
          
          document.getElementById("qst-coins").textContent = store.coins;
          document.getElementById("shop-qty-" + item.key).textContent = store.powerups[item.key];
          announce("Purchased " + item.name);
        } else {
          alert("Not enough coins! / ¡No tienes suficientes monedas!");
        }
      });
      card.appendChild(buyBtn);
      shopItems.appendChild(card);
    });
    
    shop.appendChild(shopTitle);
    shop.appendChild(shopItems);
    view.appendChild(shop);

    // 3. Adventure Map Panel
    var mapPanel = el("div", "quest-map-panel");
    mapPanel.innerHTML = 
      '<h2 style="margin:0 0 4px;">Vocabulary Adventure Quest</h2>' +
      '<p class="muted hint" style="margin-bottom:12px;">Conquer all 10 math units to earn your Achievement Certificate!</p>';
      
    // Interactive SVG Winding Path
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 600 240");
    svg.setAttribute("class", "quest-map-svg");
    
    var pathStr = "M 40 180 C 60 120, 70 80, 90 80 C 110 80, 130 140, 150 160 C 170 180, 190 100, 210 80 C 230 60, 250 140, 270 160 C 290 180, 310 100, 330 80 C 350 60, 370 140, 390 160 C 410 180, 430 100, 450 80 C 470 60, 490 140, 510 160 C 530 180, 540 120, 560 100";
    
    var mapPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    mapPath.setAttribute("d", pathStr);
    mapPath.setAttribute("fill", "none");
    mapPath.setAttribute("stroke", "#cbd5e1");
    mapPath.setAttribute("stroke-width", "8");
    svg.appendChild(mapPath);

    var stations = [
      { u: 1, x: 40, y: 180, name: "Fractions" },
      { u: 2, x: 90, y: 80, name: "Decimals" },
      { u: 3, x: 150, y: 160, name: "Ratios" },
      { u: 4, x: 210, y: 80, name: "Rates" },
      { u: 5, x: 270, y: 160, name: "Percents" },
      { u: 6, x: 330, y: 80, name: "Expressions" },
      { u: 7, x: 390, y: 160, name: "Equations" },
      { u: 8, x: 450, y: 80, name: "Inequalities" },
      { u: 9, x: 510, y: 160, name: "Geometry" },
      { u: 10, x: 560, y: 100, name: "Statistics" }
    ];

    stations.forEach(function(st) {
      var isCompleted = st.u < store.questLevel;
      var isActive = st.u === store.questLevel;
      var isLocked = st.u > store.questLevel;
      
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "quest-station");
      g.style.cursor = isLocked ? "not-allowed" : "pointer";
      
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", st.x);
      c.setAttribute("cy", st.y);
      c.setAttribute("r", isActive ? "19" : "16");
      
      var fill = isLocked ? "#94a3b8" : (isCompleted ? "#10b981" : "#2563eb");
      c.setAttribute("fill", fill);
      c.setAttribute("stroke", isActive ? "#fbbf24" : "#ffffff");
      c.setAttribute("stroke-width", isActive ? "4.5" : "2");
      
      if (isActive) {
        c.setAttribute("class", "quest-station-active");
      }
      
      var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", st.x);
      t.setAttribute("y", st.y + 4);
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("fill", "#ffffff");
      t.setAttribute("font-size", "12");
      t.setAttribute("font-weight", "900");
      t.textContent = st.u;

      var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = "Unit " + st.u + " Challenge: " + st.name + " (" + (isLocked ? "Locked" : (isCompleted ? "Completed" : "Active Now")) + ")";
      g.appendChild(title);
      
      g.appendChild(c);
      g.appendChild(t);
      
      if (!isLocked) {
        g.addEventListener("click", function() {
          startQuestChallenge(st.u);
        });
      }
      
      svg.appendChild(g);
    });

    mapPanel.appendChild(svg);
    view.appendChild(mapPanel);

    // 4. Certificate Box
    if (store.questLevel > 10) {
      var certBox = el("div", "quiz-card", '<h3 style="margin-top:0;">🏆 Expedition Completed! 🏆</h3><p>You have conquered all 10 Math vocabulary units! You are now a certified Grade 6 Math Vocabulary Champion.</p>');
      certBox.style.marginTop = "20px";
      certBox.style.textAlign = "center";
      certBox.style.background = "#f0fdf4";
      certBox.style.borderColor = "#bbf7d0";
      
      var printBtn = el("button", "btn btn-primary", "🖨️ Print Achievement Certificate");
      printBtn.addEventListener("click", showCertificate);
      certBox.appendChild(printBtn);
      view.appendChild(certBox);
    }
  }

  function startQuestChallenge(unitNum) {
    var unitTerms = state.items.filter(function(it) {
      return it.units.indexOf(unitNum) !== -1 || it.units.indexOf(String(unitNum)) !== -1;
    });
    
    if (unitTerms.length < 1) {
      unitTerms = state.items; // fallback
    }
    
    // Pick 3 random terms for this Unit's quest challenge
    var chosenTerms = shuffle(unitTerms).slice(0, 3);
    
    qz.questions = chosenTerms.map(function(it) {
      var distractors = sample(state.items, 3, it).map(function(x) {
        return x.term;
      });
      var defOpts = shuffle([it.term].concat(distractors));
      return {
        kind: "define",
        item: it,
        promptEn: "Unit " + unitNum + " Challenge: Which word means \"" + it.definition + "\"?",
        promptEs: it.definitionEs ? "Desafío de la Unidad " + unitNum + ": ¿Qué palabra significa «" + it.definitionEs + "»?" : "",
        options: defOpts.map(function(t) {
          return { text: t, correct: t === it.term };
        })
      };
    });
    
    qst.activeUnit = unitNum;
    qst.questions = qz.questions;
    qst.idx = 0;
    qst.score = 0;
    qst.halfHalfUsed = false;
    qst.translateUsed = false;
    qst.clueUsed = false;
    
    drawQuestQuestion();
  }

  function drawQuestQuestion() {
    view.innerHTML = "";
    var q = qst.questions[qst.idx];
    
    var bar = el("div", "scorebar");
    bar.innerHTML = 
      "<span>Unit " + qst.activeUnit + " Challenge · Q " + (qst.idx + 1) + " / " + qst.questions.length + "</span>" +
      "<span>🪙 <span id=" + '"qst-active-coins"' + ">" + store.coins + "</span></span>";
    view.appendChild(bar);

    var card = el("div", "quiz-card");
    
    // Prompts
    var showEs = state.lang !== "en" || qst.translateUsed;
    var showEn = state.lang !== "es" || !qst.translateUsed;

    if (showEn || !q.promptEs) {
      card.appendChild(el("p", "quiz-prompt", esc(q.promptEn)));
    }
    if (showEs && q.promptEs) {
      card.appendChild(el("p", "quiz-prompt-es", esc(q.promptEs)));
    }

    // SVG Clue
    var img = el("img", "quiz-img");
    img.src = q.item.image;
    img.alt = "Picture clue";
    img.id = "quest-clue-img";
    if (qst.clueUsed) {
      img.classList.add("glowing-clue");
    }
    card.appendChild(img);

    // ESOL Speech button
    card.appendChild(sayButtons(q.promptEn, q.promptEs));

    // Powerups Bar
    var pBar = el("div", "powerups-bar");
    pBar.innerHTML = '<strong>🎒 Power-ups:</strong>';
    
    var halfBtn = el("button", "powerup-btn", "🃏 50/50 (" + store.powerups.halfHalf + ")");
    halfBtn.disabled = store.powerups.halfHalf < 1 || qst.halfHalfUsed;
    halfBtn.addEventListener("click", function() {
      usePowerup("halfHalf", halfBtn);
    });
    pBar.appendChild(halfBtn);

    var transBtn = el("button", "powerup-btn", "🗣️ Translate (" + store.powerups.translate + ")");
    transBtn.disabled = store.powerups.translate < 1 || qst.translateUsed;
    transBtn.addEventListener("click", function() {
      usePowerup("translate", transBtn);
    });
    pBar.appendChild(transBtn);

    var clueBtn = el("button", "powerup-btn", "🔍 Clue (" + store.powerups.clue + ")");
    clueBtn.disabled = store.powerups.clue < 1 || qst.clueUsed;
    clueBtn.addEventListener("click", function() {
      usePowerup("clue", clueBtn);
    });
    pBar.appendChild(clueBtn);

    card.appendChild(pBar);

    // Options
    var optsWrap = el("div", "quiz-options");
    optsWrap.setAttribute("role", "group");
    q.options.forEach(function (o) {
      var b = el("button", "quiz-opt");
      b.type = "button";
      b.textContent = o.text;
      b.addEventListener("click", function () {
        answerQuest(b, o, q, optsWrap);
      });
      optsWrap.appendChild(b);
    });
    card.appendChild(optsWrap);

    // Feedback
    var fb = el("div", "quiz-feedback");
    fb.id = "qst-fb";
    card.appendChild(fb);
    view.appendChild(card);
    announce("Quest question " + (qst.idx + 1) + ". " + q.promptEn);
  }

  function usePowerup(kind, btn) {
    if (store.powerups[kind] < 1) return;
    store.powerups[kind]--;
    saveStore(store);
    
    btn.textContent = (kind === 'halfHalf' ? '🃏 50/50' : (kind === 'translate' ? '🗣️ Translate' : '🔍 Clue')) + " (" + store.powerups[kind] + ")";
    btn.disabled = true;
    
    if (kind === "halfHalf") {
      qst.halfHalfUsed = true;
      var q = qst.questions[qst.idx];
      var buttons = document.querySelectorAll(".quiz-opt");
      
      var wrongIndices = [];
      q.options.forEach(function(o, idx) {
        if (!o.correct) wrongIndices.push(idx);
      });
      
      var toRemove = shuffle(wrongIndices).slice(0, 2);
      toRemove.forEach(function(idx) {
        buttons[idx].disabled = true;
        buttons[idx].style.opacity = "0.35";
        buttons[idx].textContent = "—";
      });
      announce("Power-up activated. Removed 2 wrong choices.");
    }
    else if (kind === "translate") {
      qst.translateUsed = true;
      var q = qst.questions[qst.idx];
      if (q.promptEs) {
        drawQuestQuestion();
        say(q.promptEs, "es");
      }
      announce("Power-up activated. Translated definition to Spanish.");
    }
    else if (kind === "clue") {
      qst.clueUsed = true;
      var img = document.getElementById("quest-clue-img");
      if (img) {
        img.classList.add("glowing-clue");
      }
      
      var q = qst.questions[qst.idx];
      var firstLetter = q.item.term[0].toUpperCase();
      var hintText = el("div", "tag got-it", 'Clue: Starts with letter "' + firstLetter + '" / Empieza con "' + firstLetter + '"');
      hintText.style.margin = "8px auto";
      hintText.style.display = "block";
      hintText.style.width = "fit-content";
      hintText.style.fontSize = "1rem";
      document.querySelector(".quiz-card").insertBefore(hintText, document.querySelector(".powerups-bar"));
      announce("Power-up activated. Visual clue illuminated.");
    }
  }

  function answerQuest(btn, opt, q, wrap) {
    var buttons = wrap.querySelectorAll(".quiz-opt");
    buttons.forEach(function (b) {
      b.disabled = true;
    });
    
    // Reset powerup usages for next question
    qst.halfHalfUsed = false;
    qst.translateUsed = false;
    qst.clueUsed = false;

    var fb = document.getElementById("qst-fb");
    if (opt.correct) {
      btn.classList.add("correct");
      qst.score++;
      
      // Reward coins and XP immediately!
      store.coins += 5;
      store.xp += 20;
      saveStore(store);
      
      document.getElementById("qst-active-coins").textContent = store.coins;
      fb.className = "quiz-feedback ok";
      fb.textContent = "Correct! +🪙5 and +⚡20 XP!";
    } else {
      btn.classList.add("wrong");
      fb.className = "quiz-feedback no";
      q.options.forEach(function (o, i) {
        if (o.correct) buttons[i].classList.add("correct");
      });
      fb.textContent = "Wrong! The correct answer is highlighted.";
    }

    var nextBtn = el("button", "btn btn-primary");
    nextBtn.textContent = (qst.idx + 1 < qst.questions.length) ? "Next →" : "Finish Challenge";
    nextBtn.style.marginTop = "14px";
    nextBtn.addEventListener("click", function () {
      qst.idx++;
      if (qst.idx < qst.questions.length) {
        drawQuestQuestion();
      } else {
        finishQuestChallenge();
      }
    });
    document.querySelector(".quiz-card").appendChild(nextBtn);
    nextBtn.focus();
  }

  function finishQuestChallenge() {
    view.innerHTML = "";
    var isPerfect = qst.score === qst.questions.length;
    var pct = Math.round((qst.score / qst.questions.length) * 100);
    
    var card = el("div", "quiz-card");
    card.style.textAlign = "center";
    
    if (isPerfect) {
      card.innerHTML = 
        "<h2>🎉 CHALLENGE PASSED! 🎉</h2>" +
        '<p style="font-size:1.8rem; font-weight:800; color:var(--good);">★ PERFECT 3 / 3! ★</p>' +
        "<p>You earned a flawless perfect score! +🪙10 Gold and +⚡50 XP Perfect Bonus!</p>";
        
      store.coins += 10;
      store.xp += 50;
      
      // Level up progress!
      if (qst.activeUnit === store.questLevel) {
        store.questLevel++;
      }
      saveStore(store);
    } else {
      card.innerHTML = 
        "<h2>Challenge Finished</h2>" +
        '<p style="font-size:1.6rem; font-weight:800; color:var(--bad);">' + qst.score + " / 3 Correct</p>" +
        "<p>Try again to get a perfect 3/3 score to pass this station!</p>";
    }

    var returnBtn = el("button", "btn btn-primary", "🗺️ Return to Expedition Map");
    returnBtn.addEventListener("click", renderQuest);
    card.appendChild(returnBtn);
    view.appendChild(card);
    
    if (isPerfect) {
      celebrate("Expedition station " + qst.activeUnit + " conquered! / ¡Estación completada!");
    } else {
      announce("Expedition station finished. Score " + pct + " percent.");
    }
  }

  function showCertificate() {
    view.innerHTML = "";
    document.body.classList.add("print-cert");
    
    var container = el("div", "certificate-container");
    container.innerHTML = 
      '<div style="font-size:1.1rem; text-transform:uppercase; letter-spacing:0.15em; font-weight:800; color:var(--primary); margin-bottom:12px;">Certificate of Achievement</div>' +
      '<div style="font-size:0.95rem; font-style:italic; color:var(--ink-soft); margin-bottom:20px;">This certifies that the adventurer has completed all mathematical stations of the</div>' +
      '<h1 style="font-size:2.4rem; color:var(--primary); font-family:\'Georgia\', serif; margin:0 0 16px;">Vocabulary Expedition Quest</h1>' +
      '<div style="font-size:1rem; font-weight:700; color:var(--ink); margin-bottom:8px;">And is hereby officially declared a</div>' +
      '<div style="font-size:1.6rem; font-weight:900; color:var(--star); margin-bottom:20px;">★ GRADE 6 MATH VOCABULARY CHAMPION ★</div>' +
      '<div style="width:140px; height:2px; background:var(--primary); margin:20px auto;"></div>' +
      '<div style="font-size:1.1rem; font-weight:800; margin-bottom:20px;">Conquered Rank: <span style="color:var(--good);">' + getRank(store.xp) + '</span></div>' +
      '<div style="display:flex; justify-content:space-around; font-size:0.95rem; color:var(--ink-soft); border-top:1px dashed var(--border); padding-top:16px; margin-top:20px;">' +
        "<div><strong>Total Gold Earned:</strong> 🪙" + store.coins + "</div>" +
        "<div><strong>Total XP Accumulated:</strong> ⚡" + store.xp + "</div>" +
      "</div>" +
      '<div style="font-size:0.8rem; color:var(--ink-soft); margin-top:30px;">Certified by Neft Classroom Study Systems • Offline local-first storage verified.</div>';

    var btnRow = el("div", "btn-row no-print");
    btnRow.style.marginTop = "28px";
    
    var prtBtn = el("button", "btn btn-primary", "🖨️ Print Certificate");
    prtBtn.addEventListener("click", function() {
      window.print();
    });
    btnRow.appendChild(prtBtn);
    
    var retBtn = el("button", "btn", "← Back to Map");
    retBtn.addEventListener("click", function() {
      document.body.classList.remove("print-cert");
      renderQuest();
    });
    btnRow.appendChild(retBtn);
    
    container.appendChild(btnRow);
    view.appendChild(container);
    announce("Bilingual classroom achievement certificate ready for printing.");
  }

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
    else if (mode === "quest") renderQuest();
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
