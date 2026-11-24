// BCPSS Writing Lab (TWR) — g4-math-u3 · Fraction Equivalence & Comparison. Contract: ../writing-schema.mjs

export default {
  title: "Who Planted More?",
  genre: "inform",
  tip: "Have students draw both garden beds and shade each fraction before writing so the comparison is visible.",
  lessons: [
    { id: "A", title: "Equivalent fractions by multiplying" },
    { id: "B", title: "Benchmark fractions: 0, 1/2, and 1" },
    { id: "C", title: "Common denominators for comparing" },
    { id: "D", title: "Comparing with both, whereas, and because" },
  ],
  source: {
    title: "Two Garden Beds",
    lesson: "C",
    text: "Imani and Caleb each have a garden bed of the same size at a community garden in Baltimore. Imani plants 3/4 of her bed with tomatoes. Caleb plants 5/8 of his bed with peppers. Both fractions are greater than 1/2, because each one is more than half of a bed. To compare them, Imani multiplies 3/4 by 2/2 and gets the equivalent fraction 6/8. Now both fractions have a common denominator of 8. Since 6/8 is greater than 5/8, Imani planted more of her bed. Caleb has 3/8 of his bed left, whereas Imani has only 2/8 left.",
  },
  notes: [
    { sentence: "Both fractions are greater than 1/2, because each one is more than half of a bed.", note: "both > 1/2 = more than half" },
    { sentence: "Imani multiplies 3/4 by 2/2 and gets the equivalent fraction 6/8.", note: "3/4 × 2/2 = 6/8" },
    { sentence: "Since 6/8 is greater than 5/8, Imani planted more of her bed.", note: "6/8 > 5/8 → Imani more" },
    { sentence: "Caleb has 3/8 of his bed left, whereas Imani has only 2/8 left.", note: "left: Caleb 3/8, Imani 2/8" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The fractions 3/4 and 6/8 name the same amount",
      because: "6/8 comes from multiplying 3/4 by 2/2.",
      but: "they have different numerators and different denominators.",
      so: "they land on the same spot on a number line.",
    },
    {
      lesson: "B",
      kernel: "Both 3/4 and 5/8 are greater than 1/2",
      because: "each one is more than half of a whole bed.",
      but: "they are not equal to each other.",
      so: "the benchmark 1/2 cannot tell us which one is greater.",
    },
    {
      lesson: "C",
      kernel: "Imani planted more of her bed than Caleb did",
      because: "6/8 is greater than 5/8.",
      but: "her fraction has a smaller denominator than his.",
      so: "she has less of her bed left to plant.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Imani compared the fractions.",
      parts: { when: "after the planting", how: "with a common denominator of 8", why: "to see who planted more" },
      model: "After the planting, Imani compared the fractions with a common denominator of 8 to see who planted more.",
    },
    {
      lesson: "A",
      kernel: "Imani multiplied the fraction.",
      parts: { how: "by 2/2", where: "on her paper", why: "to make eighths" },
      model: "Imani multiplied the fraction by 2/2 on her paper to make eighths.",
    },
  ],
  fragments: [
    { text: "Both fractions are greater than 1/2.", is_sentence: true },
    { text: "Multiplies 3/4 by 2/2.", is_sentence: false, fix: "Imani multiplies 3/4 by 2/2." },
    { text: "Whereas Caleb has 3/8 of his bed left.", is_sentence: false, fix: "Imani has 2/8 of her bed left, whereas Caleb has 3/8 left." },
    { text: "The fractions 3/4 and 6/8 are equivalent.", is_sentence: true },
    { text: "A common denominator of 8.", is_sentence: false, fix: "Both fractions now have a common denominator of 8." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "An equivalent fraction, ___, can look different from the first one.",
      noun: "equivalent fraction",
      options: ["a different way to write a fraction with the same value", "the top number that tells how many parts you have", "a friendly fraction that helps you judge others"],
      answer: 0,
      model: "An equivalent fraction, a different way to write a fraction with the same value, can look different from the first one.",
    },
    {
      lesson: "B",
      sentence: "A benchmark fraction, ___, helps Imani judge 3/4.",
      noun: "benchmark fraction",
      options: ["the bottom number that tells how many equal parts make a whole", "a friendly fraction like 0, 1/2, or 1", "a different way to write a fraction"],
      answer: 1,
      model: "A benchmark fraction, a friendly fraction like 0, 1/2, or 1, helps Imani judge 3/4.",
    },
    {
      lesson: "C",
      sentence: "The denominator, ___, was 4 in Imani's fraction and 8 in Caleb's.",
      noun: "denominator",
      options: ["the top number that tells how many parts you have", "a fraction that has the same value", "the bottom number that tells how many equal parts make one whole"],
      answer: 2,
      model: "The denominator, the bottom number that tells how many equal parts make one whole, was 4 in Imani's fraction and 8 in Caleb's.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "since", stem: "Imani planted more of her bed", model: "Since 6/8 is greater than 5/8, Imani planted more of her bed." },
    { lesson: "D", conjunction: "while", stem: "Caleb has 3/8 of his bed left", model: "While Imani has only 2/8 of her bed left, Caleb has 3/8 of his bed left." },
    { lesson: "B", conjunction: "because", stem: "5/8 is a little more than half of the bed", model: "Because 4/8 equals 1/2, 5/8 is a little more than half of the bed." },
  ],
  spo: {
    topic: {
      l1_2: "Imani and Caleb planted [different] amounts.",
      l3_4: "Both Imani and Caleb planted [more than half] of their beds, whereas Imani planted [more].",
      l5_6: "Although both fractions are [greater than 1/2], Imani's [3/4] is greater than Caleb's [5/8] because [6/8 is greater than 5/8].",
    },
    starters: [
      { type: "question", text: "Who planted more of a garden bed, Imani or Caleb?" },
      { type: "appositive", text: "Imani, a gardener from Baltimore, planted 3/4 of her bed with tomatoes." },
      { type: "subordinate", text: "Although 5/8 is more than half, it is less than 3/4." },
    ],
    details: [
      { note: "Imani 3/4 tomatoes, Caleb 5/8 peppers", lesson: "B" },
      { note: "both > 1/2 (benchmark)", lesson: "B" },
      { note: "3/4 × 2/2 = 6/8", lesson: "A" },
      { note: "common denominator = 8", lesson: "C" },
      { note: "6/8 > 5/8", lesson: "C" },
      { note: "left: Imani 2/8, Caleb 3/8", lesson: "D" },
    ],
    distractors: ["tomatoes need sunshine and water", "the garden has a tall fence"],
    conclusion: {
      l1_2: "[3/4] is [more] than 5/8.",
      l3_4: "Both fractions are [more than half], but [3/4] is greater.",
      l5_6: "In conclusion, [3/4] is greater than [5/8] because [6/8 is greater than 5/8], so Imani planted more.",
    },
  },
  prompt: {
    l1_2: "Draw two garden beds, one with 3/4 planted and one with 5/8 planted. Write 2-3 sentences that tell which is more. Use the words greater and fraction.",
    l3_4: "Write a paragraph that compares 3/4 and 5/8. Use your outline, both, and whereas.",
    l5_6: "Write a paragraph that compares 3/4 and 5/8 using a benchmark and a common denominator. Include an appositive and a sentence that starts with since or although.",
  },
  transitions: ["First,", "Both", "Whereas", "In contrast,", "Because", "Since", "However,", "In conclusion,"],
  model: {
    l1_2: "3/4 is greater than 5/8. 3/4 is the same as 6/8. 6/8 is more than 5/8.",
    l3_4: "Both Imani and Caleb planted more than half of their beds, whereas Imani planted more. Imani planted 3/4 and Caleb planted 5/8. Imani multiplied 3/4 by 2/2 to get 6/8, so both fractions had a common denominator of 8. Since 6/8 is greater than 5/8, 3/4 is greater than 5/8. Both fractions are more than half, but 3/4 is greater.",
    l5_6: "Although both fractions are greater than 1/2, Imani's 3/4 is greater than Caleb's 5/8. A benchmark fraction, a friendly fraction like 1/2, shows that both beds are more than half planted. To compare them, Imani multiplied 3/4 by 2/2 and got the equivalent fraction 6/8. Both fractions then had a common denominator of 8. Since 6/8 is greater than 5/8, Imani planted more of her bed. In contrast, Caleb has 3/8 of his bed left, whereas Imani has only 2/8 left. In conclusion, 3/4 is greater than 5/8 because 6/8 is greater than 5/8.",
  },
  revise: [
    "Did I name both fractions and tell which one is greater?",
    "Did I use both, whereas, or in contrast to compare them?",
    "Did I show the equivalent fraction, like 3/4 = 6/8?",
    "Did I use a benchmark or a common denominator to prove my answer?",
  ],
};
