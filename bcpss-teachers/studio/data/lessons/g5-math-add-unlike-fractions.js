// Lesson pack: Adding Fractions with Unlike Denominators (grade 5 math). Original problems; every item with a calc is recomputed with exact fractions.
const row = (label, parts) => ({ label, parts });
const cell = (label, units, color) => ({ label, units, color });
const bars = (alt, rows, extra = {}) => ({ kind: "tape", alt, w: 480, h: 220, rows, ...extra });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const halfAndThird = bars(
  "Two bars of the same length. The top bar is cut into 2 big parts with 1 part shaded and is labeled one half cup. The bottom bar is cut into 3 smaller parts with 1 part shaded and is labeled one third cup.",
  [
    row("1/2 cup", [cell("", 3, "teal"), cell("", 3, "paper")]),
    row("1/3 cup", [cell("", 2, "coral"), cell("", 2, "paper"), cell("", 2, "paper")]),
  ],
);

const sixths = bars(
  "Three bars of the same length, each cut into 6 equal parts. The first bar has 3 parts shaded for one half. The second bar has 2 parts shaded for one third. The third bar has 5 parts shaded for the total, five sixths.",
  [
    row("1/2 = 3/6", [
      ...Array(3).fill(cell("", 1, "teal")),
      ...Array(3).fill(cell("", 1, "paper")),
    ]),
    row("1/3 = 2/6", [
      ...Array(2).fill(cell("", 1, "coral")),
      ...Array(4).fill(cell("", 1, "paper")),
    ]),
    row("total 5/6", [...Array(5).fill(cell("", 1, "sky")), cell("", 1, "paper")]),
  ],
);

export default {
  id: "g5-math-add-unlike-fractions",
  kind: "lesson",
  title: "Adding Fractions with Unlike Denominators",
  subtitle:
    "Make the pieces the same size, then add: bars, equivalent fractions, and checking with estimates",
  grade: "5",
  band: "3-5",
  subject: "math",
  duration: 55,
  curriculum: {
    status: "district-referenced",
    unitId: "g5-math-u4",
    program: "Reveal Math",
    note: "Matches the Add & Subtract Fractions with Unlike Denominators unit in the BCPSS curriculum seed (standards 5.NF.A.1 and 5.NF.A.2 are both listed there). Problems, pictures and wording are original; lesson order within the unit is not taken from any publisher sequence.",
  },
  standards: ["5.NF.A.1", "5.NF.A.2", "MP.3"],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain", "Inform"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "4-5",
  },
  contentObjective:
    "I can add two fractions with unlike denominators by rewriting them with a common denominator, and I can check my sum with an estimate.",
  languageObjective:
    "I can explain how to add fractions with unlike denominators by saying 'because the pieces must be the same size' and 'I rewrote ___ as ___'.",
  languageDemands: {
    functions: [
      "explain a procedure and the reason behind it",
      "justify that two fractions are equivalent",
      "critique a classmate's incorrect method",
    ],
    structures: [
      "To add ___ and ___, I rewrote both as ___ because the pieces must be the same size.",
      "___ is equivalent to ___ because I multiplied the top and bottom by ___.",
      "The sum is ___, which is reasonable because it is close to ___.",
    ],
    discourse:
      "Two-turn partner explanation (method, then reason), then a written justification of one addition problem with an estimate check.",
    barriers: [
      "'common' also means ordinary or shared, so 'common denominator' can sound like 'the usual bottom number'",
      "'numerator' and 'denominator' look and sound alike and are easy to swap",
      "'unlike' names fractions that are not alike, which reverses the everyday 'like' students know",
      "'sum' and 'some' sound the same, and 'whole' and 'hole' do too",
      "'bottom number' and 'denominator' are used interchangeably, so students need both",
    ],
    oralRehearse: [
      "One half and one third have unlike denominators, so I rewrite both as sixths.",
      "Three sixths plus two sixths is five sixths because I add the numerators and keep the denominator.",
    ],
    writeScaffold:
      "To add ___ and ___, I rewrote both as ___ because ___. Then I added ___ and ___ to get ___. My estimate was ___, so the sum is reasonable.",
  },
  vocab: {
    collection: "g5-math-add-unlike-fractions",
    ids: [
      "fraction",
      "numerator",
      "denominator",
      "equivalent-fractions",
      "unlike-denominators",
      "common-denominator",
      "sum",
      "mixed-number",
      "estimate",
      "benchmark-fraction",
    ],
  },
  launch: {
    title: "Notice and Wonder: the trail mix bowl",
    visual: halfAndThird,
    prompts: [
      "What do you notice about the two bars?",
      "What do you wonder about how much trail mix is in the bowl?",
      "Could you say the total just by counting the shaded pieces? Why or why not?",
    ],
    teacherNote:
      "Show only the picture first and hide the labels. Take two noticings (for example 'the shaded pieces are different sizes') and one wondering, then reveal that the top bar is one half cup of pretzels and the bottom bar is one third cup of raisins. Record the students' own words for 'different size pieces'; they become the first entries on the chart. Do not tell them the total yet. Ask whether it would be more than one half cup, and use their estimate as the check at the end of the lesson.",
  },
  teach: {
    model: [
      "Adding fractions means putting amounts together. Two fractions with the same denominator are easy: 2/5 + 1/5 is 3/5, because two fifths and one fifth make three fifths. The denominator names the size of the piece, so only the numerators are added.",
      "One half and one third are unlike denominators. The pieces are different sizes, so you cannot count them together. Adding the tops and the bottoms, 1 + 1 over 2 + 3, gives 2/5, which is less than one half. A total cannot be smaller than one of its parts, so that method must be wrong.",
      "The fix is to rewrite both fractions with a common denominator, a bottom number that both can use. Find a number that 2 and 3 both fit into: 6. Then 1/2 = 3/6 and 1/3 = 2/6. These are equivalent fractions: both the top and the bottom were multiplied by the same number, so the amount did not change.",
      "Now the pieces match, so add the numerators and keep the denominator: 3/6 + 2/6 = 5/6. Check on the bars: the first two bars are cut into the same size pieces, and 3 shaded parts plus 2 shaded parts make 5 parts out of 6.",
      "Always check with an estimate. One half is a benchmark fraction, and one third is a little less than one half, so the total should be a little less than 1. Five sixths is close to 1, so it is reasonable. When a sum is more than 1, such as 3/4 + 5/6 = 19/12, write it as a mixed number, 1 7/12.",
    ],
    moves: [
      "Say it in two sentences every time: 'The pieces are different sizes' and 'So I rewrite both as ___'. Have students echo before writing.",
      "Draw the bars before any numbers. Cut both bars into the common denominator and let students see why the pieces now match.",
      "Write the multiplier beside each fraction ('times 3 over times 3') so students see the same number acting on the top and the bottom.",
      "Ask 'Is the answer bigger or smaller than one half?' before the calculation and again after it.",
      "Reject a bare sum. Ask for the sentence 'The sum is ___ because ___'.",
      "Plant the wrong method on purpose (add tops, add bottoms) and let the class use the bars and the estimate to defeat it.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt: "Write 2/3 as an equivalent fraction with a denominator of 12.",
      answer: "8/12",
      calc: "2/3",
      hint: "Ask what number times 3 makes 12. Then use the same number on the top.",
      supports: {
        ee: {
          frames: ["I multiplied 3 by ___ to get 12.", "I multiplied 2 by ___ too."],
          wordBank: ["equivalent", "multiply", "top", "bottom"],
          visual: bars(
            "Two bars of the same length. The top bar is cut into 3 parts with 2 shaded. The bottom bar is cut into 12 parts with 8 shaded, reaching the same length.",
            [
              row("2/3", [cell("", 4, "teal"), cell("", 4, "teal"), cell("", 4, "paper")]),
              row("?/12", [
                ...Array(8).fill(cell("", 1, "teal")),
                ...Array(4).fill(cell("", 1, "paper")),
              ]),
            ],
          ),
          oral: "Point to each bar. Say how many parts the bottom bar has.",
        },
        dev: {
          frames: ["The denominator went from 3 to 12, so I multiplied both numbers by ___."],
          wordBank: ["equivalent", "multiply"],
        },
        exp: { frames: ["I multiplied the top and bottom by ___ so the amount stayed the same."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt:
        "A bowl holds 1/2 cup of pretzels and 1/3 cup of raisins. How many cups of snack are in the bowl? Write the sum as a fraction.",
      answer: "5/6",
      calc: "1/2+1/3",
      hint: "Rewrite both fractions with the same size pieces, then add the numerators.",
      supports: {
        ee: {
          frames: [
            "The pieces are the same size when I use ___.",
            "___ sixths plus ___ sixths is ___ sixths.",
          ],
          wordBank: ["sixths", "add", "same size", "sum"],
          visual: sixths,
        },
        dev: {
          frames: ["I rewrote both as ___ because ___."],
          wordBank: ["common denominator", "numerator"],
        },
        exp: { frames: ["I used the common denominator ___, then added the ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt: "Find 1/4 + 3/10. Write the sum as a fraction.",
      answer: "11/20",
      calc: "1/4+3/10",
      hint: "List multiples of 4 and of 10 until you find one they share.",
      supports: {
        ee: {
          frames: [
            "Multiples of 4: 4, 8, 12, 16, ___.",
            "Multiples of 10: 10, ___.",
            "The shared number is ___.",
          ],
          wordBank: ["multiple", "common denominator", "add"],
        },
        dev: {
          frames: ["The first multiple of 4 and 10 that match is ___, so I rewrote both as ___."],
          wordBank: ["multiple", "equivalent"],
        },
        exp: {
          frames: ["I chose ___ as the common denominator because both 4 and 10 fit into it."],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "A student writes 2/5 + 1/2 = 3/7. Which is the correct sum?",
      choices: ["3/7", "9/10", "3/10", "7/10"],
      answer: 1,
      hint: "The pieces are fifths and halves. Which bottom number do both fit into?",
      supports: {
        ee: {
          frames: [
            "The student added the ___ and the ___.",
            "Fifths and halves are different ___.",
          ],
          wordBank: ["numerator", "denominator", "tenths", "same size"],
        },
        dev: {
          frames: ["I rewrote both as ___ before adding, so the sum is ___."],
          wordBank: ["common denominator", "equivalent"],
        },
        exp: { frames: ["The mistake was ___; the correct method is ___."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "numeric",
      prompt:
        "Jada walks 3/4 mile to the library and then 5/6 mile to the park. How far does she walk in all? Write your answer as a mixed number.",
      answer: "1 7/12",
      calc: "3/4+5/6",
      hint: "Use twelfths for both walks. If the sum is more than one whole, rewrite it as a mixed number.",
      supports: {
        ee: {
          frames: [
            "3/4 = ___/12 and 5/6 = ___/12.",
            "The sum is ___/12, which is more than ___ whole.",
          ],
          wordBank: ["twelfths", "mixed number", "whole", "sum"],
        },
        dev: {
          frames: ["The sum is ___/12, which equals ___ whole and ___/12."],
          wordBank: ["mixed number", "common denominator"],
        },
        exp: { frames: ["I rewrote the improper fraction ___ as the mixed number ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Recipe remix: two models, one sum",
    task: "Partner A and Partner B get the same recipe card, for example 2/3 cup of oats and 1/6 cup of raisins. Partner A cuts two paper strips of the same length into the common denominator and shades each amount. Partner B writes the number sentence with both rewriting steps. They swap, check that the picture and the sentence match, and then write one sentence that says why the pieces had to match. If the sum is more than 1, they write it as a mixed number too.",
    roles: ["Bar builder", "Number sentence writer"],
    discussionCards: [
      {
        prompt:
          "Which common denominator did you choose, and could you have chosen a different one?",
        frame: "I chose ___ because both ___ and ___ fit into it.",
      },
      {
        prompt:
          "What did you multiply the top and bottom of each fraction by, and why must it be the same number?",
        frame: "I multiplied the top and bottom by ___ so the amount stays the ___.",
      },
      {
        prompt: "How does your picture show the sum?",
        frame: "The picture shows ___ shaded parts out of ___ equal parts, so the sum is ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: unlike pieces become matching pieces",
      visualOrModel: sixths,
      teacherNote:
        "Place the sixths bars beside the original halves-and-thirds bars from the launch. Ask students to find the same amount in both pictures: the first bar did not change length, only the number of cuts. Then ask where the 5 in 5/6 appears in the bars (the total bar has 5 shaded parts).",
    },
    discuss: {
      title: "Say it: method and reason",
      structure:
        "Turn and talk. Partner 1 explains how to add two fractions with unlike denominators and says why the pieces must match. Partner 2 asks 'Why not just add the bottom numbers?' and restates the reason. Swap.",
      frames: [
        "To add ___ and ___, I first ___.",
        "Why not just add the bottom numbers?",
        "Because the denominator names the size of the piece, so ___.",
        "So you are saying that ___.",
      ],
    },
    apply: {
      title: "Use it: the garden bed",
      task: "A garden bed is planted with tomatoes in 1/2 of the bed and peppers in 1/5 of the bed. What fraction of the bed is planted? Then find what fraction of the bed is still empty. Estimate first, show your common denominator, and write one sentence that explains why the planted part and the empty part together make one whole bed.",
      successCriteria: [
        "I estimate the planted fraction before I calculate.",
        "I rewrite both fractions with a common denominator and show the multipliers.",
        "I find the planted fraction, 7/10, and the empty fraction, 3/10.",
        "I explain why the two parts make a whole of 10/10.",
      ],
    },
  },
  activities: [
    { engine: "escape-challenge", id: "g5-math-bake-sale-vault" },
    { engine: "concept-builder", id: "g5-math-fraction-bar-unlike" },
    { engine: "vocab-quest", id: "g5-math-fraction-words-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt: "Find 1/2 + 3/10. Write the sum as a fraction in lowest terms.",
        answer: "4/5",
        calc: "1/2+3/10",
        explain: "1/2 = 5/10, so 5/10 + 3/10 = 8/10, which simplifies to 4/5.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt: "Find 2/5 + 1/3. Write the sum as a fraction.",
        answer: "11/15",
        calc: "2/5+1/3",
        explain: "2/5 = 6/15 and 1/3 = 5/15, so 6/15 + 5/15 = 11/15.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt:
          "A ribbon has a red part that is 5/8 yard and a blue part that is 1/4 yard. How long is the ribbon in all? Write a fraction.",
        answer: "7/8",
        calc: "5/8+1/4",
        explain: "1/4 = 2/8, so 5/8 + 2/8 = 7/8 yard.",
      },
      {
        id: "i4",
        type: "numeric",
        prompt: "Find 7/10 + 2/5. Write the sum as a mixed number.",
        answer: "1 1/10",
        calc: "7/10+2/5",
        explain: "2/5 = 4/10, so 7/10 + 4/10 = 11/10, which is 1 and 1/10.",
      },
      {
        id: "i5",
        type: "numeric",
        prompt:
          "A bakery uses 2/3 cup of sugar for cookies and 3/4 cup of sugar for icing. How many cups of sugar are used in all? Write a mixed number.",
        answer: "1 5/12",
        calc: "2/3+3/4",
        explain: "2/3 = 8/12 and 3/4 = 9/12, so 8/12 + 9/12 = 17/12, which is 1 and 5/12 cups.",
      },
      {
        id: "i6",
        type: "choice",
        prompt: "Without finding the exact sum, which is the best estimate for 7/8 + 1/12?",
        choices: ["about 1/2", "about 1", "about 2", "about 1/8"],
        answer: 1,
        explain:
          "7/8 is close to the benchmark 1 and 1/12 is close to 0, so the sum is close to 1. The exact sum is 23/24.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A student writes 3/4 + 1/6 = 4/10. Explain the mistake. Then write the correct sum.",
        answer:
          "The student added the numerators and the denominators, but fourths and sixths are different size pieces and 4/10 is less than 3/4. The correct sum is 11/12.",
        explain: "3/4 = 9/12 and 1/6 = 2/12, so 9/12 + 2/12 = 11/12.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt: "Find 1/2 + 1/5. Write the sum as a fraction.",
        answer: "7/10",
        calc: "1/2+1/5",
        explain: "1/2 = 5/10 and 1/5 = 2/10, so the sum is 7/10.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which fraction is equivalent to 3/5?",
        choices: ["6/10", "4/6", "3/10", "6/5"],
        answer: 0,
        explain: "Multiplying the top and bottom of 3/5 by 2 gives 6/10.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Rewrite 1/4 and 1/6 with a common denominator, then add them.",
        answer: "1/4 = 3/12 and 1/6 = 2/12, so the sum is 5/12.",
        explain: "Twelve is a number that both 4 and 6 fit into.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can do with unlike denominators.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt: "Find 3/8 + 1/2. Write the sum as a fraction.",
        answer: "7/8",
        calc: "3/8+1/2",
        explain: "1/2 = 4/8, so 3/8 + 4/8 = 7/8.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt:
          "A hiker walks 3/5 mile and then 1/4 mile. How far does she walk in all? Write a fraction.",
        answer: "17/20",
        calc: "3/5+1/4",
        explain: "3/5 = 12/20 and 1/4 = 5/20, so 12/20 + 5/20 = 17/20 mile.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Explain in one or two sentences why you cannot add 1/2 + 1/3 by adding the tops and the bottoms.",
        answer:
          "The denominators name the size of the pieces, and halves and thirds are different sizes, so the pieces have to be rewritten as the same size before the numerators are added.",
        explain:
          "The method gives 2/5, which is less than 1/2, but a total cannot be smaller than one of its parts.",
      },
    ],
    successCriteria: [
      "I rewrote both fractions with a common denominator.",
      "I added only the numerators.",
      "I checked that my sum is reasonable.",
    ],
  },
  answerKey: {
    notes:
      "Accept any fraction equivalent to the stated answer unless the item asks for lowest terms or a mixed number (i1, i4, i5, g5). Accept any common denominator that works, not only the smallest. For the short answers (i7, f3, e3) look for the idea that denominators name piece size and pieces must match before adding, not a specific sentence.",
    items: {
      g1: "8/12. 12 is 3 times 4, so multiply the top and bottom of 2/3 by 4.",
      g2: "5/6 cup. 1/2 = 3/6 and 1/3 = 2/6, and 3 + 2 = 5.",
      g3: "11/20. 1/4 = 5/20 and 3/10 = 6/20, and 5 + 6 = 11.",
      g4: "9/10. 2/5 = 4/10 and 1/2 = 5/10, and 4 + 5 = 9. The student added the numerators and the denominators.",
      g5: "1 7/12 miles. 3/4 = 9/12 and 5/6 = 10/12, so the sum is 19/12, which is 1 and 7/12.",
      i1: "4/5. 5/10 + 3/10 = 8/10 = 4/5.",
      i2: "11/15. 6/15 + 5/15 = 11/15.",
      i3: "7/8 yard. 5/8 + 2/8 = 7/8.",
      i4: "1 1/10. 7/10 + 4/10 = 11/10 = 1 1/10.",
      i5: "1 5/12 cups. 8/12 + 9/12 = 17/12 = 1 5/12.",
      i6: "About 1. 7/8 is close to 1 and 1/12 is close to 0.",
      i7: "The student added both tops and both bottoms. Fourths and sixths must be rewritten as twelfths: 9/12 + 2/12 = 11/12. The wrong answer 4/10 is less than 3/4, which cannot be a total.",
      f1: "7/10. 5/10 + 2/10.",
      f2: "6/10. Multiply the top and bottom of 3/5 by 2.",
      f3: "1/4 = 3/12 and 1/6 = 2/12; 3/12 + 2/12 = 5/12.",
      e1: "7/8. 3/8 + 4/8.",
      e2: "17/20 mile. 12/20 + 5/20.",
      e3: "The denominators are piece sizes, not amounts. Halves and thirds must be rewritten as the same size pieces (sixths) before the numerators are added.",
    },
  },
  extension: {
    title: "Subtract with the same idea",
    task: "A pitcher holds 5/6 liter of juice. A class pours out 1/4 liter. Estimate first, then use a common denominator to find how much juice is left (5/6 = 10/12 and 1/4 = 3/12, so 10/12 - 3/12 = 7/12). Then write a story problem of your own that needs a common denominator to add two amounts, solve it, and trade it with a partner.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo sumar fracciones con denominadores diferentes escribiéndolas con un denominador común.",
      vocab: [
        { en: "fraction", es: "fracción", verified: false },
        { en: "numerator", es: "numerador", verified: false },
        { en: "denominator", es: "denominador", verified: false },
        { en: "equivalent fractions", es: "fracciones equivalentes", verified: false },
        { en: "common denominator", es: "denominador común", verified: false },
        { en: "sum", es: "suma", verified: false },
      ],
      familyPrompt:
        "Busquen una receta en casa que use dos medidas en fracciones, como 1/2 taza y 1/3 de taza. Digan cuánto hay en total y expliquen por qué las partes tienen que ser del mismo tamaño.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 6 minutes. Teach and guided practice 18. Activities 20 (fraction bars first, then the bake sale vault; the Fraction Words Quest works well the next day as vocabulary review). Exit ticket 7. Closing share 4. If time is short, run the fraction bars and assign the vault for the next day.",
    misconceptions: [
      "Adding numerators and denominators: students write 1/2 + 1/3 = 2/5. Ask them to compare 2/5 with 1/2 on a bar: a total cannot be smaller than a part.",
      "Changing only the denominator: students write 3/4 as 3/12 to match twelfths. Ask what happened to the amount when only the bottom number changed.",
      "Adding instead of multiplying to rewrite: students go from 1/2 to 3/4 by adding 2 to both numbers. Use two bars to show the amounts are different.",
      "Stopping before the sum: students rewrite one fraction and report it. Have them point to where the second amount is in their picture.",
      "Forgetting the mixed number: students leave 19/12 or write 1 19/12. Ask how many whole bars there are in 12/12.",
      "Always using the product of the denominators: this works but can produce large numbers that hide simplifying. Celebrate smaller common denominators without requiring them.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames, the word banks and the fraction bars, point at pieces while speaking, and keep the same tasks and answers as every other tier. Expanding and Bridging learners justify choices of common denominator and critique the wrong method in complete sentences. Never reduce the mathematics; reduce only the language load.",
    languageNotes:
      "Teach 'unlike' with two cups of different sizes before using it for denominators. Chorally practice 'numerator, denominator' while pointing to the top and bottom of a fraction card. Name the two meanings of 'common' on the chart: shared, and ordinary. Pair 'sum' with a picture of two bars joined.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
