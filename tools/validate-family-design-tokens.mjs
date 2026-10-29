#!/usr/bin/env node
/**
 * validate-family-design-tokens.mjs — the Family Math Studio design system holds its own rules.
 *
 * WHAT IT HOLDS (brief-design.md sections 3.1, 3.8, 3.9 and 4):
 *   TOKENS   every declared text/UI contrast pair (light, dark, high contrast) is COMPUTED from
 *            assets/design/family/tokens.css and docs/design/family-contrast-matrix.md is current
 *            (4.5:1 text, 3:1 UI, 7:1 high-contrast text); brand values match engine/design/tokens.json;
 *            no violet/purple/magenta token; caps on colors, sizes, radii and shadows.
 *   SOURCE   family.css and tokens.css: every rule in a layer, the layer order, no raw color outside
 *            tokens.css, no undocumented !important, no ID selector, logical properties only, fonts and
 *            sizes only through tokens, specificity under a ceiling, no inline style (a --custom-property
 *            is the one exception), no external URL.
 *   RENDER   the specimen page in a real browser, in light, dark and high contrast, English and Spanish,
 *            at 320 to 1280px: <= 12 color families, <= 8 font sizes, <= 6 radii, <= 6 shadows, no color
 *            that is not a token, only the approved font families (Atkinson only in the dyslexia option),
 *            no visible text under 13px, AA contrast on every text run, no card inside a card inside a
 *            card, no request that leaves the origin, a web font that actually loaded.
 *
 * EVERY DETECTOR IS SELF-TESTED FIRST against a known-bad fixture, and a sweep that measured zero pages
 * (or a page that measured almost no elements) FAILS: a gate that stopped seeing the page reports a clean one.
 * A missing browser is a SKIP (exit 3, 1 in CI), never a pass — the static half has already run by then.
 *
 * Pilot pages: when the homework pages are integrated, append them to PAGES below.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildReport } from "./build-family-tokens-report.mjs";
import {
  collectMetrics,
  launchBrowser,
  openSpecimen,
  serveRepo,
} from "./lib/family-design-browser.mjs";
import {
  APPROVED_FAMILIES,
  colorIndex,
  declarations,
  fontViolations,
  idSelectors,
  inlineStyles,
  judgeMetrics,
  layerStatement,
  maxSpecificity,
  physicalProps,
  rawColors,
  undocumentedImportant,
  unlayered,
} from "./lib/family-design-checks.mjs";
import {
  CAPS,
  capProblems,
  countTokens,
  familyOf,
  loadTokens,
  MATRIX_MD,
  ROOT,
} from "./lib/family-tokens.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const LAYERS = "@layer reset, tokens, base, components, patterns, utilities, unit-theme, print;";
const MAX_SPECIFICITY = [0, 4, 1];
const MIN_ELEMENTS = 400;

/** The pages the render sweep measures. Query options are applied to each run below. */
const PAGES = [{ name: "specimen", kind: "specimen" }];

const RUNS = [
  { theme: "light", lang: "en", width: 390 },
  { theme: "dark", lang: "es", width: 390 },
  { theme: "contrast", lang: "en", width: 390 },
  { theme: "light", lang: "es", width: 320 },
  { theme: "dark", lang: "en", width: 1280 },
  { theme: "contrast", lang: "es", width: 768 },
  { theme: "light", lang: "en", width: 390, text: "150", spacing: "more" },
  { theme: "light", lang: "en", width: 390, reading: "dyslexia" },
];

const read = (rel) => readFileSync(resolve(ROOT, rel), "utf8");
const cmpSpec = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/* ───────────────────────── self-tests: every detector must fire on its fixture ───────────────────────── */

function selfTests() {
  const fired = (name, got) => assert.ok(got.length > 0, `self-test: ${name} did not fire`);
  const quiet = (name, got) =>
    assert.equal(got.length, 0, `self-test: ${name} fired on clean CSS: ${got}`);

  fired("raw hex", rawColors(".a { color: #ff0000; }"));
  fired("raw rgb", rawColors(".a { background: rgb(1 2 3); }"));
  fired("named color", rawColors(".a { border-color: white; }"));
  quiet("token colors", rawColors(".a { color: var(--fm-text); background: transparent; }"));
  quiet(
    "data uri in a custom property",
    rawColors(":root { --m: url(\"data:image/svg+xml,%3Csvg fill='black'/%3E\"); }"),
  );

  fired("undocumented !important", undocumentedImportant(".a { color: red !important; }"));
  quiet(
    "documented !important",
    undocumentedImportant(
      "/* !important (documented a11y): x */\n.a { display: none !important; }",
    ),
  );
  quiet(
    "!important in prose",
    undocumentedImportant("/* never use !important here */\n.a { x: y; }"),
  );

  fired("physical margin", physicalProps(".a { margin-left: 1px; }"));
  fired("physical width", physicalProps(".a { width: 10px; }"));
  fired("text-align right", physicalProps(".a { text-align: right; }"));
  quiet(
    "logical props",
    physicalProps(".a { margin-inline-start: 1px; inline-size: 10px; text-align: start; }"),
  );

  fired("font-family literal", fontViolations(".a { font-family: Arial; }"));
  fired("font-size literal", fontViolations(".a { font-size: 17px; }"));
  quiet(
    "font tokens",
    fontViolations(".a { font-family: var(--fm-font-text); font-size: var(--fm-fs-md); }"),
  );

  fired("ID selector", idSelectors("#hero .a { color: var(--fm-text); }"));
  quiet("attribute with #", idSelectors('a[href="#x"] { color: var(--fm-text); }'));

  fired("unlayered rule", unlayered(".a { color: var(--fm-text); }"));
  quiet("layered rule", unlayered("@layer base { .a { color: var(--fm-text); } }"));
  fired("layer statement", layerStatement("@layer a;", LAYERS));

  assert.ok(
    cmpSpec(maxSpecificity("@layer x { #a .b .c .d:hover { x: y; } }").spec, MAX_SPECIFICITY) > 0,
    "self-test: specificity ceiling did not fire",
  );
  assert.ok(
    cmpSpec(maxSpecificity("@layer x { :where(.a .b .c .d .e) { x: y; } }").spec, [0, 0, 0]) === 0,
    "self-test: :where() must be zero specificity",
  );
  fired("inline style", inlineStyles('<p style="color:red">x</p>'));
  quiet("data-driven custom property", inlineStyles('<p style="--pct: 40">x</p>'));

  // Token engine: a failing pair, a violet token, a copy that drifted, a cap breach.
  const good = read("assets/design/family/tokens.css");
  const failing = buildReport({
    css: good.replace("--fm-text-muted: light-dark(#4a555e", "--fm-text-muted: light-dark(#b0b8c0"),
  });
  fired(
    "failing contrast pair",
    failing.problems.filter((p) => /text-muted/.test(p)),
  );
  const violet = buildReport({
    css: good.replace("--unit-6-accent: light-dark(#d25435", "--unit-6-accent: light-dark(#6a3fa0"),
  });
  fired(
    "violet token",
    violet.problems.filter((p) => /forbidden/.test(p)),
  );
  const drift = buildReport({ css: good.replace("--fm-focus: #000000;", "--fm-focus: #111111;") });
  fired(
    "contrast theme drifted from its media-query copy",
    drift.problems.filter((p) => /differ/.test(p)),
  );
  const brand = buildReport({
    css: good.replace("--fm-surface: light-dark(#f7f4ec", "--fm-surface: light-dark(#f7f4ed"),
  });
  fired(
    "brand drift",
    brand.problems.filter((p) => /engine/.test(p)),
  );
  const loaded = loadTokens(undefined, good);
  const counts = countTokens(loaded.declared);
  quiet("caps on the real tokens", capProblems(counts));
  fired("too many sizes", capProblems({ ...counts, fontSizes: CAPS.fontSizes + 1 }));
  fired("too many families", capProblems({ ...counts, colorFamilies: new Array(13).fill("x") }));

  // Page judgment.
  const light = loaded.modes.light;
  const idx = colorIndex(light, familyOf, 4);
  const clean = {
    elements: 900,
    colors: { "rgba(36, 50, 63, 1)": 1, "rgba(247, 244, 236, 1)": 1 },
    sizes: ["13px", "16px"],
    radii: ["8px"],
    shadows: [],
    families: ['Nunito, "Nunito Fallback", system-ui, sans-serif'],
    tiny: [],
    lowContrast: [],
    cardDepth: [],
    fontsLoaded: ["Nunito"],
    external: [],
  };
  quiet("clean page", judgeMetrics(clean, { colorIdx: idx }));
  fired("zero elements", judgeMetrics({ ...clean, elements: 0 }, { colorIdx: idx }));
  fired(
    "off-palette color",
    judgeMetrics({ ...clean, colors: { "rgba(1, 2, 3, 1)": 1 } }, { colorIdx: idx }),
  );
  fired(
    "nine font sizes",
    judgeMetrics(
      { ...clean, sizes: new Array(9).fill(0).map((_, i) => `${13 + i}px`) },
      { colorIdx: idx },
    ),
  );
  fired(
    "seven radii",
    judgeMetrics(
      { ...clean, radii: new Array(7).fill(0).map((_, i) => `${i + 1}px`) },
      { colorIdx: idx },
    ),
  );
  fired(
    "seven shadows",
    judgeMetrics(
      { ...clean, shadows: new Array(7).fill(0).map((_, i) => `0 ${i}px red`) },
      { colorIdx: idx },
    ),
  );
  fired(
    "a third font",
    judgeMetrics({ ...clean, families: ["Georgia, serif"] }, { colorIdx: idx }),
  );
  fired(
    "atkinson without the option",
    judgeMetrics(
      { ...clean, families: ['"Atkinson Hyperlegible", sans-serif'] },
      { colorIdx: idx },
    ),
  );
  fired("tiny text", judgeMetrics({ ...clean, tiny: ["p 11px"] }, { colorIdx: idx }));
  fired(
    "low contrast text",
    judgeMetrics({ ...clean, lowContrast: ["p 2.1<4.5"] }, { colorIdx: idx }),
  );
  fired(
    "nested cards",
    judgeMetrics({ ...clean, cardDepth: ["fm-card depth 3"] }, { colorIdx: idx }),
  );
  fired(
    "external request",
    judgeMetrics({ ...clean, external: ["https://fonts.googleapis.com/x"] }, { colorIdx: idx }),
  );
  fired("no web font", judgeMetrics({ ...clean, fontsLoaded: [] }, { colorIdx: idx }));
  assert.ok(
    APPROVED_FAMILIES.has("nunito") &&
      APPROVED_FAMILIES.has("baloo 2") &&
      !APPROVED_FAMILIES.has("georgia"),
  );
  assert.ok(
    declarations("@layer a { .x { color: var(--c); } }").length === 1,
    "self-test: declaration scan",
  );
}

/* ───────────────────────── static sweep ───────────────────────── */

function staticSweep() {
  const problems = [];
  const add = (file, list, label) => {
    for (const item of list) problems.push(`${file}: ${label}: ${item}`);
  };
  const report = buildReport();
  for (const p of report.problems) problems.push(`tokens.css: ${p}`);
  let onDisk = "";
  try {
    onDisk = readFileSync(MATRIX_MD, "utf8");
  } catch {}
  if (report.markdown && onDisk !== report.markdown)
    problems.push(
      "docs/design/family-contrast-matrix.md is stale; run `node tools/build-family-tokens-report.mjs`",
    );

  const tokens = read("assets/design/family/tokens.css");
  const family = read("assets/design/family/family.css");
  for (const [file, css] of [
    ["tokens.css", tokens],
    ["family.css", family],
  ]) {
    add(file, unlayered(css), "unlayered");
    add(file, layerStatement(css, LAYERS), "layers");
    if (/@import|https?:\/\/(?!www\.w3\.org)/.test(css))
      problems.push(`${file}: imports or links to another URL`);
  }
  add("family.css", rawColors(family), "raw color outside tokens.css");
  add("family.css", undocumentedImportant(family), "undocumented !important");
  add("family.css", idSelectors(family), "ID selector");
  add("family.css", physicalProps(family), "physical property");
  add("family.css", fontViolations(family), "font outside tokens");
  const spec = maxSpecificity(family);
  if (cmpSpec(spec.spec, MAX_SPECIFICITY) > 0)
    problems.push(
      `family.css: specificity ${spec.spec.join(",")} over ${MAX_SPECIFICITY.join(",")}: ${spec.selector}`,
    );

  const css2 = read("design/family-system/specimen.css");
  add("specimen.css", rawColors(css2), "raw color outside tokens.css");
  add("specimen.css", idSelectors(css2), "ID selector");
  add("specimen.css", physicalProps(css2), "physical property");
  add("specimen.css", fontViolations(css2), "font outside tokens");
  add("specimen.css", unlayered(css2), "unlayered");
  const html = read("design/family-system/index.html");
  add("index.html", inlineStyles(html), "inline style");
  for (const f of ["index.html", "specimen.js", "specimen-boot.js", "specimen.css"]) {
    const src = read(`design/family-system/${f}`);
    if (/https?:\/\/(?!www\.w3\.org)/.test(src.replace(/<!--[\s\S]*?-->/g, "")))
      problems.push(`${f}: names an external URL`);
    if (f.endsWith(".js") && /#[0-9a-fA-F]{6}\b/.test(src)) problems.push(`${f}: raw hex color`);
  }
  return { problems, tokens, report };
}

/* ───────────────────────── render sweep ───────────────────────── */

async function renderSweep(loaded) {
  const problems = [];
  const server = await serveRepo();
  const browser = await launchBrowser();
  if (!browser) {
    await server.close();
    return { skipped: true, problems, runs: 0, elements: 0 };
  }
  let runs = 0;
  let elements = 0;
  try {
    for (const page of PAGES) {
      for (const run of RUNS) {
        const { width, ...q } = run;
        const {
          page: pg,
          context,
          external,
          pageErrors,
        } = await openSpecimen(browser, server.origin, { width, ...q });
        const m = await pg.evaluate(collectMetrics);
        m.external = external;
        const mode = q.theme === "dark" ? "dark" : q.theme === "contrast" ? "contrast" : "light";
        const idx = colorIndex(loaded.modes[mode], familyOf, "all");
        const label = `${page.name} ${q.theme}/${q.lang}/${width}px${q.reading ? `/${q.reading}` : ""}${q.text ? `/text${q.text}` : ""}`;
        for (const p of judgeMetrics(m, {
          colorIdx: idx,
          reading: q.reading,
          minElements: MIN_ELEMENTS,
        }))
          problems.push(`${label}: ${p}`);
        for (const e of pageErrors) problems.push(`${label}: page error: ${e}`);
        const scroll = await pg.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.clientWidth,
        ]);
        if (scroll[0] > scroll[1])
          problems.push(`${label}: horizontal scroll (${scroll[0]} > ${scroll[1]})`);
        await context.close();
        runs++;
        elements += m.elements;
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return { skipped: false, problems, runs, elements };
}

/* ───────────────────────── main ───────────────────────── */

async function main() {
  selfTests();
  console.log("self-tests: all family design detectors fire on their fixtures");
  const { problems, tokens, report } = staticSweep();
  const loaded = loadTokens(undefined, tokens);
  const counts = report.counts;
  const render = await renderSweep(loaded);
  problems.push(...render.problems);
  if (!render.skipped && render.runs < RUNS.length * PAGES.length)
    problems.push(`render sweep ran ${render.runs} of ${RUNS.length * PAGES.length} runs`);
  if (problems.length) {
    console.error(
      `FAIL validate:family-design-tokens (${problems.length})\n  ${problems.join("\n  ")}`,
    );
    process.exit(1);
  }
  const pairs = Object.values(report.evaluated).reduce((n, r) => n + r.length, 0);
  console.log(
    `static ok: ${pairs} contrast pairs, ${counts.colorTokens} color tokens in ${counts.colorFamilies.length} families, ${counts.fontSizes} sizes, ${counts.radii} radii, ${counts.shadows} shadows`,
  );
  if (render.skipped) {
    process.exit(
      skipExit(
        "no browser could launch, so the render half of validate:family-design-tokens did not run (the static half passed)",
        "set PW_CHROMIUM_PATH to a Chromium, or run `npx playwright install chromium`",
      ),
    );
  }
  console.log(
    `PASS validate:family-design-tokens (${render.runs} rendered runs, ${render.elements} elements measured)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
