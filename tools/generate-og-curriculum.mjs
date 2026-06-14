#!/usr/bin/env node
/**
 * Generates the social/Open Graph share image for the Curriculum Hub.
 * 1200×630 branded card rasterized from SVG via @resvg/resvg-js.
 *
 * Run: node tools/generate-og-curriculum.mjs
 * Output: assets/og-curriculum.png
 *
 * Brand palette (from curriculum/index.html):
 *   navy #15487f · teal #205fa6 · green #2c7d6b · ink #14223a
 */
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "og-curriculum.png");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#15487f"/>
      <stop offset="1" stop-color="#205fa6"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.7">
      <stop offset="0" stop-color="#2c7d6b" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#2c7d6b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="12" fill="#2c7d6b"/>

  <text x="80" y="138" font-family="Nunito, Arial, sans-serif" font-size="26"
        font-weight="800" letter-spacing="4" fill="#d7e6ff">NEFT TEACHER · GRADE 6 MATH</text>

  <text x="78" y="300" font-family="Nunito, Arial, sans-serif" font-size="118"
        font-weight="900" fill="#ffffff">Curriculum Hub</text>

  <text x="80" y="382" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="40"
        font-weight="700" fill="#eaf2ff">Every lesson, novel, game, notes packet &amp; test —</text>
  <text x="80" y="438" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="40"
        font-weight="700" fill="#eaf2ff">organized by unit, all in one place.</text>

  <g font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="30" fill="#15487f">
    <rect x="80" y="500" width="232" height="64" rx="16" fill="#ffffff"/>
    <text x="196" y="541" text-anchor="middle">10 Units</text>
    <rect x="328" y="500" width="262" height="64" rx="16" fill="#ffffff"/>
    <text x="459" y="541" text-anchor="middle">74 Lessons</text>
    <rect x="606" y="500" width="362" height="64" rx="16" fill="#2c7d6b"/>
    <text x="787" y="541" text-anchor="middle" fill="#ffffff">Standards-Aligned</text>
  </g>

  <text x="1120" y="582" text-anchor="end" font-family="Atkinson Hyperlegible, Arial, sans-serif"
        font-size="24" font-weight="700" fill="#bcd4f4">eduwonderlab.com/curriculum</text>
</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
writeFileSync(out, resvg.render().asPng());
console.log("Wrote", out);
