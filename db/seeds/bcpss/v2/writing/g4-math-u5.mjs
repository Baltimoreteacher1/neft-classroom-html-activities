// BCPSS Writing Lab (TWR) — g4-math-u5 · Decimals & Metric Measurement. Contract: ../writing-schema.mjs

export default {
  title: "Why the Number Grows",
  genre: "explain",
  tip: "Have students predict whether the number will grow or shrink when the unit changes before they multiply.",
  lessons: [
    { id: "A", title: "Tenths and hundredths as decimals" },
    { id: "B", title: "Comparing decimals" },
    { id: "C", title: "Metric units of length: centimeter, meter, kilometer" },
    { id: "D", title: "Converting meters to centimeters" },
  ],
  source: {
    title: "A Model of the Inner Harbor Walkway",
    lesson: "D",
    text: "Amara builds a model of the Inner Harbor walkway for the science fair. Her paper strip is 1.25 meters long. The digit 5 is in the hundredths place, so 1.25 is 1 whole and 25 hundredths. Her teacher wants the length in centimeters. Because 1 meter equals 100 centimeters, Amara multiplies 1.25 by 100. As a result, the strip is 125 centimeters long. Her friend Jabari has a strip that is 1.3 meters long. That is 130 centimeters. Since 130 is greater than 125, 1.3 is greater than 1.25.",
  },
  notes: [
    { sentence: "The digit 5 is in the hundredths place, so 1.25 is 1 whole and 25 hundredths.", note: "1.25 = 1 + 25 hundredths" },
    { sentence: "Because 1 meter equals 100 centimeters, Amara multiplies 1.25 by 100.", note: "1 m = 100 cm → × 100" },
    { sentence: "As a result, the strip is 125 centimeters long.", note: "1.25 × 100 = 125 cm" },
    { sentence: "Since 130 is greater than 125, 1.3 is greater than 1.25.", note: "130 cm > 125 cm → 1.3 > 1.25" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The 5 in 1.25 is worth 5 hundredths",
      because: "it is in the second place after the decimal point.",
      but: "the 2 is worth more because it is in the tenths place.",
      so: "1.25 is 1 whole, 2 tenths, and 5 hundredths.",
    },
    {
      lesson: "D",
      kernel: "Amara multiplied 1.25 by 100",
      because: "1 meter equals 100 centimeters.",
      but: "the length of the strip did not change.",
      so: "the strip is 125 centimeters long.",
    },
    {
      lesson: "B",
      kernel: "Jabari's strip is longer than Amara's strip",
      because: "3 tenths is greater than 2 tenths.",
      but: "1.3 has fewer digits than 1.25.",
      so: "we can write 1.3 as 1.30 to compare fairly.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Amara multiplied the length.",
      parts: { when: "before the science fair", how: "by 100", why: "to change meters into centimeters" },
      model: "Before the science fair, Amara multiplied the length by 100 to change meters into centimeters.",
    },
    {
      lesson: "C",
      kernel: "Amara measured the strip.",
      parts: { when: "on Friday", where: "at her kitchen table", how: "with a meter stick", why: "to build an accurate model" },
      model: "On Friday, Amara measured the strip at her kitchen table with a meter stick to build an accurate model.",
    },
  ],
  fragments: [
    { text: "The 5 is in the hundredths place.", is_sentence: true },
    { text: "Multiplies 1.25 by 100.", is_sentence: false, fix: "Amara multiplies 1.25 by 100." },
    { text: "Because 1 meter equals 100 centimeters.", is_sentence: false, fix: "Amara multiplies by 100 because 1 meter equals 100 centimeters." },
    { text: "Jabari's strip is 130 centimeters long.", is_sentence: true },
    { text: "As a result of multiplying by 100.", is_sentence: false, fix: "As a result of multiplying by 100, the strip is 125 centimeters long." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A hundredth, ___, is smaller than a tenth.",
      noun: "hundredth",
      options: ["one of 10 equal parts of a whole", "the dot that separates ones from tenths", "one of 100 equal parts of a whole"],
      answer: 2,
      model: "A hundredth, one of 100 equal parts of a whole, is smaller than a tenth.",
    },
    {
      lesson: "C",
      sentence: "A kilometer, ___, is much longer than a centimeter.",
      noun: "kilometer",
      options: ["a metric unit of length equal to 1,000 meters", "a metric unit of mass equal to 1,000 grams", "a small metric unit of length that is 100 to a meter"],
      answer: 0,
      model: "A kilometer, a metric unit of length equal to 1,000 meters, is much longer than a centimeter.",
    },
    {
      lesson: "D",
      sentence: "A centimeter, ___, is the unit Amara needs for her strip.",
      noun: "centimeter",
      options: ["a metric unit of mass equal to 1,000 grams", "a small metric unit of length that is 100 to a meter", "the dot that separates ones from tenths"],
      answer: 1,
      model: "A centimeter, a small metric unit of length that is 100 to a meter, is the unit Amara needs for her strip.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "Amara multiplies 1.25 by 100", model: "Because 1 meter equals 100 centimeters, Amara multiplies 1.25 by 100." },
    { lesson: "B", conjunction: "since", stem: "1.3 is greater than 1.25", model: "Since 130 is greater than 125, 1.3 is greater than 1.25." },
    { lesson: "A", conjunction: "when", stem: "Amara reads the 5 as 5 hundredths", model: "When the 5 is in the second place after the decimal point, Amara reads it as 5 hundredths." },
  ],
  spo: {
    topic: {
      l1_2: "Amara [multiplies by 100] to change [meters] into [centimeters].",
      l3_4: "Because 1 meter equals 100 centimeters, Amara [multiplies the length by 100], so her strip is [125 centimeters] long.",
      l5_6: "Since [a meter is made of 100 centimeters], changing to a smaller unit [causes the number to grow], and as a result [Amara's 1.25 meters becomes 125 centimeters].",
    },
    starters: [
      { type: "question", text: "Why does the number get bigger when you change meters into centimeters?" },
      { type: "appositive", text: "Amara, a fourth grader from Baltimore, measured a strip of paper for the science fair." },
      { type: "subordinate", text: "When Amara changes to a smaller unit, the number of units gets bigger." },
    ],
    details: [
      { note: "strip = 1.25 meters", lesson: "A" },
      { note: "5 in hundredths place", lesson: "A" },
      { note: "1 meter = 100 centimeters", lesson: "C" },
      { note: "1.25 × 100 = 125", lesson: "D" },
      { note: "smaller unit → bigger number", lesson: "D" },
      { note: "Jabari 1.3 m = 130 cm, longer", lesson: "B" },
    ],
    distractors: ["science fairs have tall folding tables", "paper comes in many bright colors"],
    conclusion: {
      l1_2: "The strip is [125] centimeters.",
      l3_4: "As a result, the strip is [125 centimeters] long.",
      l5_6: "Therefore, [multiplying by 100] shows that [1.25 meters] and [125 centimeters] are the same length.",
    },
  },
  prompt: {
    l1_2: "Draw Amara's paper strip. Write 2-3 sentences that tell how long it is in centimeters. Use the words meter and centimeter.",
    l3_4: "Write a paragraph that explains what happens to 1.25 meters when you change it to centimeters. Use your outline, because, so, and as a result.",
    l5_6: "Write a paragraph that explains why 1.25 meters becomes 125 centimeters and how that helps compare it to 1.3 meters. Include an appositive and a sentence that starts with since or when.",
  },
  transitions: ["Because", "So", "Since", "As a result,", "Therefore,", "This means that", "For example,", "When"],
  model: {
    l1_2: "Amara's strip is 1.25 meters long. One meter is 100 centimeters. So the strip is 125 centimeters long.",
    l3_4: "Because 1 meter equals 100 centimeters, Amara multiplies the length by 100, so her strip is 125 centimeters long. The strip is 1.25 meters, which is 1 whole and 25 hundredths. She multiplies 1.25 by 100 to change meters into centimeters. As a result, the number gets bigger because a centimeter is a smaller unit. Jabari's strip is 1.3 meters, or 130 centimeters, so it is longer.",
    l5_6: "Since a meter is made of 100 centimeters, changing to a smaller unit causes the number to grow. Amara, a fourth grader from Baltimore, measured a paper strip that was 1.25 meters long. The digit 5 is in the hundredths place, so 1.25 is 1 whole and 25 hundredths. Because 1 meter equals 100 centimeters, she multiplied 1.25 by 100. As a result, her strip is 125 centimeters long. When her friend Jabari measured 1.3 meters, he found 130 centimeters. Therefore, multiplying by 100 shows that Jabari's strip is longer, because 130 is greater than 125.",
  },
  revise: [
    "Did I name the cause and then its effect, using because, so, or as a result?",
    "Did I show the multiplication, such as 1.25 × 100 = 125?",
    "Did I say why the number gets bigger when the unit gets smaller?",
    "Did I use decimal words, like tenths, hundredths, and decimal point, correctly?",
  ],
};
