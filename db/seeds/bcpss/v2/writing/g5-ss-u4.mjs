// BCPSS Writing Lab (TWR) — g5-ss-u4 · Westward Expansion & Sectional Tensions. Contract: ../writing-schema.mjs

export default {
  title: "Two Views of the Same Land",
  genre: "narrate",
  tip: "Have students finish the sentence stem I wanted ... because ... for each person before they combine the two views in one paragraph.",
  lessons: [
    { id: "A", title: "Settlers on the Oregon Trail" },
    { id: "B", title: "Cherokee removal and the Trail of Tears" },
    { id: "C", title: "The Mexican-American War and the 1848 treaty" },
    { id: "D", title: "Slavery and the growing split between North and South" },
  ],
  source: {
    title: "Home or Opportunity",
    lesson: "B",
    text: "In the 1830s, the Cherokee Nation lived on farms and in towns in Georgia and nearby states. They had their own written language, a newspaper, and a government. Many settlers wanted the Cherokee land for farms. In 1830, Congress passed a law that led to the removal of Native nations. In 1838, soldiers forced thousands of Cherokee to walk west, and this journey is called the Trail of Tears. From a Cherokee family's perspective, removal meant losing their homes, fields, and graves. From many settlers' perspective, the same land was a chance to start new farms.",
  },
  notes: [
    { sentence: "They had their own written language, a newspaper, and a government.", note: "Cherokee: language, newspaper, government" },
    { sentence: "In 1830, Congress passed a law that led to the removal of Native nations.", note: "1830 law → removal of Native nations" },
    { sentence: "In 1838, soldiers forced thousands of Cherokee to walk west, and this journey is called the Trail of Tears.", note: "1838 soldiers force Cherokee west = Trail of Tears" },
    { sentence: "From a Cherokee family's perspective, removal meant losing their homes, fields, and graves.", note: "Cherokee view: lose homes, fields, graves" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Settler families packed their wagons",
      because: "they hoped for cheap farmland and a fresh start.",
      but: "the trail was about two thousand miles long.",
      so: "families had to plan carefully and travel together.",
    },
    {
      lesson: "B",
      kernel: "Cherokee families did not want to leave",
      because: "their homes, farms, and graves were in Georgia.",
      but: "the government ordered them to go.",
      so: "soldiers forced them to walk west in 1838.",
    },
    {
      lesson: "C",
      kernel: "The 1848 treaty changed life for Mexican families",
      because: "Mexico gave up about half of its land.",
      but: "many families stayed in the same homes.",
      so: "they woke up living in a different country.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Families headed west.",
      parts: { when: "in the 1840s", where: "on the Oregon Trail", how: "in covered wagons", why: "to start new farms" },
      model: "In the 1840s, families headed west on the Oregon Trail in covered wagons to start new farms.",
    },
    {
      lesson: "B",
      kernel: "Soldiers forced Cherokee families west.",
      parts: { when: "in 1838", how: "on foot", why: "because of a government order" },
      model: "In 1838, soldiers forced Cherokee families west on foot because of a government order.",
    },
  ],
  fragments: [
    { text: "The Cherokee had their own newspaper.", is_sentence: true },
    { text: "Because many settlers wanted the land.", is_sentence: false, fix: "Congress passed the law because many settlers wanted the land." },
    { text: "Settlers hoped for cheap farmland.", is_sentence: true },
    { text: "From a Cherokee family's perspective.", is_sentence: false, fix: "From a Cherokee family's perspective, removal meant losing their home." },
    { text: "Walked west for months.", is_sentence: false, fix: "The Cherokee families walked west for months." },
    { text: "Whereas many settlers saw a chance to start new farms.", is_sentence: false, fix: "Cherokee families lost their homes, whereas many settlers saw a chance to start new farms." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Oregon Trail, ___, ran about two thousand miles.",
      noun: "Oregon Trail",
      options: ["a long wagon route from Missouri to Oregon", "a written agreement between nations", "a belief that the nation should stretch to the Pacific"],
      answer: 0,
      model: "The Oregon Trail, a long wagon route from Missouri to Oregon, ran about two thousand miles.",
    },
    {
      lesson: "B",
      sentence: "The Trail of Tears, ___, began in 1838.",
      noun: "Trail of Tears",
      options: ["the purchase of land from France", "the forced walk of Cherokee families to the west", "a treaty that ended the war with Mexico"],
      answer: 1,
      model: "The Trail of Tears, the forced walk of Cherokee families to the west, began in 1838.",
    },
    {
      lesson: "C",
      sentence: "Manifest Destiny, ___, pushed settlers toward the Pacific.",
      noun: "Manifest Destiny",
      options: ["a person who moves to a new place to farm", "loyalty to one region over the whole country", "a belief that the United States was meant to spread across North America"],
      answer: 2,
      model: "Manifest Destiny, a belief that the United States was meant to spread across North America, pushed settlers toward the Pacific.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "families packed their wagons", model: "Because they hoped for cheap farmland, families packed their wagons." },
    { lesson: "B", conjunction: "although", stem: "they were forced to leave", model: "Although the Cherokee had farms, a newspaper, and a government, they were forced to leave." },
    { lesson: "D", conjunction: "while", stem: "North and South argued about slavery in the new territories", model: "While settlers moved west, North and South argued about slavery in the new territories." },
  ],
  spo: {
    topic: {
      l1_2: "For a [Cherokee family], removal meant [losing their home].",
      l3_4: "From a [Cherokee family's] perspective, removal meant [losing their homes and fields], whereas many [settlers] saw [a chance for new farms].",
      l5_6: "Although [settlers saw new farmland], from a Cherokee family's perspective [removal meant losing homes and graves], because [the land held their history].",
    },
    starters: [
      { type: "question", text: "How could the same land mean home to one family and opportunity to another?" },
      { type: "appositive", text: "The Cherokee, a nation with its own language and newspaper, were forced to leave their homeland." },
      { type: "subordinate", text: "While many settlers dreamed of new farms, Cherokee families dreaded losing their homes." },
    ],
    details: [
      { note: "Cherokee: farms, language, newspaper", lesson: "B" },
      { note: "settlers wanted land for farms", lesson: "A" },
      { note: "1830 law → removal", lesson: "B" },
      { note: "1838 soldiers force walk west", lesson: "B" },
      { note: "Cherokee view: lose homes + graves", lesson: "B" },
      { note: "settlers' view: chance for new farms", lesson: "A" },
    ],
    distractors: ["the Oregon Trail crossed many rivers", "the Louisiana Purchase happened in 1803"],
    conclusion: {
      l1_2: "The same land meant [home] and [farms].",
      l3_4: "In contrast, [settlers] wanted [farmland] because [it offered a fresh start].",
      l5_6: "Therefore, [the same land] meant [home and history] to the Cherokee, whereas it meant [opportunity] to settlers, and [the two views] could not both be satisfied.",
    },
  },
  prompt: {
    l1_2: "Draw a Cherokee family and a settler family. Write 2-4 sentences. Tell what each family wanted.",
    l3_4: "Write a paragraph that tells the story of the Cherokee removal from two points of view. Use your outline, from ... perspective, and in contrast.",
    l5_6: "Write a paragraph that shows how a Cherokee family and a settler family saw the same land, what each wanted, and why. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["From", "perspective,", "Meanwhile,", "However,", "In contrast,", "Because", "Yet", "As a result,"],
  model: {
    l1_2: "The Cherokee lived on farms in Georgia. Soldiers forced them to leave in 1838. Many settlers wanted the land.",
    l3_4: "From a Cherokee family's perspective, removal meant losing their homes, fields, and graves. The Cherokee had farms, a newspaper, and a government, but a law passed in 1830 led to their removal. In 1838, soldiers forced thousands of Cherokee to walk west, and this journey is called the Trail of Tears. In contrast, many settlers saw the same land as a chance to start new farms. Settlers wanted the land because it offered a fresh start.",
    l5_6: "Although many settlers saw new farmland, a Cherokee family saw a homeland. The Cherokee, a nation with its own written language and newspaper, had farms and towns in Georgia. From their perspective, removal meant losing homes, fields, and the graves of their ancestors. In 1838, soldiers forced thousands of Cherokee to walk west on the Trail of Tears. In contrast, many settlers wanted the same land because it offered a fresh start. As a result, the same place meant home and history to one group, whereas it meant opportunity to another.",
  },
  mpo: {
    thesis: "The same journey west looked very different to Cherokee families and to settlers, because each group wanted something different from the land.",
    paragraphs: [
      { topic: "Settlers saw hope in the land.", notes: ["wanted cheap farmland", "Oregon Trail about 5 months", "fresh start"] },
      { topic: "Cherokee families saw home and history in the land.", notes: ["farms, language, newspaper", "1830 law → removal", "1838 Trail of Tears"] },
      { topic: "Mexican families and the fight over slavery added other views.", notes: ["1848 treaty: new country, same homes", "North and South argue about slavery"] },
    ],
    conclusion: "Each person's point of view shows what they wanted and why, and together the views explain why westward expansion caused so much conflict.",
  },
  revise: [
    "Did I tell the event from one person's point of view and say what that person wanted?",
    "Did I use from ... perspective to show whose view I am telling?",
    "Did I contrast it with a second view using in contrast, whereas, or however?",
    "Did I use real names and dates, like the Cherokee and 1838?",
  ],
};
