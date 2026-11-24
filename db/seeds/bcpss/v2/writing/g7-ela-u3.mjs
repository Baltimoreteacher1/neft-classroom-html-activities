// BCPSS Writing Lab (TWR) — g7-ela-u3 · Language and Power. Contract: ../writing-schema.mjs

export default {
  title: "Words That Win Power",
  genre: "argue",
  tip: "Have students say the other side's best point out loud first, then pivot with however before they write any evidence.",
  lessons: [
    { id: "A", title: "Animal Farm as an allegory" },
    { id: "B", title: "Slogans and the power of repeated words" },
    { id: "C", title: "Squealer, propaganda, and the changing rules" },
    { id: "D", title: "Reading carefully to push back" },
  ],
  source: {
    title: "How the Pigs Use Words",
    lesson: "C",
    text: "In Animal Farm, the animals chase out the farmer and hope to run the farm fairly. Soon the pigs take charge. Squealer, a pig with a smooth voice, explains every unpopular decision. When the animals ask hard questions, Squealer says that Napoleon is working for their good. The sheep chant a slogan, \"Four legs good, two legs bad,\" until nobody else can speak. Slowly, the pigs change the rules painted on the barn wall. By the end, the wall says that some animals are more equal than others. Orwell wrote the book as an allegory, so readers can see how leaders use words to keep power.",
  },
  notes: [
    { sentence: "Squealer, a pig with a smooth voice, explains every unpopular decision.", note: "Squealer = smooth voice, explains choices" },
    { sentence: "The sheep chant a slogan until nobody else can speak.", note: "sheep chant slogan → no one speaks" },
    { sentence: "Slowly, the pigs change the rules painted on the barn wall.", note: "pigs change barn-wall rules" },
    { sentence: "Orwell wrote the book as an allegory, so readers can see how leaders use words to keep power.", note: "allegory → leaders' words = power" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Orwell wrote Animal Farm as an allegory",
      because: "he wanted readers to see how real leaders use words.",
      but: "the characters in the story are animals, not people.",
      so: "readers can spot the same tricks in real speeches.",
    },
    {
      lesson: "B",
      kernel: "The sheep repeat their slogan again and again",
      because: "chanting drowns out anyone who asks a hard question.",
      but: "the slogan sounds harmless when you first hear it.",
      so: "the animals stop debating the leaders' plans.",
    },
    {
      lesson: "C",
      kernel: "Squealer explains each new rule",
      because: "the pigs need the animals to accept every change.",
      but: "the animals remember the old rule differently.",
      so: "the animals start to doubt their own memories.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The sheep chanted.",
      parts: { when: "whenever an animal asked a question", where: "in the barn", how: "loudly and together", why: "to drown out the debate" },
      model: "Whenever an animal asked a question, the sheep chanted loudly and together in the barn to drown out the debate.",
    },
    {
      lesson: "C",
      kernel: "Squealer spoke.",
      parts: { when: "after every unpopular decision", where: "to the crowd in the yard", how: "in a smooth, friendly voice", why: "so the animals would trust Napoleon" },
      model: "After every unpopular decision, Squealer spoke to the crowd in the yard in a smooth, friendly voice so the animals would trust Napoleon.",
    },
  ],
  fragments: [
    { text: "Propaganda is a one-sided message that changes what people think.", is_sentence: true },
    { text: "Which the sheep chanted again and again.", is_sentence: false, fix: "The slogan, which the sheep chanted again and again, ended every debate." },
    { text: "Although some readers think the sheep are only funny.", is_sentence: false, fix: "Although some readers think the sheep are only funny, they actually silence the debate." },
    { text: "Squealer twists the words of the commandments.", is_sentence: true },
    { text: "Because careful readers ask who benefits.", is_sentence: false, fix: "Careful readers question a message because they ask who benefits." },
    { text: "Orwell uses animals to stand for real leaders.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Animal Farm, ___, uses animals to stand for real people and ideas.",
      noun: "Animal Farm",
      options: ["an allegory by George Orwell", "a slogan the sheep chant", "a rule painted on the barn wall"],
      answer: 0,
      model: "Animal Farm, an allegory by George Orwell, uses animals to stand for real people and ideas.",
    },
    {
      lesson: "C",
      sentence: "Squealer, ___, explains every unpopular decision.",
      noun: "Squealer",
      options: ["a chant about legs", "a pig with a smooth voice", "a farmer who owns the land"],
      answer: 1,
      model: "Squealer, a pig with a smooth voice, explains every unpopular decision.",
    },
    {
      lesson: "D",
      sentence: "Propaganda, ___, can make people stop asking questions.",
      noun: "Propaganda",
      options: ["a rule painted on the barn wall", "a farm where animals share the work", "a one-sided message from a leader"],
      answer: 2,
      model: "Propaganda, a one-sided message from a leader, can make people stop asking questions.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "although", stem: "readers can learn real lessons from the story", model: "Although the characters are animals, readers can learn real lessons from the story." },
    { lesson: "B", conjunction: "whenever", stem: "the sheep start to chant", model: "Whenever an animal asks a hard question, the sheep start to chant." },
    { lesson: "D", conjunction: "unless", stem: "leaders can keep control by repeating slogans", model: "Unless readers ask questions, leaders can keep control by repeating slogans." },
  ],
  spo: {
    topic: {
      l1_2: "Slogans are [not harmless] because they [stop questions].",
      l3_4: "Although some people say a slogan is harmless, I believe [slogans can control people] because [they stop questions].",
      l5_6: "Although some readers argue that [a slogan is only a catchy phrase], [Orwell's allegory] shows that [repeated slogans] can [manipulate a crowd] by [drowning out questions].",
    },
    starters: [
      { type: "question", text: "Can a few catchy words really control a whole farm full of animals?" },
      { type: "appositive", text: "Squealer, the smooth-talking pig, proves that words can be powerful tools." },
      { type: "subordinate", text: "Although a slogan seems harmless, it can silence a whole crowd." },
    ],
    details: [
      { note: "other side: slogan = just a catchy phrase", lesson: "B" },
      { note: "sheep chant → no one can speak", lesson: "B" },
      { note: "Squealer's smooth words explain every change", lesson: "C" },
      { note: "pigs change rules on barn wall", lesson: "C" },
      { note: "allegory: animals = real leaders", lesson: "A" },
      { note: "ask who benefits → push back", lesson: "D" },
    ],
    distractors: ["the animals build a windmill", "the farm has a red barn"],
    conclusion: {
      l1_2: "Slogans can [hide] the [truth].",
      l3_4: "Therefore, a catchy slogan is not harmless, because it can [stop people] from [asking questions].",
      l5_6: "Although slogans seem small, [Orwell's allegory] proves that a leader who controls language can control [what people believe], unless readers [ask who benefits].",
    },
  },
  prompt: {
    l1_2: "Draw the sheep. Write 3 sentences. Tell if a slogan can be harmless. Use the word because.",
    l3_4: "Some people say a slogan is harmless because it is only a few words. Write a paragraph that answers them. Use Animal Farm as your evidence.",
    l5_6: "Write a paragraph that admits what the other side says about slogans, pivots with however, and rebuts it with evidence from Animal Farm. Include an appositive and a sentence that starts with although or unless.",
  },
  transitions: ["Although", "Some argue that", "However,", "For example,", "This shows that", "Even though", "Therefore,", "In the end,"],
  model: {
    l1_2: "Slogans are not harmless. The sheep chant a slogan, so nobody can ask a question. That is how leaders keep power.",
    l3_4: "Although some people say a slogan is harmless, I believe slogans can control people because they stop questions. In Animal Farm, the sheep chant a slogan whenever an animal asks a hard question. The chant drowns out the debate, so nobody can think. Then Squealer uses smooth words to explain each unpopular change. However, the pigs never answer the hard questions. Therefore, a catchy slogan is a tool that leaders use to keep power.",
    l5_6: "Although some readers argue that a slogan is only a catchy phrase, Orwell's allegory shows that repeated slogans can manipulate a crowd. The sheep chant \"Four legs good, two legs bad\" whenever an animal asks a hard question. As a result, the chant drowns out the debate before anyone can speak. Squealer, a pig with a smooth voice, then explains each unpopular decision so the animals trust Napoleon. However, the pigs never answer the real questions. Slowly, they even change the rules painted on the barn wall. These events show that words can hide the truth. Unless readers ask who benefits from a message, leaders who control language can control what people believe.",
  },
  mpo: {
    thesis: "Although some readers think a slogan is harmless, Animal Farm shows that repeated slogans and smooth words let leaders control what people believe.",
    paragraphs: [
      { topic: "The other side says a slogan is only a catchy phrase, and it is true that slogans are short and easy to remember.", notes: ["slogan = short, catchy", "sheep chant is funny at first"] },
      { topic: "The sheep's chant shows that a slogan can end a debate.", notes: ["chant whenever hard question", "no one can speak", "leaders avoid answers"] },
      { topic: "Squealer and the changing barn-wall rules show how language builds power.", notes: ["Squealer's smooth voice", "pigs change rules", "animals doubt memories", "ask who benefits → push back"] },
    ],
    conclusion: "A slogan may sound harmless, but Orwell's allegory teaches careful readers to ask who benefits from the words they hear.",
  },
  revise: [
    "Did I state the other side's point fairly before I answered it?",
    "Did I pivot with however, yet, or although and then give a reason?",
    "Did I use a real detail from Animal Farm, such as the sheep's chant or Squealer's speeches, as evidence?",
    "Did I explain how the evidence proves my claim instead of only retelling the story?",
  ],
};
