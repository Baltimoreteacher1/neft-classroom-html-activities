// Vocab Quest: the words for explaining how water moves, from seeing a word to using it in an explanation. Original content.
export default {
  id: "g4-esol-explain-water-words-quest",
  engine: "vocab-quest",
  title: "Quest: words for explaining water",
  grade: "4",
  band: "3-5",
  subject: "esol",
  lessonId: "g4-esol-explain-how-things-work",
  standards: ["ELD-SC", "L.4.4", "SL.4.4"],
  minutes: 20,
  intro:
    "Meet the words you need to explain the water cycle. Match them to pictures, use them in sentences, remember them, and then use them to explain.",
  collection: "g4-esol-explain-how-things-work",
  stages: [
    {
      id: "see",
      kind: "see",
      title: "See the words",
      intro: "Look at each picture and choose the word that matches.",
      entryIds: ["evaporation", "condensation", "precipitation", "collection", "cloud"],
      kinds: ["picture-word"],
    },
    {
      id: "use",
      kind: "use-in-context",
      title: "Use the words",
      intro: "Read each sentence and choose the word that fits.",
      entryIds: ["evaporation", "condensation", "precipitation", "collection", "because", "so"],
      kinds: ["cloze"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "because",
          prompt: "Which sentence uses because correctly?",
          choices: [
            "The puddle gets smaller because the sun warms the water.",
            "The sun warms the water because the puddle gets smaller.",
            "Because the puddle gets smaller the sun, because water.",
          ],
          answer: 0,
          hints: [
            "Decide which thing happens first and which thing is the result.",
            "The reason comes after the word that gives the reason.",
            "The sun's heat is the thing that makes the water change.",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "reversed-cause",
              hint: "Check which thing happens first. The cause comes after because.",
            },
          ],
          why: "The sun warming the water is the cause, and the smaller puddle is the result.",
        },
        {
          kind: "sentence-choice",
          entryId: "so",
          prompt: "Which sentence uses so correctly to give a result?",
          choices: [
            "The air is cold, so the vapor turns into drops.",
            "The vapor turns into drops, so the air is cold.",
            "So the air is cold and the vapor, so.",
          ],
          answer: 0,
          hints: [
            "Find the cause and the result in each sentence.",
            "The word that gives a result comes after the cause.",
            "Which sentence puts cold air first and the change second?",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "reversed-result",
              hint: "Check the direction. The thing that happens first comes before the word so.",
            },
          ],
          why: "Cold air is the cause and drops forming is the result, so the result follows so.",
        },
      ],
    },
    {
      id: "retrieve",
      kind: "retrieve",
      title: "Remember the words",
      intro: "Read each meaning and type the word.",
      entryIds: ["evaporation", "condensation", "precipitation", "cycle", "sequence", "collection"],
      kinds: ["type-word"],
    },
    {
      id: "apply",
      kind: "apply",
      title: "Explain with the words",
      intro: "Say a sentence with each word, then write it.",
      entryIds: ["because", "sequence", "cycle", "evaporation"],
      kinds: ["say-write"],
    },
    {
      id: "revisit",
      kind: "revisit",
      title: "Revisit the words",
      intro: "Words that need more practice come back so you can secure them.",
    },
  ],
  reflection: {
    prompt: "Which word will you use to explain a process this week, and when?",
    frames: {
      ee: ["I will use ___.", "I will say it when ___."],
      dev: ["I will use ___ when I explain ___."],
      exp: ["I will use ___ when I explain ___ because ___."],
      br: ["I will use ___ to connect ___ and ___ when I explain ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
