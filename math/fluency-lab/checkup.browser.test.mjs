// The adaptive checkup in a real browser: second looks follow misses (and only misses), a missed skill probes an
// earlier foundation at most twice, "I'm not sure yet" asks for nothing more, no solution is shown mid-checkup,
// Spanish carries through, and a checkup interrupted during a foundation probe resumes.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const SECOND_LOOK = /^(A miss gets a second look|One miss is not enough)/;
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const url = (grade, query = "start=checkup") => `${base}/math/fluency-lab/?grade=${grade}&${query}`;
let browser;

const purpose = (insight) => (/^One miss is not enough/.test(insight) ? "second" : /^A short look at an earlier idea/.test(insight) ? "foundation" : "initial");
const total = async (page) => Number((await page.locator("#problem-number").innerText()).match(/of (\d+)/)[1]);
const insight = (page) => page.locator("#session-insight").innerText();
const settled = (page) => page.waitForFunction(() => !document.querySelector("#session-summary").hidden || document.querySelector("#next-problem").hidden);

// Wrong on typed items (999999 is never an answer here); first choice on choice items, so the transcript is observed.
async function answer(page) {
  if (await page.locator("#answer-input").isVisible()) {
    await page.locator("#answer-input").fill("999999");
    await page.locator("#check-answer").click();
  } else await page.locator("#choice-answers button").first().click();
  await page.locator("#next-problem").waitFor({ state: "visible" });
  return page.locator("#feedback").getAttribute("data-type");
}

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // 1. Whole checkup, grade 4, observed transcript.
  await page.goto(url(4), { waitUntil: "networkidle" });
  const initialTotal = await total(page);
  const steps = [];
  for (let i = 0; i < 60 && !(await page.locator("#session-summary").isVisible()); i += 1) {
    const kind = purpose(await insight(page));
    const result = await answer(page);
    assert.equal(await page.locator("#feedback-copy .step-player, #feedback-copy [data-step]").count(), 0, "no solution steps during a checkup");
    assert.doesNotMatch(await page.locator("#feedback-copy").innerText(), /Strategy|Next step|Pan Balance/);
    steps.push({ kind, result });
    await page.locator("#next-problem").click();
    await settled(page);
  }
  assert.ok(await page.locator("#session-summary").isVisible(), "the checkup finishes");
  steps.forEach((step, index) => {
    const next = steps[index + 1];
    if (!next) return;
    if (step.kind === "initial" && step.result === "incorrect") assert.equal(next.kind, "second", `step ${index + 1}: a first miss is followed by a second look`);
    if (step.kind === "initial" && step.result === "correct") assert.notEqual(next.kind, "second", `step ${index + 1}: a pass is not followed by a second look`);
    if (step.kind === "second") assert.notEqual(next.kind, "second", "one second look per skill");
  });
  const secondLooks = steps.filter((step) => step.kind === "second").length;
  const firstMisses = steps.filter((step) => step.kind === "initial" && step.result === "incorrect").length;
  assert.equal(secondLooks, firstMisses, "every first miss gets exactly one second look");
  assert.ok(steps.filter((step) => step.kind === "foundation").length <= 2, "foundation probes are capped at two");
  assert.ok(steps.some((step) => step.kind === "foundation"), "a skill missed twice probes an earlier foundation");
  assert.equal(steps.length, initialTotal + secondLooks + steps.filter((step) => step.kind === "foundation").length, "length = plan + second looks + probes");
  const summary = await page.locator("#summary-copy").innerText();
  assert.match(summary, /Worth practicing:/);
  assert.doesNotMatch(summary, /ten samples/);
  assert.match(summary, /cannot prove mastery or determine a grade level/);

  // 2. "I'm not sure yet" asks for nothing more.
  await page.goto(url(4), { waitUntil: "networkidle" });
  const planned = await total(page);
  await page.locator("#skip-checkup").click();
  await page.locator("#next-problem").waitFor({ state: "visible" });
  await page.locator("#next-problem").click();
  await settled(page);
  assert.equal(purpose(await insight(page)), "initial", "not sure: no second look");
  assert.equal(await total(page), planned, "not sure: the checkup does not grow");

  // 3. Spanish: the checkup chrome, the skip button, the neutral note.
  const spanish = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await spanish.addInitScript(() => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("es")));
  const es = await spanish.newPage();
  await es.goto(url(4), { waitUntil: "networkidle" });
  assert.match(await insight(es), /^Un error se revisa una segunda vez/);
  assert.equal((await es.locator("#skip-checkup").innerText()).trim(), "Todavía no estoy seguro");
  assert.equal(await es.locator("#session-type").innerText(), "Prueba de punto de partida");
  await answer(es);
  if ((await es.locator("#feedback").getAttribute("data-type")) === "incorrect") assert.match(await es.locator("#feedback-copy").innerText(), /^Gracias\./);
  await spanish.close();

  // 4. Interrupted during a foundation probe: the saved item is an earlier-grade skill, and Continue still works.
  await page.goto(url(4), { waitUntil: "networkidle" });
  for (let i = 0; i < 40 && purpose(await insight(page)) !== "foundation"; i += 1) {
    await answer(page);
    await page.locator("#next-problem").click();
    await settled(page);
  }
  assert.equal(purpose(await insight(page)), "foundation", "reached a foundation probe");
  await answer(page); // the saved snapshot now holds the earlier-grade probe item
  await page.goto(url(4, ""), { waitUntil: "networkidle" });
  const resume = page.locator("[data-resume-practice]").first();
  assert.ok(await resume.isVisible(), "Continue is offered after an interruption");
  await resume.click();
  await page.locator("#question").waitFor({ state: "visible" });
  assert.match(await page.locator("#problem-number").innerText(), /^Problem \d+ of \d+$/);
  assert.ok((await page.locator("#question").innerText()).length > 3, "the checkup resumes with a real question");

  // 5. Phone width: no sideways scroll on the checkup or its summary.
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  assert.deepEqual(errors, [], `no page errors: ${errors.join("; ")}`);
  console.log(`Adaptive checkup browser check passed: ${steps.length} questions (${secondLooks} second looks), no solution shown, unsure, Spanish, resume mid-probe, 390px.`);
} finally {
  await browser?.close();
  await server.close();
}
