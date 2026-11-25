#!/usr/bin/env node
/**
 * validate-scaffold-contrast.mjs: Scaffold Studio's colour tokens are computed, not typed.
 *
 * Reads access-practice-lab/scaffold-studio.css, resolves the three themes (light is the .ss-root block, dark and
 * high contrast override it), and computes WCAG 2.x contrast for every declared pair on the colours as written.
 * Targets: AAA (7:1) for body text and chunk labels, AA (4.5:1) for secondary text and links, 3:1 for control edges,
 * focus rings and large UI. It also fails any token in the violet/purple/magenta hue range (a standing product rule).
 *
 * Self-tests first: a known-bad pair, a purple token and a missing theme must each be caught, and a sweep of zero
 * pairs fails, so a parser that stops matching cannot report a clean palette.
 *
 *   node tools/validate-scaffold-contrast.mjs [--report]
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contrast, isForbiddenHue, parseColor } from "./lib/color-math.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = join(ROOT, "access-practice-lab/scaffold-studio.css");
export const THEMES = ["light", "dark", "hc"];
export const ROLES = ["who", "did", "where", "when", "how", "why", "what"];

/** [fg token, bg token, minimum ratio, what it is] */
export const PAIRS = [
  ["ink", "bg", 7, "body text on page"],
  ["ink", "surface", 7, "body text on card"],
  ["ink", "surface-2", 7, "body text on raised card"],
  ["ink-2", "bg", 7, "secondary text on page"],
  ["ink-2", "surface", 7, "secondary text on card"],
  ["ink-3", "bg", 4.5, "meta text on page"],
  ["ink-3", "surface", 4.5, "meta text on card"],
  ["brand", "bg", 4.5, "link / outline button text on page"],
  ["brand", "surface", 4.5, "link / outline button text on card"],
  ["on-brand", "brand", 4.5, "text on filled button"],
  ["accent", "bg", 4.5, "accent text on page"],
  ["accent", "surface", 4.5, "accent text on card"],
  ["gold", "bg", 4.5, "gold text on page"],
  ["ok", "bg", 4.5, "success text"],
  ["err", "bg", 4.5, "error text"],
  ["line-strong", "bg", 3, "control edge on page"],
  ["line-strong", "surface", 3, "control edge on card"],
  ["focus", "bg", 3, "focus ring on page"],
  ["focus", "surface", 3, "focus ring on card"],
  ["brand", "bg", 3, "button edge on page"],
  ...ROLES.map((r) => [`${r}-ink`, `${r}-bg`, 7, `chunk label "${r}"`]),
];

/** { light: {token: "#hex"}, dark: {...}, hc: {...} } with dark and hc layered over light. */
export function resolveThemes(css) {
  const grab = (selector) => {
    const m = css.match(
      new RegExp(`${selector.replace(/[.[\]"=]/g, "\\$&")}\\s*\\{([\\s\\S]*?)\\n\\}`),
    );
    if (!m) return null;
    const out = {};
    for (const [, name, value] of m[1].matchAll(/--ss-([a-z0-9-]+):\s*([^;]+);/g))
      out[name] = value.trim();
    return out;
  };
  const light = grab(".ss-root");
  const dark = grab('.ss-root[data-ss-theme="dark"]');
  const hc = grab('.ss-root[data-ss-theme="hc"]');
  if (!light || !dark || !hc) return null;
  return { light, dark: { ...light, ...dark }, hc: { ...light, ...hc } };
}

export function check(themes, { pairs = PAIRS, themeNames = THEMES } = {}) {
  const failures = [];
  let measured = 0;
  const rows = [];
  for (const t of themeNames) {
    const tokens = themes?.[t];
    if (!tokens) {
      failures.push(`theme "${t}" is missing`);
      continue;
    }
    for (const [name, value] of Object.entries(tokens)) {
      const c = parseColor(value);
      if (c && isForbiddenHue(c))
        failures.push(`${t}: --ss-${name} ${value} is in the violet/purple/magenta range`);
    }
    for (const [fg, bg, min, what] of pairs) {
      const f = parseColor(tokens[fg] || "");
      const b = parseColor(tokens[bg] || "");
      if (!f || !b) {
        failures.push(`${t}: ${fg} on ${bg} (${what}) has an unreadable colour`);
        continue;
      }
      measured++;
      const ratio = contrast(f, b);
      rows.push({ theme: t, fg, bg, what, min, ratio });
      if (ratio < min)
        failures.push(`${t}: ${fg} on ${bg} (${what}) is ${ratio.toFixed(2)}:1, needs ${min}:1`);
    }
  }
  return { failures, measured, rows };
}

function selfTest() {
  const good = { ink: "#000000", bg: "#ffffff" };
  const t = (tokens) => ({ light: tokens, dark: tokens, hc: tokens });
  const pair = [["ink", "bg", 7, "x"]];
  const run = (tokens) => check(t(tokens), { pairs: pair });
  const bad = [
    ["low contrast", run({ ink: "#999999", bg: "#ffffff" }), /needs 7/],
    ["purple token", run({ ...good, accent: "#7c3aed" }), /violet\/purple/],
    ["unreadable colour", run({ ink: "nope", bg: "#fff" }), /unreadable/],
    ["missing theme", check({ light: good, dark: good }, { pairs: pair }), /missing/],
  ];
  for (const [name, res, re] of bad)
    if (!res.failures.some((f) => re.test(f)))
      throw new Error(`self-test: "${name}" was not caught`);
  if (run(good).failures.length) throw new Error("self-test: a clean palette was rejected");
  if (check(t(good), { pairs: [] }).measured !== 0)
    throw new Error("self-test: measured count wrong");
}

function main() {
  selfTest();
  const themes = resolveThemes(readFileSync(CSS, "utf8"));
  if (!themes) {
    console.error("FAIL scaffold-studio.css: could not read the three theme blocks");
    process.exit(1);
  }
  const { failures, measured, rows } = check(themes);
  if (measured < PAIRS.length * THEMES.length)
    failures.push(`only ${measured} pairs measured, expected ${PAIRS.length * THEMES.length}`);
  if (process.argv.includes("--report"))
    for (const r of rows)
      console.log(
        `${r.theme.padEnd(5)} ${r.fg}/${r.bg} ${r.ratio.toFixed(2)}:1 (min ${r.min}) ${r.what}`,
      );
  if (failures.length) {
    console.error(`FAIL validate-scaffold-contrast: ${failures.length} problem(s)`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(
    `PASS validate-scaffold-contrast: ${measured} pairs across ${THEMES.length} themes, no purple`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
