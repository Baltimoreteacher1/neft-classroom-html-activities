// Grade 1 visual-match: plant words matched to pictures, meanings and sentences.
// Picture cards never print the word. Parts of the plant are shown with a dashed ring around one part.
const ring = (x, y, w, h) => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 16,
  fill: "none",
  stroke: "coral",
  sw: 4,
  dash: "8 6",
});
function plantDiagram(highlight) {
  const items = [
    { t: "rect", x: 0, y: 0, w: 480, h: 190, fill: "sky" },
    { t: "rect", x: 0, y: 190, w: 480, h: 90, fill: "copper-soft" },
    { t: "line", x1: 0, y1: 190, x2: 480, y2: 190, sw: 3 },
    { t: "line", x1: 240, y1: 190, x2: 240, y2: 268, sw: 5, cap: "round", stroke: "ochre" },
    { t: "line", x1: 240, y1: 206, x2: 198, y2: 250, sw: 5, cap: "round", stroke: "ochre" },
    { t: "line", x1: 240, y1: 206, x2: 284, y2: 252, sw: 5, cap: "round", stroke: "ochre" },
    { t: "line", x1: 240, y1: 232, x2: 214, y2: 274, sw: 4, cap: "round", stroke: "ochre" },
    { t: "rect", x: 235, y: 92, w: 10, h: 98, fill: "sage", stroke: "ink", sw: 2 },
    {
      t: "path",
      d: "M236 142 C195 107 150 117 140 137 C160 172 210 167 236 142 Z",
      fill: "sage",
      stroke: "ink",
      sw: 2,
    },
    {
      t: "path",
      d: "M245 152 C290 117 335 127 345 150 C325 184 275 180 245 152 Z",
      fill: "sage",
      stroke: "ink",
      sw: 2,
    },
    { t: "circle", cx: 240, cy: 72, r: 24, fill: "rose", stroke: "ink", sw: 2 },
    { t: "circle", cx: 240, cy: 72, r: 9, fill: "ochre", stroke: "ink", sw: 2 },
  ];
  const rings = {
    root: ring(172, 196, 136, 84),
    stem: ring(214, 92, 52, 100),
    leaf: ring(244, 108, 112, 82),
  };
  if (highlight) items.push(rings[highlight]);
  return items;
}
const shapes = (alt, items) => ({ kind: "shapes", alt, w: 480, h: 280, items });
const scene = (alt, items, bg = "plain") => ({ kind: "scene", bg, alt, items });
const part = (id, term, alt, hl, definition, example, why, hints, confusions, transfer) => ({
  id,
  term,
  visual: shapes(alt, plantDiagram(hl)),
  definition,
  example,
  why,
  hints,
  ...(confusions ? { confusions } : {}),
  ...(transfer ? { transfer } : {}),
});

const pairs = [
  {
    id: "seed",
    term: "seed",
    visual: { kind: "icon", name: "seed", alt: "A single brown seed" },
    definition: "A small thing that can grow into a new plant.",
    example: "We planted a bean seed in soil.",
    why: "A seed is the small start of a new plant. It has food inside to help it begin to grow.",
    hints: [
      "Look for the smallest picture.",
      "It is not green yet and has no leaves.",
      "Find the card with one small brown thing that looks like a bean.",
    ],
    confusions: [
      {
        pick: "sprout",
        tag: "seed-vs-sprout",
        hint: "A young green plant has leaves. This picture has no leaves, so it is the very first stage.",
      },
    ],
  },
  {
    id: "sprout",
    term: "sprout",
    visual: {
      kind: "icon",
      name: "sprout",
      alt: "A small green sprout with two leaves coming up from the soil",
    },
    definition: "A very young plant that has just come up from a seed.",
    example: "A green sprout pushed up through the soil.",
    why: "A sprout is a baby plant with its first small leaves. It has just come up from the seed.",
    hints: [
      "Look for a tiny plant with its first leaves.",
      "It is coming up out of the soil.",
      "Find the card with two small green leaves on a short stem.",
    ],
    confusions: [
      {
        pick: "seed",
        tag: "seed-vs-sprout",
        hint: "A seed has no leaves yet. This picture shows leaves, so the plant has already come up.",
      },
    ],
    transfer: {
      prompt: "Which one is a sprout?",
      options: [
        { id: "a", text: "A tiny green plant with two leaves" },
        { id: "b", text: "A small brown bean" },
      ],
      answer: "a",
      explain: "A sprout is a young plant with leaves. The brown bean is the seed.",
    },
  },
  part(
    "root",
    "root",
    "A plant with a dashed ring around the roots that grow down into the soil.",
    "root",
    "The part of a plant under the ground. It takes in water and holds the plant in place.",
    "The root takes in water from the soil.",
    "The ring is under the ground, where the part that takes in water grows.",
    [
      "Look for the part that is under the ground.",
      "It spreads out in the soil like thin hairs.",
      "Find the card with the ring around the brown lines in the soil.",
    ],
    [
      {
        pick: "stem",
        tag: "root-vs-stem",
        hint: "The stem is above the ground. Look at where the ring is.",
      },
    ],
    {
      prompt: "Which part takes in water from the soil?",
      options: [
        { id: "a", text: "The roots" },
        { id: "b", text: "The leaves" },
      ],
      answer: "a",
      explain: "Roots grow in the soil and take in water. Leaves catch light.",
    },
  ),
  part(
    "stem",
    "stem",
    "A plant with a dashed ring around its stem, the tall green part between the roots and the flower.",
    "stem",
    "The part of a plant that holds it up and carries water to the leaves.",
    "The stem holds the leaves up toward the light.",
    "The ring is on the tall middle part that holds the plant up.",
    [
      "Look for the long, tall part in the middle.",
      "It connects the part in the soil to the flat green parts.",
      "Find the card with the ring around the tall green stalk.",
    ],
    [
      {
        pick: "root",
        tag: "root-vs-stem",
        hint: "The root is under the ground. This ring is above the soil.",
      },
    ],
  ),
  part(
    "leaf",
    "leaf",
    "A plant with a dashed ring around one broad green leaf on the right side of the stem.",
    "leaf",
    "The flat, usually green part of a plant that catches light to help it make food.",
    "Each leaf is green and flat.",
    "The ring is around a flat green part that catches light for the plant.",
    [
      "Look for a flat green part.",
      "It grows out to the side of the tall middle part.",
      "Find the card with the ring around the wide green shape.",
    ],
    [
      {
        pick: "stem",
        tag: "leaf-vs-stem",
        hint: "The stem is long and thin and holds the plant up. This ring is around a wide, flat part.",
      },
    ],
    {
      prompt: "Which part catches light to help the plant make food?",
      options: [
        { id: "a", text: "The leaves" },
        { id: "b", text: "The roots" },
      ],
      answer: "a",
      explain: "Leaves are flat and green and catch light. Roots are under the ground.",
    },
  ),
  {
    id: "sunlight",
    term: "sunlight",
    visual: scene(
      "The sun shining with bright rays above a small green sprout in soil.",
      [
        { icon: "sun", x: 320, y: 10, s: 130 },
        { icon: "sprout", x: 110, y: 120, s: 120 },
      ],
      "sky",
    ),
    definition: "The light that comes from the sun.",
    example: "The leaves catch sunlight from the window.",
    why: "The sun in the sky gives bright light. The leaves of the plant can catch it.",
    hints: [
      "Look for the picture with something shining in the sky.",
      "It is warm and bright and comes from far away.",
      "Find the card with the sun above the little plant.",
    ],
    confusions: [
      {
        pick: "shade",
        tag: "sunlight-vs-shade",
        hint: "Shade is a darker place under something. This picture has the bright sun with nothing blocking it.",
      },
    ],
  },
  {
    id: "shade",
    term: "shade",
    visual: scene(
      "A tree with a dark patch of shade on the grass under it and the sun in the sky at the top right.",
      [
        { icon: "sun", x: 370, y: 10, s: 90 },
        { t: "ellipse", cx: 170, cy: 235, rx: 140, ry: 28, fill: "ink", opacity: 0.35 },
        { icon: "tree", x: 90, y: 20, s: 170 },
      ],
      "field",
    ),
    definition: "A darker place where something blocks the light from the sun.",
    example: "The bench sits in the shade of the tree.",
    why: "The tree blocks the sun's light and makes a dark patch on the grass.",
    hints: [
      "Look for a dark patch on the ground.",
      "Something big is blocking the light from the sky.",
      "Find the card with the dark oval under the tree.",
    ],
    confusions: [
      {
        pick: "sunlight",
        tag: "sunlight-vs-shade",
        hint: "That word is for the bright light. This picture shows the dark place where the light is blocked.",
      },
    ],
    transfer: {
      prompt: "Where is it darker on a sunny day?",
      options: [
        { id: "a", text: "Under a big tree" },
        { id: "b", text: "In an open field" },
      ],
      answer: "a",
      explain: "The tree blocks the sun's light, so the ground under it is darker.",
    },
  },
  {
    id: "water",
    term: "water",
    visual: scene(
      "Three drops of water falling toward a small green sprout.",
      [
        { icon: "drop", x: 100, y: 10, s: 60 },
        { icon: "drop", x: 190, y: 50, s: 60 },
        { icon: "drop", x: 280, y: 5, s: 60 },
        { icon: "sprout", x: 150, y: 120, s: 120 },
      ],
      "sky",
    ),
    definition: "The clear liquid that plants drink through their roots.",
    example: "The plant drinks water through its roots.",
    why: "The blue drops are water falling on the plant. Roots take in water so the plant can live.",
    hints: [
      "Look for the blue drops.",
      "It is wet and clear and falls like rain.",
      "Find the card with three blue drops over a small plant.",
    ],
    confusions: [
      {
        pick: "sunlight",
        tag: "need-confusion",
        hint: "That word is for light. The picture shows something wet that falls in drops.",
      },
    ],
  },
];

export default {
  id: "g1-science-plant-parts-match",
  engine: "visual-match",
  title: "Plant words",
  grade: "1",
  band: "k-2",
  subject: "science",
  lessonId: "g1-science-plants-need-light",
  standards: ["K-LS1-1", "2-LS2-1"],
  vocabIds: ["seed", "sprout", "root", "stem", "leaf", "sunlight", "shade", "water"],
  minutes: 10,
  intro:
    "Listen to each plant word. Find the picture, the meaning or the sentence that goes with it.",
  modes: ["term-visual", "term-definition", "term-example"],
  pairs,
  rounds: [
    {
      id: "r1",
      mode: "term-visual",
      level: "recognise",
      title: "Plant words and pictures",
      pairIds: ["seed", "sprout", "root", "stem"],
    },
    {
      id: "r2",
      mode: "term-visual",
      level: "distinguish",
      title: "Parts and light",
      pairIds: ["leaf", "sunlight", "shade", "water"],
    },
    {
      id: "r3",
      mode: "term-definition",
      level: "distinguish",
      title: "What does it mean?",
      pairIds: ["root", "stem", "leaf", "shade"],
    },
    {
      id: "r4",
      mode: "term-example",
      level: "apply",
      title: "Finish the sentence",
      pairIds: ["seed", "root", "sunlight", "water"],
    },
  ],
  distractors: [
    {
      id: "soil",
      term: "soil",
      tag: "part-vs-place",
      hint: "That word names the dirt a plant grows in. This card is about the plant or about light and water.",
    },
    {
      id: "flower",
      term: "flower",
      tag: "part-confusion",
      hint: "A flower is one part of some plants. This card shows a different part or idea.",
    },
  ],
  supports: {
    ee: {
      frames: ["This is a ___.", "The ___ is under the ground.", "The ___ is green and flat."],
      wordBank: ["seed", "root", "stem", "leaf", "sun", "water"],
      oral: "Say the word. Look at the picture. Do they go together?",
      directions: "Pick up a word, then place it on the picture, meaning or sentence that matches.",
    },
    dev: {
      frames: ["___ matches this picture because ___.", "The ___ takes in water."],
      wordBank: ["sunlight", "shade", "sprout"],
      oral: "Tell your partner why before you choose.",
    },
    exp: { frames: ["I matched ___ with this picture because the picture shows ___."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a grown-up one part of a plant and what it does.",
    frames: {
      ee: ["The ___ is a plant part.", "It helps the plant."],
      dev: ["The ___ takes in ___.", "A ___ helps the plant ___."],
      exp: ["The ___ helps the plant by ___ because ___."],
      br: ["A plant uses its ___ to ___, so without it the plant would ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
