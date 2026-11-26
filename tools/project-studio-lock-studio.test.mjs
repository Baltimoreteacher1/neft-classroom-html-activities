/**
 * Pure-logic tests for the Project Studio lock studio (equations missions unit-8-a, unit-8-b, unit-8-c).
 * Solutions, clue outcomes and balance steps are recomputed INDEPENDENTLY (plain BigInt fractions,
 * brute force over whole numbers), and negative controls prove corrupted locks are rejected.
 */
import assert from "node:assert/strict";
import { hiddenAnswers, isHidden } from "../curriculum/projects/studio/answer-guard.mjs";
import { addCheckpoint, cleanCheckpoints } from "../curriculum/projects/studio/checkpoints.mjs";
import { DESIGNERS } from "../curriculum/projects/studio/designers.mjs";
import { parse, show } from "../curriculum/projects/studio/exact.mjs";
import {
  buildQ,
  cleanLocks,
  gate,
  holds,
  locksReport,
  misread,
  smallestWhole,
  solveLock,
  timeline,
  trackerTotal,
  tryCode,
  validatePuzzle,
  wholeOutcomes,
} from "../curriculum/projects/studio/lock-model.mjs";
import { model } from "../curriculum/projects/studio/math.mjs";
import { PROJECTS } from "../curriculum/projects/studio/projects.mjs";

let n = 0;
const test = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`FAIL ${name}`);
    throw e;
  }
};
const g = (a, b) => (b ? g(b, a % b) : a < 0n ? -a : a);
const R = (p, q = 1n) => {
  if (q < 0n) [p, q] = [-p, -q];
  const k = g(p, q) || 1n;
  return `${p / k}/${q / k}`;
};
const asR = (f) => R(f.n, f.d);
const txt = (s) => asR(parse(s));

test("solveLock: substituting the solution back reproduces q exactly (random rationals)", () => {
  const vals = ["3", "7", "12", "1/2", "2.5", "3/4", "1 1/3", "0", "20"];
  for (const p of vals)
    for (const q of vals) {
      const P = parse(p),
        Q = parse(q);
      const add = solveLock({ kind: "add", p, q });
      // independent: x = q - p
      assert.equal(asR(add.x), R(Q.n * P.d - P.n * Q.d, Q.d * P.d));
      const mul = solveLock({ kind: "mul", p, q });
      if (P.n === 0n) assert.equal(mul.error, "zero");
      else assert.equal(asR(mul.x), R(Q.n * P.d, Q.d * P.n));
    }
});

test("buildQ then solve returns the secret; a corrupted q is rejected (negative control)", () => {
  for (const secret of ["7", "5/2", "0.6", "12"])
    for (const [kind, p] of [
      ["add", "5"],
      ["mul", "4"],
      ["mul", "3/2"],
      ["add", "1/3"],
    ]) {
      const q = show(buildQ(kind, parse(p), parse(secret)));
      const data = cleanLocks({ secret, locks: [{ id: "L1", kind, p, q }] });
      assert.ok(validatePuzzle(data).locks[0].matches, `${kind} ${p} ${secret}`);
      const bad = cleanLocks({
        secret,
        locks: [
          {
            id: "L1",
            kind,
            p,
            q: show(parse(q).n === 0n ? parse("1") : parse(`${parse(q).n + 1n}/${parse(q).d}`)),
          },
        ],
      });
      assert.ok(!validatePuzzle(bad).locks[0].matches);
      assert.ok(!validatePuzzle(bad).ready);
    }
});

test("mission equations: locks built from the design reproduce math.mjs answers", () => {
  for (const p of PROJECTS.filter((x) => x.family === "equations")) {
    const m = model(p, p.defaults);
    const { a, b, c } = m.values;
    const ans = Object.fromEntries(m.checks.map((q) => [q.id, q.answer]));
    assert.equal(
      txt(show(solveLock({ kind: "add", p: String(b), q: String(a + b) }).x)),
      R(BigInt(ans.addition)),
    );
    assert.equal(
      txt(show(solveLock({ kind: "mul", p: String(c), q: String(c * a) }).x)),
      R(BigInt(ans.multiplication)),
    );
    assert.equal(
      asR(trackerTotal({ kind: "add", p: String(b) }, String(a))),
      R(BigInt(ans.substitution)),
    );
    assert.equal(asR(smallestWhole(">=", parse(String(a)))), R(BigInt(ans.boundary)));
    assert.equal(asR(smallestWhole(">", parse(String(a)))), R(BigInt(ans.strict)));
    // the near answer a + 1 is too high on c·x = c·a (the "difference" question)
    const r = tryCode({ kind: "mul", p: String(c), q: String(c * a) }, String(a + 1));
    assert.ok(!r.open && r.side === "high");
    assert.ok(tryCode({ kind: "mul", p: String(c), q: String(c * a) }, String(a)).open);
  }
});

test("clues: whole-number outcomes agree with brute force over 0..200", () => {
  const ops = [">=", ">", "<=", "<"];
  const ks = ["0", "3", "7", "7.5", "12", "15/2", "40"];
  let seed = 11;
  const rnd = (k) => {
    seed = (seed * 48271) % 2147483647;
    return seed % k;
  };
  for (let trial = 0; trial < 300; trial++) {
    const clues = Array.from({ length: 1 + rnd(3) }, (_, i) => ({
      id: `C${i + 1}`,
      op: ops[rnd(4)],
      k: ks[rnd(ks.length)],
    }));
    const brute = [];
    for (let w = 0; w <= 200; w++)
      if (
        clues.every((c) => {
          const k = Number(parse(c.k).n) / Number(parse(c.k).d);
          return c.op === ">=" ? w >= k : c.op === ">" ? w > k : c.op === "<=" ? w <= k : w < k;
        })
      )
        brute.push(w);
    const o = wholeOutcomes(clues);
    if (!brute.length) assert.ok(o.empty, JSON.stringify(clues));
    else {
      assert.equal(Number(o.lo.n), brute[0]);
      if (o.count !== null) assert.equal(o.count, brute.length, JSON.stringify(clues));
      else assert.equal(brute[brute.length - 1], 200);
    }
  }
});

test("boundary misread: a secret on the boundary of ≥ is fragile; > widens", () => {
  assert.equal(misread(">="), ">");
  const data = cleanLocks({
    secret: "9",
    clues: [
      { id: "C1", op: ">=", k: "9" },
      { id: "C2", op: ">", k: "6" },
      { id: "C3", op: ">", k: "9" },
    ],
  });
  const v = validatePuzzle(data);
  assert.ok(v.clues[0].holds && v.clues[0].fragile);
  assert.ok(v.clues[1].holds && !v.clues[1].fragile && v.clues[1].widened);
  assert.equal(v.clues[2].holds, false);
  assert.ok(!v.consistent);
  assert.deepEqual(gate(data.clues.slice(0, 2), "9"), { pass: true, failed: [] });
  assert.equal(gate([{ id: "C1", op: ">", k: "9" }], "9").failed[0].why, "boundary");
  assert.equal(gate([{ id: "C1", op: ">=", k: "9" }], "4").failed[0].why, "below");
});

test("balance timeline: valid inverse step solves; a one-side step tips the beam and is flagged", () => {
  const lock = { id: "L1", kind: "add", p: "5", q: "12" };
  const good = timeline(lock, [{ op: "-", k: "5", side: "both" }]);
  assert.ok(good[1].valid && good[1].equivalent && good[1].solved);
  assert.equal(asR(good[1].state.right.c), R(7n)); // independent: 12 − 5
  const bad = timeline(lock, [{ op: "-", k: "5", side: "left" }]);
  assert.ok(!bad[1].valid && !bad[1].equivalent && !bad[1].solved);
  assert.equal(bad[1].tilt, -1); // left side (x) is now lighter than 12 at the true x = 7
  // rewinding then replaying a prefix gives the same states (timeline is deterministic)
  const two = timeline(lock, [
    { op: "+", k: "3", side: "both" },
    { op: "-", k: "8", side: "both" },
  ]);
  assert.deepEqual(two.slice(0, 2), timeline(lock, [{ op: "+", k: "3", side: "both" }]));
  assert.ok(two[2].solved);
  const mul = timeline({ id: "L2", kind: "mul", p: "3/2", q: "6" }, [
    { op: "/", k: "3/2", side: "both" },
  ]);
  assert.ok(mul[1].solved);
  assert.equal(asR(mul[1].state.right.c), R(4n)); // independent: 6 ÷ 3/2
  const zero = timeline({ id: "L3", kind: "mul", p: "4", q: "8" }, [
    { op: "*", k: "0", side: "both" },
  ]);
  assert.equal(zero[1].error, "zero");
  assert.deepEqual(zero[1].state, zero[0].state);
});

test("tracker: total and goal inequality with the boundary", () => {
  assert.equal(asR(trackerTotal({ kind: "mul", p: "5" }, "12")), R(60n));
  assert.ok(holds(">=", parse("60"), parse("60")));
  assert.ok(!holds(">", parse("60"), parse("60")));
});

test("hidden-answer guard covers every equations answer until checked", () => {
  const p = PROJECTS.find((x) => x.id === "unit-8-a");
  const state = { design: { ...p.defaults }, checked: {}, role: "student" };
  const hidden = hiddenAnswers(p, state);
  for (const q of model(p, state.design).checks)
    assert.ok(isHidden(hidden, parse(String(q.answer))), q.id);
});

test("clean, checkpoint round trip, and a report that masks a rebuilt answer", () => {
  const junk = cleanLocks({
    secret: "abc",
    locks: [
      { id: "L1", kind: "pow", p: "2", q: "4" },
      { id: "L2", kind: "add", p: "-3", q: "4" },
      { id: "L3", kind: "add", p: "3", q: "10" },
    ],
    clues: [{ id: "C1", op: "!=", k: "3" }],
    steps: {
      L3: [
        { op: "%", k: "1", side: "both" },
        { op: "-", k: "3", side: "both" },
      ],
    },
    tries: ["5", "x"],
  });
  assert.equal(junk.secret, "");
  assert.deepEqual(
    junk.locks.map((l) => l.id),
    ["L3"],
  );
  assert.equal(junk.clues.length, 0);
  assert.deepEqual(junk.steps.L3, [{ op: "-", k: "3", side: "both" }]);
  assert.deepEqual(junk.tries, ["5"]);
  const p = PROJECTS.find((x) => x.id === "unit-8-c");
  assert.equal(DESIGNERS.equations.key, "locks");
  const { a, b } = p.defaults;
  const data = cleanLocks({
    secret: String(a),
    locks: [{ id: "L1", kind: "add", p: String(b), q: String(a + b), auto: true }],
    clues: [{ id: "C1", op: ">=", k: String(a) }],
    steps: { L1: [{ op: "-", k: String(b), side: "left" }] },
  });
  const { list } = addCheckpoint(p, [], {
    name: "Chain",
    reason: "test",
    design: p.defaults,
    matched: 0,
    extra: data,
  });
  assert.deepEqual(cleanCheckpoints(p, list)[0].extra, data);
  const text = DESIGNERS.equations.report(data, model(p, p.defaults).values).join("\n");
  assert.match(text, new RegExp(`x \\+ ${b} = \\?`));
  assert.ok(!text.includes(`= ${a + b}`), "rebuilt q = a + b must be masked");
  assert.match(text, /1 flagged as invalid/);
  assert.match(text, /boundary test/);
  assert.deepEqual(locksReport(cleanLocks(null), null), []);
});

console.log(`project-studio-lock-studio: ${n} tests passed`);
