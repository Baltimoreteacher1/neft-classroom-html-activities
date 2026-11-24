// BCPSS Writing Lab (TWR) — g1-sci-u4 · Communicating with Light & Sound. Contract: ../writing-schema.mjs

export default {
  title: "Which Signal Works Best?",
  genre: "argue",
  tip: "Run a quick far-away signal test with a flashlight and a bell, then have students state a claim and one piece of proof before writing.",
  lessons: [
    { id: "A", title: "Light and sound send messages" },
    { id: "B", title: "Design a signal" },
    { id: "C", title: "Test and collect evidence" },
    { id: "D", title: "Make a claim with proof" },
  ],
  source: {
    title: "The Playground Signal Test",
    lesson: "C",
    text: "On a sunny day, a class tests two signals. Tomás blinks a flashlight. Rosa rings a bell. The class stands far across the playground. Few children see the blinks. Almost every child hears the bell. The sun is too bright for the flashlight. So the bell works best today.",
  },
  notes: [
    { sentence: "Few children see the blinks.", note: "few see blinks" },
    { sentence: "Almost every child hears the bell.", note: "almost all hear bell" },
    { sentence: "The sun is too bright for the flashlight.", note: "sun too bright → flashlight" },
    { sentence: "So the bell works best today.", note: "bell = best" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "The bell works best in the day",
      because: "everyone could hear it across the playground.",
      but: "the flashlight is better at night.",
      so: "the class picks the bell.",
    },
    {
      lesson: "C",
      kernel: "The flashlight was hard to see",
      because: "the sun was too bright.",
      but: "it would work well in the dark.",
      so: "the class did not pick it.",
    },
    {
      lesson: "B",
      kernel: "The class tested both signals",
      because: "they wanted proof.",
      but: "the test took extra time.",
      so: "they could pick the best signal.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Rosa rang a bell.",
      parts: { when: "on a sunny day", where: "across the playground", how: "with a loud ding" },
      model: "On a sunny day, Rosa rang a bell across the playground with a loud ding.",
    },
    {
      lesson: "C",
      kernel: "The class tested.",
      parts: { when: "on Friday", where: "on the playground", why: "to find the best signal" },
      model: "On Friday, the class tested two signals on the playground to find the best signal.",
    },
  ],
  fragments: [
    { text: "The bell works best.", is_sentence: true },
    { text: "Heard the bell across the yard.", is_sentence: false, fix: "Everyone heard the bell across the yard." },
    { text: "Because the sun was too bright.", is_sentence: false, fix: "Few children saw the flashlight because the sun was too bright." },
    { text: "Our test showed proof.", is_sentence: true },
    { text: "The best signal for the day.", is_sentence: false, fix: "The bell is the best signal for the day." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Rosa, ___, rang the bell.",
      noun: "Rosa",
      options: ["a girl on the design team", "a light that blinks", "a test with proof"],
      answer: 0,
      model: "Rosa, a girl on the design team, rang the bell.",
    },
    {
      lesson: "A",
      sentence: "A signal, ___, tells someone something.",
      noun: "A signal",
      options: ["a plan for making something", "a light or sound that tells someone something", "a tool made to do a job"],
      answer: 1,
      model: "A signal, a light or sound that tells someone something, tells someone something.",
    },
    {
      lesson: "C",
      sentence: "Evidence, ___, comes from a test.",
      noun: "Evidence",
      options: ["a sentence that tells what you think", "how far one place is from another", "proof you get from a test"],
      answer: 2,
      model: "Evidence, proof you get from a test, comes from a test.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "the bell works best", model: "Because almost everyone heard it, the bell works best." },
    { lesson: "C", conjunction: "although", stem: "the sun hid its blinks", model: "Although the flashlight is a good signal at night, the sun hid its blinks." },
    { lesson: "D", conjunction: "when", stem: "the class sees that the bell won", model: "When the class compares the results, the class sees that the bell won." },
  ],
  spo: {
    topic: {
      l1_2: "I think the [bell] works best.",
      l3_4: "I think the [bell] works best because [our test showed proof].",
      l5_6: "Although [the flashlight] is a good signal at night, I claim the [bell] works best on a sunny day because [evidence from our test].",
    },
    starters: [
      { type: "question", text: "Which signal works best on a sunny playground?" },
      { type: "statement", text: "I think the bell works best in the day." },
      { type: "subordinate", text: "Although the flashlight blinks, the bell is easier to hear." },
    ],
    details: [
      { note: "test: flashlight vs bell", lesson: "C" },
      { note: "sunny day, far away", lesson: "C" },
      { note: "few see blinks", lesson: "C" },
      { note: "almost all hear bell", lesson: "C" },
      { note: "sun too bright for flashlight", lesson: "B" },
      { note: "bell = best in day", lesson: "D" },
    ],
    distractors: ["Tomás wears a red shirt", "the playground has swings"],
    conclusion: {
      l1_2: "So the [bell] is the [best].",
      l3_4: "So the [bell] works best because [almost everyone heard it].",
      l5_6: "Because [our test showed that almost everyone heard the bell], we claim the [bell] is the [best signal for a sunny day].",
    },
  },
  prompt: {
    l1_2: "Draw the best signal. Write 1-3 sentences. Tell which signal works best and why.",
    l3_4: "Write your claim about which signal works best. Prove it with evidence from the test. Use the words because and so.",
    l5_6: "Write a paragraph that claims which signal works best on a sunny day and proves it with evidence. Include an appositive and a sentence that starts with although, because, or when.",
  },
  transitions: ["I think", "Because", "For example,", "Our test showed", "Also,", "So", "But", "In the end,"],
  model: {
    l1_2: "I think the bell works best. Almost everyone heard it. Few saw the flashlight.",
    l3_4: "I think the bell works best because our test showed almost everyone heard it. The sun was too bright for the flashlight. Few children saw the blinks. So the bell is the best signal for the day.",
    l5_6: "Although the flashlight is a good signal at night, I claim the bell works best on a sunny day. Our test, a signal check across the playground, gave us evidence. Almost every child heard the bell, but few saw the flashlight blink. Because the sun was too bright, the blinks were hard to see. So the bell is the best signal for the day.",
  },
  revise: [
    "Did I say which signal works best?",
    "Did I use proof from the test, like how many heard it?",
    "Did I use because to connect my claim and my proof?",
    "Did I tell why the other signal did not work as well?",
  ],
};
