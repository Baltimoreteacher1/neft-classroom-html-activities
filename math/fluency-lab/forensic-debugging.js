/**
 * Module 4: The Forensic Debugging Arena (Adversarial Misconception Hunter)
 * Target: #forensic-debugging-app
 * Features: 3-step animated conveyor belt, 25 authentic Grade 6 misconceptions,
 * Tripwire breakpoint mechanic (Space or click), Axiom Patch Bay.
 */

import { diagnostics } from "../../shared/diagnostics-overlay.js";
import { RationalNumber } from "../../shared/rational-math.js";

export const GRADE_6_MISCONCEPTIONS = [
  {
    id: "prop-additive-bias",
    title: "Additive Bias in Proportions",
    task: "Find the equivalent ratio to 2/5 with numerator 5.",
    botClaim: "Easy! Since 2 + 3 = 5, I just add 3 to the bottom: 5 + 3 = 8. So 2/5 = 5/8!",
    step1: { eq: "2 / 5", reason: "Starting ratio" },
    step2: { eq: "(2 + 3) / (5 + 3)", reason: "Add 3 to top and bottom to make numerator 5" },
    step3: { eq: "5 / 8", reason: "Conclude 2/5 = 5/8" },
    errorStep: 2,
    brokenProperty: "Multiplicative Invariance",
    correctBlock: "(2 × 2.5) / (5 × 2.5)",
    recalculatedStep3: "5 / 12.5 (or 10/25)",
    explanation: "Ratios must scale multiplicatively to preserve equivalence, not additively."
  },
  {
    id: "frac-div-inversion",
    title: "Fraction Division Inversion Error",
    task: "Calculate 2/3 ÷ 1/3.",
    botClaim: "To divide fractions, flip the first fraction and multiply: 3/2 × 1/3 = 1/2!",
    step1: { eq: "2/3 ÷ 1/3", reason: "Starting expression" },
    step2: { eq: "3/2 × 1/3", reason: "Flip the first fraction (the dividend)" },
    step3: { eq: "3/6 = 1/2", reason: "Multiply across" },
    errorStep: 2,
    brokenProperty: "Division by Reciprocal of Divisor",
    correctBlock: "2/3 × 3/1",
    recalculatedStep3: "6/3 = 2",
    explanation: "In fraction division, multiply by the reciprocal of the divisor, never the dividend."
  },
  {
    id: "sign-subtraction-confusion",
    title: "Sign Confusion in Integer Subtraction",
    task: "Evaluate -8 - (-3).",
    botClaim: "A negative minus a negative gives an even bigger negative: -8 - 3 = -11!",
    step1: { eq: "-8 - (-3)", reason: "Starting integer subtraction" },
    step2: { eq: "-8 - 3", reason: "Drop parentheses and treat subtraction as negative addition" },
    step3: { eq: "-11", reason: "Combine negatives" },
    errorStep: 2,
    brokenProperty: "Additive Inverse Property (Subtracting a negative is adding)",
    correctBlock: "-8 + 3",
    recalculatedStep3: "-5",
    explanation: "Subtracting a negative integer is equivalent to adding its opposite: -(-3) = +3."
  },
  {
    id: "distributive-incompleteness",
    title: "Distributive Incompleteness",
    task: "Expand 4(x + 7).",
    botClaim: "Multiply 4 by x, then just bring down the 7: 4x + 7!",
    step1: { eq: "4(x + 7)", reason: "Starting factored expression" },
    step2: { eq: "(4 × x) + 7", reason: "Distribute 4 only to the first term x" },
    step3: { eq: "4x + 7", reason: "Combine terms" },
    errorStep: 2,
    brokenProperty: "Distributive Property of Multiplication over Addition",
    correctBlock: "(4 × x) + (4 × 7)",
    recalculatedStep3: "4x + 28",
    explanation: "The multiplier must distribute across all terms inside the parentheses: 4(x) + 4(7)."
  },
  {
    id: "area-perimeter-confusion",
    title: "Area/Perimeter Confusion",
    task: "Find the area of a rectangle with length 6 and width 4.",
    botClaim: "Area means all the sides, so 6 × 4 × 6 × 4 = 576 square units!",
    step1: { eq: "Rectangle: L=6, W=4", reason: "Given dimensions" },
    step2: { eq: "6 × 4 × 6 × 4", reason: "Multiply all four side lengths together" },
    step3: { eq: "576", reason: "Calculate product" },
    errorStep: 2,
    brokenProperty: "Geometric Area Definition (A = L × W)",
    correctBlock: "6 × 4",
    recalculatedStep3: "24 sq units",
    explanation: "Area is the 2D surface product of two orthogonal dimensions (length × width = 24)."
  },
  {
    id: "frac-add-denom-bias",
    title: "Fraction Addition Denominator Bias",
    task: "Evaluate 1/2 + 1/3.",
    botClaim: "Just add the tops and add the bottoms: (1+1)/(2+3) = 2/5!",
    step1: { eq: "1/2 + 1/3", reason: "Starting addition" },
    step2: { eq: "(1 + 1) / (2 + 3)", reason: "Add numerators and add denominators directly" },
    step3: { eq: "2/5", reason: "Simplify fraction" },
    errorStep: 2,
    brokenProperty: "Common Denominator Partition Invariance",
    correctBlock: "3/6 + 2/6",
    recalculatedStep3: "5/6",
    explanation: "Fractions represent equal parts of a whole; you must find a common denominator."
  },
  {
    id: "decimal-mult-place-shift",
    title: "Decimal Multiplication Value Shift",
    task: "Calculate 0.4 × 0.2.",
    botClaim: "4 × 2 = 8, and there is one decimal point, so the answer is 0.8!",
    step1: { eq: "0.4 × 0.2", reason: "Given decimal multiplication" },
    step2: { eq: "4/10 × 2/10 = 8/10", reason: "Treat product as tenths" },
    step3: { eq: "0.8", reason: "Convert back to decimal" },
    errorStep: 2,
    brokenProperty: "Decimal Place Value Product (Tenths × Tenths = Hundredths)",
    correctBlock: "4/10 × 2/10 = 8/100",
    recalculatedStep3: "0.08",
    explanation: "Tenths multiplied by tenths yields hundredths: 0.4 × 0.2 = 0.08."
  },
  {
    id: "exponent-mult-confusion",
    title: "Exponent Base Multiplicative Confusion",
    task: "Evaluate 3³.",
    botClaim: "An exponent means multiply the base by the exponent: 3 × 3 = 9!",
    step1: { eq: "3³", reason: "Given exponential expression" },
    step2: { eq: "3 × 3", reason: "Multiply base by exponent value" },
    step3: { eq: "9", reason: "Compute product" },
    errorStep: 2,
    brokenProperty: "Repeated Multiplication Definition of Exponents",
    correctBlock: "3 × 3 × 3",
    recalculatedStep3: "27",
    explanation: "3³ means 3 used as a factor 3 times: 3 × 3 × 3 = 27."
  },
  {
    id: "neg-integer-comparison",
    title: "Negative Integer Comparison Inversion",
    task: "Compare -15 and -5.",
    botClaim: "15 is bigger than 5, so -15 is greater than -5!",
    step1: { eq: "-15 vs -5", reason: "Given negative integers" },
    step2: { eq: "15 > 5 implies -15 > -5", reason: "Apply positive magnitude ordering directly to negatives" },
    step3: { eq: "-15 > -5", reason: "Conclude inequality" },
    errorStep: 2,
    brokenProperty: "Number Line Directionality (Leftward is lesser)",
    correctBlock: "-15 is 10 units to the left of -5",
    recalculatedStep3: "-15 < -5",
    explanation: "On a number line, values further to the left are lesser; therefore -15 < -5."
  },
  {
    id: "order-of-operations-neglect",
    title: "Order of Operations Left-to-Right Blindness",
    task: "Compute 5 + 3 × 2.",
    botClaim: "Math is read left to right: 5 + 3 = 8, then 8 × 2 = 16!",
    step1: { eq: "5 + 3 × 2", reason: "Given expression" },
    step2: { eq: "(5 + 3) × 2", reason: "Evaluate addition first from left to right" },
    step3: { eq: "16", reason: "Compute product" },
    errorStep: 2,
    brokenProperty: "Order of Operations Precedence (Multiplication before Addition)",
    correctBlock: "5 + (3 × 2)",
    recalculatedStep3: "5 + 6 = 11",
    explanation: "Multiplication takes operational precedence over addition: 5 + 6 = 11."
  },
  {
    id: "unit-rate-inversion",
    title: "Unit Rate Inversion",
    task: "3 apples cost $1.50. Find the unit price per apple.",
    botClaim: "Divide apples by dollars: 3 ÷ 1.50 = 2 dollars per apple!",
    step1: { eq: "3 apples = $1.50", reason: "Given rate" },
    step2: { eq: "3 ÷ 1.50", reason: "Divide quantity by total cost" },
    step3: { eq: "$2.00 / apple", reason: "Conclude unit rate" },
    errorStep: 2,
    brokenProperty: "Ratio Definition of Unit Price (Cost ÷ Quantity)",
    correctBlock: "$1.50 ÷ 3",
    recalculatedStep3: "$0.50 / apple",
    explanation: "Cost per unit requires Cost divided by Quantity: $1.50 ÷ 3 = $0.50."
  },
  {
    id: "percent-as-whole-number",
    title: "Percent as Whole Number Scaling",
    task: "Find 25% of 80.",
    botClaim: "Percent means multiply directly: 25 × 80 = 2,000!",
    step1: { eq: "25% of 80", reason: "Given percentage of quantity" },
    step2: { eq: "25 × 80", reason: "Multiply whole number 25 by 80" },
    step3: { eq: "2000", reason: "Output result" },
    errorStep: 2,
    brokenProperty: "Definition of Percent as Hundredths (per centum)",
    correctBlock: "0.25 × 80 (or 25/100 × 80)",
    recalculatedStep3: "20",
    explanation: "Percent means parts per hundred: 25% = 25/100 = 0.25. 0.25 × 80 = 20."
  },
  {
    id: "neg-times-neg-confusion",
    title: "Negative × Negative Confusion",
    task: "Evaluate (-4) × (-3).",
    botClaim: "Multiplying negatives gives a negative: (-4) × (-3) = -12!",
    step1: { eq: "(-4) × (-3)", reason: "Given product" },
    step2: { eq: "-(4 × 3)", reason: "Assign negative sign to product of two negatives" },
    step3: { eq: "-12", reason: "Conclude result" },
    errorStep: 2,
    brokenProperty: "Multiplicative Sign Rule (Opposite of Opposite is Positive)",
    correctBlock: "+(4 × 3)",
    recalculatedStep3: "+12",
    explanation: "The product of two negative numbers is positive: (-4) × (-3) = +12."
  },
  {
    id: "variable-coefficient-addition",
    title: "Variable Coefficient and Constant Addition",
    task: "Simplify 3x + 4.",
    botClaim: "Add 3 and 4 together to make 7, so 3x + 4 = 7x!",
    step1: { eq: "3x + 4", reason: "Given expression" },
    step2: { eq: "(3 + 4)x", reason: "Combine coefficient with constant term" },
    step3: { eq: "7x", reason: "Output simplified form" },
    errorStep: 2,
    brokenProperty: "Distributive Property & Like Terms Definition",
    correctBlock: "3x + 4 (Cannot combine unlike terms)",
    recalculatedStep3: "3x + 4 (Already simplified)",
    explanation: "3x and 4 are unlike terms; they cannot be combined into 7x."
  },
  {
    id: "equation-balance-additive-error",
    title: "Equation Balance Additive Misconception",
    task: "Solve x + 7 = 15.",
    botClaim: "To move 7 to the other side, just add it: x = 15 + 7 = 22!",
    step1: { eq: "x + 7 = 15", reason: "Given equation" },
    step2: { eq: "x = 15 + 7", reason: "Add 7 to the right side" },
    step3: { eq: "x = 22", reason: "Conclude solution" },
    errorStep: 2,
    brokenProperty: "Subtraction Property of Equality (Inverse Operations)",
    correctBlock: "x = 15 - 7",
    recalculatedStep3: "x = 8",
    explanation: "To undo addition of 7, subtract 7 from both sides: 15 - 7 = 8."
  },
  {
    id: "coordinate-quadrant-flipping",
    title: "Coordinate Plane Sign Flipping",
    task: "Plot the point (-3, 4).",
    botClaim: "Negative means down and positive means left, so it's in Quadrant IV!",
    step1: { eq: "Point (-3, 4)", reason: "Given ordered pair (x, y)" },
    step2: { eq: "x = -3 (down), y = +4 (left)", reason: "Swap axis directions" },
    step3: { eq: "Quadrant IV", reason: "Conclude quadrant" },
    errorStep: 2,
    brokenProperty: "Cartesian Convention (x horizontal, y vertical)",
    correctBlock: "x = -3 (left), y = +4 (up)",
    recalculatedStep3: "Quadrant II",
    explanation: "In Cartesian coordinates, x is horizontal (left) and y is vertical (up), putting (-3, 4) in QII."
  },
  {
    id: "surface-area-overcounting",
    title: "Surface Area Net Overcounting",
    task: "Find the surface area of a cube with edge length 3.",
    botClaim: "A cube has 8 corners so it has 8 faces: 8 × (3 × 3) = 72!",
    step1: { eq: "Cube edge = 3", reason: "Given edge dimension" },
    step2: { eq: "8 faces × 3²", reason: "Confuse 8 vertices with 6 square faces" },
    step3: { eq: "72 sq units", reason: "Compute area" },
    errorStep: 2,
    brokenProperty: "Polyhedral Topology (A cube has exactly 6 faces)",
    correctBlock: "6 faces × 3²",
    recalculatedStep3: "54 sq units",
    explanation: "A cube has 6 congruent square faces, not 8: 6 × 9 = 54."
  },
  {
    id: "median-unsorted-confusion",
    title: "Median Without Sorting",
    task: "Find the median of {9, 2, 8, 3, 5}.",
    botClaim: "The middle number in the list is 8, so the median is 8!",
    step1: { eq: "List: 9, 2, 8, 3, 5", reason: "Given raw data set" },
    step2: { eq: "Pick 3rd element: 8", reason: "Select middle element without ordering" },
    step3: { eq: "Median = 8", reason: "Conclude median" },
    errorStep: 2,
    brokenProperty: "Order Statistic Axiom (Data must be sorted ascending)",
    correctBlock: "Sorted: 2, 3, 5, 8, 9",
    recalculatedStep3: "Median = 5",
    explanation: "The median is the midpoint of an ordered set. Sorting gives 2, 3, 5, 8, 9; middle is 5."
  },
  {
    id: "absolute-value-sign-confusion",
    title: "Absolute Value Sign Confusion",
    task: "Evaluate |-7|.",
    botClaim: "Absolute value always makes numbers negative: |-7| = -7!",
    step1: { eq: "|-7|", reason: "Given absolute value" },
    step2: { eq: "-7", reason: "Assert absolute value produces negative output" },
    step3: { eq: "-7", reason: "Conclude result" },
    errorStep: 2,
    brokenProperty: "Definition of Absolute Value as Non-Negative Distance",
    correctBlock: "Distance from 0 to -7 = 7",
    recalculatedStep3: "+7",
    explanation: "Absolute value measures distance from zero on a number line, which is always non-negative: 7."
  },
  {
    id: "dividing-by-decimals-error",
    title: "Dividing by Decimals Inversion Bias",
    task: "Calculate 12 ÷ 0.5.",
    botClaim: "Division always makes numbers smaller, so 12 ÷ 0.5 = 6!",
    step1: { eq: "12 ÷ 0.5", reason: "Given decimal division" },
    step2: { eq: "12 × 0.5", reason: "Confuse dividing by 0.5 with multiplying by 0.5" },
    step3: { eq: "6", reason: "Compute result" },
    errorStep: 2,
    brokenProperty: "Multiplicative Inverse of Fractions (Dividing by 1/2 is multiplying by 2)",
    correctBlock: "12 ÷ (1/2) = 12 × 2",
    recalculatedStep3: "24",
    explanation: "Dividing by a fraction less than 1 produces a quotient greater than the dividend: 12 × 2 = 24."
  },
  {
    id: "mixed-number-mult-error",
    title: "Mixed Number Multiplication Incompleteness",
    task: "Multiply 2½ × 3½.",
    botClaim: "Multiply wholes and multiply fractions: (2 × 3) and (½ × ½) = 6¼!",
    step1: { eq: "2½ × 3½", reason: "Given mixed numbers" },
    step2: { eq: "(2 × 3) + (½ × ½)", reason: "Multiply only like parts, omitting cross-products" },
    step3: { eq: "6¼", reason: "Conclude product" },
    errorStep: 2,
    brokenProperty: "Distributive Foil Property for Mixed Numbers",
    correctBlock: "(5/2) × (7/2)",
    recalculatedStep3: "35/4 = 8¾",
    explanation: "Convert to improper fractions first: (5/2) × (7/2) = 35/4 = 8¾."
  },
  {
    id: "scale-factor-area-confusion",
    title: "Scale Factor Linear to Area Confusion",
    task: "If side lengths of a square double (scale factor 2), what happens to area?",
    botClaim: "If sides double, area also doubles (2×)!",
    step1: { eq: "Original square side s, Area = s²", reason: "Initial area" },
    step2: { eq: "New Area = 2 × s²", reason: "Apply linear scale factor directly to area" },
    step3: { eq: "Area doubles (2×)", reason: "Conclude scaling" },
    errorStep: 2,
    brokenProperty: "Dimensional Scaling Invariance (Area scales by k²)",
    correctBlock: "New Area = (2s)² = 4s²",
    recalculatedStep3: "Area quadruples (4×)",
    explanation: "When linear dimensions scale by factor k, area scales by k²: 2² = 4 times greater."
  },
  {
    id: "unlike-terms-combining",
    title: "Combining Unlike Variables",
    task: "Simplify 2a + 3b.",
    botClaim: "Combine the numbers and variables: 2a + 3b = 5ab!",
    step1: { eq: "2a + 3b", reason: "Given expression" },
    step2: { eq: "(2 + 3)(a × b)", reason: "Multiply variables and add coefficients" },
    step3: { eq: "5ab", reason: "Conclude simplification" },
    errorStep: 2,
    brokenProperty: "Additive Identity of Unlike Variable Monomials",
    correctBlock: "2a + 3b (Cannot be simplified)",
    recalculatedStep3: "2a + 3b",
    explanation: "Terms with different variables (a and b) cannot be combined under addition."
  },
  {
    id: "percent-base-shift",
    title: "Percent Increase/Decrease Base Shift",
    task: "A $100 item increases by 20%, then decreases by 20%. Final price?",
    botClaim: "Up 20% and down 20% cancels out, so the price returns to $100!",
    step1: { eq: "$100 + 20% = $120", reason: "Calculate 20% increase" },
    step2: { eq: "$120 - 20% = $100", reason: "Assume -20% of 120 equals $20" },
    step3: { eq: "$100", reason: "Conclude original price" },
    errorStep: 2,
    brokenProperty: "Percent Reference Base Invariance (20% of 120 is 24)",
    correctBlock: "$120 - (0.20 × 120) = $120 - $24",
    recalculatedStep3: "$96",
    explanation: "The 20% decrease applies to the new $120 base ($24 discount), resulting in $96."
  },
  {
    id: "reciprocal-sign-flub",
    title: "Reciprocal Sign Confusion",
    task: "Find the reciprocal of -3/4.",
    botClaim: "To make a reciprocal, flip the fraction and flip the sign: +4/3!",
    step1: { eq: "Number: -3/4", reason: "Given rational number" },
    step2: { eq: "Flip fraction and change sign to positive: +4/3", reason: "Confuse opposite with reciprocal" },
    step3: { eq: "+4/3", reason: "Conclude reciprocal" },
    errorStep: 2,
    brokenProperty: "Multiplicative Inverse Definition (Product must equal +1)",
    correctBlock: "-4/3 (because (-3/4) × (-4/3) = +1)",
    recalculatedStep3: "-4/3",
    explanation: "The product of a number and its reciprocal must be +1; the sign must remain negative: -4/3."
  }
];

export const AXIOM_PROPERTIES = [
  "Multiplicative Invariance",
  "Division by Reciprocal of Divisor",
  "Additive Inverse Property (Subtracting a negative is adding)",
  "Distributive Property of Multiplication over Addition",
  "Geometric Area Definition (A = L × W)",
  "Common Denominator Partition Invariance",
  "Decimal Place Value Product (Tenths × Tenths = Hundredths)",
  "Repeated Multiplication Definition of Exponents",
  "Number Line Directionality (Leftward is lesser)",
  "Order of Operations Precedence (Multiplication before Addition)",
  "Ratio Definition of Unit Price (Cost ÷ Quantity)",
  "Definition of Percent as Hundredths (per centum)",
  "Multiplicative Sign Rule (Opposite of Opposite is Positive)",
  "Distributive Property & Like Terms Definition",
  "Subtraction Property of Equality (Inverse Operations)",
  "Cartesian Convention (x horizontal, y vertical)",
  "Polyhedral Topology (A cube has exactly 6 faces)",
  "Order Statistic Axiom (Data must be sorted ascending)",
  "Definition of Absolute Value as Non-Negative Distance",
  "Multiplicative Inverse of Fractions (Dividing by 1/2 is multiplying by 2)",
  "Distributive Foil Property for Mixed Numbers",
  "Dimensional Scaling Invariance (Area scales by k²)",
  "Additive Identity of Unlike Variable Monomials",
  "Percent Reference Base Invariance (20% of 120 is 24)",
  "Multiplicative Inverse Definition (Product must equal +1)"
];

export class ForensicDebuggingArena {
  constructor(container) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) {
      console.warn("ForensicDebuggingArena: Target container not found.");
      return;
    }

    this.state = {
      misconceptionIndex: 0,
      activeStep: 1, // 1, 2, 3
      isConveyorRunning: true,
      tripwireStep: null,
      selectedAxiom: null,
      isPatched: false,
      score: 0
    };

    this.conveyorTimer = null;
    this.init();
    diagnostics.registerState("ForensicDebugging", () => this.getTelemetry());
  }

  init() {
    this.render();
    this.bindEvents();
    this.startConveyor();
  }

  getCurrentMisconception() {
    return GRADE_6_MISCONCEPTIONS[this.state.misconceptionIndex] || GRADE_6_MISCONCEPTIONS[0];
  }

  startConveyor() {
    clearInterval(this.conveyorTimer);
    this.state.activeStep = 1;
    this.state.isConveyorRunning = true;
    this.updateConveyorVisuals();

    this.conveyorTimer = setInterval(() => {
      if (!this.state.isConveyorRunning || this.state.isPatched) return;

      if (this.state.activeStep < 3) {
        this.state.activeStep++;
        this.updateConveyorVisuals();
      } else {
        // Cycle back or advance
        this.state.activeStep = 1;
        this.updateConveyorVisuals();
      }
    }, 2800);
  }

  updateConveyorVisuals() {
    for (let i = 1; i <= 3; i++) {
      const stepNode = this.container.querySelector(`#conveyor-step-${i}`);
      if (stepNode) {
        stepNode.classList.toggle("active-step", i === this.state.activeStep);
      }
    }
  }

  dropTripwire(stepNum) {
    this.state.tripwireStep = stepNum;
    this.state.isConveyorRunning = false;
    clearInterval(this.conveyorTimer);

    const misc = this.getCurrentMisconception();
    const isTargetError = stepNum === misc.errorStep;

    const stepNode = this.container.querySelector(`#conveyor-step-${stepNum}`);
    if (stepNode) {
      if (isTargetError) {
        stepNode.classList.add("tripped-error");
        this.showFeedback(true, `Tripwire Triggered! You caught Bug-Bot's logic failure at Step ${stepNum}. Now select the broken mathematical property below to patch it.`);
      } else {
        this.showFeedback(false, `Step ${stepNum} is mathematically valid! Examine Step ${misc.errorStep} where the flawed logic transition occurs.`);
      }
    }
  }

  showFeedback(isSuccess, msg) {
    const banner = this.container.querySelector("#patch-feedback-banner");
    if (banner) {
      banner.className = isSuccess ? "patch-feedback-banner success" : "patch-feedback-banner error";
      banner.textContent = msg;
    }
  }

  applyPatch(selectedProperty) {
    const misc = this.getCurrentMisconception();
    if (selectedProperty === misc.brokenProperty) {
      this.state.isPatched = true;
      this.state.score += 100;

      // Update Step 2 with correct block and Step 3 with recalculated step
      const step2Eq = this.container.querySelector("#step-2-eq");
      if (step2Eq) step2Eq.textContent = misc.correctBlock;

      const step3Eq = this.container.querySelector("#step-3-eq");
      if (step3Eq) step3Eq.textContent = misc.recalculatedStep3;

      const errorNode = this.container.querySelector(`#conveyor-step-${misc.errorStep}`);
      if (errorNode) {
        errorNode.classList.remove("tripped-error");
        errorNode.classList.add("patched-step");
      }

      this.showFeedback(true, `✓ Neutralized! You applied "${selectedProperty}". Downstream steps recalculated: ${misc.recalculatedStep3}. Explanation: ${misc.explanation}`);
    } else {
      this.showFeedback(false, `Incorrect property. "${selectedProperty}" does not address the underlying error. Review the axiom bay.`);
    }
  }

  render() {
    const misc = this.getCurrentMisconception();

    this.container.innerHTML = `
      <div class="arena-header">
        <div class="arena-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Forensic Debugging Arena
          </h2>
          <p class="arena-subtitle">Adversarial Misconception Hunter: Drop Tripwires on Bug-Bot's math errors and patch axioms.</p>
        </div>

        <div class="misconception-selector-row">
          <label for="arena-misconception-dropdown" style="font-size:12px; font-weight:700; color:#94a3b8;">CASE STUDY:</label>
          <select id="arena-misconception-dropdown" class="misconception-select" aria-label="Select Misconception Case Study">
            ${GRADE_6_MISCONCEPTIONS.map((m, idx) => `
              <option value="${idx}" ${idx === this.state.misconceptionIndex ? 'selected' : ''}>
                ${idx + 1}. ${m.title}
              </option>
            `).join("")}
          </select>
        </div>
      </div>

      <!-- 3-Step Animated Conveyor Belt -->
      <section class="conveyor-belt-container" aria-label="Animated Logic Conveyor Belt">
        <div class="conveyor-status-bar">
          <div class="bot-speech-card">
            <span class="bot-avatar" aria-hidden="true">🤖</span>
            <div>
              <strong style="color:#818cf8; font-size:12px; display:block;">Overconfident Bug-Bot v6.2:</strong>
              <span class="bot-quote">"${misc.botClaim}"</span>
            </div>
          </div>
          <div style="font-size:12px; color:#94a3b8;">
            Shortcuts: Hit <kbd style="background:#1e293b; padding:2px 6px; border-radius:4px; color:#f8fafc;">Space</kbd> or click Tripwire to freeze.
          </div>
        </div>

        <div class="conveyor-track" role="list">
          <!-- Step 1 Node -->
          <div class="conveyor-step-node" id="conveyor-step-1" role="listitem">
            <span class="step-badge">Step 1: Given Problem</span>
            <div class="step-equation" id="step-1-eq">${misc.step1.eq}</div>
            <div class="step-justification">${misc.step1.reason}</div>
            <button type="button" class="tripwire-btn" data-tripwire="1" aria-label="Drop Tripwire on Step 1">
              ⚡ Tripwire 1
            </button>
          </div>

          <!-- Step 2 Node -->
          <div class="conveyor-step-node" id="conveyor-step-2" role="listitem">
            <span class="step-badge">Step 2: Transition & Operation</span>
            <div class="step-equation" id="step-2-eq">${misc.step2.eq}</div>
            <div class="step-justification">${misc.step2.reason}</div>
            <button type="button" class="tripwire-btn" data-tripwire="2" aria-label="Drop Tripwire on Step 2">
              ⚡ Tripwire 2
            </button>
          </div>

          <!-- Step 3 Node -->
          <div class="conveyor-step-node" id="conveyor-step-3" role="listitem">
            <span class="step-badge">Step 3: Bot Conclusion</span>
            <div class="step-equation" id="step-3-eq">${misc.step3.eq}</div>
            <div class="step-justification">${misc.step3.reason}</div>
            <button type="button" class="tripwire-btn" data-tripwire="3" aria-label="Drop Tripwire on Step 3">
              ⚡ Tripwire 3
            </button>
          </div>
        </div>

        <!-- Feedback Banner -->
        <div class="patch-feedback-banner" id="patch-feedback-banner" role="alert"></div>
      </section>

      <!-- Axiom Patch Bay -->
      <section class="axiom-patch-bay" aria-label="Axiom Patch Bay">
        <div class="bay-title">
          <span>Mathematical Axiom Tray (Select Broken Property)</span>
          <span style="font-size:12px; color:#38bdf8;">Score: ${this.state.score} pts</span>
        </div>

        <div class="axiom-chips-grid" role="group" aria-label="Mathematical Axiom Properties">
          ${[misc.brokenProperty, "Multiplicative Invariance", "Distributive Property of Multiplication over Addition", "Additive Inverse Property (Subtracting a negative is adding)", "Order of Operations Precedence (Multiplication before Addition)"].filter((v, i, a) => a.indexOf(v) === i).map(prop => `
            <button type="button" class="axiom-chip ${this.state.selectedAxiom === prop ? 'selected' : ''}" data-axiom="${prop}" role="button">
              ${prop}
            </button>
          `).join("")}
        </div>

        <div style="margin-top:12px;">
          <span style="font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Replacement Equation Block:</span>
          <div class="patch-blocks-row">
            <div class="patch-block" id="active-patch-block" role="button" tabindex="0">
              Snap: ${misc.correctBlock}
            </div>
            <button type="button" class="btn-secondary" id="arena-restart-btn">
              Restart Conveyor
            </button>
          </div>
        </div>
      </section>
    `;
  }

  bindEvents() {
    // Dropdown change
    this.container.addEventListener("change", (e) => {
      if (e.target.id === "arena-misconception-dropdown") {
        this.state.misconceptionIndex = parseInt(e.target.value, 10);
        this.state.isPatched = false;
        this.state.tripwireStep = null;
        this.state.selectedAxiom = null;
        this.render();
        this.bindEvents();
        this.startConveyor();
      }
    });

    this.container.addEventListener("click", (e) => {
      // Tripwire click
      const tripBtn = e.target.closest(".tripwire-btn");
      if (tripBtn) {
        const step = parseInt(tripBtn.dataset.tripwire, 10);
        this.dropTripwire(step);
        return;
      }

      // Axiom Selection
      const axiomBtn = e.target.closest(".axiom-chip");
      if (axiomBtn) {
        const prop = axiomBtn.dataset.axiom;
        this.state.selectedAxiom = prop;
        this.container.querySelectorAll(".axiom-chip").forEach(b => b.classList.remove("selected"));
        axiomBtn.classList.add("selected");
        this.applyPatch(prop);
        return;
      }

      // Snap Block click
      if (e.target.closest("#active-patch-block")) {
        const misc = this.getCurrentMisconception();
        this.applyPatch(misc.brokenProperty);
        return;
      }

      // Restart Conveyor
      if (e.target.closest("#arena-restart-btn")) {
        this.state.isPatched = false;
        this.state.tripwireStep = null;
        this.startConveyor();
      }
    });

    // Space key triggers Tripwire on currently active conveyor step
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        this.dropTripwire(this.state.activeStep);
      }
    });
  }

  getTelemetry() {
    return {
      caseStudy: this.getCurrentMisconception().title,
      activeStep: this.state.activeStep,
      isConveyorRunning: this.state.isConveyorRunning,
      isPatched: this.state.isPatched,
      score: this.state.score
    };
  }
}

export function initForensicDebugging(container = "#forensic-debugging-app") {
  return new ForensicDebuggingArena(container);
}
