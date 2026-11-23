// Lesson pack: Place Value to 100 (grade 2 math). Original problems; every numeric answer carries a calc the validator recomputes.
const blocks = (t, o, x0 = 40, y0 = 40, sc = 1) => {
  const rw = 18 * sc;
  const rh = 130 * sc;
  const gap = 5 * sc;
  const out = [];
  for (let i = 0; i < t; i++) {
    const x = x0 + i * (rw + gap);
    out.push({ t: "rect", x, y: y0, w: rw, h: rh, fill: "teal", stroke: "ink", sw: 2 });
    for (let k = 1; k < 10; k++)
      out.push({
        t: "line",
        x1: x,
        y1: y0 + (k * rh) / 10,
        x2: x + rw,
        y2: y0 + (k * rh) / 10,
        sw: 1,
      });
  }
  const ox = x0 + t * (rw + gap) + (t ? 14 * sc : 0);
  for (let j = 0; j < o; j++)
    out.push({
      t: "rect",
      x: ox + (j % 3) * (rw + gap),
      y: y0 + rh - rw - Math.floor(j / 3) * (rw + gap),
      w: rw,
      h: rw,
      fill: "ochre",
      stroke: "ink",
      sw: 2,
    });
  return out;
};
const pic = (alt, items, h = 240) => ({ kind: "shapes", alt, w: 480, h, items });
const txt = (text, x, y, size = 36) => ({ t: "text", text, x, y, size, weight: 700 });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const mystery = pic(
  "Base-ten blocks: four long rods, each made of ten connected units, and seven single unit squares.",
  blocks(4, 7, 150, 50, 1),
);
const compare = pic(
  "Two sets of base-ten blocks. On the left, three rods and eight single squares. On the right, five rods and two single squares.",
  [
    txt("38", 120, 40, 36),
    ...blocks(3, 8, 40, 55, 0.8),
    { t: "line", x1: 240, y1: 30, x2: 240, y2: 230, sw: 3, dash: "6 6" },
    txt("52", 360, 40, 36),
    ...blocks(5, 2, 290, 55, 0.8),
  ],
);
const fiveEight = pic(
  "Base-ten blocks: five rods and eight single squares.",
  blocks(5, 8, 150, 50, 1),
);
const threeSix = pic(
  "Base-ten blocks: three rods and six single squares.",
  blocks(3, 6, 160, 50, 1),
);
const sevenFour = pic(
  "Base-ten blocks: seven rods and four single squares.",
  blocks(7, 4, 140, 50, 1),
);
const flatTens = pic(
  "Ten rods standing side by side. Together they make one hundred.",
  blocks(10, 0, 120, 50, 1),
);

export default {
  id: "g2-math-place-value-to-100",
  kind: "lesson",
  title: "Place Value to 100",
  subtitle: "Read, build, write and compare two-digit numbers as tens and ones",
  grade: "2",
  band: "k-2",
  subject: "math",
  duration: 45,
  curriculum: {
    status: "district-referenced",
    unitId: "g2-math-u1",
    note: "Matches the opening of the Place Value to 1,000 unit in the BCPSS curriculum seed (2.NBT.A.1 is listed there). This lesson works inside 100 and ends at 100 as ten tens; the work with hundreds that follows is not covered. Problems, pictures and wording are original; lesson order within the unit is not taken from any publisher sequence.",
  },
  standards: ["2.NBT.A.1", "2.NBT.A.2", "1.NBT.B.2"],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain", "Inform"],
    domains: ["Speaking", "Listening", "Writing"],
    cluster: "2-3",
  },
  contentObjective:
    "I can show a two-digit number as tens and ones with blocks and in expanded form, and compare two numbers up to 100.",
  languageObjective:
    "I can explain why one number is greater by saying 'is greater than because it has more tens'.",
  languageDemands: {
    functions: [
      "describe a number's parts",
      "justify a comparison",
      "explain what a digit is worth",
    ],
    structures: [
      "The digit ___ is in the tens place. It means ___ tens.",
      "___ tens and ___ ones is ___.",
      "___ is greater than ___ because it has more tens.",
    ],
    discourse:
      "Two-turn partner talk: one partner builds and names a number as tens and ones, the other compares it to a second number and gives a reason.",
    barriers: [
      "'place' and 'value' have everyday meanings (a place to sit, how much something costs) that differ from 'place value'",
      "'teen' and 'ty' number words sound alike: thirteen and thirty, fifteen and fifty",
      "'ones' sounds like 'once' and 'wins', and 'tens' sounds like 'tense' in some voices",
      "'greater than' and 'less than' are long phrases that students shorten to 'bigger' and 'smaller'",
      "'digit' and 'number' are used as if they were the same word",
    ],
    oralRehearse: [
      "The number 47 has 4 tens and 7 ones.",
      "The 4 in 47 is worth 40 because it is in the tens place.",
      "52 is greater than 38 because 5 tens is more than 3 tens.",
    ],
    writeScaffold: "___ is greater than ___ because ___ has ___ tens and ___ has ___ tens.",
  },
  vocab: {
    collection: "g2-math-place-value-to-100",
    ids: [
      "digit",
      "ones",
      "tens",
      "place-value",
      "two-digit-number",
      "hundred",
      "expanded-form",
      "base-ten-blocks",
      "compare",
      "greater-than",
      "less-than",
      "equal-to",
    ],
  },
  launch: {
    title: "Notice and Wonder: counting a lot of blocks",
    visual: mystery,
    prompts: [
      "What do you notice about the blocks?",
      "How many blocks do you think there are? How could you count them without counting one at a time?",
      "What do you wonder about the long pieces and the small squares?",
    ],
    teacherNote:
      "Show only the picture for thirty seconds of silent looking. Collect noticings (long pieces, small squares, some pieces are the same) and ask students to estimate before they count. If a student counts the long pieces as 4 and the squares as 7, ask how many small squares are in one long piece. Do not tell the total yet. Write the students' counting strategies on the board; the strongest one, counting the rods by tens and then the squares by ones, becomes the day's model.",
  },
  teach: {
    model: [
      "Our number system is built from groups of ten. Ten ones make one ten. We can show a ten as a long rod, and a one as a small square. A two-digit number has two digits. The digit on the right tells how many ones. The digit on the left tells how many tens.",
      "Look at the blocks from the launch: 4 rods and 7 squares. Count the rods by tens: 10, 20, 30, 40. Then count the squares on from there: 41, 42, 43, 44, 45, 46, 47. There are 47 blocks. We say 4 tens and 7 ones. We write 47.",
      "The place a digit sits in gives it a value. In 47 the 4 is in the tens place, so it is worth 40. The 7 is in the ones place, so it is worth 7. The expanded form of 47 is 40 + 7. The number 74 uses the same digits, but the 7 is worth 70 and the 4 is worth 4. Same digits, different places, different numbers.",
      "Ten tens make one hundred. After 9 tens (90), one more ten makes 10 tens, and we call that one hundred. We write 100. A flat of 100 small squares is the same amount as ten rods side by side. In this lesson we stop at 100.",
      "To compare two numbers, look at the tens first. 52 has 5 tens and 38 has 3 tens, so 52 is greater than 38. We write 52 > 38. If the tens are the same, look at the ones. The symbols > and < always open toward the greater number, and = means the two numbers are the same amount.",
      "Listen carefully to number names. Thirteen is 1 ten and 3 ones. Thirty is 3 tens. The end of the word, -teen or -ty, tells which one you mean. Say the number, build it, and then write it.",
    ],
    moves: [
      "Always say 'tens' and 'ones' when you name a digit. Never accept 'the 4' alone: ask 'four what?'",
      "Build every number with blocks before writing it. Have students point to the rods while saying the tens, and then to the squares while saying the ones.",
      "Place a place-value mat with two columns on each desk. A digit card goes in each column, and the blocks go beneath the card.",
      "Compare two numbers by standing them side by side on the mat. Ask 'Which has more tens?' before anyone speaks about the ones.",
      "Use the mouth story for symbols: the mouth opens toward the greater number. Replace it with the language 'greater than' as soon as students are comfortable.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt: "A number has 5 tens and 8 ones. What is the number?",
      answer: 58,
      calc: "5*10+8",
      hint: "Five tens is a number you can count by tens. Then add the ones.",
      visual: fiveEight,
      supports: {
        ee: {
          frames: ["___ tens is ___.", "___ and ___ more is ___."],
          wordBank: ["tens", "ones", "rod", "square"],
          visual: fiveEight,
          oral: "Count the rods by tens. Then count the squares.",
        },
        dev: {
          frames: ["___ tens and ___ ones is the number ___."],
          wordBank: ["tens digit", "ones digit", "place"],
          visual: fiveEight,
        },
        exp: { frames: ["The number is ___ because ___ tens is ___ and ___ ones are added."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt: "In the number 36, how much is the digit 3 worth?",
      answer: 30,
      calc: "3*10",
      hint: "Which place is the 3 in? Say how many tens that is and what number it makes.",
      visual: threeSix,
      supports: {
        ee: {
          frames: ["The 3 is in the ___ place.", "3 tens is ___."],
          wordBank: ["tens place", "worth", "three tens"],
          visual: threeSix,
          oral: "Point to the rods. Say how many tens. Count by tens.",
        },
        dev: {
          frames: ["The 3 is in the ___ place, so it is worth ___."],
          wordBank: ["tens place", "worth", "place value"],
        },
        exp: {
          frames: ["The digit 3 is worth ___ because it is in the ___ place and means ___ tens."],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt: "Write 74 in expanded form.",
      answer: "70 + 4",
      hint: "Say the tens first and what they are worth. Then say the ones.",
      visual: sevenFour,
      supports: {
        ee: {
          frames: ["The 7 is worth ___.", "The 4 is worth ___.", "___ + ___"],
          wordBank: ["expanded form", "tens", "ones", "plus"],
          visual: sevenFour,
          oral: "Say 7 tens. Say 4 ones. Write each amount with a plus sign between.",
        },
        dev: {
          frames: ["74 is ___ tens and ___ ones, so the expanded form is ___ + ___."],
          wordBank: ["expanded form", "tens digit"],
        },
        exp: {
          frames: [
            "The expanded form of 74 is ___ + ___ because the 7 is worth ___ and the 4 is worth ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Which number is greater, 48 or 84?",
      choices: ["48", "84"],
      answer: 1,
      hint: "Both numbers use the same digits. Which has more tens?",
      supports: {
        ee: {
          frames: ["___ has more tens.", "___ is greater."],
          wordBank: ["greater", "tens", "more"],
          visual: pic(
            "Two sets of blocks: four rods and eight squares on the left, eight rods and four squares on the right.",
            [
              ...blocks(4, 8, 30, 50, 0.8),
              { t: "line", x1: 240, y1: 30, x2: 240, y2: 230, sw: 3, dash: "6 6" },
              ...blocks(8, 4, 270, 50, 0.8),
            ],
          ),
          oral: "Say the tens for each number. Which is bigger?",
        },
        dev: {
          frames: ["___ is greater than ___ because it has more tens."],
          wordBank: ["greater than", "tens", "digits"],
        },
        exp: { frames: ["___ is greater than ___ because ___ tens is more than ___ tens."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "choice",
      prompt: "Which statement is true?",
      choices: ["57 > 75", "57 < 75", "57 = 75"],
      answer: 1,
      hint: "Look at the tens digits first. Which number has more tens? Which way does the symbol open?",
      supports: {
        ee: {
          frames: ["57 has ___ tens.", "75 has ___ tens.", "___ is less."],
          wordBank: ["less than", "greater than", "equal", "tens"],
          oral: "Say each number as tens and ones. Which has fewer tens?",
        },
        dev: {
          frames: ["57 is less than 75 because 57 has ___ tens and 75 has ___ tens."],
          wordBank: ["less than", "symbol"],
        },
        exp: {
          frames: [
            "57 < 75 is true because ___ tens is less than ___ tens, so the symbol opens toward ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g6",
      type: "numeric",
      prompt: "How many tens make 100?",
      answer: 10,
      calc: "100/10",
      hint: "Count by tens until you reach 100. How many numbers did you say?",
      visual: flatTens,
      supports: {
        ee: {
          frames: ["There are ___ rods.", "___ tens make one hundred."],
          wordBank: ["hundred", "tens", "rod"],
          visual: flatTens,
          oral: "Count the rods. Count by tens: ten, twenty, thirty, forty, and on.",
        },
        dev: {
          frames: ["Ten tens is ___ because ___."],
          wordBank: ["hundred", "tens", "count by tens"],
        },
        exp: {
          frames: [
            "One hundred is ___ tens because counting by tens takes ___ numbers to reach 100.",
          ],
        },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Build it, say it, write it",
    task: "Each pair has base-ten blocks, a place-value mat with two columns and a deck of digit cards from 1 to 9. Partner A draws two digit cards and makes both two-digit numbers by swapping the cards (for example 3 and 8 make 38 and 83). Partner A builds each number on the mat with blocks. Partner B says each number as tens and ones, writes its expanded form, and compares the two numbers with a symbol. They check each other's blocks and writing. Swap jobs and do three rounds. At the end, each partner writes one complete sentence comparing their favorite pair: '___ is greater than ___ because ___.'",
    roles: ["Builder", "Reporter"],
    discussionCards: [
      {
        prompt: "How many tens and how many ones are in your number? Point to the blocks.",
        frame: "My number is ___ tens and ___ ones.",
      },
      {
        prompt: "Both numbers use the same digits. Why is one number so much greater?",
        frame: "The digit ___ is worth ___ in one number and ___ in the other.",
      },
      {
        prompt: "How do you know which symbol to write?",
        frame: "I looked at the ___ first. The symbol opens toward ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: tens and ones side by side",
      visualOrModel: compare,
      teacherNote:
        "Place the blocks for 38 and 52 on the overhead or on the board. Ask students to compare without counting every square: 'Which has more rods?' Write the tens and ones under each group, then the symbol between them. Re-draw with 38 and 83 to show the same digits in other places.",
    },
    discuss: {
      title: "Say it: claim and reason",
      structure:
        "Turn and talk. Partner 1 shows two numbers on the mat and says which is greater and why. Partner 2 asks 'How do you know?' and restates the reason using the word 'tens'. Swap.",
      frames: [
        "___ is greater than ___.",
        "How do you know?",
        "___ has more tens.",
        "So you are saying that the ___ in ___ is worth ___.",
      ],
    },
    apply: {
      title: "Use it: the mystery number",
      task: "Solve the riddle and prove it. My number has 6 tens. My ones digit is 4 less than my tens digit. What is my number? Show your number with blocks, write it in expanded form, and write one number that is greater and one that is less than yours.",
      successCriteria: [
        "I name the tens digit and the ones digit.",
        "I show the number with blocks and write it as tens plus ones.",
        "I compare my number to another number with a symbol and a reason.",
        "I explain what each digit is worth.",
      ],
    },
  },
  activities: [
    { engine: "visual-match", id: "g2-math-place-value-words-match" },
    { engine: "concept-builder", id: "g2-math-place-value-line" },
    { engine: "escape-challenge", id: "g2-math-place-value-escape" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt: "A number has 9 tens and 3 ones. What is the number?",
        answer: 93,
        calc: "9*10+3",
        explain: "Nine tens is 90. Then 3 more ones makes 93.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt: "What number is 60 + 8?",
        answer: 68,
        calc: "60+8",
        explain: "The 60 is 6 tens and the 8 is 8 ones, so the number is 68.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt:
          "A box holds 10 pencils. There are 6 full boxes and 9 loose pencils. How many pencils are there?",
        answer: 69,
        calc: "6*10+9",
        explain: "Six boxes of ten is 60 pencils. Nine loose pencils make 69.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which number has a 5 that is worth 50?",
        choices: ["25", "52", "35", "45"],
        answer: 1,
        explain:
          "In 52 the 5 is in the tens place, so it is worth 50. In the other numbers the 5 is in the ones place.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "Which statement is true?",
        choices: ["63 < 36", "63 > 36", "63 = 36"],
        answer: 1,
        explain: "63 has 6 tens and 36 has 3 tens, so 63 is greater than 36.",
      },
      {
        id: "i6",
        type: "choice",
        prompt: "Which number is the greatest: 39, 93 or 48?",
        choices: ["39", "93", "48"],
        answer: 1,
        explain: "93 has 9 tens. 39 has 3 tens and 48 has 4 tens, so 93 is the greatest.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A student says 47 and 74 are equal because they use the same digits. Explain the mistake. Say what each number is worth.",
        answer:
          "The digits are in different places. 47 is 4 tens and 7 ones, which is 40 + 7. 74 is 7 tens and 4 ones, which is 70 + 4. 74 is greater than 47.",
        explain:
          "The same digit has a different value in a different place, so the numbers are not equal.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt: "A number has 7 tens and 2 ones. What is the number?",
        answer: 72,
        calc: "7*10+2",
        explain: "Seven tens is 70, and 2 more ones makes 72.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which number is greater, 56 or 65?",
        choices: ["56", "65"],
        answer: 1,
        explain: "65 has 6 tens and 56 has only 5 tens, so 65 is greater.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Write 85 in expanded form.",
        answer: "80 + 5",
        explain: "The 8 is in the tens place and is worth 80. The 5 is worth 5.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you know about tens and ones.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt: "How many tens are in the number 91?",
        answer: 9,
        calc: "90/10",
        explain: "The 9 is in the tens place. It means 9 tens, which is 90.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "Which statement is true?",
        choices: ["28 > 31", "28 < 31", "28 = 31"],
        answer: 1,
        explain: "28 has 2 tens and 31 has 3 tens, so 28 is less than 31.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Explain how you know 52 is greater than 38.",
        answer:
          "52 has 5 tens and 38 has 3 tens. Five tens is more than three tens, so 52 is greater.",
        explain: "The answer compares the tens first and uses the word tens.",
      },
    ],
    successCriteria: [
      "I say the tens first when I read a number.",
      "I use the words tens and ones.",
      "I give a reason when I compare.",
    ],
  },
  answerKey: {
    notes:
      "Accept answers said aloud, shown with blocks or written. For comparison items require a reason that names the tens. For expanded form accept '70+4', '70 + 4' or '4 + 70'. For the short-answer items look for the idea that the place of a digit decides its value and that tens are compared first.",
    items: {
      g1: "58. Five tens is 50, and 8 more ones makes 58.",
      g2: "30. The 3 is in the tens place, so it means 3 tens, which is 30.",
      g3: "70 + 4. The 7 is in the tens place and is worth 70. The 4 is worth 4.",
      g4: "84. 84 has 8 tens and 48 has only 4 tens.",
      g5: "57 < 75. 57 has 5 tens and 75 has 7 tens, so 57 is less than 75.",
      g6: "10 tens. Counting by tens, it takes ten numbers to reach 100: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100.",
      i1: "93. Nine tens is 90, plus 3 ones.",
      i2: "68. 60 + 8 is 68.",
      i3: "69 pencils. Six boxes of ten is 60, plus 9 loose pencils.",
      i4: "52. The 5 is in the tens place, so it is worth 50.",
      i5: "63 > 36. 63 has 6 tens and 36 has 3 tens.",
      i6: "93. It has the most tens.",
      i7: "The student compared only the digits. 47 is 40 + 7 and 74 is 70 + 4, so 74 is greater than 47. The same digit is worth a different amount in a different place.",
      f1: "72. Seven tens is 70, plus 2 ones.",
      f2: "65. It has 6 tens and 56 has 5 tens.",
      f3: "80 + 5.",
      e1: "9 tens.",
      e2: "28 < 31. 28 has 2 tens and 31 has 3 tens.",
      e3: "Five tens is more than three tens, so 52 is greater than 38.",
    },
  },
  extension: {
    title: "More ones than a ten",
    task: "Take 3 tens and 14 ones. Build it with blocks. Can you trade ones for a ten so there are fewer than 10 ones? Show how many tens and ones you have after the trade, and say what number it is (44). Make up a new pair of your own, such as 2 tens and 16 ones, and write the number it makes. Explain to a friend why trading ten ones for one ten does not change how many there are.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo mostrar un número de dos dígitos con decenas y unidades, y comparar dos números hasta el 100.",
      vocab: [
        { en: "digit", es: "dígito", verified: true },
        { en: "ones", es: "unidades", verified: true },
        { en: "tens", es: "decenas", verified: true },
        { en: "place value", es: "valor posicional", verified: true },
        { en: "greater than", es: "mayor que", verified: true },
        { en: "less than", es: "menor que", verified: true },
        { en: "equal to", es: "igual a", verified: true },
        { en: "expanded form", es: "forma desarrollada", verified: false },
        { en: "hundred", es: "centena", verified: false },
      ],
      familyPrompt:
        "Busquen un número de dos dígitos en casa, como un número de casa o una página de un libro. Digan cuántas decenas y cuántas unidades tiene y escríbanlo como suma, por ejemplo 40 + 7.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Build it, say it, write it 10. One activity (the number line is the best fit for a 45 minute block; the escape challenge works well the next day) 10. Exit ticket 5. If time is short, move the vocabulary match to the next day as a review.",
    misconceptions: [
      "Reading digits as single numbers: students say 47 is '4 and 7' or add them to get 11. Ask 'four what?' and build it with blocks.",
      "Reversal: students write 74 for 47 or treat them as equal because of the digits. Build both numbers and compare the tens.",
      "Teen and ty confusion: students write 15 for fifty or 50 for fifteen. Say the number, build it, and write it with the place-value mat.",
      "Comparing the ones first: students decide 39 is greater than 48 because 9 is greater than 8. Always ask 'Which number has more tens?' before looking at the ones.",
      "Symbol direction: students point the mouth at the smaller number or read the symbol left to right without the number. Have them say 'greater than' or 'less than' after reading each number.",
      "Hundred as a new thing: students see 100 as bigger digits rather than ten tens. Build ten tens and push the rods together into a flat.",
    ],
    differentiation:
      "Entering and Emerging learners use blocks and the frames on every item and answer by pointing, building or with a single word. Developing learners say full sentences such as '___ tens and ___ ones'. Expanding and Bridging learners explain why a digit is worth what it is and compare numbers in two ways. The mathematics never changes by tier: only the language supports do. Students who are ready can extend to trading ones for a ten.",
    languageNotes:
      "Teach 'place' and 'value' as separate words first (a place to put a digit, how much it is worth) and then combine them. Chorally practice -teen and -ty pairs with the blocks. Accept first-language number names and then give the English name. Keep the place-value mat labeled with the words tens and ones for the whole unit.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
