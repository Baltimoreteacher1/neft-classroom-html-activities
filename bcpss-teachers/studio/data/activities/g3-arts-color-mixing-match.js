// Visual Match: color mixing, the color wheel and the parts of a picture (grade 3 visual arts).
import {
  PRIMARY_ROW,
  SECONDARY_ROW,
  artworkA,
  colorWheel,
  mixing,
} from "../kits/c8-color-composition.js";

const COL = "g3-arts-primary-and-secondary-colors-composition";
const ring = (cx, cy, rx, ry, alt) => {
  const base = artworkA();
  return {
    ...base,
    alt,
    items: [
      ...base.items,
      { t: "ellipse", cx, cy, rx, ry, fill: "none", stroke: "coral", sw: 6, dash: "10 7" },
    ],
  };
};

const activity = {
  id: "g3-arts-color-mixing-match",
  engine: "visual-match",
  title: "Match colors and parts of a picture",
  grade: "3",
  band: "3-5",
  subject: "arts",
  lessonId: "g3-arts-primary-and-secondary-colors-composition",
  standards: ["VA:Cr2.1.3a", "VA:Re8.1.3"],
  vocabIds: [
    "primary-color",
    "secondary-color",
    "color-wheel",
    "focal-point",
    "foreground",
    "background",
  ].map((id) => `${COL}:${id}`),
  minutes: 12,
  intro:
    "Match each artist word to its picture, its meaning and a sentence about art. For the mixing pictures, think about what happens when the two paints blend.",
  modes: ["term-visual", "term-definition", "term-example"],
  pairs: [
    {
      id: "orange",
      term: "orange",
      visual: mixing("red", "yellow", "orange"),
      definition: "The color you get when you mix red and yellow paint.",
      example: "When we mix red and yellow paint, we get orange.",
      why: "The overlap of red and yellow is the color of a sunset, which is orange.",
      hints: [
        "Look at the two colors in the circles.",
        "Imagine stirring those two paints together.",
        "The new color looks like the sky at sunset.",
      ],
      confusions: [
        {
          pick: "green",
          tag: "wrong-pair",
          hint: "Check the two circles. Does either one use blue?",
          model: "The overlap of red and yellow is the color of a sunset, which is orange.",
        },
      ],
      transfer: {
        prompt: "You mix red and yellow paint. What color do you make?",
        options: [
          { id: "a", text: "Orange" },
          { id: "b", text: "Green" },
          { id: "c", text: "Purple" },
        ],
        answer: "a",
        explain:
          "Red and yellow are primary colors, and mixing them makes the secondary color orange.",
      },
    },
    {
      id: "green",
      term: "green",
      visual: mixing("blue", "yellow", "green"),
      definition: "The color you get when you mix yellow and blue paint.",
      example: "To paint grass, mix yellow and blue to make green.",
      why: "Blue and yellow blend into the color of leaves and grass, which is green.",
      hints: [
        "Look at the two colors in the circles.",
        "Imagine stirring those two paints together.",
        "The new color looks like grass and leaves.",
      ],
      confusions: [
        {
          pick: "purple",
          tag: "wrong-pair",
          hint: "Check the two circles. Does either one use red?",
          model: "Blue and yellow blend into the color of leaves and grass, which is green.",
        },
      ],
    },
    {
      id: "purple",
      term: "purple",
      visual: mixing("red", "blue", "purple"),
      definition: "The color you get when you mix red and blue paint.",
      example: "Mixing red and blue makes purple for the grapes.",
      why: "Red and blue blend into the color of grapes, which is purple.",
      hints: [
        "Look at the two colors in the circles.",
        "Imagine stirring those two paints together.",
        "The new color looks like grapes.",
      ],
      confusions: [
        {
          pick: "orange",
          tag: "wrong-pair",
          hint: "Check the two circles. Does either one use yellow?",
          model: "Red and blue blend into the color of grapes, which is purple.",
        },
      ],
    },
    {
      id: "primary-colors",
      term: "primary colors",
      forms: ["primary color"],
      visual: PRIMARY_ROW,
      definition: "The three colors that cannot be made by mixing other paint colors.",
      example: "Red, yellow and blue are the primary colors.",
      why: "These three colors stand alone, and every other paint color starts from them.",
      hints: [
        "Count the circles and read each name.",
        "None of these colors is mixed from the others.",
        "Every other paint color starts from these three.",
      ],
      confusions: [
        {
          pick: "secondary-colors",
          tag: "primary-vs-secondary",
          hint: "Do these colors come from mixing? Look for the mixing signs in the picture.",
          model: "These three colors stand alone, and every other paint color starts from them.",
        },
      ],
      transfer: {
        prompt: "Which group has only primary colors?",
        options: [
          { id: "a", text: "Red, yellow, blue" },
          { id: "b", text: "Orange, green, purple" },
          { id: "c", text: "Red, green, blue" },
        ],
        answer: "a",
        explain:
          "Red, yellow and blue cannot be mixed from other colors. Orange, green and purple are mixed.",
      },
    },
    {
      id: "secondary-colors",
      term: "secondary colors",
      forms: ["secondary color"],
      visual: SECONDARY_ROW,
      definition: "Colors you make by mixing two primary colors.",
      example: "Orange, green and purple are the secondary colors.",
      why: "Each of these colors is made by mixing two primary colors.",
      hints: [
        "Read the plus sign in each small picture.",
        "Each picture mixes two colors to make a new one.",
        "The new colors in the small circles are made from pairs.",
      ],
      confusions: [
        {
          pick: "primary-colors",
          tag: "primary-vs-secondary",
          hint: "In this picture, colors are being mixed into new colors. Which group is not mixed?",
          model: "Each of these colors is made by mixing two primary colors.",
        },
      ],
    },
    {
      id: "color-wheel",
      term: "color wheel",
      visual: colorWheel(),
      definition: "A circle that shows the colors in order around the center.",
      example: "On the color wheel, green sits between yellow and blue.",
      why: "The colors are arranged around a circle in order, so this is a color wheel.",
      hints: [
        "Look at the shape of the whole picture.",
        "Notice that the colors go around in a circle.",
        "The colors sit in order like slices of a pie.",
      ],
      confusions: [
        {
          pick: "secondary-colors",
          tag: "whole-vs-parts",
          hint: "That word names some of the colors. This picture shows all the colors arranged in a circle.",
          model: "The colors are arranged around a circle in order, so this is a color wheel.",
        },
      ],
    },
    {
      id: "foreground",
      term: "foreground",
      visual: ring(
        70,
        276,
        90,
        50,
        "A painting of a farm with a dashed ring around the big flowers at the bottom left corner.",
      ),
      definition: "The part of a picture that looks closest to you.",
      example: "The big flowers are in the foreground, so they look close.",
      why: "The big flowers at the bottom look close to the viewer, so they are in the front part of the picture.",
      hints: [
        "Look at the part inside the dashed ring.",
        "Ask whether it looks near you or far from you.",
        "It is large and sits low in the picture.",
      ],
      confusions: [
        {
          pick: "background",
          tag: "near-or-far",
          hint: "Is the ringed part close to you or far away? Remember that far things look small and pale.",
          model: "The big flowers at the bottom look close to the viewer, so they are in the front part of the picture.",
        },
      ],
    },
    {
      id: "background",
      term: "background",
      visual: ring(
        110,
        160,
        130,
        36,
        "A painting of a farm with a dashed ring around the pale hills far behind the barn.",
      ),
      definition: "The part of a picture that looks farthest away.",
      example: "The hills in the background look small and far away.",
      why: "The pale hills look far away from the viewer, so they are in the back part of the picture.",
      hints: [
        "Look at the part inside the dashed ring.",
        "Ask whether it looks near you or far from you.",
        "It is pale and sits high behind everything else.",
      ],
      confusions: [
        {
          pick: "foreground",
          tag: "near-or-far",
          hint: "Is the ringed part close to you or far away? Remember that near things look big and bold.",
          model: "The pale hills look far away from the viewer, so they are in the back part of the picture.",
        },
      ],
    },
    {
      id: "focal-point",
      term: "focal point",
      visual: ring(
        290,
        160,
        76,
        58,
        "A painting of a farm with a dashed ring around the red barn in the middle.",
      ),
      definition: "The part of a picture that your eye goes to first.",
      example: "The bright red barn is the focal point of the painting.",
      why: "The red barn is the brightest shape against the green field, so your eye goes there first.",
      hints: [
        "Look at what the dashed ring points out.",
        "Ask yourself where your eyes go first in the whole picture.",
        "The ringed part is the boldest shape against the green.",
      ],
      confusions: [
        {
          pick: "foreground",
          tag: "near-vs-first",
          hint: "Close does not always mean first. Which shape grabs your eye with strong color?",
          model: "The red barn is the brightest shape against the green field, so your eye goes there first.",
        },
      ],
    },
  ],
  distractors: [
    {
      id: "d-brown",
      term: "brown",
      tag: "too-many-colors",
      hint: "That color often comes from mixing many colors together. This picture mixes only two.",
      pairIds: ["orange", "green", "purple"],
    },
    {
      id: "d-composition",
      term: "composition",
      tag: "whole-vs-part",
      hint: "That word names the whole arrangement of a picture, not one part of it.",
      pairIds: ["foreground", "background", "focal-point"],
    },
  ],
  supports: {
    ee: {
      directions:
        "Look at the picture. Think about the colors or the part that is circled. Then put the word on the picture that matches.",
      frames: ["I see ___.", "This word names ___."],
      wordBank: ["red", "yellow", "blue", "mix", "close", "far", "circle"],
      oral: "Say the two colors you see. Then say the new color.",
    },
    dev: {
      frames: ["I think this is ___ because the colors are ___."],
      wordBank: ["mix", "near", "far"],
    },
    exp: { frames: ["This matches because ___ shows ___."] },
    br: {},
  },
  reflection: {
    prompt: "Which picture clue helped you most? Tell about the colors or the shapes you noticed.",
    frames: {
      ee: ["I looked at ___.", "The colors were ___."],
      dev: ["The clue that helped was ___ because ___.", "I mixed up ___ and ___."],
      exp: ["What helped me most was noticing ___, which showed ___."],
      br: ["I could tell ___ from ___ by comparing ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

// Parallel transfer questions for the pairs that do not carry their own.
const TRANSFER = {
  "green": { prompt: "You mix yellow paint and blue paint. What color do you make?", options: [{ id: "a", text: "Green" }, { id: "b", text: "Orange" }, { id: "c", text: "Purple" }], answer: "a", explain: "Yellow and blue are primary colors, and mixing them makes the secondary color green." },
  "purple": { prompt: "You mix red paint and blue paint. What color do you make?", options: [{ id: "a", text: "Purple" }, { id: "b", text: "Green" }, { id: "c", text: "Orange" }], answer: "a", explain: "Red and blue make the secondary color purple." },
  "secondary-colors": { prompt: "Which group has only secondary colors?", options: [{ id: "a", text: "Orange, green, purple" }, { id: "b", text: "Red, yellow, blue" }, { id: "c", text: "Red, orange, blue" }], answer: "a", explain: "Orange, green and purple are each mixed from two primary colors." },
  "color-wheel": { prompt: "On a color wheel, which color sits between blue and red?", options: [{ id: "a", text: "Purple" }, { id: "b", text: "Green" }, { id: "c", text: "Orange" }], answer: "a", explain: "Blue and red make purple, and purple sits between them on the wheel." },
  "foreground": { prompt: "In a painting of a beach, a big shell at the bottom looks very close to you. What part of the painting is the shell in?", options: [{ id: "a", text: "The foreground" }, { id: "b", text: "The background" }, { id: "c", text: "The sky" }], answer: "a", explain: "A big shape that looks close is in the foreground." },
  "background": { prompt: "In a painting of a street, tiny faint hills look far away. What part of the painting are they in?", options: [{ id: "a", text: "The background" }, { id: "b", text: "The foreground" }, { id: "c", text: "The focal point" }], answer: "a", explain: "Small, pale shapes that look far away are in the background." },
  "focal-point": { prompt: "One bright red balloon sits among gray balloons, and your eyes go to it first. What is the red balloon?", options: [{ id: "a", text: "The focal point" }, { id: "b", text: "The background" }, { id: "c", text: "A secondary color" }], answer: "a", explain: "The part your eye sees first is the focal point." },
};
activity.pairs = activity.pairs.map((p) => ({ ...p, transfer: p.transfer ?? TRANSFER[p.id] }));

export default activity;
