// BCPSS Writing Lab (TWR) — g3-math-u2 · Multiplication Properties & Fluency. Contract: ../writing-schema.mjs

export default {
  title: "Break It Apart at the Picnic",
  genre: "argue",
  tip: "Ask students to show the math first (40 + 16 = 56), then write why the strategy works as the reason for their claim.",
  lessons: [
    { id: "A", title: "Commutative property: switch the factors" },
    { id: "B", title: "Associative property: regroup the factors" },
    { id: "C", title: "Distributive property: break apart a factor" },
    { id: "D", title: "Strategies for multiplication facts within 100" },
  ],
  source: {
    title: "Two Ways to Find 7 × 8",
    lesson: "C",
    text: "Rosa and Dante set up a picnic pavilion in Patterson Park. There are 7 tables. Each table has 8 chairs. Rosa knows 5 × 8 = 40 and 2 × 8 = 16. She breaks 7 into 5 and 2. She adds 40 + 16 = 56. Dante counts by eights seven times. He gets 56 too. Rosa says her strategy is faster, because she uses two easy facts. Both strategies work, but breaking apart saves time.",
  },
  notes: [
    { sentence: "She breaks 7 into 5 and 2.", note: "break 7 → 5 + 2" },
    { sentence: "Rosa knows 5 × 8 = 40 and 2 × 8 = 16.", note: "5×8=40 + 2×8=16" },
    { sentence: "She adds 40 + 16 = 56.", note: "40 + 16 = 56" },
    { sentence: "Rosa says her strategy is faster, because she uses two easy facts.", note: "faster b/c 2 easy facts" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Rosa broke 7 into 5 and 2",
      because: "5 × 8 and 2 × 8 are easy facts.",
      but: "7 × 8 is a harder fact to remember.",
      so: "she added 40 + 16 to get 56.",
    },
    {
      lesson: "A",
      kernel: "Dante can switch 7 × 8 to 8 × 7",
      because: "changing the order of the factors does not change the product.",
      but: "he still has to know that the answer is 56.",
      so: "both facts have the same answer.",
    },
    {
      lesson: "B",
      kernel: "Parentheses show which part to work out first",
      because: "they group two numbers together.",
      but: "they do not change the product.",
      so: "both (2 × 3) × 4 and 2 × (3 × 4) equal 24.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Rosa broke apart 7.",
      parts: { where: "at the picnic pavilion", how: "into 5 and 2", why: "so she could use easy facts" },
      model: "At the picnic pavilion, Rosa broke apart 7 into 5 and 2 so she could use easy facts.",
    },
    {
      lesson: "D",
      kernel: "Dante counted.",
      parts: { when: "after Rosa finished", how: "by eights seven times", why: "to check her answer" },
      model: "After Rosa finished, Dante counted by eights seven times to check her answer.",
    },
  ],
  fragments: [
    { text: "The product stays the same.", is_sentence: true },
    { text: "Because 5 × 8 is an easy fact.", is_sentence: false, fix: "Rosa used it because 5 × 8 is an easy fact." },
    { text: "Changes the order of the factors.", is_sentence: false, fix: "Switching changes the order of the factors." },
    { text: "Both strategies give 56.", is_sentence: true },
    { text: "After she added 40 and 16.", is_sentence: false, fix: "She got 56 after she added 40 and 16." },
    { text: "The distributive property breaks one factor into parts.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The commutative property, ___, lets Dante switch 7 × 8 to 8 × 7.",
      noun: "commutative property",
      options: ["the rule that lets you break one factor into parts", "the rule that changing the order of factors does not change the product", "a curved mark that shows what to do first"],
      answer: 1,
      model: "The commutative property, the rule that changing the order of factors does not change the product, lets Dante switch 7 × 8 to 8 × 7.",
    },
    {
      lesson: "D",
      sentence: "An equation, ___, shows that 7 × 8 and 56 are the same.",
      noun: "equation",
      options: ["a math sentence with an equal sign", "a rule that is always true", "a plan you use to solve a problem"],
      answer: 0,
      model: "An equation, a math sentence with an equal sign, shows that 7 × 8 and 56 are the same.",
    },
    {
      lesson: "C",
      sentence: "Rosa, ___, broke 7 into 5 and 2.",
      noun: "Rosa",
      options: ["a number you multiply", "the answer to 7 × 8", "a student who helps at the picnic"],
      answer: 2,
      model: "Rosa, a student who helps at the picnic, broke 7 into 5 and 2.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "Rosa's strategy works", model: "Because 5 + 2 = 7, Rosa's strategy works." },
    { lesson: "D", conjunction: "although", stem: "Dante's strategy takes longer", model: "Although counting by eights gives the right answer, Dante's strategy takes longer." },
    { lesson: "A", conjunction: "if", stem: "Dante switches the factors", model: "If 7 × 8 feels hard, Dante switches the factors." },
  ],
  spo: {
    topic: {
      l1_2: "I [break apart] [7] to find [7 × 8].",
      l3_4: "I think [breaking apart a factor] is the best way to find [7 × 8] because [it uses easy facts].",
      l5_6: "Although [counting by eights] works, I believe [breaking apart 7] is the better strategy because [the distributive property turns one hard fact into two easy facts].",
    },
    starters: [
      { type: "question", text: "Why would anyone break apart a number to multiply?" },
      { type: "statement", text: "Breaking apart 7 makes 7 × 8 much easier to solve." },
      { type: "subordinate", text: "Although counting by eights works, it takes a long time." },
    ],
    details: [
      { note: "break 7 → 5 + 2", lesson: "C" },
      { note: "5×8=40 and 2×8=16", lesson: "C" },
      { note: "40 + 16 = 56", lesson: "C" },
      { note: "8 × 7 = 56 too (switch order)", lesson: "A" },
      { note: "(5 × 8) + (2 × 8) with parentheses", lesson: "B" },
      { note: "easy facts = faster", lesson: "D" },
    ],
    distractors: ["Patterson Park has a pagoda", "chairs can be folded flat"],
    conclusion: {
      l1_2: "So 7 × 8 is [56].",
      l3_4: "My strategy works because [5 × 8 and 2 × 8 are easy], so [7 × 8 = 56].",
      l5_6: "My strategy works because [5 + 2 = 7], which means [the two easy facts make the same product as 7 × 8].",
    },
  },
  prompt: {
    l1_2: "Draw 7 tables with 8 chairs. Write 2-3 sentences. Tell how you find 7 × 8.",
    l3_4: "Rosa says breaking apart 7 is a good way to find 7 × 8. Do you agree? Write a paragraph that defends your strategy with math and a reason.",
    l5_6: "Defend the strategy you think is best for finding 7 × 8. Include an appositive, a sentence that starts with although or because, and the math that proves it works.",
  },
  transitions: ["First,", "Then", "Because", "Since", "So", "Which means", "For example,", "In conclusion,"],
  model: {
    l1_2: "I break 7 into 5 and 2. Then 5 × 8 = 40 and 2 × 8 = 16. So 7 × 8 = 56.",
    l3_4: "I think breaking apart a factor is the best way to find 7 × 8 because it uses easy facts. First, I break 7 into 5 and 2. Then 5 × 8 = 40 and 2 × 8 = 16, so I add 40 + 16 = 56. My strategy works because 5 + 2 = 7. So 7 × 8 = 56.",
    l5_6: "Although counting by eights works, I believe breaking apart 7 is the better strategy for 7 × 8. The distributive property, the rule that lets you break one factor into parts, turns one hard fact into two easy facts. Since 5 × 8 = 40 and 2 × 8 = 16, I add 40 + 16 = 56. My strategy works because 5 + 2 = 7, which means the two parts make the same product as 7 × 8. Dante's answer of 56 matches mine, so both strategies are correct, but mine is faster.",
  },
  revise: [
    "Did I say which strategy I choose in my first sentence?",
    "Did I show the math, like 40 + 16 = 56?",
    "Did I explain why the strategy works with because or since?",
    "Did I use a property word, like distributive or commutative, correctly?",
  ],
};
