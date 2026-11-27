#!/usr/bin/env node
// Viewport screenshots for the PFA audit/report: node tools/pfa/screenshot.mjs <base> <outDir> <name=path>...
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { chromium } = await import(join(ROOT, "node_modules/playwright/index.mjs"));
const [base, outDir, ...pairs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
});
for (const pair of pairs) {
  const i = pair.indexOf("=");
  const name = pair.slice(0, i);
  const path = pair.slice(i + 1);
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: width === 375 ? 812 : 800 } });
    await page.goto(base + path, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);
    const file = join(outDir, `${name}-${width}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(file);
    await page.close();
  }
}
await browser.close();
