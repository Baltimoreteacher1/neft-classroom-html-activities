// Sample Resources for tools/mls-export-check.mjs: every block type, a long one that must paginate, and one full of
// the characters that break naive exporters. Strings starting "KEYONLY" appear only in places the student documents
// must never show (answer, explain, hint, key, notes); the check asserts they stay out of print, Word and PowerPoint.

const MINUS = "−";
const TIMES = "×";
const DIVIDE = "÷";

const choicesFor = (n, texts) => texts.map((t) => `P${n}-${t}`);

/** Resource 1: one of every block, with every workspace kind. */
export const everything = {
  id: "fx-everything",
  skillId: "g3.muldiv",
  grade: 3,
  type: "worksheet",
  title: "Every Block: Multiplication & Division",
  subtitle: "A fixture with one of every block type",
  meta: {
    minutes: 25,
    support: "standard",
    mathLevel: 2,
    langBand: 3,
    roles: ["practice"],
    standards: ["3.OA.A.1"],
    objective: "I can use arrays.",
    seed: 7,
  },
  sections: [
    {
      heading: "Getting started",
      blocks: [
        {
          t: "p",
          style: "directions",
          text: `Read each problem. Show your thinking. Use ${TIMES}, ${DIVIDE} and ${MINUS} when you need them.`,
        },
        {
          t: "p",
          text: 'A plain paragraph. It has an ampersand (Tom & Jerry), angle brackets (3 < 5 > 2), quotes (“smart” and "straight") and an apostrophe (it\'s).',
        },
        { t: "p", style: "note", text: "Note: you may use counters." },
        { t: "p", style: "quote", text: "“Mathematics is a language.”" },
        {
          t: "p",
          style: "teacher",
          text: "Teacher view: this paragraph is authored with the teacher style, so it is drawn as a teacher box.",
        },
        {
          t: "list",
          items: ["First bullet", "Second bullet with ≤ and π", "Third bullet with 5²"],
        },
        { t: "list", ordered: true, items: ["Read", "Think", "Solve", "Check"] },
        {
          t: "list",
          ordered: true,
          items: ["Second ordered list restarts at one", "Another item"],
        },
        {
          t: "table",
          caption: "Multiplication facts",
          headers: ["Factor", "Product", "Note"],
          rows: [
            ["2", "10", "double 5"],
            ["3", "15", "count by 5s\nthree groups"],
            ["4", "20", "AB & CD"],
          ],
        },
        {
          t: "visual",
          spec: { kind: "tenframe", n: 7, alt: "A ten frame with seven dots." },
          alt: "A ten frame with seven dots.",
        },
        {
          t: "wordbank",
          words: ["array", "factor", "product", "equal groups", "divide", "quotient", "row"],
        },
        {
          t: "frames",
          level: "1-2",
          items: ["There are ___ rows of ___.", "___ × ___ = ___ because ___."],
        },
      ],
    },
    {
      heading: "Problems",
      blocks: [
        {
          t: "problem",
          n: 1,
          stem: "Maya puts counters in equal rows.",
          ask: "How many counters are in 4 rows of 6?",
          expr: `4 ${TIMES} 6`,
          visual: { kind: "array", rows: 4, cols: 6, alt: "An array with 4 rows and 6 columns." },
          choices: choicesFor(1, ["A:20", "B:24", "C:28", "D:10"]),
          correct: 1,
          explain: "KEYONLY-explain-1: four rows of six is 24.",
          hint: "KEYONLY-hint-1: count one row, then count by that amount.",
          answer: "24",
          workspace: { kind: "lines", size: 2 },
        },
        {
          t: "problem",
          n: 2,
          ask: "Solve.",
          expr: `1,344 ${DIVIDE} 8`,
          answer: "168",
          explain: "KEYONLY-explain-2: 168 × 8 = 1,344.",
          hint: "KEYONLY-hint-2: split 1,344 into 800 and 544.",
          workspace: { kind: "grid", size: 3 },
        },
        {
          t: "problem",
          n: 3,
          stem: "A bakery packs 3 muffins in each box.",
          ask: "Complete the sentence frame, then solve.",
          expr: `3 ${TIMES} 7`,
          choices: choicesFor(3, ["A:21", "B:10", "C:24", "D:18"]),
          frames: [
            "There are ___ boxes with ___ muffins in each box.",
            "So there are ___ muffins in all.",
          ],
          correct: 0,
          explain: "KEYONLY-explain-3",
          workspace: { kind: "box", size: 2 },
        },
        {
          t: "problem",
          n: 4,
          stem: "Explain in your own words why 6 × 4 and 4 × 6 have the same product. Use the word factor.",
          ask: "Write your reasoning.",
          workspace: { kind: "none", size: 1 },
        },
        {
          t: "problem",
          n: 5,
          ask: "What fraction of the circle is shaded?",
          visual: {
            kind: "fracshape",
            shape: "circle",
            parts: 4,
            shaded: 3,
            alt: "A circle cut into 4 equal parts with 3 shaded.",
          },
          answer: "3/4",
          hint: "KEYONLY-hint-5",
          explain: "KEYONLY-explain-5: three of four equal parts.",
          workspace: { kind: "lines", size: 1 },
        },
        { t: "lines", prompt: "Write one sentence that uses the word product.", n: 3 },
        {
          t: "check",
          items: ["I showed my work.", "I checked my answer.", "I used a word from the word bank."],
        },
      ],
    },
    {
      heading: "Cards",
      blocks: [
        {
          t: "cards",
          cols: 2,
          items: [
            { front: "factor", back: "a number you multiply" },
            { front: "product", back: "the answer to a multiplication" },
            { front: "array" },
            { front: "quotient", back: "the answer to a division" },
          ],
        },
        {
          t: "cards",
          cols: 3,
          items: [
            { front: "3 × 4" },
            { front: "12 ÷ 3" },
            { front: "2 × 6" },
            { front: "20 ÷ 5" },
            { front: "5 × 5" },
          ],
        },
        {
          t: "cards",
          cols: 2,
          items: [
            {
              front: "Seven",
              back: "7 dots",
              visual: { kind: "tenframe", n: 7, alt: "A ten frame with seven dots." },
            },
            {
              front: "Four rows",
              visual: {
                kind: "array",
                rows: 4,
                cols: 6,
                alt: "An array with 4 rows and 6 columns.",
              },
            },
          ],
        },
      ],
    },
    { heading: "", blocks: [{ t: "pagebreak" }, { t: "p", text: "After a page break." }] },
  ],
  key: [
    { ref: "1", answer: "B: 24", work: [`4 ${TIMES} 6 = 24`, "KEYONLY-key-work-1"] },
    { ref: "2", answer: "168", work: [`1,344 ${DIVIDE} 8 = 168`] },
    { ref: "3", answer: "A: 21", work: [`3 ${TIMES} 7 = 21`] },
    { ref: "4", answer: "Order does not change the product", work: [] },
    { ref: "5", answer: "3/4", work: ["3 of 4 equal parts"] },
  ],
  notes: [
    "KEYONLY-note-1: listen for the word factor.",
    "KEYONLY-note-2: watch for repeated addition.",
  ],
};

/** Resource 2: long, so every format has to paginate; each problem is findable by its P<n>- tokens. */
const longProblems = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const a = 12 + n;
  const b = 3 + (n % 7);
  return {
    t: "problem",
    n,
    stem: `Problem ${n} story: a class has ${a} cards and shares them into ${b} equal piles. Lena says the answer is easy; Omar is not so sure.`,
    ask: `P${n}-ASK How many are in each pile, and what is left over?`,
    expr: `${a} ${DIVIDE} ${b}`,
    choices: choicesFor(n, ["A", "B", "C", "D"]),
    correct: n % 4,
    explain: `KEYONLY-long-explain-${n}`,
    hint: `KEYONLY-long-hint-${n}`,
    workspace: { kind: ["lines", "box", "grid"][n % 3], size: 2 + (n % 3) },
  };
});
export const long = {
  id: "fx-long",
  skillId: "g4.division",
  grade: 4,
  type: "worksheet",
  title: "A Long Worksheet That Must Paginate Across Many Pages",
  subtitle: "Thirty problems, a reading and a long table",
  meta: {
    minutes: 45,
    support: "more",
    mathLevel: 1,
    langBand: 2,
    roles: ["practice"],
    standards: ["4.NBT.B.6"],
    objective: "I can divide.",
    seed: 3,
  },
  sections: [
    {
      heading: "Read first",
      blocks: [
        {
          t: "p",
          text: Array.from(
            { length: 14 },
            (_, k) =>
              `Sentence ${k + 1} of the reading passage explains how a teacher shares a stack of cards among equal groups so that every group receives the same number.`,
          ).join(" "),
        },
        {
          t: "table",
          headers: ["Row", "Cards", "Piles", "Each pile"],
          rows: Array.from({ length: 24 }, (_, k) => [
            String(k + 1),
            String(20 + k),
            String(2 + (k % 5)),
            `about ${Math.round((20 + k) / (2 + (k % 5)))}`,
          ]),
        },
      ],
    },
    { heading: "Practice", blocks: longProblems },
  ],
  key: longProblems.map((p) => ({
    ref: String(p.n),
    answer: `KEYONLY-long-answer-${p.n}`,
    work: [`${p.expr} = ...`],
  })),
  notes: ["KEYONLY-long-note"],
};

/** Resource 3: characters and markup that must come through escaped, plus every answer-equivalence case. */
export const special = {
  id: "fx-special",
  skillId: "g6.ratios",
  grade: 6,
  type: "quiz",
  title: `Ratios & Rates: 3 < 5 > 2 ≤ π ${TIMES} r² "quoted" <b>bold</b>`,
  subtitle: "Ampersands & angle brackets <script>alert(1)</script> stay text",
  meta: {
    minutes: 10,
    support: "extension",
    mathLevel: 3,
    langBand: 5,
    roles: [],
    standards: [],
    objective: "x",
    seed: 1,
  },
  sections: [
    {
      heading: "Check your answers & reasoning",
      blocks: [
        {
          t: "p",
          text: `Is 3 < 5 & 5 > 3? Is area = πr² ≤ 10? 6 ${DIVIDE} 2 = 3; 5 ${MINUS} 8 = ${MINUS}3. <img src=x onerror=alert(1)> is just text.`,
        },
        {
          t: "problem",
          n: 1,
          ask: "Type the product.",
          expr: `24 ${TIMES} 56`,
          answer: "1344",
          explain: "KEYONLY-s-explain-1",
          hint: "KEYONLY-s-hint-1",
          workspace: { kind: "none", size: 1 },
        },
        {
          t: "problem",
          n: 2,
          ask: "Write one half as a decimal.",
          answer: "0.5",
          explain: "KEYONLY-s-explain-2",
          workspace: { kind: "none", size: 1 },
        },
        {
          t: "problem",
          n: 3,
          ask: "Write the fraction three quarters.",
          answer: "3/4",
          explain: "KEYONLY-s-explain-3",
          workspace: { kind: "none", size: 1 },
        },
        {
          t: "problem",
          n: 4,
          ask: `What is 5 ${MINUS} 8?`,
          answer: "-3",
          explain: "KEYONLY-s-explain-4",
          workspace: { kind: "none", size: 1 },
        },
        {
          t: "problem",
          n: 5,
          ask: "Which is greater than 1/2?",
          choices: ["1/3", "2/3", "0.4", "25%"],
          correct: 1,
          explain: "KEYONLY-s-explain-5",
          hint: "KEYONLY-s-hint-5",
          workspace: { kind: "none", size: 1 },
        },
        {
          t: "problem",
          n: 6,
          ask: "What is the point?",
          answer: "(2,5)",
          explain: "KEYONLY-s-explain-6",
          workspace: { kind: "none", size: 1 },
        },
        { t: "table", headers: ["a & b", "<c>", "π"], rows: [["1 < 2", "≤", "r²"]] },
      ],
    },
  ],
  key: [{ ref: "1", answer: "1,344", work: [`24 ${TIMES} 56 = 1,344`] }],
  notes: ["KEYONLY-s-note"],
};

export const RESOURCES = [everything, long, special];
