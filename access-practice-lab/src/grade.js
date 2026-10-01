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
  { id: "answered", label: "I answered the whole question.", es: "Contesté toda la pregunta." },
  {
    id: "connected",
    label: "I connected ideas with because, and, so, or then.",
    es: "Conecté ideas con porque, y, entonces.",
  },
  {
    id: "words",
    label: "I used words from today's word bank.",
    es: "Usé palabras del banco de palabras.",
  },
  {
    id: "clear",
    label: "I spoke clearly and in full sentences.",
    es: "Hablé claro y en oraciones completas.",
  },
];

const WORD_GOALS = { A: 20, B: 45, C: 80 };
export const wordGoal = (level) => WORD_GOALS[level] || 40;

/** Feedback for a written response — counts and finds, never a grade. */
export function analyzeWriting(text, activity, level) {
  const t = String(text || "");
  const lower = t.toLowerCase();
  const words = wordCount(t);
  const bank = [...(activity.wordBank || []), ...(activity.vocabulary || []).map((v) => v[0])]
    .map((w) => String(w).split("/")[0].trim().toLowerCase())
    .filter(Boolean);
  const usedWords = [...new Set(bank.filter((w) => lower.includes(w)))];
  const connectors = (
    t.match(
      /\b(because|but|so|and then|then|first|next|finally|however|also|for example|as a result|therefore)\b/gi,
    ) || []
  ).map((w) => w.toLowerCase());
  const sentences = (t.match(/[^.!?]+[.!?]/g) || []).length;
  const capitalStart = /^\s*[A-Z]/.test(t);
  const goal = wordGoal(level);
  const checks = [
    {
      ok: words >= goal,
      label: `About ${goal} words or more`,
      tip: `Add more detail — aim for about ${goal} words.`,
    },
    {
      ok: connectors.length > 0,
      label: "Connects ideas (because, so, then…)",
      tip: "Join two ideas with because, so, or then.",
    },
    {
      ok: usedWords.length > 0,
      label: "Uses word-bank words",
      tip: "Use at least one word from the word bank.",
    },
    {
      ok: sentences >= (level === "A" ? 1 : 2) && capitalStart,
      label: "Complete sentences",
      tip: "Start with a capital letter and end each sentence with a period.",
    },
  ];
  return {
    words,
    goal,
    usedWords,
    connectors: [...new Set(connectors)],
    sentences,
    checks,
    met: checks.filter((c) => c.ok).length,
  };
}

export function band(score, total) {
  if (!total) return "Not yet";
  const r = score / total;
  if (r >= 0.85) return "Strong";
  if (r >= 0.6) return "Almost there";
  return "Keep practicing";
}
