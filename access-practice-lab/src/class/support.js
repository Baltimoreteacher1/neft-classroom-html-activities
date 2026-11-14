// Teacher-set starting support for a learner in a class (Language Page teacher tools). The teacher picks a support
// stage per domain (A Starting, B Growing, C Expanding: the names learners already see) and, optionally, a Road week.
// This device applies them as DEFAULTS: a new or changed class setting sets the learner's tiers once, and the learner
// can still change their own tier afterwards. No level or score ever reaches this device, only stage letters.
//
// The applied setting lives OUTSIDE the `accessPracticeLab:v1:` namespace (like the class link), so it never travels
// in a Passport code, a backup or the class copy.
import { SUPPORT_STAGES } from "../../../shared/class-platform/contract.js";
import { getPrefs, setPrefs } from "../store.js";
import { safeJson, storage } from "../util.js";

export const SUPPORT_KEY = "accessPracticeLabClass:v1:support";
const DOMAIN_NAME = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
};

const read = () => {
  const v = safeJson(storage.get(SUPPORT_KEY), null);
  return v && typeof v === "object" ? v : null;
};

/**
 * Apply `{ support, roadWeek }` from GET /api/class/me. Tiers change only when the teacher's setting differs from
 * the one last applied here. Returns true when tiers were changed.
 */
export function applyClassSupport({ support = null, roadWeek = null } = {}) {
  const stages = support?.stages && typeof support.stages === "object" ? support.stages : {};
  const tiers = {};
  for (const [d, stage] of Object.entries(stages))
    if (DOMAIN_NAME[d] && SUPPORT_STAGES.includes(stage)) tiers[DOMAIN_NAME[d]] = stage;
  const week = Number.isInteger(support?.roadWeek)
    ? support.roadWeek
    : Number.isInteger(roadWeek)
      ? roadWeek
      : null;
  const sig = JSON.stringify(tiers);
  const prev = read();
  const changed = Object.keys(tiers).length > 0 && prev?.sig !== sig;
  if (changed) setPrefs({ tiers: { ...getPrefs().tiers, ...tiers } });
  if (!Object.keys(tiers).length && week === null) storage.remove(SUPPORT_KEY);
  else
    storage.set(
      SUPPORT_KEY,
      JSON.stringify({ sig: Object.keys(tiers).length ? sig : prev?.sig || "", roadWeek: week }),
    );
  return changed;
}

/** The Road week the teacher set for this learner (or the class), or null to follow the calendar. */
export const classRoadWeek = () => {
  const w = read()?.roadWeek;
  return Number.isInteger(w) && w > 0 ? w : null;
};

export const clearClassSupport = () => storage.remove(SUPPORT_KEY);
