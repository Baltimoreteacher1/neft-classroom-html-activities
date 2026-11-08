/**
 * Deterministic, integer-safe equation balance operations shared by Fluency Lab
 * and Language Studios. Equations use (an/ad)x + b = c, with integer values.
 */
const cleanEquation = (question) =>
  String(question).replaceAll("−", "-").replaceAll(",", "").replace(/\s+/g, " ").trim();

const safeIntegers = (...values) => values.every(Number.isSafeInteger);

function makeEquation(an, ad, b, c) {
  if (!safeIntegers(an, ad, b, c) || an <= 0 || ad <= 0) return null;
  const numerator = (c - b) * ad;
  if (!Number.isSafeInteger(numerator) || numerator % an !== 0) return null;
  const x = numerator / an;
  if (!Number.isSafeInteger(x)) return null;
  return { engine: "balance", an, ad, b, c, x, eq: { an, ad, b, c } };
}

/** Parse x + b = c, ax = c, x/d = c, or (a/d)x + b = c. */
export function parseLinearEquation(question) {
  const q = cleanEquation(question)
    .replace(/\. Find x\.$/u, "")
    .replace(/ /gu, "");
  let m = q.match(/^(\d*)x([+-])(\d+)=(-?\d+)$/u);
  if (m)
    return makeEquation(
      Number(m[1] || 1),
      1,
      m[2] === "+" ? Number(m[3]) : -Number(m[3]),
      Number(m[4]),
    );
  m = q.match(/^(\d+)x=(-?\d+)$/u);
  if (m) return makeEquation(Number(m[1]), 1, 0, Number(m[2]));
  m = q.match(/^x([+-])(\d+)=(-?\d+)$/u);
  if (m) return makeEquation(1, 1, m[1] === "+" ? Number(m[2]) : -Number(m[2]), Number(m[3]));
  m = q.match(/^x÷(\d+)=(-?\d+)$/u);
  if (m) return makeEquation(1, Number(m[1]), 0, Number(m[2]));
  return null;
}

export const equationCoefficient = (e) =>
  e.ad === 1 ? (e.an === 1 ? "x" : `${e.an}x`) : e.an === 1 ? `x/${e.ad}` : `(${e.an}/${e.ad})x`;
export const signedConstant = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);

export const formatLinearEquation = (e) =>
  `${equationCoefficient(e)}${e.b ? ` ${signedConstant(e.b)}` : ""} = ${String(e.c).replace("-", "−")}`;

export const equationHolds = (e, x) => {
  if (!e || !safeIntegers(e.an, e.ad, e.b, e.c, x)) return false;
  const left = e.an * x + e.b * e.ad;
  const right = e.c * e.ad;
  return safeIntegers(left, right) && left === right;
};

export const equationIsSolved = (e) => e.an === e.ad && e.b === 0;

/** Legal inverse operations that isolate x without changing the solution. */
export function equationMoves(e0) {
  const list = [];
  let e = { ...e0 };
  if (e.b !== 0) {
    const n = -e.b;
    list.push({ kind: "add", n });
    e = { ...e, b: 0, c: e.c + n };
  }
  if (e.an !== e.ad) {
    if (e.ad > 1 && e.an === 1) list.push({ kind: "mul", n: e.ad });
    else list.push({ kind: "div", n: e.an });
  }
  return list;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const reduceCoefficient = (e) => {
  const g = gcd(e.an, e.ad) || 1;
  return { ...e, an: e.an / g, ad: e.ad / g };
};

/** Apply a matching operation to both sides; invalid or inexact division returns null. */
export function applyEquationMove(e, move) {
  if (
    !e ||
    !move ||
    !safeIntegers(e.an, e.ad, e.b, e.c, move.n) ||
    (move.n <= 0 && move.kind !== "add")
  )
    return null;
  if (move.kind === "add") {
    const next = { ...e, b: e.b + move.n, c: e.c + move.n };
    return safeIntegers(next.b, next.c) ? next : null;
  }
  if (move.kind === "mul") {
    const next = { ...e, an: e.an * move.n, b: e.b * move.n, c: e.c * move.n };
    return safeIntegers(next.an, next.b, next.c) ? reduceCoefficient(next) : null;
  }
  if (move.kind === "div") {
    if (e.b % move.n !== 0 || e.c % move.n !== 0) return null;
    const next = { ...e, ad: e.ad * move.n, b: e.b / move.n, c: e.c / move.n };
    return safeIntegers(next.ad, next.b, next.c) ? reduceCoefficient(next) : null;
  }
  return null;
}
