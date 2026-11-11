// Sample responses for the planning card, so a teacher can begin without writing from scratch. They are written for the
// curated activities in data.js and for every grade's four activities in tour-bands.js, and never claim more than those
// activities do (each support and button named here was read in the running page on 2026-11-11).
const s = (practice, produce, support, look, retry) => ({ practice, produce, support, look, retry });
const EARLY_LISTEN_SUPPORT = "“Hear it again,” “Hear the story again” and the “Hear:” button beside each picture.";
const EARLY_LISTEN_RETRY = "pressing “Hear the story again” and choosing once more; every choice stays on the page.";
const LAB_LISTEN_SUPPORT = "“Slower,” “Hear question” and Word help.";
const earlySpeak = (model) =>
  s(
    "naming one thing in a picture aloud.",
    "one sentence: “I see ___.”",
    `the model student (“Hear ${model} answer first”) and the sentence starter.`,
    "a whole sentence with “I see,” not just one word.",
    "saying it again with one more word, such as a color.",
  );

/** Planning-card samples for every grade's four activities (ids from BAND_TOUR). */
const BAND_SAMPLES = {
  "gk-l-a-find-seed": s(
    "listening to a short prompt and choosing the matching picture.",
    "a tap on the picture that answers: the seed.",
    EARLY_LISTEN_SUPPORT,
    "whether the child listens all the way through before tapping.",
    EARLY_LISTEN_RETRY,
  ),
  "gk-s-a-garden-see": earlySpeak("Lina, age 5"),
  "gk-r-b-i-see-fish": s(
    "reading a short sentence with a grown-up and matching it to a picture.",
    "a tap on the picture that matches “I see a fish.”",
    "tapping the sentence to hear it read aloud.",
    "pointing to each word while the sentence is read.",
    "tapping the sentence to hear it again, then choosing once more.",
  ),
  "gk-w-a-draw-garden": s(
    "drawing a plant and copying the word “plant.”",
    "a drawing with the word copied under it.",
    "the printed page with the word to copy, and “Hear it again” for the directions.",
    "letters copied in order, left to right.",
    "saying what they drew, then adding one detail to the drawing.",
  ),
  "g1-l-a-hear-cat": s(
    "listening and choosing the matching animal picture.",
    "a tap on the cat.",
    EARLY_LISTEN_SUPPORT,
    "whether the child listens all the way through before tapping.",
    EARLY_LISTEN_RETRY,
  ),
  "g1-s-a-garden-name": earlySpeak("Mateo, age 6"),
  "g1-r-b-cat-mat": s(
    "reading a sentence and finding where something is (in, on, up).",
    "a tap on the picture that shows where the cat is.",
    "tapping the sentence to hear it read aloud.",
    "the position word “on.”",
    "reading the sentence again and pointing to the word that tells where.",
  ),
  "g1-w-b-i-see": s(
    "writing a sentence that starts with “I see.”",
    "one sentence on the printed page: “I see ___.”",
    "“Hear the sentence starter” and the printed page.",
    "“I see” plus one thing, with a capital letter and a period.",
    "reading the sentence aloud and adding one describing word.",
  ),
  "g23-l-a-garden-helper": s(
    "listening to a short story and showing who did the action.",
    "a tap on the person who waters the bean plants.",
    EARLY_LISTEN_SUPPORT,
    "whether students can tell a partner how they knew.",
    EARLY_LISTEN_RETRY,
  ),
  "g23-s-a-garden-see": earlySpeak("Leo, age 8"),
  "g23-r-b-library-card": s(
    "reading a short passage and finding a reason in it.",
    "a tap on what Leo can do with his card.",
    "tapping any sentence to hear it read aloud.",
    "the sentence that proves the answer: “Now he can borrow books.”",
    "rereading the sentences and pointing to the proof.",
  ),
  "g23-w-a-favorite-fruit": s(
    "giving an opinion with a reason.",
    "one sentence on paper: “I like ___ because ___.”",
    "“Hear the sentence starter,” and drawing the fruit first.",
    "the word “because” with a reason after it.",
    "adding a second reason with “and.”",
  ),
  "g35-l-a-classroom-place": s(
    "following a spoken direction with place words.",
    "the place the direction names.",
    LAB_LISTEN_SUPPORT,
    "place words such as “under,” and how sure students say they are.",
    "reading “One next step,” listening again and pressing “Try again.”",
  ),
  "class-garden": s(
    "naming, describing and explaining with one picture.",
    "three answers: three things, what the children are doing, and how they help the plants.",
    "the model students and “Show a sentence frame.”",
    "a reason with “because” or “so” in Step 3.",
    "saying Step 3 again with one more detail.",
  ),
  "g35-r-a-garden": s(
    "finding the key detail that answers a question.",
    "the answer, with one sentence pinned as evidence.",
    "“Read Passage Aloud,” Highlight and Word help.",
    "one sentence pinned as evidence with “Pin evidence.”",
    "finding the question's key word again and checking once more.",
  ),
  "lu35-explain-plants": s(
    "making a plain sentence clearer with a detail, an exact word and a connector.",
    "one improved sentence about what plants need.",
    "the frame and word bank (“Start with this help”).",
    "an exact word such as “sunlight” and a connector such as “because.”",
    "pressing “Check my work” and fixing the one thing it names.",
  ),
  "main-idea-match-b": s(
    "listening for the main idea of a short statement.",
    "the choice that says what the statement is mostly about.",
    LAB_LISTEN_SUPPORT,
    "students naming one detail that supports the main idea.",
    "listening once more and asking “What is this mostly about?”",
  ),
  "read-main-idea": s(
    "finding the main idea of a short informational text.",
    "the main idea, and the sentence that proves it.",
    "Word help and the short skill lesson.",
    "whether students reject a single small fact as the main idea.",
    "rereading and checking that the other sentences explain the choice.",
  ),
};

export const PLAN_SAMPLES = {
  hallway: {
    practice: "explaining a change and giving a reason, aloud.",
    produce: "one change the school could make, one reason, and one example.",
    support: "the sentence frame and a partner to rehearse with.",
    look: "the word “because” and whether the reason fits the change.",
    retry: "adding one example that starts with “For example.”",
  },
  board: {
    practice: "taking a position and backing it with evidence from a table.",
    produce: "a two-minute speech with two numbers from the table.",
    support: "the word bank, and a rehearsal before speaking.",
    look: "two numbers from the table and one answer to a concern.",
    retry: "saying it again with a stronger first sentence.",
  },
  upgrade: {
    practice: "making a plain sentence clearer with an exact word and a connector.",
    produce: "one improved sentence.",
    support: "the frame and word bank (“Start with this help”).",
    look: "an exact word instead of “bad,” and a connector such as “because.”",
    retry: "pressing “Check my work” and fixing the one thing it names.",
  },
  paragraph: {
    practice: "writing a paragraph that takes a position and uses evidence.",
    produce: "one paragraph with two reasons and an answer to the other side.",
    support: "sentence frames and the model response.",
    look: "a clear position and a number from the survey table.",
    retry: "revising one sentence after “Get feedback.”",
  },
  ...BAND_SAMPLES,
};

export const REHEARSE_MODES = [
  {
    id: "partner",
    label: "Explain the activity to a partner",
    steps: [
      "Partner A explains the activity in your own words: what students do, and the one support you will offer.",
      "Partner B says back what they heard and asks one question.",
      "Switch roles.",
    ],
  },
  {
    id: "alone",
    label: "Rehearse the directions independently",
    steps: [
      "Say your directions aloud once, as if students were in front of you.",
      "Write the first sentence you will say to the class.",
      "Say the directions again, shorter.",
    ],
  },
];
