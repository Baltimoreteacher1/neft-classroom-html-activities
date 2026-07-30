#!/usr/bin/env node
/* ==========================================================================
 * retrieval.test.mjs — gates for spaced retrieval.
 *
 * Two failure modes are guarded here, and they are the two that would be
 * invisible in a browser:
 *
 *  1. THE BANK MUST BE ANSWERABLE AWAY FROM ITS LESSON. Every item is lifted
 *     out of the config that authored it, so a stem reading "which value does
 *     the table above show?" becomes an unanswerable question with a scored
 *     wrong answer attached. The student is not wrong; the card is. A source
 *     gate is the only thing that can catch it, because the card renders fine.
 *
 *  2. THE SCHEDULE MUST ACTUALLY SPACE. A scheduler whose interval never grows
 *     looks identical from the outside to one that works — the student just
 *     sees reviews — while delivering none of the spacing that makes retrieval
 *     worth doing. The Leitner promotion/demotion is asserted against an
 *     injected clock rather than hoped for.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { selectReviewItems } from "../engine/core/retrieval.js";
import {
  buildBank,
  isPortable,
  OUTPUT,
  reviewStem,
  serialize,
} from "../scripts/generate-retrieval-bank.mjs";

let checks = 0;

// ── 1. The committed artifact matches its generator ────────────────────────
{
  const expected = serialize(buildBank());
  const actual = readFileSync(OUTPUT, "utf8");
  checks += 1;
  assert.equal(
    actual,
    expected,
    "data/retrieval-bank.json is stale — run: node scripts/generate-retrieval-bank.mjs",
  );
}

const bank = JSON.parse(readFileSync(OUTPUT, "utf8"));

// ── 2. Portability rules actually reject what they claim to ────────────────
checks += 1;
assert.equal(
  isPortable({
    type: "multiple-choice",
    stem: "Which value does the table above show for 6 hours?",
    choices: ["12", "18", "24"],
    correctIndex: 0,
  }),
  false,
  "a stem referring to 'the table above' must be rejected",
);

checks += 1;
assert.equal(
  isPortable({
    type: "multiple-choice",
    stem: "What is 15% of 60?",
    choices: ["9", "9", "45"],
    correctIndex: 0,
  }),
  false,
  "duplicate choices mean two correct buttons — must be rejected",
);

checks += 1;
assert.equal(
  isPortable({
    type: "multiple-choice",
    stem: "What is 15% of 60?",
    choices: ["9", "15", "45"],
    correctIndex: 0,
    diagram: { kind: "tape" },
  }),
  false,
  "an item that needs its own figure cannot travel",
);

checks += 1;
assert.equal(
  isPortable({
    type: "multiple-choice",
    stem: "What is 15% of 60?",
    choices: ["9", "15", "45"],
    correctIndex: 0,
  }),
  true,
  "a self-contained numeric item is portable",
);

checks += 1;
assert.equal(
  reviewStem("(Lesson 4.4) A student scored 72 out of 90."),
  "A student scored 72 out of 90.",
  "the lesson prefix is stripped from review stems",
);

// ── 3. Every banked item survives its own rules ────────────────────────────
for (const [standard, items] of Object.entries(bank.bank)) {
  for (const item of items) {
    checks += 1;
    assert.ok(
      isPortable({ ...item, type: "multiple-choice" }),
      `${standard}: banked item is not portable — "${item.stem.slice(0, 60)}"`,
    );
    checks += 1;
    assert.ok(
      !/\b(above|below|shown)\b/i.test(item.stem),
      `${standard}: banked stem references something not on the card — "${item.stem.slice(0, 60)}"`,
    );
  }
}

// ── 4. Selection: never today's standard, capped, rotating ─────────────────
{
  const due = [
    { standard: "6.NOS.1", box: 0 },
    { standard: "6.AT.4", box: 1 },
    { standard: "6.GR.1", box: 2 },
    { standard: "6.DS.4", box: 0 },
  ];
  const picks = selectReviewItems(due, bank.bank, { exclude: "6.AT.4" });
  checks += 1;
  assert.ok(picks.length <= 3, "the opener is capped at three items");
  checks += 1;
  assert.equal(
    picks.some((p) => p.standard === "6.AT.4"),
    false,
    "today's standard is never reviewed — it is about to be taught",
  );
  checks += 1;
  assert.ok(
    picks.every((p) => p.item && p.item.stem && Array.isArray(p.item.choices)),
    "every pick carries a real item",
  );

  // A standard with no bank entry is skipped, not rendered empty.
  const picksMissing = selectReviewItems([{ standard: "6.ZZ.9", box: 0 }], bank.bank);
  checks += 1;
  assert.deepEqual(picksMissing, [], "a standard absent from the bank yields no card");

  // Rotation: a different box must be able to surface a different question.
  const first = selectReviewItems([{ standard: "6.NOS.1", box: 0 }], bank.bank)[0];
  const later = selectReviewItems([{ standard: "6.NOS.1", box: 3 }], bank.bank)[0];
  checks += 1;
  assert.notEqual(
    first.item.stem,
    later.item.stem,
    "a student on a later box meets a different question, not the same card again",
  );
}

// ── 5. The Leitner schedule, against an injected clock ─────────────────────
{
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://eduwonderlab.com/",
  });
  globalThis.window = dom.window;
  globalThis.localStorage = dom.window.localStorage;
  await import("../assets/nt-signal.js");
  const S = dom.window.NTSignal;

  const DAY = 24 * 60 * 60 * 1000;
  const t0 = 1_700_000_000_000;

  // Two attempts is below the threshold: not enough history for a RE-trial.
  S.record({ standard: "6.NOS.1", correct: true });
  S.record({ standard: "6.NOS.1", correct: true });
  checks += 1;
  assert.deepEqual(
    S.dueStandards(3, t0 + 90 * DAY).map((d) => d.standard),
    [],
    "a standard with fewer than 3 attempts is never scheduled",
  );

  S.record({ standard: "6.NOS.1", correct: true });
  checks += 1;
  assert.equal(S.dueStandards(3, t0).length, 0, "a standard practised moments ago is not due");
  checks += 1;
  assert.equal(
    S.dueStandards(3, Date.now() + 2 * DAY)[0]?.standard,
    "6.NOS.1",
    "box 0 comes due after one day",
  );

  // Correct recall promotes: box 1 -> 3-day interval, so 2 days is too soon.
  S.recordReview("6.NOS.1", true, Date.now());
  checks += 1;
  assert.equal(
    S.dueStandards(3, Date.now() + 2 * DAY).length,
    0,
    "a successful recall pushes the next review past two days",
  );
  checks += 1;
  assert.equal(
    S.dueStandards(3, Date.now() + 4 * DAY)[0]?.standard,
    "6.NOS.1",
    "box 1 comes due after three days",
  );

  // Promote twice more, then miss: the interval must collapse, not decay.
  S.recordReview("6.NOS.1", true, Date.now());
  S.recordReview("6.NOS.1", true, Date.now());
  checks += 1;
  assert.equal(
    S.dueStandards(3, Date.now() + 10 * DAY).length,
    0,
    "three successful recalls space the standard beyond ten days",
  );

  S.recordReview("6.NOS.1", false, Date.now());
  checks += 1;
  assert.equal(
    S.dueStandards(3, Date.now() + 2 * DAY)[0]?.standard,
    "6.NOS.1",
    "a miss resets the interval to the shortest box, not to the next one down",
  );

  // Most overdue first.
  S.record({ standard: "6.AT.4", correct: false });
  S.record({ standard: "6.AT.4", correct: false });
  S.record({ standard: "6.AT.4", correct: false });
  S.recordReview("6.AT.4", false, Date.now() - 40 * DAY);
  const order = S.dueStandards(5, Date.now() + 2 * DAY).map((d) => d.standard);
  checks += 1;
  assert.equal(order[0], "6.AT.4", "the most overdue standard is offered first");
}

console.log(
  `spaced retrieval: ${bank.items} banked items across ${bank.standards} standards, ${checks} checks passed.`,
);
