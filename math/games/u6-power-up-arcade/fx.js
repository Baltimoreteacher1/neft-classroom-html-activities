// Power Up! effects: chiptune-style Web Audio blips and a light particle canvas.
// Nothing here runs a continuous loop: the particle canvas animates only while particles live.

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── sound ────────────────────────────────────────────────────────────────────
let ctx = null;
let muted = false;
const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);

export function setMuted(m) {
  muted = m;
}

function tone(freq, start, dur, type = "square", gain = 0.07) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const SONGS = {
  pick: () => tone(NOTE(76), 0, 0.07),
  key: () => tone(NOTE(72), 0, 0.04, "triangle", 0.05),
  zap: () => [72, 76, 79].forEach((n, i) => tone(NOTE(n), i * 0.06, 0.1)),
  combo: (c) =>
    [72, 76, 79, 84]
      .slice(0, Math.min(4, 1 + c))
      .forEach((n, i) => tone(NOTE(n + c), i * 0.05, 0.12)),
  oops: () => {
    tone(NOTE(52), 0, 0.14, "sawtooth", 0.05);
    tone(NOTE(48), 0.1, 0.18, "sawtooth", 0.05);
  },
  power: () =>
    [60, 64, 67, 72, 76, 79].forEach((n, i) => tone(NOTE(n), i * 0.05, 0.14, "square", 0.06)),
  hit: () => {
    tone(NOTE(48), 0, 0.12, "sawtooth", 0.08);
    tone(NOTE(84), 0.03, 0.1);
  },
  win: () => [72, 72, 72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.11, 0.2)),
  boss: () =>
    [43, 43, 50, 43, 55].forEach((n, i) => tone(NOTE(n), i * 0.13, 0.2, "sawtooth", 0.07)),
  start: () => [60, 67, 72, 79].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.16)),
};

/** Sounds start only after a tap or key, as browsers require. */
export function sfx(name, arg) {
  if (muted) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    SONGS[name]?.(arg);
  } catch {
    // Audio is a bonus; the game works without it.
  }
}

// ── particles ────────────────────────────────────────────────────────────────
let canvas = null;
let g2 = null;
let parts = [];
let raf = 0;

export function mountFx(el) {
  canvas = el;
  g2 = canvas.getContext("2d");
  const fit = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.round(r.width);
    canvas.height = Math.round(r.height);
  };
  fit();
  addEventListener("resize", fit);
}

function frame() {
  g2.clearRect(0, 0, canvas.width, canvas.height);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
    p.life -= 1;
    g2.globalAlpha = Math.max(0, p.life / p.max);
    g2.fillStyle = p.color;
    if (p.star) g2.fillText("★", p.x, p.y);
    else g2.fillRect(p.x, p.y, p.size, p.size);
  }
  g2.globalAlpha = 1;
  raf = parts.length ? requestAnimationFrame(frame) : 0;
  if (!parts.length) g2.clearRect(0, 0, canvas.width, canvas.height);
}

const COLORS = ["#ffe066", "#ff5fa2", "#37e6ff", "#7dff6b", "#ff9a3c", "#ffffff"];

/** Burst at a point (page coordinates relative to the screen element). */
export function burst(
  x,
  y,
  { n = 26, colors = COLORS, speed = 5, star = false, gravity = 0.18 } = {},
) {
  if (!canvas || reduced()) return;
  g2.font = "18px sans-serif";
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (0.4 + Math.random()) * speed;
    const life = 34 + Math.random() * 26;
    parts.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1,
      g: gravity,
      life,
      max: life,
      size: 3 + Math.random() * 4,
      color: colors[(Math.random() * colors.length) | 0],
      star: star && i % 3 === 0,
    });
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

/** A shower of confetti from the top of the screen. */
export function confetti(count = 90) {
  if (!canvas || reduced()) return;
  for (let i = 0; i < count; i++) {
    const life = 90 + Math.random() * 60;
    parts.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 60,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
      g: 0.03,
      life,
      max: life,
      size: 5 + Math.random() * 5,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      star: false,
    });
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

/** Centre of an element, in the particle canvas's coordinates. */
export function centerOf(el) {
  const c = canvas.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
}
