// BCPSS Writing Lab (TWR) — g3-ss-u4 · Interdependence, Specialization & Trade. Contract: ../writing-schema.mjs

export default {
  title: "Cars, Corn, and the Port",
  genre: "explain",
  tip: "Have students draw the chain of workers as arrows first, then write one cause-and-effect sentence for each arrow.",
  lessons: [
    { id: "A", title: "Producers, consumers, and interdependence" },
    { id: "B", title: "Specialization: doing one job well" },
    { id: "C", title: "Trade and the Port of Baltimore" },
    { id: "D", title: "Imports and exports" },
  ],
  source: {
    title: "Work at the Port",
    lesson: "B",
    text: "Many ships bring cars to the Port of Baltimore. Dockworkers specialize in driving the cars off the ships. Because they do this job every day, they work fast and safely. As a result, trucks and trains can carry the cars to car dealers. Families then buy the cars they need. The same port sends goods away. Farmers grow corn, so ships export it to other countries. Each worker needs the others, which leads to more trade.",
  },
  notes: [
    { sentence: "Dockworkers specialize in driving the cars off the ships.", note: "dockworkers specialize: cars off ships" },
    { sentence: "Because they do this job every day, they work fast and safely.", note: "same job daily → fast + safe" },
    { sentence: "As a result, trucks and trains can carry the cars to car dealers.", note: "→ trucks + trains → dealers" },
    { sentence: "Farmers grow corn, so ships export it to other countries.", note: "farmers grow corn → export" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Dockworkers work fast and safely",
      because: "they specialize in the same job every day.",
      but: "they do not grow the corn that the ships carry.",
      so: "cars and goods move quickly through the port.",
    },
    {
      lesson: "D",
      kernel: "Ships export corn from Baltimore",
      because: "other countries need food from American farms.",
      but: "ships also import goods from other countries.",
      so: "trade goes both ways at the port.",
    },
    {
      lesson: "A",
      kernel: "Farmers are producers",
      because: "they grow goods like corn.",
      but: "farmers are also consumers of other goods.",
      so: "they buy tools and food from other workers.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Ships carried cars.",
      parts: { when: "this morning", how: "across the ocean", where: "to the Port of Baltimore", why: "so families could buy them" },
      model: "This morning, ships carried cars across the ocean to the Port of Baltimore so families could buy them.",
    },
    {
      lesson: "C",
      kernel: "Trucks hauled goods.",
      parts: { when: "after the ships unloaded", where: "across the country", how: "on long highways", why: "to reach the stores" },
      model: "After the ships unloaded, trucks hauled goods on long highways across the country to reach the stores.",
    },
  ],
  fragments: [
    { text: "Dockworkers specialize in unloading ships.", is_sentence: true },
    { text: "Because they do the job every day.", is_sentence: false, fix: "They work fast because they do the job every day." },
    { text: "Farmers are producers.", is_sentence: true },
    { text: "Ships export corn to other countries.", is_sentence: true },
    { text: "To other countries across the ocean.", is_sentence: false, fix: "Ships carry corn to other countries across the ocean." },
    { text: "Which leads to more trade.", is_sentence: false, fix: "A fast port leads to more trade." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A producer, ___, can be a farmer who grows corn.",
      noun: "producer",
      options: ["a person who buys and uses goods", "a person or business that makes or grows goods", "to send goods to another country to sell"],
      answer: 1,
      model: "A producer, a person or business that makes or grows goods, can be a farmer who grows corn.",
    },
    {
      lesson: "C",
      sentence: "The Port of Baltimore, ___, connects Maryland to the world.",
      noun: "Port of Baltimore",
      options: ["a place by the water where ships load and unload", "the goods that a ship carries", "doing one job very well"],
      answer: 0,
      model: "The Port of Baltimore, a place by the water where ships load and unload, connects Maryland to the world.",
    },
    {
      lesson: "D",
      sentence: "An export, ___, can be corn or coal.",
      noun: "export",
      options: ["a good brought in from another country", "a person who buys and uses goods", "a good sent to another country to sell"],
      answer: 2,
      model: "An export, a good sent to another country to sell, can be corn or coal.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "dockworkers work fast and safely", model: "Because they specialize in unloading, dockworkers work fast and safely." },
    { lesson: "C", conjunction: "since", stem: "trucks and trains can reach many cities", model: "Since the port moves goods quickly, trucks and trains can reach many cities." },
    { lesson: "A", conjunction: "when", stem: "everyone gets the goods they need", model: "When each worker does one job well, everyone gets the goods they need." },
  ],
  spo: {
    topic: {
      l1_2: "The [port] helps [trade].",
      l3_4: "Because dockworkers specialize in [unloading ships], [cargo moves quickly], which leads to [more trade].",
      l5_6: "Because [dockworkers, workers who unload ships all day,] specialize in one job, [cargo moves quickly], which leads to [trade with countries far away].",
    },
    starters: [
      { type: "question", text: "What happens when workers do one job really well?" },
      { type: "appositive", text: "Dockworkers, workers who unload ships, help goods move quickly." },
      { type: "subordinate", text: "When ships unload fast, trucks and trains can start moving goods sooner." },
    ],
    details: [
      { note: "dockworkers specialize: cars off ships", lesson: "B" },
      { note: "same job daily → fast + safe", lesson: "B" },
      { note: "trucks + trains → dealers", lesson: "C" },
      { note: "families buy cars they need", lesson: "A" },
      { note: "farmers grow corn → export", lesson: "D" },
      { note: "each worker needs the others", lesson: "A" },
    ],
    distractors: ["ships can be very large", "the port is on the Patapsco River"],
    conclusion: {
      l1_2: "Trade helps [everyone].",
      l3_4: "As a result, [people] can [get the goods they need].",
      l5_6: "As a result, [workers who depend on each other] can [bring goods to families here and send goods to countries far away].",
    },
  },
  prompt: {
    l1_2: "Draw a ship at the port. Write 2-3 sentences. Tell what the workers do.",
    l3_4: "Explain what happens when dockworkers specialize in unloading ships and why it matters. Use because, so, and as a result.",
    l5_6: "Explain how specialization at the Port of Baltimore leads to trade. Include an appositive, a sentence that starts with because or when, and the final effect.",
  },
  transitions: ["First,", "Because", "So", "Since", "As a result,", "This leads to", "For example,", "Finally,"],
  model: {
    l1_2: "Dockworkers unload ships. They work fast. Families get cars.",
    l3_4: "Because dockworkers specialize in unloading ships, cargo moves quickly. They do the same job every day, so they work fast and safely. As a result, trucks and trains carry the cars to dealers. Then families can buy the cars they need. This leads to more trade at the port.",
    l5_6: "Because dockworkers, workers who unload ships all day, specialize in one job, cargo moves quickly through the Port of Baltimore. Since they do the same job every day, they work fast and safely. As a result, trucks and trains can carry cars to dealers, and families can buy them. When ships leave with corn, farmers earn money, which leads to more trade with other countries. Every worker in the chain needs the others, so the whole system depends on each person's job.",
  },
  revise: [
    "Did I tell what causes each effect, using because or so?",
    "Did I use leads to or as a result to link a cause to an effect?",
    "Did I use a trade word, like specialize or export, correctly?",
    "Did I show how one worker depends on another?",
  ],
};
