/*
 * prism-volume.js — volume of a rectangular prism as BASE AREA × HEIGHT,
 * with edge lengths that may be fractions.
 *
 * WHY THIS EXISTS. Lesson 5-10 ("Volume of Rectangular Prisms", 6.GR.2) states
 * its target exactly: *find the volume of a rectangular prism, including ones
 * with fractional edge lengths, using base area × height*. The tool it shipped
 * with was `manip:cube-builder` in tank mode, which could do neither half of
 * that sentence. Its steppers truncate to whole numbers (`L | 0`), so the
 * lesson's own 1.5 ft capsule edge is not expressible; and its readout prints
 * the OPEN-TOP SURFACE AREA of five glass faces — 6.GR.4 mathematics, two
 * lessons later — beside a water-fill volume the lesson never asks for. A
 * student exploring it is being shown the wrong arithmetic in the wrong units.
 *
 * WHAT THIS DRAWS INSTEAD. One prism, three readouts, and nothing else:
 *
 *   B = l × w          the base, shaded and subdivided into half-unit squares
 *   V = B × h          the base repeated up the height, one layer per unit
 *   V = l × w × h      the same number by the other route
 *
 * Both forms are shown together and always agree, because "why is Bh the same
 * as lwh" is the understanding the lesson is after, not a second procedure.
 *
 * FRACTIONS ARE THE POINT, not an edge case. The stepper moves in halves and
 * the grid is drawn at half-unit spacing, so 1.5 is a visible one-and-a-half
 * columns rather than a number that silently rounds. Values are held as halves
 * (integer count of 0.5 units) so no float ever accumulates.
 *
 * NOT IN SCOPE, DELIBERATELY: surface area, nets, cross-sections, capacity
 * conversion. Each belongs to a later lesson, and a tool that volunteers them
 * is what put this lesson out of scope in the first place.
 *
 * Public API:
 *   renderPrismVolume(container, { l, w, h, unit, max, step, label }) -> { destroy }
 */

import { injectToolTokens } from "./tool-tokens.js";

const C = {
  base: "#1fa6a2", // the base face — the B in V = Bh
  baseSoft: "rgba(31,166,162,.20)",
  body: "rgba(18,53,91,.06)",
  edge: "#12355b",
  grid: "rgba(18,53,91,.28)",
  layer: "rgba(18,53,91,.16)",
};

/**
 * Granularity, held as integer multiples so 0.5 + 0.5 is exactly 1.
 *
 * `step` is per-lesson and matters instructionally, not cosmetically. Lesson
 * 5-5 teaches volume with WHOLE-number edges and lesson 5-10 introduces
 * fractional ones; a half-step builder in 5-5 hands students the next lesson's
 * mathematics early, which is the same drift in the opposite direction.
 */
const HALVES = 2;
const toHalves = (n) => Math.round(Number(n) * HALVES);
const fromHalves = (n) => n / HALVES;

/** 1.5 not 1.50, 3 not 3.0 — the way the lesson writes its own numbers. */
function num(n) {
  return String(Math.round(n * 1000) / 1000);
}

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

const SVG_NS = "http://www.w3.org/2000/svg";
function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, String(v));
  return node;
}

export function renderPrismVolume(
  container,
  /** @type {{l?:number,w?:number,h?:number,unit?:string,max?:number,step?:number,label?:string}} */
  { l = 2, w = 1.5, h = 1, unit = "units", max = 5, step: stepSize = 0.5, label = "" } = {},
) {
  injectToolTokens();

  const STEP = Math.max(1, toHalves(stepSize)); // stepper increment, in halves
  const MAXH = toHalves(Math.max(2, max)); // ceiling, in halves
  const dims = { l: toHalves(l), w: toHalves(w), h: toHalves(h) };
  const clamp = (v) => Math.max(STEP, Math.min(MAXH - (MAXH % STEP), Math.round(v / STEP) * STEP));
  for (const k of Object.keys(dims)) dims[k] = clamp(dims[k]);

  const root = document.createElement("div");
  root.className = "prism-volume";
  root.style.cssText =
    "display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;" +
    "background:var(--tool-surface,#fff);color:var(--tool-ink,#1a2b3c);";

  const figure = document.createElement("div");
  figure.style.cssText = "flex:1 1 300px;min-width:260px;max-width:460px;";
  const svg = el("svg", { viewBox: "0 0 460 320", role: "img" });
  svg.style.cssText =
    "display:block;width:100%;height:auto;border:1px solid var(--tool-line,#d7e2ed);" +
    "border-radius:var(--tool-radius,12px);background:var(--tool-canvas,#f7fafd);";
  figure.appendChild(svg);
  root.appendChild(figure);

  const side = document.createElement("div");
  side.style.cssText = "flex:1 1 240px;min-width:230px;";
  root.appendChild(side);

  if (label) {
    const cap = document.createElement("p");
    cap.textContent = label;
    cap.style.cssText = "margin:0 0 10px;font-weight:600;";
    side.appendChild(cap);
  }

  /* ── steppers ─────────────────────────────────────────────────────────── */
  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;";
  side.appendChild(controls);

  const readouts = {};
  const FIELDS = [
    ["l", "Length"],
    ["w", "Width"],
    ["h", "Height"],
  ];
  for (const [key, name] of FIELDS) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "flex:1 1 108px;";
    wrap.innerHTML =
      `<span style="display:block;font-size:.72rem;font-weight:700;letter-spacing:.03em;` +
      `text-transform:uppercase;color:var(--tool-muted,#54677c);margin-bottom:4px;">` +
      `${esc(name)} (${esc(unit)})</span>`;
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:6px;";
    const dec = document.createElement("button");
    dec.type = "button";
    dec.className = "tool-btn";
    dec.style.cssText = "padding:0;width:44px;font-size:1.3rem;";
    dec.textContent = "−";
    dec.setAttribute("aria-label", `decrease ${name} by ${num(fromHalves(STEP))} ${unit}`);
    const out = document.createElement("output");
    out.style.cssText = "min-width:46px;text-align:center;font-size:1.15rem;font-weight:700;";
    const inc = dec.cloneNode(false);
    inc.textContent = "+";
    inc.setAttribute("aria-label", `increase ${name} by ${num(fromHalves(STEP))} ${unit}`);
    row.append(dec, out, inc);
    wrap.appendChild(row);
    controls.appendChild(wrap);
    readouts[key] = { out, dec, inc };
    dec.addEventListener("click", () => step(key, -1));
    inc.addEventListener("click", () => step(key, +1));
  }

  const half = document.createElement("p");
  half.textContent =
    STEP === 1
      ? `Each tap changes an edge by one half ${unit}.`
      : `Each tap changes an edge by ${num(fromHalves(STEP))} ${unit}.`;

  half.style.cssText = "margin:-6px 0 12px;font-size:.85rem;color:var(--tool-muted,#54677c);";
  side.appendChild(half);

  /* ── readout ──────────────────────────────────────────────────────────── */
  const math = document.createElement("div");
  math.setAttribute("aria-live", "polite");
  math.style.cssText = "display:grid;gap:8px;";
  side.appendChild(math);

  function line(bg, ink) {
    const d = document.createElement("div");
    d.style.cssText =
      `border-radius:var(--tool-radius-sm,8px);padding:10px 12px;font-size:1rem;` +
      `font-weight:600;background:${bg};color:${ink};`;
    return d;
  }
  const lineB = line("rgba(31,166,162,.14)", "#0d6360");
  const lineBh = line("rgba(18,53,91,.08)", "var(--tool-ink,#1a2b3c)");
  const lineLwh = line("transparent", "var(--tool-muted,#54677c)");
  lineLwh.style.border = "1px dashed var(--tool-line,#d7e2ed)";
  math.append(lineB, lineBh, lineLwh);

  function step(key, dir) {
    dims[key] = clamp(dims[key] + dir * STEP);
    draw();
  }

  /* ── isometric drawing ────────────────────────────────────────────────── */
  const KX = 0.866,
    KY = 0.5;

  function draw() {
    const L = fromHalves(dims.l),
      W = fromHalves(dims.w),
      H = fromHalves(dims.h);
    const B = L * W;
    const V = B * H;

    for (const [key] of FIELDS) {
      const r = readouts[key];
      r.out.value = num(fromHalves(dims[key]));
      r.dec.disabled = dims[key] <= STEP;
      r.inc.disabled = dims[key] + STEP > MAXH;
    }

    lineB.textContent = `Base area  B = l × w = ${num(L)} × ${num(W)} = ${num(B)} square ${unit}`;
    lineBh.textContent = `Volume  V = B × h = ${num(B)} × ${num(H)} = ${num(V)} cubic ${unit}`;
    lineLwh.textContent = `Same answer the other way:  l × w × h = ${num(L)} × ${num(W)} × ${num(H)} = ${num(V)}`;
    svg.setAttribute(
      "aria-label",
      `A rectangular prism ${num(L)} by ${num(W)} by ${num(H)} ${unit}. ` +
        `Its shaded base has area ${num(B)} square ${unit}, and stacking that base ` +
        `${num(H)} ${unit} high gives a volume of ${num(V)} cubic ${unit}.`,
    );

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // One scale for all three axes so the picture stays honest as edges change.
    const span = Math.max(L + W, H + (L + W) * KY) || 1;
    const S = Math.min(74, 240 / span);
    const ox = 230 - ((L - W) * KX * S) / 2;
    const oy = 250 - ((L + W) * KY * S) / 2;
    const p = (x, y, z) => [ox + (x - y) * KX * S, oy + (x + y) * KY * S - z * S];
    const poly = (pts, attrs) =>
      svg.appendChild(el("polygon", { points: pts.map((q) => q.join(",")).join(" "), ...attrs }));
    const seg = (a, b, attrs) =>
      svg.appendChild(el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...attrs }));

    // Base face (z = 0) — drawn first and shaded: this is B.
    poly([p(0, 0, 0), p(L, 0, 0), p(L, W, 0), p(0, W, 0)], {
      fill: C.baseSoft,
      stroke: C.base,
      "stroke-width": 2.5,
    });
    // Half-unit grid ON the base, so a 1.5 edge reads as three half-columns.
    for (let i = STEP; i < dims.l; i += STEP) {
      const x = fromHalves(i);
      seg(p(x, 0, 0), p(x, W, 0), { stroke: C.grid, "stroke-width": 0.8 });
    }
    for (let j = STEP; j < dims.w; j += STEP) {
      const y = fromHalves(j);
      seg(p(0, y, 0), p(L, y, 0), { stroke: C.grid, "stroke-width": 0.8 });
    }

    // Body: the two visible vertical faces and the top.
    poly([p(0, 0, 0), p(L, 0, 0), p(L, 0, H), p(0, 0, H)], {
      fill: C.body,
      stroke: C.edge,
      "stroke-width": 1.6,
    });
    poly([p(L, 0, 0), p(L, W, 0), p(L, W, H), p(L, 0, H)], {
      fill: C.body,
      stroke: C.edge,
      "stroke-width": 1.6,
    });
    poly([p(0, 0, H), p(L, 0, H), p(L, W, H), p(0, W, H)], {
      fill: "rgba(255,255,255,.55)",
      stroke: C.edge,
      "stroke-width": 1.6,
    });

    // Layer rules up the height: V = B × h is "this base, h units tall".
    for (let k = STEP; k < dims.h; k += STEP) {
      const z = fromHalves(k);
      seg(p(0, 0, z), p(L, 0, z), { stroke: C.layer, "stroke-width": 1 });
      seg(p(L, 0, z), p(L, W, z), { stroke: C.layer, "stroke-width": 1 });
    }

    // Edge labels — the three numbers the readout multiplies.
    const text = (pt, s, anchor) => {
      const t = el("text", {
        x: pt[0],
        y: pt[1],
        "text-anchor": anchor || "middle",
        "font-size": 15,
        "font-weight": 700,
        fill: C.edge,
      });
      t.textContent = s;
      svg.appendChild(t);
    };
    const [lx, ly] = p(L / 2, 0, 0);
    text([lx + 6, ly + 22], `l = ${num(L)}`);
    const [wx, wy] = p(L, W / 2, 0);
    text([wx + 10, wy + 20], `w = ${num(W)}`, "start");
    const [hx, hy] = p(0, 0, H / 2);
    text([hx - 10, hy + 5], `h = ${num(H)}`, "end");
  }

  draw();
  container.appendChild(root);

  return {
    destroy() {
      root.remove();
    },
  };
}
