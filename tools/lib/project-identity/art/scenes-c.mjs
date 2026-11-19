import { alpha, darken, lighten, mix } from "../color.mjs";

/* Group C: unit-8-a, unit-8-b, unit-8-c, unit-9-a, unit-9-b, unit-10-a, unit-10-b, unit-10-c */

const n = (v) => +v.toFixed(1);
const pts = (a) => a.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
const poly = (a, attr) => `<polygon points="${pts(a)}" ${attr}/>`;
const dpath = (a, close = true) =>
  `M${a.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}${close ? "Z" : ""}`;
const polar = (cx, cy, r, deg) => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** Radial tick marks as a single path. */
function tickRing(cx, cy, r1, r2, count, start = -90) {
  let d = "";
  for (let i = 0; i < count; i++) {
    const a = start + (i * 360) / count;
    const [x1, y1] = polar(cx, cy, r1, a);
    const [x2, y2] = polar(cx, cy, r2, a);
    d += `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
  }
  return d;
}

/** A gear outline as a polygon path with a given number of teeth. */
function gearPath(cx, cy, rIn, rOut, teeth, rot = 0) {
  const step = 360 / teeth;
  const a = [];
  for (let i = 0; i < teeth; i++) {
    const s = rot + i * step;
    a.push(
      polar(cx, cy, rIn, s),
      polar(cx, cy, rOut, s + step * 0.18),
      polar(cx, cy, rOut, s + step * 0.5),
      polar(cx, cy, rIn, s + step * 0.68),
    );
  }
  return dpath(a);
}

/* ------------------------------------------------------------------ unit-8-a */

/** An antique vault door in engraved brass: combination dials, a keyhole, and a balance of lock tumblers. */
function vaultDoor(p) {
  const brass = p.glow;
  const hi = lighten(brass, 0.55);
  const lo = darken(brass, 0.5);
  const cx = 800;
  const cy = 306;
  const R = 204;
  const dark = mix(p.ink, "#000000", 0.35);

  const bricks = (() => {
    let d = "";
    for (let r = 0, y = 0; y < 548; r++, y += 46) {
      d += `M0 ${y}H1200`;
      for (let x = r % 2 ? 46 : 0; x < 1200; x += 92) d += `M${x} ${y}v46`;
    }
    return `<path d="${d}" stroke="${alpha(brass, 0.07)}" stroke-width="2" fill="none"/>`;
  })();

  const dial = (x, y, r, count) => `
    <circle cx="${x}" cy="${y + 3}" r="${r + 3}" fill="${alpha("#000000", 0.35)}"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#vb)" stroke="${lo}" stroke-width="2"/>
    <path d="${tickRing(x, y, r * 0.8, r * 0.94, count)}" stroke="${lo}" stroke-width="1.6" fill="none"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="${dark}" stroke="${alpha(hi, 0.5)}" stroke-width="1.5"/>
    <path d="M${x} ${y - r * 0.55}L${x} ${y - r * 0.2}" stroke="${hi}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.14}" fill="${hi}"/>`;

  const rivets = Array.from({ length: 24 }, (_, i) => {
    const [x, y] = polar(cx, cy, R - 12, i * 15);
    return `<circle cx="${n(x)}" cy="${n(y)}" r="5.5" fill="url(#vb)" stroke="${lo}" stroke-width="1"/><circle cx="${n(x - 1.6)}" cy="${n(y - 1.6)}" r="1.8" fill="${hi}"/>`;
  }).join("");

  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = i * 60;
    const [x2, y2] = polar(cx, cy, 138, a);
    return `<path d="M${cx} ${cy}L${n(x2)} ${n(y2)}" stroke="${alpha("#000000", 0.4)}" stroke-width="20" stroke-linecap="round" transform="translate(0 4)"/>
      <path d="M${cx} ${cy}L${n(x2)} ${n(y2)}" stroke="url(#vb)" stroke-width="17" stroke-linecap="round"/>
      <path d="M${cx} ${cy}L${n(x2)} ${n(y2)}" stroke="${alpha(hi, 0.7)}" stroke-width="3" stroke-linecap="round" transform="translate(-3 -3)"/>
      <circle cx="${n(x2)}" cy="${n(y2)}" r="13" fill="url(#vb)" stroke="${lo}" stroke-width="2"/>`;
  }).join("");

  const cyl = (
    x,
    base,
    w,
    h,
  ) => `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="url(#vb)" stroke="${lo}" stroke-width="1.5"/>
    <ellipse cx="${x + w / 2}" cy="${base - h}" rx="${w / 2}" ry="3.5" fill="${hi}" stroke="${lo}" stroke-width="1.2"/>
    <path d="M${x + 3} ${base - h + 4}V${base - 3}" stroke="${alpha("#ffffff", 0.45)}" stroke-width="2"/>`;
  const bx = 1104;
  const pan = (x, items) => `
    <path d="M${x} 330L${x - 25} 392M${x} 330L${x + 25} 392" stroke="${alpha(brass, 0.8)}" stroke-width="1.8"/>
    ${items}
    <path d="M${x - 28} 392Q${x} 422 ${x + 28} 392Z" fill="url(#vb)" stroke="${lo}" stroke-width="2"/>`;

  return `
    <defs>
      <linearGradient id="vb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".45" stop-color="${brass}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
      <radialGradient id="vd" cx=".35" cy=".28" r=".95"><stop offset="0" stop-color="${mix(p.deep, brass, 0.25)}"/><stop offset="1" stop-color="${mix(p.ink, p.deep, 0.3)}"/></radialGradient>
      <radialGradient id="vg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${alpha(brass, 0.3)}"/><stop offset="1" stop-color="${alpha(brass, 0)}"/></radialGradient>
    </defs>
    ${bricks}
    <rect y="548" width="1200" height="52" fill="${alpha("#000000", 0.35)}"/><rect y="548" width="1200" height="3" fill="${alpha(brass, 0.3)}"/>
    <g fill="none" stroke="${alpha(brass, 0.1)}" stroke-width="2"><circle cx="250" cy="300" r="90"/><circle cx="250" cy="300" r="140"/><circle cx="250" cy="300" r="190" stroke-dasharray="2 10"/><circle cx="250" cy="300" r="240"/>
      <path d="${tickRing(250, 300, 150, 166, 48)}"/></g>
    <circle cx="${cx}" cy="${cy}" r="${R + 110}" fill="url(#vg)"/>
    <ellipse cx="${cx}" cy="${cy + R + 36}" rx="${R * 0.9}" ry="14" fill="${alpha("#000000", 0.3)}"/>
    ${[-100, 100].map((d) => `<rect x="${cx - R - 40}" y="${cy + d - 28}" width="24" height="56" rx="5" fill="url(#vb)" stroke="${lo}" stroke-width="2"/><rect x="${cx - R - 36}" y="${cy + d - 24}" width="5" height="48" rx="2" fill="${alpha("#ffffff", 0.35)}"/>`).join("")}
    <circle cx="${cx}" cy="${cy + 5}" r="${R + 24}" fill="${alpha("#000000", 0.35)}"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 22}" fill="url(#vb)" stroke="${lo}" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 10}" fill="none" stroke="${alpha(lo, 0.7)}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#vd)" stroke="${lo}" stroke-width="4"/>
    <g fill="none" stroke="${alpha(hi, 0.55)}" stroke-width="1.6"><circle cx="${cx}" cy="${cy}" r="${R - 28}"/><circle cx="${cx}" cy="${cy}" r="${R - 34}" stroke-dasharray="3 5" stroke="${alpha(brass, 0.45)}"/><circle cx="${cx}" cy="${cy}" r="112"/><circle cx="${cx}" cy="${cy}" r="118" stroke-dasharray="2 6" stroke="${alpha(brass, 0.4)}"/>
      <path d="${tickRing(cx, cy, R - 24, R - 10, 24, -82.5)}" stroke="${alpha(brass, 0.5)}"/></g>
    ${rivets}
    ${spokes}
    ${[270, 330, 210]
      .map((a) => {
        const [x, y] = polar(cx, cy, 158, a);
        return dial(n(x), n(y), 21, 24);
      })
      .join("")}
    <circle cx="${cx}" cy="${cy + 6}" r="98" fill="${alpha("#000000", 0.4)}"/>
    <circle cx="${cx}" cy="${cy}" r="94" fill="url(#vb)" stroke="${lo}" stroke-width="3"/>
    <path d="${tickRing(cx, cy, 82, 90, 60)}" stroke="${lo}" stroke-width="1.6" fill="none"/>
    <path d="${tickRing(cx, cy, 74, 90, 12)}" stroke="${lo}" stroke-width="3.4" fill="none"/>
    <circle cx="${cx}" cy="${cy}" r="68" fill="${dark}" stroke="${alpha(hi, 0.6)}" stroke-width="2"/>
    <path d="${tickRing(cx, cy, 30, 64, 36)}" stroke="${alpha(brass, 0.22)}" stroke-width="1.4" fill="none"/>
    <circle cx="${cx}" cy="${cy}" r="30" fill="url(#vb)" stroke="${lo}" stroke-width="2"/>
    <path d="${gearPath(cx, cy, 12, 17, 8)}" fill="${lo}" opacity=".55"/>
    <circle cx="${cx - 8}" cy="${cy - 9}" r="5" fill="${alpha("#ffffff", 0.55)}"/>
    <path d="M${cx - 10} ${cy - 112}L${cx + 10} ${cy - 112}L${cx} ${cy - 94}Z" fill="${lighten(p.accentB, 0.35)}" stroke="${dark}" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy + 160}" r="28" fill="url(#vb)" stroke="${lo}" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy + 160}" r="21" fill="none" stroke="${alpha(lo, 0.7)}" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy + 153}" r="6.5" fill="${dark}"/><path d="M${cx - 4.5} ${cy + 156}L${cx + 4.5} ${cy + 156}L${cx + 7} ${cy + 176}L${cx - 7} ${cy + 176}Z" fill="${dark}"/>
    <path d="M${cx - R + 30} ${cy - 120}A150 150 0 0 1 ${cx - 120} ${cy - R + 30}" fill="none" stroke="${alpha("#ffffff", 0.22)}" stroke-width="5" stroke-linecap="round"/>
    <rect x="${bx - 6}" y="334" width="12" height="206" rx="3" fill="url(#vb)" stroke="${lo}" stroke-width="1.5"/>
    <path d="M${bx - 34} 548L${bx - 22} 528H${bx + 22}L${bx + 34} 548Z" fill="url(#vb)" stroke="${lo}" stroke-width="1.5"/>
    <rect x="${bx - 60}" y="326" width="120" height="8" rx="4" fill="url(#vb)" stroke="${lo}" stroke-width="1.5"/>
    <circle cx="${bx}" cy="330" r="9" fill="${hi}" stroke="${lo}" stroke-width="2"/>
    ${pan(bx - 60, cyl(bx - 76, 392, 14, 40) + cyl(bx - 60, 392, 14, 20))}
    ${pan(bx + 60, [0, 1, 2].map((i) => cyl(bx + 36 + i * 16, 392, 14, 20)).join(""))}`;
}

/* ------------------------------------------------------------------ unit-8-b */

/** A big goal thermometer, stacked coins, and a two-pan balance showing x + 2 = 5 as blocks. */
function fundraiserGoal(p) {
  const coinC = "#f4b63a";
  const coinHi = "#ffd876";
  const coinLo = "#c98a14";
  const tx = 772;
  const top = 100;
  const bot = 430;
  const level = 0.72;
  const yFill = bot - level * (bot - top);
  const floorY = 520;

  const stack = (x, count) => {
    let s = `<ellipse cx="${x}" cy="${floorY + 4}" rx="34" ry="8" fill="${alpha(p.ink, 0.2)}"/>`;
    for (let i = 0; i < count; i++) {
      const y = floorY - (i + 1) * 11;
      s += `<path d="M${x - 28} ${y}v11a28 9 0 0 0 56 0v-11z" fill="${coinLo}" stroke="${darken(coinLo, 0.3)}" stroke-width="1.5"/>
        <path d="M${x - 28} ${y + 5}a28 9 0 0 0 56 0" fill="none" stroke="${coinHi}" stroke-width="1" opacity=".5"/>`;
    }
    const y = floorY - count * 11;
    s += `<ellipse cx="${x}" cy="${y}" rx="28" ry="9" fill="${coinC}" stroke="${darken(coinLo, 0.3)}" stroke-width="1.5"/><ellipse cx="${x}" cy="${y}" rx="18" ry="5.5" fill="none" stroke="${coinLo}" stroke-width="1.8"/><path d="M${x - 14} ${y - 2}Q${x - 6} ${y - 5} ${x + 2} ${y - 5}" stroke="${coinHi}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return s;
  };
  const star = (x, y, r) => {
    const a = Array.from({ length: 10 }, (_, i) => polar(x, y, i % 2 ? r * 0.45 : r, -90 + i * 36));
    return `<path d="${dpath(a)}" fill="${p.glow}" stroke="${darken(coinLo, 0.2)}" stroke-width="2.5" stroke-linejoin="round"/>`;
  };
  const block = (x, y, s, fill, mark) =>
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="${fill}" stroke="${darken(fill, 0.35)}" stroke-width="1.6"/><rect x="${x + 3}" y="${y + 3}" width="${s - 6}" height="${s * 0.28}" rx="2" fill="${alpha("#ffffff", 0.35)}"/>${mark ? `<path d="M${x + s / 2} ${y + s * 0.28}l${s * 0.22} ${s * 0.22}l${-s * 0.22} ${s * 0.22}l${-s * 0.22} ${-s * 0.22}z" fill="${alpha("#ffffff", 0.75)}"/>` : ""}`;

  const bx = 1104;
  const by = 270;
  const half = 62;
  const panY = by + 76;
  const pan = (x, blocks) =>
    `<path d="M${x} ${by + 4}L${x - 26} ${panY}M${x} ${by + 4}L${x + 26} ${panY}" stroke="${alpha(p.ink, 0.6)}" stroke-width="2"/>${blocks}<path d="M${x - 32} ${panY}Q${x} ${panY + 28} ${x + 32} ${panY}Z" fill="${p.accentB}" stroke="${darken(p.accentB, 0.4)}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const unit = "#f2a65a";
  const rightBlocks =
    [0, 1, 2].map((i) => block(bx + half - 27 + i * 18, panY - 18, 17, unit)).join("") +
    [0, 1].map((i) => block(bx + half - 18 + i * 18, panY - 36, 17, unit)).join("");
  const leftBlocks =
    block(bx - half - 30, panY - 34, 34, p.accent, true) +
    block(bx - half + 8, panY - 17, 17, unit) +
    block(bx - half + 8, panY - 34, 17, unit);

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const y = bot - (i / 10) * (bot - top);
    return `<path d="M${tx + 40} ${n(y)}h${i % 5 === 0 ? 30 : 16}" stroke="${alpha(p.ink, i % 5 === 0 ? 0.65 : 0.4)}" stroke-width="${i % 5 === 0 ? 3.5 : 2.5}" stroke-linecap="round"/>`;
  }).join("");

  return `
    <defs>
      <linearGradient id="fm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${darken(p.accent, 0.1)}"/><stop offset="1" stop-color="${lighten(p.accent, 0.3)}"/></linearGradient>
      <clipPath id="fc"><rect x="${tx - 20}" y="${top}" width="40" height="${bot - top + 40}" rx="20"/><circle cx="${tx}" cy="470" r="53"/></clipPath>
    </defs>
    <circle cx="${tx + 20}" cy="290" r="270" fill="${lighten(p.glow, 0.55)}" opacity=".55"/>
    <circle cx="${tx + 20}" cy="290" r="226" fill="none" stroke="${alpha(p.glow, 0.9)}" stroke-width="3" stroke-dasharray="3 14" stroke-linecap="round"/>
    <rect y="${floorY}" width="1200" height="80" fill="${alpha(p.accent, 0.13)}"/><rect y="${floorY}" width="1200" height="5" fill="${alpha(p.accent, 0.32)}"/>
    <g fill="${alpha(p.accent, 0.3)}"><circle cx="600" cy="150" r="7"/><circle cx="640" cy="60" r="5"/><circle cx="575" cy="430" r="8"/><circle cx="790" cy="60" r="6"/><circle cx="1130" cy="110" r="7"/><circle cx="1000" cy="180" r="5"/></g>
    <g fill="${alpha(p.accentB, 0.35)}"><rect x="610" y="260" width="12" height="12" rx="2" transform="rotate(20 616 266)"/><rect x="1150" y="200" width="12" height="12" rx="2" transform="rotate(-20 1156 206)"/><rect x="760" y="130" width="10" height="10" rx="2" transform="rotate(35 765 135)"/></g>
    <ellipse cx="${tx + 8}" cy="${floorY + 8}" rx="84" ry="12" fill="${alpha(p.ink, 0.2)}"/>
    <rect x="${tx - 36}" y="${top - 18}" width="72" height="${bot - top + 24}" rx="36" fill="#ffffff" fill-opacity=".85" stroke="${alpha(p.ink, 0.55)}" stroke-width="4"/>
    <circle cx="${tx}" cy="470" r="68" fill="#ffffff" fill-opacity=".85" stroke="${alpha(p.ink, 0.55)}" stroke-width="4"/>
    <rect x="${tx - 33}" y="${top - 2}" width="66" height="${bot - top + 40}" fill="#ffffff" fill-opacity=".85"/>
    <rect x="${tx - 20}" y="${top}" width="40" height="${bot - top + 40}" rx="20" fill="${alpha(p.ink, 0.12)}"/><circle cx="${tx}" cy="470" r="53" fill="${alpha(p.ink, 0.12)}"/>
    <g clip-path="url(#fc)"><rect x="${tx - 60}" y="${n(yFill)}" width="120" height="${600 - yFill}" fill="url(#fm)"/><rect x="${tx - 60}" y="${n(yFill)}" width="120" height="5" fill="${alpha("#ffffff", 0.5)}"/></g>
    <rect x="${tx - 13}" y="${top + 14}" width="6" height="${bot - top - 30}" rx="3" fill="#ffffff" opacity=".7"/><ellipse cx="${tx - 22}" cy="458" rx="8" ry="14" fill="#ffffff" opacity=".45" transform="rotate(25 ${tx - 22} 458)"/>
    ${ticks}
    <path d="M${tx - 42} ${n(yFill)}l-18 -11v22z" fill="${p.accentB}"/>
    <path d="M${tx + 36} ${top}H${tx + 160}" stroke="${p.accentB}" stroke-width="3" stroke-dasharray="9 8" stroke-linecap="round"/>
    ${star(tx + 196, top, 25)}
    ${stack(888, 3)}${stack(946, 5)}${stack(1004, 8)}
    <rect x="${bx - 6}" y="${by + 6}" width="12" height="${floorY - by - 6}" rx="3" fill="${p.deep}"/><rect x="${bx - 3}" y="${by + 6}" width="3" height="${floorY - by - 6}" fill="${alpha("#ffffff", 0.25)}"/>
    <path d="M${bx - 44} ${floorY}L${bx - 28} ${floorY - 22}H${bx + 28}L${bx + 44} ${floorY}Z" fill="${p.deep}"/>
    <rect x="${bx - half - 4}" y="${by - 5}" width="${half * 2 + 8}" height="10" rx="5" fill="${p.deep}"/>
    <circle cx="${bx}" cy="${by}" r="10" fill="${p.glow}" stroke="${darken(coinLo, 0.2)}" stroke-width="2.5"/>
    ${pan(bx - half, leftBlocks)}${pan(bx + half, rightBlocks)}`;
}

/* ------------------------------------------------------------------ unit-8-c */

/** A cipher wheel, a digit-block matrix and a key, in terminal green. */
function codebreaker(p) {
  const g = p.glow;
  const gDim = mix(g, p.ink, 0.55);
  const cx = 884;
  const cy = 280;
  const R = 228;
  const seg = {
    a: "M2 0h10v3h-10z",
    b: "M11 2h3v9h-3z",
    c: "M11 13h3v9h-3z",
    d: "M2 21h10v3h-10z",
    e: "M0 13h3v9h-3z",
    f: "M0 2h3v9h-3z",
    g: "M2 10.5h10v3h-10z",
  };
  const digits = [
    "abcdef",
    "bc",
    "abged",
    "abgcd",
    "fgbc",
    "afgcd",
    "afgedc",
    "abc",
    "abcdefg",
    "abcdfg",
  ];
  const defs = digits
    .map(
      (s, i) =>
        `<path id="dg${i}" transform="scale(1.35)" d="${[...s].map((k) => seg[k]).join("")}"/>`,
    )
    .join("");
  const r = rng(7);
  let matrix = "";
  for (let col = 0; col < 11; col++) {
    const lead = Math.floor(r() * 7);
    for (let row = 0; row < 8; row++) {
      const dist = (row - lead + 8) % 8;
      const o = Math.max(0.1, Math.round((0.78 - dist * 0.14) * 10) / 10);
      const x = 590 + col * 54;
      const y = 22 + row * 70;
      matrix += `<use href="#dg${Math.floor(r() * 10)}" x="${x}" y="${y}" fill="${g}" opacity="${n(o)}"/>`;
    }
  }
  const slots = (rad, count, w, h, rot, litEvery) =>
    Array.from({ length: count }, (_, i) => {
      const a = rot + (i * 360) / count;
      const lit = i % litEvery === 0;
      return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="${lit ? alpha(g, 0.85) : alpha(p.ink, 0.85)}" stroke="${alpha(g, lit ? 1 : 0.4)}" stroke-width="1.5" transform="translate(${cx} ${cy}) rotate(${a}) translate(0 ${-rad})"/>`;
    }).join("");
  const teeth = (rIn, rOut, count, rot) => {
    const step = 360 / count;
    const a = [];
    for (let i = 0; i < count; i++) {
      const s = rot + i * step;
      a.push(
        polar(cx, cy, rIn, s),
        polar(cx, cy, rOut, s + step * 0.15),
        polar(cx, cy, rOut, s + step * 0.85),
        polar(cx, cy, rIn, s + step),
      );
    }
    return dpath(a);
  };
  const star = Array.from({ length: 16 }, (_, i) => polar(cx, cy, i % 2 ? 22 : 54, -90 + i * 22.5));
  const bits = [1, 0, 1, 1, 0, 0, 1, 0, 1];
  const ky = 552;
  const keyBits = bits
    .map(
      (b, i) =>
        `<rect x="${1004 + i * 12}" y="${ky + 5}" width="9" height="${b ? 28 : 12}" fill="${g}"/>`,
    )
    .join("");

  return `
    <defs>${defs}
      <radialGradient id="cw" cx=".4" cy=".35" r=".9"><stop offset="0" stop-color="${mix(p.deep, g, 0.12)}"/><stop offset="1" stop-color="${mix(p.ink, p.deep, 0.2)}"/></radialGradient>
    </defs>
    <path d="${Array.from({ length: 30 }, (_, i) => `M0 ${i * 20 + 10}H1200`).join("")}" stroke="${alpha(g, 0.04)}" stroke-width="2"/>
    ${matrix}
    <circle cx="${cx}" cy="${cy}" r="${R + 60}" fill="${alpha(g, 0.07)}"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 26}" fill="none" stroke="${alpha(g, 0.3)}" stroke-width="2" stroke-dasharray="2 12" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy + 8}" r="${R}" fill="${alpha("#000000", 0.45)}"/>
    <path d="${teeth(R - 10, R, 26, -90)}" fill="${mix(g, p.deep, 0.5)}" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 10}" fill="url(#cw)" stroke="${g}" stroke-width="2.5"/>
    <path d="${tickRing(cx, cy, R - 24, R - 14, 78, -90)}" stroke="${alpha(g, 0.55)}" stroke-width="1.5"/>
    ${slots(R - 44, 26, 18, 26, -90, 13)}
    <circle cx="${cx}" cy="${cy}" r="${R - 70}" fill="none" stroke="${g}" stroke-width="2"/>
    <path d="${teeth(R - 76, R - 66, 26, -83)}" fill="${gDim}" stroke="${alpha(g, 0.8)}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 76}" fill="${mix(p.ink, p.deep, 0.55)}" stroke="${g}" stroke-width="2"/>
    <path d="${tickRing(cx, cy, R - 96, R - 86, 52, -83)}" stroke="${alpha(g, 0.55)}" stroke-width="1.5"/>
    ${slots(R - 112, 26, 15, 21, -83, 13)}
    <circle cx="${cx}" cy="${cy}" r="${R - 140}" fill="${p.ink}" stroke="${alpha(g, 0.7)}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 148}" fill="none" stroke="${alpha(g, 0.3)}" stroke-width="1.5" stroke-dasharray="3 6"/>
    <path d="${dpath(star)}" fill="${alpha(g, 0.14)}" stroke="${g}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="14" fill="${g}"/><circle cx="${cx}" cy="${cy}" r="6" fill="${p.ink}"/>
    <path d="M${cx - 30} ${cy - R - 14}L${cx + 30} ${cy - R - 14}L${cx + 18} ${cy - R + 112}L${cx - 18} ${cy - R + 112}Z" fill="${alpha(g, 0.13)}" stroke="${g}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M${cx - 22} ${cy - R - 26}H${cx + 22}" stroke="${g}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${cx - 60} ${cy - R - 2}L${cx} ${cy - R + 14}L${cx + 60} ${cy - R - 2}" fill="none" stroke="${alpha(g, 0.4)}" stroke-width="2"/>
    <g>
      <circle cx="700" cy="${ky}" r="27" fill="none" stroke="${g}" stroke-width="9"/><circle cx="700" cy="${ky}" r="11" fill="${p.ink}" stroke="${alpha(g, 0.5)}" stroke-width="2"/>
      <rect x="724" y="${ky - 6}" width="290" height="12" rx="2" fill="${g}"/><rect x="760" y="${ky - 11}" width="12" height="22" fill="${g}"/><rect x="788" y="${ky - 11}" width="12" height="22" fill="${g}"/>
      <rect x="1000" y="${ky - 8}" width="116" height="16" fill="${g}"/>${keyBits}
      <circle cx="702" cy="${ky - 6}" r="4" fill="${alpha("#ffffff", 0.6)}"/>
    </g>`;
}

/* ------------------------------------------------------------------ unit-9-a */

/** An exponential growth curve plotted from a table of values, with subscriber columns and a play badge. */
function channelGrowth(p) {
  const X0 = 640;
  const base = 484;
  const vals = [8, 12, 18, 27, 40, 60, 90, 135];
  const gx = (i) => 676 + i * 68;
  const gy = (v) => base - (v * 350) / 150;
  const P = vals.map((v, i) => [gx(i), gy(v)]);
  // Catmull-Rom to cubic Bezier: the curve passes through every plotted point.
  let curve = `M${P[0][0]} ${n(P[0][1])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i - 1] || P[i];
    const b = P[i];
    const c = P[i + 1];
    const d = P[i + 2] || c;
    curve += `C${n(b[0] + (c[0] - a[0]) / 6)} ${n(b[1] + (c[1] - a[1]) / 6)} ${n(c[0] - (d[0] - b[0]) / 6)} ${n(c[1] - (d[1] - b[1]) / 6)} ${c[0]} ${n(c[1])}`;
  }
  const last = P[P.length - 1];
  const bars = vals
    .map(
      (v, i) =>
        `<rect x="${gx(i) - 19}" y="${n(gy(v))}" width="38" height="${n(base - gy(v))}" rx="4" fill="url(#gb)"/>`,
    )
    .join("");
  const grid = [0, 1, 2, 3, 4, 5].map((i) => `M${X0} ${n(base - i * 70)}H1166`).join("");
  const dots = P.map(([x, y], i) =>
    i === P.length - 1
      ? ""
      : `<circle cx="${x}" cy="${n(y)}" r="8" fill="${p.ink}" stroke="${p.glow}" stroke-width="4"/>`,
  ).join("");
  const xt = P.map(([x]) => `M${x} ${base}v9`).join("");
  return `
    <defs>
      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${alpha(p.glow, 0.5)}"/><stop offset="1" stop-color="${alpha(p.glow, 0)}"/></linearGradient>
      <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${alpha(lighten(p.accent, 0.45), 0.5)}"/><stop offset="1" stop-color="${alpha(lighten(p.accent, 0.45), 0.1)}"/></linearGradient>
      <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(p.glow, 0.15)}"/><stop offset="1" stop-color="${p.accentB}"/></linearGradient>
    </defs>
    <g stroke="${alpha("#ffffff", 0.05)}" stroke-width="2"><path d="M0 120H500M0 190H500M0 260H500M0 330H500M0 400H500M0 470H500"/><path d="M60 0V600M160 0V600M260 0V600M360 0V600M460 0V600"/></g>
    <rect x="${X0 - 30}" y="64" width="560" height="470" rx="26" fill="${alpha(p.ink, 0.35)}" stroke="${alpha("#ffffff", 0.1)}" stroke-width="2"/>
    <path d="${grid}" stroke="${alpha("#ffffff", 0.1)}" stroke-width="2"/>
    ${bars}
    <path d="${curve}L${last[0]} ${base}L${P[0][0]} ${base}Z" fill="url(#ga)"/>
    <path d="${curve}" fill="none" stroke="${alpha(p.glow, 0.35)}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${curve}" fill="none" stroke="${p.glow}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${X0} 100V${base}H1166" fill="none" stroke="${alpha("#ffffff", 0.55)}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${xt}" stroke="${alpha("#ffffff", 0.55)}" stroke-width="3"/>
    ${dots}
    <circle cx="${last[0]}" cy="${n(last[1])}" r="26" fill="${alpha(p.glow, 0.25)}"/><circle cx="${last[0]}" cy="${n(last[1])}" r="12" fill="${p.ink}" stroke="${p.glow}" stroke-width="5"/>
    <path d="M${P[5][0]} ${n(P[5][1])}H${X0}M${last[0]} ${n(last[1])}H${X0}" stroke="${alpha(p.glow, 0.45)}" stroke-width="2" stroke-dasharray="4 8"/>
    <g transform="translate(748 152)">
      <rect x="-64" y="-40" width="140" height="96" rx="26" fill="${alpha("#000000", 0.3)}" transform="translate(4 8)"/>
      <rect x="-70" y="-48" width="140" height="96" rx="26" fill="url(#gp)"/>
      <rect x="-62" y="-42" width="124" height="30" rx="15" fill="${alpha("#ffffff", 0.25)}"/>
      <path d="M-14 -22L28 0L-14 22Z" fill="#ffffff" stroke="#ffffff" stroke-width="8" stroke-linejoin="round"/>
    </g>`;
}

/* ------------------------------------------------------------------ unit-9-b */

/** A pegboard of tools, two cost lines crossing at (10, 50), and two passes facing off. */
function makerShowdown(p) {
  const board = mix(p.accent, p.tint, 0.5);
  const holes = (() => {
    let s = "";
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 13; c++) s += `M${596 + c * 24 + 6} ${72 + r * 24}h.1`;
    return `<path d="${s}" stroke="${alpha(p.ink, 0.35)}" stroke-width="6" stroke-linecap="round"/>`;
  })();
  const steel = mix(p.ink, p.paper, 0.35);
  const sh = (inner, x, y, rot = 0) =>
    `<g transform="translate(${x + 5} ${y + 7}) rotate(${rot})" fill="${alpha(p.ink, 0.22)}">${inner}</g><g transform="translate(${x} ${y}) rotate(${rot})">${inner}</g>`;
  const wrench = (fill) =>
    `<g fill="${fill}"><rect x="-9" y="-70" width="18" height="120" rx="9"/><circle cx="0" cy="-80" r="26"/><circle cx="0" cy="56" r="17"/></g>`;
  const wrenchCut = `<rect x="-11" y="-118" width="22" height="42" fill="${board}"/><circle cx="0" cy="56" r="7" fill="${board}"/>`;
  const sawTeeth = Array.from(
    { length: 15 },
    (_, i) => `M${60 + i * 10} 14L${65 + i * 10} 22L${70 + i * 10} 14Z`,
  ).join("");
  const handle = `<path d="M0 -4Q0 -26 24 -26H52V18H24Q0 18 0 -4Z" fill="${p.accentB}"/><ellipse cx="22" cy="-4" rx="9" ry="8" fill="${board}"/>`;
  const gear = (cx, cy, rIn, rOut, t, rot, fill, hole) =>
    `<path d="${gearPath(cx, cy, rIn, rOut, t, rot)}" fill="${fill}"/><circle cx="${cx}" cy="${cy}" r="${hole}" fill="${board}"/>`;
  const hook = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="${alpha(p.ink, 0.5)}"/>`;

  // graph: cost A = 30 + 2x (membership), cost B = 5x (pay per visit): they meet at x = 10, y = 50
  const gx0 = 972;
  const gy0 = 300;
  const GX = (x) => gx0 + x * 11.5;
  const GY = (y) => gy0 - y * 2.1;
  const ix = GX(10);
  const iy = GY(50);

  const ticket = (fill, deep, stub, icon) => `
    <path d="M0 -6Q0 -14 8 -14H196V22A14 14 0 0 0 196 50V86Q196 94 188 94H8Q0 94 0 86V50A14 14 0 0 0 0 22Z" fill="${alpha(p.ink, 0.2)}" transform="translate(5 8)"/>
    <path d="M0 -6Q0 -14 8 -14H196V22A14 14 0 0 0 196 50V86Q196 94 188 94H8Q0 94 0 86V50A14 14 0 0 0 0 22Z" fill="${fill}" stroke="${deep}" stroke-width="3" stroke-linejoin="round" transform="translate(0 0)"/>
    <path d="M140 -8V90" stroke="${alpha("#ffffff", 0.7)}" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/>
    <rect x="8" y="-6" width="124" height="18" rx="6" fill="${alpha("#ffffff", 0.22)}"/>
    ${icon}${stub}`;

  return `
    <circle cx="880" cy="300" r="270" fill="${lighten(p.glow, 0.6)}" opacity=".45"/>
    <g fill="${alpha(p.accent, 0.1)}"><rect x="40" y="90" width="12" height="400" rx="6"/><rect x="90" y="140" width="12" height="300" rx="6"/><rect x="140" y="190" width="12" height="200" rx="6"/></g>
    <rect x="584" y="52" width="324" height="268" rx="16" fill="${alpha(p.ink, 0.18)}" transform="translate(6 9)"/>
    <rect x="584" y="52" width="324" height="268" rx="16" fill="${board}" stroke="${darken(board, 0.3)}" stroke-width="4"/>
    ${holes}
    ${hook(652, 82)}${hook(826, 82)}${hook(700, 300)}
    ${sh(`<g transform="scale(.85)">${wrench(p.ink)}${wrenchCut}</g>`, 658, 172, -28)}
    ${sh(`<g>${handle}<path d="M52 -12L206 -4L206 14L52 16Z" fill="${steel}"/><path d="${sawTeeth}" fill="${steel}"/><path d="M60 -6L196 0" stroke="${alpha("#ffffff", 0.5)}" stroke-width="3"/></g>`, 686, 276, -3)}
    ${sh(gear(0, 0, 36, 46, 12, 0, p.accent, 14), 826, 138)}
    ${sh(gear(0, 0, 24, 32, 9, 20, p.accentB, 10), 748, 184)}
    <rect x="936" y="52" width="244" height="268" rx="16" fill="${alpha(p.ink, 0.15)}" transform="translate(5 8)"/>
    <rect x="936" y="52" width="244" height="268" rx="16" fill="${alpha("#ffffff", 0.78)}" stroke="${alpha(p.ink, 0.25)}" stroke-width="3"/>
    <path d="${[0, 1, 2, 3, 4].map((i) => `M${gx0} ${GY(i * 25)}H1160`).join("")}" stroke="${alpha(p.ink, 0.12)}" stroke-width="2"/>
    <path d="M${gx0} 74V${gy0}H1162" fill="none" stroke="${alpha(p.ink, 0.7)}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${ix} ${iy}V${gy0}M${ix} ${iy}H${gx0}" stroke="${alpha(p.ink, 0.45)}" stroke-width="2" stroke-dasharray="4 6"/>
    <path d="M${gx0} ${GY(30)}L${GX(16)} ${GY(62)}" stroke="${p.accentB}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${gx0} ${gy0}L${GX(16)} ${GY(80)}" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="${gx0}" cy="${GY(30)}" r="6" fill="${p.accentB}"/>
    <circle cx="${ix}" cy="${iy}" r="20" fill="${alpha(p.glow, 0.5)}"/><circle cx="${ix}" cy="${iy}" r="9" fill="#ffffff" stroke="${p.ink}" stroke-width="4"/>
    <ellipse cx="880" cy="540" rx="300" ry="12" fill="${alpha(p.ink, 0.12)}"/>
    <g transform="translate(626 392) rotate(7 100 40)">${ticket(p.accent, darken(p.accent, 0.35), `<g fill="#ffffff" opacity=".9">${[0, 1, 2, 3, 4].map((i) => `<rect x="${150 + i * 8}" y="${12 + (i % 2) * 6}" width="4" height="${52 - (i % 2) * 12}"/>`).join("")}</g>`, `<g transform="translate(70 40)"><path d="${gearPath(0, 0, 20, 29, 10, 0)}" fill="#ffffff"/><circle r="9" fill="${p.accent}"/></g>`)}</g>
    <g transform="translate(954 392) rotate(-7 100 40)">${ticket(p.accentB, darken(p.accentB, 0.35), `<g fill="#ffffff" opacity=".9">${[0, 1, 2, 3, 4].map((i) => `<rect x="${150 + i * 8}" y="${12 + ((i + 1) % 2) * 6}" width="4" height="${52 - ((i + 1) % 2) * 12}"/>`).join("")}</g>`, `<g transform="translate(70 40)"><ellipse rx="26" ry="26" fill="#ffffff"/><ellipse rx="17" ry="17" fill="none" stroke="${p.accentB}" stroke-width="4"/><path d="M-5 -2L0 -10L5 -2L0 8Z" fill="${p.accentB}"/></g>`)}</g>
    <path d="M884 424L868 472H884L872 520L912 462H894L904 424Z" fill="${p.glow}" stroke="${darken(p.glow, 0.35)}" stroke-width="3.5" stroke-linejoin="round"/>`;
}

/* ------------------------------------------------------------------ isometric helpers */

const C30 = Math.cos(Math.PI / 6);
const isoP = (ox, oy, s) => (x, y, z) => [ox + (x - y) * C30 * s, oy + ((x + y) / 2) * s - z * s];

/** A box in isometric view: x runs down-right, y down-left. The faces seen are top, left (max y) and right (max x). */
function isoBox(P, x, y, z, w, d, h, col, edge, extra = "") {
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  const st = `stroke="${edge}" stroke-width="2" stroke-linejoin="round"`;
  return `${poly(left, `fill="${col.left}" ${st}`)}${poly(right, `fill="${col.right}" ${st}`)}${poly(top, `fill="${col.top}" ${st}`)}${extra}`;
}

/* ------------------------------------------------------------------ unit-10-a */

/** A 3 x 2 x 2 box: its net with dashed folds and tabs, beside the same box in isometric view. Kraft palette. */
function packageNet(p) {
  const k = "#cfa56f";
  const faces = { top: lighten(k, 0.3), front: k, side: darken(k, 0.14), bottom: lighten(k, 0.12) };
  const cut = p.accentB;
  const edge = darken(k, 0.38);
  const u = 44;
  const W = 3 * u;
  const D = 2 * u;
  const H = 2 * u;
  const x0 = 630;
  const y0 = 84;
  const xs = x0 + D; // strip left edge
  const rect = (x, y, w, h, fill) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
  const outline = `M${x0} ${y0 + 16}L${x0} ${y0}L${xs + H + D} ${y0}L${xs + H + D} ${y0 + 16}L${xs + H + D + 20} ${y0 + 28}L${xs + H + D + 20} ${y0 + 104}L${xs + H + D} ${y0 + 116}L${xs + H + D} ${y0 + W}L${xs + H} ${y0 + W}L${xs + H} ${y0 + 2 * W + 2 * D}L${xs} ${y0 + 2 * W + 2 * D}L${xs} ${y0 + 2 * W + 2 * D - 12}L${xs - 22} ${y0 + 2 * W + 2 * D - 26}L${xs - 22} ${y0 + 2 * W + D + 26}L${xs} ${y0 + 2 * W + D + 12}L${xs} ${y0 + W}L${x0} ${y0 + W}L${x0} ${y0 + W - 16}L${x0 - 20} ${y0 + W - 28}L${x0 - 20} ${y0 + 28}L${x0} ${y0 + 16}Z`;
  const ys = [y0 + W, y0 + W + D, y0 + 2 * W + D];
  const folds = `M${xs} ${y0}V${y0 + W}M${xs + H} ${y0}V${y0 + W}${ys.map((y) => `M${xs} ${y}H${xs + H}`).join("")}`;
  const net = `
    <path d="${outline}" fill="${alpha(p.ink, 0.16)}" transform="translate(7 9)"/>
    ${rect(x0, y0, D, W, faces.top)}${rect(xs, y0, H, W, faces.front)}${rect(xs + H, y0, D, W, faces.bottom)}
    ${rect(xs, ys[0], H, D, faces.side)}${rect(xs, ys[1], H, W, faces.front)}${rect(xs, ys[2], H, D, faces.side)}
    <path d="${outline}" fill="${faces.front}" fill-opacity=".0"/>
    ${rect(x0, y0 + 1.2 * u, D, 0.6 * u, alpha(cut, 0.75))}${rect(xs, y0 + 1.2 * u, 0.9 * u, 0.6 * u, alpha(cut, 0.75))}
    <rect x="${xs + 1.0 * u}" y="${y0 + 0.35 * u}" width="${0.65 * u}" height="${0.65 * u}" fill="#fff7ea" stroke="${edge}" stroke-width="1.5"/>
    <path d="${[0, 1, 2, 3].map((i) => `M${xs + 1.0 * u + 0.1 * u + i * 0.14 * u} ${y0 + 0.35 * u + 0.1 * u}v${0.45 * u}`).join("")}" stroke="${p.ink}" stroke-width="2.5"/>
    <path d="${folds}M${xs} ${y0}V${y0 + W}" fill="none" stroke="${edge}" stroke-width="2.5" stroke-dasharray="9 7" stroke-linecap="round"/>
    <path d="${outline}" fill="none" stroke="${cut}" stroke-width="3.5" stroke-linejoin="round"/>
    <g stroke="${alpha(edge, 0.55)}" stroke-width="2"><path d="M${x0 - 38} ${y0}h10M${x0 - 38} ${y0 + W}h10"/><path d="M${x0 - 33} ${y0}V${y0 + W}"/></g>
    <g fill="${alpha(edge, 0.7)}">${[0, 1, 2].map((i) => `<circle cx="${x0 - 33}" cy="${y0 + i * u + u / 2}" r="3.5"/>`).join("")}</g>`;

  const P = isoP(1070, 306, u);
  const col = { top: faces.top, left: faces.front, right: faces.side };
  const lp = (x0_, x1, z0, z1) => [P(x0_, 2, z0), P(x1, 2, z0), P(x1, 2, z1), P(x0_, 2, z1)];
  const tape = [P(1.2, 0, 2), P(1.8, 0, 2), P(1.8, 2, 2), P(1.2, 2, 2)];
  const tapeL = [P(1.2, 2, 2), P(1.8, 2, 2), P(1.8, 2, 1.1), P(1.2, 2, 1.1)];
  const label = lp(0.35, 1.0, 0.35, 1.0);
  const box = isoBox(
    P,
    0,
    0,
    0,
    3,
    2,
    2,
    col,
    edge,
    `${poly(tape, `fill="${alpha(cut, 0.75)}"`)}${poly(tapeL, `fill="${alpha(cut, 0.75)}"`)}${poly(label, `fill="#fff7ea" stroke="${edge}" stroke-width="1.5"`)}<path d="${[
      0, 1, 2, 3,
    ]
      .map((i) => {
        const x = 0.45 + i * 0.14;
        const [a, b] = [P(x, 2, 0.45), P(x, 2, 0.9)];
        return `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
      })
      .join("")}" stroke="${p.ink}" stroke-width="2.5"/>`,
  );
  const grid = (() => {
    const lines = [];
    for (let i = 1; i < 3; i++) lines.push([P(i, 2, 0), P(i, 2, 2)]);
    lines.push([P(0, 2, 1), P(3, 2, 1)]);
    for (let j = 1; j < 2; j++) lines.push([P(3, j, 0), P(3, j, 2)]);
    lines.push([P(3, 0, 1), P(3, 2, 1)]);
    return `<path d="${lines.map(([a, b]) => `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`).join("")}" stroke="${alpha("#ffffff", 0.35)}" stroke-width="1.5" stroke-dasharray="4 5"/>`;
  })();

  return `
    <circle cx="1030" cy="300" r="250" fill="${lighten(p.glow, 0.6)}" opacity=".4"/>
    <g stroke="${alpha(p.ink, 0.07)}" stroke-width="2"><path d="M0 100H520M0 200H520M0 300H520M0 400H520M0 500H520"/><path d="M100 0V600M200 0V600M300 0V600M400 0V600"/></g>
    ${net}
    <ellipse cx="1076" cy="${n(P(3, 2, 0)[1] + 8)}" rx="130" ry="22" fill="${alpha(p.ink, 0.18)}"/>
    ${box}${grid}
    <path d="M930 250Q960 205 992 218" fill="none" stroke="${cut}" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>
    <path d="M982 202L1004 220L978 232Z" fill="${cut}" stroke="${cut}" stroke-width="3" stroke-linejoin="round"/>`;
}

/* ------------------------------------------------------------------ unit-10-b */

/** An aquarium prism on a stand: unit-cell grid on the glass, a water level at 4 of 5 cells, fish, plants, light. */
function aquarium(p) {
  const cell = 55;
  const x0 = 650;
  const yb = 468;
  const cols = 8;
  const rows = 5;
  const dx = 56;
  const dy = -40;
  const x1 = x0 + cols * cell;
  const yt = yb - rows * cell;
  const wl = 4;
  const yw = yb - wl * cell;
  const water = "#2fb6d3";
  const rand = rng(11);
  const fish = (
    x,
    y,
    s,
    body,
    fin,
    flip = 1,
  ) => `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})">
      <path d="M-34 0L-56 -18Q-50 0 -56 18Z" fill="${fin}"/>
      <ellipse cx="0" cy="0" rx="36" ry="21" fill="${body}"/>
      <path d="M-8 -20Q8 -34 22 -17Z" fill="${fin}"/>
      <path d="M-10 -19Q-18 0 -10 19" stroke="${alpha("#ffffff", 0.6)}" stroke-width="5" fill="none"/>
      <path d="M8 -20Q16 0 8 20" stroke="${alpha("#ffffff", 0.45)}" stroke-width="4" fill="none"/>
      <ellipse cx="6" cy="8" rx="20" ry="9" fill="${alpha("#ffffff", 0.22)}"/>
      <circle cx="22" cy="-4" r="5.5" fill="#ffffff"/><circle cx="23.5" cy="-4" r="2.8" fill="${p.ink}"/></g>`;
  const weed = (x, h, c, sway) =>
    `<path d="M${x} ${yb - 4}C${x + sway} ${yb - h * 0.35} ${x - sway} ${yb - h * 0.65} ${x + sway * 0.5} ${yb - h}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/><path d="M${x + 3} ${yb - 4}C${x + sway + 3} ${yb - h * 0.35} ${x - sway + 3} ${yb - h * 0.65} ${x + sway * 0.5 + 3} ${yb - h}" fill="none" stroke="${alpha("#ffffff", 0.22)}" stroke-width="2.5" stroke-linecap="round"/>`;
  const gravel = Array.from({ length: 46 }, () => {
    const x = x0 + 10 + rand() * (cols * cell - 20);
    const y = yb - 14 + rand() * 16;
    const c = ["#d9b98a", "#b98f5e", "#e8d3a8", "#8f6b45"][Math.floor(rand() * 4)];
    return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(5 + rand() * 4)}" ry="4" fill="${c}"/>`;
  }).join("");
  const bubbles = [
    [880, 400, 7],
    [888, 360, 5],
    [878, 322, 9],
    [1010, 440, 6],
    [1016, 404, 8],
    [740, 330, 5],
    [948, 270, 6],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${alpha("#ffffff", 0.14)}" stroke="${alpha("#ffffff", 0.7)}" stroke-width="2"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.25}" fill="#ffffff"/>`,
    )
    .join("");
  const cubeAt = (cx, cy) => {
    const s = cell;
    const f = [
      [cx, cy],
      [cx + s, cy],
      [cx + s, cy + s],
      [cx, cy + s],
    ];
    const t = [
      [cx, cy],
      [cx + dx / 2, cy + dy / 2],
      [cx + s + dx / 2, cy + dy / 2],
      [cx + s, cy],
    ];
    const r = [
      [cx + s, cy],
      [cx + s + dx / 2, cy + dy / 2],
      [cx + s + dx / 2, cy + s + dy / 2],
      [cx + s, cy + s],
    ];
    const st = `stroke="${p.glow}" stroke-width="2.5" stroke-linejoin="round"`;
    return `${poly(f, `fill="${alpha(p.glow, 0.5)}" ${st}`)}${poly(t, `fill="${alpha(lighten(p.glow, 0.5), 0.75)}" ${st}`)}${poly(r, `fill="${alpha(darken(p.glow, 0.15), 0.6)}" ${st}`)}`;
  };
  const vGrid = Array.from(
    { length: cols - 1 },
    (_, i) => `M${x0 + (i + 1) * cell} ${yt}V${yb}`,
  ).join("");
  const hGrid = Array.from(
    { length: rows - 1 },
    (_, i) => `M${x0} ${yt + (i + 1) * cell}H${x1}`,
  ).join("");
  const ruler = Array.from(
    { length: rows + 1 },
    (_, i) => `M${x1 + dx + 8} ${yb + dy - i * cell}h${i % 5 === 0 ? 20 : 12}`,
  ).join("");
  const rays = [
    [700, 120],
    [820, 150],
    [940, 100],
    [1060, 130],
  ]
    .map(
      ([x, w], i) =>
        `<polygon points="${x},0 ${x + w * 0.5},0 ${x + 150 + i * 30 - 40},${yb} ${x + 40 - i * 20},${yb}" fill="url(#ar)"/>`,
    )
    .join("");
  const frame = `stroke="${lighten(p.deep, 0.45)}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;

  return `
    <defs>
      <linearGradient id="aw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(water, 0.15)}" stop-opacity=".85"/><stop offset="1" stop-color="${darken(water, 0.35)}" stop-opacity=".92"/></linearGradient>
      <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".0"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".38"/><stop offset="1" stop-color="#ffffff" stop-opacity=".0"/></linearGradient>
      <clipPath id="ac"><polygon points="${x0},${yw} ${x1},${yw} ${x1 + dx},${yw + dy} ${x0 + dx},${yw + dy} ${x0 + dx},${yb + dy} ${x0},${yb}"/><rect x="${x0}" y="${yw}" width="${cols * cell}" height="${wl * cell}"/><polygon points="${x1},${yw} ${x1 + dx},${yw + dy} ${x1 + dx},${yb + dy} ${x1},${yb}"/></clipPath>
    </defs>
    <g fill="none" stroke="${alpha("#ffffff", 0.12)}" stroke-width="3"><circle cx="190" cy="140" r="36"/><circle cx="330" cy="400" r="22"/><circle cx="120" cy="450" r="14"/><circle cx="410" cy="220" r="18"/><circle cx="260" cy="520" r="10"/></g>
    <rect y="548" width="1200" height="52" fill="${alpha("#000000", 0.32)}"/>
    <ellipse cx="${x0 + 330}" cy="560" rx="400" ry="16" fill="${alpha("#000000", 0.3)}"/>
    <rect x="${x0 - 14}" y="${yb + 4}" width="${cols * cell + 28}" height="82" rx="6" fill="${mix(p.accentB, p.ink, 0.55)}"/>
    <rect x="${x0 - 14}" y="${yb + 4}" width="${cols * cell + 28}" height="10" rx="4" fill="${mix(p.accentB, p.ink, 0.3)}"/>
    <rect x="${x0 + 14}" y="${yb + 26}" width="190" height="46" rx="5" fill="none" stroke="${alpha("#ffffff", 0.12)}" stroke-width="3"/><rect x="${x0 + 238}" y="${yb + 26}" width="190" height="46" rx="5" fill="none" stroke="${alpha("#ffffff", 0.12)}" stroke-width="3"/>
    <polygon points="${x0},${yt} ${x0 + dx},${yt + dy} ${x0 + dx},${yb + dy} ${x0},${yb}" fill="${alpha(p.deep, 0.55)}"/>
    <rect x="${x0 + dx}" y="${yt + dy}" width="${cols * cell}" height="${rows * cell}" fill="${alpha(p.deep, 0.45)}"/>
    <polygon points="${x0},${yb} ${x1},${yb} ${x1 + dx},${yb + dy} ${x0 + dx},${yb + dy}" fill="${mix(p.deep, "#d9b98a", 0.35)}"/>
    <g clip-path="url(#ac)"><rect x="${x0}" y="${yt + dy}" width="${cols * cell + dx}" height="${rows * cell}" fill="url(#aw)"/>
      ${weed(x0 + 120, 150, "#2f9b5c", 18)}${weed(x0 + 138, 110, "#46b872", -14)}${weed(x1 - 90, 170, "#2f9b5c", -20)}${weed(x1 - 70, 120, "#46b872", 16)}${weed(x0 + 250, 80, "#46b872", 10)}
      ${gravel}
      ${fish(790, 330, 1, "#ff9a3c", "#e2701a")}${fish(990, 280, 0.85, "#ffd166", "#e0a02a", -1)}${fish(900, 395, 0.7, "#4fd1c5", "#2a9d9d")}
      ${cubeAt(x0, yb - cell)}${cubeAt(x0 + cell, yb - cell)}${cubeAt(x0, yb - 2 * cell)}
      ${rays}${bubbles}
    </g>
    <polygon points="${x0},${yw} ${x1},${yw} ${x1 + dx},${yw + dy} ${x0 + dx},${yw + dy}" fill="${alpha("#ffffff", 0.2)}" stroke="${alpha("#ffffff", 0.7)}" stroke-width="2.5"/>
    <polygon points="${x1},${yt} ${x1 + dx},${yt + dy} ${x1 + dx},${yb + dy} ${x1},${yb}" fill="${alpha("#ffffff", 0.05)}"/>
    <path d="${vGrid}${hGrid}" stroke="${alpha("#ffffff", 0.3)}" stroke-width="1.8"/>
    <path d="M${x0 + 24} ${yb - 40}L${x0 + 24 + 90} ${yb - 40 - 150}" stroke="${alpha("#ffffff", 0.0)}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${x1 - 30} ${yt + 24}L${x1 - 30} ${yt + 120}" stroke="${alpha("#ffffff", 0.4)}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${x0} ${yt}H${x1}V${yb}H${x0}ZM${x0 + dx} ${yt + dy}H${x1 + dx}V${yb + dy}M${x0} ${yt}L${x0 + dx} ${yt + dy}M${x1} ${yt}L${x1 + dx} ${yt + dy}M${x1} ${yb}L${x1 + dx} ${yb + dy}" fill="none" ${frame}/>
    <path d="${ruler}" stroke="${alpha("#ffffff", 0.6)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M${x1 + dx + 8} ${yb + dy}V${yb + dy - rows * cell}" stroke="${alpha("#ffffff", 0.6)}" stroke-width="3"/>
    <path d="M${x1 + dx + 8} ${yb + dy - wl * cell}h20" stroke="${p.glow}" stroke-width="5" stroke-linecap="round"/>`;
}

/* ------------------------------------------------------------------ unit-10-c */

/** An isometric research pavilion of cubes and prisms, with blueprint measure lines and its net unfolding. */
function geoPavilion(p) {
  const s = 32;
  const P = isoP(806, 190, s);
  const blue = alpha(lighten(p.glow, 0.2), 0.85);
  const stone = {
    top: mix(p.paper, p.deep, 0.15),
    left: mix(p.deep, p.paper, 0.35),
    right: mix(p.deep, p.ink, 0.25),
  };
  const wall = {
    top: lighten(p.accent, 0.5),
    left: lighten(p.accent, 0.25),
    right: darken(p.accent, 0.2),
  };
  const tower = { top: lighten(p.accent, 0.62), left: lighten(p.accent, 0.38), right: p.accent };
  const cubeC = { top: lighten(p.glow, 0.5), left: p.glow, right: darken(p.glow, 0.2) };
  const edge = alpha(p.ink, 0.65);
  const win = (pts_) =>
    poly(pts_, `fill="${alpha(p.ink, 0.8)}" stroke="${alpha(p.glow, 0.6)}" stroke-width="1.5"`);

  const hx = 1.8;
  const hy = 1.8;
  const hw = 3;
  const hz = 0.9;
  const hh = 2;
  const front = (a, b, z0, z1) => [
    P(hx + a, hy + hw, hz + z0),
    P(hx + b, hy + hw, hz + z0),
    P(hx + b, hy + hw, hz + z1),
    P(hx + a, hy + hw, hz + z1),
  ];
  const side = (a, b, z0, z1) => [
    P(hx + hw, hy + a, hz + z0),
    P(hx + hw, hy + b, hz + z0),
    P(hx + hw, hy + b, hz + z1),
    P(hx + hw, hy + a, hz + z1),
  ];
  const windows =
    win(front(0.35, 1.05, 0.7, 1.55)) +
    win(front(1.95, 2.65, 0.7, 1.55)) +
    win(front(1.2, 1.8, 0, 1.3)) +
    win(side(0.4, 1.0, 0.7, 1.55)) +
    win(side(2.0, 2.6, 0.7, 1.55));

  // roof: triangular prism, ridge along x at y mid, eaves overhang by 0.3
  const rx0 = hx - 0.3;
  const rx1 = hx + hw + 0.3;
  const ry0 = hy - 0.3;
  const ry1 = hy + hw + 0.3;
  const rz = hz + hh;
  const rr = rz + 1.4;
  const ym = hy + hw / 2;
  const roofBack = [P(rx0, ry0, rz), P(rx1, ry0, rz), P(rx1, ym, rr), P(rx0, ym, rr)];
  const roofFront = [P(rx0, ry1, rz), P(rx1, ry1, rz), P(rx1, ym, rr), P(rx0, ym, rr)];
  const gable = [P(rx1, ry0, rz), P(rx1, ry1, rz), P(rx1, ym, rr)];
  const roof =
    poly(
      roofBack,
      `fill="${lighten(p.glow, 0.1)}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"`,
    ) +
    poly(roofFront, `fill="${p.glow}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"`) +
    poly(
      gable,
      `fill="${darken(p.glow, 0.25)}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"`,
    );

  const items = [
    { k: 0, svg: isoBox(P, 0, 0, 0, 6, 6, 0.5, stone, edge) },
    { k: 1, svg: isoBox(P, 0.5, 0.5, 0.5, 5, 5, 0.4, stone, edge) },
    { k: 2, svg: isoBox(P, 0.8, 3.2, 0.9, 0.9, 0.9, 4.2, tower, edge) },
    { k: 3, svg: isoBox(P, hx, hy, hz, hw, hw, hh, wall, edge, windows) },
    { k: 4, svg: roof },
    {
      k: 5,
      svg:
        isoBox(P, 4.8, 0.9, 0.9, 0.6, 0.6, 0.6, cubeC, edge) +
        isoBox(P, 4.8, 1.5, 0.9, 0.6, 0.6, 0.6, cubeC, edge) +
        isoBox(P, 4.8, 1.5, 1.5, 0.6, 0.6, 0.6, cubeC, edge),
    },
    {
      k: 6,
      svg:
        isoBox(P, 1.5, 4.9, 0.9, 0.6, 0.6, 0.6, cubeC, edge) +
        isoBox(P, 2.1, 4.9, 0.9, 0.6, 0.6, 0.6, cubeC, edge),
    },
  ];
  const towerCap =
    poly([P(0.8, 3.2, 5.1), P(1.7, 3.2, 5.1), P(1.7, 4.1, 5.1), P(0.8, 4.1, 5.1)], 'fill="none"') +
    "";

  // blueprint dimension line along the base's front-left edge, and one up the tower
  const dim = (a, b, off) => {
    const nx = -0.5;
    const ny = C30;
    const [ax, ay] = [a[0] + nx * off, a[1] + ny * off];
    const [bx, by] = [b[0] + nx * off, b[1] + ny * off];
    return `<path d="M${n(a[0])} ${n(a[1])}L${n(ax - nx * 8)} ${n(ay - ny * 8)}M${n(b[0])} ${n(b[1])}L${n(bx - nx * 8)} ${n(by - ny * 8)}" stroke="${alpha(blue, 0.5)}" stroke-width="1.5" stroke-dasharray="4 4"/>
      <path d="M${n(ax)} ${n(ay)}L${n(bx)} ${n(by)}" stroke="${blue}" stroke-width="2"/>
      <path d="M${n(ax - 7 * nx - 7 * 0.87)} ${n(ay - 7 * ny - 7 * 0.5)}L${n(ax + 7 * nx + 7 * 0.87)} ${n(ay + 7 * ny + 7 * 0.5)}M${n(bx - 7 * nx - 7 * 0.87)} ${n(by - 7 * ny - 7 * 0.5)}L${n(bx + 7 * nx + 7 * 0.87)} ${n(by + 7 * ny + 7 * 0.5)}" stroke="${blue}" stroke-width="2"/>`;
  };
  const gridMarks = Array.from(
    { length: 7 },
    (_, i) =>
      `M${n(P(i, 6, 0)[0])} ${n(P(i, 6, 0)[1])}L${n(P(i, 6.4, 0)[0])} ${n(P(i, 6.4, 0)[1])}`,
  ).join("");

  // the hall's net (3 x 3 x 2) with one face lifting
  const u = 18;
  const nx0 = 936;
  const ny0 = 404;
  const sq = (x, y, w, h, f) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${blue}" stroke-width="2"/>`;
  const netS = u * 3;
  const netH = u * 2;
  const net = `
    <rect x="${nx0 - 22}" y="${ny0 - 66}" width="${netS * 3 + netH + 44}" height="${netS + netH + netS + 58}" rx="10" fill="${alpha(p.ink, 0.45)}" stroke="${alpha(blue, 0.45)}" stroke-width="2"/>
    ${sq(nx0 + netS, ny0 - netS + 10 - 10 + 0, netS, netS, alpha(wall.top, 0.55))}
    ${sq(nx0, ny0, netS, netH, alpha(wall.left, 0.5))}${sq(nx0 + netS, ny0, netS, netH, alpha(wall.left, 0.65))}${sq(nx0 + 2 * netS, ny0, netS, netH, alpha(wall.right, 0.65))}${sq(nx0 + 3 * netS, ny0, netS, netH, alpha(wall.right, 0.5))}
    <polygon points="${nx0 + netS},${ny0 + netH} ${nx0 + 2 * netS},${ny0 + netH} ${nx0 + 2 * netS + 18},${ny0 + netH + netS * 0.62} ${nx0 + netS + 18},${ny0 + netH + netS * 0.62}" fill="${alpha(wall.top, 0.8)}" stroke="${blue}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M${nx0 + netS} ${ny0}V${ny0 + netH}M${nx0 + 2 * netS} ${ny0}V${ny0 + netH}M${nx0 + 3 * netS} ${ny0}V${ny0 + netH}" stroke="${blue}" stroke-width="2" stroke-dasharray="4 4"/>
    <path d="M${nx0 + 2 * netS - 14} ${ny0 + netH + netS * 0.95}A40 40 0 0 0 ${nx0 + netS + 14} ${ny0 + netH + netS * 0.95}" fill="none" stroke="${p.glow}" stroke-width="3" stroke-linecap="round"/>
    <path d="M${nx0 + netS + 22} ${ny0 + netH + netS * 0.95 - 8}l-14 6l6 -14z" fill="${p.glow}" stroke="${p.glow}" stroke-width="2" stroke-linejoin="round"/>`;

  return `
    <g stroke="${alpha(blue, 0.07)}" stroke-width="2"><path d="M0 60H520M0 120H520M0 180H520M0 240H520M0 300H520M0 360H520M0 420H520M0 480H520M0 540H520"/><path d="M60 0V600M120 0V600M180 0V600M240 0V600M300 0V600M360 0V600M420 0V600"/></g>
    <g fill="none" stroke="${alpha(blue, 0.1)}" stroke-width="2"><circle cx="230" cy="300" r="110"/><circle cx="230" cy="300" r="200" stroke-dasharray="3 9"/></g>
    <path d="M${n(P(0, 0, 0)[0])} ${n(P(0, 0, 0)[1])}" stroke="none"/>
    <g stroke="${alpha(blue, 0.28)}" stroke-width="1.5">${Array.from({ length: 9 }, (_, j) => {
      const i = j - 1;
      const a = P(i, -1, 0);
      const b = P(i, 7, 0);
      const c = P(-1, i, 0);
      const d = P(7, i, 0);
      return `<path d="M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}M${n(c[0])} ${n(c[1])}L${n(d[0])} ${n(d[1])}"/>`;
    }).join("")}</g>
    <polygon points="${pts([P(-1, -1, 0), P(7, -1, 0), P(7, 7, 0), P(-1, 7, 0)])}" fill="${alpha("#000000", 0.22)}"/>
    ${items.map((i) => i.svg).join("")}${towerCap}
    ${dim(P(0, 6, 0), P(6, 6, 0), 26)}
    <path d="${gridMarks}" stroke="${blue}" stroke-width="1.5"/>
    <path d="M${n(P(0.8, 4.1, 0.9)[0] - 34)} ${n(P(0.8, 4.1, 0.9)[1])}V${n(P(0.8, 4.1, 5.1)[1])}M${n(P(0.8, 4.1, 0.9)[0] - 42)} ${n(P(0.8, 4.1, 0.9)[1])}h16M${n(P(0.8, 4.1, 5.1)[0] - 42)} ${n(P(0.8, 4.1, 5.1)[1])}h16" stroke="${blue}" stroke-width="2"/>
    ${net}`;
}

export const SCENES_C = {
  "unit-8-a": vaultDoor,
  "unit-8-b": fundraiserGoal,
  "unit-8-c": codebreaker,
  "unit-9-a": channelGrowth,
  "unit-9-b": makerShowdown,
  "unit-10-a": packageNet,
  "unit-10-b": aquarium,
  "unit-10-c": geoPavilion,
};
