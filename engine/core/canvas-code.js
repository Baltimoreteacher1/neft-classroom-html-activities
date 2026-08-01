/**
 * canvas-code.js — shows a student their "Canvas completion code" when they
 * finish a lesson, so they can paste it into the matching Canvas assignment.
 *
 * Generation is independent of EduPulse/D1: the code is computed entirely in the
 * browser via the shared codec (assets/canvas-code-codec.js), so it works even
 * when the gradebook backend is unconfigured. Fire-and-forget — never throws into
 * the lesson flow.
 *
 * The modal itself lives in the shared UI module (assets/canvas-code-ui.js) so
 * the engine and the EduPulse bridge (games / bespoke activities) render the
 * EXACT same completion-code experience — one source of truth, no drift, and an
 * idempotent guard means a lesson is never shown two codes.
 */

const UI_SRC = "/assets/canvas-code-ui.js";

/** Load the shared completion-code UI once; resolve when it is ready. */
function ensureUI() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.NeftCanvasCodeUI) return Promise.resolve(window.NeftCanvasCodeUI);
  return new Promise((resolve) => {
    let s = /** @type {HTMLScriptElement|null} */ (
      document.querySelector(`script[src="${UI_SRC}"]`)
    );
    if (!s) {
      s = document.createElement("script");
      s.src = UI_SRC;
      document.body.append(s);
    }
    s.addEventListener("load", () => resolve(window.NeftCanvasCodeUI || null), {
      once: true,
    });
    s.addEventListener("error", () => resolve(null), { once: true });
    // Already-loaded edge case
    if (window.NeftCanvasCodeUI) resolve(window.NeftCanvasCodeUI);
  });
}

function buildPayload(state, config) {
  const s = state.get();
  const totalStars = (s.phases || []).reduce((sum, p) => sum + (p.stars || 0), 0);
  const percent = s.totalAttempts > 0 ? Math.round((s.totalCorrect / s.totalAttempts) * 100) : 0;
  return {
    studentName: s.studentName || "",
    classPeriod: s.studentPeriod || "",
    activityId: config.lessonId || "lesson",
    activityTitle: config.title || config.lessonId || "Lesson",
    score: s.totalCorrect,
    maxScore: s.totalAttempts || 1,
    percent,
    stars: totalStars,
  };
}

/** Generate + show the completion code. Safe to call once on lesson completion. */
export async function showCanvasCode(state, config) {
  try {
    const payload = buildPayload(state, config);
    const ui = await ensureUI();
    if (!ui) return;
    // The shared UI handles SCORM relay + skip, codec load, render and a11y.
    ui.show(payload);
  } catch {
    // never break the lesson
  }
}
