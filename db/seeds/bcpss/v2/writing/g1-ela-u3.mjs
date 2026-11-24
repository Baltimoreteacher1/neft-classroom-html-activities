// BCPSS Writing Lab (TWR) — g1-ela-u3 · Powerful Forces. Contract: ../writing-schema.mjs

export default {
  title: "A Windy Day Story",
  genre: "narrate",
  tip: "Have students act out first, then, and at last with a paper boat and a fan before they draw and write.",
  lessons: [
    { id: "A", title: "Wind is a powerful force" },
    { id: "B", title: "Feelings change a story" },
    { id: "C", title: "Tell events in order" },
    { id: "D", title: "Find the turning point" },
  ],
  source: {
    title: "Eli and the Toy Boat",
    lesson: "A",
    text: "Eli put his toy boat in the Inner Harbor. First, the air was calm. The boat did not move. Then a gust of wind came. The wind pushed the sail. Eli felt joy. At last, the boat zipped across the water.",
  },
  notes: [
    { sentence: "First, the air was calm.", note: "air = calm" },
    { sentence: "Then a gust of wind came.", note: "gust → wind came" },
    { sentence: "The wind pushed the sail.", note: "wind = push sail" },
    { sentence: "At last, the boat zipped across the water.", note: "last: boat zips" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The wind pushed the toy boat",
      because: "wind is a strong force.",
      but: "the boat did not move at first.",
      so: "Eli felt joy.",
    },
    {
      lesson: "D",
      kernel: "The gust surprised Eli",
      because: "it came very fast.",
      but: "the wind soon became gentle.",
      so: "he held his hat tight.",
    },
    {
      lesson: "B",
      kernel: "Mia's kite flew high",
      because: "a strong wind pushed it.",
      but: "the wind stopped for a moment.",
      so: "she ran to keep it up.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The wind blew.",
      parts: { when: "in the afternoon", where: "across the harbor", how: "with a loud whoosh" },
      model: "In the afternoon, the wind blew across the harbor with a loud whoosh.",
    },
    {
      lesson: "C",
      kernel: "Eli cheered.",
      parts: { when: "at last", where: "on the dock", why: "because the boat zipped away" },
      model: "At last, Eli cheered on the dock because the boat zipped away.",
    },
  ],
  fragments: [
    { text: "The wind pushed the sail.", is_sentence: true },
    { text: "A strong gust of wind.", is_sentence: false, fix: "A strong gust of wind came." },
    { text: "Then Eli felt joy.", is_sentence: true },
    { text: "Pushed the boat across the water.", is_sentence: false, fix: "The wind pushed the boat across the water." },
    { text: "After the wind stopped.", is_sentence: false, fix: "After the wind stopped, the boat floated slowly." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Eli, ___, put his boat in the water.",
      noun: "Eli",
      options: ["a boy at the Inner Harbor", "a quick, strong blow of wind", "a push or a pull"],
      answer: 0,
      model: "Eli, a boy at the Inner Harbor, put his boat in the water.",
    },
    {
      lesson: "D",
      sentence: "A gust, ___, pushed the sail.",
      noun: "A gust",
      options: ["a happy feeling", "a quick, strong blow of wind", "a very calm day"],
      answer: 1,
      model: "A gust, a quick, strong blow of wind, pushed the sail.",
    },
    {
      lesson: "B",
      sentence: "Joy, ___, filled Eli at last.",
      noun: "Joy",
      options: ["a strong wind", "a toy boat", "a happy feeling"],
      answer: 2,
      model: "Joy, a happy feeling, filled Eli at last.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the boat zipped across the water", model: "When the gust pushed the sail, the boat zipped across the water." },
    { lesson: "B", conjunction: "after", stem: "Eli felt joy", model: "After the boat began to move, Eli felt joy." },
    { lesson: "D", conjunction: "before", stem: "the air was calm", model: "Before the gust came, the air was calm." },
  ],
  spo: {
    topic: {
      l1_2: "First, the [wind] pushed the [boat].",
      l3_4: "First, the wind [action]. Then [Eli] felt [emotion]. At last, [what happened].",
      l5_6: "Although [the air was calm at first], a gust of wind [pushed the sail], and [Eli felt joy] at last.",
    },
    starters: [
      { type: "question", text: "What happens when a strong gust meets a toy boat?" },
      { type: "statement", text: "The wind is a powerful force at the Inner Harbor." },
      { type: "appositive", text: "A gust, a quick blow of wind, changed the whole day." },
    ],
    details: [
      { note: "air calm → boat still", lesson: "A" },
      { note: "gust of wind comes", lesson: "D" },
      { note: "wind pushes sail", lesson: "A" },
      { note: "Eli feels joy", lesson: "B" },
      { note: "boat zips across water", lesson: "C" },
      { note: "turning point = the gust", lesson: "D" },
    ],
    distractors: ["ducks swim in the harbor", "Eli had a sandwich"],
    conclusion: {
      l1_2: "At last, the [boat] [zipped away].",
      l3_4: "At last, the [boat zipped across the water] and Eli felt [glad].",
      l5_6: "At last, [the boat flew across the water], and Eli was [glad he waited].",
    },
  },
  prompt: {
    l1_2: "Draw a windy day. Write 1-3 sentences. Use first, then, and at last.",
    l3_4: "Write a windy-day story. Tell what happened first, the turning point, and the end. Use first, then, and at last.",
    l5_6: "Write a windy-day story with a clear turning point. Show how the wind and a feeling change what happens. Include an appositive and a sentence that starts with although or when.",
  },
  transitions: ["First,", "Then,", "Next,", "After that,", "Suddenly,", "At last,", "So", "But"],
  model: {
    l1_2: "First, the wind pushed the boat. Then Eli felt joy. At last, the boat zipped away.",
    l3_4: "First, the air was calm and the boat did not move. Then a gust of wind pushed the sail. Eli felt joy because the boat began to go. At last, the boat zipped across the water.",
    l5_6: "Because the air was calm at first, Eli's toy boat did not move. Then a gust, a quick blow of wind, pushed the sail. When the boat began to zip, Eli felt joy and cheered. At last, the boat flew across the water, and Eli was glad he waited.",
  },
  revise: [
    "Did I use first, then, and at last in order?",
    "Did I tell what the wind did?",
    "Did I show how a character felt?",
    "Did I make the turning point clear?",
  ],
};
