// Early Sort (kindergarten): listen to a picture's name, then pick the picture whose name rhymes. Spoken words only; no reading needed.
const ic = (name, alt) => ({ kind: "icon", name, alt });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

// The engine reads feedback for a wrong pick from the tagged choice itself, so each wrong choice carries its own hint.
const trial = (id, cue, choices, answer, say, hints, model, { misconceptions = [], ...extra } = {}) => ({
  id,
  cue,
  choices: choices.map((c) => {
    const m = misconceptions.find((x) => x.pick === c.id);
    return m ? { ...c, tag: m.tag, hint: m.hint } : c;
  }),
  answer,
  say,
  hints,
  model,
  ...extra,
});

const trials = [
  trial(
    "t1",
    { word: "bee", visual: ic("bee", "A bee with a striped body and wings") },
    [
      { id: "tree", word: "tree", visual: ic("tree", "A tall tree with green leaves") },
      { id: "bus", word: "bus", visual: ic("bus", "A school bus"), tag: "same-beginning" },
    ],
    "tree",
    "Which picture rhymes with bee?",
    [
      "Say bee slowly and stretch out the end.",
      "Listen only to the end of each picture name.",
      "Look for a picture that ends with a long ee sound.",
    ],
    "Bee and tree both end with ee. They rhyme.",
    {
      misconceptions: [
        {
          pick: "bus",
          tag: "same-beginning",
          hint: "Those two start alike. Listen to the end instead.",
        },
      ],
    },
  ),
  trial(
    "t2",
    { word: "star", visual: ic("star", "A bright star with five points") },
    [
      { id: "car", word: "car", visual: ic("car", "A small car seen from the side") },
      { id: "sun", word: "sun", visual: ic("sun", "A round yellow sun"), tag: "same-beginning" },
    ],
    "car",
    "Which picture rhymes with star?",
    [
      "Say star and stretch the end: star.",
      "Slide your finger to the end of the word and listen there.",
      "Look for something with wheels that ends with ar.",
    ],
    "Star and car both end with ar. They rhyme.",
    {
      misconceptions: [
        {
          pick: "sun",
          tag: "same-beginning",
          hint: "Those two start with the same sound. Rhymes match at the end.",
        },
      ],
    },
  ),
  trial(
    "t3",
    { word: "dog", visual: ic("dog", "A dog standing and looking at you") },
    [
      { id: "frog", word: "frog", visual: ic("frog", "A green frog sitting still") },
      {
        id: "duck",
        word: "duck",
        visual: ic("duck", "A duck with an orange beak"),
        tag: "same-beginning",
      },
      { id: "cat", word: "cat", visual: ic("cat", "A cat sitting up"), tag: "different-sound" },
    ],
    "frog",
    "Which picture rhymes with dog?",
    [
      "Say dog slowly. Which part will you listen to?",
      "Listen to the last part of each name, not the first part.",
      "Look for a green animal that hops and ends with og.",
    ],
    "Dog and frog both end with og. They rhyme.",
    {
      misconceptions: [
        {
          pick: "duck",
          tag: "same-beginning",
          hint: "Those two start alike. Rhymes match at the end of the word.",
        },
        {
          pick: "cat",
          tag: "different-sound",
          hint: "Say both slowly. The ends sound different.",
        },
      ],
    },
  ),
  trial(
    "t4",
    { word: "rain", visual: ic("rain", "Gray clouds with raindrops falling") },
    [
      { id: "train", word: "train", visual: ic("train", "A train on tracks") },
      {
        id: "rabbit",
        word: "rabbit",
        visual: ic("rabbit", "A rabbit with long ears"),
        tag: "same-beginning",
      },
      { id: "bell", word: "bell", visual: ic("bell", "A school bell"), tag: "different-sound" },
    ],
    "train",
    "Which picture rhymes with rain?",
    [
      "Say rain slowly and listen to the end.",
      "Check the end of each picture name, one at a time.",
      "Look for a long ride on tracks that ends with ain.",
    ],
    "Rain and train both end with ain. They rhyme.",
    {
      misconceptions: [
        {
          pick: "rabbit",
          tag: "same-beginning",
          hint: "Those two start with the same sound. Listen to the end.",
        },
        {
          pick: "bell",
          tag: "different-sound",
          hint: "Say both slowly. The ends do not sound the same.",
        },
      ],
    },
  ),
  trial(
    "t5",
    { word: "duck", visual: ic("duck", "A duck with an orange beak") },
    [
      { id: "truck", word: "truck", visual: ic("truck", "A delivery truck") },
      {
        id: "dog",
        word: "dog",
        visual: ic("dog", "A dog standing and looking at you"),
        tag: "same-beginning",
      },
      {
        id: "fish",
        word: "fish",
        visual: ic("fish", "A fish swimming sideways"),
        tag: "different-sound",
      },
    ],
    "truck",
    "Which picture rhymes with duck?",
    [
      "Say duck slowly and stretch out the last sound.",
      "Do not listen to the start. Listen to the end.",
      "Look for a big vehicle that ends with uck.",
    ],
    "Duck and truck both end with uck. They rhyme.",
    {
      misconceptions: [
        {
          pick: "dog",
          tag: "same-beginning",
          hint: "Those two start alike. Listen to the end of the word.",
        },
        {
          pick: "fish",
          tag: "different-sound",
          hint: "Say both slowly. The ends sound different.",
        },
      ],
    },
  ),
  trial(
    "t6",
    { word: "snail", visual: ic("snail", "A snail with a spiral shell") },
    [
      {
        id: "pail",
        word: "pail",
        visual: ic("bucket", "A bucket, which is also called a pail"),
      },
      { id: "sun", word: "sun", visual: ic("sun", "A round yellow sun"), tag: "same-beginning" },
      {
        id: "star",
        word: "star",
        visual: ic("star", "A bright star with five points"),
        tag: "same-beginning",
      },
      {
        id: "fish",
        word: "fish",
        visual: ic("fish", "A fish swimming sideways"),
        tag: "different-sound",
      },
    ],
    "pail",
    "Which picture rhymes with snail?",
    [
      "Say snail slowly and listen to the end.",
      "Two of these start the same way as the first picture. Skip the start.",
      "Look for something you carry water in that ends with ail.",
    ],
    "Snail and pail both end with ail. They rhyme.",
    {
      misconceptions: [
        {
          pick: "sun",
          tag: "same-beginning",
          hint: "That one starts the same. Rhymes match at the end.",
        },
        {
          pick: "star",
          tag: "same-beginning",
          hint: "That one starts the same. Rhymes match at the end.",
        },
        {
          pick: "fish",
          tag: "different-sound",
          hint: "Say both slowly. The ends sound different.",
        },
      ],
    },
  ),
  trial(
    "t7",
    { word: "cone", visual: ic("cone", "A cone shape with a round bottom and a pointed top") },
    [
      { id: "bone", word: "bone", visual: ic("bone", "A white bone") },
      {
        id: "cow",
        word: "cow",
        visual: ic("cow", "A cow standing in a field"),
        tag: "same-beginning",
      },
      {
        id: "cup",
        word: "cup",
        visual: ic("measuring-cup", "A cup for measuring"),
        tag: "same-beginning",
      },
      {
        id: "tree",
        word: "tree",
        visual: ic("tree", "A tall tree with green leaves"),
        tag: "different-sound",
      },
    ],
    "bone",
    "Which picture rhymes with cone?",
    [
      "Say cone slowly and listen to the end of the word.",
      "Two of these start with the same sound. Listen to the end instead.",
      "Look for a hard part inside your body that ends with one.",
    ],
    "Cone and bone both end with one. They rhyme.",
    {
      misconceptions: [
        {
          pick: "cow",
          tag: "same-beginning",
          hint: "That one starts the same. Rhymes match at the end.",
        },
        {
          pick: "cup",
          tag: "same-beginning",
          hint: "That one starts the same. Rhymes match at the end.",
        },
        {
          pick: "tree",
          tag: "different-sound",
          hint: "Say both slowly. The ends sound different.",
        },
      ],
      transfer: {
        prompt: "Which word rhymes with phone?",
        options: [
          { id: "a", word: "bone" },
          { id: "b", word: "pan" },
        ],
        answer: "a",
        explain: "Phone and bone both end with one.",
      },
    },
  ),
];

export default {
  id: "k-ela-rhyme-listen",
  engine: "early-sort",
  title: "Listen for the rhyme",
  grade: "K",
  band: "k-2",
  subject: "ela",
  lessonId: "k-ela-rhyme-and-syllables",
  standards: ["RF.K.2a"],
  vocabIds: ["rhyme", "ending-sound", "same", "different", "listen"],
  minutes: 8,
  intro:
    "Let's listen to words together. We will find the pictures that sound the same at the end.",
  grownUp: {
    ask: "Say a picture name slowly and ask, 'Do you hear the end?'",
    notice:
      "Does your child choose a picture that starts the same? Say both words and slide a finger to the end.",
  },
  rounds: [
    {
      id: "r1",
      mode: "sound-match",
      kind: "rhyme",
      title: "Which one rhymes?",
      prompt: "Listen to the end of the word. Pick the picture that rhymes.",
      grownUp: { ask: "Ask your child to say both words out loud before choosing." },
      trials,
    },
    {
      id: "r2",
      mode: "oral-describe",
      title: "Say a rhyme",
      prompt: "Look at the picture. Say a word that rhymes with it.",
      supports: {
        ee: {
          frames: ["___ and ___ rhyme."],
          oral: "Say the picture's name. Then say a word that ends the same.",
        },
        dev: { frames: ["___ and ___ rhyme.", "They end the same."] },
        exp: { frames: ["___ and ___ rhyme because the ends sound the same."] },
        br: {},
      },
      items: [
        {
          id: "o1",
          word: "cat",
          visual: ic("cat", "A cat sitting up and looking at you"),
          say: "Look at the cat. Say a word that rhymes with cat. A made-up word is fine.",
          grownUp: {
            ask: "Ask: What word ends like cat?",
            notice: "Words such as hat, mat, bat or a silly word all count.",
          },
        },
        {
          id: "o2",
          word: "sun",
          visual: ic("sun", "A round yellow sun"),
          say: "Look at the sun. Say a word that rhymes with sun. A silly word is fine.",
          grownUp: {
            ask: "Ask: What word ends like sun?",
            notice: "Words such as run, fun, bun or a silly word all count.",
          },
        },
        {
          id: "o3",
          word: "bee",
          visual: ic("bee", "A bee with a striped body and wings"),
          say: "Look at the bee. Say a word that rhymes with bee. A silly word is fine.",
          grownUp: {
            ask: "Ask: What word ends like bee?",
            notice: "Words such as tree, see, me or a silly word all count.",
          },
        },
      ],
    },
  ],
  supports: {
    ee: {
      frames: ["___ and ___ rhyme."],
      oral: "Say the picture's name. Say each choice. Which one ends the same?",
      directions: "Tap a picture to hear its name. Tap the one that rhymes.",
    },
    dev: { frames: ["___ and ___ rhyme.", "The ends sound the same."] },
    exp: { frames: ["___ and ___ rhyme because the ends are the same."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a grown-up two words that rhyme.",
    frames: fr(
      ["___ and ___ rhyme.", "I heard ___."],
      ["___ and ___ rhyme because they end the same.", "I picked ___."],
      ["I know ___ and ___ rhyme because the ends sound the same."],
      ["I listened to the ending sound of ___ to find a rhyme."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
