// BCPSS Writing Lab (TWR) — g6-ela-u2 · A Hero's Journey. Contract: ../writing-schema.mjs

export default {
  title: "A Hero's Trial and Mistake",
  genre: "narrate",
  tip: "Have students sort their notes into problem, attempts and resolution before they write the first sentence.",
  lessons: [
    { id: "A", title: "The hero's journey pattern in myths" },
    { id: "B", title: "The Odyssey: Odysseus and the Cyclops" },
    { id: "C", title: "The Ramayana: Rama, Sita and Hanuman" },
    { id: "D", title: "How trials and mistakes transform a hero" },
  ],
  source: {
    title: "Nobody in the Cave",
    lesson: "B",
    text: "Odysseus and his crew were sailing home from the war in Troy. They landed on an island and walked into a cave. The cave belonged to Polyphemus, a giant Cyclops, who trapped them inside. Odysseus told the giant that his name was Nobody. That night, he blinded Polyphemus with a sharpened stake, and the men escaped under the sheep. However, Odysseus could not stay quiet. He shouted his real name as he sailed away. His pride made the sea god Poseidon, the giant's father, furious. As a result, Poseidon blew the ship off course for many years.",
  },
  notes: [
    { sentence: "The cave belonged to Polyphemus, a giant Cyclops, who trapped them inside.", note: "cave = Polyphemus, giant, trapped crew" },
    { sentence: "Odysseus told the giant that his name was Nobody.", note: "trick: name = Nobody" },
    { sentence: "He shouted his real name as he sailed away.", note: "shouts real name = hubris" },
    { sentence: "His pride made the sea god Poseidon, the giant's father, furious.", note: "pride → Poseidon furious → off course" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Odysseus told the giant his name was Nobody",
      because: "he wanted to trick Polyphemus and escape.",
      but: "later he shouted his real name as he sailed away.",
      so: "the other Cyclopes did not come to help Polyphemus.",
    },
    {
      lesson: "C",
      kernel: "Rama needed help to rescue Sita",
      because: "the demon king Ravana had carried her to Lanka.",
      but: "Lanka was far across the sea.",
      so: "Hanuman leaped across the water to find her.",
    },
    {
      lesson: "D",
      kernel: "A hero grows from hard trials",
      because: "each test shows what the hero is made of.",
      but: "a hero with too much pride can make a bigger problem.",
      so: "many heroes return home wiser than when they left.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Odysseus escaped.",
      parts: { when: "That night", where: "from the giant's cave", how: "hidden under the sheep" },
      model: "That night, Odysseus escaped from the giant's cave hidden under the sheep.",
    },
    {
      lesson: "C",
      kernel: "Hanuman leaped.",
      parts: { how: "With great strength", where: "across the sea", why: "to find Sita" },
      model: "With great strength, Hanuman leaped across the sea to find Sita.",
    },
  ],
  fragments: [
    { text: "The hero leaves home on a quest.", is_sentence: true },
    { text: "Trapped the crew inside the cave.", is_sentence: false, fix: "The Cyclops trapped the crew inside the cave." },
    { text: "Because Odysseus shouted his real name.", is_sentence: false, fix: "Poseidon was furious because Odysseus shouted his real name." },
    { text: "Rama defeated the demon king Ravana.", is_sentence: true },
    { text: "A mentor gives the hero wise advice.", is_sentence: true },
    { text: "After the army built a bridge of stones.", is_sentence: false, fix: "After the army built a bridge of stones, Rama crossed to Lanka." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Polyphemus, ___, trapped Odysseus and his men.",
      noun: "Polyphemus",
      options: ["a giant Cyclops with one eye", "a wise guide who advises a hero", "the sea god who rules the waves"],
      answer: 0,
      model: "Polyphemus, a giant Cyclops with one eye, trapped Odysseus and his men.",
    },
    {
      lesson: "C",
      sentence: "Hanuman, ___, helped Rama find Sita.",
      noun: "Hanuman",
      options: ["a brave monkey hero", "a demon king who rules Lanka", "a story pattern found around the world"],
      answer: 0,
      model: "Hanuman, a brave monkey hero, helped Rama find Sita.",
    },
    {
      lesson: "A",
      sentence: "An archetype, ___, appears again and again in stories around the world.",
      noun: "archetype",
      options: ["a pattern that repeats in stories from many cultures", "a hard test that shows what a hero is made of", "too much pride that causes mistakes"],
      answer: 0,
      model: "An archetype, a pattern that repeats in stories from many cultures, appears again and again in stories around the world.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the angry giant learned who had blinded him", model: "When Odysseus shouted his real name, the angry giant learned who had blinded him." },
    { lesson: "C", conjunction: "after", stem: "Rama crossed the sea to Lanka", model: "After the army built a bridge of stones, Rama crossed the sea to Lanka." },
    { lesson: "D", conjunction: "although", stem: "they taught the hero to be wiser", model: "Although the trials were painful, they taught the hero to be wiser." },
  ],
  spo: {
    topic: {
      l1_2: "Odysseus faced a [giant] and [escaped] with a clever [trick].",
      l3_4: "Faced with [a giant who trapped his crew], Odysseus [used a clever trick], but [his pride caused a new problem].",
      l5_6: "Although Odysseus [escaped the Cyclops with a clever trick], his [hubris] led to [years of punishment], and the trial [changed him].",
    },
    starters: [
      { type: "question", text: "How can a clever name save a crew and a proud name nearly destroy it?" },
      { type: "appositive", text: "Odysseus, a clever hero from Greek myth, tricked a giant but then made a terrible mistake." },
      { type: "subordinate", text: "Even though Odysseus escaped the cave, his pride put his crew in danger again." },
    ],
    details: [
      { note: "Odysseus + crew trapped in cave", lesson: "B" },
      { note: "Polyphemus = giant Cyclops", lesson: "B" },
      { note: "trick: name = Nobody", lesson: "B" },
      { note: "stake blinds giant, escape under sheep", lesson: "B" },
      { note: "shouts real name = hubris", lesson: "D" },
      { note: "Poseidon furious → off course", lesson: "D" },
    ],
    distractors: ["Ithaca is an island in Greece", "Rama built a bridge of stones"],
    conclusion: {
      l1_2: "Odysseus [learned] a [lesson].",
      l3_4: "In the end, Odysseus learned that [pride] can [undo] a clever plan.",
      l5_6: "As a result, the trial [changed] Odysseus, who learned that [cleverness without humility] can be [dangerous].",
    },
  },
  prompt: {
    l1_2: "Draw Odysseus and the giant. Write 3-4 sentences about the problem and how Odysseus escaped. Use the words first, then, and escaped.",
    l3_4: "Write a paragraph that tells about Odysseus's trial in the cave: the problem, what he did, and what happened. Use your outline, time words, and however.",
    l5_6: "Write a paragraph that narrates the trial of Odysseus, his clever escape, his costly mistake, and how the trial changed him. Include an appositive and a sentence that starts with although or when.",
  },
  transitions: ["First,", "Faced with", "Then", "That night,", "However,", "As a result,", "Finally,", "In the end,"],
  model: {
    l1_2: "Odysseus was trapped in a cave. He tricked the giant. He escaped under the sheep. Then he shouted his real name.",
    l3_4: "Faced with a giant who trapped his crew, Odysseus used a clever trick. He told Polyphemus that his name was Nobody. That night, he blinded the giant, and the men escaped under the sheep. However, Odysseus shouted his real name as he sailed away. His pride made Poseidon furious, so the ship was blown off course.",
    l5_6: "Although Odysseus escaped the Cyclops with a clever trick, his pride, a flaw called hubris, nearly cost him everything. Faced with Polyphemus, a giant who trapped his crew in a cave, he said his name was Nobody. That night, he blinded the giant with a sharpened stake, and the men slipped out under the sheep. However, Odysseus could not stay quiet, so he shouted his real name from the ship. When Poseidon heard that the giant's attacker had a name, he blew the ship off course. As a result, the long trip home lasted many more years. In the end, the trial taught Odysseus that cleverness without humility can be dangerous.",
  },
  mpo: {
    thesis: "Odysseus's trial in the Cyclops's cave shows a hero's journey: a problem, clever action, a costly mistake, and a lesson about pride.",
    paragraphs: [
      { topic: "The problem and the clever escape.", notes: ["crew trapped by Polyphemus", "trick: name = Nobody", "stake + sheep = escape"] },
      { topic: "The mistake that caused a new problem.", notes: ["shouts real name", "hubris = too much pride", "Poseidon → off course for years"] },
      { topic: "The transformation that the trial brings.", notes: ["trial = hard test", "hero learns humility", "returns home changed"] },
    ],
    conclusion: "Because Odysseus faced a problem, made a mistake, and learned from both, his trial shows how hard tests can change a hero.",
  },
  revise: [
    "Did I tell the problem, what the hero did, and how it ended, in that order?",
    "Did I use signal words such as faced with, however and as a result?",
    "Did I use hero words, such as quest, trial, hubris or transformation, correctly?",
    "Did I show how the hero changed by the end?",
  ],
};
