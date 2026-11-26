// two-var.test.mjs — every number the two-var play shows a student, recomputed
// independently of the play (integer cents, BigInt), plus validation, choice
// sets and the four authored lesson configs (9-1 to 9-4).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildTwoVarPlay } from "./two-var.js";
import { applyCopy, equationCopy } from "./two-var-copy-solve.js";
import { graphCopy, variablesCopy } from "./two-var-copy.js";
import {
  askChoices,
  atLeastChoices,
  failingRow,
  fmt,
  pairText,
  placeCorrect,
  pointChoices,
  rowsOf,
  ruleCheck,
  ruleChoices,
  scaleOf,
  solveChoices,
  validateSit,
  validateTwoVar,
  yOf,
} from "./two-var-model.js";

const cfgOf = (id) =>
  JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;
const LESSONS = ["9-1", "9-2", "9-3", "9-4"];
const CFG = Object.fromEntries(LESSONS.map((id) => [id, cfgOf(id)]));

/** y = k·x in integer cents, with no floating point: k and x → cents. */
const cents = (k, x) => (BigInt(Math.round(k * 100)) * BigInt(x));
const asNum = (c) => Number(c) / 100;
const clone = (o) => JSON.parse(JSON.stringify(o));

test("the four lessons author a two-var scene and all validate", () => {
  for (const id of LESSONS) {
    assert.equal(CFG[id].kind, "living-scene", id);
    assert.equal(CFG[id].play, "two-var", id);
    assert.ok(validateTwoVar(CFG[id]), id);
  }
  assert.deepEqual(
    LESSONS.map((id) => CFG[id].mode),
    ["variables", "graph", "equation", "apply"],
  );
});

test("validation rejects bad configs", () => {
  const good = CFG["9-3"];
  const bad = [
    null,
    "x",
    {},
    { ...good, mode: "nope" },
    { ...good, main: null },
    { ...good, transfer: null },
    (() => ({ ...clone(good), main: { ...clone(good.main), k: 0 } }))(),
    (() => ({ ...clone(good), main: { ...clone(good.main), k: 24.951 } }))(), // more than two decimals
    (() => ({ ...clone(good), main: { ...clone(good.main), xs: [2, 1, 3] } }))(), // not increasing
    (() => ({ ...clone(good), main: { ...clone(good.main), xs: [1, 2] } }))(), // too few rows
    (() => ({ ...clone(good), main: { ...clone(good.main), xs: [1, 2, 3, 4, 5] } }))(), // too many
    (() => ({ ...clone(good), main: { ...clone(good.main), xMax: 2 } }))(), // a row off the graph
    (() => ({ ...clone(good), main: { ...clone(good.main), xMax: 13 } }))(), // no clean x scale
    (() => ({ ...clone(good), main: { ...clone(good.main), vars: { x: "m", y: "m" } } }))(),
    (() => ({ ...clone(good), main: { ...clone(good.main), xName: "a name that is far too long to fit" } }))(),
    (() => ({ ...clone(good), main: { ...clone(good.main), read: { en: "no tokens", es: "sin" } } }))(),
    (() => ({ ...clone(good), other: { ...clone(good.other), k: 30 } }))(), // flatter line must be smaller
    (() => ({ ...clone(good), probeStart: 2 }))(), // a table row, not a new value
    (() => ({ ...clone(good), probeStart: 99 }))(),
    (() => ({ ...clone(good), main: { ...clone(good.main), xs: [1, 1, 3] } }))(),
  ];
  for (const cfg of bad) {
    assert.equal(validateTwoVar(cfg), null, JSON.stringify(cfg)?.slice(0, 90));
    assert.equal(buildTwoVarPlay(cfg), null);
  }
  // per-mode refusals
  const g = CFG["9-2"];
  assert.equal(validateTwoVar({ ...clone(g), check: { x: 2, y: 190 } }), null); // x is a table row
  assert.equal(validateTwoVar({ ...clone(g), check: { x: 4, y: 180 } }), null); // that point IS on the line
  assert.equal(validateTwoVar({ ...clone(g), check: undefined }), null);
  assert.equal(validateTwoVar({ ...clone(g), pointX: 4 }), null);
  const a = CFG["9-4"];
  assert.equal(validateTwoVar({ ...clone(a), goals: [20, 41] }), null); // 41 is not k·x for whole x
  assert.equal(validateTwoVar({ ...clone(a), goals: [20] }), null);
  assert.equal(validateTwoVar({ ...clone(a), solve: { ...clone(a.solve), target: 50 } }), null); // fits on the graph
  assert.equal(validateTwoVar({ ...clone(a), ask: { x: 8 } }), null);
  const c = clone(a);
  c.transfer.goal = 510; // 510 / 12 = 42.5: needs 43, still fine; but remove dashed
  c.transfer.dashed = false;
  assert.equal(validateTwoVar(c), null);
  const v1 = clone(CFG["9-1"]);
  delete v1.main.xUnit;
  assert.equal(validateTwoVar(v1), null);
});

test("fmt prints numbers the way the lesson pages do", () => {
  assert.equal(fmt(1200), "1,200");
  assert.equal(fmt(18000), "18,000");
  assert.equal(fmt(24.95, true), "24.95");
  assert.equal(fmt(49.9, true), "49.90");
  assert.equal(fmt(249.5, true), "249.50");
  assert.equal(fmt(2.5), "2.5");
  assert.equal(fmt(20), "20");
  assert.equal(fmt(-12), "−12");
  assert.equal(fmt(6000, false, false), "6000");
});

test("every table value is k·x recomputed in integer cents", () => {
  for (const id of LESSONS) {
    const v = validateTwoVar(CFG[id]);
    for (const sit of [v.main, v.transfer]) {
      for (const x of sit.xs) {
        assert.equal(yOf(sit, x), asNum(cents(sit.k, x)), `${id} x=${x}`);
      }
      assert.deepEqual(
        rowsOf(sit).map((r) => r.y),
        sit.xs.map((x) => asNum(cents(sit.k, x))),
      );
    }
  }
});

test("the lessons' own numbers appear exactly", () => {
  const y = (id, which, xs) => {
    const sit = validateTwoVar(CFG[id])[which];
    return xs.map((x) => yOf(sit, x));
  };
  // 9-1: Claire's jog (123 Calories in 30 minutes, 246 in 60, 369 in 90) and Akela's trays (2 h → 4 cm, 6 h → 12 cm)
  assert.deepEqual(y("9-1", "main", [30, 60, 90, 120]), [123, 246, 369, 492]);
  assert.deepEqual(y("9-1", "transfer", [2, 4, 6]), [4, 8, 12]);
  // 9-2: $45 tickets; the (4, 190) card is NOT on the graph; the tram's 1,200 ft/min
  assert.deepEqual(y("9-2", "main", [1, 2, 3, 4]), [45, 90, 135, 180]);
  assert.deepEqual(y("9-2", "transfer", [1, 2, 5]), [1200, 2400, 6000]);
  assert.equal(yOf(validateTwoVar(CFG["9-2"]).transfer, 15), 18000);
  // 9-3: Recreation World $24.95/month and the $15/hour canoe
  assert.deepEqual(y("9-3", "main", [1, 2, 3, 10, 12]), [24.95, 49.9, 74.85, 249.5, 299.4]);
  assert.deepEqual(y("9-3", "transfer", [3, 5, 8]), [45, 75, 120]);
  // 9-4: 2.5 cars per hour, $12 per car
  assert.deepEqual(y("9-4", "main", [1, 8, 16, 24]), [2.5, 20, 40, 60]);
  assert.deepEqual(y("9-4", "transfer", [34, 41, 42]), [408, 492, 504]);
});

test("scale: every point, line end and goal fits; at most six ticks", () => {
  for (const id of ["9-2", "9-3", "9-4"]) {
    const v = validateTwoVar(CFG[id]);
    for (const sit of [v.main, v.transfer]) {
      const sc = sit.scale;
      assert.equal(sc.xMax, sit.xMax);
      assert.ok(sc.xMax / sc.xStep <= 6 && sc.xMax % sc.xStep === 0, `${id} x ticks`);
      assert.ok(sc.yMax / sc.yStep <= 6 && Number.isInteger(sc.yMax / sc.yStep), `${id} y ticks`);
      assert.ok(sc.yMax >= yOf(sit, sit.xMax), `${id} line end fits`);
      for (const x of sit.xs) assert.ok(sc.yMax >= yOf(sit, x));
      if (sit.second != null) assert.ok(sc.yMax >= sit.second * sit.xMax);
      if (sit.goal != null) assert.ok(sc.yMax >= sit.goal);
    }
  }
  assert.deepEqual(scaleOf(5, 225), { xStep: 1, yStep: 50, xMax: 5, yMax: 250 });
  assert.deepEqual(scaleOf(24, 60), { xStep: 4, yStep: 10, xMax: 24, yMax: 60 });
  assert.equal(scaleOf(13, 100), null);
});

test("pointChoices: one correct pair, three real mistakes", () => {
  for (const [id, which, x] of [["9-2", "main", 2], ["9-2", "transfer", 5]]) {
    const sit = validateTwoVar(CFG[id])[which];
    const opts = pointChoices(sit, x);
    assert.equal(opts.length, 4);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    const y = asNum(cents(sit.k, x));
    for (const o of opts) {
      const isRight = o.px === x && o.py === y;
      assert.equal(o.correct, isRight, o.kind);
    }
    assert.equal(new Set(opts.map((o) => `${o.px},${o.py}`)).size, 4);
  }
  // the 9-2 prediction is (2, 90) with (90, 2), (2, 47), (2, 45) as the mistakes
  assert.deepEqual(
    pointChoices(validateTwoVar(CFG["9-2"]).main, 2).map((o) => [o.kind, o.px, o.py]),
    [["right", 2, 90], ["swapped", 90, 2], ["added", 2, 47], ["repeat", 2, 45]],
  );
});

test("the (4, 190) check point is not on the line, and the 4-ticket point is (4, 180)", () => {
  const v = validateTwoVar(CFG["9-2"]);
  assert.deepEqual(v.check, { x: 4, y: 190 });
  assert.notEqual(v.check.y, Number(cents(45, 4)) / 100);
  assert.equal(pairText(v.main, v.check.x, yOf(v.main, v.check.x)), "(4, 180)");
  assert.equal(pairText(v.transfer, 5, 6000), "(5, 6000)");
});

test("ruleChoices: the right rule passes every row; each wrong rule fails one", () => {
  for (const [id, which, fourth] of [["9-3", "main", "bigRate"], ["9-3", "transfer", "minus"]]) {
    const sit = validateTwoVar(CFG[id])[which];
    const opts = ruleChoices(sit, fourth);
    assert.equal(opts.length, 4);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    assert.equal(new Set(opts.map((o) => o.text)).size, 4);
    for (const o of opts) {
      const results = sit.xs.map((x) => ruleCheck(sit, o.kind, x));
      if (o.correct) {
        assert.ok(results.every((r) => r.ok), `${id} right rule`);
        // independent: k·x in cents equals what the table says
        for (const x of sit.xs) assert.equal(Number(cents(sit.k, x)) / 100, yOf(sit, x));
      } else {
        assert.ok(results.some((r) => !r.ok), `${id} ${o.kind} must fail somewhere`);
        const fx = failingRow(sit, o.kind);
        assert.ok(sit.xs.includes(fx));
        assert.equal(ruleCheck(sit, o.kind, fx).ok, false);
      }
    }
  }
  const gym = validateTwoVar(CFG["9-3"]).main;
  assert.deepEqual(
    ruleChoices(gym, "bigRate").map((o) => o.text),
    ["c = 24.95m", "c = m + 24.95", "m = 24.95c", "c = 49.90m"],
  );
  const canoe = validateTwoVar(CFG["9-3"]).transfer;
  assert.deepEqual(
    ruleChoices(canoe, "minus").map((o) => o.text),
    ["c = 15h", "c = h + 15", "h = 15c", "c = h − 15"],
  );
  // the cue arithmetic is real: 2 + 24.95 = 26.95 ≠ 49.90
  const t = ruleCheck(gym, "added", 2);
  assert.deepEqual([t.got, t.expect], [26.95, 49.9]);
  assert.equal(ruleCheck(gym, "swapped", 2).gotText.startsWith("≈"), true);
  assert.equal(ruleCheck(canoe, "swapped", 5).gotText, "= 1,125");
  assert.equal(ruleCheck(canoe, "minus", 3).got, -12);
});

test("solveChoices / atLeastChoices / askChoices: one right, the rest really wrong", () => {
  const s = solveChoices(2.5, 1000);
  assert.deepEqual(
    s.map((o) => [o.kind, o.value, o.correct]),
    [["right", 400, true], ["times", 2500, false], ["minus", 997.5, false], ["small", 40, false]],
  );
  for (const o of s) assert.equal(Number(cents(2.5, 0)) + o.value * 2.5 === 1000, o.correct);
  assert.deepEqual(atLeastChoices(12, 500).map((o) => o.n), [42, 41, 40, 50]);
  for (const o of atLeastChoices(12, 500)) {
    assert.equal(o.correct, o.n === 42);
    // only the right one is the LEAST count that reaches the goal
    const reaches = o.n * 12 >= 500;
    const least = reaches && (o.n - 1) * 12 < 500;
    assert.equal(least, o.correct, `n=${o.n}`);
  }
  const ask = askChoices(validateTwoVar(CFG["9-4"]).main, 24);
  assert.deepEqual(ask.map((o) => o.y), [60, 26.5, 40, 50]);
  assert.equal(ask.filter((o) => o.correct).length, 1);
  assert.equal(ask.find((o) => o.correct).y, 2.5 * 24);
});

test("hours needed: 1,000 ÷ 2.5 = 400 and 400 ÷ 24 rounds to 17 days", () => {
  const v = validateTwoVar(CFG["9-4"]);
  assert.equal(v.solve.target / v.main.k, 400);
  assert.equal(Math.round(400 / v.solve.perDay), 17);
  assert.match(v.solve.interpret.en, /17 days/);
  assert.match(v.solve.interpret.es, /17 días/);
  assert.deepEqual(v.goals.map((g) => g / v.main.k), [8, 16, 20, 24]);
  assert.equal(v.need, 42);
});

test("placeCorrect moves the correct choice off a fixed slot", () => {
  const opts = [{ correct: true }, { c: 1 }, { c: 2 }, { c: 3 }];
  const slots = new Set([0, 1, 2, 3, 4, 5].map((s) => placeCorrect(opts, s).findIndex((o) => o.correct)));
  assert.equal(slots.size, 4);
});

/** All choice sets a mode's copy offers, for the shared checks. */
function choiceSets(id) {
  const v = validateTwoVar(CFG[id]);
  const c = { variables: variablesCopy, graph: graphCopy, equation: equationCopy, apply: applyCopy }[v.mode](v);
  return Object.entries(c)
    .filter(([, val]) => val && Array.isArray(val.options))
    .map(([scene, val]) => ({ scene, options: val.options }));
}

test("every choice set: one correct, a cue on every wrong choice, both languages", () => {
  const positions = [];
  for (const id of LESSONS) {
    const sets = choiceSets(id);
    assert.ok(sets.length >= 2, id);
    for (const { scene, options } of sets) {
      assert.equal(options.filter((o) => o.correct).length, 1, `${id} ${scene}`);
      assert.ok(options.length >= 3, `${id} ${scene}`);
      positions.push(options.findIndex((o) => o.correct));
      for (const o of options) {
        assert.ok(o.label.en && o.label.es, `${id} ${scene} label`);
        if (!o.correct) {
          assert.ok(o.cue?.en && o.cue?.es, `${id} ${scene}: a wrong choice needs its own cue`);
          // a cue is a question or a pointer, never the right pick's label
          const right = options.find((x) => x.correct).label.en;
          assert.ok(!o.cue.en.includes(right) || right.length < 4, `${id} ${scene} cue states the answer`);
        }
      }
      const cues = options.filter((o) => !o.correct).map((o) => o.cue.en);
      assert.equal(new Set(cues).size, cues.length, `${id} ${scene}: cues are distinct`);
    }
  }
  assert.ok(positions.some((p) => p > 0), "the correct choice is not always first");
  assert.ok(new Set(positions).size >= 3, `correct positions vary: ${positions}`);
});

/** Every string a mode's copy can emit, flattened. */
function allStrings(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const n of node) allStrings(n, out);
  else if (node && typeof node === "object") for (const n of Object.values(node)) allStrings(n, out);
  return out;
}

test("copy is bilingual, has no unfilled template, and the Spanish has no tu/usted drift", () => {
  for (const id of LESSONS) {
    const v = validateTwoVar(CFG[id]);
    const c = { variables: variablesCopy, graph: graphCopy, equation: equationCopy, apply: applyCopy }[v.mode](v);
    const pairs = [];
    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      if (typeof n.en === "string" && typeof n.es === "string") pairs.push(n);
      else for (const x of Array.isArray(n) ? n : Object.values(n)) walk(x);
    };
    walk(c);
    assert.ok(pairs.length > 20, id);
    for (const p of pairs) {
      for (const s of [p.en, p.es]) assert.doesNotMatch(s, /undefined|NaN|\[object|\{x\}|\{y\}/, `${id}: ${s}`);
      // Spanish text is never the English copied over, unless it is only math
      if (/[a-zA-Z]{4,}/.test(p.en.replace(/[a-z]\s?=\s?[\d.]+[a-z]/gi, ""))) {
        if (p.en === p.es) assert.match(p.en, /^[\w\s.=+×÷−≠≈(),$%]+$/, `${id}: ${p.en}`);
      }
      assert.doesNotMatch(p.es, /\b(usted|ustedes|vosotros)\b/i, p.es);
    }
    // the progress lines are functions of a count and are bilingual too
    for (const scene of Object.values(c)) {
      if (typeof scene?.progress !== "function") continue;
      const r = scene.progress(1);
      assert.ok(r.en.includes("1") && r.es.includes("1"), `${id} progress`);
    }
    for (const s of allStrings(c.printSummary)) assert.ok(s.length > 20);
  }
});

test("the copy states the right numbers", () => {
  const v1 = variablesCopy(validateTwoVar(CFG["9-1"]));
  assert.match(v1.printSummary.en, /30 → 123, 60 → 246, 90 → 369, 120 → 492/);
  assert.match(v1.printSummary.en, /independent variable/);
  const v2 = graphCopy(validateTwoVar(CFG["9-2"]));
  assert.match(v2.printSummary.en, /\(1, 45\), \(2, 90\), \(3, 135\)/);
  assert.match(v2.check.ok.en, /4 × 45 = \$180/);
  assert.match(v2.steep.ok.en, /6,000 and the second is at 4,500/);
  const v3 = equationCopy(validateTwoVar(CFG["9-3"]));
  assert.match(v3.printSummary.en, /24\.95 × 1 = \$24\.95, 24\.95 × 2 = \$49\.90, 24\.95 × 3 = \$74\.85/);
  assert.match(v3.transfer.ok.en, /15 × 3 = \$45 and 15 × 5 = \$75/);
  assert.equal(v3.rule(validateTwoVar(CFG["9-3"]).main), "c = 24.95m");
  const v4 = applyCopy(validateTwoVar(CFG["9-4"]));
  assert.match(v4.predict.ok.en, /c = 2\.5 × 24 = 60/);
  assert.match(v4.solve.ok.en, /h = 1,000 ÷ 2\.5 = 400/);
  assert.match(v4.transfer.ok.en, /12 × 42 = \$504 reaches \$500, but 12 × 41 = \$492 does not/);
  assert.match(v4.printSummary.en, /c = 2\.5 × 24 = 60/);
});

test("every authored config builds a play with the shape the kernel needs", () => {
  const want = { "9-1": 5, "9-2": 6, "9-3": 6, "9-4": 6 };
  for (const id of LESSONS) {
    const play = buildTwoVarPlay(CFG[id]);
    assert.ok(play, id);
    assert.equal(play.scenes.length, want[id], id);
    assert.equal(new Set(play.scenes.map((s) => s.id)).size, play.scenes.length, `${id} unique scene ids`);
    assert.ok(play.scenes.filter((s) => s.gate).length >= 2, `${id} has gates`);
    assert.equal(play.scenes[0].gate, undefined, "the first scene is not a gate");
    assert.equal(play.scenes.at(-1).gate, undefined, "the last scene is not a gate");
    assert.match(play.viewBox, /^0 0 480 \d+$/, "phone-friendly stage width");
    for (const sc of play.scenes) {
      assert.ok(sc.label.en && sc.label.es && typeof sc.enter === "function", `${id} ${sc.id}`);
    }
    assert.ok(play.title.en && play.title.es && play.ariaLabel.en && play.printSummary.es);
  }
});

test("validateSit keeps a situation's own words and refuses a mismatched one", () => {
  const sit = validateSit(CFG["9-4"].main, { needRead: true });
  assert.equal(sit.xName.en, "hours of operation");
  assert.equal(sit.vars.x, "h");
  assert.equal(validateSit({ ...CFG["9-4"].main, read: undefined }, { needRead: true }), null);
  assert.equal(validateSit({ ...CFG["9-4"].main, yPrefix: "€" }, {}).yPrefix, "");
});
