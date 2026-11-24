// BCPSS Writing Lab (TWR) — g5-math-u1 · Volume of Rectangular Prisms. Contract: ../writing-schema.mjs

export default {
  title: "Prove the Volume Strategy",
  genre: "argue",
  tip: "Have students say the because sentence aloud with a stack of unit cubes in hand before they write it.",
  lessons: [
    { id: "A", title: "Packing prisms with unit cubes" },
    { id: "B", title: "Layers and V = l × w × h" },
    { id: "C", title: "Base area times height: V = B × h" },
    { id: "D", title: "Volume of composite solids" },
  ],
  source: {
    title: "Packing the Moving Box",
    lesson: "B",
    text: "Amara helps her family pack for a move out of their rowhouse. A storage box is 6 inches long, 4 inches wide, and 5 inches tall. She fills the bottom with one-inch cubes to see how many fit. The bottom layer holds 24 cubes, because 6 times 4 is 24. The box is 5 inches tall, so it has 5 layers. Then she multiplies 24 by 5. The volume is 120 cubic inches. Her strategy works because every layer has the same number of cubes.",
  },
  notes: [
    { sentence: "The bottom layer holds 24 cubes, because 6 times 4 is 24.", note: "bottom layer: 6 × 4 = 24 cubes" },
    { sentence: "The box is 5 inches tall, so it has 5 layers.", note: "5 inches tall = 5 layers" },
    { sentence: "The volume is 120 cubic inches.", note: "V = 120 cubic inches" },
    { sentence: "Her strategy works because every layer has the same number of cubes.", note: "works b/c same cubes each layer" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A prism is filled with unit cubes",
      because: "volume measures the space inside the prism.",
      but: "counting every cube one by one takes a long time.",
      so: "we look for layers and multiply instead.",
    },
    {
      lesson: "B",
      kernel: "Each layer of the box holds 24 cubes",
      because: "6 times 4 is 24.",
      but: "one layer is only part of the whole volume.",
      so: "we multiply by the number of layers to find the total.",
    },
    {
      lesson: "D",
      kernel: "A composite solid can be split into two prisms",
      because: "each part is a rectangular prism with its own volume.",
      but: "the two parts must not overlap each other.",
      so: "we add the two volumes to find the total.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Amara filled the box.",
      parts: { when: "after school", how: "with one-inch cubes", where: "in her room", why: "to count the space inside" },
      model: "After school, Amara filled the box with one-inch cubes in her room to count the space inside.",
    },
    {
      lesson: "C",
      kernel: "Marcus multiplied.",
      parts: { when: "next", what: "the base area by the height", why: "to find the volume" },
      model: "Next, Marcus multiplied the base area by the height to find the volume.",
    },
  ],
  fragments: [
    { text: "Volume is measured in cubic units.", is_sentence: true },
    { text: "Because every layer has 24 cubes.", is_sentence: false, fix: "The strategy works because every layer has 24 cubes." },
    { text: "The box has five layers.", is_sentence: true },
    { text: "Multiplies the length by the width.", is_sentence: false, fix: "Amara multiplies the length by the width." },
    { text: "The composite solid made from two prisms.", is_sentence: false, fix: "The composite solid is made from two prisms." },
    { text: "When the height is 5 inches.", is_sentence: false, fix: "There are 5 layers when the height is 5 inches." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A cubic unit, ___, is used to measure volume.",
      noun: "cubic unit",
      options: ["a cube that is 1 unit long, 1 unit wide, and 1 unit tall", "a flat shape with four equal sides", "a rule written with letters"],
      answer: 0,
      model: "A cubic unit, a cube that is 1 unit long, 1 unit wide, and 1 unit tall, is used to measure volume.",
    },
    {
      lesson: "B",
      sentence: "The bottom layer, ___, holds 24 cubes.",
      noun: "bottom layer",
      options: ["a solid made by joining two solids", "the first flat level of cubes in the box", "the number you multiply by"],
      answer: 1,
      model: "The bottom layer, the first flat level of cubes in the box, holds 24 cubes.",
    },
    {
      lesson: "D",
      sentence: "A composite solid, ___, can be split into prisms.",
      noun: "composite solid",
      options: ["the face a solid sits on", "a rule written with letters that works for every case", "a solid made by joining two or more simpler solids"],
      answer: 2,
      model: "A composite solid, a solid made by joining two or more simpler solids, can be split into prisms.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "since", stem: "the volume is 120 cubic inches", model: "Since each layer holds 24 cubes and there are 5 layers, the volume is 120 cubic inches." },
    { lesson: "C", conjunction: "if", stem: "we can find the volume", model: "If we know the base area and the height, we can find the volume." },
    { lesson: "D", conjunction: "after", stem: "she adds their volumes", model: "After Tasha splits the solid into two prisms, she adds their volumes." },
  ],
  spo: {
    topic: {
      l1_2: "My strategy [works] for finding the [volume].",
      l3_4: "My strategy for finding the volume of the box works because [each layer has 24 cubes] and [there are 5 layers].",
      l5_6: "Although [counting every cube would also work], multiplying [the base area by the height] is a valid strategy since [reason].",
    },
    starters: [
      { type: "statement", text: "Multiplying the base area by the height works for any rectangular prism." },
      { type: "question", text: "How can you prove that a volume strategy works every time?" },
      { type: "subordinate", text: "Although counting every cube is possible, layers make the work much faster." },
    ],
    details: [
      { note: "box 6 × 4 × 5 inches", lesson: "A" },
      { note: "bottom layer = 6 × 4 = 24 cubes", lesson: "B" },
      { note: "24 × 5 layers = 120 cubic inches", lesson: "B" },
      { note: "B × h = base area × height", lesson: "C" },
      { note: "all layers same → works every time", lesson: "C" },
      { note: "composite solid: split, find each V, add", lesson: "D" },
    ],
    distractors: ["a cube has six equal faces", "the box is made of cardboard"],
    conclusion: {
      l1_2: "The volume is [number] [cubic inches].",
      l3_4: "My strategy works because [every layer is the same], so the volume is [120] cubic inches.",
      l5_6: "Therefore, multiplying [the base area by the height] is a valid strategy since [every layer holds the same number of cubes].",
    },
  },
  prompt: {
    l1_2: "Draw the box with its layers. Write 2-4 sentences. Tell the volume and one reason your strategy works.",
    l3_4: "Write a paragraph that finds the volume of the 6 inch by 4 inch by 5 inch box and explains why your strategy works. Use your outline, because, and so.",
    l5_6: "Write a paragraph that proves your strategy for the volume of the box works and shows how it can find the volume of a composite solid. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "Since", "So", "Therefore,", "For example,"],
  model: {
    l1_2: "The box has 5 layers. Each layer has 24 cubes. The volume is 120 cubic inches.",
    l3_4: "My strategy for finding the volume of the storage box works because every layer has the same number of cubes. The box is 6 inches long and 4 inches wide, so each layer holds 6 times 4, or 24 cubes. The box is 5 inches tall, so it has 5 layers. I multiplied 24 by 5, and the volume is 120 cubic inches. Since every layer is the same, multiplying is a faster way to count all the cubes.",
    l5_6: "Although I could count all 120 cubes one by one, multiplying the base area by the height is a faster strategy. The base, a rectangle that is 6 inches long and 4 inches wide, has an area of 24 square inches. That means each layer holds 24 cubes. Because the box is 5 inches tall, it has 5 layers, so I multiplied 24 by 5. The volume is 120 cubic inches. This strategy is valid since every layer holds the same number of cubes, and it also works when I split a composite solid into two prisms and add their volumes.",
  },
  mpo: {
    thesis: "Multiplying the base area by the height is a valid way to find the volume of any rectangular prism, and it also works for composite solids.",
    paragraphs: [
      { topic: "Layers of unit cubes show why the strategy works.", notes: ["bottom layer = 6 × 4 = 24", "5 inches tall = 5 layers", "24 × 5 = 120 cubic inches"] },
      { topic: "The formula V = B × h is a shortcut for counting layers.", notes: ["B = area of the base", "h = number of layers", "same for any prism"] },
      { topic: "The same strategy works for composite solids.", notes: ["split into two prisms", "find each volume", "add the volumes"] },
    ],
    conclusion: "Because every layer holds the same number of cubes, multiplying the base area by the height proves that the volume strategy works every time.",
  },
  revise: [
    "Did I give the volume with the right unit, cubic inches?",
    "Did I explain why the strategy works with because or since, not only how I did it?",
    "Did I show the layers: how many cubes in one layer and how many layers?",
    "Did I check that my numbers match the box, 6 by 4 by 5?",
  ],
};
