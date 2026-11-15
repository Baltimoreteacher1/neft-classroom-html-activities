// Language Expeditions world: one long painted strip with four lands side by side (one per WIDA domain), drawn as
// four parallax layers (far ridges, middle silhouettes, the walking ground with each land's landmarks, a dark
// foreground), the explorer, and the camera that glides between stops. Seeded, so a reload paints the same world.
//
// Units: the world is 1000 units tall; land L spans x = L*4000 .. L*4000+4000. Each layer is an <svg> as tall as
// the scene and as wide as its own x-range, anchored at left:50% and slid with translateX(<percent of itself>), so
// the camera math never needs the scene's pixel size. A layer with depth k shows world point XREF + k*(x - XREF)
// at the centre: k < 1 moves slower (far), k > 1 faster (foreground). Decorative only (aria-hidden).
import { rng } from "./engine.js";

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

/** translateX percentage for one layer when the camera centres world point x. */
export const camPct = (name, x) => {
  const L = LAYERS[name];
  const u = XREF + L.k * (x - XREF);
  return -(((u - L.x0) / (L.x1 - L.x0)) * 100);
};

// ── palettes (lab navy/teal/amber/off-white, darker and lighter shades, neutral browns and greens) ─────
const PAL = {
  "3-5": {
    far: "#1d3d5c",
    mid: "#14304a",
    near: "#0f263b",
    front: "#081726",
    ground: "#163247",
    trail: "#2f5568",
    stone: "#6f7f8c",
    glow: "#f2c15b",
    fly: "#ffe9a0",
  },
  "6-8": {
    far: "#c97b57",
    mid: "#9a4f3a",
    near: "#6e3428",
    front: "#2e1610",
    ground: "#5a2f25",
    trail: "#8a5a48",
    stone: "#a0614a",
    glow: "#1fa6a2",
    fly: "#fff1dc",
  },
};

const pine = (x, base, h, c) => {
  let s = "";
  const w = h * 0.42;
  for (let k = 0; k < 3; k += 1) {
    const y = base - h * k * 0.28;
    const ww = w * (1 - k * 0.22);
    s += `<path d="M${x - ww} ${y}L${x} ${y - h * 0.5}L${x + ww} ${y}Z" fill="${c}"/>`;
  }
  return s;
};
const mesa = (x, h, w, c) =>
  `<path d="M${x - w} ${GROUND}L${x - w * 0.55} ${GROUND - h}H${x + w * 0.55}L${x + w} ${GROUND}Z" fill="${c}"/>`;
const ridge = (r, x0, x1, base, amp, step, c, flat) => {
  let d = `M${x0} ${H}`;
  for (let x = x0; x <= x1; x += step) {
    const y = base + Math.sin(x / 430) * amp + r() * 40;
    d += flat ? ` L${x} ${y} L${x + step * 0.7} ${y}` : ` L${x} ${y}`;
  }
  return `<path d="${d} L${x1} ${H}Z" fill="${c}"/>`;
};
const landAt = (x) => Math.max(0, Math.min(3, Math.floor(x / LW)));
const nearLandmark = (x) => {
  const land = landAt(x);
  const off = land * LW;
  return [...SLOTS[3], ...SLOTS[2], 300, 3700].some((s) => Math.abs(off + s - x) < 230);
};
const arch = (x, stone, land) =>
  `<path d="M${x - 100} ${GROUND}V600Q${x} 480 ${x + 100} 600V${GROUND}H${x + 70}V610Q${x} 530 ${x - 70} 610V${GROUND}Z" fill="${stone}"/><path class="lexp-gate" data-gate="${land}" d="M${x - 70} ${GROUND}V610Q${x} 530 ${x + 70} 610V${GROUND}Z"/>`;
const lamp = (x, land, k, band) =>
  `<g class="lexp-mark" data-mark="${land}-${k}"><rect x="${x - 3}" y="${GROUND - 120}" width="6" height="120" fill="#3a2a20"/><circle class="lexp-mark-glow" cx="${x}" cy="${GROUND - 128}" r="${band === "6-8" ? 10 : 14}"/></g>`;

// ── landmarks: one function per land, drawn at the land's slots ─────────────────────────────
const LANDMARKS = {
  "3-5": [
    (o) =>
      `<g transform="translate(${o + 1300} 0)"><rect x="-6" y="640" width="12" height="150" fill="#5a3f2b"/><path d="M-60 650h110l20 20 -20 20h-110z" fill="#8a5f3c"/><path d="M-44 664h70M-44 676h50" stroke="#f7f4ec" stroke-width="5" stroke-linecap="round"/></g>` +
      `<path d="M${o + 2080} 1000Q${o + 2140} 880 ${o + 2170} 790L${o + 2240} 790Q${o + 2260} 880 ${o + 2340} 1000Z" fill="#2b5c86"/><path d="M${o + 2060} 790Q${o + 2205} 680 ${o + 2350} 790L${o + 2330} 790Q${o + 2205} 720 ${o + 2080} 790Z" fill="#7d7a73"/><rect x="${o + 2060}" y="770" width="290" height="14" rx="6" fill="#9a968c"/>` +
      `<rect x="${o + 3080}" y="560" width="40" height="230" fill="#3b2a22"/><circle cx="${o + 3100}" cy="520" r="150" fill="#1d3d33"/><circle class="lexp-pulse" cx="${o + 3100}" cy="520" r="170" fill="#f2c15b" opacity=".18"/>`,
    (o) =>
      [1180, 1260, 1400]
        .map(
          (x, i) =>
            `<rect x="${o + x}" y="${560 + i * 40}" width="46" height="${230 - i * 40}" fill="#8d8a82"/><rect x="${o + x - 8}" y="${548 + i * 40}" width="62" height="16" fill="#a8a59c"/>`,
        )
        .join("") +
      `<rect x="${o + 2100}" y="560" width="220" height="230" fill="#5a3f2b"/><path d="M${o + 2100} 630h220M${o + 2100} 700h220" stroke="#3b2a1e" stroke-width="10"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${o + 2112 + i * 28}" y="${640 + (i % 3) * 4}" width="18" height="${50 - (i % 3) * 6}" fill="${["#c94f3b", "#1fa6a2", "#f2c15b"][i % 3]}"/>`).join("")}` +
      `<path d="M${o + 2950} ${GROUND}V560L${o + 3100} 470L${o + 3250} 560V${GROUND}Z" fill="#7d7a73"/><path d="M${o + 3040} ${GROUND}V640Q${o + 3100} 590 ${o + 3160} 640V${GROUND}Z" fill="#0b1a28"/><path d="M${o + 3180} 470l50 -40 20 60Z" fill="#7d7a73"/><g transform="translate(${o + 3100} 530)"><ellipse rx="20" ry="24" fill="#1fa6a2"/><circle cx="-7" cy="-6" r="6" fill="#f7f4ec"/><circle cx="7" cy="-6" r="6" fill="#f7f4ec"/><circle cx="-7" cy="-6" r="3" fill="#17324d"/><circle cx="7" cy="-6" r="3" fill="#17324d"/><path d="M-4 2l4 6 4 -6Z" fill="#f2c15b"/></g>`,
    (o) =>
      `<path d="M${o + 1200} ${GROUND}L${o + 1260} 420H${o + 1460}L${o + 1520} ${GROUND}Z" fill="#4c5f6d"/><path d="M${o + 1290} 560h70v12h-70Z" fill="#33434f"/><path d="M${o + 1300} 552q18 -16 36 0Z" fill="#8a5a2f"/><path d="M${o + 1420} 470Q${o + 1400} 620 ${o + 1430} ${GROUND}" stroke="#8fd0ea" stroke-width="22" fill="none" opacity=".8"/>` +
      `<path d="M${o + 2560} ${GROUND}L${o + 2620} 470H${o + 2700}L${o + 2760} ${GROUND}Z" fill="#4c5f6d"/><path d="M${o + 2760} ${GROUND}h120v-14h-120Z" fill="#5a3a24"/><path d="M${o + 2800} 776v-30M${o + 2840} 776v-24" stroke="#3f9b5f" stroke-width="6"/>`,
    (o) =>
      `<path d="M${o + 1000} ${GROUND + 6}H${o + 4000}V${H}H${o + 1000}Z" fill="#1f4a63"/><path d="M${o + 1380} ${GROUND}V650l70 -50 70 50V${GROUND}Z" fill="#cfc6b0"/><rect x="${o + 1430}" y="700" width="34" height="50" fill="#f2c15b" opacity=".85"/>` +
      `<path d="M${o + 2740} ${GROUND}L${o + 2770} 360H${o + 2850}L${o + 2880} ${GROUND}Z" fill="#f7f4ec"/><path d="M${o + 2756} 560h112M${o + 2748} 680h128" stroke="#c94f3b" stroke-width="40"/><rect x="${o + 2768}" y="320" width="84" height="40" fill="#f2c15b"/><path d="M${o + 2760} 320h100l-50 -40Z" fill="#c94f3b"/><path class="lexp-pulse" d="M${o + 2810} 340L${o + 2400} 260V420Z" fill="#f2c15b" opacity=".2"/>`,
  ],
  "6-8": [
    (o) =>
      `<path d="M${o + 1180} ${GROUND}L${o + 1250} 690L${o + 1320} ${GROUND}Z" fill="#e8d3a8"/><path d="M${o + 1250} 690L${o + 1262} ${GROUND}H${o + 1238}Z" fill="#c7ad7c"/><rect x="${o + 1380}" y="560" width="8" height="230" fill="#2a3a48"/><path d="M${o + 1384} 560l-30 60M${o + 1384} 560l30 60M${o + 1360} 620h48" stroke="#2a3a48" stroke-width="4"/><circle class="lexp-pulse" cx="${o + 1384}" cy="556" r="9" fill="#1fa6a2"/>` +
      `<path d="M${o + 2140} ${GROUND}L${o + 2152} 470H${o + 2192}L${o + 2204} ${GROUND}Z" fill="#7a3b30"/><path d="M${o + 2260} ${GROUND}Q${o + 2300} 700 ${o + 2340} ${GROUND}Z" fill="#1a0c08"/>` +
      `<path d="M${o + 2960} ${GROUND}L${o + 2990} 420L${o + 3040} 430L${o + 3060} ${GROUND}ZM${o + 3140} ${GROUND}L${o + 3160} 430L${o + 3210} 420L${o + 3240} ${GROUND}Z" fill="#6b3a2c"/><g transform="translate(${o + 3100} 690)"><rect x="-4" y="0" width="8" height="100" fill="#2a3a48"/><path d="M0 -50L44 26H-44Z" fill="#f2c15b" stroke="#2a3a48" stroke-width="4"/><path d="M0 -24v28M0 12v4" stroke="#2a3a48" stroke-width="6" stroke-linecap="round"/></g>`,
    (o) =>
      `<path d="M${o + 1120} ${GROUND}V520H${o + 1480}V${GROUND}Z" fill="#b8704a"/><path d="M${o + 1100} 520L${o + 1300} 440L${o + 1500} 520Z" fill="#9a5a3a"/>${[0, 1, 2, 3].map((i) => `<rect x="${o + 1150 + i * 85}" y="560" width="28" height="${GROUND - 560}" fill="#d9a07a"/>`).join("")}<path d="M${o + 1270} ${GROUND}V660Q${o + 1300} 630 ${o + 1330} 660V${GROUND}Z" fill="#2a140c"/>` +
      `<rect x="${o + 2110}" y="590" width="200" height="200" fill="#6e4a2e"/>${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${o + 2124 + c * 62}" y="${604 + r * 60}" width="50" height="46" fill="#8a5f3c"/><rect x="${o + 2140 + c * 62}" y="${622 + r * 60}" width="18" height="6" fill="#f2c15b"/>`).join("")).join("")}` +
      `<path d="M${o + 2940} ${GROUND}V500H${o + 3260}V${GROUND}Z" fill="#a0614a"/>${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => `<path d="M${o + 2980 + c * 72} ${540 + r * 60}h30v20h-30zM${o + 2990 + c * 72} ${545 + r * 60}l10 10" stroke="#5a2f25" stroke-width="5" fill="none"/>`).join("")).join("")}`,
    (o) =>
      `<path d="M${o + 1200} ${GROUND}Q${o + 1300} 540 ${o + 1500} 520Q${o + 1700} 540 ${o + 1800} ${GROUND}Z" fill="#8a4a36"/><path d="M${o + 1420} ${GROUND}Q${o + 1500} 650 ${o + 1580} ${GROUND}Z" fill="#1a0c08"/><path class="lexp-wind" d="M${o + 1250} 620q60 -20 120 0t120 0" stroke="#f7f4ec" stroke-width="6" fill="none" opacity=".5"/>` +
      `<path d="M${o + 2560} ${GROUND}L${o + 2600} 460Q${o + 2800} 400 ${o + 3000} 470L${o + 3040} ${GROUND}Z" fill="#8a4a36"/><path d="M${o + 2700} ${GROUND}Q${o + 2700} 600 ${o + 2800} 580Q${o + 2900} 600 ${o + 2900} ${GROUND}Z" fill="#2a140c"/><path class="lexp-wind" d="M${o + 2600} 520q60 -20 120 0t120 0" stroke="#f7f4ec" stroke-width="6" fill="none" opacity=".5"/>`,
    (o) =>
      `<path d="M${o + 1400} ${GROUND}l40 -90 40 30 40 -60 40 120Z" fill="#7a5a48"/>` +
      `<path d="M${o + 2500} ${GROUND}L${o + 2700} 560L${o + 3000} ${GROUND}Z" fill="#6e3428"/><rect x="${o + 2690}" y="500" width="160" height="90" fill="#f7f4ec"/><rect x="${o + 2710}" y="520" width="30" height="30" fill="#1fa6a2"/><path d="M${o + 2880} 480a70 70 0 0 1 90 -80" stroke="#f7f4ec" stroke-width="16" fill="none"/><path d="M${o + 2920} 440l-40 60" stroke="#2a3a48" stroke-width="8"/><circle class="lexp-pulse" cx="${o + 2925}" cy="430" r="14" fill="#1fa6a2"/>`,
  ],
};

function layers(band) {
  const p = PAL[band];
  const r = rng(band === "6-8" ? 11 : 7);
  const night = band === "3-5";
  // far (k .3) and mid (k .6) live in their own u-space; landAt(x) picks each land's silhouette style.
  const xOf = (u, k) => XREF + (u - XREF) / k;
  let far = ridge(r, LAYERS.far.x0, LAYERS.far.x1, 560, 70, night ? 200 : 240, p.far, !night);
  let mid = "";
  for (let u = LAYERS.mid.x0; u < LAYERS.mid.x1; u += 90 + r() * 120) {
    const land = landAt(xOf(u, 0.6));
    if (night && land < 2) mid += pine(u, 770, 200 + r() * 170, p.mid);
    else if (night && land === 2) mid += mesa(u, 200 + r() * 200, 40 + r() * 30, "#20384c");
    else if (night)
      mid += `<ellipse cx="${u}" cy="${GROUND}" rx="${80 + r() * 60}" ry="${40 + r() * 30}" fill="${p.mid}"/>`;
    else mid += mesa(u, 160 + r() * (land === 3 ? 320 : 240), 30 + r() * 40, p.mid);
  }
  for (let u = LAYERS.far.x0 + 400; u < LAYERS.far.x1; u += 900 + r() * 500)
    far += night
      ? pine(u, 600 + r() * 30, 110, "#1a3652")
      : mesa(u, 120 + r() * 80, 120, "#b86a4a");
  let near = `<path d="M${LAYERS.near.x0} ${GROUND - 10}Q2000 ${GROUND - 30} 4000 ${GROUND - 5}T8000 ${GROUND - 10}T12000 ${GROUND - 5}T${LAYERS.near.x1} ${GROUND - 10}V${H}H${LAYERS.near.x0}Z" fill="${p.ground}"/><path d="M${LAYERS.near.x0} ${GROUND + 10}H${LAYERS.near.x1}V${GROUND + 38}H${LAYERS.near.x0}Z" fill="${p.trail}" opacity=".7"/>`;
  for (let x = LAYERS.near.x0; x < LAYERS.near.x1; x += 160 + r() * 200) {
    if (nearLandmark(x)) continue;
    const land = landAt(x);
    const h = 300 + r() * 200;
    if (night && land < 2)
      near += `<rect x="${x - 9}" y="${GROUND - h * 0.45}" width="18" height="${h * 0.45}" fill="#0b1c2c"/>${pine(x, GROUND - h * 0.3, h * 0.8, p.near)}`;
    else if (!night && land === 0 && r() < 0.6)
      near += `<g fill="#2f4a33"><rect x="${x - 10}" y="${GROUND - h * 0.4}" width="20" height="${h * 0.4}" rx="10"/><path d="M${x - 10} ${GROUND - h * 0.22}h-18v-${h * 0.12}M${x + 10} ${GROUND - h * 0.16}h18v-${h * 0.1}" stroke="#2f4a33" stroke-width="14" fill="none" stroke-linecap="round"/></g>`;
    else
      near += `<ellipse cx="${x}" cy="${GROUND - 5}" rx="${40 + r() * 50}" ry="${24 + r() * 26}" fill="${p.near}"/>`;
  }
  for (let land = 0; land < 4; land += 1) {
    const n = land < 2 ? 3 : 2;
    near += LANDMARKS[band][land](land * LW) + arch(gateX(land), p.stone, land);
    for (let k = 0; k < n; k += 1) near += lamp(stopX(land, k, n) - 170, land, k, band);
  }
  if (night)
    for (let i = 0; i < 70; i += 1)
      near += `<circle class="lexp-fly" cx="${LAYERS.near.x0 + r() * (LAYERS.near.x1 - LAYERS.near.x0)}" cy="${420 + r() * 340}" r="${2 + r() * 2.5}" fill="${p.fly}" style="animation-delay:${(-r() * 4).toFixed(2)}s"/>`;
  let front = "";
  for (let u = LAYERS.front.x0; u < LAYERS.front.x1; u += 300 + r() * 320) {
    const h = 50 + r() * 60;
    for (let k = 0; k < 3; k += 1)
      front += `<circle cx="${u + (k - 1) * h * 0.9}" cy="${H + 10}" r="${h * (k === 1 ? 1.25 : 0.9)}" fill="${p.front}"/>`;
  }
  return { far, mid, near, front };
}

const HERO = {
  "3-5": `<circle class="lexp-halo" cx="78" cy="94" r="30" fill="#f2c15b" opacity=".35"/><rect class="lexp-leg-l" x="36" y="104" width="11" height="34" rx="5" fill="#4d7a99"/><rect class="lexp-leg-r" x="52" y="104" width="11" height="34" rx="5" fill="#4d7a99"/><rect x="30" y="60" width="40" height="50" rx="14" fill="#e9eef2"/><rect x="28" y="62" width="44" height="34" rx="12" fill="#c94f3b"/><circle cx="50" cy="40" r="22" fill="#2a1a12"/><circle cx="58" cy="44" r="12" fill="#c98b5a"/><path d="M68 70Q80 76 78 82" stroke="#e9eef2" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="71" y="86" width="14" height="18" rx="4" fill="#f2c15b"/>`,
  "6-8": `<circle class="lexp-halo" cx="80" cy="54" r="26" fill="#1fa6a2" opacity=".35"/><rect class="lexp-leg-l" x="37" y="100" width="11" height="44" rx="5" fill="#2a3a48"/><rect class="lexp-leg-r" x="53" y="100" width="11" height="44" rx="5" fill="#2a3a48"/><rect x="24" y="52" width="26" height="40" rx="8" fill="#c98b3a"/><rect x="32" y="48" width="38" height="58" rx="12" fill="#126e6c"/><circle cx="52" cy="32" r="17" fill="#3a2418"/><circle cx="58" cy="36" r="9" fill="#c98b5a"/><path d="M34 26Q52 8 70 26L76 28L34 30Z" fill="#c94f3b"/><path d="M68 64Q78 64 80 58" stroke="#126e6c" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="76" y="46" width="9" height="16" rx="2" fill="#2a3a48"/><rect x="79" y="36" width="2" height="10" fill="#2a3a48"/>`,
};

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
      `<div class="lexp-stars">${stars}</div><div class="lexp-orb"></div>${layer("far")}<div class="lexp-fog"></div>${layer("mid")}${layer("near")}<svg class="lexp-hero" viewBox="0 0 100 150" focusable="false">${HERO[band]}</svg>${layer("front")}`,
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
/** Lights finished stops and opened gates, and sets the explorer's glow (0..1). */
export function paint(sceneEl, { lit, open, glow }) {
  sceneEl
    .querySelectorAll("[data-mark]")
    .forEach((n) => n.classList.toggle("is-lit", lit.has(n.dataset.mark)));
  sceneEl
    .querySelectorAll("[data-gate]")
    .forEach((n) => n.classList.toggle("is-open", open.has(Number(n.dataset.gate))));
  sceneEl.style.setProperty("--lexp-glow", String(glow));
}
