#!/usr/bin/env node
/**
 * build-studio-index.mjs — snapshot the student-safe library into a static JSON
 * the Canvas Studio page (teacher-tools/canvas-studio/) reads. Cloudflare Pages
 * serves the page statically and cannot run Node, so we precompute everything.
 *
 * Uses the SAME selection logic as build-library-cartridge.mjs (shared
 * lib/library-select.mjs), so what the teacher browses == what gets exported.
 *
 * Usage:  node tools/canvas/build-studio-index.mjs   |   npm run canvas-studio
 * Env:    NEFT_SITE (default https://eduwonderlab.com), CC_STAMP (ISO time).
 * Output: teacher-tools/canvas-studio/library.json
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { selectLibrary } from "./lib/library-select.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");
const STAMP = process.env.CC_STAMP || "";

const { items, modules } = selectLibrary(repoRoot);

// Per-type tally for the Studio's filter chips.
const byType = {};
for (const it of items) byType[it.activityType] = (byType[it.activityType] || 0) + 1;

const out = {
  generatedAt: STAMP,
  site: SITE,
  source: "data/registry.json (regenerate with: npm run generate-registry)",
  totals: { items: items.length, modules: modules.length },
  byType,
  modules: modules.map((m) => ({ key: m.key, title: m.title, count: m.items.length })),
  // Flat item list; the page groups + filters client-side.
  items: items.map((it) => ({
    title: it.title,
    url: it.url,
    type: it.activityType,
    standard: it.standard,
    module: it.module,
    moduleKey: it.moduleKey,
  })),
};

const outFile = resolve(repoRoot, "teacher-tools", "canvas-studio", "library.json");
writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
console.log(`✓ Canvas Studio library: ${items.length} items, ${modules.length} modules`);
console.log(`  Types: ${Object.entries(byType).map(([t, n]) => `${t}×${n}`).join(", ")}`);
console.log(`  Wrote teacher-tools/canvas-studio/library.json`);
