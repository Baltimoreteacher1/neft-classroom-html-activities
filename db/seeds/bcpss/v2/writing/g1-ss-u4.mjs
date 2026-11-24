// BCPSS Writing Lab (TWR) — g1-ss-u4 · Goods, Services, Saving & Spending. Contract: ../writing-schema.mjs

export default {
  title: "Goods and Services Compared",
  genre: "inform",
  tip: "Hold up a real roll and a bus pass so students can touch the good and talk about the service before writing both and while.",
  lessons: [
    { id: "A", title: "Goods and services" },
    { id: "B", title: "Producers and consumers" },
    { id: "C", title: "Needs and wants" },
    { id: "D", title: "Spend or save" },
  ],
  source: {
    title: "A Baker and a Bus Driver",
    lesson: "A",
    text: "A baker and a bus driver both work hard. The baker makes bread. Bread is a good. You can touch a good. The bus driver gives rides on North Avenue. A service is work a person does for you. A ride is a service. Both bread and a ride cost money. Consumers pay for both.",
  },
  notes: [
    { sentence: "Bread is a good.", note: "bread = good" },
    { sentence: "You can touch a good.", note: "good = can touch" },
    { sentence: "A ride is a service.", note: "ride = service" },
    { sentence: "Both bread and a ride cost money.", note: "both cost money" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "A baker is a producer",
      because: "she makes bread.",
      but: "she is a consumer when she buys milk.",
      so: "she can be both.",
    },
    {
      lesson: "D",
      kernel: "Omar saved two dollars",
      because: "he wanted to buy a toy later.",
      but: "he also wanted a warm roll.",
      so: "he has money for later.",
    },
    {
      lesson: "A",
      kernel: "A haircut is a service",
      because: "it is work a person does for you.",
      but: "you cannot take it home in a bag.",
      so: "it is not a good.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The baker sells bread.",
      parts: { when: "every morning", where: "at Lexington Market", who: "to hungry shoppers" },
      model: "Every morning, the baker sells bread at Lexington Market to hungry shoppers.",
    },
    {
      lesson: "D",
      kernel: "Omar saves money.",
      parts: { when: "after he buys a roll", how: "by keeping two dollars", why: "to buy a toy later" },
      model: "After he buys a roll, Omar saves money by keeping two dollars to buy a toy later.",
    },
  ],
  fragments: [
    { text: "Bread is a good.", is_sentence: true },
    { text: "A person who makes goods.", is_sentence: false, fix: "A producer is a person who makes goods." },
    { text: "Both cost money.", is_sentence: true },
    { text: "Because she wants a new ball.", is_sentence: false, fix: "Mia saves her money because she wants a new ball." },
    { text: "Buys bread at the market.", is_sentence: false, fix: "A consumer buys bread at the market." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "A baker, ___, makes bread at the market.",
      noun: "A baker",
      options: ["a producer who makes goods", "a person who buys goods", "work a person does"],
      answer: 0,
      model: "A baker, a producer who makes goods, makes bread at the market.",
    },
    {
      lesson: "A",
      sentence: "A haircut, ___, costs money.",
      noun: "A haircut",
      options: ["a thing you can touch", "work a person does for you", "money saved for later"],
      answer: 1,
      model: "A haircut, work a person does for you, costs money.",
    },
    {
      lesson: "C",
      sentence: "A consumer, ___, pays for goods and services.",
      noun: "A consumer",
      options: ["a person who makes goods", "a thing you can touch", "a person who buys or uses things"],
      answer: 2,
      model: "A consumer, a person who buys or uses things, pays for goods and services.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "while", stem: "a ride is a service", model: "While bread is a good, a ride is a service." },
    { lesson: "D", conjunction: "because", stem: "Omar saves two dollars", model: "Because he wants a toy later, Omar saves two dollars." },
    { lesson: "D", conjunction: "if", stem: "he will have money later", model: "If he spends only one dollar, he will have money later." },
  ],
  spo: {
    topic: {
      l1_2: "A [good] and a [service] are [different].",
      l3_4: "Both [bread] and a [ride] cost money, but a [good] is a thing and a [service] is work.",
      l5_6: "Although both [bread] and [a ride] cost money, a [good] is [a thing you can touch], whereas a [service] is [work a person does].",
    },
    starters: [
      { type: "question", text: "How are bread and a bus ride alike and different?" },
      { type: "statement", text: "Both bread and a ride cost money." },
      { type: "appositive", text: "A baker, a producer who makes bread, sells goods." },
    ],
    details: [
      { note: "bread = good, can touch", lesson: "A" },
      { note: "ride = service, work", lesson: "A" },
      { note: "both cost money", lesson: "C" },
      { note: "baker + driver = producers", lesson: "B" },
      { note: "consumers pay", lesson: "B" },
      { note: "consumer chooses spend or save", lesson: "D" },
    ],
    distractors: ["Lexington Market is old", "bread smells warm"],
    conclusion: {
      l1_2: "A [good] is a [thing]. A [service] is [work].",
      l3_4: "So a [good] and a [service] are [alike and different].",
      l5_6: "Because [consumers pay for goods and services], they can [choose how to spend or save].",
    },
  },
  prompt: {
    l1_2: "Draw bread and a bus ride. Write 1-3 sentences. Tell which is a good and which is a service.",
    l3_4: "Compare a good and a service. Tell how they are alike and how they are different. Use both and but.",
    l5_6: "Compare bread and a bus ride. Tell how they are alike and different and who makes each one. Include an appositive and a sentence that starts with although, while, or because.",
  },
  transitions: ["Both", "Also,", "But", "However,", "On the other hand,", "While", "Because", "In the end,"],
  model: {
    l1_2: "Bread is a good. A ride is a service. Both cost money.",
    l3_4: "Both bread and a bus ride cost money. Bread is a good, but a ride is a service. A good is a thing you can touch. A service is work a person does.",
    l5_6: "Although both bread and a ride cost money, they are not the same. Bread, a thing you can touch, is a good. A ride, work a person does for you, is a service. While the baker makes bread, the driver gives rides on North Avenue. Because consumers pay for both, they can choose to spend or save.",
  },
  revise: [
    "Did I tell one way a good and a service are alike?",
    "Did I tell one way they are different?",
    "Did I use the words good and service correctly?",
    "Did I use both, but, or while to compare?",
  ],
};
