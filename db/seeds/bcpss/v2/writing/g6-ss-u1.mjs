// BCPSS Writing Lab (TWR) — g6-ss-u1 · Early Humans & Agricultural Revolution. Contract: ../writing-schema.mjs

export default {
  title: "How Farming Changed Everything",
  genre: "explain",
  tip: "Have students draw a three-box cause chain first, then turn each arrow into a because, so, or as a result sentence.",
  lessons: [
    { id: "A", title: "Hunter-gatherers and how early people adapted" },
    { id: "B", title: "The Agricultural Revolution and domestication" },
    { id: "C", title: "Surplus food and specialization of jobs" },
    { id: "D", title: "Permanent settlements and early villages" },
  ],
  source: {
    title: "From Wandering to Villages",
    lesson: "B",
    text: "For most of history, people lived as hunter-gatherers. They followed herds of animals and gathered nuts and berries, so they moved with the seasons. About 11,000 years ago, the climate grew warmer, and wild wheat and barley spread across the Fertile Crescent. People learned to domesticate these plants by saving seeds and planting them on purpose. Because farmers had to guard their fields, they built permanent villages. A good harvest gave them a surplus of grain. As a result, some villagers could stop farming and become potters, builders, or toolmakers. This specialization changed how people worked and shared.",
  },
  notes: [
    { sentence: "They followed herds of animals and gathered nuts and berries, so they moved with the seasons.", note: "follow herds + gather → move often" },
    { sentence: "People learned to domesticate these plants by saving seeds and planting them on purpose.", note: "domesticate = save seeds, plant on purpose" },
    { sentence: "Because farmers had to guard their fields, they built permanent villages.", note: "guard fields → permanent villages" },
    { sentence: "As a result, some villagers could stop farming and become potters, builders, or toolmakers.", note: "surplus → specialization" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Farmers grew more grain than they could eat",
      because: "wheat and barley grew well in the warm, wet climate.",
      but: "bad weather could still ruin a harvest.",
      so: "some villagers could stop farming and learn other jobs.",
    },
    {
      lesson: "A",
      kernel: "Hunter-gatherers moved often",
      because: "the food they needed moved with the seasons.",
      but: "they did not wander without a plan, since they followed herds and ripening plants.",
      so: "families packed light and shared everything.",
    },
    {
      lesson: "B",
      kernel: "People began to plant seeds on purpose",
      because: "wild wheat and barley had spread across the Fertile Crescent.",
      but: "growing crops took more work than gathering wild plants.",
      so: "groups stayed in one place to guard their fields.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Farmers built villages.",
      parts: { when: "After learning to plant seeds", where: "near their fields", why: "to guard their crops" },
      model: "After learning to plant seeds, farmers built villages near their fields to guard their crops.",
    },
    {
      lesson: "C",
      kernel: "A potter made bowls.",
      parts: { when: "After the harvest", where: "in the village", why: "to store the surplus grain" },
      model: "After the harvest, a potter in the village made bowls to store the surplus grain.",
    },
  ],
  fragments: [
    { text: "Hunter-gatherers followed herds of animals.", is_sentence: true },
    { text: "Because food moved with the seasons.", is_sentence: false, fix: "Families moved often because food moved with the seasons." },
    { text: "A surplus is extra food left after everyone has enough.", is_sentence: true },
    { text: "Became potters and toolmakers.", is_sentence: false, fix: "Some villagers became potters and toolmakers." },
    { text: "When farmers learned to plant seeds.", is_sentence: false, fix: "When farmers learned to plant seeds, they stayed in one place." },
    { text: "Domesticate means to tame wild plants or animals.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Hunter-gatherers, ___, moved with the seasons to find food.",
      noun: "Hunter-gatherers",
      options: ["people who hunt animals and collect wild plants", "people who grow crops in one place", "people who make pottery in villages"],
      answer: 0,
      model: "Hunter-gatherers, people who hunt animals and collect wild plants, moved with the seasons to find food.",
    },
    {
      lesson: "B",
      sentence: "The Fertile Crescent, ___, was a good place to plant wheat and barley.",
      noun: "Fertile Crescent",
      options: ["a curved region of rich land in Southwest Asia", "a tool used to harvest grain", "a group of hunters"],
      answer: 0,
      model: "The Fertile Crescent, a curved region of rich land in Southwest Asia, was a good place to plant wheat and barley.",
    },
    {
      lesson: "C",
      sentence: "Specialization, ___, helped villages make better tools and pottery.",
      noun: "Specialization",
      options: ["doing one skilled job very well", "growing food for your own family", "moving from place to place"],
      answer: 0,
      model: "Specialization, doing one skilled job very well, helped villages make better tools and pottery.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "they built permanent villages", model: "Because farmers had to guard their fields, they built permanent villages." },
    { lesson: "B", conjunction: "when", stem: "wild wheat and barley spread", model: "When the climate grew warmer, wild wheat and barley spread." },
    { lesson: "C", conjunction: "after", stem: "some villagers became potters", model: "After farmers stored a surplus, some villagers became potters." },
  ],
  spo: {
    topic: {
      l1_2: "Farming [changed] how early people [lived].",
      l3_4: "Farming changed life for early people because [a surplus of food] led to [villages] and [new jobs].",
      l5_6: "Although hunter-gatherers lived well for thousands of years, [learning to farm] led to [permanent villages and a surplus], and as a result [people specialized in new jobs].",
    },
    starters: [
      { type: "question", text: "What happens to a group of people when they grow more food than they need?" },
      { type: "appositive", text: "Farming, the growing of crops on purpose, changed where and how early people lived." },
      { type: "subordinate", text: "Before people learned to farm, families moved with the seasons." },
    ],
    details: [
      { note: "hunter-gatherers move with seasons", lesson: "A" },
      { note: "warm climate → wild wheat + barley", lesson: "B" },
      { note: "domesticate = plant seeds on purpose", lesson: "B" },
      { note: "guard fields → permanent villages", lesson: "D" },
      { note: "good harvest → surplus grain", lesson: "C" },
      { note: "surplus → potters, builders, toolmakers", lesson: "C" },
    ],
    distractors: ["ancient people carved small statues", "wheat bread is popular today"],
    conclusion: {
      l1_2: "Farming led to [villages] and [jobs].",
      l3_4: "As a result, farming [changed] where people lived and what [jobs] they did.",
      l5_6: "In this way, one change in how people got food [reshaped] how they [worked, lived and shared].",
    },
  },
  prompt: {
    l1_2: "Draw a farm and a village. Write 3-4 sentences about how farming changed life. Use the words farm, village, and job.",
    l3_4: "Write a paragraph that explains how farming changed life for early people. Use your outline, because, and as a result.",
    l5_6: "Write a paragraph that explains the chain of causes and effects from learning to farm to new jobs. Include an appositive and a sentence that starts with because or when.",
  },
  transitions: ["First,", "Because", "So", "As a result,", "This led to", "Therefore,", "For example,", "Over time,"],
  model: {
    l1_2: "People once moved to find food. Then they planted seeds. They stayed in villages. Some people made pots and tools.",
    l3_4: "Farming changed life for early people because a surplus of food led to villages and new jobs. At first, hunter-gatherers moved with the seasons to find food. Then people learned to plant wheat and barley on purpose. Because farmers had to guard their fields, they built permanent villages. A good harvest gave them a surplus, so some people became potters and toolmakers.",
    l5_6: "Although hunter-gatherers lived well for thousands of years, learning to farm changed life for early people. As the climate grew warmer, wild wheat and barley spread across the Fertile Crescent, a region of rich land in Southwest Asia. People began to domesticate these plants by planting seeds on purpose. Because farmers had to guard their fields, groups stayed in one place and built permanent villages. A good harvest produced a surplus of grain, so some villagers no longer had to farm. As a result, specialization began, and potters, builders, and toolmakers filled new jobs. In this way, one change in how people got food reshaped how they worked and shared.",
  },
  mpo: {
    thesis: "Learning to farm caused a chain of changes for early people: permanent villages, a surplus of food, and new kinds of jobs.",
    paragraphs: [
      { topic: "Life before farming meant moving with the food.", notes: ["hunter-gatherers", "follow herds + gather plants", "move with seasons"] },
      { topic: "Farming created permanent villages.", notes: ["warm climate → wild grain", "plant seeds on purpose", "guard fields → villages"] },
      { topic: "A surplus of food led to specialization.", notes: ["good harvest → surplus", "some stop farming", "potters, builders, toolmakers"] },
    ],
    conclusion: "Because each change led to the next, farming reshaped where people lived, what jobs they did, and how they shared.",
  },
  revise: [
    "Did I show a clear chain from cause to effect, not just a list of facts?",
    "Did I use because, so or as a result at least twice?",
    "Did I use words such as surplus, domesticate and specialization correctly?",
    "Did I say how life before farming was different from life after farming?",
  ],
};
