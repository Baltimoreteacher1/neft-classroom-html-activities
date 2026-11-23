// Misconception-specific feedback for vocab-quest items. Pure. A wrong answer is explained by what it actually is:
// another word of the quest, a near spelling, parts in the wrong order. The right answer is never printed here.
import { hasWord, normalizeWord, wordCount } from "./quest-logic.js";

/** Levenshtein distance, capped small: only used to tell a spelling slip from a different word. */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return 4;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

const byField = (entries, field, value) => entries.find((e) => e[field] === value);

/**
 * What to say after a wrong response. Returns {text, tag}. `check` is the result of quest-logic.checkItem.
 * entries: array of every entry in the collection.
 */
export function missFeedback(item, resp, check, entries) {
  // authored misconception keyed by choice index
  if (item.choices && item.misconceptions) {
    const m = item.misconceptions.find((x) => x.pick === resp);
    if (m) return { text: m.hint, tag: m.tag, model: m.model };
  }
  if (item.choices) {
    const picked = item.choices[resp];
    if (item.kind === "meaning") {
      const other = byField(entries, "def", picked);
      return other
        ? {
            tag: `confused-with-${other.id}`,
            text: `That meaning belongs to a different word: "${other.word}". Read the word again and think about where you have seen it.`,
          }
        : { tag: "wrong-meaning", text: "That meaning does not fit this word. Try another." };
    }
    if (item.kind === "sentence-choice")
      return {
        tag: "sentence-misuse",
        text: "Read that sentence again. Does it use the word in the way the word really works?",
      };
    const other = byField(entries, "word", picked);
    if (other)
      return {
        tag: `confused-with-${other.id}`,
        text: `"${other.word}" means: ${other.def} Does that match ${item.kind === "cloze" ? "what the sentence needs" : "what the picture shows"}?`,
      };
    return { tag: "wrong-word", text: "That word does not fit. Try another." };
  }
  if (item.kind === "type-word") {
    const t = normalizeWord(resp);
    const target = normalizeWord(item.target);
    const other = entries.find((e) => normalizeWord(e.word) === t);
    if (other)
      return {
        tag: `confused-with-${other.id}`,
        text: `"${other.word}" is a real word, but it means something else: ${other.def} Read the meaning above again.`,
      };
    if (t.length > 3 && editDistance(t, target) <= 2)
      return {
        tag: "spelling",
        text: "You are close. Check each letter, say the word slowly, and try again.",
      };
    return {
      tag: "not-a-quest-word",
      text: "That is not the word yet. Read the meaning again, or use a hint.",
    };
  }
  if (item.kind === "word-parts") {
    const built = String(check.pick || "");
    return {
      tag: "parts-wrong",
      text: built
        ? `Those parts make "${built}", which does not match the meaning. Read each part's meaning, then change a part or the order.`
        : "Choose the parts again.",
    };
  }
  if (item.kind === "say-write")
    return { tag: check.tag || "sentence-incomplete", text: check.message };
  return { tag: "wrong", text: "Not yet. Try again." };
}

/** Quick pre-check shown while writing (never marks anything): word found, length. */
export function sentenceStatus(text, word) {
  return { hasWord: hasWord(text, word), words: wordCount(text) };
}
