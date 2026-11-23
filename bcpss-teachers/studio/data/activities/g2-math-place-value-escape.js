// Grade 2 math escape challenge: tens and ones in two-digit numbers. Original story and numbers.
// Code pieces are derived from the learner's own correct answers (see engines/escape-challenge.schema.md).
const txt = (text, x, y, size = 36) => ({ t: "text", text, x, y, size, weight: 700 });
function blocks(t, o, x0 = 40, y0 = 60, sc = 1) {
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
}
const shapes = (alt, items) => ({ kind: "shapes", alt, w: 480, h: 240, items });

export default {
  id: "g2-math-place-value-escape",
  engine: "escape-challenge",
  title: "Unlock the Garden Shed",
  grade: "2",
  band: "k-2",
  subject: "math",
  lessonId: "g2-math-place-value-to-100",
  standards: ["2.NBT.A.1", "1.NBT.B.2"],
  vocabIds: ["tens", "ones", "place-value", "two-digit-number", "greater-than"],
  minutes: 15,
  intro:
    "The school garden shed is locked. Open four rooms to find pieces of the code. Each piece comes from your own answer about tens and ones.",
  curriculum: {
    status: "standards-aligned",
    note: "Original practice on tens and ones in two-digit numbers. Aligned to 2.NBT.A.1 and 1.NBT.B.2; not tied to a publisher lesson.",
  },
  story: {
    title: "The Garden Shed Surprise",
    setting: "The school garden at the end of the day. Gray clouds are gathering.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "The garden helper locked the shed with the watering cans inside, and a note was left on the door: four rooms hold the pieces of the code. Every piece comes from a number you find.",
      },
      {
        id: "after-seeds",
        after: "seeds",
        text: "You counted every seed packet. A tag hangs behind the shelf and points across the yard to the sign board.",
      },
      {
        id: "after-signs",
        after: "signs",
        text: "The right sign swings open. Behind it is a map of the garden rows, with four stakes lying in the grass.",
      },
      {
        id: "after-stakes",
        after: "stakes",
        text: "The stakes stand in order, and the rows look neat. A last clue points you to the tool wall.",
      },
      {
        id: "end",
        after: "end",
        text: "The lock clicks and the shed door swings open. Watering cans, trowels and gloves are all there, and the garden gets its water before the rain.",
      },
    ],
  },
  rooms: [
    {
      id: "seeds",
      title: "The Seed Shelf",
      narrative:
        "Boxes of seed packets fill the shelf. Each full box holds 10 packets. A card says there are 4 full boxes and 7 loose packets.",
      gate: { needs: "tens-and-ones-count", label: "Counting tens and ones" },
      reveal: "Behind the last box you find a brass tag stamped with the first piece of the code.",
      puzzle: {
        type: "numeric",
        prompt:
          "A shelf has 4 full boxes with 10 seed packets in each box, and 7 loose packets. How many seed packets are on the shelf?",
        visual: shapes(
          "Four full boxes of ten, drawn as four ten-rods, and seven loose packets, drawn as seven single squares.",
          blocks(4, 7, 140, 50, 1),
        ),
        answer: "47",
        calc: "4*10+7",
        unit: "packets",
        hints: [
          "A full box is a group of ten. Count the boxes by tens first.",
          "Count by tens for each full box, then keep counting the loose ones one at a time.",
          "Say the amount for the boxes. Then add the loose packets to it.",
        ],
        misconceptions: [
          {
            tag: "added-the-digits",
            pick: "11",
            hint: "You added the 4 and the 7. A full box counts as ten packets, not as one packet.",
          },
          {
            tag: "swapped-digits",
            pick: "74",
            hint: "Your number has the digits in the other order. The boxes are the tens, and the loose packets are the ones.",
          },
          {
            tag: "forgot-the-loose",
            pick: "40",
            hint: "That counts only the full boxes. The loose packets are on the shelf too.",
          },
        ],
        model: {
          text: "A bakery shelf has 3 full trays with 10 rolls in each tray, and 5 loose rolls. Three tens is 30. Then 30 and 5 more is 35 rolls. The trays are the tens and the loose rolls are the ones.",
          visual: shapes(
            "Three full trays of ten, drawn as three ten-rods, and five loose rolls, drawn as five single squares.",
            blocks(3, 5, 150, 50, 1),
          ),
        },
        why: "Four boxes of ten make 40 packets. Seven loose packets are added, so there are 47 packets in all.",
        transfer: {
          type: "numeric",
          prompt:
            "A store has 5 bags with 10 marbles in each bag, and 2 loose marbles. How many marbles does the store have?",
          answer: "52",
          calc: "5*10+2",
          unit: "marbles",
          hints: [
            "Each bag is a group of ten. Count the bags by tens.",
            "Count by tens for each bag, then count the loose marbles.",
            "Say the amount for the bags. Then add the loose marbles to it.",
          ],
          why: "Five bags of ten make 50 marbles. Two loose marbles make 52 in all.",
        },
        supports: {
          ee: {
            directions: "Each box is ten. Count the boxes by tens. Then count the loose packets.",
            frames: ["___ boxes of ten is ___.", "Then ___ more makes ___."],
            wordBank: ["tens", "ones", "box", "loose"],
            oral: "Count by tens: ten, twenty, thirty, forty. Then count the loose ones.",
          },
          dev: {
            frames: ["___ tens and ___ ones is ___."],
            wordBank: ["tens", "ones", "count on"],
          },
          exp: {
            frames: [
              "There are ___ packets because ___ tens is ___ and the ___ loose ones make ___.",
            ],
          },
          br: {},
        },
      },
    },
    {
      id: "signs",
      title: "The Sign Board",
      narrative:
        "Four number signs hang on a wooden board. A clue card is pinned in the middle. Only one sign matches the clue card.",
      gate: { needs: "read-tens-and-ones", label: "Reading tens and ones as a number" },
      reveal: "The matching sign flips over and shows a brass letter. You copy it into your notes.",
      puzzle: {
        type: "choice",
        prompt:
          "The clue card shows 6 tens and 3 ones. Which sign shows the number that matches the clue card?",
        visual: shapes(
          "A clue card with six ten-rods and three single squares.",
          blocks(6, 3, 140, 50, 1),
        ),
        choices: ["36", "63", "60", "9"],
        answer: 1,
        tokens: ["R", "O", "W", "S"],
        hints: [
          "Say the tens first, then the ones.",
          "Six tens is a number you can count by tens. Then add the ones.",
          "Check that the tens digit of your sign matches the number of tens on the card.",
        ],
        misconceptions: [
          {
            tag: "swapped-digits",
            pick: 0,
            hint: "That sign has the digits in the other order. Which digit is in the tens place?",
          },
          {
            tag: "forgot-the-ones",
            pick: 2,
            hint: "That sign shows only the tens. The card has ones too.",
          },
          {
            tag: "added-the-digits",
            pick: 3,
            hint: "That sign comes from adding 6 and 3. Each ten on the card is worth ten, not one.",
          },
        ],
        model: {
          text: "A clue card shows 2 tens and 5 ones. Two tens is 20. Five ones is 5 more. Twenty and five is the number 25. The tens digit is 2 and the ones digit is 5.",
        },
        why: "Six tens is 60, and 3 ones more makes 63. The 6 is in the tens place and the 3 is in the ones place.",
        transfer: {
          type: "choice",
          prompt:
            "A clue card shows 8 tens and 2 ones. Which sign shows the number that matches the clue card?",
          choices: ["28", "82", "80", "10"],
          answer: 1,
          tokens: ["P", "Q", "R", "T"],
          hints: [
            "Say the tens first, then the ones.",
            "Eight tens is a number you can count by tens. Then add the ones.",
            "Check that the tens digit of your sign matches the number of tens on the card.",
          ],
          why: "Eight tens is 80, and 2 ones more makes 82.",
        },
        supports: {
          ee: {
            directions:
              "The first digit tells how many tens. The second digit tells how many ones.",
            frames: ["The card shows ___ tens and ___ ones.", "The number is ___."],
            wordBank: ["tens", "ones", "digit"],
            oral: "Say: six tens. Say: three ones. Put them together.",
          },
          dev: {
            frames: ["___ tens and ___ ones is the number ___."],
            wordBank: ["tens digit", "ones digit"],
          },
          exp: {
            frames: [
              "The sign is ___ because the ___ is in the tens place and the ___ is in the ones place.",
            ],
          },
          br: {},
        },
      },
    },
    {
      id: "stakes",
      title: "The Garden Rows",
      narrative:
        "Four row stakes lie in the grass, each with a number. The garden helper wants the rows in order, with the smallest number first and the greatest number last.",
      gate: { needs: "order-two-digit", label: "Ordering two-digit numbers" },
      reveal: "As the last stake clicks into place, a small door opens and a brass key slides out.",
      puzzle: {
        type: "order",
        prompt: "Put the four row stakes in order from the least number to the greatest number.",
        endLabels: { start: "least", end: "greatest" },
        items: [
          { id: "a", text: "39", token: "T", value: "39" },
          { id: "b", text: "48", token: "E", value: "48" },
          { id: "c", text: "84", token: "N", value: "84" },
          { id: "d", text: "93", token: "S", value: "93" },
        ],
        answer: ["a", "b", "c", "d"],
        hints: [
          "Look at the tens digits first. The number with the fewest tens is the least.",
          "If two numbers have the same digits, compare which digit is in the tens place.",
          "Check your line from left to right. Each tens digit should be as big as or bigger than the one before it.",
        ],
        misconceptions: [
          {
            tag: "reversed-order",
            pick: "d,c,b,a",
            hint: "That line starts with the greatest number. The least number goes first.",
          },
          {
            tag: "digits-not-places",
            has: ["c>b"],
            hint: "Two of these numbers use the same two digits. Look at which digit is in the tens place for each.",
          },
        ],
        model: {
          text: "Order 21, 12 and 30 from least to greatest. Look at the tens first. 12 has 1 ten, 21 has 2 tens and 30 has 3 tens. So the order is 12, 21, 30.",
        },
        why: "The tens decide the order. 39 has 3 tens, 48 has 4 tens, 84 has 8 tens and 93 has 9 tens, so they go from least to greatest in that line.",
        transfer: {
          type: "order",
          prompt: "Put these four stakes in order from the least number to the greatest number.",
          endLabels: { start: "least", end: "greatest" },
          items: [
            { id: "a", text: "72", token: "M", value: "72" },
            { id: "b", text: "17", token: "A", value: "17" },
            { id: "c", text: "70", token: "I", value: "70" },
            { id: "d", text: "27", token: "L", value: "27" },
          ],
          answer: ["b", "d", "c", "a"],
          hints: [
            "Compare the tens digits first.",
            "Two numbers have 7 tens. Then look at the ones to decide which comes first.",
            "The number with the most tens and the most ones goes at the end.",
          ],
          why: "17 has 1 ten and 27 has 2 tens. 70 and 72 both have 7 tens, and 72 has more ones, so it goes last.",
        },
        supports: {
          ee: {
            directions: "Look at the tens first. The least number goes on the left.",
            frames: ["___ has the fewest tens.", "___ is the greatest."],
            wordBank: ["least", "greatest", "tens", "ones"],
            oral: "Say each number as tens and ones. Which has the fewest tens?",
          },
          dev: {
            frames: ["___ is less than ___ because it has fewer tens."],
            wordBank: ["less than", "greater than", "tens"],
          },
          exp: { frames: ["I put ___ before ___ because ___ tens is less than ___ tens."] },
          br: {},
        },
      },
    },
    {
      id: "tools",
      title: "The Tool Wall",
      narrative:
        "Three tags hang above the tool hooks. Each tag shows tens and ones. The number tags are on the shelf below, and each tag must go to its number.",
      gate: { needs: "match-tens-ones-number", label: "Matching tens and ones to a number" },
      reveal:
        "Each tool lights up when its tag is matched, and the last one drops a brass plate into your hand.",
      puzzle: {
        type: "match",
        prompt: "Match each tens-and-ones tag to the number it makes.",
        lefts: [
          { id: "l1", text: "5 tens and 6 ones", calc: "5*10+6" },
          { id: "l2", text: "6 tens and 5 ones", calc: "6*10+5" },
          { id: "l3", text: "9 tens and 0 ones", calc: "9*10" },
        ],
        rights: [
          { id: "r1", text: "56", token: "G", value: "56" },
          { id: "r2", text: "65", token: "A", value: "65" },
          { id: "r3", text: "90", token: "T", value: "90" },
          { id: "r4", text: "95", token: "E", value: "95" },
          { id: "r5", text: "11", token: "S", value: "11" },
        ],
        answer: { l1: "r1", l2: "r2", l3: "r3" },
        hints: [
          "Say each tag as tens, then ones. Write the tens digit first.",
          "Look for a number whose tens digit matches the number of tens on the tag.",
          "A tag with zero ones ends in the digit zero.",
        ],
        misconceptions: [
          {
            tag: "swapped-tens-ones",
            pick: "l1=r2;l2=r1;l3=r3",
            hint: "Two of your matches have the digits switched. Which digit is in the tens place?",
          },
          {
            tag: "added-the-digits",
            has: ["l1=r5"],
            hint: "One match comes from adding the two digits. A ten is worth ten, not one.",
          },
        ],
        model: {
          text: "A tag says 3 tens and 4 ones. Three tens is 30 and 4 ones is 4. Thirty and four is 34, so the tag goes with the number 34. The 3 is in the tens place and the 4 is in the ones place.",
        },
        why: "The tens digit tells how many tens and the ones digit tells how many ones. 5 tens and 6 ones is 56, 6 tens and 5 ones is 65, and 9 tens is 90.",
        transfer: {
          type: "match",
          prompt: "Match each tens-and-ones tag to the number it makes.",
          lefts: [
            { id: "l1", text: "2 tens and 8 ones", calc: "2*10+8" },
            { id: "l2", text: "8 tens and 2 ones", calc: "8*10+2" },
            { id: "l3", text: "4 tens and 0 ones", calc: "4*10" },
          ],
          rights: [
            { id: "r1", text: "28", token: "X", value: "28" },
            { id: "r2", text: "82", token: "Y", value: "82" },
            { id: "r3", text: "40", token: "Z", value: "40" },
            { id: "r4", text: "10", token: "W", value: "10" },
          ],
          answer: { l1: "r1", l2: "r2", l3: "r3" },
          hints: [
            "Say each tag as tens, then ones.",
            "Look for a number whose tens digit matches the number of tens on the tag.",
            "A tag with zero ones ends in the digit zero.",
          ],
          why: "2 tens and 8 ones is 28, 8 tens and 2 ones is 82, and 4 tens is 40.",
        },
        supports: {
          ee: {
            directions: "The first digit is the tens. The second digit is the ones.",
            frames: ["___ tens and ___ ones is ___."],
            wordBank: ["tens", "ones", "match"],
            oral: "Read each tag aloud. Find the number with that tens digit.",
          },
          dev: {
            frames: ["___ tens and ___ ones makes ___."],
            wordBank: ["tens digit", "ones digit"],
          },
          exp: {
            frames: [
              "The tag matches ___ because the tens digit is ___ and the ones digit is ___.",
            ],
          },
          br: {},
        },
      },
    },
  ],
  door: {
    title: "The Shed Door",
    prompt: "Type the code the garden helper's note describes.",
    order: ["seeds", "signs", "stakes", "tools"],
    success: "The lock clicks. The shed door swings open and the watering cans are inside.",
  },
  supports: {
    ee: {
      directions: "Say the tens and ones out loud. Use the pictures.",
      frames: ["___ tens and ___ ones."],
      wordBank: ["tens", "ones"],
    },
    dev: { frames: ["___ tens and ___ ones is ___."] },
    exp: { frames: ["The number is ___ because ___."] },
    br: {},
  },
  reflection: {
    prompt: "Which room was the hardest? Explain how tens and ones helped you.",
    frames: {
      ee: ["The ___ room was hard.", "Tens and ones helped me."],
      dev: ["The ___ room was hard because ___.", "I used tens and ones to ___."],
      exp: ["The hardest room was ___ because ___. Tens and ones helped me by ___."],
      br: ["Thinking about place value in the ___ room helped me because ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
