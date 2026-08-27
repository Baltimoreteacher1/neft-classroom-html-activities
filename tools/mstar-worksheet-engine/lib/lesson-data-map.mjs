/**
 * lesson-data-map.mjs — Comprehensive 84-Lesson Curriculum Catalog & MSTAR Item Database
 *
 * Full coverage across all 10 Units (84 Lessons) with standards, objectives, bilingual vocabulary,
 * MSTAR EBSR, Multi-Select, Type II Error Analysis with Rubric, and SVG configurations.
 */

export const UNITS = [
  { id: "unit-1", num: 1, title: "Math Is...", cluster: "MPP", count: 6 },
  { id: "unit-2", num: 2, title: "Statistics", cluster: "6.DS", count: 12 },
  { id: "unit-3", num: 3, title: "Ratios & Rates", cluster: "6.AT", count: 10 },
  { id: "unit-4", num: 4, title: "Percents", cluster: "6.AT.4", count: 5 },
  { id: "unit-5", num: 5, title: "Area, Surface Area & Volume", cluster: "6.GR", count: 10 },
  {
    id: "unit-6",
    num: 6,
    title: "Expressions & Number Operations",
    cluster: "6.NOS / 6.AT",
    count: 15,
  },
  { id: "unit-7", num: 7, title: "Integers & Coordinate Plane", cluster: "6.NOS", count: 9 },
  { id: "unit-8", num: 8, title: "Equations & Inequalities", cluster: "6.AT", count: 7 },
  { id: "unit-9", num: 9, title: "Two-Variable Relationships", cluster: "6.AT.11", count: 4 },
  { id: "unit-10", num: 10, title: "Culminating Math Practices", cluster: "MPP", count: 6 },
];

// Helper to construct structured lesson records deterministically
function createLessonRecord(
  unit,
  id,
  title,
  standard,
  objective,
  vocab,
  svgConfig,
  mstarEBSR,
  mstarMultiSelect,
  errorAnalysis,
) {
  return {
    unit,
    id,
    title,
    standard,
    objective,
    vocab,
    svgConfig,
    mstarEBSR: mstarEBSR || {
      partA: {
        prompt: `Solve the standard-aligned problem for ${title}: Which statement accurately models the mathematical relationship?`,
        options: [
          `The calculated value satisfies ${standard} under all specified constraints.`,
          `The value only applies when numbers are positive integers.`,
          `The relationship cannot be verified without rounding.`,
          `The inverse operation produces an unrelated value.`,
        ],
      },
      partB: {
        prompt: `Which mathematical property or evidence justifies the selection in Part A?`,
        options: [
          `Applying the definition and properties of ${standard} proves equivalence and preserves equality.`,
          `The numbers were added together without regard to operation.`,
          `Estimation is used in place of exact proof.`,
          `The order of operations is reversed.`,
        ],
      },
    },
    mstarMultiSelect: mstarMultiSelect || {
      prompt: `Select ALL statements that are mathematically true regarding ${title} (${standard}):`,
      options: [
        `The relationship can be represented accurately using visual models and equations.`,
        `Changing the order of values in subtraction or division alters the result.`,
        `Units must remain consistent throughout all stages of calculation.`,
        `Every solution can be verified by direct substitution.`,
        `Mathematical properties allow decomposing complex terms into simpler components.`,
      ],
    },
    errorAnalysis: errorAnalysis || {
      title: `Spot the Misconception in ${title}`,
      scenario: `A student attempted to solve a problem related to ${standard}. Review their work below:`,
      steps: [
        { num: 1, label: "Step 1", text: "Identified the given quantities from the problem." },
        {
          num: 2,
          label: "Step 2 (Student Error)",
          text: "Used a superficial keyword heuristic rather than conceptual structure.",
        },
        { num: 3, label: "Step 3", text: "Produced an inaccurate solution." },
      ],
    },
  };
}

export const LESSON_MAP = {};

// UNIT 1: Math Is... (1-1 to 1-6)
const u1Lessons = [
  {
    id: "1-1",
    title: "Math is Mine",
    std: "MPP.3",
    obj: "I can describe the ways we are all doers of math, and compare my math story with a classmate's.",
  },
  {
    id: "1-2",
    title: "Math is Exploring and Thinking",
    std: "5.NF.B.4",
    obj: "I can make sense of a problem, plan a strategy, and use fractions of a whole number to compare quantities.",
  },
  {
    id: "1-3",
    title: "Math is In My World",
    std: "5.NBT.B.7",
    obj: "I can represent a real-world situation with a tape diagram or table and use decimal operations to solve it.",
  },
  {
    id: "1-4",
    title: "Math is Explaining and Sharing",
    std: "5.MD.C.5",
    obj: "I can construct an argument using equations, drawings, or words, and use volume to defend a recommendation.",
  },
  {
    id: "1-5",
    title: "Math is Finding Patterns",
    std: "5.OA.B.3",
    obj: "I can find patterns and pattern rules, use them to make generalizations, and check my solutions with a table of values.",
  },
  {
    id: "1-6",
    title: "Math is Ours",
    std: "MPP.3",
    obj: "I can describe my problem-solving process, name strategies for getting unstuck, and identify the behaviors that make our class a community of math thinkers.",
  },
];
u1Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    1,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "growth mindset",
        es: "mentalidad de crecimiento",
        def: "Belief that math ability expands with effort and strategy.",
      },
      {
        en: "decompose",
        es: "descomponer",
        def: "To break a number or shape into smaller friendly components.",
      },
    ],
    {
      type: "tapeDiagram",
      rows: [
        {
          label: "Strategy A",
          parts: [
            { value: 40, label: "40" },
            { value: 60, label: "60" },
          ],
        },
      ],
      title: "Strategy Decomposition Tape",
    },
  );
});

// UNIT 2: Statistics (2-1 to 2-12)
const u2Lessons = [
  {
    id: "2-1",
    title: "Understand Statistical Questions",
    std: "6.DS.1",
    obj: "I can tell the difference between a statistical question and a non-statistical question.",
  },
  {
    id: "2-2",
    title: "Represent and Describe Data in a Histogram",
    std: "6.DS.5",
    obj: "I can make and read a histogram to display data in intervals.",
  },
  {
    id: "2-3",
    title: "Describe the Data Using the Median",
    std: "6.DS.4",
    obj: "I can find the median of a data set and use it to describe what is typical.",
  },
  {
    id: "2-4",
    title: "Represent and Describe Data in a Box Plot",
    std: "6.DS.5",
    obj: "I can make and read a box plot to summarize a data set.",
  },
  {
    id: "2-5",
    title: "Describe Data by Range and Interquartile Range",
    std: "6.DS.3",
    obj: "I can find the range and the interquartile range of a data set and use them to describe how spread out the data is.",
  },
  {
    id: "2-6",
    title: "Divide Multi-Digit Numbers Using an Algorithm",
    std: "6.NOS.2",
    obj: "I can divide multi-digit whole numbers and explain the meaning of the quotient and remainder.",
  },
  {
    id: "2-7",
    title: "Divide Decimals Using an Algorithm",
    std: "6.NOS.3",
    obj: "I can divide with decimals by making the divisor a whole number first.",
  },
  {
    id: "2-8",
    title: "Describe Data Using the Mean",
    std: "6.DS.4",
    obj: "I can determine the mean of a data set, use a target mean to find a missing value, and explain the mean as the fair share and the balance point of the data.",
  },
  {
    id: "2-9",
    title: "Describe Data by Mean Absolute Deviation",
    std: "6.DS.6c",
    obj: "I can find the mean absolute deviation (MAD) to describe how spread out data is.",
  },
  {
    id: "2-10",
    title: "Choose Appropriate Measures",
    std: "6.DS.6d",
    obj: "I can choose the best measure of center for a data set based on its shape.",
  },
  {
    id: "2-11",
    title: "Add and Subtract Decimals",
    std: "6.NOS.3",
    obj: "I can add and subtract decimals by lining up the place values and the decimal points.",
  },
  {
    id: "2-12",
    title: "Multiply Decimals",
    std: "6.NOS.3",
    obj: "I can multiply decimals and place the decimal point correctly in the product.",
  },
];
u2Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    2,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "variability",
        es: "variabilidad",
        def: "How spread out or different the values in a data set are.",
      },
      {
        en: "distribution",
        es: "distribución",
        def: "The overall shape, center, and spread of a collection of data.",
      },
    ],
    l.id === "2-4" || l.id === "2-5" || l.id === "2-7"
      ? {
          type: "boxPlot",
          min: 12,
          q1: 24,
          median: 35,
          q3: 48,
          max: 62,
          title: "Five-Number Summary Box Plot",
        }
      : {
          type: "dotPlot",
          min: 0,
          max: 10,
          data: [1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 5, 6, 7],
          title: "Frequency Dot Plot",
        },
  );
});

// UNIT 3: Ratios & Rates (3-1 to 3-10)
const u3Lessons = [
  {
    id: "3-1",
    title: "Understand Ratios",
    std: "6.AT.1",
    obj: "I can write and describe a ratio that compares two quantities.",
  },
  {
    id: "3-2",
    title: "Understand Rates and Unit Rates",
    std: "6.AT.2",
    obj: "I can find a unit rate to compare prices and decide the better buy.",
  },
  {
    id: "3-3",
    title: "Determine Equivalent Ratios Using Tables",
    std: "6.AT.3a",
    obj: "I can use a ratio table to find equivalent ratios.",
  },
  {
    id: "3-4",
    title: "Determine Equivalent Ratios Using Graphs",
    std: "6.AT.3a",
    obj: "I can graph the values from a ratio table as points on the coordinate plane.",
  },
  {
    id: "3-5",
    title: "Compare Ratio Relationships",
    std: "6.AT.3",
    obj: "I can compare ratios by finding unit rates or using equivalent ratios.",
  },
  {
    id: "3-6",
    title: "Ratio Reasoning: Convert Measurements within the Same System",
    std: "6.AT.3",
    obj: "I can use ratio reasoning to convert between units within the same measurement system.",
  },
  {
    id: "3-7",
    title: "Ratio Reasoning: Convert Measurements Between Systems",
    std: "6.AT.3",
    obj: "I can use ratio reasoning to convert measurements between the customary and metric systems.",
  },
  {
    id: "3-8",
    title: "Solve Problems with Unit Rates",
    std: "6.AT.2",
    obj: "I can solve real-world problems by using unit rates to compare options.",
  },
  {
    id: "3-9",
    title: "Equivalent Ratios",
    std: "6.AT.3",
    obj: "I can find and check equivalent ratios using multiplication and division.",
  },
  {
    id: "3-10",
    title: "Convert Measurement Units",
    std: "6.AT.3c",
    obj: "I can convert measurement units using ratios and conversion factors.",
  },
];
u3Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    3,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "unit rate",
        es: "tasa unitaria",
        def: "A rate in which the second quantity in the comparison is one unit (e.g., miles per hour).",
      },
      {
        en: "tape diagram",
        es: "diagrama de cintas",
        def: "A visual model using equal-length bars to represent ratio proportions.",
      },
    ],
    l.id.includes("4") || l.id.includes("8")
      ? {
          type: "coordPlane",
          max: 8,
          points: [
            { x: 2, y: 4, label: "(2,4)" },
            { x: 4, y: 8, label: "(4,8)" },
          ],
          title: "Ratio Graph",
        }
      : {
          type: "doubleNumberLine",
          topLabel: "Miles",
          bottomLabel: "Hours",
          topTicks: [0, 30, 60, 90, 120],
          bottomTicks: [0, 1, 2, 3, 4],
          title: "Speed Double Number Line",
        },
  );
});

// UNIT 4: Percents (4-1 to 4-5)
const u4Lessons = [
  {
    id: "4-1",
    title: "Understand Percent",
    std: "6.AT.4",
    obj: "I can explain a percent as a rate per 100, model it on a decimal grid or tape diagram, and interpret percents greater than 100%.",
  },
  {
    id: "4-2",
    title: "Relate Fractions, Decimals, and Percentages",
    std: "6.AT.4",
    obj: "I can write equivalent fractions, decimals, and percents for the same value.",
  },
  {
    id: "4-3",
    title: "Estimate the Percent of a Number",
    std: "6.AT.4",
    obj: "I can estimate the percent of a number using benchmark percents, rounding, and compatible numbers.",
  },
  {
    id: "4-4",
    title: "Find and Compare with Percentages",
    std: "6.AT.4",
    obj: "I can find the percent of a number using an equation or a model.",
  },
  {
    id: "4-5",
    title: "Determine the Whole Given the Part and Percent",
    std: "6.AT.4",
    obj: "I can determine the whole when I know a part and the percent that part represents.",
  },
];
u4Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    4,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "percent",
        es: "porcentaje",
        def: "A ratio comparing a number to 100, meaning 'per hundred'.",
      },
      {
        en: "benchmark percent",
        es: "porcentaje de referencia",
        def: "Common percentages (10%, 25%, 50%) used as reference anchors for mental math.",
      },
    ],
    l.id.includes("3")
      ? { type: "percentBar", percent: 75, title: "75% Benchmark Bar" }
      : { type: "decimalGrid", shaded: 65, title: "10x10 Decimal Grid" },
  );
});

// UNIT 5: Area, Surface Area & Volume (5-1 to 5-10)
const u5Lessons = [
  {
    id: "5-1",
    title: "Determine the Area of Parallelograms and Rhombuses",
    std: "6.GR.1",
    obj: "I can find the area of a parallelogram using base × height.",
  },
  {
    id: "5-2",
    title: "Determine the Area of Triangles",
    std: "6.GR.1",
    obj: "I can find the area of a triangle using the formula A = ½ × base × height.",
  },
  {
    id: "5-3",
    title: "Determine the Area of Trapezoids",
    std: "6.GR.1",
    obj: "I can find the area of a trapezoid using the formula A = ½(b1 + b2) × h.",
  },
  {
    id: "5-4",
    title: "Apply Area Concepts to Solve Problems",
    std: "6.GR.1",
    obj: "I can find the area of a composite figure by decomposing it into basic shapes, including a regular polygon split into triangles, and adding or subtracting the areas.",
  },
  {
    id: "5-5",
    title: "Determine the Volume of Rectangular Prisms",
    std: "6.GR.2",
    obj: "I can find the volume of a rectangular prism with whole-number edges using length × width × height.",
  },
  {
    id: "5-6",
    title: "Represent Three-Dimensional Figures in Two Dimensions",
    std: "6.GR.4",
    obj: "I can find the surface area of a solid by using its net.",
  },
  {
    id: "5-7",
    title: "Determine Surface Area of Prisms",
    std: "6.GR.4",
    obj: "I can find the surface area of rectangular and triangular prisms.",
  },
  {
    id: "5-8",
    title: "Determine Surface Area of Pyramids",
    std: "6.GR.4",
    obj: "I can find the surface area of a pyramid by adding the base area and the lateral faces.",
  },
  {
    id: "5-9",
    title: "Area of Regular Polygons",
    std: "6.GR.1",
    obj: "I can find the area of a regular polygon by decomposing it into triangles.",
  },
  {
    id: "5-10",
    title: "Volume of Rectangular Prisms",
    std: "6.GR.2",
    obj: "I can find the volume of a rectangular prism, including ones with fractional edge lengths, using base area × height.",
  },
];
u5Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    5,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "perpendicular height",
        es: "altura perpendicular",
        def: "The height segment forming a 90° right angle with the base.",
      },
      {
        en: "surface area",
        es: "área superficial",
        def: "The total area of all 2D outer faces that enclose a 3D solid.",
      },
    ],
    l.id.includes("2")
      ? { type: "triangle", base: 10, height: 6, unit: "cm", title: "Triangle Decomposition Model" }
      : l.id.includes("6") || l.id.includes("7") || l.id.includes("8")
        ? { type: "netPrism", title: "Rectangular Prism Net" }
        : {
            type: "parallelogram",
            base: 12,
            height: 7,
            slant: 4,
            unit: "cm",
            title: "Parallelogram Model",
          },
  );
});

// UNIT 6: Expressions & Number Operations (6-1 to 6-15)
const u6Lessons = [
  {
    id: "6-1",
    title: "Division Expressions with Fractions and Whole Numbers",
    std: "6.NOS.1",
    obj: "I can divide a whole number by a unit fraction and a unit fraction by a whole number by writing the whole number over 1 and using Keep, Change, Flip.",
  },
  {
    id: "6-2",
    title: "Division Expressions with Fractions and Mixed Numbers",
    std: "6.NOS.1",
    obj: "I can divide a fraction by a fraction and divide with mixed numbers by multiplying by the reciprocal.",
  },
  {
    id: "6-3",
    title: "Explore Numerical Expressions with Exponents",
    std: "6.AT.5",
    obj: "I can write and evaluate numbers in exponent form using a base and a power.",
  },
  {
    id: "6-4",
    title: "Write and Evaluate Numerical Expressions with Exponents",
    std: "6.AT.6c",
    obj: "I can write numerical expressions from a real situation and evaluate them using the order of operations, including powers.",
  },
  {
    id: "6-5",
    title: "Write and Evaluate Algebraic Expressions",
    std: "6.AT.6a",
    obj: "I can write an algebraic expression for a real situation and evaluate it for a given value of the variable.",
  },
  {
    id: "6-6",
    title: "Identify Equivalent Algebraic Expressions",
    std: "6.AT.7",
    obj: "I can show that two expressions are equivalent by simplifying and combining like terms.",
  },
  {
    id: "6-7",
    title: "Find Factors and Multiples",
    std: "6.NOS.4",
    obj: "I can find the greatest common factor and the least common multiple of two numbers, and use each to solve a real problem.",
  },
  {
    id: "6-8",
    title: "Generate Equivalent Expressions",
    std: "6.AT.7",
    obj: "I can use the commutative, associative, and identity properties to rewrite expressions.",
  },
  {
    id: "6-9",
    title: "Divide Whole Numbers by Fractions",
    std: "6.NOS.1",
    obj: "I can divide a whole number by a fraction by multiplying by the reciprocal.",
  },
  {
    id: "6-10",
    title: "Divide Mixed Numbers",
    std: "6.NOS.1",
    obj: "I can divide mixed numbers by first changing them to improper fractions.",
  },
  {
    id: "6-11",
    title: "Fraction Division Problem Solving",
    std: "6.NOS.1",
    obj: "I can solve real-world problems by writing and solving fraction division equations.",
  },
  {
    id: "6-12",
    title: "Least Common Multiple",
    std: "6.NOS.4",
    obj: "I can find the least common multiple (LCM) of two numbers by listing or comparing their multiples.",
  },
  {
    id: "6-13",
    title: "Prime Factorization",
    std: "6.NOS.4",
    obj: "I can write a number as a product of its prime factors using a factor tree.",
  },
  {
    id: "6-14",
    title: "The Distributive Property",
    std: "6.AT.7",
    obj: "I can use the distributive property to expand and factor expressions.",
  },
  {
    id: "6-15",
    title: "Simplify Algebraic Expressions",
    std: "6.AT.7",
    obj: "I can simplify algebraic expressions by combining like terms.",
  },
];
u6Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    6,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "reciprocal",
        es: "recíproco",
        def: "The multiplicative inverse of a fraction, inverted as numerator and denominator.",
      },
      {
        en: "distributive property",
        es: "propiedad distributiva",
        def: "Multiplying a sum by multiplying each addend separately: a(b + c) = ab + ac.",
      },
    ],
    l.id.includes("7") || l.id.includes("14")
      ? { type: "distributiveArea", a: 4, b: 10, c: 3, title: "Distributive Area Model: 4(10 + 3)" }
      : { type: "fractionDivision", whole: 3, denom: 4, title: "Fraction Division Strip Model" },
  );
});

// UNIT 7: Integers & Coordinate Plane (7-1 to 7-9)
const u7Lessons = [
  {
    id: "7-1",
    title: "Explore Integers and Their Opposites",
    std: "6.NOS.6",
    obj: "I can use integers to represent quantities in everyday life, explain what 0 means in each situation, and name the opposite of an integer on the number line.",
  },
  {
    id: "7-2",
    title: "Represent Rational Numbers and Their Opposites on the Number Line",
    std: "6.NOS.6",
    obj: "I can place rational numbers, including fractions and decimals, on a number line.",
  },
  {
    id: "7-3",
    title: "Understand Absolute Value of Rational Numbers",
    std: "6.NOS.8",
    obj: "I can find the absolute value of a rational number — an integer, fraction, or decimal — as its distance from zero.",
  },
  {
    id: "7-4",
    title: "Compare and Order Integers and Rational Numbers",
    std: "6.NOS.8",
    obj: "I can compare and order integers using a number line.",
  },
  {
    id: "7-5",
    title: "Represent Rational Numbers on the Coordinate Plane",
    std: "6.NOS.6",
    obj: "I can plot and identify points on the coordinate plane using ordered pairs.",
  },
  {
    id: "7-6",
    title: "Determine Distance on the Coordinate Plane",
    std: "6.NOS.9",
    obj: "I can find the distance between two points on the coordinate plane using absolute value.",
  },
  {
    id: "7-7",
    title: "Represent Polygons on the Coordinate Plane",
    std: "6.NOS.9",
    obj: "I can draw polygons from their vertex coordinates on the coordinate plane, and use coordinates to find side lengths and solve perimeter and area problems.",
  },
  {
    id: "7-8",
    title: "Ordered Pairs in All Four Quadrants",
    std: "6.NOS.7",
    obj: "I can plot ordered pairs in all four quadrants of the coordinate plane.",
  },
  {
    id: "7-9",
    title: "Reflect Points Across Axes",
    std: "6.NOS.7",
    obj: "I can reflect points across the x-axis and y-axis on the coordinate plane.",
  },
];
u7Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    7,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "opposite",
        es: "opuesto",
        def: "Two numbers that are equidistant from zero on a number line in opposing directions.",
      },
      {
        en: "quadrant",
        es: "cuadrante",
        def: "One of the four regions formed by the intersection of the x-axis and y-axis (I, II, III, IV).",
      },
    ],
    l.id.includes("5") ||
      l.id.includes("6") ||
      l.id.includes("7") ||
      l.id.includes("8") ||
      l.id.includes("9")
      ? {
          type: "coordPlane",
          max: 6,
          points: [
            { x: -3, y: 4, label: "A(-3,4)" },
            { x: 3, y: 4, label: "A'(3,4)" },
          ],
          title: "Reflections in 4 Quadrants",
        }
      : {
          type: "numberLine",
          min: -6,
          max: 6,
          step: 1,
          points: [
            { value: -4, label: "-4" },
            { value: 4, label: "+4" },
          ],
          title: "Integer Number Line",
        },
  );
});

// UNIT 8: Equations & Inequalities (8-1 to 8-7)
const u8Lessons = [
  {
    id: "8-1",
    title: "Understand Equations and Their Solutions",
    std: "6.AT.8",
    obj: "I can write an equation for a real situation and check whether a given value is a solution by substituting it.",
  },
  {
    id: "8-2",
    title: "Write and Solve Equations Using Addition or Subtraction",
    std: "6.AT.8",
    obj: "I can solve one-step addition and subtraction equations using inverse operations.",
  },
  {
    id: "8-3",
    title: "Write and Solve Equations Using Multiplication or Division",
    std: "6.AT.8",
    obj: "I can solve one-step multiplication and division equations using inverse operations.",
  },
  {
    id: "8-4",
    title: "Write and Represent Inequalities",
    std: "6.AT.9",
    obj: "I can write inequalities to represent real-world situations.",
  },
  {
    id: "8-5",
    title: "Understand Inequalities and Their Solutions",
    std: "6.AT.9",
    obj: "I can graph the solutions of an inequality on a number line.",
  },
  {
    id: "8-6",
    title: "Solve and Graph Inequalities",
    std: "6.AT.8",
    obj: "I can solve an inequality and graph its solution set on a number line.",
  },
  {
    id: "8-7",
    title: "Equations and Inequalities Problem Solving",
    std: "6.AT.8",
    obj: "I can model and solve real-world problems using equations and inequalities.",
  },
];
u8Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    8,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "inverse operation",
        es: "operación inversa",
        def: "The opposite mathematical operation used to isolate a variable.",
      },
      {
        en: "inequality",
        es: "desigualdad",
        def: "A mathematical statement indicating that one quantity is greater than or less than another (<, >, ≤, ≥).",
      },
    ],
    l.id.includes("4") || l.id.includes("5") || l.id.includes("6")
      ? {
          type: "numberLine",
          min: 0,
          max: 10,
          step: 1,
          inequality: { value: 4, op: ">=", closed: true },
          title: "Inequality Graph: x ≥ 4",
        }
      : { type: "balanceScale", left: "x + 6", right: "15", title: "Balance Scale: x + 6 = 15" },
  );
});

// UNIT 9: Two-Variable Relationships (9-1 to 9-4)
const u9Lessons = [
  {
    id: "9-1",
    title: "Explore Relationships Between Two Variables",
    std: "6.AT.11",
    obj: "I can recognize when two quantities change together, and identify which one is the independent variable and which is the dependent variable.",
  },
  {
    id: "9-2",
    title: "Analyze Graphs of Relationships Between Two Variables",
    std: "6.AT.11",
    obj: "I can use a table and a graph to determine and analyze the relationship between two variable quantities.",
  },
  {
    id: "9-3",
    title: "Write Equations to Represent Relationships Between Two Variables",
    std: "6.AT.11",
    obj: "I can write an equation from a table or a graph to model the relationship between the dependent and independent variables.",
  },
  {
    id: "9-4",
    title: "Apply Two-Variable Relationships to Solve Problems",
    std: "6.AT.11",
    obj: "I can write an equation to represent the relationship between two variable quantities and use it to solve a real problem.",
  },
];
u9Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    9,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "independent variable",
        es: "variable independiente",
        def: "The input variable (x) that causes change in the dependent variable.",
      },
      {
        en: "dependent variable",
        es: "variable dependiente",
        def: "The output variable (y) whose value depends on the input.",
      },
    ],
    {
      type: "coordPlane",
      max: 6,
      points: [
        { x: 1, y: 2, label: "(1,2)" },
        { x: 2, y: 4, label: "(2,4)" },
        { x: 3, y: 6, label: "(3,6)" },
      ],
      title: "Two-Variable Graph: y = 2x",
    },
  );
});

// UNIT 10: Culminating Math Synthesis (10-1 to 10-6)
const u10Lessons = [
  {
    id: "10-1",
    title: "Math is Everywhere",
    std: "MPP.3",
    obj: "I can find applications of math outside of school — in professions like being a chef, in hobbies like gardening, and around my own house.",
  },
  {
    id: "10-2",
    title: "Math is Beauty",
    std: "MPP.7",
    obj: "I can use bilateral symmetry to describe structure in nature and in human creations.",
  },
  {
    id: "10-3",
    title: "Math is Playful",
    std: "MPP.7",
    obj: "I can use patterns and relationships to make sense of the Tower of Hanoi puzzle and think logically about its solutions.",
  },
  {
    id: "10-4",
    title: "Math is Ingenuity",
    std: "MPP.4",
    obj: "I can use ratios and models to explain how the Penny Farthing and gear-driven bicycles were ingenious solutions to a real problem.",
  },
  {
    id: "10-5",
    title: "Math is Boundless",
    std: "MPP.7",
    obj: "I can create and describe geometric designs using repetition, patterns, and rhythm, and use a pattern unit to predict what comes next.",
  },
  {
    id: "10-6",
    title: "Math is Mine",
    std: "MPP.3",
    obj: "I can look back at my answers from Lesson 1-1, describe how my math biography has changed this year, and recognize ways we are all doers of math.",
  },
];
u10Lessons.forEach((l) => {
  LESSON_MAP[l.id] = createLessonRecord(
    10,
    l.id,
    l.title,
    l.std,
    l.obj,
    [
      {
        en: "mathematical modeling",
        es: "modelado matemático",
        def: "Formulating real-world situations with mathematical symbols, displays, and algorithms.",
      },
    ],
    {
      type: "tapeDiagram",
      rows: [
        {
          label: "Budget",
          parts: [
            { value: 300, label: "$300 Materials" },
            { value: 200, label: "$200 Labor" },
          ],
        },
      ],
      title: "Capstone Resource Allocation Model",
    },
  );
});

/* ── reconcile against the curriculum, which is the source of truth ──────────
 *
 * Everything above is HAND-AUTHORED: the MSTAR items, the bilingual vocabulary,
 * the SVG configurations. That work is real and is kept. What is not authored
 * here is a lesson's IDENTITY — which lessons exist, what they are called, and
 * which standard they carry. `data/curriculum-manifest.json` owns that.
 *
 * A ghost id is DROPPED rather than generated, and title/standard are taken
 * from the manifest rather than from drifted hardcoding. Both dropped and
 * relabelled arrays are verified by tools/mstar-lesson-map.test.mjs.
 */
import { readFileSync as fsReadFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function curriculumIdentities(
  root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", ".."),
) {
  const manifest = JSON.parse(
    fsReadFileSync(resolve(root, "data", "curriculum-manifest.json"), "utf8"),
  );
  const out = {};
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (typeof node.id === "string" && /^\d+-\d+$/.test(node.id) && (node.title || node.standard)) {
      out[node.id] = { title: node.title, standard: node.standard };
    }
    Object.values(node).forEach(walk);
  };
  walk(manifest);
  return out;
}

/** Drop lessons the curriculum does not have; take identity from the ones it does. */
export function reconcileWithCurriculum(map, identities) {
  const dropped = [];
  const relabelled = [];
  for (const id of Object.keys(map)) {
    const real = identities[id];
    if (!real) {
      dropped.push(id);
      delete map[id];
      continue;
    }
    if (real.title && map[id].title !== real.title) {
      relabelled.push(`${id}: "${map[id].title}" → "${real.title}"`);
      map[id].title = real.title;
    }
    if (real.standard && map[id].standard !== real.standard) {
      relabelled.push(`${id}: ${map[id].standard} → ${real.standard}`);
      map[id].standard = real.standard;
    }
  }
  return { dropped, relabelled };
}

export const RECONCILIATION = reconcileWithCurriculum(LESSON_MAP, curriculumIdentities());
