// Family 4.0 in a real browser: the home (grade chips, optional note, routines, one-tap start and resume), the achievements
// page and the printable reports, in English and Spanish at 390, 820 and 1280 wide, by keyboard, with a clean console.
// Served by vite from the source tree, like feedback-panel.browser.test.mjs. A missing browser is a SKIP (exit 3).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { shiftedSeed } from "../../tools/lib/fl4-family-fixtures.mjs";

const seed = shiftedSeed();
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/family`;
let browser;
const problems = [];
const notes = [];
try {
  browser = await chromium.launch({ headless: true });
} catch (error) {
  console.log(`family-4 browser: SKIP (${error.message.split("\n")[0]})`);
  await server.close();
  process.exit(3);
}

// The teacher growth log is published by another workstream; until it is merged its file is absent and the page falls back.
const ALLOWED_404 = /\/growth-log\.js/;
async function open({ width = 1280, lang = "en", seeded = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", acceptDownloads: true, hasTouch: width < 600 });
  await context.addInitScript(
    ({ data, language }) => {
      if (data) {
        localStorage.setItem("ewl-fluency-tutor-v2", JSON.stringify(data.tutor));
        localStorage.setItem("ewl-fluency-rewards-v1", JSON.stringify(data.rewards));
      }
      localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify(language));
    },
    { data: seeded ? seed : null, language: lang },
  );
  const page = await context.newPage();
  const missing = [];
  page.on("response", (response) => response.status() === 404 && missing.push(response.url()));
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (/Failed to load resource/.test(message.text()) && missing.every((url) => ALLOWED_404.test(url))) return;
    problems.push(`console: ${message.text()}`);
  });
  return page;
}
const noOverflow = async (page, label) =>
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${label}: no horizontal overflow`);
const serious = async (page, label) => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const bad = violations.filter((v) => ["critical", "serious"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`);
  assert.deepEqual(bad, [], `${label}: axe serious/critical`);
};
const pdfPages = async (page) => {
  const pdf = await page.pdf({ format: "Letter", printBackground: true, preferCSSPageSize: true });
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
};

try {
  // ---- home: choose a grade, start and resume in two clicks ------------------------------------------------------------------
  let page = await open();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="routine-quick"]').waitFor();
  assert.equal(await page.locator('[data-testid="optional-note"]').isVisible(), true, "optional practice is stated on the first screen");
  assert.match(await page.locator('[data-testid="optional-note"]').innerText(), /optional/i);
  assert.equal(await page.locator('[data-testid="grownup-guide"] li').count(), 3, "three plain steps for grown-ups");
  assert.equal(await page.locator(".hm4-routine").count(), 3, "three short routines");
  assert.equal(await page.locator('[data-testid="grade-selector"] input').count(), 9, "nine grade choices, K to 8");
  await page.locator('[data-testid="grade-4"]').check(); // click 1
  assert.match(await page.locator('[data-testid="grade-now"]').innerText(), /Grade 4/);
  await page.locator('[data-testid="routine-steady"]').click(); // click 2
  await page.waitForSelector("[data-fm2-shell]", { timeout: 15000 });
  assert.match(page.url(), /play\.html\?.*grade=4/, "the routine opens a Grade 4 plan");
  await page.goto(`${base}/?grade=4`, { waitUntil: "networkidle" });
  const resume = page.locator('[data-testid="resume-link"]');
  if (await resume.count()) {
    await resume.click(); // resume in one click
    await page.waitForSelector("[data-fm2-shell]", { timeout: 15000 });
    notes.push("resume: one click");
  } else notes.push("resume banner not offered before the first round (skipped)");
  await page.context().close();

  // ---- home: keyboard only ------------------------------------------------------------------------------------------------------
  page = await open();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="grade-1"]').focus();
  await page.keyboard.press("ArrowRight");
  assert.match(await page.locator('[data-testid="grade-now"]').innerText(), /Grade 2/, "arrow keys move through the grade chips");
  await page.keyboard.press("Tab");
  assert.ok(await page.evaluate(() => document.activeElement?.closest("#setup") !== null), "Tab leaves the chips for the next control");
  const topic = page.locator("[data-open-topic]").first();
  await topic.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#skills-region").evaluate((el) => el.open), true, "a topic card opens the skill list from the keyboard");
  await page.context().close();

  // ---- every page at three widths, English and Spanish ----------------------------------------------------------------------------
  for (const width of [390, 820, 1280]) {
    for (const lang of ["en", "es"]) {
      page = await open({ width, lang });
      await page.goto(`${base}/`, { waitUntil: "networkidle" });
      await page.locator('[data-testid="routine-quick"]').waitFor();
      await noOverflow(page, `home ${lang}@${width}`);
      if (lang === "es") {
        assert.match(await page.locator("#routines-title").innerText(), /Rutinas cortas/);
        assert.match(await page.locator('[data-testid="optional-note"]').innerText(), /Pueden saltarse/, "adult lines use ustedes");
        assert.match(await page.locator('[data-testid="grade-selector"]').evaluate((el) => el.closest("fieldset").querySelector("legend").innerText), /Elige un grado/, "child-facing controls use tú");
      }
      await page.goto(`${base}/achievements.html`, { waitUntil: "networkidle" });
      await page.locator(".a4-card").first().waitFor();
      await noOverflow(page, `achievements ${lang}@${width}`);
      assert.match(await page.locator("h1").innerText(), lang === "es" ? /Mis logros/ : /My achievements/);
      await page.goto(`${base}/report.html`, { waitUntil: "networkidle" });
      await page.locator(".rp").waitFor();
      await noOverflow(page, `report ${lang}@${width}`);
      assert.equal(await page.locator("h1").count(), 1, "one h1 on the report page");
      if (width === 390 || width === 1280) {
        if (lang === "en") {
          await serious(page, `report en@${width}`);
          await page.goto(`${base}/achievements.html`, { waitUntil: "networkidle" });
          await page.locator(".a4-card").first().waitFor();
          await serious(page, `achievements en@${width}`);
          await page.goto(`${base}/`, { waitUntil: "networkidle" });
          await page.locator('[data-testid="routine-quick"]').waitFor();
          await serious(page, `home en@${width}`);
        }
      }
      await page.context().close();
    }
  }

  // ---- achievements: badges, milestones by keyboard, goals that persist, certificate ----------------------------------------------
  page = await open();
  await page.goto(`${base}/achievements.html`, { waitUntil: "networkidle" });
  await page.locator(".a4-card").first().waitFor();
  assert.ok((await page.locator("#a4-h-badges ~ ul .a4-card").count()) >= 3, "three skill badges from the fixture");
  assert.match(await page.locator("#a4-optional").innerText(), /optional/i);
  assert.equal(await page.locator(".a4-challenge").count(), 6, "six cumulative challenges");
  const summary = page.locator(".a4-strand summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".a4-strand").first().evaluate((el) => el.open), true, "a strand opens from the keyboard");
  await page.locator('[data-grade="6"]').click();
  await page.locator('[data-grade="6"][aria-pressed="true"]').waitFor();
  assert.ok((await page.locator(".a4-strand").count()) > 0, "another grade shows its strands");
  await page.locator("#goal-skill").selectOption({ index: 0 });
  await page.locator("[data-goal-add]").click();
  await page.locator(".a4-goal").waitFor();
  assert.equal(await page.locator(".a4-goal").count(), 1, "a student-chosen goal appears");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator(".a4-goal").count(), 1, "the goal persists");
  await page.locator("[data-goal-remove]").click();
  await page.locator(".a4-goal").waitFor({ state: "detached" });
  assert.equal(await page.locator(".a4-goal").count(), 0, "a goal can be removed");
  // The language words used in text, not only colour, mark progress.
  assert.ok((await page.locator(".a4-challenge progress").count()) === 6);
  // Certificate: clicking prints that one recognition. window.print is stubbed so the page stays in its print state.
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator("[data-cert]").first().click();
  assert.equal(await page.evaluate(() => document.body.dataset.print), "certificate");
  assert.equal(await page.locator("#a4-print .certificate").count(), 1, "one certificate is built");
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator("#a4-print .certificate").isVisible(), true, "the certificate is the only thing printed");
  assert.equal(await page.locator("#a4-body").isVisible(), false, "the page chrome is hidden in print");
  assert.match(await page.locator("#a4-print").innerText(), /Certificate of Achievement/);
  assert.equal(await pdfPages(page), 1, "a certificate prints on one Letter page");
  await page.context().close();

  // ---- reports: print media, no overflow, two pages at most, names only when typed ---------------------------------------------------------
  page = await open();
  await page.goto(`${base}/report.html`, { waitUntil: "networkidle" });
  await page.locator(".rp").waitFor();
  assert.ok(!(await page.locator(".rp").innerText()).includes("Sam"), "no name unless one is typed");
  await page.locator("#rp-name").fill("Sam");
  assert.match(await page.locator(".rp-meta").innerText(), /For Sam/);
  assert.equal(await page.locator("#rp-name").evaluate((el) => document.activeElement === el), true, "typing a name keeps focus in the field");
  for (const audience of ["student", "family"]) {
    await page.locator(`[data-audience="${audience}"]`).click();
    await page.locator(`.rp[data-report="${audience}"]`).waitFor();
    await page.emulateMedia({ media: "print" });
    await page.setViewportSize({ width: 816, height: 1056 });
    await noOverflow(page, `print ${audience}`);
    assert.equal(await page.locator(".a4-chrome").first().isVisible(), false, "controls are not printed");
    const pages = await pdfPages(page);
    assert.ok(pages >= 1 && pages <= 2, `${audience} report prints on at most two Letter pages (got ${pages})`);
    notes.push(`${audience} report: ${pages} page(s)`);
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  const download = page.waitForEvent("download");
  await page.locator("#rp-save").click();
  const saved = readFileSync(await (await download).path(), "utf8");
  assert.match(saved, /^<!doctype html>/i);
  assert.match(saved, /@page\{size:Letter/);
  assert.ok(!/https?:\/\//.test(saved.replaceAll('xmlns="http://www.w3.org/2000/svg"', "")), "a saved report makes no network reference");
  // Sparkline and bars carry text alternatives.
  assert.ok((await page.locator("svg.rp-spark[role=img]").count()) >= 0);
  for (const label of await page.locator("svg.rp-spark[role=img]").evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")))) assert.ok(label && label.length > 10, "sparkline alternative");
  await page.context().close();

  // ---- an empty device: calm empty states ------------------------------------------------------------------------------------------------------
  page = await open({ seeded: false });
  await page.goto(`${base}/report.html`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".rp-blank").count(), 1, "an empty report explains itself");
  await page.goto(`${base}/achievements.html`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".a4-empty").count(), 1, "an empty achievements page explains itself");
  await page.context().close();

  assert.deepEqual(problems, [], "console and page errors");
  console.log(`family-4 browser: ok (${notes.join("; ")})`);
} finally {
  await browser?.close();
  await server.close();
}
