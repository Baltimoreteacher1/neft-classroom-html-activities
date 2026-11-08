// The front door and the five-stage skill screen, driven the way a student drives them: Grade → Topic → Skill →
// Start with nothing saved, a teacher's direct link, a returning learner, switching skills, leaving practice for
// the explanation and coming back, storage blocked, keyboard only, a phone, and a refresh.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const shots = process.env.ENTRY_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch (error) {
  console.log(`SKIP entry-flow.browser — no browser (${String(error.message).split("\n")[0]})`);
  await server.close();
  process.exit(process.env.CI ? 1 : 3);
}
const errors = [];
const context = async (viewport = { width: 1280, height: 900 }, init = null) => {
  const ctx = await browser.newContext({ viewport });
  // These tests type answers; listening mode (on by default for Kindergarten to Grade 2) has its own tests.
  await ctx.addInitScript(() => localStorage.setItem("ewl-fluency-settings-v1", JSON.stringify({ audioFirst: "off" })));
  if (init) await ctx.addInitScript(init);
  return ctx;
};
const page = async (ctx, query = "") => {
  const p = await ctx.newPage();
  p.on("pageerror", (error) => errors.push(error.message));
  await p.goto(`${base}${query}`, { waitUntil: "networkidle" });
  return p;
};
const crumbs = (p) => p.locator(".sp-crumbs ol li").allInnerTexts();
const stageNow = (p) => p.locator('.sp-stages [aria-current="step"]').getAttribute("data-stage");
const noSideways = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
async function pick(p, grade, topic, skill) {
  await p.click(`[data-ep-grade="${grade}"]`);
  await p.click(`[data-ep-topic="${topic}"]`);
  await p.click(`[data-ep-skill="${skill}"]`);
  await p.click("[data-ep-start]");
  await p.locator("#workspace-view").waitFor({ state: "visible" });
}
async function answerOnce(p, value) {
  const typed = p.locator("#answer-input");
  if (await typed.isVisible()) {
    await typed.fill(value);
    await p.click("#check-answer");
  } else if ((await p.locator("#choice-answers button").count()) > 0) {
    await p.locator("#choice-answers button").first().click();
  } else if ((await p.locator("#response-widget button").count()) > 0) {
    await p.locator("#response-widget button").first().click();
    await p.click("#check-answer");
  }
  await p.locator("#feedback").waitFor({ state: "visible" });
}

try {
  // Scenario 1: a new Kindergarten student, nothing saved, all five stages.
  {
    const ctx = await context();
    const p = await page(ctx);
    assert.equal(await p.locator(".ep-resume").count(), 0, "no Welcome back card without progress");
    assert.equal(await p.locator("[data-ep-grade]").count(), 9, "K to 8 on the first screen");
    assert.deepEqual(await p.locator("[data-ep-grade]").allInnerTexts(), ["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
    const gradeBox = await p.locator('[data-ep-grade="0"]').boundingBox();
    assert.ok(gradeBox.y + gradeBox.height < 900, "grades are visible without scrolling");
    assert.equal(await p.locator("[data-ep-topic]").count(), 0, "topics wait for a grade");
    await pick(p, 0, "counting", "count-cardinality");
    assert.deepEqual(await crumbs(p), ["Kindergarten", "Counting", "Count a set and tell how many"]);
    assert.equal(await stageNow(p), "learn");
    assert.match(new URL(p.url()).search, /^\?grade=0&skill=count-cardinality$/);
    assert.ok((await p.locator("#learn-panel .tr-idea").innerText()).length > 5, "Learn states the idea");
    assert.ok(await p.locator("#learn-panel [data-learn-studio], #learn-panel .tr-example-fact").first().isVisible(), "Learn shows a worked example");
    if (shots) await p.screenshot({ path: `${shots}/k-learn.png` });
    await p.click('.stage-footer [data-stage-go="try"]');
    assert.equal(await stageNow(p), "try");
    assert.ok(await p.locator("#visual-panel").isVisible(), "Try It opens the hands-on model");
    assert.ok((await p.locator("#visual-panel button, #visual-panel input").count()) > 0, "the model can be handled");
    await p.click('.stage-footer [data-stage-go="play"]');
    assert.equal(await stageNow(p), "play", "See It continues into a supported attempt");
    await p.click('.stage-footer [data-stage-go="practice"]');
    assert.equal(await stageNow(p), "practice");
    await answerOnce(p, "1");
    await p.click('.stage-footer [data-stage-go="grow"]');
    assert.equal(await stageNow(p), "grow");
    assert.ok(await p.locator("#grow-panel .sp-grow").isVisible());
    assert.match(await p.locator("#grow-panel [data-sp-next]").innerText(), /^Next skill: /, "Grow names a next skill");
    if (shots) await p.screenshot({ path: `${shots}/k-grow.png` });

    // Scenario 4: the same learner comes back and resumes the skill and stage.
    const back = await page(ctx);
    assert.ok(await back.locator(".ep-resume").isVisible(), "Welcome back appears with progress");
    assert.match(await back.locator(".ep-resume").innerText(), /Count a set and tell how many/);
    assert.ok(await back.locator("[data-ep-grade]").first().isVisible(), "grades stay available below it");
    await back.click("[data-ep-resume]");
    await back.locator("#workspace-view").waitFor({ state: "visible" });
    assert.equal(await stageNow(back), "grow", "resume returns to the stage the learner left");
    assert.equal(await back.locator("#workspace-title").innerText(), "Count a set and tell how many");
    await ctx.close();
  }

  // Scenario 2: a teacher-directed Grade 3 student goes straight to practice; no sign-up, no checkup.
  {
    const ctx = await context();
    const p = await page(ctx);
    await pick(p, 3, "multiplication", "mul-6-9");
    assert.deepEqual(await crumbs(p), ["Grade 3", "Multiplication", "Multiplication facts ×6–9"]);
    await p.click('.stage-footer [data-stage-go="try"]');
    await p.click('.stage-footer [data-stage-go="play"]');
    await p.click('.stage-footer [data-stage-go="practice"]');
    assert.equal(await stageNow(p), "practice");
    await p.locator("#question").waitFor({ state: "visible" });
    // The facts skill mixes bare facts ("7 × 8") with array word problems ("7 rows with 7 tiles in each row").
    assert.match(await p.locator("#question").innerText(), /×|rows? with \d+ \w+ in each row/, "a multiplication problem");

    // Scenario 6: a miss, then the explanation, then back to the same problem.
    await answerOnce(p, "-1");
    const question = await p.locator("#question").innerText();
    await p.click('.stage-footer [data-stage-go="learn"]');
    assert.equal(await stageNow(p), "learn");
    assert.equal(await p.locator('.stage-footer [data-stage-go="practice"]').first().innerText(), "Back to my practice");
    await p.click('.stage-footer [data-stage-go="practice"]');
    assert.equal(await stageNow(p), "practice");
    assert.equal(await p.locator("#question").innerText(), question, "the problem in progress is still there");

    // Scenario 5: change grade and topic from the breadcrumb; progress stays with the right skill.
    await p.click(".sp-crumbs [data-sp-grade]");
    await p.locator(".ep").waitFor({ state: "visible" });
    assert.equal(await p.locator('[data-ep-grade="3"]').getAttribute("aria-pressed"), "true", "the grade is kept");
    await pick(p, 5, "fractions", "fraction-add");
    assert.deepEqual(await crumbs(p), ["Grade 5", "Fractions", "Add and subtract fractions"]);
    assert.equal(await stageNow(p), "learn", "a new skill starts at Learn");
    const last = await p.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-last-v1:0") || localStorage.getItem("ewl-fluency-last-v1") || "null"));
    assert.equal(last?.skillId, "fraction-add", "the last place is the new skill");
    await p.locator(".sp-crumbs [data-sp-switch]").selectOption("fraction-mul");
    assert.equal(await p.locator("#workspace-title").innerText(), "Multiply fractions", "switch to a sibling skill in one step");
    await ctx.close();
  }

  // Scenario 3: a shared link in a fresh browser; refresh keeps the stage.
  {
    const ctx = await context();
    const p = await page(ctx, "?grade=4&skill=fraction-equiv");
    assert.deepEqual(await crumbs(p), ["Grade 4", "Fractions", "Generate equivalent fractions"]);
    assert.equal(await p.locator(".ep").count(), 0, "a direct link skips the picker");
    const practice = await page(ctx, "?grade=4&skill=fraction-equiv&stage=practice");
    assert.equal(await stageNow(practice), "practice");
    await practice.reload({ waitUntil: "networkidle" });
    assert.equal(await stageNow(practice), "practice", "refresh keeps the stage");
    await ctx.close();
  }

  // Scenario 7: storage blocked. Everything still opens and runs.
  {
    const ctx = await context(undefined, () => {
      Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
      Object.defineProperty(window, "sessionStorage", { get() { throw new Error("blocked"); } });
    });
    const p = await page(ctx);
    await pick(p, 6, "ratios-percents", "ratios");
    await p.click('.stage-footer [data-stage-go="try"]');
    await p.click('.stage-footer [data-stage-go="play"]');
    await p.click('.stage-footer [data-stage-go="practice"]');
    await p.locator("#question").waitFor({ state: "visible" });
    await p.click('.sp-stages [data-stage="play"]');
    assert.ok(await p.locator("#drill-panel").isVisible(), "guided work still opens without storage");
    assert.ok(await p.locator("#question").isVisible(), "the guided problem remains available without storage");
    await ctx.close();
  }

  // Keyboard only, and a phone.
  {
    const ctx = await context({ width: 390, height: 844 });
    const p = await page(ctx);
    assert.ok(await noSideways(p), "picker: no sideways scroll at 390");
    for (const box of await p.locator("[data-ep-grade]").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))) assert.ok(box.height >= 44 && box.width >= 44, "44px grade targets");
    await p.locator('[data-ep-grade="2"]').focus();
    await p.keyboard.press("Enter");
    assert.equal(await p.locator('[data-ep-grade="2"]').getAttribute("aria-pressed"), "true", "Enter picks a grade");
    assert.equal(await p.evaluate(() => document.activeElement?.dataset.epGrade), "2", "focus stays on the grade");
    await p.keyboard.press("Tab");
    for (let i = 0; i < 12 && !(await p.evaluate(() => document.activeElement?.dataset.epTopic)); i += 1) await p.keyboard.press("Tab");
    await p.keyboard.press("Space");
    assert.ok((await p.locator("[data-ep-skill]").count()) > 0, "Space opens the topic's skills");
    await p.locator("[data-ep-skill]").first().focus();
    await p.keyboard.press("Enter");
    await p.locator("[data-ep-start]").focus();
    await p.keyboard.press("Enter");
    await p.locator("#workspace-view").waitFor({ state: "visible" });
    assert.ok(await noSideways(p), "skill screen: no sideways scroll at 390");
    if (shots) await p.screenshot({ path: `${shots}/phone-learn.png`, fullPage: false });
    await ctx.close();
  }

  // Spanish names on the front door.
  {
    const ctx = await context(undefined, () => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("es")));
    const p = await page(ctx);
    assert.equal(await p.locator("#ep-title").innerText(), "¿Qué te gustaría aprender?");
    await p.click('[data-ep-grade="3"]');
    assert.ok((await p.locator("[data-ep-topic]").allInnerTexts()).some((text) => text.startsWith("Multiplicación")));
    await ctx.close();
  }

  assert.deepEqual(errors, [], "no page errors");
  console.log("entry-flow.browser: new learner K, Grade 3 practice, direct link, returning learner, switching skills, back to practice, storage blocked, keyboard, phone, Spanish pass");
} finally {
  await browser?.close();
  await server.close();
}
