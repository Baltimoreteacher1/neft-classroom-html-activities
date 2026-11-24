// BCPSS Writing Lab (TWR) — g4-ela-u4 · Myth Making. Contract: ../writing-schema.mjs

export default {
  title: "Why Winter Comes",
  genre: "explain",
  tip: "Have students draw a cause, an arrow, and an effect on a sticky note before they write each sentence.",
  lessons: [
    { id: "A", title: "Demeter and Persephone explain the seasons" },
    { id: "B", title: "Sky Woman and the Turtle" },
    { id: "C", title: "Cause, effect, and consequence in a myth" },
    { id: "D", title: "Theme and values in myths" },
  ],
  source: {
    title: "Two Stories About the World",
    lesson: "A",
    text: "Long ago, Greek storytellers told a myth to explain the seasons. Demeter was the goddess of the harvest, and her daughter Persephone was taken to the underworld. Demeter grieved, and as a result nothing would grow. When Persephone returned, spring came and the crops grew again. The Greeks used this story to explain why winter comes each year. The Haudenosaunee tell a different myth. In their story, Sky Woman falls toward a dark sea, and a giant turtle offers its back. Animals bring up mud, which grows into land. Both myths use a character's actions to explain something in nature.",
  },
  notes: [
    { sentence: "Demeter grieved, and as a result nothing would grow.", note: "Demeter grieves → nothing grows" },
    { sentence: "When Persephone returned, spring came and the crops grew again.", note: "Persephone returns → spring" },
    { sentence: "The Greeks used this story to explain why winter comes each year.", note: "myth explains winter" },
    { sentence: "In their story, Sky Woman falls toward a dark sea, and a giant turtle offers its back.", note: "Sky Woman falls; turtle offers back" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Nothing grew while Demeter grieved",
      because: "her daughter was gone.",
      but: "the crops grew again when Persephone returned.",
      so: "the Greeks said winter comes each year.",
    },
    {
      lesson: "B",
      kernel: "Mud on the turtle's back became land",
      because: "animals dove down to bring it up.",
      but: "most of the animals could not reach the bottom.",
      so: "the turtle's back grew into a home for Sky Woman.",
    },
    {
      lesson: "D",
      kernel: "A myth can teach a value",
      because: "a character's choice has a consequence.",
      but: "the story is not a science explanation.",
      so: "listeners learn what people believed was important.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Demeter grieved alone.",
      parts: { when: "after Persephone left", where: "in the empty fields", why: "because she missed her daughter" },
      model: "After Persephone left, Demeter grieved alone in the empty fields because she missed her daughter.",
    },
    {
      lesson: "B",
      kernel: "Animals dove down.",
      parts: { when: "one by one", where: "to the bottom of the sea", why: "to find mud for new land" },
      model: "One by one, animals dove down to the bottom of the sea to find mud for new land.",
    },
  ],
  fragments: [
    { text: "Demeter was the goddess of the harvest.", is_sentence: true },
    { text: "Explains why winter comes.", is_sentence: false, fix: "The myth explains why winter comes." },
    { text: "Because Persephone was gone.", is_sentence: false, fix: "Nothing grew because Persephone was gone." },
    { text: "A giant turtle offered its back.", is_sentence: true },
    { text: "When Persephone returned to her mother.", is_sentence: false, fix: "When Persephone returned to her mother, spring came." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Demeter, ___, grieved when Persephone left.",
      noun: "Demeter",
      options: ["the Greek goddess of the harvest", "a giant turtle in a Native story", "the big message that a story teaches"],
      answer: 0,
      model: "Demeter, the Greek goddess of the harvest, grieved when Persephone left.",
    },
    {
      lesson: "B",
      sentence: "Sky Woman, ___, fell toward a dark sea.",
      noun: "Sky Woman",
      options: ["the Greek goddess of the harvest", "something in nature that people can see or feel", "a woman from the sky world in a Haudenosaunee story"],
      answer: 2,
      model: "Sky Woman, a woman from the sky world in a Haudenosaunee story, fell toward a dark sea.",
    },
    {
      lesson: "C",
      sentence: "A consequence, ___, follows a character's action.",
      noun: "consequence",
      options: ["the big message a story teaches", "something that happens because of what a person did", "an old story that explains nature"],
      answer: 1,
      model: "A consequence, something that happens because of what a person did, follows a character's action.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "spring came", model: "When Persephone returned, spring came." },
    { lesson: "D", conjunction: "because", stem: "the Greeks told this story", model: "Because they wanted to explain the seasons, the Greeks told this story." },
    { lesson: "B", conjunction: "after", stem: "the mud grew into land on the turtle's back", model: "After the muskrat brought up the mud, the mud grew into land on the turtle's back." },
  ],
  spo: {
    topic: {
      l1_2: "In the myth, [Demeter's sadness] makes [winter].",
      l3_4: "In the myth, [Demeter's grief] causes [nothing to grow], which explains why [winter comes each year].",
      l5_6: "Although [a myth is not science], the Greek story shows how [a character's grief] leads to [a consequence] that explains [the seasons].",
    },
    starters: [
      { type: "question", text: "How can one goddess's sadness explain winter?" },
      { type: "appositive", text: "Demeter, the Greek goddess of the harvest, grieved when her daughter was gone." },
      { type: "subordinate", text: "When Persephone returned, the Greeks said, spring came to the world." },
    ],
    details: [
      { note: "Persephone taken → underworld", lesson: "A" },
      { note: "Demeter grieves → nothing grows", lesson: "A" },
      { note: "no crops = winter", lesson: "A" },
      { note: "Persephone returns → spring", lesson: "A" },
      { note: "cause → effect → natural event", lesson: "C" },
      { note: "Greeks used myth to explain seasons", lesson: "D" },
    ],
    distractors: ["Greek temples have tall white columns", "gods live on Mount Olympus"],
    conclusion: {
      l1_2: "That is why [winter] comes.",
      l3_4: "As a result, the myth explains why [winter comes each year].",
      l5_6: "In the end, [Demeter's grief] teaches that [love is powerful], and as a result the Greeks understood [why the seasons change].",
    },
  },
  prompt: {
    l1_2: "Draw Demeter in the cold fields. Write 2-3 sentences that tell what caused winter in the myth. Use the words grief and winter.",
    l3_4: "Write a paragraph that explains how a character's grief in a Greek myth causes winter. Use your outline, causes, and as a result.",
    l5_6: "Write a paragraph that explains how the myth of Demeter and Persephone uses cause and effect to explain the seasons. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Because", "This causes", "This leads to", "As a result,", "Therefore,", "Finally,", "Which explains"],
  model: {
    l1_2: "Demeter was sad. Nothing could grow. That is why winter comes.",
    l3_4: "In the myth, Demeter's grief causes nothing to grow, which explains why winter comes each year. Persephone was taken to the underworld, so Demeter grieved. As a result, the fields were bare and cold. When Persephone returned, spring came. The Greeks told this story to explain the seasons.",
    l5_6: "Although a myth is not science, the Greek story of Demeter shows how a character's grief leads to a consequence. Demeter, the goddess of the harvest, grieved when her daughter Persephone was taken to the underworld. As a result, nothing would grow, and the world turned cold. When Persephone returned, spring came and the crops grew again. This cause and effect explains why winter comes each year. The theme of the myth is that love is powerful. Therefore, the Greeks used the story to understand why the seasons change.",
  },
  revise: [
    "Did I name the cause and its effect with causes, leads to, or as a result?",
    "Did I tell what natural event the myth explains?",
    "Did I tell the myth in my own words and in the right order?",
    "Did I use words like myth, consequence, and theme correctly?",
  ],
};
