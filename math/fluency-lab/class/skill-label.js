// "Grade 3: Multiplication facts ×0–5" for a stored skill key ("3:mul-0-5"). Shared by the teacher dashboard and
// the family digest (a family page must not import a teacher-named module: those paths are teacher-gated).
import { t } from "../i18n.js";
import { ALL_SKILLS } from "../problem-bank.js";

export const skillLabel = (key) => {
  const [grade, id] = String(key).split(":");
  const skill = ALL_SKILLS.find((s) => String(s.grade) === grade && s.id === id);
  return skill ? t("Grade {grade}: {title}", { grade, title: skill.title || id }) : String(key);
};
