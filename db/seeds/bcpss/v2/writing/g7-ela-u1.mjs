// BCPSS Writing Lab (TWR) — g7-ela-u1 · Identity in the Middle Ages. Contract: ../writing-schema.mjs

export default {
  title: "One Day, Two Views",
  genre: "narrate",
  tip: "Have students say each character's feeling aloud before writing, so the perspective comes from rank and motive instead of from plot summary.",
  lessons: [
    { id: "A", title: "Castle Diary: a day in a noble household" },
    { id: "B", title: "The ladder of rank: nobles, serfs, and guilds" },
    { id: "C", title: "Pilgrims on the road to Canterbury" },
    { id: "D", title: "The Midwife's Apprentice and a path to a trade" },
  ],
  source: {
    title: "The Field and the Castle",
    lesson: "B",
    text: "Hild was a serf girl who lived in a small village beside a castle. Each morning, she walked to the lord's field before the sun was up. She pulled weeds and tied bundles of grain until her hands ached. The lord kept a share of everything she grew, and Hild could not leave the village without his permission. Inside the castle, a boy named Osric trained to be a knight. He practiced with a wooden sword and ate meat every day. Osric thought his life was hard because his master shouted at him. Hild would have traded places in a moment, but she knew that rank, not effort, decided who learned to fight.",
  },
  notes: [
    { sentence: "Each morning, she walked to the lord's field before the sun was up.", note: "Hild → lord's field @ dawn" },
    { sentence: "The lord kept a share of everything she grew, and Hild could not leave the village without his permission.", note: "lord keeps share; no leaving w/o OK" },
    { sentence: "Inside the castle, a boy named Osric trained to be a knight.", note: "Osric @ castle → knight training" },
    { sentence: "Hild would have traded places in a moment, but she knew that rank, not effort, decided who learned to fight.", note: "rank (not effort) = who learns to fight" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Hild worked hard in the lord's field",
      because: "her family needed grain to eat through the winter.",
      but: "the lord still took a share of the harvest.",
      so: "her hands ached before the sun was high.",
    },
    {
      lesson: "A",
      kernel: "Osric trained to be a knight",
      because: "his father was a noble who owned land.",
      but: "his master shouted at him every day.",
      so: "he learned to ride and fight at a young age.",
    },
    {
      lesson: "D",
      kernel: "Alyce wanted to become a midwife's apprentice",
      because: "a trade would give her food, a bed, and a place in the village.",
      but: "she had no family to speak up for her.",
      so: "she kept asking until the midwife let her stay.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Hild pulled weeds.",
      parts: { when: "before the sun rose", where: "in the lord's field", how: "with aching hands", why: "so her family could eat" },
      model: "Before the sun rose, Hild pulled weeds in the lord's field with aching hands so her family could eat.",
    },
    {
      lesson: "C",
      kernel: "The pilgrims rode.",
      parts: { when: "every spring", where: "along the road to Canterbury", how: "in a noisy group", why: "to visit a holy shrine" },
      model: "Every spring, the pilgrims rode along the road to Canterbury in a noisy group to visit a holy shrine.",
    },
  ],
  fragments: [
    { text: "Hild was a serf who could not leave the village.", is_sentence: true },
    { text: "Because the lord owned the land.", is_sentence: false, fix: "Hild needed permission to leave because the lord owned the land." },
    { text: "Worked for seven years as an apprentice.", is_sentence: false, fix: "Mara worked for seven years as an apprentice." },
    { text: "The guild set rules for every baker in town.", is_sentence: true },
    { text: "Although the knight wanted honor.", is_sentence: false, fix: "Although the knight wanted honor, the miller wanted to escape his debts." },
    { text: "Each pilgrim told a story on the long road.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Hild, ___, pulled weeds in the lord's field.",
      noun: "Hild",
      options: ["a serf girl who could not leave her village", "a guild of skilled weavers", "a holy shrine in Canterbury"],
      answer: 0,
      model: "Hild, a serf girl who could not leave her village, pulled weeds in the lord's field.",
    },
    {
      lesson: "A",
      sentence: "Osric, ___, practiced with a wooden sword.",
      noun: "Osric",
      options: ["a long road to a shrine", "a boy training to be a knight", "a rule set by the guild"],
      answer: 1,
      model: "Osric, a boy training to be a knight, practiced with a wooden sword.",
    },
    {
      lesson: "C",
      sentence: "Canterbury, ___, was the goal of the pilgrims.",
      noun: "Canterbury",
      options: ["a group of workers in one trade", "a young servant in the castle", "a city with a famous holy shrine"],
      answer: 2,
      model: "Canterbury, a city with a famous holy shrine, was the goal of the pilgrims.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "Hild was already pulling weeds", model: "When the sun rose over the village, Hild was already pulling weeds." },
    { lesson: "C", conjunction: "although", stem: "the knight rode beside the cook", model: "Although the knight outranked the cook, he rode beside him on the road." },
    { lesson: "D", conjunction: "because", stem: "Alyce kept asking to stay", model: "Because she had no family, Alyce kept asking to stay." },
  ],
  spo: {
    topic: {
      l1_2: "From [Hild]'s view, her rank [limits] what she can do.",
      l3_4: "From [Hild]'s perspective, a morning in the lord's field felt [feeling] because her rank as a serf [limits] her choices.",
      l5_6: "Although [Osric] and [Hild] live beside the same castle, [their rank] gives each of them a [different view] of the same day.",
    },
    starters: [
      { type: "question", text: "What would it feel like to need permission to leave your own village?" },
      { type: "appositive", text: "Hild, a serf girl beside a castle, rose before the sun to work for a lord she never chose." },
      { type: "subordinate", text: "Although the castle looked grand from far away, Hild saw only the fields." },
    ],
    details: [
      { note: "Hild = serf, cannot leave village", lesson: "B" },
      { note: "up before sun → lord's field", lesson: "B" },
      { note: "lord keeps share of grain", lesson: "B" },
      { note: "Osric = noble boy, knight training", lesson: "A" },
      { note: "Osric: master shouts, but eats meat daily", lesson: "A" },
      { note: "rank, not effort, decides who learns", lesson: "D" },
    ],
    distractors: ["castle walls were built of stone", "knights wore heavy chain mail"],
    conclusion: {
      l1_2: "Hild and Osric see the [day] in [different] ways.",
      l3_4: "Because their ranks are different, Hild feels [feeling] while Osric feels [feeling] about the same day.",
      l5_6: "In the end, [Hild's] rank limits her choices more than [Osric's] does, which shapes [how each of them sees the world].",
    },
  },
  prompt: {
    l1_2: "Draw Hild in the field. Write 3 sentences from her view. Tell what she does and how she feels.",
    l3_4: "Write a paragraph about one morning from Hild's perspective. Show what she wants and how her rank limits her. Then tell how Osric sees the same day.",
    l5_6: "Write a narrative paragraph that tells one day from Hild's perspective and contrasts it with Osric's. Show what motivates each of them. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["At first,", "Meanwhile,", "Suddenly,", "From her view,", "However,", "Later,", "Because", "In the end,"],
  model: {
    l1_2: "Hild gets up before the sun. She works in the lord's field. She is tired, but she cannot leave.",
    l3_4: "From Hild's perspective, a morning in the lord's field felt long and lonely because her rank as a serf limits her choices. At first, she pulled weeds until her hands ached. The lord took a share of the grain, so her family had less to eat. Meanwhile, Osric practiced with a wooden sword inside the castle. He felt tired because his master shouted at him. Hild would trade places with him, because Osric can learn to fight, but she cannot even leave the village.",
    l5_6: "Although Osric and Hild live beside the same castle, their rank gives each of them a different view of the same day. Hild, a serf girl, rose before the sun and walked to the lord's field. She pulled weeds for hours because her family needed grain for the winter. When she tied the last bundle, she knew the lord would keep a share. Meanwhile, Osric, a noble boy training to be a knight, swung a wooden sword in the yard. He felt that his life was hard because his master shouted at him. Hild would have traded places in a moment, since Osric could still become a knight. She could not even leave her village without permission. In the end, rank, not effort, decided which child could shape a future.",
  },
  mpo: {
    thesis: "Hild the serf and Osric the noble boy live beside the same castle, but their rank gives them different choices and different views of the same day.",
    paragraphs: [
      { topic: "Hild's day in the field shows how a serf's rank limits her choices.", notes: ["up before sun", "lord keeps share of grain", "cannot leave w/o permission"] },
      { topic: "Osric's day in the castle shows what a noble boy can become.", notes: ["knight training", "master shouts = hard for him", "eats meat, learns to fight"] },
      { topic: "Alyce the apprentice shows that a trade can open a door that rank closes.", notes: ["orphan = no rank", "wants midwife's trade", "keeps asking → gets a place"] },
    ],
    conclusion: "Rank shaped what Hild, Osric, and Alyce could choose, but each of them still wanted something and acted to get it.",
  },
  revise: [
    "Did I tell the day from one character's perspective, using what she or he feels and wants?",
    "Did I show how rank limits or opens a choice, not just say it?",
    "Did I contrast Hild's view with Osric's using although, but, or while?",
    "Did I name real medieval details such as the lord's field, the castle, or the guild?",
  ],
};
