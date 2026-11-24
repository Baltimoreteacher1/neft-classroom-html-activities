// BCPSS Writing Lab (TWR) — gk-math-u5 · Numbers 11–20 & Place Value Foundations. Contract: ../writing-schema.mjs

export default {
  title: "Mia Makes a Teen Number",
  genre: "explain",
  tip: "Have children fill a real ten frame first, then count the extra ones aloud before they write.",
  lessons: [
    { id: "A", title: "Filling a ten frame" },
    { id: "B", title: "One ten and some ones" },
    { id: "C", title: "Building and breaking apart teen numbers" },
    { id: "D", title: "Counting from 11 to 20" },
  ],
  source: {
    title: "Shells at the Beach",
    lesson: "A",
    text: "Mia finds 14 shells. First, she fills a ten frame. That uses 10 shells. Then she counts 4 extra. 14 is 1 ten and 4 ones.",
  },
  notes: [
    { sentence: "First, she fills a ten frame.", note: "fill ten frame" },
    { sentence: "That uses 10 shells.", note: "10 = full" },
    { sentence: "Then she counts 4 extra.", note: "4 extra" },
    { sentence: "14 is 1 ten and 4 ones.", note: "14 = 10 + 4" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Mia fills the ten frame first",
      because: "a ten needs 10 shells.",
      but: "she has 4 shells left over.",
      so: "she counts 4 extra ones.",
    },
    {
      lesson: "B",
      kernel: "13 is 1 ten and 3 ones",
      because: "the ten frame holds 10.",
      but: "3 ones are not a ten.",
      so: "13 is a teen number.",
    },
    {
      lesson: "C",
      kernel: "Kai breaks apart 15",
      because: "he wants a ten and ones.",
      but: "15 is still the same number.",
      so: "he gets 1 ten and 5 ones.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Mia fills a frame.",
      parts: { when: "first", where: "at the beach", how: "with 10 shells" },
      model: "First, Mia fills a frame with 10 shells at the beach.",
    },
    {
      lesson: "C",
      kernel: "Kai adds more marbles.",
      parts: { when: "then", where: "next to the ten", why: "to make 13" },
      model: "Then Kai adds more marbles next to the ten to make 13.",
    },
  ],
  fragments: [
    { text: "14 is 1 ten and 4 ones.", is_sentence: true },
    { text: "The ten frame is full.", is_sentence: true },
    { text: "Four extra ones.", is_sentence: false, fix: "I have four extra ones." },
    { text: "Then fills the ten.", is_sentence: false, fix: "Then Mia fills the ten." },
    { text: "Because 10 is a full ten.", is_sentence: false, fix: "The frame is full because it has 10." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A ten frame, ___, holds 10 counters.",
      noun: "ten frame",
      options: ["a box with 2 rows of 5 spaces", "a number from 11 to 19", "things left over"],
      answer: 0,
      model: "A ten frame, a box with 2 rows of 5 spaces, holds 10 counters.",
    },
    {
      lesson: "B",
      sentence: "Fourteen, ___, has 1 ten and 4 ones.",
      noun: "Fourteen",
      options: ["a full frame with no spaces", "a teen number", "the number after 19"],
      answer: 1,
      model: "Fourteen, a teen number, has 1 ten and 4 ones.",
    },
    {
      lesson: "D",
      sentence: "Twenty, ___, comes after 19.",
      noun: "Twenty",
      options: ["a number from 11 to 19", "a box for counters", "the number made of 2 tens"],
      answer: 2,
      model: "Twenty, the number made of 2 tens, comes after 19.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "I have 4 extra ones", model: "When the frame is full, I have 4 extra ones." },
    { lesson: "B", conjunction: "after", stem: "I count the extra ones", model: "After I fill the ten frame, I count the extra ones." },
    { lesson: "C", conjunction: "because", stem: "15 is a teen number", model: "Because 15 is between 10 and 20, 15 is a teen number." },
  ],
  spo: {
    topic: {
      l1_2: "[14] is 1 ten and [4] ones.",
      l3_4: "To make [14], Mia fills a ten frame and adds [4] extra ones.",
      l5_6: "Although [14] is a big number, Mia shows it as [1 ten and 4 ones] by [using a ten frame].",
    },
    starters: [
      { type: "question", text: "How can you show 14 with a ten frame?" },
      { type: "appositive", text: "Mia, a girl at the beach, fills a ten frame." },
      { type: "subordinate", text: "When the frame is full, Mia counts the extra shells." },
    ],
    details: [
      { note: "ten frame has 10 spaces", lesson: "A" },
      { note: "fill the frame first", lesson: "A" },
      { note: "10 shells in the frame", lesson: "A" },
      { note: "4 extra shells", lesson: "B" },
      { note: "14 = 1 ten + 4 ones", lesson: "B" },
      { note: "check: count on from 10", lesson: "C" },
    ],
    distractors: ["shells can be hard", "the beach has sand"],
    conclusion: {
      l1_2: "So [14] is 1 ten and [4] ones.",
      l3_4: "So [14] is 1 ten and [4] ones.",
      l5_6: "Because the frame is full and [4 are extra], [14 is 1 ten and 4 ones].",
    },
  },
  prompt: {
    l1_2: "Draw a teen number on a ten frame. Write 1-3 sentences to tell how you made it.",
    l3_4: "Draw a teen number on a ten frame. Tell first, then how you made it. Use your outline.",
    l5_6: "Explain how you made a teen number. Include an appositive and a sentence that starts with when or after.",
  },
  transitions: ["First,", "Next,", "Then,", "Last,", "so", "and", "because", "extra"],
  model: {
    l1_2: "Mia fills a ten frame. 14 is 1 ten and 4 ones.",
    l3_4: "First, Mia fills the ten frame with 10 shells. Then she adds 4 extra ones. 14 is 1 ten and 4 ones.",
    l5_6: "Mia, a girl at the beach, finds 14 shells. After she fills the ten frame, she counts 4 extra. Because the frame is full and 4 are extra, 14 is 1 ten and 4 ones.",
  },
  revise: [
    "Did I say the ten frame is full?",
    "Did I tell how many extra ones I have?",
    "Did I say my number is 1 ten and some ones?",
    "Did I use first and then?",
  ],
};
