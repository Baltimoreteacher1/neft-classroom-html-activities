/**
 * es-reflect-compose.mjs — rebuild the exit ticket's DERIVED strings from the
 * atom each one quotes, instead of translating them separately.
 *
 * Three wrappers dress up one stem, and the same stem appears under all three
 * plus on its own:
 *
 *   "Explain your thinking — {stem}"
 *   "Quick check — you've got this: {stem}"
 *   "(Catch-up check, from Lesson 2.7) {stem}"
 *
 * 201 of the 954 strings on this surface are one of those. Translating them by
 * hand means writing one question up to four times and drifting between the
 * copies — a student meets the same exit-ticket question phrased two different
 * ways on the lesson and on its catch-up, which is the copy-panel defect in the
 * other language. So only the STEM is translated; every wrapper is rebuilt from
 * that stem's own translation and cannot disagree with it.
 *
 * Same architecture as tools/lib/es-concept-compose.mjs, which does this for the
 * worked example.
 */

const CATCHUP = /^\(Catch-up check, from Lesson ([\d.]+)\)\s*/;
const EXPLAIN = "Explain your thinking — ";
const QUICK = "Quick check — you've got this: ";

/** The wrappers, in the order they are tried. */
const WRAPPERS = [
  {
    match: (en) => (en.startsWith(EXPLAIN) ? en.slice(EXPLAIN.length) : null),
    build: (es) => `Explica tu razonamiento — ${es}`,
  },
  {
    match: (en) => (en.startsWith(QUICK) ? en.slice(QUICK.length) : null),
    build: (es) => `Revisión rápida — tú puedes: ${es}`,
  },
  {
    match: (en) => (CATCHUP.test(en) ? en.replace(CATCHUP, "") : null),
    build: (es, en) => `(Repaso rápido, de la lección ${CATCHUP.exec(en)[1]}) ${es}`,
  },
];

/**
 * The Spanish for one exit-ticket string, composed when it is a wrapper.
 * @param {string} en the English string
 * @param {Map<string,string>} memory EN → ES for the ATOMS
 * @returns {string|null} the Spanish, or null when the atom is untranslated
 */
export function derive(en, memory) {
  const direct = memory.get(en);
  if (direct) return direct;
  for (const wrapper of WRAPPERS) {
    const stem = wrapper.match(en);
    if (stem == null) continue;
    const es = memory.get(stem);
    if (!es) return null;
    return wrapper.build(es, en);
  }
  return null;
}

/** True when `en` is a wrapper around another string (used by the gate). */
export function isComposed(en) {
  return WRAPPERS.some((w) => w.match(en) != null);
}
