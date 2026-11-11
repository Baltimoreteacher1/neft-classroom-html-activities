import assert from "node:assert/strict";
import { chromium } from "playwright";
import { serveAccess } from "./lib/access-serve.mjs";

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
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/access-practice-lab/`, { waitUntil: "domcontentloaded" });
  await page.goto(`${base}/access-practice-lab/subject-reading?grades=6-8`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByText("Ecosystems: from food webs to new evidence", { exact: false })
    .first()
    .waitFor({ state: "visible" });
  assert.match(
    await page.locator("body").innerText(),
    /Ecosystems: from food webs to new evidence/,
  );
  await page.goto(
    `${base}/access-practice-lab/subject-reading/ecosystems-relationships?grades=6-8`,
    { waitUntil: "domcontentloaded" },
  );
  await page.waitForSelector('[data-sr-word="organism"]');
  await page
    .getByText("A Web of Living Things", { exact: false })
    .first()
    .waitFor({ state: "visible" });
  await page.waitForSelector('[data-sr-word="organism"]');
  assert.match(await page.locator("body").innerText(), /A Web of Living Things/);
  await page.locator('[data-sr-word="organism"]').click();
  assert.match(await page.locator(".sr-word-meaning").innerText(), /one living thing/);
  await page.locator('[data-sr-evidence="1"]').click();
  await page
    .locator("[data-sr-draft]")
    .fill(
      "The heron may hunt less because reeds provide cover and insects live in reeds. If reeds disappear, the heron may have trouble finding fish and insects because its hunting cover is reduced.",
    );
  await page.locator("[data-sr-submit]").click();
  assert.ok(await page.locator("[data-sr-revision]").count());
  await page.goto(`${base}/access-practice-lab/vocab-curriculum?grades=6-8`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByText("Grade 6", { exact: false }).first().waitFor({ state: "visible" });
  assert.match(await page.locator("body").innerText(), /Grade 6/);
  await page.goto(`${base}/access-practice-lab/vocab-curriculum/g6-evaluate-sources?grades=6-8`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".vc-rail");
  assert.match(await page.locator("body").innerText(), /Evaluate a source/);
  assert.ok(await page.locator(".vc-rail").count());
  assert.deepEqual(
    errors.filter((error) => !error.includes('Failed to resolve module specifier "web-vitals"')),
    [],
  );
  console.log("language-additions-smoke: grade 6 reading and vocabulary routes passed");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
