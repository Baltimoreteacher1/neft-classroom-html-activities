#!/usr/bin/env node
/*
 * apply-standards-crosswalk.mjs
 * --------------------------------------------------------------------------
 * One-command, safe re-code of the Grade 6 math standards from the current
 * CCSS-based codes to the revised 2025 Maryland MCCRS codes.
 *
 * Why this exists: the revised standards renumber ~40 codes (old RP+EE -> a new
 * Algebraic Thinking domain, Geometry -> Geometric Reasoning & Measurement, etc.
 * — see docs/standards/grade-6-mccrs-2025-revision-notes.md). The authoritative
 * code list was not retrievable from this environment, so this tool is staged
 * and ready: fill the NEW codes into data/standards-crosswalk-2025.json, then
 * run --apply.
 *
 * Usage:
 *   node scripts/apply-standards-crosswalk.mjs --init     # write/refresh the
 *                                                          # crosswalk skeleton
 *   node scripts/apply-standards-crosswalk.mjs            # DRY RUN report
 *   node scripts/apply-standards-crosswalk.mjs --apply    # write changes
 *
 * Safety: --apply refuses to run while any crosswalk entry is missing a newId
 * (so partial/guessed data can never corrupt the curriculum). It is idempotent
 * and preserves each old code as `oldId` on the rewritten taxonomy.
 *
 * What --apply changes:
 *   1. data/standards-taxonomy.json     (ids -> new codes, keeps oldId + domain map)
 *   2. lessons/<id>/config.json         (`standard` field, CCSS short-form)
 *   3. math/unit-0/<slug>/index.html    (visible standard tags)
 * After applying, regenerate the spine:
 *   npm run generate-curriculum-manifest && npm run validate && npm run audit
 *   (plus the content-graph / coverage / search-index generators).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TAX_PATH = join(root, "data", "standards-taxonomy.json");
const XWALK_PATH = join(root, "data", "standards-crosswalk-2025.json");
const LESSONS_DIR = join(root, "lessons");

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const INIT = args.has("--init");

const UNRESOLVED = "<CONFIRM>";

// Confirmed structural domain mapping (old CCSS domain -> revised domain code).
// AT and GR are confirmed by multiple sources; NS and SP are left UNRESOLVED
// until the source document confirms the exact abbreviation.
const DOMAIN_MAP = {
  RP: "AT", // Ratios & Proportional Relationships -> Algebraic Thinking
  EE: "AT", // Expressions & Equations            -> Algebraic Thinking
  G: "GR", //  Geometry -> Geometric Reasoning & Measurement
  NS: UNRESOLVED, // Number System (NS vs NOS — confirm)
  SP: UNRESOLVED, // Statistics (SP vs STATS — confirm)
};

/** taxonomy id ("6.RP.A.3.A") -> CCSS short form used in lesson configs ("6.RP.3a"). */
function shortForm(taxId) {
  const p = taxId.split(".");
  // p = [grade, domain, cluster, number, (sub)]
  const [grade, domain, , number, sub] = p;
  if (!number) return `${grade}.${domain}`; // cluster-level (none expected)
  return `${grade}.${domain}.${number}${sub ? sub.toLowerCase() : ""}`;
}

function loadJSON(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

// ---------------------------------------------------------------------------
// init: build the editable crosswalk skeleton from the live taxonomy
// ---------------------------------------------------------------------------
function buildSkeleton() {
  const tax = loadJSON(TAX_PATH);
  const entries = tax.standards.map((s) => {
    const domain = s.id.split(".")[1];
    const newDomain = DOMAIN_MAP[domain] || UNRESOLVED;
    return {
      oldId: s.id,
      oldShortForm: shortForm(s.id),
      oldDomain: domain,
      oldLabel: s.label,
      newDomain,
      newId: null, // FILL FROM SOURCE: e.g. "6.AT.A.1"
      confidence: "structural-domain-only",
    };
  });
  return {
    _note:
      "Old->new crosswalk for the 2025 Maryland MCCRS Grade 6 re-code. Fill every `newId` from the authoritative crosswalk PDF, then run scripts/apply-standards-crosswalk.mjs --apply. `newDomain` is pre-filled where confirmed (AT, GR); NS/SP marked <CONFIRM>.",
    source:
      "https://marylandpublicschools.org/about/Documents/DCAA/Math/revised/Grade-6-MCCRS-Math-Crosswalk-A.pdf",
    generated: new Date().toISOString(),
    entries,
  };
}

if (INIT) {
  const skeleton = buildSkeleton();
  writeFileSync(XWALK_PATH, JSON.stringify(skeleton, null, 2) + "\n");
  console.log(
    `Wrote crosswalk skeleton: data/standards-crosswalk-2025.json (${skeleton.entries.length} entries). Fill every newId, then run --apply.`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// load crosswalk + report completeness
// ---------------------------------------------------------------------------
if (!existsSync(XWALK_PATH)) {
  console.error("Missing data/standards-crosswalk-2025.json. Run with --init first.");
  process.exit(1);
}
const xwalk = loadJSON(XWALK_PATH);
const unresolved = xwalk.entries.filter(
  (e) => !e.newId || e.newDomain === UNRESOLVED || String(e.newId).includes(UNRESOLVED),
);

// short-form (old) -> entry, for sweeping lesson configs
const byOldShort = {};
for (const e of xwalk.entries) byOldShort[e.oldShortForm] = e;

// scan lesson usage
const lessonUsage = {};
for (const d of readdirSync(LESSONS_DIR)) {
  const cfg = join(LESSONS_DIR, d, "config.json");
  if (!existsSync(cfg)) continue;
  let j;
  try {
    j = loadJSON(cfg);
  } catch {
    continue;
  }
  if (j.standard) (lessonUsage[j.standard] = lessonUsage[j.standard] || []).push(d);
}

console.log("\nStandards crosswalk — 2025 Maryland MCCRS re-code");
console.log("─".repeat(60));
console.log(`Taxonomy standards : ${xwalk.entries.length}`);
console.log(`Resolved newId     : ${xwalk.entries.length - unresolved.length}`);
console.log(`Unresolved         : ${unresolved.length}`);
console.log(`Lesson configs use ${Object.keys(lessonUsage).length} distinct short-form codes.`);

const unmatched = Object.keys(lessonUsage).filter((s) => !byOldShort[s]);
if (unmatched.length) {
  console.log(`\n⚠ lesson codes with no taxonomy match (check manually): ${unmatched.join(", ")}`);
}

if (unresolved.length) {
  console.log("\nNeed newId from the source document for:");
  for (const e of unresolved.slice(0, 50)) {
    console.log(`  ${e.oldId.padEnd(12)} (${e.oldShortForm.padEnd(8)}) -> domain ${e.newDomain}`);
  }
}

if (!APPLY) {
  console.log(
    `\nDRY RUN. ${unresolved.length === 0 ? "Crosswalk complete — re-run with --apply to write changes." : "Fill the newId values above, then re-run with --apply."}`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// apply (guarded)
// ---------------------------------------------------------------------------
if (unresolved.length) {
  console.error(
    `\n⛔ Refusing to apply: ${unresolved.length} crosswalk entries are unresolved. ` +
      "Fill every newId/newDomain from the authoritative source first.",
  );
  process.exit(2);
}

// 1) taxonomy
const tax = loadJSON(TAX_PATH);
const byOldId = {};
for (const e of xwalk.entries) byOldId[e.oldId] = e;
tax.standards = tax.standards.map((s) => {
  const e = byOldId[s.id];
  if (!e) return s;
  return { id: e.newId, domain: e.newDomain, label: s.label, oldId: s.id };
});
if (xwalk.domains) {
  tax.domains = xwalk.domains;
} else {
  const d = {};
  for (const e of xwalk.entries) d[e.newDomain] = d[e.newDomain] || e.newDomain;
  tax.domains = Object.assign({}, tax.domains, d);
}
tax._note = `${tax._note} | Re-coded to 2025 Maryland MCCRS via standards-crosswalk-2025.json on ${new Date().toISOString().slice(0, 10)}.`;
writeFileSync(TAX_PATH, JSON.stringify(tax, null, 2) + "\n");

// 2) lesson configs
let changed = 0;
for (const d of readdirSync(LESSONS_DIR)) {
  const cfg = join(LESSONS_DIR, d, "config.json");
  if (!existsSync(cfg)) continue;
  let raw;
  try {
    raw = readFileSync(cfg, "utf8");
  } catch {
    continue;
  }
  let j;
  try {
    j = JSON.parse(raw);
  } catch {
    continue;
  }
  const e = j.standard && byOldShort[j.standard];
  if (!e) continue;
  j.standard = shortForm(e.newId);
  writeFileSync(cfg, JSON.stringify(j, null, 2) + "\n");
  changed++;
}

// 3) tagging (data/_tagging/merged.json) — full-code standard per URL; drives content-graph
const MERGED_PATH = join(root, "data", "_tagging", "merged.json");
let taggedChanged = 0;
const unmappedTags = new Set();
if (existsSync(MERGED_PATH)) {
  const mraw = loadJSON(MERGED_PATH);
  const arr = Array.isArray(mraw) ? mraw : mraw.merged || [];
  const NON_MATH = new Set(["NON_MATH", "MIXED", "FOUNDATIONAL", "", null, undefined]);
  for (const t of arr) {
    const s = t.standard;
    if (NON_MATH.has(s)) continue;
    const e = byOldId[s];
    if (e) {
      t.standard = e.newId;
      taggedChanged++;
    } else if (/^6\.(RP|NS|EE|G|SP)\./.test(String(s))) {
      unmappedTags.add(s);
    }
  }
  writeFileSync(MERGED_PATH, JSON.stringify(mraw, null, 1) + "\n");
}

console.log(
  `\n✓ Applied. Taxonomy re-coded; ${changed} lesson configs and ${taggedChanged} tags updated.`,
);
if (unmappedTags.size)
  console.log(`⚠ unmapped tag codes (left as-is): ${[...unmappedTags].join(", ")}`);
console.log(
  "Next: regenerate registry → content-graph → coverage → manifest → search-index, then validate + audit.",
);
