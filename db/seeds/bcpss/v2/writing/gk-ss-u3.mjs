// BCPSS Writing Lab (TWR) — gk-ss-u3 · Past, Present & Family Traditions. Contract: ../writing-schema.mjs

export default {
  title: "Grandma and Sam Go to School",
  genre: "inform",
  tip: "Invite children to ask a grown-up how they got to school as a child, then compare it with today.",
  lessons: [
    { id: "A", title: "Past, present, and timelines" },
    { id: "B", title: "Family traditions" },
    { id: "C", title: "How families lived long ago" },
    { id: "D", title: "Life today" },
  ],
  source: {
    title: "Grandma's School Day",
    lesson: "C",
    text: "Grandma grew up in Baltimore. Long ago, she walked to school. She wrote with a pencil. Today, Sam rides a bus. He writes on a tablet. Both go to school.",
  },
  notes: [
    { sentence: "Long ago, she walked to school.", note: "long ago: walked" },
    { sentence: "Today, Sam rides a bus.", note: "today: bus" },
    { sentence: "He writes on a tablet.", note: "writes on tablet" },
    { sentence: "Both go to school.", note: "both: school" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Long ago, Grandma walked to school",
      because: "her school was close.",
      but: "kids ride buses today.",
      so: "she did not need a bus.",
    },
    {
      lesson: "B",
      kernel: "Ben's family bakes bread each year",
      because: "it is their tradition.",
      but: "the recipe takes a long time.",
      so: "everyone waits for the smell.",
    },
    {
      lesson: "A",
      kernel: "A timeline puts events in order",
      because: "it shows first, next, and last.",
      but: "it does not show every detail.",
      so: "we can see what happened first.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Grandma walked to school.",
      parts: { when: "long ago", how: "with a friend", why: "to learn to read" },
      model: "Long ago, Grandma walked to school with a friend to learn to read.",
    },
    {
      lesson: "D",
      kernel: "Sam rides a bus.",
      parts: { when: "today", where: "to school", how: "with his friends" },
      model: "Today, Sam rides a bus to school with his friends.",
    },
  ],
  fragments: [
    { text: "Long ago, people used candles.", is_sentence: true },
    { text: "Today in Baltimore.", is_sentence: false, fix: "Today, Sam lives in Baltimore." },
    { text: "Both go to school.", is_sentence: true },
    { text: "Rides a bus.", is_sentence: false, fix: "Sam rides a bus." },
    { text: "When Grandma was a girl.", is_sentence: false, fix: "Grandma walked to school when she was a girl." },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "Grandma, ___, grew up in Baltimore.",
      noun: "Grandma",
      options: ["a woman who walked to school", "a line that shows events in order", "something a family does each year"],
      answer: 0,
      model: "Grandma, a woman who walked to school, grew up in Baltimore.",
    },
    {
      lesson: "B",
      sentence: "A tradition, ___, is special to a family.",
      noun: "tradition",
      options: ["a time that already happened", "something a family does again and again", "a line of events"],
      answer: 1,
      model: "A tradition, something a family does again and again, is special to a family.",
    },
    {
      lesson: "A",
      sentence: "A timeline, ___, helps us put events in order.",
      noun: "timeline",
      options: ["something a family does every year", "a day that is happening now", "a line that shows first, next, and last"],
      answer: 2,
      model: "A timeline, a line that shows first, next, and last, helps us put events in order.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "she walked to school", model: "When Grandma was little, she walked to school." },
    { lesson: "B", conjunction: "before", stem: "the family bakes bread", model: "Before the party starts, the family bakes bread." },
    { lesson: "D", conjunction: "although", stem: "kids still go to school", model: "Although buses are new, kids still go to school." },
  ],
  spo: {
    topic: {
      l1_2: "[Grandma] and [Sam] go to school.",
      l3_4: "Long ago, Grandma [walked to school], but today Sam [rides a bus].",
      l5_6: "Although [Grandma and Sam] live in different times, both [go to school].",
    },
    starters: [
      { type: "question", text: "How did Grandma get to school long ago?" },
      { type: "appositive", text: "Grandma, a woman from Baltimore, walked to school." },
      { type: "subordinate", text: "Although times change, kids still go to school." },
    ],
    details: [
      { note: "long ago: walked", lesson: "C" },
      { note: "today: bus", lesson: "D" },
      { note: "long ago: pencil", lesson: "C" },
      { note: "today: tablet", lesson: "D" },
      { note: "both go to school", lesson: "A" },
      { note: "timeline: past → now", lesson: "A" },
    ],
    distractors: ["Ben bakes bread", "birthdays have cake"],
    conclusion: {
      l1_2: "Both go to [school].",
      l3_4: "Both Grandma and Sam [go to school].",
      l5_6: "So the past and the present are [different], but [both] have school.",
    },
  },
  prompt: {
    l1_2: "Draw long ago and today. Write 1-3 sentences. Tell one thing that is different.",
    l3_4: "Write about how life was different long ago and today. Use but and both. Use your outline.",
    l5_6: "Compare life long ago and today. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["Long ago,", "Today,", "Now,", "But", "Both", "Also,", "First,", "Then,"],
  model: {
    l1_2: "Long ago, Grandma walked. Today, Sam rides a bus.",
    l3_4: "Long ago, Grandma walked to school, but today Sam rides a bus. Grandma wrote with a pencil. Sam writes on a tablet. Both go to school.",
    l5_6: "Grandma, a woman from Baltimore, walked to school long ago. Today, Sam rides a bus. Although their days are different, both go to school. Their lives are alike and different.",
  },
  revise: [
    "Did I tell what it was like long ago?",
    "Did I tell what it is like today?",
    "Did I use but to show a difference?",
    "Did I use both to show what is the same?",
  ],
};
