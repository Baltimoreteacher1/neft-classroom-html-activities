#!/usr/bin/env node
/**
 * A saved warm-up answer is a CHOICE INDEX. It means nothing on its own — it
 * means whatever now sits at that position.
 *
 * The answer-position pass reordered the choices in every lesson, so every
 * index already sitting in a student's localStorage began pointing at a
 * different option. The warm-up re-derives its score on load
 * (`selIdx === q.correctIndex`), so a student who genuinely scored 4/4 would
 * return to a lower score with their answer highlighted on an option they never
 * picked. Nothing errors. It quietly tells a child they were wrong when they
 * were right, which is why the content change was held until this existed.
 *
 * These tests drive `reconcileWarmupAnswers` through the three states a saved
 * answer set can be in, including the one that actually shipped: a save written
 * BEFORE the fix, carrying an index and no text, meeting a reordered lesson.
 *
 * The functions are read out of `lesson-renderer.js` rather than imported: the
 * module pulls in the whole engine and Vite aliases, and `tools/` tests here run
 * on bare node. The extraction is asserted, so a rename fails loudly instead of
 * silently testing nothing.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(process.cwd(), "engine/core/lesson-renderer.js"), "utf8");

function extract(name) {
  const start = SRC.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`${name} is gone from lesson-renderer.js — this test is stale`);
  // Walk braces from the first { after the signature to the matching close.
  const open = SRC.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < SRC.length; i++) {
    if (SRC[i] === "{") depth++;
    else if (SRC[i] === "}") {
      depth--;
      if (depth === 0) return SRC.slice(start, i + 1);
    }
  }
  throw new Error(`could not find the end of ${name}`);
}

const { warmupChoiceFingerprint, reconcileWarmupAnswers } = new Function(
  `${extract("warmupChoiceFingerprint")}\n${extract("reconcileWarmupAnswers")}\n` +
    "return { warmupChoiceFingerprint, reconcileWarmupAnswers };",
)();

const failures = [];
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
};
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

/** The lesson as it was, and as the answer-position pass left it. */
const BEFORE = {
  questions: [
    { choices: ["2:3", "3:2", "4:10", "10"], correctIndex: 0 },
    { choices: ["30 mpg", "6 mpg", "180 mpg", "36 mpg"], correctIndex: 0 },
  ],
};
const AFTER = {
  questions: [
    { choices: ["10", "2:3", "3:2", "4:10"], correctIndex: 1 },
    { choices: ["6 mpg", "30 mpg", "36 mpg", "180 mpg"], correctIndex: 1 },
  ],
};

console.log("warm-up answer reconciliation");

check("an untouched lesson keeps every saved answer exactly", () => {
  const saved = { 0: 0, 1: 0, checked: true, fp: warmupChoiceFingerprint(BEFORE) };
  const out = reconcileWarmupAnswers(saved, BEFORE);
  assert(out[0] === 0 && out[1] === 0, "answers were altered on an unchanged lesson");
  assert(out.checked === true, "a completed warm-up stopped reporting as completed");
});

check("THE SHIPPED CASE: a pre-fix save meets reordered choices and is dropped", () => {
  // Written before this fix: bare indices, no text, no fingerprint.
  const saved = { 0: 0, 1: 0, checked: true };
  const out = reconcileWarmupAnswers(saved, AFTER);
  assert(
    out[0] === undefined && out[1] === undefined,
    `stale indices survived into the reordered lesson (${JSON.stringify(out)}) — index 0 is now "${AFTER.questions[0].choices[0]}", which the student never picked`,
  );
  assert(!out.checked, "the card would render as already-scored with no answers in it");
  // The defect this prevents, stated as the arithmetic it prevents:
  const wouldHaveScored = [0, 1].filter((i) => saved[i] === AFTER.questions[i].correctIndex).length;
  assert(
    wouldHaveScored === 0,
    "fixture is not exercising the bug — the stale indices must score 0/2 against the new key",
  );
});

check("a post-fix save survives a reorder by the text the student picked", () => {
  const saved = {
    0: 0,
    1: 0,
    texts: { 0: "2:3", 1: "30 mpg" },
    checked: true,
    fp: warmupChoiceFingerprint(BEFORE),
  };
  const out = reconcileWarmupAnswers(saved, AFTER);
  assert(out[0] === 1, `expected "2:3" to resolve to index 1, got ${out[0]}`);
  assert(out[1] === 1, `expected "30 mpg" to resolve to index 1, got ${out[1]}`);
  const scored = [0, 1].filter((i) => out[i] === AFTER.questions[i].correctIndex).length;
  assert(scored === 2, `the student answered both correctly and now scores ${scored}/2`);
  assert(out.checked === true, "a fully recovered attempt lost its completed state");
});

check("an answer whose choice no longer exists does not fake a finished attempt", () => {
  const saved = {
    0: 0,
    1: 0,
    texts: { 0: "2:3", 1: "a choice that was deleted" },
    checked: true,
    fp: "stale",
  };
  const out = reconcileWarmupAnswers(saved, AFTER);
  assert(out[0] === 1, "the recoverable answer was lost too");
  assert(out[1] === undefined, "an unrecoverable answer was invented");
  assert(
    !out.checked,
    "a partially recovered set reported itself as scored — the missing answer would read as a blank the student left",
  );
});

/* THE WIRING. Everything above proves the function is correct, and a correct
 * function nobody calls protects nobody: reverting the call site to
 * `state.getResponse(0, "warmup_answers") || {}` left every test above green.
 * So the load path is asserted directly against the source. */
check("the renderer actually routes saved answers through the reconciler", () => {
  const load = /const savedAnswers\s*=\s*([^;]+);/.exec(SRC);
  assert(load, "the warm-up no longer has a `savedAnswers` load site — this test is stale");
  assert(
    /reconcileWarmupAnswers\s*\(/.test(load[1]),
    `the warm-up reads saved answers as \`${load[1].trim()}\` — straight from storage, ` +
      "so a stale index reaches the score again",
  );
});

check("a recorded answer stores the chosen TEXT, not only its index", () => {
  assert(
    /savedAnswers\.texts\s*\|\|=\s*\{\}\)\[qIdx\]\s*=/.test(SRC),
    "the choice text is no longer recorded, so no future reorder can be recovered from",
  );
  assert(
    /savedAnswers\.fp\s*=\s*warmupChoiceFingerprint\(/.test(SRC),
    "the fingerprint is no longer stamped, so every load will look stale and discard good answers",
  );
});

check("junk in storage never throws", () => {
  for (const junk of [null, undefined, "", 0, [], "not an object"]) {
    const out = reconcileWarmupAnswers(junk, AFTER);
    assert(out && typeof out === "object", `reconcile returned ${JSON.stringify(out)} for junk`);
  }
});

check("the fingerprint tracks choice ORDER, not just content", () => {
  assert(
    warmupChoiceFingerprint(BEFORE) !== warmupChoiceFingerprint(AFTER),
    "a reorder produced the same fingerprint, so no stale save would ever be caught",
  );
  assert(
    warmupChoiceFingerprint(BEFORE) === warmupChoiceFingerprint(structuredClone(BEFORE)),
    "the fingerprint is unstable, so every load would discard good answers",
  );
});

if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log(
  "\nwarm-up answers survive a reorder, and never report a score the student did not earn",
);
