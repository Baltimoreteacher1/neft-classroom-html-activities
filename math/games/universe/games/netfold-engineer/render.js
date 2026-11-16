// NetFold Engineer — drawing. Reads the world, never writes it.
// The Kinetic Workshop: each bench has a 3D display that turns slowly (drag
// to turn it yourself). Nets fold on their real hinges; paper wraps a box face
// by face; cubes pack layer by layer. Faces are painter-sorted and flat-shaded.

import { drawOri, drawWren, glow, label, PAL, plate, rr, shadow, sky } from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { closes, cross, dot, fold, norm, project, squareNet, sub3 } from "./geo3d.js";
import { FLOOR } from "./levels.js";
import { answerOf } from "./rules.js";

export function drawBackdrop(ctx) {
  sky(ctx, W, H, "#0e1a2a", "#1f3346", "rgba(111,227,216,0.12)");
}

const LIGHT = norm([0.4, -0.6, 0.8]);

/** Draw 3D polygons [{ p3, fill, edge?, alpha? }] sorted far to near, lit by their normal. */
function polys(ctx, list, view) {
  const items = list.map((f) => {
    const pts = f.p3.map((p) => project(p, view));
    const n = norm(cross(sub3(f.p3[1], f.p3[0]), sub3(f.p3[2], f.p3[0])));
    const lit = 0.55 + 0.45 * Math.abs(dot(n, LIGHT));
    return { pts, depth: pts.reduce((s, p) => s + p.depth, 0) / pts.length, lit, f };
  });
  items.sort((a, b) => a.depth - b.depth);
  for (const it of items) {
    ctx.globalAlpha = it.f.alpha ?? 1;
    ctx.beginPath();
    it.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = shade(it.f.fill, it.lit);
    ctx.fill();
    ctx.strokeStyle = it.f.edge || "rgba(13,27,46,0.8)";
    ctx.lineWidth = it.f.edgeW || 1.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function shade(hex, k) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

const box = (x0, y0, z0, l, w, h, fill, extra = {}) => {
  const P = (x, y, z) => [x0 + x, y0 + y, z0 + z];
  const v = [
    P(0, 0, 0),
    P(l, 0, 0),
    P(l, w, 0),
    P(0, w, 0),
    P(0, 0, h),
    P(l, 0, h),
    P(l, w, h),
    P(0, w, h),
  ];
  return [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ].map((f) => ({ p3: f.map((i) => v[i]), fill, ...extra }));
};

function netScene(r, view, preview) {
  const j = r.job;
  const choice = j && j.t ? j.choice : preview;
  const k = j ? j.k : 0;
  const faces = fold(squareNet(r.choices[choice]), k);
  // Centre the net on the display.
  const all = faces.flatMap((f) => f.p3);
  const c = [0, 1, 2].map(
    (i) => (Math.min(...all.map((p) => p[i])) + Math.max(...all.map((p) => p[i]))) / 2,
  );
  view.center = c;
  view.scale = 105;
  const bad = j && j.t > 100 && !j.result.ok;
  const list = faces.map((f, i) => ({
    p3: f.p3,
    fill: bad ? (i % 2 ? "#d9734e" : "#c95f3f") : i === 0 ? "#2f6f6a" : "#c9a45c",
    edge: bad ? "#ffd166" : undefined,
  }));
  return list;
}

function wrapScene(r, view) {
  const j = r.job;
  const k = j ? j.k : 0;
  const v = j ? j.value : 0;
  const list = [];
  if (r.solid === "prism") {
    const { l, w, h } = r;
    view.center = [l / 2, w / 2, h / 2];
    list.push(...box(0, 0, 0, l, w, h, "#7a8aa8", { alpha: 0.9 }));
    if (j) {
      // Paper covers faces in order: bottom, the four sides, then the top, as far as its area reaches.
      const faces = [
        {
          a: l * w,
          p: (f) => [
            [0, 0, -0.02],
            [l, 0, -0.02],
            [l, w * f, -0.02],
            [0, w * f, -0.02],
          ],
        },
        {
          a: l * h,
          p: (f) => [
            [0, -0.02, 0],
            [l, -0.02, 0],
            [l, -0.02, h * f],
            [0, -0.02, h * f],
          ],
        },
        {
          a: w * h,
          p: (f) => [
            [l + 0.02, 0, 0],
            [l + 0.02, w, 0],
            [l + 0.02, w, h * f],
            [l + 0.02, 0, h * f],
          ],
        },
        {
          a: l * h,
          p: (f) => [
            [0, w + 0.02, 0],
            [l, w + 0.02, 0],
            [l, w + 0.02, h * f],
            [0, w + 0.02, h * f],
          ],
        },
        {
          a: w * h,
          p: (f) => [
            [-0.02, 0, 0],
            [-0.02, w, 0],
            [-0.02, w, h * f],
            [-0.02, 0, h * f],
          ],
        },
        {
          a: l * w,
          p: (f) => [
            [0, 0, h + 0.02],
            [l * f, 0, h + 0.02],
            [l * f, w, h + 0.02],
            [0, w, h + 0.02],
          ],
        },
      ];
      let left = v * k;
      for (const f of faces) {
        if (left <= 0) break;
        const frac = Math.min(1, left / f.a);
        list.push({ p3: f.p(frac), fill: "#d9734e", edge: "#f2b84b" });
        left -= f.a;
      }
      if (left > 0 && k >= 1) {
        // Extra paper: a flap sticking up off the top.
        const fl = Math.min(l, left / w);
        list.push({
          p3: [
            [0, 0, h + 0.04],
            [fl, 0, h + 0.04],
            [fl, 0, h + 0.04 + Math.min(2, left / l)],
            [0, 0, h + 0.04 + Math.min(2, left / l)],
          ],
          fill: "#f2b84b",
          edge: "#ffd166",
          edgeW: 2.5,
        });
      }
    }
  } else {
    const { b, s, h } = r;
    view.center = [b / 2, b / 2, h / 2];
    const apex = [b / 2, b / 2, h];
    const base = [
      [0, 0, 0],
      [b, 0, 0],
      [b, b, 0],
      [0, b, 0],
    ];
    list.push({ p3: base, fill: "#7a8aa8" });
    for (let i = 0; i < 4; i++)
      list.push({ p3: [base[i], base[(i + 1) % 4], apex], fill: "#7a8aa8", alpha: 0.9 });
    if (j) {
      const total = b * b + 4 * ((b * s) / 2);
      const frac = Math.min(1.2, (v * k) / total);
      // Cover the base, then each triangle in turn, by area.
      let left = v * k;
      if (left > 0)
        list.push({ p3: base.map((p) => [p[0], p[1], -0.02]), fill: "#d9734e", edge: "#f2b84b" });
      left -= b * b;
      for (let i = 0; i < 4 && left > 0; i++) {
        const f = Math.min(1, left / ((b * s) / 2));
        const a = base[i];
        const c = base[(i + 1) % 4];
        const top = [a[0] + (apex[0] - a[0]) * f, a[1] + (apex[1] - a[1]) * f, apex[2] * f];
        const top2 = [c[0] + (apex[0] - c[0]) * f, c[1] + (apex[1] - c[1]) * f, apex[2] * f];
        list.push({
          p3: f < 1 ? [a, c, top2, top] : [a, c, apex],
          fill: "#d9734e",
          edge: "#f2b84b",
        });
        left -= (b * s) / 2;
      }
      if (frac > 1.001 && k >= 1)
        list.push({
          p3: [
            [0, 0, h + 0.1],
            [b / 3, 0, h + 0.1],
            [b / 3, 0, h + 1.2],
            [0, 0, h + 1.2],
          ],
          fill: "#f2b84b",
          edge: "#ffd166",
        });
    }
  }
  return list;
}

function fillScene(r, view) {
  const { l, w, h, cube } = r;
  view.center = [l / 2, w / 2, h / 2];
  const list = box(0, 0, 0, l, w, h, "#7a8aa8", { alpha: 0.25 });
  const j = r.job;
  if (j) {
    const nx = Math.round(l / cube);
    const ny = Math.round(w / cube);
    const nz = Math.round(h / cube);
    const want = Math.round(j.value / cube ** 3);
    const shown = Math.floor(want * j.k);
    for (let i = 0; i < shown; i++) {
      const layer = Math.floor(i / (nx * ny));
      const inLayer = i % (nx * ny);
      const x = (inLayer % nx) * cube;
      const y = Math.floor(inLayer / nx) * cube;
      const z = layer * cube;
      const over = layer >= nz;
      list.push(
        ...box(
          x + 0.03,
          y + 0.03,
          z + 0.03,
          cube - 0.06,
          cube - 0.06,
          cube - 0.06,
          over ? "#d9734e" : "#c9a45c",
        ),
      );
    }
  }
  return list;
}

function designScene(r, view, preview) {
  const j = r.job;
  const pick = j ? j.choice : preview;
  const [a, b, c] = r.options[pick];
  view.center = [a / 2, b / 2, c / 2];
  view.scale = 220 / Math.max(a, b, c, 4);
  return box(0, 0, 0, a, b, c, j && j.t > 100 ? (j.result.ok ? "#5f8368" : "#c9a45c") : "#c9a45c");
}

function bench(ctx, r, t, view0, words) {
  const x = r.bench;
  // The bench and its display.
  ctx.fillStyle = "#3a2c22";
  rr(ctx, x - 90, FLOOR - 70, 180, 70, 8);
  ctx.fill();
  ctx.fillStyle = "#2b3a52";
  rr(ctx, x - 40, FLOOR - 110, 80, 40, 6);
  ctx.fill();
  ctx.fillStyle = r.done ? PAL.ok : PAL.tealGlow;
  ctx.fillRect(x - 34, FLOOR - 104, 68, 28);
  plate(ctx, x + 60, 60, 520, 330, PAL.navy3);
  glow(ctx, x + 320, 230, 220, "rgba(111,227,216,0.6)", 0.12);
  const view = {
    yaw: view0.yaw,
    pitch: 0.55,
    dist: 40,
    scale: 46,
    ox: x + 320,
    oy: 250,
    center: [0, 0, 0],
  };
  const scene =
    r.kind === "net" ? netScene(r, view, view0.preview(r))
      : r.kind === "wrap"
        ? wrapScene(r, view)
        : r.kind === "fill"
          ? fillScene(r, view)
          : designScene(r, view, view0.preview(r));
  polys(ctx, scene, view);
  label(ctx, view0.caption(r), x + 320, 82, 15, PAL.cream);
  // Done: a check light.
  if (r.done) glow(ctx, x, FLOOR - 90, 40, PAL.ok, 0.5);
}

export function draw(ctx, w, t, view) {
  ctx.fillStyle = "#1a2433";
  ctx.fillRect(0, FLOOR, w.w, 200);
  ctx.fillStyle = PAL.goldDeep;
  ctx.fillRect(0, FLOOR, w.w, 3);
  for (const r of w.rooms) {
    bench(ctx, r, t, { yaw: view.yaw, caption: view.caption, preview: view.preview }, view.words);
    const g = w.solids[r.gate];
    if (!g.open) {
      ctx.fillStyle = "#4a3a2c";
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = PAL.gold;
      for (let y = g.y + 20; y < g.y + g.h; y += 40) ctx.fillRect(g.x + 4, y, g.w - 8, 6);
    } else glow(ctx, g.x + 13, FLOOR - 120, 70, PAL.ok, 0.3);
  }
  const e = w.exit;
  glow(ctx, e.x + e.w / 2, e.y + e.h / 2, 90, PAL.gold, 0.3);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 4;
  rr(ctx, e.x + 20, e.y + 10, e.w - 40, e.h - 10, 14);
  ctx.stroke();
  label(ctx, "➜", e.x + e.w / 2, e.y + e.h / 2 + 6, 28, PAL.gold);
  const p = w.p;
  shadow(ctx, p.x + p.w / 2, p.y + p.h, 16, p.ground ? 0.35 : 0.15);
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
  drawOri(ctx, {
    x: p.x - 30 * p.face + 10,
    y: p.y - 30,
    face: p.face,
    mood: view.oriMood,
    t,
    talk: view.talk ? 1 : 0,
  });
}

export { answerOf, closes };
