// BCPSS Writing Lab (TWR) — g1-sci-u1 · Sound & Light Waves. Contract: ../writing-schema.mjs

export default {
  title: "Why We Hear and See",
  genre: "explain",
  tip: "Have students touch a ringing bell or a ruler on a desk to feel the vibration, then say the cause and effect with so before writing.",
  lessons: [
    { id: "A", title: "Vibrations make sound" },
    { id: "B", title: "Stop the shaking, stop the sound" },
    { id: "C", title: "Transparent, translucent, and opaque" },
    { id: "D", title: "Blocked light makes a shadow" },
  ],
  source: {
    title: "The Bell and the Book",
    lesson: "A",
    text: "Jada rings a bell on the playground. The bell vibrates. We hear a sound. Jada touches the bell. It stops shaking. The sound stops. Then Jada shines a flashlight at a book. The book is opaque. It blocks the light. So the book makes a shadow.",
  },
  notes: [
    { sentence: "Jada rings a bell on the playground.", note: "rings bell → shakes → sound" },
    { sentence: "Jada touches the bell.", note: "touch → stops" },
    { sentence: "The book is opaque.", note: "book = opaque" },
    { sentence: "So the book makes a shadow.", note: "blocks light → shadow" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The bell makes a sound",
      because: "it vibrates.",
      but: "the sound stops when Jada touches it.",
      so: "we hear it across the playground.",
    },
    {
      lesson: "D",
      kernel: "The book blocks the light",
      because: "the book is opaque.",
      but: "a clear window lets the light through.",
      so: "the book makes a shadow.",
    },
    {
      lesson: "C",
      kernel: "The wax paper lets some light in",
      because: "wax paper is translucent.",
      but: "it is not clear like glass.",
      so: "the picture looks blurry.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The bell vibrates.",
      parts: { when: "when Jada rings it", where: "on the playground", how: "back and forth very fast" },
      model: "When Jada rings it, the bell vibrates back and forth very fast on the playground.",
    },
    {
      lesson: "D",
      kernel: "The book makes a shadow.",
      parts: { when: "when the flashlight shines", where: "on the wall", why: "because it blocks the light" },
      model: "When the flashlight shines, the book makes a shadow on the wall because it blocks the light.",
    },
  ],
  fragments: [
    { text: "The bell vibrates.", is_sentence: true },
    { text: "Makes a loud sound.", is_sentence: false, fix: "The bell makes a loud sound." },
    { text: "Because the book is opaque.", is_sentence: false, fix: "The book makes a shadow because it is opaque." },
    { text: "Glass is transparent.", is_sentence: true },
    { text: "Lets some light through.", is_sentence: false, fix: "Wax paper lets some light through." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Jada, ___, rings a bell.",
      noun: "Jada",
      options: ["a girl on the playground", "a shake back and forth", "a dark shape on the wall"],
      answer: 0,
      model: "Jada, a girl on the playground, rings a bell.",
    },
    {
      lesson: "D",
      sentence: "A shadow, ___, forms behind the book.",
      noun: "A shadow",
      options: ["a very loud sound", "a dark shape made when something stops light", "a clear window"],
      answer: 1,
      model: "A shadow, a dark shape made when something stops light, forms behind the book.",
    },
    {
      lesson: "A",
      sentence: "A vibration, ___, makes sound.",
      noun: "A vibration",
      options: ["a dark shape on the wall", "a bright light", "a fast shake back and forth"],
      answer: 2,
      model: "A vibration, a fast shake back and forth, makes sound.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "we hear a sound", model: "When the bell vibrates, we hear a sound." },
    { lesson: "D", conjunction: "because", stem: "it makes a shadow", model: "Because the book blocks the light, it makes a shadow." },
    { lesson: "B", conjunction: "if", stem: "the sound stops", model: "If Jada touches the bell, the sound stops." },
  ],
  spo: {
    topic: {
      l1_2: "When a [bell] [vibrates], we hear [sound].",
      l3_4: "A [bell] makes sound when it [vibrates], and an [opaque] thing blocks light, so it makes a [shadow].",
      l5_6: "Although [sound and light] seem different, both have a cause: [a vibration] makes sound, and [an opaque material] makes a shadow.",
    },
    starters: [
      { type: "question", text: "What makes a sound, and what makes a shadow?" },
      { type: "statement", text: "Sound and shadows both have a cause." },
      { type: "command", text: "Touch the bell and feel it shake." },
    ],
    details: [
      { note: "rings bell → shakes", lesson: "A" },
      { note: "vibrates = shakes fast", lesson: "A" },
      { note: "vibration → sound", lesson: "A" },
      { note: "touch → stops → no sound", lesson: "B" },
      { note: "opaque book blocks light", lesson: "C" },
      { note: "blocked light → shadow", lesson: "D" },
    ],
    distractors: ["the playground has a slide", "Jada likes recess"],
    conclusion: {
      l1_2: "So the [bell] makes [sound].",
      l3_4: "So [vibrations] cause sound, and [opaque things] cause shadows.",
      l5_6: "Because [a vibration causes sound and blocked light causes a shadow], we can [explain what we hear and see].",
    },
  },
  prompt: {
    l1_2: "Draw a bell and a shadow. Write 1-3 sentences. Use the word so.",
    l3_4: "Explain what causes a sound and what causes a shadow. Use the words so and because.",
    l5_6: "Explain how a bell makes sound and how an opaque book makes a shadow. Include an appositive and a sentence that starts with when, because, or if.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "So", "When", "That is why", "As a result,"],
  model: {
    l1_2: "The bell vibrates, so we hear sound. The book blocks light, so it makes a shadow.",
    l3_4: "When Jada rings a bell, it vibrates, so we hear a sound. If she touches the bell, the shaking stops. Then the sound stops. An opaque book blocks the light, so it makes a shadow.",
    l5_6: "A vibration, a fast shake back and forth, makes sound. When Jada rings the bell, it vibrates, so we hear a sound. If she touches the bell, the shaking stops, so the sound stops. Because the book is opaque, it blocks the light. The blocked light makes a shadow on the wall.",
  },
  revise: [
    "Did I tell the cause and then the effect?",
    "Did I use so to connect them?",
    "Did I use vibrate, opaque, or shadow the right way?",
    "Did I tell what happens when the shaking stops?",
  ],
};
