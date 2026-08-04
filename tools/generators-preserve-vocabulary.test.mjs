#!/usr/bin/env node
/**
 * Regenerating a catch-up must never DELETE vocabulary that is already there.
 *
 * The catch-up generator merges "top 2 terms per lesson". The committed
 * stations carry more than that — curated past what the rule emits — so a plain
 * re-run to propagate an unrelated base-lesson change silently stripped 56
 * terms across the 20 stations (5-3-catchup alone lost Parallelogram, Parallel,
 * Base 1 (b1), Height and Perpendicular). It was caught by eye on 2026-08-04
 * and reverted before shipping; nothing would have caught it on the way in.
 *
 * Raising the cap is not the fix — at 8 terms per lesson one term is STILL lost
 * and the lists balloon to 24 entries. The generator carries forward whatever
 * is already on disk instead. This pins that.
 *
 * Runs the real generator against a throwaway fixture via its own REPO env
 * hook, so it tests the shipped code path rather than a re-implementation, and
 * never touches the actual lessons tree.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR = join(ROOT, "tools/generate-catchup-lessons.mjs");

let failures = 0;
const fail = (m) => {
  failures++;
  console.error(`  ✗ ${m}`);
};

const mcq = (tier, n, count) =>
  Array.from({ length: count }, (_, i) => ({
    type: "multiple-choice",
    stem: `${tier}${n}-${i}`,
    choices: ["1", "2"],
    correctIndex: 0,
    hints: ["Hint."],
  }));

/* A lesson config with just enough shape for the generator to clone it. */
function lessonConfig(unit, n, terms) {
  return {
    lessonId: `${unit}-${n}`,
    standard: "6.NOS.1",
    unit,
    lesson: n,
    title: `Lesson ${unit}.${n}`,
    contentObjective: `I can do lesson ${unit}.${n}.`,
    vocabulary: terms.map((t) => ({ term: t, definition: `${t} definition.` })),
    launch: {
      conceptIntro: {
        heading: "H",
        keyIdea: `Key idea ${n}`,
        iDo: { title: "Watch me", lines: [`Step for ${n}.`] },
        weDo: { title: "Together", lines: [`Guided for ${n}.`] },
        youDo: { title: "You", lines: [`Solo for ${n}.`] },
      },
    },
    explore: { instructions: "Explore." },
    // The small-group generator asserts a MINIMUM_PRACTICE of 10 per group, so
    // the fixture has to carry a realistic bank rather than one item per tier.
    practice: {
      approaching: mcq("A", n, 8),
      onLevel: mcq("O", n, 8),
      extending: mcq("E", n, 8),
      optional: [],
    },
    connect: { prompt: "Connect." },
    reflect: {
      prompt: "Reflect.",
      // Required: the small-group generator throws "no exit ticket" without it.
      exitTicket: { stem: `Exit ${n}?`, answer: "42", hints: ["Hint."] },
    },
    warmup: { title: "W", questions: [] },
  };
}

/* Both generators write summary sidecars next to their own source file rather
   than under the lessons tree, so REPO does not redirect them and a test run
   would otherwise leave the real repo dirty. Snapshot and restore them. */
const SIDECARS = [
  join(ROOT, "tools/catchup-rows.json"),
  join(ROOT, "tools/small-group-rows.json"),
  join(ROOT, "functions/teacher-small-group/_facilitation-data.js"),
];
const sidecarBackup = new Map();
for (const f of SIDECARS) {
  try {
    sidecarBackup.set(f, readFileSync(f));
  } catch {
    /* absent is fine — it just will not be restored */
  }
}

const fixture = mkdtempSync(join(tmpdir(), "catchup-vocab-"));
try {
  const lessons = join(fixture, "lessons");
  // The small-group generator also emits teacher facilitation data under
  // ROOT/functions; REPO redirects it here, but the directory must exist.
  mkdirSync(join(fixture, "functions/teacher-small-group"), { recursive: true });
  // FIVE base lessons: the generator splits a unit into two bands
  // (lessons 1-3 and 4+), and an empty second band makes it throw. Five gives
  // both bands real sources, matching the real repo's shape.
  for (const n of [1, 2, 3, 4, 5]) {
    const dir = join(lessons, `1-${n}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "config.json"),
      JSON.stringify(lessonConfig(1, n, [`Term${n}A`, `Term${n}B`, `Term${n}C`]), null, 2),
    );
  }

  // An ALREADY-PUBLISHED catch-up holding a term the merge rule cannot produce:
  // "Term3C" is third in its lesson, past the top-2 cut. This is the shape of
  // the 56 real terms that were being dropped.
  const CURATED = "CuratedOnlyTerm";
  const catchupDir = join(lessons, "1-3-catchup");
  mkdirSync(catchupDir, { recursive: true });
  const prior = lessonConfig(1, 3, ["Term1A", CURATED, "Term3C"]);
  prior.lessonId = "1-3-catchup";
  writeFileSync(join(catchupDir, "config.json"), JSON.stringify(prior, null, 2));

  execFileSync("node", [GENERATOR], {
    env: { ...process.env, REPO: fixture },
    stdio: "pipe",
  });

  const after = JSON.parse(readFileSync(join(catchupDir, "config.json"), "utf8"));
  const terms = (after.vocabulary || []).map((v) => v.term);

  if (!terms.includes(CURATED)) {
    fail(
      `Regeneration DELETED the curated term "${CURATED}". ` +
        `Got: ${terms.join(", ") || "(none)"}. The generator must carry forward ` +
        `vocabulary already on disk — see the comment at its vocab merge.`,
    );
  }
  if (!terms.includes("Term3C")) {
    fail(`Regeneration dropped "Term3C", a curated term past the top-2 cut.`);
  }
  // The normal merge must still happen — preservation is additive, not a bypass.
  for (const expected of ["Term1A", "Term2A"]) {
    if (!terms.includes(expected)) {
      fail(`Regeneration stopped merging source vocabulary: "${expected}" is missing.`);
    }
  }
  // Guard the guard: a fixture that produced nothing would pass every check above.
  if (terms.length < 4) {
    fail(`Only ${terms.length} term(s) produced — the fixture is not exercising the merge.`);
  }

  /* The small-group generator had the same defect on a smaller scale: it takes
     the base lesson's first 8 terms, and 5-1-group1/group2 carry all 10 of
     lesson 5-1's, so a re-run stripped "Composite figure" and "Formula" from
     both. Same fixture, same property. */
  const SG_CURATED = "CuratedGroupTerm";
  const groupDir = join(lessons, "1-1-group1");
  mkdirSync(groupDir, { recursive: true });
  const priorGroup = lessonConfig(1, 1, ["Term1A", SG_CURATED]);
  priorGroup.lessonId = "1-1-group1";
  writeFileSync(join(groupDir, "config.json"), JSON.stringify(priorGroup, null, 2));

  execFileSync("node", [join(ROOT, "tools/generate-small-group-lessons.mjs"), "--configs-only"], {
    env: { ...process.env, REPO: fixture },
    stdio: "pipe",
  });

  const sgTerms = (
    JSON.parse(readFileSync(join(groupDir, "config.json"), "utf8")).vocabulary || []
  ).map((v) => v.term);
  if (!sgTerms.includes(SG_CURATED)) {
    fail(
      `Small-group regeneration DELETED the curated term "${SG_CURATED}". ` +
        `Got: ${sgTerms.join(", ") || "(none)"}.`,
    );
  }
  if (!sgTerms.includes("Term1A")) {
    fail(`Small-group regeneration stopped merging base vocabulary ("Term1A" missing).`);
  }

  if (!failures) {
    console.log(
      `regeneration preserves curated vocabulary — ` +
        `catch-up: ${terms.length} terms ("${CURATED}" survived), ` +
        `small-group: ${sgTerms.length} terms ("${SG_CURATED}" survived).`,
    );
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
  for (const [f, buf] of sidecarBackup) writeFileSync(f, buf);
}

process.exit(failures ? 1 : 0);
