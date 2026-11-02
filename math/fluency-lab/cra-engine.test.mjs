import assert from "node:assert/strict";
import {
  CRA_STRATEGY_REGISTRY,
  CRADecompositionEngine,
  makeAreaModelSVG,
  makeTenFrameSVG,
  makeNumberLineSVG,
  makeFractionBarSVG,
  makeDivisionPartitionSVG,
  makeIntegerCountersSVG,
  parseProblemFact,
} from "./CRADecompositionEngine.js";

// Verify parseProblemFact
const parsedFact = parseProblemFact({ question: "7 × 8 = ?", answers: ["56"] });
assert.equal(parsedFact.operandA, 7);
assert.equal(parsedFact.operandB, 8);
assert.equal(parsedFact.operator, "×");
assert.equal(parsedFact.answer, "56");

const parsedAdd = parseProblemFact({ question: "8 + 5 = ?", answers: ["13"] });
assert.equal(parsedAdd.operandA, 8);
assert.equal(parsedAdd.operandB, 5);
assert.equal(parsedAdd.operator, "+");

const parsedSub = parseProblemFact({ question: "14 − 6 = ?", answers: ["8"] });
assert.equal(parsedSub.operandA, 14);
assert.equal(parsedSub.operandB, 6);
assert.equal(parsedSub.operator, "−");

// 1. Verify Strategy Registry Coverage
assert.ok(CRA_STRATEGY_REGISTRY.distributive_split, "distributive_split strategy must exist");
assert.ok(CRA_STRATEGY_REGISTRY.doubles_halves, "doubles_halves strategy must exist");
assert.ok(CRA_STRATEGY_REGISTRY.make_ten, "make_ten strategy must exist");
assert.ok(CRA_STRATEGY_REGISTRY.doubles_plus_one, "doubles_plus_one strategy must exist");
assert.ok(CRA_STRATEGY_REGISTRY.benchmark_back_jump, "benchmark_back_jump strategy must exist");
assert.ok(CRA_STRATEGY_REGISTRY.partition_quotient, "partition_quotient strategy must exist");
assert.ok(CRA_STRATEGY_REGISTRY.fraction_cut, "fraction_cut strategy must exist");
assert.ok(CRA_STRATEGY_REGISTRY.zero_pairs, "zero_pairs strategy must exist");

// 2. Verify SVG Generator Outputs
const svg1 = makeAreaModelSVG({ factorA: 7, factorB: 8, split: 5, phase: "PARTITION" });
assert.ok(svg1.includes("viewBox="), "makeAreaModelSVG must include viewBox");
assert.ok(svg1.includes("5 × 8"), "makeAreaModelSVG must show chunk 1");
assert.ok(svg1.includes("2 × 8"), "makeAreaModelSVG must show chunk 2");

const svg2 = makeTenFrameSVG({ numA: 8, numB: 5, bridgedCount: 2, phase: "RECOMBINE" });
assert.ok(svg2.includes("Ten-Frame 1: 10/10"), "Ten frame 1 must be full");
assert.ok(svg2.includes("Ten-Frame 2: 3 leftovers"), "Ten frame 2 must have 3 remaining");

const svg3 = makeNumberLineSVG({ startVal: 14, subtrahend: 6, phase: "TRANSFER" });
assert.ok(svg3.includes("-4"), "Number line must show jump to 10");
assert.ok(svg3.includes("-2"), "Number line must show jump to 8");

const svg4 = makeFractionBarSVG({ num: 1, denom: 2, targetDenom: 4, phase: "PARTITION" });
assert.ok(svg4.includes("Equivalent Partition: 2/4"), "Fraction bar must show 2/4 equivalence");

const svg5 = makeDivisionPartitionSVG({ dividend: 56, divisor: 7, split: 35, phase: "RECOMBINE" });
assert.ok(svg5.includes("35 ÷ 7 = 5"), "Division partition must show 35 / 7 = 5");
assert.ok(svg5.includes("21 ÷ 7 = 3"), "Division partition must show 21 / 7 = 3");

const svg6 = makeIntegerCountersSVG({ numA: 5, numB: -3, pairsCancelled: 3, phase: "TRANSFER" });
assert.ok(svg6.includes("Zero pairs removed: 3"), "Integer counters must show 3 pairs cancelled");

// 3. Run CRADecompositionEngine.selfTest()
const selfTestResult = CRADecompositionEngine.selfTest();
assert.ok(selfTestResult.ok, `selfTest failed: ${selfTestResult.errors.join(", ")}`);
assert.ok(selfTestResult.checksRun >= 6, "selfTest must run at least 6 assertions");

console.log(`CRADecompositionEngine tests passed: ${selfTestResult.checksRun} checks verified.`);
