// Ten fake games with realistic skills and seconds-per-round, used by the non-game logic tests (inventory, recommend,
// session, coach). They honor the real game contract (validateGame passes) but do no real math, so the logic layer is
// proven without depending on the ten real games. @fm2 FM-065
const DEFS = [
  {
    id: "number-builder",
    order: 1,
    mechanic: "snap place-value pieces onto a board",
    spr: 40,
    tag: "NBT",
    name: "Build numbers",
    nameEs: "Construir números",
    strands: [
      ["Place value", "Valor posicional"],
      ["Counting", "Conteo"],
    ],
  },
  {
    id: "math-match",
    order: 2,
    mechanic: "flip cards to match equal expressions",
    spr: 30,
    tag: "OA",
    name: "Match facts",
    nameEs: "Emparejar operaciones",
    strands: [
      ["Addition and subtraction", "Suma y resta"],
      ["Multiplication and division", "Multiplicación y división"],
    ],
  },
  {
    id: "fraction-kitchen",
    order: 3,
    mechanic: "measure and pour recipe fractions",
    spr: 45,
    tag: "NF",
    name: "Fraction recipes",
    nameEs: "Recetas con fracciones",
    strands: [
      ["Fractions", "Fracciones"],
      ["Decimals", "Decimales"],
    ],
  },
  {
    id: "math-market",
    order: 4,
    mechanic: "run a shop with coins and change",
    spr: 35,
    tag: "MD",
    name: "Market money",
    nameEs: "Dinero del mercado",
    strands: [
      ["Money", "Dinero"],
      ["Data", "Datos"],
    ],
  },
  {
    id: "array-architect",
    order: 5,
    mechanic: "build rectangular arrays and areas",
    spr: 50,
    tag: "OA",
    name: "Array builder",
    nameEs: "Constructor de arreglos",
    strands: [
      ["Multiplication and division", "Multiplicación y división"],
      ["Geometry and measurement", "Geometría y medición"],
    ],
  },
  {
    id: "number-line-quest",
    order: 6,
    mechanic: "place points on a sliding number line",
    spr: 30,
    tag: "NS",
    name: "Number line",
    nameEs: "Recta numérica",
    strands: [
      ["Number line", "Recta numérica"],
      ["Integers", "Enteros"],
    ],
  },
  {
    id: "pattern-detective",
    order: 7,
    mechanic: "extend and explain growing patterns",
    spr: 40,
    tag: "EE",
    name: "Pattern clues",
    nameEs: "Pistas de patrones",
    strands: [
      ["Patterns and algebra", "Patrones y álgebra"],
      ["Equations", "Ecuaciones"],
    ],
  },
  {
    id: "ratio-recipe-lab",
    order: 8,
    mechanic: "scale ratio tables with double number lines",
    spr: 55,
    tag: "RP",
    name: "Ratio recipes",
    nameEs: "Recetas de razones",
    strands: [
      ["Ratios and percents", "Razones y porcentajes"],
      ["Decimals", "Decimales"],
    ],
  },
  {
    id: "math-puzzle-studio",
    order: 9,
    mechanic: "balance equations on a scale",
    spr: 60,
    tag: "EE",
    name: "Balance puzzles",
    nameEs: "Acertijos de balanza",
    strands: [
      ["Equations", "Ecuaciones"],
      ["Patterns and algebra", "Patrones y álgebra"],
    ],
  },
  {
    id: "family-math-duel",
    order: 10,
    mechanic: "head-to-head duel with shared question cards",
    spr: 45,
    tag: "MP",
    name: "Family duel",
    nameEs: "Duelo en familia",
    strands: [
      ["Addition and subtraction", "Suma y resta"],
      ["Ratios and percents", "Razones y porcentajes"],
    ],
  },
];

const SPANS = [
  ["early", [0, 2], "Warm-up", "Calentamiento"],
  ["mid", [3, 5], "Practice", "Práctica"],
  ["late", [6, 8], "Challenge", "Reto"],
  ["bridge", [2, 6], "Bridge", "Puente"],
];

function buildGame(def) {
  const std = (grade) => `${grade === 0 ? "K" : grade}.${def.tag}.A.1`;
  const skills = [];
  for (let g = 0; g <= 8; g += 1) {
    skills.push({
      id: `${def.id}-g${g}`,
      strand: { en: def.strands[g % 2][0], es: def.strands[g % 2][1] },
      title: { en: `${def.name}, grade ${g}`, es: `${def.nameEs}, grado ${g}` },
      grades: [g, g],
      standard: std(g),
      labSkill: `${g}:${def.id}`,
    });
  }
  for (const [name, grades, en, es] of SPANS) {
    skills.push({
      id: `${def.id}-${name}`,
      strand: { en: def.strands[0][0], es: def.strands[0][1] },
      title: { en: `${def.name}: ${en}`, es: `${def.nameEs}: ${es}` },
      grades,
      standard: std(grades[0]),
    });
  }
  return {
    id: def.id,
    mechanic: def.mechanic,
    order: def.order,
    title: { en: def.name, es: def.nameEs },
    tagline: { en: `${def.name} for the whole family`, es: `${def.nameEs} para toda la familia` },
    howTo: {
      en: ["Look at the question.", "Do the work on the board.", "Check and go on."],
      es: ["Mira la pregunta.", "Haz el trabajo en el tablero.", "Revisa y sigue."],
    },
    icon: "<svg viewBox='0 0 1 1' aria-hidden='true'></svg>",
    secPerRound: def.spr,
    together: { en: "Take turns and explain.", es: "Túrnense y expliquen." },
    cssHref: "game.css",
    skills,
    makeRound: (_skillId, _level, rng) => {
      const a = Math.floor(rng() * 9) + 1;
      const b = Math.floor(rng() * 9) + 1;
      return { a, b, prompt: { en: `${a} + ${b}?`, es: `¿${a} + ${b}?` } };
    },
    check: (round, response) =>
      response === round.a + round.b
        ? { correct: true, feedback: { en: "Yes.", es: "Sí." } }
        : { correct: false, feedback: { en: "Add again.", es: "Suma otra vez." } },
    hint: (_round, tier) => ({ en: `hint ${tier}`, es: `pista ${tier}` }),
    solve: (round) => round.a + round.b,
    answerText: (round) => String(round.a + round.b),
    mount: () => ({ destroy() {}, setLang() {} }),
  };
}

export const makeFakeGames = () => DEFS.map(buildGame);
export const FAKE_GAMES = makeFakeGames();
export const FAKE_SEC = Object.fromEntries(DEFS.map((d) => [d.id, d.spr]));
export const gamesById = (games) => Object.fromEntries(games.map((g) => [g.id, g]));
export const subset = (games, ids) => games.filter((g) => ids.includes(g.id));
