// Grade 2 starters: vowel teams, place value to 1,000, counting coins, add and subtract story problems, and retelling
// a story for English learners.

import {
  bank,
  choice,
  directions,
  hear,
  match,
  multi,
  order,
  passage,
  sort,
  starter,
  talk,
  words,
} from "./parts.js";

const STORY =
  "Maya wanted a flower. First, she dug a small hole in the dirt. Next, she put a seed in the hole and covered it up. Then, she watered the seed every day. After many days, a green sprout came up. Last, a yellow flower opened in the sun. Maya smiled.";

export const GRADE_2 = [
  starter({
    id: "2-vowel-teams",
    grade: "2",
    topic: "phonics",
    art: "🌧️",
    minutes: 12,
    does: ["hear", "sort", "fill", "choose"],
    title: "Vowel Teams: ai, ay, ee, ea",
    description:
      "Sort long a and long e words, spell vowel teams and find words with the same vowel sound.",
    objective: "I can read and spell words with the vowel teams ai, ay, ee and ea.",
    standards: ["RF.2.3b"],
    blocks: [
      directions("d1", "Two vowels can work as a team to make one long sound."),
      hear(
        "a1",
        "Hear the vowel teams",
        "A i and a y say the long a sound, like rain and day. E e and e a say the long e sound, like tree and leaf.",
      ),
      sort(
        "q1",
        "Sort the words: long a team or long e team?",
        [
          ["a", "Long a: ai, ay"],
          ["e", "Long e: ee, ea"],
        ],
        [
          ["🌧️ rain", "a"],
          ["🐌 snail", "a"],
          ["🚆 train", "a"],
          ["play", "a"],
          ["🌳 tree", "e"],
          ["🍃 leaf", "e"],
          ["🐝 bee", "e"],
          ["🍑 peach", "e"],
        ],
        {
          hint: "Find the two vowels next to each other. Which sound do they make?",
          explanation:
            "Rain, snail, train and play have long a. Tree, leaf, bee and peach have long e.",
          skill: "vowel teams",
        },
      ),
      bank(
        "q2",
        "Pick the vowel team that finishes each word.",
        "🌧️ r[[ai]]n · 🍃 l[[ea]]f · 🌳 tr[[ee]] · ☀️ d[[ay]]",
        {
          hint: "Say the picture word. Then think: which team spells that sound here?",
          explanation:
            "rain, leaf, tree, day. Ay usually comes at the end of a word; ai is in the middle.",
          skill: "spell vowel teams",
        },
      ),
      choice(
        "q3",
        "Which word has the same vowel sound as 🌧️ rain?",
        ["plan", "play", "plum"],
        "play",
        {
          hint: "Rain has the long a sound.",
          explanation: "Play has ay, which says long a, like rain.",
          skill: "vowel teams",
        },
      ),
      multi(
        "q4",
        "Read the words. Tap every word with a long e sound.",
        ["seed", "bed", "team", "ten", "green"],
        ["seed", "team", "green"],
        {
          hint: "Look for ee or ea.",
          explanation: "Seed, team and green have long e. Bed and ten have short e.",
          skill: "vowel teams",
        },
      ),
    ],
    teacher:
      "K-2 starter: vowel teams. Point out the pattern in question 2: ay usually ends a word, ai sits in the middle. Turn Read aloud off for a reading-only check.",
  }),
  starter({
    id: "2-place-value-1000",
    grade: "2",
    topic: "math",
    art: "💯",
    minutes: 12,
    does: ["hear", "choose", "match", "order", "sort"],
    title: "Hundreds, Tens and Ones",
    description:
      "Build three-digit numbers, find the value of a digit, match expanded form and compare numbers.",
    objective: "I can tell the value of each digit in a three-digit number.",
    standards: ["2.NBT.A.1", "2.NBT.A.3", "2.NBT.A.4"],
    template: "explore-practice",
    blocks: [
      directions("d1", "A three-digit number has hundreds, tens and ones."),
      hear(
        "a1",
        "Hear about place value",
        "In 346, the 3 means 3 hundreds, the 4 means 4 tens, and the 6 means 6 ones. 300 plus 40 plus 6 is 346.",
      ),
      choice("q1", "What number has 3 hundreds, 4 tens and 6 ones?", ["643", "346", "364"], "346", {
        hint: "Write the hundreds first, then the tens, then the ones.",
        explanation: "3 hundreds, 4 tens, 6 ones: 346.",
        skill: "place value",
      }),
      choice("q2", "In 582, what is the value of the 8?", ["8", "80", "800"], "80", {
        hint: "The 8 is in the tens place.",
        explanation: "The 8 is in the tens place, so it is worth 8 tens, or 80.",
        skill: "value of a digit",
      }),
      match(
        "q3",
        "Match each number to its expanded form.",
        [
          ["407", "400 + 7"],
          ["470", "400 + 70"],
          ["740", "700 + 40"],
          ["704", "700 + 4"],
        ],
        {
          hint: "A 0 means there are none in that place.",
          explanation: "407 = 400 + 7, 470 = 400 + 70, 740 = 700 + 40, 704 = 700 + 4.",
          skill: "expanded form",
        },
      ),
      order(
        "q4",
        "Put the numbers in order from least to greatest.",
        ["290", "299", "301", "310"],
        {
          hint: "Compare the hundreds first, then the tens.",
          explanation:
            "290 and 299 have 2 hundreds; 301 and 310 have 3 hundreds. So 290, 299, 301, 310.",
          skill: "compare numbers",
        },
      ),
      sort(
        "q5",
        "Sort the numbers: greater than 500, or less than 500?",
        [
          ["more", "Greater than 500"],
          ["less", "Less than 500"],
        ],
        [
          ["512", "more"],
          ["650", "more"],
          ["505", "more"],
          ["498", "less"],
          ["389", "less"],
          ["99", "less"],
        ],
        {
          hint: "Look at the hundreds digit first.",
          explanation: "512, 650 and 505 are greater than 500. 498, 389 and 99 are less than 500.",
          skill: "compare numbers",
        },
      ),
    ],
    teacher:
      "K-2 starter: place value to 1,000. Base-ten blocks or a place-value chart help children who confuse 407 and 470.",
    misconceptions: ["Ignores the zero (reads 407 as 47)."],
  }),
  starter({
    id: "2-counting-coins",
    grade: "2",
    topic: "math",
    art: "💰",
    minutes: 12,
    does: ["hear", "match", "choose", "order"],
    title: "Counting Coins",
    description: "Learn the value of each coin, count groups of coins and order coins by value.",
    objective: "I can count money using pennies, nickels, dimes and quarters.",
    standards: ["2.MD.C.8"],
    spanish: true,
    blocks: [
      directions("d1", "Count the coins with the greatest value first."),
      hear(
        "a1",
        "Hear the coin values",
        "A penny is worth 1 cent. A nickel is worth 5 cents. A dime is worth 10 cents. A quarter is worth 25 cents. Count the coins worth the most first.",
      ),
      words("w1", [
        ["penny", "A penny is worth 1 cent (1¢).", "centavo", "A penny is worth 1¢."],
        [
          "nickel",
          "A nickel is worth 5 cents (5¢).",
          "moneda de 5 centavos",
          "A nickel is worth 5¢.",
        ],
        [
          "dime",
          "A dime is worth 10 cents (10¢).",
          "moneda de 10 centavos",
          "A dime is worth 10¢.",
        ],
        [
          "quarter",
          "A quarter is worth 25 cents (25¢).",
          "moneda de 25 centavos",
          "A quarter is worth 25¢.",
        ],
      ]),
      match(
        "q1",
        "Match each coin to its value.",
        [
          ["penny", "1¢"],
          ["nickel", "5¢"],
          ["dime", "10¢"],
          ["quarter", "25¢"],
        ],
        {
          hint: "The dime is the smallest coin, but it is not worth the least.",
          explanation: "Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢.",
          skill: "coin values",
        },
      ),
      choice(
        "q2",
        "Sam has 2 dimes and 1 nickel. How much money is that?",
        ["20¢", "25¢", "30¢"],
        "25¢",
        {
          hint: "Count the dimes by tens, then add 5.",
          explanation: "10, 20, then 5 more is 25¢.",
          skill: "count coins",
        },
      ),
      choice(
        "q3",
        "Which coins make 30¢?",
        ["3 nickels", "2 dimes and 1 penny", "1 quarter and 1 nickel"],
        "1 quarter and 1 nickel",
        {
          hint: "Add the value of each group of coins.",
          explanation: "25¢ + 5¢ = 30¢. 3 nickels make 15¢, and 2 dimes and 1 penny make 21¢.",
          skill: "count coins",
        },
      ),
      choice(
        "q4",
        "Mia has 1 quarter, 1 dime and 2 pennies. How much money does she have?",
        ["36¢", "27¢", "37¢"],
        "37¢",
        {
          hint: "Start with 25. Count on 10, then 1 and 1.",
          explanation: "25, 35, 36, 37. Mia has 37¢.",
          skill: "count coins",
        },
      ),
      order(
        "q5",
        "Put the coins in order from least to greatest value.",
        ["penny", "nickel", "dime", "quarter"],
        {
          hint: "Think about what each coin is worth, not how big it is.",
          explanation: "1¢, 5¢, 10¢, 25¢. A dime is smaller than a nickel but worth more.",
          skill: "coin values",
        },
      ),
    ],
    teacher:
      "K-2 starter: counting coins. Real or play coins make this concrete. Many children think a nickel is worth more than a dime because it is bigger; question 1's hint and question 5 address it.",
    misconceptions: ["Thinks a bigger coin is worth more (nickel more than dime)."],
  }),
  starter({
    id: "2-story-problems-100",
    grade: "2",
    topic: "math",
    art: "🖍️",
    minutes: 12,
    does: ["hear", "choose", "sort"],
    title: "Add or Subtract? Story Problems",
    description:
      "Solve one-step story problems within 100 and decide whether a story adds or subtracts.",
    objective: "I can solve add and subtract story problems within 100.",
    standards: ["2.OA.A.1", "2.NBT.B.5"],
    blocks: [
      directions("d1", "Read or listen to each story. Does the amount get bigger or smaller?"),
      hear(
        "a1",
        "Hear the clue words",
        "Listen for clue words. Adds more, join and in all mean the amount gets bigger, so you add. Gave away, left and go away mean the amount gets smaller, so you subtract.",
      ),
      choice(
        "q1",
        "There are 34 crayons in a box. Ana adds 25 more. How many crayons are there now?",
        ["59", "9", "58"],
        "59",
        {
          hint: "Adds more means the amount gets bigger. Add the tens, then the ones.",
          explanation: "30 + 20 = 50 and 4 + 5 = 9, so 34 + 25 = 59.",
          skill: "add within 100",
        },
      ),
      choice(
        "q2",
        "The class had 62 stickers. They gave away 30. How many stickers are left?",
        ["92", "32", "30"],
        "32",
        {
          hint: "Gave away means the amount gets smaller.",
          explanation: "62 − 30 = 32. Take away 3 tens from 6 tens.",
          skill: "subtract within 100",
        },
      ),
      choice(
        "q3",
        "Ben read 18 pages on Monday and 15 pages on Tuesday. How many pages did he read in all?",
        ["23", "3", "33"],
        "33",
        {
          hint: "In all means put the two amounts together.",
          explanation: "18 + 15: 18 + 2 = 20, and 13 more is 33.",
          skill: "add within 100",
        },
      ),
      choice(
        "q4",
        "There are 45 children on the playground. 20 go inside. How many children are still outside?",
        ["25", "65", "20"],
        "25",
        {
          hint: "Some children left, so subtract.",
          explanation: "45 − 20 = 25.",
          skill: "subtract within 100",
        },
      ),
      sort(
        "q5",
        "Sort the stories: add or subtract?",
        [
          ["add", "➕ Add"],
          ["sub", "➖ Subtract"],
        ],
        [
          ["More friends join the game.", "add"],
          ["He gets 5 more cards.", "add"],
          ["Mom buys another bag of apples.", "add"],
          ["Some birds fly away.", "sub"],
          ["She eats 3 grapes.", "sub"],
          ["Two balloons pop.", "sub"],
        ],
        {
          hint: "Does the group get bigger or smaller?",
          explanation:
            "Joining and getting more means add. Flying away, eating and popping means subtract.",
          skill: "choose the operation",
        },
      ),
    ],
    teacher:
      "K-2 starter: story problems within 100. Ask children to act out or draw each story before they choose. A wrong answer of 9 or 3 usually means the child subtracted when the story adds.",
    misconceptions: ["Subtracts when the story joins two amounts."],
  }),
  starter({
    id: "2-story-retell",
    grade: "2",
    topic: "oral",
    art: "🌼",
    minutes: 15,
    does: ["hear", "order", "choose", "match", "talk"],
    title: "Retell a Story: First, Next, Then, Last",
    description:
      "Listen to a short story, put the events in order, answer questions and retell it with sequence words.",
    objective: "I can retell a story in order using first, next, then and last.",
    standards: ["SL.2.2", "SL.2.4", "RL.2.1"],
    template: "interactive-reading",
    spanish: true,
    blocks: [
      directions("d1", "Listen to the story. Then put what happened in order."),
      hear("a1", "Hear the story", STORY),
      passage("p1", "Maya's Flower", STORY),
      words("w1", [
        ["first", "The thing that happens at the start.", "primero", "First, she dug a hole."],
        [
          "next",
          "The thing that happens after that.",
          "después",
          "Next, she put a seed in the hole.",
        ],
        ["then", "The thing that happens after next.", "luego", "Then, she watered the seed."],
        ["last", "The thing that happens at the end.", "por último", "Last, a flower opened."],
      ]),
      order(
        "q1",
        "Put the story in order.",
        [
          "🕳️ Maya digs a hole.",
          "🌰 She puts a seed in the hole.",
          "💧 She waters the seed every day.",
          "🌱 A green sprout comes up.",
          "🌼 A yellow flower opens.",
        ],
        {
          hint: "Listen for first, next, then and last.",
          explanation: "Dig, plant, water, sprout, flower.",
          skill: "sequence",
        },
      ),
      choice("q2", "What did Maya want?", ["a puppy", "a flower", "a seed"], "a flower", {
        hint: "Listen to the first sentence.",
        explanation: "The story says, Maya wanted a flower.",
        skill: "key details",
      }),
      choice(
        "q3",
        "What did Maya do every day?",
        ["She picked flowers.", "She dug a hole.", "She watered the seed."],
        "She watered the seed.",
        {
          hint: "Find the words every day in the story.",
          explanation: "Then, she watered the seed every day.",
          skill: "key details",
        },
      ),
      match(
        "q4",
        "Match each sequence word to what happened.",
        [
          ["First", "Maya dug a hole."],
          ["Next", "She put a seed in the hole."],
          ["Then", "She watered the seed."],
          ["Last", "A yellow flower opened."],
        ],
        {
          hint: "Each sequence word is in the story.",
          explanation:
            "First she dug, next she planted, then she watered, and last a flower opened.",
          skill: "sequence words",
        },
      ),
      talk("q5", "Retell the story to a partner. Use first, next, then and last.", {
        frame: "First, ___. Next, ___. Then, ___. Last, ___.",
        hint: "Look at the story order you made.",
        sample:
          "First, Maya dug a hole. Next, she put a seed in it. Then, she watered it every day. Last, a yellow flower opened.",
        rubric: [
          "Tells the events in order",
          "Uses first, next, then and last",
          "Names the main character",
        ],
      }),
    ],
    teacher:
      "K-2 starter for English learners (WIDA-aligned original practice; not official WIDA material). Read the story twice: once for enjoyment, once to listen for sequence words. Children can point to the ordered pictures while they retell. The retell is never auto-graded.",
  }),
];
