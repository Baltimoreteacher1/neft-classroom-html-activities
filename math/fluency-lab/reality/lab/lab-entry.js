// How the rest of the Fluency Lab points into the Reality Lab: one small module that reads only the skill matrix, so the
// Lab's own pages never load the experiences just to draw a link.
import { SKILL_MATRIX } from "./skills.js";

const DECIMAL_SUM = /^\s*(\d*\.?\d+)\s*\+\s*(\d*\.?\d+)\s*$/;
const DECIMAL = /^\d*\.?\d+$/;

// A link for a skill, or null when the matrix records an exception. After a missed decimal addition the Mistake Lab
// opens on the learner's own wrong answer, so the investigation starts from what they actually wrote.
export function labHref(skill, item = null, response = null) {
  const key = `${skill.grade}:${skill.id}`;
  const row = SKILL_MATRIX[key];
  if (!row || row.kind === "exception") return null;
  const base = `reality/lab/?grade=${skill.grade}`;
  if (key === "5:decimal-add" && response != null) {
    const m = DECIMAL_SUM.exec(item?.question ?? "");
    const typed = String(response).trim();
    if (m && DECIMAL.test(typed)) return `${base}&x=mistake-decimal&a=${m[1]}&b=${m[2]}&r=${encodeURIComponent(typed)}`;
  }
  return `${base}&skill=${encodeURIComponent(key)}`;
}

export const labHome = (grade) => `reality/lab/?grade=${grade}`;
