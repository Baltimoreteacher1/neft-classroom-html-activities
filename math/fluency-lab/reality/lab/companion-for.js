// One lookup for a family companion: a flagship's hand-written text, or a studio skill's text built from its model, its
// title, and the next skill in the grade's journey that has something to open.
import { skillNode } from "../../e8/knowledge-graph.js";
import { experienceForSkill } from "./catalog.js";
import { COMPANIONS } from "./companions.js";
import { studioCompanion } from "./companions-studios.js";
import { gradeOrder } from "./journey-map.js";
import { SKILL_MATRIX } from "./skills.js";

export function companionFor(expId) {
  if (COMPANIONS[expId]) return COMPANIONS[expId];
  if (!expId?.startsWith("studio:")) return null;
  const key = expId.slice(7);
  const row = SKILL_MATRIX[key];
  if (row?.kind !== "studio") return null;
  const grade = Number(key.split(":")[0]);
  const order = gradeOrder(grade);
  const at = order.findIndex((s) => s.key === key);
  const later = order.slice(at + 1).map((s) => experienceForSkill(s.grade, s.id)).find(Boolean);
  const earlier = order.slice(0, at).map((s) => experienceForSkill(s.grade, s.id)).find((id) => id && id !== expId);
  return studioCompanion(row.template, skillNode(key)?.title ?? key, later ?? earlier ?? null);
}

// The heading for a companion: a studio skill is named by its skill, a flagship by its experience title.
export const companionSkillTitle = (expId) => (expId?.startsWith("studio:") ? (skillNode(expId.slice(7))?.title ?? null) : null);

// Every companion for one grade: that grade's studio and journey skills, then the flagships (which span grades).
export function companionIdsForGrade(grade) {
  const ids = gradeOrder(grade).map((s) => experienceForSkill(s.grade, s.id)).filter((id) => id && companionFor(id));
  return [...new Set(ids)];
}
