// BCPSS Writing Lab (TWR) — g3-math-u5 · Multi-Digit Addition, Subtraction & Rounding. Contract: ../writing-schema.mjs

export default {
  title: "Rounding for the Food Drive",
  genre: "explain",
  tip: "Have students circle the digit next door before they round, so every up or down is tied to a clear cause.",
  lessons: [
    { id: "A", title: "Round to the nearest ten" },
    { id: "B", title: "Round to the nearest hundred" },
    { id: "C", title: "Estimate sums and differences" },
    { id: "D", title: "Add and subtract within 1,000" },
  ],
  source: {
    title: "Counting Cans",
    lesson: "B",
    text: "Ms. Grant's class runs a food drive for the school. On Monday, they collect 364 cans. On Tuesday, they collect 218 cans. First, they round 364 to the nearest hundred. The tens digit is 6, which is 5 or more, so 364 rounds up to 400. Next, they round 218. The tens digit is 1, so 218 rounds down to 200. As a result, the estimate is 400 + 200 = 600. The exact total is 582, which is close to 600. So the answer is reasonable.",
  },
  notes: [
    { sentence: "The tens digit is 6, which is 5 or more, so 364 rounds up to 400.", note: "tens digit 6 (5+) → 364 up to 400" },
    { sentence: "The tens digit is 1, so 218 rounds down to 200.", note: "tens digit 1 → 218 down to 200" },
    { sentence: "As a result, the estimate is 400 + 200 = 600.", note: "estimate: 400 + 200 = 600" },
    { sentence: "The exact total is 582, which is close to 600.", note: "exact 582 ≈ 600 → reasonable" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The number 364 rounds up to 400",
      because: "the tens digit, 6, is 5 or more.",
      but: "364 is not exactly the same as 400.",
      so: "we use 400 when we estimate the total.",
    },
    {
      lesson: "A",
      kernel: "The number 218 rounds up to 220",
      because: "the ones digit, 8, is 5 or more.",
      but: "it rounds down to 200 when we round to the nearest hundred.",
      so: "we must name the place we are rounding to.",
    },
    {
      lesson: "C",
      kernel: "The estimate of 600 is close to the exact total",
      because: "the exact total, 582, is only 18 away.",
      but: "the two numbers are not exactly the same.",
      so: "the answer is reasonable.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The class collected cans.",
      parts: { when: "on Monday", where: "for the school food drive", why: "to help families in need" },
      model: "On Monday, the class collected cans for the school food drive to help families in need.",
    },
    {
      lesson: "B",
      kernel: "The class rounded 364.",
      parts: { when: "after looking at the tens digit", how: "to the nearest hundred", why: "to make an easy estimate" },
      model: "After looking at the tens digit, the class rounded 364 to the nearest hundred to make an easy estimate.",
    },
  ],
  fragments: [
    { text: "The tens digit is 6.", is_sentence: true },
    { text: "Because the tens digit is 1.", is_sentence: false, fix: "The number 218 rounds down because the tens digit is 1." },
    { text: "The estimate is close to the exact total.", is_sentence: true },
    { text: "Rounds up to 400.", is_sentence: false, fix: "The number 364 rounds up to 400." },
    { text: "When the digit is 5 or more.", is_sentence: false, fix: "A number rounds up when the digit is 5 or more." },
    { text: "They add 400 and 200.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "The tens digit, ___, decides how 364 rounds to the nearest hundred.",
      noun: "tens digit",
      options: ["the answer when you add", "the closest number that ends in 00", "the digit right next to the hundreds digit"],
      answer: 2,
      model: "The tens digit, the digit right next to the hundreds digit, decides how 364 rounds to the nearest hundred.",
    },
    {
      lesson: "C",
      sentence: "An estimate, ___, helps the class check the exact total.",
      noun: "estimate",
      options: ["an answer that is close, but not exact", "the answer when you subtract", "a number that always ends in 0"],
      answer: 0,
      model: "An estimate, an answer that is close, but not exact, helps the class check the exact total.",
    },
    {
      lesson: "D",
      sentence: "The sum, ___, tells the class how many cans they have.",
      noun: "sum",
      options: ["the digit that decides rounding", "the answer when you add", "a trade of 10 ones for 1 ten"],
      answer: 1,
      model: "The sum, the answer when you add, tells the class how many cans they have.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "364 rounds up to 400", model: "Because the tens digit is 6, 364 rounds up to 400." },
    { lesson: "C", conjunction: "since", stem: "the answer is reasonable", model: "Since 582 is close to 600, the answer is reasonable." },
    { lesson: "A", conjunction: "before", stem: "the class estimates the total", model: "Before they find the exact answer, the class estimates the total." },
  ],
  spo: {
    topic: {
      l1_2: "I [round] numbers to [estimate].",
      l3_4: "The class estimates the total cans by rounding each number to the nearest [hundred].",
      l5_6: "Because [the digit next door decides how a number rounds], the class can [estimate 364 + 218] and check that [the exact answer is reasonable].",
    },
    starters: [
      { type: "question", text: "How can rounding help you check an answer?" },
      { type: "command", text: "Look at the tens digit before you round to the nearest hundred." },
      { type: "subordinate", text: "Because the digit next door decides, 364 rounds up and 218 rounds down." },
    ],
    details: [
      { note: "364: tens digit 6 → up to 400", lesson: "B" },
      { note: "218: tens digit 1 → down to 200", lesson: "B" },
      { note: "estimate: 400 + 200 = 600", lesson: "C" },
      { note: "exact: 364 + 218 = 582", lesson: "D" },
      { note: "nearest ten: 364 → 360", lesson: "A" },
      { note: "582 close to 600 → reasonable", lesson: "C" },
    ],
    distractors: ["the food drive ran for one week", "cans are made of metal"],
    conclusion: {
      l1_2: "The [estimate] is [close].",
      l3_4: "So the estimate is [600], and the exact total, [582], is [close].",
      l5_6: "As a result, the estimate and the exact total are [close], which means [582 is reasonable].",
    },
  },
  prompt: {
    l1_2: "Draw the cans. Write 2-3 sentences. Tell how you round 364 and 218.",
    l3_4: "Explain how the class estimates the total number of cans and checks the exact answer. Use first, next, because, and so.",
    l5_6: "Explain what causes each number to round up or down, then show how the estimate checks the exact total. Include an appositive and a sentence that starts with because or since.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "So", "As a result,", "Since", "Finally,"],
  model: {
    l1_2: "I round 364 to 400. I round 218 to 200. The estimate is 600.",
    l3_4: "First, the class rounds 364 to the nearest hundred. The tens digit is 6, so 364 rounds up to 400. Next, they round 218 down to 200 because the tens digit is 1. The estimate is 400 + 200 = 600. The exact total, 582, is close, so the answer is reasonable.",
    l5_6: "Because the tens digit, the digit next door to the hundreds, decides how a number rounds, the class can estimate quickly. The tens digit in 364 is 6, which is 5 or more, so 364 rounds up to 400. Since the tens digit in 218 is 1, 218 rounds down to 200. As a result, the estimate is 400 + 200 = 600. The exact total, 582, is only 18 away from the estimate. That means the answer is reasonable, which helps the class catch mistakes.",
  },
  revise: [
    "Did I say which digit decides how the number rounds?",
    "Did I explain WHY each number rounds up or down with because?",
    "Did I show both the estimate and the exact answer?",
    "Did I explain why the answer is reasonable?",
  ],
};
