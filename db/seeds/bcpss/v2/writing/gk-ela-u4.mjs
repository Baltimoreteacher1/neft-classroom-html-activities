// BCPSS Writing Lab (TWR) — gk-ela-u4 · The Continents. Contract: ../writing-schema.mjs

export default {
  title: "Where I Want to Go",
  genre: "argue",
  tip: "Point to each continent on the globe as children say their pick, then have them give the reason with because.",
  lessons: [
    { id: "A", title: "Seven continents on a map and globe" },
    { id: "B", title: "Africa and Asia: animals and landmarks" },
    { id: "C", title: "Australia and Antarctica" },
    { id: "D", title: "Choosing a place with a reason" },
  ],
  source: {
    title: "Seven Big Lands",
    lesson: "A",
    text: "There are seven continents. Africa has lions. Asia has the Great Wall. Australia has kangaroos. Antarctica is cold and icy. Penguins live there. Maryland is in North America.",
  },
  notes: [
    { sentence: "Africa has lions.", note: "Africa: lions" },
    { sentence: "Asia has the Great Wall.", note: "Asia = Great Wall" },
    { sentence: "Antarctica is cold and icy.", note: "Antarctica = cold" },
    { sentence: "Maryland is in North America.", note: "MD @ N. America" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "I want to visit Africa",
      because: "lions live there.",
      but: "it is a very long trip.",
      so: "we can find it on the globe.",
    },
    {
      lesson: "C",
      kernel: "Mia wants to visit Antarctica",
      because: "she loves penguins.",
      but: "it is very cold there.",
      so: "she will pack a warm coat.",
    },
    {
      lesson: "A",
      kernel: "A map shows the continents",
      because: "it is a flat picture of Earth.",
      but: "a globe is round.",
      so: "we can find where places are.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Mia wants to visit.",
      parts: { when: "someday", where: "Australia", why: "because kangaroos hop very high" },
      model: "Someday, Mia wants to visit Australia because kangaroos hop very high.",
    },
    {
      lesson: "D",
      kernel: "Penguins swim.",
      parts: { when: "every day", where: "in the icy ocean", why: "to catch fish" },
      model: "Every day, penguins swim in the icy ocean to catch fish.",
    },
  ],
  fragments: [
    { text: "Asia has the Great Wall.", is_sentence: true },
    { text: "Lions in Africa.", is_sentence: false, fix: "Lions live in Africa." },
    { text: "I want to visit Asia.", is_sentence: true },
    { text: "Because penguins are cute.", is_sentence: false, fix: "I want to visit Antarctica because penguins are cute." },
    { text: "Is a very big area of land.", is_sentence: false, fix: "A continent is a very big area of land." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Africa, ___, has many lions.",
      noun: "Africa",
      options: ["a hot continent", "a round model of Earth", "a famous wall"],
      answer: 0,
      model: "Africa, a hot continent, has many lions.",
    },
    {
      lesson: "B",
      sentence: "The Great Wall, ___, is in Asia.",
      noun: "Great Wall",
      options: ["a huge area of salt water", "a famous landmark", "a hopping animal"],
      answer: 1,
      model: "The Great Wall, a famous landmark, is in Asia.",
    },
    {
      lesson: "A",
      sentence: "A globe, ___, shows the whole Earth.",
      noun: "globe",
      options: ["a very tall hill", "a dry place with no rain", "a round model of Earth"],
      answer: 2,
      model: "A globe, a round model of Earth, shows the whole Earth.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "I want to visit Africa", model: "Because I love lions, I want to visit Africa." },
    { lesson: "C", conjunction: "if", stem: "I will bring a warm coat", model: "If I go to Antarctica, I will bring a warm coat." },
    { lesson: "A", conjunction: "when", stem: "I find Maryland", model: "When I look at the map, I find Maryland." },
  ],
  spo: {
    topic: {
      l1_2: "I want to visit [Australia].",
      l3_4: "I want to visit [Australia] because the book shows [kangaroos].",
      l5_6: "Although there are seven continents, I most want to visit [Australia] because [reason].",
    },
    starters: [
      { type: "question", text: "Would you like to see a kangaroo hop?" },
      { type: "appositive", text: "Australia, a continent far from Maryland, has kangaroos." },
      { type: "subordinate", text: "Because kangaroos hop so high, I want to visit Australia." },
    ],
    details: [
      { note: "find Australia on the globe", lesson: "A" },
      { note: "book shows kangaroos", lesson: "C" },
      { note: "kangaroos hop very high", lesson: "C" },
      { note: "looks fun", lesson: "D" },
      { note: "Sydney Opera House", lesson: "C" },
      { note: "my opinion = want to go", lesson: "D" },
    ],
    distractors: ["Antarctica is icy", "the Great Wall is long"],
    conclusion: {
      l1_2: "That is why I want to [go].",
      l3_4: "That is why I want to visit [Australia]!",
      l5_6: "Because [kangaroos and the Opera House] look so fun, [Australia] is my pick.",
    },
  },
  prompt: {
    l1_2: "Draw a continent you want to visit. Write 1-3 sentences. Say what you want and why.",
    l3_4: "Write about the continent you want to visit. Give a reason with because. Use your outline.",
    l5_6: "Write your opinion about which continent to visit. Include an appositive and a sentence that starts with because or if.",
  },
  transitions: ["I want", "because", "also,", "so", "and", "but", "My opinion is", "For example,"],
  model: {
    l1_2: "I want to visit Australia. I want to see kangaroos.",
    l3_4: "I want to visit Australia because the book shows kangaroos. They hop very high. That looks fun. Also, I can see the Sydney Opera House.",
    l5_6: "Australia, a continent far from Maryland, is my pick. Because kangaroos hop so high, I want to visit. I would also see the Sydney Opera House. That looks like so much fun.",
  },
  revise: [
    "Did I say which continent I want to visit?",
    "Did I give a reason with because?",
    "Did I use proof from the book, like an animal or a landmark?",
    "Did I tell my opinion in my own words?",
  ],
};
