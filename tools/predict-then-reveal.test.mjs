#!/usr/bin/env node
/**
 * A wrong answer in a predict card is worse than no card at all.
 *
 * The card states a question in the lesson's own voice and then tells the
 * student which choice was right. If the deriver's arithmetic is wrong, the
 * lesson teaches the error and confirms it — so every deriver is checked here
 * against EVERY real config of its kind on disk, with the expected value
 * recomputed independently rather than read back out of the module.
 *
 * It also pins the two ways this stops being safe quietly:
 *   • a figure whose area the config does not determine (composite, polygon)
 *     must get NO card, not a guessed one;
 *   • the correct choice must not settle at one position. A fleet audit found
 *     the right answer sitting at A in ~90% of 1,426 items, which teaches
 *     position instead of mathematics.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { derivePrediction } from "../engine/core/predict-then-reveal.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORE = /^\d+-\d+$/;
const KINDS = new Set(["prism-volume", "area-morph", "line-grapher", "bar-chart"]);

/** Every interactive placement on disk, with the lesson it came from. */
function placements() {
  const out = [];
  for (const id of readdirSync(join(ROOT, "lessons"))) {
    if (!CORE.test(id)) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));
    } catch {
      continue;
    }
    const walk = (node, path) => {
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
      if (!node || typeof node !== "object") return;
      const isVisual = /interactiveVisual|diagram|simulator/.test(path);
      if (isVisual && typeof node.kind === "string") out.push({ id, path, cfg: node });
      for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`);
    };
    walk(cfg, "");
  }
  return out;
}

const ALL = placements();
const correctOf = (p) => p.choices[p.answerIndex];

test("the sweep actually found the tools — an empty sweep proves nothing", () => {
  assert.ok(ALL.length > 100, `only ${ALL.length} placements found; the walker is broken`);
  for (const k of KINDS) {
    assert.ok(
      ALL.some((p) => p.cfg.kind === k),
      `no ${k} placement found on disk — this test would silently verify nothing`,
    );
  }
});

test("prism volume is length × width × height, on every real config", () => {
  const seen = ALL.filter((p) => p.cfg.kind === "prism-volume");
  for (const { id, cfg } of seen) {
    const got = derivePrediction("prism-volume", cfg);
    assert.ok(got, `${id}: prism-volume produced no card from ${JSON.stringify(cfg)}`);
    const expected = cfg.l * cfg.w * cfg.h;
    assert.equal(
      Number(correctOf(got)),
      Number(expected.toFixed(6)),
      `${id}: volume should be ${expected}, card says ${correctOf(got)}`,
    );
  }
  assert.ok(seen.length >= 5, `expected the 6 prism-volume placements, saw ${seen.length}`);
});

test("area uses the formula for the figure it names, on every real config", () => {
  const AREA = {
    parallelogram: (c) => c.b * c.h,
    triangle: (c) => (c.b * c.h) / 2,
    trapezoid: (c) => ((c.a + c.b) / 2) * c.h,
  };
  let checked = 0;
  for (const { id, cfg } of ALL.filter((p) => p.cfg.kind === "area-morph")) {
    const got = derivePrediction("area-morph", cfg);
    const fn = AREA[cfg.figure];
    if (!fn || typeof cfg.a !== "number" ? cfg.figure === "trapezoid" : false) continue;
    if (!fn) {
      assert.equal(
        got,
        null,
        `${id}: ${cfg.figure} area is not determined by its config — no card`,
      );
      continue;
    }
    assert.ok(got, `${id}: ${cfg.figure} produced no card from ${JSON.stringify(cfg)}`);
    const expected = fn(cfg);
    assert.equal(
      Number(correctOf(got)),
      Number(expected.toFixed(6)),
      `${id}: ${cfg.figure} area should be ${expected}, card says ${correctOf(got)}`,
    );
    checked++;
  }
  assert.ok(checked >= 6, `expected at least 6 determinate area figures, checked ${checked}`);
});

test("a figure whose area the config does not determine gets no card", () => {
  for (const fig of ["composite", "polygon"]) {
    assert.equal(
      derivePrediction("area-morph", { kind: "area-morph", figure: fig, b: 6, h: 5 }),
      null,
      `${fig} must not be given a guessed area`,
    );
  }
  // A trapezoid without its second parallel side is equally undetermined.
  assert.equal(
    derivePrediction("area-morph", { kind: "area-morph", figure: "trapezoid", b: 8, h: 5 }),
    null,
  );
});

test("the proportional line multiplies the rate, on every real config", () => {
  const seen = ALL.filter((p) => p.cfg.kind === "line-grapher");
  for (const { id, cfg } of seen) {
    const got = derivePrediction("line-grapher", cfg);
    assert.ok(got, `${id}: line-grapher produced no card from ${JSON.stringify(cfg)}`);
    const expected = cfg.kDefault * 4;
    const shown = String(correctOf(got)).replace(/^[^0-9.-]+/, ""); // strip $ etc.
    assert.equal(
      Number(shown),
      Number(expected.toFixed(6)),
      `${id}: y should be ${expected} at x=4, card says ${correctOf(got)}`,
    );
  }
  assert.ok(seen.length >= 10, `expected the 12 line-grapher placements, saw ${seen.length}`);
});

test("the bar-chart shape question matches what the data actually does", () => {
  const seen = ALL.filter((p) => p.cfg.kind === "bar-chart");
  let checked = 0;
  for (const { id, cfg } of seen) {
    const vals = (cfg.bars || []).map((b) => b?.value).filter((v) => typeof v === "number");
    const labels = (cfg.bars || []).map((b) => String(b?.label || "").trim());
    const got = derivePrediction("bar-chart", cfg);
    if (vals.length === 2) {
      // A two-bar chart is a comparison: the taller label is the answer.
      if (vals[0] === vals[1] || !labels[0] || !labels[1] || labels[0] === labels[1]) {
        assert.equal(got, null, `${id}: two bars with nothing to compare`);
        continue;
      }
      assert.ok(got, `${id}: two-bar chart produced no card`);
      assert.equal(
        correctOf(got),
        vals[0] > vals[1] ? labels[0] : labels[1],
        `${id}: greater of ${vals.join(" vs ")}`,
      );
      checked++;
      continue;
    }
    if (vals.length < 3) {
      assert.equal(got, null, `${id}: too few bars to predict anything`);
      continue;
    }
    assert.ok(got, `${id}: bar-chart produced no card`);
    const rising = vals.every((v, i) => i === 0 || v > vals[i - 1]);
    const falling = vals.every((v, i) => i === 0 || v < vals[i - 1]);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const flat = mean > 0 && (Math.max(...vals) - Math.min(...vals)) / mean <= 0.15;
    const expected = rising
      ? "They climb steadily"
      : falling
        ? "They fall steadily"
        : flat
          ? "They are all about the same"
          : "They go up and down with no steady pattern";
    assert.equal(correctOf(got), expected, `${id}: shape for ${vals.join(",")}`);
    checked++;
  }
  assert.ok(checked >= 20, `expected most bar-charts to be predictable, checked ${checked}`);
});

test("an authored predict block is well formed on every lesson that has one", () => {
  const authored = ALL.filter((p) => p.cfg.predict);
  assert.ok(authored.length >= 10, `only ${authored.length} authored blocks found`);
  for (const { id, cfg } of authored) {
    const a = cfg.predict;
    const got = derivePrediction(cfg.kind, cfg);
    assert.ok(got, `${id}: authored block did not produce a card`);
    assert.equal(correctOf(got), a.choices[a.correctIndex], `${id}: wrong choice marked correct`);
    assert.ok(a.explanation && a.explanation.trim(), `${id}: no explanation`);
    // The coaching line is the point of authoring these: a wrong answer gets a
    // reason of its own, not one line shared by all three.
    assert.equal(
      a.choiceFeedback.length,
      a.choices.length,
      `${id}: choiceFeedback does not line up with choices — feedback would attach to the wrong answer`,
    );
    assert.equal(
      a.choiceFeedback[a.correctIndex].trim(),
      "",
      `${id}: the correct choice carries wrong-answer coaching`,
    );
    for (let i = 0; i < a.choices.length; i++) {
      if (i === a.correctIndex) continue;
      assert.ok(a.choiceFeedback[i].trim().length > 15, `${id}: choice ${i} has no real coaching`);
    }
    assert.equal(new Set(a.choices).size, a.choices.length, `${id}: repeats a choice`);
    // An authored card must route its per-choice coaching, not the explanation.
    assert.equal(
      got.feedbackFor(a.correctIndex === 0 ? 1 : 0),
      a.choiceFeedback[a.correctIndex === 0 ? 1 : 0],
    );
  }
});

test("authored questions outrank derived ones", () => {
  const cfg = {
    kind: "prism-volume",
    l: 8,
    w: 3,
    h: 10,
    predict: { stem: "Authored?", choices: ["a", "b"], correctIndex: 1, explanation: "x" },
  };
  assert.equal(derivePrediction("prism-volume", cfg).prompt, "Authored?");
});

test("a malformed authored block is declined, never half-rendered", () => {
  const base = { kind: "ratio-table-builder" };
  const bad = [
    { predict: { stem: "", choices: ["a", "b"], correctIndex: 0 } },
    { predict: { stem: "q", choices: ["a"], correctIndex: 0 } },
    { predict: { stem: "q", choices: ["a", "b"], correctIndex: 5 } },
    { predict: { stem: "q", choices: ["a", "a"], correctIndex: 0 } },
    { predict: { stem: "q", choices: ["a", "b"] } },
  ];
  for (const b of bad)
    assert.equal(derivePrediction("ratio-table-builder", { ...base, ...b }), null);
});

test("manip derives only where its attrs determine the answer", () => {
  const mk = (manip, attrs) => ({ kind: "manip", manip, attrs });
  // Determined.
  assert.equal(
    correctOf(derivePrediction("manip", mk("percent-bar", { base: 60, percent: 25 }))),
    "15",
  );
  assert.equal(
    correctOf(
      derivePrediction("manip", mk("composite-split", { w: 10, h: 6, "notch-w": 4, "notch-h": 3 })),
    ),
    "48",
  );
  assert.equal(
    correctOf(
      derivePrediction(
        "manip",
        mk("expr-machine", {
          "default-a": 8,
          "default-x": 4,
          "default-b": 25,
          "coef-name": "dollars per hour",
          "var-name": "hours",
          "const-name": "one-time fee",
        }),
      ),
    ),
    "57",
  );
  assert.equal(
    correctOf(derivePrediction("manip", mk("dot-plot", { values: [38, 38, 41, 45, 53] }))),
    "41",
  );
  // NOT determined — a canvas range or a bare variable is not a question.
  for (const m of [
    mk("coord-plot", { range: 20 }),
    mk("number-line", { range: 20, unit: "" }),
    mk("algebra-tiles", { var: "x", "x-default": 4 }),
    mk("frac-divide", {}),
    mk("balance", {}),
  ]) {
    assert.equal(derivePrediction("manip", m), null, `${m.manip} has no problem in its config`);
  }
});

test("every real manip placement is either derivable or declined, never wrong", () => {
  const DET = {
    "percent-bar": (a) => (a.percent / 100) * a.base,
    "composite-split": (a) => a.w * a.h - a["notch-w"] * a["notch-h"],
    "expr-machine": (a) => a["default-a"] * a["default-x"] + a["default-b"],
  };
  let checked = 0;
  for (const { id, cfg } of ALL.filter((p) => p.cfg.kind === "manip")) {
    const got = derivePrediction("manip", cfg);
    const fn = DET[cfg.manip];
    if (!fn || !cfg.attrs) continue;
    assert.ok(got, `${id}: ${cfg.manip} should derive from ${JSON.stringify(cfg.attrs)}`);
    assert.equal(Number(correctOf(got)), Number(fn(cfg.attrs).toFixed(6)), `${id}: ${cfg.manip}`);
    checked++;
  }
  assert.ok(checked >= 4, `expected several determinate manips, checked ${checked}`);
});

test("every card offers real alternatives and exactly one right answer", () => {
  for (const { id, cfg } of ALL.filter(
    (p) => KINDS.has(p.cfg.kind) || p.cfg.predict || p.cfg.kind === "manip",
  )) {
    const got = derivePrediction(cfg.kind, cfg);
    if (!got) continue;
    assert.ok(got.choices.length >= 2, `${id}: ${cfg.kind} offers ${got.choices.length} choice(s)`);
    assert.equal(
      new Set(got.choices.map(String)).size,
      got.choices.length,
      `${id}: ${cfg.kind} repeats a choice, so two answers look right`,
    );
    assert.ok(got.answerIndex >= 0 && got.answerIndex < got.choices.length);
    assert.match(got.prompt, /\S/);
    assert.match(got.because, /\S/);
  }
});

test("the correct answer does not settle at one position", () => {
  const positions = new Map();
  for (const { cfg } of ALL.filter(
    (p) => KINDS.has(p.cfg.kind) || p.cfg.predict || p.cfg.kind === "manip",
  )) {
    const got = derivePrediction(cfg.kind, cfg);
    if (!got) continue;
    positions.set(got.answerIndex, (positions.get(got.answerIndex) || 0) + 1);
  }
  const total = [...positions.values()].reduce((a, b) => a + b, 0);
  assert.ok(total > 20, `only ${total} cards to measure`);
  const top = Math.max(...positions.values());
  assert.ok(
    top / total < 0.6,
    `the correct choice sits at one position in ${Math.round((100 * top) / total)}% of cards ` +
      `(${JSON.stringify([...positions])}) — that teaches position, not mathematics`,
  );
});

test("the same config always produces the same card", () => {
  const cfg = { kind: "prism-volume", l: 8, w: 3, h: 10, unit: "in" };
  const a = derivePrediction("prism-volume", cfg);
  const b = derivePrediction("prism-volume", cfg);
  assert.deepEqual(a, b, "a reload must not reshuffle the choices under the student");
});

test("an unknown kind and a junk config are declined, not guessed", () => {
  assert.equal(derivePrediction("ratio-table-builder", { kind: "ratio-table-builder" }), null);
  assert.equal(derivePrediction("percent-grid", { kind: "percent-grid" }), null);
  assert.equal(derivePrediction("prism-volume", { kind: "prism-volume", l: 0, w: 3, h: 2 }), null);
  assert.equal(derivePrediction("prism-volume", null), null);
  assert.equal(derivePrediction("line-grapher", { kind: "line-grapher", kDefault: 2 }), null);
});
