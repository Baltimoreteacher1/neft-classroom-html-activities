export function createHUD(mountEl) {
  if (!mountEl) throw new Error("createHUD: mountEl is required");
  injectHudStyles();

  const root = document.createElement("div");
  root.className = "e3d-hud";
  root.innerHTML = `
    <div class="e3d-hud-top">
      <span class="e3d-hud-level" data-hud="level"></span>
      <div class="e3d-hud-stats">
        <span class="e3d-hud-streak" data-hud="streak" hidden></span>
        <span class="e3d-hud-score" data-hud="score">Score 0</span>
        <span class="e3d-hud-lives" data-hud="lives"></span>
        <span class="e3d-hud-timer" data-hud="timer"></span>
      </div>
    </div>
    <div class="e3d-hud-task" data-hud="task">
      <div class="e3d-hud-task-head">
        <span class="e3d-hud-task-label">Your task</span>
        <span class="e3d-hud-progress" data-hud="progress" aria-hidden="true"></span>
      </div>
      <p class="e3d-hud-objective" data-hud="objective" role="status" aria-live="polite"></p>
      <div class="e3d-hud-dots" data-hud="dots" aria-hidden="true"></div>
    </div>
    <div class="e3d-hud-msg" data-hud="msg" hidden></div>`;
  mountEl.appendChild(root);

  const $ = (k) => root.querySelector(`[data-hud="${k}"]`);
  const objEl = $("objective");
  const scoreEl = $("score");
  const livesEl = $("lives");
  const timerEl = $("timer");
  const levelEl = $("level");
  const msgEl = $("msg");
  const taskEl = $("task");
  const progressEl = $("progress");
  const dotsEl = $("dots");
  const streakEl = $("streak");
  let msgTimer = null;
  // When a game drives progress with an explicit total ("Step X of Y"), the
  // engine's auto running-count must not clobber it.
  let progressManagedByGame = false;

  function renderDots(done, total) {
    if (!total || total > 12) {
      dotsEl.innerHTML = "";
      return;
    }
    let html = "";
    for (let i = 0; i < total; i++) {
      const cls = i < done ? "e3d-dot is-done" : "e3d-dot";
      html += `<span class="${cls}"></span>`;
    }
    dotsEl.innerHTML = html;
  }

  return {
    root,
    /** Set the persistent on-screen task/question. Stays visible during play. */
    setObjective(text) {
      objEl.textContent = text || "";
      taskEl.hidden = !text;
    },
    setScore(n) {
      scoreEl.textContent = `Score ${n}`;
    },
    setLives(n) {
      livesEl.textContent = n == null ? "" : "♥".repeat(Math.max(0, n));
    },
    setTimer(seconds) {
      if (seconds == null) {
        timerEl.textContent = "";
        return;
      }
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      timerEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
    },
    setLevel(label) {
      levelEl.textContent = label || "";
    },
    /**
     * Show running progress through the parts/steps of a round.
     * setProgress(done, total) → "Step 2 of 4" + dot trail.
     * total may be null/0 to just show a running count of completed steps.
     */
    setProgress(done, total) {
      if (done == null) {
        progressEl.textContent = "";
        dotsEl.innerHTML = "";
        return;
      }
      if (total && total > 0) {
        progressManagedByGame = true;
        progressEl.textContent = `Step ${Math.min(done + 1, total)} of ${total}`;
      } else {
        // Engine auto running-count. Skip if a game owns progress display.
        if (progressManagedByGame) return;
        progressEl.textContent =
          done === 1 ? "1 step done" : `${done} steps done`;
      }
      renderDots(done, total);
    },
    /** Show a small running streak count (consecutive correct). 0/null hides it. */
    setStreak(n) {
      if (!n) {
        streakEl.hidden = true;
        streakEl.textContent = "";
        return;
      }
      streakEl.hidden = false;
      streakEl.textContent = `🔥 ${n}`;
    },
    /**
     * Per-step feedback after an action. feedback(ok, text, opts).
     * ok=true → green "ok" banner; ok=false → "warn" banner. Wraps message().
     */
    feedback(ok, text, opts = {}) {
      this.message(text, {
        tone: ok ? "ok" : "warn",
        duration: opts.duration != null ? opts.duration : 1800,
      });
    },
    /** Show transient banner. opts: { duration (ms, 0=stay), tone: ok|warn|info } */
    message(text, opts = {}) {
      const { duration = 1600, tone = "info" } = opts;
      msgEl.textContent = text;
      msgEl.dataset.tone = tone;
      msgEl.hidden = false;
      if (msgTimer) clearTimeout(msgTimer);
      if (duration > 0) {
        msgTimer = setTimeout(() => {
          msgEl.hidden = true;
        }, duration);
      }
    },
    clearMessage() {
      msgEl.hidden = true;
    },
    dispose() {
      if (msgTimer) clearTimeout(msgTimer);
      if (root.parentNode) root.parentNode.removeChild(root);
    },
  };
}

function injectHudStyles() {
  if (document.getElementById("e3d-hud-styles")) return;
  const s = document.createElement("style");
  s.id = "e3d-hud-styles";
  s.textContent = `
  .e3d-hud{position:absolute;inset:0;pointer-events:none;z-index:15;
    font-family:var(--font-body,system-ui,sans-serif);color:#fff;}
  .e3d-hud-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;
    justify-content:space-between;gap:var(--sp-3,12px);
    padding:var(--sp-3,12px) var(--sp-4,16px);
    background:linear-gradient(180deg,rgba(18,53,91,.85),rgba(18,53,91,0));}
  .e3d-hud-level{background:var(--amber,#f2c15b);color:var(--navy,#12355b);
    font-weight:700;font-size:13px;padding:3px 10px;border-radius:999px;white-space:nowrap;}
  .e3d-hud-stats{display:flex;align-items:center;gap:var(--sp-4,16px);
    font-weight:800;font-size:17px;text-shadow:0 1px 2px rgba(0,0,0,.5);white-space:nowrap;}
  .e3d-hud-streak{color:var(--amber,#f2c15b);}
  .e3d-hud-lives{color:var(--coral,#d9795d);}
  /* Persistent task card — always visible during play. */
  .e3d-hud-task{position:absolute;top:54px;left:var(--sp-4,16px);
    max-width:min(560px,calc(100% - 32px));
    background:rgba(11,28,52,.92);backdrop-filter:blur(4px);
    -webkit-backdrop-filter:blur(4px);
    border:1px solid rgba(255,255,255,.22);border-left:6px solid var(--amber,#f2c15b);
    border-radius:var(--radius-md,14px);padding:14px 18px;
    box-shadow:0 6px 22px rgba(0,0,0,.38);}
  .e3d-hud-task-head{display:flex;align-items:center;justify-content:space-between;
    gap:10px;margin-bottom:4px;}
  .e3d-hud-task-label{font-size:11px;font-weight:700;letter-spacing:.08em;
    text-transform:uppercase;color:var(--amber,#f2c15b);}
  .e3d-hud-progress{font-size:12px;font-weight:700;color:rgba(255,255,255,.85);
    white-space:nowrap;}
  .e3d-hud-objective{margin:0;font-weight:700;font-size:clamp(17px,2.3vw,23px);
    line-height:1.34;letter-spacing:.005em;text-shadow:0 1px 3px rgba(0,0,0,.5);
    white-space:pre-line;}
  .e3d-hud-dots{display:flex;gap:6px;margin-top:8px;}
  .e3d-dot{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.28);
    transition:background .25s ease,transform .25s ease;}
  .e3d-dot.is-done{background:var(--amber,#f2c15b);transform:scale(1.1);}
  .e3d-hud-msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(18,53,91,.92);padding:var(--sp-4,16px) var(--sp-6,24px);
    border-radius:var(--radius-md,14px);font-size:22px;font-weight:700;
    font-family:var(--font-display,system-ui,sans-serif);text-align:center;max-width:80%;}
  .e3d-hud-msg[data-tone="ok"]{background:var(--success,#0f7c4a);}
  .e3d-hud-msg[data-tone="warn"]{background:var(--error,#b64e2f);}
  @media (prefers-reduced-motion: reduce){
    .e3d-dot{transition:none;}
  }
  @media (max-width:560px){
    .e3d-hud-objective{font-size:16px;}
    .e3d-hud-stats{font-size:14px;gap:10px;}
    .e3d-hud-task{top:46px;left:8px;right:8px;max-width:none;padding:11px 13px;}
    .e3d-hud-msg{font-size:18px;}
  }`;
  document.head.appendChild(s);
}
