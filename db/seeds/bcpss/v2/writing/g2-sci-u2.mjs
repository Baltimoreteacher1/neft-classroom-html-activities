// BCPSS Writing Lab (TWR) — g2-sci-u2 · Plant Growth & Pollination Systems. Contract: ../writing-schema.mjs

export default {
  title: "How a Bee Helps a Flower",
  genre: "explain",
  tip: "Act out the bee's trip with pom-poms for pollen so students can say each step before they write it.",
  lessons: [
    { id: "A", title: "What plants need to grow" },
    { id: "B", title: "Bees carry pollen from flower to flower" },
    { id: "C", title: "Wind and animals spread seeds" },
    { id: "D", title: "Seeds land, sprout, and grow" },
  ],
  source: {
    title: "A Bee in the Garden",
    lesson: "B",
    text: "A bumblebee buzzes into a Maryland garden. First, it lands on a black-eyed Susan. Next, it drinks sweet nectar. Yellow pollen sticks to its fuzzy legs. Then the bee flies to a new flower. The pollen rubs off. Finally, the flower can make seeds.",
  },
  notes: [
    { sentence: "First, it lands on a black-eyed Susan.", note: "1st: lands on flower" },
    { sentence: "Yellow pollen sticks to its fuzzy legs.", note: "pollen sticks to bee" },
    { sentence: "Then the bee flies to a new flower.", note: "then: flies to new flower" },
    { sentence: "Finally, the flower can make seeds.", note: "flower makes seeds" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "A bee visits a flower",
      because: "it wants sweet nectar to drink.",
      but: "it does not know it is helping the flower.",
      so: "pollen sticks to its fuzzy body.",
    },
    {
      lesson: "C",
      kernel: "A dandelion seed floats away",
      because: "it has soft white fluff that catches the wind.",
      but: "a heavy seed falls near the plant.",
      so: "the plant can grow in a new place.",
    },
    {
      lesson: "A",
      kernel: "Nia's bean plant grows tall",
      because: "it gets water and sunlight.",
      but: "it would not grow in a dark closet.",
      so: "she keeps the pot near a sunny window.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The bee flew.",
      parts: { when: "next", where: "to a new flower", how: "with pollen on its legs" },
      model: "Next, the bee flew to a new flower with pollen on its legs.",
    },
    {
      lesson: "C",
      kernel: "The seeds floated.",
      parts: { where: "across the garden", how: "on the wind", why: "to find a new place to grow" },
      model: "The seeds floated across the garden on the wind to find a new place to grow.",
    },
  ],
  fragments: [
    { text: "Pollen is a tiny, dusty powder.", is_sentence: true },
    { text: "Because the wind blows.", is_sentence: false, fix: "The seeds fly away because the wind blows." },
    { text: "Sticks to the bee.", is_sentence: false, fix: "The pollen sticks to the bee." },
    { text: "The flower can make seeds.", is_sentence: true },
    { text: "Then the bee to a new flower.", is_sentence: false, fix: "Then the bee flies to a new flower." },
    { text: "Next, the seed sprouts.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Pollen, ___, sticks to the bee's fuzzy body.",
      noun: "Pollen",
      options: ["a tiny, dusty powder from flowers", "a sweet liquid inside flowers", "a small part that grows into a plant"],
      answer: 0,
      model: "Pollen, a tiny, dusty powder from flowers, sticks to the bee's fuzzy body.",
    },
    {
      lesson: "B",
      sentence: "Nectar, ___, is food for the bee.",
      noun: "Nectar",
      options: ["a tiny powder made in flowers", "a sweet liquid inside flowers", "the light from the sun"],
      answer: 1,
      model: "Nectar, a sweet liquid inside flowers, is food for the bee.",
    },
    {
      lesson: "C",
      sentence: "A dandelion, ___, makes seeds that float on the wind.",
      noun: "dandelion",
      options: ["an animal that carries pollen", "a seed that blows in the wind", "a yellow flower that turns into a white puffball"],
      answer: 2,
      model: "A dandelion, a yellow flower that turns into a white puffball, makes seeds that float on the wind.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "pollen sticks to its fuzzy body", model: "When a bee drinks nectar, pollen sticks to its fuzzy body." },
    { lesson: "C", conjunction: "while", stem: "the seeds float to a new place", model: "While the wind blows, the seeds float to a new place." },
    { lesson: "D", conjunction: "once", stem: "it can sprout and grow", model: "Once a seed lands in wet soil, it can sprout and grow." },
  ],
  spo: {
    topic: {
      l1_2: "A [bee] helps a [flower] make [seeds].",
      l3_4: "A [bee] helps a flower make seeds by [carrying pollen] from flower to flower.",
      l5_6: "Although [a bee] visits flowers for [nectar], it also [carries pollen so the flower can make seeds].",
    },
    starters: [
      { type: "question", text: "How does a tiny bee help a flower make seeds?" },
      { type: "appositive", text: "The bee, a fuzzy pollinator, carries pollen from flower to flower." },
      { type: "subordinate", text: "When a bee lands on a flower, pollen sticks to its body." },
    ],
    details: [
      { note: "bee lands on black-eyed Susan", lesson: "B" },
      { note: "bee drinks sweet nectar", lesson: "B" },
      { note: "pollen sticks to fuzzy body", lesson: "B" },
      { note: "bee flies to new flower", lesson: "B" },
      { note: "pollen rubs off", lesson: "B" },
      { note: "flower makes seeds → sprout", lesson: "D" },
    ],
    distractors: ["bees live in a hive", "honey tastes sweet"],
    conclusion: {
      l1_2: "So the flower can make [seeds].",
      l3_4: "Finally, the [pollen rubs off], so the flower can [make seeds].",
      l5_6: "In the end, [the bee's trip] lets [the flower make seeds], and [new plants can grow].",
    },
  },
  prompt: {
    l1_2: "Draw a bee and a flower. Write 1-3 sentences that tell how the bee helps the flower.",
    l3_4: "Write a paragraph that explains how a bee helps a flower make seeds. Use first, next, then, and finally.",
    l5_6: "Write a paragraph that explains how a bee helps a flower make seeds. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Finally,", "So", "When", "Because"],
  model: {
    l1_2: "A bee lands on a flower. Pollen sticks to the bee. The flower makes seeds.",
    l3_4: "First, a bee lands on a flower and drinks nectar. Next, pollen sticks to its fuzzy body. Then the bee flies to a new flower, and the pollen rubs off. Finally, the flower can make seeds.",
    l5_6: "A bee, a fuzzy pollinator, visits a black-eyed Susan for nectar. When the bee lands, pollen sticks to its body. Then it flies to a new flower, and the pollen rubs off. Although the bee only wants nectar, it helps the flower. Finally, the flower can make seeds.",
  },
  revise: [
    "Did I tell the steps in order with first, next, and then?",
    "Did I use the words pollen and nectar correctly?",
    "Did I tell what the flower can do at the end?",
    "Did I use so or because to show why it matters?",
  ],
};
