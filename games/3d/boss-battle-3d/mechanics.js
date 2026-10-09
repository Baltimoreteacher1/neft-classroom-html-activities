/**
 * Boss Battle 3D — construction mechanics (the math IS the attack).
 *
 * Every round asks the player to BUILD a quantity that the game then uses
 * physically: the number of crystals loaded into the cannon, the count of
 * pulses that drain a fractional shield, the beam power, or the grid point the
 * bolt flies to. A wrong build misses in a way you can see (fizzles short,
 * bounces off, lands left/below) — the target number is never printed.
 *
 * Round shape (all strings have an English + Spanish sibling):
 *   { unit, skill, mechanic: "beam" | "pulses" | "aim",
 *     en, es,                                    // the challenge
 *     fields: [{ labelEn, labelEs, answer, axis? }],
 *     hints: [{ en, es }, { en, es }],           // tier 1 method, tier 2 next step
 *     low: { en, es }, high: { en, es },         // directional miss feedback
 *     visual?: { shield, pulse } }               // pulses only
 *
 * Pure module: no DOM, no THREE. Tested by mechanics.test.mjs.
 */

export function makeRng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** "n/d" in lowest terms (whole numbers print without a denominator). */
export function fracStr(n, d) {
  const g = gcd(n, d);
  const nn = n / g;
  const dd = d / g;
  return dd === 1 ? String(nn) : `${nn}/${dd}`;
}

/** Parse "7", "-3", "2.5", "3/2", "1 1/2", "-1 1/2". NaN when unreadable. */
export function parseAnswer(text) {
  const s = String(text ?? "")
    .trim()
    .replace(/[−–]/g, "-")
    .replace(",", ".");
  if (!s) return Number.NaN;
  let m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const v = Number(m[2]) + Number(m[3]) / Number(m[4]);
    return Number(m[4]) === 0 ? Number.NaN : m[1] ? -v : v;
  }
  m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (m) return Number(m[2]) === 0 ? Number.NaN : Number(m[1]) / Number(m[2]);
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : Number.NaN;
}

export const sameNum = (a, b) => Math.abs(a - b) < 1e-6;

/** Compare a build against the round. dirs[i] is "ok" | "low" | "high" | "blank". */
export function checkBuild(round, values) {
  const dirs = round.fields.map((f, i) => {
    const v = values[i];
    if (!Number.isFinite(v)) return "blank";
    if (sameNum(v, f.answer)) return "ok";
    return v < f.answer ? "low" : "high";
  });
  return { ok: dirs.every((d) => d === "ok"), dirs };
}

const AIM_WORDS = {
  x: {
    low: { en: "landed LEFT of the weak point", es: "cayó a la IZQUIERDA del punto débil" },
    high: { en: "landed RIGHT of the weak point", es: "cayó a la DERECHA del punto débil" },
  },
  y: {
    low: { en: "landed BELOW the weak point", es: "cayó DEBAJO del punto débil" },
    high: { en: "landed ABOVE the weak point", es: "cayó ARRIBA del punto débil" },
  },
};

/** Directional miss message. Never contains the target value. */
export function missMessage(round, result) {
  if (result.dirs.includes("blank"))
    return {
      en: "Build every part before you fire (numbers like 6, 2.5 or 3/4).",
      es: "Completa cada parte antes de disparar (números como 6, 2.5 o 3/4).",
    };
  if (round.mechanic === "aim") {
    const parts = round.fields
      .map((f, i) => (result.dirs[i] === "ok" ? null : AIM_WORDS[f.axis][result.dirs[i]]))
      .filter(Boolean);
    const okPart = round.fields.length > 1 && parts.length === 1;
    return {
      en: `Your bolt ${parts.map((p) => p.en).join(" and ")}.${okPart ? " One coordinate is already on target." : ""}`,
      es: `Tu rayo ${parts.map((p) => p.es).join(" y ")}.${okPart ? " Una coordenada ya está en el blanco." : ""}`,
    };
  }
  const bad = result.dirs.find((d) => d !== "ok");
  return bad === "low" ? round.low : round.high;
}

