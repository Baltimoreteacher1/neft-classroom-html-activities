/* english.js — Summer English 10 engine (v4).
   Two-level navigation: top module tabs -> activity sub-tabs (1-2 activities each).
   Activity types: reading+immediate-feedback quiz, match-up, fill-the-blank,
   sort-the-appeal, spot-the-error, flip cards, compose, study, game launch.
   Guide popups on every activity. Progress ring + badges (own localStorage).
   Uses shared.js for arcade audio only. */
(function () {
  "use strict";
  var E = window.ENG || {};
  var STORE = "ewl-aviad-english-v4";
  var prog = { done: {} };
  try {
    prog = JSON.parse(localStorage.getItem(STORE)) || { done: {} };
  } catch (e) {}
  if (!prog.done) prog.done = {};

  /* ---------- helpers ---------- */
  function el(t, c, h) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (h != null) n.innerHTML = h;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function audio(t) {
    if (window.EWL && EWL.playAudio) EWL.playAudio(t);
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(prog));
    } catch (e) {}
  }
  var TOTAL = 0;
  function markDone(id) {
    if (prog.done[id]) return;
    prog.done[id] = true;
    save();
    audio("success");
    updateRing();
  }

  /* ---------- modal / guide ---------- */
  var modalRoot;
  function ensureModal() {
    if (modalRoot) return;
    modalRoot = el("div", "eng-modal-backdrop");
    modalRoot.innerHTML =
      '<div class="eng-modal" role="dialog" aria-modal="true"><button class="eng-modal-x" aria-label="Close">&times;</button><div class="eng-modal-body"></div></div>';
    document.body.appendChild(modalRoot);
    modalRoot.addEventListener("click", function (e) {
      if (e.target === modalRoot) closeModal();
    });
    modalRoot
      .querySelector(".eng-modal-x")
      .addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }
  var lastFocus = null;
  function openModal(title, html) {
    ensureModal();
    lastFocus = document.activeElement;
    modalRoot.querySelector(".eng-modal-body").innerHTML =
      "<h2>" + esc(title) + "</h2>" + html;
    modalRoot.classList.add("show");
    modalRoot.querySelector(".eng-modal-x").focus();
  }
  function closeModal() {
    if (!modalRoot) return;
    modalRoot.classList.remove("show");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function guideButton(key) {
    var g = GUIDES[key] || GUIDES._default;
    var b = el("button", "eng-guide-btn", "💡 Guide & Hints");
    b.type = "button";
    b.addEventListener("click", function () {
      openModal(g.title, g.html);
    });
    return b;
  }

  /* ---------- activity shell ---------- */
  function panelHead(panel, opts) {
    var head = el("div", "eng-act-head");
    var left = el("div");
    left.appendChild(el("span", "eng-kicker", esc(opts.kicker || "Activity")));
    left.appendChild(el("h2", "eng-act-title", esc(opts.title)));
    if (opts.sub) left.appendChild(el("p", "eng-act-sub", opts.sub));
    head.appendChild(left);
    var right = el("div", "eng-act-tools");
    if (opts.guide) right.appendChild(guideButton(opts.guide));
    head.appendChild(right);
    panel.appendChild(head);
  }
  function doneBanner(panel, id) {
    var b = el(
      "div",
      "eng-done-banner" + (prog.done[id] ? " show" : ""),
      "✓ Completed — nice work!",
    );
    panel.appendChild(b);
    return b;
  }

  /* ============================================================
     ACTIVITY TYPES
     ============================================================ */

  // A. Reading passage + immediate-feedback quiz
  function actReadingQuiz(panel, p, moduleLabel) {
    panelHead(panel, {
      kicker: moduleLabel + " · " + (p.minutes || 15) + " min",
      title: p.title,
      sub:
        "<em>" + esc(p.source) + "</em> — " + esc(p.focus || "Close reading"),
      guide: "reading",
    });
    var banner = doneBanner(panel, p.id);
    var layout = el("div", "eng-read");
    var passage = el("div", "eng-passage");
    passage.innerHTML =
      '<div class="eng-genre">' + esc(p.genre) + "</div>" + p.text;
    var qcol = el("div", "eng-quiz");
    qcol.appendChild(
      el(
        "div",
        "eng-quiz-head",
        "Comprehension &amp; Analysis <span class='eng-progresspill'><b class='q-correct'>0</b>/" +
          p.questions.length +
          " correct</span>",
      ),
    );
    var correctEl = qcol.querySelector(".q-correct");
    var answered = 0,
      correct = 0;
    p.questions.forEach(function (q, qi) {
      var wrap = el("div", "eng-q");
      wrap.appendChild(
        el(
          "div",
          "eng-q-stem",
          '<span class="eng-q-num">' + (qi + 1) + "</span>" + esc(q.stem),
        ),
      );
      var opts = el("div", "eng-opts");
      q.options.forEach(function (o) {
        var opt = el(
          "button",
          "eng-opt",
          '<span class="eng-key">' +
            esc(o.key) +
            "</span><span>" +
            esc(o.text) +
            "</span>",
        );
        opt.type = "button";
        opt.addEventListener("click", function () {
          if (wrap.classList.contains("done")) return;
          wrap.classList.add("done");
          answered++;
          var ok = o.key === q.answer;
          if (ok) {
            correct++;
            correctEl.textContent = correct;
            opt.classList.add("correct");
            audio("success");
          } else {
            opt.classList.add("wrong");
            audio("fail");
            opts.querySelectorAll(".eng-opt").forEach(function (x) {
              if (x.querySelector(".eng-key").textContent === q.answer)
                x.classList.add("correct");
            });
          }
          opts.querySelectorAll(".eng-opt").forEach(function (x) {
            x.classList.add("locked");
          });
          wrap.querySelector(".eng-rationale").classList.add("show");
          if (answered === p.questions.length) {
            markDone(p.id);
            banner.classList.add("show");
          }
        });
        opts.appendChild(opt);
      });
      wrap.appendChild(opts);
      wrap.appendChild(
        el("div", "eng-rationale", "<strong>Why:</strong> " + esc(q.rationale)),
      );
      qcol.appendChild(wrap);
    });
    layout.appendChild(passage);
    layout.appendChild(qcol);
    panel.appendChild(layout);
  }

  // B. Click match-up (two columns), immediate feedback
  function actMatch(panel, opts) {
    panelHead(panel, {
      kicker: opts.kicker,
      title: opts.title,
      sub: opts.sub,
      guide: opts.guide,
    });
    var banner = doneBanner(panel, opts.id);
    var info = el(
      "div",
      "eng-inline-status",
      "Tap a term, then its match. <b class='m-done'>0</b>/" +
        opts.pairs.length +
        " matched.",
    );
    panel.appendChild(info);
    var doneEl = info.querySelector(".m-done");
    var board = el("div", "eng-match2");
    var left = el("div", "eng-col");
    var right = el("div", "eng-col");
    board.appendChild(left);
    board.appendChild(right);
    panel.appendChild(board);
    var sel = null,
      done = 0;
    shuffle(opts.pairs).forEach(function (p, i) {
      var a = el("button", "eng-mtile", esc(p.a));
      a.dataset.pid = i;
      a.dataset.side = "a";
      left.appendChild(a);
    });
    shuffle(opts.pairs).forEach(function (p, i) {
      var b = el("button", "eng-mtile", esc(p.b));
      b.dataset.pid = i;
      b.dataset.side = "b";
      right.appendChild(b);
    });
    board.querySelectorAll(".eng-mtile").forEach(function (tile) {
      tile.addEventListener("click", function () {
        if (tile.classList.contains("matched")) return;
        if (!sel) {
          sel = tile;
          tile.classList.add("sel");
          return;
        }
        if (sel === tile) {
          tile.classList.remove("sel");
          sel = null;
          return;
        }
        if (sel.dataset.side === tile.dataset.side) {
          sel.classList.remove("sel");
          sel = tile;
          tile.classList.add("sel");
          return;
        }
        if (sel.dataset.pid === tile.dataset.pid) {
          sel.classList.add("matched");
          tile.classList.add("matched");
          sel.classList.remove("sel");
          sel = null;
          done++;
          doneEl.textContent = done;
          audio("success");
          if (done === opts.pairs.length) {
            markDone(opts.id);
            banner.classList.add("show");
          }
        } else {
          var bad = sel,
            bad2 = tile;
          bad.classList.add("miss");
          bad2.classList.add("miss");
          audio("fail");
          setTimeout(function () {
            bad.classList.remove("miss", "sel");
            bad2.classList.remove("miss");
          }, 380);
          sel = null;
        }
      });
    });
  }

  // C. Fill-the-blank with options, immediate feedback
  function actFill(panel, opts) {
    panelHead(panel, {
      kicker: opts.kicker,
      title: opts.title,
      sub: opts.sub,
      guide: opts.guide,
    });
    var banner = doneBanner(panel, opts.id);
    var prog2 = el(
      "div",
      "eng-inline-status",
      "<b class='f-done'>0</b>/" + opts.items.length + " correct.",
    );
    panel.appendChild(prog2);
    var dEl = prog2.querySelector(".f-done");
    var done = 0,
      answered = 0;
    opts.items.forEach(function (it, i) {
      var card = el("div", "eng-fill");
      card.innerHTML =
        '<p class="eng-fill-stem">' +
        (i + 1) +
        ". " +
        it.stem.replace("___", '<span class="eng-blank">_____</span>') +
        "</p>";
      var row = el("div", "eng-fill-opts");
      shuffle(it.options).forEach(function (o) {
        var b = el("button", "eng-pillbtn", esc(o));
        b.addEventListener("click", function () {
          if (card.classList.contains("done")) return;
          card.classList.add("done");
          answered++;
          var ok = o === it.answer;
          if (ok) {
            done++;
            dEl.textContent = done;
            b.classList.add("correct");
            audio("success");
            card.querySelector(".eng-blank").textContent = o;
            card.querySelector(".eng-blank").classList.add("filled");
          } else {
            b.classList.add("wrong");
            audio("fail");
            row.querySelectorAll(".eng-pillbtn").forEach(function (x) {
              if (x.textContent === it.answer) x.classList.add("correct");
            });
          }
          row.querySelectorAll(".eng-pillbtn").forEach(function (x) {
            x.classList.add("locked");
          });
          card.insertAdjacentHTML(
            "beforeend",
            '<p class="eng-rationale show"><strong>Why:</strong> ' +
              esc(it.why) +
              "</p>",
          );
          if (answered === opts.items.length) {
            markDone(opts.id);
            banner.classList.add("show");
          }
        });
        row.appendChild(b);
      });
      card.appendChild(row);
      panel.appendChild(card);
    });
  }

  // D. Sort into bins (ethos/pathos/logos), immediate feedback
  function actSort(panel, opts) {
    panelHead(panel, {
      kicker: opts.kicker,
      title: opts.title,
      sub: opts.sub,
      guide: opts.guide,
    });
    var banner = doneBanner(panel, opts.id);
    var status = el(
      "div",
      "eng-inline-status",
      "Read the line, then pick its appeal. <b class='s-done'>0</b>/" +
        opts.items.length +
        " correct.",
    );
    panel.appendChild(status);
    var dEl = status.querySelector(".s-done");
    var items = shuffle(opts.items);
    var done = 0,
      answered = 0;
    items.forEach(function (it, i) {
      var card = el("div", "eng-sortcard");
      card.innerHTML = '<p class="eng-quote">“' + esc(it.quote) + "”</p>";
      var row = el("div", "eng-bins");
      opts.bins.forEach(function (bin) {
        var b = el("button", "eng-pillbtn", esc(bin.label));
        b.addEventListener("click", function () {
          if (card.classList.contains("done")) return;
          card.classList.add("done");
          answered++;
          var ok = bin.key === it.key;
          if (ok) {
            done++;
            dEl.textContent = done;
            b.classList.add("correct");
            audio("success");
          } else {
            b.classList.add("wrong");
            audio("fail");
            row.querySelectorAll(".eng-pillbtn").forEach(function (x) {
              if (x.textContent.toLowerCase().indexOf(it.key) >= 0)
                x.classList.add("correct");
            });
          }
          row.querySelectorAll(".eng-pillbtn").forEach(function (x) {
            x.classList.add("locked");
          });
          card.insertAdjacentHTML(
            "beforeend",
            '<p class="eng-rationale show"><strong>' +
              esc(it.key.toUpperCase()) +
              ":</strong> " +
              esc(it.why) +
              "</p>",
          );
          if (answered === items.length) {
            markDone(opts.id);
            banner.classList.add("show");
          }
        });
        row.appendChild(b);
      });
      card.appendChild(row);
      panel.appendChild(card);
    });
  }

  // E. Spot the error (untimed practice), immediate feedback
  function actSpot(panel, opts) {
    panelHead(panel, {
      kicker: opts.kicker,
      title: opts.title,
      sub: opts.sub,
      guide: opts.guide,
    });
    var banner = doneBanner(panel, opts.id);
    var status = el(
      "div",
      "eng-inline-status",
      "Tap the ONE wrong word in each sentence. <b class='e-done'>0</b>/" +
        opts.items.length +
        " found.",
    );
    panel.appendChild(status);
    var dEl = status.querySelector(".e-done");
    var done = 0;
    opts.items.forEach(function (it, i) {
      var card = el("div", "eng-spot");
      var label = el("div", "eng-spot-skill", it.skill);
      var sent = el("div", "eng-spot-sentence");
      it.words.forEach(function (w, wi) {
        var span = el("span", "eng-gword", esc(w) + " ");
        span.addEventListener("click", function () {
          if (card.classList.contains("done")) return;
          if (wi === it.errorIndex) {
            card.classList.add("done");
            span.classList.add("ok");
            done++;
            dEl.textContent = done;
            audio("success");
            card.insertAdjacentHTML(
              "beforeend",
              '<p class="eng-rationale show"><strong>Fix:</strong> “' +
                esc(it.words[it.errorIndex]) +
                "” → " +
                esc(it.fix) +
                " (" +
                esc(it.skill) +
                ")</p>",
            );
            if (done === opts.items.length) {
              markDone(opts.id);
              banner.classList.add("show");
            }
          } else {
            span.classList.add("no");
            audio("fail");
            setTimeout(function () {
              span.classList.remove("no");
            }, 350);
          }
        });
        sent.appendChild(span);
      });
      card.appendChild(label);
      card.appendChild(sent);
      panel.appendChild(card);
    });
  }

  // F. Flip cards (vocabulary study)
  function actFlip(panel, words) {
    panelHead(panel, {
      kicker: "Vocabulary · Study",
      title: "Word Wall",
      sub:
        "Tap a card to flip it. " + words.length + " academic words to know.",
      guide: "vocab",
    });
    var grid = el("div", "eng-flip-grid");
    words.forEach(function (w) {
      var c = el("button", "eng-flip");
      c.innerHTML =
        '<div class="eng-flip-inner"><div class="eng-flip-front"><span class="eng-word">' +
        esc(w.word) +
        '</span><span class="eng-pos">' +
        esc(w.pos) +
        "</span><span class='eng-tap'>tap to flip</span></div>" +
        '<div class="eng-flip-back"><span class="eng-def">' +
        esc(w.def) +
        '</span><span class="eng-sent">“' +
        esc(w.sentence) +
        "”</span></div></div>";
      c.addEventListener("click", function () {
        c.classList.toggle("flipped");
      });
      grid.appendChild(c);
    });
    panel.appendChild(grid);
    var b = el(
      "div",
      "eng-inline-status",
      "Studied them all? Mark this done to earn XP.",
    );
    var btn = el(
      "button",
      "btn",
      prog.done["vocab-wall"] ? "✓ Studied" : "I've studied these",
    );
    btn.addEventListener("click", function () {
      markDone("vocab-wall");
      btn.textContent = "✓ Studied";
    });
    b.appendChild(document.createElement("br"));
    b.appendChild(btn);
    panel.appendChild(b);
  }

  // G. Compose (writing prompt)
  function actCompose(panel, p, idx) {
    var id = "writing-" + idx;
    panelHead(panel, {
      kicker: "Writing · Compose",
      title: p.title,
      sub: esc(p.prompt),
      guide: "writing",
    });
    var banner = doneBanner(panel, id);
    var sc = el("div", "eng-scaffold");
    sc.innerHTML =
      "<span class='eng-step-label'>Scaffold</span><ul class='eng-checklist'>" +
      p.scaffold
        .map(function (s) {
          return "<li>" + esc(s) + "</li>";
        })
        .join("") +
      "</ul>";
    panel.appendChild(sc);
    var ta = el("textarea", "eng-textarea");
    ta.placeholder = "Draft your response here…";
    try {
      if (prog["text-" + id]) ta.value = prog["text-" + id];
    } catch (e) {}
    panel.appendChild(ta);
    var wc = el("div", "eng-wordcount", "Words: <b>0</b>");
    panel.appendChild(wc);
    var actions = el("div", "eng-actions");
    var saveb = el("button", "btn secondary", "Save draft");
    var doneb = el("button", "btn", "Mark complete");
    actions.appendChild(saveb);
    actions.appendChild(doneb);
    panel.appendChild(actions);
    function count() {
      var n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
      wc.innerHTML = "Words: <b>" + n + "</b>";
      return n;
    }
    ta.addEventListener("input", count);
    count();
    saveb.addEventListener("click", function () {
      prog["text-" + id] = ta.value;
      save();
      saveb.textContent = "Saved ✓";
      setTimeout(function () {
        saveb.textContent = "Save draft";
      }, 1200);
    });
    doneb.addEventListener("click", function () {
      if (count() < 30) {
        openModal(
          "Keep going!",
          "<p>Write at least a few sentences (30+ words) so your work is ready to log. Use the scaffold steps to build your response.</p>",
        );
        return;
      }
      prog["text-" + id] = ta.value;
      markDone(id);
      banner.classList.add("show");
      doneb.textContent = "✓ Completed";
    });
  }

  // H. Study reference (lessons / models / rubric)
  function actStudy(panel, opts) {
    panelHead(panel, {
      kicker: opts.kicker,
      title: opts.title,
      sub: opts.sub,
      guide: opts.guide,
    });
    var box = el("div", "eng-study");
    box.innerHTML = opts.html;
    panel.appendChild(box);
  }

  // I. Game launch tiles
  function actArcade(panel) {
    panelHead(panel, {
      kicker: "Arcade",
      title: "The Arcade",
      sub: "Four games open in their own full-screen page. Beat the goal and stack high scores!",
      guide: "arcade",
    });
    var grid = el("div", "eng-tiles");
    GAMES.forEach(function (g) {
      var a = el("a", "eng-tile-game");
      a.href = "/personal/aviad/english/games/" + g.slug + ".html";
      a.target = "_blank";
      a.rel = "noopener";
      a.style.setProperty("--tile", g.color);
      a.innerHTML =
        '<span class="eng-tile-ico">' +
        g.icon +
        "</span><span class='eng-tile-name'>" +
        esc(g.name) +
        "</span><span class='eng-tile-desc'>" +
        esc(g.desc) +
        "</span><span class='eng-tile-go'>Play in new tab ↗</span>";
      grid.appendChild(a);
    });
    panel.appendChild(grid);
  }

  /* ============================================================
     MODULE DEFINITIONS (build sub-tabs)
     ============================================================ */
  function readingModule(key, data, label, extraTabs) {
    var subs = data.passages.map(function (p, i) {
      return {
        label: "📄 " + shortTitle(p.title),
        render: function (panel) {
          actReadingQuiz(panel, p, label);
        },
      };
    });
    (extraTabs || []).forEach(function (t) {
      subs.push(t);
    });
    return {
      key: key,
      title: data.title,
      icon: data.icon,
      intro: data.intro,
      subs: subs,
    };
  }
  function shortTitle(t) {
    return t
      .replace(/^Excerpt:\s*/, "")
      .replace(/^The\s+/, "")
      .slice(0, 22);
  }

  function buildModules() {
    var mods = [];

    // Fiction + device match
    mods.push(
      readingModule("fiction", E.fiction, "Fiction", [
        {
          label: "🎯 Match the Device",
          render: function (panel) {
            actMatch(panel, {
              id: "fic-devices",
              kicker: "Fiction · Interactive",
              title: "Match the Literary Device",
              sub: "Pair each device with an example of it.",
              guide: "devices",
              pairs: (E.devices || []).slice(0, 8).map(function (d) {
                return { a: d.term, b: d.example };
              }),
            });
          },
        },
      ]),
    );

    // Nonfiction + sort the appeal
    mods.push(
      readingModule("nonfiction", E.nonfiction, "Rhetoric", [
        {
          label: "⚖️ Sort the Appeal",
          render: function (panel) {
            actSort(panel, {
              id: "nf-sort",
              kicker: "Rhetoric · Interactive",
              title: "Ethos, Pathos, or Logos?",
              sub: "Sort each persuasive line by its rhetorical appeal.",
              guide: "appeals",
              bins: [
                { key: "ethos", label: "🎓 Ethos" },
                { key: "pathos", label: "❤️ Pathos" },
                { key: "logos", label: "📊 Logos" },
              ],
              items: (E.rhetoric || []).map(function (r) {
                return { quote: r.quote, key: r.appeal, why: r.why };
              }),
            });
          },
        },
      ]),
    );

    // Poetry
    mods.push(readingModule("poetry", E.poetry, "Poetry", []));

    // Vocabulary
    var V = E.vocab || { words: [], contextQuiz: [] };
    mods.push({
      key: "vocab",
      title: V.title,
      icon: V.icon,
      intro: V.intro,
      subs: [
        {
          label: "🃏 Word Wall",
          render: function (panel) {
            actFlip(panel, V.words);
          },
        },
        {
          label: "🧩 Match-Up",
          render: function (panel) {
            actMatch(panel, {
              id: "vocab-match2",
              kicker: "Vocabulary · Interactive",
              title: "Word ↔ Meaning Match",
              sub: "Tap a word, then its definition.",
              guide: "vocab",
              pairs: shuffle(V.words)
                .slice(0, 8)
                .map(function (w) {
                  return { a: w.word, b: w.def };
                }),
            });
          },
        },
        {
          label: "✏️ Fill the Blank",
          render: function (panel) {
            actFill(panel, {
              id: "vocab-fill",
              kicker: "Vocabulary · Context",
              title: "Use It in Context",
              sub: "Pick the word that best completes each sentence.",
              guide: "context",
              items: buildVocabFill(V.words),
            });
          },
        },
        {
          label: "✅ Context Quiz",
          render: function (panel) {
            actReadingQuizLite(
              panel,
              "vocab-cquiz",
              "Vocabulary · Quiz",
              "Context Clues Quiz",
              "Use context to choose the best meaning.",
              V.contextQuiz,
              "context",
            );
          },
        },
      ],
    });

    // Grammar
    var G = E.grammar || { lessons: [], gauntlet: [], editItems: [] };
    mods.push({
      key: "grammar",
      title: G.title,
      icon: G.icon,
      intro: G.intro,
      subs: [
        {
          label: "📘 Lessons",
          render: function (panel) {
            actStudy(panel, {
              kicker: "Grammar · Study",
              title: "Grammar Lessons",
              sub: "Four high-value skills for English 10.",
              guide: "grammar",
              html: grammarLessonsHTML(G),
            });
          },
        },
        {
          label: "🔍 Spot the Error",
          render: function (panel) {
            actSpot(panel, {
              id: "grammar-spot",
              kicker: "Grammar · Interactive",
              title: "Spot the Error",
              sub: "Each sentence has one mistake.",
              guide: "spot",
              items: G.gauntlet,
            });
          },
        },
        {
          label: "🛠️ Revision Studio",
          render: function (panel) {
            actStudy(panel, {
              kicker: "Grammar · Revise",
              title: "Revision Studio",
              sub: "Compare weak sentences with strong revisions.",
              guide: "revise",
              html: revisionHTML(G),
            });
          },
        },
      ],
    });

    // Writing
    var W = E.writing || { models: [], rubric: [], prompts: [], checklist: [] };
    var wsubs = [
      {
        label: "🌟 Mentor Models",
        render: function (panel) {
          actStudy(panel, {
            kicker: "Writing · Study",
            title: "Mentor Models",
            sub: "Strong examples to emulate.",
            guide: "writing",
            html: modelsHTML(W),
          });
        },
      },
      {
        label: "📋 Rubric",
        render: function (panel) {
          actStudy(panel, {
            kicker: "Writing · Reference",
            title: "Analytical Writing Rubric",
            sub: "Know what a 4 looks like.",
            guide: "writing",
            html: rubricHTML(W),
          });
        },
      },
    ];
    W.prompts.forEach(function (p, i) {
      wsubs.push({
        label: "✍️ " + shortTitle(p.title),
        render: function (panel) {
          actCompose(panel, p, i);
        },
      });
    });
    mods.push({
      key: "writing",
      title: W.title,
      icon: W.icon,
      intro: W.intro,
      subs: wsubs,
    });

    // Arcade
    mods.push({
      key: "arcade",
      title: "The Arcade",
      icon: "🎮",
      intro:
        "Four fast games that turn skills into reflexes — each opens in its own page.",
      subs: [{ label: "🎮 Games", render: actArcade }],
    });

    return mods;
  }

  // lite quiz reused for context quiz (no passage)
  function actReadingQuizLite(panel, id, kicker, title, sub, questions, guide) {
    actReadingQuiz(
      panel,
      {
        id: id,
        title: title,
        source: "",
        focus: sub,
        genre: "Quiz",
        minutes: 10,
        text: "",
        questions: questions,
      },
      kicker.split(" · ")[0],
    );
    // hide empty passage
    var pas = panel.querySelector(".eng-passage");
    if (pas) pas.style.display = "none";
    var head = panel.querySelector(".eng-act-sub");
    if (head) head.innerHTML = esc(sub);
  }

  function buildVocabFill(words) {
    var pick = shuffle(words).slice(0, 8);
    return pick.map(function (w) {
      var distract = shuffle(
        words.filter(function (x) {
          return x.word !== w.word;
        }),
      )
        .slice(0, 3)
        .map(function (x) {
          return x.word;
        });
      var stem = w.sentence.replace(new RegExp(w.word, "i"), "___");
      if (stem.indexOf("___") === -1)
        stem = "Choose the word that means “" + w.def + "”: ___";
      return {
        stem: stem,
        options: [w.word].concat(distract),
        answer: w.word,
        why: w.word + " — " + w.def,
      };
    });
  }
  function grammarLessonsHTML(G) {
    return G.lessons
      .map(function (L) {
        return (
          '<div class="eng-card2"><h3>' +
          esc(L.title) +
          "</h3><p>" +
          esc(L.rule) +
          "</p>" +
          L.examples
            .map(function (e) {
              return (
                '<p class="eng-ex"><span class="x">✗</span> ' +
                esc(e.wrong) +
                '<br><span class="c">✓</span> ' +
                esc(e.right) +
                "<br><em>" +
                esc(e.note) +
                "</em></p>"
              );
            })
            .join("") +
          "</div>"
        );
      })
      .join("");
  }
  function revisionHTML(G) {
    return (G.editItems || [])
      .map(function (e, i) {
        return (
          '<div class="eng-card2"><h3>' +
          (i + 1) +
          ". " +
          esc(e.skill) +
          '</h3><p class="eng-ex"><span class="x">Weak:</span> ' +
          esc(e.bad) +
          '<br><span class="c">Strong:</span> ' +
          esc(e.good) +
          "</p></div>"
        );
      })
      .join("");
  }
  function modelsHTML(W) {
    return W.models
      .map(function (m) {
        return (
          '<div class="eng-card2"><h3>' +
          esc(m.type) +
          " — " +
          esc(m.title) +
          "</h3><blockquote>" +
          esc(m.text) +
          "</blockquote><ul class='eng-checklist'>" +
          (m.annotations || [])
            .map(function (a) {
              return "<li>" + esc(a) + "</li>";
            })
            .join("") +
          "</ul></div>"
        );
      })
      .join("");
  }
  function rubricHTML(W) {
    return (
      '<table class="eng-rubric"><tr><th>Criterion</th><th>4 — Advanced</th><th>3 — Proficient</th><th>2 — Developing</th></tr>' +
      W.rubric
        .map(function (r) {
          return (
            "<tr><td>" +
            esc(r.criterion) +
            "</td><td>" +
            esc(r.level4) +
            "</td><td>" +
            esc(r.level3) +
            "</td><td>" +
            esc(r.level2) +
            "</td></tr>"
          );
        })
        .join("") +
      "</table>"
    );
  }

  /* ============================================================
     GUIDES (popup content)
     ============================================================ */
  var GUIDES = {
    reading: {
      title: "How to read closely",
      html: "<ul class='eng-checklist'><li><b>Preview:</b> note the title, author, and the focus skill listed at the top.</li><li><b>Annotate as you read:</b> watch for tone words, repeated ideas, and anything surprising.</li><li><b>For each question:</b> find the line in the passage that proves your answer before you click.</li><li>Wrong answer? Read the <b>Why</b> explanation — it tells you the trap.</li></ul>",
    },
    devices: {
      title: "Literary devices",
      html: "<p>Match each <b>device</b> to an <b>example</b> of it. Hints:</p><ul class='eng-checklist'><li><b>Simile</b> uses <i>like/as</i>; a <b>metaphor</b> does not.</li><li><b>Personification</b> gives human traits to non-human things.</li><li><b>Hyperbole</b> is obvious exaggeration; <b>imagery</b> paints a sensory picture.</li><li><b>Irony</b> = the opposite of what's expected.</li></ul>",
    },
    appeals: {
      title: "Ethos · Pathos · Logos",
      html: "<ul class='eng-checklist'><li><b>Ethos</b> = credibility/character (“As a doctor of 30 years…”).</li><li><b>Pathos</b> = emotion (“Imagine your child hungry…”).</li><li><b>Logos</b> = logic/data (“Studies show a 15% rise…”).</li></ul><p>Ask: is the speaker using <b>who they are</b>, <b>how you feel</b>, or <b>facts</b>?</p>",
    },
    vocab: {
      title: "Studying academic words",
      html: "<ul class='eng-checklist'><li>Flip each card: read the <b>word</b>, guess the meaning, then check.</li><li>Say it in your own sentence.</li><li>Notice the part of speech — it changes how you use the word.</li></ul>",
    },
    context: {
      title: "Using context clues",
      html: "<ul class='eng-checklist'><li>Read the <b>whole</b> sentence first.</li><li>Look for <b>signal words</b>: <i>but, because, however, such as</i>.</li><li>Predict the meaning, then pick the closest option.</li></ul>",
    },
    grammar: {
      title: "Grammar tips",
      html: "<ul class='eng-checklist'><li><b>Comma splice:</b> two complete sentences joined by only a comma — use a period, semicolon, or conjunction.</li><li><b>Subject-verb agreement:</b> singular subject → singular verb.</li><li><b>Parallel structure:</b> keep items in a list in the same form.</li></ul>",
    },
    spot: {
      title: "Spot the error",
      html: "<p>Each sentence has exactly <b>one</b> wrong word. Read it aloud in your head — the error often “sounds” wrong. Check verbs, pronouns, and commas first.</p>",
    },
    revise: {
      title: "Revising sentences",
      html: "<ul class='eng-checklist'><li>Cut empty phrases (<i>there are, the fact that</i>).</li><li>Prefer strong verbs over <i>is/was + noun</i>.</li><li>Keep one clear idea per sentence.</li></ul>",
    },
    writing: {
      title: "Writing like a scholar",
      html: "<ul class='eng-checklist'><li>Open with a clear <b>claim</b> (thesis).</li><li>Support it with <b>evidence</b> (a quote or detail).</li><li>Add <b>reasoning</b> — explain how the evidence proves the claim.</li><li>Use the rubric: aim for the “4 — Advanced” column.</li></ul>",
    },
    arcade: {
      title: "About the games",
      html: "<ul class='eng-checklist'><li><b>Word Defender</b> — match falling devices to definitions.</li><li><b>Vocab Match</b> — clear the board of word/definition pairs.</li><li><b>Grammar Gauntlet</b> — beat the clock spotting errors.</li><li><b>Rhetoric Rally</b> — sort lines by appeal.</li></ul><p>Each opens in a new tab and saves your high score.</p>",
    },
    _default: {
      title: "Guide",
      html: "<p>Work through the activity. You'll get instant feedback on each answer.</p>",
    },
  };

  var GAMES = [
    {
      slug: "word-defender",
      name: "Word Defender",
      icon: "🛡️",
      desc: "Match falling literary devices to their definitions.",
      color: "#a855f7",
    },
    {
      slug: "vocab-match",
      name: "Vocab Match",
      icon: "🧩",
      desc: "Clear the board of word + definition pairs.",
      color: "#ec4899",
    },
    {
      slug: "grammar-gauntlet",
      name: "Grammar Gauntlet",
      icon: "⚡",
      desc: "Beat the clock spotting one error per sentence.",
      color: "#06b6d4",
    },
    {
      slug: "rhetoric-rally",
      name: "Rhetoric Rally",
      icon: "⚖️",
      desc: "Sort persuasive lines into ethos, pathos, or logos.",
      color: "#f59e0b",
    },
  ];

  /* ============================================================
     PROGRESS RING + BADGES
     ============================================================ */
  function updateRing() {
    var done = Object.keys(prog.done).filter(function (k) {
      return prog.done[k];
    }).length;
    var pct = TOTAL ? Math.round((done / TOTAL) * 100) : 0;
    var ring = document.querySelector(".eng-ring-fill");
    if (ring) {
      var C = 2 * Math.PI * 54;
      ring.style.strokeDasharray = C;
      ring.style.strokeDashoffset = C * (1 - pct / 100);
    }
    set("eng-ring-pct", pct + "%");
    set("eng-ring-xp", done * 50 + " XP");
    set("eng-ring-done", done + " / " + TOTAL);
    var badges = [
      ["b-start", done >= 1],
      ["b-reader", countPrefix(["fic-", "nf-", "po-"]) >= 3],
      [
        "b-wordsmith",
        prog.done["vocab-wall"] ||
        prog.done["vocab-match2"] ||
        prog.done["vocab-fill"] ||
        prog.done["vocab-cquiz"]
          ? true
          : false,
      ],
      ["b-grammar", prog.done["grammar-spot"] ? true : false],
      ["b-scholar", pct >= 60],
      ["b-champion", pct >= 100],
    ];
    badges.forEach(function (b) {
      var e = document.getElementById(b[0]);
      if (e) e.classList.toggle("earned", !!b[1]);
    });
  }
  function countPrefix(prefixes) {
    return Object.keys(prog.done).filter(function (k) {
      return (
        prog.done[k] &&
        prefixes.some(function (p) {
          return k.indexOf(p) === 0;
        })
      );
    }).length;
  }
  function set(id, v) {
    var e = document.getElementById(id);
    if (e) e.textContent = v;
  }

  /* ============================================================
     RENDER NAV (two levels)
     ============================================================ */
  function build() {
    var app = document.getElementById("eng-app");
    var topTabs = document.getElementById("eng-tabs");
    if (!app || !topTabs || !E.fiction) return;
    var mods = buildModules();

    // count total completable activities (exclude pure-study tabs)
    TOTAL = 0;
    var studyKeys = 0;
    mods.forEach(function (m) {
      m.subs.forEach(function (s) {
        // estimate: every sub with an id-based activity counts; study/arcade don't
      });
    });
    // Simpler: total = reading passages + interactive + vocab(4) + grammar spot + writing prompts
    TOTAL =
      E.fiction.passages.length +
      1 + // fiction + device match
      E.nonfiction.passages.length +
      1 + // + sort
      E.poetry.passages.length +
      4 + // vocab: wall, match, fill, cquiz
      1 + // grammar spot
      E.writing.prompts.length;

    var sections = [];
    // overview
    var ovBtn = topTab("overview", "🏠 Overview");
    var ovSec = el("section", "eng-section");
    ovSec.appendChild(overviewHTML(mods));
    app.appendChild(ovSec);
    sections.push({ key: "overview", el: ovSec });

    mods.forEach(function (m) {
      topTab(m.key, (m.icon || "📘") + " " + tabName(m.title));
      var sec = el("section", "eng-section");
      sec.style.display = "none";
      // module intro
      var intro = el("div", "eng-module-intro");
      intro.innerHTML =
        '<div class="eng-m-ico">' +
        (m.icon || "📘") +
        "</div><div><h2>" +
        esc(m.title) +
        "</h2><p>" +
        (m.intro || "") +
        "</p></div>";
      sec.appendChild(intro);
      // sub-tabs
      var subbar = el("div", "eng-subtabs");
      var panelHost = el("div", "eng-panelhost");
      m.subs.forEach(function (s, si) {
        var sb = el("button", "eng-subtab", esc(s.label));
        sb.addEventListener("click", function () {
          subbar.querySelectorAll(".eng-subtab").forEach(function (x) {
            x.classList.remove("active");
          });
          sb.classList.add("active");
          panelHost.innerHTML = "";
          var panel = el("div", "eng-panel");
          s.render(panel);
          panelHost.appendChild(panel);
          panelHost.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
        subbar.appendChild(sb);
      });
      sec.appendChild(subbar);
      sec.appendChild(panelHost);
      app.appendChild(sec);
      sections.push({
        key: m.key,
        el: sec,
        firstSub: subbar.querySelector(".eng-subtab"),
      });
    });

    function topTab(key, label) {
      var b = el("button", "tab", esc(label));
      b.dataset.mod = key;
      b.setAttribute("aria-selected", key === "overview" ? "true" : "false");
      b.addEventListener("click", function () {
        topTabs.querySelectorAll(".tab").forEach(function (t) {
          t.setAttribute("aria-selected", String(t === b));
        });
        sections.forEach(function (s) {
          s.el.style.display = s.key === key ? "" : "none";
          if (
            s.key === key &&
            s.firstSub &&
            !s.el.querySelector(".eng-subtab.active")
          )
            s.firstSub.click();
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      topTabs.appendChild(b);
      return b;
    }
    function tabName(t) {
      return t
        .replace("Nonfiction & ", "")
        .replace(" & Conventions", "")
        .replace(" & Figurative Language", "")
        .replace(" & Literary Analysis", "")
        .replace("Academic ", "");
    }

    updateRing();
  }

  function tabName2(t) {
    return t;
  }

  function overviewHTML(mods) {
    var wrap = el("div", "eng-overview");
    wrap.innerHTML =
      '<div class="eng-module-intro"><div class="eng-m-ico">🎓</div><div><h2>Your Summer English 10 Mission</h2><p>Six modules build the reading, vocabulary, grammar, and writing skills you will use at Pikesville High. Pick a module tab, then work through its activities — you get <b>instant feedback</b> on every answer.</p></div></div>';
    var grid = el("div", "eng-overview-grid");
    mods.forEach(function (m) {
      if (m.key === "arcade") return;
      var c = el("div", "eng-ov-card");
      c.innerHTML =
        '<span class="eng-ov-ico">' +
        (m.icon || "📘") +
        "</span><h3>" +
        esc(m.title) +
        "</h3><p>" +
        esc((m.intro || "").replace(/<[^>]+>/g, "")) +
        "</p><span class='eng-ov-count'>" +
        m.subs.length +
        " activities</span>";
      c.addEventListener("click", function () {
        var t = document.querySelector('.tab[data-mod="' + m.key + '"]');
        if (t) t.click();
      });
      grid.appendChild(c);
    });
    // arcade highlight
    var arc = el("div", "eng-ov-card eng-ov-arcade");
    arc.innerHTML =
      '<span class="eng-ov-ico">🎮</span><h3>The Arcade</h3><p>Four games open in their own page — Word Defender, Vocab Match, Grammar Gauntlet, Rhetoric Rally.</p><span class="eng-ov-count">Play ↗</span>';
    arc.addEventListener("click", function () {
      var t = document.querySelector('.tab[data-mod="arcade"]');
      if (t) t.click();
    });
    grid.appendChild(arc);
    wrap.appendChild(grid);
    return wrap;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", build);
  else build();
})();
