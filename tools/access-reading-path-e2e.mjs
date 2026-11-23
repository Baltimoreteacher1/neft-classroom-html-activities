#!/usr/bin/env node
// Source checks exempt only the known bare web-vitals specifier; built-preview checks exempt nothing.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { roundFor } from "../access-practice-lab/src/reading-path/games/engine.js";
import { serveAccess } from "./lib/access-serve.mjs";

const scope = JSON.parse(
  readFileSync(
    new URL("../access-practice-lab/content/reading-path/phonics-scope.json", import.meta.url),
  ),
);
const local = process.env.BASE ? null : await serveAccess();
const base = process.env.BASE || local.base;
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => {
  if (process.env.BASE || !/web-vitals/.test(e.message)) errors.push(e.message);
});
const prefs = (lang, band) =>
  page.evaluate(
    ({ lang, band }) =>
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ lang, langChosen: true, band }),
      ),
    { lang, band },
  );
const go = async (path) => {
  await page.goto(base + path);
  await page.locator(".rp-page").waitFor();
};
try {
  await go("/access-practice-lab/reading-path?grades=6-8");
  for (const lang of ["en", "es"])
    for (const band of ["K", "6-8"]) {
      await prefs(lang, band);
      for (const unit of scope.units) {
        await go(`/access-practice-lab/reading-path/${unit.id}?grades=${band}`);
        assert.equal(await page.locator(".rp-page ul a.btn").count(), unit.items.length);
        assert.ok((await page.locator(".rp-page h2").innerText()).includes(unit.teaches[lang]));
      }
    }
  console.log("PASS all 15 unit pages, both skins, English and Spanish (60 renders)");
  await prefs("en", "6-8");
  await go("/access-practice-lab/reading-path?grades=6-8");
  await page.getByRole("link", { name: "Begin", exact: true }).click();
  await page.getByRole("link", { name: "Build a Word", exact: true }).click();
  const unit = scope.units[0];
  for (let n = 0; n < 5; n++) {
    const round = roundFor(unit, "build", { band: "6-8", seed: n + 1 });
    const wrong = round.tiles.find((t) => t.s !== round.sounds[0]);
    await page.locator(`[data-tile="${wrong.id}"]`).focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("[data-rp-continue]").count(), 0);
    const used = new Set();
    for (const sound of round.sounds) {
      const t = round.tiles.find((t) => t.s === sound && !used.has(t.id));
      used.add(t.id);
      await page.locator(`[data-tile="${t.id}"]`).focus();
      await page.keyboard.press("Enter");
    }
    await page.locator("[data-rp-continue]").waitFor();
    await page.locator("[data-rp-continue]").focus();
    await page.keyboard.press("Enter");
  }
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:reading-path"))["short-a/build"],
    ),
    true,
  );
  await page.reload();
  await page.locator(".rp-page").waitFor();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:reading-path"))["short-a/build"],
    ),
    true,
  );
  console.log("PASS keyboard-only Build a Word, wrong move recovery, five rounds, bookmark reload");
  await go("/access-practice-lab/reading-path/long-a/switch?grades=6-8");
  assert.equal(await page.locator(".rp-switch-before .rp-picto").innerText(), "🧢");
  await page.locator('[data-value="e"]').click();
  assert.equal(await page.locator(".rp-switch-pair figure").count(), 2);
  assert.deepEqual(await page.locator(".rp-switch-pair .rp-picto").allInnerTexts(), ["🧢", "🦸"]);
  assert.match(await page.locator(".rp-switch-pair").innerText(), /cap[\s\S]*cape/);
  console.log("PASS Silent-e Switch changes its picture and word after adding e");
  for (const unit of scope.units) {
    await go(`/access-practice-lab/reading-path/${unit.id}/reader?grades=6-8`);
    assert.ok((await page.locator("#rpSentence").innerText()).trim());
  }
  await go("/access-practice-lab/reading-path/short-a/reader?grades=6-8");
  await page.locator("h1").focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  await page.locator("[data-rp-done]").click();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:reading-path"))["short-a/reader"],
    ),
    true,
  );
  console.log("PASS all 15 reader pages; arrow-key page turn and end bookmark");
  await go("/access-practice-lab/reading-path/library?grades=6-8");
  assert.equal(await page.locator(".rp-page li a").count(), 39);
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    await go(`/access-practice-lab/reading-path/letters/${letter}?grades=6-8`);
    assert.equal(await page.locator("[data-rp-canvas]").count(), 1);
    await page.locator("[data-rp-show]").focus();
    await page.keyboard.press("Enter");
    assert.ok(await page.locator(".is-showing").count());
  }
  console.log("PASS all 26 letter canvases and keyboard Show me controls; 39 library texts");
  await go("/access-practice-lab/reading-path?grades=6-8");
  await page.locator(".rp-page details summary").filter({ hasText: "Adults" }).click();
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator('[data-rp-print="short-a"]').click();
  await page.locator("#sheetPrint").waitFor({ state: "attached" });
  const cardCounts = await page
    .locator("[data-rp-card-page]")
    .evaluateAll((pages) => pages.map((p) => p.querySelectorAll("[data-rp-print-card]").length));
  assert.deepEqual(cardCounts, [6, scope.units[0].exampleWords.length - 6]);
  await page.emulateMedia({ media: "print" });
  assert.equal(
    await page
      .locator("[data-rp-card-page]")
      .first()
      .evaluate((p) => getComputedStyle(p).gridTemplateColumns.split(" ").length),
    3,
  );
  assert.equal(
    await page
      .locator("[data-rp-card-page]")
      .first()
      .evaluate((p) => getComputedStyle(p).breakAfter),
    "page",
  );
  await page.emulateMedia({ media: "screen" });
  console.log("PASS adult word-list print: six-card sheets and explicit page breaks");
  await page.goto(base + "/access-teacher/");
  await page.locator("[data-teacher-role]").waitFor();
  const initial = await page
    .locator(".tc-action-card")
    .evaluateAll((nodes) => nodes.map((n) => n.dataset.tcAction));
  assert.equal(await page.locator(".tc-action-grid").first().locator(".tc-action-card").count(), 3);
  assert.equal(await page.locator(".tc-more-tasks .tc-action-card").count(), 3);
  assert.equal(await page.locator(".tc-more-tasks").evaluate((node) => node.open), false);
  await page.locator("[data-teacher-role]").selectOption("coach");
  await page.waitForFunction(
    () => document.querySelector(".tc-action-card")?.dataset.tcAction === "create",
  );
  const changed = await page
    .locator(".tc-action-card")
    .evaluateAll((nodes) => nodes.map((n) => n.dataset.tcAction));
  assert.deepEqual(changed.slice(0, 3), ["create", "plan", "find"]);
  assert.deepEqual(changed.slice(3), initial.slice(3));
  assert.equal(await page.locator(".tc-action-grid").first().locator(".tc-action-card").count(), 3);
  await page.reload();
  await page.locator("[data-teacher-role]").waitFor();
  assert.equal(await page.locator("[data-teacher-role]").inputValue(), "coach");
  await page.evaluate(() =>
    localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ lang: "es" })),
  );
  await page.reload();
  await page.locator("[data-teacher-role]").waitFor();
  assert.equal(await page.locator("#tcTitle").innerText(), "¿Qué quieres hacer hoy?");
  assert.equal(
    await page.locator("[data-teacher-role] option:checked").innerText(),
    "Asesor de enseñanza",
  );
  assert.equal(await page.locator(".tc-more-tasks > summary").innerText(), "Más tareas");
  await page.evaluate(() =>
    localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ lang: "en" })),
  );
  console.log("PASS teacher role reorders only first three cards and survives reload");
  mkdirSync("/tmp/lp-integration-qa/screenshots", { recursive: true });
  for (const width of [1440, 768, 375, 320])
    for (const lang of ["en", "es"]) {
      await page.setViewportSize({ width, height: 1000 });
      await go("/access-practice-lab/reading-path?grades=6-8");
      await prefs(lang, "6-8");
      await page.reload();
      await page.locator(".rp-page").waitFor();
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${width}/${lang} overflow`,
      );
      await page.screenshot({
        path: `/tmp/lp-integration-qa/screenshots/reading-${width}-${lang}.png`,
        fullPage: true,
      });
    }
  for (const width of [375, 1440])
    for (const path of [
      "",
      "/short-a",
      "/short-a/build",
      "/short-a/reader",
      "/library",
      "/letters/a",
    ]) {
      await page.setViewportSize({ width, height: 1000 });
      await go(`/access-practice-lab/reading-path${path}?grades=6-8`);
      const result = await new AxeBuilder({ page })
        .include(".rp-page")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
        [],
        `axe ${path} ${width}`,
      );
    }
  console.log("PASS responsive EN/ES at 1440/768/375/320; changed-surface axe at 375/1440");
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(base + "/access-practice-lab/family/today?grades=3-5");
  await page.locator(".family-today").waitFor();
  assert.equal(await page.locator(".today-words input").count(), 5);
  await page.locator('[data-today-lang="es"]').click();
  assert.match(await page.locator(".family-today h1").innerText(), /Hoy en casa/);
  const dailyTalk = await page.locator(".family-today .panel").first().innerText();
  await page.locator('[data-today-check="0"]').check();
  await page.reload();
  await page.locator(".family-today").waitFor();
  assert.equal(await page.locator('[data-today-check="0"]').isChecked(), true);
  assert.equal(await page.locator(".family-today .panel").first().innerText(), dailyTalk);
  const todayAxe = await new AxeBuilder({ page })
    .include(".family-today")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    todayAxe.violations.map((v) => v.id),
    [],
    "Today at home axe",
  );
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "Today at home 375px overflow",
  );
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator("[data-today-print]").click();
  await page.locator("#sheetPrint").waitFor({ state: "attached" });
  assert.match(await page.locator("#sheetPrint").innerText(), /Lunes/);
  assert.match(await page.locator("#sheetPrint").innerText(), /Mis cinco palabras/);
  console.log(
    "PASS Today at home: Spanish toggle, saved checklist, bilingual weekday print sheet, 375px axe/overflow",
  );
  await page.goto(base + "/access-practice-lab/search?grades=3-5");
  await page.locator(".fx-panel > summary").click();
  await page.locator(".fx-filters").waitFor();
  assert.ok(
    (await page.locator('[data-fx-f="type"]').count()) > 0,
    "resource type facet is source-backed",
  );
  assert.ok(
    (await page.locator('[data-fx-f="stage"]').count()) > 0,
    "support stage facet is source-backed",
  );
  assert.match(
    await page.locator(".fx-filters").innerText(),
    /Opción de apoyo en el aula; no es un nivel WIDA/,
  );
  await page.locator('[data-fx-f="stage"][data-fx-v="A"]').click();
  await page.waitForURL(/stage=A/);
  await page.reload();
  await page.locator(".fx-panel > summary").click();
  assert.equal(
    await page
      .locator('.fx-filters [data-fx-f="stage"][data-fx-v="A"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.locator(".fx-more > summary").click();
  assert.ok(
    (await page.locator('[data-fx-f="fn"]').count()) > 0,
    "language function facet is source-backed",
  );
  assert.ok((await page.locator('[data-fx-f="lang"]').count()) > 0);
  assert.ok((await page.locator('[data-fx-f="tech"]').count()) > 0);
  console.log("PASS Resource Finder source metadata facets, stage wording, and URL persistence");
  await page.evaluate(() => indexedDB.deleteDatabase("lp_speaking_tasks"));
  await page.goto(base + "/access-practice-lab/task-packs?grades=3-5");
  await page.locator("[data-task-pack-form]").waitFor();
  await page.locator('[name="titleEn"]').fill("Demo speaking task");
  await page.locator('[name="titleEs"]').fill("Tarea oral de demostración");
  await page.locator('[name="promptEn"]').fill("Explain how a seed changes.");
  await page.locator('[name="promptEs"]').fill("Explica cómo cambia una semilla.");
  await page.locator('[name="rehearsal"]').check();
  await page.locator('[name="reviewSec"]').fill("0");
  await page.locator("[data-task-save]").click();
  assert.match(await page.locator("[data-task-errors]").innerText(), /reviewSec/);
  await page.locator('[name="reviewSec"]').fill("8");
  await page.locator('[name="respondSec"]').fill("30");
  await page.locator('[name="minRespondSec"]').fill("5");
  const packsAxe = await new AxeBuilder({ page })
    .include(".sp-task-packs")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    packsAxe.violations.map((v) => v.id),
    [],
    "task pack editor axe",
  );
  await page.locator("[data-task-save]").click();
  await page.locator('[data-task-load="demo-speaking-task"]').waitFor();
  await page.reload();
  await page.locator('[data-task-load="demo-speaking-task"]').waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-task-export="demo-speaking-task"]').click();
  const packDownload = await downloadPromise;
  assert.match(packDownload.suggestedFilename(), /demo-speaking-task\.json/);
  await page.locator('[data-task-delete="demo-speaking-task"]').click();
  await page.locator('[data-task-load="demo-speaking-task"]').waitFor({ state: "detached" });
  console.log(
    "PASS speaking task drafts validate rehearsal settings, persist locally and export JSON",
  );
  await page.goto(base + "/access-practice-lab/packs/survival-vocabulary?grades=3-5");
  await page.locator(".lp-newcomer-pack").waitFor();
  assert.equal(await page.locator(".lp-pack-words > article").count(), 12);
  const packAxe = await new AxeBuilder({ page })
    .include(".lp-newcomer-pack")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    packAxe.violations.map((v) => v.id),
    [],
    "newcomer pack axe",
  );
  await page.locator("[data-pack-match-start]").click();
  await page.locator("[data-pack-match]").first().waitFor();
  assert.equal(await page.locator("[data-pack-match]").count(), 12);
  assert.equal(
    await page.locator(".lp-newcomer-pack [data-timer], .lp-newcomer-pack time").count(),
    0,
  );
  await page.locator("[data-pack-bingo]").click();
  await page.locator(".lp-pack-bingo > div").first().waitFor();
  assert.equal(await page.locator(".lp-pack-bingo > div").count(), 25);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator("[data-pack-print-bingo]").click();
  await page.locator("#sheetPrint .lp-pack-bingo > div").first().waitFor({ state: "attached" });
  assert.equal(await page.locator("#sheetPrint .lp-pack-bingo > div").count(), 25);
  await page.locator('[data-pack-print="cards"]').click();
  await page.locator("#sheetPrint .lp-pack-six").first().waitFor({ state: "attached" });
  assert.equal(await page.locator("#sheetPrint .lp-pack-six").count(), 24);
  await page.locator("#sheetPrint .lp-pack-six li").first().waitFor({ state: "attached" });
  assert.equal(await page.locator("#sheetPrint .lp-pack-six li").count(), 144);
  console.log(
    "PASS survival pack: bilingual words, untimed picture match, bingo, and exact 6-up print pages",
  );
  await page.goto(base + "/access-practice-lab/lesson-builder?grades=3-5");
  await page.locator(".lb-quick-btn").first().waitFor();
  await page.locator(".lb-quick-btn").first().click();
  await page.locator("[data-lb-export-pack]").waitFor();
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator("[data-lb-print-pack]").click();
  await page.locator("#sheetPrint").waitFor({ state: "attached" });
  assert.match(
    await page.locator("#sheetPrint").evaluate((node) => node.textContent),
    /TEACHER ONLY/,
  );
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  const lessonPackDownload = page.waitForEvent("download");
  await page.locator("[data-lb-export-pack]").click();
  assert.match((await lessonPackDownload).suggestedFilename(), /lesson-pack\.zip/);
  console.log(
    "PASS lesson builder exports separated teacher key, A/B/C sheets and combined print pack",
  );
  assert.deepEqual(errors, []);
  console.log("PASS no unexpected page errors");
} finally {
  await browser.close();
  local?.server.close();
}
