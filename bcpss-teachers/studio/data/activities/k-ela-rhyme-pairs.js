// Kindergarten visual-match: each picture card waits for the word that rhymes with the picture's name.
// Chips are spoken aloud when picked, so no reading is needed. Rhymes are about the ENDING sound.
const pic = (icon, alt) => ({ kind: "icon", name: icon, alt });

const pairs = [
  {
    id: "hat",
    term: "hat",
    visual: pic("cat", "A cat sitting up and looking at you"),
    example: "It was cold, so the cat put on a hat.",
    why: "Cat and hat both end with the sound at.",
    hints: [
      "Say the name of the picture slowly.",
      "Listen to the end of the word, not the start.",
      "Look for a word that ends the way mat and sat end.",
    ],
    confusions: [
      {
        pick: "car",
        tag: "same-beginning",
        hint: "That word starts like cat. Rhymes match at the end, so listen to the end.",
      },
    ],
    transfer: {
      prompt: "Which word rhymes with cat?",
      options: [
        { id: "a", text: "mat" },
        { id: "b", text: "cup" },
      ],
      answer: "a",
      explain: "Cat and mat both end with the sound at.",
    },
  },
  {
    id: "frog",
    term: "frog",
    visual: pic("dog", "A dog standing and looking at you"),
    example: "The dog saw a green frog hop by the log.",
    why: "Dog and frog both end with the sound og.",
    hints: [
      "Say the name of the picture slowly.",
      "Listen to the end of the word, the part that is the same.",
      "Think of an animal that hops and ends like log.",
    ],
    confusions: [
      {
        pick: "dish",
        tag: "same-beginning",
        hint: "That word starts like dog. Rhymes match at the end of the word.",
      },
    ],
    transfer: {
      prompt: "Which word rhymes with dog?",
      options: [
        { id: "a", text: "log" },
        { id: "b", text: "dig" },
      ],
      answer: "a",
      explain: "Dog and log both end with the sound og.",
    },
  },
  {
    id: "tree",
    term: "tree",
    visual: pic("bee", "A bee with striped body and wings"),
    example: "The bee flew up and sat in a tree.",
    why: "Bee and tree both end with the sound ee.",
    hints: [
      "Say the name of the picture and stretch the end.",
      "The end of the word is a long ee sound.",
      "Look for a tall plant with branches that ends with ee.",
    ],
    confusions: [
      {
        pick: "dish",
        tag: "same-beginning",
        hint: "That word starts with a b-like pop in some voices, but rhymes match at the end. Listen again.",
      },
    ],
  },
  {
    id: "car",
    term: "car",
    visual: pic("star", "A bright star with five points"),
    example: "Dad drove the car to see the star.",
    why: "Star and car both end with the sound ar.",
    hints: [
      "Say the name of the picture slowly.",
      "Listen to the end of the word: it sounds like ar.",
      "Think of something with wheels that ends the way far ends.",
    ],
    confusions: [
      {
        pick: "spoon",
        tag: "same-beginning",
        hint: "That word starts with an s sound like star. Rhymes match at the end.",
      },
    ],
  },
  {
    id: "wig",
    term: "wig",
    visual: pic("pig", "A pink pig standing sideways"),
    example: "The pig put on a curly wig that looked like hair.",
    why: "Pig and wig both end with the sound ig.",
    hints: [
      "Say the name of the picture slowly.",
      "Listen to the end of the word: ig.",
      "Look for something made of hair that ends like big.",
    ],
    confusions: [
      {
        pick: "spoon",
        tag: "same-beginning",
        hint: "Both start with a puff of air, but rhymes match at the end.",
      },
    ],
  },
  {
    id: "dish",
    term: "dish",
    visual: pic("fish", "A fish swimming sideways"),
    example: "Mom served the fish on a dish.",
    why: "Fish and dish both end with the sound ish.",
    hints: [
      "Say the name of the picture slowly.",
      "Listen to the end: ish.",
      "Think of something you put food on that ends like wish.",
    ],
    confusions: [
      {
        pick: "frog",
        tag: "same-beginning",
        hint: "That word starts like fish with an f-like blow. Rhymes match at the end.",
      },
    ],
  },
  {
    id: "spoon",
    term: "spoon",
    visual: pic("moon", "A glowing moon in the night sky"),
    example: "I ate my soup with a spoon under the moon.",
    why: "Moon and spoon both end with the sound oon.",
    hints: [
      "Say the name of the picture slowly.",
      "Listen to the end: oon.",
      "Look for a tool for eating soup that ends like soon.",
    ],
    confusions: [
      {
        pick: "car",
        tag: "different-ending",
        hint: "That word ends in a different sound. Say both words and listen to the last part.",
      },
    ],
  },
  {
    id: "train",
    term: "train",
    visual: pic("rain", "Gray clouds with raindrops falling"),
    example: "We went to the station and got on the train in the rain.",
    why: "Rain and train both end with the sound ain.",
    hints: [
      "Say the name of the picture slowly.",
      "Listen to the end: ain.",
      "Think of a long ride on tracks that ends like main.",
    ],
    confusions: [
      {
        pick: "tree",
        tag: "same-beginning",
        hint: "That word has an r sound like rain, but rhymes match the very end.",
      },
    ],
  },
];

export default {
  id: "k-ela-rhyme-pairs",
  engine: "visual-match",
  title: "Which word rhymes with the picture?",
  grade: "K",
  band: "k-2",
  subject: "ela",
  lessonId: "k-ela-rhyme-and-syllables",
  standards: ["RF.K.2a"],
  vocabIds: ["rhyme", "pair", "same", "ending-sound"],
  minutes: 8,
  intro:
    "Look at each picture and say its name. Then find the word that sounds the same at the end.",
  modes: ["term-visual", "term-example"],
  pairs,
  distractors: [
    {
      id: "cap",
      term: "cap",
      tag: "same-beginning",
      hint: "That word starts the way a picture name starts. Rhymes match at the end of the word.",
    },
    {
      id: "pan",
      term: "pan",
      tag: "same-beginning",
      hint: "Those two start with the same first sound. Listen for the same ending instead.",
    },
  ],
  supports: {
    ee: {
      frames: ["___ and ___ rhyme."],
      oral: "Say the picture's name. Say the word on the chip. Do the ends sound the same?",
      directions: "Tap a word to hear it. Then tap the picture it rhymes with.",
    },
    dev: {
      frames: ["___ and ___ rhyme.", "They sound the same at the end."],
      oral: "Say both words to your partner before you choose.",
    },
    exp: { frames: ["___ and ___ rhyme because the ends are the same."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a partner one pair of words that rhyme.",
    frames: {
      ee: ["___ and ___ rhyme.", "I heard ___."],
      dev: ["___ and ___ rhyme because they end the same.", "I matched ___ with ___."],
      exp: ["I know ___ and ___ rhyme because the ends sound the same."],
      br: ["I listened to the ending sound of ___ to find a word that rhymes."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
