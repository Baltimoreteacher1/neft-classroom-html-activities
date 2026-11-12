// The grade-band tour: for each grade choice the teacher can make, one real activity per language domain, with the
// directions a teacher follows to try it. Read by the Teacher Tour, the Start overview, the Site Guide and the family
// page, so an activity is named, linked and described once.
//
// Pure data: no DOM. Every route was opened in a real browser on 2026-11-11 and its buttons and prompt text are the
// ones quoted below (tools/access-intro-bands.test.mjs re-checks that each id, title, level and minute count matches
// content/index.json, and that each route resolves to a lab route). Grades 6-8 Speaking and Writing are the curated
// ACTIVITIES in data.js, referenced rather than copied.
import { ACTIVITY_BY_ID } from "./data.js";

/** Listening, Speaking, Reading, Writing: the order the ACCESS test and the lab home use. */
export const DOMAINS = [
  {
    id: "listening",
    name: "Listening",
    studio: "The Sound Studio",
    icon: "listening",
    cls: "d-listening",
    art: "domain-listening.svg",
    purpose: "Hear a short passage, then show what you understood.",
  },
  {
    id: "speaking",
    name: "Speaking",
    studio: "The Expression Studio",
    icon: "speaking",
    cls: "d-speaking",
    art: "domain-speaking.svg",
    purpose: "Hear a model, say your own answer aloud, and try one support.",
  },
  {
    id: "reading",
    name: "Reading",
    studio: "The Reading Atelier",
    icon: "reading",
    cls: "d-reading",
    art: "domain-reading.svg",
    purpose: "Read a short text and find the answer in it.",
  },
  {
    id: "writing",
    name: "Writing",
    studio: "The Composition Studio",
    icon: "writing",
    cls: "d-writing",
    art: "domain-writing.svg",
    purpose: "Write or revise one sentence, then check it.",
  },
];
export const DOMAIN_BY_ID = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));

const LABEL = { A: "Starting support", B: "Growing", BB: "Building support" };

// Supports a teacher can try, reused across bands. [value, label]; every label is a real button or control.
const EARLY_LISTEN = [
  ["replay", "Hearing it again"],
  ["picture", "Picture choices"],
  ["word", "Hearing one choice read aloud"],
];
const EARLY_SPEAK = [
  ["model", "Hearing the model student"],
  ["starter", "The sentence starter"],
  ["partner", "Talking with a partner instead of recording"],
  ["record", "Recording my answer"],
];
const EARLY_READ = [
  ["sentence", "Tapping a sentence to hear it"],
  ["replay", "Hearing it again"],
  ["picture", "Picture choices"],
];
const EARLY_WRITE = [
  ["starter", "Hearing the sentence starter"],
  ["draw", "Drawing first"],
  ["partner", "Saying the sentence to a partner first"],
];
const LAB_LISTEN = [
  ["listen", "Listening with “Listen”"],
  ["slower", "Slower speed"],
  ["question", "“Hear question”"],
  ["words", "Word help"],
  ["strategy", "Strategy and how sure I am"],
];
const LAB_SKILL = "If a short skill lesson opens first, press “Got it, let me try.”";
const LAB_ANSWER = "Choose an answer, say how sure you are, then press “Check my answer.”";
const LAB_NOTICE =
  "Before checking, students say how sure they are, and any help they open is saved as supported practice. That tells you who needed what.";

const early = (o) => ({ ...o });

/** Per grade choice (ids match GRADE_PICKS in bands.js): the four activities, one per domain. */
export const BAND_TOUR = {
  K: {
    adult:
      "Kindergarten is built for a grown-up to sit beside the child. Audio comes first, so no reading is needed.",
    listening: early({
      id: "gk-l-a-find-seed",
      title: "Find the Seed",
      route: "/Listening/A/gk-l-a-find-seed",
      level: LABEL.A,
      minutes: 4,
      students:
        "Children listen to a short prompt and tap the picture that matches: flower, sun or seed.",
      steps: [
        "Press “Hear it again” and listen to the prompt.",
        "Tap the picture that answers it, then press “Check.”",
        "Press the speaker button on a picture choice to hear that answer read aloud.",
      ],
      notice:
        "Every choice is a picture with its own speaker button, so a child who cannot read yet can still answer. Replay never removes a choice, and nothing is scored.",
      supports: EARLY_LISTEN,
      use: "Circle time: play one prompt for the whole group and have children point.",
    }),
    speaking: early({
      id: "gk-s-a-garden-see",
      title: "What Do You See?",
      route: "/Speaking/A/gk-s-a-garden-see",
      level: LABEL.A,
      minutes: 4,
      students: "Children look at a garden picture and say one thing they see.",
      steps: [
        "Press “Hear Lina, age 5 answer first” and listen to the model.",
        "Say your own answer aloud. The speaker button beside “I see ___.” reads the sentence starter.",
        "Press “I said my answer.” You never have to record.",
      ],
      notice:
        "A student the child’s own age models the answer first, and the sentence starter waits behind a button. The microphone is used only if someone presses “Record my answer.”",
      supports: EARLY_SPEAK,
      use: "Partner talk: each child says “I see ___” to a friend, then they switch.",
    }),
    reading: early({
      id: "gk-r-b-i-see-fish",
      title: "I See a Fish",
      route: "/Reading/B/gk-r-b-i-see-fish",
      level: LABEL.B,
      minutes: 4,
      students:
        "With a grown-up, children read the sentence “I see a fish.” and tap the matching picture.",
      steps: [
        "Tap the sentence “I see a fish.” to hear it read aloud.",
        "Tap the picture that matches: a bird, a frog or a fish.",
        "Press “Check.”",
      ],
      notice:
        "Tapping a sentence reads it aloud, and each answer is a picture with its own speaker button. The first reading is shared with a grown-up.",
      supports: EARLY_READ,
      use: "Small group: read the sentence together, then each child points to the picture.",
    }),
    writing: early({
      id: "gk-w-a-draw-garden",
      title: "Draw a Garden",
      route: "/Writing/A/gk-w-a-draw-garden",
      level: LABEL.A,
      minutes: 10,
      students:
        "Children draw a plant and copy the word “plant” with a pencil, then show a grown-up.",
      steps: [
        "Press “Hear it again” to hear the directions: draw a plant, copy the word plant.",
        "Look at the page children would print. The word to copy is shown on it.",
        "Say what you would draw, then press “I wrote it on paper.”",
      ],
      notice:
        "Young writers use a pencil on paper. The site prints the page and the child shows a grown-up, so no typed writing is collected.",
      supports: EARLY_WRITE,
      use: "Writing center: print the page, children draw and copy the word, then share with a partner.",
    }),
  },
  1: {
    adult:
      "Grade 1 is audio-first. Children can listen to every prompt, and a grown-up can help with the first one.",
    listening: early({
      id: "g1-l-a-hear-cat",
      title: "Find the Cat",
      route: "/Listening/A/g1-l-a-hear-cat",
      level: LABEL.A,
      minutes: 4,
      students: "Children listen and tap the cat from three animal pictures.",
      steps: [
        "Press “Hear it again” and listen.",
        "Tap the picture that answers it: the cat, the dog or the fish. Press “Check.”",
        "Press “Hear the story again” if you want the prompt once more.",
      ],
      notice:
        "Choices are pictures with a speaker button each, so answering never depends on reading. Replay is the only help and it never removes a choice.",
      supports: EARLY_LISTEN,
      use: "Morning routine: one prompt on the board, children tap on their own device or point.",
    }),
    speaking: early({
      id: "g1-s-a-garden-name",
      title: "Name It: Garden",
      route: "/Speaking/A/g1-s-a-garden-name",
      level: LABEL.A,
      minutes: 4,
      students: "Children look at a garden picture and name one thing they see.",
      steps: [
        "Press “Hear Mateo, age 6 answer first” and listen to the model.",
        "Say your own answer aloud. The speaker button beside “I see ___.” reads the sentence starter.",
        "Press “I said my answer.” Recording is optional.",
      ],
      notice:
        "A six-year-old model student answers first. Children can practice aloud with a partner, and nothing is uploaded.",
      supports: EARLY_SPEAK,
      use: "Turn and talk: say one thing you see in the picture, then listen to your partner.",
    }),
    reading: early({
      id: "g1-r-b-cat-mat",
      title: "The Cat Naps",
      route: "/Reading/B/g1-r-b-cat-mat",
      level: LABEL.B,
      minutes: 4,
      students: "Children read one sentence, “The cat naps on the mat.”, and tap where the cat is.",
      steps: [
        "Tap the sentence to hear it read aloud.",
        "Tap where the cat is: in a box, on the mat or up a tree.",
        "Press “Check.”",
      ],
      notice:
        "The sentence reads aloud on a tap, and the picture choices carry their own speaker buttons. Position words (in, on, up) are the language target.",
      supports: EARLY_READ,
      use: "Guided reading: read the sentence chorally, then children answer on their own.",
    }),
    writing: early({
      id: "g1-w-b-i-see",
      title: "I See Sentence",
      route: "/Writing/B/g1-w-b-i-see",
      level: LABEL.B,
      minutes: 10,
      students:
        "Children look at a garden picture and write “I see” plus one thing on a printed page.",
      steps: [
        "Press the speaker button beside “I see ___.” to hear the sentence starter.",
        "Look at the page children would print.",
        "Say your sentence aloud, then press “I wrote it on paper.”",
      ],
      notice:
        "Children write with a pencil on a printed page and show a grown-up. The sentence starter is spoken, not just shown.",
      supports: EARLY_WRITE,
      use: "Writer’s workshop: print the page, children write one sentence, then read it to a partner.",
    }),
  },
  "2-3": {
    adult: "Grades 2–3 are audio-first, with a model student who is the children’s own age.",
    listening: early({
      id: "g23-l-a-garden-helper",
      title: "Who Waters the Garden?",
      route: "/Listening/A/g23-l-a-garden-helper",
      level: LABEL.A,
      minutes: 4,
      students:
        "Students listen to a short story and tap the picture of who waters the bean plants.",
      steps: [
        "Press “Hear the story again” and listen.",
        "Tap the picture that answers “Who waters the bean plants?” Press “Check.”",
        "Press the speaker button on a picture choice to hear that answer read aloud.",
      ],
      notice:
        "The story can be replayed any time and every choice can be heard. Students show who did the action, a core listening skill, without reading.",
      supports: EARLY_LISTEN,
      use: "Center rotation: students listen with headphones and answer, then tell a partner how they knew.",
    }),
    speaking: early({
      id: "g23-s-a-garden-see",
      title: "What Do You See in the Garden?",
      route: "/Speaking/A/g23-s-a-garden-see",
      level: LABEL.A,
      minutes: 4,
      students: "Students look at a garden picture and tell one thing they see.",
      steps: [
        "Press “Hear Leo, age 8 answer first” and listen to the model.",
        "Say your own answer aloud. The speaker button beside “I see ___.” reads the sentence starter.",
        "Press “I said my answer.” Recording is optional.",
      ],
      notice:
        "A model student answers first and the starter waits behind a button. Practicing aloud with a partner works just as well as recording.",
      supports: EARLY_SPEAK,
      use: "Partner talk: take turns naming and describing, then add one more detail.",
    }),
    reading: early({
      id: "g23-r-b-library-card",
      title: "Leo’s Library Card",
      route: "/Reading/B/g23-r-b-library-card",
      level: LABEL.B,
      minutes: 4,
      students:
        "Students read four short sentences about Leo’s library card and tap what he can do with it.",
      steps: [
        "Tap any sentence to hear it read aloud.",
        "Tap the picture that answers “What can Leo do with his card?”",
        "Press “Check.”",
      ],
      notice:
        "Students read a short passage and find a reason in it. Every sentence reads aloud on a tap, so decoding does not hide comprehension.",
      supports: EARLY_READ,
      use: "Reading group: read the passage together, then answer the question on your own.",
    }),
    writing: early({
      id: "g23-w-a-favorite-fruit",
      title: "My Favorite Fruit",
      route: "/Writing/A/g23-w-a-favorite-fruit",
      level: LABEL.A,
      minutes: 10,
      students:
        "Students draw their favorite fruit and write one sentence: “I like ___ because ___.”",
      steps: [
        "Press the speaker button beside “I like ___ because ___.” to hear the sentence starter.",
        "Look at the page students would print.",
        "Say your sentence aloud, then press “I wrote it on paper.”",
      ],
      notice:
        "The frame “I like ___ because ___” gives every writer the same support, and students write on paper and show an adult.",
      supports: EARLY_WRITE,
      use: "Exit ticket: students write the sentence, then trade papers and underline the word “because.”",
    }),
  },
  "4-5": {
    adult: "",
    listening: {
      id: "g35-l-a-classroom-place",
      title: "Where Does the Book Go?",
      route: "/Listening/A/g35-l-a-classroom-place",
      level: LABEL.A,
      minutes: 4,
      students:
        "Students look at a classroom picture, listen to a direction, and choose the place named.",
      steps: [LAB_SKILL, "Press “Listen.” Try “Slower,” then “Hear question.”", LAB_ANSWER],
      notice: LAB_NOTICE,
      supports: LAB_LISTEN,
      use: "Beginning of class: play one direction, students choose, then follow it in the room.",
    },
    speaking: {
      id: "class-garden",
      title: "Our Class Garden",
      route: "/voice/ladder/class-garden",
      level: "Picture speaking ladder",
      minutes: 6,
      students:
        "Students climb three speaking steps on one garden picture: name things, tell about them, then say more.",
      steps: [
        "Press “Hear the question,” then “Hear Pablo first.”",
        "Say your own answer aloud. “Show a sentence frame” is there if you want it.",
        "Press “I said it out loud.” Recording is optional.",
      ],
      notice:
        "Students hear a model before they answer, and the sentence frame stays behind a button until they ask for it. These are practice steps, not levels.",
      supports: EARLY_SPEAK.map(([v, l]) =>
        v === "starter" ? ["frame", "The sentence frame"] : [v, l],
      ),
      use: "Partner warm-up: each student says the Step 1 answer to a partner, who listens for one detail.",
    },
    reading: {
      id: "g35-r-a-garden",
      title: "Amara’s Garden",
      route: "/Reading/A/g35-r-a-garden",
      level: LABEL.A,
      minutes: 5,
      students:
        "Students read a short passage with a picture and find the key detail that answers a question.",
      steps: [
        LAB_SKILL,
        "Press “Read Passage Aloud,” then click one sentence to hear just that sentence. Try “Highlight” or “Pin evidence.”",
        LAB_ANSWER,
      ],
      notice:
        "Students can mark the text (Highlight, Underline, Pin evidence) and open Word help, and the Spanish cognates are one tap away. Help they use is saved as supported practice.",
      supports: [
        ["aloud", "Read Passage Aloud"],
        ["mark", "Highlight, Underline or Pin evidence"],
        ["words", "Word help"],
        ["strategy", "Strategy and how sure I am"],
      ],
      use: "Small group: read together, mark one piece of evidence, then answer.",
    },
    writing: {
      id: "lu35-explain-plants",
      title: "Language Upgrade Lab: Plants",
      route: "/scaffold/language-upgrade?item=lu35-explain-plants",
      level: "Language builders",
      minutes: 5,
      students:
        "Students revise the plain sentence “Plants need stuff.” by adding a detail, an exact word and a connector.",
      steps: [
        "Choose “Start with this help” (a frame and a word bank) or “On my own.”",
        "Write a better version of “Plants need stuff.”",
        "Press “Check my work” and fix one thing it names.",
      ],
      notice:
        "The check names what to fix (a detail, an exact word, a connector) without writing the answer, and students can revise as many times as they like. It looks at words, not meaning.",
      supports: [
        ["frame", "Start with this help (frame and word bank)"],
        ["own", "On my own"],
        ["more", "Ask for more help"],
      ],
      sample: "Plants need sunlight and water because they use them to make food.",
      use: "Exit ticket: every student revises one sentence, then partners compare the exact word each chose.",
    },
  },
  "6-8": {
    adult: "",
    listening: {
      id: "main-idea-match-b",
      title: "Recycling Benefits: Listen for the Main Idea",
      route: "/Listening/B/main-idea-match-b",
      level: LABEL.BB,
      minutes: 6,
      students: "Students listen to a short teacher statement and choose what it is mostly about.",
      steps: [LAB_SKILL, "Press “Listen.” Try “Slower,” then “Hear question.”", LAB_ANSWER],
      notice: LAB_NOTICE,
      supports: LAB_LISTEN,
      use: "Mini-lesson: play the statement, students choose the main idea, then say the detail that proves it.",
    },
    speaking: null, // filled below from the curated ACTIVITIES in data.js
    reading: {
      id: "read-main-idea",
      title: "Saving Water: Find the Main Idea",
      route: "/Reading/A/read-main-idea",
      level: LABEL.A,
      minutes: 8,
      students: "Students read a short informational text and choose what it is mostly about.",
      steps: [
        LAB_SKILL,
        "Read the short text. Open “Word help” for any word you want to check.",
        LAB_ANSWER,
      ],
      notice: LAB_NOTICE,
      supports: [
        ["words", "Word help"],
        ["strategy", "Strategy and how sure I am"],
        ["skill", "The short skill lesson"],
      ],
      use: "Literacy block: read, choose the main idea, then underline the sentence that proves it.",
    },
    writing: null, // filled below
  },
};

// Grades 6-8 Speaking and Writing are the curated activities the rest of the introduction already uses.
const hallway = ACTIVITY_BY_ID.hallway;
const upgrade = ACTIVITY_BY_ID.upgrade;
BAND_TOUR["6-8"].speaking = {
  id: hallway.id,
  title: hallway.name,
  route: hallway.route,
  level: "Picture speaking ladder",
  minutes: hallway.minutes,
  students: hallway.does,
  steps: [
    "Look at the hallway picture and name four things you see (Step 1).",
    "Go to Step 3. Press “Hear Lina first.”",
    "Say your own answer aloud. “Show a sentence frame” helps if you want it.",
  ],
  notice:
    "Students hear a model student before they answer, and the sentence frame stays behind a button until they ask for it.",
  supports: EARLY_SPEAK.map(([v, l]) =>
    v === "starter" ? ["frame", "The sentence frame"] : [v, l],
  ),
  use: hallway.classroomUse,
};
BAND_TOUR["6-8"].writing = {
  id: upgrade.id,
  title: upgrade.name,
  route: upgrade.route,
  level: "Language builders",
  minutes: upgrade.minutes,
  students: upgrade.does,
  steps: [
    "Choose “Start with this help” (a frame and a word bank) or “On my own.”",
    "Write a better version of “Phones in class are bad.”",
    "Press “Check my work” and fix one thing it names.",
  ],
  notice:
    "The check names what to fix (a detail, an exact word, a connector) without writing the answer, and students can revise as many times as they like. It looks at words, not meaning.",
  supports: [
    ["frame", "Start with this help (frame and word bank)"],
    ["own", "On my own"],
    ["more", "Ask for more help"],
  ],
  sample: "Phones in class can distract students because they stop paying attention.",
  use: upgrade.classroomUse,
};

/** The activity for one grade choice and domain, with its domain attached. `pick` is a GRADE_PICKS id. */
export function tourActivity(pick, domainId) {
  const band = BAND_TOUR[pick];
  const a = band?.[domainId];
  return a ? { ...a, domain: DOMAIN_BY_ID[domainId], pick } : null;
}

/** The four activities for a grade choice, in domain order. */
export const tourActivities = (pick) =>
  DOMAINS.map((d) => tourActivity(pick, d.id)).filter(Boolean);

/** The lab route for an activity: a `grades` value so it opens in the right grade, plus any extra query. */
export function tourRoute(a, extra = {}) {
  const [path, q = ""] = a.route.split("?");
  const params = new URLSearchParams(q);
  params.set("grades", a.pick);
  for (const [k, v] of Object.entries(extra)) params.set(k, v);
  return `${path}?${params}`;
}
