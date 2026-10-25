import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(root, `.${path}`);
  if (!file.startsWith(`${root}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = join(root, "public", path);
  if (!existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end();
  res.writeHead(200, {
    "Content-Type": mime[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
  const slugs = ["percent", "4-2", "4-3", "4-4", "4-5"];
  for (const slug of slugs)
    for (const mode of ["", "-challenging"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const suffix =
        slug === "percent" ? `percent-practice-studio${mode}` : `${slug}-practice-studio${mode}`;
      await page.goto(`http://127.0.0.1:${server.address().port}/math/unit-4/${suffix}/`, {
        waitUntil: "load",
      });
      await page.locator("#tab-4").click();
      const section = page.locator(".u4-investigation");
      await section.waitFor();
      assert.equal(
        await section.locator(".u4-investigation-controls input").count(),
        slug === "4-4" ? 4 : 2,
        suffix,
      );
      await section.locator(".u4-test").click();
      assert.ok((await section.locator(".u4-test-result").textContent()).length > 40, suffix);
      const before = await section.locator(".u4-investigation-equation").textContent();
      await section.locator('[data-control="0"]').fill(slug === "4-5" ? "50" : "30");
      const after = await section.locator(".u4-investigation-equation").textContent();
      assert.notEqual(after, before, `${suffix} model changes with mathematical state`);
      if (mode) {
        const constructions = {
          percent: [50, 200],
          "4-2": [6, 8],
          "4-3": [22, 80],
          "4-4": [50, 12, 25, 40],
          "4-5": [20, 9],
        };
        for (const [i, value] of constructions[slug].entries()) {
          await section.locator(`[data-control="${i}"]`).fill(String(value));
        }
        await section.locator(".u4-test").click();
        assert.match(
          await section.locator(".u4-test-result").textContent(),
          /meets the stated mathematical condition/,
          `${suffix} accepts a valid mathematical construction`,
        );
      }
      const overflow = await section.evaluate((el) => el.scrollWidth - el.clientWidth);
      assert.ok(
        overflow <= 2,
        `${suffix} investigation overflows at mobile width by ${overflow}px`,
      );
      await page.close();
    }
  const page = await browser.newPage({ viewport: { width: 768, height: 700 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/math/unit-4/4-5-practice-studio/`, {
    waitUntil: "load",
  });
  await page.locator("#tab-4").click();
  const section = page.locator(".u4-investigation");
  await section.locator(".u4-independent-answer").fill("7.2");
  await section.locator(".u4-independent-check").click();
  assert.match(
    await section.locator(".u4-independent-feedback").textContent(),
    /multiply it by the known percent/i,
  );
  assert.match(await section.locator(".u4-independent-question").textContent(), /25% is 16/);
  await section.locator(".u4-independent-answer").fill("64");
  await section.locator(".u4-independent-check").click();
  assert.match(
    await section.locator(".u4-independent-feedback").textContent(),
    /calculation is correct/i,
  );
  await page.reload();
  assert.match(await page.locator(".u4-investigation-evidence").textContent(), /1 independent/);
  console.log(
    "Unit 4: ten routes, live models, mobile width, 4-5 error → new independent task → saved evidence",
  );
  await page.close();
  const challenge = await browser.newPage({ viewport: { width: 768, height: 700 } });
  await challenge.goto(
    `http://127.0.0.1:${server.address().port}/math/unit-4/4-5-practice-studio-challenging/`,
    { waitUntil: "load" },
  );
  await challenge.locator("#tab-4").click();
  const investigation = challenge.locator(".u4-investigation");
  await investigation.locator(".u4-independent-answer").fill("45");
  await investigation.locator(".u4-independent-check").click();
  assert.match(
    await investigation.locator(".u4-independent-feedback").textContent(),
    /First construct a model/,
  );
  await investigation.locator('[data-control="0"]').fill("20");
  await investigation.locator('[data-control="1"]').fill("9");
  await investigation
    .locator(".u4-explanation")
    .fill("Nine is 20 percent of 45, since 0.2 times 45 equals 9.");
  await investigation.locator(".u4-test").click();
  assert.match(
    await investigation.locator(".u4-test-result").textContent(),
    /meets the stated mathematical condition/,
  );
  await investigation.locator(".u4-independent-check").click();
  assert.match(
    await investigation.locator(".u4-independent-feedback").textContent(),
    /calculation is correct/,
  );
  await challenge.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
