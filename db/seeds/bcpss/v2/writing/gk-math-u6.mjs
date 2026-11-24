// BCPSS Writing Lab (TWR) — gk-math-u6 · 2D/3D Shapes & Measurable Attributes. Contract: ../writing-schema.mjs

export default {
  title: "Zoe's Shape Hunt",
  genre: "inform",
  tip: "Bring real flat and solid objects so children can hold each shape and name what it has before writing.",
  lessons: [
    { id: "A", title: "Flat shapes: circle, square, triangle, rectangle" },
    { id: "B", title: "Solid shapes: cube, sphere, cone, cylinder" },
    { id: "C", title: "Flat or solid? Sorting shapes" },
    { id: "D", title: "Comparing length and weight" },
  ],
  source: {
    title: "Shapes at the Park",
    lesson: "C",
    text: "Zoe finds shapes at the park. A sign is a flat triangle. It has 3 sides. It has 3 corners. A ball is a solid shape. It can roll. A log is longer than a stick.",
  },
  notes: [
    { sentence: "A sign is a flat triangle.", note: "sign = flat triangle" },
    { sentence: "It has 3 sides.", note: "3 sides" },
    { sentence: "A ball is a solid shape.", note: "ball = solid, rolls" },
    { sentence: "A log is longer than a stick.", note: "log longer" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A square is a flat shape",
      because: "it lies on paper.",
      but: "a cube is a solid shape.",
      so: "we can trace it on paper.",
    },
    {
      lesson: "B",
      kernel: "A ball can roll",
      because: "it is round all over.",
      but: "a box cannot roll.",
      so: "it rolls down the hill.",
    },
    {
      lesson: "D",
      kernel: "The log is longer than the stick",
      because: "it has more length from end to end.",
      but: "the stick is easier to hold.",
      so: "we line up the ends to compare.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Zoe finds shapes.",
      parts: { when: "on Saturday", where: "at the park", how: "with her eyes" },
      model: "On Saturday, Zoe finds shapes at the park with her eyes.",
    },
    {
      lesson: "B",
      kernel: "A ball rolls.",
      parts: { where: "down the hill", how: "fast", why: "because it is round" },
      model: "A ball rolls down the hill fast because it is round.",
    },
  ],
  fragments: [
    { text: "A square has 4 sides.", is_sentence: true },
    { text: "A flat shape with 3 corners.", is_sentence: false, fix: "A triangle is a flat shape with 3 corners." },
    { text: "The cube is solid.", is_sentence: true },
    { text: "Rolls down the hill.", is_sentence: false, fix: "The ball rolls down the hill." },
    { text: "Because it is heavier.", is_sentence: false, fix: "The box is hard to lift because it is heavier." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A circle, ___, is a flat shape.",
      noun: "circle",
      options: ["a round shape with no corners", "a solid shape with 6 flat sides", "a shape with 4 corners"],
      answer: 0,
      model: "A circle, a round shape with no corners, is a flat shape.",
    },
    {
      lesson: "B",
      sentence: "A cube, ___, has 6 flat sides.",
      noun: "cube",
      options: ["a flat shape that lies on paper", "a solid shape like a box", "a round shape that rolls"],
      answer: 1,
      model: "A cube, a solid shape like a box, has 6 flat sides.",
    },
    {
      lesson: "C",
      sentence: "A triangle, ___, has 3 sides and 3 corners.",
      noun: "triangle",
      options: ["a solid shape that can roll", "a thing that is heavy", "a flat shape with straight sides"],
      answer: 2,
      model: "A triangle, a flat shape with straight sides, has 3 sides and 3 corners.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "it is flat", model: "When a shape lies on paper, it is flat." },
    { lesson: "B", conjunction: "because", stem: "a ball can roll", model: "Because a ball is round, a ball can roll." },
    { lesson: "D", conjunction: "if", stem: "I can see which is longer", model: "If I line up the ends, I can see which is longer." },
  ],
  spo: {
    topic: {
      l1_2: "Zoe finds [flat] and [solid] shapes.",
      l3_4: "Zoe finds [flat shapes] and [solid shapes] at the park and tells what each one has.",
      l5_6: "Although [flat shapes] and [solid shapes] look different, Zoe can tell what each one [has].",
    },
    starters: [
      { type: "question", text: "What shapes can you find at the park?" },
      { type: "appositive", text: "Zoe, a girl at the park, hunts for shapes." },
      { type: "subordinate", text: "When Zoe sees a ball, she knows it is solid." },
    ],
    details: [
      { note: "sign = flat triangle", lesson: "A" },
      { note: "3 sides, 3 corners", lesson: "A" },
      { note: "ball = solid, rolls", lesson: "B" },
      { note: "box = solid, flat sides", lesson: "B" },
      { note: "flat = lies on paper", lesson: "C" },
      { note: "solid = can hold, thick", lesson: "C" },
    ],
    distractors: ["shapes are fun", "the park has swings"],
    conclusion: {
      l1_2: "Flat shapes and [solid] shapes are [different].",
      l3_4: "Flat shapes lie on paper, but [solid] shapes can be [held].",
      l5_6: "Although the shapes look different, Zoe can [name each one] and tell what it [has].",
    },
  },
  prompt: {
    l1_2: "Draw a shape. Write 1-3 sentences. Tell its name and what it has.",
    l3_4: "Write about a flat shape and a solid shape. Tell what each one has. Use your outline.",
    l5_6: "Describe flat and solid shapes you found. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Next,", "Also,", "But", "and", "because", "has", "not"],
  model: {
    l1_2: "Zoe finds a triangle. It is a flat shape.",
    l3_4: "Zoe finds shapes at the park. A sign is a flat triangle with 3 sides and 3 corners. A ball is a solid shape because it can roll.",
    l5_6: "Zoe, a girl at the park, finds flat and solid shapes. A triangle, a flat shape, has 3 sides and 3 corners. Because a ball is round, it can roll. A box is solid, but a sign is flat.",
  },
  revise: [
    "Did I name the shape?",
    "Did I say if it is flat or solid?",
    "Did I tell how many sides or corners it has?",
    "Did I use but to tell how two shapes are different?",
  ],
};
