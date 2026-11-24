// BCPSS Writing Lab (TWR) — g2-sci-u4 · Engineering Erosion Solutions. Contract: ../writing-schema.mjs

export default {
  title: "Which Barrier Works Best?",
  genre: "argue",
  tip: "Have students read the data table aloud and circle the smallest number before they write their claim.",
  lessons: [
    { id: "A", title: "Design a barrier for a hillside" },
    { id: "B", title: "Test barriers on a model hill" },
    { id: "C", title: "Collect and compare data" },
    { id: "D", title: "Claim, evidence, and reason" },
  ],
  source: {
    title: "Class 2C Tests the Hill",
    lesson: "C",
    text: "Class 2C in Baltimore builds a model hill of soil in a tray. They pour one cup of water on it. With no barrier, 9 spoons of soil wash away. With rocks, 6 spoons wash away. With grass, only 3 spoons wash away. Class 2C says grass worked best.",
  },
  notes: [
    { sentence: "With no barrier, 9 spoons of soil wash away.", note: "no barrier = 9 spoons" },
    { sentence: "With rocks, 6 spoons wash away.", note: "rocks = 6 spoons" },
    { sentence: "With grass, only 3 spoons wash away.", note: "grass = 3 spoons" },
    { sentence: "Class 2C says grass worked best.", note: "grass worked best" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Grass worked best on the model hill",
      because: "only 3 spoons of soil washed away.",
      but: "rocks stopped less soil than grass did.",
      so: "we should plant grass on a real hillside.",
    },
    {
      lesson: "B",
      kernel: "The class poured one cup of water on each hill",
      because: "every hill needs a fair test.",
      but: "each hill had a different barrier.",
      so: "the results can be compared.",
    },
    {
      lesson: "C",
      kernel: "The hill with no barrier lost 9 spoons of soil",
      because: "nothing slowed the water.",
      but: "the grass hill lost only 3 spoons.",
      so: "the data show that barriers help.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The students built a barrier.",
      parts: { where: "on the model hill", how: "with small rocks", why: "to slow the water" },
      model: "On the model hill, the students built a barrier with small rocks to slow the water.",
    },
    {
      lesson: "D",
      kernel: "Class 2C chose grass.",
      parts: { when: "after counting the soil", what: "as the best barrier", why: "because only 3 spoons washed away" },
      model: "After counting the soil, Class 2C chose grass as the best barrier because only 3 spoons washed away.",
    },
  ],
  fragments: [
    { text: "The data show that grass worked best.", is_sentence: true },
    { text: "Because only 3 spoons washed away.", is_sentence: false, fix: "Grass worked best because only 3 spoons washed away." },
    { text: "Poured one cup of water.", is_sentence: false, fix: "The class poured one cup of water." },
    { text: "Rocks let 6 spoons of soil wash away.", is_sentence: true },
    { text: "The barrier on the model hill.", is_sentence: false, fix: "The barrier on the model hill slowed the water." },
    { text: "A claim is what you think is true.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "Evidence, ___, shows that a claim is true.",
      noun: "Evidence",
      options: ["facts or numbers from a test", "a plan for how to build something", "a small copy of a hill"],
      answer: 0,
      model: "Evidence, facts or numbers from a test, shows that a claim is true.",
    },
    {
      lesson: "B",
      sentence: "A model hill, ___, shows how real erosion works.",
      noun: "model hill",
      options: ["something built to block water", "a small copy of a hillside", "numbers collected in a test"],
      answer: 1,
      model: "A model hill, a small copy of a hillside, shows how real erosion works.",
    },
    {
      lesson: "A",
      sentence: "A barrier, ___, can slow the water on a hill.",
      noun: "barrier",
      options: ["facts that show a claim is true", "a statement about what you think", "something built to block water"],
      answer: 2,
      model: "A barrier, something built to block water, can slow the water on a hill.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "grass was the best barrier", model: "Because only 3 spoons washed away, grass was the best barrier." },
    { lesson: "C", conjunction: "after", stem: "the class counted the spoons of soil", model: "After the water ran down the hill, the class counted the spoons of soil." },
    { lesson: "B", conjunction: "before", stem: "the class checks that each hill is the same", model: "Before the class pours the water, the class checks that each hill is the same." },
  ],
  spo: {
    topic: {
      l1_2: "[Grass] worked best.",
      l3_4: "I think [grass] worked best because only [3 spoons of soil] washed away.",
      l5_6: "Although [rocks] slowed the water, [grass] worked best because [only 3 spoons of soil washed away, less than with any other barrier].",
    },
    starters: [
      { type: "question", text: "Which barrier keeps a hill from washing away?" },
      { type: "appositive", text: "Grass, a plant with strong roots, worked best on the model hill." },
      { type: "subordinate", text: "Because only 3 spoons washed away, grass was the best barrier." },
    ],
    details: [
      { note: "model hill: 1 cup of water", lesson: "B" },
      { note: "no barrier = 9 spoons", lesson: "C" },
      { note: "rocks = 6 spoons", lesson: "C" },
      { note: "grass = 3 spoons", lesson: "C" },
      { note: "least soil = best barrier", lesson: "D" },
      { note: "roots hold soil in place", lesson: "D" },
    ],
    distractors: ["grass needs sunlight to grow", "the tray is made of plastic"],
    conclusion: {
      l1_2: "So [grass] is the best [barrier].",
      l3_4: "That is why [grass] is the best barrier, according to [our data].",
      l5_6: "In conclusion, [the data prove] that [grass is the best barrier], because [it let the least soil wash away].",
    },
  },
  prompt: {
    l1_2: "Draw the hill with grass. Write 1-3 sentences that tell which barrier worked best.",
    l3_4: "Write a paragraph that tells which barrier worked best and proves it with data. Use because and according to.",
    l5_6: "Write a paragraph that argues which barrier is best and proves it with data. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["I think", "First,", "For example,", "According to", "Because", "So", "But", "That is why"],
  model: {
    l1_2: "Grass worked best. Only 3 spoons of soil washed away.",
    l3_4: "I think grass worked best because only 3 spoons of soil washed away. According to our data, rocks let 6 spoons wash away. With no barrier, 9 spoons washed away. That is why grass is the best barrier.",
    l5_6: "Although rocks slowed the water, grass worked best. Grass, a plant with strong roots, held the soil in place. According to the data, only 3 spoons washed away with grass. With no barrier, 9 spoons washed away. So grass is the best barrier for a hillside.",
  },
  revise: [
    "Did I state my claim, which barrier worked best?",
    "Did I use real numbers from the data as evidence?",
    "Did I use because or according to?",
    "Did I compare my barrier to another one?",
  ],
};
