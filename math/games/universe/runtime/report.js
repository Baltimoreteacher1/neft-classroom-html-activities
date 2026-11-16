// Curriculum launch adapters: hand a finished level to the site's existing
// reporting systems. Nothing new is invented here and nothing is required to be
// present: each bridge is used only if its script is on the page.
//
//   EduPulse (assets/edupulse-bridge.js) -> /api/scores -> the teacher's Live
//     Pulse, mastery roll-up and misconception digest. Misconception tags are
//     the site taxonomy's own (engine/core/misconceptions.js).
//   NeftCanvasBridge (assets/canvas-bridge.js) -> Canvas / SCORM completion
//     and score, when the game was launched from an LMS package.
//   GameStudio (assets/game-studio.js) -> the shared game:complete DOM event.
//
// What is sent is mathematical accuracy and completion. No duration is sent:
// the runtime does not record how fast anyone was (see evidence.js).

/** @param {import("./shell.js").UniverseGame} game */
export function report(game) {
  const s = game.evidence.summary();
  const level = game.level;
  const lesson = s.byLesson[level.lesson] || { decisions: 0, accepted: 0 };
  const done = game.save.completed.length;
  const total = game.def.levels.length;
  const payload = {
    activityId: `universe-${game.def.id}`,
    score: lesson.accepted,
    maxScore: Math.max(1, lesson.decisions),
    problemsCorrect: lesson.accepted,
    problemsAttempted: lesson.decisions,
    level: game.levelIndex + 1,
    standard: level.standard || "",
    misconceptions: Object.keys(s.misconceptions),
    timestamp: Date.now(),
  };
  const w = /** @type {any} */ (window);
  try {
    w.EduPulse?.record?.(payload);
  } catch {
    /* reporting never blocks play */
  }
  try {
    w.GameStudio?.emit?.("complete", {
      gameId: game.def.id,
      level: level.id,
      lesson: level.lesson,
      evidence: {
        decisions: s.decisions,
        accepted: s.accepted,
        revised: s.revised,
        predictions: s.predictions,
        independent: s.independent,
        transferPassed: s.transferPassed,
        supports: s.supports,
      },
    });
  } catch {
    /* optional */
  }
  try {
    const bridge = w.NeftCanvasBridge;
    if (bridge) {
      const percent = Math.round((done / total) * 100);
      if (done >= total) bridge.complete?.(100);
      else bridge.reportScore?.(percent);
    }
  } catch {
    /* optional */
  }
  return payload;
}
