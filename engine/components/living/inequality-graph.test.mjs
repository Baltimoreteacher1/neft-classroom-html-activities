// inequality-graph.test.mjs — every picture the inequality-graph play (8-5) draws.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildInequalityGraphPlay, validateInequalityGraph as reexported } from "./inequality-graph.js";
import {
  circleChoices,
  graphChoices,
  graphCopy,
  graphCue,
  validateInequalityGraph,
  verdictSymbol,
} from "./inequality-graph-model.js";
import { rangeFor } from "./inequality-line-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/8-5/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const SYMS = ["<", ">", "≤", "≥"];
// Independent truth: does x make "x ⋄ l" true?
const truth = { "<": (x, l) => x < l, ">": (x, l) => x > l, "≤": (x, l) => x <= l, "≥": (x, l) => x >= l };
// The picture each symbol means, written out without the model's helpers.
const picture = { "<": ["open", "left"], ">": ["open", "right"], "≤": ["closed", "left"], "≥": ["closed", "right"] };
const q = (sym, limit = 5, letter = "x") => ({ sym, limit, letter });

test("validateInequalityGraph accepts the 8-5 config and refuses bad ones", () => {
  const v = validateInequalityGraph(CFG);
  assert.deepEqual([v.main.sym, v.main.limit, v.transfer.sym, v.transfer.limit], ["≥", 2, "<", 5]);
  const t = CFG.transfer;
  for (const c of [
    null,
    {},
    { ...CFG, mode: "write" },
    { ...CFG, sym: "≠" },
    { ...CFG, limit: 0 },
    { ...CFG, story: undefined },
    { ...CFG, transfer: { ...t, sym: "≥" } },
    { ...CFG, transfer: undefined },
    { ...CFG, transfer: { ...t, story: undefined } },
  ]) {
    assert.equal(validateInequalityGraph(c), null, JSON.stringify(c)?.slice(0, 80));
    assert.equal(buildInequalityGraphPlay(c), null);
  }
});

test("circleChoices: closed exactly when the symbol includes the boundary", () => {
  for (const sym of SYMS) {
    const opts = circleChoices(q(sym));
    assert.equal(opts.length, 3);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    const right = opts.find((o) => o.correct);
    assert.equal(right.id, picture[sym][0], sym);
    for (const o of opts.filter((x) => !x.correct)) assert.ok(o.cue.en.length > 20 && o.cue.es.length > 20);
    // The slip between open and closed is cued by substituting the boundary into the SAME symbol.
    const slip = opts.find((o) => !o.correct && o.id !== "none");
    assert.ok(slip.cue.en.includes(`5 ${sym} 5`));
    // ...and the boundary really is (or is not) a solution.
    assert.equal(truth[sym](5, 5), picture[sym][0] === "closed");
  }
});

test("graphChoices: four graphs, one right; wrong ones fail a value or the boundary", () => {
  for (const sym of SYMS)
    for (const limit of [2, 5, 9]) {
      const c = q(sym, limit);
      const opts = graphChoices(c);
      assert.equal(opts.length, 4);
      assert.equal(new Set(opts.map((o) => o.id)).size, 4);
      const right = opts.filter((o) => o.correct);
      assert.equal(right.length, 1);
      assert.deepEqual([right[0].closed ? "closed" : "open", right[0].dir], picture[sym]);
      for (const o of opts.filter((x) => !x.correct)) {
        assert.ok(o.cue, "every wrong graph has a cue");
        const circleWrong = o.closed !== (picture[sym][0] === "closed");
        if (circleWrong) {
          // A wrong circle is cued by substituting the boundary into the SAME symbol.
          assert.ok(o.cue.en.includes(`${limit} ${sym} ${limit}`));
        } else {
          // Right circle, wrong direction: the value two inside the shading is not a solution.
          const v = o.dir === "right" ? limit + 2 : limit - 2;
          assert.equal(truth[sym](v, limit), false);
          assert.ok(o.cue.en.includes(`Test ${v}`));
        }
      }
    }
});

test("graphCue is null for the right picture and for unset parts", () => {
  const c = q("≥", 2, "t");
  assert.equal(graphCue(c, true, "right"), null);
  assert.equal(graphCue(c, null, null), null);
  assert.equal(graphCue(c, true, null), null);
  assert.match(graphCue(c, false, "right").en, /2 ≥ 2/);
  assert.match(graphCue(c, true, "left").en, /Test 0/);
  assert.match(graphCue(c, true, "left").en, /0 ≥ 2/);
});

test("verdictSymbol agrees with the truth table", () => {
  for (const sym of SYMS)
    for (const x of [0, 4, 5, 6, 12]) {
      const ok = truth[sym](x, 5);
      const t = verdictSymbol(q(sym), x);
      assert.ok(t.en.endsWith(ok ? "true ✓" : "false ✗"), `${x} ${sym} 5`);
      assert.ok(t.es.endsWith(ok ? "verdadero ✓" : "falso ✗"));
    }
});

test("the finished graph's sample values are all on the line and judged correctly", () => {
  for (const sym of SYMS)
    for (const limit of [2, 5, 9]) {
      const flip = { "<": "≥", ">": "≤", "≤": ">", "≥": "<" }[sym];
      const story = { en: "A story.", es: "Una historia." };
      const c = { ...q(sym, limit, "t"), story };
      const T = graphCopy({ main: c, transfer: { ...q(flip, 4), story } });
      const xs = T.samples(c);
      const { lo, hi } = rangeFor(limit);
      assert.equal(new Set(xs).size, xs.length);
      assert.ok(xs.every((x) => x >= lo && x <= hi));
      assert.ok(xs.includes(limit), "the boundary is one of the samples");
      assert.ok(xs.some((x) => !Number.isInteger(x) || x === limit + 1.5 || x === limit - 1.5) || limit <= 1);
      // Every sample's verdict is what the truth table says (the play draws holds()).
      assert.ok(xs.some((x) => truth[sym](x, limit)) && xs.some((x) => !truth[sym](x, limit)));
    }
});

test("the 8-5 scenes: shape, gates and stated numbers", () => {
  const play = buildInequalityGraphPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["rule", false],
      ["circle", true],
      ["draw", true],
      ["every", false],
      ["transfer", false],
    ],
  );
  assert.match(play.printSummary.en, /t ≥ 2: draw a closed circle ● \(included\) at 2 and shade right/);
  assert.match(play.printSummary.en, /x < 5 needs a open circle|x < 5 needs an? open circle/);
  assert.match(play.printSummary.es, /sombreado a la izquierda/);
  assert.doesNotMatch(play.title.en, /\d|≥|closed|open/);
});

test("copy: Spanish has no English left", () => {
  const english = /\b(the|which|and|your|both|choose|check|value|test|then|circle|shade|shading)\b/i;
  const v = validateInequalityGraph(CFG);
  const walk = (o, path) => {
    if (o && typeof o === "object" && typeof o.en === "string") {
      assert.doesNotMatch(o.es, english, `${path}: ${o.es}`);
      if (/[A-Za-z]{3,}/.test(o.en)) assert.notEqual(o.es, o.en, path);
    } else if (o && typeof o === "object") for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
  };
  walk(graphCopy(v), "T");
  for (const c of [v.main, v.transfer]) {
    for (const o of [...circleChoices(c), ...graphChoices(c)]) {
      for (const p of [o.label, o.cue]) if (p) assert.doesNotMatch(p.es, english, p.es);
    }
  }
});

test("inequality-graph.js re-exports the model's validator", () => {
  assert.equal(reexported, validateInequalityGraph);
});
