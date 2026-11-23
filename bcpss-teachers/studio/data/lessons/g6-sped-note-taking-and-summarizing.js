// Lesson pack: Note-Taking and Summarizing (grade 6, inclusive instruction / UDL). A routine for reading with a pencil. Original text and items.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const copyVsOwn = {
  kind: "table",
  w: 480,
  h: 260,
  alt: "A table comparing two sets of notes on the same paragraph. Student A copied a whole sentence. Student B wrote a short phrase.",
  longDesc:
    "Two columns of notes. Student A's notes are one long copied sentence about pollen sticking to a bee. Student B's notes are one short phrase: pollen sticks to bee.",
  head: ["Student A", "Student B"],
  rows: [
    [
      "Tiny grains of pollen stick to the bee's fuzzy body.",
      "pollen sticks to bee",
    ],
  ],
  highlight: [[0, 1]],
};

const notesPage = {
  kind: "shapes",
  w: 480,
  h: 300,
  alt: "A notes page divided into a narrow left column for questions, a wide right area for short notes and a bottom bar for a summary.",
  items: [
    { t: "rect", x: 20, y: 20, w: 440, h: 260, fill: "paper", stroke: "ink", sw: 3, rx: 8 },
    { t: "line", x1: 150, y1: 20, x2: 150, y2: 220, stroke: "ink", sw: 3 },
    { t: "line", x1: 20, y1: 220, x2: 460, y2: 220, stroke: "ink", sw: 3 },
    {
      t: "text",
      x: 85,
      y: 48,
      text: "Questions",
      size: 16,
      fill: "ink",
      anchor: "middle",
      weight: 700,
    },
    {
      t: "text",
      x: 305,
      y: 48,
      text: "Notes",
      size: 16,
      fill: "ink",
      anchor: "middle",
      weight: 700,
    },
    {
      t: "text",
      x: 240,
      y: 252,
      text: "Summary",
      size: 16,
      fill: "ink",
      anchor: "middle",
      weight: 700,
    },
  ],
};

const path = {
  kind: "flow",
  w: 480,
  h: 220,
  alt: "Four boxes in a row joined by arrows: skim, read a chunk, write short notes in your own words, then write a summary.",
  longDesc:
    "Step 1 skim the title, headings and pictures. Step 2 read one chunk. Step 3 look away and write short notes in your own words. Step 4 write a one-to-three-sentence summary.",
  steps: [
    { label: "1. Skim", icon: "eye" },
    { label: "2. Read a chunk", icon: "book" },
    { label: "3. Note it", icon: "pencil" },
    { label: "4. Summarize", icon: "notebook" },
  ],
};

const P2 =
  "Paragraph: When a bee lands on a flower, it drinks sweet nectar. Tiny grains of pollen stick to the bee's fuzzy body. When the bee visits the next flower, some of the pollen rubs off. The flower can then make seeds and fruit.";

export default {
  id: "g6-sped-note-taking-and-summarizing",
  kind: "lesson",
  title: "Note-Taking and Summarizing",
  subtitle: "Skim, read in chunks, take short notes in your own words, and write a summary",
  grade: "6",
  band: "6-8",
  subject: "sped",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS grade 6 informational reading standards and CAST UDL checkpoints. Not mapped to a district unit sequence. Supports are offered to every learner; nothing in this pack describes or labels any student.",
  },
  standards: [
    "ELD-LA",
    "RI.6.2",
    "RST.6-8.2",
    "UDL.2.5",
    "UDL.3.2",
    "UDL.5.1",
    "UDL.6.2",
    "UDL.6.3",
  ],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Inform"],
    domains: ["Reading", "Writing"],
    cluster: "6-8",
  },
  contentObjective:
    "I can take short notes on a paragraph in my own words and use them to write a one-to-three-sentence summary of the main idea and key details.",
  languageObjective:
    "I can write a summary by using 'The text is mostly about ___. One key detail is ___. Another is ___.' in my own words.",
  languageDemands: {
    functions: ["identify a main idea", "select key details", "restate ideas in my own words"],
    structures: [
      "The text is mostly about ___.",
      "One key detail is ___. Another key detail is ___.",
      "In other words, ___.",
    ],
    discourse:
      "A two-step routine: a short oral retell to a partner, then a written summary. Students may point to highlighted text, use a graphic organizer or dictate to a partner before writing.",
    barriers: [
      "'summary', 'detail', 'idea' and 'note' have everyday meanings that are looser than their school meanings",
      "long informational sentences with 'which' and 'that' clauses",
      "technical words such as 'pollination' and 'pollinators' that appear without a definition",
      "knowing what to leave out, because everything in the text looks important",
      "the urge to copy a sentence word for word instead of paraphrasing",
    ],
    oralRehearse: [
      "The article is mostly about how bees help plants make fruit.",
      "One key detail is that pollen sticks to the bee and rubs off on the next flower.",
      "In other words, bees carry pollen from flower to flower.",
    ],
    writeScaffold:
      "The text is mostly about ___. One key detail is ___. Another is ___. In other words, ___.",
  },
  vocab: {
    collection: "g6-sped-note-taking-and-summarizing",
    ids: [
      "main-idea",
      "key-detail",
      "paraphrase",
      "summary",
      "notes",
      "abbreviation",
      "heading",
      "graphic-organizer",
      "skim",
      "text-feature",
    ],
  },
  launch: {
    title: "Notice and Wonder: two sets of notes",
    visual: copyVsOwn,
    prompts: [
      "What do you notice about Student A's notes and Student B's notes?",
      "Which notes would be easier to study from tomorrow? Why?",
      "What did Student B do to the sentences?",
    ],
    teacherNote:
      "Show the table and let students look before anyone speaks. Give a one-minute turn-and-talk. Students usually notice that A copied and B shortened. Do not say which is 'right'. Ask 'Which would you rather have the night before a quiz?' Record words students use ('short', 'own words', 'arrows') on the board. These become the success criteria for the lesson. Accept pointing, drawing or a word in any language.",
  },
  teach: {
    model: [
      "Notes are not a copy of the text. They are short words that help you remember. Summaries are not a list of everything. They tell the main idea and the most important details in your own words. We use a four-step path: skim, read a chunk, note it, summarize.",
      "Skim first. Look at the title, the headings, the pictures and any bold words. These text features tell you how the text is organized. Ask: what is this probably about? Write one question in the left column of your page, such as 'How do bees help plants?'.",
      "Read one chunk at a time, such as one paragraph. Then look away from the text and say the idea to yourself in your own words. Write short phrases in the notes area. Use arrows and abbreviations, such as b/c for because, as long as you can read them tomorrow.",
      "Decide what is key. A key detail helps prove or explain the main idea. An extra detail is true but not needed. A quick test: cover the detail and ask, 'Can I still explain the main idea?' If yes, it is extra. Put key details in the notes and leave extra details out.",
      "Write the summary last. Start with the main idea, then add two key details, and say it in your own words in one to three sentences. Reread the text one more time to check that your summary says what the text says, with no opinions added.",
    ],
    moves: [
      "Model one paragraph with a think-aloud: read it, look away, say it, write a short phrase. Keep the text visible so students can check.",
      "Offer the text in print, on screen and in audio. Let students highlight with a color or a tap before they write.",
      "Give a choice of notes format: a three-part notes page, a graphic organizer or a list with arrows. All formats hold the same content.",
      "Chunk the text and the task. Cover all but one paragraph. Offer a checklist: skimmed, read, noted, summarized.",
      "Check notes by asking 'Could you explain this to someone who has not read it?' and praise the use of own words, not neatness or length.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "Paragraph: Bees do more than make honey. They also help many plants make fruit and seeds. This happens because of a process called pollination. What is the paragraph mostly about?",
      choices: [
        "How bees help plants make fruit and seeds",
        "How bees make honey",
        "Why pollination is a hard word",
      ],
      answer: 0,
      hint: "Ask what all three sentences have in common. Notice what the second sentence says bees help with.",
      supports: {
        ee: {
          frames: ["The paragraph is about ___."],
          wordBank: ["bees", "plants", "fruit", "seeds"],
          visual: path,
          oral: "Read the paragraph with a partner. Say the big point in four words.",
        },
        dev: {
          frames: ["The paragraph is mostly about how ___."],
          wordBank: ["main idea", "detail"],
        },
        exp: { frames: ["The main idea is ___ because all the sentences ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "Original sentence: 'Tiny grains of pollen stick to the bee's fuzzy body.' Which note is best?",
      choices: [
        "pollen sticks to bee",
        "Tiny grains of pollen stick to the bee's fuzzy body.",
        "Bees are great!",
      ],
      answer: 0,
      hint: "Good notes are short, keep the meaning and use your own words. One choice copies, and one adds an opinion.",
      supports: {
        ee: {
          frames: ["The note is ___ and keeps the ___."],
          wordBank: ["short", "meaning", "copy", "own words"],
          visual: copyVsOwn,
        },
        dev: {
          frames: ["The best note is ___ because it is ___."],
          wordBank: ["paraphrase", "notes"],
        },
        exp: { frames: ["The best note keeps ___ and is in my own words, unlike ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: `${P2} Which detail is the least needed in a short summary?`,
      choices: [
        "The bee drinks sweet nectar.",
        "Pollen sticks to the bee.",
        "The flower can then make seeds and fruit.",
      ],
      answer: 0,
      hint: "Cover each detail and ask: can I still explain how plants make fruit and seeds without it?",
      supports: {
        ee: {
          frames: ["I can skip ___."],
          wordBank: ["nectar", "pollen", "seeds", "skip"],
        },
        dev: { frames: ["I can leave out ___ because ___."], wordBank: ["key detail", "extra"] },
        exp: {
          frames: ["I can leave out ___ because the main idea still makes sense without it."],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt: `${P2} Write a one-sentence summary in your own words.`,
      answer:
        "Bees carry pollen from one flower to the next, and the flowers can then make seeds and fruit.",
      hint: "Say the paragraph to yourself without looking. Tell what moves, where it goes and what happens at the end.",
      supports: {
        ee: {
          frames: ["Bees carry ___.", "Then the flower makes ___."],
          wordBank: ["pollen", "flower", "seeds", "fruit"],
          visual: notesPage,
        },
        dev: { frames: ["Bees carry ___ from ___ to ___, so ___."], wordBank: ["carry", "next"] },
        exp: { frames: ["The paragraph explains that ___, which lets ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Read, look away, say it",
    task: "Pairs get a short original paragraph on a topic they choose from three (for example how a compass works, why leaves change color or how a library card is used). Partner A reads one sentence silently and looks away. Partner A says the idea in their own words and Partner B writes a short note. They swap roles for the next sentence. After the paragraph, both partners decide which two notes are key details and which are extra. Together they write a one-sentence summary and read it back. Pairs may use the notes page or the organizer.",
    roles: ["Reader and speaker", "Note-taker"],
    discussionCards: [
      {
        prompt: "What is the main idea? Say it in a few words.",
        frame: "The text is mostly about ___.",
      },
      {
        prompt: "Which note is a key detail? Which is extra?",
        frame: "___ is a key detail because ___. ___ is extra because ___.",
      },
      {
        prompt: "How did you put that sentence in your own words?",
        frame: "In other words, ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the notes page and the path",
      visualOrModel: notesPage,
      teacherNote:
        "Show the three-part page beside the four-step path. Fill in the page live from the bee paragraph while thinking aloud: question in the left column, short phrases in the notes area, summary at the bottom. Keep the filled page up as an exemplar. Show how the same content can be arranged in a graphic organizer for students who prefer boxes to columns.",
    },
    discuss: {
      title: "Say it: retell in two sentences",
      structure:
        "Partner 1 retells a paragraph in two sentences without looking: the main idea, then one key detail. Partner 2 checks against the text and says one thing that matched. Swap with a new paragraph.",
      frames: [
        "The text is mostly about ___.",
        "One key detail is ___.",
        "That matches the text because ___.",
        "You could also add ___.",
      ],
    },
    apply: {
      title: "Use it: notes and a summary of a new text",
      task: "Choose one short text from the set your teacher gives you. Skim it and write one question. Read one paragraph at a time, look away and write short notes in your own words. Mark the key details with a star. Write a one-to-three-sentence summary. Check your summary against the text. You may show your notes on a notes page, in an organizer or by explaining them aloud to the teacher.",
      successCriteria: [
        "My notes are short and in my own words.",
        "My summary has the main idea and at least two key details.",
        "My summary has no opinions and no copied sentences.",
        "I checked my summary against the text.",
      ],
    },
  },
  activities: [
    { engine: "language-detective", id: "g6-sped-bee-notes-detective" },
    { engine: "concept-builder", id: "g6-sped-summary-sort" },
    { engine: "concept-builder", id: "g6-sped-notes-layout-labels" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt:
          "Text: A school garden gives students a place to learn outdoors. Students plant seeds, water them and measure how fast the plants grow. The vegetables they harvest are shared in the cafeteria. Many students say gardening helps them feel calm and proud of their work. What is the main idea?",
        choices: [
          "A school garden is a place where students learn and grow food.",
          "Vegetables taste better in the cafeteria.",
          "Students should measure everything they plant.",
        ],
        answer: 0,
        explain:
          "All four sentences tell about learning and growing food in a school garden. The other two choices are one detail or a new idea.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          "Which set of notes best matches the sentence 'Students plant seeds, water them and measure how fast the plants grow'?",
        choices: [
          "plant seeds, water, measure growth",
          "Students plant seeds, water them and measure how fast the plants grow.",
          "gardens are the best thing at school",
        ],
        answer: 0,
        explain:
          "The first set is short, keeps the three actions and is in the student's own words. The second is a copy and the third adds an opinion.",
      },
      {
        id: "i3",
        type: "choice",
        prompt:
          "Which detail from the garden text is a key detail for the main idea about learning and growing food?",
        choices: [
          "Students plant seeds, water them and measure how fast the plants grow.",
          "The cafeteria is on the first floor.",
          "Some students prefer cucumbers.",
        ],
        answer: 0,
        explain:
          "Planting, watering and measuring show how students learn while growing food. The other two details are not in the text or do not support the main idea.",
      },
      {
        id: "i4",
        type: "short",
        prompt:
          "Write a one- or two-sentence summary of the garden text. Use your own words. Do not copy a whole sentence.",
        answer:
          "A school garden lets students learn outdoors by planting and caring for vegetables that are shared in the cafeteria. Many students feel calm and proud.",
        explain:
          "Look for the main idea (learning by growing food in a school garden), at least two key details (planting and caring, sharing the harvest) and no copied sentence or opinion.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "Which sentence is the best paraphrase of 'Students plant seeds, water them and measure how fast the plants grow'?",
        choices: [
          "Students put seeds in the ground, give them water and track how quickly the plants get taller.",
          "Students plant seeds, water them and measure how fast the plants grow.",
          "Students love gardening.",
        ],
        answer: 0,
        explain:
          "The first choice keeps the meaning and uses mostly new words. The second is a copy and the third changes the meaning.",
      },
      {
        id: "i6",
        type: "choice",
        prompt:
          "Which heading best fits a paragraph about vegetables from the garden being shared in the cafeteria?",
        choices: ["Sharing the Harvest", "How to Plant Seeds", "Garden Rules"],
        answer: 0,
        explain:
          "A heading names what a section is about. This paragraph is about sharing the vegetables that were grown.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Which is the best first step when you get a new informational text?",
        choices: [
          "Skim the title, headings and pictures",
          "Copy the first paragraph",
          "Write the summary",
        ],
        answer: 0,
        explain:
          "Skimming shows how the text is organized and what it is about before you read closely.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "A summary should contain",
        choices: [
          "the main idea and the key details in my own words",
          "every detail from the text",
          "what I think about the topic",
        ],
        answer: 0,
        explain:
          "A summary tells what the text says, briefly and in your own words. It does not include every detail or opinions.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "Write a note in your own words for this sentence: 'The flower can then make seeds and fruit.'",
        answer: "flower then makes seeds and fruit",
        explain: "Look for short words that keep the meaning and are not a copy of the sentence.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you take notes and summarize.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt:
          "Which would you leave out of a short summary of an article about bees and pollination?",
        choices: [
          "A detail that is true but does not explain the main idea",
          "The main idea",
          "A key detail that explains how pollination works",
        ],
        answer: 0,
        explain:
          "A summary keeps the main idea and key details. Details that do not explain the main idea can be left out.",
      },
      {
        id: "e2",
        type: "short",
        prompt: "Write a one-sentence summary of any text you read today. Use your own words.",
        answer:
          "Any one-sentence summary that gives the main idea and one key detail in the student's own words.",
        explain: "Check the main idea, one key detail, and that the sentence is not copied.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Tell one thing you do when a text feels too long. You may draw it.",
        answer: "Read one chunk at a time, look away, say it, and write a short note.",
        explain: "Accept any chunking, noting or organizing strategy that is specific.",
      },
    ],
    successCriteria: [
      "My notes or summary are in my own words.",
      "My summary has the main idea and a key detail.",
      "I can name a strategy I will use again.",
    ],
  },
  answerKey: {
    notes:
      "Accept any format that shows the thinking: a filled notes page, an organizer, a list with arrows or an oral retell. For notes look for short phrases in the student's own words that keep the meaning. For summaries look for the main idea, at least two key details (one is acceptable at the exit ticket), no opinions and no copied sentence. Never grade handwriting, spelling or neatness here. Record which supports were used (audio, highlight, organizer, dictation) by activity, not by student name, in any shared sheet.",
    items: {
      g1: "How bees help plants make fruit and seeds. All three sentences connect to that point.",
      g2: "pollen sticks to bee. It is short, keeps the meaning and is in my own words.",
      g3: "The bee drinks sweet nectar. It does not explain how the plant makes seeds and fruit.",
      g4: "Bees carry pollen from one flower to the next, and the flowers can then make seeds and fruit.",
      i1: "A school garden is a place where students learn and grow food.",
      i2: "plant seeds, water, measure growth.",
      i3: "Students plant seeds, water them and measure how fast the plants grow.",
      i4: "A school garden lets students learn outdoors by planting and caring for vegetables that are shared in the cafeteria. Many students feel calm and proud.",
      i5: "Students put seeds in the ground, give them water and track how quickly the plants get taller.",
      i6: "Sharing the Harvest.",
      f1: "Skim the title, headings and pictures.",
      f2: "The main idea and the key details in my own words.",
      f3: "flower then makes seeds and fruit.",
      e1: "A detail that is true but does not explain the main idea.",
      e2: "Any one-sentence summary with the main idea and one key detail in the student's own words.",
      e3: "Read one chunk at a time, look away, say it and write a short note.",
    },
  },
  extension: {
    title: "Summarize in two lengths",
    task: "Choose a text from your own reading. Write a summary in one sentence, then in three sentences. Compare them: what did you add in the three-sentence version? What would you cut if you had to go back to one sentence? Write one sentence that tells how a summary changes when you have more room.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo tomar notas cortas con mis propias palabras y escribir un resumen con la idea principal y los detalles clave.",
      vocab: [
        { en: "main idea", es: "idea principal", verified: true },
        { en: "key detail", es: "detalle clave", verified: true },
        { en: "summary", es: "resumen", verified: true },
        { en: "notes", es: "notas", verified: true },
        { en: "paraphrase", es: "parafrasear", verified: true },
        { en: "heading", es: "encabezado", verified: true },
      ],
      familyPrompt:
        "Lean juntos un párrafo corto de un periódico o de un sitio de noticias. Pida a su hijo o hija que cuente la idea principal con sus propias palabras, en el idioma que prefiera, y que escriba tres palabras clave.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach the path with a modeled paragraph 12. Guided items 8. Read, look away, say it, or an activity 15. Exit ticket 7. Close with two volunteers reading a summary aloud, 3. For a shorter session, use the guided items and one activity; the other two activities fit centers on later days.",
    misconceptions: [
      "Copying. Students copy whole sentences as notes. Teach the 'look away and say it' step and check that the note has fewer words than the sentence.",
      "Everything is important. Students write notes on every sentence. Use the cover test: 'Can I still explain the main idea without it?'",
      "The first sentence is always the main idea. Ask 'What are all the paragraphs mostly about?' to test a candidate main idea against every paragraph.",
      "A summary has my opinion. Ask 'Does the text say that, or do I think that?' and move opinions to the margin.",
      "A summary is a list. Show how a summary connects ideas with words such as 'which helps' and 'so'.",
    ],
    differentiation:
      "These supports are available to every learner and are chosen with the learner: text in print, on screen or in audio; highlighting before writing; a notes page, an organizer or a list; dictation or a verbal retell instead of writing; chunked text with a four-box checklist; sentence frames. The text, the main idea and the quality bar for the summary are the same for everyone. The ee, dev, exp and br tiers describe how much scaffolding is on the page (frames, word bank, picture), not any student. This pack never identifies or labels a student.",
    udlNotes:
      "Representation: the text is available in print and as audio, and key ideas are also shown in a diagram (UDL 2.5). Highlighting patterns and big ideas: the cover test and the organizer headings point to what matters (UDL 3.2). Action and expression: notes, organizer, speaking or writing all count as evidence (UDL 5.1). Planning and managing information: the four-step path, the checklist and the organizer support strategy and organization (UDL 6.2, 6.3).",
    languageNotes:
      "Teach 'detail', 'summary' and 'idea' with examples before the lesson. Say 'in your own words' with a gesture of looking away. Use short texts of about 60 to 120 words, because the target is the strategy, not stamina. The Studio stores no student names; evidence is class-level and anonymous.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
