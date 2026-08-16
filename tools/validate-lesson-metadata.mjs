#!/usr/bin/env node
/**
 * validate:lesson-metadata — a page's metadata must describe the page it is on.
 *
 * WHAT WENT WRONG. `/lessons/2-6-group2/` shipped `<title>2.6 Small Group ·
 * Group 2</title>` next to `<meta property="og:title" content="1.4 Small Group ·
 * Group 2">`. 175 of 212 lesson index pages disagreed with themselves the same
 * way — small-group variants and whole-group lessons alike, `/lessons/8-2/`
 * offering "Solve One-Step Addition and Subtraction" for a page titled "Write
 * and Solve Equations Using Addition".
 *
 * WHY NOTHING CAUGHT IT. The generator was never wrong. `inject-enterprise-head`
 * reads the page's own <title> and rebuilds its block from it — run it and every
 * page is correct. It simply was not wired into `npm run build` or into CI, so
 * it ran once by hand, the sentinel block froze with the titles of that moment,
 * and the 2026-08-10 Reveal TOC renumber moved the titles out from under it. A
 * frozen block is invisible to every check that reads the source: the HTML is
 * valid, the ids resolve, the routes are 200, and the page renders. Only a
 * comparison BETWEEN two surfaces of the same page can see it.
 *
 * So this gate compares surfaces, and the build now runs the injector — the fix
 * is the wiring; this is the alarm that tells you the wiring came loose again.
 *
 * WHAT IT CHECKS, per lesson page that carries an injected head block:
 *   1. og:title equals the page's own <title>.
 *   2. og:url and <link rel="canonical"> name the page's OWN directory — the
 *      failure where metadata is copied wholesale from another lesson.
 *   3. og:description, when present, does not name a DIFFERENT lesson.
 *   4. A JS-mounted launcher shell still carries the no-JS notice and the boot
 *      guard. Not metadata, but the same tool owns it and the same freeze
 *      removed it: 127 pages would have lost the guard the first time anyone
 *      re-ran the injector, because its launcher test still required an empty
 *      <div id="app"> that the small-group shells stopped having.
 *
 * Self-tested against known-bad fixtures first, including a replay of the exact
 * 2-6-group2 → "1.4 Small Group" defect, because a detector that has stopped
 * firing reports a perfectly consistent fleet.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
/* Deliberately the SAME set as tools/inject-enterprise-head.js. A gate that
 * checks fewer pages than the tool writes leaves the difference unguarded, and
 * the difference is where a stale block would sit unnoticed. */
const PAGE_FILES = new Set([
  "index.html",
  "learn.html",
  "vocab.html",
  "notes.html",
  "notes-teacher.html",
  "homework.html",
  "worksheet.html",
  "handout.html",
]);

const failures = [];
const fail = (m) => failures.push(m);

/* ── Detectors, pure so they can be mutation-tested ────────────────────────── */

const squash = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();

export function readTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? squash(m[1]) : null;
}

export function readMeta(html, property) {
  const re = new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, "i");
  const m = html.match(re);
  return m ? squash(m[1]) : null;
}

export function readCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  return m ? squash(m[1]) : null;
}

/** The lesson id a URL points at, or null. `/lessons/2-6-group2/` -> 2-6-group2 */
export function lessonIdFromUrl(url) {
  const m = String(url ?? "").match(/\/lessons\/([^/]+)\//);
  return m ? m[1] : null;
}

/**
 * Lesson-number-shaped strings a piece of text claims, e.g. "2.6", "1.4".
 * Used to catch a description that names a lesson other than its own — the form
 * the frozen metadata took, since the ids appear as "2.6 Small Group".
 */
export function lessonNumbersIn(text) {
  return [...String(text ?? "").matchAll(/\b(\d{1,2})\.(\d{1,2})\b/g)].map(
    (m) => `${m[1]}-${m[2]}`,
  );
}

/** The lesson id a directory name belongs to: 2-6-group2 -> 2-6 */
export const coreIdOf = (dirName) => String(dirName).replace(/-(group\d+|catchup)$/, "");

/** Every problem with one page's metadata. */
export function metadataProblems(html, dirName) {
  const problems = [];
  if (!/enthead-injected:begin/.test(html)) return problems; // not an injected page
  const title = readTitle(html);
  const ogTitle = readMeta(html, "og:title");
  const ogUrl = readMeta(html, "og:url");
  const canonical = readCanonical(html);

  if (title && ogTitle && title !== ogTitle) {
    problems.push(`og:title "${ogTitle}" does not match <title> "${title}"`);
  }
  for (const [label, url] of [
    ["og:url", ogUrl],
    ["canonical", canonical],
  ]) {
    if (!url) continue;
    const id = lessonIdFromUrl(url);
    if (id && id !== dirName) {
      problems.push(`${label} points at /lessons/${id}/ from a page in /lessons/${dirName}/`);
    }
  }
  const desc = readMeta(html, "og:description");
  if (desc) {
    const core = coreIdOf(dirName);
    const named = lessonNumbersIn(desc);
    const foreign = named.filter((n) => n !== core);
    if (named.length && foreign.length === named.length) {
      problems.push(
        `og:description names lesson ${foreign.join(", ")} on a page for ${core}: "${desc}"`,
      );
    }
  }
  return problems;
}

/** A JS-mounted page must keep its no-JS notice and boot guard. */
export function shellProblems(html, fileName) {
  if (fileName !== "index.html") return [];
  const mounted = /<div id="app"[\s>]/.test(html) && /type="module"/.test(html);
  if (!mounted) return [];
  const problems = [];
  if (!/entshell-injected:begin/.test(html)) {
    problems.push("a JS-mounted launcher shell with no no-JS notice or boot guard");
  } else if (!/lesson-shell-guard\.js/.test(html)) {
    problems.push("the shell block is present but lesson-shell-guard.js is not loaded");
  }
  return problems;
}

/* ── Self-test: every detector, against known-bad input ────────────────────── */

const HEAD = "<!-- enthead-injected:begin -->";
const page = (title, og, url, desc = "") =>
  `<html><head><title>${title}</title>${HEAD}` +
  `<link rel="canonical" href="${url}">` +
  `<meta property="og:title" content="${og}">` +
  (desc ? `<meta property="og:description" content="${desc}">` : "") +
  `<meta property="og:url" content="${url}"></head><body></body></html>`;

const SELF_TESTS = [
  [
    "the shipped 2-6-group2 defect is caught",
    () =>
      metadataProblems(
        page(
          "2.6 Small Group · Group 2 — Neft Teacher",
          "1.4 Small Group · Group 2 — Neft Teacher",
          "https://eduwonderlab.com/lessons/2-6-group2/",
        ),
        "2-6-group2",
      ).length === 1,
  ],
  [
    "an agreeing page is not flagged",
    () =>
      metadataProblems(
        page(
          "2.6 Small Group · Group 2 — Neft Teacher",
          "2.6 Small Group · Group 2 — Neft Teacher",
          "https://eduwonderlab.com/lessons/2-6-group2/",
        ),
        "2-6-group2",
      ).length === 0,
  ],
  [
    "metadata copied from another lesson's URL is caught",
    () =>
      metadataProblems(page("x", "x", "https://eduwonderlab.com/lessons/8-3/"), "2-6").some((p) =>
        /points at \/lessons\/8-3\//.test(p),
      ),
  ],
  [
    "a description naming a different lesson is caught",
    () =>
      metadataProblems(
        page(
          "x",
          "x",
          "https://eduwonderlab.com/lessons/2-6/",
          "Small-group lesson — 1.4 Small Group",
        ),
        "2-6",
      ).some((p) => /og:description names lesson/.test(p)),
  ],
  [
    "a description naming its OWN lesson is not flagged",
    () =>
      metadataProblems(
        page(
          "x",
          "x",
          "https://eduwonderlab.com/lessons/2-6/",
          "Small-group lesson — 2.6 Small Group",
        ),
        "2-6",
      ).every((p) => !/og:description/.test(p)),
  ],
  [
    "a variant description may name its CORE lesson",
    () =>
      metadataProblems(
        page(
          "x",
          "x",
          "https://eduwonderlab.com/lessons/2-6-group2/",
          "— 2.6 Small Group · Group 2",
        ),
        "2-6-group2",
      ).every((p) => !/og:description/.test(p)),
  ],
  [
    "a page with no injected block is not judged",
    () => metadataProblems("<html><head><title>a</title></head></html>", "2-6").length === 0,
  ],
  ["coreIdOf strips a variant suffix", () => coreIdOf("6-11-group2") === "6-11"],
  ["coreIdOf strips a catchup suffix", () => coreIdOf("2-7-catchup") === "2-7"],
  ["coreIdOf leaves a core id alone", () => coreIdOf("8-2") === "8-2"],
  [
    "lessonNumbersIn reads a lesson number, not a decimal in prose",
    () => lessonNumbersIn("2.6 Small Group").join() === "2-6",
  ],
  [
    "a JS-mounted shell with no guard is caught",
    () =>
      shellProblems(
        '<div id="app"><p>Loading…</p></div><script type="module"></script>',
        "index.html",
      ).length === 1,
  ],
  [
    "a JS-mounted shell WITH the guard is not flagged",
    () =>
      shellProblems(
        '<div id="app"><p>Loading…</p></div><script type="module"></script>' +
          "<!-- entshell-injected:begin --><script src=/assets/lesson-shell-guard.js></script>",
        "index.html",
      ).length === 0,
  ],
  [
    "a static page is not asked for a boot guard",
    () => shellProblems("<p>hello</p>", "index.html").length === 0,
  ],
];

for (const [name, run] of SELF_TESTS) {
  let ok = false;
  try {
    ok = run();
  } catch (err) {
    fail(`self-test "${name}" threw: ${err.message}`);
    continue;
  }
  if (!ok) fail(`self-test failed — a detector has stopped firing: ${name}`);
}

/* ── The real fleet ────────────────────────────────────────────────────────── */

let scanned = 0;
let injected = 0;
for (const entry of readdirSync(LESSONS)) {
  const dir = join(LESSONS, entry);
  if (entry.startsWith("_") || !statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir)) {
    if (!PAGE_FILES.has(name)) continue;
    const file = join(dir, name);
    if (!statSync(file).isFile()) continue;
    scanned++;
    const html = readFileSync(file, "utf8");
    if (/enthead-injected:begin/.test(html)) injected++;
    for (const p of metadataProblems(html, entry)) fail(`lessons/${entry}/${name}: ${p}`);
    for (const p of shellProblems(html, name)) fail(`lessons/${entry}/${name}: ${p}`);
  }
}

/* A sweep that stops finding pages reports a clean fleet, so the floor is
 * asserted rather than assumed. */
if (injected < 1000) {
  fail(
    `only ${injected} of ${scanned} lesson pages carry an injected head block — ` +
      `the injector has stopped running in \`npm run build\``,
  );
}

if (failures.length) {
  console.error("✗ validate:lesson-metadata");
  for (const f of failures.slice(0, 40)) console.error(`   - ${f}`);
  if (failures.length > 40) console.error(`   … and ${failures.length - 40} more`);
  console.error(
    "\n   Metadata is rebuilt from each page's own <title> by " +
      "`node tools/inject-enterprise-head.js`, which `npm run build` runs. " +
      "If these are stale, run the build and commit the result.",
  );
  process.exit(1);
}
console.log(
  `✓ lesson metadata agrees with its page (${injected} injected pages of ${scanned} scanned, ` +
    `${SELF_TESTS.length} self-tests).`,
);
