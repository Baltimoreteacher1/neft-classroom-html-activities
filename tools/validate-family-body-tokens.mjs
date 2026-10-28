#!/usr/bin/env node
// validate:family-body-tokens - the family homework BODY (Learn, Try, Play, Celebrate stops) draws
// with the design system and nothing else, measured on the page a family actually sees.
//
// Static: assets/design/family/body.css has no raw color, no font-family or font-size outside the
// tokens, no undocumented !important, and does not grow past its ratchets (lines, ID selectors).
// Rendered: real generated pages in Chromium, every stop opened, every colour/size/radius/shadow the
// body paints measured with the same collector validate:family-design-tokens uses on the specimen.
// Caps: <= 12 colour families, <= 8 font sizes, <= 6 radii, <= 6 shadows, every colour a token,
// nothing under 13px, AA contrast. The hero, top bar and print sheet belong to other workstreams and
// are hidden from the measurement; the count that remains is the body.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { collectMetrics, launchBrowser, serveRepo } from "./lib/family-design-browser.mjs";
import {
  colorIndex,
  fontViolations,
  idSelectors,
  judgeMetrics,
  rawColors,
  undocumentedImportant,
} from "./lib/family-design-checks.mjs";
import { CAPS, familyOf, loadTokens, ROOT } from "./lib/family-tokens.mjs";

export const BODY_CSS = resolve(ROOT, "assets/design/family/body.css");
// Ratchets: these may only go down. Lower them when body.css shrinks.
export const MAX_BODY_LINES = 9000;
export const MAX_ID_SELECTORS = 40;
export const PILOT = ["1-1", "2-6", "3-4", "4-5", "6-13", "9-4"];
const STOPS = ["learn", "words", "check", "play", "done"];
const MIN_ELEMENTS = 150;

/**
 * collectMetrics, with inline-SVG text left out of the type and contrast tally: SVG text sizes are
 * drawing units in the figure's own viewBox, not reading type, and its fills are token-checked as colors.
 */
export function bodyCollector(source = collectMetrics.toString()) {
  const patched = source.replace(
    "const hasText = [...el.childNodes]",
    'const hasText = !el.closest("svg") && [...el.childNodes]',
  );
  if (patched === source) throw new Error("collectMetrics changed shape: update bodyCollector");
  return `(${patched})()`;
}

/* ───────────────────────── pure helpers (self-tested) ───────────────────────── */

/** Union of several collectMetrics results: what the page paints across all its stops. */
export function mergeMetrics(list) {
  const out = {
    elements: 0,
    colors: {},
    sizes: [],
    radii: [],
    shadows: [],
    families: [],
    tiny: [],
    lowContrast: [],
    cardDepth: [],
    fontsLoaded: [],
    external: [],
  };
  const union = (key, m) => {
    for (const v of m[key]) if (!out[key].includes(v)) out[key].push(v);
  };
  for (const m of list) {
    out.elements += m.elements;
    Object.assign(out.colors, m.colors);
    for (const key of [
      "sizes",
      "radii",
      "shadows",
      "families",
      "tiny",
      "lowContrast",
      "cardDepth",
      "fontsLoaded",
      "external",
    ])
      union(key, m);
  }
  out.sizes.sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b));
  return out;
}

/** Static problems in the body stylesheet. */
export function staticProblems(css, { maxLines = MAX_BODY_LINES, maxIds = MAX_ID_SELECTORS } = {}) {
  const bad = [];
  for (const p of rawColors(css)) bad.push(`body.css raw colour: ${p}`);
  for (const p of fontViolations(css)) bad.push(`body.css off-token type: ${p}`);
  for (const p of undocumentedImportant(css)) bad.push(`body.css undocumented !important: ${p}`);
  const lines = css.split("\n").length;
  if (lines > maxLines) bad.push(`body.css is ${lines} lines, over the ${maxLines} ratchet`);
  const ids = idSelectors(css).length;
  if (ids > maxIds) bad.push(`body.css has ${ids} ID selectors, over the ${maxIds} ratchet`);
  if (!/@layer\s+patterns\s*\{/.test(css)) bad.push("body.css is not inside @layer patterns");
  return bad;
}

/* ───────────────────────── self-tests ───────────────────────── */

function selfTests(loaded) {
  const idx = colorIndex(loaded.modes.light, familyOf, "all");
  const raw = (v) => v;
  const fired = (name, probs) => {
    if (!probs.length) throw new Error(`self-test: ${name} did not fire`);
  };
  const quiet = (name, probs) => {
    if (probs.length) throw new Error(`self-test: ${name} fired on clean input: ${probs[0]}`);
  };
  const clean =
    "@layer patterns {\n  .a {\n    color: var(--fm-text);\n    font-size: var(--fm-fs-md);\n  }\n}\n";
  quiet("clean css", staticProblems(clean));
  fired("raw hex", staticProblems(clean.replace("var(--fm-text)", "#123456")));
  fired("raw rgb", staticProblems(clean.replace("var(--fm-text)", "rgb(1, 2, 3)")));
  fired("px font size", staticProblems(clean.replace("var(--fm-fs-md)", "17px")));
  fired(
    "important",
    staticProblems(clean.replace("var(--fm-text);", "var(--fm-text) !important;")),
  );
  fired("no layer", staticProblems(clean.replace("@layer patterns {", ".wrap {")));
  fired("id ratchet", staticProblems(`${clean}#x { color: var(--fm-text); }`, { maxIds: 0 }));
  fired("line ratchet", staticProblems(clean, { maxLines: 3 }));

  const page = (over = {}) => ({
    elements: 400,
    colors: {},
    sizes: ["13px", "16px"],
    radii: ["8px"],
    shadows: [],
    families: ['"Nunito", sans-serif'],
    tiny: [],
    lowContrast: [],
    cardDepth: [],
    fontsLoaded: ["Nunito"],
    external: [],
    ...over,
  });
  quiet("clean page", judgeMetrics(page(), { colorIdx: idx }));
  fired("too few elements", judgeMetrics(page({ elements: 3 }), { colorIdx: idx }));
  fired(
    "off-token colour",
    judgeMetrics(page({ colors: { [raw("rgba(1, 2, 3, 1)")]: 1 } }), { colorIdx: idx }),
  );
  fired(
    "13 sizes",
    judgeMetrics(
      page({ sizes: Array.from({ length: CAPS.fontSizes + 1 }, (_, i) => `${13 + i}px`) }),
      { colorIdx: idx },
    ),
  );
  fired(
    "7 radii",
    judgeMetrics(page({ radii: Array.from({ length: CAPS.radii + 1 }, (_, i) => `${i + 1}px`) }), {
      colorIdx: idx,
    }),
  );
  fired(
    "7 shadows",
    judgeMetrics(
      page({ shadows: Array.from({ length: CAPS.shadows + 1 }, (_, i) => `0 ${i}px 2px red`) }),
      { colorIdx: idx },
    ),
  );
  fired("tiny text", judgeMetrics(page({ tiny: ["p 11px"] }), { colorIdx: idx }));
  fired("low contrast", judgeMetrics(page({ lowContrast: ["p 2<4.5"] }), { colorIdx: idx }));

  if (!bodyCollector().includes('!el.closest("svg")'))
    throw new Error("self-test: bodyCollector did not exclude svg text");
  let shapeChanged = false;
  try {
    bodyCollector("function () { return 1; }");
  } catch {
    shapeChanged = true;
  }
  if (!shapeChanged) throw new Error("self-test: bodyCollector accepted an unknown collector");

  const a = page({ sizes: ["13px"], radii: ["4px"], colors: { "rgba(1, 1, 1, 1)": 1 } });
  const b = page({ sizes: ["16px", "13px"], radii: ["8px"], colors: { "rgba(2, 2, 2, 1)": 1 } });
  const m = mergeMetrics([a, b]);
  if (m.sizes.join() !== "13px,16px" || m.radii.length !== 2 || Object.keys(m.colors).length !== 2)
    throw new Error("self-test: mergeMetrics lost a value");
  if (m.elements !== 800) throw new Error("self-test: mergeMetrics lost elements");
}

/* ───────────────────────── rendered sweep ───────────────────────── */

// The hero, top bar, language card, print sheet and floating launchers are other workstreams' surfaces.
const OUT_OF_SCOPE =
  "header.hw-hero, #hw_topbar, .hw-print-head, .hw-tab-meta-row, .hw-skip, .hw-print-socratic-footer, .refrigerator-sheet-print-container, .hw-answer-sheet, [class*='launcher'], .nt-sr-launcher";

async function measureRun(browser, origin, lessonId, { lang, theme }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  const page = await context.newPage();
  const external = [];
  const errors = [];
  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith(origin) && !url.startsWith("data:") && !url.startsWith("blob:"))
      external.push(url);
  });
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(e.message);
  });
  await page.addInitScript((l) => {
    try {
      localStorage.setItem("hw_lang_mode", l);
    } catch {}
  }, lang);
  await page.goto(`${origin}/lessons/${lessonId}/homework.html?lang=${lang}`, {
    waitUntil: "load",
  });
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, theme);
  await page.addStyleTag({ content: `${OUT_OF_SCOPE} { display: none; }` });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.fonts.ready);
  const runs = [];
  for (const stop of STOPS) {
    await page.evaluate((s) => {
      document.getElementById(`hw_tab_${s}`)?.click();
      for (const panel of document.querySelectorAll(".tab-panel-inner"))
        panel.hidden = panel.id !== `hw_panel_${s}` ? panel.hidden : false;
    }, stop);
    await page.waitForTimeout(250);
    const m = await page.evaluate(bodyCollector());
    m.external = external;
    runs.push(m);
  }
  // The states a family causes: a flipped vocabulary card, a hint, a wrong then a right-or-other answer.
  const states = [
    () => {
      document.getElementById("hw_tab_words")?.click();
      for (const card of document.querySelectorAll(".vocab-card")) card.click();
    },
    () => {
      document.getElementById("hw_tab_check")?.click();
      for (const b of document.querySelectorAll("#hw_panel_check button[class*='hint']")) b.click();
    },
    () => {
      document.getElementById("hw_tab_check")?.click();
      const card = document.querySelector("#hw_panel_check .practice-tier-basic");
      const radios = card ? [...card.querySelectorAll(".mc-option-label")] : [];
      radios.at(-1)?.click();
      card?.querySelector(".btn-check-one")?.click();
    },
    () => {
      document.getElementById("hw_tab_check")?.click();
      const card = document.querySelector("#hw_panel_check .practice-tier-basic");
      const radios = card ? [...card.querySelectorAll(".mc-option-label")] : [];
      radios[0]?.click();
      card?.querySelector(".btn-check-one")?.click();
    },
  ];
  for (const act of states) {
    await page.evaluate(act);
    await page.waitForTimeout(250);
    const m = await page.evaluate(bodyCollector());
    m.external = external;
    runs.push(m);
  }
  await context.close();
  return { metrics: mergeMetrics(runs), errors };
}

async function renderSweep(loaded) {
  const browser = await launchBrowser();
  if (!browser) return { skipped: true, problems: [], runs: 0 };
  const server = await serveRepo();
  const problems = [];
  let runs = 0;
  try {
    const plan = [];
    for (const id of PILOT) {
      plan.push([id, { lang: "en", theme: "light" }]);
      plan.push([id, { lang: "es", theme: "dark" }]);
    }
    for (const [id, opts] of plan) {
      const { metrics, errors } = await measureRun(browser, server.origin, id, opts);
      const mode = opts.theme === "dark" ? "dark" : "light";
      const idx = colorIndex(loaded.modes[mode], familyOf, "all");
      const label = `${id} ${opts.lang}/${opts.theme}`;
      for (const p of judgeMetrics(metrics, { colorIdx: idx, minElements: MIN_ELEMENTS }))
        problems.push(`${label}: ${p}`);
      for (const e of errors) problems.push(`${label}: page error: ${e}`);
      runs++;
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return { skipped: false, problems, runs };
}

/* ───────────────────────── main ───────────────────────── */

async function main() {
  const loaded = loadTokens();
  selfTests(loaded);
  console.log("self-tests: every body-token detector fires on its fixture");
  const problems = staticProblems(readFileSync(BODY_CSS, "utf8"));
  const render = await renderSweep(loaded);
  problems.push(...render.problems);
  if (!render.skipped && render.runs < PILOT.length * 2)
    problems.push(
      `render sweep ran ${render.runs} of ${PILOT.length * 2} runs: the sweep saw nothing`,
    );
  if (problems.length) {
    console.error(
      `FAIL validate:family-body-tokens (${problems.length})\n  ${problems.join("\n  ")}`,
    );
    process.exit(1);
  }
  if (render.skipped) {
    console.warn("SKIP the rendered half of validate:family-body-tokens: no browser could launch");
    // Like validate:lesson-boot: a missing browser is a loud warning locally and a failure in CI.
    process.exit(process.env.CI ? 1 : 0);
  }
  console.log(
    `PASS validate:family-body-tokens (${render.runs} rendered runs, ${PILOT.length} lessons)`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
