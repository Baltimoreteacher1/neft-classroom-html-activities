// Grade 1 starters: digraphs sh/ch/th, short and long vowels with silent e, adding within 20 with ten frames, tens
// and ones, and describing words for English learners.

import {
  bank,
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

export const GRADE_1 = [
  starter({
    id: "1-digraphs-sh-ch-th",
    grade: "1",
    topic: "phonics",
    art: "🚢",
    minutes: 12,
    does: ["hear", "sort", "fill", "choose", "order"],
    title: "Two Letters, One Sound: sh, ch, th",
    description: "Sort pictures by sh, ch and th, finish words, find sh words and build a word.",
    objective: "I can read and spell words with sh, ch and th.",
    standards: ["RF.1.3a", "RF.1.3b"],
    blocks: [
      directions("d1", "Two letters can make one sound. Listen for sh, ch and th."),
      hear(
        "a1",
        "Hear sh, ch and th",
        "S and h together say sh, like ship. C and h together say ch, like chick. T and h together say th, like thumb.",
      ),
      sort(
        "q1",
        "Sort the pictures by their first sound.",
        [
          ["sh", "sh"],
          ["ch", "ch"],
          ["th", "th"],
        ],
        [
          ["🚢 ship", "sh"],
          ["🐑 sheep", "sh"],
          ["🐚 shell", "sh"],
          ["🐤 chick", "ch"],
          ["🧀 cheese", "ch"],
          ["🍒 cherry", "ch"],
          ["👍 thumb", "th"],
          ["🧵 thread", "th"],
          ["3️⃣ three", "th"],
        ],
        {
          hint: "Say the word. Do you hear sh, ch or th at the start?",
          explanation:
            "Ship, sheep, shell: sh. Chick, cheese, cherry: ch. Thumb, thread, three: th.",
          skill: "digraphs",
        },
      ),
      bank(
        "q2",
        "Pick the two letters that finish each word.",
        "🚢 [[sh]]ip · 🐤 [[ch]]ick · 👍 [[th]]umb",
        {
          hint: "Look at the picture and say the word.",
          explanation: "ship, chick, thumb.",
          skill: "spell digraphs",
        },
      ),
      multi(
        "q3",
        "Read the words. Tap every word that has sh.",
        ["fish", "chin", "shop", "math", "dish"],
        ["fish", "shop", "dish"],
        {
          hint: "Look for s and h next to each other.",
          explanation: "Fish, shop and dish have sh. Chin has ch. Math has th.",
          skill: "decode digraphs",
        },
      ),
      order("q4", "Build the word for 🐤. Put the sounds in order.", ["ch", "i", "ck"], {
        hint: "Say chick slowly: ch... i... ck.",
        explanation: "ch, i, ck makes chick.",
        skill: "spell digraphs",
      }),
    ],
    teacher:
      "K-2 starter: digraphs sh, ch and th. For a reading check (question 3), turn Read aloud off in Student supports so the voice does not read the words for the child.",
  }),
  starter({
    id: "1-silent-e",
    grade: "1",
    topic: "phonics",
    art: "🪁",
    minutes: 12,
    does: ["hear", "sort", "match", "choose"],
    title: "Short or Long? Silent e",
    description:
      "Hear short and long vowels, sort words, and see how a silent e changes cap to cape.",
    objective: "I can tell a short vowel from a long vowel and read words with silent e.",
    standards: ["RF.1.2a", "RF.1.3c"],
    blocks: [
      directions("d1", "A silent e at the end makes the vowel say its name."),
      hear(
        "a1",
        "Hear short and long vowels",
        "Cap. Cape. In cap, a is short. In cape, a says its name. Kit. Kite. Hop. Hope. The silent e makes the vowel long.",
      ),
      sort(
        "q1",
        "Sort the words: short vowel or long vowel?",
        [
          ["short", "Short vowel"],
          ["long", "Long vowel (silent e)"],
        ],
        [
          ["cap", "short"],
          ["kit", "short"],
          ["hop", "short"],
          ["cub", "short"],
          ["cape", "long"],
          ["🪁 kite", "long"],
          ["hope", "long"],
          ["🧊 cube", "long"],
        ],
        {
          hint: "Is there an e at the end? Then the vowel says its name.",
          explanation:
            "Cap, kit, hop and cub are short. Cape, kite, hope and cube end in silent e, so they are long.",
          skill: "short and long vowels",
        },
      ),
      match(
        "q2",
        "Add a silent e. Match each word to its new word.",
        [
          ["cap", "cape"],
          ["hop", "hope"],
          ["tub", "tube"],
          ["pin", "pine"],
        ],
        {
          hint: "Find the word that is the same, with an e at the end.",
          explanation: "cap + e = cape, hop + e = hope, tub + e = tube, pin + e = pine.",
          skill: "silent e",
        },
      ),
      choice("q3", "Which word names this? 🪁", ["kit", "kite", "cute"], "kite", {
        hint: "The i says its name.",
        explanation: "Kite has a silent e, so the i is long.",
        skill: "silent e",
      }),
      choice("q4", "Which word has a long o sound?", ["hop", "home", "hot"], "home", {
        hint: "Look for the silent e.",
        explanation: "Home ends in silent e, so the o says its name.",
        skill: "short and long vowels",
      }),
    ],
    teacher:
      "K-2 starter: silent e. Have children read each pair aloud (cap, cape) and notice the change. Turn Read aloud off for a reading-only check.",
  }),
  starter({
    id: "1-add-within-20",
    grade: "1",
    topic: "math",
    art: "➕",
    minutes: 12,
    does: ["hear", "count", "choose", "match", "sort"],
    title: "Make a Ten to Add",
    description:
      "Use ten frames to add within 20, match facts to sums, and sort facts that make 10.",
    objective: "I can add and subtract within 20 by making a ten.",
    standards: ["1.OA.C.6"],
    template: "explore-practice",
    blocks: [
      directions("d1", "Fill the ten frame first. Then add what is left."),
      hear(
        "a1",
        "Make a ten",
        "8 plus 5. Move 2 from the 5 to fill the ten frame. 8 and 2 make 10. 3 are left. 10 and 3 make 13.",
      ),
      tenFrame("f1", 8, 5),
      choice("q1", "8 + 5 = ?", ["12", "13", "14"], "13", {
        hint: "8 and 2 make 10. How many more are left?",
        explanation: "8 + 2 = 10, and 3 more makes 13.",
        skill: "make a ten",
      }),
      tenFrame("f2", 9, 6),
      choice("q2", "9 + 6 = ?", ["14", "16", "15"], "15", {
        hint: "9 and 1 make 10. How many are left of the 6?",
        explanation: "9 + 1 = 10, and 5 more makes 15.",
        skill: "make a ten",
      }),
      choice("q3", "14 − 4 = ?", ["10", "11", "9"], "10", {
        hint: "Take away the 4 ones.",
        explanation: "14 is 10 and 4. Take away 4 and 10 is left.",
        skill: "subtract within 20",
      }),
      match(
        "q4",
        "Match each fact to its sum.",
        [
          ["6 + 6", "12"],
          ["7 + 3", "10"],
          ["9 + 2", "11"],
          ["8 + 6", "14"],
        ],
        {
          hint: "Make a ten first when you can.",
          explanation: "6 + 6 = 12, 7 + 3 = 10, 9 + 2 = 11, 8 + 6 = 14.",
          skill: "add within 20",
        },
      ),
      sort(
        "q5",
        "Sort the facts: makes 10, or does not make 10?",
        [
          ["ten", "Makes 10"],
          ["not", "Does not make 10"],
        ],
        [
          ["4 + 6", "ten"],
          ["7 + 3", "ten"],
          ["5 + 5", "ten"],
          ["8 + 1", "not"],
          ["6 + 3", "not"],
          ["9 + 2", "not"],
        ],
        {
          hint: "Add each pair. Is the sum 10?",
          explanation: "4 + 6, 7 + 3 and 5 + 5 make 10. 8 + 1 = 9, 6 + 3 = 9 and 9 + 2 = 11.",
          skill: "make 10",
        },
      ),
    ],
    teacher:
      "K-2 starter: make a ten. Ask children to explain how they moved counters to fill the frame. Two-color counters on a paper ten frame match the screen.",
  }),
  starter({
    id: "1-tens-and-ones",
    grade: "1",
    topic: "math",
    art: "🧱",
    minutes: 12,
    does: ["hear", "count", "choose", "match", "order"],
    title: "Tens and Ones",
    description:
      "Read numbers as tens and ones, count a full ten frame and more, and order numbers.",
    objective: "I can tell how many tens and ones are in a number.",
    standards: ["1.NBT.B.2", "1.NBT.B.3"],
    template: "explore-practice",
    blocks: [
      directions("d1", "A ten is a group of 10 ones."),
      hear(
        "a1",
        "Hear about tens",
        "Ten ones make one ten. 24 is 2 tens and 4 ones. 30 is 3 tens and 0 ones.",
      ),
      choice("q1", "2 tens and 4 ones. What number is it?", ["42", "24", "6"], "24", {
        hint: "The tens come first: 2 tens is 20.",
        explanation: "2 tens is 20. 20 and 4 make 24.",
        skill: "tens and ones",
      }),
      choice("q2", "3 tens and 0 ones. What number is it?", ["3", "13", "30"], "30", {
        hint: "3 tens is three groups of ten.",
        explanation: "10, 20, 30. Three tens is 30.",
        skill: "tens and ones",
      }),
      tenFrame("f1", 10, 6),
      choice("q3", "One ten frame is full. How many counters in all?", ["15", "16", "17"], "16", {
        hint: "Start at 10 and count on the squares.",
        explanation: "1 ten and 6 ones make 16.",
        skill: "teen numbers",
      }),
      match(
        "q4",
        "Match each number to its tens and ones.",
        [
          ["35", "3 tens 5 ones"],
          ["53", "5 tens 3 ones"],
          ["17", "1 ten 7 ones"],
          ["70", "7 tens 0 ones"],
        ],
        {
          hint: "The first digit tells the tens.",
          explanation:
            "35 is 3 tens 5 ones; 53 is 5 tens 3 ones; 17 is 1 ten 7 ones; 70 is 7 tens 0 ones.",
          skill: "tens and ones",
        },
      ),
      order("q5", "Put the numbers in order from least to greatest.", ["14", "19", "40", "41"], {
        hint: "Look at the tens first.",
        explanation: "14 and 19 have 1 ten. 40 and 41 have 4 tens. So 14, 19, 40, 41.",
        skill: "compare numbers",
      }),
    ],
    teacher:
      "K-2 starter: tens and ones. Watch for children who read 24 as 42 (question 1): ask them to build it with ten-sticks and ones.",
    misconceptions: ["Reverses tens and ones (reads 2 tens 4 ones as 42)."],
  }),
  starter({
    id: "1-describing-words",
    grade: "1",
    topic: "oral",
    art: "🐘",
    minutes: 12,
    does: ["hear", "match", "choose", "sort", "order", "talk"],
    title: "Describing Words: Big, Small, Hot, Cold",
    description:
      "Learn describing words with pictures, match opposites, sort colors and sizes, and describe something to a partner.",
    objective: "I can use describing words to tell about things.",
    standards: ["SL.1.4", "L.1.1f", "L.1.5a"],
    spanish: true,
    blocks: [
      directions("d1", "Describing words tell what something is like."),
      hear(
        "a1",
        "Hear the describing words",
        "An elephant is big. A mouse is small. Fire is hot. Ice is cold. A teddy bear is soft. A drum is loud.",
      ),
      words("w1", [
        ["🐘 big", "An elephant is big.", "grande", "The elephant is big."],
        ["🐭 small", "A mouse is small.", "pequeño", "The mouse is small."],
        ["🔥 hot", "Fire is hot.", "caliente", "The soup is hot."],
        ["🧊 cold", "Ice is cold.", "frío", "The ice is cold."],
        ["🧸 soft", "A teddy bear is soft.", "suave", "My teddy bear is soft."],
        ["🥁 loud", "A drum is loud.", "fuerte", "The drum is loud."],
      ]),
      match(
        "q1",
        "Match the opposites.",
        [
          ["🐘 big", "🐭 small"],
          ["🔥 hot", "🧊 cold"],
          ["🐇 fast", "🐢 slow"],
          ["😀 happy", "😢 sad"],
        ],
        {
          hint: "Opposites are as different as can be.",
          explanation: "Big and small, hot and cold, fast and slow, happy and sad are opposites.",
          skill: "opposites",
        },
      ),
      choice("q2", "Which word tells about ice? 🧊", ["hot", "loud", "cold"], "cold", {
        hint: "How does ice feel?",
        explanation: "Ice is cold.",
        skill: "describing words",
      }),
      sort(
        "q3",
        "Sort the describing words: colors or sizes?",
        [
          ["color", "🎨 Colors"],
          ["size", "📏 Sizes"],
        ],
        [
          ["red", "color"],
          ["blue", "color"],
          ["yellow", "color"],
          ["big", "size"],
          ["small", "size"],
          ["tiny", "size"],
        ],
        {
          hint: "Ask: Does it tell what color, or how big?",
          explanation: "Red, blue and yellow are colors. Big, small and tiny are sizes.",
          skill: "sort words",
        },
      ),
      order("q4", "Build the sentence. Put the words in order.", ["The", "dog", "is", "big."], {
        hint: "A sentence starts with a capital letter.",
        explanation: "The dog is big.",
        skill: "sentence order",
      }),
      talk("q5", "Pick something in the room. Tell a partner about it with two describing words.", {
        frame: "My ___ is ___ and ___.",
        hint: "Use a color word and a size word.",
        sample: "My backpack is blue and big.",
        rubric: ["Names a thing", "Uses two describing words", "Says a whole sentence"],
      }),
    ],
    teacher:
      "K-2 starter for English learners (WIDA-aligned original practice; not official WIDA material). Act out each word (big arms, small fingers, shiver for cold). Listen to the partner talk and note describing words children use. The talk answer is never auto-graded.",
  }),
];
