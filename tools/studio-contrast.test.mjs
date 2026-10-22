// Contrast of the Practice Studio palettes: every world, light and dark, against WCAG 2.2 AA.
// Reads the shipped CSS (assets/u4-studio.css :root + assets/studio-worlds.css), not the generator, so it checks what students get.
//
//   node tools/studio-contrast.test.mjs
//
// Text pairs need 4.5:1; non-text edges (the borders that define an input or card) need 3:1.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const read = (/** @type {string} */ p) => readFileSync(join(REPO_ROOT, p), "utf8");
const base = read("assets/u4-studio.css");
const worldsCss = read("assets/studio-worlds.css");
const worlds = JSON.parse(read("data/practice-studio/worlds.json")).worlds;

/** `--name: value;` declarations of one block. */
function declarations(/** @type {string} */ block) {
  const out = /** @type {Record<string, string>} */ ({});
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
/** The declarations of the rule whose selector is exactly `selector`. */
function rule(/** @type {string} */ css, /** @type {string} */ selector) {
  const at = css.indexOf(`${selector} {`);
  if (at < 0) return {};
  return declarations(css.slice(at, css.indexOf("\n}", at)));
}

/** @returns {number[]} sRGB 0-255 */
function parse(/** @type {string} */ value, /** @type {Record<string, string>} */ vars) {
  const v = value.trim();
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) return parse(vars[ref[1]], vars);
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  }
  const hs = v.match(/^hsl\(\s*([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\s*\)$/);
  if (hs) {
    const [h, s, l] = [Number(hs[1]), Number(hs[2]) / 100, Number(hs[3]) / 100];
    const k = (/** @type {number} */ n) => (n + h / 30) % 12;
    const c = s * Math.min(l, 1 - l);
    return [0, 8, 4].map((n) => 255 * (l - c * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  }
  throw new Error(`cannot read colour "${value}"`);
}
function luminance(/** @type {number[]} */ rgb) {
  const [r, g, b] = rgb.map((c) => {
    const u = c / 255;
    return u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(/** @type {number[]} */ a, /** @type {number[]} */ b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ["paper", "surface", "surface-soft", "well"];
/** [foreground, background, minimum ratio] */
const PAIRS = [
  ...SURFACES.flatMap((s) => [
    ["ink", s, 4.5],
    ["ink-muted", s, 4.5],
    ["ink-light", s, 4.5],
    ["brand", s, 4.5],
  ]),
  ["ink", "brand-tint", 4.5],
  ["ink", "sun-tint", 4.5],
  ["sun-ink", "sun-tint", 4.5],
  ["on-brand", "brand", 4.5],
  ["on-sun", "sun", 4.5],
  ["on-ok", "ok", 4.5],
  ["on-bad", "bad", 4.5],
  ["ok-ink", "ok-tint", 4.5],
  ["bad-ink", "bad-tint", 4.5],
  ["warn-ink", "warn-tint", 4.5],
  ["border-strong", "surface", 3],
  ["border-strong", "paper", 3],
  ["border-strong", "surface-soft", 3],
];

const rootVars = rule(base, ":root");
const u4Dark = rule(base, 'body[data-theme="dark"]');
const failures = /** @type {string[]} */ ([]);
let checks = 0;
// Unit 4 has no world: its light palette is :root, its night palette is the body[data-theme="dark"] block. The three
// quantity colours (fraction, decimal, percent) are also used as text, and each carries its own on-colour.
const U4_PAIRS = [
  ...PAIRS,
  ...SURFACES.flatMap((s) => ["frac", "dec", "pct"].map((q) => [q, s, 4.5])),
  ["on-frac", "frac", 4.5],
  ["on-dec", "dec", 4.5],
  ["on-pct", "pct", 4.5],
  ["on-warn", "warn", 4.5],
];
// Cascade order on a generated page: :root, the Unit 4 night block, the world's day block, then its night block.
const palettes = [
  ...["light", "dark"].map((theme) => ({
    label: `unit-4/${theme}`,
    pairs: U4_PAIRS,
    vars: { ...rootVars, ...(theme === "dark" ? u4Dark : {}) },
  })),
  ...Object.keys(worlds).flatMap((id) =>
    ["light", "dark"].map((theme) => ({
      label: `${id}/${theme}`,
      pairs: PAIRS,
      vars: {
        ...rootVars,
        ...(theme === "dark" ? u4Dark : {}),
        ...rule(worldsCss, `body[data-world="${id}"]`),
        ...(theme === "dark" ? rule(worldsCss, `body[data-world="${id}"][data-theme="dark"]`) : {}),
      },
    })),
  ),
];
for (const { label, pairs, vars } of palettes) {
  {
    for (const [fg, bg, min] of pairs) {
      checks += 1;
      if (!vars[`--${fg}`] || !vars[`--${bg}`]) {
        failures.push(`${label}: --${fg} or --${bg} is not defined`);
        continue;
      }
      const got = ratio(parse(vars[`--${fg}`], vars), parse(vars[`--${bg}`], vars));
      if (got < min)
        failures.push(`${label}: --${fg} on --${bg} is ${got.toFixed(2)}:1, needs ${min}:1`);
    }
  }
}
assert.equal(
  failures.length,
  0,
  `${failures.length} contrast failure(s):\n  ${failures.join("\n  ")}`,
);

// Reading text is neutral: a trace of the world's hue, never a tint a student reads as coloured.
for (const id of Object.keys(worlds)) {
  for (const theme of ["light", "dark"]) {
    const block =
      theme === "dark"
        ? rule(worldsCss, `body[data-world="${id}"][data-theme="dark"]`)
        : rule(worldsCss, `body[data-world="${id}"]`);
    for (const t of ["ink", "ink-muted", "ink-light"]) {
      const sat = Number(block[`--${t}`].match(/hsl\([\d.]+,\s*([\d.]+)%/)?.[1]);
      assert.ok(sat <= 8, `${id}/${theme}: --${t} saturation ${sat}% is not neutral reading text`);
    }
  }
}

// Dark surfaces step up in lightness: page < card < raised card, so depth reads without a shadow.
for (const id of Object.keys(worlds)) {
  const vars = {
    ...rootVars,
    ...rule(worldsCss, `body[data-world="${id}"]`),
    ...rule(worldsCss, `body[data-world="${id}"][data-theme="dark"]`),
  };
  const L = (/** @type {string} */ t) => luminance(parse(vars[`--${t}`], vars));
  assert.ok(
    L("paper") < L("surface") && L("surface") < L("surface-soft"),
    `${id}/dark: paper < surface < surface-soft must step up`,
  );
}

// Worlds are told apart by hue: no two worlds share a hue family.
const hues = Object.values(worlds).map((w) => /** @type {number} */ (w.hue));
for (let i = 0; i < hues.length; i++)
  for (let j = i + 1; j < hues.length; j++) {
    const d = Math.abs(hues[i] - hues[j]);
    assert.ok(
      Math.min(d, 360 - d) >= 12,
      `worlds ${i} and ${j} are ${Math.min(d, 360 - d)}° apart in hue`,
    );
  }

console.log(
  `studio contrast: Unit 4 + ${Object.keys(worlds).length} worlds x light/dark, ${checks} pair checks — all clear.`,
);
