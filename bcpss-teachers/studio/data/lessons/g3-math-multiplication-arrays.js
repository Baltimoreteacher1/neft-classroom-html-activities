// Lesson pack: Multiplication with Arrays and Equal Groups (grade 3 math). Original problems; every numeric answer carries a calc that is recomputed exactly.
import { arr, groups } from "../vocab/g3-math-multiplication-arrays.js";

const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const windows = arr(
  4,
  6,
  "An apartment building front with windows set out in 4 lines going across and 6 windows in every line",
  {
    note: "windows on one wall",
  },
);

const turned = (alt) => arr(3, 5, alt, { note: "3 lines of 5" });

export default {
  id: "g3-math-multiplication-arrays",
  kind: "lesson",
  title: "Multiplication with Arrays and Equal Groups",
  subtitle:
    "Count equal groups in rows and columns, write multiplication sentences, and turn arrays around",
  grade: "3",
  band: "3-5",
  subject: "math",
  duration: 50,
  curriculum: {
    status: "district-referenced",
    unitId: "g3-math-u1",
    program: "Reveal Math",
    note: "Matches the Multiplication & Division Foundations unit in the BCPSS curriculum seed (the unit lists equal groups and arrays; its seed standards include 3.OA.A.1). Problems, pictures and wording are original; lesson order within the unit is not taken from any publisher sequence.",
  },
  standards: ["3.OA.A.1", "3.OA.A.3", "3.OA.B.5"],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain", "Inform"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "2-3",
  },
  contentObjective:
    "I can use arrays and equal groups to find a total, write a multiplication sentence for it, and show that turning an array around gives the same product.",
  languageObjective:
    "I can explain an array by saying 'There are ___ rows with ___ in each row, so ___ times ___ equals ___'.",
  languageDemands: {
    functions: [
      "describe an arrangement of objects",
      "explain how to find a total",
      "justify that two facts have the same product",
    ],
    structures: [
      "There are ___ rows with ___ in each row.",
      "___ times ___ equals ___ means ___ groups of ___.",
      "I can turn around ___ times ___ because the array has the same ___.",
    ],
    discourse:
      "Two-turn partner explanation (describe the array, then say the multiplication sentence), then a written sentence that names the turn-around fact.",
    barriers: [
      "'row' also means to paddle a boat, and 'row' and 'column' are easy to swap",
      "'array' is an everyday word for a wide choice or display, and 'product' also means something sold in a store",
      "'times' names multiplication here, but students know it as 'how many times' and as clock time",
      "'each' and 'in each row' name the size of every group",
      "'factor' and 'fact' look alike but name different things",
    ],
    oralRehearse: [
      "There are four rows with six windows in each row.",
      "Four times six equals twenty-four, and six times four also equals twenty-four.",
    ],
    writeScaffold:
      "My array has ___ rows with ___ in each row. The multiplication sentence is ___ x ___ = ___. The turn-around fact is ___ x ___ = ___.",
  },
  vocab: {
    collection: "g3-math-multiplication-arrays",
    ids: [
      "array",
      "row",
      "column",
      "equal-groups",
      "repeated-addition",
      "multiply",
      "factor",
      "product",
      "multiplication-sentence",
      "turn-around-facts",
    ],
  },
  launch: {
    title: "Notice and Wonder: the apartment windows",
    visual: windows,
    prompts: [
      "What do you notice about how the windows are arranged?",
      "What do you wonder about the number of windows on this wall?",
      "How could you find the total without counting every window one by one?",
    ],
    teacherNote:
      "Show only the picture first. Take two noticings (for example 'they are in lines' or 'each line has the same number') and one wondering before you reveal the question about the total. Record the words students use for the lines going across and the lines going down on the chart; they become 'row' and 'column'. Let students count however they want, then ask who counted by lines. Do not name the multiplication sentence yet. Ask 'What stays the same in every line?' so the equal groups are stated before the symbol.",
  },
  teach: {
    model: [
      "Equal groups are sets that each hold the same number of objects. Four plates with 3 cookies on each plate are equal groups. You can find the total by repeated addition: 3 + 3 + 3 + 3 = 12. Multiplication is a faster way to write the same total.",
      "An array is a way to show equal groups. The objects are set out in equal rows, which go across, and equal columns, which go up and down. Our window wall has 4 rows with 6 windows in each row. Count by the number in one row, once for each row: 6, 12, 18, 24.",
      "We write a multiplication sentence for the array: 4 x 6 = 24. Read it as '4 rows of 6 equals 24'. The numbers 4 and 6 are the factors. The answer, 24, is the product. The first factor can tell the number of rows and the second can tell how many in each row, as long as we say which one we mean.",
      "Now turn the array a quarter turn. The 4 rows of 6 become 6 rows of 4. No window was added or taken away, so the total is still 24. That gives a turn-around fact: 6 x 4 = 24. Turn-around facts have the same product because the array holds the same objects.",
      "Be careful: the product is not the sum of the factors. 4 + 6 = 10, but the array holds 24 windows. Multiplication counts every object in all of the equal groups. An array can also help you find a missing number: if 20 stickers are in 4 equal rows, count by rows to find that each row holds 5.",
    ],
    moves: [
      "Say it two ways for every array: 'There are 4 rows with 6 in each row' and 'four times six equals twenty-four'. Have students echo before writing.",
      "Draw the array first and write the sentence second. Point to one row and one column while naming them, so the vocabulary is attached to the picture.",
      "Keep one array visible all lesson. When a new problem appears, ask students to sketch the array before they compute.",
      "Ask 'What stays the same in every row?' to bring out the equal groups before students skip count.",
      "Turn a paper array a quarter turn in front of the class and ask 'What changed? What stayed the same?'",
      "Name the product with a full sentence and units: 'There are 24 windows'. Reject a bare number.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt: "An egg carton has 2 rows with 6 eggs in each row. How many eggs are in the carton?",
      answer: 12,
      calc: "2*6",
      hint: "Every row has the same number of eggs. Count by the number in one row, once for each row.",
      supports: {
        ee: {
          frames: ["There are ___ rows with ___ in each row.", "___ plus ___ equals ___."],
          wordBank: ["rows", "in each row", "eggs", "in all"],
          visual: arr(
            2,
            6,
            "An egg carton drawn as 2 lines going across with 6 counters in each line",
            { note: "2 lines of 6" },
          ),
          oral: "Point to one row and count it. Then count the next row.",
        },
        dev: {
          frames: ["I counted ___ in one row, and there are ___ rows."],
          wordBank: ["row", "total"],
        },
        exp: { frames: ["There are ___ eggs in all because ___ rows of ___ is ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "short",
      prompt:
        "An array has 4 rows with 3 counters in each row. Write a multiplication sentence for the array.",
      answer: "4 x 3 = 12",
      hint: "Write the number of rows first and the number in each row second, with a times sign and an equals sign.",
      supports: {
        ee: {
          frames: ["___ rows of ___ is ___.", "___ x ___ = ___"],
          wordBank: ["times", "equals", "rows", "in each row"],
          visual: arr(4, 3, "An array of 4 lines going across with 3 counters in each line", {
            note: "4 lines of 3",
          }),
        },
        dev: {
          frames: ["The sentence is ___ x ___ = ___ because there are ___ rows of ___."],
          wordBank: ["multiplication sentence", "factor", "product"],
        },
        exp: { frames: ["The factors are ___ and ___, and the product is ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "Which repeated addition sentence matches an array with 5 rows of 2?",
      choices: ["5 + 2 = 7", "2 + 2 + 2 + 2 + 2 = 10", "5 + 5 = 10", "2 + 5 = 7"],
      answer: 1,
      hint: "Each row holds the same number. Add that number once for each row.",
      supports: {
        ee: {
          frames: ["There are ___ rows.", "Each row has ___."],
          wordBank: ["row", "add", "same number", "each"],
          visual: arr(5, 2, "An array of 5 lines going across with 2 counters in each line", {
            note: "5 lines of 2",
          }),
        },
        dev: {
          frames: ["I added ___ one time for each ___."],
          wordBank: ["repeated addition", "equal groups"],
        },
        exp: { frames: ["The sentence matches because the number ___ is added ___ times."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "numeric",
      prompt: "You know that 3 x 7 = 21. Use the turn-around fact to find 7 x 3.",
      answer: 21,
      calc: "7*3",
      hint: "Picture 3 rows of 7. Turn the array a quarter turn. Did any objects change?",
      supports: {
        ee: {
          frames: ["3 rows of 7 turns into ___ rows of ___.", "The total stays the ___."],
          wordBank: ["turn", "same", "rows", "columns"],
          visual: arr(3, 7, "An array of 3 lines going across with 7 counters in each line", {
            note: "3 lines of 7",
          }),
        },
        dev: {
          frames: ["Turning the array makes ___ x ___, and the product is the ___."],
          wordBank: ["turn-around fact", "product"],
        },
        exp: { frames: ["7 x 3 has the same product as 3 x 7 because ___."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "numeric",
      prompt: "A sheet has 20 stickers in 4 equal rows. How many stickers are in each row?",
      answer: 5,
      calc: "20/4",
      hint: "Try different numbers in each row. Count by that number four times until you reach the total.",
      supports: {
        ee: {
          frames: ["There are ___ rows.", "Each row has ___ stickers."],
          wordBank: ["equal rows", "each", "total", "count by"],
          visual: arr(
            4,
            5,
            "A sticker sheet drawn as 4 lines going across with the same number of counters in each line",
            { note: "20 in all" },
          ),
        },
        dev: {
          frames: ["I counted by ___ four times and got ___, so each row has ___."],
          wordBank: ["skip count", "equal groups"],
        },
        exp: { frames: ["Each row has ___ stickers because ___ rows of ___ is ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Array gallery: one picture, three sentences",
    task: "Partner A and Partner B receive the same array card, for example 3 rows of 5 counters. Partner A draws the array on a whiteboard and writes the repeated addition sentence. Partner B writes the multiplication sentence and the turn-around fact. They swap, check that all three sentences match the picture, and then say aloud one sentence that uses the words row, factor and product.",
    roles: ["Array drawer", "Sentence writer"],
    discussionCards: [
      {
        prompt: "How many rows are in your array, and how many are in each row?",
        frame: "There are ___ rows with ___ in each row.",
      },
      {
        prompt:
          "Which numbers in your multiplication sentence are factors, and which is the product?",
        frame: "The factors are ___ and ___, and the product is ___.",
      },
      {
        prompt: "What happens to the rows and columns when you turn your array around?",
        frame: "When I turn it, the rows become ___ and the total stays ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the same counters, turned",
      visualOrModel: turned(
        "An array of 3 lines going across with 5 counters in each line, drawn for a quarter turn to show it holds the same counters as 5 lines of 3",
      ),
      teacherNote:
        "Cut out a 3 by 5 array of paper squares and turn it a quarter turn on the document camera. Ask students to find a row of the first array in the turned array (it is now a column). Then ask 'Which fact does this show now?'",
    },
    discuss: {
      title: "Say it: describe and explain",
      structure:
        "Turn and talk. Partner 1 describes an array using 'rows' and 'in each row' and says the multiplication sentence. Partner 2 asks 'What is the turn-around fact?' and restates why the product is the same. Swap.",
      frames: [
        "There are ___ rows with ___ in each row.",
        "What is the turn-around fact?",
        "It is ___ times ___ because ___.",
        "So you are saying that ___.",
      ],
    },
    apply: {
      title: "Use it: the school garden",
      task: "The class garden has 18 plants. Plant them in equal rows so there are no plants left over. Find at least three different arrays that use all 18 plants (for example 2 rows of 9). Draw each array, write its multiplication sentence, and write the turn-around fact. Choose the array you would use for the garden and explain why in one sentence.",
      successCriteria: [
        "Each array uses all 18 plants with equal rows.",
        "I write a multiplication sentence for each array.",
        "I write the turn-around fact for each array.",
        "I explain my choice with the words row and column.",
      ],
    },
  },
  activities: [
    { engine: "concept-builder", id: "g3-math-array-builder" },
    { engine: "visual-match", id: "g3-math-array-match" },
    { engine: "escape-challenge", id: "g3-math-art-closet-escape" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "A garden has 6 rows of tomato plants with 4 plants in each row. How many plants are in the garden?",
        answer: 24,
        calc: "6*4",
        explain: "Count by fours six times: 4, 8, 12, 16, 20, 24. So 6 x 4 = 24.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "A baker puts muffins on 3 trays with 9 muffins on each tray. How many muffins are there in all?",
        answer: 27,
        calc: "3*9",
        explain: "Add 9 three times: 9 + 9 + 9 = 27. So 3 x 9 = 27.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt:
          "A classroom has 7 rows of desks with 5 desks in each row. How many desks are in the classroom?",
        answer: 35,
        calc: "7*5",
        explain: "Count by fives seven times: 5, 10, 15, 20, 25, 30, 35. So 7 x 5 = 35.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which fact is the turn-around of 6 x 9 = 54?",
        choices: ["9 x 6 = 54", "6 + 9 = 15", "9 x 9 = 81", "6 x 6 = 36"],
        answer: 0,
        explain:
          "A turn-around fact uses the same two factors in the opposite order, so the product stays 54.",
      },
      {
        id: "i5",
        type: "numeric",
        prompt: "A bead kit has 9 rows with 2 beads in each row. How many beads are in the kit?",
        answer: 18,
        calc: "9*2",
        explain: "Add 2 nine times, or turn the array around: 2 x 9 = 18, so 9 x 2 = 18.",
      },
      {
        id: "i6",
        type: "numeric",
        prompt: "There are 28 apples packed in 4 equal rows. How many apples are in each row?",
        answer: 7,
        calc: "28/4",
        explain:
          "Four rows of 7 make 28, because 7, 14, 21, 28 is counting by sevens four times. So each row has 7.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Tia says 4 x 5 = 9 because 4 + 5 = 9. Explain her mistake. Then write the correct product.",
        answer:
          "Tia added the two factors, but multiplication counts every object in 4 equal groups of 5. The correct product is 20.",
        explain: "Count by fives four times: 5, 10, 15, 20. So 4 x 5 = 20.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt:
          "A poster has 5 rows of stars with 6 stars in each row. How many stars are on the poster?",
        answer: 30,
        calc: "5*6",
        explain: "Count by sixes five times: 6, 12, 18, 24, 30.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which multiplication sentence matches 3 + 3 + 3 + 3?",
        choices: ["3 x 3 = 9", "4 x 3 = 12", "3 + 4 = 7", "4 x 4 = 16"],
        answer: 1,
        explain: "The number 3 is added four times, so it is 4 groups of 3, or 4 x 3 = 12.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "Describe an array for 3 x 5 using the words row and each. Then write its turn-around fact.",
        answer: "There are 3 rows with 5 in each row. The turn-around fact is 5 x 3 = 15.",
        explain: "Turning 3 rows of 5 gives 5 rows of 3, and the total is still 15.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can do with arrays and multiplication.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "A shelf has 4 rows of books with 8 books in each row. How many books are on the shelf?",
        answer: 32,
        calc: "4*8",
        explain: "Count by eights four times: 8, 16, 24, 32.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt:
          "A tray holds 7 rows of cups with 2 cups in each row. How many cups are on the tray?",
        answer: 14,
        calc: "7*2",
        explain: "Add 2 seven times: 2, 4, 6, 8, 10, 12, 14.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "In one or two sentences, explain how an array shows that 3 x 8 and 8 x 3 have the same product.",
        answer:
          "If you turn an array of 3 rows of 8 a quarter turn you get 8 rows of 3, and the same objects are still there, so the product is the same.",
        explain: "Turning swaps the rows and columns but does not add or remove objects.",
      },
    ],
    successCriteria: [
      "I found the total of equal groups.",
      "I used the words row, factor or product correctly.",
      "I explained that turning an array keeps the same product.",
    ],
  },
  answerKey: {
    notes:
      "Accept any correct way of finding the total: skip counting, repeated addition or a known fact. For multiplication sentences accept either order of the factors when the picture is not specified, but ask which number tells the rows. For the short answers (g2, i7, f3, e3) look for the key idea: the sentence matches the array, the factors are multiplied not added, and turning an array keeps the same objects. Do not require exact wording.",
    items: {
      g1: "12 eggs. 6 + 6 = 12, so 2 x 6 = 12.",
      g2: "4 x 3 = 12. There are 4 rows with 3 counters in each row.",
      g3: "2 + 2 + 2 + 2 + 2 = 10. The number 2 is added once for each of the 5 rows.",
      g4: "21. Turning 3 rows of 7 gives 7 rows of 3, and the product stays the same.",
      g5: "5 stickers in each row. 5, 10, 15, 20 is counting by fives four times, which makes 20.",
      i1: "24 plants. 6 x 4 = 24.",
      i2: "27 muffins. 3 x 9 = 27.",
      i3: "35 desks. 7 x 5 = 35.",
      i4: "9 x 6 = 54. A turn-around fact uses the same factors in the opposite order.",
      i5: "18 beads. 9 x 2 = 18, or turn the array to 2 x 9 = 18.",
      i6: "7 apples in each row. 4 x 7 = 28.",
      i7: "Tia added the factors, which does not count all the objects. 4 x 5 = 20.",
      f1: "30 stars. 5 x 6 = 30.",
      f2: "4 x 3 = 12. The number 3 is added 4 times.",
      f3: "There are 3 rows with 5 in each row. The turn-around fact is 5 x 3 = 15.",
      e1: "32 books. 4 x 8 = 32.",
      e2: "14 cups. 7 x 2 = 14.",
      e3: "Turning the array swaps the rows and columns, but no object is added or removed, so 3 x 8 and 8 x 3 are both 24.",
    },
  },
  extension: {
    title: "Which arrays make 24?",
    task: "Find every array of 24 counters that has equal rows and no counters left over. Start with 1 row of 24 and work up (1 x 24, 2 x 12, 3 x 8, 4 x 6). Draw one of them, write its multiplication sentence and the turn-around fact, and describe which arrangement would fit best on a wall of your classroom. Then explain what you notice about the pairs of factors.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo usar arreglos y grupos iguales para multiplicar y escribir una oración de multiplicación.",
      vocab: [
        { en: "array", es: "arreglo", verified: false },
        { en: "row", es: "fila", verified: false },
        { en: "column", es: "columna", verified: false },
        { en: "equal groups", es: "grupos iguales", verified: false },
        { en: "factor", es: "factor", verified: false },
        { en: "product", es: "producto", verified: false },
      ],
      familyPrompt:
        "Busquen algo en casa que esté colocado en filas iguales, como una caja de huevos o una bandeja de cubos de hielo. Cuenten cuántas filas hay y cuántos hay en cada fila, y escriban una oración de multiplicación.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Activities 20 (array builder first, then the art closet escape; the visual match works well as vocabulary review the next day). Exit ticket 7. Closing language share 3. If time is short, run the array builder and move the escape challenge to the next day.",
    misconceptions: [
      "Adding the factors: students write 4 x 5 = 9. Ask them to draw the array and count every square, then compare with the sum.",
      "Row and column swapped: students describe 3 rows of 5 as 5 rows of 3. Have them point to a row and say 'across' while saying the number in each row.",
      "Counting one row only: students report the number in one row as the total. Ask 'How many rows are there?'",
      "Unequal groups: students call any set of groups an array. Count each group together and ask whether every group is the same size.",
      "Order always matters: students believe 4 x 6 and 6 x 4 are different totals. Turn a paper array and count the squares both ways.",
      "Overgeneralizing turn-arounds: students believe any two multiplication facts have the same product. Contrast 3 x 4 with 3 x 5.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames, the word banks and a physical array of counters, point to rows and columns while speaking, and keep the same tasks and answers as every other tier. Expanding and Bridging learners justify turn-around facts and critique a wrong method in complete sentences. Never reduce the mathematics; reduce only the language load.",
    languageNotes:
      "Teach 'row' and 'column' with gestures before the written words: sweep a hand across for a row and down for a column. Pair 'times' with 'groups of' on the chart so students hear both. Name the two meanings of 'product' (something sold, and the answer when multiplying) and of 'row' (paddle a boat).",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
