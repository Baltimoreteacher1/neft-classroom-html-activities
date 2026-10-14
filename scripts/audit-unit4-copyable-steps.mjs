#!/usr/bin/env node
// Unit 4 practice studios: no step may be answered by typing the same number twice.
//
// A multi-step problem whose last box repeats the previous box ("Step 2 = 40, Step 3 = 40") can be
// finished by copying, with no thought about what the number means. Until 2026-10-14 the 4-2 and 4-1
// pages did exactly that on every problem, and said so in their own feedback: "Copy your Step 2 answer
// into Step 3." Those steps now ask what the percent MEANS (U4Studio.meaningCheck).
//
// How it checks: it marks every item solved, which makes each page fill in the correct values, opens
// every problem, and reports any problem whose required boxes hold the same value twice. The few
// repeats left are listed below with the reason each one is intended; anything else fails.
//
// Needs a browser. Without one it exits 3 (SKIP) and verifies nothing, per tools/lib/skip-exit.mjs.
// Run: npm run audit:copyable-steps

import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { SKIP_EXIT } from "../tools/lib/skip-exit.mjs";

const ROOT = process.cwd();
const UNIT = join(ROOT, "math/unit-4");

/** page -> "tab#problem" -> why a repeat is intended */
const ALLOWED = {
  "4-2-practice-studio": {
    "2#1": "worked model: the first conversion keeps the typed percent",
    "3#1":
      "a decimal written as hundredths: 0.35 = 35/100 = 35%, and writing the fraction out first was the request",
    "3#4":
      "a decimal written as hundredths: 0.08 = 8/100 = 8%, and writing the fraction out first was the request",
  },
  "percent-practice-studio": {
    "1#5": "notation task: 23 out of 100 is written as a fraction, a decimal and a percent",
    "2#1": "worked model: the first scaling problem keeps the typed percent",
    "3#4": "worked model: the first bridge table keeps the typed final percent",
  },
  "percent-practice-studio-challenging": {
    "4#5": "walk 8, bike 12 and bus 12 are equal by arithmetic (37.5% of 32 and the remainder)",
  },
};

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url || "/").split("?")[0])).replace(
    /^(\.\.[/\\])+/,
    "",
  );
  let file = join(ROOT, path);
  if (path.endsWith("/")) file = join(file, "index.html");
  try {
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}/math/unit-4/`;

let browser;
try {
  const { chromium } = await import("@playwright/test");
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (e) {
  console.log(
    `SKIP audit:copyable-steps — no browser available (${String(e.message).split("\n")[0]})`,
  );
  server.close();
  process.exit(SKIP_EXIT);
}

const pages = readdirSync(UNIT)
  .filter((d) => /practice-studio(-challenging)?$/.test(d))
  .sort();
const unexpected = [];
const fired = new Set();
let checked = 0;
let repeats = 0;
for (const name of pages) {
  const html = readFileSync(join(UNIT, name, "index.html"), "utf8");
  const key = html.match(/STORAGE_KEY = ['"]([\w-]+)['"]/)?.[1];
  const ids = [...new Set([...html.matchAll(/\bid:\s*['"]([\w-]+)['"]/g)].map((m) => m[1]))];
  const solved = Object.fromEntries(ids.map((i) => [i, true]));
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(
    ([k, m]) =>
      localStorage.setItem(
        k,
        JSON.stringify({
          solved1: m,
          solved2: m,
          solved3: m,
          solved4: m,
          solved5: {},
          solved: [m, m, m, m, {}],
          activeTab: 1,
        }),
      ),
    [key, solved],
  );
  await page.goto(`${base}${name}/index.html`);
  for (let tab = 1; tab <= 4; tab++) {
    await page.locator(`#tab-${tab}`).click();
    const dots = await page.locator(`#panel-${tab} .dots-row .step-dot`).count();
    for (let i = 0; i < dots; i++) {
      await page.locator(`#panel-${tab} .dots-row .step-dot`).nth(i).click();
      const vals = await page.evaluate((t) => {
        const panel = document.querySelector(`#panel-${t}`);
        return [...panel.querySelectorAll("input:not([type=range]):not([type=checkbox])")]
          .filter((e) => e.offsetParent)
          .map((e) => String(e.value).trim())
          .filter(Boolean);
      }, tab);
      checked++;
      const dup = vals.filter((v, j) => vals.indexOf(v) !== j);
      if (!dup.length) continue;
      repeats++;
      const why = ALLOWED[name]?.[`${tab}#${i + 1}`];
      if (why) fired.add(`${name} ${tab}#${i + 1}`);
      else
        unexpected.push(
          `${name} section ${tab} problem ${i + 1}: ${JSON.stringify(vals)} repeats ${[...new Set(dup)].join(", ")}`,
        );
    }
  }
  await ctx.close();
}
await browser.close();
server.close();

if (checked < 100) {
  console.log(
    `FAIL audit:copyable-steps — only ${checked} problems opened; the sweep found almost nothing, so it verified nothing.`,
  );
  process.exit(1);
}
// an allowance that no longer fires must go, so the list cannot turn into stale absolutions
for (const [name, items] of Object.entries(ALLOWED)) {
  for (const k of Object.keys(items)) {
    if (!fired.has(`${name} ${k}`))
      unexpected.push(
        `stale allowance ${name} ${k}: that problem no longer repeats a value, delete the entry`,
      );
  }
}
if (unexpected.length) {
  console.log(
    `FAIL audit:copyable-steps — ${unexpected.length} problem(s) can be finished by typing one number twice:`,
  );
  for (const u of unexpected) console.log(`  ${u}`);
  process.exit(1);
}
console.log(
  `PASS audit:copyable-steps — ${checked} problems opened across ${pages.length} pages; ${repeats} intended repeat(s), none unexplained.`,
);
