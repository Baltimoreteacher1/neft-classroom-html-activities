/**
 * es-explore-compose.mjs — rebuild the Explore lab's DERIVED strings from the
 * atom each one wraps.
 *
 * The lab's "go deeper" variant of a task is the task's own instructions with a
 * fixed sentence on either side:
 *
 *   "Go deeper: {instructions} As you work, ask yourself WHY it works."
 *
 * A second wrapper, "Quick warm-up together: {instructions}", does the same for the
 * lighter variant. 142 of the 818 strings on this surface are one of the two. Translating them separately
 * means writing one set of instructions twice and drifting between the two, so
 * a student who opens the deeper version reads a different description of the
 * same activity. Only the instructions are translated; the wrapper is rebuilt.
 *
 * Same architecture as es-concept-compose.mjs and es-reflect-compose.mjs.
 */

// Each entry is one differentiated presentation of the SAME task: the deeper
// variant and the warm-up variant both quote the task's own instructions.
const WRAPPERS = [
  {
    prefix: "Go deeper: ",
    suffix: " As you work, ask yourself WHY it works.",
    esPrefix: "Ve más a fondo: ",
    esSuffix: " Mientras trabajas, pregúntate por qué funciona.",
  },
  {
    prefix: "Quick warm-up together: ",
    suffix: "",
    esPrefix: "Calentamiento rápido en grupo: ",
    esSuffix: "",
  },
];

/** The wrapper that produced `en`, or null when it is not a wrapper. */
function match(en) {
  const text = String(en ?? "");
  for (const w of WRAPPERS) {
    if (!text.startsWith(w.prefix)) continue;
    if (w.suffix && !text.endsWith(w.suffix)) continue;
    const atom = text.slice(w.prefix.length, text.length - w.suffix.length);
    if (atom) return { wrapper: w, atom };
  }
  return null;
}

/** The atom a wrapper is built from, or null when `en` is not a wrapper. */
export function unwrap(en) {
  return match(en)?.atom ?? null;
}

/**
 * The Spanish for one Explore string, composed when it is a wrapper.
 * @param {string} en the English string
 * @param {Map<string,string>} memory EN → ES for the ATOMS
 * @returns {string|null} the Spanish, or null when the atom is untranslated
 */
export function derive(en, memory) {
  const direct = memory.get(en);
  if (direct) return direct;
  const hit = match(en);
  if (!hit) return null;
  const es = memory.get(hit.atom);
  if (!es) return null;
  return `${hit.wrapper.esPrefix}${es}${hit.wrapper.esSuffix}`;
}

/** True when `en` wraps another string (used by the gate). */
export function isComposed(en) {
  return unwrap(en) != null;
}
