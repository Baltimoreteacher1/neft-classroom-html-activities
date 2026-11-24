// BCPSS Writing Lab (TWR) — g1-math-u4 · Measure Length & Tell Time. Contract: ../writing-schema.mjs

export default {
  title: "Same and Different Lengths",
  genre: "inform",
  tip: "Line up two real objects at the same starting edge and lay paper clips end to end before students say both and but.",
  lessons: [
    { id: "A", title: "Compare lengths: longer and shorter" },
    { id: "B", title: "Measure end to end with units" },
    { id: "C", title: "Tell time to the hour" },
    { id: "D", title: "Tell time to the half hour" },
  ],
  source: {
    title: "Omar Measures",
    lesson: "B",
    text: "Omar measures a pencil and a marker. He lines up paper clips end to end. The pencil is 6 clips long. The marker is 4 clips long. Both start at the same place. The pencil is longer, but the marker is shorter. The pencil is 2 clips longer. Then Omar looks at the clock. The minute hand points to 6. It is half past 4.",
  },
  notes: [
    { sentence: "The pencil is 6 clips long.", note: "pencil = 6 clips" },
    { sentence: "Both start at the same place.", note: "both start same place" },
    { sentence: "The pencil is 2 clips longer.", note: "pencil + 2 clips" },
    { sentence: "The minute hand points to 6.", note: "min hand @ 6" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The pencil is longer than the marker",
      because: "it is 6 clips long and the marker is 4.",
      but: "both start at the same place.",
      so: "the pencil is 2 clips longer.",
    },
    {
      lesson: "C",
      kernel: "The minute hand points to 12",
      because: "the time is right on the hour.",
      but: "at half past it points to 6.",
      so: "we say 4 o'clock when the hour hand is on 4.",
    },
    {
      lesson: "B",
      kernel: "Omar put the clips end to end",
      because: "the clips must touch with no gaps.",
      but: "he did not stack them in a pile.",
      so: "the length is 6 clips.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Omar measured two things.",
      parts: { when: "before lunch", where: "at his desk", how: "with paper clips" },
      model: "Before lunch, Omar measured two things at his desk with paper clips.",
    },
    {
      lesson: "D",
      kernel: "Omar looks.",
      parts: { when: "after he measures", where: "at the clock", why: "to tell the time" },
      model: "After he measures, Omar looks at the clock to tell the time.",
    },
  ],
  fragments: [
    { text: "The pencil is 2 clips longer.", is_sentence: true },
    { text: "Longer than the marker.", is_sentence: false, fix: "The pencil is longer than the marker." },
    { text: "Both start at the same place.", is_sentence: true },
    { text: "Half past 4.", is_sentence: false, fix: "It is half past 4." },
    { text: "Because the minute hand points to 6.", is_sentence: false, fix: "It is half past 4 because the minute hand points to 6." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Omar, ___, measures a pencil.",
      noun: "Omar",
      options: ["a first grader at school", "a clip that is a unit", "the long hand on a clock"],
      answer: 0,
      model: "Omar, a first grader at school, measures a pencil.",
    },
    {
      lesson: "B",
      sentence: "A paper clip, ___, is a unit of length.",
      noun: "A paper clip",
      options: ["the short hand on a clock", "one small thing used again and again", "the time at 4:30"],
      answer: 1,
      model: "A paper clip, one small thing used again and again, is a unit of length.",
    },
    {
      lesson: "D",
      sentence: "The minute hand, ___, points to 6 at half past 4.",
      noun: "The minute hand",
      options: ["the short hand on a clock", "a unit to measure length", "the long hand on a clock"],
      answer: 2,
      model: "The minute hand, the long hand on a clock, points to 6 at half past 4.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "although", stem: "the pencil is longer", model: "Although both start at the same place, the pencil is longer." },
    { lesson: "B", conjunction: "because", stem: "the pencil is 2 clips longer", model: "Because it is 6 clips and the marker is 4 clips, the pencil is 2 clips longer." },
    { lesson: "D", conjunction: "when", stem: "it is half past 4", model: "When the minute hand points to 6, it is half past 4." },
  ],
  spo: {
    topic: {
      l1_2: "The [pencil] is longer. The [marker] is shorter.",
      l3_4: "Both the [pencil] and the [marker] are measured in [clips], but the [pencil] is longer.",
      l5_6: "Although both [objects] start at the same place, [the pencil] is longer than [the marker] by [2 clips].",
    },
    starters: [
      { type: "question", text: "Which is longer, the pencil or the marker?" },
      { type: "statement", text: "Both the pencil and the marker start at the same place." },
      { type: "appositive", text: "The pencil, a tool for writing, is 2 clips longer than the marker." },
    ],
    details: [
      { note: "pencil = 6 clips", lesson: "B" },
      { note: "marker = 4 clips", lesson: "B" },
      { note: "both start same place", lesson: "A" },
      { note: "clips end to end, no gaps", lesson: "B" },
      { note: "6 − 4 = 2 clips longer", lesson: "A" },
      { note: "min hand @ 6 = half past 4", lesson: "D" },
    ],
    distractors: ["the clips are silver", "Omar likes to draw"],
    conclusion: {
      l1_2: "The [pencil] is [2 clips] longer.",
      l3_4: "So the [pencil] is [2 clips] longer than the [marker].",
      l5_6: "Because [the pencil is 6 clips and the marker is 4 clips], the pencil is [2 clips] longer than the marker.",
    },
  },
  prompt: {
    l1_2: "Draw a pencil and a marker with clips end to end. Write 1-3 sentences. Tell which is longer.",
    l3_4: "Compare a 6-clip pencil and a 4-clip marker. Tell how they are alike and different. Use both and but.",
    l5_6: "Compare a 6-clip pencil and a 4-clip marker. Tell how they are alike, how they are different, and how much longer one is. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Both", "Also,", "But", "However,", "On the other hand,", "Because", "So", "In the end,"],
  model: {
    l1_2: "The pencil is 6 clips long. The marker is 4 clips long. The pencil is longer.",
    l3_4: "Both the pencil and the marker start at the same place. The pencil is 6 clips long, but the marker is 4 clips long. So the pencil is 2 clips longer.",
    l5_6: "Although both start at the same place, the pencil is longer than the marker. Omar put the clips end to end, so each clip counts once. The pencil, a tool for writing, is 6 clips long. Because the marker is only 4 clips long, the pencil is 2 clips longer.",
  },
  revise: [
    "Did I tell one way the two things are alike?",
    "Did I tell one way they are different?",
    "Did I use the number of clips for each one?",
    "Did I say how much longer one is?",
  ],
};
