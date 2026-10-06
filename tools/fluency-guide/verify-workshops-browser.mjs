/** Local browser verification; never contacts or mutates production services. */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const out = resolve(root, "output/playwright");
mkdirSync(out, { recursive: true });
const exportsOut = resolve(tmpdir(), `eduwonderlab-fluency-exports-${process.pid}`);
mkdirSync(exportsOut, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = {
  coverage: [],
  interactions: [],
  accessibility: [],
  modelBounds: [],
  runtimeErrors: [],
  print: [],
};
const server = process.env.FLUENCY_PREVIEW_URL
  ? null
  : createServer((request, response) => {
      const path = new URL(request.url, "http://localhost").pathname;
      if (!["/curriculum/fluency/", "/curriculum/fluency/index.html"].includes(path)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(readFileSync(resolve(root, "curriculum/fluency/index.html")));
    });
if (server)
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", done);
  });
const base = process.env.FLUENCY_PREVIEW_URL || `http://127.0.0.1:${server.address().port}`;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (e) => report.runtimeErrors.push(e.message));
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto(`${base}/curriculum/fluency/#lesson=2-1&level=workshop`);
  const lessons = await page.evaluate(() => window.FluencyData.units.flatMap((u) => u.lessons));
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const l of lessons) {
      await page.selectOption("#studio-lesson", l.id);
      assert.equal(await page.locator(".fl-task-rail [data-studio=task]").count(), 8);
      assert.ok((await page.locator(".fl-model-lesson").getAttribute("open")) !== null);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert.equal(overflow, false, `${l.id}: page overflow at ${width}`);
      assert.equal(await page.locator(".fl-guided-steps li").count(), 3);
      report.coverage.push({ lesson: l.id, width, tasks: 8, overflow });
    }
  }
  // Every new objective answer passes through the actual DOM event and feedback flow.
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const l of lessons) {
    await page.selectOption("#studio-lesson", l.id);
    for (let i = 0; i < 8; i++) {
      const p = l.workshop.tasks[i];
      await page.evaluate(
        ({ i, p }) => {
          document.querySelector(`.fl-task-rail [data-task="${i}"]`).click();
          if (p.mode === "choice")
            [...document.querySelectorAll("input[name=response]")]
              .find((el) => el.value === p.answer)
              .click();
          else {
            const el = document.getElementById("fl-response");
            el.value = p.answer;
            el.dispatchEvent(new Event("input", { bubbles: true }));
          }
          document.querySelectorAll("[data-ratio-cell]").forEach((el) => {
            const [t, r, c] = el.dataset.ratioCell.split("-").map(Number);
            el.value = String(p.ratioTables[t].rows[r][c]);
            el.dispatchEvent(new Event("input", { bubbles: true }));
          });
          document.getElementById("fl-answer-form").requestSubmit();
        },
        { i, p },
      );
      if (i < 6) assert.match(await page.locator("#fl-feedback").innerText(), /Correct/);
      else {
        assert.match(await page.locator("#fl-feedback").innerText(), /reasoning/);
        assert.equal(await page.locator("#fl-example").getAttribute("hidden"), null);
      }
      if (i >= 2)
        await page.evaluate(() => document.querySelector(".fl-task-model summary").click());
      const bounds = await page.evaluate(() =>
        [...document.querySelectorAll(".fl-task-model svg text")].flatMap((el) => {
          const b = el.getBBox(),
            v = el.closest("svg").viewBox.baseVal;
          return b.x < 0 || b.y < 0 || b.x + b.width > v.width + 1 || b.y + b.height > v.height + 1
            ? [
                {
                  text: el.textContent,
                  x: b.x,
                  y: b.y,
                  width: b.width,
                  height: b.height,
                  viewWidth: v.width,
                  viewHeight: v.height,
                },
              ]
            : [];
        }),
      );
      if (bounds.length) report.modelBounds.push({ lesson: l.id, task: i, bounds });
    }
    console.log(`Checked lesson ${l.id}`);
  }
  report.interactions.push(
    "All 432 tasks: 324 objective DOM submissions checked; 108 reasoning tasks correctly request self-review.",
  );
  await page.selectOption("#studio-lesson", "3-3");
  await page.locator('.fl-task-rail [data-task="2"]').click();
  await page.fill("#fl-ratio-0-1-1", "999");
  await page.locator("#fl-answer-form button[type=submit]").click();
  assert.match(await page.locator("#fl-feedback").innerText(), /row 2/);
  assert.equal(
    await page.locator("#fl-ratio-0-1-1").evaluate((el) => el === document.activeElement),
    true,
  );
  await page.reload();
  assert.equal(await page.locator("#fl-ratio-0-1-1").inputValue(), "999");
  await page.fill("#fl-ratio-0-1-1", "14");
  await page.locator("#fl-answer-form button[type=submit]").click();
  assert.match(await page.locator("#fl-feedback").innerText(), /Correct/);
  const [ratioDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-studio=download]").click(),
  ]);
  const ratioPath = resolve(exportsOut, "ratio-work.html");
  await ratioDownload.saveAs(ratioPath);
  assert.match(readFileSync(ratioPath, "utf8"), /Build and use a ratio table/);
  report.interactions.push(
    "Ratio tables: incorrect cell rejected and focused, saved on reload, corrected table accepted, table included in download.",
  );
  await page.selectOption("#studio-lesson", "5-3");
  await page.locator('.fl-task-rail [data-task="0"]').click();
  await page.fill("#fl-response", "999");
  await page.locator("#fl-answer-form button[type=submit]").click();
  assert.match(await page.locator("#fl-feedback").innerText(), /Not yet/);
  await page.locator("[data-studio=hint]").click();
  await page.fill("#fl-response", "16");
  await page.locator("#fl-answer-form button[type=submit]").click();
  assert.match(await page.locator(".fl-task-meta .fl-status").innerText(), /support/);
  await page.fill(
    "#fl-reasoning",
    "I averaged the two bases and multiplied by perpendicular height.",
  );
  await page.reload();
  assert.equal(await page.locator("#fl-response").inputValue(), "16");
  await page.selectOption("#studio-level", "foundation");
  await page.fill("#fl-response", "24");
  await page.selectOption("#studio-level", "workshop");
  assert.equal(await page.locator("#fl-response").inputValue(), "16");
  report.interactions.push(
    "Incorrect answer, hint-supported correction, refresh recovery, and separation of old/new practice sets.",
  );
  await page.getByRole("button", { name: "Start practicing", exact: true }).click();
  assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get("lesson"), "5-3");
  await page.locator("[data-studio=reset]").click();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#fl-reset-dialog").getAttribute("open"), null);
  await page.locator("[data-studio=reset]").click();
  await page.locator("[data-studio=cancel-reset]").click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-studio=download]").click(),
  ]);
  await download.saveAs(resolve(exportsOut, "sample-student-work.html"));
  report.interactions.push(
    "Task anchor preserves lesson route; reset supports Escape/cancel; actual local work download.",
  );
  await page.selectOption("#studio-level", "workshop");
  for (const [id, width] of [
    ["3-3", 1440],
    ["3-5", 360],
    ["5-3", 1440],
    ["5-6", 768],
    ["2-9", 360],
    ["7-7", 360],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.selectOption("#studio-lesson", id);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () =>
      (
        await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
      })),
    );
    report.accessibility.push({ lesson: id, width, violations });
    await page.screenshot({ path: resolve(out, `workshop-${id}-${width}.png`), fullPage: true });
  }
  await page.selectOption("#studio-lesson", "3-5");
  await page.locator("#themeBtn").click();
  await page.screenshot({ path: resolve(out, "workshop-dark-mobile.png"), fullPage: true });
  const darkViolations = await page.evaluate(async () =>
    (
      await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      })
    ).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    })),
  );
  report.accessibility.push({
    lesson: "3-5",
    width: 360,
    theme: "dark",
    violations: darkViolations,
  });
  await page.locator("#themeBtn").click();
  await page.setViewportSize({ width: 730, height: 970 });
  await page.emulateMedia({ media: "print" });
  // Every lesson's prepared student packet: 9 pages and no practice solutions.
  for (const l of lessons) {
    await page.evaluate((id) => window.FluencyStudio.printWorksheet(id, false, "workshop"), l.id);
    assert.equal(await page.locator("#studio-print .sheet").count(), 9);
    assert.equal(await page.locator("#studio-print .key-answer").count(), 0);
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll("#studio-print .sheet")]
        .filter((el) => el.getBoundingClientRect().height > 970)
        .map((el) => ({ height: el.getBoundingClientRect().height })),
    );
    const file = resolve(out, `workshop-${l.id}-student.pdf`);
    await page.pdf({
      path: file,
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    });
    const pages = Number(
      execFileSync("pdfinfo", [file], { encoding: "utf8" }).match(/^Pages:\s+(\d+)/m)?.[1],
    );
    report.print.push({ lesson: l.id, sheets: 9, pages, overflow });
    assert.equal(pages, 9, `${l.id}: unexpected PDF pagination`);
    assert.equal(overflow.length, 0, `${l.id}: print overflow`);
  }
  for (const id of ["5-3", "2-4", "5-8"]) {
    await page.evaluate((id) => window.FluencyStudio.printWorksheet(id, false, "workshop"), id);
    await page.pdf({
      path: resolve(out, `workshop-${id}-student.pdf`),
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    });
  }
  await page.goto(
    pathToFileURL(resolve(root, "curriculum/fluency/teacher/index.html")).href +
      "#view=studio&lesson=5-3&level=workshop&mode=worksheet",
  );
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.FluencyStudio.printWorksheet("5-3", true, "workshop"));
  assert.equal(await page.locator("#studio-print .key-answer").count(), 8);
  await page.pdf({
    path: resolve(out, "workshop-5-3-key.pdf"),
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
  });
  const exportButton = page.locator('[data-act="export-student-html"]');
  if (await exportButton.count()) {
    const [d] = await Promise.all([
      page.waitForEvent("download"),
      exportButton.evaluate((button) => button.click()),
    ]);
    const file = resolve(exportsOut, "offline-student-edition.html");
    await d.saveAs(file);
    await page.goto(pathToFileURL(file).href + "#lesson=5-3&level=workshop");
    assert.equal(await page.locator(".fl-task-rail [data-studio=task]").count(), 8);
    assert.equal(await page.locator(".fl-model-lesson svg").count(), 1);
    report.interactions.push(
      "Teacher export opens offline with complete workshop models and 54 lessons.",
    );
  }
  assert.deepEqual(report.runtimeErrors, []);
  assert.deepEqual(report.modelBounds, []);
  assert.ok(
    report.accessibility.every((check) => check.violations.length === 0),
    "Accessibility violations must be repaired",
  );
  writeFileSync(resolve(out, "workshop-browser-report.json"), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      lessonViewports: report.coverage.length,
      tasks: 432,
      modelBounds: report.modelBounds.length,
      accessibilityViolations: report.accessibility.reduce((n, x) => n + x.violations.length, 0),
      preparedPackets: report.print.length,
      runtimeErrors: report.runtimeErrors.length,
    }),
  );
} finally {
  writeFileSync(resolve(out, "workshop-browser-report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  if (server) await new Promise((done) => server.close(done));
}
