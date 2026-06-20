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
 * It is INDEPENDENT of build-course.mjs (re-derives questions from source) so it
 * catches generator bugs, not just echoes them. It validates BOTH question types
 * build-course.mjs emits — multiple-choice AND matching — in the same order and
 * with the same cap (QUIZ_MAX) the generator uses, so item indices line up.
 *
 *   1. SOURCE  — every gradeable component in `lessons/<id>/config.json` is sane:
 *      MC has a non-empty stem, >= 2 distinct choices, in-range correctIndex;
 *      matching has >= 2 pairs with non-empty term/match.
 *   2. PACKAGE — if a built/extracted course dir is passed (or found under
 *      canvas-packages/_coursestage), each generated quiz item marks the same
 *      answer correct as the source (MC letter, or matching term→match map), in
 *      the same order, no empty quizzes, and every XML is well-formed (xmllint).
 *
 * Usage:
 *   node tools/canvas/validate-course.mjs [path/to/extracted/course]
 * Env: QUIZ_MAX (default 8) — must match the value used for the build.
 * Exit code 0 = flawless, 1 = at least one defect (so it can gate CI/regen).
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LETTERS = "ABCDEFGHIJKLMNOP".split("");
const QUIZ_MAX = Number(process.env.QUIZ_MAX || 8);

const errors = [];
const warns = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

/* ---- source: SAME extraction predicate + order + cap as build-course.mjs ----
 * build-course emits `mc.concat(match).slice(0, QUIZ_MAX)`, so this must too or
 * the package items won't line up with the source questions by index.          */
function questions(id) {
  const p = resolve(repoRoot, "lessons", id, "config.json");
  if (!existsSync(p)) return null; // no config => not a course lesson
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    fail(id, `config.json is not valid JSON (${e.message})`);
    return [];
  }
  const mc = [];
  const match = [];
  (function walk(o) {
    if (o && typeof o === "object") {
      if (
        o.type === "multiple-choice" &&
        Array.isArray(o.choices) &&
        o.choices.length >= 2 &&
        Number.isInteger(o.correctIndex)
      ) {
        mc.push({
          kind: "mc",
          stem: o.stem || o.question || "",
          choices: o.choices.map(String),
          correct: o.correctIndex,
        });
      } else if (
        o.type === "matching-game" &&
        Array.isArray(o.pairs) &&
        o.pairs.length >= 2 &&
        o.pairs.every((x) => x && x.term != null && x.match != null)
      ) {
        match.push({
          kind: "match",
          pairs: o.pairs.slice(0, 6).map((x) => ({ term: String(x.term), match: String(x.match) })),
        });
      }
      for (const k in o) walk(o[k]);
    }
  })(cfg);
  return mc.concat(match).slice(0, QUIZ_MAX);
}

function validateSourceQuestion(id, qi, q) {
  const where = `${id} Q${qi}`;
  if (q.kind === "mc") {
    if (!q.stem.trim()) fail(where, "empty stem");
    if (q.choices.length < 2) fail(where, "fewer than 2 choices");
    const seen = new Set();
    for (const c of q.choices) {
      const k = c.trim().toLowerCase();
      if (seen.has(k)) fail(where, `duplicate choice "${c}"`);
      seen.add(k);
    }
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.choices.length)
      fail(where, `correctIndex ${q.correct} out of range 0..${q.choices.length - 1}`);
  } else {
    if (q.pairs.length < 2) fail(where, "matching needs >= 2 pairs");
    for (const p of q.pairs) {
      if (!String(p.term).trim()) fail(where, "matching pair has empty term");
      if (!String(p.match).trim()) fail(where, "matching pair has empty match");
    }
  }
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
  const items = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[0];
    const typeM = block.match(/<fieldlabel>question_type<\/fieldlabel><fieldentry>([^<]+)</);
    const type = typeM ? typeM[1].trim() : "unknown";
    if (type === "matching_question") {
      // each <response_lid> = one term; its render_choice lists the option labels
      // (m0..mN, identical per term); the matching <varequal respident=...> gives
      // the option chosen correct for that term.
      const terms = [];
      const lidRe =
        /<response_lid ident="(response_[^"]+)"[^>]*>\s*<material>\s*<mattext[^>]*>([\s\S]*?)<\/mattext>([\s\S]*?)<\/response_lid>/g;
      let lm;
      const optionText = {}; // mIdent -> text (from first term's render_choice)
      while ((lm = lidRe.exec(block))) {
        const respident = lm[1];
        const term = stripTags(lm[2]);
        const body = lm[3];
        const labRe =
          /<response_label ident="(m\d+)">\s*<material>\s*<mattext[^>]*>([\s\S]*?)<\/mattext>/g;
        let opt;
        while ((opt = labRe.exec(body))) {
          if (!(opt[1] in optionText)) optionText[opt[1]] = stripTags(opt[2]);
        }
        terms.push({ respident, term });
      }
      // map each term to the option ident marked correct
      for (const t of terms) {
        const condRe = new RegExp(
          `<varequal respident="${t.respident}">\\s*(m\\d+)\\s*<\\/varequal>`,
        );
        const cm = block.match(condRe);
        t.correctIdent = cm ? cm[1] : null;
        t.correctText = cm ? optionText[cm[1]] : null;
      }
      items.push({ type, terms });
    } else {
      // multiple choice
      const choices = [];
      const labRe =
        /<response_label ident="([A-P])">\s*<material>\s*<mattext[^>]*>([\s\S]*?)<\/mattext>/g;
      let lm;
      while ((lm = labRe.exec(block))) choices.push({ ident: lm[1], text: stripTags(lm[2]) });
      const corr = block.match(/<varequal[^>]*>([\s\S]*?)<\/varequal>/);
      items.push({ type, choices, correct: corr ? corr[1].trim() : null });
    }
  }
  return items;
}

function wellFormed(file, haveXmllint) {
  if (!haveXmllint) return true;
  try {
    execSync(`xmllint --noout ${JSON.stringify(file)}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
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
  if (!haveXmllint) warns.push("xmllint not found — skipped XML well-formedness check");

  let quizzesChecked = 0;
  for (const l of manifest.lessons) {
    const safe = String(l.id).replace(/[^a-z0-9]+/gi, "_");
    const quizFile = resolve(courseDir, `quiz_${safe}`, `quiz_${safe}.xml`);
    const metaFile = resolve(courseDir, `quiz_${safe}`, "assessment_meta.xml");
    if (!existsSync(quizFile)) continue; // lesson has no quiz in this package
    if (!wellFormed(quizFile, haveXmllint)) {
      fail(l.id, "quiz XML malformed");
      continue;
    }
    if (existsSync(metaFile) && !wellFormed(metaFile, haveXmllint))
      fail(l.id, "assessment_meta.xml malformed");

    const src = questions(l.id) || [];
    const items = parseQuizItems(readFileSync(quizFile, "utf8"));
    if (items.length === 0) {
      fail(l.id, "quiz has zero items (empty quiz)");
      continue;
    }
    if (items.length !== src.length)
      fail(l.id, `quiz has ${items.length} items but source yields ${src.length}`);
    quizzesChecked++;

    items.forEach((it, i) => {
      const q = src[i];
      const where = `${l.id} Q${i + 1}`;
      if (!q) {
        fail(where, "quiz item has no matching source question");
        return;
      }
      // type must line up
      const expectType = q.kind === "match" ? "matching_question" : "multiple_choice_question";
      if (it.type !== expectType) {
        fail(where, `quiz item type "${it.type}" but source is "${expectType}"`);
        return;
      }
      if (q.kind === "mc") {
        const expectLetter = LETTERS[q.correct];
        if (it.correct !== expectLetter)
          fail(
            where,
            `QTI marks "${it.correct}" correct but source correctIndex ${q.correct} = "${expectLetter}"`,
          );
        if (it.choices.length !== q.choices.length)
          fail(where, `choice count ${it.choices.length} != source ${q.choices.length}`);
        else
          it.choices.forEach((c, ci) => {
            if (c.text !== String(q.choices[ci]).trim())
              fail(where, `choice ${c.ident} text drift: "${c.text}" vs source "${q.choices[ci]}"`);
          });
      } else {
        // matching: every source pair's term must map to the right match text
        if (it.terms.length !== q.pairs.length)
          fail(where, `matching has ${it.terms.length} terms but source has ${q.pairs.length}`);
        q.pairs.forEach((p, pi) => {
          const t = it.terms[pi];
          if (!t) {
            fail(where, `missing matching term #${pi + 1} ("${p.term}")`);
            return;
          }
          if (t.term !== p.term.trim())
            fail(where, `matching term drift: "${t.term}" vs source "${p.term}"`);
          if (t.correctIdent == null)
            fail(where, `matching term "${p.term}" has no correct option marked`);
          else if (t.correctText !== p.match.trim())
            fail(where, `matching "${p.term}" → "${t.correctText}" but source says → "${p.match}"`);
        });
      }
    });
  }
  return quizzesChecked;
}

/* ---- run ---- */
const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
let lessonsWithQuiz = 0;
let totalMc = 0;
let totalMatch = 0;
for (const l of manifest.lessons) {
  const qs = questions(l.id);
  if (qs === null) continue;
  if (qs.length) lessonsWithQuiz++;
  qs.forEach((q, i) => {
    if (q.kind === "match") totalMatch++;
    else totalMc++;
    validateSourceQuestion(l.id, i + 1, q);
  });
}
console.log(
  `SOURCE: ${totalMc} MC + ${totalMatch} matching questions across ${lessonsWithQuiz} lessons checked (cap ${QUIZ_MAX}/quiz).`,
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
console.log(`\n✓ flawless — every quiz answer key (MC + matching) matches its source.`);
