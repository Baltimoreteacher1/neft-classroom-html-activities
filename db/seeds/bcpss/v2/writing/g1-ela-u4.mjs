// BCPSS Writing Lab (TWR) — g1-ela-u4 · Cinderella Stories. Contract: ../writing-schema.mjs

export default {
  title: "Two Girls, Two Stories",
  genre: "inform",
  tip: "Put two story pictures side by side and have students point to one alike and one different thing before writing both and but.",
  lessons: [
    { id: "A", title: "Cinderella from France" },
    { id: "B", title: "Ye Xian from China" },
    { id: "C", title: "How two versions are alike and different" },
    { id: "D", title: "Admirable traits: kind and brave" },
  ],
  source: {
    title: "Two Girls, Two Shoes",
    lesson: "C",
    text: "Two stories tell about a kind girl. In France, Cinderella has a fairy helper. In China, Ye Xian has a fish helper. Both girls are kind. Both stories have a lost shoe. The helpers are different. The shoes are different too. Cinderella's shoe is glass, but Ye Xian's shoe is gold.",
  },
  notes: [
    { sentence: "In France, Cinderella has a fairy helper.", note: "France: fairy helper" },
    { sentence: "In China, Ye Xian has a fish helper.", note: "China: fish helper" },
    { sentence: "Both stories have a lost shoe.", note: "both = lost shoe" },
    { sentence: "Cinderella's shoe is glass, but Ye Xian's shoe is gold.", note: "glass vs gold shoe" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Both stories have a kind girl",
      because: "each girl is nice to other people.",
      but: "the helpers are different.",
      so: "we can compare the two stories.",
    },
    {
      lesson: "A",
      kernel: "Cinderella's shoe is glass",
      because: "the fairy makes it for her.",
      but: "the other girl's shoe is gold.",
      so: "the two shoes are different.",
    },
    {
      lesson: "D",
      kernel: "Ye Xian is admirable",
      because: "she stays kind when people are unkind.",
      but: "she feels sad sometimes.",
      so: "readers want her story to end well.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The fairy helps.",
      parts: { when: "at night", where: "in France", why: "so Cinderella can go to the ball" },
      model: "At night, the fairy helps Cinderella in France so she can go to the ball.",
    },
    {
      lesson: "B",
      kernel: "The fish helps.",
      parts: { where: "in China", how: "with a gown and gold shoes", why: "so Ye Xian can go to the festival" },
      model: "In China, the fish helps Ye Xian with a gown and gold shoes so she can go to the festival.",
    },
  ],
  fragments: [
    { text: "Both stories have a kind girl.", is_sentence: true },
    { text: "Different helpers.", is_sentence: false, fix: "The helpers are different." },
    { text: "A fairy helps Cinderella.", is_sentence: true },
    { text: "Because both girls are kind.", is_sentence: false, fix: "Both girls are admirable because both girls are kind." },
    { text: "A fish with a gown and gold shoes.", is_sentence: false, fix: "A fish gives Ye Xian a gown and gold shoes." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Cinderella, ___, has a fairy helper.",
      noun: "Cinderella",
      options: ["a kind girl in a French story", "a fish from a Chinese story", "a gold shoe"],
      answer: 0,
      model: "Cinderella, a kind girl in a French story, has a fairy helper.",
    },
    {
      lesson: "B",
      sentence: "Ye Xian, ___, has a fish helper.",
      noun: "Ye Xian",
      options: ["a fairy with a wand", "a kind girl in a Chinese story", "a glass slipper"],
      answer: 1,
      model: "Ye Xian, a kind girl in a Chinese story, has a fish helper.",
    },
    {
      lesson: "D",
      sentence: "A trait, ___, is something like kind or brave.",
      noun: "A trait",
      options: ["the shoe a girl loses", "a country far away", "a way a person acts"],
      answer: 2,
      model: "A trait, a way a person acts, is something like kind or brave.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "although", stem: "the two stories are alike", model: "Although the helpers are different, the two stories are alike." },
    { lesson: "D", conjunction: "because", stem: "both girls are admirable", model: "Because both girls stay kind, both girls are admirable." },
    { lesson: "A", conjunction: "when", stem: "Cinderella loses a shoe", model: "When the ball ends, Cinderella loses a shoe." },
  ],
  spo: {
    topic: {
      l1_2: "Both stories have a [kind girl]. The [helpers] are [different].",
      l3_4: "Both [Cinderella] and [Ye Xian] are [kind girls], but their [helpers] are different.",
      l5_6: "Although [the French and Chinese stories] have different helpers, both girls are [admirable] because [they stay kind].",
    },
    starters: [
      { type: "question", text: "How are two Cinderella stories alike and different?" },
      { type: "statement", text: "Both stories have a kind girl and a lost shoe." },
      { type: "subordinate", text: "Although the helpers are different, the girls are alike." },
    ],
    details: [
      { note: "France: Cinderella + fairy", lesson: "A" },
      { note: "China: Ye Xian + fish", lesson: "B" },
      { note: "both girls kind", lesson: "D" },
      { note: "both lose a shoe", lesson: "C" },
      { note: "glass shoe vs gold shoe", lesson: "C" },
      { note: "admirable = kind, brave", lesson: "D" },
    ],
    distractors: ["France has a tall tower", "fish live in rivers"],
    conclusion: {
      l1_2: "Both [girls] are [kind].",
      l3_4: "So the stories are [alike and different]. Both girls are [kind].",
      l5_6: "Because [both girls stay kind], both are [admirable], even though [their helpers are different].",
    },
  },
  prompt: {
    l1_2: "Draw both girls. Write 1-3 sentences. Tell one way the stories are alike. Tell one way they are different.",
    l3_4: "Compare Cinderella and Ye Xian. Tell how the stories are alike and different. Use the words both and but.",
    l5_6: "Compare the French and Chinese stories. Tell how they are alike, how they are different, and which girl is admirable. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Both", "Also,", "But", "However,", "In France,", "In China,", "Because", "In the end,"],
  model: {
    l1_2: "Both stories have a kind girl. One has a fairy. One has a fish.",
    l3_4: "Both Cinderella and Ye Xian are kind girls. In France, a fairy helps, but in China, a fish helps. Both stories have a lost shoe. So the stories are alike and different.",
    l5_6: "Although the helpers are different, both stories have a kind girl. Cinderella, a girl in a French story, gets help from a fairy. Ye Xian, a girl in a Chinese story, gets help from a fish. Because both girls stay kind, both are admirable.",
  },
  revise: [
    "Did I tell one way the stories are alike?",
    "Did I tell one way they are different?",
    "Did I use both and but?",
    "Did I name the helper in each story?",
  ],
};
