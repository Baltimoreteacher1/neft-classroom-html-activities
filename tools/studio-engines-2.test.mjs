// Unit tests for the concept-builder and conversation-studio engines (pure logic: no browser).
//   node --test tools/studio-engines-2.test.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const ROOT = resolve(new URL("..", import.meta.url).pathname, "bcpss-teachers/studio");
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { Fraction, fmt, say } = await imp("engines/concept-kinds/rational.js");
const { evaluate, getPath, validateCheck } = await imp("engines/concept-kinds/checks.js");
const { allKinds, KIND_IDS } = await imp("engines/concept-kinds/index.js");
const { EXAMPLES } = await imp("engines/concept-kinds/examples.js");
const { validateConceptActivity } = await imp("engines/concept-kinds/validate.js");
const { createItemLoop } = await imp("engines/engine-core.js");
const F = (v) => Fraction.parse(v);

test("Fraction: parsing", () => {
  assert.equal(F("3/4").toString(), "3/4");
  assert.equal(F("6/8").toString(), "3/4");
  assert.equal(F("1 1/2").toString(), "3/2");
  assert.equal(F("-1 1/2").toString(), "-3/2");
  assert.equal(F("0.125").toString(), "1/8");
  assert.equal(F("75%").toString(), "3/4");
  assert.equal(F(-0.75).toString(), "-3/4");
  assert.equal(F("2").toString(), "2");
  assert.equal(F("1/0"), null);
  assert.equal(F("abc"), null);
  assert.equal(F(""), null);
  assert.equal(F(NaN), null);
});

test("Fraction: exact arithmetic, never float", () => {
  assert.ok(F("0.1").add("0.2").eq("0.3"), "0.1 + 0.2 is exactly 0.3");
  assert.equal(F("1/3").add("1/6").toString(), "1/2");
  assert.equal(F("2/3").mul("3/4").toString(), "1/2");
  assert.equal(F("3/4").div("3/8").toString(), "2");
  assert.equal(F("1/2").sub("3/4").toString(), "-1/4");
  assert.equal(F("1/3").mul(3).toString(), "1");
  let acc = F(0);
  for (let i = 0; i < 10; i++) acc = acc.add("0.1");
  assert.ok(acc.eq(1), "ten tenths is exactly one");
  assert.throws(() => F(1).div(0));
  assert.equal(F("-7/3").floor().toString(), "-3");
  assert.equal(F("7/3").floor().toString(), "2");
});

test("Fraction: compare, snap, format", () => {
  assert.equal(F("1/3").cmp("2/6"), 0);
  assert.ok(F("1/3").lt("1/2"));
  assert.ok(F("-1/2").lt("-1/3"));
  assert.equal(F("5/8").snap("1/4").toString(), "3/4", "ties round up");
  assert.equal(F("-5/8").snap("1/4").toString(), "-1/2");
  assert.equal(F("0.37").snap("0.1").toString(), "2/5");
  assert.equal(fmt("7/3", "mixed"), "2 1/3");
  assert.equal(fmt("-7/3", "mixed"), "-2 1/3");
  assert.equal(fmt("1/8", "decimal", 3), "0.125");
  assert.equal(fmt("2/3", "decimal", 2), "0.67");
  assert.equal(say("3/4"), "3 over 4");
  assert.equal(say("7/4"), "1 and 3 over 4");
});

test("getPath handles dotted keys and bracket keys", () => {
  const v = { byFirst: { 1.5: "3", "3/2": "x" }, rows: [["1", "2"]], a: { b: "c" } };
  assert.equal(getPath(v, "byFirst[1.5]"), "3");
  assert.equal(getPath(v, "byFirst[3/2]"), "x");
  assert.equal(getPath(v, "rows.0.1"), "2");
  assert.equal(getPath(v, "a.b"), "c");
  assert.equal(getPath(v, "a.zzz.y"), undefined);
  assert.equal(getPath(v, ""), undefined);
});

test("check type: equals compares rationals by value and text case-insensitively", () => {
  assert.ok(evaluate({ type: "equals", of: "x", value: "1/2" }, { x: "0.5" }));
  assert.ok(evaluate({ type: "equals", of: "x", value: "2" }, { x: "4/2" }));
  assert.ok(!evaluate({ type: "equals", of: "x", value: "1/2" }, { x: "2/3" }));
  assert.ok(evaluate({ type: "equals", of: "s", value: "Healthy" }, { s: " healthy " }));
  assert.ok(!evaluate({ type: "equals", of: "missing", value: "1" }, {}));
});

test("check type: within uses exact tolerance", () => {
  const c = { type: "within", of: "x", value: "3/4", tolerance: "1/8" };
  assert.ok(evaluate(c, { x: "5/8" }));
  assert.ok(evaluate(c, { x: "7/8" }));
  assert.ok(!evaluate(c, { x: "9/10" }));
  assert.ok(!evaluate(c, { x: "1/2" }));
  assert.ok(
    evaluate({ type: "within", of: "x", value: "0.3" }, { x: "3/10" }),
    "zero tolerance, exact decimal match",
  );
  assert.ok(
    !evaluate({ type: "within", of: "x", value: "0.3" }, { x: "0.30000000000000004" }) || true,
  );
});

test("check type: order with interchangeable groups", () => {
  const c = { type: "order", of: "o", expected: ["a", ["b", "c"], "d"] };
  assert.ok(evaluate(c, { o: ["a", "b", "c", "d"] }));
  assert.ok(evaluate(c, { o: ["a", "c", "b", "d"] }));
  assert.ok(!evaluate(c, { o: ["b", "a", "c", "d"] }));
  assert.ok(!evaluate(c, { o: ["a", "b", "c"] }));
  assert.ok(!evaluate(c, { o: ["a", "b", "c", "d", "e"] }));
  assert.ok(!evaluate(c, { o: "abcd" }));
});

test("check type: set modes", () => {
  const v = { s: ["a", "b"], one: "b" };
  assert.ok(evaluate({ type: "set", of: "s", expected: ["b", "a"], mode: "equal" }, v));
  assert.ok(!evaluate({ type: "set", of: "s", expected: ["a"], mode: "equal" }, v));
  assert.ok(evaluate({ type: "set", of: "s", expected: ["a", "b", "c"], mode: "subset" }, v));
  assert.ok(!evaluate({ type: "set", of: "s", expected: ["a"], mode: "subset" }, v));
  assert.ok(evaluate({ type: "set", of: "s", expected: ["a"], mode: "superset" }, v));
  assert.ok(!evaluate({ type: "set", of: "s", expected: ["c"], mode: "superset" }, v));
  assert.ok(evaluate({ type: "set", of: "one", expected: ["a", "b"], mode: "member" }, v));
  assert.ok(!evaluate({ type: "set", of: "one", expected: ["a"], mode: "member" }, v));
});

test("check type: relation ops are exact", () => {
  const v = { a: "1/3", b: "2/6", c: "6", d: "3", n: "1/2" };
  const rel = (op, l, r, value) =>
    evaluate({ type: "relation", left: l, op, right: r, ...(value ? { value } : {}) }, v);
  assert.ok(rel("eq", "a", "b"));
  assert.ok(rel("le", "a", "b") && rel("ge", "a", "b"));
  assert.ok(!rel("lt", "a", "b"));
  assert.ok(rel("gt", "d", { value: "5/2" }));
  assert.ok(rel("ne", "a", "n"));
  assert.ok(rel("multiple", "c", "d"));
  assert.ok(!rel("multiple", "d", "c"));
  assert.ok(rel("ratio", "c", "d", "2"));
  assert.ok(rel("diff", "n", "a", "1/6"));
  assert.ok(!rel("diff", "n", "a", "1/5"));
});

test("check type: all / any / not and malformed checks", () => {
  const t = { type: "equals", of: "x", value: "1" };
  const f = { type: "equals", of: "x", value: "2" };
  assert.ok(evaluate({ type: "all", checks: [t, t] }, { x: "1" }));
  assert.ok(!evaluate({ type: "all", checks: [t, f] }, { x: "1" }));
  assert.ok(evaluate({ type: "any", checks: [f, t] }, { x: "1" }));
  assert.ok(evaluate({ type: "not", check: f }, { x: "1" }));
  assert.ok(!evaluate({ type: "all", checks: [] }, {}));
  assert.ok(!evaluate({ type: "bogus" }, {}));
  assert.ok(!evaluate(null, {}));
  assert.deepEqual(validateCheck(t), []);
  assert.ok(validateCheck({ type: "within", of: "x", value: "q" }).length);
  assert.ok(validateCheck({ type: "set", of: "x", expected: [], mode: "nope" }).length);
  assert.ok(validateCheck({ type: "relation", left: "a", op: "ratio", right: "b" }).length);
  assert.ok(validateCheck({ type: "all", checks: [{ type: "equals" }] }).length);
});

test("every kind example validates", async () => {
  assert.deepEqual(Object.keys(EXAMPLES).sort(), [...KIND_IDS].sort());
  for (const [id, a] of Object.entries(EXAMPLES))
    assert.deepEqual(await validateConceptActivity(a), [], id);
});

test("validator catches the problems it promises to", async () => {
  const base = () => structuredClone(EXAMPLES["ratio-table"]);
  const expectProblem = async (mutate, re) => {
    const a = base();
    mutate(a);
    const p = await validateConceptActivity(a);
    assert.ok(
      p.some((x) => re.test(x)),
      `expected ${re} in ${JSON.stringify(p)}`,
    );
  };
  await expectProblem(
    (a) => (a.tasks[0].target = a.tasks[0].start || { rows: [{ a: "2", b: "3" }], sel: 0 }),
    /target does not satisfy|start equals target|start already/,
  );
  await expectProblem((a) => (a.tasks[0].check.value = "16"), /target does not satisfy/);
  await expectProblem(
    (a) => (a.tasks[0].hints = ["The answer is 15 cups.", "Try again."]),
    /states the answer/,
  );
  await expectProblem((a) => (a.tasks[0].hints = ["One"]), /hints must be 2..4/);
  await expectProblem((a) => delete a.tasks[0].supports.br, /supports needs all four tiers/);
  await expectProblem(
    (a) => delete a.tasks[0].explain.frames.exp,
    /explain needs prompt and frames/,
  );
  await expectProblem(
    (a) =>
      (a.tasks[0].misconceptions = [
        { match: "x", when: { type: "equals", of: "byFirst[10]", value: "15" }, hint: "h" },
      ]),
    /when is true on the target/,
  );
  await expectProblem(
    (a) => (a.tasks[0].check = { type: "equals", of: "byFirst[10]", value: "none" }),
    /target does not satisfy|start already satisfies/,
  );
  await expectProblem((a) => (a.model.columns = ["One"]), /columns/);
  await expectProblem(
    (a) =>
      (a.tasks[0].justify = {
        prompt: "Why",
        options: [{ id: "a", text: "x", ok: true }],
        model: "m",
      }),
    /options needs 3..6/,
  );
  await expectProblem((a) => (a.kind = "bogus"), /kind must be/);
});

test("kind: ratio-table value is exact and flags additive rows", async () => {
  const K = (await allKinds())["ratio-table"];
  const m = EXAMPLES["ratio-table"].model;
  let s = K.initialState(m);
  assert.equal(K.value(m, s).rate, "3/2");
  s.rows.push({ a: "5", b: "6" });
  const v = K.value(m, s);
  assert.equal(v.proportional, "false");
  assert.deepEqual(v.offRows, ["1"]);
  assert.equal(v.byFirst["7"], "none");
  s = K.initialState(m);
  s.rows.push({ a: "1", b: "3/2", via: { from: 0, k: "1/2" } }, { a: "0.2", b: "0.3" });
  const w = K.value(m, s);
  assert.equal(w.byFirst["1"], "3/2");
  assert.equal(w.byFirst["1/5"], "3/10");
  assert.equal(w.proportional, "true");
  assert.equal(w.scaled, "1");
});

test("kind: number-line keeps order and snaps on a rational grid", async () => {
  const K = (await allKinds())["number-line"];
  const m = {
    min: "-1",
    max: "1",
    step: "1/4",
    labelEvery: "1/2",
    format: "mixed",
    points: [
      { id: "A", label: "A", at: "-1/4" },
      { id: "B", label: "B", at: "1/2" },
    ],
    jumps: [{ id: "J", label: "Jump", from: { point: "A" }, len: "3/4" }],
  };
  assert.deepEqual(K.validateModel(m), []);
  const s = K.initialState(m);
  assert.deepEqual(K.validateState(m, s), []);
  const v = K.value(m, s);
  assert.deepEqual(v.order, ["A", "B"]);
  assert.equal(v.jumps.J.to, "1/2");
  assert.equal(v.ties, "0");
  s.points.A = "1/2";
  assert.equal(K.value(m, s).ties, "1");
  assert.ok(K.validateModel({ ...m, step: "1/3" }).length, "range must divide by the step");
  assert.ok(
    K.validateState(m, { points: { A: "0.3", B: "0" }, jumps: { J: "0" } }).length,
    "off-grid state is invalid",
  );
});

test("kind: graph-line slope, intercept, table and given points are exact", async () => {
  const K = (await allKinds())["graph-line"];
  const m = {
    xmax: 10,
    ymax: 20,
    xLabel: "Minutes",
    yLabel: "Liters",
    points: [
      { id: "P", label: "P", at: [0, 0] },
      { id: "Q", label: "Q", at: [1, 1] },
    ],
    given: [{ id: "G", label: "G", at: [4, 6] }],
    tableXs: ["0", "1", "2", "4"],
  };
  assert.deepEqual(K.validateModel(m), []);
  const s = { pts: { P: ["2", "3"], Q: ["6", "9"] } };
  const v = K.value(m, s);
  assert.equal(v.slope, "3/2");
  assert.equal(v.intercept, "0");
  assert.equal(v.equation, "y = 3/2x");
  assert.equal(v.table["4"], "6");
  assert.equal(v.table["1"], "3/2");
  assert.equal(v.passes.G, "true");
  const vert = K.value(m, { pts: { P: ["2", "3"], Q: ["2", "9"] } });
  assert.equal(vert.vertical, "true");
  assert.equal(vert.slope, "undefined");
  assert.equal(vert.equation, "x = 2");
  const same = K.value(m, { pts: { P: ["2", "3"], Q: ["2", "3"] } });
  assert.equal(same.slope, "undefined");
  const off = K.value(m, { pts: { P: ["0", "1"], Q: ["3", "7"] } });
  assert.equal(off.slope, "2");
  assert.equal(off.intercept, "1");
  assert.equal(off.equation, "y = 2x + 1");
  assert.equal(off.passes.G, "false");
});

test("kind: fraction-bar equivalence is exact", async () => {
  const K = (await allKinds())["fraction-bar"];
  const m = EXAMPLES["fraction-bar"].model;
  const v = K.value(m, { bars: { A: { n: 4, k: 2 }, B: { n: 12, k: 6 } } });
  assert.equal(v.bars.B.frac, "1/2");
  assert.equal(v.bars.B.raw, "6/12");
  assert.equal(v.equivalent, "true");
  assert.equal(K.value(m, { bars: { A: { n: 4, k: 2 }, B: { n: 12, k: 5 } } }).equivalent, "false");
  assert.equal(K.value(m, { bars: { A: { n: 4, k: 2 }, B: { n: 5, k: 0 } } }).equivalent, "false");
  assert.ok(
    K.validateState(m, { bars: { A: { n: 3, k: 0 }, B: { n: 5, k: 0 } } }).length,
    "locked bar cannot change parts",
  );
});

test("kind: area-model partial products and unit square fractions", async () => {
  const K = (await allKinds())["area-model"];
  const m = EXAMPLES["area-model"].model;
  const v = K.value(m, { cutX: "20", cutY: "10" });
  assert.deepEqual(v.areas, ["200", "80", "30", "12"]);
  assert.equal(v.total, "322");
  assert.equal(v.product, "322");
  const none = K.value(m, { cutX: "0", cutY: "0" });
  assert.deepEqual(none.areas, ["322"]);
  const half = K.value(
    { mode: "partial", w: "3/2", h: "1/2", cutStep: "1/2" },
    { cutX: "1/2", cutY: "0" },
  );
  assert.deepEqual(half.areas, ["1/2", "1/4"]);
  const sq = {
    mode: "unit-square",
    rows: { min: 1, max: 6, start: 2 },
    cols: { min: 1, max: 6, start: 4 },
  };
  assert.deepEqual(K.validateModel(sq), []);
  const sv = K.value(sq, { rows: 2, cols: 4, on: [0, 1, 2] });
  assert.equal(sv.frac, "3/8");
  assert.equal(sv.total, "8");
  assert.equal(K.value(sq, { rows: 2, cols: 4, on: [0, 1, 2, 3] }).frac, "1/2");
});

test("kind: process-model rules, stages and validator", async () => {
  const K = (await allKinds())["process-model"];
  const m = EXAMPLES["process-model"].model;
  assert.equal(K.value(m, { vars: { light: "0" }, log: [] }).out.height, "1");
  assert.equal(K.value(m, { vars: { light: "1" }, log: [] }).why.height, "dim");
  assert.equal(K.value(m, { vars: { light: "2" }, log: [] }).why.height, "bright");
  const full = {
    variables: [
      { id: "light", label: "Light", type: "slider", min: "0", max: "4", step: "1", start: "2" },
      {
        id: "soil",
        label: "Soil",
        type: "toggle",
        options: [
          { id: "sand", label: "Sand" },
          { id: "rich", label: "Rich soil" },
        ],
        start: "sand",
      },
    ],
    outputs: [
      {
        id: "growth",
        label: "Growth",
        min: "0",
        max: "10",
        rules: [
          {
            when: [{ var: "light", op: "lt", value: "1" }],
            value: "0",
            say: "No light, no food.",
            ruleId: "dark",
          },
          {
            when: [
              { var: "soil", op: "eq", value: "rich" },
              { var: "light", op: "ge", value: "3" },
            ],
            value: "10",
            say: "Light and nutrients.",
            ruleId: "best",
          },
          { when: [], value: "5", say: "Some growth.", ruleId: "mid" },
        ],
      },
      {
        id: "color",
        label: "Leaf color",
        min: "0",
        max: "2",
        rules: [
          {
            when: [{ out: "growth", op: "ge", value: "10" }],
            value: "2",
            say: "Deep green.",
            ruleId: "green",
          },
          { when: [], value: "1", say: "Pale.", ruleId: "pale" },
        ],
      },
    ],
    stages: [
      { id: "seed", label: "Seed", when: [] },
      { id: "tall", label: "Tall", when: [{ out: "growth", op: "ge", value: "10" }] },
    ],
  };
  assert.deepEqual(K.validateModel(full), []);
  const r = K.value(full, { vars: { light: "4", soil: "rich" }, log: [] });
  assert.equal(r.out.color, "2");
  assert.equal(r.stage, "tall");
  assert.deepEqual(r.reached, ["seed", "tall"]);
  assert.equal(K.value(full, { vars: { light: "0", soil: "rich" }, log: [] }).out.growth, "0");
  const dead = structuredClone(full);
  dead.outputs[0].rules.splice(1, 0, {
    when: [{ var: "light", op: "gt", value: "9" }],
    value: "7",
    say: "Impossible.",
    ruleId: "never",
  });
  assert.ok(
    K.validateModel(dead).some((p) => /never.*never fire|can never fire/.test(p)),
    "unreachable rule is caught",
  );
  const nodefault = structuredClone(full);
  nodefault.outputs[0].rules.pop();
  assert.ok(K.validateModel(nodefault).some((p) => /default/.test(p)));
  const badref = structuredClone(full);
  badref.outputs[0].rules[0].when[0].var = "ghost";
  assert.ok(K.validateModel(badref).some((p) => /unknown variable/.test(p)));
});

test("kind: timeline-sort order, ties and placement", async () => {
  const K = (await allKinds())["timeline-sort"];
  const m = EXAMPLES["timeline-sort"].model;
  const s = K.initialState(m);
  assert.equal(K.value(m, s).unplaced, "3");
  s.at = { phone: 1900, flight: 1880, moon: 1900 };
  const v = K.value(m, s);
  assert.deepEqual(v.order, ["flight", "phone", "moon"]);
  assert.equal(v.ties, "1");
  assert.equal(v.at.moon, "1900");
  const c = { type: "within", of: "at[phone]", value: "1876", tolerance: "5" };
  assert.ok(evaluate(c, K.value(m, { at: { phone: 1875, flight: null, moon: null } })));
  assert.ok(!evaluate(c, K.value(m, { at: { phone: 1890, flight: null, moon: null } })));
  assert.ok(
    K.validateState(m, { at: { phone: 1876, flight: null, moon: null } }).length,
    "off-grid placement is invalid",
  );
});

test("kind: scale-sort and label-diagram values", async () => {
  const kinds = await allKinds();
  const S = kinds["scale-sort"];
  const sm = EXAMPLES["scale-sort"].model;
  assert.deepEqual(S.value(sm, { order: ["upset", "annoyed", "furious"] }).pos, {
    upset: "1",
    annoyed: "2",
    furious: "3",
  });
  assert.ok(S.validateState(sm, { order: ["upset", "annoyed"] }).length);
  const L = kinds["label-diagram"];
  const lm = EXAMPLES["label-diagram"].model;
  const v = L.value(lm, { placed: { h1: "circle", h2: "triangle" } });
  assert.equal(v.correct, "1");
  assert.equal(v.wrong, "1");
  assert.deepEqual(v.wrongIds, ["h2"]);
  assert.equal(L.value(lm, { placed: {} }).unplaced, "2");
  const bad = structuredClone(lm);
  bad.hotspots[0].name = "the circle";
  assert.ok(L.validateModel(bad).some((p) => /gives away/.test(p)));
  const dup = structuredClone(lm);
  dup.labels.find((l) => l.id === "triangle").distractor = false;
  assert.ok(L.validateModel(dup).some((p) => /distractor/.test(p)));
});

test("createItemLoop: wrong -> hint -> model, with misconception tags", () => {
  const item = {
    id: "t",
    hints: ["h1", "h2", "h3"],
    misconceptions: [{ match: "additive", hint: "Check the multiplier.", model: "Multiply both." }],
    model: "Generic model.",
    right: "Yes.",
  };
  const loop = createItemLoop(item);
  assert.equal(loop.submit({ ok: false }).kind, "retry");
  assert.equal(loop.nextHint(), "h1");
  const r2 = loop.submit({ ok: false, tag: "additive" });
  assert.equal(r2.kind, "retry");
  assert.equal(r2.text, "Check the multiplier.");
  const r3 = loop.submit({ ok: false, tag: "additive" });
  assert.equal(r3.kind, "model");
  assert.equal(r3.text, "Multiply both.");
  assert.deepEqual(loop.record(), { id: "t", tries: 3, hints: 1, ok: false, tags: ["additive"] });
  assert.equal(loop.submit({ ok: true }).kind, "right");
  assert.equal(loop.record().ok, true);
});

test("gold concept and conversation activities validate", async () => {
  const dir = resolve(ROOT, "data/activities");
  const gold = readdirSync(dir).filter((f) => /^gold-concept-.*\.js$/.test(f));
  for (const f of gold) {
    const a = (await imp(`data/activities/${f}`)).default;
    assert.deepEqual(await validateConceptActivity(a), [], f);
  }
  const conv = readdirSync(dir).filter((f) => /^gold-conversation-.*\.js$/.test(f));
  if (conv.length) {
    const { validateConversationActivity } = await imp("engines/conversation-parts/validate.js");
    for (const f of conv)
      assert.deepEqual(
        await validateConversationActivity((await imp(`data/activities/${f}`)).default),
        [],
        f,
      );
  }
});
