// BCPSS Writing Lab (TWR) — g5-math-u4 · Add & Subtract Fractions with Unlike Denominators. Contract: ../writing-schema.mjs

export default {
  title: "Prove It With Sixths",
  genre: "argue",
  tip: "Have students shade two fraction bars on the board so they can see why unlike parts must be renamed before they argue in writing.",
  lessons: [
    { id: "A", title: "Equivalent fractions and common denominators" },
    { id: "B", title: "Adding fractions with unlike denominators" },
    { id: "C", title: "Subtracting fractions with unlike denominators" },
    { id: "D", title: "Mixed numbers and checking with benchmarks" },
  ],
  source: {
    title: "Fruit at the Farmers Market",
    lesson: "B",
    text: "At the Waverly farmers market, Marcus buys 1/2 pound of peaches and 1/3 pound of plums. He wants to know how much fruit he has in all. The denominators 2 and 3 are different, so he cannot add yet. He renames 1/2 as 3/6 and 1/3 as 2/6, because the parts must be the same size. Then he adds 3/6 and 2/6 to get 5/6 of a pound. His answer is reasonable since 5/6 is a little less than 1 whole pound.",
  },
  notes: [
    { sentence: "The denominators 2 and 3 are different, so he cannot add yet.", note: "denominators 2, 3 differ → rename" },
    { sentence: "He renames 1/2 as 3/6 and 1/3 as 2/6, because the parts must be the same size.", note: "1/2 = 3/6; 1/3 = 2/6; same-size parts" },
    { sentence: "Then he adds 3/6 and 2/6 to get 5/6 of a pound.", note: "3/6 + 2/6 = 5/6 pound" },
    { sentence: "His answer is reasonable since 5/6 is a little less than 1 whole pound.", note: "5/6 < 1 whole → reasonable" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The fractions 1/2 and 3/6 name the same amount",
      because: "both fractions cover the same part of a whole.",
      but: "their numerators and denominators look different.",
      so: "3/6 is an equivalent fraction for 1/2.",
    },
    {
      lesson: "B",
      kernel: "Marcus renames 1/2 and 1/3 with sixths",
      because: "only equal-sized parts can be added.",
      but: "the amount of fruit does not change.",
      so: "he can add 3 sixths and 2 sixths.",
    },
    {
      lesson: "C",
      kernel: "Sam's answer of 1/2 for 2/3 − 1/4 is not correct",
      because: "2/3 − 1/4 is 8/12 − 3/12, which equals 5/12.",
      but: "the answer looks close to what Sam wrote.",
      so: "he should rename both fractions with twelfths to check.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Marcus added the fruit.",
      parts: { where: "at the Waverly farmers market", how: "with a common denominator", why: "to find the total weight" },
      model: "At the Waverly farmers market, Marcus added the fruit with a common denominator to find the total weight.",
    },
    {
      lesson: "D",
      kernel: "Tanya checked her answer.",
      parts: { when: "at the end", how: "with benchmark fractions", why: "because she wanted to be sure it was reasonable" },
      model: "At the end, Tanya checked her answer with benchmark fractions because she wanted to be sure it was reasonable.",
    },
  ],
  fragments: [
    { text: "A common denominator is a shared multiple of the bottom numbers.", is_sentence: true },
    { text: "Because the parts are different sizes.", is_sentence: false, fix: "We cannot add yet because the parts are different sizes." },
    { text: "Marcus renames 1/2 as 3/6.", is_sentence: true },
    { text: "Adding 3/6 and 2/6 to get 5/6.", is_sentence: false, fix: "Marcus adds 3/6 and 2/6 to get 5/6." },
    { text: "Since 5/6 is less than 1 whole.", is_sentence: false, fix: "The answer is reasonable since 5/6 is less than 1 whole." },
    { text: "The sum is 5/6.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The denominator, ___, must be the same size before we add fractions.",
      noun: "denominator",
      options: ["the bottom number in a fraction", "the top number in a fraction", "the answer to an addition problem"],
      answer: 0,
      model: "The denominator, the bottom number in a fraction, must be the same size before we add fractions.",
    },
    {
      lesson: "B",
      sentence: "A common denominator, ___, makes the parts the same size.",
      noun: "common denominator",
      options: ["an easy fraction like 0, 1/2, or 1", "a shared multiple of the bottom numbers of two fractions", "a number made of a whole number and a fraction"],
      answer: 1,
      model: "A common denominator, a shared multiple of the bottom numbers of two fractions, makes the parts the same size.",
    },
    {
      lesson: "D",
      sentence: "A benchmark fraction, ___, helps us judge whether an answer is reasonable.",
      noun: "benchmark fraction",
      options: ["a fraction that names the same amount as another fraction", "the answer to a subtraction problem", "an easy fraction like 0, 1/2, or 1"],
      answer: 2,
      model: "A benchmark fraction, an easy fraction like 0, 1/2, or 1, helps us judge whether an answer is reasonable.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "since", stem: "it is another name for 1/2", model: "Since 3/6 covers the same part of a whole, it is another name for 1/2." },
    { lesson: "B", conjunction: "because", stem: "Marcus renames both fractions", model: "Because the denominators are different, Marcus renames both fractions." },
    { lesson: "C", conjunction: "although", stem: "Sam's subtraction is not correct", model: "Although 1/2 is close to the real answer, Sam's subtraction is not correct." },
  ],
  spo: {
    topic: {
      l1_2: "My method [works] because the [parts] are the same size.",
      l3_4: "I renamed [1/2] and [1/3] with a common denominator of [6] because [only equal-sized parts can be added].",
      l5_6: "Although [the denominators are different], adding 1/2 and 1/3 is correct since [we rename them so the parts are equal in size].",
    },
    starters: [
      { type: "statement", text: "Fractions must have equal-sized parts before we can add them." },
      { type: "question", text: "How can you prove that 1/2 + 1/3 equals 5/6?" },
      { type: "subordinate", text: "Because the parts are different sizes, we rename the fractions before we add." },
    ],
    details: [
      { note: "1/2 + 1/3: denominators differ", lesson: "A" },
      { note: "common denominator = 6", lesson: "B" },
      { note: "1/2 = 3/6; 1/3 = 2/6", lesson: "A" },
      { note: "3/6 + 2/6 = 5/6 pound", lesson: "B" },
      { note: "benchmark: 5/6 is a little less than 1", lesson: "D" },
      { note: "check: 5/6 − 2/6 = 3/6 = 1/2", lesson: "C" },
    ],
    distractors: ["peaches grow on trees", "plums are purple and juicy"],
    conclusion: {
      l1_2: "So the sum is [5/6] pound.",
      l3_4: "The sum is [5/6], and it is reasonable because it is close to [1].",
      l5_6: "Therefore, [5/6 pound] is correct since [equal-sized parts were added], and it is reasonable because [it is just less than 1 whole pound].",
    },
  },
  prompt: {
    l1_2: "Draw two fraction bars for 1/2 and 1/3. Write 2-4 sentences. Tell the sum and why you renamed the fractions.",
    l3_4: "Write a paragraph that proves Marcus's sum of 1/2 and 1/3 is correct. Use your outline, because, and since.",
    l5_6: "Write a paragraph that justifies how to add 1/2 and 1/3 and proves the answer is reasonable. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "Because", "Since", "So", "That works because", "Therefore,", "For example,", "However,"],
  model: {
    l1_2: "Marcus renames 1/2 as 3/6. He renames 1/3 as 2/6. The sum is 5/6 of a pound.",
    l3_4: "I renamed 1/2 and 1/3 with a common denominator of 6 because only equal-sized parts can be added. First, I changed 1/2 to 3/6 and 1/3 to 2/6. Then I added 3/6 and 2/6 to get 5/6 of a pound. The sum is reasonable because 5/6 is close to 1 whole pound. I can also check by subtracting, since 5/6 − 2/6 equals 3/6, or 1/2.",
    l5_6: "Although the denominators 2 and 3 are different, we can add 1/2 and 1/3 when we rename them. A common denominator, a shared multiple of both bottom numbers, makes the parts the same size. Because 1/2 equals 3/6 and 1/3 equals 2/6, Marcus can add 3/6 and 2/6 to get 5/6 of a pound. This method works since only equal-sized parts can be added together. His answer is reasonable because 5/6 is a little less than the benchmark of 1 whole pound. Therefore, Marcus can trust both his method and his answer.",
  },
  mpo: {
    thesis: "Renaming fractions with a common denominator is a correct way to add fractions with unlike denominators, because it makes the parts the same size.",
    paragraphs: [
      { topic: "Fractions need equal-sized parts before they can be added.", notes: ["denominators 2, 3 differ", "unlike parts can't be added"] },
      { topic: "A common denominator solves the problem.", notes: ["common denominator = 6", "1/2 = 3/6; 1/3 = 2/6", "3/6 + 2/6 = 5/6"] },
      { topic: "Benchmarks and checks show the answer is reasonable.", notes: ["5/6 less than 1 whole", "check: 5/6 − 2/6 = 1/2"] },
    ],
    conclusion: "Because only equal-sized parts can be added, renaming with a common denominator is a method that works, and benchmarks prove the answer is reasonable.",
  },
  revise: [
    "Did I say why the fractions had to be renamed, not only that I renamed them?",
    "Did I show the equivalent fractions, 3/6 and 2/6, in my explanation?",
    "Did I use because or since to justify my method?",
    "Did I check that my answer is reasonable by comparing it to a benchmark like 1?",
  ],
};
