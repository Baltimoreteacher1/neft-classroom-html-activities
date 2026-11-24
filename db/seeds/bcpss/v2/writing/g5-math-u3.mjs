// BCPSS Writing Lab (TWR) — g5-math-u3 · Multi-Digit Whole Number & Decimal Operations. Contract: ../writing-schema.mjs

export default {
  title: "Steps to the Right Total",
  genre: "explain",
  tip: "Have students touch each step on a four-box chart while they say First, Next, Then, Finally before they write.",
  lessons: [
    { id: "A", title: "Multiplying multi-digit whole numbers" },
    { id: "B", title: "Adding and subtracting decimals" },
    { id: "C", title: "Multiplying decimals with estimates" },
    { id: "D", title: "Dividing decimals to hundredths" },
  ],
  source: {
    title: "Crab Cakes at Lexington Market",
    lesson: "C",
    text: "At Lexington Market, Devon buys 3 crab cakes. Each one costs $4.25. First, he estimates the cost. He rounds 4.25 to 4 and multiplies 4 by 3 to get about 12 dollars. Next, he multiplies 425 by 3 and gets 1,275. Then he places the decimal point. Because 4.25 has two decimal places, the product does too, so the answer is $12.75. Finally, he compares $12.75 to his estimate of 12. The two numbers are close, so his answer makes sense.",
  },
  notes: [
    { sentence: "He rounds 4.25 to 4 and multiplies 4 by 3 to get about 12 dollars.", note: "estimate: 4 × 3 ≈ 12" },
    { sentence: "Next, he multiplies 425 by 3 and gets 1,275.", note: "425 × 3 = 1,275" },
    { sentence: "Because 4.25 has two decimal places, the product does too, so the answer is $12.75.", note: "2 decimal places → $12.75" },
    { sentence: "The two numbers are close, so his answer makes sense.", note: "close to estimate = reasonable" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Devon multiplies 425 by 3 first",
      because: "whole numbers are easier to multiply than decimals.",
      but: "the answer is not $1,275.",
      so: "he must place the decimal point to finish.",
    },
    {
      lesson: "C",
      kernel: "Devon estimates before he multiplies",
      because: "an estimate shows what size the answer should be.",
      but: "an estimate is not the exact answer.",
      so: "he compares the product to the estimate at the end.",
    },
    {
      lesson: "B",
      kernel: "Devon lines up the decimal points before he adds",
      because: "digits with the same place value must be added together.",
      but: "the numbers may have different numbers of digits.",
      so: "he writes zeros in the empty places.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Maya multiplied.",
      parts: { what: "34 by 26", how: "with partial products", why: "to count the chairs in the theater" },
      model: "Maya multiplied 34 by 26 with partial products to count the chairs in the theater.",
    },
    {
      lesson: "C",
      kernel: "Devon placed the decimal point.",
      parts: { when: "after multiplying", where: "two places from the right", why: "because 4.25 has two decimal places" },
      model: "After multiplying, Devon placed the decimal point two places from the right because 4.25 has two decimal places.",
    },
  ],
  fragments: [
    { text: "A quotient is the answer to a division problem.", is_sentence: true },
    { text: "First, estimating the cost.", is_sentence: false, fix: "First, Devon estimates the cost." },
    { text: "Devon multiplies 425 by 3.", is_sentence: true },
    { text: "Because the product has two decimal places.", is_sentence: false, fix: "The answer is $12.75 because the product has two decimal places." },
    { text: "Checks the answer against the estimate.", is_sentence: false, fix: "Devon checks the answer against the estimate." },
    { text: "Each partial product, one piece of a multiplication problem.", is_sentence: false, fix: "Each partial product is one piece of a multiplication problem." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A partial product, ___, is added to the others to make the answer.",
      noun: "partial product",
      options: ["one piece of a multiplication problem", "the number you divide by", "the answer to a division problem"],
      answer: 0,
      model: "A partial product, one piece of a multiplication problem, is added to the others to make the answer.",
    },
    {
      lesson: "C",
      sentence: "An estimate, ___, tells Devon what size the answer should be.",
      noun: "estimate",
      options: ["a close answer found quickly", "the number that is being split up", "the answer to a multiplication problem"],
      answer: 0,
      model: "An estimate, a close answer found quickly, tells Devon what size the answer should be.",
    },
    {
      lesson: "D",
      sentence: "The divisor, ___, is 4 when four friends share $10.40.",
      noun: "divisor",
      options: ["the number being split up", "the number you divide by", "the answer to the problem"],
      answer: 1,
      model: "The divisor, the number you divide by, is 4 when four friends share $10.40.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "after", stem: "she adds them", model: "After Maya finds each partial product, she adds them." },
    { lesson: "C", conjunction: "before", stem: "Devon estimates the cost", model: "Before he multiplies, Devon estimates the cost." },
    { lesson: "D", conjunction: "when", stem: "each share is $2.60", model: "When the friends divide $10.40 by 4, each share is $2.60." },
  ],
  spo: {
    topic: {
      l1_2: "To find the cost, I [estimate], [multiply], and [check].",
      l3_4: "First, I estimated [4.25 × 3] to be about [12]. Next, I [multiplied 425 by 3].",
      l5_6: "Although [multiplying decimals looks hard], I can find the exact cost by [estimating, multiplying whole numbers, placing the decimal point, and checking].",
    },
    starters: [
      { type: "command", text: "Follow Devon's steps to find the cost of 3 crab cakes." },
      { type: "question", text: "How can you multiply a decimal and know your answer makes sense?" },
      { type: "subordinate", text: "Before you multiply a decimal, estimate so you know what size the answer should be." },
    ],
    details: [
      { note: "estimate: 4 × 3 ≈ 12", lesson: "C" },
      { note: "multiply whole numbers: 425 × 3 = 1,275", lesson: "A" },
      { note: "4.25 has 2 decimal places", lesson: "C" },
      { note: "place decimal point: $12.75", lesson: "C" },
      { note: "check: close to estimate = reasonable", lesson: "C" },
      { note: "adding decimals: line up decimal points", lesson: "B" },
    ],
    distractors: ["Lexington Market has many food stalls", "crab cakes taste good with mustard"],
    conclusion: {
      l1_2: "My answer makes [sense] because it is close to my [estimate].",
      l3_4: "Finally, I checked by [comparing], and the answer makes sense because [it is close to my estimate].",
      l5_6: "In the end, the answer, [$12.75], is reasonable because [it is close to the estimate of 12], so the steps worked.",
    },
  },
  prompt: {
    l1_2: "Draw 3 crab cakes with the price. Write 2-4 sentences. Use First, Next, and Then to tell how to find the cost.",
    l3_4: "Write a paragraph that explains the steps for finding the cost of 3 crab cakes at $4.25 each. Use your outline and the words First, Next, Then, and Finally.",
    l5_6: "Write a paragraph that explains, step by step, how to multiply 4.25 by 3 so another student can follow and check your work. Include an appositive and a sentence that starts with although, before, or after.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Finally,", "Before", "So", "As a result,"],
  model: {
    l1_2: "First, Devon estimates the cost. Next, he multiplies 425 by 3. Then he places the decimal point. The cost is $12.75.",
    l3_4: "To find the cost of 3 crab cakes at $4.25 each, I followed four steps. First, I estimated 4 × 3 to be about 12. Next, I multiplied 425 by 3 and got 1,275. Then I placed the decimal point two places from the right, so the cost is $12.75. Finally, I compared $12.75 to my estimate, and the answer makes sense because it is close to 12.",
    l5_6: "Although multiplying decimals can look hard, Devon found the exact cost of 3 crab cakes in four clear steps. First, he made an estimate, a close answer found quickly, by multiplying 4 by 3 to get about 12 dollars. Next, he multiplied 425 by 3 as whole numbers and got 1,275. Then he placed the decimal point two places from the right, because $4.25 has two decimal places. After he placed it, the product was $12.75. Finally, Devon compared the product to his estimate, and the two numbers were close. As a result, he knew that his answer was reasonable.",
  },
  mpo: {
    thesis: "Multiplying decimals follows four steps that anyone can repeat: estimate, multiply, place the decimal point, and check.",
    paragraphs: [
      { topic: "First, estimate to learn the size of the answer.", notes: ["round 4.25 to 4", "4 × 3 ≈ 12"] },
      { topic: "Next, multiply as if the numbers were whole.", notes: ["425 × 3 = 1,275", "partial products help", "ignore decimal point for now"] },
      { topic: "Then place the decimal point and check the answer.", notes: ["4.25 has 2 decimal places", "answer = $12.75", "close to estimate = reasonable"] },
    ],
    conclusion: "By estimating, multiplying, placing the decimal point, and checking, anyone can explain a decimal product and trust it.",
  },
  revise: [
    "Did I put the steps in order with First, Next, Then, and Finally?",
    "Did I include the estimate and say how I used it to check?",
    "Did I explain where the decimal point goes and why?",
    "Did I use math words like product, estimate, and decimal places correctly?",
  ],
};
