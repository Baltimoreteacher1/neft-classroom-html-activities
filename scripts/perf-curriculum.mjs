#!/usr/bin/env node
/* =============================================================================
 * perf-curriculum — record and enforce a performance budget for the hub.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * /curriculum is a 581 KB, 14,000-line HTML document with 32 inline <script>
 * blocks and 14 external ones, and no Core Web Vitals number has ever been
 * recorded for it. It is also the page every student is told to open first, on
 * a school Chromebook over district wifi. That combination is the difference
 * between a lesson starting and a lesson not starting, and right now a
 * regression in it is completely invisible.
 *
 * This records LCP, DOM-ready, and transfer weight into a committed JSON
 * history so regressions are DIFFABLE, and fails when a budget is exceeded.
 *
 * It is also the safety net for turning the hub's HTML into a generated
 * artifact: "the generator is correct" is only checkable against a recorded
 * before-and-after. Capture a baseline BEFORE that refactor.
 *
 *   node scripts/perf-curriculum.mjs                 # measure local dist, enforce
 *   node scripts/perf-curriculum.mjs --live          # measure production
 *   node scripts/perf-curriculum.mjs --record        # append to the history file
 *   node scripts/perf-curriculum.mjs --no-budget     # measure only, never fail
 * ========================================================================== */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "..");
const HISTORY = resolve(ROOT, "reports/perf-curriculum.json");

const LIVE = process.argv.includes("--live");
const RECORD = process.argv.includes("--record");
const NO_BUDGET = process.argv.includes("--no-budget");
const BASE = LIVE ? "https://eduwonderlab.com" : "http://localhost:4178";

/**
 * Budgets are set from the CURRENT measured reality plus headroom, not from a
 * generic "good site" target. A budget nobody can pass gets disabled within a
 * week; the point is to catch the next regression, not to relitigate the whole
 * page today. Tighten these deliberately as the page improves.
 */
/** Lighthouse's standard low-end-device proxy; also a fair Chromebook stand-in. */
const CHROMEBOOK_CPU_SLOWDOWN = 4;

const BUDGET = {
  lcp: 4000, // ms — the number that decides whether a lesson starts
  domContentLoaded: 3000, // ms
  transferKb: 900, // KB over the wire (document + subresources)
  decodedKb: 3000, // KB the browser must parse — the main-thread driver
  requests: 60,
};

async function measure() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }, // a school Chromebook's panel
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Throttle the CPU to CHROMEBOOK_CPU_SLOWDOWN×. Measuring this page on an
  // unthrottled Mac gives numbers that are true and useless: a 14,000-line
  // document with 32 inline <script> blocks is main-thread-bound, and that cost
  // is precisely what a dev machine hides. Network is deliberately NOT
  // throttled — district wifi varies far too much to produce a stable budget,
  // so transferKb is budgeted instead as the thing we actually control.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CHROMEBOOK_CPU_SLOWDOWN });

  // LCP is only observable via a PerformanceObserver registered BEFORE the page
  // starts painting — getEntriesByType("largest-contentful-paint") after load
  // returns nothing, because the buffer is not retained for that entry type.
  await page.addInitScript(() => {
    window.__lcp = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      /* unsupported browser — reported as n/a rather than guessed */
    }
  });

  const started = Date.now();
  const response = await page.goto(`${BASE}/curriculum/`, {
    waitUntil: "load",
    timeout: 60_000,
  });
  if (!response || !response.ok()) {
    await browser.close();
    throw new Error(`/curriculum/ returned ${response ? response.status() : "no response"}`);
  }

  // Let LCP settle: it is only final once the largest element has painted and
  // no larger candidate arrives. networkidle is the practical proxy here.
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    const resources = performance.getEntriesByType("resource") || [];

    // Sum transferSize from the Resource Timing API rather than content-length
    // headers: these responses are gzip/brotli-encoded and often chunked, so
    // content-length is absent on exactly the biggest assets. transferSize is
    // the real number of bytes that crossed the wire, including the document.
    const bytes =
      resources.reduce((sum, r) => sum + (r.transferSize || 0), 0) + (nav.transferSize || 0);

    return {
      lcp: window.__lcp ? Math.round(window.__lcp) : null,
      fcp: fcp ? Math.round(fcp.startTime) : null,
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav.loadEventEnd || 0),
      domNodes: document.getElementsByTagName("*").length,
      transferKb: Math.round(bytes / 1024),
      requests: resources.length + 1,
      // Uncompressed weight the browser must actually parse — the number that
      // drives main-thread time on a low-end Chromebook.
      decodedKb: Math.round(
        (resources.reduce((s, r) => s + (r.decodedBodySize || 0), 0) +
          (nav.decodedBodySize || 0)) /
          1024,
      ),
    };
  });

  await browser.close();

  return {
    recordedAt: new Date().toISOString(),
    target: LIVE ? "live" : "local",
    wallMs: Date.now() - started,
    ...metrics,
  };
}

function checkBudget(run) {
  const breaches = [];
  for (const [key, limit] of Object.entries(BUDGET)) {
    const value = run[key];
    if (typeof value !== "number" || value === 0) continue; // unmeasured, not a pass
    if (value > limit) breaches.push(`${key}: ${value} > ${limit}`);
  }
  return breaches;
}

function record(run) {
  mkdirSync(resolve(ROOT, "reports"), { recursive: true });
  let history = [];
  if (existsSync(HISTORY)) {
    try {
      const parsed = JSON.parse(readFileSync(HISTORY, "utf8"));
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      /* corrupt history is replaced, not merged */
    }
  }
  history.push(run);
  // Keep the file reviewable in a diff: the last 50 runs is plenty of trend.
  writeFileSync(HISTORY, `${JSON.stringify(history.slice(-50), null, 2)}\n`);
  console.log(`  recorded -> reports/perf-curriculum.json (${history.length} runs)`);
}

const DIM_NOTE = `(CPU throttled ${CHROMEBOOK_CPU_SLOWDOWN}×; network not throttled)`;

const run = await measure();

console.log(`\nperf — /curriculum/ (${run.target})`);
console.log(`  LCP                 ${run.lcp ?? "n/a"} ms      (budget ${BUDGET.lcp})`);
console.log(`  FCP                 ${run.fcp ?? "n/a"} ms`);
console.log(`  DOMContentLoaded    ${run.domContentLoaded} ms      (budget ${BUDGET.domContentLoaded})`);
console.log(`  transfer            ${run.transferKb} KB      (budget ${BUDGET.transferKb})`);
console.log(`  decoded             ${run.decodedKb} KB      (budget ${BUDGET.decodedKb})`);
console.log(`  requests            ${run.requests}         (budget ${BUDGET.requests})`);
console.log(`  DOM nodes           ${run.domNodes}`);
console.log(`  ${DIM_NOTE}`);

if (RECORD) record(run);

const breaches = checkBudget(run);
if (!breaches.length) {
  console.log("\n  within budget.\n");
  process.exit(0);
}

console.error(`\n  PERF BUDGET EXCEEDED:`);
for (const b of breaches) console.error(`    ✗ ${b}`);
console.error(
  "\n  This page is what students open first, on a school Chromebook.\n" +
    "  Either bring it back under budget or change the budget deliberately.\n",
);
process.exit(NO_BUDGET ? 0 : 1);
