// Anonymous item analytics (spec 4.4, G-34 style): aggregate-only, minimum cell size 10, complementary suppression.
// An independent attacker enumerates every table consistent with the PUBLISHED numbers and reports any small cell
// whose size it can pin exactly. Negative control: publishing with primary suppression only must be flagged.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRng } from "../shared/fixtures/index.js";
import {
  assertAnonymousEvent,
  buildItemTable,
  differencingLeaks,
  publishAll,
  publishItem,
  publishWithAtoms,
  suppressCells,
} from "../shared/learner/index.js";

const MIN = 10;

/** rows: [option, slice, tier, count]; key is option `key`. */
function events(itemId, key, optionCount, rows, extra = {}) {
  return rows.flatMap(([option, slice, tier, count]) =>
    Array.from({ length: count }, () => ({
      itemId,
      key,
      option,
      optionCount,
      slice,
      tier,
      timeSec: 20,
      hinted: false,
      ...extra,
    })),
  );
}

const SLICES = ["A", "B"];
const OPTIONS = [0, 1];
const ATOMS = OPTIONS.flatMap((o) => SLICES.map((s) => [o, s]));

/** Attacker: every non-negative table consistent with the published cells; returns the cells it can pin exactly. */
function pinned(published, truth, maxAtom = 40) {
  const cons = [];
  for (const c of published) {
    if (c.suppressed) continue;
    const idx = ATOMS.flatMap(([o, s], i) => {
      const hit =
        c.kind === "total" ||
        c.kind === "tier" ||
        (c.kind === "option" && c.ref === o) ||
        (c.kind === "slice" && c.ref === s) ||
        (c.kind === "failure" && o !== 0);
      return hit ? [i] : [];
    });
    cons.push({ idx, n: c.attempts });
  }
  const targets = [...ATOMS.map((_, i) => [i]), ...truth.cells.map((c) => c.idx)];
  const lo = targets.map(() => Infinity);
  const hi = targets.map(() => -Infinity);
  const x = [0, 0, 0, 0];
  const ok = (upto) =>
    cons.every((c) => Math.max(...c.idx) !== upto || c.idx.reduce((n, i) => n + x[i], 0) === c.n);
  const rec = (i) => {
    if (i === 4) {
      targets.forEach((t, k) => {
        const v = t.reduce((n, a) => n + x[a], 0);
        if (v < lo[k]) lo[k] = v;
        if (v > hi[k]) hi[k] = v;
      });
      return;
    }
    for (let v = 0; v <= maxAtom; v++) {
      x[i] = v;
      if (ok(i)) rec(i + 1);
    }
  };
  rec(0);
  return targets.flatMap((t, k) => {
    const n = t.reduce((s, a) => s + truth.atoms[a], 0);
    return n > 0 && n < MIN && lo[k] === hi[k] ? [{ cell: t, n }] : [];
  });
}

function truthOf(rows) {
  const atoms = ATOMS.map(([o, s]) => rows.find((r) => r[0] === o && r[1] === s)[3]);
  const cell = (test) => ATOMS.flatMap(([o, s], i) => (test(o, s) ? [i] : []));
  return {
    atoms,
    cells: [
      { idx: cell(() => true) },
      ...OPTIONS.map((q) => ({ idx: cell((o) => o === q) })),
      ...SLICES.map((q) => ({ idx: cell((_, s) => s === q) })),
    ],
  };
}

const publishSafe = (evs) => publishWithAtoms(evs)[0];
function publishNaive(evs) {
  const item = [...buildItemTable(evs).values()][0];
  const safe = publishItem(item);
  return {
    ...safe,
    cells: safe._family.map((c) => {
      const n = c.atoms.reduce((s, a) => s + item.atoms.get(a).n, 0);
      return n < MIN
        ? { id: c.id, kind: c.kind, ref: c.ref, suppressed: true }
        : { id: c.id, kind: c.kind, ref: c.ref, suppressed: false, attempts: n };
    }),
  };
}

// Crafted: slice B has 8 attempts, option 1 has 7. Total 20, slice A 12, option 0 13 are all publishable alone.
const CRAFT = [
  [0, "A", "mid", 8],
  [1, "A", "mid", 4],
  [0, "B", "mid", 5],
  [1, "B", "mid", 3],
];

test("cells under 10 are suppressed and carry no numbers", () => {
  const out = publishAll(events("it1", 0, 2, CRAFT));
  const small = out[0].cells.find((c) => c.id === "option:1");
  assert.equal(small.suppressed, true);
  assert.deepEqual(Object.keys(small).sort(), ["id", "kind", "ref", "suppressed"]);
  assert.equal(
    publishAll(
      events("tiny", 0, 2, [
        [0, "A", "mid", 4],
        [1, "A", "mid", 3],
      ]),
    )[0].cells.every((c) => c.suppressed),
    true,
  );
});

test("crafted differencing: primary suppression alone is isolatable (negative control)", () => {
  const rows = CRAFT;
  const naive = pinned(publishNaive(events("it1", 0, 2, rows)).cells, truthOf(rows));
  assert.ok(naive.length > 0, "attacker must find a pinned small cell in the naive publication");
});

test("crafted differencing: complementary suppression leaves nothing pinned", () => {
  const out = publishSafe(events("it1", 0, 2, CRAFT));
  assert.deepEqual(pinned(out.cells, truthOf(CRAFT)), []);
  const suppressed = out.cells.filter((c) => c.suppressed).map((c) => c.id);
  assert.ok(suppressed.length >= 3, `extra cells suppressed: ${suppressed}`);
  assert.deepEqual(
    differencingLeaks(
      out._family.map((c) => ({
        ...c,
        suppressed: out.cells.find((x) => x.id === c.id).suppressed,
      })),
      out._atomN,
    ),
    [],
  );
});

test("random crafted tables: complementary suppression never lets the attacker pin a small cell", () => {
  const rng = createRng("g34-learner");
  let naiveLeaks = 0;
  for (let t = 0; t < 24; t++) {
    const rows = ATOMS.map(([o, s]) => [o, s, "mid", rng.int(1, 10)]);
    const evs = events(`r${t}`, 0, 2, rows);
    const truth = truthOf(rows);
    assert.deepEqual(pinned(publishSafe(evs).cells, truth), [], `table ${JSON.stringify(rows)}`);
    if (pinned(publishNaive(evs).cells, truth).length) naiveLeaks++;
  }
  assert.ok(naiveLeaks >= 5, `the attacker has teeth: ${naiveLeaks} naive leaks`);
});

test("suppressCells: a lone suppressed cell forces a second one; large groups publish untouched", () => {
  const atomN = new Map([
    ["x", 6],
    ["y", 30],
    ["z", 40],
  ]);
  const cells = [
    { id: "total", atoms: ["x", "y", "z"] },
    { id: "px", atoms: ["x"] },
    { id: "py", atoms: ["y"] },
    { id: "pz", atoms: ["z"] },
  ];
  const out = suppressCells(cells, atomN);
  assert.equal(out.find((c) => c.id === "px").suppressed, true);
  assert.equal(out.filter((c) => c.suppressed).length >= 2, true);
  const big = suppressCells(
    cells.slice(0, 1),
    new Map([
      ["x", 50],
      ["y", 30],
      ["z", 40],
    ]),
  );
  assert.equal(big[0].suppressed, false);
});

test("anonymity: events with identity fields are rejected", () => {
  const ok = events("a", 0, 2, [[0, "A", "mid", 1]])[0];
  assertAnonymousEvent(ok);
  for (const field of ["studentId", "alias", "name", "sessionId", "classId"]) {
    assert.throws(() => assertAnonymousEvent({ ...ok, [field]: "x" }), /non-aggregate field/);
  }
  assert.throws(() => assertAnonymousEvent({ ...ok, tier: "genius" }), /tier/);
  assert.throws(() => assertAnonymousEvent({ ...ok, option: 5 }), /outside/);
});

const rowsFor = (n0, n1, tiers = ["low", "mid", "high"]) =>
  tiers.flatMap((t) => [
    [0, "A", t, n0],
    [1, "A", t, n1],
    [0, "B", t, n0],
    [1, "B", t, n1],
  ]);
const flagsOf = (evs) => publishAll(evs)[0].flags.map((f) => f.code);

test("flags: too easy, too hard, distractor outperforming the key, non-discriminating, position bias", () => {
  assert.ok(flagsOf(events("e", 0, 2, rowsFor(50, 1))).includes("too-easy"));
  assert.ok(flagsOf(events("h", 0, 2, rowsFor(2, 20))).includes("too-hard"));
  const dist = flagsOf(events("d", 0, 2, rowsFor(8, 14)));
  assert.ok(dist.includes("distractor-outperforms-key"));
  const flat = events("n", 0, 2, [
    ...[
      ["A", 12],
      ["B", 12],
    ].flatMap(([s, n]) => [
      [0, s, "low", n],
      [1, s, "low", 8],
      [0, s, "high", n],
      [1, s, "high", 8],
    ]),
  ]);
  assert.ok(flagsOf(flat).includes("non-discriminating"));
  const bias = events("b", 0, 4, [
    [0, "A", "mid", 15],
    [0, "B", "mid", 15],
    [1, "A", "mid", 20],
    [1, "B", "mid", 20],
    [2, "A", "mid", 6],
    [2, "B", "mid", 6],
    [3, "A", "mid", 6],
    [3, "B", "mid", 6],
  ]);
  assert.ok(flagsOf(bias).includes("position-bias"));
});

test("flags: a healthy item raises none, and flags carry the verifier shape", () => {
  const good = events("g", 0, 2, [
    ...["A", "B"].flatMap((s) => [
      [0, s, "low", 8],
      [1, s, "low", 8],
      [0, s, "mid", 11],
      [1, s, "mid", 6],
      [0, s, "high", 15],
      [1, s, "high", 3],
    ]),
  ]);
  assert.deepEqual(flagsOf(good), []);
  const [flag] = publishAll(events("e", 0, 2, rowsFor(50, 1)))[0].flags;
  assert.deepEqual(Object.keys(flag).sort(), ["code", "evidence", "message", "path", "severity"]);
});

test("flags use only published cells: a small item yields no flags and no engine fields leak", () => {
  const out = publishAll(events("s", 0, 2, [[0, "A", "mid", 9]]));
  assert.deepEqual(out[0].flags, []);
  assert.equal(JSON.stringify(out).includes("_atomN"), false);
});
