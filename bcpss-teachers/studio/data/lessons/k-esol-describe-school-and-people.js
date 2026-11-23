// Lesson pack: Describe School and People (Kindergarten ESOL). Picture-first, oral language first; every item is read aloud by the teacher. Original content.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const classroom = {
  kind: "scene",
  bg: "room",
  w: 480,
  h: 320,
  alt: "A classroom with a chalkboard, a teacher, a student and two desks.",
  longDesc:
    "A school room. A chalkboard hangs on the wall, a teacher stands near it, a student stands near a desk and a second desk is on the floor.",
  items: [
    { icon: "chalkboard", x: 30, y: 20, s: 120 },
    { icon: "teacher", x: 190, y: 70, s: 110 },
    { icon: "desk", x: 330, y: 180, s: 100 },
    { icon: "student", x: 330, y: 70, s: 100 },
    { icon: "desk", x: 60, y: 190, s: 100 },
  ],
};

const bigSmall = {
  kind: "scene",
  bg: "plain",
  w: 480,
  h: 320,
  alt: "A big backpack on the left and a small backpack on the right.",
  items: [
    { icon: "backpack", x: 40, y: 30, s: 250 },
    { icon: "backpack", x: 340, y: 180, s: 90 },
  ],
};

const frameMap = {
  kind: "table",
  alt: "A table with three sentence starters for telling about a picture: I see, This is my, and It is.",
  longDesc:
    "Three rows. 'I see a ___' tells what you see. 'This is my ___' tells about your person or thing. 'It is ___' tells how it looks: big or small.",
  head: ["Say this", "To tell"],
  rows: [
    ["I see a ___.", "What you see"],
    ["This is my ___.", "Who or what it is"],
    ["It is ___.", "How it looks: big or small"],
  ],
};

export default {
  id: "k-esol-describe-school-and-people",
  kind: "lesson",
  title: "Describe School and People",
  subtitle:
    "Name and tell about people and things at school using 'I see', 'This is my' and 'It is'",
  grade: "K",
  band: "k-2",
  subject: "esol",
  duration: 30,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to WIDA ELD-SI and CCSS Kindergarten speaking standards. Not mapped to a district unit sequence.",
  },
  standards: ["ELD-SI", "SL.K.1", "SL.K.4", "SL.K.6", "L.K.5a"],
  wida: {
    eld: ["ELD-SI"],
    klus: ["Inform"],
    domains: ["Listening", "Speaking"],
    cluster: "K",
  },
  contentObjective: "I can name people and things at school and tell one thing about them.",
  languageObjective:
    "I can describe a picture by saying 'I see a ___' and 'It is big' or 'It is small'.",
  languageDemands: {
    functions: ["name familiar people and objects", "describe size", "take a turn in a short talk"],
    structures: ["I see a ___.", "This is my ___.", "It is big. It is small."],
    discourse:
      "A short two-turn talk with a partner or the teacher: one child tells, the other listens and says one word back.",
    barriers: [
      "'a' before a noun is new for some home languages that do not use articles",
      "'big' and 'small' depend on what you compare",
      "'teacher' and 'student' sound alike in some words and are easily swapped",
      "'He' and 'she' do not exist in some home languages",
    ],
    oralRehearse: [
      "I see a teacher.",
      "This is my backpack. It is big.",
      "I see a student at a desk.",
    ],
    writeScaffold:
      "Draw a picture of a person or a thing at school. Tell about it: I see a ___. It is ___.",
  },
  vocab: {
    collection: "k-esol-describe-school-and-people",
    ids: [
      "school",
      "classroom",
      "teacher",
      "student",
      "friend",
      "book",
      "pencil",
      "backpack",
      "desk",
      "bus",
      "big",
      "small",
    ],
  },
  launch: {
    title: "Look and talk: our classroom",
    visual: classroom,
    prompts: [
      "What do you see in this room?",
      "Who is in the room?",
      "What is big? What is small?",
    ],
    teacherNote:
      "Show the picture and wait. Accept any language, a point or a word. Repeat what a child says in a full English sentence ('Yes, I see a teacher') and move on without correcting. Aim for at least five children saying something before you teach any words. Then point and name each person and thing, and have children echo it with a gesture.",
  },
  teach: {
    model: [
      "Say the word and point. 'Teacher.' Children echo and point. Do the same with student, desk, book, pencil, backpack and bus. Use a real object or the picture for each one.",
      "Teach the sentence starter 'I see a ___.' Point to the picture and say 'I see a teacher.' Children echo. Pass around a real pencil and let each child say 'I see a pencil.'",
      "Teach 'This is my ___.' Hold up your own backpack and say 'This is my backpack.' Children hold up their own and say it. This builds the idea that 'my' means it belongs to me.",
      "Teach big and small with two objects of different sizes. Say 'It is big.' Stretch your arms wide. Say 'It is small.' Pinch your fingers. Then show the big and small backpack picture and have children say both sentences.",
      "Put the sentences together: 'I see a backpack. It is big.' Model it twice. Then children turn to a partner and take turns. Listen for any attempt, and say the full sentence back warmly.",
    ],
    moves: [
      "Always pair the word with a gesture, a picture or a real object. Wait at least five seconds before you help.",
      "Use choral echo first, partner talk second and individual talk third. Never ask a child to speak alone first.",
      "Give two choices when a child hesitates: 'Is it big or small?' Accept pointing.",
      "Repeat the child's idea in a full sentence. Do not ask the child to repeat it again.",
      "Welcome home language: ask a child to say the word in their language, then everyone says it in English.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "Listen. Which word names the grown-up who helps you learn at school? The teacher reads the choices aloud.",
      choices: ["teacher", "backpack", "pencil"],
      answer: 0,
      hint: "Think about the grown-up who is at the front of the room with the chalkboard.",
      supports: {
        ee: {
          frames: ["This is my ___."],
          wordBank: ["teacher", "student", "book"],
          visual: classroom,
          oral: "Point to the teacher in the picture. Say the word.",
        },
        dev: { frames: ["This is my ___. She helps me."], wordBank: ["teacher", "helps"] },
        exp: { frames: ["My ___ helps me ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "Listen. 'I read a ___ at school.' Which word fits? The teacher reads the choices aloud.",
      choices: ["book", "bus", "desk"],
      answer: 0,
      hint: "Think about what has pages and words. Say the sentence with each word.",
      supports: {
        ee: {
          frames: ["I read a ___."],
          wordBank: ["book", "pencil"],
          oral: "Pretend to read. Say the word.",
        },
        dev: { frames: ["I read a ___ at school."], wordBank: ["read"] },
        exp: { frames: ["I read a ___ in the ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt:
        "Look at the picture of the big backpack and the small backpack. Listen. Which sentence tells about the small one? The teacher reads the choices aloud.",
      choices: ["It is small.", "It is big.", "It is a bus."],
      answer: 0,
      hint: "Look at the backpack on the right. Is it the one that fills the picture?",
      supports: {
        ee: {
          frames: ["It is ___."],
          wordBank: ["big", "small"],
          visual: bigSmall,
          oral: "Show big with your arms. Show small with your fingers.",
        },
        dev: { frames: ["The ___ backpack is ___."], wordBank: ["big", "small"] },
        exp: { frames: ["The backpack on the right is ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "Tell a partner about a person or a thing in the classroom picture. Say one sentence with 'I see a ___.' The teacher writes what the child says.",
      answer: "I see a teacher.",
      hint: "Point to something in the picture first. Then say its name after the words 'I see a'.",
      supports: {
        ee: {
          frames: ["I see a ___."],
          wordBank: ["teacher", "student", "desk", "book"],
          visual: classroom,
          oral: "Point. Say the word. Then say the whole sentence.",
        },
        dev: { frames: ["I see a ___. It is ___."] },
        exp: { frames: ["I see a ___ and a ___ in the classroom."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Tell about our room",
    task: "Children sit in pairs with a classroom picture or a real corner of the room. Partner A points to a person or thing and says 'I see a ___.' Partner B finds it and says its name back. Then they switch. Pairs who are ready add 'It is big' or 'It is small'. The teacher walks around and repeats good attempts in full sentences.",
    roles: ["Teller", "Finder"],
    discussionCards: [
      {
        prompt: "What do you see? Point and tell your partner.",
        frame: "I see a ___.",
      },
      {
        prompt: "Is it big or small? Show with your hands, then say it.",
        frame: "It is ___.",
      },
      {
        prompt: "Tell about a person at school.",
        frame: "This is my ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the sentence starters",
      visualOrModel: frameMap,
      teacherNote:
        "Keep the table on the wall at child height. Point to each starter as you say it. Add a small picture next to each row once children know the words. The table is for the teacher to point to, not for children to read.",
    },
    discuss: {
      title: "Say it: tell and listen",
      structure:
        "Pair children. The teller says one sentence about a picture, and the listener says the name of the picture. Then swap. Use a talking object so only one child speaks at a time.",
      frames: ["I see a ___.", "This is my ___.", "It is ___.", "Yes! I see it too."],
    },
    apply: {
      title: "Use it: draw and tell",
      task: "Each child draws one person or thing at school, such as their teacher, a friend, a backpack or a bus. The child tells the teacher or a partner about the drawing with 'This is my ___' or 'I see a ___'. The teacher writes the child's own words under the drawing.",
      successCriteria: [
        "I named the person or thing.",
        "I said a whole sentence.",
        "I said one describing word such as big or small, or I pointed to show it.",
      ],
    },
  },
  activities: [
    { engine: "early-sort", id: "k-esol-school-sort" },
    { engine: "early-sort", id: "k-esol-describe-oral" },
    { engine: "visual-match", id: "k-esol-school-words-match" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt:
          "Listen. Which word names the grown-up who helps you learn? The teacher reads the choices aloud.",
        choices: ["teacher", "bus", "pencil"],
        answer: 0,
        explain: "A teacher is the grown-up who helps children learn at school.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Listen. Which word names something you wear on your back to carry your things?",
        choices: ["backpack", "desk", "book"],
        answer: 0,
        explain: "A backpack has two straps and goes on your back.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Listen. Which word means 'not little'?",
        choices: ["big", "small", "desk"],
        answer: 0,
        explain: "Big means large. Small means little.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Listen. 'I ride the ___ to school.' Which word fits?",
        choices: ["bus", "book", "pencil"],
        answer: 0,
        explain: "A bus is a big vehicle that takes children to school.",
      },
      {
        id: "i5",
        type: "short",
        prompt:
          "Tell about a person at school. Say one sentence that starts with 'This is my'. The teacher writes it.",
        answer: "This is my teacher.",
        explain:
          "Accept any person at school and any complete attempt, such as 'This is my friend.'",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Tell about one thing that is big and one thing that is small at school. The teacher writes it.",
        answer: "The bus is big. The pencil is small.",
        explain:
          "Accept any pair of school things that is correct, such as 'The desk is big. The pencil is small.'",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Listen. Which word is a place where children learn?",
        choices: ["school", "pencil", "bus"],
        answer: 0,
        explain: "School is the place where children go to learn.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Listen. Which sentence tells what you see? 'I see a book.' or 'I book see.'",
        choices: ["I see a book.", "I book see.", "See I book."],
        answer: 0,
        explain: "The words go in this order: I see a book.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Point to something in the room. Say 'I see a ___.' The teacher writes it.",
        answer: "I see a desk.",
        explain: "Accept any real object in the room, named in a full sentence.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can tell about school.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Listen. Which one is a person at school?",
        choices: ["student", "desk", "book"],
        answer: 0,
        explain: "A student is a child who goes to school.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "Listen. Which sentence tells about a big thing?",
        choices: ["The bus is big.", "The pencil is big.", "The crayon is big."],
        answer: 0,
        explain: "A bus is large. A pencil and a crayon are small.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Tell the teacher about one person or thing at school. Say a whole sentence.",
        answer: "This is my friend.",
        explain: "Any complete sentence that names a person or a thing at school is correct.",
      },
    ],
    successCriteria: [
      "I named a person or a thing at school.",
      "I said a whole sentence.",
      "I used big or small, or I showed it with my hands.",
    ],
  },
  answerKey: {
    notes:
      "Every item is read aloud. Accept a point, a gesture, a home-language word or a spoken English word for the multiple-choice items. For the short items accept any complete sentence that names a real person or thing at school; do not correct grammar during the task, and repeat the child's idea back in a full sentence. For the independent and exit items record the child's own words and note which structure was used: 'I see a', 'This is my' or 'It is'.",
    items: {
      g1: "Teacher.",
      g2: "Book.",
      g3: "It is small. The small backpack is the one on the right.",
      g4: "I see a teacher. Any real object or person in the picture, named in a sentence, is correct.",
      i1: "Teacher.",
      i2: "Backpack.",
      i3: "Big.",
      i4: "Bus.",
      i5: "This is my teacher. Any person at school is correct.",
      i6: "The bus is big. The pencil is small. Any correct pair is acceptable.",
      f1: "School.",
      f2: "I see a book.",
      f3: "I see a desk. Any real object in the room is acceptable.",
      e1: "Student.",
      e2: "The bus is big.",
      e3: "This is my friend. Any complete sentence about a person or thing at school is acceptable.",
    },
  },
  extension: {
    title: "Tell about my family at school",
    task: "Invite children to draw their family or a friend and tell about the picture using 'This is my ___.' Children who are ready add a describing word: 'This is my friend. She is happy.' Invite home-language words and let the class learn one new word from a classmate's language.",
  },
  homeLanguage: {
    es: {
      objective: "Puedo decir qué veo en la escuela y contar algo sobre una persona o un objeto.",
      vocab: [
        { en: "school", es: "escuela", verified: true },
        { en: "teacher", es: "maestro / maestra", verified: true },
        { en: "student", es: "estudiante", verified: true },
        { en: "friend", es: "amigo / amiga", verified: true },
        { en: "backpack", es: "mochila", verified: true },
        { en: "big", es: "grande", verified: true },
        { en: "small", es: "pequeño", verified: true },
      ],
      familyPrompt:
        "Pidan a su hijo o hija que les cuente sobre su escuela en el idioma que prefiera y luego que diga una oración en inglés, por ejemplo: This is my teacher.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 4 minutes. Teach words and sentence starters 8. Guided items 5, all oral. Partner talk or an activity 8. Draw and tell 4. Close with three children sharing, 1. One early-sort activity fits a single small group at a center; the other two run as centers across the week.",
    misconceptions: [
      "Swapping 'teacher' and 'student'. Use two pictures and ask 'Who helps? Who learns?' with gestures.",
      "'Big' and 'small' as fixed words. Always compare two things: the big bus and the small pencil.",
      "Dropping 'a': 'I see teacher.' Model the full sentence back, do not correct directly.",
      "Pointing instead of speaking. Pointing is a first step; follow it with 'What is it?' and a sentence starter.",
      "Silence. Silent periods are normal. Offer a choice of two, a gesture or a partner before moving on.",
    ],
    differentiation:
      "Entering and Emerging learners point, use one word and complete 'I see a ___' with the picture in front of them. Developing learners say a full sentence with a describing word. Expanding and Bridging learners add a second detail, such as 'I see a big yellow bus.' The tasks and the pictures are the same for every child; only the amount of speaking and the frames change.",
    languageNotes:
      "Teach words with real objects and gestures. Keep sentences very short and repeat them often. Home-language words are welcome and valued. Sound out the first sound of each word for children who are ready, but do not require reading. The activities speak every word aloud, so no child needs to read to take part.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
