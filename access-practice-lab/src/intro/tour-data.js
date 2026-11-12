// Teacher tour (/start/tour) content: the four parts, the three classroom goals, the words the coach says inside a
// real activity, and how a skill and a support choice become one real activity from content/index.json.
// Pure data and pure functions, no DOM, so tools/access-intro-tour.test.mjs can check every part of it.
import { normalizeBand } from "../bands.js";
import { BAND_TOUR, DOMAIN_BY_ID, DOMAINS } from "./tour-bands.js";

export const PARTS = [
  { n: 1, id: "goal", name: "Choose a goal" },
  { n: 2, id: "try", name: "Try an activity" },
  { n: 3, id: "prepare", name: "Prepare practice" },
  { n: 4, id: "classroom", name: "Take it to class" },
];

/** The four answers to "What would you like to do with your students?". `show` is the recommended path. */
export const GOALS = [
  {
    id: "show",
    icon: "sparkle",
    name: "Show me how it works",
    detail:
      "New here? Try one activity as a student, then set one up for your class. About 8 minutes.",
    recommended: true,
  },
  {
    id: "find",
    icon: "search",
    name: "Find a practice activity",
    detail: "Pick a skill and the help students need, and see the activity they will get.",
  },
  {
    id: "share",
    icon: "launch",
    name: "Prepare and share student practice",
    detail: "Leave with a student link, a QR code and a printable plan.",
  },
  {
    id: "understand",
    icon: "evidence",
    name: "Understand student work and next steps",
    detail: "See the feedback students get, how they revise, and where their work is saved.",
  },
];
export const GOAL_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g]));
export const goalOf = (id) => GOAL_BY_ID[id] || GOAL_BY_ID.show;

/**
 * Part 2 activity for each grade choice: one with an answer, a check, feedback and a second try. K–3 use the
 * picture-choice listening activity (audio first, no reading needed); Grades 4–8 use the reading activity.
 */
const TRY_DOMAIN = {
  K: "listening",
  1: "listening",
  "2-3": "listening",
  "4-5": "reading",
  "6-8": "reading",
};
export const tryDomain = (pick) => TRY_DOMAIN[pick] || "reading";

/** What each support choice means, in plain words. Keys are the lab's level letters. */
export const SUPPORT_PLAIN = {
  A: "The most help: pictures, read-aloud, sentence starters and shorter texts.",
  B: "Some help: models and word help are there when students ask for them.",
  C: "Less help: longer texts and more open answers, with help still one tap away.",
};
export const SUPPORT_NOTE =
  "These are classroom support choices, not WIDA proficiency levels or scores. Change them whenever a student needs more or less help.";

/** One sentence per skill for Part 3's choice, said the way a teacher would. */
export const SKILL_PLAIN = {
  listening: "Students hear a short talk or direction and show what they understood.",
  speaking: "Students hear a model, then say or record their own answer.",
  reading: "Students read a short text and find the answer in it.",
  writing: "Students write their own sentences and check them against a short list.",
};

/** A lesson-use idea for the chosen activity when it is not one of the tour's own (those carry their own `use`). */
export const USE_BY_SKILL = {
  listening:
    "Warm-up: play it for the whole class, students choose on their own, then share the detail that proved it.",
  speaking:
    "Partner talk: each student answers once to a partner, then records the better version.",
  reading: "Small group: read together, point to the sentence that proves the answer, then check.",
  writing: "Exit ticket: students write, check their work, and fix one thing before they leave.",
};

/**
 * The item type a preview should show: the student's own words for speaking and writing (not a multiple-choice
 * warm-up), and a single answer with a check and feedback for listening and reading.
 */
const PREFER = {
  listening: "multipleChoice",
  reading: "multipleChoice",
  speaking: "constructed",
  writing: "constructed",
};

/**
 * The support choices content/index.json offers for a grade choice and skill: [{ level, name, count }].
 * Kindergarten has two; the other bands have three.
 */
export function supportOptions(index, pick, skill) {
  const band = normalizeBand(pick);
  const domain = DOMAIN_BY_ID[skill]?.name;
  const levels = index?.bands?.[band]?.domains?.[domain]?.levels || {};
  return Object.entries(levels)
    .filter(([, lv]) => lv?.tier && lv.activities?.length)
    .map(([level, lv]) => ({ level, name: lv.tier.name, count: lv.activities.length }));
}

/**
 * The one activity a teacher gets for a grade choice, skill and support level, read from content/index.json.
 * The tour's own activity wins when it is that level's (so every teacher page names the same one); otherwise the
 * first activity of that level of the preferred type (PREFER), else the first one.
 */
export function chooseActivity(index, pick, skill, level) {
  const band = normalizeBand(pick);
  const domain = DOMAIN_BY_ID[skill];
  if (!band || !domain) return null;
  const lv = index?.bands?.[band]?.domains?.[domain.name]?.levels?.[level];
  if (!lv?.activities?.length) return null;
  const rows = lv.activities;
  const curated = BAND_TOUR[pick]?.[skill];
  const prefix = `/${domain.name}/${level}/`;
  const own = curated?.route?.startsWith(prefix) && rows.find((r) => r[0] === curated.id);
  const row =
    own || (rows.find((r) => r[2] === PREFER[skill])) || rows[0];
  const [id, title, , focus, minutes] = row;
  return {
    id,
    title,
    focus: focus || "",
    minutes: Number(minutes) || 5,
    route: `${prefix}${id}`,
    level,
    support: lv.tier.name,
    domain,
    pick,
    use: own ? curated.use : USE_BY_SKILL[skill],
  };
}

/** The lab route for an activity, opened in the right grades (plus any extra query such as frame=1). */
export function activityRoute(a, extra = {}) {
  const [path, q = ""] = a.route.split("?");
  const params = new URLSearchParams(q);
  params.set("grades", a.pick);
  for (const [k, v] of Object.entries(extra)) params.set(k, v);
  return `${path}?${params}`;
}

/** Valid skill id, or "". */
export const skillOf = (id) => (DOMAINS.some((d) => d.id === id) ? id : "");

/** The coach's words in Part 2 for teachers. `final` is the last step's button. */
export const TEACHER_SAY = {
  final: "Next: prepare practice",
  intro: {
    title: "Try this activity as a student would",
    body: "This is the real activity your students open. I’ll point to one part at a time.",
    why: "Trying it yourself first shows you what students see, where they get help, and what feedback sounds like.",
  },
  skill: {
    title: "Start with the skill lesson",
    body: "Many activities open with a two-minute skill lesson and a worked model. Press “Got it, let me try.”",
    fallback: "This activity starts straight with the task. Press Next.",
  },
  directions: {
    title: "Directions can be heard",
    body: "Students read the directions, or press “Hear directions” to listen. Try it now.",
    why: "Hearing the directions keeps the language demand on the task, not on decoding the instructions.",
    fallback: "Students can listen to the directions before they start. Press Next.",
  },
  answer: {
    title: "Choose an answer",
    body: "Pick one, just as a student would. Choose a wrong one on purpose to see the guidance.",
    fallback: "Answer the task in the activity, then press Next.",
  },
  sure: {
    title: "Say how sure you are",
    body: "Before checking, students say how sure they are. Choose one.",
    why: "A wrong answer marked “Sure” and a right answer marked “Guessing” both tell you who to talk to next.",
  },
  check: {
    title: "Check the answer",
    body: "Press the check button. Students get guidance right away, never a score.",
    fallback: "Press the check button in the activity, then press Next.",
  },
  feedback: {
    title: "This is the guidance students receive",
    body: "It says what to look at again without giving the answer away.",
    rightTitle: "This is what a correct answer looks like",
    right:
      "Students see why their answer fits and one next step. Choose a wrong answer next time to see the “Not yet” guidance.",
    why: "Feedback that points back to the text builds the skill; showing the answer would end the thinking.",
    fallback: "Guidance appears under the answer after students check. Press Next.",
  },
  retry: {
    title: "Now see how they try again",
    body: "Press “Try again.” The choices come back so students can revise.",
    early: "All the pictures stay. Students listen again and choose once more. Try it now.",
  },
  end: {
    title: "That is the student loop",
    body: "Try, get guidance, revise. Next, choose what your students will practice and how much help they get.",
  },
};

/** Part 3 preview words per skill: the one control that makes each skill different. */
export const PREVIEW_SAY = {
  speaking: {
    title: "Students speak their own answer",
    body: "Students hear a model, then record or say their answer aloud. The microphone asks permission first; if it is blocked, students practice aloud with a partner and keep going.",
  },
  writing: {
    title: "Students write and revise",
    body: "Students write their own sentences, check them, and fix what the check names. The check looks at words, not meaning.",
  },
  listening: {
    title: "Students listen first",
    body: "Students press play, can slow the audio down, then answer. Nothing is timed.",
  },
  reading: {
    title: "Students read and prove it",
    body: "Students read, open word help when they need it, then answer and check.",
  },
};
