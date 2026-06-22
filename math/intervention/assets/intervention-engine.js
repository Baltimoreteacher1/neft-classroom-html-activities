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

  // Topics that count toward "mastery" (best diagnostic/practice ≥ 80%).
  function masteredCount() {
    const all = Progress.all();
    return Object.keys(all).filter(
      (s) => Math.max(all[s].diagnostic || 0, all[s].practice || 0) >= 80,
    ).length;
  }

  /* ============================================================== *
   *  PREMIUM LAYER — XP, daily streaks, achievement badges, smart  *
   *  review, celebrations. All local-only (no login, no network),  *
   *  additive, and reduced-motion aware. Shared schema with the    *
   *  hub (assets/hub.js) under the key below.                      *
   * ============================================================== */
  const XKEY = "nt-intervention-xp:v1";
  const dayStr = (d) => (d || new Date()).toISOString().slice(0, 10);
  const qkey = (q) => String(q && q.prompt != null ? q.prompt : q);

  // id → { icon, name, desc }. Mirrored in hub.js for the badge wall.
  const BADGES = {
    "first-steps": {
      icon: "🌱",
      name: "First Steps",
      desc: "Finished your first activity.",
    },
    sharp: {
      icon: "🎯",
      name: "Sharp Shooter",
      desc: "Scored 100% on a practice set.",
    },
    fluent: {
      icon: "⚡",
      name: "Fluency Ace",
      desc: "15+ correct in a fluency drill.",
    },
    arcade: {
      icon: "🕹️",
      name: "Arcade Ace",
      desc: "Scored 100+ in Answer Drop.",
    },
    streak3: { icon: "🔥", name: "On a Roll", desc: "3-day practice streak." },
    streak7: {
      icon: "🚀",
      name: "Unstoppable",
      desc: "7-day practice streak.",
    },
    master1: {
      icon: "⭐",
      name: "Topic Master",
      desc: "Mastered your first topic (80%+).",
    },
    master6: { icon: "🏅", name: "Halfway Hero", desc: "Mastered 6 topics." },
    master12: {
      icon: "👑",
      name: "Grand Master",
      desc: "Mastered all 12 topics.",
    },
  };

  const Premium = {
    read() {
      let d;
      try {
        d = JSON.parse(localStorage.getItem(XKEY) || "{}");
      } catch (e) {
        d = {};
      }
      d.xp = d.xp || 0;
      d.streak = d.streak || { count: 0, last: null };
      d.badges = d.badges || {};
      d.missed = d.missed || {};
      d.activity = d.activity || {};
      return d;
    },
    write(d) {
      try {
        localStorage.setItem(XKEY, JSON.stringify(d));
      } catch (e) {}
    },
    // 100 XP per level — simple, legible for students.
    level(xp) {
      return Math.floor((xp == null ? this.read().xp : xp) / 100) + 1;
    },
    // Count one streak day the first time XP is earned each calendar day.
    touchStreak(d) {
      const today = dayStr();
      if (d.streak.last === today) return false;
      const yest = dayStr(new Date(Date.now() - 864e5));
      d.streak.count = d.streak.last === yest ? d.streak.count + 1 : 1;
      d.streak.last = today;
      return true;
    },
    addXP(n) {
      const gained = Math.max(0, Math.round(n || 0));
      const d = this.read();
      const before = this.level(d.xp);
      d.xp += gained;
      d.activity[dayStr()] = (d.activity[dayStr()] || 0) + gained;
      const streakUp = this.touchStreak(d);
      this.write(d);
      const level = this.level(d.xp);
      return {
        total: d.xp,
        gained,
        level,
        levelUp: level > before,
        streak: d.streak.count,
        streakUp,
      };
    },
    award(id) {
      const d = this.read();
      if (d.badges[id]) return false;
      d.badges[id] = Date.now();
      this.write(d);
      return true;
    },
    recordMiss(slug, q) {
      if (!slug) return;
      const d = this.read();
      const arr = d.missed[slug] || [];
      const k = qkey(q);
      if (!arr.includes(k)) {
        arr.push(k);
        d.missed[slug] = arr;
        this.write(d);
      }
    },
    clearMiss(slug, q) {
      if (!slug) return;
      const d = this.read();
      const arr = d.missed[slug];
      if (!arr || !arr.length) return;
      const k = qkey(q);
      const next = arr.filter((x) => x !== k);
      if (next.length !== arr.length) {
        d.missed[slug] = next;
        this.write(d);
      }
    },
    // Resolve stored prompts back to live bank items for the review set.
    missedItems(slug, bank) {
      const set = new Set(this.read().missed[slug] || []);
      return (bank || []).filter((q) => set.has(qkey(q)));
    },
  };
  window.IntPremium = Premium;

  /* ------------------ Celebrations: toast + confetti -------------- */
  function notify(html, kind) {
    let host = document.getElementById("int-toasts");
    if (!host) {
      host = document.createElement("div");
      host.id = "int-toasts";
      host.className = "int-toasts";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    const t = document.createElement("div");
    t.className = "int-toast" + (kind ? " it-" + kind : "");
    t.innerHTML = html;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 400);
    }, 3600);
  }

  function confetti(power) {
    if (reduceMotion()) return;
    const n = power || 80;
    const host = document.createElement("div");
    host.className = "int-confetti";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
    const colors = [
      "#205fa6",
      "#2c7d6b",
      "#b8761b",
      "#9333ea",
      "#db2777",
      "#0891b2",
    ];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.25 + "s";
      p.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      p.style.setProperty("--rot", Math.random() * 360 + "deg");
      host.appendChild(p);
    }
    setTimeout(() => host.remove(), 3800);
  }
  window.INTfx = { confetti, notify };

  /* ---------------------- XP/streak HUD pill --------------------- */
  function renderHud() {
    const nav = document.querySelector(".topbar nav");
    if (!nav) return;
    const d = Premium.read();
    const lvl = Premium.level(d.xp);
    const into = d.xp % 100;
    let hud = document.getElementById("int-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "int-hud";
      hud.className = "int-hud";
      hud.title = "Your level, XP, and daily practice streak";
      hud.setAttribute("aria-label", "Level " + lvl + ", " + d.xp + " XP");
      nav.parentNode.insertBefore(hud, nav);
    }
    hud.innerHTML =
      '<span class="ih-lvl">⭐ Lv ' +
      lvl +
      "</span>" +
      '<span class="ih-bar"><i style="width:' +
      into +
      '%"></i></span>' +
      '<span class="ih-xp">' +
      d.xp +
      " XP</span>" +
      (d.streak.count > 0
        ? '<span class="ih-streak">🔥 ' + d.streak.count + "</span>"
        : "");
  }

  /* --------- Award XP + badges when an activity completes --------- */
  // mode: "practice" | "diagnostic" | "fluency" | "game".
  // For "game", `correct` carries the final score.
  function awardCompletion(mode, pct, correct, total) {
    const xpFor = {
      practice: correct * 3 + (pct >= 80 ? 20 : 0),
      diagnostic: correct * 1,
      fluency: correct * 2,
      game: Math.floor((correct || 0) / 5),
    };
    const xp = xpFor[mode] || 0;
    if (xp > 0) {
      const r = Premium.addXP(xp);
      notify("✨ <strong>+" + r.gained + " XP</strong> earned!", "xp");
      if (r.levelUp) {
        notify(
          "🎉 <strong>Level up!</strong> You reached Level " + r.level + ".",
          "level",
        );
        confetti(130);
      }
      if (r.streakUp && r.streak >= 2) {
        notify(
          "🔥 <strong>" + r.streak + "-day streak!</strong> Keep it going.",
          "streak",
        );
      }
      renderHud();
    }

    // Badge checks (each awards at most once).
    const newly = [];
    if (Premium.award("first-steps")) newly.push("first-steps");
    if (mode === "practice" && pct === 100 && Premium.award("sharp"))
      newly.push("sharp");
    if (mode === "fluency" && correct >= 15 && Premium.award("fluent"))
      newly.push("fluent");
    if (mode === "game" && (correct || 0) >= 100 && Premium.award("arcade"))
      newly.push("arcade");
    const streak = Premium.read().streak.count;
    if (streak >= 3 && Premium.award("streak3")) newly.push("streak3");
    if (streak >= 7 && Premium.award("streak7")) newly.push("streak7");
    const mc = masteredCount();
    if (mc >= 1 && Premium.award("master1")) newly.push("master1");
    if (mc >= 6 && Premium.award("master6")) newly.push("master6");
    if (mc >= 12 && Premium.award("master12")) newly.push("master12");
    newly.forEach((id) => {
      const b = BADGES[id];
      notify(
        "🏆 <strong>Badge unlocked:</strong> " + b.icon + " " + b.name,
        "badge",
      );
    });
    if (newly.length) confetti(100);
  }

  /* --------------- Smart Review tab (injected per topic) ---------- */
  // Built from the student's own missed questions for this topic. Injected
  // before initTabs() so it is wired into the ARIA tabs like any other tab.
  function injectSmartReview() {
    const T = window.TOPIC;
    if (!T || !T.slug || !T.bank) return;
    const tablist = document.querySelector(".tabs");
    const practicePanel = document.getElementById("panel-practice");
    if (!tablist || !practicePanel || document.getElementById("panel-review"))
      return;
    const count = Premium.missedItems(T.slug, T.bank).length;

    const tab = document.createElement("button");
    tab.className = "tab";
    tab.setAttribute("role", "tab");
    tab.dataset.tab = "review";
    tab.innerHTML =
      "🧠 Smart Review" +
      (count ? ' <span class="tab-count">' + count + "</span>" : "");
    const practiceTab = tablist.querySelector('[data-tab="practice"]');
    if (practiceTab) tablist.insertBefore(tab, practiceTab.nextSibling);
    else tablist.appendChild(tab);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.id = "panel-review";
    panel.innerHTML =
      "<h3>🧠 Smart Review</h3>" +
      "<p>This set is built from the questions <strong>you</strong> missed — your personal trouble spots. Answer one correctly to clear it.</p>" +
      '<div id="review-widget"></div>';
    practicePanel.parentNode.insertBefore(panel, practicePanel.nextSibling);
  }

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
            const slug = window.TOPIC && window.TOPIC.slug;
            if (chosen === right) {
              correct++;
              fb.className = "feedback ok";
              fb.textContent = "✓ Correct! " + (q.explain || "");
              // Answering a trouble-spot question correctly retires it from
              // the student's Smart Review set.
              Premium.clearMiss(slug, q);
            } else {
              fb.className = "feedback no";
              fb.textContent =
                "✗ Answer: " + q.answer + ". " + (q.explain || "");
              // Track the miss so it resurfaces in Smart Review.
              Premium.recordMiss(slug, q);
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
        // Premium: award XP + badges (after Progress.save so mastery counts
        // reflect this run), then celebrate strong scores.
        awardCompletion(
          mode === "diagnostic" ? "diagnostic" : "practice",
          pct,
          correct,
          total,
        );
        if (pct >= 80) confetti(90);
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
      tiles.forEach((t, idx) => {
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
        // Key-number badge (top-left) so keyboard players know which key plays it.
        ctx.fillStyle = "rgba(234,242,255,0.5)";
        ctx.font = "700 12px Inter, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(String(idx + 1), t.x + 7, t.y + 13);
        ctx.fillStyle = "#eaf2ff";
        ctx.font = "700 20px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
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

    // Resolve a chosen tile — shared by pointer and keyboard input.
    function pick(t) {
      if (!t || t.dead) return;
      if (t.val === String(q.answer)) {
        score += 10;
        if (score % 80 === 0) {
          level++;
          speed += 0.1;
          confetti(50);
        }
        flash("#2c7d6b");
        newQuestion();
      } else {
        loseLife("Not quite — that was " + t.val);
      }
    }
    function onTap(e) {
      if (!running) return;
      const r = canvas.getBoundingClientRect();
      const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      for (const t of tiles) {
        if (t.dead) continue;
        if (px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h) {
          pick(t);
          return;
        }
      }
    }
    // Keyboard play: number keys 1–4 select the tile in that column, so the
    // game is fully playable without a mouse or touchscreen.
    function onKey(e) {
      if (!running) return;
      const idx = { 1: 0, 2: 1, 3: 2, 4: 3 }[e.key];
      if (idx == null) return;
      e.preventDefault();
      pick(tiles[idx]);
    }
    canvas.tabIndex = 0; // focusable for keyboard players
    canvas.addEventListener("click", onTap);
    canvas.addEventListener("keydown", onKey);
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      onTap(e);
    });

    function start() {
      resize();
      reset();
      running = true;
      overlay.style.display = "none";
      try {
        canvas.focus({ preventScroll: true });
      } catch (e) {}
      raf = requestAnimationFrame(loop);
    }
    function end(win, msg) {
      running = false;
      cancelAnimationFrame(raf);
      if (window.TOPIC && window.TOPIC.slug)
        Progress.save(window.TOPIC.slug, { game: score });
      awardCompletion("game", null, score, null);
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
        awardCompletion("fluency", null, correct, attempts);
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
    // Inject the Smart Review tab before initTabs so it gets wired up.
    injectSmartReview();
    initTabs();
    initPrint();
    initReadAloud();
    initFlashcards();
    renderHud();
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
    // Smart Review: quiz the student's own missed questions, or a tidy
    // empty state when there is nothing to review yet.
    const reviewMount = document.getElementById("review-widget");
    if (reviewMount && T.slug) {
      const items = Premium.missedItems(T.slug, T.bank);
      if (items.length)
        quizWidget("review-widget", items, "practice", items.length);
      else
        reviewMount.innerHTML =
          '<div class="qcard" style="padding:30px;text-align:center">' +
          '<p style="font-size:1.05rem;font-weight:700;color:var(--navy)">🎉 Nothing to review!</p>' +
          '<p style="color:var(--muted)">You have no missed questions yet. Work the Practice tab — anything you miss will appear here for targeted review.</p>' +
          "</div>";
    }
  });

  window.INT = { quizWidget, answerDrop, fluencyDrill, speak, confetti, notify };
})();
