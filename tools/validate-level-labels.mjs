#!/usr/bin/env node
import { execFileSync } from "node:child_process";
/**
 * validate-level-labels.mjs — no student is labeled "ESOL" on a page they open.
 *
 * THE RULE. Student-facing material says "Level 1" for support and reserves
 * "enrichment" for extension. It never tags the child. The label is about a
 * program, and a twelve-year-old reading it on their own worksheet learns
 * something about themselves that is none of the worksheet's business.
 *
 * WHY A GATE AND NOT A MEMO. This was cleaned up on 2026-05-29 and declared
 * done — correctly, for what existed then. By 2026-08-22 there were 543
 * occurrences again across ~470 files, because two GENERATORS re-emitted it
 * onto every lesson they wrote. A copy rule that lives only in someone's head
 * is undone by the next `npm run build`.
 *
 * WHAT COUNTS AS STUDENT-FACING — learned by missing it three times:
 *   pass 1 read page text            and missed <script> blocks
 *   pass 2 read scripts too          and missed attributes
 *   pass 3 excluded only comments, URLs and identifiers — and found the rest:
 *     a.download="Mias-Mango-Smoothies-ESOL.doc"   the file a student SAVES
 *     <meta name="description" content="ESOL reading lesson...">  search results
 * So this checks EVERYTHING except the three things that are genuinely not
 * read by a student.
 *
 * WHAT IS ALLOWED TO KEEP THE WORD, deliberately:
 *   - folder names and URLs   math/reading/volume-esol/ is a live route;
 *                             renaming it breaks links that work
 *   - code identifiers        data-tab="esol", id="tab-esol", --esol-*, esolLevel
 *   - developer comments      HTML, JS and CSS
 *   - teacher tooling, docs, research notes, and the build output in dist/
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LABEL = /\bESOL\b/gi;

/** Comments are not read by a student. */
const COMMENT = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|(?<![:"'\w])\/\/[^\n]*/g;
/**
 * Routes and code identifiers keep the word on purpose.
 *
 * A generic `\w+[-_]esol` was the first attempt and it was WRONG: it matched
 * "Day-ESOL" inside a.download="Sams-Moving-Day-ESOL.doc" and exempted the
 * single most student-facing case there is — the filename on their laptop.
 * The self-test below caught it. Exempt a URL PATH SEGMENT (slash-delimited),
 * never a bare hyphenated word.
 *
 * CSS SELECTORS are identifiers too — `#select-esol-level`, `.esol-selector-wrapper`
 * live in <style> blocks where no attribute rule reaches them, and the first
 * run of this gate flagged 55 of them as if a student could read a stylesheet.
 *
 * So are QUOTED IDENTIFIERS in script: getElementById("select-esol-level"),
 * localStorage keys, and `esol:` object keys. The exemption requires NO spaces
 * and NO dot, which is what separates an id from a FILENAME —
 * "Sams-Moving-Day-ESOL.doc" has a dot and stays caught. A label a reader sees
 * is either page text or a sentence; it is not a kebab-case token.
 */
const IDENTIFIER =
  /(?:href|src|action|formaction)="[^"]*esol[^"]*"|(?:id|class|name|for|data-[\w-]+)="[^"]*esol[^"]*"|\/[A-Za-z0-9_-]*esol[A-Za-z0-9_-]*(?=[/"'`\s]|$)|[#.][A-Za-z0-9_-]*esol[A-Za-z0-9_-]*|["'`][A-Za-z0-9_-]*esol[A-Za-z0-9_-]*["'`]|`(?:[A-Za-z0-9_-]|\$\{[^}]*\})*esol(?:[A-Za-z0-9_-]|\$\{[^}]*\})*`|\besol\s*:|--esol[\w-]*|\besol[A-Z]\w*/gi;

/** Every page a student or teacher can open. */
export function studentFacingPages(root = ROOT) {
  return execFileSync(
    "rg",
    [
      "-l",
      "\\bESOL\\b",
      "--glob",
      "!node_modules",
      "--glob",
      "!dist",
      "--glob",
      "!.claude",
      "--glob",
      "!docs/**",
      "--glob",
      "!research/**",
      "--glob",
      "!teacher-tools/**",
      "--glob",
      "!tests/**",
      "--glob",
      "!scripts/**",
      "--glob",
      "!tools/**",
      "--glob",
      "*.html",
      "math/",
      "curriculum/",
      "lessons/",
      "index.html",
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 64e6 },
  )
    .split("\n")
    .filter(Boolean);
}

/** What a reader would actually see, with the three exemptions removed. */
export function readableText(source) {
  return source.replace(COMMENT, "").replace(IDENTIFIER, "");
}

export function offencesIn(source) {
  return (readableText(source).match(LABEL) ?? []).length;
}

/* ── self-test: the detector must fire on the real cases and stay quiet on the
      exemptions. Runs on every invocation, because a detector nobody tests is
      how 543 occurrences came back. ───────────────────────────────────────── */
const CASES = [
  ["<p>Open ESOL Lesson</p>", 1, "visible page text"],
  ['<meta name="description" content="ESOL reading lesson">', 1, "search-result copy"],
  ['a.download="Sams-Moving-Day-ESOL.doc";', 1, "the saved filename"],
  ["<title>Bitas Bakery (ESOL)</title>", 1, "document title"],
  ['<a href="/math/reading/volume-esol/">Volume</a>', 0, "a live route"],
  ['<button data-tab="esol" id="tab-esol">Support</button>', 0, "code identifiers"],
  ["<!-- ESOL & READING -->", 0, "an html comment"],
  ["/* ESOL guides glossary */", 0, "a css comment"],
  ["  // ESOL builder selections", 0, "a js comment"],
  ["const esolLevel = 1;", 0, "an identifier"],
  ["#select-esol-level { display: block; }", 0, "a css id selector"],
  [".esol-selector-wrapper label { font-size: 12px; }", 0, "a css class selector"],
  ['document.getElementById("select-esol-level");', 0, "an element id in script"],
  ['localStorage.setItem("ai-hub-esol-level", "1");', 0, "a storage key"],
  ['{ task: "Area Grid", esol: "Bilingual glossary cards" }', 0, "an object key"],
  ["const selectId = `esol-select-${idx}`;", 0, "an interpolated element id"],
  ['a.download="Bitas-Bakery-ESOL.doc";', 1, "a filename is NOT an identifier"],
  ["const f = `Bitas-Bakery-ESOL.doc`;", 1, "nor is one in a template literal"],
];
let failed = 0;
for (const [sample, want, why] of CASES) {
  const got = offencesIn(sample);
  if (got !== want) {
    console.error(
      `  self-test FAILED (${why}): expected ${want}, got ${got} — ${sample.slice(0, 60)}`,
    );
    failed++;
  }
}
if (failed) {
  console.error(
    `✗ validate:level-labels — ${failed} self-test(s) failed; the detector cannot be trusted.`,
  );
  process.exit(1);
}

const pages = studentFacingPages();

/* The floor sits on the SWEEP. If rg's globs change and discovery returns two
   files, this check has verified nothing and must say so rather than pass. */
assertSweptEnough(
  "validate:level-labels",
  pages,
  "rg found far fewer .html files under math/, curriculum/ and lessons/ than the pinned floor — the glob or the tree changed, and a shrunken sweep cannot report a clean fleet.",
);

const bad = [];
for (const page of pages) {
  const n = offencesIn(readFileSync(resolve(ROOT, page), "utf8"));
  if (n) bad.push([page, n]);
}

if (!bad.length) {
  console.log(
    `PASS validate:level-labels — ${pages.length} page(s) mention ESOL only in routes, identifiers or comments; none label a student.`,
  );
  process.exit(0);
}

console.error(`✗ validate:level-labels — ${bad.length} page(s) show "ESOL" to a reader:`);
for (const [page, n] of bad.slice(0, 25)) console.error(`   ${String(n).padStart(3)}x  ${page}`);
if (bad.length > 25) console.error(`   ...and ${bad.length - 25} more`);
console.error(
  '\n  Use "Level 1" for support; leave routes, identifiers and comments alone.\n' +
    "  If a GENERATOR wrote this, fix the generator — editing its output is undone by the next build.",
);
process.exit(1);
