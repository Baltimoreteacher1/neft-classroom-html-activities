#!/usr/bin/env node
/**
 * fonts-fcp-probe.mjs — first contentful paint with the font CDN healthy and
 * with it HANGING.
 *
 * Hanging, not blocked, on purpose. A hard block fails fast and understates the
 * problem — measured last night, blocking made first paint FASTER. The damage
 * comes from a network that accepts the connection and never answers, which
 * holds a render-blocking stylesheet for as long as it hangs.
 *
 * Usage: node tools/fonts-fcp-probe.mjs <baseUrl> [--json out.json]
 */
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = (process.argv[2] || "http://localhost:4499").replace(/\/$/, "");
const jsonAt = process.argv.indexOf("--json");
const HOSTS = ["**://fonts.googleapis.com/**", "**://fonts.gstatic.com/**"];
const HANG_MS = 12000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const PAGES = [
  ["worksheet 1-2", "/lessons/1-2/worksheet.html"],
  ["worksheet 9-1", "/lessons/9-1/worksheet.html"],
  ["worksheet 10-4", "/lessons/10-4/worksheet.html"],
  ["answer key 1-2", "/lessons/1-2/worksheet-answer-key.html"],
  ["answer key 9-1", "/lessons/9-1/worksheet-answer-key.html"],
  ["answer key 10-4", "/lessons/10-4/worksheet-answer-key.html"],
  ["printable 1-2 handout", "/lessons/1-2/handout.html"],
  ["printable 9-1 slides", "/lessons/9-1/slides.html"],
  ["printable 10-4 homework", "/lessons/10-4/homework.html"],
  ["project unit-1 version-a", "/math/unit-1/projects/version-a/"],
  ["project unit-9 version-a", "/math/unit-9/projects/version-a/"],
  ["project pre-unit version-a", "/math/pre-unit/projects/version-a/"],
];

async function fcp(browser, path, mode) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (mode === "hang") {
    for (const p of HOSTS)
      await ctx.route(p, async (r) => {
        await sleep(HANG_MS);
        try {
          await r.abort();
        } catch {}
      });
  }
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "commit", timeout: 40000 });
  const v = await page.evaluate(
    async () =>
      await new Promise((res) => {
        const seen = performance
          .getEntriesByType("paint")
          .find((x) => x.name === "first-contentful-paint");
        if (seen) return res(Math.round(seen.startTime));
        new PerformanceObserver((l, o) => {
          const p = l.getEntries().find((x) => x.name === "first-contentful-paint");
          if (p) {
            o.disconnect();
            res(Math.round(p.startTime));
          }
        }).observe({ type: "paint", buffered: true });
        setTimeout(() => res(-1), 16000);
      }),
  );
  await ctx.close();
  return v;
}

const browser = await chromium.launch();
const rows = [];
for (const [name, path] of PAGES) {
  const healthy = await fcp(browser, path, "open");
  const hanging = await fcp(browser, path, "hang");
  rows.push({ name, path, healthy, hanging });
  const f = (n) => (n < 0 ? "no paint" : `${n}ms`);
  console.log(
    `${name.padEnd(28)} healthy=${f(healthy).padStart(9)}   CDN hangs=${f(hanging).padStart(9)}`,
  );
}
await browser.close();
if (jsonAt > 0) writeFileSync(process.argv[jsonAt + 1], JSON.stringify(rows, null, 1));
