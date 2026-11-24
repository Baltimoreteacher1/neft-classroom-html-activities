// BCPSS Writing Lab (TWR) — g2-math-u6 · Arrays, Equal Groups & Geometry. Contract: ../writing-schema.mjs

export default {
  title: "Describe a Hexagon",
  genre: "inform",
  tip: "Have students trace and count the sides and angles of a real hexagon block before they write.",
  lessons: [
    { id: "A", title: "Equal groups and repeated addition" },
    { id: "B", title: "Arrays: rows and columns" },
    { id: "C", title: "Polygons: sides and angles" },
    { id: "D", title: "Quadrilaterals and other shapes" },
  ],
  source: {
    title: "The Shape of a Honeycomb",
    lesson: "C",
    text: "A bee builds a honeycomb. Each cell is a hexagon. A hexagon is a polygon with 6 straight sides and 6 angles. A triangle is a polygon too, but it has only 3 sides. A circle is not a polygon because it has no straight sides. So a circle cannot be a hexagon.",
  },
  notes: [
    { sentence: "Each cell is a hexagon.", note: "cell = hexagon" },
    { sentence: "A hexagon is a polygon with 6 straight sides and 6 angles.", note: "hexagon = 6 sides + 6 angles" },
    { sentence: "A triangle is a polygon too, but it has only 3 sides.", note: "triangle = 3 sides" },
    { sentence: "A circle is not a polygon because it has no straight sides.", note: "circle ≠ polygon, no straight sides" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "A hexagon is a polygon",
      because: "it is a flat, closed shape with straight sides.",
      but: "a circle is not a polygon.",
      so: "we can count its sides and angles to name it.",
    },
    {
      lesson: "B",
      kernel: "The seed tray is an array",
      because: "the seeds sit in equal rows and columns.",
      but: "a messy pile of seeds is not an array.",
      so: "we can write 5 + 5 + 5 = 15 for 3 rows of 5.",
    },
    {
      lesson: "D",
      kernel: "A square is a quadrilateral",
      because: "it has 4 straight sides and 4 angles.",
      but: "not every quadrilateral is a square.",
      so: "we can sort it with the rectangles.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Keisha made equal groups.",
      parts: { where: "on the table", how: "of 4 seeds each", why: "to practice repeated addition" },
      model: "On the table, Keisha made equal groups of 4 seeds each to practice repeated addition.",
    },
    {
      lesson: "C",
      kernel: "The bee builds hexagons.",
      parts: { where: "in the hive", how: "with straight walls", why: "to store honey" },
      model: "In the hive, the bee builds hexagons with straight walls to store honey.",
    },
  ],
  fragments: [
    { text: "A hexagon has six sides.", is_sentence: true },
    { text: "Because a circle has no straight sides.", is_sentence: false, fix: "A circle is not a polygon because it has no straight sides." },
    { text: "Has four angles.", is_sentence: false, fix: "A rectangle has four angles." },
    { text: "Each row has five seeds.", is_sentence: true },
    { text: "The array with three rows.", is_sentence: false, fix: "The array has three rows." },
    { text: "A square is a quadrilateral.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "A polygon, ___, has only straight sides.",
      noun: "polygon",
      options: ["a flat, closed shape", "objects in equal rows and columns", "a corner where two sides meet"],
      answer: 0,
      model: "A polygon, a flat, closed shape, has only straight sides.",
    },
    {
      lesson: "B",
      sentence: "An array, ___, helps us count equal groups.",
      noun: "array",
      options: ["a flat shape with six sides", "objects in equal rows and columns", "a way to split a shape"],
      answer: 1,
      model: "An array, objects in equal rows and columns, helps us count equal groups.",
    },
    {
      lesson: "D",
      sentence: "A quadrilateral, ___, can be a square or a rectangle.",
      noun: "quadrilateral",
      options: ["a flat shape with six straight sides", "a line of objects going up and down", "a flat shape with four straight sides"],
      answer: 2,
      model: "A quadrilateral, a flat shape with four straight sides, can be a square or a rectangle.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "a circle is not a polygon", model: "Because a circle has no straight sides, a circle is not a polygon." },
    { lesson: "B", conjunction: "when", stem: "we can write 5 + 5 + 5", model: "When we count 3 rows of 5, we can write 5 + 5 + 5." },
    { lesson: "D", conjunction: "although", stem: "a triangle is not a quadrilateral", model: "Although a triangle is a polygon, a triangle is not a quadrilateral." },
  ],
  spo: {
    topic: {
      l1_2: "A [hexagon] is a [polygon].",
      l3_4: "A [hexagon] is a polygon that has [6 straight sides] and [6 angles].",
      l5_6: "A [hexagon], [a flat, closed shape], has [6 straight sides and 6 angles], although [a circle or a triangle] is not one.",
    },
    starters: [
      { type: "question", text: "What makes a shape a hexagon?" },
      { type: "appositive", text: "A hexagon, a polygon with six sides, is the shape of a honeycomb cell." },
      { type: "subordinate", text: "Although a triangle is a polygon, it is not a hexagon." },
    ],
    details: [
      { note: "honeycomb cell = hexagon", lesson: "C" },
      { note: "hexagon = 6 sides + 6 angles", lesson: "C" },
      { note: "polygon = flat, closed, straight sides", lesson: "C" },
      { note: "triangle = 3 sides, not hexagon", lesson: "D" },
      { note: "circle = no straight sides", lesson: "D" },
      { note: "quadrilateral = 4 sides, not hexagon", lesson: "D" },
    ],
    distractors: ["bees make sweet honey", "honey is golden"],
    conclusion: {
      l1_2: "So a [hexagon] has [6] sides.",
      l3_4: "So a [hexagon] is a polygon, but a [circle] is not.",
      l5_6: "In conclusion, [a hexagon] is [a polygon with 6 sides and 6 angles], whereas [a circle or triangle] is not one.",
    },
  },
  prompt: {
    l1_2: "Draw a hexagon. Write 1-3 sentences that tell what it is and what it has.",
    l3_4: "Write a paragraph that tells what a hexagon is, what it has, and what it is not. Use that, because, and but.",
    l5_6: "Write a paragraph that describes a hexagon with precise words. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "A hexagon is", "It has", "Also,", "But", "Because", "For example,", "In the end,"],
  model: {
    l1_2: "A hexagon is a polygon. It has 6 sides and 6 angles.",
    l3_4: "A hexagon is a polygon that has 6 straight sides and 6 angles. A honeycomb cell is a hexagon. A triangle is not a hexagon because it has only 3 sides.",
    l5_6: "A hexagon, a flat shape with 6 straight sides, is the shape of a honeycomb cell. It has 6 angles too. Although a triangle is a polygon, it is not a hexagon. A circle is not a polygon because it has no straight sides.",
  },
  revise: [
    "Did I tell what kind of shape it is?",
    "Did I tell how many sides and angles it has?",
    "Did I tell one shape it is not, and why?",
    "Did I use that or which to add a detail?",
  ],
};
