// BCPSS Writing Lab (TWR) — g2-ela-u1 · A Season of Change. Contract: ../writing-schema.mjs

export default {
  title: "Why Animals Change in Fall",
  genre: "explain",
  tip: "Have students say each cause and its effect aloud with because before they write it down.",
  lessons: [
    { id: "A", title: "The seasons come in a cycle" },
    { id: "B", title: "Animals migrate and hibernate" },
    { id: "C", title: "Plants wake up and bloom in spring" },
    { id: "D", title: "Cause and effect with because and as a result" },
  ],
  source: {
    title: "Fall Comes to Maryland",
    lesson: "B",
    text: "Fall comes to Maryland. The days get shorter and colder. Ponds freeze, so Canada geese cannot find food. They migrate south to the Chesapeake Bay. A black bear eats a lot of food. Then it finds a den. In winter, the bear hibernates. It sleeps until spring.",
  },
  notes: [
    { sentence: "The days get shorter and colder.", note: "days shorter + colder" },
    { sentence: "Ponds freeze, so Canada geese cannot find food.", note: "ponds freeze → no food" },
    { sentence: "They migrate south to the Chesapeake Bay.", note: "geese migrate south" },
    { sentence: "In winter, the bear hibernates.", note: "winter → bear hibernates" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The days get shorter in fall",
      because: "the sun is up for fewer hours.",
      but: "the days get longer again in spring.",
      so: "the air gets cold and the leaves fall.",
    },
    {
      lesson: "B",
      kernel: "Canada geese fly south in the fall",
      because: "the ponds freeze and they cannot find food.",
      but: "they fly back north when spring comes.",
      so: "we see many geese on the Chesapeake Bay.",
    },
    {
      lesson: "C",
      kernel: "A tulip blooms in spring",
      because: "the sun warms the ground and the rain falls.",
      but: "it fades when summer gets very hot.",
      so: "bees come to visit the flower.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The bear sleeps.",
      parts: { when: "all winter", where: "in a warm den", why: "to save energy" },
      model: "All winter, the bear sleeps in a warm den to save energy.",
    },
    {
      lesson: "D",
      kernel: "The leaves drop.",
      parts: { when: "on cold days", where: "from the tall tree", why: "so the tree can rest" },
      model: "On cold days, the leaves drop from the tall tree so the tree can rest.",
    },
  ],
  fragments: [
    { text: "Spring comes after winter.", is_sentence: true },
    { text: "Because the days get cold.", is_sentence: false, fix: "The leaves fall because the days get cold." },
    { text: "Flies south in the fall.", is_sentence: false, fix: "The goose flies south in the fall." },
    { text: "The bear hibernates in a den.", is_sentence: true },
    { text: "The flower in the warm sun.", is_sentence: false, fix: "The flower blooms in the warm sun." },
    { text: "As a result, the tree can rest.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Winter, ___, brings snow to Maryland.",
      noun: "Winter",
      options: ["the coldest season of the year", "a bird that flies south", "the flower that opens first"],
      answer: 0,
      model: "Winter, the coldest season of the year, brings snow to Maryland.",
    },
    {
      lesson: "B",
      sentence: "The black bear, ___, sleeps all winter.",
      noun: "black bear",
      options: ["a season with cold days", "a big animal with thick fur", "the leaves that fall"],
      answer: 1,
      model: "The black bear, a big animal with thick fur, sleeps all winter.",
    },
    {
      lesson: "C",
      sentence: "The sunflower, ___, grows tall in summer.",
      noun: "sunflower",
      options: ["an animal that sleeps in a den", "a day with snow", "a tall yellow flower"],
      answer: 2,
      model: "The sunflower, a tall yellow flower, grows tall in summer.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the geese fly south", model: "When the ponds freeze, the geese fly south." },
    { lesson: "D", conjunction: "because", stem: "the leaves fall from the trees", model: "Because the days get cold, the leaves fall from the trees." },
    { lesson: "C", conjunction: "after", stem: "the seed starts to grow", model: "After the snow melts, the seed starts to grow." },
  ],
  spo: {
    topic: {
      l1_2: "When it gets cold, [animals] [change].",
      l3_4: "Because winter is cold, [animals] [change how they live].",
      l5_6: "Although fall looks calm, [the cold days] cause [animals to change in big ways].",
    },
    starters: [
      { type: "question", text: "What happens to animals when the cold days come?" },
      { type: "appositive", text: "Fall, a season of change, helps animals get ready for winter." },
      { type: "subordinate", text: "When the days get cold, animals change how they live." },
    ],
    details: [
      { note: "days get shorter + colder", lesson: "A" },
      { note: "ponds freeze → no food for geese", lesson: "B" },
      { note: "geese migrate south to Chesapeake Bay", lesson: "B" },
      { note: "bear eats lots, finds den", lesson: "B" },
      { note: "bear hibernates all winter", lesson: "B" },
      { note: "cold = cause, change = effect", lesson: "D" },
    ],
    distractors: ["pumpkins are orange and round", "school buses are yellow"],
    conclusion: {
      l1_2: "The cold makes animals [change].",
      l3_4: "As a result, [animals] stay safe until [spring].",
      l5_6: "Cold days cause [big changes], and [animals] [stay safe] because of them.",
    },
  },
  prompt: {
    l1_2: "Draw an animal in fall or winter. Write 1-3 sentences about the change and why it happens.",
    l3_4: "Write a paragraph that explains how the cold days of fall and winter change how animals live. Use your outline, because, and as a result.",
    l5_6: "Write a paragraph that explains what the cold causes for animals like geese and bears. Include an appositive and a sentence that starts with although or when.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "When", "So", "As a result,", "In winter,", "Finally,"],
  model: {
    l1_2: "In fall, the days get cold. The ponds freeze, so the geese fly south. The bear sleeps in a den.",
    l3_4: "Because winter is cold, animals change how they live. When the ponds freeze, Canada geese migrate south to find food. A black bear eats a lot and then hibernates in a den. As a result, animals stay safe until spring.",
    l5_6: "Although fall looks calm, the cold days cause big changes. The days get shorter, so the ponds freeze. Canada geese, big birds with long wings, migrate south. A black bear eats a lot and hibernates in a den. As a result, both animals stay safe until spring.",
  },
  revise: [
    "Did I tell what the cold causes, which is the effect?",
    "Did I use because or as a result to link the cause and effect?",
    "Did I name a real animal, like the black bear or the goose?",
    "Did I use season words like fall, winter, and spring?",
  ],
};
