// Visual lessons for the strand generators (strands-*.js): the same shape as lesson-content.js createLesson (a title,
// an idea, a model the visual lab already draws, and three checked steps), one function per generator. `k` (0-4)
// picks one of five exact variants so the numbers change but every model matches its question.
const step = (prompt, answer, hint, explanation, kind = "number", choices = null) => ({ prompt, answers: [String(answer)], kind, choices, hint, explanation });
const lesson = (title, idea, model, steps) => ({ title, idea, model, steps });
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = ([n, d]) => {
  const g = gcd(n, d) || 1;
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};
const times = ([a, b], [c, d]) => [a * c, b * d];
const sum = (values) => values.reduce((a, b) => a + b, 0);

const ORDER_SETS = [
  [-3, -1, 0.5, 2],
  [-2.5, 0.75, -0.5, 1.25],
  [-4, 3, -1.5, 0],
  [-0.2, -0.8, -0.5, 0.9],
  [-6, -2, 4, 5.5],
];
const PERCENTS = [[25, 15], [10, 7], [20, 12], [50, 18], [5, 4]];
const EXPRESSIONS = [[3, 4, 2], [2, 5, 3], [4, 3, 2], [5, 2, 3], [6, 5, 4]];
const INEQUALITIES = [
  ["Riders must be at least 48 inches tall.", 48, "at least", "≥", "≤", "yes"],
  ["A bag can hold at most 30 pounds.", 30, "at most", "≤", "≥", "yes"],
  ["You need more than 25 points to win.", 25, "more than", ">", "≥", "no"],
  ["Each team has fewer than 12 players.", 12, "fewer than", "<", "≤", "no"],
  ["A ticket costs no more than 9 dollars.", 9, "no more than", "≤", "<", "yes"],
];
const BINS = [[3, 5, 4, 2], [2, 6, 3, 4], [4, 4, 5, 1], [1, 7, 4, 3], [5, 3, 2, 6]];
const DATA = [[4, 6, 8, 10], [3, 5, 5, 7], [2, 9, 4, 5], [6, 8, 10, 12, 14], [1, 2, 3, 4, 15]];
const BOXES = [[2, 3, 4], [3, 4, 5], [2, 5, 6], [4, 4, 3], [5, 3, 2]];
const EDGES = [
  [[3, 2], [2, 1], [1, 2]],
  [[5, 2], [2, 1], [1, 2]],
  [[1, 2], [4, 1], [3, 2]],
  [[3, 2], [4, 1], [1, 2]],
  [[5, 2], [2, 1], [3, 2]],
];
const feet = (e) => (e[1] === 1 ? String(e[0]) : e[0] > e[1] ? `${Math.floor(e[0] / e[1])} ${e[0] % e[1]}/${e[1]}` : `${e[0]}/${e[1]}`);

export const STRAND_LESSONS = {
  orderRational(k) {
    const set = ORDER_SETS[k];
    const sorted = [...set].sort((a, b) => a - b);
    const text = set.join(", ");
    return lesson(
      "Order numbers on a number line",
      "On a number line, numbers grow from left to right. A negative number farther from zero is less.",
      { type: "sequence", values: set, caption: `Numbers to order: ${text}` },
      [
        step(`Which number is the least in the list ${text}?`, sorted[0], "The least number is farthest to the left on a number line.", `${sorted[0]} is the least.`),
        step(`Which number is the greatest in the list ${text}?`, sorted.at(-1), "The greatest number is farthest to the right.", `${sorted.at(-1)} is the greatest.`),
        step(`How many numbers in the list ${text} are less than 0?`, set.filter((v) => v < 0).length, "Count the negative numbers.", `${set.filter((v) => v < 0).length} numbers are negative.`),
      ],
    );
  },
  percentWhole(k) {
    const [p, part] = PERCENTS[k];
    const groups = 100 / p;
    return lesson(
      "Build up to 100 percent",
      "If you know a part and its percent, build up to 100 percent to find the whole.",
      { type: "table", headers: ["Percent", "Amount"], rows: [[`${p}%`, part], ["100%", "?"]], caption: `${part} is ${p}% of the whole` },
      [
        step(`How many groups of ${p}% make 100%?`, groups, "Divide 100 by the percent.", `100 ÷ ${p} = ${groups}.`),
        step(`Each ${p}% is ${part}. What is ${part} × ${groups}?`, part * groups, "Multiply the amount for one group by the number of groups.", `${part} × ${groups} = ${part * groups}.`),
        step(`${part} is ${p}% of what number?`, part * groups, "The whole is 100%.", `The whole is ${part * groups}.`),
      ],
    );
  },
  equivalentExpression(k) {
    const [a, b, c] = EXPRESSIONS[k];
    return lesson(
      "Distribute, then combine like terms",
      "Equivalent expressions have the same value for every number you put in for the variable.",
      { type: "equations", lines: [`${a}(x + ${b}) + ${c}x`, `${a}x + ${a * b} + ${c}x`, "combine the x-terms"], caption: `${a}(x + ${b}) + ${c}x` },
      [
        step(`In ${a}(x + ${b}), what do you multiply ${b} by?`, a, "The number outside the parentheses multiplies every term inside.", `${a} multiplies both x and ${b}.`),
        step(`What is ${a} × ${b}?`, a * b, "Multiply the number outside by the number inside.", `${a} × ${b} = ${a * b}.`),
        step(`After you distribute and combine, ${a}(x + ${b}) + ${c}x has what coefficient on x?`, a + c, "Add the coefficients of the x-terms.", `${a} + ${c} = ${a + c}.`),
      ],
    );
  },
  writeInequality(k) {
    const [sentence, n, words, symbol, other, allowed] = INEQUALITIES[k];
    return lesson(
      "Turn words into an inequality",
      "An inequality describes every number that makes a statement true.",
      { type: "sequence", values: [n - 2, n - 1, n, n + 1, n + 2], caption: `Numbers near the boundary. ${sentence}` },
      [
        step(`${sentence} Is the number ${n} itself allowed?`, allowed, `Look at the words "${words}".`, `With "${words}", ${n} is ${allowed === "yes" ? "" : "not "}allowed.`, "choice", ["yes", "no"]),
        step(`Which symbol matches "${words}"?`, symbol, "Decide the direction, and whether the boundary is included.", `"${words}" uses ${symbol}.`, "choice", [symbol, other]),
        step("What is the boundary number in the inequality?", n, "It is the number in the sentence.", `The boundary is ${n}.`),
      ],
    );
  },
  dataDisplays(k) {
    const counts = BINS[k];
    const labels = ["0–4", "5–9", "10–14", "15–19"];
    return lesson(
      "Read a histogram",
      "A data display shows how the values are spread out. A histogram bar counts an interval.",
      { type: "dataTable", headers: ["Interval", "Number of values"], rows: labels.map((label, i) => [label, counts[i]]), caption: "A histogram written as a table" },
      [
        step(`How many values are in the interval ${labels[1]}?`, counts[1], "Read the count beside the interval.", `${counts[1]} values are in ${labels[1]}.`),
        step(`How many values are in ${labels[0]} and ${labels[1]} together?`, counts[0] + counts[1], "Add the two counts.", `${counts[0]} + ${counts[1]} = ${counts[0] + counts[1]}.`),
        step("How many values are in the whole data set?", sum(counts), "Add every interval's count.", `The counts add to ${sum(counts)}.`),
      ],
    );
  },
  centerSpread(k) {
    const data = DATA[k];
    const ordered = [...data].sort((a, b) => a - b);
    const mid = Math.floor(ordered.length / 2);
    const median = ordered.length % 2 ? ordered[mid] : (ordered[mid - 1] + ordered[mid]) / 2;
    const total = sum(data);
    return lesson(
      "Find the mean and the median",
      "A measure of center sums up the data with one number. Mean shares the total equally. Median is the middle value.",
      { type: "sequence", values: ordered, caption: `Data in order: ${ordered.join(", ")}` },
      [
        step(`What is the sum of the data ${ordered.join(", ")}?`, total, "Add every value.", `The sum is ${total}.`),
        step(`The sum is ${total} and there are ${data.length} values. What is the mean?`, total / data.length, "Divide the sum by how many values there are.", `${total} ÷ ${data.length} = ${total / data.length}.`),
        step(`What is the median of ${ordered.join(", ")}?`, median, "Find the middle value of the ordered data. With two middle values, find halfway between them.", `The median is ${median}.`),
      ],
    );
  },
  surfaceAreaNet(k) {
    const [l, w, h] = BOXES[k];
    const pair = [l * w, l * h, w * h];
    return lesson(
      "Add the areas of the faces",
      "A net unfolds a solid into flat faces. Surface area is the area of all the faces.",
      { type: "table", headers: ["Faces", "Area of one face"], rows: [["top and bottom", l * w], ["front and back", l * h], ["left and right", w * h]], caption: `Net of a ${l} by ${w} by ${h} prism` },
      [
        step(`What is the area of the top face, ${l} × ${w}?`, pair[0], "Multiply the two sides of the face.", `${l} × ${w} = ${pair[0]}.`),
        step(`Add one face from each of the three pairs: ${pair.join(" + ")}.`, sum(pair), "Add the three areas.", `The sum is ${sum(pair)}.`),
        step("A prism has two of each face. What is the surface area?", 2 * sum(pair), "Double the sum of the three areas.", `2 × ${sum(pair)} = ${2 * sum(pair)}.`),
      ],
    );
  },
  volumeFractional(k) {
    const [l, w, h] = EDGES[k];
    const base = times(l, w);
    const volume = times(base, h);
    const decimal = volume[0] / volume[1];
    return lesson(
      "Multiply three edges",
      "The volume of a rectangular prism is length × width × height, even when the edges are fractions.",
      { type: "table", headers: ["Edge", "Length (ft)"], rows: [["Length", feet(l)], ["Width", feet(w)], ["Height", feet(h)]], caption: "Edges of the prism" },
      [
        step(`Multiply the length and the width: ${frac(l)} × ${frac(w)}. What is the area of the base?`, frac(base), "Multiply the numerators, then the denominators, and simplify.", `${frac(l)} × ${frac(w)} = ${frac(base)}.`, base[1] / gcd(...base) === 1 ? "number" : "fraction"),
        step(`Now multiply the base area ${frac(base)} by the height ${frac(h)}. What is the volume in cubic feet?`, frac(volume), "Multiply the base area by the height.", `${frac(base)} × ${frac(h)} = ${frac(volume)}.`, volume[1] / gcd(...volume) === 1 ? "number" : "fraction"),
        step("Write that volume as a decimal.", decimal, "Divide the numerator by the denominator.", `${frac(volume)} = ${decimal}.`),
      ],
    );
  },

  likeTerms(k) {
    const [a, b, c, d, minus] = [[5, 3, 2, 4, false], [4, 6, 1, 2, false], [7, 5, 3, 2, true], [6, 9, 2, 4, true], [8, 1, 3, 5, false]][k];
    const x = minus ? a - c : a + c;
    const n = minus ? b - d : b + d;
    const expr = minus ? `${a}x + ${b} − ${c}x − ${d}` : `${a}x + ${b} + ${c}x + ${d}`;
    return lesson(
      "Combine like terms",
      "Like terms have the same letter part. Add or subtract the numbers in front of the letter, and the plain numbers.",
      { type: "equations", lines: [expr, `(${a} ${minus ? "−" : "+"} ${c})x + (${b} ${minus ? "−" : "+"} ${d})`, "?x + ?"], caption: expr },
      [
        step(`In ${expr}, what do you get when you combine the x-terms' numbers in front: ${a} ${minus ? "−" : "+"} ${c}?`, x, "Keep the sign in front of each term.", `${a} ${minus ? "−" : "+"} ${c} = ${x}.`),
        step(`What do you get when you combine the plain numbers: ${b} ${minus ? "−" : "+"} ${d}?`, n, "Combine only the terms with no letter.", `${b} ${minus ? "−" : "+"} ${d} = ${n}.`),
        step(`Check: what is the value of ${x}x + ${n} when x = 2?`, 2 * x + n, "Replace x with 2, then multiply and add.", `${x} × 2 + ${n} = ${2 * x + n}.`),
      ],
    );
  },
  circumference(k) {
    const r = [3, 5, 7, 10, 4][k];
    const c = Number((2 * 3.14 * r).toFixed(2));
    return lesson(
      "Walk around a circle",
      "The circumference is the distance around a circle: C = π × d, or C = 2 × π × r.",
      { type: "shape", shape: "circle", a: r, caption: `Radius ${r} cm` },
      [
        step(`The radius is ${r} cm. What is the diameter?`, 2 * r, "The diameter is two radii.", `2 × ${r} = ${2 * r}.`),
        step(`Use C = 3.14 × d. What is 3.14 × ${2 * r}?`, c, "Multiply the diameter by 3.14.", `3.14 × ${2 * r} = ${c}.`),
        step(`Check with the other formula. What is 2 × 3.14 × ${r}?`, c, "Both formulas give the same distance.", `2 × 3.14 × ${r} = ${c}.`),
      ],
    );
  },
  angleFacts(k) {
    const [a, b] = [[50, 70], [40, 65], [35, 80], [60, 60], [45, 85]][k];
    return lesson(
      "Use the angle total",
      "The angles of a triangle total 180°. Subtract the angles you know to find the missing one.",
      { type: "equations", lines: [`${a}° + ${b}° + ?° = 180°`], caption: `A triangle with angles ${a}° and ${b}°` },
      [
        step("What do the three angles of a triangle add to?", 180, "It is the same for every triangle.", "The angles of a triangle total 180°."),
        step(`What is ${a} + ${b}?`, a + b, "Add the two angles you know.", `${a} + ${b} = ${a + b}.`),
        step("What is the measure of the third angle?", 180 - a - b, "Subtract the angles you know from the total.", `180 − ${a + b} = ${180 - a - b}.`),
      ],
    );
  },
  sampling(k) {
    const [s, y, p] = [[20, 5, 200], [25, 10, 500], [40, 15, 600], [50, 20, 300], [20, 3, 400]][k];
    const groups = p / s;
    return lesson(
      "Scale up from a sample",
      "A random sample is a small copy of the whole group. Use the same fraction for the whole group.",
      { type: "dataTable", headers: ["Group", "Number counted", "Number with the trait"], rows: [["Sample", s, y], ["Whole group", p, "?"]], caption: "Predict from a sample" },
      [
        step(`How many times does the sample size ${s} fit into ${p}?`, groups, "Divide the whole group by the sample size.", `${p} ÷ ${s} = ${groups}.`),
        step(`Each group of ${s} has about ${y} with the trait. What is ${y} × ${groups}?`, y * groups, "Multiply the number with the trait by the number of groups.", `${y} × ${groups} = ${y * groups}.`),
        step(`About how many of ${p} would you predict have the trait?`, y * groups, "A prediction scales the sample up.", `About ${y * groups}.`),
      ],
    );
  },
  sciOps(k) {
    const [a, b, m, n] = [[2, 3, 4, 5], [3, 3, 2, 6], [2, 4, 5, 3], [1, 7, 6, 2], [4, 2, 3, 3]][k];
    const sup = (v) => String(v).replace(/./g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]);
    return lesson(
      "Multiply in scientific notation",
      "Multiply the numbers in front. Add the exponents of 10.",
      { type: "table", headers: ["Number in front", "Power of 10"], rows: [[a, `10${sup(m)}`], [b, `10${sup(n)}`]], caption: `(${a} × 10${sup(m)}) × (${b} × 10${sup(n)})` },
      [
        step(`What is ${a} × ${b}, the product of the numbers in front?`, a * b, "Multiply the two numbers in front.", `${a} × ${b} = ${a * b}.`),
        step(`What do you get when you add the exponents ${m} and ${n}?`, m + n, "Powers of 10 multiply by adding exponents.", `${m} + ${n} = ${m + n}.`),
        step(`In the product, what is the exponent of 10?`, m + n, "Use the sum of the exponents.", `The product is ${a * b} × 10${sup(m + n)}.`),
      ],
    );
  },
  volumeRound(k) {
    const [r, h] = [[2, 5], [3, 5], [4, 3], [5, 2], [3, 10]][k];
    const base = Number((3.14 * r * r).toFixed(2));
    const volume = Number((3.14 * r * r * h).toFixed(2));
    return lesson(
      "Base area times height",
      "A cylinder's volume is the area of its circular base times its height.",
      { type: "shape", shape: "circle", a: r, caption: `Circular base, radius ${r} cm` },
      [
        step(`What is the radius squared, ${r} × ${r}?`, r * r, "Square the radius, do not double it.", `${r} × ${r} = ${r * r}.`),
        step(`What is the base area, 3.14 × ${r * r}?`, base, "Multiply π by the radius squared.", `3.14 × ${r * r} = ${base}.`),
        step(`The cylinder is ${h} cm tall. What is its volume, ${base} × ${h}?`, volume, "Multiply the base area by the height.", `${base} × ${h} = ${volume}.`),
      ],
    );
  },
  transformPoint(k) {
    const [x, y, dx, dy] = [[2, 3, 4, -1], [-3, 1, 2, 5], [4, -2, -5, 3], [-1, -4, 3, 2], [1, 2, -3, -3]][k];
    return lesson(
      "Slide a point",
      "A translation slides every point the same distance in the same direction. The size and shape do not change.",
      { type: "coordinate", points: [[x, y]], caption: `Slide (${x}, ${y}) by (${dx}, ${dy})` },
      [
        step(`Add ${dx} to the x-coordinate: ${x} + (${dx}). What is the new x?`, x + dx, "Right is positive, left is negative.", `${x} + (${dx}) = ${x + dx}.`),
        step(`Add ${dy} to the y-coordinate: ${y} + (${dy}). What is the new y?`, y + dy, "Up is positive, down is negative.", `${y} + (${dy}) = ${y + dy}.`),
        step("After a slide, is the image the same size as the original?", "yes", "A slide moves the point; it does not stretch it.", "A translation keeps the size and shape.", "choice", ["yes", "no"]),
      ],
    );
  },
  compareFunctions(k) {
    const [m1, b1, m2, b2] = [[2, 1, 4, 0], [3, 0, 1, 5], [1, 2, 3, 1], [5, 0, 2, 3], [4, 1, 3, 2]][k];
    const answer = m1 === m2 ? "The rates are equal" : m1 > m2 ? "A" : "B";
    return lesson(
      "Compare two rates of change",
      "The rate of change of a function is its slope. Find it for each function, then compare.",
      { type: "coordinate", points: [[0, b1], [1, b1 + m1]], caption: `Function A: y = ${m1}x + ${b1}`, slope: true },
      [
        step(`Function A is y = ${m1}x + ${b1}. What is its rate of change?`, m1, "The number multiplying x is the rate of change.", `The rate of change of A is ${m1}.`),
        step(`Function B is y = ${m2}x + ${b2}. What is its rate of change?`, m2, "Read the number multiplying x.", `The rate of change of B is ${m2}.`),
        step(`Compare ${m1} and ${m2}. Which function has the greater rate of change?`, answer, "Compare the rates, not the y-intercepts.", answer === "The rates are equal" ? "The rates are equal." : `Function ${answer} changes faster.`, "choice", ["A", "B", "The rates are equal"]),
      ],
    );
  },

  fractionLine(k) {
    const [d, n] = [[4, 3], [2, 1], [3, 2], [6, 5], [8, 3]][k];
    return lesson(
      "Name a point on a number line",
      "On a number line from 0 to 1, count the equal parts. The bottom number is how many parts. The top number is how many parts from 0.",
      { type: "numberline", start: 0, jumps: Array(n).fill(1), caption: `${n} of ${d} equal parts from 0` },
      [
        step(`The line from 0 to 1 is cut into ${d} equal parts. What is the bottom number of the fraction?`, d, "Count the equal parts of the whole line.", `The bottom number is ${d}.`),
        step(`Point P is ${n} parts from 0. What is the top number?`, n, "Count the parts from 0 to P.", `The top number is ${n}.`),
        step("Write the fraction for P as top over bottom.", `${n}/${d}`, "Parts from 0 over parts in the whole.", `${n}/${d}`, "fraction"),
      ],
    );
  },
  scaledGraph(k) {
    const [s, a, b] = [[5, 6, 4], [2, 7, 3], [10, 3, 5], [5, 8, 2], [2, 9, 6]][k];
    return lesson(
      "Read a scaled bar graph",
      "In a scaled graph, each square stands for more than one. Multiply the squares by the scale.",
      { type: "bars", labels: ["Class A", "Class B"], values: [a, b], caption: `Each square stands for ${s}` },
      [
        step(`Each square stands for ${s}. Class A's bar has ${a} squares. What is ${a} × ${s}?`, a * s, "Multiply the squares by the scale.", `${a} × ${s} = ${a * s}.`),
        step(`Class B's bar has ${b} squares. What is ${b} × ${s}?`, b * s, "Use the same scale.", `${b} × ${s} = ${b * s}.`),
        step("How many more does Class A have than Class B?", (a - b) * s, "Subtract the two totals.", `${a * s} − ${b * s} = ${(a - b) * s}.`),
      ],
    );
  },
  linePlot(k) {
    const counts = [[2, 3, 1], [1, 4, 2], [3, 2, 2], [2, 2, 4], [1, 3, 3]][k];
    return lesson(
      "Count the dots on a line plot",
      "Each dot on a line plot is one measurement. Count the dots to answer the question.",
      { type: "dataTable", headers: ["Length (inches)", "Dots"], rows: [["1/4", counts[0]], ["1/2", counts[1]], ["3/4", counts[2]]], caption: "A line plot written as a table" },
      [
        step("How many dots are at 1/2 inch?", counts[1], "Read the dots beside 1/2.", `${counts[1]} dots.`),
        step("How many leaves are longer than 1/4 inch?", counts[1] + counts[2], "Add the dots to the right of 1/4.", `${counts[1]} + ${counts[2]} = ${counts[1] + counts[2]}.`),
        step("How many leaves were measured in all?", sum(counts), "Add every dot.", `${counts.join(" + ")} = ${sum(counts)}.`),
      ],
    );
  },
  mixedNumber(k) {
    const [d, w, r] = [[4, 3, 1], [5, 2, 3], [3, 4, 2], [8, 1, 5], [6, 2, 1]][k];
    const n = w * d + r;
    return lesson(
      "Wholes and parts",
      "A mixed number shows wholes and a fraction. Each whole is made of as many parts as the bottom number.",
      { type: "table", headers: ["Wholes", "Extra parts", "Parts in each whole"], rows: [[w, r, d]], caption: `${w} ${r}/${d}` },
      [
        step(`Each whole has ${d} parts. How many parts are in ${w} wholes?`, w * d, "Multiply the wholes by the parts in each whole.", `${w} × ${d} = ${w * d}.`),
        step(`Add the ${r} extra parts. How many parts in all?`, n, "Add the extra parts.", `${w * d} + ${r} = ${n}.`),
        step(`Write ${w} ${r}/${d} as an improper fraction.`, `${n}/${d}`, "Parts in all over the parts in each whole.", `${n}/${d}`, "fraction"),
      ],
    );
  },
  angleMeasure(k) {
    const [a, b] = [[30, 45], [25, 55], [40, 20], [60, 15], [35, 50]][k];
    return lesson(
      "Add angle measures",
      "When angles are joined with no gap, their measures add. A right angle is 90°.",
      { type: "equations", lines: [`${a}° + ${b}° = ?`], caption: `Two joined angles: ${a}° and ${b}°` },
      [
        step(`What is ${a} + ${b}?`, a + b, "Add the two measures.", `${a} + ${b} = ${a + b}.`),
        step("How many degrees are in a right angle?", 90, "A right angle is a quarter turn.", "A right angle is 90°."),
        step(`How many degrees are left in a right angle after ${a}°?`, 90 - a, "Subtract from 90.", `90 − ${a} = ${90 - a}.`),
      ],
    );
  },
  coordPlane(k) {
    const [x, y] = [[3, 4], [5, 2], [1, 6], [7, 3], [2, 8]][k];
    return lesson(
      "Right first, then up",
      "An ordered pair is (right, up). Start at the origin, move right for the first number, then up for the second.",
      { type: "coordinate", points: [[x, y]], caption: `The point (${x}, ${y})` },
      [
        step(`How many units right is the point (${x}, ${y}) from the origin?`, x, "The first number is the x-coordinate.", `${x} units right.`),
        step(`How many units up is the point (${x}, ${y}) from the origin?`, y, "The second number is the y-coordinate.", `${y} units up.`),
        step(`The point moves 2 units right. What is its new x-coordinate?`, x + 2, "Moving right adds to x.", `${x} + 2 = ${x + 2}.`),
      ],
    );
  },
  orderOps5(k) {
    const [a, b, c] = [[3, 4, 2], [5, 2, 6], [2, 6, 3], [4, 3, 5], [6, 2, 4]][k];
    return lesson(
      "Parentheses, then multiply, then add",
      "Parentheses come first. Then multiply and divide. Then add and subtract.",
      { type: "equations", lines: [`${a} + ${b} × (${c} + 1)`, `${a} + ${b} × ${c + 1}`, `${a} + ${b * (c + 1)}`], caption: `${a} + ${b} × (${c} + 1)` },
      [
        step(`What is the value inside the parentheses, ${c} + 1?`, c + 1, "Parentheses first.", `${c} + 1 = ${c + 1}.`),
        step(`What is ${b} × ${c + 1}?`, b * (c + 1), "Multiply before you add.", `${b} × ${c + 1} = ${b * (c + 1)}.`),
        step(`What is the value of ${a} + ${b} × (${c} + 1)?`, a + b * (c + 1), "Add last.", `${a} + ${b * (c + 1)} = ${a + b * (c + 1)}.`),
      ],
    );
  },

  hiddenParts(k) {
    const [total, shown] = [[5, 2], [6, 4], [7, 3], [8, 5], [10, 6]][k];
    return lesson(
      "Find the hidden part",
      "A number is made of two parts. One part shows. One part is hiding.",
      { type: "counters", total, filled: shown, caption: `${shown} counters show out of ${total}` },
      [
        step(`There are ${total} counters in all. How many counters are there in the whole?`, total, "Look at the whole group.", `The whole is ${total}.`),
        step(`${shown} counters show. How many do you see?`, shown, "Count the counters you can see.", `You see ${shown}.`),
        step(`How many counters are hiding?`, total - shown, `What do you add to ${shown} to make ${total}?`, `${shown} and ${total - shown} make ${total}.`),
      ],
    );
  },
  shapeFacts(k) {
    const [name, sides] = [["triangle", 3], ["square", 4], ["rectangle", 4], ["pentagon", 5], ["hexagon", 6]][k];
    return lesson(
      "Count sides and corners",
      "Flat shapes have sides and corners. Count each one only one time.",
      { type: "sequence", values: Array.from({ length: sides }, (_, i) => i + 1), caption: `Trace a ${name}: one number for each side` },
      [
        step(`How many sides does a ${name} have?`, sides, "Trace the shape and count each side one time.", `A ${name} has ${sides} sides.`),
        step(`A ${name} has the same number of corners as sides. How many corners does it have?`, sides, "Each corner is where two sides meet.", `A ${name} has ${sides} corners.`),
        step(`How many sides do 2 ${name}s have in all?`, sides * 2, "Add the sides of both shapes.", `${sides} + ${sides} = ${sides * 2}.`),
      ],
    );
  },
  equalShares(k) {
    const [d, eaten] = [[2, 1], [3, 1], [4, 1], [4, 3], [3, 2]][k];
    return lesson(
      "Equal shares make a whole",
      "Equal shares are the same size. All the equal shares put together make the whole.",
      { type: "partition", labels: Array.from({ length: d }, (_, i) => `Share ${i + 1}`), values: Array(d).fill(1), caption: `A whole cut into ${d} equal shares` },
      [
        step(`A pizza is cut into ${d} equal shares. How many shares make the whole pizza?`, d, "Count all the equal shares.", `${d} shares make the whole.`),
        step(`${eaten} ${eaten === 1 ? "share is" : "shares are"} eaten. How many shares are left?`, d - eaten, "Take away the shares that were eaten.", `${d} − ${eaten} = ${d - eaten}.`),
        step(`Each share is 3 inches of rope. How long is the whole rope with ${d} shares?`, d * 3, "Add the equal pieces together.", `${d} × 3 = ${d * 3}.`),
      ],
    );
  },
  doublesNear(k) {
    const a = [3, 4, 5, 6, 7][k];
    return lesson(
      "Use a double to help",
      "A double adds the same number twice. A near double is a double with one more or one less.",
      { type: "pairs", total: a * 2, caption: `${a} + ${a}` },
      [
        step(`What is ${a} + ${a}?`, 2 * a, "A double adds the same number twice.", `${a} + ${a} = ${2 * a}.`),
        step(`${a} + ${a + 1} is one more than the double. What is ${a} + ${a + 1}?`, 2 * a + 1, "Add one to the double.", `${2 * a} + 1 = ${2 * a + 1}.`),
        step(`What is ${a + 1} + ${a + 1}?`, 2 * a + 2, "That is the next double.", `${a + 1} + ${a + 1} = ${2 * a + 2}.`),
      ],
    );
  },
  arrays(k) {
    const [r, c] = [[2, 3], [3, 4], [4, 2], [3, 5], [5, 4]][k];
    return lesson(
      "Add the rows",
      "An array has equal rows. Add the same number once for each row.",
      { type: "array", a: r, b: c, split: r, caption: `${r} rows of ${c}` },
      [
        step(`How many rows does the array have?`, r, "Count the rows.", `There are ${r} rows.`),
        step(`How many dots are in each row?`, c, "Count one row.", `Each row has ${c} dots.`),
        step(`How many dots are there in all?`, r * c, `Add ${c} once for every row.`, `${Array(r).fill(c).join(" + ")} = ${r * c}.`),
      ],
    );
  },
  timeFive(k) {
    const m = [3, 5, 6, 9, 11][k];
    return lesson(
      "Count by fives on the clock",
      "Each number on a clock is 5 minutes. Count by fives to tell the minutes.",
      { type: "clock", hour: 3, minute: m * 5, caption: `The minute hand points to the ${m}` },
      [
        step(`The minute hand points to the ${m}. How many fives is that?`, m, "Each number is one five.", `The hand is at the ${m}.`),
        step(`Count by fives ${m} times. How many minutes after the hour is that?`, 5 * m, "Count by fives.", `${5 * m} minutes.`),
        step(`How many more minutes until the next hour?`, 60 - 5 * m, "The hour has 60 minutes.", `60 − ${5 * m} = ${60 - 5 * m}.`),
      ],
    );
  },
  mentalTens(k) {
    const n = [354, 482, 617, 235, 760][k];
    return lesson(
      "Change one place",
      "10 more or less changes only the tens place. 100 more or less changes only the hundreds place.",
      { type: "place", numbers: [String(n)], caption: String(n) },
      [
        step(`What is 10 more than ${n}?`, n + 10, "Add one to the tens place.", `${n} + 10 = ${n + 10}.`),
        step(`What is 10 less than ${n}?`, n - 10, "Take one away from the tens place.", `${n} − 10 = ${n - 10}.`),
        step(`What is 100 more than ${n}?`, n + 100, "Add one to the hundreds place.", `${n} + 100 = ${n + 100}.`),
      ],
    );
  },
};
