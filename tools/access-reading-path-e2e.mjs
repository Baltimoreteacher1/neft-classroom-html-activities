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
        assert.equal(await page.locator(".rp-page a.btn").count(), unit.items.length);
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
  await page.goto(base + "/access-teacher/");
  await page.locator("[data-teacher-role]").waitFor();
  const initial = await page
    .locator(".tc-action-card")
    .evaluateAll((nodes) => nodes.map((n) => n.dataset.tcAction));
  await page.locator("[data-teacher-role]").selectOption("coach");
  await page.waitForFunction(
    () => document.querySelector(".tc-action-card")?.dataset.tcAction === "create",
  );
  const changed = await page
    .locator(".tc-action-card")
    .evaluateAll((nodes) => nodes.map((n) => n.dataset.tcAction));
  assert.deepEqual(changed.slice(0, 3), ["create", "plan", "find"]);
  assert.deepEqual(changed.slice(3), initial.slice(3));
  await page.reload();
  await page.locator("[data-teacher-role]").waitFor();
  assert.equal(await page.locator("[data-teacher-role]").inputValue(), "coach");
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
  assert.deepEqual(errors, []);
  console.log("PASS no unexpected page errors");
} finally {
  await browser.close();
  local?.server.close();
}
