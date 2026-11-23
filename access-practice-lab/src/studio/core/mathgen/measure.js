// Measurement topics: area and perimeter, volume of rectangular prisms (whole-number and fractional edges).

import { ratAdd, ratMul } from "../math.js";
import { R, ans, choice, dec, errorItem, fillTable, mk, number } from "./kit.js";

const num = Number;
const UNITS = [
  { short: "cm", long: "centimeters", sq: "cm²", cu: "cm³" },
  { short: "m", long: "meters", sq: "m²", cu: "m³" },
  { short: "in", long: "inches", sq: "in²", cu: "in³" },
  { short: "ft", long: "feet", sq: "ft²", cu: "ft³" },
];
const maxSide = { 3: [0, 9, 12, 15], 4: [0, 15, 25, 50], 5: [0, 20, 30, 60], 6: [0, 20, 40, 60] };
const side = (rng, grade, level) => rng.int(2, maxSide[grade][level]);

function rectangle(rng, grade, level) {
  for (;;) {
    const l = side(rng, grade, level);
    const w = side(rng, grade, level);
    if (l !== w) return { l, w };
  }
}

// ── area and perimeter ──────────────────────────────────────────────────────

const areaPerimeter = [
  {
    id: "area",
    make({ rng, grade, level }) {
      const { l, w } = rectangle(rng, grade, level);
      const u = rng.pick(UNITS);
      const thing = rng.pick(["A garden", "A rug", "A poster", "A classroom floor"]);
      return number({
        prompt: `${thing} is ${l} ${u.long} long and ${w} ${u.long} wide. What is its area in square ${u.long}?`,
        answer: String(l * w),
        unit: u.sq,
        expr: `${l}*${w}`,
        hint: "Area is the number of squares that cover the shape. Multiply length by width.",
        explanation: `Area = length × width = ${l} × ${w} = ${l * w} square ${u.long}.`,
        misconception: `Adding instead of multiplying (${l} + ${w} = ${l + w}), or finding the perimeter (${2 * (l + w)}).`,
      });
    },
  },
  {
    id: "perimeter",
    make({ rng, grade, level }) {
      const { l, w } = rectangle(rng, grade, level);
      const u = rng.pick(UNITS);
      const thing = rng.pick(["A garden", "A picture frame", "A pool", "A playground"]);
      return number({
        prompt: `${thing} is ${l} ${u.long} long and ${w} ${u.long} wide. How many ${u.long} are around the outside?`,
        answer: String(2 * (l + w)),
        unit: u.short,
        expr: `2*(${l}+${w})`,
        hint: "Perimeter is the distance around. A rectangle has two lengths and two widths.",
        explanation: `Perimeter = 2 × (${l} + ${w}) = 2 × ${l + w} = ${2 * (l + w)} ${u.long}.`,
        misconception: `Finding the area (${l * w}) or adding only the length and width (${l + w}).`,
      });
    },
  },
  {
    id: "missing-side",
    make({ rng, grade, level }) {
      const { l, w } = rectangle(rng, grade, level);
      const u = rng.pick(UNITS);
      if (rng.chance()) {
        return number({
          prompt: `The area of a rectangle is ${l * w} square ${u.long}. Its length is ${l} ${u.long}. What is its width in ${u.long}?`,
          answer: String(w),
          unit: u.short,
          expr: `${l * w}/${l}`,
          hint: "Area = length × width. What number times the length makes the area?",
          explanation: `${l * w} ÷ ${l} = ${w}. The width is ${w} ${u.long}.`,
          misconception: `Subtracting (${l * w} − ${l} = ${l * w - l}) instead of dividing.`,
        });
      }
      return number({
        prompt: `The perimeter of a rectangle is ${2 * (l + w)} ${u.long}. Its length is ${l} ${u.long}. What is its width in ${u.long}?`,
        answer: String(w),
        unit: u.short,
        expr: `${2 * (l + w)}/2-${l}`,
        hint: "The length and width together are half of the perimeter.",
        explanation: `${2 * (l + w)} ÷ 2 = ${l + w}. ${l + w} − ${l} = ${w}.`,
        misconception: `Subtracting the length from the perimeter (${2 * (l + w) - l}) without halving first.`,
      });
    },
  },
  {
    id: "area-or-perimeter",
    make({ rng, grade, level }) {
      const { l, w } = rectangle(rng, grade, level);
      const area = rng.chance();
      const u = rng.pick(UNITS);
      const A = l * w;
      const P = 2 * (l + w);
      const wrong = area
        ? [
            { text: String(P), why: "That is the perimeter, not the area." },
            { text: String(l + w), why: "Adding the length and width." },
            { text: String(2 * l + w), why: "Adding two lengths and one width." },
            { text: String(2 * A), why: "Doubling the area." },
          ]
        : [
            { text: String(A), why: "That is the area, not the perimeter." },
            { text: String(l + w), why: "Adding only one length and one width." },
            { text: String(2 * l + w), why: "Leaving out one width." },
            { text: String(4 * Math.max(l, w)), why: "Using the longest side four times." },
          ];
      return choice(rng, {
        prompt: `A rectangle is ${l} ${u.long} long and ${w} ${u.long} wide. What is its ${area ? `area in square ${u.long}` : `perimeter in ${u.long}`}?`,
        answer: String(area ? A : P),
        expr: area ? `${l}*${w}` : `2*(${l}+${w})`,
        wrong,
        hint: area ? "Area covers the inside. Multiply." : "Perimeter is the distance around.",
        explanation: area
          ? `Area = ${l} × ${w} = ${A}.`
          : `Perimeter = 2 × (${l} + ${w}) = 2 × ${l + w} = ${P}.`,
        misconception: "Students mix up area and perimeter.",
      });
    },
  },
  {
    id: "triangle-parallelogram",
    grades: [6],
    make({ rng, level }) {
      const b = rng.int(3, level === 1 ? 12 : 20);
      const h = rng.int(2, level === 1 ? 10 : 16);
      const u = rng.pick(UNITS);
      const triangle = rng.chance(0.6);
      if (triangle) {
        const A = R(b * h, 2);
        return number({
          prompt: `A triangle has a base of ${b} ${u.long} and a height of ${h} ${u.long}. What is its area in square ${u.long}?`,
          answer: dec(A),
          unit: u.sq,
          expr: `1/2*${b}*${h}`,
          hint: "A triangle is half of a rectangle with the same base and height.",
          explanation: `Area = {1/2} × base × height = {1/2} × ${b} × ${h} = ${dec(A)}.`,
          misconception: `Forgetting the half and finding ${b * h}.`,
        });
      }
      return number({
        prompt: `A parallelogram has a base of ${b} ${u.long} and a height of ${h} ${u.long}. What is its area in square ${u.long}?`,
        answer: String(b * h),
        unit: u.sq,
        expr: `${b}*${h}`,
        hint: "Use the height that makes a right angle with the base, not the slanted side.",
        explanation: `Area = base × height = ${b} × ${h} = ${b * h}.`,
        misconception: "Multiplying the base by the slanted side instead of the height.",
      });
    },
  },
  {
    id: "composite",
    levels: [2, 3],
    make({ rng, grade, level }) {
      const a = rectangle(rng, grade, Math.max(1, level - 1));
      const b = rectangle(rng, grade, Math.max(1, level - 1));
      const cut = rng.chance();
      const big = { l: a.l + b.l + 2, w: a.w + b.w + 2 };
      const u = rng.pick(UNITS);
      if (cut) {
        const A1 = big.l * big.w;
        const A2 = a.l * a.w;
        return number({
          prompt: `A rectangle is ${big.l} ${u.long} by ${big.w} ${u.long}. A rectangle ${a.l} ${u.long} by ${a.w} ${u.long} is cut out of it. What area is left, in square ${u.long}?`,
          answer: String(A1 - A2),
          unit: u.sq,
          expr: `${big.l}*${big.w}-${a.l}*${a.w}`,
          hint: "Find the area of the big rectangle. Then subtract the area that is cut out.",
          explanation: `${big.l} × ${big.w} = ${A1}. ${a.l} × ${a.w} = ${A2}. ${A1} − ${A2} = ${A1 - A2}.`,
          misconception: `Adding the two areas (${A1 + A2}) instead of subtracting.`,
        });
      }
      const A1 = a.l * a.w;
      const A2 = b.l * b.w;
      return number({
        prompt: `An L-shaped room is made of two rectangles. One is ${a.l} ${u.long} by ${a.w} ${u.long}. The other is ${b.l} ${u.long} by ${b.w} ${u.long}. What is the total area in square ${u.long}?`,
        answer: String(A1 + A2),
        unit: u.sq,
        expr: `${a.l}*${a.w}+${b.l}*${b.w}`,
        hint: "Find the area of each rectangle. Then add them.",
        explanation: `${a.l} × ${a.w} = ${A1}. ${b.l} × ${b.w} = ${A2}. ${A1} + ${A2} = ${A1 + A2}.`,
        misconception: `Multiplying the two areas (${A1 * A2}) or adding all four side lengths.`,
      });
    },
  },
  {
    id: "table",
    make({ rng, grade, level }) {
      const rects = [
        rectangle(rng, grade, level),
        rectangle(rng, grade, level),
        rectangle(rng, grade, level),
      ];
      const [r0, r1, r2] = rects;
      const rows = [
        [
          String(r0.l),
          String(r0.w),
          { answer: String(r0.l * r0.w) },
          { answer: String(2 * (r0.l + r0.w)) },
        ],
        [{ answer: String(r1.l) }, String(r1.w), String(r1.l * r1.w), String(2 * (r1.l + r1.w))],
        [
          String(r2.l),
          { answer: String(r2.w) },
          String(r2.l * r2.w),
          { answer: String(2 * (r2.l + r2.w)) },
        ],
      ];
      return fillTable({
        prompt: `Complete the table for rectangles. The first rectangle is ${r0.l} by ${r0.w}.`,
        headers: ["Length", "Width", "Area", "Perimeter"],
        rows,
        exprs: {
          "0:2": "r0c0*r0c1",
          "0:3": "2*(r0c0+r0c1)",
          "1:0": "r1c2/r1c1",
          "2:1": "r2c2/r2c0",
          "2:3": "2*(r2c0+r2c2/r2c0)",
        },
        hint: "Area = length × width. Perimeter = 2 × (length + width). Use division to find a missing side.",
        explanation: `${r0.l} × ${r0.w} = ${r0.l * r0.w}. 2 × (${r0.l} + ${r0.w}) = ${2 * (r0.l + r0.w)}. ${r1.l * r1.w} ÷ ${r1.w} = ${r1.l}. ${r2.l * r2.w} ÷ ${r2.l} = ${r2.w}.`,
        misconception: "Mixing up the formulas for area and perimeter.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const kind = grade === 6 && rng.chance(0.5) ? "triangle" : rng.pick(["add", "times"]);
      if (kind === "triangle") {
        const b = rng.int(3, 20);
        const h = rng.int(2, 16);
        const A = R(b * h, 2);
        return errorItem(rng, {
          prompt: `Mia finds the area of a triangle with base ${b} and height ${h}. One step has a mistake. Find the step and choose the fix.`,
          steps: [`Area formula: {1/2} × ${b} × ${h}`, `Multiply: ${b} × ${h}`, `Area: ${b * h}`],
          errorIndex: 1,
          expr: `1/2*${b}*${h}`,
          fixRight: `Multiply the base and height, then take half: ${b} × ${h} = ${b * h}, and {1/2} × ${b * h} = ${dec(A)}.`,
          fixWrong: [
            {
              text: `Multiply the base and height: ${b} × ${h} = ${b * h}.`,
              why: "Forgetting to take half.",
            },
            {
              text: `Add the base and height: ${b} + ${h} = ${b + h}.`,
              why: "Adding instead of multiplying.",
            },
            {
              text: `Take half of the base only: {1/2} × ${b} = ${dec(R(b, 2))}.`,
              why: "Using half of the base and ignoring the height.",
            },
            {
              text: `Double the product: 2 × ${b * h} = ${2 * b * h}.`,
              why: "Doubling instead of halving.",
            },
          ],
          hint: "A triangle is half of a rectangle.",
          explanation: `{1/2} × ${b} × ${h} = ${dec(A)}. The area of a triangle is half of base × height.`,
          misconception: "Forgetting the ½ in the triangle formula.",
        });
      }
      const { l, w } = rectangle(rng, grade, level);
      const P = 2 * (l + w);
      const wrongV = kind === "add" ? l + w : l * w;
      return errorItem(rng, {
        prompt: `Omar finds the perimeter of a rectangle ${l} long and ${w} wide. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          `Perimeter formula: 2 × (${l} + ${w})`,
          kind === "add" ? `Add the sides: ${l} + ${w}` : `Multiply the sides: ${l} × ${w}`,
          `Perimeter: ${wrongV}`,
        ],
        errorIndex: 1,
        expr: `2*(${l}+${w})`,
        fixRight: `Add the length and width, then double: ${l} + ${w} = ${l + w}, and 2 × ${l + w} = ${P}.`,
        fixWrong: [
          {
            text: `Add only the length and width: ${l} + ${w} = ${l + w}.`,
            why: "Forgetting to double.",
          },
          {
            text: `Multiply the sides: ${l} × ${w} = ${l * w}.`,
            why: "Finding the area instead of the perimeter.",
          },
          {
            text: `Double only the length: 2 × ${l} + ${w} = ${2 * l + w}.`,
            why: "Counting only three sides.",
          },
          {
            text: `Add three sides: ${l} + ${l} + ${w} = ${2 * l + w}.`,
            why: "Leaving out one side.",
          },
        ],
        hint: "Perimeter is the distance around all four sides.",
        explanation: `2 × (${l} + ${w}) = 2 × ${l + w} = ${P}.`,
        misconception:
          kind === "add"
            ? "Adding only one length and one width."
            : "Multiplying the sides, which finds area.",
      });
    },
  },
];

// ── volume ──────────────────────────────────────────────────────────────────

function edges(rng, grade, level) {
  if (grade === 5 || level === 1) {
    const top = [0, 6, 10, 12][level] + (grade === 6 ? 1 : 0);
    return [R(rng.int(2, top)), R(rng.int(2, top)), R(rng.int(2, top))];
  }
  const half = () => R(rng.int(1, 7), 2);
  const frac = () => {
    const d = rng.pick([2, 3, 4, 5]);
    return R(rng.int(1, d - 1), d);
  };
  const whole = () => R(rng.int(2, 8));
  const out = level === 2 ? [half(), whole(), whole()] : [half(), frac(), whole()];
  return rng.shuffle(out);
}

const times = (...rs) => rs.reduce((p, x) => ratMul(p, x));
const edgeExpr = (r) => `${r.n}/${r.d}`;

function volumeWork([a, b, c]) {
  const ab = ratMul(a, b);
  const v = ratMul(ab, c);
  return `Volume = length × width × height. ${mk(a)} × ${mk(b)} = ${mk(ab)}. ${mk(ab)} × ${mk(c)} = ${mk(v)}.`;
}

const THINGS = ["A box", "A fish tank", "A cereal box", "A toy block", "A storage bin"];

const volume = [
  {
    id: "compute",
    make({ rng, grade, level }) {
      const e = edges(rng, grade, level);
      const u = rng.pick(UNITS);
      const v = times(...e);
      if (v.n > 2000n * v.d) return null;
      return number({
        prompt: `${rng.pick(THINGS)} is a rectangular prism. It is ${mk(e[0])} ${u.long} long, ${mk(e[1])} ${u.long} wide and ${mk(e[2])} ${u.long} tall. What is its volume in cubic ${u.long}?`,
        answer: ans(v),
        accept: v.d !== 1n ? [dec2(v)].filter(Boolean) : [],
        unit: u.cu,
        expr: e.map(edgeExpr).join("*"),
        hint: "Multiply length, width and height.",
        explanation: volumeWork(e),
        misconception: `Adding the edges (${mk(e.reduce((p, x) => ratAdd(p, x)))}) instead of multiplying.`,
      });
    },
  },
  {
    id: "missing-edge",
    make({ rng, grade, level }) {
      const [l, w, h] = [rng.int(2, 9), rng.int(2, 9), rng.int(2, level === 3 ? 12 : 9)];
      const u = rng.pick(UNITS);
      const V = l * w * h;
      const useBase = grade === 5 && level >= 2 ? rng.chance() : false;
      if (useBase) {
        return number({
          prompt: `The base of a prism has an area of ${l * w} square ${u.long}. The volume is ${V} cubic ${u.long}. What is the height in ${u.long}?`,
          answer: String(h),
          unit: u.short,
          expr: `${V}/${l * w}`,
          hint: "Volume = base area × height. What number times the base area makes the volume?",
          explanation: `${V} ÷ ${l * w} = ${h}. The height is ${h} ${u.long}.`,
          misconception: `Subtracting (${V} − ${l * w}) instead of dividing.`,
        });
      }
      return number({
        prompt: `The volume of a box is ${V} cubic ${u.long}. The length is ${l} ${u.long} and the width is ${w} ${u.long}. What is the height in ${u.long}?`,
        answer: String(h),
        unit: u.short,
        expr: `${V}/(${l}*${w})`,
        hint: "Find the area of the base first. Then divide the volume by it.",
        explanation: `${l} × ${w} = ${l * w}. ${V} ÷ ${l * w} = ${h}. The height is ${h} ${u.long}.`,
        misconception: `Dividing the volume by only one edge (${V} ÷ ${l} = ${V / l}).`,
      });
    },
  },
  {
    id: "choose",
    make({ rng, grade, level }) {
      const e = edges(rng, grade, level);
      const [a, b, c] = e;
      const v = times(...e);
      if (v.n > 2000n * v.d) return null;
      const u = rng.pick(UNITS);
      const sa = ratMul(R(2), ratAdd(ratAdd(ratMul(a, b), ratMul(a, c)), ratMul(b, c)));
      const wrong = [
        { r: e.reduce((p, x) => ratAdd(p, x)), why: "Adding the edges instead of multiplying." },
        { r: ratMul(a, b), why: "Finding the area of the base only." },
        { r: sa, why: "Finding the surface area instead of the volume." },
        { r: ratAdd(ratMul(a, b), c), why: "Multiplying two edges and adding the third." },
        { r: ratMul(R(2), v), why: "Doubling the volume." },
      ].map((w) => ({ text: mk(w.r), why: w.why }));
      return choice(rng, {
        prompt: `A rectangular prism is ${mk(a)} ${u.long} long, ${mk(b)} ${u.long} wide and ${mk(c)} ${u.long} tall. What is its volume in cubic ${u.long}?`,
        answer: mk(v),
        expr: e.map(edgeExpr).join("*"),
        wrong,
        hint: "Volume is length × width × height.",
        explanation: volumeWork(e),
        misconception: "Students add the edges or find surface area.",
      });
    },
  },
  {
    id: "unit",
    levels: [1, 2],
    make({ rng }) {
      const u = rng.pick(UNITS);
      const thing = rng.pick([
        "a juice box",
        "a shoe box",
        "a fish tank",
        "a toy block",
        "a lunch box",
      ]);
      return choice(rng, {
        prompt: `You find how much space ${thing} holds. Which unit do you use? The edges are measured in ${u.long}.`,
        answer: `cubic ${u.long}`,
        wrong: [
          { text: `square ${u.long}`, why: "Square units measure area, not volume." },
          { text: u.long, why: "Plain length units measure one edge." },
          { text: "degrees", why: "Degrees measure angles or temperature." },
        ],
        hint: "Volume counts cubes that fill the space.",
        explanation: `Volume is measured in cubic units, so use cubic ${u.long}.`,
        misconception: "Using square units for volume.",
      });
    },
  },
  {
    id: "table",
    grades: [5, 6],
    make({ rng, level }) {
      const dims = () => [
        rng.int(2, level === 1 ? 6 : 10),
        rng.int(2, level === 1 ? 6 : 10),
        rng.int(2, level === 1 ? 6 : 10),
      ];
      const [d0, d1, d2] = [dims(), dims(), dims()];
      const vol = (d) => String(d[0] * d[1] * d[2]);
      const rows = [
        [String(d0[0]), String(d0[1]), String(d0[2]), { answer: vol(d0) }],
        [String(d1[0]), String(d1[1]), { answer: String(d1[2]) }, vol(d1)],
        [String(d2[0]), { answer: String(d2[1]) }, String(d2[2]), vol(d2)],
      ];
      return fillTable({
        prompt: `Complete the table for rectangular prisms. The first prism is ${d0[0]} by ${d0[1]} by ${d0[2]}.`,
        headers: ["Length", "Width", "Height", "Volume"],
        rows,
        exprs: { "0:3": "r0c0*r0c1*r0c2", "1:2": "r1c3/(r1c0*r1c1)", "2:1": "r2c3/(r2c0*r2c2)" },
        hint: "Volume = length × width × height. To find a missing edge, divide.",
        explanation: `${d0[0]} × ${d0[1]} × ${d0[2]} = ${vol(d0)}. ${vol(d1)} ÷ (${d1[0]} × ${d1[1]}) = ${d1[2]}. ${vol(d2)} ÷ (${d2[0]} × ${d2[2]}) = ${d2[1]}.`,
        misconception: "Dividing the volume by only one edge.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const e = edges(rng, grade, level);
      const [a, b, c] = e;
      const v = times(...e);
      const kind = rng.pick(["add", "base"]);
      const wrong = kind === "add" ? e.reduce((p, x) => ratAdd(p, x)) : ratMul(a, b);
      if (wrong.n * v.d === v.n * wrong.d) return null;
      const sa = ratMul(R(2), ratAdd(ratAdd(ratMul(a, b), ratMul(a, c)), ratMul(b, c)));
      return errorItem(rng, {
        prompt: `Lena finds the volume of a prism that is ${mk(a)} by ${mk(b)} by ${mk(c)}. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          `Volume formula: ${mk(a)} × ${mk(b)} × ${mk(c)}`,
          kind === "add"
            ? `Add the edges: ${mk(a)} + ${mk(b)} + ${mk(c)}`
            : `Multiply the base only: ${mk(a)} × ${mk(b)}`,
          `Volume: ${mk(wrong)}`,
        ],
        errorIndex: 1,
        expr: e.map(edgeExpr).join("*"),
        fixRight: `Multiply all three edges: ${mk(a)} × ${mk(b)} = ${mk(ratMul(a, b))}, and ${mk(ratMul(a, b))} × ${mk(c)} = ${mk(v)}.`,
        fixWrong: [
          {
            text: `Add the edges: ${mk(a)} + ${mk(b)} + ${mk(c)} = ${mk(e.reduce((p, x) => ratAdd(p, x)))}.`,
            why: "Adding the edges instead of multiplying.",
          },
          {
            text: `Multiply the base only: ${mk(a)} × ${mk(b)} = ${mk(ratMul(a, b))}.`,
            why: "Leaving out the height.",
          },
          {
            text: `Find the surface area: 2 × (${mk(ratMul(a, b))} + ${mk(ratMul(a, c))} + ${mk(ratMul(b, c))}) = ${mk(sa)}.`,
            why: "Finding the surface area.",
          },
          {
            text: `Multiply two edges and add the third: ${mk(ratMul(a, b))} + ${mk(c)} = ${mk(ratAdd(ratMul(a, b), c))}.`,
            why: "Adding the third edge instead of multiplying.",
          },
        ],
        hint: "Volume uses all three edges.",
        explanation: volumeWork(e),
        misconception:
          kind === "add" ? "Adding the edges instead of multiplying." : "Leaving out the height.",
      });
    },
  },
];

function dec2(r) {
  try {
    return dec(r);
  } catch {
    return null;
  }
}

export const MEASURE_TEMPLATES = { "area-perimeter": areaPerimeter, volume };
