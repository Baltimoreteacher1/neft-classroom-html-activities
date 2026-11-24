// BCPSS Writing Lab (TWR) — g8-math-u3 · Linear & Nonlinear Functions. Contract: ../writing-schema.mjs

export default {
  title: "Two Lemonade Stands Compared",
  genre: "inform",
  tip: "Give students a two-column chart for same and different first, then turn each row into a both or whereas sentence.",
  lessons: [
    { id: "A", title: "Functions as rules, tables, and graphs" },
    { id: "B", title: "Rate of change and initial value" },
    { id: "C", title: "Linear and nonlinear functions" },
    { id: "D", title: "Comparing two functions" },
  ],
  source: {
    title: "Dev and Rosa Save Up",
    lesson: "A",
    text: "Two friends sell lemonade near Patterson Park. Dev's savings follow the rule y = 4x + 6, where x is the number of hours and y is the money in dollars. Rosa shows her savings in a table. At 0, 1, 2, and 3 hours she has 2, 8, 14, and 20 dollars. Both functions are linear, because each one changes by the same amount every hour. Dev's rate of change is 4, and his initial value is 6. Rosa's rate of change is 6, and her initial value is 2. Dev starts with more money, whereas Rosa saves faster. After 2 hours, both have 14 dollars. A function like y = x² is different. It is nonlinear, because its graph curves instead of making a straight line.",
  },
  notes: [
    { sentence: "Both functions are linear, because each one changes by the same amount every hour.", note: "both linear = same change each hour" },
    { sentence: "Dev's rate of change is 4, and his initial value is 6.", note: "Dev: rate 4, initial 6" },
    { sentence: "Rosa's rate of change is 6, and her initial value is 2.", note: "Rosa: rate 6, initial 2" },
    { sentence: "It is nonlinear, because its graph curves instead of making a straight line.", note: "nonlinear = curved graph" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Dev and Rosa both have linear functions",
      because: "each function changes by the same amount every hour.",
      but: "their rates of change are not the same.",
      so: "we compare their rates and their initial values.",
    },
    {
      lesson: "B",
      kernel: "Dev starts with more money than Rosa",
      because: "his initial value is 6 dollars and hers is 2.",
      but: "his friend Rosa saves 6 dollars an hour and he saves only 4.",
      so: "his friend Rosa catches up after 2 hours.",
    },
    {
      lesson: "C",
      kernel: "The function y = x² is nonlinear",
      because: "its graph curves instead of making a straight line.",
      but: "each input still has exactly one output.",
      so: "it is still a function.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Rosa saves money.",
      parts: { when: "every hour", where: "near Patterson Park", how: "by adding 6 dollars", why: "so she can buy more lemons" },
      model: "Every hour, Rosa saves money near Patterson Park by adding 6 dollars so she can buy more lemons.",
    },
    {
      lesson: "A",
      kernel: "Rosa's table shows 20 dollars.",
      parts: { when: "after 3 hours", where: "in the last row", why: "because the rate of change is 6" },
      model: "In the last row, Rosa's table shows 20 dollars after 3 hours because the rate of change is 6.",
    },
  ],
  fragments: [
    { text: "Both functions have a constant rate of change.", is_sentence: true },
    { text: "Whereas Rosa saves faster.", is_sentence: false, fix: "Dev starts with more money, whereas Rosa saves faster." },
    { text: "The initial value is the output when the input is 0.", is_sentence: true },
    { text: "Because the graph makes a straight line.", is_sentence: false, fix: "The function is linear because the graph makes a straight line." },
    { text: "Is greater than Rosa's initial value.", is_sentence: false, fix: "Dev's initial value is greater than Rosa's initial value." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "The rate of change, ___, tells how fast the output grows.",
      noun: "rate of change",
      options: ["the amount the output changes when the input increases by 1", "the output when the input is 0", "a function whose graph is a straight line"],
      answer: 0,
      model: "The rate of change, the amount the output changes when the input increases by 1, tells how fast the output grows.",
    },
    {
      lesson: "B",
      sentence: "The initial value, ___, is 6 for Dev's function.",
      noun: "initial value",
      options: ["how steep the graph is", "the output when the input is 0", "the number you put into a function"],
      answer: 1,
      model: "The initial value, the output when the input is 0, is 6 for Dev's function.",
    },
    {
      lesson: "C",
      sentence: "A linear function, ___, has a constant rate of change.",
      noun: "linear function",
      options: ["a rule that gives two outputs for one input", "the output when the input is 0", "a function whose graph is a straight line"],
      answer: 2,
      model: "A linear function, a function whose graph is a straight line, has a constant rate of change.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "although", stem: "Rosa saves faster", model: "Although Dev starts with more money, Rosa saves faster." },
    { lesson: "B", conjunction: "because", stem: "her money grows by 6 dollars each hour", model: "Because Rosa's rate of change is 6, her money grows by 6 dollars each hour." },
    { lesson: "A", conjunction: "when", stem: "the output of Dev's rule is 6", model: "When the input is 0, the output of Dev's rule is 6." },
  ],
  spo: {
    topic: {
      l1_2: "Dev's and Rosa's functions are both [linear], but they have different [rates of change].",
      l3_4: "Both Dev's and Rosa's functions are [linear], whereas their [initial values] and [rates of change] are different.",
      l5_6: "Although [both functions are linear], [Dev's function starts higher] while [Rosa's function grows faster], and [the two graphs cross after 2 hours].",
    },
    starters: [
      { type: "question", text: "How can a rule and a table show the same kind of function?" },
      { type: "statement", text: "Dev and Rosa both save money in a straight-line pattern." },
      { type: "subordinate", text: "While Dev starts ahead, Rosa catches up quickly." },
    ],
    details: [
      { note: "Dev: y = 4x + 6", lesson: "A" },
      { note: "Rosa: table 2, 8, 14, 20", lesson: "A" },
      { note: "both rates constant = linear", lesson: "C" },
      { note: "Dev initial 6 > Rosa initial 2", lesson: "B" },
      { note: "Rosa rate 6 > Dev rate 4", lesson: "B" },
      { note: "same at 2 hours: 14 dollars", lesson: "D" },
    ],
    distractors: ["lemons are a sour fruit", "Patterson Park has a pagoda"],
    conclusion: {
      l1_2: "Dev has the greater [initial value]. Rosa has the greater [rate of change].",
      l3_4: "In contrast, [Rosa] saves faster, so after [2 hours] she catches up.",
      l5_6: "The two functions are alike in [being linear], yet they differ in [where they start and how fast they grow].",
    },
  },
  prompt: {
    l1_2: "Look at Dev's rule and Rosa's table. Write 3-4 sentences. Tell what is the same and what is different.",
    l3_4: "Write a paragraph that compares Dev's function and Rosa's function. Use both, whereas, and the words rate of change and initial value.",
    l5_6: "Write a paragraph that compares the two functions and also contrasts them with y = x². Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Both", "Similarly,", "Whereas", "While", "In contrast,", "However,", "Because", "In conclusion,"],
  model: {
    l1_2: "Dev and Rosa both have linear functions. Dev starts with 6 dollars. Rosa starts with 2 dollars. Rosa saves faster.",
    l3_4: "Both Dev's and Rosa's functions are linear because their rates of change stay constant. Dev's rule is y = 4x + 6, so his rate of change is 4 and his initial value is 6. Rosa's table goes up by 6 each hour, so her rate of change is 6 and her initial value is 2. Dev has the greater initial value, whereas Rosa has the greater rate of change. After 2 hours, both have 14 dollars, and then Rosa pulls ahead.",
    l5_6: "Although Dev and Rosa save money in different ways, Dev's rule, y = 4x + 6, and Rosa's table are both linear functions. Each one changes by the same amount every hour, so the rate of change is constant. Dev's initial value is 6 dollars, whereas Rosa's is only 2 dollars. In contrast, Rosa's rate of change is 6 dollars an hour, while Dev saves just 4 dollars an hour. Because 4x + 6 and 6x + 2 are both 14 when x is 2, the two graphs cross after 2 hours. After that, Rosa's greater rate of change puts her ahead. A function such as y = x², a rule whose graph curves, is nonlinear, and its rate of change keeps changing.",
  },
  mpo: {
    thesis: "Dev's and Rosa's functions are alike because both are linear, but they differ in their initial values and their rates of change.",
    paragraphs: [
      { topic: "Both functions are linear because their rates of change are constant.", notes: ["Dev: y = 4x + 6", "Rosa: +6 each hour", "both = straight lines"] },
      { topic: "The functions differ in where they start and how fast they grow.", notes: ["Dev initial 6, Rosa 2", "Dev rate 4, Rosa 6", "cross at 2 h, $14"] },
      { topic: "A nonlinear function looks different from both of them.", notes: ["y = x² curves", "rate keeps changing", "still a function"] },
    ],
    conclusion: "Comparing the initial value and the rate of change shows how two linear functions can start in different places and still meet, and why a curved function is something else entirely.",
  },
  revise: [
    "Did I name both the rate of change and the initial value for each function?",
    "Did I use both, whereas, or in contrast to show same and different?",
    "Did I use real numbers from the rule and the table?",
    "Did I say which function is greater and in what way?",
  ],
};
