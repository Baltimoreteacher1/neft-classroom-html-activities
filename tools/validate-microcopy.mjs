#!/usr/bin/env node
/* =============================================================================
 * validate-microcopy — one voice for what students read.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * docs/style-guide.md section 9: warm and direct, never babyish, sarcastic or
 * blaming; feedback says what to try, never just "wrong" or "Incorrect, try
 * again"; sentence case for headings and buttons; one exclamation mark at most;
 * one concept, one name. The engine had a dozen messages that said "Not quite —
 * try again." (and one that said "Incorrect. ✘"), ten title-case button labels,
 * and the lesson data used three names for the ordered pair. The phrase lists,
 * the preferred terms and the coaching lines now live in ONE module,
 * engine/core/copy-dictionary.js, which the engine reads and this gate reads.
 *
 * WHAT IT CHECKS
 *   lesson data (84 core configs, English and Spanish where a rule applies)
 *     generic-feedback        feedback or a hint that is only "wrong, try again"
 *     banned-*                belittling, blaming, babyish, slangy phrases; "ESOL"
 *     multiple-exclamations   more than one "!" in a string
 *     all-caps-paragraph      a sentence set in capitals
 *     heading-title-case      a lesson heading in Title Case
 *     term-variant            a variant of an ENFORCED preferred term
 *   engine strings (engine/**.js, string literals)
 *     generic feedback        "Not quite — try again." and its relatives
 *     title-case buttons      "Check Answer" on a button
 *     banned phrases
 *   dictionary integrity      every coaching line is bilingual, long enough to say
 *                             something, and not itself generic
 *
 * REPORTED, NOT GATED (they need a teacher's judgement, not a regex):
 *   - instruction strings above grade 5 (Flesch-Kincaid), vocabulary excluded
 *   - terms with more than one legitimate name (bar model / tape diagram ...)
 *
 * Exceptions live in data/microcopy-review.json with a 40+ character reason; an
 * entry that no longer fires FAILS. A sweep of too few strings FAILS.
 *
 *   node tools/validate-microcopy.mjs
 *   node tools/validate-microcopy.mjs --root <dir> --min-strings 1 --min-engine-files 1
 * ========================================================================== */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BANNED_PHRASES,
  isGenericFeedback,
  MISS_COACH,
  TERMS,
} from "@eduwonderlab/engine/core/copy-dictionary.js";
import {
  collectTexts,
  extractStrings,
  fleschKincaid,
  INSTRUCTION_KINDS,
  isEngineGenericFeedback,
  loadCoreConfigs,
  plain,
  scanMicrocopy,
  titleCaseButtons,
} from "./lib/copy-scan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const ROOT = resolve(opt("root", join(HERE, "..")));
const MIN_STRINGS = Number(opt("min-strings", 30000));
const MIN_ENGINE_FILES = Number(opt("min-engine-files", 100));
const REVIEW = resolve(opt("review", join(ROOT, "data/microcopy-review.json")));

const failures = [];
const fail = (msg) => failures.push(msg);

// --- 1. Self-test: a detector that stopped firing reports a clean site.
const SELF_CONFIG = [
  ["generic-feedback", "feedback", "Incorrect, try again.", true],
  ["generic-feedback", "feedback", "Not quite.", true],
  ["generic-feedback", "feedback", "Not quite. Check which amount comes first.", false],
  ["generic-feedback", "hint", "Try again", false],
  ["banned-belittling", "stem", "Obviously the answer is 12.", true],
  ["banned-belittling", "stem", "Label the units clearly and simply divide.", false],
  ["banned-blaming", "feedback", "You messed up the sign.", true],
  [
    "banned-blaming",
    "feedback",
    "If it is bigger, you added when you should have subtracted.",
    false,
  ],
  ["multiple-exclamations", "stem", "Great! Now try this one!", true],
  ["multiple-exclamations", "stem", "Great, now try this one!", false],
  ["all-caps-paragraph", "stem", "READ THE WHOLE PROBLEM BEFORE YOU START SOLVING IT", true],
  ["all-caps-paragraph", "stem", "Find the MEAN of the data set", false],
  ["term-variant", "stem", "Plot the coordinate pair on the grid.", true],
  ["term-variant", "stem", "Plot the ordered pair on the grid.", false],
];
for (const [rule, kind, text, shouldFire] of SELF_CONFIG) {
  const fired = scanMicrocopy(text, { lang: "en", kind, key: "x" }).some((h) => h.rule === rule);
  if (fired !== shouldFire) {
    console.error(
      `SELF-TEST FAILED: ${rule} on ${JSON.stringify(text)} should ${shouldFire ? "fire" : "stay quiet"}`,
    );
    process.exit(1);
  }
}
if (
  !scanMicrocopy("Why Is This True", { lang: "en", kind: "heading", key: "heading" }).some(
    (h) => h.rule === "heading-title-case",
  )
) {
  console.error("SELF-TEST FAILED: heading-title-case did not fire on a Title Case heading");
  process.exit(1);
}
for (const [text, shouldFire] of [
  ["Not quite — try again.", true],
  ["Incorrect. ✘", true],
  ["Not yet. Try again.", true],
  ["Not quite — picture it with objects, then try once more.", false],
  ["Try again", false],
  ["wrong", false],
]) {
  if (isEngineGenericFeedback(text) !== shouldFire) {
    console.error(
      `SELF-TEST FAILED: engine generic-feedback on ${JSON.stringify(text)} should ${shouldFire ? "fire" : "stay quiet"}`,
    );
    process.exit(1);
  }
}

// --- 2. Review (documented exceptions).
let reviewed = [];
if (existsSync(REVIEW)) {
  reviewed = JSON.parse(readFileSync(REVIEW, "utf8")).reviewed || [];
  for (const [i, r] of reviewed.entries()) {
    if (!r.file || !r.rule) fail(`review entry ${i} needs file and rule`);
    if (String(r.reason || "").length < 40) {
      fail(
        `review entry ${i} (${r.file}${r.path || ""}): the reason must be 40+ characters, it explains why the text is right as written`,
      );
    }
  }
}
const used = new Set();
const excused = (file, path, rule) => {
  const i = reviewed.findIndex(
    (r) => r.file === file && (r.path ?? "") === (path ?? "") && r.rule === rule,
  );
  if (i < 0) return false;
  used.add(i);
  return true;
};

// --- 3. Dictionary integrity.
for (const [kind, line] of Object.entries(MISS_COACH)) {
  for (const lang of ["en", "es"]) {
    const text = line[lang];
    if (!text) fail(`copy-dictionary MISS_COACH.${kind}.${lang} is missing`);
    else {
      if (isGenericFeedback(text))
        fail(`copy-dictionary MISS_COACH.${kind}.${lang} is itself generic: ${text}`);
      if (text.split(/\s+/).length < 7)
        fail(`copy-dictionary MISS_COACH.${kind}.${lang} is too short to say what to try: ${text}`);
    }
  }
}
for (const b of BANNED_PHRASES)
  if (!(b.re instanceof RegExp) || !b.why)
    fail(`copy-dictionary banned phrase ${b.id} needs a regex and a reason`);
for (const t of TERMS)
  if (!t.preferred || !t.variants.length)
    fail(`copy-dictionary term ${t.concept} needs a preferred term and variants`);

// --- 4. Lesson data.
const configs = loadCoreConfigs(ROOT);
let scanned = 0;
const byRule = {};
let instruction = 0;
let overGrade5 = 0;
const gradeSamples = [];
for (const { file, cfg } of configs) {
  for (const t of collectTexts(cfg)) {
    scanned++;
    for (const h of scanMicrocopy(t.text, t)) {
      if (excused(file, t.path, h.rule)) continue;
      byRule[h.rule] = (byRule[h.rule] || 0) + 1;
      fail(
        `${file}${t.path} [${h.rule}] ${JSON.stringify(plain(t.text).slice(0, 90))} -> ${h.match}`,
      );
    }
    if (
      t.lang === "en" &&
      INSTRUCTION_KINDS.has(t.kind) &&
      plain(t.text).split(/\s+/).length >= 6
    ) {
      instruction++;
      const g = fleschKincaid(t.text);
      if (g > 5) {
        overGrade5++;
        if (gradeSamples.length < 5)
          gradeSamples.push(`${g.toFixed(1)}  ${file}${t.path}  ${plain(t.text).slice(0, 80)}`);
      }
    }
  }
}
if (scanned < MIN_STRINGS)
  fail(
    `only ${scanned} lesson strings were scanned (need at least ${MIN_STRINGS}): a sweep that finds nothing has verified nothing`,
  );

// --- 5. Engine strings.
let engineFiles = 0;
let engineStrings = 0;
const engineDir = join(ROOT, "engine");
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.js$/.test(name) || /\.test\./.test(name) || name === "copy-dictionary.js") continue;
    engineFiles++;
    const file = relative(ROOT, p);
    const src = readFileSync(p, "utf8");
    for (const s of extractStrings(src)) {
      engineStrings++;
      if (
        isEngineGenericFeedback(s.text) &&
        !excused(file, `:${s.line}`, "engine-generic-feedback")
      ) {
        fail(
          `${file}:${s.line} [engine-generic-feedback] says it was missed but not what to try: ${JSON.stringify(s.text.slice(0, 70))}. Use missCoach() from engine/core/copy-dictionary.js`,
        );
      }
      if (s.text.trim().split(/\s+/).length >= 3 && !/\$\{|[{};]/.test(s.text)) {
        for (const b of BANNED_PHRASES) {
          if (b.re.test(s.text) && !excused(file, `:${s.line}`, `engine-banned-${b.id}`)) {
            fail(
              `${file}:${s.line} [engine-banned-${b.id}] ${b.why}: ${JSON.stringify(s.text.slice(0, 70))}`,
            );
          }
        }
      }
    }
    for (const b of titleCaseButtons(src)) {
      if (!excused(file, `:${b.line}`, "engine-title-case-button")) {
        fail(
          `${file}:${b.line} [engine-title-case-button] buttons are sentence case: ${JSON.stringify(b.text)}`,
        );
      }
    }
  }
};
if (existsSync(engineDir)) walk(engineDir);
if (engineFiles < MIN_ENGINE_FILES)
  fail(
    `only ${engineFiles} engine files were scanned (need at least ${MIN_ENGINE_FILES}): a sweep that finds nothing has verified nothing`,
  );

reviewed.forEach((r, i) => {
  if (!used.has(i))
    fail(
      `stale review entry ${r.file}${r.path || ""} [${r.rule}]: it no longer fires, so delete it`,
    );
});

// --- 6. Report.
console.log(
  `validate-microcopy: ${scanned} lesson strings in ${configs.length} configs, ${engineStrings} string literals in ${engineFiles} engine files`,
);
console.log(
  `  reading level: ${overGrade5} of ${instruction} instruction strings (6+ words, vocabulary excluded) read above grade 5 (Flesch-Kincaid). Reported, not gated: it is a pedagogy decision.`,
);
for (const s of gradeSamples) console.log(`      ${s}`);
if (reviewed.length)
  console.log(`  ${used.size} documented exception(s) in ${relative(ROOT, REVIEW)}`);

if (failures.length) {
  console.error(`\nFAIL validate-microcopy (${failures.length})`);
  for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
  if (failures.length > 40) console.error(`  ... and ${failures.length - 40} more`);
  process.exit(1);
}
console.log("PASS validate-microcopy");
