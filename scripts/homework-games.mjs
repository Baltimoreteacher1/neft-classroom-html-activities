/**
 * Topic-matched mini-games for family homework Play tab.
 * Generator-driven HTML + inline JS — no external deps (2D/CSS fallback).
 */
import { decimalOperation, detectVisualTopic } from "./homework-alignment.mjs";

// Build-time shuffles must be reproducible: with Math.random() a no-op
// regeneration rewrote the Play-tab games in ~10 lesson files every run, which
// buried real changes in noise. Seed from the content being shuffled so the
// order is stable across builds but still varies between games.
function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle(list, seedKey = "") {
  const out = [...list];
  let a = seedFrom(`${seedKey}|${JSON.stringify(list)}`) >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function gameMeta(config) {
  const topic = detectVisualTopic(config);
  const vocab = (config.vocabulary || []).slice(0, 4);
  return { topic, vocab, title: config.title || "Tonight's math" };
}

/** @returns {{ type: string, html: string, initScript: string }} */
export function buildHomeworkGame(config) {
  const { topic, vocab, title } = gameMeta(config);
  const builders = {
    exponents: buildExponentGame,
    ratios: buildRatioGame,
    equations: buildEquationGame,
    inequalities: buildInequalityGame,
    expressions: buildExpressionGame,
    statistics: buildStatsSortGame,
    "coordinate-plane": buildCoordinateGame,
    "number-line": buildNumberLineGame,
    fractions: buildFractionGame,
    area: buildAreaGame,
    volume: buildVolumeGame,
    "surface-area": buildSurfaceAreaGame,
    decimals: buildDecimalGame,
    factors: buildFactorGame,
  };
  const fn = builders[topic] || buildVocabMatchGame;
  return fn(config, { topic, vocab, title });
}

function buildExponentGame(_config, { title }) {
  const rounds = [
    { q: "What is 2³?", choices: ["8", "6", "9", "5"], correct: 0, hint: "2 × 2 × 2" },
    { q: "What is 5²?", choices: ["25", "10", "7", "52"], correct: 0, hint: "5 × 5" },
    { q: "What is 3³?", choices: ["27", "9", "6", "33"], correct: 0, hint: "3 × 3 × 3" },
    { q: "Which equals 4²?", choices: ["16", "8", "6", "42"], correct: 0, hint: "4 × 4" },
  ];
  return mcSpeedGame("exponent", title, "Power Up!", "¡Potencia!", rounds, {
    en: "Tap the correct value. The exponent tells how many times to multiply the base.",
    es: "Toquen el valor correcto. El exponente dice cuántas veces multiplicar la base.",
  });
}

function buildRatioGame(_config, { title }) {
  const rounds = [
    { q: "Ratio 2:3 — if A=4, B=?", choices: ["6", "5", "8", "2"], correct: 0 },
    { q: "Ratio 1:4 — if A=3, B=?", choices: ["12", "7", "4", "9"], correct: 0 },
    { q: "Equivalent to 2:5?", choices: ["4:10", "2:10", "5:2", "3:5"], correct: 0 },
    { q: "Ratio 3:2 — if A=9, B=?", choices: ["6", "12", "3", "11"], correct: 0 },
  ];
  return mcSpeedGame("ratio", title, "Ratio Match!", "¡Razones!", rounds, {
    en: "Use the same multiplier on BOTH parts of the ratio.",
    es: "Usen el mismo multiplicador en AMBAS partes de la razón.",
  });
}

function buildEquationGame(_config, { title }) {
  const rounds = [
    {
      q: "'A number plus 5 equals 12' →",
      choices: ["n + 5 = 12", "5n = 12", "n − 5 = 12", "n + 12 = 5"],
      correct: 0,
    },
    {
      q: "'Twice a number is 10' →",
      choices: ["2n = 10", "n + 2 = 10", "n² = 10", "2 + n = 10"],
      correct: 0,
    },
    {
      q: "'Seven less than n is 3' →",
      choices: ["n − 7 = 3", "7 − n = 3", "n + 7 = 3", "n / 7 = 3"],
      correct: 0,
    },
    {
      q: "Variable stands for…",
      choices: ["Unknown number", "Always 1", "The answer only", "Addition sign"],
      correct: 0,
    },
  ];
  return mcSpeedGame("equation", title, "Equation Builder!", "¡Ecuaciones!", rounds, {
    en: "Match words to symbols: plus → +, equals → =, unknown → letter.",
    es: "Unan palabras con símbolos: más → +, es igual → =, incógnita → letra.",
  });
}

function buildInequalityGame(_config, { title }) {
  const rounds = [
    { q: "x > 5 — is 6 a solution?", choices: ["Yes", "No"], correct: 0 },
    { q: "x ≤ 4 — is 4 a solution?", choices: ["Yes", "No"], correct: 0 },
    { q: "x < 3 — is 3 a solution?", choices: ["No", "Yes"], correct: 0 },
    { q: "Open circle used for…", choices: ["< or >", "≤ or ≥", "Only =", "Never"], correct: 0 },
  ];
  return mcSpeedGame("inequality", title, "Inequality Gate!", "¡Desigualdades!", rounds, {
    en: "Test values: substitute to see if the inequality is true.",
    es: "Prueben valores: sustituyan para ver si la desigualdad es verdadera.",
  });
}

function buildExpressionGame(_config, { title }) {
  const rounds = [
    { q: "Evaluate 2x when x = 4", choices: ["8", "6", "24", "2"], correct: 0 },
    {
      q: "Which is an expression (no =)?",
      choices: ["3n + 2", "3n + 2 = 8", "n = 5", "8 = 8"],
      correct: 0,
    },
    { q: "Coefficient in 5y?", choices: ["5", "y", "5y", "None"], correct: 0 },
    { q: "Evaluate 3 + 2²", choices: ["7", "25", "5", "12"], correct: 0 },
  ];
  return mcSpeedGame("expression", title, "Expression Lab!", "¡Expresiones!", rounds, {
    en: "Substitute the value, then follow order of operations.",
    es: "Sustituyan el valor, luego sigan el orden de operaciones.",
  });
}

function buildStatsSortGame(_config, { title }) {
  const items = [
    { text: "How many pets do students have?", bucket: "stat" },
    { text: "What is your favorite color?", bucket: "stat" },
    { text: "What is 2 + 2?", bucket: "not" },
    { text: "Heights of plants in cm", bucket: "stat" },
    { text: "Spell the word cat", bucket: "not" },
    { text: "Minutes spent on homework", bucket: "stat" },
  ];
  return dragBucketGame(
    "stats",
    title,
    "Stat Sort!",
    "¡Estadística!",
    items,
    {
      stat: { en: "Statistical question", es: "Pregunta estadística" },
      not: { en: "NOT statistical", es: "NO estadística" },
    },
    {
      en: "Statistical questions expect many different answers from a group.",
      es: "Las preguntas estadísticas esperan muchas respuestas diferentes de un grupo.",
    },
  );
}

function buildCoordinateGame(_config, { title }) {
  const rounds = [
    {
      q: "Point at (3, 2) — which quadrant?",
      choices: ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"],
      correct: 0,
    },
    { q: "Origin coordinates?", choices: ["(0, 0)", "(1, 1)", "(0, 1)", "(1, 0)"], correct: 0 },
    {
      q: "Move right 4, up 1 from (1,2) →",
      choices: ["(5, 3)", "(5, 2)", "(1, 6)", "(−3, 3)"],
      correct: 0,
    },
    { q: "x-axis is…", choices: ["Horizontal", "Vertical", "Diagonal", "A point"], correct: 0 },
  ];
  return mcSpeedGame("coordinate", title, "Grid Treasure!", "¡Coordenadas!", rounds, {
    en: "Go right for x, up for y. Play together on the grid!",
    es: "Derecha es x, arriba es y. ¡Jueguen juntos en la cuadrícula!",
  });
}

/* Unit 7's four number-line lessons shared one fixed set of rounds, all of them
 * whole integers — in three lessons whose objectives say "rational numbers,
 * including fractions and decimals". A family playing along never met a
 * negative fraction or decimal, which is the whole difficulty of 7-2 and 7-3.
 * The set also drilled |−7| in 7-1, where absolute value has not been taught
 * yet (it is 7-3's standard, 6.NOS.8). Rounds now come from what the lesson
 * itself says it covers. Every answer below is checked against the number line:
 *   −2 > −5 · opposite of −4 is 4 · opposite of 7 is −7 · 0 > −3
 *   −2.05 > −2.5 · opposite of −3/4 is 3/4 · −1/2 is nearer 0 than −1.5 · −1/4 > −3/4
 *   |−7| = 7 · |−3/4| = 3/4 · |2.5| = 2.5 · |−8| = 8 > |3| = 3
 *   −1 < 0 < 2 · −7 < −3 < 1 · −2 < −0.5 < 0.5 · −4.5 is least of −4, −4.5, −3 */
const NUMBER_LINE_ROUNDS = {
  absoluteValue: [
    { q: "|−7| = ?", choices: ["7", "−7", "0", "14"], correct: 0 },
    { q: "|−3/4| = ?", choices: ["3/4", "−3/4", "4/3", "0"], correct: 0 },
    { q: "|2.5| = ?", choices: ["2.5", "−2.5", "0", "5"], correct: 0 },
    {
      q: "Greater absolute value: −8 or 3?",
      choices: ["−8", "3", "Equal"],
      correct: 0,
      hint: "Absolute value is distance from zero, so ignore the sign.",
    },
  ],
  ordering: [
    {
      q: "Least to greatest: −1, 0, 2",
      choices: ["−1, 0, 2", "2, 0, −1", "0, −1, 2", "2, −1, 0"],
      correct: 0,
    },
    {
      q: "Least to greatest: −3, −7, 1",
      choices: ["−7, −3, 1", "−3, −7, 1", "1, −3, −7", "−3, 1, −7"],
      correct: 0,
    },
    {
      q: "Least to greatest: −0.5, −2, 0.5",
      choices: ["−2, −0.5, 0.5", "−0.5, −2, 0.5", "0.5, −0.5, −2", "−2, 0.5, −0.5"],
      correct: 0,
    },
    { q: "Which is least: −4, −4.5, −3?", choices: ["−4.5", "−4", "−3", "They tie"], correct: 0 },
  ],
  rational: [
    {
      q: "Which is greater: −2.5 or −2.05?",
      choices: ["−2.05", "−2.5", "Equal"],
      correct: 0,
      hint: "Further right on the number line is greater.",
    },
    { q: "Opposite of −3/4?", choices: ["3/4", "−3/4", "4/3", "0"], correct: 0 },
    {
      q: "Closer to 0: −1/2 or −1.5?",
      choices: ["−1/2", "−1.5", "Equal"],
      correct: 0,
    },
    { q: "Which is greater: −1/4 or −3/4?", choices: ["−1/4", "−3/4", "Equal"], correct: 0 },
  ],
  integers: [
    { q: "Which is greater: −2 or −5?", choices: ["−2", "−5", "Equal"], correct: 0 },
    { q: "Opposite of −4?", choices: ["4", "−4", "0", "8"], correct: 0 },
    { q: "Opposite of 7?", choices: ["−7", "7", "0", "14"], correct: 0 },
    { q: "Which is greater: 0 or −3?", choices: ["0", "−3", "Equal"], correct: 0 },
  ],
};

/** What this lesson puts on the number line, read from its own objective.
 *  Most specific skill first, so it leads the round-robin. */
function numberLineShapes(config) {
  const said = `${config?.contentObjective || ""} ${config?.title || ""}`.toLowerCase();
  const shapes = [];
  if (/absolute value/.test(said)) shapes.push("absoluteValue");
  if (/\bcompare\b|\border\b/.test(said)) shapes.push("ordering");
  if (/rational number|fraction|decimal/.test(said)) shapes.push("rational");
  // "an integer, fraction, or decimal" is a list of number types, not the
  // lesson's topic — only the plural or an opposites lesson claims this shape.
  if (/\bintegers\b|opposite/.test(said)) shapes.push("integers");
  return shapes.length ? shapes : ["integers"];
}

function buildNumberLineGame(config, { title }) {
  const shapes = numberLineShapes(config);
  const rounds = pickRoundRobin(NUMBER_LINE_ROUNDS, shapes);
  const coach = shapes.includes("absoluteValue")
    ? {
        en: "Absolute value is distance from zero, so it is never negative.",
        es: "El valor absoluto es la distancia al cero, así que nunca es negativo.",
      }
    : shapes.includes("rational")
      ? {
          en: "Further right is greater — and that holds for fractions and decimals too.",
          es: "Más a la derecha es mayor, y eso vale también para fracciones y decimales.",
        }
      : {
          en: "Right is greater on a horizontal number line.",
          es: "A la derecha es mayor en una recta horizontal.",
        };
  return mcSpeedGame("numberline", title, "Number Line Dash!", "¡Recta numérica!", rounds, coach);
}

/** Deal `count` rounds from the pools named by `shapes`, one shape at a time.
 *
 * Round-robin rather than concatenation: a lesson that teaches two things must
 * play both, and taking the first four from a concatenated list lets the first
 * pool fill every slot. Falls through to whatever pools still have rounds once
 * one runs dry, and stops when they are all exhausted. */
function pickRoundRobin(pools, shapes, count = 4) {
  const rounds = [];
  for (let turn = 0; rounds.length < count; turn++) {
    const before = rounds.length;
    for (const shape of shapes) {
      if (rounds.length >= count) break;
      const round = pools[shape]?.[turn];
      if (round) rounds.push(round);
    }
    if (rounds.length === before) break; // every pool exhausted
  }
  return rounds;
}

/* Every 6.NOS.1 lesson used to share one fixed set of rounds — 6 ÷ ½, "½ of 8",
 * "which is larger, ⅔ or ½", 2 ÷ ¼ — and only two of those four are division of
 * fractions at all. No round ever divided a fraction BY a whole number, which is
 * half of 6-1's objective, and none used a numerator other than 1, so a family
 * playing along practised a narrower problem than the one on their student's
 * worksheet. The rounds are drawn instead from the shapes the lesson's own
 * objective says it divides. Every quotient below is exact:
 *   6 ÷ 1/2 = 12   2 ÷ 1/4 = 8    3 ÷ 1/3 = 9     5 ÷ 1/2 = 10
 *   3/4 ÷ 2 = 3/8  2/3 ÷ 4 = 1/6
 *   3/4 ÷ 1/2 = 1 1/2             5/6 ÷ 1/3 = 2 1/2
 *   1 1/2 ÷ 1/2 = 3  2 1/4 ÷ 3 = 3/4  2 1/2 ÷ 1 1/4 = 2  3 1/3 ÷ 2 = 1 2/3 */
const FRACTION_ROUNDS = {
  wholeByFraction: [
    { q: "6 ÷ 1/2 = ?", choices: ["12", "3", "6", "1/12"], correct: 0 },
    { q: "2 ÷ 1/4 = ?", choices: ["8", "2", "4", "1/2"], correct: 0 },
    { q: "3 ÷ 1/3 = ?", choices: ["9", "1", "3", "1/9"], correct: 0 },
    { q: "5 ÷ 1/2 = ?", choices: ["10", "2 1/2", "5", "1/10"], correct: 0 },
  ],
  fractionByWhole: [
    { q: "3/4 ÷ 2 = ?", choices: ["3/8", "1 1/2", "3/4", "1/8"], correct: 0 },
    { q: "2/3 ÷ 4 = ?", choices: ["1/6", "8/3", "3/8", "2/3"], correct: 0 },
  ],
  fractionByFraction: [
    { q: "3/4 ÷ 1/2 = ?", choices: ["1 1/2", "3/8", "2/3", "1/4"], correct: 0 },
    { q: "5/6 ÷ 1/3 = ?", choices: ["2 1/2", "5/18", "1/2", "3/5"], correct: 0 },
  ],
  mixed: [
    { q: "1 1/2 ÷ 1/2 = ?", choices: ["3", "3/4", "1", "2"], correct: 0 },
    { q: "2 1/4 ÷ 3 = ?", choices: ["3/4", "6 3/4", "1 1/4", "3"], correct: 0 },
    { q: "2 1/2 ÷ 1 1/4 = ?", choices: ["2", "3 1/8", "1 1/4", "1/2"], correct: 0 },
    { q: "3 1/3 ÷ 2 = ?", choices: ["1 2/3", "6 2/3", "2/3", "5"], correct: 0 },
  ],
};

/** The division shapes this lesson teaches, read from its own objective. */
function fractionShapes(config) {
  const said = `${config?.contentObjective || ""} ${config?.title || ""}`.toLowerCase();
  const shapes = [];
  if (/whole numbers? by (a )?(unit )?fractions?/.test(said)) shapes.push("wholeByFraction");
  if (/fractions? by a whole number/.test(said)) shapes.push("fractionByWhole");
  if (/fractions? by a fraction/.test(said)) shapes.push("fractionByFraction");
  if (/mixed numbers?/.test(said)) shapes.push("mixed");
  // A problem-solving lesson names no shape of its own — it applies all of them.
  return shapes.length ? shapes : ["wholeByFraction", "fractionByWhole", "fractionByFraction"];
}

function buildFractionGame(config, { title }) {
  const shapes = fractionShapes(config);
  const rounds = pickRoundRobin(FRACTION_ROUNDS, shapes);
  const coach = shapes.includes("mixed")
    ? {
        en: "Change mixed numbers to improper fractions first, then Keep, Change, Flip.",
        es: "Primero conviertan los números mixtos en fracciones impropias, luego Conserva, Cambia, Voltea.",
      }
    : shapes.includes("fractionByWhole")
      ? {
          en: "Write any whole number over 1, then Keep, Change, Flip.",
          es: "Escriban cualquier número entero sobre 1, luego Conserva, Cambia, Voltea.",
        }
      : {
          en: "Dividing by a fraction = multiply by its reciprocal.",
          es: "Dividir por una fracción = multiplicar por su recíproco.",
        };
  return mcSpeedGame("fraction", title, "Fraction Finder!", "¡Fracciones!", rounds, coach);
}

function buildAreaGame(_config, { title }) {
  const rounds = [
    { q: "Rectangle 5 × 3 area?", choices: ["15", "8", "16", "53"], correct: 0 },
    { q: "Triangle: base 6, height 4", choices: ["12", "24", "10", "6"], correct: 0 },
    {
      q: "Area units are…",
      choices: ["Square units", "Cubic units", "Lines", "Degrees"],
      correct: 0,
    },
    { q: "Parallelogram: base 8, height 5", choices: ["40", "13", "80", "45"], correct: 0 },
  ];
  return mcSpeedGame("area", title, "Area Builder!", "¡Área!", rounds, {
    en: "Area = base × height (watch units!).",
    es: "Área = base × altura (¡cuidado con las unidades!).",
  });
}

function buildVolumeGame(_config, { title }) {
  const rounds = [
    { q: "Prism 3×4×2 volume?", choices: ["24", "9", "12", "14"], correct: 0 },
    { q: "Volume units are…", choices: ["Cubic", "Square", "Linear", "Flat"], correct: 0 },
    { q: "Layers: 5×2 base, 3 layers high", choices: ["30", "10", "15", "25"], correct: 0 },
    {
      q: "V = l × w × h uses…",
      choices: ["3 dimensions", "2 dimensions", "1 dimension", "Angles"],
      correct: 0,
    },
  ];
  return mcSpeedGame("volume", title, "Volume Fill!", "¡Volumen!", rounds, {
    en: "Imagine filling the prism with unit cubes layer by layer.",
    es: "Imaginen llenar el prisma con cubos unidad capa por capa.",
  });
}

function buildSurfaceAreaGame(_config, { title }) {
  const rounds = [
    {
      q: "Surface area measures…",
      choices: ["All faces", "Inside only", "One edge", "Volume"],
      correct: 0,
    },
    {
      q: "A net shows…",
      choices: ["Unfolded faces", "Hidden volume", "Angles only", "Graph"],
      correct: 0,
    },
    {
      q: "Units for SA?",
      choices: ["Square units", "Cubic units", "Degrees", "Ratios"],
      correct: 0,
    },
    {
      q: "Find SA by…",
      choices: ["Add face areas", "Multiply l×w×h", "Subtract bases", "Divide edges"],
      correct: 0,
    },
  ];
  return mcSpeedGame("surface", title, "Net Match!", "¡Área de superficie!", rounds, {
    en: "Add up every face you see on the net.",
    es: "Sumen cada cara que ven en la red.",
  });
}

function buildDecimalGame(config, { title }) {
  // 6.NOS.3 is three different operations with three different rules — see
  // decimalOperation(). A family playing the division lesson's game was being
  // drilled on lining up decimal points, which is the addition rule.
  const op = decimalOperation(config);

  if (op === "divide") {
    // Checked: 9.6÷0.8=12, 6.3÷0.9 → 63÷9 = 7, 5.04÷0.12 → 504÷12 = 42.
    const rounds = [
      { q: "9.6 ÷ 0.8 = ?", choices: ["12", "1.2", "120", "0.12"], correct: 0 },
      {
        q: "To divide by 0.4, first make the divisor…",
        choices: ["A whole number: 4", "Smaller", "Zero", "A fraction"],
        correct: 0,
      },
      {
        q: "6.3 ÷ 0.9 becomes…",
        choices: ["63 ÷ 9", "6.3 ÷ 9", "63 ÷ 0.9", "0.63 ÷ 9"],
        correct: 0,
      },
      { q: "5.04 ÷ 0.12 = ?", choices: ["42", "4.2", "420", "0.42"], correct: 0 },
    ];
    return mcSpeedGame("decimal", title, "Move the Point!", "¡Mueve el punto!", rounds, {
      en: "Move the point in the divisor until it is whole — then move it the same in the dividend.",
      es: "Muevan el punto del divisor hasta que sea entero, y muévanlo igual en el dividendo.",
    });
  }

  if (op === "multiply") {
    // Checked: 3×2=6 with 2 places → 0.06; 15×4=60 with 1 place → 6;
    // 2.5×0.06 has 1+2 = 3 places; 7×8=56 with 1 place → 5.6.
    const rounds = [
      { q: "0.3 × 0.2 = ?", choices: ["0.06", "0.6", "6", "0.006"], correct: 0 },
      { q: "1.5 × 4 = ?", choices: ["6", "0.6", "60", "5.5"], correct: 0 },
      {
        q: "How many decimal places in 2.5 × 0.06?",
        choices: ["3", "2", "1", "0"],
        correct: 0,
      },
      { q: "0.7 × 8 = ?", choices: ["5.6", "56", "0.56", "5.06"], correct: 0 },
    ];
    return mcSpeedGame("decimal", title, "Count the Places!", "¡Cuenta las cifras!", rounds, {
      en: "Multiply as whole numbers, then count the decimal places in BOTH factors.",
      es: "Multipliquen como enteros y cuenten las cifras decimales de LOS DOS factores.",
    });
  }

  const rounds = [
    { q: "1.5 + 2.3 = ?", choices: ["3.8", "3.5", "4.8", "2.8"], correct: 0 },
    { q: "0.6 × 10 = ?", choices: ["6", "0.06", "60", "1.6"], correct: 0 },
    {
      q: "Line up…",
      choices: ["Decimal points", "Ones digits only", "Random columns", "Nothing"],
      correct: 0,
    },
    { q: "4.2 − 1.8 = ?", choices: ["2.4", "6.0", "3.4", "1.4"], correct: 0 },
  ];
  return mcSpeedGame("decimal", title, "Decimal Dash!", "¡Decimales!", rounds, {
    en: "Line up decimal points before adding or subtracting.",
    es: "Alineen los puntos decimales antes de sumar o restar.",
  });
}

function buildFactorGame(_config, { title }) {
  const rounds = [
    { q: "Prime number?", choices: ["7", "6", "9", "12"], correct: 0 },
    { q: "GCF of 12 and 18?", choices: ["6", "3", "36", "2"], correct: 0 },
    { q: "LCM of 4 and 6?", choices: ["12", "24", "2", "10"], correct: 0 },
    { q: "24 = 2³ × ?", choices: ["3", "4", "6", "8"], correct: 0 },
  ];
  return mcSpeedGame("factor", title, "Factor Tree!", "¡Factores!", rounds, {
    en: "Break numbers apart until only primes remain.",
    es: "Descompongan hasta que solo queden primos.",
  });
}

function buildVocabMatchGame(_config, { vocab, title }) {
  const rounds =
    vocab.length >= 3
      ? vocab.slice(0, 4).map((v) => {
          const defs = vocab.map((x) => x.definition).filter(Boolean);
          const wrong = defs.filter((d) => d !== v.definition).slice(0, 3);
          const choices = seededShuffle([v.definition, ...wrong], v.term);
          return {
            q: `What does "${v.term}" mean?`,
            choices,
            correct: choices.indexOf(v.definition),
          };
        })
      : [
          {
            q: "What are we learning tonight?",
            choices: [title, "Addition only", "Spelling", "History"],
            correct: 0,
          },
          {
            q: "Math vocabulary helps us…",
            choices: ["Explain thinking", "Skip work", "Avoid numbers", "Guess"],
            correct: 0,
          },
          {
            q: "Work together means…",
            choices: ["Student thinks first", "Parent does all", "Copy answers", "Skip steps"],
            correct: 0,
          },
        ];
  return mcSpeedGame("vocab", title, "Word Match!", "¡Palabras!", rounds, {
    en: "Use tonight's vocabulary words as you play!",
    es: "¡Usen las palabras del vocabulario de hoy mientras juegan!",
  });
}

function _shuffleChoices(correct, pool) {
  const wrong = pool.filter((p) => p !== correct).slice(0, 3);
  const all = seededShuffle([correct, ...wrong], String(correct));
  return all;
}

/* Every round above is authored with its answer first, and the Play-tab runtime
 * renders `choices` in the order it is given — so before this shuffle the first
 * button was the right one in every round of every family game, and a student
 * could clear the game without reading a question. That is the same answer-
 * position bias already fixed across the lesson fleet; the family homework was
 * the surface it missed. Seeded from the round's own content, so the order is
 * stable across builds and a no-op regeneration does not churn 84 files. */
function shuffleChoices(round, seedKey) {
  if (!Array.isArray(round.choices) || round.choices.length < 2) return round;
  return { ...round, choices: seededShuffle(round.choices, `${seedKey}|${round.q}`) };
}

function mcSpeedGame(id, _title, nameEn, nameEs, rounds, coach) {
  const normalized = rounds
    .map((r) => {
      if (Array.isArray(r.choices) && typeof r.choices[0] === "string") {
        return {
          q: r.q,
          choices: r.choices.map((t, i) => ({ text: t, isCorrect: i === r.correct })),
          hint: r.hint || "",
        };
      }
      // `correct` is a positional index; once the choices move it is a lie, so
      // the flag has to be on the choice itself before anything is shuffled.
      if (Array.isArray(r.choices) && typeof r.correct === "number") {
        const { correct, ...rest } = r;
        return {
          ...rest,
          choices: r.choices.map((c, i) => ({ ...c, isCorrect: c.isCorrect || i === correct })),
        };
      }
      return r;
    })
    .map((r) => shuffleChoices(r, id));
  const data = JSON.stringify(normalized).replace(/'/g, "&#39;");
  return {
    type: "mc-speed",
    html: `
      <div class="hw-game hw-game-mc" id="hw_game_${id}" data-game-type="mc-speed" data-rounds='${data.replace(/&/g, "&amp;")}'>
        <div class="hw-game-header">
          <h3 class="hw-game-title">${esc(nameEn)} <span lang="es">${esc(nameEs)}</span></h3>
          <p class="hw-game-coach bilingual-block">
            <span class="lang-en">🎮 Play together! ${esc(coach.en)}</span>
            <span class="lang-es" lang="es">🎮 ¡Jueguen juntos! ${esc(coach.es)}</span>
          </p>
        </div>
        <div class="hw-game-score" id="hw_game_score">Round 1 / Ronda 1</div>
        <p class="hw-game-question" id="hw_game_question"></p>
        <div class="hw-game-choices" id="hw_game_choices" role="group"></div>
        <p class="hw-game-feedback" id="hw_game_feedback" role="status" aria-live="polite"></p>
        <button type="button" class="btn btn-primary hw-game-restart" id="hw_game_restart" hidden>Play again / Jugar otra vez</button>
      </div>`,
    initScript: "",
  };
}

function dragBucketGame(id, _title, nameEn, nameEs, items, buckets, coach) {
  const shuffled = seededShuffle(items, id);
  const data = JSON.stringify(shuffled).replace(/'/g, "&#39;");
  return {
    type: "drag-bucket",
    html: `
      <div class="hw-game hw-game-sort" id="hw_game_${id}" data-game-type="drag-bucket" data-items='${data.replace(/&/g, "&amp;")}'>
        <div class="hw-game-header">
          <h3 class="hw-game-title">${esc(nameEn)} <span lang="es">${esc(nameEs)}</span></h3>
          <p class="hw-game-coach bilingual-block">
            <span class="lang-en">🎮 Play together! ${esc(coach.en)}</span>
            <span class="lang-es" lang="es">🎮 ¡Jueguen juntos! ${esc(coach.es)}</span>
          </p>
        </div>
        <div class="hw-game-buckets">
          ${Object.entries(buckets)
            .map(
              ([key, labels]) => `
            <div class="hw-game-bucket" data-bucket="${esc(key)}" ondragover="hwGameAllowDrop(event)" ondrop="hwGameDrop(event,'${esc(key)}')">
              <div class="hw-game-bucket-label">${esc(labels.en)} / <span lang="es">${esc(labels.es)}</span></div>
              <div class="hw-game-bucket-slots" id="bucket_${esc(key)}"></div>
            </div>`,
            )
            .join("")}
        </div>
        <div class="hw-game-pile" id="hw_game_pile" ondragover="hwGameAllowDrop(event)" ondrop="hwGameDrop(event,'')">
          ${shuffled
            .map(
              (it, i) => `
            <div class="hw-game-card" draggable="true" id="hwcard_${i}" data-bucket="${esc(it.bucket)}"
                 ondragstart="hwGameDragStart(event)" onclick="hwGameTapCard(this)">
              ${esc(it.text)}
            </div>`,
            )
            .join("")}
        </div>
        <button type="button" class="btn btn-primary" onclick="hwGameCheckSort()">Check sort / Verificar</button>
        <p class="hw-game-feedback" id="hw_game_feedback" role="status" aria-live="polite"></p>
      </div>`,
    initScript: "",
  };
}

export function renderPlayTab(config) {
  const game = buildHomeworkGame(config);
  return `
    <section class="guided-section card section-play" aria-label="Play together game">
      <h2 class="section-title">🎮 Play together / Juguemos juntos</h2>
      <p class="bilingual-block play-intro">
        <span class="lang-en">Reinforce tonight's topic with a quick family game. You ask; your student decides!</span>
        <span class="lang-es" lang="es">Refuercen el tema de hoy con un juego rápido en familia. ¡Ustedes preguntan; su estudiante decide!</span>
      </p>
      ${game.html}
    </section>`;
}

export const HOMEWORK_GAME_JS = `
let hwGameRound = 0;
let hwGameScore = 0;
let hwGameRounds = [];
let hwGameSelectedCard = null;

function initHomeworkGame() {
  const mc = document.querySelector('.hw-game-mc[data-rounds]');
  if (mc && !mc.dataset.initialized) {
    mc.dataset.initialized = '1';
    try { hwGameRounds = JSON.parse(mc.dataset.rounds || '[]'); } catch(e) { hwGameRounds = []; }
    hwGameRound = 0; hwGameScore = 0;
    hwGameShowRound();
  }
}

function hwGameShowRound() {
  const qEl = document.getElementById('hw_game_question');
  const cEl = document.getElementById('hw_game_choices');
  const sEl = document.getElementById('hw_game_score');
  const fEl = document.getElementById('hw_game_feedback');
  const rBtn = document.getElementById('hw_game_restart');
  if (!qEl || !cEl || !hwGameRounds.length) return;
  if (hwGameRound >= hwGameRounds.length) {
    qEl.textContent = '';
    cEl.innerHTML = '';
    if (sEl) sEl.textContent = 'Score: ' + hwGameScore + '/' + hwGameRounds.length;
    if (fEl) {
      fEl.textContent = hwGameScore === hwGameRounds.length
        ? '🎉 Perfect! / ¡Perfecto!' : 'Nice work! / ¡Buen trabajo!';
      fEl.className = 'hw-game-feedback success';
    }
    if (rBtn) rBtn.hidden = false;
    if (typeof triggerCelebration === 'function') triggerCelebration();
    return;
  }
  const round = hwGameRounds[hwGameRound];
  if (sEl) sEl.textContent = 'Round ' + (hwGameRound + 1) + ' / Ronda ' + (hwGameRound + 1);
  qEl.textContent = round.q || '';
  cEl.innerHTML = '';
  if (fEl) { fEl.textContent = round.hint ? '💡 ' + round.hint : ''; fEl.className = 'hw-game-feedback'; }
  (round.choices || []).forEach((ch, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hw-game-choice-btn';
    btn.textContent = ch.text || ch;
    btn.onclick = function() {
      const ok = ch.isCorrect || (round.correct === idx);
      if (ok) { hwGameScore++; btn.classList.add('correct'); }
      else btn.classList.add('incorrect');
      setTimeout(function() { hwGameRound++; hwGameShowRound(); }, 600);
    };
    cEl.appendChild(btn);
  });
}

document.getElementById('hw_game_restart')?.addEventListener('click', function() {
  hwGameRound = 0; hwGameScore = 0;
  const mc = document.querySelector('.hw-game-mc[data-rounds]');
  if (mc) mc.dataset.initialized = '';
  this.hidden = true;
  initHomeworkGame();
});

function hwGameDragStart(ev) {
  ev.dataTransfer.setData('text/plain', ev.target.id);
  hwGameSelectedCard = ev.target;
}
function hwGameAllowDrop(ev) { ev.preventDefault(); }
function hwGameDrop(ev, bucket) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData('text/plain');
  let card = document.getElementById(id);
  if (!card && hwGameSelectedCard) card = hwGameSelectedCard;
  if (!card) return;
  let target = ev.currentTarget;
  if (target.classList.contains('hw-game-bucket-slots') || target.id === 'hw_game_pile') {
    target.appendChild(card);
  } else if (bucket) {
    const slots = document.getElementById('bucket_' + bucket);
    if (slots) slots.appendChild(card);
  } else {
    document.getElementById('hw_game_pile')?.appendChild(card);
  }
  hwGameSelectedCard = null;
}
function hwGameTapCard(card) {
  if (hwGameSelectedCard === card) { card.style.outline = ''; hwGameSelectedCard = null; return; }
  if (hwGameSelectedCard) hwGameSelectedCard.style.outline = '';
  hwGameSelectedCard = card;
  card.style.outline = '3px solid var(--teal)';
}
document.querySelectorAll('.hw-game-bucket, #hw_game_pile').forEach(function(zone) {
  zone.addEventListener('click', function() {
    if (!hwGameSelectedCard) return;
    if (zone.classList.contains('hw-game-bucket')) {
      const slots = zone.querySelector('.hw-game-bucket-slots');
      if (slots) slots.appendChild(hwGameSelectedCard);
    } else zone.appendChild(hwGameSelectedCard);
    hwGameSelectedCard.style.outline = '';
    hwGameSelectedCard = null;
  });
});
function hwGameCheckSort() {
  const fEl = document.getElementById('hw_game_feedback');
  let ok = true;
  document.querySelectorAll('.hw-game-card').forEach(function(card) {
    const parent = card.closest('.hw-game-bucket-slots');
    const bucket = parent ? parent.id.replace('bucket_', '') : '';
    if (bucket !== card.dataset.bucket) ok = false;
  });
  if (fEl) {
    fEl.textContent = ok ? '🎉 All sorted! / ¡Todo clasificado!' : 'Try again — some cards are in the wrong bucket. / Intenten otra vez.';
    fEl.className = 'hw-game-feedback ' + (ok ? 'success' : 'error');
  }
  if (ok && typeof triggerCelebration === 'function') triggerCelebration();
}
`;
