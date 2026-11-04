// ACCESS Learning Journey — what to do next, and why. Pure and deterministic: time comes from `now`.
// Order of the rules (JOURNEY.md): teacher-assigned > unfinished started step > supportive step after a struggling
// supported attempt > due review of a feature used only with support > next step > next mission / unit > journey complete.
// Every result carries a student-friendly bilingual `reason` and always leaves at least one forward action
// (the result itself, or an entry in `alternatives`). Nothing here is a score or a level.
import { FEATURES, MISSION_IDS, MISSIONS, STEP_IDS, stepInfo, unitOf } from "./curriculum.js";
import { practiceTarget } from "./resources.js";
import { bandState, getStep, missionStatus, stepStatus } from "./state.js";

const DAY = 864e5;
export const REVIEW_QUIET_DAYS = 7; // after a review, the same mission is not suggested again for a week
export const REVIEW_SETTLE_DAYS = 1; // supported work is left alone for a day before it is suggested again

const ms = (t) => {
  const x =
    t instanceof Date ? t.getTime() : typeof t === "number" ? t : Date.parse(String(t ?? ""));
  return Number.isFinite(x) ? x : null;
};
const isComplete = (state, band, id) =>
  missionStatus(state, band, id).startsWith("completed") ||
  missionStatus(state, band, id) === "independently-demonstrated";
const validRef = (r) => Boolean(r) && MISSION_IDS.includes(r.mission) && STEP_IDS.includes(r.step);

// ── bilingual text ────────────────────────────────────────────────────────────
const labelOf = (mission, step) => {
  const s = stepInfo(step).label;
  const m = MISSIONS[mission].title;
  return [`${s[0]}: ${m[0]}`, `${s[1]}: ${m[1]}`];
};
const altOf = (mission, step, reason) => ({ mission, step, label: labelOf(mission, step), reason });
const result = (kind, mission, step, reason, alternatives = [], extra = {}) => ({
  kind,
  mission,
  step,
  reason,
  alternatives: alternatives.filter(
    (a, i, all) =>
      a &&
      !(a.mission === mission && a.step === step) &&
      all.findIndex((x) => x?.mission === a.mission && x.step === a.step) === i,
  ),
  ...extra,
});

// ── where the learner is ──────────────────────────────────────────────────────
const hasProgress = (state, band) =>
  Object.keys(bandState(state, band).missions).some(
    (id) => missionStatus(state, band, id) !== "not-started",
  );

/** First step of `mission` that is not done, scanning from `from` and wrapping. Null when the mission is complete. */
function firstOpenStep(state, band, mission, from = STEP_IDS[0]) {
  const i = Math.max(0, STEP_IDS.indexOf(from));
  const order = [...STEP_IDS.slice(i), ...STEP_IDS.slice(0, i)];
  return order.find((id) => !stepStatus(state, band, mission, id).startsWith("done")) || null;
}

/** A started (unfinished) step: the cursor's mission first, then every other mission in order. */
function startedStep(state, band) {
  const { cursor } = bandState(state, band);
  const missions = [cursor.mission, ...MISSION_IDS.filter((id) => id !== cursor.mission)];
  for (const mission of missions) {
    const from = mission === cursor.mission ? cursor.step : STEP_IDS[0];
    const i = STEP_IDS.indexOf(from);
    const step = [...STEP_IDS.slice(i), ...STEP_IDS.slice(0, i)].find(
      (id) => stepStatus(state, band, mission, id) === "started",
    );
    if (step) return { mission, step };
  }
  return null;
}

/** The next unfinished step, from the cursor onward: same mission, else the next incomplete mission, else null. */
function nextOpen(state, band) {
  const { cursor } = bandState(state, band);
  const step = firstOpenStep(state, band, cursor.mission, cursor.step);
  if (step) return { mission: cursor.mission, step };
  const start = MISSION_IDS.indexOf(cursor.mission);
  for (let i = 1; i < MISSION_IDS.length; i++) {
    const mission = MISSION_IDS[(start + i) % MISSION_IDS.length];
    if (!isComplete(state, band, mission))
      return { mission, step: firstOpenStep(state, band, mission) };
  }
  return null;
}

/** The forward action when nothing more urgent applies: next step, next mission, unit complete or journey complete. */
function forward(state, band) {
  const next = nextOpen(state, band);
  if (!next) {
    // Everything is finished: offer the first mission not yet shown independently, else the last mission once more.
    const mission =
      MISSION_IDS.find((id) => missionStatus(state, band, id) !== "independently-demonstrated") ||
      MISSION_IDS.at(-1);
    return result("journey-complete", mission, "show", [
      "You finished the whole journey. Pick any mission to try again on your own.",
      "Terminaste todo el viaje. Elige cualquier misión para intentarla otra vez por tu cuenta.",
    ]);
  }
  const idx = MISSION_IDS.indexOf(next.mission);
  const previous = MISSION_IDS[idx - 1];
  const fresh =
    idx > 0 &&
    next.step === STEP_IDS[0] &&
    missionStatus(state, band, next.mission) === "not-started";
  if (fresh && previous && isComplete(state, band, previous)) {
    const from = unitOf(previous);
    const to = unitOf(next.mission);
    if (from !== to && from.missions.every((id) => isComplete(state, band, id)))
      return result("unit-complete", next.mission, next.step, [
        `You finished Unit ${from.n}: ${from.title[0]}. Start Unit ${to.n}: ${to.title[0]}.`,
        `Terminaste la unidad ${from.n}: ${from.title[1]}. Empieza la unidad ${to.n}: ${to.title[1]}.`,
      ]);
    const m = MISSIONS[next.mission];
    return result("next-mission", next.mission, next.step, [
      `You finished a mission. Next: ${m.title[0]}.`,
      `Terminaste una misión. Sigue: ${m.title[1]}.`,
    ]);
  }
  const s = stepInfo(next.step).label;
  return result("continue", next.mission, next.step, [`Next up: ${s[0]}.`, `Sigue: ${s[1]}.`]);
}

// ── review of features used only with support ────────────────────────────────
const lastWorkAt = (state, band, mission) =>
  Math.max(
    0,
    ...["communicate", "show"].map((id) => ms(getStep(state, band, mission, id).doneAt) ?? 0),
  );

/** Communicate or show was finished with help, and the independent `show` has not been done. */
function usedOnlyWithSupport(state, band, mission) {
  const [com, show] = ["communicate", "show"].map((id) => stepStatus(state, band, mission, id));
  return (com === "done-supported" || show === "done-supported") && show !== "done-independent";
}

function reviewedAt(state, band, mission) {
  const { missions } = bandState(state, band);
  return Math.max(0, ...Object.values(missions).map((m) => ms(m.reviewed[mission]) ?? 0));
}

/**
 * Features the learner used only with support in an earlier mission and has not gone back to recently.
 * Pure: [{ mission, step: "show", feature, reason }] nearest spiral edge first; callers show one at a time.
 */
export function reviewCandidates(state, band, { now } = {}) {
  const at = ms(now) ?? Date.now();
  const focus = nextOpen(state, band)?.mission || null;
  const pool = focus ? MISSIONS[focus].reviews : MISSION_IDS;
  const out = [];
  for (const mission of pool) {
    if (!usedOnlyWithSupport(state, band, mission)) continue;
    if (at - lastWorkAt(state, band, mission) < REVIEW_SETTLE_DAYS * DAY) continue;
    if (at - reviewedAt(state, band, mission) < REVIEW_QUIET_DAYS * DAY) continue;
    const mine = MISSIONS[mission].features;
    const feature =
      (focus ? mine.find((f) => MISSIONS[focus].features.includes(f)) : mine[0]) || mine[0];
    const f = FEATURES[feature].label;
    const m = MISSIONS[mission].title;
    out.push({
      mission,
      step: "show",
      feature,
      reason: [
        `You used “${f[0]}” with help in “${m[0]}”. Try it on your own.`,
        `Usaste «${f[1]}» con ayuda en «${m[1]}». Inténtalo por tu cuenta.`,
      ],
    });
  }
  return out;
}

// ── difficulty: the latest supported attempt in the current mission missed required moves ──
const EARLIER_STEP = { communicate: "build", improve: "build", show: "build", build: "understand" };

/** { step, missing: [moveId] } when the latest ledger entry of the current mission was supported and missed moves. */
function struggle(state, band, ledger, mission) {
  const entries = (Array.isArray(ledger?.entries) ? ledger.entries : [])
    .filter(
      (e) =>
        e?.src === "mission" &&
        (e.band || band) === band &&
        String(e.task).startsWith(`${mission}.`),
    )
    .sort((a, b) => String(a.t).localeCompare(String(b.t)));
  const last = entries.at(-1);
  if (!last || last.stage === "independent" || !last.m?.moves || typeof last.m.moves !== "object")
    return null;
  const missing = Object.entries(last.m.moves)
    .filter(([, v]) => v === 0 || v === false)
    .map(([id]) => id);
  const step = String(last.task).split(".")[1];
  if (!missing.length || !STEP_IDS.includes(step)) return null;
  // Resolved once the learner has touched any other step of this mission since that attempt.
  const t = ms(last.t);
  const moved = STEP_IDS.some(
    (id) => id !== step && t !== null && (ms(getStep(state, band, mission, id).lastAt) ?? 0) > t,
  );
  return moved ? null : { step, missing };
}

/**
 * The next thing to do, with a reason a student can read. `assigned` (a teacher link) outranks stored state.
 * -> { kind, mission, step, reason: T, alternatives: [{ mission, step, label: T, reason: T }] }
 */
export function recommendNext(state, band, { ledger, assigned, now } = {}) {
  // The way forward: finish a started step if there is one, otherwise the next step / mission / unit.
  const started = startedStep(state, band);
  const fwd = started
    ? result("continue", started.mission, started.step, [
        "You started this step. Let's finish it.",
        "Empezaste este paso. Vamos a terminarlo.",
      ])
    : forward(state, band);
  const fwdAlt = altOf(fwd.mission, fwd.step, fwd.reason);
  const review = reviewCandidates(state, band, { now })[0];
  const reviewAlt = review && altOf(review.mission, review.step, review.reason);

  const teacher = validRef(assigned) ? assigned : bandState(state, band).assigned;
  if (teacher)
    return result(
      "assigned",
      teacher.mission,
      teacher.step,
      ["Your teacher picked this step for you.", "Tu maestro o maestra eligió este paso para ti."],
      [fwdAlt],
    );

  if (!hasProgress(state, band))
    return result("start", MISSION_IDS[0], STEP_IDS[0], [
      "Start your learning journey. First, look into a real situation.",
      "Comienza tu viaje de aprendizaje. Primero, investiga una situación real.",
    ]);

  if (started) return { ...fwd, alternatives: fwd.alternatives.concat(reviewAlt || []) };

  const { cursor } = bandState(state, band);
  const hard = struggle(state, band, ledger, cursor.mission);
  if (hard) {
    const edge = MISSIONS[cursor.mission].reviews[0];
    const spiral =
      edge &&
      altOf(edge, "build", [
        `Practice the same language in an earlier mission: “${MISSIONS[edge].title[0]}”.`,
        `Practica el mismo lenguaje en una misión anterior: «${MISSIONS[edge].title[1]}».`,
      ]);
    const step = EARLIER_STEP[hard.step] || "build";
    return result(
      "support",
      cursor.mission,
      step,
      [
        "Let's practice the language this needs, then try again. You can also keep going.",
        "Practiquemos el lenguaje que necesitas y luego lo intentamos otra vez. También puedes seguir adelante.",
      ],
      [spiral, fwdAlt],
      { missing: hard.missing, practice: practiceTarget(cursor.mission, step, band) },
    );
  }

  if (review)
    return result("review", review.mission, review.step, review.reason, [fwdAlt], {
      feature: review.feature,
      practice: practiceTarget(review.mission, review.step, band),
    });

  return fwd;
}
