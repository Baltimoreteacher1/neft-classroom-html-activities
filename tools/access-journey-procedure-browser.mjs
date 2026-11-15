import assert from "node:assert/strict";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  let file = join(process.cwd(), path.endsWith("/") ? `${path}index.html` : path);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (path.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(path))
      file = join(process.cwd(), "access-practice-lab/index.html");
    else {
      res.writeHead(404).end();
      return;
    }
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto(
    `http://127.0.0.1:${server.address().port}/access-practice-lab/journey/m07/discover?grades=6-8`,
    { waitUntil: "networkidle" },
  );
  const select = page.locator("[data-sc-procedure-plan]");
  await select.selectOption("no-sand");
  await page.locator("[data-sc-procedure-run]").click();
  assert.match(await page.locator("[data-sc-procedure-result]").innerText(), /12 centimeters/);
  await page.locator("[data-sc-procedure-plan]").selectOption("all");
  await page.locator("[data-sc-procedure-run]").click();
  assert.match(await page.locator("[data-sc-procedure-result]").innerText(), /30 centimeters/);
  await page.reload({ waitUntil: "networkidle" });
  assert.match(await page.locator("[data-sc-procedure-result]").innerText(), /30 centimeters/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  console.log("PASS procedure: revision, scene result, restoration, mobile layout");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
