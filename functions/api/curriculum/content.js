/* =============================================================================
 * Curriculum Content API — Cloudflare Pages Function
 * Endpoint: GET /api/curriculum/content
 * Returns full Grade 6 Math Curriculum structure (10 Units, 74 Lessons).
 * Serves dynamic content from D1 database (env.DB) if populated, or complete
 * canonical fallback schema when D1 database is initializing.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=300, s-maxage=1200",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export async function onRequestGet(context) {
  const { env } = context;

  // 1. Try reading from Cloudflare D1 database if bound
  if (env && env.DB) {
    try {
      const rows = await env.DB.prepare(
        "SELECT unit_id, unit_num, unit_name, unit_blurb, lessons_json FROM curriculum_units ORDER BY unit_id ASC",
      ).all();

      if (rows && Array.isArray(rows.results) && rows.results.length > 0) {
        const units = rows.results.map((r) => {
          let lessons = [];
          try {
            lessons = JSON.parse(r.lessons_json || "[]");
          } catch (_e) {
            lessons = [];
          }
          return {
            id: r.unit_id,
            num: r.unit_num || `Unit ${r.unit_id}`,
            name: r.unit_name || "",
            blurb: r.unit_blurb || "",
            lessons: lessons,
          };
        });
        return json({ ok: true, source: "d1", units });
      }
    } catch (_err) {
      // D1 query failed or table missing -> fall through to canonical schema below
    }
  }

  // 2. Canonical Complete 10-Unit Grade 6 Math Curriculum Schema Fallback
  const canonicalUnits = [
    {
      id: 1,
      num: "Unit 1",
      name: "Numerical Expressions & Factors",
      blurb: "Prime factorization, GCF, LCM, order of operations, decimals, long division.",
      lessons: [
        { id: "1-1", num: "Lesson 1.1", title: "Prime Factorization", std: "6.NS.B.4", obj: "Write composite numbers as products of prime factors using factor trees.", resources: [{ text: "Interactive Activity", href: "/lessons/1-1/", type: "activity" }] },
        { id: "1-1-flagship", num: "Lesson 1.1 Flagship", title: "Prime Factorization Escape Lab", std: "6.NS.B.4", obj: "Master prime factor decomposition to unlock escape lab challenges.", resources: [{ text: "Interactive Activity", href: "/lessons/1-1-flagship/", type: "activity" }] },
        { id: "1-2", num: "Lesson 1.2", title: "Greatest Common Factor (GCF)", std: "6.NS.B.4", obj: "Determine the GCF of two whole numbers up to 100.", resources: [{ text: "Interactive Activity", href: "/lessons/1-2/", type: "activity" }] },
        { id: "1-3", num: "Lesson 1.3", title: "Least Common Multiple (LCM)", std: "6.NS.B.4", obj: "Find the LCM of numbers to solve schedule synchronization problems.", resources: [{ text: "Interactive Activity", href: "/lessons/1-3/", type: "activity" }] },
        { id: "1-4", num: "Lesson 1.4", title: "Long Division with Whole Numbers", std: "6.NS.B.2", obj: "Fluently divide multi-digit numbers using standard algorithm.", resources: [{ text: "Interactive Activity", href: "/lessons/1-4/", type: "activity" }] },
        { id: "1-5", num: "Lesson 1.5", title: "Decimal Addition & Subtraction", std: "6.NS.B.3", obj: "Fluently add and subtract multi-digit decimals.", resources: [{ text: "Interactive Activity", href: "/lessons/1-5/", type: "activity" }] },
        { id: "1-6", num: "Lesson 1.6", title: "Decimal Multiplication", std: "6.NS.B.3", obj: "Fluently multiply multi-digit decimals using standard algorithm.", resources: [{ text: "Interactive Activity", href: "/lessons/1-6/", type: "activity" }] },
        { id: "1-7", num: "Lesson 1.7", title: "Decimal Division", std: "6.NS.B.3", obj: "Divide multi-digit decimals fluently.", resources: [{ text: "Interactive Activity", href: "/lessons/1-7/", type: "activity" }] },
      ],
    },
    {
      id: 2,
      num: "Unit 2",
      name: "Fractions & Decimals",
      blurb: "Fraction division, mixed numbers, reciprocal reasoning, decimal modeling.",
      lessons: [
        { id: "2-1", num: "Lesson 2.1", title: "Fractions by Whole Numbers", std: "6.NS.A.1", obj: "Interpret and compute quotients of fractions and whole numbers.", resources: [{ text: "Interactive Activity", href: "/lessons/2-1/", type: "activity" }] },
        { id: "2-1-flagship", num: "Lesson 2.1 Flagship", title: "Fraction Detective Case File", std: "6.NS.A.1", obj: "Apply visual fraction division models to solve mystery cases.", resources: [{ text: "Interactive Activity", href: "/lessons/2-1-flagship/", type: "activity" }] },
        { id: "2-2", num: "Lesson 2.2", title: "Dividing Fractions by Fractions", std: "6.NS.A.1", obj: "Compute quotients of fractions by multiplying by the reciprocal.", resources: [{ text: "Interactive Activity", href: "/lessons/2-2/", type: "activity" }] },
        { id: "2-3", num: "Lesson 2.3", title: "Dividing Mixed Numbers", std: "6.NS.A.1", obj: "Convert mixed numbers to improper fractions and compute quotients.", resources: [{ text: "Interactive Activity", href: "/lessons/2-3/", type: "activity" }] },
        { id: "2-4", num: "Lesson 2.4", title: "Fraction Division Word Problems", std: "6.NS.A.1", obj: "Solve real-world story problems involving fraction division.", resources: [{ text: "Interactive Activity", href: "/lessons/2-4/", type: "activity" }] },
        { id: "2-5", num: "Lesson 2.5", title: "Fraction Operation Escape Room", std: "6.NS.A.1", obj: "Synthesize fraction operations to solve complex multi-step tasks.", resources: [{ text: "Interactive Activity", href: "/lessons/2-5/", type: "activity" }] },
      ],
    },
    {
      id: 3,
      num: "Unit 3",
      name: "Ratios & Rates",
      blurb: "Ratios, double number lines, ratio tables, unit rates, equivalent ratios.",
      lessons: [
        { id: "3-1", num: "Lesson 3.1", title: "Understanding Ratios", std: "6.RP.A.1", obj: "Understand the concept of a ratio and use ratio language.", resources: [{ text: "Interactive Activity", href: "/lessons/3-1/", type: "activity" }] },
        { id: "3-1-flagship", num: "Lesson 3.1 Flagship", title: "Culinary Ratio Challenge Room", std: "6.RP.A.1", obj: "Design custom recipes using precise ratio relationships.", resources: [{ text: "Interactive Activity", href: "/lessons/3-1-flagship/", type: "activity" }] },
        { id: "3-2", num: "Lesson 3.2", title: "Ratio Tables & Double Number Lines", std: "6.RP.A.3.A", obj: "Make tables of equivalent ratios and plot pairs of values.", resources: [{ text: "Interactive Activity", href: "/lessons/3-2/", type: "activity" }] },
        { id: "3-3", num: "Lesson 3.3", title: "Graphing Ratio Relationships", std: "6.RP.A.3.A", obj: "Represent ratio tables on coordinate planes.", resources: [{ text: "Interactive Activity", href: "/lessons/3-3/", type: "activity" }] },
        { id: "3-4", num: "Lesson 3.4", title: "Equivalent Ratios", std: "6.RP.A.3", obj: "Compare ratios to determine equivalence.", resources: [{ text: "Interactive Activity", href: "/lessons/3-4/", type: "activity" }] },
        { id: "3-5", num: "Lesson 3.5", title: "Comparing Ratios & Rates", std: "6.RP.A.2", obj: "Understand unit rate a/b associated with ratio a:b.", resources: [{ text: "Interactive Activity", href: "/lessons/3-5/", type: "activity" }] },
        { id: "3-6", num: "Lesson 3.6", title: "Ratio Reasoning Choice Board", std: "6.RP.A.3", obj: "Apply multiple ratio representations to solve complex scenarios.", resources: [{ text: "Interactive Activity", href: "/lessons/3-6/", type: "activity" }] },
        { id: "3-7", num: "Lesson 3.7", title: "Ratio Problem-Solving Case File", std: "6.RP.A.3", obj: "Solve real-world ratio case files using tables and tape diagrams.", resources: [{ text: "Interactive Activity", href: "/lessons/3-7/", type: "activity" }] },
      ],
    },
    {
      id: 4,
      num: "Unit 4",
      name: "Percents & Conversions",
      blurb: "Unit rates, price comparisons, percent of a number, measurement conversion.",
      lessons: [
        { id: "4-1", num: "Lesson 4.1", title: "Unit Rates & Price Comparisons", std: "6.RP.A.2", obj: "Solve unit rate problems including unit pricing and constant speed.", resources: [{ text: "Interactive Activity", href: "/lessons/4-1/", type: "activity" }] },
        { id: "4-1-flagship", num: "Lesson 4.1 Flagship", title: "Arcade Builder Escape Room", std: "6.RP.A.2", obj: "Optimize unit rate calculations to construct arcade games.", resources: [{ text: "Interactive Activity", href: "/lessons/4-1-flagship/", type: "activity" }] },
        { id: "4-2", num: "Lesson 4.2", title: "Understanding Percents", std: "6.RP.A.3.C", obj: "Find a percent of a quantity as a rate per 100.", resources: [{ text: "Interactive Activity", href: "/lessons/4-2/", type: "activity" }] },
        { id: "4-3", num: "Lesson 4.3", title: "Fractions, Decimals, & Percents", std: "6.RP.A.3.C", obj: "Convert fluently between fractions, decimals, and percents.", resources: [{ text: "Interactive Activity", href: "/lessons/4-3/", type: "activity" }] },
        { id: "4-4", num: "Lesson 4.4", title: "Finding the Percent of a Number", std: "6.RP.A.3.C", obj: "Solve problems finding the percent of a whole quantity.", resources: [{ text: "Interactive Activity", href: "/lessons/4-4/", type: "activity" }] },
        { id: "4-5", num: "Lesson 4.5", title: "Finding the Whole Given a Percent", std: "6.RP.A.3.C", obj: "Determine the total whole given a part and its percentage.", resources: [{ text: "Interactive Activity", href: "/lessons/4-5/", type: "activity" }] },
        { id: "4-6", num: "Lesson 4.6", title: "Measurement Conversions", std: "6.RP.A.3.D", obj: "Use ratio reasoning to convert measurement units.", resources: [{ text: "Interactive Activity", href: "/lessons/4-6/", type: "activity" }] },
        { id: "4-7", num: "Lesson 4.7", title: "Percent Applications & Discounts", std: "6.RP.A.3.C", obj: "Calculate discounts, taxes, and tips in shopping scenarios.", resources: [{ text: "Interactive Activity", href: "/lessons/4-7/", type: "activity" }] },
      ],
    },
    {
      id: 5,
      num: "Unit 5",
      name: "Algebraic Expressions",
      blurb: "Exponents, writing expressions, evaluating expressions, properties of operations.",
      lessons: [
        { id: "5-1", num: "Lesson 5.1", title: "Whole-Number Exponents", std: "6.EE.A.1", obj: "Write and evaluate numerical expressions involving whole-number exponents.", resources: [{ text: "Interactive Activity", href: "/lessons/5-1/", type: "activity" }] },
        { id: "5-2", num: "Lesson 5.2", title: "Writing Algebraic Expressions", std: "6.EE.A.2.A", obj: "Write expressions that record operations with numbers and letters.", resources: [{ text: "Interactive Activity", href: "/lessons/5-2/", type: "activity" }] },
        { id: "5-3", num: "Lesson 5.3", title: "Evaluating Expressions", std: "6.EE.A.2.C", obj: "Evaluate expressions at specific values of their variables.", resources: [{ text: "Interactive Activity", href: "/lessons/5-3/", type: "activity" }] },
        { id: "5-3-flagship", num: "Lesson 5.3 Flagship", title: "Algebraic Balance Scale Lab", std: "6.EE.A.2.C", obj: "Use visual balance scales to evaluate and simplify algebraic terms.", resources: [{ text: "Interactive Activity", href: "/lessons/5-3-flagship/", type: "activity" }] },
        { id: "5-4", num: "Lesson 5.4", title: "Equivalent Expressions & Distributive Property", std: "6.EE.A.3", obj: "Apply the distributive property to generate equivalent expressions.", resources: [{ text: "Interactive Activity", href: "/lessons/5-4/", type: "activity" }] },
        { id: "5-5", num: "Lesson 5.5", title: "Combining Like Terms", std: "6.EE.A.4", obj: "Identify when two expressions are equivalent by combining like terms.", resources: [{ text: "Interactive Activity", href: "/lessons/5-5/", type: "activity" }] },
      ],
    },
    {
      id: 6,
      num: "Unit 6",
      name: "Equations & Inequalities",
      blurb: "One-variable equations, inverse operations, word problems, inequalities.",
      lessons: [
        { id: "6-1", num: "Lesson 6.1", title: "Solutions of Equations", std: "6.EE.B.5", obj: "Understand solving an equation as a process of answering a question.", resources: [{ text: "Interactive Activity", href: "/lessons/6-1/", type: "activity" }] },
        { id: "6-1-flagship", num: "Lesson 6.1 Flagship", title: "Equation Quest Adventure", std: "6.EE.B.5", obj: "Solve one-step equations to navigate the adventure map.", resources: [{ text: "Interactive Activity", href: "/lessons/6-1-flagship/", type: "activity" }] },
        { id: "6-2", num: "Lesson 6.2", title: "Addition & Subtraction Equations", std: "6.EE.B.7", obj: "Solve real-world problems by writing and solving x + p = q.", resources: [{ text: "Interactive Activity", href: "/lessons/6-2/", type: "activity" }] },
        { id: "6-3", num: "Lesson 6.3", title: "Multiplication & Division Equations", std: "6.EE.B.7", obj: "Solve real-world problems by writing and solving px = q.", resources: [{ text: "Interactive Activity", href: "/lessons/6-3/", type: "activity" }] },
        { id: "6-4", num: "Lesson 6.4", title: "Writing & Graphing Inequalities", std: "6.EE.B.8", obj: "Write an inequality x > c or x < c to represent a constraint.", resources: [{ text: "Interactive Activity", href: "/lessons/6-4/", type: "activity" }] },
        { id: "6-5", num: "Lesson 6.5", title: "Solving One-Step Inequalities", std: "6.EE.B.8", obj: "Solve inequalities and graph solution sets on number lines.", resources: [{ text: "Interactive Activity", href: "/lessons/6-5/", type: "activity" }] },
        { id: "6-6", num: "Lesson 6.6", title: "Independent & Dependent Variables", std: "6.EE.C.9", obj: "Represent and analyze quantitative relationships between variables.", resources: [{ text: "Interactive Activity", href: "/lessons/6-6/", type: "activity" }] },
        { id: "6-7", num: "Lesson 6.7", title: "Equations & Graphs", std: "6.EE.C.9", obj: "Analyze the relationship between dependent and independent variables using graphs.", resources: [{ text: "Interactive Activity", href: "/lessons/6-7/", type: "activity" }] },
      ],
    },
    {
      id: 7,
      num: "Unit 7",
      name: "Rational Numbers & Coordinate Plane",
      blurb: "Integers, absolute value, coordinate plane 4 quadrants, distance.",
      lessons: [
        { id: "7-1", num: "Lesson 7.1", title: "Understanding Positive & Negative Numbers", std: "6.NS.C.5", obj: "Use positive and negative numbers to represent quantities in real-world contexts.", resources: [{ text: "Interactive Activity", href: "/lessons/7-1/", type: "activity" }] },
        { id: "7-1-flagship", num: "Lesson 7.1 Flagship", title: "Cartesian Odyssey 4-Quadrant Mission", std: "6.NS.C.8", obj: "Navigate all 4 quadrants of the coordinate plane to complete exploration objectives.", resources: [{ text: "Interactive Activity", href: "/lessons/7-1-flagship/", type: "activity" }] },
        { id: "7-2", num: "Lesson 7.2", title: "Rational Numbers on the Number Line", std: "6.NS.C.6.C", obj: "Find and position integers and other rational numbers on a number line.", resources: [{ text: "Interactive Activity", href: "/lessons/7-2/", type: "activity" }] },
        { id: "7-3", num: "Lesson 7.3", title: "Comparing & Ordering Rational Numbers", std: "6.NS.C.7.A", obj: "Interpret statements of inequality as statements about the relative position of numbers.", resources: [{ text: "Interactive Activity", href: "/lessons/7-3/", type: "activity" }] },
        { id: "7-4", num: "Lesson 7.4", title: "Absolute Value & Real-World Magnitude", std: "6.NS.C.7.C", obj: "Understand the absolute value of a rational number as its distance from 0.", resources: [{ text: "Interactive Activity", href: "/lessons/7-4/", type: "activity" }] },
        { id: "7-5", num: "Lesson 7.5", title: "The 4-Quadrant Coordinate Plane", std: "6.NS.C.6.C", obj: "Find and position pairs of integers on a coordinate plane.", resources: [{ text: "Interactive Activity", href: "/lessons/7-5/", type: "activity" }] },
        { id: "7-6", num: "Lesson 7.6", title: "Distance on the Coordinate Plane", std: "6.NS.C.8", obj: "Solve real-world problems by graphing points and calculating side lengths.", resources: [{ text: "Interactive Activity", href: "/lessons/7-6/", type: "activity" }] },
        { id: "7-7", num: "Lesson 7.7", title: "Polygons on the Coordinate Plane", std: "6.G.A.3", obj: "Draw polygons in the coordinate plane given coordinates for the vertices.", resources: [{ text: "Interactive Activity", href: "/lessons/7-7/", type: "activity" }] },
      ],
    },
    {
      id: 8,
      num: "Unit 8",
      name: "Area & Surface Area",
      blurb: "Parallelograms, triangles, composite figures, nets, surface area.",
      lessons: [
        { id: "8-1", num: "Lesson 8.1", title: "Area of Parallelograms", std: "6.G.A.1", obj: "Find the area of right triangles, other triangles, special quadrilaterals.", resources: [{ text: "Interactive Activity", href: "/lessons/8-1/", type: "activity" }] },
        { id: "8-1-flagship", num: "Lesson 8.1 Flagship", title: "World Architect Surface Lab", std: "6.G.A.4", obj: "Design 3D structures and compute total surface area using 2D nets.", resources: [{ text: "Interactive Activity", href: "/lessons/8-1-flagship/", type: "activity" }] },
        { id: "8-2", num: "Lesson 8.2", title: "Area of Triangles", std: "6.G.A.1", obj: "Decompose polygons into triangles and rectangles to calculate area.", resources: [{ text: "Interactive Activity", href: "/lessons/8-2/", type: "activity" }] },
        { id: "8-3", num: "Lesson 8.3", title: "Area of Trapezoids & Special Quadrilaterals", std: "6.G.A.1", obj: "Find area of trapezoids by composing and decomposing shapes.", resources: [{ text: "Interactive Activity", href: "/lessons/8-3/", type: "activity" }] },
        { id: "8-4", num: "Lesson 8.4", title: "Area of Composite Figures", std: "6.G.A.1", obj: "Calculate area of irregular compound shapes in real-world contexts.", resources: [{ text: "Interactive Activity", href: "/lessons/8-4/", type: "activity" }] },
        { id: "8-5", num: "Lesson 8.5", title: "3D Nets & Prisms", std: "6.G.A.4", obj: "Represent three-dimensional figures using nets made up of rectangles and triangles.", resources: [{ text: "Interactive Activity", href: "/lessons/8-5/", type: "activity" }] },
        { id: "8-6", num: "Lesson 8.6", title: "Surface Area of Rectangular & Triangular Prisms", std: "6.G.A.4", obj: "Use nets to find the surface area of rectangular and triangular prisms.", resources: [{ text: "Interactive Activity", href: "/lessons/8-6/", type: "activity" }] },
        { id: "8-7", num: "Lesson 8.7", title: "Volume of Rectangular Prisms with Fractional Edge Lengths", std: "6.G.A.2", obj: "Find volume of rectangular prisms with fractional edge lengths.", resources: [{ text: "Interactive Activity", href: "/lessons/8-7/", type: "activity" }] },
      ],
    },
    {
      id: 9,
      num: "Unit 9",
      name: "Statistical Measures & Displays",
      blurb: "Statistical questions, mean, median, mode, IQR, MAD, box plots, dot plots.",
      lessons: [
        { id: "9-1", num: "Lesson 9.1", title: "Statistical Questions & Distributions", std: "6.SP.A.1", obj: "Recognize a statistical question as one that anticipates variability in data.", resources: [{ text: "Interactive Activity", href: "/lessons/9-1/", type: "activity" }] },
        { id: "9-1-flagship", num: "Lesson 9.1 Flagship", title: "Sports Analytics Data Lab", std: "6.SP.B.5", obj: "Collect, analyze, and display sports telemetry data to draw conclusions.", resources: [{ text: "Interactive Activity", href: "/lessons/9-1-flagship/", type: "activity" }] },
        { id: "9-2", num: "Lesson 9.2", title: "Mean & Balance Point", std: "6.SP.A.2", obj: "Understand that a set of data has a distribution described by its center.", resources: [{ text: "Interactive Activity", href: "/lessons/9-2/", type: "activity" }] },
        { id: "9-3", num: "Lesson 9.3", title: "Median & Mode", std: "6.SP.A.2", obj: "Calculate measures of center (median, mode) for numerical data.", resources: [{ text: "Interactive Activity", href: "/lessons/9-3/", type: "activity" }] },
        { id: "9-4", num: "Lesson 9.4", title: "Dot Plots & Histograms", std: "6.SP.B.4", obj: "Display numerical data in plots on a number line, including dot plots and histograms.", resources: [{ text: "Interactive Activity", href: "/lessons/9-4/", type: "activity" }] },
        { id: "9-5", num: "Lesson 9.5", title: "Box Plots & 5-Number Summary", std: "6.SP.B.4", obj: "Construct box plots using minimum, lower quartile, median, upper quartile, maximum.", resources: [{ text: "Interactive Activity", href: "/lessons/9-5/", type: "activity" }] },
        { id: "9-6", num: "Lesson 9.6", title: "Interquartile Range (IQR) & MAD", std: "6.SP.B.5.C", obj: "Summarize numerical data sets using measures of variability (IQR, MAD).", resources: [{ text: "Interactive Activity", href: "/lessons/9-6/", type: "activity" }] },
        { id: "9-7", num: "Lesson 9.7", title: "Choosing Measures of Center & Spread", std: "6.SP.B.5.D", obj: "Relate the choice of measures of center and variability to the shape of data distribution.", resources: [{ text: "Interactive Activity", href: "/lessons/9-7/", type: "activity" }] },
      ],
    },
    {
      id: 10,
      num: "Unit 10",
      name: "Cumulative Review & Capstone Projects",
      blurb: "Grade 6 math synthesis, performance tasks, culminating projects, EOY readiness.",
      lessons: [
        { id: "10-1", num: "Lesson 10.1", title: "Ratios & Rational Numbers Synthesis", std: "6.RP & 6.NS", obj: "Synthesize ratio reasoning and rational number operations.", resources: [{ text: "Interactive Activity", href: "/lessons/10-1/", type: "activity" }] },
        { id: "10-2", num: "Lesson 10.2", title: "Expressions & Equations Capstone", std: "6.EE", obj: "Apply multi-step equation solving to complex real-world situations.", resources: [{ text: "Interactive Activity", href: "/lessons/10-2/", type: "activity" }] },
        { id: "10-3", num: "Lesson 10.3", title: "Geometry & Spatial Modeling Capstone", std: "6.G", obj: "Integrate area, surface area, and volume calculations in engineering tasks.", resources: [{ text: "Interactive Activity", href: "/lessons/10-3/", type: "activity" }] },
        { id: "10-4", num: "Lesson 10.4", title: "Statistics & Data Investigation Capstone", std: "6.SP", obj: "Conduct a full statistical investigation from hypothesis to data display.", resources: [{ text: "Interactive Activity", href: "/lessons/10-4/", type: "activity" }] },
        { id: "10-5", num: "Lesson 10.5", title: "Grade 6 Math Culminating Showcase", std: "6.ALL", obj: "Present and defend mathematical solutions in the culminating project portfolio.", resources: [{ text: "Interactive Activity", href: "/lessons/10-5/", type: "activity" }] },
      ],
    },
  ];

  return json({ ok: true, source: "canonical", units: canonicalUnits });
}
