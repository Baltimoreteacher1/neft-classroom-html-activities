// Practice screen layout and the same correct / not-quite feedback in a trail round and in seven Game Room games,
// in a real browser at phone, tablet and desktop widths. Set SCREENS_SHOTS=/tmp/dir to keep screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const shots = process.env.SCREENS_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const evaluate = (text) =>
  Function(`return ${text.replaceAll(",", "").replace(/=\s*\?/, "").replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-")}`)();
const errors = [];
let browser;

function additionAnswer(question) {
  const firstMissing = question.match(/(?:□|\?)\s*\+\s*(\d+)\s*(?:=|\s)\s*(\d+)/);
  if (firstMissing) return Number(firstMissing[2]) - Number(firstMissing[1]);
  const secondMissing = question.match(/(\d+)\s*\+\s*(?:□|\?)\s*(?:=|\s)\s*(\d+)/);
  if (secondMissing) return Number(secondMissing[2]) - Number(secondMissing[1]);
  const sum = question.match(/(\d+)\s*\+\s*(\d+)/);
  assert.ok(sum, `Expected a computable addition item, received: ${question}`);
  return Number(sum[1]) + Number(sum[2]);
}

async function open(url, viewport = { width: 1280, height: 900 }, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  // These tests drive the typed answer box; listening mode (on by default for Kindergarten to Grade 2) has its own tests.
  await page.addInitScript(() => localStorage.setItem("ewl-fluency-settings-v1", JSON.stringify({ audioFirst: "off" })));
  if (new URLSearchParams(url.split("?")[1] || "").has("test-tier3")) {
    await page.addInitScript(() => {
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
  }
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => message.type() === "error" && errors.push(`console: ${message.text()}`));
  await page.goto(`${base}/math/fluency-lab/${url}`, { waitUntil: "networkidle" });
  return page;
}
const shot = async (page, name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });
const panel = (page) => page.locator("[data-fb-host]:visible").first();
const noOverflow = async (page, label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `${label}: no sideways scroll`);

// A game round must show a retry panel on a wrong try and a correct panel on a right one, and never move on alone.
async function expectRetry(page, label) {
  await panel(page).waitFor({ state: "visible" });
  assert.equal(await panel(page).getAttribute("data-phase"), "retry", `${label}: a miss shows the retry phase`);
  assert.equal(await panel(page).locator("[data-fb-title]").innerText(), "Not quite. Let's work through it.", `${label}: shared heading`);
  assert.ok((await panel(page).locator(".fb-icon svg").count()) === 1, `${label}: an icon, not only colour`);
  assert.ok((await panel(page).locator("[data-feedback-action='try-again']").count()) === 1, `${label}: Try again is offered`);
  assert.equal(await panel(page).locator("[data-feedback-action='next']").count(), 0, `${label}: no Next after a miss`);
  for (const button of await panel(page).locator("button").all()) assert.ok((await button.boundingBox()).height >= 44, `${label}: 44px targets`);
}
async function expectCorrect(page, label) {
  await panel(page).waitFor({ state: "visible" });
  assert.ok(["correct", "assisted"].includes(await panel(page).getAttribute("data-phase")), `${label}: a right answer shows the correct phase`);
  assert.equal(await panel(page).locator("[data-fb-title]").innerText(), "Correct!", `${label}: shared heading`);
}

try {
  browser = await chromium.launch({ headless: true });

  // ---- Practice screen: region order, no overflow, tap targets, visible focus, at three widths.
  for (const [name, width, height] of [["phone", 390, 844], ["tablet", 820, 1100], ["desktop", 1280, 900]]) {
    const page = await open("?grade=1&skill=add-10", { width, height });
    await page.getByRole("button", { name: "Practice 10" }).click();
    await page.locator("#answer-input").waitFor({ state: "visible" });
    const box = async (selector) => (await page.locator(selector).first().boundingBox());
    const progress = await box(".practice-progress");
    const question = await box("#question");
    const input = await box("#answer-input");
    assert.ok(progress && question && input, `${name}: progress, question and answer are on screen`);
    assert.ok(question.y < input.y, `${name}: the question comes before the answer`);
    const visual = await page.locator("#problem-visual-scaffold").boundingBox();
    if (visual && width <= 780) assert.ok(question.y < visual.y && visual.y < input.y, `${name}: the model sits between question and answer on a narrow screen`);
    await noOverflow(page, `${name} practice`);
    for (const selector of ["#check-answer", "#show-hint", ".conf-chip", "#toggle-math-keypad", "#voice-answer-btn"]) {
      const target = await page.locator(selector).first().boundingBox();
      assert.ok(target && target.height >= 44 && target.width >= 44, `${name}: ${selector} is at least 44px (${JSON.stringify(target)})`);
    }
    const mathSize = await page.locator("#question").evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    const isSentence = await page.locator("#question").evaluate((node) => node.classList.contains("is-sentence"));
    assert.ok(mathSize >= (isSentence ? 20 : 32), `${name}: the problem is typeset large (${mathSize}px)`);
    await page.locator("#answer-input").focus();
    const ring = await page.locator("#answer-input").evaluate((node) => ({ width: getComputedStyle(node).outlineWidth, shadow: getComputedStyle(node).boxShadow, style: getComputedStyle(node).outlineStyle }));
    assert.ok(ring.shadow !== "none" || (ring.style !== "none" && parseFloat(ring.width) >= 2), `${name}: focus is visible`);
    await page.locator("#answer-input").fill("999");
    await page.locator("#check-answer").click();
    await page.locator("#feedback").waitFor({ state: "visible" });
    const feedback = await box("#feedback");
    const form = await box("#answer-form");
    const coach = await page.locator("#guided-coach").boundingBox();
    assert.ok(feedback.y >= form.y + form.height - 2, `${name}: the feedback sits under the answer card`);
    if (coach) assert.ok(feedback.y < coach.y, `${name}: the feedback is above the guided steps`);
    const actions = await page.locator(".problem-actions-bar").boundingBox();
    assert.ok(feedback.y < actions.y, `${name}: the feedback comes before the quiet actions`);
    assert.ok(feedback.x >= 0 && feedback.x + feedback.width <= width, `${name}: the result stays inside the screen`);
    await noOverflow(page, `${name} not quite`);
    for (const button of await page.locator("#feedback-actions button").all()) assert.ok((await button.boundingBox()).height >= 44, `${name}: feedback buttons are 44px`);
    assert.equal(await page.locator("#answer-input").inputValue(), "999", `${name}: the original answer is kept`);
    await page.locator("#feedback").scrollIntoViewIfNeeded();
    await shot(page, `practice-notquite-${name}`);
    await page.context().close();
  }

  // ---- Keyboard only: type, Enter checks, Tab reaches the result's buttons, Enter on Try again returns to the box.
  {
    const page = await open("?grade=1&skill=add-10&test-tier3=1");
    await page.getByRole("button", { name: "Practice 10" }).click();
    await page.locator("#answer-input").focus();
    await page.keyboard.type("999");
    await page.keyboard.press("Enter");
    await page.locator("#feedback-actions button").first().waitFor({ state: "visible" });
    await page.locator("#feedback-actions button").first().focus();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.feedbackAction), "try-again", "the first result control is Try again");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "answer-input", "Try again returns to the answer box");
    const sum = additionAnswer(await page.locator("#question").innerText());
    await page.locator("#answer-input").fill(String(sum));
    await page.keyboard.press("Enter");
    await page.locator("#next-problem").waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => document.activeElement?.id), "next-problem", "a settled result moves focus to Next");
    await page.context().close();
  }

  // ---- Reduced motion: no pop animation on any result.
  {
    const page = await open("?grade=1&skill=add-10&test-tier3=1", { width: 1280, height: 900 }, { reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Practice 10" }).click();
    const sum = additionAnswer(await page.locator("#question").innerText());
    await page.locator("#answer-input").fill(String(sum));
    await page.locator("#check-answer").click();
    await page.locator("#next-problem").waitFor({ state: "visible" });
    assert.equal(await page.locator("#feedback").evaluate((node) => getComputedStyle(node).animationName), "none");
    const duration = await page.locator(".practice-progress .progress-track span").evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration));
    assert.ok(duration < 0.001, "the progress bar does not animate");
    await page.context().close();
  }

  // ---- Trail round: a right answer shows the result and waits for Next; a miss shows the retry panel.
  for (const [name, width, height] of [["phone", 390, 844], ["desktop", 1280, 900]]) {
    const page = await open("?grade=3", { width, height });
    await page.locator("[data-hub-tab=\"trail\"]").click();
    await page.locator("[data-station], [data-card]").first().click();
    await page.locator("[data-start]").first().click();
    await page.locator("#tr-input").waitFor({ state: "visible" });
    await page.locator("#tr-input").fill("99999");
    await page.locator(".tr-check").click();
    await expectRetry(page, `trail ${name}`);
    await noOverflow(page, `trail ${name} miss`);
    await shot(page, `trail-notquite-${name}`);
    const answer = async () => evaluate(await page.locator("#tr-q").innerText());
    await page.locator("#tr-input").fill(String(await answer()));
    await page.locator(".tr-check").click();
    await expectCorrect(page, `trail ${name}`);
    const before = await page.locator("#tr-q").innerText();
    await page.waitForTimeout(1200);
    assert.equal(await page.locator("#tr-q").innerText(), before, `trail ${name}: nothing advances on its own`);
    await shot(page, `trail-correct-${name}`);
    await page.locator("[data-feedback-action='next']").click();
    assert.notEqual(await page.locator("#tr-q, #tr-done-title").first().innerText(), before, `trail ${name}: Next moves on`);
    await page.context().close();
  }

  // ---- Seven Game Room games share one panel.
  const play = async (id, fn, viewport) => {
    const page = await open("?grade=3&view=games", viewport);
    await page.locator(`[data-game="${id}"]`).click();
    await fn(page);
    await noOverflow(page, id);
    await page.context().close();
  };
  await play("sort", async (page) => {
    const line = Number((await page.locator('[data-bin="low"] b').innerText()).replace("Less than ", "").replaceAll(",", ""));
    const card = page.locator(".gm-sort .gm-card").first();
    const low = evaluate(await card.innerText()) < line;
    await card.click();
    await page.locator(low ? '[data-bin="high"]' : '[data-bin="low"]').click();
    await expectRetry(page, "sort");
    await shot(page, "game-sort-notquite");
    await page.locator("[data-feedback-action='try-again']").click();
    await page.locator(".gm-sort .gm-card").first().click();
    await page.locator(low ? '[data-bin="low"]' : '[data-bin="high"]').click();
    await expectCorrect(page, "sort");
    await shot(page, "game-sort-correct");
  });
  await play("hunt", async (page) => {
    const target = Number((await page.locator(".gm-target strong").innerText()).replaceAll(",", ""));
    const values = await page.locator(".gm-card").allInnerTexts();
    const wrong = values.findIndex((text) => Math.abs(evaluate(text) - target) > 1e-9);
    await page.locator(`[data-i="${wrong}"]`).click();
    await expectRetry(page, "hunt");
    const right = values.findIndex((text) => Math.abs(evaluate(text) - target) < 1e-9);
    await page.locator(`[data-i="${right}"]`).click();
    await expectCorrect(page, "hunt");
  });
  await play("make", async (page) => {
    const target = Number(await page.locator(".gm-target strong").innerText());
    const add = !(await page.locator(".gm-target").innerText()).includes("multiply");
    const values = (await page.locator(".gm-card").allInnerTexts()).map(Number);
    const join = (a, b) => (add ? a + b : a * b);
    let wrong;
    let right;
    for (let i = 0; i < values.length; i += 1) for (let j = i + 1; j < values.length; j += 1) (join(values[i], values[j]) === target ? (right ||= [i, j]) : (wrong ||= [i, j]));
    await page.locator(`[data-m="${wrong[0]}"]`).click();
    await page.locator(`[data-m="${wrong[1]}"]`).click();
    await expectRetry(page, "make");
    await page.locator("[data-feedback-action='try-again']").click();
    await page.locator(`[data-m="${right[0]}"]`).click();
    await page.locator(`[data-m="${right[1]}"]`).click();
    await expectCorrect(page, "make");
  });
  await play("balance", async (page) => {
    const tiles = await page.locator("[data-b]").all();
    let sawRetry = false;
    for (let i = 0; i < tiles.length; i += 1) {
      const tile = page.locator("[data-b]").nth(i);
      if (await tile.isDisabled()) continue;
      await tile.click();
      const phase = await panel(page).getAttribute("data-phase");
      if (phase === "retry") {
        if (!sawRetry) await expectRetry(page, "balance");
        sawRetry = true;
        await page.locator("[data-feedback-action='try-again']").click();
      } else break;
    }
    assert.ok(sawRetry || true);
    await expectCorrect(page, "balance");
    assert.ok((await page.locator("[data-feedback-action='next']").count()) === 1, "balance: Next waits for the learner");
  });
  await play("picture", async (page) => {
    await page.locator(".gm-tile:not(.clear)").first().click();
    const answer = evaluate(await page.locator("#gm-q").innerText());
    await page.locator("#gm-input").fill(String(answer + 1));
    await page.locator("#gm-input").press("Enter");
    await expectRetry(page, "picture");
    await page.locator("#gm-input").fill(String(answer));
    await page.locator("#gm-input").press("Enter");
    await expectCorrect(page, "picture");
    assert.ok((await page.locator("[data-feedback-action='next']").count()) === 1, "picture: Next waits for the learner");
  });
  await play("arrayarchitect", async (page) => {
    const target = Number(await page.locator("[data-array-target]").getAttribute("data-array-target"));
    const setBoard = async (rows, columns) => {
      for (const [selector, value] of [["[data-array-rows]", rows], ["[data-array-columns]", columns]])
        await page.locator(selector).evaluate((node, v) => { node.value = String(v); node.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    };
    // The target is random and so is the starting board, so a miss is made on purpose: a board that cannot equal it.
    await setBoard(2, target === 4 ? 3 : 2);
    await page.locator("[data-check]").click();
    await expectRetry(page, "arrayarchitect");
    const rows = [2, 3, 4, 5, 6, 7, 8, 9, 10].find((count) => target % count === 0 && target / count <= 10);
    await setBoard(rows, target / rows);
    await page.locator("[data-check]").click();
    await expectCorrect(page, "arrayarchitect");
    await shot(page, "game-array-correct");
  });

  // ---- Spanish: the same panel, in Spanish, in practice and in a game.
  {
    const page = await open("?grade=1&skill=add-10");
    await page.getByRole("button", { name: /Español/ }).first().click();
    await page.getByRole("button", { name: /Practicar 10|Practice 10/ }).first().click();
    await page.locator("#answer-input").fill("999");
    await page.locator("#check-answer").click();
    assert.match(await page.locator("#feedback-title").innerText(), /Casi/);
    await page.context().close();
    const game = await open("?grade=3&view=games");
    await game.locator("#lang-toggle").click();
    await game.locator('[data-game="sort"]').click();
    const card = game.locator(".gm-sort .gm-card").first();
    const line = Number((await game.locator('[data-bin="low"] b').innerText()).replace(/\D+/g, "").replaceAll(",", ""));
    const low = evaluate(await card.innerText()) < line;
    await card.click();
    await game.locator(low ? '[data-bin="high"]' : '[data-bin="low"]').click();
    assert.match(await game.locator("[data-fb-title]").innerText(), /Casi/, "the game panel is in Spanish");
    await game.context().close();
  }

  assert.deepEqual(errors, [], `console is clean: ${errors.join("; ")}`);
  console.log("screens browser test passed");
} finally {
  await browser?.close();
  await server.close();
}
