// nexus/language.mjs — the Academic Language Overlay. Given a resource it builds
// the reviewed supports for ONE language function (compare / explain / justify):
// a word bank from the resource's own vocabulary, sentence kernels, a because /
// but / so expansion, an oral-rehearsal prompt and a paragraph frame. Presets:
// off (independent version), light (word bank + one frame), full (everything).
// Supports scaffold the LANGUAGE, never the mathematics: no frame may contain a
// question's answer (tools/nexus.test.mjs checks every frame against every
// answer), so the intellectual demand is the same in both versions. Pure.

const P = (en, es) => ({ en, es });

const FUNCTIONS = {
  compare: {
    name: P("Compare", "Comparar"),
    kernels: [P("___ is greater than ___ because ___.", "___ es mayor que ___ porque ___."), P("Both ___ and ___ show ___.", "Tanto ___ como ___ muestran ___."), P("___ is the same as ___, but ___.", "___ es igual que ___, pero ___.")],
    bbs: [P("The two amounts stay in the same relationship because ___.", "Las dos cantidades mantienen la misma relación porque ___."), P("The two amounts stay in the same relationship, but ___.", "Las dos cantidades mantienen la misma relación, pero ___."), P("The two amounts stay in the same relationship, so ___.", "Las dos cantidades mantienen la misma relación, así que ___.")],
    speak: P("Tell a partner which is greater and how you know. Use one word from the word bank.", "Dile a un compañero cuál es mayor y cómo lo sabes. Usa una palabra del banco de palabras."),
  },
  explain: {
    name: P("Explain", "Explicar"),
    kernels: [P("First I ___. Then I ___.", "Primero ___. Luego ___."), P("I found ___ by ___.", "Hallé ___ al ___."), P("This works because ___.", "Esto funciona porque ___.")],
    bbs: [P("My answer makes sense because ___.", "Mi respuesta tiene sentido porque ___."), P("My answer makes sense, but ___.", "Mi respuesta tiene sentido, pero ___."), P("My answer makes sense, so ___.", "Mi respuesta tiene sentido, así que ___.")],
    speak: P("Explain your steps out loud in order. Say 'first', 'then' and 'so'.", "Explica tus pasos en voz alta y en orden. Di 'primero', 'luego' y 'así que'."),
  },
  justify: {
    name: P("Justify", "Justificar"),
    kernels: [P("I think ___ because the evidence shows ___.", "Pienso que ___ porque la evidencia muestra ___."), P("This is fair because ___.", "Esto es justo porque ___."), P("Someone might say ___, but ___.", "Alguien podría decir ___, pero ___.")],
    bbs: [P("The claim is true because ___.", "La afirmación es verdadera porque ___."), P("The claim is true, but ___.", "La afirmación es verdadera, pero ___."), P("The claim is true, so ___.", "La afirmación es verdadera, así que ___.")],
    speak: P("State your claim, then give one piece of evidence from the numbers.", "Di tu afirmación y luego da una evidencia de los números."),
  },
};

export const LANGUAGE_FUNCTIONS = Object.keys(FUNCTIONS);

/** The overlay for a resource at its support level, or null when support is off. */
export function overlay(r) {
  if (r.support === "off") return null;
  const f = FUNCTIONS[r.language] || FUNCTIONS.explain;
  const bank = r.vocab.map((v) => v.term);
  const light = { level: "light", name: f.name, bank, kernels: f.kernels.slice(0, 1) };
  if (r.support === "light") return light;
  return {
    ...light,
    level: "full",
    kernels: f.kernels,
    bbs: f.bbs,
    speak: f.speak,
    paragraph: [P("Claim: ___", "Afirmación: ___"), P("Evidence from the numbers: ___", "Evidencia de los números: ___"), P("Reasoning (why the evidence proves it): ___", "Razonamiento (por qué la evidencia lo prueba): ___")],
    glossary: r.vocab,
  };
}

/** Every string a student sees as a support, for the no-answer check. */
export function overlayStrings(o) {
  if (!o) return [];
  const all = [...o.kernels, ...(o.bbs || []), ...(o.paragraph || []), ...(o.speak ? [o.speak] : [])];
  return all.flatMap((p) => [p.en, p.es]);
}
