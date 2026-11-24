// BCPSS Writing Lab (TWR) — g3-ela-u2 · Outer Space. Contract: ../writing-schema.mjs

export default {
  title: "Which Tool Teaches Most?",
  genre: "argue",
  tip: "Ask students to name the claim out loud first, then require every detail on the outline to be evidence for that claim.",
  lessons: [
    { id: "A", title: "Orbits, gravity, and planets" },
    { id: "B", title: "Astronauts and the Moon landing" },
    { id: "C", title: "Telescopes and the Hubble Space Telescope" },
    { id: "D", title: "Rovers exploring Mars" },
  ],
  source: {
    title: "A Robot on Mars",
    lesson: "D",
    text: "A rover is a robot that drives across Mars. The Perseverance rover landed in 2021. It rolls over a dry lake bed called Jezero Crater. Its arm tests the rocks. Many of the rocks were shaped by water. That is evidence that a lake was once there. People cannot walk on Mars yet, so the rover does the work for them. It also takes pictures and sends them to Earth. Scientists study the pictures and the rock tests for years.",
  },
  notes: [
    { sentence: "The Perseverance rover landed in 2021.", note: "Perseverance rover landed 2021" },
    { sentence: "Its arm tests the rocks.", note: "rover arm tests rocks" },
    { sentence: "Many of the rocks were shaped by water.", note: "rocks shaped by water" },
    { sentence: "People cannot walk on Mars yet, so the rover does the work for them.", note: "people can't walk on Mars → rover works" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Rovers are important for learning about Mars",
      because: "they test rocks that people cannot touch yet.",
      but: "a rover can only study the small place where it lands.",
      so: "scientists on Earth send rovers to many different places.",
    },
    {
      lesson: "C",
      kernel: "The Hubble Space Telescope helps scientists",
      because: "it takes clear pictures of faraway stars and planets.",
      but: "it cannot touch or test the rocks on a planet.",
      so: "scientists use it together with other tools.",
    },
    {
      lesson: "B",
      kernel: "The Moon rocks were strong evidence",
      because: "astronauts carried them back for scientists to study.",
      but: "only a few astronauts have ever walked on the Moon.",
      so: "scientists studied those rocks for many years.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The rover drove.",
      parts: { when: "after it landed", where: "across Jezero Crater", how: "slowly over the dry rocks", why: "to find signs of an old lake" },
      model: "After it landed, the rover drove slowly over the dry rocks across Jezero Crater to find signs of an old lake.",
    },
    {
      lesson: "B",
      kernel: "The astronauts collected rocks.",
      parts: { when: "in 1969", where: "on the Moon", how: "with special tools", why: "so scientists could study them" },
      model: "In 1969, the astronauts collected rocks on the Moon with special tools so scientists could study them.",
    },
  ],
  fragments: [
    { text: "The rover tests rocks on Mars.", is_sentence: true },
    { text: "Because the lake dried up long ago.", is_sentence: false, fix: "The rocks are dry because the lake dried up long ago." },
    { text: "Looks at faraway stars every night.", is_sentence: false, fix: "The telescope looks at faraway stars every night." },
    { text: "Gravity pulls the Moon toward Earth.", is_sentence: true },
    { text: "Planets travel around the Sun.", is_sentence: true },
    { text: "When the astronauts landed on the Moon.", is_sentence: false, fix: "The crowd cheered when the astronauts landed on the Moon." },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "Perseverance, ___, tests rocks with its arm.",
      noun: "Perseverance",
      options: ["a robot that drives across Mars", "a telescope in orbit around Earth", "the pull that keeps the Moon close"],
      answer: 0,
      model: "Perseverance, a robot that drives across Mars, tests rocks with its arm.",
    },
    {
      lesson: "C",
      sentence: "The Hubble Space Telescope, ___, has photographed faraway stars for more than thirty years.",
      noun: "Hubble Space Telescope",
      options: ["a rover with six wheels", "a tool that makes faraway things look closer", "a trained crew that flies into space"],
      answer: 1,
      model: "The Hubble Space Telescope, a tool that makes faraway things look closer, has photographed faraway stars for more than thirty years.",
    },
    {
      lesson: "A",
      sentence: "Gravity, ___, keeps the Moon moving around Earth.",
      noun: "Gravity",
      options: ["a robot with a long arm", "a person trained to work in space", "the pull that draws objects toward a planet"],
      answer: 2,
      model: "Gravity, the pull that draws objects toward a planet, keeps the Moon moving around Earth.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "scientists send rovers to Mars", model: "Because people cannot walk on Mars yet, scientists send rovers to Mars." },
    { lesson: "B", conjunction: "when", stem: "the scientists learned that the Moon is very old", model: "When they studied the Moon rocks, the scientists learned that the Moon is very old." },
    { lesson: "C", conjunction: "although", stem: "the telescope is a strong tool", model: "Although a telescope cannot visit a planet, the telescope is a strong tool." },
  ],
  spo: {
    topic: {
      l1_2: "I think [rovers] help us learn about space.",
      l3_4: "I think [rovers] are the most important tool for learning about space because [they test rocks on Mars].",
      l5_6: "Although telescopes and astronauts teach us a lot, [rovers, robots that drive on other worlds,] are the most important tool because [they test rocks that people cannot touch].",
    },
    starters: [
      { type: "question", text: "What tool can test rocks on a world people cannot visit?" },
      { type: "appositive", text: "Rovers, robots that drive across other worlds, teach us the most about space." },
      { type: "subordinate", text: "Although telescopes are great tools, rovers can touch and test real rocks." },
    ],
    details: [
      { note: "rover arm tests rocks", lesson: "D" },
      { note: "rocks shaped by water → old lake", lesson: "D" },
      { note: "people can't walk on Mars yet", lesson: "D" },
      { note: "rover sends pictures to Earth", lesson: "D" },
      { note: "telescope sees Mars, can't test rocks", lesson: "C" },
      { note: "Mars orbits the Sun far from Earth", lesson: "A" },
    ],
    distractors: ["the Moon landing was in 1969", "gravity pulls objects toward a planet"],
    conclusion: {
      l1_2: "Rovers help us [learn] about space.",
      l3_4: "For these reasons, I think [rovers] teach us the most because [they test real rocks].",
      l5_6: "For these reasons, [rovers] are the best tool for learning about space, since [they bring real evidence from a world no person has visited].",
    },
  },
  prompt: {
    l1_2: "Draw a rover on Mars. Write 2-3 sentences. Tell what you think and one reason.",
    l3_4: "Which tool is most important for learning about space: telescopes, rovers, or astronauts? Write a paragraph with your claim and two pieces of evidence.",
    l5_6: "Argue which tool is most important for learning about space. Include an appositive, a sentence that starts with although or because, and evidence from the text.",
  },
  transitions: ["First,", "For example,", "According to the text,", "Because", "This shows that", "Also,", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "I think rovers help us learn about space. A rover tests rocks on Mars. People cannot go there yet.",
    l3_4: "I think rovers are the most important tool for learning about space because they test rocks on Mars. According to the text, the Perseverance rover tests rocks with its arm. Many of those rocks were shaped by water. This shows that a lake was once there. For these reasons, rovers teach us the most because they test real rocks.",
    l5_6: "Although telescopes and astronauts teach us a lot, rovers are the most important tool for learning about space. Perseverance, a robot that drives across Mars, tests rocks with its arm. According to the text, many of the rocks were shaped by water, which is evidence that a lake was once there. A telescope can see Mars, but it cannot test a rock. Because people cannot walk on Mars yet, rovers do the work for them. For these reasons, rovers are the best tool for learning about space, since they bring real evidence from a world no person has visited.",
  },
  revise: [
    "Did I state my claim in the first sentence?",
    "Did I use evidence from the text, not just my opinion?",
    "Did I explain how the evidence proves my claim?",
    "Did I use because at least once?",
  ],
};
