// Flux Foundry round generators, checked independently of the game's own judge.
// 300 seeds x 4 levels x 3 modes. The rule behind every sensor log is
// rediscovered here by brute force over every gear and constant on the dial
// (it must be unique and equal the generated rule); predicted outputs and
// wire samples are recomputed from the rule text; the judge accepts exactly the
// true setting and rejects corrupted ones; no round starts solved from the
// parked controls; and every answer fits its slider range and step.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  CONTEXTS,
  judgeDecode,
  judgePredict,
  judgeWire,
  K_MAX,
  MODES,
  makeDecode,
  makePredict,
  makeWire,
  modeFor,
  ruleText,
  stepFor,
  X_MAX,
} from "../../math/games/engines/u9-flux-plotter/math.js";

const onDial = (v, min, max, step) => v >= min && v <= max && Number.isInteger((v - min) / step);
/** Evaluate a rule from its printed text, independently of apply(). */
function fromText(text, x) {
  let m = /^y = ([\d.]+)x$/.exec(text);
  if (m) return Number(m[1]) * x;
  m = /^y = x \+ ([\d.]+)$/.exec(text);
  assert.ok(m, `unparseable rule ${text}`);
  return x + Number(m[1]);
}
/** The constant the game parks the gear slider at. */
const parkK = (k, step) => (k <= 6 ? K_MAX : step);

const seen = new Set();
for (let r = 1; r <= 3; r++) seen.add(modeFor(r));
assert.equal(seen.size, MODES.length, "all three modes appear in rounds 1-3");

const counts = { decode: 0, predict: 0, wire: 0, halves: 0, ctx: new Set(), traps: 0 };
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 131 + level);
    const step = stepFor(level);
    const tag = `seed ${seed} L${level}`;

    // DECODE — brute-force every gear/constant on the dial against the log.
    const d = makeDecode(level, next);
    assert.ok(d.pairs.length === (level >= 3 ? 3 + 1 : 3), `${tag} log size`);
    assert.ok(d.pairs.every((p) => Number.isInteger(p.x) && p.x >= 1 && p.x <= X_MAX));
    assert.equal(new Set(d.pairs.map((p) => p.x)).size, d.pairs.length, "distinct inputs");
    const fits = [];
    for (const op of ["mul", "add"])
      for (let k = step; k <= K_MAX; k += step)
        if (d.pairs.every((p) => (op === "mul" ? k * p.x : p.x + k) === p.y)) fits.push({ op, k });
    assert.equal(fits.length, 1, `${tag} log has ${fits.length} matching rules`);
    assert.deepEqual(fits[0], d.rule, `${tag} decode rule`);
    if (level <= 2) assert.ok(Number.isInteger(d.rule.k), "whole constants at levels 1-2");
    else if (!Number.isInteger(d.rule.k)) counts.halves++;
    assert.ok(
      d.pairs.every((p) => p.y <= d.top),
      "every sensor dot is on the graph",
    );
    assert.ok(
      !d.pairs.some((p) => p.x === d.nextX) && d.nextX >= 0 && d.nextX <= X_MAX,
      "table's next input is new",
    );
    assert.equal(judgeDecode(d, d.rule.op, d.rule.k).verdict, "ok");
    assert.equal(judgeDecode(d, null, d.rule.k).verdict, "noGear", "starts solved with no gear");
    const pk = parkK(d.rule.k, step);
    assert.notEqual(pk, d.rule.k, "constant parked on the answer");
    assert.notEqual(judgeDecode(d, d.rule.op, pk).verdict, "ok");
    const other = d.rule.op === "mul" ? "add" : "mul";
    for (let k = step; k <= K_MAX; k += step)
      assert.notEqual(judgeDecode(d, other, k).verdict, "ok");
    assert.equal(judgeDecode(d, other, d.rule.k).verdict, "wrongGear");
    if (d.rule.k + step <= K_MAX)
      assert.equal(judgeDecode(d, d.rule.op, d.rule.k + step).verdict, "high");
    if (d.rule.k - step >= step)
      assert.equal(judgeDecode(d, d.rule.op, d.rule.k - step).verdict, "low");
    counts.decode++;

    // PREDICT — recompute the output from the printed rule.
    const p = makePredict(level, next);
    const y = fromText(ruleText(p.rule), p.x);
    assert.equal(p.y, y, `${tag} predict output`);
    assert.ok(p.x >= 5 && p.x <= X_MAX, "input clear of the tier-1 rows 1-3");
    assert.ok(
      onDial(y, 0, p.top, step) && y > 0,
      `${tag} output ${y} fits dial 0..${p.top} step ${step}`,
    );
    assert.equal(judgePredict(p, y).verdict, "ok");
    assert.notEqual(judgePredict(p, 0).verdict, "ok", "dial parked at 0 is the answer");
    assert.equal(judgePredict(p, y + step).verdict === "ok", false);
    const inv = p.rule.op === "mul" ? p.x / p.rule.k : p.x - p.rule.k;
    if (inv !== y) {
      assert.equal(judgePredict(p, inv).verdict, "inverse");
      counts.traps++;
    }
    if (p.ctx) {
      counts.ctx.add(p.ctx);
      const c = CONTEXTS.find((e) => e.id === p.ctx);
      assert.equal(c.op, p.rule.op, "context gear");
      if (!c.halves) assert.ok(Number.isInteger(p.rule.k), "no half crates or half years");
    }
    counts.predict++;

    // WIRE — sample reading recomputed from the printed rule; wiring decides first.
    const w = makeWire(level, next);
    assert.equal(w.sy, fromText(ruleText(w.rule), w.sx), `${tag} wire sample`);
    assert.ok(onDial(w.rule.k, step, K_MAX, step), "constant fits the gear dial");
    for (let x = 0; x <= X_MAX; x++)
      assert.ok(fromText(ruleText(w.rule), x) <= w.top, "line fits the graph");
    assert.equal(judgeWire(w, "in", w.rule.k).verdict, "ok");
    assert.equal(judgeWire(w, null, w.rule.k).verdict, "noWire", "starts solved unwired");
    assert.equal(judgeWire(w, "out", w.rule.k).verdict, "swapped");
    assert.notEqual(
      judgeWire(w, "in", parkK(w.rule.k, step)).verdict,
      "ok",
      "parked on the answer",
    );
    if (w.rule.k + step <= K_MAX) assert.equal(judgeWire(w, "in", w.rule.k + step).verdict, "high");
    if (w.rule.k - step >= step) assert.equal(judgeWire(w, "in", w.rule.k - step).verdict, "low");
    counts.wire++;
  }
}
assert.equal(counts.ctx.size, CONTEXTS.length, "every context is used");
assert.ok(counts.halves > 50, "half-unit constants appear at levels 3-4");
console.log(
  `ok u9-flux-plotter: ${counts.decode} decode (rule unique by brute force), ${counts.predict} predict (${counts.traps} inverse traps), ${counts.wire} wire rounds checked independently`,
);
