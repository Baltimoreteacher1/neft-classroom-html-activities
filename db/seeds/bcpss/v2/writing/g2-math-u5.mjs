// BCPSS Writing Lab (TWR) — g2-math-u5 · Time, Money & Data Line Plots. Contract: ../writing-schema.mjs

export default {
  title: "Proof From a Line Plot",
  genre: "argue",
  tip: "Have students point to the Xs on the line plot and count them aloud before they write their proof.",
  lessons: [
    { id: "A", title: "Tell time to 5 minutes, AM and PM" },
    { id: "B", title: "Count coins and dollars" },
    { id: "C", title: "Measure and make a line plot" },
    { id: "D", title: "Read a line plot for evidence" },
  ],
  source: {
    title: "Leaves From Patterson Park",
    lesson: "C",
    text: "A class measures 10 leaves from Patterson Park. They make a line plot. There is 1 X above 3 inches. There are 3 Xs above 4 inches. There are 4 Xs above 5 inches. There are 2 Xs above 6 inches. The most common length is 5 inches. It has the most Xs.",
  },
  notes: [
    { sentence: "There are 3 Xs above 4 inches.", note: "4 inches = 3 Xs" },
    { sentence: "There are 4 Xs above 5 inches.", note: "5 inches = 4 Xs" },
    { sentence: "There are 2 Xs above 6 inches.", note: "6 inches = 2 Xs" },
    { sentence: "The most common length is 5 inches.", note: "most Xs = most common" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Five inches is the most common length",
      because: "it has 4 Xs, more than any other length.",
      but: "only 2 Xs are above 6 inches.",
      so: "a typical leaf from the park is about 5 inches long.",
    },
    {
      lesson: "B",
      kernel: "Mia has enough money for a 35 cent pen",
      because: "a quarter and a dime make 35 cents.",
      but: "a dime by itself is only 10 cents.",
      so: "she can pay with no money left over.",
    },
    {
      lesson: "A",
      kernel: "The clock shows 8:00 AM",
      because: "it is morning, before noon.",
      but: "8:00 PM looks the same on the clock.",
      so: "we must say AM or PM to be clear.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "The class measured leaves.",
      parts: { when: "after recess", how: "with a ruler", why: "to make a line plot" },
      model: "After recess, the class measured leaves with a ruler to make a line plot.",
    },
    {
      lesson: "B",
      kernel: "Mia paid for the pen.",
      parts: { when: "at 2:15 PM", where: "at the school store", how: "with a quarter and a dime" },
      model: "At 2:15 PM, Mia paid for the pen at the school store with a quarter and a dime.",
    },
  ],
  fragments: [
    { text: "The line plot shows 10 leaves.", is_sentence: true },
    { text: "Because it has 4 Xs.", is_sentence: false, fix: "Five inches is most common because it has 4 Xs." },
    { text: "Counted the coins.", is_sentence: false, fix: "Mia counted the coins." },
    { text: "A quarter is worth 25 cents.", is_sentence: true },
    { text: "According to the line plot.", is_sentence: false, fix: "According to the line plot, 5 inches has the most Xs." },
    { text: "It is 8:00 in the morning.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "A line plot, ___, shows how many of each length.",
      noun: "line plot",
      options: ["a number line with Xs above it", "money that is worth 100 cents", "the hours from noon until midnight"],
      answer: 0,
      model: "A line plot, a number line with Xs above it, shows how many of each length.",
    },
    {
      lesson: "B",
      sentence: "A quarter, ___, helps Mia pay for a pen.",
      noun: "quarter",
      options: ["the hours from midnight until noon", "a round silver coin", "a number line with Xs above it"],
      answer: 1,
      model: "A quarter, a round silver coin, helps Mia pay for a pen.",
    },
    {
      lesson: "A",
      sentence: "PM, ___, begins at noon.",
      noun: "PM",
      options: ["the hours from midnight until noon", "a coin worth 10 cents", "the hours from noon until midnight"],
      answer: 2,
      model: "PM, the hours from noon until midnight, begins at noon.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "5 inches is the most common length", model: "Because 5 inches has 4 Xs, 5 inches is the most common length." },
    { lesson: "C", conjunction: "when", stem: "they put an X above the length", model: "When the class measures each leaf, they put an X above the length." },
    { lesson: "B", conjunction: "since", stem: "Mia has enough money", model: "Since a quarter and a dime make 35 cents, Mia has enough money." },
  ],
  spo: {
    topic: {
      l1_2: "[5 inches] is the most common [length].",
      l3_4: "I think [5 inches] is the most common leaf length because it has [4 Xs].",
      l5_6: "Although [the leaves] are not all the same, [5 inches is the most common length] because [it has more Xs than any other length].",
    },
    starters: [
      { type: "question", text: "Which leaf length did the class find most often?" },
      { type: "appositive", text: "The line plot, a number line with Xs above it, shows 10 leaves." },
      { type: "subordinate", text: "When we count the Xs, we can see which length is most common." },
    ],
    details: [
      { note: "10 leaves from Patterson Park", lesson: "C" },
      { note: "4 inches = 3 Xs", lesson: "C" },
      { note: "5 inches = 4 Xs", lesson: "D" },
      { note: "6 inches = 2 Xs", lesson: "D" },
      { note: "most Xs = most common length", lesson: "D" },
      { note: "1 + 3 + 4 + 2 = 10", lesson: "C" },
    ],
    distractors: ["leaves turn red in fall", "Patterson Park has a pagoda"],
    conclusion: {
      l1_2: "So [5 inches] is [most common].",
      l3_4: "That is why [5 inches] is the most common length, according to [the line plot].",
      l5_6: "In conclusion, [the line plot proves] that [5 inches is the most common length], because [no other length has 4 Xs].",
    },
  },
  prompt: {
    l1_2: "Draw a line plot with Xs. Write 1-3 sentences that tell the most common length.",
    l3_4: "Write a paragraph that tells the most common leaf length and proves it. Use because and according to.",
    l5_6: "Write a paragraph that proves the most common leaf length with evidence from the line plot. Include an appositive and a sentence that starts with although or when.",
  },
  transitions: ["I think", "First,", "Because", "According to", "For example,", "So", "Also,", "That is why"],
  model: {
    l1_2: "5 inches is the most common length. It has 4 Xs.",
    l3_4: "I think 5 inches is the most common leaf length because it has 4 Xs. According to the line plot, 4 inches has 3 Xs and 6 inches has 2 Xs. That is why 5 inches wins.",
    l5_6: "Although the leaves are not all the same, 5 inches is the most common length. The line plot, a number line with Xs above it, shows 10 leaves. According to the plot, 5 inches has 4 Xs. No other length has 4 Xs. So the evidence proves my claim.",
  },
  revise: [
    "Did I state my claim, the most common length?",
    "Did I use real numbers from the line plot as evidence?",
    "Did I use because and according to?",
    "Did I check that my Xs add up to 10 leaves?",
  ],
};
