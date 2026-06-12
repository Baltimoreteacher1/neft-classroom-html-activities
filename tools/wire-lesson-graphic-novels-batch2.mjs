#!/usr/bin/env node
/**
 * wire-lesson-graphic-novels-batch2.mjs
 * Closes the per-lesson "Graphic Novel" tab gaps that DON'T need new content:
 * each classroom lesson is mapped (by standard/topic) to a FOCUSED existing
 * Axiom City episode. Curated map (not auto-matched) to avoid landing on the
 * U10 capstone. Idempotent: skips lessons already wired.
 *
 * Deliberately NOT wired (no Axiom story exists for the standard — go to Cowork
 * as a Unit-1 "number system" batch): 1-1,1-2,1-3 (6.NS.4 factors/GCF/LCM),
 * 1-4 (6.NS.2 multi-digit division), 1-6,1-7 (6.NS.3 decimal ×/÷).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const EP = {
  u2e1: ["axiom-city-u2-e1-the-question-machine.html", "The Question Machine"],
  u2e3: ["axiom-city-u2-e3-fair-shares.html", "Fair Shares"],
  u2e4: ["axiom-city-u2-e4-the-honest-number.html", "The Honest Number"],
  u3e1: ["axiom-city-u3-e1-mix-and-measure.html", "Mix & Measure"],
  u3e2: ["axiom-city-u3-e2-the-scaling-stage.html", "The Scaling Stage"],
  u3e3: ["axiom-city-u3-e3-across-the-line.html", "Across the Line"],
  u4e2: ["axiom-city-u4-e2-find-the-whole.html", "Find the Whole"],
  u5e1: ["axiom-city-u5-e1-floor-plans.html", "Floor Plans"],
  u5e2: ["axiom-city-u5-e2-solid-ground.html", "Solid Ground"],
  u5e3: ["axiom-city-u5-e3-wrap-it-up.html", "Wrap It Up"],
  u6e1: ["axiom-city-u6-e1-split-the-glitch.html", "Split the Glitch"],
  u6e3: ["axiom-city-u6-e3-the-twin-doors.html", "The Twin Doors"],
};

// classroom lesson -> focused episode (by standard/topic)
const MAP = {
  // 6.NS.1 dividing fractions  -> Split the Glitch
  "2-1": "u6e1", "2-2": "u6e1", "2-4": "u6e1", "2-5": "u6e1",
  // 6.RP ratios / rates / conversions
  "3-2": "u3e1", "3-3": "u3e1",
  "3-5": "u3e2", "3-6": "u3e2", "3-7": "u3e3",
  "4-1": "u3e2", "4-7": "u3e3",
  // 6.RP.3c percents -> Find the Whole
  "4-3": "u4e2", "4-5": "u4e2",
  // 6.G.1 area -> Floor Plans
  "5-2": "u5e1", "5-3": "u5e1", "5-4": "u5e1", "5-5": "u5e1",
  // 6.EE expressions -> The Twin Doors
  "6-2": "u6e3", "6-3": "u6e3", "6-4": "u6e3", "6-5": "u6e3", "6-7": "u6e3",
  // 6.SP statistics
  "8-4": "u2e4", "8-6": "u2e1", "8-7": "u2e3",
  // 6.G volume / surface area
  "10-2": "u5e2", "10-4": "u5e3", "10-5": "u5e3",
};

const DESC = "Interactive Axiom City episode — read straight through; gates coach but never block. Not graded.";

let wired = 0, skipped = 0;
for (const [lesson, epKey] of Object.entries(MAP)) {
  const cfgPath = join(ROOT, "lessons", lesson, "config.json");
  if (!existsSync(cfgPath)) { console.log(`· missing config: ${lesson}`); continue; }
  let raw = readFileSync(cfgPath, "utf8");
  if (raw.includes('"graphicNovel"')) { skipped++; continue; }
  const cfg = JSON.parse(raw);
  const standard = cfg.standard || (Array.isArray(cfg.standards) ? cfg.standards[0] : cfg.standards) || "";
  const [file, menuTitle] = EP[epKey];
  const block =
    `,\n  "graphicNovel": {\n` +
    `    "href": "/graphic-novels/axiom-city/episodes/${file}",\n` +
    `    "title": ${JSON.stringify("Axiom City: " + menuTitle)},\n` +
    `    "menuTitle": ${JSON.stringify(menuTitle)},\n` +
    `    "standard": ${JSON.stringify(standard)},\n` +
    `    "desc": ${JSON.stringify(DESC)}\n` +
    `  }`;
  const idx = raw.lastIndexOf("}");
  const next = raw.slice(0, idx).replace(/\s*$/, "") + block + "\n}" + raw.slice(idx + 1);
  JSON.parse(next);
  writeFileSync(cfgPath, next);
  wired++;
  console.log(`✓ ${lesson.padEnd(5)} ${standard.padEnd(9)} → ${menuTitle}`);
}
console.log(`\nWired ${wired}; skipped ${skipped} already-wired.`);
