// BCPSS Writing Lab (TWR) — gk-sci-u2 · Pushes, Pulls & Motion. Contract: ../writing-schema.mjs

export default {
  title: "Ana Pushes and Pulls",
  genre: "explain",
  tip: "Let children push and pull a toy car or ball, saying what they did first and what happened next.",
  lessons: [
    { id: "A", title: "Pushes and pulls" },
    { id: "B", title: "Strong and gentle pushes and pulls" },
    { id: "C", title: "Changing the direction of motion" },
    { id: "D", title: "Making things stop" },
  ],
  source: {
    title: "Playground Pushes and Pulls",
    lesson: "A",
    text: "Ana plays at the park. First, she pushes the swing. It moves away. Next, she pulls the wagon. It comes closer. A strong push means fast.",
  },
  notes: [
    { sentence: "First, she pushes the swing.", note: "push swing → away" },
    { sentence: "Next, she pulls the wagon.", note: "pull wagon → closer" },
    { sentence: "A strong push means fast.", note: "strong push = fast" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Ana pulls the wagon",
      because: "she wants it to come closer.",
      but: "the wagon is heavy.",
      so: "she pulls with a strong pull.",
    },
    {
      lesson: "B",
      kernel: "Kai gives the ball a gentle push",
      because: "he wants it to roll slowly.",
      but: "a strong push makes it fast.",
      so: "the ball rolls slowly.",
    },
    {
      lesson: "C",
      kernel: "Nia pushes the rolling ball",
      because: "she wants it to turn.",
      but: "it keeps going forward at first.",
      so: "the ball changes direction.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Noah pushes the swing.",
      parts: { when: "at recess", where: "at the park", how: "with both hands" },
      model: "At recess, Noah pushes the swing at the park with both hands.",
    },
    {
      lesson: "D",
      kernel: "Kai stops the ball.",
      parts: { when: "then", where: "on the floor", how: "with his hand" },
      model: "Then Kai stops the ball on the floor with his hand.",
    },
  ],
  fragments: [
    { text: "A push moves it away.", is_sentence: true },
    { text: "Pulls the wagon.", is_sentence: false, fix: "Ana pulls the wagon." },
    { text: "The ball rolls fast.", is_sentence: true },
    { text: "Because the push is strong.", is_sentence: false, fix: "The ball rolls fast because the push is strong." },
    { text: "Stops the swing.", is_sentence: false, fix: "Noah stops the swing." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A push, ___, moves a thing away.",
      noun: "push",
      options: ["a way to make something go away from you", "a way to make something come closer", "a soft and light touch"],
      answer: 0,
      model: "A push, a way to make something go away from you, moves a thing away.",
    },
    {
      lesson: "B",
      sentence: "Speed, ___, tells how fast a thing goes.",
      noun: "Speed",
      options: ["the way something is going", "how fast or how slow something goes", "to quit moving"],
      answer: 1,
      model: "Speed, how fast or how slow something goes, tells how fast a thing goes.",
    },
    {
      lesson: "C",
      sentence: "Direction, ___, tells where a thing is going.",
      noun: "Direction",
      options: ["how fast something goes", "a strong push", "the way something is going"],
      answer: 2,
      model: "Direction, the way something is going, tells where a thing is going.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the ball rolls fast", model: "When I give a strong push, the ball rolls fast." },
    { lesson: "A", conjunction: "if", stem: "it comes closer", model: "If I pull the wagon, it comes closer." },
    { lesson: "D", conjunction: "before", stem: "I stop it with my hand", model: "Before the ball hits the wall, I stop it with my hand." },
  ],
  spo: {
    topic: {
      l1_2: "Ana [pushes] and [pulls] at the park.",
      l3_4: "A [push] moves things away, and a [pull] brings things [closer].",
      l5_6: "Although [pushes] and [pulls] are different, both [change how things move].",
    },
    starters: [
      { type: "question", text: "How can you make a swing go?" },
      { type: "appositive", text: "Ana, a girl at the park, pushes and pulls." },
      { type: "subordinate", text: "When Ana pulls the wagon, it comes closer." },
    ],
    details: [
      { note: "push = move away", lesson: "A" },
      { note: "pull = come closer", lesson: "A" },
      { note: "gentle push = slow", lesson: "B" },
      { note: "strong push = fast", lesson: "B" },
      { note: "push left → ball goes left", lesson: "C" },
      { note: "hand stops the ball", lesson: "D" },
    ],
    distractors: ["swings have chains", "slides are tall"],
    conclusion: {
      l1_2: "A [push] makes it go [away].",
      l3_4: "A strong push makes it go [fast], and a pull brings it [closer].",
      l5_6: "Because pushes and pulls [change motion], Ana can make things [go fast, go slow, or stop].",
    },
  },
  prompt: {
    l1_2: "Draw a toy you push or pull. Write 1-3 sentences. Tell what you did and what happened.",
    l3_4: "Write about a push and a pull. Tell what you did first and what happened next. Use your outline.",
    l5_6: "Explain how pushes and pulls change motion. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Next,", "Then,", "Last,", "so", "because", "but", "when"],
  model: {
    l1_2: "I push the swing. It moves away.",
    l3_4: "First, I push the swing, and it moves away. Next, I pull the wagon, so it comes closer. A strong push makes the ball roll fast.",
    l5_6: "At the park, Ana, a girl with a wagon, pushes and pulls. When she pushes the swing, it moves away. Because she pulls the wagon, it comes closer. Then a strong push makes the ball roll fast.",
  },
  revise: [
    "Did I say if I used a push or a pull?",
    "Did I tell which way the thing moved?",
    "Did I say strong or gentle and how fast it went?",
    "Did I tell what I did first and what happened next?",
  ],
};
