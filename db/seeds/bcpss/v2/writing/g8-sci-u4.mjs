// BCPSS Writing Lab (TWR) — g8-sci-u4 · How Does Food Provide My Body with Energy? Contract: ../writing-schema.mjs

export default {
  title: "Seagrass and Crab Cycle",
  genre: "inform",
  tip: "Have students fill a two-column chart of reactants, products, and energy for each process before they write both and whereas sentences.",
  lessons: [
    { id: "A", title: "Photosynthesis: reactants and products" },
    { id: "B", title: "Cellular respiration releases energy" },
    { id: "C", title: "Atoms are rearranged, not destroyed" },
    { id: "D", title: "Cycling carbon through ecosystems" },
  ],
  source: {
    title: "Grass, Crabs, and Glucose",
    lesson: "A",
    text: "Underwater grasses in the Chesapeake Bay and the crabs that hide in them depend on two processes. In photosynthesis, a grass leaf uses light, carbon dioxide, and water to make glucose and oxygen. The glucose stores chemical energy. In cellular respiration, a crab's cells use oxygen to break down glucose, and the cells release the stored energy. The products are carbon dioxide and water. Both processes rearrange atoms, so no atoms are destroyed. In contrast, the reactants of one process are the products of the other. Grasses also carry out cellular respiration, because plant cells need energy at night.",
  },
  notes: [
    { sentence: "In photosynthesis, a grass leaf uses light, carbon dioxide, and water to make glucose and oxygen.", note: "photosynthesis: CO₂ + H₂O + light → glucose + O₂" },
    { sentence: "In cellular respiration, a crab's cells use oxygen to break down glucose, and the cells release the stored energy.", note: "respiration: glucose + O₂ → energy, CO₂, H₂O" },
    { sentence: "Both processes rearrange atoms, so no atoms are destroyed.", note: "both = atoms rearranged, none destroyed" },
    { sentence: "In contrast, the reactants of one process are the products of the other.", note: "reactants ↔ products swap" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Seagrass makes glucose in its leaves",
      because: "it uses light, carbon dioxide, and water.",
      but: "it cannot make glucose in the dark.",
      so: "it releases oxygen into the water.",
    },
    {
      lesson: "B",
      kernel: "A crab breaks down glucose with oxygen",
      because: "its cells need energy to move and grow.",
      but: "it cannot make its own glucose.",
      so: "it breathes out carbon dioxide.",
    },
    {
      lesson: "C",
      kernel: "Photosynthesis and cellular respiration rearrange atoms",
      because: "chemical reactions only change how atoms are connected.",
      but: "they move energy in opposite directions.",
      so: "the carbon in the air can end up in glucose and back again.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Seagrass absorbs sunlight.",
      parts: { when: "during the day", where: "in the shallow Bay", why: "to power photosynthesis" },
      model: "During the day, seagrass absorbs sunlight in the shallow Bay to power photosynthesis.",
    },
    {
      lesson: "B",
      kernel: "cells release energy",
      parts: { where: "inside the mitochondria", how: "by breaking down glucose", why: "so a runner's muscles can keep working" },
      model: "Inside the mitochondria, cells release energy by breaking down glucose so a runner's muscles can keep working.",
    },
  ],
  fragments: [
    { text: "Photosynthesis stores energy in glucose.", is_sentence: true },
    { text: "Because mitochondria release energy from sugar.", is_sentence: false, fix: "Cells need oxygen because mitochondria release energy from sugar." },
    { text: "Both processes rearrange atoms.", is_sentence: true },
    { text: "Uses carbon dioxide and water.", is_sentence: false, fix: "Photosynthesis uses carbon dioxide and water." },
    { text: "Whereas respiration releases the stored energy.", is_sentence: false, fix: "Photosynthesis stores energy, whereas respiration releases the stored energy." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Glucose, ___, is made during photosynthesis.",
      noun: "Glucose",
      options: ["a simple sugar that stores chemical energy", "the green part of a plant cell where light is captured", "the tiny part of a cell that releases energy"],
      answer: 0,
      model: "Glucose, a simple sugar that stores chemical energy, is made during photosynthesis.",
    },
    {
      lesson: "B",
      sentence: "Mitochondria, ___, are found in both plant and animal cells.",
      noun: "Mitochondria",
      options: ["green parts of cells that capture light", "tiny parts inside cells that release energy from sugar", "simple sugars that store energy"],
      answer: 1,
      model: "Mitochondria, tiny parts inside cells that release energy from sugar, are found in both plant and animal cells.",
    },
    {
      lesson: "C",
      sentence: "A reactant, ___, changes into a product during a chemical reaction.",
      noun: "reactant",
      options: ["a substance that is made in a reaction", "the energy stored between atoms", "a substance that is used up at the start of a reaction"],
      answer: 2,
      model: "A reactant, a substance that is used up at the start of a reaction, changes into a product during a chemical reaction.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "grasses carry out cellular respiration at night", model: "Because plant cells also need energy, grasses carry out cellular respiration at night." },
    { lesson: "A", conjunction: "while", stem: "cellular respiration releases it", model: "While photosynthesis stores energy in glucose, cellular respiration releases it." },
    { lesson: "D", conjunction: "since", stem: "the carbon in a crab's breath can become part of a new leaf", model: "Since atoms are never destroyed, the carbon in a crab's breath can become part of a new leaf." },
  ],
  spo: {
    topic: {
      l1_2: "Photosynthesis and respiration both [change] atoms and [energy].",
      l3_4: "Both photosynthesis and cellular respiration [rearrange atoms], but they move [energy] in [opposite ways].",
      l5_6: "Although photosynthesis and cellular respiration seem like opposites, [both rearrange atoms without destroying them], whereas [one stores energy in glucose and the other releases it].",
    },
    starters: [
      { type: "question", text: "How can a seagrass leaf and a crab's muscle use the same atoms?" },
      { type: "appositive", text: "Glucose, a simple sugar, carries energy from the grass to the crab." },
      { type: "subordinate", text: "While one process stores energy, the other releases it." },
    ],
    details: [
      { note: "photosynthesis: CO₂ + H₂O → glucose + O₂", lesson: "A" },
      { note: "stores energy in glucose", lesson: "A" },
      { note: "respiration: glucose + O₂ → CO₂ + H₂O", lesson: "B" },
      { note: "happens in mitochondria", lesson: "B" },
      { note: "both rearrange atoms, none destroyed", lesson: "C" },
      { note: "products of one = reactants of other", lesson: "D" },
    ],
    distractors: ["blue crabs have ten legs", "the Chesapeake Bay is about 200 miles long"],
    conclusion: {
      l1_2: "Together they [cycle] [atoms] and energy.",
      l3_4: "In contrast, [photosynthesis stores energy] and [respiration releases it], so they work as a [cycle].",
      l5_6: "Because atoms are [never destroyed], the two processes [connect the grass and the crab] in one [cycle].",
    },
  },
  prompt: {
    l1_2: "Look at the seagrass and the crab. Write 3 sentences. Tell one way photosynthesis and respiration are the same and one way they are different.",
    l3_4: "Write a paragraph that compares photosynthesis and cellular respiration. Use both, whereas, and in contrast.",
    l5_6: "Write a paragraph that compares photosynthesis and cellular respiration, including reactants, products, energy, and atoms. Include an appositive and a sentence that starts with although, while, or since.",
  },
  transitions: ["Both", "Similarly,", "Whereas", "While", "In contrast,", "However,", "On the other hand,", "In conclusion,"],
  model: {
    l1_2: "Photosynthesis makes glucose. Cellular respiration uses glucose. Both processes rearrange atoms.",
    l3_4: "Both photosynthesis and cellular respiration rearrange atoms without destroying them. Photosynthesis uses light, carbon dioxide, and water to make glucose and oxygen, whereas cellular respiration uses glucose and oxygen to make carbon dioxide and water. Photosynthesis stores energy in glucose. In contrast, cellular respiration releases that energy for the cell to use. As a result, the reactants of one process are the products of the other.",
    l5_6: "Although photosynthesis and cellular respiration seem like opposites, both rearrange atoms without destroying them. In photosynthesis, a seagrass leaf uses light to turn carbon dioxide and water into glucose, a simple sugar that stores chemical energy. Cellular respiration, in contrast, happens in the mitochondria, where cells use oxygen to break down glucose and release that energy. The reactants of one process are the products of the other, so atoms cycle between the grass and the crab. While the grass stores energy, the crab's cells spend it to move and grow. Since atoms are never destroyed, the carbon in a crab's breath can become part of a new leaf.",
  },
  mpo: {
    thesis: "Photosynthesis and cellular respiration both rearrange atoms, but they differ in how they handle energy, so together they form a cycle that connects plants and animals.",
    paragraphs: [
      { topic: "Photosynthesis uses light to store energy in glucose.", notes: ["CO₂ + H₂O + light", "→ glucose + O₂", "chloroplasts capture light"] },
      { topic: "Cellular respiration releases the stored energy for the cell.", notes: ["glucose + O₂", "→ CO₂ + H₂O + energy", "mitochondria"] },
      { topic: "Both processes follow conservation of matter and cycle carbon.", notes: ["atoms rearranged, none destroyed", "products ↔ reactants swap", "carbon moves grass → crab → air"] },
    ],
    conclusion: "Because the products of one process are the reactants of the other, the same atoms can move from the air to a leaf, to a crab, and back again.",
  },
  revise: [
    "Did I name at least one way the two processes are alike and one way they differ?",
    "Did I use both, whereas, in contrast, or however to compare?",
    "Did I name reactants and products correctly for each process?",
    "Did I say what happens to atoms and to energy?",
  ],
};
