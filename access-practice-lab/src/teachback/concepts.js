// Teach It Back: the concept bank and the lookups the view uses. Data lives in concepts-*.js; how to add one: TEACH-BACK.md.
import { CONCEPTS_35A } from "./concepts-35a.js";
import { CONCEPTS_35B } from "./concepts-35b.js";
import { CONCEPTS_68A } from "./concepts-68a.js";
import { CONCEPTS_68B } from "./concepts-68b.js";

export const BANDS = ["3-5", "6-8"];
export const SUBJECTS = ["math", "science", "social studies", "language arts", "health"];
export const SUBJECT_LABEL = {
  math: ["Math", "Matemáticas"],
  science: ["Science", "Ciencias"],
  "social studies": ["Social studies", "Estudios sociales"],
  "language arts": ["Language arts", "Lenguaje y literatura"],
  health: ["Health", "Salud"],
};
export const CONCEPTS = [...CONCEPTS_35A, ...CONCEPTS_35B, ...CONCEPTS_68A, ...CONCEPTS_68B];

export const conceptById = (id) => CONCEPTS.find((c) => c.id === id) || null;
export const conceptsForBand = (band) => CONCEPTS.filter((c) => c.band === band);
export const isTeachBand = (band) => BANDS.includes(band);

/** Concepts grouped by subject, in the order of SUBJECTS, for one band. */
export const bySubject = (band) =>
  SUBJECTS.map((subject) => ({ subject, items: conceptsForBand(band).filter((c) => c.subject === subject) })).filter(
    (g) => g.items.length,
  );

/** "On my own" choices: a DIFFERENT concept from the same subject and band. */
export const ownChoices = (concept) =>
  CONCEPTS.filter((c) => c.band === concept.band && c.subject === concept.subject && c.id !== concept.id);
