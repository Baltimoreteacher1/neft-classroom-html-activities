// BCPSS Writing Lab (TWR) — gk-ela-u1 · The Five Senses. Contract: ../writing-schema.mjs

export default {
  title: "Mia's Five Senses Day",
  genre: "inform",
  tip: "Have children point to the body part for each sense while they say the sentence, then draw before they write.",
  lessons: [
    { id: "A", title: "Seeing and hearing with eyes and ears" },
    { id: "B", title: "Smelling and tasting with nose and tongue" },
    { id: "C", title: "Touching with skin and hands" },
    { id: "D", title: "What a book is mostly about" },
  ],
  source: {
    title: "Mia at the Harbor",
    lesson: "D",
    text: "Mia visits the Inner Harbor. She sees a big ship. She hears a loud horn. She smells salty air. She tastes a sweet pretzel. She feels a cool breeze. Mia uses all five senses.",
  },
  notes: [
    { sentence: "She hears a loud horn.", note: "hear → ears" },
    { sentence: "She smells salty air.", note: "smell → nose" },
    { sentence: "She tastes a sweet pretzel.", note: "taste = tongue, sweet" },
    { sentence: "She feels a cool breeze.", note: "feel = skin, cool" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Mia smells the bread",
      because: "the bread smells so good.",
      but: "she cannot see it from here.",
      so: "she walks to the bakery.",
    },
    {
      lesson: "A",
      kernel: "Sam closes his eyes",
      because: "he wants to listen.",
      but: "he can still hear the birds.",
      so: "he cannot see the kite.",
    },
    {
      lesson: "C",
      kernel: "Jo touches the kitten",
      because: "she wants to feel its fur.",
      but: "the kitten walks away.",
      so: "she learns the fur is soft.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Mia hears a horn.",
      parts: { when: "on Saturday", where: "at the Inner Harbor", why: "because she listens closely" },
      model: "On Saturday, Mia hears a horn at the Inner Harbor because she listens closely.",
    },
    {
      lesson: "B",
      kernel: "Sam smells bread.",
      parts: { when: "after school", where: "at the market", why: "because it is fresh" },
      model: "After school, Sam smells bread at the market because it is fresh.",
    },
  ],
  fragments: [
    { text: "I hear with my ears.", is_sentence: true },
    { text: "A sweet peach.", is_sentence: false, fix: "I taste a sweet peach." },
    { text: "Smells the flower.", is_sentence: false, fix: "Mia smells the flower." },
    { text: "Tom sees a red kite.", is_sentence: true },
    { text: "Because it is loud.", is_sentence: false, fix: "I cover my ears because it is loud." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Mia, ___, hears a loud horn.",
      noun: "Mia",
      options: ["a girl at the harbor", "a very loud sound", "a sweet peach"],
      answer: 0,
      model: "Mia, a girl at the harbor, hears a loud horn.",
    },
    {
      lesson: "B",
      sentence: "The peach, ___, tastes sweet.",
      noun: "peach",
      options: ["a part of my face", "a juicy fruit", "a soft blanket"],
      answer: 1,
      model: "The peach, a juicy fruit, tastes sweet.",
    },
    {
      lesson: "C",
      sentence: "My skin, ___, feels the cool breeze.",
      noun: "skin",
      options: ["a sweet food", "a loud drum", "the outside of my body"],
      answer: 2,
      model: "My skin, the outside of my body, feels the cool breeze.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "I cover my ears", model: "When the drum is loud, I cover my ears." },
    { lesson: "B", conjunction: "if", stem: "I will taste it", model: "If it smells good, I will taste it." },
    { lesson: "C", conjunction: "after", stem: "my hands feel cold", model: "After I hold the ice, my hands feel cold." },
  ],
  spo: {
    topic: {
      l1_2: "Mia uses her [senses] at the [harbor].",
      l3_4: "Mia uses her [five senses] to learn about the [Inner Harbor].",
      l5_6: "Although the harbor is busy, Mia [learns a lot] because she [uses all five senses].",
    },
    starters: [
      { type: "question", text: "What can you learn at the harbor with your senses?" },
      { type: "appositive", text: "Mia, a girl at the harbor, uses all five senses." },
      { type: "subordinate", text: "When Mia visits the harbor, she uses her eyes and ears." },
    ],
    details: [
      { note: "sees big ship = eyes", lesson: "A" },
      { note: "hears loud horn = ears", lesson: "A" },
      { note: "smells salty air = nose", lesson: "B" },
      { note: "tastes sweet pretzel = tongue", lesson: "B" },
      { note: "feels cool breeze = skin", lesson: "C" },
      { note: "book mostly about five senses", lesson: "D" },
    ],
    distractors: ["ships carry big boxes", "Mia has a red hat"],
    conclusion: {
      l1_2: "Mia uses all her [senses]!",
      l3_4: "Mia learns a lot about the harbor because she uses her [senses].",
      l5_6: "Because Mia observes closely, she learns [what the harbor is like].",
    },
  },
  prompt: {
    l1_2: "Draw a place you visit. Write 1-3 sentences about what you see, hear, or smell.",
    l3_4: "Write about a place you visit. Tell which senses you use and what you notice. Use your outline.",
    l5_6: "Write about a place you visit and the senses you use there. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Next,", "Then,", "Also,", "Last,", "and", "too", "because"],
  model: {
    l1_2: "Mia is at the harbor. She hears a loud horn.",
    l3_4: "Mia uses her five senses at the Inner Harbor. She sees a big ship with her eyes. She hears a loud horn because the ship is close. She smells salty air too.",
    l5_6: "Mia, a girl at the Inner Harbor, uses all five senses. When the ship comes, she hears a loud horn. She smells salty air and tastes a sweet pretzel. Her skin feels a cool breeze.",
  },
  revise: [
    "Did I name the body part for each sense I used?",
    "Did I tell one detail I see, hear, or smell?",
    "Did I tell what my writing is mostly about?",
    "Did I use and, too, or because to add more?",
  ],
};
