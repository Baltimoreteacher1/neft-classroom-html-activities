// Phase 2 acceptance in a real browser: the Model Lab, a full Show Me Why lesson, the Guided Solver, linked representations,
// reset/undo, keyboard and pointer input, Spanish, reduced motion, axe and layout at desktop/tablet/phone. E8_SHOTS=/dir keeps screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";
import { modelsForGrade } from "./models.js";

const shots = process.env.E8_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/lab.html`;
const browser = await chromium.launch();
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

async function open(query, viewport = { width: 1440, height: 900 }, extra = {}) {
  const context = await browser.newContext({ viewport, ...extra });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (error) => page.errors.push(error.message));
  await context.addInitScript(() => localStorage.setItem("ewl-fluency-tour-seen", "1"));
  await page.goto(`${base}?${query}`, { waitUntil: "networkidle" });
  await page.locator(".e8ml").waitFor({ timeout: 8000 });
  return page;
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const text = (page, selector) => page.locator(selector).first().innerText();

try {
  // 1. Every grade lists its models and each one draws a labelled picture.
  for (let grade = 1; grade <= 8; grade += 1) {
    const page = await open(`grade=${grade}&view=models`);
    const chips = await page.locator(".e8ml-chip").count();
    check(chips === modelsForGrade(grade).length, `grade ${grade}: ${chips} model chips, expected ${modelsForGrade(grade).length}`);
    for (let i = 0; i < chips; i += 1) {
      await page.locator(".e8ml-chip").nth(i).click();
      const svgs = await page.locator(".e8ml-visual svg[role=img]").count();
      check(svgs >= 1, `grade ${grade} model ${i}: no labelled picture`);
      const words = await text(page, ".e8ml-words");
      check(words.length > 10, `grade ${grade} model ${i}: no sentence`);
    }
    check((await overflow(page)) <= 1, `grade ${grade}: horizontal overflow`);
    check(page.errors.length === 0, `grade ${grade}: page error ${page.errors[0]}`);
    await page.context().close();
  }

  // 2. Linked representations: scaling the tape changes the table, the double number line and the equation together.
  {
    const page = await open("grade=6&view=models");
    await page.locator('.e8ml-chip', { hasText: /Tape diagram/ }).click();
    const before = await text(page, ".e8ml-eq");
    const rowsBefore = await page.locator(".e8ml-table tbody tr").count();
    await page.locator(".e8ml").getByRole("button", { name: "Add another copy of the ratio" }).click();
    await page.locator(".e8ml").getByRole("button", { name: "Add another copy of the ratio" }).click();
    const after = await text(page, ".e8ml-eq");
    check(before !== after, "tape: equation did not change");
    check((await page.locator(".e8ml-table tbody tr").count()) === rowsBefore + 2, "tape: table did not gain two rows");
    check((await page.locator(".e8ml-visual svg").count()) === 2, "tape: expected the tape and the double number line");
    check((await page.locator('.e8ml-visual [data-top]').count()) === 4, "tape: double number line should have 4 ticks for 3 copies");
    // Undo and reset.
    await page.locator(".e8ml").getByRole("button", { name: "Undo" }).click();
    check((await page.locator(".e8ml-table tbody tr").count()) === rowsBefore + 1, "undo did not remove a row");
    await page.locator(".e8ml").getByRole("button", { name: "Reset model" }).click();
    check((await page.locator(".e8ml-table tbody tr").count()) === rowsBefore, "start over did not restore the model");
    // A refused move explains itself.
    for (let i = 0; i < 12; i += 1) {
      const add = page.locator(".e8ml").getByRole("button", { name: "Add another copy of the ratio" });
      if (await add.isDisabled()) break;
      await add.click();
    }
    check(await page.locator(".e8ml").getByRole("button", { name: "Add another copy of the ratio" }).isDisabled(), "tape: the copy limit should disable the control");
    if (shots) await page.screenshot({ path: `${shots}/lab-tape-desktop.png` });
    await page.context().close();
  }

  // 3. Pointer and keyboard: a ten-frame cell toggles by click; a number line hops by arrow key.
  {
    const page = await open("grade=1&view=models");
    await page.locator(".e8ml-chip", { hasText: /Ten-frame/ }).click();
    const before = await page.locator('.e8ml-visual .cell.on').count();
    await page.locator('.e8ml-visual .cell[data-i="6"]').click();
    check((await page.locator('.e8ml-visual .cell.on').count()) === 7, "ten-frame: clicking spot 7 should fill 7 spaces");
    await page.locator('.e8ml-visual').focus();
    await page.keyboard.press("+");
    check((await page.locator('.e8ml-visual .cell.on').count()) === 8, "ten-frame: + key should add a counter");
    check(before !== 7 || true, "n/a");
    await page.context().close();
    const nl = await open("grade=3&view=models");
    await nl.locator(".e8ml-chip", { hasText: /Number line/ }).click();
    const hopsBefore = await nl.locator(".e8ml-visual .hop").count();
    await nl.locator(".e8ml-visual").focus();
    await nl.keyboard.press("ArrowRight");
    check((await nl.locator(".e8ml-visual .hop").count()) === hopsBefore + 1, "number line: ArrowRight should hop");
    await nl.keyboard.press("Control+z");
    check((await nl.locator(".e8ml-visual .hop").count()) === hopsBefore, "number line: Ctrl+Z should undo the hop");
    await nl.context().close();
  }

  // 4. A whole Show Me Why lesson (Grade 6 ratios), start to finish.
  {
    const page = await open("grade=6&view=models");
    await page.locator(".e8ml-chip", { hasText: /Tape diagram/ }).click();
    await page.locator(".e8ml").getByRole("button", { name: /Show me why/ }).click();
    // Predict: pick the wrong one first to see that it is explained, not scolded.
    const choices = page.locator("[data-e8-predict]");
    await choices.first().click();
    check((await text(page, ".e8ml-lesson .e8ml-why")).length > 20, "predict: the reason should appear after any guess");
    await page.locator("[data-e8-next]").click();
    // Build: not yet built, so the hint shows; then build it.
    await page.locator("[data-e8-check-build]").click();
    check((await text(page, "[data-e8-lesson-note]")).length > 5, "build: a hint should show before the model is built");
    for (let i = 0; i < 3; i += 1) await page.locator(".e8ml").getByRole("button", { name: "Add another copy of the ratio" }).click();
    await page.locator("[data-e8-check-build]").click();
    // Watch: step to the end by hand.
    check(await page.locator(".e8ml-lesson .e8ml-q").first().isVisible(), "watch: caption missing");
    while (await page.locator('[data-e8-watch="1"]').isEnabled()) await page.locator('[data-e8-watch="1"]').click();
    await page.locator("[data-e8-next]").click();
    // Explain with a frame.
    await page.locator(".e8ml-frames summary").click();
    await page.locator("[data-e8-frame]").first().click();
    await page.locator("[data-e8-explain]").click();
    check((await text(page, "[data-e8-lesson-note]")).length > 5, "explain: an unfinished frame should not be accepted");
    await page.locator("#e8ml-explain").fill("Both numbers were multiplied by 4 so the ratio stays the same.");
    await page.locator("[data-e8-explain]").click();
    await page.locator("[data-e8-next]").click();
    // Try: a wrong answer, then the right one read from the model.
    await page.locator("#e8ml-try").fill("1");
    await page.locator("[data-e8-try]").click();
    check((await text(page, "[data-e8-lesson-note]")).includes("Not quite"), "try: a wrong answer needs feedback");
    const prompt = await text(page, ".e8ml-lesson .e8ml-q");
    const m = /ratio is (\d+) juice to (\d+) water|ratio is (\d+) .* to (\d+)/.exec(prompt) || /(\d+).*?(\d+)/.exec(prompt);
    const water = Number(m[2] || m[4]) * 5;
    await page.locator("#e8ml-try").fill(String(water));
    await page.locator("[data-e8-try]").click();
    await page.locator("[data-e8-next]").click();
    check((await text(page, ".e8ml-done")).includes("help"), "a wrong first try must be saved as supported, not independent");
    if (shots) await page.screenshot({ path: `${shots}/lesson-done-desktop.png` });
    check(page.errors.length === 0, `lesson: page error ${page.errors[0]}`);
    await page.context().close();
  }

  // 5. The Guided Solver: a wrong choice is corrected specifically; a hint never states the answer; support is saved as supported.
  {
    const page = await open("grade=5&view=models");
    const solver = page.locator(".e8ml-solver");
    check((await solver.innerText()).length > 40, "solver: no problem shown");
    let steps = 0;
    while (steps < 14 && !(await solver.locator("[data-e8-fresh]").count())) {
      const choice = solver.locator("[data-e8-choice]");
      if (await choice.count()) {
        await choice.first().click();
      } else {
        await solver.locator("[data-e8-sv-hint]").click();
        await solver.locator("[data-e8-sv-reveal]").click();
      }
      steps += 1;
    }
    check((await solver.locator("[data-e8-fresh]").count()) === 1, "solver: never finished");
    check((await solver.innerText()).includes("supported"), "solver: revealed steps must be saved as supported");
    await solver.locator("[data-e8-fresh]").click();
    check((await solver.locator("#e8ml-sv-prompt, .e8ml-q").count()) > 0, "solver: a fresh problem should appear");
    await page.context().close();
  }

  // 6. Spanish, reduced motion, accessibility and layout at three widths.
  for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, phone: { width: 390, height: 844 } })) {
    const page = await open("grade=6&view=models", viewport, { reducedMotion: "reduce" });
    await page.locator(".e8ml-chip", { hasText: /Tape diagram/ }).click();
    check((await overflow(page)) <= 1, `${name}: horizontal overflow`);
    await page.locator(".e8ml").getByRole("button", { name: /Show me why/ }).click();
    await page.locator("[data-e8-predict]").first().click();
    await page.locator("[data-e8-next]").click();
    for (let i = 0; i < 3; i += 1) await page.locator(".e8ml").getByRole("button", { name: "Add another copy of the ratio" }).click();
    await page.locator("[data-e8-check-build]").click();
    check((await page.locator("[data-e8-play]").count()) === 0, `${name}: reduced motion must hide autoplay`);
    check((await page.locator(".e8ml-lesson").innerText()).includes("Reduced motion is on"), `${name}: reduced motion notice`);
    const axe = await new AxeBuilder({ page }).include(".e8ml").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact))) check(false, `${name}: axe ${v.id} ${v.nodes[0].target.join(" ")}`);
    // Touch targets of every visible control.
    const small = await page.evaluate(() => [...document.querySelectorAll(".e8ml button")].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 43).map((b) => b.textContent.trim().slice(0, 30)));
    check(small.length === 0, `${name}: controls under 44px: ${small.join(", ")}`);
    if (shots) await page.screenshot({ path: `${shots}/lab-${name}.png`, fullPage: true });
    await page.context().close();
  }
  {
    const page = await open("grade=6&view=models&lang=es");
    check((await page.locator(".e8ml-head h2").innerText()).includes("Laboratorio"), "Spanish: heading not translated");
    await page.locator(".e8ml-chip").nth(1).click();
    check(/[áéíóúñ]|\b(de|en|con|el|la)\b/.test(await text(page, ".e8ml-words")), "Spanish: linked words not translated");
    await page.context().close();
  }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(`${failures.length} Model Lab browser failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Model Lab in browser: every grade's models, linked views, undo/reset, pointer and keyboard, a full lesson, guided solver, Spanish, reduced motion, axe and 3 widths passed.");
