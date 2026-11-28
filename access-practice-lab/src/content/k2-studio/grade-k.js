// Kindergarten starters: beginning sounds, rhyme, counting with ten frames, comparing groups, and school words for
// English learners. Picture-first: every choice a child taps carries a picture, and every question can be heard.

import {
  choice,
  directions,
  hear,
  match,
  multi,
  order,
  sort,
  starter,
  talk,
  tenFrame,
  words,
} from "./parts.js";

export const GRADE_K = [
  starter({
    id: "k-first-sounds-m-s",
    grade: "K",
    topic: "phonics",
    art: "🐒",
    minutes: 10,
    does: ["hear", "sort", "choose"],
    title: "First Sounds: m and s",
    description: "Hear the m and s sounds, then sort and pick pictures by their first sound.",
    objective: "I can hear the first sound in a word and match it to m or s.",
    standards: ["RF.K.2d", "RF.K.3a"],
    blocks: [
      directions("d1", "Listen to each word. What sound do you hear first?"),
      hear(
        "a1",
        "Hear the m and s sounds",
        "This is m. It says mmm. Moon. Mouse. Monkey. This is s. It says sss. Sun. Sock. Snake.",
      ),
      words("w1", [
        ["🌙 moon", "Moon begins with the m sound.", "luna", "I see the moon at night."],
        ["🐒 monkey", "Monkey begins with the m sound.", "mono", "The monkey climbs a tree."],
        ["☀️ sun", "Sun begins with the s sound.", "sol", "The sun is hot."],
        ["🧦 sock", "Sock begins with the s sound.", "calcetín", "I put on my sock."],
      ]),
      sort(
        "q1",
        "Sort the pictures. Does each word begin with m or with s?",
        [
          ["m", "m: mmm"],
          ["s", "s: sss"],
        ],
        [
          ["🌙 moon", "m"],
          ["🐭 mouse", "m"],
          ["🧲 magnet", "m"],
          ["☀️ sun", "s"],
          ["🧦 sock", "s"],
          ["🐍 snake", "s"],
        ],
        {
          hint: "Say the word slowly. Listen to the very first sound.",
          explanation: "Moon, mouse and magnet begin with mmm. Sun, sock and snake begin with sss.",
          skill: "first sound",
        },
      ),
      choice(
        "q2",
        "Which picture begins with the m sound?",
        ["🐶 dog", "🐒 monkey", "🐟 fish"],
        "🐒 monkey",
        {
          hint: "Say each word. Which one starts with mmm?",
          explanation: "Monkey starts with mmm. Dog starts with d and fish starts with f.",
          skill: "first sound",
        },
      ),
      choice(
        "q3",
        "Which picture begins with the s sound?",
        ["🐱 cat", "🐻 bear", "🧼 soap"],
        "🧼 soap",
        {
          hint: "Listen for the snake sound: sss.",
          explanation: "Soap starts with sss.",
          skill: "first sound",
        },
      ),
      multi(
        "q4",
        "Tap every picture that begins with the s sound.",
        ["🐍 snake", "🌙 moon", "🧦 sock", "🐒 monkey", "☀️ sun"],
        ["🐍 snake", "🧦 sock", "☀️ sun"],
        {
          hint: "There are three s pictures.",
          explanation: "Snake, sock and sun begin with sss. Moon and monkey begin with mmm.",
          skill: "first sound",
        },
      ),
    ],
    teacher:
      "K-2 starter: first sounds m and s. Model each sound first (lips together for m, teeth together for s), then let children press Hear on each question. Say the picture names together before children choose. Extend with the same steps for other letters.",
  }),
  starter({
    id: "k-rhyme-time",
    grade: "K",
    topic: "phonics",
    art: "🎩",
    minutes: 10,
    does: ["hear", "match", "choose"],
    title: "Rhyme Time",
    description: "Find words that sound the same at the end: cat and hat, goat and boat.",
    objective: "I can tell when two words rhyme.",
    standards: ["RF.K.2a"],
    blocks: [
      directions("d1", "Rhyming words sound the same at the end. Listen: cat, hat."),
      hear(
        "a1",
        "Hear some rhymes",
        "Cat. Hat. Cat and hat rhyme. Goat. Boat. Goat and boat rhyme. Cat. Dog. Cat and dog do not rhyme.",
      ),
      match(
        "q1",
        "Match the pictures that rhyme.",
        [
          ["🐱 cat", "🎩 hat"],
          ["🐝 bee", "🌳 tree"],
          ["🐐 goat", "⛵ boat"],
          ["🦊 fox", "📦 box"],
        ],
        {
          hint: "Say the two words. Do the ends sound the same?",
          explanation: "Cat and hat, bee and tree, goat and boat, fox and box all rhyme.",
          skill: "rhyme",
        },
      ),
      choice("q2", "Which word rhymes with 🐶 dog?", ["🐸 frog", "🐱 cat", "☀️ sun"], "🐸 frog", {
        hint: "Dog ends with og.",
        explanation: "Dog and frog both end with og.",
        skill: "rhyme",
      }),
      choice("q3", "Which word rhymes with 🐝 bee?", ["🐄 cow", "🍎 apple", "🔑 key"], "🔑 key", {
        hint: "Bee ends with the ee sound.",
        explanation: "Bee and key both end with the ee sound.",
        skill: "rhyme",
      }),
      multi(
        "q4",
        "Tap every word that rhymes with 🎩 hat.",
        ["🐱 cat", "🐶 dog", "🦇 bat", "🌙 moon", "🐀 rat"],
        ["🐱 cat", "🦇 bat", "🐀 rat"],
        {
          hint: "Hat ends with at. Find three more words that end with at.",
          explanation: "Cat, bat and rat rhyme with hat.",
          skill: "rhyme",
        },
      ),
    ],
    teacher:
      "K-2 starter: rhyme. Read each pair aloud with children and stretch the ending. A quick follow-up: say a word and have children give a rhyme, real or silly.",
  }),
  starter({
    id: "k-count-ten-frames",
    grade: "K",
    topic: "math",
    art: "🔟",
    minutes: 12,
    does: ["hear", "count", "choose", "order"],
    title: "Count with Ten Frames",
    description:
      "Count counters in a ten frame, find how many more make 10, and put numbers in order.",
    objective: "I can count up to 10 things and tell how many there are.",
    standards: ["K.CC.B.4", "K.CC.B.5", "K.OA.A.4"],
    template: "explore-practice",
    blocks: [
      directions("d1", "Count the counters. Touch each one as you count."),
      hear(
        "a1",
        "Count with me",
        "One, two, three, four, five. Five fills the top row. Six, seven, eight, nine, ten. Ten fills the whole frame.",
      ),
      tenFrame("f1", 7),
      choice("q1", "How many counters are in the ten frame?", ["6", "7", "8"], "7", {
        hint: "The top row has 5. Count on from 5.",
        explanation: "5 in the top row and 2 more make 7.",
        skill: "count to 10",
      }),
      choice("q2", "🍎🍎🍎🍎 How many apples?", ["3", "5", "4"], "4", {
        hint: "Touch each apple and say one number.",
        explanation: "One, two, three, four. There are 4 apples.",
        skill: "count to 10",
      }),
      tenFrame("f2", 9),
      choice("q3", "How many more counters make 10?", ["1", "2", "3"], "1", {
        hint: "Count the empty boxes.",
        explanation: "9 counters and 1 empty box. 9 and 1 make 10.",
        skill: "make 10",
      }),
      order("q4", "Put the numbers in order. Start with the smallest.", ["3", "4", "5", "6", "7"], {
        hint: "Count up: 3, 4, ...",
        explanation: "3, 4, 5, 6, 7. Each number is one more.",
        skill: "number order",
      }),
    ],
    teacher:
      "K-2 starter: counting to 10 with ten frames. Use real counters or fingers alongside the screen. Ask: How do you know without counting every one? (Five fills the top row.)",
  }),
  starter({
    id: "k-more-fewer-same",
    grade: "K",
    topic: "math",
    art: "🐞",
    minutes: 10,
    does: ["hear", "choose", "sort"],
    title: "More, Fewer or the Same",
    description: "Compare two groups of pictures, then compare two numbers.",
    objective: "I can tell which group has more, which has fewer, or if they are the same.",
    standards: ["K.CC.C.6", "K.CC.C.7"],
    blocks: [
      directions("d1", "Look at the two groups. Count each one, or match them one to one."),
      hear(
        "a1",
        "Hear the words",
        "More means a bigger number. Fewer means a smaller number. The same means both groups have the same number.",
      ),
      choice(
        "q1",
        "Are there more ladybugs or more bees?",
        ["🐞🐞🐞 ladybugs", "🐝🐝🐝🐝🐝 bees"],
        "🐝🐝🐝🐝🐝 bees",
        {
          hint: "Count the ladybugs. Then count the bees.",
          explanation: "3 ladybugs and 5 bees. 5 is more than 3.",
          skill: "compare groups",
        },
      ),
      choice(
        "q2",
        "Which group has fewer?",
        ["🍎🍎🍎🍎🍎🍎 apples", "🍐🍐🍐🍐 pears"],
        "🍐🍐🍐🍐 pears",
        {
          hint: "Fewer means not as many.",
          explanation: "6 apples and 4 pears. 4 is fewer than 6.",
          skill: "compare groups",
        },
      ),
      choice(
        "q3",
        "🦆🦆🦆🦆 🐸🐸🐸🐸 Look at the ducks and the frogs. Which is true?",
        ["There are more ducks.", "There are more frogs.", "They are the same."],
        "They are the same.",
        {
          hint: "Match each duck with one frog.",
          explanation: "4 ducks and 4 frogs. Every duck has a frog, so they are the same.",
          skill: "compare groups",
        },
      ),
      choice("q4", "Which number is greater?", ["5", "8"], "8", {
        hint: "Count up from 1. Which number do you say later?",
        explanation: "8 comes after 5 when we count, so 8 is greater.",
        skill: "compare numbers",
      }),
      sort(
        "q5",
        "Sort the groups: more than 5, or fewer than 5?",
        [
          ["more", "More than 5"],
          ["fewer", "Fewer than 5"],
        ],
        [
          ["⭐⭐⭐", "fewer"],
          ["⭐⭐⭐⭐⭐⭐⭐", "more"],
          ["🌸🌸", "fewer"],
          ["🌸🌸🌸🌸🌸🌸🌸🌸", "more"],
          ["🐟🐟🐟🐟", "fewer"],
          ["🐟🐟🐟🐟🐟🐟", "more"],
        ],
        {
          hint: "Count each group. Is the number bigger or smaller than 5?",
          explanation: "3, 2 and 4 are fewer than 5. 7, 8 and 6 are more than 5.",
          skill: "compare groups",
        },
      ),
    ],
    teacher:
      "K-2 starter: comparing groups. Children who struggle can line the pictures up one to one with counters. Use the words more, fewer and the same aloud.",
  }),
  starter({
    id: "k-school-words",
    grade: "K",
    topic: "oral",
    art: "🎒",
    minutes: 12,
    does: ["hear", "choose", "sort", "order", "talk"],
    title: "School Words: Hello, Classroom!",
    description:
      "Learn and say classroom words, sort things we write with and things we wear, and tell the steps for washing hands.",
    objective: "I can name things at school and tell what we do with them.",
    standards: ["SL.K.1", "SL.K.4", "L.K.5a"],
    spanish: true,
    blocks: [
      directions("d1", "Listen. Point to each picture and say the word."),
      hear(
        "a1",
        "Hear the school words",
        "Hello! These are things we use at school. Pencil. Book. Scissors. Crayon. Backpack. Chair.",
      ),
      words("w1", [
        ["✏️ pencil", "We write with a pencil.", "lápiz", "I write my name with a pencil."],
        ["📚 book", "We read a book.", "libro", "I read a book."],
        ["✂️ scissors", "We cut paper with scissors.", "tijeras", "I cut with scissors."],
        ["🖍️ crayon", "We color with a crayon.", "crayón", "I color with a red crayon."],
        ["🎒 backpack", "We carry things in a backpack.", "mochila", "My book is in my backpack."],
        ["🪑 chair", "We sit on a chair.", "silla", "I sit on my chair."],
      ]),
      choice(
        "q1",
        "Which one do we cut paper with?",
        ["📚 book", "✂️ scissors", "🪑 chair"],
        "✂️ scissors",
        {
          hint: "Snip, snip!",
          explanation: "We cut paper with scissors.",
          skill: "school words",
        },
      ),
      choice(
        "q2",
        "Which one do we sit on?",
        ["🪑 chair", "🖍️ crayon", "🎒 backpack"],
        "🪑 chair",
        {
          hint: "You sit on it at your table.",
          explanation: "We sit on a chair.",
          skill: "school words",
        },
      ),
      sort(
        "q3",
        "Sort the pictures: things we write or draw with, and things we wear.",
        [
          ["write", "✏️ Write or draw with it"],
          ["wear", "🧥 Wear it"],
        ],
        [
          ["✏️ pencil", "write"],
          ["🖍️ crayon", "write"],
          ["🖊️ pen", "write"],
          ["🧢 cap", "wear"],
          ["🧥 coat", "wear"],
          ["👟 shoe", "wear"],
        ],
        {
          hint: "Ask: Do I write with it, or do I put it on?",
          explanation:
            "We write or draw with a pencil, a crayon and a pen. We wear a cap, a coat and a shoe.",
          skill: "sort into groups",
        },
      ),
      order(
        "q4",
        "How do we wash our hands? Put the steps in order.",
        [
          "💧 Wet your hands.",
          "🧼 Rub them with soap.",
          "🚰 Rinse off the soap.",
          "🧻 Dry your hands.",
        ],
        {
          hint: "What do you do first, before the soap?",
          explanation: "First wet, next soap, then rinse, last dry.",
          skill: "sequence",
        },
      ),
      talk("q5", "Talk with a partner. Tell what you use at school.", {
        frame: "I use a ___ to ___.",
        hint: "Point to a picture first, then say the sentence.",
        sample: "I use a pencil to write.",
        rubric: ["Names a school thing", "Tells what it is for", "Says a whole sentence"],
      }),
    ],
    teacher:
      "K-2 starter for English learners (WIDA-aligned original practice; not official WIDA material). Spanish words appear on the word cards; invite children to say the word in their home language too. Listen to the partner talk and note who uses the frame. The talk answer is never auto-graded.",
  }),
];
