// Every Reality Lab experience, how to find one by id or by skill, and the innovation each one belongs to.
import { L } from "./kernel.js";
import { FLAGSHIPS } from "./flagships.js";
import { MORE } from "./more.js";
import { SKILL_MATRIX } from "./skills.js";
import { studioExperience } from "./studios.js";

export const INNOVATIONS = [
  { id: "living", title: L("Living Math Models", "Modelos matemáticos vivos"), line: L("Build it, cut it, move it.", "Constrúyelo, córtalo, muévelo.") },
  { id: "physics", title: L("Math Physics", "Física matemática"), line: L("Equal changes keep it balanced.", "Los cambios iguales lo mantienen equilibrado.") },
  { id: "discover", title: L("Predict, Test, Discover", "Predice, prueba, descubre"), line: L("Guess first, then find the rule.", "Primero adivina, luego halla la regla.") },
  { id: "xray", title: L("X-Ray Vision", "Rayos X"), line: L("See the structure inside.", "Mira la estructura por dentro.") },
  { id: "mistake", title: L("Mistake Lab", "Laboratorio de errores"), line: L("Find out what happened, then repair it.", "Descubre qué pasó y repáralo.") },
  { id: "build", title: L("Build the Answer", "Construye la respuesta"), line: L("Make something that meets the rules.", "Haz algo que cumpla las reglas.") },
  { id: "connected", title: L("Connected Representations", "Representaciones conectadas"), line: L("Change one, and all of them move.", "Cambia una y todas se mueven.") },
  { id: "reverse", title: L("Reverse Math", "Matemática al revés"), line: L("Start from the answer and invent the problem.", "Empieza por la respuesta e inventa el problema.") },
];

export const EXPERIENCES = [...FLAGSHIPS, ...MORE];
const byId = new Map(EXPERIENCES.map((e) => [e.id, e]));
const studioCache = new Map();

export function experienceById(id) {
  if (byId.has(id)) return byId.get(id);
  if (!id?.startsWith("studio:")) return null;
  const key = id.slice(7);
  if (studioCache.has(key)) return studioCache.get(key);
  const row = SKILL_MATRIX[key];
  if (row?.kind !== "studio") return null;
  const exp = studioExperience(key, row.template, row.variant);
  studioCache.set(key, exp);
  return exp;
}

// What a skill opens: a journey or studio experience id, or null (with the matrix's reason on the row).
export function experienceForSkill(grade, skillId) {
  const key = `${grade}:${skillId}`;
  const row = SKILL_MATRIX[key];
  if (!row || row.kind === "exception") return null;
  return row.kind === "journey" ? row.id : `studio:${key}`;
}

export const exceptionFor = (grade, skillId) => {
  const row = SKILL_MATRIX[`${grade}:${skillId}`];
  return row?.kind === "exception" ? row.why : null;
};

// The experiences that suit a grade, flagships first.
export const experiencesForGrade = (grade) => EXPERIENCES.filter((e) => e.grades.includes(grade));
export const innovationTags = (exp) => [exp.innovation, ...(exp.tags || [])];
