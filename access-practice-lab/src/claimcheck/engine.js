// Misconception Detective engine: pure, local, deterministic. No DOM, no network, nothing leaves the device.
// Every sentence shown back to a learner as a quote is a verbatim slice of what they typed.
import { CASES, CASE_BANDS, SUBJECTS } from "./cases.js";

export const STEPS = ["read", "find", "sort", "fix", "reveal"];
export const KINDS = {
  fact: { en: "wrong fact", es: "dato incorrecto", explain: { en: "A statement that is simply not true when you check it against a reliable source or a test.", es: "Una afirmación que simplemente no es verdad cuando la comparas con una fuente confiable o con una prueba." } },
  assumption: { en: "assumption stated as fact", es: "suposición presentada como un hecho", explain: { en: "A belief or a guess that is treated as if someone had checked it.", es: "Una creencia o una suposición que se trata como si alguien la hubiera comprobado." } },
  overgeneral: { en: "overgeneralization", es: "generalización exagerada", explain: { en: "A rule for everything, made from just a few examples or one example.", es: "Una regla para todo, hecha a partir de unos pocos ejemplos o de uno solo." } },
  cause: { en: "mixed-up cause and effect", es: "causa y efecto confundidos", explain: { en: "The wrong thing is named as the reason, or two things that happen together are treated as if one made the other happen.", es: "Se nombra como razón la cosa equivocada, o dos cosas que ocurren juntas se tratan como si una provocara la otra." } },
  calc: { en: "calculation slip", es: "error de cálculo", explain: { en: "The idea or the method is fine, but a number or a step does not work out when you recompute it.", es: "La idea o el método están bien, pero un número o un paso no sale cuando lo vuelves a calcular." } },
  missing: { en: "missing evidence", es: "falta de evidencia", explain: { en: "The claim says more than the evidence shown can support, or it leaves out other evidence.", es: "La afirmación dice más de lo que puede respaldar la evidencia mostrada, o deja fuera otra evidencia." } },
};
export const BUCKETS = {
  evidence: { en: "Evidence (we can check it)", es: "Evidencia (la podemos comprobar)" },
  assumption: { en: "Assumption or opinion (we cannot check it yet)", es: "Suposición u opinión (todavía no la podemos comprobar)" },
  offtopic: { en: "Not about this idea", es: "No trata de esta idea" },
};
export const BUCKET_ORDER = ["evidence", "assumption", "offtopic"];
export const MIN_WORDS = 4;

export { CASES, CASE_BANDS, SUBJECTS };
export const caseById = (id) => CASES.find((c) => c.id === id) || null;
export const casesForBand = (band) => CASES.filter((c) => c.band === band);
export const supportsBand = (band) => CASE_BANDS.includes(band);
export const bySubject = (band) =>
  SUBJECTS.map(([id, en, es]) => ({ id, en, es, cases: casesForBand(band).filter((c) => c.subject === id) })).filter((g) => g.cases.length);

export function newState(id) {
  return { id, step: "read", tried: [], found: false, sort: {}, fixTried: [], fixed: false, sentence: "", checked: false, hints: 0, done: false, independent: false };
}

const uniq = (a) => [...new Set(a)];
const int = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

/** A saved state, repaired against its case: nothing unknown survives and no step can be reached without its work. */
export function sanitizeState(raw, c) {
  const s = newState(c.id);
  if (!raw || typeof raw !== "object") return s;
  s.tried = uniq((Array.isArray(raw.tried) ? raw.tried : []).filter((i) => int(i, 0, c.lines.length - 1) && i !== c.flawed));
  s.found = raw.found === true;
  const ids = new Set(c.cards.map((k) => k.id));
  for (const [k, v] of Object.entries(raw.sort && typeof raw.sort === "object" ? raw.sort : {})) if (ids.has(k) && v in BUCKETS) s.sort[k] = v;
  s.fixTried = uniq((Array.isArray(raw.fixTried) ? raw.fixTried : []).filter((i) => int(i, 0, c.fix.length - 1) && !c.fix[i].correct));
  s.fixed = raw.fixed === true;
  s.sentence = typeof raw.sentence === "string" ? raw.sentence.slice(0, 600) : "";
  s.checked = raw.checked === true && countWords(s.sentence) >= MIN_WORDS;
  s.hints = int(raw.hints, 0, 3) ? raw.hints : 0;
  s.done = raw.done === true && s.found && s.fixed && s.checked;
  s.independent = s.done && raw.independent === true && s.hints === 0;
  const reached = !s.found ? 1 : !sortDone(s, c) ? 2 : !s.fixed || !s.checked ? 3 : 4;
  const want = STEPS.indexOf(raw.step);
  s.step = STEPS[Math.max(0, Math.min(want < 0 ? 0 : want, s.done ? 4 : reached))];
  if (s.step === "reveal" && !s.done) s.step = "fix";
  return s;
}

const countWords = (t) => (String(t).match(/[\p{L}\p{N}]+/gu) || []).length;
export { countWords };

/** Step 3: tap a line. A wrong line gets the note about THAT line; it never names the flawed one. */
export function tapLine(state, c, i) {
  if (!int(i, 0, c.lines.length - 1)) return { state, correct: false, nudge: null };
  if (i === c.flawed) return { state: { ...state, found: true }, correct: true, nudge: null };
  return { state: { ...state, tried: uniq([...state.tried, i]) }, correct: false, nudge: c.whyFine[i] };
}

const WRONG_SORT = {
  "evidence>assumption": { en: "Ask: could someone check this by measuring, counting, reading or looking it up? If so, it can be evidence.", es: "Pregúntate: ¿alguien podría comprobar esto midiendo, contando, leyendo o buscándolo? Si es así, puede ser evidencia." },
  "evidence>offtopic": { en: "This card does help test the idea. Look again at how it connects to what the claim says.", es: "Esta tarjeta sí ayuda a probar la idea. Mira otra vez cómo se conecta con lo que dice la afirmación." },
  "assumption>evidence": { en: "Ask: can anyone check this with a measurement or a source, or is it a belief, a feeling or a guess?", es: "Pregúntate: ¿alguien puede comprobar esto con una medición o una fuente, o es una creencia, una sensación o una suposición?" },
  "assumption>offtopic": { en: "This card is about what someone thinks or feels about the idea, so it is part of the thinking here. Look again.", es: "Esta tarjeta trata de lo que alguien piensa o siente sobre la idea, así que es parte del razonamiento aquí. Mírala otra vez." },
  "offtopic>evidence": { en: "Ask: does this card help us test the idea? It may be true, but does it change what we can say about the claim?", es: "Pregúntate: ¿esta tarjeta nos ayuda a probar la idea? Puede ser verdad, pero ¿cambia lo que podemos decir de la afirmación?" },
  "offtopic>assumption": { en: "Ask: is this card a belief about the idea, or just a detail that has nothing to do with it?", es: "Pregúntate: ¿esta tarjeta es una creencia sobre la idea, o solo un detalle que no tiene que ver con ella?" },
};
export const wrongSortNudge = (correct, chosen) => WRONG_SORT[`${correct}>${chosen}`] || null;

/** Step 4: put a card in a pile. Immediate and specific: the card's own note when right, a question to ask when not. */
export function sortCard(state, c, cardId, bucket) {
  const card = c.cards.find((k) => k.id === cardId);
  if (!card || !(bucket in BUCKETS)) return { state, ok: false, feedback: null };
  const ok = card.kind === bucket;
  return { state: { ...state, sort: { ...state.sort, [cardId]: bucket } }, ok, feedback: ok ? card.note : wrongSortNudge(card.kind, bucket) };
}
export const sortDone = (state, c) => c.cards.every((k) => state.sort[k.id] === k.kind);

/** Step 5a: choose the correct statement. A wrong choice points back to the learner's own evidence, never the answer. */
export function chooseFix(state, c, idx) {
  const f = c.fix[idx];
  if (!f) return { state, ok: false, feedback: null };
  if (f.correct) return { state: { ...state, fixed: true }, ok: true, feedback: null };
  const ev = c.cards.find((k) => k.kind === "evidence");
  return { state: { ...state, fixTried: uniq([...state.fixTried, idx]) }, ok: false, feedback: ev };
}

const REASON = [
  "because", "since", "so that", "therefore", "which means", "that means", "that is why", "that's why", "the reason", "due to", "as a result", "this shows", "shows that", "porque", "ya que", "por eso", "por lo tanto", "eso significa", "así que", "entonces", "so",
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const bounded = (alt, suffix = "") => new RegExp(`(?<![\\p{L}\\p{N}])(?:${alt})${suffix}(?![\\p{L}\\p{N}])`, "iu");
const REASON_RE = bounded(REASON.map(esc).join("|"));

function ideaMatch(c, text) {
  let best = null;
  for (const w of c.accept) {
    const m = bounded(esc(w), "(?:s|es|ed|d|ing)?").exec(text);
    if (m && (!best || m.index < best.index)) best = m;
  }
  return best ? best[0] : null;
}

/**
 * Step 5b: rule-based reading of the learner's sentence. It looks for the flawed idea and a reason word and quotes
 * the learner's own words (verbatim slices of `text`). It never grades: the learner may keep going either way.
 */
export function checkSentence(c, text) {
  const t = String(text || "");
  const words = countWords(t);
  if (words < MIN_WORDS) return { ok: false, words, tooShort: true, idea: null, reason: null, en: `Write at least ${MIN_WORDS} words so the idea and the reason both fit.`, es: `Escribe al menos ${MIN_WORDS} palabras para que quepan la idea y la razón.` };
  if (/_{2,}/.test(t)) return { ok: false, words, tooShort: true, idea: null, reason: null, en: "Replace the blanks (___) with your own words.", es: "Reemplaza los espacios en blanco (___) con tus propias palabras." };
  const idea = ideaMatch(c, t);
  const rm = REASON_RE.exec(t);
  const reason = rm ? rm[0] : null;
  let en;
  let es;
  if (idea && reason) {
    en = `You named the idea (“${idea}”) and gave a reason (“${reason}”). That is the shape of a strong explanation.`;
    es = `Nombraste la idea (“${idea}”) y diste una razón (“${reason}”). Esa es la forma de una explicación sólida.`;
  } else if (idea) {
    en = `You named the idea (“${idea}”). Now say why the line is wrong: try starting the reason with ‘because’.`;
    es = `Nombraste la idea (“${idea}”). Ahora di por qué la línea está mal: prueba a empezar la razón con ‘porque’.`;
  } else if (reason) {
    en = `You gave a reason (“${reason}”). Now say which idea the mistake is about, using a word from the topic.`;
    es = `Diste una razón (“${reason}”). Ahora di de qué idea trata el error, usando una palabra del tema.`;
  } else {
    en = "Say which idea the mistake is about, and why. The frame can help: The mistake is ___ because ___.";
    es = "Di de qué idea trata el error y por qué. La estructura puede ayudar: El error es ___ porque ___.";
  }
  return { ok: Boolean(idea && reason), words, tooShort: false, idea, reason, en, es };
}

/** The hint ladder. Level 1 rereads, 2 narrows to a topic, 3 names the kind of mistake. None states a line or the fix. */
export function hintFor(c, level) {
  const k = KINDS[c.flaw];
  if (level === 1) return { en: "Read the explanation again, slowly, one line at a time. For each line ask: could I check this by measuring, counting, calculating or looking it up?", es: "Lee la explicación otra vez, despacio, una línea a la vez. Para cada línea pregúntate: ¿podría comprobarlo midiendo, contando, calculando o buscándolo?" };
  if (level === 2) return { en: `Narrow it down. Look closely at ${c.focus.en}. Does it still hold up when you check it?`, es: `Acota la búsqueda. Fíjate bien en ${c.focus.es}. ¿Se sostiene cuando lo compruebas?` };
  return { en: `Name the kind of mistake. Here it is a ${k.en}: ${k.explain.en}`, es: `Nombra el tipo de error. Aquí es un ${k.es}: ${k.explain.es}` };
}

/** Mark a case finished. Independent means no hint was ever opened. */
export const finish = (state) => ({ ...state, done: true, step: "reveal", independent: state.hints === 0 });

/** Plain counts for the chooser: finished, on my own, with help. */
export function summarize(done, band) {
  const ids = new Set(casesForBand(band).map((c) => c.id));
  const rows = Object.entries(done || {}).filter(([id]) => ids.has(id));
  const independent = rows.filter(([, r]) => r.independent).length;
  return { total: ids.size, finished: rows.length, independent, supported: rows.length - independent };
}
