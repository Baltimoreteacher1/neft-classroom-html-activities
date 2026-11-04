/**
 * Interactive builders for the v2 workbench: small pure evaluators that test what the student types
 * against the current design. Each returns {complete, ok, lines[]} with messages that name the specific
 * slip using the design's own given numbers. They never print a Studio check answer; values that belong
 * to a check are only passed in once that check matched (`shown`).
 */
import { abs, add, cmp, eq, gcd, isInt, mul, neg, num, parse, show, sub } from "./exact.mjs";

export const BUILDER_KEYS = ["A", "B", "C", "D", "E", "F"];
const out = (complete, ok, lines) => ({ complete, ok, lines });
const missing = (raw, keys) => keys.some((k) => !String(raw?.[k] ?? "").trim());

/* ------------------------------------------------------------------ units */
export const UNIT_CHOICES = [
  ["m", "meters (m)"],
  ["m2", "square meters (m²)"],
  ["m3", "cubic meters (m³)"],
  ["usd", "dollars ($)"],
];
const unitName = Object.fromEntries(UNIT_CHOICES);
export const UNIT_ROWS = {
  area: [
    { key: "A", label: "Floor area of the rectangle plus the nook", right: "m2", id: "floor" },
    { key: "B", label: "Distance around the rectangular floor", right: "m", id: "perimeter" },
    { key: "C", label: "Space inside the storage box", right: "m3", id: "storage" },
    { key: "D", label: "Flooring cost", right: "usd", id: "cost" },
  ],
  synthesis: [
    { key: "C", label: "Pop-up floor area", right: "m2", id: "floor" },
    { key: "D", label: "Total cost for the visitors", right: "usd", id: "cost" },
  ],
};
const UNIT_SAY = {
  floor: {
    m: "Meters measure a length, like one edge of the floor. Area covers a surface with squares, so it needs a square unit.",
    m3: "Cubic units count blocks that fill space. A floor is flat, so its area counts squares, not cubes.",
    usd: "Dollars measure a price. The floor area is a count of squares, not an amount of money.",
  },
  perimeter: {
    m2: "Square meters count the flat squares inside a shape. A perimeter is a distance around the edge, which is a length, so it is not a square unit.",
    m3: "Cubic units count blocks that fill space. A distance around an edge is a length.",
    usd: "Dollars measure a price. The distance around the floor is a length.",
  },
  storage: {
    m: "Meters measure a length only. The box holds space in three directions (length, width, height), so its capacity counts cubes.",
    m2: "Square units count flat surface. The space inside a box is filled with cubes, so its capacity needs a cubic unit.",
    usd: "Dollars measure a price. Capacity is how much space is inside the box.",
  },
  cost: {
    m: "Meters measure a length. A cost is an amount of money.",
    m2: "Square meters appear in the PRICE RATE ($ per m²), but multiplying by the area cancels them, so the cost itself is only money.",
    m3: "Cubic units count blocks that fill space. A cost is an amount of money.",
  },
};
/** `picks` holds the stored values ("m", "m2", "m3", "usd" or ""). */
export function unitCheck(kind, picks, shownValue = {}) {
  const rows = UNIT_ROWS[kind].map((row) => {
    const pick = String(picks?.[row.key] ?? "");
    if (!pick) return { ...row, pick, status: "empty", text: "Choose a unit." };
    if (pick === row.right)
      return { ...row, pick, status: "ok", text: `${unitName[pick]} fits: ${row.label.toLowerCase()} is counted with this kind of unit.` };
    const value = shownValue[row.id];
    const say = UNIT_SAY[row.id]?.[pick] ?? "That unit does not describe this quantity.";
    return {
      ...row,
      pick,
      status: "bad",
      text: `${row.label}${value !== undefined ? ` (${value})` : ""}: you chose ${unitName[pick] ?? pick}. ${say}`,
    };
  });
  const bad = rows.filter((r) => r.status === "bad").length;
  const empty = rows.filter((r) => r.status === "empty").length;
  return { rows, complete: empty === 0, ok: bad === 0 && empty === 0, bad, empty };
}

/* -------------------------------------------------------------------- net */
const quad = (x, y) =>
  x === 0 && y === 0 ? "the origin" : x === 0 ? "the y-axis" : y === 0 ? "the x-axis" : `Quadrant ${x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III"}`;
export { quad };

/** A = front glued edge, B = front upright edge, C = side glued edge, D = side upright edge. */
export function netCheck(v, open, raw) {
  const keys = ["A", "B", "C", "D"];
  if (missing(raw, keys)) return out(false, false, ["Type the four edge lengths to test whether your net folds."]);
  const [A, B, C, D] = keys.map((k) => parse(raw[k]));
  if ([A, B, C, D].some((x) => !x)) return out(false, false, ["Use numbers, fractions such as 3/4, or mixed numbers such as 2 1/2."]);
  const [a, b, c] = [v.a, v.b, v.c].map(num);
  const lines = [];
  if (!eq(A, a)) lines.push(`The front face folds onto the base edge that is ${show(a)} long, but you gave its glued edge as ${show(A)}.${eq(A, b) && !eq(a, b) ? " That is the base's other edge." : ""}`);
  if (!eq(C, b)) lines.push(`The side face folds onto the base edge that is ${show(b)} long, but you gave its glued edge as ${show(C)}.${eq(C, a) && !eq(a, b) ? " That is the base's other edge." : ""}`);
  if (!eq(B, c)) lines.push(`The front face stands up from the base, so its upright edge is the box height, ${show(c)}. You gave ${show(B)}.`);
  if (!eq(D, c)) lines.push(`The side face also stands up from the base, so its upright edge is the box height, ${show(c)}. You gave ${show(D)}.`);
  if (!eq(B, D) && eq(B, c) === eq(D, c)) lines.push(`When the box folds, the front and side faces meet along an upright edge, so ${show(B)} and ${show(D)} cannot both be right.`);
  if (lines.length) return out(true, false, lines);
  return out(true, true, [`Every fold edge matches. The faces fold into a ${open ? "five-face box with an open top (leave the top face off the net)" : "closed box with six faces"}.`]);
}

/* ------------------------------------------------------------------- plot */
/** A = intended x of A, B = intended y of A, C = intended x of B. */
export function plotIntent(v, raw) {
  const keys = ["A", "B", "C"];
  if (missing(raw, keys)) return out(false, false, ["Type where you meant A to be (x, then y) and where you meant B's x to be."]);
  const [ix, iy, ic] = keys.map((k) => parse(raw[k]));
  if ([ix, iy, ic].some((x) => !x || !isInt(x))) return out(false, false, ["Use whole numbers from -10 to 10."]);
  const [a, b, c] = [v.a, v.b, v.c].map(num);
  const lines = [];
  const where = (x, y) => `(${show(x)}, ${show(y)}) in ${quad(Number(x.n), Number(y.n))}`;
  if (!eq(ix, a) || !eq(iy, b)) {
    if (eq(ix, b) && eq(iy, a)) lines.push("Your x and y look swapped. An ordered pair lists x (left or right) first and y (up or down) second.");
    else if (eq(ix, neg(a)) && eq(iy, b)) lines.push(`You meant A at ${where(ix, iy)}, but the design plots A at ${where(a, b)}. The x-coordinate has the opposite sign, so A is on the other side of the y-axis.`);
    else if (eq(ix, a) && eq(iy, neg(b))) lines.push(`You meant A at ${where(ix, iy)}, but the design plots A at ${where(a, b)}. The y-coordinate has the opposite sign, so A is on the other side of the x-axis.`);
    else lines.push(`You meant A at ${where(ix, iy)}, but the design plots A at ${where(a, b)}.`);
  }
  if (!eq(ic, c))
    lines.push(`B stays on the same row as A (y = ${show(b)}). You meant B's x to be ${show(ic)}, but the design plots it at x = ${show(c)}${eq(ic, neg(c)) ? ", the opposite sign, so B is on the other side of the y-axis" : ""}.`);
  if (lines.length) return out(true, false, lines);
  return out(true, true, [`The plotted points match your plan: A is at ${where(a, b)} and B is at ${where(c, b)}.`]);
}

/* ---------------------------------------------------------- substitution */
const side = (l, r) => (cmp(l, r) === 0 ? "equal" : cmp(l, r) < 0 ? "less" : "greater");
/**
 * Candidate x tested against both locks and both gates with exact rationals.
 * Numeric left-hand values appear only for the checks the student has matched (`shown`).
 */
export function substitution(v, raw, shown = {}) {
  const text = String(raw?.A ?? "").trim();
  if (!text) return { complete: false, rows: [], summary: "Type a candidate value for x to test it in every clue." };
  const x = parse(text);
  if (!x) return { complete: false, rows: [], summary: "Use a number, a fraction such as 3/4, or a mixed number such as 2 1/2." };
  const [a, b, c] = [v.a, v.b, v.c].map(num);
  const left1 = add(x, b);
  const right1 = add(a, b);
  const left2 = mul(c, x);
  const right2 = mul(c, a);
  const s1 = side(left1, right1);
  const s2 = side(left2, right2);
  const word = { equal: "equal to", less: "less than", greater: "greater than" };
  const eqRow = (label, eqText, s, left, key) => ({
    label,
    eq: eqText,
    ok: s === "equal",
    text: `x = ${show(x)}: the left side is ${word[s]} the right side${shown[key] ? ` (left side ${show(left)})` : ""}.`,
  });
  const ge = cmp(x, a) >= 0;
  const gt = cmp(x, a) > 0;
  const rows = [
    eqRow("First lock", `x + ${show(b)} = ${show(right1)}`, s1, left1, "substitution"),
    eqRow("Second lock", `${show(c)}x = ${show(right2)}`, s2, left2, "difference"),
    { label: "Gate n ≥", eq: `n ≥ ${show(a)}`, ok: ge, text: `${show(x)} is ${ge ? "allowed" : "not allowed"} by "at least ${show(a)}".` },
    { label: "Gate n >", eq: `n > ${show(a)}`, ok: gt, text: `${show(x)} is ${gt ? "allowed" : "not allowed"} by "greater than ${show(a)}".` },
  ];
  const both = s1 === "equal" && s2 === "equal";
  const summary = both
    ? `${show(x)} opens both locks, so the two equations share this solution.`
    : s1 === "equal" || s2 === "equal"
      ? `${show(x)} opens only the ${s1 === "equal" ? "first" : "second"} lock. A solution has to make BOTH sides equal in every lock that uses the same secret.`
      : `${show(x)} opens neither lock.`;
  const boundary = eq(x, a) ? ` At the boundary value, "at least" allows it and "greater than" does not.` : "";
  return { complete: true, rows, summary: summary + boundary };
}

/* ------------------------------------------------------- table consistency */
export const ROLES = {
  "unit-9-a": { x: "weeks", y: "channel audience (subscribers)" },
  "unit-9-b": { x: "lab hours", y: "total cost ($)" },
};
/** A, B, C = the student's y for x = 3, 4, 5. */
export function tableCheck(v, raw) {
  const keys = ["A", "B", "C"];
  if (missing(raw, keys)) return out(false, false, ["Type a y value for x = 3, 4 and 5 to test whether your table follows one rule."]);
  const [p, q, r] = keys.map((k) => parse(raw[k]));
  if ([p, q, r].some((x) => !x)) return out(false, false, ["Use numbers, fractions or mixed numbers."]);
  const [a, b] = [v.a, v.b].map(num);
  const d1 = sub(q, p);
  const d2 = sub(r, q);
  if (!eq(d1, d2)) return out(true, false, [`Your table changes by ${show(d1)} from x = 3 to 4 but by ${show(d2)} from 4 to 5. In a constant-rate relationship each step of 1 in x changes y by the same amount.`]);
  if (!eq(d1, a)) return out(true, false, [`Your table grows by ${show(d1)} each row, but the rate in your design is ${show(a)}.`]);
  const start = sub(p, mul(num(3), d1));
  if (!eq(start, b)) return out(true, false, [`Your table grows at the right rate but it implies a starting amount of ${show(start)} at x = 0. Your design starts at ${show(b)}.`]);
  return out(true, true, [`Your table changes by the design's rate, ${show(a)}, at every step and starts from ${show(b)}, so it follows the same rule as the equation and the graph.`]);
}
/** D = chosen independent variable, E = chosen dependent variable; options are the mission's two quantities. */
export function roleCheck(project, raw) {
  const roles = ROLES[project.id];
  if (!roles) return out(false, false, []);
  const [d, e] = [String(raw?.D ?? ""), String(raw?.E ?? "")];
  if (!d || !e) return out(false, false, ["Choose the independent and the dependent variable."]);
  if (d === "y" && e === "x") return out(true, false, [`You named ${roles.y} as the input. In this model ${roles.y} is calculated FROM ${roles.x}, so ${roles.x} is the variable you choose and ${roles.y} depends on it.`]);
  if (d === e) return out(true, false, ["The independent and dependent variables are two different quantities. One is chosen, the other is calculated from it."]);
  return out(true, true, [`${roles.x} is independent (you choose it) and ${roles.y} is dependent (the rule calculates it).`]);
}

/* --------------------------------------------------------- two ways to count */
/** A = stage number, B = count by groups-then-extras, C = count by starting stage then adding a each step. */
export function countTwoWays(v, raw) {
  const keys = ["A", "B", "C"];
  if (missing(raw, keys)) return out(false, false, ["Pick a stage, then count it two ways and type both counts."]);
  const [n, p, q] = keys.map((k) => parse(raw[k]));
  if ([n, p, q].some((x) => !x)) return out(false, false, ["Use whole numbers."]);
  if (!isInt(n) || n.n < 1n || n.n > 12n) return out(false, false, ["The stage is a whole number from 1 to 12."]);
  const [a, b] = [v.a, v.b].map(num);
  const truth = add(mul(n, a), b);
  const N = show(n);
  if (!eq(p, q)) return out(true, false, [`Your two counts for stage ${N} differ by ${show(abs(sub(p, q)))}. One stage has one number of tiles, so one of the two ways is miscounting. Compare each way with the picture.`]);
  if (!eq(p, truth)) return out(true, false, [`Both of your counts are ${show(p)}, but the picture of stage ${N} shows ${N} group${N === "1" ? "" : "s"} of ${show(a)} tiles and ${show(b)} extra tiles. Recount the groups, then the extras.`]);
  return out(true, true, [`Both ways give ${show(p)} tiles at stage ${N}, and the picture agrees.`]);
}

/* ---------------------------------------------------------------- fraction */
/** A/B = the student's fraction for the discount as a part of the subtotal. */
export function fractionCheck(v, raw) {
  if (missing(raw, ["A", "B"])) return out(false, false, ["Type a numerator and a denominator for the discount as a fraction of the subtotal."]);
  const [p, q] = ["A", "B"].map((k) => parse(raw[k]));
  if (!p || !q || !isInt(p) || !isInt(q) || q.n === 0n || p.n < 0n) return out(false, false, ["Use whole numbers, with a denominator that is not 0."]);
  const d = num(v.d);
  const percent = mul(mul(p, num(100)), { n: q.d, d: q.n });
  if (!eq(percent, d)) return out(true, false, [`Your fraction ${show(p)}/${show(q)} is ${show(percent)}% of the subtotal, but this discount is ${show(d)}%.`]);
  const g = gcd(p.n, q.n);
  return out(true, true, [g > 1n ? `${show(p)}/${show(q)} is equal to the discount rate, ${show(d)}%. It can still be simplified: both numbers share a factor of ${g}.` : `${show(p)}/${show(q)} is the discount rate, ${show(d)}%, in lowest terms.`]);
}
