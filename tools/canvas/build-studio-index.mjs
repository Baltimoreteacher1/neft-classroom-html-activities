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
import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { selectLibrary } from "./lib/library-select.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");
const STAMP = process.env.CC_STAMP || "";

const { items, modules } = selectLibrary(repoRoot);

// --- Small-group & catch-up enrichment -------------------------------------
// The 148 differentiation lessons live at /lessons/<id>-group1|group2|catchup/.
// They flow through the registry like any Lesson, but teachers need them called
// out as their own Canvas module with a plain-language description (the lesson's
// content objective) so the copy-paste kit yields title + description + link.
const SG_MODULE = { key: "small-group", title: "Small-Group & Catch-Up", order: 330 };
const SG_RE = /\/lessons\/[^/]*-(?:group\d+|catchup)\/$/;

function readContentObjective(url) {
  const m = url.match(/\/lessons\/([^/]+)\//);
  if (!m) return null;
  try {
    const cfg = JSON.parse(readFileSync(resolve(repoRoot, "lessons", m[1], "config.json"), "utf8"));
    return (cfg.contentObjective || "").replace(/\s+/g, " ").trim() || null;
  } catch {
    return null;
  }
}

function descriptionFor(it) {
  if (!SG_RE.test(it.url)) return null;
  const co = readContentObjective(it.url);
  if (co) return co;
  const kind = /catchup\/$/.test(it.url) ? "catch-up review" : "small-group differentiation";
  return `Grade 6 ${kind} lesson${it.standard ? ` — ${it.standard}` : ""}.`;
}

// Reassign SG/catch-up items into their own module and attach a description.
const enriched = items.map((it) => {
  if (SG_RE.test(it.url)) {
    return {
      ...it,
      module: SG_MODULE.title,
      moduleKey: SG_MODULE.key,
      description: descriptionFor(it),
    };
  }
  return { ...it, description: null };
});

// Rebuild the module summary from the (possibly-reassigned) items so counts and
// ordering stay correct. Order comes from selectLibrary's modules, plus SG.
const orderByKey = new Map(modules.map((m) => [m.key, m.order]));
const titleByKey = new Map(modules.map((m) => [m.key, m.title]));
orderByKey.set(SG_MODULE.key, SG_MODULE.order);
titleByKey.set(SG_MODULE.key, SG_MODULE.title);

const modCounts = new Map();
for (const it of enriched) modCounts.set(it.moduleKey, (modCounts.get(it.moduleKey) || 0) + 1);
const modulesOut = [...modCounts.keys()]
  .map((key) => ({ key, title: titleByKey.get(key), count: modCounts.get(key), order: orderByKey.get(key) ?? 999 }))
  .sort((a, b) => a.order - b.order || String(a.title).localeCompare(String(b.title)))
  .map(({ key, title, count }) => ({ key, title, count }));

// Per-type tally for the Studio's filter chips.
const byType = {};
for (const it of enriched) byType[it.activityType] = (byType[it.activityType] || 0) + 1;

const out = {
  generatedAt: STAMP,
  site: SITE,
  source: "data/registry.json (regenerate with: npm run generate-registry)",
  totals: { items: enriched.length, modules: modulesOut.length },
  byType,
  modules: modulesOut,
  // Flat item list; the page groups + filters client-side.
  items: enriched.map((it) => ({
    title: it.title,
    url: it.url,
    type: it.activityType,
    standard: it.standard,
    module: it.module,
    moduleKey: it.moduleKey,
    description: it.description,
  })),
};

const outFile = resolve(repoRoot, "teacher-tools", "canvas-studio", "library.json");
writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
console.log(`✓ Canvas Studio library: ${enriched.length} items, ${modulesOut.length} modules`);
console.log(
  `  Types: ${Object.entries(byType)
    .map(([t, n]) => `${t}×${n}`)
    .join(", ")}`,
);
console.log(`  Wrote teacher-tools/canvas-studio/library.json`);
