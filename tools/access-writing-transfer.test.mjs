#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { nextWritingTransfer } from "../access-practice-lab/src/views/write.js";
import { serveAccess } from "./lib/access-serve.mjs";

const tasks = JSON.parse(
  readFileSync(new URL("../access-practice-lab/content/studio/writing.json", import.meta.url)),
).tasks;
const first = tasks.find((task) => task.id === "wrt-mulch-cer");
const other = nextWritingTransfer(tasks, first, { writing: {} }, "6-8");
assert.ok(other);
assert.equal(other.keyUse, first.keyUse);
assert.notEqual(other.contentArea, first.contentArea);
assert.equal(
  nextWritingTransfer(
    tasks,
    first,
    { writing: { [other.id]: { versions: [{ text: "existing" }] } } },
    "6-8",
  )?.id === other.id,
  false,
);

const { server, base } = await serveAccess();
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  await context.addInitScript(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ band: "6-8", lang: "en", langChosen: true }),
    ),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => {
    if (!/web-vitals/.test(error.message)) errors.push(error.message);
  });
  await page.goto(`${base}/access-practice-lab/write/${first.id}?grades=6-8`, {
    waitUntil: "networkidle",
  });
  await page
    .locator("[data-draft]")
    .fill("Mulch protects the soil because the covered tray lost less soil than the bare tray.");
  await page.locator("[data-feedback]").click();
  await page
    .locator("[data-draft]")
    .fill(
      "Mulch protects the soil because the covered tray lost less soil than the bare tray. The data show that the cover slowed runoff.",
    );
  await page.locator("[data-feedback]").click();
  await page.locator("[data-reflection]").fill("I connected my claim to the measured evidence.");
  await page.locator("[data-finish]").click();
  const link = page.locator(
    `a[href*="/write/${other.id}?grades=6-8&transfer=1&fromWriting=${first.id}"]`,
  );
  await link.waitFor();
  assert.equal(await link.count(), 1);
  await link.click();
  assert.match(
    await page.locator("body").innerText(),
    /fresh context to show what you can do on your own/i,
  );
  await page
    .locator("[data-draft]")
    .fill(
      "The canal changed towns because boats could carry goods to new markets. The source shows that trade reached more places.",
    );
  await page.locator("[data-feedback]").click();
  const ledger = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger")),
  );
  const transfer = ledger.entries.find(
    (entry) => entry.task === other.id && entry.kind === "transfer",
  );
  assert.ok(transfer, "new-context first response must be recorded as transfer evidence");
  assert.equal(transfer.m.transferFrom, first.id);
  assert.deepEqual(errors, []);
  console.log("access-writing-transfer: revision, fresh prompt, transfer evidence passed");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
