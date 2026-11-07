// Oral reading: align the words a speech recognizer heard with the words of a passage, so the page can highlight
// "words you read". Students see a count of words read, never a rate or a clock; the aligned counts (matched and
// skipped) feed the teacher view only. Alignment is recomputed from the whole transcript each time, so a recognizer
// that revises an earlier word never leaves a stale highlight.

export const WORD_RE = /[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu;
const norm = (w) => String(w).toLowerCase().replace(/’/g, "'");

/** The passage as words, each with its character span (for markup) and a normalized form. */
export function passageWords(text) {
  return [...String(text || "").matchAll(WORD_RE)].map((m) => ({ word: m[0], norm: norm(m[0]), at: m.index, end: m.index + m[0].length }));
}

/** Words of a transcript, normalized. */
export const spokenWords = (text) => [...String(text || "").matchAll(WORD_RE)].map((m) => norm(m[0]));

/**
 * Greedy forward alignment with a small lookahead: each heard word is matched to the next passage word, or to one of the
 * next `look` words (the reader skipped some). Heard words that match nothing nearby (a repeat, a recognizer slip) are ignored.
 * @returns {{ state: ("read"|"skipped"|"todo")[], matched: number, skipped: number, extra: number, pointer: number }}
 */
export function alignReading(words, heard, { look = 3 } = {}) {
  const state = new Array(words.length).fill("todo");
  let ptr = 0;
  let extra = 0;
  for (const h of heard) {
    let hit = -1;
    for (let k = 0; k <= look && ptr + k < words.length; k++)
      if (words[ptr + k].norm === h) {
        hit = ptr + k;
        break;
      }
    if (hit < 0) {
      extra += 1;
      continue;
    }
    for (let i = ptr; i < hit; i++) state[i] = "skipped";
    state[hit] = "read";
    ptr = hit + 1;
  }
  return {
    state,
    matched: state.filter((s) => s === "read").length,
    skipped: state.filter((s) => s === "skipped").length,
    extra,
    pointer: ptr,
  };
}

/** Teacher-view accuracy: words read among the words the reader reached. Null before any word is read. */
export function readingAccuracy(a) {
  const reached = a.matched + a.skipped;
  return reached ? Math.round((a.matched / reached) * 100) : null;
}

/** Passage markup: one span per word, marked by state. Inter-word text is kept as is. */
export function highlightedPassage(text, states) {
  const words = passageWords(text);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = "";
  let pos = 0;
  words.forEach((w, i) => {
    out += esc(text.slice(pos, w.at));
    out += `<span class="rd-word is-${states?.[i] || "todo"}" data-rd="${i}">${esc(w.word)}</span>`;
    pos = w.end;
  });
  return out + esc(text.slice(pos));
}
