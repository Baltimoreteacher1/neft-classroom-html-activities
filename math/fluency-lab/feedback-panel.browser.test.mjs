import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const shots = process.env.FEEDBACK_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/math/fluency-lab/?grade=1&skill=add-10`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Practice 10" }).click();
  const feedback = page.locator("#feedback");
  const answer = async (text) => {
    await page.locator("#answer-input").fill(String(text));
    await page.locator("#check-answer").click();
  };
  const sum = async () => {
    const [, a, b] = (await page.locator("#question").innerText()).match(/(\d+)\s*\+\s*(\d+)/);
    return Number(a) + Number(b);
  };
  const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });

  // Not quite: heading, kept answer, three controls, nothing advances on its own.
  await answer(999);
  await feedback.waitFor({ state: "visible" });
  assert.equal(await page.locator("#feedback-title").innerText(), "Not quite. Let's work through it.");
  assert.equal(await feedback.getAttribute("data-phase"), "retry");
  assert.match(await page.locator("#feedback-answers").innerText(), /Your answer\s*999/);
  assert.equal(await page.locator("#feedback-icon svg").count(), 1, "the miss has an icon, not only a colour");
  const labels = await page.locator("#feedback-actions button").allInnerTexts();
  assert.deepEqual(labels, ["Try again", "Show hint", "See worked example"]);
  assert.equal(await page.locator("#next-problem").isHidden(), true, "no Next button before the problem is settled");
  assert.equal(await page.locator("#answer-input").inputValue(), "999", "the original answer stays in the box");
  await shot("1-not-quite-desktop");

  // Show hint uses the page's hint, then is not offered again; Try again returns to the answer box.
  await page.getByRole("button", { name: "Show hint" }).click();
  assert.deepEqual(await page.locator("#feedback-actions button").allInnerTexts(), ["Try again", "See worked example"]);
  await page.getByRole("button", { name: "Try again" }).click();
  assert.equal(await page.evaluate(() => document.activeElement?.id), "answer-input");

  // A double click on Check scores once.
  const right = await sum();
  await page.locator("#answer-input").fill(String(right));
  await page.locator("#check-answer").dblclick();
  await page.locator("#next-problem").waitFor({ state: "visible" });
  assert.equal(await page.locator("#feedback-title").innerText(), "Correct!");
  assert.equal(await feedback.getAttribute("data-phase"), "assisted", "right after a miss and a hint is supported work");
  assert.match(await page.locator("#feedback-badge").innerText(), /help/i);
  assert.match(await page.locator("#feedback-answers").innerText(), new RegExp(`Correct answer\\s*${right}`));
  assert.match(await page.locator("#session-count").innerText(), /^1 completed/, "one answer counted once");
  assert.equal(await page.locator("#feedback-actions").isHidden(), true);
  assert.match(await page.locator("#next-problem").innerText(), /Next problem|Finish/);
  await shot("2-correct-supported-desktop");

  // The next problem may open with support after a miss ("Friendly Start"), so the badge must match whichever
  // phase the machine reports, and the correct answer is always shown.
  await page.locator("#next-problem").click();
  assert.equal(await feedback.isHidden(), true, "the panel clears for the next problem");
  const second = await sum();
  await answer(second);
  await page.locator("#next-problem").waitFor({ state: "visible" });
  const phase = await feedback.getAttribute("data-phase");
  assert.ok(["correct", "assisted"].includes(phase));
  assert.match(await page.locator("#feedback-badge").innerText(), phase === "correct" ? /on your own/i : /help/i);
  assert.equal(await page.locator("#feedback-answers dd").last().innerText(), String(second));
  await shot("3-correct-desktop");

  // Live region and reduced motion.
  assert.equal(await page.locator("#feedback .fb-live").getAttribute("role"), "status");
  assert.equal(await page.locator("#feedback .fb-live").getAttribute("aria-live"), "polite");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const animation = await page.locator("#feedback").evaluate((node) => getComputedStyle(node).animationName);
  assert.equal(animation, "none", "reduced motion stops the success animation");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // Layout at tablet and phone widths, on a fresh miss.
  await page.locator("#next-problem").click();
  await answer(999);
  for (const [name, width, height] of [["tablet", 820, 1100], ["phone", 390, 844]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `no sideways scroll at ${width}px`);
    for (const box of await page.locator("#feedback-actions button").all()) assert.ok((await box.boundingBox()).height >= 44, "touch targets are at least 44px");
    await feedback.scrollIntoViewIfNeeded();
    await shot(`4-not-quite-${name}`);
  }

  // Spanish.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: /Español/ }).first().click();
  await answer(998);
  assert.match(await page.locator("#feedback-title").innerText(), /Casi/);
  assert.deepEqual(errors, [], `no page errors: ${errors.join("; ")}`);
  console.log("feedback panel browser test passed");
} finally {
  await browser?.close();
  await server.close();
}
