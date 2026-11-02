// Scoring — one source of truth for practice activities and practice tests.
import { wordCount } from "./util.js";

const sameSet = (want, got) => {
  const a = [...(want || [])].map(String).sort().join("\u0000");
  const b = [...(got || [])].map(String).sort().join("\u0000");
  return a.length > 0 && a === b;
};

/** Is this item auto-scored? (constructed responses and worksheets are not) */
export const isAuto = (item) => !["constructed", "worksheet"].includes(item.type);

/** Correct-or-not for an auto-scored item. */
export function isCorrect(item, answer) {
  switch (item.type) {
    case "multiSelect":
    case "hotText":
      return sameSet(item.answers, answer);
    case "order":
      return (
        (item.answer || []).length > 0 &&
        (item.answer || []).join("\u0000") === (answer || []).join("\u0000")
      );
    case "cloze": {
      const blanks = (item.segments || []).filter((s) => s.blank).map((s) => s.blank);
      const a = answer || {};
      return blanks.length > 0 && blanks.every((b) => a[b.id] === b.answer);
    }
    case "sort": {
      const a = answer || {};
      return (item.items || []).length > 0 && item.items.every((it) => a[it.id] === it.answer);
    }
    case "multipleChoice":
      return item.answer != null && answer === item.answer;
    default:
      return false;
  }
}

/** Has the student given any answer? */
export function isAnswered(item, answer) {
  if (answer == null) return false;
  if (typeof answer === "string")
    return item.type === "constructed" ? wordCount(answer) > 0 : answer !== "";
  if (Array.isArray(answer)) return answer.length > 0;
  return Object.values(answer).some((v) => v !== "" && v != null);
}

/** Human-readable correct answer (for review after a test or a second miss). */
export function correctAnswerText(item) {
  const opt = (id) => (item.options || []).find((o) => o.id === id)?.text || id;
  switch (item.type) {
    case "multipleChoice":
      return opt(item.answer);
    case "multiSelect":
      return (item.answers || []).map(opt).join(" · ");
    case "hotText":
      return (item.answers || [])
        .map((id) => item.sentences.find((s) => s.id === id)?.text || id)
        .join(" ");
    case "order":
      return (item.answer || [])
        .map((id, i) => `${i + 1}. ${item.items.find((x) => x.id === id)?.text || id}`)
        .join("  ");
    case "cloze":
      return (item.segments || []).map((s) => (s.blank ? `[${s.blank.answer}]` : s.text)).join("");
    case "sort":
      return (item.items || []).map((it) => `${it.text} → ${it.answer}`).join(" · ");
    default:
      return "";
  }
}

// ── speaking & writing self-checks ────────────────────────────────────────────
export const SPEAKING_CHECKS = [
  { id: "topic", label: "I named the topic.", es: "Dije el tema." },
  {
    id: "details",
    label: "I used details.",
    es: "Usé detalles.",
  },
  {
    id: "thinking",
    label: "I explained my thinking.",
    es: "Expliqué mi razonamiento.",
  },
  {
    id: "clear",
    label: "I spoke clearly.",
    es: "Me expresé con claridad.",
  },
];

const WORD_GOALS = { A: 20, B: 45, C: 80 };
export const wordGoal = (level) => WORD_GOALS[level] || 40;

export function band(score, total) {
  if (!total) return "Not yet";
  const r = score / total;
  if (r >= 0.85) return "Strong";
  if (r >= 0.6) return "Almost there";
  return "Keep practicing";
}

/** Student-facing classroom bands; these never represent WIDA scores or proficiency levels. */
export function practiceBand(score, total) {
  if (!total || score <= 0) return "Not yet";
  const ratio = score / total;
  if (ratio >= 0.8) return "Strong practice response";
  if (ratio >= 0.4) return "Almost there";
  return "Getting started";
}

/**
 * Counts observable writing signals only. It does not judge meaning, accuracy,
 * or writing proficiency. The word target follows the selected A/B/C pathway.
 */
export function writingPracticeScore(analysis, { level = "A", bankAvailable = false } = {}) {
  const met = [
    {
      id: "length",
      label: `Reached the ${wordGoal(level)}-word practice target`,
      ok: analysis.words >= wordGoal(level),
      next: `Add a useful detail to move toward ${wordGoal(level)} words.`,
    },
    {
      id: "explanation",
      label: "Used a linking or explanation word",
      ok: analysis.cohesion.jobs.some((job) => ["cause", "contrast", "sequence", "addition"].includes(job)),
      next: "Connect two ideas with because, but, so, or then.",
    },
    ...(bankAvailable
      ? [{
          id: "vocabulary",
          label: "Used a word from the word bank",
          ok: analysis.word.bankUsed.length > 0,
          next: "Choose one useful word from the word bank and use it in a sentence.",
        }]
      : []),
    {
      id: "sentence",
      label: "Used ending punctuation in a sentence",
      ok: analysis.sentenceStats.shapes.some(({ text }) => /[.!?]\s*$/.test(text.trim())) && !analysis.errors.some((error) => error.id === "fragment-subordinate"),
      next: "Reread one sentence. Finish the thought and add an ending mark.",
    },
    {
      id: "detail",
      label: "Included a detail or evidence signal",
      ok: analysis.evidence.cites > 0 || analysis.word.domain.length > 0,
      next: "Add one specific detail from the prompt, source, or word bank.",
    },
  ];
  const score = met.filter((item) => item.ok).length;
  return {
    score,
    total: met.length,
    band: practiceBand(score, met.length),
    checks: met.map(({ id, label, ok }) => ({ id, label, ok })),
    nextStep: met.find((item) => !item.ok)?.next || "Reread your response and check that each detail supports your answer.",
  };
}

// ── display-time Spanish for stored practice wording ──────────────────────────
// band(), practiceBand() and writingPracticeScore() return English sentences that are saved in the
// learner's record and compared elsewhere, so their return values never change with the language.
// The view translates them when it draws them: practiceCopy(english, i18n) → markup-safe text, English
// when i18n is absent or the sentence is unknown.
const PRACTICE_ES = {
  "Not yet": "Todavía no",
  Strong: "Fuerte",
  "Almost there": "Casi lo logras",
  "Keep practicing": "Sigue practicando",
  "Strong practice response": "Respuesta de práctica sólida",
  "Getting started": "Empezando",
  "Used a linking or explanation word": "Usaste una palabra de enlace o de explicación",
  "Used a word from the word bank": "Usaste una palabra del banco de palabras",
  "Used ending punctuation in a sentence": "Usaste un signo final en una oración",
  "Included a detail or evidence signal": "Incluiste un detalle o una señal de evidencia",
  "Connect two ideas with because, but, so, or then.": "Une dos ideas con because, but, so o then.",
  "Choose one useful word from the word bank and use it in a sentence.": "Elige una palabra útil del banco de palabras y úsala en una oración.",
  "Reread one sentence. Finish the thought and add an ending mark.": "Vuelve a leer una oración. Termina la idea y agrega un signo final.",
  "Add one specific detail from the prompt, source, or word bank.": "Agrega un detalle específico de la pregunta, la fuente o el banco de palabras.",
  "Reread your response and check that each detail supports your answer.": "Vuelve a leer tu respuesta y revisa que cada detalle apoye tu respuesta.",
};
const PRACTICE_ES_PATTERNS = [
  [/^Reached the (\d+)-word practice target$/, (n) => `Llegaste a la meta de práctica de ${n} palabras`],
  [/^Add a useful detail to move toward (\d+) words\.$/, (n) => `Agrega un detalle útil para acercarte a ${n} palabras.`],
];
function practiceEs(en) {
  if (PRACTICE_ES[en]) return PRACTICE_ES[en];
  for (const [re, make] of PRACTICE_ES_PATTERNS) {
    const m = re.exec(en);
    if (m) return make(m[1]);
  }
  return undefined;
}
export const practiceCopy = (en, i18n) => (i18n ? i18n.T(en, practiceEs(en)) : en);
