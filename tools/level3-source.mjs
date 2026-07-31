/*!
 * tools/level3-source.mjs — AUTHORING SOURCE for Level 3 · Adaptive Small Group.
 *
 * This file holds the plaintext answers and known wrong answers. It is NEVER
 * shipped: `tools/` is in vite.config.js SKIP_DIRS, so nothing here reaches
 * dist/. `node tools/build-level3-config.mjs` compiles it into
 * data/level3-adaptive.json with salted SHA-256 digests only.
 *
 * Rigor rule for every entry: `learningTarget` and `standard` are the LESSON's,
 * copied verbatim from lessons/<id>/config.json. Bridge items exist to get a
 * student back to that target, never to replace it.
 *
 * Hint ladders are 5 rungs, in this fixed order:
 *   1 restate the task · 2 direct attention · 3 suggest a representation ·
 *   4 misconception-targeting question · 5 partial structure (NEVER the answer)
 */

/** Misconception ids shared across the ratio cluster. */
export const MISCONCEPTIONS = {
  ADDITIVE: "additive-reasoning",
  SCALE_ONE: "scaling-one-quantity",
  ORDER: "reversed-ratio-order",
  PART_WHOLE: "part-to-part-vs-part-to-whole",
  UNIT_RATE: "unit-rate-calculation",
};

const M = MISCONCEPTIONS;

export const LESSONS = [
  // ─────────────────────────────────────────────────────────── 3.1 Ratios ──
  {
    lessonId: "3-1",
    title: "Understand Ratios",
    representations: [
      {
        id: "tape-diagram",
        label: "Tape diagram",
        why: "It shows each part as a strip, so part-to-part and part-to-whole are both visible at once.",
      },
      {
        id: "ratio-table",
        label: "Ratio table",
        why: "It lines the two quantities up in rows so you can see them change together.",
      },
      {
        id: "double-number-line",
        label: "Double number line",
        why: "It keeps the two amounts side by side as they grow.",
      },
    ],
    misconceptions: [
      {
        id: M.ORDER,
        label: "Writes the ratio in the reverse order",
        teacherSuggestion:
          "Current evidence suggests the ratio order is getting reversed — try naming the quantities out loud before writing.",
        why: "You are seeing a tape diagram because the order of a ratio has to match the order of the words.",
        representation: "tape-diagram",
      },
      {
        id: M.PART_WHOLE,
        label: "Compares a part to the whole when the question asks part to part",
        teacherSuggestion:
          "Current evidence suggests part-to-part and part-to-whole are blending together — the tape diagram separates them.",
        why: "You are seeing a tape diagram because it shows the two parts AND the whole batch at the same time.",
        representation: "tape-diagram",
      },
    ],
    prerequisites: [
      {
        id: "equal-groups",
        label: "Reading a quantity as a number of equal groups",
        why: "Quick build-up on equal groups, then straight back to the ratio task.",
        bridge: [
          {
            id: "3-1-b1",
            prompt:
              "A batch has 3 cups of apple juice and 5 cups of sparkling water. How many cups are in the whole batch?",
            representation: "tape-diagram",
            prerequisite: "equal-groups",
            answers: ["8", "8 cups"],
            distractors: [],
            hints: [
              "The question asks for the whole batch, not one ingredient.",
              "Look at both amounts in the recipe: 3 cups and 5 cups.",
              "Draw the two strips end to end and count the whole thing.",
              "Does the whole batch include the sparkling water as well as the juice?",
              "Whole batch = apple juice + sparkling water = 3 + ___.",
            ],
          },
        ],
      },
    ],
    diagnostic: [
      {
        id: "3-1-d1",
        prompt:
          "A fruit drink recipe uses 3 cups of apple juice and 5 cups of sparkling water. Write the ratio of apple juice to sparkling water.",
        representation: "tape-diagram",
        targets: [M.ORDER, M.PART_WHOLE],
        answers: ["3:5", "3 to 5", "3/5"],
        distractors: [
          { response: "5:3", misconception: M.ORDER },
          { response: "3:8", misconception: M.PART_WHOLE },
        ],
        frames: {
          en: "The ratio of apple juice to sparkling water is ___ to ___.",
          es: "La razón de jugo de manzana a agua con gas es ___ a ___.",
        },
        vocab: ["ratio", "part-to-part"],
        hints: [
          "The question asks for apple juice compared to sparkling water.",
          "Find the two numbers in the recipe: how much juice, how much sparkling water.",
          "Draw one strip for the juice and one for the sparkling water.",
          "Which quantity does the question name FIRST?",
          "ratio = (apple juice) : (sparkling water) = ___ : ___.",
        ],
      },
      {
        id: "3-1-d2",
        prompt:
          "Using the same recipe (3 cups apple juice, 5 cups sparkling water), write the ratio of apple juice to the whole fruit drink.",
        representation: "tape-diagram",
        targets: [M.PART_WHOLE],
        answers: ["3:8", "3 to 8", "3/8"],
        distractors: [
          { response: "3:5", misconception: M.PART_WHOLE },
          { response: "8:3", misconception: M.ORDER },
        ],
        frames: {
          en: "The ratio of apple juice to the whole drink is ___ to ___.",
          es: "La razón de jugo de manzana a toda la bebida es ___ a ___.",
        },
        vocab: ["part-to-whole"],
        hints: [
          "This time the comparison is to the WHOLE drink, not to one ingredient.",
          "You need the total number of cups in the batch before you can compare.",
          "Put both strips end to end — that whole length is the drink.",
          "Is the sparkling water part of the whole drink too?",
          "ratio = (apple juice) : (apple juice + sparkling water) = 3 : ___.",
        ],
      },
      {
        id: "3-1-d3",
        prompt: "Explain how you know which number goes first in a ratio.",
        kind: "explanation",
        representation: "tape-diagram",
        targets: [M.ORDER],
        answers: [],
        distractors: [],
        frames: {
          en: "The first number matches ___ because the question names it ___.",
          es: "El primer número corresponde a ___ porque la pregunta lo nombra ___.",
        },
        vocab: ["ratio"],
        hints: [
          "Say the comparison out loud in the order the question asks it.",
          "Look at which quantity the question names first.",
          "Point to the first strip in your diagram as you read the question.",
          "Would 5 to 3 describe the same drink as 3 to 5?",
          "The first number matches the quantity named ___ in the question.",
        ],
      },
    ],
    bank: [
      {
        id: "3-1-c1",
        prompt:
          "A trail mix uses 4 scoops of raisins and 7 scoops of peanuts. Write the ratio of peanuts to raisins.",
        representation: "tape-diagram",
        targets: [M.ORDER],
        answers: ["7:4", "7 to 4", "7/4"],
        distractors: [{ response: "4:7", misconception: M.ORDER }],
        frames: {
          en: "The ratio of peanuts to raisins is ___ to ___.",
          es: "La razón de cacahuates a pasas es ___ a ___.",
        },
        vocab: ["ratio"],
        hints: [
          "Read carefully: peanuts are named first this time.",
          "Find the number of peanuts and the number of raisins.",
          "Label your two strips before you write anything.",
          "The recipe lists raisins first — does that change what the question asks for?",
          "ratio = (peanuts) : (raisins) = ___ : ___.",
        ],
      },
      {
        id: "3-1-c2",
        prompt:
          "A class has 9 sixth graders and 6 seventh graders. Write the ratio of sixth graders to all the students.",
        representation: "tape-diagram",
        targets: [M.PART_WHOLE],
        answers: ["9:15", "9 to 15", "9/15", "3:5", "3 to 5"],
        distractors: [
          { response: "9:6", misconception: M.PART_WHOLE },
          { response: "15:9", misconception: M.ORDER },
        ],
        frames: {
          en: "The ratio of sixth graders to all students is ___ to ___.",
          es: "La razón de estudiantes de sexto a todos los estudiantes es ___ a ___.",
        },
        vocab: ["part-to-whole"],
        hints: [
          "The comparison is to ALL the students, not to the seventh graders.",
          "How many students are in the class altogether?",
          "Draw both groups as strips and read the whole length.",
          "Are the seventh graders included in 'all the students'?",
          "ratio = (sixth graders) : (sixth graders + seventh graders) = 9 : ___.",
        ],
      },
      {
        id: "3-1-c3",
        prompt:
          "A paint mix is 2 parts blue to 5 parts white. Write the ratio of white paint to the whole mix.",
        representation: "ratio-table",
        targets: [M.PART_WHOLE, M.ORDER],
        answers: ["5:7", "5 to 7", "5/7"],
        distractors: [
          { response: "5:2", misconception: M.PART_WHOLE },
          { response: "7:5", misconception: M.ORDER },
        ],
        frames: {
          en: "The ratio of white paint to the whole mix is ___ to ___.",
          es: "La razón de pintura blanca a toda la mezcla es ___ a ___.",
        },
        vocab: ["part-to-whole", "ratio"],
        hints: [
          "White paint is being compared to the whole mix.",
          "How many parts does the whole mix have?",
          "Put the parts in a table row so the total is easy to read.",
          "Does the whole mix include the blue parts as well?",
          "ratio = (white) : (blue + white) = 5 : ___.",
        ],
      },
    ],
    transfer: [
      {
        id: "3-1-t1",
        prompt:
          "A recipe's ratio of syrup to soda is 2 to 9, and the whole drink is 44 cups. How many cups of syrup are in it?",
        representation: "tape-diagram",
        targets: [M.PART_WHOLE],
        answers: ["8", "8 cups"],
        distractors: [{ response: "9.8", misconception: M.PART_WHOLE }],
        frames: {
          en: "There are ___ cups of syrup because the whole is made of ___ equal parts.",
          es: "Hay ___ tazas de jarabe porque el total tiene ___ partes iguales.",
        },
        vocab: ["part-to-whole"],
        hints: [
          "This one gives you the WHOLE and asks for one part.",
          "How many equal parts make up the whole drink?",
          "Draw 11 equal boxes and label which ones are syrup.",
          "Is the whole 9 parts, or 2 + 9 parts?",
          "44 cups ÷ (2 + 9) parts = ___ cups per part, and syrup is 2 parts.",
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────── 3.2 Ratio tables ──
  {
    lessonId: "3-2",
    title: "Ratio Tables",
    representations: [
      {
        id: "ratio-table",
        label: "Ratio table",
        why: "It shows both quantities changing together, row by row.",
      },
      {
        id: "double-number-line",
        label: "Double number line",
        why: "It keeps both amounts lined up so equal jumps are visible.",
      },
      {
        id: "tape-diagram",
        label: "Tape diagram",
        why: "It shows one batch as a unit you can copy.",
      },
    ],
    misconceptions: [
      {
        id: M.ADDITIVE,
        label: "Adds the same amount to both quantities instead of multiplying",
        teacherSuggestion:
          "Current evidence suggests additive reasoning where multiplicative is needed — try the double number line.",
        why: "You are seeing a double number line because it shows whether the two amounts are growing by the same MULTIPLE, not the same amount.",
        representation: "double-number-line",
      },
      {
        id: M.SCALE_ONE,
        label: "Scales only one quantity and leaves the other unchanged",
        teacherSuggestion:
          "Current evidence suggests only one quantity is being scaled — the ratio table makes the missing move visible.",
        why: "You are seeing a ratio table because it shows what has to happen to BOTH columns to keep the mix the same.",
        representation: "ratio-table",
      },
    ],
    prerequisites: [
      {
        id: "multiplicative-thinking",
        label: "Multiplying both quantities by the same factor",
        why: "Quick build-up on scaling by a factor, then straight back to the ratio table.",
        bridge: [
          {
            id: "3-2-b1",
            prompt:
              "If 1 batch uses 2 tablespoons of baking soda, how many tablespoons does 4 batches use?",
            representation: "ratio-table",
            prerequisite: "multiplicative-thinking",
            answers: ["8", "8 tablespoons", "8 tbsp"],
            distractors: [{ response: "5", misconception: M.ADDITIVE }],
            hints: [
              "You need 4 copies of one batch.",
              "One batch is 2 tablespoons — how many batches?",
              "Write one row per batch and add them up.",
              "Are you adding 4, or making 4 copies?",
              "4 batches × 2 tablespoons per batch = ___.",
            ],
          },
        ],
      },
    ],
    diagnostic: [
      {
        id: "3-2-d1",
        prompt:
          "One batch of clay uses 2 tablespoons of baking soda and 3 tablespoons of cornstarch. How much of EACH does 4 batches use? Answer as baking soda:cornstarch.",
        representation: "ratio-table",
        targets: [M.ADDITIVE, M.SCALE_ONE],
        answers: ["8:12", "8 to 12", "8,12", "8 and 12"],
        distractors: [
          { response: "5:6", misconception: M.ADDITIVE },
          { response: "8:3", misconception: M.SCALE_ONE },
        ],
        frames: {
          en: "4 batches use ___ tablespoons of baking soda and ___ of cornstarch.",
          es: "4 tandas usan ___ cucharadas de bicarbonato y ___ de maicena.",
        },
        vocab: ["ratio table", "equivalent ratio"],
        hints: [
          "You are making 4 batches of the same recipe.",
          "Look at what one batch takes before you scale it.",
          "Write a table row for 1 batch, then a row for 4 batches.",
          "If you added 3 to both, would the clay still feel the same?",
          "4 batches means every ingredient is multiplied by ___.",
        ],
      },
      {
        id: "3-2-d2",
        prompt:
          "A ratio table shows 2 : 3 in the first row and 6 : ___ in the second. What number is missing?",
        representation: "ratio-table",
        targets: [M.ADDITIVE, M.SCALE_ONE],
        answers: ["9"],
        distractors: [
          { response: "7", misconception: M.ADDITIVE },
          { response: "3", misconception: M.SCALE_ONE },
        ],
        frames: {
          en: "The missing number is ___ because both rows were multiplied by ___.",
          es: "El número que falta es ___ porque ambas filas se multiplicaron por ___.",
        },
        vocab: ["ratio table"],
        hints: [
          "The two rows have to describe the same relationship.",
          "Compare the first column: 2 became 6.",
          "Draw an arrow between the rows and label what it does.",
          "Did the first column get 4 added to it, or get multiplied?",
          "2 × ___ = 6, so 3 × ___ = ___.",
        ],
      },
      {
        id: "3-2-d3",
        prompt: "Explain what you must do to the second quantity when you double the first one.",
        kind: "explanation",
        representation: "double-number-line",
        targets: [M.SCALE_ONE],
        answers: [],
        distractors: [],
        frames: {
          en: "When I double the first quantity I must ___ the second quantity because ___.",
          es: "Cuando duplico la primera cantidad debo ___ la segunda porque ___.",
        },
        vocab: ["equivalent ratio"],
        hints: [
          "Think about what keeps the mix tasting or looking the same.",
          "Look at what happens to both amounts, not just one.",
          "Mark both jumps on a double number line.",
          "What would happen if you doubled only one ingredient?",
          "Both quantities have to be multiplied by the ___ factor.",
        ],
      },
    ],
    bank: [
      {
        id: "3-2-c1",
        prompt: "A ratio table shows 5 : 8. Fill in the row for 15 : ___.",
        representation: "ratio-table",
        targets: [M.ADDITIVE, M.SCALE_ONE],
        answers: ["24"],
        distractors: [
          { response: "18", misconception: M.ADDITIVE },
          { response: "8", misconception: M.SCALE_ONE },
        ],
        frames: {
          en: "The missing number is ___ because both were multiplied by ___.",
          es: "El número que falta es ___ porque ambos se multiplicaron por ___.",
        },
        vocab: ["ratio table"],
        hints: [
          "Both rows must describe the same ratio.",
          "What happened to 5 to make it 15?",
          "Put an arrow between the rows showing the move.",
          "Was 10 added to the first column, or was it tripled?",
          "5 × ___ = 15, so 8 × ___ = ___.",
        ],
      },
      {
        id: "3-2-c2",
        prompt:
          "A paint mix is 3 parts blue to 4 parts yellow. A painter uses 12 parts blue. How much yellow keeps the same color?",
        representation: "double-number-line",
        targets: [M.ADDITIVE, M.SCALE_ONE],
        answers: ["16", "16 parts"],
        distractors: [
          { response: "13", misconception: M.ADDITIVE },
          { response: "4", misconception: M.SCALE_ONE },
        ],
        frames: {
          en: "The painter needs ___ parts yellow because the blue was multiplied by ___.",
          es: "El pintor necesita ___ partes de amarillo porque el azul se multiplicó por ___.",
        },
        vocab: ["equivalent ratio"],
        hints: [
          "The color has to come out the same as the original mix.",
          "Compare the blue: 3 parts became 12 parts.",
          "Mark 3 and 12 on one line and 4 on the other.",
          "If you add 9 to the yellow as well, is that the same mix?",
          "blue × ___ = 12, so yellow × ___ = ___.",
        ],
      },
      {
        id: "3-2-c3",
        prompt:
          "A recipe uses 6 cups of flour to 4 cups of milk. Someone writes 9 cups of flour to 6 cups of milk. Is that the same recipe? Answer yes or no.",
        representation: "ratio-table",
        targets: [M.ADDITIVE],
        answers: ["yes"],
        distractors: [{ response: "no", misconception: M.ADDITIVE }],
        frames: {
          en: "It is ___ the same recipe because 6:4 and 9:6 both simplify to ___.",
          es: "___ es la misma receta porque 6:4 y 9:6 se simplifican a ___.",
        },
        vocab: ["equivalent ratio", "simplify"],
        hints: [
          "You are checking whether two ratios describe the same mix.",
          "Try writing both ratios in their simplest form.",
          "Put both pairs in a table so you can compare them.",
          "3 was added to the flour and 2 to the milk — does adding different amounts keep a ratio?",
          "6:4 simplifies to ___ : ___, and 9:6 simplifies to ___ : ___.",
        ],
      },
    ],
    transfer: [
      {
        id: "3-2-t1",
        prompt:
          "A slime recipe is 4 parts glue to 5 parts water. A student has only 10 parts of water. How much glue should they use?",
        representation: "double-number-line",
        targets: [M.SCALE_ONE, M.ADDITIVE],
        answers: ["8", "8 parts"],
        distractors: [
          { response: "9", misconception: M.ADDITIVE },
          { response: "4", misconception: M.SCALE_ONE },
        ],
        frames: {
          en: "They should use ___ parts of glue because the water was multiplied by ___.",
          es: "Deben usar ___ partes de pegamento porque el agua se multiplicó por ___.",
        },
        vocab: ["equivalent ratio"],
        hints: [
          "This time you are told the SECOND quantity and asked for the first.",
          "Compare the water: 5 parts became 10 parts.",
          "Mark both amounts on a double number line.",
          "Does the glue change by the same factor, or by the same amount?",
          "water × ___ = 10, so glue × ___ = ___.",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────── 3.5 Compare ratios ──
  {
    lessonId: "3-5",
    title: "Compare Ratios",
    representations: [
      {
        id: "ratio-table",
        label: "Ratio table",
        why: "Scaling both mixes to a matching amount makes them directly comparable.",
      },
      {
        id: "unit-rate",
        label: "Per-one amount",
        why: "Reducing each mix to 'per 1' puts them on the same footing.",
      },
      {
        id: "double-number-line",
        label: "Double number line",
        why: "It shows both mixes growing side by side.",
      },
    ],
    misconceptions: [
      {
        id: M.ADDITIVE,
        label: "Compares ratios by the difference between the two numbers",
        teacherSuggestion:
          "Current evidence suggests ratios are being compared by subtraction — scaling to a common amount shows why that fails.",
        why: "You are seeing a ratio table because two mixes can only be compared once one of the amounts matches.",
        representation: "ratio-table",
      },
      {
        id: M.UNIT_RATE,
        label: "Divides in the wrong direction when finding the per-one amount",
        teacherSuggestion:
          "Current evidence suggests the per-one amount is being computed upside down — label the units before dividing.",
        why: "You are seeing a per-one amount because naming the unit first tells you which number to divide by.",
        representation: "unit-rate",
      },
    ],
    prerequisites: [
      {
        id: "scale-to-common",
        label: "Scaling a ratio so one quantity matches another ratio's",
        why: "Quick build-up on scaling to a matching amount, then back to the comparison.",
        bridge: [
          {
            id: "3-5-b1",
            prompt: "Scale the ratio 2 cocoa : 6 milk so that the milk is 24. How much cocoa?",
            representation: "ratio-table",
            prerequisite: "scale-to-common",
            answers: ["8"],
            distractors: [{ response: "20", misconception: M.ADDITIVE }],
            hints: [
              "You want the milk to end at 24.",
              "What do you multiply 6 by to get 24?",
              "Write the two rows in a table.",
              "Did you add 18 to the milk, or multiply it?",
              "6 × ___ = 24, so 2 × ___ = ___.",
            ],
          },
        ],
      },
    ],
    diagnostic: [
      {
        id: "3-5-d1",
        prompt:
          "Mix A is 2 scoops cocoa to 6 cups milk. Mix B is 3 scoops cocoa to 8 cups milk. Which mix is more chocolatey? Answer A or B.",
        representation: "ratio-table",
        targets: [M.ADDITIVE, M.UNIT_RATE],
        answers: ["b", "mix b"],
        distractors: [{ response: "a", misconception: M.ADDITIVE }],
        frames: {
          en: "Mix ___ is more chocolatey because per cup of milk it has ___ cocoa.",
          es: "La mezcla ___ es más chocolatosa porque por taza de leche tiene ___ de cacao.",
        },
        vocab: ["compare", "unit rate"],
        hints: [
          "You are comparing how strong the two mixes taste.",
          "The two mixes use different amounts of milk, so they can't be compared as written.",
          "Scale both mixes so the milk amounts match.",
          "Both mixes have 4 more milk than cocoa — does that mean they taste the same?",
          "Per 1 cup of milk, Mix A has 2 ÷ 6 = ___ and Mix B has 3 ÷ 8 = ___.",
        ],
      },
      {
        id: "3-5-d2",
        prompt: "Mix A is 2 cocoa to 6 milk. Scale it so the milk is 24 cups. How much cocoa?",
        representation: "ratio-table",
        targets: [M.ADDITIVE],
        answers: ["8"],
        distractors: [{ response: "20", misconception: M.ADDITIVE }],
        frames: {
          en: "The cocoa becomes ___ because the milk was multiplied by ___.",
          es: "El cacao se convierte en ___ porque la leche se multiplicó por ___.",
        },
        vocab: ["equivalent ratio"],
        hints: [
          "Keep the mix tasting exactly the same.",
          "Compare the milk: 6 cups became 24 cups.",
          "Use a table row for the original and one for the scaled mix.",
          "Was 18 added to the milk, or was the milk multiplied?",
          "6 × ___ = 24, so 2 × ___ = ___.",
        ],
      },
      {
        id: "3-5-d3",
        prompt: "Explain why you cannot compare 2:6 and 3:8 just by looking at the numbers.",
        kind: "explanation",
        representation: "ratio-table",
        targets: [M.ADDITIVE],
        answers: [],
        distractors: [],
        frames: {
          en: "I cannot compare them directly because the ___ amounts are different, so first I ___.",
          es: "No puedo compararlas directamente porque las cantidades de ___ son diferentes, así que primero ___.",
        },
        vocab: ["compare"],
        hints: [
          "Think about what makes two mixes comparable.",
          "Look at the second number in each ratio.",
          "Line the two mixes up in a table.",
          "Is 'the difference is 4 in both' a fair way to compare?",
          "They can be compared once the ___ amounts match, or once each is written per 1.",
        ],
      },
    ],
    bank: [
      {
        id: "3-5-c1",
        prompt:
          "Juice A is 3 concentrate to 5 water. Juice B is 5 concentrate to 8 water. Which is stronger? Answer A or B.",
        representation: "unit-rate",
        targets: [M.ADDITIVE, M.UNIT_RATE],
        answers: ["b", "juice b"],
        distractors: [{ response: "a", misconception: M.ADDITIVE }],
        frames: {
          en: "Juice ___ is stronger because per 1 unit of water it has ___ concentrate.",
          es: "El jugo ___ es más fuerte porque por 1 unidad de agua tiene ___ de concentrado.",
        },
        vocab: ["unit rate", "compare"],
        hints: [
          "Stronger means more concentrate for the same amount of water.",
          "The two juices use different amounts of water.",
          "Work out the concentrate per 1 unit of water for each.",
          "Both have 2 less concentrate than water — does that settle it?",
          "3 ÷ 5 = ___ and 5 ÷ 8 = ___; the larger one is stronger.",
        ],
      },
      {
        id: "3-5-c2",
        prompt:
          "Team A won 7 of 10 games. Team B won 9 of 12 games. Which team has the better record? Answer A or B.",
        representation: "unit-rate",
        targets: [M.UNIT_RATE],
        answers: ["b", "team b"],
        distractors: [{ response: "a", misconception: M.UNIT_RATE }],
        frames: {
          en: "Team ___ has the better record because its wins per game are ___.",
          es: "El equipo ___ tiene mejor récord porque sus victorias por partido son ___.",
        },
        vocab: ["unit rate"],
        hints: [
          "The two teams played different numbers of games.",
          "You need each team's wins compared to its own games.",
          "Write each record as a fraction of games played.",
          "Is 'B won 2 more games' enough, when B also played 2 more?",
          "7 ÷ 10 = ___ and 9 ÷ 12 = ___.",
        ],
      },
      {
        id: "3-5-c3",
        prompt:
          "Mix A is 4 cocoa to 10 milk. Mix B is 6 cocoa to 15 milk. Which is more chocolatey? Answer A, B, or same.",
        representation: "ratio-table",
        targets: [M.ADDITIVE],
        answers: ["same", "the same", "equal"],
        distractors: [{ response: "b", misconception: M.ADDITIVE }],
        frames: {
          en: "They are ___ because both simplify to ___ : ___.",
          es: "Son ___ porque ambas se simplifican a ___ : ___.",
        },
        vocab: ["equivalent ratio", "simplify"],
        hints: [
          "Check whether the two mixes are actually different.",
          "Try simplifying each ratio.",
          "Put both mixes in a table and scale them to matching milk.",
          "B has more of both — does more of both always mean stronger?",
          "4:10 simplifies to ___ : ___, and 6:15 simplifies to ___ : ___.",
        ],
      },
    ],
    transfer: [
      {
        id: "3-5-t1",
        prompt:
          "A 12-ounce cocoa uses 5 scoops. A 20-ounce cocoa uses 8 scoops. Which cup is more chocolatey? Answer 12 or 20.",
        representation: "unit-rate",
        targets: [M.UNIT_RATE, M.ADDITIVE],
        answers: ["12", "12-ounce", "12 ounce"],
        distractors: [{ response: "20", misconception: M.ADDITIVE }],
        frames: {
          en: "The ___-ounce cup is more chocolatey because it has ___ scoops per ounce.",
          es: "La taza de ___ onzas es más chocolatosa porque tiene ___ cucharadas por onza.",
        },
        vocab: ["unit rate"],
        hints: [
          "The two cups are different sizes, so compare per ounce.",
          "Each cup's scoops must be compared to its own ounces.",
          "Work out scoops per 1 ounce for each cup.",
          "The 20-ounce cup has more scoops — but does it have more per ounce?",
          "5 ÷ 12 = ___ and 8 ÷ 20 = ___.",
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────── 4.1 Rates & unit rates ──
  {
    lessonId: "4-1",
    title: "Rates and Unit Rates",
    representations: [
      {
        id: "unit-rate",
        label: "Price for one",
        why: "Pricing both signs per 1 item makes them directly comparable.",
      },
      {
        id: "ratio-table",
        label: "Ratio table",
        why: "It scales both booths to the same number of items.",
      },
      {
        id: "double-number-line",
        label: "Double number line",
        why: "It lines dollars up against items.",
      },
    ],
    misconceptions: [
      {
        id: M.UNIT_RATE,
        label: "Divides in the wrong direction when finding a unit rate",
        teacherSuggestion:
          "Current evidence suggests the unit rate is being computed upside down — say the unit out loud before dividing.",
        why: "You are seeing a price-for-one because naming the unit ('dollars per token') tells you which number to divide by.",
        representation: "unit-rate",
      },
      {
        id: M.ADDITIVE,
        label: "Compares two deals by the difference instead of the rate",
        teacherSuggestion:
          "Current evidence suggests deals are being compared by subtraction — the per-one amount settles it.",
        why: "You are seeing a per-one amount because a bigger total does not mean a better deal.",
        representation: "unit-rate",
      },
    ],
    prerequisites: [
      {
        id: "divide-to-share",
        label: "Dividing a total by a count to get an amount for one",
        why: "Quick build-up on dividing to find one, then back to comparing the booths.",
        bridge: [
          {
            id: "4-1-b1",
            prompt: "5 tokens cost $3.00 in total. What is the cost of 1 token?",
            representation: "unit-rate",
            prerequisite: "divide-to-share",
            answers: ["0.6", "0.60", "$0.60", "$0.6", "60 cents"],
            distractors: [{ response: "1.67", misconception: M.UNIT_RATE }],
            hints: [
              "You want the price of a single token.",
              "The $3.00 is shared across all 5 tokens.",
              "Draw 5 boxes and share the $3.00 between them.",
              "Are you dividing dollars by tokens, or tokens by dollars?",
              "cost per token = $3.00 ÷ ___ tokens.",
            ],
          },
        ],
      },
    ],
    diagnostic: [
      {
        id: "4-1-d1",
        prompt: "Booth A sells 5 tokens for $3.00. What is the cost per token, in dollars?",
        representation: "unit-rate",
        targets: [M.UNIT_RATE],
        answers: ["0.6", "0.60", "$0.60", "$0.6"],
        distractors: [{ response: "1.67", misconception: M.UNIT_RATE }],
        frames: {
          en: "The cost per token is $___ because I divided ___ by ___.",
          es: "El costo por ficha es $___ porque dividí ___ entre ___.",
        },
        vocab: ["unit rate", "per"],
        hints: [
          "You want the price of exactly one token.",
          "Find the total price and the number of tokens.",
          "Share the total across the tokens one at a time.",
          "'Dollars per token' — which quantity gets divided?",
          "cost per token = $3.00 ÷ ___ tokens = ___.",
        ],
      },
      {
        id: "4-1-d2",
        prompt:
          "Booth B sells 8 tokens for $5.00. What is the cost per token, in dollars? Round to the nearest cent.",
        representation: "unit-rate",
        targets: [M.UNIT_RATE],
        answers: ["0.63", "0.625", "$0.63", "$0.625"],
        distractors: [{ response: "1.6", misconception: M.UNIT_RATE }],
        frames: {
          en: "The cost per token is $___ because I divided ___ by ___.",
          es: "El costo por ficha es $___ porque dividí ___ entre ___.",
        },
        vocab: ["unit rate"],
        hints: [
          "Same idea as the last one, different numbers.",
          "The total is $5.00 and there are 8 tokens.",
          "Share the $5.00 across 8 boxes.",
          "Should the answer be more or less than a dollar?",
          "cost per token = $5.00 ÷ ___ tokens.",
        ],
      },
      {
        id: "4-1-d3",
        prompt:
          "Which booth is the better deal per token — A (5 for $3.00) or B (8 for $5.00)? Answer A or B.",
        representation: "unit-rate",
        targets: [M.ADDITIVE, M.UNIT_RATE],
        answers: ["a", "booth a"],
        distractors: [{ response: "b", misconception: M.ADDITIVE }],
        frames: {
          en: "Booth ___ is the better deal because each token costs $___.",
          es: "La caseta ___ es la mejor oferta porque cada ficha cuesta $___.",
        },
        vocab: ["unit rate", "better buy"],
        hints: [
          "Better deal means less money for each token.",
          "You already worked out the price per token at each booth.",
          "Put the two per-token prices side by side.",
          "Booth B gives more tokens — does that make each one cheaper?",
          "Compare $___ per token at A with $___ per token at B; the smaller price wins.",
        ],
      },
    ],
    bank: [
      {
        id: "4-1-c1",
        prompt: "A 6-pack of juice costs $3.00. What is the cost per box, in dollars?",
        representation: "unit-rate",
        targets: [M.UNIT_RATE],
        answers: ["0.5", "0.50", "$0.50", "$0.5"],
        distractors: [{ response: "2", misconception: M.UNIT_RATE }],
        frames: {
          en: "The cost per box is $___ because I divided ___ by ___.",
          es: "El costo por caja es $___ porque dividí ___ entre ___.",
        },
        vocab: ["unit rate"],
        hints: [
          "You want the price of one juice box.",
          "There are 6 boxes and the pack costs $3.00.",
          "Share $3.00 across 6 boxes.",
          "Dividing boxes by dollars would give boxes per dollar — is that what was asked?",
          "cost per box = $3.00 ÷ ___ boxes.",
        ],
      },
      {
        id: "4-1-c2",
        prompt: "A car travels 150 miles in 3 hours. What is the speed in miles per hour?",
        representation: "unit-rate",
        targets: [M.UNIT_RATE],
        answers: ["50", "50 mph", "50 miles per hour"],
        distractors: [{ response: "0.02", misconception: M.UNIT_RATE }],
        frames: {
          en: "The speed is ___ miles per hour because I divided ___ by ___.",
          es: "La velocidad es ___ millas por hora porque dividí ___ entre ___.",
        },
        vocab: ["rate", "per"],
        hints: [
          "You want how far the car goes in ONE hour.",
          "Find the total miles and the total hours.",
          "Mark 3 hours on one line and 150 miles on the other.",
          "'Miles per hour' — which one gets divided by which?",
          "speed = 150 miles ÷ ___ hours.",
        ],
      },
      {
        id: "4-1-c3",
        prompt:
          "Store A sells 4 notebooks for $6.00. Store B sells 6 notebooks for $8.40. Which store is cheaper per notebook? Answer A or B.",
        representation: "unit-rate",
        targets: [M.ADDITIVE, M.UNIT_RATE],
        answers: ["b", "store b"],
        distractors: [{ response: "a", misconception: M.ADDITIVE }],
        frames: {
          en: "Store ___ is cheaper because each notebook costs $___.",
          es: "La tienda ___ es más barata porque cada cuaderno cuesta $___.",
        },
        vocab: ["unit rate", "better buy"],
        hints: [
          "Cheaper means less money for one notebook.",
          "The two stores sell different numbers of notebooks.",
          "Work out the price of one notebook at each store.",
          "Store A's total is smaller — does a smaller total mean a better price per notebook?",
          "$6.00 ÷ 4 = ___ and $8.40 ÷ 6 = ___.",
        ],
      },
    ],
    transfer: [
      {
        id: "4-1-t1",
        prompt:
          "A printer prints 24 pages in 3 minutes. At that rate, how many pages does it print in 7 minutes?",
        representation: "ratio-table",
        targets: [M.UNIT_RATE],
        answers: ["56", "56 pages"],
        distractors: [{ response: "28", misconception: M.ADDITIVE }],
        frames: {
          en: "It prints ___ pages because the rate is ___ pages per minute.",
          es: "Imprime ___ páginas porque la tasa es ___ páginas por minuto.",
        },
        vocab: ["rate", "unit rate"],
        hints: [
          "This asks you to use a rate, not just find one.",
          "First work out how many pages come out in one minute.",
          "Build a table with a row for 1 minute.",
          "Is 7 minutes 4 more than 3, or a bit more than double?",
          "pages per minute = 24 ÷ 3 = ___, then × 7 minutes.",
        ],
      },
    ],
  },
];

export default LESSONS;
