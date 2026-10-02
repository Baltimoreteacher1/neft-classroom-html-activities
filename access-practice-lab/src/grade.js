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
    label: "I shared my meaning with words, phrases, or sentences.",
    es: "Comuniqué mis ideas con palabras, frases u oraciones.",
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
  // Match complete words and phrases, including Unicode letters. A word such
  // as "rain" must not count merely because the response contains "train".
  const tokens = (value) => value.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const responseTokens = tokens(lower);
  const usedWords = [...new Set(bank.filter((word) => {
    const phrase = tokens(word);
    return phrase.length > 0 && responseTokens.some((_, start) =>
      phrase.every((token, offset) => responseTokens[start + offset] === token),
    );
  }))];
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
      label: `Optional drafting target: about ${goal} words`,
      tip: "Reread the question. Add a useful detail if your answer needs one; longer is not always better.",
    },
    {
      ok: connectors.length > 0,
      label: "Connects ideas (because, so, then…)",
      tip: "Join two ideas with because, so, or then.",
    },
    {
      ok: !bank.length || usedWords.length > 0,
      label: bank.length ? "Includes a word-bank word" : "No word bank for this task",
      tip: "Try a word from the bank if it helps explain your idea. Check that it fits your meaning.",
    },
    {
      ok: sentences >= (level === "A" ? 1 : 2) && capitalStart,
      label: "Capital letter and end punctuation",
      tip: "Check capital letters and end punctuation. Then read aloud to see whether each sentence makes sense.",
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
