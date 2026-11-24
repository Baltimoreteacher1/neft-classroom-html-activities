// BCPSS Writing Lab (TWR) — gk-ss-u1 · Rules, Responsibility & Good Citizenship. Contract: ../writing-schema.mjs

export default {
  title: "Why We Walk in the Hall",
  genre: "argue",
  tip: "Role-play one rule being broken and followed, then ask children to say the rule and why we need it.",
  lessons: [
    { id: "A", title: "Rules at school" },
    { id: "B", title: "Taking turns and sharing" },
    { id: "C", title: "Being a good citizen" },
    { id: "D", title: "Rules in our Baltimore neighborhood" },
  ],
  source: {
    title: "The Hall Rule",
    lesson: "A",
    text: "Our teacher has a rule. We walk in the hall. Leo runs in the hall. He bumps Tia. The teacher says, walk, please. Rules keep us safe.",
  },
  notes: [
    { sentence: "We walk in the hall.", note: "walk in hall" },
    { sentence: "Leo runs in the hall.", note: "Leo runs → bump" },
    { sentence: "Our teacher has a rule.", note: "teacher = rule" },
    { sentence: "Rules keep us safe.", note: "rules = safe" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "We walk in the hall",
      because: "it keeps us safe.",
      but: "running looks like more fun.",
      so: "nobody bumps into a friend.",
    },
    {
      lesson: "B",
      kernel: "We take turns on the slide",
      because: "it is fair.",
      but: "waiting is hard.",
      so: "everyone gets a turn.",
    },
    {
      lesson: "C",
      kernel: "A good citizen helps others",
      because: "it makes our class kind.",
      but: "helping can be hard work.",
      so: "our class feels happy.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Tia waits her turn.",
      parts: { when: "at recess", where: "at the slide", why: "so it is fair" },
      model: "At recess, Tia waits her turn at the slide so it is fair.",
    },
    {
      lesson: "D",
      kernel: "Neighbors follow rules.",
      parts: { when: "every day", where: "at the park", why: "to stay safe" },
      model: "Every day, neighbors follow rules at the park to stay safe.",
    },
  ],
  fragments: [
    { text: "We take turns.", is_sentence: true },
    { text: "Waits in line.", is_sentence: false, fix: "Leo waits in line." },
    { text: "Rules keep us safe.", is_sentence: true },
    { text: "Because it is fair.", is_sentence: false, fix: "We share because it is fair." },
    { text: "When we line up.", is_sentence: false, fix: "We stay quiet when we line up." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A rule, ___, helps us stay safe.",
      noun: "rule",
      options: ["something we all agree to do", "a job that you should do", "treating people kindly"],
      answer: 0,
      model: "A rule, something we all agree to do, helps us stay safe.",
    },
    {
      lesson: "C",
      sentence: "Respect, ___, makes friends feel good.",
      noun: "Respect",
      options: ["a group in the same place", "treating people kindly and listening", "not in danger"],
      answer: 1,
      model: "Respect, treating people kindly and listening, makes friends feel good.",
    },
    {
      lesson: "D",
      sentence: "Baltimore, ___, has rules for every neighborhood.",
      noun: "Baltimore",
      options: ["a job at school", "a line at the fountain", "a city in Maryland"],
      answer: 2,
      model: "Baltimore, a city in Maryland, has rules for every neighborhood.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "nobody gets hurt", model: "When we walk in the hall, nobody gets hurt." },
    { lesson: "B", conjunction: "if", stem: "everyone gets a turn", model: "If we all take turns, everyone gets a turn." },
    { lesson: "D", conjunction: "before", stem: "we look both ways", model: "Before we cross the street, we look both ways." },
  ],
  spo: {
    topic: {
      l1_2: "We [walk] in the hall.",
      l3_4: "We need the rule [walk in the hall] because it keeps us [safe].",
      l5_6: "Although [running] looks fun, we need the rule [to walk] because [it keeps everyone safe].",
    },
    starters: [
      { type: "question", text: "Why do we walk in the hall?" },
      { type: "appositive", text: "Our teacher, a kind helper, has a rule for the hall." },
      { type: "subordinate", text: "When we walk, nobody bumps into a friend." },
    ],
    details: [
      { note: "rule: walk in the hall", lesson: "A" },
      { note: "running → bump a friend", lesson: "A" },
      { note: "someone could get hurt", lesson: "A" },
      { note: "walking = safe", lesson: "A" },
      { note: "good citizen follows rules", lesson: "C" },
      { note: "neighbors need rules too", lesson: "D" },
    ],
    distractors: ["the lunch line is long", "Leo likes recess"],
    conclusion: {
      l1_2: "Rules keep us [safe].",
      l3_4: "A good citizen follows the rule so everyone stays [safe].",
      l5_6: "Because rules keep us safe, [a good citizen] always [follows them].",
    },
  },
  prompt: {
    l1_2: "Draw a rule poster. Write 1-3 sentences. Tell the rule and why we need it.",
    l3_4: "Write about one rule we need. Tell why with because. Use your outline.",
    l5_6: "Argue why one rule is important at school or in our neighborhood. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Also,", "Next,", "because", "so", "if", "then", "For example,"],
  model: {
    l1_2: "We walk in the hall. It keeps us safe.",
    l3_4: "We walk in the hall because it keeps us safe. Running can make us bump a friend. A good citizen follows the rule. Everyone stays safe.",
    l5_6: "Our teacher, a kind helper, has a rule to walk in the hall. When Leo runs, he can bump a friend. Because someone could get hurt, a good citizen walks. Rules keep our school safe.",
  },
  revise: [
    "Did I say the rule?",
    "Did I give a reason with because?",
    "Did I tell what could happen without the rule?",
    "Did I say who the rule keeps safe or fair?",
  ],
};
