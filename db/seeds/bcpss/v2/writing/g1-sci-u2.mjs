// BCPSS Writing Lab (TWR) — g1-sci-u2 · Animal & Plant Parts for Survival. Contract: ../writing-schema.mjs

export default {
  title: "Parts With Jobs",
  genre: "inform",
  tip: "Have students point to a part on a picture and say the sentence frame 'A ___ is a part of a ___' before they add its job.",
  lessons: [
    { id: "A", title: "Animal parts: structures" },
    { id: "B", title: "What parts do: functions" },
    { id: "C", title: "Parents and offspring" },
    { id: "D", title: "Plant parts and their jobs" },
  ],
  source: {
    title: "The Diamondback Terrapin",
    lesson: "A",
    text: "A diamondback terrapin lives near the Chesapeake Bay. It has a hard shell. The shell protects its soft body. The job of the shell is to protect. It also has webbed feet. The feet help it swim. A shell is not a foot. A baby terrapin is an offspring. It looks like its parent.",
  },
  notes: [
    { sentence: "The shell protects its soft body.", note: "shell → protects body" },
    { sentence: "The feet help it swim.", note: "webbed feet → swim" },
    { sentence: "A shell is not a foot.", note: "shell ≠ foot" },
    { sentence: "A baby terrapin is an offspring.", note: "baby = offspring" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A shell is a part of a terrapin",
      because: "the shell protects the soft body.",
      but: "a shell is not a foot.",
      so: "each part has its own job.",
    },
    {
      lesson: "B",
      kernel: "The terrapin has webbed feet",
      because: "webbed feet push against the water.",
      but: "they do not protect its body.",
      so: "it can swim in the bay.",
    },
    {
      lesson: "C",
      kernel: "A baby terrapin is an offspring",
      because: "it comes from a parent terrapin.",
      but: "it is much smaller than its parent.",
      so: "it needs time to grow.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The terrapin swims.",
      parts: { when: "in warm weather", where: "in the Chesapeake Bay", how: "with webbed feet" },
      model: "In warm weather, the terrapin swims in the Chesapeake Bay with webbed feet.",
    },
    {
      lesson: "A",
      kernel: "The shell protects.",
      parts: { what: "the soft body", when: "all day", why: "from danger" },
      model: "All day, the shell protects the soft body from danger.",
    },
  ],
  fragments: [
    { text: "The shell protects the body.", is_sentence: true },
    { text: "Part of a turtle.", is_sentence: false, fix: "A shell is part of a turtle." },
    { text: "The feet help it swim.", is_sentence: true },
    { text: "Because the shell is hard.", is_sentence: false, fix: "The shell protects the terrapin because the shell is hard." },
    { text: "A baby plant or animal.", is_sentence: false, fix: "An offspring is a baby plant or animal." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The terrapin, ___, lives near the Chesapeake Bay.",
      noun: "The terrapin",
      options: ["a turtle with a hard shell", "a baby plant", "the job a part does"],
      answer: 0,
      model: "The terrapin, a turtle with a hard shell, lives near the Chesapeake Bay.",
    },
    {
      lesson: "B",
      sentence: "A function, ___, tells what a part does.",
      noun: "A function",
      options: ["a baby animal", "the job a part does", "a hard cover on an animal's body"],
      answer: 1,
      model: "A function, the job a part does, tells what a part does.",
    },
    {
      lesson: "D",
      sentence: "A root, ___, holds a plant in the soil.",
      noun: "A root",
      options: ["a hard cover on an animal", "a baby plant", "the part of a plant that grows in the soil"],
      answer: 2,
      model: "A root, the part of a plant that grows in the soil, holds a plant in the soil.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the terrapin is safe", model: "Because its shell is hard, the terrapin is safe." },
    { lesson: "B", conjunction: "when", stem: "the terrapin swims", model: "When it kicks its webbed feet, the terrapin swims." },
    { lesson: "C", conjunction: "although", stem: "a baby terrapin looks like its parent", model: "Although it is smaller, a baby terrapin looks like its parent." },
  ],
  spo: {
    topic: {
      l1_2: "A [shell] is a part of a [terrapin].",
      l3_4: "A [shell] is a part of a [terrapin]. The job of a [shell] is to [protect].",
      l5_6: "Although [a terrapin has many parts], a [shell] is a part that [protects its soft body], whereas [webbed feet] are parts that [help it swim].",
    },
    starters: [
      { type: "question", text: "What parts help a terrapin stay alive?" },
      { type: "statement", text: "A terrapin has parts with special jobs." },
      { type: "appositive", text: "The diamondback terrapin, a turtle of the Chesapeake Bay, has a hard shell." },
    ],
    details: [
      { note: "shell = part, protects body", lesson: "A" },
      { note: "webbed feet → swim", lesson: "B" },
      { note: "shell ≠ foot", lesson: "A" },
      { note: "job = function", lesson: "B" },
      { note: "baby = offspring", lesson: "C" },
      { note: "plants too: roots hold soil", lesson: "D" },
    ],
    distractors: ["the bay has blue crabs", "terrapins are green"],
    conclusion: {
      l1_2: "So every [part] has a [job].",
      l3_4: "So the [shell] and the [feet] each have a [job].",
      l5_6: "Because [each part has its own function], a [terrapin] can [survive in the bay].",
    },
  },
  prompt: {
    l1_2: "Draw a part of an animal. Write 1-3 sentences. Tell what it is and what job it does.",
    l3_4: "Pick a part of an animal. Write what it is, what job it does, and what it is not.",
    l5_6: "Describe two parts of an animal and tell what each one does. Include an appositive and a sentence that starts with although, because, or when.",
  },
  transitions: ["First,", "Also,", "For example,", "But", "Because", "So", "In addition,", "In the end,"],
  model: {
    l1_2: "A shell is a part of a terrapin. The shell protects its body.",
    l3_4: "A shell is a part of a terrapin. The job of a shell is to protect the soft body. A shell is not a foot. The feet help the terrapin swim.",
    l5_6: "Although a terrapin has many parts, its hard shell is a structure that protects its soft body. The diamondback terrapin, a turtle of the Chesapeake Bay, also has webbed feet. A foot is not a shell, so the feet have a different job. Because the feet help it swim, the terrapin can find food in the bay. Each part has a function.",
  },
  revise: [
    "Did I name the part and the animal?",
    "Did I tell the job of the part?",
    "Did I tell what the part is not?",
    "Did I use structure or function the right way?",
  ],
};
