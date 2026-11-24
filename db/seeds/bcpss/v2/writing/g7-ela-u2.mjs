// BCPSS Writing Lab (TWR) — g7-ela-u2 · Americans All. Contract: ../writing-schema.mjs

export default {
  title: "Two Stories, One War",
  genre: "inform",
  tip: "Build a two-column chart of shared and different details first, then let students pick one pair of details for whereas and one for both.",
  lessons: [
    { id: "A", title: "Navajo Code Talkers and the unbroken code" },
    { id: "B", title: "Executive Order 9066 and the move to camps" },
    { id: "C", title: "Daily life at Manzanar in Farewell to Manzanar" },
    { id: "D", title: "Loyalty and citizenship: comparing two stories" },
  ],
  source: {
    title: "Loyal Americans, Different Treatment",
    lesson: "D",
    text: "In 1942, two groups of Americans faced the same war in different ways. Hundreds of Navajo men joined the Marines. They used the Navajo language to send secret radio messages, and the enemy never broke the code. That same year, the government ordered about 120,000 people of Japanese ancestry to leave the West Coast. Many were American citizens. Jeanne Wakatsuki and her family were sent to Manzanar, a camp in the California desert. They lived in crowded barracks behind barbed wire. Yet many Japanese American men still served in the army, and the Navajo Marines were proud of their own service. Both groups showed loyalty, but their country treated them in very different ways.",
  },
  notes: [
    { sentence: "They used the Navajo language to send secret radio messages, and the enemy never broke the code.", note: "Navajo language = secret code; never broken" },
    { sentence: "That same year, the government ordered about 120,000 people of Japanese ancestry to leave the West Coast.", note: "1942: govt → ~120,000 Japanese Americans leave coast" },
    { sentence: "They lived in crowded barracks behind barbed wire.", note: "Manzanar = crowded barracks + barbed wire" },
    { sentence: "Both groups showed loyalty, but their country treated them in very different ways.", note: "both = loyal; treatment ≠" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The Navajo Marines used their own language as a code",
      because: "few people outside the Navajo Nation could speak it.",
      but: "schools had once punished Navajo children for speaking it.",
      so: "the Marines could send secret radio messages quickly.",
    },
    {
      lesson: "B",
      kernel: "The government sent families to camps",
      because: "leaders feared, without proof, that some might help Japan.",
      but: "most of the families had done nothing wrong.",
      so: "they lost their homes, farms, and businesses.",
    },
    {
      lesson: "C",
      kernel: "Families at Manzanar tried to make the camp feel like home",
      because: "they wanted their children to feel safe.",
      but: "the barracks were crowded and the walls were thin.",
      so: "they planted gardens and started schools and sports teams.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The Code Talkers sent messages.",
      parts: { when: "during battles in the Pacific", how: "over the radio in Navajo", why: "so the enemy could not understand them" },
      model: "During battles in the Pacific, the Code Talkers sent messages over the radio in Navajo so the enemy could not understand them.",
    },
    {
      lesson: "C",
      kernel: "Families lived in barracks.",
      parts: { when: "during the war", where: "at Manzanar in the California desert", how: "behind barbed wire", why: "after the government ordered them to leave home" },
      model: "During the war, families lived in barracks at Manzanar in the California desert, behind barbed wire, after the government ordered them to leave home.",
    },
  ],
  fragments: [
    { text: "The Code Talkers served in uniform.", is_sentence: true },
    { text: "Whereas the families were held behind barbed wire.", is_sentence: false, fix: "The Code Talkers served in uniform, whereas the families were held behind barbed wire." },
    { text: "Sent secret messages in Navajo.", is_sentence: false, fix: "The Code Talkers sent secret messages in Navajo." },
    { text: "Many families at Manzanar were American citizens.", is_sentence: true },
    { text: "Because they were treated unfairly.", is_sentence: false, fix: "Many families felt hurt because they were treated unfairly." },
    { text: "Both groups showed loyalty to the United States.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Navajo, ___, was the language of the secret code.",
      noun: "Navajo",
      options: ["a language spoken on the Navajo Nation", "a camp in the California desert", "a Japanese American army unit"],
      answer: 0,
      model: "Navajo, a language spoken on the Navajo Nation, was the language of the secret code.",
    },
    {
      lesson: "C",
      sentence: "Manzanar, ___, held thousands of people behind barbed wire.",
      noun: "Manzanar",
      options: ["a secret radio code", "a group of Marines", "a camp in the California desert"],
      answer: 2,
      model: "Manzanar, a camp in the California desert, held thousands of people behind barbed wire.",
    },
    {
      lesson: "B",
      sentence: "Jeanne Wakatsuki, ___, later wrote about her family's years in the camp.",
      noun: "Jeanne Wakatsuki",
      options: ["a Marine who sent radio messages", "a girl sent to Manzanar with her family", "the leader who signed the order"],
      answer: 1,
      model: "Jeanne Wakatsuki, a girl sent to Manzanar with her family, later wrote about her family's years in the camp.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "while", stem: "the Code Talkers served in uniform", model: "While families waited behind barbed wire, the Code Talkers served in uniform." },
    { lesson: "B", conjunction: "although", stem: "the families were sent to camps", model: "Although many of the families were loyal citizens, they were sent to camps." },
    { lesson: "A", conjunction: "because", stem: "the enemy never broke the code", model: "Because the code used the Navajo language, the enemy never broke the code." },
  ],
  spo: {
    topic: {
      l1_2: "The [Code Talkers] and the [families] were both [loyal], but they were [treated differently].",
      l3_4: "Both the Navajo Code Talkers and the Japanese American families at Manzanar showed [loyalty], whereas their [treatment] was very different.",
      l5_6: "Although [the Code Talkers] and [the Manzanar families] both showed [loyalty] during World War II, [their country] treated them in [very different ways].",
    },
    starters: [
      { type: "question", text: "How can two groups of Americans be equally loyal and still be treated so differently?" },
      { type: "appositive", text: "The Navajo Code Talkers, Marines who sent secret messages, showed loyalty in one way during World War II." },
      { type: "subordinate", text: "While the Code Talkers served in uniform, the families at Manzanar waited behind barbed wire." },
    ],
    details: [
      { note: "Code Talkers = Navajo Marines, secret code", lesson: "A" },
      { note: "enemy never broke the code", lesson: "A" },
      { note: "1942: about 120,000 sent to camps", lesson: "B" },
      { note: "many families = citizens, lost homes", lesson: "B" },
      { note: "Manzanar: barracks, barbed wire, desert", lesson: "C" },
      { note: "both groups = loyal, proud of service", lesson: "D" },
    ],
    distractors: ["the war ended in 1945", "Marines train at boot camp"],
    conclusion: {
      l1_2: "Both groups were [loyal], but only the [families] lost their [freedom].",
      l3_4: "Both groups showed [loyalty], but the [Code Talkers] and the [families] were treated [differently].",
      l5_6: "Although both groups [proved their loyalty], their [different treatment] shows that [civil liberties] did not protect every citizen the same way.",
    },
  },
  prompt: {
    l1_2: "Draw the Code Talkers and the families at Manzanar. Write 3 sentences. Tell one way they are alike and one way they are different.",
    l3_4: "Write a paragraph that compares the Navajo Code Talkers and the Japanese American families at Manzanar. Use both and whereas, and tell what is the same and what is different.",
    l5_6: "Write a paragraph that compares how the Code Talkers and the Manzanar families showed loyalty during World War II and how each group was treated. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Similarly,", "In the same way,", "However,", "In contrast,", "Whereas", "On the other hand,", "While"],
  model: {
    l1_2: "The Code Talkers were Navajo Marines. The families at Manzanar lived behind a fence. Both groups were loyal, but they were treated in different ways.",
    l3_4: "Both the Navajo Code Talkers and the Japanese American families at Manzanar showed loyalty, whereas their treatment was very different. The Code Talkers were Marines who sent secret messages in Navajo. The enemy never broke their code. In contrast, the families lived in crowded barracks behind barbed wire, even though many were citizens. Both groups loved their country. However, the Code Talkers were trusted to serve as Marines, while the families lost their homes and freedom.",
    l5_6: "Although the Navajo Code Talkers and the Japanese American families at Manzanar both showed loyalty during World War II, their country treated them in very different ways. The Code Talkers, Marines who spoke Navajo, sent secret radio messages that the enemy never broke. Meanwhile, the families at Manzanar, a camp in the California desert, lived in crowded barracks behind barbed wire. Many of these families were American citizens. In contrast to the Marines, they lost their homes and their freedom. While the Code Talkers served in uniform, young men from the camps also served in the army. Both groups proved that loyalty can be shown in many ways. Their stories also show that civil liberties did not protect every citizen the same way.",
  },
  mpo: {
    thesis: "The Navajo Code Talkers and the Japanese American families at Manzanar both showed loyalty to the United States, but the government treated the two groups in very different ways.",
    paragraphs: [
      { topic: "The Navajo Code Talkers showed loyalty by serving as Marines and using their language as a code.", notes: ["Navajo Marines", "secret radio messages in Navajo", "enemy never broke code"] },
      { topic: "The Manzanar families showed loyalty even after they lost their homes and freedom.", notes: ["1942: ~120,000 sent to camps", "many = citizens", "barracks + barbed wire", "gardens, schools, sons in army"] },
      { topic: "The two groups were alike in loyalty but different in how the country treated them.", notes: ["both = loyal, proud", "Code Talkers = trusted, in uniform", "families = lost civil liberties"] },
    ],
    conclusion: "Comparing the two groups shows that loyalty and courage were shared, while fair treatment under the law was not.",
  },
  revise: [
    "Did I name one thing the two groups share and one real difference, with a detail for each?",
    "Did I use both, whereas, while, or in contrast so the comparison is clear?",
    "Did I give facts, such as Navajo as a code or barbed wire at Manzanar, instead of only opinions?",
    "Did I treat both groups with respect and tell the facts plainly?",
  ],
};
