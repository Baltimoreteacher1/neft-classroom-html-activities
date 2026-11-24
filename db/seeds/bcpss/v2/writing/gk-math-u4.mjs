// BCPSS Writing Lab (TWR) — gk-math-u4 · Understand Subtraction within 10. Contract: ../writing-schema.mjs

export default {
  title: "Prove How Many Are Left",
  genre: "argue",
  tip: "Have children draw the start, cross out what is taken away, and count what is left before they write.",
  lessons: [
    { id: "A", title: "Taking away from a group" },
    { id: "B", title: "Taking apart a number" },
    { id: "C", title: "Subtraction equations" },
    { id: "D", title: "Proving how many are left" },
  ],
  source: {
    title: "Crabs in the Bucket",
    lesson: "A",
    text: "Jay is at the Bay. He has 7 crabs. Two crabs crawl out. 7 minus 2 equals 5. Now 5 crabs are left. Jay proves it with a drawing.",
  },
  notes: [
    { sentence: "He has 7 crabs.", note: "start 7" },
    { sentence: "Two crabs crawl out.", note: "take away 2" },
    { sentence: "Now 5 crabs are left.", note: "5 left" },
    { sentence: "Jay proves it with a drawing.", note: "proof = drawing" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Jay has 5 crabs left",
      because: "he took away 2 from 7.",
      but: "the bucket still looks full.",
      so: "he can count them to check.",
    },
    {
      lesson: "B",
      kernel: "Mia takes apart 6 blocks",
      because: "she wants two small groups.",
      but: "the whole is still 6.",
      so: "she has 2 and 4.",
    },
    {
      lesson: "C",
      kernel: "Marcus writes 9 minus 4",
      because: "he took 4 stickers away.",
      but: "he is not done yet.",
      so: "he writes equals 5 next.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Dee gives away pops.",
      parts: { when: "on a hot day", where: "in Baltimore", why: "to share with friends" },
      model: "On a hot day, Dee gives away pops in Baltimore to share with friends.",
    },
    {
      lesson: "C",
      kernel: "Marcus took away stickers.",
      parts: { when: "after school", where: "from his pile", why: "to give them to Tia" },
      model: "After school, Marcus took away stickers from his pile to give them to Tia.",
    },
  ],
  fragments: [
    { text: "5 are left.", is_sentence: true },
    { text: "Took away 3.", is_sentence: false, fix: "Dee took away 3." },
    { text: "I know because I counted.", is_sentence: true },
    { text: "Minus 4 stickers.", is_sentence: false, fix: "Nine minus 4 stickers is 5 stickers." },
    { text: "Because I took some away.", is_sentence: false, fix: "5 are left because I took some away." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Jay, ___, has 7 crabs.",
      noun: "Jay",
      options: ["a boy at the Bay", "the number left over", "a math sentence"],
      answer: 0,
      model: "Jay, a boy at the Bay, has 7 crabs.",
    },
    {
      lesson: "C",
      sentence: "The equation, ___, shows 9 minus 4.",
      noun: "equation",
      options: ["all the parts put together", "a math sentence with an equal sign", "to move some things out of a group"],
      answer: 1,
      model: "The equation, a math sentence with an equal sign, shows 9 minus 4.",
    },
    {
      lesson: "B",
      sentence: "Six, ___, can be taken apart into 2 and 4.",
      noun: "Six",
      options: ["the word for a minus sign", "a crab in a bucket", "a whole made of two parts"],
      answer: 2,
      model: "Six, a whole made of two parts, can be taken apart into 2 and 4.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "5 crabs are left", model: "When Jay takes away 2 crabs, 5 crabs are left." },
    { lesson: "D", conjunction: "after", stem: "I write the equation", model: "After I draw the crabs, I write the equation." },
    { lesson: "C", conjunction: "if", stem: "I know 5 are left", model: "If I start with 8 and take away 3, I know 5 are left." },
  ],
  spo: {
    topic: {
      l1_2: "I know [5] are left.",
      l3_4: "I know [5] crabs are left because I started with [7] and took away [2].",
      l5_6: "Although [the bucket looks full], I can prove [5 crabs are left] because [I started with 7 and took away 2].",
    },
    starters: [
      { type: "question", text: "How many crabs are left in the bucket?" },
      { type: "appositive", text: "Jay, a boy at the Bay, counts his crabs." },
      { type: "subordinate", text: "When 2 crabs crawl out, Jay takes them away." },
    ],
    details: [
      { note: "start with 7 crabs", lesson: "A" },
      { note: "take away 2", lesson: "A" },
      { note: "7 − 2 = 5", lesson: "C" },
      { note: "5 crabs left", lesson: "A" },
      { note: "draw 7, cross out 2", lesson: "D" },
      { note: "count the rest to check", lesson: "D" },
    ],
    distractors: ["crabs have big claws", "Jay's bucket is blue"],
    conclusion: {
      l1_2: "So [5] are left.",
      l3_4: "So [5] crabs are left, and I can [count them] to prove it.",
      l5_6: "Because [7 minus 2 equals 5], I know the answer is right, and my drawing [proves it].",
    },
  },
  prompt: {
    l1_2: "Draw a group of things. Cross some out. Write 1-3 sentences to tell how many are left.",
    l3_4: "Draw a take-away story. Tell how many are left and prove it with because. Use your outline.",
    l5_6: "Tell how many are left and prove it. Include an appositive and a sentence that starts with when or after.",
  },
  transitions: ["First,", "Next,", "Then,", "Now,", "because", "so", "minus", "left"],
  model: {
    l1_2: "Jay had 7 crabs. 2 crawled out. 5 are left.",
    l3_4: "I know 5 crabs are left because I started with 7. I took away 2 crabs. 7 minus 2 equals 5. I can count them to check.",
    l5_6: "Jay, a boy at the Bay, started with 7 crabs. When 2 crawled out, he took them away. I know 5 are left because 7 minus 2 equals 5. After I draw and cross out 2, I can prove it.",
  },
  revise: [
    "Did I tell how many I started with?",
    "Did I tell how many I took away?",
    "Did I say how many are left?",
    "Did I prove it with because or a drawing?",
  ],
};
