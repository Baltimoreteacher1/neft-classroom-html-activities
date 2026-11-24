// BCPSS Writing Lab (TWR) — g2-math-u2 · Fluently Add & Subtract within 100. Contract: ../writing-schema.mjs

export default {
  title: "Prove It Makes Sense",
  genre: "argue",
  tip: "Have students solve with blocks or a number line first, then say the estimate aloud before writing the proof.",
  lessons: [
    { id: "A", title: "Add with partial sums" },
    { id: "B", title: "Subtract with a number line" },
    { id: "C", title: "Regroup tens and ones" },
    { id: "D", title: "Estimate to check an answer" },
  ],
  source: {
    title: "Dre's Sticker Count",
    lesson: "A",
    text: "Dre has 38 crab stickers. His cousin gives him 27 more. Dre adds the tens: 30 + 20 = 50. Then he adds the ones: 8 + 7 = 15. He puts 50 and 15 together. Dre has 65 stickers. His answer is reasonable because 40 + 30 = 70 is close to 65.",
  },
  notes: [
    { sentence: "Dre adds the tens: 30 + 20 = 50.", note: "tens: 30 + 20 = 50" },
    { sentence: "Then he adds the ones: 8 + 7 = 15.", note: "ones: 8 + 7 = 15" },
    { sentence: "He puts 50 and 15 together.", note: "50 + 15 = 65" },
    { sentence: "His answer is reasonable because 40 + 30 = 70 is close to 65.", note: "estimate 40 + 30 = 70 ≈ 65" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Dre's answer of 65 makes sense",
      because: "his estimate of 70 is close to 65.",
      but: "65 is not exactly 70.",
      so: "he can trust his answer.",
    },
    {
      lesson: "C",
      kernel: "Dre regroups 15 ones",
      because: "15 ones is the same as 1 ten and 5 ones.",
      but: "he does not change the total.",
      so: "50 + 15 becomes 60 + 5.",
    },
    {
      lesson: "B",
      kernel: "A number line can show 52 − 27",
      because: "we can hop up from 27 to 52.",
      but: "we could also count back from 52.",
      so: "the hops of 3, 20, and 2 show a difference of 25.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Dre added the tens.",
      parts: { when: "first", how: "with partial sums", why: "to make the problem easier" },
      model: "First, Dre added the tens with partial sums to make the problem easier.",
    },
    {
      lesson: "D",
      kernel: "Kai checked his answer.",
      parts: { when: "after solving", how: "with an estimate", why: "to see if it made sense" },
      model: "After solving, Kai checked his answer with an estimate to see if it made sense.",
    },
  ],
  fragments: [
    { text: "The sum of 38 and 27 is 65.", is_sentence: true },
    { text: "Because 70 is close to 65.", is_sentence: false, fix: "The answer is reasonable because 70 is close to 65." },
    { text: "Added the tens first.", is_sentence: false, fix: "Dre added the tens first." },
    { text: "Ten ones make one ten.", is_sentence: true },
    { text: "The estimate of 70.", is_sentence: false, fix: "The estimate of 70 is close to 65." },
    { text: "First, I add the ones.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Partial sums, ___, make adding easier.",
      noun: "Partial sums",
      options: ["small answers from adding the tens and ones apart", "a line with numbers in order", "a smart guess that is close"],
      answer: 0,
      model: "Partial sums, small answers from adding the tens and ones apart, make adding easier.",
    },
    {
      lesson: "D",
      sentence: "An estimate, ___, helps us check an answer.",
      noun: "estimate",
      options: ["the answer to an adding problem", "a smart guess that is close to the real answer", "a trade of 10 ones for 1 ten"],
      answer: 1,
      model: "An estimate, a smart guess that is close to the real answer, helps us check an answer.",
    },
    {
      lesson: "B",
      sentence: "A number line, ___, can show a subtraction problem.",
      noun: "number line",
      options: ["the answer you get when you subtract", "a group of ten ones", "a line with numbers in order"],
      answer: 2,
      model: "A number line, a line with numbers in order, can show a subtraction problem.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "we regroup 10 ones as 1 ten", model: "When the ones add up to 10 or more, we regroup 10 ones as 1 ten." },
    { lesson: "D", conjunction: "because", stem: "his answer is reasonable", model: "Because 70 is close to 65, his answer is reasonable." },
    { lesson: "A", conjunction: "after", stem: "he adds the ones", model: "After Dre adds the tens, he adds the ones." },
  ],
  spo: {
    topic: {
      l1_2: "[38 + 27 = 65] makes sense.",
      l3_4: "Dre's answer of [65] is reasonable because [his estimate of 70 is close].",
      l5_6: "Although [65] is not exactly [70], Dre's answer is reasonable because [the estimate is close and the steps are correct].",
    },
    starters: [
      { type: "question", text: "How can Dre know that 65 is a good answer?" },
      { type: "appositive", text: "Dre, a collector of crab stickers, checks his answer with an estimate." },
      { type: "subordinate", text: "Before Dre trusts his answer, he checks it with an estimate." },
    ],
    details: [
      { note: "tens: 30 + 20 = 50", lesson: "A" },
      { note: "ones: 8 + 7 = 15", lesson: "A" },
      { note: "regroup 15 = 1 ten + 5 ones", lesson: "C" },
      { note: "50 + 15 = 65", lesson: "C" },
      { note: "estimate 40 + 30 = 70", lesson: "D" },
      { note: "70 close to 65 = reasonable", lesson: "D" },
    ],
    distractors: ["crab stickers come in packs", "Dre trades stickers at recess"],
    conclusion: {
      l1_2: "So Dre has [65] stickers.",
      l3_4: "So Dre has [65] stickers, and his answer is [reasonable].",
      l5_6: "In conclusion, [65] is the sum, and the estimate shows [the answer makes sense].",
    },
  },
  prompt: {
    l1_2: "Draw 38 and 27 stickers. Write 1-3 sentences that tell the sum.",
    l3_4: "Write a paragraph that proves 38 + 27 = 65 is a reasonable answer. Use first, then, and because.",
    l5_6: "Write a paragraph that proves 38 + 27 = 65 with partial sums, regrouping, and an estimate. Include an appositive and a sentence that starts with although or when.",
  },
  transitions: ["First,", "Then,", "Next,", "Because", "So", "Since", "Finally,", "For example,"],
  model: {
    l1_2: "Dre adds 38 + 27. The sum is 65. It makes sense.",
    l3_4: "First, Dre adds the tens: 30 + 20 = 50. Then he adds the ones: 8 + 7 = 15. The sum is 65 because 50 + 15 = 65. His answer is reasonable because 40 + 30 = 70 is close.",
    l5_6: "Dre adds 38 + 27 with partial sums. The tens make 50, and the ones make 15. When he regroups 15 as 1 ten and 5 ones, he gets 65. Dre, a careful collector, checks with an estimate. Although 40 + 30 = 70 is not exact, it is close, so 65 is reasonable.",
  },
  revise: [
    "Did I show my steps in order with first and then?",
    "Did I use the real numbers 38, 27, and 65?",
    "Did I use an estimate to prove my answer is reasonable?",
    "Did I use because to give my reason?",
  ],
};
