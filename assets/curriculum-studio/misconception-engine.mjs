/**
 * Deterministic Misconception-to-Resource Engine
 * Implements: Identify -> Explain -> Intervene -> Reattempt -> Verify
 */

const RULES = {
  "6-5": [
    {
      id: "6-5-coeff-constant-swap",
      match: (resp) => {
        const s = String(resp || "").replace(/\s+/g, "").toLowerCase();
        return s === "50t+12" || s === "12+50t";
      },
      patternLabel: "Coefficient and constant swapped",
      teacherExplanation:
        "Student attached the variable to the flat fee ($50) instead of the per-ticket rate ($12). Distinguish quantities that repeat per unit from one-time constants.",
      studentFeedback:
        "Check which dollar amount repeats for every ticket ($12 each) and which amount is paid only once ($50 venue fee).",
      interveneResourceKey: "learningLab",
      reattempt: {
        prompt: "A streaming pass costs $9 per month plus a $15 setup fee. Write an expression for the cost of m months.",
        expected: "9m+15",
        altExpected: ["15+9m", "9*m+15"],
        hint: "Multiply $9 by the number of months m, then add the one-time $15 fee.",
      },
      verify: {
        prompt: "Evaluate 9m + 15 when m = 4 months.",
        expected: "51",
      },
    },
    {
      id: "6-5-subtraction-reversal",
      match: (resp) => {
        const s = String(resp || "").replace(/\s+/g, "").toLowerCase();
        return s === "5-x" || s === "7-n";
      },
      patternLabel: "Subtraction order reversal ('less than' phrase)",
      teacherExplanation:
        "Student translated '5 less than x' left-to-right as 5 - x instead of subtracting 5 from x (x - 5).",
      studentFeedback:
        "'5 less than x' starts with x and takes away 5. Try testing with a number like x = 10: 5 less than 10 is 10 - 5 = 5.",
      interveneResourceKey: "studentHelp",
      reattempt: {
        prompt: "Write an algebraic expression for '8 less than k'.",
        expected: "k-8",
        altExpected: [],
        hint: "Start with k, then subtract 8.",
      },
      verify: {
        prompt: "Evaluate k - 8 when k = 15.",
        expected: "7",
      },
    },
    {
      id: "6-5-eval-order",
      match: (resp) => {
        const num = Number(resp);
        return num === 248 || num === 66;
      },
      patternLabel: "Order-of-operations error during substitution",
      teacherExplanation:
        "Student substituted t = 4 correctly, but added 12 + 50 before multiplying by t (or added 12 + 4 + 50 instead of multiplying 12 × 4).",
      studentFeedback:
        "Remember: 12t means 12 × t. Multiply 12 × 4 first, then add the 50.",
      interveneResourceKey: "guidedNotes",
      reattempt: {
        prompt: "Evaluate 8x + 10 when x = 3.",
        expected: "34",
        altExpected: [],
        hint: "First multiply 8 × 3 = 24, then add 10.",
      },
      verify: {
        prompt: "Evaluate 6n + 5 when n = 4.",
        expected: "29",
      },
    },
  ],
  "5-1": [
    {
      id: "5-1-slant-height",
      match: (resp) => Number(resp) === 154,
      patternLabel: "Used slanted side instead of perpendicular height",
      teacherExplanation:
        "Student multiplied base (14) × slanted side (11) = 154 instead of base (14) × perpendicular height (9) = 126.",
      studentFeedback:
        "Area uses the straight-up perpendicular height (9 ft) that meets the base at a 90° angle, not the slanted side (11 ft).",
      interveneResourceKey: "learningLab",
      reattempt: {
        prompt: "A parallelogram has base 10 cm, perpendicular height 6 cm, and slanted side 8 cm. Find its area.",
        expected: "60",
        altExpected: [],
        hint: "Use Area = base × perpendicular height = 10 × 6.",
      },
      verify: {
        prompt: "A parallelogram has base 12 m and perpendicular height 5 m. What is its area?",
        expected: "60",
      },
    },
    {
      id: "5-1-triangle-halving",
      match: (resp) => Number(resp) === 63,
      patternLabel: "Halved base × height (confused parallelogram with triangle)",
      teacherExplanation:
        "Student computed ½ × 14 × 9 = 63, applying the triangle area formula to a full parallelogram.",
      studentFeedback:
        "A parallelogram can be rearranged into a full rectangle with the same base and height — no need to divide by 2!",
      interveneResourceKey: "guidedNotes",
      reattempt: {
        prompt: "Find the area of a parallelogram with base 8 in. and height 7 in.",
        expected: "56",
        altExpected: [],
        hint: "A = base × height (do not divide by 2).",
      },
      verify: {
        prompt: "A rhombus has base 9 ft and perpendicular height 4 ft. Find its area.",
        expected: "36",
      },
    },
    {
      id: "5-1-perimeter-confusion",
      match: (resp) => Number(resp) === 46 || Number(resp) === 50 || Number(resp) === 23,
      patternLabel: "Added side lengths (perimeter) instead of finding area",
      teacherExplanation:
        "Student added dimensions instead of multiplying base × height to measure square units inside the figure.",
      studentFeedback:
        "Adding sides gives the perimeter around the outside. To find area (square units inside), multiply base × height.",
      interveneResourceKey: "studentHelp",
      reattempt: {
        prompt: "A parallelogram has base 11 m and height 4 m. What is its area in square meters?",
        expected: "44",
        altExpected: [],
        hint: "Multiply base × height: 11 × 4.",
      },
      verify: {
        prompt: "Find the area of a parallelogram with base 15 cm and height 3 cm.",
        expected: "45",
      },
    },
  ],
  "2-3": [
    {
      id: "2-3-unordered-median",
      match: (resp, ctx) => {
        const unsortedMid = ctx?.unsortedMid;
        return unsortedMid !== undefined && Number(resp) === Number(unsortedMid);
      },
      patternLabel: "Found middle value without ordering data first",
      teacherExplanation:
        "Student selected the middle number of the list as written without sorting values from least to greatest.",
      studentFeedback:
        "Always order the data from least to greatest first! Ordering is what makes the middle value represent the center.",
      interveneResourceKey: "learningLab",
      reattempt: {
        prompt: "Find the median of this unordered data set: 12, 4, 9, 5, 10.",
        expected: "9",
        altExpected: [],
        hint: "First sort: 4, 5, 9, 10, 12. Then pick the middle value.",
      },
      verify: {
        prompt: "Find the median of: 18, 7, 11, 3, 15.",
        expected: "11",
      },
    },
    {
      id: "2-3-even-no-average",
      match: (resp, ctx) => {
        return ctx?.evenPair && (Number(resp) === ctx.evenPair[0] || Number(resp) === ctx.evenPair[1]);
      },
      patternLabel: "Picked one middle value instead of averaging the two middle values",
      teacherExplanation:
        "With an even number of values, student chose one of the two middle numbers instead of finding the halfway point (mean) between them.",
      studentFeedback:
        "When there are two middle numbers, find the value halfway between them by adding them and dividing by 2.",
      interveneResourceKey: "guidedNotes",
      reattempt: {
        prompt: "Find the median of: 3, 5, 9, 12.",
        expected: "7",
        altExpected: [],
        hint: "The two middle numbers are 5 and 9. Halfway between 5 and 9 is (5 + 9) ÷ 2.",
      },
      verify: {
        prompt: "Find the median of: 4, 8, 10, 16.",
        expected: "9",
      },
    },
  ],
};

function normalizeExpr(val) {
  return String(val ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function diagnoseResponse({ lessonId, response, expected, altExpected = [], context = {} }) {
  const normResp = normalizeExpr(response);
  const normExp = normalizeExpr(expected);
  const alts = (altExpected || []).map(normalizeExpr);

  if (!normResp) {
    return {
      status: "empty",
      correct: false,
      misconceptionId: null,
      patternLabel: "No response entered",
      teacherExplanation: "Student has not submitted a response yet.",
      studentFeedback: "Enter your answer or expression first, then check your reasoning.",
      interveneResourceKey: "studentHelp",
      reattempt: null,
      verify: null,
    };
  }

  if (normResp === normExp || alts.includes(normResp)) {
    return {
      status: "correct",
      correct: true,
      misconceptionId: null,
      patternLabel: "Accurate mathematical response",
      teacherExplanation: "Student demonstrated accurate conceptual and procedural understanding.",
      studentFeedback: "Spot on! Your mathematical representation and calculation are accurate.",
      interveneResourceKey: null,
      reattempt: null,
      verify: null,
    };
  }

  const lessonRules = RULES[lessonId] || [];
  for (const rule of lessonRules) {
    if (rule.match(response, context)) {
      return {
        status: "misconception",
        correct: false,
        misconceptionId: rule.id,
        patternLabel: rule.patternLabel,
        teacherExplanation: rule.teacherExplanation,
        studentFeedback: rule.studentFeedback,
        interveneResourceKey: rule.interveneResourceKey,
        reattempt: rule.reattempt,
        verify: rule.verify,
      };
    }
  }

  return {
    status: "incorrect",
    correct: false,
    misconceptionId: `${lessonId}-general-check`,
    patternLabel: "Calculation or representation mismatch",
    teacherExplanation:
      "Response does not match the expected value; inspect student's intermediate steps to distinguish arithmetic slip from conceptual gap.",
    studentFeedback:
      "Not quite yet. Re-read the quantities in the problem, test your idea with the interactive model, and try again.",
    interveneResourceKey: "studentHelp",
    reattempt: lessonRules[0]?.reattempt || null,
    verify: lessonRules[0]?.verify || null,
  };
}
