/** Original, deterministic lesson workshops. Source quantities stay inspectable. */
const bank = {};
const singular = (unit) =>
  ({ feet: "foot", inches: "inch", miles: "mile", pounds: "pound", yards: "yard" })[unit] ||
  unit.replace(/s$/, "");
const fmt = (n) => String(Number(n.toFixed(6)));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n, d) => {
  const g = gcd(n, d);
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};
const task = (prompt, answer, explanation, model, mode = "number") => ({
  prompt,
  answer: String(answer),
  explanation,
  model,
  mode,
});
const review = (prompt, answer, model) =>
  task(
    prompt,
    answer,
    "Compare the claim, the calculation, and the units. Explain the evidence that supports your conclusion.",
    model,
    "review",
  );
const table = (headers, rows) => ({ kind: "table", headers, rows });
const data = (values) => ({ kind: "data", values });
function add(id, goal, strategy, example, tasks, claim, repair, transfer, transferAnswer) {
  if (tasks.length !== 6) throw new Error(`${id}: six skill tasks required`);
  const model = example.model;
  bank[id] = {
    goal,
    strategy,
    example: { ...example, steps: example.explanation.split(" | ") },
    model,
    misconception: { claim, repair },
    tasks: [
      ...tasks,
      review(
        `A student says: “${claim}” Explain the error and correct the reasoning.`,
        repair,
        model,
      ),
      review(transfer, transferAnswer, model),
    ].map((p, i) => ({
      ...p,
      label:
        i < 2
          ? `Guided practice ${i + 1}`
          : i < 6
            ? `Practice ${i - 1}`
            : i === 6
              ? "Find & repair an error"
              : "Apply & explain",
      guidance: i < 2 ? strategy : [],
      hints: [strategy[0], strategy[1]],
      steps: [...strategy, p.explanation],
      frame:
        i === 6
          ? "The step I would change is ___ because ___. The correct reasoning is ___."
          : i === 7
            ? "I represented ___ with ___. My result means ___. I checked by ___."
            : "I used ___ because ___. I checked my answer by ___.",
      modelCaption: ["2-1", "2-10"].includes(id)
        ? "Reference model: data can vary across a group. Use the question to choose your response."
        : i >= 6
          ? "Reference model from the worked example; use it to explain the idea."
          : "Model for this problem. Read its labels before calculating.",
    })),
  };
}

// Unit 2: statistics, distributions, and division.
{
  const s = [
    "Identify the group and the measurement being collected.",
    "Decide whether different responses are expected from that group.",
    "Explain why the question does or does not anticipate variability.",
  ];
  const questions = [
    ["How many minutes do students in a class read each night?", "statistical"],
    ["How many sides does a triangle have?", "not statistical"],
    ["What are the heights of the trees in a park?", "statistical"],
    ["What is the room number of our classroom?", "not statistical"],
    ["How many pets do families in this school have?", "statistical"],
    ["What is 8 × 7?", "not statistical"],
  ];
  const m = { ...data([10, 15, 15, 20, 25]), label: "Illustrative team practice times in minutes" };
  const ex = task(
    "Is “How many minutes do members of a team practice each day?” statistical?",
    "statistical",
    "Identify team members as the group. | The measurement is daily practice time. | Different members can report different times, so the question anticipates variability.",
    m,
    "choice",
  );
  ex.options = ["statistical", "not statistical"];
  add(
    "2-1",
    "I can recognize a statistical question and explain the expected variability.",
    s,
    ex,
    questions.map(([q, a]) => ({
      ...task(
        `Classify this question: ${q}`,
        a,
        `The question ${a === "statistical" ? "collects responses that can vary across a group" : "asks for one fixed fact, rather than variable group data"}.`,
        m,
        "choice",
      ),
      options: ["statistical", "not statistical"],
    })),
    "Any question with a numerical answer is statistical.",
    "A numerical answer alone is not enough. A statistical question anticipates variability in data from a group. “What is 8 × 7?” has one fixed answer.",
    "Rewrite “How many minutes did I read yesterday?” as a statistical question. Identify the group and the measurement.",
    "Example: “How many minutes did the students in our class read yesterday?” Group: students in the class. Measurement: reading time in minutes; times can vary.",
  );
}
{
  const s = [
    "Read the interval boundaries; each value belongs in exactly one bin.",
    "Tally each data value once, then count the values in the requested bin.",
    "Check that all bin frequencies add to the size of the data set.",
  ];
  const make = (v, bin) => {
    const rows = [
      [0, 9],
      [10, 19],
      [20, 29],
    ].map(([a, b]) => [`${a}–${b}`, v.filter((x) => x >= a && x <= b).length]);
    return task(
      `Data: ${v.join(", ")}. Use whole-number bins 0–9, 10–19, 20–29. What is the frequency in ${bin === 0 ? "0–9" : bin === 1 ? "10–19" : "20–29"}?`,
      rows[bin][1],
      `Count the values in that interval. Frequencies are ${rows.map((r) => r[1]).join(", ")} and total ${v.length}.`,
      {
        kind: "histogram",
        values: v,
        bins: [
          [0, 9],
          [10, 19],
          [20, 29],
        ],
      },
    );
  };
  add(
    "2-2",
    "I can sort data into nonoverlapping intervals and interpret a histogram.",
    s,
    {
      ...make([2, 6, 12, 15, 18, 21], 1),
      explanation:
        "Use the stated whole-number intervals. | Place 12, 15, and 18 in 10–19. | Count three values: frequency 3. The other bins contain two and one values.",
    },
    [
      [[1, 5, 10, 19, 20, 29], 1],
      [[4, 8, 11, 14, 25], 0],
      [[0, 9, 10, 18, 19, 21, 24], 1],
      [[3, 7, 12, 20, 20, 28], 2],
      [[5, 10, 15, 19, 22, 26, 29], 2],
      [[1, 2, 3, 11, 12, 25], 0],
    ].map(([v, b]) => make(v, b)),
    "The value 19 belongs in both 10–19 and 20–29.",
    "These whole-number bins include their stated endpoints. Nineteen belongs only in 10–19; twenty is the first value in 20–29. Counting a value twice inflates the total.",
    "A histogram has frequencies 3, 5, and 2 for three bins. Explain what the total frequency tells you and why a bar of height 5 does not mean that every data value in that bin equals 5.",
    "There are 10 observations. A frequency of 5 counts observations within the interval; it does not give the values of those observations.",
  );
}
{
  const s = [
    "Order every value from least to greatest, keeping repeats.",
    "Count values and locate the middle position or two middle positions.",
    "For an even count, add the two middle values and divide by 2.",
  ];
  const make = (v) => {
    const ordered = [...v].sort((a, b) => a - b),
      n = v.length,
      a = n % 2 ? ordered[(n - 1) / 2] : (ordered[n / 2 - 1] + ordered[n / 2]) / 2;
    return task(
      `Find the median of ${v.join(", ")}.`,
      a,
      `Ordered: ${ordered.join(", ")}. ${n % 2 ? `The middle value is ${a}.` : `Average ${ordered[n / 2 - 1]} and ${ordered[n / 2]} to get ${a}.`}`,
      data(v),
    );
  };
  add(
    "2-3",
    "I can find and interpret the median for odd and even data sets.",
    s,
    {
      ...make([12, 4, 8, 6]),
      explanation:
        "Order the data: 4, 6, 8, 12. | There are four values, so use the second and third. | Median = (6 + 8) ÷ 2 = 7.",
    },
    [
      [9, 3, 7, 5, 11],
      [14, 6, 10, 8],
      [4, 4, 8, 10, 12],
      [2, 7, 9, 14, 20, 22],
      [18, 5, 11, 9, 15],
      [3, 6, 10, 13, 17, 21],
    ].map(make),
    "The median is always one of the original data values.",
    "With an even number of values, the median is the average of the two middle values. For 4, 6, 8, 12 it is 7, which is not an original value.",
    "Compare medians of 2, 4, 6, 8, 10 and 2, 4, 6, 8, 100. Explain what changed and what stayed the same.",
    "Both medians are 6. The largest value changes, but the middle value and its position remain the same in these particular sets.",
  );
}
const quartiles = (v) => {
  const a = [...v].sort((x, y) => x - y),
    med = (x) =>
      x.length % 2 ? x[(x.length - 1) / 2] : (x[x.length / 2 - 1] + x[x.length / 2]) / 2,
    n = a.length;
  return [
    a[0],
    med(a.slice(0, Math.floor(n / 2))),
    med(a),
    med(a.slice(Math.ceil(n / 2))),
    a[n - 1],
  ];
};
{
  const s = [
    "Order the data and find the median.",
    "Find the median of each half; exclude the middle value when the total count is odd.",
    "Place minimum, Q1, median, Q3, and maximum on the same scaled number line.",
  ];
  const arrays = [
    [2, 4, 6, 8, 10, 12, 14, 16],
    [1, 3, 5, 7, 9, 11, 13],
    [4, 6, 8, 10, 12, 14, 16, 18],
    [3, 5, 7, 9, 11, 13, 15],
    [5, 7, 9, 11, 13, 15, 17, 19],
    [2, 6, 10, 14, 18, 22, 26],
  ];
  const make = (v, k) => {
    const q = quartiles(v),
      names = ["minimum", "Q1", "median", "Q3", "maximum"];
    return task(
      `Data: ${v.join(", ")}. Find ${names[k]} for a box plot. For an odd count, exclude the overall median from both halves.`,
      q[k],
      `Five-number summary: ${q.join(", ")}. ${names[k]} = ${q[k]}.`,
      { kind: "box", values: q },
    );
  };
  add(
    "2-4",
    "I can build a box plot from an ordered five-number summary.",
    s,
    {
      ...make([2, 4, 6, 8, 10, 12, 14], 1),
      explanation:
        "The median of seven values is 8. | Lower half: 2, 4, 6; upper half: 10, 12, 14. | Q1 = 4, Q3 = 12. Summary: 2, 4, 8, 12, 14.",
    },
    arrays.map((a, i) => make(a, [1, 3, 2, 1, 3, 2][i])),
    "Each section of a box plot has the same length.",
    "Each section describes approximately a quarter of the ordered data, but its length depends on the spread of those values. Equal counts do not require equal distances.",
    "A box plot has minimum 2, Q1 5, median 9, Q3 12, maximum 20. Describe the box and the two whiskers.",
    "The box runs from 5 to 12 with a median mark at 9. Whiskers run from 2 to 5 and from 12 to 20. The right whisker is longer.",
  );
}
{
  const s = [
    "Identify the minimum and maximum for the overall spread.",
    "Identify Q1 and Q3 for the spread of the middle half.",
    "Range = maximum − minimum; IQR = Q3 − Q1. Keep those measures distinct.",
  ];
  const make = (q, iqr) =>
    task(
      `A box plot has five-number summary ${q.join(", ")} (minimum, Q1, median, Q3, maximum). Find the ${iqr ? "IQR" : "range"}.`,
      iqr ? q[3] - q[1] : q[4] - q[0],
      `${iqr ? `${q[3]} − ${q[1]}` : `${q[4]} − ${q[0]}`} = ${iqr ? q[3] - q[1] : q[4] - q[0]}.`,
      { kind: "box", values: q },
    );
  add(
    "2-5",
    "I can distinguish total spread from the spread of the middle half.",
    s,
    {
      ...make([2, 5, 8, 12, 20], true),
      explanation:
        "Read Q1 = 5 and Q3 = 12. | Subtract the lower quartile from the upper quartile. | IQR = 12 − 5 = 7; range = 20 − 2 = 18.",
    },
    [
      [[1, 4, 7, 10, 16], false],
      [[2, 6, 9, 14, 21], true],
      [[0, 3, 5, 8, 12], false],
      [[4, 8, 11, 15, 23], true],
      [[5, 7, 10, 13, 30], false],
      [[1, 9, 12, 17, 24], true],
    ].map(([q, i]) => make(q, i)),
    "IQR is maximum minus minimum.",
    "Maximum minus minimum is the range. IQR is Q3 minus Q1 and describes the middle half of the ordered data.",
    "Two groups both have range 20. Group A has Q1 = 4 and Q3 = 8; Group B has Q1 = 2 and Q3 = 14. Compare the middle halves.",
    "A has IQR 4; B has IQR 12. A has a less spread-out middle half even though their total ranges match.",
  );
}
{
  const s = [
    "Estimate the quotient and divide from the highest place value.",
    "For each place: divide, multiply, subtract, then bring down the next digit.",
    "Check: divisor × quotient + remainder = dividend; remainder is less than divisor.",
  ];
  const make = (a, b) =>
    task(
      `Compute ${a} ÷ ${b}.`,
      a / b,
      `The quotient is ${a / b}. Check: ${b} × ${a / b} = ${a}.`,
      { kind: "division", total: a, groups: b },
    );
  add(
    "2-6",
    "I can divide multi-digit whole numbers and check the quotient.",
    s,
    {
      ...make(156, 6),
      explanation:
        "Estimate: 156 is near 180, and 180 ÷ 6 = 30. | Divide 15 tens by 6: 2 tens, remainder 3 tens; bring down 6 ones to make 36. | Divide 36 by 6: 6 ones. Quotient 26; check 6 × 26 = 156.",
    },
    [
      [144, 6],
      [248, 8],
      [315, 9],
      [432, 6],
      [672, 8],
      [936, 12],
    ].map(([a, b]) => make(a, b)),
    "When 156 ÷ 6 leaves 3 after dividing the tens, the final remainder is 3.",
    "That 3 represents 3 tens. Bring down the 6 ones to make 36, then continue dividing. The quotient is 26 with remainder 0.",
    "There are 157 books. Each box holds 6 books. How many full boxes can be filled, how many books remain, and how many boxes hold all books?",
    "157 ÷ 6 = 26 remainder 1. There are 26 full boxes, 1 remaining book, and 27 boxes are needed to hold all books.",
  );
}
{
  const s = [
    "Multiply dividend and divisor by the same power of 10 to make the divisor a whole number.",
    "Divide equivalent quantities, keeping the decimal place aligned.",
    "Check by multiplication and compare with an estimate.",
  ];
  const make = (a, b) =>
    task(
      `Compute ${a} ÷ ${b}.`,
      fmt(a / b),
      `${a} ÷ ${b} = ${fmt(a / b)}. Multiply the quotient by ${b} to get ${a}.`,
      { kind: "division", total: a, groups: b },
    );
  add(
    "2-7",
    "I can divide decimals using equivalent division expressions.",
    s,
    {
      ...make(7.2, 0.6),
      explanation:
        "Multiply both values by 10. | 7.2 ÷ 0.6 = 72 ÷ 6 = 12. | Check: 12 × 0.6 = 7.2.",
    },
    [
      [4.8, 0.6],
      [12.6, 3],
      [8.4, 0.7],
      [9.6, 4],
      [15.75, 2.5],
      [3.6, 0.24],
    ].map(([a, b]) => make(a, b)),
    "To divide by 0.6, move the decimal only in the divisor.",
    "Changing only the divisor changes the quotient. Multiply both dividend and divisor by 10: 7.2 ÷ 0.6 = 72 ÷ 6 = 12.",
    "A ribbon is 5.4 meters long. Each piece is 0.9 meter. How many pieces can be cut? Explain why the answer is a count rather than a length.",
    "5.4 ÷ 0.9 = 6 pieces. The calculation counts groups of 0.9 meter within 5.4 meters.",
  );
}
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
{
  const s = [
    "Add every data value, including repeated values.",
    "Count how many observations there are.",
    "Divide the total by the count; interpret the result as a fair share.",
  ];
  const make = (v) =>
    task(
      `Find the mean of ${v.join(", ")}.`,
      fmt(mean(v)),
      `Total ${v.reduce((a, b) => a + b, 0)} ÷ ${v.length} values = ${fmt(mean(v))}.`,
      data(v),
    );
  add(
    "2-8",
    "I can find the mean and explain it as a fair share.",
    s,
    {
      ...make([4, 6, 8]),
      explanation:
        "Add: 4 + 6 + 8 = 18. | Count three observations. | Share equally: 18 ÷ 3 = 6. The mean is 6.",
    },
    [
      [2, 4, 6],
      [3, 5, 7, 9],
      [4, 4, 8, 8],
      [10, 12, 14],
      [1, 2, 5, 8],
      [6, 9, 12, 15],
    ].map(make),
    "The mean is found by dividing the total by the greatest value.",
    "Divide by the number of observations, not by a data value. For 4, 6, 8 the total is 18 and there are 3 observations, so the mean is 6.",
    "Four students collected 3, 5, 8, and 8 cans. Explain how to redistribute them so everyone has the mean number without changing the total.",
    "The total is 24 and the mean is 6. Give 3 cans to the first student and 1 to the second, taking 2 from each student with 8. Everyone has 6.",
  );
}
{
  const s = [
    "Find the mean of the data.",
    "Find each nonnegative distance from the mean.",
    "Add those distances and divide by the number of observations.",
  ];
  const make = (v) => {
    const m = mean(v),
      d = v.map((x) => Math.abs(x - m)),
      total = d.reduce((a, b) => a + b, 0),
      answer = Number.isInteger(total) ? frac(total, v.length) : fmt(mean(d));
    return task(
      `Find the mean absolute deviation (MAD) of ${v.join(", ")}. Give an exact number or fraction.`,
      answer,
      `Mean ${fmt(m)}; distances ${d.map(fmt).join(", ")}. MAD = ${fmt(total)} ÷ ${v.length} = ${answer}.`,
      data(v),
    );
  };
  add(
    "2-9",
    "I can describe spread using mean absolute deviation.",
    s,
    {
      ...make([2, 4, 6, 8]),
      explanation:
        "Mean = (2 + 4 + 6 + 8) ÷ 4 = 5. | Distances from 5 are 3, 1, 1, 3. | MAD = (3 + 1 + 1 + 3) ÷ 4 = 2.",
    },
    [
      [2, 4, 6],
      [3, 3, 7, 7],
      [4, 6, 8, 10],
      [1, 5, 9],
      [6, 6, 10, 10],
      [5, 5, 5],
    ].map(make),
    "Distances below the mean should be negative when finding MAD.",
    "Distance is nonnegative. For a mean of 5, both 2 and 8 are 3 units away. Using signed deviations would make them cancel.",
    "Groups A and B both have mean 10. A has MAD 1 and B has MAD 4. What can you conclude, and what cannot you conclude?",
    "B has a larger average distance from its mean. These two summaries do not identify every individual value, the range, or the exact shape of either distribution.",
  );
}
{
  const s = [
    "Inspect the ordered data for skew or an extreme value.",
    "Compare the mean and median; describe how the extreme value affects them.",
    "Use median and IQR for skewed data or outliers; mean and MAD can suit roughly symmetric data.",
  ];
  const sets = [
    [2, 4, 6, 8, 30],
    [4, 5, 6, 7, 8],
    [1, 2, 3, 4, 40],
    [10, 12, 14, 16, 18],
    [3, 3, 4, 5, 50],
    [6, 8, 10, 12, 14],
  ];
  const make = (v, i) =>
    task(
      `Data: ${v.join(", ")}. For summarizing center, choose ${i % 2 === 0 ? "the more resistant measure when an extreme value is present" : "the measure that uses every observation in these symmetric data"}: mean or median.`,
      i % 2 === 0 ? "median" : "mean",
      i % 2 === 0
        ? "The extreme high value pulls the mean upward; the median depends on middle positions."
        : "The data are symmetric without an extreme value; the mean uses every observation.",
      data(v),
      "choice",
    );
  add(
    "2-10",
    "I can choose and justify useful measures of center and spread.",
    s,
    {
      ...make([2, 4, 6, 8, 40], 0),
      options: ["mean", "median"],
      explanation:
        "Notice 40 is far above the other values. | Mean = 60 ÷ 5 = 12; median = 6. | Median better describes a typical value here because the extreme value pulls the mean upward.",
    },
    sets.map((v, i) => ({ ...make(v, i), options: ["mean", "median"] })),
    "A resistant median can never change when a value is removed.",
    "Resistance does not mean no change. The median of 4, 6, 7, 8, 40 is 7; removing 40 leaves 4, 6, 7, 8, with median 6.5.",
    "Two data sets have the same median and IQR. Must their means be equal? Explain using what each measure depends on.",
    "No. Median and IQR summarize middle positions. Changing an extreme value can change the total and mean while leaving these middle-position measures unchanged.",
  );
}

// Unit 3: ratio structure, rates, tables, graphs, and measurements.
{
  const s = [
    "Name the two quantities in the requested order.",
    "Count each quantity separately; decide whether the comparison is part-to-part or part-to-whole.",
    "Write a:b in that order and label what each term counts.",
  ];
  const make = (a, b, whole = false) =>
    task(
      `A collection has ${a} blue counters and ${b} gold counters. Write the ratio of blue to ${whole ? "all counters" : "gold counters"} using the original counts.`,
      `${a}:${whole ? a + b : b}`,
      `Blue count ${a}; ${whole ? "total" : "gold count"} ${whole ? a + b : b}. Order matters.`,
      { kind: "ratio", a, b },
      "review",
    );
  add(
    "3-1",
    "I can represent part-to-part and part-to-whole ratios.",
    s,
    {
      ...make(3, 5),
      explanation:
        "Count 3 blue and 5 gold counters. | The comparison asks for blue first, gold second. | Blue:gold = 3:5; blue:all = 3:8.",
    },
    [
      [2, 7, false],
      [4, 6, true],
      [5, 3, false],
      [6, 2, true],
      [3, 9, false],
      [7, 5, true],
    ].map(([a, b, w]) => make(a, b, w)),
    "With 3 blue and 5 gold counters, the blue-to-all ratio is 3:5.",
    "There are 8 counters in all. Blue:gold = 3:5, but blue:all = 3:8. The second quantity changes.",
    "A class has 12 students wearing sneakers and 8 wearing other shoes. Write sneakers:other and sneakers:all, then explain why the second terms differ.",
    "Sneakers:other = 12:8. Sneakers:all = 12:20. The whole includes both groups.",
  );
}
{
  const s = [
    "Identify the quantity you want per one unit.",
    "Divide the corresponding total by its number of units.",
    "State the unit rate with both units; multiply back to check.",
  ];
  const make = (cost, n) =>
    task(
      `${n} notebooks cost $${cost}. What is the cost in dollars per notebook? Enter the number; explain the units below.`,
      cost / n,
      `${cost} ÷ ${n} = ${cost / n} dollars per notebook.`,
      table(
        ["Notebooks", "Cost ($)"],
        [
          [n, cost],
          [1, "?"],
        ],
      ),
    );
  add(
    "3-2",
    "I can find and interpret a unit rate.",
    s,
    {
      ...make(18, 6),
      explanation:
        "The rate compares dollars to notebooks. | Divide $18 by 6 notebooks. | Unit rate = $3 per notebook; 6 × $3 = $18.",
    },
    [
      [12, 4],
      [20, 5],
      [21, 6],
      [27, 9],
      [30, 8],
      [42, 12],
    ].map(([c, n]) => make(c, n)),
    "Six notebooks for $18 means 6 ÷ 18 = $1/3 per notebook.",
    "For dollars per notebook, divide dollars by notebooks: 18 ÷ 6 = 3. The reverse quotient describes notebooks per dollar, a different rate.",
    "A cyclist rides 45 miles in 3 hours at a constant rate. Find the unit rate and predict the distance in 5 hours.",
    "45 ÷ 3 = 15 miles per hour. At that constant rate, 5 × 15 = 75 miles.",
  );
}
{
  const s = [
    "Find the scale factor connecting the known first quantities.",
    "Multiply both terms by that same factor.",
    "Check that corresponding quotients match; do not add the same number to both terms.",
  ];
  const make = (a, b, k) =>
    task(
      `Complete the equivalent-ratio table. If ${a} cups of concentrate need ${b} cups of water, how many cups of water are needed for ${a * k} cups of concentrate?`,
      b * k,
      `The scale factor is ${a * k} ÷ ${a} = ${k}. Water: ${b} × ${k} = ${b * k} cups.`,
      table(
        ["Concentrate (cups)", "Water (cups)"],
        [
          [a, b],
          [a * k, "?"],
        ],
      ),
    );
  add(
    "3-3",
    "I can complete equivalent-ratio tables using multiplicative relationships.",
    s,
    {
      ...make(2, 5, 3),
      explanation:
        "The concentrate grows from 2 to 6 cups. | Scale factor = 6 ÷ 2 = 3. | Multiply water by 3 too: 5 × 3 = 15 cups.",
    },
    [
      [2, 3, 4],
      [3, 5, 2],
      [4, 7, 3],
      [5, 8, 4],
      [2, 9, 5],
      [6, 4, 3],
    ].map(([a, b, k]) => make(a, b, k)),
    "Adding 4 to each term changes 2:5 into an equivalent ratio 6:9.",
    "Equivalent ratios use a common multiplier. Scaling 2 to 6 multiplies by 3, so 5 must become 15. 6:9 is not equivalent to 2:5.",
    "A recipe uses flour:sugar = 3:2. Make a table for 1, 2, and 4 batches and explain what stays constant.",
    "The pairs are (3,2), (6,4), and (12,8). Sugar divided by flour remains 2/3, and both quantities use the same batch multiplier.",
  );
}
{
  const s = [
    "Use the horizontal coordinate first and vertical coordinate second.",
    "Use the constant ratio to calculate a missing coordinate.",
    "Check that the points align with the origin for this proportional relationship.",
  ];
  const make = (x, k) =>
    task(
      `A proportional graph represents y = ${k}x. What is the y-coordinate when x = ${x}?`,
      x * k,
      `y = ${k} × ${x} = ${x * k}. The ordered pair is (${x}, ${x * k}).`,
      {
        kind: "coordinates",
        points: [
          [1, k],
          [2, 2 * k],
        ],
        xMax: x + 1,
        yMax: k * (x + 1),
        xLabel: "x",
        yLabel: "y",
      },
    );
  add(
    "3-4",
    "I can connect equivalent ratios to points on a graph.",
    s,
    {
      ...make(3, 2),
      explanation:
        "The points (1,2) and (2,4) show y/x = 2. | At x = 3, calculate y = 2 × 3. | Plot (3,6): three units across, six up.",
    },
    [
      [4, 2],
      [3, 3],
      [5, 2],
      [4, 3],
      [6, 4],
      [7, 2],
    ].map(([x, k]) => make(x, k)),
    "The point (3,6) means move 6 across and 3 up.",
    "The first coordinate is horizontal: move 3 across, then 6 up. Reversing coordinates changes the point and the ratio.",
    "A ratio graph includes (2,6) and (4,12). Predict a third point and explain why (0,0) also belongs.",
    "Examples include (6,18) or (1,3), since y = 3x. At x = 0, y = 0, so the origin belongs to this proportional relationship.",
  );
}
{
  const s = [
    "Compare rates with the same units and the same one-unit basis.",
    "Divide each total cost by the number of items.",
    "Choose the smaller cost per item; explain why package price alone is insufficient.",
  ];
  const make = (ca, na, cb, nb) =>
    task(
      `Pack A: ${na} markers for $${ca}. Pack B: ${nb} markers for $${cb}. Which has the lower cost per marker?`,
      ca / na < cb / nb ? "A" : "B",
      `A costs $${fmt(ca / na)} each; B costs $${fmt(cb / nb)} each. Compare those unit prices.`,
      table(
        ["Pack", "Markers", "Cost ($)"],
        [
          ["A", na, ca],
          ["B", nb, cb],
        ],
      ),
      "choice",
    );
  add(
    "3-5",
    "I can compare ratio relationships using matching unit rates.",
    s,
    {
      ...make(12, 4, 18, 9),
      options: ["A", "B"],
      explanation:
        "Pack A: 12 ÷ 4 = $3 per marker. | Pack B: 18 ÷ 9 = $2 per marker. | B is cheaper per marker even though its package price is higher.",
    },
    [
      [10, 5, 12, 4],
      [18, 6, 20, 10],
      [15, 5, 24, 6],
      [21, 7, 16, 8],
      [8, 4, 15, 5],
      [28, 7, 27, 9],
    ].map((a) => ({ ...make(...a), options: ["A", "B"] })),
    "The lower package price always gives the better buy.",
    "Packages can contain different counts. Compare cost per item: a $12 pack of 4 costs $3 each, while an $18 pack of 9 costs $2 each.",
    "Store A sells 3 kilograms of rice for $12. Store B sells 5 kilograms for $17.50. Compare unit prices and state the better value if quality is equal.",
    "A costs $4 per kilogram; B costs $3.50 per kilogram. B is the lower unit price under the stated equal-quality assumption.",
  );
}
for (const [id, goal, factor, from, to, cross] of [
  ["3-6", "I can convert measurements within one system.", 12, "feet", "inches", false],
  [
    "3-7",
    "I can use a supplied conversion rate between systems.",
    2.54,
    "inches",
    "centimeters",
    true,
  ],
]) {
  const s = [
    "Write the supplied conversion rate and identify the desired unit.",
    "Multiply in the supplied conversion direction; divide to reverse that direction.",
    "Label the result and convert back to check.",
  ];
  const make = (n, reverse) =>
    task(
      `Use 1 ${cross ? "inch" : "foot"} = ${factor} ${to}. Convert ${n} ${reverse ? to : from} to ${reverse ? from : to}. Enter the value only.`,
      fmt(reverse ? n / factor : n * factor),
      `${n} ${reverse ? "÷" : "×"} ${factor} = ${fmt(reverse ? n / factor : n * factor)} ${reverse ? from : to}.`,
      table(
        [from, to],
        [
          [1, factor],
          [reverse ? "?" : n, reverse ? n : "?"],
        ],
      ),
    );
  add(
    id,
    goal,
    s,
    {
      ...make(3, false),
      explanation: `Start with 1 ${cross ? "inch" : "foot"} = ${factor} ${to}. | Multiply ${from} by ${factor}: 3 × ${factor}. | The result is ${fmt(3 * factor)} ${to}; divide by ${factor} to recover 3 ${from}.`,
    },
    (cross
      ? [
          [2, "inches", "centimeters", 2.54, false, false],
          [10.16, "inches", "centimeters", 2.54, true, false],
          [5, "miles", "kilometers", 1.6, false, true],
          [9.6, "miles", "kilometers", 1.6, true, true],
          [10, "pounds", "kilograms", 0.45, false, true],
          [2.7, "pounds", "kilograms", 0.45, true, true],
        ]
      : [
          [2, "feet", "inches", 12, false, false],
          [48, "feet", "inches", 12, true, false],
          [3.5, "meters", "centimeters", 100, false, false],
          [2500, "liters", "milliliters", 1000, true, false],
          [2, "kilograms", "grams", 1000, false, false],
          [72, "yards", "inches", 36, true, false],
        ]
    ).map(([n, f, t, k, r, approx]) =>
      task(
        `Use 1 ${singular(f)} ${approx ? "≈" : "="} ${k} ${t}. Convert ${n} ${r ? t : f} to ${r ? f : t}. ${approx ? "Use this approximate rate. " : ""}Enter the value only.`,
        fmt(r ? n / k : n * k),
        `${n} ${r ? "÷" : "×"} ${k} = ${fmt(r ? n / k : n * k)} ${r ? f : t}${approx ? " approximately" : ""}.`,
        table(
          [f, t],
          [
            [1, k],
            [r ? "?" : n, r ? n : "?"],
          ],
        ),
      ),
    ),
    `Converting ${from} to ${to} always means dividing by ${factor}.`,
    `One unit of ${from} contains ${factor} ${to}. To convert ${from} to ${to}, multiply by ${factor}; use division for the reverse direction.`,
    cross
      ? "Use 1 inch = 2.54 centimeters. A screen is 10 inches wide. Give its width in centimeters and explain whether this relation is exact."
      : "A shelf is 4 feet 6 inches long. Express the entire length in inches and show how the two measurements combine.",
    cross
      ? "10 × 2.54 = 25.4 centimeters. The stated inch-to-centimeter relation is exact."
      : "4 × 12 + 6 = 54 inches. Convert the feet first, then add the remaining inches.",
  );
}

// Unit 4: percent as a ratio, representations, estimates, and unknown wholes.
{
  const s = [
    "Percent means out of 100 equal parts.",
    "Count the part and identify the whole before forming the fraction.",
    "Scale to a denominator of 100 and write the percent symbol.",
  ];
  const make = (n, d) =>
    task(
      `${n} of ${d} equal squares are shaded. Write the shaded amount as a percent.`,
      `${fmt((n / d) * 100)}%`,
      `${n}/${d} = ${fmt((n / d) * 100)}/100 = ${fmt((n / d) * 100)}%.`,
      { kind: "fraction", n, d },
    );
  add(
    "4-1",
    "I can interpret percent as a ratio out of 100.",
    s,
    {
      ...make(3, 4),
      explanation:
        "The whole has four equal parts. | Three out of four = 3/4 = 75/100. | The shaded part is 75% of the whole.",
    },
    [
      [1, 2],
      [1, 4],
      [3, 5],
      [7, 10],
      [9, 20],
      [17, 25],
    ].map(([n, d]) => make(n, d)),
    "25% means 25 parts out of any size whole.",
    "Percent always compares to 100. A 25% share of 20 objects is 5 objects; a 25% share of 100 is 25.",
    "Draw or describe two different models for 40%. Explain what represents the whole in each.",
    "Examples: shade 40 of 100 equal squares, or shade 2 of 5 equal sections. Each complete grid or strip is the whole; both fractions equal 40/100.",
  );
}
{
  const s = [
    "Identify the requested representation before calculating.",
    "Divide numerator by denominator for a decimal; multiply the decimal by 100 for a percent.",
    "Check equivalence using the same whole and keep the requested form.",
  ];
  const make = (n, d, percent) =>
    task(
      `Write ${n}/${d} as a ${percent ? "percent" : "decimal"}.`,
      percent ? `${fmt((n / d) * 100)}%` : fmt(n / d),
      `${n} ÷ ${d} = ${fmt(n / d)} = ${fmt((n / d) * 100)}%.`,
      { kind: "fraction", n, d },
    );
  add(
    "4-2",
    "I can connect fractions, decimals, and percents of the same whole.",
    s,
    {
      ...make(3, 8, false),
      explanation:
        "Divide 3 by 8 to get 0.375. | Multiply 0.375 by 100 to get 37.5%. | So 3/8 = 0.375 = 37.5%; write 0.375 when asked for a decimal.",
    },
    [
      [1, 4, false],
      [3, 4, true],
      [2, 5, false],
      [7, 10, true],
      [3, 20, false],
      [9, 25, true],
    ].map(([n, d, p]) => make(n, d, p)),
    "0.6 equals 0.6%.",
    "0.6 is 60/100 = 60%. But 0.6% is 0.6/100 = 0.006. The percent sign changes the scale.",
    "A student writes 1/5 = 0.2 = 20%. Explain each equality using a model or place value.",
    "One fifth is two tenths, or 0.2. Two tenths equals twenty hundredths, so it is 20 out of 100, or 20%.",
  );
}
{
  const s = [
    "Choose the named benchmark percent: 10%, 25%, 50%, 75%, or 100%.",
    "Use a simple fraction or divide by 10 to find that benchmark amount.",
    "Report an estimate, then say whether the exact amount should be above or below it.",
  ];
  const make = (p, w, b) =>
    task(
      `Estimate ${p}% of ${w} using the benchmark ${b}%. Enter the benchmark amount.`,
      (w * b) / 100,
      `Use ${b}% of ${w}: ${w} × ${b}/100 = ${(w * b) / 100}. This is an estimate for ${p}%, not its exact value.`,
      { kind: "percent", part: b, whole: w },
    );
  add(
    "4-3",
    "I can estimate percent quantities with named benchmarks.",
    s,
    {
      ...make(48, 80, 50),
      explanation:
        "48% is close to 50%. | Half of 80 is 40. | Estimate 40; the exact 48% amount is slightly below 40.",
    },
    [
      [23, 120, 25],
      [52, 90, 50],
      [9, 70, 10],
      [74, 80, 75],
      [26, 200, 25],
      [49, 160, 50],
    ].map(([p, w, b]) => make(p, w, b)),
    "Using 50% to estimate 48% gives the exact answer.",
    "A benchmark produces an estimate. Half of 80 is 40, while 48% of 80 is 38.4. Mark estimates with words such as “about.”",
    "Estimate 19% of 250 using 20%, which is twice 10%. Explain why your estimate is a little high.",
    "10% of 250 is 25; 20% is 50. The estimate is about 50, slightly high because 19% is less than 20%.",
  );
}
{
  const s = [
    "Identify the whole and write the percent as a decimal or fraction.",
    "Multiply the whole by that percent value.",
    "Check using a benchmark; distinguish the percent amount from a remaining amount.",
  ];
  const make = (p, w) =>
    task(
      `Find ${p}% of ${w}.`,
      fmt((p * w) / 100),
      `${p}% = ${p / 100}. Then ${w} × ${p / 100} = ${fmt((p * w) / 100)}.`,
      { kind: "percent", part: p, whole: w },
    );
  add(
    "4-4",
    "I can find a percent of a quantity and interpret the result.",
    s,
    {
      ...make(30, 80),
      explanation:
        "The whole is 80. | Write 30% as 0.30. | 0.30 × 80 = 24, so the percent amount is 24.",
    },
    [
      [25, 60],
      [15, 200],
      [40, 90],
      [75, 48],
      [12, 150],
      [35, 80],
    ].map(([p, w]) => make(p, w)),
    "A 20% discount on $60 means the final price is $12.",
    "Twenty percent of $60 is a $12 discount. Subtract it from $60 to find the $48 final price.",
    "A $50 jacket is discounted 30%. Find both the savings and sale price. Explain which result is the part and which is the amount remaining.",
    "Savings: 0.30 × 50 = $15. Sale price: 50 − 15 = $35. The discount is the 30% part; the sale price is the remaining 70%.",
  );
}
{
  const s = [
    "The given amount is the part; the unknown total is the whole.",
    "Write part = decimal percent × whole.",
    "Divide the part by the decimal percent, then multiply back to verify.",
  ];
  const make = (part, p) =>
    task(
      `${part} is ${p}% of a whole. Find the whole.`,
      fmt(part / (p / 100)),
      `Whole = ${part} ÷ ${p / 100} = ${fmt(part / (p / 100))}.`,
      { kind: "percent", part: p, knownPart: part },
    );
  add(
    "4-5",
    "I can recover a whole from a known part and percent.",
    s,
    {
      ...make(18, 30),
      explanation:
        "Write 18 = 0.30 × whole. | Divide: whole = 18 ÷ 0.30 = 60. | Check: 30% of 60 is 18.",
    },
    [
      [15, 25],
      [24, 40],
      [36, 75],
      [14, 20],
      [45, 60],
      [8, 10],
    ].map(([a, p]) => make(a, p)),
    "If 18 is 30% of a whole, multiply 18 by 0.30 to find the whole.",
    "Eighteen is already the part. Divide by 0.30 to recover the whole: 18 ÷ 0.30 = 60. Multiplying would make an even smaller part.",
    "Twelve students are absent, which is 20% of the class. Find the class size and the number present.",
    "Whole = 12 ÷ 0.20 = 60 students. Present = 60 − 12 = 48 students.",
  );
}

// Unit 5: diagrams explicitly distinguish perpendicular height from a slanted side.
for (const [id, shape, goal] of [
  ["5-1", "parallelogram", "I can find the area of a parallelogram using perpendicular height."],
  ["5-2", "triangle", "I can connect triangle area to half a matching rectangle."],
  ["5-3", "trapezoid", "I can use both parallel bases and perpendicular height."],
]) {
  const s =
    shape === "trapezoid"
      ? [
          "Identify the two parallel bases and their perpendicular separation.",
          "Average the base lengths: (b1 + b2) ÷ 2.",
          "Multiply the average base by height; label square units.",
        ]
      : [
          "Identify a base and the height perpendicular to that base.",
          "Multiply base by height to get the area of a matching rectangle.",
          shape === "triangle"
            ? "Divide by 2 because the triangle occupies half of that rectangle."
            : "A parallelogram can be rearranged into a rectangle with the same base and height.",
        ];
  const make = (b, h, t) => {
    const ans =
      shape === "triangle" ? (b * h) / 2 : shape === "trapezoid" ? ((b + t) * h) / 2 : b * h;
    return task(
      `A ${shape} has ${shape === "trapezoid" ? `parallel bases ${b} cm and ${t} cm` : `base ${b} cm`} and perpendicular height ${h} cm. Find its area in square centimeters. Enter the value.`,
      ans,
      `${shape === "triangle" ? `(${b} × ${h}) ÷ 2` : shape === "trapezoid" ? `(${b} + ${t}) × ${h} ÷ 2` : `${b} × ${h}`} = ${ans} cm².`,
      { kind: "area", shape, b, h, t },
    );
  };
  add(
    id,
    goal,
    s,
    {
      ...make(8, 4, 4),
      explanation: `Read the perpendicular height: 4 cm. | ${shape === "trapezoid" ? "Average the bases: (8 + 4) ÷ 2 = 6 cm." : "Base × height = 8 × 4 = 32 cm²."} | ${shape === "triangle" ? "Halve 32 to get 16 cm²." : shape === "trapezoid" ? "6 × 4 = 24 cm²." : "The area is 32 cm²."}`,
    },
    [
      [6, 4, 2],
      [9, 6, 5],
      [10, 3, 4],
      [12, 5, 8],
      [7, 8, 3],
      [14, 4, 6],
    ].map(([b, h, t]) => make(b, h, t)),
    "The slanted side can always be used as the height.",
    "Height must be perpendicular to the chosen base. A slanted side is generally a different length. Look for a right-angle marker or perpendicular distance.",
    `Explain why doubling only the perpendicular height of a ${shape} doubles its area when the base length${shape === "trapezoid" ? "s stay" : " stays"} the same.`,
    `Height is a factor in the area formula. Replacing h with 2h doubles the product while the base factor stays fixed.`,
  );
}
{
  const s = [
    "Split the figure into nonoverlapping rectangles, or subtract a cutout from the outer rectangle.",
    "Find each rectangle area using its own length and width.",
    "Add included pieces or subtract the cutout; check square units.",
  ];
  const make = (w, h, cw, ch) =>
    task(
      `An outer ${w} cm by ${h} cm rectangle has a ${cw} cm by ${ch} cm corner cut out. Find the remaining area in cm².`,
      w * h - cw * ch,
      `Outer area ${w * h}; cutout area ${cw * ch}. Remaining area = ${w * h} − ${cw * ch} = ${w * h - cw * ch} cm².`,
      { kind: "composite", w, h, cw, ch },
    );
  add(
    "5-4",
    "I can decompose a composite figure and account for every region once.",
    s,
    {
      ...make(10, 8, 4, 3),
      explanation:
        "Outer rectangle: 10 × 8 = 80 cm². | Cutout: 4 × 3 = 12 cm². | Remaining area = 80 − 12 = 68 cm².",
    },
    [
      [8, 6, 3, 2],
      [12, 9, 4, 3],
      [10, 7, 2, 4],
      [14, 8, 5, 3],
      [9, 9, 3, 3],
      [15, 10, 6, 4],
    ].map((a) => make(...a)),
    "Add the cutout area to the outer rectangle to find the remaining area.",
    "The cutout is removed, so subtract its area. Adding would count space outside the remaining figure.",
    "An L-shaped floor is an outer 12 m by 8 m rectangle with a 4 m by 3 m corner removed. Find the area and describe a second valid method.",
    "Area = 96 − 12 = 84 m². Alternatively split the L into an 8 m by 8 m rectangle and a 4 m by 5 m rectangle: 64 + 20 = 84 m².",
  );
}
{
  const s = [
    "Identify length, width, and height in the same units.",
    "Find the number of unit cubes in one layer: length × width.",
    "Multiply by the number of layers; label cubic units.",
  ];
  const make = (l, w, h) =>
    task(
      `A rectangular prism has length ${l} cm, width ${w} cm, and height ${h} cm. Find its volume in cm³.`,
      l * w * h,
      `One layer has ${l * w} unit cubes; ${h} layers give ${l * w * h} cm³.`,
      { kind: "prism", l, w, h },
    );
  add(
    "5-5",
    "I can find prism volume by counting equal layers.",
    s,
    {
      ...make(4, 3, 2),
      explanation:
        "One layer contains 4 × 3 = 12 unit cubes. | There are 2 equal layers. | Volume = 12 × 2 = 24 cm³.",
    },
    [
      [3, 2, 4],
      [5, 3, 2],
      [6, 4, 3],
      [8, 2, 5],
      [4, 4, 4],
      [10, 3, 2],
    ].map((a) => make(...a)),
    "Volume uses square centimeters because it multiplies lengths.",
    "Volume measures three-dimensional space. Multiplying three length dimensions gives cubic centimeters, cm³, unlike area in cm².",
    "A prism has volume 60 cm³ and a base area of 12 cm². Find its height and explain the layer model.",
    "Height = 60 ÷ 12 = 5 cm. Five 1-cm-high layers of base area 12 cm² fill the prism.",
  );
}
{
  const s = [
    "Identify which two dimensions belong to each face.",
    "A rectangular prism has two faces of each of three types.",
    "Check that all six rectangles can fold without overlap and matching edges have equal lengths.",
  ];
  const make = (l, w, h, k) =>
    task(
      `A rectangular prism measures ${l} cm by ${w} cm by ${h} cm. What is the area of one ${["length-by-width", "length-by-height", "width-by-height"][k]} face in its net?`,
      [l * w, l * h, w * h][k],
      `That face uses ${[`${l} × ${w}`, `${l} × ${h}`, `${w} × ${h}`][k]} = ${[l * w, l * h, w * h][k]} cm².`,
      { kind: "net", l, w, h },
    );
  add(
    "5-6",
    "I can match faces in a two-dimensional net to a three-dimensional prism.",
    s,
    {
      ...make(4, 3, 2, 1),
      explanation:
        "The prism has three face types: 4 × 3, 4 × 2, and 3 × 2. | Each type appears twice in the net. | One length-by-height face has area 4 × 2 = 8 cm².",
    },
    [
      [3, 2, 4, 0],
      [5, 3, 2, 1],
      [6, 4, 3, 2],
      [7, 2, 5, 0],
      [4, 3, 6, 1],
      [8, 5, 2, 2],
    ].map((a) => make(...a)),
    "Any six rectangles form a valid rectangular-prism net.",
    "The rectangles need matching dimensions, correct adjacency, and no overlap after folding. Six rectangles alone do not guarantee a valid net.",
    "A 5 cm by 3 cm by 2 cm prism needs how many faces of each size in its net? State the dimensions and counts.",
    "Two 5 × 3 faces, two 5 × 2 faces, and two 3 × 2 faces: six faces total.",
  );
}
{
  const s = [
    "Use the net to identify each of the six exterior faces.",
    "Find lw, lh, and wh; each appears twice.",
    "Add all face areas: 2(lw + lh + wh), in square units.",
  ];
  const make = (l, w, h) =>
    task(
      `Find the surface area of a ${l} cm by ${w} cm by ${h} cm rectangular prism, including all six faces.`,
      2 * (l * w + l * h + w * h),
      `2(${l * w} + ${l * h} + ${w * h}) = ${2 * (l * w + l * h + w * h)} cm².`,
      { kind: "net", l, w, h },
    );
  add(
    "5-7",
    "I can use a net to find the total exterior area of a prism.",
    s,
    {
      ...make(4, 3, 2),
      explanation:
        "The three different face areas are 12, 8, and 6 cm². | Each face area occurs twice. | Surface area = 2(12 + 8 + 6) = 52 cm².",
    },
    [
      [3, 2, 4],
      [5, 3, 2],
      [6, 4, 3],
      [7, 2, 5],
      [4, 4, 4],
      [8, 5, 2],
    ].map((a) => make(...a)),
    "Surface area is length × width × height.",
    "That product gives volume. Surface area adds the areas of exterior faces: 2(lw + lh + wh), with square units.",
    "Compare a closed 4 cm by 3 cm by 2 cm box with the same box missing its 4 cm by 3 cm top. Find both exterior areas.",
    "Closed box: 52 cm². Open-top box: 52 − 12 = 40 cm², counting the remaining five exterior faces.",
  );
}
{
  const s = [
    "Identify the square base and all four triangular faces.",
    "Use each triangle’s slant height, perpendicular to its base within the face.",
    "Add base area plus four triangle areas; do not use the vertical pyramid height.",
  ];
  const make = (b, s) =>
    task(
      `A square pyramid has base side ${b} cm. Every triangular face has slant height ${s} cm. Find total surface area, including the base.`,
      b * b + 2 * b * s,
      `Base ${b * b} + 4 × (${b} × ${s} ÷ 2) = ${b * b + 2 * b * s} cm².`,
      { kind: "pyramid", b, s },
    );
  add(
    "5-8",
    "I can use a pyramid net and slant height to find surface area.",
    s,
    {
      ...make(6, 5),
      explanation:
        "Base area = 6 × 6 = 36 cm². | Each triangle area = 6 × 5 ÷ 2 = 15 cm²; four triangles total 60 cm². | Total surface area = 36 + 60 = 96 cm².",
    },
    [
      [4, 3],
      [6, 4],
      [8, 5],
      [10, 6],
      [5, 4],
      [12, 8],
    ].map((a) => make(...a)),
    "A square pyramid has four faces in total.",
    "It has five faces: one square base and four triangular sides. Surface area includes the base unless the question explicitly removes it.",
    "A square pyramid has base side 8 cm, vertical height 3 cm, and triangular-face slant height 5 cm. Which height is used for face area, and what is the total surface area?",
    "Use slant height 5 cm, perpendicular to the base within each triangular face. Total = 64 + 4(8 × 5 ÷ 2) = 144 cm².",
  );
}

// Unit 6: fractions, exponents, expression structure, and factors.
for (const [id, mixed] of [
  ["6-1", false],
  ["6-2", true],
]) {
  const s = [
    "Interpret division as the number of divisor-sized groups in the total.",
    "Rewrite any mixed number as an improper fraction.",
    "Multiply by the reciprocal of the divisor; check by multiplying quotient and divisor.",
  ];
  const pairs = mixed
    ? [
        [5, 2, 1, 2],
        [7, 3, 2, 3],
        [9, 4, 3, 4],
        [7, 2, 1, 4],
        [11, 3, 2, 3],
        [13, 4, 1, 2],
      ]
    : [
        [3, 4, 1, 4],
        [2, 3, 1, 6],
        [4, 1, 2, 3],
        [5, 6, 1, 3],
        [3, 1, 3, 4],
        [7, 8, 1, 4],
      ];
  const make = (a, b, c, d) => {
    const display = mixed && a > b ? `${Math.floor(a / b)} ${a % b}/${b}` : frac(a, b);
    return task(
      `Compute ${display} ÷ ${frac(c, d)}. Give a number or equivalent fraction.`,
      frac(a * d, b * c),
      `${frac(a, b)} × ${frac(d, c)} = ${frac(a * d, b * c)}. Multiply this result by ${frac(c, d)} to recover ${frac(a, b)}.`,
      { kind: "fractionDivision", a, b, c, d },
    );
  };
  add(
    id,
    mixed
      ? "I can divide mixed numbers and interpret fractional groups."
      : "I can divide whole numbers and fractions using equal groups.",
    s,
    mixed
      ? {
          ...make(3, 2, 1, 4),
          explanation:
            "1 1/2 = 3/2. | Count quarter-sized groups: (3/2) ÷ (1/4) = (3/2) × 4. | There are 6 groups; 6 × 1/4 = 1 1/2.",
        }
      : {
          ...make(1, 2, 1, 4),
          explanation:
            "The total is 1/2 and each group is 1/4. | (1/2) ÷ (1/4) = (1/2) × 4. | There are 2 quarter-sized groups; 2 × 1/4 = 1/2.",
        },
    pairs.map((a) => make(...a)),
    "Dividing by a fraction always makes the result smaller.",
    "Dividing by a positive fraction less than 1 can make the result larger. There are six quarter-sized groups in 1 1/2.",
    "You have 2 1/2 cups of flour. Each batch uses 3/4 cup. How many batch-equivalents is that, and how many full batches can you make?",
    "(5/2) ÷ (3/4) = 10/3 = 3 1/3 batch-equivalents. You can make 3 full batches, with 1/4 cup left; fractional batch-equivalents differ from full batches.",
  );
}
{
  const s = [
    "The base is the repeated factor; the exponent counts how many copies.",
    "Write the multiplication before evaluating.",
    "Do not multiply the base by the exponent.",
  ];
  const make = (b, p) =>
    task(
      `Evaluate ${b}^${p}. The symbol ^ means “raised to the power.”`,
      b ** p,
      `${Array(p).fill(b).join(" × ")} = ${b ** p}.`,
      { kind: "expression", tokens: Array(p).fill(String(b)), operator: "×" },
    );
  add(
    "6-3",
    "I can represent an exponent as repeated multiplication.",
    s,
    {
      ...make(3, 4),
      explanation:
        "The base is 3 and the exponent is 4. | Write four factors: 3 × 3 × 3 × 3. | The value is 81.",
    },
    [
      [2, 3],
      [4, 2],
      [5, 3],
      [3, 3],
      [6, 2],
      [2, 5],
    ].map((a) => make(...a)),
    "3^4 is 3 × 4 = 12.",
    "The exponent counts factors, not a multiplier: 3^4 = 3 × 3 × 3 × 3 = 81.",
    "A cube has side length 4 cm. Explain why its volume can be written 4^3 and evaluate it with units.",
    "Volume = 4 × 4 × 4 = 4^3 = 64 cm³. Three factors represent the three dimensions.",
  );
}
{
  const s = [
    "Evaluate parentheses first, then exponents.",
    "Multiply and divide from left to right.",
    "Add and subtract from left to right; record intermediate values.",
  ];
  const make = (a, b, c) =>
    task(
      `Evaluate ${a} + ${b}^2 × ${c}.`,
      a + b * b * c,
      `Exponent: ${b}² = ${b * b}; multiply ${b * b} × ${c} = ${b * b * c}; add ${a} to get ${a + b * b * c}.`,
      {
        kind: "expression",
        tokens: [String(a), `${b}²`, String(c)],
        operator: "mixed",
        expression: `${a} + ${b}² × ${c}`,
      },
    );
  add(
    "6-4",
    "I can evaluate numerical expressions in the correct order.",
    s,
    {
      ...make(5, 3, 2),
      explanation: "Exponent first: 3² = 9. | Multiply: 9 × 2 = 18. | Add: 5 + 18 = 23.",
    },
    [
      [4, 2, 3],
      [6, 3, 2],
      [10, 4, 2],
      [7, 2, 5],
      [2, 5, 3],
      [8, 3, 4],
    ].map((a) => make(...a)),
    "Evaluate 5 + 3² × 2 from left to right without regard to the operations.",
    "Exponents precede multiplication, which precedes addition. The value is 5 + 9 × 2 = 23, not 128 or 28.",
    "Evaluate (5 + 3)^2 and 5 + 3^2. Explain why the parentheses change the result.",
    "(5 + 3)^2 = 8² = 64; 5 + 3² = 5 + 9 = 14. Parentheses change which quantity is squared.",
  );
}
{
  const s = [
    "Identify each variable and its supplied value.",
    "Replace every occurrence of the variable, using parentheses where needed.",
    "Evaluate operations in order and interpret any units.",
  ];
  const make = (a, b, x) =>
    task(
      `Evaluate ${a}x + ${b} when x = ${x}.`,
      a * x + b,
      `Substitute: ${a}(${x}) + ${b} = ${a * x} + ${b} = ${a * x + b}.`,
      {
        kind: "expression",
        tokens: [`${a}x`, String(b)],
        operator: "+",
        expression: `${a}x + ${b}; x = ${x}`,
      },
    );
  add(
    "6-5",
    "I can substitute a value and evaluate an algebraic expression.",
    s,
    {
      ...make(3, 4, 5),
      explanation: "Replace x with 5: 3(5) + 4. | Multiply: 3 × 5 = 15. | Add: 15 + 4 = 19.",
    },
    [
      [2, 5, 4],
      [4, 3, 6],
      [5, 2, 3],
      [3, 8, 7],
      [6, 1, 5],
      [7, 4, 2],
    ].map((a) => make(...a)),
    "3x means the two-digit number 35 when x = 5.",
    "Adjacent number and variable indicate multiplication: 3x = 3 × x. At x = 5, 3x = 15.",
    "A club charges $5 to join and $3 per meeting. Write the cost for m meetings, then evaluate for 4 meetings.",
    "C = 5 + 3m. At m = 4, C = 5 + 12 = $17.",
  );
}
{
  const s = [
    "Use a property of operations to rewrite the expressions.",
    "Check whether the rewritten structures match for every variable value.",
    "A match at one input alone does not prove equivalence.",
  ];
  const make = (a, b, valid) => ({
    ...task(
      `Are ${a}(x + ${b}) and ${a}x + ${valid ? a * b : b} equivalent for every x?`,
      valid ? "yes" : "no",
      `Distributing gives ${a}x + ${a * b}. ${valid ? "That matches the second expression." : "That differs from the second expression."}`,
      {
        kind: "expression",
        expression: `${a}(x + ${b})`,
        tokens: Array(a).fill(`x + ${b}`),
        operator: "+",
      },
      "choice",
    ),
    options: ["yes", "no"],
  });
  add(
    "6-6",
    "I can justify expression equivalence using properties.",
    s,
    {
      ...make(3, 2, true),
      explanation:
        "Distribute 3 to both terms. | 3(x + 2) = 3x + 6. | The distributive property establishes equality for every x.",
    },
    [
      [2, 4, true],
      [3, 5, false],
      [4, 2, true],
      [5, 3, false],
      [6, 2, true],
      [2, 7, false],
    ].map((a) => make(...a)),
    "If two expressions match at x = 0, they are equivalent for every x.",
    "One input checks only one case. For example, 2x and 3x both equal 0 at x = 0 but differ at x = 1. Use properties to prove equivalence.",
    "Explain whether 2(x + 3) and 2x + 6 are equivalent. Then give a pair that agree at one input but are not equivalent.",
    "They are equivalent by distribution. One counterexample pair is 2x and 3x: they agree at 0 but disagree at 1.",
  );
}
{
  const s = [
    "List factor pairs to find shared divisors.",
    "For multiples, list products or use prime-factor structure.",
    "Choose the greatest shared factor or least positive shared multiple, as requested.",
  ];
  const make = (a, b, lcm) =>
    task(
      `Find the ${lcm ? "least common multiple (LCM)" : "greatest common factor (GCF)"} of ${a} and ${b}.`,
      lcm ? (a * b) / gcd(a, b) : gcd(a, b),
      `GCF = ${gcd(a, b)}; LCM = ${(a * b) / gcd(a, b)}. Choose the requested measure.`,
      table(
        ["Number", "Factor pairs"],
        [
          [
            a,
            Array.from({ length: a }, (_, i) => i + 1)
              .filter((x) => a % x === 0)
              .join(", "),
          ],
          [
            b,
            Array.from({ length: b }, (_, i) => i + 1)
              .filter((x) => b % x === 0)
              .join(", "),
          ],
        ],
      ),
    );
  add(
    "6-7",
    "I can distinguish and find greatest common factors and least common multiples.",
    s,
    {
      ...make(12, 18, false),
      explanation:
        "Factors of 12: 1, 2, 3, 4, 6, 12. | Factors of 18: 1, 2, 3, 6, 9, 18. | Greatest shared factor = 6.",
    },
    [
      [8, 12, false],
      [4, 6, true],
      [18, 24, false],
      [6, 8, true],
      [20, 30, false],
      [9, 12, true],
    ].map((a) => make(...a)),
    "The GCF of 12 and 18 is 36.",
    "Thirty-six is a common multiple, not a factor. A common factor divides both numbers; the greatest such factor is 6.",
    "Two lights flash every 6 and 8 seconds. If they flash together now, when will they next flash together? Explain the relevant measure.",
    "After 24 seconds, the LCM of 6 and 8. Multiples describe future flash times; factors do not.",
  );
}
{
  const s = [
    "Group terms with the same variable structure.",
    "Add coefficients of like terms, or distribute a factor to each term.",
    "Keep constants separate; verify a rewrite with both a property and a sample value.",
  ];
  const make = (a, b, c) =>
    task(
      `Combine like terms in ${a}x + ${b}x + ${c}. Enter only the coefficient of x in the simplified expression.`,
      a + b,
      `(${a} + ${b})x + ${c} = ${a + b}x + ${c}. The coefficient is ${a + b}.`,
      {
        kind: "expression",
        expression: `${a}x + ${b}x + ${c}`,
        tokens: [`${a}x`, `${b}x`, String(c)],
        operator: "+",
      },
    );
  add(
    "6-8",
    "I can generate equivalent expressions by combining like terms and factoring.",
    s,
    {
      ...make(3, 2, 4),
      explanation:
        "The like terms are 3x and 2x. | Add their coefficients: 3 + 2 = 5. | Equivalent expression: 5x + 4; the constant stays separate.",
    },
    [
      [2, 5, 3],
      [4, 3, 8],
      [6, 2, 5],
      [7, 5, 1],
      [3, 8, 6],
      [9, 4, 2],
    ].map((a) => make(...a)),
    "3x + 2 + 4x simplifies to 9x.",
    "Only 3x and 4x are like terms. They combine to 7x; the constant 2 remains, giving 7x + 2.",
    "Rewrite 6x + 9 as a product using its greatest common factor. Use distribution to check.",
    "6x + 9 = 3(2x + 3). Distribution gives 6x + 9 again.",
  );
}

// Unit 7: signed values, distance, coordinates, and polygon geometry.
{
  const s = [
    "Locate zero and identify the sign and distance from zero.",
    "The opposite is the same distance on the other side of zero.",
    "Keep the magnitude and reverse the sign; zero is its own opposite.",
  ];
  const make = (n) =>
    task(
      `What is the opposite of ${n}?`,
      -n,
      `${n} and ${-n} are ${Math.abs(n)} units from zero on opposite sides.`,
      { kind: "numberline", values: [n, -n], min: -12, max: 12 },
    );
  add(
    "7-1",
    "I can represent integers and identify their opposites.",
    s,
    {
      ...make(-5),
      explanation:
        "−5 lies 5 units left of zero. | Its opposite lies 5 units right of zero. | The opposite is 5.",
    },
    [-3, 7, -9, 0, 11, -6].map(make),
    "The opposite of −5 is −1/5.",
    "Opposite reverses sign: 5. Reciprocal is a different concept and would be −1/5.",
    "Represent a $12 deposit and a $12 withdrawal with signed integers, and explain their relationship.",
    "Deposit +12 and withdrawal −12 are opposites: equal magnitudes with different signs.",
  );
}
{
  const s = [
    "Write the rational value exactly as a fraction or decimal.",
    "Locate it using equal-size intervals on the number line.",
    "Reflect across zero for its opposite; keep the same distance.",
  ];
  const make = (n) =>
    task(
      `Find the opposite of ${n}.`,
      fmt(-n),
      `Reflect ${n} across zero to ${fmt(-n)}. The distance from zero remains ${Math.abs(n)}.`,
      { kind: "numberline", values: [n], min: -5, max: 5 },
    );
  add(
    "7-2",
    "I can locate rational numbers and their opposites using a scale.",
    s,
    {
      ...make(-1.5),
      explanation:
        "−1.5 is halfway between −2 and −1. | Reflect across zero. | The opposite is 1.5, halfway between 1 and 2.",
    },
    [-0.5, 2.25, -3.5, 0.75, -1.25, 4.5].map(make),
    "−1.5 is to the left of −2 because 1.5 is less than 2.",
    "On a number line, −1.5 is right of −2: it is closer to zero. Negative ordering differs from positive magnitude ordering.",
    "Describe where −3/4 and its opposite belong on a number line with quarter-unit steps.",
    "−3/4 is three quarter-steps left of zero; +3/4 is three quarter-steps right. Each step has length 1/4.",
  );
}
{
  const s = [
    "Locate the value and zero on a number line.",
    "Count the distance between them, regardless of direction.",
    "Distance is nonnegative; absolute value of zero is zero.",
  ];
  const make = (n) =>
    task(
      `Find the absolute value of ${n}.`,
      Math.abs(n),
      `Distance from ${n} to zero is ${Math.abs(n)}.`,
      { kind: "numberline", values: [n, 0], min: -10, max: 10 },
    );
  add(
    "7-3",
    "I can interpret absolute value as distance from zero.",
    s,
    {
      ...make(-6),
      explanation:
        "Locate −6 and 0. | There are 6 unit intervals between them. | |−6| = 6, a nonnegative distance.",
    },
    [-4, 7, -2.5, 0, -8, 3.75].map(make),
    "The absolute value of −6 is −6.",
    "The sign gives direction or position; absolute value gives distance. Six units of distance is 6, not −6.",
    "A temperature is −8°C and another is 8°C. Compare their absolute values and their temperatures.",
    "Both absolute values are 8. The temperatures differ: −8°C is lower than 8°C. Equal distance from zero does not mean equal values.",
  );
}
{
  const s = [
    "Place both signed values on the same scaled number line.",
    "The value farther right is greater.",
    "Write the comparison symbol in the requested order.",
  ];
  const make = (a, b) =>
    task(
      `Compare ${a} and ${b}. Enter <, >, or = between them.`,
      a < b ? "<" : a > b ? ">" : "=",
      `${a} is ${a < b ? "left of" : a > b ? "right of" : "at the same location as"} ${b}.`,
      { kind: "numberline", values: [a, b], min: -10, max: 10 },
      "review",
    );
  add(
    "7-4",
    "I can compare signed rational numbers using their positions.",
    s,
    {
      ...make(-7, -2),
      explanation: "Locate −7 and −2. | −7 is farther left. | Therefore −7 < −2.",
    },
    [
      [-4, -1],
      [3, -2],
      [-0.5, -0.75],
      [-6, 0],
      [2.5, 2.25],
      [-3, -3],
    ].map((pair) => make(...pair)),
    "−7 is greater than −2 because 7 is greater than 2.",
    "Compare the signed positions: −7 lies left of −2, so −7 < −2. Magnitude alone does not determine negative-number order.",
    "Order −1.5, 0, −3, 2, and −0.5 from least to greatest, explaining how the number line supports the order.",
    "−3, −1.5, −0.5, 0, 2. This is left-to-right order on the number line.",
  );
}
{
  const s = [
    "The x-coordinate gives horizontal movement first.",
    "The y-coordinate gives vertical movement second.",
    "Use signs for direction and locate the intersection of the two coordinates.",
  ];
  const make = (x, y) =>
    task(
      `A point is ${Math.abs(x)} units ${x < 0 ? "left" : "right"} of the origin and ${Math.abs(y)} units ${y < 0 ? "down" : "up"}. Write its ordered pair.`,
      `(${x}, ${y})`,
      `Horizontal coordinate ${x}, vertical coordinate ${y}; write x first.`,
      {
        kind: "coordinates",
        points: [[x, y]],
        xMax: 6,
        yMax: 6,
        signed: true,
        xLabel: "x",
        yLabel: "y",
      },
      "review",
    );
  add(
    "7-5",
    "I can read and represent ordered pairs in all four quadrants.",
    s,
    {
      ...make(-3, 2),
      explanation:
        "Move 3 units left: x = −3. | Move 2 units up: y = 2. | The point is (−3, 2), in Quadrant II.",
    },
    [
      [2, 4],
      [-4, 3],
      [-2, -5],
      [5, -3],
      [-1, 2],
      [3, -4],
    ].map((a) => make(...a)),
    "For (−3, 2), move 2 left and 3 up.",
    "Coordinates are ordered. The first gives horizontal position −3, and the second gives vertical position 2.",
    "Reflect (−4, 3) across the y-axis, then across the x-axis from the original point. Explain which coordinate changes in each reflection.",
    "Across y-axis: (4,3), changing x. Across x-axis from the original: (−4,−3), changing y.",
  );
}
{
  const s = [
    "Check that the points share x or share y; these tasks use horizontal or vertical segments.",
    "Subtract the differing coordinates or count equal intervals across zero.",
    "Take a nonnegative distance and state coordinate units.",
  ];
  const make = (a, b, f, vertical) =>
    task(
      `Find the distance between ${vertical ? `(${f}, ${a}) and (${f}, ${b})` : `(${a}, ${f}) and (${b}, ${f})`} in coordinate units.`,
      Math.abs(a - b),
      `Distance = |${b} − (${a})| = ${Math.abs(a - b)} units.`,
      {
        kind: "coordinates",
        points: vertical
          ? [
              [f, a],
              [f, b],
            ]
          : [
              [a, f],
              [b, f],
            ],
        signed: true,
        xMax: 8,
        yMax: 8,
        xLabel: "x",
        yLabel: "y",
      },
    );
  add(
    "7-6",
    "I can find horizontal and vertical distances across signed coordinates.",
    s,
    {
      ...make(-3, 4, 2, false),
      explanation:
        "Both points have y = 2, so the segment is horizontal. | From −3 to 0 is 3 units; from 0 to 4 is 4. | Distance = 3 + 4 = 7 units.",
    },
    [
      [-2, 5, 1, false],
      [-4, 3, 2, true],
      [1, 6, -3, false],
      [-5, -1, 4, true],
      [-6, 2, -2, false],
      [-3, 6, -1, true],
    ].map((a) => make(...a)),
    "The distance from −3 to 4 is 4 − 3 = 1.",
    "Account for the negative coordinate: |4 − (−3)| = 7. Across zero, add the distances to zero: 3 + 4.",
    "Points A(−2,−3), B(4,−3), and C(4,2) form two perpendicular segments AB and BC. Find both lengths and their combined length.",
    "AB = 6 units, BC = 5 units, combined path length = 11 units. This is a path along two segments, not the direct diagonal distance AC.",
  );
}
{
  const s = [
    "Plot vertices in the supplied order and connect back to the first.",
    "Find horizontal and vertical side lengths using coordinate differences.",
    "For a rectangle, area = width × height; check square coordinate units.",
  ];
  const make = (x, y, w, h) =>
    task(
      `A rectangle has vertices (${x},${y}), (${x + w},${y}), (${x + w},${y + h}), (${x},${y + h}). Find its area in square coordinate units.`,
      w * h,
      `Width = ${w}, height = ${h}; area = ${w} × ${h} = ${w * h}.`,
      {
        kind: "coordinates",
        points: [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
        polygon: true,
        signed: true,
        xMax: 8,
        yMax: 8,
        xLabel: "x",
        yLabel: "y",
      },
    );
  add(
    "7-7",
    "I can use coordinates to represent polygons and find their area.",
    s,
    {
      ...make(-2, -1, 6, 4),
      explanation:
        "Horizontal span: 4 − (−2) = 6. | Vertical span: 3 − (−1) = 4. | Rectangle area = 6 × 4 = 24 square units.",
    },
    [
      [-2, -2, 5, 3],
      [-3, -1, 6, 4],
      [-1, -3, 4, 5],
      [-4, -2, 7, 3],
      [-2, -4, 6, 6],
      [-3, -3, 5, 5],
    ].map((a) => make(...a)),
    "A rectangle from x = −2 to x = 4 has width 2.",
    "The width is the full horizontal distance: 4 − (−2) = 6 units. Do not subtract unsigned magnitudes when the segment crosses zero.",
    "A rectangle has vertices (−3,−2), (2,−2), (2,4), (−3,4). Find its perimeter and area, explaining why their units differ.",
    "Width 5, height 6. Perimeter = 2(5 + 6) = 22 units; area = 5 × 6 = 30 square units.",
  );
}

// Units 8 and 9: equations, solution sets, and linked representations.
{
  const s = [
    "Substitute the proposed value for every occurrence of the variable.",
    "Evaluate each side independently.",
    "It is a solution only if both sides have the same value.",
  ];
  const make = (a, b, x) => ({
    ...task(
      `Is x = ${x} a solution of ${a}x + ${b} = ${a * 4 + b}?`,
      x === 4 ? "yes" : "no",
      `Left side at x = ${x} is ${a * x + b}; right side is ${a * 4 + b}. ${x === 4 ? "They match." : "They do not match."}`,
      { kind: "balance", left: `${a}x + ${b}`, right: a * 4 + b },
      "choice",
    ),
    options: ["yes", "no"],
  });
  add(
    "8-1",
    "I can test a proposed solution by substitution.",
    s,
    {
      ...make(2, 3, 4),
      explanation:
        "Substitute x = 4 in 2x + 3 = 11. | Left: 2(4) + 3 = 11; right: 11. | Both sides match, so x = 4 is a solution.",
    },
    [
      [3, 2, 4],
      [2, 5, 3],
      [4, 1, 4],
      [5, 3, 2],
      [6, 2, 4],
      [3, 7, 5],
    ].map((a) => make(...a)),
    "Any value written after x = is a solution to the equation.",
    "A proposed value must make the original equation true. Test it by substitution and compare the two sides.",
    "Test x = 5 and x = 6 in x + 7 = 12. Explain which is a solution and why.",
    "At x = 5: 5 + 7 = 12, true. At x = 6: 6 + 7 = 13, not 12. Only x = 5 is a solution.",
  );
}
{
  const s = [
    "Identify the addition or subtraction attached to the variable.",
    "Use the inverse operation on both sides to preserve equality.",
    "Substitute the solution in the original equation to check.",
  ];
  const make = (a, b, sub) =>
    task(
      `Solve x ${sub ? "−" : "+"} ${a} = ${b}. Enter the value of x.`,
      sub ? b + a : b - a,
      `${sub ? "Add" : "Subtract"} ${a} on both sides; x = ${sub ? b + a : b - a}.`,
      { kind: "balance", left: `x ${sub ? "−" : "+"} ${a}`, right: b },
    );
  add(
    "8-2",
    "I can solve one-step addition and subtraction equations.",
    s,
    {
      ...make(7, 19, false),
      explanation:
        "Undo adding 7 by subtracting 7. | x + 7 − 7 = 19 − 7, so x = 12. | Check: 12 + 7 = 19.",
    },
    [
      [5, 17, false],
      [8, 13, true],
      [12, 30, false],
      [6, 9, true],
      [2.5, 7, false],
      [3.5, 8, true],
    ].map((a) => make(...a)),
    "To solve x + 7 = 19, add 7 to only the left side.",
    "Apply the same inverse operation to both sides: subtract 7 from each side. This preserves equality and isolates x.",
    "A student had some stickers, gave away 9, and has 14 left. Write an equation, solve it, and check in context.",
    "x − 9 = 14. Add 9 to both sides: x = 23 stickers originally. Check: 23 − 9 = 14.",
  );
}
{
  const s = [
    "Identify whether the variable is multiplied or divided by a number.",
    "Use division or multiplication to undo that operation on both sides.",
    "Substitute the value to verify the original equality.",
  ];
  const make = (a, b, div) =>
    task(
      `Solve ${div ? `x ÷ ${a}` : `${a}x`} = ${b}. Enter x.`,
      div ? a * b : b / a,
      `${div ? "Multiply" : "Divide"} both sides by ${a}; x = ${div ? a * b : b / a}.`,
      { kind: "balance", left: div ? `x ÷ ${a}` : `${a}x`, right: b },
    );
  add(
    "8-3",
    "I can solve one-step multiplication and division equations.",
    s,
    {
      ...make(4, 28, false),
      explanation: "4x means 4 × x. | Divide both sides by 4: x = 28 ÷ 4 = 7. | Check: 4 × 7 = 28.",
    },
    [
      [3, 24, false],
      [5, 6, true],
      [6, 42, false],
      [4, 9, true],
      [2.5, 20, false],
      [8, 7, true],
    ].map((a) => make(...a)),
    "To solve 4x = 28, subtract 4 from both sides.",
    "The variable is multiplied by 4, so divide by 4. Subtraction does not undo multiplication.",
    "Six equal-price tickets cost $45. Write an equation and find the price per ticket. Explain the units.",
    "6p = 45. Divide by 6: p = $7.50 per ticket. Check: 6 × 7.50 = 45.",
  );
}
{
  const s = [
    "Translate “more than” and “less than” as strict comparisons.",
    "Translate “at least” and “at most” as inclusive comparisons.",
    "Use an open endpoint for strict comparisons and a closed endpoint when the boundary is included.",
  ];
  const records = [
    ["at least 8", "≥", 8],
    ["less than 5", "<", 5],
    ["at most 12", "≤", 12],
    ["more than 3", ">", 3],
    ["at least 10", "≥", 10],
    ["at most 6", "≤", 6],
  ];
  const make = (words, symbol, b) =>
    task(
      `A quantity x is ${words}. Enter the symbol in x ___ ${b}.`,
      symbol,
      `“${words}” means x ${symbol} ${b}. ${symbol === "≥" || symbol === "≤" ? "Include" : "Exclude"} the boundary.`,
      { kind: "inequality", symbol, b },
      "review",
    );
  add(
    "8-4",
    "I can translate inequality language and represent the boundary.",
    s,
    {
      ...make("at least 4", "≥", 4),
      explanation:
        "“At least” includes the boundary. | Write x ≥ 4. | Use a closed endpoint at 4 and show values to its right.",
    },
    records.map((a) => make(...a)),
    "“At least 4” means x > 4.",
    "At least includes exactly 4, so the symbol is ≥ and the endpoint is closed. A strict > would exclude 4.",
    "Write an inequality for a ride requiring a height of at least 120 cm. Explain whether 120 cm qualifies.",
    "h ≥ 120. Exactly 120 cm qualifies because the boundary is included.",
  );
}
{
  const s = [
    "Substitute the proposed value into the inequality.",
    "Read the resulting comparison and decide whether it is true.",
    "Check the boundary separately; an inequality usually has many solutions.",
  ];
  const make = (symbol, b, x) => {
    const yes = symbol === ">" ? x > b : symbol === "<" ? x < b : symbol === "≥" ? x >= b : x <= b;
    return {
      ...task(
        `Is ${x} a solution of x ${symbol} ${b}?`,
        yes ? "yes" : "no",
        `${x} ${symbol} ${b} is ${yes ? "true" : "false"}.`,
        { kind: "inequality", symbol, b },
        "choice",
      ),
      options: ["yes", "no"],
    };
  };
  add(
    "8-5",
    "I can test inequality solutions and describe a solution set.",
    s,
    {
      ...make("≤", 6, 6),
      explanation:
        "Substitute 6: 6 ≤ 6. | Equality is included by ≤. | The statement is true, so 6 is a solution.",
    },
    [
      [">", 4, 4],
      ["≥", 4, 4],
      ["<", 7, 6],
      ["≤", 3, 5],
      [">", -2, 0],
      ["<", -1, -3],
    ].map((a) => make(...a)),
    "An inequality has only one solution, just like x = 4.",
    "An inequality can describe many values. For x > 4, values such as 5, 6, and 4.5 work; the boundary 4 does not.",
    "For x > 2, give two integer solutions and one noninteger solution. Explain why 2 is excluded.",
    "Examples: 3 and 5; 2.5. The strict symbol > requires a value greater than 2, so 2 itself is excluded.",
  );
}
{
  const s = [
    "Identify the chosen input and the output that depends on it.",
    "Apply the relationship to each input.",
    "Label table columns and explain what a change in input does to output.",
  ];
  const make = (x, k, b) =>
    task(
      `A machine follows y = ${k}x + ${b}. What output y corresponds to input x = ${x}?`,
      k * x + b,
      `Substitute: ${k} × ${x} + ${b} = ${k * x + b}.`,
      table(
        ["Input x", "Output y"],
        [
          [0, b],
          [1, k + b],
          [x, "?"],
        ],
      ),
    );
  add(
    "9-1",
    "I can identify input and output variables and complete a relationship table.",
    s,
    {
      ...make(3, 2, 1),
      explanation:
        "x is the chosen input. | For x = 3, y = 2(3) + 1. | Output y = 7; it depends on x.",
    },
    [
      [2, 3, 1],
      [4, 2, 5],
      [5, 4, 0],
      [3, 5, 2],
      [6, 2, 3],
      [7, 3, 4],
    ].map((a) => make(...a)),
    "The dependent variable is always the quantity chosen first.",
    "The independent variable is the chosen input. The dependent output changes in response to that input. Identify them from the situation, not from alphabetical order.",
    "The total cost of notebooks depends on how many notebooks are bought. Identify independent and dependent variables and write a rule for $4 notebooks with no other fee.",
    "Independent: number n of notebooks. Dependent: total cost C. Rule C = 4n.",
  );
}
{
  const s = [
    "Read the horizontal and vertical axis labels and scales.",
    "Locate the input on the horizontal axis and read the corresponding output.",
    "Interpret the ordered pair with the situation’s units.",
  ];
  const make = (x, k) =>
    task(
      `A constant-speed graph has time (hours) on x and distance (km) on y. It includes (1, ${k}) and (2, ${2 * k}). How many kilometers at ${x} hours?`,
      x * k,
      `The rate is ${k} km per hour; distance = ${x} × ${k} = ${x * k} km.`,
      {
        kind: "coordinates",
        points: [
          [1, k],
          [2, 2 * k],
        ],
        xMax: x + 1,
        yMax: k * (x + 1),
        xLabel: "Time (hours)",
        yLabel: "Distance (km)",
      },
    );
  add(
    "9-2",
    "I can read graph scales and interpret two-variable relationships.",
    s,
    {
      ...make(3, 10),
      explanation:
        "The axes represent hours and kilometers. | (1,10) means 10 km in 1 hour at the stated constant rate. | At 3 hours the distance is 30 km, giving point (3,30).",
    },
    [
      [4, 5],
      [3, 8],
      [5, 6],
      [4, 12],
      [6, 10],
      [7, 4],
    ].map((a) => make(...a)),
    "The point (3,30) on this graph means 30 hours and 3 kilometers.",
    "Read axis order and units: x is time, y is distance. The point means 3 hours and 30 kilometers.",
    "On a graph, one horizontal interval is 2 minutes and one vertical interval is 5 pages. A point is 3 horizontal intervals right and 4 vertical intervals up. Interpret it.",
    "The point is (6,20): 20 pages after 6 minutes. Count intervals and multiply by the scale on each axis.",
  );
}
{
  const s = [
    "For a proportional table, divide y by x at every nonzero input.",
    "Verify that the quotient is constant across all supplied rows.",
    "Write y = kx and test it in each row, including (0,0) when supplied.",
  ];
  const make = (k, x) =>
    task(
      `A proportional table contains (${x}, ${x * k}), (${x + 1}, ${(x + 1) * k}), and (${x + 2}, ${(x + 2) * k}). Find k in y = kx.`,
      k,
      `Each y/x equals ${k}; the equation is y = ${k}x.`,
      table(
        ["x", "y"],
        [
          [x, x * k],
          [x + 1, (x + 1) * k],
          [x + 2, (x + 2) * k],
        ],
      ),
    );
  add(
    "9-3",
    "I can write an equation from a proportional relationship.",
    s,
    {
      ...make(4, 2),
      explanation:
        "Calculate 8/2 = 4, 12/3 = 4, and 16/4 = 4. | The same quotient holds in every row. | The equation is y = 4x.",
    },
    [
      [3, 1],
      [5, 2],
      [2.5, 2],
      [6, 3],
      [7, 1],
      [1.5, 4],
    ].map((a) => make(...a)),
    "A single matching row proves y = 4x fits the whole table.",
    "Check every supplied row. A different row can violate the rule; for example, (2,8) fits but (3,13) does not.",
    "Test whether y = 3x fits (1,3), (2,6), and (3,10). Explain the consequence of the last row.",
    "It fits the first two rows but predicts 9, not 10, when x = 3. It does not fit the whole table.",
  );
}
{
  const s = [
    "Choose the equation and identify which variable is known.",
    "Substitute the known quantity; multiply for output or divide to recover input.",
    "Interpret the result with units and substitute back to check.",
  ];
  const make = (k, x, inverse) =>
    task(
      `Notebooks cost $${k} each with no fee. ${inverse ? `You spend $${fmt(k * x)}. How many notebooks?` : `You buy ${x} notebooks. What is the total cost in dollars?`}`,
      inverse ? x : fmt(k * x),
      `C = ${k}n. ${inverse ? `n = ${fmt(k * x)} ÷ ${k} = ${x} notebooks.` : `C = ${k} × ${x} = $${fmt(k * x)}.`}`,
      table(
        ["Notebooks n", "Cost C ($)"],
        [
          [1, k],
          [inverse ? "?" : x, inverse ? k * x : "?"],
        ],
      ),
    );
  add(
    "9-4",
    "I can solve for either variable and interpret the result in context.",
    s,
    {
      ...make(2.5, 8, true),
      explanation:
        "Use C = 2.5n and substitute C = 20. | Solve 20 = 2.5n: n = 20 ÷ 2.5 = 8. | You can buy 8 notebooks; check 2.5 × 8 = $20.",
    },
    [
      [3, 6, false],
      [4, 7, true],
      [2.5, 10, false],
      [1.5, 12, true],
      [6, 8, false],
      [3.5, 6, true],
    ].map((a) => make(...a)),
    "If C = 2.5n and C = 20, n = 20 × 2.5.",
    "The variable n is multiplied by 2.5. Divide the known cost by the unit price: n = 20 ÷ 2.5 = 8.",
    "A printer makes 15 pages per minute at a constant rate. Write an equation, find the time for 90 pages, and explain the result.",
    "p = 15t. Substitute 90 = 15t, so t = 6 minutes. Check: 15 × 6 = 90 pages.",
  );
}

export const workshops = bank;
export function validateWorkshops(ids) {
  const errors = [];
  if (Object.keys(bank).length !== 54) errors.push("Expected exactly 54 workshops");
  for (const id of ids) {
    const w = bank[id];
    if (!w) {
      errors.push(`Missing workshop ${id}`);
      continue;
    }
    if (w.tasks.length !== 8 || w.example.steps.length < 3 || w.strategy.length !== 3)
      errors.push(`${id}: incomplete instructional sequence`);
    for (const [i, p] of w.tasks.entries()) {
      if (p.model.kind === "numberline" && !p.model.values.every(Number.isFinite))
        errors.push(`${id}/${i}: number-line positions must be finite numbers`);
      if (
        p.model.kind === "coordinates" &&
        !p.model.points.every((point) => point.length === 2 && point.every(Number.isFinite))
      )
        errors.push(`${id}/${i}: coordinates must be finite ordered pairs`);
      if (!p.prompt || !p.answer || !p.explanation || !p.model || p.hints.length !== 2)
        errors.push(`${id}/${i}: incomplete task`);
      if (
        p.mode === "number" &&
        !Number.isFinite(
          Number(
            p.answer.replace("%", "").includes("/")
              ? p.answer.split("/").reduce((a, b) => Number(a) / Number(b))
              : p.answer.replace("%", ""),
          ),
        )
      )
        errors.push(`${id}/${i}: invalid numeric answer`);
      if (p.mode === "choice" && !p.options?.includes(p.answer))
        errors.push(`${id}/${i}: choice answer missing`);
    }
  }
  for (const id of Object.keys(bank)) if (!ids.includes(id)) errors.push(`Unknown workshop ${id}`);
  return errors;
}
