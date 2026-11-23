// Language Detective (grade 1 ELA): a decodable story made of short vowel words and a few common sight words. Read it, find proof, build a claim.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const sentences = [
  { id: "s1", text: "Sam has a hen.", para: 0 },
  { id: "s2", text: "The hen is in a pen.", para: 0 },
  { id: "s3", text: "The pen has a gap.", para: 0 },
  { id: "s4", text: "The hen got out.", para: 1 },
  { id: "s5", text: "Sam ran and ran.", para: 1 },
  { id: "s6", text: "The hen sat in the mud.", para: 1 },
  { id: "s7", text: "Sam got the hen.", para: 2 },
  { id: "s8", text: "Sam put a log on the gap.", para: 2 },
  { id: "s9", text: "The hen is in the pen.", para: 2 },
];

// After the third miss the engine shows a misconception's own line instead of the question model unless the
// misconception carries a model, so each one repeats the question model.
const withModels = (questions) =>
  questions.map((q) => ({
    ...q,
    misconceptions: (q.misconceptions || []).map((m) => ({ model: q.model, ...m })),
  }));

export default {
  id: "g1-ela-sam-and-the-hen",
  engine: "language-detective",
  title: "Sam and the hen: read, find proof, say why",
  grade: "1",
  band: "k-2",
  subject: "ela",
  lessonId: "g1-ela-sound-out-short-vowel-words",
  standards: ["RF.1.3b", "RL.1.1"],
  vocabIds: ["sound-out", "blend", "read", "check", "word"],
  minutes: 12,
  intro:
    "Read the story one word at a time. Sound out each word, then blend it. Tap a sentence to hear it and to keep it as proof.",
  scene: {
    kind: "passage",
    title: "Sam and the Hen",
    source: "Original - The Language Page",
    caption:
      "Every word in this story uses short vowel sounds, plus the words the, a, is, in, and, put and on.",
    sentences,
  },
  questions: withModels([
    {
      id: "q1",
      type: "detail",
      prompt: "Where is the hen at first?",
      options: [
        { id: "a", text: "In a pen" },
        { id: "b", text: "In the mud" },
        { id: "c", text: "On a log" },
      ],
      answer: "a",
      evidence: [{ id: "s2", why: "This sentence tells where the hen is at the start." }],
      misconceptions: [
        {
          pick: "b",
          tag: "wrong-time",
          hint: "The hen sits there later in the story. Where is it at first?",
        },
        {
          pick: "s6",
          tag: "wrong-time",
          hint: "That sentence tells about later. Look for the start of the story.",
        },
      ],
      hints: [
        "Read the first part of the story, one sentence at a time.",
        "Find the sentence that tells where the hen is before anything happens.",
        "A fence keeps an animal in this place. Which sentence names it?",
      ],
      model:
        "I read the first part. Sam has a hen. The hen is in a pen. So at first the hen is in the pen.",
      explain: "Right. The second sentence says the hen is in a pen at the start.",
      transfer: {
        prompt: "Who has the hen?",
        options: [
          { id: "a", text: "Sam" },
          { id: "b", text: "The mud" },
        ],
        answer: "a",
        explain: "The first sentence says Sam has a hen.",
      },
    },
    {
      id: "q2",
      type: "inference",
      prompt: "Why did the hen get out?",
      options: [
        { id: "a", text: "The pen had a gap." },
        { id: "b", text: "The hen was mad." },
        { id: "c", text: "Sam let the hen out." },
      ],
      answer: "a",
      evidence: [
        { id: "s3", why: "The pen has a gap, so there was a way out.", optional: false },
        { id: "s4", why: "The hen got out right after the gap was named.", optional: true },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "unsupported-claim",
          hint: "The story never says the hen was mad. What does the story say about the pen?",
        },
        {
          pick: "c",
          tag: "unsupported-claim",
          hint: "Does the story say Sam did that? Look for what is wrong with the pen.",
        },
        {
          pick: "s5",
          tag: "true-but-unrelated",
          hint: "That sentence is true, but it does not tell why the hen got out.",
        },
      ],
      hints: [
        "Read the sentences about the pen.",
        "Look for something that is wrong with the pen.",
        "Which sentence names a hole or an open space?",
      ],
      model:
        "I read: the pen has a gap. A gap is an open space. The hen got out through it. So the gap is the reason.",
      explain: "Right. The pen had a gap, so the hen could get out.",
      transfer: {
        prompt: "Sam put a log on the gap. Why?",
        options: [
          { id: "a", text: "So the hen cannot get out again." },
          { id: "b", text: "So the hen can sit on it." },
        ],
        answer: "a",
        explain: "A log on the gap blocks the way out.",
      },
    },
    {
      id: "q3",
      type: "evidence",
      prompt: "Tap the sentence that tells where the hen sat.",
      answer: ["s6"],
      evidence: [{ id: "s6", why: "This sentence says where the hen sat." }],
      misconceptions: [
        {
          pick: "s4",
          tag: "right-event-wrong-detail",
          hint: "That sentence tells that the hen left the pen, not where it sat.",
        },
        {
          pick: "s2",
          tag: "wrong-time",
          hint: "That is where the hen was at the start. Where did it sit after it got out?",
        },
      ],
      hints: [
        "Look in the middle of the story, after the hen got out.",
        "Find the sentence with the word sat in it.",
        "The place is soft and wet.",
      ],
      model: "I look for the word sat. The sentence The hen sat in the mud tells where.",
      explain: "Right. The hen sat in the mud.",
    },
    {
      id: "q4",
      type: "inference",
      prompt: "What did Sam do so the hen could not get out again?",
      options: [
        { id: "a", text: "He put a log on the gap." },
        { id: "b", text: "He got a new hen." },
        { id: "c", text: "He ran and ran." },
      ],
      answer: "a",
      evidence: [{ id: "s8", why: "This sentence tells what Sam did to fix the pen." }],
      misconceptions: [
        {
          pick: "c",
          tag: "wrong-time",
          hint: "That happened before Sam found the hen. What did he do at the end?",
        },
        {
          pick: "b",
          tag: "unsupported-claim",
          hint: "The story says Sam got the same hen back. What did he do to the pen?",
        },
      ],
      hints: [
        "Read the last part of the story.",
        "Find the sentence that tells what Sam did to the pen.",
        "Look for something heavy that Sam used to block the way.",
      ],
      model: "In the last part, Sam put a log on the gap. The log blocks the way out.",
      explain: "Right. Sam put a log on the gap.",
    },
  ]),
  claimPrompt: "What can you say about Sam? Choose the claim your notes support.",
  claim: {
    options: [
      { id: "c1", text: "Sam fixed the pen, so the hen is safe.", strong: true },
      {
        id: "c2",
        text: "The hen sat in the mud for a long time.",
        strong: false,
        tag: "true-but-small",
        hint: "That is in the story, but it does not tell what Sam did about the gap.",
      },
      {
        id: "c3",
        text: "Sam was mad at the hen.",
        strong: false,
        tag: "unsupported-claim",
        hint: "Your notes do not say that. Look at what Sam did.",
      },
    ],
    evidenceIds: ["s3", "s8"],
    evidenceMin: 2,
    why: "Your notes show the pen had a gap and Sam put a log on it, so Sam fixed the pen.",
    hints: [
      "Look at your notes. What problem did the pen have?",
      "Find the note that tells what Sam did to fix it.",
      "Choose the claim that uses both notes.",
    ],
    explainPrompt: "Tell how your notes show that your claim is true.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because or so to connect my proof to my claim.",
        test: { type: "contains-any", words: ["because", "so", "this shows"] },
      },
      {
        id: "evidence",
        label: "I used words from my proof.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My answer has at least 6 words.",
        test: { type: "min-words", n: 6 },
      },
      { id: "reread", label: "I read my answer out loud once.", self: true },
    ],
  },
  explainFrames: fr(
    ["The pen has a ___.", "Sam put a ___ on it."],
    ["Sam fixed the pen because the pen had a ___.", "Sam put a ___ on the gap."],
    ["Sam fixed the pen. The proof is that the pen had a gap and Sam put a log on it."],
    ["The text shows a problem, a gap, and a solution, a log, so Sam made the pen safe."],
  ),
  supports: {
    ee: {
      frames: ["I read ___.", "The story says ___."],
      oral: "Sound out each word with your finger under the letters. Tap a sentence to hear it.",
    },
    dev: { frames: ["I found proof in the sentence ___."] },
    exp: { frames: ["The sentence shows ___, so ___."] },
    br: {},
  },
  reflection: {
    prompt: "What helped you read the words in the story?",
    frames: fr(
      ["I said the ___.", "I blended the ___."],
      ["I sounded out the word, then I blended the sounds.", "A word I read was ___."],
      ["I read a word by saying each sound and blending them, then I checked that it made sense."],
      ["I decoded each word by sounding it out and verified the meaning against the story."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
