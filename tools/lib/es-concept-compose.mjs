// es-concept-compose.mjs — derive the worked-example strings that are BUILT from
// other strings, instead of translating them again.
//
// Two thirds of the fleet's conceptIntro text is composed. The generator writes
// "Let's build it together — {heading}" for group1, "Push further — {heading}"
// for group2, "Remember the key idea: {keyIdea}." into every youDo, and the
// catch-up lessons quote each covered lesson's title and key idea verbatim into
// a roll-up. Translating those by hand would mean writing the same key idea five
// or six times and drifting between the copies — which is the exact defect the
// copy-panel work was cleaning up.
//
// So the translator only ever writes ATOMS: a lesson's own heading, intro,
// keyIdea, title and stage lines. Everything built from an atom is rebuilt here
// from the atom's translation, which makes consistency structural rather than
// something a reviewer has to police.

/** The fixed Spanish for the generator's own connective tissue. */
export const FRAME = {
  buildTogether: (h) => `Construyámoslo juntos — ${h}`,
  pushFurther: (h) => `Ve más allá — ${h}`,
  introTail:
    " Veremos un ejemplo resuelto, haremos uno juntos y luego harás algunos con pistas disponibles cuando las necesites.",
  rememberKey: (k) => `Recuerda la idea clave: ${k}.`,
  proveTail: " — y puedes decir por qué es cierto y dónde dejaría de serlo.",
  lessonLine: (n, title, key) => `Lección ${n} — ${title}: ${key}`,
  from: (n, line) => `De ${n}: ${line}`,
  mixes: (list) =>
    `La práctica de abajo mezcla problemas de las Lecciones ${list}. Cada problema está marcado con su número de lección.`,
  rollUp: (parts) => parts.join(" • "),
  bigIdeas: (list) => `Las ideas clave — Lecciones ${list}`,
};

const ENG = {
  buildTogether: "Let's build it together — ",
  pushFurther: "Push further — ",
  introTail:
    " We'll walk through a worked example, try one together, then you'll try a few with hints right there when you need them.",
  rememberKey: "Remember the key idea: ",
  proveTail: " — and you can say why it is true, and where it would stop being true.",
};

/** "2.4-2.12" reads as "2.4 a 2.12" in Spanish; "2.2 . 2.4" keeps its bullets. */
const range = (list) => list.replace(/\s*[–—]\s*/g, " a ");

/**
 * Try to build the Spanish for `en` out of already-translated atoms.
 *
 * @param {string} en            the English string to derive
 * @param {Map<string,string>} memory  every translation known so far
 * @returns {string|null} the Spanish, or null when it is not derivable —
 *   null means "a human still has to write this one", never a guess.
 */
export function derive(en, memory) {
  const es = (key) => memory.get(key) || null;

  if (en.startsWith(ENG.buildTogether)) {
    const inner = es(en.slice(ENG.buildTogether.length));
    return inner && FRAME.buildTogether(inner);
  }
  if (en.startsWith(ENG.pushFurther)) {
    const inner = es(en.slice(ENG.pushFurther.length));
    return inner && FRAME.pushFurther(inner);
  }
  if (en.endsWith(ENG.introTail)) {
    const inner = es(en.slice(0, -ENG.introTail.length));
    return inner && inner + FRAME.introTail;
  }
  if (en.startsWith(ENG.rememberKey)) {
    // The generator appends a full stop to a key idea that already ends in one,
    // so the authored string can end "…Bring Down.." — strip only what it added.
    // Try the quoted text both with and without the full stop the generator
    // appends: a key idea that already ends in one produces "…Down.." and a key
    // idea that does not produces "…Down.". Only one of those round-trips, and
    // which one depends on the authored punctuation.
    const raw = en.slice(ENG.rememberKey.length);
    const inner = es(raw) || es(raw.replace(/\.$/, ""));
    return inner && FRAME.rememberKey(inner.replace(/\.$/, ""));
  }
  if (en.endsWith(ENG.proveTail)) {
    // The generator strips the key idea's own trailing full stop before
    // appending this clause, so the atom in memory still carries one and a
    // literal lookup misses. Try both.
    const body = en.slice(0, -ENG.proveTail.length);
    const inner = es(body) || es(`${body}.`);
    return inner && inner.replace(/\.$/, "") + FRAME.proveTail;
  }
  // "From 2.7: <that lesson's first guided line>"
  const from = en.match(/^From (\d+\.\d+): ([\s\S]+)$/);
  if (from) {
    const inner = es(from[2]);
    return inner && FRAME.from(from[1], inner);
  }
  // "Lesson 2.7 — Divide Decimals Using an Algorithm: <key idea>"
  //
  // Both halves can contain ": " — lesson 3.6 is titled "Ratio Reasoning:
  // Convert Measurements within the Same System" — so a non-greedy regex splits
  // in the wrong place and the title lookup misses. Try every colon in turn and
  // keep the split whose left half is a title we actually know.
  const lesson = en.match(/^Lesson (\d+\.\d+) — ([\s\S]+)$/);
  if (lesson) {
    const rest = lesson[2];
    for (let i = rest.indexOf(": "); i !== -1; i = rest.indexOf(": ", i + 1)) {
      const title = es(`__title__${rest.slice(0, i)}`);
      if (!title) continue;
      const key = es(rest.slice(i + 2));
      if (key) return FRAME.lessonLine(lesson[1], title, key);
    }
    return null;
  }
  // "2.6: <key idea> • 2.7: <key idea> • …"
  if (/^\d+\.\d+: /.test(en) && en.includes(" • ")) {
    const parts = en.split(" • ").map((part) => {
      const m = part.match(/^(\d+\.\d+): ([\s\S]+)$/);
      if (!m) return null;
      const key = es(m[2]);
      return key && `${m[1]}: ${key}`;
    });
    return parts.every(Boolean) ? FRAME.rollUp(parts) : null;
  }
  const mixes = en.match(
    /^The practice below mixes problems from Lessons? (.+?)\. Each problem is tagged with its lesson number\.$/,
  );
  if (mixes) return FRAME.mixes(range(mixes[1]));
  const big = en.match(/^The Big Ideas — Lessons? (.+)$/);
  if (big) return FRAME.bigIdeas(range(big[1]));
  return null;
}
