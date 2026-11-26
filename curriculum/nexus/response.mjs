// nexus/response.mjs — the instructional response engine. It reads OBSERVABLE
// evidence only (what was typed, how many tries, which supports were opened)
// and runs the cycle: evidence → possible explanation → targeted support →
// revision → new attempt → independent transfer. Observations and
// interpretations are kept apart in the output, interpretations are worded as
// possibilities, and a right answer reached with heavy support is never
// reported as independent. It makes no claim about the student as a person
// (no disability, no proficiency level). Pure.

const P = (en, es) => ({ en, es });

/**
 * @typedef {{ qid: string, tries: number, correct: boolean, supports: string[], miscon: string|null, last: string }} Evidence
 */

/** Record one attempt into the evidence map (immutable). */
export function record(evidence, qid, { correct, miscon = null, text = "" }) {
  const prev = evidence[qid] || { qid, tries: 0, correct: false, supports: [], miscon: null, last: "" };
  if (prev.correct) return evidence; // a solved item does not regress
  return { ...evidence, [qid]: { ...prev, tries: prev.tries + 1, correct, miscon: miscon ?? prev.miscon, last: String(text).slice(0, 40) } };
}

export function useSupport(evidence, qid, kind) {
  const prev = evidence[qid] || { qid, tries: 0, correct: false, supports: [], miscon: null, last: "" };
  if (prev.supports.includes(kind)) return evidence;
  return { ...evidence, [qid]: { ...prev, supports: [...prev.supports, kind] } };
}

/** independent | supported | not-yet | none */
export function classify(e) {
  if (!e || !e.tries) return "none";
  if (!e.correct) return "not-yet";
  return e.tries === 1 && e.supports.length === 0 ? "independent" : "supported";
}

/**
 * The teacher- and student-readable response.
 * @param {Record<string, Evidence>} evidence
 * @param {{ id: string, skill: string, miscon: {why:{en:string,es:string}, support:string}[] }[]} qs
 * @param {{ transferDone?: boolean, transferIndependent?: boolean, freshIndependent?: boolean }} state
 */
export function respond(evidence, qs, state = {}) {
  const rows = qs.map((q) => ({ q, e: evidence[q.id], level: classify(evidence[q.id]) }));
  const observed = rows
    .filter((r) => r.level !== "none")
    .map((r) => {
      const e = r.e;
      const sup = e.supports.length ? `; opened ${e.supports.join(", ")}` : "";
      return `${r.q.id.toUpperCase()}: ${e.correct ? "correct" : "not yet correct"} after ${e.tries} ${e.tries === 1 ? "try" : "tries"}${sup}.`;
    });
  const possible = [];
  for (const r of rows) {
    const m = r.e?.miscon && r.q.miscon.find((x) => x.why.en === r.e.miscon);
    if (m) possible.push({ qid: r.q.id, text: m.why, note: "Possible explanation: this answer matches a known reasoning pattern. Ask the student to explain before deciding." });
  }
  const counts = { independent: 0, supported: 0, "not-yet": 0, none: 0 };
  for (const r of rows) counts[r.level]++;

  let next;
  const misconRow = rows.find((r) => r.level === "not-yet" && r.e.miscon);
  if (misconRow) {
    const m = misconRow.q.miscon.find((x) => x.why.en === misconRow.e.miscon);
    next = m?.support === "vocab"
      ? { kind: "vocab", title: P("Check the key word", "Revisa la palabra clave"), why: P("The answer matches a mix-up between two related words.", "La respuesta coincide con una confusión entre dos palabras relacionadas.") }
      : { kind: "model", title: P("See it a different way", "Míralo de otra manera"), why: P("The answer matches a known reasoning pattern. The model shows why it does not hold.", "La respuesta coincide con un patrón de razonamiento conocido. El modelo muestra por qué no funciona.") };
  } else if (counts["not-yet"] > 0) {
    next = { kind: "prerequisite", title: P("Rebuild the idea", "Reconstruye la idea"), why: P("Not yet correct, and the answer does not match a pattern we know. Step back to the model and the words.", "Aún no es correcta y la respuesta no coincide con un patrón conocido. Vuelve al modelo y a las palabras.") };
  } else if (counts.none > 0) {
    next = { kind: "continue", title: P("Keep going", "Sigue adelante"), why: P("Some questions are not tried yet.", "Aún hay preguntas sin intentar.") };
  } else if (counts.supported > 0 && !state.freshIndependent) {
    next = { kind: "fresh", title: P("Try a fresh one on your own", "Intenta uno nuevo por tu cuenta"), why: P("Correct with support or after retries. A new problem with no supports shows what is independent.", "Correcto con apoyo o tras varios intentos. Un problema nuevo sin apoyos muestra lo que es independiente.") };
  } else if (!state.transferDone) {
    next = { kind: "transfer", title: P("Use it somewhere new", "Úsalo en otro lugar"), why: P("Every question correct on the first try with no supports. Now an unfamiliar situation.", "Todas correctas al primer intento y sin apoyos. Ahora una situación desconocida.") };
  } else {
    next = state.transferIndependent
      ? { kind: "explain", title: P("Explain it to someone", "Explícaselo a alguien"), why: P("Independent on the questions and the new situation.", "Independiente en las preguntas y en la situación nueva.") }
      : { kind: "fresh", title: P("One more on your own", "Uno más por tu cuenta"), why: P("The new situation needed support or retries.", "La situación nueva necesitó apoyo o varios intentos.") };
  }
  return {
    observed,
    possible,
    counts,
    next,
    caution: "Evidence from one short session. It describes these answers, not the student. Supported correct answers are not counted as independent.",
  };
}
