// The 21 skills of Family Math Duel and what each level deals: the template the hand is played on, the goal, the
// card values, and how many spare cards sit on the table. A level changes the mathematics (more cards, bigger or
// less friendly numbers, a harder target, a harder operation), never just the numbers. @fm2 FM-016 FM-051 FM-061
const S = (en, es) => ({ en, es });
const ints = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
const signed = (a, b) => [...ints(-b, -a).map((t) => t.replace("-", "−")), ...ints(a, b)];
const times = (list, step) => list.map((v) => String(Number(v) * step));

// One level: tpl, goal ("max" | "min" | "closest"), targets (for closest), num/exp/op card lists, extra spare cards
// per seat, style of printed answers ("int" | "dec" | "frac"), and pips (dots on the cards for the youngest learners).
const lv = (tpl, goal, rest = {}) => ({ tpl, goal, extra: 0, style: "int", ...rest });

const FRAC_EASY = [
  "1/2",
  "1/4",
  "3/4",
  "1/3",
  "2/3",
  "3/5",
  "1/5",
  "4/5",
  "3/8",
  "5/8",
  "7/10",
  "0.5",
  "0.25",
  "0.75",
  "0.6",
  "0.3",
  "0.9",
  "0.1",
];
const FRAC_MID = [
  "0.45",
  "0.4",
  "0.35",
  "0.62",
  "0.05",
  "2/5",
  "7/20",
  "3/8",
  "1 1/2",
  "1.25",
  "1 1/4",
  "1.2",
  "5/4",
  "0.99",
  "9/10",
  "13/20",
  "0.7",
];
const SUM_FRAC_L3 = ["1/2", "0.25", "3/4", "0.6", "1/5", "0.9", "0.35", "2/5", "1/8", "0.45"];
const HALVES = ["1/8", "3/8", "5/8", "7/8", "1/4", "3/4", "1/2", "1/8", "3/4"];
const UNLIKE = ["1/2", "1/3", "2/3", "1/4", "3/4", "1/6", "5/6", "3/8", "1/2", "2/3"];
const UNLIKE3 = ["1/2", "1/3", "2/3", "3/4", "5/6", "1/6", "3/5", "7/8", "1/4", "4/5"];
const DEC1 = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9"];
const DEC2 = ["0.25", "0.5", "0.75", "0.35", "0.6", "0.45", "0.8", "1.1", "0.15", "1.2"];
const DEC3 = ["1.4", "2.05", "0.75", "3.2", "1.85", "2.6", "0.95", "1.15", "2.4"];
const SIGNED_RATIONALS = [
  "−3/2",
  "−1/2",
  "1/2",
  "3/4",
  "−3/4",
  "5/2",
  "−5/2",
  "2",
  "−2",
  "3",
  "−3",
  "1/4",
  "−1/4",
];
const SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225].map(String);

export const SKILLS = [
  {
    id: "k-compare",
    grades: [0, 0],
    standard: "K.CC.C.7",
    strand: S("Counting and comparing", "Contar y comparar"),
    title: S("Who has more?", "¿Quién tiene más?"),
    labSkill: "0:compare",
    levels: () => [
      lv("single", "max", { num: ints(1, 5), extra: 1, pips: true }),
      lv("single", "max", { num: ints(1, 10), extra: 1, pips: true }),
      lv("sum2", "max", { num: ints(1, 5), pips: true }),
    ],
  },
  {
    id: "k-make10",
    grades: [0, 1],
    standard: "K.OA.A.4",
    strand: S("Addition and subtraction", "Suma y resta"),
    title: S("Make ten", "Forma diez"),
    labSkill: "0:make10",
    levels: (grade) => [
      lv("sum2", "closest", { targets: ["10"], num: ints(1, 9), pips: grade === 0 }),
      lv("sum2", "closest", { targets: ["10"], num: ints(0, 10), pips: grade === 0 }),
      lv("sum3", "closest", { targets: ["10", "12"], num: ints(1, 6), pips: grade === 0 }),
    ],
  },
  {
    id: "g1-biggest-sum",
    grades: [1, 2],
    standard: "1.OA.C.6",
    strand: S("Addition and subtraction", "Suma y resta"),
    title: S("Biggest sum", "La suma más grande"),
    levels: (grade) => [
      lv("sum2", "max", { num: ints(0, 9) }),
      lv("sum2", "max", { num: grade >= 2 ? ints(6, 14) : ints(5, 10) }),
      lv("sum3", "max", { num: grade >= 2 ? ints(3, 9) : ints(1, 6) }),
    ],
  },
  {
    id: "g1-closest",
    grades: [1, 2],
    standard: "2.OA.B.2",
    strand: S("Addition and subtraction", "Suma y resta"),
    title: S("Closest to the target", "Lo más cerca de la meta"),
    levels: (grade) => [
      lv("sum2", "closest", { targets: ["20"], num: grade >= 2 ? ints(8, 15) : ints(4, 12) }),
      lv("sum3", "closest", {
        targets: grade >= 2 ? ["25", "30"] : ["20"],
        num: grade >= 2 ? ints(5, 12) : ints(3, 9),
      }),
      lv("sum3", "closest", {
        targets: grade >= 2 ? ["40", "50"] : ["20", "18", "15"],
        num: grade >= 2 ? ints(10, 25) : ints(2, 11),
      }),
    ],
  },
  {
    id: "g2-place-number",
    grades: [2, 3],
    standard: "2.NBT.A.1",
    strand: S("Place value", "Valor posicional"),
    title: S("Build the biggest number", "Forma el número más grande"),
    labSkill: "2:placevalue",
    levels: () => [
      lv("num2", "max", { num: ints(1, 9) }),
      lv("num3", "max", { num: ints(1, 9) }),
      lv("num3", "closest", { targets: ["500", "700", "250", "800", "350"], num: ints(1, 9) }),
    ],
  },
  {
    id: "g2-two-digit-sums",
    grades: [2, 3],
    standard: "2.NBT.B.5",
    strand: S("Addition and subtraction", "Suma y resta"),
    title: S("Tens and ones sums", "Sumas con decenas y unidades"),
    levels: () => [
      lv("dsum2", "max", { num: ints(1, 9) }),
      lv("dsum2", "closest", { targets: ["100"], num: ints(1, 9) }),
      lv("ddiff2", "max", { num: ints(1, 9) }),
    ],
  },
  {
    id: "g3-product-war",
    grades: [3, 4],
    standard: "3.OA.C.7",
    strand: S("Multiplication and division", "Multiplicación y división"),
    title: S("Multiplication war", "Guerra de multiplicación"),
    labSkill: "3:mult",
    levels: (grade) => [
      lv("prod2", "max", { num: ints(2, 6) }),
      lv("prod2", "max", { num: ints(2, grade >= 4 ? 10 : 9) }),
      lv("prodsum", "max", { num: ints(2, grade >= 4 ? 10 : 9) }),
    ],
  },
  {
    id: "g3-closest-product",
    grades: [3, 5],
    standard: "3.OA.C.7",
    strand: S("Multiplication and division", "Multiplicación y división"),
    title: S("Closest product", "El producto más cercano"),
    levels: (grade) => [
      lv("prod2", "closest", { targets: ["12", "18", "20", "24", "30"], num: ints(2, 6) }),
      lv("prod2", "closest", {
        targets: ["30", "36", "40", "42", "48", "54", "56", "63"],
        num: ints(2, grade >= 4 ? 10 : 9),
      }),
      lv("prodsum", "closest", {
        targets: grade >= 4 ? ["50", "60", "70", "80", "90"] : ["40", "50", "55", "60", "65"],
        num: ints(2, grade >= 4 ? 12 : 9),
      }),
    ],
  },
  {
    id: "g4-big-number",
    grades: [4, 5],
    standard: "4.NBT.A.2",
    strand: S("Place value", "Valor posicional"),
    title: S("Big numbers and targets", "Números grandes y metas"),
    levels: () => [
      lv("num4", "max", { num: ints(1, 9) }),
      lv("num4", "closest", { targets: ["5000", "4000", "6000", "7000", "8000"], num: ints(1, 9) }),
      lv("num4", "closest", { targets: ["3500", "4250", "5750", "6500", "7250"], num: ints(1, 9) }),
    ],
  },
  {
    id: "g4-multiply-tens",
    grades: [4, 5],
    standard: "4.NBT.B.5",
    strand: S("Multiplication and division", "Multiplicación y división"),
    title: S("Multiply with tens", "Multiplica con decenas"),
    levels: () => {
      const mix = { groups: [ints(2, 9), times(ints(2, 9), 10)] };
      return [
        lv("prod2", "max", { num: mix }),
        lv("prod2", "closest", { targets: ["200", "300", "400", "500", "600", "800"], num: mix }),
        lv("prodsum", "closest", { targets: ["300", "400", "500", "600", "700", "800"], num: mix }),
      ];
    },
  },
  {
    id: "g5-compare-values",
    grades: [4, 6],
    standard: "5.NBT.A.3",
    strand: S("Fractions and decimals", "Fracciones y decimales"),
    title: S("Fractions and decimals: who is bigger?", "Fracciones y decimales: ¿quién es mayor?"),
    labSkill: "5:compare",
    levels: () => [
      lv("single", "max", { num: FRAC_EASY, extra: 1, style: "frac" }),
      lv("single", "max", { num: FRAC_MID, extra: 1, style: "frac" }),
      lv("sum2", "max", { num: SUM_FRAC_L3, style: "frac" }),
    ],
  },
  {
    id: "g5-near-one",
    grades: [5, 6],
    standard: "5.NF.A.1",
    strand: S("Fractions and decimals", "Fracciones y decimales"),
    title: S("Closest to one with fractions", "Lo más cerca de uno con fracciones"),
    levels: () => [
      lv("sum2", "closest", { targets: ["1"], num: HALVES, style: "frac" }),
      lv("sum2", "closest", { targets: ["1"], num: UNLIKE, style: "frac" }),
      lv("sum3", "closest", { targets: ["1", "3/2", "2"], num: UNLIKE3, style: "frac" }),
    ],
  },
  {
    id: "g5-decimal-sums",
    grades: [5, 6],
    standard: "5.NBT.B.7",
    strand: S("Fractions and decimals", "Fracciones y decimales"),
    title: S("Decimal sums", "Sumas de decimales"),
    levels: () => [
      lv("sum2", "closest", { targets: ["1"], num: DEC1, style: "dec" }),
      lv("sum3", "closest", { targets: ["1.5", "2"], num: DEC2, style: "dec" }),
      lv("sum3", "closest", { targets: ["3", "4", "5"], num: DEC3, style: "dec" }),
    ],
  },
  {
    id: "g6-order-of-ops",
    grades: [5, 7],
    standard: "6.EE.A.1",
    strand: S("Expressions and equations", "Expresiones y ecuaciones"),
    title: S("Order of operations targets", "Metas con el orden de las operaciones"),
    levels: (grade) => [
      lv("paren", "max", { num: ints(2, 6) }),
      lv("ops3", "closest", {
        targets: ["20", "24", "30", "36", "40"],
        num: ints(1, 6),
        op: ["+", "×"],
      }),
      grade >= 6
        ? lv("ops3", "closest", { targets: ["0"], num: ints(1, 9), op: ["+", "−", "×", "−"] })
        : lv("ops3", "closest", { targets: ["30", "40", "50"], num: ints(2, 9), op: ["+", "×"] }),
    ],
  },
  {
    id: "g6-zero-sum",
    grades: [6, 7],
    standard: "6.NS.C.5",
    strand: S("Integers", "Números enteros"),
    title: S("Zero-sum integer cards", "Cartas de enteros de suma cero"),
    levels: (grade) => [
      lv("sum3", "max", { num: signed(1, 9) }),
      lv("sum3", "closest", { targets: ["0"], num: signed(1, 9) }),
      lv("sum4", "closest", { targets: ["0"], num: signed(1, grade >= 7 ? 20 : 15) }),
    ],
  },
  {
    id: "g6-smallest-fraction",
    grades: [5, 7],
    standard: "6.NS.A.1",
    strand: S("Fractions and decimals", "Fracciones y decimales"),
    title: S("Smallest positive fraction", "La fracción positiva más pequeña"),
    levels: () => [
      lv("frac2", "min", { num: ints(1, 9), style: "frac" }),
      lv("frac2", "closest", { targets: ["1/2"], num: ints(1, 9), style: "frac" }),
      lv("fracdiv", "min", { num: ints(1, 9), style: "frac" }),
    ],
  },
  {
    id: "g7-percent-of",
    grades: [7, 8],
    standard: "7.RP.A.3",
    strand: S("Ratios and percents", "Razones y porcentajes"),
    title: S("Percent of a number", "Porcentaje de un número"),
    levels: () => [
      lv("pct", "max", {
        num: {
          groups: [
            ["10", "20", "25", "50", "75"],
            ["20", "40", "60", "80", "120"],
          ],
        },
        style: "dec",
      }),
      lv("pct", "closest", {
        targets: ["10", "15", "20", "25", "30", "45"],
        num: {
          groups: [
            ["10", "20", "25", "50", "75"],
            ["20", "40", "60", "80", "120"],
          ],
        },
        style: "dec",
      }),
      lv("pct", "closest", {
        targets: ["24", "30", "42", "54", "72"],
        num: {
          groups: [
            ["5", "15", "35", "45", "60", "85"],
            ["40", "60", "80", "120", "160", "200"],
          ],
        },
        style: "dec",
      }),
    ],
  },
  {
    id: "g7-signed-product",
    grades: [7, 8],
    standard: "7.NS.A.2",
    strand: S("Integers", "Números enteros"),
    title: S("Signed products", "Productos con signo"),
    levels: () => [
      lv("prod2", "max", { num: signed(1, 9) }),
      lv("prod2", "min", { num: signed(1, 9) }),
      lv("prod2", "max", { num: SIGNED_RATIONALS, style: "frac" }),
    ],
  },
  {
    id: "g8-power",
    grades: [8, 8],
    standard: "8.EE.A.1",
    strand: S("Exponents and roots", "Exponentes y raíces"),
    title: S("Power duel", "Duelo de potencias"),
    levels: () => [
      lv("pow", "max", { num: ints(2, 5), exp: ints(1, 4) }),
      lv("pow", "min", { num: ints(2, 5), exp: signed(1, 3).concat("0"), style: "frac" }),
      lv("powsum", "closest", {
        targets: ["50", "100", "150", "200", "300"],
        num: ints(2, 5),
        exp: ints(0, 4),
      }),
    ],
  },
  {
    id: "g8-scinot",
    grades: [8, 8],
    standard: "8.EE.A.4",
    strand: S("Exponents and roots", "Exponentes y raíces"),
    title: S("Scientific notation duel", "Duelo de notación científica"),
    levels: () => [
      lv("sci", "max", { num: ints(1, 9), exp: ints(1, 6) }),
      lv("sci", "min", { num: ints(1, 9), exp: signed(1, 5).concat(ints(0, 4)), style: "dec" }),
      lv("sci", "closest", {
        targets: ["450", "3500", "0.05", "72000", "0.2"],
        num: ["1.2", "2.5", "3.6", "4.8", "6.4", "7.5", "9.1"],
        exp: signed(1, 3).concat(ints(0, 5)),
        style: "dec",
      }),
    ],
  },
  {
    id: "g8-roots",
    grades: [8, 8],
    standard: "8.EE.A.2",
    strand: S("Exponents and roots", "Exponentes y raíces"),
    title: S("Square root targets", "Metas con raíces cuadradas"),
    levels: () => [
      lv("root2", "max", { num: SQUARES.slice(0, 9) }),
      lv("root2", "closest", {
        targets: ["10", "12", "14", "15", "16", "17", "18"],
        num: SQUARES.slice(2, 11),
      }),
      lv("root3", "closest", { targets: ["18", "20", "22", "24", "26", "28", "30"], num: SQUARES }),
    ],
  },
];

export const SKILL_IDS = SKILLS.map((s) => s.id);
export const skillById = (id) => SKILLS.find((s) => s.id === id);

export function levelSpec(skillId, level, grade) {
  const skill = skillById(skillId);
  if (!skill) throw new RangeError(`Unknown skill ${skillId}`);
  const [low, high] = skill.grades;
  const clamped = Math.min(Math.max(grade, low), high);
  return skill.levels(clamped)[Math.min(Math.max(level, 1), 3) - 1];
}
