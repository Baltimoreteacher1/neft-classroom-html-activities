// Browser verification, explicitly invoked; never starts on ordinary site builds.
// Usage: node tools/verify-learning-labs-browser.mjs [--full]

import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const full = process.argv.includes("--full");
const hubOnly = process.argv.includes("--hub-only");
const onlyLab = process.argv.find((arg) => arg.startsWith("--lab="))?.slice(6);
const selectedLabs = new Set(onlyLab ? onlyLab.split(",") : []);
const artifactDir = process.env.LAB_QA_OUTPUT || resolve(REPO_ROOT, "../lab-browser-qa");
mkdirSync(artifactDir, { recursive: true });
const catalog = JSON.parse(readFileSync(join(REPO_ROOT, "data/learning-labs.json"))).labs;
const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(REPO_ROOT, `.${path}`);
  if (!file.startsWith(resolve(REPO_ROOT) + "/")) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const report = {
  labs: 0,
  tabs: 0,
  levels: 0,
  answers: 0,
  puzzleRounds: 0,
  matchingGames: 0,
  accessibility: [],
  screenshots: [],
  errors: [],
};
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.error("Browser console:", message.text());
  });
  if (!hubOnly) {
    for (const [n, item] of catalog.entries()) {
      if (selectedLabs.size && !selectedLabs.has(item.id)) continue;
      const lab = JSON.parse(
        readFileSync(join(REPO_ROOT, "curriculum/learning-labs", item.id, "content.json")),
      );
      await page.goto(origin + item.href);
      try {
        await page.locator("#level").waitFor({ timeout: 8000 });
      } catch (error) {
        console.error("Failed page:", await page.locator("body").innerText());
        throw error;
      }
      for (const tab of ["brief", "learn", "investigate", "practice", "create", "games"]) {
        await page.locator(`#tab-${tab}`).click();
        await page.locator(`#panel-${tab}`).waitFor({ state: "visible" });
        report.tabs++;
        assert.ok(await page.locator(`#panel-${tab}`).innerText());
      }
      for (const level of ["support", "core", "stretch"]) {
        await page.selectOption("#level", level);
        report.levels++;
        await page.locator("#tab-practice").click();
        const bank = lab.practice[level];
        const selected = full
          ? bank
          : [
              bank[0],
              bank.find((q) => q.type === "number"),
              bank.find((q) => q.type === "repair"),
              bank.find((q) => q.type === "explain"),
            ].filter(Boolean);
        for (const q of selected) {
          await page.locator(`[data-question="${bank.indexOf(q)}"]`).click();
          if (q.type === "choice" || q.type === "repair")
            await page.locator(`.question input[value="${q.answer}"]`).check();
          else
            await page
              .locator('.question [name="answer"]')
              .fill(
                q.type === "number"
                  ? String(q.answer)
                  : "I compared the given quantities, used a model, and checked my reasoning with the lesson.",
              );
          await page.locator('.question button[type="submit"]').click();
          const feedback = await page.locator(".practice-feedback").innerText();
          assert.match(
            feedback,
            q.type === "explain" ? /saved/ : /That works/,
            `${item.id} ${q.id}: ${feedback}`,
          );
          report.answers++;
        }
      }
      for (const gameLevel of full ? ["support", "core", "stretch"] : ["core"]) {
        await page.selectOption("#level", gameLevel);
        await page.locator("#tab-games").click();
        for (let r = 0; r < 3; r++) {
          const p = puzzle(lab.model, r, ["support", "core", "stretch"].indexOf(gameLevel));
          if (lab.model.kind === "inequality") {
            // The default includes equality; choose an interior solution or counterexample.
            const threshold = p.start[0],
              pass = r % 2 === 0;
            const value =
              lab.model.mode === "entry"
                ? threshold + (pass ? 1 : -1)
                : threshold + (pass ? -1 : 1);
            await page.locator("#game-1").fill(String(value));
          } else await page.locator(`#game-${p.free}`).fill(String(p.goal[p.free]));
          await page.locator("[data-check]").click();
          assert.match(
            await page.locator(".game-feedback").innerText(),
            /Goal reached/,
            `${item.id} game round ${r}`,
          );
          await page.locator("[data-check]").click();
          report.puzzleRounds++;
        }
        assert.match(await page.locator(".game-win").innerText(), /complete/);
        await page.locator('[data-game="match"]').click();
        const first = await page.locator("[data-card]").count();
        assert.ok(first >= 8);
        const revealed = new Map();
        // Read each card through the UI, including the mismatch/retry path.
        for (let i = 0; i < first; i += 2) {
          for (const j of [i, i + 1]) {
            await page.locator(`[data-card="${j}"]`).click();
            revealed.set(await page.locator(`[data-card="${j}"] span`).last().innerText(), j);
          }
          if (await page.locator("[data-clear]").isVisible())
            await page.locator("[data-clear]").click();
        }
        for (const v of lab.vocabulary.slice(0, gameLevel === "stretch" ? 6 : 4)) {
          const a = revealed.get(v.term),
            b = revealed.get(v.definition);
          assert.notEqual(a, undefined);
          assert.notEqual(b, undefined);
          if (await page.locator(`[data-card="${a}"]`).isDisabled()) continue;
          await page.locator(`[data-card="${a}"]`).click();
          await page.locator(`[data-card="${b}"]`).click();
        }
        assert.match(await page.locator(".match-status").innerText(), /All \d+ connections found/);
        report.matchingGames++;
      }
      report.labs++;
      if (n % 10 === 0)
        console.log(
          `Browser sweep: ${report.labs}/${catalog.length} labs, ${report.answers} answers checked.`,
        );
    }
    // Keyboard tabs, resume, wrong-answer feedback, storage errors, export, print.
    await page.goto(origin + "/curriculum/learning-labs/recipe-remix/");
    await page.locator("#level").waitFor();
    await page.locator("#tab-brief").click();
    await page.locator("#tab-brief").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#tab-learn").getAttribute("aria-selected"), "true");
    await page.locator("#tab-create").click();
    await page
      .locator("#creation")
      .fill("QA sample: 3 parts juice to 2 parts water; 6 and 4 make an equivalent ratio.");
    await page.reload();
    await page.locator("#creation").waitFor();
    assert.match(await page.locator("#creation").inputValue(), /QA sample/);
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download").click();
    const file = await downloadPromise;
    assert.match(file.suggestedFilename(), /my-work.txt/);
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    assert.match(await page.locator("#print-report").textContent(), /QA sample/);
    await page.locator("#tab-investigate").click();
    await page.locator("#model-0").fill("");
    assert.match(await page.locator(".model-error").innerText(), /Use/);
    await page.locator("#model-1").fill("4");
    assert.match(await page.locator(".model-error").innerText(), /Use/);
    await page.locator("[data-reset]").click();
    await page.locator("#tab-practice").click();
    const recipe = JSON.parse(
      readFileSync(join(REPO_ROOT, "curriculum/learning-labs/recipe-remix/content.json")),
    );
    const numeric = recipe.practice.core.find((q) => q.type === "number");
    await page.locator(`[data-question="${recipe.practice.core.indexOf(numeric)}"]`).click();
    await page.locator('.question [name="answer"]').fill("99999");
    await page.locator('.question button[type="submit"]').click();
    assert.match(await page.locator(".practice-feedback").innerText(), /another look/);
    await page.goto(origin + "/curriculum/learning-labs/wrap-lab/#investigate");
    await page.locator('[data-shape="pyramid"]').click();
    await page.locator("#model-0").fill("6");
    await page.locator("#model-2").fill("5");
    assert.match(await page.locator(".model-readout").innerText(), /96 square units/);
    await page.locator("#model-2").fill("2");
    assert.match(await page.locator(".model-readout").innerText(), /do not form/);
    const offlineSave = await context.newPage();
    await offlineSave.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new Error("Storage unavailable in this test");
      };
    });
    await offlineSave.goto(origin + "/curriculum/learning-labs/recipe-remix/");
    await offlineSave.locator("#level").waitFor();
    assert.match(await offlineSave.locator("#save-status").innerText(), /unavailable/);
    await offlineSave.locator("#tab-create").click();
    await offlineSave.locator("#creation").fill("Work remains usable without browser storage.");
    await offlineSave.locator("#tab-brief").click();
    await offlineSave.locator("#tab-create").click();
    assert.match(await offlineSave.locator("#creation").inputValue(), /remains usable/);
    await offlineSave.close();
    // Screenshots and accessibility checks across different workspaces and sizes.
    for (const [slug, width, height, tab] of [
      ["recipe-remix", 1365, 900, "investigate"],
      ["middle-ground", 1024, 768, "investigate"],
      ["packaging-workshop", 1365, 900, "investigate"],
      ["coordinate-couriers", 390, 844, "investigate"],
      ["balance-bureau", 390, 844, "practice"],
      ["hundred-square-studio", 1365, 900, "games"],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${origin}/curriculum/learning-labs/${slug}/#${tab}`);
      await page.reload();
      await page.locator("#level").waitFor();
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${slug} horizontal overflow`,
      );
      const filename = `${slug}-${width}-${tab}.png`;
      await page.screenshot({ path: join(artifactDir, filename), fullPage: true });
      if (tab === "investigate")
        await page
          .locator(".model-workspace")
          .screenshot({ path: join(artifactDir, `${slug}-${width}-model.png`) });
      report.screenshots.push(filename);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.accessibility.push({
        slug,
        width,
        violations: result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          summary: v.nodes[0]?.failureSummary,
        })),
      });
    }
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.goto(`${origin}/curriculum/learning-labs/`);
    assert.equal(await page.locator(".lab-card").count(), catalog.length);
    await page.screenshot({ path: join(artifactDir, "catalog.png"), fullPage: false });
    assert.deepEqual(report.errors, [], "New lab pages must have no runtime errors");
    assert.ok(
      report.accessibility.every((r) => r.violations.length === 0),
      JSON.stringify(report.accessibility),
    );
  }
  if (hubOnly || !process.argv.includes("--labs-only")) {
    const hub = await context.newPage();
    await hub.goto(origin + "/curriculum/units/");
    await hub.locator(".unit-card").first().waitFor();
    report.curriculumLinks = 0;
    for (const item of catalog)
      for (const lesson of item.lessons) {
        const card = hub.locator(".unit-card").nth(item.unit - 1);
        const options = await card
          .locator(".lesson-select option")
          .evaluateAll((nodes) => nodes.map((el) => ({ value: el.value, text: el.textContent })));
        const option = options.find((o) => new RegExp(`\\b${lesson}\\b`).test(o.text));
        assert.ok(
          option,
          `Lesson ${lesson} must appear in its unit selector: ${JSON.stringify(options)}`,
        );
        await card.locator(".lesson-select").selectOption(option.value);
        await card.locator(`.lesson-outline a[href="${item.href}"]`).waitFor();
        assert.match(
          await card.locator(".lesson-outline").innerText(),
          /Interactive Learning Labs/i,
        );
        report.curriculumLinks++;
      }
    await hub.locator('[data-filter="learninglabs"]').click();
    assert.equal(
      await hub.locator('[data-filter="learninglabs"]').getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(await hub.locator(".unit-card").count(), 10);
    await hub.screenshot({
      path: join(artifactDir, "curriculum-learning-labs.png"),
      fullPage: false,
    });
    await hub.close();
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  writeFileSync(
    join(
      artifactDir,
      hubOnly
        ? "hub-report.json"
        : selectedLabs.size > 1
          ? "selected-labs-report.json"
          : onlyLab
            ? `${onlyLab}-report.json`
            : "report.json",
    ),
    JSON.stringify(report, null, 2),
  );
  await browser?.close();
  await new Promise((r) => server.close(r));
}
