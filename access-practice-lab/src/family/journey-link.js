// Family <-> Learning Journey seam. Pure helpers: which mission the learner is on, which family companion matches
// it, and the links between the two. Reads only mission ids, step names and counts from the journey state, never
// recordings, drafts, portfolio text or the evidence ledger. Contract: access-practice-lab/JOURNEY.md.
import { BASE } from "../util.js";
import { BANDS, MISSION_IDS, STEP_IDS, missionIdFromParam } from "../journey/curriculum.js";

const FIRST_MISSION = MISSION_IDS[0];
const bandOf = (band) => (BANDS.includes(band) ? band : BANDS[0]);

let companions;
/** All twelve family companions, loaded once and only when a family page needs them. */
export const loadFamilyCompanions = () =>
  (companions ??= import("../content/journey/family.js").then((m) => m.default));

/** The companion for one mission id (`m08` or `8`), or null when the id is unknown. */
export async function familyCompanionFor(missionId) {
  const id = missionIdFromParam(missionId);
  return id ? ((await loadFamilyCompanions())[id] ?? null) : null;
}

/** `?mission=` value from a query string, normalised to a mission id or "". */
export const missionFromSearch = (search) =>
  missionIdFromParam(new URLSearchParams(search).get("mission"));

/** Link to a mission's family companion (the family page with `?mission=`). */
export const familyContinueHref = (missionId, band) =>
  `${BASE}/family?mission=${encodeURIComponent(missionId)}&grades=${bandOf(band)}`;

/** Link to a Journey step; with no step it is the mission overview, with no mission the Journey home. */
export const journeyStepHref = (missionId, stepId, band) =>
  `${BASE}/journey${missionId ? `/${missionId}${stepId ? `/${stepId}` : ""}` : ""}?grades=${bandOf(band)}`;

/** The saved journey, or null when the Journey modules are unavailable or storage is blocked. */
export async function loadJourneyState() {
  try {
    return (await import("../journey/state.js")).loadJourney();
  } catch {
    return null;
  }
}

const doneStepsOf = (mission) => STEP_IDS.filter((s) => mission?.steps?.[s]?.status === "done");

/** Counts and step names only: missions started, steps finished in each, and the latest finished steps. */
export function progressSummary(state, band) {
  const missions = state?.bands?.[bandOf(band)]?.missions || {};
  const byMission = {};
  const recent = [];
  for (const id of MISSION_IDS) {
    const done = doneStepsOf(missions[id]);
    byMission[id] = done.length;
    for (const step of done)
      recent.push({ mission: id, step, doneAt: String(missions[id].steps[step].doneAt || "") });
  }
  recent.sort((a, b) => b.doneAt.localeCompare(a.doneAt));
  const started = MISSION_IDS.filter(
    (id) => missions[id] && (byMission[id] > 0 || Object.keys(missions[id].steps || {}).length > 0),
  );
  return {
    started: started.length,
    completed: MISSION_IDS.filter((id) => byMission[id] === STEP_IDS.length).length,
    totalSteps: Object.values(byMission).reduce((a, b) => a + b, 0),
    byMission,
    recent: recent.slice(0, 3),
  };
}

/**
 * The mission and step this learner does next, with the journey's own reason.
 * `{ mission, step, kind, reason|null }`. Falls back to the saved cursor, then to the first step of mission 1, so a
 * family page always has somewhere to point even when the recommender cannot run.
 */
export async function currentMissionForFamily(state, band) {
  const b = bandOf(band);
  try {
    const { recommendNext } = await import("../journey/recommend.js");
    const next = recommendNext(state, b, { now: Date.now() });
    if (MISSION_IDS.includes(next?.mission))
      return {
        mission: next.mission,
        step: STEP_IDS.includes(next.step) ? next.step : "",
        kind: next.kind || "continue",
        reason: next.reason || null,
      };
  } catch {
    // fall through to the cursor
  }
  const cursor = state?.bands?.[b]?.cursor;
  const mission = MISSION_IDS.includes(cursor?.mission) ? cursor.mission : FIRST_MISSION;
  const step = STEP_IDS.includes(cursor?.step) ? cursor.step : STEP_IDS[0];
  return { mission, step, kind: state ? "continue" : "start", reason: null };
}
