// Reading Room answer checking and feedback logic (pure: no DOM, no storage) so it can be unit-tested.
// The reader (src/views/reading-room.js) calls these; the rules live here once.

const STOP = new Set(
  "the a an and or but of to in on at for with from by as is are was were be been it its this that these those they them their he she his her you your we our i not no so if then than when while because about into over after before also can could would should will may might have has had do does did what which who how why there here more most some any each every one two three".split(
    " ",
  ),
);

/** Split a paragraph into sentences (keeps end punctuation and quotes). */
export function splitSentences(text) {
  return (
    String(text ?? "")
      .match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || []
  );
}

const tokens = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
    .filter((w) => w.length > 3 && !STOP.has(w));

const stem = (w) => w.replace(/(ing|ed|es|s|ly)$/, "").replace(/e$/, "");

/** Is this saved answer correct? Same keys as the authored activities. */
export function gradeActivity(a, ans = {}) {
  const sorted = (xs) => JSON.stringify([...(xs || [])].sort());
  switch (a.type) {
    case "choice":
    case "connector":
      return ans.value === a.answerId;
    case "multi":
    case "hotText":
    case "evidence":
      return sorted(ans.values) === sorted(a.answerIds);
    case "cloze":
      return a.segments
        .filter((x) => x.blank)
        .every((x) => ans.values?.[x.blank.id] === x.blank.answer);
    case "order":
      return (
        JSON.stringify(ans.values || []) ===
        JSON.stringify(a.items.map((x) => a.answerOrder.indexOf(x.id)))
      );
    case "sort":
      return JSON.stringify(ans.values || []) === JSON.stringify(a.items.map((x) => x.answer));
    default:
      return false;
  }
}

/** How many parts of a multi-part answer are right (never reveals which): {right, total}. */
export function partialCount(a, ans = {}) {
  if (a.type === "cloze") {
    const blanks = a.segments.filter((x) => x.blank);
    return {
      right: blanks.filter((x) => ans.values?.[x.blank.id] === x.blank.answer).length,
      total: blanks.length,
    };
  }
  if (a.type === "order")
    return {
      right: a.items.filter((x, i) => ans.values?.[i] === a.answerOrder.indexOf(x.id)).length,
      total: a.items.length,
    };
  if (a.type === "sort")
    return {
      right: a.items.filter((x, i) => ans.values?.[i] === x.answer).length,
      total: a.items.length,
    };
  if (["multi", "hotText", "evidence"].includes(a.type)) {
    const picked = ans.values || [];
    return {
      right: picked.filter((v) => a.answerIds.includes(v)).length,
      total: a.answerIds.length,
      picked: picked.length,
    };
  }
  return { right: ans.value === a.answerId ? 1 : 0, total: 1 };
}

/** Next saved answer after "Check": attempts count up, the explanation opens after a second miss. */
export function nextAnswerState(a, ans = {}, mode) {
  const correct = gradeActivity(a, ans);
  const attempts = (ans.attempts || 0) + 1;
  return {
    ...ans,
    checked: true,
    correct,
    attempts,
    revealed: correct || ans.revealed || attempts >= 2,
    mode,
    skill: a.skill,
  };
}

/** Paragraph ids that support this activity: authored first, then (honest) word overlap with the key. */
export function evidenceParagraphs(a, lesson) {
  if (a.evidenceIds?.length) return a.evidenceIds;
  if (a.type === "evidence") return a.answerIds || [];
  if (!["choice", "connector", "multi", "hotText"].includes(a.type)) return [];
  // Whole-text questions have no single supporting paragraph; do not guess one.
  if (/main idea|central idea|summar|mostly (about|explain)/i.test(`${a.skill} ${a.prompt}`)) return [];
  const keyIds = a.type === "choice" || a.type === "connector" ? [a.answerId] : a.answerIds || [];
  const want = new Set(
    keyIds.flatMap((id) => tokens(a.choices.find((c) => c.id === id)?.text)).map(stem),
  );
  if (want.size < 2) return [];
  let best = null;
  for (const p of lesson.paragraphs) {
    const have = new Set(tokens(p.text).map(stem));
    const score = [...want].filter((w) => have.has(w)).length;
    if (score >= 2 && (!best || score > best.score)) best = { id: p.id, score };
  }
  return best ? [best.id] : [];
}

/** The reread nudge: authored hint, else a pointer to a paragraph, else a generic reread cue. Never the answer. */
export function hintFor(a, lesson) {
  if (a.hint) return { text: a.hint, authored: true };
  const ids = evidenceParagraphs(a, lesson);
  if (ids.length && a.type !== "evidence")
    return {
      text: `Reread paragraph ${ids[0].replace(/^p/, "")} and look for words that match the question.`,
      authored: false,
      paragraph: ids[0],
    };
  return { text: "", authored: false };
}

/** Words from the passage a written response actually uses (words from the prompt do not count). */
export function responseEvidence(lesson, prompt, text) {
  const passage = new Set(lesson.paragraphs.flatMap((p) => tokens(p.text)).map(stem));
  const asked = new Set(tokens(prompt).map(stem));
  const used = [];
  for (const w of tokens(text)) {
    const s = stem(w);
    if (passage.has(s) && !asked.has(s) && !used.includes(w)) used.push(w);
  }
  const wordCount = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return { used, wordCount };
}

/** First sentence-start words of a paragraph, for evidence-choice labels. */
export function paragraphPreview(text, n = 9) {
  const w = String(text ?? "")
    .trim()
    .split(/\s+/);
  return w.slice(0, n).join(" ") + (w.length > n ? "…" : "");
}
