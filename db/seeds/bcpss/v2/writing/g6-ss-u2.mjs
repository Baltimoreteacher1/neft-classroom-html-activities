// BCPSS Writing Lab (TWR) — g6-ss-u2 · River Valley Civilizations: Mesopotamia, Egypt & Kush. Contract: ../writing-schema.mjs

export default {
  title: "Two Rivers, Two Civilizations",
  genre: "inform",
  tip: "Have students fill a two-column chart of likenesses and differences before choosing which comparing words to use.",
  lessons: [
    { id: "A", title: "Why civilizations grew beside rivers" },
    { id: "B", title: "Mesopotamia: the Tigris, the Euphrates and cuneiform" },
    { id: "C", title: "Egypt and the Nile: floods, silt and hieroglyphics" },
    { id: "D", title: "Kush on the Nile" },
  ],
  source: {
    title: "Flood Season on Two Rivers",
    lesson: "C",
    text: "Two river civilizations grew beside great rivers. In Egypt, the Nile flooded every summer. Farmers could count on the flood, so they planned their year around it. In Mesopotamia, the Tigris and Euphrates also flooded, but those floods were harder to predict. Farmers there dug canals for irrigation to guide the water. Both civilizations needed scribes to keep records. Mesopotamian scribes pressed cuneiform into wet clay, whereas Egyptian scribes used hieroglyphics on papyrus. Kush, south of Egypt, also used the Nile's silt to grow food. However, Kushite kings built pyramids and later ruled Egypt.",
  },
  notes: [
    { sentence: "Farmers could count on the flood, so they planned their year around it.", note: "Nile flood = steady → plan year" },
    { sentence: "In Mesopotamia, the Tigris and Euphrates also flooded, but those floods were harder to predict.", note: "Tigris + Euphrates floods = hard to predict" },
    { sentence: "Mesopotamian scribes pressed cuneiform into wet clay, whereas Egyptian scribes used hieroglyphics on papyrus.", note: "cuneiform/clay vs hieroglyphics/papyrus" },
    { sentence: "However, Kushite kings built pyramids and later ruled Egypt.", note: "Kush: pyramids, later ruled Egypt" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Egyptian farmers planned around the Nile flood",
      because: "it came every summer on a steady schedule.",
      but: "the Tigris and Euphrates floods were harder to predict.",
      so: "they could plant and harvest at the right times.",
    },
    {
      lesson: "B",
      kernel: "Mesopotamian scribes pressed cuneiform into clay",
      because: "clay was easy to find beside the rivers.",
      but: "Egyptian scribes wrote with pictures on papyrus.",
      so: "the two writing systems look very different.",
    },
    {
      lesson: "D",
      kernel: "Kush and Egypt both used the Nile",
      because: "its silt made their fields rich.",
      but: "Kush was a separate kingdom with its own kings.",
      so: "the two cultures could share ideas, such as building pyramids.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "The Nile flooded.",
      parts: { when: "Every summer", where: "across the farmland of Egypt", how: "on a steady schedule" },
      model: "Every summer, the Nile flooded across the farmland of Egypt on a steady schedule.",
    },
    {
      lesson: "B",
      kernel: "Farmers dug canals.",
      parts: { when: "Before planting season", where: "in Mesopotamia", why: "to guide the river water" },
      model: "Before planting season, farmers in Mesopotamia dug canals to guide the river water.",
    },
  ],
  fragments: [
    { text: "Silt is fine, rich soil left by a flood.", is_sentence: true },
    { text: "Because the floods were hard to predict.", is_sentence: false, fix: "Mesopotamian farmers dug canals because the floods were hard to predict." },
    { text: "Scribes kept records for rulers.", is_sentence: true },
    { text: "Wrote on papyrus made from river reeds.", is_sentence: false, fix: "Egyptian scribes wrote on papyrus made from river reeds." },
    { text: "Whereas the Nile flooded on a steady schedule.", is_sentence: false, fix: "The Tigris flooded without warning, whereas the Nile flooded on a steady schedule." },
    { text: "Cuneiform marks look like wedges.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Cuneiform, ___, was pressed into wet clay with a reed pen.",
      noun: "Cuneiform",
      options: ["writing made of wedge-shaped marks", "an Egyptian writing system with small pictures", "a trained person who kept records"],
      answer: 0,
      model: "Cuneiform, writing made of wedge-shaped marks, was pressed into wet clay with a reed pen.",
    },
    {
      lesson: "C",
      sentence: "Hieroglyphics, ___, were carved into stone and written on papyrus.",
      noun: "Hieroglyphics",
      options: ["an Egyptian writing system that uses small pictures and symbols", "a set of written laws for a society", "fine, rich soil left by a flood"],
      answer: 0,
      model: "Hieroglyphics, an Egyptian writing system that uses small pictures and symbols, were carved into stone and written on papyrus.",
    },
    {
      lesson: "D",
      sentence: "Kush, ___, lay south of Egypt along the Nile.",
      noun: "Kush",
      options: ["a kingdom in what is now Sudan", "a city between the Tigris and Euphrates", "a line of rulers from one family"],
      answer: 0,
      model: "Kush, a kingdom in what is now Sudan, lay south of Egypt along the Nile.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "it left black silt on the fields", model: "When the Nile flood went down, it left black silt on the fields." },
    { lesson: "B", conjunction: "although", stem: "those floods were harder to predict", model: "Although the Tigris and Euphrates also flooded, those floods were harder to predict." },
    { lesson: "A", conjunction: "because", stem: "early civilizations grew beside them", model: "Because rivers gave water and rich soil, early civilizations grew beside them." },
  ],
  spo: {
    topic: {
      l1_2: "Egypt and Mesopotamia were [alike] and [different].",
      l3_4: "Both Egypt and Mesopotamia used [rivers] for [farming], whereas [the Nile flooded on a steady schedule].",
      l5_6: "Although Egypt and Mesopotamia both depended on rivers, [the Nile's steady floods] contrast with [the unpredictable Tigris and Euphrates], and [their writing systems] differ too.",
    },
    starters: [
      { type: "question", text: "How were two great rivers alike, and how did they shape different civilizations?" },
      { type: "appositive", text: "Egypt and Mesopotamia, two civilizations beside rivers, solved the same problem in different ways." },
      { type: "subordinate", text: "While the Nile flooded on a steady schedule, the Tigris and Euphrates often flooded without warning." },
    ],
    details: [
      { note: "both rivers: rich soil for farming", lesson: "A" },
      { note: "Nile floods = steady schedule", lesson: "C" },
      { note: "Tigris + Euphrates floods = hard to predict", lesson: "B" },
      { note: "Mesopotamia dug canals", lesson: "B" },
      { note: "cuneiform on clay vs hieroglyphics on papyrus", lesson: "B" },
      { note: "Kush = Nile silt, pyramids", lesson: "D" },
    ],
    distractors: ["the pyramids are made of stone blocks", "camels carry goods in the desert"],
    conclusion: {
      l1_2: "Both used [rivers], but they were [different].",
      l3_4: "In conclusion, the two civilizations were [alike] because of their [rivers] but [different] in their [floods and writing].",
      l5_6: "In short, [rivers] gave both civilizations a start, yet [the pattern of the floods and the style of writing] made each one [unique].",
    },
  },
  prompt: {
    l1_2: "Draw the Nile and the Tigris. Write 3-4 sentences about how Egypt and Mesopotamia were alike and different. Use the words both, but, and river.",
    l3_4: "Write a paragraph that compares how Egypt and Mesopotamia used their rivers. Tell what is alike and what is different. Use your outline, both and whereas.",
    l5_6: "Write a paragraph that compares Egypt and Mesopotamia in farming and writing, and tells where Kush fits. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Similarly,", "Like", "However,", "In contrast,", "Whereas", "Unlike", "In conclusion,"],
  model: {
    l1_2: "Egypt and Mesopotamia both had rivers. The Nile flooded on a steady schedule. The Tigris and Euphrates were harder to predict.",
    l3_4: "Both Egypt and Mesopotamia used rivers for rich soil and farming. However, the Nile flooded on a steady schedule, whereas the Tigris and Euphrates were harder to predict. Mesopotamian farmers dug canals to guide the water. In contrast, Egyptian farmers planned their year around the flood. Both civilizations had scribes, but they wrote in different ways.",
    l5_6: "Although Egypt and Mesopotamia both depended on rivers, their rivers shaped daily life in different ways. Both civilizations grew rich crops in the silt, a fine soil that floods leave behind. However, the Nile flooded every summer on a steady schedule, whereas the Tigris and Euphrates were harder to predict. As a result, Egyptian farmers could plan their year, while Mesopotamian farmers dug canals for irrigation. Their scribes also worked differently. Mesopotamian scribes pressed cuneiform into wet clay, but Egyptian scribes wrote hieroglyphics on papyrus. Kush, a kingdom south of Egypt on the Nile, shared the river's gifts and later ruled Egypt.",
  },
  mpo: {
    thesis: "Egypt and Mesopotamia were alike because both grew beside rivers, but they differed in how the rivers flooded and how their scribes wrote.",
    paragraphs: [
      { topic: "Egypt and Mesopotamia were alike in how they used rivers.", notes: ["rivers = water + rich silt", "farming", "scribes kept records"] },
      { topic: "Their rivers were different in how they flooded.", notes: ["Nile = steady floods", "Tigris + Euphrates = unpredictable", "canals + irrigation"] },
      { topic: "Their writing and neighbors were different too.", notes: ["cuneiform on clay", "hieroglyphics on papyrus", "Kush = pyramids, ruled Egypt"] },
    ],
    conclusion: "Rivers gave both civilizations a start, yet the pattern of the floods and the style of writing made each one different.",
  },
  revise: [
    "Did I name at least one way the civilizations were alike and one way they were different?",
    "Did I use comparing words such as both, whereas, however or in contrast?",
    "Did I give a real detail, such as cuneiform or silt, for each point I made?",
    "Did I keep the details for each place with the right place?",
  ],
};
