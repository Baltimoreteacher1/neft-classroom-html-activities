// Grade 1 early-sort: what a plant needs to live and grow, how a plant grows, and what two plants tell us.
// Every picture and prompt is spoken. Observations are oral: children say what they see, not what they guess.
const icon = (name, alt) => ({ kind: "icon", name, alt });

// A potted plant drawn from shapes. `color` is a palette name, `lean` shifts the top (drooping) and `tall` sets height.
function potPlant(cx, base, { color, stemH, leaf, droop = false }) {
  const top = base - stemH;
  const leaves = droop
    ? [
        `M${cx - 5} ${top + 12} C${cx - 30} ${top + 8} ${cx - 62} ${top + 30} ${cx - 66} ${top + 92} C${cx - 36} ${top + 76} ${cx - 14} ${top + 54} ${cx - 5} ${top + 12} Z`,
        `M${cx + 5} ${top + 12} C${cx + 30} ${top + 8} ${cx + 62} ${top + 30} ${cx + 66} ${top + 92} C${cx + 36} ${top + 76} ${cx + 14} ${top + 54} ${cx + 5} ${top + 12} Z`,
      ]
    : [
        `M${cx} ${top + 24} C${cx - 28} ${top + 4} ${cx - 60} ${top + 10} ${cx - 66} ${top + 28} C${cx - 40} ${top + 44} ${cx - 10} ${top + 40} ${cx} ${top + 24} Z`,
        `M${cx} ${top + 36} C${cx + 28} ${top + 16} ${cx + 60} ${top + 22} ${cx + 66} ${top + 40} C${cx + 40} ${top + 56} ${cx + 10} ${top + 52} ${cx} ${top + 36} Z`,
      ];
  return [
    { t: "rect", x: cx - 32, y: base, w: 64, h: 46, rx: 6, fill: "ochre", stroke: "ink", sw: 3 },
    { t: "rect", x: cx - 5, y: top, w: 10, h: stemH, fill: color, stroke: "ink", sw: 2 },
    ...leaves.map((d) => ({ t: "path", d, fill: leaf, stroke: "ink", sw: 2 })),
  ];
}

const twoPlants = {
  kind: "scene",
  bg: "plain",
  alt: "Two bean plants in matching pots. On the left, a tall green plant by a bright window with the sun outside. On the right, a pale yellow thin plant inside a dark closed box.",
  w: 480,
  h: 280,
  items: [
    { t: "rect", x: 20, y: 20, w: 200, h: 240, rx: 12, fill: "sky", stroke: "ink", sw: 3 },
    { icon: "sun", x: 140, y: 26, s: 64 },
    ...potPlant(110, 206, { color: "sage", stemH: 110, leaf: "sage" }),
    { t: "rect", x: 260, y: 20, w: 200, h: 240, rx: 12, fill: "ink", stroke: "ink", sw: 3 },
    ...potPlant(360, 206, { color: "copper-soft", stemH: 130, leaf: "copper-soft" }),
  ],
};
const dryPlant = {
  kind: "scene",
  bg: "plain",
  alt: "A plant with drooping leaves in dry, cracked soil in a pot. A bright sun shines beside it.",
  w: 480,
  h: 280,
  items: [
    { icon: "sun", x: 340, y: 24, s: 100 },
    ...potPlant(190, 190, { color: "sage-soft", stemH: 100, leaf: "sage-soft", droop: true }),
    { t: "line", x1: 160, y1: 205, x2: 178, y2: 222, sw: 2 },
    { t: "line", x1: 200, y1: 200, x2: 214, y2: 226, sw: 2 },
    { t: "line", x1: 226, y1: 208, x2: 218, y2: 224, sw: 2 },
  ],
};

const need = (id, name, say, alt, model, hints) => ({
  id,
  word: say.replace(/^(a |the )/, ""),
  visual: icon(name, alt),
  category: "yes",
  say,
  hints,
  misconceptions: [
    {
      pick: "no",
      tag: "needs-vs-things",
      hint: "Try another spot. Think about what helps a plant live and grow.",
    },
  ],
  model,
});
const notNeed = (id, name, say, alt, model) => ({
  id,
  word: say.replace(/^(a |the )/, ""),
  visual: icon(name, alt),
  category: "no",
  say,
  hints: [
    "Think about whether a plant can use this to live and grow.",
    "Plants cannot use this. Can a plant drink it or catch its light?",
    "Where would you find this? Is it living, like a plant?",
  ],
  misconceptions: [
    {
      pick: "yes",
      tag: "everything-helps",
      hint: "Try another spot. Can a plant take this in or use it to make food?",
    },
  ],
  model,
});

// A misconception hint replaces the model text on the third miss unless it carries its own `model`, so each one repeats the item's model.
const withModels = (items) =>
  items.map((i) => ({ ...i, misconceptions: (i.misconceptions || []).map((m) => ({ ...m, model: m.model ?? i.model })) }));

export default {
  id: "g1-science-plant-needs-sort",
  engine: "early-sort",
  title: "What does a plant need?",
  grade: "1",
  band: "k-2",
  subject: "science",
  lessonId: "g1-science-plants-need-light",
  standards: ["K-LS1-1", "2-LS2-1"],
  minutes: 10,
  intro:
    "Let's find out what helps a plant live and grow. Look at each picture and decide where it goes.",
  grownUp: {
    ask: "Ask: How do you know a plant can use it? Listen for light, water, or leaves and roots.",
    notice:
      "Notice whether the child gives a reason from what plants do, not only from the picture.",
  },
  supports: {
    ee: {
      frames: ["A plant uses ___.", "A plant does not use ___."],
      oral: "Say the name of the picture. Is it for a plant?",
    },
    dev: {
      frames: ["A plant uses ___ because ___."],
      oral: "Tell your partner why before you choose.",
    },
    exp: { frames: ["A plant uses ___ to ___."] },
    br: {},
  },
  rounds: [
    {
      id: "r1",
      mode: "picture-sort",
      title: "Does a plant use it?",
      grownUp: { ask: "Ask: What does a plant do with it? Listen for water, light, roots or leaves." },
      prompt: "Does a plant use it to live and grow? Sort it.",
      categories: [
        {
          id: "yes",
          label: "things a plant uses",
          say: "things a plant uses",
          visual: icon("check", "A check mark for things a plant uses"),
        },
        {
          id: "no",
          label: "things a plant does not use",
          say: "things a plant does not use",
          visual: icon("cross", "A cross for things a plant does not use"),
        },
      ],
      items: withModels([
        need(
          "sun",
          "sun",
          "the sun",
          "The bright yellow sun",
          "The sun gives light. A plant's leaves catch the light and use it to make food. A plant uses sunlight.",
          [
            "Where do a plant's leaves get what they use to make food?",
            "Look up in the sky. What gives us daytime light?",
            "Plants on a windowsill lean toward this. What is it?",
          ],
        ),
        notNeed(
          "car",
          "car",
          "a car",
          "A small red car",
          "A car runs on a road. A plant cannot drink it or catch its light, so a plant does not use it.",
        ),
        need(
          "drop",
          "drop",
          "a drop of water",
          "A single blue drop of water",
          "Roots take in water. A plant needs water to live and grow, so a plant uses it.",
          [
            "What do roots take in from the soil?",
            "Think about what you give a plant when its soil is dry.",
            "It is clear and wet. Roots drink it up.",
          ],
        ),
        notNeed(
          "pizza",
          "pizza",
          "a pizza",
          "A slice of pizza",
          "A pizza is food for people, not for plants. A plant makes its own food with light, so it does not use pizza.",
        ),
        need(
          "rain",
          "rain",
          "rain cloud",
          "Gray clouds with falling raindrops",
          "Rain is water that falls from the sky. Roots can take in rain, so a plant uses it.",
          [
            "Look at the picture. What falls from the clouds?",
            "Roots can take in what falls onto the soil.",
            "Think about what you give a plant when its soil is dry.",
          ],
        ),
        notNeed(
          "ball",
          "soccer-ball",
          "a soccer ball",
          "A black and white soccer ball",
          "A soccer ball is a toy. A plant cannot drink it or catch its light, so a plant does not use it.",
        ),
        notNeed(
          "book",
          "book",
          "a book",
          "A closed blue book",
          "A book is for reading. A plant cannot use a book to live and grow.",
        ),
      ]),
    },
    {
      id: "r2",
      mode: "sequence-story",
      title: "How a plant grows",
      grownUp: { ask: "Ask: What happens first? What happens next?" },
      prompt: "Put the pictures in order to show how a plant grows.",
      cards: [
        {
          id: "seed",
          order: 1,
          say: "First, a seed is planted in the soil.",
          visual: icon("seed", "A single seed"),
        },
        {
          id: "sprout",
          order: 2,
          say: "Next, a small sprout comes up and reaches for the light.",
          visual: icon("sprout", "A small green sprout with two leaves"),
        },
        {
          id: "plant",
          order: 3,
          say: "Last, the plant grows tall with big leaves and a flower.",
          visual: icon("sunflower", "A tall sunflower with a yellow flower on top"),
        },
      ],
      hints: [
        "Think about which picture shows the smallest, newest part of the plant.",
        "A plant starts small and gets bigger each time.",
        "The tallest plant with the flower comes after the little sprout.",
      ],
    },
    {
      id: "r3",
      mode: "oral-describe",
      title: "Look and tell what you see",
      prompt: "Look at the plants. Say what you notice.",
      grownUp: {
        ask: "Ask: What do you see? What is different? Why might that be? Accept observations first, then reasons.",
      },
      items: [
        {
          id: "two-plants",
          visual: twoPlants,
          say: "Two bean plants have the same kind of seed, soil and water. One is by a window and one is in a dark box. What do you notice? What is different?",
          frames: {
            ee: { frames: ["The plant is ___.", "The plant in the dark box is ___."] },
            dev: {
              frames: ["The plant by the window is ___.", "The plant in the dark box is ___."],
            },
            exp: {
              frames: [
                "The plant by the window is ___ and the plant in the dark box is ___ because ___.",
              ],
            },
            br: {},
          },
        },
        {
          id: "dry-plant",
          visual: dryPlant,
          say: "This plant sits in bright sun, but its soil is dry and cracked. What do you notice? What do you think the plant needs?",
          frames: {
            ee: { frames: ["The leaves are ___.", "The plant needs ___."] },
            dev: {
              frames: ["The leaves are ___ because the soil is ___.", "The plant needs ___."],
            },
            exp: { frames: ["Even though the plant has light, it needs ___ because ___."] },
            br: {},
          },
        },
      ],
    },
  ],
  reflection: {
    prompt: "Tell a grown-up two things a plant needs and what happens if it does not get them.",
    frames: {
      ee: ["A plant needs ___.", "A plant needs ___ and ___."],
      dev: ["A plant needs ___ and ___.", "Without ___ the plant is ___."],
      exp: ["A plant needs ___ and ___ to grow. Without ___ it ___."],
      br: ["Plants need ___ and ___, and I know because ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
