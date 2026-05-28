const SCORE_API = "https://eduwonderlab.pages.dev/api/scores";

export async function reportScore(state, config) {
  const s = state.get();
  const payload = {
    studentName: s.studentName,
    studentPeriod: s.studentPeriod,
    lessonId: config.lessonId,
    activitySlug: config.lessonId,
    score: s.totalCorrect,
    totalPoints: s.totalAttempts,
    percent:
      s.totalAttempts > 0
        ? Math.round((s.totalCorrect / s.totalAttempts) * 100)
        : 0,
    phases: (s.phases || []).map((p) => ({
      name: p.name,
      stars: p.stars,
      correct: p.correct,
      attempts: p.attempts,
      xpEarned: p.xpEarned,
    })),
    completedAt: new Date().toISOString(),
  };
  try {
    const res = await fetch(SCORE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
