// Language Detective (grade 2 ELA, informational text): find the topic, the focus of each paragraph, key details and the main idea of a short text about honey bees.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const sentences = [
  { id: "s1", text: "Honey bees live together in a home called a hive.", para: 0 },
  { id: "s2", text: "A hive can hold thousands of bees.", para: 0 },
  { id: "s3", text: "Every bee in the hive has a job to do.", para: 0 },
  { id: "s4", text: "Some bees fly out to find flowers.", para: 1 },
  { id: "s5", text: "They drink a sweet liquid called nectar.", para: 1 },
  { id: "s6", text: "The bees bring the nectar back and turn it into honey.", para: 1 },
  { id: "s7", text: "Other bees stay inside the hive.", para: 1 },
  { id: "s8", text: "They feed the baby bees and keep the hive clean.", para: 1 },
  { id: "s9", text: "A bee lands on a flower to drink nectar.", para: 2 },
  { id: "s10", text: "Tiny grains called pollen stick to the bee's body.", para: 2 },
  { id: "s11", text: "The bee carries the pollen to the next flower.", para: 2 },
  { id: "s12", text: "This helps plants make seeds and fruit.", para: 2 },
];

// After the third miss the engine shows a misconception's own line instead of the question model unless the
// misconception carries a model, so each one repeats the question model.
const withModels = (questions) =>
  questions.map((q) => ({
    ...q,
    misconceptions: (q.misconceptions || []).map((m) => ({ model: q.model, ...m })),
  }));

export default {
  id: "g2-ela-busy-honey-bees",
  engine: "language-detective",
  title: "Busy Honey Bees: find the main idea and the proof",
  grade: "2",
  band: "k-2",
  subject: "ela",
  lessonId: "g2-ela-main-idea-informational-text",
  standards: ["RI.2.1", "RI.2.2"],
  vocabIds: ["topic", "main-idea", "detail", "paragraph", "mostly", "focus", "support", "evidence"],
  minutes: 15,
  intro:
    "Read the text about honey bees. Find what each part is mostly about, tap the sentences that prove your answers, and then choose the main idea of the whole text.",
  scene: {
    kind: "passage",
    title: "Busy Honey Bees",
    source: "Original - The Language Page",
    caption: "An informational text in three paragraphs.",
    sentences,
  },
  questions: withModels([
    {
      id: "q1",
      type: "detail",
      prompt: "What is a hive?",
      options: [
        { id: "a", text: "A home for honey bees" },
        { id: "b", text: "A kind of flower" },
        { id: "c", text: "A sweet liquid" },
      ],
      answer: "a",
      evidence: [{ id: "s1", why: "This sentence names the hive and says what it is." }],
      misconceptions: [
        {
          pick: "c",
          tag: "word-mix-up",
          hint: "The sweet liquid has its own name in the second paragraph. What is a hive?",
        },
        {
          pick: "s5",
          tag: "word-mix-up",
          hint: "That sentence tells about something bees drink. Look for where bees live.",
        },
      ],
      hints: [
        "Read the first paragraph. Look for the word hive.",
        "Find the sentence that uses the word hive and says what it is called.",
        "The words 'a home called' come just before the word hive.",
      ],
      model: "In the first sentence, bees live in a home called a hive. So a hive is a bee home.",
      explain: "Right. The first sentence says a hive is the home where honey bees live.",
      transfer: {
        prompt: "Where do honey bees live?",
        options: [
          { id: "a", text: "In a hive" },
          { id: "b", text: "In a flower" },
        ],
        answer: "a",
        explain: "The first sentence says they live together in a hive.",
      },
    },
    {
      id: "q2",
      type: "inference",
      prompt: "What is this whole text mostly about?",
      options: [
        { id: "a", text: "How honey bees live and work" },
        { id: "b", text: "How to grow a garden" },
        { id: "c", text: "What baby bees eat" },
      ],
      answer: "a",
      evidence: [
        {
          id: "s1",
          why: "The first sentence names the topic and where bees live.",
          optional: false,
        },
        { id: "s3", why: "This sentence says every bee has a job.", optional: false },
      ],
      misconceptions: [
        {
          pick: "c",
          tag: "too-small",
          hint: "That is one small detail from one paragraph. Does it cover the whole text?",
        },
        {
          pick: "b",
          tag: "off-topic",
          hint: "The text talks about plants, but only as one part. Is gardening what the text is mostly about?",
        },
        {
          pick: "s12",
          tag: "last-sentence-only",
          hint: "That sentence is true, but it only wraps up the last paragraph. Look for the sentences that tell about the whole topic.",
        },
      ],
      hints: [
        "Think about all three paragraphs, not just one.",
        "Look at the first paragraph. It tells the topic and what is true about every bee.",
        "Tap two sentences from the first paragraph: one names where bees live and one says what every bee does.",
      ],
      model:
        "The first paragraph says honey bees live in a hive and every bee has a job. The next two paragraphs tell about the jobs. So the text is mostly about how bees live and work.",
      explain:
        "Right. The first paragraph sets up the topic, and the rest of the text tells about it.",
      transfer: {
        prompt: "Which would be a better title for this text?",
        options: [
          { id: "a", text: "Busy Honey Bees" },
          { id: "b", text: "All About Flowers" },
        ],
        answer: "a",
        explain: "Almost every sentence is about honey bees, so that title matches the text.",
      },
    },
    {
      id: "q3",
      type: "inference",
      prompt: "What is the second paragraph mostly about?",
      options: [
        { id: "a", text: "Jobs bees do outside and inside the hive" },
        { id: "b", text: "How pollen sticks to a bee" },
        { id: "c", text: "How many bees live in a hive" },
      ],
      answer: "a",
      evidence: [
        {
          id: "s4",
          why: "Some bees fly out to find flowers: that is an outside job.",
          optional: false,
        },
        { id: "s7", why: "Other bees stay inside: that is an inside job.", optional: false },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "wrong-paragraph",
          hint: "That is the focus of a different paragraph. Look at the sentences in this one.",
        },
        {
          pick: "c",
          tag: "wrong-paragraph",
          hint: "That is a detail from the first paragraph, not this one.",
        },
        {
          pick: "s6",
          tag: "true-but-small",
          hint: "That sentence is one detail. Tap the two sentences that start with Some and Other.",
        },
      ],
      hints: [
        "Read only the second paragraph. What do the bees in it do?",
        "Look for two sentences that start by telling which bees do something.",
        "One sentence starts with 'Some bees' and another starts with 'Other bees'.",
      ],
      model:
        "In the second paragraph some bees go out to find flowers, and other bees stay inside. Both are jobs, so the paragraph is about jobs inside and outside the hive.",
      explain: "Right. The paragraph compares what some bees do and what other bees do.",
    },
    {
      id: "q4",
      type: "evidence",
      prompt: "Tap the two sentences that show how a bee moves pollen from flower to flower.",
      answer: ["s10", "s11"],
      evidence: [
        { id: "s10", why: "Pollen sticks to the bee's body." },
        { id: "s11", why: "The bee carries the pollen to the next flower." },
      ],
      misconceptions: [
        {
          pick: "s9",
          tag: "true-but-unrelated",
          hint: "That sentence is true, but it is about drinking nectar, not moving pollen.",
        },
        {
          pick: "s12",
          tag: "result-not-process",
          hint: "That sentence tells the result. Tap the sentences that tell how the pollen moves.",
        },
      ],
      hints: [
        "Read the third paragraph and look for the word pollen.",
        "You need one sentence about how pollen gets on the bee and one about where the bee takes it.",
        "Tap the sentence that says pollen sticks, then the sentence that says the bee carries it.",
      ],
      model:
        "I look for pollen. One sentence says it sticks to the bee, and the next says the bee carries it to another flower. Those two show how the pollen moves.",
      explain: "Right. Pollen sticks to the bee, and then the bee carries it to the next flower.",
    },
    {
      id: "q5",
      type: "detail",
      prompt: "Which sentence is the best main idea for the third paragraph?",
      options: [
        { id: "a", text: "Bees help plants make seeds and fruit." },
        { id: "b", text: "Pollen is made of tiny grains." },
        { id: "c", text: "A bee can land on a flower." },
      ],
      answer: "a",
      evidence: [
        { id: "s12", why: "This sentence says what all the details in the paragraph lead to." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "too-small",
          hint: "That is only one detail. Does it cover what the bee does with the pollen?",
        },
        {
          pick: "c",
          tag: "too-small",
          hint: "That is only the first step. A main idea covers the whole paragraph.",
        },
      ],
      hints: [
        "A main idea covers all the sentences in the paragraph, not just one.",
        "Ask which choice the other sentences in the paragraph explain.",
        "Look for the sentence at the end that tells why the pollen matters.",
      ],
      model:
        "The paragraph tells how pollen sticks to a bee and moves to the next flower. The last sentence says why that matters: it helps plants make seeds and fruit. That covers the whole paragraph.",
      explain: "Right. Every detail in the paragraph leads to bees helping plants.",
      transfer: {
        prompt: "Which is too small to be a main idea?",
        options: [
          { id: "a", text: "Pollen sticks to a bee." },
          { id: "b", text: "Bees help plants grow." },
        ],
        answer: "a",
        explain: "Pollen sticking to a bee is one detail, not the whole paragraph.",
      },
    },
  ]),
  claimPrompt: "What is the main idea of the whole text? Choose the claim your notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "Every honey bee has a job, and the bees' work helps the hive and the plants.",
        strong: true,
      },
      {
        id: "c2",
        text: "Bees make honey.",
        strong: false,
        tag: "too-small",
        hint: "That is true, but it is only one detail. Your notes show many jobs.",
      },
      {
        id: "c3",
        text: "Plants need water and sun to grow.",
        strong: false,
        tag: "off-topic",
        hint: "That may be true, but your notes are about bees. What does the text say about bees?",
      },
      {
        id: "c4",
        text: "Bees are the best insect.",
        strong: false,
        tag: "opinion",
        hint: "The text gives facts, not an opinion like best. Look at your notes for facts.",
      },
    ],
    evidenceIds: ["s3", "s4", "s7", "s12"],
    evidenceMin: 3,
    why: "Your notes show that every bee has a job, some bees work outside and some inside, and the bees help plants make seeds and fruit.",
    hints: [
      "Look at your notes. What do they say about every bee?",
      "Your notes cover jobs inside, jobs outside and what bees do for plants.",
      "Choose the claim that covers all of your notes, not just one.",
    ],
    explainPrompt: "Tell why your claim is the main idea. Use details from the text.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because or so to connect my details to my claim.",
        test: { type: "contains-any", words: ["because", "so", "this shows", "that is why"] },
      },
      {
        id: "evidence",
        label: "I used words from my proof sentences.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My answer has at least 14 words.",
        test: { type: "min-words", n: 14 },
      },
      { id: "reread", label: "I read my answer out loud once.", self: true },
    ],
  },
  explainFrames: fr(
    ["The main idea is ___.", "A detail is ___."],
    ["The main idea is that ___. One detail is ___ and another detail is ___."],
    [
      "The main idea is that every bee has a job. The text shows this because some bees ___ and other bees ___.",
    ],
    [
      "The main idea is that bees work together and help plants. Three details support this: ___, ___ and ___.",
    ],
  ),
  supports: {
    ee: {
      frames: ["I read about ___.", "The text says ___."],
      oral: "Read one sentence at a time. Tap a sentence to hear it. Say what it tells.",
    },
    dev: { frames: ["This paragraph is about ___.", "A detail is ___."] },
    exp: { frames: ["The paragraph is mostly about ___ because ___."] },
    br: {},
  },
  reflection: {
    prompt: "How did you tell a main idea from a detail?",
    frames: fr(
      ["A detail is small.", "The main idea is big."],
      ["The main idea covers the whole text.", "A detail tells one fact."],
      ["I knew it was the main idea because all of the details explain it."],
      ["I tested each choice by asking whether the details in every paragraph supported it."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
