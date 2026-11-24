// BCPSS Writing Lab (TWR) — g6-math-u4 · Integers, Rational Numbers & The Coordinate Plane. Contract: ../writing-schema.mjs

export default {
  title: "Compare Cold Days and Points",
  genre: "inform",
  tip: "Ask students to name one likeness and one difference aloud before writing, then point to the comparing word that joins them.",
  lessons: [
    { id: "A", title: "Negative numbers and opposites on the number line" },
    { id: "B", title: "Absolute value and comparing rational numbers" },
    { id: "C", title: "Temperature and elevation with negative numbers" },
    { id: "D", title: "The coordinate plane and the four quadrants" },
  ],
  source: {
    title: "Two Cold Mornings",
    lesson: "C",
    text: "Kofi and Lena track the morning temperature for a science fair. On Monday the temperature is −4 degrees. On Tuesday it is −9 degrees. Both numbers are negative, so both days are below zero. However, −9 lies farther left on the number line, so Tuesday is colder. The absolute value of −4 is 4, whereas the absolute value of −9 is 9. Absolute value tells the distance from zero. Then the students plot the points (−4, 3) and (4, 3) on a coordinate plane. Both points are 3 units above the x-axis. In contrast, (−4, 3) is in Quadrant II, and (4, 3) is in Quadrant I.",
  },
  notes: [
    { sentence: "However, −9 lies farther left on the number line, so Tuesday is colder.", note: "−9 farther left → colder" },
    { sentence: "The absolute value of −4 is 4, whereas the absolute value of −9 is 9.", note: "|−4| = 4, |−9| = 9" },
    { sentence: "Both points are 3 units above the x-axis.", note: "both 3 above x-axis" },
    { sentence: "In contrast, (−4, 3) is in Quadrant II, and (4, 3) is in Quadrant I.", note: "(−4, 3) = QII, (4, 3) = QI" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The number −9 is less than −4",
      because: "it lies farther left on the number line.",
      but: "its absolute value, 9, is greater than 4.",
      so: "the temperature on Tuesday is colder than on Monday.",
    },
    {
      lesson: "A",
      kernel: "The numbers 6 and −6 are opposites",
      because: "they are the same distance from zero on opposite sides.",
      but: "6 is greater than −6.",
      so: "their absolute values are both 6.",
    },
    {
      lesson: "D",
      kernel: "The points (−4, 3) and (4, 3) are in different quadrants",
      because: "their x-coordinates have opposite signs.",
      but: "both points are 3 units above the x-axis.",
      so: "the points are mirror images across the y-axis.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Lena plotted the point.",
      parts: { when: "After drawing the axes", how: "four units left and three units up", where: "in Quadrant II" },
      model: "After drawing the axes, Lena plotted the point four units left and three units up in Quadrant II.",
    },
    {
      lesson: "C",
      kernel: "Kofi recorded the temperature.",
      parts: { when: "On Tuesday morning", what: "of −9 degrees", why: "for the science fair data table" },
      model: "On Tuesday morning, Kofi recorded the temperature of −9 degrees for the science fair data table.",
    },
  ],
  fragments: [
    { text: "Absolute value is the distance from zero.", is_sentence: true },
    { text: "Lies farther left on the number line.", is_sentence: false, fix: "The number −9 lies farther left on the number line." },
    { text: "The origin is the point (0, 0).", is_sentence: true },
    { text: "Whereas −4 is closer to zero.", is_sentence: false, fix: "The number −9 is far from zero, whereas −4 is closer to zero." },
    { text: "Because the x-coordinate is negative.", is_sentence: false, fix: "The point is left of the y-axis because the x-coordinate is negative." },
    { text: "Both −4 and −9 are below zero.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Absolute value, ___, does not depend on direction.",
      noun: "Absolute value",
      options: ["the distance from zero on a number line", "the point where the axes cross", "a number's opposite"],
      answer: 0,
      model: "Absolute value, the distance from zero on a number line, does not depend on direction.",
    },
    {
      lesson: "D",
      sentence: "The origin, ___, is where the x-axis and y-axis cross.",
      noun: "origin",
      options: ["the point named (0, 0)", "a number that is less than zero", "one of the four regions of the plane"],
      answer: 0,
      model: "The origin, the point named (0, 0), is where the x-axis and y-axis cross.",
    },
    {
      lesson: "D",
      sentence: "Quadrant II, ___, contains the point (−4, 3).",
      noun: "Quadrant II",
      options: ["the region above and left of the origin", "the region below and right of the origin", "the region above and right of the origin"],
      answer: 0,
      model: "Quadrant II, the region above and left of the origin, contains the point (−4, 3).",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "the temperature drops 5 degrees", model: "When the temperature falls from −4 to −9 degrees, the temperature drops 5 degrees." },
    { lesson: "B", conjunction: "although", stem: "−9 has the greater absolute value", model: "Although −9 is less than −4, −9 has the greater absolute value." },
    { lesson: "D", conjunction: "while", stem: "the point (4, 3) is in Quadrant I", model: "While the point (−4, 3) is in Quadrant II, the point (4, 3) is in Quadrant I." },
  ],
  spo: {
    topic: {
      l1_2: "The numbers −4 and −9 are [alike] and [different].",
      l3_4: "Both −4 and −9 are [negative numbers], whereas [−9 is farther from zero and colder].",
      l5_6: "Although −4 and −9 are both below zero, [−9 is colder] because [it lies farther left, and its absolute value is greater].",
    },
    starters: [
      { type: "question", text: "Which is colder, −4 degrees or −9 degrees, and how do you know?" },
      { type: "appositive", text: "Kofi and Lena, two students at a science fair, compare −4 and −9 on a number line." },
      { type: "subordinate", text: "Even though −9 looks smaller than −4, its distance from zero is greater." },
    ],
    details: [
      { note: "both −4 and −9 below zero", lesson: "A" },
      { note: "−9 farther left on number line", lesson: "B" },
      { note: "−9 < −4 → Tuesday colder", lesson: "C" },
      { note: "|−4| = 4, |−9| = 9", lesson: "B" },
      { note: "absolute value = distance from zero", lesson: "B" },
      { note: "−9 is 5 degrees below −4", lesson: "C" },
    ],
    distractors: ["the science fair is on Friday", "Kofi uses a digital thermometer"],
    conclusion: {
      l1_2: "The number [−9] is [colder].",
      l3_4: "So the two numbers are alike because both are [negative], but they are different because [−9 is farther from zero].",
      l5_6: "Comparing the two numbers shows that [distance from zero] and [being greater] are [different ideas].",
    },
  },
  prompt: {
    l1_2: "Draw a number line with −4 and −9. Write 3-4 sentences that tell how the numbers are alike and different. Use the words both, but, and colder.",
    l3_4: "Write a paragraph that compares −4 and −9. Tell what is the same and what is different. Use your outline, both and whereas.",
    l5_6: "Write a paragraph that compares −4 and −9 using the number line and absolute value. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Similarly,", "In the same way,", "However,", "In contrast,", "Whereas", "On the other hand,", "In conclusion,"],
  model: {
    l1_2: "Both −4 and −9 are below zero. The number −9 is farther left. It is colder than −4.",
    l3_4: "Both −4 and −9 are negative numbers, whereas −9 is farther from zero. On the number line, −9 lies to the left of −4, so −9 is less than −4. Tuesday was colder than Monday because −9 degrees is less than −4 degrees. The absolute value of −4 is 4, and the absolute value of −9 is 9. Absolute value tells the distance from zero, not which number is warmer. That is why −9 has the greater absolute value but the lower temperature.",
    l5_6: "Although −4 and −9 are both below zero, Tuesday's temperature, −9 degrees, is colder than Monday's. Both numbers are negative, so both lie to the left of zero on the number line. However, −9 lies farther left than −4, which means −9 is less than −4. In contrast, the absolute value of −9 is greater than the absolute value of −4. Absolute value measures distance from zero, whereas order on the number line shows which number is less. Because Tuesday's number is 5 units below Monday's, the temperature dropped 5 degrees. Comparing the two numbers shows that distance and order are different ideas.",
  },
  mpo: {
    thesis: "Negative numbers like −4 and −9 are alike in some ways and different in others, and the coordinate plane shows the same idea with points.",
    paragraphs: [
      { topic: "The numbers −4 and −9 are alike in where they sit.", notes: ["both negative", "both left of zero", "both below zero degrees"] },
      { topic: "The numbers −4 and −9 are different in order and distance.", notes: ["−9 farther left", "|−9| = 9 > |−4| = 4", "−9 colder by 5 degrees"] },
      { topic: "The points (−4, 3) and (4, 3) show likeness and difference on a grid.", notes: ["same y = 3", "x signs opposite", "QII vs QI"] },
    ],
    conclusion: "Both the number line and the coordinate plane show that things can share one feature, such as a distance, and still differ in direction.",
  },
  revise: [
    "Did I name at least one way the numbers are alike and one way they are different?",
    "Did I use a comparing word such as both, whereas, however, or in contrast?",
    "Did I keep absolute value (distance) separate from which number is less?",
    "Did I use the correct negative sign and the correct quadrant name?",
  ],
};
