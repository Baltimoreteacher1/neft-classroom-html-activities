#!/usr/bin/env node
// validate:family-visual: the first screen of a family homework page, judged in a real browser.
// Usage: node tools/verify-family-visual.mjs [--lesson=4-5,3-3] [--all] [--update] [--no-shots]
//
// For a rotating sample of lessons (the anchor 4-5 plus three more that change every week; --all sweeps
// every page), six widths x English and Spanish x light and dark, then high contrast and forced colors:
//   - no horizontal scroll (EN, ES)
//   - no fixed or sticky control overlapping another one or the Start button
//   - hero + Start in one phone screen (390x844) and Start in the first screen at 768+, in both languages
//   - the hero faces really loaded (document.fonts) and no hero heading falls back to a serif
//   - AA contrast on the chips, badges, route cards, eyebrow, hook card and the Start button
//   - every control in the hero is at least 44px
//   - layout shift (CLS) up to the first paint settled: 0.05 or less
// Baselines (hero screenshots and measured numbers) live in docs/family-homework-v3/visual-baseline/.
// `--update` rewrites them; a run without it fails when Start moved down more than 40px or a hero got
// 15% taller. Detectors are proven on known-bad fixtures first; a sweep that measured nothing FAILS; a
// missing browser is a SKIP (exit 3), never a pass.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launchBrowser, serveRepo } from "./lib/family-design-browser.mjs";
import { ROOT } from "./lib/family-tokens.mjs";
import {
  contrastProblems,
  fontProblems,
  overlapProblems,
  selfTest,
  serifHeadingProblems,
  targetProblems,
} from "./lib/family-visual-checks.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const value = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const BASELINE_DIR = join(ROOT, "docs/family-homework-v3/visual-baseline");
const WIDTHS = [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1920, 1080],
];
const ANCHOR = "4-5";
const SAMPLE_EXTRA = 3;

const broken = selfTest();
if (broken.length) {
  console.error(`validate:family-visual: detector self-test FAILED:\n  ${broken.join("\n  ")}`);
  process.exit(1);
}

const everyLesson = () =>
  readdirSync(join(ROOT, "data/family-homework-notes"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();

/** The anchor, plus SAMPLE_EXTRA lessons spread over the whole list, shifted a little every week. */
function sampleFor(all, week) {
  const step = Math.floor(all.length / SAMPLE_EXTRA);
  const picks = Array.from(
    { length: SAMPLE_EXTRA },
    (_, i) => all[(week * 7 + i * step) % all.length],
  );
  return [...new Set([ANCHOR, ...picks])];
}
const week = Math.floor(Date.now() / (7 * 86400000));
const lessons = value("lesson")
  ? value("lesson").split(",")
  : flag("all")
    ? everyLesson()
    : sampleFor(everyLesson(), week);

const THEMES = [
  ["light", "light"],
  ["dark", "dark"],
];
/** Run in the page: everything the detectors need, as plain data. */
const MEASURE = () => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none";
  };
  const hero = document.querySelector(".hw-hero");
  const start = document.getElementById("hw_start_button");
  if (!hero || !start) return { missing: true };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height, bottom: r.bottom + scrollY };
  };
  const shown = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.display === "none" || c.visibility === "hidden") return false;
      if (n.tagName === "DIALOG" && !n.open) return false;
    }
    return true;
  };
  const samples = [];
  const sel =
    "#hw_start_button, .hw-hero .fm-chip, .hw-hero .fm-xp-badge, .hw-route-option .fm-route__title strong, .hw-hero .fm-eyebrow__text > span, .hw-hero .fm-hero__title > span, .hw-hero .fm-hook__kicker span, .hw-hero .fm-hook__text > span, .hw-hero-lesson-meta > span, .hw-hero .fm-seg > button, .hw-hero .fm-hero__q > span";
  for (const el of document.querySelectorAll(sel)) {
    if (!vis(el) || !shown(el)) continue;
    const c = getComputedStyle(el);
    const bgs = [];
    let image = false;
    for (let n = el; n; n = n.parentElement) {
      const nc = getComputedStyle(n);
      if (nc.backgroundImage !== "none") image = true;
      bgs.push(nc.backgroundColor);
      if (/^rgb\(/.test(nc.backgroundColor) || nc.backgroundColor === "rgb(0, 0, 0)") break;
      if (/, 1\)$/.test(nc.backgroundColor)) break;
    }
    samples.push({
      label: `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0] || el.id}`,
      fg: c.color,
      bgs,
      image,
      size: parseFloat(c.fontSize),
      weight: Number(c.fontWeight),
    });
  }
  const targets = [...hero.querySelectorAll("button, a[href], summary, [role=button]")]
    .filter((el) => vis(el) && shown(el) && !el.closest(".fm-sr"))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0] || el.id}`,
        w: r.width,
        h: r.height,
      };
    });
  const fixed = [...document.querySelectorAll("body *")]
    .filter((el) => {
      const p = getComputedStyle(el).position;
      if (p !== "fixed" && p !== "sticky") return false;
      const r = el.getBoundingClientRect();
      return (
        vis(el) &&
        r.bottom > 0 &&
        r.top < innerHeight &&
        r.right > 0 &&
        r.left < innerWidth &&
        shown(el)
      );
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        name: `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0] || el.id}`,
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
      };
    });
  const s = start.getBoundingClientRect();
  fixed.push({ name: "#hw_start_button", x: s.x, y: s.y, w: s.width, h: s.height });
  const headings = [
    ...hero.querySelectorAll("h1, h2, .fm-hero__title, .fm-hero__q, .fm-card__title"),
  ]
    .filter(vis)
    .map((el) => ({
      label: `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`,
      family: getComputedStyle(el).fontFamily,
    }));
  const loaded = [...document.fonts]
    .filter((f) => f.status === "loaded")
    .map((f) => f.family.replace(/"/g, ""));
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    innerHeight,
    startBottom: rect(start).bottom,
    heroHeight: rect(hero).h,
    h1Count: document.querySelectorAll("h1").length,
    routeCards: document.querySelectorAll(".hw-route-option[data-route-mode]").length,
    hook: document.querySelector(".hw-hook")?.dataset.variant ?? null,
    art: !!hero.querySelector(".fm-hero__art svg"),
    samples,
    targets,
    fixed,
    headings,
    loaded,
    cls: window.__fmCls ?? 0,
    textSamples: samples.filter((x) => x.size > 0).length,
  };
};

const server = await serveRepo(ROOT);
const browser = await launchBrowser();
if (!browser) {
  await server.close();
  process.exit(
    skipExit("no browser could launch", "npx playwright install chromium, or set PW_CHROMIUM_PATH"),
  );
}

const problems = [];
const metrics = {};
let runs = 0;
let judgedContrast = 0;
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

async function runContext({ width, height, lang, theme, label, forced = false }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    forcedColors: forced ? "active" : "none",
    reducedMotion: "reduce",
  });
  await ctx.addInitScript(
    ({ lang, theme }) => {
      try {
        localStorage.setItem("hw_lang_mode", lang);
        if (theme !== "auto") localStorage.setItem("fm-reader-v1", JSON.stringify({ theme }));
      } catch {}
      window.__fmCls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__fmCls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    },
    { lang, theme },
  );
  const page = await ctx.newPage();
  for (const id of lessons) {
    const where = `${id} ${label}`;
    await page.goto(`${server.origin}/lessons/${id}/homework.html`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const m = await page.evaluate(MEASURE);
    runs++;
    if (m.missing) {
      fail(where, "no .hw-hero or #hw_start_button on the page");
      continue;
    }
    if (m.h1Count !== 1) fail(where, `${m.h1Count} h1 elements (needs exactly one)`);
    if (m.routeCards !== 2) fail(where, `${m.routeCards} route cards (needs two)`);
    if (!m.hook) fail(where, "no hook card");
    if (!m.art) fail(where, "no unit art band");
    if (lang !== "bilingual" && m.scrollWidth > m.innerWidth)
      fail(where, `horizontal scroll (${m.scrollWidth} > ${m.innerWidth})`);
    for (const p of overlapProblems(m.fixed)) fail(where, p);
    const oneScreen = (width === 390 && height === 844) || width >= 768;
    if (oneScreen && m.startBottom > m.innerHeight)
      fail(
        where,
        `Start ends at ${Math.round(m.startBottom)}px, below the ${m.innerHeight}px screen`,
      );
    if (width === 1280 && m.startBottom > 700)
      fail(where, `Start ends at ${Math.round(m.startBottom)}px at 1280 (limit 700)`);
    for (const p of fontProblems(m.loaded)) fail(where, p);
    for (const p of serifHeadingProblems(m.headings)) fail(where, p);
    for (const p of targetProblems(m.targets)) fail(where, p);
    if (m.cls > 0.05) fail(where, `layout shift ${m.cls.toFixed(3)} (limit 0.05)`);
    if (!forced) {
      const c = contrastProblems(m.samples);
      judgedContrast += c.judged;
      for (const p of c.bad) fail(where, p);
      if (c.judged < 8) fail(where, `only ${c.judged} text runs could be judged for contrast`);
    }
    (metrics[id] ??= {})[label] = {
      startBottom: Math.round(m.startBottom),
      heroHeight: Math.round(m.heroHeight),
      cls: Number(m.cls.toFixed(4)),
    };
    if (
      !flag("no-shots") &&
      id === ANCHOR &&
      [390, 1280].includes(width) &&
      !forced &&
      lang !== "bilingual"
    ) {
      mkdirSync(BASELINE_DIR, { recursive: true });
      const hero = await page.$(".hw-hero");
      if (flag("update"))
        await hero.screenshot({ path: join(BASELINE_DIR, `hero-${label.replace(/ /g, "-")}.png`) });
    }
  }
  await ctx.close();
}

try {
  for (const [width, height] of WIDTHS) {
    for (const lang of ["en", "es"]) {
      for (const [theme] of THEMES) {
        await runContext({ width, height, lang, theme, label: `${width} ${lang} ${theme}` });
      }
    }
  }
  for (const width of [390, 1280]) {
    await runContext({
      width,
      height: width === 390 ? 844 : 800,
      lang: "en",
      theme: "contrast",
      label: `${width} en contrast`,
    });
    await runContext({
      width,
      height: width === 390 ? 844 : 800,
      lang: "en",
      theme: "auto",
      label: `${width} en forced-colors`,
      forced: true,
    });
  }
} finally {
  await browser.close();
  await server.close();
}

if (runs === 0 || judgedContrast === 0)
  problems.push(
    `swept ${runs} pages and judged ${judgedContrast} text runs: a gate that measured nothing fails`,
  );

// Compare with the committed numbers, or write them.
const baselineFile = join(BASELINE_DIR, "metrics.json");
if (flag("update")) {
  mkdirSync(BASELINE_DIR, { recursive: true });
  let old = {};
  try {
    old = JSON.parse(readFileSync(baselineFile, "utf8")).metrics ?? {};
  } catch {}
  const merged = { ...old };
  for (const [id, ctxs] of Object.entries(metrics)) merged[id] = { ...(old[id] ?? {}), ...ctxs };
  const keep = {
    note: "Written by npm run validate:family-visual -- --update. Start/hero heights in px per lesson and context.",
    metrics: merged,
  };
  writeFileSync(baselineFile, `${JSON.stringify(keep, null, 2)}\n`);
} else {
  let base = {};
  try {
    base = JSON.parse(readFileSync(baselineFile, "utf8")).metrics ?? {};
  } catch {
    problems.push(`no baseline at ${baselineFile}; run with --update once`);
  }
  for (const [id, ctxs] of Object.entries(metrics)) {
    for (const [label, now] of Object.entries(ctxs)) {
      const was = base[id]?.[label];
      if (!was) continue;
      if (now.startBottom > was.startBottom + 40)
        problems.push(
          `${id} ${label}: Start moved from ${was.startBottom}px to ${now.startBottom}px`,
        );
      if (now.heroHeight > was.heroHeight * 1.15 + 20)
        problems.push(`${id} ${label}: hero grew from ${was.heroHeight}px to ${now.heroHeight}px`);
    }
  }
}

if (problems.length) {
  console.error(
    `validate:family-visual FAILED (${problems.length}) over ${runs} page loads, lessons ${lessons.join(", ")}:`,
  );
  for (const p of problems.slice(0, 60)) console.error(`  - ${p}`);
  if (problems.length > 60) console.error(`  ... and ${problems.length - 60} more`);
  process.exit(1);
}
console.log(
  `validate:family-visual OK: ${runs} page loads (${lessons.join(", ")}), ${judgedContrast} contrast runs judged, detectors self-tested.`,
);
