// BCPSS Writing Lab (TWR) — g3-math-u3 · Area & Perimeter of Rectangles. Contract: ../writing-schema.mjs

export default {
  title: "Two Rugs, Same Space",
  genre: "inform",
  tip: "Have students sketch both rugs and label each side before writing, so area and perimeter never get mixed up.",
  lessons: [
    { id: "A", title: "Tiling a rectangle with square units" },
    { id: "B", title: "Area is length times width" },
    { id: "C", title: "Perimeter is the distance around" },
    { id: "D", title: "Comparing area and perimeter" },
  ],
  source: {
    title: "Rugs for the Reading Corner",
    lesson: "D",
    text: "Ms. Alvarez's class picks a rug for the reading corner. Rug A is 6 feet long and 3 feet wide. Rug B is 9 feet long and 2 feet wide. Both rugs cover 18 square feet. That is because 6 × 3 = 18 and 9 × 2 = 18. The perimeters are different, though. Rug A has a perimeter of 18 feet, since 6 + 3 + 6 + 3 = 18. Rug B has a perimeter of 22 feet, since 9 + 2 + 9 + 2 = 22. Rug A is closer to a square, whereas Rug B is long and thin.",
  },
  notes: [
    { sentence: "Both rugs cover 18 square feet.", note: "both: 18 sq ft" },
    { sentence: "That is because 6 × 3 = 18 and 9 × 2 = 18.", note: "6×3=18, 9×2=18" },
    { sentence: "Rug A has a perimeter of 18 feet, since 6 + 3 + 6 + 3 = 18.", note: "A perimeter = 18 ft" },
    { sentence: "Rug B has a perimeter of 22 feet, since 9 + 2 + 9 + 2 = 22.", note: "B perimeter = 22 ft" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Rug A and Rug B have the same area",
      because: "both rugs cover 18 square feet.",
      but: "their perimeters are not the same.",
      so: "the class needs different lengths of tape for the edges.",
    },
    {
      lesson: "A",
      kernel: "Area measures the space inside a rectangle",
      because: "it counts the square units that cover the shape.",
      but: "perimeter measures the distance around the outside.",
      so: "we write area in square units.",
    },
    {
      lesson: "C",
      kernel: "Rug B has a longer perimeter than Rug A",
      because: "it is longer and thinner.",
      but: "it covers the same amount of space.",
      so: "it needs 22 feet of tape for its edge.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The students measured.",
      parts: { when: "on Monday morning", where: "in the reading corner", how: "with a long tape measure", why: "to choose the best rug" },
      model: "On Monday morning, the students measured in the reading corner with a long tape measure to choose the best rug.",
    },
    {
      lesson: "C",
      kernel: "Kai added the sides.",
      parts: { when: "after he measured", where: "around the poster", how: "one side at a time", why: "to find the perimeter" },
      model: "After he measured, Kai added the sides around the poster one side at a time to find the perimeter.",
    },
  ],
  fragments: [
    { text: "Area counts the square units inside.", is_sentence: true },
    { text: "The distance around the outside.", is_sentence: false, fix: "Perimeter is the distance around the outside." },
    { text: "Both rugs are rectangles.", is_sentence: true },
    { text: "Because 9 + 2 + 9 + 2 = 22.", is_sentence: false, fix: "Rug B has a perimeter of 22 feet because 9 + 2 + 9 + 2 = 22." },
    { text: "Covers 18 square feet.", is_sentence: false, fix: "Each rug covers 18 square feet." },
    { text: "Whereas Rug B is long and thin.", is_sentence: false, fix: "Rug A is closer to a square, whereas Rug B is long and thin." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Area, ___, is measured in square units.",
      noun: "Area",
      options: ["the distance around the outside of a shape", "the number of square units that cover the inside of a shape", "a shape with four square corners"],
      answer: 1,
      model: "Area, the number of square units that cover the inside of a shape, is measured in square units.",
    },
    {
      lesson: "D",
      sentence: "Rug A, ___, is closer to a square than Rug B.",
      noun: "Rug A",
      options: ["a rectangle 6 feet long and 3 feet wide", "a rectangle 9 feet long and 2 feet wide", "the distance around a rectangle"],
      answer: 0,
      model: "Rug A, a rectangle 6 feet long and 3 feet wide, is closer to a square than Rug B.",
    },
    {
      lesson: "B",
      sentence: "A rectangle, ___, can be tiled with square units.",
      noun: "rectangle",
      options: ["the space inside a shape in square feet", "one straight edge of a shape", "a shape with four straight sides and four square corners"],
      answer: 2,
      model: "A rectangle, a shape with four straight sides and four square corners, can be tiled with square units.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "although", stem: "the two rugs have different perimeters", model: "Although both rugs cover 18 square feet, the two rugs have different perimeters." },
    { lesson: "C", conjunction: "while", stem: "perimeter measures the distance around", model: "While area measures the space inside, perimeter measures the distance around." },
    { lesson: "C", conjunction: "because", stem: "Rug A has a perimeter of 18 feet", model: "Because 6 + 3 + 6 + 3 = 18, Rug A has a perimeter of 18 feet." },
  ],
  spo: {
    topic: {
      l1_2: "Rug A and Rug B are [alike] and [different].",
      l3_4: "Both [Rug A] and [Rug B] cover [18 square feet], but their [perimeters] are different.",
      l5_6: "Although [Rug A, a 6 by 3 rectangle,] and Rug B have the same [area], their [perimeters] are different because [the shapes are not the same].",
    },
    starters: [
      { type: "question", text: "Can two rectangles have the same area but different perimeters?" },
      { type: "appositive", text: "Rug A, a rectangle 6 feet long and 3 feet wide, covers 18 square feet." },
      { type: "subordinate", text: "Although both rugs cover the same space, they need different amounts of edge tape." },
    ],
    details: [
      { note: "Rug A: 6 ft × 3 ft", lesson: "B" },
      { note: "Rug B: 9 ft × 2 ft", lesson: "B" },
      { note: "both area = 18 sq ft", lesson: "A" },
      { note: "A perimeter = 18 ft", lesson: "C" },
      { note: "B perimeter = 22 ft", lesson: "C" },
      { note: "B longer + thinner → more edge", lesson: "D" },
    ],
    distractors: ["the reading corner has a window", "rugs can be red or blue"],
    conclusion: {
      l1_2: "The area is the same, but the [perimeter] is [different].",
      l3_4: "In contrast, Rug B has a [longer] perimeter because [it is long and thin].",
      l5_6: "In contrast, [the long, thin Rug B] has a longer perimeter, which means [the same space can have different distances around].",
    },
  },
  prompt: {
    l1_2: "Draw Rug A and Rug B. Write 2-3 sentences. Tell what is the same and what is different.",
    l3_4: "Compare Rug A and Rug B. Write a paragraph that tells how their areas and their perimeters are alike and different. Use both, whereas, and but.",
    l5_6: "Write a paragraph that compares the area and the perimeter of Rug A and Rug B with the numbers to prove it. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Also,", "Whereas", "While", "However,", "In contrast,", "For example,", "In summary,"],
  model: {
    l1_2: "Both rugs cover 18 square feet. Rug A has a perimeter of 18 feet. Rug B has a perimeter of 22 feet.",
    l3_4: "Both Rug A and Rug B cover 18 square feet. Rug A is 6 feet by 3 feet, whereas Rug B is 9 feet by 2 feet. The area is the same because 6 × 3 = 18 and 9 × 2 = 18. The perimeters are different, though. Rug A has a perimeter of 18 feet, but Rug B has a perimeter of 22 feet. In contrast, Rug B is long and thin, so it needs more tape for its edge.",
    l5_6: "Although Rug A and Rug B look different, both rectangles cover 18 square feet. Area, the number of square units inside a shape, is the same for both. That is because 6 × 3 = 18 and 9 × 2 = 18. However, the perimeters are not the same. Rug A has a perimeter of 18 feet, while Rug B has a perimeter of 22 feet. Rug B is long and thin, so its edge is longer. In summary, two rectangles can cover the same space but need different amounts of edge tape.",
  },
  revise: [
    "Did I say what is the same AND what is different?",
    "Did I use both, whereas, or in contrast correctly?",
    "Did I use square feet for area and feet for perimeter?",
    "Did I show the math for each number I used?",
  ],
};
