// BCPSS Writing Lab (TWR) — g2-ss-u3 · Changemakers & Primary Sources. Contract: ../writing-schema.mjs

export default {
  title: "A Baltimore Changemaker",
  genre: "narrate",
  tip: "Have students order three picture cards (problem, action, change) and retell them before they write.",
  lessons: [
    { id: "A", title: "Primary sources: photographs and letters" },
    { id: "B", title: "Rosa Parks and the bus boycott" },
    { id: "C", title: "Thurgood Marshall from Baltimore" },
    { id: "D", title: "Timelines and turning points" },
  ],
  source: {
    title: "Thurgood Marshall Changes Schools",
    lesson: "C",
    text: "Thurgood Marshall grew up in Baltimore. He saw that schools were unfair. Black children and white children went to different schools. Thurgood became a lawyer to change this. He went to the highest court in the country. At the turning point, the judges said all children could go to school together.",
  },
  notes: [
    { sentence: "Thurgood Marshall grew up in Baltimore.", note: "Thurgood = Baltimore kid" },
    { sentence: "He saw that schools were unfair.", note: "saw unfair schools" },
    { sentence: "Thurgood became a lawyer to change this.", note: "became lawyer → change it" },
    { sentence: "At the turning point, the judges said all children could go to school together.", note: "turning point: judges say same school" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Thurgood Marshall became a lawyer",
      because: "he saw that schools were unfair.",
      but: "the road to change was long.",
      so: "he took the case to the highest court.",
    },
    {
      lesson: "A",
      kernel: "A photograph is a primary source",
      because: "it was made at the time of the event.",
      but: "a book written later is not.",
      so: "historians study photographs for clues.",
    },
    {
      lesson: "B",
      kernel: "Rosa Parks said no to the bus driver",
      because: "she knew the seat rule was unfair.",
      but: "she was arrested for it.",
      so: "many people stopped riding the buses.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The historian studied the photograph.",
      parts: { when: "before writing the timeline", how: "with great care", why: "to find clues about the past" },
      model: "Before writing the timeline, the historian studied the photograph with great care to find clues about the past.",
    },
    {
      lesson: "B",
      kernel: "Rosa Parks stayed seated.",
      parts: { when: "in 1955", where: "on a bus in Montgomery", why: "because the rule was unfair" },
      model: "In 1955, Rosa Parks stayed seated on a bus in Montgomery because the rule was unfair.",
    },
  ],
  fragments: [
    { text: "A timeline shows events in order.", is_sentence: true },
    { text: "Because the rule was unfair.", is_sentence: false, fix: "Rosa Parks said no because the rule was unfair." },
    { text: "Became a lawyer in Baltimore.", is_sentence: false, fix: "Thurgood Marshall became a lawyer in Baltimore." },
    { text: "A photograph is a primary source.", is_sentence: true },
    { text: "The judges at the turning point.", is_sentence: false, fix: "The judges ruled at the turning point." },
    { text: "Changemakers help make things fairer.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "Thurgood Marshall, ___, grew up in Baltimore.",
      noun: "Thurgood Marshall",
      options: ["a brave lawyer", "a person who studies the past", "a picture made with a camera"],
      answer: 0,
      model: "Thurgood Marshall, a brave lawyer, grew up in Baltimore.",
    },
    {
      lesson: "A",
      sentence: "A historian, ___, studies old photographs and letters.",
      noun: "historian",
      options: ["a true story about someone's life", "a person who studies the past", "a line of events in order"],
      answer: 1,
      model: "A historian, a person who studies the past, studies old photographs and letters.",
    },
    {
      lesson: "D",
      sentence: "A timeline, ___, helps us tell a story in order.",
      noun: "timeline",
      options: ["a moment when things start to change", "an original record from the time", "a line that shows events in the order they happened"],
      answer: 2,
      model: "A timeline, a line that shows events in the order they happened, helps us tell a story in order.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "after", stem: "many people stopped riding the buses", model: "After Rosa Parks said no, many people stopped riding the buses." },
    { lesson: "C", conjunction: "when", stem: "all children could learn together", model: "When the judges ruled, all children could learn together." },
    { lesson: "A", conjunction: "because", stem: "a photograph is a primary source", model: "Because it was made at that time, a photograph is a primary source." },
  ],
  spo: {
    topic: {
      l1_2: "Initially, [Thurgood Marshall] saw [unfair schools].",
      l3_4: "Initially, [Thurgood Marshall] saw [unfair schools], so he [became a lawyer].",
      l5_6: "Although [Thurgood Marshall] grew up in Baltimore, [his work as a lawyer] changed [schools across the country].",
    },
    starters: [
      { type: "question", text: "How did a boy from Baltimore change schools for children everywhere?" },
      { type: "appositive", text: "Thurgood Marshall, a lawyer from Baltimore, worked to make schools fair." },
      { type: "subordinate", text: "When Thurgood saw unfair schools, he decided to become a lawyer." },
    ],
    details: [
      { note: "grew up in Baltimore", lesson: "C" },
      { note: "initially: saw unfair schools", lesson: "C" },
      { note: "then: became a lawyer", lesson: "C" },
      { note: "went to the highest court", lesson: "C" },
      { note: "turning point: judges say same school", lesson: "D" },
      { note: "leading to fairer schools", lesson: "D" },
    ],
    distractors: ["Baltimore is on the Chesapeake Bay", "old photographs can look gray"],
    conclusion: {
      l1_2: "In the end, schools became [fairer].",
      l3_4: "In the end, [the judges said] all children could [learn together].",
      l5_6: "As a result, [his courage led] to [fairer schools], and [children] could [learn together].",
    },
  },
  prompt: {
    l1_2: "Draw Thurgood Marshall. Write 1-3 sentences that tell what happened in order.",
    l3_4: "Write a paragraph that tells Thurgood Marshall's story in order. Use initially, then, and leading to.",
    l5_6: "Write a paragraph that tells Thurgood Marshall's story in order, with a turning point. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["Initially,", "First,", "Then,", "After that,", "Next,", "At the turning point,", "Leading to", "Finally,"],
  model: {
    l1_2: "Initially, Thurgood Marshall saw unfair schools. Then he became a lawyer. Schools began to change.",
    l3_4: "Initially, Thurgood Marshall saw unfair schools in Baltimore. Then he became a lawyer to change them. He took his case to the highest court. At the turning point, the judges said all children could learn together.",
    l5_6: "Thurgood Marshall, a lawyer from Baltimore, worked to make schools fair. Initially, he saw that children went to different schools. Then he took the problem to the highest court. When the judges ruled, all children could learn together. That turning point led to fairer schools.",
  },
  revise: [
    "Did I tell the events in order?",
    "Did I use initially, then, and leading to?",
    "Did I tell the problem, the action, and the change?",
    "Did I tell the turning point?",
  ],
};
