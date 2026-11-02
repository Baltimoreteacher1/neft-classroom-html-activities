// Response signatures for the misconceptions in misconception-library.js that can be recognised from one answer.
// A detector fires only when the learner's answer is EXACTLY what the misconception would produce AND differs from the
// correct answer. Exact rational arithmetic is used throughout, so 7/20 and 0.35 are the same value and no rounding
// can create or hide a match. A single answer is only ever evidence ("possible"); repeated, distinct items raise it.
import { Rational, R, parseRational } from "./rational.js";

const NUM = "-?[\\d,]*\\.?\\d+";
const num = (s) => parseRational(String(s).replace(/,/g, "")) || null;
const places = (s) =>
  String(s).includes(".") ? String(s).split(".")[1].length : 0;
const digitsOf = (s) => Number(String(s).replace(/[.,-]/g, ""));
const isInt = (r) => r && r.isInteger();
const same = (x, y) => x && y && x.eq(y);

const BIN = new RegExp(
  `^\\s*(${NUM})\\s*([+−×÷-])\\s*\\(?\\s*(${NUM})\\s*\\)?\\s*=\\s*\\?\\s*$`,
);
const FRAC = /^\s*(\d+)\/(\d+)\s*([+−-])\s*(\d+)\/(\d+)\s*=\s*\?\s*$/;

function binary(q) {
  const m = BIN.exec(q);
  return m
    ? { a: num(m[1]), op: m[2], b: num(m[3]), sa: m[1], sb: m[3] }
    : null;
}

// Each detector: parse(ctx) returns a structure when the question has the shape the misconception lives in, then
// test(parsed, r, c) returns evidence text (en/es) or null. r = response, c = correct (both Rational).
const D = {
  "place-value-digit-as-value": {
    parse: (q) => {
      const m = /value of the digit in the (\w+) place of ([\d,]+)/.exec(q);
      if (!m) return null;
      const place = { ones: 0, tens: 1, hundreds: 2, thousands: 3 }[m[1]];
      if (place === undefined) return null;
      return { digit: Number(String(m[2]).replace(/,/g, "").split("").reverse()[place]) };
    },
    test: (p, r, c) =>
      same(r, R(p.digit)) && !same(r, c)
        ? [
            "gave the digit itself, not its value",
            "dio el dígito mismo, no su valor",
          ]
        : null,
  },
  "counting-off-by-one": {
    parse: (q) => (/^\s*[\d, ]+,\s*_{2,}\s*$/.test(q) ? {} : null),
    test: (p, r, c) =>
      same(r, c.add(1)) || same(r, c.sub(1))
        ? [
            "was one away from the count",
            "se pasó o se quedó corto por uno en el conteo",
          ]
        : null,
  },
  "rounding-always-down": {
    parse: (q) => {
      const m = /Round (\d+) to the nearest (ten|hundred|thousand)/.exec(q);
      if (!m) return null;
      const unit = { ten: 10, hundred: 100, thousand: 1000 }[m[2]];
      return { down: Math.floor(Number(m[1]) / unit) * unit };
    },
    test: (p, r, c) =>
      same(r, R(p.down)) && !same(r, c)
        ? [
            "rounded down when the number is closer to the next benchmark",
            "redondeó hacia abajo cuando el número está más cerca del siguiente valor",
          ]
        : null,
  },
  "addition-no-regroup": {
    parse: (q) => {
      const b = binary(q);
      if (
        !b ||
        b.op !== "+" ||
        !isInt(b.a) ||
        !isInt(b.b) ||
        b.a.sign() < 0 ||
        b.b.sign() < 0
      )
        return null;
      const A = String(b.a).split("").reverse().map(Number);
      const B = String(b.b).split("").reverse().map(Number);
      const n = Math.max(A.length, B.length);
      const cols = Array.from(
        { length: n },
        (_, i) => (A[i] || 0) + (B[i] || 0),
      );
      if (!cols.some((x) => x >= 10)) return null;
      return {
        noCarry: Number(
          cols
            .map((x) => x % 10)
            .reverse()
            .join(""),
        ),
        concat: Number(cols.slice().reverse().join("")),
      };
    },
    test: (p, r, c) =>
      same(r, R(p.noCarry))
        ? ["left out the carried ten", "olvidó llevar la decena"]
        : same(r, R(p.concat))
          ? [
              "wrote each column's total side by side",
              "escribió el total de cada columna una al lado de otra",
            ]
          : null,
  },
  "subtract-smaller-from-larger": {
    parse: (q) => {
      const b = binary(q);
      if (
        !b ||
        b.op !== "−" ||
        !isInt(b.a) ||
        !isInt(b.b) ||
        b.a.sign() < 0 ||
        b.b.sign() < 0 ||
        b.a.lt(b.b)
      )
        return null;
      const A = String(b.a).split("").reverse().map(Number);
      const B = String(b.b).split("").reverse().map(Number);
      const n = Math.max(A.length, B.length);
      let needs = false;
      const out = [];
      for (let i = 0; i < n; i += 1) {
        const x = A[i] || 0;
        const y = B[i] || 0;
        if (x < y) needs = true;
        out.push(Math.abs(x - y));
      }
      return needs ? { value: Number(out.reverse().join("")) } : null;
    },
    test: (p, r, c) =>
      same(r, R(p.value))
        ? [
            "subtracted the smaller digit from the larger in a column",
            "restó el dígito menor del mayor en una columna",
          ]
        : null,
  },
  "operation-swap": {
    parse: (q) => {
      const b = binary(q);
      if (!b || !["+", "−"].includes(b.op) || !b.a || !b.b) return null;
      return { other: b.op === "+" ? b.a.sub(b.b) : b.a.add(b.b) };
    },
    test: (p, r, c) =>
      same(r, p.other) && !same(r, c)
        ? [
            "used the opposite operation (+ and − swapped)",
            "usó la operación contraria (+ y − al revés)",
          ]
        : null,
  },
  "missing-addend-adds": {
    parse: (q) => {
      const m =
        /^\s*(\d+)\s*\+\s*□\s*=\s*(\d+)/.exec(q) ||
        /^\s*□\s*\+\s*(\d+)\s*=\s*(\d+)/.exec(q);
      return m ? { sum: Number(m[1]) + Number(m[2]) } : null;
    },
    test: (p, r, c) =>
      same(r, R(p.sum)) && !same(r, c)
        ? [
            "added the two numbers instead of finding the missing part",
            "sumó los dos números en lugar de hallar la parte que falta",
          ]
        : null,
  },
  "multiply-adds": {
    parse: (q) => {
      const b = binary(q);
      return b && b.op === "×" && isInt(b.a) && isInt(b.b)
        ? { sum: b.a.add(b.b) }
        : null;
    },
    test: (p, r, c) =>
      same(r, p.sum) && !same(r, c)
        ? [
            "added the factors instead of multiplying",
            "sumó los factores en lugar de multiplicar",
          ]
        : null,
  },
  "multi-digit-no-placeholder": {
    parse: (q) => {
      const b = binary(q);
      if (!b || b.op !== "×" || !isInt(b.a) || !isInt(b.b) || b.b.lt(10))
        return null;
      const bs = String(b.b).split("").reverse().map(Number);
      const noShift = bs.reduce((acc, d) => acc.add(b.a.mul(d)), R(0));
      return { noShift };
    },
    test: (p, r, c) =>
      same(r, p.noShift) && !same(r, c)
        ? [
            "did not shift the partial products by place value",
            "no desplazó los productos parciales según el valor posicional",
          ]
        : null,
  },
  "division-multiplies": {
    parse: (q) => {
      const b = binary(q);
      return b && b.op === "÷" ? { prod: b.a.mul(b.b) } : null;
    },
    test: (p, r, c) =>
      same(r, p.prod) && !same(r, c)
        ? ["multiplied instead of dividing", "multiplicó en lugar de dividir"]
        : null,
  },
  "fraction-add-denominators": {
    parse: (q) => {
      const m = FRAC.exec(q);
      if (!m) return null;
      const [n1, d1, n2, d2] = [m[1], m[2], m[4], m[5]].map(Number);
      const sub = m[3] === "−" || m[3] === "-";
      const nd = sub ? d1 - d2 : d1 + d2;
      return nd === 0 ? null : { value: R(sub ? n1 - n2 : n1 + n2, nd) };
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "combined the numerators and the denominators",
            "combinó numeradores y denominadores",
          ]
        : null,
  },
  "fraction-equivalent-add": {
    parse: (q) => {
      const m = /^\s*(\d+)\/(\d+)\s*=\s*(\d+|□)\/(\d+|□)\s*$/.exec(q);
      if (!m) return null;
      if (m[3] === "□" && m[4] !== "□")
        return { value: Number(m[1]) + (Number(m[4]) - Number(m[2])) };
      if (m[4] === "□" && m[3] !== "□")
        return { value: Number(m[2]) + (Number(m[3]) - Number(m[1])) };
      return null;
    },
    test: (p, r, c) =>
      same(r, R(p.value)) && !same(r, c)
        ? [
            "added the same amount to both parts instead of multiplying",
            "sumó la misma cantidad a ambas partes en lugar de multiplicar",
          ]
        : null,
  },
  "fraction-of-divides-by-numerator": {
    parse: (q) => {
      const m = /^\s*What is (\d+)\/(\d+) of (\d+)\?\s*$/.exec(q);
      return m && Number(m[1]) > 1
        ? { value: R(Number(m[3]), Number(m[1])) }
        : null;
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "divided by the numerator instead of the denominator",
            "dividió entre el numerador en lugar de entre el denominador",
          ]
        : null,
  },
  "decimal-align-right": {
    parse: (q) => {
      const b = binary(q);
      if (
        !b ||
        !["+", "−"].includes(b.op) ||
        places(b.sa) === places(b.sb) ||
        (!b.sa.includes(".") && !b.sb.includes("."))
      )
        return null;
      const k = Math.max(places(b.sa), places(b.sb));
      const x = digitsOf(b.sa);
      const y = digitsOf(b.sb);
      return { value: R(b.op === "+" ? x + y : Math.abs(x - y), 10 ** k) };
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "lined the digits up on the right instead of the decimal points",
            "alineó los dígitos a la derecha en lugar de los puntos decimales",
          ]
        : null,
  },
  "decimal-product-point": {
    parse: (q) => {
      const b = binary(q);
      if (!b || b.op !== "×" || (!b.sa.includes(".") && !b.sb.includes(".")))
        return null;
      return {
        digits: R(digitsOf(b.sa) * digitsOf(b.sb)),
        alt: R(
          digitsOf(b.sa) * digitsOf(b.sb),
          10 ** Math.max(places(b.sa), places(b.sb)),
        ),
      };
    },
    test(p, r, c) {
      if (same(r, c)) return null;
      const ratio = c.isZero() || r.isZero() ? null : r.div(c);
      const pow10 =
        ratio &&
        [10, 100, 1000, R(1, 10), R(1, 100), R(1, 1000)].some((k) =>
          ratio.eq(k),
        );
      return pow10 || same(r, p.alt)
        ? [
            "has the right digits but the decimal point in the wrong place",
            "tiene los dígitos correctos pero el punto decimal mal colocado",
          ]
        : null;
    },
  },
  "ratio-additive": {
    parse: (q) => {
      const m =
        /^\s*(\d+):(\d+)\s*=\s*(\d+|□):(\d+|□)\s*$/.exec(q) ||
        /^\s*(\d+)\/(\d+)\s*=\s*(x|\d+)\/(x|\d+)\.\s*Find x\.?\s*$/.exec(q);
      if (!m) return null;
      const slash = q.includes("/");
      const blank = (s) => s === "□" || s === "x";
      const [a, b, c2, d] = [m[1], m[2], m[3], m[4]];
      if (blank(c2)) return { value: Number(a) + (Number(d) - Number(b)) };
      if (blank(d)) return { value: Number(b) + (Number(c2) - Number(a)) };
      return slash ? null : null;
    },
    test: (p, r, c) =>
      same(r, R(p.value)) && !same(r, c)
        ? [
            "added the same amount to both numbers instead of multiplying",
            "sumó la misma cantidad a ambos números en lugar de multiplicar",
          ]
        : null,
  },
  "percent-skips-divide-100": {
    parse: (q) => {
      const m = /^\s*What is (\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?)\?\s*$/.exec(q);
      return m ? { p: num(m[1]), w: num(m[2]) } : null;
    },
    test: (p, r, c) =>
      same(r, p.p.mul(p.w)) && !same(r, c)
        ? [
            "multiplied by the percent without dividing by 100",
            "multiplicó por el porcentaje sin dividir entre 100",
          ]
        : null,
  },
  "percent-inverts": {
    parse: (q) => {
      const m = /^\s*What is (\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?)\?\s*$/.exec(q);
      return m && !num(m[1]).isZero() ? { v: num(m[2]).div(num(m[1])) } : null;
    },
    test: (p, r, c) =>
      same(r, p.v) && !same(r, c)
        ? [
            "divided the whole by the percent",
            "dividió el total entre el porcentaje",
          ]
        : null,
  },
  "percent-change-direction": {
    parse: (q) => {
      const m =
        /^\s*(\d+(?:\.\d+)?) with a (\d+(?:\.\d+)?)% (increase|decrease) equals what\?\s*$/.exec(
          q,
        );
      if (!m) return null;
      const [w, p] = [num(m[1]), num(m[2])];
      return { value: m[3] === "increase" ? w.add(p) : w.sub(p) };
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "added or subtracted the percent as a plain number",
            "sumó o restó el porcentaje como un número cualquiera",
          ]
        : null,
  },
  "integer-sign-flip": {
    parse: (q) => {
      const b = binary(q);
      return b &&
        /[+−]/.test(b.op) &&
        (b.a.sign() < 0 || b.b.sign() < 0 || q.includes("("))
        ? {}
        : null;
    },
    test: (p, r, c) =>
      !c.isZero() && same(r, c.neg())
        ? [
            "got the size right but the sign wrong",
            "acertó el tamaño pero se equivocó en el signo",
          ]
        : null,
  },
  "integer-subtract-negative": {
    parse: (q) => {
      const b = binary(q);
      return b && b.op === "−" && b.b.sign() < 0
        ? { value: b.a.sub(b.b.abs()) }
        : null;
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "subtracted the number's size instead of adding its opposite",
            "restó el tamaño del número en lugar de sumar su opuesto",
          ]
        : null,
  },
  "absolute-value-negative": {
    parse: (q) => {
      const m = /^\s*\|\s*(-?\d+(?:\.\d+)?)\s*\|\s*=\s*\?\s*$/.exec(q);
      return m && num(m[1]).sign() < 0 ? { value: num(m[1]) } : null;
    },
    test: (p, r, c) =>
      same(r, p.value)
        ? [
            "kept the negative sign on an absolute value",
            "conservó el signo negativo en un valor absoluto",
          ]
        : null,
  },
  "equation-inverse-wrong": {
    parse: (q) => {
      let m = /^\s*x\s*([+−-])\s*(\d+)\s*=\s*(-?\d+)\.\s*Find x\.?\s*$/.exec(q);
      // x + a = c answered c + a, or x - a = c answered c - a: the same operation was repeated instead of undone.
      if (m) return { alt: m[1] === "+" ? R(Number(m[3]) + Number(m[2])) : R(Number(m[3]) - Number(m[2])) };
      m = /^\s*x\s*[÷/]\s*(\d+)\s*=\s*(-?\d+)\.\s*Find x\.?\s*$/.exec(q);
      return m ? { alt: R(Number(m[2]), Number(m[1])) } : null;
    },
    test: (p, r, c) => (same(r, p.alt) && !same(r, c) ? ["used the same operation instead of the inverse", "usó la misma operación en vez de la inversa"] : null),
  },
  "equation-skips-constant": {
    parse: (q) => {
      const m =
        /^\s*(\d+)x\s*([+−-])\s*(\d+)\s*=\s*(-?\d+)\.\s*Find x\.?\s*$/.exec(q);
      return m ? { value: R(Number(m[4]), Number(m[1])) } : null;
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "divided by the coefficient without first undoing the constant",
            "dividió entre el coeficiente sin deshacer primero la constante",
          ]
        : null,
  },
  "coefficient-multiplies": {
    parse: (q) => {
      const m = /^\s*(\d+)x\s*=\s*(-?\d+)\.\s*Find x\.?\s*$/.exec(q);
      return m ? { value: R(Number(m[2])).mul(Number(m[1])) } : null;
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "multiplied by the coefficient instead of dividing",
            "multiplicó por el coeficiente en lugar de dividir",
          ]
        : null,
  },
  "slope-flipped": {
    parse: (q) => {
      const m =
        /^\s*Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.?\s*$/.exec(
          q,
        );
      if (!m) return null;
      const [x1, y1, x2, y2] = m.slice(1, 5).map(Number);
      return y2 === y1 || x2 === x1 ? null : { value: R(x2 - x1, y2 - y1) };
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? ["wrote run over rise", "escribió avance sobre elevación"]
        : null,
  },
  "exponent-times-base": {
    parse: (q) => {
      const m = /^\s*(\d+)\^(\d+)\s*=\s*\?\s*$/.exec(q);
      return m ? { value: R(Number(m[1]) * Number(m[2])) } : null;
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "multiplied the base by the exponent",
            "multiplicó la base por el exponente",
          ]
        : null,
  },
  "square-root-halves": {
    parse: (q) => {
      const m = /^\s*√(\d+)\s*=\s*\?\s*$/.exec(q);
      return m ? { value: R(Number(m[1]), 2) } : null;
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? [
            "divided the number by 2 to find a square root",
            "dividió el número entre 2 para hallar una raíz cuadrada",
          ]
        : null,
  },
  "area-perimeter-confusion": {
    parse: (q) => {
      const m =
        /^\s*(Area|Perimeter) of a rectangle with length (\d+) and width (\d+)\?\s*$/.exec(
          q,
        );
      if (!m) return null;
      const [l, w] = [Number(m[2]), Number(m[3])];
      return m[1] === "Area"
        ? {
            value: R(2 * (l + w)),
            note: "found the perimeter when asked for area",
          }
        : { value: R(l * w), half: R(l + w) };
    },
    test: (p, r, c) =>
      same(r, p.value) && !same(r, c)
        ? p.note
          ? [
              "found the perimeter when asked for area",
              "halló el perímetro cuando se pedía el área",
            ]
          : [
              "found the area when asked for perimeter",
              "halló el área cuando se pedía el perímetro",
            ]
        : p.half && same(r, p.half) && !same(r, c)
          ? [
              "added only two sides for the perimeter",
              "sumó solo dos lados para el perímetro",
            ]
          : null,
  },
  "unit-conversion-direction": {
    parse: (q) => {
      const m = /^\s*(\d+(?:\.\d+)?) ([a-z]+) = how many ([a-z]+)\?\s*$/.exec(
        q,
      );
      return m ? { n: num(m[1]) } : null;
    },
    test: (p, r, c) =>
      !c.isZero() && same(r, p.n.mul(p.n).div(c)) && !same(r, c)
        ? [
            "converted in the wrong direction (multiplied instead of divided, or the reverse)",
            "convirtió en la dirección contraria (multiplicó en lugar de dividir, o al revés)",
          ]
        : null,
  },
};

// Comparison problems answer with a symbol, so they are handled on the raw text.
function compareDenominator(question, response, answers) {
  const m = /^\s*(\d+)\/(\d+)\s*_{2,}\s*(\d+)\/(\d+)\s*$/.exec(question);
  if (!m) return null;
  const [d1, d2] = [Number(m[2]), Number(m[4])];
  const predicted = d1 > d2 ? ">" : d1 < d2 ? "<" : "=";
  return String(response).trim() === predicted &&
    predicted !== String(answers[0]).trim()
    ? [
        "compared the denominators as if a bigger one meant a bigger fraction",
        "comparó los denominadores como si uno mayor significara una fracción mayor",
      ]
    : null;
}

export function matchSignatures(skill, question, response, answers) {
  const found = [];
  const r = parseRational(response);
  const c = parseRational(String(answers[0]));
  const cmp = compareDenominator(question, response, answers);
  if (cmp)
    found.push({
      id: "fraction-bigger-denominator-bigger",
      evidence: { en: cmp[0], es: cmp[1] },
      confidence: "medium",
    });
  if (!r || !c) return found;
  for (const [id, d] of Object.entries(D)) {
    const parsed = d.parse(String(question));
    if (!parsed) continue;
    const ev = d.test(parsed, r, c);
    if (ev)
      found.push({
        id,
        evidence: { en: ev[0], es: ev[1] },
        confidence: HIGH.has(id) ? "high" : "medium",
      });
  }
  return found;
}

// Signatures so specific that one answer is already strong evidence. Others need a second distinct item to be called likely.
const HIGH = new Set([
  "fraction-add-denominators",
  "fraction-equivalent-add",
  "decimal-align-right",
  "ratio-additive",
  "percent-skips-divide-100",
  "percent-inverts",
  "multi-digit-no-placeholder",
  "exponent-times-base",
  "square-root-halves",
  "equation-skips-constant",
  "slope-flipped",
  "absolute-value-negative",
  "integer-subtract-negative",
]);

export const DETECTABLE_IDS = Object.freeze([
  ...Object.keys(D),
  "fraction-bigger-denominator-bigger",
]);
