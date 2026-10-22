// Sentence frames for the Fluency Lab language layer, one bank for every surface (explain card, trail, games).
// Four support levels use the same four-part language work (notice, explain, compare, check, plus fix after a
// slip) and differ only in how much of the sentence the learner is given. Frames hold no numbers and no
// mathematical claims, so a frame can never state an answer. "___" marks a blank the learner fills.
export const LEVELS = [
  {
    id: 1,
    name: "Starter",
    blurb:
      "Pick words and finish a short sentence. You can point, draw, or start in your home language.",
  },
  { id: 2, name: "Building", blurb: "Finish sentences that have two blanks and a joining word." },
  { id: 3, name: "Growing", blurb: "Start from a sentence beginning and add your own ideas." },
  {
    id: 4,
    name: "On my own",
    blurb: "Answer a question in your own words. Starters are there if you want one.",
  },
];
export const DEFAULT_LEVEL = 2;
export const levelById = (id) =>
  LEVELS.find((level) => level.id === Number(id)) || LEVELS[DEFAULT_LEVEL - 1];

export const FUNCTIONS = [
  { id: "notice", en: "Notice", es: "Observar" },
  { id: "explain", en: "Explain", es: "Explicar" },
  { id: "compare", en: "Compare", es: "Comparar" },
  { id: "check", en: "Check", es: "Comprobar" },
  { id: "fix", en: "Fix it", es: "Corregir" },
];

// [English, Español]. Level 1 has no "compare"; its learners practice notice, explain, check and fix first.
const FRAMES = {
  1: {
    notice: [["I see ___.", "Veo ___."]],
    explain: [["I ___.", "Yo ___."]],
    check: [["I can check ___.", "Puedo comprobar ___."]],
    fix: [["I made a mistake with ___.", "Me equivoqué con ___."]],
  },
  2: {
    notice: [["I notice ___ and ___.", "Noto ___ y ___."]],
    explain: [
      ["First I ___. Then I ___.", "Primero ___. Luego ___."],
      ["I ___ because ___.", "Yo ___ porque ___."],
    ],
    compare: [
      [
        "Another way is ___. Both ways show ___.",
        "Otra manera es ___. Las dos maneras muestran ___.",
      ],
    ],
    check: [
      [
        "I can check by ___. My check shows ___.",
        "Puedo comprobarlo con ___. Mi comprobación muestra ___.",
      ],
    ],
    fix: [
      [
        "My mistake was ___. Next time I will ___.",
        "Mi error fue ___. La próxima vez voy a ___.",
      ],
    ],
  },
  3: {
    notice: [
      [
        "I noticed that ___, which tells me ___.",
        "Me di cuenta de que ___, lo cual me dice que ___.",
      ],
    ],
    explain: [
      [
        "To solve this, I started by ___. Then ___, so ___.",
        "Para resolverlo, empecé por ___. Luego ___, así que ___.",
      ],
    ],
    compare: [
      [
        "One way is ___, but another way is ___. I prefer ___ because ___.",
        "Una manera es ___, pero otra manera es ___. Prefiero ___ porque ___.",
      ],
    ],
    check: [
      [
        "I know my answer makes sense because ___.",
        "Sé que mi respuesta tiene sentido porque ___.",
      ],
    ],
    fix: [
      [
        "At first I thought ___, but then I realized ___.",
        "Al principio pensé que ___, pero luego me di cuenta de que ___.",
      ],
    ],
  },
};

// Level 4 asks the question and gives the Level 3 starters only on request.
const PROMPTS = {
  notice: [
    "What do you notice about the numbers, the picture, or the question?",
    "¿Qué notas en los números, en el dibujo o en la pregunta?",
  ],
  explain: [
    "Explain how you solved it and why your method works. Use at least two math words and a reason.",
    "Explica cómo lo resolviste y por qué funciona tu método. Usa al menos dos palabras de matemáticas y una razón.",
  ],
  compare: [
    "Describe a different way to solve it and say how the two ways are alike.",
    "Describe otra manera de resolverlo y di en qué se parecen las dos maneras.",
  ],
  check: [
    "How do you know your answer makes sense? Show a way to check it.",
    "¿Cómo sabes que tu respuesta tiene sentido? Muestra una forma de comprobarla.",
  ],
  fix: [
    "What went wrong, and what will you do differently next time?",
    "¿Qué salió mal y qué harás diferente la próxima vez?",
  ],
};

// Joining words, offered as chips from Level 2 up.
export const CONNECTORS = [
  ["first", "primero"],
  ["next", "después"],
  ["then", "luego"],
  ["finally", "finalmente"],
  ["because", "porque"],
  ["so", "entonces"],
  ["since", "ya que"],
  ["for example", "por ejemplo"],
  ["another way", "otra manera"],
  ["however", "sin embargo"],
];

const pair = ([en, es]) => ({ en, es });
export const functionsFor = (level) =>
  FUNCTIONS.filter((fn) => fn.id !== "compare" || Number(level) >= 2);
export const framesFor = (level, fn) => (FRAMES[Math.min(3, Number(level))]?.[fn] || []).map(pair);
export const promptFor = (fn) => pair(PROMPTS[fn] || PROMPTS.explain);
export const connectors = () => CONNECTORS.map(pair);
export const blanks = (text) => (String(text).match(/___/g) || []).length;

// After a correct answer the card opens on a different move each time so a learner practices all four;
// after a miss it opens on "fix it".
export function startingFunction({ correct, count = 0 }) {
  if (!correct) return "fix";
  return ["explain", "notice", "check", "compare"][Math.abs(Number(count) || 0) % 4];
}
