// The second-level scaffolds are hand-authored arithmetic, which is exactly the
// kind of content that ships wrong and stays wrong: nothing downstream computes
// it, validate:math only reads lesson configs, and a plausible-looking micro-task
// with a bad answer would be shown to a student at the precise moment they are
// already confused.
//
// So this recomputes every one. The important detail is that it evaluates the
// `verify.expr` INDEPENDENTLY and compares the result to the accepted answer —
// it never compares an authored string to itself, which would pass no matter
// what was written.

import assert from "node:assert/strict";
import {
  checkIntervention,
  coveredTags,
  interventionFor,
  INTERVENTIONS,
} from "./misconception-interventions.js";
import { MISCONCEPTIONS } from "./misconceptions.js";

// A deliberately tiny arithmetic evaluator. Refusing anything but digits and
// operators means this test can never be tricked into running authored code,
// and keeps the `verify` field honest arithmetic rather than an escape hatch.
const SAFE = /^[\d\s+\-*/().<>=]+$/;
function evaluate(expr) {
  assert.ok(SAFE.test(expr), `verify expression must be plain arithmetic: ${expr}`);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr});`)();
}

const near = (a, b) => Math.abs(a - b) < 1e-9;

// ── Every intervention's arithmetic is correct ──
for (const [tag, entry] of Object.entries(INTERVENTIONS)) {
  const v = entry.verify;

  // Some errors are about ORDER, not arithmetic — "write the ratio of red to
  // blue" has no sum to check, and inventing one would be a verification that
  // proves nothing about the thing that can actually be wrong. Those declare
  // `rejects` instead, and what gets enforced is that the reversed answer is
  // refused. Every entry must do one or the other; neither is optional.
  // A follow-up sentence may cite numbers even when the task's own answer is a
  // word ("no", "divide"). Those numbers get checked too: a scaffold that states
  // a wrong mean while teaching about means is worse than saying nothing.
  for (const claim of entry.claims || []) {
    const got = evaluate(claim.expr);
    assert.ok(
      near(got, claim.equals),
      `${tag}: claim ${claim.expr} = ${got}, but the follow-up says ${claim.equals}`,
    );
    assert.ok(
      entry.then.includes(String(claim.equals)),
      `${tag}: claim ${claim.expr}=${claim.equals} is verified but never actually stated in the follow-up`,
    );
  }

  if (!v) {
    assert.ok(
      (Array.isArray(entry.rejects) && entry.rejects.length) ||
        (Array.isArray(entry.claims) && entry.claims.length),
      `${tag}: needs either verify arithmetic or a rejects list — an unchecked scaffold is how wrong mathematics ships`,
    );
    for (const bad of entry.rejects) {
      assert.equal(
        checkIntervention(tag, bad),
        false,
        `${tag}: "${bad}" is the misconception itself and must not be accepted`,
      );
    }
    continue;
  }

  assert.ok(typeof v.expr === "string", `${tag}: missing verify.expr`);

  if (v.assert) {
    assert.equal(evaluate(v.expr), true, `${tag}: asserted relation "${v.expr}" is false`);
  } else {
    const computed = evaluate(v.expr);
    assert.ok(
      near(computed, v.equals),
      `${tag}: ${v.expr} = ${computed}, but verify.equals says ${v.equals}`,
    );
    // …and the number the student is asked to produce must BE that number.
    // This is the assertion that catches a correct computation attached to the
    // wrong accepted answer.
    const numericAccepted = entry.accept
      .map((a) => Number(String(a).replace(/[−–—]/g, "-").replace(/[^\d.-]/g, "")))
      .filter((n) => Number.isFinite(n));
    assert.ok(
      numericAccepted.some((n) => near(n, computed)),
      `${tag}: computed ${computed} but accepts ${JSON.stringify(entry.accept)}`,
    );
  }
}

// ── Shape and voice ──
for (const [tag, entry] of Object.entries(INTERVENTIONS)) {
  assert.ok(MISCONCEPTIONS[tag], `${tag} is not a taxonomy id — it can never be reached`);
  assert.ok(entry.probe?.length > 10, `${tag}: probe is too short to be a real task`);
  assert.ok(entry.then?.length > 10, `${tag}: needs a line tying the probe back to the error`);
  assert.ok(Array.isArray(entry.accept) && entry.accept.length, `${tag}: needs accepted answers`);

  // The micro-task must not be the student's problem. It is shown at a second
  // miss, so anything that reads like a solution to the real item would be a
  // giveaway rather than a scaffold — hence small, self-contained numbers.
  assert.ok(
    !/your answer is|the answer to your problem/i.test(entry.then),
    `${tag}: the follow-up must point back at the student's problem, not solve it`,
  );
}

// ── Coverage: every taxonomy entry that a student can actually hit ──
{
  const taxonomy = Object.keys(MISCONCEPTIONS);
  const covered = coveredTags();
  const missing = taxonomy.filter((t) => !covered.includes(t));
  assert.deepEqual(
    missing,
    [],
    `every named misconception needs a second-level move; missing: ${missing.join(", ")}`,
  );
  assert.equal(covered.length, taxonomy.length, "no intervention may reference an unknown tag");
}

// ── interventionFor ──
{
  assert.equal(interventionFor(null), null);
  assert.equal(interventionFor("not-a-tag"), null);
  const got = interventionFor("ratio-inverted");
  assert.equal(got.tag, "ratio-inverted");
  assert.ok(got.probe.length);
}

// ── checkIntervention: loose enough for a twelve-year-old's typing ──
{
  assert.equal(checkIntervention("op-added-instead-of-multiplied", "12"), true);
  assert.equal(checkIntervention("op-added-instead-of-multiplied", " 12 "), true);
  assert.equal(checkIntervention("op-added-instead-of-multiplied", "12.0"), true);
  assert.equal(checkIntervention("op-added-instead-of-multiplied", "7"), false);
  assert.equal(checkIntervention("op-added-instead-of-multiplied", ""), false);

  // Unicode minus off a Chromebook and the word form both count.
  assert.equal(checkIntervention("sign-dropped", "−5"), true);
  assert.equal(checkIntervention("sign-dropped", "-5"), true);
  assert.equal(checkIntervention("sign-dropped", "negative 5"), true);
  assert.equal(checkIntervention("sign-dropped", "5"), false, "the sign is the whole point");

  // Word answers where the task asks for a comparison, not a number.
  assert.equal(checkIntervention("op-divided-instead-of-multiplied", "more"), true);
  assert.equal(checkIntervention("op-divided-instead-of-multiplied", "fewer"), false);

  // Ratio order matters — that IS the misconception.
  assert.equal(checkIntervention("ratio-inverted", "2:5"), true);
  assert.equal(checkIntervention("ratio-inverted", "5:2"), false);

  assert.equal(checkIntervention("not-a-tag", "12"), false);
}

console.log(
  `PASS misconception-interventions: ${coveredTags().length}/${Object.keys(MISCONCEPTIONS).length} tags covered, all arithmetic recomputed`,
);
