// BCPSS Writing Lab (TWR) — g2-math-u3 · Add & Subtract within 1,000. Contract: ../writing-schema.mjs

export default {
  title: "Steps for Adding Big Numbers",
  genre: "explain",
  tip: "Have students touch the ones, tens, and hundreds on a place value chart as they say each step out loud.",
  lessons: [
    { id: "A", title: "Add three-digit numbers" },
    { id: "B", title: "Regroup ones and tens when adding" },
    { id: "C", title: "Subtract three-digit numbers with regrouping" },
    { id: "D", title: "Estimate to check an answer" },
  ],
  source: {
    title: "The Can Drive Total",
    lesson: "A",
    text: "A class in Baltimore collects 347 cans in May. In June, they collect 186 more. First, they add the ones: 7 + 6 = 13. They regroup 13 ones as 1 ten and 3 ones. Next, they add the tens: 4 + 8 + 1 = 13. They regroup again. Last, they add the hundreds: 3 + 1 + 1 = 5. The total is 533 cans.",
  },
  notes: [
    { sentence: "First, they add the ones: 7 + 6 = 13.", note: "ones 7 + 6 = 13 → regroup" },
    { sentence: "Next, they add the tens: 4 + 8 + 1 = 13.", note: "tens 4 + 8 + 1 = 13 → regroup" },
    { sentence: "Last, they add the hundreds: 3 + 1 + 1 = 5.", note: "hundreds 3 + 1 + 1 = 5" },
    { sentence: "The total is 533 cans.", note: "total = 533 cans" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The class regroups 13 ones",
      because: "13 ones is the same as 1 ten and 3 ones.",
      but: "the digit 3 stays in the ones place.",
      so: "they add 1 more ten to the tens column.",
    },
    {
      lesson: "A",
      kernel: "The total of 347 and 186 is 533",
      because: "we add the ones, the tens, and the hundreds.",
      but: "we must regroup two times to get it.",
      so: "the class has 533 cans in all.",
    },
    {
      lesson: "C",
      kernel: "We regroup when we subtract 425 − 168",
      because: "5 ones is not enough to take away 8 ones.",
      but: "the amount stays the same after we trade.",
      so: "we trade 1 ten for 10 ones.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The students add the ones.",
      parts: { when: "first", where: "in the ones column", why: "so they can regroup if needed" },
      model: "First, the students add the ones in the ones column so they can regroup if needed.",
    },
    {
      lesson: "D",
      kernel: "Nia estimated the answer.",
      parts: { when: "before she added", how: "with friendly numbers", why: "to check her work" },
      model: "Before she added, Nia estimated the answer with friendly numbers to check her work.",
    },
  ],
  fragments: [
    { text: "The ones add up to 13.", is_sentence: true },
    { text: "Regrouped 13 ones.", is_sentence: false, fix: "The class regrouped 13 ones." },
    { text: "Because 5 is less than 8.", is_sentence: false, fix: "We regroup because 5 is less than 8." },
    { text: "Last, I add the hundreds.", is_sentence: true },
    { text: "The total of 347 and 186.", is_sentence: false, fix: "The total of 347 and 186 is 533." },
    { text: "Next, we add the tens.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Regrouping, ___, helps when the ones add up to more than 9.",
      noun: "Regrouping",
      options: ["trading 10 ones for 1 ten", "lining up digits in columns", "a smart guess that is close"],
      answer: 0,
      model: "Regrouping, trading 10 ones for 1 ten, helps when the ones add up to more than 9.",
    },
    {
      lesson: "D",
      sentence: "An estimate, ___, tells us if a total makes sense.",
      noun: "estimate",
      options: ["a trade of 1 ten for 10 ones", "a smart guess that is close", "the digit in the hundreds place"],
      answer: 1,
      model: "An estimate, a smart guess that is close, tells us if a total makes sense.",
    },
    {
      lesson: "A",
      sentence: "The total, ___, is 533 cans.",
      noun: "total",
      options: ["the digit on the far right", "a trade of 1 ten for 10 ones", "the whole amount after adding everything"],
      answer: 2,
      model: "The total, the whole amount after adding everything, is 533 cans.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "they regroup 13 ones as 1 ten and 3 ones", model: "When the ones make 13, they regroup 13 ones as 1 ten and 3 ones." },
    { lesson: "A", conjunction: "because", stem: "the class regroups again", model: "Because 4 + 8 + 1 makes 13 tens, the class regroups again." },
    { lesson: "C", conjunction: "before", stem: "Nia checks if she has enough ones", model: "Before she subtracts, Nia checks if she has enough ones." },
  ],
  spo: {
    topic: {
      l1_2: "To add [347 + 186], I add the [ones, tens, and hundreds].",
      l3_4: "To add [347 + 186], I follow [three steps] and regroup [two times].",
      l5_6: "Although [347 + 186] uses big numbers, [adding place by place] makes the steps clear and gives the total [533].",
    },
    starters: [
      { type: "question", text: "How can we add 347 and 186 without a mistake?" },
      { type: "appositive", text: "Regrouping, a trade of 10 ones for 1 ten, helps us add big numbers." },
      { type: "subordinate", text: "Before we add, we line up the digits so ones sit under ones." },
    ],
    details: [
      { note: "line up digits: ones under ones", lesson: "A" },
      { note: "ones: 7 + 6 = 13 → regroup", lesson: "B" },
      { note: "tens: 4 + 8 + 1 = 13, regroup", lesson: "B" },
      { note: "hundreds: 3 + 1 + 1 = 5", lesson: "A" },
      { note: "total = 533", lesson: "A" },
      { note: "estimate 350 + 200 = 550, close to 533", lesson: "D" },
    ],
    distractors: ["cans are made of metal", "the class also recycles paper"],
    conclusion: {
      l1_2: "The total is [533].",
      l3_4: "Last, I add the [hundreds], so the total is [533].",
      l5_6: "In the end, [adding place by place] gives [533 cans], and the estimate [shows it makes sense].",
    },
  },
  prompt: {
    l1_2: "Draw 347 cans and 186 cans. Write 1-3 sentences about how to add them.",
    l3_4: "Write a paragraph that explains the steps to add 347 + 186. Use first, next, then, and last.",
    l5_6: "Write a paragraph that explains how to add 347 + 186 and check the total. Include an appositive and a sentence that starts with when or before.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Last,", "Finally,", "Because", "So"],
  model: {
    l1_2: "First, I add the ones. Then I add the tens and hundreds. The total is 533.",
    l3_4: "First, I add the ones: 7 + 6 = 13, so I regroup. Next, I add the tens: 4 + 8 + 1 = 13, so I regroup again. Last, I add the hundreds: 3 + 1 + 1 = 5. The total is 533.",
    l5_6: "Before I add 347 + 186, I line up the digits. Regrouping, a trade of 10 for 1 in the next place, is needed two times. The ones make 13, and the tens make 13. When I add the hundreds, I get 5. The total is 533, and my estimate of 550 is close.",
  },
  revise: [
    "Did I tell the steps in order with first, next, and last?",
    "Did I use the real numbers 347, 186, and 533?",
    "Did I say when I regroup and why?",
    "Did I name the ones, tens, and hundreds correctly?",
  ],
};
