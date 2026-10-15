// Math Reality Lab modes: Counterexample Forge, Invariant Hunter, Sketch compiler (pure logic + data validators).
//   node tools/ewl-modes.test.mjs
// The validators are exported for the lead's integration test; the tests run only when this file is the entry point.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadEwl } from "./lib/ewl-vm.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

export const ONLY = [
  "rational.js",
  "state-store.js",
  "reasoning.js",
  "ui.js",
  "forge-expr.js",
  "forge-engine.js",
  "invariant-engine.js",
  "sketch-model.js",
  "sketch-check.js",
  "sketch-compile.js",
  "sketch-stories.js",
];
const REPO_UNITS = new Set([2, 3, 4, 5, 6, 7, 8, 9]); // Unit 10 is not taught: nothing may target it.

/** Lesson ids exist in the launch manifest, sit in the unit the entry names, and the standard is the lesson's own and a real code. */
export function validatePlacement(entry, label, manifest, standards) {
  const problems = [];
  const P = (m) => problems.push(`${label} ${entry.id}: ${m}`);
  if (!REPO_UNITS.has(entry.unit)) P(`unit ${entry.unit} is not a taught unit`);
  if (!Array.isArray(entry.lessons) || !entry.lessons.length)
    return [...problems, `${label} ${entry.id}: no lessons`];
  const stds = [];
  for (const id of entry.lessons) {
    const l = manifest.lessons.find((x) => x.id === id);
    if (!l) P(`lesson ${id} is not in the launch manifest`);
    else {
      if (l.unit !== entry.unit) P(`lesson ${id} is in unit ${l.unit}, not ${entry.unit}`);
      stds.push(l.standard);
    }
  }
  if (!standards.standards[entry.standard])
    P(`standard ${entry.standard} is not in data/ccss-standards.json`);
  else if (stds.length && !stds.includes(entry.standard))
    P(`standard ${entry.standard} is not the standard of ${entry.lessons.join(", ")}`);
  return problems;
}
const hasEs = (o, keys) => keys.filter((k) => !o[k] || !o[`${k}Es`]).map((k) => `missing ${k}Es`);

export function validateForgeData(ewl, data, manifest, standards) {
  const problems = ewl.Forge.validate(data);
  for (const b of data.bots || []) {
    problems.push(...validatePlacement(b, "bot", manifest, standards));
    problems.push(...hasEs(b, ["persona", "ruleWords", "task"]).map((m) => `bot ${b.id}: ${m}`));
    for (const r of b.repairs || [])
      if (!r.textEs) problems.push(`bot ${b.id}: repair ${r.id} missing textEs`);
  }
  return problems;
}
export function validateInvariantData(ewl, data, manifest, standards) {
  const problems = ewl.Invariant.validate(data);
  for (const h of data.hunts || []) {
    problems.push(...validatePlacement(h, "hunt", manifest, standards));
    for (const c of h.candidates || [])
      if (!c.labelEs) problems.push(`hunt ${h.id}: candidate ${c.id} missing labelEs`);
  }
  return problems;
}
export function validateSketchStories(ewl, stories, manifest, standards) {
  const problems = [];
  const ids = new Set();
  if (!Array.isArray(stories) || stories.length < 6) return ["need at least 6 stories"];
  for (const s of stories) {
    if (!ewl.ID_RE.test(`ewl.sketch.${s.id}`)) problems.push(`story ${s.id}: bad slug`);
    if (ids.has(s.id)) problems.push(`story ${s.id}: duplicate`);
    ids.add(s.id);
    problems.push(...hasEs(s, ["title", "text", "task"]).map((m) => `story ${s.id}: ${m}`));
    if (!["tape", "nline", "dnline"].includes(s.kind)) problems.push(`story ${s.id}: bad kind`);
    if (!s.spec) problems.push(`story ${s.id}: no spec`);
    problems.push(...validatePlacement(s, "story", manifest, standards));
  }
  return problems;
}

/* ---------- independent oracles (written without the engine) ---------- */
const trueAnswers = (Rat) => ({
  kofi: (e) => (e.a.mul(e.b).gt(e.a) ? 1 : e.a.gt(e.a.mul(e.b)) ? 2 : 0),
  sasha: (e) => e.a.add(e.b),
  milo: (e) => (e.a.gt(e.b) ? 1 : e.b.gt(e.a) ? 2 : 0),
  zara: (e) => Rat.of(1).sub(Rat.of(1).sub(e.p1).mul(Rat.of(1).sub(e.p2))),
  devon: (e) => e.l.mul(e.w).mul(e.h).mul(e.k.pow(3)),
});
const TRUE_REPAIRS = {
  kofi: ["gt-one"],
  sasha: ["common-bottom"],
  milo: ["same-places"],
  zara: ["new-price", "add-minus-overlap"],
  devon: ["stretch-each-edge"],
};
const REASON_RULE = {
  sasha: "add-denominators",
  milo: "longer-decimal-bigger",
  zara: "percent-stack",
  devon: "scale-volume-linear",
};
// hunt oracles: independent move functions and the quantities that truly never change
const HUNT_ORACLE = {
  "ratio-scale": {
    holds: ["ratio", "ratio-inv"],
    moves: {
      times: (s, p) => ({ j: s.j.mul(p.k), w: s.w.mul(p.k) }),
      divide: (s, p) => ({ j: s.j.div(p.k), w: s.w.div(p.k) }),
    },
    q: {
      ratio: (s) => s.j.div(s.w),
      "ratio-inv": (s) => s.w.div(s.j),
      diff: (s) => s.j.sub(s.w),
      sum: (s) => s.j.add(s.w),
      prod: (s) => s.j.mul(s.w),
    },
  },
  "ratio-shift": {
    holds: ["diff", "diff-inv"],
    moves: { plus: (s, p) => ({ j: s.j.add(p.c), w: s.w.add(p.c) }) },
    q: {
      diff: (s) => s.w.sub(s.j),
      "diff-inv": (s) => s.j.sub(s.w),
      ratio: (s) => s.j.div(s.w),
      sum: (s) => s.j.add(s.w),
      prod: (s) => s.j.mul(s.w),
    },
  },
  "balance-solution": {
    holds: ["solution", "neg-solution"],
    moves: {
      add: (s, p) => ({ b: s.b.add(p.d), c: s.c.add(p.d) }),
      sub: (s, p) => ({ b: s.b.sub(p.d), c: s.c.sub(p.d) }),
      times: (s, p) => ({ a: s.a.mul(p.k), b: s.b.mul(p.k), c: s.c.mul(p.k) }),
    },
    q: {
      solution: (s) => s.c.sub(s.b).div(s.a),
      "neg-solution": (s) => s.b.sub(s.c).div(s.a),
      a: (s) => s.a,
      b: (s) => s.b,
      c: (s) => s.c,
      cb: (s) => s.c.sub(s.b),
    },
  },
  "regroup-sum": {
    holds: ["sum"],
    moves: {
      "to-first": (s, p) => ({ a: s.a.add(p.c), b: s.b.sub(p.c) }),
      "to-second": (s, p) => ({ a: s.a.sub(p.c), b: s.b.add(p.c) }),
    },
    q: {
      sum: (s) => s.a.add(s.b),
      diff: (s) => s.a.sub(s.b),
      prod: (s) => s.a.mul(s.b),
      a: (s) => s.a,
      b: (s) => s.b,
    },
  },
  "rect-scale": {
    holds: ["ratio", "ratio-inv", "corner"],
    moves: { scale: (s, p) => ({ w: s.w.mul(p.k), h: s.h.mul(p.k) }) },
    q: {
      ratio: (s) => s.w.div(s.h),
      "ratio-inv": (s) => s.h.div(s.w),
      corner: (s) => s.corner,
      area: (s) => s.w.mul(s.h),
      perimeter: (s) => s.w.add(s.h).mul(2),
      diff: (s) => s.h.sub(s.w),
    },
  },
  "reflect-axes": {
    holds: ["absx", "absy", "dist"],
    moves: { "across-y": (s) => ({ x: s.x.neg() }), "across-x": (s) => ({ y: s.y.neg() }) },
    q: {
      absx: (s) => s.x.abs(),
      absy: (s) => s.y.abs(),
      dist: (s) => s.x.mul(s.x).add(s.y.mul(s.y)),
      x: (s) => s.x,
      y: (s) => s.y,
      xy: (s) => s.x.mul(s.y),
    },
  },
  "slide-distance": {
    holds: ["gap", "dist"],
    moves: {
      right: (s, p) => ({ p: s.p.add(p.c), q: s.q.add(p.c) }),
      left: (s, p) => ({ p: s.p.sub(p.c), q: s.q.sub(p.c) }),
    },
    q: {
      gap: (s) => s.q.sub(s.p),
      dist: (s) => s.q.sub(s.p).abs(),
      sum: (s) => s.p.add(s.q),
      p: (s) => s.p,
      mid: (s) => s.p.add(s.q).div(2),
    },
  },
};

const none = (list, msg) =>
  assert.equal(list.length, 0, `${msg || "problems"}: ${JSON.stringify([...list])}`);

function main() {
  const ewl = loadEwl({ only: ONLY }).EWL;
  const {
    Rat,
    Forge,
    Invariant,
    Expr,
    SketchModel: M,
    SketchCheck: K,
    SketchCompile: C,
    SketchStories: S,
  } = ewl;
  const manifest = json("data/curriculum-launch-manifest.json");
  const standards = json("data/ccss-standards.json");
  const forgeData = json("data/ewl/forge-bots.json");
  const invData = json("data/ewl/invariants.json");

  // ---- Expr: safe, exact, no code execution --------------------------------------------------------------------
  assert.ok(
    Expr.evaluate(["add", "a", "b"], { a: Rat.of(1, 3), b: Rat.of(1, 6) }).eq(Rat.of(1, 2)),
  );
  for (const bad of [
    "constructor",
    "__proto__",
    "alert(1)",
    "a;b",
    "a +",
    "((a)",
    "a^9",
    "a b",
    "x".repeat(60),
  ])
    assert.equal(Expr.parse(bad, ["a", "b"]).ok, false, `must reject ${bad}`);
  assert.ok(Expr.parse("abs(a - b) / 2 + a^2", ["a", "b"]).ok);
  assert.ok(Expr.validate(["eval", "a"], ["a"]).length > 0, "unknown op rejected");
  assert.ok(Expr.validate(["add", "zzz", 1], ["a"]).length > 0, "unknown variable rejected");
  assert.equal(Expr.attempt(["div", 1, 0], {}), null, "divide by zero is null, not a crash");
  assert.equal(Expr.attempt("a", {}), null, "unbound variable is null");

  // ---- Forge -----------------------------------------------------------------------------------------------------
  assert.equal(forgeData.bots.map((b) => b.name).join(), "Kofi,Sasha,Milo,Zara,Devon");
  none(validateForgeData(ewl, forgeData, manifest, standards));
  const truth = trueAnswers(Rat);
  const cases = (b) => Forge.sweepCases(b, 240);
  let repairChecks = 0;
  for (const b of forgeData.bots) {
    const oracle = truth[b.id];
    const num = (x) => (typeof x === "number" ? Rat.of(x) : x);
    // the data's truth program agrees with the independent oracle on every sweep case
    for (const env of cases(b))
      assert.ok(
        Forge.truth(b, env).eq(num(oracle(env))),
        `${b.id}: truth program disagrees with oracle`,
      );
    // the flawed rule really fails somewhere, and also really passes somewhere or is plausible (not always wrong on trivial input)
    const fails = cases(b).filter((env) => !Forge.botSays(b, env).eq(num(oracle(env)))).length;
    assert.ok(fails > 0, `${b.id}: the flawed rule never fails`);
    assert.ok(
      Forge.check(b, Forge.parseInputs(b, b.showMe).env).breaks,
      `${b.id}: showMe must break`,
    );
    // the sweep is at least 200 seeded inputs
    assert.ok(Forge.sweep(b, b.truth).total >= 200);
    // repairs: true ones accepted (with the bot's own counterexample), every other one rejected
    const counter = [Forge.parseInputs(b, b.showMe).env];
    for (const r of b.repairs) {
      const verdict = Forge.judgePatch(b, r, counter);
      const expectPass = TRUE_REPAIRS[b.id].includes(r.id);
      assert.equal(
        verdict.accepted,
        expectPass,
        `${b.id}/${r.id}: expected ${expectPass ? "accept" : "reject"} (failed ${verdict.sweep.failed})`,
      );
      if (!expectPass)
        assert.ok(
          verdict.sweep.failed >= 1 && verdict.sweep.firstFail,
          `${b.id}/${r.id}: a rejection names a failing case`,
        );
      repairChecks++;
    }
    assert.ok(
      b.repairs.some((r) => !TRUE_REPAIRS[b.id].includes(r.id)),
      `${b.id}: needs wrong repairs`,
    );
    // a repair that is right on the sweep but wrong on the student's own counterexample is rejected
    const fake = { rule: ["if", ["gt", ["k", "1000000"], 0], b.rule, b.truth], id: "x" };
    assert.equal(
      Forge.judgePatch(b, fake, counter).accepted,
      false,
      `${b.id}: keeping the flawed rule is rejected`,
    );
    // every pooled value is accepted by input parsing; bad input is refused with a message in both languages
    assert.equal(
      Forge.parseInputs(b, Object.fromEntries(b.inputs.map((i) => [i.id, "abc"]))).ok,
      false,
    );
    const empty = Forge.parseInputs(b, {});
    assert.ok(!empty.ok && empty.error && empty.errorEs);
    // hints: question -> picture -> range, never the showMe input
    for (let s = 0; s < 3; s++) {
      const h = Forge.hint(b, s, "en");
      assert.ok(h.text.length > 15);
      assert.ok(Forge.hint(b, s, "es").text.length > 15);
      for (const k of Object.keys(b.showMe))
        assert.ok(
          !new RegExp(`\\b${b.showMe[k].replace("/", "\\/")}\\b`).test(h.text) ||
            b.showMe[k].length < 2,
          `${b.id}: hint ${s} must not state the failing input`,
        );
    }
  }
  // Forge rules that reuse EWL.Reason ids really match the Reason rule's wrong answer
  const reasonTasks = {
    sasha: (e) => ewl.Reason.Task.fracAdd(e.a, e.b),
    milo: (e) => ewl.Reason.Task.decimalCompare(e.a, e.b),
    zara: (e) => ewl.Reason.Task.percentStack(e.p1, e.p2),
    devon: (e) => ewl.Reason.Task.scaleVolume(e.l, e.w, e.h, e.k),
  };
  for (const id of Object.keys(REASON_RULE)) {
    const b = forgeData.bots.find((x) => x.id === id);
    assert.equal(b.reasonRule, REASON_RULE[id]);
    const rule = ewl.Reason.ruleFor(b.reasonRule);
    assert.ok(rule, `Reason rule ${b.reasonRule} exists`);
    if (id === "milo") continue; // Reason's tie-break differs; equal-digit cases are compared by value elsewhere
    for (const env of cases(b).slice(0, 60)) {
      const task = reasonTasks[id](env);
      const w = rule.wrong(task);
      const mine = Forge.botSays(b, env);
      if (id === "devon")
        assert.ok(
          mine.eq(env.l.mul(env.w).mul(env.h).mul(w)),
          "devon rule == volume * Reason wrong factor",
        );
      else if (id === "sasha") assert.ok(mine.eq(w), "sasha rule == Reason add-denominators");
      else assert.ok(mine.eq(w), "zara rule == Reason percent-stack");
    }
  }
  // negative controls: a corrupted bot is reported
  const bad1 = structuredClone(forgeData);
  bad1.bots[0].rule = bad1.bots[0].truth; // a "flawed" rule that is right
  assert.ok(
    Forge.sweep(bad1.bots[0], bad1.bots[0].rule).failed === 0,
    "control: a correct rule shows zero failures",
  );
  const bad2 = structuredClone(forgeData);
  bad2.bots[1].lessons = ["8-2"];
  assert.ok(
    validateForgeData(ewl, bad2, manifest, standards).some((p) => /unit/.test(p)),
    "control: wrong-unit lesson is caught",
  );
  const bad3 = structuredClone(forgeData);
  bad3.bots[2].lessons = ["99-9"];
  assert.ok(
    validateForgeData(ewl, bad3, manifest, standards).some((p) =>
      /not in the launch manifest/.test(p),
    ),
  );
  const bad4 = structuredClone(forgeData);
  bad4.bots[3].standard = "6.ZZ.9";
  assert.ok(
    validateForgeData(ewl, bad4, manifest, standards).some((p) => /ccss-standards/.test(p)),
  );
  const bad5 = structuredClone(forgeData);
  delete bad5.bots[4].lines.foundEs;
  assert.ok(
    validateForgeData(ewl, bad5, manifest, standards).length > 0,
    "control: missing Spanish line is caught",
  );
  const bad6 = structuredClone(forgeData);
  bad6.bots[0].truth = ["eval", "a"];
  assert.ok(
    validateForgeData(ewl, bad6, manifest, standards).length > 0,
    "control: unknown op is caught",
  );
  const bad7 = structuredClone(forgeData);
  bad7.bots[0].unit = 10;
  assert.ok(
    validateForgeData(ewl, bad7, manifest, standards).some((p) => /not a taught unit/.test(p)),
    "control: Unit 10 refused",
  );

  // ---- Invariant Hunter ------------------------------------------------------------------------------------------
  assert.ok(invData.hunts.length >= 6);
  none(validateInvariantData(ewl, invData, manifest, standards));
  let seed = 20261015;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  let sequences = 0;
  for (const h of invData.hunts) {
    const o = HUNT_ORACLE[h.id];
    assert.ok(o, `oracle for ${h.id}`);
    assert.equal(
      [...Invariant.truths(h)].sort().join(),
      [...o.holds].sort().join(),
      `${h.id}: engine and oracle disagree on what holds`,
    );
    const survived = Object.fromEntries(Object.keys(o.q).map((k) => [k, true]));
    for (let n = 0; n < 500; n++) {
      let s = Object.fromEntries(h.vars.map((v) => [v.id, Rat.parse(pick(h.start[v.id]))]));
      const q0 = Object.fromEntries(Object.keys(o.q).map((k) => [k, o.q[k](s)]));
      const steps = 1 + Math.floor(rnd() * 5);
      for (let i = 0; i < steps; i++) {
        const m = pick(h.moves);
        const p = Object.fromEntries((m.params || []).map((q) => [q.id, Rat.parse(pick(q.pool))]));
        s = { ...s, ...o.moves[m.id](s, p) };
        for (const k of Object.keys(o.q)) if (!o.q[k](s).eq(q0[k])) survived[k] = false;
      }
      sequences++;
    }
    for (const k of Object.keys(o.q))
      assert.equal(
        survived[k],
        o.holds.includes(k),
        `${h.id}/${k}: ${o.holds.includes(k) ? "should hold in 500 of 500" : "should break"}`,
      );
    // every false candidate yields a concrete first break; every true one holds N of N
    for (const c of h.candidates) {
      const r = Invariant.test(
        h,
        Expr.parse(
          c.expr,
          h.vars.map((v) => v.id),
        ).node,
      );
      if (o.holds.includes(c.id)) assert.ok(r.holds && r.held === r.runs, `${h.id}/${c.id}`);
      else
        assert.ok(
          !r.holds &&
            r.firstBreak &&
            r.firstBreak.steps.length >= 1 &&
            !r.firstBreak.from.eq(r.firstBreak.to ?? Rat.of(-999999)),
          `${h.id}/${c.id} must give a first break`,
        );
    }
    // a student-built expression equal to a true invariant holds; a near miss breaks
    const first = h.candidates.find((c) => o.holds.includes(c.id));
    assert.ok(
      Invariant.test(
        h,
        Expr.parse(
          `(${first.expr}) + 0`,
          h.vars.map((v) => v.id),
        ).node,
      ).holds,
    );
    assert.ok(
      !Invariant.test(
        h,
        Expr.parse(
          `(${first.expr}) + ${h.vars[0].id}`,
          h.vars.map((v) => v.id),
        ).node,
      ).holds,
      "control: invariant plus a moving variable breaks",
    );
    // text() renders without raw placeholders
    assert.ok(
      !/[{}]/.test(
        Invariant.text(h, Object.fromEntries(h.vars.map((v) => [v.id, Rat.of(3)])), "es"),
      ),
    );
  }
  const bi1 = structuredClone(invData);
  bi1.hunts[0].lessons = ["4-4"];
  assert.ok(validateInvariantData(ewl, bi1, manifest, standards).some((p) => /unit/.test(p)));
  const bi2 = structuredClone(invData);
  bi2.hunts[1].candidates = bi2.hunts[1].candidates.filter(
    (c) => !["diff", "diff-inv"].includes(c.id),
  );
  assert.ok(
    Invariant.validate(bi2).some((p) => /candidates|no candidate/.test(p)),
    "control: no true candidate is caught",
  );
  const bi3 = structuredClone(invData);
  bi3.hunts[2].candidates[0].labelEs = "";
  assert.ok(validateInvariantData(ewl, bi3, manifest, standards).length > 0);
  const bi4 = structuredClone(invData);
  bi4.hunts[3].standard = "6.AT.99";
  assert.ok(
    validateInvariantData(ewl, bi4, manifest, standards).some((p) => /ccss-standards/.test(p)),
  );
  const bi5 = structuredClone(invData);
  bi5.hunts[4].moves[0].set = { w: ["add", "nope", 1] };
  assert.ok(
    Invariant.validate(bi5).length > 0,
    "control: move using an unknown variable is caught",
  );

  // ---- Sketch compiler -------------------------------------------------------------------------------------------
  none(validateSketchStories(ewl, S, manifest, standards));
  assert.ok(S.length >= 6);
  const build = {
    tape(rows, bracketLabel, names, extra = {}) {
      const d = M.create("tape");
      rows.forEach((n, r) => {
        for (let c = 0; c < n; c++) M.place(d, "block", r, c);
        if (names?.[r]) M.setLabel(d, "nameRow", r, 0, names[r]);
      });
      if (bracketLabel !== null) {
        M.place(d, "bracket", 3, 1);
        M.setLabel(d, "labelBlock", 3, 1, bracketLabel);
      }
      for (const [k, v] of Object.entries(extra.labels || {})) {
        const [r, c] = k.split(",").map(Number);
        M.setLabel(d, "labelBlock", r, c, v);
      }
      for (const k of extra.shade || []) M.place(d, "shade", ...k);
      return d;
    },
  };
  const story = (id) => S.find((s) => s.id === id);
  const good = {
    "trail-mix": build.tape([3, 5], null, ["raisins", "nuts"]),
    "paint-total": build.tape([2, 3], "20", ["blue", "white"], { labels: { "0,0": "?" } }),
    "walk-to-school": build.tape([4], "40", [], { shade: [[0, 0]] }),
    "x-plus-5": build.tape([2], "12", [], { labels: { "0,0": "x", "0,1": "5" } }),
    "three-x": build.tape([3], "12", [], { labels: { "0,0": "x", "0,1": "x", "0,2": "x" } }),
  };
  const dn = M.create("dnline");
  for (const c of [0, 4, 8]) for (const r of [0, 1]) M.place(dn, "tick", r, c);
  for (const [r, c, v] of [
    [0, 0, "0"],
    [1, 0, "0"],
    [0, 4, "?"],
    [1, 4, "1"],
    [0, 8, "120"],
    [1, 8, "2"],
  ])
    M.setLabel(dn, "labelTick", r, c, v);
  M.setLabel(dn, "nameRow", 0, 0, "miles");
  M.setLabel(dn, "nameRow", 1, 0, "hours");
  good["car-unit-rate"] = dn;
  const nl = M.create("nline");
  M.place(nl, "tick", 0, 4); // -5 + 4/2 = -3
  M.place(nl, "tick", 0, 15); // -5 + 15/2 = 5/2
  good["submarine-gull"] = nl;
  for (const s of S) {
    const d = good[s.id];
    assert.ok(d, `a correct diagram for ${s.id}`);
    const r = K.check(s, d);
    assert.ok(r.ok, `${s.id} correct diagram rejected: ${JSON.stringify(r.issues)}`);
    const c = C.compile(s, d, true);
    assert.ok(
      c.says.length && c.says.every((x) => x.en && x.es),
      `${s.id} compiles with EN and ES`,
    );
  }
  // compiled math (independent expectations)
  assert.equal(C.compile(story("trail-mix"), good["trail-mix"], true).table.rows[1].join(), "6,10");
  assert.match(
    C.compile(story("paint-total"), good["paint-total"], true)
      .solve.map((x) => x.en)
      .join(" "),
    /One part is 20 ÷ 5 = 4.*2 × 4 = 8/,
  );
  assert.match(
    C.compile(story("walk-to-school"), good["walk-to-school"], true)
      .solve.map((x) => x.en)
      .join(" "),
    /1\/4 × 40 = 10/,
  );
  assert.equal(C.compile(story("x-plus-5"), good["x-plus-5"], true).equation.en, "x + 5 = 12");
  assert.match(
    C.compile(story("x-plus-5"), good["x-plus-5"], true)
      .solve.map((x) => x.en)
      .join(" "),
    /= 7/,
  );
  assert.equal(C.compile(story("three-x"), good["three-x"], true).equation.en, "3x = 12");
  assert.match(
    C.compile(story("three-x"), good["three-x"], true)
      .solve.map((x) => x.en)
      .join(" "),
    /x = 12 ÷ 3 = 4/,
  );
  assert.match(
    C.compile(story("car-unit-rate"), good["car-unit-rate"], true).solve[0].en,
    /120 ÷ 2 = 60/,
  );
  assert.match(
    C.compile(story("submarine-gull"), good["submarine-gull"], true).solve[0].en,
    /5 1\/2|5\.5/,
  );
  // a diagram that does not match never receives the solution, but still compiles to what it shows
  const wrongTape = build.tape([3, 4], "20", ["blue", "white"], { labels: { "0,0": "?" } });
  const cw = C.compile(story("paint-total"), wrongTape, false);
  assert.equal(cw.solve, null);
  assert.match(cw.says[1].en, /3 : 4/);
  // specific wrong diagrams -> specific messages
  const msgs = (id, d) =>
    K.check(story(id), d)
      .issues.map((i) => i.en)
      .join(" | ");
  assert.match(
    msgs("trail-mix", build.tape([3, 3], null, ["raisins", "nuts"])),
    /Your nuts row has 3 parts but the story has 5/,
  );
  assert.match(
    msgs("trail-mix", build.tape([5, 3], null, ["raisins", "nuts"])),
    /Your raisins row has 5 parts but the story has 3/,
  );
  assert.match(
    msgs("trail-mix", build.tape([3], null, ["raisins"])),
    /1 tape row but the story needs 2/,
  );
  assert.match(msgs("trail-mix", build.tape([3, 5], null, [])), /Name each row/);
  assert.match(
    msgs("paint-total", build.tape([2, 3], "24", ["blue", "white"], { labels: { "0,0": "?" } })),
    /bracket says 24 but the whole in the story is 20/,
  );
  assert.match(
    msgs("paint-total", build.tape([2, 3], null, ["blue", "white"], { labels: { "0,0": "?" } })),
    /Add a bracket/,
  );
  assert.match(
    msgs("paint-total", build.tape([2, 3], "20", ["blue", "white"])),
    /Mark the part you are looking for with a \?/,
  );
  assert.match(
    msgs("walk-to-school", build.tape([5], "40", [], { shade: [[0, 0]] })),
    /has 5 parts but the story has 4/,
  );
  assert.match(
    msgs("walk-to-school", build.tape([4], "40", [])),
    /shaded 0 parts but the story asks about 1/,
  );
  assert.match(
    msgs("x-plus-5", build.tape([2], "12", [], { labels: { "0,0": "x" } })),
    /blocks? labelled 5/,
  );
  assert.match(
    msgs("three-x", build.tape([2], "12", [], { labels: { "0,0": "x", "0,1": "x" } })),
    /has 2 parts but the story has 3/,
  );
  const gap = build.tape([3], "12", [], { labels: { "0,0": "x", "0,2": "x" } });
  M.place(gap, "block", 0, 4);
  assert.match(msgs("three-x", gap), /should touch/);
  const dnBad = M.clone(dn);
  M.place(dnBad, "tick", 0, 4);
  M.place(dnBad, "tick", 1, 4);
  M.place(dnBad, "tick", 0, 5);
  M.place(dnBad, "tick", 1, 5);
  M.setLabel(dnBad, "labelTick", 0, 5, "?");
  M.setLabel(dnBad, "labelTick", 1, 5, "1");
  assert.match(msgs("car-unit-rate", dnBad), /should sit 1\/2 of the way from 0 to 2/);
  const dnNoNames = M.clone(dn);
  dnNoNames.names = {};
  assert.match(msgs("car-unit-rate", dnNoNames), /Name the top line/);
  const nlBad = M.create("nline");
  M.place(nlBad, "tick", 0, 5);
  M.place(nlBad, "tick", 0, 15);
  assert.match(
    msgs("submarine-gull", nlBad),
    /I do not see a point at −3|I do not see a point at -3/,
  );
  assert.match(msgs("submarine-gull", M.create("nline")), /marked 0 points but the story has 2/);
  assert.ok(!K.check(story("trail-mix"), nl).ok, "wrong kind of diagram is rejected");
  // model hygiene: labels are sanitized and grid bounds enforced
  const hd = M.create("tape");
  assert.equal(M.place(hd, "block", 9, 0), false);
  assert.equal(M.place(hd, "block", 0, 99), false);
  assert.equal(M.place(hd, "bracket", 0, 0), false, "bracket only on the bracket row");
  M.place(hd, "block", 0, 0);
  M.setLabel(hd, "labelBlock", 0, 0, "<img src=x onerror=alert(1)>abcdefghijklmnop");
  assert.ok(!/[<>=]/.test(hd.cells["0,0"].label) && hd.cells["0,0"].label.length <= M.MAX_LABEL);
  assert.throws(
    () => M.create("freehand"),
    (e) => e.name === "RangeError",
  );
  // story negative controls
  const bs1 = structuredClone(S);
  bs1[0].lessons = ["9-1"];
  assert.ok(validateSketchStories(ewl, bs1, manifest, standards).some((p) => /unit/.test(p)));
  const bs2 = structuredClone(S);
  bs2[1].titleEs = "";
  assert.ok(validateSketchStories(ewl, bs2, manifest, standards).length > 0);
  const bs3 = structuredClone(S);
  bs3[2].standard = "6.XX.1";
  assert.ok(validateSketchStories(ewl, bs3, manifest, standards).length > 0);

  // ---- ids and self tests ---------------------------------------------------------------------------------------
  for (const b of forgeData.bots) assert.ok(ewl.ID_RE.test(ewl.id("forge", b.id)));
  for (const h of invData.hunts) assert.ok(ewl.ID_RE.test(ewl.id("invariant", h.id)));
  for (const s of S) assert.ok(ewl.ID_RE.test(ewl.id("sketch", s.id)));
  ewl.Forge.data = forgeData;
  ewl.Invariant.data = invData;
  const failed = ewl.selfTests.map((t) => ({ n: t.name, r: t.run() })).filter((x) => !x.r.ok);
  none(
    failed.map((f) => f.n),
    "registered self tests pass",
  );

  console.log(
    `ewl-modes: ${forgeData.bots.length} bots (${repairChecks} repair verdicts), ${invData.hunts.length} hunts (${sequences} random sequences vs independent oracles), ${S.length} stories ok.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
