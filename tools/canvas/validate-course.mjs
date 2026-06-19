#!/usr/bin/env node
/**
 * validate-course.mjs — answer-key integrity check for the Canvas QTI quizzes
 * produced by build-course.mjs.
 *
 * Auto-graded quizzes are only safe if the choice marked correct in the QTI is
 * the SAME choice the lesson author marked correct. A silent off-by-one (or a
 * bad source `correctIndex`) would grade every student wrong. This script is the
 * guard — run it after any course build and before trusting a package.
 *
 * It is INDEPENDENT of build-course.mjs (re-derives from source) so it catches
 * generator bugs, not just echoes them. Two layers:
 *
 *   1. SOURCE  — every `lessons/<id>/config.json` multiple-choice component has a
 *      non-empty stem, >= 2 distinct choices, and a `correctIndex` in range.
 *   2. PACKAGE — if a built/extracted course dir is passed (or found under
 *      canvas-packages/_coursestage), each generated quiz item marks the same
 *      choice correct as the source, in the same choice order, and every XML is
 *      well-formed (via xmllint when available).
 *
 * Usage:
 *   node tools/canvas/validate-course.mjs [path/to/extracted/course]
 * Exit code 0 = flawless, 1 = at least one defect (so it can gate CI/regen).
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LETTERS = "ABCDEFGHIJ".split("");

const errors = [];
const warns = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

/* ---- source: same extraction predicate as build-course.mjs ---- */
function mcQuestions(id) {
  const p = resolve(repoRoot, "lessons", id, "config.json");
  if (!existsSync(p)) return null; // no config => not a course lesson
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    fail(id, `config.json is not valid JSON (${e.message})`);
    return [];
  }
  const out = [];
  (function walk(o) {
    if (o && typeof o === "object") {
      if (
        o.type === "multiple-choice" &&
        Array.isArray(o.choices) &&
        o.choices.length >= 2 &&
        Number.isInteger(o.correctIndex)
      ) {
        out.push({
          stem: o.stem || o.question || "",
          choices: o.choices.map(String),
          correct: o.correctIndex,
        });
      }
      for (const k in o) walk(o[k]);
    }
  })(cfg);
  return out;
}

function validateSourceQuestion(id, qi, q) {
  const where = `${id} Q${qi}`;
  if (!q.stem.trim()) fail(where, "empty stem");
  if (q.choices.length < 2) fail(where, "fewer than 2 choices");
  const seen = new Set();
  for (const c of q.choices) {
    const k = c.trim().toLowerCase();
    if (seen.has(k)) fail(where, `duplicate choice "${c}"`);
    seen.add(k);
  }
  if (
    !Number.isInteger(q.correct) ||
    q.correct < 0 ||
    q.correct >= q.choices.length
  )
    fail(where, `correctIndex ${q.correct} out of range 0..${q.choices.length - 1}`);
}

/* ---- package: parse a generated QTI quiz (deterministic format) ---- */
function unescape(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
function stripTags(s) {
  return unescape(s.replace(/<[^>]*>/g, "")).trim();
}
function parseQuizItems(xml) {
  // split into <item> blocks, preserving generated structure
  const items = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[0];
    const choices = [];
    const labRe =
      /<response_label ident="([^"]+)">\s*<material>\s*<mattext[^>]*>([\s\S]*?)<\/mattext>/g;
    let lm;
    while ((lm = labRe.exec(block)))
      choices.push({ ident: lm[1], text: stripTags(lm[2]) });
    const corr = block.match(/<varequal[^>]*>([\s\S]*?)<\/varequal>/);
    items.push({ choices, correct: corr ? corr[1].trim() : null });
  }
  return items;
}

function validatePackage(courseDir) {
  const manifest = JSON.parse(
    readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
  );
  const haveXmllint = (() => {
    try {
      execSync("command -v xmllint", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();
  if (!haveXmllint) warns.push("xmllint not found — skipped well-formedness check");

  let quizzesChecked = 0;
  for (const l of manifest.lessons) {
    const safe = String(l.id).replace(/[^a-z0-9]+/gi, "_");
    const quizFile = resolve(courseDir, `quiz_${safe}`, `quiz_${safe}.xml`);
    if (!existsSync(quizFile)) continue; // lesson has no quiz in this package
    if (haveXmllint) {
      try {
        execSync(`xmllint --noout ${JSON.stringify(quizFile)}`, { stdio: "pipe" });
      } catch (e) {
        fail(l.id, `quiz XML malformed`);
        continue;
      }
    }
    const src = mcQuestions(l.id) || [];
    const items = parseQuizItems(readFileSync(quizFile, "utf8"));
    quizzesChecked++;
    items.forEach((it, i) => {
      const q = src[i];
      const where = `${l.id} Q${i + 1}`;
      if (!q) {
        fail(where, "quiz item has no matching source question");
        return;
      }
      const expectLetter = LETTERS[q.correct];
      if (it.correct !== expectLetter)
        fail(
          where,
          `QTI marks "${it.correct}" correct but source correctIndex ${q.correct} = "${expectLetter}"`,
        );
      // choice order/text must line up so the letter means the same thing
      if (it.choices.length !== q.choices.length)
        fail(where, `choice count ${it.choices.length} != source ${q.choices.length}`);
      else
        it.choices.forEach((c, ci) => {
          if (c.text !== String(q.choices[ci]).trim())
            fail(where, `choice ${c.ident} text drift: "${c.text}" vs source "${q.choices[ci]}"`);
        });
    });
  }
  return quizzesChecked;
}

/* ---- run ---- */
const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
let lessonsWithMc = 0;
let totalQuestions = 0;
for (const l of manifest.lessons) {
  const qs = mcQuestions(l.id);
  if (qs === null) continue;
  if (qs.length) lessonsWithMc++;
  qs.forEach((q, i) => {
    totalQuestions++;
    validateSourceQuestion(l.id, i + 1, q);
  });
}
console.log(
  `SOURCE: ${totalQuestions} MC questions across ${lessonsWithMc} lessons checked.`,
);

let courseDir = process.argv[2];
if (!courseDir) {
  const staged = resolve(repoRoot, "canvas-packages", "_coursestage");
  if (existsSync(staged) && readdirSync(staged).length) courseDir = staged;
}
if (courseDir && existsSync(courseDir)) {
  const n = validatePackage(courseDir);
  console.log(`PACKAGE: ${n} built quizzes cross-checked against source (${courseDir}).`);
} else {
  console.log("PACKAGE: no built course dir given/found — source check only.");
}

for (const w of warns) console.log(`WARN  ${w}`);
if (errors.length) {
  console.log(`\n✗ ${errors.length} defect(s):`);
  for (const e of errors) console.log("  - " + e);
  process.exit(1);
}
console.log(`\n✓ flawless — every quiz answer key matches its source.`);
