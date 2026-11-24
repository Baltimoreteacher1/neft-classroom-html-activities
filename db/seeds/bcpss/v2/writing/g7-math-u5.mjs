// BCPSS Writing Lab (TWR) — g7-math-u5 · Scale Drawings, Circles & 3D Geometry. Contract: ../writing-schema.mjs

export default {
  title: "Same Radius, Different Growth",
  genre: "inform",
  tip: "Have students fill a two-column chart of measurements for both circles before they write a single comparing sentence.",
  lessons: [
    { id: "A", title: "Scale drawings and actual lengths" },
    { id: "B", title: "Circumference and diameter" },
    { id: "C", title: "Area of a circle" },
    { id: "D", title: "Surface area and volume of prisms" },
  ],
  source: {
    title: "Two Round Garden Beds",
    lesson: "B",
    text: "A community garden in Baltimore has two round flower beds. The small bed has a radius of 3 meters, and the large bed has a radius of 6 meters. Both beds are circles, and both use pi, about 3.14. Mia finds the circumference of each bed by multiplying 2 times 3.14 times the radius. The small bed's circumference is 18.84 meters, whereas the large bed's is 37.68 meters. The circumference doubles. In contrast, the area of a circle uses the radius squared. The small bed has an area of 28.26 square meters, but the large bed has an area of 113.04 square meters. The area is four times as large.",
  },
  notes: [
    { sentence: "Mia finds the circumference of each bed by multiplying 2 times 3.14 times the radius.", note: "C = 2 × 3.14 × r" },
    { sentence: "The small bed's circumference is 18.84 meters, whereas the large bed's is 37.68 meters.", note: "C: 18.84 m vs 37.68 m → doubles" },
    { sentence: "In contrast, the area of a circle uses the radius squared.", note: "area uses r squared" },
    { sentence: "The small bed has an area of 28.26 square meters, but the large bed has an area of 113.04 square meters.", note: "A: 28.26 m² vs 113.04 m² → 4 times" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The circumference doubles when the radius doubles",
      because: "circumference is 2 times pi times the radius.",
      but: "the area does not simply double.",
      so: "the large bed's circumference is 37.68 meters.",
    },
    {
      lesson: "C",
      kernel: "The area becomes four times as large",
      because: "the radius is squared in the area formula.",
      but: "the radius itself is only two times as large.",
      so: "the large bed has an area of 113.04 square meters.",
    },
    {
      lesson: "A",
      kernel: "Ana's park plan uses a scale of 1 to 200",
      because: "every length on the drawing follows the same ratio.",
      but: "the drawing is much smaller than the real park.",
      so: "a 4 centimeter wall on the plan is 800 centimeters in real life.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Mia filled the prism.",
      parts: { how: "with water", where: "in the garden shed", why: "to measure its volume" },
      model: "Mia filled the prism with water in the garden shed to measure its volume.",
    },
    {
      lesson: "A",
      kernel: "Ana drew a plan.",
      parts: { when: "before building the garden", how: "with a scale of 1 to 200", why: "so every length on the plan matches the real park" },
      model: "Before building the garden, Ana drew a plan with a scale of 1 to 200 so every length on the plan matches the real park.",
    },
  ],
  fragments: [
    { text: "The radius is the distance from the center of a circle to its edge.", is_sentence: true },
    { text: "Whereas the area uses the radius squared.", is_sentence: false, fix: "The circumference uses the radius, whereas the area uses the radius squared." },
    { text: "Multiplied the diameter by 3.14.", is_sentence: false, fix: "Mia multiplied the diameter by 3.14 to find the circumference." },
    { text: "Volume is the amount of space inside a solid.", is_sentence: true },
    { text: "In contrast to the circumference.", is_sentence: false, fix: "In contrast to the circumference, the area becomes four times as large." },
    { text: "Both beds are circles that use pi.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "The circumference, ___, doubles when the radius doubles.",
      noun: "circumference",
      options: ["the distance around a circle", "the space inside a circle", "the distance across a circle through its center"],
      answer: 0,
      model: "The circumference, the distance around a circle, doubles when the radius doubles.",
    },
    {
      lesson: "C",
      sentence: "Pi, ___, is about 3.14.",
      noun: "Pi",
      options: ["the distance from the center to the edge", "the number you get when you divide circumference by diameter", "the total area of all the faces of a solid"],
      answer: 1,
      model: "Pi, the number you get when you divide circumference by diameter, is about 3.14.",
    },
    {
      lesson: "D",
      sentence: "Surface area, ___, tells how much wrapping paper a box needs.",
      noun: "Surface area",
      options: ["the amount of space inside a solid", "the distance around a circle", "the total area of all the faces of a solid"],
      answer: 2,
      model: "Surface area, the total area of all the faces of a solid, tells how much wrapping paper a box needs.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the circumference also doubles", model: "When the radius doubles, the circumference also doubles." },
    { lesson: "C", conjunction: "although", stem: "the area becomes four times as large", model: "Although the radius only doubles, the area becomes four times as large." },
    { lesson: "A", conjunction: "because", stem: "every real length is 200 times the drawing length", model: "Because the scale is 1 to 200, every real length is 200 times the drawing length." },
  ],
  spo: {
    topic: {
      l1_2: "Both circles have a [radius], but the [area] gets [bigger faster].",
      l3_4: "Both the circumference and the area get larger when the radius doubles, whereas the [circumference doubles] and the [area becomes four times as large].",
      l5_6: "Although [the circumference] and [the area] of a circle both depend on [the radius], [the circumference] grows [two times] as large, whereas [the area] grows [four times] as large when the radius doubles.",
    },
    starters: [
      { type: "question", text: "What happens to a circle's size when its radius doubles?" },
      { type: "statement", text: "Doubling the radius changes the circumference and the area in different ways." },
      { type: "appositive", text: "Mia, a gardener who measures two round beds, compares their circumference and area." },
    ],
    details: [
      { note: "radius 3 m, then radius 6 m", lesson: "B" },
      { note: "C = 2 × 3.14 × r", lesson: "B" },
      { note: "C: 18.84 m, then 37.68 m", lesson: "B" },
      { note: "area uses r squared", lesson: "C" },
      { note: "A: 28.26 m², then 113.04 m²", lesson: "C" },
      { note: "area is 4 times as large", lesson: "C" },
    ],
    distractors: ["flowers need sunlight and water", "the garden has a wooden fence"],
    conclusion: {
      l1_2: "So a bigger [radius] changes [area] a lot.",
      l3_4: "In contrast to the circumference, the area grows [faster] because the radius is [squared].",
      l5_6: "Therefore, doubling a radius does not simply double a circle, because [the area] grows [four times] as large while [the circumference] only doubles.",
    },
  },
  prompt: {
    l1_2: "Draw the two round beds. Write 3 sentences. Tell what is the same and what is different when the radius doubles.",
    l3_4: "Write a paragraph that compares the small bed and the large bed. Tell what happens to the circumference and the area. Use both, whereas, and in contrast.",
    l5_6: "Write a paragraph that compares how the circumference and the area of a circle change when the radius doubles. Use measurements for both beds. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Both", "Similarly,", "Whereas", "In contrast,", "However,", "While", "On the other hand,", "Therefore,"],
  model: {
    l1_2: "Both beds are circles. When the radius doubles, the circumference doubles. In contrast, the area is four times as large.",
    l3_4: "Both the circumference and the area get larger when the radius doubles, whereas the circumference doubles and the area becomes four times as large. The small bed has a radius of 3 meters, and the large bed has a radius of 6 meters. The circumference grows from 18.84 meters to 37.68 meters. In contrast, the area grows from 28.26 square meters to 113.04 square meters. This happens because the area uses the radius squared.",
    l5_6: "Although the circumference and the area of a circle both depend on the radius, they change in different ways when the radius doubles. Mia, a gardener who measures two round beds, uses 3.14 for pi. The small bed has a radius of 3 meters, so its circumference is 18.84 meters. The large bed has a radius of 6 meters, so its circumference is 37.68 meters, which is exactly twice as long. In contrast, the area grows from 28.26 square meters to 113.04 square meters. Because the area formula uses the radius squared, the area is four times as large. Both measurements grow, whereas only the area grows faster than the radius. Therefore, doubling a radius is not the same as doubling a circle's size.",
  },
  mpo: {
    thesis: "When the radius of a circle doubles, the circumference and the area both grow, but they grow by different amounts, and scale drawings and prisms show similar patterns.",
    paragraphs: [
      { topic: "The circumference of a circle doubles when the radius doubles.", notes: ["r = 3 m → C = 18.84 m", "r = 6 m → C = 37.68 m", "C = 2 × 3.14 × r"] },
      { topic: "The area of a circle becomes four times as large because the radius is squared.", notes: ["A = 3.14 × r²", "28.26 m² → 113.04 m²", "4 times as large"] },
      { topic: "Scale drawings and prisms also compare lengths with areas and volumes.", notes: ["scale 1 to 200: 4 cm → 800 cm", "lengths × scale factor", "volume = base area × height"] },
    ],
    conclusion: "Comparing length, area, and volume shows that changing one measurement can change each quantity in a different way.",
  },
  revise: [
    "Did I name at least one thing both circles share and one thing that is different?",
    "Did I use both, whereas, in contrast, or while to make the comparison clear?",
    "Are my measurements correct, such as a circumference of 18.84 meters when the radius is 3 meters?",
    "Did I tell why the area grows faster, using the radius squared?",
  ],
};
