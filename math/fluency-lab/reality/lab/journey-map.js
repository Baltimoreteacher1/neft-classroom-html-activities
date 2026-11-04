// The learning journey for one grade: its skills in prerequisite order, each skill's state from the learner's saved
// Reality Lab sessions, and the one recommended next step. It reads the knowledge graph and the skill matrix; it authors
// no mathematics and stores nothing of its own.
import { directPrerequisites, skillsInGrade } from "../../e8/knowledge-graph.js";
import { experienceForSkill, exceptionFor, experienceById } from "./catalog.js";
import { sanitizeSession } from "./journey.js";

export const STATES = ["done", "started", "next", "ready", "locked", "exception"];

// Prerequisite order within a grade: a skill comes after every same-grade prerequisite it depends on. Ties keep the
// library's own order, so the sequence stays stable and matches the Fluency Lab's skill list where it can.
export function gradeOrder(grade) {
  const skills = skillsInGrade(grade);
  const inGrade = new Set(skills.map((s) => s.key));
  const placed = new Set();
  const order = [];
  let progressed = true;
  while (order.length < skills.length && progressed) {
    progressed = false;
    for (const skill of skills) {
      if (placed.has(skill.key)) continue;
      const needs = directPrerequisites(skill.key).filter((k) => inGrade.has(k) && k !== skill.key);
      if (needs.every((k) => placed.has(k))) {
        placed.add(skill.key);
        order.push(skill);
        progressed = true;
      }
    }
  }
  // A cycle would leave skills unplaced; they are appended in library order so nothing is ever hidden.
  for (const skill of skills) if (!placed.has(skill.key)) order.push(skill);
  return order;
}

// The saved session for a skill's experience, read and repaired, or null.
function sessionFor(lab, expId) {
  const exp = expId && experienceById(expId);
  if (!exp || !lab?.sessions?.[expId]) return null;
  return sanitizeSession(exp, lab.sessions[expId]);
}

// The state of one skill. A skill without an experience is "exception" (its matrix row says where it is served).
export function skillState(lab, skill, prereqsDone) {
  const expId = experienceForSkill(skill.grade, skill.id);
  if (!expId) return { state: "exception", expId: null, why: exceptionFor(skill.grade, skill.id) };
  const session = sessionFor(lab, expId);
  if (session?.done) return { state: "done", expId };
  if (session) return { state: "started", expId, step: session.step };
  return { state: prereqsDone ? "ready" : "locked", expId };
}

// The whole grade: each skill with its state, and the single recommended next skill (the first ready or started one).
export function journeyFor(grade, lab) {
  const order = gradeOrder(grade);
  const doneKeys = new Set();
  const rows = [];
  for (const skill of order) {
    const needs = directPrerequisites(skill.key).filter((k) => k.startsWith(`${grade}:`));
    const prereqsDone = needs.every((k) => doneKeys.has(k));
    const info = skillState(lab, skill, prereqsDone);
    if (info.state === "done") doneKeys.add(skill.key);
    rows.push({ key: skill.key, title: skill.title, grade, ...info });
  }
  // Exceptions and done skills are not "next": the next step is the first skill still to learn that is open.
  const next =
    rows.find((r) => r.state === "started") || rows.find((r) => r.state === "ready") || null;
  return {
    grade,
    rows,
    next,
    complete: rows.length > 0 && rows.every((r) => r.state === "done" || r.state === "exception"),
  };
}
