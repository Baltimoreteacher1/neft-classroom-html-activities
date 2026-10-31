// Prerequisite rescue in a real browser: repeated independent misses offer a rescue, the learner walks
// mini-lesson -> guided repair -> required independent check -> back to the original skill with a clear message.
// Also: leaving and declining return to the problem, Spanish carries through, 390px has no sideways scroll,
// and the console stays clean.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const shots = process.env.RESCUE_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const GOAL = "5:fraction-add";
const PREREQ = "4:fraction-equiv";
let browser;

// Two independent grade-level successes a couple of days ago put the learner at tier 3, with no rescue history.
const seed = () => {
  const day = 86400000;
  const at = Date.now() - 2 * day;
  const entry = (offset) => ({ correct: true, independent: true, at: at + offset, level: 0, tier: 2, sig: `seed${offset}` });
  localStorage.setItem("ewl-fluency-tutor-v2", JSON.stringify({ version: 2, records: { "5:fraction-add": { recent: [entry(0), entry(60000)], independentTotal: 2, supportedTotal: 0, interval: 1, dueAt: at + day } }, mistakes: [], diagnostics: {}, sessions: [] }));
};
const tutorOf = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2")));
const sessionOf = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-session-v2")));

async function openPractice(page, lang = "en") {
  await page.addInitScript(seed);
  if (lang === "es") await page.addInitScript(() => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("es")));
  await page.goto(`${base}/math/fluency-lab/?grade=5&skill=fraction-add`, { waitUntil: "networkidle" });
  await page.locator('[data-mode="practice"]').click();
  await page.locator("#answer-input, #choice-answers button").first().waitFor({ state: "visible" });
}
// Wrong until the problem settles (two independent tries), then wait for the Next button.
async function missProblem(page) {
  for (let attempt = 0; attempt < 3 && !(await page.locator("#next-problem").isVisible()); attempt += 1) {
    if (await page.locator("#answer-input").isVisible()) {
      await page.locator("#answer-input").fill("999999");
      await page.locator("#check-answer").click();
    } else await page.locator("#choice-answers button:not([disabled])").last().click();
  }
  await page.locator("#next-problem").waitFor({ state: "visible" });
}
// Right on the first try, from the saved item (the page stores it with its answers).
async function solve(page) {
  const item = (await sessionOf(page)).item;
  if (item.choices) await page.locator(`#choice-answers [data-answer="${item.answers[0]}"]`).click();
  else {
    await page.locator("#answer-input").fill(String(item.answers[0]));
    await page.locator("#check-answer").click();
  }
  await page.locator("#next-problem").waitFor({ state: "visible" });
}
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const shot = async (page, name, selector = null) => {
  if (!shots) return;
  await page.waitForTimeout(350); // let the dialog's entrance finish
  if (selector) await page.locator(selector).first().screenshot({ path: `${shots}/${name}.png` });
  else await page.screenshot({ path: `${shots}/${name}.png` });
};

async function reachOffer(page) {
  await missProblem(page);
  await page.locator("#next-problem").click();
  await missProblem(page);
  await page.locator("[data-rescue=start]").waitFor({ state: "visible" });
}

try {
  browser = await chromium.launch({ headless: true });
  const errors = [];
  const watch = (page) => {
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  };

  // 1. The whole flow at phone width: offer -> mini-lesson -> 3 guided repair -> independent check -> back.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(page);
  await openPractice(page);
  await reachOffer(page);
  assert.match(await page.locator(".rescue-offer").innerText(), /Equivalent fractions|equivalent/i, "the offer names the prerequisite");
  assert.equal(await page.locator("[data-rescue=decline]").count(), 1, "the offer can be declined");
  assert.equal(await page.locator("[data-quick-boost]").count(), 1, "the lighter Quick Boost is still offered");
  assert.ok(await noSideScroll(page), "offer fits 390px");
  await shot(page, "1-offer-390", ".rescue-offer");

  await page.locator("[data-rescue=start]").click();
  const dialog = page.locator("dialog.rescue-dialog");
  await dialog.waitFor({ state: "visible" });
  assert.match(await dialog.locator("h2").innerText(), /^Let's strengthen /);
  assert.equal(await dialog.locator(".rescue-steps li").count(), 4, "four named steps");
  assert.equal(await dialog.locator('.rescue-steps li[aria-current="step"]').count(), 1);
  assert.ok(await dialog.locator(".rescue-lesson").evaluate((element) => element.childElementCount > 0 || element.textContent.trim().length > 0), "a lesson is shown (mini-lesson or the visual lesson)");
  assert.equal(await page.evaluate(() => document.activeElement?.closest("dialog") !== null), true, "focus moves into the dialog");
  for (const button of await dialog.locator(".rescue-actions button").all()) assert.ok((await button.boundingBox()).height >= 44, "44px targets");
  assert.ok(await noSideScroll(page), "dialog fits 390px");
  await shot(page, "2-lesson-390");
  await dialog.getByRole("button", { name: "Start practice" }).click();
  await dialog.waitFor({ state: "detached" });

  assert.equal(await page.locator("#session-type").innerText(), "Repair practice");
  const queue = (await sessionOf(page)).session.queue;
  assert.deepEqual(queue.map((entry) => entry.rescue), ["repair", "repair", "repair", "verify"]);
  assert.ok(queue.every((entry) => entry.key === PREREQ), "the practice is on the prerequisite, not the goal");
  for (let step = 1; step <= 3; step += 1) {
    assert.equal((await sessionOf(page)).item.skill.id, "fraction-equiv");
    await solve(page);
    await page.locator("#next-problem").click();
    await page.locator("#question").waitFor({ state: "visible" });
  }
  // The required check: independent, no steps, a fresh problem.
  const check = await sessionOf(page);
  assert.equal(check.session.rescue.phase, "verify", "three repair problems lead to the check");
  assert.equal(check.session.rescue.repairAnswered, 3);
  await solve(page);
  assert.equal((await sessionOf(page)).session.rescue.outcome, "verified", "a right independent answer verifies");
  await shot(page, "3-check-390");
  await page.locator("#next-problem").click();

  const banner = page.locator("[data-rescue-return]");
  await banner.waitFor({ state: "visible" });
  assert.match(await banner.innerText(), /You showed .+ on your own\. Back to .+/);
  assert.equal(await banner.getAttribute("role"), "status");
  const back = await sessionOf(page);
  assert.equal(back.session.mode, "practice", "the original practice set resumes");
  assert.equal(back.session.answered, 2, "the learner's progress is preserved");
  assert.equal(back.grade, 5, "the original grade is restored");
  assert.ok(!back.session.rescueScaffold, "no scaffolds after a verified rescue");
  const tutor = await tutorOf(page);
  assert.deepEqual(tutor.rescues.map((entry) => [entry.goal, entry.prereq, entry.outcome]), [[GOAL, PREREQ, "verified"]], "the rescue is logged once, as verified");
  const prereqRecord = tutor.records[PREREQ];
  assert.ok(prereqRecord.recent.some((entry) => entry.independent && entry.correct && entry.tier === 3), "the check is stored as independent grade-level evidence");
  assert.ok(prereqRecord.recent.filter((entry) => !entry.independent && entry.tier <= 2).length >= 3, "guided repair is stored as supported work at tiers 1-2");
  assert.ok(await noSideScroll(page), "back at the goal fits 390px");
  await shot(page, "4-return-390");
  // The banner clears on the next problem, and a second rescue today is not offered (cap: one per skill per day).
  await page.locator("#answer-input, #choice-answers button").first().waitFor({ state: "visible" });
  await missProblem(page);
  await page.locator("#next-problem").click();
  await missProblem(page);
  assert.equal(await page.locator("[data-rescue=start]").count(), 0, "one rescue per skill per day");
  await page.close();

  // 2. A failed check returns to the goal with scaffolds, never a loop; leaving and declining are logged too.
  const failing = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  watch(failing);
  await openPractice(failing);
  await reachOffer(failing);
  await shot(failing, "6-offer-1280", ".rescue-offer");
  await failing.locator("[data-rescue=start]").click();
  await shot(failing, "7-lesson-1280");
  await failing.getByRole("button", { name: "Start practice" }).click();
  for (let step = 0; step < 3; step += 1) {
    await solve(failing);
    await failing.locator("#next-problem").click();
  }
  await missProblem(failing);
  assert.equal((await sessionOf(failing)).session.rescue.outcome, "not-yet");
  await failing.locator("#next-problem").click();
  assert.match(await failing.locator("[data-rescue-return]").innerText(), /needs a little more time/);
  const scaffolded = await sessionOf(failing);
  assert.equal(scaffolded.session.mode, "practice");
  assert.deepEqual(scaffolded.session.rescueScaffold, { key: GOAL, left: 3 - 1 }, "the next goal problem consumed one of three scaffolds");
  assert.equal(scaffolded.initialSupport, true, "the goal continues with its steps showing");
  assert.equal((await tutorOf(failing)).rescues.at(-1).outcome, "not-yet");
  await failing.close();

  const leaving = await browser.newPage({ viewport: { width: 820, height: 900 } });
  watch(leaving);
  await openPractice(leaving);
  await reachOffer(leaving);
  await leaving.locator("[data-rescue=start]").click();
  await shot(leaving, "8-lesson-820");
  await leaving.keyboard.press("Escape");
  await leaving.locator("dialog.rescue-dialog").waitFor({ state: "detached" });
  assert.equal((await sessionOf(leaving)).session.mode, "practice", "Escape returns to the problem");
  assert.equal((await tutorOf(leaving)).rescues.at(-1).outcome, "left");
  await leaving.close();

  const declining = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  watch(declining);
  await openPractice(declining);
  await reachOffer(declining);
  await declining.locator("[data-rescue=decline]").click();
  assert.equal(await declining.locator(".rescue-offer").count(), 0);
  assert.equal((await tutorOf(declining)).rescues.at(-1).outcome, "declined");
  await declining.close();

  // 3. Spanish.
  const es = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(es);
  await openPractice(es, "es");
  await reachOffer(es);
  assert.match(await es.locator(".rescue-offer").innerText(), /repaso corto/);
  await es.locator("[data-rescue=start]").click();
  assert.match(await es.locator("dialog.rescue-dialog h2").innerText(), /^Vamos a reforzar /);
  assert.deepEqual(await es.locator(".rescue-steps li").allInnerTexts(), ["Aprende la idea", "Practica con ayuda", "Muéstralo por tu cuenta", "Volver a tu problema"]);
  assert.ok(await noSideScroll(es), "Spanish dialog fits 390px");
  await shot(es, "5-es-390");
  await es.getByRole("button", { name: "Empezar a practicar" }).click();
  for (let step = 0; step < 3; step += 1) {
    await solve(es);
    await es.locator("#next-problem").click();
  }
  await solve(es);
  await es.locator("#next-problem").click();
  assert.match(await es.locator("[data-rescue-return]").innerText(), /^Mostraste .+ por tu cuenta\. Volvemos a /);
  await es.close();

  assert.deepEqual(errors, [], "console stays clean");
  console.log("Rescue browser check passed: offer, mini-lesson, guided repair, independent check, return (verified and not-yet), leave, decline, daily cap, Spanish, 390px, console clean.");
} finally {
  await browser?.close();
  await server.close();
}
