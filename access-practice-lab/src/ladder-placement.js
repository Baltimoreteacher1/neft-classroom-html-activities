// Adaptive placement staircase over the Reading Ladder (ReadTheory pretest / LevelSet model).
//
// Each probe is one ladder passage with its three questions, answered with no help (no word taps, no Spanish,
// no easier version). 3 of 3 moves one practice step up, 1 or 0 moves one step down, 2 of 3 places the learner
// at that step. A change of direction places the learner at the lower of the last two steps, and the staircase
// never runs more than MAX_PROBES passages. The result is a "practice step" on this device, never a Lexile
// measure, grade level or WIDA level.
import { LADDER_STEPS, startStep } from "./ladder.js";

export const MAX_PROBES = 5;

export const newPlacement = (band) => ({ active: true, step: startStep(band), probes: [], result: null });

/** Reads saved placement defensively; anything unreadable is no placement. */
export function normalizePlacement(raw) {
  if (!raw || typeof raw !== "object") return null;
  const probes = (Array.isArray(raw.probes) ? raw.probes : [])
    .filter((p) => p && Number.isInteger(p.step) && Number.isInteger(p.correct) && Number.isInteger(p.total) && p.total > 0)
    .slice(0, MAX_PROBES)
    .map((p) => ({ id: typeof p.id === "string" ? p.id : "", step: p.step, correct: Math.min(p.correct, p.total), total: p.total }));
  const clamp = (n) => Math.max(1, Math.min(LADDER_STEPS, Number.isInteger(n) ? n : 1));
  return {
    active: raw.active === true,
    step: clamp(raw.step),
    probes,
    result: Number.isInteger(raw.result) ? clamp(raw.result) : null,
  };
}

const move = (correct, total) => (correct >= total ? 1 : correct <= total - 2 ? -1 : 0);

/** Records one probe and returns the next placement state (finished when `result` is set). */
export function recordProbe(placement, { id = "", correct, total }) {
  const here = placement.step;
  const probes = [...placement.probes, { id, step: here, correct, total }];
  const dir = move(correct, total);
  const prev = probes.length > 1 ? probes.at(-2) : null;
  const prevDir = prev ? Math.sign(here - prev.step) : 0;
  const finish = (result) => ({ active: false, step: result, probes, result });
  if (dir === 0) return finish(here);
  if (prevDir && dir !== prevDir) return finish(Math.min(here, prev.step));
  const next = here + dir;
  if (next < 1) return finish(1);
  if (next > LADDER_STEPS) return finish(LADDER_STEPS);
  if (probes.length >= MAX_PROBES) return finish(dir > 0 ? here : next);
  return { active: true, step: next, probes, result: null };
}
