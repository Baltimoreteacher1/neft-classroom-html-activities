// BCPSS Writing Lab (TWR) — g2-ela-u2 · The American West. Contract: ../writing-schema.mjs

export default {
  title: "Two Families on the Prairie",
  genre: "inform",
  tip: "Use a two-column chart (Plains family, pioneer family) so students see alike and different before they write.",
  lessons: [
    { id: "A", title: "The prairie and the buffalo herds" },
    { id: "B", title: "Homes: tipis and sod houses" },
    { id: "C", title: "The pioneer journey on the trail" },
    { id: "D", title: "Compare with both, and, and whereas" },
  ],
  source: {
    title: "Two Homes on the Prairie",
    lesson: "B",
    text: "Long ago, two families lived on the prairie. One family was from a Plains nation. The other family was a pioneer family. Both families needed food, water, and a safe home. The Plains family lived in a tipi made of hides. The pioneer family built a sod house from dirt and grass. Many Plains nations followed the buffalo. The pioneers stayed in one place.",
  },
  notes: [
    { sentence: "Both families needed food, water, and a safe home.", note: "both need food, water, home" },
    { sentence: "The Plains family lived in a tipi made of hides.", note: "Plains = tipi, hides" },
    { sentence: "The pioneer family built a sod house from dirt and grass.", note: "pioneers = sod house, dirt + grass" },
    { sentence: "Many Plains nations followed the buffalo.", note: "Plains follow buffalo" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Huge herds of buffalo lived on the prairie",
      because: "the grass gave them plenty to eat.",
      but: "they had to move when the grass ran out.",
      so: "many Plains nations followed the herds.",
    },
    {
      lesson: "B",
      kernel: "Pioneers built sod houses",
      because: "there were very few trees for wood.",
      but: "many Plains families lived in tipis instead.",
      so: "the thick walls kept the family safe from wind.",
    },
    {
      lesson: "C",
      kernel: "Pioneer families rode in wagons",
      because: "the trail across the prairie was very long.",
      but: "the wagons could not carry everything.",
      so: "families packed only what they needed.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "The pioneers travel.",
      parts: { when: "every day", where: "along the dusty trail", how: "in a covered wagon", why: "to find a new home" },
      model: "Every day, the pioneers travel along the dusty trail in a covered wagon to find a new home.",
    },
    {
      lesson: "A",
      kernel: "The buffalo eat grass.",
      parts: { when: "every morning", where: "on the wide prairie", how: "with the whole herd" },
      model: "Every morning, the buffalo eat grass on the wide prairie with the whole herd.",
    },
  ],
  fragments: [
    { text: "Both families needed water.", is_sentence: true },
    { text: "Whereas the pioneers stayed in one place.", is_sentence: false, fix: "The Plains family followed the herd, whereas the pioneers stayed in one place." },
    { text: "Built a house from sod.", is_sentence: false, fix: "The pioneers built a house from sod." },
    { text: "The tipi was made of hides.", is_sentence: true },
    { text: "Oxen pulling the wagon.", is_sentence: false, fix: "Oxen pulled the wagon across the prairie." },
    { text: "Many buffalo lived on the prairie.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The prairie, ___, is covered with grass.",
      noun: "prairie",
      options: ["a wide, flat land", "a house made of dirt", "a long trip in a wagon"],
      answer: 0,
      model: "The prairie, a wide, flat land, is covered with grass.",
    },
    {
      lesson: "B",
      sentence: "A sod house, ___, kept the family safe.",
      noun: "sod house",
      options: ["a huge furry animal", "a home made of dirt and grass", "a path many people walked"],
      answer: 1,
      model: "A sod house, a home made of dirt and grass, kept the family safe.",
    },
    {
      lesson: "C",
      sentence: "The trail, ___, was long and dusty.",
      noun: "trail",
      options: ["a huge animal with a hump", "an old story told by the fire", "a path that many pioneers walked"],
      answer: 2,
      model: "The trail, a path that many pioneers walked, was long and dusty.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "while", stem: "the pioneer family stayed in one place", model: "While the Plains family followed the herd, the pioneer family stayed in one place." },
    { lesson: "B", conjunction: "because", stem: "the pioneers built a sod house", model: "Because the prairie had few trees, the pioneers built a sod house." },
    { lesson: "A", conjunction: "when", stem: "the Plains families moved their tipis", model: "When the herd moved on, the Plains families moved their tipis." },
  ],
  spo: {
    topic: {
      l1_2: "A Plains family and a pioneer family were [alike] and [different].",
      l3_4: "Both a [Plains nation family] and a [pioneer family] needed [food, water, and a home], but they lived in [different ways].",
      l5_6: "Although [a Plains family] and [a pioneer family] shared the same prairie, [they met their needs in different ways].",
    },
    starters: [
      { type: "question", text: "How did two families live on the same prairie?" },
      { type: "appositive", text: "The prairie, a wide land of grass, was home to two kinds of families." },
      { type: "subordinate", text: "Although they lived on the same land, the families lived in different ways." },
    ],
    details: [
      { note: "both need food, water, safe home", lesson: "D" },
      { note: "Plains: tipi made of hides", lesson: "B" },
      { note: "pioneers: sod house, dirt + grass", lesson: "B" },
      { note: "Plains follow buffalo herds", lesson: "A" },
      { note: "pioneers cross trail in wagons", lesson: "C" },
      { note: "pioneers settle in one place", lesson: "C" },
    ],
    distractors: ["wagon wheels are made of wood", "the prairie has big blue skies"],
    conclusion: {
      l1_2: "Both families needed a [home].",
      l3_4: "So both families [met their needs], but they did it in [different ways].",
      l5_6: "Both families [used the prairie], but [their homes and travel] [were very different].",
    },
  },
  prompt: {
    l1_2: "Draw a tipi and a sod house. Write 1-3 sentences about how the two homes are alike and different.",
    l3_4: "Write a paragraph that compares how a Plains nation family and a pioneer family lived on the prairie. Use both, and, and whereas.",
    l5_6: "Write a paragraph that compares how a Plains nation family and a pioneer family lived on the prairie. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Also,", "Like", "Whereas", "But", "In contrast,", "On the other hand,", "In the end,"],
  model: {
    l1_2: "Both families needed a safe home. The Plains family lived in a tipi. The pioneer family lived in a sod house.",
    l3_4: "Both families needed food, water, and a safe home. A tipi was made of hides, whereas a sod house was made of dirt and grass. The Plains family followed the buffalo herds. The pioneers stayed in one place.",
    l5_6: "Although they shared the same prairie, the two families lived in different ways. A Plains family lived in a tipi, a home made of hides. The pioneer family built a sod house from dirt and grass. The Plains family followed the herds, whereas the pioneers grew crops.",
  },
  revise: [
    "Did I tell how the two families are alike with both?",
    "Did I tell how they are different with whereas or but?",
    "Did I name real things, like a tipi or a sod house?",
    "Did I treat both families with respect and use true facts?",
  ],
};
