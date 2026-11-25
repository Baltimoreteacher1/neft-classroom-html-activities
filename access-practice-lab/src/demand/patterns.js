// Authored data for the Language Demand Analyzer. Everything here is original to this lab: phrases teachers meet in
// real tasks, the everyday and the school meaning of words that carry both, and the supports each kind of task asks for.
// Pure data. The rules that use it are in analyze.js.

/** Idioms and figures of speech that appear in directions, word problems and readings. [phrase, plain meaning]. */
export const IDIOMS = [
  ["in the long run", "after a long time"],
  ["on the other hand", "looking at the opposite side"],
  ["break down", "split into smaller parts (or stop working)"],
  ["figure out", "work out an answer"],
  ["come up with", "think of an idea"],
  ["look into", "investigate"],
  ["make sense of", "understand"],
  ["carry out", "do or complete"],
  ["point out", "show or mention"],
  ["rule out", "decide it is not possible"],
  ["pick up", "learn or collect"],
  ["take into account", "think about as well"],
  ["keep track of", "keep a record of"],
  ["get rid of", "remove"],
  ["a piece of cake", "very easy"],
  ["a drop in the bucket", "a very small part"],
  ["hit the nail on the head", "say exactly the right thing"],
  ["once in a blue moon", "very rarely"],
  ["under the weather", "a little sick"],
  ["the tip of the iceberg", "only a small visible part"],
  ["back to square one", "starting again"],
  ["raining cats and dogs", "raining very hard"],
  ["spill the beans", "tell a secret"],
  ["cost an arm and a leg", "be very expensive"],
  ["bite the bullet", "do something hard that cannot be avoided"],
  ["call it a day", "stop working"],
  ["down to earth", "practical and honest"],
  ["on the same page", "in agreement"],
  ["in the same boat", "in the same situation"],
  ["a blessing in disguise", "something good that seemed bad at first"],
  ["the ball is in your court", "it is your turn to decide"],
  ["break the ice", "start a conversation"],
  ["cut corners", "do something the quick, careless way"],
  ["read between the lines", "find the meaning that is not stated"],
  ["sooner or later", "at some time in the future"],
  ["by and large", "mostly"],
  ["in a nutshell", "in a few words"],
  ["at the end of the day", "in the end"],
  ["go back and forth", "move between two places or ideas"],
  ["add up", "make sense (or total)"],
  ["work out", "solve (or exercise)"],
  ["turn out", "end up being"],
  ["set up", "prepare or arrange"],
  ["line up", "put in a row"],
  ["round off", "make a number simpler"],
  ["narrow down", "reduce the choices"],
  ["sum up", "say the main points shortly"],
  ["dig deeper", "look more closely"],
  ["wrap up", "finish"],
];

/** Words with a school meaning and an everyday meaning. [everyday, school]. A flag asks teachers to check, never says the word is wrong. */
export const MULTI_MEANING = {
  table: ["furniture", "rows and columns of data"],
  set: ["to put something down", "a group of things that belong together"],
  product: ["something you buy", "the answer to a multiplication"],
  power: ["strength or control", "an exponent, as in 2 to the power of 3"],
  root: [
    "the part of a plant under the ground",
    "a number that gives another when multiplied by itself",
  ],
  base: [
    "the bottom of something",
    "the number being multiplied in a power, or a shape's bottom side",
  ],
  figure: ["a person in a story", "a shape or a diagram"],
  plot: ["a secret plan", "the events of a story, or a graph's points"],
  scale: ["what a fish has", "a ratio between a drawing and the real thing"],
  mean: ["unkind, or to intend", "the average of a set of numbers"],
  volume: ["how loud a sound is", "how much space a solid takes up"],
  operation: ["a medical procedure", "adding, subtracting, multiplying or dividing"],
  solution: ["a liquid mixture", "the answer to a problem"],
  factor: ["something that matters in a decision", "a number that divides another exactly"],
  degree: ["a level of something", "a unit of angle or temperature"],
  mass: ["a big group of people", "the amount of matter in an object"],
  cell: ["a prison room or a phone", "the smallest living unit, or a box in a table"],
  order: ["to ask for food, or a command", "the sequence of things"],
  face: ["the front of your head", "a flat side of a solid"],
  edge: ["the side of something", "where two faces of a solid meet"],
  bank: ["where money is kept", "the land beside a river"],
  current: ["happening now", "the flow of water or electricity"],
  field: ["a grassy space", "an area of study, or a region of force"],
  matter: ["to be important", "anything that has mass and takes up space"],
  light: ["not heavy", "energy we see, or a source of it"],
  key: ["opens a lock", "the part of a map or graph that explains the symbols"],
  plane: ["a flying machine", "a flat surface that goes on forever"],
  range: ["a line of mountains, or a stove", "the distance between the smallest and largest value"],
  round: ["shaped like a circle", "to change a number to a nearby simpler one"],
  term: ["a part of the school year", "one part of an expression or a word with a defined meaning"],
  expression: ["a look on a face", "a math phrase with numbers and symbols but no equals sign"],
  rational: ["sensible", "a number that can be written as a fraction"],
  property: ["something you own", "a rule that is always true, or a characteristic of a material"],
  organ: ["a musical instrument", "a body part that does a job"],
  race: ["a contest of speed", "a group of people (an outdated idea) — check the context"],
  article: ["a thing, like an article of clothing", "a piece of nonfiction writing"],
  draft: ["a cold current of air", "a first version of writing"],
  conduct: ["behavior", "to carry out an investigation, or to let heat or electricity pass"],
  balance: ["to stay upright", "to make two sides equal"],
  form: ["a paper to fill in", "the way a number or shape is written or arranged"],
  state: ["to say", "one part of a country, or a form of matter"],
  run: ["to move fast", "to carry out a test"],
  chart: ["a map for ships", "a way to show data"],
};

/** Verbs that tell a student what to DO. A sentence with several of them in a row is a stack of directions. */
export const COMMAND_VERBS = new Set(
  `read underline circle highlight write rewrite explain describe compare contrast list identify solve draw label find use show
  complete discuss summarize summarise support justify predict calculate create choose match sort cite analyze analyse evaluate
  tell give name state decide record measure graph plot check revise edit share present answer respond notice look think
  organize organise sketch convert simplify estimate add subtract multiply divide cut fold color colour number order rank`.split(
    /\s+/,
  ),
);

/** What each task asks the student to do, found from its verbs and key words. First match order = priority order. */
export const PURPOSES = [
  {
    id: "compare",
    test: /\b(compare|contrast|similar|different|differences?|alike|both)\b/i,
    label: "Compare and contrast",
  },
  {
    id: "argue",
    test: /\b(argue|claim|convince|persuade|opinion|agree|disagree|support (?:your|a|the)|justify|defend|best solution)\b/i,
    label: "Argue with evidence",
  },
  {
    id: "explain",
    test: /\b(explain|why|how does|how do|because|cause|effect|result|reason|predict|solve)\b/i,
    label: "Explain how or why",
  },
  {
    id: "summarize",
    test: /\b(summari[sz]e|retell|main idea|central idea|in your own words|key points?)\b/i,
    label: "Summarize",
  },
  {
    id: "sequence",
    test: /\b(first|then|next|finally|steps?|process|sequence|order of|procedure)\b/i,
    label: "Tell or follow a sequence",
  },
  {
    id: "describe",
    test: /\b(describe|identify|define|list|label|name|tell about|characteristics?|features?)\b/i,
    label: "Describe or define",
  },
];

/** Sentence frames per purpose. `guided` = full frames, `supported` = a word bank, `independent` = what remains when support fades. */
export const FRAMES = {
  compare: {
    guided: [
      "___ and ___ are alike because both ___.",
      "___ is different from ___ because ___, but ___.",
      "One important difference is ___. This matters because ___.",
    ],
    supported: [
      "Word bank: both, also, alike, similar / however, but, unlike, whereas, on the other hand.",
    ],
    independent:
      "Ask for one alike and one different, using the word bank only. Then remove the bank.",
  },
  argue: {
    guided: [
      "I think ___ because ___.",
      "According to ___, ___. This shows that ___.",
      "Some people say ___. However, ___.",
    ],
    supported: ["Word bank: I think, because, for example, according to, this shows, however."],
    independent:
      "Give the claim and one piece of evidence aloud first. Then write with the word bank closed.",
  },
  explain: {
    guided: [
      "___ happens because ___.",
      "First ___. Next ___. As a result, ___.",
      "This works because ___.",
    ],
    supported: ["Word bank: because, so, as a result, leads to, therefore, first, next."],
    independent: "Have students tell a partner the chain of reasons before writing, with no frame.",
  },
  summarize: {
    guided: [
      "The text is mostly about ___.",
      "The most important ideas are ___ and ___.",
      "In short, ___.",
    ],
    supported: ["Word bank: mostly about, main idea, key detail, in short."],
    independent: "Ask for the main idea in one sentence from memory, then add two details.",
  },
  sequence: {
    guided: [
      "First, ___. Then, ___. Finally, ___.",
      "Before ___, we must ___.",
      "The last step is ___.",
    ],
    supported: ["Word bank: first, next, then, after that, finally, before, while."],
    independent:
      "Give the steps as pictures or objects in a row, then ask students to say them in order unaided.",
  },
  describe: {
    guided: [
      "___ is a ___ that ___.",
      "One feature of ___ is ___.",
      "You can recognize ___ because ___.",
    ],
    supported: ["Word bank: is a, is called, means, such as, one feature, looks like."],
    independent:
      "Show the picture or object and ask for two true sentences with the word bank closed.",
  },
};

/** A formative check for each purpose that asks the SAME thinking as the task, in less language. */
export const CHECKS = {
  compare: {
    ticket:
      "Name one way the two things are alike and one way they are different. Words, pictures or both.",
    oral: "Partner A names one likeness; Partner B names one difference; switch.",
  },
  argue: {
    ticket: "Write your claim and one piece of evidence that supports it.",
    oral: "Say your claim. Your partner asks 'What is your evidence?' and you answer.",
  },
  explain: {
    ticket: "Write or draw why it happens. Use 'because' at least once.",
    oral: "Tell your partner the reason in one or two sentences, then your partner repeats it back.",
  },
  summarize: {
    ticket: "Write the main idea in one sentence, then two details.",
    oral: "Give the main idea in ten words or fewer. Your partner adds a detail.",
  },
  sequence: {
    ticket: "Put the steps in order and say each one with a sequence word.",
    oral: "Say the steps in order while a partner points to the pictures.",
  },
  describe: {
    ticket: "Write two true sentences about it. Circle one new word you used.",
    oral: "Describe it so your partner can draw it without looking.",
  },
};

/** A visual support suggested when the task talks about this kind of thing. First match order, up to three shown. */
export const VISUALS = [
  {
    test: /\b(compare|contrast|alike|different|similar)\b/i,
    idea: "Venn diagram or two-column chart so the likenesses and differences are in view.",
  },
  {
    test: /\b(cause|effect|because|result|leads? to)\b/i,
    idea: "Cause–effect arrows: draw the cause, an arrow, then the effect, before any writing.",
  },
  {
    test: /\b(first|then|next|finally|steps?|process|sequence)\b/i,
    idea: "A numbered flow chart or step cards students can move into order.",
  },
  {
    test: /\b(graph|data|table|chart|percent|survey|results?)\b/i,
    idea: "The graph or table itself, with one labeled sentence read aloud before students answer.",
  },
  {
    test: /\b(map|region|north|south|east|west|located|border|continent)\b/i,
    idea: "An annotated map with the places in the task labeled.",
  },
  {
    test: /\b(parts?|diagram|structure|system|cycle|layers?|organs?)\b/i,
    idea: "A labeled diagram where students can point to each part as they read.",
  },
  {
    test: /\b(story|character|setting|plot|narrator|theme)\b/i,
    idea: "A story map: who, where, problem, key events, ending.",
  },
  {
    test: /\b(fraction|ratio|equation|expression|variable|area|perimeter|angle|volume|proportion)\b/i,
    idea: "A model of the mathematics: tape diagram, number line, or labeled sketch.",
  },
  {
    test: /\b(claim|evidence|argue|opinion|support)\b/i,
    idea: "A claim–evidence–reasoning organizer with the three boxes visible.",
  },
];

/** Plain notes shown with the results. These keep the tool honest. */
export const LIMITS = [
  "These flags come from fixed rules about sentence length, structure and word type. They estimate where language may get in the way. They are not a reading level for any student.",
  "The task is never rewritten. The academic goal stays yours; the supports change how students get to it.",
  "General language supports are not a district curriculum alignment. Check anything you plan to rely on against your adopted curriculum.",
  "Rules miss some things and flag some things that are fine. Each flag shows the exact words so you can decide.",
];

/** Where students can practice what the task asks, in tools the lab already has. [sitemap id, label EN, label ES]. */
export const PRACTICE = {
  compare: [["sentences", "Sentence Lab", "Laboratorio de oraciones"], ["speak", "Speaking Studio", "Estudio de habla"]],
  argue: [["arena", "Argument Arena", "Arena de argumentos"], ["evidence", "Evidence Builder", "Constructor de evidencia"]],
  explain: [["speak", "Speaking Studio", "Estudio de habla"], ["write", "Writing Studio", "Estudio de escritura"]],
  summarize: [["write", "Writing Studio", "Estudio de escritura"], ["sentences", "Sentence Lab", "Laboratorio de oraciones"]],
  sequence: [["write", "Writing Studio", "Estudio de escritura"], ["speak", "Speaking Studio", "Estudio de habla"]],
  describe: [["wordlab", "Word Lab", "Laboratorio de palabras"], ["speak", "Speaking Studio", "Estudio de habla"]],
};
export const WORDS_PRACTICE = ["wordlab", "Word Lab", "Laboratorio de palabras"];
