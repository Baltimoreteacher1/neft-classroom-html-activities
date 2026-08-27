/**
 * lesson-data-map.mjs — Comprehensive 84-Lesson Curriculum Catalog & MSTAR Item Database
 *
 * Full coverage across all 10 Units (84 Lessons) with standards, objectives, bilingual vocabulary,
 * MSTAR EBSR, Multi-Select, Type II Error Analysis with Rubric, and SVG configurations.
 */

export const UNITS = [
  { id: "unit-1", num: 1, title: "Math Is...", cluster: "MPP", count: 6 },
  { id: "unit-2", num: 2, title: "Statistics", cluster: "6.DS", count: 12 },
  { id: "unit-3", num: 3, title: "Ratios & Rates", cluster: "6.RP / 6.AT", count: 7 },
  { id: "unit-4", num: 4, title: "Percents", cluster: "6.RP.3c", count: 7 },
  { id: "unit-5", num: 5, title: "Area, Surface Area & Volume", cluster: "6.G", count: 10 },
  {
    id: "unit-6",
    num: 6,
    title: "Expressions & Number Operations",
    cluster: "6.EE / 6.NS",
    count: 8,
  },
  { id: "unit-7", num: 7, title: "Integers & Coordinate Plane", cluster: "6.NS", count: 11 },
  { id: "unit-8", num: 8, title: "Equations & Inequalities", cluster: "6.EE", count: 7 },
  { id: "unit-9", num: 9, title: "Two-Variable Relationships", cluster: "6.EE.9", count: 4 },
  { id: "unit-10", num: 10, title: "Culminating Math Practices", cluster: "MPP", count: 2 },
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
    obj: "I can describe the ways we are all doers of math and compare my math story with a classmate's.",
  },
  {
    id: "1-2",
    title: "Math is Exploring and Thinking",
    std: "5.NF.B.4",
    obj: "I can make sense of a problem, plan a strategy, and use fractions of a whole number to compare quantities.",
  },
  {
    id: "1-3",
    title: "Math is in My World",
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
    obj: "I can describe my problem-solving process, name strategies for getting unstuck, and identify community thinking moves.",
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
    title: "Display Data in Dot Plots",
    std: "6.DS.4",
    obj: "I can display numerical data in plots on a number line, including dot plots.",
  },
  {
    id: "2-3",
    title: "Display Data in Histograms",
    std: "6.DS.4",
    obj: "I can group continuous data into intervals and display frequencies in histograms.",
  },
  {
    id: "2-4",
    title: "Mean as Fair Share & Balance",
    std: "6.DS.2",
    obj: "I can calculate the mean and explain it as the fair-share balance point of a distribution.",
  },
  {
    id: "2-5",
    title: "Median and Mode",
    std: "6.DS.2",
    obj: "I can find the median and mode of a data set and describe what they represent.",
  },
  {
    id: "2-6",
    title: "Interquartile Range (IQR)",
    std: "6.DS.3",
    obj: "I can divide data into quartiles and calculate the IQR to describe the spread of the middle 50%.",
  },
  {
    id: "2-7",
    title: "Display Data in Box Plots",
    std: "6.DS.4",
    obj: "I can construct and interpret a five-number summary box-and-whisker plot.",
  },
  {
    id: "2-8",
    title: "Mean Absolute Deviation (MAD)",
    std: "6.DS.3",
    obj: "I can calculate the MAD to measure the average distance of data points from the mean.",
  },
  {
    id: "2-9",
    title: "Choose Appropriate Measures",
    std: "6.DS.5",
    obj: "I can choose between mean/MAD and median/IQR based on data symmetry and outliers.",
  },
  {
    id: "2-10",
    title: "Describe Distributions",
    std: "6.DS.2",
    obj: "I can describe the overall shape of a data distribution (peaks, clusters, gaps, skew).",
  },
  {
    id: "2-11",
    title: "Outliers & Data Impact",
    std: "6.DS.5",
    obj: "I can identify outliers and explain their impact on measures of center and spread.",
  },
  {
    id: "2-12",
    title: "Statistical Investigations",
    std: "6.DS.5",
    obj: "I can summarize and analyze a full data set to draw evidence-based conclusions.",
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
    l.id === "2-7"
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

// UNIT 3: Ratios & Rates (3-1 to 3-7)
const u3Lessons = [
  {
    id: "3-1",
    title: "Understand Ratios",
    std: "6.RP.1",
    obj: "I can write and describe a ratio comparing two quantities.",
  },
  {
    id: "3-2",
    title: "Represent Ratios with Tables",
    std: "6.RP.3a",
    obj: "I can make tables of equivalent ratios and find missing values using multiplicative reasoning.",
  },
  {
    id: "3-3",
    title: "Represent Ratios with Tape Diagrams",
    std: "6.RP.3",
    obj: "I can use tape diagrams to solve multi-step part-to-part and part-to-whole ratio problems.",
  },
  {
    id: "3-4",
    title: "Represent Ratios on Coordinate Planes",
    std: "6.RP.3a",
    obj: "I can plot pairs of values from a ratio table on a coordinate grid.",
  },
  {
    id: "3-5",
    title: "Understand Unit Rates",
    std: "6.RP.2",
    obj: "I can calculate and interpret a unit rate a/b associated with a ratio a:b.",
  },
  {
    id: "3-6",
    title: "Compare Rates & Best Buys",
    std: "6.RP.3b",
    obj: "I can solve unit rate pricing problems to determine the better buy.",
  },
  {
    id: "3-7",
    title: "Convert Measurement Units with Ratios",
    std: "6.RP.3d",
    obj: "I can use ratio reasoning and conversion factors to convert measurement units.",
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
    l.id.includes("4")
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

// UNIT 4: Percents (4-1 to 4-7)
const u4Lessons = [
  {
    id: "4-1",
    title: "Understand Percent",
    std: "6.RP.3c",
    obj: "I can explain a percent as a rate per 100 on a 10x10 decimal grid.",
  },
  {
    id: "4-2",
    title: "Fractions, Decimals, and Percents",
    std: "6.RP.3c",
    obj: "I can convert flexibly among fractions, decimals, and percents.",
  },
  {
    id: "4-3",
    title: "Benchmark Percents (10%, 25%, 50%)",
    std: "6.RP.3c",
    obj: "I can use mental math and benchmark percent bars to find parts of a whole.",
  },
  {
    id: "4-4",
    title: "Find the Percent of a Number",
    std: "6.RP.3c",
    obj: "I can find a percent of a quantity as a rate per 100.",
  },
  {
    id: "4-5",
    title: "Find the Whole Given the Part & Percent",
    std: "6.RP.3c",
    obj: "I can solve problems finding the whole, given a part and the percent.",
  },
  {
    id: "4-6",
    title: "Percents Greater Than 100% and Less Than 1%",
    std: "6.RP.3c",
    obj: "I can model and solve problems with percents greater than 100% or less than 1%.",
  },
  {
    id: "4-7",
    title: "Real-World Percent Applications",
    std: "6.RP.3c",
    obj: "I can solve multi-step discount, tax, and tip problems using percent equations.",
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
    title: "Area of Parallelograms",
    std: "6.G.1",
    obj: "I can find the area of a parallelogram using base × perpendicular height.",
  },
  {
    id: "5-2",
    title: "Area of Triangles",
    std: "6.G.1",
    obj: "I can compose triangles into parallelograms and find area using 1/2 × b × h.",
  },
  {
    id: "5-3",
    title: "Area of Trapezoids",
    std: "6.G.1",
    obj: "I can decompose trapezoids into rectangles and triangles to calculate area.",
  },
  {
    id: "5-4",
    title: "Area of Composite Polygons",
    std: "6.G.1",
    obj: "I can find the area of complex composite figures by decomposing them into simple polygons.",
  },
  {
    id: "5-5",
    title: "Polygons on the Coordinate Plane",
    std: "6.G.3",
    obj: "I can draw polygons in the coordinate plane and find side lengths using coordinates.",
  },
  {
    id: "5-6",
    title: "Nets of Prisms and Pyramids",
    std: "6.G.4",
    obj: "I can represent 3D polyhedra using 2D flattened nets.",
  },
  {
    id: "5-7",
    title: "Surface Area of Rectangular Prisms",
    std: "6.G.4",
    obj: "I can find the surface area of rectangular prisms by calculating the sum of face areas.",
  },
  {
    id: "5-8",
    title: "Surface Area of Triangular Prisms",
    std: "6.G.4",
    obj: "I can calculate total surface area using triangular prism net decompositions.",
  },
  {
    id: "5-9",
    title: "Volume of Prisms with Fractional Edges",
    std: "6.G.2",
    obj: "I can find the volume of a right rectangular prism with fractional edge lengths using V = lwh.",
  },
  {
    id: "5-10",
    title: "Geometric Design & Spatial Modeling",
    std: "6.G.1-4",
    obj: "I can apply area, surface area, and volume to solve real-world architectural design problems.",
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
      : l.id.includes("6") || l.id.includes("7")
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

// UNIT 6: Expressions & Number Operations (6-1 to 6-8)
const u6Lessons = [
  {
    id: "6-1",
    title: "Divide Whole Numbers by Fractions",
    std: "6.NS.1",
    obj: "I can divide a whole number by a fraction using measurement visual models.",
  },
  {
    id: "6-2",
    title: "Divide Fractions by Fractions",
    std: "6.NS.1",
    obj: "I can compute quotients of fractions and explain the standard reciprocal algorithm.",
  },
  {
    id: "6-3",
    title: "Multi-Digit Decimal Operations",
    std: "6.NS.3",
    obj: "I can fluently add, subtract, multiply, and divide multi-digit decimals using the standard algorithms.",
  },
  {
    id: "6-4",
    title: "Exponents & Powers",
    std: "6.EE.1",
    obj: "I can write and evaluate numerical expressions involving whole-number exponents.",
  },
  {
    id: "6-5",
    title: "Order of Operations",
    std: "6.EE.1",
    obj: "I can evaluate numerical expressions using the standard order of operations.",
  },
  {
    id: "6-6",
    title: "Write Algebraic Expressions",
    std: "6.EE.2a",
    obj: "I can translate verbal phrases into algebraic expressions with variables and constants.",
  },
  {
    id: "6-7",
    title: "Distributive Property with Area Models",
    std: "6.EE.3",
    obj: "I can apply the distributive property to generate equivalent algebraic expressions using rectangular area models.",
  },
  {
    id: "6-8",
    title: "Identify Equivalent Expressions",
    std: "6.EE.4",
    obj: "I can prove whether two algebraic expressions are equivalent using properties of operations.",
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
    l.id.includes("7")
      ? { type: "distributiveArea", a: 4, b: 10, c: 3, title: "Distributive Area Model: 4(10 + 3)" }
      : { type: "fractionDivision", whole: 3, denom: 4, title: "Fraction Division Strip Model" },
  );
});

// UNIT 7: Integers & Coordinate Plane (7-1 to 7-11)
const u7Lessons = [
  {
    id: "7-1",
    title: "Understand Integers & Opposites",
    std: "6.NS.5",
    obj: "I can use positive and negative integers to represent quantities in real-world contexts.",
  },
  {
    id: "7-2",
    title: "Compare and Order Integers",
    std: "6.NS.7a",
    obj: "I can interpret statements of inequality as the relative position of two numbers on a number line.",
  },
  {
    id: "7-3",
    title: "Absolute Value as Distance",
    std: "6.NS.7c",
    obj: "I can explain absolute value as the non-negative distance of a number from zero on a number line.",
  },
  {
    id: "7-4",
    title: "Compare Absolute Values in Real-World Contexts",
    std: "6.NS.7d",
    obj: "I can distinguish comparisons of absolute value from statements about order (e.g., debt vs magnitude).",
  },
  {
    id: "7-5",
    title: "Graph Points in Four Quadrants",
    std: "6.NS.6c",
    obj: "I can plot and locate ordered pairs across all four quadrants of the coordinate plane.",
  },
  {
    id: "7-6",
    title: "Reflections Across Axes",
    std: "6.NS.6b",
    obj: "I can determine how reflecting a point across the x-axis or y-axis affects the signs of its coordinates.",
  },
  {
    id: "7-7",
    title: "Distance Between Points on the Coordinate Plane",
    std: "6.NS.8",
    obj: "I can find vertical and horizontal distances between points sharing an x- or y-coordinate using absolute value.",
  },
  {
    id: "7-8",
    title: "Coordinate Plane Maps and Navigation",
    std: "6.NS.8",
    obj: "I can model real-world navigation and perimeter paths on coordinate grids.",
  },
  {
    id: "7-9",
    title: "Rational Numbers on the Number Line",
    std: "6.NS.6a",
    obj: "I can position positive and negative fractions and decimals on horizontal and vertical number lines.",
  },
  {
    id: "7-10",
    title: "Coordinate Transformations & Symmetry",
    std: "6.NS.6b",
    obj: "I can analyze geometric symmetry and reflections of polygons across coordinate axes.",
  },
  {
    id: "7-11",
    title: "Integer Investigations & Contextual Synthesis",
    std: "6.NS.5-8",
    obj: "I can solve complex multi-step problems integrating integers, absolute value, and coordinate geometry.",
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
    l.id.includes("5") || l.id.includes("6") || l.id.includes("7")
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
    title: "Write and Solve 1-Step Addition/Subtraction Equations",
    std: "6.EE.7",
    obj: "I can write and solve one-step addition and subtraction equations using inverse operations.",
  },
  {
    id: "8-2",
    title: "Write and Solve 1-Step Multiplication/Division Equations",
    std: "6.EE.7",
    obj: "I can solve one-step multiplication and division equations and verify balance.",
  },
  {
    id: "8-3",
    title: "Equations with Decimals and Fractions",
    std: "6.EE.7",
    obj: "I can solve one-step equations involving rational numbers with precision.",
  },
  {
    id: "8-4",
    title: "Understand Solutions of Equations",
    std: "6.EE.5",
    obj: "I can test whether a given value is a solution by substituting it into the equation.",
  },
  {
    id: "8-5",
    title: "Write and Graph Inequalities (x > c, x <= c)",
    std: "6.EE.8",
    obj: "I can write an inequality to represent a constraint and graph its infinite solutions on a number line.",
  },
  {
    id: "8-6",
    title: "Interpret Inequalities in Context",
    std: "6.EE.8",
    obj: "I can explain the meaning of inequality solutions in real-world scenarios (e.g., speed limits, budgets).",
  },
  {
    id: "8-7",
    title: "Equation & Inequality Modeling Studio",
    std: "6.EE.5-8",
    obj: "I can formulate and solve systems of equations and inequalities representing engineering constraints.",
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
    l.id.includes("5") || l.id.includes("6")
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
    title: "Independent & Dependent Variables",
    std: "6.EE.9",
    obj: "I can identify independent and dependent variables in real-world situations.",
  },
  {
    id: "9-2",
    title: "Represent Relationships with Tables and Equations",
    std: "6.EE.9",
    obj: "I can write equations in the form y = kx or y = x + b to model two-variable relationships.",
  },
  {
    id: "9-3",
    title: "Graph Two-Variable Relationships",
    std: "6.EE.9",
    obj: "I can graph relationships from a table and equation on the coordinate plane.",
  },
  {
    id: "9-4",
    title: "Tri-Modal Representation Studio",
    std: "6.EE.9",
    obj: "I can translate seamlessly among verbal rules, tables, equations, and graphs.",
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

// UNIT 10: Culminating Math Synthesis (10-1 to 10-2)
const u10Lessons = [
  {
    id: "10-1",
    title: "Mathematical Modeling Capstone",
    std: "MPP.1-8",
    obj: "I can apply Grade 6 math standards to solve a multi-step real-world optimization project.",
  },
  {
    id: "10-2",
    title: "Comprehensive Performance & Defense",
    std: "MPP.1-8",
    obj: "I can defend mathematical decisions using equations, graphs, error critiques, and precise written arguments.",
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
 * which standard they carry. `data/curriculum-manifest.json` owns that, and
 * this file had drifted from it badly enough to be dangerous:
 *
 *   - 4 lessons in the list do not exist. Unit 4 ends at 4-5 and Unit 7 at 7-9,
 *     but the list carried 4-6, 4-7, 7-10 and 7-11. A run on 2026-08-27 wrote
 *     16 worksheet files into eight `lessons/<ghost>-group{1,2}/` folders that
 *     had no config.json, and five gates then crashed on the missing file.
 *   - 62 of the remaining 68 named the WRONG title and the WRONG standard.
 *     The list still describes the pre-2026-08-10 numbering: it calls 2-6
 *     "Interquartile Range (IQR)" under 6.DS.3, while lesson 2-6 is "Divide
 *     Multi-Digit Numbers Using an Algorithm" under 6.NOS.2. Both id spaces are
 *     \d+-\d+, so every lookup HITS and returns a different lesson's identity.
 *
 * The shipped worksheets were unharmed only because they are written by
 * scripts/generate-worksheets.mjs, which reads the lesson configs. This engine
 * is not wired into package.json, so the damage was latent — one manual run
 * from relabelling 62 worksheets with another lesson's title and standard.
 * That is the same failure `validate:lesson-catalogues` exists for, and a
 * comment asking the next person to remember is not a fix.
 *
 * So: a ghost id is DROPPED rather than generated, and title/standard are taken
 * from the manifest rather than from the list. A drifted entry cannot mislabel
 * a worksheet, and a lesson the curriculum has never heard of cannot be written
 * to disk at all. tools/mstar-lesson-map.test.mjs holds both properties.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export function curriculumIdentities(
  root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", ".."),
) {
  const manifest = JSON.parse(
    readFileSync(resolve(root, "data", "curriculum-manifest.json"), "utf8"),
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
