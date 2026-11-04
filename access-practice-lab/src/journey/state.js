// ACCESS Learning Journey — pure state: load/save, step transitions, mission status, import merge.
// No DOM. Storage is touched only by loadJourney/saveJourney (same pattern as src/lang/ledger.js).
// One key, `accessPracticeLab:v1:journey`, so the Passport code carries it. Contract: access-practice-lab/JOURNEY.md.
//
// Honesty rules kept here:
//  * a step is "independent" only when it was finished with no help ever opened on it;
//  * help opened later never downgrades a finished independent step (it counts as a revisit instead);
//  * a mission is "independently-demonstrated" only when every step is done and the `show` step was independent;
//  * nothing here is a score: it records what was done and under which supports.
import { safeJson, storage } from "../util.js";
import { BANDS, MISSION_IDS, STEP_IDS } from "./curriculum.js";

export const KEY = "accessPracticeLab:v1:journey";
export const SUPPORT_LEVELS = ["A", "B", "C"];
const DEFAULT_CURSOR = Object.freeze({ mission: MISSION_IDS[0], step: STEP_IDS[0] });

export const emptyState = () => ({ v: 1, bands: {} });

// ── sanitising: parseState must never throw and never trust its input ─────────
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const clone = (x) => JSON.parse(JSON.stringify(x));
const count = (x) => (Number.isInteger(x) && x > 0 ? x : 0);
const isoOrNull = (x) => (typeof x === "string" && Number.isFinite(Date.parse(x)) ? x : null);
const stamp = (now) => {
  const ms = now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  return new Date(Number.isFinite(ms) ? ms : Date.now()).toISOString();
};
const validRef = (r) => isObj(r) && MISSION_IDS.includes(r.mission) && STEP_IDS.includes(r.step);

function cleanStep(raw) {
  if (!isObj(raw) || (raw.status !== "started" && raw.status !== "done")) return null;
  const help = Array.isArray(raw.help)
    ? [...new Set(raw.help.filter((x) => typeof x === "string"))]
    : [];
  const s = {
    status: raw.status,
    help,
    attempts: count(raw.attempts),
    revisits: count(raw.revisits),
    doneAt: isoOrNull(raw.doneAt),
    lastAt: isoOrNull(raw.lastAt),
    data: isObj(raw.data) ? raw.data : {},
  };
  // Independence is re-derived: help on the record always means supported.
  if (raw.status === "done")
    s.stage = raw.stage === "independent" && !help.length ? "independent" : "supported";
  return s;
}

function cleanMission(raw) {
  if (!isObj(raw)) return null;
  const steps = {};
  for (const id of STEP_IDS) {
    const s = cleanStep(raw.steps?.[id]);
    if (s) steps[id] = s;
  }
  const reviewed = {};
  for (const id of MISSION_IDS) {
    const at = isoOrNull(raw.reviewed?.[id]);
    if (at) reviewed[id] = at;
  }
  const startedAt = isoOrNull(raw.startedAt);
  return startedAt || Object.keys(steps).length || Object.keys(reviewed).length
    ? { startedAt, steps, reviewed }
    : null;
}

function cleanBand(raw) {
  const b = isObj(raw) ? raw : {};
  const missions = {};
  for (const id of MISSION_IDS) {
    const m = cleanMission(b.missions?.[id]);
    if (m) missions[id] = m;
  }
  return {
    support: SUPPORT_LEVELS.includes(b.support) ? b.support : "A",
    cursor: validRef(b.cursor)
      ? { mission: b.cursor.mission, step: b.cursor.step }
      : { ...DEFAULT_CURSOR },
    missions,
    assigned: validRef(b.assigned) ? { mission: b.assigned.mission, step: b.assigned.step } : null,
  };
}

/** Raw JSON text (or an already parsed object) → clean state. Unknown versions and garbage give emptyState(). */
export function parseState(raw) {
  try {
    const data = typeof raw === "string" ? safeJson(raw, null) : raw;
    if (!isObj(data) || data.v !== 1 || !isObj(data.bands)) return emptyState();
    const bands = {};
    for (const b of BANDS) if (isObj(data.bands[b])) bands[b] = cleanBand(data.bands[b]);
    return { v: 1, bands };
  } catch {
    return emptyState();
  }
}

/** True when an imported object has the journey shape (checked before any import write). */
export function validJourney(doc) {
  if (!isObj(doc) || doc.v !== 1 || !isObj(doc.bands)) return false;
  return Object.values(doc.bands).every(
    (b) =>
      isObj(b) &&
      (b.missions === undefined ||
        (isObj(b.missions) &&
          Object.values(b.missions).every(
            (m) =>
              isObj(m) &&
              (m.steps === undefined ||
                (isObj(m.steps) &&
                  Object.values(m.steps).every(
                    (s) =>
                      isObj(s) &&
                      (s.status === undefined || s.status === "started" || s.status === "done"),
                  ))),
          ))),
  );
}

export const loadJourney = (read = (k) => storage.get(k)) => parseState(read(KEY));
export const saveJourney = (state, write = (k, v) => storage.set(k, v)) =>
  write(KEY, JSON.stringify(state));

// ── reads ─────────────────────────────────────────────────────────────────────
/** One band's state with every default filled in. Unknown bands read as an empty band. */
export const bandState = (state, band) => cleanBand(state?.bands?.[band]);

const NEW_STEP = Object.freeze({
  status: "new",
  stage: null,
  help: [],
  attempts: 0,
  revisits: 0,
  doneAt: null,
  lastAt: null,
});
/** One step with defaults. `status` is "new" when nothing has happened on it yet (an extension of the stored values). */
export function getStep(state, band, mission, step) {
  const s = bandState(state, band).missions[mission]?.steps[step];
  return s ? { ...NEW_STEP, ...s } : { ...NEW_STEP, help: [], data: {} };
}

/** "new" | "started" | "done-supported" | "done-independent". */
export function stepStatus(state, band, mission, step) {
  const s = getStep(state, band, mission, step);
  if (s.status === "new" || s.status === "started") return s.status;
  return s.stage === "independent" ? "done-independent" : "done-supported";
}

/**
 * Derived, never stored: "not-started" | "in-progress" | "completed-with-support" | "independently-demonstrated".
 * Completion needs all six steps done; independence additionally needs the `show` step done independently.
 */
export function missionStatus(state, band, mission) {
  const statuses = STEP_IDS.map((id) => stepStatus(state, band, mission, id));
  if (statuses.every((s) => s === "new")) return "not-started";
  if (!statuses.every((s) => s.startsWith("done"))) return "in-progress";
  return statuses.at(-1) === "done-independent"
    ? "independently-demonstrated"
    : "completed-with-support";
}

export function missionProgress(state, band, mission) {
  const m = bandState(state, band).missions[mission];
  const steps = Object.values(m?.steps || {});
  return {
    done: steps.filter((s) => s.status === "done").length,
    total: STEP_IDS.length,
    revisited: steps.some((s) => s.revisits > 0),
  };
}

/** The cursor that follows `step`: the next step, then the next open step of the mission, then the next mission. */
export function nextCursorAfter(state, band, mission, step) {
  const i = STEP_IDS.indexOf(step);
  if (!MISSION_IDS.includes(mission) || i < 0) return bandState(state, band).cursor;
  if (i < STEP_IDS.length - 1) return { mission, step: STEP_IDS[i + 1] };
  const open = STEP_IDS.find((id) => !stepStatus(state, band, mission, id).startsWith("done"));
  if (open) return { mission, step: open };
  const next = MISSION_IDS[MISSION_IDS.indexOf(mission) + 1];
  return next ? { mission: next, step: STEP_IDS[0] } : { mission, step };
}

// ── writes (each returns a new state; the input is never mutated) ─────────────
function edit(state, band, fn) {
  if (!BANDS.includes(band)) return state;
  const base = isObj(state?.bands) ? state : emptyState();
  const b = clone(bandState(base, band));
  fn(b);
  return { v: 1, bands: { ...base.bands, [band]: b } };
}

function touch(b, mission, step, at) {
  if (!MISSION_IDS.includes(mission) || !STEP_IDS.includes(step)) return null;
  const m = (b.missions[mission] ||= { startedAt: at, steps: {}, reviewed: {} });
  m.startedAt ||= at;
  const s = (m.steps[step] ||= {
    status: "started",
    help: [],
    attempts: 0,
    revisits: 0,
    doneAt: null,
    lastAt: at,
    data: {},
  });
  s.lastAt = at;
  return s;
}

/** Going back over finished work counts as a review of that mission (the recommender reads this). */
const markSelfReviewed = (b, mission, at) => {
  b.missions[mission].reviewed[mission] = at;
};

export function startStep(state, band, mission, step, now) {
  return edit(state, band, (b) => touch(b, mission, step, stamp(now)));
}

export function updateStepData(state, band, mission, step, engineKey, patch, now) {
  return edit(state, band, (b) => {
    const s = touch(b, mission, step, stamp(now));
    if (s && typeof engineKey === "string" && isObj(patch))
      s.data[engineKey] = { ...s.data[engineKey], ...patch };
  });
}

/** Opening any help marks the step supported from now on; a finished independent step is never relabelled. */
export function noteHelp(state, band, mission, step, helpId, now) {
  return edit(state, band, (b) => {
    const s = touch(b, mission, step, stamp(now));
    if (!s || typeof helpId !== "string") return;
    if (s.status === "done" && s.stage === "independent") s.revisits += 1;
    else if (!s.help.includes(helpId)) s.help.push(helpId);
  });
}

/**
 * Finish a step. `independent` is what the shell observed (no support level, no help); it only counts when no help
 * was ever noted on this step. A repeat completion keeps the better stage and counts as another attempt.
 */
export function completeStep(
  state,
  band,
  mission,
  step,
  { independent = false, summary, now } = {},
) {
  return edit(state, band, (b) => {
    const at = stamp(now);
    const s = touch(b, mission, step, at);
    if (!s) return;
    const wasDone = s.status === "done";
    const keeps = wasDone && s.stage === "independent";
    s.stage = keeps || (independent === true && s.help.length === 0) ? "independent" : "supported";
    s.status = "done";
    s.attempts += 1;
    s.doneAt = at;
    if (summary !== undefined) s.data.result = summary;
    if (wasDone) markSelfReviewed(b, mission, at);
    if (b.assigned?.mission === mission && b.assigned.step === step) b.assigned = null;
  });
}

/** Re-entering a finished step: status and stage stay, `revisits` counts it. */
export function revisitStep(state, band, mission, step, now) {
  return edit(state, band, (b) => {
    if (b.missions[mission]?.steps[step]?.status !== "done") return;
    const at = stamp(now);
    const s = touch(b, mission, step, at);
    s.revisits += 1;
    markSelfReviewed(b, mission, at);
  });
}

/** The learner reviewed `reviewedMission` while working in `mission`. */
export function markReviewed(state, band, mission, reviewedMission, now) {
  return edit(state, band, (b) => {
    if (!MISSION_IDS.includes(mission) || !MISSION_IDS.includes(reviewedMission)) return;
    const at = stamp(now);
    const m = (b.missions[mission] ||= { startedAt: at, steps: {}, reviewed: {} });
    m.reviewed[reviewedMission] = at;
  });
}

export const setSupport = (state, band, level) =>
  SUPPORT_LEVELS.includes(level) ? edit(state, band, (b) => void (b.support = level)) : state;
export const setCursor = (state, band, mission, step) =>
  validRef({ mission, step })
    ? edit(state, band, (b) => void (b.cursor = { mission, step }))
    : state;
/** A teacher-directed step, or null to clear it. It never changes any step's progress. */
export const assign = (state, band, ref) =>
  ref === null || validRef(ref)
    ? edit(
        state,
        band,
        (b) => void (b.assigned = ref ? { mission: ref.mission, step: ref.step } : null),
      )
    : state;

// ── import merge ──────────────────────────────────────────────────────────────
const rank = (s) => (s.status === "done" ? (s.stage === "independent" ? 3 : 2) : 1);
const later = (a, b) => (a && b ? (a > b ? a : b) : a || b);
const earlier = (a, b) => (a && b ? (a < b ? a : b) : a || b);

/** done beats started, independent beats supported, more attempts wins a tie, local wins an exact tie. */
function mergeStep(local, incoming) {
  if (!local) return incoming;
  if (!incoming) return local;
  const r = rank(incoming) - rank(local) || incoming.attempts - local.attempts;
  const [win, lose] = r > 0 ? [incoming, local] : [local, incoming];
  const out = {
    ...win,
    attempts: Math.max(local.attempts, incoming.attempts),
    revisits: Math.max(local.revisits, incoming.revisits),
    lastAt: later(local.lastAt, incoming.lastAt),
  };
  // Help only travels with work that was not independent (an independent step has none by definition).
  if (win.stage !== "independent") out.help = [...new Set([...win.help, ...lose.help])];
  return out;
}

function mergeMission(local, incoming) {
  if (!local) return incoming;
  if (!incoming) return local;
  const steps = {};
  for (const id of STEP_IDS) {
    const s = mergeStep(local.steps[id], incoming.steps[id]);
    if (s) steps[id] = s;
  }
  const reviewed = { ...incoming.reviewed };
  for (const [id, at] of Object.entries(local.reviewed)) reviewed[id] = later(at, reviewed[id]);
  return { startedAt: earlier(local.startedAt, incoming.startedAt), steps, reviewed };
}

function mergeBand(local, incoming) {
  const missions = {};
  for (const id of MISSION_IDS) {
    const m = mergeMission(local.missions[id], incoming.missions[id]);
    if (m) missions[id] = m;
  }
  // Where the learner is now (support level, cursor, teacher assignment) is this device's own.
  return { ...local, missions };
}

/**
 * Union of two journeys (used when importing a backup). Never loses a step; local data wins ties.
 * Idempotent, and commutative on every step's status and stage.
 */
export function mergeJourney(local, incoming) {
  const a = parseState(local);
  const b = parseState(incoming);
  const bands = {};
  for (const band of BANDS) {
    if (a.bands[band] && b.bands[band]) bands[band] = mergeBand(a.bands[band], b.bands[band]);
    else if (a.bands[band] || b.bands[band]) bands[band] = a.bands[band] || b.bands[band];
  }
  return { v: 1, bands };
}
