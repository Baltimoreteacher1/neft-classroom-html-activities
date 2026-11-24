// BCPSS Writing Lab (TWR) — g2-ss-u2 · Urban, Suburban & Rural Communities. Contract: ../writing-schema.mjs

export default {
  title: "City and Farm in Maryland",
  genre: "inform",
  tip: "Use a Venn diagram with Baltimore, a farm, and both so students sort facts before they write.",
  lessons: [
    { id: "A", title: "Urban places like Baltimore" },
    { id: "B", title: "Suburban towns near the city" },
    { id: "C", title: "Rural places and farms" },
    { id: "D", title: "Getting around: transportation" },
  ],
  source: {
    title: "Two Places in Maryland",
    lesson: "A",
    text: "Baltimore is an urban place. Many people live close together in rowhouses. They ride buses, trains, and the light rail. Carroll County has rural places. Farms have fields and open land. Families drive trucks and tractors. Both places have roads and homes.",
  },
  notes: [
    { sentence: "Many people live close together in rowhouses.", note: "city: close together, rowhouses" },
    { sentence: "They ride buses, trains, and the light rail.", note: "city: bus, train, light rail" },
    { sentence: "Farms have fields and open land.", note: "farm: fields, open land" },
    { sentence: "Both places have roads and homes.", note: "both: roads + homes" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Baltimore is an urban place",
      because: "many people live close together.",
      but: "it has green parks like Patterson Park too.",
      so: "people ride buses and trains to get around.",
    },
    {
      lesson: "C",
      kernel: "Farms are rural places",
      because: "they have fields and open land.",
      but: "farm families still need roads.",
      so: "tractors and trucks are important there.",
    },
    {
      lesson: "B",
      kernel: "Suburban towns have homes with yards",
      because: "they are near a big city but have more space.",
      but: "many families still drive into the city.",
      so: "the roads get busy in the morning.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Dre rides the bus.",
      parts: { when: "every morning", where: "through the busy city", why: "to get to school" },
      model: "Every morning, Dre rides the bus through the busy city to get to school.",
    },
    {
      lesson: "C",
      kernel: "Mia feeds the animals.",
      parts: { when: "before school", where: "on her family's farm", how: "with a bucket of grain" },
      model: "Before school, Mia feeds the animals on her family's farm with a bucket of grain.",
    },
  ],
  fragments: [
    { text: "Baltimore is an urban place.", is_sentence: true },
    { text: "Whereas the farm has more space.", is_sentence: false, fix: "The city has more people, whereas the farm has more space." },
    { text: "Ride buses and trains.", is_sentence: false, fix: "People in the city ride buses and trains." },
    { text: "Both places have roads.", is_sentence: true },
    { text: "The farm with fields.", is_sentence: false, fix: "The farm has fields." },
    { text: "Rural places have farms and open land.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Baltimore, ___, has tall buildings and many buses.",
      noun: "Baltimore",
      options: ["a busy city in Maryland", "a farm that grows corn", "a town with homes and yards"],
      answer: 0,
      model: "Baltimore, a busy city in Maryland, has tall buildings and many buses.",
    },
    {
      lesson: "B",
      sentence: "A suburban town, ___, is near a big city.",
      noun: "suburban town",
      options: ["a farm where crops grow", "a town of homes, yards, and shops", "a house that shares side walls"],
      answer: 1,
      model: "A suburban town, a town of homes, yards, and shops, is near a big city.",
    },
    {
      lesson: "C",
      sentence: "A crop, ___, grows in a farmer's field.",
      noun: "crop",
      options: ["a house with a big yard", "a bus that drives on a road", "a plant that farmers grow to eat"],
      answer: 2,
      model: "A crop, a plant that farmers grow to eat, grows in a farmer's field.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "while", stem: "a farm family drives a truck", model: "While a city family rides the bus, a farm family drives a truck." },
    { lesson: "A", conjunction: "because", stem: "people ride buses in the city", model: "Because many people live close together, people ride buses in the city." },
    { lesson: "C", conjunction: "since", stem: "it is far from the busy city", model: "Since a farm needs open land, it is far from the busy city." },
  ],
  spo: {
    topic: {
      l1_2: "[Baltimore] and a [farm] are [alike] and [different].",
      l3_4: "Both [Baltimore] and a [farm] have [roads], but they are [different in many ways].",
      l5_6: "Although [Baltimore] and [a farm in Carroll County] both have roads, [the city has more people] whereas [the farm has more space].",
    },
    starters: [
      { type: "question", text: "How is a big city different from a farm?" },
      { type: "appositive", text: "Baltimore, a busy urban place, has buses and trains." },
      { type: "subordinate", text: "Although the two places are different, both need roads." },
    ],
    details: [
      { note: "both: roads + homes", lesson: "D" },
      { note: "Baltimore: rowhouses, close together", lesson: "A" },
      { note: "city: buses, trains, light rail", lesson: "D" },
      { note: "farm: fields, open land", lesson: "C" },
      { note: "farm: tractors + trucks", lesson: "D" },
      { note: "city = more people, farm = more space", lesson: "C" },
    ],
    distractors: ["the Inner Harbor has an aquarium", "corn grows tall in summer"],
    conclusion: {
      l1_2: "Both places have [roads].",
      l3_4: "So the two places are [alike] in some ways and [different] in others.",
      l5_6: "In conclusion, [both places] need roads, whereas [the city is busy] and [the farm is quiet].",
    },
  },
  prompt: {
    l1_2: "Draw a city and a farm. Write 1-3 sentences about how they are alike and different.",
    l3_4: "Write a paragraph that compares Baltimore and a farm. Use both, whereas, and in contrast.",
    l5_6: "Write a paragraph that compares Baltimore and a farm. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Also,", "Like", "Whereas", "But", "In contrast,", "On the other hand,", "In the end,"],
  model: {
    l1_2: "Both places have roads. Baltimore has buses, whereas a farm has tractors.",
    l3_4: "Both Baltimore and a farm have roads and homes. In Baltimore, many people live close together in rowhouses. In contrast, a farm has fields and open land. The city has buses and trains, whereas the farm has tractors and trucks.",
    l5_6: "Although they are very different, Baltimore and a farm in Carroll County both have roads. Baltimore, a busy urban place, has buses and trains. A farm, a rural place, has fields and open land. While city families ride the bus, farm families drive trucks. In contrast, the city is loud and the farm is quiet.",
  },
  revise: [
    "Did I tell how the places are alike with both?",
    "Did I tell how they are different with whereas or in contrast?",
    "Did I use urban and rural correctly?",
    "Did I give facts about how people get around?",
  ],
};
