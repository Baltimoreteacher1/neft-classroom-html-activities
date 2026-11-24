// BCPSS Writing Lab (TWR) — gk-sci-u1 · Weather & Sunlight Patterns. Contract: ../writing-schema.mjs

export default {
  title: "The Sun Warms Baltimore",
  genre: "explain",
  tip: "Touch a sunny and a shady spot outside, then have children say the cause with so before they write.",
  lessons: [
    { id: "A", title: "Daily weather in Baltimore" },
    { id: "B", title: "The sun warms the ground" },
    { id: "C", title: "Sun and shade" },
    { id: "D", title: "Seasons and weather patterns" },
  ],
  source: {
    title: "A Sunny Day",
    lesson: "B",
    text: "It is sunny in Baltimore. The sun shines on the sidewalk. The sidewalk gets warm. A cloud floats by. The sun is hidden. The sidewalk feels cooler.",
  },
  notes: [
    { sentence: "The sun shines on the sidewalk.", note: "sun → sidewalk warm" },
    { sentence: "The sidewalk gets warm.", note: "sidewalk = warm" },
    { sentence: "A cloud floats by.", note: "cloud passes" },
    { sentence: "The sidewalk feels cooler.", note: "cooler" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The sidewalk gets warm",
      because: "the sun shines on it.",
      but: "it feels cooler in the shade.",
      so: "we put on sunscreen.",
    },
    {
      lesson: "C",
      kernel: "Kai sits in the shade",
      because: "the sun is too hot.",
      but: "his friends still play in the sun.",
      so: "he feels cool.",
    },
    {
      lesson: "D",
      kernel: "Winter days feel cold",
      because: "there is less sunlight.",
      but: "some winter days are sunny.",
      so: "we wear coats and hats.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The sun shines.",
      parts: { when: "on summer days", how: "brightly", where: "on the playground" },
      model: "On summer days, the sun shines brightly on the playground.",
    },
    {
      lesson: "A",
      kernel: "Rain falls.",
      parts: { when: "on Wednesday", how: "softly", where: "on the Inner Harbor" },
      model: "On Wednesday, rain falls softly on the Inner Harbor.",
    },
  ],
  fragments: [
    { text: "The sun is bright.", is_sentence: true },
    { text: "Warms the sand.", is_sentence: false, fix: "The sun warms the sand." },
    { text: "Shade is cool.", is_sentence: true },
    { text: "Because it is cloudy.", is_sentence: false, fix: "It is dark because it is cloudy." },
    { text: "A rainy day in Baltimore.", is_sentence: false, fix: "It is a rainy day in Baltimore." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "The sun, ___, warms the sidewalk.",
      noun: "sun",
      options: ["a star that gives light and heat", "a white puff in the sky", "a cool spot under a tree"],
      answer: 0,
      model: "The sun, a star that gives light and heat, warms the sidewalk.",
    },
    {
      lesson: "C",
      sentence: "Shade, ___, feels cool.",
      noun: "Shade",
      options: ["a guess about tomorrow's weather", "a dark spot where the sun is blocked", "the light from the sun"],
      answer: 1,
      model: "Shade, a dark spot where the sun is blocked, feels cool.",
    },
    {
      lesson: "A",
      sentence: "A forecast, ___, helps us plan our day.",
      noun: "forecast",
      options: ["a part of the year", "a white puff in the sky", "a guess about tomorrow's weather"],
      answer: 2,
      model: "A forecast, a guess about tomorrow's weather, helps us plan our day.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the sidewalk gets warm", model: "When the sun shines on it, the sidewalk gets warm." },
    { lesson: "C", conjunction: "if", stem: "I sit in the shade", model: "If the sun is too hot, I sit in the shade." },
    { lesson: "D", conjunction: "because", stem: "we wear coats", model: "Because winter is cold, we wear coats." },
  ],
  spo: {
    topic: {
      l1_2: "The sun makes the [sidewalk] [warm].",
      l3_4: "The sun shines on the [sidewalk], so it gets [warm].",
      l5_6: "Although [clouds] can hide the sun, [sunlight] still [warms things on sunny days].",
    },
    starters: [
      { type: "question", text: "What does the sun do to a sidewalk?" },
      { type: "appositive", text: "The sun, a star in the sky, warms the sidewalk." },
      { type: "subordinate", text: "When the sun shines, the sidewalk gets warm." },
    ],
    details: [
      { note: "sun shines on sidewalk", lesson: "B" },
      { note: "sidewalk gets warm", lesson: "B" },
      { note: "cloud hides sun", lesson: "A" },
      { note: "cooler w/out sun", lesson: "A" },
      { note: "tree makes shade", lesson: "C" },
      { note: "shade = cool", lesson: "C" },
    ],
    distractors: ["rain makes puddles", "the Inner Harbor has boats"],
    conclusion: {
      l1_2: "So I stay [cool] in the [shade].",
      l3_4: "A tree makes shade, so I stay [cool] on a [hot] day.",
      l5_6: "Because the sun [warms] the ground, I [sit in the shade] to stay cool.",
    },
  },
  prompt: {
    l1_2: "Draw a sunny day. Write 1-3 sentences. Tell what the sun does and what you do.",
    l3_4: "Write about what the sun does on a sunny day. Use so to tell the cause and effect. Use your outline.",
    l5_6: "Explain how the sun changes things on a sunny day. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Next,", "Then,", "So", "because", "but", "when", "also"],
  model: {
    l1_2: "The sun shines on the sidewalk. The sidewalk gets warm.",
    l3_4: "The sun shines on the sidewalk, so it gets warm. A cloud hides the sun, so the sidewalk feels cooler. A tree makes shade, so I stay cool.",
    l5_6: "The sun, a star that gives light and heat, shines on the sidewalk. When the sun shines, the sidewalk gets warm. Because a cloud hides the sun, the sidewalk feels cooler. In the shade, I stay cool.",
  },
  revise: [
    "Did I tell what the sun does?",
    "Did I use so to show cause and effect?",
    "Did I tell what happens in the shade or with a cloud?",
    "Did I use weather words like sunny, warm, or cool?",
  ],
};
