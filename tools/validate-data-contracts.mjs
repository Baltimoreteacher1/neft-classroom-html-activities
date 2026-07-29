#!/usr/bin/env node
/* =============================================================================
 * validate-data-contracts — assert the generated data files still agree.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * data/ holds several independently generated JSON files that the curriculum
 * hub joins at runtime: the manifest, the launch manifest, the MiniSearch
 * index, the catalog, the asset->concept map. Nothing has ever asserted that
 * their join keys line up.
 *
 * That gap has already shipped a real bug: the hub's search results joined on
 * `l.lessonId` while the manifest keyed lessons on `l.id`, so every result
 * silently failed to resolve and search looked broken to students. The
 * generators were individually correct; their CONTRACT was not checked.
 *
 * These are cheap structural assertions — counts agree, ids referenced by one
 * file exist in another, paths point at files that are actually on disk, ids
 * are unique. They run in milliseconds and belong in the pre-push gate.
 *
 *   node tools/validate-data-contracts.mjs           # exit 1 on any violation
 *   node tools/validate-data-contracts.mjs --warn    # report only, exit 0
 * ========================================================================== */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WARN_ONLY = process.argv.includes("--warn");

const failures = [];
const notes = [];

function fail(contract, detail) {
  failures.push(`${contract}: ${detail}`);
}

function load(rel) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) return null;
  try {
    return JSON.parse(readFileSync(abs, "utf8"));
  } catch (err) {
    fail(rel, `unparseable JSON — ${err.message}`);
    return null;
  }
}

/** A data file that has gone missing is a contract break, not a skip. */
function require_(rel) {
  const data = load(rel);
  if (data === null) fail(rel, "missing — a hub join depends on this file");
  return data;
}

const manifest = require_("data/curriculum-manifest.json");
const launch = require_("data/curriculum-launch-manifest.json");
const search = require_("data/curriculum-search-index.json");
const catalog = require_("data/catalog.json");

// ---------------------------------------------------------------------------
// 1. Lesson ids are unique and non-empty.
//    A duplicate id silently makes one lesson unreachable: every lookup
//    resolves to whichever copy the Map saw last.
// ---------------------------------------------------------------------------
if (manifest?.lessons) {
  const seen = new Map();
  for (const l of manifest.lessons) {
    if (!l.id) {
      fail("manifest.lessons", `a lesson has no id (title: ${l.title || "?"})`);
      continue;
    }
    if (seen.has(l.id)) fail("manifest.lessons", `duplicate lesson id "${l.id}"`);
    seen.set(l.id, l);
  }
  notes.push(`manifest: ${manifest.lessons.length} lessons, ${seen.size} unique ids`);

  // The declared total must match reality, or every "N lessons" label lies.
  if (typeof manifest.total === "number" && manifest.total !== manifest.lessons.length) {
    fail("manifest.total", `declares ${manifest.total} but carries ${manifest.lessons.length}`);
  }
}

// ---------------------------------------------------------------------------
// 2. The search index covers exactly the manifest's lessons.
//    This is the contract the lessonId/id bug violated. A count mismatch means
//    students can search for a lesson that cannot be resolved (or vice versa).
// ---------------------------------------------------------------------------
if (manifest?.lessons && search) {
  const declared = search.documentCount;
  const inner = search.index?.documentCount;
  if (typeof declared === "number" && declared !== manifest.lessons.length) {
    fail(
      "search-index",
      `indexes ${declared} documents but the manifest has ${manifest.lessons.length} lessons`,
    );
  }
  if (typeof inner === "number" && typeof declared === "number" && inner !== declared) {
    fail("search-index", `wrapper says ${declared} documents, MiniSearch index says ${inner}`);
  }
  // The hub resolves a hit by looking its stored id up in the manifest. Assert
  // the index actually stores ids the manifest knows, rather than trusting that
  // two generators happened to agree on the field name.
  const ids = search.index?.documentIds;
  if (ids && typeof ids === "object") {
    const manifestIds = new Set(manifest.lessons.map((l) => String(l.id)));
    const stored = Object.values(ids).map(String);
    const unresolvable = stored.filter((id) => !manifestIds.has(id));
    if (unresolvable.length) {
      fail(
        "search-index -> manifest",
        `${unresolvable.length}/${stored.length} indexed ids resolve to no manifest lesson ` +
          `(e.g. ${unresolvable.slice(0, 3).join(", ")}). This is the lessonId-vs-id join bug.`,
      );
    } else {
      notes.push(`search: ${stored.length}/${stored.length} indexed ids resolve to a lesson`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. The launch manifest's lessons exist in the curriculum manifest.
// ---------------------------------------------------------------------------
if (manifest?.lessons && launch?.lessons) {
  const manifestIds = new Set(manifest.lessons.map((l) => String(l.id)));
  const orphans = launch.lessons.map((l) => String(l.id)).filter((id) => !manifestIds.has(id));
  if (orphans.length) {
    fail(
      "launch-manifest -> manifest",
      `${orphans.length} launch lessons have no manifest entry (e.g. ${orphans.slice(0, 3).join(", ")})`,
    );
  }
  if (typeof launch.lessonCount === "number" && launch.lessonCount !== launch.lessons.length) {
    fail("launch-manifest.lessonCount", `declares ${launch.lessonCount}, carries ${launch.lessons.length}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Every path a data file points at actually exists on disk.
//    A moved page is a dead end for a student mid-lesson; the link audit covers
//    HTML, this covers the JSON that the hub renders links from.
// ---------------------------------------------------------------------------
function checkPaths(label, entries, field) {
  if (!Array.isArray(entries)) return;
  const missing = [];
  for (const e of entries) {
    const raw = e?.[field];
    if (typeof raw !== "string" || !raw.startsWith("/")) continue;
    const clean = raw.split(/[?#]/)[0].replace(/\/$/, "");
    const candidates = [clean, `${clean}/index.html`, `${clean}.html`].map((p) =>
      resolve(ROOT, `.${p}`),
    );
    if (!candidates.some((p) => existsSync(p))) missing.push(raw);
  }
  if (missing.length) {
    fail(`${label}.${field}`, `${missing.length} paths resolve to nothing (e.g. ${missing.slice(0, 3).join(", ")})`);
  } else {
    notes.push(`${label}: all ${field} paths resolve`);
  }
}

checkPaths("catalog", catalog?.entries, "path");
checkPaths("manifest", manifest?.lessons, "lessonPath");

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
for (const n of notes) console.log(`  ok  ${n}`);

if (!failures.length) {
  console.log("validate:data-contracts — all generated data files agree.");
  process.exit(0);
}

console.error(`\nvalidate:data-contracts — ${failures.length} contract violation(s):`);
for (const f of failures) console.error(`  ✗ ${f}`);
console.error(
  "\nThese files are generated independently; a violation means one generator\n" +
    "changed shape without the others following. Re-run the generators before\n" +
    "assuming the data is wrong.",
);
process.exit(WARN_ONLY ? 0 : 1);
