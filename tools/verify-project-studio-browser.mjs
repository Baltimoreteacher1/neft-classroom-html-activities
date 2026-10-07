#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { model } from "../curriculum/projects/studio/math.mjs";
import { getProject, PROJECTS, studioURL } from "../curriculum/projects/studio/projects.mjs";

const root = path.resolve(process.env.STUDIO_ROOT || ".");
let server;
let base = process.env.STUDIO_BASE_URL;
if (!base) {
  server = createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      let file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep)) throw Error("Path");
      try {
        await stat(file);
      } catch {
        file = path.resolve(root, "public", "." + pathname);
        if (!file.startsWith(path.join(root, "public") + path.sep)) throw Error("Path");
      }
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const mime = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".png": "image/png",
      };
      res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
      res.end(await readFile(file));
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}
const browser = await chromium.launch({ headless: true });
async function newPage(options = {}) {
  const context = await browser.newContext(options);
  return context.newPage();
}
const errors = [];
const failures = [];
let a11yScans = 0;
await mkdir("output/playwright/project-studio", { recursive: true });
async function audit(page, label) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  a11yScans++;
  assert.deepEqual(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    [],
    label,
  );
  if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))) {
    console.log(
      await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => [e.tagName, e.className, e.getBoundingClientRect().right])
          .slice(0, 15),
      })),
    );
    await page.screenshot({ path: "output/playwright/project-studio/overflow.png" });
    throw Error(`Overflow: ${label}`);
  }
}
async function stage(page, n) {
  await page.locator(`[data-stage="${n}"]`).first().click();
  const heading = await page.locator("#stage-heading").boundingBox();
  const rail = await page.locator(".journey").boundingBox();
  assert.ok(heading.y >= rail.y + rail.height - 1, "Focused heading is clear of sticky navigation");
}
async function checkAll(page, project, design) {
  await stage(page, 2);
  for (const q of model(project, design).checks) {
    await page.locator(`[data-answer="${q.id}"]`).fill(String(Number(q.answer.toFixed(2))));
    await page.locator(`[data-check="${q.id}"] button`).click();
    assert.match(await page.locator(`#feedback-${q.id}`).innerText(), /Matches this design/);
  }
  assert.match(await page.locator(".checkpoint-meter").innerText(), /6 of 6/);
}
try {
  for (const project of PROJECTS) {
    const page = await newPage({ viewport: { width: 1366, height: 900 } });
    page.on("pageerror", (e) => errors.push(`${project.id}: ${e.message}`));
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(base)) failures.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(base + studioURL(project.id));
    await page.locator("#stage-heading").waitFor();
    assert.equal(await page.locator("h1").innerText(), project.title);
    await audit(page, `${project.id} choose`);
    await stage(page, 1);
    await page.locator("#design-form button").click();
    await page.locator(".model svg").waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await audit(page, `${project.id} build mobile`);
    await stage(page, 2);
    await page.locator("[data-answer]").first().fill("999999");
    await page.locator("[data-check] button").first().click();
    assert.match(await page.locator(".feedback").first().innerText(), /Not yet/);
    await checkAll(page, project, project.defaults);
    await page.reload();
    await page.locator(".checkpoint-meter").waitFor();
    assert.match(await page.locator(".checkpoint-meter").innerText(), /6 of 6/);
    await stage(page, 3);
    await page.locator("[data-action=baseline]").click();
    assert.match(await page.locator("#stage-panel").innerText(), /first design is saved/);
    await stage(page, 4);
    await audit(page, `${project.id} publish mobile`);
    await page.close();
    console.log(
      `PASS ${project.id}: launch, 390px reflow, a11y, retry, 6 checks, reload, baseline, publish`,
    );
  }
  const page = await newPage({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  page.on("pageerror", (e) => errors.push(e.message));
  const p = getProject("unit-3-a");
  await page.goto(base + studioURL(p.id));
  await page.locator("[name=context]").first().check();
  await page
    .locator("#vision")
    .fill("Serve a fictional club with a consistent recipe and compare cost per unit.");
  await page.locator("[data-action=supports]").click();
  await stage(page, 1);
  await page.locator("#design-form button").click();
  await page.screenshot({ path: "output/playwright/project-studio/desktop-build.png" });
  await checkAll(page, p, p.defaults);
  for (let i = 0; i < 3; i++)
    await page
      .locator(`#evidence-${i}`)
      .fill(
        `Evidence ${i + 1}: my labeled ratio model uses the same scale factor for both quantities.`,
      );
  await stage(page, 3);
  await page.locator("[data-action=baseline]").click();
  await page.locator("[data-action=build]").click();
  await page.locator("[data-design=c]").fill("7");
  await page.locator("#design-form button").click();
  await stage(page, 2);
  assert.match(await page.locator(".checkpoint-meter").innerText(), /0 of 6/);
  await checkAll(page, p, { ...p.defaults, c: 7 });
  await stage(page, 3);
  await page
    .locator("#critique")
    .fill("Does the ratio remain equivalent when I change the batch size?");
  await page
    .locator("#revision")
    .fill(
      "The scale factor changed from 6 to 7. A changed from 18 to 21, and B from 12 to 14. The ratio stays 3:2.",
    );
  await stage(page, 4);
  await page
    .locator("#claim")
    .fill(
      "Choose this recipe because both parts scale together. Offer B costs less per unit. This model ignores ingredient quality.",
    );
  for (const el of await page.locator("[data-review]").all()) await el.check();
  assert.match(await page.locator("#readiness").innerText(), /Ready for teacher review/);
  let [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-action=report]").click(),
  ]);
  let report = await readFile(await download.path(), "utf8");
  assert.match(report, /READY FOR HUMAN REVIEW/);
  assert.match(report, /scale factor changed from 6 to 7/);
  assert.ok(!report.includes("[not yet"));
  [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-action=backup]").first().click(),
  ]);
  const backup = JSON.parse(await readFile(await download.path(), "utf8"));
  assert.equal(backup.design.c, "7");
  await page.locator("#claim").fill("Temporary changed text");
  await page.locator("#import-file").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: "Replace with this backup" }).click();
  assert.match(await page.locator("#claim").inputValue(), /Choose this recipe/);
  await page.locator("#import-file").setInputFiles({
    name: "wrong.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...backup, projectId: "unit-4-a" })),
  });
  await page.waitForFunction(() =>
    document.querySelector("#file-status").textContent.includes("different project"),
  );
  assert.match(await page.locator("#file-status").innerText(), /different project/);
  assert.match(await page.locator("#claim").inputValue(), /Choose this recipe/);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator("[data-action=print]").click();
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator("#print-report").isVisible(), true);
  assert.equal(await page.locator(".site-header").isVisible(), false);
  await page.pdf({ path: "output/playwright/project-studio/math-defense.pdf", format: "Letter" });
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 720, height: 900 });
  await stage(page, 1);
  await audit(page, "200% equivalent viewport");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/playwright/project-studio/mobile-build.png" });
  await page.locator('[data-stage="2"]').first().focus();
  await page.keyboard.press("Enter");
  assert.match(await page.locator("#stage-heading").innerText(), /Test it/);
  await page.locator("[data-answer]").first().focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator("[data-check] button")
      .first()
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator("[data-answer]").first().fill("<img src=x onerror=alert(1)>");
  await page.locator("[data-check] button").first().click();
  assert.match(await page.locator(".feedback").first().innerText(), /Not yet/);
  assert.equal(await page.locator("img[src=x]").count(), 0);
  await page.close();
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw Error("Storage blocked");
    };
  });
  const bp = await blocked.newPage();
  await bp.goto(base + studioURL("unit-4-a"));
  await bp.locator("#vision").fill("My draft still works");
  assert.match(await bp.locator("#save-status").innerText(), /unavailable/);
  [download] = await Promise.all([
    bp.waitForEvent("download"),
    bp.locator("[data-action=backup]").first().click(),
  ]);
  assert.match(await readFile(await download.path(), "utf8"), /My draft still works/);
  await blocked.close();
  const corrupt = await newPage();
  await corrupt.goto(base + studioURL("unit-4-a"));
  await corrupt.evaluate(() => localStorage.setItem("ewl-project-studio:v1:unit-4-a", "{bad"));
  await corrupt.reload();
  await corrupt.locator("#stage-heading").waitFor();
  assert.match(await corrupt.locator("main").innerText(), /could not be read/);
  await corrupt.close();
  const gallery = await newPage({ viewport: { width: 390, height: 844 } });
  for (const route of ["/curriculum/projects/", "/math/projects/"]) {
    await gallery.goto(base + route);
    await gallery.locator(".mission-card").first().waitFor();
    assert.equal(await gallery.locator(".mission-card").count(), 30);
    await gallery.locator("#unit-filter").selectOption("5");
    assert.equal(await gallery.locator(".mission-card").count(), 6);
    await gallery.locator("#search").fill("nonexistent");
    assert.equal(await gallery.locator(".mission-card").count(), 0);
    await audit(gallery, route + " filtered mobile");
  }
  await gallery.goto(base + "/curriculum/projects/studio/?project=missing");
  assert.match(await gallery.locator("h1").innerText(), /Choose an available/);
  await gallery.close();
  assert.deepEqual(errors, [], "Browser errors");
  assert.deepEqual(failures, [], "Broken same-origin resources");
  console.log(
    `PASS: 30 missions, 180 browser answer checks, ${a11yScans} WCAG A/AA scans; complete revision/report flow, backup restore, wrong-project import protection, blocked/corrupt storage, keyboard, print and search.`,
  );
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
