// BCPSS Writing Lab (TWR) — g4-math-u1 · Place Value & Multi-Digit Operations. Contract: ../writing-schema.mjs

export default {
  title: "Does the Sum Make Sense?",
  genre: "explain",
  tip: "Have students read each number aloud with its place names before they write, so the place-value words are ready to use.",
  lessons: [
    { id: "A", title: "Ten times as much in each place" },
    { id: "B", title: "Reading and writing numbers in expanded form" },
    { id: "C", title: "Rounding and estimating sums" },
    { id: "D", title: "Adding and subtracting with regrouping" },
  ],
  source: {
    title: "Counting Visitors at the Park",
    lesson: "D",
    text: "Zoe counts visitors at Patterson Park on a weekend. On Saturday, 3,482 people came. On Sunday, 2,659 people came. First, Zoe estimates. She rounds 3,482 to 3,000 and 2,659 to 3,000, so her estimate is about 6,000. Next, she adds the exact numbers. Two ones plus nine ones is 11 ones, so she regroups 10 ones as 1 ten. The sum is 6,141. Her answer is close to 6,000, so it makes sense. Zoe also notices that the 6 in 6,141 is worth 6,000. That is ten times as much as 600.",
  },
  notes: [
    { sentence: "She rounds 3,482 to 3,000 and 2,659 to 3,000, so her estimate is about 6,000.", note: "round → 3,000 + 3,000 ≈ 6,000" },
    { sentence: "Two ones plus nine ones is 11 ones, so she regroups 10 ones as 1 ten.", note: "2 + 9 = 11 ones → regroup 1 ten" },
    { sentence: "Her answer is close to 6,000, so it makes sense.", note: "6,141 ≈ 6,000 → makes sense" },
    { sentence: "Zoe also notices that the 6 in 6,141 is worth 6,000.", note: "6 in 6,141 = 6,000" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The 7 in 7,000 is worth more than the 7 in 700",
      because: "it sits one place to the left, and each place is worth ten times more.",
      but: "both digits look exactly the same.",
      so: "we must look at the place and not only the digit.",
    },
    {
      lesson: "D",
      kernel: "Zoe regrouped 10 ones as 1 ten",
      because: "2 ones plus 9 ones is 11 ones.",
      but: "she did not change the total number of visitors.",
      so: "the ones place shows only 1 one.",
    },
    {
      lesson: "C",
      kernel: "Zoe estimated the sum before she added",
      because: "rounding each number makes the adding quick and easy.",
      but: "an estimate is close to the answer and not exact.",
      so: "she knew right away that 6,141 made sense.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Zoe added the numbers.",
      parts: { when: "after she estimated", how: "by regrouping 10 ones as 1 ten", why: "to find the exact sum" },
      model: "After she estimated, Zoe added the numbers by regrouping 10 ones as 1 ten to find the exact sum.",
    },
    {
      lesson: "C",
      kernel: "Zoe rounded 3,482.",
      parts: { when: "before adding", how: "to the nearest thousand", why: "to make an easy estimate" },
      model: "Before adding, Zoe rounded 3,482 to the nearest thousand to make an easy estimate.",
    },
  ],
  fragments: [
    { text: "The 6 in 6,141 is worth 6,000.", is_sentence: true },
    { text: "Regrouped 10 ones as 1 ten.", is_sentence: false, fix: "Zoe regrouped 10 ones as 1 ten." },
    { text: "Because 2 ones plus 9 ones is 11 ones.", is_sentence: false, fix: "She regrouped because 2 ones plus 9 ones is 11 ones." },
    { text: "The sum is close to the estimate.", is_sentence: true },
    { text: "Rounded to the nearest thousand.", is_sentence: false, fix: "The number 3,482 rounded to the nearest thousand is 3,000." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A digit, ___, has a value that depends on its place.",
      noun: "digit",
      options: ["one of the ten symbols from 0 through 9", "the answer to an addition problem", "a number that is close to the exact answer"],
      answer: 0,
      model: "A digit, one of the ten symbols from 0 through 9, has a value that depends on its place.",
    },
    {
      lesson: "B",
      sentence: "Expanded form, ___, shows what each digit is worth.",
      noun: "Expanded form",
      options: ["the usual way to write a number with digits", "a way to write a number as the sum of each digit's value", "a trade of 10 ones for 1 ten"],
      answer: 1,
      model: "Expanded form, a way to write a number as the sum of each digit's value, shows what each digit is worth.",
    },
    {
      lesson: "C",
      sentence: "An estimate, ___, tells us if an exact sum makes sense.",
      noun: "estimate",
      options: ["the answer to a subtraction problem", "a trade of 10 of one place for 1 of the next", "an answer that is close but not exact"],
      answer: 2,
      model: "An estimate, an answer that is close but not exact, tells us if an exact sum makes sense.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "before", stem: "Zoe rounds each number to the nearest thousand", model: "Before she adds the exact numbers, Zoe rounds each number to the nearest thousand." },
    { lesson: "D", conjunction: "because", stem: "she regroups 10 ones as 1 ten", model: "Because 2 ones plus 9 ones makes 11 ones, she regroups 10 ones as 1 ten." },
    { lesson: "A", conjunction: "since", stem: "the 6 in 6,141 is worth 6,000", model: "Since the 6 is in the thousands place, the 6 in 6,141 is worth 6,000." },
  ],
  spo: {
    topic: {
      l1_2: "Zoe adds [big numbers] and [checks] her answer.",
      l3_4: "Zoe finds the total number of park visitors by [estimating first] and then [adding with regrouping].",
      l5_6: "Because [an estimate] shows what a reasonable answer looks like, Zoe [rounds first], adds the exact numbers, and [checks that her sum makes sense].",
    },
    starters: [
      { type: "question", text: "How can you know if a big sum makes sense before you add?" },
      { type: "appositive", text: "Zoe, a fourth grader at Patterson Park, counted visitors on a weekend." },
      { type: "subordinate", text: "Before she adds the exact numbers, Zoe rounds to make an estimate." },
    ],
    details: [
      { note: "Sat 3,482 + Sun 2,659", lesson: "B" },
      { note: "round each → 3,000 + 3,000 ≈ 6,000", lesson: "C" },
      { note: "2 + 9 = 11 ones → regroup", lesson: "D" },
      { note: "exact sum = 6,141", lesson: "D" },
      { note: "6,141 ≈ 6,000 → makes sense", lesson: "C" },
      { note: "6 in 6,141 = 6,000, ten times 600", lesson: "A" },
    ],
    distractors: ["the park has a famous pagoda", "people bring picnic baskets"],
    conclusion: {
      l1_2: "Zoe's sum is [6,141].",
      l3_4: "Since 6,141 is close to [6,000], Zoe knows her answer [makes sense].",
      l5_6: "Therefore, [estimating and regrouping] helped Zoe find a total she could [trust].",
    },
  },
  prompt: {
    l1_2: "Draw Zoe at the park. Write 2-3 sentences that tell how she adds 3,482 + 2,659. Use the words estimate and sum.",
    l3_4: "Write a paragraph that explains how Zoe finds the total number of visitors and checks her answer. Use your outline, because, and so.",
    l5_6: "Write a paragraph that explains how Zoe adds 3,482 and 2,659, why she regroups, and why her sum makes sense. Include an appositive and a sentence that starts with before or since.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "So", "Since", "Therefore,", "As a result,"],
  model: {
    l1_2: "Zoe estimates first. She adds 3,482 and 2,659. The sum is 6,141.",
    l3_4: "Zoe finds the total number of park visitors by estimating first and then adding with regrouping. First, she rounds 3,482 and 2,659 to 3,000 and 3,000, so her estimate is about 6,000. Next, she adds the exact numbers. Two ones plus nine ones is 11 ones, so she regroups 10 ones as 1 ten. The sum is 6,141. Since 6,141 is close to 6,000, Zoe knows her answer makes sense.",
    l5_6: "Zoe, a fourth grader at Patterson Park, counted 3,482 visitors on Saturday and 2,659 on Sunday. Before she added the exact numbers, she rounded each one to the nearest thousand. Her estimate was about 6,000 because 3,000 plus 3,000 is 6,000. Since 2 ones plus 9 ones makes 11 ones, she regrouped 10 ones as 1 ten. The exact sum was 6,141. Because 6,141 is close to 6,000, her answer makes sense. Therefore, estimating and regrouping helped Zoe find a total she could trust.",
  },
  revise: [
    "Did I name each step in order with first, next, and then?",
    "Did I show the estimate and compare it to the exact sum?",
    "Did I explain why I regrouped, using a fact like 11 ones?",
    "Did I use place value words, such as ones, tens, and thousands, correctly?",
  ],
};
