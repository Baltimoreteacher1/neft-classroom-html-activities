// An independent solver for the strand skills added in 2026-11 (Grades 6-8, and later bands). Like
// mini-lesson-solver.mjs it never calls a generator: it reads the question text and recomputes the answer.
// solveStrand(question) -> exact Rat, a string, or null when the shape is not covered. Strings are in the lab's
// own written form (spaces, "−" for a minus) because several skills answer with an expression, a list or a point.
import { evaluateExpression, Rat } from "../../scripts/lib/rational.mjs";

const val = (text) => evaluateExpression(String(text));
const int = (n) => Rat.from(BigInt(n));
const nums = (text) => text.split(/,\s*/).map((v) => Number(v.replace("−", "-")));
const sorted = (values) => [...values].sort((a, b) => a - b);
const sumOf = (values) => values.reduce((a, b) => a + b, 0);
const fix = (n) => String(Number(n.toFixed(4))).replace("-", "−");
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const middle = (v) =>
  v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
const decimal = (n) => val(String(n));

// "3 1/2", "1/2", "4", "−3/4", "0.75" -> a Rat
const readNumber = (text) => {
  const t = text.trim().replace("−", "-");
  const mixed = t.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (mixed) return val(`${mixed[1]}(${mixed[2]}+${mixed[3]}/${mixed[4]})`);
  return val(t);
};

const FORMS = [
  [/^Find the mean of the data: (.+)\.$/, (d) => val(`(${sumOf(nums(d))})/${nums(d).length}`)],
  [/^Find the median of the data: (.+)\.$/, (d) => decimal(middle(sorted(nums(d))))],
  [
    /^Find the mean absolute deviation \(MAD\) of the data: (.+)\.$/,
    (d) => {
      const v = nums(d);
      const mean = val(`(${sumOf(v)})/${v.length}`);
      const dist = v.map((x) => {
        const gap = int(x).sub(mean);
        return gap.n < 0n ? new Rat(-gap.n, gap.d) : gap;
      });
      return dist.reduce((a, b) => a.add(b)).div(int(v.length));
    },
  ],
  [
    /^Find the interquartile range \(IQR\) of the data: (.+)\.$/,
    (d) => {
      const v = sorted(nums(d));
      const half = Math.floor(v.length / 2);
      return decimal(middle(v.slice(v.length - half)) - middle(v.slice(0, half)));
    },
  ],
  [
    /^A histogram groups the data (.+) in intervals of \d+\. How many values are in the interval (\d+)–(\d+)\?$/,
    (d, lo, hi) => int(nums(d).filter((x) => x >= Number(lo) && x <= Number(hi)).length),
  ],
  [
    /^A frequency table shows how many (?:pets|books) students have\. (.+)\. How many students were asked\?$/,
    (rows) => int(sumOf(rows.split("; ").map((r) => Number(r.split(": ")[1])))),
  ],
  [
    /^Use the distributive property to write (\d+)\(x \+ (\d+)\) without parentheses\.$/,
    (a, b) => `${a}x + ${a * b}`,
  ],
  [/^Combine like terms: (\d+)x \+ (\d+) \+ (\d+)x\.$/, (a, b, c) => `${+a + +c}x + ${b}`],
  [
    /^Factor (\d+)x \+ (\d+) using the greatest common factor\.$/,
    (a, b) => {
      const g = gcd(+a, +b);
      return `${g}(${+a / g === 1 ? "" : +a / g}x + ${+b / g})`;
    },
  ],
  [
    /^Write (\d+)\(x \+ (\d+)\) \+ (\d+)x as an equivalent expression with like terms combined\.$/,
    (a, b, c) => `${+a + +c}x + ${a * b}`,
  ],
  [
    /^Order from least to greatest: (.+)\.$/,
    (list) => {
      const tokens = list.split(", ");
      return tokens
        .map((token) => ({ token, v: readNumber(token) }))
        .sort((a, b) => (a.v.sub(b.v).n > 0n ? 1 : -1))
        .map((x) => x.token)
        .join(", ");
    },
  ],
  [/^(\d+) is (\d+)% of what number\?$/, (part, pct) => val(`${part}*100/${pct}`)],
  [
    /^Use the net of a rectangular prism that is (\d+) in long, (\d+) in wide and (\d+) in tall\. What is the surface area\?$/,
    (l, w, h) => val(`2*(${l}*${w}+${l}*${h}+${w}*${h})`),
  ],
  [
    /^The net of a square pyramid has a square base with side (\d+) cm and four triangles, each with base \d+ cm and height (\d+) cm\. What is the surface area\?$/,
    (s, h) => val(`${s}*${s}+4*(${s}*${h}/2)`),
  ],
  [
    /^A rectangular prism is (.+?) ft long, (.+?) ft wide and (.+?) ft tall\. What is its volume\?$/,
    (l, w, h) => readNumber(l).mul(readNumber(w)).mul(readNumber(h)),
  ],

  // ---- Grade 7 and 8 strands -------------------------------------------------------------------------------------
  [
    /^Simplify the expression: (.+)\.$/,
    (expr) => {
      // read signed terms: "5x + 3 − 2x − 4"
      let x = 0;
      let k = 0;
      for (const m of expr.replace(/−/g, "-").matchAll(/([+-]?)\s*(\d*)(x?)/g)) {
        if (!m[2] && !m[3]) continue;
        const sign = m[1] === "-" ? -1 : 1;
        const v = sign * (m[2] === "" ? 1 : Number(m[2]));
        if (m[3]) x += v;
        else k += v;
      }
      const lead = x === 1 ? "x" : x === -1 ? "−x" : `${String(x).replace("-", "−")}x`;
      return k === 0 ? lead : `${lead} ${k < 0 ? "−" : "+"} ${Math.abs(k)}`;
    },
  ],
  [
    /^A circle has a radius of (\d+) cm\. Use 3\.14 for π\. What is its circumference\?$/,
    (r) => val(`2*3.14*${r}`),
  ],
  [
    /^A circle has a diameter of (\d+) cm\. Use 3\.14 for π\. What is its circumference\?$/,
    (d) => val(`3.14*${d}`),
  ],
  [
    /^The circumference of a circle is ([\d.]+) cm\. Use 3\.14 for π\. What is its radius\?$/,
    (c) => val(`${c}/(2*3.14)`),
  ],
  [
    /^The circumference of a circle is ([\d.]+) cm\. Use 3\.14 for π\. What is its diameter\?$/,
    (c) => val(`${c}/3.14`),
  ],
  [
    /^Two angles of a triangle measure (\d+)° and (\d+)°\. What is the third angle\?$/,
    (a, b) => val(`180-${a}-${b}`),
  ],
  [
    /^Two angles sit side by side on a straight line\. One measures (\d+)°\./,
    (a) => val(`180-${a}`),
  ],
  [
    /^Two lines cross\. One angle measures (\d+)°\. What does the angle directly across from it measure\?$/,
    (a) => val(a),
  ],
  [
    /^Two lines cross\. One angle measures (\d+)°\. What does an angle next to it measure\?$/,
    (a) => val(`180-${a}`),
  ],
  [
    /^The angles of a triangle measure x°, (\d+)x° and 2x°\. What is x\?$/,
    (m) => val(`180/(${m}+3)`),
  ],
  [
    /^A random sample of (\d+) \w+ found that (\d+) .+? About how many of (\d+) \w+ would you predict/,
    (s, y, p) => val(`${p}*${y}/${s}`),
  ],
  [
    /^A cylinder has a radius of (\d+) cm and a height of (\d+) cm\. Use 3\.14 for π\. What is its volume\?$/,
    (r, h) => val(`3.14*${r}*${r}*${h}`),
  ],
  [
    /^A cone has a radius of (\d+) cm and a height of (\d+) cm\. Use 3\.14 for π\. What is its volume\?$/,
    (r, h) => val(`3.14*${r}*${r}*${h}/3`),
  ],
  [
    /^A sphere has a radius of (\d+) cm\. Use 3\.14 for π\. What is its volume\?$/,
    (r) => val(`4/3*3.14*${r}*${r}*${r}`),
  ],
  [
    /^Translate \((-?\d+), (-?\d+)\) (\d+) (right|left) and (\d+) (up|down)\.$/,
    (x, y, a, h, b, v) => `(${+x + (h === "right" ? +a : -a)}, ${+y + (v === "up" ? +b : -b)})`,
  ],
  [
    /^Rotate \((-?\d+), (-?\d+)\) 90° counterclockwise about the origin\.$/,
    (x, y) => `(${-Number(y) || 0}, ${x})`,
  ],
  [
    /^Rotate \((-?\d+), (-?\d+)\) 180° about the origin\.$/,
    (x, y) => `(${-Number(x) || 0}, ${-Number(y) || 0})`,
  ],
  [
    /^Dilate \((-?\d+), (-?\d+)\) by a scale factor of ([\d.]+) from the origin\.$/,
    (x, y, k) => `(${Number(x) * Number(k)}, ${Number(y) * Number(k)})`,
  ],
  [
    /^Function A is y = (\d*)x \+ (\d+)\. Function B (.+) Which function has the greater rate of change\?$/,
    (m1, _b1, rest) => {
      let m2;
      let g;
      if ((g = rest.match(/is a line through \(0, (\d+)\) and \((\d+), (\d+)\)\./)))
        m2 = (Number(g[3]) - Number(g[1])) / Number(g[2]);
      else if ((g = rest.match(/has a rate of change of (\d+) and/))) m2 = Number(g[1]);
      else if ((g = rest.match(/is y = (\d*)x \+ \d+\./))) m2 = g[1] === "" ? 1 : Number(g[1]);
      else return null;
      const rate1 = m1 === "" ? 1 : Number(m1);
      return rate1 === m2 ? "The rates are equal" : rate1 > m2 ? "A" : "B";
    },
  ],
  [
    /^Write the (product|quotient|sum) in scientific notation: \((.+?) × 10(.+?)\) (×|÷|\+) \((.+?) × 10(.+?)\)$/,
    (_word, a, e1, op, b, e2) => {
      const sup = (s) =>
        Number(s.replace(/⁻/g, "-").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)));
      const [p, q, ea, eb] = [val(a), val(b), sup(e1), sup(e2)];
      let coefficient = op === "÷" ? p.div(q) : op === "×" ? p.mul(q) : p.add(q);
      let exponent = op === "÷" ? ea - eb : op === "×" ? ea + eb : ea;
      const ten = int(10);
      while (coefficient.sub(ten).n >= 0n) {
        coefficient = coefficient.div(ten);
        exponent += 1;
      }
      const digits = String(Number(coefficient.n) / Number(coefficient.d)).replace("-", "−");
      const superscript = String(exponent).replace(
        /./g,
        (c) =>
          ({
            "-": "⁻",
            0: "⁰",
            1: "¹",
            2: "²",
            3: "³",
            4: "⁴",
            5: "⁵",
            6: "⁶",
            7: "⁷",
            8: "⁸",
            9: "⁹",
          })[c],
      );
      return `${digits} × 10${superscript}`;
    },
  ],

  // ---- Grade 3-5 strands -----------------------------------------------------------------------------------------
  [
    /^A number line from 0 to 1 is cut into (\d+) equal parts\. Point P is at mark (\d+), counting from 0\. What fraction does P show\?$/,
    (d, n) => val(`${n}/${d}`),
  ],
  [
    /^A number line from 0 to 1 is cut into \d+ equal parts\. At which mark is the point (\d+)\/\d+\? Count from 0\.$/,
    (n) => int(n),
  ],
  [
    /^In a scaled bar graph, each square stands for (\d+) \w+\. The bar for Class A has (\d+) squares\./,
    (s, a) => val(`${s}*${a}`),
  ],
  [
    /^In a scaled bar graph, each square stands for (\d+) \w+\. Class A's bar has (\d+) squares and Class B's bar has (\d+) squares\./,
    (s, hi, lo) => val(`${s}*(${hi}-${lo})`),
  ],
  [
    /^A line plot shows the lengths of leaves\. 1\/4 inch: (\d+) dots\. 1\/2 inch: (\d+) dots\. 3\/4 inch: (\d+) dots\. How many leaves were measured\?$/,
    (a, b, c) => val(`${a}+${b}+${c}`),
  ],
  [
    /^A line plot shows the lengths of leaves\. 1\/4 inch: \d+ dots\. 1\/2 inch: (\d+) dots\. 3\/4 inch: (\d+) dots\. How many leaves are longer than 1\/4 inch\?$/,
    (b, c) => val(`${b}+${c}`),
  ],
  [
    /^A line plot shows the lengths of leaves\. 1\/4 inch: [1-9]\d* dots\. 1\/2 inch: \d+ dots\. 3\/4 inch: [1-9]\d* dots\. How many inches longer is the longest leaf than the shortest leaf\?$/,
    () => val("3/4-1/4"),
  ],
  [/^Write (\d+)\/(\d+) as a mixed number\.$/, (n, d) => `${Math.floor(n / d)} ${n % d}/${d}`],
  [
    /^Write (\d+) (\d+)\/(\d+) as an improper fraction\.$/,
    (w, n, d) => `${Number(w) * Number(d) + Number(n)}/${d}`,
  ],
  [/^An angle turns through 1\/(\d+) of a full circle\./, (d) => val(`360/${d}`)],
  [
    /^Two angles are placed side by side with no gap\. They measure (\d+)° and (\d+)°\./,
    (a, b) => val(`${a}+${b}`),
  ],
  [
    /^A right angle \(90°\) is split into two angles\. One angle measures (\d+)°\./,
    (a) => val(`90-${a}`),
  ],
  [
    /^A straight angle \(180°\) is split into two angles\. One angle measures (\d+)°\./,
    (a) => val(`180-${a}`),
  ],
  [
    /^Start at the origin \(0, 0\)\. Move (\d+) units right and (\d+) units up\./,
    (a, b) => `(${a}, ${b})`,
  ],
  [
    /^Two points are on the same horizontal line: \((\d+), \d+\) and \((\d+), \d+\)\./,
    (x1, x2) => val(`${x2}-${x1}`),
  ],
  [
    /^A point is at \((\d+), (\d+)\)\. It moves (\d+) units right and (\d+) units up\./,
    (x, y, a, b) => `(${Number(x) + Number(a)}, ${Number(y) + Number(b)})`,
  ],
  [/^Evaluate: (.+)\.$/, (expr) => val(expr)],

  // ---- Kindergarten to Grade 2 strands ---------------------------------------------------------------------------
  [
    /^There are (\d+) [a-z]+ in all\. (\d+) are showing\. How many are hiding\?$/,
    (t, s) => val(`${t}-${s}`),
  ],
  [
    /^How many (corners|sides) does an? (triangle|square|rectangle|pentagon|hexagon|octagon|trapezoid) have\?$/,
    (_what, shape) =>
      int(
        { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8, trapezoid: 4 }[
          shape
        ],
      ),
  ],
  [
    /^How many (flat faces|edges|corners) does an? (cube|rectangular prism) have\?$/,
    (what) => int({ "flat faces": 6, edges: 12, corners: 8 }[what]),
  ],
  [
    /^A pizza is cut into (\d+) equal shares\. (\d+) (?:share is|shares are) eaten\. How many shares are left\?$/,
    (d, n) => val(`${d}-${n}`),
  ],
  [
    /^A rope is cut into (\d+) equal pieces\. Each piece is (\d+) inches long\./,
    (d, each) => val(`${d}*${each}`),
  ],
  [/^What is (\d+) \+ (\d+)\?(?: Use a double to help\.)?$/, (a, b) => val(`${a}+${b}`)],
  [/^An array has (\d+) rows with (\d+) dots in each row\./, (r, c) => val(`${r}*${c}`)],
  [/^(\d+) dots are in (\d+) equal rows\./, (total, r) => val(`${total}/${r}`)],
  [
    /^The minute hand points to the (\d+)\. How many minutes after the hour is that\?$/,
    (k) => val(`5*${k}`),
  ],
  [
    /^How many minutes pass from \d+:(\d+) to \d+:(\d+)\?$/,
    (a, b) => val(`${Number(b)}-${Number(a)}`),
  ],
  [
    /^What is (10|100) (more|less) than (\d+)\?$/,
    (step, dir, n) => val(`${n}${dir === "more" ? "+" : "-"}${step}`),
  ],
];

// Inequality words -> symbol, read from the sentence rather than from any generator table.
function inequality(text) {
  const m = text.match(/(\d+)/);
  const v = [...text.slice(text.indexOf("Write an inequality")).matchAll(/ ([b-z])(?=[ .])/g)].at(
    -1,
  );
  if (!m || !v || !/Write an inequality/.test(text)) return null;
  const symbol = /at least|no less than/.test(text)
    ? "≥"
    : /at most|no more than/.test(text)
      ? "≤"
      : /more than|above/.test(text)
        ? ">"
        : /fewer than|less than|under|below/.test(text)
          ? "<"
          : null;
  return symbol ? `${v[1]} ${symbol} ${m[1]}` : null;
}

export function solveStrand(question) {
  const text = String(question).trim();
  for (const [pattern, run] of FORMS) {
    const match = text.match(pattern);
    if (match) {
      const out = run(...match.slice(1));
      if (out !== null) return out;
    }
  }
  return inequality(text);
}

export { fix };
