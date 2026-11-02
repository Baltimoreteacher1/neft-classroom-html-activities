// Instruction engine (Enterprise 8, Phase 6C/6D): turns a checked bank item into a five-layer explanation, discussion
// prompts and language supports, and turns wrong answers into evidence-based misconception diagnosis and a targeted
// intervention plan. Everything is built from what the item's author wrote and from the misconception library; nothing is
// invented at run time. A diagnosis is a pointer ("possible", "likely"), never a label for a child, and a learner who
// ticks their own rubric is never counted as having demonstrated reasoning.
import { MISCONCEPTIONS, misconceptionById } from "./misconception-library.js";
import {
  activePatterns,
  misconceptionStatus,
  recordDiagnosis,
} from "./misconception-engine.js";

const bi = (en, es) => ({ en, es });
export const LAYERS = Object.freeze([
  "answer",
  "steps",
  "why",
  "picture",
  "another-way",
]);

// Which MathVisualEngine model best shows a representation (used for the "See it" layer when an item has no model of its own).
export const MODEL_FOR_REPRESENTATION = Object.freeze({
  "number-line": "numberLine",
  "base-ten": "baseTen",
  "fraction-model": "fractionBar",
  tape: "tapeRatio",
  "double-number-line": "tapeRatio",
  "ratio-table": "tapeRatio",
  balance: "balanceScale",
  tiles: "algebraTiles",
  graph: "coordinatePlane",
  "coordinate-plane": "coordinatePlane",
  "area-model": "areaMultiply",
  array: "areaMultiply",
  "data-display": "dotPlot",
});

const PICTURE_PROMPT = {
  number: bi(
    "Show the number with objects, a number line or base-ten blocks. Does the picture match your answer?",
    "Muestra el número con objetos, una recta numérica o bloques de base diez. ¿La imagen coincide con tu respuesta?",
  ),
  picture: bi(
    "Look at the picture again. Point to the part that matches each number in your answer.",
    "Mira la imagen otra vez. Señala la parte que corresponde a cada número de tu respuesta.",
  ),
  words: bi(
    "Draw the story. Label what each number means in the picture.",
    "Dibuja la historia. Rotula qué significa cada número en la imagen.",
  ),
  equation: bi(
    "Draw a tape or a balance for the equation. What stays equal?",
    "Dibuja una cinta o una balanza para la ecuación. ¿Qué se mantiene igual?",
  ),
  table: bi(
    "Fill in one more row of the table. Does the pattern keep going?",
    "Completa una fila más de la tabla. ¿El patrón sigue?",
  ),
};
const picturePrompt = (item) =>
  PICTURE_PROMPT[item.representation] || PICTURE_PROMPT.words;

const ANOTHER_WAY = {
  numeric: bi(
    "Check with the opposite operation, or estimate first and see if your answer is close.",
    "Comprueba con la operación contraria, o estima primero y mira si tu respuesta se acerca.",
  ),
  fraction: bi(
    "Check with a picture of the parts, or turn it into a decimal and compare.",
    "Comprueba con un dibujo de las partes, o conviértelo en decimal y compara.",
  ),
  equation: bi(
    "Put your answer back in the equation. Do both sides match?",
    "Pon tu respuesta en la ecuación. ¿Los dos lados coinciden?",
  ),
  expression: bi(
    "Try two different numbers in both expressions. Do they always match?",
    "Prueba dos números distintos en ambas expresiones. ¿Siempre coinciden?",
  ),
  mc: bi(
    "Cover the choices and solve first. Then find your answer and say why each other choice does not fit.",
    "Tapa las opciones y resuelve primero. Luego busca tu respuesta y di por qué las otras no encajan.",
  ),
  application: bi(
    "Say the answer in a full sentence with its unit. Does it make sense for the story?",
    "Di la respuesta en una oración completa con su unidad. ¿Tiene sentido en la historia?",
  ),
  error: bi(
    "Fix the step, then redo the whole problem from there. Do you get the same answer?",
    "Corrige el paso y rehaz el problema desde ahí. ¿Obtienes la misma respuesta?",
  ),
};
const anotherWay = (item) =>
  ANOTHER_WAY[item.type] ||
  bi(
    "Solve it a second way and compare the answers.",
    "Resuélvelo de otra manera y compara las respuestas.",
  );

// The five layers, each bilingual. `result` is optional: with it, the answer layer speaks to what the learner did.
export function buildExplanation(item, result = null) {
  const steps = item.solution?.steps || [];
  const tagged = (item.misconceptions || [])
    .map(misconceptionById)
    .filter(Boolean);
  const idea = tagged[0]?.idea;
  const layers = [
    {
      id: "answer",
      title: bi("The answer", "La respuesta"),
      body: bi(steps.at(-1) || "", item.solution?.es || ""),
      tone: result?.correct
        ? "confirm"
        : result?.status === "incorrect"
          ? "retry"
          : "neutral",
    },
    {
      id: "steps",
      title: bi("How it works, step by step", "Cómo funciona, paso a paso"),
      body: bi(steps.join(" "), item.solution?.es || ""),
      steps,
    },
    {
      id: "why",
      title: bi("Why it works", "Por qué funciona"),
      body: idea || bi(item.objective || "", item.solution?.es || ""),
      source: idea ? "misconception-library" : "objective",
    },
    {
      id: "picture",
      title: bi("See it", "Velo"),
      body: picturePrompt(item),
      model:
        item.visual?.model ||
        MODEL_FOR_REPRESENTATION[item.representation] ||
        null,
      params: item.visual?.params || null,
    },
    {
      id: "another-way",
      title: bi("Check it another way", "Compruébalo de otra manera"),
      body: anotherWay(item),
    },
  ];
  // After a wrong answer, name the specific slip the author wrote for that choice, and the library's counter-example.
  const extra = [];
  if (result?.why)
    extra.push({
      id: "slip",
      title: bi("What probably happened", "Qué probablemente pasó"),
      body: result.why,
    });
  if (result?.status === "incorrect" && tagged[0]?.counter)
    extra.push({
      id: "counter",
      title: bi("Try this to see it", "Prueba esto para verlo"),
      body: tagged[0].counter,
    });
  return { itemId: item.id, layers, extra };
}

// Discussion prompts by DOK. They ask for reasoning, never for the answer.
const DISCOURSE = {
  1: [
    bi(
      "Tell a partner how you got your answer.",
      "Cuéntale a un compañero cómo obtuviste tu respuesta.",
    ),
    bi("What was the first thing you did?", "¿Qué fue lo primero que hiciste?"),
  ],
  2: [
    bi(
      "Could you solve it a different way? Show the other way.",
      "¿Podrías resolverlo de otra manera? Muestra la otra manera.",
    ),
    bi(
      "What would you change if one number were different?",
      "¿Qué cambiarías si un número fuera distinto?",
    ),
  ],
  3: [
    bi(
      "Convince a partner your answer is right without using the word “because” alone: show a picture or example too.",
      "Convence a un compañero de que tu respuesta es correcta: muestra también un dibujo o un ejemplo.",
    ),
    bi(
      "What would happen if the rule changed? What stays true?",
      "¿Qué pasaría si cambiara la regla? ¿Qué se mantiene cierto?",
    ),
    bi(
      "Is there a case where this does not work? How do you know?",
      "¿Hay un caso en que esto no funcione? ¿Cómo lo sabes?",
    ),
  ],
};
export const discoursePrompts = (item) => DISCOURSE[item.dok] || DISCOURSE[1];

// Language supports for learners who are learning English. The Spanish stem is already on every item; these add a
// sentence frame at the right level, the vocabulary to preview, and a stem split into short chunks for read-aloud.
const FRAMES = {
  1: [bi("I found ___ by ___.", "Encontré ___ al ___.")],
  2: [
    bi(
      "First I ___. Then I ___. My answer is ___.",
      "Primero ___. Luego ___. Mi respuesta es ___.",
    ),
  ],
  3: [
    bi(
      "I think ___ because ___. This works because ___. A different case is ___.",
      "Pienso que ___ porque ___. Esto funciona porque ___. Un caso distinto es ___.",
    ),
  ],
};
export function languageSupports(item) {
  const chunks = String(item.stem?.en || "")
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean);
  const chunksEs = String(item.stem?.es || "")
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean);
  return {
    frames: FRAMES[item.dok] || FRAMES[1],
    vocabulary: item.vocabulary || [],
    chunks: chunks.map((en, i) => bi(en, chunksEs[i] || "")),
    note: bi(
      "Spanish and English show together. Say the answer aloud in either language.",
      "El español y el inglés se muestran juntos. Di la respuesta en voz alta en cualquiera de los dos idiomas.",
    ),
  };
}

// ---------------------------------------------------------------- diagnosis (6D)
// A diagnosis needs two things: the learner picked a choice the author explained with a specific slip, and the item carries
// exactly one tagged misconception, so the pointer is unambiguous. Anything weaker is reported as "no pointer".
export function diagnoseResponse(item, response, result) {
  if (!result || result.status !== "incorrect") return null;
  const tags = (item.misconceptions || []).filter((id) =>
    misconceptionById(id),
  );
  if (tags.length !== 1) return null;
  if (item.type === "mc") {
    const choice = item.choices?.find((c) => c.id === response);
    if (!choice?.why) return null;
    return {
      id: tags[0],
      basis: "choice-feedback",
      choice: choice.id,
      confidence: "possible",
    };
  }
  if (result.why)
    return { id: tags[0], basis: "authored-feedback", confidence: "possible" };
  return null;
}

// Record a diagnosis in the learner's Enterprise 8 record. One miss is "possible"; the library's own rules decide when it
// becomes likely or persistent (different items, different days). Correct answers are never recorded here.
export function recordItemEvidence(
  e8,
  item,
  response,
  result,
  now = Date.now(),
) {
  const dx = diagnoseResponse(item, response, result);
  if (!dx) return { recorded: false };
  recordDiagnosis(
    e8.misconceptions,
    { id: dx.id, category: "conceptual" },
    { sig: item.id, skillKey: item.skill || null, now },
  );
  return {
    recorded: true,
    diagnosis: dx,
    status: misconceptionStatus(e8.misconceptions.items[dx.id]),
  };
}

// ---------------------------------------------------------------- intervention
// A short, ordered plan for each active pattern: look at it, see the picture, contrast with the right idea, practice with
// items the author tagged for this very slip, then re-check later. Practice items come from the bank, never from guesses.
export function interventionPlan(
  e8,
  { bank = [], grade = null, now = Date.now(), limit = 3 } = {},
) {
  return activePatterns(e8.misconceptions, { includePossible: false })
    .slice(0, limit)
    .map((p) => {
      const info = p.info;
      const practice = bank
        .filter(
          (it) =>
            (grade === null || it.grade === Number(grade)) &&
            it.misconceptions?.includes(p.id),
        )
        .slice(0, 4)
        .map((it) => it.id);
      return {
        id: p.id,
        status: p.status,
        title: info.title,
        models: info.models,
        steps: [
          {
            id: "notice",
            text: bi(
              `What happens: ${info.does.en}`,
              `Qué pasa: ${info.does.es}`,
            ),
          },
          {
            id: "see",
            text: bi(
              `Look at it with a model: ${info.counter.en}`,
              `Míralo con un modelo: ${info.counter.es}`,
            ),
          },
          {
            id: "idea",
            text: bi(
              `The idea to keep: ${info.idea.en}`,
              `La idea que hay que conservar: ${info.idea.es}`,
            ),
          },
          {
            id: "practice",
            text: bi(
              practice.length
                ? "Try these items made for this idea."
                : "Practice with a few skills built on this idea.",
              practice.length
                ? "Prueba estos ejercicios hechos para esta idea."
                : "Practica con algunas destrezas basadas en esta idea.",
            ),
            items: practice,
            skills: info.skills,
          },
          {
            id: "recheck",
            text: bi(
              "Come back in a few days and try a new one on your own.",
              "Vuelve en unos días e intenta uno nuevo tú solo.",
            ),
          },
        ],
        recheckAfter: now + 3 * 86400000,
      };
    });
}

// What the record can honestly say about whether patterns have been addressed. These are counts, not causes: the lab
// cannot know why a pattern stopped appearing.
export function interventionSummary(e8) {
  const items = Object.entries(e8.misconceptions.items);
  const count = (f) =>
    items.filter(
      ([id, e]) => misconceptionById(id) && f(misconceptionStatus(e)),
    ).length;
  return {
    seen: items.filter(([id]) => misconceptionById(id)).length,
    active: count((s) => s === "likely" || s === "persistent"),
    possible: count((s) => s === "possible"),
    repaired: count((s) => s === "repaired"),
    note: bi(
      "Counts show what the record contains. A pattern that stops appearing is good news, but the lab cannot say what caused it.",
      "Los números muestran lo que contiene el registro. Un patrón que deja de aparecer es buena noticia, pero el laboratorio no puede decir qué lo causó.",
    ),
  };
}

export const MISCONCEPTION_COUNT = MISCONCEPTIONS.length;
