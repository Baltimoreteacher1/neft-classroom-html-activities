// BCPSS Writing Lab (TWR) — g4-sci-u4 · Earth's Changing Surface & Chesapeake Watershed. Contract: ../writing-schema.mjs

export default {
  title: "Proof in the Cliffs",
  genre: "argue",
  tip: "Have students underline the evidence in the source before drafting so each claim is tied to a real fact.",
  lessons: [
    { id: "A", title: "Weathering and erosion change the land" },
    { id: "B", title: "Rock layers and fossils" },
    { id: "C", title: "Maps of the Chesapeake watershed" },
    { id: "D", title: "Making a claim with evidence" },
  ],
  source: {
    title: "A Shark Tooth at Calvert Cliffs",
    lesson: "B",
    text: "Amir finds a shark tooth on the beach at Calvert Cliffs. The tooth is a fossil that came from a layer of rock in the cliff. According to scientists, the layers are millions of years old. Sharks live in the sea, so the sea must have covered this land long ago. Rain and waves weather the cliff and carry sediment into the bay, so the cliff keeps changing. A map shows that streams across the land drain into the Chesapeake Bay. All of that land is part of the Chesapeake watershed.",
  },
  notes: [
    { sentence: "The tooth is a fossil that came from a layer of rock in the cliff.", note: "tooth = fossil from rock layer" },
    { sentence: "Sharks live in the sea, so the sea must have covered this land long ago.", note: "sharks live in sea → land was under sea" },
    { sentence: "Rain and waves weather the cliff and carry sediment into the bay, so the cliff keeps changing.", note: "rain + waves → weathering → sediment to bay" },
    { sentence: "A map shows that streams across the land drain into the Chesapeake Bay.", note: "map: streams drain → Chesapeake Bay" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The cliffs at Calvert Cliffs keep changing",
      because: "rain and waves weather the rock.",
      but: "the change is too slow to see in one day.",
      so: "sediment slowly moves into the bay.",
    },
    {
      lesson: "B",
      kernel: "Amir's shark tooth shows the land was once under the sea",
      because: "sharks live in the sea.",
      but: "the cliff is dry land today.",
      so: "scientists use fossils as evidence of long ago.",
    },
    {
      lesson: "C",
      kernel: "Rain in Baltimore ends up in the Chesapeake Bay",
      because: "streams like Jones Falls drain into the harbor.",
      but: "the bay is far away from a rowhouse roof.",
      so: "all of that land is part of the Chesapeake watershed.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Amir made a claim.",
      parts: { when: "after his visit", how: "with clear evidence", why: "to show the land had changed" },
      model: "After his visit, Amir made a claim with clear evidence to show the land had changed.",
    },
    {
      lesson: "A",
      kernel: "Waves weather the cliff.",
      parts: { when: "every day", where: "along the Chesapeake Bay", how: "by breaking rock into small pieces" },
      model: "Every day, waves weather the cliff along the Chesapeake Bay by breaking rock into small pieces.",
    },
  ],
  fragments: [
    { text: "A fossil is in the rock layer.", is_sentence: true },
    { text: "Weathers the cliff slowly.", is_sentence: false, fix: "Rain weathers the cliff slowly." },
    { text: "According to the map.", is_sentence: false, fix: "According to the map, the streams drain into the bay." },
    { text: "Sharks live in the sea.", is_sentence: true },
    { text: "Because the layers hold fossils.", is_sentence: false, fix: "The land was once under the sea because the layers hold fossils." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Weathering, ___, slowly changes the cliff.",
      noun: "Weathering",
      options: ["the slow breaking of rock into smaller pieces", "the moving of rock pieces and soil by water, wind, or ice", "small pieces of rock, sand, and soil"],
      answer: 0,
      model: "Weathering, the slow breaking of rock into smaller pieces, slowly changes the cliff.",
    },
    {
      lesson: "B",
      sentence: "A fossil, ___, was inside a layer of the cliff.",
      noun: "fossil",
      options: ["one flat level of rock stacked on top of others", "the remains or print of an animal that lived long ago", "a natural shape on Earth's surface"],
      answer: 1,
      model: "A fossil, the remains or print of an animal that lived long ago, was inside a layer of the cliff.",
    },
    {
      lesson: "C",
      sentence: "A watershed, ___, includes the streets of Baltimore.",
      noun: "watershed",
      options: ["a statement you say is true and then prove", "facts or observations that show a claim is true", "all the land where rain and streams drain into the same bay"],
      answer: 2,
      model: "A watershed, all the land where rain and streams drain into the same bay, includes the streets of Baltimore.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "Amir believes the sea once covered this land", model: "Because sharks live in the sea, Amir believes the sea once covered this land." },
    { lesson: "A", conjunction: "since", stem: "the cliff keeps changing", model: "Since rain and waves weather the rock every day, the cliff keeps changing." },
    { lesson: "C", conjunction: "when", stem: "the water carries sediment toward the bay", model: "When rain runs into Jones Falls, the water carries sediment toward the bay." },
  ],
  spo: {
    topic: {
      l1_2: "The land [changed] because [rock layers] show it.",
      l3_4: "I claim that the land at Calvert Cliffs was once under the sea because [a shark tooth fossil] was found in [the rock layers].",
      l5_6: "Although [Calvert Cliffs is dry land today], I claim it was once under a shallow sea because, according to [the rock layers], [a shark tooth fossil] is evidence of [sea life].",
    },
    starters: [
      { type: "question", text: "How can a shark tooth prove that land used to be under the sea?" },
      { type: "appositive", text: "Calvert Cliffs, a tall wall of rock on the Chesapeake Bay, holds clues about the past." },
      { type: "subordinate", text: "Although the cliff is dry land today, its rock layers hold sea fossils." },
    ],
    details: [
      { note: "shark tooth = fossil in rock layer", lesson: "B" },
      { note: "sharks live in sea", lesson: "B" },
      { note: "layers millions of years old", lesson: "B" },
      { note: "rain + waves weather cliff", lesson: "A" },
      { note: "streams → sediment → bay", lesson: "C" },
      { note: "claim + evidence = proof", lesson: "D" },
    ],
    distractors: ["blue crabs are a Maryland favorite", "ferries cross the bay in summer"],
    conclusion: {
      l1_2: "The land [changed].",
      l3_4: "Therefore, the evidence supports my claim because [fossils] show the land was [once under the sea].",
      l5_6: "Since [the fossils], [the rock layers], and [the weathering] all point the same way, the evidence proves that [the land around the bay has changed].",
    },
  },
  prompt: {
    l1_2: "Draw Amir's shark tooth in a rock. Write 2-3 sentences that tell how the land changed. Use the words fossil and sea.",
    l3_4: "Write a paragraph that claims the land at Calvert Cliffs has changed and supports it with evidence. Use your outline, because, and according to.",
    l5_6: "Write a paragraph that argues Calvert Cliffs was once under a shallow sea and is still changing today. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["I claim that", "because", "According to", "For example,", "This shows that", "Since", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "The land changed. A shark tooth was in the rock. Sharks live in the sea.",
    l3_4: "I claim that the land at Calvert Cliffs was once under the sea because Amir found a shark tooth fossil. According to the rock layers, the fossil is millions of years old. Sharks live in the sea, so the sea must have covered this land long ago. Rain and waves also weather the cliff and carry sediment into the bay. Therefore, the evidence supports my claim because fossils show the land was once under the sea.",
    l5_6: "Although Calvert Cliffs is dry land today, I claim it was once under a shallow sea. Calvert Cliffs, a tall wall of rock on the Chesapeake Bay, holds a shark tooth fossil. According to the rock layers, the fossil is millions of years old. Since sharks live in the sea, the sea must have covered this land long ago. Rain and waves also weather the cliff every day, and they carry sediment into the bay. As shown by the map, streams across the land drain into the Chesapeake Bay. Therefore, the evidence proves that the land around the bay has changed.",
  },
  revise: [
    "Did I state my claim in the first sentence?",
    "Did I back my claim with evidence, such as a fossil or the rock layers?",
    "Did I use because or according to to link the evidence to my claim?",
    "Did I use words like weathering, sediment, and watershed correctly?",
  ],
};
