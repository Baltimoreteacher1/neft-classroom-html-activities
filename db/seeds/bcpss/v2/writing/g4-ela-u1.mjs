// BCPSS Writing Lab (TWR) — g4-ela-u1 · A Great Heart. Contract: ../writing-schema.mjs

export default {
  title: "Two Kinds of Heart",
  genre: "inform",
  tip: "Have students say the whereas sentence aloud with a partner before they write, so the contrast is clear in their heads first.",
  lessons: [
    { id: "A", title: "Inside the heart: chambers and arteries" },
    { id: "B", title: "Literal and figurative meaning of heart" },
    { id: "C", title: "Harriet Tubman and a great heart" },
    { id: "D", title: "Comparing with both, whereas, and in contrast" },
  ],
  source: {
    title: "One Word, Two Hearts",
    lesson: "B",
    text: "The heart in your chest is a muscle about the size of your fist. It has four chambers that fill with blood and then squeeze. Arteries carry the blood away to the rest of your body. The word heart has a second meaning, too. Harriet Tubman was born in Maryland. She went back many times to guide people north to freedom, even though the trips were dangerous. People say she had a great heart. They mean she showed deep compassion and courage. A great heart is not a muscle. It is a trait that shows what a person is like.",
  },
  notes: [
    { sentence: "The heart in your chest is a muscle about the size of your fist.", note: "heart = muscle, fist size" },
    { sentence: "It has four chambers that fill with blood and then squeeze.", note: "4 chambers: fill + squeeze" },
    { sentence: "She went back many times to guide people north to freedom, even though the trips were dangerous.", note: "Tubman → back many times, guided people north" },
    { sentence: "A great heart is not a muscle. It is a trait that shows what a person is like.", note: "great heart ≠ muscle; = trait" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The heart pumps blood all around the body",
      because: "its four chambers fill with blood and then squeeze.",
      but: "it cannot show kindness the way a great heart can.",
      so: "arteries carry the blood away to every part of the body.",
    },
    {
      lesson: "C",
      kernel: "People say Harriet Tubman had a great heart",
      because: "she showed deep compassion for other people.",
      but: "her body heart worked just like anyone else's.",
      so: "we remember her as a person of courage and care.",
    },
    {
      lesson: "B",
      kernel: "Mr. Reyes says his neighbor has a great heart",
      because: "she brings soup to sick families on her block.",
      but: "her chest heart is a muscle, just like his own.",
      so: "he is using the word heart in a figurative way.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The nurse comforts children.",
      parts: { when: "every night", where: "in the hospital", how: "with soft words", why: "so they feel less afraid" },
      model: "Every night, the nurse comforts children in the hospital with soft words so they feel less afraid.",
    },
    {
      lesson: "A",
      kernel: "Blood leaves the heart.",
      parts: { when: "with every beat", where: "through a tube called an artery", why: "to reach the whole body" },
      model: "With every beat, blood leaves the heart through a tube called an artery to reach the whole body.",
    },
  ],
  fragments: [
    { text: "The heart has four chambers.", is_sentence: true },
    { text: "Pumps blood through the body.", is_sentence: false, fix: "The heart pumps blood through the body." },
    { text: "Whereas a figurative heart shows kindness.", is_sentence: false, fix: "A literal heart pumps blood, whereas a figurative heart shows kindness." },
    { text: "Harriet Tubman guided people to freedom.", is_sentence: true },
    { text: "A tube that carries blood away from the heart.", is_sentence: false, fix: "An artery is a tube that carries blood away from the heart." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A chamber, ___, fills with blood before the heart squeezes.",
      noun: "chamber",
      options: ["a hollow room inside the heart", "a tube that carries blood away", "a trait that shows kindness"],
      answer: 0,
      model: "A chamber, a hollow room inside the heart, fills with blood before the heart squeezes.",
    },
    {
      lesson: "C",
      sentence: "Harriet Tubman, ___, led many people north to freedom.",
      noun: "Harriet Tubman",
      options: ["a muscle the size of a fist", "a brave woman born in Maryland", "a comparison that says one thing is another"],
      answer: 1,
      model: "Harriet Tubman, a brave woman born in Maryland, led many people north to freedom.",
    },
    {
      lesson: "B",
      sentence: "Compassion, ___, is a trait of a great heart.",
      noun: "Compassion",
      options: ["a tube that carries blood", "the exact word-for-word meaning", "deep care for someone who is hurting"],
      answer: 2,
      model: "Compassion, deep care for someone who is hurting, is a trait of a great heart.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "although", stem: "a figurative heart shows kindness", model: "Although a literal heart is a muscle, a figurative heart shows kindness." },
    { lesson: "C", conjunction: "even though", stem: "Harriet Tubman went back to Maryland many times", model: "Even though the trips were dangerous, Harriet Tubman went back to Maryland many times." },
    { lesson: "B", conjunction: "because", stem: "Mr. Reyes says his neighbor has a great heart", model: "Because she brings soup to sick families, Mr. Reyes says his neighbor has a great heart." },
  ],
  spo: {
    topic: {
      l1_2: "A literal heart and a figurative heart are [different].",
      l3_4: "A literal heart [pumps blood], whereas a figurative heart [shows kindness].",
      l5_6: "Although both are called a heart, [a literal heart] and [a figurative heart] do very different jobs.",
    },
    starters: [
      { type: "question", text: "What is the difference between the heart in your chest and a great heart?" },
      { type: "appositive", text: "Harriet Tubman, a brave woman from Maryland, showed what a great heart means." },
      { type: "subordinate", text: "Although every person has a muscle heart, only some people show a great heart." },
    ],
    details: [
      { note: "literal heart = muscle, fist size", lesson: "A" },
      { note: "4 chambers fill + squeeze", lesson: "A" },
      { note: "arteries → blood away from heart", lesson: "A" },
      { note: "figurative heart = trait, not muscle", lesson: "B" },
      { note: "great heart = compassion + courage", lesson: "C" },
      { note: "Tubman went back many times", lesson: "C" },
    ],
    distractors: ["valentines are often red and pink", "doctors wear white coats"],
    conclusion: {
      l1_2: "A great heart is [kind].",
      l3_4: "Both are called a heart, but one [pumps blood] and the other [shows kindness].",
      l5_6: "In the end, a [muscle] keeps a body alive, whereas a [great heart] keeps a community strong.",
    },
  },
  prompt: {
    l1_2: "Draw the heart in your chest and a kind person. Write 2-3 sentences that tell how they are different. Use the words muscle and kind.",
    l3_4: "Write a paragraph that compares the heart in your chest with the great heart of a kind person. Use your outline, both, and whereas.",
    l5_6: "Write a paragraph that compares a literal heart with a figurative great heart, using Harriet Tubman as your example. Include an appositive and a sentence that starts with although.",
  },
  transitions: ["First,", "Both", "Whereas", "In contrast,", "However,", "For example,", "Similarly,", "In the end,"],
  model: {
    l1_2: "A literal heart is a muscle. It pumps blood. A great heart is kind.",
    l3_4: "A literal heart pumps blood, whereas a figurative heart shows kindness. The muscle has four chambers that fill with blood and then squeeze. Arteries carry the blood away from the heart. Harriet Tubman had a great heart because she showed compassion and courage. Both are called a heart, but one pumps blood and the other shows kindness.",
    l5_6: "Although both are called a heart, a literal heart and a figurative heart do very different jobs. A literal heart, a muscle the size of a fist, has four chambers that fill with blood and then squeeze. Arteries carry the blood away to the rest of the body. A figurative heart is not a muscle at all. Harriet Tubman showed a great heart when she went back to Maryland many times to guide people to freedom. In contrast to the muscle, her heart showed compassion and courage. In the end, a muscle keeps a body alive, whereas a great heart keeps a community strong.",
  },
  revise: [
    "Did I tell what a literal heart does and what a figurative heart means?",
    "Did I use both, whereas, or in contrast to compare them?",
    "Did I use at least two heart words, such as chamber, artery, or compassion?",
    "Did I give one real example, such as Harriet Tubman or a kind neighbor?",
  ],
};
