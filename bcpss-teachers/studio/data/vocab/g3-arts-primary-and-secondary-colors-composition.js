// Grade 3 visual arts: primary and secondary colors, and the words artists use to talk about composition. Original text and pictures.
import {
  BALANCE,
  CONTRAST_PAIR,
  OVERLAP,
  PRIMARY_ROW,
  SECONDARY_ROW,
  artworkA,
  artworkCallout,
  colorWheel,
  mixing,
} from "../kits/c8-color-composition.js";

const common = { domains: ["Speaking", "Writing"], klu: "Explain", tier: 2 };

export default {
  id: "g3-arts-primary-and-secondary-colors-composition",
  title: "Color and Composition: Artist Words",
  grade: "3",
  band: "3-5",
  subject: "arts",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the National Core Arts Standards in visual arts (creating and responding); not mapped to a district unit sequence.",
  },
  standards: ["VA:Cr2.1.3a", "VA:Re8.1.3"],
  entries: [
    {
      id: "primary-color",
      word: "primary color",
      pos: "noun phrase",
      pron: "PRY-mair-ee KUL-er",
      def: "One of three colors, red, yellow and blue, that you cannot make by mixing other paint colors.",
      visual: PRIMARY_ROW,
      context: "Red is a primary color, so I cannot mix it from other paints.",
      nonExample: "Green is not a primary color. You can make it by mixing yellow and blue.",
      academicSentence: "Artists start with the primary colors to mix many other colors.",
      everyday: "Like the three basic crayons you need to mix all the rest.",
      misconception:
        "Students think any bright color is primary. The primary colors are only red, yellow and blue.",
      related: ["secondary-color", "color-wheel", "mix"],
      practice: {
        visualPrompt: "Which three colors are the primary colors?",
        speakWrite:
          "Name the three primary colors to a partner. Then write: The primary colors are ___.",
        retrieval: "Yesterday we learned about colors that cannot be mixed. Which word names them?",
      },
      ...common,
    },
    {
      id: "secondary-color",
      word: "secondary color",
      pos: "noun phrase",
      pron: "SEK-un-dair-ee KUL-er",
      def: "A color you make by mixing two primary colors. Orange, green and purple are secondary colors.",
      visual: SECONDARY_ROW,
      context: "Blue and yellow are primary colors, and green is the secondary color they make.",
      nonExample: "Red is not a secondary color. It is a primary color, so you cannot mix it.",
      academicSentence: "A secondary color is made from two primary colors.",
      everyday: "Like blending two juices to get a new flavor.",
      misconception:
        "Students think any mix makes a secondary color. A secondary color uses exactly two primary colors.",
      morphology: { parts: [{ part: "second-", meaning: "next after the first" }] },
      related: ["primary-color", "mix", "color-wheel"],
      practice: {
        visualPrompt: "Which pair of colors makes green?",
        speakWrite:
          "Tell a partner two primary colors and the secondary color they make. Write the equation.",
        retrieval: "Which two primary colors make purple?",
      },
      ...common,
    },
    {
      id: "color-wheel",
      word: "color wheel",
      pos: "noun phrase",
      pron: "KUL-er WEEL",
      def: "A circle that shows colors in order so you can see how they are related.",
      visual: colorWheel(),
      context: "On the color wheel, orange sits between red and yellow.",
      nonExample:
        "A wheel on a bike is not a color wheel. A color wheel is a picture, not a tool for riding.",
      academicSentence: "Artists use a color wheel to choose colors that go together.",
      everyday: "Like a clock face, but for colors.",
      misconception:
        "The colors are in a set order. Orange belongs between red and yellow, and a secondary color sits between the two primaries that make it.",
      related: ["primary-color", "secondary-color"],
      practice: {
        visualPrompt: "Which color sits between red and yellow on the wheel?",
        speakWrite:
          "Point to a color on the wheel and tell a partner the two colors on each side. Write one sentence.",
        retrieval: "What does a color wheel show?",
      },
      ...common,
    },
    {
      id: "mix",
      word: "mix",
      pos: "verb",
      pron: "MIKS",
      def: "To stir or blend two paint colors together to make a new color.",
      visual: mixing("red", "yellow", "orange", true),
      context: "When I mix red and yellow, I get orange.",
      nonExample:
        "Placing red next to yellow without stirring is not mixing. Mixing blends them into one new color.",
      academicSentence: "We mix two primary colors to make a secondary color.",
      everyday: "Like stirring chocolate syrup into milk.",
      misconception: "Mixing three or more colors often makes a dull brown. Start with just two.",
      related: ["primary-color", "secondary-color"],
      practice: {
        visualPrompt: "Which picture shows two colors that have been mixed?",
        speakWrite:
          "Act out mixing yellow and blue with your hands. Say what you made. Write the equation.",
        retrieval: "What do we do with two primary colors to make a secondary color?",
      },
      ...common,
    },
    {
      id: "composition",
      word: "composition",
      pos: "noun",
      pron: "kom-puh-ZISH-un",
      def: "How an artist arranges colors, shapes and objects in a picture.",
      visual: artworkA(),
      context:
        "The artist planned the composition so the barn is in the middle and the flowers fill the corner.",
      nonExample:
        "Writing a paragraph is also called composition, but in art the word is about the arrangement of the picture.",
      academicSentence: "A strong composition helps the viewer know where to look.",
      everyday: "Like deciding where to put every toy before you take a photo.",
      misconception:
        "Composition is not the same as the subject. The subject is what is in the picture; composition is how it is arranged.",
      related: ["focal-point", "balance", "overlap"],
      practice: {
        visualPrompt: "Which picture shows the whole arrangement of a painting?",
        speakWrite:
          "Tell a partner where one thing is placed in the picture. Write a sentence that starts with The artist placed.",
        retrieval: "What is composition?",
      },
      ...common,
    },
    {
      id: "focal-point",
      word: "focal point",
      pos: "noun phrase",
      pron: "FOH-kul POYNT",
      def: "The part of a picture that your eye sees first.",
      visual: artworkCallout(
        "focal point",
        290,
        176,
        120,
        92,
        "A painting of a farm. A callout labeled focal point points to the red barn in the middle.",
      ),
      context:
        "In this painting the red barn is the focal point because it is bright against the green field.",
      nonExample: "The pale hills far away are not the focal point. Your eye goes to them last.",
      academicSentence: "Artists use color and size to make a focal point.",
      everyday: "Like the one bright balloon in a group of gray ones.",
      misconception:
        "The focal point does not have to be in the exact middle. It is the part that pulls the eye first.",
      related: ["contrast", "composition"],
      practice: {
        visualPrompt: "Which part of the picture do your eyes go to first?",
        speakWrite:
          "Show a partner where your eyes go first in a painting. Say why. Write one sentence with because.",
        retrieval: "What do we call the part of a picture your eye sees first?",
      },
      ...common,
    },
    {
      id: "contrast",
      word: "contrast",
      pos: "noun",
      pron: "KON-trast",
      def: "A big difference between two things next to each other, such as a light color and a dark color.",
      visual: CONTRAST_PAIR,
      context: "There is strong contrast between the bright yellow moon and the dark sky.",
      nonExample:
        "Two colors that are almost the same, like pale yellow and light yellow, have low contrast.",
      academicSentence: "Contrast makes a shape stand out from what is around it.",
      everyday: "Like white chalk on a black chalkboard.",
      misconception:
        "Contrast is not only about light and dark. A red shape on a green field also stands out.",
      related: ["focal-point", "composition"],
      practice: {
        visualPrompt: "Which picture has high contrast?",
        speakWrite:
          "Name two colors that have high contrast. Write: ___ and ___ have high contrast.",
        retrieval: "What does contrast help a shape do?",
      },
      ...common,
    },
    {
      id: "balance",
      word: "balance",
      pos: "noun",
      pron: "BAL-uns",
      def: "When the parts of a picture feel even, as if both sides weigh the same.",
      visual: BALANCE,
      context: "The two matching trees give the painting balance.",
      nonExample:
        "A painting with one huge shape in a corner and nothing else is not balanced; it feels heavy on one side.",
      academicSentence: "Artists use matching shapes on both sides to create balance.",
      everyday: "Like a seesaw with a child of the same weight on each end.",
      misconception:
        "Balance does not mean both sides must be exactly the same. A big shape can be balanced by several small ones.",
      related: ["composition", "overlap"],
      practice: {
        visualPrompt: "Which picture feels balanced?",
        speakWrite:
          "Tell a partner how you could balance a big shape on the left. Write one sentence.",
        retrieval: "What does it mean when a picture has balance?",
      },
      ...common,
    },
    {
      id: "overlap",
      word: "overlap",
      pos: "verb",
      pron: "OH-ver-lap",
      def: "When one shape covers part of another shape.",
      visual: OVERLAP,
      context: "The tree and the barn overlap, so the tree looks closer to us.",
      nonExample: "Two shapes side by side with a gap do not overlap.",
      academicSentence:
        "Overlapping shapes make some things look closer and others look farther away.",
      everyday: "Like one playing card lying on top of another.",
      misconception:
        "The shape on top looks closer. The shape that is partly hidden looks farther away.",
      related: ["composition", "foreground"],
      practice: {
        visualPrompt: "Which picture shows shapes that overlap?",
        speakWrite:
          "Hold up two papers and overlap them. Say which looks closer. Write one sentence.",
        retrieval: "What happens when two shapes overlap?",
      },
      ...common,
    },
    {
      id: "foreground",
      word: "foreground",
      pos: "noun",
      pron: "FOR-ground",
      def: "The part of a picture that looks closest to you.",
      visual: artworkCallout(
        "foreground",
        50,
        280,
        330,
        292,
        "A painting of a farm. A callout labeled foreground points to the big flowers at the bottom left corner.",
      ),
      context: "The big flowers are in the foreground, so they look close.",
      nonExample: "The hills far away are not in the foreground. They are in the background.",
      academicSentence: "Objects in the foreground are drawn larger and lower in the picture.",
      everyday: "Like the first row of people standing in a class photo.",
      misconception:
        "The foreground is not always the most important part. It is the part that looks nearest.",
      morphology: {
        parts: [
          { part: "fore-", meaning: "in front" },
          { part: "ground", meaning: "the part of a picture we look at" },
        ],
      },
      related: ["background", "overlap"],
      practice: {
        visualPrompt: "Which part of the picture is the foreground?",
        speakWrite:
          "Point to something in the foreground of a picture. Say how you know. Write one sentence.",
        retrieval: "Which part of a picture looks closest to you?",
      },
      ...common,
    },
    {
      id: "background",
      word: "background",
      pos: "noun",
      pron: "BAK-ground",
      def: "The part of a picture that looks farthest from you.",
      visual: artworkCallout(
        "background",
        60,
        170,
        120,
        72,
        "A painting of a farm. A callout labeled background points to the pale hills far behind the barn.",
      ),
      context: "The pale hills are in the background, so they look far away.",
      nonExample: "The big flowers are not in the background. They are in the foreground.",
      academicSentence: "Objects in the background are drawn smaller and look lighter.",
      everyday: "Like the mountains you can see far behind a school playground.",
      misconception:
        "The background is not empty. It is the part of the scene that looks far away.",
      morphology: {
        parts: [
          { part: "back-", meaning: "behind" },
          { part: "ground", meaning: "the part of a picture we look at" },
        ],
      },
      related: ["foreground", "composition"],
      practice: {
        visualPrompt: "Which part of the picture is the background?",
        speakWrite:
          "Point to the background of a picture and say why it looks far away. Write one sentence.",
        retrieval: "Which part of a picture looks farthest from you?",
      },
      ...common,
    },
  ],
  review: { status: "authored", checks: {} },
};
