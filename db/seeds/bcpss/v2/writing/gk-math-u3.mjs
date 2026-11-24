// BCPSS Writing Lab (TWR) — gk-math-u3 · Understand Addition within 10. Contract: ../writing-schema.mjs

export default {
  title: "Tia's Add Story",
  genre: "explain",
  tip: "Act out each add story with counters first, then say first, next, and in all before children write.",
  lessons: [
    { id: "A", title: "Putting two groups together" },
    { id: "B", title: "Adding to a group: first, then" },
    { id: "C", title: "Ten frames and addition equations" },
    { id: "D", title: "Telling how many in all" },
  ],
  source: {
    title: "Balls at Patterson Park",
    lesson: "B",
    text: "Tia plays at Patterson Park. She has 5 red balls. Then she gets 3 blue balls. 5 plus 3 equals 8. Tia has 8 balls in all.",
  },
  notes: [
    { sentence: "Tia plays at Patterson Park.", note: "Patterson Park" },
    { sentence: "She has 5 red balls.", note: "5 red" },
    { sentence: "Then she gets 3 blue balls.", note: "+ 3 blue" },
    { sentence: "Tia has 8 balls in all.", note: "8 in all" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Tia has 8 balls in all",
      because: "5 red and 3 blue make 8.",
      but: "she started with only 5.",
      so: "she can play a big game.",
    },
    {
      lesson: "A",
      kernel: "Leo adds 3 kids to 4 kids",
      because: "3 more kids came.",
      but: "no kids left the stop.",
      so: "7 kids wait for the bus.",
    },
    {
      lesson: "C",
      kernel: "Kai puts 6 counters on the ten frame",
      because: "he has 6 counters.",
      but: "4 spaces are still empty.",
      so: "he adds 4 more to fill it.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Mara adds 3 cups.",
      parts: { when: "after lunch", where: "on the table", how: "one by one" },
      model: "After lunch, Mara adds 3 cups on the table one by one.",
    },
    {
      lesson: "A",
      kernel: "Leo counts the kids.",
      parts: { when: "then", where: "at the bus stop", why: "to find how many in all" },
      model: "Then Leo counts the kids at the bus stop to find how many in all.",
    },
  ],
  fragments: [
    { text: "4 plus 3 equals 7.", is_sentence: true },
    { text: "Adds 2 more.", is_sentence: false, fix: "Tia adds 2 more." },
    { text: "I have 5 in all.", is_sentence: true },
    { text: "Then 4 more kids.", is_sentence: false, fix: "Then 4 more kids come." },
    { text: "The total of both groups.", is_sentence: false, fix: "The total of both groups is 7." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Mara, ___, has 4 cups.",
      noun: "Mara",
      options: ["the number for all the parts", "a girl who sells lemonade", "a box with 10 spaces"],
      answer: 1,
      model: "Mara, a girl who sells lemonade, has 4 cups.",
    },
    {
      lesson: "C",
      sentence: "A ten frame, ___, helps us add.",
      noun: "ten frame",
      options: ["a box with 2 rows of 5 spaces", "a math sentence with an equal sign", "the sign that means plus"],
      answer: 0,
      model: "A ten frame, a box with 2 rows of 5 spaces, helps us add.",
    },
    {
      lesson: "D",
      sentence: "The total, ___, tells how many in all.",
      noun: "total",
      options: ["a box for counters", "a math sentence with a plus sign", "the number of things in all the groups"],
      answer: 2,
      model: "The total, the number of things in all the groups, tells how many in all.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "he adds them to the group", model: "When Leo sees 3 more kids, he adds them to the group." },
    { lesson: "D", conjunction: "after", stem: "I count how many in all", model: "After I add the groups, I count how many in all." },
    { lesson: "C", conjunction: "because", stem: "I use a ten frame", model: "Because it has 10 spaces, I use a ten frame." },
  ],
  spo: {
    topic: {
      l1_2: "Tia adds [balls] at the park.",
      l3_4: "First Tia has [5] balls. Next she adds [3] more balls.",
      l5_6: "Although Tia starts with [5 red balls], she [adds 3 blue balls] to find the total.",
    },
    starters: [
      { type: "question", text: "How many balls does Tia have in all?" },
      { type: "appositive", text: "Tia, a girl at Patterson Park, adds balls." },
      { type: "subordinate", text: "When Tia gets 3 more balls, she adds them." },
    ],
    details: [
      { note: "5 red balls", lesson: "B" },
      { note: "3 blue balls", lesson: "B" },
      { note: "first 5, then + 3", lesson: "B" },
      { note: "5 plus 3 equals 8", lesson: "C" },
      { note: "8 balls in all", lesson: "D" },
      { note: "put both groups together", lesson: "A" },
    ],
    distractors: ["balls bounce high", "Patterson Park has a pagoda"],
    conclusion: {
      l1_2: "Tia has [8] in all.",
      l3_4: "[5] plus [3] equals [8], so Tia has [8] balls in all.",
      l5_6: "After Tia puts the groups together, [5 plus 3 equals 8], so she has [8 balls in all].",
    },
  },
  prompt: {
    l1_2: "Draw two groups of things. Add them. Write 1-3 sentences to tell your add story.",
    l3_4: "Draw two groups and add them. Tell your add story with first, next, and in all. Write the equation.",
    l5_6: "Explain how you added two groups. Include an appositive and a sentence that starts with when or after. Write the equation.",
  },
  transitions: ["First,", "Next,", "Then,", "Now,", "In all,", "so", "and", "plus"],
  model: {
    l1_2: "Tia has 5 balls. She adds 3 more. Now she has 8.",
    l3_4: "First, Tia has 5 red balls. Next, she adds 3 blue balls. 5 plus 3 equals 8. Tia has 8 balls in all.",
    l5_6: "Tia, a girl at Patterson Park, has 5 red balls. When she gets 3 blue balls, she adds them together. 5 plus 3 equals 8. After she counts, she knows she has 8 balls in all.",
  },
  revise: [
    "Did I tell how many I started with?",
    "Did I tell how many I added?",
    "Did I write the equation with plus and equals?",
    "Did I say how many in all?",
  ],
};
