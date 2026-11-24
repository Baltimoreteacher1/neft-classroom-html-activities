// BCPSS Writing Lab (TWR) — g1-sci-u3 · Sky Patterns: Sun, Moon & Stars. Contract: ../writing-schema.mjs

export default {
  title: "The Sun's Daily Pattern",
  genre: "explain",
  tip: "Act out the sun's day with a flashlight and a window so students can say first, then, and next before writing.",
  lessons: [
    { id: "A", title: "The sun rises and sets" },
    { id: "B", title: "The moon and stars at night" },
    { id: "C", title: "Patterns we can predict" },
    { id: "D", title: "Daylight changes with the seasons" },
  ],
  source: {
    title: "Maya Watches the Sun",
    lesson: "A",
    text: "Maya lives in a Baltimore rowhouse. Every morning, the sun rises in the east. At noon, the sun is high. In the evening, the sun sets in the west. Then it gets dark. The moon and stars come out. Next morning, the sun rises again. This is a pattern. Maya can predict what comes next.",
  },
  notes: [
    { sentence: "Every morning, the sun rises in the east.", note: "morning: sun rises E" },
    { sentence: "At noon, the sun is high.", note: "noon = sun high" },
    { sentence: "In the evening, the sun sets in the west.", note: "evening: sun sets W" },
    { sentence: "Maya can predict what comes next.", note: "pattern → predict" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The sun rises in the east",
      because: "Earth spins and the sun seems to move across the sky.",
      but: "the sun does not rise in the west.",
      so: "we can predict where it will rise.",
    },
    {
      lesson: "B",
      kernel: "The sun sets in the evening",
      because: "it seems to sink low in the west.",
      but: "it comes back the next morning.",
      so: "it gets dark outside.",
    },
    {
      lesson: "D",
      kernel: "Summer has more daylight than winter",
      because: "the sun stays up longer in summer.",
      but: "winter days feel short.",
      so: "children can play outside later in summer.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The sun rises.",
      parts: { when: "every morning", where: "in the east", how: "over the rowhouses" },
      model: "Every morning, the sun rises in the east over the rowhouses.",
    },
    {
      lesson: "B",
      kernel: "The moon appears.",
      parts: { when: "at night", where: "in the sky", how: "as a thin curve" },
      model: "At night, the moon appears in the sky as a thin curve.",
    },
  ],
  fragments: [
    { text: "The sun sets in the west.", is_sentence: true },
    { text: "Rises in the east every day.", is_sentence: false, fix: "The sun rises in the east every day." },
    { text: "Because the sun is high at noon.", is_sentence: false, fix: "It is bright at noon because the sun is high." },
    { text: "The moon has phases.", is_sentence: true },
    { text: "A pattern that repeats.", is_sentence: false, fix: "A pattern is something that repeats." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The sun, ___, gives us light and heat.",
      noun: "The sun",
      options: ["a star that shines in the day", "the big round rock in the night sky", "a time in the morning"],
      answer: 0,
      model: "The sun, a star that shines in the day, gives us light and heat.",
    },
    {
      lesson: "A",
      sentence: "Sunrise, ___, happens in the east.",
      noun: "Sunrise",
      options: ["the time the sun goes down", "the time the sun comes up", "a thin curve of the moon"],
      answer: 1,
      model: "Sunrise, the time the sun comes up, happens in the east.",
    },
    {
      lesson: "C",
      sentence: "A pattern, ___, helps us predict what comes next.",
      noun: "A pattern",
      options: ["a ball of hot gas far away", "one of the four parts of the year", "something that happens again and again"],
      answer: 2,
      model: "A pattern, something that happens again and again, helps us predict what comes next.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "after", stem: "the moon and stars come out", model: "After the sun sets, the moon and stars come out." },
    { lesson: "A", conjunction: "when", stem: "it gets dark", model: "When the sun goes down, it gets dark." },
    { lesson: "C", conjunction: "because", stem: "Maya can predict the sunrise", model: "Because the sun follows a pattern, Maya can predict the sunrise." },
  ],
  spo: {
    topic: {
      l1_2: "The [sun] [rises] and [sets].",
      l3_4: "First the [sun] [rises] in the [east]. Then it [sets] in the [west].",
      l5_6: "Although [the sun seems to disappear at night], it follows a [pattern]: it rises in the [east], sets in the [west], and [rises again].",
    },
    starters: [
      { type: "question", text: "What does the sun do every day?" },
      { type: "statement", text: "The sun follows a pattern every day." },
      { type: "subordinate", text: "Because the sun follows a pattern, we can predict it." },
    ],
    details: [
      { note: "morning: sun rises E", lesson: "A" },
      { note: "noon: sun high", lesson: "A" },
      { note: "evening: sun sets W", lesson: "A" },
      { note: "night: moon + stars", lesson: "B" },
      { note: "next morning: sun rises again", lesson: "C" },
      { note: "summer = more daylight", lesson: "D" },
    ],
    distractors: ["Maya eats toast for breakfast", "rowhouses have white steps"],
    conclusion: {
      l1_2: "I predict the sun will [rise again].",
      l3_4: "I predict the [sun] will [rise again] tomorrow because it follows a [pattern].",
      l5_6: "Because [the sun follows a pattern every day], I can predict that [it will rise in the east again].",
    },
  },
  prompt: {
    l1_2: "Draw the sun in the morning and the evening. Write 1-3 sentences. Use first and then.",
    l3_4: "Explain the sun's pattern in order. Use first, then, and I predict.",
    l5_6: "Explain the sun's daily pattern and how you can predict what comes next. Include an appositive and a sentence that starts with although, when, or because.",
  },
  transitions: ["First,", "Then,", "Next,", "After that,", "At noon,", "In the evening,", "Again,", "I predict"],
  model: {
    l1_2: "First, the sun rises in the east. Then it sets in the west. I predict it will rise again.",
    l3_4: "First, the sun rises in the east every morning. At noon, the sun is high. Then it sets in the west, so it gets dark. I predict the sun will rise again tomorrow.",
    l5_6: "Although the sun seems to disappear at night, it follows a pattern. The sun, a star that gives us light, rises in the east every morning. At noon it is high, and in the evening it sets in the west. When the sun goes down, the moon and stars come out. Because the pattern repeats, I can predict that the sun will rise again.",
  },
  revise: [
    "Did I put the sun's steps in order?",
    "Did I use first, then, or next?",
    "Did I say east for sunrise and west for sunset?",
    "Did I predict what comes next?",
  ],
};
