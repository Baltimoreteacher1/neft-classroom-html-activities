/* ==========================================================================
   Neft Teacher — Intervention shared engine
   Topic pages set window.TOPIC = { slug, title, bank:[{prompt,answer,options,explain}], ... }
   This file wires: tabs, diagnostic, timed practice, and a canvas arcade game.
   Zero dependencies. Self-checking. Classroom-safe (no login, no network).
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) =>
    Array.from((root || document).querySelectorAll(sel));
  const shuffle = (a) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const pickN = (a, n) => shuffle(a).slice(0, Math.min(n, a.length));
  const reduceMotion = () => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  };

  /* -------------------- Progress (localStorage) ------------------- */
  const PKEY = "nt-intervention:v1";
  const Progress = {
    all() {
      try {
        return JSON.parse(localStorage.getItem(PKEY) || "{}");
      } catch (e) {
        return {};
      }
    },
    get(slug) {
      return this.all()[slug] || {};
    },
    save(slug, patch) {
      try {
        const all = this.all();
        const cur = all[slug] || {};
        // keep best scores, never regress
        ["diagnostic", "practice", "game"].forEach((k) => {
          if (patch[k] != null) cur[k] = Math.max(cur[k] || 0, patch[k]);
        });
        cur.visited = true;
        cur.ts = Date.now();
        all[slug] = cur;
        localStorage.setItem(PKEY, JSON.stringify(all));
      } catch (e) {}
    },
  };
  window.IntProgress = Progress;

  /* ----------------------------- Tabs ----------------------------- */
  function initTabs() {
    const tabs = $$(".tab");
    if (!tabs.length) return;
    const panels = $$(".panel");
    const tablist = tabs[0].closest(".tabs") || tabs[0].parentNode;

    // Shareable "open this activity in its own tab" link. The active tab is
    // encoded in the URL hash, so every activity has a direct, sendable link
    // a teacher can hand to students (it opens straight to that activity).
    const share = document.createElement("a");
    share.className = "tab-open";
    share.target = "_blank";
    share.rel = "noopener";
    share.textContent = "Open this activity in a new tab ↗";
    if (tablist && tablist.parentNode) {
      tablist.parentNode.insertBefore(share, tablist.nextSibling);
    }

    // Wire the full WAI-ARIA tabs relationship up front: each tab owns a panel
    // (aria-controls), each panel points back at its tab (aria-labelledby), and
    // panels become focusable tabpanels so keyboard users land inside content.
    if (tablist) tablist.setAttribute("role", "tablist");
    tabs.forEach((t) => {
      const id = t.dataset.tab;
      if (!t.id) t.id = "tab-" + id;
      t.setAttribute("aria-controls", "panel-" + id);
      const panel = document.getElementById("panel-" + id);
      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", t.id);
        panel.setAttribute("tabindex", "0");
      }
    });

    function select(id, focusTab) {
      tabs.forEach((t) => {
        const on = t.dataset.tab === id;
        t.setAttribute("aria-selected", String(on));
        // Roving tabindex: only the active tab is in the Tab order.
        t.setAttribute("tabindex", on ? "0" : "-1");
        if (on && focusTab) t.focus();
      });
      panels.forEach((p) =>
        p.classList.toggle("active", p.id === "panel-" + id),
      );
      if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
      const active = tabs.filter((t) => t.dataset.tab === id)[0];
      const label = active ? active.textContent.trim() : "activity";
      share.href = location.origin + location.pathname + "#" + id;
      share.setAttribute(
        "aria-label",
        "Open " + label + " in a new browser tab",
      );
    }
    tabs.forEach((t) =>
      t.addEventListener("click", () => select(t.dataset.tab)),
    );

    // Keyboard support per the ARIA tabs pattern: Left/Right (and Up/Down) move
    // between tabs, Home/End jump to the ends.
    if (tablist) {
      tablist.addEventListener("keydown", (e) => {
        const keys = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
        };
        let idx = tabs.findIndex(
          (t) => t.getAttribute("aria-selected") === "true",
        );
        if (idx < 0) idx = 0;
        if (e.key in keys) {
          e.preventDefault();
          idx = (idx + keys[e.key] + tabs.length) % tabs.length;
          select(tabs[idx].dataset.tab, true);
        } else if (e.key === "Home") {
          e.preventDefault();
          select(tabs[0].dataset.tab, true);
        } else if (e.key === "End") {
          e.preventDefault();
          select(tabs[tabs.length - 1].dataset.tab, true);
        }
      });
    }

    const start = location.hash.replace("#", "");
    select(
      tabs.some((t) => t.dataset.tab === start) ? start : tabs[0].dataset.tab,
    );
  }

  /* --------------------- Quiz widget (MC) ------------------------- */
  // mode: "practice" | "diagnostic"
  function quizWidget(mountId, items, mode, count) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const total = Math.min(count || items.length, items.length);

    function start() {
      const qs = pickN(items, total);
      let i = 0,
        correct = 0,
        locked = false;

      function render() {
        const q = qs[i];
        const opts = shuffle(
          q.options && q.options.length
            ? q.options
            : [q.answer].concat(q.distractors || []),
        );
        mount.innerHTML = `
          <div class="qcard">
            <div class="qmeta"><span>Question ${i + 1} / ${total}</span><span>Score ${correct}</span></div>
            <div class="qbar"><i style="width:${(i / total) * 100}%"></i></div>
            <div class="prompt">${q.prompt}
              <button class="speak-btn" type="button" data-speak="${esc(q.prompt)}" aria-label="Read question aloud" title="Read aloud">🔊</button>
            </div>
            <div class="opts">${opts
              .map(
                (o) =>
                  `<button class="opt" type="button" data-v="${esc(o)}">${o}</button>`,
              )
              .join("")}</div>
            <div class="feedback" role="status"></div>
          </div>`;
        const fb = $(".feedback", mount);
        $$(".opt", mount).forEach((b) =>
          b.addEventListener("click", () => {
            if (locked) return;
            locked = true;
            const chosen = b.dataset.v;
            const right = String(q.answer);
            $$(".opt", mount).forEach((x) => {
              if (x.dataset.v === right) x.classList.add("correct");
              else if (x === b) x.classList.add("wrong");
            });
            if (chosen === right) {
              correct++;
              fb.className = "feedback ok";
              fb.textContent = "✓ Correct! " + (q.explain || "");
            } else {
              fb.className = "feedback no";
              fb.textContent =
                "✗ Answer: " + q.answer + ". " + (q.explain || "");
            }
            setTimeout(
              () => {
                i++;
                locked = false;
                if (i < total) render();
                else finish();
              },
              q.explain ? 1500 : 900,
            );
          }),
        );
        // Keep keyboard users in flow: after the first question, move focus to
        // the first option of the next one (the previous button was replaced).
        if (i > 0) {
          const first = $(".opt", mount);
          if (first) first.focus({ preventScroll: true });
        }
      }

      function finish() {
        const pct = Math.round((correct / total) * 100);
        if (window.TOPIC && window.TOPIC.slug)
          Progress.save(window.TOPIC.slug, {
            [mode === "diagnostic" ? "diagnostic" : "practice"]: pct,
          });
        let msg, sub;
        if (mode === "diagnostic") {
          if (pct >= 80) {
            msg = "Strong — you're ready.";
            sub = "Skip ahead, or use the game to keep it sharp.";
          } else if (pct >= 50) {
            msg = "Almost there.";
            sub = "Work the Practice tab, then retry.";
          } else {
            msg = "Start here.";
            sub =
              "Begin with Practice and the worksheet, then take the post-quiz.";
          }
        } else {
          msg =
            pct >= 80
              ? "Great work!"
              : pct >= 50
                ? "Good progress!"
                : "Keep practicing!";
          sub =
            pct >= 80
              ? "Try the game or the post-quiz."
              : "Run it again to lift your score.";
        }
        mount.innerHTML = `
          <div class="result">
            <div class="score">${pct}%</div>
            <p><strong>${correct} / ${total} correct.</strong> ${msg}</p>
            <p style="color:var(--muted)">${sub}</p>
            <button class="btn btn-primary" type="button" id="${mountId}-again">↻ Try again</button>
          </div>`;
        $("#" + mountId + "-again", mount).addEventListener("click", start);
      }
      render();
    }
    start();
  }

  /* ----------------------- Arcade game ---------------------------- */
  // "Answer Drop": the prompt sits at the bottom; answer tiles fall from the
  // top. Click/tap the tile that matches the current prompt's answer.
  function answerDrop(stageId, items) {
    const stage = document.getElementById(stageId);
    if (!stage) return;
    const canvas = $("canvas", stage);
    const ctx = canvas.getContext("2d");
    const hud = $(".game-hud", stage);
    const overlay = $(".game-overlay", stage);

    let W = 0,
      H = 0,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);

    let running = false,
      raf = 0,
      score = 0,
      lives = 5,
      level = 1,
      q = null,
      tiles = [],
      speed = 0.42,
      spawnT = 0;

    function newQuestion() {
      q = pickN(items, 1)[0];
      const pool = shuffle(
        (q.options && q.options.length
          ? q.options
          : [q.answer].concat(q.distractors || [])
        ).map(String),
      ).slice(0, 4);
      if (!pool.includes(String(q.answer))) pool[0] = String(q.answer);
      tiles = shuffle(pool).map((val, idx) => ({
        val,
        x: 40 + idx * ((W - 120) / 3),
        y: -40 - idx * 70,
        w: 84,
        h: 46,
        dead: false,
      }));
    }

    function reset() {
      score = 0;
      lives = 5;
      level = 1;
      speed = 0.42;
      newQuestion();
    }

    function loop(ts) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      // prompt banner
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, H - 64, W, 64);
      ctx.fillStyle = "#fff";
      ctx.font = "700 26px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(q ? q.prompt : "", W / 2, H - 32);

      let allGone = true;
      tiles.forEach((t) => {
        if (t.dead) return;
        allGone = false;
        t.y += speed * (1 + level * 0.08) * 1.25;
        const correct = t.val === String(q.answer);
        ctx.fillStyle = "#1d3b5c";
        roundRect(ctx, t.x, t.y, t.w, t.h, 9);
        ctx.fill();
        ctx.strokeStyle = "#2d6fb0";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#eaf2ff";
        ctx.font = "700 20px Inter, system-ui, sans-serif";
        ctx.fillText(t.val, t.x + t.w / 2, t.y + t.h / 2);
        if (t.y > H - 64) {
          // reached bottom
          t.dead = true;
          if (correct) loseLife("Missed it — answer was " + q.answer);
        }
      });
      if (allGone) newQuestion();

      hud.innerHTML = `<span>Score ${score}</span><span>Level ${level}</span><span>${"♥".repeat(lives)}</span>`;
      raf = requestAnimationFrame(loop);
    }

    function loseLife(msg) {
      lives--;
      flash("#c0392b");
      if (lives <= 0) end(false, msg);
      else newQuestion();
    }

    function flash(color) {
      if (reduceMotion()) return;
      stage.animate(
        [
          { boxShadow: "inset 0 0 0 4px " + color },
          { boxShadow: "inset 0 0 0 0 transparent" },
        ],
        { duration: 320 },
      );
    }

    function onTap(e) {
      if (!running) return;
      const r = canvas.getBoundingClientRect();
      const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      for (const t of tiles) {
        if (t.dead) continue;
        if (px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h) {
          if (t.val === String(q.answer)) {
            score += 10;
            if (score % 80 === 0) {
              level++;
              speed += 0.1;
            }
            flash("#2c7d6b");
            newQuestion();
          } else {
            loseLife("Not quite — that was " + t.val);
          }
          return;
        }
      }
    }
    canvas.addEventListener("click", onTap);
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      onTap(e);
    });

    function start() {
      resize();
      reset();
      running = true;
      overlay.style.display = "none";
      raf = requestAnimationFrame(loop);
    }
    function end(win, msg) {
      running = false;
      cancelAnimationFrame(raf);
      if (window.TOPIC && window.TOPIC.slug)
        Progress.save(window.TOPIC.slug, { game: score });
      overlay.style.display = "grid";
      overlay.innerHTML = `<div><h3>${win ? "You win!" : "Game over"}</h3>
        <p>${msg || ""}</p>
        <p style="font-size:1.4rem;font-weight:800">Score: ${score} · Level ${level}</p>
        <button class="btn btn-primary" type="button" id="${stageId}-go">▶ Play again</button></div>`;
      $("#" + stageId + "-go", overlay).addEventListener("click", start);
    }

    overlay.style.display = "grid";
    const go = $("[data-go]", overlay) || $("#" + stageId + "-start", overlay);
    if (go) go.addEventListener("click", start);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function esc(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  /* ----------------------- Worksheet print ------------------------ */
  function initPrint() {
    $$("[data-print]").forEach((b) =>
      b.addEventListener("click", () => window.print()),
    );
  }

  /* --------------------- Read-aloud (TTS) ------------------------- */
  function speak(text) {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(
        String(text).replace(/[★🔢🍕💯⚖️🧭🧮🧱🌡️📊➗📐📈]/g, ""),
      );
      u.rate = 0.9;
      u.lang = "en-US";
      synth.speak(u);
    } catch (e) {}
  }
  function initReadAloud() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-speak]");
      if (!b) return;
      e.preventDefault();
      speak(b.getAttribute("data-speak") || b.textContent);
    });
  }

  /* --------------------- Flashcards (flip) ------------------------ */
  function initFlashcards() {
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".flashcard");
      if (!card || e.target.closest("[data-speak]")) return;
      card.classList.toggle("flipped");
    });
  }

  /* --------------------- Fluency drill (timed) ------------------- */
  function fluencyDrill(mountId, items, seconds) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const total = seconds || 60;

    function start() {
      let left = total,
        correct = 0,
        attempts = 0,
        locked = false,
        timer = null,
        q = null;

      function next() {
        q = pickN(items, 1)[0];
        const opts = shuffle(
          q.options && q.options.length
            ? q.options
            : [q.answer].concat(q.distractors || []),
        );
        mount.querySelector(".fd-prompt").innerHTML = q.prompt;
        mount.querySelector(".fd-opts").innerHTML = opts
          .map(
            (o) =>
              `<button class="opt" type="button" data-v="${esc(o)}">${o}</button>`,
          )
          .join("");
        locked = false;
        // Keep keyboard focus on the live question during the timed drill.
        const first = mount.querySelector(".fd-opts .opt");
        if (first && document.activeElement !== document.body)
          first.focus({ preventScroll: true });
      }
      function tick() {
        left--;
        const bar = mount.querySelector(".fd-bar > i");
        if (bar) bar.style.width = (left / total) * 100 + "%";
        const tEl = mount.querySelector(".fd-time");
        if (tEl) tEl.textContent = left + "s";
        if (left <= 0) finish();
      }
      function choose(b) {
        if (locked) return;
        locked = true;
        attempts++;
        if (b.dataset.v === String(q.answer)) {
          correct++;
          b.classList.add("correct");
        } else {
          b.classList.add("wrong");
        }
        mount.querySelector(".fd-score").textContent = correct;
        setTimeout(next, 180);
      }
      function finish() {
        clearInterval(timer);
        if (window.TOPIC && window.TOPIC.slug)
          Progress.save(window.TOPIC.slug, { fluency: correct });
        mount.innerHTML = `<div class="result">
            <div class="score">${correct}</div>
            <p><strong>${correct} correct</strong> in ${total} seconds (${attempts} attempted).</p>
            <p style="color:var(--muted)">Speed + accuracy build fluency. Beat your score!</p>
            <button class="btn btn-primary" type="button" id="${mountId}-again">↻ Try again</button>
          </div>`;
        mount
          .querySelector("#" + mountId + "-again")
          .addEventListener("click", start);
      }

      mount.innerHTML = `<div class="qcard">
          <div class="qmeta"><span>⏱ <span class="fd-time">${total}s</span></span><span>Correct <span class="fd-score">0</span></span></div>
          <div class="qbar fd-bar"><i style="width:100%"></i></div>
          <div class="prompt fd-prompt"></div>
          <div class="opts fd-opts"></div>
        </div>`;
      mount.querySelector(".fd-opts").addEventListener("click", (e) => {
        const b = e.target.closest(".opt");
        if (b) choose(b);
      });
      next();
      timer = setInterval(tick, 1000);
    }

    mount.innerHTML = `<div class="qcard" style="padding:34px">
        <p style="font-size:1.1rem;font-weight:700;color:var(--navy)">⚡ 60-Second Fluency Drill</p>
        <p style="color:var(--muted)">Answer as many as you can before time runs out.</p>
        <button class="btn btn-primary" type="button" id="${mountId}-start">▶ Start drill</button>
      </div>`;
    mount
      .querySelector("#" + mountId + "-start")
      .addEventListener("click", start);
  }

  /* --------------------------- Boot ------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initTabs();
    initPrint();
    initReadAloud();
    initFlashcards();
    const T = window.TOPIC;
    if (!T || !T.bank) return;
    if (T.slug) Progress.save(T.slug, {}); // mark visited
    if (document.getElementById("diagnostic-widget"))
      quizWidget("diagnostic-widget", T.diagnostic || T.bank, "diagnostic", 6);
    if (document.getElementById("practice-widget"))
      quizWidget("practice-widget", T.bank, "practice", 10);
    if (document.getElementById("fluency-widget"))
      fluencyDrill("fluency-widget", T.bank, 60);
    if (document.getElementById("game-stage")) answerDrop("game-stage", T.bank);
  });

  window.INT = { quizWidget, answerDrop, fluencyDrill, speak };
})();
