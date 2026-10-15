// Curriculum 2.0 core: exact rational engine, EWLStateStore and the deterministic reasoning engine.
//   node tools/ewl-core.test.mjs
import assert from "node:assert/strict";
import { loadEwl } from "./lib/ewl-vm.mjs";

const run = (extra) => loadEwl({ only: ["rational.js", "state-store.js", "reasoning.js"], extra });
const ctx = run();
const { Rat, Store, Reason } = ctx.EWL;

// ---- Rat: 3/5 = 6/10 = 60/100 = 0.6 = 60% -------------------------------------------------------------------
const three5 = Rat.of(3, 5);
for (const s of ["3/5", "6/10", "60/100", "0.6", "60%", ".6", "0.60", "6/10 "])
  assert.ok(three5.eq(Rat.parse(s)), `${s} should equal 3/5`);
assert.equal(three5.percent(), "60%");
assert.equal(three5.decimal().text, "0.6");
assert.equal(Rat.of(1, 3).decimal().text, "0.(3)");
assert.ok(Rat.parse("0.(3)").eq(Rat.of(1, 3)));
assert.ok(Rat.parse("1.2(45)").eq(Rat.of(1245 - 12, 990)));
assert.equal(Rat.of(1, 3).percent(), "33 1/3%");
assert.equal(Rat.of(7, 4).mixed(), "1 3/4");
assert.ok(Rat.parse("1 3/4").eq(Rat.of(7, 4)));
assert.ok(Rat.parse("-2 1/2").eq(Rat.of(-5, 2)));
assert.ok(Rat.parse("1,250").eq(Rat.of(1250)));
assert.ok(Rat.parse("$12.50").eq(Rat.of(25, 2)));
assert.equal(Rat.parse("abc"), null);
assert.equal(Rat.parse("1/0"), null);
assert.equal(Rat.parse(""), null);
assert.throws(
  () => Rat.of(1, 0),
  (e) => e.name === "RangeError",
);
assert.throws(
  () => Rat.of(1).div(Rat.of(0)),
  (e) => e.name === "RangeError",
);
// the float traps that a teacher would not forgive
assert.ok(Rat.parse("0.1").add(Rat.parse("0.2")).eq(Rat.parse("0.3")));
assert.ok(Rat.of(1, 3).add(Rat.of(1, 3)).add(Rat.of(1, 3)).eq(1));
assert.ok(Rat.parse("20%").mul(Rat.parse("50")).eq(10));
// 20% off then 10% off is 28% off, not 30%
assert.equal(Reason.Task.percentStack("20%", "10%").answer.percent(), "28%");
assert.ok(
  Rat.of(2, 4).eq(Rat.of(1, 2)) && Rat.of(-1, -2).eq(Rat.of(1, 2)) && Rat.of(1, -2).sign() === -1,
);
assert.equal(Rat.of(2, 3).pow(-2).frac(), "9/4");
assert.equal(Rat.of(-7, 2).floor(), -4n);
// random identities: (a+b)-b = a, a*b/b = a, cmp is antisymmetric
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
for (let i = 0; i < 2000; i++) {
  const a = Rat.of(Math.floor(rnd() * 400) - 200, Math.floor(rnd() * 60) + 1);
  const b = Rat.of(Math.floor(rnd() * 400) - 200, Math.floor(rnd() * 60) + 1);
  assert.ok(a.add(b).sub(b).eq(a));
  if (!b.isZero()) assert.ok(a.mul(b).div(b).eq(a));
  assert.equal(a.cmp(b), -b.cmp(a));
  assert.ok(
    Rat.parse(a.decimal(60).text).eq(a) || !a.isTerminating() || a.decimal(60).text.includes("("),
  );
  assert.ok(Rat.parse(a.frac()).eq(a) && Rat.parse(a.mixed()).eq(a));
  if (a.isTerminating()) assert.ok(Rat.parse(a.decimal().text).eq(a), `decimal round trip ${a}`);
  assert.ok(Rat.parse(a.decimal(60).text.includes("(") ? a.decimal(60).text : a.frac()).eq(a));
}

// ---- Store ---------------------------------------------------------------------------------------------------
const st = Store.create({
  storage: {
    _m: {},
    getItem(k) {
      return this._m[k] ?? null;
    },
    setItem(k, v) {
      this._m[k] = v;
    },
    removeItem(k) {
      delete this._m[k];
    },
  },
});
let notified = 0;
const off = st.subscribe(() => notified++);
st.setLesson("5-8");
assert.equal(st.get().unit, 5);
assert.throws(
  () => st.markStage("5-8", "nope"),
  (e) => e.name === "RangeError",
);
st.markStage("5-8", "curious");
st.markStage("5-8", "lab");
assert.equal(st.stagesDone("5-8").join(), "curious,lab");
off();
st.setCheck("5-8", "repair", "slant height");
assert.ok(notified >= 3);
assert.equal(st.get().checks["5-8"].status, "repair");
assert.equal(
  st.hydrateFromUrl("?unit=5&lesson=5-8&preset=slant-height&lens=tape&mode=debug").ignored.length,
  0,
);
assert.equal(st.get().prefs.lens, "tape");
assert.equal(st.hydrateFromUrl("?lesson=../../x&lens=a b").ignored.sort().join(), "lens,lesson");
// a corrupt saved state must never crash page load
const bad = Store.create({
  storage: { getItem: () => "{not json", setItem() {}, removeItem() {} },
});
assert.equal(bad.get().v, 1);
const badShape = Store.create({
  storage: {
    getItem: () => JSON.stringify({ v: 1, lesson: "evil" }),
    setItem() {},
    removeItem() {},
  },
});
assert.equal(badShape.get().lesson, null);
// passport: node Buffer path and browser btoa path must produce the same code
const code = st.exportPassport();
const b = run({ btoa, atob });
const st2 = b.EWL.Store.create({ storage: { getItem: () => null, setItem() {}, removeItem() {} } });
assert.ok(st2.importPassport(code).ok, "browser path imports node-made code");
assert.equal(st2.get().lesson, "5-8");
assert.ok(
  !st2.importPassport("abc").ok && !st2.importPassport(`${code}x`).ok && !st2.importPassport("").ok,
);
// selfTest used by ?diag=1
const self = st.selfTest();
assert.ok(self.ok, JSON.stringify(self.results.filter((r) => !r.ok)));
assert.ok(self.results.length >= 8);

// ---- Reason: every rule is distinguishable from the right answer, and matched by value ---------------------------
const tasks = {
  "frac-add": [
    Reason.Task.fracAdd("1/2", "1/3"),
    Reason.Task.fracAdd("2/5", "3/4"),
    Reason.Task.fracAdd("3/8", "1/6"),
  ],
  "frac-compare": [Reason.Task.fracCompare("1/8", "1/2"), Reason.Task.fracCompare("3/4", "5/12")],
  "decimal-compare": [
    Reason.Task.decimalCompare("0.25", "0.3"),
    Reason.Task.decimalCompare("0.5", "0.45"),
  ],
  "percent-stack": [Reason.Task.percentStack("20%", "10%"), Reason.Task.percentStack("30%", "25%")],
  "percent-of": [Reason.Task.percentOf("35%", "80"), Reason.Task.percentOf("12%", "250")],
  "unit-price": [Reason.Task.unitPrice(3, 3, 8, 4), Reason.Task.unitPrice(12, 9, 20, 14)],
  "scale-volume": [Reason.Task.scaleVolume(2, 3, 4, 2), Reason.Task.scaleVolume(1, 1, 2, 3)],
  "frac-divide": [
    Reason.Task.divideFractions("3", "1/2"),
    Reason.Task.divideFractions("2/3", "4/5"),
  ],
};
let ruleHits = 0;
for (const r of Reason.rules()) {
  assert.ok(r.nudge && r.nudgeEs && r.name && r.nameEs, `${r.id} has English and Spanish text`);
  for (const kind of r.kinds)
    for (const task of tasks[kind] ?? []) {
      const w = r.wrong(task);
      assert.ok(
        !w.eq(task.answer),
        `${r.id}: the flawed answer equals the right one on ${kind} ${JSON.stringify(task.facts, (k, v) => (typeof v === "bigint" ? String(v) : v))}`,
      );
      const d = Reason.diagnose(task, { value: w });
      assert.equal(d.rule?.id, r.id, `${r.id} should be matched by its own wrong answer`);
      assert.ok(Reason.diagnose(task, { value: task.answer }).correct);
      assert.ok(r.counter(task).length > 20);
      ruleHits++;
    }
}
assert.ok(ruleHits >= 16, `rules exercised: ${ruleHits}`);
// no kind goes without a rule
for (const kind of Object.keys(tasks))
  assert.ok(
    Reason.rules().some((r) => r.kinds.includes(kind)),
    `rule for ${kind}`,
  );
// the ladder never reveals before the last step, and never on a correct answer
const t0 = Reason.Task.percentStack("20%", "10%");
const wrong = { value: "30%" };
for (let s = 0; s < 3; s++) assert.equal(Reason.ladder(t0, wrong, s).reveal, undefined);
assert.equal(Reason.ladder(t0, wrong, 3).reveal, "7/25");
assert.ok(!/28|7\/25/.test(Reason.ladder(t0, wrong, 0).text + Reason.ladder(t0, wrong, 1).text));
assert.ok(Reason.ladder(t0, { value: "28%" }, 0).text.includes("matches"));
assert.equal(Reason.diagnose(t0, { value: "abc" }).reason, "unreadable");
// counterexample text uses real numbers from the task
assert.match(Reason.ladder(t0, wrong, 2).text, /\$80/);
assert.match(Reason.ladder(t0, wrong, 2).text, /\$72/);
// rule registration is validated
assert.throws(
  () => Reason.registerRule({ id: "x" }),
  (e) => e.name === "TypeError",
);
assert.throws(() => Reason.registerRule(Reason.rules()[0]), /duplicate/);

// ---- Argument rubric -------------------------------------------------------------------------------------------
const spec = { numbers: ["28%"], vocab: ["discount", "percent"], needLimit: true };
const weak = Reason.scoreArgument("It is 30 percent", spec);
assert.ok(!weak.complete && weak.next);
const strong = Reason.scoreArgument(
  "The two discounts are not 30 percent because the second discount is taken off a smaller price, so $100 becomes $72 and the total discount is 28%. But if you took both off the original price it would be 30%.",
  spec,
);
assert.ok(strong.complete, JSON.stringify(strong.checks.filter((c) => !c.ok)));
assert.equal(Reason.scoreArgument("", spec).done, 0);
assert.ok(
  Reason.scoreArgument(
    "Esto es 0.28 porque el segundo descuento es menor, pero solo si el precio baja",
    { numbers: ["28%"], vocab: ["descuento"] },
  ).checks.find((c) => c.id === "evidence").ok,
);
// AI replies that print a number nobody wrote are dropped
assert.ok(Reason.replySafe("What does the 28 tell you?", "I got 28 percent"));
assert.ok(!Reason.replySafe("Is it 72?", "I got 28 percent"));
assert.equal(await Reason.coach({ response: "" }), null);

console.log(
  `ewl-core: Rat (2,000 identity trials), Store (${self.results.length} self-tests), Reason (${Reason.rules().length} rules, ${ruleHits} checks) ok.`,
);
