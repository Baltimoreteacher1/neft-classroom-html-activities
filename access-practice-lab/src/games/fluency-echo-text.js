// Fluency Echo text model: a passage is authored as phrases; " | " inside a phrase marks a pause that is
// also acceptable but not required. Every phrase end that is not a sentence end is a required pause.
const END = /[.!?]["”’)]*$/;

/** Words of a passage: { w, ph, end (sentence end, fixed), brk (required pause after), opt (optional pause after) }. */
export function parsePassage(phrases) {
  const words = [];
  (phrases || []).forEach((p, ph) => {
    const start = words.length;
    String(p)
      .split(/\s+/)
      .filter(Boolean)
      .forEach((t) => {
        if (t === "|") {
          if (words.length > start) words[words.length - 1].opt = true;
          return;
        }
        words.push({ w: t, ph, end: false, brk: false, opt: false });
      });
    const last = words[words.length - 1];
    if (!last || words.length === start) return;
    if (END.test(last.w)) last.end = true;
    else last.brk = true;
  });
  const tail = words[words.length - 1];
  if (tail) {
    tail.end = true;
    tail.brk = false;
  }
  return words;
}

/** The phrase as it is read aloud (optional-pause markers removed). */
export const phraseText = (p) =>
  String(p)
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** How a set of marks compares with the model: hits, missed required pauses, extra marks that split a group. */
export function scoreMarks(words, marks) {
  const set = new Set(marks);
  const need = words.filter((x) => x.brk).length;
  let hit = 0;
  let extra = 0;
  words.forEach((x, i) => {
    if (x.end) return;
    if (x.brk && set.has(i)) hit += 1;
    if (!x.brk && !x.opt && set.has(i)) extra += 1;
  });
  return { need, hit, extra, ok: hit === need && extra === 0 };
}

/** Marks that match the model: every required pause, plus any optional pause the reader already chose. */
export const modelMarks = (words, keep = []) =>
  words.map((x, i) => (x.brk || (x.opt && keep.includes(i)) ? i : -1)).filter((i) => i >= 0);
