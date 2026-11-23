// Concept Builder (label-diagram, grade 1 ELA): put the letters of a short vowel word into its three sound boxes, left to right.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

/** A picture above three empty sound boxes. Boxes are centred at x 105, 240 and 375, y 205. */
const boxes = (icon, alt) => ({
  kind: "shapes",
  alt,
  longDesc: `${alt} Below the picture are three empty boxes in a row, numbered one, two and three from left to right.`,
  w: 480,
  h: 320,
  items: [
    { t: "icon", name: icon, x: 190, y: 10, s: 110 },
    ...[50, 185, 320].map((x) => ({
      t: "rect",
      x,
      y: 150,
      w: 110,
      h: 110,
      rx: 10,
      fill: "paper",
      stroke: "navy",
      sw: 4,
    })),
  ],
});

const spots = (a, b, c) => [
  { id: "h1", x: 105, y: 205, answer: a },
  { id: "h2", x: 240, y: 205, answer: b },
  { id: "h3", x: 375, y: 205, answer: c },
];

const lab = (...texts) =>
  texts.map((text, i) => ({
    id: text,
    text,
    ...(i === texts.length - 1 ? { distractor: true } : {}),
  }));

const supports = (word) => ({
  ee: {
    frames: ["The first sound is ___.", "The middle sound is ___.", "The last sound is ___."],
    wordBank: ["first", "middle", "last", "sound"],
    directions:
      "Tap a letter. Then tap a box. Go from left to right. Say each sound as you place it.",
    oral: `Say the picture's word slowly. Touch a finger to each box as you say a sound.`,
  },
  dev: {
    frames: ["I put ___ first because it is the first sound.", "The middle sound is ___."],
    wordBank: ["blend", "vowel"],
  },
  exp: {
    frames: ["The sounds go ___, ___, ___ from left to right, and blended they say " + word + "."],
  },
  br: {},
});

const explain = (extra = []) => ({
  prompt: "How did you sound out the word to fill the boxes?",
  frames: fr(
    ["I said the ___.", "The first sound is ___."],
    ["I said each sound slowly, then I put the letters in the boxes."],
    [
      "I stretched the word, found each sound from left to right, and matched a letter to each box.",
    ],
    [
      "I segmented the word into three sounds and placed one letter in each box, with the vowel in the middle.",
    ],
  ),
  mustMention: [
    {
      id: "sounds",
      label: "saying the sounds",
      any: ["sound", "said", "say", "slow", "stretch", "first", "middle", "last"],
    },
    ...extra,
  ],
  criteria: [
    { id: "c1", label: "I said how I found the sounds." },
    { id: "c2", label: "I told what is in the middle box." },
  ],
});

const task = ({ id, picture, alt, letters, hints, model, miss, answerText }) => ({
  id,
  prompt: "Say the picture's word slowly. Put one letter in each box, from left to right.",
  goal: "All three boxes have the right letters",
  setup: {
    visual: boxes(picture, alt),
    labels: lab(...letters),
    hotspots: spots(letters[0], letters[1], letters[2]),
  },
  target: { placed: { h1: letters[0], h2: letters[1], h3: letters[2] } },
  check: { type: "equals", of: "correct", value: "3" },
  answerText,
  hints,
  misconceptions: miss,
  model,
  right: "Each box has one sound, and the vowel is in the middle.",
  supports: supports(answerText),
  explain: explain(),
});

export default {
  id: "g1-ela-sound-boxes",
  engine: "concept-builder",
  kind: "label-diagram",
  title: "Sound boxes: one letter for every sound",
  grade: "1",
  band: "k-2",
  subject: "ela",
  lessonId: "g1-ela-sound-out-short-vowel-words",
  standards: ["RF.1.2d", "RF.1.3b"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RF.1.2d and RF.1.3b; not mapped to a district unit sequence. Tasks are original.",
  },
  vocabIds: ["sound-box", "cvc-word", "short-vowel", "blend", "sound-out"],
  minutes: 12,
  intro:
    "Every word is made of sounds. Say the word slowly, then put one letter in each sound box. The spots go left to right: 1, 2, 3.",
  model: {
    visual: boxes("cat", "A cat sitting up."),
    labels: lab("c", "a", "t", "e"),
    hotspots: spots("c", "a", "t"),
  },
  tasks: [
    task({
      id: "t1-cat",
      picture: "cat",
      alt: "A cat sitting up.",
      letters: ["c", "a", "t", "e"],
      answerText: "cat",
      hints: [
        "Say the picture's word very slowly. What sound do you hear first?",
        "Say the word again. Listen for the sound right in the middle. It is a vowel.",
        "The last sound is the one you hear at the start of the word top.",
      ],
      model:
        "Say it slowly: the first sound is c, the middle sound is a, the last sound is t. Put c in box 1, a in box 2 and t in box 3.",
      miss: [
        {
          match: "vowel-swap",
          when: { type: "equals", of: "placed[h2]", value: "e" },
          hint: "Stretch the middle of the word. Does your mouth say the sound of egg?",
          model: "The middle sound of this word is the same as the first sound in apple.",
        },
        {
          match: "backwards",
          when: { type: "equals", of: "placed[h1]", value: "t" },
          hint: "Say the word again. Which sound comes out of your mouth first?",
          model: "Sounds go in order from left to right, the same order you say them.",
        },
      ],
    }),
    task({
      id: "t2-pig",
      picture: "pig",
      alt: "A pink pig standing sideways.",
      letters: ["p", "i", "g", "e"],
      answerText: "pig",
      hints: [
        "Say the picture's word slowly. Which sound comes first?",
        "The middle sound is a vowel. Say it by itself.",
        "The last sound is the one at the start of the word goat.",
      ],
      model:
        "Say it slowly: the first sound is p, the middle sound is i, the last sound is g. Put p in box 1, i in box 2 and g in box 3.",
      miss: [
        {
          match: "vowel-swap",
          when: { type: "equals", of: "placed[h2]", value: "e" },
          hint: "Say the middle sound again. Does it match the sound at the start of egg or igloo?",
          model: "The middle sound of this word is the same as the first sound in igloo.",
        },
        {
          match: "backwards",
          when: { type: "equals", of: "placed[h1]", value: "g" },
          hint: "Say the word slowly. Which sound do you say first?",
          model: "Sounds go in order from left to right, the same order you say them.",
        },
      ],
    }),
    task({
      id: "t3-sun",
      picture: "sun",
      alt: "A round yellow sun with rays.",
      letters: ["s", "u", "n", "o"],
      answerText: "sun",
      hints: [
        "Say the picture's word slowly and stretch the first sound.",
        "The middle sound is a vowel. It is the same as the first sound in umbrella.",
        "The last sound is the one at the start of the word nest.",
      ],
      model:
        "Say it slowly: the first sound is s, the middle sound is u, the last sound is n. Put s in box 1, u in box 2 and n in box 3.",
      miss: [
        {
          match: "vowel-swap",
          when: { type: "equals", of: "placed[h2]", value: "o" },
          hint: "Say the middle sound again. Does it match octopus or umbrella?",
          model: "The middle sound of this word is the same as the first sound in umbrella.",
        },
        {
          match: "backwards",
          when: { type: "equals", of: "placed[h1]", value: "n" },
          hint: "Say the word slowly. Which sound do you say first?",
          model: "Sounds go in order from left to right, the same order you say them.",
        },
      ],
    }),
    task({
      id: "t4-dog",
      picture: "dog",
      alt: "A dog standing and looking at you.",
      letters: ["d", "o", "g", "a"],
      answerText: "dog",
      hints: [
        "Say the picture's word slowly and listen for each sound.",
        "The middle sound is a vowel. It matches the first sound in octopus.",
        "The last sound is the one you hear at the start of the word goat.",
      ],
      model:
        "Say it slowly: the first sound is d, the middle sound is o, the last sound is g. Put d in box 1, o in box 2 and g in box 3.",
      miss: [
        {
          match: "vowel-swap",
          when: { type: "equals", of: "placed[h2]", value: "a" },
          hint: "Say the middle sound again. Does it match apple or octopus?",
          model: "The middle sound of this word is the same as the first sound in octopus.",
        },
        {
          match: "backwards",
          when: { type: "equals", of: "placed[h1]", value: "g" },
          hint: "Say the word slowly. Which sound do you say first?",
          model: "Sounds go in order from left to right, the same order you say them.",
        },
      ],
    }),
  ],
  reflection: {
    prompt: "What do you do to sound out a word?",
    frames: fr(
      ["I say the sounds.", "I put a letter in each box."],
      ["I say each sound slowly and then I blend them.", "The vowel goes in the middle."],
      ["To sound out a word I stretch it, find each sound and match a letter to it."],
      ["I segment the word into sounds, match each to a letter, and then blend them to check."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
