#!/usr/bin/env node
/**
 * build-family-brand-icons.mjs: renders the PNG brand assets from the SVG sources in assets/design/family/art/brand/.
 *
 *   npm run build:family-brand-icons
 *
 * Output (same folder): icon-192.png, icon-512.png (transparent corners), icon-maskable-512.png (full bleed, art inside the
 * 80% safe zone), apple-touch-icon.png (180, opaque), favicon-32.png, and og/unit-NN[-es].png (1200x630).
 * Rendered with the repo's Playwright Chromium at a fixed viewport and device scale 1, with nothing animated, so a given
 * machine reproduces the same bytes. Open Graph text uses the system UI font, so those PNGs are per-machine reproducible.
 * Needs a browser; exits 3 (SKIP) when none is available.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { exitSkipped } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = join(ROOT, "assets/design/family/art/brand");
const read = (f) => readFileSync(join(BRAND, f), "utf8");

const JOBS = [
  { out: "icon-192.png", src: "favicon.svg", w: 192, h: 192, transparent: true },
  { out: "icon-512.png", src: "favicon.svg", w: 512, h: 512, transparent: true },
  { out: "icon-maskable-512.png", src: "icon-maskable.svg", w: 512, h: 512 },
  { out: "apple-touch-icon.png", src: "icon-opaque.svg", w: 180, h: 180 },
  { out: "favicon-32.png", src: "favicon.svg", w: 32, h: 32, transparent: true },
];
for (let u = 1; u <= 10; u++) {
  const n = String(u).padStart(2, "0");
  JOBS.push({ out: `og/unit-${n}.png`, src: `og/unit-${n}.svg`, w: 1200, h: 630 });
  JOBS.push({ out: `og/unit-${n}-es.png`, src: `og/unit-${n}-es.svg`, w: 1200, h: 630 });
}

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  exitSkipped(`no browser (${String(e.message).split("\n")[0]})`);
}
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
for (const j of JOBS) {
  const svg = read(j.src);
  await page.setViewportSize({ width: j.w, height: j.h });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>*{margin:0}html,body{background:transparent}body>svg{display:block;width:${j.w}px;height:${j.h}px}</style>${svg}`,
  );
  const png = await page.screenshot({
    omitBackground: Boolean(j.transparent),
    clip: { x: 0, y: 0, width: j.w, height: j.h },
  });
  writeFileSync(join(BRAND, j.out), png);
}
await browser.close();
console.log(`rendered ${JOBS.length} PNGs into assets/design/family/art/brand/`);
