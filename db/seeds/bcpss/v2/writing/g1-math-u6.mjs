// BCPSS Writing Lab (TWR) — g1-math-u6 · 2D/3D Geometry & Equal Shares. Contract: ../writing-schema.mjs

export default {
  title: "Shape Facts and Equal Shares",
  genre: "inform",
  tip: "Hand each student a real shape card or a paper sandwich to count sides and fold before they write a precise sentence.",
  lessons: [
    { id: "A", title: "Sides and corners of flat shapes" },
    { id: "B", title: "Solid shapes: cube and cone" },
    { id: "C", title: "Equal shares: halves" },
    { id: "D", title: "Equal shares: fourths" },
  ],
  source: {
    title: "Jamal's Shape Cards",
    lesson: "A",
    text: "Jamal makes shape cards in his Baltimore classroom. A triangle has 3 sides and 3 corners. A rectangle has 4 sides and 4 corners. A circle has no sides and no corners. Then Jamal cuts a sandwich. He cuts it into 2 equal shares. Each share is a half. Four equal shares are fourths.",
  },
  notes: [
    { sentence: "A triangle has 3 sides and 3 corners.", note: "triangle = 3 sides 3 corners" },
    { sentence: "A circle has no sides and no corners.", note: "circle = 0 sides 0 corners" },
    { sentence: "He cuts it into 2 equal shares.", note: "2 equal shares = halves" },
    { sentence: "Four equal shares are fourths.", note: "4 shares = fourths" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A triangle is not a rectangle",
      because: "it has 3 sides and a rectangle has 4.",
      but: "both have straight sides and corners.",
      so: "we count the sides to tell them apart.",
    },
    {
      lesson: "C",
      kernel: "Jamal cut the sandwich into 2 equal shares",
      because: "each part must be the same size.",
      but: "the parts are not fourths.",
      so: "each share is a half.",
    },
    {
      lesson: "A",
      kernel: "A circle has no corners",
      because: "it is round with no sides.",
      but: "a triangle has 3 corners.",
      so: "a circle is easy to tell from a triangle.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Jamal draws a rectangle.",
      parts: { when: "after lunch", where: "on a shape card", how: "with 4 straight sides" },
      model: "After lunch, Jamal draws a rectangle on a shape card with 4 straight sides.",
    },
    {
      lesson: "D",
      kernel: "Jamal cuts the sandwich.",
      parts: { when: "at lunch", how: "into 4 equal shares", why: "to share with a friend" },
      model: "At lunch, Jamal cuts the sandwich into 4 equal shares to share with a friend.",
    },
  ],
  fragments: [
    { text: "A circle has no corners.", is_sentence: true },
    { text: "Has 3 straight sides.", is_sentence: false, fix: "A triangle has 3 straight sides." },
    { text: "A rectangle has 4 corners.", is_sentence: true },
    { text: "Because each share is the same size.", is_sentence: false, fix: "They are halves because each share is the same size." },
    { text: "Two equal shares of a sandwich.", is_sentence: false, fix: "Two equal shares of a sandwich are halves." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A triangle, ___, has 3 corners.",
      noun: "A triangle",
      options: ["a flat shape with 3 straight sides", "a round shape with no sides", "one of 2 equal shares"],
      answer: 0,
      model: "A triangle, a flat shape with 3 straight sides, has 3 corners.",
    },
    {
      lesson: "B",
      sentence: "A cube, ___, has 6 flat squares.",
      noun: "A cube",
      options: ["a flat shape with 3 sides", "a solid shape like a game die", "a round flat shape"],
      answer: 1,
      model: "A cube, a solid shape like a game die, has 6 flat squares.",
    },
    {
      lesson: "C",
      sentence: "A half, ___, is bigger than a fourth.",
      noun: "A half",
      options: ["one of 4 equal shares", "a corner of a shape", "one of 2 equal shares"],
      answer: 2,
      model: "A half, one of 2 equal shares, is bigger than a fourth.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "a circle is not a triangle", model: "Because it has no sides, a circle is not a triangle." },
    { lesson: "C", conjunction: "when", stem: "each share is a half", model: "When Jamal cuts the sandwich into 2 equal shares, each share is a half." },
    { lesson: "D", conjunction: "if", stem: "each share is a fourth", model: "If he cuts it into 4 equal shares, each share is a fourth." },
  ],
  spo: {
    topic: {
      l1_2: "A [triangle] has [3] sides.",
      l3_4: "A [triangle] is a flat shape that has [3] sides and [3] corners.",
      l5_6: "Although [a triangle and a rectangle] are both flat shapes, [a triangle] has [3 sides] and [a rectangle] has [4].",
    },
    starters: [
      { type: "question", text: "How can you tell a triangle from a rectangle?" },
      { type: "appositive", text: "A triangle, a flat shape with 3 sides, has 3 corners." },
      { type: "command", text: "Count the sides to tell a triangle from a rectangle." },
    ],
    details: [
      { note: "triangle = 3 sides 3 corners", lesson: "A" },
      { note: "rectangle = 4 sides 4 corners", lesson: "A" },
      { note: "circle = no sides no corners", lesson: "A" },
      { note: "cube = solid, 6 flat squares", lesson: "B" },
      { note: "2 equal shares = halves", lesson: "C" },
      { note: "4 equal shares = fourths", lesson: "D" },
    ],
    distractors: ["Jamal's sandwich has cheese", "the shape cards are blue"],
    conclusion: {
      l1_2: "So I can tell the [shapes] apart.",
      l3_4: "So I can tell a [triangle] from a [rectangle] by counting [sides].",
      l5_6: "Because [we can count sides and corners], we can tell [every shape] apart.",
    },
  },
  prompt: {
    l1_2: "Draw a triangle and a rectangle. Write 1-3 sentences. Tell how many sides each one has.",
    l3_4: "Tell what a triangle is and what it is not. Use the words sides and corners.",
    l5_6: "Describe a triangle so a friend can tell it apart from a rectangle and a circle. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "Also,", "But", "For example,", "Next,", "Because", "So", "In the end,"],
  model: {
    l1_2: "A triangle has 3 sides. A rectangle has 4 sides. They are different shapes.",
    l3_4: "A triangle is a flat shape that has 3 sides and 3 corners. A rectangle is a flat shape that has 4 sides and 4 corners. A circle is not a triangle because it has no sides. So we count sides to tell shapes apart.",
    l5_6: "Although a triangle and a rectangle are both flat shapes, they are not the same. A triangle, a shape with 3 sides, has 3 corners. A rectangle has 4 sides and 4 corners, but a circle has no sides at all. Because we can count sides and corners, we can tell every shape apart.",
  },
  revise: [
    "Did I name the shape and count its sides?",
    "Did I tell what the shape is not?",
    "Did I use sides or corners the right way?",
    "Did I use because to tell why I know the shape?",
  ],
};
