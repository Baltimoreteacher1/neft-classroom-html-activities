// Misconception Detective: the case bank. cases-35.js and cases-68.js hold the compact authoring form; this module
// expands every case into the shape the engine, the view and the tests use. Pure data, no DOM.
import { CASES_35 } from "./cases-35.js";
import { CASES_68 } from "./cases-68.js";

export const SUBJECTS = [
  ["math", "Math", "Matemáticas"],
  ["science", "Science", "Ciencias"],
  ["social", "Social studies", "Estudios sociales"],
  ["ela", "Reading and writing", "Lectura y escritura"],
  ["health", "Health", "Salud"],
];
export const CASE_BANDS = ["3-5", "6-8"];
const CARD_KIND = { e: "evidence", a: "assumption", o: "offtopic" };
// Words too general to prove a learner named the idea ("only", "all"): never counted as the flawed idea.
export const GENERIC = new Set(["only", "one", "every", "all", "some", "none", "more", "less", "same", "different", "there", "make", "makes", "time", "first", "any", "always", "much", "two", "many", "need", "needs", "depends", "day", "night", "show", "shows", "age", "text"]);

const pair = ([en, es]) => ({ en, es });

function expand([band, c]) {
  return {
    id: c.id,
    band,
    subject: c.subject,
    concept: c.concept,
    flaw: c.flaw,
    title: pair(c.title),
    speaker: c.speaker,
    lines: c.lines.map((l) => pair(l)),
    flawed: c.flawed,
    whyFine: c.lines.map((l, i) => (i === c.flawed ? null : { en: l[2], es: l[3] })),
    cards: c.cards.map((k, i) => ({ id: `${c.id}-c${i + 1}`, kind: CARD_KIND[k[0]], en: k[1], es: k[2], note: { en: k[3], es: k[4] } })),
    fix: c.fix.map((f, i) => ({ ...pair(f), correct: i === c.right })),
    why: pair(c.why),
    accept: c.accept.split(/\s+/).filter((w) => !GENERIC.has(w.toLowerCase())),
    focus: pair(c.focus),
    terms: c.terms.map(([w, es, gloss]) => ({ w, es, gloss })),
    transfer: pair(c.transfer),
    calc: c.calc || [],
  };
}

export const CASES = [...CASES_35.map((c) => ["3-5", c]), ...CASES_68.map((c) => ["6-8", c])].map(expand);
