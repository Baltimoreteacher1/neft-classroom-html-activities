#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatrix,
  completionPatterns,
  functionStrengths,
  independentTrend,
  itemDifficulty,
  latestPerItem,
  learningBrief,
  MIN_EVIDENCE,
  misconceptionCounts,
  recommend,
  reviewQueue,
  revisionPatterns,
  rollup,
} from "../access-practice-lab/src/acc/analytics/evidence.js";

let t = 1_000;
const row = (o) => ({
  learner: "L1",
  sessionId: "s1",
  mode: "summative",
  status: "correct",
  correct: true,
  independent: true,
  supportTier: 0,
  attempts: 1,
  domain: "Reading",
  klu: "Explain",
  context: "Science",
  t: t++,
  ...o,
});
const mk = (n, o) =>
  Array.from({ length: n }, (_, i) =>
    row({ itemId: `${o.domain || "Reading"}-${o.klu || "Explain"}-${i}`, ...o }),
  );

test("a cell with no rows is no-evidence, with fewer than three it is not-enough, and neither reports a percentage", () => {
  const cells = buildMatrix([...mk(2, { klu: "Argue" })]);
  const empty = cells["Listening|Narrate|Mathematics"];
  assert.equal(empty.state, "no-evidence");
  assert.equal(empty.independentPct, null);
  const few = cells["Reading|Argue|Science"];
  assert.equal(few.state, "not-enough");
  assert.equal(few.independentPct, null);
  const shown = buildMatrix(mk(4, {}))["Reading|Explain|Science"];
  assert.equal(shown.state, "shown");
  assert.equal(shown.independentPct, 100);
});

test("supported success is not counted as independent, and speaking/writing review items are counted separately", () => {
  const rows = [
    ...mk(3, { domain: "Reading" }),
    ...mk(3, { domain: "Reading", klu: "Inform", independent: false, supportTier: 2, attempts: 2 }),
    ...mk(2, { domain: "Writing", status: "needs-review", correct: null, independent: false }),
  ];
  const cells = buildMatrix(rows);
  const reading = rollup(cells, "domain").Reading;
  assert.equal(reading.correct, 6);
  assert.equal(reading.independentCorrect, 3);
  assert.equal(reading.independentPct, 50);
  assert.equal(reading.scaffoldPct, 50);
  assert.equal(rollup(cells, "domain").Writing.needsReview, 2);
  assert.equal(rollup(cells, "domain").Writing.independentPct, null);
});

test("a re-sit replaces the earlier answer for the same item in the matrix", () => {
  const first = row({
    itemId: "i1",
    correct: false,
    status: "incorrect",
    independent: false,
    t: 1,
  });
  const second = row({ itemId: "i1", t: 2 });
  assert.equal(latestPerItem([first, second]).length, 1);
  assert.equal(latestPerItem([first, second])[0].correct, true);
});

test("trend is withheld below three sittings and reports direction from first to last", () => {
  const sitting = (id, pctRight, at) =>
    Array.from({ length: 10 }, (_, i) =>
      row({
        sessionId: id,
        itemId: `x${id}${i}`,
        independent: i < pctRight,
        correct: i < pctRight,
        status: i < pctRight ? "correct" : "incorrect",
        t: at,
      }),
    );
  assert.equal(independentTrend([...sitting("a", 8, 1), ...sitting("b", 7, 2)]).enough, false);
  assert.equal(
    independentTrend([...sitting("a", 8, 1), ...sitting("b", 7, 2), ...sitting("c", 4, 3)])
      .direction,
    "down",
  );
  assert.equal(
    independentTrend([...sitting("a", 3, 1), ...sitting("b", 5, 2), ...sitting("c", 8, 3)])
      .direction,
    "up",
  );
});

test("item difficulty needs three attempts and sorts hardest first", () => {
  const rows = [
    ...[1, 2, 3].map((n) =>
      row({
        itemId: "hard",
        learner: `L${n}`,
        independent: false,
        correct: false,
        status: "incorrect",
      }),
    ),
    ...[1, 2, 3].map((n) => row({ itemId: "easy", learner: `L${n}` })),
    row({ itemId: "rare" }),
  ];
  const d = itemDifficulty(rows);
  assert.deepEqual(
    d.map((x) => x.itemId),
    ["hard", "easy"],
  );
});

test("recommendations cite their evidence, never claim a level, and never fire on thin data", () => {
  assert.deepEqual(
    recommend(buildMatrix(mk(2, {})), mk(2, {})).filter((r) => r.type !== "missing-evidence"),
    [],
  );
  const weak = mk(4, { klu: "Argue", independent: false, correct: false, status: "incorrect" });
  const recs = recommend(buildMatrix(weak), weak);
  const argue = recs.find((r) => r.id === "klu-Argue");
  assert.ok(argue);
  assert.match(argue.text, /0 of 4/);
  assert.match(argue.text, /claims with their supporting reasons/);
  assert.equal(argue.evidence.objective, 4);
  const reliant = mk(5, { independent: false, supportTier: 1, attempts: 2 });
  assert.ok(recommend(buildMatrix(reliant), reliant).some((r) => r.type === "scaffold-reliance"));
  const pending = mk(2, {
    domain: "Speaking",
    status: "needs-review",
    correct: null,
    independent: false,
  });
  assert.match(
    recommend(buildMatrix(pending), pending).find((r) => r.id === "review-Speaking").text,
    /does not score speaking/,
  );
  for (const r of [...recs])
    assert.ok(
      !/\b(level \d|proficien\w+ level|scale score|will score|predict)/i.test(r.text),
      r.text,
    );
});

test("learning brief carries dates, strengths, priorities and the evidence limits", () => {
  const rows = [
    ...mk(5, { domain: "Reading", t: 5000 }),
    ...mk(5, {
      domain: "Listening",
      independent: false,
      correct: false,
      status: "incorrect",
      t: 9000,
    }),
  ];
  const b = learningBrief(rows, { learnerLabel: "Reader 7", now: 20000 });
  assert.equal(b.firstEvidence, 5000);
  assert.equal(b.lastEvidence, 9000);
  assert.deepEqual(
    b.strengths.map((s) => s.domain),
    ["Reading"],
  );
  assert.deepEqual(
    b.priorities.map((s) => s.domain),
    ["Listening"],
  );
  assert.ok(b.limitations.some((l) => /not a WIDA or ACCESS score/.test(l)));
  assert.ok(b.limitations.some((l) => /Section 504/.test(l)));
  assert.equal(MIN_EVIDENCE, 3);
});

test("language-function strengths, completion, revision and misconception patterns are counted from the rows and withheld when thin", () => {
  const rows = [
    ...mk(3, { functions: ["Compare or contrast"], itemId0: 1 }).map((r, i) => ({
      ...r,
      itemId: `cmp${i}`,
      functions: ["Compare or contrast"],
    })),
    ...mk(3, { functions: ["Make and support a claim"] }).map((r, i) => ({
      ...r,
      itemId: `cl${i}`,
      functions: ["Make and support a claim"],
      independent: false,
      correct: false,
      status: "incorrect",
      misconception: "uses a reason not in the text",
    })),
    ...mk(2, { functions: ["Describe"] }).map((r, i) => ({
      ...r,
      itemId: `d${i}`,
      functions: ["Describe"],
    })),
  ];
  const f = functionStrengths(rows);
  assert.equal(f.find((x) => x.fn === "Compare or contrast").independentPct, 100);
  assert.equal(f.find((x) => x.fn === "Make and support a claim").independentPct, 0);
  assert.equal(f.find((x) => x.fn === "Describe").independentPct, null, "two items is not enough");
  assert.deepEqual(misconceptionCounts(rows), [{ tag: "uses a reason not in the text", n: 3 }]);
  const recs = recommend(buildMatrix(rows), rows);
  assert.ok(
    recs.some(
      (r) => r.type === "language-function" && /Make and support a claim: 0 of 3/.test(r.text),
    ),
  );
  assert.ok(recs.some((r) => r.type === "misconception"));
  const learn = [1, 2, 3].map((n) =>
    row({
      itemId: `r${n}`,
      mode: "formative",
      attempts: 2,
      correct: false,
      status: "incorrect",
      independent: false,
    }),
  );
  assert.equal(revisionPatterns(learn).recoveredPct, 0);
  assert.equal(
    completionPatterns([
      ...mk(3, {}),
      ...mk(1, { status: "unanswered", correct: false, independent: false }).map((r) => ({
        ...r,
        itemId: "z",
      })),
    ]).Reading.unansweredPct,
    25,
  );
  const q = reviewQueue(
    [row({ itemId: "w", status: "needs-review", correct: null, learner: "L1", sessionId: "s1" })],
    new Set(["L1|s1|w"]),
  );
  assert.equal(q.length, 0, "a reviewed response leaves the queue");
});
