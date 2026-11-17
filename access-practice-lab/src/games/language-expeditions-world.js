// Language Expeditions world: one long painted strip with four lands side by side (one per WIDA domain), drawn as
// four parallax layers (far ridges, middle silhouettes, the walking ground with each land's landmarks, a dark
// foreground), the explorer, and the camera that glides between stops. Seeded, so a reload paints the same world.
//
// Units: the world is 1000 units tall; land L spans x = L*4000 .. L*4000+4000. Each layer is an <svg> as tall as
// the scene and as wide as its own x-range, anchored at left:50% and slid with translateX(<percent of itself>), so
// the camera math never needs the scene's pixel size. A layer with depth k shows world point XREF + k*(x - XREF)
// at the centre: k < 1 moves slower (far), k > 1 faster (foreground). Decorative only (aria-hidden).
// Art: the site illustration kit's flat layered style (lit and shade sides, haze toward the sky, soft contact
// shadows, no outlines); landmarks and the explorer are drawn in ../art/m-world.js.
import { rng } from "./engine.js";
import { gearSVG } from "./language-expeditions-feel-gear.js"; // feel: gear on the explorer
import { encounterArt, wordGemMark, wordSlot } from "./language-expeditions-encounters-art.js";
import { HERO, LANDMARKS, gateArch, stopLamp } from "../art/m-world.js";

export const H = 1000;
export const LW = 4000;
const XREF = 8000;
const GROUND = 790;
const LAYERS = {
  far: { k: 0.3, x0: 3000, x1: 13000 },
  mid: { k: 0.6, x0: 0, x1: 16000 },
  near: { k: 1, x0: -2000, x1: 18000 },
  front: { k: 1.3, x0: -4500, x1: 20500 },
};
/** Landmark slots inside a land: three-stop lands (Listening, Reading) and two-stop lands (Speaking, Writing). */
const SLOTS = { 3: [1300, 2200, 3100], 2: [1500, 2800] };
export const trailX = (land) => land * LW + 300;
export const gateX = (land) => land * LW + 3700;
export const stopX = (land, k, n) => land * LW + (SLOTS[n] || SLOTS[3])[k];

/** Collectibles: seven per land (fireflies at night, signal sparks in the canyon); every third floats high and needs a
 *  jump. World units, so the explore loop can test them against the explorer without reading the DOM. */
export const GEM_LOW = 640;
export const GEM_HIGH = 400;
const gemCache = new Map();
export function gems(band) {
  if (!gemCache.has(band)) {
    const r = rng(band === "6-8" ? 29 : 23);
    const out = [];
    for (let land = 0; land < 4; land += 1)
      for (let n = 0; n < 7; n += 1)
        out.push({
          id: `${land}-${n}`,
          land,
          x: land * LW + 650 + n * 430 + Math.round(r() * 140),
          y: n % 3 === 2 ? GEM_HIGH : GEM_LOW,
        });
    gemCache.set(band, out);
  }
  return gemCache.get(band);
}
const gemMark = (g, band) =>
  band === "6-8"
    ? `<g class="lexp-gem" data-gem="${g.id}" transform="translate(${g.x} ${g.y})"><circle r="34" fill="#1fa6a2" opacity=".22"/><path d="M0 -27L19 0L0 27L-19 0Z" fill="#178a87"/><path d="M0 -27L19 0L0 27Z" fill="#4cc4bd"/><path d="M0 -27L-8 -4L0 2L8 -4Z" fill="#bff0ea" opacity=".8"/></g>`
    : `<g class="lexp-gem" data-gem="${g.id}" transform="translate(${g.x} ${g.y})"><circle r="34" fill="#f2c15b" opacity=".25"/><circle r="20" fill="#ffe9a0" opacity=".35"/><circle r="12" fill="#ffe9a0"/><circle cx="-3.5" cy="-3.5" r="4.5" fill="#fffbe8"/></g>`;

/** translateX percentage for one layer when the camera centres world point x. */
export const camPct = (name, x) => {
  const L = LAYERS[name];
  const u = XREF + L.k * (x - XREF);
  return -(((u - L.x0) / (L.x1 - L.x0)) * 100);
};

// ── palettes: Deep Harbor navy night (3-5) and a low-sun canyon (6-8); far layers fade toward the sky ─────
const PAL = {
  "3-5": {
    far: "#2b4f6e",
    farLit: "#3f6a8a",
    mid: "#1b3a56",
    midLit: "#28506f",
    near: "#0f263b",
    nearLit: "#1a3a55",
    front: "#07121f",
    ground: "#163247",
    groundLit: "#2c5670",
    trail: "#3a6176",
    pebble: "#58798a",
    haze: "#2a5470",
    fly: "#ffe9a0",
  },
  "6-8": {
    far: "#d99a72",
    farLit: "#ecb68a",
    mid: "#a95a3e",
    midLit: "#bc6a47",
    near: "#6e3428",
    nearLit: "#94493a",
    front: "#2e1610",
    ground: "#5a2f25",
    groundLit: "#8a4a33",
    trail: "#94604a",
    pebble: "#b47c5e",
    haze: "#e4a274",
    fly: "#fff1dc",
  },
};
const f1 = (v) => v.toFixed(1);

/** A pine in three drooping tiers; the right half of each tier catches the light. */
const pine = (x, base, h, c, lit) => {
  const w = h * 0.42;
  let s = `<rect x="${f1(x - h * 0.03)}" y="${f1(base - h * 0.08)}" width="${f1(h * 0.06)}" height="${f1(h * 0.1)}" fill="${c}"/>`;
  for (let k = 0; k < 3; k += 1) {
    const y = base - h * k * 0.28;
    const ww = w * (1 - k * 0.22);
    const top = f1(y - h * 0.5);
    s += `<path d="M${f1(x - ww)} ${f1(y)}Q${f1(x)} ${f1(y + h * 0.05)} ${f1(x + ww)} ${f1(y)}L${f1(x)} ${top}Z" fill="${c}"/>`;
    if (lit)
      s += `<path d="M${f1(x)} ${top}L${f1(x + ww)} ${f1(y)}Q${f1(x + ww * 0.5)} ${f1(y + h * 0.03)} ${f1(x + ww * 0.12)} ${f1(y + h * 0.03)}Z" fill="${lit}"/>`;
  }
  return s;
};
/** A flat-topped mesa; its right face takes the low sun. */
const mesa = (x, h, w, c, lit) => {
  const t = f1(GROUND - h);
  let s = `<path d="M${f1(x - w)} ${GROUND}L${f1(x - w * 0.55)} ${t}H${f1(x + w * 0.55)}L${f1(x + w)} ${GROUND}Z" fill="${c}"/>`;
  if (lit) s += `<path d="M${f1(x + w * 0.12)} ${t}H${f1(x + w * 0.55)}L${f1(x + w)} ${GROUND}H${f1(x + w * 0.3)}Z" fill="${lit}"/>`;
  return s;
};
/** A ridge line, drawn twice (a lit rim, then the body a little lower) so the crest catches the light. */
const ridge = (r, x0, x1, base, amp, step, c, flat, rim) => {
  let d = "";
  for (let x = x0; x <= x1; x += step) {
    const y = f1(base + Math.sin(x / 430) * amp + r() * 40);
    d += flat ? ` L${x} ${y} L${f1(x + step * 0.7)} ${y}` : ` L${x} ${y}`;
  }
  return `<path d="M${x0} ${H}${d} L${x1} ${H}Z" fill="${rim}"/><path transform="translate(0 7)" d="M${x0} ${H}${d} L${x1} ${H}Z" fill="${c}"/>`;
};
const landAt = (x) => Math.max(0, Math.min(3, Math.floor(x / LW)));
const nearLandmark = (x) => {
  const land = landAt(x);
  const off = land * LW;
  return [...SLOTS[3], ...SLOTS[2], 300, 3700].some((s) => Math.abs(off + s - x) < 230);
};
/** A two-tone bush or boulder hugging the ground. */
const mound = (x, rx, ry, c, lit) =>
  `<ellipse cx="${f1(x)}" cy="${GROUND - 5}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${c}"/><ellipse cx="${f1(x + rx * 0.22)}" cy="${f1(GROUND - 5 - ry * 0.42)}" rx="${f1(rx * 0.55)}" ry="${f1(ry * 0.45)}" fill="${lit}"/>`;

function layers(band) {
  const p = PAL[band];
  const r = rng(band === "6-8" ? 11 : 7);
  const night = band === "3-5";
  // far (k .3) and mid (k .6) live in their own u-space; landAt(x) picks each land's silhouette style.
  const xOf = (u, k) => XREF + (u - XREF) / k;
  let far = ridge(r, LAYERS.far.x0, LAYERS.far.x1, 560, 70, night ? 200 : 240, p.far, !night, p.farLit);
  let mid = "";
  for (let u = LAYERS.mid.x0; u < LAYERS.mid.x1; u += 90 + r() * 120) {
    const land = landAt(xOf(u, 0.6));
    if (night && land < 2) mid += pine(u, 770, 200 + r() * 170, p.mid, p.midLit);
    else if (night && land === 2) mid += mesa(u, 200 + r() * 200, 40 + r() * 30, "#20384c", "#2a4a62");
    else if (night) mid += `<ellipse cx="${f1(u)}" cy="${GROUND}" rx="${f1(80 + r() * 60)}" ry="${f1(40 + r() * 30)}" fill="${p.mid}"/>`;
    else mid += mesa(u, 160 + r() * (land === 3 ? 320 : 240), 30 + r() * 40, p.mid, p.midLit);
  }
  // atmospheric depth: haze settles over the foot of the far and middle distance
  mid += `<rect x="${LAYERS.mid.x0}" y="660" width="${LAYERS.mid.x1 - LAYERS.mid.x0}" height="340" fill="${p.haze}" opacity=".28"/>`;
  for (let u = LAYERS.far.x0 + 400; u < LAYERS.far.x1; u += 900 + r() * 500)
    far += night ? pine(u, 600 + r() * 30, 110, "#24476a") : mesa(u, 120 + r() * 80, 120, "#c98462", "#e0a07a");
  far += `<rect x="${LAYERS.far.x0}" y="600" width="${LAYERS.far.x1 - LAYERS.far.x0}" height="400" fill="${p.haze}" opacity=".25"/>`;
  const groundD = `M${LAYERS.near.x0} ${GROUND - 10}Q2000 ${GROUND - 30} 4000 ${GROUND - 5}T8000 ${GROUND - 10}T12000 ${GROUND - 5}T${LAYERS.near.x1} ${GROUND - 10}V${H}H${LAYERS.near.x0}Z`;
  const trail = (y, h, fill, o) =>
    `<path d="M${LAYERS.near.x0} ${y}H${LAYERS.near.x1}V${y + h}H${LAYERS.near.x0}Z" fill="${fill}" opacity="${o}"/>`;
  let near = `<path d="${groundD}" fill="${p.groundLit}"/><path transform="translate(0 9)" d="${groundD}" fill="${p.ground}"/>${trail(GROUND + 10, 28, p.trail, 0.75)}${trail(GROUND + 10, 5, p.groundLit, 0.5)}`;
  let pebbles = "";
  for (let x = LAYERS.near.x0; x < LAYERS.near.x1; x += 120 + r() * 260)
    pebbles += `M${x.toFixed(0)} ${(GROUND + 22 + r() * 12).toFixed(0)}h${(6 + r() * 10).toFixed(0)}`;
  near += `<path d="${pebbles}" stroke="${p.pebble}" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  for (let x = LAYERS.near.x0; x < LAYERS.near.x1; x += 160 + r() * 200) {
    if (nearLandmark(x)) continue;
    const land = landAt(x);
    const h = 300 + r() * 200;
    if (night && land < 2)
      near += `<rect x="${f1(x - 9)}" y="${f1(GROUND - h * 0.45)}" width="18" height="${f1(h * 0.45)}" fill="#0b1c2c"/>${pine(x, GROUND - h * 0.3, h * 0.8, p.near, p.nearLit)}`;
    else if (!night && land === 0 && r() < 0.6)
      near += `<g fill="#2f4a33"><rect x="${f1(x - 10)}" y="${f1(GROUND - h * 0.4)}" width="20" height="${f1(h * 0.4)}" rx="10"/><path d="M${f1(x - 10)} ${f1(GROUND - h * 0.22)}h-18v-${f1(h * 0.12)}M${f1(x + 10)} ${f1(GROUND - h * 0.16)}h18v-${f1(h * 0.1)}" stroke="#2f4a33" stroke-width="14" fill="none" stroke-linecap="round"/></g><rect x="${f1(x + 2)}" y="${f1(GROUND - h * 0.4 + 6)}" width="6" height="${f1(h * 0.4 - 10)}" rx="3" fill="#4a6b45"/>`;
    else near += mound(x, 40 + r() * 50, 24 + r() * 26, p.near, p.nearLit);
  }
  for (let land = 0; land < 4; land += 1) {
    const n = land < 2 ? 3 : 2;
    near += LANDMARKS[band][land](land * LW) + gateArch(gateX(land), band, land);
    for (let k = 0; k < n; k += 1) near += stopLamp(stopX(land, k, n) - 170, land, k, band);
  }
  near += encounterArt(band); // encounters: obstacles and characters on the trail
  for (const g of gems(band)) near += wordSlot(g.id) >= 0 ? wordGemMark(g, band) : gemMark(g, band);
  if (night)
    for (let i = 0; i < 70; i += 1)
      near += `<circle class="lexp-fly" cx="${(LAYERS.near.x0 + r() * (LAYERS.near.x1 - LAYERS.near.x0)).toFixed(0)}" cy="${(420 + r() * 340).toFixed(0)}" r="${f1(2 + r() * 2.5)}" fill="${p.fly}" style="animation-delay:${(-r() * 4).toFixed(2)}s"/>`;
  let front = "";
  for (let u = LAYERS.front.x0; u < LAYERS.front.x1; u += 300 + r() * 320) {
    const h = 50 + r() * 60;
    for (let k = 0; k < 3; k += 1)
      front += `<circle cx="${f1(u + (k - 1) * h * 0.9)}" cy="${H + 10}" r="${f1(h * (k === 1 ? 1.25 : 0.9))}" fill="${p.front}"/>`;
    front += night
      ? `<path d="M${f1(u - 26)} ${f1(H - h * 0.8)}q-10 -36 -44 -58q22 30 32 62ZM${f1(u - 6)} ${f1(H - h * 0.95)}q8 -50 -4 -88q-10 40 -8 90ZM${f1(u + 16)} ${f1(H - h * 0.85)}q22 -34 50 -46q-34 6 -60 44Z" fill="${p.front}"/>`
      : `<path d="M${f1(u + h * 0.6)} ${H}l${f1(h * 0.3)} -${f1(h * 1.6)} ${f1(h * 0.5)} ${f1(h * 0.6)} ${f1(h * 0.2)} ${f1(h)}Z" fill="${p.front}"/>`;
  }
  return { far, mid, near, front };
}

const cache = new Map();
/** The whole scene for a band (markup string; built once per band and reused). */
export function sceneMarkup(band) {
  if (!cache.has(band)) {
    const l = layers(band);
    const layer = (name) => {
      const L = LAYERS[name];
      return `<svg class="lexp-layer lexp-${name}" data-layer="${name}" viewBox="${L.x0} 0 ${L.x1 - L.x0} ${H}" preserveAspectRatio="xMinYMax meet" focusable="false">${l[name]}</svg>`;
    };
    const r = rng(3);
    const stars =
      band === "3-5"
        ? Array.from(
            { length: 60 },
            () =>
              `<i class="lexp-star" style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 60).toFixed(1)}%;animation-delay:${(-r() * 3).toFixed(2)}s"></i>`,
          ).join("")
        : "";
    cache.set(
      band,
      `<div class="lexp-stars">${stars}</div><div class="lexp-orb"></div>${layer("far")}<div class="lexp-fog"></div>${layer("mid")}${layer("near")}<svg class="lexp-hero" viewBox="0 0 100 150" focusable="false">${HERO[band]}${gearSVG(band)}</svg>${layer("front")}`,
    );
  }
  return cache.get(band);
}

/** Sets every layer to centre world point x (the CSS transition makes it a glide; reduced motion makes it a jump). */
export function aim(sceneEl, x) {
  sceneEl.querySelectorAll("[data-layer]").forEach((n) => {
    n.style.transform = `translateX(${camPct(n.dataset.layer, x).toFixed(3)}%)`;
  });
}
/** Lights finished stops and opened gates, hides gathered collectibles, and sets the explorer's glow (0..1). */
export function paint(sceneEl, { lit, open, glow, got = new Set() }) {
  sceneEl
    .querySelectorAll("[data-gem]")
    .forEach((n) => n.classList.toggle("is-got", got.has(n.dataset.gem)));
  sceneEl
    .querySelectorAll("[data-mark]")
    .forEach((n) => n.classList.toggle("is-lit", lit.has(n.dataset.mark)));
  sceneEl
    .querySelectorAll("[data-gate]")
    .forEach((n) => n.classList.toggle("is-open", open.has(Number(n.dataset.gate))));
  sceneEl.style.setProperty("--lexp-glow", String(glow));
}
