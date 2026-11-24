// BCPSS Writing Lab (TWR) — g4-math-u2 · Multi-Digit Multiplication & Division. Contract: ../writing-schema.mjs

export default {
  title: "Defend the Sticker Total",
  genre: "argue",
  tip: "Ask students to state their claim in one sentence first, then add the numbers that prove it.",
  lessons: [
    { id: "A", title: "Multiplying with an area model" },
    { id: "B", title: "Partial products and estimating" },
    { id: "C", title: "Dividing with remainders" },
    { id: "D", title: "Justifying a strategy" },
  ],
  source: {
    title: "Gift Bags for the Winter Fair",
    lesson: "B",
    text: "Priya and Marcus fill gift bags for the winter fair. Each bag gets 7 crab stickers, and they fill 43 bags. Priya draws an area model that splits 43 into 40 and 3. The partial products are 280 and 21, so the total is 301 stickers. Marcus estimates first. Since 7 × 40 is 280, he knows the total should be a little more than 280. Then they pack the stickers into boxes of 8. Marcus divides 301 by 8 and gets a quotient of 37 with a remainder of 5. They need 38 boxes because the 5 extra stickers still need a box.",
  },
  notes: [
    { sentence: "The partial products are 280 and 21, so the total is 301 stickers.", note: "280 + 21 = 301 stickers" },
    { sentence: "Since 7 × 40 is 280, he knows the total should be a little more than 280.", note: "7 × 40 = 280 → total > 280" },
    { sentence: "Marcus divides 301 by 8 and gets a quotient of 37 with a remainder of 5.", note: "301 ÷ 8 = 37 R 5" },
    { sentence: "They need 38 boxes because the 5 extra stickers still need a box.", note: "R 5 needs box → 38 boxes" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Priya chose an area model for 7 × 43",
      because: "it splits 43 into 40 and 3, which are easy numbers to use.",
      but: "an area model takes more room on the page than the algorithm.",
      so: "she found the partial products 280 and 21.",
    },
    {
      lesson: "B",
      kernel: "Marcus estimated 7 × 40 before he checked the total",
      because: "he wanted a quick check that the answer would make sense.",
      but: "the estimate of 280 was not the exact answer.",
      so: "he knew the total should be a little more than 280.",
    },
    {
      lesson: "C",
      kernel: "The stickers needed 38 boxes",
      because: "the remainder of 5 stickers still needed a box.",
      but: "the quotient of 301 ÷ 8 is only 37.",
      so: "he rounded up and did not drop the extras.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Marcus checked the total.",
      parts: { when: "before the fair", how: "with an estimate of 280", why: "to be sure it made sense" },
      model: "Before the fair, Marcus checked the total with an estimate of 280 to be sure it made sense.",
    },
    {
      lesson: "A",
      kernel: "Priya drew an area model.",
      parts: { where: "on her paper", how: "by splitting 43 into 40 and 3", why: "to make easy partial products" },
      model: "Priya drew an area model on her paper by splitting 43 into 40 and 3 to make easy partial products.",
    },
  ],
  fragments: [
    { text: "The partial products are 280 and 21.", is_sentence: true },
    { text: "Splits 43 into 40 and 3.", is_sentence: false, fix: "The area model splits 43 into 40 and 3." },
    { text: "Since the remainder is 5.", is_sentence: false, fix: "They need another box since the remainder is 5." },
    { text: "Marcus divides 301 by 8.", is_sentence: true },
    { text: "The quotient of 37 with a remainder of 5.", is_sentence: false, fix: "The quotient is 37 with a remainder of 5." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The area model, ___, splits 43 into 40 and 3.",
      noun: "area model",
      options: ["a rectangle drawing that breaks a problem into parts", "the amount left over after making equal groups", "the number that is being split into equal groups"],
      answer: 0,
      model: "The area model, a rectangle drawing that breaks a problem into parts, splits 43 into 40 and 3.",
    },
    {
      lesson: "B",
      sentence: "A partial product, ___, is one piece of the total in an area model.",
      noun: "partial product",
      options: ["the number you divide by", "the amount left over after making equal groups", "the answer you get when you multiply one part of a number"],
      answer: 2,
      model: "A partial product, the answer you get when you multiply one part of a number, is one piece of the total in an area model.",
    },
    {
      lesson: "C",
      sentence: "The remainder, ___, tells Marcus to round up to 38 boxes.",
      noun: "remainder",
      options: ["the answer to a multiplication problem", "the amount left over after making equal groups", "a drawing of a rectangle that splits a problem"],
      answer: 1,
      model: "The remainder, the amount left over after making equal groups, tells Marcus to round up to 38 boxes.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "since", stem: "Marcus knows the total should be a little more than 280", model: "Since 7 × 40 is 280, Marcus knows the total should be a little more than 280." },
    { lesson: "C", conjunction: "because", stem: "they need 38 boxes", model: "Because the 5 extra stickers still need a box, they need 38 boxes." },
    { lesson: "A", conjunction: "although", stem: "Priya chose the area model for 7 × 43", model: "Although the standard algorithm is shorter, Priya chose the area model for 7 × 43." },
  ],
  spo: {
    topic: {
      l1_2: "I think [301] is [right].",
      l3_4: "I believe 301 stickers is the correct total because [the area model and the estimate agree].",
      l5_6: "Although [an estimate] is not exact, [Priya's area model] proves that 301 is the correct total because [every partial product is easy to check].",
    },
    starters: [
      { type: "question", text: "How can you prove that 301 stickers is the right total for 7 × 43?" },
      { type: "appositive", text: "Priya, a careful fourth grader, used an area model to find 301 stickers." },
      { type: "subordinate", text: "Before she trusted her answer, Priya checked it with an estimate." },
    ],
    details: [
      { note: "area model: 43 = 40 + 3", lesson: "A" },
      { note: "partial products: 280 and 21", lesson: "B" },
      { note: "280 + 21 = 301", lesson: "B" },
      { note: "estimate: 7 × 40 = 280, total > 280", lesson: "D" },
      { note: "301 ÷ 8 = 37 R 5", lesson: "C" },
      { note: "R 5 needs a box → 38 boxes", lesson: "C" },
    ],
    distractors: ["crab stickers come in bright colors", "the winter fair starts at noon"],
    conclusion: {
      l1_2: "So the answer is [301].",
      l3_4: "Therefore, 301 is correct because the [estimate] and the [partial products] agree.",
      l5_6: "Since [the model] and [the estimate] both support the answer, [301 stickers] is a total I can defend.",
    },
  },
  prompt: {
    l1_2: "Draw an area model for 7 × 43. Write 2-3 sentences that tell the total and why you think it is right. Use the words area model and estimate.",
    l3_4: "Write a paragraph that argues Priya's total of 301 stickers is correct. Use your outline, because, and so.",
    l5_6: "Write a paragraph that defends 7 × 43 = 301 and explains why the 5 leftover stickers mean they need 38 boxes. Include an appositive and a sentence that starts with since or although.",
  },
  transitions: ["I think", "because", "So", "Since", "For example,", "Although", "Therefore,", "This proves that"],
  model: {
    l1_2: "I think 301 is right. The area model gives 280 and 21. 280 plus 21 is 301.",
    l3_4: "I believe 301 stickers is the correct total because the area model and the estimate agree. Priya split 43 into 40 and 3, so the partial products were 280 and 21. She added them to get 301. Marcus estimated 7 × 40 and got 280, so he knew the total should be a little more. Therefore, 301 is correct because the estimate and the partial products agree.",
    l5_6: "Although an estimate is not exact, Priya's area model proves that 301 is the correct total for 7 × 43. The area model, a rectangle drawing that breaks a problem into parts, split 43 into 40 and 3. The partial products were 280 and 21, and their sum was 301. Since 7 × 40 is 280, Marcus knew the total had to be a little more than 280. Then they packed the stickers into boxes of 8, and 301 ÷ 8 gave a quotient of 37 with a remainder of 5. They needed 38 boxes because the 5 extra stickers still needed a box. Since the model and the estimate both support the answer, 301 stickers is a total I can defend.",
  },
  revise: [
    "Did I state my claim first and say whether the answer is correct?",
    "Did I use real numbers, like the partial products 280 and 21?",
    "Did I give a reason with because, since, or so?",
    "Did I explain what the remainder means for the boxes?",
  ],
};
