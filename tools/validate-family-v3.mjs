#!/usr/bin/env node
/* =============================================================================
 * validate-family-v3: every family homework page has lesson-keyed content or the build fails.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * Until v3.0 the Learn stop's bridge, Socratic prompts, transfer problem, spot-the-glitch,
 * spiral check and kitchen-table prompt came from a UNIT-level topic bank with a "ratios"
 * default: 89 of 166 pages printed another lesson's content (a smoothie ratio on a percent
 * page, "Jordan says 3:5" on an area page). A unit cannot choose a lesson's story.
 *
 * This gate holds the contract in docs/specs/family-homework-v3.md for every sidecar:
 *   SCHEMA     the v3 block exists and has every required, bilingual field
 *   MATH       every transfer / spiral / glitch / confused `calc` is recomputed with exact
 *              rational arithmetic and the correct choice must show that value (no prose parsing)
 *   LEAKAGE    no ratio boilerplate outside Unit 3; no string of 60+ characters on more than 3 lessons
 *   ORDER      spiral items come from lessons that are genuinely earlier
 *   LANGUAGE   usted forms, "el entero", spaced percents, timers, module-name words, SPED labels
 * Self-tests run first against known-bad fixtures; a sweep of zero lessons FAILS.
 *
 *   node tools/validate-family-v3.mjs            all lessons (the gate)
 *   node tools/validate-family-v3.mjs 3-1 5-1    only these ids (for authors; skips the cross-lesson sweep)
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT, tryLoadLessonConfig } from "./lib/curriculum-source.mjs";
import { checkV3, sharedLongStrings } from "./lib/family-v3.mjs";

const NOTES = join(REPO_ROOT, "data", "family-homework-notes");
const clone = (o) => JSON.parse(JSON.stringify(o));
const bi = (en, es) => ({ en, es });

const GOOD = {
  version: 1,
  kind: "math",
  topicKey: "percent-find-whole",
  standardPlain: bi("Find the whole.", "Hallar el total."),
  hook: {
    style: "price-tag",
    en: "A tag says $42, which is 60% of the price. What was the price?",
    es: "Una etiqueta dice $42, el 60% del precio. ¿Cuál era el precio?",
    guess: bi("More or less than $42?", "¿Más o menos de $42?"),
    reveal: bi("More: $70.", "Más: $70."),
  },
  classModel: { name: bi("the 10% step", "el peldaño del 10%") },
  model: {
    kind: "tape",
    data: { parts: 10, highlight: 6 },
    alt: bi("Ten blocks, six shaded, 60% = $42.", "Diez bloques, seis sombreados, 60% = $42."),
  },
  transfer: {
    stem: bi("27 is 30%. Whole?", "27 es el 30%. ¿Total?"),
    choices: [
      { en: "$8.10", es: "$8.10", correct: false, misconception: "m1" },
      { en: "$90", es: "$90", correct: true },
      { en: "$57", es: "$57", correct: false, misconception: "m2" },
    ],
    reasoning: bi("27 ÷ 0.3 = 90", "27 ÷ 0.3 = 90"),
    calc: { expr: "27 / 0.3", value: 90 },
  },
  glitch: null,
  spiral: [
    {
      from: "4-4",
      q: bi("25% of 80?", "¿25% de 80?"),
      options: ["20", "25", "32"],
      correctIdx: 0,
      exp: bi("80 ÷ 4", "80 ÷ 4"),
      calc: { expr: "80 / 4", value: 20 },
    },
    {
      from: "4-2",
      q: bi("60% as decimal?", "¿60% en decimal?"),
      options: ["0.06", "0.6", "6"],
      correctIdx: 1,
      exp: bi("60 ÷ 100", "60 ÷ 100"),
      calc: { expr: "60 / 100", value: 0.6 },
    },
  ],
  kitchenTable: bi("Pick a price on a receipt.", "Elijan un precio de un recibo."),
  vocab: [1, 2, 3].map((n) => ({
    term: `T${n}`,
    example: bi("ex", "ej"),
    nonExample: bi("non", "no"),
    frame: bi("It is ___.", "Es ___."),
  })),
  confused: [1, 2, 3].map((n) => ({
    wrong: bi(`w${n}`, `m${n}`),
    coach: bi("Bigger or smaller?", "¿Mayor o menor?"),
    why: bi("because", "porque"),
    misconception: `mc-${n}`,
    calc: { expr: "42 / 0.6", value: 70 },
  })),
};
const CTX = {
  id: "4-5",
  config: { title: "Whole", vocabulary: [{ term: "T1" }, { term: "T2" }, { term: "T3" }] },
  knownIds: new Set(["4-5", "4-4", "4-2"]),
};

function selfTest() {
  const bad = (name, mutate, expect, ctx = CTX) => {
    const v = clone(GOOD);
    mutate(v);
    const msgs = checkV3(v, ctx);
    assert(
      msgs.some((m) => m.includes(expect)),
      `self-test "${name}" did not report "${expect}"; got: ${msgs.join(" | ") || "nothing"}`,
    );
  };
  assert.deepEqual(checkV3(clone(GOOD), CTX), [], "the good fixture must be clean");
  assert(checkV3(undefined, CTX)[0].includes("no v3 block"), "a missing block must be reported");
  bad("wrong calc", (v) => (v.transfer.calc.value = 91), "is not 91");
  bad("two correct", (v) => (v.transfer.choices[0].correct = true), "exactly one correct");
  bad(
    "correct choice shows wrong value",
    (v) => (v.transfer.choices[1].en = "$80"),
    "does not show 90",
  );
  bad("missing Spanish", (v) => (v.kitchenTable.es = ""), "kitchenTable needs en + es");
  bad("spanish copy", (v) => (v.hook.es = v.hook.en), "Spanish is a copy");
  bad("later spiral lesson", (v) => (v.spiral[0].from = "5-1"), "is not earlier", {
    ...CTX,
    knownIds: new Set([...CTX.knownIds, "5-1"]),
  });
  bad("unknown spiral lesson", (v) => (v.spiral[0].from = "9-9"), "is not a lesson id");
  bad("wrong spiral key", (v) => (v.spiral[1].correctIdx = 0), "correctIdx");
  bad(
    "ratio boilerplate",
    (v) => (v.kitchenTable.en = "Mix 3 cups of berries with 2 cups of yogurt."),
    "ratio boilerplate",
  );
  bad("usted form", (v) => (v.kitchenTable.es = "Pregunte a su estudiante."), "usted form");
  bad("off-glossary whole", (v) => (v.hook.guess.es = "¿Cuál es el entero?"), "el total");
  bad(
    "spaced percent",
    (v) => (v.standardPlain.es = "Halla el 60 % del total."),
    "percent with a space",
  );
  bad("timer word", (v) => (v.kitchenTable.en = "Start the timer."), "timer language");
  bad("module word", (v) => (v.kitchenTable.en = "Ask your Co-Pilot."), "internal module word");
  bad(
    "coach states the answer",
    (v) => (v.confused[0].coach.en = "Is it 70?"),
    "states the answer",
  );
  bad(
    "coach not a question",
    (v) => (v.confused[0].coach.en = "Think about size."),
    "must be a question",
  );
  bad(
    "generic frame",
    (v) => (v.vocab[0].frame.en = "I can use T1 to explain why ___"),
    "generic frame",
  );
  bad("term not in lesson", (v) => (v.vocab[0].term = "Zebra"), "not in this lesson's vocabulary");
  bad("glitch on base lesson", (v) => (v.glitch = { scenario: bi("a", "b") }), "-part pages only");
  bad("part page without glitch", () => {}, "needs glitch", { ...CTX, id: "4-5-part2" });
  bad("mindset with a model", () => {}, 'mindset lessons use model.kind "none"', {
    ...CTX,
    id: "10-4",
    config: { ...CTX.config, standard: "MPP.4" },
    knownIds: new Set(["10-4", "4-4", "4-2"]),
  });
  const shared = sharedLongStrings(
    Object.fromEntries(["a", "b", "c", "d"].map((k) => [k, { x: "x".repeat(70) }])),
  );
  assert.equal(shared.length, 1, "a 70-character string on 4 lessons must be reported");
  assert.equal(sharedLongStrings({ a: { x: "x".repeat(70) }, b: { x: "x".repeat(70) } }).length, 0);
}

function main() {
  selfTest();
  const args = process.argv.slice(2);
  const all = readdirSync(NOTES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
  const ids = args.length ? args : all;
  if (ids.length === 0)
    throw new Error("swept zero lessons: a sweep that checks nothing verifies nothing");
  const knownIds = new Set(all);
  const problems = [];
  const byLesson = {};
  const topicKeys = new Map();
  for (const id of ids) {
    const file = join(NOTES, `${id}.json`);
    if (!existsSync(file)) {
      problems.push(`${id}: no sidecar at data/family-homework-notes/${id}.json`);
      continue;
    }
    const d = JSON.parse(readFileSync(file, "utf8"));
    byLesson[id] = d.v3;
    // A -part page shows the sidecar's own word list; every other page shows the lesson config's.
    const cfg = tryLoadLessonConfig(id) || {};
    const config = { ...cfg, vocabulary: [...(cfg.vocabulary || []), ...(d.vocabulary || [])] };
    problems.push(...checkV3(d.v3, { id, config, knownIds }));
    const k = d.v3?.topicKey;
    if (k) {
      if (topicKeys.has(k))
        problems.push(`${id}: topicKey "${k}" already used by ${topicKeys.get(k)}`);
      else topicKeys.set(k, id);
    }
  }
  if (!args.length) {
    for (const { text, lessons } of sharedLongStrings(byLesson))
      problems.push(
        `shared string on ${lessons.length} lessons (${lessons.slice(0, 4).join(", ")}...): "${text.slice(0, 80)}"`,
      );
  }
  if (problems.length) {
    console.error(
      `FAIL validate-family-v3 (${problems.length} problems across ${ids.length} lessons)`,
    );
    for (const p of problems.slice(0, 80)) console.error(`  - ${p}`);
    if (problems.length > 80) console.error(`  ... and ${problems.length - 80} more`);
    process.exit(1);
  }
  console.log(
    `OK validate-family-v3: ${ids.length} lessons carry a clean lesson-keyed v3 block (self-tests passed)`,
  );
}
main();
