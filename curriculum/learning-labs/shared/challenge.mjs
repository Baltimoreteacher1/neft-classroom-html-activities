// Model challenges: a target for the live model that the student reaches by touching it. Targets are built from
// real settings of the model (so every one is reachable), chosen from a seeded generator so a lab always offers
// the same three, and checked against the model's own evaluate() — never against text.
import { controls, evaluate } from './math.mjs';

const seeded = (text) => {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) { h = Math.imul(h ^ text.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
};
const key = (n) => Number(n.toFixed(6));
export const reached = (value, target) => Number.isFinite(value) && key(value) === key(target);

function randomValues(fields, rand) {
  return fields.map((f) => {
    const steps = Math.round((f.max - f.min) / f.step);
    return Number((f.min + Math.floor(rand() * (steps + 1)) * f.step).toFixed(6));
  });
}

/** Three distinct, reachable targets for this lab's model, never equal to where the model starts. */
export function makeChallenges(labId, model, count = 3) {
  const rand = seeded(labId);
  const fields = controls(model);
  const start = evaluate(model, model.values);
  const seen = new Set([key(start.value)]);
  const out = [];
  // Cleanest targets first (whole numbers), then one decimal, then two: students should aim at friendly numbers.
  for (const places of [0, 1, 2]) {
    for (let tries = 0; out.length < count && tries < 600; tries++) {
      const values = randomValues(fields, rand);
      const r = evaluate(model, values);
      const v = key(r.value);
      if (!Number.isFinite(v) || seen.has(v) || Math.abs(v) > 1e4 || v <= 0) continue;
      if (Math.abs(v * 10 ** places - Math.round(v * 10 ** places)) > 1e-9) continue;
      seen.add(v);
      out.push({ target: v, label: r.label, unit: r.unit || '', example: values });
    }
  }
  return out;
}
