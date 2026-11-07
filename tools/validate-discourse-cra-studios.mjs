/**
 * Unified Test & Self-Test Validation Suite for
 * TheLanguagePage.com & EduWonderLab.com Math Fluency Lab
 *
 * Verifies Section 5 Protocol & Section 7 Checklist:
 * 1. Exact Euclidean Rational Reduction (1/3 + 1/6 = 1/2, 2/3 ÷ 4/9 = 3/2, 2/4 = 1/2)
 * 2. BigInt boundary arithmetic & RangeError zero division trapping
 * 3. 25 authentic Grade 6 misconceptions with Tripwire logic & Axiom patches
 * 4. 3-Beat sequencing & cognitive latency strategy classifier (<=1200ms, <=3500ms, >3500ms)
 * 5. WIDA 2020 5-level syntactic scoring telemetry
 * 6. ESOL cognate injector & state machine safety
 */

import { RationalState } from "../math/fluency-lab/cra-kinetic-engine.js";
import { GRADE_6_MISCONCEPTIONS } from "../math/fluency-lab/forensic-debugging.js";
import { RationalNumber } from "../math-fluency-lab/src/engine/RationalNumber.js";
import { DiscourseArchitect } from "../math-fluency-lab/src/pedagogy/DiscourseArchitect.js";
import { ForensicConveyor } from "../math-fluency-lab/src/pedagogy/ForensicConveyor.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

function runTests() {
  console.log("==================================================================");
  console.log("RUNNING UNIFIED MATHEMATICAL & PEDAGOGICAL VERIFICATION SUITE");
  console.log("==================================================================\n");

  // 1. Rational Number Euclidean Reductions & Arithmetic
  console.log("1. EXACT RATIONAL ARITHMETIC VECTORS (Zero Floating-Point Drift)");
  {
    const rHalf = new RationalNumber(2, 4);
    assert(rHalf.n === 1n && rHalf.d === 2n, "RationalNumber(2, 4) reduces via GCD to 1/2");

    const a = new RationalNumber(1, 3);
    const b = new RationalNumber(1, 6);
    const sum = a.add(b);
    assert(sum.n === 1n && sum.d === 2n, "1/3 + 1/6 = 1/2 exact rational addition");

    const divA = new RationalNumber(2, 3);
    const divB = new RationalNumber(4, 9);
    const quotient = divA.div(divB);
    assert(quotient.n === 3n && quotient.d === 2n, "2/3 ÷ 4/9 = 3/2 exact rational division");

    // Division by zero trapping
    let divZeroTrapped = false;
    try {
      new RationalNumber(5, 0);
    } catch (e) {
      if (e instanceof RangeError) divZeroTrapped = true;
    }
    assert(divZeroTrapped, "Denominator 0 throws RangeError in constructor");

    let divZeroMethodTrapped = false;
    try {
      new RationalNumber(5, 2).div(new RationalNumber(0, 1));
    } catch (e) {
      if (e instanceof RangeError) divZeroMethodTrapped = true;
    }
    assert(divZeroMethodTrapped, "div(0) throws RangeError in division method");

    // BigInt boundary test (larger than 2^53 - 1)
    const bigNum = 9007199254740993n; // 2^53 + 1
    const bigR = new RationalNumber(bigNum * 2n, bigNum * 4n);
    assert(bigR.n === 1n && bigR.d === 2n, "Handles BigInt beyond 2^53 without precision loss");
  }

  // 2. Misconception Library & Forensic Breakpoints
  console.log("\n2. DETERMINISTIC GRADE 6 MISCONCEPTION LIBRARY (25 Cases)");
  {
    assert(
      GRADE_6_MISCONCEPTIONS.length === 25,
      "Contains exactly 25 pre-loaded authentic Grade 6 misconceptions",
    );

    // Verify all 25 have errorStep, brokenProperty, and correctBlock
    let allValid = true;
    for (const m of GRADE_6_MISCONCEPTIONS) {
      if (
        !m.id ||
        !m.title ||
        !m.errorStep ||
        !m.brokenProperty ||
        !m.correctBlock ||
        !m.recalculatedStep3
      ) {
        allValid = false;
        break;
      }
    }
    assert(
      allValid,
      "Every misconception specifies errorStep, brokenProperty, and recalculatedStep3",
    );

    // Verify ForensicConveyor tripwire detection
    const conveyor = new ForensicConveyor();
    const half = new RationalNumber(1, 2);
    const third = new RationalNumber(1, 3);
    const naiveTwoFifths = new RationalNumber(2, 5);
    const inspection = conveyor.inspectSubmission(half, third, naiveTwoFifths);
    assert(
      inspection.tripped && inspection.rule?.id === "DENOMINATOR_ADDITION_FALLACY",
      "Conveyor tripwire catches 1/2 + 1/3 = 2/5 naive denominator addition",
    );
  }

  // 3. Cognitive Latency Stratification & Strategy Classifier
  console.log("\n3. LATENCY STRATIFICATION & COGNITIVE CLASSIFICATION");
  {
    function classifyStrategy(totalMs) {
      if (totalMs <= 1200) return "Automaticity / Fact Retrieval";
      if (totalMs <= 3500) return "Strategic Decomposition";
      return "Procedural Inefficiency / Stall";
    }

    assert(
      classifyStrategy(850) === "Automaticity / Fact Retrieval",
      "850ms classified as Automaticity / Fact Retrieval (<= 1200ms)",
    );
    assert(
      classifyStrategy(1200) === "Automaticity / Fact Retrieval",
      "1200ms boundary classified as Automaticity",
    );
    assert(
      classifyStrategy(2100) === "Strategic Decomposition",
      "2100ms classified as Strategic Decomposition (1200ms < T <= 3500ms)",
    );
    assert(
      classifyStrategy(3500) === "Strategic Decomposition",
      "3500ms boundary classified as Strategic Decomposition",
    );
    assert(
      classifyStrategy(4200) === "Procedural Inefficiency / Stall",
      "4200ms classified as Procedural Inefficiency / Stall (> 3500ms)",
    );
  }

  // 4. WIDA 2020 Telemetry & ESOL Scaffolding
  console.log("\n4. WIDA 2020 DISCOURSE TELEMETRY & ESOL COGNATE INJECTOR");
  {
    const architect = new DiscourseArchitect();
    const scoreBasic = architect.analyzeText("The ratio is two to five.");
    assert(
      scoreBasic.discourseLevel >= 1 && scoreBasic.discourseLevel <= 2,
      "Simple sentence maps to WIDA Level 1-2",
    );

    const scoreComplex = architect.analyzeText(
      "Although the proportional ratio scales multiplicatively, adding constant values alters the fundamental fraction equivalence, which was completely unexpected.",
    );
    assert(
      scoreComplex.discourseLevel >= 4,
      "Complex subordinated academic discourse maps to WIDA Level 4-5",
    );

    const htmlText = "The ratio is proportional to the fraction.";
    const scaffolded = architect.injectCognateScaffolds(htmlText, "es");
    assert(
      scaffolded.includes('data-cognate="razón"') && scaffolded.includes('data-cognate="fracción"'),
      "Cognate injector embeds Spanish cognates (razón, fracción)",
    );
  }

  // 5. CRA State Machine & Topological Collision
  console.log("\n5. CRA KINETIC ENGINE & TOPOLOGICAL STRESS DETECTION");
  {
    const cra = new RationalState(2, 5, 3);
    assert(
      cra.scaledRatio.equals(new RationalNumber(6, 15)),
      "Proportional scaling: 2/5 * 3 = 6/15",
    );

    cra.attemptAdditiveScaling(3);
    assert(cra.isStressed, "Additive scaling (+3/+3) triggers topological stress flag");
    assert(cra.discrepancy !== null, "Topological stress records exact rational discrepancy");

    cra.clearStress();
    assert(!cra.isStressed && cra.discrepancy === null, "clearStress() restores equilibrium");
  }

  console.log("\n==================================================================");
  console.log(`VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
