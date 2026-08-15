#!/usr/bin/env node
/* =============================================================================
 * sweep-small-group-shell.mjs — the shared small-group shell, on every variant.
 *
 * The redesign is central: three tokens and one stylesheet reach all 204
 * generated small-group and catch-up lessons. Central also means a mistake
 * reaches all 204, and three sample lessons cannot see it. This opens every one
 * of them in a real browser and asserts the shell held.
 *
 * It checks the things a screenshot of three lessons cannot: that no page
 * overflows sideways, that the masthead did not swallow the viewport again,
 * that the decorative treatments stayed gone, and that content is actually
 * there — a "calm" page that renders nothing is not an improvement.
 *
 * Needs a preview server: `npm run preview -- --port 4499`.
 * ========================================================================== */

import { readdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = (process.env.BASE || "http://localhost:4499").replace(/\/$/, "");
const VIEWPORT = { width: 1366, height: 768 }; // the classroom laptop
/* 6 is right against a local preview server. Against production, six parallel
 * `networkidle` waits over a CDN time out on their own contention rather than
 * on anything about the page, so SWEEP_CONCURRENCY lowers it. */
const CONCURRENCY = Number(process.env.SWEEP_CONCURRENCY || 6);

/* The masthead used to run 581-615px on this viewport, putting the first
 * mathematical task at or below the fold. This is the ceiling that regression
 * has to cross to come back. */
const HERO_MAX = 520;

const ids = readdirSync("lessons", { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d+-\d+-(group\d+|catchup)$/.test(d.name))
  .map((d) => d.name)
  .sort();

const failures = [];
let checked = 0;
const stats = { heroMax: 0, shadowMax: 0, gradientMax: 0 };

const browser = await chromium.launch();

async function check(id) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  try {
    /* `domcontentloaded` + wait for the shell, NOT `networkidle`. These pages
     * hold a telemetry connection open, so on production network-idle never
     * arrives and the sweep times out on 16 of 204 lessons that render
     * perfectly in 3.3s — a wait condition failing, reported as a page
     * failing. What this sweep is actually waiting for is the shell. */
    await page.goto(`${BASE}/lessons/${id}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".sg-hero", { timeout: 30000 });
    // The shell paints its styles from JS; give the stylesheet a beat to land
    // before measuring computed values.
    await page.waitForTimeout(1200);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const hero = document.querySelector(".sg-hero");
      const body = getComputedStyle(document.body);
      /* SCOPE: the SHELL, not the whole page.
       *
       * This redesign owns the small-group shell — every element the shell
       * renders carries an `sg-` class. It does NOT own the shared interactive
       * components (the long-division lab's transport controls, the theme
       * illustrations), which are also used by whole-group lessons and whose
       * decoration is a separate, deliberately out-of-scope question.
       *
       * The first run of this sweep measured the whole page and reported 112
       * gradient fills on 10-5-group1. Every one of them belonged to
       * `.ldl-*` — the long-division lab. Counting them here would either fail
       * the build for something this pass did not touch, or push someone into
       * restyling a shared component to make a number go down. */
      const shell = [...document.querySelectorAll('[class*="sg-"]')];
      const heavy = shell.filter((e) => {
        // A shadow is "heavy" when its blur exceeds a hairline. Parsing the
        // longhand is not worth it; the blur is the third length.
        const parts = getComputedStyle(e).boxShadow.match(/(-?\d+(?:\.\d+)?)px/g) || [];
        return parts.length >= 3 && Math.abs(parseFloat(parts[2])) > 8;
      });
      return {
        overflow: de.scrollWidth - de.clientWidth,
        heroBottom: hero ? Math.round(hero.getBoundingClientRect().bottom) : null,
        bodyImage: body.backgroundImage,
        gradients: shell.filter((e) => /gradient/.test(getComputedStyle(e).backgroundImage)).length,
        heavyShadows: heavy.length,
        textLength: document.body.innerText.replace(/\s+/g, " ").trim().length,
        tabs: document.querySelectorAll(".sg-tabs .sg-step, .sg-tabs [role='tab']").length,
      };
    });

    if (m.overflow > 0) failures.push(`${id}: page overflows horizontally by ${m.overflow}px`);
    if (m.heroBottom === null) failures.push(`${id}: no masthead rendered`);
    else if (m.heroBottom > HERO_MAX) {
      failures.push(`${id}: masthead is ${m.heroBottom}px tall (ceiling ${HERO_MAX}px)`);
    }
    if (m.bodyImage !== "none")
      failures.push(`${id}: the page canvas grew a background image again`);
    if (m.gradients > 4) failures.push(`${id}: ${m.gradients} gradient fills in the shell`);
    /* Two shell elements legitimately float and keep their lift: the annotation
     * tool rail and the vocabulary dialog. Everything else on a page of
     * mathematics sits flat on the canvas. */
    if (m.heavyShadows > 2) {
      failures.push(`${id}: ${m.heavyShadows} heavy shadows in the shell (2 float legitimately)`);
    }
    // A calm page that rendered nothing is not an improvement.
    if (m.textLength < 1200) failures.push(`${id}: only ${m.textLength} chars of content`);
    if (!m.tabs) failures.push(`${id}: no phase tabs rendered`);

    stats.heroMax = Math.max(stats.heroMax, m.heroBottom || 0);
    stats.gradientMax = Math.max(stats.gradientMax, m.gradients);
    stats.shadowMax = Math.max(stats.shadowMax, m.heavyShadows);
    checked++;
  } catch (e) {
    failures.push(`${id}: ${String(e).split("\n")[0].slice(0, 120)}`);
  } finally {
    await ctx.close();
  }
}

const queue = ids.slice();
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const id = queue.shift();
      await check(id);
      if (checked % 25 === 0) process.stdout.write(".");
    }
  }),
);
await browser.close();

console.log(
  `\nSwept ${checked}/${ids.length} small-group variants at ${VIEWPORT.width}x${VIEWPORT.height}`,
);
console.log(
  `  tallest masthead ${stats.heroMax}px · most gradients ${stats.gradientMax} · most heavy shadows ${stats.shadowMax}`,
);
if (!checked) {
  console.error("FAIL: swept zero variants — is the preview server running?");
  process.exit(1);
}
if (failures.length) {
  console.error(`\nFAIL sweep:small-group — ${failures.length} problem(s):`);
  for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log("PASS sweep:small-group — the shared shell holds on every variant.");
