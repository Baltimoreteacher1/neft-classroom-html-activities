/**
 * Score reporting — fire-and-forget, never breaks the lesson.
 * Uses EduPulse bridge when configured; otherwise silent no-op (no console noise).
 */

function isEduPulseReady() {
  if (typeof window === "undefined") return false;
  const cfg = window.EDUPULSE_CONFIG;
  const key = cfg?.ingestKey || "";
  return Boolean(
    cfg?.apiBase &&
      key &&
      !key.includes("PASTE") &&
      !key.includes("YOUR_") &&
      window.EduPulse?.record,
  );
}

export async function reportScore(state, config) {
  const s = state.get();
  const totalStars = (s.phases || []).reduce((sum, p) => sum + (p.stars || 0), 0);
  const percent =
    s.totalAttempts > 0
      ? Math.round((s.totalCorrect / s.totalAttempts) * 100)
      : 0;

  // Prefer EduPulse gradebook when bridge is loaded and configured
  if (isEduPulseReady()) {
    try {
      const studentId =
        s.studentId ||
        (s.studentName || "anonymous")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 40) ||
        "anonymous";

      window.EduPulse.identify({
        studentId,
        studentName: s.studentName || "",
        classPeriod: s.studentPeriod || "",
      });

      await window.EduPulse.record({
        activityId: config.lessonId || "lesson",
        activityTitle: config.title || config.lessonId,
        standard: config.standard || "",
        score: s.totalCorrect,
        maxScore: s.totalAttempts || 1,
        percent,
        stars: totalStars,
        problemsCorrect: s.totalCorrect,
        problemsAttempted: s.totalAttempts,
      });
      return true;
    } catch {
      // Silent — activity must never break on score upload failure
      return false;
    }
  }

  // No local /api/scores endpoint on Pages — skip silently (no fetch, no console error)
  return false;
}
