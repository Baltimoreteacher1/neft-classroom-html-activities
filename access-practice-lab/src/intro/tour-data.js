// Teacher tour (/start/tour) content: the four parts, the three classroom goals, the words the coach says inside a
// real activity, and how a skill and a support choice become one real activity from content/index.json.
// Pure data and pure functions, no DOM, so tools/access-intro-tour.test.mjs can check every part of it.
import { normalizeBand } from "../bands.js";
import { BAND_TOUR, DOMAIN_BY_ID, DOMAINS } from "./tour-bands.js";

export const PARTS = [
  { n: 1, id: "skill", name: "Pick a skill" },
  { n: 2, id: "try", name: "Try it as a student" },
  { n: 3, id: "class", name: "Use it with your class" },
];

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
const LOOP_SAY = {
  final: "Next: use it with your class",
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
  again: {
    title: "Check again and see success",
    body: "Choose the answer you now think is right, then check. This is what students see when they get there.",
    fallback: "Choose again and check, or press Skip to move on.",
  },
  end: {
    title: "That is the student loop",
    body: "Try, get guidance, revise. Next, choose how much help your students get and share it.",
  },
};

const SKILL_INTRO = {
  title: "Try this activity as a student would",
  body: "This is the real activity your students open. I’ll point to one part at a time.",
  why: "Trying it yourself first shows you what students see, where they get help, and what feedback sounds like.",
};

const SPEAK_SAY = {
  final: "Next: use it with your class",
  intro: SKILL_INTRO,
  skill: LOOP_SAY.skill,
  question: {
    title: "Hear the question",
    body: "Students hear the question first, so reading is never the barrier. Press the highlighted button.",
    fallback: "Students listen to the question before they answer. Press Next.",
  },
  starters: {
    title: "Sentence starters wait behind a button",
    body: "Open it to see the starters and helpful words. Students choose when they need them.",
  },
  say: {
    title: "Say the answer out loud",
    body: "Press “Record my answer” and answer as a student would, or say it aloud. The microphone asks permission first and recordings stay on this device.",
    why: "If the microphone is blocked, students practice aloud with a partner and keep going. Nothing is scored.",
    fallback: "Say your answer out loud, then press Next.",
  },
  check: {
    title: "Students check their own answer",
    body: "They tick what their answer did: named the topic, gave details, explained their thinking. Tick one.",
  },
  end: {
    title: "That is a speaking turn",
    body: "Hear it, plan it, say it, check it. Next, choose how much help your students get and share it.",
  },
};

const WRITE_SAY = {
  final: "Next: use it with your class",
  intro: SKILL_INTRO,
  skill: LOOP_SAY.skill,
  directions: LOOP_SAY.directions,
  write: {
    title: "Write an answer",
    body: "Type one or two sentences, as a student would. Starters and word help are above if you want them.",
    fallback: "Write in the box, then press Next.",
  },
  check: {
    title: "Check the writing",
    body: "Press the highlighted button. The check names what to add or fix.",
    fallback: "Press the check button, then press Next.",
  },
  feedback: {
    title: "This is the feedback students get",
    body: "It names one thing to add or fix, like a detail or a connector, and never gives a score.",
    why: "The check looks at words, not meaning, so it points students back to their own sentence to revise.",
  },
  revise: {
    title: "Revise and check again",
    body: "Change one thing the feedback named, then press the check button again.",
    fallback: "Revise, check again, then press Next.",
  },
  paper: {
    title: "Write on paper",
    body: "Younger writers draw and write on paper, then show an adult. Press the highlighted button when it is done.",
    fallback: "Press Next when the writing is done.",
  },
  end: {
    title: "That is a writing turn",
    body: "Plan, write, check, revise. Next, choose how much help your students get and share it.",
  },
};

/** The guide's words in Part 2 for each kind of activity (coach/activity-steps.js stepsFor). */
export const TEACHER_SAY = { loop: LOOP_SAY, speaking: SPEAK_SAY, writing: WRITE_SAY };

/** What Mr. Neft says at the top of each part. */
export const NEFT_SAYS = {
  1: "Hi, I’m Mr. Neft, your tour guide. Which language skill would you like your students to practice? Pick one and I’ll show you the real activity.",
  2: (skill) =>
    `Here is a real ${skill} activity. Try it the way a student would. I’ll stand right next to it and show you one thing at a time.`,
  3: "Nice work. Now choose how much help your students get. Your link, QR code and a printable card are ready right below.",
};
