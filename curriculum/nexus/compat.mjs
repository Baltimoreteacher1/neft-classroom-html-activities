// nexus/compat.mjs — which versions of a resource are educationally AND
// technically sound. A conversion is offered only when the resource holds what
// that version needs; otherwise it is listed with the reason, so a teacher
// never gets a weak or misleading material (a vocabulary game from two words, an
// "aligned to Lesson 3-3" label on numbers the teacher has since changed, a
// Spanish version with English holes). Pure.

import { KITS } from "./kits.mjs";
import { modelOf, questions } from "./resource.mjs";

const P = (en, es) => ({ en, es });

/** Fields a Spanish version needs, as [label, pair] — missing ones are reported, never machine-filled. */
function spanishGaps(r) {
  const gaps = [];
  if (!r.title.es) gaps.push("title");
  if (!r.objective.es) gaps.push("objective");
  r.vocab.forEach((v, i) => {
    if (!v.term.es || !v.def.es) gaps.push(`word ${i + 1}`);
  });
  for (const [k, o] of Object.entries(r.overrides)) if (!o.text.es) gaps.push(`${k.split(":")[0]} wording`);
  return gaps;
}

/**
 * @returns {{ id: string, label: {en:string,es:string}, ok: boolean, reason: string, warn?: string }[]}
 */
export function compatibility(r) {
  const model = modelOf(r);
  const qs = model ? questions(r) : [];
  const defined = r.vocab.filter((v) => v.def.en);
  const es = spanishGaps(r);
  const out = [];
  const add = (id, label, ok, reason, warn) => out.push({ id, label, ok, reason: ok ? "" : reason, ...(warn ? { warn } : {}) });

  add("mission", P("Interactive mission", "Misión interactiva"), !!model && qs.length >= 3, "The model numbers are not valid, so no questions can be checked.");
  add("model", P("Animated model", "Modelo animado"), !!model && !!KITS[r.kit], "The living model refuses these numbers rather than drawing something mathematically wrong.");
  add("twin", P("What-if explorer", "Explorador de ¿qué pasa si?"), !!model && KITS[r.kit].consequences(model).length >= 2, "This topic has no live consequences to explore.");
  add("worksheet", P("Printable worksheet (PDF)", "Hoja imprimible (PDF)"), qs.length >= 3, "Needs at least three checkable questions.");
  add("key", P("Answer key + teacher notes", "Clave de respuestas + notas"), qs.length >= 3, "Needs checkable questions.");
  add("docx", P("Editable Word document", "Documento de Word editable"), qs.length >= 3, "Needs checkable questions.");
  add("offline", P("Offline HTML file", "Archivo HTML sin conexión"), qs.length >= 3, "Needs checkable questions.", "The offline file checks answers and keeps supports, and shows the numbers table, but not the animated model.");
  add("vocab-cards", P("Vocabulary cards", "Tarjetas de vocabulario"), defined.length >= 3, `Needs at least 3 defined words (has ${defined.length}).`);
  add("vocab-match", P("Vocabulary match game", "Juego de emparejar vocabulario"), defined.length >= 4, `A matching game with fewer than 4 words is guessable (has ${defined.length}).`);
  add("speaking", P("Speaking rehearsal", "Ensayo oral"), r.support === "full", "Turn language support to Full to add the oral rehearsal and frames.");
  add("writing", P("Written explanation", "Explicación escrita"), true, "", r.support === "off" ? "Independent version: students write with no sentence frames." : "");
  add("listening", P("Read-aloud listening", "Escucha en voz alta"), true, "", "Uses the device's own voice. Nothing is sent anywhere; some school devices have no voice installed.");
  add("spanish", P("Spanish version", "Versión en español"), es.length === 0, `Missing Spanish for: ${es.join(", ")}.`);
  add("aligned-label", P(`“Aligned to Lesson ${r.curriculum.lesson || "?"}” label`, `Etiqueta “Alineado a la lección ${r.curriculum.lesson || "?"}”`), r.curriculum.status === "verified", r.curriculum.status === "adapted" ? "You changed the lesson's numbers, so exports say “adapted from” instead." : "No verified curriculum source.");
  return out;
}

export const allowed = (r, id) => compatibility(r).find((c) => c.id === id)?.ok === true;
