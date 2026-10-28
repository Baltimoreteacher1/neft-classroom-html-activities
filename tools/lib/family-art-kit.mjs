// Shared drawing kit for the Family Math Studio illustration system (scenes, spots, hook cards, brand).
//
// One flat/soft style: no outlines on shapes, soft tint fills, rounded forms, ink used for line detail only.
// Every colour is a CSS variable with a token fallback so a page theme (and dark mode) recolours the art:
//   --ink  --paper  --unit-accent  --unit-accent-tint  --art-card  --art-ground  --art-amber
// People keep fixed skin and hair tones (they must not turn into neon in dark mode).
// Shape carries meaning; hue is decoration, so the art still reads in grayscale.

/** class -> CSS rule. Builders emit only the rules a given file actually uses. */
const FILL = {
  k: "var(--ink,#17324D)",
  p: "var(--paper,#F7F4EC)",
  a: "var(--unit-accent,#1FA6A2)",
  t: "var(--unit-accent-tint,#DBF1F0)",
  y: "var(--art-amber,#F2C15B)",
  w: "var(--art-card,#FFFFFF)",
  g: "var(--art-ground,#E6E0D0)",
  r: "var(--art-coral,#D9694A)",
  b: "var(--art-blue,#6F9BC9)",
  n: "var(--art-green,#7FB27E)",
  e: "var(--art-eye,#2A1D16)",
  s1: "var(--art-skin-1,#F3D2B3)",
  s2: "var(--art-skin-2,#E0AC7E)",
  s3: "var(--art-skin-3,#B97A4C)",
  s4: "var(--art-skin-4,#8A5733)",
  s5: "var(--art-skin-5,#5E3A22)",
  h1: "var(--art-hair-1,#2A1D16)",
  h2: "var(--art-hair-2,#6B4527)",
  h3: "var(--art-hair-3,#A9A29A)",
  h4: "var(--art-hair-4,#B5762E)",
};

export const CLASS_RULES = {};
for (const [k, v] of Object.entries(FILL)) {
  CLASS_RULES[`x${k}`] = `.x${k}{fill:${v}}`;
  CLASS_RULES[`q${k}`] = `.q${k}{fill:none;stroke:${v};stroke-linecap:round;stroke-linejoin:round}`;
}
CLASS_RULES.xd = ".xd{fill:var(--ink,#17324D);fill-opacity:.1}";
CLASS_RULES.xf = ".xf{fill:var(--unit-accent,#1FA6A2);fill-opacity:.22}";
CLASS_RULES.xo = ".xo{fill:var(--paper,#F7F4EC);fill-opacity:.55}";

/** Emit only the rules whose classes appear in `body`. */
export function styleFor(body) {
  const used = new Set();
  for (const m of body.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) used.add(c);
  const rules = [...used]
    .filter((c) => CLASS_RULES[c])
    .sort()
    .map((c) => CLASS_RULES[c]);
  return rules.join("");
}

export const n = (v) => {
  const r = Math.round(v * 10) / 10;
  return String(Object.is(r, -0) ? 0 : r);
};

/** The one SVG wrapper. `informative` art ships role=img + <title>; decorative art is aria-hidden. */
export function svg({ w, h, body, title, slice = false }) {
  const style = styleFor(body);
  const a11y = title
    ? `role="img"><title>${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`
    : 'aria-hidden="true" focusable="false">';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${slice ? ' preserveAspectRatio="xMidYMid slice"' : ""} ${a11y}<style>${style}</style>${body}</svg>\n`;
}

/** A group translated (and optionally scaled / flipped). */
export const at = (x, y, inner, s = 1, flip = false) => {
  const sc = flip ? `scale(${-s} ${s})` : s !== 1 ? `scale(${s})` : "";
  return `<g transform="translate(${n(x)} ${n(y)})${sc ? ` ${sc}` : ""}">${inner}</g>`;
};

// ------------------------------------------------------------------ people
/**
 * A friendly, simply-drawn person standing with feet at (0,0), about 118 units tall.
 * skin 1-5, hair: short | afro | bun | long | locs | cap | none, scarf: fill class letter (a, y, b, r, n, w) for a headscarf.
 * L / R: hand targets relative to the feet. sit: legs forward (use behind a table or on a seat).
 */
export function person({
  skin = 2,
  hair = "short",
  hc = 1,
  top = "a",
  bot = "k",
  dress = false,
  L = [-24, -42],
  R = [24, -42],
  sit = false,
  scarf = null,
  cap = "y",
  glasses = false,
} = {}) {
  const out = [];
  if (!scarf) {
    if (hair === "afro") out.push(`<circle cy="-99" r="21" class="xh${hc}"/>`);
    if (hair === "long")
      out.push(`<path d="M-15-97a15 15 0 0 1 30 0v26h-9v-14h-12v14h-9z" class="xh${hc}"/>`);
    if (hair === "locs")
      out.push(
        `<path d="M-16-96a16 16 0 0 1 32 0v30M-13-92v26M13-92v26" class="qh${hc}" stroke-width="5"/>`,
      );
    if (hair === "bun") out.push(`<circle cy="-116" r="7" class="xh${hc}"/>`);
  }
  if (sit) {
    out.push(
      `<path d="M-6-34H14V-6" class="q${bot}" stroke-width="12"/><path d="M8-3h16" class="qk" stroke-width="7"/>`,
    );
  } else if (dress) {
    out.push(
      `<path d="M-6-40V-6M6-40V-6" class="qs${skin}" stroke-width="7"/><path d="M-14-80h28l9 44h-46z" class="x${top}"/><path d="M-12-3h10M2-3h10" class="qk" stroke-width="6"/>`,
    );
  } else {
    out.push(
      `<path d="M-8-38V-6M8-38V-6" class="q${bot}" stroke-width="11"/><path d="M-14-3h12M2-3h12" class="qk" stroke-width="7"/>`,
    );
  }
  if (!dress) out.push(`<rect x="-15" y="-82" width="30" height="48" rx="13" class="x${top}"/>`);
  out.push(
    `<path d="M-13-73L${n(L[0])} ${n(L[1])}M13-73L${n(R[0])} ${n(R[1])}" class="q${top}" stroke-width="9"/>`,
  );
  out.push(
    `<circle cx="${n(L[0])}" cy="${n(L[1])}" r="5" class="xs${skin}"/><circle cx="${n(R[0])}" cy="${n(R[1])}" r="5" class="xs${skin}"/>`,
  );
  if (scarf) {
    out.push(
      `<path d="M-18-98a18 18 0 0 1 36 0v10c0 8-5 13-10 18h-16c-5-5-10-10-10-18z" class="x${scarf}"/><ellipse cy="-96" rx="10.5" ry="12" class="xs${skin}"/>`,
    );
  } else {
    out.push(
      `<rect x="-5" y="-88" width="10" height="12" class="xs${skin}"/><circle cy="-99" r="14" class="xs${skin}"/>`,
    );
    if (hair === "short" || hair === "long" || hair === "afro" || hair === "bun")
      out.push(`<path d="M-14-100a14 14 0 0 1 28 0c-5-6-11-8-14-8s-9 2-14 8z" class="xh${hc}"/>`);
    if (hair === "locs")
      out.push(`<path d="M-14-100a14 14 0 0 1 28 0c-6-5-10-7-14-7s-8 2-14 7z" class="xh${hc}"/>`);
    if (hair === "cap")
      out.push(
        `<path d="M-15-102a15 15 0 0 1 30 0z" class="x${cap}"/><path d="M-3-102h20" class="q${cap}" stroke-width="4"/>`,
      );
  }
  out.push(
    `<circle cx="-5" cy="-98" r="1.7" class="xe"/><circle cx="5" cy="-98" r="1.7" class="xe"/><path d="M-4.5-92q4.5 4 9 0" class="qe" stroke-width="1.8"/>`,
  );
  if (glasses)
    out.push(
      `<circle cx="-5.5" cy="-98" r="4.6" class="qe" stroke-width="1.4"/><circle cx="5.5" cy="-98" r="4.6" class="qe" stroke-width="1.4"/><path d="M-1-98h2" class="qe" stroke-width="1.4"/>`,
    );
  return `<g>${out.join("")}</g>`;
}

export const place = (x, y, opts, s = 1, flip = false) => at(x, y, person(opts), s, flip);

// ------------------------------------------------------------------ objects (local coords, origin = bottom centre unless noted)
export const sun = (x, y, r = 34) =>
  `<circle cx="${x}" cy="${y}" r="${r + 14}" class="xy" fill-opacity=".28"/><circle cx="${x}" cy="${y}" r="${r}" class="xy"/>`;
export const cloud = (x, y, s = 1) =>
  at(
    x,
    y,
    `<path d="M-34 0a14 14 0 0 1 8-25 18 18 0 0 1 33-4 14 14 0 0 1 24 12 12 12 0 0 1-3 17z" class="xw" fill-opacity=".85"/>`,
    s,
  );
export const shadow = (x, y, rx, ry = 6) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="xd"/>`;
export const ground = (w, y, h) => `<rect y="${y}" width="${w}" height="${h}" class="xg"/>`;
export const star4 = (x, y, r, cls = "xy") =>
  `<path d="M${x} ${y - r}q${r * 0.14} ${r * 0.86} ${r} ${r}q${-r * 0.86} ${r * 0.14} ${-r} ${r}q${-r * 0.14} ${-r * 0.86} ${-r} ${-r}q${r * 0.86} ${-r * 0.14} ${r} ${-r}z" class="${cls}"/>`;
export const tree = (x, y, s = 1, cls = "xn") =>
  at(
    x,
    y,
    `<rect x="-4" y="-34" width="8" height="34" rx="3" class="xs4"/><circle cy="-52" r="26" class="${cls}"/><circle cx="14" cy="-40" r="16" class="${cls}"/><circle cx="-15" cy="-38" r="15" class="${cls}"/>`,
    s,
  );
export const bush = (x, y, s = 1) =>
  at(
    x,
    y,
    `<circle cx="-14" cy="-10" r="12" class="xn"/><circle cx="2" cy="-16" r="16" class="xn"/><circle cx="18" cy="-10" r="11" class="xn"/>`,
    s,
  );
export const ball = (x, y, r = 14) =>
  `<circle cx="${x}" cy="${y}" r="${r}" class="xr"/><path d="M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}M${n(x - r * 0.7)} ${n(y - r * 0.7)}q${r * 0.7} ${r * 0.7} 0 ${r * 1.4}M${n(x + r * 0.7)} ${n(y - r * 0.7)}q${-r * 0.7} ${r * 0.7} 0 ${r * 1.4}" class="qk" stroke-width="1.6"/>`;
/** Scattered "math confetti": plain shapes only (plus, equals, circle, triangle, square). Decorative. */
export function confetti(points, cls = "xa") {
  const shapes = [
    (x, y) =>
      `<path d="M${x - 6} ${y}h12M${x} ${y - 6}v12" class="q${cls.slice(1)}" stroke-width="3"/>`,
    (x, y) =>
      `<path d="M${x - 6} ${y - 3}h12M${x - 6} ${y + 3}h12" class="q${cls.slice(1)}" stroke-width="3"/>`,
    (x, y) => `<circle cx="${x}" cy="${y}" r="5" class="${cls}"/>`,
    (x, y) => `<path d="M${x} ${y - 6}l6 11h-12z" class="${cls}"/>`,
    (x, y) => `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" class="${cls}"/>`,
  ];
  return points
    .map(([x, y], i) => `<g fill-opacity=".55" stroke-opacity=".55">${shapes[i % 5](x, y)}</g>`)
    .join("");
}
