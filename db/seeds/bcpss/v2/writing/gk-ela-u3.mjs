// BCPSS Writing Lab (TWR) — gk-ela-u3 · America, Then and Now. Contract: ../writing-schema.mjs

export default {
  title: "Long Ago and Today",
  genre: "inform",
  tip: "Fold a paper in half, label one side long ago and one side today, and have children draw before they compare.",
  lessons: [
    { id: "A", title: "Long ago and today: how things change" },
    { id: "B", title: "Getting around: wagons, streetcars, buses" },
    { id: "C", title: "Light at night: candles and bulbs" },
    { id: "D", title: "Schools then and now" },
  ],
  source: {
    title: "Streetcars and Buses",
    lesson: "B",
    text: "Long ago, Baltimore had streetcars. Horses pulled them down the street. Today, buses carry people. Light Rail trains do too. Both help people travel. Long ago, people used candles. Today, we use light bulbs.",
  },
  notes: [
    { sentence: "Horses pulled them down the street.", note: "horses pull streetcar" },
    { sentence: "Today, buses carry people.", note: "now: buses" },
    { sentence: "Long ago, people used candles.", note: "past: candles" },
    { sentence: "Today, we use light bulbs.", note: "now: light bulbs" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "People ride buses today",
      because: "buses are fast and warm.",
      but: "long ago people rode in wagons.",
      so: "people can get to school quickly.",
    },
    {
      lesson: "C",
      kernel: "Long ago, people used candles",
      because: "they had no light bulbs yet.",
      but: "today we use light bulbs.",
      so: "the rooms were dim at night.",
    },
    {
      lesson: "D",
      kernel: "Ben and Ava both go to school",
      because: "kids need to learn.",
      but: "one used a slate and one uses a tablet.",
      so: "school is alike in some ways.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Horses pulled streetcars.",
      parts: { when: "long ago", where: "down the street in Baltimore", why: "to carry people to work" },
      model: "Long ago, horses pulled streetcars down the street in Baltimore to carry people to work.",
    },
    {
      lesson: "D",
      kernel: "Ava uses a tablet.",
      parts: { when: "today", where: "at school", why: "to read and write" },
      model: "Today, Ava uses a tablet at school to read and write.",
    },
  ],
  fragments: [
    { text: "Both help people travel.", is_sentence: true },
    { text: "Long ago, in a wagon.", is_sentence: false, fix: "Long ago, Ben rode in a wagon." },
    { text: "Today, Ava rides a bus.", is_sentence: true },
    { text: "Because candles give light.", is_sentence: false, fix: "People used candles because candles give light." },
    { text: "Pulled them down the street.", is_sentence: false, fix: "Horses pulled them down the street." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Baltimore, ___, had streetcars long ago.",
      noun: "Baltimore",
      options: ["a stick of wax", "a city in Maryland", "a cart with four wheels"],
      answer: 1,
      model: "Baltimore, a city in Maryland, had streetcars long ago.",
    },
    {
      lesson: "C",
      sentence: "A candle, ___, gave light long ago.",
      noun: "candle",
      options: ["a stick of wax with a flame", "a tool for talking far away", "a train that runs fast"],
      answer: 0,
      model: "A candle, a stick of wax with a flame, gave light long ago.",
    },
    {
      lesson: "A",
      sentence: "A telephone, ___, helps us talk today.",
      noun: "telephone",
      options: ["a stick of wax with a flame", "a cart a horse can pull", "a tool for talking to someone far away"],
      answer: 2,
      model: "A telephone, a tool for talking to someone far away, helps us talk today.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "people rode in wagons", model: "When there were no cars, people rode in wagons." },
    { lesson: "C", conjunction: "because", stem: "we use light bulbs", model: "Because they are bright and safe, we use light bulbs." },
    { lesson: "D", conjunction: "although", stem: "they both go to school", model: "Although Ben and Ava learn in different ways, they both go to school." },
  ],
  spo: {
    topic: {
      l1_2: "[Travel] was different long ago and today.",
      l3_4: "Long ago, people [traveled in wagons], but today people [ride buses].",
      l5_6: "Although people have always needed to travel, [the way they travel] has changed [from wagons to buses].",
    },
    starters: [
      { type: "question", text: "How did people travel long ago?" },
      { type: "appositive", text: "Baltimore, a city by the Bay, had streetcars long ago." },
      { type: "subordinate", text: "Although wagons were slow, people used them long ago." },
    ],
    details: [
      { note: "long ago: wagons", lesson: "A" },
      { note: "horses pulled streetcars", lesson: "B" },
      { note: "today: buses, Light Rail", lesson: "B" },
      { note: "wagon = slow, bus = fast", lesson: "A" },
      { note: "both carry people", lesson: "A" },
      { note: "both have wheels", lesson: "B" },
    ],
    distractors: ["candles give light", "Ben used a slate"],
    conclusion: {
      l1_2: "Both help people [travel].",
      l3_4: "Both wagons and buses help people [travel].",
      l5_6: "Although the ways are different, both [wagons and buses] help people [get where they go].",
    },
  },
  prompt: {
    l1_2: "Draw how people travel long ago and today. Write 1-3 sentences to compare.",
    l3_4: "Write about how travel was different long ago and today. Use both and but. Use your outline.",
    l5_6: "Compare travel long ago and today. Include an appositive and a sentence that starts with although or when.",
  },
  transitions: ["Long ago,", "Today,", "Now,", "But", "Both", "Also,", "and", "too"],
  model: {
    l1_2: "Long ago, people rode in wagons. Today, people ride buses.",
    l3_4: "Long ago, people traveled in wagons, but today people ride buses. A wagon was slow. A bus is fast. Both help people travel.",
    l5_6: "Baltimore, a city by the Bay, had streetcars long ago. Horses pulled them down the street. Although streetcars and buses are different, both help people travel. Today, buses carry people to school.",
  },
  revise: [
    "Did I tell what it was like long ago and what it is like today?",
    "Did I use but to show a difference?",
    "Did I use both to show what is the same?",
    "Did I use time words like long ago and today?",
  ],
};
