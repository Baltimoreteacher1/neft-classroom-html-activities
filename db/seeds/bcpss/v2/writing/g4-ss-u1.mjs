// BCPSS Writing Lab (TWR) — g4-ss-u1 · Maryland Geography & Indigenous Nations. Contract: ../writing-schema.mjs

export default {
  title: "Two Rivers, Two Nations",
  genre: "inform",
  tip: "Have students color-code what is the same and what is different on a two-column chart before they write the comparison.",
  lessons: [
    { id: "A", title: "Maryland's three regions" },
    { id: "B", title: "The Chesapeake Bay and its resources" },
    { id: "C", title: "The Piscataway nation on the Potomac River" },
    { id: "D", title: "The Susquehannock nation on the Susquehanna River" },
  ],
  source: {
    title: "Rivers That Shaped Homelands",
    lesson: "B",
    text: "Two rivers flow into the Chesapeake Bay, and each one shaped a homeland. The Piscataway lived near the Potomac River in the south. They fished in the river and grew corn, beans, and squash. The Susquehannock lived along the Susquehanna River in the north. They also fished and grew corn, and they traded with many nations. The Piscataway spoke an Algonquian language, whereas the Susquehannock spoke an Iroquoian language. Both nations traveled on the rivers, but each nation had its own leaders and its own way of life.",
  },
  notes: [
    { sentence: "The Piscataway lived near the Potomac River in the south.", note: "Piscataway: Potomac River, south" },
    { sentence: "They fished in the river and grew corn, beans, and squash.", note: "fished + grew corn, beans, squash" },
    { sentence: "The Susquehannock lived along the Susquehanna River in the north.", note: "Susquehannock: Susquehanna River, north" },
    { sentence: "The Piscataway spoke an Algonquian language, whereas the Susquehannock spoke an Iroquoian language.", note: "Piscataway = Algonquian; Susquehannock = Iroquoian" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "The Piscataway lived near the Potomac River",
      because: "the river gave them fish and good farmland.",
      but: "they did not live along the Susquehanna River.",
      so: "they could fish and grow corn close to home.",
    },
    {
      lesson: "D",
      kernel: "The Susquehannock traded with many nations",
      because: "the Susquehanna River worked like a road.",
      but: "they spoke a different language than the Piscataway.",
      so: "they could share goods across long distances.",
    },
    {
      lesson: "A",
      kernel: "The Coastal Plain is flat",
      because: "it sits low beside the Chesapeake Bay.",
      but: "the Piedmont has rolling hills.",
      so: "wide fields are easy to plant on the coast.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Nations fished the bay.",
      parts: { when: "in spring", how: "with nets and traps", why: "to feed their families" },
      model: "In spring, nations fished the bay with nets and traps to feed their families.",
    },
    {
      lesson: "C",
      kernel: "The Piscataway planted corn.",
      parts: { when: "each spring", where: "near the Potomac River", why: "to have food all year" },
      model: "Each spring, the Piscataway planted corn near the Potomac River to have food all year.",
    },
  ],
  fragments: [
    { text: "The Coastal Plain is flat and low.", is_sentence: true },
    { text: "Rises in the far west of Maryland.", is_sentence: false, fix: "The Appalachian Mountains rise in the far west of Maryland." },
    { text: "Whereas the Susquehannock lived in the north.", is_sentence: false, fix: "The Piscataway lived in the south, whereas the Susquehannock lived in the north." },
    { text: "Both nations grew corn.", is_sentence: true },
    { text: "Where rivers meet the sea.", is_sentence: false, fix: "An estuary is a place where rivers meet the sea." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Piedmont, ___, lies in the middle of Maryland.",
      noun: "Piedmont",
      options: ["a region of rolling hills", "the flat, low land along the bay", "the high, forested ridges in the far west"],
      answer: 0,
      model: "The Piedmont, a region of rolling hills, lies in the middle of Maryland.",
    },
    {
      lesson: "B",
      sentence: "The Chesapeake Bay, ___, gave nations fish and oysters.",
      noun: "Chesapeake Bay",
      options: ["the high ridges in the west of Maryland", "an estuary where river water mixes with salt water", "a large group of people with their own land and leaders"],
      answer: 1,
      model: "The Chesapeake Bay, an estuary where river water mixes with salt water, gave nations fish and oysters.",
    },
    {
      lesson: "C",
      sentence: "The Piscataway, ___, lived near the Potomac River.",
      noun: "Piscataway",
      options: ["a region of rolling hills in the middle of Maryland", "something from nature that people can use", "an Indigenous nation of southern Maryland"],
      answer: 2,
      model: "The Piscataway, an Indigenous nation of southern Maryland, lived near the Potomac River.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "although", stem: "the Susquehannock lived in the north", model: "Although both nations lived near rivers, the Susquehannock lived in the north." },
    { lesson: "C", conjunction: "because", stem: "the Piscataway fished in the Potomac", model: "Because the river was full of fish, the Piscataway fished in the Potomac." },
    { lesson: "A", conjunction: "while", stem: "the Coastal Plain is flat", model: "While the Piedmont has rolling hills, the Coastal Plain is flat." },
  ],
  spo: {
    topic: {
      l1_2: "The [Piscataway] and the [Susquehannock] are [alike] and [different].",
      l3_4: "Both the Piscataway and the Susquehannock [lived near rivers], whereas the Piscataway lived [in the south] and the Susquehannock [in the north].",
      l5_6: "Although [the Piscataway and the Susquehannock] both [relied on rivers], each nation [shaped its own way of life] along [a different river].",
    },
    starters: [
      { type: "question", text: "How were two nations on two rivers alike and different?" },
      { type: "appositive", text: "The Piscataway, an Indigenous nation of southern Maryland, lived near the Potomac River." },
      { type: "subordinate", text: "Although the two nations lived far apart, both depended on rivers." },
    ],
    details: [
      { note: "both: rivers → Chesapeake Bay", lesson: "B" },
      { note: "both fished + grew corn", lesson: "B" },
      { note: "Piscataway: Potomac, south", lesson: "C" },
      { note: "Piscataway = Algonquian", lesson: "C" },
      { note: "Susquehannock: Susquehanna, north", lesson: "D" },
      { note: "Susquehannock = Iroquoian, traders", lesson: "D" },
    ],
    distractors: ["Baltimore is Maryland's biggest city", "ships carry cargo into the harbor"],
    conclusion: {
      l1_2: "Both lived near [rivers].",
      l3_4: "In contrast, the Piscataway [lived in the south] and the Susquehannock [lived in the north].",
      l5_6: "In the end, [rivers] connected both nations to the bay, whereas [language and homeland] made each [nation's way of life] its own.",
    },
  },
  prompt: {
    l1_2: "Draw two rivers and a nation beside each one. Write 2-3 sentences that tell how they are alike and different. Use the words both and river.",
    l3_4: "Write a paragraph that compares the Piscataway and the Susquehannock. Use your outline, both, and whereas.",
    l5_6: "Write a paragraph that compares how the Piscataway and the Susquehannock lived along their rivers. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["First,", "Both", "Whereas", "In contrast,", "Unlike", "However,", "For example,", "In the end,"],
  model: {
    l1_2: "The Piscataway lived near a river. The Susquehannock lived near a river. Both fished and grew corn.",
    l3_4: "Both the Piscataway and the Susquehannock lived near rivers that flow into the Chesapeake Bay. They both fished and grew corn. The Piscataway lived near the Potomac River in the south, whereas the Susquehannock lived along the Susquehanna River in the north. The Piscataway spoke an Algonquian language. In contrast, the Susquehannock spoke an Iroquoian language.",
    l5_6: "Although the Piscataway and the Susquehannock lived far apart, both nations relied on rivers. The Piscataway, an Indigenous nation of southern Maryland, lived near the Potomac River. They fished and grew corn, beans, and squash. In contrast, the Susquehannock lived along the Susquehanna River in the north, and they traded with many nations. The Piscataway spoke an Algonquian language, whereas the Susquehannock spoke an Iroquoian language. Both nations traveled on their rivers to reach the bay. In the end, rivers connected both nations to the bay, but each nation kept its own way of life.",
  },
  revise: [
    "Did I use both, whereas, or in contrast to compare the two nations?",
    "Did I give a detail for each side, such as a river or a language?",
    "Did I use the correct names, Piscataway and Susquehannock?",
    "Did I tell how the land and water shaped their lives?",
  ],
};
