// BCPSS Writing Lab (TWR) — g5-sci-u2 · Matter & Energy in Ecosystems. Contract: ../writing-schema.mjs

export default {
  title: "From Sunlight to Striped Bass",
  genre: "explain",
  tip: "Have students draw the food chain as arrows from the sun to the bass before they write, then read the arrows aloud with First, Next, Then.",
  lessons: [
    { id: "A", title: "Producers make food from sunlight" },
    { id: "B", title: "Consumers and food chains" },
    { id: "C", title: "Food webs of the Chesapeake Bay" },
    { id: "D", title: "Decomposers return nutrients" },
  ],
  source: {
    title: "Energy for a Striped Bass",
    lesson: "B",
    text: "Energy for a striped bass starts with the sun. Tiny algae in the Chesapeake Bay use sunlight to make food. Then a school of menhaden eats the algae, so the energy moves into the fish. Next, a striped bass eats a menhaden, and the energy moves again. When the bass dies, bacteria break down its body. Finally, the nutrients return to the water, and new algae use them to grow.",
  },
  notes: [
    { sentence: "Tiny algae in the Chesapeake Bay use sunlight to make food.", note: "algae + sunlight → food" },
    { sentence: "Then a school of menhaden eats the algae, so the energy moves into the fish.", note: "menhaden eat algae → energy moves" },
    { sentence: "Next, a striped bass eats a menhaden, and the energy moves again.", note: "bass eats menhaden → energy moves" },
    { sentence: "When the bass dies, bacteria break down its body.", note: "bass dies → bacteria break down" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Tiny algae are producers",
      because: "they use sunlight to make their own food.",
      but: "they cannot make food in the dark.",
      so: "the energy in the Bay begins with the sun.",
    },
    {
      lesson: "B",
      kernel: "A menhaden eats algae",
      because: "it needs energy to swim and grow.",
      but: "it cannot make its own food.",
      so: "it is called a consumer.",
    },
    {
      lesson: "D",
      kernel: "Bacteria break down a dead striped bass",
      because: "decomposers get energy from dead organisms.",
      but: "they do not hunt other animals.",
      so: "nutrients return to the water for algae to use.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Algae make food.",
      parts: { where: "in the sunny water of the Bay", how: "with sunlight, water, and carbon dioxide", why: "to grow" },
      model: "In the sunny water of the Bay, algae make food with sunlight, water, and carbon dioxide to grow.",
    },
    {
      lesson: "C",
      kernel: "An osprey caught a menhaden.",
      parts: { when: "at sunrise", where: "over the Chesapeake Bay", how: "with its sharp claws", why: "to feed its chicks" },
      model: "At sunrise, an osprey caught a menhaden over the Chesapeake Bay with its sharp claws to feed its chicks.",
    },
  ],
  fragments: [
    { text: "A producer makes its own food.", is_sentence: true },
    { text: "Because the algae use sunlight.", is_sentence: false, fix: "The Bay food web begins with the sun because the algae use sunlight." },
    { text: "A striped bass eats a menhaden.", is_sentence: true },
    { text: "Eats the algae and moves the energy.", is_sentence: false, fix: "The menhaden eats the algae and moves the energy." },
    { text: "Which return nutrients to the water.", is_sentence: false, fix: "Bacteria break down dead animals, which return nutrients to the water." },
    { text: "When the bass dies.", is_sentence: false, fix: "Bacteria go to work when the bass dies." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A producer, ___, can be algae or underwater grass.",
      noun: "producer",
      options: ["a living thing that breaks down dead plants and animals", "a living thing that makes its own food", "an animal that hunts and eats other animals"],
      answer: 1,
      model: "A producer, a living thing that makes its own food, can be algae or underwater grass.",
    },
    {
      lesson: "B",
      sentence: "A menhaden, ___, eats tiny algae.",
      noun: "menhaden",
      options: ["a small fish that swims in schools", "a living thing that breaks down dead plants", "a gas that plants take in"],
      answer: 0,
      model: "A menhaden, a small fish that swims in schools, eats tiny algae.",
    },
    {
      lesson: "D",
      sentence: "A decomposer, ___, returns nutrients to the water.",
      noun: "decomposer",
      options: ["an animal that hunts and eats other animals", "many food chains linked together", "a living thing that breaks down dead plants and animals"],
      answer: 2,
      model: "A decomposer, a living thing that breaks down dead plants and animals, returns nutrients to the water.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the energy in the Bay begins with the sun", model: "Because algae use sunlight to make food, the energy in the Bay begins with the sun." },
    { lesson: "C", conjunction: "when", stem: "the energy moves to the osprey", model: "When an osprey catches a menhaden, the energy moves to the osprey." },
    { lesson: "D", conjunction: "after", stem: "bacteria break it down", model: "After the striped bass dies, bacteria break it down." },
  ],
  spo: {
    topic: {
      l1_2: "Energy moves from the [sun] to the [striped bass].",
      l3_4: "First, the [algae] use sunlight to make [food]. Next, the [menhaden] eats the [algae], so the energy moves to the [fish].",
      l5_6: "Although [a striped bass never touches sunlight], its energy comes from the sun through [a chain of producers and consumers] and returns to the water through [decomposers].",
    },
    starters: [
      { type: "question", text: "How does energy from the sun reach a striped bass?" },
      { type: "appositive", text: "A striped bass, a big fish of the Chesapeake Bay, gets its energy from the sun in several steps." },
      { type: "subordinate", text: "Although the sun is far away, its energy powers every animal in the Bay." },
    ],
    details: [
      { note: "algae use sunlight to make food", lesson: "A" },
      { note: "menhaden eat algae → energy moves", lesson: "B" },
      { note: "striped bass eats menhaden → energy moves", lesson: "B" },
      { note: "osprey also eats menhaden", lesson: "C" },
      { note: "bass dies → bacteria break it down", lesson: "D" },
      { note: "nutrients return to water for algae", lesson: "D" },
    ],
    distractors: ["Maryland picked the striped bass as its state fish", "blue crabs have two big claws"],
    conclusion: {
      l1_2: "The energy [moves] up the [food web].",
      l3_4: "Finally, the [decomposers] break down the dead [bass] and return [nutrients] to the water.",
      l5_6: "As a result, [energy flows up the food web] while [matter cycles back to the water], so [the Bay keeps its algae growing].",
    },
  },
  prompt: {
    l1_2: "Draw the sun, algae, a menhaden, and a striped bass with arrows. Write 2-4 sentences. Tell how the energy moves.",
    l3_4: "Write a paragraph that explains how energy gets from the sun to a striped bass. Use your outline and the words First, Next, Then, and Finally.",
    l5_6: "Write a paragraph that explains how energy and matter move from the sun to a striped bass and back to the water. Include an appositive and a sentence that starts with although or when.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "When", "Finally,", "So", "As a result,"],
  model: {
    l1_2: "Energy starts with the sun. Algae make food, and a menhaden eats the algae. A striped bass eats the menhaden.",
    l3_4: "Energy for a striped bass starts with the sun. First, tiny algae use sunlight to make food. Next, a menhaden eats the algae, so the energy moves to the fish. Then a striped bass eats the menhaden, and the energy moves again. Finally, when the bass dies, bacteria break down its body and return nutrients to the water.",
    l5_6: "Although a striped bass never touches sunlight, the energy it uses began with the sun. First, tiny algae, the producers of the Bay, use sunlight to make their own food. Next, a menhaden eats the algae, so the energy moves into the fish. Then a striped bass eats the menhaden, and the energy moves up the food web again. When the bass dies, bacteria break down its body, so the nutrients return to the water. As a result, new algae can use those nutrients to grow, and the cycle begins again.",
  },
  mpo: {
    thesis: "Energy from the sun moves through the Chesapeake Bay food web in steps, and matter returns to the water through decomposers.",
    paragraphs: [
      { topic: "Producers capture the energy of the sun.", notes: ["algae + sunlight → food", "algae and underwater grasses", "producers make own food"] },
      { topic: "Consumers pass the energy up the food web.", notes: ["menhaden eat algae", "striped bass eats menhaden", "osprey also eats menhaden"] },
      { topic: "Decomposers return nutrients to the water.", notes: ["bass dies → bacteria", "nutrients return to water", "algae use nutrients again"] },
    ],
    conclusion: "Energy flows up the food web from the sun, while nutrients cycle back to the water, so all the living things in the Bay stay connected.",
  },
  revise: [
    "Did I start with the sun and put every step in order?",
    "Did I name each living thing as a producer, a consumer, or a decomposer?",
    "Did I explain what happens to the energy at each step with so or then?",
    "Did I tell what happens to the nutrients when the bass dies?",
  ],
};
