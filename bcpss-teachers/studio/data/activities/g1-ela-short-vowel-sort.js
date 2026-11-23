// Early Sort (grade 1): sort picture words by the short vowel sound in the middle. Every word is spoken, so reading is not required.
const ic = (name, alt) => ({ kind: "icon", name, alt });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const letterCard = (letter, alt) => ({
  kind: "shapes",
  alt,
  w: 160,
  h: 160,
  items: [
    { t: "circle", cx: 80, cy: 80, r: 66, fill: "paper", stroke: "navy", sw: 5 },
    { t: "text", x: 80, y: 108, text: letter, size: 86, weight: 700, fill: "navy" },
  ],
});

const hat = {
  kind: "shapes",
  alt: "A hat with a round top, a dark band and a wide flat brim",
  w: 480,
  h: 320,
  items: [
    { t: "rect", x: 160, y: 80, w: 160, h: 130, rx: 24, fill: "ochre", stroke: "ink", sw: 4 },
    { t: "rect", x: 160, y: 160, w: 160, h: 28, fill: "navy" },
    { t: "ellipse", cx: 240, cy: 214, rx: 150, ry: 30, fill: "ochre", stroke: "ink", sw: 4 },
  ],
};
const pot = {
  kind: "shapes",
  alt: "A cooking pot with two handles and a lid with a round knob",
  w: 480,
  h: 320,
  items: [
    { t: "rect", x: 50, y: 150, w: 60, h: 24, rx: 12, fill: "navy", stroke: "ink", sw: 3 },
    { t: "rect", x: 370, y: 150, w: 60, h: 24, rx: 12, fill: "navy", stroke: "ink", sw: 3 },
    { t: "rect", x: 100, y: 130, w: 280, h: 150, rx: 30, fill: "navy", stroke: "ink", sw: 4 },
    { t: "rect", x: 90, y: 112, w: 300, h: 26, rx: 10, fill: "line", stroke: "ink", sw: 4 },
    { t: "circle", cx: 240, cy: 98, r: 16, fill: "coral", stroke: "ink", sw: 3 },
  ],
};
const bed = {
  kind: "shapes",
  alt: "A bed with a wooden headboard, a white pillow and a coral blanket",
  w: 480,
  h: 320,
  items: [
    { t: "rect", x: 50, y: 100, w: 36, h: 170, rx: 6, fill: "ochre", stroke: "ink", sw: 4 },
    { t: "rect", x: 400, y: 160, w: 30, h: 110, rx: 6, fill: "ochre", stroke: "ink", sw: 4 },
    { t: "rect", x: 70, y: 180, w: 340, h: 60, rx: 8, fill: "sky", stroke: "ink", sw: 4 },
    { t: "ellipse", cx: 140, cy: 168, rx: 52, ry: 24, fill: "paper", stroke: "ink", sw: 4 },
    { t: "rect", x: 200, y: 168, w: 200, h: 44, rx: 8, fill: "coral", stroke: "ink", sw: 4 },
  ],
};
const web = {
  kind: "shapes",
  alt: "A round spider web with threads that go out from the middle and circles around it",
  w: 480,
  h: 320,
  items: [
    { t: "line", x1: 240, y1: 30, x2: 240, y2: 290, stroke: "ink", sw: 3 },
    { t: "line", x1: 110, y1: 160, x2: 370, y2: 160, stroke: "ink", sw: 3 },
    { t: "line", x1: 148, y1: 68, x2: 332, y2: 252, stroke: "ink", sw: 3 },
    { t: "line", x1: 332, y1: 68, x2: 148, y2: 252, stroke: "ink", sw: 3 },
    { t: "circle", cx: 240, cy: 160, r: 40, fill: "none", stroke: "navy", sw: 3 },
    { t: "circle", cx: 240, cy: 160, r: 80, fill: "none", stroke: "navy", sw: 3 },
    { t: "circle", cx: 240, cy: 160, r: 120, fill: "none", stroke: "navy", sw: 3 },
  ],
};
const log = {
  kind: "shapes",
  alt: "A brown log lying on its side with rings on the cut end",
  w: 480,
  h: 320,
  items: [
    { t: "rect", x: 70, y: 100, w: 310, h: 120, rx: 14, fill: "ochre", stroke: "ink", sw: 4 },
    { t: "ellipse", cx: 380, cy: 160, rx: 32, ry: 60, fill: "paper", stroke: "ink", sw: 4 },
    { t: "ellipse", cx: 380, cy: 160, rx: 18, ry: 34, fill: "none", stroke: "ink", sw: 3 },
    { t: "line", x1: 110, y1: 130, x2: 330, y2: 130, stroke: "ink", sw: 2 },
    { t: "line", x1: 110, y1: 190, x2: 330, y2: 190, stroke: "ink", sw: 2 },
  ],
};

const anchors = {
  a: "apple",
  e: "egg",
  i: "igloo",
  o: "octopus",
  u: "umbrella",
};

/** Three graduated hints that point at the middle sound and a picture word, never at the answer category. */
const hints = (vowel) => [
  "Say the word slowly. Listen to the sound in the middle.",
  "Stretch the middle sound. Say it, then say the word " + anchors[vowel] + ".",
  "Does the middle sound of the picture match the first sound of " + anchors[vowel] + "?",
];

const item = (id, word, visual, category, vowel, confusions) => {
  const model = `Say ${word} slowly. The middle sound is the same as the first sound in ${anchors[vowel]}.`;
  return {
    id,
    word,
    visual,
    category,
    say: word,
    hints: hints(vowel),
    model,
    // The engine shows a misconception's own line before the item model, so the model is repeated on each one.
    misconceptions: confusions.map(([pick, tag, hint]) => ({ pick, tag, hint, model })),
  };
};


export default {
  id: "g1-ela-short-vowel-sort",
  engine: "early-sort",
  title: "Sort words by the middle sound",
  grade: "1",
  band: "k-2",
  subject: "ela",
  lessonId: "g1-ela-sound-out-short-vowel-words",
  standards: ["RF.1.2c"],
  vocabIds: ["sound", "vowel", "short-vowel", "cvc-word"],
  minutes: 10,
  intro:
    "Let's listen to the middle of words. Each word goes in the home that matches its middle sound.",
  grownUp: {
    ask: "Say the word slowly and ask, 'What sound do you hear in the middle?'",
    notice:
      "Does your child listen to the first sound or the middle sound? Stretch the middle sound and say it together.",
  },
  rounds: [
    {
      id: "r1",
      mode: "picture-sort",
      title: "Short a, short i or short u",
      prompt: "Say the word. Listen to the middle sound. Pick its home.",
      grownUp: { ask: "Ask your child to say the word slowly before choosing a home." },
      categories: [
        {
          id: "a",
          label: "short a",
          say: "short a, like apple",
          visual: letterCard("a", "The letter a"),
        },
        {
          id: "i",
          label: "short i",
          say: "short i, like igloo",
          visual: letterCard("i", "The letter i"),
        },
        {
          id: "u",
          label: "short u",
          say: "short u, like umbrella",
          visual: letterCard("u", "The letter u"),
        },
      ],
      items: [
        item("cat", "cat", ic("cat", "A cat sitting up"), "a", "a", [
          ["i", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
          ["u", "vowel-confusion", "Try another spot. Listen to the middle once more."],
        ]),
        item("hat", "hat", hat, "a", "a", [
          ["i", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
        item("pig", "pig", ic("pig", "A pink pig standing sideways"), "i", "i", [
          ["a", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
          ["u", "vowel-confusion", "Try another spot. Listen to the middle once more."],
        ]),
        item("kid", "kid", ic("student", "A child standing with a backpack"), "i", "i", [
          ["a", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
        item("sun", "sun", ic("sun", "A round yellow sun with rays"), "u", "u", [
          ["a", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
          ["i", "vowel-confusion", "Try another spot. Listen to the middle once more."],
        ]),
        item("bus", "bus", ic("bus", "A yellow school bus"), "u", "u", [
          ["i", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
        item("bug", "bug", ic("ladybug", "A red ladybug, a small bug with black spots"), "u", "u", [
          ["a", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
        item("cup", "cup", ic("measuring-cup", "A cup with a handle"), "u", "u", [
          [
            "a",
            "same-beginning",
            "Try another spot. Do not listen to the first sound. Listen to the middle.",
          ],
          ["i", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
      ],
    },
    {
      id: "r2",
      mode: "picture-sort",
      title: "Short e or short o",
      prompt: "Say the word. Listen to the middle sound. Pick its home.",
      grownUp: {
        ask: "Ask: Which words have the same middle sound?",
        notice:
          "Short e and short i can sound close in some voices. Slow the word down and compare it with egg.",
      },
      categories: [
        {
          id: "e",
          label: "short e",
          say: "short e, like egg",
          visual: letterCard("e", "The letter e"),
        },
        {
          id: "o",
          label: "short o",
          say: "short o, like octopus",
          visual: letterCard("o", "The letter o"),
        },
      ],
      items: [
        item("bed", "bed", bed, "e", "e", [
          ["o", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
        item("jet", "jet", ic("airplane", "A jet airplane flying"), "e", "e", [
          ["o", "vowel-confusion", "Try another spot. Listen to the middle once more."],
        ]),
        item("web", "web", web, "e", "e", [
          ["o", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
        item("dog", "dog", ic("dog", "A dog standing and looking at you"), "o", "o", [
          ["e", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
        item("pot", "pot", pot, "o", "o", [
          ["e", "vowel-confusion", "Try another spot. Listen to the middle once more."],
        ]),
        item("log", "log", log, "o", "o", [
          ["e", "vowel-confusion", "Try another spot. Stretch the middle sound again."],
        ]),
      ],
    },
    {
      id: "r3",
      mode: "oral-describe",
      title: "Say the sounds",
      prompt: "Look at the picture. Say each sound, then say the word.",
      supports: {
        ee: {
          frames: ["The sounds are ___, ___, ___."],
          oral: "Touch one finger for each sound. Say the sounds, then the word.",
        },
        dev: { frames: ["The sounds are ___, ___, ___.", "The word is ___."] },
        exp: { frames: ["The middle sound is ___, so the word is ___."] },
        br: {},
      },
      items: [
        {
          id: "o1",
          word: "pig",
          visual: ic("pig", "A pink pig standing sideways"),
          say: "Say each sound in pig. Then say the whole word.",
          grownUp: { ask: "Ask: What is the middle sound?", notice: "The sounds are p, i, g." },
        },
        {
          id: "o2",
          word: "bus",
          visual: ic("bus", "A yellow school bus"),
          say: "Say each sound in bus. Then say the whole word.",
          grownUp: { ask: "Ask: What is the middle sound?", notice: "The sounds are b, u, s." },
        },
        {
          id: "o3",
          word: "hat",
          visual: hat,
          say: "Say each sound in hat. Then say the whole word.",
          grownUp: { ask: "Ask: What is the middle sound?", notice: "The sounds are h, a, t." },
        },
      ],
    },
  ],
  supports: {
    ee: {
      frames: ["___ has the middle sound ___."],
      oral: "Say the word slowly. Stretch the middle sound. Match it to the home.",
      directions: "Tap a picture to hear its word. Tap the home with the same middle sound.",
    },
    dev: { frames: ["___ has the middle sound ___.", "I listened to the middle."] },
    exp: { frames: ["I put ___ in this home because the middle sound is ___."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a grown-up one word and its middle sound.",
    write: false,
    frames: fr(
      ["The word is ___.", "The middle sound is ___."],
      ["___ has the middle sound ___.", "I listened to the middle."],
      ["I know the middle sound of ___ is ___ because I stretched the word."],
      ["I sorted ___ by its middle sound, ___, not by the letter it starts with."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

