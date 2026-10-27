// Math Match skills for grades 4 to 8 (see skills-lower.js for the shape of a skill). Values are exact fractions, so
// "0.75" and "3/4" and "75%" are equal because the arithmetic says so, never because the text looks alike.
// @fm2 FM-008 FM-019 FM-052 FM-053 FM-054 FM-056 FM-057 FM-058 FM-055
import { frac, gcd, mul, toDecimalString } from "../../rational.js";
import { int, shuffle } from "../../rng.js";
import { algText, evaluate, lineText } from "./reps.js";
import { signed } from "./words.js";

const S = (en, es) => ({ en, es });
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---- fraction / decimal / percent ideas ---------------------------------------------------------------------------
const FDP_BENCH = [
  [1, 2],
  [1, 4],
  [3, 4],
  [1, 10],
  [3, 10],
  [7, 10],
  [9, 10],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
];
const FDP_MORE = [
  [3, 20],
  [7, 20],
  [9, 20],
  [11, 20],
  [13, 20],
  [17, 20],
  [1, 25],
  [3, 25],
  [1, 50],
  [3, 50],
  [1, 100],
  [9, 100],
];
const FDP_RATIO = [
  [1, 8],
  [3, 8],
  [5, 8],
  [7, 8],
  [9, 25],
  [17, 50],
];
const FDP_STRETCH = [
  [3, 40],
  [1, 200],
  [5, 4],
  [3, 2],
  [7, 4],
];
const fdpIdea = ([n, d]) => ({ n, d });
const decimalOf = (i) => toDecimalString(frac(i.n, i.d));
const percentOf = (i) => toDecimalString(mul(frac(i.n, i.d), frac(100)));
const FDP_MAKE = {
  frac: (i) => ({ t: "frac", n: i.n, d: i.d }),
  decimal: (i) => ({ t: "decimal", text: decimalOf(i) }),
  percent: (i) => ({ t: "percent", text: percentOf(i) }),
  hgrid: (i) => ({ t: "hgrid", k: (100 * i.n) / i.d }),
};

// ---- order of operations: expressions are enumerated once per level and cached ------------------------------------
const TEMPLATES = {
  A: (a, b, c) => `${a} + ${b} × ${c}`,
  B: (a, b, c) => `${a} × ${b} + ${c}`,
  C: (a, b, c) => `${a} × ${b} − ${c}`,
  D: (a, b, c) => `${a} + ${b} − ${c}`,
  E: (a, b, c) => `(${a} + ${b}) × ${c}`,
  F: (a, b, c) => `${a} × (${b} + ${c})`,
  G: (a, b, c) => `${a} − ${b * c} ÷ ${c}`,
  H: (a, b, c, d) => `${a} + ${b} × ${c} − ${d}`,
  I: (a, b, c, d) => `(${a} + ${b}) × ${c} − ${d}`,
};
const TWINS = { A: "E", E: "A", B: "F", F: "B" };
const TEMPLATE_SETS = { 1: "ABCD", 2: "ABCDEFG", 3: "ABCDEFGHI" };
const expressionCache = new Map();

function expressionsFor(level) {
  if (expressionCache.has(level)) return expressionCache.get(level);
  const entries = [];
  const cap = level === 1 ? 50 : 99;
  for (const tpl of TEMPLATE_SETS[level]) {
    const fourth = "HI".includes(tpl) ? range(1, 9) : [0];
    for (const a of range(2, 9))
      for (const b of range(2, 9))
        for (const c of range(2, level === 1 ? 6 : 9))
          for (const d of fourth) {
            const text = TEMPLATES[tpl](a, b, c, d);
            const v = evaluate(text);
            if (v.d === 1 && v.n >= 1 && v.n <= cap)
              entries.push({
                tpl,
                text,
                v: v.n,
                digits: [a, b, c, d].join(","),
                fam: [a, b, c].sort().join(""),
              });
          }
  }
  const byValue = new Map();
  for (const entry of entries) byValue.set(entry.v, [...(byValue.get(entry.v) || []), entry]);
  const cached = { entries, byValue };
  expressionCache.set(level, cached);
  return cached;
}

function orderPool(level, grade, rng) {
  const { entries, byValue } = expressionsFor(level);
  const lookup = new Map(entries.map((entry) => [`${entry.tpl}|${entry.digits}`, entry]));
  const chosen = shuffle(rng, entries).slice(0, 40);
  const twins = chosen
    .slice(0, 12)
    .map((entry) => lookup.get(`${TWINS[entry.tpl]}|${entry.digits}`))
    .filter(Boolean);
  return [...chosen, ...twins].flatMap((first) => {
    const partner = (byValue.get(first.v) || []).find(
      (other) => other.tpl !== first.tpl && other.digits !== first.digits,
    );
    return partner ? [{ a: first.text, b: partner.text, v: first.v, fam: first.fam }] : [];
  });
}

// ---- word form ------------------------------------------------------------------------------------------------------
function numberPool(level, grade, rng) {
  const places = level + 2;
  const out = [];
  for (let i = 0; i < 28; i += 1) {
    const digits = [
      int(rng, 1, 9),
      ...Array.from({ length: places - 1 }, () =>
        rng() < (level === 3 ? 0.3 : 0.12) ? 0 : int(rng, 1, 9),
      ),
    ];
    // Expanded form needs at least two terms, or it would read exactly like the standard form.
    const add = (list) => {
      if (list.filter(Boolean).length >= 2) out.push({ n: Number(list.join("")), fam: [...list].sort().join("") });
    };
    add(digits);
    if (i < 12 && digits[1] !== digits[2])
      add([digits[0], digits[2], digits[1], ...digits.slice(3)]);
  }
  return out;
}

// ---- ratio and linear shapes ------------------------------------------------------------------------------------------
const RATES = {
  1: range(2, 9).map((n) => [n, 1]),
  2: [...range(2, 9).map((n) => [n, 1]), [1, 2], [3, 2], [5, 2]],
  3: [
    ...range(2, 9).map((n) => [n, 1]),
    [1, 2],
    [3, 2],
    [5, 2],
    [1, 3],
    [2, 3],
    [1, 4],
    [3, 4],
    [4, 3],
  ],
};
const PROPORTIONS = {
  1: range(2, 9).map((n) => [n, 1]),
  2: [...range(2, 9).map((n) => [n, 1]), [1, 2], [1, 3], [1, 4], [3, 2], [5, 2], [2, 3], [3, 4]],
  3: [
    ...range(2, 9).map((n) => [n, 1]),
    [1, 2],
    [1, 3],
    [1, 4],
    [3, 2],
    [5, 2],
    [2, 3],
    [3, 4],
    [1, 5],
    [3, 5],
    [7, 2],
    [4, 3],
  ],
};

function verbalPool(level) {
  const out = [];
  for (const b of range(2, 9))
    out.push({ a: 1, ad: 1, b }, { a: 1, ad: 1, b: -b }, { a: b, ad: 1, b: 0 });
  if (level >= 2)
    for (const a of range(2, 5)) for (const b of range(1, 9)) out.push({ a, ad: 1, b });
  if (level === 3) {
    for (const a of range(2, 5)) for (const b of range(1, 9)) out.push({ a, ad: 1, b: -b });
    for (const b of range(5, 9)) out.push({ a: -1, ad: 1, b });
    out.push({ a: 1, ad: 2, b: 0 });
  }
  return out.map((idea) => ({
    ...idea,
    fam: idea.a >= 2 && idea.b ? [idea.a, Math.abs(idea.b)].sort().join("-") : undefined,
  }));
}

function tableInputs(i) {
  const step = i.ad;
  let start = step;
  while ((i.a * start) / i.ad + i.b < 0) start += step;
  return [start, start + step, start + 2 * step];
}

function integerPool(level) {
  const out = [];
  for (const a of range(-8, 8).filter(Boolean))
    for (const b of level === 3 ? range(-8, 8).filter(Boolean) : range(1, 8))
      for (const op of level === 1 ? ["+"] : ["+", "−"]) {
        const result = op === "+" ? a + b : a - b;
        if (result >= -12 && result <= 12 && (level > 1 || a < 0 || result > 0))
          out.push({ a, op, b });
      }
  return out;
}

const SCIENTIFIC = [
  "1",
  "1.2",
  "1.5",
  "1.6",
  "1.8",
  "2",
  "2.4",
  "2.5",
  "2.7",
  "3",
  "3.2",
  "3.6",
  "4",
  "4.5",
  "4.9",
  "5.6",
  "6.3",
  "7.2",
  "8.1",
];
function factorPair(product) {
  for (let a = 2; a <= 9; a += 1)
    if (product % a === 0 && product / a >= 2 && product / a <= 9) return [a, product / a];
  return null;
}
function exponentPool(level) {
  const exponents =
    level === 1 ? range(2, 6) : level === 2 ? range(3, 8) : [...range(-6, -2), ...range(2, 8)];
  return SCIENTIFIC.flatMap((c) =>
    exponents.map((e) => {
      const [a, b] = factorPair(Math.round(Number(c) * 10));
      const p = Math.floor((e - 1) / 2);
      return { c, e, a, b, p, q: e - 1 - p };
    }),
  );
}
const plainText = (i) => {
  const text = toDecimalString(
    mul(frac(Math.round(Number(i.c) * 10), 10), i.e >= 0 ? frac(10 ** i.e) : frac(1, 10 ** -i.e)),
  );
  const [whole, rest] = text.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${rest ? `.${rest}` : ""}`;
};

const equivPool = (level) => {
  const denominators = level === 1 ? [2, 3, 4] : level === 2 ? range(2, 6) : range(2, 8);
  return denominators.flatMap((d) =>
    range(1, level === 3 ? 2 * d - 1 : d - 1)
      .filter((n) => gcd(n, d) === 1)
      .map((n) => {
        const k = 2 + ((n + d) % (d >= 5 ? 2 : 3));
        const k2 = 2 + ((n * d) % 2);
        const spare = k2 === k ? (k === 2 ? 3 : 2) : k2;
        return { n, d, k, k2: d * spare > 16 ? 2 : spare };
      }),
  );
};
const decimalHundredths = (n) => `0.${String(n).padStart(2, "0")}`;

export const UPPER = [
  {
    id: "g4-equiv",
    grades: [4, 4],
    standard: "4.NF.A.1",
    strand: S("Number and operations: fractions", "Número y operaciones: fracciones"),
    title: S("Equivalent fractions", "Fracciones equivalentes"),
    kinds: {
      1: [["frac", "scaled"]],
      2: [
        ["frac", "bar"],
        ["scaled", "bar"],
      ],
      3: [["frac", "scaled", "bar"]],
    },
    pool: equivPool,
    make: {
      frac: (i) => ({ t: "frac", n: i.n, d: i.d }),
      scaled: (i) => ({ t: "frac", n: i.n * i.k, d: i.d * i.k }),
      bar: (i) => ({ t: "fracbar", n: i.n * i.k2, d: i.d * i.k2 }),
    },
  },
  {
    id: "g4-fracdec",
    grades: [4, 4],
    standard: "4.NF.C.6",
    strand: S("Number and operations: fractions", "Número y operaciones: fracciones"),
    title: S(
      "Tenths and hundredths: fractions, decimals and grids",
      "Décimas y centésimas: fracciones, decimales y cuadrículas",
    ),
    kinds: {
      1: [
        ["frac", "decimal"],
        ["decimal", "hgrid"],
      ],
      2: [
        ["frac", "hgrid"],
        ["frac", "decimal"],
      ],
      3: [["frac", "decimal", "hgrid"]],
    },
    pool: (level) => [
      ...range(1, 9).map((n) => ({ n, d: 10 })),
      ...(level > 1
        ? range(1, 99)
            .filter((n) => n % 10)
            .map((n) => ({ n, d: 100 }))
        : []),
    ],
    make: {
      frac: (i) => ({ t: "frac", n: i.n, d: i.d }),
      decimal: (i) => ({ t: "decimal", text: i.d === 10 ? `0.${i.n}` : decimalHundredths(i.n) }),
      hgrid: (i) => ({ t: "hgrid", k: (100 * i.n) / i.d }),
    },
  },
  {
    id: "g4-wordform",
    grades: [4, 4],
    standard: "4.NBT.A.2",
    strand: S("Number and operations in base ten", "Número y operaciones en base diez"),
    title: S(
      "Word form, standard form and expanded form",
      "Forma en palabras, forma estándar y forma desarrollada",
    ),
    kinds: {
      1: [["numeral", "word"]],
      2: [
        ["word", "expanded"],
        ["numeral", "word"],
        ["numeral", "expanded"],
      ],
      3: [["numeral", "word", "expanded"]],
    },
    pool: numberPool,
    make: {
      numeral: (i) => ({ t: "numeral", n: i.n }),
      word: (i) => ({ t: "word", n: i.n }),
      expanded: (i) => ({ t: "expanded", n: i.n }),
    },
  },
  {
    id: "g5-fdp",
    grades: [5, 5],
    standard: "5.NBT.A.3",
    strand: S("Number and operations in base ten", "Número y operaciones en base diez"),
    title: S(
      "Benchmark fractions, decimals and percents",
      "Fracciones, decimales y porcentajes de referencia",
    ),
    kinds: {
      1: [
        ["frac", "decimal"],
        ["decimal", "percent"],
      ],
      2: [
        ["frac", "percent"],
        ["decimal", "hgrid"],
        ["frac", "hgrid"],
      ],
      3: [
        ["frac", "decimal", "percent"],
        ["decimal", "percent", "hgrid"],
      ],
    },
    pool: (level) => [...FDP_BENCH, ...(level > 1 ? FDP_MORE : [])].map(fdpIdea),
    make: FDP_MAKE,
  },
  {
    id: "g5-order",
    grades: [5, 5],
    standard: "5.OA.A.1",
    strand: S("Operations and algebraic thinking", "Operaciones y pensamiento algebraico"),
    title: S(
      "Order of operations: expressions and values",
      "Orden de las operaciones: expresiones y valores",
    ),
    kinds: {
      1: [["calc", "numeral"]],
      2: [
        ["calc", "calc2"],
        ["calc", "numeral"],
      ],
      3: [["calc", "calc2", "numeral"]],
    },
    pool: orderPool,
    make: {
      calc: (i) => ({ t: "calc", text: i.a }),
      calc2: (i) => ({ t: "calc", text: i.b }),
      numeral: (i) => ({ t: "numeral", n: i.v }),
    },
    keyText: (i) => String(i.v),
  },
  {
    id: "g6-ratio",
    grades: [6, 6],
    standard: "6.RP.A.3",
    strand: S("Ratios and proportional relationships", "Razones y relaciones proporcionales"),
    title: S(
      "Ratio tables, ratio statements and unit rates",
      "Tablas de razones, enunciados de razón y tasas unitarias",
    ),
    kinds: {
      1: [
        ["ratiostmt", "unitrate"],
        ["ratiotable", "unitrate"],
      ],
      2: [
        ["ratiotable", "ratiostmt"],
        ["ratiostmt", "unitrate"],
      ],
      3: [["ratiotable", "ratiostmt", "unitrate"]],
    },
    meta: (rng) => ({ ctx: int(rng, 0, 4) }),
    pool: (level) => RATES[level].map(([n, d]) => ({ n, d })),
    make: {
      ratiotable: (i, m) => ({
        t: "ratiotable",
        ctx: m.ctx,
        rows: [2, 3, 4].map((k) => [i.d * k, i.n * k]),
      }),
      ratiostmt: (i, m) => ({
        t: "ratiostmt",
        ctx: m.ctx,
        a: i.n * (1 + (i.n % 2)),
        b: i.d * (1 + (i.n % 2)),
      }),
      unitrate: (i, m) => ({ t: "unitrate", ctx: m.ctx, n: i.n, d: i.d }),
    },
  },
  {
    id: "g6-fdp",
    grades: [6, 6],
    standard: "6.RP.A.3c",
    strand: S("Ratios and proportional relationships", "Razones y relaciones proporcionales"),
    title: S("Fractions, decimals and percents", "Fracciones, decimales y porcentajes"),
    kinds: {
      1: [
        ["frac", "percent"],
        ["decimal", "percent"],
      ],
      2: [
        ["frac", "decimal"],
        ["decimal", "percent"],
        ["frac", "percent"],
      ],
      3: [["frac", "decimal", "percent"]],
    },
    pool: (level) =>
      [
        ...FDP_BENCH,
        ...FDP_MORE.slice(0, 8),
        ...(level > 1 ? FDP_RATIO : []),
        ...(level === 3 ? FDP_STRETCH : []),
      ].map(fdpIdea),
    make: FDP_MAKE,
  },
  {
    id: "g6-verbal",
    grades: [6, 6],
    standard: "6.EE.A.2",
    strand: S("Expressions and equations", "Expresiones y ecuaciones"),
    title: S("Words, expressions and tables", "Palabras, expresiones y tablas"),
    kinds: {
      1: [["verbal", "alg"]],
      2: [
        ["alg", "vtable"],
        ["verbal", "vtable"],
        ["verbal", "alg"],
      ],
      3: [["verbal", "alg", "vtable"]],
    },
    pool: verbalPool,
    make: {
      verbal: (i) => ({ t: "verbal", a: i.a, ad: i.ad, b: i.b }),
      alg: (i) => ({ t: "alg", a: i.a, ad: i.ad, b: i.b }),
      vtable: (i) => ({ t: "vtable", a: i.a, ad: i.ad, b: i.b, ns: tableInputs(i) }),
    },
    keyText: (i) => algText(i.a, i.ad, i.b),
  },
  {
    id: "g7-prop",
    grades: [7, 7],
    standard: "7.RP.A.2",
    strand: S("Ratios and proportional relationships", "Razones y relaciones proporcionales"),
    title: S(
      "Proportional tables, equations and words",
      "Tablas proporcionales, ecuaciones y palabras",
    ),
    kinds: {
      1: [
        ["ptable", "peq"],
        ["peq", "pverbal"],
      ],
      2: [
        ["ptable", "pverbal"],
        ["ptable", "peq"],
      ],
      3: [["ptable", "peq", "pverbal"]],
    },
    pool: (level) => PROPORTIONS[level].map(([n, d]) => ({ n, d })),
    make: {
      ptable: (i) => ({
        t: "ptable",
        n: i.n,
        d: i.d,
        xs: i.d === 1 ? [2, 3, 5] : [i.d, 2 * i.d, 3 * i.d],
      }),
      peq: (i) => ({ t: "peq", n: i.n, d: i.d }),
      pverbal: (i) => ({ t: "pverbal", n: i.n, d: i.d }),
    },
  },
  {
    id: "g7-integers",
    grades: [7, 7],
    standard: "7.NS.A.1",
    strand: S("The number system", "El sistema numérico"),
    title: S(
      "Integer operations, number-line moves and results",
      "Operaciones con enteros, movimientos en la recta y resultados",
    ),
    kinds: {
      1: [
        ["intexpr", "numeral"],
        ["move", "numeral"],
      ],
      2: [
        ["intexpr", "move"],
        ["move", "numeral"],
        ["intexpr", "numeral"],
      ],
      3: [["intexpr", "move", "numeral"]],
    },
    pool: integerPool,
    make: {
      intexpr: (i) => ({ t: "intexpr", a: i.a, op: i.op, b: i.b }),
      move: (i) => ({ t: "move", a: i.a, s: i.op === "+" ? i.b : -i.b }),
      numeral: (i) => ({ t: "numeral", n: i.op === "+" ? i.a + i.b : i.a - i.b }),
    },
    keyText: (i) => signed(i.op === "+" ? i.a + i.b : i.a - i.b),
  },
  {
    id: "g8-linear",
    grades: [8, 8],
    standard: "8.F.B.4",
    strand: S("Functions", "Funciones"),
    title: S("Linear equations, graphs and tables", "Ecuaciones lineales, gráficas y tablas"),
    kinds: {
      1: [
        ["leq", "lgraph"],
        ["leq", "ltable"],
      ],
      2: [
        ["lgraph", "ltable"],
        ["leq", "lgraph"],
        ["leq", "ltable"],
      ],
      3: [["leq", "lgraph", "ltable"]],
    },
    pool: (level) => {
      const slopes =
        level === 1
          ? [
              [1, 1],
              [2, 1],
              [-1, 1],
              [-2, 1],
            ]
          : level === 2
            ? [
                [1, 1],
                [2, 1],
                [3, 1],
                [-1, 1],
                [-2, 1],
                [-3, 1],
              ]
            : [
                [1, 1],
                [2, 1],
                [3, 1],
                [-1, 1],
                [-2, 1],
                [-3, 1],
                [1, 2],
                [-1, 2],
              ];
      const reach = level === 1 ? 3 : 4;
      return slopes.flatMap(([mn, md]) => range(-reach, reach).map((b) => ({ mn, md, b })));
    },
    make: {
      leq: (i) => ({ t: "leq", mn: i.mn, md: i.md, b: i.b }),
      lgraph: (i) => ({ t: "lgraph", mn: i.mn, md: i.md, b: i.b }),
      ltable: (i) => ({
        t: "ltable",
        mn: i.mn,
        md: i.md,
        b: i.b,
        xs: i.md === 1 ? [-1, 0, 1, 2] : [-2, 0, 2, 4],
      }),
    },
    keyText: (i) => lineText(i.mn, i.md, i.b),
  },
  {
    id: "g8-exponents",
    grades: [8, 8],
    standard: "8.EE.A.4",
    strand: S("Expressions and equations", "Expresiones y ecuaciones"),
    title: S(
      "Powers of ten, values and scientific notation",
      "Potencias de diez, valores y notación científica",
    ),
    kinds: {
      1: [["sci", "plain"]],
      2: [
        ["product10", "sci"],
        ["product10", "plain"],
        ["sci", "plain"],
      ],
      3: [["product10", "plain", "sci"]],
    },
    pool: exponentPool,
    make: {
      product10: (i) => ({ t: "product10", a: i.a, p: i.p, b: i.b, q: i.q }),
      plain: (i) => ({ t: "plain", text: plainText(i) }),
      sci: (i) => ({ t: "sci", c: i.c, e: i.e }),
    },
    keyText: plainText,
  },
];

