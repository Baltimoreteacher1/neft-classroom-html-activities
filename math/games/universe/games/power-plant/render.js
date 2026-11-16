// Power Plant — drawing. Reads the world, never writes it.
// Helix Station: a dark energy facility that lights up as it is repaired.
// The mathematics is drawn INTO the machinery: a reactor's coils are its
// repeated factors and count up the running product as they fire; a lift
// shaft is a ruler in units of power with the dock line at the power it needs.

import {
  drawOri,
  drawWren,
  glow,
  label,
  layer,
  PAL,
  plate,
  rr,
  shadow,
  silhouette,
  sky,
  tile,
} from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { evaluate, running, show, stageOf } from "./math.js";
import { COIL_TICKS, deviceOf, ventActive, ventWarn } from "./rules.js";

let far;
let mid;
let floorTex;

function assets() {
  if (far) return;
  far = silhouette(
    640,
    260,
    "#0f2038",
    16,
    (i) => 0.35 + ((i * 37) % 11) / 22,
    "rgba(111,227,216,0.22)",
  );
  mid = silhouette(
    520,
    200,
    "#132a47",
    13,
    (i) => 0.25 + ((i * 53) % 7) / 12,
    "rgba(242,184,75,0.18)",
  );
  floorTex = layer(80, 40, (g) => {
    g.fillStyle = "#1a2f4f";
    g.fillRect(0, 0, 80, 40);
    g.fillStyle = "#14263f";
    g.fillRect(0, 20, 80, 20);
    g.fillStyle = "rgba(255,255,255,0.05)";
    g.fillRect(0, 0, 80, 2);
    g.fillStyle = "#0e1c30";
    for (const x of [8, 40, 72]) g.fillRect(x, 8, 3, 3);
  });
}

export function drawBackdrop(ctx, cam, w, t, lowfx) {
  assets();
  const restored = w.devices.filter((d) => d.phase === "dock").length / w.devices.length;
  sky(ctx, W, H, "#081425", "#10233d", `rgba(31,166,162,${0.12 + restored * 0.22})`);
  if (lowfx) return;
  tile(ctx, far, cam.parallax(0.18), 150, W);
  tile(ctx, mid, cam.parallax(0.42), 250, W);
  // Light shafts sweep slowly; they brighten as power comes back.
  ctx.globalAlpha = 0.05 + restored * 0.08;
  ctx.fillStyle = PAL.tealGlow;
  for (let i = 0; i < 4; i++) {
    const x = ((i * 310 + cam.parallax(0.3) + Math.sin(t * 0.2 + i) * 30) % (W + 200)) - 100;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 60, 0);
    ctx.lineTo(x - 40, H);
    ctx.lineTo(x - 140, H);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSolid(ctx, s, t) {
  if (s.kind === "floor" || s.kind === "block") {
    ctx.fillStyle = ctx.createPattern(floorTex, "repeat");
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillRect(0, 0, s.w, s.h);
    ctx.restore();
    ctx.fillStyle = PAL.teal;
    ctx.fillRect(s.x, s.y, s.w, 4);
    ctx.fillStyle = "rgba(111,227,216,0.25)";
    ctx.fillRect(s.x, s.y + 4, s.w, 2);
  } else if (s.kind === "ledge") {
    ctx.fillStyle = "#24406b";
    rr(ctx, s.x, s.y, s.w, s.h, 5);
    ctx.fill();
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(s.x + 6, s.y, s.w - 12, 3);
  } else if (s.kind === "gate") {
    const open = s.open ? 1 : 0;
    ctx.fillStyle = "#1c3357";
    ctx.fillRect(s.x, s.y, s.w, 14);
    if (open) {
      glow(ctx, s.x + s.w / 2, s.y + s.h - 30, 46, PAL.ok, 0.35);
      return;
    }
    for (let y = s.y + 14; y < s.y + s.h; y += 18) {
      ctx.fillStyle = `rgba(217,115,78,${0.55 + 0.25 * Math.sin(t * 4 + y * 0.1)})`;
      ctx.fillRect(s.x + 4, y, s.w - 8, 10);
    }
    ctx.strokeStyle = PAL.terra;
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x + 1, s.y + 14, s.w - 2, s.h - 14);
  }
}

function drawLift(ctx, w, d, need) {
  const s = w.solids[d.solid];
  const top = d.y - d.need * 1.2 * d.unit - 20;
  // Shaft rails and the power ruler.
  ctx.strokeStyle = "rgba(169,182,211,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(d.x + 8, d.y);
  ctx.lineTo(d.x + 8, top);
  ctx.moveTo(d.x + d.w - 8, d.y);
  ctx.lineTo(d.x + d.w - 8, top);
  ctx.stroke();
  const every = d.need <= 10 ? 1 : d.need <= 40 ? 4 : d.need <= 100 ? 8 : 16;
  ctx.fillStyle = "rgba(169,182,211,0.6)";
  for (let u = every; u <= d.need * 1.2; u += every) ctx.fillRect(d.x - 6, d.y - u * d.unit, 12, 2);
  // The dock line: the power this structure needs.
  const dockY = d.y - d.need * d.unit;
  ctx.fillStyle = d.phase === "dock" ? PAL.ok : PAL.gold;
  ctx.fillRect(d.x - 12, dockY - 2, d.w + 24, 4);
  plate(ctx, d.x - 96, dockY - 16, 80, 30, d.phase === "dock" ? PAL.ok : PAL.gold);
  label(ctx, `${need} ${d.need}`, d.x - 56, dockY, 14, PAL.cream);
  // Platform.
  ctx.fillStyle = "#2c4d80";
  rr(ctx, s.x, s.y, s.w, s.h, 6);
  ctx.fill();
  ctx.fillStyle = d.phase === "short" || d.phase === "trip" ? PAL.terra : PAL.tealGlow;
  ctx.fillRect(s.x + 8, s.y + 3, s.w - 16, 3);
  if (d.value > 0) {
    plate(ctx, s.x + s.w / 2 - 26, s.y + 22, 52, 24);
    label(ctx, String(Math.round(d.value)), s.x + s.w / 2, s.y + 34, 14, PAL.tealGlow);
  }
}

function drawBridge(ctx, w, d, need) {
  const s = w.solids[d.solid];
  const seg = d.unit;
  const n = Math.floor(d.value + 1e-6);
  // Far-side anchor shows where the span has to reach.
  ctx.fillStyle = d.phase === "dock" ? PAL.ok : PAL.gold;
  ctx.fillRect(d.x + d.span - 3, d.y - 26, 6, 26);
  plate(ctx, d.x + d.span / 2 - 46, d.y - 74, 92, 30, d.phase === "dock" ? PAL.ok : PAL.gold);
  label(ctx, `${need} ${d.need}`, d.x + d.span / 2, d.y - 59, 14, PAL.cream);
  if (s.w <= 0) return;
  ctx.fillStyle = d.phase === "trip" ? PAL.terraDeep : "#2c4d80";
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = d.phase === "trip" ? PAL.terra : PAL.tealGlow;
  const stride = seg < 6 ? Math.ceil(6 / seg) : 1;
  for (let i = 0; i <= n; i += stride) ctx.fillRect(s.x + i * seg, s.y, 1.5, s.h);
  plate(ctx, s.x + s.w - 20, s.y + 20, 44, 24);
  label(ctx, String(n), s.x + s.w + 2, s.y + 32, 14, PAL.tealGlow);
}

function drawReactor(ctx, w, m, t, lowfx) {
  const x = m.x;
  const y = m.y;
  const charging = m.state === "charge";
  const lit = charging
    ? Math.min(m.exp, Math.floor(m.t / COIL_TICKS) + 1)
    : m.state === "fire" || m.out
      ? m.exp
      : 0;
  // Console body.
  shadow(ctx, x, y, 34);
  ctx.fillStyle = "#1c3357";
  rr(ctx, x - 26, y - 46, 52, 46, 8);
  ctx.fill();
  ctx.fillStyle = m.by === "wren" ? PAL.teal : PAL.sage;
  ctx.fillRect(x - 26, y - 46, 52, 5);
  // Coil ring: one coil per factor. Each lit coil multiplies by the base once more.
  const products = running(m.base, m.exp);
  const r = 34;
  const cy = y - 96;
  if (!lowfx && lit > 0) glow(ctx, x, cy, 56, PAL.tealGlow, 0.25 + 0.1 * Math.sin(t * 6));
  ctx.strokeStyle = "rgba(169,182,211,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < m.exp; i++) {
    const a = -Math.PI / 2 + (i / Math.max(1, m.exp)) * Math.PI * 2;
    const cx = x + Math.cos(a) * r;
    const cyy = cy + Math.sin(a) * r;
    ctx.fillStyle = i < lit ? PAL.gold : "#2c4d80";
    ctx.beginPath();
    ctx.arc(cx, cyy, 11, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, `×${m.base}`, cx, cyy, 10, i < lit ? "#2a1a02" : PAL.muted);
  }
  // Centre: the running product while coils fire, the expression otherwise.
  const centre = lit > 0 ? String(products[lit - 1]) : m.exp === 0 ? "1" : "·";
  label(ctx, centre, x, cy, 17, lit > 0 ? PAL.tealGlow : PAL.muted);
  plate(ctx, x - 34, y - 38, 68, 26, m.by === "wren" ? PAL.teal : PAL.sage);
  ctx.font = '700 15px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = PAL.ink;
  const bw = ctx.measureText(String(m.base)).width;
  ctx.fillText(String(m.base), x - 4, y - 24);
  ctx.font = '700 11px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.fillStyle = PAL.gold;
  ctx.fillText(String(m.exp), x - 4 + bw / 2 + 6, y - 31);
  if (m.tag) label(ctx, m.tag, x, y - 150, 16, PAL.gold);
}

function drawSequencer(ctx, m, t) {
  const x = m.x;
  const y = m.y;
  shadow(ctx, x, y, 44);
  ctx.fillStyle = "#1c3357";
  rr(ctx, x - 40, y - 46, 80, 46, 8);
  ctx.fill();
  ctx.fillStyle = m.by === "wren" ? PAL.teal : PAL.sage;
  ctx.fillRect(x - 40, y - 46, 80, 5);
  const text = show(m.tokens, m.group).replaceAll("^", "^");
  const width = Math.max(120, text.length * 10 + 24);
  plate(ctx, x - width / 2, y - 92, width, 32, PAL.gold);
  label(ctx, text, x, y - 76, 16, PAL.cream);
  // Stage lamps light in the order the machine actually works: powers, then × ÷, then + −.
  const steps = evaluate(m.tokens, m.group).steps;
  const done =
    m.state === "charge" ? Math.floor(m.t / 30) : m.state === "fire" || m.out ? steps.length : 0;
  const lamps = [
    ["power", "xⁿ"],
    ["times", "× ÷"],
    ["plus", "+ −"],
  ];
  lamps.forEach(([stage, glyph], i) => {
    const on = steps.slice(0, done).some((s) => stageOf(s.op) === stage);
    const now = m.state === "charge" && steps[done] && stageOf(steps[done].op) === stage;
    ctx.fillStyle = on
      ? PAL.gold
      : now
        ? `rgba(242,184,75,${0.5 + 0.4 * Math.sin(t * 12)})`
        : "#2c4d80";
    rr(ctx, x - 36 + i * 25, y - 36, 22, 20, 5);
    ctx.fill();
    label(ctx, glyph, x - 25 + i * 25, y - 26, 9, on || now ? "#2a1a02" : PAL.muted);
  });
  if (done > 0) {
    const s = steps[Math.min(done, steps.length) - 1];
    label(ctx, `${s.a} ${s.op} ${s.b} = ${s.result}`, x, y - 112, 14, PAL.tealGlow);
  }
}

function drawCore(ctx, w, d, m, t, words, lowfx) {
  const x = d.x;
  const y = d.y;
  const stable = d.phase === "dock";
  if (!lowfx) glow(ctx, x, y, 150, stable ? PAL.ok : PAL.terra, 0.22 + 0.08 * Math.sin(t * 3));
  ctx.lineWidth = 8;
  for (let i = 0; i < m.loads.length; i++) {
    ctx.strokeStyle = i < d.phaseIndex ? PAL.ok : i === d.phaseIndex ? PAL.gold : "#2c4d80";
    ctx.beginPath();
    const a0 = -Math.PI / 2 + (i / m.loads.length) * Math.PI * 2 + 0.08 + (stable ? 0 : t * 0.3);
    ctx.arc(x, y, 62, a0, a0 + (Math.PI * 2) / m.loads.length - 0.16);
    ctx.stroke();
  }
  ctx.fillStyle = "#0e1c30";
  ctx.beginPath();
  ctx.arc(x, y, 46, 0, Math.PI * 2);
  ctx.fill();
  const load = stable ? "✓" : String(m.loads[d.phaseIndex]);
  label(ctx, load, x, y - 4, 30, stable ? PAL.ok : PAL.gold);
  label(ctx, stable ? words.stable : words.load, x, y + 22, 12, PAL.muted);
  // The combiner's own wiring, written where the three feeds meet.
  plate(ctx, x - 96, m.y - 96, 192, 34, PAL.gold);
  label(ctx, "A + B × C", x, m.y - 79, 18, PAL.cream);
  shadow(ctx, m.x, m.y, 40);
  ctx.fillStyle = "#1c3357";
  rr(ctx, m.x - 30, m.y - 46, 60, 46, 8);
  ctx.fill();
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(m.x - 30, m.y - 46, 60, 5);
  if (m.state === "charge") label(ctx, "…", m.x, m.y - 22, 22, PAL.gold);
  else if (m.out) label(ctx, String(m.out), m.x, m.y - 22, 18, PAL.tealGlow);
}

/** @param {{words: Record<string, string>, oriMood: string, lowfx: boolean, acting: boolean, talk: boolean}} view */
export function draw(ctx, w, t, view) {
  const { words, lowfx } = view;
  for (const d of w.devices) {
    if (d.kind === "lift") drawLift(ctx, w, d, words.needs);
    if (d.kind === "bridge") drawBridge(ctx, w, d, words.needs);
  }
  for (const s of w.solids) drawSolid(ctx, s, t);

  // Exit: a lit doorway.
  const e = w.exit;
  if (!lowfx) glow(ctx, e.x + e.w / 2, e.y + e.h / 2, 90, PAL.gold, 0.3);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 4;
  rr(ctx, e.x + 20, e.y + 10, e.w - 40, e.h - 10, 14);
  ctx.stroke();
  label(ctx, "➜", e.x + e.w / 2, e.y + e.h / 2 + 6, 28, PAL.gold);

  for (const c of w.checkpoints) {
    ctx.fillStyle = c.hit ? PAL.ok : PAL.muted;
    ctx.fillRect(c.x - 2, c.y - 54, 4, 54);
    if (c.hit && !lowfx) glow(ctx, c.x, c.y - 58, 24, PAL.ok, 0.6);
    ctx.beginPath();
    ctx.arc(c.x, c.y - 58, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of w.benches) {
    shadow(ctx, b.x, b.y, 46);
    ctx.fillStyle = "#24406b";
    rr(ctx, b.x - 44, b.y - 30, 88, 30, 6);
    ctx.fill();
    ctx.fillStyle = PAL.sage;
    ctx.fillRect(b.x - 44, b.y - 30, 88, 5);
    label(ctx, b.kind === "coil" ? "× × ×" : "( )", b.x, b.y - 13, 13, PAL.cream);
    label(ctx, words.bench, b.x, b.y - 44, 12, PAL.sage);
  }
  for (const c of w.calls) {
    ctx.fillStyle = "#24406b";
    rr(ctx, c.x - 10, c.y - 40, 20, 40, 5);
    ctx.fill();
    ctx.fillStyle = PAL.sage;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 28, 6 + Math.sin(t * 4), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const m of w.machines) {
    if (m.kind === "power") drawReactor(ctx, w, m, t, lowfx);
    else if (m.kind === "ops") drawSequencer(ctx, m, t);
    else drawCore(ctx, w, deviceOf(w, m.drives), m, t, words, lowfx);
  }
  // Hazards, each with a clear tell before it acts.
  for (const v of w.vents) {
    ctx.fillStyle = "#0e1c30";
    ctx.fillRect(v.x, v.y - 4, v.w, 8);
    if (ventWarn(v)) {
      ctx.fillStyle = `rgba(242,180,90,${0.4 + 0.4 * Math.sin(t * 18)})`;
      ctx.fillRect(v.x, v.y - 8, v.w, 6);
    }
    if (ventActive(v)) {
      const g = ctx.createLinearGradient(0, v.y - 130, 0, v.y);
      g.addColorStop(0, "rgba(244,236,216,0)");
      g.addColorStop(1, "rgba(244,236,216,0.75)");
      ctx.fillStyle = g;
      ctx.fillRect(v.x + 4 + Math.sin(t * 30) * 2, v.y - 130, v.w - 8, 130);
    }
  }
  for (const b of w.bots) {
    shadow(ctx, b.x + b.w / 2, b.y, 20);
    ctx.fillStyle = PAL.terraDeep;
    rr(ctx, b.x, b.y - b.h, b.w, b.h - 6, 9);
    ctx.fill();
    ctx.fillStyle = PAL.cream;
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2 + b.dir * 7, b.y - b.h / 2 - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.navy;
    ctx.beginPath();
    ctx.arc(b.x + 8, b.y - 5, 5, 0, Math.PI * 2);
    ctx.arc(b.x + b.w - 8, b.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const s = w.pulse;
  if (s?.period) {
    if (s.t > s.period - 70) {
      ctx.fillStyle = `rgba(242,180,90,${0.3 + 0.3 * Math.sin(t * 18)})`;
      ctx.fillRect(0, 512, 60, 8);
    }
    if (s.x >= 0) {
      if (!lowfx) glow(ctx, s.x, 506, 40, PAL.terra, 0.6);
      ctx.fillStyle = PAL.terra;
      rr(ctx, s.x - 8, 494, 16, 26, 6);
      ctx.fill();
    }
  }

  const p = w.p;
  shadow(ctx, p.x + p.w / 2, p.y + p.h, 16, p.ground ? 0.35 : 0.15);
  if (w.stun > 0 && Math.floor(t * 20) % 2 === 0) ctx.globalAlpha = 0.5;
  drawWren(ctx, {
    x: p.x + p.w / 2,
    y: p.y + p.h,
    face: p.face,
    vx: p.vx,
    vy: p.vy,
    ground: p.ground,
    dash: p.dashT,
    landed: p.landed,
    t,
    acting: view.acting,
  });
  ctx.globalAlpha = 1;
  drawOri(ctx, {
    x: w.ori.x,
    y: w.ori.y,
    face: p.x > w.ori.x ? 1 : -1,
    mood: view.oriMood,
    t,
    talk: view.talk ? 1 : 0,
  });
}

/** Screen-space: the coil budget, when the level has one. */
export function drawOverlay(ctx, w, words) {
  if (w.coils < 0) return;
  plate(ctx, W - 170, H - 46, 158, 34, PAL.gold);
  label(ctx, `${words.coils}: ${w.coils}`, W - 91, H - 29, 15, PAL.cream);
}
