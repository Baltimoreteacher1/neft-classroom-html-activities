// BCPSS Writing Lab (TWR) — g6-math-u1 · Area, Surface Area & Volume. Contract: ../writing-schema.mjs

export default {
  title: "Prove the Toy Box Strategy",
  genre: "argue",
  tip: "Have students say the because-reason aloud for each face of the net before they write a single number.",
  lessons: [
    { id: "A", title: "Area of parallelograms and triangles" },
    { id: "B", title: "Decomposing polygons into rectangles and triangles" },
    { id: "C", title: "Nets and the surface area of prisms" },
    { id: "D", title: "Volume of prisms with fractional edge lengths" },
  ],
  source: {
    title: "Paint for the Toy Box",
    lesson: "C",
    text: "Jaylen wants to paint a toy box for a craft sale at Patterson Park. The box is a rectangular prism that is 6 cm long, 4 cm wide, and 3 cm tall. First, he draws a net, which is a flat pattern that folds into the box. Next, he decomposes the net into six rectangles. The top and bottom are each 6 cm by 4 cm, so each has an area of 24 square centimeters. The front and back are each 6 cm by 3 cm, so each has an area of 18 square centimeters. The two sides are each 4 cm by 3 cm, which gives 12 square centimeters each. Jaylen adds all six areas and gets a surface area of 108 square centimeters. That number tells him how much paint he needs.",
  },
  notes: [
    { sentence: "Next, he decomposes the net into six rectangles.", note: "net → 6 rectangles" },
    { sentence: "The top and bottom are each 6 cm by 4 cm, so each has an area of 24 square centimeters.", note: "top + bottom: 6 × 4 = 24 sq cm" },
    { sentence: "The front and back are each 6 cm by 3 cm, so each has an area of 18 square centimeters.", note: "front + back: 6 × 3 = 18 sq cm" },
    { sentence: "Jaylen adds all six areas and gets a surface area of 108 square centimeters.", note: "add all 6 areas = SA 108 sq cm" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Jaylen finds the surface area of the toy box",
      because: "he needs to know how much paint covers the outside.",
      but: "the surface area does not tell him how much the box can hold.",
      so: "he buys enough paint to cover every face.",
    },
    {
      lesson: "A",
      kernel: "A triangle has half the area of a rectangle with the same base and height",
      because: "two copies of the triangle fit together to make that rectangle.",
      but: "the formula needs the height, not the slanted side.",
      so: "a triangle with a base of 8 cm and a height of 5 cm has an area of 20 square centimeters.",
    },
    {
      lesson: "D",
      kernel: "A prism that is 2 cm long, 3 cm wide, and 1/2 cm tall is thin",
      because: "its height is only half of one centimeter.",
      but: "its volume is still 3 cubic centimeters.",
      so: "we multiply 2 × 3 × 1/2 to find how much space it fills.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Mia decomposed the polygon.",
      parts: { when: "Before finding the area", how: "into a rectangle and two triangles", why: "because every piece has an easy area formula" },
      model: "Before finding the area, Mia decomposed the polygon into a rectangle and two triangles because every piece has an easy area formula.",
    },
    {
      lesson: "D",
      kernel: "Sofia filled the box.",
      parts: { when: "During math class", how: "with small cubes that are 1/2 inch on each side", why: "to find its volume" },
      model: "During math class, Sofia filled the box with small cubes that are 1/2 inch on each side to find its volume.",
    },
  ],
  fragments: [
    { text: "The net folds into a rectangular prism.", is_sentence: true },
    { text: "Because every face is a rectangle.", is_sentence: false, fix: "The surface area is easy to find because every face is a rectangle." },
    { text: "Volume tells how much space is inside a prism.", is_sentence: true },
    { text: "Added the areas of all six faces.", is_sentence: false, fix: "Jaylen added the areas of all six faces." },
    { text: "The area of a triangle with a base of 8 cm and a height of 5 cm.", is_sentence: false, fix: "The area of a triangle with a base of 8 cm and a height of 5 cm is 20 square centimeters." },
    { text: "When Mia decomposed the polygon.", is_sentence: false, fix: "When Mia decomposed the polygon, she found the area of each piece." },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "A net, ___, folds up into a rectangular prism.",
      noun: "net",
      options: ["a flat pattern of connected faces", "the space inside a box", "a number that counts cubes"],
      answer: 0,
      model: "A net, a flat pattern of connected faces, folds up into a rectangular prism.",
    },
    {
      lesson: "D",
      sentence: "Volume, ___, is measured in cubic units.",
      noun: "Volume",
      options: ["the total length around a flat shape", "the amount of space inside a 3D shape", "the area of the largest face"],
      answer: 1,
      model: "Volume, the amount of space inside a 3D shape, is measured in cubic units.",
    },
    {
      lesson: "A",
      sentence: "The height, ___, makes a right angle with the base.",
      noun: "height",
      options: ["the slanted side of a triangle", "the distance straight up from the base to the top", "the sum of all the sides"],
      answer: 1,
      model: "The height, the distance straight up from the base to the top, makes a right angle with the base.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "Mia splits the polygon into rectangles and triangles", model: "When a shape has an odd outline, Mia splits the polygon into rectangles and triangles." },
    { lesson: "C", conjunction: "since", stem: "Jaylen adds the areas of all six faces", model: "Since the box is a rectangular prism, Jaylen adds the areas of all six faces." },
    { lesson: "D", conjunction: "although", stem: "the prism has a volume of 3 cubic centimeters", model: "Although its height is only 1/2 cm, the prism has a volume of 3 cubic centimeters." },
  ],
  spo: {
    topic: {
      l1_2: "Surface area tells how much [paint] covers a box.",
      l3_4: "To find the surface area of the toy box, I [decomposed the net] into [rectangles] and [added their areas].",
      l5_6: "Although a rectangular prism looks like one solid object, [its net] can be [decomposed into six rectangles] to prove [the surface area].",
    },
    starters: [
      { type: "question", text: "How much paint does it take to cover every face of a toy box?" },
      { type: "appositive", text: "Jaylen, a sixth grader from Baltimore, uses a net to find the surface area of his toy box." },
      { type: "subordinate", text: "Before he buys any paint, Jaylen finds the surface area of the box." },
    ],
    details: [
      { note: "box 6 cm × 4 cm × 3 cm", lesson: "C" },
      { note: "net = flat pattern → 6 rectangles", lesson: "C" },
      { note: "top + bottom 24 sq cm each", lesson: "B" },
      { note: "front + back 18 sq cm each", lesson: "B" },
      { note: "two sides 12 sq cm each", lesson: "B" },
      { note: "add all areas = 108 sq cm", lesson: "C" },
    ],
    distractors: ["the box holds 72 cubic cm of blocks", "Patterson Park has a big pavilion"],
    conclusion: {
      l1_2: "The surface area is [108] square [centimeters].",
      l3_4: "Because the six areas add up to [108], the surface area is [108 square centimeters] and Jaylen knows how much [paint] to buy.",
      l5_6: "This strategy works because [every face of a rectangular prism is a rectangle], so [adding all six areas] proves the surface area.",
    },
  },
  prompt: {
    l1_2: "Draw the net of Jaylen's toy box. Write 3-4 sentences about how to find its surface area. Use the words net, rectangle, and add.",
    l3_4: "Write a paragraph that explains how to find the surface area of the toy box and why your strategy works. Use your outline, because, and so.",
    l5_6: "Write a paragraph that argues why decomposing a net is a correct strategy for finding surface area, and why surface area, not volume, answers the paint question. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "Since", "So", "For example,", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "Jaylen draws a net of the toy box. The net has six rectangles. He adds the areas of all six rectangles. The surface area is 108 square centimeters.",
    l3_4: "To find the surface area of the toy box, Jaylen decomposed the net into six rectangles and added their areas. The top and bottom are each 6 cm by 4 cm, so each has an area of 24 square centimeters. The front and back are each 6 cm by 3 cm, so each has 18 square centimeters. The two sides are each 4 cm by 3 cm, so each has 12 square centimeters. Because 24 + 24 + 18 + 18 + 12 + 12 = 108, the surface area is 108 square centimeters. That number tells Jaylen how much paint to buy.",
    l5_6: "Although the toy box looks like one solid object, Jaylen can prove its surface area by decomposing the net into six rectangles. The net, a flat pattern that folds into the box, shows every face at once. The top and bottom are each 6 cm by 4 cm, so each has an area of 24 square centimeters. The front and back are each 6 cm by 3 cm, so each has 18 square centimeters. The sides are each 4 cm by 3 cm, which gives 12 square centimeters apiece. When Jaylen adds all six areas, he gets 108 square centimeters. This strategy works because every face of a rectangular prism is a rectangle. Surface area, not volume, is the right measure because paint covers only the outside.",
  },
  mpo: {
    thesis: "Decomposing a net into rectangles is a correct way to find surface area, because it counts every face of the box exactly once.",
    paragraphs: [
      { topic: "A net shows every face of the box as a flat rectangle.", notes: ["net = flat pattern", "6 faces → 6 rectangles", "box 6 × 4 × 3 cm"] },
      { topic: "Finding each area and adding proves the total.", notes: ["top + bottom 24 each", "front + back 18 each", "sides 12 each", "total = 108 sq cm"] },
      { topic: "Surface area, not volume, answers the paint question.", notes: ["paint covers outside only", "SA = square units", "volume = cubic units, 72 cubic cm"] },
    ],
    conclusion: "Because the net lets Jaylen see and add every face, his strategy proves a surface area of 108 square centimeters and tells him how much paint to buy.",
  },
  revise: [
    "Did I name each face of the net and give its area with the correct numbers?",
    "Did I write square units for surface area and cubic units for volume?",
    "Did I give a reason with because or since for why my strategy works?",
    "Did I check that my six areas add up to the total?",
  ],
};
