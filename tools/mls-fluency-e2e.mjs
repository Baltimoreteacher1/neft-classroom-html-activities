// Teacher entry, shared links, family practice, collections, and offline replay in Chromium.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { chromium } from "playwright";
import { practiceProblem, sourceSkill } from "../access-practice-lab/src/mls/fluency-problems.js";
import { serveAccess } from "./lib/access-serve.mjs";

const server = process.env.BASE ? null : await serveAccess();
const base = process.env.BASE || server.base;
const root = "/access-practice-lab/math-literacy";
const output = process.env.MLS_FLUENCY_SCREENSHOTS;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 940 },
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => {
  if (!/web-vitals/.test(String(error))) errors.push(String(error));
});
page.on("console", (message) => {
  if (message.type() === "error" && /\[math-literacy\]|\[access-lab\]/.test(message.text()))
    errors.push(message.text());
});

const shot = async (name) => {
  if (output) await page.screenshot({ path: join(output, `${name}.png`), animations: "disabled" });
};
const go = (path) => page.goto(base + path, { waitUntil: "domcontentloaded" });

try {
  for (const path of ["/access-teacher/", "/access-teacher/classroom/?grade=3&subject=Science"]) {
    await go(path);
    const programs = page.getByRole("navigation", { name: "Teacher programs" });
    await expect(programs.getByRole("link")).toHaveCount(2);
    await expect(
      programs.getByRole("link", { name: "I'm a BCPSS Teacher", exact: false }),
    ).toHaveAttribute("href", "/bcpss-teachers/");
    await expect(
      programs.getByRole("link", { name: "Math Literacy Studio", exact: false }),
    ).toHaveAttribute("href", root);
  }
  await shot("teacher-programs");
  await page.getByRole("link", { name: /Math Literacy Studio Teach a math skill/ }).click();
  await expect(page.getByRole("link", { name: /^Teach a skill/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Create a resource/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Support a learner/ })).toBeVisible();
  await go(`${root}/teach?grade=6`);
  await page
    .getByRole("link", { name: /^Ratios\b/ })
    .first()
    .click();

  const practice = page.getByRole("region", { name: "Interactive practice" });
  await expect(practice).toBeVisible();
  await practice.locator("summary").click();
  await practice.getByLabel("Mathematics").selectOption("1");
  await practice.getByRole("button", { name: "Apply" }).click();
  await expect(practice.getByRole("link", { name: "Practice this skill" })).toHaveAttribute(
    "href",
    /level=1/,
  );
  await practice.scrollIntoViewIfNeeded();
  await shot("teacher-ratios");
  if (!(await practice.getByRole("button", { name: "Copy practice link" }).isVisible()))
    await practice.locator("summary").click();
  await practice.getByRole("button", { name: "Copy practice link" }).click();
  await expect(practice.getByRole("status")).toHaveText("Practice link copied.");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copied, /\/fluency\/6\/ratios\?.*level=1/);
  assert.doesNotMatch(copied, /answer|learner|response|saved=/);
  await practice.getByRole("button", { name: "Save to collections" }).click();
  await expect(practice.getByRole("button", { name: "Saved to collections" })).toBeVisible();

  await go(`${root}/collections`);
  const saved = page.getByRole("link", { name: /Equivalent ratios.*Interactive practice/ });
  await expect(saved).toHaveAttribute("href", /\/fluency\/6\/ratios\?.*level=1/);
  await page.getByLabel("New collection").fill("Ratios warm-ups");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByLabel("Add to").selectOption({ label: "Ratios warm-ups" });
  await expect(page.getByRole("heading", { name: "Ratios warm-ups" })).toBeVisible();
  await expect(saved).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Download printable resources/ })).toHaveCount(0);

  const fresh = await browser.newContext({
    viewport: { width: 375, height: 800 },
    reducedMotion: "reduce",
  });
  const student = await fresh.newPage();
  await student.goto(copied, { waitUntil: "domcontentloaded" });
  await expect(student.getByRole("button", { name: "Check answer" })).toBeVisible();
  await expect(student.getByRole("heading", { level: 1 })).toHaveText(/ratios/i);
  assert.equal(await student.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  // Activity chrome: the exact grade, one language control and a return link; no audience, grade or workspace controls.
  await expect(student.getByText("Grade 6", { exact: true })).toBeVisible();
  await expect(student.locator(".lab-top .lang-switch")).toBeVisible();
  await expect(student.getByRole("link", { name: "Back to the skill" })).toBeVisible();
  for (const hidden of [
    ".lab-top .top-aud",
    ".lab-top .grade-select",
    "#tlpControlBar",
    "#labSectionBar",
    ".lab-top .lab-utilities",
  ]) {
    await expect(student.locator(hidden).first()).toBeHidden();
  }
  await student.screenshot(
    output ? { path: join(output, "student-ratios-phone.png"), animations: "disabled" } : {},
  );
  await student.getByRole("link", { name: "Back to the skill" }).click();
  await expect(student.getByRole("region", { name: "Interactive practice" })).toBeVisible();
  await student.goBack({ waitUntil: "domcontentloaded" });
  await expect(student.getByRole("button", { name: "Check answer" })).toBeVisible();
  await fresh.close();

  await go(`${root}/skill/g6-ratios`);
  await practice.getByRole("link", { name: "See a guided example" }).click();
  await expect(page.getByRole("heading", { name: "Worked example" })).toBeVisible();
  await shot("student-ratios-model");
  await page.getByRole("link", { name: "Practice this skill" }).click();
  await expect(page.getByRole("button", { name: "Check answer" })).toBeVisible();
  await page.getByRole("link", { name: "Back to the skill" }).click();
  await practice.getByRole("link", { name: "Play a skill game" }).click();
  await expect(page.locator("[data-ml-stage]")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to the skill" })).toBeVisible();
  assert.ok((await page.locator("[data-ml-stage] button").count()) > 0, "game mounted");

  // Race-capable skills play the untimed race; skills without it keep the Studio game (ratios, above).
  await go(`${root}/skill/g6-percents`);
  const percents = page.getByRole("region", { name: "Interactive practice" });
  await expect(percents.getByRole("link", { name: "Play a skill game" })).toHaveCount(0);
  await percents.getByRole("link", { name: "Play a math race" }).click();
  await expect(page).toHaveURL(/\/fluency\/6\/percent\?.*stage=game/);
  await expect(page.getByText(/There is no clock/)).toBeVisible();
  await expect(page.getByLabel(/^You · 0\/\d+/)).toBeVisible();
  await expect(page.getByLabel(/^Rival · /)).toBeVisible();
  const raceItem = practiceProblem(sourceSkill(6, "percent"), 1, 2);
  if (raceItem.choices?.length)
    await page
      .getByRole("radio")
      .nth(raceItem.choices.findIndex((c) => raceItem.answers.includes(c)))
      .check();
  else await page.getByRole("textbox", { name: /your answer/i }).fill(raceItem.answers[0]);
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: /^(Next problem|Finish race)$/ }).click();
  await expect(page.getByLabel(/^You · 1\/\d+/)).toBeVisible();
  await shot("student-percent-race");
  await page.getByRole("link", { name: "Back to the skill" }).click();
  await expect(page.getByRole("region", { name: "Interactive practice" })).toBeVisible();

  // The header language switch changes a copied link that names lang=, survives reload, and the return keeps the focus.
  await go(`${root}/skill/g3-muldiv?focus=division-facts`);
  await page.getByRole("link", { name: "Practice this skill" }).click();
  await expect(page).toHaveURL(/\/fluency\/3\/division-facts\?.*lang=en/);
  await expect(page.getByText("Problem 1 of 8")).toBeVisible();
  await page.locator('.lab-top [data-lang-mode="es"]').click();
  await expect(page.getByText("Problema 1 de 8")).toBeVisible();
  await expect(page).toHaveURL(/lang=es/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Problema 1 de 8")).toBeVisible();
  await page.getByRole("link", { name: "Volver a la habilidad" }).click();
  await expect(page.getByRole("combobox", { name: "Practice focus" })).toHaveValue(
    "division-facts",
  );

  await go(`${root}/family/g6-ratios?lang=es`);
  await page.getByRole("link", { name: "Practiquen con tres preguntas más" }).click();
  await expect(page.getByText("Problema 1 de 3")).toBeVisible();
  await expect(page.getByRole("link", { name: "Volver a la página familiar" })).toHaveAttribute(
    "href",
    /\/family\/g6-ratios\?lang=es/,
  );

  await go(`${root}/fluency/2/place-1000?grades=6-8&lang=en&studio=g2.placevalue`);
  await expect(page.getByText("Grade 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check answer" })).toBeVisible();
  for (const width of [375, 820, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      0,
      `overflow at ${width}`,
    );
  }
  await go(`${root}/fluency/2/ratios?return=https://example.com`);
  await expect(
    page.getByRole("heading", { name: "That practice activity is unavailable" }),
  ).toBeVisible();

  // Warm the shared modules via an ACCESS-controlled visit, then reload that direct link with the network disabled.
  if (!process.env.MLS_SKIP_OFFLINE) {
    // Automated browsers skip worker registration unless the URL asks for it with sw=1.
    await go(`${root}/fluency/6/ratios?lang=en&studio=g6.ratios&sw=1`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, {
      timeout: 30000,
    });
    await go(`${root}/fluency/6/ratios?lang=en&studio=g6.ratios&sw=1`);
    await expect(page.getByRole("button", { name: "Check answer" })).toBeVisible();
    await page.waitForFunction(async () => {
      for (const key of await caches.keys()) {
        if (
          key.startsWith("ewl-access-") &&
          (await (await caches.open(key)).match("/math/fluency-lab/problem-bank.js"))
        )
          return true;
      }
      return false;
    });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Check answer" })).toBeVisible();
    await context.setOffline(false);
  }

  assert.deepEqual(errors, []);
  console.log(
    "MLS Fluency Chromium: teacher choices, copy/collections, fresh mobile launch, guided model, game and race, header, language, family, exact grade, and offline replay passed.",
  );
} finally {
  await browser.close();
  server?.server.close();
}
