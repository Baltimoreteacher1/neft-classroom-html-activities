// BCPSS Writing Lab (TWR) — g4-math-u6 · Angles, Lines & 2D Classification. Contract: ../writing-schema.mjs

export default {
  title: "Sort the Quilt Shapes",
  genre: "inform",
  tip: "Have students sketch each shape and label its angles before writing so every definition has a picture behind it.",
  lessons: [
    { id: "A", title: "Measuring angles with a protractor" },
    { id: "B", title: "Acute, right, and obtuse angles" },
    { id: "C", title: "Parallel and perpendicular lines" },
    { id: "D", title: "Classifying triangles and quadrilaterals" },
  ],
  source: {
    title: "Shapes on a Quilt",
    lesson: "D",
    text: "Camille looks at a quilt at a Baltimore craft fair. One patch is a rectangle. She measures each corner with a protractor, and every angle is 90 degrees, so each one is a right angle. The opposite sides never meet, so they are parallel. A rectangle is a quadrilateral that has four right angles. Another patch is a triangle with angles of 90, 40, and 50 degrees. It has one right angle, and the other two angles are acute because they are less than 90 degrees. A triangle is not a quadrilateral because it has only three sides.",
  },
  notes: [
    { sentence: "A rectangle is a quadrilateral that has four right angles.", note: "rectangle = quadrilateral + 4 right angles" },
    { sentence: "The opposite sides never meet, so they are parallel.", note: "opposite sides never meet = parallel" },
    { sentence: "It has one right angle, and the other two angles are acute because they are less than 90 degrees.", note: "1 right angle; 2 acute (< 90°)" },
    { sentence: "A triangle is not a quadrilateral because it has only three sides.", note: "triangle ≠ quadrilateral; 3 sides" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Each corner of the rectangle is a right angle",
      because: "the protractor shows exactly 90 degrees.",
      but: "an acute angle would show less than 90 degrees.",
      so: "she can name every corner of the patch.",
    },
    {
      lesson: "B",
      kernel: "The triangle patch has two acute angles",
      because: "40 degrees and 50 degrees are both less than 90 degrees.",
      but: "it also has one right angle.",
      so: "we can call it a right triangle.",
    },
    {
      lesson: "D",
      kernel: "A rectangle is a quadrilateral",
      because: "it has four straight sides.",
      but: "a triangle belongs to a different group.",
      so: "she sorts the two patches into separate piles.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Camille measured the angle.",
      parts: { when: "at the craft fair", where: "at the corner of the patch", how: "with a protractor", why: "to name the angle" },
      model: "At the craft fair, Camille measured the angle at the corner of the patch with a protractor to name the angle.",
    },
    {
      lesson: "D",
      kernel: "Camille sorted the shapes.",
      parts: { when: "after measuring", how: "by their sides and angles", why: "to make groups that match" },
      model: "After measuring, Camille sorted the shapes by their sides and angles to make groups that match.",
    },
  ],
  fragments: [
    { text: "A rectangle has four right angles.", is_sentence: true },
    { text: "Measures 90 degrees.", is_sentence: false, fix: "Each corner of the rectangle measures 90 degrees." },
    { text: "Because the sides meet to make a square corner.", is_sentence: false, fix: "The sides are perpendicular because they meet to make a square corner." },
    { text: "The triangle has three sides.", is_sentence: true },
    { text: "An angle that is smaller than a square corner.", is_sentence: false, fix: "An acute angle is an angle that is smaller than a square corner." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A protractor, ___, tells Camille how wide the corner is.",
      noun: "protractor",
      options: ["a tool that measures angles", "a flat shape with four straight sides", "a fold line that makes two matching halves"],
      answer: 0,
      model: "A protractor, a tool that measures angles, tells Camille how wide the corner is.",
    },
    {
      lesson: "B",
      sentence: "An obtuse angle, ___, is not found in Camille's right triangle.",
      noun: "obtuse angle",
      options: ["an angle that is smaller than a square corner", "a square corner that measures exactly 90 degrees", "an angle that is wider than a square corner but not a straight line"],
      answer: 2,
      model: "An obtuse angle, an angle that is wider than a square corner but not a straight line, is not found in Camille's right triangle.",
    },
    {
      lesson: "C",
      sentence: "Perpendicular lines, ___, can be found at the corner of a rectangle.",
      noun: "Perpendicular lines",
      options: ["lines that stay the same distance apart and never meet", "lines that meet to make a square corner", "a fold line that makes two matching halves"],
      answer: 1,
      model: "Perpendicular lines, lines that meet to make a square corner, can be found at the corner of a rectangle.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "the triangle is not a quadrilateral", model: "Because it has only three sides, the triangle is not a quadrilateral." },
    { lesson: "A", conjunction: "when", stem: "the angle is a right angle", model: "When a protractor shows exactly 90 degrees, the angle is a right angle." },
    { lesson: "C", conjunction: "since", stem: "the two sides of the triangle are perpendicular", model: "Since the sides meet to make a square corner, the two sides of the triangle are perpendicular." },
  ],
  spo: {
    topic: {
      l1_2: "A rectangle and a triangle are [different] shapes.",
      l3_4: "A rectangle is a [quadrilateral] that has [four right angles], whereas a triangle has [three sides].",
      l5_6: "Although both patches have [a right angle], a rectangle is [a quadrilateral that has four right angles], but a triangle is [not one] because [it has only three sides].",
    },
    starters: [
      { type: "question", text: "How can you tell a rectangle from a triangle by its angles and sides?" },
      { type: "appositive", text: "Camille, a young quilter at a Baltimore craft fair, sorted shapes by their angles." },
      { type: "subordinate", text: "Although both shapes have a right angle, only one of them is a quadrilateral." },
    ],
    details: [
      { note: "rectangle: 4 sides, 4 right angles", lesson: "D" },
      { note: "opposite sides parallel", lesson: "C" },
      { note: "protractor: each corner = 90°", lesson: "A" },
      { note: "triangle: 90°, 40°, 50°", lesson: "B" },
      { note: "2 acute angles (< 90°)", lesson: "B" },
      { note: "triangle ≠ quadrilateral; 3 sides", lesson: "D" },
    ],
    distractors: ["quilts keep people warm in winter", "craft fairs sell candles and jewelry"],
    conclusion: {
      l1_2: "A rectangle has [4] sides and a triangle has [3].",
      l3_4: "In short, a rectangle is a [quadrilateral], but a triangle [is not] because [it has three sides].",
      l5_6: "Therefore, [measuring angles and checking sides] lets us sort shapes so precisely that [anyone could repeat the sort].",
    },
  },
  prompt: {
    l1_2: "Draw a rectangle and a triangle. Write 2-3 sentences that tell how they are different. Use the words sides and angle.",
    l3_4: "Write a paragraph that describes and sorts a rectangle and a triangle. Use your outline, that, and because.",
    l5_6: "Write a paragraph that defines a rectangle and a right triangle, using angles, parallel lines, and perpendicular lines. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "Next,", "For example,", "In contrast,", "However,", "Because", "Whereas", "In short,"],
  model: {
    l1_2: "A rectangle has four sides. A triangle has three sides. A rectangle has four right angles.",
    l3_4: "A rectangle is a quadrilateral that has four right angles, whereas a triangle has only three sides. Camille measured each corner of the rectangle with a protractor, and every angle was 90 degrees. The opposite sides never meet, so they are parallel. Her triangle has angles of 90, 40, and 50 degrees, so it has one right angle and two acute angles. A triangle is not a quadrilateral because it has only three sides.",
    l5_6: "Although both patches have a right angle, a rectangle is a quadrilateral that has four right angles, but a triangle is not one because it has only three sides. Camille, a young quilter at a Baltimore craft fair, measured each corner of the rectangle with a protractor. Every angle was 90 degrees, so each one is a right angle. The opposite sides never meet, so they are parallel. Her triangle has angles of 90, 40, and 50 degrees, which means it has one right angle and two acute angles. Since the two sides of the triangle meet to make a square corner, they are perpendicular. Therefore, measuring angles and checking sides lets us sort shapes so precisely that anyone could repeat the sort.",
  },
  revise: [
    "Did I define each shape with that or which, using its sides and angles?",
    "Did I use exact angle measures, like 90 degrees, with the right word: acute, right, or obtuse?",
    "Did I say why a triangle is not a quadrilateral?",
    "Did I use parallel or perpendicular correctly?",
  ],
};
