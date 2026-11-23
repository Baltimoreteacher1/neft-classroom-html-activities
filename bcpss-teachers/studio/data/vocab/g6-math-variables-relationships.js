// Vocabulary for "Variables and Relationships" (grade 6 math, 6.EE.C.9). Original definitions and examples.
// Every picture is a visual-kit spec. Picture text and alt text never print the entry's own word, so the
// vocab-quest picture-word items stay fair.
const entry = (e) => ({ tier: 2, domains: ["Speaking", "Writing"], klu: "Explain", ...e });

const hose = {
  head: ["x (minutes)", "y (gallons)"],
  rows: [
    ["1", "4"],
    ["2", "8"],
    ["3", "12"],
  ],
};

const card = (x, y, w, h, fill = "paper") => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 10,
  fill,
  stroke: "navy",
  strokeWidth: 2.5,
});
const label = (x, y, text, extra = {}) => ({
  t: "text",
  x,
  y,
  text,
  anchor: "middle",
  fill: "ink",
  size: 16,
  ...extra,
});

export default {
  id: "g6-math-variables-relationships",
  title: "Variables and Relationships: language for two changing quantities",
  grade: "6",
  band: "6-8",
  subject: "math",
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u5",
    program: "Reveal Math",
    note: "6.EE.C.9 is one of the standards listed for the Numerical & Algebraic Expressions and Equations unit in the BCPSS curriculum seed. Words, examples and pictures are original; no publisher lesson numbers or text.",
  },
  standards: ["6.EE.C.9"],
  entries: [
    entry({
      id: "variable",
      word: "variable",
      pos: "noun",
      pron: "VAIR-ee-uh-bul",
      def: "A letter that stands for a number, or for a quantity that can change.",
      visual: {
        kind: "shapes",
        alt: "A box holding the letter x with four arrows pointing to the numbers 1, 2, 3 and 5, showing that one letter can stand for different numbers.",
        w: 480,
        h: 240,
        items: [
          card(30, 80, 110, 80, "sky"),
          label(85, 128, "x", { size: 40, weight: 700 }),
          ...[1, 2, 3, 5].flatMap((n, i) => {
            const y = 30 + i * 52;
            return [
              {
                t: "line",
                x1: 142,
                y1: 120,
                x2: 300,
                y2: y + 20,
                stroke: "navy",
                strokeWidth: 2.5,
              },
              card(305, y, 70, 42, "paper"),
              label(340, y + 21, String(n), { size: 22, weight: 700 }),
            ];
          }),
          label(430, 128, "can be", { size: 15 }),
        ],
      },
      context: "In the rule y = 4x, the letter x is a variable that stands for the minutes.",
      nonExample: "The number 4 in y = 4x is not a variable. It is always 4.",
      academicSentence: "A variable lets one rule work for many different numbers.",
      everyday: "Like a blank on a form that each person fills in with a different answer.",
      es: {
        word: "variable",
        def: "Una letra que representa un número o una cantidad que puede cambiar.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "vari-", meaning: "to change (Latin variare)" },
          { part: "-able", meaning: "can be" },
        ],
      },
      misconception:
        "Students think a letter always stands for one fixed unknown number, like x in x + 2 = 5.",
      related: ["independent-variable", "dependent-variable", "equation"],
      practice: {
        visualPrompt: "Which numbers can the letter x stand for in the picture?",
        speakWrite:
          "Say what the letter stands for in a rule you know, then write one sentence about it.",
        retrieval: "Which word names a letter that stands for a quantity that can change?",
      },
    }),
    entry({
      id: "independent-variable",
      word: "independent variable",
      pos: "noun phrase",
      pron: "in-dee-PEN-dunt VAIR-ee-uh-bul",
      def: "The quantity you choose or change first. Its value does not depend on the other quantity.",
      visual: {
        kind: "flow",
        alt: "Two steps joined by an arrow. Step 1: you choose the minutes, x. Step 2: you find the gallons, y.",
        w: 480,
        h: 200,
        steps: [
          { label: "You choose the minutes (x)", icon: "clock" },
          { label: "You find the gallons (y)", icon: "drop" },
        ],
      },
      context: "Minutes is the independent variable because we decide how long the hose runs.",
      nonExample:
        "The gallons in the barrel are not the independent variable. They are found after the time is chosen.",
      academicSentence:
        "The independent variable is the quantity that we choose, and it is usually on the horizontal axis.",
      everyday:
        "Like choosing how many minutes to practice before you see how many problems you finish.",
      es: {
        word: "variable independiente",
        def: "La cantidad que eliges o cambias primero. Su valor no depende de la otra cantidad.",
        verified: true,
      },
      misconception:
        "Students pick the quantity with the bigger numbers, or the one named first in the story, instead of asking which one is chosen.",
      related: ["dependent-variable", "variable", "relationship"],
      practice: {
        visualPrompt: "Which quantity does the person choose first in the picture?",
        speakWrite:
          "Name two quantities in a situation and say which one you would choose first. Use the words 'independent variable'.",
        retrieval: "Which quantity do you choose or change first?",
      },
    }),
    entry({
      id: "dependent-variable",
      word: "dependent variable",
      pos: "noun phrase",
      pron: "dee-PEN-dunt VAIR-ee-uh-bul",
      def: "The quantity whose value is found from the other quantity. It changes because the other one changes.",
      visual: {
        kind: "labeled",
        alt: "A coordinate plane with minutes along the bottom and gallons up the side. One label points to the bottom axis and says chosen first. Another label points to the side axis and says found from the minutes.",
        w: 480,
        h: 300,
        base: {
          kind: "coord",
          alt: "Minutes along the bottom axis and gallons up the side axis, with a line through three points.",
          xmax: 6,
          ymax: 24,
          xLabel: "Minutes (x)",
          yLabel: "Gallons (y)",
          points: [
            { x: 1, y: 4 },
            { x: 2, y: 8 },
            { x: 3, y: 12 },
          ],
          lines: [{ m: 4, b: 0 }],
        },
        labels: [
          { text: "chosen first", x: 258, y: 262, tx: 360, ty: 212 },
          { text: "found from the minutes", x: 62, y: 141, tx: 200, ty: 62 },
        ],
      },
      context:
        "The gallons are the dependent variable because they depend on how many minutes the hose has run.",
      nonExample:
        "The minutes are not the dependent variable. Nothing in the barrel changes how long the hose runs.",
      academicSentence:
        "The dependent variable is the quantity whose value depends on the independent variable.",
      everyday: "Like your score on a quiz, which depends on how much you studied.",
      es: {
        word: "variable dependiente",
        def: "La cantidad cuyo valor se halla a partir de la otra cantidad. Cambia porque la otra cambia.",
        verified: true,
      },
      misconception:
        "Students swap the two variables, saying the amount of water decides how long the hose runs.",
      related: ["independent-variable", "variable", "relationship"],
      practice: {
        visualPrompt: "Which axis shows the quantity that is found from the other one?",
        speakWrite: "Complete: ___ is the dependent variable because ___. Say it, then write it.",
        retrieval: "Which quantity depends on the other quantity?",
      },
    }),
    entry({
      id: "relationship",
      word: "relationship",
      pos: "noun",
      pron: "rih-LAY-shun-ship",
      def: "A connection that tells how one quantity changes when another quantity changes.",
      visual: {
        kind: "shapes",
        alt: "A clock on the left and a water drop on the right joined by a two-way arrow. Under the clock: more minutes pass. Under the drop: more gallons collect.",
        w: 480,
        h: 220,
        items: [
          { t: "icon", name: "clock", x: 50, y: 40, s: 90 },
          { t: "icon", name: "drop", x: 340, y: 40, s: 90 },
          { t: "icon", name: "arrow-both", x: 190, y: 55, s: 70 },
          label(95, 175, "more minutes pass", { size: 15 }),
          label(385, 175, "more gallons collect", { size: 15 }),
        ],
      },
      context:
        "The relationship between minutes and gallons is that each minute adds the same amount of water.",
      nonExample:
        "Two quantities that never affect each other, like the minutes of a hose and the color of the barrel, have no relationship.",
      academicSentence:
        "A relationship between two quantities can be shown with a table, a graph or an equation.",
      everyday: "Like the connection between how long you walk and how far you get.",
      es: {
        word: "relación",
        def: "Una conexión que dice cómo cambia una cantidad cuando cambia otra.",
        verified: true,
      },
      related: ["variable", "rate-of-change", "represent"],
      practice: {
        visualPrompt: "What changes together in the picture?",
        speakWrite:
          "Describe a relationship between two quantities in your day. Use 'as ___ increases, ___ ...'.",
        retrieval: "Which word names how two quantities change together?",
      },
    }),
    entry({
      id: "equation",
      word: "equation",
      pos: "noun",
      pron: "ih-KWAY-zhun",
      def: "A math sentence with an equals sign that says two expressions have the same value.",
      visual: {
        kind: "labeled",
        alt: "The rule y = 4x written large. Three callouts point to it: y is the gallons, 4 is the gallons added each minute, and x is the minutes.",
        w: 480,
        h: 260,
        base: {
          kind: "shapes",
          alt: "The rule y equals 4 x.",
          items: [label(240, 150, "y = 4x", { size: 64, weight: 700 })],
        },
        labels: [
          { text: "y: gallons", x: 150, y: 116, tx: 90, ty: 40 },
          { text: "4: gallons each minute", x: 262, y: 178, tx: 250, ty: 225 },
          { text: "x: minutes", x: 345, y: 116, tx: 400, ty: 40 },
        ],
      },
      context: "The equation y = 4x tells us the gallons for any number of minutes.",
      nonExample: "The expression 4x is not an equation because it has no equals sign.",
      academicSentence:
        "An equation can give the dependent variable in terms of the independent variable.",
      everyday: "Like the sentence 'a ticket costs 3 dollars, so 5 tickets cost 15 dollars'.",
      es: {
        word: "ecuación",
        def: "Una oración matemática con un signo igual que dice que dos expresiones tienen el mismo valor.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "equa-", meaning: "equal (Latin aequus)" },
          { part: "-tion", meaning: "the result of an action" },
        ],
      },
      misconception: "Students call any expression with a letter an equation.",
      related: ["variable", "table", "graph", "represent"],
      practice: {
        visualPrompt: "What does each part of the rule stand for?",
        speakWrite:
          "Write an equation for 'every ticket costs 3 dollars' and say what each part means.",
        retrieval: "Which word names a math sentence with an equals sign?",
      },
    }),
    entry({
      id: "table",
      word: "table",
      pos: "noun",
      pron: "TAY-bul",
      def: "An organized grid of rows and columns that lists pairs of values.",
      visual: {
        kind: "table",
        alt: "A grid with two columns, minutes and gallons. The rows read 1 and 4, 2 and 8, 3 and 12.",
        ...hose,
        highlight: [
          [1, 0],
          [1, 1],
        ],
      },
      context: "The table shows 8 gallons when the hose has run for 2 minutes.",
      nonExample:
        "A list of numbers with no columns that match each x to a y is not a table of values.",
      academicSentence: "Each row of a table shows one pair of values for the two variables.",
      everyday: "Like a chart that lists how many cups you need for 1, 2 or 3 batches.",
      es: {
        word: "tabla",
        def: "Una cuadrícula de filas y columnas que muestra pares de valores.",
        verified: true,
      },
      related: ["graph", "equation", "represent"],
      practice: {
        visualPrompt: "Read one row aloud. What do the two numbers in the row mean?",
        speakWrite:
          "Make a three-row table for a situation of your own, then describe the pattern in one sentence.",
        retrieval: "Which tool lists pairs of values in rows and columns?",
      },
    }),
    entry({
      id: "graph",
      word: "graph",
      pos: "noun",
      pron: "GRAF",
      def: "A picture on a coordinate plane that shows pairs of values as points, often joined by a line.",
      visual: {
        kind: "coord",
        alt: "A coordinate plane with minutes along the bottom and gallons up the side. Points at (1, 4), (2, 8) and (3, 12) sit on a straight line rising from the corner.",
        longDesc:
          "Three points, (1, 4), (2, 8) and (3, 12), lie on a line that starts at (0, 0) and rises 4 for each 1 across.",
        xmax: 6,
        ymax: 24,
        xLabel: "Minutes (x)",
        yLabel: "Gallons (y)",
        points: [
          { x: 1, y: 4 },
          { x: 2, y: 8 },
          { x: 3, y: 12 },
        ],
        lines: [{ m: 4, b: 0 }],
      },
      context: "On the graph, the point (3, 12) means 12 gallons after 3 minutes.",
      nonExample: "A table of numbers is not a graph, even though it holds the same pairs.",
      academicSentence: "A graph shows the pattern of a relationship as the shape of a line.",
      everyday: "Like a line on a screen that shows how your battery drops as the day goes on.",
      es: {
        word: "gráfica",
        def: "Un dibujo en un plano de coordenadas que muestra pares de valores como puntos, a veces unidos por una línea.",
        verified: true,
      },
      related: ["table", "equation", "steeper"],
      practice: {
        visualPrompt: "What does one point on the line tell you?",
        speakWrite: "Choose a point on the line in the picture and say what it means with units.",
        retrieval: "Which tool shows pairs of values as points on a plane?",
      },
    }),
    entry({
      id: "rate-of-change",
      word: "rate of change",
      pos: "noun phrase",
      pron: "RAYT uv CHAYNJ",
      def: "How much one quantity changes when the other quantity goes up by exactly 1.",
      visual: {
        kind: "shapes",
        alt: "Two rows of numbers. Top row: x is 1, 2, 3. Bottom row: y is 4, 8, 12. Curved arrows between the numbers show plus 1 on the top row and plus 4 on the bottom row.",
        w: 480,
        h: 240,
        items: [
          label(40, 70, "x", { size: 20, weight: 700 }),
          label(40, 170, "y", { size: 20, weight: 700 }),
          ...[1, 2, 3].flatMap((n, i) => {
            const x = 150 + i * 120;
            return [
              card(x - 28, 45, 56, 42, "sky"),
              label(x, 66, String(n), { size: 22, weight: 700 }),
              card(x - 28, 145, 56, 42, "paper"),
              label(x, 166, String(4 * n), { size: 22, weight: 700 }),
            ];
          }),
          ...[0, 1].flatMap((i) => {
            const x = 210 + i * 120;
            return [
              label(x, 36, "+1", { size: 17, weight: 700, fill: "navy" }),
              label(x, 136, "+4", { size: 17, weight: 700, fill: "coral" }),
              {
                t: "line",
                x1: x - 22,
                y1: 66,
                x2: x + 22,
                y2: 66,
                stroke: "navy",
                strokeWidth: 2.5,
              },
              {
                t: "line",
                x1: x - 22,
                y1: 166,
                x2: x + 22,
                y2: 166,
                stroke: "coral",
                strokeWidth: 2.5,
              },
            ];
          }),
        ],
      },
      context: "The rate of change is 4 gallons per minute because every minute adds 4 gallons.",
      nonExample:
        "The 12 gallons at 3 minutes is not the rate of change. It is one value, not the amount added for each minute.",
      academicSentence:
        "When the rate of change is constant, the dependent variable grows by the same amount each time.",
      everyday: "Like a runner who covers 3 miles for every 1 hour.",
      es: {
        word: "tasa de cambio",
        def: "Cuánto cambia una cantidad cuando la otra aumenta exactamente en 1.",
        verified: true,
      },
      misconception:
        "Students report the last y value, or the difference in x, instead of the change in y for 1 step of x.",
      related: ["relationship", "equation", "steeper"],
      practice: {
        visualPrompt: "How much does y change when x goes up by 1?",
        speakWrite:
          "Say the rate of change for a pattern of your own with both units, then write it.",
        retrieval: "Which phrase names how much y changes when x goes up by 1?",
      },
    }),
    entry({
      id: "steeper",
      word: "steeper",
      pos: "adjective",
      pron: "STEE-per",
      def: "Rising or falling more quickly. A line that climbs more for each step across.",
      visual: {
        kind: "coord",
        alt: "Two lines on a coordinate plane that start at the corner. Line A climbs 4 gallons for each minute and reaches 20 gallons at 5 minutes. Line B climbs 2 gallons for each minute and reaches 10 gallons at 5 minutes.",
        xmax: 6,
        ymax: 24,
        xLabel: "Minutes (x)",
        yLabel: "Gallons (y)",
        lines: [
          { m: 4, b: 0, label: "Line A" },
          { m: 2, b: 0, label: "Line B" },
        ],
      },
      context: "Line A is steeper than Line B because it adds more gallons each minute.",
      nonExample:
        "A line is not steeper just because it is longer. Steepness depends on how much it rises for each step across.",
      academicSentence: "A line with a greater rate of change is steeper.",
      everyday: "Like a ramp that gets you up to the door in a shorter distance.",
      misconception:
        "Students judge steepness by how long the line is drawn, or by where it ends, rather than by the rise for one step across.",
      related: ["rate-of-change", "graph"],
      practice: {
        visualPrompt: "Which line climbs more in the same number of minutes?",
        speakWrite: "Compare two lines or ramps using the word 'steeper' and a number from each.",
        retrieval: "Which word describes a line that rises more quickly?",
      },
    }),
    entry({
      id: "represent",
      word: "represent",
      pos: "verb",
      pron: "rep-rih-ZENT",
      def: "To show an idea in a different form, such as with a drawing, numbers or a rule.",
      visual: {
        kind: "shapes",
        alt: "Three cards joined to a hose icon. Card 1: pairs of numbers in rows. Card 2: the rule y = 4x. Card 3: a rising line with three dots. All three show the same hose.",
        w: 480,
        h: 260,
        items: [
          { t: "icon", name: "drop", x: 200, y: 6, s: 60 },
          { t: "line", x1: 240, y1: 70, x2: 90, y2: 120, stroke: "navy", strokeWidth: 2.5 },
          { t: "line", x1: 240, y1: 70, x2: 240, y2: 120, stroke: "navy", strokeWidth: 2.5 },
          { t: "line", x1: 240, y1: 70, x2: 390, y2: 120, stroke: "navy", strokeWidth: 2.5 },
          card(30, 120, 120, 110, "paper"),
          label(90, 150, "1 | 4", { size: 15 }),
          label(90, 178, "2 | 8", { size: 15 }),
          label(90, 206, "3 | 12", { size: 15 }),
          card(180, 120, 120, 110, "sky"),
          label(240, 182, "y = 4x", { size: 26, weight: 700 }),
          card(330, 120, 120, 110, "paper"),
          { t: "line", x1: 350, y1: 215, x2: 430, y2: 140, stroke: "teal", strokeWidth: 3.5 },
          { t: "circle", cx: 370, cy: 196, r: 5, fill: "ink" },
          { t: "circle", cx: 390, cy: 177, r: 5, fill: "ink" },
          { t: "circle", cx: 410, cy: 158, r: 5, fill: "ink" },
        ],
      },
      context: "You can represent the hose with a table, a graph or an equation.",
      nonExample:
        "Writing only the word 'hose' does not represent how the gallons change with the minutes.",
      academicSentence:
        "Different ways to represent a relationship show the same information in different forms.",
      everyday: "Like showing the same walk with a map, a list of directions or a photo.",
      es: {
        word: "representar",
        def: "Mostrar una idea de otra forma, como con un dibujo, números o una regla.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "re-", meaning: "again" },
          { part: "present", meaning: "to show or give" },
        ],
      },
      related: ["table", "graph", "equation", "compare"],
      practice: {
        visualPrompt: "Name each of the three ways the picture shows the hose.",
        speakWrite: "Choose a way to represent a pattern and explain what it shows well.",
        retrieval: "Which word means to show an idea in another form?",
      },
    }),
    entry({
      id: "compare",
      word: "compare",
      pos: "verb",
      pron: "kum-PAIR",
      def: "To look at two things and say how they are alike and how they are different.",
      visual: {
        kind: "venn",
        alt: "Two overlapping circles. The left circle, Table, lists exact pairs and easy values. The right circle, Graph, lists shows the pattern and a straight line. The overlap says the same relationship and the same rate.",
        sets: [
          { label: "Table", items: ["exact pairs", "easy to read values"] },
          { label: "Graph", items: ["shows the pattern", "a straight line"] },
        ],
        overlap: ["same relationship", "same rate"],
        w: 480,
        h: 300,
      },
      context:
        "When you compare a table and a graph of the hose, you notice they both show 4 gallons each minute.",
      nonExample:
        "Describing only the table does not compare, because nothing is said about the second thing.",
      academicSentence:
        "To compare two representations, name one way they are alike and one way they are different.",
      everyday: "Like comparing two phone plans by what each one costs and includes.",
      es: {
        word: "comparar",
        def: "Mirar dos cosas y decir en qué se parecen y en qué son diferentes.",
        verified: true,
      },
      related: ["represent", "justify", "steeper"],
      practice: {
        visualPrompt: "What does the overlap of the circles tell you?",
        speakWrite:
          "Compare a table and a graph of the same pattern. Name one way they are alike and one way they differ.",
        retrieval: "Which word means to say how two things are alike and different?",
      },
    }),
    entry({
      id: "justify",
      word: "justify",
      pos: "verb",
      pron: "JUS-tuh-fy",
      def: "To give a reason, with evidence, that shows why your answer makes sense.",
      visual: {
        kind: "flow",
        alt: "Three steps in a row. Step 1, Claim: y = 4x. Step 2, Reason: 4 times 3 is 12. Step 3, Check: the table row for 3 minutes says 12.",
        steps: [
          { label: "Claim: y = 4x" },
          { label: "Reason: 4 x 3 = 12" },
          { label: "Check: the row for 3 minutes says 12" },
        ],
        w: 480,
        h: 200,
      },
      context:
        "You can justify your answer by showing a row of the table that matches your equation.",
      nonExample: "Saying 'I just know' does not justify an answer, because it gives no reason.",
      academicSentence: "To justify a claim, give a reason that uses numbers or a picture.",
      everyday: "Like showing the receipt to prove how much you paid.",
      es: {
        word: "justificar",
        def: "Dar una razón, con evidencia, que muestre por qué tu respuesta tiene sentido.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "just", meaning: "fair, right (Latin iustus)" },
          { part: "-ify", meaning: "to make" },
        ],
      },
      related: ["compare", "represent"],
      practice: {
        visualPrompt: "Which step gives the evidence?",
        speakWrite:
          "Say an answer and justify it with a number from a table. Then write both sentences.",
        retrieval: "Which word means to give a reason with evidence?",
      },
    }),
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
