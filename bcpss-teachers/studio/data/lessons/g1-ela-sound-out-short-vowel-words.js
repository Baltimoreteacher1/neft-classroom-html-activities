// Lesson pack: Sound Out Short Vowel Words (grade 1 ELA, phonics). Every word is a regularly spelled one-syllable word with a short vowel.
const scene = (alt, items, bg = "plain") => ({ kind: "scene", bg, alt, items });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

/** A picture above three sound boxes, optionally with letters in the boxes. */
const boxes = (icon, alt, letters = ["", "", ""]) => ({
  kind: "shapes",
  alt,
  w: 480,
  h: 320,
  items: [
    { t: "icon", name: icon, x: 190, y: 10, s: 110 },
    ...[50, 185, 320].flatMap((x, i) => [
      { t: "rect", x, y: 150, w: 110, h: 110, rx: 10, fill: "paper", stroke: "navy", sw: 4 },
      ...(letters[i]
        ? [
            {
              t: "text",
              x: x + 55,
              y: 228,
              text: letters[i],
              size: 72,
              weight: 700,
              fill: i === 1 ? "coral" : "navy",
            },
          ]
        : []),
    ]),
  ],
});

const pigEmpty = boxes("pig", "A pig picture above three empty sound boxes in a row.");
const pigFull = boxes(
  "pig",
  "A pig picture above three sound boxes holding the letters p, i and g.",
  ["p", "i", "g"],
);
const sunFull = boxes(
  "sun",
  "A sun picture above three sound boxes holding the letters s, u and n.",
  ["s", "u", "n"],
);

const vowelRow = scene(
  "Five picture words with a short vowel: a cat, a jet, a pig, a dog and a bus. Their middle sounds are a, e, i, o and u.",
  [
    { icon: "cat", x: 20, y: 120, s: 80, label: "a" },
    { icon: "airplane", x: 110, y: 120, s: 80, label: "e" },
    { icon: "pig", x: 200, y: 120, s: 80, label: "i" },
    { icon: "dog", x: 290, y: 120, s: 80, label: "o" },
    { icon: "bus", x: 380, y: 120, s: 80, label: "u" },
  ],
);

export default {
  id: "g1-ela-sound-out-short-vowel-words",
  kind: "lesson",
  title: "Sound Out Short Vowel Words",
  subtitle:
    "Say each sound, blend them and check the word in short vowel words like cat, pig and sun",
  grade: "1",
  band: "k-2",
  subject: "ela",
  duration: 35,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RF.1.2c, RF.1.2d and RF.1.3b; not mapped to a district unit sequence. Words, pictures and the story are original.",
  },
  standards: ["RF.1.2c", "RF.1.2d", "RF.1.3b"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Inform"],
    domains: ["Listening", "Speaking", "Reading"],
    cluster: "1",
  },
  contentObjective:
    "I can sound out and blend words with a short vowel in the middle, like cat, pig and sun.",
  languageObjective:
    "I can say 'The first sound is __, the middle sound is __, the last sound is __' and 'I blended the sounds to read __'.",
  languageDemands: {
    functions: ["tell the sounds in a word in order", "explain how a word was read"],
    structures: [
      "The first sound is ___. The middle sound is ___. The last sound is ___.",
      "I blended ___, ___, ___ to read ___.",
      "___ has a short ___.",
    ],
    discourse:
      "Whole-class echo of each sound, then a partner turn: Partner A sounds out a card word, Partner B blends it and says the word.",
    barriers: [
      "'short' describes a vowel sound, not the length of a word, so 'short vowel' can sound like 'short word'",
      "vowel letter names (ay, ee, eye) differ from the short sounds the lesson needs",
      "'sound' and 'letter' are used for different things but children use them as one",
      "short e and short i sound close together in many voices, so pen and pin may sound alike",
      "'blend' is also an everyday word (blend a smoothie) so the picture of pushing sounds together matters",
    ],
    oralRehearse: [
      "The first sound is p. The middle sound is i. The last sound is g.",
      "I blended p, i, g to read pig.",
    ],
    writeScaffold:
      "Write the word, then draw three sound boxes under it and write one letter in each box.",
  },
  vocab: {
    collection: "g1-ela-sound-out-short-vowel-words",
    ids: [
      "sound",
      "letter",
      "vowel",
      "consonant",
      "short-vowel",
      "sound-out",
      "blend",
      "cvc-word",
      "sound-box",
      "word",
      "read",
      "check",
    ],
  },
  launch: {
    title: "Notice and Wonder: a pig and three boxes",
    visual: pigEmpty,
    prompts: [
      "What do you notice about the picture and the boxes?",
      "What do you wonder about the three boxes?",
      "Say the picture's word slowly. How many sounds do you hear?",
    ],
    teacherNote:
      "Show the picture only. Take two noticings ('there are three boxes', 'there is a pig') and one wondering. Then say pig slowly with a finger touching one box for each sound: p, i, g. Ask how many sounds there are and how many boxes. Do not write the letters yet. The point of the launch is that a spoken word is a string of separate sounds children can count before they see any letters.",
  },
  teach: {
    model: [
      "Every word is made of sounds, and we can count them. The word pig has three sounds: p, i, g. We put one sound in each sound box and move from left to right. Say the word slowly with your finger touching each box.",
      "Letters stand for sounds. The letters a, e, i, o and u are vowels, and every word needs a vowel. In a short vowel word the vowel makes a quick sound and sits in the middle: cat, jet, pig, dog and bus. The other letters are consonants and sit on each side. A word that goes consonant, vowel, consonant is a CVC word.",
      "To read a CVC word, do three things. First sound out: put a finger under each letter and say its sound, p, i, g. Then blend: slide the finger under the whole word and push the sounds together, pig. Then check: ask whether the word makes sense with the picture or the sentence.",
      "Change one sound and you make a new word. Cat becomes cot becomes cut when only the middle sound changes. Ask which sound moved and which boxes stayed the same. This shows children the middle box is where the work is.",
      "Some pairs are tricky. Short e and short i are close, so pen and pin can sound alike. Use the picture words egg and igloo to compare. The letters b and d face opposite ways, so check which way the belly faces before you say the sound.",
    ],
    moves: [
      "Keep picture cards and sound boxes on the table: one counter or finger touch for each sound.",
      "Use the anchor words apple, egg, igloo, octopus and umbrella for the five short vowels, and keep the five pictures on the wall.",
      "Always say the three steps in the same order: sound out, blend, check.",
      "Have children blend by sliding a finger under the whole word instead of tapping each letter again.",
      "When a child guesses from the first letter, cover the rest of the word and uncover one letter at a time.",
      "Say the vowel sound, never the vowel name, in a short vowel word, and let children copy your mouth shape.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt: "Say pig slowly. How many sounds are in the word pig?",
      answer: 3,
      hint: "Put a finger on one box for each sound you say.",
      supports: {
        ee: {
          frames: ["Pig has ___ sounds."],
          wordBank: ["sound", "box", "three"],
          visual: pigEmpty,
          oral: "Say pig slowly. Touch one box for each sound.",
        },
        dev: {
          frames: ["Pig has ___ sounds because I touched ___ boxes."],
          wordBank: ["sound box"],
        },
        exp: { frames: ["Pig has three sounds, so it needs three sound boxes."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Which letter is the vowel in the word sun?",
      choices: ["s", "u", "n"],
      answer: 1,
      hint: "A vowel is one of a, e, i, o and u. Look at each letter.",
      supports: {
        ee: {
          frames: ["The vowel is ___."],
          wordBank: ["vowel", "letter", "middle"],
          visual: sunFull,
          oral: "Point to the letter in the middle box. Is it a vowel?",
        },
        dev: {
          frames: ["The vowel in sun is ___.", "It is in the middle."],
          wordBank: ["vowel", "consonant"],
        },
        exp: { frames: ["The vowel in sun is ___ because it is one of a, e, i, o, u."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt: "Sound out the letters c, a, t. Blend the sounds. What word did you read?",
      answer: "cat",
      hint: "Say each sound on its own, then slide them together without a gap.",
      supports: {
        ee: {
          frames: ["I blended ___, ___, ___. The word is ___."],
          wordBank: ["blend", "sound out", "word"],
          oral: "Point under each letter and say its sound. Then slide your finger under all three letters.",
        },
        dev: { frames: ["I blended ___ to read ___."], wordBank: ["blend", "check"] },
        exp: { frames: ["I sounded out ___, ___, ___ and blended them to read ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Look at the picture of the pig. Which word names it: peg, pig or pug?",
      choices: ["peg", "pig", "pug"],
      answer: 1,
      hint: "Sound out each word. Which one has the same middle sound as the picture?",
      supports: {
        ee: {
          frames: ["The word is ___."],
          wordBank: ["pig", "peg", "pug", "middle"],
          visual: pigFull,
          oral: "Say the picture's word. Listen to the middle. Then sound out each choice.",
        },
        dev: {
          frames: ["The word is ___ because the middle sound is ___."],
          wordBank: ["check", "middle"],
        },
        exp: { frames: ["I checked the word with the picture, and the middle sound ___ matches."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "choice",
      prompt: "Which of these words does not have the short a sound: cap, map or cup?",
      choices: ["cap", "map", "cup"],
      answer: 2,
      hint: "Say each word slowly and listen to the middle sound. Two of them sound the same.",
      supports: {
        ee: {
          frames: ["___ does not have the short a sound."],
          wordBank: ["cap", "map", "cup", "middle sound"],
          visual: vowelRow,
          oral: "Say each word. Listen to the middle sound. Which one is different?",
        },
        dev: {
          frames: ["___ has a different middle sound.", "The other two have a short ___."],
          wordBank: ["different", "same"],
        },
        exp: { frames: ["___ is the odd one because its middle sound is ___, not short a."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Partner sound-box reading",
    task: "Partners share a stack of CVC picture cards and a mat with three sound boxes. Partner A turns over a card, says the picture's word slowly and pushes one counter into a box for each sound. Partner B puts one letter tile in each box and slides a finger under the letters to blend them. Together they say the word and check it against the picture. Swap roles after four cards. The teacher listens for children who say the vowel's name instead of its short sound.",
    roles: ["Sound pusher", "Letter placer"],
    discussionCards: [
      {
        prompt: "What sound is in the middle box? Which letter is it?",
        frame: "The middle sound is ___. The letter is ___.",
      },
      {
        prompt: "Sound out the word with your finger. What word did you blend?",
        frame: "I blended ___, ___, ___ to read ___.",
      },
      {
        prompt: "Does your word match the picture? How do you know?",
        frame: "I checked ___ with the picture, and it ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: sounds in boxes",
      visualOrModel: pigFull,
      teacherNote:
        "Place a word-building mat beside the picture. Show p, i, g tiles in the boxes, then change only the middle tile to u and read the new word: pig becomes pug. Ask what changed. Children see that the vowel decides which word you read.",
    },
    discuss: {
      title: "Say it: sounds and blends",
      structure:
        "Turn and talk. Partner 1 touches the three boxes and says the sounds. Partner 2 blends them and says the word. Both check the word with the picture. Swap.",
      frames: [
        "The first sound is ___.",
        "The middle sound is ___.",
        "I blended ___ to read ___.",
        "Does it match the picture?",
      ],
    },
    apply: {
      title: "Use it: read and check a short story",
      task: "Open the activity 'Sam and the Hen'. Read each sentence by sounding out words you do not know. Tap the sentences that prove your answers. Then choose the claim that your proof supports.",
      successCriteria: [
        "I sound out a word one sound at a time.",
        "I blend the sounds to say the word.",
        "I check that the word makes sense in the sentence.",
        "I use a sentence from the story to show my thinking.",
      ],
    },
  },
  activities: [
    { engine: "early-sort", id: "g1-ela-short-vowel-sort" },
    { engine: "concept-builder", id: "g1-ela-sound-boxes" },
    { engine: "language-detective", id: "g1-ela-sam-and-the-hen" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt: "How many sounds are in the word map?",
        answer: 3,
        explain: "M, a, p are three sounds, so the word needs three sound boxes.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Which word has the short u sound: top, tub or tap?",
        choices: ["top", "tub", "tap"],
        answer: 1,
        explain: "Tub has a u in the middle. Top has o and tap has a.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Cat changes to cot. Which sound changed?",
        choices: ["the first sound", "the middle sound", "the last sound"],
        answer: 1,
        explain:
          "The c and the t stayed the same. Only the vowel in the middle changed from a to o.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which one is a CVC word: bag, stop or play?",
        choices: ["bag", "stop", "play"],
        answer: 0,
        explain: "Bag is consonant, vowel, consonant. Stop and play start with two consonants.",
      },
      {
        id: "i5",
        type: "short",
        prompt: "Sound out and blend these letters: j, e, t. Write the word you read.",
        answer: "jet",
        explain: "J, e, t blended together says jet.",
      },
      {
        id: "i6",
        type: "short",
        prompt: "Sound out and blend these letters: l, o, g. Then say a sentence with the word.",
        answer: "log, with a sentence that uses the word, such as 'The frog sat on a log.'",
        explain: "L, o, g blended together says log.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Write one word with a short i in the middle. Draw three sound boxes and put a letter in each box.",
        answer:
          "Any CVC word with i in the middle, such as pin, lid, sit or kid, with one letter in each box.",
        explain:
          "A short i word has a consonant, then i, then a consonant, so each box holds one letter.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Which word says bug: bag, bug or big?",
        choices: ["bag", "bug", "big"],
        answer: 1,
        explain: "B, u, g blended together says bug.",
      },
      {
        id: "f2",
        type: "numeric",
        prompt: "How many sounds are in the word dog?",
        answer: 3,
        explain: "D, o, g are three sounds.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Blend these letters: h, a, t. What is the word?",
        answer: "hat",
        explain: "H, a, t blended together says hat.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can do with short vowel words.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Which word says sun: sin, sun or son?",
        choices: ["sin", "sun", "son"],
        answer: 1,
        explain: "S, u, n blended together says sun.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt: "How many sounds are in the word bed?",
        answer: 3,
        explain: "B, e, d are three sounds.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Tell the three steps you use to read a word you do not know.",
        answer: "Sound out each letter, blend the sounds, and check that the word makes sense.",
        explain: "The steps are sound out, blend, check.",
      },
    ],
    successCriteria: [
      "I said one sound for each letter.",
      "I blended the sounds to read the word.",
      "I checked that the word made sense.",
    ],
  },
  answerKey: {
    notes:
      "Most items are answered orally. Accept 'sound out, blend, check' in any child-friendly words for the process items, such as 'say the sounds, push them together, see if it is right'. When a child says a vowel's name instead of its short sound, model the short sound and ask the child to copy your mouth. Dialect note: accept pen and pin that sound alike in a child's own speech when the letters are read correctly.",
    items: {
      g1: "Three sounds: p, i, g.",
      g2: "The letter u. It is the vowel in the middle of sun.",
      g3: "Cat. C, a, t blended together says cat.",
      g4: "Pig. The middle sound is short i.",
      g5: "Cup. Cap and map both have a short a; cup has a short u.",
      i1: "Three sounds: m, a, p.",
      i2: "Tub. It has a short u; top has short o and tap has short a.",
      i3: "The middle sound changed from a to o.",
      i4: "Bag. It is consonant, vowel, consonant.",
      i5: "Jet.",
      i6: "Log, in a sentence that uses the word.",
      i7: "Any CVC word with i in the middle, with one letter in each of three boxes.",
      f1: "Bug. B, u, g blended together.",
      f2: "Three sounds: d, o, g.",
      f3: "Hat.",
      e1: "Sun.",
      e2: "Three sounds: b, e, d.",
      e3: "Sound out each letter, blend the sounds, and check that the word makes sense.",
    },
  },
  extension: {
    title: "Word chain: change one sound",
    task: "Start with the word cat on a word-building mat. Change only the first sound to make hat, then change only the last sound to make ham, then change only the middle sound to make him. Write each new word and read the whole chain aloud. Then build your own chain of at least four words, changing only one sound each time, and tell a partner which sound you changed at each step.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo decir cada sonido de una palabra corta, juntar los sonidos y leer la palabra.",
      vocab: [
        { en: "sound", es: "sonido", verified: true },
        { en: "letter", es: "letra", verified: true },
        { en: "vowel", es: "vocal", verified: true },
        { en: "consonant", es: "consonante", verified: true },
        { en: "word", es: "palabra", verified: true },
        { en: "read", es: "leer", verified: true },
      ],
      familyPrompt:
        "Escojan una palabra corta en inglés, como cat o sun. Pídanle a su hijo o hija que diga cada sonido, que junte los sonidos y que diga la palabra. Después cambien un solo sonido para hacer una palabra nueva, por ejemplo cat y hat.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach 10 minutes with the sound boxes and the five anchor words. Guided practice 6 minutes. Partner sound-box reading or the activity stations 10 minutes. Exit ticket 4 minutes. If time is short, run the sound boxes activity today and the short vowel sort and the story another day.",
    misconceptions: [
      "Vowel name instead of vowel sound: children say 'eye' for i or 'ay' for a. Replace the name with the anchor word sound (igloo, apple).",
      "Guessing from the first letter and the picture: children say 'pig' for pen. Cover the word and reveal one letter at a time so every letter takes a turn.",
      "Dropped final sound: children read cat as ca. Count the boxes and ask what is in the last box.",
      "Sounds said with extra vowels: children say 'puh-ih-guh'. Practice clipped consonants and blend with a slide.",
      "Short e and short i confusion: pen and pin sound alike. Compare with egg and igloo and watch the mouth: e is wider than i.",
      "b and d reversal: children read bad as dab. Have children make a b with the hand (belly right) and check which way the belly faces.",
    ],
    differentiation:
      "Entering and Emerging learners use the sound boxes with counters and letter tiles, the vowel picture wall and the frames, and read words in the same set as everyone else. Expanding and Bridging learners explain how they checked the word and build word chains. The words and the answers are the same at every tier; only the oral language support changes.",
    languageNotes:
      "Check the home-language sound system before assuming an error. Spanish vowels are each one steady sound, and English short vowels such as the a in cat and the u in sun have no exact match, so they are real new sounds for many children. Treat a hard-to-hear short vowel as a language gap, not a reading problem, and give extra listening practice.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
