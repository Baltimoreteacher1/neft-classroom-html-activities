/**
 * Guided family notes content + HTML sections for interactive homework.
 * Derives bilingual EN/ES content from lesson config.json fields.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decimalOperation,
  detectVisualTopic,
  selectAlignedQuickCheckProblems,
} from "./homework-alignment.mjs";
import { getExternalResources } from "./homework-external-resources.mjs";
import { renderPlayTab } from "./homework-games.mjs";
import {
  plainObjective,
  polishSpanish,
  spanishKernel,
  spanishKeyIdea,
  translateConceptLine,
  translateFamilyText,
  translateLanguageObjective,
} from "./homework-spanish.mjs";
import { getUnitTheme } from "./homework-themes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const _root = join(__dirname, "..");

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
export const escAttr = esc;

// Lesson folder slugs carry internal variant suffixes ("2-1-flagship",
// "2-1-group1", "2-1-catchup"). Those are build/routing details — families
// should only ever see the lesson number, so strip the suffix for any
// human-facing label. The raw id still drives URLs, storage keys, and
// window.LESSON_ID.
export function displayLessonId(lessonId) {
  return String(lessonId ?? "").replace(/-(flagship|group\d+|catchup)$/, "");
}

/**
 * How the page names itself in its title, description and welcome line.
 *
 * A numbered lesson is "Lesson 6-2". A bridge or review lesson is not: it has
 * no place in the numbered spine, and `6-1-6-2-practice` is a folder slug, not
 * something to show a family — "Lesson 6-1-6-2-practice" is worse than saying
 * nothing. Those pages lead with "Review" and let their own title do the
 * naming ("6.1–6.2 · Extra Practice"), which already says which lessons it
 * covers.
 */
export function homeworkPageLabel(lessonId) {
  const id = String(lessonId ?? "");
  return /-(practice|catchup)$/.test(id) ? "Review" : `Lesson ${displayLessonId(id)}`;
}

function firstTurnAndTalk(config) {
  const talks = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  return talks[0] || null;
}

function conceptIntro(config) {
  return config.launch?.conceptIntro || config.explore?.conceptIntro || null;
}

function keyIdea(config) {
  if (config.familyNotes?.bigIdea?.en) return config.familyNotes.bigIdea.en;
  const intro = conceptIntro(config);
  if (intro?.keyIdea) return intro.keyIdea;
  if (intro?.intro) return intro.intro;
  const talk = firstTurnAndTalk(config);
  return talk?.kernel || config.contentObjective || "";
}

function keyIdeaEs(config) {
  if (config.familyNotes?.bigIdea?.es) return config.familyNotes.bigIdea.es;
  return spanishKeyIdea(config);
}

function learningTonight(config) {
  const vocab = config.vocabulary || [];
  const en =
    config.familyNotes?.learningTonight?.en ||
    plainObjective(config.contentObjective) ||
    config.title ||
    "tonight's math idea";
  const es =
    config.familyNotes?.learningTonight?.es ||
    config.contentObjectiveEs ||
    translateFamilyText(config.contentObjective, vocab) ||
    `Practicar: ${config.title || "la lección de hoy"}`;
  return { en, es };
}

function completeSentence(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function splitExplanation(value) {
  const text = completeSentence(value);
  const firstSentence = text.match(/^(.+?[.!?])(?:\s+|$)([\s\S]*)$/);
  if (!firstSentence) return { lead: text, detail: "" };
  return {
    lead: firstSentence[1].trim(),
    detail: firstSentence[2].trim(),
  };
}

const STEP_CUES = [
  { icon: "👀", en: "Start", es: "Empieza" },
  { icon: "🧩", en: "Show it", es: "Muéstralo" },
  { icon: "✏️", en: "Solve", es: "Resuelve" },
  { icon: "✅", en: "Check", es: "Revisa" },
];

function stepCue(index) {
  return STEP_CUES[Math.min(index, STEP_CUES.length - 1)];
}

function renderVocabularyChips(vocab, language) {
  const terms = vocab
    .map((word) => (language === "es" ? word.termEs || word.term : word.term))
    .filter(Boolean);
  if (!terms.length) return "";

  const label = language === "es" ? "Palabras clave" : "Key words";
  return `<div class="learning-words"><span class="learning-words-label">${label}</span><ul class="learning-word-chips" aria-label="${label}">${terms.map((term) => `<li>${esc(term)}</li>`).join("")}</ul></div>`;
}

function _languageTonightEs(config) {
  const vocab = config.vocabulary || [];
  return (
    config.languageObjectiveEs ||
    translateLanguageObjective(config.languageObjective, vocab) ||
    "Usen las palabras del vocabulario al explicar."
  );
}

function buildConceptSteps(config) {
  const intro = conceptIntro(config);
  const custom = config.familyNotes?.conceptSteps;
  if (Array.isArray(custom) && custom.length) return custom;

  const vocab = config.vocabulary || [];
  const lines = [];
  if (intro?.intro) {
    lines.push({
      en: intro.intro,
      es: intro.introEs || polishSpanish(translateConceptLine(intro.intro, vocab), config),
    });
  }
  if (intro?.iDo?.lines) {
    intro.iDo.lines.slice(0, 4).forEach((line, i) => {
      lines.push({
        en: line,
        es: intro.iDo.linesEs?.[i] || polishSpanish(translateConceptLine(line, vocab), config),
      });
    });
  }
  if (lines.length < 2 && intro?.keyIdea) {
    lines.push({ en: intro.keyIdea, es: keyIdeaEs(config) });
  }
  if (lines.length < 2) {
    const talk = firstTurnAndTalk(config);
    if (talk?.kernel) {
      lines.push({
        en: talk.kernel,
        es: spanishKernel(config) || keyIdeaEs(config),
      });
    }
  }
  return lines.slice(0, 4).map((row, idx) => ({
    stepNum: idx + 1,
    en: row.en,
    es: row.es,
  }));
}

function watchForCues(config) {
  const custom = config.familyNotes?.watchFor;
  if (Array.isArray(custom) && custom.length) return custom;

  const vocab = (config.vocabulary || []).slice(0, 3);
  const cues = vocab.map((v) => ({
    icon: "👀",
    en: `Listen for the word "${v.term}" — it means: ${v.definition}`,
    es: `Escucha la palabra "${v.termEs || v.term}" — significa: ${v.definitionEs || v.definition}`,
  }));

  if (cues.length < 2) {
    cues.push({
      icon: "✋",
      en: 'Let your student try first. Ask "What do you notice?" before giving hints.',
      es: 'Deja que tu estudiante intente primero. Pregunta "¿Qué observas?" antes de dar pistas.',
    });
  }
  return cues.slice(0, 3);
}

function togetherStepHints(config, isLast) {
  const topic = detectVisualTopic(config);
  const byTopic = {
    exponents: {
      en: isLast
        ? "Count how many times the base is multiplied — that is the exponent."
        : "Write the repeated multiplication first, then the power.",
      es: isLast
        ? "Cuenten cuántas veces se multiplica la base — eso es el exponente."
        : "Escriban primero la multiplicación repetida, luego la potencia.",
    },
    equations: {
      en: isLast
        ? "Check: does your equation match every word in the clue?"
        : "Name the unknown with a letter before you write symbols.",
      es: isLast
        ? "Verifiquen: ¿su ecuación coincide con cada palabra de la pista?"
        : "Nombren la incógnita con una letra antes de escribir símbolos.",
    },
    inequalities: {
      en: isLast
        ? "Test one value from your shaded region to verify it works."
        : "Open circle for < or >; closed circle for ≤ or ≥.",
      es: isLast
        ? "Prueben un valor de la región sombreada para verificar."
        : "Círculo abierto para < o >; cerrado para ≤ o ≥.",
    },
    ratios: {
      en: isLast
        ? "Both columns must change by the same multiplier."
        : "Point to each row as you compare the two quantities.",
      es: isLast
        ? "Ambas columnas deben cambiar con el mismo multiplicador."
        : "Señalen cada fila mientras comparan las dos cantidades.",
    },
    fractions: {
      en: isLast
        ? "Draw a picture or use a number line to justify your answer."
        : "Say the units out loud — what does each number represent?",
      es: isLast
        ? "Dibujen o usen una recta numérica para justificar."
        : "Digan las unidades en voz alta — ¿qué representa cada número?",
    },
  };
  const pick = byTopic[topic] || {
    en: isLast
      ? "Ask your student to explain why each step makes sense."
      : "Point to each number or symbol as you talk.",
    es: isLast
      ? "Pídele que explique por qué tiene sentido cada paso."
      : "Señalen cada número o símbolo mientras hablan.",
  };
  return pick;
}

function tryTogetherActivity(config) {
  const custom = config.familyNotes?.tryTogether;
  if (custom) return custom;

  const intro = conceptIntro(config);
  const weDo = intro?.weDo;
  const explore = config.explore;
  const narrative = config.launch?.narrative || config.explore?.narrative || "";

  const steps = [];
  const vocab = config.vocabulary || [];
  if (weDo?.lines?.length) {
    weDo.lines.forEach((line, i) => {
      const hints = togetherStepHints(config, i === weDo.lines.length - 1);
      steps.push({
        en: line,
        es: weDo.linesEs?.[i] || translateConceptLine(line, vocab),
        hint: hints.en,
        hintEs: hints.es,
        helpEn: `Simpler: ${line.split(".")[0]}. Take it one phrase at a time.`,
        helpEs: `Más simple: ${translateConceptLine(line.split(".")[0], vocab)}. Vayan frase por frase.`,
      });
    });
  } else if (explore?.instructions) {
    steps.push({
      en: explore.instructions,
      es:
        translateConceptLine(explore.instructions, vocab) ||
        "Completen la tabla o el diagrama juntos, una fila a la vez.",
      hint: "Use pencil and paper if the screen feels crowded.",
      hintEs: "Usen lápiz y papel si la pantalla se siente llena.",
    });
    steps.push({
      en: "Check: did BOTH parts change the same way?",
      es: "Verifiquen: ¿cambiaron AMBAS partes de la misma manera?",
      hint: "This is the big idea of the lesson.",
      hintEs: "Esta es la idea principal de la lección.",
    });
  } else {
    const talk = firstTurnAndTalk(config);
    steps.push({
      en: talk?.question || "Ask your student to explain today's idea using one vocabulary word.",
      es: "Pídele a tu estudiante que explique la idea de hoy usando una palabra del vocabulario.",
      hint: "A complete sentence is enough — perfection is not the goal.",
      hintEs: "Una oración completa es suficiente — no busquen perfección.",
    });
    steps.push({
      en: "Sketch or act out the situation together (measuring cups, blocks, coins — anything at home).",
      es: "Dibujen o actúen la situación juntos (tazas, bloques, monedas — lo que tengan en casa).",
      hint: "Hands-on beats memorizing steps.",
      hintEs: "Hacerlo con las manos es mejor que memorizar pasos.",
    });
  }

  return {
    titleEn: weDo?.title || "Try this together",
    titleEs: weDo?.titleEs || "Inténtenlo juntos",
    scenarioEn: narrative ? narrative.split(".")[0] + "." : "",
    scenarioEs: narrative
      ? translateConceptLine(narrative.split(".")[0], config.vocabulary || []) ||
        "Usen la historia de la lección para conectar la matemática con la vida real."
      : "",
    steps: steps.slice(0, 6),
  };
}

// Compact, graduated practice ladder for the "Try Together" tab: real problems
// drawn from the lesson's practice tiers, ordered EASIEST → HARDEST so families
// build confidence first, then stretch. We only keep problem shapes that compact
// cleanly to a one-line "question → answer" (multiple-choice, open-response) and
// never include "find the error" / error-analysis here.
function ladderCard(prob) {
  if (!prob || typeof prob !== "object") return null;
  if (prob.type === "multiple-choice") {
    const q = prob.stem || prob.question || "";
    if (!q || !Array.isArray(prob.choices) || !Number.isInteger(prob.correctIndex)) return null;
    const a = prob.choices[prob.correctIndex];
    if (a == null) return null;
    // Carry the answer choices through so the ladder can render the options the
    // stem refers to ("Which of the following…?"). Without them the family sees
    // a question with no choices and only the reveal — impossible to answer.
    return {
      q,
      a: String(a),
      choices: prob.choices.map((c) => String(c)),
      correctIndex: prob.correctIndex,
    };
  }
  if (prob.type === "open-response") {
    const q = prob.prompt || prob.question || prob.stem || "";
    if (!q) return null;
    const a = prob.sampleAnswer || prob.answer || prob.exemplar || "";
    return { q, a: String(a) };
  }
  return null;
}

export function buildTogetherLadder(config = {}) {
  const p = config.practice || {};
  // Difficulty ladder: 1★ approaching (scaffolded), 2★ on-level / optional,
  // 3★ extending (stretch). Take a few from each so the set spans easy → hard.
  const tiers = [
    { keys: ["approaching"], stars: "★", labelEn: "Start easy", labelEs: "Empieza fácil", take: 2 },
    {
      keys: ["onLevel", "optional"],
      stars: "★★",
      labelEn: "Keep going",
      labelEs: "Sigan",
      take: 2,
    },
    { keys: ["extending"], stars: "★★★", labelEn: "Challenge", labelEs: "Reto", take: 1 },
  ];

  const ladder = [];
  for (const tier of tiers) {
    let taken = 0;
    for (const key of tier.keys) {
      const arr = Array.isArray(p[key]) ? p[key] : [];
      for (const prob of arr) {
        if (taken >= tier.take) break;
        const card = ladderCard(prob);
        if (!card) continue;
        if (ladder.some((x) => x.q === card.q)) continue;
        ladder.push({ ...card, stars: tier.stars, tierEn: tier.labelEn, tierEs: tier.labelEs });
        taken += 1;
      }
    }
  }
  return ladder;
}

function stuckTips(config) {
  const custom = config.familyNotes?.stuckTips;
  if (custom) return custom;

  const topic = detectVisualTopic(config);

  const tipsByTopic = {
    ratios: {
      say: [
        {
          en: "Let's make a ratio table. How do we get from the first batch to the second?",
          es: "Hagamos una tabla de razones. ¿Cómo pasamos de la primera tanda a la segunda?",
        },
        {
          en: "If we double one ingredient, what must we do to the other to keep the taste the same?",
          es: "Si duplicamos un ingrediente, ¿qué debemos hacer al otro para mantener el mismo sabor?",
        },
        {
          en: "Are we multiplying or dividing both numbers by the same value?",
          es: "¿Estamos multiplicando o dividiendo ambos números por el mismo valor?",
        },
      ],
      dontSay: [
        {
          en: "Just add the same number to both columns.",
          es: "Solo suma el mismo número a ambas columnas.",
        },
        {
          en: "Cross multiply and divide.",
          es: "Multiplica en cruz y divide.",
        },
        {
          en: "Don't write down the units, they don't matter.",
          es: "No escribas las unidades, no importan.",
        },
      ],
    },
    exponents: {
      say: [
        {
          en: "Remember, 3⁴ means 3 is multiplied 4 times: 3 × 3 × 3 × 3. What is the base?",
          es: "Recuerda, 3⁴ significa que 3 se multiplica 4 veces: 3 × 3 × 3 × 3. ¿Cuál es la base?",
        },
        {
          en: "Let's write it out as a multiplication chain first.",
          es: "Escribámoslo como una cadena de multiplicación primero.",
        },
        {
          en: "How does the exponent compare to adding 3 four times?",
          es: "¿Cómo se compara el exponente con sumar 3 cuatro veces?",
        },
      ],
      dontSay: [
        {
          en: "3⁴ is just 3 × 4.",
          es: "3⁴ es solo 3 × 4.",
        },
        {
          en: "The exponent is the number you multiply the base by.",
          es: "El exponente es el número por el que multiplicas la base.",
        },
        {
          en: "It doesn't matter what order you multiply.",
          es: "No importa en qué orden multipliques.",
        },
      ],
    },
    equations: {
      say: [
        {
          en: "An equation is like a balanced scale. If we do something to one side, what must we do to the other?",
          es: "Una ecuación es como una balanza equilibrada. Si hacemos algo a un lado, ¿qué debemos hacer al otro?",
        },
        {
          en: "What operation undoes addition? What operation undoes multiplication?",
          es: "¿Qué operación deshace la suma? ¿Qué operación deshace la multiplicación?",
        },
        {
          en: "Let's read the equation like a story: 'some number x plus 5 is 12'. What is the hidden number?",
          es: "Leamos la ecuación como una historia: 'un número x más 5 es 12'. ¿Cuál es el número oculto?",
        },
      ],
      dontSay: [
        {
          en: "Move the number to the other side and change the sign.",
          es: "Mueve el número al otro lado y cambia el signo.",
        },
        {
          en: "Just guess and check until it works.",
          es: "Solo adivina y prueba hasta que funcione.",
        },
        {
          en: "Leave the variable on whatever side it started without balancing.",
          es: "Deja la variable en el lado que comenzó sin equilibrar.",
        },
      ],
    },
    inequalities: {
      say: [
        {
          en: "Does the boundary circle need to be open (not included) or closed (included)?",
          es: "¿El círculo del límite debe estar abierto (no incluido) o cerrado (incluido)?",
        },
        {
          en: "Let's test a number like 0 or 10. Does it make the inequality true?",
          es: "Probemos un número como 0 o 10. ¿Hace que la desigualdad sea verdadera?",
        },
        {
          en: "Which direction should we shade to show all possible answers?",
          es: "¿En qué dirección debemos sombrear para mostrar todas las respuestas posibles?",
        },
      ],
      dontSay: [
        {
          en: "The arrow always points the same way as the inequality sign.",
          es: "La flecha siempre apunta en la misma dirección que el signo de desigualdad.",
        },
        {
          en: "There is only one single correct answer.",
          es: "Solo hay una única respuesta correcta.",
        },
        {
          en: "An inequality is exactly the same as an equation.",
          es: "Una desigualdad es exactamente lo mismo que una ecuación.",
        },
      ],
    },
    expressions: {
      say: [
        {
          en: "What is the difference between a variable (letter) and a coefficient (number multiplied by it)?",
          es: "¿Cuál es la diferencia entre una variable (letra) y un coeficiente (número multiplicado por ella)?",
        },
        {
          en: "Can we group the terms that look alike (like terms)?",
          es: "¿Podemos agrupar los términos que se parecen (términos semejantes)?",
        },
        {
          en: "Let's substitute a number for the variable and evaluate it.",
          es: "Sustituyamos un número en la variable y evaluémoslo.",
        },
      ],
      dontSay: [
        {
          en: "Just combine 3x and 5 to get 8x.",
          es: "Solo combina 3x y 5 para obtener 8x.",
        },
        {
          en: "Solve for x.",
          es: "Resuelve para x.",
        },
        {
          en: "Variables are just placeholder symbols that don't represent values.",
          es: "Las variables son solo símbolos de marcador de posición que no representan valores.",
        },
      ],
    },
    area: {
      say: [
        {
          en: "Let's identify the base and the height. Are they perpendicular (forming a 90-degree L-shape)?",
          es: "Identifiquemos la base y la altura. ¿Son perpendiculares (formando una L de 90 grados)?",
        },
        {
          en: "For a triangle, why do we divide the base × height by 2? How does it relate to a rectangle?",
          es: "Para un triángulo, ¿por qué dividimos la base × altura entre 2? ¿Cómo se relaciona con un rectángulo?",
        },
        {
          en: "Can we decompose this composite shape into smaller rectangles or triangles?",
          es: "¿Podemos descomponer esta figura compuesta en rectángulos o triángulos más pequeños?",
        },
      ],
      dontSay: [
        {
          en: "Use the slanted side as the height.",
          es: "Usa el lado inclinado como la altura.",
        },
        {
          en: "Area is just adding all the sides together.",
          es: "El área es solo sumar todos los lados.",
        },
        {
          en: "You always multiply by 1/2 for every shape.",
          es: "Siempre multiplicas por 1/2 para cada figura.",
        },
      ],
    },
    volume: {
      say: [
        {
          en: "Let's count how many cubes fit in the bottom layer first, then multiply by how many layers tall it is.",
          es: "Contemos cuántos cubos caben en la capa inferior primero, luego multipliquemos por cuántas capas de altura tiene.",
        },
        {
          en: "Volume is the space inside. How does base area relate to the length × width?",
          es: "El volumen es el espacio interior. ¿Cómo se relaciona el área de la base con el largo × ancho?",
        },
        {
          en: "What units do we use for volume? (Cubic units like in³).",
          es: "¿Qué unidades usamos para el volumen? (Unidades cúbicas como in³).",
        },
      ],
      dontSay: [
        {
          en: "Just add length, width, and height.",
          es: "Solo suma el largo, el ancho y la altura.",
        },
        {
          en: "Area and volume are the same thing.",
          es: "El área y el volumen son lo mismo.",
        },
        {
          en: "Use square units for volume.",
          es: "Usa unidades cuadradas para el volumen.",
        },
      ],
    },
    fractions: {
      say: [
        {
          en: "How many halves are in 3 wholes? Let's draw 3 circles and cut each in half.",
          es: "¿Cuántos medios hay en 3 enteros? Dibujemos 3 círculos y cortemos cada uno a la mitad.",
        },
        {
          en: "What does the reciprocal mean? How does dividing by a fraction relate to multiplying by its reciprocal?",
          es: "¿Qué significa el recíproco? ¿Cómo se relaciona dividir por una fracción con multiplicar por su recíproco?",
        },
        {
          en: "Can we write a story problem for this, like sharing food?",
          es: "¿Contamos una historia para esto, como compartir comida?",
        },
      ],
      dontSay: [
        {
          en: "Just flip and multiply without thinking why.",
          es: "Solo voltea y multiplica sin pensar por qué.",
        },
        {
          en: "The answer must always be smaller when you divide.",
          es: "La respuesta siempre debe ser menor cuando divides.",
        },
        {
          en: "Cross multiply the numerators directly.",
          es: "Multiplica en cruz los numeradores directamente.",
        },
      ],
    },
    decimals: {
      say: [
        {
          en: "Let's line up the decimal points. Why is place value important here?",
          es: "Alineemos los puntos decimales. ¿Por qué es importante el valor posicional aquí?",
        },
        {
          en: "If we multiply 0.5 by 0.2, what is a reasonable estimate? Is it larger or smaller than the factors?",
          es: "Si multiplicamos 0.5 por 0.2, ¿cuál es una estimación razonable? ¿Es mayor o menor que los factores?",
        },
        {
          en: "Let's think of decimals as money (cents). What is $1.50 plus $0.25?",
          es: "Pensemos en los decimales como dinero (centavos). ¿Cuánto es $1.50 más $0.25?",
        },
      ],
      dontSay: [
        {
          en: "Line up the numbers to the right like in whole numbers.",
          es: "Alinea los números a la derecha como en los números enteros.",
        },
        {
          en: "Just drop the decimal point down anywhere.",
          es: "Solo baja el punto decimal en cualquier lugar.",
        },
        {
          en: "Adding zeros at the end changes the value.",
          es: "Agregar ceros al final cambia el valor.",
        },
      ],
    },
    factors: {
      say: [
        {
          en: "Let's build a factor tree. What are two numbers that multiply to this number?",
          es: "Hagamos un árbol de factores. ¿Cuáles son dos números que multiplicados dan este número?",
        },
        {
          en: "Is this number prime (only 1 and itself) or composite (has other factors)?",
          es: "¿Este número es primo (solo 1 y sí mismo) o compuesto (tiene otros factores)?",
        },
        {
          en: "What is the Greatest Common Factor? What is the largest factor they share?",
          es: "¿Cuál es el Máximo Común Divisor? ¿Cuál es el factor más grande que comparten?",
        },
      ],
      dontSay: [
        {
          en: "Multiples and factors are the same.",
          es: "Los múltiplos y los factores son lo mismo.",
        },
        {
          en: "Every odd number is prime.",
          es: "Todo número impar es primo.",
        },
        {
          en: "Prime numbers always end in odd digits except 2.",
          es: "Los números primos siempre terminan en dígitos impares excepto el 2.",
        },
      ],
    },
  };

  const pick = tipsByTopic[topic] || {
    say: [
      {
        en: "What do you already know that could help?",
        es: "¿Qué ya sabes que podría ayudarte?",
      },
      {
        en: "Can you draw a picture or table for this?",
        es: "¿Puedes dibujar un dibujo o una tabla para esto?",
      },
      {
        en: "Let's check one step at a time — no rush.",
        es: "Revisemos un paso a la vez — sin prisa.",
      },
    ],
    dontSay: [
      {
        en: "That's wrong — let me just tell you.",
        es: "Está mal — déjame decírtelo yo.",
      },
      {
        en: "I was never good at math either.",
        es: "Yo tampoco era bueno en matemáticas.",
      },
      {
        en: "This should be easy.",
        es: "Esto debería ser fácil.",
      },
    ],
  };

  return pick;
}

function conceptVisualSvg(config) {
  const topic = detectVisualTopic(config);
  const themeEmoji = config.themeEmoji || "📚";

  if (topic === "ratios") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Ratio table example">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <text x="210" y="48" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Ratio Table / Tabla de razones</text>
        ${[
          ["Batch", "A", "B"],
          ["1", "2", "3"],
          ["2", "4", "6"],
          ["3", "6", "9"],
        ]
          .map((row, r) =>
            row
              .map((cell, c) => {
                const x = 40 + c * 110;
                const y = 70 + r * 28;
                const fill = r === 0 ? "#12355b" : "#ffffff";
                const color = r === 0 ? "#ffffff" : "#21313f";
                return `<rect x="${x}" y="${y}" width="100" height="24" rx="4" fill="${fill}" stroke="#d7e2ed"/><text x="${x + 50}" y="${y + 16}" text-anchor="middle" font-size="12" font-weight="600" fill="${color}">${cell}</text>`;
              })
              .join(""),
          )
          .join("")}
        <text x="210" y="188" text-anchor="middle" font-size="11" fill="#5f6f80">× same number on BOTH columns → equivalent ratio</text>
      </svg>`;
  }

  if (topic === "exponents") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Exponent example">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="60" y="70" font-size="42" font-weight="800" fill="#12355b">2</text>
        <text x="86" y="55" font-size="22" font-weight="800" fill="#d9795d">3</text>
        <text x="120" y="70" font-size="28" fill="#12355b">= 2 × 2 × 2 = 8</text>
        <text x="40" y="110" font-size="13" fill="#21313f">Base = 2 · Exponent = 3 · Multiply 2 three times</text>
        <text x="40" y="135" font-size="13" fill="#21313f" lang="es">Base = 2 · Exponente = 3 · Multiplica 2 tres veces</text>
        <text x="40" y="165" font-size="12" fill="#5f6f80">${themeEmoji}&#160;&#160;NOT 2 + 2 + 2 — that's addition!</text>
      </svg>`;
  }

  if (topic === "equations") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Equation example">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <text x="210" y="52" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Equation / Ecuación</text>
        <text x="50" y="105" font-size="28" font-weight="800" fill="#12355b">n + 8 = 20</text>
        <text x="28" y="158" font-size="12" fill="#21313f">n = unknown · + means add · = means both sides equal</text>
        <text x="28" y="174" font-size="12" fill="#21313f" lang="es">n = incógnita · + suma · = ambos lados iguales</text>
        <rect x="240" y="72" width="150" height="70" rx="8" fill="#fff" stroke="#d7e2ed"/>
        <text x="315" y="98" text-anchor="middle" font-size="12" fill="#5f6f80">Words → symbols</text>
        <text x="315" y="118" text-anchor="middle" font-size="11" fill="#21313f">"plus 8" → + 8</text>
        <text x="315" y="134" text-anchor="middle" font-size="11" fill="#21313f">"equals 20" → = 20</text>
      </svg>`;
  }

  if (topic === "inequalities") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Inequality number line">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fce6de" stroke="#d9795d" stroke-width="2"/>
        <text x="210" y="48" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Inequality / Desigualdad</text>
        <text x="40" y="78" font-size="22" font-weight="800" fill="#12355b">x + 3 &gt; 10  →  x &gt; 7</text>
        <line x1="40" y1="120" x2="380" y2="120" stroke="#12355b" stroke-width="2"/>
        <circle cx="160" cy="120" r="8" fill="#fff" stroke="#d9795d" stroke-width="3"/>
        <rect x="168" y="112" width="212" height="16" fill="#1fa6a2" opacity="0.35"/>
        <text x="40" y="155" font-size="12" fill="#21313f">Open circle · shade the solution side</text>
        <text x="40" y="172" font-size="12" fill="#21313f" lang="es">Círculo abierto · sombrea el lado de la solución</text>
      </svg>`;
  }

  if (topic === "properties") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Properties of operations">
        <rect x="8" y="14" width="404" height="172" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="210" y="40" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Properties / Propiedades</text>
        <text x="28" y="76" font-size="13" font-weight="700" fill="#1fa6a2">Commutative / Conmutativa</text>
        <text x="28" y="98" font-size="18" font-weight="800" fill="#12355b">a + b = b + a</text>
        <text x="28" y="128" font-size="13" font-weight="700" fill="#1fa6a2">Associative / Asociativa</text>
        <text x="28" y="150" font-size="18" font-weight="800" fill="#12355b">(a + b) + c = a + (b + c)</text>
        <text x="28" y="178" font-size="13" font-weight="700" fill="#1fa6a2">Distributive / Distributiva: a(b + c) = a·b + a·c</text>
      </svg>`;
  }

  if (topic === "expressions") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Algebraic expression">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="210" y="48" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Expression / Expresión</text>
        <text x="50" y="95" font-size="32" font-weight="800" fill="#12355b">3x + 5</text>
        <text x="50" y="125" font-size="13" fill="#21313f">3 = coefficient · x = variable · no equal sign</text>
        <text x="50" y="148" font-size="13" fill="#21313f" lang="es">3 = coeficiente · x = variable · sin signo igual</text>
      </svg>`;
  }

  if (topic === "area") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Area formula">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <polygon points="60,140 200,140 240,80 100,80" fill="#fff" stroke="#1fa6a2" stroke-width="2"/>
        <line x1="100" y1="80" x2="100" y2="140" stroke="#d9795d" stroke-width="2" stroke-dasharray="5 4"/>
        <path d="M100 131 L109 131 L109 140" fill="none" stroke="#d9795d" stroke-width="1.5"/>
        <text x="130" y="158" font-size="11" fill="#12355b">base</text>
        <text x="116" y="114" font-size="11" fill="#d9795d">height</text>
        <text x="260" y="85" font-size="16" font-weight="700" fill="#12355b">Area = base × height</text>
        <text x="260" y="110" font-size="13" fill="#21313f">Square units (in², cm²)</text>
        <text x="260" y="130" font-size="13" fill="#21313f" lang="es">Unidades cuadradas</text>
      </svg>`;
  }

  if (topic === "volume") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Volume prism">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fce6de" stroke="#d9795d" stroke-width="2"/>
        <polygon points="80,140 180,140 210,110 110,110" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <polygon points="180,140 210,110 210,60 180,90" fill="#b8ddd8" stroke="#1fa6a2" stroke-width="2"/>
        <polygon points="80,140 110,110 110,60 80,90" fill="#1fa6a2" opacity="0.35" stroke="#1fa6a2" stroke-width="2"/>
        <text x="240" y="80" font-size="16" font-weight="700" fill="#12355b">V = L × W × H</text>
        <text x="240" y="105" font-size="13" fill="#21313f">Volume = cubic units (in³)</text>
        <text x="240" y="125" font-size="13" fill="#21313f" lang="es">Volumen = unidades cúbicas (in³)</text>
      </svg>`;
  }

  if (topic === "surface-area") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Surface area net">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="210" y="48" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Net → Surface Area / Red → Área de superficie</text>
        <rect x="120" y="70" width="50" height="40" fill="#fff" stroke="#1fa6a2"/>
        <rect x="170" y="70" width="50" height="40" fill="#dff2ee" stroke="#1fa6a2"/>
        <rect x="220" y="70" width="50" height="40" fill="#fff" stroke="#1fa6a2"/>
        <text x="40" y="140" font-size="13" fill="#21313f">Add the area of every face from the net.</text>
        <text x="40" y="160" font-size="13" fill="#21313f" lang="es">Suma el área de cada cara de la red.</text>
      </svg>`;
  }

  if (topic === "statistics") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Data display">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <text x="210" y="48" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Data / Datos</text>
        <rect x="60" y="110" width="30" height="40" fill="#1fa6a2"/>
        <rect x="100" y="90" width="30" height="60" fill="#1fa6a2"/>
        <rect x="140" y="70" width="30" height="80" fill="#1fa6a2"/>
        <rect x="180" y="100" width="30" height="50" fill="#1fa6a2"/>
        <text x="260" y="90" font-size="13" fill="#21313f">Mean · Median · Mode</text>
        <text x="260" y="115" font-size="13" fill="#21313f" lang="es">Media · Mediana · Moda</text>
      </svg>`;
  }

  if (topic === "coordinate-plane") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Coordinate plane">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <line x1="120" y1="130" x2="300" y2="130" stroke="#12355b" stroke-width="2"/>
        <line x1="210" y1="60" x2="210" y2="150" stroke="#12355b" stroke-width="2"/>
        <circle cx="250" cy="95" r="6" fill="#d9795d"/>
        <text x="258" y="88" font-size="12" fill="#12355b">(3, 4)</text>
        <text x="260" y="165" font-size="12" fill="#21313f">(x, y) · quadrants · axes</text>
      </svg>`;
  }

  if (topic === "number-line") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Number line">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <line x1="40" y1="100" x2="380" y2="100" stroke="#12355b" stroke-width="2"/>
        <text x="80" y="115" font-size="12">-3</text><text x="160" y="115" font-size="12">0</text><text x="280" y="115" font-size="12">5</text>
        <text x="40" y="140" font-size="13" fill="#21313f">Compare · order · absolute value</text>
        <text x="40" y="160" font-size="13" fill="#21313f" lang="es">Comparar · ordenar · valor absoluto</text>
      </svg>`;
  }

  if (topic === "fractions") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Fraction division">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fce6de" stroke="#d9795d" stroke-width="2"/>
        <text x="50" y="90" font-size="28" font-weight="800" fill="#12355b">3 ÷ ½ = 6</text>
        <text x="50" y="120" font-size="13" fill="#21313f">How many halves fit in 3? Draw groups to check.</text>
        <text x="50" y="145" font-size="13" fill="#21313f" lang="es">¿Cuántos medios caben en 3? Dibujen grupos.</text>
      </svg>`;
  }

  if (topic === "decimals") {
    // The three 6.NOS.3 lessons do not share a rule — see decimalOperation().
    // Stating the addition rule on the division lesson was teaching the exact
    // move that lesson exists to replace.
    const op = decimalOperation(config);
    if (op === "divide") {
      // The worked form is the long-division TABLEAU, not an arrow rewrite —
      // families should see the problem the way the student writes it. The
      // bracket is DRAWN (vinculum + hook paths with explicit stroke); the
      // U+27CC bracket glyph is banned — no shipped font renders it
      // (tools/unrenderable-glyphs.test.mjs).
      return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Long division: 14.4 divided by 1.2 becomes 144 divided by 12, quotient 12">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="32" y="56" font-size="17" font-weight="800" fill="#12355b">14.4 ÷ 1.2  →  144 ÷ 12</text>
        <text x="253" y="100" font-size="26" font-weight="800" fill="#0f766e" text-anchor="end">12</text>
        <text x="196" y="138" font-size="26" font-weight="800" fill="#12355b" text-anchor="end">12</text>
        <path d="M208 108 q-8 18 4 36" stroke="#12355b" stroke-width="3" fill="none"/>
        <path d="M208 108 H 292" stroke="#12355b" stroke-width="3" fill="none"/>
        <text x="222" y="138" font-size="26" font-weight="800" fill="#12355b">144</text>
        <text x="32" y="163" font-size="13" fill="#21313f">Move both decimal points one place, then divide: 12 goes on top.</text>
        <text x="32" y="177" font-size="13" fill="#21313f" lang="es">Muevan el punto en los dos números y dividan: el 12 va arriba.</text>
      </svg>`;
    }
    if (op === "multiply") {
      return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Multiplying decimals">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="50" y="85" font-size="24" font-weight="800" fill="#12355b">1.2 × 0.4 = 0.48</text>
        <text x="50" y="118" font-size="13" fill="#21313f">Multiply as whole numbers: 12 × 4 = 48.</text>
        <text x="50" y="138" font-size="13" fill="#21313f">Then count the decimal places in BOTH factors: 1 + 1 = 2.</text>
        <text x="50" y="162" font-size="13" fill="#21313f" lang="es">Multipliquen como enteros y cuenten las cifras decimales de LOS DOS factores.</text>
      </svg>`;
    }
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Adding and subtracting decimals">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#fef7e0" stroke="#f2c15b" stroke-width="2"/>
        <text x="50" y="90" font-size="28" font-weight="800" fill="#12355b">12.5 + 3.75</text>
        <text x="50" y="120" font-size="13" fill="#21313f">Line up decimal points before you add or subtract.</text>
        <text x="50" y="145" font-size="13" fill="#21313f" lang="es">Alineen los puntos decimales antes de sumar o restar.</text>
      </svg>`;
  }

  if (topic === "factors") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Prime factorization">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <text x="50" y="85" font-size="22" font-weight="800" fill="#12355b">24 = 2 × 2 × 2 × 3</text>
        <text x="50" y="115" font-size="13" fill="#21313f">Break apart with a factor tree until all factors are prime.</text>
        <text x="50" y="140" font-size="13" fill="#21313f" lang="es">Descompongan con un árbol hasta que todos sean primos.</text>
      </svg>`;
  }

  if (topic === "division") {
    return `
      <svg viewBox="0 0 420 210" class="concept-svg" role="img" aria-label="Long Division Algorithm DMSB">
        <rect x="8" y="10" width="404" height="190" rx="12" fill="#fffdf5" stroke="#12355b" stroke-width="2"/>
        <text x="210" y="32" text-anchor="middle" font-size="14" font-weight="800" fill="#12355b">Long Division Algorithm: D-M-S-B</text>
        
        <!-- Long division bracket: 12 ) 1344 = 112 -->
        <text x="55" y="80" font-size="18" font-weight="800" fill="#12355b">12</text>
        <line x1="68" y1="58" x2="68" y2="88" stroke="#12355b" stroke-width="2.5"/>
        <line x1="68" y1="58" x2="165" y2="58" stroke="#12355b" stroke-width="2.5"/>
        <text x="75" y="80" font-size="18" font-weight="800" fill="#12355b">1,344</text>
        <text x="75" y="52" font-size="18" font-weight="800" fill="#0d7a76">112</text>
        
        <!-- 4 steps pills -->
        <rect x="180" y="48" width="220" height="28" rx="6" fill="#fef2f2" stroke="#ef4444"/>
        <text x="188" y="67" font-size="12" font-weight="800" fill="#dc2626">1. D (Divide)</text>
        <text x="265" y="67" font-size="11" fill="#1e293b">13 ÷ 12 = 1</text>
        
        <rect x="180" y="82" width="220" height="28" rx="6" fill="#fef2f2" stroke="#ef4444"/>
        <text x="188" y="101" font-size="12" font-weight="800" fill="#dc2626">2. M (Multiply)</text>
        <text x="275" y="101" font-size="11" fill="#1e293b">1 × 12 = 12</text>
        
        <rect x="180" y="116" width="220" height="28" rx="6" fill="#fefce8" stroke="#eab308"/>
        <text x="188" y="135" font-size="12" font-weight="800" fill="#854d0e">3. S (Subtract)</text>
        <text x="272" y="135" font-size="11" fill="#1e293b">13 − 12 = 1</text>
        
        <rect x="180" y="150" width="220" height="28" rx="6" fill="#fffbeb" stroke="#d97706"/>
        <text x="188" y="169" font-size="12" font-weight="800" fill="#b45309">4. B (Bring down)</text>
        <text x="290" y="169" font-size="11" fill="#1e293b">Bring down 4</text>
        
        <text x="210" y="195" text-anchor="middle" font-size="11" font-weight="700" fill="#5f6f80">Repeat cycle until no digits remain · Quotient: 112</text>
      </svg>`;
  }

  const steps = buildConceptSteps(config);
  return `
    <div class="concept-fallback-visual" aria-hidden="true">
      ${steps
        .slice(0, 3)
        .map(
          (s, i) =>
            `<div class="concept-fallback-step step-color-${i + 1}"><span class="step-dot">${i + 1}</span><span>${esc(s.en.split(".")[0])}</span></div>`,
        )
        .join("")}
    </div>`;
}

function helpButton(label, payload) {
  const data = String(JSON.stringify(payload)).replace(/&/g, "&amp;").replace(/'/g, "&#39;");
  return `<button type="button" class="help-pop-btn" data-help='${data}' onclick="openHelpModalFromBtn(this)">${label}</button>`;
}

export function selectQuickCheckProblems(practice = {}, config = {}) {
  return selectAlignedQuickCheckProblems(practice, config);
}

export function renderWelcomeBanner(config, lessonId) {
  const unit = config.unit || 1;
  const theme = getUnitTheme(unit);
  const themeEmoji = config.themeEmoji || theme.emoji || "🏠";
  const title = config.title || "Tonight's Lesson";
  const standard = config.standard || "";

  return `
    <header class="hw-hero" aria-label="Family Math Night welcome">
      <div class="hw-hero-glow" aria-hidden="true"></div>
      <div class="hw-hero-body">
        <p class="hw-hero-kicker">
          <span class="hw-hero-kicker-icon" aria-hidden="true">${theme.emoji}</span>
          <span class="lang-en">Unit ${unit} · ${esc(theme.nameEn)}</span>
          <span class="lang-es" lang="es">Unidad ${unit} · ${esc(theme.nameEs)}</span>
        </p>

        <div class="hw-hero-head">
          <span class="hw-hero-emoji" aria-hidden="true">${esc(themeEmoji)}</span>
          <div class="hw-hero-titles">
            <h1 class="welcome-title-en">Family Math Night</h1>
            <p class="welcome-title-es" lang="es">Ayuda a tu estudiante</p>
          </div>
        </div>

        <p class="hw-hero-lesson">
          <span class="hw-hero-lesson-title">${esc(title)}</span>
          <span class="hw-hero-lesson-meta">${esc(homeworkPageLabel(lessonId))}${standard ? ` · ${esc(standard)}` : ""}</span>
        </p>

        <p class="hw-hero-lead">
          <span class="lang-en">Use the pictures and the short steps. Ask questions — let your student do the thinking.</span>
          <span class="lang-es" lang="es">Usen los dibujos y los pasos cortos. Hagan preguntas: dejen que su estudiante piense.</span>
        </p>

        <ul class="hw-hero-stats" aria-label="What tonight looks like">
          <li class="hw-stat"><span aria-hidden="true">🗺️</span><span class="lang-en">5 stops</span><span class="lang-es" lang="es">5 paradas</span></li>
          <li class="hw-stat"><span aria-hidden="true">⏱️</span><span class="lang-en">About 25 minutes</span><span class="lang-es" lang="es">Unos 25 minutos</span></li>
          <li class="hw-stat"><span aria-hidden="true">👪</span><span class="lang-en">Better together</span><span class="lang-es" lang="es">Mejor en familia</span></li>
        </ul>

        <div class="hw-hero-controls">
          <div class="lang-selector-card">
            <span class="lang-selector-title">Language / Idioma</span>
            <div class="lang-selector-buttons" role="group" aria-label="Language Mode Selector">
              <button type="button" class="lang-toggle-btn active" data-lang-mode="bilingual" onclick="setLanguageMode('bilingual')" aria-pressed="true">
                🇺🇸🇪🇸 <span>Bilingual / Bilingüe</span>
              </button>
              <button type="button" class="lang-toggle-btn" data-lang-mode="en" onclick="setLanguageMode('en')" aria-pressed="false">
                🇺🇸 <span>English</span>
              </button>
              <button type="button" class="lang-toggle-btn" data-lang-mode="es" onclick="setLanguageMode('es')" aria-pressed="false">
                🇪🇸 <span>Español</span>
              </button>
            </div>
          </div>
        </div>

        ${renderQuickPlan()}
      </div>
    </header>`;
}

/**
 * Tonight's Path — a visual roadmap of the 5 core stops through the homework,
 * so a family opening a 10-tab page knows exactly where to go and how long it
 * takes. Stops light up as they are visited (see updateJourneyMap in
 * HOMEWORK_TABS_JS; visits persist per lesson in localStorage). The extra tabs
 * (Workbench, Arcade, Play, Help, More) stay available but are framed as
 * optional, which is what makes the page feel followable instead of endless.
 */
const JOURNEY_STOPS = [
  { id: "learn", icon: "📖", en: "Learn", es: "Aprender", min: 5 },
  { id: "words", icon: "📚", en: "Words", es: "Palabras", min: 3 },
  { id: "together", icon: "🤝", en: "Together", es: "Juntos", min: 7 },
  { id: "check", icon: "✅", en: "Check", es: "Repaso", min: 10 },
  { id: "done", icon: "🎉", en: "Done", es: "Listo", min: 1 },
];

/* The 10-minute plan. Lives INSIDE the hero: a family who is short on time
   needs to see it before they scroll, and it used to sit in a second nav card
   that competed with the tab bar for the same job. */
export function renderQuickPlan() {
  return `
      <details class="hw-quickplan">
        <summary class="hw-quickplan-summary">
          <span class="hw-quickplan-icon" aria-hidden="true">⏰</span>
          <strong><span class="lang-en">Only have 10 minutes tonight?</span><span class="lang-es" lang="es">¿Solo tienen 10 minutos hoy?</span></strong>
          <span class="hw-quickplan-chevron" aria-hidden="true">▾</span>
        </summary>
        <ol class="hw-quickplan-steps">
          <li><span class="lang-en"><strong>2 min</strong> — Read the Big Idea out loud on the Learn stop.</span><span class="lang-es" lang="es"><strong>2 min</strong> — Lean en voz alta la idea principal en la parada Aprender.</span></li>
          <li><span class="lang-en"><strong>3 min</strong> — Do just the FIRST Try Together step.</span><span class="lang-es" lang="es"><strong>3 min</strong> — Hagan solo el PRIMER paso de Intentar Juntos.</span></li>
          <li><span class="lang-en"><strong>5 min</strong> — Answer the 3 Warm-up problems on the Check stop.</span><span class="lang-es" lang="es"><strong>5 min</strong> — Contesten los 3 problemas de calentamiento en la parada Repaso.</span></li>
        </ol>
        <p class="hw-quickplan-note">
          <span class="lang-en">💛 Short and calm beats long and stressful. Ten focused minutes tonight is a win.</span>
          <span class="lang-es" lang="es">💛 Corto y tranquilo vale más que largo y estresante. Diez minutos concentrados hoy ya son un logro.</span>
        </p>
      </details>`;
}

/**
 * The progress rail — five stops on one line, directly under the sticky tab
 * bar. It replaced a full-width "Tonight's Path" card that duplicated the tab
 * bar's job: the page opened with a dark hero, then a second nav, then a third
 * (the tabs) before any mathematics appeared. The rail keeps the roadmap
 * (order, position, what is done) at a glance and costs one line.
 */
export function renderJourneyMap() {
  const stopsHtml = JOURNEY_STOPS.map(
    (s, i) => `
      <li class="hw-rail-item">
        <button type="button" class="hw-rail-stop" data-journey-stop="${s.id}" onclick="switchHomeworkTab('${s.id}')"
          aria-label="Go to ${s.en}, stop ${i + 1} of 5, about ${s.min} minutes">
          <span class="hw-rail-dot"><span class="hw-rail-icon" aria-hidden="true">${s.icon}</span><span class="hw-rail-check" aria-hidden="true">✓</span></span>
          <span class="hw-rail-label"><span class="lang-en">${s.en}</span><span class="lang-es" lang="es">${s.es}</span></span>
        </button>
      </li>`,
  ).join("");

  return `
    <nav class="hw-rail" aria-label="Tonight's path">
      <span class="hw-rail-title">
        <span class="lang-en">Tonight's path</span><span class="lang-es" lang="es">La ruta de hoy</span>
      </span>
      <ol class="hw-rail-track">
        <span class="hw-rail-line" aria-hidden="true"><span class="hw-rail-line-fill" id="hw_rail_fill"></span></span>
        ${stopsHtml}
      </ol>
    </nav>`;
}

export function renderLearningTonight(config) {
  const { en, es } = learningTonight(config);
  const vocab = (config.vocabulary || []).slice(0, 5);
  const wordsEn = vocab
    .map((v) => v.term)
    .filter(Boolean)
    .join(", ");
  const wordsEs = vocab
    .map((v) => v.termEs || v.term)
    .filter(Boolean)
    .join(", ");

  return `
    <section class="guided-section card section-learn" aria-label="What we are learning tonight">
      <h2 class="section-title">📖 What we're learning tonight / Qué aprendemos hoy</h2>
      <div class="bilingual-grid">
        <div class="bilingual-col lang-en">
          <span class="lang-label">English</span>
          <p class="learning-big">${esc(completeSentence(en.charAt(0).toUpperCase() + en.slice(1)))}</p>
          ${wordsEn ? renderVocabularyChips(vocab, "en") : ""}
        </div>
        <div class="bilingual-col lang-es" lang="es">
          <span class="lang-label">Español</span>
          <p class="learning-big">${esc(completeSentence(es))}</p>
          ${wordsEs ? renderVocabularyChips(vocab, "es") : ""}
        </div>
      </div>
    </section>`;
}

export function renderConceptExplainer(config) {
  const steps = buildConceptSteps(config);
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);
  const quickPath = steps
    .map((_, index) => {
      const cue = stepCue(index);
      return `<li class="concept-quick-step"><span class="concept-quick-icon" aria-hidden="true">${cue.icon}</span><span class="lang-en">${cue.en}</span><span class="lang-es" lang="es">${cue.es}</span></li>`;
    })
    .join("");

  return `
    <section class="guided-section card section-visual" aria-label="Visual concept explainer">
      <h2 class="section-title">🎯 The big idea / La idea principal</h2>
      <div class="concept-visual-wrap">${conceptVisualSvg(config)}</div>
      <div class="concept-quick-wrap">
        <p class="concept-quick-title"><span class="lang-en">Follow the picture path</span><span class="lang-es" lang="es">Sigan la ruta visual</span></p>
        <ol class="concept-quick-path" aria-label="Four-step visual math path">${quickPath}</ol>
      </div>
      <div class="key-idea-banner">
        <p class="lang-en"><strong>In one sentence:</strong> ${esc(completeSentence(keyEn))}</p>
        <p class="lang-es" lang="es"><strong>En una frase:</strong> ${esc(completeSentence(keyEs))}</p>
      </div>
      <ol class="guided-steps">
        ${steps
          .map((s, index) => {
            const cue = stepCue(index);
            const en = splitExplanation(s.en);
            const es = splitExplanation(s.es);
            const moreDetail =
              en.detail || es.detail
                ? `<details class="step-detail"><summary><span class="lang-en">More detail</span><span class="lang-es" lang="es">Más detalle</span></summary>${en.detail ? `<p class="lang-en">${esc(en.detail)}</p>` : ""}${es.detail ? `<p class="lang-es" lang="es">${esc(es.detail)}</p>` : ""}</details>`
                : "";
            return `
          <li class="guided-step step-color-${s.stepNum}">
            <div class="guided-step-head">
              <span class="guided-step-icon" aria-hidden="true">${cue.icon}</span>
              <div><span class="step-cue-label"><span class="lang-en">${cue.en}</span><span class="lang-es" lang="es">${cue.es}</span></span><span class="step-badge">Step ${s.stepNum} / Paso ${s.stepNum}</span></div>
            </div>
            <p class="step-lead lang-en">${esc(en.lead)}</p>
            <p class="step-lead lang-es" lang="es">${esc(es.lead)}</p>
            ${moreDetail}
          </li>`;
          })
          .join("")}
      </ol>
      <ul class="watch-for-list">
        ${watchForCues(config)
          .map(
            (c) => `
          <li>
            <span class="watch-icon">${c.icon}</span>
            <div>
              <p class="lang-en">${esc(c.en)}</p>
              <p class="lang-es" lang="es">${esc(c.es)}</p>
            </div>
          </li>`,
          )
          .join("")}
      </ul>
    </section>`;
}

export function renderTryTogether(config, lessonId = "") {
  const activity = tryTogetherActivity(config);
  const unitNum = parseInt(config.unit || 1, 10);
  const lessonMatch = String(lessonId).match(/(\d+)-(\d+)/);
  const lessonNum = lessonMatch ? parseInt(lessonMatch[2], 10) : 1;
  const hookIndex = (unitNum * 7 + lessonNum) % 3;

  let hookBanner = "";
  if (hookIndex === 0) {
    hookBanner = `
      <div class="huddle-hook-banner hook-debate">
        <span class="huddle-hook-icon" aria-hidden="true">🗣️</span>
        <div class="huddle-hook-titles">
          <strong><span class="lang-en">Would You Rather? · Family Math Debate</span><span class="lang-es" lang="es">¿Qué prefieres? · Debate Matemático</span></strong>
          <span><span class="lang-en">Choose a side with your student and defend your mathematical thinking!</span><span class="lang-es" lang="es">¡Elige una opción con tu estudiante y defiende tu razonamiento matemático!</span></span>
        </div>
      </div>
      <div class="parent-coach-prompt">
        <strong>💬 Parent Coach / Guía para familias:</strong>
        <span class="lang-en">Ask: "Which option makes more sense or is the better deal, and why? Show me with numbers or pictures."</span>
        <span class="lang-es" lang="es">Pregunta: "¿Qué opción tiene más sentido o es mejor opción, y por qué? Muéstramelo con números o dibujos."</span>
      </div>`;
  } else if (hookIndex === 1) {
    hookBanner = `
      <div class="huddle-hook-banner hook-detective">
        <span class="huddle-hook-icon" aria-hidden="true">🕵️‍♂️</span>
        <div class="huddle-hook-titles">
          <strong><span class="lang-en">Spot the Slip · Math Detective</span><span class="lang-es" lang="es">Encuentra el error · Detective Matemático</span></strong>
          <span><span class="lang-en">A student solved a problem and made a common slip. Can you find where they went off track?</span><span class="lang-es" lang="es">Alguien cometió un error común al resolver. ¿Pueden encontrar en qué paso falló?</span></span>
        </div>
      </div>
      <div class="parent-coach-prompt">
        <strong>💬 Parent Coach / Guía para familias:</strong>
        <span class="lang-en">Ask: "Look at the steps closely. What is the one thing they forgot to check?"</span>
        <span class="lang-es" lang="es">Pregunta: "Mira los pasos con atención. ¿Qué fue lo que olvidó revisar?"</span>
      </div>`;
  } else {
    hookBanner = `
      <div class="huddle-hook-banner hook-teacher">
        <span class="huddle-hook-icon" aria-hidden="true">🎓</span>
        <div class="huddle-hook-titles">
          <strong><span class="lang-en">Student-as-Teacher · 60-Second Challenge</span><span class="lang-es" lang="es">Estudiante como profe · Reto de 60 segundos</span></strong>
          <span><span class="lang-en">Student challenge: Teach your family this concept in under 60 seconds!</span><span class="lang-es" lang="es">Reto para el estudiante: ¡Explica este concepto a tu familia en menos de 60 segundos!</span></span>
        </div>
      </div>
      <div class="parent-coach-prompt">
        <strong>💬 Family role / Rol de la familia:</strong>
        <span class="lang-en">Listen without interrupting for 1 minute, then ask: "Can you show me one quick example?"</span>
        <span class="lang-es" lang="es">Escuchen sin interrumpir por 1 minuto, luego pregunten: "¿Puedes mostrarme un ejemplo rápido?"</span>
      </div>`;
  }

  return `
    <section class="guided-section card section-together" aria-label="Try this together">
      <h2 class="section-title">🤝 Try this together / Inténtenlo juntos</h2>
      ${hookBanner}
      ${
        activity.scenarioEn
          ? `<p class="try-scenario lang-en">${esc(activity.scenarioEn)}</p>
             <p class="try-scenario lang-es" lang="es">${esc(activity.scenarioEs)}</p>`
          : ""
      }
      <p class="try-together-note bilingual-block">
        <span class="lang-en">Work side by side. You ask questions; your student does the thinking.</span>
        <span class="lang-es" lang="es">Trabajen juntos. Tú haces preguntas; tu estudiante piensa.</span>
      </p>
      <ol class="together-steps">
        ${activity.steps
          .map((step, i) => {
            const hintEn = step.hint || "Read it again slowly. What is the first small step?";
            const hintEs =
              step.hintEs || "Léanlo de nuevo despacio. ¿Cuál es el primer paso pequeño?";
            const hintBtn = helpButton("💡 Hint / Pista", {
              titleEn: `Step ${i + 1} hint`,
              titleEs: `Pista del paso ${i + 1}`,
              en: hintEn,
              es: hintEs,
            });
            const helpBtn = step.helpEn
              ? helpButton("🤝 More help / Más ayuda", {
                  titleEn: `Step ${i + 1} — more help`,
                  titleEs: `Paso ${i + 1} — más ayuda`,
                  en: step.helpEn,
                  es: step.helpEs || hintEs,
                })
              : "";
            return `
          <li class="together-step together-step--compact step-color-${(i % 4) + 1}">
            <div class="together-step-head">
              <span class="step-badge">Step ${i + 1} / Paso ${i + 1}</span>
              <div class="together-step-actions">
                ${hintBtn}
                ${helpBtn}
              </div>
            </div>
            <p class="lang-en">${esc(step.en)}</p>
            <p class="lang-es" lang="es">${esc(step.es)}</p>
            <div class="together-fill">
              <textarea id="together_${i}" name="together_${i}" class="custom-textarea together-fill-input" rows="1" placeholder="✏️ Your turn / Tu turno…" oninput="saveState();" aria-label="Your work for step ${i + 1}"></textarea>
            </div>
          </li>`;
          })
          .join("")}
      </ol>
      ${renderTogetherLadder(config)}
    </section>`;
}

// Graduated practice ladder rendered under the guided steps — compact problems
// families do side by side, easiest first, with a no-JS reveal for each answer.
function renderTogetherLadder(config) {
  const ladder = buildTogetherLadder(config);
  if (!ladder.length) return "";

  const letters = "ABCDEFGH";
  const items = ladder
    .map((item, i) => {
      const hasChoices = Array.isArray(item.choices) && item.choices.length > 0;
      const choicesHtml = hasChoices
        ? `<ol class="ladder-choices">${item.choices
            .map((c) => `<li class="ladder-choice">${esc(c)}</li>`)
            .join("")}</ol>`
        : "";
      // For multiple-choice, reveal the correct option with its letter (e.g. "A. …")
      // so it lines up with the rendered choices; open-response just shows the sample.
      const answerText =
        hasChoices && Number.isInteger(item.correctIndex)
          ? `${letters[item.correctIndex] ? `${letters[item.correctIndex]}. ` : ""}${item.a}`
          : item.a;
      const answer = item.a
        ? `<details class="ladder-answer">
             <summary><span class="lang-en">👁️ Show answer</span><span class="lang-es" lang="es">👁️ Ver respuesta</span></summary>
             <p class="ladder-answer-text">${esc(answerText)}</p>
           </details>`
        : "";
      return `
        <li class="ladder-item">
          <div class="ladder-head">
            <span class="ladder-stars" aria-hidden="true">${item.stars}</span>
            <span class="ladder-tier"><span class="lang-en">${esc(item.tierEn)}</span><span class="lang-es" lang="es">${esc(item.tierEs)}</span></span>
          </div>
          <p class="ladder-q">${esc(item.q)}</p>
          ${choicesHtml}
          <input type="text" id="ladder_${i}" name="ladder_${i}" class="ladder-input" placeholder="Answer / Respuesta" oninput="saveState();" aria-label="Your answer for practice problem ${i + 1}" />
          ${answer}
        </li>`;
    })
    .join("");

  return `
    <div class="together-ladder">
      <h3 class="ladder-title">
        <span class="lang-en">📈 Practice ladder — easiest first</span>
        <span class="lang-es" lang="es">📈 Escalera de práctica — del más fácil al más difícil</span>
      </h3>
      <p class="ladder-note bilingual-block">
        <span class="lang-en">Do these together. Start at ★ and climb to ★★★ when ready.</span>
        <span class="lang-es" lang="es">Háganlos juntos. Empiecen en ★ y suban a ★★★ cuando estén listos.</span>
      </p>
      <ol class="ladder-list">${items}</ol>
    </div>`;
}

export function renderStuckSection(config) {
  const tips = stuckTips(config);

  return `
    <section class="guided-section card section-stuck" aria-label="If your student gets stuck">
      <h2 class="section-title">💬 If your student gets stuck / Si se atora</h2>
      <div class="stuck-grid">
        <div class="stuck-panel stuck-say">
          <h3 class="stuck-heading">✅ What to say / Qué decir</h3>
          <ul>
            ${tips.say
              .map(
                (t) =>
                  `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
              )
              .join("")}
          </ul>
        </div>
        <div class="stuck-panel stuck-dont">
          <h3 class="stuck-heading">🚫 What NOT to say / Qué evitar</h3>
          <ul>
            ${tips.dontSay
              .map(
                (t) =>
                  `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>
      <p class="stuck-footer bilingual-block">
        <span class="lang-en">Struggle is part of learning. Short breaks and snacks are allowed!</span>
        <span class="lang-es" lang="es">La dificultad es parte del aprendizaje. ¡Descansos y meriendas están permitidos!</span>
      </p>
    </section>`;
}

export function renderCelebration() {
  return `
    <section class="guided-section card section-celebrate" aria-label="Celebration">
      <h2 class="section-title">🎉 You did it together! / ¡Lo lograron juntos!</h2>
      <p class="celebrate-text lang-en">High five! Whether every answer was perfect or not, you showed up for your student tonight. That matters.</p>
      <p class="celebrate-text lang-es" lang="es">¡Chócalas! No importa si cada respuesta fue perfecta — estuviste con tu estudiante esta noche. Eso importa.</p>
      <p class="celebrate-sub bilingual-block">
        <span class="lang-en">Answers save automatically on this device. Tap <strong>Check This Problem</strong> anytime.</span>
        <span class="lang-es" lang="es">Las respuestas se guardan solas en este dispositivo. Toquen <strong>Revisar esta pregunta</strong> cuando quieran.</span>
      </p>

      <div class="high-five-banner">
        <button type="button" class="btn-high-five" onclick="triggerHighFive()">
          <span class="high-five-emoji" aria-hidden="true">✋</span>
          <div class="high-five-labels">
            <strong><span class="lang-en">Give a High Five!</span><span class="lang-es" lang="es">¡Dame esos cinco!</span></strong>
            <small><span class="lang-en">Tap to celebrate tonight's math effort!</span><span class="lang-es" lang="es">¡Toca para celebrar el esfuerzo de hoy!</span></small>
          </div>
        </button>
      </div>

      <div class="achievement-shelf" id="achievement_shelf">
        <div class="achievement-badge badge-learn is-unlocked" id="badge_achieve_learn">
          <span class="achieve-icon" aria-hidden="true">📖</span>
          <span class="achieve-name"><span class="lang-en">Concept Explorer</span><span class="lang-es" lang="es">Explorador</span></span>
        </div>
        <div class="achievement-badge badge-vocab" id="badge_achieve_vocab">
          <span class="achieve-icon" aria-hidden="true">📚</span>
          <span class="achieve-name"><span class="lang-en">Vocab Champ</span><span class="lang-es" lang="es">Camp. Vocabulario</span></span>
        </div>
        <div class="achievement-badge badge-practice" id="badge_achieve_practice">
          <span class="achieve-icon" aria-hidden="true">⭐</span>
          <span class="achieve-name"><span class="lang-en">3-Star Hero</span><span class="lang-es" lang="es">Héroe 3 Estrellas</span></span>
        </div>
        <div class="achievement-badge badge-arcade is-unlocked" id="badge_achieve_arcade">
          <span class="achieve-icon" aria-hidden="true">🎮</span>
          <span class="achieve-name"><span class="lang-en">Game Master</span><span class="lang-es" lang="es">Maestro del Juego</span></span>
        </div>
      </div>

      <div class="parent-signoff-container card-ish">
        <h3 class="signoff-title">✍️ Parent Sign-off & Feedback / Firma del padre y comentarios</h3>
        
        <!-- Active Form -->
        <div id="signoff_form_wrapper">
          <div class="signoff-field checkbox-field">
            <label class="checkbox-label">
              <input type="checkbox" id="parent_reviewed_checkbox" onchange="toggleSignoffSubmitBtn()" />
              <span class="lang-en">I reviewed this homework with my student tonight.</span>
              <span class="lang-es" lang="es">Revisé esta tarea con mi estudiante esta noche.</span>
            </label>
          </div>
          
          <div class="signoff-field text-field">
            <label for="student_name_input">
              <span class="lang-en">Student Name (optional):</span>
              <span class="lang-es" lang="es">Nombre del estudiante (opcional):</span>
            </label>
            <input type="text" id="student_name_input" placeholder="e.g. Alex" oninput="updateCertStudentName(this.value)" />
          </div>

          <div class="signoff-field text-field">
            <label for="parent_name_input">
              <span class="lang-en">Parent/Guardian Name:</span>
              <span class="lang-es" lang="es">Nombre del padre/tutor:</span>
            </label>
            <input type="text" id="parent_name_input" placeholder="e.g. Maria Lopez" oninput="toggleSignoffSubmitBtn()" />
          </div>

          <div class="signoff-field textarea-field">
            <label for="parent_note_input">
              <span class="lang-en">Note to Teacher (optional):</span>
              <span class="lang-es" lang="es">Nota para el maestro (opcional):</span>
            </label>
            <textarea id="parent_note_input" rows="3" placeholder="e.g. Student did great with equations but struggled with drawing the number line."></textarea>
          </div>

          <button type="button" id="submit_signoff_btn" class="signoff-submit-btn" disabled onclick="saveParentSignoff()">
            <span class="lang-en">Confirm & Save / Confirmar y Guardar</span>
          </button>
        </div>

        <!-- Confirmed View -->
        <div id="signoff_confirmed_wrapper" hidden>
          <div class="certificate-badge">
            <div class="cert-check">🏆</div>
            <div class="cert-info">
              <h4 class="cert-header">
                <span class="lang-en">Homework Review Verified!</span>
                <span class="lang-es" lang="es">¡Revisión de tarea verificada!</span>
              </h4>
              <p class="cert-detail"><strong id="display_parent_name"></strong></p>
              <p class="cert-date"><span class="lang-en">Signed on:</span><span class="lang-es" lang="es">Firmado el:</span> <span id="display_signoff_date"></span></p>
              <div id="display_parent_note_box" class="cert-note-box" hidden>
                <p class="cert-note-title"><strong>Note to teacher / Nota para el maestro:</strong></p>
                <p id="display_parent_note" class="cert-note-content"></p>
              </div>
            </div>
          </div>
          <div class="cert-actions">
            <button type="button" class="btn btn-secondary print-cert-btn" onclick="window.print()">
              <span class="lang-en">🖨️ Print Certificate / Imprimir certificado</span>
            </button>
            <button type="button" class="edit-signoff-btn" onclick="editParentSignoff()">
              <span class="lang-en">Edit sign-off / Editar firma</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Print-Only Certificate Layout -->
      <div class="print-only-certificate" id="print_only_certificate">
        <div class="print-cert-header">
          <h2>EDU WONDERLAB MATH</h2>
          <h3>Family Math Night Completion Certificate</h3>
        </div>
        <div class="print-cert-body">
          <p>This certifies that the homework for <strong><span id="print_lesson_title"></span></strong> was completed and reviewed collaboratively.</p>
          <div class="print-cert-signatures">
            <div class="print-sig-block">
              <p class="sig-line" id="print_parent_name"></p>
              <p class="sig-label">Parent/Guardian Signature</p>
            </div>
            <div class="print-sig-block">
              <p class="sig-line" id="print_signoff_date"></p>
              <p class="sig-label">Date</p>
            </div>
          </div>
          <div class="print-cert-note" id="print_parent_note_wrapper" style="display:none;">
            <p class="note-heading"><strong>Parent Note to Teacher:</strong></p>
            <p id="print_parent_note" class="note-body"></p>
          </div>
        </div>
      </div>
    </section>`;
}

// coreCount is the number of problems outside the collapsed "more practice"
// block — 6 on every lesson today, but passed in so the copy can't drift if the
// selection changes.
export function renderQuickCheckIntro(coreCount = 6) {
  return `
    <section class="guided-section card section-quick-intro" aria-label="Quick check introduction">
      <h2 class="section-title">✅ Quick check / Repaso rápido</h2>
      <p class="quick-check-time bilingual-block">
        <span class="lang-en">⏱️ Plan on about <strong>15–20 minutes</strong> for the ${coreCount} problems below. The extra practice at the bottom is optional.</span>
        <span class="lang-es" lang="es">⏱️ Calculen unos <strong>15–20 minutos</strong> para los ${coreCount} problemas de abajo. La práctica extra al final es opcional.</span>
      </p>
      <p class="bilingual-block">
        <span class="lang-en">A few problems to practice together. Each one has a <strong>step-by-step guide</strong>, a <strong>picture to draw on</strong>, and a <strong>space to show your work</strong>. Use <strong>Check This Problem</strong> for instant feedback — no need to finish everything at once.</span>
        <span class="lang-es" lang="es">Unos problemas para practicar juntos. Cada uno tiene una <strong>guía paso a paso</strong>, un <strong>dibujo para trabajar</strong> y un <strong>espacio para mostrar el trabajo</strong>. Usen <strong>Revisar esta pregunta</strong> para retroalimentación al instante — no tienen que terminar todo de una vez.</span>
      </p>
    </section>`;
}

export function getRealWorldSpotlight(topic) {
  const spotlights = {
    exponents: {
      titleEn: "Computer Memory & Data Storage",
      titleEs: "Memoria de computadoras y almacenamiento",
      factEn:
        "Computers use binary exponents (powers of 2) to store everything! 2¹⁰ = 1,024 bytes (1 KB), and 2³⁰ is over 1 billion bytes (1 GB). When you download a 4 GB game, exponents made it possible!",
      factEs:
        "¡Las computadoras usan potencias de 2 para guardar todo! 2¹⁰ = 1,024 bytes (1 KB) y 2³⁰ es más de mil millones de bytes (1 GB). ¡Cuando descargas un juego de 4 GB, los exponentes lo hacen posible!",
      icon: "💾",
    },
    ratios: {
      titleEn: "Pixar Animation & Video Game Scaling",
      titleEs: "Animación de Pixar y gráficos de videojuegos",
      factEn:
        "Animators at Pixar use equivalent ratios to scale characters across 4K movie screens, tablets, and phones without distorting their proportions. If Woody's hat is 1:4 of his height, it stays 1:4 on any screen size!",
      factEs:
        "Los animadores de Pixar usan razones equivalentes para cambiar de escala los personajes en pantallas de cine 4K, tabletas y teléfonos sin deformarlos. Si el sombrero de Woody mide 1:4 de su estatura, ¡se mantiene 1:4 en cualquier pantalla!",
      icon: "🎬",
    },
    equations: {
      titleEn: "NASA Spacecraft Trajectory & Fuel",
      titleEs: "Trayectoria y combustible de naves de la NASA",
      factEn:
        "Aerospace engineers use one-step and multi-step equations to balance spacecraft weight and fuel. Every kilogram of fuel added requires an exact balance of thrust to reach orbit!",
      factEs:
        "Los ingenieros aeroespaciales usan ecuaciones para equilibrar el peso y el combustible de la nave. ¡Cada kilogramo de combustible requiere un empuje exacto para alcanzar la órbita!",
      icon: "🚀",
    },
    inequalities: {
      titleEn: "Roller Coaster Height & Speed Limits",
      titleEs: "Límites de estatura y velocidad en montañas rusas",
      factEn:
        "Engineers design theme park rides with inequalities! 'Height h ≥ 48 inches' means exactly 48 inches or taller can ride. Speed governors use 'speed s ≤ 65 mph' to keep every turn thrilling yet safe.",
      factEs:
        "¡Los ingenieros diseñan las atracciones con desigualdades! 'Estatura h ≥ 48 pulgadas' significa 48 pulgadas o más. Los reguladores usan 'velocidad s ≤ 65 mph' para que cada curva sea emocionante y segura.",
      icon: "🎢",
    },
    expressions: {
      titleEn: "App Development & In-Game Economies",
      titleEs: "Desarrollo de apps y economías de videojuegos",
      factEn:
        "Game developers write algebraic expressions like '50x + 100' to calculate player score or coin rewards for completing x quests plus a 100-coin daily login bonus!",
      factEs:
        "Los desarrolladores escriben expresiones como '50x + 100' para calcular monedas o puntajes al completar x misiones más un bono diario de 100 monedas.",
      icon: "🕹️",
    },
    statistics: {
      titleEn: "Sports Analytics & Weather Forecasting",
      titleEs: "Analítica deportiva y pronóstico del clima",
      factEn:
        "Meteorologists calculate the median and mean temperature over 30 years to detect climate trends. Baseball scouts use batting averages and median pitch speeds to draft future champions!",
      factEs:
        "Los meteorólogos calculan la mediana y la media de temperatura de 30 años para detectar tendencias del clima. ¡Los entrenadores usan medias de bateo para descubrir futuros campeones!",
      icon: "⚾",
    },
    "coordinate-plane": {
      titleEn: "GPS Navigation & Drone Delivery",
      titleEs: "Navegación GPS y entrega con drones",
      factEn:
        "Every GPS in smartphones and delivery drones uses coordinate geometry (latitude and longitude) just like the (x, y) grid to pinpoint your doorstep within inches!",
      factEs:
        "¡Los teléfonos y drones de reparto usan geometría de coordenadas (latitud y longitud) igual que la cuadrícula (x, y) para llegar a tu puerta con exactitud!",
      icon: "📍",
    },
    "number-line": {
      titleEn: "Deep Sea Oceanography & Elevation",
      titleEs: "Oceanografía marina y elevación",
      factEn:
        "Submarines diving in the Mariana Trench use negative numbers on vertical number lines: −11,000 meters means 11,000 meters below sea level (0)! Mount Everest sits at +8,848 meters.",
      factEs:
        "Los submarinos que bajan a la Fosa de las Marianas usan números negativos: −11,000 metros significa 11,000 metros bajo el nivel del mar (0). ¡El Monte Everest está a +8,848 metros!",
      icon: "🌊",
    },
    fractions: {
      titleEn: "Master Chefs & Medicine Dosages",
      titleEs: "Chefs profesionales y dosis médicas",
      factEn:
        "Pastry chefs divide fractions every day when tripling or halving delicate macaroon recipes (e.g. 3/4 ÷ 2 = 3/8 cup). Pharmacists use fraction division to calculate liquid medicine doses safely!",
      factEs:
        "Los chefs pasteleros dividen fracciones a diario al triplicar o reducir recetas delicadas (ej. 3/4 ÷ 2 = 3/8 taza). ¡Los farmacéuticos las usan para calcular dosis médicas seguras!",
      icon: "🧁",
    },
    area: {
      titleEn: "Solar Panel Fields & Urban Architecture",
      titleEs: "Parques solares y arquitectura urbana",
      factEn:
        "Architects calculate roof area in square meters to determine how many solar panels can fit, maximizing clean energy for hospitals, schools, and homes!",
      factEs:
        "Los arquitectos calculan el área del techo en metros cuadrados para saber cuántos paneles solares caben, ¡maximizando la energía limpia para escuelas y hogares!",
      icon: "☀️",
    },
    volume: {
      titleEn: "Eco-Friendly Packaging & Container Ships",
      titleEs: "Empaque ecológico y barcos de carga",
      factEn:
        "Global shipping companies calculate cubic meters of volume to fit thousands of cargo containers onto mega-ships without wasting a single cubic inch of space or fuel!",
      factEs:
        "Las empresas de transporte calculan metros cúbicos de volumen para acomodar contenedores en barcos gigantes sin desperdiciar ni un centímetro de espacio o combustible.",
      icon: "📦",
    },
    "surface-area": {
      titleEn: "Heat Shield Engineering & Product Packaging",
      titleEs: "Escudos térmicos espaciales y empaques",
      factEn:
        "When space capsules re-enter Earth's atmosphere, engineers calculate the total surface area requiring ceramic heat tiles. Cereal companies design boxes with minimal surface area to save cardboard!",
      factEs:
        "Al regresar a la atmósfera, los ingenieros calculan el área de superficie que necesita baldosas térmicas. ¡Las empresas diseñan cajas con menor superficie para ahorrar cartón!",
      icon: "🛰️",
    },
    decimals: {
      titleEn: "Global Currency Exchange & Digital Banking",
      titleEs: "Tipo de cambio mundial y banca digital",
      factEn:
        "Banks process trillions of dollars every second using exact decimal arithmetic. Aligning tenths and hundredths ensures every penny and centavo is tracked accurately!",
      factEs:
        "Los bancos procesan billones de dólares cada segundo con aritmética decimal exacta. ¡Alinear décimos y centésimos asegura que cada centavo quede registrado!",
      icon: "💳",
    },
    factors: {
      titleEn: "Cybersecurity & RSA Password Encryption",
      titleEs: "Ciberseguridad y encriptación de contraseñas",
      factEn:
        "Every secure website you visit uses prime numbers! Cryptography algorithms multiply two gigantic prime numbers together. Breaking the encryption requires finding the prime factors, which would take supercomputers thousands of years!",
      factEs:
        "¡Cada sitio web seguro usa números primos! Los algoritmos multiplican dos números primos gigantescos. Romper la encriptación requeriría factorizar, ¡lo que tardaría miles de años!",
      icon: "🔐",
    },
  };

  return (
    spotlights[topic] || {
      titleEn: "STEM Careers & Everyday Life",
      titleEs: "Carreras STEM y vida cotidiana",
      factEn:
        "Mathematicians, scientists, and software designers use this exact mathematical model to solve real-world problems every single day!",
      factEs:
        "¡Matemáticos, científicos y desarrolladores usan este mismo modelo para resolver problemas en la vida real todos los días!",
      icon: "💡",
    }
  );
}

export function getTopicMisconception(topic) {
  const misconceptions = {
    exponents: {
      trapEn: "Multiplying base × exponent (thinking 3⁴ = 12 instead of 3 × 3 × 3 × 3 = 81).",
      trapEs: "Multiplicar base × exponente (pensar que 3⁴ = 12 en vez de 3 × 3 × 3 × 3 = 81).",
      coachEn:
        "Ask: 'What does the little exponent number tell us to do? How many copies are multiplying?'",
      coachEs:
        "Pregunta: '¿Qué nos dice el número exponente pequeño? ¿Cuántas copias se multiplican?'",
    },
    ratios: {
      trapEn: "Adding the same amount to both parts instead of multiplying by the same factor.",
      trapEs: "Sumar la misma cantidad a ambas partes en lugar de multiplicar por el mismo factor.",
      coachEn: "Ask: 'In a recipe, if we double the juice, do we add 2 cups or multiply by 2?'",
      coachEs:
        "Pregunta: 'En una receta, si duplicamos el jugo, ¿sumamos 2 o multiplicamos por 2?'",
    },
    equations: {
      trapEn: "Doing an operation to only one side of the equal sign, unbalancing the equation.",
      trapEs: "Hacer una operación en un solo lado del signo igual, desequilibrando la ecuación.",
      coachEn:
        "Ask: 'If this were a real balance scale, what happens if we only remove blocks from one side?'",
      coachEs:
        "Pregunta: 'Si fuera una balanza real, ¿qué pasa si solo quitamos bloques de un lado?'",
    },
    inequalities: {
      trapEn: "Forgetting whether the boundary number itself is included (> vs ≥).",
      trapEs: "Olvidar si el número límite está incluido o no (> frente a ≥).",
      coachEn:
        "Ask: 'Is there a line underneath the symbol? Does it say greater than, or greater than or equal to?'",
      coachEs:
        "Pregunta: '¿Tiene una línea abajo el símbolo? ¿Dice mayor que, o mayor o igual que?'",
    },
    expressions: {
      trapEn: "Combining unlike terms (like adding 3x + 5 to get 8x).",
      trapEs: "Combinar términos no semejantes (como sumar 3x + 5 y obtener 8x).",
      coachEn:
        "Ask: 'Think of x as apples and numbers as oranges. Can 3 apples and 5 oranges become 8 apples?'",
      coachEs:
        "Pregunta: 'Imagina x como manzanas y números como naranjas. ¿3 manzanas y 5 naranjas pueden ser 8 manzanas?'",
    },
    statistics: {
      trapEn:
        "Finding the middle number without putting data in order from least to greatest first.",
      trapEs: "Buscar el número central sin ordenar primero los datos de menor a mayor.",
      coachEn:
        "Ask: 'Are our numbers in order from smallest to biggest before we find the median?'",
      coachEs:
        "Pregunta: '¿Están los números ordenados de menor a mayor antes de buscar la mediana?'",
    },
    "coordinate-plane": {
      trapEn: "Reversing the x and y coordinates (moving vertical first instead of horizontal).",
      trapEs: "Invertir las coordenadas x e y (moverse en vertical primero en vez de horizontal).",
      coachEn:
        "Ask: 'Remember: Run before you jump! Which letter comes first in the alphabet: x or y?'",
      coachEs: "Pregunta: '¡Corre antes de saltar! ¿Qué letra va primero en el abecedario: x o y?'",
    },
    "number-line": {
      trapEn: "Thinking −8 is greater than −2 because 8 is bigger than 2.",
      trapEs: "Pensar que −8 es mayor que −2 porque 8 es más grande que 2.",
      coachEn:
        "Ask: 'Which temperature is colder: −8° or −2°? Which number sits farther left on the number line?'",
      coachEs:
        "Pregunta: '¿Qué temperatura es más fría: −8° o −2°? ¿Cuál número está más a la izquierda?'",
    },
    fractions: {
      trapEn: "Dividing without taking the reciprocal of the second fraction (Keep-Change-Flip).",
      trapEs: "Dividir sin invertir la segunda fracción (Mantener-Cambiar-Invertir).",
      coachEn:
        "Ask: 'What is the three-word rule for fraction division? Keep the first, Change the sign, Flip the second!'",
      coachEs:
        "Pregunta: '¿Cuál es la regla de 3 pasos? ¡Mantener la primera, Cambiar a multiplicación, Invertir la segunda!'",
    },
    area: {
      trapEn:
        "Confusing area (square units covering the inside) with perimeter (distance around the outside).",
      trapEs:
        "Confundir el área (unidades cuadradas interiores) con el perímetro (distancia alrededor).",
      coachEn:
        "Ask: 'Are we putting a fence around the yard (perimeter) or laying carpet on the floor (area)?'",
      coachEs: "Pregunta: '¿Estamos poniendo una cerca (perímetro) o alfombrando el piso (área)?'",
    },
    volume: {
      trapEn: "Adding the three dimensions instead of multiplying length × width × height.",
      trapEs: "Sumar las tres dimensiones en vez de multiplicar largo × ancho × alto.",
      coachEn:
        "Ask: 'How many cubes are on the bottom layer? How many equal layers are stacked on top?'",
      coachEs: "Pregunta: '¿Cuántos cubos hay en la base? ¿Cuántas capas iguales hay apiladas?'",
    },
    "surface-area": {
      trapEn: "Missing one or more of the 6 rectangular faces when adding them together.",
      trapEs: "Olvidar una o más de las 6 caras rectangulares al sumarlas.",
      coachEn:
        "Ask: 'A cardboard box has 6 faces: top and bottom, front and back, left and right. Did we add all 6?'",
      coachEs:
        "Pregunta: 'Una caja tiene 6 caras: arriba y abajo, frente y atrás, lados. ¿Sumamos las 6?'",
    },
    decimals: {
      trapEn:
        "Lining up digits at the right edge like whole numbers instead of lining up decimal points.",
      trapEs:
        "Alinear los dígitos a la derecha como números enteros en vez de alinear los puntos decimales.",
      coachEn:
        "Ask: 'Are the decimal points standing in a straight vertical line so tenths match tenths?'",
      coachEs:
        "Pregunta: '¿Están los puntos decimales en una línea vertical recta para que décimos coincidan con décimos?'",
    },
    factors: {
      trapEn:
        "Thinking 1 is a prime number (1 only has one factor, but prime numbers need exactly two: 1 and itself).",
      trapEs:
        "Pensar que el 1 es un número primo (el 1 solo tiene un factor, pero los primos necesitan exactamente dos).",
      coachEn: "Ask: 'Does the number have exactly two different factors? What are they?'",
      coachEs: "Pregunta: '¿Tiene el número exactamente dos factores diferentes? ¿Cuáles son?'",
    },
  };

  return (
    misconceptions[topic] || {
      trapEn: "Rushing to compute an answer without drawing or visualizing the problem first.",
      trapEs: "Apurarse a calcular sin dibujar o visualizar el problema primero.",
      coachEn:
        "Ask: 'Can we draw a picture or diagram of what is happening before we write equations?'",
      coachEs:
        "Pregunta: '¿Podemos hacer un dibujo o diagrama de lo que pasa antes de escribir ecuaciones?'",
    }
  );
}

/**
 * Family Activity Corner — hands-on, no-device mini-activities a family can do
 * tonight with things already in the house. Three per topic, each with concrete
 * steps and one talk-about-it question. Collaborative by design: none of these
 * are races or timed (see the no-timed-games rule for this site). Rendered on
 * the Together tab by renderFamilyActivityCorner().
 */
const FAMILY_ACTIVITIES = {
  ratios: [
    {
      icon: "🥣",
      titleEn: "Recipe Remix",
      titleEs: "Receta a escala",
      materialsEn: "Any recipe (box, jar, or online screenshot), paper",
      materialsEs: "Cualquier receta (caja, frasco o foto), papel",
      minutes: 10,
      steps: [
        {
          en: "Pick a simple recipe and write down two ingredient amounts, like 2 cups of flour and 3 cups of water.",
          es: "Escojan una receta sencilla y anoten dos cantidades, por ejemplo 2 tazas de harina y 3 tazas de agua.",
        },
        {
          en: "Double the recipe together. Multiply BOTH amounts by 2 and write the new ratio.",
          es: "Dupliquen la receta juntos. Multipliquen LAS DOS cantidades por 2 y escriban la nueva razón.",
        },
        {
          en: "Now cut the original recipe in half. What happens to each amount?",
          es: "Ahora reduzcan la receta original a la mitad. ¿Qué pasa con cada cantidad?",
        },
      ],
      talkEn:
        "If we only doubled the flour and not the water, would the recipe still taste right? Why not?",
      talkEs: "Si solo duplicamos la harina y no el agua, ¿la receta sabría igual? ¿Por qué no?",
    },
    {
      icon: "🛒",
      titleEn: "Better-Buy Detective",
      titleEs: "Detective del mejor precio",
      materialsEn: "Two package sizes of the same food (or a store flyer)",
      materialsEs: "Dos tamaños del mismo producto (o un folleto de la tienda)",
      minutes: 10,
      steps: [
        {
          en: "Find the same item in two sizes — for example, 12 oz for $3 and 20 oz for $4.",
          es: "Busquen el mismo producto en dos tamaños; por ejemplo, 12 oz por $3 y 20 oz por $4.",
        },
        {
          en: "Find the price for ONE ounce of each (price ÷ ounces). That is the unit rate.",
          es: "Calculen el precio de UNA onza de cada uno (precio ÷ onzas). Esa es la tasa unitaria.",
        },
        {
          en: "Decide together: which one is the better buy? Defend your answer with the numbers.",
          es: "Decidan juntos: ¿cuál conviene más? Defiendan su respuesta con los números.",
        },
      ],
      talkEn:
        "Is the bigger package ALWAYS the better deal? How could a store trick someone who doesn't check?",
      talkEs:
        "¿El paquete grande SIEMPRE conviene más? ¿Cómo podría la tienda engañar a quien no revisa?",
    },
    {
      icon: "🚶",
      titleEn: "Family Walking Rate",
      titleEs: "Nuestro ritmo al caminar",
      materialsEn: "A hallway or sidewalk, a phone clock",
      materialsEs: "Un pasillo o la acera, el reloj del teléfono",
      minutes: 10,
      steps: [
        {
          en: "Count how many steps your student takes in one minute of normal walking.",
          es: "Cuenten cuántos pasos da su estudiante en un minuto caminando normal.",
        },
        {
          en: "Write it as a rate: steps per 1 minute. Predict how many steps 5 minutes would take.",
          es: "Escríbanlo como tasa: pasos por 1 minuto. Predigan cuántos pasos serían en 5 minutos.",
        },
        {
          en: "Multiply to check the prediction. Try it with another family member's pace and compare rates.",
          es: "Multipliquen para comprobar la predicción. Prueben con el ritmo de otro familiar y comparen tasas.",
        },
      ],
      talkEn: "Whose rate was faster? How do the numbers prove it?",
      talkEs: "¿Qué ritmo fue más rápido? ¿Cómo lo demuestran los números?",
    },
  ],
  fractions: [
    {
      icon: "🫓",
      titleEn: "Fair-Share Kitchen",
      titleEs: "Cocina de porciones justas",
      materialsEn: "A tortilla, sandwich, or sheet of paper; a butter knife or scissors",
      materialsEs: "Una tortilla, un sándwich o una hoja de papel; un cuchillo sin filo o tijeras",
      minutes: 10,
      steps: [
        {
          en: "Cut (or fold) the tortilla into fourths. Ask: how many 1/4 pieces are in ONE whole?",
          es: "Corten (o doblen) la tortilla en cuartos. Pregunta: ¿cuántos pedazos de 1/4 hay en UNA entera?",
        },
        {
          en: "Now imagine 2 tortillas. How many 1/4 pieces in 2 wholes? Write it as 2 ÷ 1/4.",
          es: "Ahora imaginen 2 tortillas. ¿Cuántos pedazos de 1/4 hay en 2 enteras? Escríbanlo como 2 ÷ 1/4.",
        },
        {
          en: "Check by counting the pieces. Does the answer get bigger or smaller than 2? Talk about why.",
          es: "Comprueben contando los pedazos. ¿La respuesta es mayor o menor que 2? Hablen de por qué.",
        },
      ],
      talkEn: "Why does dividing by a fraction give MORE pieces, not fewer?",
      talkEs: "¿Por qué dividir entre una fracción da MÁS pedazos y no menos?",
    },
    {
      icon: "🍚",
      titleEn: "Measuring-Cup Challenge",
      titleEs: "Reto de la taza medidora",
      materialsEn: "Measuring cups, rice or dry beans, a bowl",
      materialsEs: "Tazas medidoras, arroz o frijoles secos, un tazón",
      minutes: 10,
      steps: [
        {
          en: "Predict: how many 1/3-cup scoops will it take to fill 2 cups?",
          es: "Predigan: ¿cuántas medidas de 1/3 de taza se necesitan para llenar 2 tazas?",
        },
        {
          en: "Scoop and count together. Write the matching division problem: 2 ÷ 1/3.",
          es: "Midan y cuenten juntos. Escriban la división que corresponde: 2 ÷ 1/3.",
        },
        {
          en: "Try it again with 1/2-cup scoops. Which scoop needed more trips? Why?",
          es: "Repitan con medidas de 1/2 taza. ¿Cuál medida necesitó más viajes? ¿Por qué?",
        },
      ],
      talkEn: "Before scooping, how could you KNOW the answer without counting?",
      talkEs: "Antes de medir, ¿cómo podrían SABER la respuesta sin contar?",
    },
    {
      icon: "🧵",
      titleEn: "String Split",
      titleEs: "Cortar la cuerda",
      materialsEn: "String, yarn, or paper strip; ruler; scissors",
      materialsEs: "Cuerda, estambre o tira de papel; regla; tijeras",
      minutes: 10,
      steps: [
        {
          en: "Cut a piece of string 3 feet (or 90 cm) long and measure it together.",
          es: "Corten una cuerda de 3 pies (o 90 cm) y mídanla juntos.",
        },
        {
          en: "Predict how many 1/2-foot (15 cm) pieces you can cut from it. Write the division.",
          es: "Predigan cuántos pedazos de 1/2 pie (15 cm) saldrán. Escriban la división.",
        },
        {
          en: "Cut and count. Compare the count with your division answer.",
          es: "Corten y cuenten. Comparen el conteo con el resultado de la división.",
        },
      ],
      talkEn: "What would happen to the number of pieces if each piece were half as long?",
      talkEs: "¿Qué pasaría con el número de pedazos si cada pedazo midiera la mitad?",
    },
  ],
  decimals: [
    {
      icon: "🧾",
      titleEn: "Receipt Roundup",
      titleEs: "La suma del recibo",
      materialsEn: "Any store receipt, paper, pencil",
      materialsEs: "Cualquier recibo de la tienda, papel, lápiz",
      minutes: 10,
      steps: [
        {
          en: "Each person picks 3 prices from the receipt and estimates the total in their head.",
          es: "Cada persona escoge 3 precios del recibo y estima el total mentalmente.",
        },
        {
          en: "Now add the exact amounts on paper, lining up the decimal points.",
          es: "Ahora sumen las cantidades exactas en papel, alineando los puntos decimales.",
        },
        {
          en: "Compare the estimate with the exact answer. How close were you?",
          es: "Comparen la estimación con la respuesta exacta. ¿Qué tan cerca quedaron?",
        },
      ],
      talkEn: "Why does lining up the decimal points matter when we add money?",
      talkEs: "¿Por qué importa alinear los puntos decimales al sumar dinero?",
    },
    {
      icon: "💵",
      titleEn: "Exact-Change Counter",
      titleEs: "El cambio exacto",
      materialsEn: "A few coins and bills (or paper play money)",
      materialsEs: "Algunas monedas y billetes (o dinero de papel)",
      minutes: 10,
      steps: [
        {
          en: "One person is the cashier. Price an item at something like $3.67.",
          es: "Una persona es el cajero. Pongan un precio como $3.67 a un objeto.",
        },
        {
          en: "Pay with a $5 bill. The student computes the change on paper by subtracting decimals.",
          es: "Paguen con un billete de $5. El estudiante calcula el cambio restando decimales en papel.",
        },
        {
          en: "Count the real coins to check. Switch roles and try a new price.",
          es: "Cuenten las monedas para comprobar. Cambien de papel y prueben otro precio.",
        },
      ],
      talkEn: "What is a quick way to check change without redoing the whole subtraction?",
      talkEs: "¿Cuál es una forma rápida de revisar el cambio sin repetir toda la resta?",
    },
    {
      icon: "⚖️",
      titleEn: "Kitchen-Scale Math",
      titleEs: "Matemáticas con la balanza",
      materialsEn: "Kitchen scale (or nutrition labels), two foods",
      materialsEs: "Balanza de cocina (o etiquetas de alimentos), dos alimentos",
      minutes: 10,
      steps: [
        {
          en: "Weigh two items (or read two label weights), like 1.4 lb and 0.75 lb.",
          es: "Pesen dos artículos (o lean dos etiquetas), por ejemplo 1.4 lb y 0.75 lb.",
        },
        {
          en: "Add the weights on paper. Then find how much heavier one is than the other.",
          es: "Sumen los pesos en papel. Luego calculen cuánto más pesa uno que el otro.",
        },
        {
          en: "Estimate first each time, then compute. Compare estimates with exact answers.",
          es: "Estimen primero cada vez y luego calculen. Comparen las estimaciones con las respuestas exactas.",
        },
      ],
      talkEn: "When is an estimate good enough, and when do we need the exact decimal?",
      talkEs: "¿Cuándo basta una estimación y cuándo necesitamos el decimal exacto?",
    },
  ],
  division: [
    {
      icon: "🍬",
      titleEn: "Snack Divider",
      titleEs: "Reparte la merienda",
      materialsEn: "A bag of small snacks (crackers, grapes, cereal)",
      materialsEs: "Una bolsa de meriendas pequeñas (galletas, uvas, cereal)",
      minutes: 10,
      steps: [
        {
          en: "Count the snacks in the bag — the bigger the number, the better.",
          es: "Cuenten las meriendas de la bolsa; entre más grande el número, mejor.",
        },
        {
          en: "Divide them equally among everyone at the table, one round at a time.",
          es: "Repártanlas en partes iguales entre todos, una ronda a la vez.",
        },
        {
          en: "Write the division problem it matches, including the remainder. Who gets the leftovers?",
          es: "Escriban la división que corresponde, con el residuo. ¿Quién se queda con lo que sobra?",
        },
      ],
      talkEn: "What does the remainder MEAN here? What are fair ways to handle it?",
      talkEs: "¿Qué SIGNIFICA el residuo aquí? ¿Cuáles son formas justas de repartirlo?",
    },
    {
      icon: "🥚",
      titleEn: "Egg-Carton Groups",
      titleEs: "Grupos con el cartón de huevos",
      materialsEn: "An empty egg carton, dry beans or coins",
      materialsEs: "Un cartón de huevos vacío, frijoles secos o monedas",
      minutes: 10,
      steps: [
        {
          en: "Grab a big handful of beans and count them — say you get 74.",
          es: "Tomen un puñado grande de frijoles y cuéntenlos; digamos que salen 74.",
        },
        {
          en: "Fill the carton cups evenly, one bean per cup, around and around.",
          es: "Llenen los espacios del cartón por igual, un frijol por espacio, ronda tras ronda.",
        },
        {
          en: "Write the result as division: 74 ÷ 12. How many in each cup, and how many left over?",
          es: "Escríbanlo como división: 74 ÷ 12. ¿Cuántos en cada espacio y cuántos sobran?",
        },
      ],
      talkEn: "How is dealing beans into cups the same as the division algorithm on paper?",
      talkEs: "¿En qué se parece repartir frijoles a la división escrita en papel?",
    },
    {
      icon: "🎉",
      titleEn: "Party Planner",
      titleEs: "Planificador de fiesta",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Invent a party: 58 guests are coming, and each table seats 8.",
          es: "Inventen una fiesta: vienen 58 invitados y cada mesa tiene 8 asientos.",
        },
        {
          en: "Divide to find how many tables you need. What does the remainder tell you?",
          es: "Dividan para saber cuántas mesas se necesitan. ¿Qué les dice el residuo?",
        },
        {
          en: "Change the numbers (more guests, bigger tables) and solve again together.",
          es: "Cambien los números (más invitados, mesas más grandes) y resuelvan otra vez juntos.",
        },
      ],
      talkEn: "Why do we ROUND UP the number of tables even when the remainder is small?",
      talkEs: "¿Por qué REDONDEAMOS HACIA ARRIBA el número de mesas aunque el residuo sea pequeño?",
    },
  ],
  factors: [
    {
      icon: "🫘",
      titleEn: "Rectangle Factor Hunt",
      titleEs: "Cacería de factores con rectángulos",
      materialsEn: "24 small objects (beans, coins, pasta)",
      materialsEs: "24 objetos pequeños (frijoles, monedas, pasta)",
      minutes: 10,
      steps: [
        {
          en: "Arrange all 24 objects into a rectangle — for example, 4 rows of 6.",
          es: "Acomoden los 24 objetos en un rectángulo; por ejemplo, 4 filas de 6.",
        },
        {
          en: "Find EVERY rectangle you can make with all 24. Each one shows a factor pair!",
          es: "Encuentren TODOS los rectángulos posibles con los 24. ¡Cada uno muestra un par de factores!",
        },
        {
          en: "List the factor pairs you found. Try again with 18 or 30 objects.",
          es: "Anoten los pares de factores que encontraron. Repitan con 18 o 30 objetos.",
        },
      ],
      talkEn:
        "Which numbers make only ONE rectangle (a single row)? What are those numbers called?",
      talkEs:
        "¿Qué números solo forman UN rectángulo (una sola fila)? ¿Cómo se llaman esos números?",
    },
    {
      icon: "👏",
      titleEn: "Clap Together (LCM)",
      titleEs: "Aplaudir juntos (mcm)",
      materialsEn: "Just your hands",
      materialsEs: "Solo sus manos",
      minutes: 5,
      steps: [
        {
          en: "Count out loud together from 1. One person claps on every multiple of 4.",
          es: "Cuenten en voz alta desde 1. Una persona aplaude en cada múltiplo de 4.",
        },
        {
          en: "The other person claps on every multiple of 6.",
          es: "La otra persona aplaude en cada múltiplo de 6.",
        },
        {
          en: "Notice the first number where you BOTH clap. That is the least common multiple!",
          es: "Fíjense en el primer número donde aplauden LOS DOS. ¡Ese es el mínimo común múltiplo!",
        },
      ],
      talkEn: "When will you clap together again after the first time? Do you see a pattern?",
      talkEs: "¿Cuándo volverán a aplaudir juntos después de la primera vez? ¿Ven un patrón?",
    },
    {
      icon: "🚪",
      titleEn: "Prime Detective",
      titleEs: "Detective de primos",
      materialsEn: "Numbers around you: doors, license plates, cabinets",
      materialsEs: "Números a su alrededor: puertas, placas, alacenas",
      minutes: 10,
      steps: [
        {
          en: "Find a number around the house or street — an address, a page number, a jersey.",
          es: "Busquen un número en la casa o la calle: una dirección, una página, una camiseta.",
        },
        {
          en: "Decide together: prime or composite? Prove it by hunting for factors.",
          es: "Decidan juntos: ¿primo o compuesto? Demuéstrenlo buscando factores.",
        },
        {
          en: "Take turns finding numbers for each other. Explain every answer out loud.",
          es: "Túrnense para buscar números. Expliquen cada respuesta en voz alta.",
        },
      ],
      talkEn: "Why does checking factors up to half the number (or its square root) find them all?",
      talkEs: "¿Por qué basta revisar factores hasta la mitad del número para encontrarlos todos?",
    },
  ],
  exponents: [
    {
      icon: "📄",
      titleEn: "Paper-Folding Powers",
      titleEs: "Potencias al doblar papel",
      materialsEn: "One sheet of paper",
      materialsEs: "Una hoja de papel",
      minutes: 5,
      steps: [
        {
          en: "Fold the paper in half and count the layers. Fold again. And again.",
          es: "Doblen la hoja a la mitad y cuenten las capas. Doblen otra vez. Y otra.",
        },
        {
          en: "Record the layers after each fold: 2, 4, 8, 16… Write each as a power of 2.",
          es: "Anoten las capas tras cada doblez: 2, 4, 8, 16… Escriban cada una como potencia de 2.",
        },
        {
          en: "Predict the layers for 7 folds (2⁷) before you run out of paper. Compute it!",
          es: "Predigan las capas con 7 dobleces (2⁷) antes de que el papel no dé más. ¡Calcúlenlo!",
        },
      ],
      talkEn: "Why does the paper get impossible to fold so fast? What does that say about powers?",
      talkEs:
        "¿Por qué tan pronto ya no se puede doblar el papel? ¿Qué nos dice eso de las potencias?",
    },
    {
      icon: "🍚",
      titleEn: "The Doubling Rice Story",
      titleEs: "El arroz que se duplica",
      materialsEn: "A few grains of rice (or draw dots), paper",
      materialsEs: "Unos granos de arroz (o dibujen puntos), papel",
      minutes: 10,
      steps: [
        {
          en: "Start a story: day 1 you get 1 grain of rice, and it doubles every day.",
          es: "Empiecen un cuento: el día 1 reciben 1 grano de arroz, y cada día se duplica.",
        },
        {
          en: "Make a table for days 1-7. Write each amount as a power of 2.",
          es: "Hagan una tabla para los días 1 a 7. Escriban cada cantidad como potencia de 2.",
        },
        {
          en: "Predict day 10 and day 20 WITHOUT listing every day. How big do the numbers get?",
          es: "Predigan el día 10 y el día 20 SIN escribir todos los días. ¿Qué tan grandes se ponen los números?",
        },
      ],
      talkEn:
        "Would you rather have $100 today or 1¢ doubled every day for 3 weeks? Prove your choice!",
      talkEs: "¿Prefieren $100 hoy o 1¢ duplicado cada día por 3 semanas? ¡Demuestren su elección!",
    },
    {
      icon: "📣",
      titleEn: "How a Rumor Grows",
      titleEs: "Cómo crece un rumor",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Imagine one person tells a rumor to 3 friends. Each friend tells 3 more.",
          es: "Imaginen que una persona cuenta un rumor a 3 amigos. Cada amigo se lo cuenta a 3 más.",
        },
        {
          en: "Draw the tree for 3 rounds. Count the people told in each round: 3, 9, 27.",
          es: "Dibujen el árbol de 3 rondas. Cuenten las personas de cada ronda: 3, 9, 27.",
        },
        {
          en: "Write each round as a power of 3. Predict round 5 without drawing it.",
          es: "Escriban cada ronda como potencia de 3. Predigan la ronda 5 sin dibujarla.",
        },
      ],
      talkEn: "3⁴ means 3 × 3 × 3 × 3 — not 3 × 4. How does the rumor tree SHOW that?",
      talkEs: "3⁴ significa 3 × 3 × 3 × 3, no 3 × 4. ¿Cómo lo DEMUESTRA el árbol del rumor?",
    },
  ],
  expressions: [
    {
      icon: "🍔",
      titleEn: "Menu Math Machine",
      titleEs: "La máquina del menú",
      materialsEn: "A takeout menu or grocery flyer, paper",
      materialsEs: "Un menú de comida o folleto del súper, papel",
      minutes: 10,
      steps: [
        {
          en: "Plan a pretend family order: for example, 3 tacos and 2 drinks.",
          es: "Planeen un pedido imaginario: por ejemplo, 3 tacos y 2 bebidas.",
        },
        {
          en: "Write it as an expression with variables: 3t + 2d, where t and d are the prices.",
          es: "Escríbanlo como expresión con variables: 3t + 2d, donde t y d son los precios.",
        },
        {
          en: "Look up the real prices and evaluate the expression. Change the order and re-evaluate.",
          es: "Busquen los precios reales y evalúen la expresión. Cambien el pedido y evalúen de nuevo.",
        },
      ],
      talkEn:
        "What do the variables stand for? Why is writing 3t faster than writing the price 3 times?",
      talkEs:
        "¿Qué representan las variables? ¿Por qué escribir 3t es más rápido que escribir el precio 3 veces?",
    },
    {
      icon: "🎂",
      titleEn: "Age Expressions",
      titleEs: "Expresiones de edades",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 5,
      steps: [
        {
          en: "Let x stand for the student's age. Write every family member's age using x.",
          es: "Que x sea la edad del estudiante. Escriban la edad de cada familiar usando x.",
        },
        {
          en: "For example, a parent might be x + 27, a little cousin x − 5.",
          es: "Por ejemplo, un padre podría ser x + 27, y un primito x − 5.",
        },
        {
          en: "Substitute the student's real age for x and check every expression.",
          es: "Sustituyan la edad real del estudiante por x y comprueben cada expresión.",
        },
      ],
      talkEn: "What will each expression equal in 10 years? Does the '+ 27' part ever change?",
      talkEs: "¿Cuánto valdrá cada expresión en 10 años? ¿La parte '+ 27' cambia alguna vez?",
    },
    {
      icon: "🧺",
      titleEn: "Laundry Variables",
      titleEs: "Variables en la ropa",
      materialsEn: "A laundry basket (or a drawer of clothes)",
      materialsEs: "Un cesto de ropa (o un cajón)",
      minutes: 10,
      steps: [
        {
          en: "Say each shirt has 4 buttons. Write an expression for the buttons on s shirts: 4s.",
          es: "Digamos que cada camisa tiene 4 botones. Escriban una expresión para los botones de s camisas: 4s.",
        },
        {
          en: "Count the real shirts and evaluate your expression.",
          es: "Cuenten las camisas reales y evalúen su expresión.",
        },
        {
          en: "Invent a two-part expression, like 4s + 2p for shirts and pants pockets, and evaluate it.",
          es: "Inventen una expresión de dos partes, como 4s + 2p para camisas y bolsillos de pantalones, y evalúenla.",
        },
      ],
      talkEn:
        "In 4s + 2p, which numbers are coefficients? What happens if s changes but p doesn't?",
      talkEs: "En 4s + 2p, ¿cuáles números son coeficientes? ¿Qué pasa si s cambia pero p no?",
    },
  ],
  equations: [
    {
      icon: "🧥",
      titleEn: "Hanger Balance",
      titleEs: "La percha en equilibrio",
      materialsEn: "A clothes hanger, 2 plastic bags, small identical objects",
      materialsEs: "Una percha, 2 bolsas plásticas, objetos pequeños iguales",
      minutes: 15,
      steps: [
        {
          en: "Hang a bag on each end of the hanger and hold it up like a balance scale.",
          es: "Cuelguen una bolsa en cada extremo de la percha y sosténganla como balanza.",
        },
        {
          en: "Put 7 coins on one side, and 3 coins plus a 'mystery clip' of coins on the other until it balances.",
          es: "Pongan 7 monedas de un lado, y del otro 3 monedas más un 'clip misterioso' de monedas hasta equilibrar.",
        },
        {
          en: "Write the equation (3 + m = 7) and solve. Check by opening the mystery clip!",
          es: "Escriban la ecuación (3 + m = 7) y resuélvanla. ¡Comprueben abriendo el clip misterioso!",
        },
      ],
      talkEn: "If we add 2 coins to one side only, what happens? What must we do to keep it fair?",
      talkEs:
        "Si agregamos 2 monedas a un solo lado, ¿qué pasa? ¿Qué debemos hacer para que siga justo?",
    },
    {
      icon: "🎒",
      titleEn: "Mystery Bag",
      titleEs: "La bolsa misteriosa",
      materialsEn: "A small bag, dry beans or coins",
      materialsEs: "Una bolsa pequeña, frijoles secos o monedas",
      minutes: 10,
      steps: [
        {
          en: "Secretly put some beans in the bag. Place the bag plus 4 loose beans on the table.",
          es: "Pongan en secreto algunos frijoles en la bolsa. Coloquen la bolsa más 4 frijoles sueltos en la mesa.",
        },
        {
          en: "Give the clue: 'The bag plus these 4 makes 10 in all.' The student writes b + 4 = 10.",
          es: "Den la pista: 'La bolsa más estos 4 hacen 10 en total.' El estudiante escribe b + 4 = 10.",
        },
        {
          en: "Solve, then open the bag to check. Switch roles and make a harder clue.",
          es: "Resuelvan y abran la bolsa para comprobar. Cambien de papel e inventen una pista más difícil.",
        },
      ],
      talkEn: "How did you 'undo' the + 4? What operation undoes adding?",
      talkEs: "¿Cómo 'deshicieron' el + 4? ¿Qué operación deshace la suma?",
    },
    {
      icon: "🏦",
      titleEn: "Savings-Goal Solver",
      titleEs: "Meta de ahorro",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Pick something the student wants that costs real money — say $24.",
          es: "Escojan algo que el estudiante quiera y que cueste dinero real; digamos $24.",
        },
        {
          en: "Count what they have saved — say $9. Write the equation: 9 + n = 24.",
          es: "Cuenten lo que ya tienen ahorrado; digamos $9. Escriban la ecuación: 9 + n = 24.",
        },
        {
          en: "Solve for n together, then plan how to earn it: if a chore pays $3, how many chores?",
          es: "Resuelvan n juntos y planeen cómo ganarlo: si un quehacer paga $3, ¿cuántos quehaceres?",
        },
      ],
      talkEn:
        "The chore question is a NEW equation — 3c = 15. How are the two equations different?",
      talkEs:
        "La pregunta de los quehaceres es una ecuación NUEVA: 3c = 15. ¿En qué se diferencian las dos?",
    },
  ],
  inequalities: [
    {
      icon: "🎢",
      titleEn: "Limit Hunt",
      titleEs: "Cacería de límites",
      materialsEn: "Labels and signs around the house",
      materialsEs: "Etiquetas y letreros de la casa",
      minutes: 10,
      steps: [
        {
          en: "Hunt for real limits: an age rating on a game, a weight limit on a chair, a 'max 10 items' sign.",
          es: "Busquen límites reales: la edad de un videojuego, el peso máximo de una silla, un letrero de 'máximo 10'.",
        },
        {
          en: "Write each one as an inequality, like a ≥ 13 or w ≤ 250.",
          es: "Escriban cada uno como desigualdad, por ejemplo a ≥ 13 o w ≤ 250.",
        },
        {
          en: "For each, name 2 numbers that are allowed and 2 that are not.",
          es: "Para cada una, digan 2 números permitidos y 2 que no.",
        },
      ],
      talkEn: "Is the boundary number itself allowed? How does the symbol tell you?",
      talkEs: "¿El número del límite está permitido? ¿Cómo lo indica el símbolo?",
    },
    {
      icon: "🌡️",
      titleEn: "Weather Watch",
      titleEs: "Vigilando el clima",
      materialsEn: "A weather app or window",
      materialsEs: "Una app del clima o la ventana",
      minutes: 5,
      steps: [
        {
          en: "Look up today's high temperature and this week's forecast.",
          es: "Busquen la temperatura máxima de hoy y el pronóstico de la semana.",
        },
        {
          en: "Write true inequalities about it: 'Every day this week, t > 60.'",
          es: "Escriban desigualdades verdaderas: 'Todos los días de esta semana, t > 60.'",
        },
        {
          en: "Each person writes one true and one FALSE inequality; the others catch the false one.",
          es: "Cada persona escribe una desigualdad verdadera y una FALSA; los demás descubren la falsa.",
        },
      ],
      talkEn: "How many numbers make t > 60 true? Can you list them all?",
      talkEs: "¿Cuántos números hacen verdadera t > 60? ¿Pueden escribirlos todos?",
    },
    {
      icon: "🛍️",
      titleEn: "Budget Boundaries",
      titleEs: "Presupuesto con límites",
      materialsEn: "A store flyer or pantry prices, paper",
      materialsEs: "Un folleto de la tienda o precios de la despensa, papel",
      minutes: 10,
      steps: [
        {
          en: "Set a pretend budget: you may spend AT MOST $15 on snacks (c ≤ 15).",
          es: "Fijen un presupuesto imaginario: pueden gastar MÁXIMO $15 en meriendas (c ≤ 15).",
        },
        {
          en: "Build 3 different snack combos and check each against the inequality.",
          es: "Armen 3 combinaciones distintas de meriendas y compárenlas con la desigualdad.",
        },
        {
          en: "Find a combo that costs EXACTLY $15. Is it allowed? Why?",
          es: "Encuentren una combinación que cueste EXACTAMENTE $15. ¿Está permitida? ¿Por qué?",
        },
      ],
      talkEn: "How would the game change if the rule were c < 15 instead of c ≤ 15?",
      talkEs: "¿Cómo cambiaría el juego si la regla fuera c < 15 en vez de c ≤ 15?",
    },
  ],
  properties: [
    {
      icon: "🍱",
      titleEn: "Snack-Pack Split",
      titleEs: "Reparto de paquetes",
      materialsEn: "Crackers and cheese (or any two small snacks)",
      materialsEs: "Galletas y queso (o dos meriendas pequeñas)",
      minutes: 10,
      steps: [
        {
          en: "Make 4 snack packs, each with 3 crackers and 2 cheese cubes.",
          es: "Armen 4 paquetes, cada uno con 3 galletas y 2 cubos de queso.",
        },
        {
          en: "Count the total two ways: 4 × (3 + 2), or 4 × 3 plus 4 × 2.",
          es: "Cuenten el total de dos maneras: 4 × (3 + 2), o 4 × 3 más 4 × 2.",
        },
        {
          en: "Show that both ways give 20. That is the distributive property on a plate!",
          es: "Demuestren que las dos formas dan 20. ¡Esa es la propiedad distributiva en un plato!",
        },
      ],
      talkEn: "Which way of counting felt easier? When might the other way be easier?",
      talkEs: "¿Qué forma de contar fue más fácil? ¿Cuándo convendría la otra?",
    },
    {
      icon: "🁡",
      titleEn: "Array Flip",
      titleEs: "Voltea el arreglo",
      materialsEn: "About 24 coins, beans, or cereal pieces",
      materialsEs: "Unas 24 monedas, frijoles o piezas de cereal",
      minutes: 5,
      steps: [
        {
          en: "Build a rectangle of 6 rows with 4 objects each. Count: 6 × 4.",
          es: "Armen un rectángulo de 6 filas con 4 objetos cada una. Cuenten: 6 × 4.",
        },
        {
          en: "Turn the whole rectangle sideways. Now it is 4 rows of 6: 4 × 6.",
          es: "Giren todo el rectángulo. Ahora son 4 filas de 6: 4 × 6.",
        },
        {
          en: "Did the total change? Name the property that says it can't.",
          es: "¿Cambió el total? Digan cómo se llama la propiedad que dice que no puede cambiar.",
        },
      ],
      talkEn: "Does turning work for division too? Is 24 ÷ 6 the same as 6 ÷ 24?",
      talkEs: "¿Girar funciona también con la división? ¿24 ÷ 6 es igual que 6 ÷ 24?",
    },
    {
      icon: "🛒",
      titleEn: "Mental-Math Shortcut",
      titleEs: "Atajo de cálculo mental",
      materialsEn: "Paper (a calculator to check)",
      materialsEs: "Papel (una calculadora para comprobar)",
      minutes: 10,
      steps: [
        {
          en: "Pose a store problem: 3 shirts at $4.98 each. No calculator yet!",
          es: "Planteen un problema: 3 camisas a $4.98 cada una. ¡Todavía sin calculadora!",
        },
        {
          en: "Use the shortcut: 3 × 5.00 = 15.00, then take away 3 × 0.02.",
          es: "Usen el atajo: 3 × 5.00 = 15.00, y luego quiten 3 × 0.02.",
        },
        {
          en: "Check on the calculator. Invent another 'almost round' price and do it again.",
          es: "Comprueben con la calculadora. Inventen otro precio 'casi redondo' y repitan.",
        },
      ],
      talkEn: "How did we use 3 × (5 − 0.02)? Why is that allowed?",
      talkEs: "¿Cómo usamos 3 × (5 − 0.02)? ¿Por qué se vale hacerlo?",
    },
  ],
  area: [
    {
      icon: "📐",
      titleEn: "Room Footprint",
      titleEs: "El plano de tu espacio",
      materialsEn: "A ruler or tape measure, paper",
      materialsEs: "Una regla o cinta métrica, papel",
      minutes: 15,
      steps: [
        {
          en: "Measure the length and width of a table, rug, or bed.",
          es: "Midan el largo y el ancho de una mesa, un tapete o una cama.",
        },
        {
          en: "Compute the area together. Draw and label a quick sketch.",
          es: "Calculen el área juntos. Hagan un dibujo rápido con etiquetas.",
        },
        {
          en: "Measure a second surface and compare: which has more area, and by how much?",
          es: "Midan otra superficie y comparen: ¿cuál tiene más área y por cuánto?",
        },
      ],
      talkEn: "Why is area measured in SQUARE units instead of plain inches?",
      talkEs: "¿Por qué el área se mide en unidades CUADRADAS y no en pulgadas simples?",
    },
    {
      icon: "✂️",
      titleEn: "Parallelogram Slide",
      titleEs: "El paralelogramo que se transforma",
      materialsEn: "Paper, scissors, ruler",
      materialsEs: "Papel, tijeras, regla",
      minutes: 10,
      steps: [
        {
          en: "Draw a slanted parallelogram on paper and cut it out.",
          es: "Dibujen un paralelogramo inclinado en papel y recórtenlo.",
        },
        {
          en: "Cut a straight triangle off one end and slide it to the other end.",
          es: "Corten un triángulo recto de un extremo y deslícenlo al otro extremo.",
        },
        {
          en: "Look: it is now a rectangle! Same paper, same area. So area = base × height.",
          es: "Miren: ¡ahora es un rectángulo! Mismo papel, misma área. Por eso área = base × altura.",
        },
      ],
      talkEn: "Why do we use the straight-up height instead of the slanted side?",
      talkEs: "¿Por qué usamos la altura vertical y no el lado inclinado?",
    },
    {
      icon: "🍫",
      titleEn: "Cracker Triangles",
      titleEs: "Triángulos de galleta",
      materialsEn: "Square or rectangular crackers (or sticky notes)",
      materialsEs: "Galletas cuadradas o rectangulares (o notas adhesivas)",
      minutes: 5,
      steps: [
        {
          en: "Take a rectangular cracker. Its area is length × width.",
          es: "Tomen una galleta rectangular. Su área es largo × ancho.",
        },
        {
          en: "Break (or cut) it corner to corner into two triangles.",
          es: "Pártanla (o córtenla) de esquina a esquina en dos triángulos.",
        },
        {
          en: "Each triangle is HALF the rectangle. So triangle area = ½ × base × height. Eat the evidence!",
          es: "Cada triángulo es la MITAD del rectángulo. Por eso el área del triángulo = ½ × base × altura. ¡Cómanse la evidencia!",
        },
      ],
      talkEn: "If a triangle's area is 6 square units, what could its rectangle have been?",
      talkEs: "Si el área de un triángulo es 6 unidades cuadradas, ¿cómo pudo ser su rectángulo?",
    },
  ],
  volume: [
    {
      icon: "🥣",
      titleEn: "Box Hunt",
      titleEs: "Cacería de cajas",
      materialsEn: "Two food boxes (cereal, pasta), ruler",
      materialsEs: "Dos cajas de comida (cereal, pasta), regla",
      minutes: 15,
      steps: [
        {
          en: "Measure the length, width, and height of each box, to the nearest half inch.",
          es: "Midan el largo, el ancho y la altura de cada caja, a la media pulgada más cercana.",
        },
        {
          en: "Compute each volume: V = l × w × h. Fractions are welcome!",
          es: "Calculen cada volumen: V = l × a × h. ¡Las fracciones son bienvenidas!",
        },
        {
          en: "Predict first which box holds more, then let the numbers decide. Were your eyes right?",
          es: "Primero predigan cuál caja cabe más, y luego dejen que los números decidan. ¿Acertaron sus ojos?",
        },
      ],
      talkEn: "Could a taller box have LESS volume than a shorter one? How?",
      talkEs: "¿Podría una caja más alta tener MENOS volumen que una más baja? ¿Cómo?",
    },
    {
      icon: "🧊",
      titleEn: "Ice-Cube Estimate",
      titleEs: "Estimar con cubitos",
      materialsEn: "Ice cubes (or sugar cubes, dice), a small container",
      materialsEs: "Cubitos de hielo (o de azúcar, o dados), un recipiente pequeño",
      minutes: 10,
      steps: [
        {
          en: "Predict: how many cubes will fill the container in neat layers?",
          es: "Predigan: ¿cuántos cubitos llenarán el recipiente en capas ordenadas?",
        },
        {
          en: "Fill the bottom layer and count it. Count how many layers fit.",
          es: "Llenen la primera capa y cuéntenla. Cuenten cuántas capas caben.",
        },
        {
          en: "Multiply layer × layers and compare with your prediction. That is what l × w × h counts!",
          es: "Multipliquen capa × capas y comparen con su predicción. ¡Eso es lo que cuenta l × a × h!",
        },
      ],
      talkEn: "Why does multiplying the bottom layer by the height give the whole volume?",
      talkEs: "¿Por qué multiplicar la primera capa por la altura da todo el volumen?",
    },
    {
      icon: "🎁",
      titleEn: "Build the Half-Inch Box",
      titleEs: "La caja de media pulgada",
      materialsEn: "Paper, ruler, tape, scissors",
      materialsEs: "Papel, regla, cinta adhesiva, tijeras",
      minutes: 15,
      steps: [
        {
          en: "Together, draw a box pattern 3 in long, 2 in wide, 1½ in tall.",
          es: "Juntos, dibujen el patrón de una caja de 3 pulg de largo, 2 de ancho y 1½ de alto.",
        },
        {
          en: "Cut, fold, and tape it into a real box.",
          es: "Corten, doblen y péguenla hasta formar una caja de verdad.",
        },
        {
          en: "Compute its volume with the fraction: 3 × 2 × 1½. What tiny thing fits inside?",
          es: "Calculen su volumen con la fracción: 3 × 2 × 1½. ¿Qué cosita cabe adentro?",
        },
      ],
      talkEn:
        "How is multiplying by 1½ different from multiplying by 2? What did it do to the volume?",
      talkEs: "¿En qué se diferencia multiplicar por 1½ y por 2? ¿Qué le hizo al volumen?",
    },
  ],
  "surface-area": [
    {
      icon: "📦",
      titleEn: "Unfold a Box",
      titleEs: "Desarma una caja",
      materialsEn: "An empty cereal or snack box, scissors",
      materialsEs: "Una caja vacía de cereal o galletas, tijeras",
      minutes: 15,
      steps: [
        {
          en: "Carefully open the box along its seams and flatten it out. That flat shape is a NET.",
          es: "Abran la caja con cuidado por las uniones y aplánenla. Esa figura plana es una PLANTILLA (red).",
        },
        {
          en: "Count the faces and label each one: top, bottom, front, back, sides.",
          es: "Cuenten las caras y márquenlas: arriba, abajo, frente, atrás, lados.",
        },
        {
          en: "Measure and add the area of every face. That total is the surface area!",
          es: "Midan y sumen el área de cada cara. ¡Ese total es el área de superficie!",
        },
      ],
      talkEn: "Which faces are twins (same size)? How can twins make the adding faster?",
      talkEs:
        "¿Qué caras son gemelas (del mismo tamaño)? ¿Cómo ayudan las gemelas a sumar más rápido?",
    },
    {
      icon: "🎁",
      titleEn: "Gift-Wrap Estimator",
      titleEs: "Estimando papel de regalo",
      materialsEn: "A small box, newspaper or wrapping paper, ruler",
      materialsEs: "Una caja pequeña, periódico o papel de regalo, regla",
      minutes: 15,
      steps: [
        {
          en: "Before wrapping, compute the box's surface area: the sum of all 6 face areas.",
          es: "Antes de envolver, calculen el área de superficie de la caja: la suma de las 6 caras.",
        },
        {
          en: "Cut a piece of paper you think will just barely cover it.",
          es: "Corten un pedazo de papel que apenas alcance para cubrirla.",
        },
        {
          en: "Wrap it! Too much overlap or a bald spot? Compare with your computed answer.",
          es: "¡Envuélvanla! ¿Sobró mucho o faltó? Comparen con el resultado calculado.",
        },
      ],
      talkEn: "Why do wrappers need surface area but the box's CONTENTS need volume?",
      talkEs: "¿Por qué envolver usa el área de superficie pero el CONTENIDO usa el volumen?",
    },
    {
      icon: "🎨",
      titleEn: "Paint-Job Planner",
      titleEs: "Plan de pintura",
      materialsEn: "A shoebox (or any box), ruler, paper",
      materialsEs: "Una caja de zapatos (o cualquier caja), regla, papel",
      minutes: 10,
      steps: [
        {
          en: "Pretend you will paint the shoebox. Measure its faces.",
          es: "Imaginen que van a pintar la caja. Midan sus caras.",
        },
        {
          en: "Find the total area to paint — but wait: does the BOTTOM get painted? Decide together.",
          es: "Calculen el área total por pintar. Un momento: ¿se pinta la parte de ABAJO? Decidan juntos.",
        },
        {
          en: "If one jar of paint covers 100 square inches, how many jars do you need?",
          es: "Si un frasco de pintura cubre 100 pulgadas cuadradas, ¿cuántos frascos necesitan?",
        },
      ],
      talkEn: "Painters, wrappers, and box-makers all use surface area. Who else might?",
      talkEs:
        "Pintores, envolvedores y fabricantes de cajas usan el área de superficie. ¿Quién más la usará?",
    },
  ],
  statistics: [
    {
      icon: "📊",
      titleEn: "Family Data Night",
      titleEs: "Noche de datos en familia",
      materialsEn: "Paper and pencil, the whole family",
      materialsEs: "Papel y lápiz, toda la familia",
      minutes: 15,
      steps: [
        {
          en: "Pick a question with NUMBER answers: hours of sleep, shoe size, minutes to get to school.",
          es: "Escojan una pregunta con respuestas NUMÉRICAS: horas de sueño, talla de zapato, minutos a la escuela.",
        },
        {
          en: "Collect an answer from everyone (call a relative to grow the data set!).",
          es: "Reúnan la respuesta de todos (¡llamen a un pariente para tener más datos!).",
        },
        {
          en: "Draw a quick dot plot and find the median together.",
          es: "Hagan un diagrama de puntos rápido y encuentren la mediana juntos.",
        },
      ],
      talkEn: "Is there an outlier in our family data? What is its story?",
      talkEs: "¿Hay un valor atípico en los datos de la familia? ¿Cuál es su historia?",
    },
    {
      icon: "🎲",
      titleEn: "Roll & Record",
      titleEs: "Lanza y registra",
      materialsEn: "One die (or number cards 1-6), paper",
      materialsEs: "Un dado (o tarjetas del 1 al 6), papel",
      minutes: 10,
      steps: [
        {
          en: "Take turns rolling the die 20 times total, tallying each result.",
          es: "Túrnense para lanzar el dado 20 veces en total, anotando cada resultado.",
        },
        {
          en: "Turn the tallies into a dot plot. Describe its shape: flat, bumpy, lopsided?",
          es: "Conviertan el conteo en un diagrama de puntos. Describan su forma: ¿plana, con picos, cargada a un lado?",
        },
        {
          en: "Find the mode and the median of your 20 rolls.",
          es: "Encuentren la moda y la mediana de sus 20 lanzamientos.",
        },
      ],
      talkEn: "If we rolled 100 more times, what do you think the plot would look like? Why?",
      talkEs: "Si lanzáramos 100 veces más, ¿cómo creen que se vería el diagrama? ¿Por qué?",
    },
    {
      icon: "❓",
      titleEn: "Statistical or Not?",
      titleEs: "¿Estadística o no?",
      materialsEn: "Just conversation",
      materialsEs: "Solo conversación",
      minutes: 5,
      steps: [
        {
          en: "Take turns asking questions: 'How old am I?' vs 'How old are the people in our building?'",
          es: "Túrnense haciendo preguntas: '¿Cuántos años tengo?' contra '¿Cuántos años tienen los vecinos del edificio?'",
        },
        {
          en: "For each, decide: statistical (answers VARY) or not (one fixed answer)?",
          es: "Para cada una decidan: ¿es estadística (las respuestas VARÍAN) o no (una sola respuesta)?",
        },
        {
          en: "Keep score together: 5 statistical questions invented = you win as a team.",
          es: "Lleven la cuenta juntos: 5 preguntas estadísticas inventadas = ganan como equipo.",
        },
      ],
      talkEn: "What one word turns a fixed question into a statistical one?",
      talkEs: "¿Qué palabra convierte una pregunta fija en una estadística?",
    },
  ],
  "number-line": [
    {
      icon: "🌍",
      titleEn: "World Temperature Tour",
      titleEs: "Gira de temperaturas del mundo",
      materialsEn: "A weather app, paper",
      materialsEs: "Una app del clima, papel",
      minutes: 10,
      steps: [
        {
          en: "Look up today's temperature in 4 cities — include somewhere freezing (try Reykjavik or Anchorage).",
          es: "Busquen la temperatura de hoy en 4 ciudades; incluyan un lugar helado (prueben Reikiavik o Anchorage).",
        },
        {
          en: "Draw a vertical number line and plot all 4 temperatures, including negatives.",
          es: "Dibujen una recta numérica vertical y ubiquen las 4 temperaturas, incluidas las negativas.",
        },
        {
          en: "Order them from coldest to warmest. Which is closest to zero?",
          es: "Ordénenlas de la más fría a la más cálida. ¿Cuál está más cerca de cero?",
        },
      ],
      talkEn: "Which city's temperature has the greatest absolute value? Is it the warmest?",
      talkEs: "¿Qué ciudad tiene la temperatura con mayor valor absoluto? ¿Es la más cálida?",
    },
    {
      icon: "🏦",
      titleEn: "Money In, Money Out",
      titleEs: "Dinero que entra y sale",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Start a pretend account at $0. Take turns narrating: 'earned $5' (+5), 'bought a snack' (−3).",
          es: "Abran una cuenta imaginaria en $0. Túrnense narrando: 'gané $5' (+5), 'compré una merienda' (−3).",
        },
        {
          en: "Track each move on a number line, one hop at a time.",
          es: "Sigan cada movimiento en una recta numérica, salto por salto.",
        },
        {
          en: "After 6 moves, where did you land? Can the account go BELOW zero? What does that mean?",
          es: "Después de 6 movimientos, ¿dónde quedaron? ¿Puede la cuenta bajar de cero? ¿Qué significa eso?",
        },
      ],
      talkEn: "What real situations use numbers below zero besides money and temperature?",
      talkEs: "¿Qué situaciones reales usan números bajo cero además del dinero y la temperatura?",
    },
    {
      icon: "🪜",
      titleEn: "Hallway Number Line",
      titleEs: "Recta numérica en el pasillo",
      materialsEn: "Painter's tape or paper squares, a marker",
      materialsEs: "Cinta de pintor o cuadros de papel, un marcador",
      minutes: 15,
      steps: [
        {
          en: "Lay a number line on the floor from −5 to 5, with 0 in the middle.",
          es: "Armen una recta numérica en el piso de −5 a 5, con el 0 en el centro.",
        },
        {
          en: "Call out numbers to stand on: '−4!' Then: 'its opposite!' Then: 'a number with absolute value 2!'",
          es: "Digan números para pararse encima: '¡−4!' Luego: '¡su opuesto!' Luego: '¡un número con valor absoluto 2!'",
        },
        {
          en: "Switch callers. Add half steps (−2½) for a challenge.",
          es: "Cambien de locutor. Agreguen medios pasos (−2½) como reto.",
        },
      ],
      talkEn: "Why do −4 and 4 both have the same absolute value? Show it with your feet!",
      talkEs: "¿Por qué −4 y 4 tienen el mismo valor absoluto? ¡Demuéstrenlo con los pies!",
    },
  ],
  "coordinate-plane": [
    {
      icon: "🗺️",
      titleEn: "Treasure-Map Grid",
      titleEs: "Mapa del tesoro",
      materialsEn: "Graph paper (or draw a grid), a small 'treasure'",
      materialsEs: "Papel cuadriculado (o dibujen la cuadrícula), un 'tesoro' pequeño",
      minutes: 15,
      steps: [
        {
          en: "Draw a map of a room as a four-quadrant grid — the room's center is (0, 0).",
          es: "Dibujen el mapa de un cuarto como cuadrícula de cuatro cuadrantes; el centro del cuarto es (0, 0).",
        },
        {
          en: "One person hides the treasure and writes its ordered pair, like (−3, 2).",
          es: "Una persona esconde el tesoro y escribe su par ordenado, por ejemplo (−3, 2).",
        },
        {
          en: "The finder walks it out: 3 left, 2 forward. Swap roles!",
          es: "El buscador lo camina: 3 a la izquierda, 2 hacia adelante. ¡Cambien de papel!",
        },
      ],
      talkEn: "Why does (−3, 2) land somewhere different from (2, −3)? Does order matter?",
      talkEs: "¿Por qué (−3, 2) queda en un lugar distinto que (2, −3)? ¿Importa el orden?",
    },
    {
      icon: "🚢",
      titleEn: "Four-Quadrant Battleship",
      titleEs: "Batalla naval en cuatro cuadrantes",
      materialsEn: "Two pieces of graph paper, pencils, a book to block views",
      materialsEs: "Dos hojas cuadriculadas, lápices, un libro para tapar la vista",
      minutes: 15,
      steps: [
        {
          en: "Each player draws axes from −5 to 5 and secretly marks 3 'ships' (each 2 points long) on grid corners.",
          es: "Cada jugador dibuja ejes de −5 a 5 y marca en secreto 3 'barcos' (de 2 puntos cada uno) en esquinas de la cuadrícula.",
        },
        {
          en: "Take turns calling ordered pairs — '(−2, 4)!' — and answer 'splash' or 'hit'.",
          es: "Túrnense diciendo pares ordenados — '¡(−2, 4)!' — y respondan 'agua' o 'impacto'.",
        },
        {
          en: "Track every guess on your own grid. Play until every ship is found.",
          es: "Anoten cada intento en su propia cuadrícula. Jueguen hasta encontrar todos los barcos.",
        },
      ],
      talkEn:
        "Which quadrant did you avoid guessing in? What sign pattern does each quadrant have?",
      talkEs: "¿En qué cuadrante casi no intentaron? ¿Qué patrón de signos tiene cada cuadrante?",
    },
    {
      icon: "🖼️",
      titleEn: "Secret-Picture Points",
      titleEs: "El dibujo secreto de puntos",
      materialsEn: "Graph paper, pencil",
      materialsEs: "Papel cuadriculado, lápiz",
      minutes: 15,
      steps: [
        {
          en: "One person secretly plans a simple shape (a star, a boat, a letter) and lists its ordered pairs in order.",
          es: "Una persona planea en secreto una figura simple (una estrella, un barco, una letra) y anota sus pares ordenados en orden.",
        },
        {
          en: "Read the pairs aloud one at a time while the other plots and connects them.",
          es: "Lean los pares en voz alta uno por uno mientras la otra persona los ubica y los une.",
        },
        {
          en: "Reveal: did the picture come out right? Swap roles and use all four quadrants.",
          es: "Revelen: ¿salió bien el dibujo? Cambien de papel y usen los cuatro cuadrantes.",
        },
      ],
      talkEn:
        "Where did a wrong point send the drawing? How do coordinates make instructions exact?",
      talkEs:
        "¿A dónde mandó el dibujo un punto equivocado? ¿Cómo hacen exactas las instrucciones las coordenadas?",
    },
  ],
  fallback: [
    {
      icon: "🫙",
      titleEn: "Estimation Jar",
      titleEs: "El frasco de estimar",
      materialsEn: "A clear jar, small objects (pasta, buttons, cereal)",
      materialsEs: "Un frasco transparente, objetos pequeños (pasta, botones, cereal)",
      minutes: 10,
      steps: [
        {
          en: "Fill the jar partway with small objects. Everyone writes a secret estimate.",
          es: "Llenen parte del frasco con objetos pequeños. Cada quien escribe una estimación secreta.",
        },
        {
          en: "Count the objects together in groups of 10 — grouping makes big counts easy.",
          es: "Cuenten los objetos juntos en grupos de 10; agrupar facilita contar cantidades grandes.",
        },
        {
          en: "Compare every estimate to the real count. Whose strategy was strongest? Ask them to teach it.",
          es: "Comparen cada estimación con el conteo real. ¿Qué estrategia fue mejor? Pidan que la expliquen.",
        },
      ],
      talkEn:
        "What information did you use to estimate? What would make your next estimate better?",
      talkEs: "¿Qué información usaron para estimar? ¿Qué mejoraría su próxima estimación?",
    },
    {
      icon: "🃏",
      titleEn: "Target 100",
      titleEs: "Meta 100",
      materialsEn: "A deck of cards (face cards removed) or slips numbered 1-9",
      materialsEs: "Una baraja (sin figuras) o papelitos del 1 al 9",
      minutes: 10,
      steps: [
        {
          en: "Deal 4 cards face up where everyone can see them.",
          es: "Pongan 4 cartas boca arriba donde todos las vean.",
        },
        {
          en: "As a team, combine them with +, −, ×, ÷ to land as close to 100 as you can.",
          es: "En equipo, combínenlas con +, −, ×, ÷ para acercarse lo más posible a 100.",
        },
        {
          en: "Write the expression you built and check it respects order of operations. Deal again!",
          es: "Escriban la expresión que armaron y revisen que respete el orden de las operaciones. ¡Repartan otra vez!",
        },
      ],
      talkEn: "Which operation moved you the most? When did parentheses change everything?",
      talkEs: "¿Qué operación los acercó más? ¿Cuándo lo cambiaron todo los paréntesis?",
    },
    {
      icon: "🍽️",
      titleEn: "Math Around the Table",
      titleEs: "Matemáticas en la mesa",
      materialsEn: "Just conversation at a meal",
      materialsEs: "Solo conversación durante una comida",
      minutes: 5,
      steps: [
        {
          en: "At dinner, each person shares one place they used math today — cooking, shopping, work, games.",
          es: "En la cena, cada persona cuenta dónde usó matemáticas hoy: cocinando, comprando, en el trabajo, en juegos.",
        },
        {
          en: "The student explains what tonight's lesson is about in their own words.",
          es: "El estudiante explica de qué trata la lección de hoy con sus propias palabras.",
        },
        {
          en: "Together, hunt for one place THIS lesson's math shows up in your home.",
          es: "Juntos, busquen un lugar de la casa donde aparezcan las matemáticas de ESTA lección.",
        },
      ],
      talkEn: "Who in our family uses the most math at work? Ask them how!",
      talkEs: "¿Quién de la familia usa más matemáticas en su trabajo? ¡Pregúntenle cómo!",
    },
  ],
};

export function getFamilyActivities(topic) {
  return FAMILY_ACTIVITIES[topic] || FAMILY_ACTIVITIES.fallback;
}

/** One activity card: a friendly accordion with steps and a talk prompt. */
function renderFamilyActivityCard(act, idx) {
  const stepsHtml = act.steps
    .map(
      (s, i) => `
        <li class="fam-act-step">
          <span class="fam-act-step-num" aria-hidden="true">${i + 1}</span>
          <div>
            <p class="lang-en">${esc(s.en)}</p>
            <p class="lang-es" lang="es">${esc(s.es)}</p>
          </div>
        </li>`,
    )
    .join("");

  return `
    <details class="fam-act-card"${idx === 0 ? " open" : ""}>
      <summary class="fam-act-summary">
        <span class="fam-act-icon" aria-hidden="true">${act.icon}</span>
        <span class="fam-act-titles">
          <strong><span class="lang-en">${esc(act.titleEn)}</span><span class="lang-es" lang="es">${esc(act.titleEs)}</span></strong>
          <small class="fam-act-meta">
            <span class="fam-act-time">⏱️ ~${act.minutes} min</span>
            <span class="fam-act-materials"><span class="lang-en">🧰 ${esc(act.materialsEn)}</span><span class="lang-es" lang="es">🧰 ${esc(act.materialsEs)}</span></span>
          </small>
        </span>
        <span class="fam-act-chevron" aria-hidden="true">▾</span>
      </summary>
      <div class="fam-act-body">
        <ol class="fam-act-steps">${stepsHtml}</ol>
        <div class="fam-act-talk">
          <strong>💬 <span class="lang-en">Talk about it:</span><span class="lang-es" lang="es">Para conversar:</span></strong>
          <span class="lang-en">${esc(act.talkEn)}</span>
          <span class="lang-es" lang="es">${esc(act.talkEs)}</span>
        </div>
      </div>
    </details>`;
}

/**
 * The Family Activity Corner: three hands-on, no-device activities matched to
 * tonight's topic. Lives on the Together tab, after the guided practice.
 */
export function renderFamilyActivityCorner(topic) {
  const acts = getFamilyActivities(topic);
  return `
    <div class="fam-act-corner card-ish" aria-label="Family activity corner">
      <div class="fam-act-head">
        <span class="fam-act-badge">🏡 FAMILY ACTIVITY CORNER / RINCÓN DE ACTIVIDADES</span>
        <p class="fam-act-lead">
          <span class="lang-en">No screens needed — three quick activities with things already in your home. Pick ONE tonight!</span>
          <span class="lang-es" lang="es">Sin pantallas: tres actividades rápidas con cosas que ya tienen en casa. ¡Escojan UNA hoy!</span>
        </p>
      </div>
      ${acts.map((a, i) => renderFamilyActivityCard(a, i)).join("")}
    </div>`;
}

/**
 * Family Game Break — two built-in interactive games on the Together tab,
 * distinct from the Words tab's term↔definition matcher:
 *   1. Memory Flip: concentration pairs of "math twins" (expression ↔ value).
 *   2. True or False? Family Face-Off: turn-taking statements whose false
 *      halves come from the topic's real misconceptions, each with a why.
 * Collaborative and NEVER timed (site rule). Content is authored per topic
 * below; every pair and statement is checked arithmetic, not generated.
 */
const FAMILY_GAME_PAIRS = {
  ratios: [
    { a: "2 : 3 doubled", b: "4 : 6" },
    { a: "$6 for 3 lb", b: "$2 per lb" },
    { a: "1/2 as a percent", b: "50%" },
    { a: "3 to 4", b: "3 : 4" },
  ],
  fractions: [
    { a: "2 ÷ 1/4", b: "8" },
    { a: "1/2 of 12", b: "6" },
    { a: "3/6 simplified", b: "1/2" },
    { a: "1 ÷ 1/3", b: "3" },
  ],
  decimals: [
    { a: "0.5 + 0.25", b: "0.75" },
    { a: "1.2 × 10", b: "12" },
    { a: "$5.00 − $3.25", b: "$1.75" },
    { a: "0.30", b: "0.3" },
  ],
  division: [
    { a: "84 ÷ 4", b: "21" },
    { a: "75 ÷ 10", b: "7 R5" },
    { a: "600 ÷ 5", b: "120" },
    { a: "63 ÷ 7", b: "9" },
  ],
  factors: [
    { a: "GCF of 12 and 18", b: "6" },
    { a: "LCM of 4 and 6", b: "12" },
    { a: "A prime number", b: "13" },
    { a: "Factors of 10", b: "1, 2, 5, 10" },
  ],
  exponents: [
    { a: "2³", b: "8" },
    { a: "5²", b: "25" },
    { a: "10⁴", b: "10,000" },
    { a: "3 × 3 × 3", b: "3³" },
  ],
  expressions: [
    { a: "2x when x = 4", b: "8" },
    { a: "Coefficient of 5y", b: "5" },
    { a: "n + n + n", b: "3n" },
    { a: "Constant in 4x + 7", b: "7" },
  ],
  equations: [
    { a: "m + 4 = 10", b: "m = 6" },
    { a: "3k = 21", b: "k = 7" },
    { a: "y − 5 = 2", b: "y = 7" },
    { a: "n ÷ 2 = 8", b: "n = 16" },
  ],
  inequalities: [
    { a: "h ≥ 48: is 48 allowed?", b: "Yes" },
    { a: "t > 60: is 60 allowed?", b: "No" },
    { a: "x < 10: biggest whole number", b: "9" },
    { a: "c ≤ 15: the limit itself", b: "Allowed" },
  ],
  properties: [
    { a: "4 × (3 + 2)", b: "4 × 3 + 4 × 2" },
    { a: "6 × 4", b: "4 × 6" },
    { a: "9 + 0", b: "9" },
    { a: "7 × 1", b: "7" },
  ],
  area: [
    { a: "Rectangle 6 by 4", b: "24 square units" },
    { a: "Triangle b = 6, h = 4", b: "12 square units" },
    { a: "Parallelogram b = 5, h = 3", b: "15 square units" },
    { a: "Square with side 5", b: "25 square units" },
  ],
  volume: [
    { a: "Box 2 × 3 × 4", b: "24 cubic units" },
    { a: "Cube with edge 3", b: "27 cubic units" },
    { a: "Box 5 × 2 × 2", b: "20 cubic units" },
    { a: "Unit cube 1 × 1 × 1", b: "1 cubic unit" },
  ],
  "surface-area": [
    { a: "One face of a cube, edge 2", b: "4 square units" },
    { a: "ALL faces of a cube, edge 2", b: "24 square units" },
    { a: "Faces on a rectangular box", b: "6" },
    { a: "Flattened-out box shape", b: "A net" },
  ],
  statistics: [
    { a: "Median of 3, 5, 7", b: "5" },
    { a: "Mode of 2, 2, 9", b: "2" },
    { a: "Mean of 1, 2, 3, 4", b: "2.5" },
    { a: "Range from 3 to 11", b: "8" },
  ],
  "number-line": [
    { a: "Opposite of −4", b: "4" },
    { a: "|−6|", b: "6" },
    { a: "Greater: −2 or −7", b: "−2" },
    { a: "Distance from −3 to 0", b: "3" },
  ],
  "coordinate-plane": [
    { a: "(3, 2) from the origin", b: "Right 3, up 2" },
    { a: "(−1, 4) lives in…", b: "Quadrant II" },
    { a: "(0, 0) is called…", b: "The origin" },
    { a: "(2, −5) lives in…", b: "Quadrant IV" },
  ],
  fallback: [
    { a: "Half of 50", b: "25" },
    { a: "Double 35", b: "70" },
    { a: "10% of 200", b: "20" },
    { a: "24 ÷ 6", b: "4" },
  ],
};

const FAMILY_TF_QUESTIONS = {
  ratios: [
    {
      en: "The ratio 2:3 is the same as the ratio 3:2.",
      es: "La razón 2:3 es igual a la razón 3:2.",
      answer: false,
      whyEn: "Order matters in a ratio — 2 cups juice to 3 cups water is not 3 juice to 2 water.",
      whyEs:
        "El orden importa en una razón: 2 tazas de jugo por 3 de agua no es lo mismo que 3 de jugo por 2 de agua.",
    },
    {
      en: "To double a recipe, you multiply every ingredient by 2.",
      es: "Para duplicar una receta, se multiplica cada ingrediente por 2.",
      answer: true,
      whyEn: "Equivalent ratios come from multiplying BOTH parts by the same number.",
      whyEs: "Las razones equivalentes salen de multiplicar LAS DOS partes por el mismo número.",
    },
    {
      en: "3:4 and 6:8 describe the same relationship.",
      es: "3:4 y 6:8 describen la misma relación.",
      answer: true,
      whyEn: "Multiply both parts of 3:4 by 2 and you get 6:8 — equivalent ratios.",
      whyEs: "Multiplica las dos partes de 3:4 por 2 y obtienes 6:8: razones equivalentes.",
    },
    {
      en: "To make equivalent ratios you can ADD the same number to both parts.",
      es: "Para hacer razones equivalentes se puede SUMAR el mismo número a las dos partes.",
      answer: false,
      whyEn:
        "That's the classic trap! 2:3 plus 1 each gives 3:4, which is a different relationship. You must MULTIPLY.",
      whyEs:
        "¡Esa es la trampa clásica! 2:3 más 1 en cada parte da 3:4, otra relación. Hay que MULTIPLICAR.",
    },
    {
      en: "A unit rate compares a quantity to exactly 1 of something.",
      es: "Una tasa unitaria compara una cantidad con exactamente 1 de algo.",
      answer: true,
      whyEn: "Miles per 1 hour, dollars per 1 pound — the 1 is what makes it a UNIT rate.",
      whyEs: "Millas por 1 hora, dólares por 1 libra: el 1 es lo que la hace tasa UNITARIA.",
    },
  ],
  fractions: [
    {
      en: "Dividing by a fraction less than 1 gives an answer BIGGER than what you started with.",
      es: "Dividir entre una fracción menor que 1 da un resultado MAYOR que el número original.",
      answer: true,
      whyEn: "2 ÷ 1/4 asks how many quarter-pieces fit in 2 wholes: 8 of them!",
      whyEs: "2 ÷ 1/4 pregunta cuántos cuartos caben en 2 enteros: ¡8!",
    },
    {
      en: "Dividing always makes numbers smaller.",
      es: "Dividir siempre hace los números más pequeños.",
      answer: false,
      whyEn: "Only when dividing by a number bigger than 1. Dividing by 1/2 doubles!",
      whyEs: "Solo al dividir entre un número mayor que 1. ¡Dividir entre 1/2 duplica!",
    },
    {
      en: "There are exactly 6 pieces of size 1/3 in 2 wholes.",
      es: "Hay exactamente 6 pedazos de 1/3 en 2 enteros.",
      answer: true,
      whyEn: "Each whole holds 3 thirds, so 2 wholes hold 6: 2 ÷ 1/3 = 6.",
      whyEs: "Cada entero tiene 3 tercios, así que 2 enteros tienen 6: 2 ÷ 1/3 = 6.",
    },
    {
      en: "To divide by a fraction, you can multiply by its reciprocal (its flip).",
      es: "Para dividir entre una fracción, se puede multiplicar por su recíproco (volteada).",
      answer: true,
      whyEn: "2 ÷ 1/4 = 2 × 4/1 = 8. Keep–Change–Flip works because of what division means.",
      whyEs:
        "2 ÷ 1/4 = 2 × 4/1 = 8. Mantener–Cambiar–Voltear funciona por lo que significa dividir.",
    },
    {
      en: "1/2 and 3/6 are different amounts.",
      es: "1/2 y 3/6 son cantidades diferentes.",
      answer: false,
      whyEn:
        "Fold a paper in half, or in sixths and shade 3 — same amount of paper. They're equivalent.",
      whyEs:
        "Dobla un papel a la mitad, o en sextos y colorea 3: la misma cantidad. Son equivalentes.",
    },
  ],
  decimals: [
    {
      en: "When adding money, you line up the decimal points.",
      es: "Al sumar dinero, se alinean los puntos decimales.",
      answer: true,
      whyEn:
        "Lining up the points lines up the place values — dollars with dollars, cents with cents.",
      whyEs:
        "Alinear los puntos alinea los valores posicionales: dólares con dólares, centavos con centavos.",
    },
    {
      en: "0.5 is smaller than 0.35 because 5 is smaller than 35.",
      es: "0.5 es menor que 0.35 porque 5 es menor que 35.",
      answer: false,
      whyEn: "Classic trap! 0.5 = 0.50, and 50 hundredths beats 35 hundredths.",
      whyEs: "¡Trampa clásica! 0.5 = 0.50, y 50 centésimas es más que 35 centésimas.",
    },
    {
      en: "0.3 and 0.30 are the same number.",
      es: "0.3 y 0.30 son el mismo número.",
      answer: true,
      whyEn:
        "Three tenths equals thirty hundredths — a zero at the END after the decimal changes nothing.",
      whyEs:
        "Tres décimas son treinta centésimas: un cero AL FINAL después del punto no cambia nada.",
    },
    {
      en: "Multiplying a decimal by 10 moves the decimal point one place to the right.",
      es: "Multiplicar un decimal por 10 mueve el punto una posición a la derecha.",
      answer: true,
      whyEn: "1.2 × 10 = 12 — every digit's place value gets ten times bigger.",
      whyEs: "1.2 × 10 = 12: el valor de cada dígito se hace diez veces mayor.",
    },
    {
      en: "$5.00 minus $3.25 is $2.25.",
      es: "$5.00 menos $3.25 son $2.25.",
      answer: false,
      whyEn: "Count up: $3.25 + 75¢ = $4.00, + $1.00 = $5.00. The change is $1.75.",
      whyEs: "Cuenten hacia arriba: $3.25 + 75¢ = $4.00, + $1.00 = $5.00. El cambio es $1.75.",
    },
  ],
  division: [
    {
      en: "In 74 ÷ 12, the remainder tells you how many are left over after equal groups.",
      es: "En 74 ÷ 12, el residuo dice cuántos sobran después de formar grupos iguales.",
      answer: true,
      whyEn: "12 groups of 6 use 72; the remainder 2 is what's left in your hand.",
      whyEs: "12 grupos de 6 usan 72; el residuo 2 es lo que queda en la mano.",
    },
    {
      en: "When a digit is too small to divide, you just skip it.",
      es: "Cuando un dígito es muy pequeño para dividir, simplemente se salta.",
      answer: false,
      whyEn:
        "The trap that breaks long division! The quotient gets a 0 in that place and the digit joins the next one.",
      whyEs:
        "¡La trampa que rompe la división! El cociente lleva un 0 en ese lugar y el dígito se junta con el siguiente.",
    },
    {
      en: "618 ÷ 3 = 206.",
      es: "618 ÷ 3 = 206.",
      answer: true,
      whyEn:
        "6÷3=2, 1 doesn't go so the quotient gets 0 and 1 carries: 18÷3=6. Check: 206 × 3 = 618.",
      whyEs: "6÷3=2, el 1 no alcanza así que va 0 y el 1 pasa: 18÷3=6. Comprueba: 206 × 3 = 618.",
    },
    {
      en: "You can check any division with multiplication.",
      es: "Cualquier división se puede comprobar con una multiplicación.",
      answer: true,
      whyEn: "Quotient × divisor (+ remainder) must rebuild the number you started with.",
      whyEs: "Cociente × divisor (+ residuo) debe reconstruir el número original.",
    },
    {
      en: "If 58 guests sit at tables of 8, you need exactly 7 tables.",
      es: "Si 58 invitados se sientan en mesas de 8, se necesitan exactamente 7 mesas.",
      answer: false,
      whyEn: "7 tables seat 56 — two guests are standing! Round UP to 8 tables.",
      whyEs:
        "7 mesas sientan a 56: ¡dos invitados quedan de pie! Se redondea HACIA ARRIBA a 8 mesas.",
    },
  ],
  factors: [
    {
      en: "1 is a prime number.",
      es: "El 1 es un número primo.",
      answer: false,
      whyEn: "A prime needs exactly TWO different factors. 1 has only one factor: itself.",
      whyEs:
        "Un primo necesita exactamente DOS factores diferentes. El 1 solo tiene uno: él mismo.",
    },
    {
      en: "The greatest common factor of 12 and 18 is 6.",
      es: "El máximo común divisor de 12 y 18 es 6.",
      answer: true,
      whyEn: "Factors of 12: 1,2,3,4,6,12. Of 18: 1,2,3,6,9,18. Biggest shared: 6.",
      whyEs: "Factores de 12: 1,2,3,4,6,12. De 18: 1,2,3,6,9,18. El mayor compartido: 6.",
    },
    {
      en: "The least common multiple of 4 and 6 is 24.",
      es: "El mínimo común múltiplo de 4 y 6 es 24.",
      answer: false,
      whyEn: "24 IS a common multiple, but 12 comes first: 4, 8, 12… and 6, 12… They meet at 12.",
      whyEs:
        "24 SÍ es múltiplo común, pero el 12 llega antes: 4, 8, 12… y 6, 12… Se encuentran en 12.",
    },
    {
      en: "Every whole number bigger than 1 is either prime or can be built from primes.",
      es: "Todo número entero mayor que 1 es primo o se puede construir con primos.",
      answer: true,
      whyEn: "That's prime factorization: 12 = 2 × 2 × 3. Primes are the building blocks.",
      whyEs:
        "Eso es la factorización prima: 12 = 2 × 2 × 3. Los primos son los bloques de construcción.",
    },
    {
      en: "2 is the only even prime number.",
      es: "El 2 es el único número primo par.",
      answer: true,
      whyEn: "Every other even number has 2 as an extra factor, so it can't be prime.",
      whyEs: "Cualquier otro número par tiene al 2 como factor extra, así que no puede ser primo.",
    },
  ],
  exponents: [
    {
      en: "3⁴ means 3 × 4.",
      es: "3⁴ significa 3 × 4.",
      answer: false,
      whyEn: "The #1 exponent trap! 3⁴ = 3 × 3 × 3 × 3 = 81, not 12.",
      whyEs: "¡La trampa #1 de los exponentes! 3⁴ = 3 × 3 × 3 × 3 = 81, no 12.",
    },
    {
      en: "2⁵ = 32.",
      es: "2⁵ = 32.",
      answer: true,
      whyEn: "2, 4, 8, 16, 32 — five doublings.",
      whyEs: "2, 4, 8, 16, 32: cinco duplicaciones.",
    },
    {
      en: "Folding a paper in half 3 times gives 6 layers.",
      es: "Doblar un papel a la mitad 3 veces da 6 capas.",
      answer: false,
      whyEn: "Each fold DOUBLES: 2, 4, 8 layers. That's 2³, not 2 × 3.",
      whyEs: "Cada doblez DUPLICA: 2, 4, 8 capas. Eso es 2³, no 2 × 3.",
    },
    {
      en: "Any number to the power of 1 is itself.",
      es: "Cualquier número elevado a 1 es él mismo.",
      answer: true,
      whyEn: "7¹ means one copy of 7 in the product — just 7.",
      whyEs: "7¹ significa una sola copia del 7 en el producto: solo 7.",
    },
    {
      en: "10³ = 1,000.",
      es: "10³ = 1,000.",
      answer: true,
      whyEn: "10 × 10 × 10 — the exponent counts the zeros for powers of ten.",
      whyEs: "10 × 10 × 10: el exponente cuenta los ceros en las potencias de diez.",
    },
  ],
  expressions: [
    {
      en: "In the expression 3t + 2, the 3 is called a coefficient.",
      es: "En la expresión 3t + 2, el 3 se llama coeficiente.",
      answer: true,
      whyEn: "A coefficient is the number multiplying the variable.",
      whyEs: "El coeficiente es el número que multiplica a la variable.",
    },
    {
      en: "n + n + n is the same as n³.",
      es: "n + n + n es lo mismo que n³.",
      answer: false,
      whyEn: "Adding three copies gives 3n. n³ means n × n × n — multiplying.",
      whyEs: "Sumar tres copias da 3n. n³ significa n × n × n: multiplicar.",
    },
    {
      en: "If x = 4, then 2x + 1 = 9.",
      es: "Si x = 4, entonces 2x + 1 = 9.",
      answer: true,
      whyEn: "Substitute: 2 × 4 = 8, plus 1 is 9.",
      whyEs: "Sustituyan: 2 × 4 = 8, más 1 son 9.",
    },
    {
      en: "2x means 2 + x.",
      es: "2x significa 2 + x.",
      answer: false,
      whyEn: "A number touching a variable means MULTIPLY: 2x is 2 times x.",
      whyEs: "Un número pegado a una variable significa MULTIPLICAR: 2x es 2 por x.",
    },
    {
      en: "An expression like 4s + 2p can have two different variables.",
      es: "Una expresión como 4s + 2p puede tener dos variables diferentes.",
      answer: true,
      whyEn: "Each variable stands for its own quantity — shirts and pants can vary separately.",
      whyEs:
        "Cada variable representa su propia cantidad: camisas y pantalones varían por separado.",
    },
  ],
  equations: [
    {
      en: "An equation stays balanced if you do the same thing to BOTH sides.",
      es: "Una ecuación sigue equilibrada si haces lo mismo en LOS DOS lados.",
      answer: true,
      whyEn: "It works exactly like a balance scale — equal changes keep it level.",
      whyEs: "Funciona igual que una balanza: cambios iguales la mantienen nivelada.",
    },
    {
      en: "To solve m + 4 = 10, you add 4 to both sides.",
      es: "Para resolver m + 4 = 10, se suma 4 a los dos lados.",
      answer: false,
      whyEn: "You UNDO the +4 by subtracting 4: m = 6. Adding would give m + 8 = 14.",
      whyEs: "Se DESHACE el +4 restando 4: m = 6. Sumar daría m + 8 = 14.",
    },
    {
      en: "The solution of 3k = 21 is k = 7.",
      es: "La solución de 3k = 21 es k = 7.",
      answer: true,
      whyEn: "Divide both sides by 3. Check: 3 × 7 = 21. ✓",
      whyEs: "Dividan los dos lados entre 3. Comprueben: 3 × 7 = 21. ✓",
    },
    {
      en: "You can always check a solution by substituting it back into the equation.",
      es: "Siempre se puede comprobar una solución sustituyéndola en la ecuación.",
      answer: true,
      whyEn:
        "If both sides come out equal, the solution is right — the equation's own lie detector.",
      whyEs:
        "Si los dos lados salen iguales, la solución es correcta: el detector de mentiras de la ecuación.",
    },
    {
      en: "An equals sign means 'the answer comes next.'",
      es: "El signo igual significa 'aquí viene la respuesta'.",
      answer: false,
      whyEn: "It means both sides have the SAME VALUE — that's why balancing works.",
      whyEs: "Significa que los dos lados tienen el MISMO VALOR: por eso funciona el equilibrio.",
    },
  ],
  inequalities: [
    {
      en: "x ≥ 48 means 48 itself is allowed.",
      es: "x ≥ 48 significa que el mismo 48 está permitido.",
      answer: true,
      whyEn: "The little line under the symbol means 'or equal to' — exactly 48 works.",
      whyEs: "La rayita bajo el símbolo significa 'o igual a': exactamente 48 sirve.",
    },
    {
      en: "x > 5 and x ≥ 5 mean the same thing.",
      es: "x > 5 y x ≥ 5 significan lo mismo.",
      answer: false,
      whyEn: "They differ at exactly one number: 5 itself. > excludes it, ≥ includes it.",
      whyEs: "Difieren en exactamente un número: el propio 5. > lo excluye, ≥ lo incluye.",
    },
    {
      en: "An inequality like t > 60 has infinitely many solutions.",
      es: "Una desigualdad como t > 60 tiene infinitas soluciones.",
      answer: true,
      whyEn:
        "61, 62, 60.5, 1,000… every number above 60 works. That's why we graph a ray, not a dot.",
      whyEs:
        "61, 62, 60.5, 1,000… todo número mayor que 60 sirve. Por eso se grafica un rayo, no un punto.",
    },
    {
      en: "If you may spend at most $15, then c ≤ 15 describes your budget.",
      es: "Si puedes gastar máximo $15, entonces c ≤ 15 describe tu presupuesto.",
      answer: true,
      whyEn: "'At most' includes the limit — spending exactly $15 is still allowed.",
      whyEs: "'Máximo' incluye el límite: gastar exactamente $15 sigue permitido.",
    },
    {
      en: "On a number line, x > 3 is drawn with a filled-in dot at 3.",
      es: "En la recta numérica, x > 3 se dibuja con un punto relleno en el 3.",
      answer: false,
      whyEn: "An OPEN circle at 3 — because 3 itself is not included in x > 3.",
      whyEs: "Un círculo ABIERTO en el 3, porque el propio 3 no está incluido en x > 3.",
    },
  ],
  properties: [
    {
      en: "4 × (3 + 2) gives the same total as 4 × 3 + 4 × 2.",
      es: "4 × (3 + 2) da el mismo total que 4 × 3 + 4 × 2.",
      answer: true,
      whyEn: "Both count 4 snack packs of 5 items: 20. That's the distributive property.",
      whyEs: "Los dos cuentan 4 paquetes de 5: 20. Esa es la propiedad distributiva.",
    },
    {
      en: "Switching the order changes the answer in multiplication.",
      es: "Cambiar el orden cambia el resultado en la multiplicación.",
      answer: false,
      whyEn:
        "6 × 4 = 4 × 6 — turn the rectangle of beans sideways, same beans. Commutative property.",
      whyEs:
        "6 × 4 = 4 × 6: giren el rectángulo de frijoles, son los mismos frijoles. Propiedad conmutativa.",
    },
    {
      en: "Switching the order changes the answer in subtraction.",
      es: "Cambiar el orden cambia el resultado en la resta.",
      answer: true,
      whyEn:
        "10 − 3 = 7 but 3 − 10 = −7. Subtraction is NOT commutative — that's why the trap matters.",
      whyEs: "10 − 3 = 7 pero 3 − 10 = −7. La resta NO es conmutativa: por eso importa la trampa.",
    },
    {
      en: "Multiplying any number by 1 leaves it unchanged.",
      es: "Multiplicar cualquier número por 1 lo deja igual.",
      answer: true,
      whyEn: "The identity property of multiplication — one copy of the number.",
      whyEs: "La propiedad de identidad de la multiplicación: una sola copia del número.",
    },
    {
      en: "3 × 4.98 can be computed as 3 × 5 minus 3 × 0.02.",
      es: "3 × 4.98 se puede calcular como 3 × 5 menos 3 × 0.02.",
      answer: true,
      whyEn: "Distribute over (5 − 0.02): $15.00 − $0.06 = $14.94. A mental-math superpower!",
      whyEs:
        "Distribuyan sobre (5 − 0.02): $15.00 − $0.06 = $14.94. ¡Un superpoder de cálculo mental!",
    },
  ],
  area: [
    {
      en: "Area is measured in square units.",
      es: "El área se mide en unidades cuadradas.",
      answer: true,
      whyEn: "Area counts the unit squares that cover a surface.",
      whyEs: "El área cuenta los cuadrados unitarios que cubren una superficie.",
    },
    {
      en: "The area of a parallelogram uses the slanted side times the base.",
      es: "El área de un paralelogramo usa el lado inclinado por la base.",
      answer: false,
      whyEn:
        "It uses the straight-up HEIGHT. Cut the triangle off one end, slide it over — it's a rectangle of base × height.",
      whyEs:
        "Usa la ALTURA vertical. Corten el triángulo de un extremo y deslícenlo: queda un rectángulo de base × altura.",
    },
    {
      en: "A triangle's area is half the area of its matching rectangle.",
      es: "El área de un triángulo es la mitad del área de su rectángulo correspondiente.",
      answer: true,
      whyEn:
        "Break a rectangular cracker corner to corner: two equal triangles. Area = ½ × base × height.",
      whyEs:
        "Partan una galleta rectangular de esquina a esquina: dos triángulos iguales. Área = ½ × base × altura.",
    },
    {
      en: "A rectangle 6 by 4 has area 10.",
      es: "Un rectángulo de 6 por 4 tiene área 10.",
      answer: false,
      whyEn: "10 is the half-perimeter trap! Area multiplies: 6 × 4 = 24 square units.",
      whyEs:
        "¡10 es la trampa del semiperímetro! El área multiplica: 6 × 4 = 24 unidades cuadradas.",
    },
    {
      en: "Two rooms can have different shapes but the same area.",
      es: "Dos cuartos pueden tener formas diferentes y la misma área.",
      answer: true,
      whyEn: "A 6 × 4 room and an 8 × 3 room both cover 24 square units.",
      whyEs: "Un cuarto de 6 × 4 y uno de 8 × 3 cubren 24 unidades cuadradas cada uno.",
    },
  ],
  volume: [
    {
      en: "Volume is measured in cubic units.",
      es: "El volumen se mide en unidades cúbicas.",
      answer: true,
      whyEn: "Volume counts the unit cubes that FILL a box — three dimensions.",
      whyEs: "El volumen cuenta los cubos unitarios que LLENAN una caja: tres dimensiones.",
    },
    {
      en: "A taller box always holds more than a shorter box.",
      es: "Una caja más alta siempre cabe más que una más baja.",
      answer: false,
      whyEn:
        "A tall skinny box can lose to a short wide one — multiply all three dimensions and let the numbers decide.",
      whyEs:
        "Una caja alta y flaca puede perder contra una baja y ancha: multipliquen las tres dimensiones y que decidan los números.",
    },
    {
      en: "A box 2 × 3 × 4 holds 24 unit cubes.",
      es: "Una caja de 2 × 3 × 4 contiene 24 cubos unitarios.",
      answer: true,
      whyEn: "Bottom layer: 2 × 3 = 6 cubes. Four layers: 6 × 4 = 24.",
      whyEs: "Primera capa: 2 × 3 = 6 cubos. Cuatro capas: 6 × 4 = 24.",
    },
    {
      en: "Volume = length × width × height works even when an edge is a fraction like 1½.",
      es: "Volumen = largo × ancho × alto funciona aunque una arista sea una fracción como 1½.",
      answer: true,
      whyEn: "3 × 2 × 1½ = 9 cubic units — half-layers count as half.",
      whyEs: "3 × 2 × 1½ = 9 unidades cúbicas: las medias capas cuentan como mitad.",
    },
    {
      en: "Doubling every edge of a box doubles its volume.",
      es: "Duplicar cada arista de una caja duplica su volumen.",
      answer: false,
      whyEn: "It multiplies volume by 2 × 2 × 2 = 8! Try it: 1×1×1 = 1 but 2×2×2 = 8.",
      whyEs: "¡Multiplica el volumen por 2 × 2 × 2 = 8! Pruébenlo: 1×1×1 = 1 pero 2×2×2 = 8.",
    },
  ],
  "surface-area": [
    {
      en: "Surface area is the total area of ALL the faces of a solid.",
      es: "El área de superficie es el área total de TODAS las caras de un sólido.",
      answer: true,
      whyEn: "Unfold the box into its net and add up every face.",
      whyEs: "Desarmen la caja en su plantilla y sumen todas las caras.",
    },
    {
      en: "Surface area and volume measure the same thing.",
      es: "El área de superficie y el volumen miden lo mismo.",
      answer: false,
      whyEn:
        "Surface area is the wrapping paper (square units); volume is what fits inside (cubic units).",
      whyEs:
        "El área de superficie es el papel de regalo (unidades cuadradas); el volumen es lo que cabe adentro (unidades cúbicas).",
    },
    {
      en: "A rectangular box has 6 faces.",
      es: "Una caja rectangular tiene 6 caras.",
      answer: true,
      whyEn: "Top, bottom, front, back, and two sides — and they come in matching pairs.",
      whyEs: "Arriba, abajo, frente, atrás y dos lados: y vienen en pares gemelos.",
    },
    {
      en: "On a cube with edge 2, the total surface area is 24 square units.",
      es: "En un cubo de arista 2, el área de superficie total es 24 unidades cuadradas.",
      answer: true,
      whyEn: "Each face is 2 × 2 = 4, and there are 6 faces: 6 × 4 = 24.",
      whyEs: "Cada cara es 2 × 2 = 4, y hay 6 caras: 6 × 4 = 24.",
    },
    {
      en: "To wrap a gift you need to know its volume.",
      es: "Para envolver un regalo necesitas saber su volumen.",
      answer: false,
      whyEn:
        "Wrapping covers the OUTSIDE — that's surface area. Volume tells you what fits inside.",
      whyEs:
        "Envolver cubre el EXTERIOR: eso es área de superficie. El volumen dice qué cabe adentro.",
    },
  ],
  statistics: [
    {
      en: "A statistical question is one whose answers can vary.",
      es: "Una pregunta estadística es una cuyas respuestas pueden variar.",
      answer: true,
      whyEn: "'How old are the people in our building?' varies. 'How old am I?' has one answer.",
      whyEs:
        "'¿Cuántos años tienen los vecinos?' varía. '¿Cuántos años tengo?' tiene una sola respuesta.",
    },
    {
      en: "The median of 3, 5, 7 is 5.",
      es: "La mediana de 3, 5, 7 es 5.",
      answer: true,
      whyEn: "Line the data up in order; the median is the middle value.",
      whyEs: "Ordenen los datos; la mediana es el valor del medio.",
    },
    {
      en: "The mean and the median are always the same number.",
      es: "La media y la mediana siempre son el mismo número.",
      answer: false,
      whyEn: "For 1, 2, 9: median is 2, mean is 4. One big value drags the mean, not the median.",
      whyEs:
        "Para 1, 2, 9: la mediana es 2, la media es 4. Un valor grande arrastra la media, no la mediana.",
    },
    {
      en: "An outlier is a data value that sits far from the rest.",
      es: "Un valor atípico es un dato que queda lejos de los demás.",
      answer: true,
      whyEn: "Like one cousin who sleeps 12 hours in a family of 8-hour sleepers — it has a story!",
      whyEs: "Como un primo que duerme 12 horas en una familia que duerme 8: ¡tiene su historia!",
    },
    {
      en: "To find the median you must first put the data in order.",
      es: "Para hallar la mediana primero hay que ordenar los datos.",
      answer: true,
      whyEn: "The middle of an unordered list is meaningless — order first, then find the center.",
      whyEs:
        "El medio de una lista desordenada no significa nada: primero ordenar, luego buscar el centro.",
    },
  ],
  "number-line": [
    {
      en: "−7 is less than −2.",
      es: "−7 es menor que −2.",
      answer: true,
      whyEn: "On the number line −7 sits farther LEFT. Owing $7 is worse than owing $2!",
      whyEs: "En la recta, −7 está más a la IZQUIERDA. ¡Deber $7 es peor que deber $2!",
    },
    {
      en: "The absolute value of −6 is −6.",
      es: "El valor absoluto de −6 es −6.",
      answer: false,
      whyEn: "Absolute value is DISTANCE from zero, and distance is never negative: |−6| = 6.",
      whyEs:
        "El valor absoluto es la DISTANCIA a cero, y la distancia nunca es negativa: |−6| = 6.",
    },
    {
      en: "−4 and 4 are opposites.",
      es: "−4 y 4 son opuestos.",
      answer: true,
      whyEn: "Same distance from zero, opposite sides. Stand on the hallway number line and check!",
      whyEs:
        "Misma distancia del cero, lados opuestos. ¡Párense en la recta del pasillo y compruébenlo!",
    },
    {
      en: "Zero is a negative number.",
      es: "El cero es un número negativo.",
      answer: false,
      whyEn: "Zero is neither positive nor negative — it's the boundary between them.",
      whyEs: "El cero no es positivo ni negativo: es la frontera entre los dos.",
    },
    {
      en: "A bank account can hold a number below zero.",
      es: "Una cuenta bancaria puede tener un número bajo cero.",
      answer: true,
      whyEn: "Overdrawn by $3 is −3 — negative numbers describe owing, cold, and below sea level.",
      whyEs:
        "Un sobregiro de $3 es −3: los negativos describen deudas, frío y bajo el nivel del mar.",
    },
  ],
  "coordinate-plane": [
    {
      en: "(3, 2) and (2, 3) are the same point.",
      es: "(3, 2) y (2, 3) son el mismo punto.",
      answer: false,
      whyEn: "Order matters: (3, 2) is right 3 up 2; (2, 3) is right 2 up 3. Two different spots!",
      whyEs:
        "El orden importa: (3, 2) es 3 a la derecha y 2 arriba; (2, 3) es 2 a la derecha y 3 arriba. ¡Dos lugares distintos!",
    },
    {
      en: "The first number in an ordered pair tells you how far to move left or right.",
      es: "El primer número de un par ordenado dice cuánto moverse a la izquierda o derecha.",
      answer: true,
      whyEn: "x first (across), y second (up/down) — 'you crawl before you climb.'",
      whyEs: "Primero x (horizontal), luego y (vertical): 'primero caminas, luego subes'.",
    },
    {
      en: "(0, 0) is called the origin.",
      es: "(0, 0) se llama el origen.",
      answer: true,
      whyEn: "It's where the two axes cross — every trip starts there.",
      whyEs: "Es donde se cruzan los dos ejes: todo viaje empieza allí.",
    },
    {
      en: "(−1, 4) is in Quadrant IV.",
      es: "(−1, 4) está en el cuadrante IV.",
      answer: false,
      whyEn: "Negative x, positive y → Quadrant II (upper left). Quadrant IV is +x, −y.",
      whyEs: "x negativa, y positiva → cuadrante II (arriba a la izquierda). El IV es +x, −y.",
    },
    {
      en: "The four quadrants are numbered going counterclockwise.",
      es: "Los cuatro cuadrantes se numeran en sentido contrario a las manecillas.",
      answer: true,
      whyEn: "I (top right) → II (top left) → III (bottom left) → IV (bottom right).",
      whyEs:
        "I (arriba derecha) → II (arriba izquierda) → III (abajo izquierda) → IV (abajo derecha).",
    },
  ],
  fallback: [
    {
      en: "Estimating before you solve helps you catch mistakes.",
      es: "Estimar antes de resolver ayuda a detectar errores.",
      answer: true,
      whyEn: "If your estimate says 'about 20' and you get 200, something slipped.",
      whyEs: "Si la estimación dice 'como 20' y sale 200, algo falló.",
    },
    {
      en: "There is only one correct way to solve a math problem.",
      es: "Solo hay una forma correcta de resolver un problema de matemáticas.",
      answer: false,
      whyEn:
        "Draw it, build it, count up, use a rule — different roads to the same answer are the point of math talk!",
      whyEs:
        "Dibujar, construir, contar, usar una regla: distintos caminos a la misma respuesta. ¡De eso se trata hablar de matemáticas!",
    },
    {
      en: "10% of 200 is 20.",
      es: "El 10% de 200 es 20.",
      answer: true,
      whyEn: "10% means one tenth: 200 ÷ 10 = 20.",
      whyEs: "10% significa una décima parte: 200 ÷ 10 = 20.",
    },
    {
      en: "Making a mistake in math means you're bad at math.",
      es: "Equivocarse en matemáticas significa ser malo para las matemáticas.",
      answer: false,
      whyEn: "Mistakes are data! Finding and fixing them is how mathematicians actually work.",
      whyEs:
        "¡Los errores son información! Encontrarlos y corregirlos es como trabajan los matemáticos de verdad.",
    },
    {
      en: "Explaining your thinking out loud helps you understand it better.",
      es: "Explicar tu razonamiento en voz alta ayuda a entenderlo mejor.",
      answer: true,
      whyEn:
        "Teaching someone else is the strongest form of studying — that's why this homework asks families to talk.",
      whyEs:
        "Enseñar a otra persona es la forma más fuerte de estudiar: por eso esta tarea invita a conversar en familia.",
    },
  ],
};

function familyGamePairs(topic) {
  return FAMILY_GAME_PAIRS[topic] || FAMILY_GAME_PAIRS.fallback;
}

function familyTfQuestions(topic) {
  return FAMILY_TF_QUESTIONS[topic] || FAMILY_TF_QUESTIONS.fallback;
}

/**
 * The Family Game Break: Memory Flip (pairs) + True/False Face-Off, rendered on
 * the Together tab. Data ships as a JSON island (window.__HW_FAMGAMES__, `<`
 * escaped) so the game logic in HOMEWORK_TABS_JS stays free of content.
 */
export function renderFamilyGameBreak(topic) {
  const pairs = familyGamePairs(topic);
  const tf = familyTfQuestions(topic);
  const payload = JSON.stringify({ pairs, tf }).replace(/</g, "\\u003c");

  return `
    <div class="fam-game-break card-ish" id="fam_game_break">
      <script>window.__HW_FAMGAMES__ = ${payload};</script>
      <div class="fam-game-head">
        <span class="fam-game-badge">🎲 FAMILY GAME BREAK / JUEGOS EN FAMILIA</span>
        <p class="fam-game-lead">
          <span class="lang-en">Two quick games about tonight's math — play as a team, no timer, replay as often as you like!</span>
          <span class="lang-es" lang="es">Dos juegos rápidos sobre las matemáticas de hoy. Jueguen en equipo, sin cronómetro, ¡repitan las veces que quieran!</span>
        </p>
      </div>

      <div class="fam-game-card" id="fam_memory_game">
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">🃏 <span class="lang-en">Memory Flip: Math Twins</span><span class="lang-es" lang="es">Memoria: Gemelos Matemáticos</span></h3>
          <button type="button" class="btn btn-sm btn-secondary" onclick="resetMemoryGame()">🔄 <span class="lang-en">Shuffle &amp; Restart</span><span class="lang-es" lang="es">Mezclar y reiniciar</span></button>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">Flip two cards to find each problem's twin answer. Fewer flips = sharper memory!</span>
          <span class="lang-es" lang="es">Volteen dos tarjetas para encontrar la pareja de cada problema. ¡Menos vueltas = mejor memoria!</span>
        </p>
        <div class="fam-memory-grid" id="fam_memory_grid" role="group" aria-label="Memory matching game"></div>
        <p class="fam-memory-status" id="fam_memory_status" aria-live="polite">
          <span class="lang-en">Matches: <strong id="fam_mem_matches">0</strong> / 4 · Flips: <strong id="fam_mem_flips">0</strong></span>
          <span class="lang-es" lang="es">Parejas: <strong id="fam_mem_matches_es">0</strong> / 4 · Vueltas: <strong id="fam_mem_flips_es">0</strong></span>
        </p>
        <p class="fam-memory-win" id="fam_memory_win" hidden>🎉 <span class="lang-en">All twins found! Can you beat your flip count on a rematch?</span><span class="lang-es" lang="es">¡Encontraron todas las parejas! ¿Pueden lograrlo con menos vueltas en la revancha?</span></p>
      </div>

      <div class="fam-game-card" id="fam_tf_game">
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">🎯 <span class="lang-en">True or False? Family Face-Off</span><span class="lang-es" lang="es">¿Verdadero o falso? Duelo Familiar</span></h3>
          <button type="button" class="btn btn-sm btn-secondary" onclick="resetTfGame()">🔄 <span class="lang-en">Play Again</span><span class="lang-es" lang="es">Jugar otra vez</span></button>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">Take turns — student answers one, then a family member answers the next. Watch for the trick statements!</span>
          <span class="lang-es" lang="es">Por turnos: el estudiante responde una y luego un familiar responde la siguiente. ¡Cuidado con las trampas!</span>
        </p>
        <div class="fam-tf-turn" id="fam_tf_turn" aria-live="polite"></div>
        <p class="fam-tf-statement" id="fam_tf_statement"></p>
        <div class="fam-tf-buttons">
          <button type="button" class="btn fam-tf-btn fam-tf-true" id="fam_tf_true_btn" onclick="answerTf(true)">✓ <span class="lang-en">TRUE</span><span class="lang-es" lang="es">VERDADERO</span></button>
          <button type="button" class="btn fam-tf-btn fam-tf-false" id="fam_tf_false_btn" onclick="answerTf(false)">✗ <span class="lang-en">FALSE</span><span class="lang-es" lang="es">FALSO</span></button>
        </div>
        <div class="fam-tf-feedback" id="fam_tf_feedback" hidden aria-live="polite">
          <p class="fam-tf-verdict" id="fam_tf_verdict"></p>
          <p class="fam-tf-why" id="fam_tf_why"></p>
          <button type="button" class="btn btn-primary btn-sm" id="fam_tf_next_btn" onclick="nextTf()">➔ <span class="lang-en">Next statement</span><span class="lang-es" lang="es">Siguiente</span></button>
        </div>
        <p class="fam-tf-score" id="fam_tf_score" aria-live="polite"></p>
        <div class="fam-tf-done" id="fam_tf_done" hidden></div>
      </div>
    </div>`;
}

export const MATH_TALK_QUESTIONS = [
  {
    qEn: "Can you show me how you see that in the picture above?",
    qEs: "¿Puedes mostrarme cómo ves eso en el dibujo de arriba?",
    followEn: "Follow-up: Point to where the numbers match the visual model.",
    followEs: "Seguimiento: Señala dónde los números coinciden con el modelo visual.",
  },
  {
    qEn: "What would happen if we doubled the numbers in this problem?",
    qEs: "¿Qué pasaría si duplicamos los números de este problema?",
    followEn: "Follow-up: Does the relationship stay the same or change?",
    followEs: "Seguimiento: ¿La relación se mantiene igual o cambia?",
  },
  {
    qEn: "What is another way we could solve or explain this together?",
    qEs: "¿De qué otra forma podríamos resolverlo o explicarlo juntos?",
    followEn: "Follow-up: Can we check it using multiplication, a tape diagram, or a number line?",
    followEs: "Seguimiento: ¿Podemos comprobarlo usando otra herramienta o modelo?",
  },
  {
    qEn: "How would you explain this step to a 5th grader who hasn't seen it yet?",
    qEs: "¿Cómo le explicarías este paso a un estudiante de 5.º grado?",
    followEn: "Follow-up: What vocabulary word makes the explanation clearest?",
    followEs: "Seguimiento: ¿Qué palabra de vocabulario hace más clara la explicación?",
  },
  {
    qEn: "What part of this problem feels familiar, and what part feels new?",
    qEs: "¿Qué parte de este problema se siente conocida y qué parte parece nueva?",
    followEn: "Follow-up: What skill from earlier this year helps us here?",
    followEs: "Seguimiento: ¿Qué habilidad aprendida antes nos ayuda aquí?",
  },
  {
    qEn: "Before we calculate, what is a reasonable estimate for the answer?",
    qEs: "¿Antes de calcular, cuál es una estimación razonable para la respuesta?",
    followEn: "Follow-up: Should the answer be bigger or smaller than the starting numbers?",
    followEs: "Seguimiento: ¿La respuesta debe ser mayor o menor que los números iniciales?",
  },
];

export function getTopicPowerUp(topic, config) {
  const title = config?.title || "Tonight's Math";
  const powerUps = {
    exponents: {
      qEn: "Which statement shows the true meaning of 4³?",
      qEs: "¿Cuál enunciado muestra el significado real de 4³?",
      choices: [
        {
          en: "4 × 4 × 4 = 64 (multiply 3 copies of 4)",
          es: "4 × 4 × 4 = 64 (multiplica 3 copias de 4)",
        },
        {
          en: "4 × 3 = 12 (multiply base by exponent)",
          es: "4 × 3 = 12 (multiplica base por exponente)",
        },
        { en: "4 + 4 + 4 = 12 (add 4 three times)", es: "4 + 4 + 4 = 12 (suma 4 tres veces)" },
      ],
      correctIndex: 0,
      hintEn: "The exponent tells how many copies of the base multiply together!",
      hintEs: "¡El exponente dice cuántas copias de la base se multiplican juntas!",
    },
    ratios: {
      qEn: "If a recipe uses 2 cups of lemonade for every 3 cups of seltzer, which mixture tastes identical?",
      qEs: "Si una receta usa 2 tazas de limonada por cada 3 de agua con gas, ¿cuál mezcla sabe idéntica?",
      choices: [
        {
          en: "4 cups lemonade and 6 cups seltzer (scaled by ×2)",
          es: "4 de limonada y 6 de agua con gas (escalado ×2)",
        },
        {
          en: "4 cups lemonade and 5 cups seltzer (+2 to each)",
          es: "4 de limonada y 5 de agua con gas (+2 a cada una)",
        },
        {
          en: "3 cups lemonade and 2 cups seltzer (flipped ratio)",
          es: "3 de limonada y 2 de agua con gas (razón invertida)",
        },
      ],
      correctIndex: 0,
      hintEn: "Equivalent ratios multiply or divide BOTH parts by the exact same factor!",
      hintEs: "¡Las razones equivalentes multiplican o dividen AMBAS partes por el mismo factor!",
    },
    equations: {
      qEn: "To solve x + 7 = 15 while keeping the balance scale level, what must you do?",
      qEs: "Para resolver x + 7 = 15 manteniendo la balanza en equilibrio, ¿qué debes hacer?",
      choices: [
        {
          en: "Subtract 7 from both sides to get x = 8",
          es: "Restar 7 de ambos lados para obtener x = 8",
        },
        {
          en: "Add 7 to both sides to get x = 22",
          es: "Sumar 7 a ambos lados para obtener x = 22",
        },
        { en: "Multiply both sides by 7", es: "Multiplicar ambos lados por 7" },
      ],
      correctIndex: 0,
      hintEn: "Use the inverse operation on both sides to isolate the variable!",
      hintEs: "¡Usa la operación inversa en ambos lados para despejar la incógnita!",
    },
    inequalities: {
      qEn: "Which set of values makes the inequality m ≥ 6 true?",
      qEs: "¿Qué conjunto de valores hace verdadera la desigualdad m ≥ 6?",
      choices: [
        {
          en: "6, 7, 8, 12 (includes 6 because of 'greater than or equal to')",
          es: "6, 7, 8, 12 (incluye el 6 por ser 'mayor o igual que')",
        },
        { en: "7, 8, 9 only (6 is not allowed)", es: "Solo 7, 8, 9 (el 6 no se permite)" },
        {
          en: "1, 2, 3, 4, 5 (strictly less than 6)",
          es: "1, 2, 3, 4, 5 (estrictamente menores que 6)",
        },
      ],
      correctIndex: 0,
      hintEn: "The symbol ≥ has a solid bar underneath, meaning equal to 6 is included!",
      hintEs: "¡El símbolo ≥ tiene una línea abajo, lo que incluye el 6!",
    },
    expressions: {
      qEn: "Which expression is equivalent to 5(y + 3) using the distributive property?",
      qEs: "¿Qué expresión es equivalente a 5(y + 3) usando la propiedad distributiva?",
      choices: [
        {
          en: "5y + 15 (multiply 5 by y and 5 by 3)",
          es: "5y + 15 (multiplica 5 por y y 5 por 3)",
        },
        {
          en: "5y + 3 (multiply only the first term)",
          es: "5y + 3 (multiplica solo el primer término)",
        },
        { en: "y + 15 (forget the 5 on y)", es: "y + 15 (olvida el 5 en la y)" },
      ],
      correctIndex: 0,
      hintEn: "Distribute the outside number to EVERY term inside the parentheses!",
      hintEs: "¡Distribuye el número de afuera a CADA término dentro del paréntesis!",
    },
    statistics: {
      qEn: "What is the best way to describe the median of a data set?",
      qEs: "¿Cuál es la mejor manera de describir la mediana de un conjunto de datos?",
      choices: [
        {
          en: "The exact middle value when all numbers are ordered least to greatest",
          es: "El valor central exacto cuando los números están ordenados de menor a mayor",
        },
        {
          en: "The sum of all numbers divided by the count",
          es: "La suma de todos los números dividida entre el conteo",
        },
        {
          en: "The difference between maximum and minimum values",
          es: "La diferencia entre el valor máximo y el mínimo",
        },
      ],
      correctIndex: 0,
      hintEn: "Order the numbers first! The median splits the data into two equal halves.",
      hintEs: "¡Ordena los números primero! La mediana divide los datos en dos mitades iguales.",
    },
    "coordinate-plane": {
      qEn: "Starting at the origin (0, 0), where is the point (−3, 4) located?",
      qEs: "Empezando en el origen (0, 0), ¿dónde se ubica el punto (−3, 4)?",
      choices: [
        {
          en: "Left 3 units on the x-axis, then Up 4 units on the y-axis (Quadrant II)",
          es: "3 unidades a la izquierda en el eje x, luego 4 arriba en el eje y (Cuadrante II)",
        },
        {
          en: "Right 3 units on the x-axis, then Down 4 units on the y-axis",
          es: "3 unidades a la derecha en el eje x, luego 4 abajo en el eje y",
        },
        {
          en: "Up 3 units on the y-axis, then Left 4 units on the x-axis",
          es: "3 unidades arriba en el eje y, luego 4 a la izquierda en el eje x",
        },
      ],
      correctIndex: 0,
      hintEn: "(x, y): First move horizontally (x), then move vertically (y)!",
      hintEs: "(x, y): ¡Primero muévete en horizontal (x), luego en vertical (y)!",
    },
    "number-line": {
      qEn: "On a horizontal number line, which integer is farthest to the left?",
      qEs: "En una recta numérica horizontal, ¿qué entero está más a la izquierda?",
      choices: [
        {
          en: "−9 (farthest left, so smallest value)",
          es: "−9 (más a la izquierda, por tanto menor valor)",
        },
        { en: "−2 (closer to zero)", es: "−2 (más cerca de cero)" },
        { en: "0 (the center)", es: "0 (el centro)" },
      ],
      correctIndex: 0,
      hintEn: "The farther left a number sits on the number line, the smaller its value!",
      hintEs: "¡Cuanto más a la izquierda esté un número, menor es su valor!",
    },
    fractions: {
      qEn: "How many 1/4-cup scoops fit into 3/2 (1 1/2) cups of rice? (3/2 ÷ 1/4)",
      qEs: "¿Cuántas medidas de 1/4 caben en 3/2 (1 1/2) tazas de arroz? (3/2 ÷ 1/4)",
      choices: [
        { en: "6 scoops (3/2 × 4/1 = 12/2 = 6)", es: "6 medidas (3/2 × 4/1 = 12/2 = 6)" },
        {
          en: "3/8 scoop (multiplied without flipping)",
          es: "3/8 de medida (multiplicado sin invertir)",
        },
        { en: "2 scoops (subtracted denominators)", es: "2 medidas (restando denominadores)" },
      ],
      correctIndex: 0,
      hintEn:
        "Keep the first fraction, Change division to multiplication, Flip the second fraction!",
      hintEs: "¡Mantén la primera fracción, Cambia a multiplicación, Invierte la segunda!",
    },
    area: {
      qEn: "A rectangle has a base of 8 units and a height of 5 units. What is its area?",
      qEs: "Un rectángulo tiene base de 8 unidades y altura de 5 unidades. ¿Cuál es su área?",
      choices: [
        { en: "40 square units (base × height)", es: "40 unidades cuadradas (base × altura)" },
        { en: "26 units (perimeter: 8 + 5 + 8 + 5)", es: "26 unidades (perímetro: 8 + 5 + 8 + 5)" },
        {
          en: "20 square units (divided by 2 by mistake)",
          es: "20 unidades cuadradas (dividido entre 2 por error)",
        },
      ],
      correctIndex: 0,
      hintEn: "Area measures the flat square tiles that cover the surface: Base × Height!",
      hintEs: "¡El área mide las baldosas cuadradas que cubren la superficie: Base × Altura!",
    },
    volume: {
      qEn: "A box measures 4 cm by 3 cm by 5 cm. How many 1-cm unit cubes fill it completely?",
      qEs: "Una caja mide 4 cm por 3 cm por 5 cm. ¿Cuántos cubos de 1 cm la llenan por completo?",
      choices: [
        { en: "60 cubic cm (4 × 3 × 5)", es: "60 cm cúbicos (4 × 3 × 5)" },
        { en: "24 cubic cm (4 + 3 + 5 doubled)", es: "24 cm cúbicos (4 + 3 + 5 duplicado)" },
        { en: "12 cubic cm (bottom layer only)", es: "12 cm cúbicos (solo la capa del fondo)" },
      ],
      correctIndex: 0,
      hintEn: "Volume is the product of 3 dimensions: Length × Width × Height!",
      hintEs: "¡El volumen es el producto de 3 dimensiones: Largo × Ancho × Alto!",
    },
    "surface-area": {
      qEn: "When calculating the total surface area of a rectangular prism, what are you finding?",
      qEs: "Al calcular el área total de la superficie de un prisma rectangular, ¿qué estás hallando?",
      choices: [
        {
          en: "The sum of the areas of all 6 flat faces",
          es: "La suma de las áreas de las 6 caras planas",
        },
        {
          en: "The cubes packing the interior space",
          es: "Los cubos que llenan el espacio interior",
        },
        { en: "The length of the 12 edges", es: "La longitud de las 12 aristas" },
      ],
      correctIndex: 0,
      hintEn:
        "Think of unfolding the 3D cardboard box flat into a 2D net and finding each face's area!",
      hintEs:
        "¡Imagina desdoblar la caja de cartón 3D en una plantilla plana y hallar el área de cada cara!",
    },
    decimals: {
      qEn: "When adding 14.8 + 2.35, what is the crucial alignment rule?",
      qEs: "Al sumar 14.8 + 2.35, ¿cuál es la regla fundamental de alineación?",
      choices: [
        {
          en: "Line up the decimal points so tenths match tenths (14.80 + 2.35 = 17.15)",
          es: "Alinear los puntos decimales para que décimos coincidan con décimos (14.80 + 2.35 = 17.15)",
        },
        {
          en: "Line up digits to the right like whole numbers (giving 14.8 + 2.35 = 38.3)",
          es: "Alinear los dígitos a la derecha como números enteros",
        },
        {
          en: "Drop all decimal points before adding",
          es: "Eliminar los puntos decimales antes de sumar",
        },
      ],
      correctIndex: 0,
      hintEn: "Line up the decimal points vertically, and annex a placeholder zero if helpful!",
      hintEs: "¡Alinea los puntos decimales en columna vertical y añade ceros si te ayuda!",
    },
    factors: {
      qEn: "Which number is prime (having exactly two factors: 1 and itself)?",
      qEs: "¿Qué número es primo (tiene exactamente dos factores: el 1 y sí mismo)?",
      choices: [
        { en: "17 (only 1 × 17 = 17)", es: "17 (solo 1 × 17 = 17)" },
        { en: "9 (composite: 1, 3, 9)", es: "9 (compuesto: 1, 3, 9)" },
        { en: "15 (composite: 1, 3, 5, 15)", es: "15 (compuesto: 1, 3, 5, 15)" },
      ],
      correctIndex: 0,
      hintEn: "A prime number cannot be divided into equal groups other than 1 and itself!",
      hintEs: "¡Un número primo no se puede dividir en grupos iguales excepto entre 1 y sí mismo!",
    },
  };

  return (
    powerUps[topic] || {
      qEn: `What is the key mathematical focus of ${title}?`,
      qEs: `¿Cuál es el enfoque matemático clave de ${title}?`,
      choices: [
        {
          en: "Understand the visual model and reason step by step",
          es: "Comprender el modelo visual y razonar paso a paso",
        },
        {
          en: "Rush to guess the final answer without steps",
          es: "Adivinar la respuesta final sin pasos",
        },
        {
          en: "Ignore units and labels in the problem",
          es: "Ignorar las unidades y etiquetas del problema",
        },
      ],
      correctIndex: 0,
      hintEn: "Take your time to understand the big idea and visual model first!",
      hintEs: "¡Tómense su tiempo para entender la idea principal y el modelo visual primero!",
    }
  );
}

export function renderSkillPowerUp(config, topic = "expressions") {
  const powerUp = getTopicPowerUp(topic, config);
  const correctIdx = powerUp.correctIndex;
  return `
    <section class="guided-section card section-powerup" aria-label="Skill Power-Up Challenge">
      <div class="powerup-header">
        <div class="powerup-title-wrap">
          <span class="powerup-tag">⚡ SKILL POWER-UP / RETO DE PODER</span>
          <h3 class="powerup-question">
            <span class="lang-en">${esc(powerUp.qEn)}</span>
            <span class="lang-es" lang="es">${esc(powerUp.qEs)}</span>
          </h3>
        </div>
        <div class="powerup-badge-star" id="powerup_star_badge">★ 1 Star / 1 Estrella</div>
      </div>
      <div class="powerup-choices-grid" id="powerup_choices">
        ${powerUp.choices
          .map(
            (c, i) => `
          <button type="button" class="powerup-choice-btn" data-choice-idx="${i}" data-is-correct="${i === correctIdx ? "true" : "false"}"
            data-hint-en="${escAttr(powerUp.hintEn)}" data-hint-es="${escAttr(powerUp.hintEs)}"
            onclick="checkSkillPowerUp(this, ${i}, ${correctIdx})">
            <span class="powerup-letter">${String.fromCharCode(65 + i)}</span>
            <span class="powerup-choice-text">
              <span class="lang-en">${esc(c.en)}</span>
              <span class="lang-es" lang="es">${esc(c.es)}</span>
            </span>
          </button>`,
          )
          .join("")}
      </div>
      <div class="powerup-feedback-box" id="powerup_feedback_box" hidden>
        <div class="powerup-feedback-content" id="powerup_feedback_content"></div>
      </div>
    </section>`;
}

export function renderVocabMatchChallenge(vocabList) {
  if (!Array.isArray(vocabList) || vocabList.length < 2) return "";
  const count = vocabList.length;
  const shuffledDefs = vocabList.map((v, idx) => ({
    term: v.term,
    termEs: v.termEs,
    definition: v.definition,
    definitionEs: v.definitionEs,
    origIdx: idx,
  }));
  if (shuffledDefs.length > 1) {
    const last = shuffledDefs.pop();
    shuffledDefs.unshift(last);
  }

  return `
    <div class="vocab-game-shell card-ish" id="vocab_match_shell" data-vocab-total="${count}">
      <div class="vocab-game-header">
        <div class="vocab-game-title">
          <span class="vocab-game-icon" aria-hidden="true">⚡</span>
          <div>
            <h3 class="vocab-game-h3">
              <span class="lang-en">Match &amp; Master Challenge</span>
              <span class="lang-es" lang="es">Desafío: Empareja y Domina</span>
            </h3>
            <p class="vocab-game-sub bilingual-block">
              <span class="lang-en">Tap a word on the left, then tap its matching definition on the right!</span>
              <span class="lang-es" lang="es">¡Toca una palabra a la izquierda y su significado a la derecha!</span>
            </p>
          </div>
        </div>
        <div class="vocab-game-status">
          <span class="vocab-game-counter">
            <span class="lang-en">Matched: </span><span class="lang-es" lang="es">Emparejadas: </span>
            <strong id="vocab_match_count">0</strong> / ${count}
          </span>
        </div>
      </div>
      <div class="vocab-match-board">
        <div class="vocab-match-col col-terms" aria-label="Vocabulary terms">
          ${vocabList
            .map(
              (v, i) => `
            <button type="button" class="vocab-match-chip chip-term" data-vocab-id="${i}" data-side="term" onclick="selectVocabMatchChip(this)">
              <span class="chip-label-en">${esc(v.term)}</span>
              ${v.termEs ? `<span class="chip-label-es" lang="es">${esc(v.termEs)}</span>` : ""}
            </button>`,
            )
            .join("")}
        </div>
        <div class="vocab-match-col col-defs" aria-label="Vocabulary definitions">
          ${shuffledDefs
            .map(
              (v) => `
            <button type="button" class="vocab-match-chip chip-def" data-vocab-id="${v.origIdx}" data-side="def" onclick="selectVocabMatchChip(this)">
              <span class="chip-label-en">${esc(v.definition)}</span>
              ${v.definitionEs ? `<span class="chip-label-es" lang="es">${esc(v.definitionEs)}</span>` : ""}
            </button>`,
            )
            .join("")}
        </div>
      </div>
      <div class="vocab-game-win" id="vocab_match_win" hidden>
        <div class="win-banner">
          <span class="win-emoji" aria-hidden="true">🎉</span>
          <div class="win-text">
            <strong><span class="lang-en">Vocab Master! All ${count} words matched!</span><span class="lang-es" lang="es">¡Maestro del Vocabulario! ¡Todas las palabras emparejadas!</span></strong>
            <p><span class="lang-en">Great job connecting the math vocabulary. Explore the flashcards below!</span><span class="lang-es" lang="es">Excelente conectando el vocabulario. ¡Exploren las tarjetas abajo!</span></p>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="resetVocabMatchGame()">
            <span class="lang-en">Play Again 🔄</span><span class="lang-es" lang="es">Jugar de nuevo 🔄</span>
          </button>
        </div>
      </div>
    </div>`;
}

export function renderWordsToKnow(vocabList, resolveVocabImage, vocabImageAlt) {
  if (!Array.isArray(vocabList) || vocabList.length === 0) return "";

  const hasVocabGame = vocabList.length >= 2;
  const gameHtml = hasVocabGame ? renderVocabMatchChallenge(vocabList) : "";

  return `
    <section class="guided-section card section-vocab vocab-section" aria-label="Words to know">
      <h2 class="section-title">📚 Words to know / Palabras clave</h2>
      ${gameHtml}
      <div class="vocab-toolbar">
        <div class="vocab-filter-group" role="radiogroup" aria-label="Filter vocabulary cards">
          <button type="button" class="btn btn-sm btn-filter is-active" data-filter="all" onclick="filterVocabCards('all', this)"><span class="lang-en">All</span><span class="lang-es" lang="es">Todos</span></button>
          <button type="button" class="btn btn-sm btn-filter" data-filter="review" onclick="filterVocabCards('review', this)"><span class="lang-en">Needs Review</span><span class="lang-es" lang="es">Por repasar</span></button>
          <button type="button" class="btn btn-sm btn-filter" data-filter="mastered" onclick="filterVocabCards('mastered', this)">⭐ <span class="lang-en">Mastered</span><span class="lang-es" lang="es">Dominadas</span></button>
        </div>
        <div class="vocab-speed-toggle">
          <button type="button" class="btn btn-sm btn-secondary" id="vocab_speed_btn" onclick="toggleVocabSpeed()" title="Toggle voice speed / Cambiar velocidad">🐢 <span id="vocab_speed_label">Normal</span></button>
        </div>
      </div>
      <p class="vocab-family-note bilingual-block">
        <span class="lang-en">Tap a card to flip. Use these words when you talk about the math together.</span>
        <span class="lang-es" lang="es">Toquen una tarjeta para voltearla. Usen estas palabras cuando hablen de la matemática juntos.</span>
      </p>
      <div class="vocab-container">
        ${vocabList
          .map((v, vIdx) => {
            const term = v.term || "";
            const termEs = v.termEs || "";
            const definition = v.definition || "";
            const definitionEs = v.definitionEs || "";
            const visual = v.visual || "";
            const imgSrc = resolveVocabImage(term, v.image);
            const imgAlt = vocabImageAlt(term, definition);
            return `
            <div class="vocab-card" id="vocab_card_${vIdx}" onclick="this.classList.toggle('flipped')">
              <div class="vocab-card-inner">
                <div class="vocab-card-front">
                  <div class="vocab-card-top-bar">
                    <button type="button" class="vocab-speak-btn" onclick="event.stopPropagation(); speakMathWord('${escAttr(term)}', '${escAttr(termEs)}')" title="Listen / Escuchar" aria-label="Pronounce ${esc(term)}">🔊</button>
                    <button type="button" class="vocab-master-toggle" data-term-idx="${vIdx}" onclick="event.stopPropagation(); toggleVocabCardMastery(${vIdx})" title="Mark Mastered / Marcar Dominado" aria-label="Mark ${esc(term)} mastered">★</button>
                  </div>
                  <div class="vocab-thumb-wrap">
                    <img class="vocab-thumb" src="${esc(imgSrc)}" alt="${esc(imgAlt)}" loading="lazy" width="72" height="72" />
                  </div>
                  <h3>${esc(term)}</h3>
                  ${termEs ? `<p class="vocab-es" lang="es">${esc(termEs)}</p>` : ""}
                  ${visual ? `<div class="vocab-visual-hint">💡 ${esc(visual)}</div>` : ""}
                  <div class="flip-prompt">Tap / Toca ➔</div>
                </div>
                <div class="vocab-card-back">
                  <p class="vocab-def">${esc(definition)}</p>
                  ${definitionEs ? `<p class="vocab-def-es" lang="es">${esc(definitionEs)}</p>` : ""}
                  ${visual ? `<p class="vocab-back-visual">📌 ${esc(visual)}</p>` : ""}
                  <div class="vocab-card-back-actions">
                    <button type="button" class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); markVocabCardKnown(${vIdx}, true)"><span class="lang-en">Got it! 👍</span><span class="lang-es" lang="es">¡Lo sé! 👍</span></button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); markVocabCardKnown(${vIdx}, false)"><span class="lang-en">Review 🔄</span><span class="lang-es" lang="es">Repasar 🔄</span></button>
                  </div>
                </div>
              </div>
            </div>`;
          })
          .join("")}
      </div>
      <div class="tab-flow-nav">
        <button type="button" class="btn btn-primary flow-next-btn" onclick="switchHomeworkTab('together')">
          <span class="lang-en">Next: Try Together ➔</span>
          <span class="lang-es" lang="es">Siguiente: Intentar Juntos ➔</span>
        </button>
      </div>
    </section>`;
}

function tabPanelAttrs(id, hidden = false) {
  return `class="tab-panel-inner" data-tab-panel="${id}" id="hw_panel_${id}" role="tabpanel"${hidden ? " hidden" : ""}`;
}

export function renderLearnTab(config, visualLabHtml = "") {
  const learning = renderLearningTonight(config).replace(/<section[^>]*>|<\/section>/g, "");
  let concept = renderConceptExplainer(config).replace(/<section[^>]*>|<\/section>/g, "");
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);
  const topic = detectVisualTopic(config);
  const powerUpHtml = renderSkillPowerUp(config, topic);
  const spotlight = getRealWorldSpotlight(topic);
  const mis = getTopicMisconception(topic);

  // Add Listen button to the Big Idea title
  const listenBtn = ` <button type="button" class="btn-listen-concept" onclick="speakBigIdea('${escAttr(keyEn)}', '${escAttr(keyEs)}')" title="Listen to Big Idea / Escuchar idea principal" aria-label="Listen to the big idea">🔊 <span class="lang-en">Listen</span><span class="lang-es" lang="es">Escuchar</span></button>`;
  // Inside the heading, not after it: as a sibling it landed in a band of dead
  // space under the title, and the Learn tab strips the <section> wrapper, so
  // there is no container left to position it against.
  concept = concept.replace(
    /(<h2[^>]*class="section-title"[^>]*>[\s\S]*?)(<\/h2>)/i,
    `$1${listenBtn}$2`,
  );

  const spotlightHtml = `
    <div class="real-world-spotlight card-ish">
      <div class="spotlight-badge"><span class="spotlight-icon" aria-hidden="true">${spotlight.icon}</span> <span>WHY THIS MATTERS / ¿POR QUÉ IMPORTA?</span></div>
      <h3 class="spotlight-title">
        <span class="lang-en">${esc(spotlight.titleEn)}</span>
        <span class="lang-es" lang="es">${esc(spotlight.titleEs)}</span>
      </h3>
      <p class="spotlight-text bilingual-block">
        <span class="lang-en">${esc(spotlight.factEn)}</span>
        <span class="lang-es" lang="es">${esc(spotlight.factEs)}</span>
      </p>
    </div>`;

  const misconceptionHtml = `
    <div class="misconception-card card-ish">
      <div class="misconception-head">
        <span class="mis-icon" aria-hidden="true">⚠️</span>
        <div>
          <strong><span class="lang-en">Watch Out / Ojo con esto:</span><span class="lang-es" lang="es">Cuidado con este error común:</span></strong>
          <p class="mis-trap">
            <span class="lang-en">${esc(mis.trapEn)}</span>
            <span class="lang-es" lang="es">${esc(mis.trapEs)}</span>
          </p>
        </div>
      </div>
      <div class="parent-coach-tip">
        <strong>💬 <span class="lang-en">Parent Coach Question:</span><span class="lang-es" lang="es">Pregunta de guía:</span></strong>
        <span class="lang-en">${esc(mis.coachEn)}</span>
        <span class="lang-es" lang="es">${esc(mis.coachEs)}</span>
      </div>
    </div>`;

  const parentDrawerHtml = `
    <details class="parent-coaching-drawer">
      <summary class="parent-coaching-summary">
        <span class="summary-left">
          <span class="summary-icon">💡</span>
          <span class="summary-text">
            <strong><span class="lang-en">Parent Coaching Tips &amp; Real-World Connection</span><span class="lang-es" lang="es">Consejos para Padres y Conexión Real</span></strong>
            <small><span class="lang-en">Tap to view coaching questions, common traps &amp; everyday examples</span><span class="lang-es" lang="es">Toca para ver preguntas guía, errores comunes y ejemplos</span></small>
          </span>
        </span>
        <span class="summary-chevron" aria-hidden="true">▾</span>
      </summary>
      <div class="parent-coaching-content">
        ${spotlightHtml}
        ${misconceptionHtml}
      </div>
    </details>`;

  return `
    <div ${tabPanelAttrs("learn")}>
      ${learning}
      ${concept}
      ${visualLabHtml}
      ${parentDrawerHtml}
      ${powerUpHtml}
      <p class="tab-help-row">${helpButton("💡 Need more help? / ¿Más ayuda?", { titleEn: "The big idea", titleEs: "La idea principal", en: keyEn, es: keyEs })}</p>
      <div class="tab-flow-nav">
        <button type="button" class="btn btn-primary flow-next-btn" onclick="switchHomeworkTab('words')">
          <span class="lang-en">Next: Review Words ➔</span>
          <span class="lang-es" lang="es">Siguiente: Repasar Palabras ➔</span>
        </button>
      </div>
    </div>`;
}

export function renderWordsTab(vocabList, resolveVocabImage, vocabImageAlt) {
  const inner = renderWordsToKnow(vocabList, resolveVocabImage, vocabImageAlt);
  if (!inner) {
    return `<div ${tabPanelAttrs("words", true)}><p class="lang-en">No vocabulary listed for this lesson.</p><p class="lang-es" lang="es">No hay vocabulario listado para esta lección.</p></div>`;
  }
  return `<div ${tabPanelAttrs("words", true)}>${inner.replace(/<section[^>]*>|<\/section>/g, "")}</div>`;
}

export function renderTogetherTab(config, lessonId = "") {
  const inner = renderTryTogether(config, lessonId).replace(/<section[^>]*>|<\/section>/g, "");
  const mathTalkHtml = `
    <div class="math-talk-hub card-ish" id="math_talk_card">
      <div class="math-talk-header">
        <div class="math-talk-badge">💬 MATH TALK GENERATOR / PREGUNTAS DE DIÁLOGO</div>
        <button type="button" class="btn btn-sm btn-secondary spin-btn" onclick="spinMathTalkPrompt()">🎲 <span class="lang-en">Spin New Question</span><span class="lang-es" lang="es">Girar otra pregunta</span></button>
      </div>
      <div class="math-talk-body" id="math_talk_body">
        <p class="math-talk-q">
          <span class="lang-en" id="math_talk_en">"Can you show me how you see that in the picture above?"</span>
          <span class="lang-es" lang="es" id="math_talk_es">"¿Puedes mostrarme cómo ves eso en el dibujo de arriba?"</span>
        </p>
        <p class="math-talk-follow">
          <span class="lang-en" id="math_talk_follow_en">Follow-up: Point to where the numbers match the visual model.</span>
          <span class="lang-es" lang="es" id="math_talk_follow_es">Seguimiento: Señala dónde los números coinciden con el modelo visual.</span>
        </p>
      </div>
    </div>`;

  return `
    <div ${tabPanelAttrs("together", true)}>
      ${inner}
      ${mathTalkHtml}
      ${renderFamilyGameBreak(detectVisualTopic(config))}
      ${renderFamilyActivityCorner(detectVisualTopic(config))}
      <div class="scratchpad-inline-toggle">
        <button type="button" class="btn btn-secondary scratchpad-toggle-btn" onclick="toggleScratchpad()">
          ✏️ <span class="lang-en">Open Scratchpad Whiteboard</span><span class="lang-es" lang="es">Abrir Pizarra de Dibujo</span>
        </button>
      </div>
      <div class="tab-flow-nav">
        <button type="button" class="btn btn-primary flow-next-btn" onclick="switchHomeworkTab('workbench')">
          <span class="lang-en">Next: Explore Math Workbench ➔</span>
          <span class="lang-es" lang="es">Siguiente: Explorar Pizarra de Matemáticas ➔</span>
        </button>
      </div>
    </div>`;
}

export function renderCheckTab(quickCheckIntro, warmupHtml, challengeHtml = "", moreHtml = "") {
  const intro = quickCheckIntro.replace(/<section[^>]*>|<\/section>/g, "");

  const starsBar = `
    <div class="stars-to-win-bar">
      <div class="stars-to-win-title">
        <span>⭐</span>
        <div>
          <span class="lang-en"><strong>3 Stars to Win:</strong> Complete 3 problems to finish tonight's goal!</span>
          <span class="lang-es" lang="es"><strong>3 Estrellas para Ganar:</strong> ¡Completen 3 problemas para terminar la meta de hoy!</span>
        </div>
      </div>
      <div class="stars-milestone-chips" aria-hidden="true">
        <span class="star-chip">🌱 Warm-Up ★</span>
        <span class="star-chip">🚀 Level-Up ★★</span>
        <span class="star-chip">🏆 Victory ★★★</span>
      </div>
    </div>`;

  const streakBanner = `
    <div class="live-streak-banner" id="hw_streak_banner" hidden>
      <span class="streak-flame" aria-hidden="true">🔥</span>
      <span class="streak-text">
        <span class="lang-en">Streak: <strong id="hw_streak_count">1</strong> in a row! Keep going!</span>
        <span class="lang-es" lang="es">¡Racha: <strong id="hw_streak_count_es">1</strong> seguidas! ¡Sigue así!</span>
      </span>
    </div>`;

  const scratchpadToggle = `
    <div class="scratchpad-inline-toggle">
      <button type="button" class="btn btn-sm btn-secondary scratchpad-toggle-btn" onclick="toggleScratchpad()">
        ✏️ <span class="lang-en">Open Scratchpad / Draw work</span><span class="lang-es" lang="es">Abrir Pizarra / Dibujar trabajo</span>
      </button>
    </div>`;

  const goalReachedBanner = `
    <div class="goal-reached-banner" id="goal_reached_banner" hidden>
      <span class="goal-icon" aria-hidden="true">🌟</span>
      <div class="goal-text">
        <strong><span class="lang-en">Goal Reached! 3 Stars Earned!</span><span class="lang-es" lang="es">¡Meta Cumplida! ¡3 Estrellas Ganadas!</span></strong>
        <p><span class="lang-en">Awesome job! You can keep solving or head to the <strong>Victory Lap</strong> tab to claim your certificate!</span><span class="lang-es" lang="es">¡Excelente trabajo! Pueden seguir resolviendo o ir a la pestaña <strong>Listo</strong> para reclamar su certificado.</span></p>
      </div>
      <button type="button" class="btn btn-sm btn-primary" onclick="switchHomeworkTab('done')">
        <span class="lang-en">Claim Certificate ➔</span><span class="lang-es" lang="es">Reclamar Certificado ➔</span>
      </button>
    </div>`;

  const warmupBlock = warmupHtml
    ? `
      <section class="practice-tier practice-tier-warmup" aria-label="Warm-up practice">
        <div class="practice-tier-head">
          <span class="practice-tier-badge tier-warmup">1</span>
          <div class="practice-tier-titles">
            <h3 class="practice-tier-title">
              <span class="lang-en">🌱 Warm-up — start here</span>
              <span class="lang-es" lang="es">🌱 Calentamiento — empiecen aquí</span>
            </h3>
            <p class="practice-tier-sub bilingual-block">
              <span class="lang-en">Easier problems to practice the idea. Do these first together.</span>
              <span class="lang-es" lang="es">Problemas más fáciles para practicar la idea. Hagan estos primero juntos.</span>
            </p>
            <div class="parent-coach-prompt">
              <strong>💬 Parent Coach / Guía para familias:</strong>
              <span class="lang-en">Ask: "What do you notice first about this problem? Can you draw or write the first step?"</span>
              <span class="lang-es" lang="es">Pregunta: "¿Qué notas primero sobre este problema? ¿Puedes dibujar o escribir el primer paso?"</span>
            </div>
          </div>
        </div>
        <section class="problems-container" aria-label="Practice problems">${warmupHtml}</section>
      </section>`
    : "";

  const challengeBlock = challengeHtml
    ? `
      <section class="practice-tier practice-tier-challenge" aria-label="Challenge practice">
        <div class="practice-tier-head">
          <span class="practice-tier-badge tier-challenge">2</span>
          <div class="practice-tier-titles">
            <h3 class="practice-tier-title">
              <span class="lang-en">🚀 Level up — a little harder</span>
              <span class="lang-es" lang="es">🚀 Sube de nivel — un poco más difícil</span>
            </h3>
            <p class="practice-tier-sub bilingual-block">
              <span class="lang-en">Try these once the warm-up feels easy. It's okay to use the steps and pictures.</span>
              <span class="lang-es" lang="es">Intenten estos cuando el calentamiento sea fácil. Está bien usar los pasos y los dibujos.</span>
            </p>
          </div>
        </div>
        <section class="problems-container" aria-label="Practice problems">${challengeHtml}</section>
      </section>`
    : "";

  const more = moreHtml
    ? `
      <details class="more-practice">
        <summary>
          <span class="lang-en">➕ More practice — open for extra problems</span>
          <span class="lang-es" lang="es">➕ Más práctica — abre para más problemas</span>
        </summary>
        <p class="more-practice-note bilingual-block">
          <span class="lang-en">Optional. Only if your student wants more — these are bonus problems.</span>
          <span class="lang-es" lang="es">Opcional. Solo si tu estudiante quiere más — son problemas adicionales.</span>
        </p>
        <section class="problems-container more-practice-container" aria-label="More practice">${moreHtml}</section>
      </details>`
    : "";

  const flowNext = `
    <div class="tab-flow-nav">
      <button type="button" class="btn btn-primary flow-next-btn" onclick="switchHomeworkTab('play')">
        <span class="lang-en">Next: Play Tonight's Math Game ➔</span>
        <span class="lang-es" lang="es">Siguiente: Jugar el Juego Matemático ➔</span>
      </button>
    </div>`;

  return `
    <div ${tabPanelAttrs("check", true)}>
      ${intro}
      ${starsBar}
      ${streakBanner}
      ${scratchpadToggle}
      ${goalReachedBanner}
      ${warmupBlock}
      ${challengeBlock}
      ${more}
      ${flowNext}
    </div>`;
}

// Math Workbench tab — embeds the shared whiteboard so families can show their
// work without leaving the homework page. The iframe is lazy-loaded on first
// open (see HOMEWORK_TABS_JS) so it never slows down the rest of the page.
// Practice Arcade for tonight's lesson — links to the shared per-lesson game
// engine (math/games/practice-arcade). Iframe is lazy-loaded on first open so
// the Phaser game never slows down the rest of the homework page.
export function renderArcadeTabPanel(lessonId) {
  const url = `/math/games/practice-arcade/?lesson=${encodeURIComponent(lessonId)}`;
  return `
    <div ${tabPanelAttrs("arcade", true)}>
      <section class="guided-section card section-arcade" aria-label="Practice Arcade">
        <h2 class="section-title">🕹️ Practice Arcade / Sala de juegos</h2>
        <p class="bilingual-block">
          <span class="lang-en">A quick, no-timer review game for tonight's lesson — sort, match, and choose. A wrong answer just gives a hint and lets your student try again.</span>
          <span class="lang-es" lang="es">Un juego de repaso sin reloj para la lección de hoy — clasificar, emparejar y elegir. Si se equivocan, reciben una pista y pueden intentar de nuevo.</span>
        </p>
        <p class="workbench-openrow">
          <a class="btn btn-secondary" href="${url}" target="_blank" rel="noopener">
            <span class="lang-en">↗ Play full screen</span>
            <span class="lang-es" lang="es">↗ Jugar en pantalla completa</span>
          </a>
        </p>
        <div class="workbench-frame-wrap">
          <iframe class="arcade-frame" data-src="${url}" title="Practice Arcade" loading="lazy"></iframe>
        </div>
      </section>
    </div>`;
}

export function renderWorkbenchTab() {
  return `
    <div ${tabPanelAttrs("workbench", true)}>
      <section class="guided-section card section-workbench" aria-label="Math Workbench">
        <div class="workbench-hero-header">
          <div class="workbench-title-group">
            <span class="workbench-badge">🧮 VIRTUAL MANIPULATIVE STUDIO / ESTUDIO DIGITAL</span>
            <h2 class="section-title">Math Workbench / Pizarra de matemáticas</h2>
            <p class="bilingual-block workbench-lead">
              <span class="lang-en">Explore interactive math tools right here, or open the full workspace in a new tab. Select a tool to model tonight's ideas!</span>
              <span class="lang-es" lang="es">Exploren herramientas interactivas aquí mismo, o abran la pizarra completa en otra pestaña. ¡Elijan una herramienta para modelar ideas!</span>
            </p>
          </div>
          <div class="workbench-actions-top">
            <a class="btn btn-primary workbench-open-btn" href="/curriculum/math-workbench/" target="_blank" rel="noopener">
              <span class="lang-en">Open Full Workbench ↗</span>
              <span class="lang-es" lang="es">Abrir Pizarra Completa ↗</span>
            </a>
          </div>
        </div>

        <!-- Tool Selection Tabs -->
        <div class="wb-tool-bar" role="tablist" aria-label="Workbench tools">
          <button type="button" class="wb-tool-tab is-active" id="wb_tab_fractions" onclick="switchWorkbenchTool('fractions')">
            <span class="tool-icon">📏</span>
            <span class="tool-name"><span class="lang-en">Fraction Strips</span><span class="lang-es" lang="es">Fracciones</span></span>
          </button>
          <button type="button" class="wb-tool-tab" id="wb_tab_coords" onclick="switchWorkbenchTool('coords')">
            <span class="tool-icon">🧭</span>
            <span class="tool-name"><span class="lang-en">Coordinate Grid</span><span class="lang-es" lang="es">Coordenadas</span></span>
          </button>
          <button type="button" class="wb-tool-tab" id="wb_tab_tapes" onclick="switchWorkbenchTool('tapes')">
            <span class="tool-icon">📊</span>
            <span class="tool-name"><span class="lang-en">Ratio Tape</span><span class="lang-es" lang="es">Cintas de razón</span></span>
          </button>
          <button type="button" class="wb-tool-tab" id="wb_tab_decimals" onclick="switchWorkbenchTool('decimals')">
            <span class="tool-icon">🔢</span>
            <span class="tool-name"><span class="lang-en">Decimal Columns</span><span class="lang-es" lang="es">Columnas decimales</span></span>
          </button>
        </div>

        <!-- Tool Stage -->
        <div class="wb-tool-stage card-ish">
          <!-- 1. Fraction Strips Tool -->
          <div class="wb-panel" id="wb_panel_fractions">
            <div class="tool-controls-row">
              <span class="tool-hint"><span class="lang-en">Tap fraction tiles to add bars and compare lengths:</span><span class="lang-es" lang="es">Toca fichas para añadir barras y comparar longitudes:</span></span>
              <div class="fraction-button-group">
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" onclick="addFractionBar(1)">1</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" onclick="addFractionBar(2)">1/2</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" onclick="addFractionBar(3)">1/3</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" onclick="addFractionBar(4)">1/4</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" onclick="addFractionBar(6)">1/6</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" onclick="addFractionBar(8)">1/8</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" onclick="addFractionBar(12)">1/12</button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="clearFractionBars()">🗑️ <span class="lang-en">Clear</span><span class="lang-es" lang="es">Borrar</span></button>
              </div>
            </div>
            <div class="fraction-stage-canvas" id="fraction_stage_canvas">
              <div class="fraction-row ref-row"><div class="frac-tile tile-1">1 Whole / Entero (1.0)</div></div>
            </div>
          </div>

          <!-- 2. Coordinate Grid Tool -->
          <div class="wb-panel" id="wb_panel_coords" hidden>
            <div class="tool-controls-row">
              <span class="tool-hint"><span class="lang-en">Click anywhere on the grid to plot an (x, y) point and see its quadrant:</span><span class="lang-es" lang="es">Haz clic en la cuadrícula para marcar un punto (x, y) y ver su cuadrante:</span></span>
              <span class="coord-readout" id="coord_readout">(x: 0, y: 0) — Origin / Origen</span>
            </div>
            <div class="coord-canvas-wrap">
              <svg class="interactive-coord-svg" id="interactive_coord_svg" viewBox="-120 -120 240 240" onclick="clickCoordGrid(event)" style="background:white; width:100%; max-height:280px;"></svg>
            </div>
          </div>

          <!-- 3. Ratio Tape Diagram Tool -->
          <div class="wb-panel" id="wb_panel_tapes" hidden>
            <div class="tool-controls-row">
              <label class="tape-slider-label">
                <span class="lang-en">Part A (Blue):</span><span class="lang-es" lang="es">Parte A (Azul):</span>
                <input type="range" min="1" max="8" value="3" id="tape_slider_a" oninput="updateTapeDiagram()" />
                <strong id="tape_val_a">3</strong>
              </label>
              <label class="tape-slider-label">
                <span class="lang-en">Part B (Coral):</span><span class="lang-es" lang="es">Parte B (Coral):</span>
                <input type="range" min="1" max="8" value="4" id="tape_slider_b" oninput="updateTapeDiagram()" />
                <strong id="tape_val_b">4</strong>
              </label>
              <label class="tape-slider-label">
                <span class="lang-en">Scaling Factor:</span><span class="lang-es" lang="es">Factor de escala:</span>
                <input type="range" min="1" max="5" value="2" id="tape_slider_factor" oninput="updateTapeDiagram()" />
                <strong id="tape_val_factor">×2</strong>
              </label>
            </div>
            <div class="tape-diagram-render" id="tape_diagram_render"></div>
          </div>

          <!-- 4. Decimal Place Value Tool -->
          <div class="wb-panel" id="wb_panel_decimals" hidden>
            <div class="tool-controls-row">
              <span class="tool-hint"><span class="lang-en">Type numbers to align decimal points vertically:</span><span class="lang-es" lang="es">Escribe números para alinear puntos decimales:</span></span>
            </div>
            <div class="decimal-place-grid">
              <table class="dec-grid-table">
                <thead>
                  <tr><th>Hundreds<br><small>Centenas</small></th><th>Tens<br><small>Decenas</small></th><th>Ones<br><small>Unidades</small></th><th class="dec-pt">.</th><th>Tenths<br><small>Décimos</small></th><th>Hundredths<br><small>Centésimos</small></th><th>Thousandths<br><small>Milésimos</small></th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><input type="text" maxlength="1" class="dg-cell" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" value="2" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" value="5" /></td>
                    <td class="dec-pt">.</td>
                    <td><input type="text" maxlength="1" class="dg-cell" value="4" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" value="0" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" /></td>
                  </tr>
                  <tr class="op-row">
                    <td><input type="text" maxlength="1" class="dg-cell" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" value="8" /></td>
                    <td class="dec-pt">.</td>
                    <td><input type="text" maxlength="1" class="dg-cell" value="7" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" value="5" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Family Investigation Prompt -->
        <div class="family-workbench-investigation card-ish">
          <span class="investigation-icon" aria-hidden="true">💡</span>
          <div class="investigation-content">
            <strong><span class="lang-en">Family Investigation Challenge:</span><span class="lang-es" lang="es">Desafío de investigación familiar:</span></strong>
            <p><span class="lang-en">Choose one tool above that matches tonight's homework. Try creating an example together before solving the practice problems!</span><span class="lang-es" lang="es">Elijan una herramienta arriba que coincida con la tarea de hoy. ¡Intenten crear un ejemplo juntos antes de resolver los problemas de práctica!</span></p>
          </div>
        </div>

        <p class="workbench-openrow">
          <a class="btn btn-secondary workbench-open-btn" href="/curriculum/math-workbench/" target="_blank" rel="noopener">
            <span class="lang-en">🧮 Open the Math Workbench ↗</span>
            <span class="lang-es" lang="es">🧮 Abrir la Pizarra de matemáticas ↗</span>
          </a>
        </p>
        <div class="tab-flow-nav">
          <button type="button" class="btn btn-primary flow-next-btn" onclick="switchHomeworkTab('check')">
            <span class="lang-en">Next: Check Problems &amp; Earn Stars ➔</span>
            <span class="lang-es" lang="es">Siguiente: Resolver Problemas y Ganar Estrellas ➔</span>
          </button>
        </div>
      </section>
    </div>`;
}

export function renderHelpTab(config) {
  const stuck = renderStuckSection(config).replace(/<section[^>]*>|<\/section>/g, "");
  const tips = stuckTips(config);
  return `
    <div ${tabPanelAttrs("help", true)}>
      ${stuck}
      <div class="help-hub card-ish">
        <h3 class="section-title">💡 Quick help topics / Temas de ayuda</h3>
        <ul class="help-topic-list">
          ${tips.say
            .map(
              (t, i) =>
                `<li>${helpButton(`Tip ${i + 1} / Pista ${i + 1}`, { titleEn: "Try saying…", titleEs: "Intenta decir…", en: t.en, es: t.es })}</li>`,
            )
            .join("")}
        </ul>
      </div>
    </div>`;
}

export function renderMoreTab(config, lessonId) {
  const links = getExternalResources(config, lessonId);
  // Every lesson with a homework page also ships a printable .docx, but nothing
  // linked to it — families without a device at home had no paper path.
  const docxHref = `/lessons/${lessonId}/homework.docx`;
  const hasDocx = existsSync(join(_root, "lessons", lessonId, "homework.docx"));
  const offlineCta = hasDocx
    ? `
        <a href="${esc(docxHref)}" download class="ai-lab-cta offline-cta">
          <span class="ai-lab-emoji" aria-hidden="true">🖨️</span>
          <span class="ai-lab-text">
            <span class="lang-en"><strong>No internet at home? Download the paper version</strong> — the same problems in a document you can print or open offline.</span>
            <span class="lang-es" lang="es"><strong>¿No hay internet en casa? Descarga la versión en papel</strong> — los mismos problemas en un documento que puedes imprimir o abrir sin conexión.</span>
          </span>
          <span class="ai-lab-arrow" aria-hidden="true">↓</span>
        </a>`
    : "";
  return `
    <div ${tabPanelAttrs("more", true)}>
      <section class="guided-section card section-more" aria-label="Learn more online">
        <h2 class="section-title">🌐 Learn more online / Aprende más en línea</h2>
        <a href="/curriculum/ai-hub/#students" target="_blank" rel="noopener" class="ai-lab-cta">
          <span class="ai-lab-emoji" aria-hidden="true">🤖</span>
          <span class="ai-lab-text">
            <span class="lang-en"><strong>Practice with the AI Learning Lab</strong> — your student can ask questions and get safe, step-by-step help on tonight's topic.</span>
            <span class="lang-es" lang="es"><strong>Practica con el Laboratorio de IA</strong> — tu estudiante puede hacer preguntas y recibir ayuda segura, paso a paso, sobre el tema de hoy.</span>
          </span>
          <span class="ai-lab-arrow" aria-hidden="true">→</span>
        </a>
        <a href="/curriculum/math-workbench/" target="_blank" rel="noopener" class="ai-lab-cta workbench-cta">
          <span class="ai-lab-emoji" aria-hidden="true">📝</span>
          <span class="ai-lab-text">
            <span class="lang-en"><strong>Open the Math Workbench</strong> — a digital whiteboard to draw, write, and work out problems together.</span>
            <span class="lang-es" lang="es"><strong>Abre la Pizarra de matemáticas</strong> — una pizarra digital para dibujar, escribir y resolver problemas juntos.</span>
          </span>
          <span class="ai-lab-arrow" aria-hidden="true">→</span>
        </a>${offlineCta}
        <p class="bilingual-block">
          <span class="lang-en">These links go to <strong>specific</strong> videos and lessons about tonight's topic — not general math pages.</span>
          <span class="lang-es" lang="es">Estos enlaces van a videos y lecciones <strong>específicas</strong> sobre el tema de hoy — no páginas generales.</span>
        </p>
        <ul class="external-resource-list">
          ${links
            .map(
              (l) => `
            <li>
              <a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="external-resource-link">
                <span class="ext-source">${esc(l.source)}</span>
                <span class="ext-title-en">${esc(l.titleEn)}</span>
                <span class="ext-title-es" lang="es">${esc(l.titleEs)}</span>
              </a>
            </li>`,
            )
            .join("")}
        </ul>
      </section>
    </div>`;
}

export function renderPlayTabPanel(config) {
  const inner = renderPlayTab(config).replace(/<section[^>]*>|<\/section>/g, "");
  return `<div ${tabPanelAttrs("play", true)}>${inner}</div>`;
}

export function renderProblemHintButton(problem, visual = "") {
  const hintEn =
    problem.hints?.[0] ||
    problem.explanation ||
    "Read the question aloud. What do you notice? What operation or idea fits?";
  /* This used to be one fixed Spanish sentence for every problem on the page —
     the English hint was problem-specific, the Spanish one never was. Use the
     curated Spanish hint when the config has one, and only fall back to the
     generic prompt when it genuinely has none. */
  const hintEs =
    problem.hintsEs?.[0] ||
    problem.explanationEs ||
    "Lean la pregunta en voz alta. ¿Qué observan? ¿Qué operación o idea encaja?";
  return helpButton("💡 Stuck? Get a hint / ¿Atorado? Pista", {
    titleEn: "Hint before you check",
    titleEs: "Pista antes de revisar",
    en: hintEn,
    es: hintEs,
    visual,
    frameEn: "Draw it first, then solve. Try saying: “This problem is asking me to…”",
    frameEs: "Dibújenlo primero, luego resuelvan. Intenten decir: “Este problema me pide que…”",
  });
}

export function renderDoneTab() {
  const inner = renderCelebration().replace(/<section[^>]*>|<\/section>/g, "");
  return `<div ${tabPanelAttrs("done", true)}>${inner}</div>`;
}

// Order follows the real family-homework flow: understand the concept, learn the
// vocab (vocab before any activity), do the guided activity together, work it on
// the scratch pad, check understanding, then practice games, then reference
// help/links, then finish. Tab nav + progress read this DOM order directly.
const HOMEWORK_TABS = [
  { id: "learn", icon: "📖", en: "Learn", es: "Aprender" },
  { id: "words", icon: "📚", en: "Words", es: "Palabras" },
  { id: "together", icon: "🤝", en: "Together", es: "Juntos" },
  { id: "workbench", icon: "🧮", en: "Workbench", es: "Pizarra" },
  { id: "check", icon: "✅", en: "Check", es: "Repaso" },
  { id: "arcade", icon: "🕹️", en: "Arcade", es: "Sala de juegos" },
  { id: "play", icon: "🎮", en: "Play", es: "Jugar" },
  { id: "help", icon: "💬", en: "Help", es: "Ayuda" },
  { id: "more", icon: "🌐", en: "More", es: "Más" },
  { id: "done", icon: "🎉", en: "Done", es: "Listo" },
];

export function renderScratchpadHtml() {
  return `
    <div class="interactive-scratchpad card-ish" id="hw_scratchpad_wrapper" hidden>
      <div class="scratchpad-header">
        <div class="scratchpad-title">
          <span class="scratchpad-icon" aria-hidden="true">✏️</span>
          <strong><span class="lang-en">Family Math Scratchpad</span><span class="lang-es" lang="es">Pizarra Familiar de Matemáticas</span></strong>
        </div>
        <div class="scratchpad-tools">
          <div class="color-palette" role="radiogroup" aria-label="Drawing color">
            <button type="button" class="color-dot is-active" data-color="#12355b" style="background:#12355b;" onclick="setScratchpadColor('#12355b', this)" aria-label="Navy pen"></button>
            <button type="button" class="color-dot" data-color="#1fa6a2" style="background:#1fa6a2;" onclick="setScratchpadColor('#1fa6a2', this)" aria-label="Teal pen"></button>
            <button type="button" class="color-dot" data-color="#d97706" style="background:#d97706;" onclick="setScratchpadColor('#d97706', this)" aria-label="Amber pen"></button>
            <button type="button" class="color-dot" data-color="#d9795d" style="background:#d9795d;" onclick="setScratchpadColor('#d9795d', this)" aria-label="Coral pen"></button>
          </div>
          <div class="grid-mode-group">
            <button type="button" class="btn btn-sm btn-outline-secondary grid-btn is-active" onclick="setScratchpadGrid('blank', this)">📄 <span class="lang-en">Blank</span><span class="lang-es" lang="es">Blanco</span></button>
            <button type="button" class="btn btn-sm btn-outline-secondary grid-btn" onclick="setScratchpadGrid('graph', this)">📐 <span class="lang-en">Grid</span><span class="lang-es" lang="es">Cuadrícula</span></button>
            <button type="button" class="btn btn-sm btn-outline-secondary grid-btn" onclick="setScratchpadGrid('dots', this)">⚬ <span class="lang-en">Dots</span><span class="lang-es" lang="es">Puntos</span></button>
          </div>
          <button type="button" class="btn btn-sm btn-secondary tool-btn" id="scratchpad_eraser_btn" onclick="toggleScratchpadEraser()">🧹 <span class="lang-en">Eraser</span><span class="lang-es" lang="es">Borrador</span></button>
          <button type="button" class="btn btn-sm btn-secondary tool-btn" onclick="clearScratchpad()">🗑️ <span class="lang-en">Clear</span><span class="lang-es" lang="es">Borrar</span></button>
          <button type="button" class="scratchpad-close-btn" onclick="toggleScratchpad()" aria-label="Close scratchpad">✕</button>
        </div>
      </div>
      <div class="scratchpad-canvas-wrap">
        <canvas class="scratchpad-canvas" id="hw_scratchpad_canvas" width="760" height="220" style="background:white; width:100%; height:220px; touch-action:none;"></canvas>
      </div>
      <p class="scratchpad-hint"><span class="lang-en">💡 Draw fraction bars, tape diagrams, equations, or line up decimals together!</span><span class="lang-es" lang="es">💡 ¡Dibujen barras de fracciones, modelos o alineen decimales juntos!</span></p>
    </div>`;
}

/* The five stops a family is asked to walk are the primary row; the five extra
   surfaces are real but optional, so they sit behind a divider and read as
   lighter. Ten equal tabs told a family that ten things were required, which
   is the single biggest reason this page felt like a chore. */
const CORE_TAB_IDS = new Set(["learn", "words", "together", "check", "done"]);

export function renderHomeworkTabs(panelsHtml) {
  const tabCount = HOMEWORK_TABS.length;
  const scratchpad = renderScratchpadHtml();
  const tabBtn = (t, i) => `
            <button type="button" role="tab" id="hw_tab_${t.id}" class="homework-tab-btn${CORE_TAB_IDS.has(t.id) ? " is-core" : " is-bonus"}${i === 0 ? " is-active" : ""}"
              aria-selected="${i === 0 ? "true" : "false"}" aria-controls="hw_panel_${t.id}"
              data-tab="${t.id}" onclick="switchHomeworkTab('${t.id}')">
              <span class="tab-icon" aria-hidden="true">${t.icon}</span>
              <span class="tab-label"><span class="tab-en">${t.en}</span><span class="tab-es" lang="es">${t.es}</span></span>
            </button>`;

  const core = HOMEWORK_TABS.filter((t) => CORE_TAB_IDS.has(t.id));
  const bonus = HOMEWORK_TABS.filter((t) => !CORE_TAB_IDS.has(t.id));

  return `
    <div class="homework-tabs-shell" data-tab-count="${tabCount}">
      <div class="homework-tab-chrome">
        <nav class="homework-tab-bar" role="tablist" aria-label="Family homework sections">
          ${core.map((t) => tabBtn(t, HOMEWORK_TABS.indexOf(t))).join("")}
          <span class="homework-tab-divider" aria-hidden="true"></span>
          <span class="homework-tab-bonus-label" aria-hidden="true"><span class="lang-en">Bonus</span><span class="lang-es" lang="es">Extra</span></span>
          ${bonus.map((t) => tabBtn(t, HOMEWORK_TABS.indexOf(t))).join("")}
        </nav>
        ${renderJourneyMap()}
      </div>
      <div class="homework-tab-panels" id="hw_tab_panels">
        ${scratchpad}
        ${panelsHtml}
      </div>
    </div>`;
}

export function renderHelpModal() {
  return `
    <div class="help-modal-overlay" id="help_modal_overlay" hidden onclick="closeHelpModal(event)">
      <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help_modal_title" onclick="event.stopPropagation()">
        <button type="button" class="help-modal-close" onclick="closeHelpModal()" aria-label="Close help">✕</button>
        <h3 id="help_modal_title" class="help-modal-title"></h3>
        <div class="help-modal-visual" id="help_modal_visual" hidden></div>
        <p class="help-modal-body lang-en" id="help_modal_en"></p>
        <p class="help-modal-body lang-es" lang="es" id="help_modal_es"></p>
        <div class="help-modal-frame" id="help_modal_frame" hidden>
          <span class="help-frame-tag">✏️ Sentence starter / Para empezar</span>
          <span class="help-frame-en lang-en" id="help_modal_frame_en"></span>
          <span class="help-frame-es lang-es" lang="es" id="help_modal_frame_es"></span>
        </div>
      </div>
    </div>`;
}

export const HOMEWORK_TABS_JS = `
function journeyStorageKey() {
  return 'hw_journey_' + (window.LESSON_ID || location.pathname);
}

/* ── Family Game Break (Together tab) ─────────────────────────────────────
   Two content-free game engines; the content ships as the JSON island
   window.__HW_FAMGAMES__ rendered by renderFamilyGameBreak(). No timers. */
var famMem = { first: null, lock: false, matches: 0, flips: 0 };
var famTf = { idx: 0, score: 0, answered: 0 };

function famGamesData() {
  var d = window.__HW_FAMGAMES__;
  return d && Array.isArray(d.pairs) && Array.isArray(d.tf) ? d : null;
}

function resetMemoryGame() {
  var data = famGamesData();
  var grid = document.getElementById('fam_memory_grid');
  if (!data || !grid) return;
  famMem = { first: null, lock: false, matches: 0, flips: 0 };
  var win = document.getElementById('fam_memory_win');
  if (win) win.hidden = true;
  updateMemoryStatus();
  var faces = [];
  data.pairs.forEach(function (p, i) {
    faces.push({ pair: i, text: p.a });
    faces.push({ pair: i, text: p.b });
  });
  // Runtime shuffle on purpose — each rematch deals a fresh layout.
  for (var i = faces.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = faces[i]; faces[i] = faces[j]; faces[j] = t;
  }
  grid.innerHTML = '';
  faces.forEach(function (f) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fam-mem-card';
    btn.dataset.pair = String(f.pair);
    btn.setAttribute('aria-label', 'Face-down card');
    var inner = document.createElement('span');
    inner.className = 'fam-mem-face';
    inner.textContent = f.text;
    btn.appendChild(inner);
    btn.addEventListener('click', function () { flipMemoryCard(btn); });
    grid.appendChild(btn);
  });
}

function updateMemoryStatus() {
  ['fam_mem_matches', 'fam_mem_matches_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(famMem.matches);
  });
  ['fam_mem_flips', 'fam_mem_flips_es'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(famMem.flips);
  });
}

function flipMemoryCard(btn) {
  if (famMem.lock || btn.classList.contains('is-up') || btn.classList.contains('is-matched')) return;
  btn.classList.add('is-up');
  btn.setAttribute('aria-label', btn.querySelector('.fam-mem-face').textContent);
  famMem.flips++;
  updateMemoryStatus();
  if (!famMem.first) { famMem.first = btn; return; }
  var a = famMem.first;
  famMem.first = null;
  if (a.dataset.pair === btn.dataset.pair) {
    a.classList.add('is-matched');
    btn.classList.add('is-matched');
    famMem.matches++;
    updateMemoryStatus();
    if (typeof playCorrectSound === 'function') playCorrectSound();
    if (famMem.matches >= 4) {
      var win = document.getElementById('fam_memory_win');
      if (win) win.hidden = false;
      if (typeof triggerCelebration === 'function') triggerCelebration();
    }
  } else {
    famMem.lock = true;
    setTimeout(function () {
      a.classList.remove('is-up');
      btn.classList.remove('is-up');
      a.setAttribute('aria-label', 'Face-down card');
      btn.setAttribute('aria-label', 'Face-down card');
      famMem.lock = false;
    }, 950);
  }
}

/* The page has three language modes (bilingual default / en / es), carried by
   CSS on .lang-en/.lang-es spans — so JS-written text uses the SAME span pair
   and inherits whichever mode the family picked, live. */
function setBiText(el, en, es) {
  if (!el) return;
  el.textContent = '';
  var a = document.createElement('span');
  a.className = 'lang-en';
  a.textContent = en;
  var b = document.createElement('span');
  b.className = 'lang-es';
  b.setAttribute('lang', 'es');
  b.textContent = es;
  el.appendChild(a);
  el.appendChild(b);
}

function renderTfQuestion() {
  var data = famGamesData();
  if (!data) return;
  var q = data.tf[famTf.idx];
  var turnEl = document.getElementById('fam_tf_turn');
  var stEl = document.getElementById('fam_tf_statement');
  var fb = document.getElementById('fam_tf_feedback');
  var doneEl = document.getElementById('fam_tf_done');
  var btnT = document.getElementById('fam_tf_true_btn');
  var btnF = document.getElementById('fam_tf_false_btn');
  if (!q) {
    if (stEl) stEl.textContent = '';
    if (turnEl) turnEl.textContent = '';
    if (btnT) btnT.hidden = true;
    if (btnF) btnF.hidden = true;
    if (fb) fb.hidden = true;
    if (doneEl) {
      doneEl.hidden = false;
      var perfect = famTf.score === data.tf.length;
      var lead = perfect ? '🏆 ' : '🎉 ';
      setBiText(
        doneEl,
        lead + 'Team score: ' + famTf.score + ' out of ' + data.tf.length + (perfect ? ' — perfect game!' : '. Read the whys together and rematch!'),
        lead + 'Resultado del equipo: ' + famTf.score + ' de ' + data.tf.length + (perfect ? ' — ¡puntuación perfecta!' : '. Revisen los porqués y jueguen otra vez.'),
      );
      if (typeof triggerCelebration === 'function' && perfect) triggerCelebration();
    }
    return;
  }
  if (doneEl) doneEl.hidden = true;
  if (btnT) { btnT.hidden = false; btnT.disabled = false; }
  if (btnF) { btnF.hidden = false; btnF.disabled = false; }
  if (fb) fb.hidden = true;
  var who = famTf.idx % 2 === 0;
  var pos = ' · ' + (famTf.idx + 1) + ' / ' + data.tf.length;
  setBiText(
    turnEl,
    (who ? "🧑‍🎓 Student's turn" : "👪 Family member's turn") + pos,
    (who ? '🧑‍🎓 Turno del estudiante' : '👪 Turno de la familia') + pos,
  );
  setBiText(stEl, q.en, q.es);
  updateTfScore();
}

function updateTfScore() {
  var el = document.getElementById('fam_tf_score');
  if (!el) return;
  var tail = famTf.score + ' / ' + famTf.answered;
  setBiText(el, 'Team score: ' + tail, 'Puntos del equipo: ' + tail);
}

function answerTf(saidTrue) {
  var data = famGamesData();
  var q = data && data.tf[famTf.idx];
  if (!q) return;
  var btnT = document.getElementById('fam_tf_true_btn');
  var btnF = document.getElementById('fam_tf_false_btn');
  if (btnT) btnT.disabled = true;
  if (btnF) btnF.disabled = true;
  var right = saidTrue === q.answer;
  famTf.answered++;
  if (right) famTf.score++;
  var verdict = document.getElementById('fam_tf_verdict');
  var why = document.getElementById('fam_tf_why');
  var fb = document.getElementById('fam_tf_feedback');
  if (verdict) {
    setBiText(
      verdict,
      right ? '✅ Correct!' : '❌ Not quite — it was ' + (q.answer ? 'TRUE.' : 'FALSE.'),
      right ? '✅ ¡Correcto!' : '❌ No exactamente — era ' + (q.answer ? 'VERDADERO.' : 'FALSO.'),
    );
    verdict.className = 'fam-tf-verdict ' + (right ? 'is-right' : 'is-wrong');
  }
  setBiText(why, q.whyEn, q.whyEs);
  if (fb) fb.hidden = false;
  if (right && typeof playCorrectSound === 'function') playCorrectSound();
  updateTfScore();
}

function nextTf() {
  famTf.idx++;
  renderTfQuestion();
}

function resetTfGame() {
  famTf = { idx: 0, score: 0, answered: 0 };
  renderTfQuestion();
}

function initFamilyGames() {
  if (!famGamesData() || !document.getElementById('fam_game_break')) return;
  resetMemoryGame();
  resetTfGame();
}

/* Tonight's Path roadmap: light up the current stop, keep a persistent check
   on every stop the family has visited for THIS lesson. */
function updateJourneyMap(tabId) {
  const stops = document.querySelectorAll('[data-journey-stop]');
  if (!stops.length) return;
  let visited = {};
  try { visited = JSON.parse(localStorage.getItem(journeyStorageKey()) || '{}') || {}; } catch (e) {}
  if (tabId && !visited[tabId]) {
    visited[tabId] = true;
    try { localStorage.setItem(journeyStorageKey(), JSON.stringify(visited)); } catch (e) {}
  }
  const order = ['learn', 'words', 'together', 'check', 'done'];
  stops.forEach(function (s) {
    const id = s.dataset.journeyStop;
    s.classList.toggle('is-current', id === tabId);
    s.classList.toggle('is-done', !!visited[id]);
  });
  // Fill the connecting line up to the furthest stop reached, so the rail
  // reads as progress and not just as five buttons.
  const fill = document.getElementById('hw_rail_fill');
  if (fill) {
    let furthest = -1;
    order.forEach(function (id, i) { if (visited[id]) furthest = i; });
    const cur = order.indexOf(tabId);
    if (cur > furthest) furthest = cur;
    const pct = furthest <= 0 ? 0 : (furthest / (order.length - 1)) * 100;
    fill.style.width = pct + '%';
  }
}

function syncHomeworkChromeHeights() {
  const status = document.querySelector('.bottom-status-bar');
  const tabBar = document.querySelector('.homework-tab-bar');
  const statusH = status ? Math.ceil(status.getBoundingClientRect().height) : 104;
  const tabH = tabBar ? Math.ceil(tabBar.getBoundingClientRect().height) : 72;
  document.documentElement.style.setProperty('--hw-status-height', statusH + 'px');
  document.documentElement.style.setProperty('--hw-tab-height', tabH + 'px');
  // Tab bar is a sticky TOP bar, so only reserve space for the bottom status bar.
  document.body.style.paddingBottom = (statusH + 16) + 'px';
}

function switchHomeworkTab(tabId) {
  const tabs = document.querySelectorAll('.homework-tab-btn');
  const panels = document.querySelectorAll('[data-tab-panel]');
  let idx = 0;
  tabs.forEach(function(btn, i) {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
    if (active) idx = i + 1;
  });
  panels.forEach(function(p) {
    p.hidden = p.dataset.tabPanel !== tabId;
  });
  const prog = document.getElementById('hw_tab_progress');
  const total = document.querySelector('.homework-tabs-shell')?.dataset.tabCount || '10';
  if (prog) prog.textContent = idx + ' of ' + total + ' / ' + idx + ' de ' + total;
  const fill = document.getElementById('tab_progress_fill');
  if (fill) fill.style.width = ((idx / parseInt(total, 10)) * 100) + '%';
  if (typeof updateJourneyMap === 'function') updateJourneyMap(tabId);
  if (typeof playTabSwitchSound === 'function') playTabSwitchSound();
  if (tabId === 'play' && typeof initHomeworkGame === 'function') initHomeworkGame();
  if (tabId === 'arcade') {
    var af = document.querySelector('.arcade-frame');
    if (af && !af.getAttribute('src') && af.dataset.src) af.setAttribute('src', af.dataset.src);
  }
  if (tabId === 'done' && typeof updateCelebrationTab === 'function') {
    updateCelebrationTab();
  }
  const activeBtn = document.getElementById('hw_tab_' + tabId);
  if (activeBtn) {
    activeBtn.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    activeBtn.focus();
  }
  try { localStorage.setItem('hw_last_tab', tabId); } catch(e) {}
  if (typeof initHomeworkVocabPopups === 'function') {
    initHomeworkVocabPopups();
  }
}

function openHelpModalFromBtn(btn) {
  try {
    const data = JSON.parse(btn.getAttribute('data-help') || '{}');
    openHelpModal(data);
  } catch(e) {}
}

function openHelpModal(data) {
  const overlay = document.getElementById('help_modal_overlay');
  if (!overlay) return;
  document.getElementById('help_modal_title').textContent =
    (data.titleEn || 'Help') + ' / ' + (data.titleEs || 'Ayuda');
  document.getElementById('help_modal_en').textContent = data.en || '';
  document.getElementById('help_modal_es').textContent = data.es || '';
  var vis = document.getElementById('help_modal_visual');
  if (vis) {
    if (data.visual) { vis.innerHTML = data.visual; vis.hidden = false; }
    else { vis.innerHTML = ''; vis.hidden = true; }
  }
  var frame = document.getElementById('help_modal_frame');
  if (frame) {
    if (data.frameEn || data.frameEs) {
      document.getElementById('help_modal_frame_en').textContent = data.frameEn || '';
      document.getElementById('help_modal_frame_es').textContent = data.frameEs || '';
      frame.hidden = false;
    } else {
      frame.hidden = true;
    }
  }
  overlay.hidden = false;
  document.body.classList.add('help-modal-open');
  overlay.querySelector('.help-modal-close')?.focus();
}

function closeHelpModal(ev) {
  if (ev && ev.target !== ev.currentTarget) return;
  const overlay = document.getElementById('help_modal_overlay');
  if (overlay) overlay.hidden = true;
  document.body.classList.remove('help-modal-open');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeHelpModal();
});

function triggerCelebration() {
  document.querySelector('.section-celebrate')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setLanguageMode(mode) {
  try { localStorage.setItem('hw_lang_mode', mode); } catch(e) {}
  document.body.classList.remove('lang-mode-bilingual', 'lang-mode-en', 'lang-mode-es');
  document.body.classList.add('lang-mode-' + mode);
  document.querySelectorAll('.lang-toggle-btn').forEach(function(btn) {
    const active = btn.getAttribute('data-lang-mode') === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function toggleSignoffSubmitBtn() {
  const checkbox = document.getElementById('parent_reviewed_checkbox');
  const nameInput = document.getElementById('parent_name_input');
  const submitBtn = document.getElementById('submit_signoff_btn');
  if (checkbox && nameInput && submitBtn) {
    submitBtn.disabled = !(checkbox.checked && nameInput.value.trim().length > 0);
  }
}

function saveParentSignoff() {
  const nameVal = document.getElementById('parent_name_input')?.value.trim();
  const noteVal = document.getElementById('parent_note_input')?.value.trim();
  const checked = document.getElementById('parent_reviewed_checkbox')?.checked;
  const lessonId = window.LESSON_ID || 'general';
  const lessonTitle = window.LESSON_TITLE || "Tonight's Lesson";
  
  if (!checked || !nameVal) return;
  
  const signoffDate = new Date().toLocaleDateString(undefined, { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  
  const payload = {
    parentName: nameVal,
    note: noteVal,
    date: signoffDate,
    lessonTitle: lessonTitle
  };
  
  try {
    localStorage.setItem('hw_parent_signoff_' + lessonId, JSON.stringify(payload));
  } catch(e) {}

  /* localStorage stays the source of truth for what this page displays, but a
     sign-off the teacher never sees is not a sign-off. Fire-and-forget POST:
     the endpoint always answers 204, and any failure here is swallowed so a
     family on a bad connection still gets their confirmation. */
  try {
    var signoffBody = JSON.stringify({
      lessonId: lessonId,
      lessonTitle: lessonTitle,
      parentName: nameVal,
      note: noteVal,
      date: signoffDate,
      studentName: (window.NeftSaveResume && window.NeftSaveResume.studentName) || '',
      section: (window.NeftSaveResume && window.NeftSaveResume.section) || ''
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/progress/family-signoff', new Blob([signoffBody], { type: 'application/json' }));
    } else {
      fetch('/api/progress/family-signoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: signoffBody,
        keepalive: true
      }).catch(function() {});
    }
  } catch(e) {}

  updateSignoffUI(payload);
}

function updateSignoffUI(data) {
  const nameEl = document.getElementById('display_parent_name');
  if (nameEl) nameEl.textContent = data.parentName;
  
  const dateEl = document.getElementById('display_signoff_date');
  if (dateEl) dateEl.textContent = data.date;
  
  const noteBox = document.getElementById('display_parent_note_box');
  const noteEl = document.getElementById('display_parent_note');
  if (noteBox && noteEl) {
    if (data.note) {
      noteEl.textContent = data.note;
      noteBox.hidden = false;
    } else {
      noteBox.hidden = true;
    }
  }
  
  const formWrap = document.getElementById('signoff_form_wrapper');
  const confWrap = document.getElementById('signoff_confirmed_wrapper');
  if (formWrap) formWrap.hidden = true;
  if (confWrap) confWrap.hidden = false;
  
  const printTitle = document.getElementById('print_lesson_title');
  if (printTitle) printTitle.textContent = data.lessonTitle;
  
  const printName = document.getElementById('print_parent_name');
  if (printName) printName.textContent = data.parentName;
  
  const printDate = document.getElementById('print_signoff_date');
  if (printDate) printDate.textContent = data.date.split(' at ')[0];
  
  const printNoteWrapper = document.getElementById('print_parent_note_wrapper');
  const printNote = document.getElementById('print_parent_note');
  if (printNoteWrapper && printNote) {
    if (data.note) {
      printNote.textContent = data.note;
      printNoteWrapper.style.display = 'block';
    } else {
      printNoteWrapper.style.display = 'none';
    }
  }
  
  const printCert = document.getElementById('print_only_certificate');
  if (printCert) printCert.classList.add('is-signed');
}

function editParentSignoff() {
  const formWrap = document.getElementById('signoff_form_wrapper');
  const confWrap = document.getElementById('signoff_confirmed_wrapper');
  if (formWrap) formWrap.hidden = false;
  if (confWrap) confWrap.hidden = true;
  
  const printCert = document.getElementById('print_only_certificate');
  if (printCert) printCert.classList.remove('is-signed');
}

function restoreParentSignoff() {
  try {
    const langMode = localStorage.getItem('hw_lang_mode') || 'bilingual';
    setLanguageMode(langMode);
  } catch(e) {
    setLanguageMode('bilingual');
  }

  const lessonId = window.LESSON_ID || 'general';
  try {
    const saved = localStorage.getItem('hw_parent_signoff_' + lessonId);
    if (saved) {
      const data = JSON.parse(saved);
      const nameInput = document.getElementById('parent_name_input');
      const noteInput = document.getElementById('parent_note_input');
      const checkbox = document.getElementById('parent_reviewed_checkbox');
      if (nameInput) nameInput.value = data.parentName || '';
      if (noteInput) noteInput.value = data.note || '';
      if (checkbox) checkbox.checked = true;
      toggleSignoffSubmitBtn();
      
      updateSignoffUI(data);
    }
  } catch(e) {}
}

function initHomeworkPage() {
  syncHomeworkChromeHeights();
  window.addEventListener('resize', syncHomeworkChromeHeights);
  // Measure again once fonts and images have settled: a reading taken mid
  // layout reported the status bar three times its rendered height, and the
  // floating launchers are positioned off that number.
  window.addEventListener('load', syncHomeworkChromeHeights);
  document.querySelectorAll('[data-tab-panel]').forEach(function(p, i) {
    p.hidden = i > 0;
  });
  try {
    const last = localStorage.getItem('hw_last_tab');
    if (last && document.getElementById('hw_tab_' + last)) switchHomeworkTab(last);
    else switchHomeworkTab('learn');
  } catch(e) {}
  restoreParentSignoff();
  initDrawCanvases();
  initHomeworkVocabPopups();
  initFamilyGames();
  // Entrance motion is opt-in and only after boot: its start state is
  // opacity:0, so gating it on this class means a page whose script failed
  // still shows every word instead of an empty cream rectangle.
  document.body.classList.add('hw-motion-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeworkPage);
} else {
  initHomeworkPage();
}

// Tap-to-define vocab glossary. Mirrors the lesson engine's underlineVocabTerms +
// objective-term popup so math words in the family notes/practice get the SAME
// simple EN/ES definition + picture. All term matching (regex source + normalized
// lookup, including prime/composite-style aliases) is precomputed in Node and
// handed over as window.__HW_VOCAB_MATCH__, so the browser only walks text nodes.
function initHomeworkVocabPopups() {
  var list = Array.isArray(window.__HW_VOCAB__) ? window.__HW_VOCAB__ : [];
  var match = window.__HW_VOCAB_MATCH__ || null;
  var container = document.getElementById('hw_tab_panels');
  if (!container || !list.length || !match || !match.regexSource) return;
  var lookup = match.lookup || {};
  // Mirrors normalizeVocabSurface in engine/core/vocab-match.js, which built the
  // lookup keys: lowercase, collapse spaces, and undo the plural — including the
  // "-y" head that takes "-ies" ("identity properties" -> "identity property").
  function norm(s) {
    var t = String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (/[^aeiou]ies$/.test(t)) return t.replace(/ies$/, 'y');
    return t.replace(/s$/, '');
  }
  // Mirrors surfaceMatchesEntry: an acronym entry answers only to its exact
  // written form, so "MAD" opens the popup and "mad" in a sentence never does.
  function surfaceFits(surface, entry) {
    if (!entry || !entry.cs) return true;
    return String(surface || '').replace(/(?:es|s)$/, '') === String(entry.term);
  }
  var re = new RegExp(match.regexSource, 'gi');
  // Never rewrite inside controls, inputs, the vocab flashcards (already defined
  // there), an already-wrapped term, or the popup itself.
  var EXCL = 'button, a[href], input, textarea, select, option, label, summary, script, style, svg, code, kbd, .obj-term, .obj-popup-backdrop, .vocab-card, .vocab-container, [data-no-vocab]';
  var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      var parent = node.parentElement;
      if (!node.textContent || !node.textContent.trim() || !parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(EXCL)) return NodeFilter.FILTER_REJECT;
      re.lastIndex = 0;
      return re.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  var nodes = [];
  for (var n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  nodes.forEach(function(textNode) {
    var text = textNode.textContent;
    var frag = document.createDocumentFragment();
    var cursor = 0, changed = false, m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      var key = norm(m[0]);
      var idx = Object.prototype.hasOwnProperty.call(lookup, key) ? lookup[key] : -1;
      if (idx < 0 || !surfaceFits(m[0], list[idx])) continue;
      frag.appendChild(document.createTextNode(text.slice(cursor, m.index)));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'obj-term';
      btn.setAttribute('data-term-idx', String(idx));
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-label', m[0] + ': open definition');
      btn.textContent = m[0];
      frag.appendChild(btn);
      cursor = m.index + m[0].length;
      changed = true;
    }
    if (!changed) return;
    frag.appendChild(document.createTextNode(text.slice(cursor)));
    textNode.parentNode.replaceChild(frag, textNode);
  });

  var backdrop = null, lastFocus = null, keyHandler = null;
  function closePopup() {
    var bd = window.__hwVocabBackdrop || backdrop;
    if (!bd) return;
    bd.setAttribute('hidden', '');
    bd.hidden = true;
    bd.style.display = 'none';
    document.body.classList.remove('obj-popup-open');
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch(_e) {}
    }
    lastFocus = null;
  }
  window.__closeHwVocabPopup = closePopup;

  function getPopup() {
    if (window.__hwVocabBackdrop && document.body.contains(window.__hwVocabBackdrop)) {
      backdrop = window.__hwVocabBackdrop;
      return backdrop;
    }
    backdrop = document.createElement('div');
    backdrop.className = 'obj-popup-backdrop';
    backdrop.setAttribute('hidden', '');
    backdrop.hidden = true;
    backdrop.style.display = 'none';
    backdrop.innerHTML =
      '<div class="obj-popup" role="dialog" aria-modal="true" aria-labelledby="hw-obj-term">' +
      '<button type="button" class="obj-popup-close" aria-label="Close" onclick="window.__closeHwVocabPopup && window.__closeHwVocabPopup()">&times;</button>' +
      '<h3 id="hw-obj-term" class="obj-popup-term"></h3>' +
      '<p class="obj-popup-translation"><span class="obj-popup-tr-label">Español:</span> <span class="obj-popup-tr-es" lang="es"></span></p>' +
      '<p class="obj-popup-def"></p>' +
      '<p class="obj-popup-def-es" lang="es"></p>' +
      '<figure class="obj-popup-visual"><img class="obj-popup-img" alt="" /><figcaption class="obj-popup-example"></figcaption></figure>' +
      '</div>';
    document.body.appendChild(backdrop);
    window.__hwVocabBackdrop = backdrop;
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      }
    });
    var closeBtn = backdrop.querySelector('.obj-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      });
      closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      });
    }
    return backdrop;
  }
  function openPopup(entry) {
    if (!entry) return;
    var bd = getPopup();
    bd.querySelector('.obj-popup-term').textContent = entry.term ? String(entry.term) : '';
    var trRow = bd.querySelector('.obj-popup-translation');
    var trEs = bd.querySelector('.obj-popup-tr-es');
    if (entry.termEs) { trEs.textContent = String(entry.termEs); trRow.hidden = false; }
    else { trEs.textContent = ''; trRow.hidden = true; }
    var img = bd.querySelector('.obj-popup-img');
    if (entry.img) { img.src = entry.img; img.alt = entry.imgAlt || ''; img.hidden = false; }
    else { img.removeAttribute('src'); img.alt = ''; img.hidden = true; }
    var ex = bd.querySelector('.obj-popup-example');
    ex.textContent = entry.example ? String(entry.example) : '';
    ex.hidden = !entry.example;
    var fig = bd.querySelector('.obj-popup-visual');
    if (fig) fig.hidden = !entry.img && !entry.example;
    bd.querySelector('.obj-popup-def').textContent = entry.def ? String(entry.def) : '';
    var esEl = bd.querySelector('.obj-popup-def-es');
    if (entry.defEs) { esEl.textContent = String(entry.defEs); esEl.hidden = false; }
    else { esEl.textContent = ''; esEl.hidden = true; }
    lastFocus = document.activeElement;
    bd.removeAttribute('hidden');
    bd.hidden = false;
    bd.style.display = 'flex';
    document.body.classList.add('obj-popup-open');
    var cb = bd.querySelector('.obj-popup-close');
    if (cb && cb.focus) cb.focus();
    keyHandler = function(e) { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', keyHandler);
  }
  container.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.obj-term') : null;
    if (!btn || !container.contains(btn)) return;
    e.preventDefault();
    var idx = Number(btn.getAttribute('data-term-idx'));
    if (Number.isInteger(idx)) openPopup(list[idx]);
  });
}

// Make every "Draw your model" grid an actual drawable surface (mouse + touch + stylus).
function initDrawCanvases() {
  document.querySelectorAll('[data-draw-frame]').forEach(function(frame) {
    const canvas = frame.querySelector('[data-draw-canvas]');
    if (!canvas || canvas.dataset.ready) return;
    canvas.dataset.ready = '1';
    const ctx = canvas.getContext('2d');
    let drawing = false, last = null;
    function resize() {
      const r = frame.getBoundingClientRect();
      if (!r.width) return;
      const prev = canvas.toDataURL && canvas.width ? canvas.toDataURL() : null;
      canvas.width = Math.round(r.width); canvas.height = Math.round(r.height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#12355b';
      if (prev) { const img = new Image(); img.onload = function(){ ctx.drawImage(img,0,0,canvas.width,canvas.height); }; img.src = prev; }
    }
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function start(e) { drawing = true; last = pos(e); e.preventDefault(); }
    function move(e) {
      if (!drawing) return;
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; e.preventDefault();
    }
    function end() { drawing = false; }
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    const clearBtn = frame.querySelector('[data-draw-clear]');
    if (clearBtn) clearBtn.addEventListener('click', function(){ ctx.clearRect(0,0,canvas.width,canvas.height); });
    resize();
    window.addEventListener('resize', resize);
  });
}
`;

export const GUIDED_NOTES_CSS = `
/* Tap-to-define vocab glossary — parity with the lesson engine's .obj-term popups.
   Math words in the notes/practice prose become dotted-underline buttons that open
   a simple EN/ES definition + illustration, exactly like the lessons. */
.obj-term {
  display: inline; margin: -6px 0; padding: 6px 2px; border: 0; background: none;
  touch-action: manipulation;
  font: inherit; color: inherit; cursor: pointer;
  text-decoration: underline; text-decoration-style: dotted;
  text-decoration-thickness: 2px; text-underline-offset: 2px;
  text-decoration-color: var(--teal, #1fa6a2);
}
.obj-term:hover, .obj-term:focus-visible {
  text-decoration-style: solid; background: var(--teal-light, #dff2ee);
  border-radius: 4px; outline: none;
}
@keyframes objFadeIn { from { opacity: 0; } to { opacity: 1; } }
.obj-popup-backdrop {
  position: fixed; inset: 0; z-index: 1200; display: flex;
  align-items: center; justify-content: center; padding: 18px;
  background: rgba(15, 23, 42, 0.55); animation: objFadeIn 0.15s ease;
}
.obj-popup-backdrop[hidden] { display: none; }
.obj-popup {
  position: relative; width: min(420px, 100%); max-height: 90vh;
  overflow-y: auto; background: var(--white, #fff);
  border-radius: var(--radius-lg, 22px);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.3);
  padding: 26px 20px 20px; text-align: center; animation: objFadeIn 0.2s ease;
}
.obj-popup-close {
  position: absolute; top: 8px; right: 10px; width: 44px; height: 44px;
  border: 0; border-radius: 50%; background: var(--cream, #f7f4ec);
  color: var(--navy, #12355b); font-size: 1.5rem; line-height: 1; cursor: pointer;
}
.obj-popup-close:hover { background: var(--teal-light, #dff2ee); }
.obj-popup-term { margin: 0 0 14px; color: var(--teal-ink, #0c6f6b); text-transform: capitalize; }
.obj-popup-translation {
  display: flex; align-items: baseline; gap: 10px; margin: 0 0 14px;
  padding: 10px 14px; background: var(--teal-light, #dff2ee); border-radius: var(--radius-md, 14px);
}
.obj-popup-translation[hidden] { display: none; }
.obj-popup-tr-label { font-weight: 700; color: var(--teal-ink, #0c6f6b); }
.obj-popup-tr-es { font-size: 1.1rem; font-weight: 600; color: var(--navy, #12355b); }
.obj-popup-def { margin: 0; font-size: 1.05rem; line-height: 1.5; color: var(--navy, #12355b); }
.obj-popup-def-es { margin: 10px 0 0; font-style: italic; color: var(--muted, #5f6f80); }
.obj-popup-def-es[hidden] { display: none; }
.obj-popup-visual { margin: 14px 0 0; }
.obj-popup-visual[hidden] { display: none; }
.obj-popup-img { display: block; width: 100%; max-width: 200px; height: auto; margin: 0 auto 10px; }
.obj-popup-example { margin: 0; font-weight: 600; color: var(--navy, #12355b); }
.obj-popup-example[hidden] { display: none; }
body.obj-popup-open { overflow: hidden; }

/* Family guided notes layout */
.family-welcome {
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  color: var(--white);
  border: none;
  padding: 28px 24px;
}
.welcome-hero {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}
.welcome-emoji { font-size: 48px; line-height: 1; }
.welcome-tag {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--teal-light);
  font-weight: 800;
}
.welcome-title-en, .welcome-title-es {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(26px, 5vw, 34px);
  font-weight: 800;
  line-height: 1.15;
}
.welcome-title-es { color: var(--amber); font-size: clamp(22px, 4.5vw, 30px); margin-top: 2px; }
.welcome-lesson { margin: 8px 0 0; font-size: 16px; color: var(--teal-light); font-weight: 600; }
.welcome-lead { margin: 0 0 12px; font-size: 15px; line-height: 1.5; }
.family-welcome .back-link { color: var(--amber); margin: 0; }
.family-welcome .back-link:hover { color: var(--white); }

.bilingual-block, .bilingual-grid { display: flex; flex-direction: column; gap: 10px; }
.bilingual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) {
  .bilingual-grid { grid-template-columns: 1fr; }
}
.bilingual-col {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
}
.lang-label {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--teal-ink);
  margin-bottom: 6px;
}
.lang-en { margin: 0 0 6px; }
/* Spanish is a primary language for our families: keep it fully legible, not a faded subtitle. */
.lang-es { margin: 0; color: var(--ink); font-style: normal; }
.step-badge .lang-en, .step-badge .lang-es { color: inherit; }
.lang-en + .lang-es, .worked-step .lang-es { padding-left: 10px; border-left: 3px solid var(--teal); }
.welcome-lead .lang-es { color: rgba(255, 255, 255, 0.94); border-left: 3px solid var(--amber); padding-left: 10px; display: inline-block; margin-top: 6px; }
.learning-big { font-size: 17px; font-weight: 700; color: var(--navy); margin: 0 0 8px; line-height: 1.4; }
.learning-words { margin-top: 12px; }
.learning-words-label {
  display: block;
  margin-bottom: 7px;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  color: var(--navy);
}
.learning-word-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.learning-word-chips li {
  padding: 5px 9px;
  border: 1px solid #b8ddd8;
  border-radius: 999px;
  background: var(--teal-light);
  color: var(--teal-ink);
  font-size: 12px;
  font-weight: 700;
}

.guided-section { scroll-margin-top: 16px; }
.section-learn { border-left: 4px solid var(--teal); }
.section-visual { border-left: 4px solid var(--amber); }
.section-together { border-left: 4px solid #5b8def; }
.section-vocab { border-left: 4px solid var(--coral); }
.section-stuck { border-left: 4px solid #9b59b6; }
.section-quick-intro { border-left: 4px solid var(--success); }
.quick-check-time {
  background: var(--amber-light);
  border: 1px solid var(--amber);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 0 0 12px;
  font-size: 15px;
}
.section-celebrate {
  border-left: 4px solid var(--amber);
  background: linear-gradient(180deg, var(--amber-light), var(--white));
  text-align: center;
}

.concept-visual-wrap { margin: 12px 0 16px; overflow-x: auto; }
.concept-svg { width: 100%; max-width: 420px; height: auto; display: block; margin: 0 auto; }
.concept-fallback-visual { display: flex; flex-direction: column; gap: 8px; }
.concept-fallback-step {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  font-weight: 600; font-size: 14px;
}
.step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; color: var(--white);
  flex-shrink: 0;
}
.step-color-1 .step-dot, .step-color-1.step-badge { background: #5b8def; }
.step-color-2 .step-dot, .step-color-2.step-badge { background: var(--success); }
.step-color-3 .step-dot, .step-color-3.step-badge { background: var(--amber); color: var(--navy); }
.step-color-4 .step-dot, .step-color-4.step-badge { background: var(--coral); }

.concept-quick-wrap {
  margin: 0 0 16px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: #fbfdff;
}
.concept-quick-title {
  margin: 0 0 10px;
  text-align: center;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  color: var(--navy);
}
.concept-quick-path {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.concept-quick-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 82px;
  padding: 9px 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--navy);
  text-align: center;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
}
.concept-quick-step:not(:last-child)::after {
  content: "→";
  position: absolute;
  right: -9px;
  z-index: 1;
  color: var(--teal-ink);
  font-size: 16px;
}
.concept-quick-icon { font-size: 24px; line-height: 1; margin-bottom: 5px; }
.concept-quick-step .lang-es { color: var(--muted); font-size: 11px; }

.key-idea-banner {
  background: var(--teal-light);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-bottom: 16px;
  border: 1px solid #b8ddd8;
}
.key-idea-banner p { margin: 0 0 6px; font-size: 14.5px; }
.key-idea-banner p:last-child { margin-bottom: 0; }

.guided-steps, .together-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.guided-step, .together-step {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: var(--white);
}
.guided-step { padding: 16px; }
.guided-step-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.guided-step-head > div { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
.guided-step-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  background: var(--cream);
  font-size: 22px;
}
.step-cue-label {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  color: var(--navy);
}
.step-cue-label .lang-en, .step-cue-label .lang-es { display: inline; margin: 0; }
.step-cue-label .lang-es::before { content: " / "; color: var(--muted); }
.guided-step-head .step-badge { margin: 0; }
.guided-step .step-lead { font-size: 16px; font-weight: 700; line-height: 1.45; }
.step-detail {
  margin-top: 10px;
  border-top: 1px dashed var(--line);
  padding-top: 9px;
}
.step-detail summary {
  cursor: pointer;
  color: var(--teal-ink);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
}
.step-detail p { margin-top: 8px; color: var(--ink); font-weight: 400; }
.step-badge {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--white);
  padding: 3px 8px;
  border-radius: 99px;
  margin-bottom: 8px;
}
.guided-step p, .together-step p { margin: 0 0 6px; font-size: 14.5px; line-height: 1.45; }
.step-hint {
  margin: 8px 0 0 !important;
  padding: 8px 10px;
  background: var(--hint-bg);
  border-radius: var(--radius-sm);
  font-size: 13px !important;
  color: var(--hint);
}

.watch-for-list { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.watch-for-list li {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 10px 12px; background: var(--cream); border-radius: var(--radius-sm);
}
.watch-icon { font-size: 20px; flex-shrink: 0; }

@media (max-width: 560px) {
  .concept-quick-path { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .concept-quick-step:nth-child(2)::after { display: none; }
}

@media print {
  .concept-quick-path { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .step-detail > summary { display: none; }
  .step-detail[open] > summary ~ *, .step-detail > * { display: block; }
}

.try-scenario { font-size: 15px; font-weight: 600; color: var(--navy); margin: 0 0 8px; }
.try-together-note { font-size: 14px; margin: 0 0 14px; color: var(--muted); }

.stuck-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 12px;
}
@media (max-width: 640px) { .stuck-grid { grid-template-columns: 1fr; } }
.stuck-panel {
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  border: 1px solid var(--line);
}
.stuck-say { background: var(--success-bg); border-color: var(--success); }
.stuck-dont { background: var(--error-bg); border-color: var(--error); }
.stuck-heading { margin: 0 0 10px; font-family: var(--font-display); font-size: 14px; color: var(--navy); }
.stuck-panel ul { margin: 0; padding-left: 16px; }
.stuck-panel li { margin-bottom: 10px; font-size: 14px; }
.stuck-panel li p { margin: 0 0 4px; }
.stuck-footer { font-size: 14px; color: var(--muted); margin: 0; }

.celebrate-text { font-size: 17px; font-weight: 700; color: var(--navy); margin: 0 0 8px; }
.celebrate-sub { font-size: 14px; margin: 0; }

.problems-container .problem-section { border-left: 4px solid var(--teal); }
/* No ::after suffix here — badges already carry their own bilingual label
   ("Warm-up / Calentamiento 1"), so appending " / Repaso" produced
   "Warm-up / Calentamiento 1 / Repaso" on every problem. */

/* Tabbed homework layout */
.homework-tabs-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
/* Sticky TOP chrome: tab bar + progress row */
.homework-tab-chrome {
  position: sticky;
  top: 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0 12px;
  background: rgba(255,255,255,0.97);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 4px 16px rgba(18,53,91,0.06);
}
.homework-tab-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--navy);
}
.homework-tab-panels { min-height: 200px; }
.tab-panel-inner[hidden] { display: none !important; }
.tab-panel-inner:not([hidden]) { display: block; }
.homework-tab-bar {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 2px;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
}
/* On a phone the 10 tabs are ~738px wide in a ~381px viewport, so half of them
   (Help, More, Done) sat off-screen. A trailing fade was the first attempt, but a
   28px fade is a weak hint for 2x overflow and five tabs stayed undiscoverable.
   Wrap into two rows of five instead: every tab is visible, and the compact row
   height keeps the whole strip under ~104px of a phone viewport. */
.homework-tab-btn {
  flex: 0 0 auto;
  scroll-snap-align: start;
  min-width: 66px;
  min-height: 56px;
  padding: 8px 10px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-family: var(--font-display);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.homework-tab-btn:hover { border-color: var(--teal); color: var(--navy); }
.homework-tab-btn:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
.homework-tab-btn.is-active {
  background: var(--teal-ink);
  border-color: var(--teal-ink);
  color: var(--white);
  box-shadow: 0 2px 8px rgba(31,166,162,0.30);
}
.tab-icon { font-size: 20px; line-height: 1; }
.tab-label { display: flex; flex-direction: column; align-items: center; line-height: 1.15; }
.tab-es { font-size: 11.5px; color: var(--muted); font-weight: 600; }
.homework-tab-btn.is-active .tab-es { color: var(--white); }

@media (max-width: 700px) {
  .homework-tab-bar {
    flex-wrap: wrap;
    overflow-x: visible;
    -webkit-mask-image: none;
    mask-image: none;
  }
  .homework-tab-btn {
    flex: 0 0 calc(20% - 5px);
    min-width: 0;
    min-height: 48px;
    padding: 5px 2px;
    font-size: 11.5px;
  }
  .tab-icon { font-size: 17px; }
  /* The stacked EN + ES gloss is what makes each button two lines tall — three
     rows of tabs would eat 28% of a phone screen. In bilingual/English mode the
     English label carries it; ES-only mode already hides .tab-en and shows this. */
  body:not(.lang-mode-es) .tab-es { display: none; }
}

.help-pop-btn {
  margin: 8px 0;
  padding: 10px 14px;
  min-height: 44px;
  border: 1px dashed var(--teal);
  border-radius: var(--radius-sm);
  background: var(--teal-light);
  color: var(--navy);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.help-pop-btn:hover { background: #c8ebe8; }
.tab-help-row { margin-top: 12px; }
.help-topic-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.card-ish { margin-top: 16px; padding: 16px; background: var(--cream); border-radius: var(--radius-sm); border: 1px solid var(--line); }

.help-modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(18,53,91,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.help-modal-overlay[hidden] { display: none !important; }
.help-modal {
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 24px;
  max-width: 420px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow);
  position: relative;
}
.help-modal-close {
  position: absolute; top: 12px; right: 12px;
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: var(--cream); cursor: pointer; font-size: 18px;
}
.help-modal-title { margin: 0 32px 12px 0; font-family: var(--font-display); color: var(--navy); font-size: 18px; }
.help-modal-body { margin: 0 0 10px; font-size: 15px; line-height: 1.5; }
body.help-modal-open { overflow: hidden; }

/* Visual aid + sentence frame inside help popups */
.help-modal-visual {
  margin: 0 0 14px; padding: 10px; border-radius: var(--radius-sm);
  background: var(--cream); border: 1px solid var(--line); text-align: center;
}
.help-modal-visual[hidden] { display: none !important; }
.help-modal-visual svg { max-width: 100%; height: auto; }
.help-modal-frame {
  display: flex; flex-direction: column; gap: 4px;
  margin: 12px 0 0; padding: 12px 14px;
  background: var(--teal-light); border-left: 4px solid var(--teal);
  border-radius: var(--radius-sm); font-size: 14px; line-height: 1.5;
}
.help-modal-frame[hidden] { display: none !important; }
.help-frame-tag { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .02em; color: var(--teal-ink); }
.help-frame-es { color: var(--muted); }

/* Guided "Try together" fill-in spaces + step actions */
.together-fill { margin: 10px 0 6px; }
.together-fill-label { display: block; font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
.together-fill-input {
  width: 100%; min-height: 48px; padding: 10px 12px;
  border: 2px dashed var(--teal); border-radius: var(--radius-sm);
  background: #fffef8; font-size: 15px; line-height: 1.5; resize: vertical;
}
.together-fill-input:focus { outline: none; border-style: solid; border-color: var(--navy); }
.together-step-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }

/* Compact "Try Together" steps: tighter padding, inline action buttons, single-row input. */
.together-steps { gap: 8px; }
.together-step--compact { padding: 9px 11px; }
.together-step--compact .together-step-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.together-step--compact .step-badge { margin-bottom: 0; }
.together-step--compact .together-step-actions { margin-top: 0; }
.together-step--compact p { margin: 6px 0 0; font-size: 14px; }
.together-step--compact .together-fill { margin: 7px 0 0; }
.together-step--compact .together-fill-input { min-height: 40px; }

/* Graduated practice ladder under the guided steps. */
.together-ladder { margin-top: 16px; padding-top: 14px; border-top: 2px dashed var(--line); }
.ladder-title { font-family: var(--font-display); font-size: 16px; margin: 0 0 4px; color: var(--navy); }
.ladder-note { font-size: 13px; margin: 0 0 12px; }
.ladder-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; counter-reset: ladder; }
.ladder-item { border: 1px solid var(--line); border-left: 4px solid #5b8def; border-radius: var(--radius-sm); padding: 9px 11px; background: var(--white); }
.ladder-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.ladder-stars { color: #f5a623; font-size: 13px; letter-spacing: 1px; }
.ladder-tier { font-family: var(--font-display); font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; color: var(--navy); }
.ladder-q { margin: 0 0 8px; font-size: 14.5px; line-height: 1.4; }
.ladder-choices { list-style: upper-alpha; margin: 0 0 8px; padding: 0 0 0 22px; display: flex; flex-direction: column; gap: 3px; }
.ladder-choice { font-size: 14px; line-height: 1.4; }
.ladder-input { width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1.5px dashed var(--line); border-radius: var(--radius-sm); font-size: 14px; }
.ladder-input:focus { outline: none; border-style: solid; border-color: var(--navy); }
/* Answer reveals are TEACHER-ONLY: hidden fail-closed for students, shown only
   when the shared unified teacher toggle (localStorage nt-teacher-mode) has put
   the page into teacher mode (body.teacher-mode). Keep in sync with the
   teacher-mode bootstrap emitted in generate-homework-html.mjs. */
.ladder-answer { display: none; margin-top: 7px; }
body.teacher-mode .ladder-answer { display: block; }
.ladder-answer summary { cursor: pointer; font-size: 12.5px; font-weight: 700; color: var(--navy); }
.ladder-answer-text { margin: 6px 0 0; padding: 8px 10px; background: var(--hint-bg); border-radius: var(--radius-sm); font-size: 13.5px; color: var(--ink); }

/* "More practice" accordion in the Check tab */
/* Tiered practice sections (warm-up first, then a harder challenge set) */
.practice-tier { margin: 0 0 40px; }
.practice-tier + .practice-tier { margin-top: 0; padding-top: 32px; border-top: 2px solid var(--line); }
.practice-tier-head {
  display: flex; align-items: center; gap: 12px; margin: 0 0 10px;
  padding: 12px 16px; border-radius: var(--radius-md);
}
.practice-tier-warmup .practice-tier-head { background: var(--teal-light); }
.practice-tier-challenge .practice-tier-head { background: var(--amber-light, #fdf3dd); }
.practice-tier-badge {
  flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; font-size: 18px; color: #fff;
}
.practice-tier-badge.tier-warmup { background: var(--teal-ink); }
.practice-tier-badge.tier-challenge { background: var(--amber-strong, #d99a1c); }
.practice-tier-titles { min-width: 0; }
.practice-tier-title {
  margin: 0; font-family: var(--font-display); font-weight: 800;
  color: var(--navy); font-size: clamp(1.02rem, 2.4vw, 1.2rem);
}
.practice-tier-sub { margin: 2px 0 0; font-size: 13px; color: var(--muted, #5f6f80); }

/* Math Workbench tab */
.section-workbench .workbench-openrow { margin: 4px 0 12px; }
.workbench-frame-wrap {
  border: 2px solid var(--teal); border-radius: var(--radius-md); overflow: hidden;
  background: var(--white);
}
.workbench-frame, .arcade-frame { display: block; width: 100%; height: 72vh; min-height: 480px; border: 0; }

.more-practice {
  margin-top: 20px; border: 2px solid var(--teal); border-radius: var(--radius-md);
  background: var(--teal-light); overflow: hidden;
}
.more-practice > summary {
  cursor: pointer; list-style: none; padding: 14px 18px;
  font-family: var(--font-display); font-weight: 800; color: var(--navy); font-size: 16px;
}
.more-practice > summary::-webkit-details-marker { display: none; }
.more-practice[open] > summary { border-bottom: 1px solid var(--line); background: var(--white); }
.more-practice-note { padding: 12px 18px 0; font-size: 13px; }
.more-practice-container { padding: 8px 14px 14px; }

.external-resource-list { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-direction: column; gap: 10px; }
.ai-lab-cta {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; margin-bottom: 16px;
  border: none; border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--navy), var(--teal));
  color: #fff; text-decoration: none;
  box-shadow: var(--shadow-sm);
}
.ai-lab-cta:hover { filter: brightness(1.06); text-decoration: none; }
.workbench-cta { background: linear-gradient(135deg, #5b8def, var(--teal)); }
.ai-lab-emoji { font-size: 30px; line-height: 1; flex: 0 0 auto; }
.ai-lab-text { flex: 1 1 auto; font-size: 14px; line-height: 1.45; }
.ai-lab-text .lang-es { color: rgba(255,255,255,0.94); border-left-color: var(--amber); }
.ai-lab-arrow { font-size: 22px; font-weight: 800; flex: 0 0 auto; }
.external-resource-link {
  display: flex; flex-direction: column; gap: 4px;
  padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius-sm);
  background: var(--cream); text-decoration: none; color: inherit;
}
.external-resource-link:hover { border-color: var(--teal); background: var(--teal-light); text-decoration: none; }
.ext-source { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .02em; color: var(--teal-ink); }
.ext-title-en { font-weight: 700; color: var(--navy); }
.ext-title-es { font-size: 13px; color: var(--muted); }
.section-more { border-left: 4px solid #5b8def; }
.section-play { border-left: 4px solid #e67e22; }

.hw-game { padding: 8px 0; }
.hw-game-title { margin: 0 0 8px; font-family: var(--font-display); color: var(--navy); }
.hw-game-coach { font-size: 14px; margin-bottom: 12px; }
.hw-game-score { font-weight: 700; color: var(--teal); margin-bottom: 8px; }
.hw-game-question { font-size: 17px; font-weight: 700; color: var(--navy); margin: 12px 0; }
.hw-game-choices { display: flex; flex-direction: column; gap: 8px; }
.hw-game-choice-btn {
  min-height: 48px; padding: 12px 16px; border: 2px solid var(--line);
  border-radius: var(--radius-sm); background: var(--white);
  font-size: 15px; font-weight: 600; cursor: pointer; text-align: left;
}
.hw-game-choice-btn.correct { border-color: var(--success); background: var(--success-bg); }
.hw-game-choice-btn.incorrect { border-color: var(--error); background: var(--error-bg); }
.hw-game-feedback { margin-top: 12px; font-weight: 700; min-height: 1.5em; }
.hw-game-feedback.success { color: var(--success); }
.hw-game-feedback.error { color: var(--error); }
.hw-game-buckets { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
@media (max-width: 640px) { .hw-game-buckets { grid-template-columns: 1fr; } }
.hw-game-bucket { border: 2px dashed var(--line); border-radius: var(--radius-sm); padding: 10px; min-height: 80px; }
.hw-game-bucket-label { font-size: 12px; font-weight: 700; margin-bottom: 8px; color: var(--navy); }
.hw-game-pile { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; background: var(--cream); border-radius: var(--radius-sm); margin-bottom: 12px; }
.hw-game-card {
  padding: 10px 14px; background: var(--white); border: 1px solid var(--line);
  border-radius: var(--radius-sm); cursor: grab; font-size: 13px; font-weight: 600;
  min-height: 44px; display: flex; align-items: center;
}
.problem-hint-row { margin: 8px 0 12px; }

/* Language mode overrides */
body.lang-mode-en .lang-es,
body.lang-mode-en .welcome-title-es,
body.lang-mode-en .tab-es,
body.lang-mode-en .vocab-es,
body.lang-mode-en .vocab-def-es,
body.lang-mode-en .ext-title-es,
body.lang-mode-en [lang="es"],
body.lang-mode-en .bilingual-col.lang-es {
  display: none !important;
}

body.lang-mode-es .lang-en,
body.lang-mode-es .welcome-title-en,
body.lang-mode-es .tab-en,
body.lang-mode-es .vocab-def,
body.lang-mode-es .ext-title-en,
body.lang-mode-es .learning-big:not([lang="es"]),
body.lang-mode-es .learning-sub:not([lang="es"]),
body.lang-mode-es .bilingual-col.lang-en {
  display: none !important;
}

body.lang-mode-en .bilingual-grid,
body.lang-mode-es .bilingual-grid {
  grid-template-columns: 1fr !important;
}

/* Premium language selector card styles */
.lang-selector-card {
  margin-top: 18px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.lang-selector-title {
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 800;
  color: var(--white);
}
.lang-selector-buttons {
  display: flex;
  gap: 8px;
}
.lang-toggle-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: var(--white);
  /* 44px min height keeps these reachable as touch targets — families use phones. */
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.lang-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: var(--white);
}
.lang-toggle-btn.active {
  background: var(--teal-ink);
  border-color: var(--teal);
  color: var(--white);
  box-shadow: 0 4px 12px rgba(31, 166, 162, 0.35);
}
@media (max-width: 640px) {
  .lang-selector-card {
    flex-direction: column;
    align-items: stretch;
  }
  .lang-selector-buttons {
    flex-direction: column;
  }
  .lang-toggle-btn {
    width: 100%;
    text-align: center;
  }
}

/* Parent Sign-off container styling */
.parent-signoff-container {
  margin-top: 24px;
  padding: 24px;
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 30px rgba(18, 53, 91, 0.06);
  text-align: left;
}
.signoff-title {
  margin: 0 0 16px;
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--navy);
  font-weight: 800;
  border-bottom: 2px solid var(--teal-light);
  padding-bottom: 8px;
}
.signoff-field {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.signoff-field label {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--navy);
}
.checkbox-field {
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
}
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 14.5px;
  line-height: 1.4;
  color: var(--ink);
}
.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--teal);
  cursor: pointer;
}
.signoff-field input[type="text"],
.signoff-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 14px;
  background: var(--cream);
  color: var(--ink);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.signoff-field input[type="text"]:focus,
.signoff-field textarea:focus {
  outline: none;
  border-color: var(--teal);
  background: var(--white);
}
.signoff-submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  font-weight: 800;
  background: var(--teal-ink);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}
.signoff-submit-btn:disabled {
  background: var(--line);
  color: var(--muted);
  cursor: not-allowed;
}
.signoff-submit-btn:not(:disabled):hover {
  background: var(--navy);
  box-shadow: 0 4px 15px rgba(18, 53, 91, 0.15);
}

/* Certificate View */
.certificate-badge {
  display: flex;
  gap: 16px;
  align-items: center;
  background: var(--teal-light);
  border: 2px solid var(--teal);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 16px;
}
.cert-check {
  font-size: 40px;
  line-height: 1;
}
.cert-info {
  flex-grow: 1;
}
.cert-header {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--teal-ink);
  font-weight: 800;
}
.cert-detail {
  font-size: 17px;
  color: var(--navy);
  margin: 0 0 2px;
}
.cert-date {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}
.cert-note-box {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--white);
  border-left: 3px solid var(--coral);
  border-radius: var(--radius-xs);
  text-align: left;
}
.cert-note-title {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--coral);
}
.cert-note-content {
  margin: 0;
  font-size: 13.5px;
  font-style: italic;
  color: var(--ink);
}
.cert-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.print-cert-btn {
  background: var(--navy);
  color: var(--white);
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-weight: 700;
}
.print-cert-btn:hover {
  background: var(--teal-ink);
}
.edit-signoff-btn {
  color: var(--muted);
  font-size: 13px;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
}
.edit-signoff-btn:hover {
  color: var(--coral);
}

/* Print Certificate specific layout */
.print-only-certificate {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
@media print {
  .homework-tab-chrome, .homework-tab-bar, .bottom-status-bar, .help-modal-overlay, .print-all-btn, .parent-signoff-container { display: none !important; }
  .tab-panel-inner[hidden] { display: block !important; page-break-inside: avoid; }
  /* Printing un-hides every panel, but these three are screen-only: an embedded
     arcade iframe, a live game, and a link-out. On paper they were blank or
     meaningless pages in the middle of the packet. */
  [data-tab-panel="arcade"],
  [data-tab-panel="play"],
  [data-tab-panel="workbench"] { display: none !important; }
  body { padding-bottom: 0; }
  /* Browsers drop background colours when printing. Several distinctions on this
     sheet are carried by fill alone — the EN/ES columns, the highlighted worked
     step, and above all the green "say this" vs red "don't say this" coaching
     panels, which print as two identical white boxes without this. */
  .bilingual-col, .worked-step, .worked-step.highlighted,
  .stuck-say, .stuck-dont, .watch-for-list, .watch-for,
  .practice-tier-head, .key-idea-banner {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .print-only-certificate.is-signed {
    display: block !important;
    margin-top: 40px;
    padding: 24px;
    border: 4px double var(--navy) !important;
    background: #ffffff !important;
    color: #000000 !important;
    text-align: center;
    page-break-inside: avoid;
  }
  .print-cert-header h2 {
    font-family: var(--font-display);
    font-size: 15px;
    letter-spacing: 0.1em;
    color: var(--muted) !important;
    margin: 0 0 6px;
  }
  .print-cert-header h3 {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--navy) !important;
    margin: 0 0 20px;
  }
  .print-cert-body p {
    font-size: 15px;
    color: var(--ink) !important;
    margin-bottom: 30px;
  }
  .print-cert-signatures {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30px;
  }
  .print-sig-block {
    width: 40%;
    text-align: center;
  }
  .sig-line {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--navy) !important;
    border-bottom: 1.5px solid var(--ink);
    padding-bottom: 6px;
    margin-bottom: 6px;
    min-height: 28px;
  }
  .sig-label {
    font-size: 11px;
    color: var(--muted) !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .print-cert-note {
    text-align: left;
    background: #f9f9f9;
    padding: 12px 16px;
    border-left: 4px solid var(--coral);
    border-radius: 4px;
  }
  .print-cert-note .note-heading {
    font-size: 12px;
    color: var(--coral) !important;
    margin: 0 0 4px;
  }
  .print-cert-note .note-body {
    font-size: 13.5px;
    font-style: italic;
    margin: 0;
  }
}

/* Gamified Tab Bar & Flow Navigation */
.tab-step-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 99px;
  background: rgba(18, 53, 91, 0.08);
  color: var(--navy);
  margin-bottom: 2px;
}
.homework-tab-btn.is-active .tab-step-badge {
  background: rgba(255, 255, 255, 0.25);
  color: var(--white);
}
.tab-badge-star {
  font-size: 11px;
  color: var(--amber);
  min-height: 12px;
  line-height: 1;
}
.tab-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tab-progress-track {
  width: 80px;
  height: 6px;
  background: var(--line);
  border-radius: 99px;
  overflow: hidden;
}
.tab-progress-fill {
  height: 100%;
  background: var(--teal);
  border-radius: 99px;
  transition: width 0.3s ease;
}
.tab-flow-nav {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
.flow-next-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 800;
  border-radius: var(--radius-md);
  background: var(--teal-ink);
  color: var(--white);
  box-shadow: 0 3px 12px rgba(12, 111, 107, 0.22);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: none;
}
.flow-next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(12, 111, 107, 0.35);
}

/* Vocab Match & Master Challenge */
.vocab-game-shell {
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border: 2px solid #38bdf8;
  border-radius: var(--radius-md);
  padding: 16px 18px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.12);
}
.vocab-game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.vocab-game-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.vocab-game-icon {
  font-size: 24px;
  line-height: 1;
}
.vocab-game-h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  color: var(--navy);
}
.vocab-game-sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.vocab-game-counter {
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 800;
  background: var(--white);
  padding: 4px 12px;
  border-radius: 99px;
  border: 1px solid var(--line);
  color: var(--navy);
}
.vocab-match-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 640px) {
  .vocab-match-board {
    grid-template-columns: 1fr;
  }
}
.vocab-match-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vocab-match-chip {
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  font-family: var(--font-body);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(18, 53, 91, 0.04);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.vocab-match-chip:hover:not(:disabled) {
  border-color: var(--teal);
  transform: translateY(-1px);
}
.vocab-match-chip.is-selected {
  border-color: var(--amber);
  background: var(--amber-light);
  box-shadow: 0 0 0 3px rgba(242, 193, 91, 0.4);
}
.vocab-match-chip.is-matched {
  border-color: var(--success);
  background: var(--success-bg);
  color: var(--success);
  opacity: 0.85;
  cursor: default;
}
.vocab-match-chip.is-mismatch {
  border-color: var(--error);
  background: var(--error-bg);
  animation: chipShake 0.4s ease;
}
@keyframes chipShake {
  0%, 100% { transform: translateX(0); }
  25%, 75% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
}
.vocab-game-win {
  margin-top: 14px;
  background: var(--white);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  border: 1.5px solid var(--success);
}
.win-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.win-emoji { font-size: 28px; }
.win-text strong { color: var(--success); font-size: 14.5px; display: block; }
.win-text p { margin: 2px 0 0; font-size: 12.5px; color: var(--muted); }

/* Vocab Card Controls */
.vocab-card-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 6px;
}
.vocab-speak-btn, .vocab-master-toggle {
  background: rgba(18, 53, 91, 0.06);
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}
.vocab-speak-btn:hover { background: var(--teal-light); transform: scale(1.1); }
.vocab-master-toggle:hover { transform: scale(1.1); }
.vocab-master-toggle.is-mastered {
  color: #f59e0b;
  background: #fef3c7;
}
.vocab-card-back-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.vocab-card-back-actions .btn {
  font-size: 11px;
  padding: 4px 10px;
}

/* Skill Power-Up Challenge */
.section-powerup {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #cbd5e1;
  margin-top: 20px;
}
.powerup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.powerup-tag {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #7c3aed;
  background: #ede9fe;
  padding: 3px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}
.powerup-question {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15.5px;
  font-weight: 800;
  color: var(--navy);
  line-height: 1.35;
}
.powerup-badge-star {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  background: var(--amber-light);
  color: #b45309;
  border: 1px solid var(--amber);
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
}
.powerup-choices-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.powerup-choice-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13.5px;
  transition: all 0.15s ease;
}
.powerup-choice-btn:hover:not(:disabled) {
  border-color: #7c3aed;
  background: #faf5ff;
}
.powerup-letter {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg);
  color: var(--navy);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.powerup-choice-btn.is-correct {
  border-color: var(--success);
  background: var(--success-bg);
}
.powerup-choice-btn.is-correct .powerup-letter {
  background: var(--success);
  color: var(--white);
}
.powerup-choice-btn.is-wrong {
  border-color: var(--error);
  background: var(--error-bg);
  animation: chipShake 0.4s ease;
}
.powerup-feedback-box {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  line-height: 1.4;
}
.powerup-feedback-box.is-success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success);
}
.powerup-feedback-box.is-hint {
  background: var(--hint-bg);
  color: var(--hint);
  border: 1px solid var(--amber);
}

/* Interactive Scratchpad */
.interactive-scratchpad {
  background: var(--white);
  border: 2px solid var(--teal);
  border-radius: var(--radius-md);
  padding: 14px;
  margin: 16px 0;
  box-shadow: 0 4px 16px rgba(31, 166, 162, 0.15);
}
.scratchpad-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.scratchpad-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-size: 14.5px;
  color: var(--navy);
}
.scratchpad-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.color-palette {
  display: flex;
  gap: 6px;
}
.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.color-dot.is-active {
  transform: scale(1.25);
  border-color: #000;
}
.tool-btn.is-active {
  background: var(--teal);
  color: var(--white);
}
.scratchpad-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--muted);
  padding: 0 4px;
}
.scratchpad-canvas-wrap {
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #ffffff;
}
.scratchpad-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--muted);
}
.scratchpad-inline-toggle {
  margin: 14px 0;
}
.scratchpad-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Live Streak & Goal Reached Banners */
.live-streak-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1.5px solid #fb923c;
  border-radius: 99px;
  padding: 6px 14px;
  margin: 10px 0 14px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  color: #9a3412;
  animation: bannerPop 0.3s ease;
}
@keyframes bannerPop {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.goal-reached-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: linear-gradient(135deg, #fefce8 0%, #fef08a 100%);
  border: 2px solid #eab308;
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin: 12px 0 16px;
  box-shadow: 0 4px 16px rgba(234, 179, 8, 0.18);
  flex-wrap: wrap;
}
.goal-icon { font-size: 30px; }
.goal-text strong { color: #854d0e; font-size: 15.5px; display: block; }
.goal-text p { margin: 2px 0 0; font-size: 12.5px; color: #713f12; }

/* Celebration & Achievements */
.high-five-banner {
  text-align: center;
  margin: 18px 0;
}
.btn-high-five {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: var(--white);
  border: none;
  border-radius: 99px;
  padding: 10px 24px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-high-five:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 20px rgba(217, 119, 6, 0.45);
}
.high-five-emoji { font-size: 24px; }
.high-five-labels { display: flex; flex-direction: column; text-align: left; }
.high-five-labels strong { font-size: 15px; line-height: 1.1; }
.high-five-labels small { font-size: 11px; opacity: 0.9; font-weight: 500; }
.achievement-shelf {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 18px 0;
}
@media (max-width: 600px) {
  .achievement-shelf { grid-template-columns: repeat(2, 1fr); }
}
.achievement-badge {
  background: var(--bg);
  border: 1.5px dashed var(--line);
  border-radius: var(--radius-sm);
  padding: 10px 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0.55;
  transition: all 0.3s ease;
}
.achievement-badge.is-unlocked {
  opacity: 1;
  border-style: solid;
  border-color: var(--amber);
  background: #fffbeb;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}
.achieve-icon { font-size: 22px; line-height: 1; }
.achieve-name { font-family: var(--font-display); font-size: 11px; font-weight: 800; color: var(--navy); }


/* ==========================================================================
   CLEAN, CALM, PARENT-FRIENDLY AESTHETIC SYSTEM
   ========================================================================== */

/* Tranquil, modern color scheme & typography */
:root {
  --navy: #0f172a;
  --navy-light: #1e293b;
  --teal: #0f766e;
  --teal-ink: #0d5c75;
  --teal-light: #f0fdfa;
  --amber: #f59e0b;
  --amber-light: #fffbeb;
  --cream: #fbfbfa;
  --bg: #f8fafc;
  --card: #ffffff;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --radius-sm: 10px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --shadow: 0 8px 30px -4px rgba(15, 23, 42, 0.04), 0 4px 10px -2px rgba(15, 23, 42, 0.02);
  --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.03);
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: -0.01em;
}

.container {
  max-width: 820px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* Elegant, welcoming header */
header.homework-header,
.family-welcome {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
  border: none !important;
  border-radius: var(--radius-lg) !important;
  padding: 32px !important;
  box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.12) !important;
  margin-bottom: 24px !important;
}
.welcome-tag {
  color: #94a3b8 !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em !important;
}
.welcome-title-en {
  font-size: clamp(24px, 4.5vw, 32px) !important;
  font-weight: 800 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.2 !important;
}
.welcome-title-es {
  color: #cbd5e1 !important;
  font-weight: 600 !important;
  font-size: clamp(18px, 3.5vw, 22px) !important;
}
.welcome-lesson {
  color: #38bdf8 !important;
  font-weight: 600 !important;
  font-size: 14.5px !important;
  margin-top: 6px !important;
}

/* Apple-Grade Floating Pill Tab Bar */
.homework-tab-chrome {
  position: sticky;
  top: 12px;
  z-index: 100;
  margin-bottom: 24px;
}
.homework-tab-bar {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: rgba(255, 255, 255, 0.94) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  border-radius: 99px !important;
  padding: 6px 8px !important;
  box-shadow: 0 6px 24px -2px rgba(15, 23, 42, 0.06) !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
  scroll-snap-type: x mandatory !important;
}
.homework-tab-bar::-webkit-scrollbar { display: none; }

.homework-tab-btn {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 7px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 99px !important;
  padding: 8px 16px !important;
  min-height: auto !important;
  min-width: auto !important;
  font-family: var(--font-display) !important;
  font-size: 13.5px !important;
  font-weight: 700 !important;
  color: #64748b !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  scroll-snap-align: start !important;
}
.homework-tab-btn:hover {
  color: #0f172a !important;
  background: rgba(241, 245, 249, 0.9) !important;
}
.homework-tab-btn.is-active {
  background: #0f172a !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18) !important;
}
.homework-tab-btn.is-active .tab-icon {
  transform: scale(1.1);
}
.tab-icon {
  font-size: 15px !important;
  line-height: 1 !important;
  transition: transform 0.2s ease;
}
.tab-label {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
}
.tab-es {
  display: none !important;
}
body.lang-mode-es .tab-en {
  display: none !important;
}
body.lang-mode-es .tab-es {
  display: inline !important;
  color: inherit !important;
  font-size: inherit !important;
}

/* Cards & Content Shells */
.guided-section.card,
.card-ish {
  background: #ffffff !important;
  border: 1px solid #e8edf2 !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow) !important;
  padding: 28px 32px !important;
  margin-bottom: 24px !important;
}
@media (max-width: 600px) {
  .guided-section.card, .card-ish { padding: 20px !important; }
}

.section-title {
  font-size: 20px !important;
  font-weight: 800 !important;
  color: #0f172a !important;
  margin-top: 0 !important;
  letter-spacing: -0.01em !important;
}

/* Big Idea & Listen Pill */
.btn-listen-concept {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 99px !important;
  padding: 5px 14px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
  transition: all 0.15s ease !important;
}
.btn-listen-concept:hover {
  background: #0f172a !important;
  color: #ffffff !important;
  border-color: #0f172a !important;
}

/* Parent Coaching Accordion Drawer */
.parent-coaching-drawer {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: var(--radius-md) !important;
  margin: 20px 0 !important;
  overflow: hidden !important;
  transition: all 0.2s ease !important;
}
.parent-coaching-drawer[open] {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
  box-shadow: 0 6px 24px -2px rgba(15, 23, 42, 0.05) !important;
}
.parent-coaching-summary {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 16px 20px !important;
  cursor: pointer !important;
  list-style: none !important;
  user-select: none !important;
}
.parent-coaching-summary::-webkit-details-marker { display: none !important; }
.summary-left {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}
.summary-icon { font-size: 22px !important; }
.summary-text {
  display: flex !important;
  flex-direction: column !important;
  text-align: left !important;
}
.summary-text strong {
  font-size: 14.5px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
}
.summary-text small {
  font-size: 12.5px !important;
  color: #64748b !important;
  margin-top: 2px !important;
}
.summary-chevron {
  font-size: 16px !important;
  color: #94a3b8 !important;
  transition: transform 0.25s ease !important;
}
.parent-coaching-drawer[open] .summary-chevron {
  transform: rotate(180deg) !important;
}
.parent-coaching-content {
  padding: 0 20px 20px !important;
  border-top: 1px solid #f1f5f9 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 14px !important;
}

/* Calmer Real-World & Misconception Styling */
.real-world-spotlight {
  background: #f0fdf4 !important;
  border: 1px solid #dcfce7 !important;
  border-radius: 12px !important;
  padding: 14px 18px !important;
  box-shadow: none !important;
  margin: 12px 0 0 !important;
}
.spotlight-badge {
  color: #15803d !important;
  background: #dcfce7 !important;
  font-size: 11px !important;
  font-weight: 800 !important;
}
.spotlight-title {
  color: #0f172a !important;
  font-size: 15.5px !important;
  font-weight: 700 !important;
}
.spotlight-text {
  color: #334155 !important;
  font-size: 13.5px !important;
}
.misconception-card {
  background: #fffbeb !important;
  border: 1px solid #fef3c7 !important;
  border-left: 4px solid #f59e0b !important;
  border-radius: 12px !important;
  padding: 14px 18px !important;
  margin: 0 !important;
}
.mis-trap { color: #92400e !important; }
.parent-coach-tip {
  border-top: 1px dashed #fde68a !important;
  color: #78350f !important;
}

/* Math Talk Generator Calm Styling */
.math-talk-hub {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: var(--radius-md) !important;
  padding: 20px 24px !important;
  margin: 20px 0 !important;
  box-shadow: var(--shadow-sm) !important;
}
.math-talk-badge {
  color: #0f766e !important;
  font-weight: 800 !important;
  font-size: 11px !important;
}
.math-talk-q {
  font-size: 17px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
}
.math-talk-follow {
  color: #64748b !important;
}

/* Flow Next Button */
.flow-next-btn {
  background: #0f172a !important;
  border-color: #0f172a !important;
  color: #ffffff !important;
  border-radius: 99px !important;
  padding: 10px 24px !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15) !important;
  transition: all 0.15s ease !important;
}
.flow-next-btn:hover {
  background: #1e293b !important;
  transform: translateY(-1px);
}

/* Clean Practice Problem Cards */
.problem-card {
  background: #ffffff !important;
  border: 1px solid #e8edf2 !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow) !important;
  padding: 24px 28px !important;
  margin-bottom: 24px !important;
}
.problem-check-btn {
  background: #0f172a !important;
  border: none !important;
  color: #ffffff !important;
  border-radius: 99px !important;
  padding: 8px 20px !important;
  font-weight: 700 !important;
  font-size: 13.5px !important;
}
.problem-check-btn:hover {
  background: #1e293b !important;
}

/* Bottom status bar clean & hidden on non-practice tabs */
.bottom-status-bar {
  background: rgba(255, 255, 255, 0.94) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-top: 1px solid rgba(226, 232, 240, 0.9) !important;
  box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.05) !important;
}

/* ==========================================================================
   VOCABULARY UNDERLINE & POPUP DEFINITION SYSTEM — CLEAN & TACTILE
   ========================================================================== */
.obj-term {
  display: inline !important;
  margin: 0 !important;
  padding: 1px 5px !important;
  border: none !important;
  background: rgba(15, 118, 110, 0.08) !important;
  color: #0f766e !important;
  font-weight: 600 !important;
  border-bottom: 2px dotted #0f766e !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  touch-action: manipulation !important;
  text-decoration: none !important;
  transition: all 0.15s ease !important;
  vertical-align: baseline !important;
}
.obj-term:hover, .obj-term:focus-visible {
  background: #0f766e !important;
  color: #ffffff !important;
  border-bottom-style: solid !important;
  outline: none !important;
  box-shadow: 0 2px 8px rgba(15, 118, 110, 0.25) !important;
}
.obj-term:active {
  transform: scale(0.97) !important;
}

.obj-popup-backdrop {
  position: fixed !important;
  inset: 0 !important;
  z-index: 1200 !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px !important;
  background: rgba(15, 23, 42, 0.65) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  animation: objFadeIn 0.2s ease !important;
}
.obj-popup-backdrop:not([hidden]) {
  display: flex !important;
}
.obj-popup-backdrop[hidden] {
  display: none !important;
}
.obj-popup {
  position: relative !important;
  width: min(460px, 100%) !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
  background: #ffffff !important;
  border-radius: 20px !important;
  box-shadow: 0 25px 60px -10px rgba(15, 23, 42, 0.3) !important;
  padding: 32px 24px 24px !important;
  text-align: center !important;
  animation: objFadeIn 0.2s ease !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
}
.obj-popup-close {
  position: absolute !important;
  top: 12px !important;
  right: 12px !important;
  width: 36px !important;
  height: 36px !important;
  border: none !important;
  border-radius: 50% !important;
  background: #f1f5f9 !important;
  color: #475569 !important;
  font-size: 18px !important;
  line-height: 1 !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.15s ease !important;
}
.obj-popup-close:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
  transform: scale(1.05) !important;
}
.obj-popup-term {
  margin: 0 0 10px !important;
  font-size: 22px !important;
  font-weight: 800 !important;
  color: #0f172a !important;
  text-transform: capitalize !important;
  letter-spacing: -0.01em !important;
}
.obj-popup-translation {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin: 0 auto 16px !important;
  padding: 6px 14px !important;
  background: #f0fdf4 !important;
  border: 1px solid #bbf7d0 !important;
  border-radius: 99px !important;
}
.obj-popup-tr-label {
  font-size: 11px !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  color: #166534 !important;
}
.obj-popup-tr-es {
  font-size: 13.5px !important;
  font-weight: 700 !important;
  color: #14532d !important;
}
.obj-popup-def {
  margin: 0 0 10px !important;
  font-size: 15px !important;
  line-height: 1.6 !important;
  color: #334155 !important;
  text-align: left !important;
}
.obj-popup-def-es {
  margin: 0 0 16px !important;
  font-size: 13.5px !important;
  line-height: 1.5 !important;
  color: #64748b !important;
  font-style: italic !important;
  text-align: left !important;
  padding-top: 8px !important;
  border-top: 1px dashed #e2e8f0 !important;
}
.obj-popup-visual {
  margin: 16px 0 0 !important;
  padding: 14px !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
}
.obj-popup-img {
  display: block !important;
  max-width: 220px !important;
  max-height: 160px !important;
  width: auto !important;
  height: auto !important;
  margin: 0 auto 10px !important;
  border-radius: 8px !important;
}
.obj-popup-example {
  margin: 0 !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #475569 !important;
  line-height: 1.4 !important;
}

/* ============================================================
   FAMILY MISSION SHELL — hero, progress rail, tab grouping.
   One warm identity for the whole page. Replaced three stacked navs
   (dark hero → "Tonight's Path" card → 10 equal tabs, ~700px before any
   mathematics) with hero → tabs+rail. New class names only (hw-hero*,
   hw-rail*, hw-quickplan*, fam-*): the generator's polish layer re-declares
   shared selectors and loads later, so these never collide with it.
   ============================================================ */
.hw-hero {
  position: relative;
  overflow: hidden;
  margin: 0 0 20px;
  padding: 30px 32px 26px;
  border-radius: 26px;
  background:
    radial-gradient(120% 140% at 88% -10%, rgba(31,166,162,.30) 0%, rgba(18,53,91,0) 58%),
    linear-gradient(155deg, #143a63 0%, #10294a 62%, #0d2039 100%);
  color: #f4f8fc;
  box-shadow: 0 24px 60px -34px rgba(9,25,46,.9);
  isolation: isolate;
}
/* Soft warm glow, second light source. Purely decorative. */
.hw-hero-glow {
  position: absolute;
  inset: auto -12% -55% 46%;
  height: 300px;
  background: radial-gradient(closest-side, rgba(242,193,91,.30), transparent 70%);
  filter: blur(6px);
  pointer-events: none;
  z-index: -1;
}
.hw-hero-body { position: relative; }
.hw-hero-kicker {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 16px;
  padding: 6px 14px 6px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.16);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: #d7e8f6;
}
.hw-hero-kicker-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255,255,255,.14);
  font-size: 13px;
}
.hw-hero-kicker .lang-es { color: #bcd6ea; }
.hw-hero-kicker .lang-en + .lang-es { border-left: 0; padding-left: 0; margin-top: 0; }
.hw-hero-head { display: flex; align-items: center; gap: 18px; }
.hw-hero-emoji {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  border-radius: 20px;
  font-size: 34px;
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.18);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22);
}
.hw-hero-titles { min-width: 0; }
.hw-hero .welcome-title-en {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(30px, 4.4vw, 44px);
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.02;
  color: #fff;
}
.hw-hero .welcome-title-es {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: clamp(17px, 2.2vw, 22px);
  font-weight: 600;
  letter-spacing: -.01em;
  color: #f2c15b;
}
.hw-hero-lesson {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin: 18px 0 0;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,.14);
}
.hw-hero-lesson-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.hw-hero-lesson-meta { font-size: 13px; font-weight: 600; color: #9fc0da; letter-spacing: .02em; }
.hw-hero-lead { margin: 12px 0 0; font-size: 15px; line-height: 1.6; color: #dce9f4; max-width: 62ch; }
.hw-hero-lead .lang-es { color: #dce9f4; }
.hw-hero-lead .lang-en + .lang-es {
  border-left: 2px solid rgba(242,193,91,.55);
  padding-left: 10px;
  margin-top: 6px;
}
.hw-hero-stats {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0 0;
  padding: 0;
}
.hw-stat {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,.09);
  border: 1px solid rgba(255,255,255,.14);
  font-size: 13px;
  font-weight: 700;
  color: #e7f1fa;
}
.hw-stat .lang-es { color: #e7f1fa; }
.hw-stat .lang-en + .lang-es { border-left: 0; padding-left: 0; margin-top: 0; }
.hw-hero-controls { margin-top: 20px; }
.hw-hero .lang-selector-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  padding: 0;
  background: none;
  border: 0;
}
.hw-hero .lang-selector-title {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #9fc0da;
}
.hw-hero .lang-selector-buttons {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(0,0,0,.26);
  border: 1px solid rgba(255,255,255,.12);
}
.hw-hero .lang-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #cfe1f1;
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background .18s ease, color .18s ease;
}
.hw-hero .lang-toggle-btn:hover { background: rgba(255,255,255,.10); color: #fff; }
.hw-hero .lang-toggle-btn.active {
  background: #f2c15b;
  color: #123055;
  box-shadow: 0 6px 16px -8px rgba(242,193,91,.9);
}
.hw-hero .lang-toggle-btn:focus-visible { outline: 3px solid #f2c15b; outline-offset: 2px; }

/* 10-minute plan, inside the hero */
.hw-hero .hw-quickplan {
  margin-top: 18px;
  border: 1px dashed rgba(242,193,91,.5);
  border-radius: 16px;
  background: rgba(242,193,91,.09);
}
.hw-quickplan-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  min-height: 44px;
  cursor: pointer;
  list-style: none;
  font-size: 14.5px;
  color: #f6e6c4;
}
.hw-quickplan-summary::-webkit-details-marker { display: none; }
.hw-quickplan-summary .lang-en + .lang-es { border-left: 0; padding-left: 0; margin-top: 0; }
.hw-quickplan-chevron { margin-left: auto; transition: transform .2s ease; color: #f2c15b; }
.hw-quickplan[open] .hw-quickplan-chevron { transform: rotate(180deg); }
.hw-quickplan-steps { margin: 0; padding: 0 18px 4px 36px; font-size: 14px; color: #e4eef7; }
.hw-quickplan-steps li { margin-bottom: 8px; }
.hw-quickplan-steps .lang-es, .hw-quickplan-note .lang-es { color: #e4eef7; }
.hw-quickplan-note { margin: 0; padding: 8px 18px 15px; font-size: 13.5px; color: #cfe1f1; }

@media (max-width: 700px) {
  .hw-hero { padding: 24px 20px 22px; border-radius: 20px; }
  .hw-hero-emoji { width: 52px; height: 52px; font-size: 27px; border-radius: 16px; }
  .hw-hero-head { gap: 13px; }
  .hw-hero .lang-selector-buttons { width: 100%; }
  .hw-hero .lang-toggle-btn { flex: 1; justify-content: center; padding: 8px 10px; }
}

/* ── Progress rail — five stops on one line under the tab bar ────────────── */
.hw-rail {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--line);
  background: #fff;
}
.hw-rail-title,
.hw-rail-bonus {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: var(--muted);
}
.hw-rail-title { color: var(--teal-ink); }
.hw-rail-title .lang-en + .lang-es,
.hw-rail-bonus .lang-en + .lang-es,
.hw-rail-label .lang-en + .lang-es { border-left: 0; padding-left: 0; margin-top: 0; }
.hw-rail-track {
  position: relative;
  flex: 1 1 auto;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 0;
  padding: 0;
  min-width: 0;
}
.hw-rail-line {
  position: absolute;
  left: 6%;
  right: 6%;
  top: 13px;
  height: 3px;
  border-radius: 2px;
  background: var(--line);
  overflow: hidden;
}
.hw-rail-line-fill {
  display: block;
  height: 100%;
  width: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--teal), var(--amber));
  transition: width .45s cubic-bezier(.4, 0, .2, 1);
}
.hw-rail-item { position: relative; z-index: 1; }
.hw-rail-stop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 0 6px;
  min-height: 44px;
  background: none;
  border: 0;
  cursor: pointer;
  font-family: var(--font-body);
}
.hw-rail-dot {
  position: relative;
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--line);
  font-size: 14px;
  transition: transform .18s ease, border-color .18s ease, background .18s ease;
}
.hw-rail-stop:hover .hw-rail-dot { transform: translateY(-2px) scale(1.06); border-color: var(--teal); }
.hw-rail-stop:focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; border-radius: 10px; }
.hw-rail-check {
  position: absolute;
  right: -3px;
  bottom: -3px;
  display: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--success);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  line-height: 15px;
  text-align: center;
}
.hw-rail-stop.is-done .hw-rail-dot { border-color: var(--success); background: var(--success-bg); }
.hw-rail-stop.is-done .hw-rail-check { display: block; }
.hw-rail-stop.is-current .hw-rail-dot {
  border-color: var(--teal);
  background: var(--teal-light);
  box-shadow: 0 0 0 4px rgba(31,166,162,.16);
}
.hw-rail-label { font-size: 11.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.hw-rail-stop.is-current .hw-rail-label { color: var(--teal-ink); }
.hw-rail-stop.is-done .hw-rail-label { color: var(--ink); }

@media (max-width: 900px) {
  .hw-rail-title, .hw-rail-bonus { display: none; }
  .hw-rail { padding: 8px 10px 10px; gap: 0; }
}
@media (max-width: 460px) {
  .hw-rail-label { display: none; }
  .hw-rail-line { top: 14px; }
}

/* ============================================================
   Family Activity Corner — hands-on activity cards on the Together tab.
   ============================================================ */
.fam-act-corner {
  margin-top: 22px;
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 2px rgba(18,53,91,.05), 0 14px 34px -22px rgba(18,53,91,.5);
}
.fam-act-head { margin-bottom: 14px; }
.fam-act-badge {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  color: var(--coral-ink);
  background: var(--coral-light);
  border-radius: 999px;
  padding: 5px 12px;
}
.fam-act-lead { margin: 10px 0 0; font-size: 14px; color: var(--ink); }
.fam-act-card {
  border: 1.5px solid var(--line);
  border-radius: var(--radius-md);
  background: #fbfdff;
  margin-bottom: 10px;
  overflow: hidden;
}
.fam-act-card[open] { border-color: var(--teal); }
.fam-act-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  min-height: 44px;
  cursor: pointer;
  list-style: none;
}
.fam-act-summary::-webkit-details-marker { display: none; }
.fam-act-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--teal-light);
  font-size: 19px;
}
.fam-act-titles { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.fam-act-titles strong { font-size: 15px; color: var(--ink); }
.fam-act-titles strong .lang-es { font-weight: 600; }
/* Compact header rows: suppress the global stacked-Spanish rule inside */
.fam-act-summary .lang-en + .lang-es { border-left: 0; padding-left: 0; margin-top: 1px; }
.fam-act-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}
.fam-act-chevron { margin-left: auto; color: var(--muted); transition: transform .2s ease; }
.fam-act-card[open] .fam-act-chevron { transform: rotate(180deg); }
.fam-act-body { padding: 2px 16px 14px; }
.fam-act-steps {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
}
.fam-act-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px dashed var(--line);
}
.fam-act-step:last-child { border-bottom: 0; }
.fam-act-step p { margin: 0; font-size: 14px; }
.fam-act-step-num {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--navy);
  color: #fff;
  font-size: 12.5px;
  font-weight: 800;
  margin-top: 2px;
}
.fam-act-talk {
  background: var(--teal-light);
  border-left: 4px solid var(--teal);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--ink);
}
.fam-act-talk strong { display: block; margin-bottom: 4px; color: var(--teal-ink); }

/* ============================================================
   Family Game Break — Memory Flip + True/False Face-Off.
   ============================================================ */
.fam-game-break {
  margin-top: 22px;
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 2px rgba(18,53,91,.05), 0 14px 34px -22px rgba(18,53,91,.5);
}
.fam-game-head { margin-bottom: 14px; }
.fam-game-badge {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  color: #6b21a8;
  background: #f3e8ff;
  border-radius: 999px;
  padding: 5px 12px;
}
.fam-game-lead { margin: 10px 0 0; font-size: 14px; color: var(--ink); }
.fam-game-card {
  border: 1.5px solid var(--line);
  border-radius: var(--radius-md);
  background: #fbfdff;
  padding: 14px 16px;
  margin-bottom: 14px;
}
.fam-game-card:last-child { margin-bottom: 0; }
.fam-game-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.fam-game-h3 { margin: 0; font-size: 16.5px; color: var(--navy); }
.fam-game-h3 .lang-es { font-weight: 600; }
.fam-game-card .lang-en + .lang-es { border-left: 0; padding-left: 0; }
.fam-game-sub { margin: 8px 0 12px; font-size: 13.5px; color: var(--muted); }

/* Memory Flip */
.fam-memory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.fam-mem-card {
  position: relative;
  min-height: 76px;
  border: 2px solid var(--navy-light);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  cursor: pointer;
  padding: 6px;
  transition: transform .15s ease, background .2s ease, border-color .2s ease;
}
.fam-mem-card::before {
  content: "?";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255,255,255,.85);
  font-size: 26px;
  font-weight: 800;
  font-family: var(--font-display);
}
.fam-mem-card:hover { transform: translateY(-2px); }
.fam-mem-card:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
.fam-mem-face {
  display: none;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.25;
  overflow-wrap: break-word;
}
.fam-mem-card.is-up, .fam-mem-card.is-matched {
  background: #fff;
  border-color: var(--teal);
}
.fam-mem-card.is-up::before, .fam-mem-card.is-matched::before { content: none; }
.fam-mem-card.is-up .fam-mem-face, .fam-mem-card.is-matched .fam-mem-face {
  display: grid;
  place-items: center;
  height: 100%;
  text-align: center;
}
.fam-mem-card.is-matched {
  background: var(--success-bg);
  border-color: var(--success);
  cursor: default;
}
.fam-memory-status { margin: 10px 0 0; font-size: 13.5px; color: var(--muted); }
.fam-memory-win {
  margin: 10px 0 0;
  padding: 10px 12px;
  background: var(--success-bg);
  border-left: 4px solid var(--success);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

/* True/False Face-Off */
.fam-tf-turn { font-size: 13px; font-weight: 800; color: var(--teal-ink); margin-bottom: 6px; }
.fam-tf-statement {
  margin: 0 0 12px;
  padding: 12px 14px;
  background: #fff;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  font-size: 15.5px;
  font-weight: 600;
  color: var(--ink);
}
.fam-tf-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
.fam-tf-btn {
  flex: 1 1 140px;
  min-height: 48px;
  font-size: 15px;
  font-weight: 800;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
}
.fam-tf-true { background: var(--success-bg); border-color: var(--success); color: var(--success); }
.fam-tf-true:hover:not(:disabled) { background: var(--success); color: #fff; }
.fam-tf-false { background: var(--error-bg); border-color: var(--error); color: var(--error); }
.fam-tf-false:hover:not(:disabled) { background: var(--error); color: #fff; }
.fam-tf-btn:disabled { opacity: .55; cursor: default; }
.fam-tf-btn:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
.fam-tf-feedback {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--amber-light);
  border: 1px solid #f0d9a0;
  border-radius: 12px;
}
.fam-tf-verdict { margin: 0 0 6px; font-weight: 800; font-size: 14.5px; }
.fam-tf-verdict.is-right { color: var(--success); }
.fam-tf-verdict.is-wrong { color: var(--error); }
.fam-tf-why { margin: 0 0 10px; font-size: 14px; color: var(--ink); }
.fam-tf-score { margin: 10px 0 0; font-size: 13px; font-weight: 700; color: var(--muted); }
.fam-tf-done {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--teal-light);
  border-left: 4px solid var(--teal);
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink);
}

@media (max-width: 560px) {
  .fam-memory-grid { grid-template-columns: repeat(2, 1fr); }
  .fam-mem-card { min-height: 64px; }
}

@media print {
  .hw-quickplan { display: none; }
  .fam-act-card { break-inside: avoid; }
  /* The interactive games are screen-only; paper families have the Activity
     Corner and the printable practice instead. */
  .fam-game-break { display: none; }
}
`;
