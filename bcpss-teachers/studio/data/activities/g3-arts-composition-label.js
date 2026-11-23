// Concept Builder (label-diagram): read the composition of two original paintings (grade 3 visual arts).
import { artworkA, artworkB } from "../kits/c8-color-composition.js";

const ALL_PLACED = {
  type: "all",
  checks: [
    { type: "equals", of: "wrong", value: "0" },
    { type: "equals", of: "unplaced", value: "0" },
  ],
};

const supports = (visual, bank) => ({
  ee: {
    directions: "Tap a card. Then tap the place in the painting that the card describes.",
    frames: ["I see ___ here.", "This part is ___."],
    wordBank: bank,
    visual,
  },
  dev: { frames: ["I put this card here because ___."], wordBank: bank.slice(0, 3) },
  exp: { frames: ["This part matches the card because the artist used ___ to ___."] },
  br: {},
});

export default {
  id: "g3-arts-composition-label",
  engine: "concept-builder",
  kind: "label-diagram",
  title: "Read a painting: where are the parts?",
  grade: "3",
  band: "3-5",
  subject: "arts",
  lessonId: "g3-arts-primary-and-secondary-colors-composition",
  standards: ["VA:Re8.1.3", "VA:Re9.1.3"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the National Core Arts Standards in visual arts (responding); not mapped to a district unit sequence. Both paintings are original.",
  },
  vocabIds: [
    "composition",
    "focal-point",
    "contrast",
    "balance",
    "overlap",
    "foreground",
    "background",
  ],
  minutes: 12,
  intro:
    "Artists plan where to put colors and shapes. Each card names a part of a painting. Place each card on the part it describes, then say how you knew.",
  model: {
    visual: artworkA(),
    labels: [
      { id: "focal", text: "Focal point: where your eye goes first" },
      { id: "fore", text: "Foreground: the part that looks closest" },
      { id: "back", text: "Background: the part that looks farthest away" },
      { id: "over", text: "Overlap: one shape covers part of another" },
      { id: "second", text: "Secondary color: a color made from two primaries", distractor: true },
    ],
    hotspots: [
      {
        id: "h-focal",
        x: 268,
        y: 184,
        answer: "focal",
        name: "the brightest large shape near the middle",
      },
      { id: "h-fore", x: 56, y: 276, answer: "fore", name: "big shapes at the bottom left corner" },
      { id: "h-back", x: 96, y: 164, answer: "back", name: "pale shapes high up on the left" },
      {
        id: "h-over",
        x: 326,
        y: 150,
        answer: "over",
        name: "the place where a round shape sits on top of the building",
      },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "Look closely at the farm painting. Place each card on the part of the painting it describes. One card is about color mixing, not about arrangement.",
      goal: "Four cards placed, one card left over",
      target: {
        placed: { "h-focal": "focal", "h-fore": "fore", "h-back": "back", "h-over": "over" },
      },
      check: ALL_PLACED,
      answerText: "focal",
      hints: [
        "Decide which parts look close and which look far away. Near parts look big and bold; far parts look small and pale.",
        "Look for the place where one shape sits in front of another, partly hiding it.",
        "The leftover card is about mixing paint, and this activity is about how the painting is arranged.",
      ],
      misconceptions: [
        {
          match: "near-far-swapped",
          when: { type: "equals", of: "placed[h-fore]", value: "back" },
          hint: "Check the size and color of the shapes you chose. Do big, bold shapes look closer or farther away?",
          model:
            "Near objects look larger and bolder. Far objects look smaller and paler. The big flowers are near; the pale hills are far.",
        },
        {
          match: "overlap-vs-focal",
          when: { type: "equals", of: "placed[h-over]", value: "focal" },
          hint: "One card is about where your eye lands first, and another is about shapes that sit on top of each other. Which place shows a shape covering part of another?",
        },
        {
          match: "composition-vs-color-mixing",
          when: { type: "equals", of: "placed[h-focal]", value: "second" },
          hint: "That card is about how paint colors are made. Think about which part of the painting grabs your eye.",
        },
      ],
      model:
        "The big flowers at the bottom are close, so they are the foreground. The pale hills are far away, so they are the background. The tree sits on top of the barn and hides part of it, so that is the overlap. The red barn is the brightest shape against the green field, so your eye goes there first and it is the focal point.",
      right: "Every card is on the part it describes.",
      supports: supports(artworkA(), ["close", "far", "bold", "pale", "on top"]),
      explain: {
        prompt:
          "How can you tell the foreground from the background in this painting? Use what you see.",
        frames: {
          ee: ["The foreground is ___.", "It looks ___."],
          dev: ["The foreground looks ___ because ___.", "The background looks ___ because ___."],
          exp: [
            "The foreground looks closer than the background because the artist made it ___ and ___.",
          ],
          br: [
            "The artist suggests distance by making the foreground ___ and the background ___, and by overlapping ___.",
          ],
        },
        mustMention: [
          {
            id: "size",
            label: "size or paleness",
            any: ["big", "large", "small", "pale", "light", "bold", "bright"],
          },
        ],
        criteria: [
          { id: "c1", label: "I named the foreground and the background." },
          { id: "c2", label: "I told what I see that makes one look closer." },
        ],
      },
    },
    {
      id: "t2",
      prompt: "Now look at the night painting. Place each card on the part it describes.",
      goal: "Four cards placed, one card left over",
      setup: {
        visual: artworkB(),
        labels: [
          { id: "moon", text: "Focal point: the brightest shape" },
          { id: "dark", text: "The dark color that makes the moon stand out (contrast)" },
          { id: "tree", text: "The tree on the left that matches the tree on the right (balance)" },
          { id: "boat", text: "Foreground: the boat nearest to you" },
          { id: "tree-boat", text: "Overlap: the tree covers the boat", distractor: true },
        ],
        hotspots: [
          {
            id: "h-moon",
            x: 240,
            y: 100,
            answer: "moon",
            name: "the big round shape in the upper middle",
          },
          {
            id: "h-dark",
            x: 410,
            y: 60,
            answer: "dark",
            name: "empty sky in the upper right corner",
          },
          { id: "h-tree", x: 70, y: 175, answer: "tree", name: "a pointed shape at the left edge" },
          {
            id: "h-boat",
            x: 240,
            y: 292,
            answer: "boat",
            name: "the small shape at the bottom middle",
          },
        ],
      },
      target: {
        placed: { "h-moon": "moon", "h-dark": "dark", "h-tree": "tree", "h-boat": "boat" },
      },
      check: ALL_PLACED,
      answerText: "moon",
      hints: [
        "Find the brightest shape in the painting. Which card says where your eye goes first?",
        "A dark color next to a bright color makes a strong contrast. Where is the darkest empty area?",
        "The leftover card says a tree covers the boat. Check whether the trees and the boat touch.",
      ],
      misconceptions: [
        {
          match: "dark-vs-bright",
          when: { type: "equals", of: "placed[h-dark]", value: "moon" },
          hint: "The bright moon is not the dark color. Which card names the dark color that helps the moon stand out?",
        },
        {
          match: "false-overlap",
          when: { type: "equals", of: "placed[h-boat]", value: "tree-boat" },
          hint: "Look at whether any tree covers part of the boat. Shapes overlap only when one hides part of another.",
        },
      ],
      model:
        "The yellow moon is the brightest shape, so it is the focal point. The dark navy sky around it makes the moon stand out, which is contrast. The two trees match at the left and right edges, which gives balance. The boat is the nearest thing at the bottom. No tree covers the boat, so nothing overlaps there.",
      right: "Every card is on the part it describes.",
      supports: supports(artworkB(), ["bright", "dark", "matching", "near"]),
      explain: {
        prompt:
          "Choose one thing the artist did to guide your eye. What did the artist do, and what does it make you notice?",
        frames: {
          ee: ["The artist used a ___ moon.", "It makes me look at ___."],
          dev: ["The artist used ___ so I notice ___.", "This makes the painting feel ___."],
          exp: ["The artist used the contrast between ___ and ___ so the viewer notices ___."],
          br: [
            "By placing ___ against ___, the artist directs the viewer to ___ and creates a feeling of ___.",
          ],
        },
        mustMention: [
          {
            id: "artist",
            label: "what the artist did",
            any: ["artist", "used", "made", "painted"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said what the artist did." },
          { id: "c2", label: "I said what it makes me notice." },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "Which part of a painting is easiest for you to notice? Which part would you like to use in your own artwork?",
    frames: {
      ee: ["I notice ___ first.", "I want to use ___."],
      dev: ["I notice ___ because ___.", "In my art I will use ___."],
      exp: ["I am drawn to ___ because ___; in my own artwork I will try ___."],
      br: [
        "I tend to notice ___ first because ___, and in my own artwork I will use ___ to guide the viewer.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
