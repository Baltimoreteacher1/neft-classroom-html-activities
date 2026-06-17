/* games.js — full-page versions of the English 10 arcade games.
   Each game mounts into a container via window.ENG_GAMES[name](container).
   Auto-mounts onto <div id="game-root" data-game="..."> if present.
   Reads window.ENG data; uses window.EWL (shared.js) for audio + high scores. */
(function () {
  "use strict";
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
  function high(id, score) {
    if (window.EWL && EWL.saveHighScore) return EWL.saveHighScore(id, score);
    return false;
  }
  function getHigh(id) {
    try {
      return (
        (window.EWL &&
          EWL.state &&
          EWL.state.highScores &&
          EWL.state.highScores[id]) ||
        0
      );
    } catch (e) {
      return 0;
    }
  }
  var E = window.ENG || {};

  /* ---------------- Word Defender ---------------- */
  function wordDefender(root) {
    var devices = E.devices || [];
    var GOAL = 150;
    root.innerHTML =
      '<div class="eng-hud"><span class="eng-chip">Score: <b class="g-score">0</b></span>' +
      '<span class="eng-chip">Lives: <b class="g-lives">3</b></span>' +
      '<span class="eng-chip">High: <b class="g-high">0</b></span></div>' +
      '<div class="eng-stage"><canvas class="eng-canvas"></canvas>' +
      '<div class="eng-overlay"><h2>Word Defender</h2><p>Read the definition up top, then tap the matching device before the word falls. Reach ' +
      GOAL +
      ' points. 3 lives.</p><button class="btn g-start">Insert Coin ▶</button></div></div>';
    var canvas = root.querySelector(".eng-canvas");
    var ctx = canvas.getContext("2d");
    var overlay = root.querySelector(".eng-overlay");
    var scoreEl = root.querySelector(".g-score"),
      livesEl = root.querySelector(".g-lives"),
      highEl = root.querySelector(".g-high");
    highEl.textContent = getHigh("word-defender");
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
      var r = canvas.parentNode.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    }
    window.addEventListener("resize", resize);
    function wrapText(text, x, y, maxW, lh) {
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
      for (var i = 0; i < 3; i++)
        shields.push({
          x: (i + 0.5) * (canvas.width / 3) - w / 2,
          y: canvas.height - 54,
          w: w,
          h: 40,
          term: opts[i],
        });
      falling = [
        {
          x: Math.random() * (canvas.width - 140) + 70,
          y: 70,
          term: round.term,
          speed: 0.8 + score * 0.004,
        },
      ];
    }
    function boom(x, y, c) {
      for (var i = 0; i < 18; i++)
        particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
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
            newRound();
          } else {
            lives--;
            audio("fail");
            boom(x, y, "#ef4444");
            hud();
            if (lives <= 0) end();
          }
        }
      });
    });
    function loop() {
      if (!playing) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(30,41,59,0.9)";
      ctx.fillRect(10, 10, canvas.width - 20, 54);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, 54);
      ctx.fillStyle = "#fff";
      ctx.font = "600 16px Inter, sans-serif";
      ctx.textAlign = "center";
      wrapText(
        "DEFINE: " + round.def,
        canvas.width / 2,
        34,
        canvas.width - 48,
        20,
      );
      if (Date.now() > nextSpawn && falling.length === 0) {
        newRound();
        nextSpawn = Date.now() + 600;
      }
      falling.forEach(function (f) {
        f.y += f.speed;
        ctx.font = "700 18px Inter, sans-serif";
        var tw = ctx.measureText(f.term).width + 30;
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#a855f7";
        ctx.fillRect(f.x - tw / 2, f.y - 20, tw, 34);
        ctx.strokeRect(f.x - tw / 2, f.y - 20, tw, 34);
        ctx.fillStyle = "#fff";
        ctx.fillText(f.term, f.x, f.y + 4);
        if (f.y > canvas.height - 62) {
          lives--;
          audio("hit");
          falling = [];
          hud();
          if (lives <= 0) {
            end();
            return;
          }
          newRound();
        }
      });
      shields.forEach(function (s) {
        ctx.fillStyle = "rgba(168,85,247,0.2)";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = "#c084fc";
        ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = "#fff";
        ctx.font = "700 15px Inter, sans-serif";
        ctx.fillText(s.term, s.x + s.w / 2, s.y + 25);
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
    function end() {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      var isHigh = high("word-defender", score);
      highEl.textContent = getHigh("word-defender");
      overlay.style.display = "flex";
      overlay.querySelector("h2").textContent =
        score >= GOAL ? "🏆 You won!" : "Game Over";
      overlay.querySelector("p").textContent =
        "You scored " +
        score +
        ". " +
        (score >= GOAL ? "You hit the goal!" : "Reach " + GOAL + " to win.") +
        (isHigh ? " New high score!" : "");
      overlay.querySelector("button").textContent = "Play again ▶";
    }
    root.querySelector(".g-start").addEventListener("click", function () {
      if (playing) return;
      resize();
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
  }

  /* ---------------- Vocab Match ---------------- */
  function vocabMatch(root) {
    var V = E.vocab || { words: [] };
    var PAIRS = 8;
    root.innerHTML =
      '<div class="eng-hud"><span class="eng-chip">Pairs: <b class="g-pairs">0</b>/' +
      PAIRS +
      "</span>" +
      '<span class="eng-chip">Misses: <b class="g-miss">0</b></span>' +
      '<button class="btn secondary g-new">🔀 New round</button></div>' +
      '<div class="eng-match"></div>';
    var board = root.querySelector(".eng-match"),
      pairsEl = root.querySelector(".g-pairs"),
      missEl = root.querySelector(".g-miss");
    var sel = null,
      matched = 0,
      misses = 0;
    function start() {
      board.innerHTML = "";
      sel = null;
      matched = 0;
      misses = 0;
      pairsEl.textContent = "0";
      missEl.textContent = "0";
      var pick = shuffle(V.words).slice(0, PAIRS);
      var tiles = [];
      pick.forEach(function (w, i) {
        tiles.push({ pid: i, text: w.word, kind: "w" });
        tiles.push({ pid: i, text: w.def, kind: "d" });
      });
      shuffle(tiles).forEach(function (t) {
        var tile = el(
          "button",
          "eng-tile" + (t.kind === "w" ? " is-word" : ""),
          esc(t.text),
        );
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
            pairsEl.textContent = matched;
            if (matched === PAIRS) {
              high("vocab-match", Math.max(10, 100 - misses * 8));
              audio("powerup");
              setTimeout(function () {
                board.insertAdjacentHTML(
                  "afterbegin",
                  '<div class="eng-win">🎉 All matched with ' +
                    misses +
                    " misses!</div>",
                );
              }, 200);
            }
          } else {
            misses++;
            missEl.textContent = misses;
            audio("fail");
            var a = sel,
              b = tile;
            a.classList.add("miss");
            b.classList.add("miss");
            setTimeout(function () {
              a.classList.remove("miss", "sel");
              b.classList.remove("miss", "sel");
            }, 380);
            sel = null;
          }
        });
        board.appendChild(tile);
      });
    }
    root.querySelector(".g-new").addEventListener("click", start);
    start();
  }

  /* ---------------- Grammar Gauntlet ---------------- */
  function grammarGauntlet(root) {
    var G = E.grammar || { gauntlet: [] };
    root.innerHTML =
      '<div class="eng-hud"><button class="btn g-start">Start ▶</button>' +
      '<span class="eng-chip">Score: <b class="g-score">0</b></span>' +
      '<span class="eng-chip g-skill">—</span></div>' +
      '<div class="eng-timer"><div class="eng-timer-fill"></div></div>' +
      '<div class="eng-sentence"><span class="muted">Press Start. Each sentence has ONE error — tap the wrong word before time runs out.</span></div>' +
      '<div class="eng-feedback"></div>';
    var startBtn = root.querySelector(".g-start"),
      scoreEl = root.querySelector(".g-score"),
      skillEl = root.querySelector(".g-skill"),
      fill = root.querySelector(".eng-timer-fill"),
      sentBox = root.querySelector(".eng-sentence"),
      fb = root.querySelector(".eng-feedback");
    var pool = [],
      idx = 0,
      score = 0,
      tInt = null,
      tLeft = 0,
      active = false;
    function showFB(ok, msg) {
      fb.textContent = (ok ? "✓ " : "✗ ") + msg;
      fb.className = "eng-feedback show " + (ok ? "ok" : "no");
      setTimeout(function () {
        fb.className = "eng-feedback";
      }, 1200);
    }
    function next() {
      if (idx >= pool.length) return finish();
      var item = pool[idx];
      skillEl.textContent = item.skill;
      sentBox.innerHTML = "";
      item.words.forEach(function (w, wi) {
        var span = el("span", "eng-gword", esc(w) + " ");
        span.addEventListener("click", function () {
          if (!active) return;
          if (wi === item.errorIndex) {
            score++;
            audio("powerup");
            span.classList.add("ok");
            showFB(true, "Fix: " + item.fix + " — " + item.skill);
            scoreEl.textContent = score;
            active = false;
            clearInterval(tInt);
            setTimeout(adv, 750);
          } else {
            audio("fail");
            span.classList.add("no");
            showFB(false, "Not that one — keep looking!");
          }
        });
        sentBox.appendChild(span);
      });
      tLeft = 100;
      fill.style.width = "100%";
      active = true;
      clearInterval(tInt);
      tInt = setInterval(function () {
        tLeft -= 1.25;
        fill.style.width = Math.max(tLeft, 0) + "%";
        if (tLeft <= 0) {
          clearInterval(tInt);
          active = false;
          audio("hit");
          var corr = sentBox.children[item.errorIndex];
          if (corr) corr.classList.add("reveal");
          showFB(
            false,
            "Time! It was “" + item.words[item.errorIndex] + "” → " + item.fix,
          );
          setTimeout(adv, 1000);
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
        " errors.";
      high("grammar-gauntlet", score * 10);
      startBtn.textContent = "Play again ▶";
      audio(score >= pool.length * 0.6 ? "success" : "fail");
    }
    startBtn.addEventListener("click", function () {
      audio("game-start");
      pool = shuffle(G.gauntlet).slice(0, 10);
      idx = 0;
      score = 0;
      scoreEl.textContent = "0";
      next();
    });
  }

  /* ---------------- Rhetoric Rally ---------------- */
  function rhetoricRally(root) {
    var items = E.rhetoric || [];
    root.innerHTML =
      '<div class="eng-hud"><button class="btn g-start">Start ▶</button>' +
      '<span class="eng-chip">Score: <b class="g-score">0</b></span>' +
      '<span class="eng-chip">Q <b class="g-qn">0</b>/10</span></div>' +
      '<div class="eng-sentence"><span class="muted">Press Start. Read each line and sort it: ethos (credibility), pathos (emotion), or logos (logic).</span></div>' +
      '<div class="eng-appeals"><button class="btn secondary" data-ap="ethos">🎓 Ethos</button><button class="btn secondary" data-ap="pathos">❤️ Pathos</button><button class="btn secondary" data-ap="logos">📊 Logos</button></div>' +
      '<div class="eng-feedback"></div>';
    var startBtn = root.querySelector(".g-start"),
      scoreEl = root.querySelector(".g-score"),
      qnEl = root.querySelector(".g-qn"),
      quoteBox = root.querySelector(".eng-sentence"),
      fb = root.querySelector(".eng-feedback");
    var pool = [],
      idx = 0,
      score = 0,
      active = false;
    function render() {
      if (idx >= pool.length) return finish();
      qnEl.textContent = idx + 1;
      quoteBox.innerHTML = "“" + esc(pool[idx].quote) + "”";
      active = true;
    }
    function choose(ap) {
      if (!active) return;
      active = false;
      var it = pool[idx];
      var ok = ap === it.appeal;
      if (ok) score++;
      scoreEl.textContent = score;
      fb.textContent =
        (ok ? "✓ " : "✗ ") + it.appeal.toUpperCase() + " — " + it.why;
      fb.className = "eng-feedback show " + (ok ? "ok" : "no");
      audio(ok ? "powerup" : "fail");
      setTimeout(function () {
        fb.className = "eng-feedback";
        idx++;
        render();
      }, 1200);
    }
    function finish() {
      quoteBox.innerHTML =
        "<strong>Done!</strong> You sorted " +
        score +
        " of " +
        pool.length +
        " correctly.";
      high("rhetoric-rally", score * 10);
      startBtn.textContent = "Play again ▶";
      audio(score >= pool.length * 0.6 ? "success" : "fail");
    }
    root.querySelectorAll(".eng-appeals .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        choose(b.dataset.ap);
      });
    });
    startBtn.addEventListener("click", function () {
      audio("game-start");
      pool = shuffle(items).slice(0, 10);
      idx = 0;
      score = 0;
      scoreEl.textContent = "0";
      render();
    });
  }

  window.ENG_GAMES = {
    "word-defender": wordDefender,
    "vocab-match": vocabMatch,
    "grammar-gauntlet": grammarGauntlet,
    "rhetoric-rally": rhetoricRally,
  };

  function auto() {
    var root = document.getElementById("game-root");
    if (!root) return;
    var name = root.dataset.game;
    var fn = window.ENG_GAMES[name];
    if (fn) fn(root);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", auto);
  else auto();
})();
