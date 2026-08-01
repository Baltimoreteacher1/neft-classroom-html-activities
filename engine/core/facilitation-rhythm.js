// Facilitation Rhythm Coach — teacher-mode-only pacing bar for small-group
// studios. Turns the fixed 15–20 minute rhythm (2 launch · 4 build · 3 talk ·
// 7 practice · 2 check) into a live segment timer that surfaces the matching
// high-leverage move at the right moment. Mounted only from renderTeacher (the
// facilitation payload is served by the teacher-gated Pages function and never
// reaches the student bundle).
//
// Presentation only: no persistence, no sound, no student-visible state.

const SEGMENTS = [
  { id: "launch", label: "Launch", minutes: 2, emoji: "🚀" },
  { id: "build", label: "Build", minutes: 4, emoji: "🧱" },
  { id: "talk", label: "Talk", minutes: 3, emoji: "🗣️" },
  { id: "practice", label: "Practice", minutes: 7, emoji: "✏️" },
  { id: "check", label: "Check", minutes: 2, emoji: "✅" },
];

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function injectStyles() {
  if (document.getElementById("ntfr-styles")) return;
  const style = document.createElement("style");
  style.id = "ntfr-styles";
  style.textContent = `
.ntfr{color-scheme:light;border:2px solid #0e7490;border-radius:14px;background:#ecfeff;color:#164e63;padding:14px 16px;margin:14px 0;display:grid;gap:10px}
.ntfr-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0}
.ntfr-head strong{font-size:1rem}
.ntfr-clock{font-variant-numeric:tabular-nums;font-weight:800;font-size:1.15rem;margin-left:auto}
.ntfr-track{display:flex;gap:6px;flex-wrap:wrap}
.ntfr-seg{flex:1 1 90px;min-width:90px;border:1.5px solid #67e8f9;border-radius:10px;background:#fff;padding:8px;text-align:center;font-weight:700;font-size:.85rem}
.ntfr-seg[data-state="active"]{border-color:#0e7490;background:#0e7490;color:#fff}
.ntfr-seg[data-state="done"]{opacity:.55;text-decoration:line-through}
.ntfr-seg small{display:block;font-weight:600}
.ntfr-move{margin:0;background:#cffafe;border-radius:10px;padding:10px 12px;font-size:.92rem}
.ntfr-controls{display:flex;gap:8px;flex-wrap:wrap}
.ntfr button{border:1.5px solid #0e7490;border-radius:10px;background:#fff;color:#0e7490;font:inherit;font-weight:800;padding:8px 14px;cursor:pointer;min-height:44px}
.ntfr button[data-primary]{background:#0e7490;color:#fff}
.ntfr button:focus-visible{outline:3px solid #164e63;outline-offset:2px}
@media print{.ntfr{display:none}}
/* Dark theme — retint the cyan rhythm coach (active segment/buttons keep the
   #0e7490 accent with white text). */
:root[data-theme="dark"] .ntfr{background:#0c2530;border-color:#1c7d99;color:#cdeef6}
:root[data-theme="dark"] .ntfr-seg{background:#12303c;border-color:#1c7d99;color:#cdeef6}
:root[data-theme="dark"] .ntfr-move{background:#12303c}
:root[data-theme="dark"] .ntfr button{background:#12303c;color:#67e8f9;border-color:#1c7d99}
`;
  document.head.appendChild(style);
}

function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Build the rhythm coach for one small-group session. `facilitation` is the
 * teacher-route payload ({ moves: [...] }); moves map 1:1 onto the five
 * rhythm segments when five are provided (the generator always emits five).
 */
export function createRhythmCoach(facilitation) {
  if (typeof document === "undefined") return null;
  injectStyles();
  const moves = Array.isArray(facilitation?.moves) ? facilitation.moves : [];

  const root = document.createElement("aside");
  root.className = "ntfr";
  root.setAttribute("aria-label", "Facilitation rhythm coach");
  root.innerHTML = `
    <p class="ntfr-head"><span aria-hidden="true">⏱️</span><strong>Rhythm coach</strong>
      <span>15–20 min small-group pacing</span>
      <span class="ntfr-clock" aria-hidden="true">0:00</span></p>
    <div class="ntfr-track" role="list"></div>
    <p class="ntfr-move" aria-live="polite"></p>
    <div class="ntfr-controls">
      <button type="button" data-primary data-action="start">▶ Start</button>
      <button type="button" data-action="next">Skip to next segment</button>
      <button type="button" data-action="reset">Reset</button>
    </div>`;

  const track = root.querySelector(".ntfr-track");
  const clock = root.querySelector(".ntfr-clock");
  const moveNote = root.querySelector(".ntfr-move");
  const startButton = root.querySelector('[data-action="start"]');

  const cells = SEGMENTS.map((segment, index) => {
    const cell = document.createElement("div");
    cell.className = "ntfr-seg";
    cell.setAttribute("role", "listitem");
    cell.innerHTML = `${segment.emoji} ${esc(segment.label)}<small>${segment.minutes} min</small>`;
    track.appendChild(cell);
    return { cell, segment, move: moves.length === SEGMENTS.length ? moves[index] : null };
  });

  let segmentIndex = 0;
  let remaining = SEGMENTS[0].minutes * 60;
  let timer = 0;
  let running = false;

  const paint = () => {
    clock.textContent = formatClock(remaining);
    cells.forEach(({ cell }, index) => {
      cell.dataset.state = index < segmentIndex ? "done" : index === segmentIndex ? "active" : "";
    });
    const current = cells[segmentIndex];
    if (current) {
      moveNote.innerHTML = `<b>${esc(current.segment.label)}:</b> ${esc(
        current.move || "Keep every voice in the work — names, frames, and quick checks.",
      )}`;
    } else {
      moveNote.innerHTML = "<b>Session complete.</b> Celebrate the growth you heard.";
    }
  };

  const stop = () => {
    running = false;
    clearInterval(timer);
    startButton.innerHTML = "▶ Resume";
  };

  const advance = () => {
    segmentIndex += 1;
    if (segmentIndex >= SEGMENTS.length) {
      stop();
      segmentIndex = SEGMENTS.length;
      remaining = 0;
    } else {
      remaining = SEGMENTS[segmentIndex].minutes * 60;
    }
    paint();
  };

  const tick = () => {
    remaining -= 1;
    if (remaining <= 0) advance();
    else paint();
  };

  root.addEventListener("click", (event) => {
    const action = /** @type {HTMLElement|null} */ (event.target)?.dataset?.action;
    if (!action) return;
    if (action === "start") {
      if (running) {
        stop();
        startButton.innerHTML = "▶ Resume";
      } else {
        running = true;
        startButton.innerHTML = "⏸ Pause";
        timer = setInterval(tick, 1000);
      }
    } else if (action === "next" && segmentIndex < SEGMENTS.length) {
      advance();
    } else if (action === "reset") {
      stop();
      segmentIndex = 0;
      remaining = SEGMENTS[0].minutes * 60;
      startButton.innerHTML = "▶ Start";
      paint();
    }
  });

  paint();
  return root;
}
