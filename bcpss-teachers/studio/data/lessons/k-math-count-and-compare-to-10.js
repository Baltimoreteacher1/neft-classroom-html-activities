// Lesson pack: Count and Compare to 10 (kindergarten math). Original pictures, problems and talk moves.
// Every numeric answer carries a calc the validator recomputes. Picture-first; all words are spoken aloud in the player.
const SPOTS = [
  [30, 20],
  [140, 50],
  [250, 15],
  [360, 45],
  [60, 130],
  [180, 140],
  [300, 120],
  [400, 140],
  [100, 195],
  [270, 195],
];
const scatter = (icon, n, alt) => ({
  kind: "scene",
  bg: "plain",
  alt,
  w: 480,
  h: 250,
  items: SPOTS.slice(0, n).map(([x, y]) => ({ icon, x, y, s: 52 })),
});
const cluster = ([icon, n], x0) =>
  Array.from({ length: n }, (_, i) => ({
    icon,
    x: x0 + (i % 4) * 56,
    y: 20 + Math.floor(i / 4) * 70,
    s: 52,
  }));
const pair = (a, b, alt) => ({
  kind: "scene",
  bg: "plain",
  alt,
  w: 480,
  h: 250,
  items: [
    ...cluster(a, 10),
    { t: "line", x1: 240, y1: 10, x2: 240, y2: 240, sw: 3, dash: "6 6" },
    ...cluster(b, 260),
  ],
});
const dot = (cx, cy, fill = "teal", r = 22) => ({
  t: "circle",
  cx,
  cy,
  r,
  fill,
  stroke: "ink",
  sw: 2,
});
const tenFrame = (n, alt) => ({
  kind: "shapes",
  alt,
  w: 480,
  h: 280,
  items: [
    { t: "rect", x: 90, y: 100, w: 300, h: 120, fill: "surface", stroke: "ink", sw: 3 },
    { t: "line", x1: 90, y1: 160, x2: 390, y2: 160, sw: 3 },
    ...[1, 2, 3, 4].map((i) => ({
      t: "line",
      x1: 90 + i * 60,
      y1: 100,
      x2: 90 + i * 60,
      y2: 220,
      sw: 3,
    })),
    ...Array.from({ length: n }, (_, i) => dot(120 + (i % 5) * 60, 130 + Math.floor(i / 5) * 60)),
  ],
});
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const baskets = pair(
  ["apple", 6],
  ["orange", 4],
  "Two baskets. On the left side are six apples in two rows. On the right side are four oranges in one row.",
);
const ladybugs7 = scatter("ladybug", 7, "A group of seven ladybugs scattered across the page.");
const beesNine = scatter("bee", 9, "A group of nine bees scattered across the page.");
const frogsFish = pair(
  ["frog", 4],
  ["fish", 6],
  "Two groups. On the left are four frogs in one row. On the right are six fish in two rows.",
);
const cubesCubes = pair(
  ["unit-cube", 8],
  ["unit-cube", 5],
  "Two groups of cubes. On the left are eight cubes in two rows. On the right are five cubes.",
);
const platesSame = pair(
  ["cookie", 5],
  ["cookie", 5],
  "Two plates. Each has five cookies, in two short rows.",
);
const ducks4 = scatter("duck", 4, "Four ducks swimming in a pond.");
const eightStars = scatter("star", 8, "A group of eight stars scattered across the page.");

export default {
  id: "k-math-count-and-compare-to-10",
  kind: "lesson",
  title: "Count and Compare to 10",
  subtitle: "Count groups up to 10, then say which group has more, fewer or the same",
  grade: "K",
  band: "k-2",
  subject: "math",
  duration: 30,
  curriculum: {
    status: "district-referenced",
    unitId: "gk-math-u2",
    note: "Matches the unit Compare Numbers & Quantities to 10 in the BCPSS curriculum seed (K.CC.C.6 and K.CC.C.7 are listed there). The counting opener also uses K.CC.B.4 and K.CC.B.5, which the seed lists under the earlier counting unit. Pictures, problems and wording are original; the order of lessons inside the unit is not taken from any publisher sequence.",
  },
  standards: ["K.CC.B.4", "K.CC.B.5", "K.CC.C.6", "K.CC.C.7"],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain", "Inform"],
    domains: ["Listening", "Speaking"],
    cluster: "K",
  },
  contentObjective:
    "I can count a group of up to 10 things and tell whether one group has more, fewer or the same number as another group.",
  languageObjective:
    "I can say 'This group has more', 'This group has fewer' or 'The groups are the same' to compare two groups.",
  languageDemands: {
    functions: ["tell how many", "compare two groups", "give a reason by matching or counting"],
    structures: [
      "There are ___ ducks.",
      "___ has more than ___.",
      "___ has fewer than ___.",
      "The groups are the same.",
    ],
    discourse:
      "Partner talk with objects: count aloud together, then one partner says which group has more and the other asks 'How do you know?'",
    barriers: [
      "'more' also means 'again' in 'more please', so some children hear a request instead of a comparison",
      "'fewer' is a new word; children say 'less' for things they can count",
      "'same' can mean 'looks alike' as well as 'the same number'",
      "'how many' asks for the last number said, not for every number said",
    ],
    oralRehearse: [
      "There are seven ladybugs.",
      "The fish have more than the frogs. I matched and two fish were left over.",
      "The plates are the same. Nothing is left.",
    ],
    writeScaffold:
      "Children draw two groups and dictate or write: ___ has more than ___. Dictation is acceptable at every tier.",
  },
  vocab: {
    collection: "k-math-count-and-compare",
    ids: [
      "count",
      "number",
      "group",
      "more",
      "fewer",
      "same",
      "ten-frame",
      "zero",
      "one-more",
      "ten",
    ],
  },
  launch: {
    title: "Notice and Wonder: two baskets",
    visual: baskets,
    prompts: [
      "What do you see? Tell me what is in each basket.",
      "What do you wonder about the two baskets?",
      "Which basket has more fruit? How could we find out without guessing?",
    ],
    teacherNote:
      "Show the picture and give children thirty seconds of silent looking. Take two noticings such as 'there are apples' or 'oranges are on the other side', then one wondering. If a child says 'the apples have more', ask 'How can you check?' and write the word 'match' or 'count' on the chart. Do not tell the answer yet. The second sorting activity includes groups that are spread out so they look bigger than they are, so this is the moment to bring up that looking can fool us.",
  },
  teach: {
    model: [
      "Counting tells how many. Touch one thing and say one number. Say the numbers in order: one, two, three. The last number you say tells how many. If the things are scattered, push each one aside as you count it so none is counted twice.",
      "To compare two groups, match them. Put one apple next to one orange. Keep going until one group runs out. If there are things left over, that group has more. The group that ran out has fewer. If nothing is left on either side, the groups are the same.",
      "You can also compare by counting both groups. Six apples and four oranges: six is a bigger number than four, so the apples have more. Four is a smaller number, so the oranges have fewer. On a ten frame, the group that fills more spaces has more.",
      "Looking can fool us. A group that is spread out can take up more room and still have fewer things. A short row of big things can have more things than a long row of small ones. Always match or count.",
      "Say the whole sentence. 'The apples have more than the oranges.' 'The oranges have fewer than the apples.' 'The plates are the same.' Say the sentence aloud first, then point to each group as you say it.",
    ],
    moves: [
      "Count every group aloud with the class, touching each object once and moving it to the side. Say the last number twice: 'One, two, three. Three ducks.'",
      "Use real objects first (counters, cubes, crackers), then pictures. Match with string or with a partner's hands before using numbers.",
      "Always ask 'How do you know?' after a comparison and accept two reasons: 'I matched and some were left' or 'I counted and one number is bigger'.",
      "Place a ten frame beside every group of up to ten so the shape of the number becomes familiar: five is one full row, ten is a full frame.",
      "Teach 'fewer' with objects and a gesture (palm down, low). When a child says 'less', repeat the sentence with 'fewer' and move on.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt: "Touch each ladybug once and count. How many ladybugs are there?",
      answer: 7,
      hint: "Push each ladybug aside as you count it. The last number you say tells how many.",
      visual: ladybugs7,
      supports: {
        ee: {
          frames: ["There are ___ ladybugs.", "I count ___."],
          wordBank: ["count", "number", "ladybugs"],
          visual: ladybugs7,
          oral: "Touch each ladybug. Say one number for each touch.",
        },
        dev: {
          frames: ["There are ___ ladybugs because the last number I said was ___."],
          wordBank: ["count", "last number"],
          visual: ladybugs7,
        },
        exp: { frames: ["I counted ___ ladybugs. I know because ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "There are 4 frogs and 6 fish. Which group has more?",
      choices: ["The frogs", "The fish", "The groups are the same"],
      answer: 1,
      hint: "Match one frog with one fish. Which group has animals left over?",
      visual: frogsFish,
      supports: {
        ee: {
          frames: ["The ___ have more.", "___ are left over."],
          wordBank: ["more", "frogs", "fish", "match"],
          visual: frogsFish,
          oral: "Point to a frog and a fish. Match them one to one.",
        },
        dev: {
          frames: ["The ___ have more than the ___.", "I matched and ___ were left over."],
          wordBank: ["more", "match", "left over"],
          visual: frogsFish,
        },
        exp: { frames: ["The ___ have more than the ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "There are 8 cubes on the left and 5 cubes on the right. Which group has fewer?",
      choices: ["The left group", "The right group", "The groups are the same"],
      answer: 1,
      hint: "Match the cubes. Which group runs out first?",
      visual: cubesCubes,
      supports: {
        ee: {
          frames: ["The ___ group has fewer.", "It ran out first."],
          wordBank: ["fewer", "left", "right", "match"],
          visual: cubesCubes,
          oral: "Match each cube on the right to a cube on the left.",
        },
        dev: {
          frames: ["The ___ group has fewer than the ___ group.", "I matched and the ___ ran out."],
          wordBank: ["fewer", "ran out"],
          visual: cubesCubes,
        },
        exp: { frames: ["The ___ group has fewer cubes because ___ ran out first."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Each plate has 5 cookies. What can you say about the plates?",
      choices: [
        "The left plate has more",
        "The right plate has more",
        "The plates have the same number",
      ],
      answer: 2,
      hint: "Match one cookie with one cookie. Is anything left over on either plate?",
      visual: platesSame,
      supports: {
        ee: {
          frames: ["The plates are the ___.", "Nothing is left."],
          wordBank: ["same", "match", "cookies"],
          visual: platesSame,
          oral: "Match cookie to cookie with your fingers.",
        },
        dev: {
          frames: [
            "The plates have the same number because ___.",
            "I matched and nothing was ___.",
          ],
          wordBank: ["same", "match", "nothing left"],
          visual: platesSame,
        },
        exp: {
          frames: ["The plates have the same number of cookies because every ___ has a ___."],
        },
        br: {},
      },
    },
    {
      id: "g5",
      type: "choice",
      prompt: "Which number is greater, 3 or 8?",
      choices: ["3", "8"],
      answer: 1,
      hint: "Think about which number you say later when you count up from one.",
      supports: {
        ee: {
          frames: ["___ is greater.", "I say ___ later."],
          wordBank: ["greater", "count up", "3", "8"],
          visual: tenFrame(
            8,
            "A ten frame with eight counters: a full top row of five and three in the bottom row.",
          ),
          oral: "Count up from one. Which number do you reach last, three or eight?",
        },
        dev: {
          frames: ["___ is greater than ___ because I say it later when I count."],
          wordBank: ["greater", "less", "count up"],
        },
        exp: { frames: ["___ is greater than ___ because it comes later when we count up."] },
        br: {},
      },
    },
    {
      id: "g6",
      type: "numeric",
      prompt: "There are 4 ducks in the pond. One more duck comes. How many ducks are there now?",
      answer: 5,
      calc: "4+1",
      hint: "Say how many ducks you have. Then say the next number for the one more duck.",
      visual: ducks4,
      supports: {
        ee: {
          frames: ["Now there are ___ ducks.", "One more makes ___."],
          wordBank: ["one more", "ducks", "count on"],
          visual: ducks4,
          oral: "Say four. Then say the next number for one more duck.",
        },
        dev: {
          frames: ["Four and one more makes ___.", "The number goes up by ___."],
          wordBank: ["one more", "next number"],
          visual: ducks4,
        },
        exp: {
          frames: ["There are ___ ducks now because one more makes the number go up by one."],
        },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Cube compare",
    task: "Partner A grabs a small handful of connecting cubes (no more than 10) and Partner B does the same. Each partner counts their own cubes aloud, touching each cube once, and says 'I have ___ cubes.' Then they line up their cubes side by side, one to one. Partner A says the comparison sentence ('My cubes have more than yours' or 'fewer' or 'The groups are the same'). Partner B checks by counting both groups and agrees or disagrees with a reason. Swap jobs and play three rounds. Each partner draws one of their rounds on paper and dictates the sentence.",
    roles: ["Counter", "Matcher"],
    discussionCards: [
      {
        prompt: "How many cubes do you have? Count aloud and touch each cube once.",
        frame: "I have ___ cubes.",
      },
      {
        prompt: "Whose group has more? Match your cubes and look for the ones left over.",
        frame: "___ has more than ___. I matched and ___ were left over.",
      },
      {
        prompt: "How can you check the answer a second way?",
        frame: "I counted both groups. ___ is a bigger number than ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: two ways to compare",
      visualOrModel: baskets,
      teacherNote:
        "Place a ten frame under the apples and another under the oranges. Match the fruit by drawing a line from each orange to an apple on the board. Point out the two apples with no partner. Then count: six and four. Show that both ways give the same answer.",
    },
    discuss: {
      title: "Say it: claim and check",
      structure:
        "Turn and talk. Partner 1 points to two groups and says which has more, fewer or if they are the same. Partner 2 asks 'How do you know?' and Partner 1 shows matching or counting. Swap.",
      frames: [
        "___ has more than ___.",
        "How do you know?",
        "I matched them and ___ were left over.",
        "I counted. ___ is a bigger number.",
      ],
    },
    apply: {
      title: "Use it: snack time",
      task: "Make two snack plates with counters or crackers (up to 10 on each). Put a different number on each plate. Match the plates one to one and say which plate has more and which has fewer. Then make the plates the same by adding or taking away. Draw the plates when they are the same and tell a grown-up how you made them the same.",
      successCriteria: [
        "I count each plate and say the last number.",
        "I match one to one to find what is left over.",
        "I say more, fewer or the same.",
        "I make the plates the same.",
      ],
    },
  },
  activities: [
    { engine: "early-sort", id: "k-math-count-groups-sort" },
    { engine: "early-sort", id: "k-math-more-fewer-same-sort" },
    { engine: "visual-match", id: "k-math-count-compare-words-match" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt: "Count the bees. How many bees are there?",
        answer: 9,
        visual: beesNine,
        explain: "Touch each bee once. The last number said is nine.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "There are 5 cows and 8 pigs. Which group has more?",
        choices: ["The cows", "The pigs", "The groups are the same"],
        answer: 1,
        explain: "Eight is a bigger number than five, so the pigs have more.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "There are 7 hats and 4 caps. Which group has fewer?",
        choices: ["The hats", "The caps", "The groups are the same"],
        answer: 1,
        explain: "Four is a smaller number than seven, so the caps have fewer.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "There are 6 red cubes and 6 blue cubes. What can you say?",
        choices: ["Red has more", "Blue has more", "The groups are the same"],
        answer: 2,
        explain: "Six and six match with none left over, so the groups are the same.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "Which number is less, 9 or 4?",
        choices: ["9", "4"],
        answer: 1,
        explain: "Four is said before nine when we count up, so four is less.",
      },
      {
        id: "i6",
        type: "numeric",
        prompt:
          "There are 6 apples in the basket. One more apple goes in. How many apples are in the basket now?",
        answer: 7,
        calc: "6+1",
        explain: "One more makes the number go up by one: six, then seven.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Draw two groups of dots. Make one group have more than the other. Tell a friend how you know.",
        answer:
          "Any two groups where matching leaves extras in one group. The child says 'I matched and some were left' or compares the counted numbers.",
        explain: "Accept dictated or oral answers. Look for matching or counting as the reason.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt: "Count the stars. How many stars are there?",
        answer: 8,
        visual: eightStars,
        explain: "Touch each star once. The last number said is eight.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "There are 3 birds and 7 worms. Which group has more?",
        choices: ["The birds", "The worms", "The groups are the same"],
        answer: 1,
        explain: "Seven is a bigger number than three, so the worms have more.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Two plates have 5 crackers each. Tell what you notice and how you know.",
        answer:
          "The plates have the same number. Matching leaves nothing, or both counts are five.",
        explain: "Accept oral answers that name the same number and a reason.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you know about counting and comparing.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt: "There are 9 buttons on the table. Count them. How many buttons are there?",
        answer: 9,
        explain: "Nine is one less than a full ten frame.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "One group has 4 pencils. One group has 6 pencils. Which group has fewer?",
        choices: ["The group of 4", "The group of 6", "The groups are the same"],
        answer: 0,
        explain: "Four is a smaller number than six, so the group of four has fewer.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Say one way to tell which group has more.",
        answer:
          "Match one to one and see which group has extras, or count both groups and compare the numbers.",
        explain: "Accept either strategy, said or shown with objects.",
      },
    ],
    successCriteria: [
      "I touch each thing once when I count.",
      "I match or count to compare.",
      "I use the words more, fewer or the same.",
    ],
  },
  answerKey: {
    notes:
      "Accept answers said aloud, shown with fingers or objects, or dictated to an adult. For comparison items, require a reason (matching or counting), not only the answer. Count carefully when children say 'ten' for a group of nine: check that no object was counted twice.",
    items: {
      g1: "7 ladybugs. Touch each one once; the last number said is seven.",
      g2: "The fish. Matching leaves two fish with no frog partner, so the fish have more.",
      g3: "The right group. Matching leaves three cubes on the left with no partner, so the right group has fewer.",
      g4: "The plates have the same number. Every cookie has a partner and none are left.",
      g5: "8. Eight comes later than three when we count up, so eight is greater.",
      g6: "5 ducks. Four and one more makes five.",
      i1: "9 bees. Touch each one once; the last number said is nine.",
      i2: "The pigs. Eight is a bigger number than five.",
      i3: "The caps. Four is a smaller number than seven.",
      i4: "The groups are the same. Six and six match with none left over.",
      i5: "4. Four is said before nine when we count up.",
      i6: "7 apples. Six and one more makes seven.",
      i7: "Any two groups where one has extras, with matching or counting as the reason.",
      f1: "8 stars.",
      f2: "The worms. Seven is a bigger number than three.",
      f3: "The plates have the same number. Matching leaves nothing, or both counts are five.",
      e1: "9 buttons.",
      e2: "The group of 4. Four is a smaller number than six.",
      e3: "Match one to one and see which group has extras, or count both and compare the numbers.",
    },
  },
  extension: {
    title: "Make them the same",
    task: "Take two groups with different numbers of counters, such as 4 and 7. Count each group and say which has more. How many counters must move or be added so the groups are the same? Try it with counters. Then try a new pair of groups and find a way to make them the same by taking away from the bigger group and by adding to the smaller group. Draw one of your tries and tell a friend what you did.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo contar un grupo de hasta 10 cosas y decir si un grupo tiene más, menos o la misma cantidad que otro.",
      vocab: [
        { en: "count", es: "contar", verified: true },
        { en: "number", es: "número", verified: true },
        { en: "group", es: "grupo", verified: true },
        { en: "more", es: "más", verified: true },
        { en: "fewer", es: "menos", verified: true },
        { en: "same", es: "igual", verified: true },
        { en: "zero", es: "cero", verified: true },
        { en: "ten", es: "diez", verified: true },
        { en: "ten frame", es: "cuadro de diez", verified: false },
      ],
      familyPrompt:
        "Pongan dos platos con galletas, frijoles o botones. Cuenten cada plato juntos y digan cuál tiene más, cuál tiene menos o si tienen la misma cantidad. Pregunten: ¿cómo lo sabes?",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 4 minutes. Teach 6 minutes with objects. Guided practice 6 minutes (g1 to g4 live, g5 and g6 as time allows). Cube compare or an activity 10 minutes. Exit ticket 4 minutes, said or drawn. For a shorter session, run the first sorting activity today and the compare activity tomorrow.",
    misconceptions: [
      "Space judging: children say a spread-out group has more because it covers more room. Ask them to match one to one and count the leftovers.",
      "Double counting or skipping: children touch one object twice or miss one. Have them push each object aside as they count it.",
      "Rote counting without cardinality: children say 'one, two, three, four, five' and answer 'three' when asked how many. Repeat the last number as the total: 'Five. There are five.'",
      "'More' means 'again': a child hears 'which has more?' as a request for another turn. Use 'more than' and say the full sentence.",
      "Bigger number thinking is hard when the bigger group is made of smaller objects. Use identical objects (counters) before mixed pictures.",
    ],
    differentiation:
      "Entering and Emerging learners point, count with the teacher, and use the frames on every item, answering by pointing or with one word. Developing learners say the full comparison sentence. Expanding and Bridging learners give two reasons (matching and counting). The numbers and the questions never change by tier. Only the language support changes. For children ready for more, extend to 'make them the same' with counters.",
    languageNotes:
      "Model 'more than' and 'fewer than' with gestures: hands wide for more, palm low for fewer. Teach 'same' with two identical objects held side by side. Accept first-language counting and then give the English number name. Count in English and in the home language together when a family member can help.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
