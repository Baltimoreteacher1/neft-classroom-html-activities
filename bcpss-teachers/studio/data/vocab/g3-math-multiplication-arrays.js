// Vocabulary for "Multiplication with Arrays and Equal Groups" (grade 3 math). Original wording; every picture is a visual-kit spec.
// Spanish terms are flagged verified:false until a human reviews them.

/** An array drawn as circles: `rows` lines of `cols`. `mark` shades one row or column; `note` adds a caption. */
export const arr = (rows, cols, alt, { mark, note, w = 480, h = 300 } = {}) => {
  const cs = Math.min(46, (w - 80) / cols, (h - 90) / rows);
  const x0 = (w - cs * cols) / 2;
  const y0 = 30 + (h - 90 - cs * rows) / 2;
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hot =
        mark &&
        ((mark.row === r && mark.row !== undefined) || (mark.col === c && mark.col !== undefined));
      items.push({
        t: "circle",
        cx: x0 + cs * c + cs / 2,
        cy: y0 + cs * r + cs / 2,
        r: cs * 0.36,
        fill: hot ? "coral" : "teal",
        stroke: "navy",
        sw: 1.5,
      });
    }
  }
  if (note)
    items.push({ t: "text", x: w / 2, y: h - 22, text: note, fill: "ink", size: 20, weight: 700 });
  return { kind: "shapes", alt, w, h, items };
};

/** Equal groups: `n` rounded ovals, each holding `each` dots. */
export const groups = (n, each, alt, note) => {
  const w = 480;
  const h = 300;
  const gw = Math.min(130, (w - 40) / n - 10);
  const items = [];
  for (let g = 0; g < n; g++) {
    const cx = 20 + (g + 0.5) * ((w - 40) / n);
    items.push({
      t: "ellipse",
      cx,
      cy: 130,
      rx: gw / 2,
      ry: 78,
      fill: "paper",
      stroke: "navy",
      sw: 2.5,
    });
    const cols = each <= 4 ? Math.min(each, 2) : 3;
    const rows = Math.ceil(each / cols);
    for (let k = 0; k < each; k++) {
      const rr = Math.floor(k / cols);
      const cc = k % cols;
      const inRow = rr === rows - 1 ? each - rr * cols : cols;
      items.push({
        t: "circle",
        cx: cx + (cc - (inRow - 1) / 2) * 26,
        cy: 130 + (rr - (rows - 1) / 2) * 28,
        r: 10,
        fill: "ochre",
        stroke: "navy",
        sw: 1.5,
      });
    }
  }
  if (note)
    items.push({ t: "text", x: w / 2, y: 262, text: note, fill: "ink", size: 20, weight: 700 });
  return { kind: "shapes", alt, w, h, items };
};

const entry = (e, p) => ({
  ...e,
  practice: { visualPrompt: p[0], speakWrite: p[1], retrieval: p[2] },
});

export default {
  id: "g3-math-multiplication-arrays",
  title: "Multiplication with Arrays and Equal Groups",
  grade: "3",
  band: "3-5",
  subject: "math",
  curriculum: {
    status: "district-referenced",
    unitId: "g3-math-u1",
    note: "Matches the Multiplication & Division Foundations unit in the BCPSS curriculum seed. Words, pictures and examples are original; lesson order within the unit is not taken from any publisher sequence.",
  },
  standards: ["3.OA.A.1", "3.OA.A.3", "3.OA.B.5"],
  entries: [
    entry(
      {
        id: "array",
        word: "array",
        pos: "noun",
        pron: "uh-RAY",
        def: "Objects set out in equal lines going across and equal lines going down, with nothing left over.",
        visual: arr(
          3,
          4,
          "Twelve counters set out in 3 lines going across, with 4 counters in every line",
          {
            note: "3 lines of 4",
          },
        ),
        context: "The egg carton is an array of eggs.",
        nonExample: "Counters tossed on a table in a pile are not an array.",
        academicSentence:
          "An array shows equal rows and equal columns, so it is easy to count the total.",
        everyday: "Like seats in a movie theater or windows on an apartment building.",
        es: {
          word: "arreglo",
          def: "Objetos colocados en filas iguales y columnas iguales.",
          verified: false,
        },
        misconception:
          "Every line of an array must have the same number of objects; uneven lines make something else.",
        related: ["row", "column", "equal-groups"],
        tier: 2,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture is an array?",
        "Say what an array of chairs in our room would look like, then draw it.",
        "Yesterday we set objects in equal lines. Which word names that picture?",
      ],
    ),
    entry(
      {
        id: "row",
        word: "row",
        pos: "noun",
        pron: "ROH",
        def: "A line of objects that goes across, from side to side.",
        visual: arr(
          3,
          5,
          "Fifteen counters in 3 lines going across; the middle line is colored coral and holds 5 counters",
          {
            mark: { row: 1 },
            note: "one line across = 5",
          },
        ),
        context: "Each row of the garden has five tomato plants.",
        nonExample: "A line going up and down is not a row.",
        academicSentence:
          "A row goes across, so I count how many are in one row to find the number in each group.",
        everyday: "Like one line of desks going across the classroom.",
        es: { word: "fila", def: "Una línea de objetos que va de lado a lado.", verified: false },
        misconception:
          "Row can also mean to paddle a boat; in math it always means a line going across.",
        related: ["column", "array"],
        tier: 2,
        domains: ["Reading", "Speaking"],
        klu: "Inform",
      },
      [
        "Which picture highlights one row?",
        "Say how many are in one row of your math book's picture, then write it.",
        "Which word names a line of objects going across?",
      ],
    ),
    entry(
      {
        id: "column",
        word: "column",
        pos: "noun",
        pron: "KOL-um",
        def: "A line of objects that goes up and down, from top to bottom.",
        visual: arr(
          3,
          5,
          "Fifteen counters in 5 lines going up and down; the second line from the left is colored coral and holds 3 counters",
          {
            mark: { col: 1 },
            note: "one line down = 3",
          },
        ),
        context: "The left column of the chart has three stickers.",
        nonExample: "A line going side to side is not a column.",
        academicSentence:
          "A column goes up and down, so the number of rows tells how many are in each column.",
        everyday: "Like a tall pillar holding up a building.",
        es: {
          word: "columna",
          def: "Una línea de objetos que va de arriba hacia abajo.",
          verified: false,
        },
        misconception:
          "Students mix up row and column. A column is a tall pillar; a row goes across like a road.",
        related: ["row", "array"],
        tier: 2,
        domains: ["Reading", "Speaking"],
        klu: "Inform",
      },
      [
        "Which picture highlights one column?",
        "Say how many are in one column of an array you draw, then write it.",
        "Which word names a line of objects going up and down?",
      ],
    ),
    entry(
      {
        id: "equal-groups",
        word: "equal groups",
        pos: "noun phrase",
        pron: "EE-kwul GROOPS",
        def: "Sets that each hold the same number of objects.",
        visual: groups(
          3,
          4,
          "Three ovals each holding 4 dots, so 3 sets of the same size",
          "3 sets of 4",
        ),
        context: "The teacher put the markers into equal groups of six.",
        nonExample: "Three bags holding 2, 4 and 7 beads are not equal groups.",
        academicSentence:
          "Equal groups have the same number in each group, so I can multiply to find the total.",
        everyday: "Like 4 plates with 3 cookies on every plate.",
        es: {
          word: "grupos iguales",
          def: "Conjuntos que tienen la misma cantidad de objetos.",
          verified: false,
        },
        misconception:
          "Equal groups need the same number in every group, but the groups do not have to be arranged in lines.",
        related: ["array", "repeated-addition", "multiply"],
        tier: 2,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture shows equal groups?",
        "Say how you would put 12 crayons into equal groups, then draw it.",
        "Which words name sets that all hold the same number?",
      ],
    ),
    entry(
      {
        id: "repeated-addition",
        word: "repeated addition",
        pos: "noun phrase",
        pron: "rih-PEE-tid uh-DISH-un",
        def: "Adding the same number again and again to find a total.",
        visual: {
          kind: "flow",
          alt: "Four boxes in a row, each showing plus 3, ending in a total box that shows 12",
          w: 480,
          h: 200,
          steps: [
            { label: "3" },
            { label: "+ 3 = 6" },
            { label: "+ 3 = 9" },
            { label: "+ 3 = 12" },
          ],
        },
        context: "Three plus three plus three plus three is repeated addition.",
        nonExample:
          "Adding 3 plus 5 plus 9 uses different numbers, so it is not repeated addition.",
        academicSentence:
          "Repeated addition adds the same number several times, and multiplication is a faster way to write it.",
        everyday: "Like putting 3 coins in a jar every day for 4 days.",
        es: {
          word: "suma repetida",
          def: "Sumar el mismo número una y otra vez para hallar un total.",
          verified: false,
        },
        misconception:
          "The number being added stays the same each time; only the running total changes.",
        related: ["multiply", "equal-groups"],
        tier: 3,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture shows the same number added again and again?",
        "Say a story where you add the same number four times, then write the addition.",
        "Which words name adding the same number again and again?",
      ],
    ),
    entry(
      {
        id: "multiply",
        word: "multiply",
        pos: "verb",
        pron: "MUL-tuh-ply",
        def: "To find the total of equal groups by combining them in one step.",
        visual: groups(
          2,
          5,
          "Two ovals each holding 5 dots with the number sentence 2 times 5 equals 10",
          "2 x 5 = 10",
        ),
        context: "We multiply 4 by 6 to find the number of stickers in four rows of six.",
        nonExample: "To split 12 into groups is not to multiply; that is dividing.",
        academicSentence:
          "I multiply when I know how many equal groups there are and how many are in each group.",
        everyday: "Like finding the number of wheels on 5 bicycles, 2 wheels each.",
        es: {
          word: "multiplicar",
          def: "Hallar el total de grupos iguales en un solo paso.",
          verified: false,
        },
        misconception:
          "Multiplying whole numbers does not mean adding the two numbers together; 3 times 4 is not 7.",
        related: ["factor", "product", "repeated-addition"],
        morphology: {
          parts: [
            { part: "multi-", meaning: "many" },
            { part: "-ply", meaning: "fold" },
          ],
        },
        tier: 2,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture shows something you would multiply?",
        "Say a problem you would multiply to solve, then write the number sentence.",
        "Which word means to find the total of equal groups in one step?",
      ],
    ),
    entry(
      {
        id: "factor",
        word: "factor",
        pos: "noun",
        pron: "FAK-ter",
        def: "One of the two numbers you multiply together.",
        visual: arr(
          2,
          6,
          "Twelve counters in 2 lines of 6, with the numbers 2 and 6 circled as the two numbers multiplied",
          {
            note: "2 x 6 = 12: the factors are 2 and 6",
          },
        ),
        context: "In 2 times 6 equals 12, the number 2 is a factor.",
        nonExample: "The answer 12 is not a factor in 2 times 6; it is the product.",
        academicSentence: "The factors tell the number of groups and the number in each group.",
        es: { word: "factor", def: "Uno de los dos números que se multiplican.", verified: false },
        misconception: "A factor is a number you multiply, not the answer.",
        related: ["product", "multiply"],
        tier: 3,
        domains: ["Reading", "Speaking"],
        klu: "Inform",
      },
      [
        "Which numbers in the picture are the factors?",
        "Say the two factors in a multiplication fact you know, then write the fact.",
        "Which word names a number that is multiplied?",
      ],
    ),
    entry(
      {
        id: "product",
        word: "product",
        pos: "noun",
        pron: "PROD-ukt",
        def: "The answer you get when you multiply two numbers.",
        visual: arr(
          3,
          4,
          "Twelve counters set out in 3 lines of 4 with the words 12 in all written beneath",
          {
            note: "12 in all",
          },
        ),
        context: "The product of 3 and 4 is twelve.",
        nonExample: "Seven is not the product of 3 and 4; that is their sum.",
        academicSentence: "The product is the total number of objects in all of the equal groups.",
        everyday:
          "In a store a product is something for sale; in math it is the answer to multiplying.",
        es: { word: "producto", def: "El resultado de multiplicar dos números.", verified: false },
        misconception:
          "Product has an everyday meaning in stores. In math it always means the answer from multiplying.",
        related: ["factor", "multiply"],
        tier: 3,
        domains: ["Reading", "Writing"],
        klu: "Inform",
      },
      [
        "Which number in the picture is the product?",
        "Say the product of two numbers you choose, then write the multiplication sentence.",
        "Which word names the answer from multiplying?",
      ],
    ),
    entry(
      {
        id: "multiplication-sentence",
        word: "multiplication sentence",
        pos: "noun phrase",
        pron: "mul-tuh-plih-KAY-shun SEN-tens",
        def: "A number sentence made with a times sign and an equals sign that shows a total of equal groups.",
        visual: {
          kind: "shapes",
          alt: "The number sentence 4 times 5 equals 20 written in big boxes under a labeled array of 4 lines of 5",
          w: 480,
          h: 240,
          items: [
            { t: "rect", x: 40, y: 80, w: 70, h: 70, fill: "sky", stroke: "navy", sw: 2.5, rx: 8 },
            { t: "text", x: 75, y: 128, text: "4", fill: "ink", size: 34, weight: 700 },
            { t: "text", x: 135, y: 128, text: "x", fill: "ink", size: 34, weight: 700 },
            { t: "rect", x: 160, y: 80, w: 70, h: 70, fill: "sky", stroke: "navy", sw: 2.5, rx: 8 },
            { t: "text", x: 195, y: 128, text: "5", fill: "ink", size: 34, weight: 700 },
            { t: "text", x: 255, y: 128, text: "=", fill: "ink", size: 34, weight: 700 },
            {
              t: "rect",
              x: 280,
              y: 80,
              w: 90,
              h: 70,
              fill: "ochre",
              stroke: "navy",
              sw: 2.5,
              rx: 8,
            },
            { t: "text", x: 325, y: 128, text: "20", fill: "ink", size: 34, weight: 700 },
            { t: "text", x: 75, y: 62, text: "groups", fill: "ink", size: 16 },
            { t: "text", x: 195, y: 62, text: "in each", fill: "ink", size: 16 },
            { t: "text", x: 325, y: 62, text: "total", fill: "ink", size: 16 },
          ],
        },
        context: "We wrote a multiplication sentence for the array of apples.",
        nonExample:
          "The number sentence 4 + 5 = 9 adds different numbers, so it does not show equal groups.",
        academicSentence:
          "A multiplication sentence tells the number of groups, the number in each group and the total.",
        es: {
          word: "oración de multiplicación",
          def: "Una oración numérica con signo de por y signo de igual que muestra un total de grupos iguales.",
          verified: false,
        },
        misconception:
          "Students may write the factors in a different order than the picture; both orders are correct, but each tells a different story.",
        related: ["factor", "product", "array"],
        tier: 3,
        domains: ["Writing", "Speaking"],
        klu: "Explain",
      },
      [
        "Which number sentence matches the array?",
        "Write a number sentence for an array you draw, then read it aloud.",
        "What do we call a number sentence that shows equal groups with a times sign?",
      ],
    ),
    entry(
      {
        id: "turn-around-facts",
        word: "turn-around facts",
        pos: "noun phrase",
        pron: "TERN uh-ROWND FAKTS",
        def: "Two multiplication facts that use the same two numbers in the opposite order and have the same answer.",
        visual: {
          kind: "labeled",
          alt: "A 2 by 5 array of counters with a curved arrow turning it into a 5 by 2 array, both holding ten counters",
          base: {
            kind: "shapes",
            w: 480,
            h: 260,
            items: [
              ...[0, 1].flatMap((r) =>
                [0, 1, 2, 3, 4].map((c) => ({
                  t: "circle",
                  cx: 40 + c * 26,
                  cy: 90 + r * 26,
                  r: 9,
                  fill: "teal",
                  stroke: "navy",
                  sw: 1.5,
                })),
              ),
              ...[0, 1, 2, 3, 4].flatMap((r) =>
                [0, 1].map((c) => ({
                  t: "circle",
                  cx: 330 + c * 26,
                  cy: 50 + r * 26,
                  r: 9,
                  fill: "coral",
                  stroke: "navy",
                  sw: 1.5,
                })),
              ),
              { t: "text", x: 235, y: 100, text: "turn", fill: "ink", size: 18, weight: 700 },
              { t: "line", x1: 190, y1: 112, x2: 280, y2: 112, stroke: "navy", sw: 3 },
              {
                t: "poly",
                points: [
                  [280, 104],
                  [294, 112],
                  [280, 120],
                ],
                fill: "navy",
              },
              { t: "text", x: 85, y: 190, text: "2 x 5 = 10", fill: "ink", size: 20, weight: 700 },
              { t: "text", x: 358, y: 190, text: "5 x 2 = 10", fill: "ink", size: 20, weight: 700 },
            ],
          },
          labels: [],
        },
        context:
          "Because 3 times 7 and 7 times 3 are turn-around facts, I only need to learn one of them.",
        nonExample:
          "The facts 3 times 7 and 3 times 8 are not turn-around facts because the numbers are different.",
        academicSentence:
          "Turn-around facts have the same product because turning an array changes rows into columns.",
        es: {
          word: "hechos de multiplicación al revés",
          def: "Dos hechos con los mismos números en orden opuesto y la misma respuesta.",
          verified: false,
        },
        misconception:
          "Turning the order around works for multiplication, but 8 divided by 2 is not the same as 2 divided by 8.",
        related: ["array", "factor", "product"],
        tier: 3,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which pair of facts are turn-around facts?",
        "Say a multiplication fact, then say its turn-around fact and explain why they match.",
        "Which words name two facts with the same numbers in opposite order?",
      ],
    ),
  ],
  review: { status: "authored", checks: {} },
};
