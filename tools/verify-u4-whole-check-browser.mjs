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
  if (!file.startsWith(`${root}/`)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(file)) file = join(root, "public", path);
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
  for (const slug of ["4-5-practice-studio", "4-5-practice-studio-challenging"]) {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/math/unit-4/${slug}/`, {
      waitUntil: "load",
    });
    await page.locator("#tab-4").click();
    await page.locator("#wc-cell").fill("4.5");
    await page.locator("#wc-whole").fill("45");
    await page.locator("#wc-test").click();
    await page.getByText(/tape is consistent/i).waitFor();
    await page.locator("#wc-cell").fill("7.2");
    await page.locator("#wc-whole").fill("72");
    await page.locator("#wc-test").click();
    await page.getByText(/28.8/).waitFor();
    const geometry = await page.locator(".whole-check").evaluate((e) => ({
      scroll: e.scrollWidth,
      width: e.clientWidth,
      right: Math.round(e.getBoundingClientRect().right),
    }));
    assert.ok(
      geometry.scroll <= geometry.width + 2,
      `${slug} activity overflows at 375px: ${JSON.stringify(geometry)}`,
    );
    const pageOverflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    assert.ok(
      pageOverflow.scroll <= pageOverflow.width,
      `${slug} page overflows at 375px: ${JSON.stringify(pageOverflow)}`,
    );
    await page.emulateMedia({ forcedColors: "active" });
    assert.ok(
      await page.locator("#wc-cell").isVisible(),
      `${slug} controls remain visible in forced colors`,
    );
    console.log(
      `${slug}: 375px full page, correct and mismatched models, no horizontal overflow, forced-colors controls visible`,
    );
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  server.close();
}
