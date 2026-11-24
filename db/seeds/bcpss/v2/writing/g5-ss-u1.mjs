// BCPSS Writing Lab (TWR) — g5-ss-u1 · Indigenous Nations & European Encounters. Contract: ../writing-schema.mjs

export default {
  title: "Two Views of One River",
  genre: "inform",
  tip: "Have students fill a two-column chart of alike and different before they write, so each whereas sentence has a real pair behind it.",
  lessons: [
    { id: "A", title: "The Haudenosaunee confederacy and the Great Law of Peace" },
    { id: "B", title: "The Yaocomico and St. Mary's City" },
    { id: "C", title: "Jamestown and the Powhatan" },
    { id: "D", title: "The exchange of crops, animals, and ideas" },
  ],
  source: {
    title: "Two Views at St. Mary's City",
    lesson: "B",
    text: "In 1634, English colonists arrived in Maryland and built St. Mary's City. The Yaocomico people already lived there. Both groups needed the same resources. They fished in the river, and they grew corn to feed their families. However, they did not always see land the same way. Many Native families believed land belonged to the whole community, so they shared it. In contrast, the English colonists believed a person could own land and sell it. At first, the Yaocomico shared their village with the newcomers, but soon many Native families moved away.",
  },
  notes: [
    { sentence: "Both groups needed the same resources.", note: "both need same resources" },
    { sentence: "They fished in the river, and they grew corn to feed their families.", note: "both fish + grow corn" },
    { sentence: "Many Native families believed land belonged to the whole community, so they shared it.", note: "Native = land shared by community" },
    { sentence: "In contrast, the English colonists believed a person could own land and sell it.", note: "English = own + sell land" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The Haudenosaunee formed a confederacy",
      because: "five nations wanted peace and shared decisions.",
      but: "each nation kept its own villages and leaders.",
      so: "the Great Law of Peace guided their councils.",
    },
    {
      lesson: "B",
      kernel: "The Yaocomico and the English both fished in the river",
      because: "they needed food for their families.",
      but: "they did not see land in the same way.",
      so: "the two groups had to learn each other's views.",
    },
    {
      lesson: "C",
      kernel: "The Powhatan and the English lived near each other at Jamestown",
      because: "the English built the colony in 1607 on Powhatan land.",
      but: "the Powhatan lived in a confederacy of about thirty nations.",
      so: "trade and conflict both grew between them.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Haudenosaunee leaders met.",
      parts: { where: "in a council", how: "following the Great Law of Peace", why: "to make decisions together" },
      model: "Haudenosaunee leaders met in a council, following the Great Law of Peace, to make decisions together.",
    },
    {
      lesson: "B",
      kernel: "Families grew corn.",
      parts: { when: "each summer", where: "near the river", why: "to feed their children" },
      model: "Each summer, families grew corn near the river to feed their children.",
    },
  ],
  fragments: [
    { text: "A confederacy is a group of nations that join together.", is_sentence: true },
    { text: "Because many Native families shared the land.", is_sentence: false, fix: "Many Native families shared the land because they believed it belonged to the whole community." },
    { text: "The English colonists built St. Mary's City.", is_sentence: true },
    { text: "In contrast, believed a person could own land.", is_sentence: false, fix: "In contrast, the English colonists believed a person could own land." },
    { text: "Which changed life for both groups.", is_sentence: false, fix: "Their meeting was an exchange, which changed life for both groups." },
    { text: "The Powhatan lived in a confederacy of about thirty nations.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Haudenosaunee, ___, lived in what is now New York.",
      noun: "Haudenosaunee",
      options: ["a confederacy of nations that shared decisions", "a settler who built a new farm", "the crops and animals traded across the ocean"],
      answer: 0,
      model: "The Haudenosaunee, a confederacy of nations that shared decisions, lived in what is now New York.",
    },
    {
      lesson: "B",
      sentence: "St. Mary's City, ___, was built by English colonists in 1634.",
      noun: "St. Mary's City",
      options: ["a longhouse village in New York", "the first capital of Maryland", "a river in Virginia"],
      answer: 1,
      model: "St. Mary's City, the first capital of Maryland, was built by English colonists in 1634.",
    },
    {
      lesson: "C",
      sentence: "Jamestown, ___, was founded in 1607.",
      noun: "Jamestown",
      options: ["a council of five nations", "a trade of corn and wheat", "the first lasting English settlement in Virginia"],
      answer: 2,
      model: "Jamestown, the first lasting English settlement in Virginia, was founded in 1607.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "while", stem: "each nation kept its own leaders", model: "While the five nations joined in a confederacy, each nation kept its own leaders." },
    { lesson: "B", conjunction: "although", stem: "they did not always see land the same way", model: "Although both groups fished and grew corn, they did not always see land the same way." },
    { lesson: "D", conjunction: "because", stem: "life changed on both sides", model: "Because crops and animals crossed the ocean, life changed on both sides." },
  ],
  spo: {
    topic: {
      l1_2: "Both the [Yaocomico] and the [English] needed the [river], but they saw [land] differently.",
      l3_4: "Both the [Yaocomico] and the [English] needed the [same resources], whereas they [saw land in different ways].",
      l5_6: "Although [both groups fished and grew corn], the [Yaocomico] and the [English] held different views of [land ownership].",
    },
    starters: [
      { type: "question", text: "How can two groups share a river and still see the land in different ways?" },
      { type: "appositive", text: "The Yaocomico, a Native people of southern Maryland, believed land belonged to the whole community." },
      { type: "subordinate", text: "Although both groups needed the river, they did not agree about owning land." },
    ],
    details: [
      { note: "both need river, fish, corn", lesson: "B" },
      { note: "1634: English build St. Mary's City", lesson: "B" },
      { note: "Native nations: land shared by community", lesson: "A" },
      { note: "English: land can be owned + sold", lesson: "B" },
      { note: "Jamestown 1607: same clash with Powhatan", lesson: "C" },
      { note: "exchange changed life on both sides", lesson: "D" },
    ],
    distractors: ["corn grows in tall rows", "Annapolis is Maryland's capital today"],
    conclusion: {
      l1_2: "The groups were [alike] and [different].",
      l3_4: "In contrast, the [English] saw land as [something to own].",
      l5_6: "In the end, [shared needs] brought the groups together, whereas [different ideas about land] pushed them apart.",
    },
  },
  prompt: {
    l1_2: "Draw the river and the two villages. Write 2-4 sentences. Tell one way the groups were alike and one way they were different.",
    l3_4: "Write a paragraph that compares the Yaocomico and the English colonists at St. Mary's City. Use your outline, both ... and, and whereas.",
    l5_6: "Write a paragraph that compares how the Yaocomico and the English colonists used resources and viewed land, and explain how their meeting changed life. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Similarly,", "Also,", "However,", "In contrast,", "On the other hand,", "While", "As a result,"],
  model: {
    l1_2: "Both groups needed the river. Native families shared the land. The English wanted to own it.",
    l3_4: "Both the Yaocomico and the English colonists needed the same resources at St. Mary's City, whereas they saw land in different ways. They both fished in the river and grew corn to feed their families. Many Native families believed land belonged to the whole community, so they shared it. In contrast, the English believed a person could own land and sell it. These different views caused trouble between the two groups.",
    l5_6: "Although the Yaocomico and the English both fished and grew corn, they held different views of land. In 1634, English colonists built St. Mary's City, the first capital of Maryland, beside a Native village. Many Native families believed land belonged to the whole community, so they shared it. In contrast, the English believed a person could own land and sell it. While both groups needed the same river, they did not agree about who controlled its banks. As a result, shared needs brought the groups together, whereas different ideas about land pushed them apart.",
  },
  mpo: {
    thesis: "Native nations and English colonists both needed land and resources, but they held very different views of land, and their meeting changed life for both.",
    paragraphs: [
      { topic: "Both groups needed the same resources.", notes: ["river, fish, corn", "1634 St. Mary's City", "1607 Jamestown too"] },
      { topic: "Their views of land were different.", notes: ["Native: land shared", "English: own + sell", "Haudenosaunee shared farmland too"] },
      { topic: "Their meeting changed life for both groups.", notes: ["exchange: corn ↔ wheat, horses", "Native families moved away", "English colonies grew"] },
    ],
    conclusion: "Native nations and English colonists were alike in what they needed, but their different views of land led to conflict and lasting change.",
  },
  revise: [
    "Did I name one thing both groups shared and one way they were different?",
    "Did I use both ... and, whereas, or in contrast to show the comparison?",
    "Did I explain each group's view of land, not only my own opinion?",
    "Did I use real names and dates, like the Yaocomico and 1634?",
  ],
};
