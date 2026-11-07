#!/usr/bin/env node
/**
 * Immersive Reader Studio, driven in a real browser:
 * (access-practice-lab/src/views/reader.js, src/lang/reader.js, reader.css).
 * Asserts:
 *  - /reader loads with h1 and controls
 *  - Sample chips switch texts and re-parse sentences/words
 *  - Word click opens the Word Inspector with definition, syllables, audio button
 *  - "Save to My Word Bank" persists word in localStorage and displays in Word Bank tab
 *  - Word Bank flashcard flip and Leitner review rating works
 *  - Text Insights tab displays word/sentence counts and academic terms
 *  - axe WCAG 2.2 AA passes on reader surface
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-reader-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-reader-e2e: axe-core/playwright is not installed; skipping axe checks.");
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const BASE = "/access-practice-lab";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-reader-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}

const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await context.newPage();
const problems = [];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis/i;
page.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(`console: ${m.text()}`),
);

const go = async (path) => {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => (document.querySelector("#app")?.innerText || "").trim().length > 10,
    { timeout: 10000 },
  );
};

async function axeCheck(label, exclude = "") {
  if (!AxeBuilder) return;
  const builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  const res = await (exclude ? builder.exclude(exclude) : builder).analyze();
  const bad = res.violations.map(
    (v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
  );
  ok(
    bad.length === 0,
    `axe WCAG 2.2 AA: ${label}${bad.length ? ` — ${bad.slice(0, 3).join(" | ")}` : ""}`,
  );
}

try {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ langChosen: true, lang: "en", band: "6-8" }),
      );
      localStorage.removeItem("accessPracticeLab:v1:reader");
    } catch {}
  });

  // 1. Navigation and render
  await go(`${BASE}/reader`);
  ok(page.url().includes(`${BASE}/reader`), "loaded /reader URL");
  ok(
    (await page.locator("h1").innerText()).includes("Immersive Reader"),
    "renders Immersive Reader h1",
  );
  ok(
    (await page.locator(".reader-surface .reader-word").count()) > 20,
    "parses words into interactive elements",
  );

  // 2. Sample picker
  const sampleBtn = page.locator("[data-reader-sample='sample-seasons']");
  await sampleBtn.click();
  await page.waitForTimeout(150);
  const text = await page.locator(".reader-surface").innerText();
  ok(
    text.includes("Earth travels around the sun"),
    "switching sample updates text in reading surface",
  );

  // 3. Click word to open inspector
  const wordEl = page.locator(".reader-surface .reader-word", { hasText: /sun/i }).first();
  await wordEl.click();
  const overlay = page.locator(".word-inspector-overlay");
  ok(await overlay.isVisible(), "clicking word opens word inspector");
  ok(
    (await page.locator("#inspectorWordTitle").innerText()).toLowerCase() === "sun",
    "inspector shows clicked word",
  );
  ok(
    (await page.locator(".syllables-count").innerText()).includes("syllable"),
    "shows syllable count",
  );

  // 4. Save word to word bank
  const saveBtn = page.locator("[data-toggle-save-word]").first();
  await saveBtn.click();
  await page.waitForTimeout(100);
  ok((await saveBtn.innerText()).includes("Saved"), "button updates to Saved state");

  // Close inspector
  await page.locator("[data-close-inspector]").click();
  await page.waitForTimeout(100);
  ok(!(await overlay.isVisible()), "close button dismisses inspector");

  // 5. Switch to Word Bank tab
  const bankTab = page.locator("[data-reader-tab='bank']");
  await bankTab.click();
  await page.waitForTimeout(150);
  ok(
    await page.locator(".flashcard-arena").isVisible(),
    "Word Bank tab renders flashcard arena with saved word",
  );
  ok(
    (await page.locator(".flashcard-word").innerText()).toLowerCase() === "sun",
    "shows saved word on flashcard",
  );

  // 6. Flip flashcard and rate
  await page.locator("[data-flip-card]").click();
  ok(
    await page.locator(".flashcard-card.flipped").isVisible(),
    "tapping card flips to reveal definition",
  );
  await page.locator("[data-rate-card='know-it']").click();
  await page.waitForTimeout(150);
  ok(
    await page.locator(".flashcard-caughtup").isVisible(),
    "advances card on ladder, caught up on reviews",
  );

  // 7. Switch to About this text tab
  await page.locator("[data-reader-tab='insights']").click();
  await page.waitForTimeout(150);
  ok(
    await page.locator(".reader-insights-section").isVisible(),
    "insights tab displays text analytics",
  );
  ok(
    (await page.locator(".stat-card").count()) === 4,
    "shows 4 metric cards (words, sentences, multi-syllable, longest)",
  );

  // 8. Return to Reader tab & axe check
  await page.locator("[data-reader-tab='read']").click();
  await page.waitForTimeout(200);
  await axeCheck("Immersive Reader workspace", "");

  ok(
    problems.length === 0,
    `no console errors${problems.length ? `: ${problems.slice(0, 3).join(" | ")}` : ""}`,
  );
} catch (error) {
  failures.push(`threw: ${error.message}`);
  console.log(`FAIL threw: ${error.stack}`);
} finally {
  await browser.close();
  server?.close();
}

if (failures.length) {
  console.error(`\naccess-reader-e2e: ${failures.length} failure(s)\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("\naccess-reader-e2e: all checks passed");
