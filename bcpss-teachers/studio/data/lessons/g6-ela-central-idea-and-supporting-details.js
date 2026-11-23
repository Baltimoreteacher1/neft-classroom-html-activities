// Lesson pack: Central Idea and Supporting Details (grade 6 ELA). Original texts, items and answers.
const rect = (x, y, w, h, fill = "paper", stroke = "navy") => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 10,
  fill,
  stroke,
  sw: 2.5,
});
const txt = (x, y, text, size = 14) => ({
  t: "text",
  x,
  y,
  text,
  size,
  fill: "ink",
  weight: 700,
  anchor: "middle",
});
const box = (x, y, w, h, text, fill = "paper", size = 14) => [
  rect(x, y, w, h, fill),
  txt(x + w / 2, y + h / 2, text, size),
];
const line = (x1, y1, x2, y2) => ({ t: "line", x1, y1, x2, y2, stroke: "ink", strokeWidth: 2.5 });
const up = (x, y) => ({
  t: "poly",
  fill: "ink",
  points: [
    [x, y],
    [x - 7, y + 12],
    [x + 7, y + 12],
  ],
});
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const GARDEN =
  "Text: The school garden began as an empty strip of dirt behind the gym. Students planted tomatoes, beans and herbs. The cafeteria now serves the vegetables the students grow. Younger classes visit to learn how plants grow, and science classes record rainfall and plant height each week. In many ways, the garden has become a classroom without walls.";
const LIBRARY =
  "Text: A town library now lends more than books. Visitors can borrow garden tools, board games and even musical instruments. Others come for free classes in computer skills and languages. On Saturdays the reading room becomes a meeting place for neighbors. Library staff say the building has become the center of the neighborhood.";
const BUS =
  "Text: In a walking school bus, a group of children walks to school together along a set route, led by one or two adults. The group picks up more children at planned stops. Parents say the walk gives students exercise before class, and teachers report that walkers arrive awake and ready to learn. Fewer cars line up outside the school each morning, so the street is safer. Some families like the plan because neighbors get to know one another.";
const SLEEP =
  "Text: During sleep, the body repairs itself and the brain sorts what it learned during the day. Students who sleep too little often struggle to pay attention. They may also feel more irritable and forget what they studied. Doctors therefore recommend regular bedtimes on school nights.";

const pyramid = (alt, top, details, hot = -1) => ({
  kind: "shapes",
  alt,
  w: 480,
  h: 250,
  items: [
    box(40, 10, 400, 62, top, "teal-soft", 14),
    ...details.map((d, i) => [
      box(20 + i * 154, 140, 132, 84, d, i === hot ? "copper-soft" : "paper", 13),
      line(86 + i * 154, 140, 240 + (86 + i * 154 - 240) * 0.35, 76),
      up(240 + (86 + i * 154 - 240) * 0.35, 74),
    ]),
  ].flat(Infinity),
});

const launchVisual = {
  kind: "scene",
  bg: "sky",
  w: 480,
  h: 260,
  alt: "Two city blocks side by side. Block A on the left has houses, a car and a bright sun with no trees. Block B on the right has two trees and a bus.",
  longDesc:
    "Block A has two houses and a car under a large sun and no trees. Block B has two trees and a bus under the same sun.",
  items: [
    { icon: "sun", x: 200, y: 8, s: 60 },
    { icon: "house", x: 20, y: 150, s: 66 },
    { icon: "house", x: 96, y: 150, s: 66 },
    { icon: "car", x: 160, y: 164, s: 52 },
    { icon: "tree", x: 262, y: 138, s: 72 },
    { icon: "tree", x: 332, y: 138, s: 72 },
    { icon: "bus", x: 404, y: 156, s: 60 },
    {
      t: "text",
      x: 110,
      y: 240,
      text: "Block A",
      size: 15,
      fill: "ink",
      weight: 700,
      anchor: "middle",
    },
    {
      t: "text",
      x: 350,
      y: 240,
      text: "Block B",
      size: 15,
      fill: "ink",
      weight: 700,
      anchor: "middle",
    },
  ],
};

// Move each right choice to a varied position so the answer is not always first (answer index is updated).
const POS = [1, 2, 0, 3, 2, 1, 0];
const spreadItems = (items, offset = 0) =>
  items.forEach((it, i) => {
    if (!it.choices) return;
    const right = it.choices[it.answer];
    const rest = it.choices.filter((_, j) => j !== it.answer);
    const pos = POS[(i + offset) % POS.length] % (rest.length + 1);
    rest.splice(pos, 0, right);
    it.choices = rest;
    it.answer = pos;
  });
const spread = (d) => {
  spreadItems(d.guided, 0);
  spreadItems(d.independent.items, 1);
  spreadItems(d.formative.items, 2);
  spreadItems(d.exitTicket.items, 4);
  return d;
};

const DATA = {
  id: "g6-ela-central-idea-and-supporting-details",
  kind: "lesson",
  title: "Central Idea and Supporting Details",
  subtitle:
    "Separate the topic, the central idea and the details that prove it in informational text",
  grade: "6",
  band: "6-8",
  subject: "ela",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.6.2, RI.6.1 and RL.6.2; not mapped to a district unit sequence. All texts, items and pictures are original.",
  },
  standards: ["RI.6.1", "RI.6.2", "RL.6.2"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Explain", "Inform"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "6-8",
  },
  contentObjective:
    "I can determine the central idea of an informational text and explain how particular details support it.",
  languageObjective:
    "I can explain a central idea by saying 'The central idea is that ___ because the author ___' and connect a detail to it with 'This shows ___ because ___'.",
  languageDemands: {
    functions: [
      "identify the central idea",
      "support a claim with a detail",
      "distinguish a summary from an opinion",
    ],
    structures: [
      "The central idea is that ___ because the author explains ___.",
      "One detail that supports this is ___. This shows ___ because ___.",
      "So you are saying that ___, is that right?",
    ],
    discourse:
      "Two-turn partner explanation (idea, then proof), followed by a written three-sentence objective summary.",
    barriers: [
      "'topic', 'main idea', 'central idea' and 'theme' overlap in everyday talk but name different things in class",
      "'detail' names any small piece of information, while 'evidence' is a detail used to prove a point",
      "'support' means both 'hold up' and 'prove', which confuses 'supporting detail'",
      "signal words such as however, even so, first and second change how a sentence connects to the idea",
      "'convey' and 'infer' are academic verbs that students rarely hear outside school",
    ],
    oralRehearse: [
      "The central idea is that street trees cool a city block because the author explains several ways they help.",
      "This detail shows that the garden is also a classroom because science classes record data there.",
    ],
    writeScaffold:
      "The text is about ___. The central idea is that ___. One detail that supports it is ___, which shows ___.",
  },
  vocab: {
    collection: "g6-ela-central-idea-and-supporting-details",
    ids: [
      "topic",
      "central-idea",
      "supporting-detail",
      "evidence",
      "summary",
      "paraphrase",
      "objective",
      "opinion",
      "infer",
      "convey",
    ],
  },
  launch: {
    title: "Notice and Wonder: two blocks, one hot afternoon",
    visual: launchVisual,
    prompts: [
      "What do you notice about Block A and Block B?",
      "What do you wonder about the two blocks on a hot afternoon?",
      "If a writer described Block B, what is the one idea the whole description would be building toward?",
    ],
    teacherNote:
      "Show the picture without the text. Take two noticings (the trees, the bus stop) and one wondering, then ask what the writer of a paragraph about Block B would want readers to understand. Record the first idea on the board without correcting it; students will test it against the passage later. Point out that 'trees' is the subject of the picture, while an idea such as 'trees make a block more comfortable' says something about it.",
  },
  teach: {
    model: [
      "A text has a topic and a central idea. The topic is the subject, in a word or short phrase: school gardens. The central idea is the most important point the author makes about that topic, in a full sentence: the school garden has become a place where students grow food and learn.",
      "Supporting details are the facts, examples and reasons that explain or prove the central idea. In the garden text, the cafeteria serving the vegetables proves that students grow real food, and science classes recording rainfall proves that the garden is also a place to learn.",
      "To find a central idea, ask what every paragraph is helping to explain. A sentence that only covers one paragraph, such as 'Students planted tomatoes, beans and herbs,' is a detail. A sentence that holds the details together is a candidate for the central idea. Test it: could every detail be read as support for it?",
      "A summary states the central idea and two or three key details in your own words. It is objective, so it leaves out your opinion. 'The garden is the best thing about the school' is an opinion; 'Students grow vegetables that the cafeteria serves, and classes use the garden to learn' is part of a summary.",
      "Sometimes the central idea is not stated and you must infer it. Combine clues from the text with what you already know, and check that the text supports your inference. In a story, the same process finds a theme: a message about life that the events and choices show.",
    ],
    moves: [
      "Always separate the three questions on the board: What is it about (topic)? What does the author say about it (central idea)? What proves it (details)?",
      "Model a think-aloud with the garden text: cross out a candidate idea and say which paragraph it fails to cover.",
      "Teach the test 'could every detail be read as support for this?' and have students say it aloud before they decide.",
      "Give students signal-word cards (first, however, even so, for example) and have them mark where a detail begins or an idea turns.",
      "Require students to say or write 'because' or 'this shows' when they connect a detail to the idea. A detail with no connection is not yet evidence.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: `${GARDEN}\n\nWhich choice names the TOPIC of the text?`,
      choices: [
        "The school garden",
        "The school garden has become a classroom without walls",
        "Students planted tomatoes, beans and herbs",
        "The cafeteria serves vegetables",
      ],
      answer: 0,
      hint: "The topic is a short phrase that names the subject. It does not make a claim about it.",
      supports: {
        ee: {
          frames: ["The text is about ___."],
          wordBank: ["topic", "subject", "garden"],
          oral: "Say the subject in two or three words.",
        },
        dev: {
          frames: ["The topic is a short phrase that names ___."],
          wordBank: ["phrase", "subject"],
        },
        exp: { frames: ["The topic is ___, whereas the central idea says ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Which choice states the CENTRAL IDEA of the garden text?",
      choices: [
        "A garden at a school",
        "Students planted tomatoes, beans and herbs.",
        "The school garden has grown from an empty strip into a place where students grow food and learn.",
        "Science classes record rainfall each week.",
      ],
      answer: 2,
      hint: "A central idea is a full sentence broad enough that every detail in the text could support it.",
      supports: {
        ee: {
          frames: ["The central idea says what the garden ___ and ___."],
          wordBank: ["grow", "learn", "whole text"],
        },
        dev: {
          frames: ["I chose this because it covers ___ and ___."],
          wordBank: ["covers", "all the details"],
        },
        exp: { frames: ["The other choices are too ___ because they cover only ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt:
        "Name two details from the garden text that support the central idea. Say what each detail shows.",
      answer:
        "Students plant vegetables and the cafeteria serves them, which shows the garden grows real food. Younger classes visit and science classes record rainfall, which shows students learn in the garden.",
      hint: "Look for one detail about food and one detail about learning. Use the word shows to connect each one to the idea.",
      supports: {
        ee: {
          frames: ["One detail is ___. It shows ___."],
          wordBank: ["cafeteria", "classes", "shows"],
        },
        dev: {
          frames: ["One detail is ___, which shows ___. Another detail is ___, which shows ___."],
          wordBank: ["shows", "proves"],
        },
        exp: {
          frames: [
            "The detail that ___ demonstrates ___, and the detail that ___ demonstrates ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Which sentence belongs in an objective summary of the garden text?",
      choices: [
        "The garden is the best thing at the school.",
        "Students grow vegetables that the cafeteria serves, and classes use the garden to learn.",
        "I wish my school had a garden.",
        "Gardens are more fun than gyms.",
      ],
      answer: 1,
      hint: "An objective summary reports what the text says. It leaves out feelings and judgments.",
      supports: {
        ee: {
          frames: ["The summary tells what the ___ says, not what I ___."],
          wordBank: ["opinion", "text", "feel"],
        },
        dev: {
          frames: ["This sentence is objective because it ___."],
          wordBank: ["objective", "opinion"],
        },
        exp: { frames: ["The other choices are opinions because they ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Detail detectives: one text, two jobs",
    task: `Partners read this text together.\n\n${LIBRARY}\n\nPartner A names the topic and writes the central idea in one sentence. Partner B finds two details and writes how each one supports the idea, using 'this shows'. Swap papers. The partner who did not write a piece checks it with the test: could every detail in the text be read as support for this idea? If not, they suggest a bigger idea instead of saying 'wrong'.`,
    roles: ["Idea writer", "Detail finder"],
    discussionCards: [
      {
        prompt: "Did your idea cover the whole text or only one sentence?",
        frame: "My idea covers ___, so it works because ___.",
      },
      {
        prompt: "Which detail was the strongest proof, and why?",
        frame: "The strongest detail is ___ because it shows ___.",
      },
      {
        prompt: "How would your partner's idea change if the text had only the last two sentences?",
        frame: "If only ___ was included, the idea would be ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: how details point to one idea",
      visualOrModel: pyramid(
        "A wide box at the top says the school garden has become a place where students grow food and learn. Three detail boxes below, about vegetables, the cafeteria and classes, each have an arrow pointing up to it.",
        "The school garden is a place where\nstudents grow food and learn.",
        [
          "Students plant\nvegetables",
          "The cafeteria\nserves them",
          "Classes record\nrain and growth",
        ],
        2,
      ),
      teacherNote:
        "Ask students to point to the arrow from the highlighted detail and say which half of the idea it supports (learning). Then ask which detail supports growing food. Finally have them draw a fourth detail box for a detail the text does not have and decide whether it would support the same idea.",
    },
    discuss: {
      title: "Say it: idea, proof, connection",
      structure:
        "Turn and talk. Partner 1 states a central idea. Partner 2 asks 'What in the text shows that?' Partner 1 gives a detail and connects it with 'this shows'. Partner 2 restates the idea in new words. Swap.",
      frames: [
        "The central idea is that ___.",
        "What in the text shows that?",
        "One detail is ___. This shows ___ because ___.",
        "So you are saying that ___, is that right?",
      ],
    },
    apply: {
      title: "Use it: write an objective summary",
      task: "Choose the library text or the walking school bus text. Write a three-sentence objective summary: sentence 1 names the topic and central idea, sentences 2 and 3 each give one key detail in your own words. Do not include your opinion.",
      successCriteria: [
        "My first sentence states a central idea that covers the whole text, not one detail.",
        "Each of my two details comes from the text and is in my own words.",
        "My summary has no opinion words such as best, boring or I think.",
        "I used because, so or this shows at least once to connect a detail to the idea.",
      ],
    },
  },
  activities: [
    { engine: "language-detective", id: "g6-ela-central-idea-detective" },
    { engine: "concept-builder", id: "g6-ela-detail-to-idea-sort" },
    { engine: "conversation-studio", id: "g6-ela-central-idea-conversation" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: `${BUS}\n\nWhich choice states the central idea?`,
        choices: [
          "Children walk to school.",
          "A walking school bus gives children exercise, helps them arrive ready to learn and makes the school street safer and friendlier.",
          "Teachers say walkers arrive awake.",
          "Some adults lead the group along a route.",
        ],
        answer: 1,
        explain:
          "It is the only choice that covers exercise, readiness to learn, safety and neighbors. The others name the topic or a single detail.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          "Which detail best supports the idea that a walking school bus makes the school street safer?",
        choices: [
          "The group picks up more children at planned stops.",
          "Fewer cars line up outside the school each morning.",
          "Parents say the walk gives students exercise.",
          "Neighbors get to know one another.",
        ],
        answer: 1,
        explain:
          "Fewer cars outside the school directly connects to safety on the street. The other details support different parts of the idea.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which sentence belongs in an objective summary of the walking school bus text?",
        choices: [
          "Walking to school is the best way to start the day.",
          "A walking school bus lets children walk to school in a group, which gives them exercise and keeps cars away from the school.",
          "Everyone should join a walking school bus right now.",
          "I would be too tired to walk that far.",
        ],
        answer: 1,
        explain:
          "It reports what the text says. The other choices state opinions or recommendations that the text does not make.",
      },
      {
        id: "i4",
        type: "short",
        prompt:
          "Write the central idea of the walking school bus text in one sentence that covers at least two of its details.",
        answer:
          "A walking school bus helps children in several ways, such as giving them exercise, preparing them to learn and making the school street safer.",
        explain:
          "Any sentence that covers at least two details and says something about the walking school bus is acceptable. A phrase naming only the topic is not.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "Teachers report that walkers arrive awake and ready to learn. Which inference does the text support?",
        choices: [
          "Exercise before class may help students focus.",
          "Students who ride in cars always fall asleep.",
          "Teachers dislike students who ride the bus.",
          "Walking is the only way to get to school.",
        ],
        answer: 0,
        explain:
          "The text links exercise before class with arriving ready to learn. The other choices claim things the text never says.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "A student writes: 'The central idea is walking.' Explain why this is a topic and not a central idea, then rewrite it as a central idea.",
        answer:
          "It names the subject but does not say what the author tells us about it. A central idea is: a walking school bus helps children and their neighborhood in several ways.",
        explain:
          "A central idea is a full sentence that says something about the topic. Walking is only the subject.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: `${LIBRARY}\n\nWhich choice states the central idea?`,
        choices: [
          "The town library lends garden tools.",
          "A town library can offer much more than books and has become a center for the neighborhood.",
          "Libraries have a reading room.",
          "Saturday is a busy day.",
        ],
        answer: 1,
        explain:
          "It covers the tools, games, instruments, classes and meetings. The others are single details.",
      },
      {
        id: "f2",
        type: "choice",
        prompt:
          "Which detail from the library text best supports the idea that it has become a center for the neighborhood?",
        choices: [
          "Visitors can borrow board games.",
          "On Saturdays the reading room becomes a meeting place for neighbors.",
          "Others come for free classes.",
          "The library lends garden tools.",
        ],
        answer: 1,
        explain:
          "A meeting place for neighbors is the detail most directly about a neighborhood center.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "Explain in one sentence how the detail about free classes supports the central idea of the library text. Use 'this shows'.",
        answer:
          "Free classes in computer skills and languages show that the library offers more than books, which supports the idea that it serves the whole neighborhood.",
        explain:
          "Look for a connection that links the detail to the idea, not just a copy of the detail.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show that you can find an idea, prove it and keep your opinion out of a summary.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: `${SLEEP}\n\nWhich choice states the central idea?`,
        choices: [
          "The brain sorts what it learned.",
          "Sleep matters for students because it helps the body and brain work well.",
          "Some students feel irritable.",
          "Doctors recommend bedtimes.",
        ],
        answer: 1,
        explain:
          "It covers repair, learning, attention and mood. The other choices are single details.",
      },
      {
        id: "e2",
        type: "short",
        prompt:
          "Write one detail from the sleep text and explain how it supports the central idea.",
        answer:
          "Students who sleep too little struggle to pay attention, which shows that sleep affects how well they learn.",
        explain:
          "Any accurate detail from the text connected to the idea with a reason is acceptable.",
      },
      {
        id: "e3",
        type: "choice",
        prompt: "Which sentence would you leave out of an objective summary of the sleep text?",
        choices: [
          "Sleep helps the body repair itself.",
          "Students who sleep too little may forget what they studied.",
          "Sleeping is boring, so I do not like it.",
          "Doctors recommend regular bedtimes on school nights.",
        ],
        answer: 2,
        explain: "It is the writer's opinion. The other sentences report what the text says.",
      },
    ],
    successCriteria: [
      "I chose a central idea that covers the whole text.",
      "I connected a detail to the idea with because, so or this shows.",
      "I left my opinion out of the summary.",
    ],
  },
  answerKey: {
    notes:
      "For short responses look for a central idea stated as a full sentence that covers more than one detail, details taken from the text and a connection word such as shows or because. Accept any accurate wording. A phrase that only names the subject is a topic, not a central idea.",
    items: {
      g1: "The school garden. It names the subject without making a claim.",
      g2: "The school garden has grown from an empty strip into a place where students grow food and learn.",
      g3: "Sample: Students plant vegetables and the cafeteria serves them, which shows the garden grows real food. Science classes record rainfall, which shows students learn there.",
      g4: "Students grow vegetables that the cafeteria serves, and classes use the garden to learn.",
      i1: "The choice that covers exercise, readiness to learn, safety and neighbors.",
      i2: "Fewer cars line up outside the school each morning.",
      i3: "A walking school bus lets children walk to school in a group, which gives them exercise and keeps cars away from the school.",
      i4: "Sample: A walking school bus helps children in several ways, such as giving them exercise, preparing them to learn and making the school street safer.",
      i5: "Exercise before class may help students focus.",
      i6: "Walking is only the subject. Sample central idea: a walking school bus helps children and their neighborhood in several ways.",
      f1: "A town library can offer much more than books and has become a center for the neighborhood.",
      f2: "On Saturdays the reading room becomes a meeting place for neighbors.",
      f3: "Sample: Free classes show the library offers more than books, which supports the idea that it serves the whole neighborhood.",
      e1: "Sleep matters for students because it helps the body and brain work well.",
      e2: "Sample: Students who sleep too little struggle to pay attention, which shows that sleep affects learning.",
      e3: "Sleeping is boring, so I do not like it.",
    },
  },
  extension: {
    title: "Two texts, one topic",
    task: "Find two short informational texts on the same topic, such as a news article and a textbook paragraph. Write the central idea of each in one sentence. Then write two sentences comparing them: Is the central idea the same? Which details does each text choose, and what do those choices reveal about the author's purpose?",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo encontrar la idea central de un texto informativo y explicar cómo los detalles la apoyan.",
      vocab: [
        { en: "topic", es: "tema", verified: false },
        { en: "central idea", es: "idea central", verified: false },
        { en: "supporting detail", es: "detalle de apoyo", verified: false },
        { en: "summary", es: "resumen", verified: false },
        { en: "evidence", es: "evidencia", verified: false },
      ],
      familyPrompt:
        "Lean juntos un artículo corto. Digan de qué trata (el tema) y luego, en una oración, qué quiere que entendamos el autor. Busquen dos detalles que lo apoyen.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Partner task or activities 20 (language detective first, then the ranking activity; the conversation activity works well as a second day). Exit ticket 7. Closing share 3. If time is short, run the language detective and move the other two activities to a second session.",
    misconceptions: [
      "Topic as central idea: students answer with a phrase such as 'school gardens'. Ask 'what does the author say about school gardens?' until the answer is a sentence.",
      "First sentence habit: students assume the first or last sentence is always the central idea. Show a text where the first sentence is only a hook and ask which sentence every paragraph supports.",
      "Interesting detail as idea: students pick the most surprising fact. Use the test 'could every detail support this?'.",
      "Opinion in summary: students add words such as amazing or boring. Have them underline any word that tells a feeling and delete it.",
      "Retelling as summary: students copy details in order. Ask them to choose the two details that matter most and leave out the rest.",
    ],
    differentiation:
      "Entering and Emerging learners use the sentence frames, word banks and oral rehearsal in each item and keep the same texts, tasks and answers as every other tier. Expanding and Bridging learners compare two candidate ideas aloud and justify why one covers more of the text. Never shorten the text or lower the task; reduce only the language load.",
    languageNotes:
      "Teach 'topic' (a few words) and 'central idea' (a full sentence) with two colored sentence strips. Point out that 'support' is used for details even though students may hear it as 'help' in everyday speech. Explain that signal words such as 'however' and 'even so' tell the reader how the next sentence relates to the idea.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
