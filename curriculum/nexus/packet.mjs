// nexus/packet.mjs — ONE document model for every printed or exported version.
// The worksheet (PDF via print), the answer key and the Word file all render
// from these blocks, so the formats cannot disagree about a question, a number
// or a support. Blocks: h1, h2, p, meta, q (question with answer line), lines,
// frame, words (vocabulary table), key (answer row). Pure.

import { overlay } from "./language.mjs";
import { questions, story, transferQuestion } from "./resource.mjs";

const T = (pair, lang) => (lang === "es" && pair?.es ? pair.es : pair?.en || "");

const W = {
  name: { en: "Name", es: "Nombre" },
  date: { en: "Date", es: "Fecha" },
  goal: { en: "Goal", es: "Meta" },
  situation: { en: "The situation", es: "La situación" },
  words: { en: "Words to use", es: "Palabras para usar" },
  questions: { en: "Questions", es: "Preguntas" },
  newSituation: { en: "Somewhere new", es: "En otro lugar" },
  explain: { en: "Explain your thinking", es: "Explica tu razonamiento" },
  frames: { en: "Sentence help", es: "Ayuda para escribir" },
  answer: { en: "Answer", es: "Respuesta" },
  key: { en: "Answer key and teacher notes", es: "Clave de respuestas y notas" },
  watch: { en: "If a student answers", es: "Si un estudiante responde" },
  independent: { en: "Independent version (no language supports)", es: "Versión independiente (sin apoyos de lenguaje)" },
  scaffolded: { en: "Supported version", es: "Versión con apoyos" },
};

export function curriculumLine(r, lang) {
  const c = r.curriculum;
  if (c.status === "verified") return lang === "es" ? `Alineado a la lección ${c.lesson} de Reveal Math (Grado 6)` : `Aligned to Reveal Math Grade 6, Lesson ${c.lesson}`;
  if (c.status === "adapted") return lang === "es" ? `Adaptado de la lección ${c.lesson} (números cambiados por el maestro)` : `Adapted from Lesson ${c.lesson} (teacher changed the numbers)`;
  return "";
}

/**
 * @param {any} r resource
 * @param {{ lang?: "en"|"es", audience?: "student"|"teacher", supported?: boolean, seed?: string }} opt
 */
export function packet(r, { lang = "en", audience = "student", supported = r.support !== "off", seed = "print" } = {}) {
  const qs = questions(r);
  const t = transferQuestion(r, seed);
  const ov = supported ? overlay({ ...r, support: r.support === "off" ? "light" : r.support }) : null;
  const b = [];
  b.push({ t: "h1", text: T(r.title, lang) + (audience === "teacher" ? ` — ${T(W.key, lang)}` : "") });
  const cl = curriculumLine(r, lang);
  b.push({ t: "meta", text: [cl, audience === "student" ? T(supported ? W.scaffolded : W.independent, lang) : ""].filter(Boolean).join(" · ") });
  if (audience === "student") b.push({ t: "meta", text: `${T(W.name, lang)}: ____________________   ${T(W.date, lang)}: __________` });
  b.push({ t: "p", text: `${T(W.goal, lang)}: ${T(r.objective, lang)}` });
  b.push({ t: "h2", text: T(W.situation, lang) });
  b.push({ t: "p", text: T(story(r), lang) });
  if (ov && r.vocab.length) {
    b.push({ t: "h2", text: T(W.words, lang) });
    b.push({ t: "words", rows: r.vocab.map((v) => [T(v.term, lang), T(v.def, lang)]) });
  }
  b.push({ t: "h2", text: T(W.questions, lang) });
  qs.forEach((q, i) => {
    b.push({ t: "q", n: i + 1, text: T(q.stem, lang), unit: T(q.unit, lang) });
    if (audience === "teacher") b.push(...keyRows(q, lang));
  });
  if (t) {
    b.push({ t: "h2", text: T(W.newSituation, lang) });
    b.push({ t: "q", n: qs.length + 1, text: T(t.stem, lang), unit: T(t.unit, lang) });
    if (audience === "teacher") b.push(...keyRows(t, lang));
  }
  b.push({ t: "h2", text: T(W.explain, lang) });
  if (ov) {
    b.push({ t: "p", text: `${T(W.frames, lang)}:` });
    for (const f of [...ov.kernels, ...(ov.bbs || [])]) b.push({ t: "frame", text: T(f, lang) });
  }
  b.push({ t: "lines", n: ov ? 4 : 6 });
  if (audience === "teacher") {
    const notes = T(r.notes, lang);
    if (notes) b.push({ t: "h2", text: lang === "es" ? "Notas del maestro" : "Teacher notes" }, { t: "p", text: notes });
    b.push({ t: "p", text: lang === "es" ? "Un acierto con apoyos o tras varios intentos no es dominio independiente. Use el problema nuevo para comprobarlo." : "A correct answer reached with supports or after several tries is not independent mastery. Use the new-situation problem to check." });
  }
  return b;
}

function keyRows(q, lang) {
  const rows = [{ t: "key", text: `${T(W.answer, lang)}: ${fmt(q.answer)} ${T(q.unit, lang)}`.trim() }];
  for (const m of q.miscon) rows.push({ t: "key", text: `${T(W.watch, lang)} ${fmt(m.answer)}: ${T(m.why, lang)}` });
  return rows;
}

/** A key value as a reader writes it: 1.5, or 2/3 when the decimal does not end. */
export function fmt(x) {
  if (Number.isInteger(x) || Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-9) return String(Math.round(x * 1e4) / 1e4);
  for (let d = 2; d <= 12; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9) return `${n}/${d} (≈ ${Math.round(x * 1000) / 1000})`;
  }
  return String(Math.round(x * 1e4) / 1e4);
}
