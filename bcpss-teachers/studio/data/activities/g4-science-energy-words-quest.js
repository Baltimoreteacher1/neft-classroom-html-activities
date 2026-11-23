// Vocab Quest: the science words for explaining energy transfer in a simple circuit (grade 4 science).
export default {
  id: "g4-science-energy-words-quest",
  engine: "vocab-quest",
  title: "Energy and Circuits Word Quest",
  grade: "4",
  band: "3-5",
  subject: "science",
  lessonId: "g4-science-energy-transfer-and-circuits",
  standards: ["4-PS3-2", "4-PS3-4"],
  curriculum: {
    status: "district-referenced",
    unitId: "g4-sci-u1",
    note: "Matches the Energy Transfer & Collisions unit in the BCPSS curriculum seed. Words and sentences are original.",
  },
  vocabIds: [
    "energy",
    "battery",
    "circuit",
    "switch",
    "conductor",
    "insulator",
    "open-circuit",
    "convert",
    "closed-circuit",
  ],
  minutes: 18,
  intro:
    "Learn nine science words for talking about energy and circuits. Match them to pictures, use them in sentences, remember them, and explain how energy moves from a battery to a device.",
  collection: "g4-science-energy-and-circuits",
  stages: [
    {
      id: "see",
      kind: "see",
      title: "See the words",
      intro: "Look at each picture and choose the science word it shows.",
      entryIds: ["energy", "battery", "circuit", "switch"],
    },
    {
      id: "use",
      kind: "use-in-context",
      title: "Use the words",
      intro: "Fill in each sentence, then choose the sentence that uses a word correctly.",
      entryIds: ["conductor", "insulator", "open-circuit", "convert"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "conductor",
          prompt: "Which sentence uses conductor correctly?",
          choices: [
            "A copper wire is a good conductor because electric current flows through it easily.",
            "A rubber band is a good conductor because it blocks electric current.",
            "A conductor is a part that stores energy, like a battery.",
          ],
          answer: 0,
          hints: [
            "Think about what kind of material lets electric current pass through it.",
            "Check whether each sentence says the material lets current flow or blocks it.",
            "Look for the sentence where the reason matches the name.",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "conductor-blocks-current",
              hint: "That sentence says the material blocks the current. Which word names a material that blocks it?",
            },
            {
              pick: 2,
              tag: "conductor-is-battery",
              hint: "A battery stores energy. This word is about how well a material lets current pass through.",
            },
          ],
          why: "A conductor is a material that lets electric current flow through it, and copper is a metal that does.",
        },
        {
          kind: "sentence-choice",
          entryId: "open-circuit",
          prompt: "Which sentence uses open circuit correctly?",
          choices: [
            "The lamp is dark because of an open circuit: a wire came loose, so there is a gap.",
            "The lamp is bright because of an open circuit, since electric current can flow all the way around.",
            "An open circuit is a battery that has too much energy to give.",
          ],
          answer: 0,
          hints: [
            "Think about what the loop looks like when electric current cannot flow.",
            "Decide whether each sentence has a gap in the loop or a complete loop.",
            "Check that the sentence matches what the lamp is doing.",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "open-means-flowing",
              hint: "A bright lamp means the current is flowing. Does a loop with a gap let the current flow?",
            },
            {
              pick: 2,
              tag: "open-is-full-battery",
              hint: "This word describes the path of the circuit, not how much energy a battery holds.",
            },
          ],
          why: "An open circuit has a gap, so the electric current stops and the lamp stays dark.",
        },
      ],
    },
    {
      id: "retrieve",
      kind: "retrieve",
      title: "Remember the words",
      intro: "Read the meaning and type the word from memory.",
      entryIds: ["battery", "circuit", "switch", "insulator"],
    },
    {
      id: "apply",
      kind: "apply",
      title: "Explain with the words",
      intro: "Say or write a sentence about a circuit that uses each word.",
      entryIds: ["convert", "closed-circuit", "energy"],
    },
    {
      id: "revisit",
      kind: "revisit",
      title: "Revisit the words",
      intro: "Words that need more practice come back here in a different form.",
    },
  ],
  reflection: {
    prompt:
      "Which science word will help you explain a circuit to someone else, and how would you use it?",
    frames: {
      ee: ["The word ___ helps me.", "I can say ___."],
      dev: ["The word ___ helps me explain ___.", "I would say ___."],
      exp: ["I would use ___ to explain that ___ because ___."],
      br: [
        "The word ___ would help me explain ___, for example by saying that ___, which shows ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
