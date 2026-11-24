// BCPSS Writing Lab (TWR) — g6-ela-u3 · Narrating the Unknown. Contract: ../writing-schema.mjs

export default {
  title: "Same Trade, Two Voices",
  genre: "narrate",
  tip: "Have students say each narrator's fear aloud, 'I am afraid of...', before writing that narrator's version.",
  lessons: [
    { id: "A", title: "Primary sources and who tells the story" },
    { id: "B", title: "Jamestown from the colonists' perspective" },
    { id: "C", title: "Jamestown from the Powhatan perspective" },
    { id: "D", title: "Motivation and bias in historical accounts" },
  ],
  source: {
    title: "Corn at the River",
    lesson: "B",
    text: "In 1607, about one hundred English settlers built a fort beside the James River. The land belonged to the Powhatan people, who lived in villages all around the river. During the hungry winter, the colonists traded with the Powhatan for corn. From the colonists' perspective, trading was a way to survive. In contrast, the Powhatan saw strangers who kept asking for more food, even though their own families needed it. A colonist's journal might call the Powhatan slow to trade. A Powhatan elder might tell the story as a warning about newcomers. Both accounts describe the same trade, but each narrator has a different motivation. That is why historians read many primary sources.",
  },
  notes: [
    { sentence: "From the colonists' perspective, trading was a way to survive.", note: "colonists: trade = survive" },
    { sentence: "In contrast, the Powhatan saw strangers who kept asking for more food, even though their own families needed it.", note: "Powhatan: strangers ask more, own families need food" },
    { sentence: "A colonist's journal might call the Powhatan slow to trade.", note: "colonist journal: Powhatan slow" },
    { sentence: "Both accounts describe the same trade, but each narrator has a different motivation.", note: "same trade, different motivation" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The colonists traded with the Powhatan for corn",
      because: "they were hungry during the winter.",
      but: "the Powhatan also needed food for their own families.",
      so: "each side had a different view of the trade.",
    },
    {
      lesson: "D",
      kernel: "A colonist's journal is a primary source",
      because: "the writer lived through the events.",
      but: "it shows only one person's side and may be biased.",
      so: "historians compare it with other accounts.",
    },
    {
      lesson: "C",
      kernel: "The Powhatan elder tells the story as a warning",
      because: "he remembers strangers asking for more and more food.",
      but: "the colonist describes the same trade as a way to survive.",
      so: "the two accounts do not match.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The colonists built a fort.",
      parts: { when: "In 1607", where: "beside the James River", why: "to protect themselves" },
      model: "In 1607, the colonists built a fort beside the James River to protect themselves.",
    },
    {
      lesson: "C",
      kernel: "The elder told the story.",
      parts: { when: "Years later", who: "to his grandchildren", why: "to warn them about newcomers" },
      model: "Years later, the elder told the story to his grandchildren to warn them about newcomers.",
    },
  ],
  fragments: [
    { text: "A narrator tells the story.", is_sentence: true },
    { text: "Because the winter was hungry.", is_sentence: false, fix: "The colonists traded for corn because the winter was hungry." },
    { text: "Saw strangers who kept asking for more.", is_sentence: false, fix: "The Powhatan saw strangers who kept asking for more." },
    { text: "A primary source comes from someone who lived the event.", is_sentence: true },
    { text: "While the colonist feared starving.", is_sentence: false, fix: "While the colonist feared starving, the Powhatan feared losing their food." },
    { text: "Each account shows a different perspective.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A primary source, ___, helps historians learn about the past.",
      noun: "primary source",
      options: ["a record made by someone who lived through the event", "a person who tells a story", "a settlement far from the ruling country"],
      answer: 0,
      model: "A primary source, a record made by someone who lived through the event, helps historians learn about the past.",
    },
    {
      lesson: "B",
      sentence: "Jamestown, ___, was built beside the James River in 1607.",
      noun: "Jamestown",
      options: ["an English colony in Virginia", "a primary source from a journal", "an agreement to help each other"],
      answer: 0,
      model: "Jamestown, an English colony in Virginia, was built beside the James River in 1607.",
    },
    {
      lesson: "D",
      sentence: "Bias, ___, can shape how a narrator describes an event.",
      noun: "Bias",
      options: ["a leaning toward one side", "the reason a person acts", "a group of people who share a land"],
      answer: 0,
      model: "Bias, a leaning toward one side, can shape how a narrator describes an event.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the colonists traded with the Powhatan for corn", model: "When winter came, the colonists traded with the Powhatan for corn." },
    { lesson: "C", conjunction: "while", stem: "the Powhatan feared losing their food", model: "While the colonist feared starving, the Powhatan feared losing their food." },
    { lesson: "D", conjunction: "because", stem: "historians read many accounts", model: "Because every narrator has a motivation, historians read many accounts." },
  ],
  spo: {
    topic: {
      l1_2: "A [colonist] and a [Powhatan person] tell the same trade in [different] ways.",
      l3_4: "From the colonists' perspective, [the trade] was [a way to survive], but the Powhatan saw [strangers asking for too much].",
      l5_6: "Although the colonists and the Powhatan took part in the same trade, [each narrator] told it differently because of [a different motivation].",
    },
    starters: [
      { type: "question", text: "How can one trade for corn become two different stories?" },
      { type: "appositive", text: "The Powhatan, the people of the villages along the James River, remembered the trade as a warning." },
      { type: "subordinate", text: "When two people tell one event, each story reflects what that person fears and wants." },
    ],
    details: [
      { note: "colonists = hungry, winter", lesson: "B" },
      { note: "colonist journal: Powhatan slow to trade", lesson: "B" },
      { note: "Powhatan: strangers ask for more food", lesson: "C" },
      { note: "own families need corn too", lesson: "C" },
      { note: "elder's story = warning", lesson: "C" },
      { note: "primary sources = different motivations", lesson: "D" },
    ],
    distractors: ["the James River flows into the Chesapeake Bay", "colonists built a fort with wooden walls"],
    conclusion: {
      l1_2: "Each [narrator] sees it [differently].",
      l3_4: "Both accounts describe the same [trade], but each narrator has a different [motivation].",
      l5_6: "In the end, the two views show that [the person telling a story] shapes [what we learn about the past].",
    },
  },
  prompt: {
    l1_2: "Draw the colonist and the Powhatan villager at the river. Write 3-4 sentences about what each person sees. Use the words colonist, Powhatan, and corn.",
    l3_4: "Write a paragraph that tells the same trade from the colonists' perspective and from the Powhatan perspective. Use your outline, from, and however.",
    l5_6: "Write a paragraph that narrates one trade from two perspectives and explains how each narrator's motivation shapes the story. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["From", "However,", "In contrast,", "While", "On the other hand,", "Because", "Therefore,", "In the end,"],
  model: {
    l1_2: "In 1607, settlers built a fort. They were hungry in winter. The colonists saw the trade as a way to survive. The Powhatan saw strangers asking for too much.",
    l3_4: "From the colonists' perspective, trading with the Powhatan was a way to survive the hungry winter. Their journal says the villagers were slow to trade. However, the Powhatan saw strangers who kept asking for more food. Their own families needed corn too, so the trade felt unfair. Both accounts describe the same trade, but each narrator has a different motivation.",
    l5_6: "Although the colonists and the Powhatan took part in the same trade, each narrator told the story differently. From the colonists' perspective, trading for corn was a way to survive the hungry winter of Jamestown. A colonist's journal, a primary source, might call the Powhatan slow to trade. In contrast, a Powhatan elder, speaking years later, might remember strangers who kept asking for more food. While the colonist feared starving, the Powhatan feared losing the corn their own families needed. Because every narrator has a motivation, historians compare many accounts. In the end, the two views show that the person telling a story shapes what we learn about the past.",
  },
  mpo: {
    thesis: "The colonists and the Powhatan described the same trade at Jamestown very differently, because each narrator had a different perspective and motivation.",
    paragraphs: [
      { topic: "The colonists saw the trade as a way to survive.", notes: ["hungry winter", "trade = survive", "journal: Powhatan slow"] },
      { topic: "The Powhatan saw strangers who asked for too much.", notes: ["strangers ask more", "own families need corn", "elder's story = warning"] },
      { topic: "The stories differ because of motivation and bias.", notes: ["fear of starving vs losing food", "bias = leaning one side", "compare many primary sources"] },
    ],
    conclusion: "Because each narrator tells the story through his own fears and needs, we learn the most about the past when we read more than one voice.",
  },
  revise: [
    "Did I tell what each narrator sees and why, not only what happened?",
    "Did I use signal words such as from, however, while or in contrast?",
    "Did I name each narrator's motivation or fear?",
    "Did I keep each person's view separate and fair?",
  ],
};
