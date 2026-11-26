// inequality-line.test.mjs — every value the inequality-line play (8-4) tests or
// names, recomputed here by enumerating the number line.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildInequalityLinePlay, validateInequalityLine as reexported } from "./inequality-line.js";
import {
  dirOf,
  flipDir,
  flipIncl,
  holds,
  insideValue,
  isClosed,
  lineCopy,
  outsideValue,
  rangeFor,
  setChoices,
  symbolChoices,
  testsDone,
  validateInequalityLine,
  verdictWords,
} from "./inequality-line-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/8-4/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const SYMS = ["<", ">", "≤", "≥"];
const phrase = { en: "at least 18", es: "al menos 18" };
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// Independent truth table: x ⋄ limit.
const truth = {
  "<": (x, l) => x < l,
  ">": (x, l) => x > l,
  "≤": (x, l) => x <= l,
  "≥": (x, l) => x >= l,
};

test("holds, direction and inclusiveness agree with the symbols", () => {
  for (const s of SYMS)
    for (const l of [2, 10, 18])
      for (const x of range(0, 25)) assert.equal(holds(s, x, l), truth[s](x, l), `${x} ${s} ${l}`);
  assert.deepEqual(SYMS.map(isClosed), [false, false, true, true]);
  assert.deepEqual(SYMS.map(dirOf), ["left", "right", "left", "right"]);
  for (const s of SYMS) {
    assert.equal(dirOf(flipIncl(s)), dirOf(s));
    assert.notEqual(isClosed(flipIncl(s)), isClosed(s));
    assert.equal(isClosed(flipDir(s)), isClosed(s));
    assert.notEqual(dirOf(flipDir(s)), dirOf(s));
    for (const l of [2, 9, 18]) {
      assert.ok(holds(s, insideValue(s, l), l), "inside value works");
      assert.ok(!holds(s, outsideValue(s, l), l), "outside value does not");
      assert.notEqual(insideValue(s, l), l);
    }
  }
});

test("rangeFor: eleven whole numbers around the boundary, never below 0", () => {
  assert.deepEqual(rangeFor(18), { lo: 13, hi: 23, step: 1 });
  assert.deepEqual(rangeFor(10), { lo: 5, hi: 15, step: 1 });
  assert.deepEqual(rangeFor(2), { lo: 0, hi: 10, step: 1 });
  for (const l of [2, 3, 5, 50, 99]) {
    const r = rangeFor(l);
    assert.ok(r.lo >= 0 && r.hi - r.lo === 10 && r.lo <= l && l <= r.hi);
  }
});

test("validateInequalityLine accepts the 8-4 config and refuses bad ones", () => {
  const v = validateInequalityLine(CFG);
  assert.deepEqual([v.main.sym, v.main.limit, v.transfer.sym, v.transfer.limit], ["≥", 18, "<", 10]);
  const t = CFG.transfer;
  const bad = [
    null,
    {},
    { ...CFG, mode: "graph" },
    { ...CFG, sym: "=" },
    { ...CFG, limit: 1 },
    { ...CFG, limit: 18.5 },
    { ...CFG, phrase: undefined },
    { ...CFG, story: undefined },
    { ...CFG, transfer: { ...t, phrase: undefined } },
    { ...CFG, transfer: { ...t, sym: "≥" } }, // same symbol
    { ...CFG, transfer: { ...t, sym: ">" } }, // same direction, same circle? (≥ vs >: only circle differs)
    { ...CFG, transfer: undefined },
  ];
  for (const c of bad.filter((b) => b !== bad[10])) {
    assert.equal(validateInequalityLine(c), null, JSON.stringify(c)?.slice(0, 80));
    assert.equal(buildInequalityLinePlay(c), null);
  }
  // A transfer that differs only in the circle is still a different picture: accepted.
  assert.ok(validateInequalityLine(bad[10]));
});

/** The set a "which numbers" option describes, parsed from its own words. */
const described = (label) => {
  let m = label.match(/^Only (\d+)$/);
  if (m) return (x) => x === Number(m[1]);
  m = label.match(/^(\d+) and every number (greater|less) than (\d+)$/);
  if (m) return (x) => (m[2] === "greater" ? x >= Number(m[1]) : x <= Number(m[1]));
  m = label.match(/^Every number (greater|less) than (\d+), but not (\d+)$/);
  if (m) return (x) => (m[1] === "greater" ? x > Number(m[2]) : x < Number(m[2]));
  throw new Error(`unparsed: ${label}`);
};

test("setChoices: the right set is the solution set; each wrong set fails at the value its cue tests", () => {
  for (const sym of SYMS)
    for (const limit of [2, 10, 18]) {
      const c = { sym, limit, phrase };
      const { lo, hi } = rangeFor(limit);
      const opts = setChoices(c);
      assert.equal(opts.length, 4);
      assert.equal(opts.filter((o) => o.correct).length, 1);
      for (const o of opts) {
        const pred = described(o.label.en);
        const same = range(lo, hi).every((x) => pred(x) === holds(sym, x, limit));
        assert.equal(same, !!o.correct, `${sym} ${limit}: ${o.label.en}`);
        if (!o.correct) {
          assert.notEqual(pred(o.v), holds(sym, o.v, limit), `cue value ${o.v} separates "${o.label.en}"`);
          assert.ok(o.cue.en.includes(`Test ${o.v}`) && o.cue.en.includes(phrase.en));
        }
      }
    }
  const slots = new Set([2, 10, 18, 40].flatMap((l) => SYMS.map((s) => setChoices({ sym: s, limit: l, phrase }).findIndex((o) => o.correct))));
  assert.ok(slots.size >= 3, "the right answer moves around");
});

test("verdictWords and testsDone follow the numbers", () => {
  const c = { sym: "≥", limit: 18, phrase };
  assert.match(verdictWords(c, 17).en, /^17: is it at least 18\? No ✗$/);
  assert.match(verdictWords(c, 18).en, /Yes ✓$/);
  assert.match(verdictWords(c, 17).es, /No ✗$/);
  assert.deepEqual(testsDone(c, [15, 16]), { boundary: false, inside: false, outside: true });
  assert.deepEqual(testsDone(c, [18]), { boundary: true, inside: false, outside: false });
  assert.deepEqual(testsDone(c, [18, 20, 14]), { boundary: true, inside: true, outside: true });
  const d = { sym: "<", limit: 10, phrase };
  assert.deepEqual(testsDone(d, [10, 7, 12]), { boundary: true, inside: true, outside: true });
});

test("symbolChoices: one right symbol; each wrong one fails a value the cue asks about", () => {
  for (const sym of SYMS)
    for (const limit of [2, 10, 18]) {
      const c = { sym, limit, phrase };
      const opts = symbolChoices(c);
      assert.deepEqual(opts.map((o) => o.id).sort(), [...SYMS].sort());
      assert.equal(opts.find((o) => o.correct).id, sym);
      for (const o of opts.filter((x) => !x.correct)) {
        assert.notEqual(
          holds(o.id, o.v, limit),
          holds(sym, o.v, limit),
          `${o.id} vs ${sym} at ${o.v}`,
        );
        assert.ok(o.cue.en.includes(`${o.v}`) && o.cue.en.includes(o.id));
      }
    }
});

test("the 8-4 scenes: shape, gates and the numbers each states", () => {
  const play = buildInequalityLinePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["rule", false],
      ["predict", true],
      ["test", true],
      ["symbol", true],
      ["transfer", false],
    ],
  );
  assert.match(play.printSummary.en, /“at least 18” allows 18 and every number greater than 18, so the inequality is a ≥ 18/);
  assert.match(play.printSummary.en, /“fewer than 10” gives n < 10/);
  assert.match(play.printSummary.es, /«al menos 18» permite el 18 y todos los números mayores que 18, así que la desigualdad es a ≥ 18/);
  assert.doesNotMatch(play.title.en, /\d|≥/);
});

test("copy: Spanish has no English left", () => {
  const english = /\b(the|which|and|your|both|choose|check|value|test|then|is it)\b/i;
  const v = validateInequalityLine(CFG);
  const T = lineCopy(v);
  const walk = (o, path) => {
    if (o && typeof o === "object" && typeof o.en === "string") {
      assert.doesNotMatch(o.es, english, `${path}: ${o.es}`);
      if (/[A-Za-z]{3,}/.test(o.en)) assert.notEqual(o.es, o.en, path);
    } else if (o && typeof o === "object") for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
  };
  walk(T, "T");
  for (const c of [v.main, v.transfer]) {
    for (const o of [...setChoices(c), ...symbolChoices(c)]) {
      for (const p of [o.label, o.cue]) if (p) assert.doesNotMatch(p.es, english, p.es);
    }
    for (const x of [3, 12, 18]) assert.doesNotMatch(verdictWords(c, x).es, english);
  }
});

test("inequality-line.js re-exports the model's validator", () => {
  assert.equal(reexported, validateInequalityLine);
});
