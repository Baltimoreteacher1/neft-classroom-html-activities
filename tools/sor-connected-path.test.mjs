import assert from "node:assert/strict";
import { chromium } from "playwright";
import { READING_LESSONS, validateLesson } from "../access-practice-lab/src/sor/sequence.js";
import { serveAccess } from "./lib/access-serve.mjs";

for (const lesson of READING_LESSONS) assert.deepEqual(validateLesson(lesson), [], lesson.id);
const { server, base } = await serveAccess();
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  await context.addInitScript(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ band: "3-5", lang: "en", langChosen: true }),
    ),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => {
    if (!/web-vitals/.test(error.message)) errors.push(error.message);
  });
  await page.goto(`${base}/access-practice-lab/`, { waitUntil: "networkidle" });
  await page.goto(`${base}/access-practice-lab/science-of-reading/path?grades=3-5`, {
    waitUntil: "networkidle",
  });
  assert.equal(await page.locator(".sor2-path-card").count(), READING_LESSONS.length);
  await page.locator('a[href*="lesson/cvc-short-a"]').first().click();
  await page.locator("[data-sor-next]").click();
  for (const tile of ["s", "a", "t"])
    await page.locator(`[data-sor-tile="${tile}"]`).first().click();
  await page.locator('[data-sor-check="build"]').click();
  assert.match(
    await page.locator(".sor2-stage").innerText(),
    /Decode a new word/,
    JSON.stringify(
      await page.evaluate(() => JSON.parse(localStorage.getItem("accessPracticeLab:v1:sor"))),
    ),
  );
  await page.locator('[data-sor-choice="map"]').click();
  await page.locator('[data-sor-check="read"]').click();
  await page.locator('[data-sor-input="spelling"]').fill("cap");
  await page.locator('[data-sor-check="spell"]').click();
  await page.locator('[data-sor-input="explanation"]').fill("The cap is on the mat.");
  await page.locator('[data-sor-check="text"]').click();
  await page.locator('[data-sor-input="transfer"]').fill("tap");
  await page.locator('[data-sor-check="transfer"]').click();
  assert.match(await page.locator(".sor2-stage").innerText(), /Lesson complete/);
  const records = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem("accessPracticeLab:v1:sor")),
    ledger: JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger")),
  }));
  assert.ok(records.state["cvc-short-a"].doneAt);
  assert.ok(
    records.ledger.entries.some(
      (e) =>
        e.src === "phonics" &&
        e.task === "cvc-short-a" &&
        e.kind === "transfer" &&
        e.stage === "independent",
    ),
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.match(await page.locator(".sor2-stage").innerText(), /Lesson complete/);
  assert.deepEqual(errors, []);
  console.log("sor-connected-path: build, decode, spell, read, transfer, save and resume passed");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
