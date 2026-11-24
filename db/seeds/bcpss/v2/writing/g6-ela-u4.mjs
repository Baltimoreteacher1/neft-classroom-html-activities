// BCPSS Writing Lab (TWR) — g6-ela-u4 · Courage in Crisis. Contract: ../writing-schema.mjs

export default {
  title: "Prove Shackleton Showed Courage",
  genre: "argue",
  tip: "Have students label each sentence in their draft as claim, evidence or reasoning with three colors before revising.",
  lessons: [
    { id: "A", title: "Shackleton and the Endurance expedition" },
    { id: "B", title: "Malala's advocacy for girls' education" },
    { id: "C", title: "Stating a claim and finding evidence" },
    { id: "D", title: "Explaining how evidence proves a claim" },
  ],
  source: {
    title: "Trapped in the Ice",
    lesson: "A",
    text: "In 1915, ice crushed the ship Endurance in the Weddell Sea near Antarctica. Ernest Shackleton and his crew camped on the ice for months. Later, they sailed small boats to Elephant Island. Shackleton and five others then crossed 800 miles of stormy ocean in a small boat to find help. Every man in the crew survived. Many readers say Shackleton showed courage. A strong writer makes a claim, gives evidence from the text, and explains how the evidence proves the claim. For example, the 800-mile voyage is evidence of perseverance because Shackleton did not give up.",
  },
  notes: [
    { sentence: "Shackleton and five others then crossed 800 miles of stormy ocean in a small boat to find help.", note: "S + 5 men → 800 miles, small boat" },
    { sentence: "Every man in the crew survived.", note: "all crew survived" },
    { sentence: "A strong writer makes a claim, gives evidence from the text, and explains how the evidence proves the claim.", note: "claim + evidence + reasoning" },
    { sentence: "For example, the 800-mile voyage is evidence of perseverance because Shackleton did not give up.", note: "800 miles = evidence of perseverance" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Shackleton showed courage",
      because: "he crossed 800 miles of stormy ocean in a small boat to find help.",
      but: "the voyage could have cost him his life.",
      so: "every man in his crew survived.",
    },
    {
      lesson: "B",
      kernel: "Malala showed courage",
      because: "she spoke out for girls' education even though it was dangerous.",
      but: "she was only a student, not a government leader.",
      so: "people around the world listened to her message.",
    },
    {
      lesson: "C",
      kernel: "A claim needs evidence",
      because: "readers will not trust a statement that has no proof.",
      but: "evidence alone does not finish the argument.",
      so: "a strong writer also explains how the evidence proves the claim.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Shackleton sailed.",
      parts: { when: "After the ice crushed the Endurance", where: "across the stormy ocean", how: "in a small boat" },
      model: "After the ice crushed the Endurance, Shackleton sailed in a small boat across the stormy ocean.",
    },
    {
      lesson: "B",
      kernel: "Malala spoke.",
      parts: { when: "At age eleven", how: "with a blog and public speeches", why: "to protect the right of girls to go to school" },
      model: "At age eleven, Malala spoke with a blog and public speeches to protect the right of girls to go to school.",
    },
  ],
  fragments: [
    { text: "A claim is a statement that needs proof.", is_sentence: true },
    { text: "Because Shackleton did not give up.", is_sentence: false, fix: "Shackleton showed perseverance because he did not give up." },
    { text: "Crossed 800 miles of stormy ocean.", is_sentence: false, fix: "Shackleton and five others crossed 800 miles of stormy ocean." },
    { text: "Evidence comes from facts and details in a text.", is_sentence: true },
    { text: "According to the text.", is_sentence: false, fix: "According to the text, every man in the crew survived." },
    { text: "Malala wrote a blog about girls' education.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Shackleton, ___, led his crew across the ice.",
      noun: "Shackleton",
      options: ["an explorer of Antarctica", "a girl from the Swat Valley", "a statement that needs proof"],
      answer: 0,
      model: "Shackleton, an explorer of Antarctica, led his crew across the ice.",
    },
    {
      lesson: "B",
      sentence: "Malala Yousafzai, ___, spoke out for girls' education.",
      noun: "Malala Yousafzai",
      options: ["a student from the Swat Valley in Pakistan", "a ship crushed by ice", "a trip made for exploring"],
      answer: 0,
      model: "Malala Yousafzai, a student from the Swat Valley in Pakistan, spoke out for girls' education.",
    },
    {
      lesson: "C",
      sentence: "Evidence, ___, helps prove a claim.",
      noun: "Evidence",
      options: ["facts and details from a text", "the thinking that explains the proof", "a statement that something is true"],
      answer: 0,
      model: "Evidence, facts and details from a text, helps prove a claim.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the crew had to camp on the ice", model: "Because the ice crushed the Endurance, the crew had to camp on the ice." },
    { lesson: "B", conjunction: "although", stem: "she kept speaking for girls' education", model: "Although Malala was in danger, she kept speaking for girls' education." },
    { lesson: "D", conjunction: "since", stem: "his action proves courage", model: "Since Shackleton risked his life to save others, his action proves courage." },
  ],
  spo: {
    topic: {
      l1_2: "I think [Shackleton] showed [courage].",
      l3_4: "I claim that [Shackleton] showed courage because [he crossed 800 miles of stormy ocean to save his crew].",
      l5_6: "Although [the odds were against him], [Shackleton] showed courage, as shown by [the 800-mile voyage], because [he risked his life to save every man].",
    },
    starters: [
      { type: "question", text: "What does it take to cross 800 miles of freezing ocean in a small boat?" },
      { type: "appositive", text: "Ernest Shackleton, an explorer whose ship was crushed by ice, proved his courage with one risky voyage." },
      { type: "subordinate", text: "Although the ice destroyed his ship, Shackleton never gave up on his crew." },
    ],
    details: [
      { note: "ice crushed Endurance, 1915", lesson: "A" },
      { note: "crew camped on ice for months", lesson: "A" },
      { note: "small boats → Elephant Island", lesson: "A" },
      { note: "Shackleton + 5 men sail 800 miles", lesson: "A" },
      { note: "all crew survived", lesson: "A" },
      { note: "evidence → proves perseverance = courage", lesson: "D" },
    ],
    distractors: ["Antarctica has penguins and seals", "Malala wrote a blog as a student"],
    conclusion: {
      l1_2: "Shackleton was [brave] and [kept going].",
      l3_4: "This shows courage because [he risked his life] to save his [crew].",
      l5_6: "Therefore, Shackleton's actions prove that courage means [doing something hard because it matters].",
    },
  },
  prompt: {
    l1_2: "Draw Shackleton's small boat on a stormy sea. Write 3-4 sentences about why he showed courage. Use the words claim, boat, and crew.",
    l3_4: "Write a paragraph that argues Shackleton showed courage. Use your outline, a claim, evidence from the text, and because.",
    l5_6: "Write a paragraph that argues Shackleton showed courage, gives evidence with according to, and explains how the evidence proves the claim. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["I claim", "According to the text,", "For example,", "As shown by", "Because", "This shows", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "Ice crushed Shackleton's ship. He sailed a small boat across a stormy ocean. He found help for his crew. I think he showed courage.",
    l3_4: "I claim that Shackleton showed courage. According to the text, ice crushed his ship, the Endurance, in 1915. Shackleton and five others then crossed 800 miles of stormy ocean in a small boat to find help. This shows courage because he risked his life to save his crew. As a result, every man in the crew survived.",
    l5_6: "Although the odds were against him, Ernest Shackleton, an explorer in Antarctica, showed great courage. In 1915, ice crushed his ship, the Endurance, and his crew camped on the ice for months. According to the text, Shackleton and five others then crossed 800 miles of stormy ocean in a small boat. This voyage is evidence of perseverance because he did not give up. Since he risked his life to find help, the voyage also proves courage. As shown by the fact that every man survived, his plan worked. Therefore, Shackleton's actions prove that courage means doing something hard because it matters.",
  },
  mpo: {
    thesis: "Shackleton showed courage in a crisis, as shown by his 800-mile voyage and the survival of his whole crew.",
    paragraphs: [
      { topic: "The crisis left the crew trapped in Antarctica.", notes: ["ice crushed Endurance 1915", "crew camped on ice", "small boats → Elephant Island"] },
      { topic: "Shackleton's courageous action was the voyage for help.", notes: ["Shackleton + 5 men", "800 miles of stormy ocean", "risked life to find help"] },
      { topic: "The result proves the claim of courage.", notes: ["all crew survived", "perseverance = no giving up", "reasoning: risk + goal = courage"] },
    ],
    conclusion: "Because Shackleton risked his life for his crew and every man survived, the evidence proves that he showed courage in a crisis.",
  },
  revise: [
    "Did I state a clear claim about courage before giving proof?",
    "Did I include evidence from the text, such as the 800 miles or that every man survived?",
    "Did I use a phrase such as according to the text to introduce the evidence?",
    "Did I explain how the evidence proves courage, not only list it?",
  ],
};
