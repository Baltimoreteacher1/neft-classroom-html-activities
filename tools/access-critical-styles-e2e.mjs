#!/usr/bin/env node
// Proves access-practice-lab/critical-styles.json still covers the home view.
//
// Usage: node tools/access-critical-styles-e2e.mjs <baseUrl>
// <baseUrl> must serve the SOURCE shell (the 100+ separate stylesheet links), e.g. `npx serve` or any static
// server over the repo root with /assets mapped to public/assets. For every home state and viewport it records
// which sheets paint anything (Chrome CSS coverage) and exits 1 if one is missing from the critical list.
// A sheet missing there means home renders unstyled for a moment until the full bundle lands.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!base) {
  console.error("usage: node tools/access-critical-styles-e2e.mjs <baseUrl>");
  process.exit(2);
}
const critical = new Set(
  JSON.parse(
    readFileSync(new URL("../access-practice-lab/critical-styles.json", import.meta.url), "utf8"),
  ),
);
const prefs = (patch) => ({ "accessPracticeLab:v1:prefs": { langChosen: true, ...patch } });
const STATES = [
  {},
  prefs({ lang: "en", gradeFocus: "g68" }),
  prefs({ lang: "es", band: "6-8", gradeFocus: "g35" }),
  { ...prefs({ lang: "bi" }), tlp_v1_prefs: { role: "student", theme: "light", l1: "ar" } },
  { ...prefs({}), tlp_v1_prefs: { role: "family", theme: "dark", l1: "zh" } },
  {
    ...prefs({}),
    "accessPracticeLab:v1:comfort": { theme: "paper", lh: "airy", ls: "roomy", calm: true },
  },
  { ...prefs({}), "accessPracticeLab:v1:comfort": { theme: "contrast" } },
];
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];

const browser = await chromium.launch();
const painted = new Map();
for (const viewport of VIEWPORTS)
  for (const state of STATES) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addInitScript((st) => {
      for (const [k, v] of Object.entries(st)) localStorage.setItem(k, JSON.stringify(v));
    }, state);
    const page = await ctx.newPage();
    await page.coverage.startCSSCoverage();
    await page.goto(`${base}/access-practice-lab/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      scrollTo(0, 0);
    });
    for (const entry of await page.coverage.stopCSSCoverage()) {
      const href = new URL(entry.url).pathname;
      if (href.startsWith("/access-practice-lab/") && entry.ranges.length) painted.set(href, true);
    }
    await ctx.close();
  }
await browser.close();

const missing = [...painted.keys()].filter((href) => !critical.has(href)).sort();
const unused = [...critical].filter((href) => !painted.has(href)).sort();
console.log(`home paints with ${painted.size} lab sheets; critical list has ${critical.size}`);
if (unused.length)
  console.log(`note: listed but never painted (harmless, costs bytes): ${unused.join(", ")}`);
if (missing.length) {
  console.error(
    `FAIL: these sheets paint home but are not in critical-styles.json:\n  ${missing.join("\n  ")}`,
  );
  process.exit(1);
}
console.log("ok: critical-styles.json covers every sheet the home view paints with");
