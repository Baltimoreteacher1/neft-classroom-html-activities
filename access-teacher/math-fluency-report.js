const count = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1_000_000, Math.round(value))) : 0;
const label = (value, fallback = "") =>
  typeof value === "string" ? value.trim().slice(0, 120) : fallback;

/** Accept the Fluency Lab v1 class-report contract and retain aggregate fields only. */
export function normalizeFluencyReport(report) {
  if (
    !report ||
    report.app !== "EduWonderLab Fluency Lab" ||
    report.kind !== "class-report" ||
    report.version !== 1 ||
    !report.totals ||
    !Array.isArray(report.skills)
  ) {
    throw new Error("Choose a Fluency Lab class report JSON file (version 1).");
  }
  const skills = report.skills.slice(0, 200).map((item) => ({
    title: label(item?.skill?.title, "Untitled skill"),
    standard: label(item?.skill?.standard),
    learners: count(item?.learners),
    checkedLearners: count(item?.checkedLearners),
    lowLearners: count(item?.lowLearners),
    avgScore: Number.isFinite(item?.avgScore)
      ? Math.max(0, Math.min(100, Math.round(item.avgScore * 10) / 10))
      : null,
    independentAnswers: count(item?.independentAnswers),
    independentWrong: count(item?.independentWrong),
    supportedAnswers: count(item?.supportedAnswers),
    due: count(item?.due),
    overdue: count(item?.overdue),
  }));
  const totals = report.totals;
  const grade = Number.isInteger(report.grade) && report.grade >= 0 && report.grade <= 8 ? report.grade : null;
  return {
    schema: 1,
    importedAt: new Date().toISOString(),
    generatedAt: typeof report.generatedAt === "string" && !Number.isNaN(Date.parse(report.generatedAt))
      ? new Date(report.generatedAt).toISOString()
      : null,
    grade,
    totals: {
      learners: count(totals.learners),
      skillRecords: count(totals.skillRecords),
      answers: count(totals.answers),
      independentAnswers: count(totals.independentAnswers),
      supportedAnswers: count(totals.supportedAnswers),
    },
    retention: {
      due: count(report.retention?.due),
      overdue: count(report.retention?.overdue),
      retainedSkills: count(report.retention?.retainedSkills),
    },
    growth: {
      learners: count(report.growth?.learners),
      avgDelta: Number.isFinite(report.growth?.avgDelta)
        ? Math.max(-100, Math.min(100, Math.round(report.growth.avgDelta * 10) / 10))
        : null,
      improved: count(report.growth?.improved),
      declined: count(report.growth?.declined),
    },
    skills,
  };
}
