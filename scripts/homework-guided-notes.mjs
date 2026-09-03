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
    <header class="family-welcome card" aria-label="Family Math Night welcome">
      <div class="unit-world-badge">
        <span class="unit-world-icon" aria-hidden="true">${theme.emoji}</span>
        <span class="lang-en">Unit ${unit} World: ${esc(theme.nameEn)}</span>
        <span class="lang-es" lang="es">Unidad ${unit}: ${esc(theme.nameEs)}</span>
      </div>
      <div class="welcome-hero">
        <span class="welcome-emoji" aria-hidden="true">${esc(themeEmoji)}</span>
        <div class="welcome-titles">
          <p class="welcome-tag">Unit ${unit} · ${esc(standard)}</p>
          <h1 class="welcome-title-en">Family Math Night</h1>
          <h1 class="welcome-title-es" lang="es">Ayuda a tu estudiante</h1>
          <p class="welcome-lesson">${esc(title)} · ${esc(homeworkPageLabel(lessonId))}</p>
        </div>
      </div>
      <p class="welcome-lead bilingual-block">
        <span class="lang-en"><strong>English:</strong> Use the pictures and short steps. Ask questions; let your student do the thinking.</span>
        <span class="lang-es" lang="es"><strong>Español:</strong> Usen los dibujos y los pasos cortos. Hagan preguntas; dejen que su estudiante piense.</span>
      </p>
      
      <!-- Modern language mode selector -->
      <div class="lang-selector-card">
        <span class="lang-selector-title">Language / Idioma:</span>
        <div class="lang-selector-buttons" role="group" aria-label="Language Mode Selector">
          <button type="button" class="lang-toggle-btn active" data-lang-mode="bilingual" onclick="setLanguageMode('bilingual')">
            🇺🇸🇪🇸 Bilingual / Bilingüe
          </button>
          <button type="button" class="lang-toggle-btn" data-lang-mode="en" onclick="setLanguageMode('en')">
            🇺🇸 English Only
          </button>
          <button type="button" class="lang-toggle-btn" data-lang-mode="es" onclick="setLanguageMode('es')">
            🇪🇸 Solo Español
          </button>
        </div>
      </div>
    </header>`;
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
  concept = concept.replace(
    /(<h2[^>]*class="section-title"[^>]*>[\s\S]*?<\/h2>)/i,
    `$1${listenBtn}`,
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

  return `
    <div ${tabPanelAttrs("learn")}>
      ${learning}
      ${concept}
      ${spotlightHtml}
      ${visualLabHtml}
      ${misconceptionHtml}
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

export function renderHomeworkTabs(panelsHtml) {
  const tabCount = HOMEWORK_TABS.length;
  const scratchpad = renderScratchpadHtml();
  return `
    <div class="homework-tabs-shell" data-tab-count="${tabCount}">
      <div class="homework-tab-chrome">
        <nav class="homework-tab-bar" role="tablist" aria-label="Family homework sections">
          ${HOMEWORK_TABS.map(
            (t, i) => `
            <button type="button" role="tab" id="hw_tab_${t.id}" class="homework-tab-btn${i === 0 ? " is-active" : ""}"
              aria-selected="${i === 0 ? "true" : "false"}" aria-controls="hw_panel_${t.id}"
              data-tab="${t.id}" onclick="switchHomeworkTab('${t.id}')">
              <span class="tab-step-badge">${i + 1}</span>
              <span class="tab-icon" aria-hidden="true">${t.icon}</span>
              <span class="tab-label"><span class="tab-en">${t.en}</span><span class="tab-es" lang="es">${t.es}</span></span>
              <span class="tab-badge-star" id="tab_badge_${t.id}" aria-hidden="true"></span>
            </button>`,
          ).join("")}
        </nav>
        <div class="homework-tab-progress" aria-live="polite">
          <div class="tab-progress-wrap">
            <span id="hw_tab_progress">1 of ${tabCount}</span>
            <div class="tab-progress-track">
              <div class="tab-progress-fill" id="tab_progress_fill" style="width: 10%;"></div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-secondary print-all-btn" onclick="window.print()">🖨️ Print all / Imprimir todo</button>
        </div>
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

document.addEventListener('DOMContentLoaded', function() {
  syncHomeworkChromeHeights();
  window.addEventListener('resize', syncHomeworkChromeHeights);
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
});

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
  function getPopup() {
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.className = 'obj-popup-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML =
      '<div class="obj-popup" role="dialog" aria-modal="true" aria-labelledby="hw-obj-term">' +
      '<button type="button" class="obj-popup-close" aria-label="Close">&times;</button>' +
      '<h3 id="hw-obj-term" class="obj-popup-term"></h3>' +
      '<p class="obj-popup-translation"><span class="obj-popup-tr-label">Español:</span> <span class="obj-popup-tr-es" lang="es"></span></p>' +
      '<p class="obj-popup-def"></p>' +
      '<p class="obj-popup-def-es" lang="es"></p>' +
      '<figure class="obj-popup-visual"><img class="obj-popup-img" alt="" /><figcaption class="obj-popup-example"></figcaption></figure>' +
      '</div>';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', function(e) { if (e.target === backdrop) closePopup(); });
    backdrop.querySelector('.obj-popup-close').addEventListener('click', closePopup);
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
    bd.hidden = false;
    document.body.classList.add('obj-popup-open');
    bd.querySelector('.obj-popup-close').focus();
    keyHandler = function(e) { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', keyHandler);
  }
  function closePopup() {
    if (!backdrop) return;
    backdrop.hidden = true;
    document.body.classList.remove('obj-popup-open');
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
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

`;
