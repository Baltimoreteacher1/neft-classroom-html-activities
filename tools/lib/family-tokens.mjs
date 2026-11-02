// Family Math Studio v3.0 token engine: parses assets/design/family/tokens.css, resolves each theme,
// computes every declared text/UI contrast pair, and renders docs/design/family-contrast-matrix.md.
// Pure functions (plus loadTokens/readFileSync defaults) so the gate can drive them at known-bad fixtures.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contrast, luminance, over, parseColor, toHex } from "./color-math.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const TOKENS_CSS = resolve(ROOT, "assets/design/family/tokens.css");
export const MATRIX_MD = resolve(ROOT, "docs/design/family-contrast-matrix.md");
export const MODES = ["light", "dark", "contrast"];
export const UNITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Product caps from the brief (3.1 / 4): a rendered page may not exceed these.
export const CAPS = { colorFamilies: 12, fontSizes: 8, radii: 6, shadows: 6 };

/* ─────────────────────────── CSS block parser ─────────────────────────── */

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Parse CSS into a tree of {selector, decls, children}. Enough for the token file: no strings with braces. */
export function parseBlocks(css) {
  const src = stripComments(css);
  let i = 0;
  const parseBody = () => {
    const node = { decls: {}, children: [] };
    let buf = "";
    while (i < src.length) {
      const ch = src[i];
      if (ch === "}") {
        i++;
        return node;
      }
      if (ch === "{") {
        i++;
        const child = parseBody();
        child.selector = buf.trim().replace(/\s+/g, " ");
        node.children.push(child);
        buf = "";
        continue;
      }
      if (ch === ";") {
        const decl = buf.trim();
        const m = decl.match(/^(--[\w-]+)\s*:\s*([\s\S]+)$/);
        if (m) node.decls[m[1]] = m[2].trim().replace(/\s+/g, " ");
        buf = "";
        i++;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const q = ch;
        buf += ch;
        i++;
        while (i < src.length && src[i] !== q) buf += src[i++];
        buf += src[i++] ?? "";
        continue;
      }
      if (ch === "(") {
        // url(...) / light-dark(...) may contain ; and quotes: copy to the matching paren
        let depth = 0;
        while (i < src.length) {
          const c = src[i];
          buf += c;
          i++;
          if (c === '"' || c === "'") {
            while (i < src.length && src[i] !== c) buf += src[i++];
            buf += src[i++] ?? "";
          } else if (c === "(") depth++;
          else if (c === ")" && --depth === 0) break;
        }
        continue;
      }
      buf += ch;
      i++;
    }
    return node;
  };
  const root = parseBody();
  root.selector = "";
  return root;
}

function* walk(node, trail = []) {
  yield { node, trail };
  for (const c of node.children) yield* walk(c, [...trail, c.selector]);
}

export function findBlock(root, selector, within) {
  for (const { node, trail } of walk(root))
    if (node.selector === selector && (!within || trail.some((t) => t.startsWith(within))))
      return node;
  return null;
}

/* ─────────────────────────── theme resolution ─────────────────────────── */

function splitTop(s, sep = ",") {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === sep && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const LD = /^light-dark\((.*)\)$/;

/** Pick the light/dark branch of a declared value. */
function branch(value, scheme) {
  const m = value.match(LD);
  if (!m) return value;
  const [a, b] = splitTop(m[1]);
  return scheme === "dark" ? b : a;
}

function resolveVars(map) {
  const out = {};
  const get = (name, seen = []) => {
    if (out[name] !== undefined) return out[name];
    let v = map[name];
    if (v === undefined) return undefined;
    if (seen.includes(name)) throw new Error(`token cycle at ${name}`);
    v = v.replace(/var\((--[\w-]+)\)/g, (_, ref) => get(ref, [...seen, name]) ?? `var(${ref})`);
    out[name] = v;
    return v;
  };
  for (const k of Object.keys(map)) get(k);
  return out;
}

export function loadTokens(path = TOKENS_CSS, css) {
  const text = css ?? readFileSync(path, "utf8");
  const tree = parseBlocks(text);
  const problems = [];
  const base = findBlock(tree, ":root", "@layer tokens");
  const hc = findBlock(tree, ':root[data-theme="contrast"]');
  const hcMedia = findBlock(tree, ":root:not([data-theme])", "@media (prefers-contrast: more)");
  if (!base) problems.push("tokens.css has no :root block inside @layer tokens");
  if (!hc) problems.push('tokens.css has no :root[data-theme="contrast"] block');
  if (!hcMedia)
    problems.push(
      "tokens.css has no :root:not([data-theme]) block inside @media (prefers-contrast: more)",
    );
  if (hc && hcMedia) {
    const a = Object.keys(hc.decls);
    const b = Object.keys(hcMedia.decls);
    const drift = [...new Set([...a, ...b])].filter((k) => hc.decls[k] !== hcMedia.decls[k]);
    if (drift.length)
      problems.push(
        `the contrast theme and its prefers-contrast copy differ on: ${drift.join(", ")}`,
      );
  }
  const modes = {};
  if (base) {
    const raw = (scheme, overlay) => {
      const m = {};
      for (const [k, v] of Object.entries(base.decls)) m[k] = branch(v, scheme);
      if (overlay) for (const [k, v] of Object.entries(overlay.decls)) m[k] = branch(v, scheme);
      return resolveVars(m);
    };
    modes.light = raw("light");
    modes.dark = raw("dark");
    modes.contrast = raw("light", hc);
  }
  return { modes, base, hc, tree, problems, declared: base?.decls ?? {} };
}

/* ─────────────────────────── contrast pairs ───────────────────────────── */

const T = 4.5; // WCAG 1.4.3 text
const U = 3; // WCAG 1.4.11 non-text

/** Every declared pair. `hc` raises the floor in the contrast theme (7:1 for text). */
export function declaredPairs() {
  const P = [];
  const text = (fg, bg, use, hc = 7) => P.push({ fg, bg, min: T, hc, kind: "text", use });
  const ui = (fg, bg, use) => P.push({ fg, bg, min: U, hc: U, kind: "ui", use });
  for (const bg of ["surface", "raised", "sunken"]) {
    text("text", bg, `body copy on ${bg}`);
    text("text-muted", bg, `secondary text on ${bg}`);
    text("accent-ink", bg, `links and teal text on ${bg}`);
    text("highlight-ink", bg, `amber-toned text on ${bg}`);
    text("success-ink", bg, `success text on ${bg}`);
    text("error-ink", bg, `fault text on ${bg}`);
    text("info-ink", bg, `info text on ${bg}`);
    ui("border-strong", bg, `input and control edge on ${bg}`);
    ui("focus", bg, `focus ring on ${bg}`);
    ui("primary", bg, `primary button edge on ${bg}`);
    ui("accent-ink", bg, `teal graphic on ${bg}`);
    ui("success", bg, `success mark on ${bg}`);
    ui("error", bg, `fault mark on ${bg}`);
  }
  text("text-inverse", "inverse", "text on the inverse band");
  ui("focus-inverse", "inverse", "focus ring on the inverse band");
  ui("focus", "focus-halo", "focus ring against its halo");
  text("on-primary", "primary", "primary button label");
  text("on-primary", "primary-hover", "primary button label, hover");
  text("on-primary", "primary-press", "primary button label, pressed");
  text("on-highlight", "highlight", "label on an amber fill");
  text("on-success", "success", "label on a success fill");
  text("on-error", "error", "label on a fault fill");
  for (const [tint, ink] of [
    ["accent-tint", "accent-ink"],
    ["highlight-tint", "highlight-ink"],
    ["success-tint", "success-ink"],
    ["error-tint", "error-ink"],
    ["info-tint", "info-ink"],
  ]) {
    text(ink, tint, `${ink} on its tint (chips, callouts, feedback)`);
    text("text", tint, `body copy on ${tint}`);
    text("text-muted", tint, `secondary text on ${tint}`);
  }
  for (const u of UNITS) {
    for (const bg of ["surface", "raised", "sunken"])
      text(`unit-${u}-ink`, bg, `unit ${u} ink on ${bg}`);
    text(`unit-${u}-ink`, `unit-${u}-tint`, `unit ${u} ink on its band`);
    text("text", `unit-${u}-tint`, `body copy on unit ${u} band`);
    text("text-muted", `unit-${u}-tint`, `secondary text on unit ${u} band`);
    ui(`unit-${u}-accent`, "surface", `unit ${u} accent graphic on surface`);
    ui(`unit-${u}-accent`, "raised", `unit ${u} accent graphic on raised`);
  }
  return P;
}

const tok = (map, name) => {
  const v = map[`--fm-${name}`] ?? map[`--${name}`];
  return v === undefined ? undefined : parseColor(v);
};

export function evaluatePairs(modes, pairs = declaredPairs()) {
  const res = {};
  for (const mode of MODES) {
    const map = modes[mode];
    res[mode] = pairs.map((p) => {
      const need = mode === "contrast" ? Math.max(p.min, p.hc) : p.min;
      const bg0 = tok(map, p.bg);
      const fg0 = tok(map, p.fg);
      if (!fg0 || !bg0) return { ...p, need, ratio: 0, ok: false, missing: true };
      const bg = over(bg0, { r: 255, g: 255, b: 255 });
      const fg = over(fg0, bg);
      const ratio = contrast(fg, bg);
      return {
        ...p,
        need,
        ratio,
        ok: ratio >= need,
        fgHex: toHex(fg),
        bgHex: toHex(bg),
      };
    });
  }
  return res;
}

export const failures = (evaluated) =>
  MODES.flatMap((m) =>
    evaluated[m]
      .filter((r) => !r.ok)
      .map(
        (r) =>
          `${m}: ${r.fg} on ${r.bg} is ${r.missing ? "missing" : r.ratio.toFixed(2)}, needs ${r.need} (${r.use})`,
      ),
  );

/* ─────────────────────────── counts and families ──────────────────────── */

export const familyOf = (name) => {
  const n = name.replace(/^--(fm-)?/, "");
  if (/^unit-/.test(n)) return "unit";
  if (/^(surface|raised|sunken|scrim|focus-halo)$/.test(n)) return "paper";
  if (/^(text|text-muted|text-inverse|border|border-strong|m-given|m-given-tint|shade-\d)$/.test(n))
    return "ink";
  if (
    /^(inverse|primary|primary-hover|primary-press|on-primary|info-ink|info-tint|focus|m-whole|m-whole-tint)$/.test(
      n,
    )
  )
    return "navy";
  if (/^(accent|accent-ink|accent-tint|m-part|m-part-tint)$/.test(n)) return "teal";
  if (
    /^(highlight|focus-inverse|on-highlight|highlight-ink|highlight-tint|look|look-tint|look-edge|warn|warn-tint|m-unknown|m-unknown-tint|m-unknown-edge)$/.test(
      n,
    )
  )
    return "amber";
  if (/^(success|success-ink|success-tint|on-success|m-answer|m-answer-tint)$/.test(n))
    return "green";
  if (/^(error|error-ink|error-tint|on-error)$/.test(n)) return "red";
  return null;
};

export function countTokens(declared) {
  const names = Object.keys(declared);
  const colorNames = names.filter((n) => familyOf(n));
  const fam = new Set(colorNames.map(familyOf));
  return {
    colorTokens: colorNames.length,
    colorFamilies: [...fam].sort(),
    fontSizes: names.filter((n) => /^--fm-fs-/.test(n)).length,
    radii: names.filter((n) => /^--fm-radius-/.test(n)).length,
    shadows: names.filter((n) => /^--fm-shadow-/.test(n)).length,
    units: names.filter((n) => /^--unit-\d+-accent$/.test(n)).length,
    motifs: names.filter((n) => /^--unit-\d+-motif$/.test(n)).length,
    durations: names.filter((n) => /^--fm-dur-/.test(n)).length,
    easings: names.filter((n) => /^--fm-ease/.test(n)).length,
  };
}

export function capProblems(counts) {
  const p = [];
  if (counts.colorFamilies.length > CAPS.colorFamilies)
    p.push(`${counts.colorFamilies.length} color families > ${CAPS.colorFamilies}`);
  if (counts.fontSizes > CAPS.fontSizes)
    p.push(`${counts.fontSizes} font sizes > ${CAPS.fontSizes}`);
  if (counts.radii > CAPS.radii) p.push(`${counts.radii} radii > ${CAPS.radii}`);
  if (counts.shadows > CAPS.shadows) p.push(`${counts.shadows} shadows > ${CAPS.shadows}`);
  if (counts.units !== 10) p.push(`${counts.units} unit accents, expected 10`);
  if (counts.motifs !== 10) p.push(`${counts.motifs} unit motifs, expected 10`);
  return p;
}

/** Hue range this product forbids (violet, purple, magenta), same rule as tools/lib/color-math. */
export function forbiddenHueTokens(modes) {
  const bad = [];
  for (const mode of MODES)
    for (const [k, v] of Object.entries(modes[mode])) {
      const c = parseColor(v);
      if (!c || c.a === 0) continue;
      const max = Math.max(c.r, c.g, c.b);
      const min = Math.min(c.r, c.g, c.b);
      const l = (max + min) / 510;
      const d = (max - min) / 255;
      if (d === 0) continue;
      const s = d / (1 - Math.abs(2 * l - 1));
      let h;
      if (max === c.r) h = (((c.g - c.b) / (max - min)) % 6) * 60;
      else if (max === c.g) h = ((c.b - c.r) / (max - min) + 2) * 60;
      else h = ((c.r - c.g) / (max - min) + 4) * 60;
      h = (h + 360) % 360;
      if (s > 0.15 && l > 0.03 && l < 0.97 && h >= 255 && h <= 335) bad.push(`${mode} ${k} ${v}`);
    }
  return bad;
}

/* ─────────────────────────── brand alignment ──────────────────────────── */

// [family token, engine tokens.json color key | null, note]
export const BRAND_LINKS = [
  ["surface", "canvas"],
  ["raised", "white"],
  ["inverse", "navy"],
  ["text", "text"],
  ["text-muted", "muted"],
  ["primary", "navy"],
  ["accent", "teal"],
  ["highlight", "amber"],
  ["success", "success"],
  ["error", "error"],
];
export const BRAND_ADJUSTED = [
  ["accent-ink", "tealInk", "darker so it holds 4.5:1 on the inset surface as well as paper"],
  [
    "highlight-ink",
    "amberInk",
    "darker so it holds 4.5:1 on paper (was 4.51, one rounding from failing)",
  ],
  ["success-ink", "success", "darker so text on its own tint holds 4.5:1 (was exactly 4.50)"],
];

export function brandAlignment(modes, engineColors) {
  const light = modes.light;
  const rows = [];
  const problems = [];
  for (const [name, key] of BRAND_LINKS) {
    const mine = toHex(parseColor(light[`--fm-${name}`]));
    const theirs = toHex(engineColors[key]);
    const same = mine === theirs;
    rows.push({ name, key, mine, theirs, same, note: "" });
    if (!same) problems.push(`--fm-${name} ${mine} differs from engine ${key} ${theirs}`);
  }
  for (const [name, key, note] of BRAND_ADJUSTED) {
    const mine = toHex(parseColor(light[`--fm-${name}`]));
    const theirs = toHex(engineColors[key]);
    rows.push({ name, key, mine, theirs, same: mine === theirs, note });
  }
  return { rows, problems };
}

/* ─────────────────────────── markdown report ──────────────────────────── */

const fmt = (n) => n.toFixed(2);

export function renderMatrix({ modes, evaluated, counts, brand }) {
  const L = [];
  L.push(
    "# Family design system: contrast matrix",
    "",
    "GENERATED by `node tools/build-family-tokens-report.mjs` from `assets/design/family/tokens.css`. Do not edit.",
    "`npm run validate:family-design-tokens` fails when this file is stale or any pair is under its floor.",
    "",
    "Floors: text 4.5:1 (WCAG 1.4.3), UI edges and graphics 3:1 (1.4.11), high-contrast text 7:1. Ratios are computed on the",
    "emitted hex values; translucent colors are composited over the background first. Forced-colors is not a color",
    "theme (the browser substitutes the system palette), so it is verified in a browser, not here.",
    "",
    "## Token counts",
    "",
    `- Color tokens: ${counts.colorTokens} in ${counts.colorFamilies.length} families (${counts.colorFamilies.join(", ")}); cap ${CAPS.colorFamilies} families per page.`,
    `- Unit accents: ${counts.units} (accent, ink, tint each) and ${counts.motifs} motifs. One unit is active per page.`,
    `- Font sizes: ${counts.fontSizes} (cap ${CAPS.fontSizes}). Radii: ${counts.radii} (cap ${CAPS.radii}). Shadows: ${counts.shadows} (cap ${CAPS.shadows}).`,
    `- Motion: ${counts.durations} durations, ${counts.easings} easings.`,
    "",
    "## Brand alignment with engine/design/tokens.json",
    "",
    "| Family token | Engine key | Family value | Engine value | Status |",
    "|---|---|---|---|---|",
  );
  for (const r of brand.rows)
    L.push(
      `| \`--fm-${r.name}\` | ${r.key} | \`${r.mine}\` | \`${r.theirs}\` | ${r.same ? "same" : `adjusted: ${r.note}`} |`,
    );
  for (const mode of MODES) {
    const rows = evaluated[mode];
    const pass = rows.filter((r) => r.ok).length;
    L.push(
      "",
      `## ${mode === "contrast" ? "High-contrast" : mode[0].toUpperCase() + mode.slice(1)} theme`,
      "",
      `${pass} of ${rows.length} pairs pass.`,
      "",
      "| Foreground | Background | Ratio | Needs | Pass | Used for |",
      "|---|---|---:|---:|:-:|---|",
    );
    for (const r of rows)
      L.push(
        `| ${r.fg} \`${r.fgHex}\` | ${r.bg} \`${r.bgHex}\` | ${fmt(r.ratio)} | ${r.need} | ${r.ok ? "yes" : "NO"} | ${r.use} |`,
      );
  }
  L.push("", "## Unit accents in grayscale", "");
  L.push(
    "Unit identity is the number plus the motif; hue is a third cue. The relative luminance of each accent (light theme) shows how the",
    "units separate when color is removed. Adjacent units differ by at least 0.02.",
    "",
    "| Unit | Accent | Luminance |",
    "|---:|---|---:|",
  );
  for (const u of UNITS) {
    const hex = modes.light[`--unit-${u}-accent`];
    L.push(`| ${u} | \`${hex}\` | ${luminance(parseColor(hex)).toFixed(3)} |`);
  }
  return `${L.join("\n")}\n`;
}

/** Smallest luminance step between adjacent unit accents (light theme). */
export function unitGrayGap(modes) {
  let min = 1;
  for (let u = 1; u < 10; u++) {
    const a = luminance(parseColor(modes.light[`--unit-${u}-accent`]));
    const b = luminance(parseColor(modes.light[`--unit-${u + 1}-accent`]));
    min = Math.min(min, Math.abs(a - b));
  }
  return min;
}
