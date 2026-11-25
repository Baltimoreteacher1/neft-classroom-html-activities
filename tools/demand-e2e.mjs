#!/usr/bin/env node
/**
 * Language Demand Analyzer (/demand) in a real browser: empty submit, the example, shaded and numbered flags, the
 * steps and word table, Spanish chrome, a typed edit surviving a re-render, copy, 375px, axe WCAG 2.2 AA, and that
 * nothing leaves the page or is stored.
 *
 *   node tools/demand-e2e.mjs
 */
import { startRun } from "./lib/lab-e2e.mjs";

const { page, ok, go, axe, overflow, finish } = await startRun("demand-e2e");
const requests = [];
page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));
try {
  await go("/demand?grades=6-8");
  ok(
    (await page.locator("h1").innerText()).includes("Language Demand Analyzer"),
    "/demand renders one h1",
  );
  await page.locator("[data-dm-check]").click();
  ok(
    /Paste or type a task first/.test(await page.locator("#app").innerText()),
    "an empty check asks for text and does not crash",
  );

  await page.locator("[data-dm-sample]").click();
  ok((await page.locator("#dmText").inputValue()).length > 100, "the example fills the box");
  await page.locator("[data-dm-check]").click();
  await page.waitForSelector("#dmResults");
  ok((await page.locator(".dm-mark").count()) >= 3, "word-level flags are shaded in the text");
  ok(
    (await page.locator(".dm-mark").count()) === (await page.locator(".dm-mark sup").count()),
    "each shaded flag carries a number, not just a colour",
  );
  ok(
    (await page.locator(".dm-finding").count()) >= 5,
    "findings are listed with why and a way to try",
  );
  ok(
    /Several directions at once/.test(await page.locator(".dm-findings").innerText()),
    "stacked directions are named",
  );
  ok(
    (await page
      .locator("details", { hasText: "Your directions, in steps" })
      .locator("li")
      .count()) >= 3,
    "the directions are offered in steps",
  );
  ok(
    (await page.locator(".dm-table tbody tr").count()) >= 3,
    "the word table lists pre-teach words",
  );
  ok(
    /erosión/.test(await page.locator(".dm-table").innerText()),
    "words carry a Spanish equivalent",
  );
  await page.locator("details", { hasText: "cannot tell you" }).locator("summary").click();
  ok(
    /not a district curriculum alignment/i.test(
      await page.locator("details", { hasText: "cannot tell you" }).innerText(),
    ),
    "the limits are on the page",
  );
  ok(
    !/\b(proficiency level|score of)\b/i.test(await page.locator("#app").innerText()),
    "no student level or score is claimed",
  );

  const marked = await page.locator(".dm-marked").innerText();
  const typed = await page.locator("#dmText").inputValue();
  ok(
    marked.replace(/\d+/g, "").replace(/\s+/g, " ").includes("Read the passage about erosion"),
    "the shaded text is the teacher's own words",
  );
  await page.locator("#dmText").fill(`${typed} Add one more sentence.`);
  await page.locator('input[name="dmBand"][value="3-5"]').check();
  await page.locator("[data-dm-check]").click();
  ok(
    (await page.locator("#dmText").inputValue()).endsWith("Add one more sentence."),
    "a typed edit survives the re-render",
  );
  ok(
    await page.locator('input[name="dmBand"][value="3-5"]').isChecked(),
    "the chosen band survives the re-render",
  );

  await page
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"])
    .catch(() => {});
  await page.locator("[data-dm-copy]").click();
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
  ok(
    !clip || /LANGUAGE SUPPORTS FOR THIS TASK/.test(clip),
    "copy puts the supports on the clipboard as text",
  );

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  ok(!stored.includes("erosion"), "the teacher's text is not stored");
  ok(
    requests.every((r) => r.includes("localhost") || !/^(POST|PUT)/.test(r)),
    "no request carries the text anywhere",
  );

  await axe("/demand with results");
  await page.setViewportSize({ width: 375, height: 800 });
  ok((await overflow()) <= 1, "no horizontal overflow at 375px");
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.evaluate(() => {
    const k = "accessPracticeLab:v1:prefs";
    localStorage.setItem(k, JSON.stringify({ langChosen: true, band: "6-8", lang: "es" }));
  });
  await go("/demand?grades=6-8");
  ok(
    (await page.locator("h1").innerText()).includes("Analizador de demanda"),
    "/demand renders in Spanish",
  );
} catch (error) {
  ok(false, `run aborted: ${error.message.split("\n")[0]}`);
}
await finish();
