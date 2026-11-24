// BCPSS Writing Lab (TWR) — g6-math-u6 · Statistical Measures & Data Distributions. Contract: ../writing-schema.mjs

export default {
  title: "Which Center Tells the Truth?",
  genre: "argue",
  tip: "Have students point to the dot-plot value that pulls the mean before they write their claim.",
  lessons: [
    { id: "A", title: "Statistical questions and dot plots" },
    { id: "B", title: "Mean and median as measures of center" },
    { id: "C", title: "Outliers and choosing the best center" },
    { id: "D", title: "Variability, interquartile range and box plots" },
  ],
  source: {
    title: "Counting Crabs in the Bay",
    lesson: "C",
    text: "Tomas counts the blue crabs in his trap for seven days. His data are 4, 5, 5, 6, 6, 7, and 19. He draws a dot plot to see the distribution. Most dots sit between 4 and 7, but one dot at 19 is far away. That value is an outlier. The median is 6 because it is the middle value. The mean is about 7.4 because the total, 52, divided by 7 is about 7.4. The outlier pulls the mean up. Tomas claims that the median is the better center, because it is close to most of the days. Do you agree?",
  },
  notes: [
    { sentence: "Most dots sit between 4 and 7, but one dot at 19 is far away.", note: "most dots 4–7, 19 far away" },
    { sentence: "The median is 6 because it is the middle value.", note: "median = 6 = middle" },
    { sentence: "The mean is about 7.4 because the total, 52, divided by 7 is about 7.4.", note: "52 ÷ 7 ≈ 7.4 = mean" },
    { sentence: "Tomas claims that the median is the better center, because it is close to most of the days.", note: "median = better, close to most days" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "The median is a better center for Tomas's crab data",
      because: "the outlier of 19 pulls the mean up to about 7.4.",
      but: "the mean is the only center that uses every value.",
      so: "he claims the median is closer to a typical day.",
    },
    {
      lesson: "B",
      kernel: "The median of 4, 5, 5, 6, 6, 7, 19 is 6",
      because: "6 is the middle value when the numbers are in order.",
      but: "the mean of the same data is about 7.4.",
      so: "we must decide which center fits the data best.",
    },
    {
      lesson: "D",
      kernel: "The crab counts in Tomas's trap are spread out",
      because: "the outlier of 19 is far from the other values.",
      but: "most of the days have between 4 and 7 crabs.",
      so: "the range, 19 − 4 = 15, is large.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Tomas drew a dot plot.",
      parts: { when: "After counting for seven days", where: "on graph paper", why: "to see the distribution of crabs" },
      model: "After counting for seven days, Tomas drew a dot plot on graph paper to see the distribution of crabs.",
    },
    {
      lesson: "C",
      kernel: "The outlier pulled the mean.",
      parts: { when: "On the seventh day", how: "up to about 7.4", why: "because 19 is far from the other values" },
      model: "On the seventh day, the outlier pulled the mean up to about 7.4 because 19 is far from the other values.",
    },
  ],
  fragments: [
    { text: "The median is the middle value.", is_sentence: true },
    { text: "Because the outlier pulls the mean up.", is_sentence: false, fix: "The median is a better center because the outlier pulls the mean up." },
    { text: "A dot plot shows each value as a dot.", is_sentence: true },
    { text: "The data with one very large value.", is_sentence: false, fix: "The data with one very large value have an outlier." },
    { text: "Divided the total by 7.", is_sentence: false, fix: "Tomas divided the total, 52, by 7." },
    { text: "According to the dot plot, most days have between 4 and 7 crabs.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A dot plot, ___, shows the distribution of Tomas's crab counts.",
      noun: "dot plot",
      options: ["a graph with one dot for each data value", "a graph with bars that touch", "the middle value of the data"],
      answer: 0,
      model: "A dot plot, a graph with one dot for each data value, shows the distribution of Tomas's crab counts.",
    },
    {
      lesson: "C",
      sentence: "The outlier, ___, pulls the mean toward itself.",
      noun: "outlier",
      options: ["a value far away from the rest of the data", "the sum divided by the number of values", "the middle value in order"],
      answer: 0,
      model: "The outlier, a value far away from the rest of the data, pulls the mean toward itself.",
    },
    {
      lesson: "B",
      sentence: "The median, ___, is 6 for Tomas's data.",
      noun: "median",
      options: ["the middle value when data are listed in order", "the total divided by the number of values", "a value far from the rest"],
      answer: 0,
      model: "The median, the middle value when data are listed in order, is 6 for Tomas's data.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "although", stem: "the median is closer to a typical day", model: "Although the mean uses every value, the median is closer to a typical day." },
    { lesson: "C", conjunction: "because", stem: "the mean is pulled up", model: "Because 19 is far from the other values, the mean is pulled up." },
    { lesson: "A", conjunction: "before", stem: "he draws a dot plot of the data", model: "Before Tomas finds a center, he draws a dot plot of the data." },
  ],
  spo: {
    topic: {
      l1_2: "The [median] is the better center for the crab data.",
      l3_4: "I claim the [median] is the better center for Tomas's data because [the outlier pulls the mean up].",
      l5_6: "Although the mean uses every value, [the median] is the better center because [the outlier of 19 pulls the mean away from a typical day], as shown by [the dot plot].",
    },
    starters: [
      { type: "question", text: "Which center better describes a typical day of crab catching, the mean or the median?" },
      { type: "appositive", text: "Tomas, a boy who counts crabs in a trap on the Chesapeake Bay, finds two different centers." },
      { type: "subordinate", text: "Even though the mean is higher, it does not describe most days." },
    ],
    details: [
      { note: "data 4, 5, 5, 6, 6, 7, 19", lesson: "A" },
      { note: "19 = outlier, far from rest", lesson: "C" },
      { note: "median = 6, middle value", lesson: "B" },
      { note: "mean ≈ 7.4, total 52 ÷ 7", lesson: "B" },
      { note: "outlier pulls mean up", lesson: "C" },
      { note: "6 is close to most days", lesson: "C" },
    ],
    distractors: ["crab cakes are a Maryland favorite", "blue crabs have bright blue claws"],
    conclusion: {
      l1_2: "The [median] fits [most] days.",
      l3_4: "Therefore, the [median] describes a typical day better because [the outlier does not change it].",
      l5_6: "According to the data, [six of seven days had 7 crabs or fewer], so the median describes the center more [truthfully] than the mean.",
    },
  },
  prompt: {
    l1_2: "Draw a dot plot of the crab counts. Write 3-4 sentences about which center is better. Use the words median, mean, and outlier.",
    l3_4: "Write a paragraph that claims which center is better for Tomas's crab data. Use your outline, because, and evidence from the data.",
    l5_6: "Write a paragraph that argues the median is the better center for Tomas's data and proves it with the dot plot. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "I claim", "According to the data,", "As shown by", "Because", "For example,", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "Tomas counted crabs for seven days. The median is 6 and the mean is about 7.4. The median is closer to most days. It is the better center.",
    l3_4: "I claim the median is the better center for Tomas's crab data. Tomas counted 4, 5, 5, 6, 6, 7, and 19 crabs. The median is 6 because it is the middle value. The mean is about 7.4 because the outlier, 19, pulls it up. According to the dot plot, most days have 4 to 7 crabs. Therefore, the median describes a typical day better than the mean.",
    l5_6: "Although the mean uses every value, the median is the better center for Tomas's crab data. Tomas counted 4, 5, 5, 6, 6, 7, and 19 crabs in his trap. The dot plot, a graph with one dot for each value, shows most days between 4 and 7. The outlier, 19, sits far from the rest of the data. Because the total is 52 and 52 ÷ 7 is about 7.4, the mean is pulled above almost every day. The median, 6, is the middle value, so it stays close to a typical day. According to the data, six of the seven days had 7 crabs or fewer, which shows that 7.4 is not typical. Therefore, the median describes the center more truthfully.",
  },
  mpo: {
    thesis: "The median is the better center for Tomas's crab data, because an outlier distorts the mean, as shown by the dot plot.",
    paragraphs: [
      { topic: "Tomas's dot plot shows the distribution of his crab counts.", notes: ["data 4, 5, 5, 6, 6, 7, 19", "most dots 4–7", "19 = outlier"] },
      { topic: "The median and the mean tell different stories.", notes: ["median = 6, middle", "mean ≈ 7.4 (52 ÷ 7)", "outlier pulls mean up"] },
      { topic: "Variability shows which center fits a typical day.", notes: ["range = 19 − 4 = 15", "6 of 7 days ≤ 7 crabs", "median fits typical day"] },
    ],
    conclusion: "Because the outlier pulls the mean away from most days, the median is the center that tells the truth about Tomas's crab catches.",
  },
  revise: [
    "Did I state a clear claim about which center is better before giving proof?",
    "Did I use at least two real numbers from the data as evidence?",
    "Did I explain how the outlier changes the mean but not the median?",
    "Did I use a phrase like according to the data or as shown by the dot plot?",
  ],
};
