/* The Overnight Loop — synthetic data + misconception taxonomy.
 * PRIVACY: All data is synthetic and anonymized. No real student names or PII.
 * Students are labeled "Student A".."Student X". No external calls. */

// Grade 6 strands (Reveal Math / CCSS).
const STRANDS = {
  RP: { code: "6.RP", name: "Ratios & Proportions", color: "#1fa6a2" },
  NS: { code: "6.NS", name: "The Number System", color: "#12355b" },
  EE: { code: "6.EE", name: "Expressions & Equations", color: "#f2c15b" },
  G: { code: "6.G", name: "Geometry", color: "#0f7c4a" },
  SP: { code: "6.SP", name: "Statistics & Probability", color: "#9b5de5" },
};

/* Misconception taxonomy. Each tag carries a concrete remediation bundle:
 *  - novel: a graphic-novel page concept
 *  - game:  a 60-second mini-game concept
 *  - practice: a short targeted practice set (3 items + focus)
 * All tied directly to the misconception. */
const MISCONCEPTIONS = {
  rp_additive_thinking: {
    strand: "RP",
    label: "Treats ratios additively instead of multiplicatively",
    detail:
      "Scales a recipe of 2:3 by adding the same number to both terms (2+4 : 3+4) instead of multiplying.",
    novel: {
      title: "The Smoothie Stand Showdown",
      page: "A two-panel page: Panel 1, twins double a 2-cup-to-3-cup smoothie recipe and (wrongly) add 4 to each, tasting it sour. Panel 2, the recipe ghost shows that doubling means x2 on BOTH parts (4:6), with a side-by-side taste-test payoff.",
    },
    game: {
      title: "Tip the Scale (60s)",
      desc: "A balance scale shows a target ratio. Tap to add tiles to each pan; only multiplicative moves keep it balanced. Adding equal amounts visibly tips the scale red. Beat the timer by balancing 5 ratios.",
    },
    practice: {
      focus: "Scale ratios by multiplying both terms by the same factor.",
      items: [
        "A paint mix is 2 blue : 5 white. Make 3 batches. How much of each?",
        "If 4 pens cost $6, what do 12 pens cost? Show the x3.",
        "True or false: 3:4 is the same ratio as 6:7. Explain why.",
      ],
    },
  },
  rp_unit_rate_invert: {
    strand: "RP",
    label: "Inverts the unit rate (divides the wrong way)",
    detail:
      "For '$12 for 4 lbs', computes 4 ÷ 12 instead of 12 ÷ 4 when asked for price per pound.",
    novel: {
      title: "The Per-Pound Detective",
      page: "Detective panel: a grocer's two price tags. The detective draws the division bar with the unit you WANT on top. Caption box reframes 'per pound' as 'dollars on top, pounds on the bottom'.",
    },
    game: {
      title: "Rate Racer (60s)",
      desc: "Cards fly by showing '$ for #lbs'. Swipe up if the dollars-per-pound makes the price cheaper than the last card, down if pricier. Forces repeated correct $÷lb setup under time pressure.",
    },
    practice: {
      focus: "Set up unit rate with the requested unit in the numerator.",
      items: [
        "$15 for 3 lbs of apples. Price per pound?",
        "A car goes 150 miles on 5 gallons. Miles per gallon?",
        "Which is the better buy: 10 oz for $2.50 or 16 oz for $3.20?",
      ],
    },
  },
  ns_divide_fractions: {
    strand: "NS",
    label:
      "Divides fractions by dividing across instead of multiplying by the reciprocal",
    detail:
      "Computes 3/4 ÷ 1/2 as (3÷1)/(4÷2) = 3/2 by accident, or forgets to flip.",
    novel: {
      title: "Flip Quest",
      page: "Adventure panel: a locked door labeled '÷ 1/2'. The key only turns when the hero FLIPS it to 'x 2/1'. Reciprocal shown as a mirror reflection of the fraction.",
    },
    game: {
      title: "Reciprocal Flip (60s)",
      desc: "A division problem appears; player taps the second fraction to flip it, then taps 'x' to convert. Wrong flips lock the gate. Clear as many gates as possible in 60 seconds.",
    },
    practice: {
      focus: "Keep-Change-Flip: multiply by the reciprocal of the divisor.",
      items: [
        "3/4 ÷ 1/2 = ? Show the flip.",
        "How many 1/3-cup scoops are in 2 cups?",
        "5/6 ÷ 2/3 = ? Simplify your answer.",
      ],
    },
  },
  ns_negative_ordering: {
    strand: "NS",
    label: "Orders negative numbers as if they were positive",
    detail:
      "Claims -7 > -3 because 7 > 3; misreads position on the number line.",
    novel: {
      title: "Below the Surface",
      page: "Submarine panel: depths of -3 m and -7 m. The sub at -7 is clearly DEEPER (lower) than -3. Number-line overlay shows -7 sits farther left, so it is LESS.",
    },
    game: {
      title: "Deep Dive (60s)",
      desc: "Integers drop like bubbles onto a vertical number line. Tap them in order from least to greatest (deepest first). Negatives that are 'big' positives trap careless taps.",
    },
    practice: {
      focus: "On a number line, farther left = smaller, including negatives.",
      items: [
        "Order: -2, -9, 0, -5, 3 from least to greatest.",
        "True or false: -7 > -3. Explain using a number line.",
        "Which is colder: -10°F or -4°F?",
      ],
    },
  },
  ee_distribute: {
    strand: "EE",
    label: "Distributes only to the first term",
    detail: "Expands 3(x + 4) as 3x + 4 instead of 3x + 12.",
    novel: {
      title: "The Doorway Rule",
      page: "Panel: the 3 is a hand that must shake EVERY person walking through the parentheses door. It high-fives x AND the 4. Missing one breaks the equation bridge.",
    },
    game: {
      title: "Distribute Defender (60s)",
      desc: "Expressions like a(b+c) march toward a wall. Tap each inner term to 'spread' the multiplier; the wall holds only when BOTH terms are hit. Survive 60 seconds of waves.",
    },
    practice: {
      focus:
        "Multiply the outside factor by every term inside the parentheses.",
      items: [
        "Expand 3(x + 4).",
        "Expand 5(2y - 1).",
        "Find the error: 2(a + 6) = 2a + 6. Fix it.",
      ],
    },
  },
  ee_equation_inverse: {
    strand: "EE",
    label: "Uses the wrong inverse operation when solving",
    detail:
      "Solves x + 5 = 12 by adding 5 instead of subtracting; doesn't isolate the variable.",
    novel: {
      title: "Undo Island",
      page: "Panel: a treasure chest locked by '+5'. To open, the hero must perform the UNDO (-5) on both sides of a seesaw, keeping it level. Visual: balance scale staying even.",
    },
    game: {
      title: "Balance Keeper (60s)",
      desc: "A two-pan balance shows an equation. Drag the inverse operation onto BOTH pans to isolate x. Doing it to one side tips the scale and costs time. Solve 6 equations to win.",
    },
    practice: {
      focus:
        "Apply the inverse operation to both sides to isolate the variable.",
      items: [
        "Solve x + 5 = 12.",
        "Solve 4n = 20.",
        "Solve y - 7 = 3 and check your answer.",
      ],
    },
  },
  g_area_perimeter: {
    strand: "G",
    label: "Confuses area with perimeter",
    detail:
      "Adds side lengths when asked for area, or multiplies when asked for perimeter.",
    novel: {
      title: "Fence vs. Sod",
      page: "Panel: a backyard. The FENCE wraps the edges (perimeter, add the sides). The SOD covers the inside (area, length x width). Two characters argue, then split the job correctly.",
    },
    game: {
      title: "Cover or Wrap (60s)",
      desc: "A shape appears with a job card: 'Wrap it' (perimeter) or 'Cover it' (area). Choose the right tool and tiles before the timer; covering needs square tiles, wrapping needs edge strips.",
    },
    practice: {
      focus: "Perimeter = add the edges; Area = space inside (units squared).",
      items: [
        "A rectangle is 8 by 3. Find its area AND its perimeter.",
        "You need a fence around a garden. Area or perimeter?",
        "A square has area 36. What is the length of one side?",
      ],
    },
  },
  g_volume_units: {
    strand: "G",
    label: "Uses wrong units / counts faces instead of cubes for volume",
    detail:
      "Reports volume in square units, or counts surface faces instead of filling with unit cubes.",
    novel: {
      title: "Fill the Tank",
      page: "Panel: a fish tank filling with unit cubes layer by layer. A thought bubble corrects 'cubic units, not square'. Layers x height shown stacking up.",
    },
    game: {
      title: "Cube Stacker (60s)",
      desc: "Fill a rectangular prism by stacking layers of unit cubes. Tap to add a full layer; report total in cubic units. Wrong unit label (square) bounces back. Fill 5 tanks.",
    },
    practice: {
      focus: "Volume = length x width x height, labeled in cubic units.",
      items: [
        "A box is 4 x 2 x 3. Find its volume.",
        "Why is volume measured in cubic units, not square?",
        "A cube is 5 units on each edge. Find the volume.",
      ],
    },
  },
  sp_mean_median: {
    strand: "SP",
    label: "Confuses mean and median; doesn't account for outliers",
    detail:
      "Reports the middle value as the 'average', or includes an extreme outlier without noticing it skews the mean.",
    novel: {
      title: "The Outlier in the Room",
      page: "Panel: a class of allowance amounts where one kid has $500. The MEAN jumps; the MEDIAN stays calm. Two thpermometer-style meters show how the outlier yanks the mean.",
    },
    game: {
      title: "Center Hunt (60s)",
      desc: "A dot plot appears; choose whether MEAN or MEDIAN best describes the center given the shape. Skewed data with an outlier rewards picking median. Score across 8 datasets.",
    },
    practice: {
      focus:
        "Mean = balance point (sensitive to outliers); Median = middle value.",
      items: [
        "Find the mean and median of: 3, 4, 4, 5, 50.",
        "Which center is more fair for that data set? Why?",
        "A set is 10, 12, 11, 13, 12. Find the median.",
      ],
    },
  },
  sp_graph_misread: {
    strand: "SP",
    label: "Misreads scale on graphs (ignores interval size)",
    detail:
      "Reads each gridline as +1 when the scale jumps by 5 or 10; misreports bar/dot values.",
    novel: {
      title: "Mind the Gap",
      page: "Panel: a bar graph where the y-axis jumps by 10s. A character counts gridlines as 1s and gets fooled; a guide shows reading the LABELS, not the lines.",
    },
    game: {
      title: "Scale Spy (60s)",
      desc: "A bar chart flashes with a hidden scale (by 2s, 5s, 10s). Player must read a bar's true value before it fades. Mis-scaled guesses cost time. Read 8 charts.",
    },
    practice: {
      focus: "Always check the axis interval before reading a value.",
      items: [
        "On a graph scaled by 5s, a bar reaches the 4th line. What value?",
        "Why can a graph 'look' bigger if it starts at 50 instead of 0?",
        "A dot plot scaled by 2s shows a dot at the 3rd mark. Value?",
      ],
    },
  },
};

/* Severity scale per (student, misconception): 0 none, 1 emerging, 2 needs support, 3 priority. */
const STUDENTS = [
  {
    id: "Student A",
    scores: {
      rp_additive_thinking: 3,
      ns_divide_fractions: 1,
      ee_distribute: 2,
    },
  },
  { id: "Student B", scores: { ns_negative_ordering: 3, sp_graph_misread: 2 } },
  {
    id: "Student C",
    scores: {
      ee_equation_inverse: 3,
      ee_distribute: 2,
      rp_unit_rate_invert: 1,
    },
  },
  { id: "Student D", scores: { g_area_perimeter: 3, g_volume_units: 2 } },
  { id: "Student E", scores: { sp_mean_median: 3, sp_graph_misread: 1 } },
  {
    id: "Student F",
    scores: { rp_additive_thinking: 2, rp_unit_rate_invert: 3 },
  },
  { id: "Student G", scores: { ns_divide_fractions: 3, ee_distribute: 1 } },
  { id: "Student H", scores: { ee_distribute: 3, ee_equation_inverse: 2 } },
  { id: "Student I", scores: { g_volume_units: 3, g_area_perimeter: 1 } },
  { id: "Student J", scores: { sp_graph_misread: 3, sp_mean_median: 2 } },
  {
    id: "Student K",
    scores: { rp_unit_rate_invert: 2, ns_negative_ordering: 2 },
  },
  { id: "Student L", scores: { ns_negative_ordering: 3 } },
  { id: "Student M", scores: { ee_equation_inverse: 3 } },
  { id: "Student N", scores: { rp_additive_thinking: 3, sp_mean_median: 1 } },
  { id: "Student O", scores: { g_area_perimeter: 2, g_volume_units: 3 } },
  {
    id: "Student P",
    scores: { ns_divide_fractions: 2, rp_unit_rate_invert: 2 },
  },
  { id: "Student Q", scores: { sp_mean_median: 3, ns_negative_ordering: 1 } },
  { id: "Student R", scores: { ee_distribute: 2, ee_equation_inverse: 3 } },
  { id: "Student S", scores: { rp_additive_thinking: 1, g_area_perimeter: 3 } },
  { id: "Student T", scores: { sp_graph_misread: 2, sp_mean_median: 2 } },
  { id: "Student U", scores: { ns_divide_fractions: 3 } },
  { id: "Student V", scores: { rp_unit_rate_invert: 3, ee_distribute: 1 } },
  { id: "Student W", scores: { g_volume_units: 2, sp_graph_misread: 2 } },
  {
    id: "Student X",
    scores: { ee_equation_inverse: 2, ns_negative_ordering: 3 },
  },
];

window.OvernightData = {
  generated: "Thu Jun 19, 2026",
  STRANDS,
  MISCONCEPTIONS,
  STUDENTS,
};
