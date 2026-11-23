// Kindergarten early-sort: count scattered groups, sort them to the matching number, compare two groups aloud,
// then put a "one more" story in order. No reading is needed; every picture and prompt is spoken.
// Pictures are drawn to be read at about 190 pixels wide: few, large icons on a squarish canvas.
const SPOTS = [
  [6, 6],
  [118, 28],
  [226, 4],
  [40, 80],
  [150, 96],
  [236, 76],
  [86, 156],
];
const SIZE = 64;
const group = (icon, n, alt) => ({
  kind: "scene",
  bg: "plain",
  alt,
  w: 300,
  h: 224,
  items: SPOTS.slice(0, n).map(([x, y]) => ({ icon, x, y, s: SIZE })),
});
const dot = (cx, cy, r = 22) => ({ t: "circle", cx, cy, r, fill: "teal", stroke: "ink", sw: 2 });
const homeVisual = (n) => ({
  kind: "shapes",
  alt: `A ten frame with ${n} counters in it and the numeral ${n} above it.`,
  w: 320,
  h: 176,
  items: [
    { t: "text", text: String(n), x: 160, y: 30, size: 44, weight: 700 },
    { t: "rect", x: 10, y: 46, w: 300, h: 120, fill: "surface", stroke: "ink", sw: 3 },
    { t: "line", x1: 10, y1: 106, x2: 310, y2: 106, sw: 3 },
    ...[1, 2, 3, 4].map((i) => ({ t: "line", x1: 10 + i * 60, y1: 46, x2: 10 + i * 60, y2: 166, sw: 3 })),
    ...Array.from({ length: n }, (_, i) => dot(40 + (i % 5) * 60, 76 + Math.floor(i / 5) * 60)),
  ],
});
// Two groups stacked: the first on top, the second below a dashed line. Rows of five, icons 52 wide.
const row = (icon, n, y0) =>
  Array.from({ length: n }, (_, i) => ({ icon, x: 5 + (i % 5) * 58, y: y0 + Math.floor(i / 5) * 56, s: 52 }));
const pair = (a, b, alt) => ({
  kind: "scene",
  bg: "plain",
  alt,
  w: 300,
  h: 246,
  items: [
    ...row(a[0], a[1], 4),
    { t: "line", x1: 6, y1: 123, x2: 294, y2: 123, sw: 3, dash: "6 6" },
    ...row(b[0], b[1], 134),
  ],
});

const items = [
  {
    id: "ducks",
    word: "group of ducks",
    visual: group("duck", 3, "A group of three ducks spread out on the page."),
    category: "c3",
    say: "a group of ducks",
    hints: [
      "Touch each picture once as you count.",
      "Say the last number you counted. That tells how many.",
      "Look at the homes. Which ten frame has that many counters?",
    ],
    misconceptions: [
      {
        pick: "c5",
        tag: "counted-too-many",
        hint: "Try another spot. Did one picture get two touches? Touch each one only once.",
      },
      {
        pick: "c7",
        tag: "counted-too-many",
        hint: "Try another spot. Count again slowly and touch each picture one time.",
      },
    ],
    model: "Let's count together: one, two, three. The last number, three, tells how many ducks.",
  },
  {
    id: "bees",
    word: "group of bees",
    visual: group("bee", 3, "A group of three bees scattered across the page."),
    category: "c3",
    say: "a group of bees",
    hints: [
      "Put a finger on one bee at a time.",
      "Say one number for each bee, in order.",
      "The last number you say is the answer. Find that ten frame.",
    ],
    misconceptions: [
      {
        pick: "c5",
        tag: "counted-too-many",
        hint: "Try another spot. Check that no bee got two numbers.",
      },
      {
        pick: "c7",
        tag: "counted-too-many",
        hint: "Try another spot. Say the numbers slowly and touch each bee once.",
      },
    ],
    model: "Let's count the bees: one, two, three. The last number, three, tells how many.",
  },
  {
    id: "frogs",
    word: "group of frogs",
    visual: group("frog", 5, "A group of five frogs scattered across the page."),
    category: "c5",
    say: "a group of frogs",
    hints: [
      "Count by touching each frog once.",
      "If you lose your place, move each frog you counted to one side.",
      "Say the last number. Then find a home with that many counters.",
    ],
    misconceptions: [
      {
        pick: "c3",
        tag: "stopped-early",
        hint: "Try another spot. Did you touch every frog? Check that none are left.",
      },
      {
        pick: "c7",
        tag: "counted-too-many",
        hint: "Try another spot. Did you count one frog two times?",
      },
    ],
    model:
      "Let's count the frogs: one, two, three, four, five. The last number, five, tells how many.",
  },
  {
    id: "fish",
    word: "group of fish",
    visual: group("fish", 5, "A group of five fish scattered across the page."),
    category: "c5",
    say: "a group of fish",
    hints: [
      "Touch each one just one time as you count.",
      "Say a number for each touch, and do not skip any.",
      "Look at your last number. Which home matches it?",
    ],
    misconceptions: [
      {
        pick: "c3",
        tag: "stopped-early",
        hint: "Try another spot. Look for a fish you did not touch.",
      },
      {
        pick: "c7",
        tag: "counted-too-many",
        hint: "Try another spot. Count again and touch each fish just once.",
      },
    ],
    model:
      "Let's count the fish: one, two, three, four, five. The last number, five, tells how many.",
  },
  {
    id: "ladybugs",
    word: "group of ladybugs",
    visual: group("ladybug", 7, "A group of seven ladybugs scattered across the page."),
    category: "c7",
    say: "a group of ladybugs",
    hints: [
      "Touch each ladybug once. Move on slowly.",
      "Counting a bigger group is easier if you push each one aside after counting it.",
      "Say the last number. Look for the ten frame with that many counters.",
    ],
    misconceptions: [
      {
        pick: "c3",
        tag: "stopped-early",
        hint: "Try another spot. Look for ladybugs you did not touch yet.",
      },
      {
        pick: "c5",
        tag: "stopped-early",
        hint: "Try another spot. Keep going. Is every ladybug counted?",
      },
    ],
    model:
      "Let's count the ladybugs: one, two, three, four, five, six, seven. The last number, seven, tells how many.",
  },
  {
    id: "cats",
    word: "group of cats",
    visual: group("cat", 7, "A group of seven cats scattered across the page."),
    category: "c7",
    say: "a group of cats",
    hints: [
      "Put a finger on each cat, one at a time.",
      "Count out loud. Say one number for each cat.",
      "The last number you say tells how many. Find that home.",
    ],
    misconceptions: [
      {
        pick: "c3",
        tag: "stopped-early",
        hint: "Try another spot. There are more cats than you counted. Touch each one.",
      },
      {
        pick: "c5",
        tag: "stopped-early",
        hint: "Try another spot. Count once more and check that no cat is skipped.",
      },
    ],
    model:
      "Let's count the cats: one, two, three, four, five, six, seven. The last number, seven, tells how many.",
  },
];

// A misconception hint replaces the model text on the third miss unless it carries its own `model`, so each one repeats the item's model.
const withModels = (items) =>
  items.map((i) => ({ ...i, misconceptions: (i.misconceptions || []).map((m) => ({ ...m, model: m.model ?? i.model })) }));

const tf = (a, b, c, d) => ({ ee: a, dev: b, exp: c, br: d });

export default {
  id: "k-math-count-groups-sort",
  engine: "early-sort",
  title: "Count it and sort it",
  grade: "K",
  band: "k-2",
  subject: "math",
  lessonId: "k-math-count-and-compare-to-10",
  standards: ["K.CC.B.4", "K.CC.B.5", "K.CC.C.6"],
  minutes: 10,
  intro: "Let's count some groups together. Touch each picture and say a number for each one.",
  grownUp: {
    ask: "Ask: How do you know how many? Listen for touching each picture once and naming the last number as the total.",
    notice:
      "Notice whether the child touches each picture one time, keeps track of what was counted, and says the last number as how many.",
  },
  supports: {
    ee: {
      frames: ["There are ___.", "I count ___."],
      oral: "Touch each one. Say the numbers with me.",
    },
    dev: {
      frames: ["There are ___ ducks.", "I counted ___."],
      oral: "Count out loud with your partner.",
    },
    exp: { frames: ["I counted ___ because the last number I said was ___."] },
    br: {},
  },
  rounds: [
    {
      id: "r1",
      mode: "picture-sort",
      title: "Count and sort",
      grownUp: { ask: "Ask: How many do you count? Touch each picture once and say the last number." },
      prompt: "Count each group. Put it in the home with the same number.",
      categories: [
        { id: "c3", label: "3", say: "three", visual: homeVisual(3) },
        { id: "c5", label: "5", say: "five", visual: homeVisual(5) },
        { id: "c7", label: "7", say: "seven", visual: homeVisual(7) },
      ],
      items: withModels(items),
    },
    {
      id: "r2",
      mode: "oral-describe",
      title: "Which has more?",
      prompt: "Look at both groups. Say which has more, fewer or the same.",
      grownUp: { ask: "Ask: How can you check without counting? Listen for matching one to one." },
      items: [
        {
          id: "o1",
          visual: pair(
            ["bee", 6],
            ["ladybug", 3],
            "Two groups. On top are six bees in two short rows. Below are three ladybugs.",
          ),
          say: "Look at both groups. Which group has more? Match one to one and tell a friend how you know.",
          frames: tf(
            { frames: ["The bees have more.", "___ has more."] },
            { frames: ["___ has more than ___.", "I matched and ___ were left over."] },
            { frames: ["___ has more than ___ because when I matched, ___ were left over."] },
            {},
          ),
        },
        {
          id: "o2",
          visual: pair(
            ["frog", 4],
            ["fish", 4],
            "Two groups. On top are four frogs in a row. Below are four fish in a row.",
          ),
          say: "Look at both groups. Do they have more, fewer or the same? Tell a friend how you know.",
          frames: tf(
            { frames: ["They are the same.", "Nothing is left."] },
            { frames: ["The groups are the same because ___.", "I matched and nothing was left."] },
            { frames: ["The groups have the same number because every ___ matches a ___."] },
            {},
          ),
        },
        {
          id: "o3",
          visual: pair(
            ["cat", 2],
            ["dog", 7],
            "Two groups. On top are two cats. Below are seven dogs in two rows.",
          ),
          say: "Look at both groups. Which group has fewer? Tell a friend how you know.",
          frames: tf(
            { frames: ["The cats have fewer.", "___ has fewer."] },
            { frames: ["___ has fewer than ___.", "I matched and the ___ ran out."] },
            { frames: ["___ has fewer than ___ because when I matched, the ___ ran out first."] },
            {},
          ),
        },
      ],
    },
    {
      id: "r3",
      mode: "sequence-story",
      title: "More ducks come",
      grownUp: { ask: "Ask: How many ducks are there each time? What changed?" },
      prompt: "Put the pictures in order. Each time, one more duck comes.",
      cards: [
        {
          id: "s2",
          order: 1,
          say: "Two ducks swim in the pond.",
          visual: group("duck", 2, "Two ducks swimming."),
        },
        {
          id: "s3",
          order: 2,
          say: "One more duck comes. Now there are three ducks.",
          visual: group("duck", 3, "Three ducks swimming."),
        },
        {
          id: "s4",
          order: 3,
          say: "One more duck comes. Now there are four ducks.",
          visual: group("duck", 4, "Four ducks swimming."),
        },
      ],
      hints: [
        "Look at each picture. Which has the fewest ducks?",
        "Each picture has one duck added.",
        "Start with the picture that has the fewest, and end with the most.",
      ],
    },
  ],
  reflection: {
    prompt: "Tell a grown-up how you count a group.",
    frames: {
      ee: ["I count ___.", "I touch each one."],
      dev: ["I count ___ things.", "I touch one and say a number."],
      exp: ["I count by touching each one one time, and the last number tells how many."],
      br: ["When I count a group, I ___ so that ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
