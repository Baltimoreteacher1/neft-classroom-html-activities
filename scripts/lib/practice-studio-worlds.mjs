// Generates assets/studio-worlds.css from data/practice-studio/worlds.json: one daylight and one night palette per
// world, plus its header motif, display font and shape language. Palettes are computed from three numbers
// (hue, saturation, accent hue) so contrast is a property of the formula, not of twelve hand-picked sets.

const FONTS = {
  rounded: `"Avenir Next Rounded", "Arial Rounded MT Bold", "Nunito", "Varela Round", ui-rounded, "Trebuchet MS", system-ui, sans-serif`,
  system: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  serif: `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif`,
  mono: `ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, "Courier New", monospace`,
  slab: `Rockwell, "Roboto Slab", "Rockwell Nova", "Courier New", Georgia, serif`,
};

const o = "stroke='%23fff' stroke-opacity='.13' fill='none' stroke-width='2'";
const f = "fill='%23fff' fill-opacity='.10'";
/** Tiny tileable header patterns, white at low opacity so any world colour shows through. */
const MOTIFS = {
  waves: `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='22'><path d='M0 11 Q16 0 32 11 T64 11' ${o}/></svg>`,
  stars: `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='70'><circle cx='10' cy='12' r='1.6' ${f}/><circle cx='52' cy='28' r='1' ${f}/><circle cx='78' cy='10' r='2' ${f}/><circle cx='30' cy='56' r='1.4' ${f}/><circle cx='70' cy='60' r='1' ${f}/></svg>`,
  ridge: `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='34'><path d='M0 30 L14 10 L24 22 L38 4 L54 26 L64 16 L72 30' ${o}/></svg>`,
  checker: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><rect width='14' height='14' ${f}/><rect x='14' y='14' width='14' height='14' ${f}/></svg>`,
  bars: `<svg xmlns='http://www.w3.org/2000/svg' width='42' height='34'><rect x='4' y='14' width='6' height='20' ${f}/><rect x='16' y='4' width='6' height='30' ${f}/><rect x='28' y='20' width='6' height='14' ${f}/></svg>`,
  pixels: `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><rect x='4' y='4' width='8' height='8' ${f}/><rect x='20' y='12' width='8' height='8' ${f}/><rect x='12' y='24' width='8' height='8' ${f}/></svg>`,
  hex: `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='42'><path d='M12 4 L24 4 L30 14 L24 24 L12 24 L6 14 Z' ${o}/></svg>`,
  ropes: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='20'><path d='M0 6 Q14 -2 28 6 T56 6 M0 14 Q14 22 28 14 T56 14' ${o}/></svg>`,
  leaves: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='44'><ellipse cx='14' cy='14' rx='9' ry='4' transform='rotate(-35 14 14)' ${f}/><ellipse cx='40' cy='30' rx='9' ry='4' transform='rotate(35 40 30)' ${f}/></svg>`,
  stripes: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M-4 28 L28 -4 M8 32 L32 8' ${o}/></svg>`,
  arcs: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M0 20 A20 20 0 0 1 20 0 M0 38 A38 38 0 0 1 38 0 M0 56 A56 56 0 0 1 56 0' ${o}/></svg>`,
  gears: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><circle cx='28' cy='28' r='14' ${o} stroke-dasharray='5 4'/><circle cx='28' cy='28' r='6' ${o}/></svg>`,
};
const motifUrl = (/** @type {string} */ name) =>
  `url("data:image/svg+xml,${(MOTIFS[/** @type {keyof typeof MOTIFS} */ (name)] || MOTIFS.stripes)
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "'")
    .replace(/#/g, "%23")}")`;
export const FAVICON = (/** @type {string} */ emoji) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#1B2C3F'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='36'>${emoji}</text></svg>`)}`;

const hsl = (/** @type {number} */ h, /** @type {number} */ s, /** @type {number} */ l) =>
  `hsl(${h}, ${Math.round(s)}%, ${l}%)`;

function day(/** @type {string} */ id, /** @type {any} */ w) {
  const { hue: h, sat: s, accent: a } = w;
  const r = w.radius;
  return `body[data-world="${id}"] {
  --brand: ${hsl(h, s, 30)}; --brand-dark: ${hsl(h, s * 0.6, 15)}; --brand-tint: ${hsl(h, s * 0.55, 93)}; --brand-line: ${hsl(h, s * 0.35, 78)};
  --sun: ${hsl(a, 92, 60)}; --sun-deep: ${hsl(a, 85, 33)}; --sun-tint: ${hsl(a, 90, 92)}; --sun-ink: ${hsl(a, 75, 20)};
  --paper: ${hsl(h, 30, 96)}; --well: ${hsl(h, 25, 91)}; --surface: #FFFFFF; --surface-soft: ${hsl(h, 35, 97.5)};
  --border: ${hsl(h, 18, 84)}; --border-strong: ${hsl(h, 14, 47)};
  --ink: ${hsl(h, 35, 13)}; --ink-muted: ${hsl(h, 18, 27)}; --ink-light: ${hsl(h, 12, 37)};
  --font-display: ${FONTS[/** @type {keyof typeof FONTS} */ (w.font)]};
  --radius-sm: ${Math.round(r * 0.6)}px; --radius-md: ${r}px; --radius-lg: ${Math.round(r * 1.4)}px;
  --motif: ${motifUrl(w.motif)};
}
body[data-world="${id}"] .app-header { background-image: var(--motif); background-repeat: repeat; }`;
}

function night(/** @type {string} */ id, /** @type {any} */ w) {
  const { hue: h, sat: s, accent: a } = w;
  return `body[data-world="${id}"][data-mode="challenge"] {
  --brand: ${hsl(h, Math.min(80, s + 10), 72)}; --brand-dark: ${hsl(h, s * 0.6, 10)}; --brand-tint: ${hsl(h, s * 0.5, 21)}; --brand-line: ${hsl(h, s * 0.4, 36)};
  --sun: ${hsl(a, 92, 62)}; --sun-deep: ${hsl(a, 88, 68)}; --sun-tint: ${hsl(a, 45, 17)}; --sun-ink: ${hsl(a, 90, 82)};
  --paper: ${hsl(h, 40, 8)}; --well: ${hsl(h, 30, 17)}; --surface: ${hsl(h, 32, 13)}; --surface-soft: ${hsl(h, 30, 16)};
  --border: ${hsl(h, 22, 27)}; --border-strong: ${hsl(h, 16, 58)};
  --ink: ${hsl(h, 25, 94)}; --ink-muted: ${hsl(h, 14, 81)}; --ink-light: ${hsl(h, 10, 71)};
  --ok: hsl(152, 55%, 55%); --ok-tint: hsl(152, 38%, 15%); --ok-line: hsl(152, 40%, 34%);
  --bad: hsl(5, 80%, 66%); --bad-tint: hsl(5, 40%, 17%); --bad-line: hsl(5, 45%, 40%);
  --warn: hsl(42, 95%, 72%); --warn-tint: hsl(42, 45%, 15%); --warn-line: hsl(42, 60%, 38%);
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.4), 0 6px 18px rgba(0, 0, 0, 0.35);
  color-scheme: dark;
}
body[data-world="${id}"][data-mode="challenge"] .feedback-box::before { color: #06150E; }
body[data-world="${id}"][data-mode="challenge"] .choice-btn.correct:not(:has(.choice-letter))::before { color: #06281A; }
body[data-world="${id}"][data-mode="challenge"] .choice-btn.wrong:not(:has(.choice-letter))::before { color: #2A0905; }`;
}

export function worldsCss(/** @type {any} */ worlds) {
  const blocks = Object.entries(worlds.worlds).flatMap(([id, w]) => [day(id, w), night(id, w)]);
  return `/* GENERATED by scripts/generate-practice-studios.mjs from data/practice-studio/worlds.json — do not edit by hand.
   One daylight (Practice) and one night (Challenge) palette per world; see assets/studio-v2.css for the components. */

${blocks.join("\n\n")}
`;
}
