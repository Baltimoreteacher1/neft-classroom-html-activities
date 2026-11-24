// BCPSS Writing Lab (TWR) — g1-math-u1 · Addition & Subtraction Strategies within 20. Contract: ../writing-schema.mjs

export default {
  title: "Prove Your Smart Plan",
  genre: "argue",
  tip: "Have students say the strategy and the because-reason aloud with counters before they write the number sentence.",
  lessons: [
    { id: "A", title: "Count on to add" },
    { id: "B", title: "Doubles and near doubles" },
    { id: "C", title: "Make a ten to add" },
    { id: "D", title: "Related facts to subtract" },
  ],
  source: {
    title: "Sailboats at the Harbor",
    lesson: "B",
    text: "Kofi sees 7 sailboats at the Inner Harbor. Then 6 more sail in. Kofi uses doubles. He knows 6 plus 6 is 12. One more boat makes 13. So there are 13 sailboats. Kofi checks by counting on from 7.",
  },
  notes: [
    { sentence: "Then 6 more sail in.", note: "7 + 6 more" },
    { sentence: "He knows 6 plus 6 is 12.", note: "6 + 6 = 12" },
    { sentence: "One more boat makes 13.", note: "+ 1 = 13" },
    { sentence: "Kofi checks by counting on from 7.", note: "count on from 7" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Jada solved 9 plus 4 by making a ten",
      because: "9 and 1 make 10, an easy number to use.",
      but: "counting on would give the same sum.",
      so: "the sum is 13.",
    },
    {
      lesson: "B",
      kernel: "Kofi used doubles for 6 plus 7",
      because: "6 plus 6 is a fact he knows.",
      but: "he still had to add one more.",
      so: "the sum is 13.",
    },
    {
      lesson: "A",
      kernel: "Dev counted on from 8",
      because: "8 is the bigger number.",
      but: "he did not start at 1.",
      so: "he found that 8 plus 3 is 11.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Jada made ten.",
      parts: { where: "at the Inner Harbor", how: "with a ten frame", why: "to add 9 and 4 fast" },
      model: "At the Inner Harbor, Jada made ten with a ten frame to add 9 and 4 fast.",
    },
    {
      lesson: "A",
      kernel: "Kofi counts on.",
      parts: { when: "after the boats sail in", how: "from 7 in his head", why: "to check his sum" },
      model: "After the boats sail in, Kofi counts on from 7 in his head to check his sum.",
    },
  ],
  fragments: [
    { text: "I used doubles.", is_sentence: true },
    { text: "Because 6 plus 6 is 12.", is_sentence: false, fix: "Kofi knows 7 plus 6 is 13 because 6 plus 6 is 12." },
    { text: "The sum of 9 and 4.", is_sentence: false, fix: "The sum of 9 and 4 is 13." },
    { text: "Counts on from 8.", is_sentence: false, fix: "Dev counts on from 8." },
    { text: "9 plus 1 makes ten.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Doubles, ___, are easy to add.",
      noun: "Doubles",
      options: ["numbers added to themselves", "a boat at the harbor", "what is left after you take away"],
      answer: 0,
      model: "Doubles, numbers added to themselves, are easy to add.",
    },
    {
      lesson: "C",
      sentence: "A ten frame, ___, helps Jada make ten.",
      noun: "A ten frame",
      options: ["a boat with ten sails", "a box with ten spaces for counters", "the answer to an add problem"],
      answer: 1,
      model: "A ten frame, a box with ten spaces for counters, helps Jada make ten.",
    },
    {
      lesson: "A",
      sentence: "The sum, ___, is 13.",
      noun: "The sum",
      options: ["a plan for solving a problem", "what is left when you take one away", "the answer when you put numbers together"],
      answer: 2,
      model: "The sum, the answer when you put numbers together, is 13.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "although", stem: "Jada made a ten for 9 plus 4", model: "Although counting on works too, Jada made a ten for 9 plus 4." },
    { lesson: "B", conjunction: "because", stem: "Kofi used doubles", model: "Because he knows 6 plus 6 is 12, Kofi used doubles." },
    { lesson: "A", conjunction: "when", stem: "Dev says the sum is 11", model: "When he counts on 9, 10, 11, Dev says the sum is 11." },
  ],
  spo: {
    topic: {
      l1_2: "I solved [9 + 4] with [a ten].",
      l3_4: "I solved [9 + 4] with [making a ten] because [reason].",
      l5_6: "Although [counting on] works, I solved [9 + 4] with [making a ten], a smart plan that [reason].",
    },
    starters: [
      { type: "question", text: "Which smart plan solves 9 plus 4 the fastest?" },
      { type: "statement", text: "Making a ten is a smart plan for 9 plus 4." },
      { type: "subordinate", text: "Because 9 and 1 make 10, making a ten is a smart plan." },
    ],
    details: [
      { note: "9 + 4 → make a ten", lesson: "C" },
      { note: "9 + 1 = 10", lesson: "C" },
      { note: "10 + 3 = 13", lesson: "C" },
      { note: "count on: 10, 11, 12, 13", lesson: "A" },
      { note: "6 + 6 = 12, + 1 more", lesson: "B" },
      { note: "13 − 4 = 9, related fact", lesson: "D" },
    ],
    distractors: ["the harbor has a red lighthouse", "Jada likes crab cakes"],
    conclusion: {
      l1_2: "The sum is [13].",
      l3_4: "So the sum is [13] because [9 and 1 make 10].",
      l5_6: "Both plans give [13], so I know my sum is [right] and [my strategy works].",
    },
  },
  prompt: {
    l1_2: "Draw 9 boats and 4 more boats. Write 1-3 sentences. Tell your strategy and the sum.",
    l3_4: "Solve 9 plus 4. Explain your strategy and why it works. Use the words because and so.",
    l5_6: "Solve 9 plus 4 and argue why your strategy is the smartest plan. Include an appositive and a sentence that starts with because or although.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "So", "Also,", "For example,", "That is why"],
  model: {
    l1_2: "I solved 9 + 4 with a ten. 9 + 1 is 10. 10 + 3 is 13.",
    l3_4: "I solved 9 + 4 by making a ten because 9 + 1 is 10. Then I added the 3 that was left. 10 + 3 is 13. So the sum is 13.",
    l5_6: "Although counting on works, making a ten is the smartest plan for 9 + 4. The ten frame, a box with ten spaces, shows me that 9 and 1 make 10. I move 1 from the 4 to the 9, so I have 10 and 3. Then 10 + 3 is 13. Counting on gives the same sum, so I know 13 is right.",
  },
  revise: [
    "Did I name my strategy?",
    "Did I use because to tell why it works?",
    "Did I write the number sentence with the right sum?",
    "Did I check my sum another way?",
  ],
};
