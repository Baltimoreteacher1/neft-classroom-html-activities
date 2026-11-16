// Family Mission "numtheory" model: GCF packs, LCM skip-count tracks and prime-factor trees.
// Expected values are worked out by hand here, independently of the code under test.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import * as fam from "../assets/family-mission/models/numtheory.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
globalThis.matchMedia = () => ({ matches: true });
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));

const click = (node) =>
  node.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
const typeIn = (input, value) => {
  input.value = value;
  input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
};
const make = (cfg) => fam.create(cfg);
function mountIt(cfg, opts = {}) {
  const root = document.createElement("div");
  document.body.append(root);
  const model = fam.create(cfg);
  const view = fam.mount(root, model, opts);
  return { root, model, view };
}
const clean = (root) => assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);

const PACKS = {
  mode: "gcf",
  a: 48,
  b: 36,
  labels: { a: { en: "pencils", es: "lápices" }, b: { en: "notebooks", es: "cuadernos" } },
};
const DAYS = {
  mode: "lcm",
  a: 4,
  b: 6,
  labels: {
    a: { en: "swim class", es: "clase de natación" },
    b: { en: "art club", es: "club de arte" },
  },
  per: { en: "times", es: "veces" },
  unit: { en: "days", es: "días" },
};

// ── GCF ──────────────────────────────────────────────────────────────────────

test("gcf 48 and 36: tries are checked against both numbers, factor lists build up", () => {
  const m = make(PACKS);
  // Factors of 48: 1 2 3 4 6 8 12 16 24 48. Factors of 36: 1 2 3 4 6 9 12 18 36.
  assert.equal(m.getState().max, 36);
  assert.equal(m.getState().gcf, null, "the greatest is never shown before the student finds it");
  assert.equal(m.setState({ try: 8 }), true);
  let d = m.getState();
  assert.deepEqual(d.last, { k: 8, qa: 6, ra: 0, qb: 4, rb: 4, both: false });
  assert.deepEqual(d.facA, [8]);
  assert.deepEqual(d.facB, []);
  assert.deepEqual(d.missed, [8]);
  m.setState({ try: 5 }); // 48 = 9 r 3, 36 = 7 r 1
  assert.deepEqual(m.getState().last, { k: 5, qa: 9, ra: 3, qb: 7, rb: 1, both: false });
  for (const k of [6, 9, 4]) m.setState({ try: k });
  d = m.getState();
  assert.deepEqual(d.facA, [4, 6, 8]);
  assert.deepEqual(d.facB, [4, 6, 9]);
  assert.deepEqual(d.common, [4, 6]);
  assert.deepEqual(d.missed, [5, 8, 9]);
  assert.equal(d.next, "claim");
  assert.match(m.getMathematicalExplanation("en"), /Keep trying/);
});

test("gcf: only the real greatest common factor can be claimed", () => {
  const m = make(PACKS);
  assert.equal(m.setState({ claim: 12 }), false, "must be tried first");
  m.setState({ try: 6 });
  assert.equal(m.setState({ claim: 6 }), false, "6 is common but 12 is greater");
  m.setState({ try: 5 });
  assert.equal(m.setState({ claim: 5 }), false, "5 is not common");
  m.setState({ try: 12 });
  assert.equal(m.setState({ claim: 12 }), true);
  const d = m.getState();
  assert.equal(d.finished, true);
  assert.equal(d.gcf, 12);
  assert.deepEqual(d.pack, { a: 4, b: 3 }, "48 / 12 = 4 pencils, 36 / 12 = 3 notebooks");
  assert.equal(m.setState({ try: 7 }), false, "finished");
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /greatest common factor \(GCF\) of 48 and 36 is 12/);
  assert.match(en, /48 ÷ 12 = 4 pencils and 36 ÷ 12 = 3 notebooks/);
  assert.match(en, /Check: 12 × 4 = 48 and 12 × 3 = 36/);
  assert.match(m.getMathematicalExplanation("es"), /máximo común divisor \(MCD\) de 48 y 36 es 12/);
});

test("gcf with coprime numbers: the greatest common factor is 1", () => {
  const m = make({ mode: "gcf", a: 7, b: 13 }); // factors of 7: 1, 7. Of 13: 1, 13.
  m.setState({ try: 7 });
  assert.deepEqual(m.getState().common, []);
  assert.equal(m.getState().next, "keep");
  m.setState({ try: 1 });
  assert.equal(m.setState({ claim: 1 }), true);
  assert.deepEqual(m.getState().pack, { a: 7, b: 13 });
});

test("gcf 30 and 45 (15), 24 and 16 (8): stepper range is 1 to the smaller number", () => {
  const m = make({ mode: "gcf", a: 30, b: 45 });
  assert.equal(m.getState().max, 30);
  assert.equal(m.setState({ k: 31 }), false);
  assert.equal(m.setState({ k: 0 }), false);
  assert.equal(m.setState({ k: 15 }), true);
  m.setState({ try: 15 });
  assert.equal(m.getState().last.both, true);
  assert.equal(m.setState({ claim: 15 }), true); // 30 / 15 = 2, 45 / 15 = 3
  assert.deepEqual(m.getState().pack, { a: 2, b: 3 });
  const m2 = make({ mode: "gcf", a: 24, b: 16 });
  m2.setState({ try: 8 });
  m2.setState({ claim: 8 });
  assert.deepEqual(m2.getState().pack, { a: 3, b: 2 });
});

// ── LCM ──────────────────────────────────────────────────────────────────────

test("lcm 4 and 6: the first match is named only when both lines reach it", () => {
  const m = make(DAYS); // multiples of 4: 4 8 12 16. Multiples of 6: 6 12 18. First shared: 12.
  assert.equal(m.getState().match, null);
  for (const key of ["a", "a", "a", "b"]) m.setState({ extend: key });
  let d = m.getState();
  assert.deepEqual(d.listA, [4, 8, 12]);
  assert.deepEqual(d.listB, [6]);
  assert.deepEqual(d.both, [], "12 is on the 4 line only, so it is not labelled yet");
  assert.equal(d.match, null);
  assert.equal(m.setState({ count: true }), false, "no match to count yet");
  assert.doesNotMatch(m.getAccessibleDescription("en"), /least common multiple/);
  m.setState({ extend: "b" });
  d = m.getState();
  assert.deepEqual(d.listB, [6, 12]);
  assert.deepEqual(d.both, [12]);
  assert.equal(d.match, 12);
  assert.equal(d.next, "count");
  m.setState({ extend: "a" }); // 16 is only on the 4 line
  assert.deepEqual(m.getState().both, [12]);
  assert.equal(m.setState({ count: true }), true);
  d = m.getState();
  assert.equal(d.finished, true);
  assert.deepEqual([d.qa, d.qb], [3, 2], "12 / 4 = 3 swim classes, 12 / 6 = 2 art clubs");
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /least common multiple \(LCM\) of 4 and 6 is 12/);
  assert.match(en, /Swim class: 12 ÷ 4 = 3 times/);
  assert.match(en, /Art club: 12 ÷ 6 = 2 times/);
  assert.match(en, /Check: 3 × 4 = 12 and 2 × 6 = 12/);
  assert.match(m.getMathematicalExplanation("es"), /mínimo común múltiplo \(mcm\) de 4 y 6 es 12/);
  assert.equal(m.setState({ extend: "a" }), false, "finished");
});

test("lcm 6 and 8 is 24 (4 packs of hot dogs, 3 of buns); 6 and 9 is 18; 4 and 8 is 8; 3 and 5 is 15", () => {
  const cases = [
    [6, 8, 24, 4, 3],
    [6, 9, 18, 3, 2],
    [4, 8, 8, 2, 1],
    [3, 5, 15, 5, 3],
    [12, 18, 36, 3, 2],
  ];
  for (const [a, b, l, qa, qb] of cases) {
    const m = make({ mode: "lcm", a, b });
    for (let i = 0; i < 100 && m.getState().match === null; i += 1) {
      m.setState({ extend: m.getState().na * a <= m.getState().nb * b ? "a" : "b" });
    }
    assert.equal(m.getState().match, l, `lcm ${a},${b}`);
    m.setState({ count: true });
    assert.deepEqual([m.getState().qa, m.getState().qb], [qa, qb]);
  }
});

test("lcm tracks stop at 100 steps; unfinishable sizes are refused", () => {
  const m = make({ mode: "lcm", a: 2, b: 3 });
  for (let i = 0; i < 100; i += 1) assert.equal(m.setState({ extend: "a" }), true);
  assert.equal(m.setState({ extend: "a" }), false);
  assert.equal(m.getState().listA.at(-1), 200);
  assert.throws(() => make({ mode: "lcm", a: 499, b: 500 }), TypeError, "249500 needs 500 steps");
  assert.doesNotThrow(() => make({ mode: "lcm", a: 100, b: 100 }));
  assert.equal(make({ mode: "lcm", a: 6, b: 6 }).setState({ extend: "c" }), false);
});

// ── Factor tree ──────────────────────────────────────────────────────────────

test("tree 60: only real factor pairs, primes stop, finished when every leaf is prime", () => {
  const m = make({ mode: "tree", n: 60 });
  assert.equal(m.setState({ sel: 0 }), true);
  // 60 = 2×30 = 3×20 = 4×15 = 5×12 = 6×10
  assert.deepEqual(m.getState().pairs, [
    [2, 30],
    [3, 20],
    [4, 15],
    [5, 12],
    [6, 10],
  ]);
  assert.equal(m.setState({ split: { node: 0, p: 7 } }), false, "7 does not divide 60");
  assert.equal(
    m.setState({ split: { node: 0, p: 10 } }),
    false,
    "10 x 6 is the same pair as 6 x 10; the smaller factor leads",
  );
  assert.equal(m.setState({ split: { node: 0, p: 1 } }), false, "1 is not a useful factor");
  assert.equal(m.setState({ split: { node: 0, p: 6 } }), true);
  let d = m.getState();
  assert.deepEqual(d.leaves, [6, 10]);
  assert.equal(d.sel, null);
  assert.equal(m.setState({ split: { node: 0, p: 3 } }), false, "60 is already split");
  assert.equal(m.setState({ split: { node: 1, p: 2 } }), true); // 6 = 2 x 3
  assert.deepEqual(
    m
      .getState()
      .nodes.filter((n) => n.prime)
      .map((n) => n.v),
    [2, 3],
  );
  assert.equal(m.setState({ sel: 3 }), false, "a prime cannot be selected");
  assert.equal(m.getState().finished, false);
  assert.equal(m.setState({ split: { node: 2, p: 2 } }), true); // 10 = 2 x 5
  d = m.getState();
  assert.equal(d.finished, true);
  assert.deepEqual(d.primes, [2, 2, 3, 5]);
  assert.equal(d.product, 60, "2 x 2 x 3 x 5 = 60");
  assert.equal(d.power, "2² × 3 × 5");
  assert.deepEqual(d.start, [6, 10]);
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /60 = 2 × 2 × 3 × 5 = 2² × 3 × 5/);
  assert.match(en, /Check: 2 × 2 × 3 × 5 = 60/);
  assert.match(m.getMathematicalExplanation("es"), /Comprueba: 2 × 2 × 3 × 5 = 60/);
});

test("tree: a different starting pair ends in the same primes, and the model says so", () => {
  const m = make({ mode: "tree", n: 60 });
  m.setState({ split: { node: 0, p: 6 } });
  m.setState({ split: { node: 1, p: 2 } });
  m.setState({ split: { node: 2, p: 2 } });
  assert.deepEqual(m.getState().earlier, []);
  assert.match(m.getMathematicalExplanation("en"), /Try another starting pair/);
  assert.equal(m.setState({ restart: true }), true);
  let d = m.getState();
  assert.equal(d.nodes.length, 1);
  assert.equal(d.finished, false);
  m.setState({ split: { node: 0, p: 4 } }); // 4 x 15
  m.setState({ split: { node: 1, p: 2 } }); // 4 = 2 x 2
  m.setState({ split: { node: 2, p: 3 } }); // 15 = 3 x 5
  d = m.getState();
  assert.deepEqual(d.primes, [2, 2, 3, 5]);
  assert.deepEqual(d.earlier, [{ start: [6, 10], primes: [2, 2, 3, 5] }]);
  assert.match(
    m.getMathematicalExplanation("en"),
    /earlier tree started with 6 × 10 and ended in 2, 2, 3, 5\. This one started with 4 × 15 and ended in 2, 2, 3, 5\. Different starts, same primes\./,
  );
  // Starting the same way again is not "a different start".
  m.setState({ restart: true });
  m.setState({ split: { node: 0, p: 6 } });
  m.setState({ split: { node: 1, p: 2 } });
  m.setState({ split: { node: 2, p: 2 } });
  assert.deepEqual(
    m.getState().earlier.map((e) => e.start),
    [[4, 15]],
  );
});

test("tree 84 = 2 × 2 × 3 × 7 (pairs 2x42 3x28 4x21 6x14 7x12), 64 = 2⁶, 30 has no exponent", () => {
  const m = make({ mode: "tree", n: 84 });
  m.setState({ sel: 0 });
  assert.deepEqual(m.getState().pairs, [
    [2, 42],
    [3, 28],
    [4, 21],
    [6, 14],
    [7, 12],
  ]);
  m.setState({ split: { node: 0, p: 4 } }); // Maya's 4 x 21: 4 can still split
  assert.equal(m.getState().finished, false);
  m.setState({ split: { node: 1, p: 2 } }); // 4 = 2 x 2
  m.setState({ split: { node: 2, p: 3 } }); // 21 = 3 x 7
  assert.deepEqual(m.getState().primes, [2, 2, 3, 7]);
  assert.equal(m.getState().power, "2² × 3 × 7");
  assert.equal(m.getState().product, 84);

  const m64 = make({ mode: "tree", n: 64 }); // pairs 2x32, 4x16, 8x8
  assert.deepEqual(m64.getState().pairs, []);
  m64.setState({ sel: 0 });
  assert.deepEqual(m64.getState().pairs, [
    [2, 32],
    [4, 16],
    [8, 8],
  ]);
  m64.setState({ split: { node: 0, p: 8 } }); // 8 x 8
  m64.setState({ split: { node: 1, p: 2 } }); // 8 = 2 x 4
  m64.setState({ split: { node: 2, p: 2 } }); // 8 = 2 x 4
  m64.setState({ split: { node: 4, p: 2 } }); // 4 = 2 x 2
  m64.setState({ split: { node: 6, p: 2 } }); // 4 = 2 x 2
  assert.deepEqual(m64.getState().primes, [2, 2, 2, 2, 2, 2]);
  assert.equal(m64.getState().power, "2⁶");
  assert.match(m64.getMathematicalExplanation("en"), /64 = 2 × 2 × 2 × 2 × 2 × 2 = 2⁶/);

  const m30 = make({ mode: "tree", n: 30 });
  m30.setState({ split: { node: 0, p: 2 } }); // 2 x 15
  m30.setState({ split: { node: 2, p: 3 } }); // 15 = 3 x 5
  assert.match(m30.getMathematicalExplanation("en"), /30 = 2 × 3 × 5\. /);
});

// ── Shared contract ──────────────────────────────────────────────────────────

test("bad configs are refused with TypeError", () => {
  const bad = [
    {},
    { mode: "sum", a: 4, b: 6 },
    { mode: "gcf", a: 1, b: 6 },
    { mode: "gcf", a: 501, b: 6 },
    { mode: "gcf", a: 4.5, b: 6 },
    { mode: "gcf", a: "x", b: 6 },
    { mode: "gcf", a: 4 },
    { mode: "gcf", a: -4, b: 6 },
    { mode: "lcm", a: 0, b: 6 },
    { mode: "tree", n: 7 },
    { mode: "tree", n: 1 },
    { mode: "tree", n: 501 },
    { mode: "tree", n: 60.5 },
    { mode: "tree" },
    { mode: "gcf", a: 4, b: 6, presets: [{ a: 1, b: 2 }] },
    { mode: "tree", n: 60, presets: [7] },
    { mode: "gcf", a: 4, b: 6, labels: { a: { en: "x" } } },
    { mode: "gcf", a: 4, b: 6, labels: { a: { en: "x".repeat(41), es: "x" } } },
  ];
  for (const cfg of bad) assert.throws(() => make(cfg), TypeError, JSON.stringify(cfg));
  assert.doesNotThrow(() => make({ mode: "tree", n: 500 }));
  assert.doesNotThrow(() => make({ mode: "gcf", a: 2, b: 500 }));
});

test("presets start a fresh problem; undo steps back; reset returns to the start", () => {
  const presets = [
    { a: 48, b: 36 },
    { a: 30, b: 45 },
  ];
  const m = make({ ...PACKS, presets });
  m.setState({ try: 6 });
  m.setState({ try: 12 });
  assert.equal(m.undo(), true);
  assert.deepEqual(m.getState().tried, [6]);
  m.setState({ a: 30, b: 45 });
  assert.deepEqual([m.getState().a, m.getState().b, m.getState().tried], [30, 45, []]);
  assert.equal(m.setState({ a: 1, b: 45 }), false);
  m.reset();
  assert.deepEqual([m.getState().a, m.getState().b, m.getState().tried], [48, 36, []]);

  const tree = make({ mode: "tree", n: 60, presets: [60, 84] });
  assert.deepEqual(tree.getState().presets, [{ n: 60 }, { n: 84 }]);
  tree.setState({ sel: 0 });
  tree.setState({ split: { node: 0, p: 6 } });
  assert.equal(tree.undo(), true);
  assert.equal(tree.getState().nodes.length, 1);
  assert.equal(tree.getState().sel, 0, "undo returns to choosing a pair");
  assert.equal(tree.undo(), false, "choosing a node is not a move");
  tree.setState({ n: 84 });
  assert.equal(tree.getState().n, 84);

  const l = make({ mode: "lcm", a: 4, b: 6 });
  l.setState({ extend: "a" });
  l.setState({ extend: "b" });
  l.undo();
  assert.deepEqual([l.getState().na, l.getState().nb], [1, 0]);
});

test("serialize and restore round-trip; forged state is refused", () => {
  const g = make(PACKS);
  g.setState({ try: 12 });
  g.setState({ claim: 12 });
  const gj = g.serialize();
  const g2 = make(PACKS);
  assert.equal(g2.restore(gj), true);
  assert.equal(g2.getState().gcf, 12);
  assert.equal(g2.restore(gj.replace('"claimed":12', '"claimed":6')), false);
  assert.equal(g2.restore(gj.replace('"tried":[12]', '"tried":[12,12]')), false);

  const l = make(DAYS);
  for (const k of ["a", "a", "a", "b", "b"]) l.setState({ extend: k });
  l.setState({ count: true });
  const lj = l.serialize();
  assert.equal(make(DAYS).restore(lj), true);
  assert.equal(make(DAYS).restore(lj.replace('"nb":2', '"nb":1')), false, "counted with no match");

  const t = make({ mode: "tree", n: 60 });
  t.setState({ split: { node: 0, p: 6 } });
  const tj = t.serialize();
  const t2 = make({ mode: "tree", n: 60 });
  assert.equal(t2.restore(tj), true);
  assert.deepEqual(t2.getState().leaves, [6, 10]);
  assert.equal(
    t2.restore(tj.replace('"kids":[1,2]', '"kids":[0,1]')),
    false,
    "a node cannot be its own child",
  );
  assert.equal(
    t2.restore(tj.replace('"v":10', '"v":11')),
    false,
    "children must multiply to the parent",
  );
  assert.equal(make({ mode: "gcf", a: 4, b: 6 }).restore(tj), false, "another family's state");
});

test("validate checks the finished work against the task answer", () => {
  const g = make({ ...PACKS, task: { answer: 12 } });
  assert.equal(g.validate().reason, "not-finished");
  g.setState({ try: 12 });
  g.setState({ claim: 12 });
  assert.deepEqual(g.validate(), { ok: true, reason: "correct", misconception: null });
  assert.equal(g.validate({ answer: 6 }).ok, false);
  assert.equal(make(PACKS).validate(null).reason, "no-task");

  const l = make(DAYS);
  for (const k of ["a", "a", "a", "b", "b"]) l.setState({ extend: k });
  l.setState({ count: true });
  assert.equal(l.validate({ answer: "12" }).ok, true);
  assert.equal(l.validate({ answer: 24 }).ok, false);

  const t = make({ mode: "tree", n: 60 });
  for (const patch of [
    { split: { node: 0, p: 6 } },
    { split: { node: 1, p: 2 } },
    { split: { node: 2, p: 2 } },
  ])
    t.setState(patch);
  assert.equal(t.validate({ answer: "2 2 3 5" }).ok, true);
  assert.equal(t.validate({ answer: [5, 3, 2, 2] }).ok, true);
  assert.equal(t.validate({ answer: "2 3 5" }).ok, false);
});

test("describeConfig can rebuild the same model", () => {
  const m = make({
    ...PACKS,
    presets: [
      { a: 48, b: 36 },
      { a: 24, b: 16 },
    ],
  });
  const cfg = m.describeConfig();
  assert.equal(cfg.family, "numtheory");
  const again = make(cfg);
  assert.deepEqual(again.getState().presets, m.getState().presets);
  assert.equal(again.getState().ctx.a.es, "lápices");
  assert.match(m.getAccessibleDescription("es"), /Modelo del máximo común divisor de 48 y 36/);
});

// ── Mounted DOM ──────────────────────────────────────────────────────────────

test("mounted gcf: type a pack count, read the verdict, build the lists, find the greatest", () => {
  const presets = [
    { a: 48, b: 36 },
    { a: 30, b: 45 },
  ];
  const { root, model, view } = mountIt({ ...PACKS, presets });
  const input = root.querySelector("input");
  const tries = () => root.querySelector(".fm-nt-tries").textContent;
  assert.equal(root.querySelectorAll("button").length >= 6, true);
  for (const b of root.querySelectorAll("button")) assert.equal(b.getAttribute("type"), "button");
  assert.match(root.querySelector(".fm-nt-try").textContent, /Try 1 pack$/);
  click(root.querySelector(".fm-nt-claim"));
  assert.match(root.querySelector(".fm-msg").textContent, /Try that many packs first/);
  click(root.querySelector('[aria-label="One more pack"]'));
  assert.equal(input.value, "2");
  typeIn(input, "8");
  assert.match(root.querySelector(".fm-nt-try").textContent, /Try 8 packs$/);
  click(root.querySelector(".fm-nt-try"));
  assert.match(tries(), /48 pencils ÷ 8 packs = 6 in each pack, none left over\./);
  assert.match(tries(), /36 notebooks ÷ 8 packs = 4 in each pack and 4 left over\./);
  assert.match(tries(), /does not split both numbers evenly\. Try another look\./);
  assert.match(root.querySelector(".fm-nt-missed").textContent, /Did not split both: 8/);
  typeIn(input, "99");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.match(root.querySelector(".fm-msg").textContent, /Type a whole number from 1 to 36\./);
  typeIn(input, "6");
  click(root.querySelector(".fm-nt-try"));
  assert.match(tries(), /6 packs works for both numbers: 6 is a common factor\./);
  assert.equal(root.querySelectorAll(".fm-nt-list").length, 2);
  assert.match(root.querySelector(".fm-nt-list .is-tagged").textContent, /6\s*common/);
  click(root.querySelector(".fm-nt-claim"));
  assert.match(root.querySelector(".fm-msg").textContent, /a bigger one works too/);
  assert.equal(root.querySelector(".fm-nt-result").hidden, true);
  typeIn(input, "12");
  click(root.querySelector(".fm-nt-try"));
  click(root.querySelector(".fm-nt-claim"));
  assert.equal(root.querySelector(".fm-nt-result").hidden, false);
  assert.match(
    root.querySelector(".fm-nt-eq").textContent,
    /greatest common factor \(GCF\) of 48 and 36 is 12/,
  );
  assert.match(
    root.querySelector(".fm-nt-result").textContent,
    /4 pencils and 36 ÷ 12 = 3 notebooks/,
  );
  assert.equal(root.querySelector(".fm-nt-try").disabled, true);
  clean(root);
  assert.equal(model.getState().gcf, 12);
  view.setLang("es");
  assert.match(root.textContent, /máximo común divisor \(MCD\) de 48 y 36 es 12/);
  assert.match(root.textContent, /4 lápices y 36 ÷ 12 = 3 cuadernos/);
  assert.match(root.querySelector(".fm-sr").textContent, /Modelo del máximo común divisor/);
  click(root.querySelector('[data-pick="1"]'));
  assert.deepEqual(
    [model.getState().a, model.getState().b, model.getState().finished],
    [30, 45, false],
  );
  assert.equal(root.querySelector(".fm-nt-result").hidden, true);
  assert.match(root.textContent, /Factores de 30 hasta ahora/);
  clean(root);
  view.destroy();
});

test("mounted lcm: extend the two tracks one step at a time, then count the packs", () => {
  const { root, model, view } = mountIt({
    ...DAYS,
    presets: [
      { a: 4, b: 6 },
      { a: 3, b: 5 },
    ],
  });
  const [btnA, btnB] = root.querySelectorAll(".fm-nt-next");
  const chipsOf = (i) =>
    [...root.querySelectorAll(".fm-nt-trackbox")[i].querySelectorAll(".fm-nt-val")].map(
      (n) => n.textContent,
    );
  assert.match(root.textContent, /Swim class: count by 4/);
  assert.equal(root.querySelector(".fm-nt-count").hidden, true);
  assert.equal(root.querySelector(".fm-nt-result").hidden, true);
  assert.match(
    btnA.getAttribute("aria-label"),
    /Add the next multiple of 4 to the swim class line/,
  );
  for (const b of [btnA, btnA, btnA, btnB]) click(b);
  assert.deepEqual(chipsOf(0), ["4", "8", "12"]);
  assert.deepEqual(chipsOf(1), ["6"]);
  assert.equal(root.querySelectorAll(".is-tagged").length, 0);
  assert.equal(root.querySelector(".fm-nt-result").hidden, true, "not named before the match");
  click(btnB);
  assert.deepEqual(chipsOf(1), ["6", "12"]);
  assert.equal(root.querySelectorAll(".is-tagged").length, 2, "12 is labelled on both tracks");
  for (const tag of root.querySelectorAll(".is-tagged .fm-nt-tag"))
    assert.equal(tag.textContent, "both");
  assert.match(
    root.querySelector(".fm-nt-result").textContent,
    /Both lines reach 12 days\. It is the first number they share, so the least common multiple \(LCM\) of 4 and 6 is 12\./,
  );
  assert.equal(root.querySelector(".fm-nt-count").hidden, false);
  click(root.querySelector(".fm-nt-count"));
  assert.match(root.querySelector(".fm-nt-result").textContent, /Swim class: 12 ÷ 4 = 3 times\./);
  assert.match(root.querySelector(".fm-nt-result").textContent, /Art club: 12 ÷ 6 = 2 times\./);
  assert.equal(root.querySelector(".fm-nt-count").hidden, true);
  assert.equal(btnA.disabled, true);
  clean(root);
  view.setLang("es");
  assert.match(root.textContent, /Clase de natación: 12 ÷ 4 = 3 veces\./);
  assert.match(root.textContent, /Las dos filas llegan a 12 días/);
  assert.equal(model.getState().qa, 3);
  click(root.querySelector('[data-pick="1"]'));
  assert.deepEqual([model.getState().a, model.getState().b, model.getState().na], [3, 5, 0]);
  assert.match(root.querySelector(".fm-nt-trackbox .fm-nt-empty").textContent, /todavía ninguno/);
  clean(root);
  view.destroy();
});

test("mounted tree: tap a number, pick a real pair, primes are labelled, restart with another pair", () => {
  const { root, model, view } = mountIt({ mode: "tree", n: 60, presets: [60, 84] });
  const pick = (node) => click(root.querySelector(`[data-node="${node}"]`));
  const pair = (p) => click(root.querySelector(`.fm-nt-pair[data-p="${p}"]`));
  assert.match(root.querySelector(".fm-nt-tree").getAttribute("aria-label"), /Factor tree for 60/);
  assert.equal(root.querySelector(".fm-nt-pairs").hidden, true);
  assert.equal(root.querySelector(".fm-nt-again").hidden, true);
  pick(0);
  assert.equal(root.querySelector('[data-node="0"]').getAttribute("aria-pressed"), "true");
  assert.deepEqual(
    [...root.querySelectorAll(".fm-nt-pair")].map((b) => b.textContent),
    ["2 × 30", "3 × 20", "4 × 15", "5 × 12", "6 × 10"],
  );
  pair(6);
  assert.equal(root.querySelector(".fm-nt-pairs").hidden, true);
  assert.equal(root.querySelectorAll(".fm-nt-node.is-pick").length, 2, "6 and 10 can still split");
  pick(1);
  assert.deepEqual(
    [...root.querySelectorAll(".fm-nt-pair")].map((b) => b.textContent),
    ["2 × 3"],
  );
  pair(2);
  assert.equal(root.querySelectorAll(".fm-nt-node.is-prime").length, 2);
  for (const tag of root.querySelectorAll(".is-prime .fm-nt-tag"))
    assert.equal(tag.textContent, "prime");
  assert.equal(root.querySelector(".fm-nt-result").hidden, true);
  pick(2);
  pair(2);
  assert.equal(root.querySelector(".fm-nt-result").hidden, false);
  assert.match(root.querySelector(".fm-nt-eq").textContent, /60 = 2 × 2 × 3 × 5 = 2² × 3 × 5/);
  assert.equal(root.querySelectorAll(".fm-nt-node.is-prime").length, 4);
  assert.equal(root.querySelectorAll(".fm-nt-node.is-pick").length, 0);
  clean(root);
  click(root.querySelector(".fm-nt-again"));
  assert.equal(model.getState().nodes.length, 1);
  pick(0);
  pair(4);
  pick(1);
  pair(2);
  pick(2);
  pair(3);
  assert.match(root.querySelector(".fm-nt-result").textContent, /Different starts, same primes\./);
  view.setLang("es");
  assert.match(root.textContent, /Empiezos distintos, los mismos primos\./);
  assert.match(root.querySelector(".fm-nt-node .fm-nt-tag").textContent, /primo/);
  assert.match(root.textContent, /Probar de otra forma/);
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(model.getState().n, 84);
  assert.equal(model.getState().nodes.length, 1);
  clean(root);
  view.destroy();
});

test("readonly: the same picture, no live controls", () => {
  for (const cfg of [PACKS, DAYS, { mode: "tree", n: 60 }]) {
    const { root, model } = mountIt(cfg, { readonly: true });
    assert.equal(root.querySelectorAll("button").length, 0, `${cfg.mode} has no buttons`);
    assert.equal(root.querySelector("input"), null);
    assert.equal(root.querySelector(".fm-actions"), null);
    assert.ok(root.querySelector(".fm-sr").textContent.length > 20);
    clean(root);
    assert.ok(model.getAccessibleDescription("en"));
  }
});

test("lang switch keeps the state and the text alternative follows the language", () => {
  const { root, model, view } = mountIt({ mode: "tree", n: 60 });
  model.setState({ split: { node: 0, p: 6 } });
  view.setLang("es");
  assert.equal(root.getAttribute("lang"), "es");
  assert.deepEqual(model.getState().leaves, [6, 10]);
  assert.match(root.querySelector(".fm-sr").textContent, /Árbol de factores de 60/);
  view.setLang("en");
  assert.match(root.querySelector(".fm-sr").textContent, /Factor tree for 60/);
  clean(root);
});
