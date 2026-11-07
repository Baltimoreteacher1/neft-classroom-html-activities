// Reading Ladder reading tools: the same text at three levels with a Spanish parallel version (Newsela model),
// tap-any-word help with a "words I know" count (LingQ model). Pure logic; views/ladder-tools.js draws it.
//
// Rules: the questions and answer choices are never translated or levelled; the Spanish parallel version is
// shown only when a teacher has turned it on for this device; any of these tools used during a round marks
// the round as read with help; none of them is offered during the placement staircase.

export const LEVELS = ["easier", "on", "richer"];
export const KNOWN_KEY = "accessPracticeLab:v1:words-known";
export const TEACHER_KEY = "accessPracticeLab:v1:teacher-controls";
export const MAX_KNOWN = 3000;

/** The text to show for a passage at a level; unknown levels and missing versions fall back to the passage. */
export function textAt(passage, leveled, level) {
  const v = leveled?.[passage.id];
  if (level === "easier" && v?.easier) return v.easier;
  if (level === "richer" && v?.richer) return v.richer;
  return passage.text;
}

export const spanishOf = (passage, leveled) => leveled?.[passage.id]?.es || "";

/** Words of a text with offsets, for tap-a-word. Letters plus inner apostrophes and hyphens. */
export function wordsOf(text) {
  return [...String(text || "").matchAll(/[\p{L}]+(?:['’-][\p{L}]+)*/gu)].map((m) => ({
    word: m[0],
    start: m.index,
    end: m.index + m[0].length,
  }));
}

/** The form a word is stored and looked up under. */
export const wordKey = (w) =>
  String(w || "")
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/'s$/, "");

/** A glossary entry for a tapped word: exact, or the singular / base form of a simple -s, -es, -ed, -ing word. */
export function lookup(glossary, word) {
  const terms = glossary?.terms || [];
  const k = wordKey(word);
  const tries = [
    k,
    k.replace(/es$/, ""),
    k.replace(/s$/, ""),
    k.replace(/ed$/, ""),
    k.replace(/ing$/, ""),
    k.replace(/ies$/, "y"),
  ];
  for (const t of tries) {
    const hit = terms.find((e) => e.term?.toLowerCase() === t);
    if (hit) return hit;
  }
  return null;
}

/** Saved known words, read defensively: a sorted unique list of keys. */
export function normalizeKnown(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return [
    ...new Set(
      list.filter((w) => typeof w === "string" && /^[\p{L}'-]{1,40}$/u.test(w)).map(wordKey),
    ),
  ]
    .sort()
    .slice(0, MAX_KNOWN);
}

export function toggleKnown(known, word) {
  const k = wordKey(word);
  return normalizeKnown(known.includes(k) ? known.filter((w) => w !== k) : [...known, k]);
}

/** How many different words of a text the learner has marked known. */
export function knownIn(text, known) {
  const set = new Set(known);
  const words = new Set(wordsOf(text).map((w) => wordKey(w.word)));
  return { known: [...words].filter((w) => set.has(w)).length, total: words.size };
}

/**
 * Teacher controls on this device, from a teacher link: `?spanish=on|off` turns the Spanish parallel version on
 * or off. Returns the controls to save, or null when the URL carries none.
 */
export function controlsFromUrl(search, current = {}) {
  const v = new URLSearchParams(search).get("spanish");
  if (v !== "on" && v !== "off") return null;
  return { ...current, ladderSpanish: v === "on" };
}

export const normalizeControls = (raw) => ({
  ladderSpanish: Boolean(raw && typeof raw === "object" && raw.ladderSpanish === true),
});
