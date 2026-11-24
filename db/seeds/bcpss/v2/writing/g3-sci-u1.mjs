// BCPSS Writing Lab (TWR) — g3-sci-u1 · Balanced & Unbalanced Forces. Contract: ../writing-schema.mjs

export default {
  title: "Why the Wagon Rolls and Stops",
  genre: "explain",
  tip: "Have students act out the push, the roll, and the stop with a real toy first, then name each force before they write.",
  lessons: [
    { id: "A", title: "Balanced and unbalanced forces" },
    { id: "B", title: "Friction slows motion" },
    { id: "C", title: "Magnets attract and repel" },
    { id: "D", title: "Predicting an object's future motion" },
  ],
  source: {
    title: "A Wagon at Druid Hill Park",
    lesson: "A",
    text: "Marcus pushes a wagon across the grass at Druid Hill Park. At first, the wagon sits still because the forces on it are balanced. Marcus pushes hard. Now the push is stronger than friction, so the forces are unbalanced and the wagon rolls. On the smooth path, there is less friction, so it rolls farther. When Marcus lets go, friction slows the wagon, and it stops. A steel toy rides in the wagon. When Marcus holds a magnet near it, the toy slides toward the magnet.",
  },
  notes: [
    { sentence: "At first, the wagon sits still because the forces on it are balanced.", note: "wagon still → forces balanced" },
    { sentence: "Now the push is stronger than friction, so the forces are unbalanced and the wagon rolls.", note: "push > friction → unbalanced → rolls" },
    { sentence: "On the smooth path, there is less friction, so it rolls farther.", note: "smooth path → less friction → farther" },
    { sentence: "When Marcus holds a magnet near it, the toy slides toward the magnet.", note: "magnet near → steel toy slides to it" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The wagon starts to roll",
      because: "Marcus pushes it harder than friction pulls back.",
      but: "friction slows it down after he lets go.",
      so: "it moves across the grass toward the path.",
    },
    {
      lesson: "B",
      kernel: "The wagon rolls farther on the smooth path",
      because: "there is less friction on the smooth path.",
      but: "it still slows down when Marcus lets go.",
      so: "a wagon on the grass will stop sooner.",
    },
    {
      lesson: "C",
      kernel: "The magnet pulls the steel toy",
      because: "magnets attract steel.",
      but: "it does not pull a plastic block.",
      so: "the toy slides toward the magnet without being touched.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The wagon stopped.",
      parts: { when: "after Marcus let go", where: "on the grassy hill", how: "little by little", why: "because friction pushed against it" },
      model: "After Marcus let go, the wagon stopped little by little on the grassy hill because friction pushed against it.",
    },
    {
      lesson: "C",
      kernel: "The magnet pulled the toy.",
      parts: { when: "a moment later", where: "across the wagon", how: "without touching it", why: "because the toy was made of steel" },
      model: "A moment later, the magnet pulled the toy across the wagon without touching it because the toy was made of steel.",
    },
  ],
  fragments: [
    { text: "The forces on the wagon are balanced.", is_sentence: true },
    { text: "Because there is less friction.", is_sentence: false, fix: "The wagon rolls farther because there is less friction." },
    { text: "Friction slows the wagon down.", is_sentence: true },
    { text: "Pulls the steel toy closer.", is_sentence: false, fix: "The magnet pulls the steel toy closer." },
    { text: "When the push is stronger than friction.", is_sentence: false, fix: "The wagon rolls when the push is stronger than friction." },
    { text: "A magnet can attract steel without touching it.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Friction, ___, slows the wagon when Marcus lets go.",
      noun: "Friction",
      options: ["an object that pulls on iron and steel", "a push or a pull on an object", "a force that slows things that rub together"],
      answer: 2,
      model: "Friction, a force that slows things that rub together, slows the wagon when Marcus lets go.",
    },
    {
      lesson: "C",
      sentence: "A magnet, ___, can attract a steel toy.",
      noun: "magnet",
      options: ["an object that pulls on iron and steel without touching them", "a force that slows things that rub together", "equal pushes from opposite sides"],
      answer: 0,
      model: "A magnet, an object that pulls on iron and steel without touching them, can attract a steel toy.",
    },
    {
      lesson: "A",
      sentence: "Balanced forces, ___, keep the wagon still.",
      noun: "Balanced forces",
      options: ["pushes or pulls that are not equal", "equal pushes or pulls from opposite sides", "a guess about what will happen next"],
      answer: 1,
      model: "Balanced forces, equal pushes or pulls from opposite sides, keep the wagon still.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the wagon rolls", model: "Because Marcus pushes harder than friction pulls back, the wagon rolls." },
    { lesson: "B", conjunction: "when", stem: "friction slows the wagon", model: "When Marcus lets go, friction slows the wagon." },
    { lesson: "D", conjunction: "if", stem: "Marcus can predict where the wagon will stop", model: "If he knows how much friction the path has, Marcus can predict where the wagon will stop." },
  ],
  spo: {
    topic: {
      l1_2: "The [wagon] [rolls and stops] because of [forces].",
      l3_4: "Marcus's wagon rolls because the forces on it are [unbalanced], and it stops because of [friction].",
      l5_6: "Although [Marcus's push] makes the wagon roll, [friction, a force that slows things that rub together,] causes it to [stop].",
    },
    starters: [
      { type: "question", text: "Why does a wagon stop rolling when nobody pushes it?" },
      { type: "appositive", text: "Friction, a force that slows things that rub together, stops the wagon." },
      { type: "subordinate", text: "When Marcus pushes harder than friction, the forces become unbalanced." },
    ],
    details: [
      { note: "wagon still → forces balanced", lesson: "A" },
      { note: "push > friction → unbalanced → rolls", lesson: "A" },
      { note: "smooth path → less friction → farther", lesson: "B" },
      { note: "lets go → friction slows wagon", lesson: "B" },
      { note: "wagon stops → forces balanced again", lesson: "D" },
      { note: "more friction → stops sooner", lesson: "D" },
    ],
    distractors: ["the wagon is red", "magnets have north and south ends"],
    conclusion: {
      l1_2: "Friction makes the wagon [stop].",
      l3_4: "As a result, the wagon [stops] because [friction slows it down].",
      l5_6: "As a result, [the unbalanced push started the wagon and friction ended its trip], which means [Marcus can predict where it will stop].",
    },
  },
  prompt: {
    l1_2: "Draw the wagon and Marcus. Write 2-3 sentences. Tell why the wagon rolls and why it stops.",
    l3_4: "Explain why the wagon rolls and then stops. Use because, so, and as a result. Name the forces.",
    l5_6: "Explain the whole trip of the wagon, from sitting still to stopping. Include an appositive, a sentence that starts with because or when, and a prediction.",
  },
  transitions: ["First,", "Next,", "Because", "So", "When", "As a result,", "This causes", "Finally,"],
  model: {
    l1_2: "Marcus pushes the wagon. The forces are unbalanced, so it rolls. Friction makes it stop.",
    l3_4: "At first, the wagon sits still because the forces on it are balanced. Marcus pushes hard, so the push is stronger than friction. The forces are unbalanced, and the wagon rolls. When Marcus lets go, friction slows the wagon. As a result, it stops.",
    l5_6: "Although the wagon sits still at first, a hard push changes its motion. Because Marcus pushes harder than friction pulls back, the forces are unbalanced and the wagon rolls. On the smooth path, there is less friction, so the wagon rolls farther. When Marcus lets go, friction, a force that slows things that rub together, slows the wagon. As a result, the wagon stops. Marcus can predict that it will stop sooner on the grass.",
  },
  revise: [
    "Did I tell the cause first and then the effect?",
    "Did I say whether the forces were balanced or unbalanced?",
    "Did I explain what friction does to the wagon?",
    "Did I use because, so, or as a result at least once?",
  ],
};
