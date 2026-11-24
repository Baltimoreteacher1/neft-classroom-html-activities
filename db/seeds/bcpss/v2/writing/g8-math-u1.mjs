// BCPSS Writing Lab (TWR) — g8-math-u1 · Exponents, Scientific Notation & Irrational Numbers. Contract: ../writing-schema.mjs

export default {
  title: "Sorting Numbers on a Poster",
  genre: "inform",
  tip: "Have students test each number with the same two questions, does the decimal stop or repeat, before they write its type.",
  lessons: [
    { id: "A", title: "Integer exponent rules" },
    { id: "B", title: "Scientific notation for huge and tiny numbers" },
    { id: "C", title: "Square roots and perfect squares" },
    { id: "D", title: "Rational and irrational numbers on the number line" },
  ],
  source: {
    title: "Zoe's Number Poster",
    lesson: "D",
    text: "Zoe is making a poster that sorts numbers. A rational number can be written as a fraction of two integers. Its decimal stops or repeats, so 0.75 and 0.333… are both rational. An irrational number is different, because its decimal never stops and never repeats. The square root of 2 is irrational, and so is pi. The square root of 49 is not irrational. It equals 7, which is 7/1. Zoe also writes big numbers in scientific notation. The distance from Earth to the Sun is about 93,000,000 miles, or 9.3 × 10⁷ miles.",
  },
  notes: [
    { sentence: "A rational number can be written as a fraction of two integers.", note: "rational = fraction of 2 integers" },
    { sentence: "An irrational number is different, because its decimal never stops and never repeats.", note: "irrational = decimal never ends, no repeat" },
    { sentence: "The square root of 49 is not irrational.", note: "√49 = 7 → rational" },
    { sentence: "The distance from Earth to the Sun is about 93,000,000 miles, or 9.3 × 10⁷ miles.", note: "93,000,000 mi = 9.3 × 10⁷" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "The square root of 2 is an irrational number",
      because: "its decimal never ends and never repeats.",
      but: "it still sits at an exact spot on the number line.",
      so: "we can only estimate it as about 1.41.",
    },
    {
      lesson: "B",
      kernel: "Scientific notation is useful for very large numbers",
      because: "it replaces long strings of zeros with a power of 10.",
      but: "the first number must stay between 1 and 10.",
      so: "93,000,000 miles can be written as 9.3 × 10⁷ miles.",
    },
    {
      lesson: "C",
      kernel: "The square root of 36 is a rational number",
      because: "it equals 6, which can be written as 6/1.",
      but: "many other square roots, like the square root of 40, are not rational.",
      so: "we can place it exactly on the number line.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Zoe sorted the numbers.",
      parts: { when: "after school", how: "into rational and irrational groups", where: "on her poster", why: "so her classmates could compare them" },
      model: "After school, Zoe sorted the numbers into rational and irrational groups on her poster so her classmates could compare them.",
    },
    {
      lesson: "B",
      kernel: "Maya wrote the distance.",
      parts: { when: "for her report", how: "in scientific notation", why: "to avoid writing so many zeros" },
      model: "For her report, Maya wrote the distance in scientific notation to avoid writing so many zeros.",
    },
  ],
  fragments: [
    { text: "An irrational number has a decimal that never ends.", is_sentence: true },
    { text: "Whose decimal repeats forever.", is_sentence: false, fix: "0.333… is a rational number whose decimal repeats forever." },
    { text: "The exponent tells how many times to multiply the base.", is_sentence: true },
    { text: "Because 25 is a perfect square.", is_sentence: false, fix: "The square root of 25 is rational because 25 is a perfect square." },
    { text: "Moved the decimal point seven places.", is_sentence: false, fix: "Maya moved the decimal point seven places." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Scientific notation, ___, helps scientists write huge numbers.",
      noun: "Scientific notation",
      options: ["a short way to write very large or very small numbers", "a number that cannot be written as a fraction", "a number you get by multiplying a whole number by itself"],
      answer: 0,
      model: "Scientific notation, a short way to write very large or very small numbers, helps scientists write huge numbers.",
    },
    {
      lesson: "C",
      sentence: "A perfect square, ___, has a whole-number square root.",
      noun: "perfect square",
      options: ["a decimal that never ends", "a number you get by multiplying a whole number by itself", "the small number raised above the base"],
      answer: 1,
      model: "A perfect square, a number you get by multiplying a whole number by itself, has a whole-number square root.",
    },
    {
      lesson: "D",
      sentence: "An irrational number, ___, cannot be written as a fraction.",
      noun: "irrational number",
      options: ["a decimal that stops after a few digits", "a number written as a fraction of two integers", "a number whose decimal never ends and never repeats"],
      answer: 2,
      model: "An irrational number, a number whose decimal never ends and never repeats, cannot be written as a fraction.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "since", stem: "its square root is irrational", model: "Since 40 is not a perfect square, its square root is irrational." },
    { lesson: "A", conjunction: "if", stem: "you multiply 10 by itself three times", model: "If the exponent is 3, you multiply 10 by itself three times." },
    { lesson: "D", conjunction: "although", stem: "pi still has an exact place on the number line", model: "Although the decimal for pi goes on forever, pi still has an exact place on the number line." },
  ],
  spo: {
    topic: {
      l1_2: "A number can be [rational] or [irrational].",
      l3_4: "A rational number is a type of number that [can be written as a fraction], whereas an irrational number is [a number whose decimal never ends or repeats].",
      l5_6: "Although [rational and irrational numbers] both appear on the number line, they differ in [how their decimals behave].",
    },
    starters: [
      { type: "question", text: "How can you tell if a number is rational or irrational?" },
      { type: "appositive", text: "The square root of 2, an irrational number, has a decimal that never ends." },
      { type: "subordinate", text: "Even though pi never ends, it has an exact spot on the number line." },
    ],
    details: [
      { note: "rational = fraction of 2 integers", lesson: "D" },
      { note: "decimal stops or repeats (0.75, 0.333…)", lesson: "D" },
      { note: "irrational = never ends, never repeats", lesson: "D" },
      { note: "√2, π = irrational", lesson: "C" },
      { note: "perfect square: √49 = 7 = rational", lesson: "C" },
      { note: "exponent = times to multiply base", lesson: "A" },
    ],
    distractors: ["Pi Day is celebrated on March 14", "a calculator screen shows about ten digits"],
    conclusion: {
      l1_2: "Now I know the [type] of each [number].",
      l3_4: "Because I can test each decimal, I can [sort] the numbers into [two groups].",
      l5_6: "Knowing the difference lets us [place each number exactly or estimate it] on [the number line].",
    },
  },
  prompt: {
    l1_2: "Look at the numbers √49 and √30. Write 3-4 sentences. Tell which number is rational and which is irrational.",
    l3_4: "Write a paragraph that classifies √49 and √30. Define rational and irrational numbers, and tell which type fits each number. Use your outline and the word because.",
    l5_6: "Write a paragraph that classifies √49 and √30, defines each type, and tells which two whole numbers √30 lies between. Include an appositive and a sentence that starts with since or although.",
  },
  transitions: ["First,", "Next,", "For example,", "In contrast,", "However,", "Because", "Since", "In conclusion,"],
  model: {
    l1_2: "The square root of 49 is 7. Seven is a rational number. The square root of 30 is irrational. Its decimal never ends.",
    l3_4: "I classify √49 as a rational number and √30 as an irrational number. A rational number is a type of number that can be written as a fraction. Since √49 equals 7, it is rational because 7 can be written as 7/1. An irrational number has a decimal that never ends and never repeats. Because 30 is not a perfect square, √30 is irrational. It lies between 5 and 6 because 25 is less than 30 and 36 is greater than 30.",
    l5_6: "Although √49 and √30 both look like square roots, they belong to different groups. √49, the square root of a perfect square, equals 7, so it is a rational number that can be written as 7/1. Rational numbers have decimals that stop or repeat, such as 0.75 or 0.333…. Since 30 is not a perfect square, √30 is an irrational number, a number whose decimal never ends and never repeats. Because 5² is 25 and 6² is 36, √30 lies between 5 and 6, close to 5.5. Knowing the difference lets us place each number exactly or estimate it on the number line.",
  },
  mpo: {
    thesis: "Rational and irrational numbers differ in how their decimals behave, and exponents and square roots help us place both kinds of numbers on the number line.",
    paragraphs: [
      { topic: "A rational number can be written as a fraction, and its decimal stops or repeats.", notes: ["fraction of 2 integers", "0.75 stops, 0.333… repeats", "perfect squares: √49 = 7"] },
      { topic: "An irrational number has a decimal that never ends and never repeats.", notes: ["√2, √30, π", "can only estimate", "√30 between 5 and 6"] },
      { topic: "Exponents and scientific notation describe huge and tiny numbers.", notes: ["exponent = times to multiply", "93,000,000 = 9.3 × 10⁷", "decimal point moves 7 places"] },
    ],
    conclusion: "Testing a number's decimal tells us whether it is rational or irrational, and exponent tools let us write and place even huge and tiny numbers with confidence.",
  },
  revise: [
    "Did I define each type with a type of ... that ... or is not ... because?",
    "Did I test each number first, for example √49 = 7, before I named its type?",
    "Did I use whereas, while, or in contrast to show the difference?",
    "Did I write square roots and exponents correctly and with the right numbers?",
  ],
};
