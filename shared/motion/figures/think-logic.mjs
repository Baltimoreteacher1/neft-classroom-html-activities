// The logic behind "Think it through": predict, targeted feedback, a new equivalent problem, error analysis and build-to-target.
// Pure functions over a figure's optional `headline` and `wrong` methods (docs/motion-figure-contract.md). No DOM, no clock, no
// randomness beyond a seeded generator, so a saved seed restores exactly the same problem.
import { int, parse, Rat } from "../exact.mjs";

/** @param {string} s */
export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded generator (mulberry32). @param {number} seed */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @typedef {import("./mount.mjs").Figure} Figure */

/** The figure's headline and wrong move at these values, or null when the figure has no think support or the setting is refused.
 * @param {Figure} fig @param {string} key @param {number[]} values @param {"en" | "es"} lang */
export function problemAt(fig, key, values, lang) {
  if (typeof fig.headline !== "function") return null;
  try {
    const model = fig.build(key, values);
    const head = fig.headline(model, lang);
    const wrong = typeof fig.wrong === "function" && fig.thinkWrong !== false ? fig.wrong(model, lang) : null;
    return { model, head, wrong };
  } catch (e) {
    if (e instanceof RangeError) return null;
    throw e;
  }
}

/** @param {string} v the decimals in a plain number string */
const decimals = (v) => (/\.(\d+)$/.exec(v.replace(/,/g, "")) || [, ""])[1].length;

/**
 * Is `text` the headline? By value ("2.50" = "2.5" = "5/2"), never by string. An approximate headline accepts anything that rounds to it.
 * @param {{ value: string, approx?: boolean }} head @param {string} text
 */
export function answerOk(head, text) {
  const got = parse(text);
  const want = parse(head.value);
  if (!got || !want) return false;
  if (got.eq(want)) return true;
  if (!head.approx) return false;
  const tol = new Rat(1n, 10n ** BigInt(decimals(head.value) + 1)).mul(int(5));
  const d = got.sub(want);
  return (d.n < 0n ? new Rat(-d.n, d.d) : d).sub(tol).n <= 0n;
}

/**
 * Feedback for a typed prediction. Never states the answer.
 * @returns {{ kind: "right" | "empty" | "not-a-number" | "wrong-move" | "other", say?: string }}
 * @param {Figure} fig @param {ReturnType<typeof problemAt>} p @param {string} text
 */
export function judge(p, text) {
  if (!p) return { kind: "other" };
  if (!text.trim()) return { kind: "empty" };
  if (!parse(text)) return { kind: "not-a-number" };
  if (answerOk(p.head, text)) return { kind: "right" };
  if (p.wrong && answerOk({ value: p.wrong.value, approx: p.head.approx }, text)) return { kind: "wrong-move", say: p.wrong.say };
  return { kind: "other" };
}

/**
 * A new, equivalent problem: the same figure at fresh legal values. Deterministic in (key, mode, seed). It differs from every value
 * in `avoid` (by headline), and, when `needWrong`, is one where the figure has a wrong move to analyse.
 * @param {Figure} fig @param {string} key @param {number[]} base @param {string} salt
 * @param {{ avoid?: string[], needWrong?: boolean }} [o]
 */
export function newProblem(fig, key, base, salt, o = {}) {
  const random = rng(hash(`${key}|${salt}`));
  const controls = fig.controls(key);
  const avoid = new Set(o.avoid || []);
  for (let tries = 0; tries < 400; tries++) {
    const values = controls.map((c, i) => {
      if (c.min === c.max) return base[i];
      const steps = Math.round((c.max - c.min) / c.step);
      return Number((c.min + Math.floor(random() * (steps + 1)) * c.step).toFixed(6));
    });
    const p = problemAt(fig, key, values, "en");
    if (!p) continue;
    if (avoid.has(p.head.value)) continue;
    if (o.needWrong && !p.wrong) continue;
    return { values, problem: p };
  }
  return null;
}

/** @param {number} n a seeded order of 0..n-1 @param {string} salt */
export function order(n, salt) {
  const random = rng(hash(salt));
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build-to-target check: does this setting make the headline exactly `target`?
 * @returns {{ ok: boolean, got?: string, relation?: "high" | "low", invalid?: string }}
 * @param {Figure} fig @param {string} key @param {number[]} values @param {string} target
 */
export function buildCheck(fig, key, values, target) {
  const p = problemAt(fig, key, values, "en");
  if (!p) return { ok: false, invalid: "setting" };
  const t = parse(target);
  const g = parse(p.head.value);
  if (!t || !g) return { ok: false, invalid: "number" };
  if (g.eq(t)) return { ok: true, got: p.head.value };
  const diff = g.sub(t);
  return { ok: false, got: p.head.value, relation: diff.n > 0n ? "high" : "low" };
}
