// BCPSS Writing Lab (TWR) — g5-ela-u1 · Cultures in Conflict. Contract: ../writing-schema.mjs

export default {
  title: "One Valley, Two Views",
  genre: "inform",
  tip: "Have students find the compare word and the contrast word in the mentor sentence before they build their own comparison.",
  lessons: [
    { id: "A", title: "The Nez Perce homeland in the Wallowa Valley" },
    { id: "B", title: "Settlers and the meaning of owning land" },
    { id: "C", title: "Treaties and being forced to leave" },
    { id: "D", title: "The long trail of 1877" },
  ],
  source: {
    title: "The Valley and the Fence",
    lesson: "B",
    text: "The Wallowa Valley lies in what is now Oregon. For many generations, Nez Perce families lived there. They raised strong horses, fished the rivers, and gathered camas roots. In the 1870s, settlers arrived, and they loved the valley too. Both groups needed the rich grass and clean water. However, the Nez Perce believed the land belonged to everyone, whereas the settlers wanted to fence off farms of their own. In 1877, the army ordered the Nez Perce band to leave. Many families felt the valley was part of who they were.",
  },
  notes: [
    { sentence: "They raised strong horses, fished the rivers, and gathered camas roots.", note: "horses + fish + camas roots" },
    { sentence: "Both groups needed the rich grass and clean water.", note: "both need grass + water" },
    { sentence: "The Nez Perce believed the land belonged to everyone, whereas the settlers wanted to fence off farms of their own.", note: "N.P. = land for all; settlers = fence + own" },
    { sentence: "In 1877, the army ordered the Nez Perce band to leave.", note: "1877 army → must leave" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The Nez Perce lived in the Wallowa Valley",
      because: "it gave their horses rich grass and their families fish.",
      but: "settlers wanted to farm the same land.",
      so: "they called the valley their homeland.",
    },
    {
      lesson: "B",
      kernel: "The settlers built fences around their farms",
      because: "they believed land could belong to one person.",
      but: "the Nez Perce believed the land was for everyone.",
      so: "the two groups began to clash over the valley.",
    },
    {
      lesson: "C",
      kernel: "The army ordered the Nez Perce to leave",
      because: "the government wanted the valley for settlers.",
      but: "many families did not want to give up their homeland.",
      so: "about 750 people began a long journey in 1877.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Families gathered roots.",
      parts: { when: "each spring", where: "in the Wallowa Valley", how: "with digging sticks", why: "to feed their children" },
      model: "Each spring, families gathered roots in the Wallowa Valley with digging sticks to feed their children.",
    },
    {
      lesson: "D",
      kernel: "The families traveled.",
      parts: { when: "in 1877", where: "across Idaho, Wyoming, and Montana", how: "with their children and horses", why: "to find a safe place" },
      model: "In 1877, the families traveled across Idaho, Wyoming, and Montana with their children and horses to find a safe place.",
    },
  ],
  fragments: [
    { text: "The Nez Perce shared the valley's land.", is_sentence: true },
    { text: "Whereas the settlers wanted to own it.", is_sentence: false, fix: "The Nez Perce shared the land, whereas the settlers wanted to own it." },
    { text: "Because the valley was their homeland.", is_sentence: false, fix: "Many families did not want to leave because the valley was their homeland." },
    { text: "Settlers fenced their farms.", is_sentence: true },
    { text: "Moved across Idaho, Wyoming, and Montana for months.", is_sentence: false, fix: "The Nez Perce moved across Idaho, Wyoming, and Montana for months." },
    { text: "A treaty is a written agreement between two nations.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Wallowa Valley, ___, was the Nez Perce homeland.",
      noun: "Wallowa Valley",
      options: ["a green valley with rivers and rich grass", "a written agreement between nations", "a soldier who chased the families"],
      answer: 0,
      model: "The Wallowa Valley, a green valley with rivers and rich grass, was the Nez Perce homeland.",
    },
    {
      lesson: "B",
      sentence: "The settler, ___, built a fence around the new farm.",
      noun: "settler",
      options: ["a person who moves to a new place to farm", "a root that grows in meadows", "a long trail through the mountains"],
      answer: 0,
      model: "The settler, a person who moves to a new place to farm, built a fence around the new farm.",
    },
    {
      lesson: "C",
      sentence: "The treaty, ___, drew new lines on the map.",
      noun: "treaty",
      options: ["a fast horse that crossed rivers", "a family that left the farm", "a written agreement between two governments"],
      answer: 2,
      model: "The treaty, a written agreement between two governments, drew new lines on the map.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "while", stem: "the settlers wanted to own it", model: "While the Nez Perce shared the land, the settlers wanted to own it." },
    { lesson: "C", conjunction: "because", stem: "many families did not want to leave", model: "Because the valley was their homeland, many families did not want to leave." },
    { lesson: "D", conjunction: "although", stem: "the Nez Perce kept moving toward safety", model: "Although the journey lasted for months, the Nez Perce kept moving toward safety." },
  ],
  spo: {
    topic: {
      l1_2: "The Nez Perce and the settlers both needed the [valley].",
      l3_4: "Both the [Nez Perce] and the [settlers] needed the Wallowa Valley, whereas they saw the land in [different ways].",
      l5_6: "Although the Nez Perce and the settlers [both depended on the valley's grass and water], their values about land [clashed].",
    },
    starters: [
      { type: "question", text: "How can two groups need the same valley and still end up in conflict?" },
      { type: "appositive", text: "The Nez Perce, a nation that lived in the Wallowa Valley for generations, saw the land as shared." },
      { type: "subordinate", text: "Although both groups loved the valley, they did not see it the same way." },
    ],
    details: [
      { note: "both need grass + water", lesson: "A" },
      { note: "N.P. share land; settlers own land", lesson: "B" },
      { note: "settlers fence farms", lesson: "B" },
      { note: "1877 army orders N.P. to leave", lesson: "C" },
      { note: "valley = homeland, families refuse", lesson: "C" },
      { note: "trail across Idaho, Wyoming, Montana", lesson: "D" },
    ],
    distractors: ["Oregon became a state in 1859", "Idaho has many potato farms"],
    conclusion: {
      l1_2: "The groups were [alike] and [different].",
      l3_4: "Both groups wanted the [valley], but their [different values] led to [conflict].",
      l5_6: "Because the Nez Perce and the settlers [held opposite values about land], a shared valley became [a place of conflict].",
    },
  },
  prompt: {
    l1_2: "Draw the Wallowa Valley. Write 2-4 sentences. Tell one way the Nez Perce and the settlers were alike and one way they were different.",
    l3_4: "Write a paragraph that compares the Nez Perce and the settlers in the Wallowa Valley. Use your outline, both ... and, and whereas.",
    l5_6: "Write a paragraph that compares how the Nez Perce and the settlers saw the Wallowa Valley, and explain how their values led to conflict. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Similarly,", "Also,", "However,", "In contrast,", "On the other hand,", "While", "As a result,"],
  model: {
    l1_2: "The Nez Perce and the settlers both needed the valley. The Nez Perce shared the land. The settlers wanted to own it.",
    l3_4: "Both the Nez Perce and the settlers needed the Wallowa Valley, whereas they saw the land in different ways. The Nez Perce fished and raised horses there, and they shared the land with everyone. The settlers built fences because they wanted to own their farms. In 1877, the army ordered the Nez Perce to leave. Many families did not want to go because the valley was their homeland. Both groups wanted the valley, but their different values led to conflict.",
    l5_6: "Although the Nez Perce and the settlers both depended on the valley's grass and water, their values about land clashed. The Nez Perce, a nation that had lived in the Wallowa Valley for generations, believed the land belonged to everyone. In contrast, the settlers fenced their farms because they wanted to own the land. In 1877, the army ordered the Nez Perce band to leave, so about 750 people began a long journey across Idaho, Wyoming, and Montana. While the settlers saw a chance to start new lives, the Nez Perce saw their homeland slipping away. Because the two groups held opposite values about land, a shared valley became a place of conflict.",
  },
  mpo: {
    thesis: "Although the Nez Perce and the settlers both needed the Wallowa Valley, their different values about land led to a painful conflict.",
    paragraphs: [
      { topic: "Both groups needed the same things from the valley.", notes: ["grass + water", "N.P. = horses, fish, camas roots", "settlers = farms"] },
      { topic: "The two groups held different values about the land.", notes: ["N.P. = land shared by all", "settlers = fence + own", "valley = homeland"] },
      { topic: "The difference in values ended in families being forced to leave.", notes: ["1877 army orders leave", "about 750 start long journey", "Idaho, Wyoming, Montana"] },
    ],
    conclusion: "The story of the Wallowa Valley shows that people who need the same land can see it in very different ways, and that clash can force families from their homes.",
  },
  revise: [
    "Did I name one way the two groups were alike and one way they were different?",
    "Did I use both ... and and whereas correctly to compare and contrast?",
    "Did I show how each group saw the land, not only what I think?",
    "Did I explain how the difference in values led to conflict?",
  ],
};
