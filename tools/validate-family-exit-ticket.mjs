#!/usr/bin/env node
/* =============================================================================
 * validate-family-exit-ticket — a family surface may not hand out the exit ticket.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * The exit ticket (`reflect.exitTicket`) is the lesson's end-of-class check: the
 * one item that tells the teacher whether THIS student got today's idea. Until
 * 2026-10-08 the family page generator (scripts/generate-lesson-support-pages.mjs)
 * appended it to "Practice at home" and printed its answer under "Answer check",
 * so 55 of 84 public family pages (/lessons/<id>/family/) showed the exit-ticket
 * question with its answer — before class, to anyone. The family homework ladder
 * (scripts/homework-guided-notes.mjs) drew from the same pool.
 *
 * Both now read `familyCheck`, an authored PARALLEL item, and a lesson without
 * one renders no check item at all. This gate holds that, for every lesson:
 *
 *   LEAK    lessons/<id>/family/index.html or lessons/<id>/homework.html prints,
 *           as its own piece of text, a stem identical (normalized: NFKC, case,
 *           punctuation, spacing) to that lesson's exit-ticket stem. Inline
 *           formatting (<strong>, <sup>, …) is folded first so markup cannot
 *           hide a match; <script>/<style> bodies and attributes are not printed
 *           text and are ignored. Equality, not substring: a different question
 *           that merely CONTAINS the stem ("The drum loop plays 3⁴ beats. What
 *           is the value of 3⁴?") is a different item.
 *   SCHEMA  `familyCheck`, `familyKeyIdea(+Es)` and `familyLanguages` match the
 *           shape in scripts/lib/family-content.mjs — the same check the
 *           generator fails fast on, so a malformed field is reported here with
 *           its lesson id instead of as a generator crash.
 *
 * Self-tests run first against fixtures; a sweep that finds zero pages FAILS,
 * because a sweep that checks nothing has verified nothing.
 *
 *   node tools/validate-family-exit-ticket.mjs
 * ========================================================================== */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { familyFieldProblems, normalizeStem } from "../scripts/lib/family-content.mjs";
import { LESSONS_DIR } from "./lib/curriculum-source.mjs";

const INLINE_TAGS = /<\/?(?:b|i|em|strong|u|mark|sup|sub|small|code|bdi|abbr|span)(?:\s[^>]*)?>/gi;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#")
      return String.fromCodePoint(
        e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)),
      );
    return ENTITIES[e.toLowerCase()] ?? m;
  });

/**
 * The pieces of text a reader sees, each normalized. Inline tags are folded so
 * "What is <strong>3</strong> × 4?" is one piece; block tags split pieces.
 *
 * `span` counts as inline EXCEPT where the homework page uses it as a language
 * container (<span class="lang-en">…</span><span class="lang-es">…</span>):
 * those must split, or the English and Spanish stems fuse into one piece that
 * equals neither. So language spans become block boundaries before folding.
 * The family page's answer line ("stem → answer") splits at the arrow.
 */
export function printedTexts(html) {
  const body = String(html)
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<span\b[^>]*\bclass="[^"]*\blang-(?:en|es)\b[^"]*"[^>]*>/gi, "\u0000")
    .replace(INLINE_TAGS, "");
  return (
    body
      // "→" is the family page's question→answer separator ("stem → answer").
      .split(/<[^>]*>|\u0000|→/)
      .map((t) => normalizeStem(decode(t)))
      .filter(Boolean)
  );
}

/** True when the page prints the stem as its own piece of text. */
export function printsStem(html, stem) {
  const want = normalizeStem(stem);
  if (!want) return false;
  return printedTexts(html).includes(want);
}

/* ---------- self-tests ---------- */

function selfTest() {
  const stem =
    "A salad dressing uses 2 tbsp of oil for every 5 tbsp of vinegar. How much oil for 20 tbsp?";
  // Shapes the family page generator printed before the fix.
  assert.ok(printsStem(`<ol><li>${stem}</li></ol>`, stem), "plain <li> stem must be caught");
  assert.ok(
    printsStem(`<li>${stem.replace("&", "&amp;")} → <span class="answer">8</span></li>`, stem),
    "answer-check line (stem → answer) must be caught",
  );
  // Homework language containers.
  assert.ok(
    printsStem(
      `<p class="problem-stem"><span class="lang-en">${stem}</span><span class="lang-es" lang="es">Una receta…</span></p>`,
      stem,
    ),
    "homework lang-en span must be caught",
  );
  // Markup and punctuation cannot hide it.
  assert.ok(
    printsStem("<li>What is the value of 3<sup>4</sup>?</li>", "What is the value of 3⁴?"),
    "inline <sup> must fold and NFKC must match ⁴",
  );
  assert.ok(
    printsStem(
      "<p>A  salad dressing uses <strong>2</strong> tbsp of oil for every 5 tbsp of vinegar — How much oil for 20 tbsp</p>",
      stem,
    ),
  );
  // Not leaks.
  assert.ok(
    !printsStem(
      "<li>The drum loop plays 3⁴ beats. What is the value of 3⁴?</li>",
      "What is the value of 3⁴?",
    ),
    "a longer, different question containing the stem is not the stem",
  );
  assert.ok(
    !printsStem(`<script>const cfg = ${JSON.stringify({ stem })};</script><p>Hi</p>`, stem),
    "script bodies are not printed text",
  );
  assert.ok(
    !printsStem(`<div data-stem="${stem}"></div>`, stem),
    "attributes are not printed text",
  );
  assert.ok(!printsStem("<li>anything</li>", ""), "an empty stem matches nothing");

  // Schema.
  const et = {
    stem: "Q1?",
    choices: ["1", "2"],
    correctIndex: 0,
    stemEs: "P1?",
    choicesEs: ["1", "2"],
  };
  const ok = {
    stem: "Q2?",
    choices: ["3", "4"],
    correctIndex: 1,
    stemEs: "P2?",
    choicesEs: ["3", "4"],
  };
  assert.deepEqual(familyFieldProblems({ reflect: { exitTicket: et }, familyCheck: ok }), []);
  assert.deepEqual(
    familyFieldProblems({
      reflect: { exitTicket: { ...et, misconceptionTags: [null, "ratio-inverted"] } },
      familyCheck: ok,
    }),
    [],
    "misconceptionTags is optional metadata, not part of the shape",
  );
  const same = familyFieldProblems({
    reflect: { exitTicket: et },
    familyCheck: { ...ok, stem: "q1" },
  });
  assert.ok(
    same.some((p) => p.includes("exit-ticket stem")),
    "a copied stem must fail",
  );
  const missingEs = { ...ok };
  delete missingEs.stemEs;
  assert.ok(
    familyFieldProblems({ reflect: { exitTicket: et }, familyCheck: missingEs }).some((p) =>
      p.includes("stemEs"),
    ),
    "a missing Spanish sibling must fail",
  );
  assert.ok(
    familyFieldProblems({ reflect: { exitTicket: et }, familyCheck: { ...ok, correctIndex: 5 } })
      .length,
    "an out-of-range correctIndex must fail",
  );
  const vocabulary = [{ term: "Ratio" }, { term: "Rate" }];
  const lang = (terms) => ({
    keyIdea: "x",
    vocabulary: terms.map((term) => ({ term, translation: "t", definition: "d" })),
  });
  assert.deepEqual(
    familyFieldProblems({
      vocabulary,
      familyLanguages: {
        ar: lang(["Ratio", "Rate"]),
        fr: lang(["Ratio", "Rate"]),
        prs: lang(["Ratio", "Rate"]),
      },
    }),
    [],
  );
  assert.ok(
    familyFieldProblems({
      vocabulary,
      familyLanguages: {
        ar: lang(["Ratio"]),
        fr: lang(["Ratio", "Rate"]),
        prs: lang(["Ratio", "Rate"]),
      },
    }).some((p) => p.includes("missing term")),
    "a language missing a vocabulary term must fail",
  );
  assert.ok(
    familyFieldProblems({
      vocabulary,
      familyLanguages: { ar: lang(["Ratio", "Rate"]), fr: lang(["Ratio", "Rate"]) },
    }).length,
    "a missing language must fail",
  );
  assert.ok(
    familyFieldProblems({ familyKeyIdea: "Plain words" }).some((p) =>
      p.includes("familyKeyIdeaEs"),
    ),
  );
}

/* ---------- sweep ---------- */

function sweep() {
  const findings = [];
  let pages = 0;
  let configs = 0;
  const ids = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((id) => existsSync(join(LESSONS_DIR, id, "config.json")))
    .sort();
  for (const id of ids) {
    const cfg = JSON.parse(readFileSync(join(LESSONS_DIR, id, "config.json"), "utf8"));
    configs++;
    for (const problem of familyFieldProblems(cfg)) findings.push(`SCHEMA ${id}: ${problem}`);
    const stem = cfg.reflect?.exitTicket?.stem;
    for (const rel of ["family/index.html", "homework.html"]) {
      const file = join(LESSONS_DIR, id, rel);
      if (!existsSync(file)) continue;
      pages++;
      if (stem && printsStem(readFileSync(file, "utf8"), stem))
        findings.push(`LEAK   lessons/${id}/${rel} prints the exit-ticket question: "${stem}"`);
    }
  }
  return { findings, pages, configs };
}

function main() {
  selfTest();
  console.log("validate:family-exit-ticket — self-tests passed");
  const { findings, pages, configs } = sweep();
  if (!pages) {
    console.error("FAIL: swept 0 family/homework pages — the sweep verified nothing.");
    process.exit(1);
  }
  if (findings.length) {
    console.error(
      `FAIL: ${findings.length} finding(s) across ${configs} configs / ${pages} pages:`,
    );
    for (const f of findings) console.error(`  ${f}`);
    console.error(
      "\nFix: author `familyCheck` (a parallel item, see scripts/lib/family-content.mjs) and regenerate with\n" +
        "  node scripts/generate-lesson-support-pages.mjs <id>   and   npm run generate-homework-html",
    );
    process.exit(1);
  }
  console.log(
    `PASS: ${pages} family/homework pages across ${configs} lessons print no exit-ticket question.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
