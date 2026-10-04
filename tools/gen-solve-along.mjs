#!/usr/bin/env node
/**
 * SOLVE-ALONG sidecars: normalizer and freshness gate.
 *
 * SOURCE OF TRUTH: the authored sidecar next to each culminating-project page,
 * math/<unit>/projects/<version>/solve-along.json. Edit those files directly;
 * tools/validate-solve-along.mjs then re-checks every Your-Turn `expr` against
 * its `answer`, the schema, and that each named step exists on the page.
 *
 * Why this is not a content generator any more: until 2026-10 this file held a
 * ~2,500-line SPECS table that wrote every sidecar. After the 2026-08 Reveal
 * TOC renumber the sidecars were corrected by hand (Unit 1 became division,
 * Unit 2 became the Statistics mirror, pre-unit / unit-1 version-c / unit-10
 * version-c / unit-8 version-c were added) and the table was never updated, so
 * running it would have silently overwritten six corrected sidecars with stale
 * mathematics — Unit 1 Version A would have gone back to GCF goodie bags. Two
 * copies of the same content cannot both be the truth, and the on-disk sidecars
 * are the ones students see, so the table was retired and its content lives
 * only in the sidecars (it remains in git history before this change).
 *
 * What this tool still owns (all deterministic, no authoring):
 *   1. Canonical formatting: JSON.stringify(…, null, 2) plus a trailing newline,
 *      so diffs stay reviewable and hand edits cannot drift in style.
 *   2. Mirrors: math/unit-2/projects is a byte-for-byte mirror of
 *      math/statistics/projects (see tools/lib/project-units.mjs). The unit-2
 *      sidecar is DERIVED from the statistics one; edit statistics only.
 *   3. Gaps: a page that loads projects-solve.js with no sidecar is reported —
 *      that layer fetches ./solve-along.json unconditionally, so the page 404s.
 *      Content is never invented for it.
 *
 * Usage:
 *   node tools/gen-solve-along.mjs           # rewrite sidecars that drifted
 *   node tools/gen-solve-along.mjs --check   # exit 1 if anything would change
 *   --root=<dir>                             # operate on another tree (tests)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_UNITS } from "./lib/project-units.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const rootArg = args.find((a) => a.startsWith("--root="));
const ROOT = rootArg
  ? path.resolve(rootArg.slice("--root=".length))
  : path.resolve(__dirname, "..");

/** Derived project folder -> the folder it mirrors byte for byte. */
const MIRRORS = Object.freeze({ "unit-2": "statistics" });

/** Same enumeration as tools/validate-solve-along.mjs. */
function versionsOf(unit) {
  const projects = path.join(ROOT, "math", unit, "projects");
  if (!fs.existsSync(projects)) return [];
  return fs
    .readdirSync(projects, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^version-[a-z]$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

const rel = (unit, ver) => `math/${unit}/projects/${ver}/solve-along.json`;

function readSidecar(unit, ver) {
  const file = path.join(ROOT, rel(unit, ver));
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  try {
    return { raw, data: JSON.parse(raw) };
  } catch (error) {
    throw new Error(`${rel(unit, ver)}: invalid JSON — ${error.message}`);
  }
}

const canonical = (data) => `${JSON.stringify(data, null, 2)}\n`;

const problems = [];
const stale = [];
let checked = 0;

for (const unit of PROJECT_UNITS) {
  for (const ver of versionsOf(unit)) {
    const target = rel(unit, ver);
    let current;
    let source;
    try {
      current = readSidecar(unit, ver);
      source = MIRRORS[unit] ? readSidecar(MIRRORS[unit], ver) : current;
    } catch (error) {
      problems.push(error.message);
      continue;
    }
    if (MIRRORS[unit] && !source && current) {
      problems.push(`${target}: mirrors ${rel(MIRRORS[unit], ver)}, which does not exist`);
      continue;
    }
    if (!source) {
      const page = path.join(ROOT, "math", unit, "projects", ver, "index.html");
      if (fs.existsSync(page) && fs.readFileSync(page, "utf8").includes("projects-solve.js")) {
        problems.push(
          `${target}: missing, but the page loads projects-solve.js — author the sidecar by hand`,
        );
      }
      continue;
    }
    checked++;
    const want = canonical(source.data);
    if (!current || current.raw !== want) {
      stale.push(target);
      if (!CHECK) {
        fs.writeFileSync(path.join(ROOT, target), want);
      }
    }
  }
}

for (const p of problems) console.error(`  ✗ ${p}`);
if (CHECK) {
  for (const s of stale)
    console.error(`  ✗ ${s}: not canonical — run node tools/gen-solve-along.mjs`);
  const ok = !stale.length && !problems.length;
  console.log(
    `solve-along sidecars: ${checked} checked, ${stale.length} stale, ${problems.length} problem(s)${ok ? " — up to date" : ""}`,
  );
  process.exit(ok ? 0 : 1);
}
console.log(
  `solve-along sidecars: ${checked} checked, ${stale.length} rewritten${stale.length ? `: ${stale.join(", ")}` : ""}`,
);
process.exit(problems.length ? 1 : 0);
