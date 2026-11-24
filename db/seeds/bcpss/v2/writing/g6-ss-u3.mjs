// BCPSS Writing Lab (TWR) — g6-ss-u3 · Classical Civilizations: India, China & Silk Road. Contract: ../writing-schema.mjs

export default {
  title: "Ashoka's Turning Point",
  genre: "narrate",
  tip: "Have students place the turning point on a timeline first, then retell the story with one time word for each event.",
  lessons: [
    { id: "A", title: "Ashoka, the Kalinga War and the edicts" },
    { id: "B", title: "Buddhism spreads from India" },
    { id: "C", title: "Han China and the journey of Zhang Qian" },
    { id: "D", title: "The Silk Road and cultural diffusion" },
  ],
  source: {
    title: "From War to Peace",
    lesson: "A",
    text: "Ashoka ruled the Maurya Empire in India about 2,300 years ago. At first, he fought wars to expand his empire. Then came the terrible Kalinga War, where many thousands of people died. Afterward, Ashoka felt deep regret. He turned toward peace and supported Buddhist teachers. He carved his edicts, or official orders, on stone pillars across India. Later, monks and merchants carried Buddhism along the Silk Road into China. As a result, an idea that began in India reached people thousands of miles away. Separately, in 126 BCE, the Han explorer Zhang Qian returned with news that opened new trade routes.",
  },
  notes: [
    { sentence: "At first, he fought wars to expand his empire.", note: "first: wars → bigger empire" },
    { sentence: "Then came the terrible Kalinga War, where many thousands of people died.", note: "Kalinga War = turning point, many died" },
    { sentence: "He carved his edicts, or official orders, on stone pillars across India.", note: "edicts carved on pillars" },
    { sentence: "Later, monks and merchants carried Buddhism along the Silk Road into China.", note: "monks + merchants → Buddhism → China" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Ashoka turned toward peace",
      because: "the Kalinga War caused terrible suffering.",
      but: "he had fought wars to expand his empire before that.",
      so: "he carved messages of peace on stone pillars.",
    },
    {
      lesson: "B",
      kernel: "Buddhism spread beyond India",
      because: "monks and merchants carried its teachings along trade routes.",
      but: "it spread slowly at first.",
      so: "it eventually reached China.",
    },
    {
      lesson: "D",
      kernel: "The Silk Road connected Asia",
      because: "caravans carried silk, horses and ideas along its routes.",
      but: "no single trader traveled the whole way.",
      so: "goods and ideas spread from place to place.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Ashoka carved edicts.",
      parts: { when: "After the Kalinga War", where: "on stone pillars", why: "to share his message of peace" },
      model: "After the Kalinga War, Ashoka carved edicts on stone pillars to share his message of peace.",
    },
    {
      lesson: "C",
      kernel: "Zhang Qian returned.",
      parts: { when: "In 126 BCE", where: "to the Han court", how: "with news of new lands and strong horses" },
      model: "In 126 BCE, Zhang Qian returned to the Han court with news of new lands and strong horses.",
    },
  ],
  fragments: [
    { text: "Ashoka ruled the Maurya Empire.", is_sentence: true },
    { text: "After the Kalinga War ended.", is_sentence: false, fix: "After the Kalinga War ended, Ashoka chose peace." },
    { text: "Carried silk west along the Silk Road.", is_sentence: false, fix: "Caravans carried silk west along the Silk Road." },
    { text: "A caravan is a group of traders and animals traveling together.", is_sentence: true },
    { text: "Because the empire grew very large.", is_sentence: false, fix: "Ashoka used pillars because the empire grew very large." },
    { text: "Buddhism reached China around the first century CE.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Ashoka, ___, carved his edicts on stone pillars.",
      noun: "Ashoka",
      options: ["an emperor of the Maurya Empire", "a group of traders with animals", "a seasonal wind that brings rain"],
      answer: 0,
      model: "Ashoka, an emperor of the Maurya Empire, carved his edicts on stone pillars.",
    },
    {
      lesson: "D",
      sentence: "The Silk Road, ___, carried silk, ideas and horses across Asia.",
      noun: "Silk Road",
      options: ["a network of trade routes", "an official order from a ruler", "a new idea or invention"],
      answer: 0,
      model: "The Silk Road, a network of trade routes, carried silk, ideas and horses across Asia.",
    },
    {
      lesson: "C",
      sentence: "Zhang Qian, ___, brought the Han emperor news of the west.",
      noun: "Zhang Qian",
      options: ["a Han explorer", "a Buddhist teacher in India", "a Maurya emperor"],
      answer: 0,
      model: "Zhang Qian, a Han explorer, brought the Han emperor news of the west.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "after", stem: "Ashoka turned toward peace", model: "After the Kalinga War ended, Ashoka turned toward peace." },
    { lesson: "D", conjunction: "when", stem: "ideas traveled with the goods", model: "When caravans crossed Asia, ideas traveled with the goods." },
    { lesson: "C", conjunction: "before", stem: "the Han court knew little about the west", model: "Before Zhang Qian returned, the Han court knew little about the west." },
  ],
  spo: {
    topic: {
      l1_2: "Ashoka [fought wars], then [chose peace].",
      l3_4: "Initially, Ashoka [fought wars to expand his empire]. After [the Kalinga War], he [turned toward peace].",
      l5_6: "Although Ashoka began as [a conqueror], the Kalinga War became [a turning point] that [changed his goals and helped spread Buddhism across Asia].",
    },
    starters: [
      { type: "question", text: "How can one terrible war change a powerful emperor?" },
      { type: "appositive", text: "Ashoka, an emperor of the Maurya Empire, turned from war to peace after the Kalinga War." },
      { type: "subordinate", text: "After thousands died in the Kalinga War, Ashoka rethought what a ruler should do." },
    ],
    details: [
      { note: "Ashoka = Maurya emperor in India", lesson: "A" },
      { note: "first: wars to expand empire", lesson: "A" },
      { note: "Kalinga War = turning point", lesson: "A" },
      { note: "regret → peace + Buddhist teachers", lesson: "A" },
      { note: "edicts carved on stone pillars", lesson: "A" },
      { note: "monks + merchants → Buddhism → China", lesson: "B" },
    ],
    distractors: ["Zhang Qian brought back strong horses", "monsoon winds bring rain to India"],
    conclusion: {
      l1_2: "Ashoka [chose] [peace].",
      l3_4: "As a result, Ashoka's message of [peace] spread across [India] and beyond.",
      l5_6: "Eventually, [an idea that began after one war] reached [people thousands of miles away].",
    },
  },
  prompt: {
    l1_2: "Draw Ashoka and a stone pillar. Write 3-4 sentences about what he did first and what he did next. Use the words first, then, and peace.",
    l3_4: "Write a paragraph that tells the story of Ashoka's turning point in order. Use your outline, time words, and a result.",
    l5_6: "Write a paragraph that narrates how the Kalinga War changed Ashoka and how his ideas traveled afterward. Include an appositive and a sentence that starts with after or although.",
  },
  transitions: ["Initially,", "At first,", "Then", "After", "At the turning point,", "As a result,", "Later,", "Eventually,"],
  model: {
    l1_2: "Ashoka fought wars to make his empire bigger. Then came the Kalinga War. He felt sad and chose peace. He carved his message on pillars.",
    l3_4: "Initially, Ashoka fought wars to expand his empire. Then the terrible Kalinga War caused many thousands of deaths. After the war, he felt deep regret and turned toward peace. He carved edicts on stone pillars to share his message. As a result, ideas of peace and Buddhism spread across India.",
    l5_6: "Although Ashoka began as a conqueror, the Kalinga War became the turning point of his life. Initially, he fought wars to expand the Maurya Empire, a large kingdom in India. Then the Kalinga War caused terrible suffering, and Ashoka felt deep regret. After the war, he supported Buddhist teachers and carved his edicts on stone pillars. These orders, which spread his message of peace, could be read across the empire. Later, monks and merchants carried Buddhism along the Silk Road into China. Eventually, an idea that began in one war's aftermath reached people thousands of miles away.",
  },
  mpo: {
    thesis: "Ashoka's story has a clear turning point: the Kalinga War changed him from a conqueror into a ruler of peace, and his ideas later traveled across Asia.",
    paragraphs: [
      { topic: "Before the turning point, Ashoka fought to grow his empire.", notes: ["Maurya emperor", "wars to expand", "bigger empire = more power"] },
      { topic: "The Kalinga War was the turning point.", notes: ["Kalinga War, many died", "deep regret", "chooses peace + Buddhism"] },
      { topic: "After the turning point, his ideas spread far away.", notes: ["edicts on stone pillars", "monks + merchants carry Buddhism", "Silk Road → China"] },
    ],
    conclusion: "Because one war changed Ashoka's choices, a message of peace spread from India across the Silk Road to people thousands of miles away.",
  },
  revise: [
    "Did I tell the events in the order they happened, using time words?",
    "Did I show clearly which moment was the turning point and what changed?",
    "Did I use past-tense verbs such as fought, carved and carried?",
    "Did I end with a result that comes from the turning point?",
  ],
};
