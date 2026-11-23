// Lesson pack: Solving Word Problems With Visuals (grade 3, inclusive instruction / UDL). One routine, many ways to show thinking. Original problems; every numeric answer carries a calc.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const routine = {
  kind: "flow",
  w: 480,
  h: 220,
  alt: "A visual schedule with four boxes in a row joined by arrows: Read, Draw, Write, Check.",
  longDesc:
    "Four steps from left to right. Step 1 Read the story. Step 2 Draw a picture or tape diagram. Step 3 Write an equation and solve. Step 4 Check that the answer makes sense.",
  steps: [
    { label: "1. Read the story", icon: "book" },
    { label: "2. Draw it", icon: "pencil" },
    { label: "3. Write and solve", icon: "notebook" },
    { label: "4. Check", icon: "check" },
  ],
};

const stickers = {
  kind: "tape",
  w: 480,
  h: 200,
  alt: "A tape diagram with a bracket above two blocks. The left block is 24 and the right block is 15. The bracket has a question mark because the total is not known yet.",
  longDesc:
    "Story: Mia has 24 stickers and a friend gives her 15 more. Two blocks side by side show the two parts, 24 and 15. The bracket above both has a question mark for the total.",
  parts: [
    { label: "24", units: 24 },
    { label: "15", units: 15 },
  ],
  total: "?",
};

const pencils = {
  kind: "tape",
  w: 480,
  h: 220,
  alt: "A tape diagram with a whole of 36 shown above two parts. One part is 18 and the other part is a dashed block with a question mark.",
  rows: [
    { label: "All", parts: [{ label: "36", units: 36 }] },
    {
      label: "Parts",
      parts: [
        { label: "18", units: 18 },
        { label: "?", units: 18, unknown: true },
      ],
    },
  ],
};

const groups = {
  kind: "tape",
  w: 480,
  h: 200,
  alt: "A tape diagram with four equal blocks that each show 6 and a bracket above them with a question mark.",
  parts: [
    { label: "6", units: 6 },
    { label: "6", units: 6 },
    { label: "6", units: 6 },
    { label: "6", units: 6 },
  ],
  total: "?",
};

const compare = {
  kind: "tape",
  w: 480,
  h: 240,
  alt: "Two tape rows. The top row for Ava is one block of 45. The bottom row for Leo is a block of 28 followed by a dashed block with a question mark for how many more Ava read.",
  rows: [
    { label: "Ava", parts: [{ label: "45", units: 45 }] },
    {
      label: "Leo",
      parts: [
        { label: "28", units: 28 },
        { label: "?", units: 17, unknown: true },
      ],
    },
  ],
};

export default {
  id: "g3-sped-solving-word-problems-with-visuals",
  kind: "lesson",
  title: "Solving Word Problems With Visuals",
  subtitle: "A four-step routine (read, draw, write, check) with many ways to show thinking",
  grade: "3",
  band: "3-5",
  subject: "sped",
  duration: 45,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS grade 3 operations standards and CAST UDL checkpoints. Not mapped to a district unit sequence. Supports are offered to every learner; nothing in this pack describes or labels any student.",
  },
  standards: [
    "3.OA.D.8",
    "3.OA.A.3",
    "3.NBT.A.2",
    "MP.1",
    "MP.4",
    "UDL.2.5",
    "UDL.5.1",
    "UDL.6.2",
    "UDL.7.1",
  ],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "2-3",
  },
  contentObjective:
    "I can solve one-step addition, subtraction and equal-group word problems by drawing a tape diagram, writing an equation and checking my answer.",
  languageObjective:
    "I can explain my steps by saying 'First I read, next I draw, then I write an equation, last I check.'",
  languageDemands: {
    functions: [
      "retell a problem in my own words",
      "explain the steps I used",
      "say whether my answer makes sense",
    ],
    structures: [
      "The question asks ___.",
      "The key facts are ___ and ___.",
      "I solved it by ___, so the answer is ___.",
    ],
    discourse:
      "A short oral retell with a partner (story, question, key facts), then a one-sentence explanation of the answer. Students may point, draw or build instead of writing a full sentence.",
    barriers: [
      "'in all', 'left', 'more than' and 'each' signal an operation but can be read as everyday words",
      "extra details in the story that are not needed",
      "the question can come at the end after several sentences",
      "'difference' and 'total' mean something special in math",
    ],
    oralRehearse: [
      "The question asks how many seeds in all.",
      "The key facts are 18 sunflower seeds and 14 bean seeds.",
      "I added because I am putting the groups together.",
    ],
    writeScaffold:
      "The question asks ___. The key facts are ___ and ___. I will ___. The answer is ___. It makes sense because ___.",
  },
  vocab: {
    collection: "g3-sped-solving-word-problems-with-visuals",
    ids: [
      "word-problem",
      "question",
      "key-fact",
      "part",
      "total",
      "unknown",
      "difference",
      "equal-groups",
      "equation",
      "check",
    ],
  },
  launch: {
    title: "Look and think: the problem-solving path",
    visual: routine,
    prompts: [
      "What do you see in each box? What do you think you do in each step?",
      "Which step do you usually do first? Which step do you sometimes skip?",
      "How could this path help you when a problem feels big?",
    ],
    teacherNote:
      "Show the four-box path and keep it posted all lesson as a visual schedule. Let students predict what happens in each box before you name it. Tell students they will use the path every time, that each step has more than one way to do it, and that they choose the way that helps them. Note that the check box is a real step, not extra. Take any contribution, including a point or a gesture, and say it back in a complete sentence.",
  },
  teach: {
    model: [
      "A word problem is a math story that asks a question. Solve it in four steps: read, draw, write, check. Each step has a job and more than one way to do it.",
      "Read three times, with a different job each time. First read to hear the story. Second read to find the question, the sentence with a question mark. Third read to circle the key facts, which are the numbers with their labels. Cross out the extra details, such as the color of a fence.",
      "Draw the story. A tape diagram shows parts and a whole. If two parts are put together, draw two blocks and a bracket for the total. If a part is taken away, draw the whole and show the part that is left as the unknown. If there are equal groups, draw blocks that are all the same size. You can also build with counters or act it out before you draw.",
      "Write an equation that matches your picture. For Mia's 24 stickers and 15 more, the equation is 24 + 15 = ?. For 36 pencils with 18 given out, it is 36 - 18 = ?. For 4 tables with 6 students at each table, it is 4 x 6 = ?. Then solve it with a strategy you trust, such as counting up, place value or a fact you know.",
      "Check before you finish. Ask three questions: Does my answer fit the story? Can I solve it a second way, such as adding back? Can I say the answer in a sentence with a label? A check is quick when you ask the same three questions every time.",
    ],
    moves: [
      "Model one problem aloud with every step visible. Use the same four boxes every time so students know what comes next.",
      "Read each problem aloud and let students read it again with a partner. Offer the text as a printed copy, a picture version or an audio version (the Studio plays any sentence on request).",
      "Give a choice at every step: read alone or with a partner, draw a tape diagram, a picture or counters, say the answer, write it or build it. Keep the same target for everyone.",
      "Chunk the task. Show one problem at a time and fold or cover the rest. Offer a checklist with four boxes for students who want to track their steps.",
      "Praise the process: 'You circled the key facts' or 'You checked a second way'. Do not praise speed.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt:
        "Mia has 24 stickers. A friend gives her 15 more. How many stickers does Mia have now?",
      answer: 39,
      calc: "24+15",
      hint: "Draw two blocks side by side, one for each group of stickers. What do you do to put two groups together?",
      supports: {
        ee: {
          frames: ["The question asks ___.", "24 and 15 make ___."],
          wordBank: ["stickers", "add", "total", "more"],
          visual: stickers,
          directions: "Read the story with a partner. Use counters if you like.",
        },
        dev: { frames: ["I added ___ and ___ to get ___."], wordBank: ["add", "total"] },
        exp: { frames: ["The equation is ___ + ___ = ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt:
        "A class has 36 pencils. The teacher gives out 18 pencils. How many pencils are left?",
      answer: 18,
      calc: "36-18",
      hint: "The whole is the pencils the class started with. The part given out is taken away from it.",
      supports: {
        ee: {
          frames: ["The whole is ___.", "___ pencils are left."],
          wordBank: ["whole", "part", "left", "pencils"],
          visual: pencils,
          directions: "Start with 36 counters. Take away 18.",
        },
        dev: {
          frames: ["I took away ___ from ___ and had ___ left."],
          wordBank: ["subtract", "left"],
        },
        exp: { frames: ["The equation is ___ - ___ = ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt:
        "There are 4 tables in the classroom. Each table has 6 students. How many students are there in all?",
      answer: 24,
      calc: "4*6",
      hint: "Draw one block for each table. Every block holds the same number. How can you find the total of equal groups?",
      supports: {
        ee: {
          frames: [
            "There are ___ tables with ___ students each.",
            "There are ___ students in all.",
          ],
          wordBank: ["groups", "each", "in all", "equal"],
          visual: groups,
          directions: "Make four groups of counters with the same number in each.",
        },
        dev: { frames: ["___ groups of ___ is ___."], wordBank: ["equal groups", "multiply"] },
        exp: { frames: ["I multiplied ___ by ___ because there are equal groups."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "numeric",
      prompt: "Leo read 28 pages. Ava read 45 pages. How many more pages did Ava read than Leo?",
      answer: 17,
      calc: "45-28",
      hint: "Draw one bar for each reader. The part of Ava's bar that sticks out past Leo's bar is the unknown.",
      supports: {
        ee: {
          frames: ["Ava read ___ pages.", "Leo read ___ pages.", "Ava read ___ more."],
          wordBank: ["more", "difference", "pages"],
          visual: compare,
          directions: "Look at the two bars. Which bar is longer? By how much?",
        },
        dev: {
          frames: ["The difference is ___ because ___ minus ___ is ___."],
          wordBank: ["difference", "subtract"],
        },
        exp: { frames: ["Ava read ___ more pages because I subtracted ___ from ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Build, draw, say",
    task: "Pairs get one word problem card and a bag of counters. Partner A builds the story with the counters while Partner B reads it aloud. Partner B draws a tape diagram of what Partner A built. Together they write an equation, solve, and say the answer in a sentence with a label. Then they swap: Partner B builds a second problem and Partner A draws. Each pair checks with a second way. The teacher moves from pair to pair and asks 'What is the question?' and 'Which facts did you use?'.",
    roles: ["Builder", "Drawer"],
    discussionCards: [
      {
        prompt: "What is the question? Say it in your own words.",
        frame: "The question asks ___.",
      },
      {
        prompt: "What are the key facts? What is extra?",
        frame: "The key facts are ___ and ___. ___ is extra.",
      },
      {
        prompt: "How did you check your answer?",
        frame: "I checked by ___. It makes sense because ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: one story, one picture",
      visualOrModel: stickers,
      teacherNote:
        "Build the sticker story with real objects or counters on the document camera, then draw the tape diagram next to it, then write the equation. Show how each representation matches the others: the two blocks are the two groups, the bracket is the total, and 24 + 15 = ? is the same story in numbers.",
    },
    discuss: {
      title: "Say it: tell your partner the problem",
      structure:
        "Partner 1 tells the problem in their own words without looking at the card: the question, then the key facts. Partner 2 listens and says one thing they heard. Swap. Students may point to the picture or use counters while they talk.",
      frames: [
        "The question asks ___.",
        "The key facts are ___ and ___.",
        "I heard ___.",
        "I think we should ___ because ___.",
      ],
    },
    apply: {
      title: "Use it: choose a way to show it",
      task: "Choose one problem card from a short stack of three. Solve it with the four-step path. Then choose how you show your thinking: draw a tape diagram, build it with counters, write the equation and a sentence, or explain it aloud to the teacher. Check your answer a second way.",
      successCriteria: [
        "I found the question and the key facts.",
        "My picture, my counters or my words match the story.",
        "I wrote or said an equation that fits the picture.",
        "I checked that my answer makes sense and gave it a label.",
      ],
    },
  },
  activities: [
    { engine: "language-detective", id: "g3-sped-garden-problem-detective" },
    { engine: "concept-builder", id: "g3-sped-tape-parts-labels" },
    { engine: "concept-builder", id: "g3-sped-number-line-jumps" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "A shelf has 52 books. Then 19 more books are added. How many books are on the shelf?",
        answer: 71,
        calc: "52+19",
        explain: "52 plus 19 is 71 books. Add the tens and the ones, or add 20 and take away 1.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "Sam has 63 marbles. He gives away 27 marbles. How many marbles does Sam have left?",
        answer: 36,
        calc: "63-27",
        explain: "63 minus 27 is 36 marbles. Add back to check: 36 plus 27 is 63.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt:
          "A garden has 5 rows of carrots. Each row has 8 carrots. How many carrots are there in all?",
        answer: 40,
        calc: "5*8",
        explain: "There are 5 equal groups of 8, so 5 times 8 is 40 carrots.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "9 red balloons and 14 blue balloons are in the party room. How many balloons are there in all? Which equation matches the story?",
        choices: ["9 + 14 = ?", "14 - 9 = ?", "9 x 14 = ?"],
        answer: 0,
        explain: "'In all' means put the two groups together, so add 9 and 14.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "Nora has 30 beads. She uses 12 beads for a bracelet. How many beads does Nora have left? Which sentence is the question?",
        choices: [
          "Nora has 30 beads.",
          "She uses 12 beads for a bracelet.",
          "How many beads does Nora have left?",
        ],
        answer: 2,
        explain: "The question asks for something and ends with a question mark.",
      },
      {
        id: "i6",
        type: "numeric",
        prompt:
          "The library has 45 picture books and 29 chapter books. How many more picture books than chapter books are there?",
        answer: 16,
        calc: "45-29",
        explain: "The difference is 45 minus 29, which is 16. Check by counting up from 29 to 45.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A box holds 7 pencils. There are 3 boxes. Use the four steps. Write or say the equation and the answer with a label.",
        answer: "7 x 3 = 21, so there are 21 pencils.",
        explain:
          "Three equal groups of 7 is 21. Accept a drawing, counters, an equation or a spoken answer.",
      },
      {
        id: "i8",
        type: "numeric",
        prompt:
          "Challenge: A bag has 8 red marbles and 7 blue marbles. Then 5 marbles are taken out. How many marbles are left?",
        answer: 10,
        calc: "8+7-5",
        explain:
          "First put the colors together: 8 plus 7 is 15. Then take away 5: 15 minus 5 is 10 marbles.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt:
          "A farmer picks 34 apples in the morning and 28 apples in the afternoon. How many apples does the farmer pick in all?",
        answer: 62,
        calc: "34+28",
        explain: "34 plus 28 is 62 apples.",
      },
      {
        id: "f2",
        type: "choice",
        prompt:
          "A baker had 20 cookies. 8 cookies were eaten. A student says 12 cookies are left. Does that make sense?",
        choices: [
          "Yes, because 20 minus 8 is 12.",
          "No, because the answer should be more than 20.",
          "No, because the answer should be 28.",
        ],
        answer: 0,
        explain: "20 minus 8 is 12, and 12 plus 8 is 20. The answer fits the story.",
      },
      {
        id: "f3",
        type: "numeric",
        prompt:
          "There are 3 plates with 5 cookies on each plate. How many cookies are there in all?",
        answer: 15,
        calc: "3*5",
        explain: "Three equal groups of 5 is 15 cookies.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you solve a word problem.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "A basket has 25 oranges. 17 more oranges are added. How many oranges are in the basket?",
        answer: 42,
        calc: "25+17",
        explain: "25 plus 17 is 42 oranges.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt:
          "A teacher has 50 stickers. She gives away 23. How many stickers does she have left?",
        answer: 27,
        calc: "50-23",
        explain: "50 minus 23 is 27 stickers.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Say or write the four steps you use for a word problem. You may draw them instead.",
        answer: "Read, draw, write an equation and solve, then check.",
        explain: "Accept any clear telling of the four steps, in words, drawings or speech.",
      },
    ],
    successCriteria: [
      "I found the question and the key facts.",
      "My equation matches the story.",
      "I checked my answer.",
    ],
  },
  answerKey: {
    notes:
      "Accept any equivalent way of showing the thinking: counters, a tape diagram, a number line jump, an equation or an oral explanation. For numeric items look for the correct number with a label. For short items the thinking matters more than the sentence. Never mark a student down for how they show the thinking when the thinking is correct; record which supports were helpful (tape diagram, counters, audio) so the teacher can plan next steps. Record support use by activity, not by student name, in any shared sheet.",
    items: {
      g1: "39 stickers. 24 plus 15 is 39, because the two parts are put together.",
      g2: "18 pencils. 36 minus 18 is 18, because 18 are given out from the whole.",
      g3: "24 students. 4 equal groups of 6 is 4 times 6, which is 24.",
      g4: "17 more pages. 45 minus 28 is 17, the difference between the two numbers.",
      i1: "71 books. 52 plus 19 is 71.",
      i2: "36 marbles. 63 minus 27 is 36.",
      i3: "40 carrots. 5 rows of 8 is 5 times 8, which is 40.",
      i4: "9 + 14 = ?. The answer is 23 balloons.",
      i5: "How many beads does Nora have left?",
      i6: "16 more picture books. 45 minus 29 is 16.",
      i7: "7 x 3 = 21. There are 21 pencils.",
      i8: "10 marbles. 8 plus 7 is 15, and 15 minus 5 is 10.",
      f1: "62 apples. 34 plus 28 is 62.",
      f2: "Yes, because 20 minus 8 is 12.",
      f3: "15 cookies. 3 times 5 is 15.",
      e1: "42 oranges. 25 plus 17 is 42.",
      e2: "27 stickers. 50 minus 23 is 27.",
      e3: "Read, draw, write an equation and solve, then check.",
    },
  },
  extension: {
    title: "Write a problem for a friend",
    task: "Choose a topic you like, such as animals, sports or food. Write a word problem with a question and two key facts. Add one extra detail that is not needed. Draw the tape diagram and write the equation with the answer on a separate card. Trade with a friend, solve each other's problem, and check with a second way.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo resolver problemas de matemáticas con dibujos: leer, dibujar, escribir una ecuación y revisar.",
      vocab: [
        { en: "question", es: "pregunta", verified: true },
        { en: "total", es: "total", verified: true },
        { en: "part", es: "parte", verified: true },
        { en: "difference", es: "diferencia", verified: true },
        { en: "equation", es: "ecuación", verified: true },
        { en: "equal groups", es: "grupos iguales", verified: true },
      ],
      familyPrompt:
        "En casa, inventen un problema con cosas reales, por ejemplo 12 galletas y 5 comidas. Pida a su hijo o hija que lo dibuje con bloques y que cuente la historia en voz alta, en el idioma que prefiera.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 4 minutes. Teach with the routine and one modeled problem 10. Guided items, with choice of tool, 10. Build, draw, say or one activity 15. Exit ticket 4. Close with two students telling how they checked, 2. For a shorter session, run the guided items and one activity; the other two activities fit centers on later days.",
    misconceptions: [
      "Operation by keyword. Students see 'in all' or 'left' and pick an operation without reading. Use the tape diagram: ask 'Are parts being put together or taken away?'",
      "Using every number. Students add all the numbers they see, including extra details. Cover the extra details and ask 'Do I need this to answer the question?'",
      "Adding when the question asks how many more. Show the difference on a two-bar tape diagram and count the part that sticks out.",
      "Skipping the check. Make the check a visible step with its own box and three questions.",
      "Equal groups as addition only. Students add 6 + 4 for 4 groups of 6. Show repeated addition (6 + 6 + 6 + 6) and then the equation 4 x 6.",
    ],
    differentiation:
      "These supports are available to every learner and are chosen with the learner: a printed, audio or picture version of the problem, counters or a tape template, a choice to draw, build, say or write, a four-box checklist, and chunked tasks with one problem at a time. The target problems and the quality of reasoning are the same for everyone. The ee, dev, exp and br tiers describe how much scaffolding is on the page (frames, word bank, picture), not any student. This pack never identifies or labels a student.",
    udlNotes:
      "Representation: every problem has a text, a spoken and a picture form (UDL 2.5). Action and expression: students choose to build, draw, say or write (UDL 5.1, 7.1). Planning: the visual schedule and the four-box checklist support planning and strategy (UDL 6.2). Keep the choice real by accepting every form as correct evidence of thinking.",
    languageNotes:
      "Teach 'in all', 'each', 'left' and 'more than' with actions and objects. Keep problem sentences short. Read every problem aloud. Allow students to tell the problem in their own words before solving. No student data are stored by the Studio; evidence is class-level and anonymous.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
