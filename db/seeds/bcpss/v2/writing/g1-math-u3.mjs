// BCPSS Writing Lab (TWR) — g1-math-u3 · Add & Subtract Two-Digit Numbers. Contract: ../writing-schema.mjs

export default {
  title: "Explain My Adding Steps",
  genre: "explain",
  tip: "Act out the trade with ten-sticks and cubes while students say First, Next, and Then, and only then ask them to write.",
  lessons: [
    { id: "A", title: "Add and subtract multiples of 10" },
    { id: "B", title: "Add ones to a two-digit number" },
    { id: "C", title: "Trade ten ones for a ten" },
    { id: "D", title: "Jump on an open number line" },
  ],
  source: {
    title: "Apples at the Market",
    lesson: "B",
    text: "Aisha counts apples at Lexington Market. She has 38 apples. A farmer gives her 5 more. First, she adds the ones. 8 and 5 make 13. Next, she trades 10 ones for 1 ten. Now she has 4 tens and 3 ones. Then she says the total. The total is 43.",
  },
  notes: [
    { sentence: "A farmer gives her 5 more.", note: "38 + 5" },
    { sentence: "First, she adds the ones.", note: "add ones first" },
    { sentence: "Next, she trades 10 ones for 1 ten.", note: "10 ones → 1 ten" },
    { sentence: "Now she has 4 tens and 3 ones.", note: "4 tens 3 ones" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Aisha traded 10 ones for 1 ten",
      because: "she had 13 ones.",
      but: "the number of apples stayed the same.",
      so: "she had 4 tens and 3 ones.",
    },
    {
      lesson: "B",
      kernel: "Aisha added the ones first",
      because: "she wanted to see if she could make a ten.",
      but: "she did not add the tens yet.",
      so: "she knew she had to trade.",
    },
    {
      lesson: "D",
      kernel: "Kai jumped 20 from 30 on the number line",
      because: "20 is two tens.",
      but: "he did not jump by ones.",
      so: "he landed on 50.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Aisha trades.",
      parts: { when: "next", what: "10 ones for 1 ten", why: "to make a new ten" },
      model: "Next, Aisha trades 10 ones for 1 ten to make a new ten.",
    },
    {
      lesson: "D",
      kernel: "Kai jumps 20.",
      parts: { when: "after standing at 30", where: "on the number line", why: "to land on 50" },
      model: "After standing at 30, Kai jumps 20 on the number line to land on 50.",
    },
  ],
  fragments: [
    { text: "Aisha adds the ones.", is_sentence: true },
    { text: "Trades 10 ones for 1 ten.", is_sentence: false, fix: "Aisha trades 10 ones for 1 ten." },
    { text: "The total of 38 and 5.", is_sentence: false, fix: "The total of 38 and 5 is 43." },
    { text: "Kai jumps 20 on the number line.", is_sentence: true },
    { text: "After she adds the ones.", is_sentence: false, fix: "After she adds the ones, Aisha trades 10 ones for 1 ten." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Aisha, ___, counts apples at Lexington Market.",
      noun: "Aisha",
      options: ["a girl who helps at the market", "a group of ten ones", "a line with numbers"],
      answer: 0,
      model: "Aisha, a girl who helps at the market, counts apples at Lexington Market.",
    },
    {
      lesson: "D",
      sentence: "A number line, ___, helps Kai add tens.",
      noun: "A number line",
      options: ["a trade of ten ones", "the total of 38 and 5", "a line with numbers in order"],
      answer: 2,
      model: "A number line, a line with numbers in order, helps Kai add tens.",
    },
    {
      lesson: "A",
      sentence: "The total, ___, is 43.",
      noun: "The total",
      options: ["a group of single ones", "how many there are in all", "a jump of 20"],
      answer: 1,
      model: "The total, how many there are in all, is 43.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "after", stem: "Aisha has 4 tens and 3 ones", model: "After she trades 10 ones for 1 ten, Aisha has 4 tens and 3 ones." },
    { lesson: "D", conjunction: "when", stem: "Kai lands on 50", model: "When he jumps 20 from 30, Kai lands on 50." },
    { lesson: "C", conjunction: "because", stem: "Aisha trades 10 ones for 1 ten", model: "Because she has 13 ones, Aisha trades 10 ones for 1 ten." },
  ],
  spo: {
    topic: {
      l1_2: "I add [38 + 5] in [three] steps.",
      l3_4: "To solve [38 + 5], I add the ones, trade ten ones for a ten, and say the total.",
      l5_6: "Although [38 + 5] looks tricky, I can solve it by [adding the ones, trading ten ones for a ten, and saying the total].",
    },
    starters: [
      { type: "question", text: "How can we add 38 and 5 without counting every apple?" },
      { type: "statement", text: "Adding tens and ones takes three clear steps." },
      { type: "command", text: "Add the ones first, then trade ten ones for a ten." },
    ],
    details: [
      { note: "add ones: 8 + 5 = 13", lesson: "B" },
      { note: "13 ones → 1 ten + 3 ones", lesson: "C" },
      { note: "3 tens + 1 ten = 4 tens", lesson: "C" },
      { note: "4 tens 3 ones", lesson: "C" },
      { note: "total = 43", lesson: "B" },
      { note: "number line: jump to 40, then 3 more", lesson: "D" },
    ],
    distractors: ["Lexington Market opens early", "apples can be red or green"],
    conclusion: {
      l1_2: "The total is [43].",
      l3_4: "So the total is [43] because [4 tens and 3 ones] make 43.",
      l5_6: "After [trading ten ones for a ten], I know the total is [43], and [a number line check] agrees.",
    },
  },
  prompt: {
    l1_2: "Draw 38 apples and 5 more. Write 1-3 sentences. Tell your steps.",
    l3_4: "Solve 38 + 5. Explain your steps in order with first, next, and then.",
    l5_6: "Solve 38 + 5. Explain each step and why you trade. Include an appositive and a sentence that starts with because or after.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Finally,", "So", "Because", "Now"],
  model: {
    l1_2: "First, I add the ones. Next, I trade 10 ones for 1 ten. The total is 43.",
    l3_4: "First, I add the ones, so 8 and 5 make 13. Next, I trade 10 ones for 1 ten because 13 ones is too many. Then I have 4 tens and 3 ones, so the total is 43.",
    l5_6: "First, I add the ones because they are the small parts. 8 and 5 make 13 ones, a number with a ten inside. Next, I trade 10 ones for 1 ten. After I trade, I have 4 tens and 3 ones. So the total is 43.",
  },
  revise: [
    "Did I use first, next, and then in order?",
    "Did I say why I traded 10 ones for 1 ten?",
    "Did I write the tens and ones after the trade?",
    "Did I end with the total as a number?",
  ],
};
