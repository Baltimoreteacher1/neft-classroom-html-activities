import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // These tests drive the typed answer box; listening mode (on by default for Kindergarten to Grade 2) has its own tests.
  await page.addInitScript(() => {
    localStorage.setItem("ewl-fluency-settings-v1", JSON.stringify({ audioFirst: "off" }));
    Math.random = () => 0.5;
    const now = Date.now();
    localStorage.setItem("ewl-fluency-tutor-v2", JSON.stringify({
      version: 2,
      records: { "1:add-10": { recent: [
        { correct: false, independent: true, tier: 3, at: now - 2000 },
        { correct: true, independent: true, tier: 3, at: now - 1000 },
        { correct: true, independent: true, tier: 3, at: now },
      ] } },
      mistakes: [], diagnostics: {}, sessions: [], rescues: [],
    }));
  });
  await page.goto(`${base}/math/fluency-lab/?grade=1&skill=add-10&profile=0`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Practice 10" }).click();
  const question = page.locator("#question");
  const questionText = await question.innerText();
  const missing = questionText.match(/(?:□|\?)\s*\+\s*(\d+)\s*(?:=|\s)\s*(\d+)/);
  const secondMissing = questionText.match(/(\d+)\s*\+\s*(?:□|\?)\s*(?:=|\s)\s*(\d+)/);
  const match = questionText.match(/(\d+)\s*\+\s*(\d+)/);
  assert.ok(missing || secondMissing || match, `Expected a computable addition item, received: ${questionText}`);
  const result = page.locator("#answer-result-status");
  await page.locator("#answer-input").fill("999");
  await page.locator("#check-answer").click();
  await result.waitFor({ state: "visible" });
  assert.match(await result.innerText(), /Incorrect/);
  assert.equal(await result.getAttribute("data-type"), "incorrect");
  assert.equal(await page.locator("#feedback").getAttribute("data-type"), "try", "formative explanation remains in the retry state");
  // Both boxes are read in one frame: two separate boundingBox() calls can straddle a scroll under load and report
  // offsets from different scroll positions, which failed this assertion on untouched main about half the time.
  const { questionBox, resultBox } = await page.evaluate(() => {
    const box = (selector) => {
      const { x, y } = document.querySelector(selector).getBoundingClientRect();
      return { x, y };
    };
    return { questionBox: box("#question"), resultBox: box("#answer-result-status") };
  });
  assert.ok(resultBox.x > questionBox.x, "the correctness label sits horizontally beside the question");
  assert.ok(Math.abs(resultBox.y - questionBox.y) < 100, "the correctness label stays aligned with the question");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, "phone layout has no horizontal overflow");
  assert.match(await result.innerText(), /Incorrect/);
  assert.equal(await result.isVisible(), true);
  const correctAnswer = missing
    ? Number(missing[2]) - Number(missing[1])
    : secondMissing
      ? Number(secondMissing[2]) - Number(secondMissing[1])
      : Number(match[1]) + Number(match[2]);
  await page.locator("#answer-input").fill(String(correctAnswer));
  await page.locator("#check-answer").click();
  await result.waitFor({ state: "visible" });
  assert.match(await result.innerText(), /Correct/);
  assert.equal(await result.getAttribute("data-type"), "correct");

  const spanishContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await spanishContext.addInitScript(() => {
    localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("es"));
    localStorage.setItem("ewl-fluency-settings-v1", JSON.stringify({ audioFirst: "off" }));
  });
  const spanishPage = await spanishContext.newPage();
  await spanishPage.goto(`${base}/math/fluency-lab/?grade=1&skill=add-10`, { waitUntil: "networkidle" });
  await spanishPage.getByRole("button", { name: "Practicar 10" }).click();
  await spanishPage.locator("#answer-input").fill("999");
  await spanishPage.locator("#check-answer").click();
  await spanishPage.locator("#answer-result-status").waitFor({ state: "visible" });
  assert.match(await spanishPage.locator("#answer-result-status").innerText(), /Incorrecto/);
  await spanishContext.close();

  await page.goto(`${base}/math/fluency-lab/?grade=4&skill=multiply-1digit`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#workspace-title").innerText(), "Multiply a three-digit number by a one-digit number");
  // textContent: the worked example sits in the collapsed "Show the steps in words" section beside the animated Studio.
  const multiplicationLesson = await page.locator("#learn-panel").textContent();
  assert.match(multiplicationLesson, /three-digit number by a one-digit number/i);
  assert.match(multiplicationLesson, /\b\d{3} × [2-9] = \?/);
  assert.doesNotMatch(multiplicationLesson, /multiply by one digit/i);
  await page.goto(`${base}/math/fluency-lab/?grade=1&skill=add-10`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#workspace-title").innerText(), "Addition facts: sums of 10 or less");
  assert.match(await page.locator("#learn-panel").innerText(), /sum is 10 or less/i);
  assert.doesNotMatch(await page.locator("#learn-panel").innerText(), /addition facts within 10/i);
  assert.deepEqual(errors, [], `No browser runtime errors: ${errors.join("; ")}`);
  console.log("Math answer feedback browser check passed: clear incorrect status beside the question on desktop; visible and overflow-free on mobile.");
} finally {
  await browser?.close();
  await server.close();
}
