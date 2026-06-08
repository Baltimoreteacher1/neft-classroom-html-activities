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
import {
  detectVisualTopic,
  selectAlignedQuickCheckProblems,
} from "./homework-alignment.mjs";
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
  const intro = conceptIntro(config);
  if (intro?.keyIdea) return intro.keyIdea;
  if (intro?.intro) return intro.intro;
  const talk = firstTurnAndTalk(config);
  return talk?.kernel || config.contentObjective || "";
}

function keyIdeaEs(config) {
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
      en: "Let your student try first. Ask \"What do you notice?\" before giving hints.",
      es: "Deja que tu estudiante intente primero. Pregunta \"¿Qué observas?\" antes de dar pistas.",
    });
  }
  return cues.slice(0, 3);
}

function togetherStepHints(config, isLast) {
  const topic = detectVisualTopic(config);
  const byTopic = {
    exponents: {
      en: isLast ? "Count how many times the base is multiplied — that is the exponent." : "Write the repeated multiplication first, then the power.",
      es: isLast ? "Cuenten cuántas veces se multiplica la base — eso es el exponente." : "Escriban primero la multiplicación repetida, luego la potencia.",
    },
    equations: {
      en: isLast ? "Check: does your equation match every word in the clue?" : "Name the unknown with a letter before you write symbols.",
      es: isLast ? "Verifiquen: ¿su ecuación coincide con cada palabra de la pista?" : "Nombren la incógnita con una letra antes de escribir símbolos.",
    },
    inequalities: {
      en: isLast ? "Test one value from your shaded region to verify it works." : "Open circle for < or >; closed circle for ≤ or ≥.",
      es: isLast ? "Prueben un valor de la región sombreada para verificar." : "Círculo abierto para < o >; cerrado para ≤ o ≥.",
    },
    ratios: {
      en: isLast ? "Both columns must change by the same multiplier." : "Point to each row as you compare the two quantities.",
      es: isLast ? "Ambas columnas deben cambiar con el mismo multiplicador." : "Señalen cada fila mientras comparan las dos cantidades.",
    },
    fractions: {
      en: isLast ? "Draw a picture or use a number line to justify your answer." : "Say the units out loud — what does each number represent?",
      es: isLast ? "Dibujen o usen una recta numérica para justificar." : "Digan las unidades en voz alta — ¿qué representa cada número?",
    },
  };
  const pick = byTopic[topic] || {
    en: isLast ? "Ask your student to explain why each step makes sense." : "Point to each number or symbol as you talk.",
    es: isLast ? "Pídele que explique por qué tiene sentido cada paso." : "Señalen cada número o símbolo mientras hablan.",
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
      es: translateConceptLine(explore.instructions, vocab) ||
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

  return {
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
  const data = String(JSON.stringify(payload))
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;");
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
    </header>`;
}

export function renderLearningTonight(config) {
  const { en, es } = learningTonight(config);
  const langObj = config.languageObjective || "";
  const langObjEs = languageTonightEs(config);

  return `
    <section class="guided-section card section-learn" aria-label="What we are learning tonight">
      <h2 class="section-title">📖 What we're learning tonight / Qué aprendemos hoy</h2>
      <div class="bilingual-grid">
        <div class="bilingual-col lang-en">
          <span class="lang-label">English</span>
          <p class="learning-big">${esc(en.charAt(0).toUpperCase() + en.slice(1))}.</p>
          ${langObj ? `<p class="learning-sub">Also practice saying: <em>${esc(plainObjective(langObj))}</em></p>` : ""}
        </div>
        <div class="bilingual-col lang-es" lang="es">
          <span class="lang-label">Español</span>
          <p class="learning-big">${esc(es.endsWith(".") ? es : `${es}.`)}</p>
          ${langObj ? `<p class="learning-sub">También practiquen: <em>${esc(langObjEs.replace(/^Puedo\s/i, "").replace(/\.$/, ""))}</em></p>` : ""}
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
          .map(
            (step, i) => `
          <li class="together-step step-color-${(i % 4) + 1}">
            <div class="together-step-head">
              <span class="step-badge">Step ${i + 1} / Paso ${i + 1}</span>
            </div>
            <p class="lang-en"><strong>First…</strong> ${esc(step.en)}</p>
            <p class="lang-es" lang="es"><strong>Primero…</strong> ${esc(step.es)}</p>
            ${
              step.hint
                ? `<p class="step-hint">💡 ${esc(step.hint)} · ${esc(
                    step.hintEs ||
                      "Tómense su tiempo — el proceso importa más que la respuesta perfecta.",
                  )}</p>`
                : ""
            }
          </li>`,
          )
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
                (t) => `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
              )
              .join("")}
          </ul>
        </div>
        <div class="stuck-panel stuck-dont">
          <h3 class="stuck-heading">🚫 What NOT to say / Qué evitar</h3>
          <ul>
            ${tips.dontSay
              .map(
                (t) => `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
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
    </section>`;
}

export function renderQuickCheckIntro() {
  return `
    <section class="guided-section card section-quick-intro" aria-label="Quick check introduction">
      <h2 class="section-title">✅ Quick check / Repaso rápido</h2>
      <p class="bilingual-block">
        <span class="lang-en">One or two problems to try on the screen. Use <strong>Check This Problem</strong> for instant feedback — no need to finish everything at once.</span>
        <span class="lang-es" lang="es">Una o dos preguntas en pantalla. Usen <strong>Revisar esta pregunta</strong> para retroalimentación al instante — no tienen que terminar todo de una vez.</span>
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

export function renderCheckTab(quickCheckIntro, problemsHtml) {
  const intro = quickCheckIntro.replace(/<section[^>]*>|<\/section>/g, "");
  return `
    <div ${tabPanelAttrs("check", true)}>
      ${intro}
      <main class="problems-container">${problemsHtml}</main>
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

export function renderProblemHintButton(problem) {
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
        <p class="help-modal-body lang-en" id="help_modal_en"></p>
        <p class="help-modal-body lang-es" lang="es" id="help_modal_es"></p>
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
});
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
.lang-es { margin: 0; color: var(--muted); font-style: normal; }
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

.external-resource-list { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-direction: column; gap: 10px; }
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

@media (prefers-reduced-motion: reduce) {
  .homework-tab-btn, .hw-game-choice-btn, .help-pop-btn { transition: none; }
}
@media print {
  .homework-tab-chrome, .homework-tab-bar, .bottom-status-bar, .help-modal-overlay, .print-all-btn { display: none !important; }
  .tab-panel-inner[hidden] { display: block !important; page-break-inside: avoid; }
  body { padding-bottom: 0; }
}
`;
