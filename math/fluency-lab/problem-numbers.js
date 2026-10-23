// The one place that reads the numbers out of the problem a learner is working on, so every model
// (the step-by-step solver, the Math Tool Drawer, the "Show the model" picture) opens with THOSE numbers.
// Pure: no DOM, no state. A story problem keeps its bare expression in `item.expr`, so that is read first.
//
// Only the problem's own givens come out of here. Nothing in this file computes an answer, so a model
// seeded from it cannot show one (tools/fluency-model-inputs.test.mjs pins that for all 88 skills).

import { columnSpec } from "./vertical-columns.js";

const NUM = String.raw`\d+(?:\.\d+)?`;
const FRAC = String.raw`-?\(?-?\d+(?:\s+\d+)?\s*\/\s*\d+\)?`;

/** The bare problem text: `item.expr` for story problems, else the question. ASCII operators, no thousands commas. */
export function bareText(item) {
  const raw = typeof item === "string" ? item : (item?.expr ?? item?.question ?? "");
  return String(raw)
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const num = (text) => Number(String(text).replace(/[()\s]/g, ""));
const places = (text) => (String(text).split(".")[1] || "").length;

function parseFraction(text) {
  const clean = text.replace(/[()]/g, "").trim();
  const m = clean.match(/^(-?)(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  const whole = m[2] ? Number(m[2]) : 0;
  const d = Number(m[4]);
  if (d < 1) return null;
  const sign = m[1] ? -1 : 1;
  return { n: sign * (whole * d + Number(m[3])), d, whole: m[2] ? sign * whole : 0, text: clean };
}

function equation(t) {
  const lhs = "(-?\\d*)\\s*x";
  let m = t.match(new RegExp(`^(?:[^\\d=x]*?)${lhs}\\s*([+-])\\s*(\\d+)\\s*=\\s*(-?\\d+)`, "i"));
  if (m)
    return {
      kind: "equation",
      coeff: m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]),
      constant: (m[2] === "-" ? -1 : 1) * Number(m[3]),
      rhs: Number(m[4]),
    };
  m = t.match(/(?:^|[^\w])(-?\d*)\s*x\s*=\s*(-?\d+)(?!\s*\/)/i);
  if (m && !/\by\b/i.test(t) && !/^x\s*=/i.test(t))
    return {
      kind: "equation",
      coeff: m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]),
      constant: 0,
      rhs: Number(m[2]),
    };
  m = t.match(/^(?:[^\dx=]*?)x\s*[\/÷]\s*(\d+)\s*=\s*(-?\d+)/i);
  if (m)
    return { kind: "equation", divisor: Number(m[1]), coeff: 1, constant: 0, rhs: Number(m[2]) };
  return null;
}

function parseFractionOp(t) {
  const m = t.match(new RegExp(`(${FRAC})\\s*([+*/÷-])\\s*(${FRAC})`));
  if (m && /\//.test(m[1]) && /\//.test(m[3])) {
    const [a, b] = [parseFraction(m[1]), parseFraction(m[3])];
    if (a && b) return { kind: "fractions", op: m[2] === "/" ? "÷" : m[2], parts: [a, b] };
  }
  const of = t.match(new RegExp(`(${FRAC})\\s+of\\s+(${NUM})`, "i"));
  if (of) {
    const f = parseFraction(of[1]);
    if (f) return { kind: "fractionOf", fraction: f, whole: Number(of[2]) };
  }
  const prop = t.match(/^(\d+)\s*\/\s*(\d+)\s*=\s*x\s*\/\s*(\d+)/i);
  if (prop)
    return { kind: "proportion", n: Number(prop[1]), d: Number(prop[2]), d2: Number(prop[3]) };
  const eq = t.match(/^(\d+)\s*\/\s*(\d+)\s*=\s*(\d+|□)\s*\/\s*(\d+|□)/);
  if (eq) return { kind: "equivalent", n: Number(eq[1]), d: Number(eq[2]), n2: eq[3] === "□" ? null : Number(eq[3]), d2: eq[4] === "□" ? null : Number(eq[4]) };
  const lone = t.match(new RegExp(`(${FRAC})`));
  const fr = lone && parseFraction(lone[1]);
  return fr
    ? {
        kind: "fractions",
        op: null,
        parts: [
          fr,
          ...[...t.matchAll(new RegExp(FRAC, "g"))]
            .slice(1, 3)
            .map((x) => parseFraction(x[0]))
            .filter(Boolean),
        ],
      }
    : null;
}

// "10 + 10 * 7" -> numbers [10,10,7], operators ["+","*"]. A minus is a sign when it starts a number.
function tokenize(t) {
  const nums = [];
  const ops = [];
  const texts = [];
  let i = 0;
  let expectNumber = true;
  while (i < t.length) {
    const rest = t.slice(i);
    const number = rest.match(new RegExp(`^${expectNumber ? "-?" : ""}${NUM}`));
    if (expectNumber && number) {
      nums.push(Number(number[0]));
      texts.push(number[0]);
      i += number[0].length;
      expectNumber = false;
    } else if (!expectNumber && /^[+*÷/^-]/.test(rest)) {
      ops.push(rest[0] === "/" ? "÷" : rest[0]);
      i += 1;
      expectNumber = true;
    } else if (/^[\s()]/.test(rest)) {
      i += 1;
    } else if (!nums.length) {
      i += 1; // leading words before the first number
    } else break;
  }
  return { nums, ops: ops.slice(0, Math.max(0, nums.length - 1)), texts };
}

function parseBinary(t) {
  const { nums, ops, texts } = tokenize(t);
  if (nums.length === 2 && ops.length === 1) {
    return { kind: "binary", op: ops[0], a: nums[0], b: nums[1], aText: texts[0], bText: texts[1], decimals: Math.max(places(texts[0]), places(texts[1])) };
  }
  if (nums.length >= 3 && ops.length === nums.length - 1) {
    return ops.every((o) => o === "*") ? { kind: "product", factors: nums } : { kind: "expression", numbers: nums, ops };
  }
  return null;
}

function parseSubstitution(t) {
  const fn = t.match(/y\s*=\s*(-?\d*)\s*x\s*(?:([+-])\s*(\d+))?[^]*?when x\s*=\s*(-?\d+)/i);
  const ev = t.match(/(-?\d*)\s*x\s*(?:([+-])\s*(\d+))?\s+when x\s*=\s*(-?\d+)/i);
  const m = fn || ev;
  if (!m) return null;
  return { kind: "substitution", coeff: m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]), constant: m[2] ? (m[2] === "-" ? -1 : 1) * Number(m[3]) : 0, x: Number(m[4]) };
}

/** What the problem is, as plain givens: { kind, ... } or null. Never an answer. */
export function extractProblem(item) {
  const t = bareText(item);
  if (!t) return null;
  const gl = t.match(
    new RegExp(
      `\\b(gcf|gcd|lcm|greatest common factor|least common multiple)\\b[^\\d]*(\\d+)\\s*(?:and|,)\\s*(\\d+)`,
      "i",
    ),
  );
  if (gl)
    return {
      kind: "gcflcm",
      fn: /gcf|gcd|greatest/i.test(gl[1]) ? "gcf" : "lcm",
      a: Number(gl[2]),
      b: Number(gl[3]),
    };
  const sub = parseSubstitution(t);
  if (sub) return sub;
  if (/\bx\b/i.test(t) && /=/.test(t) && !/\by\b/i.test(t)) {
    const eq = equation(t) || parseFractionOp(t);
    if (eq) return eq;
  }
  const ratio = t.match(new RegExp(`(${NUM}|□)\\s*:\\s*(${NUM}|□)\\s*=\\s*(${NUM}|□)\\s*:\\s*(${NUM}|□)`));
  if (ratio) {
    const [a, b, c, d] = ratio.slice(1, 5).map((x) => (x === "□" ? null : Number(x)));
    return { kind: "ratio", a, b, c, d };
  }
  const unit = t.match(new RegExp(`^(${NUM}) ([a-z]+) = how many ([a-z]+)`, "i"));
  if (unit) return { kind: "conversion", amount: Number(unit[1]), from: unit[2], to: unit[3] };
  const rate = t.match(new RegExp(`(${NUM})\\s+for\\s+(${NUM})\\s+\\w+`, "i"));
  if (rate) return { kind: "rate", total: Number(rate[1]), count: Number(rate[2]) };
  const pct = t.match(new RegExp(`(${NUM})%\\s*of\\s*(${NUM})`, "i"));
  if (pct) return { kind: "percent", pct: Number(pct[1]), base: Number(pct[2]) };
  const change = t.match(new RegExp(`^(${NUM}) with a (${NUM})% (?:increase|decrease)`, "i"));
  if (change) return { kind: "percent", pct: Number(change[2]), base: Number(change[1]) };
  const round = t.match(/round\s+(-?\d+(?:\.\d+)?)\s+to the nearest\s+([\w-]+)/i);
  if (round) return { kind: "round", n: Number(round[1]), place: round[2].toLowerCase() };
  if (t.includes("/") || /□/.test(t)) {
    const f = parseFractionOp(t);
    if (f) return f;
  }
  const bin = parseBinary(t);
  if (bin) return bin;
  const dims = t.match(/length (\d+(?:\.\d+)?) and width (\d+(?:\.\d+)?)/i);
  if (dims) return { kind: "dims", length: Number(dims[1]), width: Number(dims[2]) };
  const seq = t.match(/^((?:-?\d+(?:\.\d+)?,\s*)+)_{2,}/);
  if (seq)
    return {
      kind: "sequence",
      terms: seq[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number),
    };
  return null;
}

/** Every number written in the problem text (the givens a model may show). */
export function givenNumbers(item) {
  return [...new Set((bareText(item).match(/-?\d+(?:\.\d+)?/g) || []).map(Number))];
}

/** Which drawer tool suits this problem, and the givens to load into it. Only operands, never results. */
export function drawerSeed(item) {
  const p = extractProblem(item);
  const seed = { problem: p, tool: null };
  if (!p) return seed;
  if (p.kind === "binary" && ["+", "-"].includes(p.op)) {
    const { op, a, b } = p;
    const spec = columnSpec(op, [p.aText, p.bText]);
    const signed = a < 0 || b < 0 || (op === "-" && a < b);
    const small = Math.abs(a) <= 15 && Math.abs(b) <= 15 && !p.decimals;
    if (spec && !signed && (p.decimals || spec.terms.some((x) => x.length >= 2))) {
      // Stacked columns, the problem's numbers lined up by place value (no jumps on a number line).
      seed.vertical = spec;
      seed.tool = "vertical";
    } else if (signed && small) {
      seed.integers = { pos: a > 0 ? a : 0, neg: a < 0 ? -a : 0, next: { op, value: b } };
      seed.tool = "integers";
    } else if (small && a >= 0) {
      seed.tenFrame = a;
      seed.tool = "tenframe";
    }
  }
  if (p.kind === "binary" && !p.decimals) {
    const { op, a, b } = p;
    if (op === "*" && a >= 0 && b >= 0) {
      const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
      seed.splitTarget = hi >= 2 ? hi : null;
      if (hi <= 10 && lo >= 1) seed.grid = { rows: lo, cols: hi };
      seed.tool = seed.grid ? "multigrid" : "splitter";
    }
    if (op === "÷" && a >= 1 && b >= 1) {
      seed.division = { dividend: a, divisor: b };
      seed.tool = "longdivision";
    }
  }
  if (p.kind === "fractions" && p.parts.length) {
    const [f, g] = p.parts;
    seed.denominators = [...new Set(p.parts.map((x) => x.d))].filter((d) => d <= 16);
    if (f.d <= 12) seed.pizza = { slices: f.d, shaded: Math.min(f.d, Math.max(0, f.n)) };
    seed.tool = p.op === "+" || p.op === "-" ? "pizza" : "fractions";
    if (!f || (g && p.op === "*")) seed.tool = "fractions";
  }
  if (p.kind === "fractionOf") {
    seed.denominators = [p.fraction.d].filter((d) => d <= 16);
    if (p.fraction.d <= 12)
      seed.pizza = {
        slices: p.fraction.d,
        shaded: Math.min(p.fraction.d, Math.max(0, p.fraction.n)),
      };
    seed.tool = "pizza";
  }
  if (p.kind === "equivalent") {
    seed.denominators = [p.d].filter((d) => d <= 16);
    seed.tool = "fractions";
  }
  if (p.kind === "equation" && !p.divisor && p.coeff >= 1) {
    seed.balance = { coeff: p.coeff, constant: p.constant, rhs: p.rhs };
    seed.tool = "balance";
  }
  if (p.kind === "ratio" && p.a && p.b) {
    seed.tape = { a: Math.min(8, Math.max(1, p.a)), b: Math.min(8, Math.max(1, p.b)) };
    seed.rateLine = { a: p.a, b: p.b, labelA: "Part A", labelB: "Part B" };
    seed.tool = "doublenumberline";
  }
  if (p.kind === "rate") {
    seed.rateLine = { a: p.total, b: p.count, labelA: "Amount", labelB: "Items" };
    seed.tool = "doublenumberline";
  }
  if (p.kind === "percent") {
    seed.rateLine = { a: p.base, b: 100, labelA: "Amount", labelB: "Percent (%)" };
    seed.tool = "doublenumberline";
  }
  if (p.kind === "proportion") {
    seed.rateLine = { a: p.n, b: p.d, labelA: "Top", labelB: "Bottom" };
    seed.tool = "doublenumberline";
  }
  if (
    p.kind === "dims" &&
    p.length <= 10 &&
    p.width <= 10 &&
    Number.isInteger(p.length) &&
    Number.isInteger(p.width)
  ) {
    seed.grid = { rows: Math.min(p.length, p.width), cols: Math.max(p.length, p.width) };
    seed.tool = "multigrid";
  }
  return seed;
}

/** Numbers a seed shows. The test checks each is one of the problem's givens (or a place-value hop / window edge). */
export function seedNumbers(seed) {
  const out = [];
  const add = (...values) => values.forEach((v) => Number.isFinite(v) && out.push(v));
  if (seed.tenFrame != null) add(seed.tenFrame);
  if (seed.integers) add(seed.integers.pos, seed.integers.neg, seed.integers.next?.value);
  if (seed.grid) add(seed.grid.rows, seed.grid.cols);
  if (seed.splitTarget) add(seed.splitTarget);
  if (seed.division) add(seed.division.dividend, seed.division.divisor);
  if (seed.pizza) add(seed.pizza.slices, seed.pizza.shaded);
  if (seed.denominators) add(...seed.denominators);
  if (seed.balance) add(seed.balance.coeff, seed.balance.constant, seed.balance.rhs);
  if (seed.tape) add(seed.tape.a, seed.tape.b);
  if (seed.rateLine) add(seed.rateLine.a, seed.rateLine.b);
  if (seed.vertical) add(...seed.vertical.terms.map(Number));
  return out;
}

/** [a, b] for a bare whole-number product "a × b"; a power such as "3 × 10^2" is not one. Otherwise null. */
export function plainProduct(text) {
  const match = String(text || "").match(/^(\d+)\s*[×*]\s*(\d+)(?![\d.^])/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}
