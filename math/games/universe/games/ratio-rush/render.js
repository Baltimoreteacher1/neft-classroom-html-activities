// Ratio Rush — drawing. Reads the world, never writes it.
// The Meridian Line: a valley railway at dusk. Every track carries a mile
// ruler, so a train's motion is a ratio you can read: a run draws the
// distance it covered each minute as a tick on the rail.

import {
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
import { LANE_Y, MI, TICKS_PER_MIN } from "./levels.js";
import { focusStop, nextStop, stopAt } from "./rules.js";

let hills;
let ridge;
let trees;

function assets() {
  if (hills) return;
  hills = silhouette(
    720,
    220,
    "#2b3f5c",
    12,
    (i) => 0.45 + 0.35 * Math.sin(i * 1.7) ** 2,
  );
  ridge = silhouette(
    600,
    170,
    "#355a52",
    15,
    (i) => 0.3 + 0.3 * Math.abs(Math.sin(i * 0.9 + 1)),
  );
  trees = layer(240, 90, (g) => {
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 40 + (i % 2) * 8;
      g.fillStyle = i % 2 ? "#2d5446" : "#3b6a52";
      g.beginPath();
      g.moveTo(x, 90);
      g.lineTo(x + 14, 26 + (i % 3) * 10);
      g.lineTo(x + 28, 90);
      g.fill();
    }
  });
}

export function drawBackdrop(ctx, cam, w, t, lowfx) {
  assets();
  sky(ctx, W, H, "#1b2b4d", "#e0905a", "rgba(242,184,75,0.35)");
  if (lowfx) return;
  // Setting sun, slowly sinking as the line is restored.
  const done = w.stops.filter((s) => s.done).length / w.stops.length;
  glow(ctx, W * 0.72, 210 + done * 60, 150, "rgba(255,206,120,0.9)", 0.55);
  ctx.fillStyle = "#ffd590";
  ctx.beginPath();
  ctx.arc(W * 0.72, 210 + done * 60, 42, 0, Math.PI * 2);
  ctx.fill();
  tile(ctx, hills, cam.parallax(0.15), 200, W);
  tile(ctx, ridge, cam.parallax(0.35), 290, W);
  tile(ctx, trees, cam.parallax(0.6), 330, W);
}

const px = (miles) => miles * MI;

function track(ctx, x0, x1, y, sleepersEvery = 0.25) {
  ctx.fillStyle = "#3a2a22";
  for (
    let m = Math.ceil(x0 / sleepersEvery) * sleepersEvery;
    m <= x1;
    m += sleepersEvery
  )
    ctx.fillRect(px(m) - 3, y - 2, 6, 10);
  ctx.fillStyle = "#c9ced8";
  ctx.fillRect(px(x0), y - 4, px(x1 - x0), 3);
  ctx.fillRect(px(x0), y + 4, px(x1 - x0), 3);
}

/** Mile ruler under a track: the ratio is readable straight off the rail. */
function ruler(ctx, x0, x1, y, from = 0) {
  ctx.fillStyle = "rgba(244,236,216,0.65)";
  for (let m = Math.ceil(x0); m <= x1; m++) {
    ctx.fillRect(px(m) - 1, y + 12, 2, 8);
    if ((m - from) % 2 === 0)
      label(
        ctx,
        String(m - from),
        px(m),
        y + 28,
        11,
        "rgba(244,236,216,0.75)",
        700,
      );
  }
}

/** Locomotive with two cars, drawn from the front coupler at (x, y). */
export function drawTrain(ctx, x, y, o) {
  const body = o.body || PAL.teal;
  const trim = o.trim || PAL.gold;
  const wheel = (cx) => {
    ctx.fillStyle = "#1a2233";
    ctx.beginPath();
    ctx.arc(cx, y + 4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9aa3b5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const a = o.spin;
    ctx.moveTo(cx + Math.cos(a) * 7, y + 4 + Math.sin(a) * 7);
    ctx.lineTo(cx - Math.cos(a) * 7, y + 4 - Math.sin(a) * 7);
    ctx.stroke();
  };
  shadow(ctx, x - 70, y + 12, 80, 0.3);
  // cars
  for (let c = 1; c <= (o.cars ?? 2); c++) {
    const cx = x - 70 - c * 70;
    ctx.fillStyle = o.carColor || "#5f8368";
    rr(ctx, cx, y - 38, 64, 36, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(cx + 6, y - 32, 52, 6);
    wheel(cx + 14);
    wheel(cx + 50);
  }
  // locomotive
  ctx.fillStyle = body;
  rr(ctx, x - 70, y - 48, 70, 46, 9);
  ctx.fill();
  ctx.fillStyle = "#0d1b2e";
  rr(ctx, x - 62, y - 42, 24, 18, 4);
  ctx.fill();
  ctx.fillStyle = PAL.tealGlow;
  ctx.fillRect(x - 58, y - 38, 16, 4);
  ctx.fillStyle = trim;
  ctx.fillRect(x - 70, y - 14, 70, 5);
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 12, y - 4);
  ctx.lineTo(x, y - 4);
  ctx.fill();
  // headlamp
  ctx.fillStyle = "#fff4cc";
  ctx.beginPath();
  ctx.arc(x - 4, y - 30, 4, 0, Math.PI * 2);
  ctx.fill();
  if (o.lamp) glow(ctx, x + 30, y - 26, 60, "rgba(255,240,190,0.9)", 0.35);
  wheel(x - 56);
  wheel(x - 16);
  if (o.plate) {
    plate(ctx, x - 112, y - 92, 112, 30, trim);
    label(ctx, o.plate, x - 56, y - 77, 14, PAL.cream);
  }
  if (o.name) label(ctx, o.name, x - 35, y - 56, 12, PAL.cream);
}

function signal(ctx, x, y, open, t) {
  ctx.fillStyle = "#2b3a52";
  ctx.fillRect(x - 3, y - 110, 6, 110);
  ctx.fillStyle = "#16294a";
  rr(ctx, x - 14, y - 132, 28, 44, 7);
  ctx.fill();
  ctx.fillStyle = open
    ? PAL.ok
    : `rgba(217,115,78,${0.75 + 0.25 * Math.sin(t * 5)})`;
  ctx.beginPath();
  ctx.arc(x, open ? y - 98 : y - 120, 8, 0, Math.PI * 2);
  ctx.fill();
}

function crane(ctx, x, y, state, t) {
  ctx.strokeStyle = "#7d8ca8";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 50, y + 4);
  ctx.lineTo(x - 50, y - 210);
  ctx.lineTo(x + 50, y - 210);
  ctx.lineTo(x + 50, y + 4);
  ctx.stroke();
  const drop = state === "couple" ? 70 + Math.sin(t * 6) * 4 : 20;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 210);
  ctx.lineTo(x, y - 210 + drop);
  ctx.stroke();
  ctx.fillStyle = state === "done" ? PAL.ok : PAL.gold;
  rr(ctx, x - 18, y - 210 + drop, 36, 16, 4);
  ctx.fill();
}

function clockDial(ctx, x, y, minutes, label1) {
  plate(ctx, x - 52, y - 52, 104, 104, PAL.gold);
  ctx.strokeStyle = "rgba(244,236,216,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 6, 30, 0, Math.PI * 2);
  ctx.stroke();
  const a = -Math.PI / 2 + (minutes % 1) * Math.PI * 2;
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + Math.cos(a) * 24, y - 6 + Math.sin(a) * 24);
  ctx.stroke();
  label(ctx, `${Math.floor(minutes)} ${label1}`, x, y + 36, 13, PAL.cream);
}

/** @param {{words: Record<string, string>, lowfx: boolean}} view */
export function draw(ctx, w, t, view) {
  const { words } = view;
  const tr = w.train;
  // Tracks: main line, side tracks, and each junction's two branches.
  track(ctx, 0, w.len, LANE_Y[0]);
  ruler(ctx, 0, w.len, LANE_Y[0]);
  for (const s of w.side) track(ctx, s.x0, s.x1, LANE_Y[s.lane]);
  for (const c of w.crossovers) {
    ctx.strokeStyle = "rgba(201,206,216,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px(c) - 30, LANE_Y[0]);
    ctx.lineTo(px(c) + 30, LANE_Y[1]);
    ctx.stroke();
    label(ctx, "⇅", px(c), LANE_Y[0] - 60, 18, PAL.gold);
  }

  const active = nextStop(w);
  for (const s of w.stops) {
    const y = LANE_Y[0];
    signal(ctx, px(s.x) + 20, y, s.done || (w.run && w.run.stop === s.id), t);
    if (s.kind === "couple") {
      track(ctx, s.x - 1, s.x + s.span + 0.5, LANE_Y[1]);
      crane(
        ctx,
        px(s.x + s.span),
        y,
        s.done ? "done" : w.run?.stop === s.id ? "couple" : "idle",
        t,
      );
      // The partner waits on the upper track with its rate on its plate.
      const r = w.run?.stop === s.id ? w.run : null;
      if (!s.done)
        drawTrain(ctx, px(s.x + (r ? r.them : 0)), LANE_Y[1], {
          body: PAL.terra,
          trim: PAL.cream,
          carColor: "#a84f31",
          cars: 1,
          spin: r ? (r.them * MI) / 9 : 0,
          plate: `${s.partner.d} ${words.mi} : ${s.partner.t} ${words.min}`,
          name: s.name,
        });
      label(
        ctx,
        `${s.span} ${words.mi}`,
        px(s.x + s.span / 2),
        y - 172,
        14,
        PAL.cream,
      );
    } else if (s.kind === "junction") {
      for (const [lane, b, tag] of [
        [1, s.upper, words.upper],
        [2, s.lower, words.lower],
      ]) {
        track(ctx, s.x, s.x + s.span, LANE_Y[lane], s.span / b.len / 4);
        plate(
          ctx,
          px(s.x + s.span / 2) - 120,
          LANE_Y[lane] - 76,
          240,
          32,
          lane === 1 ? PAL.tealGlow : PAL.sage,
        );
        label(
          ctx,
          `${tag}: ${b.len} ${words.mi} · ${words.limit} ${b.rate.d} ${words.mi} : ${b.rate.t} ${words.min}`,
          px(s.x + s.span / 2),
          LANE_Y[lane] - 60,
          13,
          PAL.cream,
        );
      }
      // Station with its gate.
      const sx = px(s.x + s.span);
      ctx.fillStyle = "#2b3a52";
      rr(ctx, sx + 10, y - 120, 120, 120, 10);
      ctx.fill();
      ctx.fillStyle = s.done ? PAL.ok : PAL.terra;
      ctx.fillRect(sx + 10, y - 128, 120, 10);
      label(ctx, words.station, sx + 70, y - 94, 14, PAL.cream);
      const r = w.run?.stop === s.id ? w.run : null;
      if (r || !s.done) {
        const rivalLane = (r ? r.branch : s.branch) === 1 ? 2 : 1;
        drawTrain(
          ctx,
          px(s.x + (r ? r.them : 0) * s.span) - (r ? 0 : 0),
          LANE_Y[rivalLane],
          {
            body: PAL.navy3,
            trim: PAL.terra,
            carColor: "#24406b",
            cars: 1,
            spin: r ? r.them * 40 : 0,
            name: words.rival,
          },
        );
      }
    } else {
      // Depot and its charger.
      const cx = px(s.x + s.span);
      ctx.fillStyle = "#24406b";
      rr(ctx, cx - 20, y - 130, 40, 130, 8);
      ctx.fill();
      ctx.fillStyle = s.done ? PAL.ok : PAL.gold;
      ctx.fillRect(cx - 12, y - 120, 24, 8);
      if (!view.lowfx)
        glow(ctx, cx, y - 116, 30, s.done ? PAL.ok : PAL.gold, 0.5);
      label(ctx, words.charger, cx, y - 146, 13, PAL.cream);
      label(
        ctx,
        `${s.span} ${words.mi}`,
        px(s.x + s.span / 2),
        y - 172,
        14,
        PAL.cream,
      );
      plate(ctx, px(s.x) - 10, y - 200, 190, 32, PAL.gold);
      label(
        ctx,
        `${s.rate.d} ${words.mi} : ${s.rate.t} ${words.cells}`,
        px(s.x) + 85,
        y - 184,
        14,
        PAL.cream,
      );
    }
    if (s === active && !w.run)
      label(ctx, words.stopHere, px(s.x) + 20, y - 148, 13, PAL.gold);
  }

  // Exit tunnel.
  ctx.fillStyle = "#16294a";
  rr(ctx, px(w.exit) - 10, LANE_Y[0] - 150, 160, 158, 70);
  ctx.fill();
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 4;
  ctx.stroke();

  for (const c of w.carts) {
    const x = px(c.x);
    const y = LANE_Y[c.lane];
    shadow(ctx, x, y + 10, 26);
    ctx.fillStyle = PAL.gold;
    rr(ctx, x - 24, y - 26, 48, 24, 5);
    ctx.fill();
    ctx.fillStyle = "#2a1a02";
    ctx.fillRect(x - 18, y - 20, 36, 4);
    ctx.fillStyle = `rgba(242,180,90,${0.5 + 0.5 * Math.sin(t * 8)})`;
    ctx.beginPath();
    ctx.arc(x, y - 32, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // The player's train, sliding between lanes at a crossover.
  let y = LANE_Y[tr.lane];
  if (tr.laneT > 0) {
    const k = tr.laneT / 24;
    y = LANE_Y[tr.lane] + (LANE_Y[tr.from] - LANE_Y[tr.lane]) * k * k;
  }
  const s = w.run ? stopAt(w, w.run.stop) : null;
  let plateText = "";
  if (s?.kind === "couple")
    plateText = `${s.gear.d} ${words.mi} : ${s.gear.t} ${words.min}`;
  if (s?.kind === "depot") plateText = `${s.cells} ${words.cells}`;
  drawTrain(ctx, px(tr.x), y, {
    spin: px(tr.x) / 9,
    plate: plateText,
    lamp: true,
    name: words.you,
  });

  // Minute ticks: where each train was at each whole minute of the run.
  if (w.run && w.run.kind !== "junction") {
    const r = w.run;
    const el = w.tick - r.t0;
    const mins = Math.floor(el / TICKS_PER_MIN);
    for (let m = 1; m <= mins; m++) {
      if (r.kind === "couple") {
        const you = Math.min(stopAt(w, r.stop).span, (r.rate.d * m) / r.rate.t);
        const them = Math.min(
          stopAt(w, r.stop).span,
          (r.partner.d * m) / r.partner.t,
        );
        ctx.fillStyle = PAL.tealGlow;
        ctx.fillRect(px(r.x0 + you) - 2, LANE_Y[0] + 10, 4, 14);
        ctx.fillStyle = PAL.terra;
        ctx.fillRect(px(r.x0 + them) - 2, LANE_Y[1] + 10, 4, 14);
      }
    }
  }
}

/** Screen space: the run's own clock (elapsed minutes, never a countdown) and the cell budget. */
export function drawOverlay(ctx, w, words) {
  if (w.run && w.train.mode === "run")
    clockDial(ctx, 70, H - 90, (w.tick - w.run.t0) / TICKS_PER_MIN, words.min);
  if (w.budget >= 0) {
    plate(ctx, W - 190, H - 46, 178, 34, PAL.gold);
    label(
      ctx,
      `${words.cellsLeft}: ${w.budget}`,
      W - 101,
      H - 29,
      15,
      PAL.cream,
    );
  }
}

/** Investigation view: distance-time graph of both realities (and the partner or rival). */
export function drawInvestigation(ctx, mv, cw, ch, words) {
  ctx.fillStyle = "#0d1b2e";
  ctx.fillRect(0, 0, cw, ch);
  const s0 = focusStop(mv.worlds[0]);
  if (!s0) return;
  const series = [];
  const colors = [PAL.tealGlow, PAL.gold];
  mv.worlds.forEach((w, i) => {
    const s = stopAt(w, s0.id);
    if (s.kind === "couple")
      series.push({
        rate: s.gear,
        color: colors[i],
        name: i ? words.realityB : words.realityA,
        len: s.span,
      });
    if (s.kind === "junction") {
      const b = s.branch === 1 ? s.upper : s.lower;
      series.push({
        rate: b.rate,
        color: colors[i],
        name: i ? words.realityB : words.realityA,
        len: b.len,
      });
    }
    if (s.kind === "depot")
      series.push({
        rate: { d: 2, t: 1 },
        color: colors[i],
        name: i ? words.realityB : words.realityA,
        len: (s.cells * s.rate.d) / s.rate.t,
      });
  });
  if (s0.kind === "couple")
    series.push({
      rate: s0.partner,
      color: PAL.terra,
      name: s0.name,
      len: s0.span,
    });
  const maxT = Math.max(...series.map((x) => (x.len * x.rate.t) / x.rate.d), 1);
  const maxD = Math.max(...series.map((x) => x.len), 1);
  const L = 48;
  const B = ch - 30;
  const sx = (cw - L - 20) / Math.ceil(maxT);
  const sy = (B - 16) / Math.ceil(maxD);
  ctx.strokeStyle = "rgba(244,236,216,0.25)";
  ctx.lineWidth = 1;
  for (let m = 0; m <= Math.ceil(maxT); m++) {
    ctx.beginPath();
    ctx.moveTo(L + m * sx, 16);
    ctx.lineTo(L + m * sx, B);
    ctx.stroke();
    label(ctx, String(m), L + m * sx, B + 12, 11, PAL.muted, 400);
  }
  for (let d = 0; d <= Math.ceil(maxD); d += Math.max(1, Math.ceil(maxD / 8))) {
    ctx.beginPath();
    ctx.moveTo(L, B - d * sy);
    ctx.lineTo(cw - 20, B - d * sy);
    ctx.stroke();
    label(ctx, String(d), L - 16, B - d * sy, 11, PAL.muted, 400);
  }
  label(ctx, words.min, cw - 30, B + 12, 11, PAL.muted, 700);
  label(ctx, words.mi, L - 18, 10, 11, PAL.muted, 700);
  series.forEach((x, i) => {
    ctx.strokeStyle = x.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(L, B);
    const tEnd = (x.len * x.rate.t) / x.rate.d;
    ctx.lineTo(L + tEnd * sx, B - x.len * sy);
    ctx.stroke();
    ctx.fillStyle = x.color;
    for (let m = 1; m <= Math.floor(tEnd); m++) {
      ctx.beginPath();
      ctx.arc(
        L + m * sx,
        B - ((x.rate.d * m) / x.rate.t) * sy,
        3.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // Legend at the top left, clear of the lines (which rise to the right).
    ctx.font = '700 12px "Atkinson Hyperlegible", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillStyle = x.color;
    ctx.fillText(x.name, L + 10, 22 + i * 16);
  });
}
