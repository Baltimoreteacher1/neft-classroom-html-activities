// Math Match skills for kindergarten to grade 3. Each skill names the card kinds it can show, the pool of ideas a board
// draws from at each level, and how one idea is drawn in each kind. Every kind of one idea carries the same exact value;
// logic.js checks that and picks the boards. @fm2 FM-008 FM-019 FM-051 FM-052 FM-053
import { gcd } from "../../rational.js";

const S = (en, es) => ({ en, es });
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const pad2 = (n) => String(n).padStart(2, "0");

function coinPool(level) {
  const out = [];
  const maxQ = level >= 3 ? 3 : 0;
  const maxN = level >= 2 ? 3 : 0;
  for (let q = 0; q <= maxQ; q += 1)
    for (let d = 0; d <= 4; d += 1)
      for (let n = 0; n <= maxN; n += 1)
        for (let p = 0; p <= 4; p += 1) {
          const coins = q + d + n + p;
          const cents = 25 * q + 10 * d + 5 * n + p;
          if (coins >= 2 && coins <= 6 && cents >= 6 && cents <= (level === 1 ? 60 : 99))
            out.push({ q, d, n, p });
        }
  return out;
}

const fractionPool = (level) => {
  const denominators = level === 1 ? [2, 3, 4] : level === 2 ? [2, 3, 4, 6, 8] : [2, 3, 4, 5, 6, 8];
  const out = [];
  for (const d of denominators)
    for (let n = 1; n < (level === 3 ? 2 * d : d); n += 1)
      if (n !== d && (n < d || gcd(n, d) === 1)) out.push({ n, d, max: n > d ? 2 : 1 });
  return out;
};

export const LOWER = [
  {
    id: "k-count",
    grades: [0, 0],
    standard: "K.CC.B.4",
    strand: S("Counting and cardinality", "Conteo y cardinalidad"),
    title: S("Match numbers, dots and words", "Une números, puntos y palabras"),
    kinds: {
      1: [
        ["numeral", "dots"],
        ["numeral", "tenframe"],
      ],
      2: [
        ["dots", "word"],
        ["tenframe", "word"],
        ["numeral", "word"],
      ],
      3: [
        ["numeral", "tenframe", "word"],
        ["numeral", "dots", "word"],
      ],
    },
    pool: (level) => range(1, level === 3 ? 20 : 10).map((n) => ({ n })),
    make: {
      numeral: (i) => ({ t: "numeral", n: i.n }),
      dots: (i) => ({ t: "dots", n: i.n }),
      tenframe: (i) => ({ t: "tenframe", n: i.n }),
      word: (i) => ({ t: "word", n: i.n }),
    },
  },
  {
    id: "k-teen",
    grades: [0, 0],
    standard: "K.NBT.A.1",
    strand: S("Number and operations in base ten", "Número y operaciones en base diez"),
    title: S("Teen numbers as ten and some ones", "Números del 11 al 19 como diez y unos"),
    kinds: {
      1: [
        ["numeral", "tenframe"],
        ["numeral", "sum"],
      ],
      2: [
        ["sum", "tenframe"],
        ["numeral", "sum"],
      ],
      3: [["numeral", "sum", "tenframe"]],
    },
    pool: () => range(11, 19).map((n) => ({ n })),
    make: {
      numeral: (i) => ({ t: "numeral", n: i.n }),
      sum: (i) => ({ t: "sum", parts: [10, i.n - 10] }),
      tenframe: (i) => ({ t: "tenframe", n: i.n }),
    },
  },
  {
    id: "g1-add",
    grades: [1, 1],
    standard: "1.OA.C.6",
    strand: S("Operations and algebraic thinking", "Operaciones y pensamiento algebraico"),
    title: S("Addition equations, pictures and sums", "Sumas, dibujos y totales"),
    kinds: {
      1: [
        ["sum", "groups"],
        ["groups", "numeral"],
      ],
      2: [
        ["sum", "numeral"],
        ["sum", "groups"],
      ],
      3: [["sum", "groups", "numeral"]],
    },
    pool: (level) => {
      const [low, high] = level === 1 ? [3, 10] : level === 2 ? [5, 20] : [8, 20];
      return range(1, 10).flatMap((a) =>
        range(1, 10)
          .filter((b) => a + b >= low && a + b <= high)
          .map((b) => ({ a, b })),
      );
    },
    make: {
      sum: (i) => ({ t: "sum", parts: [i.a, i.b] }),
      groups: (i) => ({ t: "groups", a: i.a, b: i.b }),
      numeral: (i) => ({ t: "numeral", n: i.a + i.b }),
    },
  },
  {
    id: "g1-time",
    grades: [1, 1],
    standard: "1.MD.B.3",
    strand: S("Measurement and data", "Medición y datos"),
    title: S("Clocks, digital time and time words", "Relojes, hora digital y palabras de la hora"),
    kinds: {
      1: [
        ["clock", "digital"],
        ["digital", "timeword"],
      ],
      2: [
        ["clock", "timeword"],
        ["clock", "digital"],
      ],
      3: [["clock", "digital", "timeword"]],
    },
    pool: (level) =>
      range(1, 12).flatMap((h) => (level === 1 ? [0] : [0, 30]).map((m) => ({ h, m }))),
    make: {
      clock: (i) => ({ t: "clock", h: i.h, m: i.m }),
      digital: (i) => ({ t: "digital", h: i.h, m: i.m }),
      timeword: (i) => ({ t: "timeword", h: i.h, m: i.m }),
    },
    keyText: (i) => `${i.h}:${pad2(i.m)}`,
  },
  {
    id: "g2-skip",
    grades: [2, 2],
    standard: "2.OA.C.4",
    strand: S("Operations and algebraic thinking", "Operaciones y pensamiento algebraico"),
    title: S(
      "Skip counting, repeated addition and arrays",
      "Conteo salteado, suma repetida y arreglos",
    ),
    kinds: {
      1: [
        ["skiplist", "array"],
        ["sum", "array"],
      ],
      2: [
        ["skiplist", "sum"],
        ["sum", "array"],
      ],
      3: [["skiplist", "sum", "array"]],
    },
    pool: (level) => {
      const steps = level === 1 ? [2, 5, 10] : level === 2 ? [2, 3, 4, 5, 10] : range(2, 10);
      const counts = level === 1 ? [2, 3, 4] : level === 2 ? [2, 3, 4, 5] : [3, 4, 5, 6];
      return steps.flatMap((step) => counts.map((count) => ({ step, count })));
    },
    make: {
      skiplist: (i) => ({ t: "skiplist", step: i.step, count: i.count }),
      sum: (i) => ({ t: "sum", parts: Array(i.count).fill(i.step) }),
      array: (i) => ({ t: "array", r: i.count, c: i.step }),
    },
  },
  {
    id: "g2-place",
    grades: [2, 2],
    standard: "2.NBT.A.1",
    strand: S("Number and operations in base ten", "Número y operaciones en base diez"),
    title: S(
      "Tens and ones, blocks and two-digit numbers",
      "Decenas y unidades, bloques y números de dos cifras",
    ),
    kinds: {
      1: [
        ["tens", "numeral"],
        ["blocks", "numeral"],
      ],
      2: [
        ["tens", "blocks"],
        ["blocks", "numeral"],
      ],
      3: [["tens", "numeral", "blocks"]],
    },
    pool: (level) =>
      range(1, level === 1 ? 5 : 9).flatMap((t) =>
        range(1, 9).map((o) => ({ t, o, fam: [t, o].sort().join("") })),
      ),
    make: {
      tens: (i) => ({ t: "tens", tn: i.t, o: i.o }),
      numeral: (i) => ({ t: "numeral", n: 10 * i.t + i.o }),
      blocks: (i) => ({ t: "blocks", tn: i.t, o: i.o }),
    },
  },
  {
    id: "g2-coins",
    grades: [2, 2],
    standard: "2.MD.C.8",
    strand: S("Measurement and data", "Medición y datos"),
    title: S("Coins, cent values and number words", "Monedas, valores en centavos y palabras"),
    kinds: {
      1: [["coins", "cents"]],
      2: [
        ["coins", "cents"],
        ["cents", "word"],
      ],
      3: [["coins", "cents", "word"]],
    },
    pool: coinPool,
    make: {
      coins: (i) => ({ t: "coins", q: i.q, d: i.d, n: i.n, p: i.p }),
      cents: (i) => ({ t: "cents", n: 25 * i.q + 10 * i.d + 5 * i.n + i.p }),
      word: (i) => ({ t: "word", n: 25 * i.q + 10 * i.d + 5 * i.n + i.p, unit: "cents" }),
    },
    keyText: (i) => `${25 * i.q + 10 * i.d + 5 * i.n + i.p}¢`,
  },
  {
    id: "g3-fraction",
    grades: [3, 3],
    standard: "3.NF.A.2",
    strand: S("Number and operations: fractions", "Número y operaciones: fracciones"),
    title: S(
      "Fraction models, fractions and number lines",
      "Modelos de fracciones, fracciones y rectas numéricas",
    ),
    kinds: {
      1: [
        ["fracbar", "frac"],
        ["frac", "fracline"],
      ],
      2: [
        ["fracbar", "fracline"],
        ["frac", "fracline"],
        ["fracbar", "frac"],
      ],
      3: [["fracbar", "frac", "fracline"]],
    },
    pool: fractionPool,
    make: {
      fracbar: (i) => ({ t: "fracbar", n: i.n, d: i.d }),
      frac: (i) => ({ t: "frac", n: i.n, d: i.d }),
      fracline: (i) => ({ t: "fracline", n: i.n, d: i.d, max: i.max }),
    },
  },
  {
    id: "g3-multiply",
    grades: [3, 3],
    standard: "3.OA.A.1",
    strand: S("Operations and algebraic thinking", "Operaciones y pensamiento algebraico"),
    title: S(
      "Arrays, multiplication equations and products",
      "Arreglos, multiplicaciones y productos",
    ),
    kinds: {
      1: [
        ["array", "prod"],
        ["prod", "numeral"],
      ],
      2: [
        ["array", "numeral"],
        ["array", "prod"],
      ],
      3: [["array", "prod", "numeral"]],
    },
    pool: (level) => {
      const [low, high] = level === 1 ? [2, 5] : level === 2 ? [2, 7] : [3, 8];
      return range(low, high).flatMap((a) => range(low, high).map((b) => ({ a, b })));
    },
    make: {
      array: (i) => ({ t: "array", r: i.a, c: i.b }),
      prod: (i) => ({ t: "prod", a: i.a, b: i.b }),
      numeral: (i) => ({ t: "numeral", n: i.a * i.b }),
    },
  },
];
