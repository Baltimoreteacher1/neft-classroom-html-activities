// shared/ui style gate. (1) every declared contrast pair, in light and dark, is COMPUTED from the real tokens
// (engine/styles/ds-tokens.generated.css) through theme.css and must meet its floor; (2) every colour role in
// theme.css is covered by a pair; (3) the CSS hygiene rules: no purple/violet, no raw colour literal, logical
// properties only, no !important, 3px focus ring, 44px targets, motion on --ui-motion, no page-break rules, no
// external URL. Each rule is a function that is also run on a known-bad snippet it MUST flag (negative control).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { contrast, isForbiddenHue, parseColor, toHex } from "./lib/color-math.mjs";
import { findForbiddenLiterals } from "./validate-palette.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const { CONTRAST_PAIRS, NOT_CONTRAST, THEMES } = await import("../shared/ui/contrast-pairs.js");

const UI_CSS = [
  "shared/ui/theme.css",
  "shared/ui/ui.css",
  "shared/ui/print.css",
  "shared/ui/fonts.css",
  "bcpss-teachers/studio/design/specimen.css",
];
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/* ---- tokens and roles ---- */

function declarations(body) {
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
export const dsTokens = () =>
  declarations(stripComments(read("engine/styles/ds-tokens.generated.css")));

/** { light: {--ui-x: value}, dark: {...} } from the theme blocks of theme.css (dark overrides light). */
export function themeBlocks(css) {
  const blocks = { light: {}, dark: {} };
  for (const m of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (m[1].includes('[data-ui-theme="light"]')) Object.assign(blocks.light, declarations(m[2]));
    if (m[1].includes('[data-ui-theme="dark"]')) Object.assign(blocks.dark, declarations(m[2]));
  }
  return blocks;
}

export function resolveColour(name, decls, tokens) {
  let value = decls[name] ?? tokens[name];
  for (let hops = 0; value !== undefined && hops < 8; hops++) {
    const ref = value.match(/^var\((--[\w-]+)\)$/);
    if (!ref) break;
    value = decls[ref[1]] ?? tokens[ref[1]];
  }
  return value === undefined ? null : parseColor(value);
}

/** Problems for one theme: every pair computed against its floor, unresolvable roles, forbidden hues. */
export function pairProblems(theme, pairs, blocks, tokens) {
  const decls = theme === "dark" ? { ...blocks.light, ...blocks.dark } : blocks.light;
  const problems = [];
  for (const p of pairs) {
    const fg = resolveColour(p.fg, decls, tokens);
    const bg = resolveColour(p.bg, decls, tokens);
    if (!fg || !bg) {
      problems.push(`${theme}: cannot resolve ${!fg ? p.fg : p.bg} (${p.use})`);
      continue;
    }
    const ratio = contrast(fg, bg);
    if (ratio < p.min)
      problems.push(
        `${theme}: ${p.use}: ${p.fg} ${toHex(fg)} on ${p.bg} ${toHex(bg)} is ${ratio.toFixed(2)}, needs ${p.min}`,
      );
  }
  for (const name of Object.keys(decls)) {
    const c = resolveColour(name, decls, tokens);
    if (c && isForbiddenHue(c))
      problems.push(
        `${theme}: ${name} ${toHex(c)} is in the forbidden violet/purple/magenta hue range`,
      );
  }
  return problems;
}

export function uncoveredRoles(theme, pairs, blocks) {
  const covered = new Set(pairs.flatMap((p) => [p.fg, p.bg]));
  const own = theme === "dark" ? blocks.dark : blocks.light;
  return Object.keys(own).filter((n) => !covered.has(n) && !(n in NOT_CONTRAST));
}

/* ---- css hygiene ---- */

const PHYSICAL = [
  [/(?<![\w-])(margin|padding)-(left|right|top|bottom)\s*:/, "physical margin/padding side"],
  [/(?<![\w-])border-(left|right|top|bottom)(-[a-z-]+)?\s*:/, "physical border side"],
  [/(?<![\w-])border-(top|bottom)-(left|right)-radius\s*:/, "physical corner radius"],
  [/(?<![\w-])(left|right|top|bottom)\s*:(?!:)/, "physical offset"],
  [/(?<![\w-])(min-|max-)?(width|height)\s*:/, "physical size"],
  [/(?<![\w-])float\s*:/, "float"],
  [/(?<![\w-])text-align\s*:\s*(left|right)\b/, "physical text-align"],
];

export function hygieneProblems(name, rawCss, { strictFocus = false } = {}) {
  const css = stripComments(rawCss);
  const problems = [];
  const add = (what) => problems.push(`${name}: ${what}`);
  if (/!important/i.test(css)) add("uses !important");
  if (/#[0-9a-f]{3,8}\b/i.test(css)) add("raw hex colour (use a --ds-* token)");
  if (/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i.test(css))
    add("raw colour function (use a --ds-* token)");
  for (const hit of findForbiddenLiterals(rawCss))
    add(`purple/violet value at line ${hit.line}: ${hit.text}`);
  for (const [re, what] of PHYSICAL)
    if (re.test(css.replace(/url\([^)]*\)/g, ""))) add(`${what} (use logical properties)`);
  if (/(page-)?break-(before|after|inside)\s*:/i.test(css)) add("page-break rule");
  if (/@import|url\(\s*["']?(https?:)?\/\//i.test(css)) add("external or imported resource");
  for (const m of css.matchAll(/(?<![\w-])(transition|animation)(-duration)?\s*:\s*([^;]+);/g)) {
    if (!m[3].includes("var(--ui-motion)") && !/^(none|0s?|0ms)$/.test(m[3].trim()))
      add(`${m[1]} not on var(--ui-motion): ${m[3].trim().slice(0, 40)}`);
  }
  if (strictFocus) {
    for (const m of css.matchAll(/([^{}]+:focus-visible[^{}]*)\{([^{}]*)\}/g)) {
      if (
        !/outline:\s*3px solid/.test(m[2]) &&
        !/outline-offset/.test(m[2]) &&
        !/outline-color/.test(m[2])
      )
        add(`focus rule without a 3px outline: ${m[1].trim().slice(0, 50)}`);
    }
  }
  return problems;
}

/* ---- tests ---- */

test("every declared contrast pair meets its floor in light and dark (computed from the tokens)", () => {
  const blocks = themeBlocks(read("shared/ui/theme.css"));
  const tokens = dsTokens();
  assert.deepEqual(THEMES, ["light", "dark"]);
  for (const theme of THEMES) {
    assert.ok(CONTRAST_PAIRS[theme].length >= 25, `${theme}: suspiciously few pairs`);
    assert.deepEqual(pairProblems(theme, CONTRAST_PAIRS[theme], blocks, tokens), []);
  }
});

test("every colour role in theme.css is covered by a pair (or listed as non-contrast with a reason)", () => {
  const blocks = themeBlocks(read("shared/ui/theme.css"));
  assert.ok(
    Object.keys(blocks.light).length > 25 && Object.keys(blocks.dark).length > 10,
    "theme blocks parsed",
  );
  for (const theme of THEMES)
    assert.deepEqual(uncoveredRoles(theme, CONTRAST_PAIRS[theme], blocks), []);
  for (const [role, why] of Object.entries(NOT_CONTRAST))
    assert.ok(why.length > 10, `${role} needs a reason`);
});

test("theme.css adds no colour of its own: every role resolves through a --ds-* token", () => {
  const blocks = themeBlocks(read("shared/ui/theme.css"));
  const tokens = dsTokens();
  for (const theme of THEMES) {
    for (const [name, value] of Object.entries(blocks[theme])) {
      if (name in NOT_CONTRAST) continue;
      assert.match(
        value,
        /^var\(--ds-[\w-]+\)$/,
        `${theme} ${name} must be var(--ds-*), got ${value}`,
      );
      assert.ok(`${value.slice(4, -1)}` in tokens, `${theme} ${name}: ${value} is not a token`);
    }
  }
});

test("CSS hygiene: no purple, raw colour, physical property, !important, page-break, external URL; motion on --ui-motion", () => {
  for (const file of UI_CSS) {
    assert.deepEqual(
      hygieneProblems(file, read(file), { strictFocus: file.endsWith("ui.css") }),
      [],
    );
  }
});

test("every var() the components use exists: --ds-* in the generated tokens, --ui-* in theme.css", () => {
  const tokens = dsTokens();
  const roles = themeBlocks(read("shared/ui/theme.css")).light;
  for (const file of UI_CSS) {
    for (const m of stripComments(read(file)).matchAll(/var\((--[\w-]+)/g)) {
      const ok = m[1].startsWith("--ds-") ? m[1] in tokens : m[1] in roles;
      assert.ok(ok, `${file}: var(${m[1]}) is not defined`);
    }
  }
});

test("ui.css: 3px focus ring, 44px targets, reduced-motion switch, print reset without page breaks", () => {
  const ui = stripComments(read("shared/ui/ui.css"));
  assert.match(ui, /outline:\s*3px solid var\(--ui-focus\)/);
  for (const sel of [".ui-btn", ".ui-tab", ".ui-band__text"]) {
    const m = ui.match(new RegExp(`(?:^|\\})\\s*${sel.replace(".", "\\.")}\\s*\\{([^}]*)\\}`));
    assert.ok(
      m && /min-block-size:\s*var\(--ds-target\)/.test(m[1]),
      `${sel} must be at least the 44px target`,
    );
  }
  assert.equal(parseFloat(dsTokens()["--ds-target"]), 44);
  assert.match(
    stripComments(read("shared/ui/theme.css")),
    /prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\{[^}]*--ui-motion:\s*0ms/,
  );
  const print = stripComments(read("shared/ui/print.css"));
  assert.match(print, /@media print/);
  assert.match(print, /@page\s*\{\s*margin:\s*0\.5in/);
  assert.match(print, /\.ui-no-print/);
});

test("fonts: only the existing self-hosted woff2 files, all present", () => {
  const css = read("shared/ui/fonts.css");
  const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.equal(urls.length, 3);
  for (const u of urls) {
    assert.match(u, /^\/engine\/styles\/fonts\/[\w-]+\.woff2$/);
    assert.ok(existsSync(join(ROOT, u)), `${u} must exist`);
  }
});

test("shared/ui JS is browser-safe plain ESM (no Node imports, no JSON import attributes, no innerHTML)", () => {
  for (const f of [
    "h",
    "button",
    "badge",
    "card",
    "tabs",
    "dialog",
    "band-selector",
    "vocabulary-card",
    "activity-card",
    "print-sheet",
    "index",
    "contrast-pairs",
  ]) {
    const src = read(`shared/ui/${f}.js`);
    assert.ok(
      !/from\s+["']node:/.test(src) && !/\bprocess\./.test(src) && !/with\s*\{\s*type/.test(src),
      `${f}.js is not browser-safe`,
    );
    assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML\s*=/.test(src), `${f}.js writes markup`);
    assert.ok(!/https?:\/\//.test(src), `${f}.js makes or names an external call`);
  }
});

/* ---- negative controls: each rule MUST fire on a known-bad fixture ---- */

test("negative control: a failing pair, a purple role and an unlisted role are all reported", () => {
  const tokens = dsTokens();
  const badBlocks = {
    light: {
      "--ui-text": "var(--ds-color-teal)",
      "--ui-surface": "var(--ds-color-white)",
      "--ui-extra": "var(--ds-color-amber)",
    },
    dark: {},
  };
  const pairs = [{ fg: "--ui-text", bg: "--ui-surface", min: 4.5, use: "fixture" }];
  const problems = pairProblems("light", pairs, badBlocks, tokens);
  assert.ok(
    problems.some((p) => /is [\d.]+, needs 4\.5/.test(p)),
    "teal on white must fail 4.5",
  );
  assert.deepEqual(uncoveredRoles("light", pairs, badBlocks), ["--ui-extra"]);
  const purple = { ...tokens, "--ds-color-teal": "#6d28d9" };
  assert.ok(
    pairProblems("light", pairs, badBlocks, purple).some((p) => /forbidden/.test(p)),
    "a violet token is flagged",
  );
  assert.ok(
    pairProblems(
      "light",
      [{ fg: "--nope", bg: "--ui-surface", min: 3, use: "x" }],
      badBlocks,
      tokens,
    ).some((p) => /cannot resolve/.test(p)),
  );
});

test("negative control: the hygiene linter flags every banned construct", () => {
  const bad = `
    .a { margin-left: 4px; color: #5b21b6; width: 10px; float: left; text-align: right; }
    .b { color: rgb(1, 2, 3); background: var(--x) !important; break-before: page; }
    .c { transition: color 200ms ease; animation: spin 1s; left: 0; border-top-left-radius: 4px; }
    .d { background: url(https://cdn.example.com/x.png); }
    @import "x.css";
    .e:focus-visible { outline: 1px solid red; }`;
  const text = hygieneProblems("fixture.css", bad, { strictFocus: true }).join("\n");
  for (const re of [
    /!important/,
    /raw hex/,
    /raw colour function/,
    /purple\/violet/,
    /physical margin/,
    /physical size/,
    /float/,
    /physical text-align/,
    /physical offset/,
    /physical corner/,
    /page-break/,
    /external or imported/,
    /transition not on var\(--ui-motion\)/,
    /animation not on var\(--ui-motion\)/,
    /focus rule without a 3px outline/,
  ])
    assert.match(text, re);
  assert.deepEqual(
    hygieneProblems(
      "ok.css",
      ".ok { margin-inline: 4px; inline-size: 2rem; transition: color var(--ui-motion) ease; }",
    ),
    [],
  );
});
