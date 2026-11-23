// Visual Match: connect multiplication words to arrays, definitions and sentences (grade 3 math).
import { arr, groups } from "../vocab/g3-math-multiplication-arrays.js";

const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });

export default {
  id: "g3-math-array-match",
  engine: "visual-match",
  title: "Match multiplication words to arrays",
  grade: "3",
  band: "3-5",
  subject: "math",
  lessonId: "g3-math-multiplication-arrays",
  standards: ["3.OA.A.1", "3.OA.A.3"],
  curriculum: {
    status: "district-referenced",
    unitId: "g3-math-u1",
    note: "Matches the Multiplication & Division Foundations unit in the BCPSS curriculum seed. Pictures, meanings and sentences are original.",
  },
  vocabIds: [
    "g3-math-multiplication-arrays:array",
    "g3-math-multiplication-arrays:row",
    "g3-math-multiplication-arrays:column",
    "g3-math-multiplication-arrays:equal-groups",
    "g3-math-multiplication-arrays:factor",
    "g3-math-multiplication-arrays:product",
  ],
  minutes: 15,
  intro:
    "Match each multiplication word to the picture, the meaning or the sentence that fits it. Count the objects and check which way each line goes.",
  modes: ["term-visual", "term-definition", "term-example"],
  pairs: [
    {
      id: "p1",
      term: "array",
      visual: arr(
        3,
        4,
        "Twelve counters set out neatly in 3 lines going across, with 4 counters in every line",
        {
          note: "neat, equal lines",
        },
      ),
      definition: "Objects set out in equal lines going across and equal lines going down.",
      example: "The desks in our classroom make an array with four lines of six desks.",
      why: "The counters are lined up with the same number in every line, going across and going down.",
      hints: [
        "Look for the picture where the objects are lined up neatly.",
        "Every line has the same number of objects.",
        "There are lines going across and lines going down.",
      ],
      confusions: [
        {
          pick: "p4",
          tag: "groups-not-lines",
          hint: "That word names sets of the same size, but the sets do not have to be lined up. Look at how these objects are placed.",
        },
      ],
      transfer: {
        prompt: "Which picture of chairs is an array?",
        options: [
          { id: "a", text: "Chairs in 3 even lines of 5" },
          { id: "b", text: "Chairs scattered around the room" },
          { id: "c", text: "One long line of 2 chairs and a pile of 9 chairs" },
        ],
        answer: "a",
        explain: "Only equal, even lines make a picture you can count by lines.",
      },
    },
    {
      id: "p2",
      term: "row",
      visual: arr(
        3,
        5,
        "Fifteen counters in 3 lines going across. The middle line, with 5 counters, is colored coral",
        {
          mark: { row: 1 },
          note: "one line across",
        },
      ),
      definition: "A line of objects going across, from side to side.",
      example: "Each row in the garden has five tomato plants.",
      forms: ["rows"],
      why: "The coral line goes across from the left side to the right side, so it is a line going across.",
      hints: [
        "This line goes from side to side.",
        "Think of desks in a straight line across the classroom.",
        "Look for the colored line that goes across the picture.",
      ],
      confusions: [
        {
          pick: "p3",
          tag: "row-column-mixup",
          hint: "That word names a line going up and down. Check the direction of the colored line.",
        },
      ],
      transfer: {
        prompt:
          "A seating chart has 4 lines going across with 6 seats in each line. How many seats are in one line going across?",
        options: [
          { id: "a", text: "6" },
          { id: "b", text: "4" },
          { id: "c", text: "24" },
        ],
        answer: "a",
        explain: "One line going across holds 6 seats; the 4 tells how many lines there are.",
      },
    },
    {
      id: "p3",
      term: "column",
      visual: arr(
        3,
        5,
        "Fifteen counters in 5 lines going up and down. The second line from the left, with 3 counters, is colored coral",
        {
          mark: { col: 1 },
          note: "one line down",
        },
      ),
      definition: "A line of objects going up and down, from top to bottom.",
      example: "The first column on the chart has three stickers.",
      forms: ["columns"],
      why: "The coral line goes from the top down to the bottom, so it is a line going up and down.",
      hints: [
        "This line goes from top to bottom.",
        "Think of a tall pillar holding up a building.",
        "Look for the colored line that goes up and down.",
      ],
      confusions: [
        {
          pick: "p2",
          tag: "row-column-mixup",
          hint: "That word names a line going across. Check the direction of the colored line.",
        },
      ],
    },
    {
      id: "p4",
      term: "equal groups",
      visual: groups(
        3,
        4,
        "Three ovals each holding 4 dots, so three sets of the same size",
        "same size sets",
      ),
      definition: "Sets that each hold the same number of objects.",
      example: "The teacher put the markers into equal groups of six.",
      why: "Every oval holds the same number of dots, so the sets are the same size.",
      hints: [
        "Count how many dots are inside each oval.",
        "Compare the numbers from oval to oval.",
        "Look for sets that are all the same size.",
      ],
      confusions: [
        {
          pick: "p1",
          tag: "lines-not-sets",
          hint: "That word is about objects lined up in even lines. This picture shows separate sets.",
        },
      ],
    },
    {
      id: "p5",
      term: "factor",
      visual: arr(
        2,
        6,
        "Twelve counters in 2 lines of 6, with a caption saying the numbers 2 and 6 are the ones being multiplied",
        {
          note: "multiply 2 and 6",
        },
      ),
      definition: "One of the two numbers that are multiplied together.",
      example: "In 2 times 6 equals 12, the number 2 is a factor.",
      forms: ["factors"],
      why: "The caption names 2 and 6 as the numbers being multiplied, and each of them is one of the two numbers.",
      hints: [
        "Two numbers are being multiplied in this picture.",
        "These numbers are not the answer.",
        "They tell how many lines there are and how many are in each line.",
      ],
      confusions: [
        {
          pick: "p6",
          tag: "factor-product-mixup",
          hint: "That word names the answer from multiplying. This card is about a number that goes into the multiplying.",
        },
      ],
    },
    {
      id: "p6",
      term: "product",
      visual: arr(3, 4, "Twelve counters in 3 lines of 4, with a caption saying 12 in all", {
        note: "12 in all",
      }),
      definition: "The answer when two numbers are multiplied.",
      example: "The product of 3 and 4 is twelve.",
      why: "The caption says 12 in all, and twelve is the answer when 3 and 4 are multiplied.",
      hints: [
        "This is the answer to a multiplication.",
        "It is the total number of counters.",
        "Count all the counters to check.",
      ],
      confusions: [
        {
          pick: "p5",
          tag: "factor-product-mixup",
          hint: "That word names one of the numbers being multiplied. This card is about the answer.",
        },
      ],
      transfer: {
        prompt: "Which number is the product in 5 times 2 equals 10?",
        options: [
          { id: "a", text: "10" },
          { id: "b", text: "5" },
          { id: "c", text: "2" },
        ],
        answer: "a",
        explain: "The answer, 10, is the product. The numbers 5 and 2 are the factors.",
      },
    },
  ],
  distractors: [
    {
      id: "d1",
      term: "sum",
      tag: "adds-not-multiplies",
      hint: "This word is about adding amounts together. Does the card describe combining equal sets by multiplying?",
    },
    {
      id: "d2",
      term: "divide",
      tag: "divide-confusion",
      hint: "Dividing splits a total into equal sets. This card is about building a total from equal sets.",
    },
    {
      id: "d3",
      definition: "The answer when two numbers are added together.",
      tag: "adds-meaning",
      hint: "That meaning is about adding, and the numbers being added do not need to be the same.",
    },
    {
      id: "d4",
      visual: {
        kind: "shapes",
        alt: "Three ovals holding 2, 5 and 3 dots, so the sets are different sizes",
        w: 480,
        h: 300,
        items: [
          { t: "ellipse", cx: 90, cy: 130, rx: 60, ry: 78, fill: "paper", stroke: "navy", sw: 2.5 },
          { t: "circle", cx: 75, cy: 130, r: 10, fill: "ochre", stroke: "navy", sw: 1.5 },
          { t: "circle", cx: 105, cy: 130, r: 10, fill: "ochre", stroke: "navy", sw: 1.5 },
          {
            t: "ellipse",
            cx: 240,
            cy: 130,
            rx: 60,
            ry: 78,
            fill: "paper",
            stroke: "navy",
            sw: 2.5,
          },
          ...[
            [215, 100],
            [265, 100],
            [240, 130],
            [215, 160],
            [265, 160],
          ].map(([cx, cy]) => ({
            t: "circle",
            cx,
            cy,
            r: 10,
            fill: "ochre",
            stroke: "navy",
            sw: 1.5,
          })),
          {
            t: "ellipse",
            cx: 390,
            cy: 130,
            rx: 60,
            ry: 78,
            fill: "paper",
            stroke: "navy",
            sw: 2.5,
          },
          ...[
            [365, 130],
            [390, 108],
            [415, 130],
          ].map(([cx, cy]) => ({
            t: "circle",
            cx,
            cy,
            r: 10,
            fill: "ochre",
            stroke: "navy",
            sw: 1.5,
          })),
        ],
      },
      tag: "unequal-sets",
      hint: "Count the objects in each set. Are all the sets the same size?",
    },
    {
      id: "d5",
      example: "There are seven pencils on the desk and five pencils on the floor.",
      tag: "no-equal-sets",
      hint: "This sentence puts two different amounts side by side. It does not describe lines or sets of the same size.",
    },
  ],
  supports: {
    ee: {
      frames: ["The picture shows ___ lines of ___.", "This line goes ___."],
      wordBank: ["across", "up and down", "same", "answer", "lines"],
      directions:
        "Tap a word first. Then tap the card that matches it. Point to each line with your finger and count.",
    },
    dev: {
      frames: ["I matched it because ___.", "There are ___ in each line."],
      wordBank: ["array", "factor", "product", "equal groups"],
    },
    exp: {},
    br: {},
  },
  reflection: {
    prompt: "What did you check first to decide which word matches which picture?",
    frames: fr(
      ["I counted ___.", "I looked at which way the line goes."],
      ["I checked the direction of the ___ first.", "A clue was ___."],
      [
        "I started by counting ___ in each line, then I checked whether the picture showed ___ or ___.",
      ],
      [
        "I separated the words about lines and the words about numbers, and then matched each by what it shows.",
      ],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
