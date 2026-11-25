/**
 * Synthetic classes. Students are aliases "Star 1".."Star N" (N <= 28) and nothing else:
 * no names, ids of real people, home-language, program or background fields. `band` is a
 * synthetic skill band used only to drive practice-history generation; it is teacher-side
 * test data and is never shown to students.
 */
import { createRng } from "./prng.js";

export const GRADES = Object.freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
export const BANDS = Object.freeze(["emerging", "developing", "expanding", "bridging"]);
export const MAX_CLASS_SIZE = 28;

/** Share of the class in each band, in BANDS order. */
export const BAND_MIXES = Object.freeze({
  balanced: [0.25, 0.25, 0.25, 0.25],
  emerging_heavy: [0.5, 0.3, 0.15, 0.05],
  bridging_heavy: [0.05, 0.15, 0.3, 0.5],
  split: [0.4, 0.1, 0.1, 0.4],
});

/** The committed fixture classes: K-8, sizes 12-28, every band mix at least twice. */
export const CLASS_SPECS = Object.freeze([
  { id: "fx-k-balanced", grade: "K", size: 14, mix: "balanced" },
  { id: "fx-1-emerging", grade: "1", size: 18, mix: "emerging_heavy" },
  { id: "fx-2-balanced", grade: "2", size: 22, mix: "balanced" },
  { id: "fx-3-split", grade: "3", size: 24, mix: "split" },
  { id: "fx-4-emerging", grade: "4", size: 12, mix: "emerging_heavy" },
  { id: "fx-5-bridging", grade: "5", size: 20, mix: "bridging_heavy" },
  { id: "fx-6-balanced", grade: "6", size: 28, mix: "balanced" },
  { id: "fx-6-split", grade: "6", size: 16, mix: "split" },
  { id: "fx-7-bridging", grade: "7", size: 26, mix: "bridging_heavy" },
  { id: "fx-8-emerging", grade: "8", size: 19, mix: "emerging_heavy" },
  { id: "fx-8-split", grade: "8", size: 25, mix: "split" },
]);

/** Largest-remainder rounding so counts always sum to `size`. */
function bandCounts(size, shares) {
  const raw = shares.map((s) => s * size);
  const counts = raw.map(Math.floor);
  const order = raw
    .map((r, i) => ({ i, rem: r - Math.floor(r) }))
    .sort((x, y) => y.rem - x.rem || x.i - y.i);
  const deficit = size - counts.reduce((a, b) => a + b, 0);
  for (let k = 0; k < deficit; k++) counts[order[k].i]++;
  return counts;
}

export function buildClass(spec) {
  if (!GRADES.includes(spec.grade)) throw new Error(`fixture grade "${spec.grade}" is not K-8`);
  if (!(spec.size >= 1 && spec.size <= MAX_CLASS_SIZE))
    throw new Error(`fixture size ${spec.size} out of range`);
  const shares = BAND_MIXES[spec.mix];
  if (!shares) throw new Error(`unknown band mix "${spec.mix}"`);
  const rng = createRng(`class:${spec.id}`);
  const bands = rng.shuffle(
    bandCounts(spec.size, shares).flatMap((n, i) => Array.from({ length: n }, () => BANDS[i])),
  );
  return {
    id: spec.id,
    name: `Fixture class ${spec.id}`,
    grade: spec.grade,
    bandMix: spec.mix,
    teacherId: `fixture-teacher-${CLASS_SPECS.findIndex((c) => c.id === spec.id) + 1 || 1}`,
    students: bands.map((band, i) => ({
      id: `${spec.id}-s${i + 1}`,
      name: `Star ${i + 1}`,
      band,
    })),
  };
}
