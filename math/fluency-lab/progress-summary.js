// Skill counts for the dashboard's grade and strand navigation: how many skills are proficient or mastered.
import { ALL_SKILLS, GRADES } from "./problem-bank.js";
import { gradeSkills, skillSignals } from "./recommendation-engine.js";

// Per-grade skill counts by mastery state, for the grade and strand navigation.
export function progressByGrade(tutor, now = Date.now()) {
  return GRADES.map((g) => {
    const signals = gradeSkills(g.grade).map((skill) => skillSignals(tutor, skill, now));
    const strong = signals.filter((s) => s.state === "proficient" || s.state === "mastered").length;
    return {
      grade: g.grade,
      label: g.label,
      total: signals.length,
      strong,
      started: signals.filter((s) => s.attempted).length,
    };
  });
}

export function progressByStrand(tutor, grade, now = Date.now()) {
  const map = new Map();
  for (const skill of gradeSkills(grade)) {
    const s = skillSignals(tutor, skill, now);
    const row = map.get(skill.strand) || { strand: skill.strand, total: 0, strong: 0, started: 0 };
    row.total += 1;
    row.strong += s.state === "proficient" || s.state === "mastered" ? 1 : 0;
    row.started += s.attempted ? 1 : 0;
    map.set(skill.strand, row);
  }
  return [...map.values()];
}
