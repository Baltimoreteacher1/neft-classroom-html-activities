// living/plane-model.js — pure coordinate-plane maths shared by the plane-* plays.
//
// No DOM. Every number a plane scene states (a distance, a reflection, a
// quadrant, a perimeter) is computed here so the tests can check it in node
// without trusting the play that draws it.

export const MINUS = "−";
export const near = (a, b) => Math.abs(a - b) < 1e-9;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const isQuarter = (v) => Number.isFinite(v) && near(v * 4, Math.round(v * 4));

/** 4.5 -> "4.5", -3.75 -> "−3.75" (a real minus sign, read as "minus"). */
export function fmt(n) {
  const r = Math.round(n * 1000) / 1000;
  return (r < 0 ? MINUS : "") + String(Math.abs(r));
}
export const pt = (p) => `(${fmt(p.x)}, ${fmt(p.y)})`;
export const same = (a, b) => near(a.x, b.x) && near(a.y, b.y);

export const ROMAN = ["", "I", "II", "III", "IV"];
export const QSIGNS = {
  1: ["+", "+"],
  2: [MINUS, "+"],
  3: [MINUS, MINUS],
  4: ["+", MINUS],
};

/** 1-4 by the signs of the coordinates; 0 for a point on an axis. */
export function quadrant(p) {
  if (near(p.x, 0) || near(p.y, 0)) return 0;
  if (p.x > 0) return p.y > 0 ? 1 : 4;
  return p.y > 0 ? 2 : 3;
}

/** A range the stage can draw: integer bounds around the origin, at most 16 wide/tall. */
export function validRange(r) {
  if (!r || typeof r !== "object") return null;
  const out = { xmin: r.xmin, xmax: r.xmax, ymin: r.ymin, ymax: r.ymax };
  if (![out.xmin, out.ymin].every((v) => okInt(v, -16, 0))) return null;
  if (![out.xmax, out.ymax].every((v) => okInt(v, 0, 16))) return null;
  const xs = out.xmax - out.xmin;
  const ys = out.ymax - out.ymin;
  if (xs < 4 || ys < 4 || xs > 16 || ys > 16) return null;
  return out;
}

export const inRange = (p, r) => p.x >= r.xmin && p.x <= r.xmax && p.y >= r.ymin && p.y <= r.ymax;

/** A plain point {x, y} on the quarter grid inside the range, or null. */
export function validPoint(p, r) {
  if (!p || typeof p !== "object") return null;
  const x = typeof p.x === "number" ? p.x : Number.NaN;
  const y = typeof p.y === "number" ? p.y : Number.NaN;
  if (!isQuarter(x) || !isQuarter(y)) return null;
  const out = { x, y };
  return inRange(out, r) ? out : null;
}

/** A short {en, es} label (<= max chars) or the fallback. */
export function labelOf(v, fallback, max = 22) {
  const ok = (s) => typeof s === "string" && s.trim() && s.length <= max;
  if (ok(v)) return { en: v, es: v };
  if (v && ok(v.en)) return { en: v.en, es: ok(v.es) ? v.es : v.en };
  return fallback;
}

/** A story {en, es} (<= 400 chars) or null. */
export function storyOf(s) {
  return s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 400), es: String(s.es || s.en).slice(0, 400) }
    : null;
}

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

/** Keep the first option for each `key`; the correct one must survive. */
export function distinct(options, key) {
  const seen = new Set();
  const out = [];
  for (const o of options) {
    const k = key(o);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(o);
  }
  return out;
}

/** What went wrong when a student placed `p` for the target `t`. */
export function classifyPlacement(t, p) {
  if (same(t, p)) return "ok";
  if (!near(t.x, t.y) && same(p, { x: t.y, y: t.x })) return "swap";
  const sx = near(p.x, -t.x) && !near(t.x, 0);
  const sy = near(p.y, -t.y) && !near(t.y, 0);
  if (sx && sy) return "signs";
  if (sx && near(p.y, t.y)) return "signx";
  if (sy && near(p.x, t.x)) return "signy";
  if (near(p.y, t.y)) return "x";
  if (near(p.x, t.x)) return "y";
  return "both";
}

/**
 * A cue for a wrongly placed point: names the mismatch and asks a question, so
 * the student does the move again. It never says where the dot should go.
 */
export function plotCue(kind, t, p) {
  const T = pt(t);
  const P = pt(p);
  const cues = {
    swap: {
      en: `Your dot is at ${P}: the numbers are in the wrong order. In ${T}, which number goes first, and which way does it move you?`,
      es: `Tu punto está en ${P}: los números están en el orden equivocado. En ${T}, ¿qué número va primero y hacia dónde te mueve?`,
    },
    signx: {
      en: `Your dot is on the wrong side of the y-axis. Look at the sign of the first number in ${T}: does it send you right or left?`,
      es: `Tu punto está del lado equivocado del eje y. Mira el signo del primer número de ${T}: ¿te manda a la derecha o a la izquierda?`,
    },
    signy: {
      en: `Your dot is on the wrong side of the x-axis. Look at the sign of the second number in ${T}: does it send you up or down?`,
      es: `Tu punto está del lado equivocado del eje x. Mira el signo del segundo número de ${T}: ¿te manda hacia arriba o hacia abajo?`,
    },
    signs: {
      en: `Your dot is on the opposite side of the origin in both directions. Check the sign of each number in ${T}: which way does each one send you?`,
      es: `Tu punto está al lado opuesto del origen en las dos direcciones. Revisa el signo de cada número de ${T}: ¿hacia dónde te manda cada uno?`,
    },
    x: {
      en: `The up-and-down part of your dot matches ${T}, but the sideways part does not. Check the first number: how far, and which way, along the x-axis?`,
      es: `La parte de arriba y abajo de tu punto coincide con ${T}, pero la parte de los lados no. Revisa el primer número: ¿cuánto y hacia dónde sobre el eje x?`,
    },
    y: {
      en: `The sideways part of your dot matches ${T}, but the up-and-down part does not. Check the second number: how far, and which way, from the x-axis?`,
      es: `La parte de los lados de tu punto coincide con ${T}, pero la parte de arriba y abajo no. Revisa el segundo número: ¿cuánto y hacia dónde desde el eje x?`,
    },
    both: {
      en: `Neither move matches ${T} yet. Start at the origin: the first number moves you along the x-axis, then the second number moves you up or down.`,
      es: `Ninguno de los dos movimientos coincide con ${T} todavía. Empieza en el origen: el primer número te mueve sobre el eje x y luego el segundo te mueve hacia arriba o hacia abajo.`,
    },
  };
  return cues[kind] || cues.both;
}

/** Horizontal or vertical distance between two points that share a coordinate. */
export function axisDistance(a, b) {
  if (near(a.y, b.y)) return Math.abs(a.x - b.x);
  if (near(a.x, b.x)) return Math.abs(a.y - b.y);
  return null;
}

/** "horizontal" | "vertical" | null for two points. */
export function lineKind(a, b) {
  if (same(a, b)) return null;
  if (near(a.y, b.y)) return "horizontal";
  if (near(a.x, b.x)) return "vertical";
  return null;
}

/** The pair of coordinates that differ, in order, for a horizontal/vertical pair. */
export function varying(a, b) {
  return near(a.y, b.y) ? [a.x, b.x] : [a.y, b.y];
}

export const sum = (xs) => xs.reduce((s, v) => s + v, 0);
