// BCPSS Writing Lab (TWR) — g8-math-u5 · Pythagorean Theorem & 3D Volume. Contract: ../writing-schema.mjs

export default {
  title: "The Right Angle at Lexington Market",
  genre: "explain",
  tip: "Ask students to finish the sentence because the angle is a right angle before they compute, so cause comes before the numbers.",
  lessons: [
    { id: "A", title: "The Pythagorean Theorem in right triangles" },
    { id: "B", title: "The converse and testing for right angles" },
    { id: "C", title: "Distance on the coordinate plane" },
    { id: "D", title: "Volume of cylinders, cones, and spheres" },
  ],
  source: {
    title: "Jamal's Banner Frame",
    lesson: "A",
    text: "Jamal is hanging a banner for a stall at Lexington Market. The frame is a rectangle that is 5 feet tall and 12 feet wide. He wants to know how long the diagonal brace must be. Because the rectangle has a right angle, the Pythagorean Theorem applies. The legs of 5 and 12 lead to 5² + 12² = 25 + 144 = 169. So the brace must be 13 feet, because 13² = 169. Later, Jamal checks a corner with a 9-foot side, a 12-foot side, and a 15-foot diagonal. Since 9² + 12² = 225 and 15² = 225, the corner is a right angle. As a result, the corner is truly square.",
  },
  notes: [
    { sentence: "Because the rectangle has a right angle, the Pythagorean Theorem applies.", note: "right angle → a² + b² = c²" },
    { sentence: "The legs of 5 and 12 lead to 5² + 12² = 25 + 144 = 169.", note: "legs 5, 12 → 25 + 144 = 169" },
    { sentence: "So the brace must be 13 feet, because 13² = 169.", note: "13² = 169 → brace = 13 ft" },
    { sentence: "Since 9² + 12² = 225 and 15² = 225, the corner is a right angle.", note: "9² + 12² = 15² → right angle" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The diagonal brace must be 13 feet long",
      because: "5² + 12² equals 169, and 13² also equals 169.",
      but: "it is shorter than the 17 feet you get by adding the two sides.",
      so: "the builder cuts the board exactly 13 feet long.",
    },
    {
      lesson: "B",
      kernel: "A triangle with sides 9, 12, and 15 is a right triangle",
      because: "9² + 12² equals 15².",
      but: "a triangle with sides 9, 12, and 16 is not.",
      so: "builders can use the test to check corners.",
    },
    {
      lesson: "D",
      kernel: "A can with radius 3 inches and height 4 inches holds 36π cubic inches",
      because: "the formula V = πr²h gives π × 9 × 4.",
      but: "a cone with the same base and height holds only 12π.",
      so: "the cone holds one third as much.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Jamal measured the diagonal.",
      parts: { when: "after hanging the frame", where: "across the rectangle", how: "with a tape measure", why: "to check the corner" },
      model: "After hanging the frame, Jamal measured the diagonal across the rectangle with a tape measure to check the corner.",
    },
    {
      lesson: "C",
      kernel: "Mia found the distance.",
      parts: { where: "between two points on the grid", how: "by drawing a right triangle", why: "so she could use the Pythagorean Theorem" },
      model: "Mia found the distance between two points on the grid by drawing a right triangle so she could use the Pythagorean Theorem.",
    },
  ],
  fragments: [
    { text: "The hypotenuse is the longest side of a right triangle.", is_sentence: true },
    { text: "Because the legs are 5 and 12.", is_sentence: false, fix: "The hypotenuse is 13 because the legs are 5 and 12." },
    { text: "The volume of a cone is one third of a cylinder with the same base and height.", is_sentence: true },
    { text: "Leads to a hypotenuse of 13 feet.", is_sentence: false, fix: "The legs of 5 and 12 feet lead to a hypotenuse of 13 feet." },
    { text: "When the squares of the two legs equal the square of the longest side.", is_sentence: false, fix: "A triangle is a right triangle when the squares of the two legs equal the square of the longest side." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The hypotenuse, ___, is across from the right angle.",
      noun: "hypotenuse",
      options: ["the longest side of a right triangle", "one of the two shorter sides that meet at the right angle", "the space inside a solid"],
      answer: 0,
      model: "The hypotenuse, the longest side of a right triangle, is across from the right angle.",
    },
    {
      lesson: "D",
      sentence: "A cylinder, ___, has the volume V = πr²h.",
      noun: "cylinder",
      options: ["a solid with one circular base and a point at the top", "a solid with two flat circles for bases and one curved side", "a perfectly round solid"],
      answer: 1,
      model: "A cylinder, a solid with two flat circles for bases and one curved side, has the volume V = πr²h.",
    },
    {
      lesson: "B",
      sentence: "The converse, ___, helps Jamal test whether a corner is square.",
      noun: "converse",
      options: ["the longest side of a right triangle", "the amount of space inside a solid", "a statement made by swapping the if part and the then part of another statement"],
      answer: 2,
      model: "The converse, a statement made by swapping the if part and the then part of another statement, helps Jamal test whether a corner is square.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the Pythagorean Theorem works", model: "Because the corner is a right angle, the Pythagorean Theorem works." },
    { lesson: "B", conjunction: "since", stem: "the corner must be a right angle", model: "Since 9² + 12² = 15², the corner must be a right angle." },
    { lesson: "D", conjunction: "if", stem: "the volume of the cylinder becomes four times as large", model: "If the height stays the same and the radius doubles, the volume of the cylinder becomes four times as large." },
  ],
  spo: {
    topic: {
      l1_2: "A [right angle] leads to a [missing length].",
      l3_4: "Because the rectangle has a right angle, its legs of [5] and [12] lead to a hypotenuse of [13].",
      l5_6: "As a result of [the right angle], [the squares of the legs] add up to [the square of the hypotenuse], which lets builders [find missing lengths and test corners].",
    },
    starters: [
      { type: "question", text: "How can a right angle tell you the length of a brace you cannot measure?" },
      { type: "appositive", text: "The Pythagorean Theorem, a rule for right triangles, connects the three sides." },
      { type: "subordinate", text: "Because a corner is square, its sides follow a special pattern." },
    ],
    details: [
      { note: "right angle → a² + b² = c²", lesson: "A" },
      { note: "legs 5, 12 → 25 + 144 = 169", lesson: "A" },
      { note: "√169 = 13 → brace 13 ft", lesson: "A" },
      { note: "9² + 12² = 15² → right angle", lesson: "B" },
      { note: "distance on grid = hypotenuse", lesson: "C" },
      { note: "cylinder V = πr²h; cone = 1/3", lesson: "D" },
    ],
    distractors: ["Lexington Market opened in 1782", "banners can be printed on vinyl"],
    conclusion: {
      l1_2: "So the brace is [13] feet.",
      l3_4: "As a result, Jamal cuts the brace [13] feet long because [169 is 13 squared].",
      l5_6: "That match causes [the frame to sit square and strong], so [the right angle] explains every length.",
    },
  },
  prompt: {
    l1_2: "Look at the frame: 5 feet by 12 feet. Write 3 sentences. Tell how long the brace is and why.",
    l3_4: "Explain how the right angle leads to the length of the brace, and tell how Jamal can check a corner. Use because and as a result.",
    l5_6: "Write a paragraph that explains how a right angle causes the Pythagorean pattern, finds the brace length, and tests a 9-12-15 corner. Include an appositive and a sentence that starts with because or since.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "Since", "As a result,", "This leads to", "Therefore,"],
  model: {
    l1_2: "The frame has a right angle. The sides are 5 feet and 12 feet. So the brace is 13 feet.",
    l3_4: "Because the rectangle has a right angle, the legs of 5 and 12 feet lead to a hypotenuse of 13 feet. First, I square the legs to get 25 and 144. Next, I add them to get 169. Since the square root of 169 is 13, the brace must be 13 feet long. As a result, Jamal cuts the board to 13 feet. He can also test a corner because the same rule works in reverse.",
    l5_6: "Because a rectangle has a right angle, the squares of its sides follow a special pattern. The Pythagorean Theorem, the rule a² + b² = c², connects the legs and the hypotenuse. For Jamal's frame, the legs of 5 and 12 feet give 25 + 144 = 169, so the hypotenuse is 13 feet. As a result, he cuts the diagonal brace exactly 13 feet long. Later, he tests a corner with sides of 9 and 12 feet and a diagonal of 15 feet. Since 9² + 12² = 225 and 15² = 225, the converse of the theorem proves that the corner is a right angle. That match causes the frame to sit square and strong.",
  },
  mpo: {
    thesis: "A right angle causes a fixed pattern among the sides of a triangle, and volume formulas for round solids give predictable results too.",
    paragraphs: [
      { topic: "Because a triangle has a right angle, its legs and hypotenuse follow a² + b² = c².", notes: ["legs 5, 12 → c² = 169", "c = 13 ft", "hypotenuse = longest side"] },
      { topic: "The converse and the distance rule use the same pattern in new ways.", notes: ["9² + 12² = 15² → square corner", "grid distance = hypotenuse", "8-15-17 also works"] },
      { topic: "Volume formulas explain how much a can, cone, or ball holds.", notes: ["cylinder V = πr²h", "cone = 1/3 of cylinder", "sphere V = 4/3 πr³"] },
    ],
    conclusion: "The right angle explains why the numbers match, and it lets builders find lengths, check corners, and reason about space with confidence.",
  },
  revise: [
    "Did I name the cause, the right angle, before I gave the effect?",
    "Did I use because, leads to, or as a result with real numbers?",
    "Did I show the squares and the sum, such as 25 + 144 = 169?",
    "Did I use hypotenuse, leg, and converse correctly?",
  ],
};
