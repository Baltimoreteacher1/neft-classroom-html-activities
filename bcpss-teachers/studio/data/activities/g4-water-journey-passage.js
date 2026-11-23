// Language Detective (passage): an original informational text about the path of water in a town (grade 4, science reading and community).
const s = (id, text, para) => ({ id, text, para });

const activity = {
  id: "g4-water-journey-passage",
  engine: "language-detective",
  title: "Water Detective: A Trip to the Plant",
  grade: "4",
  band: "3-5",
  subject: "interdisciplinary",
  lessonId: "g4-interdisciplinary-water-in-our-community",
  standards: ["RI.4.7", "W.4.2"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to Common Core grade 4 informational reading and writing and used in an interdisciplinary water unit; not mapped to a district unit sequence. The passage is original.",
  },
  vocabIds: ["reservoir", "treatment-plant", "filter", "wastewater", "community"],
  minutes: 15,
  intro:
    "Read about a class trip to a water treatment plant. Tap the sentences that are your proof, answer each question, and then build a claim about the trip water takes.",
  scene: {
    kind: "passage",
    title: "A Trip to the Water Treatment Plant",
    source: "Original - The Language Page",
    sentences: [
      s("s1", "On Friday, Ms. Reyes's fourth-grade class visited a water treatment plant.", 0),
      s("s2", "A guide named Mr. Okafor showed the students a big map of their town's water.", 0),
      s(
        "s3",
        "He explained that the town's water starts in a reservoir, which is a large lake that stores water.",
        1,
      ),
      s(
        "s4",
        "Rain and streams keep filling the reservoir, so the water is always being replaced.",
        1,
      ),
      s(
        "s5",
        "At the plant, screens catch leaves and sticks before the water goes any farther.",
        2,
      ),
      s(
        "s6",
        "Next, workers add a safe material that makes tiny bits of dirt clump together, and the clumps sink to the bottom.",
        2,
      ),
      s(
        "s7",
        "Then the water passes through layers of sand and gravel, which catch the smaller bits.",
        2,
      ),
      s("s8", "After that, workers add a small amount of disinfectant to kill germs.", 2),
      s(
        "s9",
        "Finally, the clean water flows into a storage tank, and pipes carry it to homes, schools and hospitals.",
        2,
      ),
      s(
        "s10",
        "Mr. Okafor said the plant tests the water often to make sure it is safe to drink.",
        3,
      ),
      s("s11", "The class learned that the water's trip does not end at the tap.", 4),
      s(
        "s12",
        "When people wash dishes or flush a toilet, the used water flows into sewer pipes.",
        4,
      ),
      s(
        "s13",
        "The sewer pipes lead to a different plant, which cleans the water before it goes back to a river.",
        4,
      ),
      s(
        "s14",
        "Mr. Okafor ended by asking the students to think about how much water they use each day, because every drop of it has traveled a long way.",
        5,
      ),
    ],
  },
  questions: [
    {
      id: "q1",
      type: "detail",
      prompt: "In this text, what is a reservoir?",
      options: [
        { id: "a", text: "A large lake that stores water" },
        { id: "b", text: "A pipe that carries used water away" },
        { id: "c", text: "A tool that adds disinfectant" },
        { id: "d", text: "A tank where the cleaned water is kept" },
      ],
      answer: "a",
      evidence: [
        { id: "s3", why: "The sentence says what a reservoir is right after it uses the word." },
      ],
      misconceptions: [
        {
          pick: "d",
          tag: "storage-tank-mix-up",
          hint: "A tank comes at the end of the plant. A reservoir is where the town's water starts.",
        },
        {
          pick: "b",
          tag: "used-water-mix-up",
          hint: "Used water goes through sewer pipes later in the text. The reservoir is at the beginning.",
        },
      ],
      hints: [
        "Look near the start of the text, where the town's water begins.",
        "The writer explains the word right after using it.",
        "Find the sentence with the word reservoir and read what comes after the comma.",
      ],
      model:
        "I find the word reservoir near the beginning. The sentence says it is a large lake and tells what the lake does with the water.",
      explain: "Right: the text says a reservoir is a large lake that stores water.",
      supports: {
        ee: { frames: ["A reservoir is a ___."], wordBank: ["lake", "stores", "water"] },
        dev: { frames: ["The text says a reservoir is ___."] },
        exp: {},
        br: {},
      },
    },
    {
      id: "q2",
      type: "evidence",
      prompt:
        "Tap the two sentences that tell how tiny bits of dirt are taken out of the water after the screens.",
      answer: ["s6", "s7"],
      evidence: [
        { id: "s6", why: "Workers make tiny bits of dirt clump together and sink." },
        { id: "s7", why: "Sand and gravel catch the smaller bits." },
      ],
      misconceptions: [
        {
          pick: "s5",
          tag: "big-things-not-tiny-bits",
          hint: "Screens catch big things like leaves and sticks. The question asks about tiny bits of dirt.",
        },
        {
          pick: "s8",
          tag: "germs-not-dirt",
          hint: "That sentence is about germs, not about dirt. Look for sentences about tiny bits.",
        },
      ],
      hints: [
        "The question is about tiny bits of dirt, not about big things or germs.",
        "Look in the paragraph about the plant for the words next and then.",
        "Two sentences each describe a way that tiny bits are removed.",
      ],
      model:
        "The screens catch big things first. I look at the steps that come after them, Next and Then, and find the two that deal with tiny bits.",
      explain:
        "Right: the clumping step and the sand and gravel step both remove tiny bits of dirt.",
      supports: {
        ee: {
          frames: ["Workers ___ the dirt.", "The water goes through ___."],
          wordBank: ["clump", "sink", "sand", "gravel"],
        },
        dev: {},
        exp: {},
        br: {},
      },
    },
    {
      id: "q3",
      type: "inference",
      prompt: "Why do workers add a disinfectant to the water?",
      options: [
        { id: "a", text: "To kill germs so the water is safe to drink" },
        { id: "b", text: "To make the dirt clump together and sink" },
        { id: "c", text: "To fill the storage tank faster" },
        { id: "d", text: "To catch leaves and sticks" },
      ],
      answer: "a",
      evidence: [
        { id: "s8", why: "The sentence says the disinfectant is added to kill germs." },
        { id: "s10", why: "The plant tests the water to make sure it is safe to drink." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "mixed-up-steps",
          hint: "That is the job of a different material in an earlier step. Reread what the disinfectant does.",
        },
        {
          pick: "d",
          tag: "screen-step",
          hint: "Leaves and sticks are caught by screens at the start. The disinfectant comes after the filter.",
        },
      ],
      hints: [
        "Find the sentence with the word disinfectant.",
        "Read what the sentence says the disinfectant is for.",
        "Another sentence says why the plant checks the water often.",
      ],
      model:
        "The sentence about disinfectant says what it does. Another sentence says the water is tested to be safe to drink. Together they tell me why the disinfectant is added.",
      explain:
        "Right: the disinfectant kills germs, and the testing is meant to make sure the water is safe to drink.",
      transfer: {
        prompt: "A pool worker adds a disinfectant to pool water. What is the most likely reason?",
        options: [
          { id: "a", text: "To kill germs in the water" },
          { id: "b", text: "To make the water colder" },
          { id: "c", text: "To fill the pool faster" },
        ],
        answer: "a",
        explain: "A disinfectant is used to kill germs, in a pool as well as in a treatment plant.",
      },
      supports: {
        ee: { frames: ["The workers add it to ___ germs."], wordBank: ["kill", "germs", "safe"] },
        dev: { frames: ["They add it because ___."] },
        exp: {},
        br: {},
      },
    },
    {
      id: "q4",
      type: "inference",
      prompt: "After water is used at home, where does it go?",
      options: [
        { id: "a", text: "Back into the reservoir" },
        { id: "b", text: "Into sewer pipes and then to a plant that cleans it" },
        { id: "c", text: "Into the storage tank" },
        { id: "d", text: "Straight to a river" },
      ],
      answer: "b",
      evidence: [
        { id: "s12", why: "The used water flows into sewer pipes." },
        {
          id: "s13",
          why: "The sewer pipes lead to a plant that cleans the water before the river.",
        },
      ],
      misconceptions: [
        {
          pick: "d",
          tag: "skipped-cleaning",
          hint: "Check what happens at the other plant before the water goes back to a river.",
        },
        {
          pick: "a",
          tag: "wrong-direction",
          hint: "The reservoir is where the water starts. The text says used water goes somewhere else.",
        },
      ],
      hints: [
        "Look at the last paragraph before the ending, about what happens after water is used.",
        "Follow the water step by step: first the pipes, then something else.",
        "Two sentences together tell where the water goes before it reaches a river.",
      ],
      model:
        "I read the sentences about used water. The first tells me the water goes into sewer pipes. The next tells me where the pipes lead and what happens there.",
      explain:
        "Right: used water goes into sewer pipes and then to a plant that cleans it before it goes back to a river.",
      supports: {
        ee: {
          frames: ["Used water goes to ___."],
          wordBank: ["sewer pipes", "plant", "river", "cleans"],
        },
        dev: { frames: ["First the water goes ___. Then it goes ___."] },
        exp: {},
        br: {},
      },
    },
    {
      id: "q5",
      type: "inference",
      prompt: "Why does Mr. Okafor say every drop of water has traveled a long way?",
      options: [
        {
          id: "a",
          text: "The water passes through many places and steps before and after people use it",
        },
        { id: "b", text: "The water is carried to homes by trucks" },
        { id: "c", text: "The reservoir is very far from the school" },
        { id: "d", text: "The water is always cold" },
      ],
      answer: "a",
      evidence: [
        { id: "s9", why: "Pipes carry the clean water to homes, schools and hospitals." },
        {
          id: "s13",
          why: "After use, the water goes through sewer pipes to a plant and then to a river.",
        },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "invented-detail",
          hint: "The text does not mention trucks. Use only what the text says about pipes and plants.",
        },
        {
          pick: "c",
          tag: "invented-detail",
          hint: "The text does not say how far the reservoir is. Look at the steps and places the water goes through.",
        },
      ],
      hints: [
        "Think about how many different places the water passes through in the whole text.",
        "Look at one sentence about before the tap and one sentence about after the tap.",
        "The trip has two halves: to the tap and away from the tap.",
      ],
      model:
        "I put the trip in order: reservoir, plant, pipes, home, sewer pipes, another plant, river. That is many places, so the writer says a long way.",
      explain:
        "Right: the water travels through many places and steps before it reaches a tap and again after it is used.",
      supports: {
        ee: {
          frames: ["The water goes many ___."],
          wordBank: ["places", "steps", "pipes", "plant"],
        },
        dev: { frames: ["It goes from ___ to ___ to ___."] },
        exp: {},
        br: {},
      },
    },
  ],
  claimPrompt:
    "What can you say about the trip water takes? Choose the claim your case notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "Water travels through many places and steps, and it is cleaned again after people use it.",
        strong: true,
      },
      {
        id: "c2",
        text: "Tap water comes straight from a river with no steps in between.",
        strong: false,
        tag: "skips-treatment",
        hint: "Your notes show filtering, disinfecting and pipes before the water reaches the tap.",
      },
      {
        id: "c3",
        text: "Only one plant in the town cleans water.",
        strong: false,
        tag: "one-plant-only",
        hint: "Your notes mention a different plant that cleans the used water.",
      },
      {
        id: "c4",
        text: "People should stop using water.",
        strong: false,
        tag: "overgeneralized-claim",
        hint: "Your notes do not say that. They describe how water travels and is cleaned.",
      },
    ],
    evidenceIds: ["s7", "s8", "s9", "s13"],
    evidenceMin: 3,
    why: "The notes show cleaning steps such as filtering and disinfecting, pipes that carry the water to people, and a second plant that cleans the used water.",
    hints: [
      "A strong claim uses at least three of your notes.",
      "Think about the trip before the tap and the trip after the tap.",
      "Check that your claim does not leave out the steps in your notes or add something the text does not say.",
    ],
    explainPrompt:
      "Explain how your evidence proves your claim. Use first, then and finally to show the order.",
    revisionChecks: [
      {
        id: "order",
        label: "I used words that show order, such as first, then, next or finally.",
        test: { type: "contains-any", words: ["first", "then", "next", "finally", "after"] },
      },
      {
        id: "evidence",
        label: "I used words from my evidence.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My explanation has at least 16 words.",
        test: { type: "min-words", n: 16 },
      },
      { id: "reread", label: "I read my explanation aloud once.", self: true },
    ],
  },
  explainFrames: {
    ee: ["First the water ___.", "Then it goes to ___."],
    dev: ["First ___. Next ___. Finally ___.", "One clue is ___."],
    exp: ["According to the text, the water ___ before it ___, and after it is used it ___."],
    br: [
      "The text shows that the water passes through ___ and is cleaned ___, which supports the claim that ___.",
    ],
  },
  supports: {
    ee: {
      directions: "Read each sentence. Tap a sentence to use it as proof.",
      wordBank: ["reservoir", "plant", "pipes", "clean", "sewer", "river"],
    },
    dev: { wordBank: ["first", "next", "then", "finally"] },
    exp: {},
    br: {},
  },
  reflection: {
    prompt:
      "Which sentence helped you most? How can the order words first, then and finally help you explain a path?",
    frames: {
      ee: ["The sentence ___ helped me.", "First, ___."],
      dev: ["The sentence ___ helped because ___.", "Order words help me ___."],
      exp: [
        "The sentence that helped most was ___ because ___; order words make an explanation ___.",
      ],
      br: [
        "Sequence words such as first, then and finally help a reader ___, which is why I used them to explain ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

// Parallel transfer questions for the questions that do not carry their own.
const TRANSFER = {
  q1: { prompt: "A text says a well is a deep hole that reaches water under the ground. What is a well?", options: [{ id: "a", text: "A deep hole that reaches water under the ground" }, { id: "b", text: "A pipe inside a house" }, { id: "c", text: "A tank on a hill" }], answer: "a", explain: "The text defines a well as a deep hole that reaches water under the ground." },
  q2: { prompt: "A text says: First the water is filtered. Then it is disinfected. Which step comes second?", options: [{ id: "a", text: "Disinfecting" }, { id: "b", text: "Filtering" }, { id: "c", text: "Screening" }], answer: "a", explain: "Disinfecting comes after filtering, so it is second." },
  q4: { prompt: "In another town, used water goes down a drain into sewer pipes. What happens next?", options: [{ id: "a", text: "It goes to a plant that cleans it" }, { id: "b", text: "It goes straight to a faucet" }, { id: "c", text: "It goes back to a house tank" }], answer: "a", explain: "Sewer pipes lead to a plant that cleans the used water." },
  q5: { prompt: "A letter passes through many hands before it reaches you. Why might a writer say the letter has traveled a long way?", options: [{ id: "a", text: "It passes through many places and steps" }, { id: "b", text: "It is very heavy" }, { id: "c", text: "It is written in blue ink" }], answer: "a", explain: "A trip with many places and steps is a long way." },
};

// A wrong pick that has its own hint also shows the question's worked model after repeated misses.
activity.questions = activity.questions.map((q) => ({
  ...q,
  misconceptions: q.misconceptions?.map((m) => ({ model: q.model, ...m })),
  transfer: q.transfer ?? TRANSFER[q.id],
}));

export default activity;
