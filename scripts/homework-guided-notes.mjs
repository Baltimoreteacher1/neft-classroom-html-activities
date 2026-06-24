/**
 * Guided family notes content + HTML sections for interactive homework.
 * Derives bilingual EN/ES content from lesson config.json fields.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  plainObjective,
  translateFamilyText,
  translateLanguageObjective,
  translateConceptLine,
  spanishKernel,
  spanishKeyIdea,
  polishSpanish,
} from "./homework-spanish.mjs";
import { detectVisualTopic, selectAlignedQuickCheckProblems } from "./homework-alignment.mjs";
import { getExternalResources } from "./homework-external-resources.mjs";
import { renderPlayTab } from "./homework-games.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function languageTonightEs(config) {
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
    steps: steps.slice(0, 4),
  };
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
        <text x="78" y="55" font-size="22" font-weight="800" fill="#d9795d">3</text>
        <text x="120" y="70" font-size="28" fill="#12355b">= 2 × 2 × 2 = 8</text>
        <text x="40" y="110" font-size="13" fill="#21313f">Base = 2 · Exponent = 3 · Multiply 2 three times</text>
        <text x="40" y="135" font-size="13" fill="#21313f" lang="es">Base = 2 · Exponente = 3 · Multiplica 2 tres veces</text>
        <text x="40" y="165" font-size="12" fill="#5f6f80">${themeEmoji} NOT 2 + 2 + 2 — that's addition!</text>
      </svg>`;
  }

  if (topic === "equations") {
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Equation example">
        <rect x="8" y="20" width="404" height="160" rx="12" fill="#dff2ee" stroke="#1fa6a2" stroke-width="2"/>
        <text x="210" y="52" text-anchor="middle" font-size="14" font-weight="700" fill="#12355b">Equation / Ecuación</text>
        <text x="50" y="95" font-size="28" font-weight="800" fill="#12355b">n + 8 = 20</text>
        <text x="50" y="125" font-size="13" fill="#21313f">n = unknown · + means add · = means both sides equal</text>
        <text x="50" y="148" font-size="13" fill="#21313f" lang="es">n = incógnita · + suma · = ambos lados iguales</text>
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
        <text x="130" y="158" font-size="11" fill="#12355b">base</text>
        <text x="248" y="108" font-size="11" fill="#12355b">height</text>
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
    return `
      <svg viewBox="0 0 420 200" class="concept-svg" role="img" aria-label="Decimal operations">
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
  return `<button type="button" class="help-pop-btn" data-help='${data}' onclick="openHelpModalFromBtn(this)" aria-label="${esc(label)}">${label}</button>`;
}

export function selectQuickCheckProblems(practice = {}, config = {}) {
  return selectAlignedQuickCheckProblems(practice, config);
}

export function renderWelcomeBanner(config, lessonId) {
  const themeEmoji = config.themeEmoji || "🏠";
  const title = config.title || "Tonight's Lesson";
  const unit = config.unit || 1;
  const standard = config.standard || "";

  return `
    <header class="family-welcome card" aria-label="Family Math Night welcome">
      <div class="welcome-hero">
        <span class="welcome-emoji" aria-hidden="true">${esc(themeEmoji)}</span>
        <div class="welcome-titles">
          <p class="welcome-tag">Unit ${unit} · ${esc(standard)}</p>
          <h1 class="welcome-title-en">Family Math Night</h1>
          <h1 class="welcome-title-es" lang="es">Ayuda a tu estudiante</h1>
          <p class="welcome-lesson">${esc(title)} · Lesson ${esc(lessonId)}</p>
        </div>
      </div>
      <p class="welcome-lead bilingual-block">
        <span class="lang-en"><strong>English:</strong> You don't need to be a math expert. This page helps you <em>guide</em> your student — with pictures, steps, and words in both languages.</span>
        <span class="lang-es" lang="es"><strong>Español:</strong> No necesitas ser experto en matemáticas. Esta página te ayuda a <em>guiar</em> a tu estudiante — con dibujos, pasos y palabras en dos idiomas.</span>
      </p>
      
      <!-- Modern language mode selector -->
      <div class="lang-selector-card">
        <span class="lang-selector-title">Language / Idioma:</span>
        <div class="lang-selector-buttons" role="group" aria-label="Language Mode Selector">
          <button type="button" class="lang-toggle-btn active" data-lang-mode="bilingual" onclick="setLanguageMode('bilingual')">
            🇺🇸🇪🇸 Bilingual / Bilíngüe
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
  const wordsEn = vocab.map((v) => v.term).filter(Boolean).join(", ");
  const wordsEs = vocab.map((v) => v.termEs || v.term).filter(Boolean).join(", ");

  return `
    <section class="guided-section card section-learn" aria-label="What we are learning tonight">
      <h2 class="section-title">📖 What we're learning tonight / Qué aprendemos hoy</h2>
      <div class="bilingual-grid">
        <div class="bilingual-col lang-en">
          <span class="lang-label">English</span>
          <p class="learning-big">${esc(en.charAt(0).toUpperCase() + en.slice(1))}.</p>
          ${wordsEn ? `<p class="learning-sub">Practice using these words while you work: <em>${esc(wordsEn)}</em>.</p>` : ""}
        </div>
        <div class="bilingual-col lang-es" lang="es">
          <span class="lang-label">Español</span>
          <p class="learning-big">${esc(es.endsWith(".") ? es : `${es}.`)}</p>
          ${wordsEs ? `<p class="learning-sub">Practiquen usar estas palabras al trabajar: <em>${esc(wordsEs)}</em>.</p>` : ""}
        </div>
      </div>
    </section>`;
}

export function renderConceptExplainer(config) {
  const steps = buildConceptSteps(config);
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);

  return `
    <section class="guided-section card section-visual" aria-label="Visual concept explainer">
      <h2 class="section-title">🎯 The big idea / La idea principal</h2>
      <div class="concept-visual-wrap">${conceptVisualSvg(config)}</div>
      <div class="key-idea-banner">
        <p class="lang-en"><strong>Watch for this:</strong> ${esc(keyEn)}</p>
        <p class="lang-es" lang="es"><strong>Observa esto:</strong> ${esc(keyEs)}</p>
      </div>
      <ol class="guided-steps">
        ${steps
          .map(
            (s) => `
          <li class="guided-step step-color-${s.stepNum}">
            <span class="step-badge">Step ${s.stepNum} / Paso ${s.stepNum}</span>
            <p class="lang-en">${esc(s.en)}</p>
            <p class="lang-es" lang="es">${esc(s.es)}</p>
          </li>`,
          )
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

export function renderTryTogether(config) {
  const activity = tryTogetherActivity(config);

  return `
    <section class="guided-section card section-together" aria-label="Try this together">
      <h2 class="section-title">🤝 Try this together / Inténtenlo juntos</h2>
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
          <li class="together-step step-color-${(i % 4) + 1}">
            <div class="together-step-head">
              <span class="step-badge">Step ${i + 1} / Paso ${i + 1}</span>
            </div>
            <p class="lang-en"><strong>First…</strong> ${esc(step.en)}</p>
            <p class="lang-es" lang="es"><strong>Primero…</strong> ${esc(step.es)}</p>
            <div class="together-fill">
              <label class="together-fill-label" for="together_${i}">
                <span class="lang-en">✏️ Your turn — write or draw it here:</span>
                <span class="lang-es" lang="es">✏️ Tu turno — escribe o dibuja aquí:</span>
              </label>
              <textarea id="together_${i}" name="together_${i}" class="custom-textarea together-fill-input" rows="2" placeholder="…" oninput="saveState();"></textarea>
            </div>
            <div class="together-step-actions">
              ${hintBtn}
              ${helpBtn}
            </div>
          </li>`;
          })
          .join("")}
      </ol>
    </section>`;
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

export function renderQuickCheckIntro() {
  return `
    <section class="guided-section card section-quick-intro" aria-label="Quick check introduction">
      <h2 class="section-title">✅ Quick check / Repaso rápido</h2>
      <p class="bilingual-block">
        <span class="lang-en">A few problems to practice together. Each one has a <strong>step-by-step guide</strong>, a <strong>picture to draw on</strong>, and a <strong>space to show your work</strong>. Use <strong>Check This Problem</strong> for instant feedback — no need to finish everything at once.</span>
        <span class="lang-es" lang="es">Unos problemas para practicar juntos. Cada uno tiene una <strong>guía paso a paso</strong>, un <strong>dibujo para trabajar</strong> y un <strong>espacio para mostrar el trabajo</strong>. Usen <strong>Revisar esta pregunta</strong> para retroalimentación al instante — no tienen que terminar todo de una vez.</span>
      </p>
    </section>`;
}

export function renderWordsToKnow(vocabList, resolveVocabImage, vocabImageAlt) {
  if (!Array.isArray(vocabList) || vocabList.length === 0) return "";

  return `
    <section class="guided-section card section-vocab vocab-section" aria-label="Words to know">
      <h2 class="section-title">📚 Words to know / Palabras clave</h2>
      <p class="vocab-family-note bilingual-block">
        <span class="lang-en">Tap a card to flip. Use these words when you talk about the math together.</span>
        <span class="lang-es" lang="es">Toquen una tarjeta para voltearla. Usen estas palabras cuando hablen de la matemática juntos.</span>
      </p>
      <div class="vocab-container">
        ${vocabList
          .map((v) => {
            const term = v.term || "";
            const termEs = v.termEs || "";
            const definition = v.definition || "";
            const definitionEs = v.definitionEs || "";
            const visual = v.visual || "";
            const imgSrc = resolveVocabImage(term, v.image);
            const imgAlt = vocabImageAlt(term, definition);
            return `
            <div class="vocab-card" onclick="this.classList.toggle('flipped')">
              <div class="vocab-card-inner">
                <div class="vocab-card-front">
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
                </div>
              </div>
            </div>`;
          })
          .join("")}
      </div>
    </section>`;
}

function tabPanelAttrs(id, hidden = false) {
  return `class="tab-panel-inner" data-tab-panel="${id}" id="hw_panel_${id}" role="tabpanel"${hidden ? " hidden" : ""}`;
}

export function renderLearnTab(config) {
  const learning = renderLearningTonight(config).replace(/<section[^>]*>|<\/section>/g, "");
  const concept = renderConceptExplainer(config).replace(/<section[^>]*>|<\/section>/g, "");
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);
  return `
    <div ${tabPanelAttrs("learn")}>
      ${learning}
      ${concept}
      <p class="tab-help-row">${helpButton("💡 Need more help? / ¿Más ayuda?", { titleEn: "The big idea", titleEs: "La idea principal", en: keyEn, es: keyEs })}</p>
    </div>`;
}

export function renderWordsTab(vocabList, resolveVocabImage, vocabImageAlt) {
  const inner = renderWordsToKnow(vocabList, resolveVocabImage, vocabImageAlt);
  if (!inner) {
    return `<div ${tabPanelAttrs("words", true)}><p class="lang-en">No vocabulary listed for this lesson.</p><p class="lang-es" lang="es">No hay vocabulario listado para esta lección.</p></div>`;
  }
  return `<div ${tabPanelAttrs("words", true)}>${inner.replace(/<section[^>]*>|<\/section>/g, "")}</div>`;
}

export function renderTogetherTab(config) {
  const inner = renderTryTogether(config).replace(/<section[^>]*>|<\/section>/g, "");
  return `<div ${tabPanelAttrs("together", true)}>${inner}</div>`;
}

export function renderCheckTab(quickCheckIntro, warmupHtml, challengeHtml = "", moreHtml = "") {
  const intro = quickCheckIntro.replace(/<section[^>]*>|<\/section>/g, "");

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
          </div>
        </div>
        <main class="problems-container">${warmupHtml}</main>
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
        <main class="problems-container">${challengeHtml}</main>
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
        <main class="problems-container more-practice-container">${moreHtml}</main>
      </details>`
    : "";

  return `
    <div ${tabPanelAttrs("check", true)}>
      ${intro}
      ${warmupBlock}
      ${challengeBlock}
      ${more}
    </div>`;
}

// Math Workbench tab — embeds the shared whiteboard so families can show their
// work without leaving the homework page. The iframe is lazy-loaded on first
// open (see HOMEWORK_TABS_JS) so it never slows down the rest of the page.
export function renderWorkbenchTab() {
  return `
    <div ${tabPanelAttrs("workbench", true)}>
      <section class="guided-section card section-workbench" aria-label="Math Workbench">
        <h2 class="section-title">🧮 Math Workbench / Pizarra de matemáticas</h2>
        <p class="bilingual-block">
          <span class="lang-en">A digital scratch pad to draw models, line up decimals, and show your work — right here while you practice.</span>
          <span class="lang-es" lang="es">Una pizarra digital para dibujar modelos, alinear decimales y mostrar el trabajo — aquí mismo mientras practican.</span>
        </p>
        <p class="workbench-openrow">
          <a class="btn btn-secondary" href="/curriculum/math-workbench/" target="_blank" rel="noopener">
            <span class="lang-en">↗ Open full screen</span>
            <span class="lang-es" lang="es">↗ Abrir en pantalla completa</span>
          </a>
        </p>
        <div class="workbench-frame-wrap">
          <iframe class="workbench-frame" data-src="/curriculum/math-workbench/" title="Math Workbench" loading="lazy"></iframe>
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
            <span class="lang-es" lang="es"><strong>Abre el Cuaderno de Matemáticas</strong> — una pizarra digital para dibujar, escribir y resolver problemas juntos.</span>
          </span>
          <span class="ai-lab-arrow" aria-hidden="true">→</span>
        </a>
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
  const hintEs = "Lean la pregunta en voz alta. ¿Qué observan? ¿Qué operación o idea encaja?";
  return helpButton("💡 Stuck? Get a hint / ¿Atorado? Pista", {
    titleEn: "Hint before you check",
    titleEs: "Pista antes de revisar",
    en: hintEn,
    es: hintEs,
    visual,
    frameEn: "Draw it first, then solve. Try saying: “This problem is asking me to…”",
    frameEs:
      "Dibújenlo primero, luego resuelvan. Intenten decir: “Este problema me pide que…”",
  });
}

export function renderDoneTab() {
  const inner = renderCelebration().replace(/<section[^>]*>|<\/section>/g, "");
  return `<div ${tabPanelAttrs("done", true)}>${inner}</div>`;
}

const HOMEWORK_TABS = [
  { id: "learn", icon: "📖", en: "Learn", es: "Aprender" },
  { id: "words", icon: "📚", en: "Words", es: "Palabras" },
  { id: "together", icon: "🤝", en: "Together", es: "Juntos" },
  { id: "check", icon: "✅", en: "Check", es: "Repaso" },
  { id: "workbench", icon: "🧮", en: "Workbench", es: "Pizarra" },
  { id: "help", icon: "💬", en: "Help", es: "Ayuda" },
  { id: "more", icon: "🌐", en: "More", es: "Más" },
  { id: "play", icon: "🎮", en: "Play", es: "Jugar" },
  { id: "done", icon: "🎉", en: "Done", es: "Listo" },
];

export function renderHomeworkTabs(panelsHtml) {
  const tabCount = HOMEWORK_TABS.length;
  return `
    <div class="homework-tabs-shell" data-tab-count="${tabCount}">
      <div class="homework-tab-chrome">
        <nav class="homework-tab-bar" role="tablist" aria-label="Family homework sections">
          ${HOMEWORK_TABS.map(
            (t, i) => `
            <button type="button" role="tab" id="hw_tab_${t.id}" class="homework-tab-btn${i === 0 ? " is-active" : ""}"
              aria-selected="${i === 0 ? "true" : "false"}" aria-controls="hw_panel_${t.id}"
              data-tab="${t.id}" onclick="switchHomeworkTab('${t.id}')">
              <span class="tab-icon" aria-hidden="true">${t.icon}</span>
              <span class="tab-label"><span class="tab-en">${t.en}</span><span class="tab-es" lang="es">${t.es}</span></span>
            </button>`,
          ).join("")}
        </nav>
        <div class="homework-tab-progress" aria-live="polite">
          <span id="hw_tab_progress">1 of ${tabCount}</span>
          <button type="button" class="btn btn-sm btn-secondary print-all-btn" onclick="window.print()">🖨️ Print all / Imprimir todo</button>
        </div>
      </div>
      <div class="homework-tab-panels" id="hw_tab_panels">
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
  const total = document.querySelector('.homework-tabs-shell')?.dataset.tabCount || '8';
  if (prog) prog.textContent = idx + ' of ' + total + ' / ' + idx + ' de ' + total;
  if (tabId === 'play' && typeof initHomeworkGame === 'function') initHomeworkGame();
  if (tabId === 'workbench') {
    var wf = document.querySelector('.workbench-frame');
    if (wf && !wf.getAttribute('src') && wf.dataset.src) wf.setAttribute('src', wf.dataset.src);
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
});

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
  color: var(--teal);
  margin-bottom: 6px;
}
.lang-en { margin: 0 0 6px; }
/* Spanish is a primary language for our families: keep it fully legible, not a faded subtitle. */
.lang-es { margin: 0; color: var(--ink); font-style: normal; }
.lang-en + .lang-es, .worked-step .lang-es { padding-left: 10px; border-left: 3px solid var(--teal); }
.welcome-lead .lang-es { color: rgba(255, 255, 255, 0.94); border-left: 3px solid var(--amber); padding-left: 10px; display: inline-block; margin-top: 6px; }
.learning-big { font-size: 17px; font-weight: 700; color: var(--navy); margin: 0 0 8px; line-height: 1.4; }
.learning-sub { font-size: 14px; margin: 0; color: var(--ink); }

.guided-section { scroll-margin-top: 16px; }
.section-learn { border-left: 4px solid var(--teal); }
.section-visual { border-left: 4px solid var(--amber); }
.section-together { border-left: 4px solid #5b8def; }
.section-vocab { border-left: 4px solid var(--coral); }
.section-stuck { border-left: 4px solid #9b59b6; }
.section-quick-intro { border-left: 4px solid var(--success); }
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
.problems-container .problem-number-badge::after {
  content: " / Repaso";
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

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
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.homework-tab-btn:hover { border-color: var(--teal); color: var(--navy); }
.homework-tab-btn:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
.homework-tab-btn.is-active {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--white);
  box-shadow: 0 2px 8px rgba(31,166,162,0.30);
}
.tab-icon { font-size: 20px; line-height: 1; }
.tab-label { display: flex; flex-direction: column; align-items: center; line-height: 1.15; }
.tab-es { font-size: 10px; color: var(--muted); font-weight: 600; }
.homework-tab-btn.is-active .tab-es { color: var(--white); }

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
.help-frame-tag { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--teal); }
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

/* "More practice" accordion in the Check tab */
/* Tiered practice sections (warm-up first, then a harder challenge set) */
.practice-tier { margin: 0 0 22px; }
.practice-tier + .practice-tier { margin-top: 4px; }
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
.practice-tier-badge.tier-warmup { background: var(--teal); }
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
.workbench-frame { display: block; width: 100%; height: 72vh; min-height: 480px; border: 0; }

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
.ext-source { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--teal); }
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
  background: var(--teal);
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
  background: var(--teal);
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
  color: var(--teal);
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
  background: var(--teal);
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
  .homework-tab-btn, .hw-game-choice-btn, .help-pop-btn { transition: none; }
}
@media print {
  .homework-tab-chrome, .homework-tab-bar, .bottom-status-bar, .help-modal-overlay, .print-all-btn, .parent-signoff-container { display: none !important; }
  .tab-panel-inner[hidden] { display: block !important; page-break-inside: avoid; }
  body { padding-bottom: 0; }
  
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
`;
