#!/usr/bin/env node
/**
 * The K–1 Teacher Tour (/start/tour-k1) in a real browser:
 *   - walks all nine steps for Kindergarten with Next, each with Mr. Neft's scripted line and a "Try it";
 *   - opens one "Try it" (Story Time) in the page's sandboxed preview frame and sees the real page load;
 *   - a reload mid-tour stays on the step, and opening the tour again resumes where the teacher stopped;
 *   - Grade 1 swaps the activities; Spanish shows the Spanish words and Mr. Neft's Spanish line;
 *   - the quick reference downloads as a real PDF; the Start page and the Grades 3–8 tour link here;
 *   - 375px has no horizontal scroll; axe finds no serious or critical issue; no console or page errors.
 *   node tools/access-intro-k1-tour-e2e.mjs   (serves this working tree; a missing browser is a SKIP locally, FAIL in CI)
 */
import { readFileSync } from "node:fs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-intro-k1-tour-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}
const { K1_STEPS } = await import("../access-practice-lab/src/intro/tour-k1-data.js");
// BASE=https://thelanguagepage.com runs the same walk against a deployed site instead of the source tree.
const { server, base } = process.env.BASE ? { server: null, base: process.env.BASE.replace(/\/$/, "") } : await serveAccess();
const LAB = `${base}/access-practice-lab`;
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-k1-tour-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};
const errors = [];
const watch = (p) => {
  p.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(`pageerror: ${e.message}`);
  });
  p.on("console", (m) => {
    if (m.type() === "error" && !/web-vitals|Failed to load resource|favicon/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
};
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", acceptDownloads: true });
const page = await context.newPage();
watch(page);

const step = () => page.locator("[data-k1t-root]").getAttribute("data-k1t-step");
const grade = () => page.locator("[data-k1t-root]").getAttribute("data-k1t-grade");
const coach = () => page.locator(".k1t-coach .nb-say").innerText();
const axeBad = async (label) => {
  if (!AxeBuilder) return [];
  const r = await new AxeBuilder({ page }).include("[data-k1t-root]").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  return r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${label} ${v.id}`);
};

try {
  await page.goto(`${LAB}/start/tour-k1?grades=K`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${LAB}/start/tour-k1?grades=K`);
  await page.waitForSelector("[data-k1t-root]");
  check("the K–1 tour opens on its first step for Kindergarten", (await step()) === "welcome" && (await grade()) === "K");
  check("one h1 names the K–1 tour", (await page.locator("h1").count()) === 1 && /K–1 Teacher Tour/.test(await page.locator("h1").innerText()));
  check("the step rail lists all nine steps", (await page.locator(".ts-rail li").count()) === K1_STEPS.length);

  /* walk every step */
  const bad = [];
  const axe = [];
  const seen = [];
  for (let i = 0; i < K1_STEPS.length; i++) {
    seen.push(await step());
    const line = await coach();
    if (line !== K1_STEPS[i].neft.en) bad.push(`${K1_STEPS[i].id}: coach "${line.slice(0, 40)}"`);
    if (!(await page.locator(".k1t-act.is-primary [data-k1t-try]").count())) bad.push(`${K1_STEPS[i].id}: no Try it`);
    if (i === 1) {
      check("step 2 for Kindergarten is Story Time read aloud", /Story Time/.test(await page.locator(".k1t-act.is-primary").innerText()));
      await page.locator(".k1t-act.is-primary [data-k1t-try]").click();
      await page.waitForSelector(".k1t-iframe");
      const sandbox = await page.locator(".k1t-iframe").getAttribute("sandbox");
      check("Try it opens the real page in a sandboxed preview frame", sandbox.includes("allow-scripts") && !sandbox.includes("allow-top-navigation"));
      const frame = page.frameLocator(".k1t-iframe");
      await frame.locator(".early-story").first().waitFor({ timeout: 20000 });
      const text = await frame.locator("body").innerText();
      check("Story Time loaded inside the frame", /Our Neighborhood Garden/.test(text) && /Read the page/.test(text), text.slice(0, 80));
      check("the Try it button says the frame is open", (await page.locator(".k1t-act.is-primary [data-k1t-try]").getAttribute("aria-expanded")) === "true");
      axe.push(...(await axeBad("story-frame")));
    }
    if (i === 4) {
      await page.reload();
      await page.waitForSelector("[data-k1t-root]");
      check("a reload mid-tour stays on the same step", (await step()) === K1_STEPS[4].id);
      await page.goto(`${LAB}/start`);
      await page.waitForSelector(".in-choice.is-tour");
      check("the Start page offers to continue the K–1 tour", /Continue the K–1 Teacher Tour/.test(await page.locator(".in-choice.is-tour").innerText()));
      await page.goto(`${LAB}/start/tour-k1`);
      await page.waitForSelector("[data-k1t-root]");
      check("opening the tour again resumes where the teacher stopped", (await step()) === K1_STEPS[4].id && (await page.locator(".k1t-resumed").count()) === 1);
    }
    if (i % 3 === 0) axe.push(...(await axeBad(K1_STEPS[i].id)));
    if (i < K1_STEPS.length - 1) {
      await page.locator("[data-k1t-next]").click();
      await page.waitForFunction((id) => document.querySelector("[data-k1t-root]")?.dataset.k1tStep === id, K1_STEPS[i + 1].id);
    }
  }
  check("Next walks all nine steps in order", seen.join(",") === K1_STEPS.map((s) => s.id).join(","), seen.join(","));

  /* last step: family links and the quick reference */
  check("the last step links Practice Together and the K–2 handout", (await page.locator('.k1t-links a[href*="/practice-together"]').count()) === 1 && (await page.locator('.k1t-links a[href$="family-handout-k2.pdf"]').count()) === 1);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-k1t-pdf]").click()]);
  const pdf = readFileSync(await dl.path());
  check("the quick reference downloads as a real PDF", pdf.subarray(0, 5).toString() === "%PDF-" && pdf.length > 2000, dl.suggestedFilename());

  /* Grade 1 */
  await page.locator('[data-k1t-pick="1"]').click();
  await page.waitForFunction(() => document.querySelector("[data-k1t-root]")?.dataset.k1tGrade === "1");
  check("Grade 1 keeps the step and puts the grade in the address", (await step()) === "families" && new URL(page.url()).searchParams.get("grades") === "1");
  await page.goto(`${LAB}/start/tour-k1?grades=1&stop=2`);
  await page.waitForSelector("[data-k1t-root]");
  check("Grade 1 listening opens a Grade 1 activity", /Find the Cat/.test(await page.locator(".k1t-act.is-primary").innerText()) && (await page.locator('.k1t-act a[href*="/g1-l-a-hear-cat"]').count()) === 1);

  /* Spanish */
  await page.locator('.k1t-tools [data-lang-mode="es"]').click();
  await page.waitForFunction(() => /Recorrido/.test(document.querySelector("h1")?.textContent || ""));
  check("Spanish shows the Spanish title and Mr. Neft's Spanish line", (await coach()) === K1_STEPS[1].neft.es);
  check("Spanish directions use ustedes", /Abran|toquen|Toquen/.test(await page.locator(".k1t-do").innerText()));
  axe.push(...(await axeBad("spanish")));
  await page.locator('.k1t-tools [data-lang-mode="en"]').click();
  await page.waitForFunction(() => /K–1 Teacher Tour/.test(document.querySelector("h1")?.textContent || ""));

  /* entry points */
  await page.goto(`${LAB}/start?grades=1`);
  await page.waitForSelector(".in-choice.is-tour");
  check("the Start page tour choice for Grade 1 opens the K–1 tour", /\/start\/tour-k1\?grades=1$/.test(await page.locator(".in-choice.is-tour").getAttribute("href")));
  await page.goto(`${LAB}/start/tour?part=2&skill=speaking&grades=K`);
  await page.waitForSelector("[data-k1t-root]");
  check("a Kindergarten domain card's tour link opens the K–1 tour at the talk step", (await step()) === "talk");
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${LAB}/start/tour`);
  await page.waitForSelector("[data-t2-root]");
  if (await page.locator(".t2-gate").count()) {
    await page.locator('[data-t2="gate-new"]').click();
    await page.locator('[data-t2="gate-new"]').click();
  }
  await page.waitForSelector('[data-t2-field="band"]');
  check("the Grades 3–8 tour still offers only 3–5 and 6–8", (await page.locator('[data-t2-field="band"]').count()) === 2);
  check("the Grades 3–8 tour links to the K–1 tour", (await page.locator('.t2-hint a[href*="/start/tour-k1"]').count()) >= 1);

  /* 375px */
  const phone = await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: "reduce" });
  const m = await phone.newPage();
  watch(m);
  const wide = [];
  for (const n of [1, 2, 5, 9]) {
    await m.goto(`${LAB}/start/tour-k1?grades=K&stop=${n}`);
    await m.waitForSelector("[data-k1t-root]");
    if (n === 2) {
      await m.locator(".k1t-act.is-primary [data-k1t-try]").click();
      await m.waitForSelector(".k1t-iframe");
    }
    if (!(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))) wide.push(n);
  }
  check("375px: no horizontal scroll on any checked step", wide.length === 0, wide.join(","));
  const small = await m.evaluate(() =>
    [...document.querySelectorAll("[data-k1t-root] .k1t-act-btns .btn, [data-k1t-root] .k1t-pick, [data-k1t-root] [data-k1t-next]")]
      .filter((b) => b.getBoundingClientRect().height < 44)
      .map((b) => b.textContent.trim().slice(0, 30)),
  );
  check("375px: tour buttons are at least 44px tall", small.length === 0, small.join(" | "));
  await phone.close();

  check("axe: no serious or critical violations", axe.length === 0, JSON.stringify(axe));
  check("every step had Mr. Neft's line and a Try it", bad.length === 0, JSON.stringify(bad));
  check("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
} catch (error) {
  check("e2e ran to the end", false, error.stack || String(error));
} finally {
  await browser.close();
  server?.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\naccess-intro-k1-tour-e2e: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
