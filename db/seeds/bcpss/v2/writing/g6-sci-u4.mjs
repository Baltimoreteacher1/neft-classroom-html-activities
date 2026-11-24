// BCPSS Writing Lab (TWR) — g6-sci-u4 · How Does Water Shape Our World? Contract: ../writing-schema.mjs

export default {
  title: "Predicting Sand with a Rate",
  genre: "explain",
  tip: "Ask students to say the rate with for every before they multiply, so the relationship is stated before the prediction.",
  lessons: [
    { id: "A", title: "The water cycle and runoff" },
    { id: "B", title: "Weathering and erosion" },
    { id: "C", title: "Deposition and river deltas" },
    { id: "D", title: "Using rates to predict how much sediment moves" },
  ],
  source: {
    title: "The Stream Table Test",
    lesson: "D",
    text: "Ms. Rivera's class builds a stream table, a tray of sand with a slope they can change. They raise one end by 1 cm and pour water over the sand. About 4 grams of sand moves to the bottom. When they raise the slope 2 cm, about 8 grams move. When they raise it 3 cm, about 12 grams move. For every 1 cm of slope, about 4 more grams of sand move, so the amount of sand is proportional to the slope. The water slows down at the flat end, and deposition drops the sand there in a small delta. Near the Chesapeake Bay, the Susquehanna River does the same job on a giant scale.",
  },
  notes: [
    { sentence: "About 4 grams of sand moves to the bottom.", note: "1 cm slope = 4 g sand" },
    { sentence: "When they raise it 3 cm, about 12 grams move.", note: "3 cm = 12 g, × 3" },
    { sentence: "For every 1 cm of slope, about 4 more grams of sand move, so the amount of sand is proportional to the slope.", note: "every 1 cm → + 4 g = proportional" },
    { sentence: "The water slows down at the flat end, and deposition drops the sand there in a small delta.", note: "water slows → deposition → delta" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "A slope of 3 cm moves about 12 grams of sand",
      because: "3 × 4 grams equals 12 grams.",
      but: "a slope of 0 cm would move 0 grams.",
      so: "the class can predict that 5 cm would move about 20 grams.",
    },
    {
      lesson: "B",
      kernel: "Weathering breaks rock into pieces",
      because: "water seeps into cracks and freezes, which pushes the rock apart.",
      but: "weathering does not move the pieces away.",
      so: "erosion must carry the sediment downhill.",
    },
    {
      lesson: "C",
      kernel: "Sediment drops at the end of a river",
      because: "the water slows down and can no longer carry it.",
      but: "fast water upstream keeps carrying it along.",
      so: "a delta of new land can build up where the river meets the Bay.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The class predicted the result.",
      parts: { when: "Before the next trial", how: "with a rate of 4 grams per centimeter", why: "so they could test their idea" },
      model: "Before the next trial, the class predicted the result with a rate of 4 grams per centimeter so they could test their idea.",
    },
    {
      lesson: "C",
      kernel: "Sand settled.",
      parts: { when: "When the water slowed down", where: "at the flat end of the tray", how: "in a small delta" },
      model: "When the water slowed down, sand settled at the flat end of the tray in a small delta.",
    },
  ],
  fragments: [
    { text: "Erosion carries sediment away from its place.", is_sentence: true },
    { text: "Raised the slope by 2 centimeters.", is_sentence: false, fix: "The class raised the slope by 2 centimeters." },
    { text: "Because the water slowed down.", is_sentence: false, fix: "Deposition happens because the water slowed down." },
    { text: "Weathering breaks rock into smaller pieces.", is_sentence: true },
    { text: "For every 1 cm of slope.", is_sentence: false, fix: "For every 1 cm of slope, about 4 more grams of sand move." },
    { text: "A delta is a fan-shaped area of new land.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Weathering, ___, can start when water freezes in a crack.",
      noun: "Weathering",
      options: ["the slow breaking of rock into smaller pieces", "the carrying away of rock and soil", "the dropping of sediment in a new place"],
      answer: 0,
      model: "Weathering, the slow breaking of rock into smaller pieces, can start when water freezes in a crack.",
    },
    {
      lesson: "C",
      sentence: "Deposition, ___, builds new land at the end of a river.",
      noun: "Deposition",
      options: ["the dropping of sediment where water slows down", "the carrying away of rock by water", "rain that flows over the ground"],
      answer: 0,
      model: "Deposition, the dropping of sediment where water slows down, builds new land at the end of a river.",
    },
    {
      lesson: "D",
      sentence: "A rate, ___, lets the class predict how much sand will move.",
      noun: "rate",
      options: ["a comparison like 4 grams for every 1 centimeter", "a drawing that shows a slope", "a pile of sand at the bottom"],
      answer: 0,
      model: "A rate, a comparison like 4 grams for every 1 centimeter, lets the class predict how much sand will move.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "runoff flows downhill", model: "When rain falls faster than the ground can soak it up, runoff flows downhill." },
    { lesson: "B", conjunction: "because", stem: "a river can reshape a valley over time", model: "Because moving water carries sediment, a river can reshape a valley over time." },
    { lesson: "D", conjunction: "if", stem: "about 16 grams of sand move", model: "If the slope rises 4 cm, about 16 grams of sand move." },
  ],
  spo: {
    topic: {
      l1_2: "More [slope] moves more [sand].",
      l3_4: "On the stream table, [the amount of sand] is proportional to [the slope], because for every [1 cm], about [4 grams] move.",
      l5_6: "Although a stream table is small, [it shows] that [the amount of sand moved] is proportional to [the slope], so [a rate predicts results for any slope].",
    },
    starters: [
      { type: "question", text: "If one more centimeter of slope moves 4 more grams of sand, how much moves at 5 centimeters?" },
      { type: "appositive", text: "A stream table, a tray of sand with a slope you can change, shows how rivers move sediment." },
      { type: "subordinate", text: "Since the rate stays the same, the class can predict results they have not tested." },
    ],
    details: [
      { note: "1 cm slope → 4 g sand", lesson: "D" },
      { note: "2 cm → 8 g, 3 → 12 g", lesson: "D" },
      { note: "for every 1 cm, + 4 g", lesson: "D" },
      { note: "rate = 4 g per cm", lesson: "D" },
      { note: "water slows → deposition → delta", lesson: "C" },
      { note: "erosion carries sand downhill", lesson: "B" },
    ],
    distractors: ["the tray is made of clear plastic", "the class meets before lunch"],
    conclusion: {
      l1_2: "A [rate] helps us [predict].",
      l3_4: "Because the rate stays the same, the class can predict that [5 cm] will move [20 grams].",
      l5_6: "In the same way, [rates and ratios] help scientists explain how [moving water breaks, carries and drops] rock and soil.",
    },
  },
  prompt: {
    l1_2: "Draw the stream table and the sand. Write 3-4 sentences about the slope and the sand. Use the words slope, sand, and more.",
    l3_4: "Write a paragraph that explains how the amount of sand changes with the slope on the stream table. Use your outline, for every, and so.",
    l5_6: "Write a paragraph that explains why the amount of sand is proportional to the slope, uses the rate to predict 5 cm, and connects the stream table to a real river. Include an appositive and a sentence that starts with if or since.",
  },
  transitions: ["First,", "Next,", "For every", "If", "So", "As a result,", "For example,", "Finally,"],
  model: {
    l1_2: "Ms. Rivera's class raises the stream table 1 cm. About 4 grams of sand move. They raise it 2 cm and about 8 grams move. More slope moves more sand.",
    l3_4: "On the stream table, the amount of sand is proportional to the slope. For every 1 cm of slope, about 4 grams of sand move. When the class raised the slope 2 cm, 8 grams moved. When they raised it 3 cm, 12 grams moved. Because the rate stays the same, they can predict that 5 cm will move 20 grams. The water slows at the flat end, so deposition drops the sand in a delta.",
    l5_6: "Although a stream table is small, it shows how moving water and slope are connected. For every 1 cm of slope, about 4 more grams of sand move, so the amount of sand is proportional to the slope. When the slope doubled from 1 cm to 2 cm, the sand also doubled from 4 grams to 8 grams. When the slope tripled to 3 cm, the sand tripled to 12 grams. If the relationship stays the same, a slope of 5 cm should move 20 grams. Erosion carries the sand downhill, and deposition, the dropping of sediment, builds a small delta where the water slows. The Susquehanna River does the same job near the Chesapeake Bay, only on a much larger scale.",
  },
  mpo: {
    thesis: "On a stream table, the amount of sand that moves is proportional to the slope, so a rate helps us predict how water reshapes land.",
    paragraphs: [
      { topic: "The data show a steady rate.", notes: ["1 cm → 4 g", "2 cm → 8 g", "3 cm → 12 g"] },
      { topic: "Moving water breaks, carries and drops sediment.", notes: ["weathering = breaks rock", "erosion = carries sediment", "deposition = drops sediment → delta"] },
      { topic: "A rate predicts new results.", notes: ["4 g per cm", "5 cm → 5 × 4 = 20 g", "real river: Susquehanna → Bay"] },
    ],
    conclusion: "Because the rate stays the same as the numbers grow, scientists can use it to predict how much land water will move in a stream table or a real river.",
  },
  revise: [
    "Did I state the rate with for every, including the units, such as 4 grams for every 1 centimeter?",
    "Did I show the relationship stays the same as the numbers grow, such as doubling and tripling?",
    "Did I use weathering, erosion and deposition for the right jobs?",
    "Did I check that my prediction, such as 5 × 4 = 20, follows from the rate?",
  ],
};
