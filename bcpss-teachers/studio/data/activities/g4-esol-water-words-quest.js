// vocab-quest: five stages of practice with the water-cycle and explaining words (original practice, ESOL grade 4).
const STAGE_WORDS = ["evaporation", "condensation", "precipitation", "collection", "cycle", "sequence"];

export default {
  id: "g4-esol-water-words-quest",
  engine: "vocab-quest",
  title: "Word Quest: Water Cycle Words",
  grade: "4",
  band: "3-5",
  subject: "esol",
  standards: ["ELD-SC", "SL.4.4"],
  curriculum: {
    status: "standards-aligned",
    note: "Original vocabulary practice aligned to WIDA ELD-SC and CCSS speaking standards. Not mapped to a district unit.",
  },
  minutes: 16,
  intro:
    "Meet six words for explaining how water moves, then use them in sentences, remember them, and say your own.",
  collection: "g4-esol-explain-how-things-work",
  stages: [
    {
      id: "see",
      kind: "see",
      title: "See the words",
      intro: "Meet each word, then match it to a picture.",
      entryIds: STAGE_WORDS.slice(0, 5),
    },
    {
      id: "use",
      kind: "use-in-context",
      title: "Use the words in sentences",
      intro: "Choose the word that fits the sentence, then check how a word is really used.",
      entryIds: STAGE_WORDS.slice(0, 5),
      kinds: ["cloze"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "condensation",
          prompt: "Which sentence uses the word condensation correctly?",
          choices: [
            "Condensation happens when a cold glass makes water vapor in the air turn into drops on the outside.",
            "Condensation happens when the sun heats a puddle and the water slowly disappears into the air.",
            "Condensation is the rain and snow that fall from a cloud down to the ground.",
          ],
          answer: 0,
          hints: [
            "Think about which way the water changes in each sentence: from a gas to a liquid, or the other way.",
            "Say each sentence out loud. Which one is about something cooling down?",
            "Ask yourself: does the water end up as liquid drops, or does it leave as a gas, or does it fall from the sky?",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "condensation-vs-evaporation",
              hint: "That sentence describes evaporation, where liquid water turns into a gas. Condensation goes the other way: a gas turns into liquid drops.",
            },
            {
              pick: 2,
              tag: "condensation-vs-precipitation",
              hint: "That sentence describes precipitation, water falling to the ground. Condensation happens earlier, when drops first form.",
            },
          ],
          why: "Condensation is when water vapor cools and turns back into liquid drops.",
        },
      ],
    },
    {
      id: "retrieve",
      kind: "retrieve",
      title: "Remember the words",
      intro: "Read the meaning and type the word you remember.",
      entryIds: STAGE_WORDS.slice(0, 5),
    },
    {
      id: "apply",
      kind: "apply",
      title: "Say and write",
      intro: "Say a sentence about water, then write it with the word.",
      entryIds: ["evaporation", "condensation", "precipitation", "cycle"],
    },
    {
      id: "revisit",
      kind: "revisit",
      title: "Come back to the words",
      intro: "Words that need another look come back until you can use them without help.",
    },
  ],
  reflection: {
    prompt: "Which word will you use to explain how water moves? Tell when you will use it.",
    frames: {
      ee: ["I will use the word ___.", "I will say it when I talk about ___."],
      dev: ["I will use ___ when I explain ___."],
      exp: ["I will use ___ when I explain ___ because ___."],
      br: ["I will use ___ when I explain ___, and I will connect it to ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
