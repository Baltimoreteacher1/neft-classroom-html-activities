// BCPSS Writing Lab (TWR) — g3-math-u6 · Measurement, Scaled Graphs & Quadrilaterals. Contract: ../writing-schema.mjs

export default {
  title: "The Quadrilateral Family",
  genre: "inform",
  tip: "Ask students to sketch the shape and label its sides and corners first, then describe only what the sketch shows.",
  lessons: [
    { id: "A", title: "Elapsed time on a clock" },
    { id: "B", title: "Mass and liquid volume" },
    { id: "C", title: "Scaled bar graphs" },
    { id: "D", title: "Quadrilaterals and their attributes" },
  ],
  source: {
    title: "A Shape with Four Sides",
    lesson: "D",
    text: "A quadrilateral is a flat shape with four straight sides. A rowhouse door in Baltimore is often a rectangle. A rectangle is a quadrilateral that has four right angles. Its opposite sides are parallel. A rhombus is a quadrilateral that has four equal sides. A square has four equal sides and four right angles. So a square is also a rectangle and a rhombus. A triangle is not a quadrilateral, because it has only three sides.",
  },
  notes: [
    { sentence: "A rectangle is a quadrilateral that has four right angles.", note: "rectangle = quad. w/ 4 right angles" },
    { sentence: "Its opposite sides are parallel.", note: "opposite sides parallel" },
    { sentence: "A rhombus is a quadrilateral that has four equal sides.", note: "rhombus = quad. w/ 4 equal sides" },
    { sentence: "So a square is also a rectangle and a rhombus.", note: "square = rectangle + rhombus" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "A square is also a rectangle",
      because: "it has four right angles and opposite sides that are parallel.",
      but: "not every rectangle is a square.",
      so: "a square can be called a rectangle and a rhombus.",
    },
    {
      lesson: "A",
      kernel: "The elapsed time is 45 minutes",
      because: "the bus left at 9:00 and arrived at 9:45.",
      but: "the time 9:45 alone does not tell how long the trip took.",
      so: "we count the minutes from the start to the end.",
    },
    {
      lesson: "C",
      kernel: "A bar graph needs a scale",
      because: "each mark stands for a number.",
      but: "the bars can look the same on two different graphs.",
      so: "we read the scale before we read the bars.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Ana poured cider.",
      parts: { when: "before lunch", where: "at the market stand", how: "into a one-liter jug", why: "to measure the liquid volume" },
      model: "Before lunch, Ana poured cider into a one-liter jug at the market stand to measure the liquid volume.",
    },
    {
      lesson: "D",
      kernel: "Kenji sorted shapes.",
      parts: { when: "during math class", where: "at the shape table", how: "by their attributes", why: "to find the rhombus" },
      model: "During math class, Kenji sorted shapes by their attributes at the shape table to find the rhombus.",
    },
  ],
  fragments: [
    { text: "A rhombus has four equal sides.", is_sentence: true },
    { text: "Four straight sides and four right angles.", is_sentence: false, fix: "A rectangle has four straight sides and four right angles." },
    { text: "The scale counts by 2s.", is_sentence: true },
    { text: "Because the bus left at 9:00.", is_sentence: false, fix: "The elapsed time is 45 minutes because the bus left at 9:00 and arrived at 9:45." },
    { text: "Going in the same direction and never touching.", is_sentence: false, fix: "Parallel sides go in the same direction and never touch." },
    { text: "Mass is measured in kilograms.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Elapsed time, ___, can be found by counting on from the start.",
      noun: "Elapsed time",
      options: ["how much matter is in an object", "the amount of time that passes from a start to an end", "the number each mark stands for"],
      answer: 1,
      model: "Elapsed time, the amount of time that passes from a start to an end, can be found by counting on from the start.",
    },
    {
      lesson: "B",
      sentence: "Mass, ___, is measured in grams and kilograms.",
      noun: "Mass",
      options: ["how much matter is in an object", "how much space a liquid takes up", "a graph that uses bars"],
      answer: 0,
      model: "Mass, how much matter is in an object, is measured in grams and kilograms.",
    },
    {
      lesson: "C",
      sentence: "The scale, ___, tells us how to read the bars.",
      noun: "scale",
      options: ["a square corner like a sheet of paper", "the time that passes from start to end", "the number each mark or picture stands for"],
      answer: 2,
      model: "The scale, the number each mark or picture stands for, tells us how to read the bars.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the elapsed time is 45 minutes", model: "When the bus leaves at 9:00 and arrives at 9:45, the elapsed time is 45 minutes." },
    { lesson: "C", conjunction: "since", stem: "the bar for apples shows 8", model: "Since the scale counts by 2s and the bar reaches the fourth line, the bar for apples shows 8." },
    { lesson: "D", conjunction: "although", stem: "a square is also a rhombus", model: "Although a rhombus does not need square corners, a square is also a rhombus." },
  ],
  spo: {
    topic: {
      l1_2: "A [square] is a [quadrilateral] with [four equal sides].",
      l3_4: "A [square] is a type of quadrilateral that has [four equal sides and four right angles].",
      l5_6: "A square, [a quadrilateral with four equal sides and four right angles,] belongs to two shape families because [it is both a rectangle and a rhombus].",
    },
    starters: [
      { type: "question", text: "What makes a shape a square?" },
      { type: "appositive", text: "A square, a quadrilateral with four equal sides, belongs to two families." },
      { type: "subordinate", text: "Although a rectangle has four right angles, it does not need four equal sides." },
    ],
    details: [
      { note: "square = quadrilateral", lesson: "D" },
      { note: "4 equal sides", lesson: "D" },
      { note: "4 right angles", lesson: "D" },
      { note: "opposite sides parallel", lesson: "D" },
      { note: "square = rectangle + rhombus", lesson: "D" },
      { note: "triangle: 3 sides → not quadrilateral", lesson: "D" },
    ],
    distractors: ["elapsed time is counted in minutes", "bar graphs show how many in each group"],
    conclusion: {
      l1_2: "A square is a [rectangle] and a [rhombus].",
      l3_4: "So a square is a [rectangle] and a [rhombus] because [it has all of their attributes].",
      l5_6: "In short, a square is [the shape that is both a rectangle and a rhombus], so it belongs to [more than one family].",
    },
  },
  prompt: {
    l1_2: "Draw a square. Write 2-3 sentences. Tell about its sides and its corners.",
    l3_4: "Describe a square so well that someone could picture it. Tell what family it belongs to, what attributes it has, and one shape that is not a quadrilateral.",
    l5_6: "Write a paragraph that defines a square, names every shape family it belongs to, and tells what it is not. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["First,", "Also,", "Because", "Since", "Although", "For example,", "However,", "In short,"],
  model: {
    l1_2: "A square is a quadrilateral. It has four equal sides and four right angles. It is also a rhombus.",
    l3_4: "A square is a type of quadrilateral that has four equal sides and four right angles. Its opposite sides are parallel. Because a square has four right angles, it is also a rectangle. Because it has four equal sides, it is also a rhombus. A triangle is not a quadrilateral, because it has only three sides.",
    l5_6: "A square, a quadrilateral with four equal sides and four right angles, belongs to more than one shape family. Its opposite sides are parallel and all four angles are right angles, so it matches every rule for a rectangle. Since all four sides are equal, it also matches every rule for a rhombus. A rectangle is not always a square, because its sides do not have to be equal. Although a triangle has straight sides, it is not a quadrilateral because it has only three. In short, a square is both a rectangle and a rhombus.",
  },
  revise: [
    "Did I name the big family, quadrilateral, first?",
    "Did I list exact attributes, like equal sides and right angles?",
    "Did I tell what the shape is also, or what it is NOT?",
    "Did I use my measurement and shape words exactly right?",
  ],
};
