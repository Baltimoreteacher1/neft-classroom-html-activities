// Vocabulary for "Ratios and Rates" (grade 6 math). Original definitions and examples; every picture is a visual-kit spec.
const unitParts = (n, color) => Array.from({ length: n }, () => ({ label: "1", units: 1, color }));

/** Two-row tape diagram: one row per quantity, one block per unit. */
const tapeRows = (alt, rows, extra = {}) => ({
  kind: "tape",
  alt,
  w: 480,
  h: 220,
  rows: rows.map(([label, n, color]) => ({ label, parts: unitParts(n, color) })),
  ...extra,
});

/** Double number line drawn from primitives: top and bottom values share tick positions. */
const doubleLine = (alt, topLabel, bottomLabel, top, bottom, longDesc) => {
  const x0 = 70;
  const step = 360 / (top.length - 1);
  const items = [
    { t: "line", x1: x0 - 20, y1: 80, x2: 450, y2: 80, stroke: "navy", strokeWidth: 3 },
    { t: "line", x1: x0 - 20, y1: 170, x2: 450, y2: 170, stroke: "coral", strokeWidth: 3 },
    { t: "text", x: 8, y: 50, text: topLabel, fill: "navy", size: 15, weight: 700 },
    { t: "text", x: 8, y: 205, text: bottomLabel, fill: "coral", size: 15, weight: 700 },
  ];
  top.forEach((v, i) => {
    const x = x0 + i * step;
    items.push({ t: "line", x1: x, y1: 70, x2: x, y2: 90, stroke: "navy", strokeWidth: 2 });
    items.push({ t: "line", x1: x, y1: 160, x2: x, y2: 180, stroke: "coral", strokeWidth: 2 });
    items.push({
      t: "line",
      x1: x,
      y1: 90,
      x2: x,
      y2: 160,
      stroke: "line",
      strokeWidth: 1.5,
      dash: "4 4",
    });
    items.push({ t: "text", x, y: 64, text: String(v), anchor: "middle", fill: "ink", size: 16 });
    items.push({
      t: "text",
      x,
      y: 200,
      text: String(bottom[i]),
      anchor: "middle",
      fill: "ink",
      size: 16,
    });
  });
  return { kind: "shapes", alt, longDesc, w: 480, h: 240, items };
};

const entry = (e) => ({ tier: 2, domains: ["Speaking", "Writing"], klu: "Explain", ...e });

export default {
  id: "g6-math-ratios-and-rates",
  title: "Ratios and Rates: language, models and unit rates",
  grade: "6",
  band: "6-8",
  subject: "math",
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u2",
    note: "Matches the Ratios & Rates unit in the BCPSS curriculum seed. Words, examples and pictures are original; no publisher lesson numbers or text.",
  },
  standards: ["6.RP.A.1", "6.RP.A.3"],
  entries: [
    entry({
      id: "ratio",
      word: "ratio",
      pos: "noun",
      pron: "RAY-shee-oh",
      def: "A comparison of two quantities that tells how much of one there is for the amount of the other.",
      visual: tapeRows(
        "Two rows of blocks. The top row has two blue blocks and the bottom row has three white blocks, showing a ratio of 2 to 3.",
        [
          ["Blue", 2, "sky"],
          ["White", 3, "line"],
        ],
      ),
      context: "The paint mix has a ratio of 2 cups of blue to 3 cups of white.",
      nonExample: "Adding 2 and 3 to get 5 cups is not a ratio. A ratio compares the two amounts.",
      academicSentence: "A ratio compares two quantities, so the order of the numbers matters.",
      everyday: "Like 2 scoops of powder for every 3 cups of water.",
      es: { word: "razón", def: "Una comparación de dos cantidades.", verified: false },
      morphology: { parts: [{ part: "ratio", meaning: "Latin for reckoning or reason" }] },
      misconception: "Students add the two numbers instead of comparing them.",
      related: ["quantity", "for every", "part-to-part", "part-to-whole"],
      practice: {
        visualPrompt: "Look at the blocks. Say the ratio of blue to white.",
        speakWrite: "Say a ratio about our classroom, then write it with the word 'to'.",
        retrieval: "Which word names a comparison of two quantities?",
      },
    }),
    entry({
      id: "quantity",
      word: "quantity",
      pos: "noun",
      pron: "KWON-tuh-tee",
      def: "An amount you can count or measure, such as cups, miles or students.",
      visual: {
        kind: "shapes",
        alt: "Three cups drawn in a row labelled 3 cups next to a ruler segment labelled 12 inches, showing two different quantities.",
        w: 480,
        h: 200,
        items: [
          { t: "rect", x: 40, y: 60, w: 50, h: 70, fill: "sky", stroke: "navy" },
          { t: "rect", x: 110, y: 60, w: 50, h: 70, fill: "sky", stroke: "navy" },
          { t: "rect", x: 180, y: 60, w: 50, h: 70, fill: "sky", stroke: "navy" },
          { t: "text", x: 135, y: 160, text: "3 cups", anchor: "middle", fill: "ink", size: 16 },
          { t: "rect", x: 280, y: 85, w: 160, h: 20, fill: "ochre", stroke: "ink" },
          { t: "text", x: 360, y: 160, text: "12 inches", anchor: "middle", fill: "ink", size: 16 },
        ],
      },
      context: "In the paint mix, the two quantities are cups of blue and cups of white.",
      nonExample: "The color blue is not a quantity. Cups of blue paint is.",
      academicSentence:
        "Each ratio compares two quantities that are measured in the same situation.",
      es: { word: "cantidad", def: "Un monto que se puede contar o medir.", verified: false },
      related: ["ratio", "rate"],
      practice: {
        visualPrompt: "Point to the two quantities in the picture.",
        speakWrite: "Name two quantities in our school day, for example minutes and students.",
        retrieval: "What do we call an amount you can count or measure?",
      },
    }),
    entry({
      id: "for-every",
      word: "for every",
      pos: "phrase",
      pron: "for EV-ree",
      def: "Words that say how many of one thing go with each group of another thing.",
      visual: {
        kind: "shapes",
        alt: "Three equal groups. Each group shows 2 blue circles and 3 white circles, so there are 2 blue for every 3 white.",
        w: 480,
        h: 220,
        items: [0, 1, 2].flatMap((g) => {
          const x = 30 + g * 150;
          return [
            { t: "rect", x, y: 40, w: 130, h: 140, fill: "paper", stroke: "line", rx: 10 },
            { t: "circle", cx: x + 35, cy: 85, r: 16, fill: "sky", stroke: "navy" },
            { t: "circle", cx: x + 95, cy: 85, r: 16, fill: "sky", stroke: "navy" },
            { t: "circle", cx: x + 25, cy: 140, r: 16, fill: "paper", stroke: "ink" },
            { t: "circle", cx: x + 65, cy: 140, r: 16, fill: "paper", stroke: "ink" },
            { t: "circle", cx: x + 105, cy: 140, r: 16, fill: "paper", stroke: "ink" },
          ];
        }),
      },
      context: "There are 2 blue cups for every 3 white cups in each batch.",
      nonExample:
        "There are 2 blue cups and 3 white cups does not say the amounts go together in repeating groups.",
      academicSentence:
        "Ratio language such as 'for every' tells us the two amounts repeat together.",
      related: ["ratio", "per", "equivalent ratios"],
      practice: {
        visualPrompt: "Use the words 'for every' to describe each group in the picture.",
        speakWrite: "Complete: For every ___ there are ___. Say it, then write it.",
        retrieval: "Which phrase tells us two amounts repeat together in groups?",
      },
    }),
    entry({
      id: "part-to-part",
      word: "part-to-part ratio",
      pos: "noun",
      pron: "PART too PART RAY-shee-oh",
      def: "A ratio that compares one part of a group with another part of the same group.",
      visual: tapeRows(
        "A tape diagram with a row of 4 red blocks and a row of 6 gray blocks, comparing the red part with the gray part.",
        [
          ["Red", 4, "coral"],
          ["Gray", 6, "line"],
        ],
      ),
      context: "In the bag, the ratio of red marbles to gray marbles is 4 to 6.",
      nonExample: "Comparing the red marbles to all of the marbles in the bag is not part-to-part.",
      academicSentence: "A part-to-part ratio compares two groups that are both inside the whole.",
      related: ["part-to-whole", "ratio"],
      practice: {
        visualPrompt: "Which two parts does the picture compare?",
        speakWrite:
          "Describe a part-to-part ratio in our class, such as students with pencils to students with pens.",
        retrieval: "Which ratio compares one part of a group to another part?",
      },
    }),
    entry({
      id: "part-to-whole",
      word: "part-to-whole ratio",
      pos: "noun",
      pron: "PART too HOLE RAY-shee-oh",
      def: "A ratio that compares one part of a group with the entire group.",
      visual: {
        kind: "tape",
        alt: "One tape of 7 equal blocks. Four blocks are shaded teal and three are gray. A bracket over all 7 blocks reads 7 in all.",
        w: 480,
        h: 200,
        parts: [
          { label: "4", units: 4, color: "teal" },
          { label: "3", units: 3, color: "line" },
        ],
        total: 7,
      },
      context: "Four of the 7 posters on the wall are about recycling, a ratio of 4 to 7.",
      nonExample:
        "Comparing 4 recycling posters to 3 other posters is part-to-part, not part-to-whole.",
      academicSentence: "In a part-to-whole ratio, the second number is the total.",
      misconception:
        "Students compare the two parts and forget the second number must include the first part.",
      related: ["part-to-part", "ratio"],
      practice: {
        visualPrompt: "Which number in the picture is the whole?",
        speakWrite: "Say a part-to-whole ratio about the pencils on your table.",
        retrieval: "In which kind of ratio is the second number the total?",
      },
    }),
    entry({
      id: "equivalent-ratios",
      word: "equivalent ratios",
      pos: "noun phrase",
      pron: "ee-KWIV-uh-lunt RAY-shee-ohz",
      def: "Ratios that describe the same relationship, found by multiplying or dividing both numbers by the same amount.",
      visual: tapeRows(
        "A tape diagram with four rows. The first two rows show 2 blue blocks and 3 white blocks. The last two rows show the same pattern doubled, 4 blue blocks and 6 white blocks, so the two ratios are equivalent.",
        [["Blue", 2, "sky"], ["White", 3, "line"], ["Blue", 4, "sky"], ["White", 6, "line"]],
        { h: 260 },
      ),
      context:
        "The ratios 2 to 3 and 4 to 6 are equivalent because each number was multiplied by 2.",
      nonExample:
        "2 to 3 and 4 to 5 are not equivalent. Adding 2 to both numbers changes the relationship.",
      academicSentence:
        "Equivalent ratios keep the same relationship even though the numbers are different.",
      es: {
        word: "razones equivalentes",
        def: "Razones que describen la misma relación.",
        verified: false,
      },
      misconception: "Students add the same number to both quantities instead of multiplying both.",
      related: ["ratio table", "ratio", "unit rate"],
      practice: {
        visualPrompt: "How could you get the second row of blocks from the first?",
        speakWrite: "Write two equivalent ratios and explain what you multiplied by.",
        retrieval: "What do we call ratios that describe the same relationship?",
      },
    }),
    entry({
      id: "ratio-table",
      word: "ratio table",
      pos: "noun",
      pron: "RAY-shee-oh TAY-bul",
      def: "A table that lists equivalent ratios in rows so you can see how the two quantities grow together.",
      visual: {
        kind: "table",
        alt: "A ratio table with columns Blue cups and White cups. Rows: 2 and 3, 4 and 6, 6 and 9, 10 and 15.",
        head: ["Blue cups", "White cups"],
        rows: [
          ["2", "3"],
          ["4", "6"],
          ["6", "9"],
          ["10", "15"],
        ],
        highlight: [
          [3, 0],
          [3, 1],
        ],
      },
      context: "The ratio table shows that 10 cups of blue go with 15 cups of white.",
      nonExample:
        "A list of unrelated numbers is not a ratio table. Every row must be the same ratio.",
      academicSentence:
        "To extend a ratio table, multiply or divide both numbers in a row by the same number.",
      es: {
        word: "tabla de razones",
        def: "Una tabla que muestra razones equivalentes.",
        verified: false,
      },
      related: ["equivalent ratios", "unit rate"],
      practice: {
        visualPrompt: "Which row would come next if you doubled the last row?",
        speakWrite: "Explain how you know each row in a ratio table is equivalent.",
        retrieval: "Which tool lists equivalent ratios in rows?",
      },
    }),
    entry({
      id: "tape-diagram",
      word: "tape diagram",
      pos: "noun",
      pron: "TAYP DYE-uh-gram",
      def: "A drawing of rectangles in rows that shows how two or more quantities compare in equal-sized parts.",
      visual: tapeRows(
        "A tape diagram with one row of 3 sky-blue blocks labelled Sky and a row of 5 ochre blocks labelled Sun, drawn to the same block size.",
        [
          ["Sky", 3, "sky"],
          ["Sun", 5, "ochre"],
        ],
      ),
      context: "The tape diagram uses 3 blocks for the sky paint and 5 blocks for the sun paint.",
      nonExample:
        "A bar graph is not a tape diagram. Tape diagram blocks are all the same size so you can compare parts.",
      academicSentence: "Each block in a tape diagram stands for the same amount.",
      related: ["ratio", "part-to-part"],
      practice: {
        visualPrompt: "How many equal blocks are in each row?",
        speakWrite: "Draw a tape diagram for 2 to 5 and describe it in a sentence.",
        retrieval: "Which drawing uses equal blocks in rows to compare quantities?",
      },
    }),
    entry({
      id: "double-number-line",
      word: "double number line",
      pos: "noun",
      pron: "DUH-bul NUM-ber LYNE",
      def: "Two number lines, one above the other, that line up equivalent amounts of two quantities.",
      visual: doubleLine(
        "A double number line. The top line shows miles 0, 3, 6, 9, 12. The bottom line shows hours 0, 1, 2, 3, 4. Each mile mark lines up with the hour mark below it.",
        "Miles",
        "Hours",
        [0, 3, 6, 9, 12],
        [0, 1, 2, 3, 4],
        "Top line: 0, 3, 6, 9, 12 miles. Bottom line: 0, 1, 2, 3, 4 hours. Every 3 miles lines up with 1 hour.",
      ),
      context: "On the double number line, 9 miles lines up with 3 hours.",
      nonExample: "Two number lines that do not line up are not a double number line.",
      academicSentence:
        "A double number line shows that two quantities change together at the same rate.",
      related: ["rate", "unit rate", "equivalent ratios"],
      practice: {
        visualPrompt: "Which hour mark lines up with 6 miles?",
        speakWrite: "Describe what the dashed lines show on a double number line.",
        retrieval: "Which model uses two aligned lines to show equivalent amounts?",
      },
    }),
    entry({
      id: "rate",
      word: "rate",
      pos: "noun",
      pron: "RAYT",
      def: "A ratio that compares two quantities with different units, such as miles and hours.",
      visual: {
        kind: "table",
        alt: "A table with columns Miles and Hours showing the rate 12 miles in 3 hours.",
        head: ["Miles", "Hours"],
        rows: [["12", "3"]],
        highlight: [
          [0, 0],
          [0, 1],
        ],
      },
      context: "A cyclist's rate is 12 miles in 3 hours.",
      nonExample:
        "2 cups of blue to 3 cups of white are both cups, so that ratio is not usually called a rate.",
      academicSentence:
        "A rate compares quantities with different units, so we always say the units.",
      es: {
        word: "tasa",
        def: "Una razón que compara cantidades con unidades diferentes.",
        verified: false,
      },
      misconception: "Students leave out the units, so '12 to 3' loses its meaning.",
      related: ["unit rate", "per", "quantity"],
      practice: {
        visualPrompt: "Read the rate in the table out loud with both units.",
        speakWrite: "Write a rate about something you do each day. Include both units.",
        retrieval: "Which word names a ratio of two different units?",
      },
    }),
    entry({
      id: "unit-rate",
      word: "unit rate",
      pos: "noun phrase",
      pron: "YOO-nit RAYT",
      def: "A rate that tells the amount for exactly one unit of the second quantity, such as miles for one hour.",
      visual: doubleLine(
        "A double number line from 0 to 4 hours on the bottom and 0 to 48 miles on the top, with the marks 12 miles at 1 hour, 24 at 2, 36 at 3, 48 at 4.",
        "Miles",
        "Hours",
        [0, 12, 24, 36, 48],
        [0, 1, 2, 3, 4],
        "Top line: 0, 12, 24, 36, 48 miles. Bottom line: 0, 1, 2, 3, 4 hours. The first mark after zero shows 12 miles for 1 hour.",
      ),
      context: "The unit rate is 12 miles per hour, so the cyclist goes 12 miles in each hour.",
      nonExample:
        "12 miles in 3 hours is a rate, but it is not a unit rate because it is not for one hour.",
      academicSentence: "To find a unit rate, divide the first quantity by the second quantity.",
      es: {
        word: "tasa unitaria",
        def: "Una tasa para una sola unidad de la segunda cantidad.",
        verified: false,
      },
      misconception:
        "Students divide in the wrong order and get hours per mile instead of miles per hour.",
      related: ["rate", "per", "ratio table"],
      practice: {
        visualPrompt: "Find the mark for 1 hour. How many miles line up with it?",
        speakWrite: "Say and write a unit rate using the word 'per'.",
        retrieval: "Which rate is for exactly one unit?",
      },
    }),
    entry({
      id: "per",
      word: "per",
      pos: "preposition",
      pron: "PER",
      def: "A small word that means for each one, used to name a unit rate.",
      visual: {
        kind: "table",
        alt: "A table with a header row Dollars and Pencils and a highlighted row 1 dollar for 4 pencils, read as 4 pencils per dollar.",
        head: ["Dollars", "Pencils"],
        rows: [
          ["1", "4"],
          ["2", "8"],
          ["3", "12"],
        ],
        highlight: [
          [0, 0],
          [0, 1],
        ],
      },
      context: "The store sells 4 pencils per dollar.",
      nonExample: "'Per' does not mean the same as 'plus'. It means for each one.",
      academicSentence:
        "The word per introduces the quantity that equals one, as in miles per hour.",
      misconception:
        "Students treat per as a symbol for adding or multiplying instead of 'for each one'.",
      related: ["unit rate", "for every", "rate"],
      practice: {
        visualPrompt: "Read the highlighted row using the word per.",
        speakWrite: "Complete: ___ per ___. Say it, then write it with real numbers.",
        retrieval: "Which small word means for each one in a unit rate?",
      },
    }),
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
