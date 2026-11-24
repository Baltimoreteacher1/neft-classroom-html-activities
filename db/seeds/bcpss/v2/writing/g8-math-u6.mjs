// BCPSS Writing Lab (TWR) — g8-math-u6 · Bivariate Data, Scatter Plots & Two-Way Tables. Contract: ../writing-schema.mjs

export default {
  title: "What the Dots Say",
  genre: "argue",
  tip: "Have students point to the exact dots or table cell that supports each claim before they write the according to sentence.",
  lessons: [
    { id: "A", title: "Scatter plots and association" },
    { id: "B", title: "Outliers and clusters" },
    { id: "C", title: "Lines of best fit" },
    { id: "D", title: "Two-way tables and relative frequency" },
  ],
  source: {
    title: "Ms. Okafor's Study Survey",
    lesson: "A",
    text: "Ms. Okafor's class collects data on 20 students. Each point on the scatter plot shows hours studied and quiz score. According to the plot, the points rise from left to right, so there is a positive association. Most points stay close to the line of best fit, which means the trend is linear. One student studied 0 hours and scored 95, so that point is far from the rest, and it is an outlier. The class also builds a two-way table. Of the 20 students, 12 studied at least one hour, and 10 of those 12 passed. The relative frequency of passing among students who studied is 10 out of 12, or about 83 percent.",
  },
  notes: [
    { sentence: "According to the plot, the points rise from left to right, so there is a positive association.", note: "points rise L → R = positive association" },
    { sentence: "One student studied 0 hours and scored 95, so that point is far from the rest, and it is an outlier.", note: "0 hrs, score 95 = outlier" },
    { sentence: "Of the 20 students, 12 studied at least one hour, and 10 of those 12 passed.", note: "12 studied, 10 passed" },
    { sentence: "The relative frequency of passing among students who studied is 10 out of 12, or about 83 percent.", note: "10/12 ≈ 83%" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The scatter plot shows a positive association",
      because: "the points rise from left to right.",
      but: "the points do not fall exactly on one line.",
      so: "we can draw a line of best fit to show the trend.",
    },
    {
      lesson: "B",
      kernel: "One student studied 0 hours and scored 95",
      because: "that student had already learned the topic before.",
      but: "the rest of the data show that more study goes with higher scores.",
      so: "that point is an outlier.",
    },
    {
      lesson: "D",
      kernel: "Ms. Okafor builds a two-way table",
      because: "it shows counts for two categories at the same time.",
      but: "counts alone cannot compare groups of different sizes.",
      so: "she finds relative frequencies.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Ms. Okafor drew a line.",
      parts: { when: "after plotting all 20 points", how: "close to most of the points", why: "to show the trend" },
      model: "After plotting all 20 points, Ms. Okafor drew a line close to most of the points to show the trend.",
    },
    {
      lesson: "D",
      kernel: "The class counted students.",
      parts: { where: "in the two-way table", what: "who studied and passed", why: "so they could find relative frequencies" },
      model: "In the two-way table, the class counted students who studied and passed so they could find relative frequencies.",
    },
  ],
  fragments: [
    { text: "The points rise from left to right.", is_sentence: true },
    { text: "Because the point is far from the rest.", is_sentence: false, fix: "The point is an outlier because it is far from the rest." },
    { text: "A line of best fit shows the trend.", is_sentence: true },
    { text: "Which means studying and scores go up together.", is_sentence: false, fix: "The plot shows a positive association, which means studying and scores go up together." },
    { text: "Counts for two categories at the same time.", is_sentence: false, fix: "A two-way table shows counts for two categories at the same time." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "An outlier, ___, can change how a trend looks.",
      noun: "outlier",
      options: ["a point that is far away from the rest of the data", "a group of points close together", "a line drawn near the points"],
      answer: 0,
      model: "An outlier, a point that is far away from the rest of the data, can change how a trend looks.",
    },
    {
      lesson: "C",
      sentence: "The line of best fit, ___, helps predict a score.",
      noun: "line of best fit",
      options: ["a table that shows counts for two categories", "a straight line drawn close to the points to show the trend", "a pattern where one value goes down as the other goes up"],
      answer: 1,
      model: "The line of best fit, a straight line drawn close to the points to show the trend, helps predict a score.",
    },
    {
      lesson: "D",
      sentence: "Relative frequency, ___, is 10 out of 12 for the students who studied.",
      noun: "Relative frequency",
      options: ["the number of points in a cluster", "a point far from the data", "the part of a group that fits one category"],
      answer: 2,
      model: "Relative frequency, the part of a group that fits one category, is 10 out of 12 for the students who studied.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the association is positive", model: "Because the points rise from left to right, the association is positive." },
    { lesson: "B", conjunction: "although", stem: "the trend is still clear", model: "Although one point is an outlier, the trend is still clear." },
    { lesson: "D", conjunction: "while", stem: "the two-way table compares two categories", model: "While the scatter plot compares two measurements, the two-way table compares two categories." },
  ],
  spo: {
    topic: {
      l1_2: "The scatter plot shows a [positive] association.",
      l3_4: "According to the scatter plot, there is a [positive] association between [hours studied] and [quiz score] because [the points rise].",
      l5_6: "Although [one outlier] stands apart, the scatter plot and the two-way table show that [studying more goes with higher scores], as shown by [the rising points and the relative frequency of 83 percent].",
    },
    starters: [
      { type: "question", text: "Does more studying really go with higher quiz scores?" },
      { type: "appositive", text: "Ms. Okafor's scatter plot, a graph of 20 students, shows a clear trend." },
      { type: "subordinate", text: "Even though one point is far away, the pattern is clear." },
    ],
    details: [
      { note: "points rise L → R = positive association", lesson: "A" },
      { note: "most points near line of best fit", lesson: "C" },
      { note: "outlier: 0 hrs, score 95", lesson: "B" },
      { note: "12 studied, 10 passed", lesson: "D" },
      { note: "10/12 ≈ 83% passed", lesson: "D" },
      { note: "more study = higher score", lesson: "A" },
    ],
    distractors: ["Ms. Okafor teaches math in the morning", "the quiz had ten questions"],
    conclusion: {
      l1_2: "More [study] goes with [higher] scores.",
      l3_4: "This evidence shows that [studying] and [scores] go up together, so my claim is [supported].",
      l5_6: "Because [both the graph and the table] point the same way, my claim that [studying goes with higher scores] is well supported.",
    },
  },
  prompt: {
    l1_2: "Look at the scatter plot. Write 3-4 sentences. Tell what the points do and what that means.",
    l3_4: "Write a claim about studying and quiz scores. Support it with evidence from the scatter plot and the two-way table. Use according to and because.",
    l5_6: "Write a paragraph that claims studying goes with higher scores and supports the claim with the scatter plot, the outlier, and the relative frequency. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["According to", "As shown by", "Because", "For example,", "Although", "However,", "This shows that", "Therefore,"],
  model: {
    l1_2: "The points go up from left to right. So there is a positive association. More study goes with higher scores. One point is an outlier.",
    l3_4: "According to the scatter plot, there is a positive association between hours studied and quiz score. The points rise from left to right, so students who study more tend to score higher. Most points stay close to the line of best fit. One student studied 0 hours and scored 95, so that point is an outlier. In the two-way table, 10 out of the 12 students who studied passed, which is about 83 percent. This evidence supports my claim.",
    l5_6: "According to the scatter plot, studying more goes with higher quiz scores, so the association is positive. The points rise from left to right and stay close to the line of best fit, a straight line that shows the trend. Although one student studied 0 hours and scored 95, that outlier does not change the overall pattern. The two-way table adds more evidence. Of the 12 students who studied, 10 passed, so the relative frequency of passing is 10 out of 12, or about 83 percent. Because both the graph and the table point the same way, my claim is well supported.",
  },
  mpo: {
    thesis: "The scatter plot and the two-way table both support the claim that students who study more tend to score higher on the quiz.",
    paragraphs: [
      { topic: "The scatter plot shows a positive association between hours studied and quiz score.", notes: ["points rise L → R", "positive association", "close to line of best fit"] },
      { topic: "One outlier does not change the overall trend.", notes: ["0 hrs, score 95", "far from the rest", "trend still clear"] },
      { topic: "The two-way table gives numbers that agree with the graph.", notes: ["12 studied, 10 passed", "10/12 ≈ 83%", "relative frequency"] },
    ],
    conclusion: "Because two kinds of evidence point the same way, the claim that studying goes with higher scores is strong, even though association does not prove that studying is the only cause.",
  },
  revise: [
    "Did I state a claim about the association before I gave evidence?",
    "Did I cite the scatter plot or the table with according to or as shown by?",
    "Did I use real numbers, such as 10 out of 12 or 83 percent?",
    "Did I explain what the outlier is and why it does not change my claim?",
  ],
};
