#!/usr/bin/env node
import { execSync } from "child_process";
/**
 * build-library-cartridge.mjs — turn the ENTIRE EduWonderLab library (every
 * lesson, activity, game, project, assessment — current AND future) into one
 * Canvas-importable Common Cartridge, organized into Modules.
 *
 * Where the older tools (build-cartridge / build-course) read only the 64–74
 * curriculum lessons in data/curriculum-manifest.json, this reads
 * data/registry.json — the auto-generated source of truth for all 624+ items.
 * Add a new activity folder, run `npm run generate-registry`, rebuild here, and
 * the new item lands in Canvas automatically. That is the "future work" promise.
 *
 * Each item becomes either:
 *   - a Canvas Page (default, --mode=link)  — a live link + objective; or
 *   - a graded assignment (--mode=graded)   — online-text-entry completion code,
 *     mirroring build-cartridge.mjs's proven assignment format.
 * Items are grouped into Modules by unit / subject / type, in a stable order.
 *
 * Student-safe by design: teacher tools, hubs, and anything marked private /
 * teacher / admin / family in data/routes.json is excluded so nothing internal
 * lands in a student course. Override with --include-private (not recommended).
 *
 * Import: Canvas → Settings → Import Course Content → "Common Cartridge 1.x
 * Package" → upload → Import. Everything imports UNPUBLISHED.
 *
 * Usage:
 *   node tools/canvas/build-library-cartridge.mjs                 # whole library, link mode
 *   node tools/canvas/build-library-cartridge.mjs --mode=graded   # completion-code assignments
 *   node tools/canvas/build-library-cartridge.mjs --type=Game     # only one activity type
 *   node tools/canvas/build-library-cartridge.mjs --section=math  # only urls under /math/
 *   node tools/canvas/build-library-cartridge.mjs --limit=25      # cap (smoke test)
 *   npm run library-cartridge -- --type=Project
 *
 * Env: NEFT_SITE overrides the base site (default https://eduwonderlab.com).
 * Output: canvas-packages/neft-library[-suffix].imscc  (+ a manifest .json sidecar)
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { buildCartridgeFiles } from "../../teacher-tools/canvas-studio/cartridge-files.mjs";
import { norm, selectLibrary } from "./lib/library-select.mjs";
import { validateCartridgeDir } from "./validate-cartridge.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");

const args = process.argv.slice(2);
const getOpt = (name, dflt = null) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : dflt;
};
const MODE = getOpt("mode", "link") === "graded" ? "graded" : "link";
const TYPE_FILTER = getOpt("type"); // e.g. Game, Project, Activity, Lesson
const SECTION_FILTER = getOpt("section"); // url substring, e.g. "math", "esol"
const LIMIT = Number(getOpt("limit", 0)) || 0;
const INCLUDE_PRIVATE = args.includes("--include-private");

// Exact selection exported from Canvas Studio. --select=<file> reads a JSON
// { urls:[...] } (or a bare array / newline list); --select-urls=a,b,c is inline.
const SELECT_FILE = getOpt("select");
const SELECT_INLINE = getOpt("select-urls");
let SELECT_URLS = null;
if (SELECT_FILE) {
  const f = resolve(repoRoot, SELECT_FILE);
  if (!existsSync(f)) {
    console.error(`Selection file not found: ${f}`);
    process.exit(1);
  }
  const raw = readFileSync(f, "utf8").trim();
  try {
    const parsed = JSON.parse(raw);
    SELECT_URLS = Array.isArray(parsed) ? parsed : Array.isArray(parsed.urls) ? parsed.urls : [];
  } catch {
    // tolerate a plain newline/comma list
    SELECT_URLS = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
} else if (SELECT_INLINE) {
  SELECT_URLS = SELECT_INLINE.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
if (SELECT_URLS && !SELECT_URLS.length) {
  console.error("Selection is empty — nothing to build.");
  process.exit(1);
}

/* ---------- select + group (shared source of truth) ---------- */
const { items, modules: orderedModules } = selectLibrary(repoRoot, {
  typeFilter: TYPE_FILTER,
  sectionFilter: SECTION_FILTER,
  limit: LIMIT,
  includePrivate: INCLUDE_PRIVATE,
  selectUrls: SELECT_URLS,
});

if (!items.length) {
  console.error("No items matched the given filters.");
  process.exit(1);
}
// Surface any selected urls that didn't resolve (e.g. removed from the library).
if (SELECT_URLS) {
  const got = new Set(items.map((i) => norm(i.url)));
  const missing = SELECT_URLS.map(norm).filter((u) => !got.has(u));
  if (missing.length)
    console.warn(
      `⚠ ${missing.length} selected url(s) not in the current library (skipped):\n  ${missing.slice(0, 8).join("\n  ")}`,
    );
}

/* ---------- staging ---------- */
// --split emits one independently-importable cartridge per module (per unit /
// section) instead of one combined package — how teachers actually roll out by
// the week. Each split package is staged + validated + zipped on its own.
const SPLIT = args.includes("--split");
const stageRoot = resolve(repoRoot, "canvas-packages", "_librarystage");

/**
 * Stage, validate, and zip ONE cartridge from a list of modules.
 * @param {Array} modulesList  modules (each { key, title, order, items })
 * @param {string[]} suffixParts  filename suffix segments
 * @returns {{ outFile:string, itemCount:number, stats:object }}
 */
function emit(modulesList, suffixParts) {
  const stage = stageRoot;
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });

  // Generate the cartridge file tree with the SHARED generator — the exact same
  // module the in-browser Canvas Studio uses for its one-click download, so the
  // terminal package and the browser package are byte-for-byte identical.
  const { files, sidecar, itemCount } = buildCartridgeFiles({
    modules: modulesList,
    mode: MODE,
    site: SITE,
  });
  for (const f of files) {
    const dest = resolve(stage, f.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, f.content);
  }

  /* ---------- self-validate BEFORE shipping (mirrors build-course's guard) ---------- */
  const check = validateCartridgeDir(stage);
  if (!check.ok) {
    console.error(`\n✗ ABORTED: staged cartridge failed validation (package NOT written):`);
    for (const e of check.errors) console.error(`  ✗ ${e}`);
    console.error(`  Inspect the staged dir: ${stage}`);
    process.exit(1);
  }

  /* ---------- zip ---------- */
  const suffix = suffixParts.filter(Boolean).join("-");
  const outName = suffix ? `neft-library-${suffix}.imscc` : "neft-library.imscc";
  const outFile = resolve(repoRoot, "canvas-packages", outName);
  rmSync(outFile, { force: true });
  execSync(`cd "${stage}" && zip -r -q -X "${outFile}" . -x ".*"`);

  // human-readable sidecar (what shipped, by module)
  const sidecarFile = outFile.replace(/\.imscc$/, ".manifest.json");
  writeFileSync(
    sidecarFile,
    JSON.stringify(
      {
        generatedFrom: "data/registry.json",
        site: SITE,
        mode: MODE,
        filters: { type: TYPE_FILTER, section: SECTION_FILTER, limit: LIMIT || null, split: SPLIT },
        totals: { items: itemCount, modules: modulesList.length },
        modules: modulesList.map((m) => ({ title: m.title, count: m.items.length })),
        items: sidecar,
      },
      null,
      2,
    ) + "\n",
  );

  rmSync(stage, { recursive: true, force: true });
  return { outFile, outName, itemCount, stats: check.stats };
}

const modeSuffix = MODE === "graded" ? "graded" : null;
const filterSuffix = [
  SELECT_URLS ? "selection" : null,
  TYPE_FILTER ? TYPE_FILTER.toLowerCase() : null,
  SECTION_FILTER ? SECTION_FILTER.toLowerCase() : null,
];
const moduleSlug = (m) => m.key.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");

if (SPLIT) {
  console.log(`\n✓ Per-section cartridges (mode=${MODE}) — one importable package each:`);
  const built = [];
  for (const m of orderedModules) {
    const r = emit([m], [...filterSuffix, moduleSlug(m), modeSuffix]);
    built.push({ ...r, title: m.title });
    console.log(`    • ${m.title.padEnd(34)} ${String(r.itemCount).padStart(3)}  →  ${r.outName}`);
  }
  console.log(`\n  ${built.length} packages in canvas-packages/, each self-validated ✓`);

  // Printable rollout sheet — which file to import for each section, in order.
  const modeLine =
    MODE === "graded"
      ? "Each item is a text-entry assignment; students paste a completion code (decode it in **Canvas Grades**, `/teacher-tools/canvas-grades/`)."
      : "Each item is a page linking to the live activity; publish what you teach.";
  const indexMd =
    `# Canvas rollout — per-section import sheet\n\n` +
    `Generated from \`data/registry.json\` · mode: **${MODE}** · ${built.length} sections.\n\n` +
    `Import one section at a time, the week you teach it:\n` +
    `**Canvas → Settings → Import Course Content → "Common Cartridge 1.x Package" → upload → Import.**\n` +
    `Everything imports UNPUBLISHED. ${modeLine}\n\n` +
    `| # | Section | Items | Package to import |\n| - | --- | ---: | --- |\n` +
    built
      .map((r, i) => `| ${i + 1} | ${r.title} | ${r.itemCount} | \`${r.outName}\` |`)
      .join("\n") +
    `\n\n_Re-run \`npm run library-cartridge -- --split\` after \`npm run generate-registry\` to refresh as the library grows._\n`;
  const indexFile = resolve(repoRoot, "canvas-packages", "INDEX.md");
  writeFileSync(indexFile, indexMd);
  console.log(`  Rollout sheet: ${indexFile}`);

  console.log(`\nImport each section on its own: Canvas → Settings → Import Course Content →`);
  console.log(`  "Common Cartridge 1.x Package" → upload → Import. All UNPUBLISHED.`);
} else {
  const r = emit(orderedModules, [...filterSuffix, modeSuffix]);
  console.log(`\n✓ Library Common Cartridge: ${r.outFile}`);
  console.log(
    `  Validated:  ✓ structure clean (${r.stats.manifestHrefs} hrefs, ${r.stats.moduleItems} module items resolve)`,
  );
  console.log(`  Items:    ${r.itemCount}  (mode=${MODE})`);
  console.log(`  Modules:  ${orderedModules.length}`);
  for (const m of orderedModules) console.log(`    • ${m.title.padEnd(34)} ${m.items.length}`);
  if (TYPE_FILTER || SECTION_FILTER || LIMIT)
    console.log(
      `  Filters:  ${[TYPE_FILTER && `type=${TYPE_FILTER}`, SECTION_FILTER && `section=${SECTION_FILTER}`, LIMIT && `limit=${LIMIT}`].filter(Boolean).join(", ")}`,
    );
  console.log(`  Inventory: ${r.outFile.replace(/\.imscc$/, ".manifest.json")}`);
  console.log(
    `\nImport: Canvas → Settings → Import Course Content → "Common Cartridge 1.x Package" → upload → Import.`,
  );
  console.log(
    `Everything imports UNPUBLISHED. ${MODE === "graded" ? "Assignments use completion-code (online text entry)." : "Pages link to the live activities."}`,
  );
}
