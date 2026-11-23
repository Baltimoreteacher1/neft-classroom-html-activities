// Escape Challenge: the bake sale cash box is locked. Four fraction rooms give the pieces of the door code.
const sup = (directions, frames, wordBank, extra = {}) => ({
  ee: {
    directions,
    frames,
    wordBank,
    oral: "Say your plan to a partner before you type.",
    ...extra,
  },
  dev: {
    directions: "Rewrite so the denominators match before you decide.",
    frames: [frames[0]],
    wordBank: wordBank.slice(0, 3),
  },
  exp: { frames: [frames[0]] },
  br: {},
});

export default {
  id: "g5-math-bake-sale-vault",
  engine: "escape-challenge",
  title: "The Bake Sale Vault",
  grade: "5",
  band: "3-5",
  subject: "math",
  lessonId: "g5-math-add-unlike-fractions",
  standards: ["5.NF.A.1", "5.NF.A.2"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to 5.NF.A.1 and 5.NF.A.2; not mapped to a district unit sequence.",
  },
  vocabIds: ["common-denominator", "equivalent-fractions", "sum"],
  minutes: 20,
  intro:
    "The bake sale cash box is locked and the key code is hidden in four recipe rooms. Solve each fraction puzzle, collect the pieces of the code, and read them in the order the keeper's note gives.",
  story: {
    title: "The Bake Sale Vault",
    setting: "The school cafeteria, one hour before the bake sale opens.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "Ms. Reyes set the cash box in the pantry and spun the lock. The code is split across four recipe rooms, and the sale opens soon.",
      },
      {
        id: "after-wall",
        after: "wall",
        text: "The recipe cards slide aside and a brass tag drops out. A faint arrow on the back points toward the mixing counter.",
      },
      {
        id: "after-bowl",
        after: "bowl",
        text: "The scale clicks and a drawer slides open with the next tag inside. A note says the code letters are hidden at the cooling rack.",
      },
      {
        id: "after-rack",
        after: "rack",
        text: "The cooling rack folds up and a letter plate falls into your hand. One more shelf holds the last piece, with an inspector's stamp.",
      },
      {
        id: "end",
        after: "end",
        text: "The cash box clicks open. Ms. Reyes smiles, and the bake sale opens on time.",
      },
    ],
  },
  rooms: [
    {
      id: "wall",
      title: "The Recipe Wall",
      narrative:
        "Three recipe cards hang on the wall, each with a fraction of a cup. Under them are tags written in twelfths, and each card needs the tag that means the same amount.",
      gate: { needs: "equivalent-fractions", label: "Writing equivalent fractions" },
      puzzle: {
        type: "match",
        prompt:
          "Match each recipe amount to the tag that shows exactly the same amount written in twelfths.",
        lefts: [
          { id: "l1", text: "1/2 cup of oats", calc: "1/2" },
          { id: "l2", text: "2/3 cup of flour", calc: "2/3" },
          { id: "l3", text: "3/4 cup of milk", calc: "3/4" },
        ],
        rights: [
          { id: "r1", text: "6/12", token: "6", value: "6/12" },
          { id: "r2", text: "8/12", token: "8", value: "8/12" },
          { id: "r3", text: "9/12", token: "9", value: "9/12" },
          { id: "r4", text: "3/12", token: "3", value: "3/12" },
          { id: "r5", text: "7/12", token: "7", value: "7/12" },
        ],
        answer: { l1: "r1", l2: "r2", l3: "r3" },
        hints: [
          "To keep an amount the same, whatever you multiply the bottom number by, you also multiply the top number by.",
          "Ask what number times the bottom number makes 12 for each card.",
          "For each card, find that number and multiply both the top and the bottom of the fraction by it.",
        ],
        misconceptions: [
          {
            tag: "changed-denominator-only",
            has: ["l3=r4"],
            hint: "Only the bottom number changed there, so the amount did not stay the same. What must you do to the top number?",
          },
          {
            tag: "added-instead-of-multiplied",
            has: ["l2=r5"],
            hint: "Adding to the top number changes the amount. Rewriting a fraction means multiplying the top and bottom by the same number.",
          },
        ],
        model: {
          text: "To write 1/3 in sixths, ask what times 3 makes 6. It is 2, so multiply the top number by 2 as well: 1/3 = 2/6. Both numbers were scaled by 2, so the amount stayed the same.",
        },
        transfer: {
          type: "match",
          prompt: "Match each amount to the tag that shows the same amount written in sixths.",
          lefts: [
            { id: "m1", text: "1/2", calc: "1/2" },
            { id: "m2", text: "2/3", calc: "2/3" },
            { id: "m3", text: "1/3", calc: "1/3" },
          ],
          rights: [
            { id: "n1", text: "3/6", token: "A", value: "3/6" },
            { id: "n2", text: "4/6", token: "B", value: "4/6" },
            { id: "n3", text: "2/6", token: "C", value: "2/6" },
            { id: "n4", text: "1/6", token: "D", value: "1/6" },
          ],
          answer: { m1: "n1", m2: "n2", m3: "n3" },
          hints: [
            "Think about what you multiply the bottom number by to get 6.",
            "Do the same thing to the top number so the amount stays the same.",
            "Check that each tag is the same size as the original fraction, not just a number that looks close.",
          ],
        },
        why: "Multiplying the top and bottom by the same number makes pieces that are smaller but more numerous, so the amount does not change.",
        supports: sup(
          "Choose the tag for each card from the menu. Tags show the same amount in twelfths.",
          ["I multiplied the top and the bottom by ___.", "___ is the same amount as ___."],
          ["equivalent", "multiply", "twelfths", "same amount"],
        ),
      },
      reveal: "Behind the cards you find a brass tag stamped with three digits for the door code.",
    },
    {
      id: "bowl",
      title: "The Mixing Bowl",
      narrative:
        "Dara pours 2/3 cup of oats and then 1/4 cup of raisins into the big bowl. A sign on the scale says to read the total of the two amounts as one fraction.",
      gate: { needs: "add-unlike-fractions", label: "Adding fractions with unlike denominators" },
      puzzle: {
        type: "numeric",
        prompt:
          "How many cups are in the bowl after both amounts are added? Write the sum as a fraction.",
        answer: "11/12",
        calc: "2/3+1/4",
        unit: "cups",
        hints: [
          "The two amounts have different size pieces, so rewrite them before adding.",
          "Find a number of equal parts that both thirds and fourths can be cut into.",
          "Rewrite each fraction with that shared denominator, add the tops, and keep the shared bottom.",
        ],
        misconceptions: [
          {
            tag: "add-tops-and-bottoms",
            pick: "3/7",
            hint: "You added the tops and the bottoms. The bottom number tells the size of a piece, so it is not added.",
          },
          {
            tag: "stopped-before-adding",
            pick: "8/12",
            hint: "That is only one of the amounts in twelfths. Did you add the second amount?",
          },
        ],
        model: {
          text: "To add 1/2 + 1/5, use tenths because both 2 and 5 fit into 10. Then 1/2 = 5/10 and 1/5 = 2/10, so add the tops: 5 + 2 = 7. The sum is seven tenths.",
        },
        transfer: {
          type: "numeric",
          prompt:
            "A runner jogs 1/3 mile and then walks 1/6 mile. How many miles in all? Write a fraction in lowest terms.",
          answer: "1/2",
          calc: "1/3+1/6",
          unit: "miles",
          hints: [
            "Check whether one denominator fits into the other.",
            "Rewrite the third as sixths, then add the tops.",
            "Look at your answer: can the fraction be written with smaller numbers?",
          ],
        },
        why: "Both amounts become twelfths, so you add the number of twelfths: 8 + 3 = 11, and the sum is eleven twelfths.",
        supports: sup(
          "Type the sum as a fraction like 3/4. First rewrite both amounts so the pieces are the same size.",
          ["I rewrote both fractions with the denominator ___.", "Then I added ___ and ___."],
          ["sum", "denominator", "add", "same size"],
        ),
      },
      reveal: "The scale clicks and a drawer slides open with a stamped piece of the code inside.",
    },
    {
      id: "rack",
      title: "The Cooling Rack",
      narrative:
        "Four trays of treats cool on the rack. Each tray's label shows an addition of two fractions of a pan, and the keeper wants them lined up from the least amount to the greatest.",
      gate: { needs: "compare-sums", label: "Comparing sums of fractions" },
      puzzle: {
        type: "order",
        prompt:
          "Put the four trays in order from the least total amount to the greatest total amount.",
        endLabels: { start: "least", end: "greatest" },
        items: [
          { id: "a", text: "1/2 + 1/4", token: "A", value: "3/4" },
          { id: "b", text: "1/3 + 1/2", token: "F", value: "5/6" },
          { id: "c", text: "1/6 + 1/3", token: "S", value: "1/2" },
          { id: "d", text: "2/3 + 1/4", token: "E", value: "11/12" },
        ],
        answer: ["c", "a", "b", "d"],
        hints: [
          "You cannot order the labels by looking at the numbers. Find each total first.",
          "Use twelfths for every tray so the totals are easy to compare.",
          "Write each total as twelfths, then order by the numerator.",
        ],
        misconceptions: [
          {
            tag: "largest-addend-first",
            has: ["b>c"],
            hint: "Check the totals, not the single fractions. One tray adds two small amounts, so it can be smaller than a tray with one big amount.",
          },
          {
            tag: "list-order",
            pick: "a,b,c,d",
            hint: "That is the order the trays sit on the rack. Order them by the size of the total instead.",
          },
        ],
        model: {
          text: "To order 1/2 + 1/4 and 1/3 + 1/3, write each total as twelfths: 3/4 is 9/12 and 2/3 is 8/12. Compare the tops, 8 and 9, and the second total is the smaller one.",
        },
        transfer: {
          type: "order",
          prompt: "Put these totals in order from the least to the greatest.",
          endLabels: { start: "least", end: "greatest" },
          items: [
            { id: "x", text: "1/4 + 1/4", token: "P", value: "1/2" },
            { id: "y", text: "1/2 + 1/3", token: "Q", value: "5/6" },
            { id: "z", text: "1/3 + 1/4", token: "R", value: "7/12" },
          ],
          answer: ["x", "z", "y"],
          hints: [
            "Find each total before you compare.",
            "Use twelfths so all three totals share a denominator.",
            "Compare the numerators of the three totals written in twelfths.",
          ],
        },
        why: "Writing every total with the same denominator lets you compare them by the number of parts.",
        supports: sup(
          "Use the Move up and Move down buttons. Find each total first.",
          ["The total of the first tray is ___.", "___ is less than ___ because ___."],
          ["least", "greatest", "total", "compare"],
        ),
      },
      reveal:
        "A letter plate falls from the rack, with four letters stamped in the order you chose.",
    },
    {
      id: "checker",
      title: "The Inspector's Shelf",
      narrative:
        "A student left a note on the last shelf: 1/4 + 2/3 = 3/7. The inspector's stamp will only drop if you can say which sentence explains the mistake.",
      gate: { needs: "error-analysis", label: "Explaining a fraction error" },
      puzzle: {
        type: "choice",
        prompt: "Which statement best explains the mistake in 1/4 + 2/3 = 3/7?",
        choices: [
          "The student should have multiplied the two fractions instead of adding them.",
          "The student found the right sum but forgot to write it as a mixed number.",
          "The student added the tops and added the bottoms, but fourths and thirds are different size pieces and cannot be counted together.",
          "The student should have subtracted the smaller fraction from the larger one.",
        ],
        answer: 2,
        tokens: ["H", "J", "K", "L"],
        hints: [
          "Read the note again. Which numbers did the student add?",
          "Think about what the bottom number of a fraction tells you about a piece.",
          "Ask whether fourths and thirds can be counted together without changing them first.",
        ],
        misconceptions: [
          {
            tag: "wrong-operation",
            pick: 0,
            hint: "The problem is about a total, so adding is the right operation. What went wrong inside the addition?",
          },
          {
            tag: "sum-is-not-the-issue",
            pick: 1,
            hint: "Check whether the sum is correct before you decide about a mixed number.",
          },
          {
            tag: "subtract-instead",
            pick: 3,
            hint: "The story gives two amounts that are put together, so it asks for a total.",
          },
        ],
        model: {
          text: "Suppose a student writes 1/2 + 1/3 = 2/5. The tops were added and the bottoms were added, but halves and thirds are different size pieces. The student should first rewrite both as sixths.",
        },
        transfer: {
          type: "choice",
          prompt: "A student writes 2/5 + 1/10 = 3/15. Which statement explains the mistake?",
          choices: [
            "The student added the numerators and the denominators instead of using the same size pieces first.",
            "The student should have multiplied by 10.",
            "The student wrote the answer as a decimal.",
          ],
          answer: 0,
          tokens: ["T", "U", "V"],
          hints: [
            "Look at which numbers were added in the top and in the bottom.",
            "Think about what the bottom number tells you about the size of a piece.",
            "Fifths and tenths need to match before the tops can be added.",
          ],
        },
        why: "A denominator names the size of the piece, so only pieces of the same size can be added by counting.",
        supports: sup(
          "Read all four statements and choose the one that explains the mistake.",
          ["The student added ___ and ___.", "The pieces are different ___."],
          ["numerator", "denominator", "different size", "mistake"],
        ),
      },
      reveal: "The inspector's stamp drops and leaves one letter on the shelf for the door code.",
    },
  ],
  door: {
    title: "The Cash Box Lock",
    prompt: "Type the code the keeper's note describes.",
    order: ["rack", "wall", "bowl", "checker"],
    success: "The lock turns and the cash box opens.",
  },
  reflection: {
    prompt:
      "Which room needed the idea that fractions must have the same size pieces before you add, and how did you use it?",
    frames: {
      ee: ["I used the idea in the ___ room.", "I made the pieces the ___ size."],
      dev: [
        "In the ___ room I rewrote the fractions so that ___.",
        "Then I could add because ___.",
      ],
      exp: ["The ___ room needed common denominators because ___."],
      br: ["Common denominators mattered most in the ___ room, where I used them to ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
