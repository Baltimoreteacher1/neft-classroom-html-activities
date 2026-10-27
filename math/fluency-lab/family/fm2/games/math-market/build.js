// Small builders shared by the round generators. A round is plain JSON: the semantic inputs live in `params`, the
// scene the learner sees in `scene`, and the exact answer in `expect` (rationals in each field's own unit).
import { eq, frac, toDecimalString } from "../../rational.js";

export const T = (en, es) => ({ en, es });
export const lv = (level, a, b, c) => [a, b, c][level - 1];
export const F = (key, unit, en, es) => ({ key, unit, label: T(en, es) });
export const usd = (cents) => frac(cents, 100);
export const wr = (mistake, key, value) => ({ mistake, values: { [key]: value } });
export const both = (a, b) => T(`${a.en} ${b.en}`, `${a.es} ${b.es}`);
export const ROUND_NOTE = T(
  "Round to the nearest cent (half a cent rounds up).",
  "Redondea al centavo más cercano (medio centavo se redondea hacia arriba).",
);

const sameValues = (a, b) => Object.keys(a).every((key) => b[key] && eq(a[key], b[key]));
// A learner types decimals, so a wrong answer that is a repeating decimal can never be typed exactly.
const unreachable = (value) => value.n < 0 || toDecimalString(value) === null;

// Drop catalogued wrong answers that are really the right answer, negative, or repeats of an earlier one.
function cleanWrongs(expect, wrongs) {
  const kept = [];
  for (const wrong of wrongs) {
    const values = Object.values(wrong.values);
    if (values.some(unreachable) || sameValues(wrong.values, expect)) continue;
    if (kept.some((other) => sameValues(wrong.values, other.values) && sameValues(other.values, wrong.values))) continue;
    kept.push(wrong);
  }
  return kept;
}

export function enter(skillId, level, o) {
  return {
    skillId,
    level,
    kind: "enter",
    prompt: o.prompt,
    scene: o.scene,
    fields: o.fields,
    expect: o.expect,
    wrongs: cleanWrongs(o.expect, o.wrongs || []),
    params: o.params,
  };
}

