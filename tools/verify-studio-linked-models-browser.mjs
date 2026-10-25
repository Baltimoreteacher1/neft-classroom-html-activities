// Browser check for linked ratio representations and area-preserving parallelogram shear.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(REPO_ROOT, `.${path}`);
  if (!file.startsWith(`${resolve(REPO_ROOT)}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
  if (!existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let checks = 0;
const screenshotDir = process.env.STUDIO_MODEL_SCREENSHOTS;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });

async function openActivity(page, lesson, mode, kind) {
  await page.goto(
    `${origin}/math/practice-studio/${lesson}/${mode === "challenge" ? "challenge/" : ""}`,
  );
  await page.waitForFunction(() => Boolean(window.StudioRT?.api));
  const found = await page.evaluate((wanted) => {
    const api = window.StudioRT.api;
    for (let t = 1; t <= api.sections.length; t++) {
      const i = api.sections[t - 1].items.findIndex(
        (item) => item.k === "act" && item.kind === wanted,
      );
      if (i >= 0) {
        api.state.idx[t] = i;
        api.selectTab(t);
        api.render(t);
        return { tab: t, index: i };
      }
    }
    return null;
  }, kind);
  assert.ok(found, `${lesson} ${mode} has ${kind}`);
  return found;
}

try {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 360, height: 740 },
  ]) {
    for (const mode of ["practice", "challenge"]) {
      const context = await browser.newContext({ viewport, hasTouch: viewport.width === 360 });
      const page = await context.newPage();
      await openActivity(page, "3-3", mode, "ratiomix");
      const add = page.getByRole("button", { name: /add a batch/i }).first();
      await add.click();
      const first = await page.locator(".rm-linked").first().getAttribute("aria-label");
      assert.ok(
        first?.includes("(2,") || first?.includes("(3,") || first?.includes("(4,"),
        "ratio diagram reflects batch count",
      );
      await add.click();
      const second = await page.locator(".rm-linked").first().getAttribute("aria-label");
      assert.notEqual(second, first, "ratio diagrams redraw when the same batch count changes");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
        "ratio activity has no horizontal overflow",
      );
      checks += 3;
      if (screenshotDir)
        await page
          .locator(".rm-linked")
          .first()
          .screenshot({ path: join(screenshotDir, `ratio-${mode}-${viewport.width}.png`) });

      await openActivity(page, "5-1", mode, "sizer");
      const areaBefore = await page.locator(".sz-res b").first().textContent();
      const figureBefore = await page
        .locator(".sz-fig polygon.sz-sh")
        .first()
        .getAttribute("points");
      const shear = page.getByRole("slider", { name: /top-edge shift/i });
      await shear.fill("2");
      const areaAfter = await page.locator(".sz-res b").first().textContent();
      const figureAfter = await page
        .locator(".sz-fig polygon.sz-sh")
        .first()
        .getAttribute("points");
      assert.equal(areaAfter, areaBefore, "shearing preserves base-times-height area");
      assert.notEqual(figureAfter, figureBefore, "shearing changes the figure");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
        "geometry activity has no horizontal overflow",
      );
      checks += 3;
      if (screenshotDir)
        await page
          .locator(".sz-main")
          .first()
          .screenshot({ path: join(screenshotDir, `geometry-${mode}-${viewport.width}.png`) });
      await context.close();
    }
  }
  console.log(
    `studio linked models browser: ${checks} checks across both modes and two viewport sizes passed.`,
  );
} finally {
  await browser.close();
  server.close();
}
