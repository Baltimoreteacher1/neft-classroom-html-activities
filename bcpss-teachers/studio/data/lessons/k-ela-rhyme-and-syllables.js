// Lesson pack: Rhyme and Syllables (kindergarten ELA, phonological awareness). Oral and picture-first; no reading is required of the child.
const scene = (alt, items, bg = "plain") => ({ kind: "scene", bg, alt, items });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const dogFrog = scene("A dog and a frog side by side. Their names end with the same sound.", [
  { icon: "dog", x: 75, y: 90, s: 130, label: "dog" },
  { icon: "frog", x: 275, y: 90, s: 130, label: "frog" },
]);
const beeTree = scene("A bee next to a tree. The two names end with the same long ee sound.", [
  { icon: "bee", x: 75, y: 90, s: 130, label: "bee" },
  { icon: "tree", x: 275, y: 90, s: 130, label: "tree" },
]);
const rhymePairs = scene(
  "Three pairs of pictures in a row: bee and tree, star and car, dog and frog. Each pair has names that rhyme.",
  [
    { icon: "bee", x: 50, y: 40, s: 80 },
    { icon: "tree", x: 50, y: 170, s: 80 },
    { icon: "star", x: 200, y: 40, s: 80 },
    { icon: "car", x: 200, y: 170, s: 80 },
    { icon: "dog", x: 350, y: 40, s: 80 },
    { icon: "frog", x: 350, y: 170, s: 80 },
  ],
);
const claps = (n, alt) =>
  scene(
    alt,
    Array.from({ length: n }, (_, i) => ({
      icon: "hand",
      x: 195 + (i - (n - 1) / 2) * 110,
      y: 115,
      s: 90,
    })),
  );
const butterfly = scene(
  "A butterfly with three hands below it, one hand for each part of the word but, ter, fly.",
  [
    { icon: "butterfly", x: 180, y: 20, s: 120 },
    { icon: "hand", x: 95, y: 200, s: 70, label: "but" },
    { icon: "hand", x: 205, y: 200, s: 70, label: "ter" },
    { icon: "hand", x: 315, y: 200, s: 70, label: "fly" },
  ],
);

export default {
  id: "k-ela-rhyme-and-syllables",
  kind: "lesson",
  title: "Rhyme and Syllables",
  subtitle: "Listen for words that end the same and clap the parts of a word",
  grade: "K",
  band: "k-2",
  subject: "ela",
  duration: 30,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RF.K.2a and RF.K.2b; not mapped to a district unit sequence. Words, pictures and routines are original.",
  },
  standards: ["RF.K.2a", "RF.K.2b"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Inform"],
    domains: ["Listening", "Speaking"],
    cluster: "K",
  },
  contentObjective:
    "I can tell when two words rhyme, say a word that rhymes, and clap the syllables in a word.",
  languageObjective:
    "I can say 'cat and hat rhyme' and 'butterfly has three claps' using words I hear.",
  languageDemands: {
    functions: [
      "tell whether two words sound the same at the end",
      "say how many parts a word has",
    ],
    structures: ["___ and ___ rhyme.", "___ and ___ do not rhyme.", "___ has ___ claps."],
    discourse:
      "Whole-class echo, then a partner turn: one child says two words, the other says rhyme or not rhyme.",
    barriers: [
      "'rhyme' and 'rhythm' sound almost the same and are both new",
      "'end' and 'beginning' are position words that need a hand or finger to show them",
      "'syllable' is a long word for a small idea, so the lesson calls it a clap",
      "children hear the first sound (cat, cow) and think the words rhyme",
      "home-language words for the same pictures may not rhyme in English, for example 'perro' for dog",
    ],
    oralRehearse: [
      "Dog and frog rhyme.",
      "Cat and cow do not rhyme.",
      "Butterfly has three claps.",
    ],
    writeScaffold:
      "No writing is required. A grown-up may write the child's sentence: ___ and ___ rhyme.",
  },
  vocab: {
    collection: "k-ela-rhyme-and-syllables",
    ids: [
      "rhyme",
      "rhythm",
      "syllable",
      "clap",
      "sound",
      "ending-sound",
      "word",
      "same",
      "different",
      "pair",
      "listen",
    ],
  },
  launch: {
    title: "Listen and look: two words that end the same",
    visual: dogFrog,
    prompts: [
      "Look at the dog and the frog. Say the names slowly with me: dog, frog.",
      "Listen to the end of each word. What do you hear that is the same?",
      "Now say dog and cat. Do the ends sound the same or different?",
    ],
    teacherNote:
      "Hold up the picture and say the two words twice, stretching the ending: do-og, fro-og. Slide a finger from the left of the word to the right so children see where the end is. Accept any honest noticing ('they both have o'). Do not name the word 'rhyme' until children have heard three pairs; then give it as the name for the same-ending feeling. Keep the pace slow: this is an ears lesson, not an eyes lesson.",
  },
  teach: {
    model: [
      "A rhyme is two words that sound the same at the end. Dog and frog rhyme because they both end with og. Say them with a slow stretch so children can hear the ending.",
      "Rhyming is about the end of the word and never the start. Cat and cow begin the same, but they do not rhyme. Cat and hat begin differently and do rhyme. Use the finger slide: start at the beginning, slide to the end, then listen to the end only.",
      "A syllable is one beat of a word, and we find it by clapping. Dog is one clap. Rabbit is two claps: rab, bit. Butterfly is three claps: but, ter, fly. Put a hand under the chin and feel the jaw drop once for each beat.",
      "Model one of each, then invite children to echo. I do: cat, hat, they rhyme. We do: bee, tree. You do: star, car. Then I do: rabbit has two claps. We do: butterfly. You do: elephant.",
    ],
    moves: [
      "Say each pair twice, slowly, and let children echo before you ask any question.",
      "Use a finger slide from left to right across the air to show beginning and end.",
      "Use one picture card per word so children can touch the thing they are naming.",
      "Say 'Do they rhyme?' and let children answer with a thumb up for rhyme and a flat hand for not rhyme.",
      "When a child says a word that does not rhyme, repeat both words and ask 'Do the ends sound the same?' before you say whether it rhymes.",
      "Accept nonsense rhymes for the second part: 'cat, zat' rhymes even though zat is not a word, and it shows the child hears the ending.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: "Listen: bee, tree. Do the two words rhyme?",
      choices: ["Yes, they rhyme.", "No, they do not rhyme."],
      answer: 0,
      hint: "Say both words slowly and listen to the end of each.",
      supports: {
        ee: {
          frames: ["___ and ___ rhyme."],
          wordBank: ["bee", "tree", "rhyme"],
          visual: beeTree,
          oral: "Point to the bee, then the tree. Say each word. Give a thumb up if the ends match.",
        },
        dev: { frames: ["___ and ___ rhyme.", "They end the same."], wordBank: ["rhyme", "end"] },
        exp: { frames: ["___ and ___ rhyme because the ends sound the same."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Listen: cat, cow. Do the two words rhyme?",
      choices: ["Yes, they rhyme.", "No, they do not rhyme."],
      answer: 1,
      hint: "Both words start with the same sound. Does the end sound the same too?",
      supports: {
        ee: {
          frames: ["___ and ___ do not rhyme."],
          wordBank: ["cat", "cow", "not rhyme"],
          oral: "Say cat slowly. Say cow slowly. Is the end the same? Show a flat hand if it is not.",
        },
        dev: {
          frames: ["___ and ___ do not rhyme.", "The ends are different."],
          wordBank: ["different", "end"],
        },
        exp: { frames: ["___ and ___ do not rhyme because the ends are different."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "Which word rhymes with star: car or sun?",
      choices: ["car", "sun"],
      answer: 0,
      hint: "Listen to the end of star, then listen to the end of each choice.",
      supports: {
        ee: {
          frames: ["Star and ___ rhyme."],
          wordBank: ["star", "car", "sun"],
          oral: "Say star. Say car. Say sun. Which one ends like star?",
        },
        dev: { frames: ["Star and ___ rhyme."], wordBank: ["rhyme", "end"] },
        exp: { frames: ["Star and ___ rhyme because they both end with ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "numeric",
      prompt: "Clap the word rabbit. How many claps?",
      answer: 2,
      hint: "Say the word slowly and clap each time your chin drops.",
      supports: {
        ee: {
          frames: ["Rabbit has ___ claps."],
          wordBank: ["clap", "one", "two", "three"],
          visual: claps(2, "Two open hands in a row, one clap for each part of the word rabbit."),
          oral: "Say rab-bit with me and clap on each part.",
        },
        dev: { frames: ["Rabbit has ___ claps."], wordBank: ["syllable", "clap"] },
        exp: { frames: ["Rabbit has ___ syllables because I clapped ___ times."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "numeric",
      prompt: "Clap the word butterfly. How many claps?",
      answer: 3,
      hint: "Break the word into parts the way you break a cracker: but, then the next piece, then the last piece.",
      supports: {
        ee: {
          frames: ["Butterfly has ___ claps."],
          wordBank: ["clap", "three", "but", "ter", "fly"],
          visual: butterfly,
          oral: "Look at the three hands. Say but, ter, fly and clap once for each.",
        },
        dev: { frames: ["Butterfly has ___ claps."], wordBank: ["syllable", "three"] },
        exp: { frames: ["Butterfly has three syllables: but, ter, fly."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Partner listening game: rhyme or not rhyme",
    task: "Partners sit knee to knee with a stack of picture cards face down. Partner A turns over two cards and says both names slowly. Partner B gives a thumb up for rhyme or a flat hand for not rhyme and says the sentence. Then both partners clap the syllables of one card together. Swap roles after four pairs. The teacher circulates and listens for children who judge by the first sound.",
    roles: ["Card turner", "Listener"],
    discussionCards: [
      {
        prompt: "Say both words slowly. Do the ends sound the same?",
        frame: "___ and ___ rhyme.",
      },
      {
        prompt: "Can you say another word that ends like the first word?",
        frame: "___ and ___ rhyme. A new word is ___.",
      },
      {
        prompt: "How many claps does this word have? Clap it with your partner.",
        frame: "___ has ___ claps.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: three pairs that rhyme",
      visualOrModel: rhymePairs,
      teacherNote:
        "Put the three pairs on the board as picture cards. Point to each pair and have children say the two names with a long stretch on the ending. Then mix one card from two different pairs, for example bee and star, and ask 'Do they rhyme?' so children contrast a rhyme with a non-rhyme.",
    },
    discuss: {
      title: "Say it: rhyme or not rhyme",
      structure:
        "Turn and talk. Partner 1 says two words. Partner 2 says whether they rhyme and why by pointing to the end of the word with a finger slide. Swap.",
      frames: [
        "___ and ___ rhyme.",
        "___ and ___ do not rhyme.",
        "The ends sound the same.",
        "The ends sound different.",
      ],
    },
    apply: {
      title: "Use it: make a rhyme and clap it",
      task: "Choose one picture card. Say its name and say a word that rhymes with it. A made-up word is fine. Then clap the syllables of both words and say how many claps each has.",
      successCriteria: [
        "I say two words that end the same.",
        "I clap the parts of each word.",
        "I say how many claps each word has.",
      ],
    },
  },
  activities: [
    { engine: "visual-match", id: "k-ela-rhyme-pairs" },
    { engine: "early-sort", id: "k-ela-rhyme-listen" },
    { engine: "early-sort", id: "k-ela-syllable-clap" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "Listen: dog, frog. Do they rhyme?",
        choices: ["Yes, they rhyme.", "No, they do not rhyme."],
        answer: 0,
        explain: "Dog and frog both end with og.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Listen: fish, dish. Do they rhyme?",
        choices: ["Yes, they rhyme.", "No, they do not rhyme."],
        answer: 0,
        explain: "Fish and dish both end with ish.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Listen: bus, bee. Do they rhyme?",
        choices: ["Yes, they rhyme.", "No, they do not rhyme."],
        answer: 1,
        explain: "Bus and bee start the same, but the ends are different.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which word rhymes with rain: train or ring?",
        choices: ["train", "ring"],
        answer: 0,
        explain: "Rain and train both end with ain.",
      },
      {
        id: "i5",
        type: "numeric",
        prompt: "Clap the word banana. How many claps?",
        answer: 3,
        explain: "Ba, na, na is three claps.",
      },
      {
        id: "i6",
        type: "numeric",
        prompt: "Clap the word sun. How many claps?",
        answer: 1,
        explain: "Sun has only one beat, so it has one clap.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Say a word that rhymes with cat. A made-up word is fine. Then say how many claps your word has.",
        answer: "Any word that ends with at, such as hat, mat or zat, with the right clap count.",
        explain:
          "Cat ends with at, so a rhyme ends with at too. Hat, mat and bat each have one clap.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Listen: moon, spoon. Do they rhyme?",
        choices: ["Yes, they rhyme.", "No, they do not rhyme."],
        answer: 0,
        explain: "Moon and spoon both end with oon.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which word does not rhyme with cake: lake or cat?",
        choices: ["lake", "cat"],
        answer: 1,
        explain:
          "Cake and lake both end with ake. Cat starts like cake, but the ends are different.",
      },
      {
        id: "f3",
        type: "numeric",
        prompt: "Clap the word elephant. How many claps?",
        answer: 3,
        explain: "El, e, phant is three claps.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what your ears can do with rhymes and claps.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Listen: car, jar. Do they rhyme?",
        choices: ["Yes, they rhyme.", "No, they do not rhyme."],
        answer: 0,
        explain: "Car and jar both end with ar.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt: "Clap the word turtle. How many claps?",
        answer: 2,
        explain: "Tur, tle is two claps.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Tell a grown-up two words that rhyme. Say: ___ and ___ rhyme.",
        answer: "Two words that end the same, said in the sentence frame.",
        explain: "The ends of the two words match.",
      },
    ],
    successCriteria: [
      "I listened to the end of the words.",
      "I clapped one time for each part of a word.",
      "I said a sentence about two words.",
    ],
  },
  answerKey: {
    notes:
      "Every item is read aloud by the teacher and answered orally or with a thumb or hand signal. Judge rhymes by the ending sound only. Accept made-up rhymes in the short items. When a child claps once for the whole word or once per letter, model the chin-drop clap and let the child try again. Record which items a child needed help with, not a score.",
    items: {
      g1: "Yes. Bee and tree both end with the long ee sound.",
      g2: "No. Cat and cow begin the same but the ends are different.",
      g3: "Car. Star and car both end with ar.",
      g4: "Two claps: rab, bit.",
      g5: "Three claps: but, ter, fly.",
      i1: "Yes. Dog and frog both end with og.",
      i2: "Yes. Fish and dish both end with ish.",
      i3: "No. Bus and bee both start with b, but the ends are different.",
      i4: "Train. Rain and train both end with ain.",
      i5: "Three claps: ba, na, na.",
      i6: "One clap: sun.",
      i7: "Any word that ends with at (hat, mat, bat, sat) or a made-up word like zat. The clap count must match the word said.",
      f1: "Yes. Moon and spoon both end with oon.",
      f2: "Cat does not rhyme with cake. Cake and lake both end with ake.",
      f3: "Three claps: el, e, phant.",
      e1: "Yes. Car and jar both end with ar.",
      e2: "Two claps: tur, tle.",
      e3: "Any two words with the same ending, said as 'X and Y rhyme'.",
    },
  },
  extension: {
    title: "Rhyme chain",
    task: "Start with one picture, for example a cat. Children take turns saying a word that rhymes with the one before it: cat, hat, mat, sat, bat. When someone runs out of real words, a made-up word keeps the chain going. After the chain, choose two words from it and clap them. Ask: do rhyming words always have the same number of claps? Try a few pairs, such as cat and hat (one each) and bee and tree (one each), then discuss a pair with different clap counts, such as star and guitar.",
  },
  homeLanguage: {
    es: {
      objective: "Puedo oír cuando dos palabras riman y puedo aplaudir las sílabas de una palabra.",
      vocab: [
        { en: "rhyme", es: "rima", verified: true },
        { en: "syllable", es: "sílaba", verified: true },
        { en: "clap", es: "aplaudir", verified: true },
        { en: "word", es: "palabra", verified: true },
        { en: "sound", es: "sonido", verified: true },
      ],
      familyPrompt:
        "Jueguen a las rimas en casa. Digan dos palabras en inglés, por ejemplo cat y hat, y pregunten si suenan igual al final. Después aplaudan las partes de una palabra larga, como butterfly. Las palabras en español también sirven para practicar rimas y sílabas, por ejemplo casa y masa.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 4 minutes. Teach with I do, We do, You do for rhyme and for syllables, 8 minutes. Guided practice with thumb signals, 5 minutes. Partner listening game or an activity station, 8 minutes. Exit check 3 minutes, one child at a time or in a small group. This is a listening and speaking lesson, so keep the pace slow and use many repetitions. If time is short, run the rhyme half today and the clap half tomorrow.",
    misconceptions: [
      "Same-beginning rhyme: children say cat and cow rhyme because they start alike. Slide a finger to the end of each word and ask 'Does the end sound the same?'.",
      "Rhyme and rhythm confusion: children use the two words for each other. Tap a beat for rhythm and say the ending sounds for rhyme, and give them different gestures.",
      "Letter clapping: children clap once for every letter or sound. Use the chin-drop test: the jaw drops once for each syllable, so a word like 'sun' has one drop and 'rabbit' has two.",
      "Whole-word clapping: children clap once for the whole word. Stretch the word slowly and clap on each part to show the parts are different from the whole.",
      "Same-number-of-claps assumption: children think rhyming words must have the same clap count. Compare star and guitar so children see rhyme is about the ending, not the length.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames, point to pictures, answer with a thumb or hand signal and echo the teacher before saying the sentence alone. Expanding and Bridging learners say the reason and make their own rhyme pair. All children do the same listening tasks and give the same answers; only the amount of spoken language changes. Never ask a child to read to take part.",
    languageNotes:
      "Be careful with home-language labels: a child may know the picture as 'perro' and be unable to judge rhyme with 'frog' until the English name is practiced. Always say the English name of every picture first and let children echo it before asking about rhyme. Dialect differences are not errors: accept a rhyme that rhymes in the child's own speech.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
