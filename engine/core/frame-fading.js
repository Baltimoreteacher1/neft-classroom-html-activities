// frame-fading.js — withdraw the sentence frames as the student stops needing them.
//
// The Turn & Talk card has always rendered its full support block — a starter
// kernel, every sentence frame, and the word bank — for every student on every
// lesson, from the first day of the year to the last. A scaffold that never
// withdraws is not a scaffold; it is a permanent feature of the task, and the
// student who has said "I noticed that the ratio stayed the same" forty times is
// still being handed the sentence as though they could not produce it.
//
// THE RULE THAT MAKES THIS SAFE: fading changes what is SHOWN BY DEFAULT, never
// what is AVAILABLE. Every faded level keeps a "Show sentence starters" control
// that restores the full block instantly, and using it costs the student nothing
// and is never recorded as a deficit. A multilingual learner having a hard day
// gets the frames back with one tap. Anything stricter would be withdrawing
// access, not scaffolding.
//
// Progression is counted per UNIT rather than per lesson, because that is the
// span over which the language of a topic actually becomes familiar — ratio talk
// does not transfer to statistics talk, and resetting the ladder at each new unit
// is the honest model.

const STORAGE_KEY = "nt-frame-fade:v1";

export const FRAME_LEVELS = {
  full: "full", // kernel + every frame + word bank
  partial: "partial", // kernel + one frame + word bank
  light: "light", // word bank only
  none: "none", // the question, unscaffolded
};

// Turn & Talks completed in this unit -> how much support leads.
const LADDER = [
  { min: 0, level: FRAME_LEVELS.full },
  { min: 3, level: FRAME_LEVELS.partial },
  { min: 6, level: FRAME_LEVELS.light },
  { min: 10, level: FRAME_LEVELS.none },
];

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* blocked storage just means the ladder does not advance — never an error */
  }
}

/** How many Turn & Talks this device has completed in `unit`. */
export function completedInUnit(unit) {
  const key = String(unit ?? "");
  if (!key) return 0;
  return Number(readStore()[key]) || 0;
}

/** Count one completed Turn & Talk toward the unit's ladder. */
export function recordTurnAndTalk(unit) {
  const key = String(unit ?? "");
  if (!key) return 0;
  const store = readStore();
  // Bounded: the ladder tops out at 10, so there is no reason to grow past a
  // small cap, and a runaway counter cannot bloat storage.
  const next = Math.min(99, (Number(store[key]) || 0) + 1);
  store[key] = next;
  writeStore(store);
  return next;
}

/**
 * The support level to LEAD with.
 *
 * @param {object} opts
 * @param {number|string} opts.unit      the lesson's unit
 * @param {string} [opts.chosenLevel]    "level1" | "level2" | "auto" from levels.js
 */
export function resolveFrameLevel({ unit, chosenLevel = "auto" } = {}) {
  // An explicit Level 1 pick is a student (or teacher) saying they want the
  // support. The ladder does not get to overrule that.
  if (chosenLevel === "level1") return FRAME_LEVELS.full;
  // Level 2 is the enrichment path and asks for the stretch, but never goes all
  // the way to `none` on its own — the word bank is vocabulary, not a crutch.
  if (chosenLevel === "level2") return FRAME_LEVELS.light;

  const done = completedInUnit(unit);
  let level = FRAME_LEVELS.full;
  for (const rung of LADDER) if (done >= rung.min) level = rung.level;
  return level;
}

/**
 * Which pieces of the support block a level shows.
 * The renderer builds the HTML; this decides what goes in it.
 */
export function framePartsFor(level) {
  switch (level) {
    case FRAME_LEVELS.none:
      return { kernel: false, stems: 0, wordBank: false };
    case FRAME_LEVELS.light:
      return { kernel: false, stems: 0, wordBank: true };
    case FRAME_LEVELS.partial:
      return { kernel: true, stems: 1, wordBank: true };
    default:
      return { kernel: true, stems: Number.POSITIVE_INFINITY, wordBank: true };
  }
}

/** A short, non-deficit line explaining why there is less scaffolding today. */
export function fadeNoteFor(level) {
  switch (level) {
    case FRAME_LEVELS.none:
      return "You have done this a lot — try it in your own words first.";
    case FRAME_LEVELS.light:
      return "Just the words this time. You have got the sentence.";
    case FRAME_LEVELS.partial:
      return "One starter to get you going.";
    default:
      return "";
  }
}

export default resolveFrameLevel;
