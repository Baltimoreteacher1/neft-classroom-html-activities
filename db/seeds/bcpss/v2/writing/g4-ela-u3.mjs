// BCPSS Writing Lab (TWR) — g4-ela-u3 · The Redcoats Are Coming! Contract: ../writing-schema.mjs

export default {
  title: "Same War, Different Sides",
  genre: "argue",
  tip: "Have students pick one group and underline the evidence for what that group wanted before they state their claim.",
  lessons: [
    { id: "A", title: "Why colonists wanted independence" },
    { id: "B", title: "Patriots and Loyalists" },
    { id: "C", title: "Native nations and enslaved people choose sides" },
    { id: "D", title: "Claims and evidence with because and according to" },
  ],
  source: {
    title: "Many People, Many Choices",
    lesson: "C",
    text: "In 1775, people living in the colonies did not all want the same thing. Many Patriots wanted independence because Britain taxed them without their vote. Loyalists wanted to stay under British rule because they trusted the king to keep order. The governor of Virginia promised freedom to enslaved people who joined the British, so hundreds escaped to his ships. Other enslaved people fought for the Patriots, hoping the new nation would grant freedom too. The Oneida nation helped the Patriots, but many Mohawk leaders sided with the British. According to historians, each group chose the side it believed would protect its freedom, its land, or its way of life.",
  },
  notes: [
    { sentence: "Many Patriots wanted independence because Britain taxed them without their vote.", note: "Patriots: independence b/c taxes, no vote" },
    { sentence: "Loyalists wanted to stay under British rule because they trusted the king to keep order.", note: "Loyalists: stay British b/c trusted king" },
    { sentence: "The governor of Virginia promised freedom to enslaved people who joined the British, so hundreds escaped to his ships.", note: "VA governor: freedom if join British → hundreds escaped" },
    { sentence: "The Oneida nation helped the Patriots, but many Mohawk leaders sided with the British.", note: "Oneida = Patriots; Mohawk leaders = British" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Many colonists wanted independence",
      because: "they had to pay taxes without a vote.",
      but: "other colonists wanted to stay under British rule.",
      so: "people began to choose sides.",
    },
    {
      lesson: "B",
      kernel: "Loyalists stayed loyal to the king",
      because: "they trusted him to keep order.",
      but: "Patriots believed the king was unfair.",
      so: "neighbors sometimes disagreed about the war.",
    },
    {
      lesson: "C",
      kernel: "Some enslaved people joined the British",
      because: "the governor of Virginia promised them freedom.",
      but: "others fought for the Patriots instead.",
      so: "enslaved people made different choices to seek freedom.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Riders carried a warning.",
      parts: { when: "on April 18, 1775", where: "through the towns", why: "so farmers could gather" },
      model: "On April 18, 1775, riders carried a warning through the towns so farmers could gather.",
    },
    {
      lesson: "D",
      kernel: "The writer stated a claim.",
      parts: { when: "after reading", how: "with clear evidence", why: "to convince the reader" },
      model: "After reading, the writer stated a claim with clear evidence to convince the reader.",
    },
  ],
  fragments: [
    { text: "The Oneida nation helped the Patriots.", is_sentence: true },
    { text: "Wanted independence from Britain.", is_sentence: false, fix: "Many colonists wanted independence from Britain." },
    { text: "Because Britain taxed them without a vote.", is_sentence: false, fix: "Patriots were angry because Britain taxed them without a vote." },
    { text: "Hundreds of enslaved people escaped to the ships.", is_sentence: true },
    { text: "According to the historian.", is_sentence: false, fix: "According to the historian, each group chose its own side." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Independence, ___, was the goal of the Patriots.",
      noun: "Independence",
      options: ["freedom from being ruled by someone else", "a place ruled by a faraway country", "a time when people overthrow their government"],
      answer: 0,
      model: "Independence, freedom from being ruled by someone else, was the goal of the Patriots.",
    },
    {
      lesson: "B",
      sentence: "A Loyalist, ___, did not want to break away from Britain.",
      noun: "Loyalist",
      options: ["a colonist who wanted to break away from British rule", "a colonist who wanted to stay under British rule", "the way a person sees something"],
      answer: 1,
      model: "A Loyalist, a colonist who wanted to stay under British rule, did not want to break away from Britain.",
    },
    {
      lesson: "C",
      sentence: "The Oneida, ___, helped the Patriots.",
      noun: "Oneida",
      options: ["a place ruled by a faraway country", "facts from a text that prove an idea", "an Indigenous nation of what is now New York"],
      answer: 2,
      model: "The Oneida, an Indigenous nation of what is now New York, helped the Patriots.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "Patriots wanted independence", model: "Because Britain taxed them without a vote, Patriots wanted independence." },
    { lesson: "C", conjunction: "although", stem: "many Mohawk leaders sided with the British", model: "Although the Oneida helped the Patriots, many Mohawk leaders sided with the British." },
    { lesson: "D", conjunction: "since", stem: "the evidence supports my claim", model: "Since the newspaper says Britain taxed colonists without a vote, the evidence supports my claim." },
  ],
  spo: {
    topic: {
      l1_2: "[Patriots] wanted [independence] because of [taxes].",
      l3_4: "I claim that Patriots wanted independence because, according to [the newspaper], [Britain taxed them without a vote].",
      l5_6: "Although [colonists lived through the same war], I claim that [Patriots, Loyalists, Native nations, and enslaved people] chose sides because, as shown by [their actions], each group hoped to protect [its freedom].",
    },
    starters: [
      { type: "question", text: "Why did people living through the same war choose different sides?" },
      { type: "appositive", text: "The Oneida, an Indigenous nation of New York, helped the Patriots." },
      { type: "subordinate", text: "Although they lived in the same colonies, people saw the war in different ways." },
    ],
    details: [
      { note: "Patriots: independence b/c taxes, no vote", lesson: "A" },
      { note: "Loyalists: stay British, trusted king", lesson: "B" },
      { note: "riders + bells warn of redcoats", lesson: "B" },
      { note: "VA governor: freedom → hundreds escaped", lesson: "C" },
      { note: "Oneida helped Patriots; Mohawk sided British", lesson: "C" },
      { note: "each group chose side → protect freedom", lesson: "D" },
    ],
    distractors: ["muskets are loaded with gunpowder", "church bells are made of metal"],
    conclusion: {
      l1_2: "Each group wanted to [stay free].",
      l3_4: "This shows that each group chose a side because it wanted to protect [its freedom].",
      l5_6: "Therefore, [the same war] looked different to each group because [each hoped to protect freedom, land, or a way of life].",
    },
  },
  prompt: {
    l1_2: "Draw two groups on different sides of the war. Write 2-3 sentences that tell what one group wanted. Use the words wanted and because.",
    l3_4: "Write a paragraph that makes a claim about what one group wanted in the Revolution and proves it with evidence. Use your outline, because, and according to.",
    l5_6: "Write a paragraph that argues why people living through the same war chose different sides. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["I claim that", "because", "According to", "As shown by", "For example,", "However,", "This shows that", "In conclusion,"],
  model: {
    l1_2: "Patriots wanted independence. Britain taxed them without a vote. So they chose to fight.",
    l3_4: "I claim that Patriots wanted independence because, according to the newspaper, Britain taxed them without a vote. Loyalists wanted to stay under British rule because they trusted the king. Some enslaved people joined the British because the governor of Virginia promised them freedom. This shows that each group chose a side because it wanted to protect its freedom.",
    l5_6: "Although colonists lived through the same war, I claim that each group chose its side to protect its freedom. The Patriots, colonists who wanted independence, were angry because Britain taxed them without a vote. Loyalists wanted to stay under British rule because they trusted the king. The governor of Virginia promised freedom to enslaved people who joined the British, so hundreds escaped to his ships. According to historians, the Oneida helped the Patriots, but many Mohawk leaders sided with the British. As shown by these choices, each group hoped to protect its freedom, its land, or its way of life. Therefore, the same war looked different to each group.",
  },
  revise: [
    "Did I state a clear claim about what a group wanted?",
    "Did I prove it with evidence, using because, according to, or as shown by?",
    "Did I show more than one perspective?",
    "Did I use words like Patriot, Loyalist, and independence correctly?",
  ],
};
