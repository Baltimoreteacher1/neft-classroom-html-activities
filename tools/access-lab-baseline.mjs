#!/usr/bin/env node
/**
 * Baseline capture for the ACCESS Practice Lab: requests, transfer, DOM nodes,
 * header height, text smaller than 12px, axe violations per route, and
 * screenshots at 390 / 768 / 1200 / 1600.
 *
 *   node tools/access-lab-baseline.mjs [--base=https://thelanguagepage.com] [--out=reports/language-page/<name>] [--routes=a,b]
 *
 * Read-only against whatever --base points at. Writes <out>.json and <out>-shots/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const axeSource = require("fs").readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const BASE = arg("base", "https://thelanguagepage.com").replace(/\/$/, "");
const OUT = arg("out", "reports/language-page/baseline-live");
const ROUTES = arg(
  "routes",
  "home,learn,tests,road,family,passport,tools,search,missions,games",
).split(",");
const WIDTHS = [
  [390, 844],
  [768, 1024],
  [1200, 800],
  [1600, 900],
];
const pathFor = (route) =>
  route === "home" ? "/access-practice-lab/" : `/access-practice-lab/${route}`;

mkdirSync(`${OUT}-shots`, { recursive: true });
const launch = () =>
  chromium.launch({ channel: process.env.PW_CHANNEL || "chrome", args: ["--no-sandbox"] });
const results = { base: BASE, capturedAt: new Date().toISOString(), home: {}, routes: {} };

async function measure(route) {
  const browser = await launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      bypassCSP: true,
    });
    const page = await ctx.newPage();
    let requests = 0;
    let bytes = 0;
    page.on("response", async (res) => {
      requests += 1;
      try {
        bytes += Number(res.headers()["content-length"] || 0) || (await res.body()).length;
      } catch {}
    });
    // First visit: dismiss nothing, so the measurement is what a new user gets.
    await page
      .goto(`${BASE}${pathFor(route)}`, { waitUntil: "load", timeout: 60000 })
      .catch((e) => console.warn(route, "goto:", e.message.slice(0, 120)));
    await page.waitForTimeout(2500);
    const dom = await page.evaluate(() => {
      const header = document.querySelector("header");
      const small = [...document.querySelectorAll("body *")].filter((el) => {
        if (
          !el.childNodes.length ||
          ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        )
          return false;
        return parseFloat(getComputedStyle(el).fontSize) < 12;
      }).length;
      return {
        nodes: document.getElementsByTagName("*").length,
        svgs: document.querySelectorAll("svg").length,
        h1: document.querySelectorAll("h1").length,
        h2: document.querySelectorAll("h2").length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        textUnder12px: small,
        title: document.title,
      };
    });
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      });
      const by = {};
      for (const v of r.violations) by[v.impact] = (by[v.impact] || 0) + 1;
      return {
        total: r.violations.length,
        byImpact: by,
        rules: r.violations.map((v) => `${v.id}:${v.impact}`),
      };
    });
    const entry = { requests, transferKB: Math.round(bytes / 1024), ...dom, axe };
    results.routes[route] = entry;
    if (route === "home") results.home = entry;
    for (const [w, h] of WIDTHS) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(`${OUT}-shots`, `${route}-${w}.png`), fullPage: false });
    }
    await ctx.close();
  } finally {
    await browser.close().catch(() => {});
  }
}
for (const route of ROUTES) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await measure(route);
      break;
    } catch (e) {
      console.warn(route, `attempt ${attempt} failed:`, e.message.split("\n")[0]);
    }
  }
}
writeFileSync(`${OUT}.json`, `${JSON.stringify(results, null, 1)}\n`);
console.log(JSON.stringify(results.routes, null, 1));
