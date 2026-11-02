// Family Math Studio brand drawings: the mark (a house with an equals sign), a monoline wordmark that needs no font,
// and the per-unit Open Graph card. Pure functions (data -> SVG string); tools/build-family-art.mjs writes the files.
import { n, styleFor, svg } from "./family-art-kit.mjs";
import { sceneBody } from "./family-art-scenes.mjs";

// ------------------------------------------------------------------ the mark
const HOUSE =
  "M48 19 17 46a3.2 3.2 0 0 0 2.2 5.6H26V75a3.2 3.2 0 0 0 3.2 3.2h37.6A3.2 3.2 0 0 0 70 75V51.6h6.8A3.2 3.2 0 0 0 79 46z";

/** The mark on a 96x96 tile. `maskable` scales the art into the 80% safe zone on a full-bleed tile. */
export function markBody({ maskable = false, tile = true, square = false } = {}) {
  const art = `<path d="${HOUSE}" class="xp"/><rect x="36.5" y="55" width="23" height="5.4" rx="2.7" class="xk"/><rect x="36.5" y="64" width="23" height="5.4" rx="2.7" class="xk"/><circle cx="72" cy="25" r="6.5" class="xy"/>`;
  const base = tile
    ? `<rect width="96" height="96" rx="${maskable || square ? 0 : 22}" class="xk"/>`
    : "";
  return maskable
    ? `${base}<g transform="translate(14.4 14.4) scale(.7)">${art}</g>`
    : `${base}${art}`;
}

export const markSvg = (opts = {}) =>
  svg({ w: 96, h: 96, body: markBody(opts), title: "Family Math Studio" });

// ------------------------------------------------------------------ a monoline wordmark (no font required)
// Baseline y=0, x-height -10, cap/ascender -14.5, descender +6. Every glyph is a few round-capped strokes.
const GLYPH = {
  F: [10, "M1 0V-14H9M1 -7.5H8"],
  M: [15, "M1 0V-14L7.5 -5L14 -14V0"],
  S: [12, "M10 -11.3C8.6 -13.7 2.4 -14 2.4 -10.3c0 3.6 7.8 2.8 7.8 7.2 0 4.1-6.4 4-8.4 1.2"],
  a: [12, "M10.5 -5a5 5 0 1 1-10 0 5 5 0 0 1 10 0M10.5 -10V0"],
  d: [12, "M10.5 -5a5 5 0 1 1-10 0 5 5 0 0 1 10 0M10.5 -14.5V0"],
  h: [11, "M1 0V-14.5M1 -6c0-3 2-4 4.2-4S9.5 -9 9.5 -6V0"],
  i: [3, "M1 0V-10M1 -14h.01"],
  l: [3, "M1 0V-14.5"],
  m: [17, "M1 0V-10M1 -6c0-3 2-4 4-4s3.5 1.2 3.5 4V0M8.5 -6c0-3 2-4 4-4s3.5 1.2 3.5 4V0"],
  o: [12, "M11 -5a5 5 0 1 1-10 0 5 5 0 0 1 10 0"],
  t: [9, "M3.5 -14V-3.5c0 2.5 1.5 3.5 4 3.5M0 -10h7.5"],
  u: [11, "M1 -10v6c0 2.5 1.8 4 4.2 4S9.5 -1.5 9.5 -4M9.5 -10V0"],
  y: [11, "M.5 -10L5 -.5M9.5 -10 4.5 3.5Q3.5 6 1 6"],
};

/** Stroke letters for `text` at scale k starting at x; returns { d, width }. */
export function strokeText(text, k = 1.6, x = 0, y = 0, gap = 3) {
  let cx = x;
  let out = "";
  for (const ch of text) {
    if (ch === " ") {
      cx += 6 * k;
      continue;
    }
    const g = GLYPH[ch];
    if (!g) throw new Error(`wordmark has no glyph for "${ch}"`);
    out += `<path transform="translate(${n(cx)} ${n(y)}) scale(${k})" d="${g[1]}"/>`;
    cx += (g[0] + gap) * k;
  }
  return { body: out, width: cx - x - gap * k };
}

export function wordmarkSvg() {
  const k = 1.7;
  const word = strokeText("Family Math Studio", k, 66, 40);
  const w = Math.ceil(66 + word.width + 6);
  const body = `<g transform="scale(.5)">${markBody()}</g><g class="qk" stroke-width="${n(2.3 * k)}">${word.body}</g>`;
  return svg({
    w,
    h: 56,
    body: `<g transform="translate(0 4)">${body}</g>`,
    title: "Family Math Studio",
  });
}

// ------------------------------------------------------------------ Open Graph card (1200 x 630)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const FONT = 'font-family="system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif"';

function lines(text, max) {
  const out = [];
  let line = "";
  for (const w of text.split(" ")) {
    if (line && `${line} ${w}`.length > max) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

/** One card per unit. `unit` 1-10; titleEn / titleEs come from the curriculum data, never typed here. */
export function ogCard({ unit, titleEn, titleEs, accent, tint, lang = "en" }) {
  const title = lang === "es" ? titleEs : titleEn;
  const eyebrow = lang === "es" ? `Unidad ${unit}` : `Unit ${unit}`;
  const tag = lang === "es" ? "Matemáticas en familia" : "Family Math Studio";
  const rows = lines(title, 30).slice(0, 3);
  const size = rows.length > 2 ? 52 : 64;
  const step = size + 10;
  const first = rows.length > 2 ? 168 : 190;
  const word = strokeText("Family Math Studio", 1.1, 112, 74);
  const head = rows
    .map(
      (r, i) =>
        `<text x="64" y="${first + i * step}" font-size="${size}" font-weight="800" ${FONT} class="xk">${esc(r)}</text>`,
    )
    .join("");
  const chipW = eyebrow.length * 16 + 44;
  const text = `<g transform="translate(60 38) scale(.48)">${markBody()}</g><g class="qk" stroke-width="2.4">${word.body}</g><rect x="${1200 - 60 - chipW}" y="40" width="${chipW}" height="46" rx="23" class="xa"/><text x="${1200 - 60 - chipW / 2}" y="72" text-anchor="middle" font-size="26" font-weight="700" ${FONT} class="xk">${esc(eyebrow)}</text>`;
  const scene = sceneBody(unit);
  const body = `<rect width="1200" height="630" class="xp"/>${text}${head}<svg x="0" y="310" width="1200" height="320" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMid slice">${scene}</svg>`;
  const style = styleFor(body);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" style="--unit-accent:${accent};--unit-accent-tint:${tint}" role="img"><title>${esc(`${tag}: ${eyebrow}, ${title}`)}</title><style>${style}</style>${body}</svg>\n`;
}
