// fraction-groups.test.mjs — every number the fraction-groups play shows a
// student, recomputed with the repo's exact rational arithmetic (BigInt
// fractions in scripts/lib/rational.mjs), never with the play's own helpers.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Rat } from "../../../scripts/lib/rational.mjs";
import {
  buildFractionGroupsPlay,
  validateFractionGroups as reexported,
} from "./fraction-groups.js";
import {
  connectSteps,
  convertChoices,
  equationChoices,
  frac,
  fractionGroupsCopy,
  fmt,
  mixed,
  placeCorrect,
  quotientChoices,
  shareChoices,
  tapeSpec,
  validateFractionGroups,
} from "./fraction-groups-model.js";

const R = (n, d = 1) => new Rat(BigInt(n), BigInt(d));
const rOf = (f) => R(f.n, f.d);
const LESSONS = ["6-1", "6-2", "6-9", "6-10", "6-11"];
const living = (id) =>
  JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;
const lessonText = (id) =>
  JSON.stringify(
    JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"))
      .launch.conceptIntro,
  );

test("tapeSpec: the quotient is exact and equals Rat division for every lesson problem", () => {
  const cases = [
    [3, 1, 1, 4, 12],
    [2, 1, 1, 3, 6],
    [1, 2, 1, 8, 4],
    [3, 4, 1, 8, 6],
    [1, 2, 1, 4, 2],
    [4, 1, 1, 2, 8],
    [6, 1, 3, 4, 8],
    [3, 1, 1, 4, 12],
    [7, 2, 1, 4, 14],
    [5, 2, 1, 2, 5],
    [2, 3, 1, 6, 4],
    [3, 4, 1, 4, 3],
  ];
  for (const [dn, dd, bn, bd, q] of cases) {
    const s = tapeSpec(frac(dn, dd), frac(bn, bd));
    assert.ok(s, `${dn}/${dd} ÷ ${bn}/${bd}`);
    const exact = R(dn, dd).div(R(bn, bd));
    assert.equal(exact.isInt(), true);
    assert.equal(exact.toString(), String(q));
    assert.equal(s.Q, q);
    // The pieces: D is P pieces of 1/q, a group is g of them, and Q × g = P.
    assert.ok(R(s.P, s.q).eq(R(dn, dd)), "P/q = dividend");
    assert.ok(R(s.g, s.q).eq(R(bn, bd)), "g/q = divisor");
    assert.equal(s.Q * s.g, s.P);
    // Check by multiplying: quotient × divisor = dividend.
    assert.ok(R(q).mul(R(bn, bd)).eq(R(dn, dd)));
  }
});

test("tapeSpec refuses what the tape cannot draw correctly", () => {
  assert.equal(tapeSpec(frac(2, 3), frac(3, 4)), null); // 8/9 is not a whole number of groups
  assert.equal(tapeSpec(frac(1, 4), frac(1, 2)), null); // divisor bigger than the dividend
  assert.equal(tapeSpec(frac(3, 1), frac(3, 1)), null); // quotient 1: nothing to count
  assert.equal(tapeSpec(frac(10, 1), frac(1, 4)), null); // 40 pieces
  assert.equal(tapeSpec(frac(1, 1), frac(1, 7)), null); // sevenths have no name here
  assert.equal(tapeSpec(frac(3, 1), frac(1, 12)), null); // 36 pieces across 3 wholes
  assert.equal(tapeSpec(frac(7, 1), frac(1, 2)), null); // 7 wholes on the tape
});

test("quotientChoices: exactly one correct, every wrong one really differs from the quotient", () => {
  for (const [D, B] of [
    [frac(3), frac(1, 4)],
    [frac(2), frac(1, 3)],
    [frac(3, 4), frac(1, 8)],
    [frac(7, 2), frac(1, 4)],
    [frac(5, 2), frac(1, 2)],
    [frac(2, 3), frac(1, 6)],
    [frac(3, 4), frac(1, 4)],
    [frac(6), frac(3, 4)],
  ]) {
    const s = tapeSpec(D, B);
    const c = quotientChoices(s);
    const exact = rOf(D).div(rOf(B));
    assert.ok(c.length >= 3);
    assert.equal(c.filter((o) => o.correct).length, 1);
    assert.ok(rOf(c.find((o) => o.correct).value).eq(exact));
    for (const o of c.filter((x) => !x.correct)) assert.ok(!rOf(o.value).eq(exact), o.kind);
    // Distinct values, and each misconception is the value it claims to be.
    const strs = c.map((o) => rOf(o.value).toString());
    assert.equal(new Set(strs).size, strs.length);
    const by = Object.fromEntries(c.map((o) => [o.kind, rOf(o.value)]));
    assert.ok(by.times.eq(rOf(D).mul(rOf(B))));
    assert.ok(by.swap.eq(rOf(B).div(rOf(D))));
  }
  // 6 ÷ 3/4: the pieces mistake (24) is offered; 3 ÷ 1/4 has no such mistake.
  const kinds = (D, B) => quotientChoices(tapeSpec(D, B)).map((o) => o.kind);
  assert.ok(kinds(frac(6), frac(3, 4)).includes("pieces"));
  assert.ok(!kinds(frac(3), frac(1, 4)).includes("pieces"));
  assert.ok(kinds(frac(3), frac(1, 4)).includes("wholes"));
  assert.ok(kinds(frac(3, 4), frac(1, 8)).includes("tops"));
});

test("equationChoices and shareChoices: one right expression; the wrong ones compute something else", () => {
  const eq = equationChoices(frac(2, 3), frac(1, 6));
  assert.deepEqual(
    eq.map((o) => o.text),
    ["2/3 ÷ 1/6", "1/6 ÷ 2/3", "2/3 × 1/6", "2/3 − 1/6"],
  );
  assert.equal(eq.filter((o) => o.correct).length, 1);
  assert.equal(R(2, 3).div(R(1, 6)).toString(), "4");
  assert.notEqual(R(1, 6).div(R(2, 3)).toString(), "4");
  assert.notEqual(R(2, 3).mul(R(1, 6)).toString(), "4");
  assert.notEqual(R(2, 3).sub(R(1, 6)).toString(), "4");
  // Shares: 1/2 ÷ 4 = 1/8 and 2/3 ÷ 4 = 1/6; four equal shares of that size make the total.
  for (const [D, k, B] of [
    [frac(1, 2), 4, frac(1, 8)],
    [frac(2, 3), 4, frac(1, 6)],
  ]) {
    assert.ok(rOf(D).div(R(k)).eq(rOf(B)));
    assert.ok(rOf(B).mul(R(k)).eq(rOf(D)));
    const sc = shareChoices(D, k);
    assert.equal(sc.filter((o) => o.correct).length, 1);
    assert.equal(sc[0].text, `${fmt(D)} ÷ ${k}`);
    // Dividing by 1/k is a different (bigger) number than dividing by k.
    assert.ok(!rOf(D).div(R(1, k)).eq(rOf(B)));
    assert.ok(!R(k).div(rOf(D)).eq(rOf(B)));
    assert.ok(!rOf(D).mul(R(k)).eq(rOf(B)));
  }
});

test("convertChoices: the numerator is whole × denominator + part; the others are real slips", () => {
  const c = convertChoices(frac(7, 2)); // 3 1/2
  assert.deepEqual(
    c.map((o) => [o.kind, o.text]),
    [
      ["right", "7/2"],
      ["noAdd", "6/2"],
      ["addWhole", "5/2"],
    ],
  );
  assert.equal(3 * 2 + 1, 7);
  assert.ok(R(7, 2).eq(R(7, 2)) && !R(6, 2).eq(R(7, 2)));
  assert.equal(mixed(frac(7, 2)), "3 1/2");
  assert.equal(mixed(frac(5, 2)), "2 1/2");
  // The picture agrees: 3 1/2 is 7 halves. Check over many mixed numbers.
  for (let d = 2; d <= 6; d++)
    for (let w = 1; w <= 4; w++)
      for (let r = 1; r < d; r++) {
        const D = frac(w * d + r, d);
        if (D.d !== d) continue; // reduced away
        const cs = convertChoices(D);
        assert.equal(cs.filter((o) => o.correct).length, 1);
        assert.equal(cs.find((o) => o.correct).n, w * d + r);
      }
});

test("connectSteps: every number written is recomputed independently", () => {
  for (const [D, B, roles] of [
    [frac(3), frac(1, 4), false],
    [frac(4), frac(1, 2), false],
    [frac(6), frac(3, 4), false],
    [frac(3, 4), frac(1, 8), false],
    [frac(7, 2), frac(1, 4), false],
    [frac(2, 3), frac(1, 6), true],
  ]) {
    const s = tapeSpec(D, B);
    const steps = connectSteps(s, { roles });
    const exact = rOf(D).div(rOf(B));
    const Q = Number(exact.toString());
    assert.equal(Q, s.Q);
    const last = steps[steps.length - 1];
    // Final step is the check: Q × B back to D.
    assert.ok(last.expr.en.startsWith(`${Q} × ${fmt(B)} = ${Q * B.n}/${B.d}`));
    assert.ok(R(Q).mul(rOf(B)).eq(rOf(D)));
    // The reciprocal line: D × (1/B) = Q, with the unreduced product written truthfully.
    const recipStep = steps.find((x) => x.expr.en.includes("×") && x.expr.en.includes(" ÷ "));
    assert.ok(recipStep, "a reciprocal step exists");
    const m = /= (\d+)\/(\d+) = «?(\d+)»?$/.exec(recipStep.expr.en) ?? /= «?(\d+)»?$/.exec(recipStep.expr.en);
    assert.ok(m);
    const rec = rOf(D).mul(R(B.d, B.n));
    assert.equal(rec.toString(), String(Q));
    if (m.length === 4) assert.ok(R(Number(m[1]), Number(m[2])).eq(R(Q)), `${m[0]} is Q`);
    // Pieces: P × (1/q) = D, g pieces = divisor, P ÷ g = Q.
    assert.ok(R(s.P, s.q).eq(rOf(D)));
    assert.equal(s.P / s.g, Q);
    for (const st of steps) {
      assert.ok(st.expr.en && st.expr.es && st.say.en && st.say.es);
      assert.ok(st.cut === 1 || st.cut === s.q || st.cut === D.d);
    }
  }
  // iDo of 6-1 says 3 ÷ 1/4 = 3/1 × 4/1 = 12; the steps carry 3 × 4/1 = 12.
  const one = connectSteps(tapeSpec(frac(3), frac(1, 4)));
  assert.equal(one[3].expr.en, "3 ÷ 1/4 = 3 × 4/1 = «12»");
  assert.equal(one[1].expr.en, "3 × 4 = «12» fourths");
});

test("placeCorrect leaves the right answer off the first seat for the authored configs", () => {
  for (const id of LESSONS) {
    const v = validateFractionGroups(living(id));
    assert.ok(v);
    // The play's own seating (n % len === 0 → n + 1) never lands on 0.
    const seat = (len, n) => (n % len === 0 ? n + 1 : n) % len;
    for (const len of [3, 4, 5]) for (let n = 0; n < 30; n++) assert.notEqual(seat(len, n), 0);
  }
  const opts = [{ correct: true }, { correct: false }, { correct: false }];
  assert.equal(placeCorrect(opts, 1).findIndex((o) => o.correct), 1);
});

test("validation refuses configs the stage cannot draw correctly", () => {
  const base = living("6-1");
  assert.ok(validateFractionGroups(base));
  assert.equal(reexported(base)?.mode, "unit");
  assert.equal(validateFractionGroups(null), null);
  assert.equal(validateFractionGroups({ ...base, mode: "nope" }), null);
  assert.equal(validateFractionGroups({ ...base, divisor: { n: 2, d: 3 } }), null); // 3 ÷ 2/3 = 4.5
  assert.equal(validateFractionGroups({ ...base, divisor: { n: 3, d: 4 } }), null); // unit mode wants 1/b
  assert.equal(validateFractionGroups({ ...base, dividend: { n: 7, d: 2 } }), null); // unit mode wants a whole
  assert.equal(validateFractionGroups({ ...base, noun: undefined }), null);
  assert.equal(validateFractionGroups({ ...base, story: 4 }), null);
  assert.equal(validateFractionGroups({ ...base, transfer: undefined }), null);
  assert.equal(validateFractionGroups({ ...base, transfer: { ...base } }), null); // same problem
  assert.equal(validateFractionGroups({ ...base, share: undefined }), null);
  assert.equal(validateFractionGroups({ ...base, share: { ...base.share, shares: 3 } })?.extra?.spec.B.d, 6); // 1/2 ÷ 3 = 1/6
  assert.equal(validateFractionGroups({ ...base, share: { ...base.share, shares: 1 } }), null);
  assert.equal(validateFractionGroups({ ...base, share: { ...base.share, shares: 7 } }), null); // sevenths
  const whole = living("6-9");
  assert.ok(validateFractionGroups(whole));
  assert.equal(validateFractionGroups({ ...whole, bigger: undefined }), null);
  assert.equal(validateFractionGroups({ ...whole, bigger: { ...whole.bigger, divisor: { n: 1, d: 3 } } }), null); // not a bigger group
  assert.equal(validateFractionGroups({ ...living("6-10"), dividend: { n: 3, d: 4 } }), null); // mixed wants improper
  // 4/3 = 1 1/3: adding the whole number to the denominator (1 + 3) gives the right numerator, so no third choice.
  assert.equal(validateFractionGroups({ ...living("6-10"), dividend: { n: 4, d: 3 }, divisor: { n: 1, d: 3 } }), null);
  assert.equal(validateFractionGroups({ ...living("6-2"), dividend: { n: 5, d: 4 } }), null); // fraction wants proper
  assert.equal(buildFractionGroupsPlay({ ...base, divisor: { n: 2, d: 3 } }), null);
  assert.equal(buildFractionGroupsPlay(undefined), null);
});

test("copy: Spanish exists for every line and the numbers match the lesson's own", () => {
  for (const id of LESSONS) {
    const v = validateFractionGroups(living(id));
    const T = fractionGroupsCopy(v);
    const pairs = [];
    const walk = (o, path) => {
      if (typeof o === "function") return;
      if (o && typeof o === "object") {
        if ("en" in o && "es" in o) pairs.push([path, o]);
        else for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
      }
    };
    walk(T, "T");
    pairs.push(
      ["groups", T.word.groups(4)],
      ["oneGroup", T.word.oneGroup(frac(1, 4))],
      ["cue.times", T.quotientCue.times(frac(3, 4), v.main.spec)],
      ["cue.swap", T.quotientCue.swap(frac(1, 12), v.main.spec)],
      ["cue.wholes", T.quotientCue.wholes(frac(3), v.main.spec)],
      ["cue.tops", T.quotientCue.tops(frac(3))],
      ["cue.pieces", T.quotientCue.pieces(frac(24))],
      ["placeLeft", T.placeLeft(3)],
    );
    assert.ok(pairs.length > 20, id);
    for (const [path, o] of pairs) {
      assert.ok(o.en && o.es, `${id} ${path}`);
      assert.ok(!/\b(usted|vosotros)\b/i.test(o.es), `${id} ${path}: register`);
      assert.ok(!/\b(the|and|each|fit|groups?)\b/.test(o.es), `${id} ${path}: English left in Spanish: ${o.es}`);
      assert.ok(!/ \d+ %/.test(o.es), `${id} ${path}: percent spacing`);
    }
    // The lesson's own numbers appear in its Learn It text.
    const text = lessonText(id);
    const { D, B } = v.main.spec;
    assert.ok(text.includes(`${fmt(B)}`) || text.includes(`${B.n}/${B.d}`), `${id}: divisor in lesson`);
    assert.ok(text.includes(String(D.n)) || text.includes(`${D.n}/${D.d}`), `${id}: dividend in lesson`);
    assert.ok(T.printSummary.en.includes(`÷ ${fmt(B)}`), id);
  }
});

test("the plays build with the expected scenes and gates", () => {
  const expected = {
    "6-1": ["situate", "predict", "place", "connect", "share", "transfer"],
    "6-2": ["situate", "predict", "place", "connect", "transfer"],
    "6-9": ["situate", "predict", "place", "connect", "bigger", "transfer"],
    "6-10": ["situate", "predict", "place", "convert", "connect", "transfer"],
    "6-11": ["situate", "predict", "place", "connect", "share", "transfer"],
  };
  for (const id of LESSONS) {
    const cfg = living(id);
    assert.equal(cfg.kind, "living-scene");
    assert.equal(cfg.play, "fraction-groups");
    const play = buildFractionGroupsPlay(cfg);
    assert.ok(play, id);
    assert.deepEqual(
      play.scenes.map((s) => s.id),
      expected[id],
      id,
    );
    for (const sc of play.scenes.filter((x) => x.gate)) assert.ok(["predict", "place", "convert", "share", "bigger"].includes(sc.id));
    assert.ok(play.scenes.find((s) => s.id === "predict").gate);
    assert.ok(play.scenes.find((s) => s.id === "place").gate);
    assert.match(play.viewBox, /^0 0 480 \d+$/);
  }
});

test("each lesson's scene uses that lesson's own worked-example numbers", () => {
  const own = {
    "6-1": ["3 ÷ 1/4", "2 ÷ 1/3", "1/2 ÷ 4"],
    "6-2": ["3/4 ÷ 1/8", "1/2 ÷ 1/4"],
    "6-9": ["4 ÷ 1/2", "6 ÷ 3/4", "3 ÷ 1/4"],
    "6-10": ["3 1/2 ÷ 1/4", "2 1/2 ÷ 1/2"],
    "6-11": ["2/3 ÷ 1/6", "3/4 ÷ 1/4"],
  };
  for (const id of LESSONS) {
    const text = lessonText(id);
    for (const expr of own[id]) assert.ok(text.includes(expr), `${id}: lesson text has ${expr}`);
    const T = fractionGroupsCopy(validateFractionGroups(living(id)));
    const flat = JSON.stringify(T, (k, x) => (typeof x === "function" ? undefined : x));
    // 6-1's iDo / keyIdea: 1/2 ÷ 4 appears in the lesson and in the scene's share copy.
    assert.ok(flat.includes(own[id][0]) || flat.includes(own[id][0].replace(" ÷ ", " ÷ ")), `${id}: ${own[id][0]}`);
  }
});
