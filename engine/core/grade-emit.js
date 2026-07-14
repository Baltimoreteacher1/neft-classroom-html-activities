/**
 * grade-emit.js — single channel selector for reporting a finished lesson's
 * score back to whatever launched it.
 *
 * Priority (exactly one fires):
 *   1. LTI 1.3 — the lesson was opened inside Canvas via the neft-lti Worker,
 *      which appends `?lms=lti&ltik=<signed token>`. On completion we POST the
 *      score to the Worker's /lti/score; it forwards to Canvas AGS. The code
 *      modal is suppressed (the grade lands automatically).
 *   2. SCORM / completion code — handled inside showCanvasCode() → the shared
 *      canvas-code UI (SCORM postMessage relay when ?lms=scorm, else the paste
 *      code). Unchanged.
 *
 * DORMANT-SAFE: with no `lms=lti` launch param, this is byte-identical to
 * calling showCanvasCode() directly. The LTI branch only runs when the Worker
 * itself launched the lesson, so nothing here affects a normal site visit.
 */

import { showCanvasCode } from "./canvas-code.js";

// Public URL of the neft-lti Worker. Only contacted when a lesson was launched
// through it (an `ltik` is present), so this constant is inert on the live site.
const LTI_SCORE_URL = "https://neft-lti.neftjd.workers.dev/lti/score";

function readLaunch() {
  try {
    const p = new URLSearchParams(window.location.search);
    return { lms: p.get("lms") || "", ltik: p.get("ltik") || "" };
  } catch {
    return { lms: "", ltik: "" };
  }
}

function scoreFrom(state) {
  const s = state.get();
  const given = s.totalCorrect || 0;
  const max = s.totalAttempts || 1;
  return { scoreGiven: given, scoreMaximum: max };
}

/**
 * Report a finished lesson. Returns true if an LTI grade post was initiated
 * (caller should NOT also show the code modal); false to fall back.
 */
function tryLtiEmit(state, config) {
  const { lms, ltik } = readLaunch();
  if (lms !== "lti" || !ltik) return false;
  const { scoreGiven, scoreMaximum } = scoreFrom(state);
  const body = JSON.stringify({
    ltik,
    scoreGiven,
    scoreMaximum,
    activityId: config.lessonId || "lesson",
    activityTitle: config.title || config.lessonId || "Lesson",
    timestamp: new Date().toISOString(),
  });
  try {
    // keepalive so the POST survives the page being closed right after finishing.
    fetch(LTI_SCORE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // If the post can't even be dispatched, fall back so the student still has
    // a way to record the grade.
    return false;
  }
  return true;
}

/**
 * Complete a lesson: route the score to the one active channel. Never throws
 * into the lesson flow.
 */
export function completeLesson(state, config) {
  try {
    recordSignals(state, config);
  } catch {
    /* signals are optional */
  }
  try {
    if (tryLtiEmit(state, config)) return;
  } catch {
    /* fall through to the always-safe default */
  }
  showCanvasCode(state, config);
}

/**
 * Feed the device-local signal store (window.NTSignal) at completion so the
 * hub's "pick up where you left off" strip and the Practice Arcade's
 * skill-aware difficulty can see this lesson's outcome. No network, no PII.
 */
function recordSignals(state, config) {
  const sig = typeof window !== "undefined" && window.NTSignal;
  if (!sig) return;
  const { scoreGiven, scoreMaximum } = scoreFrom(state);
  const standard = config.standard || "";
  // One summary record per attempt bucket keeps weakStandards() honest
  // without flooding the store: correct records then wrong records.
  const wrong = Math.max(0, scoreMaximum - scoreGiven);
  for (let i = 0; i < Math.min(scoreGiven, 20); i++)
    sig.record({ standard, correct: true, lesson: config.lessonId });
  for (let i = 0; i < Math.min(wrong, 20); i++)
    sig.record({ standard, correct: false, lesson: config.lessonId });
  if (sig.setLastLesson && config.lessonId) sig.setLastLesson(config.lessonId);
}

/**
 * "Recommended next" card data for the final summary: a targeted arcade
 * practice link at the right difficulty plus this lesson's family page.
 * Pure + null-safe so the renderer can use it inline.
 */
export function recommendedNext(config) {
  try {
    const sig = typeof window !== "undefined" && window.NTSignal;
    const tier = sig && sig.suggestTier ? sig.suggestTier() : "both";
    const lessonId = config.lessonId || "";
    if (!lessonId) return null;
    return {
      tier,
      arcadeHref: `/math/games/practice-arcade/?lesson=${encodeURIComponent(lessonId)}${
        tier === "both" ? "" : `&tier=${tier === "l1" ? "1" : "2"}`
      }`,
      arcadeLabel:
        tier === "l1"
          ? "Practice Arcade — warm-up level"
          : tier === "l2"
            ? "Practice Arcade — challenge level"
            : "Practice Arcade",
      familyHref: `/lessons/${encodeURIComponent(lessonId)}/family/`,
    };
  } catch {
    return null;
  }
}
