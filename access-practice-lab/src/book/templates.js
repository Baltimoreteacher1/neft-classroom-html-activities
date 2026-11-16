// Every Book Studio template in one list (curriculum templates, family templates, and the two that other studios
// fill: mission-report for Language Worlds and conversation-book for the Speaking Studio).
import { TEMPLATES_A } from "./templates-a.js";
import { TEMPLATES_B } from "./templates-b.js";

export const TEMPLATES = Object.freeze([...TEMPLATES_A, ...TEMPLATES_B]);
const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
export const templateById = (id) => (id ? BY_ID.get(id) || null : null);

/** Gallery groups, in order. */
export const TEMPLATE_GROUPS = Object.freeze([
  { id: "narrative", en: "Stories", es: "Cuentos" },
  { id: "informational", en: "Explain and inform", es: "Explicar e informar" },
  { id: "argument", en: "Argue and persuade", es: "Argumentar y persuadir" },
  { id: "comic", en: "Comics and conversations", es: "Cómics y conversaciones" },
  { id: "poetry", en: "Poetry", es: "Poesía" },
  { id: "response", en: "Respond to reading", es: "Responder a la lectura" },
  { id: "portfolio", en: "My growth", es: "Mi crecimiento" },
  { id: "family", en: "Make a book with your family", es: "Hagan un libro en familia" },
]);

/** Templates for a band: written for it, or for both. Family templates are listed for every band. */
export const templatesFor = (band, { family } = {}) =>
  TEMPLATES.filter(
    (t) =>
      (family == null || !!t.family === family) &&
      (!t.grades?.length || t.grades.includes(band) || t.family),
  );
