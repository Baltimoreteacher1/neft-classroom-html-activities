// BCPSS Writing Lab (TWR) — g7-math-u2 · Solve Percent Problems (Tax, Markup & Error). Contract: ../writing-schema.mjs

export default {
  title: "Defend Your Price",
  genre: "argue",
  tip: "Have students say why the method works in one sentence before they write any numbers, then check the total against an estimate.",
  lessons: [
    { id: "A", title: "Discounts and sale prices" },
    { id: "B", title: "Markup and sales tax" },
    { id: "C", title: "Simple interest on savings" },
    { id: "D", title: "Percent error and reasonable estimates" },
  ],
  source: {
    title: "Sneakers on Harford Road",
    lesson: "A",
    text: "Andre finds a pair of sneakers that cost $60 at a store on Harford Road. The sign says 20% off. Andre finds 20% of $60, which is $12, and subtracts it to get $48. Tasha says there is a faster way. She multiplies $60 by 0.8, because paying 80% of the price takes off the 20%. She also gets $48. Then the store adds 6% sales tax. Tasha multiplies $48 by 1.06 and gets $50.88. Andre estimates first. Since 6% of $50 is $3, he expects a total near $51. The estimate is reasonable because it is close to the exact total.",
  },
  notes: [
    { sentence: "Andre finds 20% of $60, which is $12, and subtracts it to get $48.", note: "20% of $60 = $12 → $60 − $12 = $48" },
    { sentence: "She multiplies $60 by 0.8, because paying 80% of the price takes off the 20%.", note: "× 0.8 = pay 80% → same $48" },
    { sentence: "Tasha multiplies $48 by 1.06 and gets $50.88.", note: "$48 × 1.06 = $50.88 (6% tax)" },
    { sentence: "Since 6% of $50 is $3, he expects a total near $51.", note: "6% of $50 = $3 → about $51" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Tasha multiplies the price by 0.8",
      because: "paying 80 percent of the price takes off the 20 percent discount.",
      but: "the way Andre subtracts takes two steps instead of one.",
      so: "the sale price is $48.",
    },
    {
      lesson: "B",
      kernel: "The store adds 6% sales tax to the $48",
      because: "the government charges a percent of the price at the register.",
      but: "the tax is not added to the original $60.",
      so: "the total cost is $50.88.",
    },
    {
      lesson: "D",
      kernel: "Andre estimates the total before he pays",
      because: "a quick estimate helps him check the exact answer.",
      but: "the estimate is not exactly the same as the total.",
      so: "he rounds $48 up to $50 and finds 6% of that.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Tasha multiplied the price.",
      parts: { when: "after reading the 20% off sign", how: "by 0.8", why: "to find the sale price in one step" },
      model: "After reading the 20% off sign, Tasha multiplied the price by 0.8 to find the sale price in one step.",
    },
    {
      lesson: "C",
      kernel: "Ana earned interest.",
      parts: { when: "after three years", where: "in her savings account", how: "at 5% each year", why: "because she saved $200" },
      model: "After three years, Ana earned interest in her savings account at 5% each year because she saved $200.",
    },
  ],
  fragments: [
    { text: "A discount is an amount taken off the regular price.", is_sentence: true },
    { text: "Because 25% of $40 is $10.", is_sentence: false, fix: "The discount is $10 because 25% of $40 is $10." },
    { text: "Multiplied the cost by 1.25.", is_sentence: false, fix: "Marcus multiplied the cost by 1.25." },
    { text: "Sales tax is a percent of the price added at the register.", is_sentence: true },
    { text: "Since the estimate is close to the exact answer.", is_sentence: false, fix: "Since the estimate is close to the exact answer, it is reasonable." },
    { text: "Simple interest uses only the starting amount.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Markup, ___, helps a store make money on what it sells.",
      noun: "Markup",
      options: ["the extra percent a store adds to its cost", "an amount taken off the regular price", "the starting amount you save or borrow"],
      answer: 0,
      model: "Markup, the extra percent a store adds to its cost, helps a store make money on what it sells.",
    },
    {
      lesson: "C",
      sentence: "Principal, ___, is the amount that earns simple interest.",
      noun: "Principal",
      options: ["the percent a store adds at the register", "the starting amount of money you save or borrow", "a quick answer found with friendly numbers"],
      answer: 1,
      model: "Principal, the starting amount of money you save or borrow, is the amount that earns simple interest.",
    },
    {
      lesson: "D",
      sentence: "Percent error, ___, helps Andre judge his estimate.",
      noun: "Percent error",
      options: ["extra money a store adds to its cost", "money earned on the starting amount only", "the size of a mistake compared with the exact value"],
      answer: 2,
      model: "Percent error, the size of a mistake compared with the exact value, helps Andre judge his estimate.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "since", stem: "Andre's estimate is reasonable", model: "Since 6% of $50 is $3, Andre's estimate is reasonable." },
    { lesson: "A", conjunction: "because", stem: "Tasha multiplies by 0.8", model: "Because paying 80% takes off the 20% discount, Tasha multiplies by 0.8." },
    { lesson: "C", conjunction: "when", stem: "the bank pays the same amount each year", model: "When the bank uses simple interest, it pays the same amount each year." },
  ],
  spo: {
    topic: {
      l1_2: "I found the [sale price] by [multiplying] because [the method works].",
      l3_4: "I found the total price by [multiplying $48 by 1.06] because [a 6% tax adds 6% of the price], and my answer is reasonable since [the estimate is close].",
      l5_6: "Since [multiplying by 0.8 takes off 20%], [Tasha's one-step method] gives the same sale price as [Andre's two steps], and the exact total of [$50.88] is reasonable because [it matches the estimate].",
    },
    starters: [
      { type: "question", text: "Which is faster, subtracting a discount or multiplying by a decimal?" },
      { type: "statement", text: "Two different methods can lead to the same sale price." },
      { type: "appositive", text: "Tasha, a careful shopper, checks her total with an estimate." },
    ],
    details: [
      { note: "20% of $60 = $12, so $48", lesson: "A" },
      { note: "× 0.8 = pay 80%, same $48", lesson: "A" },
      { note: "6% tax on $48: $48 × 1.06", lesson: "B" },
      { note: "total = $50.88", lesson: "B" },
      { note: "estimate: 6% of $50 = $3", lesson: "D" },
      { note: "total near $51 = reasonable", lesson: "D" },
    ],
    distractors: ["the sneakers come in many colors", "Harford Road has many shops"],
    conclusion: {
      l1_2: "My answer is [reasonable] because it is [close] to my [estimate].",
      l3_4: "Therefore, the total is [$50.88], and it is reasonable since [it is close to my estimate of $51].",
      l5_6: "Because [both methods agree] and [the estimate is close], I am confident that the total of [$50.88] is [right and reasonable].",
    },
  },
  prompt: {
    l1_2: "Look at the sneakers: $60, 20% off. Write 3 sentences. Tell the sale price and why your method works.",
    l3_4: "Write a paragraph that finds the total price of the sneakers with 20% off and 6% sales tax. Use numbers, explain why your method works, and say why your answer is reasonable.",
    l5_6: "Write a paragraph that defends the total price of the sneakers. Compare Tasha's method with Andre's, show the sales tax, and justify your answer with an estimate. Include an appositive and a sentence that starts with since or although.",
  },
  transitions: ["First,", "Next,", "This works because", "Since", "So", "Therefore,", "Although", "As shown by"],
  model: {
    l1_2: "I found the sale price by multiplying $60 by 0.8. This works because paying 80% takes off the 20%. The sale price is $48.",
    l3_4: "I found the total price by multiplying $48 by 1.06 because a 6% tax adds 6% of the price. First, I found the sale price. I multiplied $60 by 0.8, so the sale price is $48. Then I multiplied $48 by 1.06, which gives $50.88. My answer is reasonable since 6% of $50 is $3, and $48 plus about $3 is close to $51.",
    l5_6: "Since multiplying by 0.8 takes off 20%, Tasha's one-step method gives the same sale price as Andre's two steps. Andre, a careful shopper, found 20% of $60, which is $12, and subtracted it to get $48. Tasha multiplied $60 by 0.8 and also got $48. Both methods work because paying 80% of the price is the same as taking off a 20% discount. Next, the 6% sales tax adds $2.88, so the exact total is $50.88. Although Andre rounded the price to $50 before he estimated, his estimate of about $51 is still reasonable. It is close because 6% of $50 is $3, which is near $2.88. Therefore, both the method and the answer are justified.",
  },
  mpo: {
    thesis: "Tasha's one-step method and Andre's two-step method both give a sale price of $48, and the total of $50.88 with tax is reasonable because it matches an estimate.",
    paragraphs: [
      { topic: "Both methods find the same sale price because multiplying by 0.8 takes off 20 percent.", notes: ["Andre: 20% of $60 = $12, $60 − $12 = $48", "Tasha: $60 × 0.8 = $48", "pay 80% = take off 20%"] },
      { topic: "The sales tax is found on the sale price, not on the original price.", notes: ["6% of $48 = $2.88", "$48 × 1.06 = $50.88"] },
      { topic: "An estimate shows the total is reasonable.", notes: ["round $48 → $50", "6% of $50 = $3", "about $51 ≈ $50.88"] },
    ],
    conclusion: "Because two methods agree and an estimate is close, I can justify that the sneakers cost $50.88 with tax.",
  },
  revise: [
    "Did I show each calculation, such as 20% of $60 = $12, with the correct answer?",
    "Did I say why my method works, using because or since?",
    "Did I find the tax on the sale price, not on the original price?",
    "Did I use an estimate to explain why my answer is reasonable?",
  ],
};
