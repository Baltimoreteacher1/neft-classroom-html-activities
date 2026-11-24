// BCPSS Writing Lab (TWR) — g2-ela-u4 · Good Eating. Contract: ../writing-schema.mjs

export default {
  title: "A Smart Snack at School",
  genre: "argue",
  tip: "Ask students to point to the proof in the source and say according to before they write it.",
  lessons: [
    { id: "A", title: "Food gives us energy and helps us grow" },
    { id: "B", title: "Nutrients: vitamins and protein" },
    { id: "C", title: "From farm to fork at the market" },
    { id: "D", title: "Claim and proof with because and according to" },
  ],
  source: {
    title: "A Sign at Lexington Market",
    lesson: "B",
    text: "Nia visits Lexington Market with her grandmother. They look at the fruit stand. A sign says oranges have vitamin C. Vitamin C helps the body fight germs. Nia wants to stay healthy at school. So she picks an orange for her snack. According to the sign, it is a smart choice.",
  },
  notes: [
    { sentence: "A sign says oranges have vitamin C.", note: "oranges = vitamin C" },
    { sentence: "Vitamin C helps the body fight germs.", note: "vitamin C → fights germs" },
    { sentence: "Nia wants to stay healthy at school.", note: "Nia = stay healthy" },
    { sentence: "According to the sign, it is a smart choice.", note: "sign says = smart choice" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Oranges are a smart snack",
      because: "they have vitamin C.",
      but: "they do not have much protein.",
      so: "kids can stay healthy at school.",
    },
    {
      lesson: "A",
      kernel: "Food gives our bodies energy",
      because: "our bodies break food into tiny parts we can use.",
      but: "a sugary snack gives energy for only a short time.",
      so: "we should eat a good breakfast before school.",
    },
    {
      lesson: "C",
      kernel: "Fresh corn is a good choice in summer",
      because: "it grows on Maryland farms close to home.",
      but: "it spoils fast if we do not eat it soon.",
      so: "many families buy it at the farmers' market.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The class eats lunch.",
      parts: { when: "at noon", where: "in the cafeteria", why: "to get energy for the afternoon" },
      model: "At noon, the class eats lunch in the cafeteria to get energy for the afternoon.",
    },
    {
      lesson: "D",
      kernel: "Nia chose an orange.",
      parts: { when: "after reading the sign", where: "at Lexington Market", why: "because it has vitamin C" },
      model: "After reading the sign, Nia chose an orange at Lexington Market because it has vitamin C.",
    },
  ],
  fragments: [
    { text: "Vitamins help the body work.", is_sentence: true },
    { text: "Because beans have protein.", is_sentence: false, fix: "Beans are a good choice because they have protein." },
    { text: "Gives me energy to run.", is_sentence: false, fix: "A banana gives me energy to run." },
    { text: "According to the poster, milk builds strong bones.", is_sentence: true },
    { text: "Carrots in the market.", is_sentence: false, fix: "Carrots are for sale in the market." },
    { text: "I think apples are a good snack.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Protein, ___, helps our muscles grow.",
      noun: "Protein",
      options: ["a nutrient in beans and eggs", "the power to run and play", "a plan for a healthy plate"],
      answer: 0,
      model: "Protein, a nutrient in beans and eggs, helps our muscles grow.",
    },
    {
      lesson: "A",
      sentence: "Energy, ___, comes from the food we eat.",
      noun: "Energy",
      options: ["a nutrient that helps muscles grow", "the power we need to run and play", "a market in Baltimore"],
      answer: 1,
      model: "Energy, the power we need to run and play, comes from the food we eat.",
    },
    {
      lesson: "C",
      sentence: "Lexington Market, ___, sells fresh fruit and vegetables.",
      noun: "Lexington Market",
      options: ["a vitamin in oranges", "a plate with many foods", "a busy market in Baltimore"],
      answer: 2,
      model: "Lexington Market, a busy market in Baltimore, sells fresh fruit and vegetables.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "oranges are a smart snack", model: "Because they have vitamin C, oranges are a smart snack." },
    { lesson: "A", conjunction: "if", stem: "our meals stay balanced", model: "If we eat many kinds of food, our meals stay balanced." },
    { lesson: "C", conjunction: "before", stem: "farmers grow and pick it", model: "Before food gets to our table, farmers grow and pick it." },
  ],
  spo: {
    topic: {
      l1_2: "I think [oranges] are a good snack.",
      l3_4: "I think [oranges] are a good snack because they have [vitamin C].",
      l5_6: "Although [candy] tastes sweet, [oranges] are a smarter snack because [they give the body vitamin C].",
    },
    starters: [
      { type: "question", text: "What snack can help you stay healthy at school?" },
      { type: "appositive", text: "Oranges, juicy fruits at Lexington Market, are a smart snack." },
      { type: "subordinate", text: "Even though candy tastes sweet, an orange is a smarter snack." },
    ],
    details: [
      { note: "oranges = vitamin C", lesson: "B" },
      { note: "vitamin C → fights germs", lesson: "B" },
      { note: "sign at market says smart choice", lesson: "D" },
      { note: "fruit gives energy to play", lesson: "A" },
      { note: "balanced meal = many kinds of food", lesson: "A" },
      { note: "fresh fruit sold at Lexington Market", lesson: "C" },
    ],
    distractors: ["the market opens at nine", "some oranges have seeds"],
    conclusion: {
      l1_2: "So [oranges] help me stay [healthy].",
      l3_4: "That is why [oranges] are a [smart choice] for my [snack].",
      l5_6: "For these reasons, [oranges are a smart choice], and the proof is [vitamin C that helps fight germs].",
    },
  },
  prompt: {
    l1_2: "Draw a healthy snack. Write 1-3 sentences that tell what you think and why.",
    l3_4: "Write a paragraph that tells why a food is a good choice for a snack. Give a reason with because and proof with according to.",
    l5_6: "Write a paragraph that argues why a food is a smart choice for a snack. Include an appositive, a sentence that starts with although or even though, and proof from the text.",
  },
  transitions: ["I think", "First,", "Also,", "For example,", "According to", "Because", "So", "That is why", "In the end,"],
  model: {
    l1_2: "I think oranges are a good snack. They have vitamin C.",
    l3_4: "I think oranges are a good snack because they have vitamin C. According to the sign, vitamin C helps the body fight germs. That is why an orange helps me stay healthy at school.",
    l5_6: "Although candy tastes sweet, oranges are a smarter snack. Oranges, juicy fruits sold at Lexington Market, have vitamin C. According to the sign, vitamin C helps the body fight germs. That is why an orange helps me stay healthy at school.",
  },
  revise: [
    "Did I state my claim, what I think?",
    "Did I give a reason with because?",
    "Did I give proof with according to?",
    "Did I name a real nutrient, like vitamin C or protein?",
  ],
};
