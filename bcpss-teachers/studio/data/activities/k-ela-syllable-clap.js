// Early Sort (kindergarten): clap the syllables of a picture's name, then sort pictures by how many claps they have.
const ic = (name, alt) => ({ kind: "icon", name, alt });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const hands = (n, alt) => ({
  kind: "scene",
  bg: "plain",
  alt,
  items: Array.from({ length: n }, (_, i) => ({
    icon: "hand",
    x: 195 + (i - (n - 1) / 2) * 110,
    y: 115,
    s: 90,
  })),
});

const clapItems = [
  {
    id: "c-dog",
    word: "dog",
    visual: ic("dog", "A dog standing and looking at you"),
    syllables: ["dog"],
    say: "Let's clap dog.",
    hints: [
      "Say the word slowly. Feel your chin.",
      "Does your chin drop one time or more than one time?",
      "Count how many beats the word has, then tap that many.",
    ],
    model: "Dog is one beat, so it is one clap.",
  },
  {
    id: "c-rabbit",
    word: "rabbit",
    visual: ic("rabbit", "A rabbit with long ears"),
    syllables: ["rab", "bit"],
    say: "Let's clap rabbit.",
    hints: [
      "Say the word slowly and put a hand under your chin.",
      "Say it again. Listen for a break in the middle.",
      "The word has a first part and a last part.",
    ],
    model: "Rab, bit. Rabbit has two beats, so it is two claps.",
  },
  {
    id: "c-ladybug",
    word: "ladybug",
    visual: ic("ladybug", "A red ladybug with black spots"),
    syllables: ["la", "dy", "bug"],
    say: "Let's clap ladybug.",
    hints: [
      "Say the word slowly, one part at a time.",
      "Listen for a first part, a middle part and a last part.",
      "The word starts with la and ends with a part like rug.",
    ],
    model: "La, dy, bug. Ladybug has three beats, so it is three claps.",
  },
  {
    id: "c-butterfly",
    word: "butterfly",
    visual: ic("butterfly", "A butterfly with open wings"),
    syllables: ["but", "ter", "fly"],
    say: "Let's clap butterfly.",
    hints: [
      "Say the word slowly and feel your chin drop.",
      "Start with the part that begins like bus.",
      "The parts are but, then ter, then one more part.",
    ],
    model: "But, ter, fly. Butterfly has three beats, so it is three claps.",
  },
  {
    id: "c-banana",
    word: "banana",
    visual: ic("banana", "A yellow banana"),
    syllables: ["ba", "na", "na"],
    say: "Let's clap banana.",
    hints: [
      "Say the word slowly, one part at a time.",
      "The end of the word has parts that sound the same.",
      "Say ba, then na, then one more part that sounds like the one before.",
    ],
    model: "Ba, na, na. Banana has three beats, so it is three claps.",
  },
  {
    id: "c-watermelon",
    word: "watermelon",
    visual: ic("watermelon", "A slice of red watermelon with seeds"),
    syllables: ["wa", "ter", "mel", "on"],
    say: "Let's clap watermelon.",
    hints: [
      "This is a long word. Say it slowly in small pieces.",
      "Water is the first part of the word. How many beats are in water?",
      "After water, the last part sounds like melon. Count that too.",
    ],
    model: "Wa, ter, mel, on. Watermelon has four beats, so it is four claps.",
  },
  {
    id: "c-helicopter",
    word: "helicopter",
    visual: ic("helicopter", "A helicopter with spinning blades"),
    syllables: ["hel", "i", "cop", "ter"],
    say: "Let's clap helicopter.",
    hints: [
      "This is a long word. Say it slowly in small pieces.",
      "The first part sounds like hell without the last sound. Keep going from there.",
      "The word ends with the same part as water does.",
    ],
    model: "Hel, i, cop, ter. Helicopter has four beats, so it is four claps.",
  },
];

const sortItem = (id, word, icon, alt, category, hints, model) => ({
  id,
  word,
  visual: ic(icon, alt),
  category,
  say: word,
  hints,
  model,
});

export default {
  id: "k-ela-syllable-clap",
  engine: "early-sort",
  title: "Clap the parts of a word",
  grade: "K",
  band: "k-2",
  subject: "ela",
  lessonId: "k-ela-rhyme-and-syllables",
  standards: ["RF.K.2b"],
  vocabIds: ["syllable", "clap", "word", "listen"],
  minutes: 9,
  intro: "Let's clap the parts of words together. Each part is one clap.",
  grownUp: {
    ask: "Say the word slowly and put a hand under your chin. Ask, 'How many times did your chin drop?'",
    notice:
      "Does your child clap once for the whole word or once for every letter? Stretch the word and clap along.",
  },
  rounds: [
    {
      id: "r1",
      mode: "syllable-clap",
      title: "Clap it",
      prompt: "Say the word. Tap once for each part.",
      grownUp: { ask: "Say the word with your child before they tap." },
      items: clapItems,
    },
    {
      id: "r2",
      mode: "picture-sort",
      title: "How many claps?",
      prompt: "Clap the word. Put the picture where its claps belong.",
      grownUp: {
        ask: "Ask your child to clap each word before choosing a spot.",
        notice:
          "Children may hear a word like 'turtle' as one beat. Say it slowly and clap it with them.",
      },
      categories: [
        {
          id: "one",
          label: "1 clap",
          say: "one clap",
          visual: hands(1, "One open hand, meaning one clap"),
        },
        {
          id: "two",
          label: "2 claps",
          say: "two claps",
          visual: hands(2, "Two open hands, meaning two claps"),
        },
        {
          id: "three",
          label: "3 claps",
          say: "three claps",
          visual: hands(3, "Three open hands, meaning three claps"),
        },
      ],
      items: [
        sortItem(
          "s-cat",
          "cat",
          "cat",
          "A cat sitting up",
          "one",
          [
            "Say the word slowly. Feel your chin.",
            "Does your chin drop one time or more?",
            "Count the beats and choose the spot with that many hands.",
          ],
          "Cat is one beat, so it goes with one hand.",
        ),
        sortItem(
          "s-fish",
          "fish",
          "fish",
          "A fish swimming sideways",
          "one",
          [
            "Say the word slowly and put a hand under your chin.",
            "Feel how many times your chin drops.",
            "Count the beats and choose the spot with that many hands.",
          ],
          "Fish is one beat, so it goes with one hand.",
        ),
        sortItem(
          "s-apple",
          "apple",
          "apple",
          "A red apple",
          "two",
          [
            "Say the word slowly. Listen for a break in the middle.",
            "Say it again and feel your chin.",
            "Count the beats and choose the spot with that many hands.",
          ],
          "Ap, ple. Apple is two beats, so it goes with two hands.",
        ),
        sortItem(
          "s-pencil",
          "pencil",
          "pencil",
          "A yellow pencil",
          "two",
          [
            "Say the word slowly and clap each part.",
            "Listen for a break in the middle.",
            "Count the beats and choose the spot with that many hands.",
          ],
          "Pen, cil. Pencil is two beats, so it goes with two hands.",
        ),
        sortItem(
          "s-turtle",
          "turtle",
          "turtle",
          "A green turtle with a round shell",
          "two",
          [
            "Say the word slowly and stretch it out.",
            "Listen for a first part and a last part.",
            "Count the beats and choose the spot with that many hands.",
          ],
          "Tur, tle. Turtle is two beats, so it goes with two hands.",
        ),
        sortItem(
          "s-banana",
          "banana",
          "banana",
          "A yellow banana",
          "three",
          [
            "Say the word slowly and put a hand under your chin.",
            "Listen for a beginning, a middle and an end.",
            "Count the beats and choose the spot with that many hands.",
          ],
          "Ba, na, na. Banana is three beats, so it goes with three hands.",
        ),
        sortItem(
          "s-elephant",
          "elephant",
          "elephant",
          "A gray elephant with a long trunk",
          "three",
          [
            "Say the word slowly, one part at a time.",
            "Listen for a beginning, a middle and an end.",
            "Count the beats and choose the spot with that many hands.",
          ],
          "El, e, phant. Elephant is three beats, so it goes with three hands.",
        ),
        sortItem(
          "s-umbrella",
          "umbrella",
          "umbrella",
          "An open umbrella",
          "three",
          [
            "Say the word slowly and clap each part.",
            "Listen for a beginning, a middle and an end.",
            "Count the beats and choose the spot with that many hands.",
          ],
          "Um, brel, la. Umbrella is three beats, so it goes with three hands.",
        ),
      ],
    },
    {
      id: "r3",
      mode: "oral-describe",
      title: "Clap and say",
      prompt: "Look at the picture. Clap it and say how many claps.",
      supports: {
        ee: {
          frames: ["___ has ___ claps."],
          oral: "Say the word. Clap it. Hold up your fingers for the claps.",
        },
        dev: { frames: ["___ has ___ claps.", "I clapped ___ times."] },
        exp: { frames: ["___ has ___ syllables because I clapped ___ times."] },
        br: {},
      },
      items: [
        {
          id: "o1",
          word: "bicycle",
          visual: ic("bicycle", "A bicycle with two wheels"),
          say: "Clap the word bicycle with me. How many claps?",
          grownUp: {
            ask: "Ask: How many claps did you hear?",
            notice: "By, si, cle is three claps.",
          },
        },
        {
          id: "o2",
          word: "sunflower",
          visual: ic("sunflower", "A tall sunflower with a big yellow face"),
          say: "Clap the word sunflower with me. How many claps?",
          grownUp: {
            ask: "Ask: How many claps did you hear?",
            notice: "Sun, flow, er is three claps.",
          },
        },
      ],
    },
  ],
  supports: {
    ee: {
      frames: ["___ has ___ claps."],
      oral: "Say the word. Put a hand under your chin. Tap once each time your chin drops.",
      directions: "Tap the big clap pad once for each part. Then tap That's all.",
    },
    dev: { frames: ["___ has ___ claps.", "I clapped ___ times."] },
    exp: { frames: ["___ has ___ syllables because I clapped ___ times."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a grown-up a word and how many claps it has.",
    frames: fr(
      ["___ has ___ claps.", "I clapped ___."],
      ["___ has ___ claps because I felt my chin drop ___ times."],
      ["I know ___ has ___ syllables because I clapped each part."],
      ["I broke ___ into parts and counted ___ syllables."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
