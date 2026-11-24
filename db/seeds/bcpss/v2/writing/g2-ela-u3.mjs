// BCPSS Writing Lab (TWR) — g2-ela-u3 · Civil Rights Heroes. Contract: ../writing-schema.mjs

export default {
  title: "A Brave Walk Through History",
  genre: "narrate",
  tip: "Have students act out the events in order with three pictures before they write the story.",
  lessons: [
    { id: "A", title: "Unfair rules called segregation" },
    { id: "B", title: "Ruby Bridges walks in with courage" },
    { id: "C", title: "Sylvia Mendez and her family speak up" },
    { id: "D", title: "The Montgomery bus boycott" },
  ],
  source: {
    title: "Sylvia Asks for a Fair School",
    lesson: "C",
    text: "Sylvia Mendez was eight years old. She lived in California. Her family wanted her to go to the school near home. But the school said no because she was Mexican American. That was unfair. Her parents asked a judge for help. After the judge ruled, children could go to the same school.",
  },
  notes: [
    { sentence: "Sylvia Mendez was eight years old.", note: "Sylvia, age 8" },
    { sentence: "But the school said no because she was Mexican American.", note: "school said no = unfair" },
    { sentence: "Her parents asked a judge for help.", note: "parents → judge" },
    { sentence: "After the judge ruled, children could go to the same school.", note: "judge ruled → same school" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Segregation was an unfair rule",
      because: "it treated people differently by skin color.",
      but: "brave people worked to change it.",
      so: "many children could not go to the nearest school.",
    },
    {
      lesson: "B",
      kernel: "Ruby Bridges walked into a new school",
      because: "a judge said she could go there.",
      but: "some people shouted at her.",
      so: "marshals walked beside her each day.",
    },
    {
      lesson: "D",
      kernel: "Families in Montgomery walked instead of riding the bus",
      because: "the bus rules were unfair.",
      but: "it was a long way to walk.",
      so: "the bus company lost many riders.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Ruby walked.",
      parts: { when: "every morning", where: "into her new school", how: "with courage" },
      model: "Every morning, Ruby walked into her new school with courage.",
    },
    {
      lesson: "C",
      kernel: "Sylvia's parents spoke up.",
      parts: { where: "in a California court", how: "with great courage", why: "so all children could learn together" },
      model: "Sylvia's parents spoke up in a California court with great courage so all children could learn together.",
    },
  ],
  fragments: [
    { text: "Ruby was six years old.", is_sentence: true },
    { text: "Walked beside her each day.", is_sentence: false, fix: "Marshals walked beside her each day." },
    { text: "Because the rule was unfair.", is_sentence: false, fix: "People protested because the rule was unfair." },
    { text: "The judge said the rule was unfair.", is_sentence: true },
    { text: "After the boycott ended.", is_sentence: false, fix: "After the boycott ended, all riders could sit anywhere." },
    { text: "Sylvia's family showed courage.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Ruby Bridges, ___, walked into a new school.",
      noun: "Ruby Bridges",
      options: ["a judge in California", "a brave six-year-old girl", "a bus in Montgomery"],
      answer: 1,
      model: "Ruby Bridges, a brave six-year-old girl, walked into a new school.",
    },
    {
      lesson: "C",
      sentence: "Sylvia Mendez, ___, wanted to go to the school near her home.",
      noun: "Sylvia Mendez",
      options: ["a girl from California", "a leader of the bus boycott", "a marshal who kept children safe"],
      answer: 0,
      model: "Sylvia Mendez, a girl from California, wanted to go to the school near her home.",
    },
    {
      lesson: "D",
      sentence: "The boycott, ___, lasted 381 days.",
      noun: "boycott",
      options: ["an unfair rule about seats", "a judge's long speech", "a choice to stop riding the buses"],
      answer: 2,
      model: "The boycott, a choice to stop riding the buses, lasted 381 days.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "since", stem: "many people protested in a peaceful way", model: "Since the rule was unfair, many people protested in a peaceful way." },
    { lesson: "B", conjunction: "while", stem: "marshals walked beside her", model: "While Ruby walked to class, marshals walked beside her." },
    { lesson: "D", conjunction: "after", stem: "all riders could sit anywhere", model: "After the court ruled, all riders could sit anywhere." },
  ],
  spo: {
    topic: {
      l1_2: "Initially, [Ruby] could not go to the [nearest school].",
      l3_4: "Initially, [Ruby Bridges] could not [go to the nearest school], but she showed [courage].",
      l5_6: "Although [Ruby Bridges] was only [six years old], she [showed great courage and helped change a school].",
    },
    starters: [
      { type: "question", text: "How can a six-year-old girl help change an unfair rule?" },
      { type: "appositive", text: "Ruby Bridges, a brave girl from New Orleans, walked into a new school." },
      { type: "subordinate", text: "When Ruby was six, she showed the world what courage looks like." },
    ],
    details: [
      { note: "unfair rule: Ruby could not go to school", lesson: "A" },
      { note: "1960: age six, new school", lesson: "B" },
      { note: "judge ruled → she could go", lesson: "B" },
      { note: "people shouted at her", lesson: "B" },
      { note: "marshals walked beside her", lesson: "B" },
      { note: "turning point: school began to change", lesson: "D" },
    ],
    distractors: ["many schools have gyms", "the bus ride took ten minutes"],
    conclusion: {
      l1_2: "As a result, a school began to [change].",
      l3_4: "As a result, [a school began to change] because [Ruby] showed [courage].",
      l5_6: "Because [Ruby kept walking], [a school began to change and more children could learn together].",
    },
  },
  prompt: {
    l1_2: "Draw Ruby or Sylvia. Write 1-3 sentences that tell what happened in order.",
    l3_4: "Write a paragraph that tells Ruby Bridges's story in order. Tell what was unfair, what she did, and what changed. Use initially, after, and as a result.",
    l5_6: "Write a paragraph that tells Ruby Bridges's story in order, with a turning point. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Initially,", "First,", "Then,", "After that,", "Next,", "At the turning point,", "As a result,", "Finally,"],
  model: {
    l1_2: "Initially, Ruby could not go to the nearest school. After a judge ruled, she walked in. She was brave.",
    l3_4: "Initially, Ruby Bridges could not go to the nearest school. After a judge ruled, she walked in at age six. Some people shouted, but marshals walked beside her. As a result, a school began to change.",
    l5_6: "Although Ruby Bridges was only six, she showed great courage. Initially, she could not go to the nearest school. After a judge ruled, Ruby walked in while marshals kept her safe. Ruby, a brave girl from New Orleans, kept walking each day. As a result, a school began to change.",
  },
  revise: [
    "Did I tell the events in order?",
    "Did I use initially, after, and as a result?",
    "Did I tell what was unfair and what changed?",
    "Did I use past tense words, like walked and asked?",
  ],
};
