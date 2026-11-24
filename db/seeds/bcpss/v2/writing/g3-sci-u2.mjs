// BCPSS Writing Lab (TWR) — g3-sci-u2 · Life Cycles & Inherited Traits. Contract: ../writing-schema.mjs

export default {
  title: "Where Traits Come From",
  genre: "inform",
  tip: "Use a three-column chart (inherited, environment, learned) so students sort each trait before they define it.",
  lessons: [
    { id: "A", title: "Life cycles: from seed or egg to adult" },
    { id: "B", title: "Metamorphosis: a big change in body shape" },
    { id: "C", title: "Inherited traits from parents" },
    { id: "D", title: "Traits shaped by the environment and by learning" },
  ],
  source: {
    title: "Nia's Kitten and Tomato Plant",
    lesson: "C",
    text: "A trait is a feature of a living thing, such as fur color or leaf shape. An inherited trait is a trait that offspring get from their parents. Nia's gray kitten has the same fur color as its mother, so fur color is an inherited trait. Some traits are not inherited. Nia's tomato plant grew tall on the sunny porch, but a plant of the same kind in the shade stayed short. That height comes from the environment. Nia also taught the kitten to come when called. That is a learned trait.",
  },
  notes: [
    { sentence: "An inherited trait is a trait that offspring get from their parents.", note: "inherited = from parents" },
    { sentence: "Nia's gray kitten has the same fur color as its mother, so fur color is an inherited trait.", note: "kitten fur = mom's → inherited" },
    { sentence: "Nia's tomato plant grew tall on the sunny porch, but a plant of the same kind in the shade stayed short.", note: "sun → tall, shade → short = environment" },
    { sentence: "Nia also taught the kitten to come when called.", note: "taught kitten = learned trait" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Fur color is an inherited trait",
      because: "kittens get it from their parents.",
      but: "a scar from an injury is not inherited.",
      so: "a kitten often has fur like its mother's.",
    },
    {
      lesson: "D",
      kernel: "Height can be an environmental trait",
      because: "a plant in the sun grows taller than a plant in the shade.",
      but: "the two plants are the same kind.",
      so: "we know the sunlight caused the difference.",
    },
    {
      lesson: "D",
      kernel: "A kitten can learn to come when called",
      because: "Nia taught it with patient practice.",
      but: "learned traits are not passed down to young.",
      so: "we classify it as a learned trait, not an inherited trait.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The caterpillar ate.",
      parts: { when: "every day", where: "on the milkweed leaf", how: "very quickly", why: "to grow bigger" },
      model: "Every day, the caterpillar ate very quickly on the milkweed leaf to grow bigger.",
    },
    {
      lesson: "A",
      kernel: "The seed sprouted.",
      parts: { when: "after the spring rain", how: "into a tiny green plant", where: "in Nia's garden", why: "because it had water and sunlight" },
      model: "After the spring rain, the seed sprouted into a tiny green plant in Nia's garden because it had water and sunlight.",
    },
  ],
  fragments: [
    { text: "A trait is a feature of a living thing.", is_sentence: true },
    { text: "Passed down from parents.", is_sentence: false, fix: "An inherited trait is passed down from parents." },
    { text: "The kitten learned to come when called.", is_sentence: true },
    { text: "Because the plant sat in the shade.", is_sentence: false, fix: "The plant stayed short because it sat in the shade." },
    { text: "Change from egg to adult.", is_sentence: false, fix: "A life cycle shows the change from egg to adult." },
    { text: "Metamorphosis is a big change in body shape.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "An inherited trait, ___, can be fur color.",
      noun: "inherited trait",
      options: ["a skill an animal learns from a person", "all the stages of a life from birth to adult", "a feature passed down from parents to their young"],
      answer: 2,
      model: "An inherited trait, a feature passed down from parents to their young, can be fur color.",
    },
    {
      lesson: "B",
      sentence: "Metamorphosis, ___, happens when a caterpillar becomes a butterfly.",
      noun: "Metamorphosis",
      options: ["a big change in body shape as a young animal grows", "the young that a plant or animal makes", "everything around a living thing"],
      answer: 0,
      model: "Metamorphosis, a big change in body shape as a young animal grows, happens when a caterpillar becomes a butterfly.",
    },
    {
      lesson: "D",
      sentence: "The environment, ___, can change how tall a plant grows.",
      noun: "environment",
      options: ["small differences among living things of one kind", "everything around a living thing, such as air, water, and sunlight", "a feature of a living thing, such as fur color"],
      answer: 1,
      model: "The environment, everything around a living thing, such as air, water, and sunlight, can change how tall a plant grows.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "fur color is an inherited trait", model: "Because kittens get their fur color from their parents, fur color is an inherited trait." },
    { lesson: "D", conjunction: "although", stem: "one plant grew taller than the other", model: "Although both plants are the same kind, one plant grew taller than the other." },
    { lesson: "A", conjunction: "after", stem: "the caterpillar forms a chrysalis", model: "After the caterpillar eats and grows, the caterpillar forms a chrysalis." },
  ],
  spo: {
    topic: {
      l1_2: "Fur color is an [inherited] trait.",
      l3_4: "An inherited trait is a feature that offspring get from their [parents], but a [learned] trait is not inherited.",
      l5_6: "An inherited trait, [a feature passed down from parents to young,] is different from [a learned trait], which [an animal picks up from experience].",
    },
    starters: [
      { type: "question", text: "How can you tell which traits come from parents?" },
      { type: "appositive", text: "Fur color, a trait that kittens get from their parents, is inherited." },
      { type: "subordinate", text: "Although the plants are the same kind, the sunny one grew taller." },
    ],
    details: [
      { note: "trait = feature of living thing", lesson: "C" },
      { note: "kitten fur = mom's fur", lesson: "C" },
      { note: "inherited = passed down from parents", lesson: "C" },
      { note: "sun → tall plant, shade → short", lesson: "D" },
      { note: "taught kitten to come = learned", lesson: "D" },
      { note: "scar from injury = not inherited", lesson: "D" },
    ],
    distractors: ["butterflies start as eggs", "tomato plants need water"],
    conclusion: {
      l1_2: "Fur color is [inherited].",
      l3_4: "So fur color is [inherited] because [it comes from the parents].",
      l5_6: "In short, [fur color is inherited], while [height in the shade and tricks are not], which means [traits come from parents, surroundings, and learning].",
    },
  },
  prompt: {
    l1_2: "Draw the kitten. Write 2-3 sentences. Tell one trait that is inherited and one that is learned.",
    l3_4: "Classify three traits: the kitten's fur color, the plant's height, and coming when called. Tell what kind of trait each one is and why.",
    l5_6: "Define inherited, environmental, and learned traits, then classify the kitten's fur color, the plant's height, and coming when called. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "Next,", "Also,", "Because", "However,", "For example,", "Unlike", "In short,"],
  model: {
    l1_2: "Fur color is an inherited trait. A kitten gets it from its parents. Coming when called is learned.",
    l3_4: "An inherited trait is a feature that offspring get from their parents. Nia's gray kitten has the same fur color as its mother, so fur color is inherited. A learned trait is not inherited, because the kitten learns it. Nia taught her kitten to come when called, so that is a learned trait. Height can come from the environment, because a plant in the shade stays short.",
    l5_6: "An inherited trait, a feature passed down from parents to their young, is different from other kinds of traits. Fur color is inherited because Nia's kitten has the same gray color as its mother. Although two tomato plants are the same kind, the one in the sun grew taller. Its height comes from the environment, not from its parents. A learned trait, such as coming when called, is not inherited either. In short, traits come from parents, surroundings, and learning.",
  },
  revise: [
    "Did I define each kind of trait before I classified it?",
    "Did I give evidence for each trait, such as the same fur color as the mother?",
    "Did I tell what a trait is NOT, like a scar or a learned trick?",
    "Did I use inherited and environment correctly?",
  ],
};
