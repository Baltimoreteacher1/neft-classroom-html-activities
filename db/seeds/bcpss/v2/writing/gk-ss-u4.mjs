// BCPSS Writing Lab (TWR) — gk-ss-u4 · Needs, Wants & Neighborhood Jobs. Contract: ../writing-schema.mjs

export default {
  title: "The Grocer Helps Us",
  genre: "explain",
  tip: "Sort picture cards into needs and wants, then have children name a worker and say how that worker helps using so.",
  lessons: [
    { id: "A", title: "Needs and wants" },
    { id: "B", title: "Neighborhood workers" },
    { id: "C", title: "Goods and services" },
    { id: "D", title: "Money and jobs" },
  ],
  source: {
    title: "At the Market",
    lesson: "B",
    text: "People need food. The grocer sells apples. Rosa pays with money. The grocer earns money. People need a ride. The bus driver gives rides. Workers help us all.",
  },
  notes: [
    { sentence: "The grocer sells apples.", note: "grocer sells food" },
    { sentence: "Rosa pays with money.", note: "pay = money" },
    { sentence: "The bus driver gives rides.", note: "driver = rides" },
    { sentence: "People need a ride.", note: "need ride" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The grocer sells apples",
      because: "people need food.",
      but: "a toy is only a want.",
      so: "people can buy food nearby.",
    },
    {
      lesson: "C",
      kernel: "The bus driver gives rides",
      because: "people need to get to work.",
      but: "riders must wait for the bus.",
      so: "people get to work on time.",
    },
    {
      lesson: "A",
      kernel: "Rosa wants a toy",
      because: "toys are fun.",
      but: "she needs shoes first.",
      so: "she saves her money.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The grocer sells apples.",
      parts: { when: "every morning", where: "at the market", why: "so people can eat" },
      model: "Every morning, the grocer sells apples at the market so people can eat.",
    },
    {
      lesson: "C",
      kernel: "Dana drives a bus.",
      parts: { when: "each day", where: "across Baltimore", why: "to give people rides" },
      model: "Each day, Dana drives a bus across Baltimore to give people rides.",
    },
  ],
  fragments: [
    { text: "People need food.", is_sentence: true },
    { text: "Sells milk.", is_sentence: false, fix: "The grocer sells milk." },
    { text: "A toy is a want.", is_sentence: true },
    { text: "Because people need rides.", is_sentence: false, fix: "The bus driver works because people need rides." },
    { text: "Earns money at work.", is_sentence: false, fix: "Dana earns money at work." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Food, ___, is a need.",
      noun: "Food",
      options: ["something people must have to live", "something nice to have", "work that helps others"],
      answer: 0,
      model: "Food, something people must have to live, is a need.",
    },
    {
      lesson: "B",
      sentence: "A grocer, ___, sells apples.",
      noun: "grocer",
      options: ["a person who drives a bus", "a worker who sells food", "work someone does to help"],
      answer: 1,
      model: "A grocer, a worker who sells food, sells apples.",
    },
    {
      lesson: "C",
      sentence: "A service, ___, helps people.",
      noun: "service",
      options: ["things people make and sell", "coins and bills", "work someone does to help other people"],
      answer: 2,
      model: "A service, work someone does to help other people, helps people.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the grocer sells food", model: "When people need food, the grocer sells food." },
    { lesson: "A", conjunction: "because", stem: "Rosa buys shoes first", model: "Because shoes are a need, Rosa buys shoes first." },
    { lesson: "D", conjunction: "after", stem: "they buy food", model: "After workers earn money, they buy food." },
  ],
  spo: {
    topic: {
      l1_2: "A [grocer] gives people [food].",
      l3_4: "People need [food], so the [grocer] sells [apples].",
      l5_6: "Although [a toy] is fun, people need [food], so [the grocer] sells [apples] at the market.",
    },
    starters: [
      { type: "question", text: "How does a grocer help people get food?" },
      { type: "appositive", text: "The grocer, a worker at the market, sells apples." },
      { type: "subordinate", text: "When people need food, the grocer sells apples." },
    ],
    details: [
      { note: "people need food", lesson: "A" },
      { note: "grocer sells apples", lesson: "B" },
      { note: "apples = a good", lesson: "C" },
      { note: "pay with money", lesson: "D" },
      { note: "grocer earns money", lesson: "D" },
      { note: "toy = want, not need", lesson: "A" },
    ],
    distractors: ["bus drivers give rides", "the market is loud"],
    conclusion: {
      l1_2: "Workers [help] us.",
      l3_4: "Workers like the [grocer] help us get what we [need].",
      l5_6: "Because workers [sell goods and give services], people can get [what they need].",
    },
  },
  prompt: {
    l1_2: "Draw a worker in your neighborhood. Write 1-3 sentences. Tell what people need and how the worker helps.",
    l3_4: "Write about a worker. Tell what people need and how the worker helps. Use so. Use your outline.",
    l5_6: "Explain how a neighborhood worker helps people get what they need. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Next,", "Then,", "So", "because", "also,", "but", "For example,"],
  model: {
    l1_2: "People need food. The grocer sells apples.",
    l3_4: "People need food, so the grocer sells apples. Rosa pays with money. The grocer earns money. The apples are goods.",
    l5_6: "The grocer, a worker at the market, sells apples. Because people need food, he works every day. When Rosa pays with money, he earns money too. A toy is a want, but food is a need.",
  },
  revise: [
    "Did I name the worker?",
    "Did I tell what people need?",
    "Did I use so to tell how the worker helps?",
    "Did I tell if it is a good or a service?",
  ],
};
