#!/usr/bin/env node
/**
 * Every End-of-Unit resource must be listed under the unit that currently owns it.
 *
 * The order of authority — and WHY a path number is not authoritative — is
 * documented once, next to the data, in scripts/lib/download-taxonomy.mjs
 * (see CANONICAL_UNIT). This file enforces it:
 *
 *   1. CANONICAL_UNIT: an explicit, reviewed assignment. Checked strictly.
 *   2. Current structure: the unit card in curriculum/units/index.html that
 *      contains the link. This is the working default and is what the download
 *      generator consumes.
 *   3. The resource page's own <h1>/<title>, matched against the CURRENT unit
 *      names. Fails only on an unambiguous contradiction.
 *   4. The number in the path — reported as a diagnostic, never a failure.
 *
 * Rule 4 is the whole point. An earlier pass treated the path number as truth,
 * "corrected" 29 already-correct placements, and emptied Unit 10. Only 4 were
 * genuinely wrong, and all 4 were caught by rule 3: a study guide titled
 * "Equations & Inequalities" was sitting under Statistics.
 *
 *   node tools/validate-unit-resource-placement.mjs
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { CANONICAL_UNIT } from "../scripts/lib/download-taxonomy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "curriculum/units/index.html";

/** Path families whose number is pre-renumber. Diagnostic only — see rule 4. */
const LEGACY_NUMBERED = [
  /^\/pre-test\//,
  /^\/post-test\//,
  /^\/graphic-novels\//,
  /^\/activities\/architect\//,
  /^\/math\/unit-\d+\/games\//,
  /^\/math\/games\//,
  /^\/math\/unit-\d+\/(study-guide|projects)\/?$/,
];

/**
 * Words that identify a unit, taken from the CURRENT unit names on the units
 * page. Stems, so "Ratio tables" matches "Ratios & Rates". Deliberately narrow:
 * a topic word that belongs to two units identifies neither.
 */
const STOPWORDS = new Set(["the", "and", "in", "of", "math", "is", "two", "a"]);
const stemsOf = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    // Singularise so "Ratios" matches "ratio" and "Equations" matches "equation".
    .map((w) => w.replace(/(ie)?s$/, (m) => (m === "ies" ? "y" : "")));

let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`   ✗ ${message}`);
};

console.log("unit resource placement");

const { document } = new JSDOM(readFileSync(resolve(ROOT, PAGE), "utf8")).window;

/* -- gather the current structure (rule 2) -------------------------------- */
const units = new Map();
const placements = [];
for (const card of document.querySelectorAll("details.unit")) {
  const unit = Number(card.querySelector(".unit-num")?.textContent.match(/\d+/)?.[0]);
  const name = card.querySelector(".unit-name")?.textContent.trim() || "";
  if (!Number.isFinite(unit)) continue;
  units.set(unit, name);
  for (const anchor of card.querySelectorAll(":scope > .unit-body > .unit-res a.res")) {
    const href = anchor.getAttribute("href") || "";
    if (!href.startsWith("/")) continue;
    placements.push({ unit, name, href, label: anchor.textContent.replace(/\s+/g, " ").trim() });
  }
}

/**
 * Topic words that belong to exactly one current unit. A word shared by two
 * units (or by the two "Math Is..." units) identifies nothing and is dropped.
 */
const topicOwner = new Map();
for (const [unit, name] of units) {
  for (const stem of stemsOf(name)) {
    if (topicOwner.has(stem) && topicOwner.get(stem) !== unit) topicOwner.set(stem, null);
    else if (!topicOwner.has(stem)) topicOwner.set(stem, unit);
  }
}

/** The unit a resource's own title points at, or null when it names none. */
function unitFromTitle(text) {
  const hits = new Set();
  for (const stem of stemsOf(text)) {
    const owner = topicOwner.get(stem);
    if (owner) hits.add(owner);
  }
  // Two topics means the title spans units; that is not a contradiction.
  return hits.size === 1 ? [...hits][0] : null;
}

/** The resource page's own heading. */
const headingCache = new Map();
function headingOf(href) {
  if (headingCache.has(href)) return headingCache.get(href);
  let heading = null;
  const rel = href.replace(/^\/+/, "").replace(/\/$/, "");
  for (const candidate of [rel, `${rel}/index.html`]) {
    const abs = resolve(ROOT, candidate);
    // A directory route ("/math/unit-3/study-guide/") exists but is not readable
    // as a file; its index.html is the next candidate.
    if (!candidate || !existsSync(abs) || !statSync(abs).isFile()) continue;
    const html = readFileSync(abs, "utf8");
    for (const pattern of [/<h1[^>]*>([^<]+)/, /<title>([^<]+)/]) {
      const raw = pattern.exec(html)?.[1];
      const clean = raw?.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      if (clean) {
        heading = clean;
        break;
      }
    }
    if (heading) break;
  }
  headingCache.set(href, heading);
  return heading;
}

/* -- 0. the detectors still fire ------------------------------------------ */
{
  const cases = [
    ["units page parsed", placements.length > 50 && units.size === 10],
    ["title naming one unit resolves", unitFromTitle("Equations and Inequalities") === 8],
    ["title naming another unit resolves", unitFromTitle("Integers and Coordinate Plane") === 7],
    ["title naming no unit stays silent", unitFromTitle("Number Sense in Action") === null],
    ["title spanning two units stays silent", unitFromTitle("Ratios and Percents") === null],
    [
      "a legacy path number never resolves a unit",
      unitFromTitle("/pre-test/unit9-review.html") === null,
    ],
    ["explicit assignments are loaded", CANONICAL_UNIT.get("/math/unit-1/projects/")?.unit === 6],
  ];
  for (const [name, ok] of cases) if (!ok) fail(`self-test failed: ${name}`);
  if (failures) {
    console.error("   detectors are broken; refusing to report on placement");
    process.exit(1);
  }
  console.log(`   self-tests          : ${cases.length} ✓`);
}

/* -- rule 1: explicit canonical assignments ------------------------------- */
{
  let checked = 0;
  const seen = new Set();
  for (const item of placements) {
    const canonical = CANONICAL_UNIT.get(item.href);
    if (!canonical) continue;
    checked++;
    seen.add(item.href);
    if (item.unit !== canonical.unit) {
      fail(
        `UNIT RESOURCE MISMATCH (explicit assignment)\n` +
          `       Displayed under: Unit ${item.unit} — ${item.name}\n` +
          `       Resource:        ${item.label} (${item.href})\n` +
          `       Expected:        Unit ${canonical.unit}\n` +
          `       Why:             ${canonical.because}`,
      );
    }
  }
  for (const href of CANONICAL_UNIT.keys()) {
    // An assignment for something the page no longer lists is stale metadata.
    if (!seen.has(href)) fail(`CANONICAL_UNIT names ${href}, which the units page does not list`);
  }
  console.log(`   explicit assignments: ${checked} ✓`);
}

/* -- rule 3: the resource's own title vs the unit it is displayed under --- */
{
  let compared = 0;
  for (const item of placements) {
    if (CANONICAL_UNIT.has(item.href)) continue; // rule 1 already answered
    const heading = headingOf(item.href);
    if (!heading) continue;
    const claimed = unitFromTitle(heading);
    if (claimed === null) continue; // names no single unit — no contradiction
    compared++;
    if (claimed !== item.unit) {
      fail(
        `UNIT RESOURCE MISMATCH\n` +
          `       Displayed under: Unit ${item.unit} — ${item.name}\n` +
          `       Resource:        ${item.label} (${item.href})\n` +
          `       Page title says: ${heading}\n` +
          `       Expected:        Unit ${claimed} — ${units.get(claimed)}\n` +
          `       Fix curriculum/units/index.html, or add an explicit entry to\n` +
          `       CANONICAL_UNIT in scripts/lib/download-taxonomy.mjs if the\n` +
          `       current placement is deliberate.`,
      );
    }
  }
  if (!compared) fail("no resource title could be compared — the heading reader stopped working");
  console.log(`   titles compared     : ${compared} ✓`);
}

/* -- no resource may be listed under two different units ------------------ */
{
  const byHref = new Map();
  for (const item of placements) {
    if (!byHref.has(item.href)) byHref.set(item.href, new Set());
    byHref.get(item.href).add(item.unit);
  }
  // A site-wide tile legitimately repeats on every card; a unit resource does not.
  const SITE_WIDE = new Set(["/neft-math-lab-studio/"]);
  for (const [href, where] of byHref) {
    if (where.size <= 1 || SITE_WIDE.has(href)) continue;
    fail(
      `${href} is listed under Units ${[...where].sort((a, b) => a - b).join(" and ")} — it belongs to one`,
    );
  }
  console.log(`   distinct resources  : ${byHref.size} ✓`);
}

/* -- rule 4: legacy path numbers, reported only --------------------------- */
{
  const crossings = placements.filter((item) => {
    if (!LEGACY_NUMBERED.some((re) => re.test(item.href))) return false;
    const inPath = /(?:^|[/-])unit-?(\d{1,2})(?:[/-]|$)/i.exec(item.href);
    const n = inPath ? Number(inPath[1]) : NaN;
    return Number.isFinite(n) && n !== item.unit;
  });
  console.log(
    `   legacy path numbers : ${crossings.length} disagree with the current unit — expected, not a failure`,
  );
}

if (failures) {
  console.error(`\nRESULT: FAIL ❌ (${failures} problem${failures === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(`RESULT: PASS ✅ (${placements.length} unit-level placements)`);
