export function createHUD(mountEl) {
  if (!mountEl) throw new Error("createHUD: mountEl is required");
  injectHudStyles();

  const root = document.createElement("div");
  root.className = "e3d-hud";
  root.innerHTML = `
    <div class="e3d-hud-top">
      <span class="e3d-hud-level" data-hud="level"></span>
      <span class="e3d-hud-objective" data-hud="objective"></span>
      <div class="e3d-hud-stats">
        <span class="e3d-hud-score" data-hud="score">Score 0</span>
        <span class="e3d-hud-lives" data-hud="lives"></span>
        <span class="e3d-hud-timer" data-hud="timer"></span>
      </div>
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
  let msgTimer = null;

  return {
    root,
    setObjective(text) {
      objEl.textContent = text || "";
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
    gap:var(--sp-3,12px);padding:var(--sp-3,12px) var(--sp-4,16px);
    background:linear-gradient(180deg,rgba(18,53,91,.85),rgba(18,53,91,0));}
  .e3d-hud-level{background:var(--amber,#f2c15b);color:var(--navy,#12355b);
    font-weight:700;font-size:13px;padding:3px 10px;border-radius:999px;white-space:nowrap;}
  .e3d-hud-objective{flex:1;font-weight:600;font-size:15px;text-shadow:0 1px 2px rgba(0,0,0,.5);}
  .e3d-hud-stats{display:flex;gap:var(--sp-4,16px);font-weight:700;font-size:15px;
    text-shadow:0 1px 2px rgba(0,0,0,.5);white-space:nowrap;}
  .e3d-hud-lives{color:var(--coral,#d9795d);}
  .e3d-hud-msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(18,53,91,.92);padding:var(--sp-4,16px) var(--sp-6,24px);
    border-radius:var(--radius-md,14px);font-size:22px;font-weight:700;
    font-family:var(--font-display,system-ui,sans-serif);text-align:center;max-width:80%;}
  .e3d-hud-msg[data-tone="ok"]{background:var(--success,#0f7c4a);}
  .e3d-hud-msg[data-tone="warn"]{background:var(--error,#b64e2f);}
  @media (max-width:560px){.e3d-hud-objective{font-size:13px;}.e3d-hud-stats{font-size:13px;gap:10px;}}`;
  document.head.appendChild(s);
}
