// BCPSS Writing Lab (TWR) — g1-ss-u1 · Civics, Leaders & Community Helpers. Contract: ../writing-schema.mjs

export default {
  title: "Why We Need Helpers",
  genre: "argue",
  tip: "Have students name a helper on their own block aloud and finish the sentence stem 'We need this helper because...' before writing.",
  lessons: [
    { id: "A", title: "Community helpers in Baltimore" },
    { id: "B", title: "Leaders and the mayor" },
    { id: "C", title: "Rules and fair voting" },
    { id: "D", title: "Cooperate to solve problems" },
  ],
  source: {
    title: "Helpers in Baltimore",
    lesson: "A",
    text: "Baltimore has many helpers. A trash collector picks up the trash. Then the street stays clean. A nurse helps sick people feel better. The mayor is the leader of the city. The mayor makes plans with other leaders. We vote for leaders. Each helper is important. The trash collector keeps the neighborhood healthy.",
  },
  notes: [
    { sentence: "A trash collector picks up the trash.", note: "collector → picks up trash" },
    { sentence: "A nurse helps sick people feel better.", note: "nurse → helps sick people" },
    { sentence: "The mayor makes plans with other leaders.", note: "mayor → plans w/ leaders" },
    { sentence: "We vote for leaders.", note: "vote → leaders" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A trash collector is an important helper",
      because: "the street stays clean.",
      but: "many people do not see this job.",
      so: "we should say thank you.",
    },
    {
      lesson: "B",
      kernel: "The mayor is an important leader",
      because: "the mayor makes plans for the city.",
      but: "the mayor cannot do it alone.",
      so: "the mayor works with other leaders.",
    },
    {
      lesson: "D",
      kernel: "A nurse is an important helper",
      because: "nurses help sick people feel better.",
      but: "nurses cannot work alone.",
      so: "they cooperate with doctors.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The mayor leads.",
      parts: { when: "every day", how: "with other leaders", why: "to solve problems" },
      model: "Every day, the mayor leads the city with other leaders to solve problems.",
    },
    {
      lesson: "C",
      kernel: "Neighbors vote.",
      parts: { when: "on election day", where: "at their school", why: "to choose a leader" },
      model: "On election day, neighbors vote at their school to choose a leader.",
    },
  ],
  fragments: [
    { text: "The mayor leads the city.", is_sentence: true },
    { text: "Picks up the trash.", is_sentence: false, fix: "A trash collector picks up the trash." },
    { text: "Because the street stays clean.", is_sentence: false, fix: "We need a trash collector because the street stays clean." },
    { text: "A nurse helps sick people.", is_sentence: true },
    { text: "Leaders and helpers in our neighborhood.", is_sentence: false, fix: "Leaders and helpers in our neighborhood work together." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "The mayor, ___, makes plans for Baltimore.",
      noun: "The mayor",
      options: ["the leader of a city", "a person who picks up trash", "a rule for safety"],
      answer: 0,
      model: "The mayor, the leader of a city, makes plans for Baltimore.",
    },
    {
      lesson: "A",
      sentence: "A nurse, ___, helps sick people feel better.",
      noun: "A nurse",
      options: ["a leader of a city", "a helper who works with doctors", "a place with many books"],
      answer: 1,
      model: "A nurse, a helper who works with doctors, helps sick people feel better.",
    },
    {
      lesson: "C",
      sentence: "A rule, ___, keeps people safe and fair.",
      noun: "A rule",
      options: ["a person who leads a city", "a place to vote", "something everyone must do"],
      answer: 2,
      model: "A rule, something everyone must do, keeps people safe and fair.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "we need trash collectors", model: "Because trash makes the street dirty, we need trash collectors." },
    { lesson: "C", conjunction: "when", stem: "neighbors vote", model: "When a city needs a leader, neighbors vote." },
    { lesson: "D", conjunction: "if", stem: "the street would be dirty", model: "If no one picked up the trash, the street would be dirty." },
  ],
  spo: {
    topic: {
      l1_2: "A [helper] is important.",
      l3_4: "A [trash collector] is an important helper because [reason].",
      l5_6: "Although [many people do not notice], a [trash collector], a helper who [keeps the street clean], is important because [reason].",
    },
    starters: [
      { type: "question", text: "Who keeps our neighborhood clean and healthy?" },
      { type: "statement", text: "A trash collector is a helper we need." },
      { type: "subordinate", text: "Because trash collectors work hard, Baltimore streets stay clean." },
    ],
    details: [
      { note: "picks up trash every week", lesson: "A" },
      { note: "street stays clean", lesson: "A" },
      { note: "clean street = healthy neighbors", lesson: "D" },
      { note: "city leaders make plans", lesson: "B" },
      { note: "neighbors vote for leaders", lesson: "C" },
      { note: "helpers + leaders cooperate", lesson: "D" },
    ],
    distractors: ["the mayor wears a blue tie", "trash trucks are loud"],
    conclusion: {
      l1_2: "We need [helpers].",
      l3_4: "So we should say [thank you] because [helpers keep us safe and clean].",
      l5_6: "Because [trash collectors keep the street clean and healthy], every neighbor should [say thank you].",
    },
  },
  prompt: {
    l1_2: "Draw a helper in Baltimore. Write 1-3 sentences. Tell why we need this helper.",
    l3_4: "Pick a helper in your community. Write why we need this helper. Use because and for example.",
    l5_6: "Write a paragraph that argues why one helper is important to Baltimore. Include an appositive and a sentence that starts with because, when, or if.",
  },
  transitions: ["I think", "Because", "For example,", "Also,", "So", "When", "That is why", "In the end,"],
  model: {
    l1_2: "A trash collector is a helper. We need this helper. The street stays clean.",
    l3_4: "A trash collector is an important helper because the street stays clean. A trash collector picks up trash every week. For example, clean streets keep neighbors healthy. So we should say thank you.",
    l5_6: "Although many people do not notice, the trash collector, a helper who cleans our streets, is important. The trash collector picks up trash every week, so the street stays clean. Because clean streets keep neighbors healthy, we need this helper. The mayor and other leaders cooperate with helpers to solve problems. Every neighbor should say thank you.",
  },
  revise: [
    "Did I name a helper or leader in my first sentence?",
    "Did I use because to give a reason?",
    "Did I give one example of what the helper does?",
    "Did I end by telling why we should say thank you?",
  ],
};
