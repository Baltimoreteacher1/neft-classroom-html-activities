// BCPSS Writing Lab (TWR) — gk-sci-u4 · Caring for Our Neighborhood Environment. Contract: ../writing-schema.mjs

export default {
  title: "Keep Our Harbor Clean",
  genre: "argue",
  tip: "Show real examples of trash, a reusable jar, and a recycling bin, then have children say what we should do and why.",
  lessons: [
    { id: "A", title: "How trash and litter hurt places" },
    { id: "B", title: "Reduce and reuse" },
    { id: "C", title: "Recycling paper, cans, and bottles" },
    { id: "D", title: "Mr. Trash Wheel cleans the harbor" },
  ],
  source: {
    title: "Dre Cleans Up",
    lesson: "A",
    text: "Dre sees litter by the harbor. A bottle floats in the water. A bird could get hurt. Dre tells his class. They pick up the litter. Bottles go in the bin. Now the harbor is clean.",
  },
  notes: [
    { sentence: "A bottle floats in the water.", note: "bottle in water" },
    { sentence: "A bird could get hurt.", note: "litter hurts birds" },
    { sentence: "They pick up the litter.", note: "pick up litter" },
    { sentence: "Bottles go in the bin.", note: "bottles → bin" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "We should pick up litter",
      because: "litter can hurt birds.",
      but: "some litter is hard to reach.",
      so: "the harbor stays clean.",
    },
    {
      lesson: "B",
      kernel: "We should reuse a jar",
      because: "it makes less trash.",
      but: "a jar needs to be washed first.",
      so: "we can hold crayons in it.",
    },
    {
      lesson: "C",
      kernel: "We should recycle paper",
      because: "it can become new paper.",
      but: "wet, dirty paper does not work.",
      so: "we put clean paper in the bin.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Mr. Trash Wheel works.",
      parts: { when: "every day", where: "in Baltimore Harbor", how: "with a turning wheel" },
      model: "Every day, Mr. Trash Wheel works in Baltimore Harbor with a turning wheel.",
    },
    {
      lesson: "A",
      kernel: "Dre tells his class.",
      parts: { when: "on Monday", where: "at school", why: "so they can help" },
      model: "On Monday, Dre tells his class at school so they can help.",
    },
  ],
  fragments: [
    { text: "Litter hurts the harbor.", is_sentence: true },
    { text: "Pick up the bottles.", is_sentence: true },
    { text: "Because it is dirty.", is_sentence: false, fix: "We clean the park because it is dirty." },
    { text: "Puts paper in the bin.", is_sentence: false, fix: "Dre puts paper in the bin." },
    { text: "A jar for crayons.", is_sentence: false, fix: "We use a jar for crayons." },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "Mr. Trash Wheel, ___, lives in Baltimore Harbor.",
      noun: "Mr. Trash Wheel",
      options: ["a machine that picks up trash", "a bin for paper and cans", "a bottle on the grass"],
      answer: 0,
      model: "Mr. Trash Wheel, a machine that picks up trash, lives in Baltimore Harbor.",
    },
    {
      lesson: "A",
      sentence: "Litter, ___, hurts birds.",
      noun: "Litter",
      options: ["a way to fix a problem", "trash dropped on the ground", "a bin for cans"],
      answer: 1,
      model: "Litter, trash dropped on the ground, hurts birds.",
    },
    {
      lesson: "C",
      sentence: "Recycling, ___, helps the Earth.",
      noun: "Recycling",
      options: ["using something again", "making less trash", "making used paper and cans into new things"],
      answer: 2,
      model: "Recycling, making used paper and cans into new things, helps the Earth.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the harbor stays clean", model: "When we pick up litter, the harbor stays clean." },
    { lesson: "B", conjunction: "if", stem: "we make less trash", model: "If we reuse jars, we make less trash." },
    { lesson: "C", conjunction: "because", stem: "we put them in the bin", model: "Because cans can become new things, we put them in the bin." },
  ],
  spo: {
    topic: {
      l1_2: "We should [pick up litter].",
      l3_4: "We should [pick up litter] because it keeps the [harbor] clean.",
      l5_6: "Although [litter] is easy to drop, we should [pick it up] because [it hurts birds and the harbor].",
    },
    starters: [
      { type: "question", text: "What can we do to keep our harbor clean?" },
      { type: "appositive", text: "Dre, a boy at the harbor, picks up litter." },
      { type: "subordinate", text: "When we pick up litter, the harbor stays clean." },
    ],
    details: [
      { note: "litter hurts birds", lesson: "A" },
      { note: "bottle floats in water", lesson: "A" },
      { note: "pick up litter", lesson: "A" },
      { note: "bottles go in bin", lesson: "C" },
      { note: "Mr. Trash Wheel helps", lesson: "D" },
      { note: "harbor = clean", lesson: "D" },
    ],
    distractors: ["harbors have boats", "paper is made from trees"],
    conclusion: {
      l1_2: "That keeps the [harbor] clean.",
      l3_4: "That is why we should [pick up litter].",
      l5_6: "Because we all [protect the harbor], birds are safe and [the water stays clean].",
    },
  },
  prompt: {
    l1_2: "Draw a way to keep a place clean. Write 1-3 sentences. Tell what we should do and why.",
    l3_4: "Write about what we should do to care for our neighborhood. Give a reason with because. Use your outline.",
    l5_6: "Tell what we should do to keep our neighborhood clean. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Next,", "Also,", "Then,", "because", "so", "but", "For example,"],
  model: {
    l1_2: "We should pick up litter. It keeps the harbor clean.",
    l3_4: "We should pick up litter because it hurts birds. Bottles can float in the water. We put bottles in the bin. Then the harbor is clean.",
    l5_6: "Dre, a boy at the harbor, says we should pick up litter. Because a bottle can hurt a bird, we must act. When we pick up litter, the harbor stays clean. Mr. Trash Wheel helps too.",
  },
  revise: [
    "Did I say what we should do?",
    "Did I give a reason with because?",
    "Did I tell how litter hurts a place or an animal?",
    "Did I name a way to reduce, reuse, or recycle?",
  ],
};
