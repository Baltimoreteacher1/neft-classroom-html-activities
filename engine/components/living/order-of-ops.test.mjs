// order-of-ops.test.mjs — every number and every line the order-of-ops play shows.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildOrderOfOpsPlay, validateOrderOfOps as reexported } from "./order-of-ops.js";
import {
  allOps,
  applyOp,
  firstStepChoices,
  isLegal,
  legalKind,
  misorders,
  opLabel,
  orderCopy,
  parseFactor,
  solve,
  stateText,
  validateOrderOfOps,
  valueOf,
} from "./order-of-ops-model.js";

// 6-4: the we-do order 2 × 15 + 4 × 20 + 8 × 2³ = 174, and the you-do (4 × 3² + 6) ÷ 7.
const CFG = {
  prefix: "$",
  terms: [["2", "15"], ["4", "20"], ["8", "2^3"]],
  meanings: [
    { en: "member tickets", es: "boletos de socio" },
    { en: "non-member tickets", es: "boletos de no socio" },
    { en: "student tickets", es: "boletos de estudiante" },
  ],
  transfer: { terms: [["4", "3^2"], ["6"]], div: 7 },
};

const walk = (o, out = []) => {
  if (o && typeof o === "object" && typeof o.en === "string" && "es" in o) out.push(o);
  else if (o && typeof o === "object" && typeof o !== "function")
    for (const x of Object.values(o)) walk(x, out);
  return out;
};

test("the lesson's arithmetic, worked by hand", () => {
  // 2³ = 8; 2 × 15 = 30; 4 × 20 = 80; 8 × 8 = 64; 30 + 80 = 110; 110 + 64 = 174.
  assert.equal(2 * 2 * 2, 8);
  assert.equal(30 + 80 + 64, 174);
  const v = validateOrderOfOps(CFG);
  assert.equal(valueOf(v.main), 174);
  // (4 × 3² + 6) ÷ 7: 3² = 9; 4 × 9 = 36; 36 + 6 = 42; 42 ÷ 7 = 6.
  assert.equal((4 * 9 + 6) / 7, 6);
  assert.equal(valueOf(v.transfer), 6);
});

test("solve: powers, then products, then sums, with the value equal at every line", () => {
  const v = validateOrderOfOps(CFG);
  assert.deepEqual(
    solve(v.main).map((l) => stateText(l.state)),
    [
      "2 × 15 + 4 × 20 + 8 × 2³",
      "2 × 15 + 4 × 20 + 8 × 8",
      "30 + 4 × 20 + 8 × 8",
      "30 + 80 + 8 × 8",
      "30 + 80 + 64",
      "110 + 64",
      "174",
    ],
  );
  assert.deepEqual(
    solve(v.main)
      .slice(1)
      .map((l) => [l.op.kind, l.label, l.result]),
    [
      ["pow", "2³", 8],
      ["mul", "2 × 15", 30],
      ["mul", "4 × 20", 80],
      ["mul", "8 × 8", 64],
      ["add", "30 + 80", 110],
      ["add", "110 + 64", 174],
    ],
  );
  assert.deepEqual(
    solve(v.transfer).map((l) => stateText(l.state)),
    ["(4 × 3² + 6) ÷ 7", "(4 × 9 + 6) ÷ 7", "(36 + 6) ÷ 7", "42 ÷ 7", "6"],
  );
  for (const e of [v.main, v.transfer])
    for (const l of solve(e)) assert.equal(valueOf(l.state), valueOf(e), stateText(l.state));
});

test("legal order: a part that must wait is refused, never applied", () => {
  const { main, transfer } = validateOrderOfOps(CFG);
  assert.equal(legalKind(main), "pow");
  const ops = allOps(main);
  assert.deepEqual(
    ops.map((o) => [o.kind, opLabel(main, o)]),
    [
      ["pow", "2³"],
      ["mul", "2 × 15"],
      ["mul", "4 × 20"],
      ["mul", "8 × 2³"],
      ["add", "2 × 15 + 4 × 20"],
    ],
  );
  for (const o of ops.filter((x) => x.kind !== "pow")) {
    assert.ok(!isLegal(main, o));
    assert.equal(applyOp(main, o), null);
  }
  assert.equal(legalKind(transfer), "pow");
  assert.equal(applyOp(transfer, allOps(transfer).find((o) => o.kind === "div")), null);
  // After the power, multiplying (any product) is the stage; adding still waits.
  const s1 = applyOp(main, ops[0]);
  assert.equal(legalKind(s1), "mul");
  assert.ok(allOps(s1).filter((o) => o.kind === "mul").every((o) => applyOp(s1, o)));
  assert.equal(applyOp(s1, allOps(s1).find((o) => o.kind === "add")), null);
  // The input state is never mutated.
  assert.equal(stateText(main), "2 × 15 + 4 × 20 + 8 × 2³");
});

test("any order inside a stage ends at the same total", () => {
  const { main } = validateOrderOfOps(CFG);
  let st = applyOp(main, allOps(main)[0]);
  for (const pick of [2, 0, 1]) {
    const muls = allOps(st).filter((o) => o.kind === "mul");
    st = applyOp(st, muls[pick % muls.length]);
  }
  assert.equal(legalKind(st), "add");
  while (legalKind(st)) st = applyOp(st, allOps(st)[0]);
  assert.equal(stateText(st), "174");
});

test("misorders: the three real slips, each worked out by hand", () => {
  const { main } = validateOrderOfOps(CFG);
  // left to right: 2 × 15 = 30, + 4 = 34, × 20 = 680, + 8 = 688, × 8 = 5504
  // 2³ as 2 × 3: 30 + 80 + 8 × 6 = 158
  // (8 × 2)³ = 16³ = 4096: 30 + 80 + 4096 = 4206
  assert.deepEqual(
    misorders(main).map((o) => [o.kind, o.value]),
    [
      ["left", 5504],
      ["times", 158],
      ["product", 4206],
    ],
  );
  assert.equal((((30 + 4) * 20 + 8) * 8), 5504);
  assert.equal(30 + 80 + 8 * (2 * 3), 158);
  assert.equal(30 + 80 + (8 * 2) ** 3, 4206);
});

test("firstStepChoices: one allowed part, the rest are real mistakes", () => {
  const { main, transfer } = validateOrderOfOps(CFG);
  assert.deepEqual(
    firstStepChoices(main).map((c) => [opLabel(main, c.op), c.correct]),
    [
      ["2³", true],
      ["2 × 15", false],
      ["8 × 2³", false],
      ["2 × 15 + 4 × 20", false],
    ],
  );
  assert.deepEqual(
    firstStepChoices(transfer).map((c) => [opLabel(transfer, c.op), c.correct]),
    [
      ["3²", true],
      ["4 × 3²", false],
      ["4 × 3² + 6", false],
      ["÷ 7", false],
    ],
  );
});

test("cues point at the picture and never state the total", () => {
  const v = validateOrderOfOps(CFG);
  const T = orderCopy(v);
  for (const [st, total] of [
    [v.main, "174"],
    [v.transfer, "6"],
  ])
    for (const c of firstStepChoices(st).filter((x) => !x.correct)) {
      const cue = T.cue(st, c.op);
      for (const lang of ["en", "es"]) {
        assert.ok(cue[lang].length > 40);
        assert.match(cue[lang], /\?/);
        assert.ok(!new RegExp(`(?<![\\d.])${total}(?![\\d])`).test(cue[lang]), cue[lang]);
      }
    }
  for (const o of misorders(v.main)) {
    const cue = T.checkCue(o);
    assert.match(cue.en, /\?/);
    assert.ok(!cue.en.includes("174") && !cue.es.includes("174"));
  }
});

test("parseFactor and validation refuse what the stage cannot draw", () => {
  assert.deepEqual(parseFactor("15"), { v: 15 });
  assert.deepEqual(parseFactor("2^3"), { b: 2, e: 3 });
  for (const bad of ["0", "100", "2^1", "2^5", "x", "", "2^3^2", "-4"]) assert.equal(parseFactor(bad), null, bad);
  const base = { ...CFG };
  for (const cfg of [
    null,
    {},
    { ...base, terms: [["2", "15"]] }, // a single term, no power
    { ...base, terms: [["2", "15"], ["4", "20"]] }, // no power
    { ...base, terms: [["2", "15", "3"], ["8", "2^3"]] }, // three factors
    { ...base, div: 5 }, // main may not divide
    { ...base, transfer: { terms: [["4", "3^2"], ["6"]], div: 5 } }, // 42 / 5 is not whole
    { ...base, transfer: { terms: [["4", "3"], ["6"]], div: 7 } }, // no power
    { ...base, transfer: undefined },
  ])
    assert.equal(validateOrderOfOps(cfg), null, JSON.stringify(cfg).slice(0, 80));
  assert.equal(buildOrderOfOpsPlay({ terms: [["2", "15"]] }), null);
  // Meanings that do not match the terms are dropped; blank ones refuse.
  assert.equal(validateOrderOfOps({ ...base, meanings: [{ en: "a" }] }).meanings, null);
  assert.equal(validateOrderOfOps({ ...base, meanings: [{ en: "" }, { en: "b" }, { en: "c" }] }), null);
});

test("buildOrderOfOpsPlay: six scenes, gates where the student acts", () => {
  const play = buildOrderOfOpsPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["evaluate", true],
      ["connect", false],
      ["check", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /174/);
  assert.match(play.printSummary.en, /2³ = 8/);
  assert.match(play.printSummary.en, /\$174/);
  assert.match(play.printSummary.es, /\$174/);
});

test("all copy is bilingual and the Spanish has no English left", () => {
  const T = orderCopy(validateOrderOfOps(CFG));
  const pairs = walk({ ...T, cue: undefined, checkCue: undefined, stepNote: undefined });
  for (const o of misorders(validateOrderOfOps(CFG).main)) pairs.push(T.checkCue(o));
  pairs.push(T.stepNote({ label: "2³", result: 8 }));
  assert.ok(pairs.length > 25);
  for (const p of pairs) {
    assert.ok(p.es.trim(), p.en);
    assert.notEqual(p.es, p.en, p.en);
    assert.doesNotMatch(p.es, /\b(the|and|each|first|then|before|power|multiply|add|stage)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted|vosotros\b/i);
  }
});

test("the authored 6-4 config builds, and the registry exposes the play", async () => {
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/6-4/config.json", import.meta.url), "utf8"));
  const living = cfg.launch.conceptIntro.livingScene;
  assert.equal(living.play, "order-of-ops");
  assert.ok(buildOrderOfOpsPlay(living));
  const { PLAYS } = await import("./cluster-expressions.js");
  assert.equal(await PLAYS["order-of-ops"](), buildOrderOfOpsPlay);
  assert.equal(reexported, validateOrderOfOps);
});
