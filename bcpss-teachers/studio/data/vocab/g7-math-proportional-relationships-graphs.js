// Vocabulary for "Proportional Relationships and Graphs" (grade 7 math, 7.RP.A.2). Original definitions, examples and pictures.
// Picture text and alt text never print the entry's own word, so vocab-quest picture-word items stay fair.
const entry = (e) => ({ tier: 2, domains: ["Speaking", "Writing"], klu: "Explain", ...e });

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

const appleGraph = (extra = {}) => ({
  kind: "coord",
  xmax: 6,
  ymax: 18,
  xLabel: "Pounds (x)",
  yLabel: "Dollars (y)",
  ...extra,
});

export default {
  id: "g7-math-proportional-relationships-graphs",
  title: "Proportional Relationships and Graphs: language for constant rates",
  grade: "7",
  band: "6-8",
  subject: "math",
  curriculum: {
    status: "district-referenced",
    unitId: "g7-math-u1",
    program: "Reveal Math",
    note: "Matches the Proportional Relationships & Constant of Proportionality unit in the BCPSS curriculum seed (standard 7.RP.A.2 is listed there). Words, examples and pictures are original; no publisher lesson numbers or text.",
  },
  standards: ["7.RP.A.2", "7.RP.A.2a", "7.RP.A.2b", "7.RP.A.2c", "7.RP.A.2d"],
  entries: [
    entry({
      id: "proportional-relationship",
      word: "proportional relationship",
      pos: "noun phrase",
      pron: "pruh-POR-shuh-nul rih-LAY-shun-ship",
      def: "A connection between two quantities where one is always the same number times the other.",
      visual: appleGraph({
        alt: "A coordinate plane with pounds along the bottom and dollars up the side. Points at (1, 3), (2, 6), (3, 9) and (4, 12) sit on a straight line that starts at the corner.",
        longDesc:
          "The line passes through (0, 0). Every point has a y value that is 3 times its x value.",
        points: [
          { x: 1, y: 3 },
          { x: 2, y: 6 },
          { x: 3, y: 9 },
          { x: 4, y: 12 },
        ],
        lines: [{ m: 3, b: 0 }],
      }),
      context: "The cost of apples at a steady price per pound is a proportional relationship.",
      nonExample:
        "A taxi fare with a starting fee is not proportional, because the cost for 0 miles is not 0.",
      academicSentence:
        "In a proportional relationship, the ratio of y to x is the same for every pair of values.",
      everyday: "Like buying fruit by weight: double the weight and you pay double.",
      es: {
        word: "relación proporcional",
        def: "Una conexión entre dos cantidades donde una siempre es el mismo número multiplicado por la otra.",
        verified: true,
      },
      misconception:
        "Students think any relationship where both quantities increase is proportional.",
      related: ["constant-of-proportionality", "unit-rate", "origin", "non-proportional"],
      practice: {
        visualPrompt: "What is true about every point on the line?",
        speakWrite:
          "Name a situation where doubling one quantity doubles the other, and say why it is proportional.",
        retrieval: "Which phrase names a connection where y is always the same number times x?",
      },
    }),
    entry({
      id: "constant-of-proportionality",
      word: "constant of proportionality",
      pos: "noun phrase",
      pron: "KON-stunt uv pruh-por-shuh-NAL-ih-tee",
      def: "The number you multiply x by to get y every time. It is the ratio y divided by x.",
      visual: {
        kind: "table",
        alt: "A grid with columns x pounds, y dollars and y divided by x. The rows read 1, 3, 3; 2, 6, 3; 4, 12, 3. The last column is highlighted and every entry in it is 3.",
        head: ["x (pounds)", "y (dollars)", "y ÷ x"],
        rows: [
          ["1", "3", "3"],
          ["2", "6", "3"],
          ["4", "12", "3"],
        ],
        highlight: [
          [0, 2],
          [1, 2],
          [2, 2],
        ],
      },
      context: "In y = 3x, the constant of proportionality is 3 dollars per pound.",
      nonExample:
        "The y value 12 is not the constant of proportionality. It is one output, and the constant stays 3 in every row.",
      academicSentence: "The constant of proportionality is the number k in the equation y = kx.",
      everyday: "Like the price tag that says 3 dollars per pound, which does not change.",
      es: {
        word: "constante de proporcionalidad",
        def: "El número por el que multiplicas x para obtener y cada vez. Es la razón de y dividido entre x.",
        verified: true,
      },
      misconception:
        "Students pick the largest y value, or the difference between y values, as the constant.",
      related: ["unit-rate", "proportional-relationship", "equivalent-ratios"],
      practice: {
        visualPrompt: "Which column holds the constant? What do you notice about it?",
        speakWrite: "Find the constant for a table you choose and write one sentence with units.",
        retrieval: "Which phrase names the number k in y = kx?",
      },
    }),
    entry({
      id: "unit-rate",
      word: "unit rate",
      pos: "noun phrase",
      pron: "YOO-nit RAYT",
      def: "How much of one quantity goes with exactly 1 of the other.",
      visual: {
        kind: "shapes",
        alt: "A bag labelled 1 pound on the left, an arrow, and three dollar bills on the right labelled 3 dollars. It shows that 1 pound goes with 3 dollars.",
        w: 480,
        h: 220,
        items: [
          card(30, 60, 120, 100, "sky"),
          label(90, 100, "1 pound", { size: 20, weight: 700 }),
          label(90, 132, "of apples", { size: 15 }),
          { t: "icon", name: "arrow-right", x: 170, y: 82, s: 56 },
          { t: "icon", name: "dollar-bill", x: 245, y: 72, s: 60 },
          { t: "icon", name: "dollar-bill", x: 315, y: 72, s: 60 },
          { t: "icon", name: "dollar-bill", x: 385, y: 72, s: 60 },
          label(300, 175, "3 dollars", { size: 20, weight: 700 }),
        ],
      },
      context: "The unit rate is 3 dollars per pound.",
      nonExample:
        "12 dollars for 4 pounds is a rate, but it is not a unit rate until you find the cost for 1 pound.",
      academicSentence:
        "To find a unit rate, divide the amount of one quantity by the amount of the other.",
      everyday: "Like the speed on a sign, which tells miles for each 1 hour.",
      es: {
        word: "tasa unitaria",
        def: "Cuánto de una cantidad corresponde a exactamente 1 de la otra.",
        verified: true,
      },
      related: ["constant-of-proportionality", "equivalent-ratios"],
      practice: {
        visualPrompt: "How many dollars go with 1 pound?",
        speakWrite: "Say a unit rate for something you buy or do, with both units.",
        retrieval: "Which phrase names the amount for exactly 1 of the other quantity?",
      },
    }),
    entry({
      id: "equivalent-ratios",
      word: "equivalent ratios",
      pos: "noun phrase",
      pron: "ih-KWIV-uh-lunt RAY-shee-ohz",
      def: "Ratios that describe the same comparison, found by multiplying or dividing both numbers by the same amount.",
      visual: {
        kind: "table",
        alt: "A grid with columns pounds and dollars. The rows read 2 and 6, 4 and 12, 6 and 18. The first row is highlighted, and each later row is a whole-number multiple of it.",
        head: ["x (pounds)", "y (dollars)"],
        rows: [
          ["2", "6"],
          ["4", "12"],
          ["6", "18"],
        ],
        highlight: [
          [0, 0],
          [0, 1],
        ],
      },
      context: "The pairs 2 to 6, 4 to 12 and 6 to 18 are equivalent ratios.",
      nonExample:
        "2 to 6 and 4 to 10 are not equivalent. Adding 2 to both numbers changes the relationship.",
      academicSentence:
        "Every row of a table for a proportional relationship is one of the equivalent ratios.",
      everyday: "Like making a double batch of a recipe: every amount doubles.",
      es: {
        word: "razones equivalentes",
        def: "Razones que describen la misma comparación, que se obtienen al multiplicar o dividir ambos números por la misma cantidad.",
        verified: true,
      },
      related: ["unit-rate", "constant-of-proportionality"],
      practice: {
        visualPrompt: "How do you get the third row from the first row?",
        speakWrite:
          "Write two ratios that are equivalent to 3 to 5 and say what you multiplied by.",
        retrieval: "Which phrase names ratios that describe the same comparison?",
      },
    }),
    entry({
      id: "ordered-pair",
      word: "ordered pair",
      pos: "noun phrase",
      pron: "OR-derd PAIR",
      def: "Two numbers in parentheses that give a location. The first number says how far across and the second says how far up.",
      visual: {
        kind: "labeled",
        alt: "A coordinate plane with one point. A callout says 3 across. Another callout says 9 up. The point is at 3 across and 9 up.",
        w: 480,
        h: 320,
        base: appleGraph({
          alt: "A coordinate plane with one labelled point at 3 across and 9 up.",
          points: [{ x: 3, y: 9, label: "(3, 9)" }],
          lines: [],
        }),
        labels: [
          { text: "3 across (x)", x: 258, y: 262, tx: 345, ty: 218 },
          { text: "9 up (y)", x: 62, y: 141, tx: 150, ty: 75 },
        ],
      },
      context: "The ordered pair (3, 9) means 3 pounds cost 9 dollars.",
      nonExample:
        "The pair (9, 3) is not the same ordered pair as (3, 9). The order tells which quantity comes first.",
      academicSentence:
        "An ordered pair names a point by its x value first and its y value second.",
      everyday: "Like a seat number that gives the row first and the seat second.",
      es: {
        word: "par ordenado",
        def: "Dos números entre paréntesis que dan una ubicación. El primero dice cuánto a la derecha y el segundo cuánto hacia arriba.",
        verified: true,
      },
      related: ["origin", "coordinate-plane"],
      practice: {
        visualPrompt: "Which number says how far across? Which says how far up?",
        speakWrite: "Choose an ordered pair from a table and say what it means with units.",
        retrieval: "Which phrase names two numbers that give a point's location?",
      },
    }),
    entry({
      id: "origin",
      word: "origin",
      pos: "noun",
      pron: "OR-uh-jin",
      def: "The point where the two axes cross. Both of its numbers are 0.",
      visual: appleGraph({
        alt: "A coordinate plane with a labelled point at the corner where the two axes meet, marked (0, 0).",
        points: [{ x: 0, y: 0, label: "(0, 0)" }],
      }),
      context:
        "A proportional relationship always passes through the origin, because 0 pounds cost 0 dollars.",
      nonExample: "The point (0, 5) is on an axis, but it is not the origin.",
      academicSentence:
        "The graph of a proportional relationship is a straight line that passes through the origin.",
      everyday: "Like the starting line of a race, where everyone is at zero.",
      es: {
        word: "origen",
        def: "El punto donde se cruzan los dos ejes. Sus dos números son 0.",
        verified: true,
      },
      related: ["ordered-pair", "coordinate-plane", "proportional-relationship"],
      practice: {
        visualPrompt: "What are the two numbers of the point where the axes meet?",
        speakWrite: "Explain what the point (0, 0) means in the apple situation.",
        retrieval: "Which word names the point (0, 0)?",
      },
    }),
    entry({
      id: "coordinate-plane",
      word: "coordinate plane",
      pos: "noun phrase",
      pron: "koh-OR-dih-nit PLAYN",
      def: "A flat grid with a horizontal axis and a vertical axis where every point is named by two numbers.",
      visual: {
        kind: "coord",
        alt: "A grid with a horizontal axis labelled x and a vertical axis labelled y. Two points are marked on it, one at (2, 4) and one at (5, 1).",
        xmax: 6,
        ymax: 6,
        xLabel: "x",
        yLabel: "y",
        points: [
          { x: 2, y: 4, label: "(2, 4)" },
          { x: 5, y: 1, label: "(5, 1)" },
        ],
      },
      context: "We plot the pairs from the table on a coordinate plane.",
      nonExample: "A number line has only one axis, so it is not a coordinate plane.",
      academicSentence:
        "On a coordinate plane the horizontal axis usually shows the independent variable.",
      everyday: "Like a city map with streets running both ways.",
      es: {
        word: "plano de coordenadas",
        def: "Una cuadrícula plana con un eje horizontal y un eje vertical donde cada punto se nombra con dos números.",
        verified: true,
      },
      related: ["ordered-pair", "origin"],
      practice: {
        visualPrompt: "Name the horizontal axis and the vertical axis in the picture.",
        speakWrite: "Describe how to plot the point (4, 8) on a plane.",
        retrieval: "Which phrase names a flat grid where each point has two numbers?",
      },
    }),
    entry({
      id: "non-proportional",
      word: "non-proportional",
      pos: "adjective",
      pron: "non-pruh-POR-shuh-nul",
      def: "Describes two quantities that are connected, but whose ratio changes from pair to pair.",
      visual: {
        kind: "coord",
        alt: "A straight line that crosses the vertical axis at 4 dollars instead of at the corner. Points at (1, 7), (2, 10) and (3, 13) lie on it.",
        longDesc:
          "The line starts at (0, 4) and rises 3 for each 1 across. It does not pass through (0, 0).",
        xmax: 6,
        ymax: 24,
        xLabel: "Miles (x)",
        yLabel: "Dollars (y)",
        points: [
          { x: 1, y: 7 },
          { x: 2, y: 10 },
          { x: 3, y: 13 },
        ],
        lines: [{ m: 3, b: 4 }],
      },
      context: "A taxi fare with a starting fee is a non-proportional relationship.",
      nonExample:
        "Buying apples at a steady price per pound is not non-proportional, because it passes through the origin.",
      academicSentence:
        "A relationship can be a straight line and still be non-proportional if it misses the origin.",
      everyday: "Like a gym with a joining fee and a monthly cost.",
      es: {
        word: "no proporcional",
        def: "Describe dos cantidades conectadas cuya razón cambia de un par a otro.",
        verified: true,
      },
      misconception: "Students think any straight line shows a proportional relationship.",
      related: ["proportional-relationship", "origin"],
      practice: {
        visualPrompt: "Where does the line cross the vertical axis? What does that tell you?",
        speakWrite:
          "Describe a situation that is connected but not proportional and give the reason.",
        retrieval: "Which word describes a relationship whose ratio is not constant?",
      },
    }),
    entry({
      id: "constant",
      word: "constant",
      pos: "adjective",
      pron: "KON-stunt",
      def: "Staying the same, with no change from one pair or one moment to the next.",
      visual: {
        kind: "bars",
        alt: "Four bars of equal height, each labelled 3. They are labelled for the rows where x is 1, 2, 3 and 4 and show the value y divided by x.",
        data: [
          { label: "x = 1", value: 3 },
          { label: "x = 2", value: 3 },
          { label: "x = 3", value: 3 },
          { label: "x = 4", value: 3 },
        ],
        xLabel: "Row of the table",
        yLabel: "y ÷ x",
        unit: "",
        w: 480,
        h: 280,
      },
      context: "In a proportional relationship the ratio of y to x is constant.",
      nonExample: "A price that goes up every week is not constant.",
      academicSentence:
        "A constant rate of change means the dependent variable grows by the same amount each time.",
      everyday: "Like cruise control holding a car at the same speed.",
      es: {
        word: "constante",
        def: "Que permanece igual, sin cambio de un par o un momento al siguiente.",
        verified: true,
      },
      related: ["constant-of-proportionality", "unit-rate"],
      practice: {
        visualPrompt: "What do you notice about the heights of the four bars?",
        speakWrite: "Name something in your life that stays constant and something that does not.",
        retrieval: "Which word means staying the same?",
      },
    }),
    entry({
      id: "verify",
      word: "verify",
      pos: "verb",
      pron: "VAIR-uh-fy",
      def: "To check that something is true by testing it.",
      visual: {
        kind: "flow",
        alt: "Three steps in a row. Step 1: pick a row of the table. Step 2: divide y by x. Step 3: do the same for the other rows and see whether the answers match.",
        steps: [
          { label: "Pick a row", icon: "magnifier" },
          { label: "Divide y by x" },
          { label: "Repeat for other rows and compare" },
        ],
        w: 480,
        h: 200,
      },
      context: "You can verify that a table is proportional by dividing y by x in every row.",
      nonExample:
        "Guessing that two ratios match is not verifying them. Verifying means you test with numbers.",
      academicSentence:
        "To verify a claim about a table, test it on every row, not just the first one.",
      everyday: "Like checking your change at the register.",
      es: {
        word: "verificar",
        def: "Comprobar que algo es verdadero al ponerlo a prueba.",
        verified: true,
      },
      related: ["justify", "equivalent-ratios"],
      practice: {
        visualPrompt: "Which step do you repeat for every row?",
        speakWrite: "Tell a partner how you would verify that a table is proportional.",
        retrieval: "Which word means to check that something is true by testing it?",
      },
    }),
    entry({
      id: "justify",
      word: "justify",
      pos: "verb",
      pron: "JUS-tuh-fy",
      def: "To give reasons and evidence that show why your answer makes sense.",
      visual: {
        kind: "flow",
        alt: "Three steps from top to bottom. Claim: the relationship is proportional. Reason: the line goes through (0, 0). Evidence: y divided by x is 3 in every row.",
        steps: [
          { label: "Claim: it is proportional" },
          { label: "Reason: the line goes through (0, 0)" },
          { label: "Evidence: y ÷ x is 3 in every row" },
        ],
        vertical: true,
        w: 480,
        h: 320,
      },
      context: "Please justify your claim with a reason and evidence from the table.",
      nonExample: "Saying 'because I think so' does not justify a claim. There is no evidence.",
      academicSentence:
        "To justify a conclusion about a graph, name what you see and say why it matters.",
      everyday: "Like explaining to a teammate why you chose a play.",
      es: {
        word: "justificar",
        def: "Dar razones y evidencia que muestren por qué tu respuesta tiene sentido.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "just", meaning: "fair, right (Latin iustus)" },
          { part: "-ify", meaning: "to make" },
        ],
      },
      related: ["verify"],
      practice: {
        visualPrompt: "Which step gives the evidence?",
        speakWrite: "Make a claim about a table and justify it with a number from the table.",
        retrieval: "Which word means to give reasons and evidence for your answer?",
      },
    }),
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
