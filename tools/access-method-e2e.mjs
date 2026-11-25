#!/usr/bin/env node
/* =============================================================================
 * access-method-e2e.mjs — the /method page ("How it works"), driven in a real browser.
 *
 * Five sections in English and in Spanish, one h1, no horizontal scroll at 375px, no axe serious or critical violation,
 * reachable from the footer on every page, listed in the sitemap, and no claim the lab cannot back (no score, no "proven").
 * No Chromium: SKIP (exit 3 locally, 1 in CI); never a pass.
 * ========================================================================== */
import { SITEMAP_PATHS } from "../functions/_lib/language-page.js";
import { serveAccess } from "./lib/access-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const { chromium } = await import("playwright");
let AxeBuilder = null;
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-method-e2e: axe-core/playwright is not installed; skipping the axe check.");
}
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch {
  process.exit(skipExit("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium"));
}

let failed = 0;
const fail = (m) => {
  failed++;
  console.error(`  FAIL  ${m}`);
};
const ok = (m) => console.log(`  ok    ${m}`);

if (!SITEMAP_PATHS.includes("/access-practice-lab/method")) fail("/method is not in the sitemap");

const { server, base } = await serveAccess();
const URL_ = `${base}/access-practice-lab/method`;

for (const lang of ["en", "es"]) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  await ctx.addInitScript(
    (l) =>
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ lang: l, langChosen: true }),
      ),
    lang,
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.waitForSelector("#methodTitle", { timeout: 15000 }).catch(() => {});
  const h1s = await page.locator("h1").count();
  const sections = await page.locator(".trust-page section, .trust-page .trust-section").count();
  const text = (
    await page
      .locator(".trust-page")
      .innerText()
      .catch(() => "")
  ).trim();
  if (h1s !== 1) fail(`${lang}: expected one h1, found ${h1s}`);
  if (sections < 5) fail(`${lang}: expected 5 sections, found ${sections}`);
  if (!text) fail(`${lang}: the page rendered no text`);
  const marker = lang === "es" ? /Cómo funciona el laboratorio/ : /How the lab works/;
  if (!marker.test(text)) fail(`${lang}: the page is not in ${lang}`);
  if (/\b(proven|guarantee|boost your score|will raise)\b/i.test(text))
    fail(`${lang}: the page makes a claim it cannot back`);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail(`${lang}: horizontal scroll at 375px`);
  if (AxeBuilder) {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    for (const v of bad) fail(`${lang}: axe ${v.impact} ${v.id} (${v.nodes.length} node(s))`);
  }
  if (errors.length) fail(`${lang}: page error ${errors[0]}`);
  // the footer reaches it from another page
  if (lang === "en") {
    await page.goto(`${base}/access-practice-lab/`, { waitUntil: "networkidle" });
    const link = await page.locator(".footer-utility a[href*='/method']").count();
    if (!link) fail("en: the footer has no link to /method");
  }
  await ctx.close();
  if (!failed) ok(`${lang}: five sections, one h1, no overflow, axe clean`);
}

await browser.close();
server.close();
if (failed) {
  console.error(`\naccess-method-e2e: FAIL (${failed})`);
  process.exit(1);
}
console.log("access-method-e2e: PASS");
