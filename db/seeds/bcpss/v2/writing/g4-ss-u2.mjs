// BCPSS Writing Lab (TWR) — g4-ss-u2 · Colonial Maryland & Enslavement. Contract: ../writing-schema.mjs

export default {
  title: "How Tobacco Changed Maryland",
  genre: "explain",
  tip: "Have students draw a cause-and-effect chain with arrows first, then turn each arrow into because, so, or as a result.",
  lessons: [
    { id: "A", title: "The Ark and the Dove and St. Mary's City" },
    { id: "B", title: "Tobacco as a cash crop" },
    { id: "C", title: "Indentured servants and enslaved labor" },
    { id: "D", title: "How enslaved people resisted" },
  ],
  source: {
    title: "A Crop That Changed Lives",
    lesson: "B",
    text: "In 1634, settlers from England built St. Mary's City in Maryland. They planted tobacco because it sold for high prices in England. Tobacco wore out the soil, so planters kept clearing new fields. The work needed many people. At first, planters brought indentured servants from England. Later, planters forced Africans to work without pay, and as a result, thousands of families lost their freedom. Enslaved people resisted in many ways. Some ran away, and others kept their songs and stories alive.",
  },
  notes: [
    { sentence: "They planted tobacco because it sold for high prices in England.", note: "tobacco = high prices, England" },
    { sentence: "Tobacco wore out the soil, so planters kept clearing new fields.", note: "tobacco → worn soil → new fields" },
    { sentence: "At first, planters brought indentured servants from England.", note: "first: indentured servants, England" },
    { sentence: "Later, planters forced Africans to work without pay, and as a result, thousands of families lost their freedom.", note: "later: forced Africans to work → lost freedom" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Maryland planters grew tobacco",
      because: "it sold for high prices in England.",
      but: "it wore out the soil.",
      so: "they kept clearing new fields.",
    },
    {
      lesson: "C",
      kernel: "Planters needed more workers for tobacco",
      because: "growing and drying the leaves took many hands.",
      but: "indentured servants worked only for a set number of years.",
      so: "planters turned to forcing Africans to work without pay.",
    },
    {
      lesson: "D",
      kernel: "Enslaved people resisted unfair power",
      because: "they wanted freedom and wanted to keep their families' traditions.",
      but: "resisting was very dangerous.",
      so: "some ran away and others kept their songs alive.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Settlers built a town.",
      parts: { when: "in 1634", where: "near the Potomac River", why: "to start a new colony" },
      model: "In 1634, settlers built a town near the Potomac River to start a new colony.",
    },
    {
      lesson: "B",
      kernel: "Planters grew tobacco.",
      parts: { where: "on large farms", how: "with many workers", why: "to sell in England" },
      model: "On large farms, planters grew tobacco with many workers to sell in England.",
    },
  ],
  fragments: [
    { text: "Tobacco sold for high prices in England.", is_sentence: true },
    { text: "Wore out the soil.", is_sentence: false, fix: "Tobacco wore out the soil." },
    { text: "Because growing tobacco took many workers.", is_sentence: false, fix: "Planters needed many workers because growing tobacco took a lot of labor." },
    { text: "Enslaved people resisted in many ways.", is_sentence: true },
    { text: "As a result of the high prices.", is_sentence: false, fix: "As a result of the high prices, planters grew more tobacco." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "St. Mary's City, ___, began in 1634.",
      noun: "St. Mary's City",
      options: ["the first settlement in the Maryland colony", "a very large farm that grew one main crop", "a worker who signed a contract for several years"],
      answer: 0,
      model: "St. Mary's City, the first settlement in the Maryland colony, began in 1634.",
    },
    {
      lesson: "B",
      sentence: "A plantation, ___, grew tobacco for sale.",
      noun: "plantation",
      options: ["a worker who signed a contract to work for several years", "a very large farm where one main crop was grown for sale", "pushing back against unfair power"],
      answer: 1,
      model: "A plantation, a very large farm where one main crop was grown for sale, grew tobacco for sale.",
    },
    {
      lesson: "C",
      sentence: "An indentured servant, ___, worked for a set number of years.",
      noun: "indentured servant",
      options: ["a plant that farmers grow to sell", "hard work that people do with their hands", "a worker who signed a contract in exchange for a trip across the ocean"],
      answer: 2,
      model: "An indentured servant, a worker who signed a contract in exchange for a trip across the ocean, worked for a set number of years.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "planters kept clearing new fields", model: "Because tobacco wore out the soil, planters kept clearing new fields." },
    { lesson: "C", conjunction: "since", stem: "planters wanted more workers", model: "Since tobacco needed many hands to grow, planters wanted more workers." },
    { lesson: "D", conjunction: "although", stem: "enslaved people resisted in many ways", model: "Although they were forced to work without pay, enslaved people resisted in many ways." },
  ],
  spo: {
    topic: {
      l1_2: "Tobacco [needed] many [workers].",
      l3_4: "Because tobacco farming needed many workers, planters [brought indentured servants and then forced Africans to work], and as a result, [many families lost their freedom].",
      l5_6: "Although [tobacco made some planters rich], its demand for workers led to [indentured servitude and slavery], and as a result [thousands of families lost their freedom].",
    },
    starters: [
      { type: "question", text: "How did one plant lead to so many people losing their freedom?" },
      { type: "appositive", text: "Tobacco, a cash crop grown for sale, changed life in colonial Maryland." },
      { type: "subordinate", text: "Because tobacco sold for high prices, planters wanted to grow more." },
    ],
    details: [
      { note: "1634 settlers → St. Mary's City", lesson: "A" },
      { note: "tobacco = cash crop, high prices", lesson: "B" },
      { note: "tobacco wore out soil → new fields", lesson: "B" },
      { note: "needed many workers", lesson: "C" },
      { note: "first indentured servants, then enslaved Africans", lesson: "C" },
      { note: "enslaved people resisted: ran away, kept songs", lesson: "D" },
    ],
    distractors: ["colonists built wooden homes", "England had a king"],
    conclusion: {
      l1_2: "Tobacco [changed] many lives.",
      l3_4: "As a result, [enslaved people] lost their freedom, but they [resisted] in many ways.",
      l5_6: "Therefore, [one cash crop] set off a chain of causes that [cost thousands of families their freedom], yet [resistance] never stopped.",
    },
  },
  prompt: {
    l1_2: "Draw a tobacco field. Write 2-3 sentences that tell what tobacco farming caused. Use the words tobacco and workers.",
    l3_4: "Write a paragraph that explains how tobacco farming changed life in colonial Maryland. Use your outline, because, so, and as a result.",
    l5_6: "Write a paragraph that explains the causes and effects of tobacco farming in colonial Maryland, including how enslaved people resisted. Include an appositive and a sentence that starts with because or although.",
  },
  transitions: ["Because", "So", "As a result,", "Since", "This led to", "Therefore,", "Later,", "However,"],
  model: {
    l1_2: "Planters grew tobacco. Tobacco needed many workers. As a result, many families lost their freedom.",
    l3_4: "Because tobacco farming needed many workers, planters first brought indentured servants from England. Later, they forced Africans to work without pay. As a result, thousands of families lost their freedom. Enslaved people resisted in many ways, such as running away and keeping their songs alive. Tobacco changed life in Maryland for everyone.",
    l5_6: "Although tobacco made some planters rich, it caused great suffering. Tobacco, a cash crop grown for sale, sold for high prices in England, so planters wanted to grow more. Because tobacco wore out the soil, they kept clearing new fields. Growing it took many workers, so planters first brought indentured servants and later forced Africans to work without pay. As a result, thousands of families lost their freedom. Enslaved people resisted by running away and keeping their songs and stories alive. Therefore, one cash crop set off a chain of causes that cost families their freedom, yet resistance never stopped.",
  },
  revise: [
    "Did I name a cause and its effect with because, so, or as a result?",
    "Did I explain why tobacco led to a need for more workers?",
    "Did I describe at least one way enslaved people resisted?",
    "Did I use words like plantation, cash crop, and indentured servant correctly?",
  ],
};
