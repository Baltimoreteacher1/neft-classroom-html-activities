// The coordinate plane: plotting points, reflections, distance along a grid line, quadrants, tables from a rule.
// Grade 5 stays in the first quadrant; grades 6 and 7 use all four.

import { choice, errorItem, fillTable, number, plot, sg } from "./kit.js";

const abs = Math.abs;
const pt = (x, y) => `(${sg(x)}, ${sg(y)})`;

const grid = (grade, level) =>
  grade === 5 ? { min: 0, max: 10 } : level === 1 ? { min: -6, max: 6 } : { min: -10, max: 10 };

/** A point with both coordinates non-zero (so it is inside a quadrant). */
function point(rng, g) {
  for (;;) {
    const x = rng.int(g.min, g.max);
    const y = rng.int(g.min, g.max);
    if (x !== 0 && y !== 0) return { x, y };
  }
}

const move = (v, pos, neg) => `${abs(v)} ${abs(v) === 1 ? "unit" : "units"} ${v < 0 ? neg : pos}`;
const how = ({ x, y }) =>
  `${pt(x, y)}: go ${move(x, "right", "left")} and ${move(y, "up", "down")} from the origin`;

const QUADRANT = ["I", "II", "III", "IV"];
const quadrantOf = (x, y) => (x > 0 ? (y > 0 ? 0 : 3) : y > 0 ? 1 : 2);

/** Two points on one grid line: a shared x (vertical) or a shared y (horizontal). */
function linePair(rng, grade, level) {
  const g = grid(grade, level);
  for (let i = 0; i < 40; i++) {
    const vertical = rng.chance();
    const shared = rng.int(g.min, g.max);
    const a = rng.int(g.min, g.max);
    const b = rng.int(g.min, g.max);
    if (abs(a - b) < 2) continue;
    const [lo, hi] = a < b ? [a, b] : [b, a];
    return { vertical, shared, lo, hi, d: hi - lo, g };
  }
  throw new Error("mathgen: no line pair");
}

const pair = (s, v) => (s.vertical ? pt(s.shared, v) : pt(v, s.shared));

const coordinatePlane = [
  {
    id: "plot-points",
    make({ rng, grade, level }) {
      const g = grid(grade, level);
      const count = level;
      const points = [];
      while (points.length < count) {
        const p = point(rng, g);
        if (!points.some((q) => q.x === p.x && q.y === p.y)) points.push(p);
      }
      const names = ["A", "B", "C"];
      return plot({
        prompt:
          count === 1
            ? `Plot the point ${pt(points[0].x, points[0].y)}.`
            : `Plot these points: ${points.map((p, i) => `${names[i]}${pt(p.x, p.y)}`).join(", ")}.`,
        min: g.min,
        max: g.max,
        points,
        hint: "The first number tells how far to go right or left. The second tells how far to go up or down.",
        explanation: points.map(how).join(". "),
        misconception:
          "Reversing the x- and y-coordinates, or going the wrong way for a negative number.",
      });
    },
  },
  {
    id: "reflect",
    grades: [6, 7],
    levels: [2, 3],
    make({ rng, grade, level }) {
      const g = grid(grade, level);
      const p = point(rng, { min: g.min + 1, max: g.max - 1 });
      const yAxis = rng.chance();
      const r = yAxis ? { x: -p.x, y: p.y } : { x: p.x, y: -p.y };
      return plot({
        prompt: `Plot the reflection of ${pt(p.x, p.y)} across the ${yAxis ? "y" : "x"}-axis.`,
        min: g.min,
        max: g.max,
        points: [r],
        hint: `A reflection across the ${yAxis ? "y" : "x"}-axis changes the sign of the ${yAxis ? "x" : "y"}-coordinate.`,
        explanation: `${pt(p.x, p.y)} reflected across the ${yAxis ? "y" : "x"}-axis is ${pt(r.x, r.y)}. The ${yAxis ? "x" : "y"}-coordinate changes sign.`,
        misconception: `Changing the sign of the ${yAxis ? "y" : "x"}-coordinate instead.`,
      });
    },
  },
  {
    id: "distance",
    make({ rng, grade, level }) {
      const s = linePair(rng, grade, level);
      const unit = s.lo < 0 ? ` − (${sg(s.lo)})` : ` − ${s.lo}`;
      return number({
        prompt: `Point A is at ${pair(s, s.hi)} and point B is at ${pair(s, s.lo)}. How many units apart are they?`,
        answer: String(s.d),
        expr: `${s.hi}-(${s.lo})`,
        hint: `The ${s.vertical ? "x" : "y"}-coordinates are the same. Find the distance between the ${s.vertical ? "y" : "x"}-coordinates.`,
        explanation: `The points are on a ${s.vertical ? "vertical" : "horizontal"} line. ${sg(s.hi)}${unit} = ${s.d}.`,
        misconception:
          s.lo < 0
            ? `Ignoring the negative sign and finding ${s.hi - abs(s.lo)}.`
            : `Adding the coordinates (${s.hi + s.lo}) instead of subtracting.`,
      });
    },
  },
  {
    id: "quadrant",
    grades: [6, 7],
    make({ rng, grade, level }) {
      const p = point(rng, grid(grade, level));
      const q = quadrantOf(p.x, p.y);
      const signs = [
        [1, 1],
        [-1, 1],
        [-1, -1],
        [1, -1],
      ];
      const wrong = QUADRANT.map((name, i) => ({ name, i }))
        .filter((o) => o.i !== q)
        .map((o) => {
          const sx = signs[o.i][0] === Math.sign(p.x);
          const sy = signs[o.i][1] === Math.sign(p.y);
          return {
            text: `Quadrant ${o.name}`,
            why:
              !sx && !sy
                ? "Both signs are different from this quadrant."
                : !sx
                  ? `The x-coordinate ${sg(p.x)} puts the point ${p.x < 0 ? "left" : "right"} of the y-axis.`
                  : `The y-coordinate ${sg(p.y)} puts the point ${p.y < 0 ? "below" : "above"} the x-axis.`,
          };
        });
      return choice(rng, {
        prompt: `In which quadrant is the point ${pt(p.x, p.y)}?`,
        answer: `Quadrant ${QUADRANT[q]}`,
        wrong,
        hint: "Look at the sign of x (left or right) and the sign of y (up or down).",
        explanation: `${pt(p.x, p.y)} has ${p.x < 0 ? "a negative" : "a positive"} x and ${p.y < 0 ? "a negative" : "a positive"} y, so it is in Quadrant ${QUADRANT[q]}.`,
        misconception: "Mixing up which side of the plane each quadrant covers.",
      });
    },
  },
  {
    id: "rule-table",
    make({ rng, grade, level }) {
      const times = level >= 2 && rng.chance();
      const k = rng.int(2, level === 3 ? 9 : 6);
      const signed = grade === 7 && level >= 2;
      const xs = [...new Set(Array.from({ length: 4 }, () => rng.int(signed ? -4 : 0, 6)))].sort(
        (a, b) => a - b,
      );
      if (xs.length < 4) return null;
      const f = (x) => (times ? k * x : x + k);
      const rule = times ? `y = ${k}x` : `y = x + ${k}`;
      const rows = xs.map((x, r) =>
        r === 0 ? [sg(x), sg(f(x))] : [sg(x), { answer: String(f(x)) }],
      );
      const exprs = {};
      for (let r = 1; r < 4; r++) exprs[`${r}:1`] = times ? `${k}*r${r}c0` : `r${r}c0+${k}`;
      return fillTable({
        prompt: `Complete the table for the rule ${rule}. Each row gives a point (x, y).`,
        headers: ["x", "y"],
        rows,
        exprs,
        hint: `Use the rule ${rule}. Put each x in the rule to find y.`,
        explanation: `For x = ${sg(xs[1])}: ${times ? `${k} × ${sg(xs[1]).startsWith("−") ? `(${sg(xs[1])})` : xs[1]}` : `${sg(xs[1])} + ${k}`} = ${sg(f(xs[1]))}.`,
        misconception: times
          ? "Adding the number instead of multiplying."
          : "Multiplying the number instead of adding.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const s = linePair(rng, grade, Math.max(level, grade === 5 ? 1 : 2));
      const dropNeg = s.lo < 0;
      const wrongV = dropNeg ? s.hi - abs(s.lo) : s.hi + s.lo;
      if (wrongV === s.d || wrongV < 0) return null;
      const coord = s.vertical ? "y" : "x";
      const start = s.lo < 0 ? `${sg(s.hi)} − (${sg(s.lo)})` : `${sg(s.hi)} − ${s.lo}`;
      return errorItem(rng, {
        prompt: `Zoe finds the distance between ${pair(s, s.hi)} and ${pair(s, s.lo)}. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          `Subtract the ${coord}-values: ${start}`,
          dropNeg
            ? `Ignore the sign: ${sg(s.hi)} − ${abs(s.lo)}`
            : `Add the ${coord}-values: ${s.hi} + ${s.lo}`,
          `Distance: ${wrongV}`,
        ],
        errorIndex: 1,
        expr: `${s.hi}-(${s.lo})`,
        fixRight: `Subtract the ${coord}-values: ${start} = ${s.d}.`,
        fixWrong: [
          {
            text: `Add the ${coord}-values: ${sg(s.hi)} + (${sg(s.lo)}) = ${sg(s.hi + s.lo)}.`,
            why: "Adding the coordinates instead of subtracting.",
          },
          {
            text: `Ignore the negative sign: ${sg(s.hi)} − ${abs(s.lo)} = ${sg(s.hi - abs(s.lo))}.`,
            why: "Ignoring the negative sign.",
          },
          {
            text: `Subtract the ${s.vertical ? "x" : "y"}-values: ${sg(s.shared)} − ${sg(s.shared)} = 0.`,
            why: "Using the coordinates that do not change.",
          },
          {
            text: `Add the sizes: ${abs(s.hi)} + ${abs(s.lo)} = ${abs(s.hi) + abs(s.lo)}.`,
            why: "Adding the sizes of the numbers.",
          },
        ].filter(
          (f) =>
            !(f.why.startsWith("Ignoring") && s.lo >= 0) &&
            !(f.why.startsWith("Adding the sizes") && abs(s.hi) + abs(s.lo) === s.d),
        ),
        hint: `Points on the same ${s.vertical ? "vertical" : "horizontal"} line share a coordinate. Subtract the other one.`,
        explanation: `${start} = ${s.d}. The distance is ${s.d} units.`,
        misconception: dropNeg
          ? "Ignoring the negative sign."
          : "Adding the coordinates instead of subtracting.",
      });
    },
  },
];

export const COORDINATE_TEMPLATES = { "coordinate-plane": coordinatePlane };
