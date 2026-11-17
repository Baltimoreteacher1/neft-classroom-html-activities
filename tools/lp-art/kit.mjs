// The Language Page illustration kit: one art direction for every activity picture under
// access-practice-lab/pictures/. Scene scripts in tools/lp-art/scenes/ compose these primitives; the
// generator (tools/lp-art/build.mjs) writes the SVG files. Edit a scene or the kit, never the output SVG.
//
// Style: editorial picture-book. No black outlines; form comes from a lit side and a shade side of each
// fill, soft ground shadows, layered depth (far shapes paler and bluer), and one warm light source.
// Every primitive returns an SVG string. Coordinates are in the scene's own viewBox units.

/* ------------------------------------------------------------------ colour */

export const P = {
  navy: "#123a5c",
  navyDeep: "#0c2840",
  ink: "#1d2b3a",
  teal: "#0f766e",
  tealLight: "#3fa79a",
  gold: "#e2a72e",
  goldLight: "#f3cd6f",
  coral: "#c8553d",
  coralLight: "#e98a6c",
  ivory: "#fbf6ec",
  paper: "#f5efe3",
  sky: "#bfe0ee",
  skyTop: "#8ec5e0",
  skyLow: "#e4f1f2",
  cloud: "#ffffff",
  grass: "#7fb069",
  grassDark: "#5c9150",
  grassLight: "#a3c97f",
  leaf: "#4f8f5b",
  leafDark: "#356f45",
  leafLight: "#7db66f",
  bark: "#7a5236",
  barkDark: "#5a3b26",
  soil: "#8b5e3c",
  soilDark: "#6b452b",
  wood: "#b98457",
  woodDark: "#8f6140",
  woodLight: "#d4a676",
  stone: "#c9c3b8",
  stoneDark: "#a39d92",
  pavement: "#b9b6ae",
  road: "#5b6168",
  water: "#4c9fc4",
  waterDark: "#2f7ea6",
  waterLight: "#8fd0e6",
  brick: "#b5583f",
  wall: "#f1e4cf",
  floor: "#d9b98f",
  white: "#ffffff",
  red: "#d0473a",
  orange: "#ea8a2b",
  yellow: "#f2c335",
  green: "#4f9d5d",
  blue: "#3b7dc4",
  purple: "#7a5aa6",
  pink: "#e58fb0",
};

export const SKIN = ["#f6d3b3", "#e9b48a", "#c98e62", "#a86b45", "#7d4b2e", "#5a3420"];
export const HAIR = ["#2a1d17", "#4a2f20", "#7a4a2a", "#b5793f", "#d9b16a", "#e8e2d8", "#1b1b22"];
export const CLOTH = [
  "#d0473a",
  "#3b7dc4",
  "#e2a72e",
  "#0f766e",
  "#7a5aa6",
  "#ea8a2b",
  "#e58fb0",
  "#4f9d5d",
  "#123a5c",
];

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const hex = (c) => {
  const s = c.replace("#", "");
  const f = s.length === 3 ? s.replace(/./g, "$&$&") : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const toHex = (r, g, b) => `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;

/** Mix two colours; t=0 gives a, t=1 gives b. */
export function mix(a, b, t) {
  const A = hex(a);
  const B = hex(b);
  return toHex(...A.map((v, i) => v + (B[i] - v) * t));
}
/** Shade side of a colour: darker and slightly cooler (toward navy), the way shadow reads outdoors. */
export const shade = (c, t = 0.22) => mix(c, "#1c2f4a", t);
/** Lit side of a colour: lighter and slightly warmer. */
export const light = (c, t = 0.22) => mix(c, "#fff6e0", t);
/** Atmospheric depth: far things fade toward the sky colour. */
export const haze = (c, t = 0.4, sky = P.skyLow) => mix(c, sky, t);

/* ------------------------------------------------------------------ helpers */

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Deterministic random numbers so a scene redraws identically. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

let uid = 0;
export const id = (p = "g") => `${p}${++uid}`;
export const resetIds = () => {
  uid = 0;
};

export const g = (body, attrs = "") => `<g${attrs ? ` ${attrs}` : ""}>${body}</g>`;
export const tr = (x, y, body, s = 1) =>
  `<g transform="translate(${f(x)} ${f(y)})${s !== 1 ? ` scale(${f(s)})` : ""}">${body}</g>`;
export const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
export const rrect = (x, y, w, h, r, fill, extra = "") => rect(x, y, w, h, fill, `rx="${f(r)}"${extra ? ` ${extra}` : ""}`);
export const circle = (x, y, r, fill, extra = "") =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
export const ellipse = (x, y, rx, ry, fill, extra = "") =>
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
export const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
export const line = (x1, y1, x2, y2, stroke, w = 2, extra = "") =>
  `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${stroke}" stroke-width="${f(w)}" stroke-linecap="round" fill="none"${extra ? ` ${extra}` : ""}/>`;
export const stroke = (d, color, w = 2, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra ? ` ${extra}` : ""}/>`;
export const poly = (pts, fill, extra = "") =>
  `<polygon points="${pts.map((p) => p.map(f).join(",")).join(" ")}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;

/** Soft contact shadow under anything that stands on the ground. */
export const contact = (x, y, rx, ry = rx * 0.22, o = 0.22) =>
  ellipse(x, y, rx, ry, "#1c2f4a", `opacity="${o}"`);

/* ------------------------------------------------------------------ text */

export const FONT = "'Atkinson Hyperlegible', 'Helvetica Neue', Arial, sans-serif";

/** Plain readable text. */
export function text(x, y, str, { size = 14, fill = P.ink, weight = 700, anchor = "middle", extra = "" } = {}) {
  return `<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-size="${f(size)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${extra ? ` ${extra}` : ""}>${esc(str)}</text>`;
}

/** A printed label on a card (signs, captions, callouts). Width grows with the text. */
export function tag(x, y, str, { size = 13, fill = P.white, ink = P.ink, pad = 8, anchor = "middle", r = 6, edge = "#1c2f4a" } = {}) {
  const w = Math.max(size * 1.2, str.length * size * 0.56) + pad * 2;
  const h = size + pad * 1.3;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return g(
    rrect(x0, y - h / 2 + 1.5, w, h, r, edge, 'opacity=".14"') +
      rrect(x0, y - h / 2, w, h, r, fill) +
      text(x0 + w / 2, y + size * 0.35, str, { size, fill: ink }),
  );
}

/** Numbered badge for sequence panels. */
export function badge(x, y, n, { r = 13, fill = P.navy, ink = P.white } = {}) {
  return g(circle(x, y + 1.5, r, "#1c2f4a", 'opacity=".18"') + circle(x, y, r, fill) + text(x, y + r * 0.38, String(n), { size: r * 1.1, fill: ink }));
}

/* ------------------------------------------------------------------ document */

/**
 * The finished SVG file. `defs` collects gradients/filters a scene registered with def().
 * `grain` adds a very fine paper texture over the picture (printed-book feel).
 */
export function svg({ w, h, title, body, grain = true }) {
  const defs = takeDefs();
  const gid = "grain";
  const grainDef = grain
    ? `<filter id="${gid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .12  0 0 0 0 .16  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>`
    : "";
  const grainLayer = grain ? `<rect width="${w}" height="${h}" filter="url(#${gid})" opacity=".07"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>${esc(title)}</title><defs>${grainDef}${defs}</defs><g stroke-linejoin="round" stroke-linecap="round">${body}</g>${grainLayer}</svg>\n`;
}

let DEFS = [];
const takeDefs = () => {
  const d = DEFS.join("");
  DEFS = [];
  return d;
};
/** Register a <defs> entry and get its id. */
export function def(make, prefix = "d") {
  const i = id(prefix);
  DEFS.push(make(i));
  return i;
}
/** Vertical gradient fill; stops = [[offset, colour, opacity?], ...]. Returns `url(#id)`. */
export function vgrad(stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
  const i = def(
    (i) =>
      `<linearGradient id="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
        .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a !== 1 ? ` stop-opacity="${a}"` : ""}/>`)
        .join("")}</linearGradient>`,
    "lg",
  );
  return `url(#${i})`;
}
export function rgrad(stops, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
  const i = def(
    (i) =>
      `<radialGradient id="${i}" cx="${cx}" cy="${cy}" r="${r}">${stops
        .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a !== 1 ? ` stop-opacity="${a}"` : ""}/>`)
        .join("")}</radialGradient>`,
    "rg",
  );
  return `url(#${i})`;
}
/** Clip a body to a rounded rectangle (sequence panels). */
export function clipRect(x, y, w, h, r, body) {
  const i = def((i) => `<clipPath id="${i}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}"/></clipPath>`, "cp");
  return `<g clip-path="url(#${i})">${body}</g>`;
}

/* ------------------------------------------------------------------ sky & weather */

const SKIES = {
  day: [P.skyTop, P.sky, P.skyLow],
  morning: ["#9ccbe3", "#cfe6ee", "#fbe9cf"],
  dusk: ["#3d5a8a", "#c98a8a", "#f6c890"],
  night: ["#0c1d36", "#16305a", "#24456f"],
  overcast: ["#9aa8b4", "#b8c3cb", "#d3d9dc"],
  storm: ["#5f6d7b", "#7d8a96", "#a2adb5"],
  indoor: ["#f4ead8", "#f1e4cf", "#ecdcc2"],
};
export function sky(w, h, kind = "day") {
  const [a, b, c] = SKIES[kind] || SKIES.day;
  return rect(0, 0, w, h, vgrad([[0, a], [0.6, b], [1, c]]));
}

export function sun(x, y, r = 26) {
  return g(
    circle(x, y, r * 3.2, rgrad([[0, "#fff4c9", 0.75], [1, "#fff4c9", 0]])) +
      circle(x, y, r, vgrad([[0, "#ffe58a"], [1, P.gold]])) +
      circle(x - r * 0.3, y - r * 0.3, r * 0.45, "#fff6cf", 'opacity=".55"'),
  );
}
export function moon(x, y, r = 22) {
  return g(
    circle(x, y, r * 2.6, rgrad([[0, "#fdf3c8", 0.35], [1, "#fdf3c8", 0]])) +
      circle(x, y, r, "#f8edc4") +
      circle(x + r * 0.3, y - r * 0.2, r * 0.18, "#e6d8a6") +
      circle(x - r * 0.25, y + r * 0.3, r * 0.12, "#e6d8a6"),
  );
}
export function stars(w, h, n = 30, seed = 3) {
  const R = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = R() * w;
    const y = R() * h;
    const r = 0.8 + R() * 1.6;
    s += circle(x, y, r, "#fff7d6", `opacity="${f(0.5 + R() * 0.5)}"`);
  }
  return s;
}

/** A soft cumulus cloud; s scales it (1 ≈ 110 units wide). */
export function cloud(x, y, s = 1, { tone = P.cloud, dark = false } = {}) {
  const base = dark ? "#8995a1" : tone;
  const under = dark ? "#6f7c89" : "#dcebf2";
  const body =
    ellipse(0, 6, 54, 15, under) +
    circle(-26, 0, 20, base) +
    circle(2, -10, 28, base) +
    circle(30, 0, 19, base) +
    ellipse(0, 4, 54, 14, base) +
    ellipse(-6, -16, 14, 8, dark ? "#a3aeb8" : "#ffffff", 'opacity=".8"');
  return tr(x, y, body, s);
}

/** Slanted rain streaks over an area. */
export function rain(x, y, w, h, { n = 60, seed = 5, color = "#e8f3fa", o = 0.7 } = {}) {
  const R = rng(seed);
  let d = "";
  for (let i = 0; i < n; i++) {
    const px = x + R() * w;
    const py = y + R() * h;
    const len = 10 + R() * 8;
    d += `M${f(px)} ${f(py)}l${f(-len * 0.28)} ${f(len)}`;
  }
  return stroke(d, color, 1.8, `opacity="${o}"`);
}

/** A puddle with a sky reflection. */
export function puddle(x, y, rx, ry = rx * 0.22) {
  return g(ellipse(x, y, rx, ry, P.waterDark, 'opacity=".55"') + ellipse(x - rx * 0.12, y - ry * 0.15, rx * 0.75, ry * 0.55, P.waterLight, 'opacity=".55"'));
}

/* ------------------------------------------------------------------ land */

/** Rolling far hills across the width at horizon y. */
export function hills(w, y, { color = P.grass, far = 0.5, seed = 2, amp = 26 } = {}) {
  const R = rng(seed);
  const c1 = haze(color, far);
  const c2 = haze(color, far * 0.55);
  const wave = (yy, a, ph) => {
    let d = `M0 ${f(yy)}`;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x0 = (w / n) * i;
      const x1 = (w / n) * (i + 1);
      d += ` Q${f((x0 + x1) / 2)} ${f(yy - a * (0.5 + R()) * (i % 2 ? 0.6 : 1) + ph)} ${f(x1)} ${f(yy)}`;
    }
    return `${d} L${w} ${f(yy + 400)} L0 ${f(yy + 400)}Z`;
  };
  return path(wave(y - 6, amp, 0), c1) + path(wave(y + 4, amp * 0.7, 6), c2);
}

/** Ground plane from y to the bottom: grass, pavement, floor, soil, sand or snow. */
export function ground(w, y, h, kind = "grass", { seed = 4 } = {}) {
  const R = rng(seed);
  const C = {
    grass: [P.grassLight, P.grass, P.grassDark],
    pavement: ["#cfccc4", P.pavement, "#a19e96"],
    floor: ["#e6c9a0", P.floor, "#c7a274"],
    soil: ["#a2714b", P.soil, P.soilDark],
    sand: ["#f1dcae", "#e6c98f", "#d5b273"],
    snow: ["#ffffff", "#eef4f8", "#d8e4ec"],
    tile: ["#e9e4da", "#dcd6ca", "#c8c1b3"],
  }[kind] || [P.grassLight, P.grass, P.grassDark];
  let s = rect(0, y, w, h, vgrad([[0, C[0]], [0.35, C[1]], [1, C[2]]]));
  if (kind === "grass") {
    let d = "";
    for (let i = 0; i < Math.round(w / 9); i++) {
      const x = R() * w;
      const yy = y + 12 + R() * (h - 16);
      const k = 3 + (yy - y) / h * 5;
      d += `M${f(x)} ${f(yy)}l${f(-k * 0.35)} ${f(-k)}M${f(x)} ${f(yy)}l${f(k * 0.3)} ${f(-k * 1.1)}`;
    }
    s += stroke(d, P.grassDark, 1.4, 'opacity=".45"');
  }
  if (kind === "floor") {
    let d = "";
    for (let i = 1; i < 6; i++) d += `M0 ${f(y + (h / 6) * i * (0.5 + i * 0.1))}H${w}`;
    s += stroke(d, "#b88f63", 1.2, 'opacity=".35"');
  }
  if (kind === "tile") {
    let d = "";
    for (let x = 0; x <= w; x += 48) d += `M${x} ${y}V${y + h}`;
    for (let yy = y + 24; yy < y + h; yy += 32) d += `M0 ${yy}H${w}`;
    s += stroke(d, "#b9b1a2", 1, 'opacity=".5"');
  }
  return s;
}

/** A path/sidewalk receding toward a point. */
export function pathway(x0, y0, x1, y1, w0, w1, fill = "#e8d6b4") {
  const dx = (x1 - x0);
  return path(
    `M${f(x0 - w0 / 2)} ${f(y0)} C${f(x0 - w0 / 2 + dx * 0.3)} ${f(y0 - (y0 - y1) * 0.5)} ${f(x1 - w1 / 2)} ${f(y1 + 10)} ${f(x1 - w1 / 2)} ${f(y1)} L${f(x1 + w1 / 2)} ${f(y1)} C${f(x1 + w1 / 2)} ${f(y1 + 10)} ${f(x0 + w0 / 2 + dx * 0.3)} ${f(y0 - (y0 - y1) * 0.5)} ${f(x0 + w0 / 2)} ${f(y0)}Z`,
    fill,
  );
}

/** A street with lane dashes, from y, height h. */
export function road(w, y, h, { dashes = true, curb = true } = {}) {
  let s = rect(0, y, w, h, vgrad([[0, "#6a7078"], [1, P.road]]));
  if (curb) s += rect(0, y - 6, w, 6, "#d9d5cc") + rect(0, y + h, w, 6, "#d9d5cc");
  if (dashes) {
    let d = "";
    for (let x = 16; x < w; x += 64) d += `M${x} ${f(y + h / 2)}h30`;
    s += stroke(d, "#f3dd8a", 4);
  }
  return s;
}

/** Water body (pond/lake) with highlights. */
export function pond(x, y, rx, ry) {
  return g(
    ellipse(x, y + 3, rx + 6, ry + 4, shade(P.grass, 0.3), 'opacity=".5"') +
      ellipse(x, y, rx, ry, vgrad([[0, P.waterLight], [1, P.water]])) +
      stroke(`M${f(x - rx * 0.5)} ${f(y - ry * 0.2)}h${f(rx * 0.35)}M${f(x + rx * 0.1)} ${f(y + ry * 0.3)}h${f(rx * 0.4)}`, "#ffffff", 2.2, 'opacity=".7"'),
  );
}

/* ------------------------------------------------------------------ plants */

/**
 * A tree standing at (x, y = ground contact). s ≈ height/170.
 * kind: round | oak | pine | fruit | blossom | autumn | bare | palm | bush
 */
export function tree(x, y, s = 1, { kind = "round", seed = 1, fruit = P.red, tone } = {}) {
  const R = rng(seed);
  const leafBase =
    tone ||
    { round: P.leaf, oak: P.leaf, pine: "#2f6b4f", fruit: P.leaf, blossom: "#f2b6c8", autumn: "#e0893a", bush: P.leaf }[kind] ||
    P.leaf;
  let b = contact(0, 0, 46, 9, 0.2);
  if (kind === "bush") {
    b = contact(0, 0, 40, 8, 0.2);
    b += ellipse(-18, -22, 26, 22, shade(leafBase, 0.15)) + ellipse(16, -20, 28, 22, shade(leafBase, 0.1)) + ellipse(0, -34, 28, 24, leafBase) + ellipse(-6, -42, 14, 9, light(leafBase, 0.3), 'opacity=".8"');
    return tr(x, y, b, s);
  }
  if (kind === "pine") {
    b += rect(-6, -26, 12, 26, P.barkDark);
    const lv = [[-118, 34], [-88, 44], [-58, 54], [-28, 62]];
    for (const [ty, hw] of lv) {
      b += poly([[0, ty - 30], [hw, ty + 26], [-hw, ty + 26]], shade(leafBase, 0.12));
      b += poly([[0, ty - 30], [hw * 0.15, ty + 26], [-hw, ty + 26]], light(leafBase, 0.12));
    }
    return tr(x, y, b, s);
  }
  if (kind === "palm") {
    b += path("M-6 0 C-4 -50 4 -100 14 -150 L22 -148 C12 -100 6 -50 8 0Z", P.bark);
    const fr = (a) => {
      const r = (a * Math.PI) / 180;
      return path(`M18 -150 Q${f(18 + Math.cos(r) * 40)} ${f(-170 + Math.sin(r) * 30)} ${f(18 + Math.cos(r) * 80)} ${f(-150 + Math.sin(r) * 50 + 30)} Q${f(18 + Math.cos(r) * 40)} ${f(-155 + Math.sin(r) * 20)} 18 -150Z`, P.leaf);
    };
    for (const a of [200, 240, 290, 330, 10]) b += fr(a);
    return tr(x, y, b, s);
  }
  // trunk with branches
  b += path("M-9 0 C-7 -30 -8 -60 -4 -88 L4 -88 C8 -60 7 -30 10 0Z", P.bark) + path("M2 -88 C4 -60 6 -30 10 0 L4 0 C2 -30 1 -60 -1 -88Z", P.barkDark, 'opacity=".6"');
  b += stroke("M-2 -70 Q-18 -86 -30 -100M2 -78 Q18 -92 28 -108", P.bark, 6);
  if (kind === "bare") {
    b += stroke("M-30 -100 Q-38 -120 -34 -138M-30 -100 Q-50 -108 -60 -122M28 -108 Q40 -126 36 -146M28 -108 Q48 -112 58 -128M0 -88 Q2 -120 -4 -150M-4 -150 Q-14 -162 -20 -170M-4 -150 Q6 -164 12 -172", P.bark, 4);
    return tr(x, y, b, s);
  }
  const blobs = [[-40, -112, 34], [38, -116, 36], [0, -146, 42], [-18, -128, 34], [22, -96, 28], [-34, -88, 24], [0, -104, 34]];
  // shade layer then lit layer offset up-left
  for (const [bx, by, r] of blobs) b += circle(bx, by, r, shade(leafBase, 0.16));
  for (const [bx, by, r] of blobs) b += circle(bx - r * 0.18, by - r * 0.22, r * 0.78, leafBase);
  for (const [bx, by, r] of blobs.slice(0, 4)) b += ellipse(bx - r * 0.3, by - r * 0.42, r * 0.42, r * 0.26, light(leafBase, 0.22), `opacity=".55" transform="rotate(-20 ${f(bx - r * 0.3)} ${f(by - r * 0.42)})"`);
  if (kind === "fruit" || kind === "blossom") {
    for (let i = 0; i < (kind === "fruit" ? 9 : 22); i++) {
      const a = R() * Math.PI * 2;
      const rr = 18 + R() * 46;
      const fx = Math.cos(a) * rr;
      const fy = -122 + Math.sin(a) * rr * 0.7;
      b += kind === "fruit" ? circle(fx, fy, 5.5, fruit) + circle(fx - 1.6, fy - 1.8, 1.8, "#ffffff", 'opacity=".6"') : circle(fx, fy, 3.2, "#fff2f6", 'opacity=".95"');
    }
  }
  if (kind === "autumn") {
    for (let i = 0; i < 7; i++) b += ellipse(-50 + R() * 100, -4 + R() * 6, 4, 2, ["#e0893a", "#c8553d", "#e2a72e"][i % 3]);
  }
  return tr(x, y, b, s);
}

/** A flower on a stem; colour picks the petals. */
export function flower(x, y, s = 1, { color = P.coral, center = P.gold, kind = "daisy" } = {}) {
  let b = stroke("M0 0 Q2 -14 0 -28", P.leafDark, 2.4) + path("M0 -12 Q-10 -18 -12 -10 Q-6 -8 0 -12Z", P.leaf) + path("M0 -18 Q10 -24 12 -16 Q6 -14 0 -18Z", P.leaf);
  if (kind === "sunflower") {
    b = stroke("M0 0 Q2 -30 0 -60", P.leafDark, 3.4) + path("M0 -24 Q-18 -34 -22 -20 Q-10 -16 0 -24Z", P.leaf) + path("M0 -36 Q18 -46 22 -32 Q10 -28 0 -36Z", P.leaf);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b += ellipse(Math.cos(a) * 11, -66 + Math.sin(a) * 11, 7, 3.6, i % 2 ? P.yellow : P.goldLight, `transform="rotate(${f((a * 180) / Math.PI)} ${f(Math.cos(a) * 11)} ${f(-66 + Math.sin(a) * 11)})"`);
    }
    b += circle(0, -66, 8, "#7a4a22") + circle(-2, -68, 3, "#9a6a3a");
    return tr(x, y, b, s);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    b += circle(Math.cos(a) * 5.5, -30 + Math.sin(a) * 5.5, 4.6, color);
  }
  b += circle(0, -30, 3.4, center);
  return tr(x, y, b, s);
}

/** Tuft of grass for foregrounds. */
export function tuft(x, y, s = 1, color = P.grassDark) {
  return tr(x, y, stroke("M-8 0 Q-9 -10 -12 -16M-3 0 Q-2 -14 -4 -22M2 0 Q4 -12 8 -18M6 0 Q10 -8 14 -11", color, 2.2), s);
}

/** Garden bed / planter box with soil, seen slightly from above. */
export function planter(x, y, w, h = 26, { wood = P.wood } = {}) {
  return g(contact(x + w / 2, y + h, w * 0.55, 6) + rect(x, y, w, h, wood) + rect(x, y, w, 7, light(wood, 0.2)) + rect(x + 4, y - 4, w - 8, 8, P.soilDark) + rect(x, y + h - 6, w, 6, shade(wood, 0.2)));
}

/* ------------------------------------------------------------------ people */

/**
 * A person standing on (x, y). h = full height in units (child ≈ 90-110, adult ≈ 140-160).
 * o: { skin, hair, hairStyle: short|long|bun|puffs|curly|bald|braid|cap|hijab, top, bottom, skirt, shoes,
 *      pose: stand|walk|run|wave|point|reach|hold|sit|kick|cheer|read|think, facing: 1 (right) | -1 (left),
 *      age: child|adult|elder, glasses, beard, apron, coat, item (svg drawn at the hand), mouth: smile|open|o|flat,
 *      look: 'side' to draw the face toward facing }
 */
export function person(x, y, h = 100, o = {}) {
  const {
    skin = SKIN[2],
    hair = HAIR[0],
    hairStyle = "short",
    top = P.blue,
    bottom = P.navy,
    skirt = false,
    shoes = "#2b2f36",
    pose = "stand",
    facing = 1,
    age = "child",
    glasses = false,
    beard = false,
    apron = null,
    coat = null,
    mouth = "smile",
    item = "",
    itemHand = "front",
    sleeve = "long",
    scarf = null,
    backpack = null,
  } = o;
  // Proportions in a 100-unit tall figure, scaled at the end.
  const child = age === "child";
  const headR = child ? 13 : 10.2;
  const headY = -100 + headR;
  const neckY = headY + headR;
  const shoulderY = neckY + (child ? 3 : 4);
  const hipY = child ? -44 : -48;
  const torsoW = child ? 15 : 16.5;
  const limb = child ? 8.6 : 7.8;
  const legLen = -hipY;
  const armLen = child ? 30 : 34;
  const sitting = pose === "sit";
  const skinS = shade(skin, 0.18);
  const topS = shade(top, 0.2);
  const botS = shade(bottom, 0.2);

  const P2 = (a, len, x0, y0) => {
    const r = (a * Math.PI) / 180;
    return [x0 + Math.sin(r) * len, y0 + Math.cos(r) * len];
  };
  // limb angles: 0 = straight down, positive = forward (toward facing)
  const A = {
    stand: { la: [-8, 4], ra: [8, -4], ll: [-3, 0], rl: [3, 0] },
    walk: { la: [-24, 10], ra: [24, -10], ll: [-20, 6], rl: [18, -2] },
    run: { la: [-50, 80], ra: [55, 70], ll: [-38, 20], rl: [42, -30] },
    wave: { la: [-10, 4], ra: [150, 20], ll: [-3, 0], rl: [3, 0] },
    point: { la: [-8, 4], ra: [92, 0], ll: [-3, 0], rl: [3, 0] },
    reach: { la: [-8, 4], ra: [140, 10], ll: [-3, 0], rl: [3, 0] },
    hold: { la: [40, 70], ra: [44, 72], ll: [-3, 0], rl: [3, 0] },
    cheer: { la: [-150, -10], ra: [150, 10], ll: [-6, 0], rl: [6, 0] },
    kick: { la: [-40, 20], ra: [40, -10], ll: [-6, 0], rl: [62, -10] },
    read: { la: [36, 80], ra: [40, 84], ll: [-3, 0], rl: [3, 0] },
    think: { la: [-8, 4], ra: [30, 140], ll: [-3, 0], rl: [3, 0] },
    sit: { la: [30, 40], ra: [36, 44], ll: [90, -90], rl: [90, -86] },
    carry: { la: [20, 90], ra: [24, 92], ll: [-3, 0], rl: [3, 0] },
  }[pose] || { la: [-8, 4], ra: [8, -4], ll: [-3, 0], rl: [3, 0] };

  const limbPath = (x0, y0, [a1, a2], len) => {
    const [mx, my] = P2(a1, len / 2, x0, y0);
    const [ex, ey] = P2(a1 + a2, len / 2, mx, my);
    return { d: `M${f(x0)} ${f(y0)}L${f(mx)} ${f(my)}L${f(ex)} ${f(ey)}`, end: [ex, ey], mid: [mx, my] };
  };
  let back = "";
  let front = "";
  const sh = (side) => [side * torsoW * 0.62, shoulderY + 3];
  const hp = (side) => [side * torsoW * 0.4, hipY];

  // legs (sitting legs go forward)
  const legs = (side, ang, layer) => {
    const [hx, hy] = hp(side);
    const L = limbPath(hx, hy, ang, sitting ? legLen * 0.95 : legLen);
    const pants = skirt ? skin : bottom;
    let s = stroke(L.d, side < 0 ? shade(pants, 0.12) : pants, limb + 0.6);
    if (skirt) s = stroke(L.d, side < 0 ? skinS : skin, limb * 0.82);
    const [ex, ey] = L.end;
    s += ellipse(ex + 3.2, ey + 1, 6.6, 3.6, side < 0 ? shade(shoes, 0.1) : shoes) + ellipse(ex + 4.4, ey - 0.4, 3, 1.1, "#ffffff", 'opacity=".22"');
    return layer === "back" ? (back += s) : (front += s);
  };
  legs(-1, A.ll, "back");
  legs(1, A.rl, "front");

  // arms
  const arm = (side, ang, layer) => {
    const [sx, sy] = sh(side);
    const L = limbPath(sx, sy, ang, armLen);
    const sleeveColor = coat || top;
    let s;
    if (sleeve === "short") {
      const half = L.d.split("L");
      s = stroke(`${half[0]}L${half[1]}`, side < 0 ? shade(sleeveColor, 0.12) : sleeveColor, limb + 0.4);
      s = stroke(L.d, side < 0 ? skinS : skin, limb * 0.8) + s;
    } else s = stroke(L.d, side < 0 ? shade(sleeveColor, 0.12) : sleeveColor, limb + 0.4);
    const [ex, ey] = L.end;
    s += circle(ex, ey, limb * 0.62, side < 0 ? skinS : skin);
    if (item && ((itemHand === "front" && side > 0) || (itemHand === "back" && side < 0))) s += tr(ex, ey, item);
    return layer === "back" ? (back += s) : (front += s);
  };
  arm(-1, A.la, "back");

  // torso
  let torso = "";
  const tw = torsoW;
  if (skirt) {
    torso += path(`M${f(-tw * 0.7)} ${f(hipY - 6)} L${f(-tw * 1.05)} ${f(hipY + 18)} L${f(tw * 1.05)} ${f(hipY + 18)} L${f(tw * 0.7)} ${f(hipY - 6)}Z`, bottom);
    torso += path(`M0 ${f(hipY - 6)} L${f(tw * 1.05)} ${f(hipY + 18)} L${f(tw * 0.7)} ${f(hipY - 6)}Z`, botS, 'opacity=".6"');
  } else if (!sitting) {
    torso += rect(-tw * 0.62, hipY - 6, tw * 1.24, 10, bottom);
  } else {
    torso += rrect(-tw * 0.62, hipY - 8, tw * 1.24 + 6, 14, 5, bottom);
  }
  const bodyCol = coat || top;
  torso += path(
    `M${f(-tw * 0.62)} ${f(shoulderY + 1)} Q0 ${f(shoulderY - 4)} ${f(tw * 0.62)} ${f(shoulderY + 1)} L${f(tw * 0.68)} ${f(hipY - 2)} Q0 ${f(hipY + 2)} ${f(-tw * 0.68)} ${f(hipY - 2)}Z`,
    bodyCol,
  );
  torso += path(`M${f(tw * 0.1)} ${f(shoulderY)} Q${f(tw * 0.62)} ${f(shoulderY)} ${f(tw * 0.62)} ${f(shoulderY + 1)} L${f(tw * 0.68)} ${f(hipY - 2)} Q${f(tw * 0.3)} ${f(hipY)} ${f(tw * 0.2)} ${f(hipY)}Z`, shade(bodyCol, 0.16), 'opacity=".7"');
  torso += path(`M${f(-tw * 0.3)} ${f(shoulderY - 0.5)} Q0 ${f(shoulderY + 5)} ${f(tw * 0.3)} ${f(shoulderY - 0.5)}`, "none", `stroke="${light(bodyCol, 0.35)}" stroke-width="1.6"`);
  if (coat) torso += line(0, shoulderY + 2, 0, hipY - 1, shade(coat, 0.3), 1.4);
  if (apron) torso += path(`M${f(-tw * 0.5)} ${f(shoulderY + 10)} L${f(tw * 0.5)} ${f(shoulderY + 10)} L${f(tw * 0.62)} ${f(hipY + 12)} L${f(-tw * 0.62)} ${f(hipY + 12)}Z`, apron);
  if (scarf) torso += rrect(-tw * 0.55, shoulderY - 3, tw * 1.1, 6, 3, scarf);
  if (backpack) back += rrect(-tw * 0.62 - 9 * facing, shoulderY + 2, 12, 26, 4, backpack);

  // head
  let head = "";
  head += rect(-3, neckY - 3, 6, 6, skinS);
  const hx = 0;
  const hy = headY;
  const hr = headR;
  const hairBack = {
    long: path(`M${f(-hr * 1.05)} ${f(hy - 2)} Q${f(-hr * 1.25)} ${f(hy + hr * 1.6)} ${f(-hr * 0.6)} ${f(hy + hr * 1.9)} L${f(hr * 0.6)} ${f(hy + hr * 1.9)} Q${f(hr * 1.25)} ${f(hy + hr * 1.6)} ${f(hr * 1.05)} ${f(hy - 2)}Z`, hair),
    braid: path(`M${f(-hr * 0.3)} ${f(hy + hr * 0.6)} q${f(-hr * 0.9)} ${f(hr * 0.6)} ${f(-hr * 0.6)} ${f(hr * 1.9)}`, "none", `stroke="${hair}" stroke-width="${f(hr * 0.55)}"`),
    puffs: circle(-hr * 1.05, hy - hr * 0.55, hr * 0.55, hair) + circle(hr * 1.05, hy - hr * 0.55, hr * 0.55, hair),
    bun: circle(-facing * hr * 0.55, hy - hr * 1.05, hr * 0.5, hair),
    hijab: path(`M${f(-hr * 1.3)} ${f(hy)} Q${f(-hr * 1.4)} ${f(hy + hr * 2.1)} 0 ${f(hy + hr * 2.2)} Q${f(hr * 1.4)} ${f(hy + hr * 2.1)} ${f(hr * 1.3)} ${f(hy)} A${f(hr * 1.3)} ${f(hr * 1.3)} 0 0 0 ${f(-hr * 1.3)} ${f(hy)}Z`, hair),
  }[hairStyle] || "";
  head += hairBack;
  head += circle(hx, hy, hr, skin);
  head += path(`M${f(hx + hr * 0.1)} ${f(hy - hr)} A${f(hr)} ${f(hr)} 0 0 1 ${f(hx + hr * 0.1)} ${f(hy + hr)} A${f(hr * 0.75)} ${f(hr)} 0 0 0 ${f(hx + hr * 0.1)} ${f(hy - hr)}Z`, skinS, 'opacity=".45"');
  // ear
  head += circle(hx - facing * hr * 0.15, hy + 1, hr * 0.2, skinS);
  // hair cap
  const cap = {
    short: path(`M${f(-hr * 1.04)} ${f(hy + 1)} A${f(hr * 1.04)} ${f(hr * 1.1)} 0 0 1 ${f(hr * 1.04)} ${f(hy + 1)} Q${f(hr * 0.5)} ${f(hy - hr * 0.55)} ${f(-hr * 0.1)} ${f(hy - hr * 0.42)} Q${f(-hr * 0.7)} ${f(hy - hr * 0.3)} ${f(-hr * 1.04)} ${f(hy + 1)}Z`, hair),
    long: path(`M${f(-hr * 1.08)} ${f(hy + hr * 0.4)} A${f(hr * 1.08)} ${f(hr * 1.12)} 0 0 1 ${f(hr * 1.08)} ${f(hy + hr * 0.4)} Q${f(hr * 0.4)} ${f(hy - hr * 0.6)} ${f(-hr * 0.3)} ${f(hy - hr * 0.5)} Q${f(-hr * 0.8)} ${f(hy - hr * 0.2)} ${f(-hr * 1.08)} ${f(hy + hr * 0.4)}Z`, hair),
    curly: [[-0.7, -0.6], [-0.2, -0.95], [0.4, -0.85], [0.85, -0.45], [-0.95, -0.1], [0.98, 0.05]].map(([cx, cy]) => circle(hx + cx * hr, hy + cy * hr, hr * 0.42, hair)).join(""),
    puffs: path(`M${f(-hr)} ${f(hy)} A${f(hr)} ${f(hr * 1.05)} 0 0 1 ${f(hr)} ${f(hy)} Q0 ${f(hy - hr * 0.5)} ${f(-hr)} ${f(hy)}Z`, hair),
    bun: path(`M${f(-hr * 1.03)} ${f(hy)} A${f(hr * 1.03)} ${f(hr * 1.08)} 0 0 1 ${f(hr * 1.03)} ${f(hy)} Q0 ${f(hy - hr * 0.45)} ${f(-hr * 1.03)} ${f(hy)}Z`, hair),
    braid: path(`M${f(-hr * 1.04)} ${f(hy + 1)} A${f(hr * 1.04)} ${f(hr * 1.1)} 0 0 1 ${f(hr * 1.04)} ${f(hy + 1)} Q0 ${f(hy - hr * 0.5)} ${f(-hr * 1.04)} ${f(hy + 1)}Z`, hair),
    bald: path(`M${f(-hr * 1.02)} ${f(hy + hr * 0.1)} Q${f(-hr * 1.05)} ${f(hy - hr * 0.3)} ${f(-hr * 0.8)} ${f(hy - hr * 0.35)}`, "none", `stroke="${hair}" stroke-width="${f(hr * 0.3)}"`),
    cap: path(`M${f(-hr * 1.06)} ${f(hy - hr * 0.05)} A${f(hr * 1.06)} ${f(hr * 1.06)} 0 0 1 ${f(hr * 1.06)} ${f(hy - hr * 0.05)}Z`, hair) + rrect(facing > 0 ? hr * 0.2 : -hr * 1.75, hy - hr * 0.18, hr * 1.55, hr * 0.3, hr * 0.15, shade(hair, 0.2)),
    hijab: path(`M${f(-hr * 1.15)} ${f(hy + hr * 0.2)} A${f(hr * 1.15)} ${f(hr * 1.2)} 0 0 1 ${f(hr * 1.15)} ${f(hy + hr * 0.2)} Q${f(hr * 0.9)} ${f(hy - hr * 0.55)} 0 ${f(hy - hr * 0.62)} Q${f(-hr * 0.9)} ${f(hy - hr * 0.55)} ${f(-hr * 1.15)} ${f(hy + hr * 0.2)}Z`, hair),
  }[hairStyle] ?? "";
  head += cap;
  if (cap && hairStyle !== "bald" && hairStyle !== "hijab") head += path(`M${f(-hr * 0.55)} ${f(hy - hr * 0.62)} Q${f(-hr * 0.1)} ${f(hy - hr * 0.95)} ${f(hr * 0.35)} ${f(hy - hr * 0.78)}`, "none", `stroke="${light(hair, 0.45)}" stroke-width="${f(hr * 0.12)}" opacity=".55"`);
  // face (3/4 view toward facing)
  const fx = facing * hr * 0.28;
  const eyeY = hy + hr * 0.08;
  head += circle(fx - hr * 0.3, eyeY, hr * 0.1, P.ink) + circle(fx + hr * 0.32, eyeY, hr * 0.1, P.ink);
  head += ellipse(fx - hr * 0.42, eyeY + hr * 0.36, hr * 0.15, hr * 0.09, P.coralLight, 'opacity=".45"') + ellipse(fx + hr * 0.46, eyeY + hr * 0.36, hr * 0.15, hr * 0.09, P.coralLight, 'opacity=".45"');
  const my = hy + hr * 0.5;
  head += {
    smile: stroke(`M${f(fx - hr * 0.2)} ${f(my)} Q${f(fx + hr * 0.02)} ${f(my + hr * 0.2)} ${f(fx + hr * 0.24)} ${f(my)}`, shade(skin, 0.55), hr * 0.09),
    open: ellipse(fx + hr * 0.02, my + hr * 0.06, hr * 0.17, hr * 0.13, "#7a2f2a"),
    o: circle(fx + hr * 0.02, my + hr * 0.06, hr * 0.1, "#7a2f2a"),
    flat: line(fx - hr * 0.15, my + hr * 0.04, fx + hr * 0.2, my + hr * 0.04, shade(skin, 0.55), hr * 0.08),
  }[mouth] || "";
  if (glasses) head += stroke(`M${f(fx - hr * 0.52)} ${f(eyeY)}a${f(hr * 0.22)} ${f(hr * 0.22)} 0 1 0 ${f(hr * 0.44)} 0a${f(hr * 0.22)} ${f(hr * 0.22)} 0 1 0 ${f(-hr * 0.44)} 0M${f(fx + hr * 0.1)} ${f(eyeY)}a${f(hr * 0.22)} ${f(hr * 0.22)} 0 1 0 ${f(hr * 0.44)} 0a${f(hr * 0.22)} ${f(hr * 0.22)} 0 1 0 ${f(-hr * 0.44)} 0M${f(fx - hr * 0.08)} ${f(eyeY)}h${f(hr * 0.18)}`, P.ink, hr * 0.07);
  if (beard) head += path(`M${f(-hr * 0.85)} ${f(hy + hr * 0.2)} Q${f(-hr * 0.7)} ${f(hy + hr * 1.25)} ${f(fx)} ${f(hy + hr * 1.2)} Q${f(hr * 0.75)} ${f(hy + hr * 1.2)} ${f(hr * 0.85)} ${f(hy + hr * 0.2)} Q${f(fx)} ${f(hy + hr * 0.75)} ${f(-hr * 0.85)} ${f(hy + hr * 0.2)}Z`, beard === true ? hair : beard);

  let body = back + torso + head;
  arm(1, A.ra, "front");
  body += front;
  const s = h / 100;
  const flip = facing < 0 ? ` scale(-1 1)` : "";
  // The face is already drawn toward +x; mirror the whole figure for facing left.
  const content = facing < 0 ? body.replace(/x="/g, 'x="') : body;
  // Sitting figures are placed by the seat: (x, y) is where the hips rest.
  const lift = sitting ? -hipY : 0;
  const shadow = sitting ? "" : contact(x, y, h * 0.2, h * 0.04, 0.2);
  return `${shadow}<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})${flip} translate(0 ${f(lift)})">${content}</g>`;
}

/** Cheerful preset outfits so crowds look varied but coherent. */
export function kid(i, extra = {}) {
  const styles = ["short", "puffs", "long", "curly", "bun", "braid", "short", "hijab", "cap"];
  const skins = [SKIN[1], SKIN[3], SKIN[0], SKIN[4], SKIN[2], SKIN[5], SKIN[1], SKIN[3], SKIN[2]];
  const hairs = [HAIR[0], HAIR[1], HAIR[3], HAIR[0], HAIR[2], HAIR[1], HAIR[4], "#2f6b7a", P.coral];
  const tops = [P.coral, P.teal, P.gold, P.blue, P.purple, P.orange, P.green, "#e58fb0", P.navy];
  const bottoms = [P.navy, "#3e4a5c", "#5a6b8c", P.navy, "#4a3f5c", "#2f4858", "#3e4a5c", P.navy, "#4e5d6c"];
  const k = i % styles.length;
  return {
    hairStyle: styles[k],
    skin: skins[k],
    hair: hairs[k],
    top: tops[k],
    bottom: bottoms[k],
    skirt: k === 2 || k === 4,
    ...extra,
  };
}

/* ------------------------------------------------------------------ animals */

export function dog(x, y, s = 1, { color = "#a8703f", facing = 1, pose = "stand" } = {}) {
  const d = shade(color, 0.22);
  let b = contact(0, 0, 34, 6, 0.2);
  const run = pose === "run";
  b += stroke(run ? "M-24 -26 L-34 -8M-16 -26 L-22 -4M14 -26 L22 -6M22 -26 L34 -10" : "M-22 -24 L-22 0M-14 -24 L-14 0M14 -24 L14 0M22 -24 L22 0", d, 6.5);
  b += ellipse(0, -30, 30, 13, color);
  b += ellipse(0, -24, 24, 6, d, 'opacity=".35"');
  b += stroke("M-28 -34 Q-42 -46 -38 -56", color, 5);
  b += circle(30, -44, 12, color) + ellipse(41, -40, 8, 5.5, light(color, 0.15)) + circle(47, -42, 2.6, P.ink);
  b += path("M23 -54 Q18 -40 26 -36 Q30 -46 23 -54Z", d);
  b += circle(33, -47, 1.8, P.ink) + rect(20, -36, 14, 3.5, P.coral, 'rx="1.5"');
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

export function cat(x, y, s = 1, { color = "#e8954a", facing = 1 } = {}) {
  const d = shade(color, 0.22);
  let b = contact(0, 0, 24, 5, 0.2);
  b += path("M-18 0 Q-24 -30 -4 -34 Q12 -34 14 -12 L14 0Z", color);
  b += stroke("M-16 -4 Q-34 -6 -34 -24 Q-34 -36 -26 -38", color, 5);
  b += stroke("M-10 -26 Q-4 -22 4 -26M-12 -16 Q-4 -12 6 -16", d, 2.4, 'opacity=".7"');
  b += circle(8, -42, 12, color) + poly([[-1, -50], [2, -62], [8, -52]], color) + poly([[10, -52], [16, -62], [18, -48]], color);
  b += circle(5, -44, 1.8, P.ink) + circle(13, -44, 1.8, P.ink) + path("M8 -39 l2 2 l2 -2Z", P.coral);
  b += stroke("M14 -39 h10M14 -37 l9 3", d, 1, 'opacity=".7"');
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

export function bird(x, y, s = 1, { color = P.coral, facing = 1, flying = false } = {}) {
  if (flying) return tr(x, y, stroke("M-10 0 Q-5 -6 0 0 Q5 -6 10 0", P.ink, 2), s);
  let b = ellipse(0, 0, 9, 7, color) + circle(7, -5, 5, color) + poly([[11, -6], [16, -4], [11, -3]], P.gold) + circle(8.5, -6, 1.2, P.ink) + path("M-4 -2 Q-12 -10 -14 0Z", shade(color, 0.2)) + stroke("M-2 7 v4M2 7 v4", P.ink, 1.2);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

export function duck(x, y, s = 1, { facing = 1 } = {}) {
  const b = ellipse(0, 0, 14, 8, "#ffffff") + circle(10, -9, 6, "#ffffff") + poly([[15, -9], [21, -7.5], [15, -6]], P.orange) + circle(11.5, -10, 1.2, P.ink) + path("M-6 -3 Q0 -8 6 -2Z", "#e6e6e6");
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

/* ------------------------------------------------------------------ built world */

/** A building with windows; ground at y. o: {color, roof:'flat'|'gable', windows:[cols, rows], door, sign, awning} */
export function building(x, y, w, h, o = {}) {
  const { color = P.brick, roof = "flat", windows = [3, 3], door = true, sign = "", signFill = P.ivory, awning = null, trim = P.ivory, roofColor = P.navy } = o;
  let b = contact(x + w / 2, y, w * 0.56, 6, 0.18);
  b += rect(x, y - h, w, h, color);
  b += rect(x + w * 0.72, y - h, w * 0.28, h, shade(color, 0.12), 'opacity=".6"');
  if (roof === "gable") b += poly([[x - 8, y - h], [x + w / 2, y - h - w * 0.38], [x + w + 8, y - h]], roofColor) + poly([[x + w / 2, y - h - w * 0.38], [x + w + 8, y - h], [x + w / 2, y - h]], shade(roofColor, 0.2), 'opacity=".55"');
  else b += rect(x - 4, y - h - 8, w + 8, 10, shade(color, 0.3));
  const [cols, rows] = windows;
  const top = y - h + (sign ? 44 : 16);
  const bottom = y - (door ? 54 : 14);
  const ww = Math.min(26, (w - 16) / cols - 10);
  const wh = Math.min(30, (bottom - top) / Math.max(1, rows) - 10);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) * w) / cols - ww / 2;
      const wy = top + r * (wh + 10);
      if (wy + wh > bottom + 4) continue;
      b += rect(wx - 2, wy - 2, ww + 4, wh + 4, trim) + rect(wx, wy, ww, wh, vgrad([[0, "#cfe9f2"], [1, "#8fc0d6"]])) + path(`M${f(wx)} ${f(wy + wh)} L${f(wx + ww * 0.6)} ${f(wy)} L${f(wx + ww)} ${f(wy)} L${f(wx + ww * 0.4)} ${f(wy + wh)}Z`, "#ffffff", 'opacity=".35"');
    }
  if (door) b += rect(x + w / 2 - 14, y - 46, 28, 46, trim) + rect(x + w / 2 - 11, y - 43, 22, 43, P.navy) + circle(x + w / 2 + 6, y - 22, 1.8, P.goldLight);
  if (awning) {
    const n = Math.max(4, Math.round(w / 22));
    for (let i = 0; i < n; i++) b += rect(x - 4 + ((w + 8) / n) * i, y - 66, (w + 8) / n, 14, i % 2 ? P.white : awning);
    b += path(Array.from({ length: n }, (_, i) => `M${f(x - 4 + ((w + 8) / n) * i)} ${y - 52} a${f((w + 8) / n / 2)} 7 0 0 0 ${f((w + 8) / n)} 0`).join(""), "none", `stroke="${shade(awning, 0.2)}" stroke-width="0"`);
  }
  if (sign) b += tag(x + w / 2, y - h + 20, sign, { size: 13, fill: signFill });
  return b;
}

/** Simple house; ground at y. */
export function house(x, y, w = 110, h = 80, { color = P.wall, roof = P.coral, door = P.teal, window = true } = {}) {
  let b = contact(x + w / 2, y, w * 0.58, 6, 0.18);
  b += rect(x, y - h, w, h, color) + rect(x + w * 0.66, y - h, w * 0.34, h, shade(color, 0.1), 'opacity=".6"');
  b += poly([[x - 10, y - h + 2], [x + w / 2, y - h - w * 0.42], [x + w + 10, y - h + 2]], roof);
  b += poly([[x + w / 2, y - h - w * 0.42], [x + w + 10, y - h + 2], [x + w / 2, y - h + 2]], shade(roof, 0.2), 'opacity=".6"');
  b += rect(x + w * 0.58, y - 44, 24, 44, door) + circle(x + w * 0.58 + 18, y - 22, 1.8, P.goldLight);
  if (window) b += rect(x + w * 0.14, y - h * 0.72, 28, 26, P.ivory) + rect(x + w * 0.14 + 3, y - h * 0.72 + 3, 22, 20, vgrad([[0, "#cfe9f2"], [1, "#8fc0d6"]])) + line(x + w * 0.14 + 14, y - h * 0.72 + 3, x + w * 0.14 + 14, y - h * 0.72 + 23, P.ivory, 2);
  return b;
}

export function fence(x0, x1, y, h = 34, color = "#f4efe6") {
  let b = rect(x0, y - h * 0.72, x1 - x0, 5, shade(color, 0.12)) + rect(x0, y - h * 0.32, x1 - x0, 5, shade(color, 0.12));
  for (let x = x0; x <= x1; x += 16) b += path(`M${x} ${y} V${y - h + 6} l6 -6 l6 6 V${y}Z`, color) + rect(x + 8, y - h + 4, 4, h - 4, shade(color, 0.1), 'opacity=".5"');
  return b;
}

export function bench(x, y, w = 110, { color = P.wood } = {}) {
  return g(
    contact(x + w / 2, y, w * 0.5, 5, 0.2) +
      rect(x + 8, y - 22, 6, 22, P.ink) +
      rect(x + w - 14, y - 22, 6, 22, P.ink) +
      rrect(x, y - 26, w, 8, 3, color) +
      rrect(x, y - 46, w, 7, 3, color) +
      rrect(x, y - 36, w, 7, 3, shade(color, 0.08)) +
      rect(x + 10, y - 46, 4, 22, P.ink) +
      rect(x + w - 14, y - 46, 4, 22, P.ink),
  );
}

export function table(x, y, w, h = 44, { color = P.wood, cloth = null } = {}) {
  let b = contact(x + w / 2, y, w * 0.5, 5, 0.18);
  b += rect(x + 8, y - h, 7, h, shade(color, 0.25)) + rect(x + w - 15, y - h, 7, h, shade(color, 0.25));
  b += rrect(x, y - h - 8, w, 10, 3, color) + rect(x, y - h + 1, w, 3, shade(color, 0.2));
  if (cloth) b += path(`M${x - 2} ${y - h - 8} H${x + w + 2} L${x + w + 4} ${y - h + 12} H${x - 4}Z`, cloth);
  return b;
}

export function chair(x, y, { color = P.teal, facing = 1 } = {}) {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${facing} 1)">${contact(0, 0, 16, 4, 0.18)}${rect(-12, -24, 4, 24, P.ink)}${rect(8, -24, 4, 24, P.ink)}${rrect(-14, -28, 28, 6, 2, color)}${rrect(-14, -56, 6, 30, 2, color)}</g>`;
}

export function desk(x, y, w = 80, { color = P.woodLight } = {}) {
  return g(contact(x + w / 2, y, w * 0.5, 5, 0.18) + rect(x + 4, y - 40, 5, 40, "#5d6772") + rect(x + w - 9, y - 40, 5, 40, "#5d6772") + rrect(x, y - 46, w, 8, 2, color) + rect(x, y - 39, w, 2, shade(color, 0.25)));
}

/** Bookshelf with varied book spines. */
export function bookshelf(x, y, w = 110, h = 170, { seed = 9, color = P.woodDark } = {}) {
  const R = rng(seed);
  let b = contact(x + w / 2, y, w * 0.55, 5, 0.18) + rect(x, y - h, w, h, color) + rect(x + 6, y - h + 6, w - 12, h - 12, shade(color, 0.3));
  const shelves = Math.round(h / 44);
  const sh = (h - 12) / shelves;
  const cols = [P.coral, P.teal, P.gold, P.navy, P.blue, P.purple, P.green, "#e9e2d0", P.orange];
  for (let i = 0; i < shelves; i++) {
    const sy = y - h + 6 + sh * (i + 1);
    let bx = x + 8;
    while (bx < x + w - 14) {
      const bw = 6 + R() * 7;
      const bh = sh * (0.55 + R() * 0.35);
      if (R() < 0.12) {
        bx += bw;
        continue;
      }
      const c = cols[Math.floor(R() * cols.length)];
      b += rect(bx, sy - bh - 4, bw - 1, bh, c) + rect(bx + 1, sy - bh, bw - 3, 2, light(c, 0.4), 'opacity=".7"');
      bx += bw;
    }
    b += rect(x + 4, sy - 4, w - 8, 5, color);
  }
  return b;
}

/** Window in a wall, with view (sky colour) inside. */
export function wallWindow(x, y, w, h, { view = "day", frame = P.ivory, curtain = null } = {}) {
  const views = { day: [P.skyTop, P.skyLow], night: ["#0c1d36", "#24456f"], rain: ["#7d8a96", "#b8c3cb"], dusk: ["#3d5a8a", "#f6c890"] };
  const [a, c] = views[view] || views.day;
  let b = rect(x - 6, y - 6, w + 12, h + 12, frame) + rect(x, y, w, h, vgrad([[0, a], [1, c]]));
  b += line(x + w / 2, y, x + w / 2, y + h, frame, 5) + line(x, y + h / 2, x + w, y + h / 2, frame, 5);
  b += path(`M${x} ${y + h} L${x + w * 0.35} ${y} L${x + w * 0.5} ${y} L${x + w * 0.15} ${y + h}Z`, "#ffffff", 'opacity=".2"');
  b += rect(x - 10, y + h + 4, w + 20, 7, shade(frame, 0.1));
  if (curtain) b += path(`M${x - 12} ${y - 10} h22 q-6 ${h / 2} 4 ${h + 10} h-26Z`, curtain) + path(`M${x + w + 12} ${y - 10} h-22 q6 ${h / 2} -4 ${h + 10} h26Z`, curtain);
  return b;
}

/** Whiteboard / chalkboard with drawn marks. */
export function board(x, y, w, h, { kind = "white", marks = "" } = {}) {
  const face = kind === "chalk" ? "#2f5245" : "#fbfcfd";
  return g(rect(x - 6, y - 6, w + 12, h + 12, "#9aa3ad") + rect(x, y, w, h, face) + rect(x + 10, y + h + 4, w - 20, 5, "#7f8994") + marks);
}

/** Wall clock. */
export const clock = (x, y, r = 16) =>
  g(circle(x, y, r + 2.5, P.navy) + circle(x, y, r, "#ffffff") + line(x, y, x, y - r * 0.6, P.ink, 2.2) + line(x, y, x + r * 0.45, y + r * 0.1, P.ink, 2.2) + circle(x, y, 1.8, P.coral));

/** Market stall with striped awning and a front counter; returns {svg, counterY}. */
export function stall(x, y, w = 150, { awning = P.coral, sign = "", goods = "" } = {}) {
  let b = contact(x + w / 2, y, w * 0.55, 6, 0.2);
  b += rect(x + 6, y - 120, 6, 120, P.woodDark) + rect(x + w - 12, y - 120, 6, 120, P.woodDark);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const sx = x - 6 + ((w + 12) / n) * i;
    b += path(`M${f(sx)} ${y - 136} h${f((w + 12) / n)} v20 a${f((w + 12) / n / 2)} 8 0 0 1 ${f(-(w + 12) / n)} 0Z`, i % 2 ? "#fbf6ec" : awning);
  }
  b += rect(x - 6, y - 140, w + 12, 6, shade(awning, 0.2));
  b += rect(x, y - 52, w, 52, P.wood) + rect(x, y - 52, w, 6, light(P.wood, 0.2)) + rect(x + w * 0.7, y - 46, w * 0.3, 46, shade(P.wood, 0.12), 'opacity=".6"');
  b += goods;
  if (sign) b += tag(x + w / 2, y - 26, sign, { size: 12 });
  return b;
}

/** Playground swing set; ground at y. */
export function swings(x, y, w = 120, h = 110, { seats = 2 } = {}) {
  let b = contact(x + w / 2, y, w * 0.55, 6, 0.16);
  b += stroke(`M${x} ${y} L${x + 16} ${y - h} L${x + 32} ${y}M${x + w - 32} ${y} L${x + w - 16} ${y - h} L${x + w} ${y}`, P.teal, 6);
  b += line(x + 10, y - h, x + w - 10, y - h, shade(P.teal, 0.2), 7);
  for (let i = 0; i < seats; i++) {
    const sx = x + 40 + ((w - 80) / Math.max(1, seats - 1)) * i;
    b += line(sx - 8, y - h, sx - 8, y - 30, "#6b7480", 1.8) + line(sx + 8, y - h, sx + 8, y - 30, "#6b7480", 1.8) + rrect(sx - 12, y - 32, 24, 5, 2, P.coral);
  }
  return b;
}

/** Slide with ladder; ground at y, ladder at x. */
export function slide(x, y, h = 110, { color = P.gold } = {}) {
  let b = contact(x + 50, y, 70, 6, 0.16);
  b += stroke(`M${x} ${y} L${x + 6} ${y - h}M${x + 26} ${y} L${x + 30} ${y - h}`, "#6b7480", 4);
  for (let i = 1; i < 6; i++) b += line(x + 1 + i * 0.9, y - (h / 6) * i, x + 26 + i * 0.6, y - (h / 6) * i, "#6b7480", 3);
  b += rect(x + 2, y - h - 4, 32, 8, shade(color, 0.2));
  b += path(`M${x + 30} ${y - h} C${x + 70} ${y - h + 10} ${x + 80} ${y - 20} ${x + 120} ${y - 8} L${x + 120} ${y} C${x + 74} ${y - 10} ${x + 64} ${y - h + 22} ${x + 30} ${y - h + 14}Z`, color);
  return b;
}

/** Sequence panels: n equal frames across w×h with gutters; draw(i, x, y, w, h) returns each panel's art. */
export function panels(W, H, n, draw, { gutter = 14, pad = 14, r = 14, numbered = true, bg = P.ivory } = {}) {
  let s = rect(0, 0, W, H, bg);
  const pw = (W - pad * 2 - gutter * (n - 1)) / n;
  const ph = H - pad * 2;
  for (let i = 0; i < n; i++) {
    const px = pad + i * (pw + gutter);
    s += rrect(px, pad + 3, pw, ph, r, "#1c2f4a", 'opacity=".12"');
    s += clipRect(px, pad, pw, ph, r, draw(i, px, pad, pw, ph));
    s += rrect(px, pad, pw, ph, r, "none", `stroke="#1c2f4a" stroke-opacity=".18" stroke-width="1.5"`);
    if (numbered) s += badge(px + 22, pad + 22, i + 1);
  }
  return s;
}

/** Arrow (for cycles and diagrams). */
export function arrow(d, color = P.navy, w = 4) {
  const i = def((i) => `<marker id="${i}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${color}"/></marker>`, "ar");
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${i})"/>`;
}

/** Ball; color white draws a soccer ball, any other colour a plain play ball. */
export function ball(x, y, r = 8, color = P.white) {
  let b = contact(x, y + r, r, r * 0.25, 0.2) + circle(x, y, r, color);
  if (color === P.white) {
    const pent = (cx, cy, rr, rot = -90) =>
      poly(Array.from({ length: 5 }, (_, i) => {
        const a = ((rot + i * 72) * Math.PI) / 180;
        return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
      }), P.ink);
    b += pent(x, y, r * 0.36);
    for (let i = 0; i < 5; i++) {
      const a = ((-90 + i * 72) * Math.PI) / 180;
      b += line(x + Math.cos(a) * r * 0.36, y + Math.sin(a) * r * 0.36, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, P.ink, r * 0.09);
    }
    b += circle(x, y, r, "none", `stroke="${shade(P.white, 0.25)}" stroke-width="${f(r * 0.08)}"`);
  }
  b += path(`M${f(x - r * 0.1)} ${f(y - r)} A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y + r * 0.1)} A${f(r * 1.1)} ${f(r * 1.1)} 0 0 0 ${f(x - r * 0.1)} ${f(y - r)}Z`, "#1c2f4a", 'opacity=".12"');
  return g(b);
}

/** Open umbrella held above a hand point. */
export const umbrella = (x, y, r = 30, color = P.coral) =>
  g(stroke(`M${x} ${y} V${y - r * 1.15} m0 ${r * 1.15} q0 6 -6 6`, P.ink, 2.4) + path(`M${x - r} ${y - r * 1.05} Q${x - r} ${y - r * 2} ${x} ${y - r * 2} Q${x + r} ${y - r * 2} ${x + r} ${y - r * 1.05} q-${r / 4} -6 -${r / 2} 0 q-${r / 4} -6 -${r / 2} 0 q-${r / 4} -6 -${r / 2} 0 q-${r / 4} -6 -${r / 2} 0Z`, color) + path(`M${x} ${y - r * 2} Q${x + r * 0.2} ${y - r * 1.5} ${x} ${y - r * 1.05}`, shade(color, 0.25), "opacity=\".5\""));

/** Books, cups and small props sized for a hand (draw at 0,0). */
export const PROPS = {
  book: (c = P.coral) => rect(-9, -7, 18, 13, c, 'rx="1.5"') + rect(-1, -7, 2, 13, shade(c, 0.3)),
  cup: (c = P.gold) => path("M-5 -8 h10 l-1.5 12 h-7Z", c) + rect(-5, -8, 10, 2.5, light(c, 0.3)),
  bag: (c = P.teal) => rrect(-8, -4, 16, 15, 3, c) + stroke("M-4 -4 q4 -8 8 0", shade(c, 0.3), 1.8),
  can: (c = P.green) => rrect(-6, -12, 12, 16, 3, c) + rect(4, -9, 8, 3, c),
  sign: (str, c = P.ivory) => line(0, 0, 0, -26, P.woodDark, 2.5) + tag(0, -34, str, { size: 10, fill: c }),
  flag: (c = P.coral) => line(0, 4, 0, -30, P.ink, 2) + path("M0 -30 l18 6 l-18 6Z", c),
  pencil: () => `<g transform="rotate(-30)">${rect(-2.5, -14, 5, 22, P.yellow)}${poly([[-2.5, 8], [2.5, 8], [0, 13]], "#f0d6b0")}</g>`,
  paper: () => rect(-8, -10, 16, 20, "#ffffff", 'rx="1.5"') + stroke("M-5 -5h10M-5 -1h10M-5 3h7", "#9aa7b4", 1.2),
};
