#!/usr/bin/env node
/* =============================================================================
 * generate-og-card.mjs — the share card for thelanguagepage.com (1200 x 630 PNG).
 *
 * WHY. Measured live 2026-11-24: none of 85 pages set og:image, so a link pasted into a message, a chat or a social post
 * showed no picture. The lab host now adds og:image from functions/_lib/language-page.js; this builds the picture.
 *
 * It only draws what the product is allowed to say: the name, the plain promise line (data/product-decisions.json
 * "lp-site-name-the-language-page") and the honesty line. Palette: navy #17324D, teal #1FA6A2, warm off-white #F7F4EC,
 * amber #F2C15B, body #24323F, coral for speaking. No violet, purple or indigo. Fonts are the self-hosted Plus Jakarta Sans.
 *
 *   node tools/generate-og-card.mjs            write access-practice-lab/pictures/og-the-language-page.png
 *   node tools/generate-og-card.mjs --check    fail unless the file exists and is exactly 1200 x 630
 *
 * The PNG is generated output: change this script and re-run it, never edit the image.
 * ========================================================================== */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND } from "../access-practice-lab/src/brand.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const OG_CARD = "access-practice-lab/pictures/og-the-language-page.png";
export const OG_SIZE = { width: 1200, height: 630 };
const out = join(ROOT, OG_CARD);

/** PNG width and height from the IHDR chunk. */
export function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

if (process.argv.includes("--check")) {
  if (!existsSync(out)) {
    console.error(`generate-og-card: ${OG_CARD} is missing — run: node tools/generate-og-card.mjs`);
    process.exit(1);
  }
  const size = pngSize(readFileSync(out));
  if (!size || size.width !== OG_SIZE.width || size.height !== OG_SIZE.height) {
    console.error(
      `generate-og-card: ${OG_CARD} is ${size ? `${size.width}x${size.height}` : "not a PNG"}, expected 1200x630`,
    );
    process.exit(1);
  }
  console.log(`generate-og-card: ${OG_CARD} is ${size.width}x${size.height}`);
  process.exit(0);
}

const font = readFileSync(
  join(ROOT, "public/assets/fonts/plus-jakarta-sans-069be307.woff2"),
).toString("base64");
const tile = (x, y, fill) =>
  `<rect x="${x}" y="${y}" width="60" height="60" rx="18" fill="${fill}"/>`;
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:"PJS";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:200 800}
*{box-sizing:border-box}html,body{margin:0}
body{width:1200px;height:630px;background:#F7F4EC;color:#24323F;font-family:"PJS",system-ui,sans-serif;position:relative;overflow:hidden}
.band{position:absolute;left:0;right:0;bottom:0;height:150px;background:#17324D}
.band p{position:absolute;left:84px;top:34px;margin:0;color:#F7F4EC;font-size:30px;line-height:1.4;font-weight:600}
.band b{color:#F2C15B}
svg{position:absolute;left:84px;top:62px}
h1{position:absolute;left:84px;top:212px;margin:0;font-size:104px;line-height:1.02;font-weight:800;color:#17324D;letter-spacing:-2px}
.promise{position:absolute;left:88px;top:352px;margin:0;font-size:44px;font-weight:600;color:#24323F}
.rule{position:absolute;left:88px;top:430px;width:220px;height:8px;border-radius:4px;background:#1FA6A2}
</style>
<svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">${tile(0, 0, "#1FA6A2")}${tile(72, 0, "#17324D")}${tile(0, 72, "#F2C15B")}${tile(72, 72, "#D9684F")}</svg>
<h1>${BRAND.name}</h1>
<p class="promise">${BRAND.descriptor}</p>
<div class="rule"></div>
<div class="band"><p>Practice in English and Spanish.<br /><b>Original practice, not an official WIDA or ACCESS test.</b></p></div>`;

const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch {
  console.error("generate-og-card: no Chromium available (set PW_CHROMIUM_PATH)");
  process.exit(1);
}
const page = await browser.newPage({ viewport: OG_SIZE, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
writeFileSync(out, await page.screenshot({ type: "png", clip: { x: 0, y: 0, ...OG_SIZE } }));
await browser.close();
console.log(`generate-og-card: wrote ${OG_CARD} (${OG_SIZE.width}x${OG_SIZE.height})`);
