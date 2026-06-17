/* english.js — Summer English 10 engine.
   Renders 6 content modules + 4 interactive games from window.ENG data.
   Integrates with shared.js: cards are .activity[data-id][data-type] so XP,
   completion, and saving work. Module tab switching is section-based (own tabs).
*/
(function () {
  "use strict";
  var E = window.ENG || {};

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
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

  var app = document.getElementById("eng-app");
  var tabsEl = document.getElementById("eng-tabs");

  /* ---------- module section + tab scaffold ---------- */
  function makeSection(key, data) {
    var sec = el("section", "eng-section");
    sec.dataset.module = key;
    if (key !== "overview") sec.style.display = "none";
    var intro = el("div", "eng-module-intro");
    intro.innerHTML =
      '<div class="eng-m-ico">' +
      (data.icon || "📘") +
      "</div><div><h2>" +
      esc(data.title) +
      "</h2><p>" +
      (data.intro || "") +
      '</p><span class="eng-m-tag">English 10 · Summer Module</span></div>';
    sec.appendChild(intro);
    var grid = el("div", "grid");
    sec.appendChild(grid);
    app.appendChild(sec);
    return grid;
  }

  var TABS = [];
  function addTab(key, label) {
    var b = el("button", "tab", esc(label));
    b.dataset.mod = key;
    b.setAttribute("aria-selected", key === "overview" ? "true" : "false");
    b.addEventListener("click", function () {
      TABS.forEach(function (t) {
        t.setAttribute("aria-selected", String(t === b));
      });
      document.querySelectorAll(".eng-section").forEach(function (s) {
        s.style.display = s.dataset.module === key ? "" : "none";
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    tabsEl.appendChild(b);
    TABS.push(b);
  }

  /* ---------- card shell with complete/save ---------- */
  function activityCard(grid, opts) {
    var card = el("article", "activity");
    card.dataset.id = opts.id;
    card.dataset.type = opts.type;
    if (opts.gate) card.dataset.gate = opts.gate;
    if (opts.need) card.dataset.need = String(opts.need);
    var meta = el("div", "meta");
    (opts.pills || []).forEach(function (p, i) {
      meta.appendChild(el("span", "pill" + (i === 0 ? " accent" : ""), esc(p)));
    });
    card.appendChild(meta);
    card.appendChild(el("h3", null, esc(opts.title)));
    if (opts.sub) card.appendChild(el("p", null, opts.sub));
    var body = el("div", "activity-interactive-area");
    card.appendChild(body);
    if (opts.includeText) {
      var ta = el("textarea");
      ta.id = "evidence-text-" + opts.id;
      ta.placeholder = opts.placeholder || "Type your response here…";
      ta.style.marginTop = "12px";
      card.appendChild(ta);
    }
    if (!opts.noActions) {
      var actions = el("div", "actions");
      var save = el("button", "btn secondary", "Save workspace");
      save.setAttribute("data-save", "");
      var done = el("button", "btn", opts.completeLabel || "Mark complete");
      done.setAttribute("data-complete", "");
      actions.appendChild(save);
      actions.appendChild(done);
      card.appendChild(actions);
    }
    grid.appendChild(card);
    return { card: card, body: body };
  }

  function refPanel(grid, title, buildBody) {
    var card = el("article", "activity eng-ref");
    card.style.cursor = "default";
    var head = el("div", "meta");
    head.appendChild(el("span", "pill accent", "Study"));
    card.appendChild(head);
    card.appendChild(el("h3", null, esc(title)));
    var body = el("div");
    buildBody(body);
    card.appendChild(body);
    grid.appendChild(card);
  }

  /* ---------- auto-graded reading/quiz cards ---------- */
  function renderPassageCard(grid, type, p) {
    var built = activityCard(grid, {
      id: p.id,
      type: type,
      gate: "quiz",
      need: 3,
      pills: [type, p.minutes + " min", p.focus || "Close reading"],
      title: p.title,
      sub: "<em>" + esc(p.source) + "</em>",
      completeLabel: "Log to portfolio",
    });
    var layout = el("div", "reading-layout");
    var passage = el("div", "passage-panel");
    passage.innerHTML =
      '<p style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);font-weight:800;margin-bottom:10px;">' +
      esc(p.genre) +
      "</p>" +
      p.text;
    layout.appendChild(passage);

    var qPanel = el("div", "questions-panel");
    var state = { answered: {}, graded: false };
    p.questions.forEach(function (q, qi) {
      var wrap = el("div", "eng-q");
      wrap.appendChild(
        el(
          "div",
          "eng-q-stem",
          '<span class="eng-q-num">' + (qi + 1) + ".</span>" + esc(q.stem),
        ),
      );
      q.options.forEach(function (o) {
        var opt = el(
          "div",
          "eng-opt",
          '<span class="eng-key">' +
            esc(o.key) +
            "</span><span>" +
            esc(o.text) +
            "</span>",
        );
        opt.addEventListener("click", function () {
          if (state.graded) return;
          wrap.querySelectorAll(".eng-opt").forEach(function (x) {
            x.classList.remove("selected");
          });
          opt.classList.add("selected");
          state.answered[qi] = o.key;
        });
        wrap.appendChild(opt);
      });
      var rat = el(
        "div",
        "eng-rationale",
        "<strong>Why:</strong> " + esc(q.rationale),
      );
      wrap.appendChild(rat);
      qPanel.appendChild(wrap);
    });

    // grade button + score
    var gradeBar = el("div", "actions");
    var gradeBtn = el("button", "btn", "Check answers");
    var scoreTag = el("span", "eng-score-tag", "Not graded");
    gradeBar.appendChild(gradeBtn);
    gradeBar.appendChild(scoreTag);
    qPanel.appendChild(gradeBar);

    gradeBtn.addEventListener("click", function () {
      var correct = 0;
      var qWraps = qPanel.querySelectorAll(".eng-q");
      p.questions.forEach(function (q, qi) {
        var w = qWraps[qi];
        var opts = w.querySelectorAll(".eng-opt");
        opts.forEach(function (opt) {
          opt.classList.add("locked");
          var key = opt.querySelector(".eng-key").textContent;
          if (key === q.answer) opt.classList.add("correct");
          else if (opt.classList.contains("selected"))
            opt.classList.add("wrong");
        });
        w.querySelector(".eng-rationale").classList.add("show");
        if (state.answered[qi] === q.answer) correct++;
      });
      state.graded = true;
      var total = p.questions.length;
      scoreTag.textContent = "Score: " + correct + " / " + total;
      scoreTag.classList.toggle("pass", correct >= 3);
      gradeBtn.disabled = true;
      gradeBtn.style.opacity = "0.5";
      audio(correct >= 3 ? "success" : "fail");
      if (correct >= 3) built.card.dataset.ready = "1";
      built.card._engScore = correct;
    });

    layout.appendChild(qPanel);
    built.body.appendChild(layout);
  }

  /* ---------- vocabulary ---------- */
  function renderVocab(grid, V) {
    // study grid (reference)
    refPanel(
      grid,
      "Word Wall — " + V.words.length + " academic words",
      function (body) {
        var vg = el("div", "eng-vocab-grid");
        V.words.forEach(function (w) {
          var c = el("div", "eng-vcard");
          c.innerHTML =
            '<div class="eng-word">' +
            esc(w.word) +
            '</div><div class="eng-pos">' +
            esc(w.pos) +
            '</div><div class="eng-def">' +
            esc(w.def) +
            '</div><div class="eng-sent">"' +
            esc(w.sentence) +
            '"</div>';
          vg.appendChild(c);
        });
        body.appendChild(vg);
      },
    );

    // context quiz (auto-graded activity)
    var built = activityCard(grid, {
      id: "vocab-context",
      type: "Vocabulary",
      gate: "quiz",
      need: 7,
      pills: ["Vocabulary", "Context clues", V.contextQuiz.length + " items"],
      title: "Context Clues Quiz",
      sub: "Use context to choose the best meaning. Aim for 7+ correct.",
      completeLabel: "Log to portfolio",
    });
    var state = { ans: {}, graded: false };
    V.contextQuiz.forEach(function (q, qi) {
      var wrap = el("div", "eng-q");
      wrap.appendChild(
        el(
          "div",
          "eng-q-stem",
          '<span class="eng-q-num">' + (qi + 1) + ".</span>" + esc(q.stem),
        ),
      );
      q.options.forEach(function (o) {
        var opt = el(
          "div",
          "eng-opt",
          '<span class="eng-key">' +
            esc(o.key) +
            "</span><span>" +
            esc(o.text) +
            "</span>",
        );
        opt.addEventListener("click", function () {
          if (state.graded) return;
          wrap.querySelectorAll(".eng-opt").forEach(function (x) {
            x.classList.remove("selected");
          });
          opt.classList.add("selected");
          state.ans[qi] = o.key;
        });
        wrap.appendChild(opt);
      });
      wrap.appendChild(
        el("div", "eng-rationale", "<strong>Why:</strong> " + esc(q.rationale)),
      );
      built.body.appendChild(wrap);
    });
    var bar = el("div", "actions");
    var gb = el("button", "btn", "Check answers");
    var st = el("span", "eng-score-tag", "Not graded");
    bar.appendChild(gb);
    bar.appendChild(st);
    built.body.appendChild(bar);
    gb.addEventListener("click", function () {
      var correct = 0;
      var ws = built.body.querySelectorAll(".eng-q");
      V.contextQuiz.forEach(function (q, qi) {
        var w = ws[qi];
        w.querySelectorAll(".eng-opt").forEach(function (opt) {
          opt.classList.add("locked");
          var key = opt.querySelector(".eng-key").textContent;
          if (key === q.answer) opt.classList.add("correct");
          else if (opt.classList.contains("selected"))
            opt.classList.add("wrong");
        });
        w.querySelector(".eng-rationale").classList.add("show");
        if (state.ans[qi] === q.answer) correct++;
      });
      state.graded = true;
      st.textContent = "Score: " + correct + " / " + V.contextQuiz.length;
      st.classList.toggle("pass", correct >= 7);
      gb.disabled = true;
      gb.style.opacity = "0.5";
      audio(correct >= 7 ? "success" : "fail");
      if (correct >= 7) built.card.dataset.ready = "1";
    });
    // (Vocab Match game lives in the Arcade tab.)
  }

  /* ---------- grammar ---------- */
  function renderGrammar(grid, G) {
    refPanel(grid, "Grammar Lessons", function (body) {
      G.lessons.forEach(function (L) {
        var m = el("div", "eng-model");
        var ex = L.examples
          .map(function (e) {
            return (
              '<p style="margin:6px 0;font-size:.86rem;"><span style="color:var(--danger);">✗</span> ' +
              esc(e.wrong) +
              '<br><span style="color:var(--success);">✓</span> ' +
              esc(e.right) +
              '<br><em style="color:var(--text-muted);font-size:.8rem;">' +
              esc(e.note) +
              "</em></p>"
            );
          })
          .join("");
        m.innerHTML =
          "<h4>" + esc(L.title) + "</h4><p>" + esc(L.rule) + "</p>" + ex;
        body.appendChild(m);
      });
    });

    // edit practice (text activity)
    var built = activityCard(grid, {
      id: "grammar-edit",
      type: "Grammar",
      gate: "text",
      pills: ["Grammar", "Revision", G.editItems.length + " items"],
      title: "Revision Studio",
      sub: "Rewrite each weak sentence. Then log your best revisions.",
      includeText: true,
      placeholder: "Rewrite each sentence below in your own words…",
      completeLabel: "Log to portfolio",
    });
    var list = el("div");
    G.editItems.forEach(function (e, i) {
      var d = el("div", "eng-model");
      d.innerHTML =
        "<h4>" +
        (i + 1) +
        ". " +
        esc(e.skill) +
        '</h4><p style="font-size:.88rem;"><strong style="color:var(--danger);">Weak:</strong> ' +
        esc(e.bad) +
        '</p><button class="btn secondary" style="margin-top:8px;font-size:.78rem;padding:6px 12px;">Reveal a strong revision</button><p class="eng-reveal" style="display:none;margin-top:8px;font-size:.88rem;color:var(--success);"><strong>Model:</strong> ' +
        esc(e.good) +
        "</p>";
      d.querySelector("button").addEventListener("click", function () {
        var r = d.querySelector(".eng-reveal");
        r.style.display = r.style.display === "none" ? "block" : "none";
      });
      list.appendChild(d);
    });
    built.body.insertBefore(list, built.body.firstChild);
    // (Grammar Gauntlet game lives in the Arcade tab.)
  }

  /* ---------- writing ---------- */
  function renderWriting(grid, W) {
    refPanel(grid, "Mentor Models", function (body) {
      W.models.forEach(function (m) {
        var d = el("div", "eng-model");
        var ann = (m.annotations || [])
          .map(function (a) {
            return "<li>" + esc(a) + "</li>";
          })
          .join("");
        d.innerHTML =
          "<h4>" +
          esc(m.type) +
          " — " +
          esc(m.title) +
          "</h4><p>" +
          esc(m.text) +
          '</p><ul class="eng-checklist" style="margin-top:10px;">' +
          ann +
          "</ul>";
        body.appendChild(d);
      });
    });

    refPanel(grid, "Analytical Writing Rubric", function (body) {
      var t = el("table", "eng-rubric");
      var head =
        "<tr><th>Criterion</th><th>4 — Advanced</th><th>3 — Proficient</th><th>2 — Developing</th></tr>";
      var rows = W.rubric
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
        .join("");
      t.innerHTML = head + rows;
      body.appendChild(t);
    });

    W.prompts.forEach(function (p, i) {
      var built = activityCard(grid, {
        id: "writing-" + i,
        type: "Writing",
        gate: "text",
        pills: ["Writing", "Compose"],
        title: p.title,
        sub: esc(p.prompt),
        includeText: true,
        placeholder: "Draft your response here…",
        completeLabel: "Log to portfolio",
      });
      var sc = el("div");
      sc.innerHTML =
        '<span class="eng-step-label">Scaffold</span><ul class="eng-checklist">' +
        p.scaffold
          .map(function (s) {
            return "<li>" + esc(s) + "</li>";
          })
          .join("") +
        "</ul>";
      built.body.appendChild(sc);
      // live word count
      var ta = built.card.querySelector("textarea");
      var wc = el("div", "eng-wordcount", "Words: <b>0</b>");
      built.card.insertBefore(wc, built.card.querySelector(".actions"));
      ta.addEventListener("input", function () {
        var n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
        wc.innerHTML = "Words: <b>" + n + "</b>";
        if (ta.value.trim().length >= 40) built.card.dataset.ready = "1";
        else built.card.dataset.ready = "";
      });
    });

    refPanel(grid, "Revision Checklist", function (body) {
      body.innerHTML =
        '<ul class="eng-checklist">' +
        W.checklist
          .map(function (c) {
            return "<li>" + esc(c) + "</li>";
          })
          .join("") +
        "</ul>";
    });
  }

  /* ============================================================
     GAMES
     ============================================================ */

  /* --- Game 1: Word Defender (canvas) --- */
  function renderWordDefender(grid) {
    var devices = E.devices || [];
    var GOAL = 150;
    var built = activityCard(grid, {
      id: "game-word-defender",
      type: "Arcade",
      gate: "game",
      pills: ["Arcade Game", "Literary Devices", "Goal: " + GOAL],
      title: "Word Defender",
      sub: "Read the definition, then tap the matching device before the word falls. 3 lives.",
      completeLabel: "Log to portfolio",
    });
    var wrap = el("div", "game-container");
    wrap.innerHTML =
      '<div class="game-hud"><span class="game-score-card">Score: <span class="wd-score">0</span></span><span class="game-score-card">Lives: <span class="wd-lives">3</span></span></div>' +
      '<canvas class="game-canvas"></canvas>' +
      '<div class="game-overlay"><h4>Word Defender</h4><p style="max-width:42ch;">Match falling literary devices to their definitions. Reach ' +
      GOAL +
      ' points!</p><button class="btn wd-start">Insert Coin ▶</button></div>';
    built.body.appendChild(wrap);
    var hs = el("div", "eng-wordcount");
    hs.style.textAlign = "center";
    hs.innerHTML =
      'High score: <b style="color:var(--gold);" class="wd-high">0</b>';
    built.body.appendChild(hs);

    var canvas = wrap.querySelector("canvas");
    var ctx = canvas.getContext("2d");
    var overlay = wrap.querySelector(".game-overlay");
    var scoreEl = wrap.querySelector(".wd-score");
    var livesEl = wrap.querySelector(".wd-lives");
    var highEl = hs.querySelector(".wd-high");
    var score = 0,
      lives = 3,
      playing = false,
      falling = [],
      shields = [],
      particles = [],
      round = null,
      nextSpawn = 0,
      raf = null;

    function resize() {
      var r = wrap.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = (r.width * 9) / 16;
    }
    window.addEventListener("resize", resize);
    resize();

    function newRound() {
      round = devices[Math.floor(Math.random() * devices.length)];
      var opts = [round.term];
      while (opts.length < 3) {
        var t = devices[Math.floor(Math.random() * devices.length)].term;
        if (opts.indexOf(t) === -1) opts.push(t);
      }
      opts = shuffle(opts);
      shields = [];
      var w = canvas.width / 3.4;
      for (var i = 0; i < 3; i++) {
        shields.push({
          x: (i + 0.5) * (canvas.width / 3) - w / 2,
          y: canvas.height - 42,
          w: w,
          h: 34,
          term: opts[i],
        });
      }
      falling = [
        {
          x: Math.random() * (canvas.width - 120) + 60,
          y: 60,
          term: round.term,
          speed: 0.9 + score * 0.004,
        },
      ];
    }
    function boom(x, y, c) {
      for (var i = 0; i < 16; i++)
        particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.5) * 7,
          r: Math.random() * 3 + 1,
          c: c,
          a: 1,
        });
    }
    function hud() {
      scoreEl.textContent = score;
      livesEl.textContent = lives;
    }
    canvas.addEventListener("click", function (e) {
      if (!playing) return;
      var r = canvas.getBoundingClientRect();
      var x = (e.clientX - r.left) * (canvas.width / r.width);
      var y = (e.clientY - r.top) * (canvas.height / r.height);
      shields.forEach(function (s) {
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
          if (s.term === round.term) {
            score += 25;
            audio("powerup");
            boom(s.x + s.w / 2, s.y, "#c084fc");
            falling = [];
            hud();
            if (score >= GOAL) {
              built.card.dataset.ready = "1";
            }
            newRound();
          } else {
            lives--;
            audio("fail");
            boom(x, y, "#ef4444");
            hud();
            if (lives <= 0) end(false);
          }
        }
      });
    });
    function loop() {
      if (!playing) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(30,41,59,0.85)";
      ctx.fillRect(8, 8, canvas.width - 16, 46);
      ctx.strokeStyle = "#a855f7";
      ctx.strokeRect(8, 8, canvas.width - 16, 46);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      wrapText(
        ctx,
        "DEFINE: " + round.def,
        canvas.width / 2,
        26,
        canvas.width - 40,
        16,
      );
      if (Date.now() > nextSpawn && falling.length === 0) {
        newRound();
        nextSpawn = Date.now() + 600;
      }
      falling.forEach(function (f) {
        f.y += f.speed;
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#a855f7";
        var tw = ctx.measureText(f.term).width + 24;
        ctx.fillRect(f.x - tw / 2, f.y - 16, tw, 28);
        ctx.strokeRect(f.x - tw / 2, f.y - 16, tw, 28);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.fillText(f.term, f.x, f.y + 3);
        if (f.y > canvas.height - 48) {
          lives--;
          audio("hit");
          falling = [];
          hud();
          if (lives <= 0) {
            end(false);
            return;
          }
          newRound();
        }
      });
      shields.forEach(function (s) {
        ctx.fillStyle = "rgba(168,85,247,0.18)";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = "#c084fc";
        ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.fillText(s.term, s.x + s.w / 2, s.y + 22);
      });
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.a -= 0.03;
        ctx.globalAlpha = Math.max(p.a, 0);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      particles = particles.filter(function (p) {
        return p.a > 0;
      });
      raf = requestAnimationFrame(loop);
    }
    function end(win) {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      var isHigh =
        window.EWL && EWL.saveHighScore
          ? EWL.saveHighScore("word-defender", score)
          : false;
      highEl.textContent =
        (window.EWL && EWL.state.highScores["word-defender"]) || score;
      overlay.style.display = "flex";
      overlay.querySelector("h4").textContent =
        score >= GOAL ? "Victory!" : "Game Over";
      overlay.querySelector("p").textContent =
        "You scored " +
        score +
        ". " +
        (score >= GOAL
          ? "Activity unlocked — log it below!"
          : "Reach " + GOAL + " to log it.") +
        (isHigh ? " New high score!" : "");
      overlay.querySelector("button").textContent = "Play again ▶";
    }
    wrap.querySelector(".wd-start").addEventListener("click", function () {
      if (playing) return;
      audio("game-start");
      score = 0;
      lives = 3;
      falling = [];
      particles = [];
      playing = true;
      nextSpawn = Date.now();
      overlay.style.display = "none";
      hud();
      newRound();
      loop();
    });
    highEl.textContent =
      (window.EWL &&
        EWL.state.highScores &&
        EWL.state.highScores["word-defender"]) ||
      0;
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = text.split(" "),
      line = "",
      yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxW && i > 0) {
        ctx.fillText(line, x, yy);
        line = words[i] + " ";
        yy += lh;
      } else line = test;
    }
    ctx.fillText(line, x, yy);
  }

  /* --- Game 2: Vocab Match --- */
  function renderVocabMatch(grid, V) {
    var built = activityCard(grid, {
      id: "game-vocab-match",
      type: "Vocabulary",
      gate: "match",
      pills: ["Arcade Game", "Match", "8 pairs"],
      title: "Vocab Match",
      sub: "Match each academic word to its definition. Fewer misses = higher score.",
      completeLabel: "Log to portfolio",
    });
    var info = el("div", "actions");
    var newBtn = el("button", "btn secondary", "🔀 New round");
    var tag = el("span", "eng-score-tag", "Pairs: 0 / 8");
    info.appendChild(newBtn);
    info.appendChild(tag);
    built.body.appendChild(info);
    var gridEl = el("div", "eng-match-grid");
    gridEl.style.marginTop = "12px";
    built.body.appendChild(gridEl);

    var sel = null,
      matched = 0,
      misses = 0;
    function start() {
      gridEl.innerHTML = "";
      sel = null;
      matched = 0;
      misses = 0;
      tag.textContent = "Pairs: 0 / 8";
      var pick = shuffle(V.words).slice(0, 8);
      var tiles = [];
      pick.forEach(function (w, i) {
        tiles.push({ pid: i, kind: "w", text: w.word });
        tiles.push({ pid: i, kind: "d", text: w.def });
      });
      shuffle(tiles).forEach(function (t) {
        var tile = el("div", "eng-tile", esc(t.text));
        tile.dataset.pid = t.pid;
        tile.addEventListener("click", function () {
          if (tile.classList.contains("matched") || tile === sel) return;
          tile.classList.add("sel");
          if (!sel) {
            sel = tile;
            return;
          }
          if (sel.dataset.pid === tile.dataset.pid) {
            sel.classList.add("matched");
            tile.classList.add("matched");
            sel.classList.remove("sel");
            tile.classList.remove("sel");
            sel = null;
            matched++;
            audio("success");
            tag.textContent = "Pairs: " + matched + " / 8";
            if (matched === 8) {
              built.card.dataset.ready = "1";
              tag.classList.add("pass");
              var sc = Math.max(10, 100 - misses * 8);
              if (window.EWL && EWL.saveHighScore)
                EWL.saveHighScore("vocab-match", sc);
              audio("powerup");
            }
          } else {
            misses++;
            audio("fail");
            var a = sel,
              b = tile;
            a.classList.add("miss");
            b.classList.add("miss");
            setTimeout(function () {
              a.classList.remove("miss", "sel");
              b.classList.remove("miss", "sel");
            }, 350);
            sel = null;
          }
        });
        gridEl.appendChild(tile);
      });
    }
    newBtn.addEventListener("click", start);
    start();
  }

  /* --- Game 3: Grammar Gauntlet --- */
  function renderGauntlet(grid, G) {
    var GOAL = 6;
    var built = activityCard(grid, {
      id: "game-gauntlet",
      type: "Grammar",
      gate: "game",
      pills: ["Arcade Game", "Spot the Error", "Goal: " + GOAL],
      title: "Grammar Gauntlet",
      sub:
        "Each sentence has ONE error. Tap the wrong word before the timer runs out. Get " +
        GOAL +
        " right.",
      completeLabel: "Log to portfolio",
    });
    var hud = el("div", "actions");
    var startBtn = el("button", "btn", "Start ▶");
    var tag = el("span", "eng-score-tag", "Score: 0");
    var skill = el("span", "pill", "—");
    hud.appendChild(startBtn);
    hud.appendChild(tag);
    hud.appendChild(skill);
    built.body.appendChild(hud);
    var timer = el("div", "eng-timer-bar");
    var fill = el("div", "eng-timer-fill");
    timer.appendChild(fill);
    built.body.appendChild(timer);
    var sentBox = el(
      "div",
      "eng-gaunt-sentence",
      '<span style="color:var(--text-muted);">Press Start to begin.</span>',
    );
    built.body.appendChild(sentBox);
    var fb = el("div", "feedback-msg");
    built.body.appendChild(fb);

    var pool = [],
      idx = 0,
      score = 0,
      tInt = null,
      tLeft = 0,
      active = false;
    function showFeedback(ok, msg) {
      fb.textContent = (ok ? "✓ " : "✗ ") + msg;
      fb.className = "feedback-msg show " + (ok ? "correct" : "incorrect");
      setTimeout(function () {
        fb.className = "feedback-msg";
      }, 1100);
    }
    function next() {
      if (idx >= pool.length) {
        return finish();
      }
      var item = pool[idx];
      skill.textContent = item.skill;
      sentBox.innerHTML = "";
      item.words.forEach(function (w, wi) {
        var span = el("span", "eng-gword", esc(w) + " ");
        span.addEventListener("click", function () {
          if (!active) return;
          if (wi === item.errorIndex) {
            score++;
            audio("powerup");
            span.style.background = "var(--success-glow)";
            showFeedback(true, "Fix: " + item.fix + " (" + item.skill + ")");
            tag.textContent = "Score: " + score;
            tag.classList.toggle("pass", score >= GOAL);
            if (score >= GOAL) built.card.dataset.ready = "1";
            active = false;
            clearInterval(tInt);
            setTimeout(adv, 700);
          } else {
            audio("fail");
            span.style.background = "var(--danger-glow)";
            showFeedback(false, "Not that one — keep looking!");
          }
        });
        sentBox.appendChild(span);
      });
      tLeft = 100;
      fill.style.width = "100%";
      active = true;
      clearInterval(tInt);
      tInt = setInterval(function () {
        tLeft -= 1.4;
        fill.style.width = Math.max(tLeft, 0) + "%";
        if (tLeft <= 0) {
          clearInterval(tInt);
          active = false;
          audio("hit");
          var corr = sentBox.children[item.errorIndex];
          if (corr) corr.style.background = "var(--accent-light)";
          showFeedback(
            false,
            "Time! It was: " + item.words[item.errorIndex] + " → " + item.fix,
          );
          setTimeout(adv, 900);
        }
      }, 60);
    }
    function adv() {
      idx++;
      next();
    }
    function finish() {
      active = false;
      clearInterval(tInt);
      sentBox.innerHTML =
        "<strong>Round complete!</strong> You fixed " +
        score +
        " of " +
        pool.length +
        " errors. " +
        (score >= GOAL
          ? "Activity unlocked — log it below."
          : "Reach " + GOAL + " to log it.");
      if (window.EWL && EWL.saveHighScore)
        EWL.saveHighScore("grammar-gauntlet", score * 10);
      startBtn.textContent = "Play again ▶";
      audio(score >= GOAL ? "success" : "fail");
    }
    startBtn.addEventListener("click", function () {
      audio("game-start");
      pool = shuffle(G.gauntlet).slice(0, 10);
      idx = 0;
      score = 0;
      tag.textContent = "Score: 0";
      tag.classList.remove("pass");
      next();
    });
  }

  /* --- Game 4: Rhetoric Rally --- */
  function renderRhetoricRally(grid) {
    var items = E.rhetoric || [];
    var GOAL = 8;
    var built = activityCard(grid, {
      id: "game-rhetoric",
      type: "Arcade",
      gate: "game",
      pills: ["Arcade Game", "Ethos / Pathos / Logos", "Goal: " + GOAL],
      title: "Rhetoric Rally",
      sub:
        "Read each line and sort it into the correct appeal. Get " +
        GOAL +
        " correct.",
      completeLabel: "Log to portfolio",
    });
    var hud = el("div", "actions");
    var startBtn = el("button", "btn", "Start ▶");
    var tag = el("span", "eng-score-tag", "Score: 0");
    hud.appendChild(startBtn);
    hud.appendChild(tag);
    built.body.appendChild(hud);
    var quoteBox = el(
      "div",
      "eng-gaunt-sentence",
      '<span style="color:var(--text-muted);">Press Start to begin.</span>',
    );
    built.body.appendChild(quoteBox);
    var btns = el("div", "actions");
    ["ethos", "pathos", "logos"].forEach(function (ap) {
      var b = el(
        "button",
        "btn secondary",
        ap.charAt(0).toUpperCase() + ap.slice(1),
      );
      b.dataset.ap = ap;
      b.style.flex = "1";
      b.addEventListener("click", function () {
        choose(ap);
      });
      btns.appendChild(b);
    });
    built.body.appendChild(btns);
    var fb = el("div", "feedback-msg");
    built.body.appendChild(fb);

    var pool = [],
      idx = 0,
      score = 0,
      active = false;
    function render() {
      if (idx >= pool.length) return finish();
      quoteBox.innerHTML = '"' + esc(pool[idx].quote) + '"';
      active = true;
    }
    function choose(ap) {
      if (!active) return;
      active = false;
      var it = pool[idx];
      var ok = ap === it.appeal;
      if (ok) score++;
      tag.textContent = "Score: " + score;
      tag.classList.toggle("pass", score >= GOAL);
      if (score >= GOAL) built.card.dataset.ready = "1";
      fb.textContent =
        (ok ? "✓ " : "✗ ") + it.appeal.toUpperCase() + " — " + it.why;
      fb.className = "feedback-msg show " + (ok ? "correct" : "incorrect");
      audio(ok ? "powerup" : "fail");
      setTimeout(function () {
        fb.className = "feedback-msg";
        idx++;
        render();
      }, 1100);
    }
    function finish() {
      quoteBox.innerHTML =
        "<strong>Done!</strong> You sorted " +
        score +
        " of " +
        pool.length +
        " correctly. " +
        (score >= GOAL
          ? "Activity unlocked — log it below."
          : "Reach " + GOAL + " to log it.");
      if (window.EWL && EWL.saveHighScore)
        EWL.saveHighScore("rhetoric-rally", score * 10);
      startBtn.textContent = "Play again ▶";
      audio(score >= GOAL ? "success" : "fail");
    }
    startBtn.addEventListener("click", function () {
      audio("game-start");
      pool = shuffle(items).slice(0, 10);
      idx = 0;
      score = 0;
      tag.textContent = "Score: 0";
      tag.classList.remove("pass");
      render();
    });
  }

  /* ============================================================
     completion gate + progress ring
     ============================================================ */
  window.checkInteractiveComplete = function (card) {
    if (card.dataset.ready === "1") return { success: true };
    var gate = card.dataset.gate;
    if (gate === "text") {
      var t = card.querySelector("textarea");
      if (t && t.value.trim().length >= 40) return { success: true };
      return {
        success: false,
        message: "Write at least a few sentences first, then log it.",
      };
    }
    if (gate === "quiz")
      return {
        success: false,
        message:
          "Check your answers and get at least " +
          (card.dataset.need || 3) +
          " correct first.",
      };
    if (gate === "game")
      return {
        success: false,
        message: "Reach the score goal in the game first!",
      };
    if (gate === "match")
      return { success: false, message: "Match all 8 pairs first!" };
    return { success: true };
  };

  function updateRing() {
    var cards = document.querySelectorAll(".activity:not(.eng-ref)");
    var done = document.querySelectorAll(".activity:not(.eng-ref).done").length;
    var total = cards.length || 1;
    var pct = Math.round((done / total) * 100);
    var ring = document.querySelector(".eng-ring-fill");
    if (ring) {
      var C = 2 * Math.PI * 54;
      ring.style.strokeDasharray = C;
      ring.style.strokeDashoffset = C * (1 - pct / 100);
    }
    var pctEl = document.getElementById("eng-ring-pct");
    if (pctEl) pctEl.textContent = pct + "%";
    var xpEl = document.getElementById("eng-ring-xp");
    if (xpEl) xpEl.textContent = done * 50 + " XP";
    var dEl = document.getElementById("eng-ring-done");
    if (dEl) dEl.textContent = done + " / " + total;
    // badges
    var rules = [
      { id: "b-start", on: done >= 1 },
      {
        id: "b-reader",
        on:
          countDoneType("Fiction") +
            countDoneType("Nonfiction") +
            countDoneType("Poetry") >=
          3,
      },
      { id: "b-wordsmith", on: countDoneType("Vocabulary") >= 1 },
      { id: "b-gamer", on: countDoneType("Arcade") + gameDone() >= 2 },
      { id: "b-scholar", on: pct >= 60 },
      { id: "b-champion", on: pct >= 100 },
    ];
    rules.forEach(function (r) {
      var b = document.getElementById(r.id);
      if (b) b.classList.toggle("earned", r.on);
    });
  }
  function countDoneType(type) {
    return document.querySelectorAll('.activity.done[data-type="' + type + '"]')
      .length;
  }
  function gameDone() {
    return document.querySelectorAll(
      ".activity.done[data-gate='game'], .activity.done[data-gate='match']",
    ).length;
  }

  /* ============================================================
     BUILD
     ============================================================ */
  function build() {
    if (!app || !E.fiction) return;
    addTab("overview", "🏠 Overview");
    addTab("Fiction", "📖 Fiction");
    addTab("Nonfiction", "🏛️ Rhetoric");
    addTab("Poetry", "🪶 Poetry");
    addTab("Vocabulary", "🧠 Vocabulary");
    addTab("Grammar", "✍️ Grammar");
    addTab("Writing", "🖊️ Writing");
    addTab("Arcade", "🎮 Arcade");

    // Overview section (intro + how-to)
    var ov = makeSection("overview", {
      icon: "🎓",
      title: "Your Summer English 10 Mission",
      intro:
        "Six modules build the reading, vocabulary, grammar, and writing skills you'll use at Pikesville High. Read closely, score 3+ on each quiz, beat the arcade games, and log your work to earn XP and badges.",
    });
    var howto = el("article", "activity eng-ref");
    howto.style.cursor = "default";
    howto.innerHTML =
      '<div class="meta"><span class="pill accent">Start here</span></div><h3>How it works</h3>' +
      '<ul class="eng-checklist" style="margin-top:6px;">' +
      "<li><b>Read &amp; analyze</b> 9 classic passages, then auto-grade your answers with instant explanations.</li>" +
      "<li><b>Master 24 academic words</b> and prove it in the Context Clues Quiz and Vocab Match game.</li>" +
      "<li><b>Sharpen grammar</b> with mini-lessons and the timed Grammar Gauntlet.</li>" +
      "<li><b>Write like a scholar</b> using mentor models, a rubric, and guided prompts.</li>" +
      "<li><b>Play 4 arcade games</b> — Word Defender, Vocab Match, Grammar Gauntlet &amp; Rhetoric Rally.</li>" +
      "<li>Hit <b>Log to portfolio</b> on each activity to earn 50 XP and unlock badges.</li>" +
      "</ul>";
    ov.appendChild(howto);

    // Fiction
    var fg = makeSection("Fiction", E.fiction);
    E.fiction.passages.forEach(function (p) {
      renderPassageCard(fg, "Fiction", p);
    });

    // Nonfiction
    var ng = makeSection("Nonfiction", E.nonfiction);
    E.nonfiction.passages.forEach(function (p) {
      renderPassageCard(ng, "Nonfiction", p);
    });

    // Poetry
    var pg = makeSection("Poetry", E.poetry);
    E.poetry.passages.forEach(function (p) {
      renderPassageCard(pg, "Poetry", p);
    });

    // Vocabulary (+ match game)
    var vg = makeSection("Vocabulary", E.vocab);
    renderVocab(vg, E.vocab);

    // Grammar (+ gauntlet)
    var gg = makeSection("Grammar", E.grammar);
    renderGrammar(gg, E.grammar);

    // Writing
    var wg = makeSection("Writing", E.writing);
    renderWriting(wg, E.writing);

    // Arcade — all four games together
    var ag = makeSection("Arcade", {
      icon: "🎮",
      title: "The Arcade",
      intro:
        "Four games that turn skills into reflexes. Beat the goal in each to log it and stack high scores.",
    });
    renderWordDefender(ag);
    renderRhetoricRally(ag);
    // Re-render match + gauntlet instances for the arcade view
    renderVocabMatch(ag, E.vocab);
    renderGauntlet(ag, E.grammar);

    // stats in hero
    var totalQ = 0;
    [E.fiction, E.nonfiction, E.poetry].forEach(function (m) {
      m.passages.forEach(function (p) {
        totalQ += p.questions.length;
      });
    });
    var sEl = document.getElementById("eng-stat-content");
    if (sEl)
      sEl.textContent =
        E.fiction.passages.length +
        E.nonfiction.passages.length +
        E.poetry.passages.length +
        " passages · " +
        totalQ +
        " questions";

    // progress ring observer
    var obs = new MutationObserver(updateRing);
    obs.observe(app, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"],
    });
    setTimeout(updateRing, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
