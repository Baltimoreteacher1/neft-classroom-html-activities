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
import { selectReviewItems, taughtBefore } from "../engine/core/retrieval.js";
import {
  buildBank,
  isPortable,
  OUTPUT,
  reviewStem,
  serialize,
} from "../scripts/generate-retrieval-bank.mjs";
import { buildInstructionalSequence } from "../shared/curriculum/instructional-sequence.js";

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

// ── 4b. Scope: only lessons taught EARLIER in the district's sequence ────────
{
  // The artifact's sequence IS the instructional sequence (paced lessons, in
  // taught order) — not a lesson-number sort. 6-1 is the fourth lesson of the
  // year (Pre-Unit), not the one after 5-10.
  const read = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
  const live = buildInstructionalSequence({
    ranges: read("data/pacing-unit-ranges.json"),
    authored: read("data/pacing-unit-lessons.json"),
    manifest: read("data/curriculum-launch-manifest.json"),
  });
  const pacedOrder = live.order.filter((id) => live.entries.get(id)?.paced);
  checks += 1;
  assert.deepEqual(
    bank.sequence.map((e) => e.id),
    pacedOrder,
    "the bank's sequence must be the paced instructional order, nothing else",
  );
  checks += 1;
  assert.deepEqual(
    taughtBefore(bank.sequence, "6-1").map((e) => e.id),
    ["2-7", "2-6", "1-1"],
    "before 6-1 (Pre-Unit) come 2-7, 2-6, 1-1 — most recent first — never 5-10",
  );
  checks += 1;
  assert.deepEqual(
    taughtBefore(bank.sequence, "6-1-group2"),
    taughtBefore(bank.sequence, "6-1"),
    "a variant inherits its parent's position",
  );
  checks += 1;
  assert.deepEqual(
    taughtBefore(bank.sequence, "1-1"),
    [],
    "the course opener has nothing to remember",
  );
  checks += 1;
  assert.deepEqual(taughtBefore(bank.sequence, "1-3"), [], "an unpaced lesson has no position");

  // Scoped selection: yesterday's lesson is the Warm-Up's, today's standard is
  // about to be taught, and a due standard from a unit the class has not met
  // is refused even though the device says it is due.
  const before35 = taughtBefore(bank.sequence, "3-5");
  const today = bank.sequence.find((e) => e.id === "3-5").standard;
  const yesterday = before35[0].standard;
  // A standard NO earlier lesson taught (a code can recur across lessons, so
  // "the last lesson's standard" is not automatically unseen).
  const seen = new Set(before35.map((e) => e.standard));
  const at35 = bank.sequence.findIndex((e) => e.id === "3-5");
  const laterStd = bank.sequence
    .slice(at35 + 1)
    .map((e) => e.standard)
    .find((std) => std && !seen.has(std) && std !== today && bank.bank[std]);
  checks += 1;
  assert.ok(laterStd, "the sequence has a not-yet-taught standard with banked items to refuse");
  const due = [
    { standard: laterStd, box: 2 },
    { standard: yesterday, box: 1 },
    { standard: today, box: 0 },
  ];
  const scoped = selectReviewItems(due, bank.bank, { exclude: today, before: before35 });
  checks += 1;
  assert.ok(scoped.length > 0 && scoped.length <= 3, "a lesson with history gets a capped review");
  checks += 1;
  assert.ok(
    scoped.every(
      (p) => p.standard !== today && p.standard !== yesterday && p.standard !== laterStd,
    ),
    "scoped picks never include today, yesterday, or a not-yet-taught standard",
  );
  const allowed = new Set(before35.slice(1).map((e) => e.standard));
  checks += 1;
  assert.ok(
    scoped.every((p) => allowed.has(p.standard)),
    "every scoped pick is a standard some earlier lesson taught",
  );
  checks += 1;
  assert.ok(
    scoped.every((p) => p.lesson && before35.some((e) => e.id === p.lesson)),
    "every scoped pick names the earlier lesson it comes from",
  );
  // A recurring standard code must not smuggle in a question written for a
  // lesson the class has not met: every scoped item was authored in a met lesson.
  const metIds = new Set(before35.map((e) => e.id));
  checks += 1;
  assert.ok(
    scoped.every((p) => metIds.has(p.item.lesson)),
    "every scoped item was authored in a lesson taught before today's",
  );
  // 6-1's history is 2-7, 2-6, 1-1: yesterday's 2-7 is the Warm-Up's, and 1-1
  // "Math is Mine" is MPP.3 — a practice standard with nothing to retrieve.
  const picks61 = selectReviewItems([], bank.bank, {
    exclude: "6.NOS.1",
    before: taughtBefore(bank.sequence, "6-1"),
  });
  checks += 1;
  assert.deepEqual(
    picks61.map((p) => p.lesson),
    ["2-6"],
    "on 6-1 a fresh device remembers 2-6 only — not yesterday's 2-7, not MPP 1-1, never 5-10",
  );
  // Due-first inside the scope: a due standard the class HAS met leads.
  // (3-4 and 3-3 share a standard, so "the first earlier lesson with banked
  // items" can be yesterday's code — which is rightly refused. Pick one that
  // is neither yesterday's nor today's.)
  const dueInScope = before35
    .slice(1)
    .find((e) => bank.bank[e.standard] && e.standard !== yesterday && e.standard !== today);
  const led = selectReviewItems([{ standard: dueInScope.standard, box: 1 }], bank.bank, {
    exclude: today,
    before: before35,
  });
  checks += 1;
  assert.equal(
    led[0]?.standard,
    dueInScope.standard,
    "a due standard inside the scope is asked first",
  );
  /* THE ONE-QUESTION BONUS MUST STILL SPACE.
   *
   * The warm-up asks a single Remember When as a bonus. With SPREAD taken in a
   * FIXED order that single pick is always offset 0 — the lesson before
   * yesterday's — on every lesson of the year, and the week-ago / fortnight-ago
   * reach that makes spaced retrieval work is never asked at all.
   *
   * This is asserted on a SYNTHETIC history where every candidate is usable, on
   * purpose. Measured over the real sequence the difference is only a skew
   * (offset 0 wins 49% of lessons unrotated vs 21% rotated) because real
   * candidates are often unusable and fall through to the next offset anyway —
   * a property test over real data PASSES against the fixed order and would
   * have been a gate that never fires. Here all three offsets are always
   * available, so consecutive positions must ask three DIFFERENT distances or
   * the rotation is gone.
   */
  {
    const item = (lesson) => ({
      type: "multiple-choice",
      stem: `In lesson ${lesson}, what is 2 + 2?`,
      choices: ["3", "4", "5"],
      correctIndex: 1,
    });
    /* 20 lessons back, each teaching its own standard with one banked item, so
     * `usable()` never rejects a candidate and the offset chosen is purely the
     * scheduler's decision. */
    const history = Array.from({ length: 20 }, (_v, i) => ({
      id: `T-${i}`,
      standard: `T.STD.${i}`,
    }));
    const fixture = Object.fromEntries(
      history.map((e) => [e.standard, [{ lesson: e.id, ...item(e.id) }]]),
    );
    const pickAt = (length) =>
      selectReviewItems([], fixture, {
        exclude: "T.TODAY",
        // before.length drives the rotation, so vary the history LENGTH while
        // keeping every candidate identical in kind.
        before: history.slice(0, length),
        max: 1,
      })[0];

    const runs = [pickAt(18), pickAt(19), pickAt(20)];
    checks += 1;
    assert.ok(
      runs.every(Boolean),
      "the synthetic history produced no pick — the fixture no longer exercises the scheduler",
    );
    const offsets = runs.map((p, i) =>
      history
        .slice(0, 18 + i)
        .slice(1)
        .findIndex((e) => e.id === p.lesson),
    );
    checks += 1;
    assert.equal(
      new Set(offsets).size,
      3,
      `three consecutive lessons asked distances ${offsets.join(", ")} — the bonus is not ` +
        "rotating through SPREAD, so it only ever asks about the lesson before yesterday's",
    );
    checks += 1;
    assert.deepEqual(
      [...offsets].sort((a, b) => a - b),
      [0, 3, 8],
      "the rotation no longer covers the authored spread (recent / ~a week / ~a fortnight)",
    );
    // PURE: the same position asks the same distance every time. A clock or a
    // random seed here would make the schedule unassertable and unteachable.
    checks += 1;
    assert.equal(pickAt(18).lesson, pickAt(18).lesson, "the bonus pick is not deterministic");
    checks += 1;
    assert.equal(
      pickAt(19).lesson,
      runs[1].lesson,
      "the bonus pick changed between two identical calls",
    );
  }

  /* COVERAGE, over the real sequence.
   *
   * A lesson with nothing to remember correctly renders no bonus, so "some
   * lessons have none" is not by itself a defect — but it is exactly how a
   * broken scope, a stale bank or an over-tight filter would present: silently,
   * as a warm-up that simply has no bonus today. A floor turns that from
   * invisible into a failure.
   *
   * The legitimate gaps are the OPENING of the year. Remember When may only ask
   * about lessons taught before today's, and never yesterday's (that is the
   * Warm-Up's job directly above it), so the first lessons of the district
   * sequence have nothing left to reach back to. Asserted as a position rule,
   * not as a hardcoded id list, so re-paced units do not need an edit here. */
  {
    const missing = [];
    for (const entry of bank.sequence) {
      const hist = taughtBefore(bank.sequence, entry.id);
      const pick = selectReviewItems([], bank.bank, {
        exclude: entry.standard,
        before: hist,
        max: 1,
      });
      if (!pick.length) missing.push({ id: entry.id, at: hist.length });
    }
    const covered = bank.sequence.length - missing.length;
    checks += 1;
    assert.ok(
      covered >= Math.round(bank.sequence.length * 0.9),
      `only ${covered}/${bank.sequence.length} paced lessons render a Remember When bonus — ` +
        `missing: ${missing.map((m) => m.id).join(", ")}`,
    );
    checks += 1;
    assert.deepEqual(
      missing.filter((m) => m.at > 3).map((m) => m.id),
      [],
      "a lesson with real history renders no bonus — the scope or the bank is broken, " +
        "not the calendar",
    );
  }

  // No history at all → the old behaviour: due standards only, nothing invented.
  checks += 1;
  assert.deepEqual(
    selectReviewItems([], bank.bank, { exclude: today, before: [] }),
    [],
    "with no sequence position and nothing due, nothing renders",
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
