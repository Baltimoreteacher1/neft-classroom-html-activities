// Lesson pack: Main Idea of an Informational Text (grade 2 ELA, RI.2.2). Mentor text, practice paragraphs and the bee text are original.
const scene = (alt, items, bg = "plain") => ({ kind: "scene", bg, alt, items });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const box = (x, y, w, h, fill, text, size = 20, ink = "ink") => [
  { t: "rect", x, y, w, h, rx: 12, fill, stroke: "ink", sw: 3 },
  { t: "text", x: x + w / 2, y: y + h / 2 + size * 0.35, text, size, weight: 700, fill: ink },
];

/** The roof-and-pillars model: details hold up the main idea. */
const pillars = (alt, roof, labels) => ({
  kind: "shapes",
  alt,
  w: 480,
  h: 320,
  items: [
    ...box(30, 20, 420, 76, "coral", roof, 22, "paper"),
    ...[40, 180, 320].flatMap((x, i) => [
      { t: "rect", x, y: 96, w: 120, h: 160, fill: "paper", stroke: "ink", sw: 3 },
      { t: "text", x: x + 60, y: 180, text: labels[i], size: 15, weight: 700, fill: "navy" },
    ]),
    { t: "rect", x: 30, y: 256, w: 420, h: 24, rx: 6, fill: "line", stroke: "ink", sw: 3 },
  ],
});

const wormPillars = pillars(
  "A coral roof labelled Earthworms help soil and plants is held up by three columns labelled Tunnels let air in, Tunnels let water in and Worms eat dead leaves.",
  "Worms help soil and plants",
  ["Tunnels let\nair in", "Tunnels let\nwater in", "Worms eat\ndead leaves"],
);

const beeCover = scene(
  "A bee on a sunflower. The picture is the cover of an informational text called Busy Honey Bees.",
  [
    { icon: "sunflower", x: 60, y: 30, s: 210 },
    { icon: "bee", x: 290, y: 60, s: 130 },
    { t: "text", x: 240, y: 290, text: "Busy Honey Bees", size: 34, weight: 700, fill: "navy" },
  ],
);

const sizeLine = {
  kind: "shapes",
  alt: "Three sentence cards in a row from small to big. The first card, one detail, is small. The middle card, the main idea, is medium and highlighted. The last card, too big, is large and goes past the page.",
  w: 480,
  h: 320,
  items: [
    ...box(20, 150, 100, 60, "ochre", "one detail", 16),
    ...box(140, 120, 150, 120, "coral", "main idea", 22, "paper"),
    ...box(310, 80, 160, 190, "line", "too big", 22),
    {
      t: "text",
      x: 240,
      y: 300,
      text: "just right is in the middle",
      size: 20,
      weight: 700,
      fill: "navy",
    },
  ],
};

export default {
  id: "g2-ela-main-idea-informational-text",
  kind: "lesson",
  title: "Find the Main Idea of an Informational Text",
  subtitle: "Name the topic, find the main idea and support it with details",
  grade: "2",
  band: "k-2",
  subject: "ela",
  duration: 45,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.2.1 and RI.2.2; not mapped to a district unit sequence. The mentor text, practice paragraphs and the bee text are original and not taken from any publisher.",
  },
  standards: ["RI.2.1", "RI.2.2"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Inform", "Explain"],
    domains: ["Reading", "Speaking", "Listening", "Writing"],
    cluster: "2-3",
  },
  contentObjective:
    "I can name the topic of an informational text, find its main idea and use details to show I am right.",
  languageObjective:
    "I can say 'The topic is ___. The main idea is ___. One detail that supports it is ___ because ___.'",
  languageDemands: {
    functions: [
      "identify the topic of a text",
      "state a main idea in a complete sentence",
      "support a claim with a detail from the text",
    ],
    structures: [
      "The topic is ___.",
      "The main idea is that ___.",
      "One detail that supports this is ___ because ___.",
      "This paragraph is mostly about ___.",
    ],
    discourse:
      "Two-turn partner talk: Partner 1 states the main idea, Partner 2 asks 'How do you know?' and Partner 1 answers with a detail. Then a short written main idea and one supporting detail.",
    barriers: [
      "'topic' and 'main idea' are both about 'what a text is about', so children use them as the same thing",
      "'support' means 'help' in everyday talk and 'hold up with a detail' in this lesson",
      "'mostly' and 'main' are unfamiliar adverbs and adjectives that carry the key idea",
      "'detail' and 'fact' overlap: a detail is usually a fact, but a fact is not always a detail that fits",
      "'focus' is both a verb (focus on) and a noun (the focus of a paragraph)",
      "noun phrases such as 'a sweet liquid called nectar' hide the key word in the middle",
    ],
    oralRehearse: [
      "The topic is honey bees.",
      "The main idea is that every honey bee has a job.",
      "One detail is that some bees feed the baby bees, because that is a job.",
    ],
    writeScaffold:
      "The topic of the text is ___. The main idea is that ___. One detail that supports this is ___.",
  },
  vocab: {
    collection: "g2-ela-main-idea-informational-text",
    ids: [
      "informational-text",
      "topic",
      "main-idea",
      "detail",
      "paragraph",
      "sentence",
      "title",
      "heading",
      "caption",
      "text-feature",
      "diagram",
      "fact",
      "important",
      "mostly",
      "focus",
      "support",
      "author",
      "key-word",
      "summarize",
      "evidence",
    ],
  },
  launch: {
    title: "Notice and Wonder: the cover of an informational text",
    visual: beeCover,
    prompts: [
      "What do you notice about the cover?",
      "What do you wonder about this text?",
      "Look at the title and the picture. What do you think the whole text will be mostly about?",
    ],
    teacherNote:
      "Show only the cover. Take two noticings (a bee, a flower, the title) and one wondering. Ask children to predict the topic from the title and picture, and record their words on the board. When the topic word bees comes up, name it as the topic. Then say that the main idea tells something important about the topic, and that today children will find it by reading and by testing choices. Keep the cover visible: the text itself comes in the language detective activity.",
  },
  teach: {
    model: [
      "The topic is who or what a whole text is about. It is one or two words, such as honey bees or earthworms. The title and the pictures often give clues to the topic. A key word that repeats in a paragraph is another clue.",
      "The main idea is the most important thing the text says about the topic. It is a whole sentence, such as 'Earthworms help soil and plants.' The details are small facts that explain it. Think of a roof held up by columns: the main idea is the roof and each detail is a column that holds it up.",
      "Use this mentor paragraph to model. Read it aloud twice: 'Earthworms live in soil. They dig long tunnels as they move. The tunnels let air and water reach plant roots. Worms also eat bits of dead leaves, and what they leave behind helps plants grow.' Think aloud: the topic is earthworms because every sentence is about them. The details are tunnels letting air and water in, and worms eating dead leaves. Together they show that earthworms help soil and plants, so that is the main idea.",
      "Test a main idea with the three-sizes check. Too small: one detail, such as 'Their tunnels let air in'. Too big: more than the paragraph says, such as 'Animals live in many places'. Just right: it covers every detail and nothing more. Ask 'Do all the details explain this sentence?' and 'Does it say more than the text does?'.",
      "Text features help children before they read every word. The title and the headings show the topic and the parts. A caption explains a picture. A diagram labels the parts of something. When a heading says 'A Bee Home', the paragraph below is mostly about where bees live. To summarize, say the main idea and two key details in one or two short sentences.",
    ],
    moves: [
      "Read every paragraph aloud twice. The second reading is for the question 'What is this paragraph mostly about?'.",
      "Always separate two questions in this order: 'What is the topic?' (one or two words) and 'What is the main idea?' (a sentence).",
      "Keep the roof-and-columns picture on the board and add each detail as a column while you think aloud.",
      "Use the three-sizes check with every proposed main idea: too small, too big or just right.",
      "Point to text features first (title, heading, caption, picture) before you ask about a paragraph.",
      "When a child offers an interesting fact as the main idea, ask 'Does this fact explain every paragraph?' rather than saying it is wrong.",
      "Have children use 'because' with a detail so the support is spoken: 'The main idea is that bees have jobs because some bees find nectar.'",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "Read the earthworm paragraph from the model. What is the topic: earthworms, plants or dead leaves?",
      choices: ["earthworms", "plants", "dead leaves"],
      answer: 0,
      hint: "Which word is in nearly every sentence? That word names what the whole paragraph is about.",
      supports: {
        ee: {
          frames: ["The topic is ___."],
          wordBank: ["topic", "earthworms", "about"],
          oral: "Point to a word that you hear again and again. Say it.",
        },
        dev: {
          frames: ["The topic is ___ because every sentence is about it."],
          wordBank: ["topic", "key word"],
        },
        exp: {
          frames: [
            "The topic is ___. I know because the key word ___ comes up in almost every sentence.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Which sentence is the best main idea for the earthworm paragraph?",
      choices: [
        "Earthworms dig tunnels.",
        "Earthworms help soil and plants.",
        "Earthworms are long.",
      ],
      answer: 1,
      hint: "Ask which sentence all of the details in the paragraph explain.",
      supports: {
        ee: {
          frames: ["The main idea is ___."],
          wordBank: ["main idea", "details", "whole paragraph"],
          visual: wormPillars,
          oral: "Look at the roof and the columns. Which sentence is the roof?",
        },
        dev: {
          frames: ["The main idea is that ___.", "The details are ___ and ___."],
          wordBank: ["support", "covers"],
        },
        exp: { frames: ["The main idea is that ___ because the details ___ and ___ explain it."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "Which detail supports the main idea 'Earthworms help soil and plants'?",
      choices: [
        "Their tunnels let air and water reach plant roots.",
        "Earthworms live in soil.",
        "A garden has many plants.",
      ],
      answer: 0,
      hint: "A detail supports the main idea when it explains how earthworms help. Which choice shows help?",
      supports: {
        ee: {
          frames: ["A detail is ___."],
          wordBank: ["detail", "support", "help"],
          visual: wormPillars,
          oral: "Look at the columns. Which sentence belongs in a column?",
        },
        dev: {
          frames: ["___ supports the main idea because it shows ___."],
          wordBank: ["support", "because"],
        },
        exp: {
          frames: ["The detail ___ supports the main idea because it explains how worms ___."],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt: "Say the main idea of the earthworm paragraph in one sentence. Use your own words.",
      answer:
        "Earthworms help soil and plants, or a close restatement such as 'Worms make soil better for plants.'",
      hint: "Say what all the details add up to, in one sentence about the worms.",
      supports: {
        ee: {
          frames: ["Worms help ___.", "The main idea is ___."],
          wordBank: ["worms", "soil", "plants", "help"],
          visual: wormPillars,
          oral: "Point to the roof. Read it. Then say it in your own words.",
        },
        dev: {
          frames: ["The main idea is that earthworms ___."],
          wordBank: ["main idea", "details"],
        },
        exp: { frames: ["The main idea is that earthworms ___ because they ___ and ___."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "choice",
      prompt:
        "Is 'Animals live in many places' too small, just right or too big to be the main idea of the earthworm paragraph?",
      choices: ["too small", "just right", "too big"],
      answer: 2,
      hint: "Compare what the sentence talks about with what the paragraph talks about. Which covers more?",
      supports: {
        ee: {
          frames: ["It is too ___."],
          wordBank: ["small", "big", "just right", "paragraph"],
          visual: sizeLine,
          oral: "Look at the three cards. Which card is the biggest?",
        },
        dev: {
          frames: ["It is too ___ because it covers ___."],
          wordBank: ["covers", "paragraph"],
        },
        exp: {
          frames: [
            "It is too big because it says more than the paragraph, which is only about ___.",
          ],
        },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Main idea pillars with a partner",
    task: "Each pair gets a short informational paragraph on a card, such as a paragraph from a class science or social studies text. Partners read it aloud twice. They find the topic and write it on a sticky note. They write three details on three paper columns and a main idea on a paper roof. Then they run the three-sizes check: does the roof cover every column, and does it say more than the paragraph does? If not, they change the roof. Pairs swap cards with another pair and check each other's roof.",
    roles: ["Reader and topic finder", "Detail finder and roof checker"],
    discussionCards: [
      {
        prompt: "What is the topic? Which key word shows up again and again?",
        frame: "The topic is ___. A key word is ___.",
      },
      {
        prompt: "Does your main idea cover every detail? Is it too small or too big?",
        frame: "The main idea is that ___. It covers ___ and ___.",
      },
      {
        prompt: "Which detail best supports your main idea? How does it help?",
        frame: "One detail that supports this is ___ because ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: a main idea held up by details",
      visualOrModel: wormPillars,
      teacherNote:
        "Project the roof-and-columns picture next to the earthworm paragraph. Move each detail sentence onto a column as you read it. Ask what would happen if you took one column away, and what would happen if you put a roof on that was too big for the columns. Have children point to the roof, a column and a place where a detail would not fit.",
    },
    discuss: {
      title: "Say it: claim, detail, because",
      structure:
        "Turn and talk. Partner 1 states the topic and main idea. Partner 2 asks 'How do you know?'. Partner 1 gives one detail and says 'because'. Swap with a new paragraph.",
      frames: [
        "The topic is ___.",
        "The main idea is that ___.",
        "How do you know?",
        "One detail is ___ because ___.",
      ],
    },
    apply: {
      title: "Use it: summarize a new text",
      task: "Read a new short informational text, such as the bee text in the activity 'Busy Honey Bees'. Name the topic. Choose the main idea. Write two sentences that summarize the text: one with the main idea and one with the strongest detail.",
      successCriteria: [
        "I name the topic in one or two words.",
        "I state the main idea in a whole sentence.",
        "I use a detail that supports the main idea.",
        "I use because or so to connect my detail to my main idea.",
      ],
    },
  },
  activities: [
    { engine: "language-detective", id: "g2-ela-busy-honey-bees" },
    { engine: "concept-builder", id: "g2-ela-just-right-main-idea" },
    { engine: "visual-match", id: "g2-ela-main-idea-word-match" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt:
          "Read: 'Penguins are birds that cannot fly. Their wings work like flippers, so they swim fast. Their thick feathers keep them warm in cold water.' What is the topic?",
        choices: ["penguins", "flippers", "cold water"],
        answer: 0,
        explain: "Every sentence is about penguins, so penguins is the topic.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Read the penguin text again. Which sentence is the best main idea?",
        choices: [
          "Penguins have body parts that help them live in the sea.",
          "Penguins have thick feathers.",
          "Birds can fly.",
        ],
        answer: 0,
        explain:
          "Flippers for swimming and feathers for warmth both show body parts that help penguins live in the sea. Thick feathers is only one detail, and birds can fly is not about penguins.",
      },
      {
        id: "i3",
        type: "choice",
        prompt:
          "Read: 'Leaves make food for a tree. They use sunlight, air and water to do this. The food moves to the rest of the tree.' Which detail supports the main idea 'Leaves make food for a tree'?",
        choices: [
          "They use sunlight, air and water to do this.",
          "Some leaves fall off trees in autumn.",
          "Trees grow in forests.",
        ],
        answer: 0,
        explain:
          "The sunlight, air and water show how leaves make food. The other two facts are true but do not explain how leaves make food.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "Read: 'The Moon goes around Earth. It takes about a month to go all the way around. The Moon does not make its own light. It shines because sunlight bounces off it.' Which is the best main idea?",
        choices: [
          "The Moon goes around Earth and shines with light from the Sun.",
          "It takes about a month for the Moon to go around Earth.",
          "Space has many things in it.",
        ],
        answer: 0,
        explain:
          "The first choice covers both what the Moon does and why it shines. The second is one detail and the third is too big.",
      },
      {
        id: "i5",
        type: "short",
        prompt:
          "Look at the penguin text. Write the topic and the main idea. Use: The topic is ___. The main idea is that ___.",
        answer:
          "The topic is penguins. The main idea is that penguins have body parts that help them swim and stay warm.",
        explain:
          "The topic is the one or two words that name the subject. The main idea says what the text tells about it.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Look at the Moon text. Write one detail that supports the main idea 'The Moon goes around Earth and shines with light from the Sun.'",
        answer:
          "Any detail from the text, such as that it takes about a month to go around Earth or that sunlight bounces off the Moon.",
        explain: "A supporting detail comes from the text and explains the main idea.",
      },
      {
        id: "i7",
        type: "choice",
        prompt:
          "Is 'Animals live in many places' too small, just right or too big to be the main idea of the penguin text?",
        choices: ["too small", "just right", "too big"],
        answer: 2,
        explain:
          "The penguin text is about one kind of animal. A sentence about all animals goes far past what the text says.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt:
          "Read: 'Ants live in groups called colonies. Each ant has a job. Some ants look for food. Others take care of the eggs.' What is the topic?",
        choices: ["ants", "food", "eggs"],
        answer: 0,
        explain: "All of the sentences are about ants.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Read the ant text again. Which is the best main idea?",
        choices: [
          "Ants live in colonies where each ant has a job.",
          "Some ants look for food.",
          "Insects live in many places.",
        ],
        answer: 0,
        explain:
          "The first choice covers the colony and the jobs. Looking for food is one detail and insects in many places is too big.",
      },
      {
        id: "f3",
        type: "choice",
        prompt: "Which detail from the ant text supports the main idea 'Each ant has a job'?",
        choices: ["Some ants look for food.", "There are many kinds of ants.", "Ants are small."],
        answer: 0,
        explain:
          "Looking for food is a job that an ant does. The other choices do not show what the ants do.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can do with a main idea.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt:
          "Read: 'Spiders have eight legs. Insects have six legs, so a spider is not an insect. Many spiders make webs to catch food.' What is the topic?",
        choices: ["spiders", "legs", "webs"],
        answer: 0,
        explain: "Every sentence is about spiders.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "Which is the best main idea of the spider text?",
        choices: [
          "Spiders are different from insects, and many spiders make webs.",
          "Spiders have eight legs.",
          "Insects have six legs.",
        ],
        answer: 0,
        explain:
          "The first choice covers the legs and the webs. The other two are each one detail.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Write one detail from the spider text that supports its main idea. Use: One detail is ___.",
        answer:
          "Any detail from the text, such as that spiders have eight legs, that insects have six legs, or that many spiders make webs to catch food.",
        explain: "A supporting detail comes from the text and helps explain the main idea.",
      },
    ],
    successCriteria: [
      "I named the topic in one or two words.",
      "I chose a main idea that covers the whole text.",
      "I used a detail from the text.",
    ],
  },
  answerKey: {
    notes:
      "Accept any main idea that covers every detail and stays inside the text. For the short items, look for three things: a topic of one or two words, a main idea that is a whole sentence, and a detail copied or paraphrased from the text. Do not accept a main idea that is just one detail, such as 'Penguins have thick feathers', or one that is far bigger than the text. Accept a restatement in the child's own words, such as 'Worms make soil better for plants'.",
    items: {
      g1: "Earthworms. Every sentence is about earthworms.",
      g2: "Earthworms help soil and plants. The tunnels and the dead leaves both explain it.",
      g3: "Their tunnels let air and water reach plant roots. It shows how earthworms help.",
      g4: "Earthworms help soil and plants, or a close restatement.",
      g5: "Too big. It is about all animals and the paragraph is only about earthworms.",
      i1: "Penguins.",
      i2: "Penguins have body parts that help them live in the sea.",
      i3: "They use sunlight, air and water to do this.",
      i4: "The Moon goes around Earth and shines with light from the Sun.",
      i5: "Topic: penguins. Main idea: penguins have body parts that help them swim and stay warm.",
      i6: "Any detail from the Moon text, such as the month-long trip around Earth or sunlight bouncing off the Moon.",
      i7: "Too big.",
      f1: "Ants.",
      f2: "Ants live in colonies where each ant has a job.",
      f3: "Some ants look for food.",
      e1: "Spiders.",
      e2: "Spiders are different from insects, and many spiders make webs.",
      e3: "Any detail from the spider text: eight legs, insects have six legs, or many spiders make webs to catch food.",
    },
  },
  extension: {
    title: "Write a main idea and test it",
    task: "Choose an informational book from the classroom library. Choose one paragraph and copy it or point to it. Write the topic, a main idea in a sentence and two details that support it. Then run the three-sizes check and write whether your main idea was too small, too big or just right the first time, and what you changed. If you want a challenge, find a paragraph where the main idea is stated in a sentence and another paragraph where you have to figure it out from the details.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo decir el tema de un texto informativo, encontrar la idea principal y usar detalles para probarla.",
      vocab: [
        { en: "topic", es: "tema", verified: true },
        { en: "main idea", es: "idea principal", verified: true },
        { en: "detail", es: "detalle", verified: true },
        { en: "paragraph", es: "párrafo", verified: true },
        { en: "fact", es: "hecho", verified: true },
        { en: "title", es: "título", verified: true },
        { en: "author", es: "autor", verified: true },
        { en: "summarize", es: "resumir", verified: true },
      ],
      familyPrompt:
        "Lean juntos un párrafo corto de un libro de datos, en inglés o en español. Pregunten: ¿Cuál es el tema? ¿Cuál es la idea principal? ¿Qué detalle lo apoya? Después resuman el párrafo en una o dos oraciones.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach with the earthworm mentor text 12 minutes. Guided practice 8 minutes. Partner main idea pillars or the activity stations 12 minutes. Exit ticket 6 minutes. Closing share 2 minutes. If time is short, run 'Too small, just right or too big?' after the guided practice and move the bee text to the next day, since it needs about 15 minutes.",
    misconceptions: [
      "Topic and main idea are the same thing: children answer 'bees' when asked for the main idea. Ask 'What does the text say about bees?' and remind them that the main idea is a whole sentence.",
      "First sentence is the main idea: children pick the first sentence every time. Show a paragraph where the main idea comes last and one where it is not stated.",
      "Most interesting fact is the main idea: children choose the surprising detail. Ask 'Does this explain every paragraph?'.",
      "Main idea too small: children choose one detail. Use the three-sizes check and the roof and columns picture.",
      "Main idea too big: children choose a general sentence from their own knowledge. Ask 'Does the text say this?' and 'Does it say more than the text does?'.",
      "True detail that does not fit: children choose a true fact that does not explain the main idea. Ask 'Does this help prove the roof?'.",
    ],
    differentiation:
      "Entering and Emerging learners work with a read-aloud, pictures, the roof-and-columns model with sentence strips, the frames and partner talk, and answer by pointing to a sentence. Expanding and Bridging learners write their own main idea and a because sentence and compare two paragraphs. The text, the questions and the answers are the same for all tiers. Never shorten the text; support the language around it.",
    languageNotes:
      "Teach topic and main idea with gestures: a small circle with the hands for a topic, a roof over the head for a main idea. Pre-teach 'support' with a real classroom example (a hand under a book) before using it in the reading sense. Point to the key word in long noun phrases, such as 'a sweet liquid called nectar', and say it slowly. A child who knows the content in another language can still state a topic and a main idea; allow oral answers in the home language first, then bridge to English with the frames.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
