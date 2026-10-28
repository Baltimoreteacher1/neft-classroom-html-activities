// Detectors for the family design system. Pure functions over CSS text and over page metrics, so
// tools/validate-family-design-tokens.mjs can drive each one at a known-bad fixture before it trusts a sweep.

import { parseColor } from "./color-math.mjs";
import { CAPS, parseBlocks } from "./family-tokens.mjs";

export const APPROVED_FAMILIES = new Set([
  "baloo 2",
  "baloo 2 fallback",
  "nunito",
  "nunito fallback",
  "atkinson hyperlegible",
  "atkinson hyperlegible fallback",
  "arial rounded mt bold",
  "system-ui",
  "-apple-system",
  "segoe ui",
  "sans-serif",
]);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/* ───────────────────────────── static CSS checks ───────────────────────────── */

/** Every rule must live in a layer (or be a @font-face). Returns problem strings. */
export function unlayered(css) {
  const tree = parseBlocks(css);
  return tree.children
    .filter((c) => !/^@(layer|font-face)\b/.test(c.selector))
    .map((c) => `rule outside any @layer: ${c.selector.slice(0, 60)}`);
}

export function layerStatement(css, expected) {
  return stripComments(css).replace(/\s+/g, " ").includes(expected)
    ? []
    : [`missing the layer statement: ${expected}`];
}

const COLOR_FUNCS =
  /(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\bhwb\(|\boklch\(|\boklab\(|\blab\(|\blch\(|color-mix\(|\bcolor\()/;
const NAMED =
  /\b(white|red|blue|green|yellow|orange|purple|pink|gray|grey|navy|teal|silver|maroon|violet|indigo|magenta|cyan|brown|gold)\b/i;
const COLOR_PROPS =
  /^(color|background|background-color|border|border-color|border-[a-z-]+-color|border-block[a-z-]*|border-inline[a-z-]*|outline|outline-color|fill|stroke|box-shadow|text-decoration-color|caret-color|accent-color)$/;

/** Declarations as [property, value, selectorText] with data URIs and url() contents removed. */
export function declarations(css) {
  const out = [];
  const src = stripComments(css).replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g, "url()");
  const re = /([a-z-]+)\s*:\s*([^;{}]+);/gi;
  let m = re.exec(src);
  while (m) {
    out.push([m[1].toLowerCase(), m[2].trim()]);
    m = re.exec(src);
  }
  return out;
}

/** Raw colour values outside tokens.css. */
export function rawColors(css) {
  const probs = [];
  for (const [prop, value] of declarations(css)) {
    if (prop.startsWith("--") && !COLOR_PROPS.test(prop)) {
      if (COLOR_FUNCS.test(value)) probs.push(`${prop}: ${value}`);
      continue;
    }
    if (COLOR_FUNCS.test(value)) probs.push(`${prop}: ${value}`);
    else if (COLOR_PROPS.test(prop) && NAMED.test(value) && !/mask/.test(prop))
      probs.push(`${prop}: ${value}`);
  }
  return probs;
}

/** `!important` is allowed only with a documentation comment in the eight lines above it. */
export function undocumentedImportant(css) {
  // Blank out comment bodies (keeping line breaks) so prose that mentions !important is not a use.
  const code = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  const lines = css.split("\n");
  const bad = [];
  for (const [i, line] of code.split("\n").entries()) {
    if (!/!important/.test(line)) continue;
    const above = lines.slice(Math.max(0, i - 8), i).join("\n");
    if (!/!important \(documented/.test(above)) bad.push(`line ${i + 1}: ${lines[i].trim()}`);
  }
  return bad;
}

const PHYSICAL =
  /^(margin-(left|right|top|bottom)|padding-(left|right|top|bottom)|(left|right|top|bottom)|border-(left|right|top|bottom)(-[a-z]+)?|float|clear|width|height|min-width|max-width|min-height|max-height|overflow-[xy]|scroll-margin-(left|right|top|bottom)|scroll-padding-(left|right|top|bottom))$/;

/** Physical properties where a logical one exists (the brief asks for logical properties). */
export function physicalProps(css) {
  const bad = [];
  for (const [prop, value] of declarations(css)) {
    if (PHYSICAL.test(prop)) bad.push(`${prop}: ${value}`);
    if (prop === "text-align" && /^(left|right)$/.test(value)) bad.push(`${prop}: ${value}`);
  }
  return bad;
}

export function fontViolations(css) {
  const bad = [];
  for (const [prop, value] of declarations(css)) {
    if (
      prop === "font-family" &&
      !/^(var\(--fm-font-(display|text)\)|inherit)( !important)?$/.test(value)
    )
      bad.push(`font-family: ${value}`);
    if (
      prop === "font-size" &&
      !/^(var\(--fm-fs-[a-z0-9]+\)|inherit|calc\(100% \* var\(--fm-text-scale\)\))$/.test(value)
    )
      bad.push(`font-size: ${value}`);
  }
  return bad;
}

/** Selectors containing an ID (outside attribute strings). */
export function idSelectors(css) {
  const tree = parseBlocks(css);
  const bad = [];
  const visit = (n) => {
    for (const c of n.children) {
      const sel = c.selector.replace(/\[[^\]]*\]/g, "[]");
      if (!sel.startsWith("@") && /#[A-Za-z_-]/.test(sel)) bad.push(sel);
      visit(c);
    }
  };
  visit(tree);
  return bad;
}

/** Specificity of one selector as [ids, classes, elements]. */
export function specificity(selector) {
  let s = selector.replace(/"[^"]*"|'[^']*'/g, '""');
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const max = (list) => list.reduce((m, x) => (cmp(x, m) > 0 ? x : m), [0, 0, 0]);
  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  let total = [0, 0, 0];
  // :where() is zero; :is/:not/:has take their most specific argument
  s = s.replace(/:where\([^)]*\)/g, "");
  s = s.replace(/:(is|not|has)\(([^)]*)\)/g, (_, _n, arg) => {
    total = add(total, max(arg.split(",").map((a) => specificity(a.trim()))));
    return "";
  });
  total = add(total, [(s.match(/#[\w-]+/g) || []).length, 0, 0]);
  total = add(total, [
    0,
    (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+(\([^)]*\))?/g) || []).length,
    0,
  ]);
  const stripped = s
    .replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|::?[\w-]+(\([^)]*\))?/g, " ")
    .replace(/[>+~*]/g, " ");
  const els = stripped.split(/\s+/).filter((t) => /^[a-z][\w-]*$/i.test(t)).length;
  const pseudoEls = (s.match(/::[\w-]+/g) || []).length;
  return add(total, [0, 0, els + pseudoEls]);
}

const cmpSpec = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export function maxSpecificity(css) {
  const tree = parseBlocks(css);
  let worst = { spec: [0, 0, 0], selector: "" };
  const visit = (n) => {
    for (const c of n.children) {
      if (!c.selector.startsWith("@") && !/^(from|to|\d+%)/.test(c.selector)) {
        for (const part of c.selector.split(/,(?![^(]*\))/)) {
          const spec = specificity(part.trim());
          if (cmpSpec(spec, worst.spec) > 0) worst = { spec, selector: part.trim() };
        }
      }
      visit(c);
    }
  };
  visit(tree);
  return worst;
}

/** Inline style attributes in HTML other than a data-driven custom property. */
export function inlineStyles(html) {
  const bad = [];
  for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) {
    const decls = m[1]
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean);
    if (!decls.every((d) => /^--[\w-]+\s*:/.test(d))) bad.push(m[1]);
  }
  return bad;
}

/* ───────────────────────────── rendered-page judgment ───────────────────────────── */

/** Families (paper, ink, ...) a computed colour belongs to, given the active theme's token map. */
export function colorIndex(modeMap, familyOf, unit) {
  const idx = new Map();
  for (const [name, value] of Object.entries(modeMap)) {
    if (name.startsWith("--unit-")) {
      const m = name.match(/^--unit-(\d+)-/);
      if (!m || (unit !== "all" && m[1] !== String(unit))) continue;
    }
    const fam = familyOf(name);
    const c = parseColor(value);
    if (!fam || !c) continue;
    const key = `${c.r},${c.g},${c.b}`;
    if (!idx.has(key)) idx.set(key, { family: fam, name });
  }
  return idx;
}

/**
 * Judge one rendered page. `m` is what the in-page collector returned.
 * Returns problem strings; empty means within every product cap.
 */
export function judgeMetrics(m, { colorIdx, reading = "default", minElements = 150 } = {}) {
  const bad = [];
  if (m.elements < minElements)
    bad.push(
      `only ${m.elements} visible elements were measured (need ${minElements}): the sweep did not see the page`,
    );
  const used = new Set();
  const off = [];
  for (const [rgba] of Object.entries(m.colors)) {
    const p = parseColor(rgba);
    if (!p || p.a === 0) continue;
    const hit = colorIdx.get(`${p.r},${p.g},${p.b}`);
    if (hit) used.add(hit.family);
    else off.push(rgba);
  }
  if (off.length) bad.push(`colours that are not tokens: ${off.slice(0, 6).join(", ")}`);
  if (used.size > CAPS.colorFamilies)
    bad.push(`${used.size} colour families > ${CAPS.colorFamilies}: ${[...used].join(", ")}`);
  if (m.sizes.length > CAPS.fontSizes)
    bad.push(`${m.sizes.length} distinct font sizes > ${CAPS.fontSizes}: ${m.sizes.join(", ")}`);
  if (m.radii.length > CAPS.radii)
    bad.push(`${m.radii.length} distinct radii > ${CAPS.radii}: ${m.radii.join(" | ")}`);
  if (m.shadows.length > CAPS.shadows)
    bad.push(`${m.shadows.length} distinct shadows > ${CAPS.shadows}`);
  for (const f of m.families) {
    for (const name of f.split(",").map((s) =>
      s
        .trim()
        .replace(/^["']|["']$/g, "")
        .toLowerCase(),
    )) {
      if (!APPROVED_FAMILIES.has(name)) bad.push(`font-family outside the approved two: ${f}`);
    }
    const first = f.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    if (reading !== "dyslexia" && first === "atkinson hyperlegible")
      bad.push("Atkinson Hyperlegible is on the page without the dyslexia-friendly option");
    if (reading === "dyslexia" && (first === "baloo 2" || first === "nunito"))
      bad.push("the dyslexia-friendly option left a default family on the page");
  }
  if (m.tiny.length) bad.push(`visible text under 13px: ${m.tiny.slice(0, 5).join(" | ")}`);
  if (m.cardDepth.length) bad.push(`cards nested too deep: ${m.cardDepth.slice(0, 3).join(" | ")}`);
  if (m.external.length)
    bad.push(`requests leave the page origin: ${m.external.slice(0, 3).join(", ")}`);
  if (m.lowContrast.length)
    bad.push(
      `${m.lowContrast.length} text runs under AA: ${m.lowContrast.slice(0, 4).join(" | ")}`,
    );
  if (m.fontsLoaded.length === 0) bad.push("no web font finished loading");
  return [...new Set(bad)];
}
