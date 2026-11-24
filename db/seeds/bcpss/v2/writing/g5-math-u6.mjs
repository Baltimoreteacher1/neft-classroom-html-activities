// BCPSS Writing Lab (TWR) — g5-math-u6 · Coordinate Plane, Patterns & 2D Hierarchy. Contract: ../writing-schema.mjs

export default {
  title: "Shapes in the Same Family",
  genre: "inform",
  tip: "Give every student a non-example card, such as a 5 by 2 rectangle, so each definition is tested before it is written.",
  lessons: [
    { id: "A", title: "Graphing ordered pairs in Quadrant I" },
    { id: "B", title: "Number patterns and rules" },
    { id: "C", title: "Classifying quadrilaterals by attributes" },
    { id: "D", title: "The hierarchy of two-dimensional shapes" },
  ],
  source: {
    title: "Sorting Shapes on a Poster",
    lesson: "C",
    text: "Ms. Carter's class sorts shapes on a poster. A quadrilateral is a flat shape with exactly four straight sides. A parallelogram is a type of quadrilateral that has two pairs of parallel sides. A rectangle is a type of parallelogram that has four right angles. A square is a type of rectangle that has four equal sides, so every square is a rectangle. However, not every rectangle is a square. A rectangle that is 5 centimeters long and 2 centimeters wide has sides of different lengths.",
  },
  notes: [
    { sentence: "A parallelogram is a type of quadrilateral that has two pairs of parallel sides.", note: "parallelogram: 2 pairs parallel sides" },
    { sentence: "A rectangle is a type of parallelogram that has four right angles.", note: "rectangle = parallelogram + 4 right angles" },
    { sentence: "A square is a type of rectangle that has four equal sides, so every square is a rectangle.", note: "square = rectangle + 4 equal sides" },
    { sentence: "A rectangle that is 5 centimeters long and 2 centimeters wide has sides of different lengths.", note: "5 × 2 rectangle ≠ square" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The point (4, 3) is 4 units right and 3 units up",
      because: "the first number tells the move along the x-axis.",
      but: "the point (3, 4) is in a different place.",
      so: "the order of the two numbers matters.",
    },
    {
      lesson: "C",
      kernel: "A square is a rectangle",
      because: "it has four right angles.",
      but: "a rectangle is not always a square.",
      so: "a square is called a special rectangle.",
    },
    {
      lesson: "D",
      kernel: "A hierarchy sorts shapes into groups",
      because: "it goes from big groups to smaller, more specific groups.",
      but: "one shape can belong to several groups at once.",
      so: "a square is also a rhombus, a rectangle, and a parallelogram.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Zara moved.",
      parts: { when: "first", where: "from the origin", how: "four units to the right", why: "to follow the ordered pair (4, 3)" },
      model: "First, Zara moved from the origin four units to the right to follow the ordered pair (4, 3).",
    },
    {
      lesson: "C",
      kernel: "Ms. Carter sorted shapes.",
      parts: { when: "during math class", where: "on a poster", why: "to show how they are related" },
      model: "During math class, Ms. Carter sorted shapes on a poster to show how they are related.",
    },
  ],
  fragments: [
    { text: "A rhombus has four equal sides.", is_sentence: true },
    { text: "A shape with four straight sides.", is_sentence: false, fix: "A quadrilateral is a shape with four straight sides." },
    { text: "Every square is a rectangle.", is_sentence: true },
    { text: "Because a square has four right angles.", is_sentence: false, fix: "A square is a rectangle because it has four right angles." },
    { text: "Moves four units right and three units up.", is_sentence: false, fix: "Zara moves four units right and three units up." },
    { text: "The point where the two number lines cross.", is_sentence: false, fix: "The origin is the point where the two number lines cross." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The origin, ___, is where Zara starts.",
      noun: "origin",
      options: ["the point (0, 0) where the number lines cross", "two numbers in order that name a point", "a rule that tells how to get each number in a pattern"],
      answer: 0,
      model: "The origin, the point (0, 0) where the number lines cross, is where Zara starts.",
    },
    {
      lesson: "C",
      sentence: "A parallelogram, ___, can have sides of different lengths.",
      noun: "parallelogram",
      options: ["a four-sided shape with all four sides the same length", "a flat shape with exactly three sides", "a four-sided shape with two pairs of parallel sides"],
      answer: 2,
      model: "A parallelogram, a four-sided shape with two pairs of parallel sides, can have sides of different lengths.",
    },
    {
      lesson: "D",
      sentence: "A rhombus, ___, is a type of parallelogram.",
      noun: "rhombus",
      options: ["a four-sided shape with all four sides the same length", "a point on a grid", "a feature of a shape, like the number of sides"],
      answer: 0,
      model: "A rhombus, a four-sided shape with all four sides the same length, is a type of parallelogram.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "if", stem: "the pattern continues with 15", model: "If the rule is add 3, the pattern 3, 6, 9, 12 continues with 15." },
    { lesson: "C", conjunction: "because", stem: "every square is a rectangle", model: "Because a square has four right angles, every square is a rectangle." },
    { lesson: "D", conjunction: "although", stem: "it is not always a rhombus", model: "Although a rectangle is a parallelogram, it is not always a rhombus." },
  ],
  spo: {
    topic: {
      l1_2: "A square is a type of [rectangle] that has [four equal sides].",
      l3_4: "A [square] is a type of [rectangle] that has [four equal sides], but a [rectangle] is not always a square.",
      l5_6: "Although [every square is a rectangle], not every [rectangle] is a [square] because [its sides may have different lengths].",
    },
    starters: [
      { type: "statement", text: "Every square is a rectangle, but not every rectangle is a square." },
      { type: "question", text: "How can one shape belong to more than one group?" },
      { type: "appositive", text: "A square, a rectangle with four equal sides, fits into many groups of shapes." },
    ],
    details: [
      { note: "quadrilateral = 4 straight sides", lesson: "C" },
      { note: "parallelogram = 2 pairs parallel sides", lesson: "C" },
      { note: "rectangle = parallelogram + 4 right angles", lesson: "C" },
      { note: "square = rectangle + 4 equal sides", lesson: "D" },
      { note: "5 cm × 2 cm rectangle: not a square", lesson: "D" },
      { note: "hierarchy: big groups → specific groups", lesson: "D" },
    ],
    distractors: ["a triangle has three sides", "graphs use an x-axis and a y-axis"],
    conclusion: {
      l1_2: "A square is a [rectangle], but a rectangle is not always a [square].",
      l3_4: "So every [square] is a [rectangle], but a [5 by 2 rectangle] is not a square.",
      l5_6: "Therefore, [a square] belongs to many groups in the hierarchy, whereas [a rectangle with unequal sides] is not a [rhombus or a square].",
    },
  },
  prompt: {
    l1_2: "Draw a square and a 5 by 2 rectangle. Write 2-4 sentences. Tell what a square is and one shape that is not a square.",
    l3_4: "Write a paragraph that defines a square, tells how it is related to a rectangle, and gives a non-example. Use your outline, is a type of, and that has.",
    l5_6: "Write a paragraph that classifies a square in the shape hierarchy and uses a non-example to prove where other shapes belong. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "A", "is a type of", "that has", "However,", "For example,", "In contrast,", "Therefore,"],
  model: {
    l1_2: "A square is a type of rectangle. It has four equal sides. A rectangle that is 5 cm by 2 cm is not a square.",
    l3_4: "A square is a type of rectangle that has four equal sides. A square has four right angles, so every square is a rectangle. However, a rectangle is not always a square. For example, a rectangle that is 5 centimeters long and 2 centimeters wide has sides of different lengths. So it is not a square.",
    l5_6: "Although every square is a rectangle, not every rectangle is a square. A quadrilateral, a flat shape with exactly four straight sides, is the biggest group. A parallelogram is a type of quadrilateral that has two pairs of parallel sides. A rectangle is a type of parallelogram that has four right angles. A square is a type of rectangle that has four equal sides, so it also belongs to the rhombus group. In contrast, a rectangle that is 5 centimeters long and 2 centimeters wide is not a square, because its sides are not all equal.",
  },
  mpo: {
    thesis: "The hierarchy of two-dimensional shapes sorts shapes from big groups to small groups, and each shape can be defined by its attributes.",
    paragraphs: [
      { topic: "Quadrilaterals are the biggest group of shapes.", notes: ["quadrilateral = 4 straight sides", "includes many shapes"] },
      { topic: "Parallelograms and rectangles are smaller groups.", notes: ["parallelogram = 2 pairs parallel sides", "rectangle = parallelogram + 4 right angles"] },
      { topic: "Rhombuses and squares are the most specific groups.", notes: ["rhombus = 4 equal sides", "square = rectangle + rhombus", "5 × 2 rectangle ≠ square"] },
    ],
    conclusion: "Because shapes share attributes, one shape can belong to several groups, and a clear definition with a non-example proves where it fits.",
  },
  revise: [
    "Did I define each shape with is a type of and that has?",
    "Did I give a non-example, such as the 5 by 2 rectangle, to show a limit?",
    "Did I name the exact attribute: parallel sides, right angles, or equal sides?",
    "Did I show how the shapes fit together from big groups to small groups?",
  ],
};
