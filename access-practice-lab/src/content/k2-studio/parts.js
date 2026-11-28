// Builders for the K-2 starter activities (grade-k.js, grade-1.js, grade-2.js). Each one returns a block of the
// Activity Studio model (lp-activity/1, src/studio/core/schema.js) with a fixed id, so the same source always makes
// the same draft. Answers are named by their TEXT, never by position, and a builder throws when the text is not one
// of the choices: a typo in a key fails the build instead of shipping a wrong answer. Pure data, no DOM.

const fail = (what) => {
  throw new Error(`k2-studio: ${what}`);
};

const ids = (list, prefix) => list.map((text, i) => ({ id: `${prefix}${i + 1}`, text }));

/** Directions read at the top of a step. */
export const directions = (id, text) => ({ id, type: "text", role: "directions", text });

/** A "tap to hear" model: the device voice reads `say` (the player shows a Play button with this label). */
export const hear = (id, label, say) => ({ id, type: "audio", label, say });

/** A short read-aloud story or text. */
export const passage = (id, title, text) => ({ id, type: "passage", title, text });

/** Picture word cards: [term, meaning, Spanish, example]. With Read aloud on, every card has its own Hear button. */
export const words = (id, items) => ({
  id,
  type: "vocab",
  items: items.map(([term, def, es, example], i) => ({ id: `v${i + 1}`, term, def, es, example })),
});

/** A ten frame (one to twenty counters; `add` is a second group drawn as squares). */
export const tenFrame = (id, count, add = null, alt = { en: "", es: "" }) => ({
  id,
  type: "diagram",
  spec: { kind: "tenframe", count, add },
  alt,
  caption: { en: "", es: "" },
});

/** A teacher-only note (never in a student copy). */
export const note = (id, text) => ({ id, type: "note", text });

const help = (h) => ({
  hint: h.hint || "",
  explanation: h.explanation || "",
  skill: h.skill || "",
});

/** One right answer, named by its text. */
export function choice(id, prompt, options, correct, h = {}) {
  const at = options.indexOf(correct);
  if (at < 0) fail(`${id}: the answer "${correct}" is not a choice`);
  if (new Set(options).size !== options.length) fail(`${id}: two choices are the same`);
  return {
    id,
    type: "question",
    format: "choice",
    prompt,
    options: ids(options, "o"),
    answer: `o${at + 1}`,
    ...help(h),
  };
}

/** Select every right answer, named by their text. */
export function multi(id, prompt, options, correct, h = {}) {
  const answers = correct.map((c) => {
    const at = options.indexOf(c);
    if (at < 0) fail(`${id}: the answer "${c}" is not a choice`);
    return `o${at + 1}`;
  });
  return {
    id,
    type: "question",
    format: "multi",
    prompt,
    options: ids(options, "o"),
    answers,
    ...help(h),
  };
}

/** Sort into groups: groups [[id, label]], items [[text, groupId]]. */
export function sort(id, prompt, groups, items, h = {}) {
  const known = new Set(groups.map(([g]) => g));
  for (const [text, g] of items) if (!known.has(g)) fail(`${id}: "${text}" has no group "${g}"`);
  return {
    id,
    type: "question",
    format: "sort",
    prompt,
    categories: groups.map(([gid, label]) => ({ id: gid, label })),
    items: items.map(([text, category], i) => ({ id: `i${i + 1}`, text, category })),
    ...help(h),
  };
}

/** Match each left card to its right card: pairs [[left, right]]. */
export const match = (id, prompt, pairs, h = {}) => ({
  id,
  type: "question",
  format: "match",
  prompt,
  pairs: pairs.map(([left, right], i) => ({ id: `p${i + 1}`, left, right })),
  ...help(h),
});

/** Put in order: `items` are listed in the CORRECT order. */
export const order = (id, prompt, items, h = {}) => ({
  id,
  type: "question",
  format: "order",
  prompt,
  items: ids(items, "i"),
  ...help(h),
});

/** Fill the blanks from a word bank: `text` marks answers as [[answer]]. */
export const bank = (id, prompt, text, h = {}) => ({
  id,
  type: "question",
  format: "blank",
  prompt,
  text,
  bank: true,
  ...help(h),
});

/** Talk or tell: an open response the teacher listens to. Never auto-graded. */
export const talk = (id, prompt, { sample, rubric, frame = "", hint = "" }) => ({
  id,
  type: "question",
  format: "short",
  kind: "explain",
  prompt,
  frame,
  hint,
  sample,
  rubric,
});

/** Topics, in the order a teacher sees them. */
export const TOPICS = Object.freeze({
  phonics: { en: "Phonics & early literacy", es: "Fonética y lectoescritura inicial", art: "🔤" },
  math: { en: "Early math", es: "Matemáticas iniciales", art: "🔢" },
  oral: {
    en: "Oral language for English learners",
    es: "Lenguaje oral para estudiantes de inglés",
    art: "💬",
  },
});

const SUBJECT = { phonics: "ELA", math: "Math", oral: "ELA" };

/**
 * One starter: catalogue fields (id, grade, topic, art, minutes, does) plus the activity itself.
 * Every starter is picture-first and read-aloud: big pictures, a Hear button on every question, the playful look.
 */
export function starter(s) {
  if (!/^[kK12]-[a-z0-9-]+$/.test(s.id)) fail(`bad id ${s.id}`);
  if (!TOPICS[s.topic]) fail(`${s.id}: unknown topic ${s.topic}`);
  const standards = s.standards.map((code) => ({ code, origin: "teacher" }));
  return Object.freeze({
    id: s.id,
    grade: s.grade,
    topic: s.topic,
    art: s.art,
    minutes: s.minutes,
    does: s.does,
    activity: {
      title: s.title,
      description: s.description,
      kind: "interactive",
      template: s.template || "match-sort",
      context: {
        grade: s.grade,
        subject: SUBJECT[s.topic],
        curriculum: "",
        objective: s.objective,
        standards,
        source: {
          origin: "teacher",
          note: "K-2 starter set, original practice written for the Activity Studio.",
        },
      },
      supports: {
        wida: s.topic === "oral" ? 1 : 0,
        visuals: true,
        spanish: s.spanish === true,
        readAloud: true,
        frames: s.topic === "oral",
        hints: true,
        chunk: false,
      },
      look: { style: "playful", accent: "" },
      options: { revise: true, shuffle: true, timer: false, workspace: "roomy", answerKey: true },
      blocks: s.blocks,
      notes: { teacher: s.teacher, misconceptions: s.misconceptions || [] },
    },
  });
}
