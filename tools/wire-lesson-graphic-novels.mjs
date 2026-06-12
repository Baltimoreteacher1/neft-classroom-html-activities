#!/usr/bin/env node
/**
 * wire-lesson-graphic-novels.mjs
 * Adds the per-lesson "Graphic Novel" sidebar tab (config.graphicNovel) for the
 * new Axiom City episodes, mapping each episode to the classroom lessons that
 * share its standard. Because the classroom unit order crosses the Axiom/Reveal
 * order, mapping is BY STANDARD, not by unit number:
 *   - classroom Unit 7 (equations & inequalities 6.EE) <- Axiom U8 (Balance Vault)
 *   - classroom Unit 9 (integers & coord plane 6.NS)  <- Axiom U7 (Below Zero)
 *   - classroom 1-5 (add/sub decimals 6.NS.3)          <- Axiom U1 (Pattern Engine)
 * Idempotent: skips any lesson that already has a graphicNovel block.
 * Inserts as the last top-level key to keep the JSON diff minimal.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const EP = {
  u1e1: ["axiom-city-u1-e1-benchmark-and-brass.html", "Axiom City: Benchmark & Brass", "Benchmark & Brass"],
  u7e1: ["axiom-city-u7-e1-lights-out.html", "Axiom City: Lights Out", "Lights Out"],
  u7e2: ["axiom-city-u7-e2-signal-in-the-snow.html", "Axiom City: Signal in the Snow", "Signal in the Snow"],
  u7e3: ["axiom-city-u7-e3-the-grid-map.html", "Axiom City: The Grid Map", "The Grid Map"],
  u8e1: ["axiom-city-u8-e1-the-antechamber.html", "Axiom City: The Antechamber", "The Antechamber"],
  u8e2: ["axiom-city-u8-e2-the-gear-locks.html", "Axiom City: The Gear Locks", "The Gear Locks"],
  u8e3: ["axiom-city-u8-e3-the-fog-gallery.html", "Axiom City: The Fog Gallery", "The Fog Gallery"],
};

// classroom lesson id -> episode key (by standard / topic)
const MAP = {
  "1-5": "u1e1",
  "7-1": "u8e1", "7-1-flagship": "u8e1", "7-2": "u8e1",
  "7-3": "u8e2", "7-7": "u8e2",
  "7-4": "u8e3", "7-5": "u8e3", "7-6": "u8e3",
  "9-1": "u7e3", "9-1-flagship": "u7e3", "9-5": "u7e3", "9-6": "u7e3", "9-7": "u7e3",
  "9-2": "u7e2",
  "9-3": "u7e1", "9-4": "u7e1",
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
  const [file, title, menuTitle] = EP[epKey];
  const block =
    `,\n  "graphicNovel": {\n` +
    `    "href": "/graphic-novels/axiom-city/episodes/${file}",\n` +
    `    "title": ${JSON.stringify(title)},\n` +
    `    "menuTitle": ${JSON.stringify(menuTitle)},\n` +
    `    "standard": ${JSON.stringify(standard)},\n` +
    `    "desc": ${JSON.stringify(DESC)}\n` +
    `  }`;
  const idx = raw.lastIndexOf("}");
  const before = raw.slice(0, idx).replace(/\s*$/, "");
  const after = raw.slice(idx + 1);
  const next = before + block + "\n}" + after;
  JSON.parse(next); // validate
  writeFileSync(cfgPath, next);
  wired++;
  console.log(`✓ ${lesson.padEnd(14)} → ${menuTitle} (${standard})`);
}
console.log(`\nWired ${wired} lesson(s); skipped ${skipped} already-wired.`);
