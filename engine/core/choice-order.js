// choice-order.js — the display order of a multiple-choice item's choices.
//
// Authored data is position-biased: across the 4,553 multiple-choice items in
// lessons/*/config.json the correct answer sits at D about half as often as at
// A, B or C (1196/1232/1439/686 on 2026-10-08). A student who has noticed that
// "it's never D" is being taught test-taking, not mathematics. The small-group
// engine already presented choices in a seeded order; this module is that
// order, shared, so every engine surface shuffles the same way.
//
// THE CONTRACT (every caller relies on it):
//   - Grading, `choiceFeedback`, `misconceptionTags`, saved answers and anything
//     reported upward stay in AUTHORED index space. Only the screen moves.
//   - The order is a pure function of (lesson, item content): a reload, a
//     resume on another day, a teacher projecting the same lesson and the
//     student at the next desk all see the same letters. That is deliberate —
//     per-student orders would make "who picked B?" meaningless in a whole-class
//     discussion, and nothing here needs secrecy, only an unbiased position.
//   - Some lists are ordered on purpose and are never moved:
//       * a choice that points at other choices ("All of the above", "None of
//         these", "Both A and B", "choice C") — moving it breaks its meaning;
//       * an all-numeric list in ascending order — item-writing convention keeps
//         numbers in order so a student reads magnitude, not position.
//   - Printed worksheets and answer keys are generated from the authored order
//     and are not affected.

const POINTS_AT_OTHER_CHOICES = [
  /\b(all|none|both|neither|any) of the (above|below|choices|options|answers)\b/i,
  /\b(all|none) of these\b/i,
  /\b(choices?|options?|answers?) [A-F]\b/i,
  // Capital single letters only: "Both b and c" names variables, not choices.
  /\b([Bb]oth|[Ee]ither|[Nn]either|[Oo]nly) [A-F] (and|or|nor) [A-F]\b/,
  /^\s*[A-F] (and|or|&) [A-F]\s*$/,
];

function parseNumeric(choice) {
  const text = String(choice ?? "")
    .replace(/[$,%\s]/g, "")
    .replace(/−/g, "-");
  return /^-?\d*\.?\d+$/.test(text) ? Number(text) : null;
}

/**
 * Is this list's order part of its meaning? True keeps the authored order.
 * @param {unknown[]} choices
 */
export function isOrderSensitive(choices) {
  if (!Array.isArray(choices) || choices.length < 2) return true;
  const text = choices.map((c) => String(c ?? ""));
  if (text.some((c) => POINTS_AT_OTHER_CHOICES.some((re) => re.test(c)))) return true;
  const nums = text.map(parseNumeric);
  if (nums.every((n) => n !== null)) {
    return nums.every(
      (n, i) => i === 0 || /** @type {number} */ (n) >= /** @type {number} */ (nums[i - 1]),
    );
  }
  return false;
}

/**
 * Deterministic permutation of 0..length-1 from a string seed (FNV-1a into a
 * Lehmer step, Fisher–Yates). Same seed, same order, on every device.
 * @param {number} length
 * @param {string} seed
 * @returns {number[]} order[slot] = authored index shown in that slot
 */
export function seededOrder(length, seed) {
  let hash = 2166136261;
  const s = String(seed ?? "");
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 48271) + 1) & 0x7fffffff;
    const j = hash % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The lesson this page belongs to, for the seed. "" off a lesson page. */
export function currentLessonKey() {
  try {
    const path = String(globalThis.location?.pathname || "");
    const m = path.match(/\/lessons\/([^/]+)/);
    return m ? m[1] : path;
  } catch {
    return "";
  }
}

// Authored text ABOUT the item that names a choice by its letter ("try option
// D first … then A, B, and C" — a 2-1 hint). Moving the choices would make the
// hint point at the wrong one, so such an item keeps its authored order.
const NAMES_A_CHOICE_LETTER = [
  /\b(choices?|options?|answers?) \(?[A-F]\)?(?![\w'])/i,
  /\b[A-F], [A-F],? (and|or) [A-F]\b/,
];

function textAbout(item) {
  const out = [];
  for (const key of ["stem", "prompt", "hint", "scaffold", "explanation"]) {
    if (typeof item?.[key] === "string") out.push(item[key]);
  }
  for (const key of ["hints", "choiceFeedback"]) {
    if (Array.isArray(item?.[key]))
      for (const v of item[key]) if (typeof v === "string") out.push(v);
  }
  return out;
}

/** Does the item's own text name a choice by letter? */
export function namesChoiceLetters(item) {
  return textAbout(item).some((t) => NAMES_A_CHOICE_LETTER.some((re) => re.test(t)));
}

/**
 * Display order for one item. `lessonKey` defaults to the current page's
 * lesson, so every surface on the page (the item itself, a remediation panel
 * naming its letter) derives the same order without passing it around.
 * @param {{ stem?: string, prompt?: string, choices?: unknown[], [k: string]: unknown }} item
 * @param {{ lessonKey?: string }} [opts]
 * @returns {number[]}
 */
export function choiceOrderFor(item, { lessonKey } = {}) {
  const choices = Array.isArray(item?.choices) ? item.choices : [];
  const identity = choices.map((_, i) => i);
  if (isOrderSensitive(choices) || namesChoiceLetters(item)) return identity;
  const lesson = lessonKey ?? currentLessonKey();
  const stem = String(item?.stem ?? item?.prompt ?? "");
  return seededOrder(choices.length, `${lesson}␟${stem}␟${choices.join("␞")}`);
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** The letter the student SEES for authored index `authoredIndex`. */
export function displayLetterFor(item, authoredIndex, opts) {
  const slot = choiceOrderFor(item, opts).indexOf(authoredIndex);
  return LETTERS[slot] || "?";
}
