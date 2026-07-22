import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveVocabImage, vocabImageAlt } from "../engine/core/vocab-images.js";
import { interactiveVisualHost } from "../engine/core/interactive-visual.js";
import { EDITORIAL_FONT_IMPORT, EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";
import {
  selectQuickCheckProblems,
  renderWelcomeBanner,
  renderQuickCheckIntro,
  renderHomeworkTabs,
  renderLearnTab,
  renderArcadeTabPanel,
  renderWordsTab,
  renderTogetherTab,
  renderCheckTab,
  renderWorkbenchTab,
  renderHelpTab,
  renderMoreTab,
  renderPlayTabPanel,
  renderDoneTab,
  renderHelpModal,
  renderProblemHintButton,
  GUIDED_NOTES_CSS,
  HOMEWORK_TABS_JS,
} from "./homework-guided-notes.mjs";
import { HOMEWORK_GAME_JS } from "./homework-games.mjs";
import {
  renderVisualMathLab,
  VISUAL_LABS_CSS,
  VISUAL_LABS_JS,
} from "./homework-visual-labs.mjs";
import {
  detectVisualTopic,
  selectMorePracticeProblems,
  selectTieredQuickCheckProblems,
} from "./homework-alignment.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");

// Match core/flagship lessons like "3-2" or "3-2-flagship"
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escAttr(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function slugId(label, idx) {
  return (
    String(label || `cat-${idx}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `cat-${idx}`
  );
}

// Normalize drag-sort configs (ordering, nested categories, string categories).
function normalizeDragSort(it) {
  const rawItems = it.items || [];
  const hasStringItems =
    Array.isArray(rawItems) && rawItems.length > 0 && typeof rawItems[0] === "string";
  const hasCorrectOrder = Array.isArray(it.correctOrder) && it.correctOrder.length > 0;
  const hasCategoryItems =
    Array.isArray(rawItems) &&
    rawItems.length > 0 &&
    typeof rawItems[0] === "object" &&
    rawItems[0]?.category;

  if (hasStringItems && (hasCorrectOrder || !hasCategoryItems)) {
    const steps = rawItems.map(String);
    const correctOrder = (it.correctOrder || steps).map(String);
    return {
      kind: "order",
      steps,
      correctOrder,
      label: it.label || it.instructions || "Put the steps in the correct order.",
      hints: it.hints || [],
    };
  }

  let categories = Array.isArray(it.categories) ? [...it.categories] : [];
  let items = Array.isArray(it.items) ? [...it.items] : [];

  categories = categories.map((cat, idx) => {
    if (typeof cat === "string") {
      const id = slugId(cat, idx);
      return { id, label: cat };
    }
    if (cat && typeof cat === "object") {
      const label = cat.label || cat.id || `Group ${idx + 1}`;
      const id = cat.id || slugId(label, idx);
      return { id, label, items: cat.items };
    }
    return { id: `cat-${idx}`, label: `Group ${idx + 1}` };
  });

  if (!items.length && categories.some((c) => Array.isArray(c.items))) {
    items = categories.flatMap((cat) =>
      (cat.items || []).map((text) => ({
        text: String(text),
        category: cat.id,
      })),
    );
    categories = categories.map(({ id, label }) => ({ id, label }));
  }

  if (!items.length && Array.isArray(it.cards) && categories.length) {
    const normCats = categories.map((cat, idx) => {
      if (typeof cat === "string") return { id: slugId(cat, idx), label: cat };
      const label = cat.label || cat.id || `Group ${idx + 1}`;
      return { id: cat.id || slugId(label, idx), label };
    });
    categories = normCats;
    items = it.cards.map((card) => ({
      text: String(card.text || ""),
      category: normCats[card.correct]?.id || normCats[0]?.id || "",
    }));
  }

  items = items.map((item) => {
    if (typeof item === "string") return { text: item, category: "" };
    return {
      text: String(item.text || item.label || ""),
      category: String(item.category || ""),
    };
  });

  return {
    kind: "sort",
    categories,
    items,
    label: it.label || it.instructions || "Sort the items into the correct groups.",
    hints: it.hints || [],
  };
}

const FAMILY_TIPS_BY_TYPE = {
  "multiple-choice": {
    en: "Read the question together, then let your student pick an answer before you discuss why.",
    es: "Lean la pregunta juntos; dejen que su estudiante elija antes de hablar del porqué.",
  },
  "matching-game": {
    en: "Say each term out loud, then talk through which match makes sense before choosing.",
    es: "Digan cada término en voz alta y hablen de cuál pareja tiene sentido antes de elegir.",
  },
  "drag-sort": {
    en: "On a phone, use Move to. On a computer, drag cards or tap a card then tap a column.",
    es: "En el teléfono usen Mover a. En la computadora arrastren o toquen tarjeta y columna.",
  },
  "drag-order": {
    en: "Use the ▲ ▼ buttons to reorder steps, or drag the row handles on a computer.",
    es: "Usen ▲ ▼ para reordenar, o arrastren las filas en la computadora.",
  },
  "fill-table": {
    en: "Encourage your student to show work on paper if a box feels tricky.",
    es: "Animen a mostrar el trabajo en papel si una casilla se siente difícil.",
  },
  "error-analysis": {
    en: "Read each step aloud and ask: does this step follow the math rules we learned?",
    es: "Lean cada paso en voz alta y pregunten: ¿sigue las reglas que aprendimos?",
  },
  "open-response": {
    en: "A complete sentence with math vocabulary is the goal — not a perfect paragraph.",
    es: "Una oración completa con vocabulario matemático es la meta — no un párrafo perfecto.",
  },
};

function renderFamilyTip(typeKey) {
  const tip = FAMILY_TIPS_BY_TYPE[typeKey] || FAMILY_TIPS_BY_TYPE["multiple-choice"];
  return `<p class="family-problem-tip"><span class="lang-en">👪 ${esc(tip.en)}</span><span class="lang-es" lang="es">👪 ${esc(tip.es)}</span></p>`;
}

function shuffleSteps(steps, correctOrder) {
  const out = [...steps];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (correctOrder.length > 1 && out.every((s, i) => s === correctOrder[i])) {
    return [out[out.length - 1], ...out.slice(0, -1)];
  }
  return out;
}

function isPrintable(it) {
  if (!it || typeof it !== "object") return false;
  return [
    "multiple-choice",
    "fill-table",
    "matching-game",
    "drag-sort",
    "error-analysis",
    "open-response",
  ].includes(it.type);
}

function selectProblems(practice = {}, config = {}) {
  return selectQuickCheckProblems(practice, config);
}

// Map column labels (Shape A) to row-object keys.
function headerKeysFor(columns, sampleRow) {
  const rowKeys = Object.keys(sampleRow);
  const guesses = [];
  for (let i = 0; i < columns.length; i++) {
    if (i === 0 && rowKeys.includes("given")) guesses.push("given");
    else if (i === columns.length - 1 && rowKeys.includes("answer")) guesses.push("answer");
    else {
      const used = new Set(guesses);
      const candidate = rowKeys.find((k) => !used.has(k) && k !== "given" && k !== "answer");
      guesses.push(candidate || rowKeys[i] || "answer");
    }
  }
  return guesses;
}

function lessonConfigs() {
  const out = [];
  for (const dir of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || !LESSON_DIR_RE.test(dir.name)) continue;
    const cfgPath = join(lessonsDir, dir.name, "config.json");
    if (!existsSync(cfgPath)) continue;
    try {
      const config = JSON.parse(readFileSync(cfgPath, "utf8"));
      // Merge curated bilingual family-homework notes from sidecar data file.
      // Sidecar keeps lesson configs lean; inline config.familyNotes wins on conflict.
      const notesPath = join(root, "data", "family-homework-notes", `${dir.name}.json`);
      if (existsSync(notesPath)) {
        try {
          const notes = JSON.parse(readFileSync(notesPath, "utf8"));
          config.familyNotes = { ...notes, ...(config.familyNotes || {}) };
        } catch (e) {
          console.error(`Bad family-homework sidecar for ${dir.name}: ${e.message}`);
        }
      }
      out.push({ id: dir.name, config });
    } catch (err) {
      console.error(`Skipping ${dir.name}: ${err.message}`);
    }
  }
  out.sort((a, b) => {
    const ma = a.id.match(LESSON_DIR_RE);
    const mb = b.id.match(LESSON_DIR_RE);
    return (
      Number(ma[1]) - Number(mb[1]) ||
      Number(ma[2]) - Number(mb[2]) ||
      (a.id.endsWith("-flagship") ? 1 : 0) - (b.id.endsWith("-flagship") ? 1 : 0)
    );
  });
  return out;
}

// ---------------------------------------------------------------------------
// Family-homework problem scaffolding
// Every Quick Check problem gets clear step-by-step guidance, a visual model to
// reason with, and room to show work — on screen (saved) and in print.
// ---------------------------------------------------------------------------

// Topic-aware one-liners woven into the step guide (bilingual + what to draw).
const TOPIC_GUIDE = {
  exponents: {
    en: "Write the base, then multiply it by itself once for each exponent.",
    es: "Escribe la base y multiplícala por sí misma una vez por cada exponente.",
    draw: "Show the repeated multiplication (example: 2³ = 2 × 2 × 2).",
    drawEs: "Muestra la multiplicación repetida (ejemplo: 2³ = 2 × 2 × 2).",
  },
  ratios: {
    en: "Find the unit rate or use a ratio table to scale up or down.",
    es: "Halla la tasa unitaria o usa una tabla de razones para escalar.",
    draw: "Fill the ratio table — keep both rows multiplying by the same number.",
    drawEs: "Llena la tabla de razones — multiplica ambas filas por el mismo número.",
  },
  area: {
    en: "Count or multiply the units that cover the shape (base × height).",
    es: "Cuenta o multiplica las unidades que cubren la figura (base × altura).",
    draw: "Outline the shape on the grid and count the square units inside.",
    drawEs: "Dibuja la figura en la cuadrícula y cuenta los cuadrados de adentro.",
  },
  volume: {
    en: "Multiply length × width × height to fill the box with unit cubes.",
    es: "Multiplica largo × ancho × alto para llenar la caja con cubos.",
    draw: "Label the prism with its length, width, and height.",
    drawEs: "Rotula el prisma con su largo, ancho y alto.",
  },
  "surface-area": {
    en: "Find the area of every face, then add them all together.",
    es: "Halla el área de cada cara y luego súmalas todas.",
    draw: "Label each face of the prism, then write its area.",
    drawEs: "Rotula cada cara del prisma y escribe su área.",
  },
  "coordinate-plane": {
    en: "Start at (0, 0). Move right/left for x, then up/down for y.",
    es: "Empieza en (0, 0). Muévete a los lados para x, luego arriba/abajo para y.",
    draw: "Plot each point on the grid and label it (x, y).",
    drawEs: "Marca cada punto en la cuadrícula y rotúlalo (x, y).",
  },
  "number-line": {
    en: "Place each number on the line — order tells you which is greater.",
    es: "Coloca cada número en la recta — el orden dice cuál es mayor.",
    draw: "Mark the numbers on the number line in order.",
    drawEs: "Marca los números en la recta numérica en orden.",
  },
  fractions: {
    en: "Use a common denominator, or a number line, before you compare or add.",
    es: "Usa un denominador común, o una recta numérica, antes de comparar o sumar.",
    draw: "Split the number line into equal parts to show the fractions.",
    drawEs: "Divide la recta numérica en partes iguales para mostrar las fracciones.",
  },
  decimals: {
    en: "Line up the decimal points and keep each digit in its place value.",
    es: "Alinea los puntos decimales y mantén cada dígito en su valor posicional.",
    draw: "Mark the decimals on the number line between the whole numbers.",
    drawEs: "Marca los decimales en la recta numérica entre los enteros.",
  },
  equations: {
    en: "Keep both sides equal — do the same thing to undo the operation.",
    es: "Mantén ambos lados iguales — haz lo mismo para deshacer la operación.",
    draw: "Picture a balance: what you do to one side, do to the other.",
    drawEs: "Imagina una balanza: lo que haces a un lado, hazlo al otro.",
  },
  inequalities: {
    en: "Solve like an equation, then shade the side that makes it true.",
    es: "Resuelve como una ecuación y luego sombrea el lado que es verdadero.",
    draw: "On the number line, use an open/closed circle and shade the solutions.",
    drawEs: "En la recta, usa un círculo abierto/cerrado y sombrea las soluciones.",
  },
  expressions: {
    en: "Combine like terms; substitute the value, then follow the order of operations.",
    es: "Combina términos semejantes; sustituye el valor y sigue el orden de operaciones.",
    draw: "Box each term so you can see what to combine.",
    drawEs: "Encierra cada término para ver qué combinar.",
  },
  statistics: {
    en: "Organize the data first, then find the center or spread you need.",
    es: "Organiza los datos primero, luego halla el centro o la dispersión.",
    draw: "Plot each data value above the number line.",
    drawEs: "Marca cada valor de datos sobre la recta numérica.",
  },
  factors: {
    en: "List factors or multiples in order so none are missed.",
    es: "Enumera factores o múltiplos en orden para no olvidar ninguno.",
    draw: "Make a factor list or a tree to break the number apart.",
    drawEs: "Haz una lista de factores o un árbol para descomponer el número.",
  },
  fallback: {
    en: "Take it one step at a time and show how you got each number.",
    es: "Hazlo paso a paso y muestra cómo obtuviste cada número.",
    draw: "Draw a quick model — a picture, a number line, or a table.",
    drawEs: "Dibuja un modelo rápido — un dibujo, una recta numérica o una tabla.",
  },
};

// Blank, annotatable manipulatives (families draw on / print). Static by design.
const SVG_NUMBER_LINE = `<svg viewBox="0 0 320 60" class="hw-visual-svg" role="img" aria-label="Blank number line"><line x1="14" y1="34" x2="306" y2="34" stroke="#12355b" stroke-width="2"/><polygon points="306,34 296,29 296,39" fill="#12355b"/><polygon points="14,34 24,29 24,39" fill="#12355b"/>${[
  0, 1, 2, 3, 4, 5, 6, 7, 8,
]
  .map((i) => {
    const x = 30 + i * 33;
    return `<line x1="${x}" y1="28" x2="${x}" y2="40" stroke="#12355b" stroke-width="1.5"/>`;
  })
  .join("")}</svg>`;

const SVG_GRID = `<svg viewBox="0 0 320 160" class="hw-visual-svg" role="img" aria-label="Blank grid to draw a model"><rect x="10" y="10" width="300" height="140" fill="#ffffff" stroke="#12355b" stroke-width="1.5"/>${Array.from({ length: 14 }, (_, i) => `<line x1="${10 + (i + 1) * 20}" y1="10" x2="${10 + (i + 1) * 20}" y2="150" stroke="#d6e2ee" stroke-width="1"/>`).join("")}${Array.from({ length: 6 }, (_, i) => `<line x1="10" y1="${10 + (i + 1) * 20}" x2="310" y2="${10 + (i + 1) * 20}" stroke="#d6e2ee" stroke-width="1"/>`).join("")}</svg>`;

const SVG_COORD = `<svg viewBox="0 0 200 200" class="hw-visual-svg" role="img" aria-label="Blank four-quadrant coordinate grid">${Array.from({ length: 9 }, (_, i) => `<line x1="${20 + i * 20}" y1="20" x2="${20 + i * 20}" y2="180" stroke="#d6e2ee" stroke-width="1"/><line x1="20" y1="${20 + i * 20}" x2="180" y2="${20 + i * 20}" stroke="#d6e2ee" stroke-width="1"/>`).join("")}<line x1="100" y1="16" x2="100" y2="184" stroke="#12355b" stroke-width="2"/><line x1="16" y1="100" x2="184" y2="100" stroke="#12355b" stroke-width="2"/><polygon points="100,16 96,26 104,26" fill="#12355b"/><polygon points="184,100 174,96 174,104" fill="#12355b"/></svg>`;

const SVG_RATIO_TABLE = `<svg viewBox="0 0 320 110" class="hw-visual-svg" role="img" aria-label="Blank ratio table"><rect x="10" y="15" width="300" height="80" fill="#ffffff" stroke="#12355b" stroke-width="1.5"/><line x1="10" y1="55" x2="310" y2="55" stroke="#12355b" stroke-width="1.5"/>${[85, 160, 235].map((x) => `<line x1="${x}" y1="15" x2="${x}" y2="95" stroke="#12355b" stroke-width="1.5"/>`).join("")}</svg>`;

const SVG_PRISM = `<svg viewBox="0 0 220 140" class="hw-visual-svg" role="img" aria-label="Rectangular prism to label"><rect x="40" y="45" width="110" height="70" fill="#ffffff" stroke="#12355b" stroke-width="2"/><polygon points="40,45 75,20 185,20 150,45" fill="#eef5f4" stroke="#12355b" stroke-width="2"/><polyline points="150,45 185,20 185,90 150,115" fill="none" stroke="#12355b" stroke-width="2"/><line x1="150" y1="115" x2="185" y2="90" stroke="#12355b" stroke-width="2"/></svg>`;

const SVG_BALANCE = `<svg viewBox="0 0 220 130" class="hw-visual-svg" role="img" aria-label="Balance scale for an equation"><line x1="30" y1="40" x2="190" y2="40" stroke="#12355b" stroke-width="3"/><line x1="110" y1="40" x2="110" y2="110" stroke="#12355b" stroke-width="3"/><polygon points="90,118 130,118 110,110" fill="#12355b"/><path d="M30 40 L14 70 L46 70 Z" fill="none" stroke="#12355b" stroke-width="2"/><path d="M190 40 L174 70 L206 70 Z" fill="none" stroke="#12355b" stroke-width="2"/><text x="110" y="34" text-anchor="middle" font-size="16" fill="#12355b">=</text></svg>`;

const SVG_EXP = `<svg viewBox="0 0 320 70" class="hw-visual-svg" role="img" aria-label="Repeated multiplication boxes">${[0, 1, 2, 3].map((i) => `<rect x="${15 + i * 78}" y="18" width="50" height="36" rx="6" fill="#ffffff" stroke="#12355b" stroke-width="1.5"/>${i < 3 ? `<text x="${72 + i * 78}" y="42" text-anchor="middle" font-size="20" fill="#12355b">×</text>` : ""}`).join("")}</svg>`;

const TOPIC_VISUAL = {
  exponents: SVG_EXP,
  ratios: SVG_RATIO_TABLE,
  area: SVG_GRID,
  volume: SVG_PRISM,
  "surface-area": SVG_PRISM,
  "coordinate-plane": SVG_COORD,
  "number-line": SVG_NUMBER_LINE,
  fractions: SVG_NUMBER_LINE,
  decimals: SVG_NUMBER_LINE,
  equations: SVG_BALANCE,
  inequalities: SVG_NUMBER_LINE,
  expressions: SVG_GRID,
  statistics: SVG_NUMBER_LINE,
  factors: SVG_GRID,
  fallback: SVG_GRID,
};

// Topics whose manipulative becomes a structured, tap-to-graph interactive widget
// (hydrated client-side by the NeftGraph module). The static SVG above stays as the
// no-JS / print fallback — progressive enhancement, nothing breaks without scripts.
const INTERACTIVE_VISUAL = {
  "number-line": "number-line",
  fractions: "number-line",
  decimals: "number-line",
  inequalities: "number-line",
  statistics: "number-line",
  "coordinate-plane": "coordinate-plane",
  area: "grid",
  expressions: "grid",
};
function interactiveType(topic) {
  return INTERACTIVE_VISUAL[topic] || null;
}

function topicGuide(topic) {
  return TOPIC_GUIDE[topic] || TOPIC_GUIDE.fallback;
}

// Collapsible "How to solve it" routine — visible guidance, bilingual.
function renderStepGuide(topic) {
  const g = topicGuide(topic);
  return `
      <details class="hw-step-guide" open>
        <summary><span class="lang-en">🧭 How to solve it — step by step</span><span class="lang-es" lang="es">🧭 Cómo resolverlo — paso a paso</span></summary>
        <ol class="hw-steps">
          <li><strong><span class="lang-en">Read it twice.</span><span class="lang-es" lang="es">Lee dos veces.</span></strong> <span class="lang-en">Circle the numbers and underline the question.</span><span class="lang-es" lang="es">Encierra los números y subraya la pregunta.</span></li>
          <li><strong><span class="lang-en">Picture it.</span><span class="lang-es" lang="es">Hazte una imagen.</span></strong> <span class="lang-en">${esc(g.draw)}</span><span class="lang-es" lang="es">${esc(g.drawEs)}</span></li>
          <li><strong><span class="lang-en">Solve step by step.</span><span class="lang-es" lang="es">Resuelve paso a paso.</span></strong> <span class="lang-en">${esc(g.en)}</span><span class="lang-es" lang="es">${esc(g.es)}</span></li>
          <li><strong><span class="lang-en">Check it.</span><span class="lang-es" lang="es">Revísalo.</span></strong> <span class="lang-en">Does your answer make sense?</span><span class="lang-es" lang="es">¿Tiene sentido tu respuesta?</span></li>
        </ol>
      </details>`;
}

// Visual model + "show your work" space. Persists (saveState) and prints with lines.
function renderWorkspace(topic, pIdx) {
  const g = topicGuide(topic);
  const visual = TOPIC_VISUAL[topic] || SVG_GRID;
  const itype = interactiveType(topic);

  // Interactive graphing topics (number line, coordinate plane, grid): the static
  // SVG is hydrated into a tap-to-graph widget by NeftGraph. A hidden input lets
  // the answer persist through the existing saveState()/loadState() pipeline.
  const visualBlock = itype
    ? `<div class="hw-visual-frame hw-interactive" data-interactive="${itype}" data-pidx="${pIdx}">
            ${visual}
            <div class="hw-graph-controls" data-graph-controls></div>
            <button type="button" class="hw-graph-reset" data-graph-reset><span class="lang-en">↺ Reset</span><span class="lang-es" lang="es">↺ Reiniciar</span></button>
            <div class="hw-graph-readout" data-graph-readout role="status" aria-live="polite"></div>
            <input type="hidden" class="custom-input" name="graph_${pIdx}" data-graph-state value="" />
          </div>`
    : `<div class="hw-visual-frame hw-drawable" data-draw-frame>
            ${visual}
            <canvas class="hw-draw-canvas" data-draw-canvas role="img" aria-label="Drawing area — draw your model here"></canvas>
            <button type="button" class="hw-draw-clear" data-draw-clear><span class="lang-en">🧽 Clear</span><span class="lang-es" lang="es">🧽 Borrar</span></button>
          </div>`;

  const caption = itype
    ? `<span class="lang-en">👆 Tap to graph: ${esc(g.draw)}</span><span class="lang-es" lang="es">👆 Toca para graficar: ${esc(g.drawEs)}</span>`
    : `<span class="lang-en">✏️ Draw your model: ${esc(g.draw)}</span><span class="lang-es" lang="es">✏️ Dibuja tu modelo: ${esc(g.drawEs)}</span>`;

  return `
      <div class="hw-workspace">
        <div class="hw-visual">
          <div class="hw-visual-caption">${caption}</div>
          ${visualBlock}
        </div>
        <div class="hw-work">
          <label class="hw-work-label" for="work_${pIdx}"><span class="lang-en">📝 Show your work</span><span class="lang-es" lang="es">📝 Muestra tu trabajo</span></label>
          <textarea id="work_${pIdx}" name="work_${pIdx}" class="custom-textarea hw-work-input" rows="4" placeholder="Step 1...  Step 2...  Step 3..." oninput="saveState();"></textarea>
        </div>
      </div>`;
}

function renderProblem(it, pIdx, topic = "fallback", opts = {}) {
  const type = it.type;
  let problemSubtype = "";

  let content = "";

  if (type === "multiple-choice") {
    const stem = it.stem || "";
    const choices = it.choices || [];
    const correctIdx = it.correctIndex !== undefined ? it.correctIndex : 0;
    const explanation = it.explanation || "";

    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(stem)}</p>
        ${renderFamilyTip("multiple-choice")}
        <div class="mc-options" data-correct="${correctIdx}" data-explanation="${esc(explanation)}">
          ${choices
            .map(
              (choice, cIdx) => `
            <label class="mc-option-label" id="label_q_${pIdx}_${cIdx}">
              <input type="radio" name="q_${pIdx}" value="${cIdx}" onchange="saveState(); updateProgress();">
              <span class="custom-radio"></span>
              <span class="choice-text">${esc(choice)}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (type === "matching-game") {
    const label = it.label || it.instructions || "Match each item to its correct partner.";
    const pairs = it.pairs || [];

    // Get unique sorted matches for dropdown options
    const allMatches = pairs.map((p) => p.match);
    const sortedMatches = [...new Set(allMatches)].sort();

    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(label)}</p>
        ${renderFamilyTip("matching-game")}
        <div class="matching-pairs">
          ${pairs
            .map(
              (p, pairIdx) => `
            <div class="matching-row" data-term="${esc(p.term)}" data-correct="${esc(p.match)}">
              <div class="matching-term">${esc(p.term)}</div>
              <div class="matching-select-container">
                <select name="q_${pIdx}_pair_${pairIdx}" class="custom-select matching-select" onchange="saveState(); updateProgress();">
                  <option value="">-- Choose Match --</option>
                  ${sortedMatches.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join("")}
                </select>
                <span class="feedback-badge"></span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (type === "drag-sort") {
    const norm = normalizeDragSort(it);
    const familyTipKey = norm.kind === "order" ? "drag-order" : "drag-sort";

    if (norm.kind === "order") {
      problemSubtype = "drag-order";
      const shuffledSteps = shuffleSteps(norm.steps, norm.correctOrder);
      content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(norm.label)}</p>
        ${renderFamilyTip(familyTipKey)}
        <div class="drag-order-workspace" id="dragorder_${pIdx}" data-correct-order='${esc(JSON.stringify(norm.correctOrder))}' data-initial-order='${esc(JSON.stringify(shuffledSteps))}'>
          <div class="drag-order-list" id="orderlist_${pIdx}">
            ${shuffledSteps
              .map(
                (step, stepIdx) => `
              <div class="drag-order-row" draggable="true" id="order_${pIdx}_${stepIdx}" data-step-text="${esc(step)}" ondragstart="handleOrderDragStart(event)" ondragend="handleDragEnd(event)">
                <span class="drag-order-handle" aria-hidden="true">☰</span>
                <span class="drag-order-num">${stepIdx + 1}</span>
                <span class="drag-order-text">${esc(step)}</span>
                <div class="drag-order-controls">
                  <button type="button" class="btn btn-sm btn-secondary order-move-btn" onclick="moveOrderRowByEl(${pIdx}, this, -1)" aria-label="Move up">▲</button>
                  <button type="button" class="btn btn-sm btn-secondary order-move-btn" onclick="moveOrderRowByEl(${pIdx}, this, 1)" aria-label="Move down">▼</button>
                </div>
              </div>`,
              )
              .join("")}
          </div>
        </div>
        <div class="drag-controls">
          <button class="btn btn-sm btn-secondary" type="button" onclick="resetDragOrder(${pIdx}); saveState(); updateProgress();">Reset Order</button>
        </div>
      </div>
    `;
    } else {
      problemSubtype = "drag-sort";
      const categories = norm.categories || [];
      const items = norm.items || [];
      content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(norm.label)}</p>
        ${renderFamilyTip(familyTipKey)}
        ${
          norm.hints?.length
            ? `<div class="family-hint-box">${norm.hints.map((h) => `<p>💡 ${esc(h)}</p>`).join("")}</div>`
            : ""
        }
        <div class="drag-sort-workspace" id="dragsort_${pIdx}">
          <div class="drag-columns">
            ${categories
              .map(
                (cat) => `
              <div class="drag-column" data-category-id="${esc(cat.id)}" ondragover="allowDrop(event)" ondrop="handleDrop(event, ${pIdx}, '${escAttr(cat.id)}')">
                <div class="drag-column-header">${esc(cat.label)}</div>
                <div class="drag-column-slots" id="slots_${pIdx}_${esc(cat.id)}" ondragover="allowDrop(event)" ondrop="handleDrop(event, ${pIdx}, '${escAttr(cat.id)}')"></div>
              </div>`,
              )
              .join("")}
          </div>
          <div class="drag-source-section">
            <div class="drag-source-header">Items to sort — drag cards, tap card then column, or use the dropdown on phones:</div>
            <div class="drag-source-pile" id="pile_${pIdx}" ondragover="allowDrop(event)" ondrop="handleDrop(event, ${pIdx}, '')">
              ${items
                .map(
                  (item, itemIdx) => `
                <div class="drag-card"
                     draggable="true"
                     id="card_${pIdx}_${itemIdx}"
                     data-item-index="${itemIdx}"
                     data-correct-category="${esc(item.category)}"
                     ondragstart="handleDragStart(event)"
                     ondragend="handleDragEnd(event)">
                  <span class="drag-handle" aria-hidden="true">☰</span>
                  <span class="card-text">${esc(item.text)}</span>
                  <select class="mobile-cat-select" onchange="mobileMoveCard(this, 'card_${pIdx}_${itemIdx}', ${pIdx}); saveState(); updateProgress();">
                    <option value="">-- Move to --</option>
                    ${categories.map((cat) => `<option value="${esc(cat.id)}">${esc(cat.label)}</option>`).join("")}
                    <option value="">Unsorted Pile</option>
                  </select>
                </div>`,
                )
                .join("")}
            </div>
          </div>
        </div>
        <div class="drag-controls">
          <button class="btn btn-sm btn-secondary" type="button" onclick="resetDragSort(${pIdx}); saveState(); updateProgress();">Reset Sorting</button>
        </div>
      </div>
    `;
    }
  } else if (type === "fill-table") {
    const label = it.label || it.instructions || "Complete the table.";

    let headers = [];
    let rowsData = [];

    if (Array.isArray(it.headers) && Array.isArray(it.rows) && Array.isArray(it.rows[0])) {
      // Shape B: 2D array + editableCells
      headers = it.headers;
      const editableMap = new Map();
      if (Array.isArray(it.editableCells)) {
        for (const ec of it.editableCells) {
          editableMap.set(`${ec.row}-${ec.col}`, ec.answer);
        }
      }
      rowsData = it.rows.map((row, rIdx) => {
        return row.map((cell, cIdx) => {
          const key = `${rIdx}-${cIdx}`;
          if (editableMap.has(key)) {
            return { isEditable: true, correctValue: String(editableMap.get(key)), val: "" };
          }
          return { isEditable: false, val: String(cell ?? "") };
        });
      });
    } else if (Array.isArray(it.columns) && Array.isArray(it.rows)) {
      // Shape A: rows of objects
      headers = it.columns;
      const keys = headerKeysFor(it.columns, it.rows[0] || {});
      rowsData = it.rows.map((rowObj) => {
        return keys.map((key) => {
          if (key === "answer") {
            return { isEditable: true, correctValue: String(rowObj["answer"] ?? ""), val: "" };
          }
          return { isEditable: false, val: String(rowObj[key] ?? "") };
        });
      });
    }

    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(label)}</p>
        ${renderFamilyTip("fill-table")}
        <div class="table-responsive">
          <table class="fill-table">
            <thead>
              <tr>
                ${headers.map((h) => `<th>${esc(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rowsData
                .map(
                  (row, rIdx) => `
                <tr>
                  ${row
                    .map((cell, cIdx) => {
                      if (cell.isEditable) {
                        return `
                        <td>
                          <div class="table-input-wrapper">
                            <input type="text" 
                                   class="custom-input table-input" 
                                   name="q_${pIdx}_table_${rIdx}_${cIdx}"
                                   data-correct="${esc(cell.correctValue)}" 
                                   placeholder="Type answer..." 
                                   oninput="saveState(); updateProgress();">
                            <span class="feedback-badge"></span>
                          </div>
                        </td>
                      `;
                      } else {
                        return `<td>${esc(cell.val)}</td>`;
                      }
                    })
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (type === "error-analysis") {
    // Canonical schema (see ERROR_ANALYSIS_SCHEMA in generate-worksheets.mjs):
    // errorStep (0-based) + correctWork + optional explanation (the "why").
    const title = it.title || "Analyze the worked steps";
    const workedExample = it.workedExample || [];
    const errorStep = it.errorStep !== undefined ? it.errorStep : 0;
    const correctWork = it.correctWork || "";
    const explanation = it.explanation || "";

    content = `
      <div class="problem-body">
        <h3 class="error-analysis-title">⚠️ ${esc(title)}</h3>
        <p class="problem-stem">Review the steps below. Identify which step contains the error, and explain why.</p>
        ${renderFamilyTip("error-analysis")}
        
        <div class="clipboard-box">
          <div class="clipboard-top"></div>
          <div class="clipboard-paper">
            ${workedExample
              .map(
                (step, sIdx) => `
              <div class="worked-step" id="step_q_${pIdx}_${sIdx + 1}">
                <span class="step-badge">Step ${sIdx + 1} / Paso ${sIdx + 1}</span>
                <span class="step-label">${esc(step.label)}:</span>
                <span class="step-work">${esc(step.work)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        
        <div class="error-controls">
          <div class="error-select-row">
            <label for="error_step_select_${pIdx}">Which step has the error?</label>
            <select id="error_step_select_${pIdx}" class="custom-select error-step-select" data-correct="${errorStep + 1}" onchange="saveState(); updateProgress();">
              <option value="">-- Choose Step --</option>
              ${workedExample.map((_, sIdx) => `<option value="${sIdx + 1}">Step ${sIdx + 1}</option>`).join("")}
            </select>
            <span class="feedback-badge"></span>
          </div>
          
          <div class="error-explain-row">
            <label for="error_explain_input_${pIdx}">Explain the error and write the correct calculation:</label>
            <textarea id="error_explain_input_${pIdx}" class="custom-textarea error-explain-textarea" placeholder="Describe what went wrong and write the correct steps..." oninput="saveState(); updateProgress();"></textarea>
            <span class="feedback-badge"></span>
          </div>
          
          <div class="reveal-box" id="error_correct_work_${pIdx}" style="display:none;">
            <strong>Correct Work Reference:</strong> ${esc(correctWork)}
            ${explanation ? `<br /><strong>Why:</strong> ${esc(explanation)}` : ""}
          </div>
        </div>
      </div>
    `;
  } else if (type === "open-response") {
    const prompt = it.prompt || "";
    const sentenceFrame = it.sentenceFrame || "";
    const keywords = it.keywords || [];
    const minLength = it.minLength || 15;

    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(prompt)}</p>
        ${renderFamilyTip("open-response")}
        
        ${
          sentenceFrame
            ? `
          <div class="sentence-frame-card">
            <span class="sentence-frame-tag">💡 Sentence Starter:</span>
            <span class="sentence-frame-text" onclick="insertSentenceStarter(${pIdx}, '${esc(sentenceFrame).replace(/'/g, "\\'")}')">"${esc(sentenceFrame)}"</span>
            <span class="click-to-insert-hint">(Click to insert starter)</span>
          </div>
        `
            : ""
        }
        
        <div class="open-response-wrapper">
          <textarea id="open_response_${pIdx}" 
                    class="custom-textarea open-response-textarea" 
                    data-min-length="${minLength}" 
                    data-keywords="${esc(JSON.stringify(keywords))}"
                    placeholder="Write your mathematical explanation here..." 
                    oninput="saveState(); updateProgress();"></textarea>
          <span class="feedback-badge"></span>
        </div>
        
        ${
          keywords.length > 0
            ? `
          <div class="word-bank-container">
            <div class="word-bank-label">Key Vocabulary to include (click to insert):</div>
            <div class="word-bank-chips">
              ${keywords.map((kw) => `<span class="word-chip" onclick="insertWord(${pIdx}, '${esc(kw).replace(/'/g, "\\'")}')">${esc(kw)}</span>`).join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  const displayType = problemSubtype || type;
  const computational = [
    "multiple-choice",
    "fill-table",
    "error-analysis",
    "open-response",
  ].includes(type);
  const scaffold = renderStepGuide(topic) + (computational ? renderWorkspace(topic, pIdx) : "");
  return `
    <section class="problem-section card" id="problem_${pIdx}" data-problem-type="${type}"${problemSubtype ? ` data-problem-subtype="${problemSubtype}"` : ""}>
      <div class="problem-header-row">
        <div class="problem-number-badge">${esc(opts.badge || "Quick Check")} ${opts.num || pIdx + 1}</div>
        <div class="problem-type-badge">${esc(displayType.replace(/-/g, " ").toUpperCase())}</div>
      </div>
      <div class="problem-hint-row">${renderProblemHintButton(it, TOPIC_VISUAL[topic] || SVG_GRID)}</div>
      ${content}
      ${scaffold}
      <div class="problem-check-row">
        <button type="button" class="btn btn-primary btn-check-one" onclick="checkProblem(${pIdx})" aria-label="Check answer for problem ${pIdx + 1}">
          ✓ Check This Problem / Revisar
        </button>
        <div class="problem-check-result" id="problem_result_${pIdx}" role="status" aria-live="polite" aria-atomic="true"></div>
      </div>
    </section>
  `;
}

function lessonModelCandidates(config) {
  const candidates = [];
  const add = (value) => {
    if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === "object" && typeof value.kind === "string") {
      candidates.push(value);
    }
  };

  // Match the lesson flow: practice is the most actionable family model,
  // followed by explore/connect and finally the launch visual.
  add(config.practice?.diagram);
  add(config.explore?.diagram);
  add(config.connect?.diagram);
  add(config.launch?.visual);
  return candidates;
}

function selectLessonInteractiveModel(config) {
  for (const candidate of lessonModelCandidates(config)) {
    const html = interactiveVisualHost(candidate, {
      ariaLabel: `Interactive ${candidate.title || config.title || "lesson model"}`,
      fallback: "Turn on JavaScript to use the interactive lesson model.",
    });
    if (html) {
      return {
        kind: candidate.kind,
        title: candidate.title || config.title || "Interactive Lesson Model",
        html,
      };
    }
  }
  return null;
}

function generateHtml(lessonId, config) {
  const title = config.title || "Lesson Practice";
  const vocab = config.vocabulary || [];

  // Two-tier Quick Check: easy "warm-up" problems first to practice the concept,
  // then a harder "level up" set — clearly sectioned. Indices stay contiguous so
  // per-problem checking/scoring keeps working across all sections.
  const { warmup, challenge } = selectTieredQuickCheckProblems(config.practice || {}, config);
  const coreSelected = [...warmup, ...challenge];
  const moreSelected = selectMorePracticeProblems(config.practice || {}, config, coreSelected);
  const topic = detectVisualTopic(config);
  const lessonModel = selectLessonInteractiveModel(config);

  const welcomeHtml = renderWelcomeBanner(config, lessonId);
  const quickCheckIntroHtml = renderQuickCheckIntro();
  const warmupHtml = warmup
    .map((p, idx) =>
      renderProblem(p, idx, topic, { badge: "Warm-up / Calentamiento", num: idx + 1 }),
    )
    .join("\n");
  const challengeHtml = challenge
    .map((p, idx) =>
      renderProblem(p, warmup.length + idx, topic, { badge: "Level up / Reto", num: idx + 1 }),
    )
    .join("\n");
  const morePracticeHtml = moreSelected
    .map((p, idx) =>
      renderProblem(p, coreSelected.length + idx, topic, { badge: "Bonus / Más", num: idx + 1 }),
    )
    .join("\n");

  const tabPanels = [
    renderLearnTab(config, renderVisualMathLab(topic, config, lessonModel)),
    renderArcadeTabPanel(lessonId),
    renderWordsTab(vocab, resolveVocabImage, vocabImageAlt),
    renderTogetherTab(config),
    renderCheckTab(quickCheckIntroHtml, warmupHtml, challengeHtml, morePracticeHtml),
    renderWorkbenchTab(),
    renderHelpTab(config),
    renderMoreTab(config, lessonId),
    renderPlayTabPanel(config),
    renderDoneTab(),
  ].join("\n");

  const tabsHtml = renderHomeworkTabs(tabPanels);
  const helpModalHtml = renderHelpModal();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Help Your Student — Lesson ${lessonId}: ${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Hanken+Grotesk:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
${EDITORIAL_FONT_IMPORT}
:root {
  --navy: #12355b;
  --navy-light: #18466f;
  --teal: #1fa6a2;
--teal-ink: #0c6f6b;
  --teal-light: #dff2ee;
  --amber: #f2c15b;
  --amber-light: #fef7e0;
  --cream: #f7f4ec;
  --coral: #d9795d;
  --coral-light: #fce6de;
  --white: #ffffff;
  --bg: var(--cream);
  --card: #ffffff;
  --ink: #21313f;
  --muted: #5f6f80;
  --line: #d7e2ed;
  
  --success: #0f7c4a;
  --success-bg: #e6f7ef;
  --error: #b64e2f;
  --error-bg: #fef0ec;
  --hint: #875f00;
  --hint-bg: #fef7e0;
  
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  
  --font-display: "Outfit", system-ui, sans-serif;
  --font-body: "Hanken Grotesk", Calibri, "Segoe UI", system-ui, sans-serif;
  
  --shadow: 0 8px 30px rgba(18, 53, 91, 0.05);
  --shadow-sm: 0 4px 12px rgba(18, 53, 91, 0.02);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.5;
  padding-bottom: calc(var(--hw-status-height, 104px) + var(--hw-tab-height, 72px) + 16px);
}

a { color: var(--navy); text-decoration: none; font-weight: 700; }
a:hover { text-decoration: underline; }

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Header Styles */
header.homework-header {
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  color: var(--white);
  padding: 32px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

header.homework-header::after {
  content: "";
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(31, 166, 162, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--amber);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}

.back-link:hover {
  color: var(--white);
  text-decoration: none;
}

.header-meta {
  font-family: var(--font-display);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--teal-light);
  font-weight: 800;
  margin: 0 0 6px 0;
}

header.homework-header h1 {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.objectives-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.objective-row {
  margin-bottom: 8px;
  font-size: 14.5px;
}
.objective-row:last-child { margin-bottom: 0; }
.objective-badge {
  background: var(--amber);
  color: var(--navy);
  font-weight: 800;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  text-transform: uppercase;
  margin-right: 6px;
  display: inline-block;
}

/* Cards & Generic Layout */
.card {
  background: var(--card);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.section-title {
  font-family: var(--font-display);
  color: var(--navy);
  font-size: 20px;
  margin: 0 0 16px 0;
}

/* Family guide */
.family-guide {
  background: linear-gradient(180deg, #fffdf8 0%, var(--white) 100%);
  border-color: #ead9b8;
}

.family-guide-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.family-guide-emoji {
  font-size: 34px;
  line-height: 1;
  flex-shrink: 0;
}

.family-guide-title {
  margin-bottom: 4px;
}

.family-guide-sub {
  margin: 0;
  color: var(--muted);
  font-size: 14.5px;
}

.family-guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.family-panel {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
}

.family-panel-heading {
  margin: 0 0 8px 0;
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--navy);
}

.family-tip-list {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  color: var(--ink);
}

.family-tip-list li {
  margin-bottom: 6px;
}

.family-try-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--navy);
}

.family-print-note {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.try-at-home {
  background: linear-gradient(180deg, var(--teal-light) 0%, var(--white) 100%);
  border-color: #b8ddd8;
}

.try-narrative {
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--navy);
  font-weight: 600;
}

.try-challenge {
  margin: 0;
  padding: 12px 14px;
  background: var(--amber-light);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--amber);
  font-size: 14px;
  color: var(--ink);
}

.family-problem-tip {
  margin: -8px 0 14px 0;
  padding: 10px 12px;
  background: var(--amber-light);
  border-left: 3px solid var(--amber);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  color: var(--hint);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.family-problem-tip .lang-es {
  color: var(--muted);
  font-size: 13px;
}

.family-hint-box {
  margin-bottom: 14px;
  padding: 10px 12px;
  background: var(--teal-light);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  color: var(--navy);
}

.family-hint-box p {
  margin: 0 0 6px 0;
}

.family-hint-box p:last-child {
  margin-bottom: 0;
}

/* Vocabulary Flashcards */
.vocab-family-note {
  margin: -6px 0 14px 0;
  font-size: 14px;
  color: var(--muted);
}
.vocab-container {
  display: flex;
  justify-content: center;
  justify-content: safe center;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--teal) transparent;
}

.vocab-container::-webkit-scrollbar {
  height: 6px;
}
.vocab-container::-webkit-scrollbar-thumb {
  background: var(--teal);
  border-radius: 3px;
}

.vocab-card {
  flex: 0 0 260px;
  height: 210px;
  perspective: 1000px;
  cursor: pointer;
}

.vocab-thumb-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.vocab-thumb {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 10px;
  background: var(--cream);
  border: 1px solid var(--line);
  padding: 4px;
}

.vocab-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.vocab-card.flipped .vocab-card-inner {
  transform: rotateY(180deg);
}

.vocab-card-front, .vocab-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
}

.vocab-card-front {
  background: var(--white);
  color: var(--navy);
}

.vocab-card-front h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
}

.vocab-es {
  color: var(--muted);
  font-style: italic;
  font-size: 13px;
  margin: 2px 0 0 0;
}

.vocab-visual-hint {
  font-size: 12px;
  background: var(--teal-light);
  padding: 6px;
  border-radius: var(--radius-sm);
  margin-top: 10px;
  text-align: left;
  border-left: 3px solid var(--teal);
}

.flip-prompt {
  font-size: 11px;
  font-weight: 700;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: auto;
}

.vocab-card-back {
  background: var(--navy);
  color: var(--white);
  transform: rotateY(180deg);
  justify-content: center;
  align-items: center;
}

.vocab-def {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0;
}

.vocab-def-es {
  font-size: 12px;
  color: var(--amber);
  margin: 6px 0 0 0;
  font-style: italic;
}

.vocab-back-visual {
  margin: 10px 0 0 0;
  font-size: 12px;
  color: var(--teal-light);
  line-height: 1.35;
}

/* Practice Problem Cards */
.problem-section {
  position: relative;
}

.problem-check-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 2px solid var(--teal-light);
}

.btn-check-one {
  align-self: flex-start;
  min-height: 44px;
  font-size: 14px;
}

.problem-check-result {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--cream);
  color: var(--muted);
  min-height: 0;
}

.problem-check-result:empty {
  display: none;
}

.problem-check-result.is-correct {
  background: var(--success-bg);
  border-color: var(--success);
  color: var(--success);
}

.problem-check-result.is-incorrect {
  background: var(--error-bg);
  border-color: var(--error);
  color: var(--error);
}

.problem-check-result.is-hint {
  background: var(--hint-bg);
  border-color: var(--amber);
  color: var(--hint);
}

.problem-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--teal-light);
  padding-bottom: 12px;
  margin-bottom: 18px;
}

.problem-number-badge {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--navy);
  font-size: 18px;
}

.problem-type-badge {
  font-family: var(--font-display);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--teal);
  background: var(--teal-light);
  padding: 4px 10px;
  border-radius: 99px;
}

.problem-stem {
  font-size: 16px;
  font-weight: 700;
  color: var(--navy);
  margin: 0 0 18px 0;
  line-height: 1.45;
}

/* ---- Family scaffolding: step guide, visual model, show-your-work ---- */
.hw-step-guide {
  margin: 14px 0;
  border: 1.5px solid var(--teal);
  border-radius: 12px;
  background: var(--teal-light);
  overflow: hidden;
}
.hw-step-guide > summary {
  cursor: pointer;
  list-style: none;
  padding: 11px 16px;
  font-family: "Outfit", sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: var(--navy);
  background: rgba(31, 166, 162, 0.16);
}
.hw-step-guide > summary::-webkit-details-marker { display: none; }
.hw-step-guide > summary::after { content: " ▾"; color: var(--teal); }
.hw-step-guide[open] > summary::after { content: " ▴"; }
.hw-steps {
  margin: 0;
  padding: 12px 18px 14px 34px;
  display: grid;
  gap: 9px;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--navy);
}
.hw-steps li { padding-left: 4px; }
.hw-steps strong { color: var(--navy); }

.hw-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  margin: 14px 0 4px;
}
@media (min-width: 640px) {
  .hw-workspace { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; }
}
.hw-visual-caption, .hw-work-label {
  display: block;
  font-family: "Outfit", sans-serif;
  font-weight: 700;
  font-size: 13.5px;
  color: var(--navy);
  margin-bottom: 6px;
}
.hw-visual-frame {
  border: 1.5px dashed #9bb6cf;
  border-radius: 12px;
  background: #fbfdff;
  padding: 8px;
  text-align: center;
}
.hw-visual-svg { width: 100%; height: auto; max-height: 180px; }
/* Drawable model area: students draw directly on the grid (mouse/touch/stylus). */
.hw-visual-frame.hw-drawable { position: relative; }
.hw-draw-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  touch-action: none; cursor: crosshair; border-radius: 12px;
}
.hw-draw-clear {
  position: absolute; top: 6px; right: 6px; z-index: 2;
  font-family: var(--font-display); font-size: 12px; font-weight: 700;
  background: #ffffff; color: var(--navy);
  border: 1px solid var(--line); border-radius: 8px; padding: 3px 9px; cursor: pointer;
}
.hw-draw-clear:hover { border-color: var(--teal); }
@media print { .hw-draw-clear { display: none; } }

/* Interactive tap-to-graph widgets (number line, coordinate plane, grid) */
.hw-visual-frame.hw-interactive { position: relative; }
.hw-interactive .hw-visual-svg { touch-action: manipulation; -webkit-user-select: none; user-select: none; }
.hw-interactive .ng-hit { cursor: pointer; fill: transparent; }
.hw-interactive .ng-tick-lbl, .hw-interactive .ng-axis-lbl { font-family: "Outfit", sans-serif; font-size: 11px; font-weight: 700; fill: var(--navy); }
.hw-interactive .ng-point { fill: var(--teal); stroke: var(--navy); stroke-width: 2; cursor: pointer; }
.hw-interactive .ng-point.is-open { fill: #ffffff; }
.hw-interactive .ng-ray { stroke: var(--teal); stroke-width: 5; stroke-linecap: round; }
.hw-interactive .ng-plot { fill: var(--teal); stroke: var(--navy); stroke-width: 1.5; cursor: pointer; }
.hw-interactive .ng-plot-lbl { font-family: "Outfit", sans-serif; font-size: 10px; font-weight: 700; fill: var(--navy); }
.hw-interactive .ng-cell { fill: transparent; cursor: pointer; }
.hw-interactive .ng-cell.is-on { fill: rgba(31,166,162,0.45); }
.hw-graph-controls { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 8px; }
.hw-graph-controls:empty { display: none; }
.hw-graph-controls button {
  font-family: var(--font-display); font-size: 12.5px; font-weight: 700;
  background: #ffffff; color: var(--navy);
  border: 1.5px solid var(--line); border-radius: 8px; padding: 6px 11px; min-height: 36px; cursor: pointer;
}
.hw-graph-controls button:hover { border-color: var(--teal); }
.hw-graph-controls button[aria-pressed="true"] { background: var(--teal-ink); color: #ffffff; border-color: var(--teal-ink); }
.hw-graph-reset {
  position: absolute; top: 6px; right: 6px; z-index: 2;
  font-family: var(--font-display); font-size: 12px; font-weight: 700;
  background: #ffffff; color: var(--navy);
  border: 1px solid var(--line); border-radius: 8px; padding: 3px 9px; cursor: pointer;
}
.hw-graph-reset:hover { border-color: var(--teal); }
.hw-graph-readout {
  margin-top: 8px; font-family: "Outfit", sans-serif; font-weight: 800;
  font-size: 14px; color: var(--navy); min-height: 18px;
}
.hw-graph-readout:empty { display: none; }
@media print { .hw-graph-reset, .hw-graph-controls { display: none; } }
.hw-work-input {
  width: 100%;
  min-height: 96px;
  resize: vertical;
  line-height: 28px;
  background-color: #fbfdff;
  background-image: repeating-linear-gradient(#fbfdff 0, #fbfdff 27px, #d6e2ee 27px, #d6e2ee 28px);
  font-family: inherit;
}

@media print {
  .hw-step-guide { break-inside: avoid; border-color: #888; background: #fff; }
  .hw-step-guide > summary { background: #f0f0f0; }
  .hw-step-guide[open] > summary::after, .hw-step-guide > summary::after { content: ""; }
  .hw-workspace { break-inside: avoid; }
  .hw-work-input { min-height: 130px; border: 1px solid #888; }
  .hw-visual-frame { border-color: #888; }
}

/* Custom styled inputs, checkboxes, and select dropdowns */
.custom-input {
  width: 100%;
  font-family: inherit;
  font-size: 14.5px;
  padding: 10px 14px;
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--ink);
  outline: none;
  transition: all 0.2s ease-in-out;
}

.custom-input:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 4px var(--teal-light);
}

.custom-textarea {
  width: 100%;
  height: 110px;
  font-family: inherit;
  font-size: 14.5px;
  padding: 12px;
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--ink);
  outline: none;
  resize: vertical;
  transition: all 0.2s ease-in-out;
}

.custom-textarea:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 4px var(--teal-light);
}

.custom-select {
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 12px;
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--ink);
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 150px;
}

.custom-select:focus {
  border-color: var(--teal);
}

/* Multiple Choice Custom Radios */
.mc-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mc-option-label {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
  position: relative;
}

.mc-option-label:hover {
  background: var(--cream);
  border-color: var(--teal);
}

.mc-option-label input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--line);
  border-radius: 50%;
  display: inline-block;
  position: relative;
  flex-shrink: 0;
  transition: all 0.15s;
}

.mc-option-label input[type="radio"]:checked ~ .custom-radio {
  border-color: var(--teal);
  background: var(--teal);
}

.mc-option-label input[type="radio"]:checked ~ .custom-radio::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--white);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.choice-text {
  flex: 1;
}

/* Matching Rows */
.matching-pairs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.matching-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  gap: 16px;
}

.matching-term {
  font-weight: 700;
  color: var(--navy);
  flex: 1;
}

.matching-select-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Drag Sort Layout */
.drag-sort-workspace {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drag-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.drag-column {
  background: var(--cream);
  border: 2px dashed var(--line);
  border-radius: var(--radius-md);
  padding: 14px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
}

.drag-column-header {
  font-family: var(--font-display);
  font-weight: 800;
  text-align: center;
  color: var(--navy);
  margin-bottom: 12px;
  font-size: 14px;
  text-transform: uppercase;
}

.drag-column-slots {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
}

.drag-source-section {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 16px;
}

.drag-source-header {
  font-weight: 700;
  font-size: 13.5px;
  color: var(--muted);
  margin-bottom: 12px;
}

.drag-source-pile {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
  align-items: center;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: var(--cream);
}

.drag-card {
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  cursor: grab;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
}

.drag-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.drag-card.dragging {
  opacity: 0.55;
}

.drag-column.over,
.drag-source-pile.over {
  border-color: var(--teal);
  background: var(--teal-light);
}

/* Drag order (sequencing) */
.drag-order-workspace {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px;
}

.drag-order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drag-order-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  cursor: grab;
  user-select: none;
}

.drag-order-row.dragging {
  opacity: 0.55;
}

.drag-order-handle {
  color: var(--muted);
  font-size: 12px;
}

.drag-order-num {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--teal);
  color: var(--white);
  border-radius: 50%;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 12px;
}

.drag-order-text {
  flex: 1;
  font-weight: 600;
  font-size: 14.5px;
}

.drag-order-controls {
  display: flex;
  gap: 4px;
}

.order-move-btn {
  min-width: 0;
  padding: 4px 10px;
}

.drag-order-row.is-correct {
  border-color: var(--success);
  background: var(--success-bg);
}

.drag-order-row.is-incorrect {
  border-color: var(--error);
  background: var(--error-bg);
}

.drag-handle {
  color: var(--muted);
  font-size: 12px;
}

.mobile-cat-select {
  display: none;
  font-family: inherit;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid var(--line);
  outline: none;
}

@media (max-width: 600px) {
  .mobile-cat-select {
    display: block;
    margin-left: 6px;
  }
}

/* Fill Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
}

.fill-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--white);
}

.fill-table th, .fill-table td {
  padding: 12px 16px;
  border: 1px solid var(--line);
  text-align: left;
  font-size: 14.5px;
}

.fill-table th {
  background: var(--navy);
  color: var(--white);
  font-family: var(--font-display);
  font-weight: 600;
}

.fill-table tr:nth-child(even) td {
  background: var(--cream);
}

.table-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-input {
  max-width: 180px;
  padding: 6px 10px;
}

/* Error Analysis clipboard */
.clipboard-box {
  margin-top: 14px;
  margin-bottom: 18px;
  background: #f1f4f8;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--line);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.clipboard-top {
  height: 24px;
  background: var(--navy-light);
  position: relative;
}

.clipboard-top::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 12px;
  background: #e2e8f0;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  border: 1px solid var(--line);
  border-bottom: 0;
}

.clipboard-paper {
  background: #fcfdfd;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-image: linear-gradient(#e5ecf4 1px, transparent 1px);
  background-size: 100% 28px;
  line-height: 28px;
}

.worked-step {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.worked-step.highlighted {
  background-color: var(--amber-light);
}

.step-badge {
  background: var(--navy);
  color: var(--white);
  font-size: 10.5px;
  font-family: var(--font-display);
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  line-height: 1;
}

.step-label {
  font-weight: 700;
  color: var(--navy);
}

.step-work {
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.error-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--cream);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-top: 16px;
}

.error-select-row, .error-explain-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-select-row label, .error-explain-row label {
  font-weight: 700;
  font-size: 13.5px;
  color: var(--navy);
}

/* Open Response Starter Sentence Cards */
.sentence-frame-card {
  background: var(--amber-light);
  border: 1px dashed var(--amber);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.sentence-frame-tag {
  font-weight: 700;
  color: var(--hint);
}

.sentence-frame-text {
  font-style: italic;
  font-weight: 700;
  color: var(--navy);
  cursor: pointer;
  text-decoration: underline dotted var(--navy);
}

.sentence-frame-text:hover {
  color: var(--teal);
  text-decoration: underline dotted var(--teal);
}

.click-to-insert-hint {
  font-size: 11px;
  color: var(--muted);
}

.open-response-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.word-bank-container {
  margin-top: 12px;
}

.word-bank-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
  margin-bottom: 6px;
}

.word-bank-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.word-chip {
  background: var(--teal-light);
  color: var(--teal);
  border: 1.5px solid var(--teal);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.word-chip:hover {
  background: var(--teal-ink);
  color: var(--white);
}

/* Feedback Marks & Explanations */
.feedback-badge {
  font-size: 16px;
  font-weight: 800;
  margin-left: 6px;
  width: 20px;
  text-align: center;
  display: inline-block;
}

.feedback-badge.success-check::after {
  content: "✓";
  color: var(--success);
}

.feedback-badge.error-cross::after {
  content: "✕";
  color: var(--error);
}

.problem-section.correct {
  border-color: var(--success);
  background-image: linear-gradient(rgba(15, 124, 74, 0.02), rgba(15, 124, 74, 0.02));
}

.problem-section.incorrect {
  border-color: var(--error);
  background-image: linear-gradient(rgba(182, 78, 47, 0.02), rgba(182, 78, 47, 0.02));
}

.explanation-box {
  margin-top: 14px;
  background: var(--success-bg);
  border: 1px solid var(--success);
  color: var(--success);
  border-left: 4px solid var(--success);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
}

/* Inputs colored states */
.custom-input.is-correct, .custom-select.is-correct, .custom-textarea.is-correct {
  border-color: var(--success) !important;
  background-color: var(--success-bg) !important;
}

.custom-input.is-incorrect, .custom-select.is-incorrect, .custom-textarea.is-incorrect {
  border-color: var(--error) !important;
  background-color: var(--error-bg) !important;
}

.mc-option-label.is-correct {
  border-color: var(--success) !important;
  background-color: var(--success-bg) !important;
}

.mc-option-label.is-incorrect {
  border-color: var(--error) !important;
  background-color: var(--error-bg) !important;
}

.drag-card.is-correct {
  border-color: var(--success) !important;
  background-color: var(--success-bg) !important;
}

.drag-card.is-incorrect {
  border-color: var(--error) !important;
  background-color: var(--error-bg) !important;
}

/* Reveal box references */
.reveal-box {
  background: var(--success-bg);
  border: 1px dashed var(--success);
  color: var(--success);
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  margin-top: 10px;
}

/* Sticky Bottom Bar */
.bottom-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1.5px solid var(--line);
  padding: 16px 24px;
  z-index: 1000;
  box-shadow: 0 -10px 30px rgba(18, 53, 91, 0.08);
}

.status-bar-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.sound-toggle-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sound-toggle-btn:hover {
  background-color: var(--teal-light);
}

.score-progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 150px;
}

.score-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14.5px;
  color: var(--navy);
  display: flex;
  justify-content: space-between;
}

.score-text span {
  font-weight: 600;
  color: var(--muted);
}

.progress-bar-outer {
  height: 10px;
  background: var(--cream);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--line);
}

.progress-bar-inner {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--teal), var(--navy));
  border-radius: 5px;
  transition: width 0.4s ease-in-out;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14.5px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--teal-ink);
  color: var(--white);
}

.btn .lang-en,
.btn .lang-es {
  color: inherit;
}

.btn-primary:hover {
  background: var(--navy);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--white);
  color: var(--navy);
  border: 2px solid var(--line);
}

.btn-secondary:hover {
  background: var(--cream);
  border-color: var(--navy);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12.5px;
}

@media (max-width: 550px) {
  .bottom-status-bar {
    padding: 12px;
  }
  .status-bar-wrapper {
    gap: 10px;
  }
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
  .action-buttons button {
    flex: 1;
    min-height: 44px;
    justify-content: center;
  }
}
${GUIDED_NOTES_CSS}
${VISUAL_LABS_CSS}

/* ============================================================
   Polish layer — premium, TpT-quality finish (loads last).
   Refines shared content surfaces without changing structure.
   ============================================================ */
body { font-size: 15px; line-height: 1.58; }
.container { max-width: 840px; padding: 28px 18px 40px; }

/* Section headings get a clear accent + stronger hierarchy */
.section-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--line);
}
.section-title::before {
  content: "";
  width: 5px;
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--teal), var(--navy));
  flex: 0 0 auto;
}

/* Cards: softer, layered, consistent */
.card {
  border-radius: var(--radius-lg);
  padding: 26px 28px;
  border: 1px solid var(--line);
  box-shadow: 0 1px 2px rgba(18,53,91,.05), 0 14px 34px -22px rgba(18,53,91,.5);
}

/* Guided "worked steps" become clean carded rows with a left accent */
.worked-step {
  align-items: flex-start;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fbfdff;
  margin-bottom: 10px;
}
.worked-step.highlighted {
  background: var(--amber-light);
  border-color: var(--amber);
  box-shadow: 0 8px 22px -14px rgba(242,193,91,.9);
}
.step-badge {
  font-size: 10px;
  letter-spacing: .04em;
  padding: 4px 9px;
  border-radius: 999px;
  align-self: center;
}
.step-label { font-size: 15px; }

/* Bilingual text: clearer separation, muted secondary language */
.lang-es { color: var(--muted); }
.worked-step .lang-es, .lang-en + .lang-es { display: block; margin-top: 3px; }

/* "Watch for this" / tip callouts: crisp, friendly */
.watch-for-list, .watch-for {
  background: var(--hint-bg);
  border: 1px solid #f0d9a0;
  border-left: 4px solid var(--amber);
  border-radius: 12px;
  padding: 14px 16px;
}

/* Vocab flip cards: a touch more depth + polish */
.vocab-card-inner, .vocab-card-front, .vocab-card-back {
  border-radius: var(--radius-md);
}
.vocab-card-front, .vocab-card-back {
  box-shadow: 0 1px 2px rgba(18,53,91,.05), 0 16px 30px -20px rgba(18,53,91,.5);
  border: 1px solid var(--line);
}

/* Family guide block: warmer, cleaner */
.family-guide {
  border-radius: var(--radius-lg);
  border: 1px solid #ead9b8;
  box-shadow: 0 1px 2px rgba(18,53,91,.04), 0 16px 36px -24px rgba(180,140,60,.6);
}

@media print {
  .worked-step { break-inside: avoid; box-shadow: none; }
  .card { box-shadow: none; }
}
${EDITORIAL_OVERRIDES}
</style>
  <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css?v=20260714-v2">
  <!-- nsr-injected:end -->
  <!-- mobile-access-injected:begin (shared mobile a11y — tools/inject-mobile-access.js) -->
  <link rel="stylesheet" href="/assets/mobile-access.css">
  <!-- mobile-access-injected:end -->

  <!-- enthead-injected:begin (enterprise head/meta — tools/inject-enterprise-head.js) -->
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <meta name="theme-color" content="#12355b">
  <link rel="canonical" href="https://eduwonderlab.com/lessons/${esc(lessonId)}/homework.html">
  <meta name="description" content="Neft Teacher Grade 6 Reveal Math resource — Help Your Student — Lesson ${esc(lessonId)}: ${esc(title)}.">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Neft Teacher">
  <meta property="og:title" content="Help Your Student — Lesson ${esc(lessonId)}: ${esc(title)}">
  <meta property="og:description" content="Neft Teacher Grade 6 Reveal Math resource — Help Your Student — Lesson ${esc(lessonId)}: ${esc(title)}.">
  <meta property="og:url" content="https://eduwonderlab.com/lessons/${esc(lessonId)}/homework.html">
  <meta property="og:image" content="https://eduwonderlab.com/assets/og-curriculum.png">
  <!-- enthead-injected:end -->
</head>
<body>

<script>
/* Unified teacher-mode bootstrap. Reads the site-wide sticky key
   (localStorage nt-teacher-mode, same key as engine/core/teacher-mode.js,
   assets/curriculum-enhancements.js and shared/projects/answer-key-gate.js)
   and flips on body.teacher-mode so teacher-only content (e.g. the practice
   answer reveals) becomes visible. Fail-closed: without this class the
   answers stay display:none for students. ?student=1 / ?teacher=0 force
   student view so a teacher can hand a device back. */
(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get("student") === "1" || params.get("teacher") === "0") return;
    var v = (localStorage.getItem("nt-teacher-mode") || "").toLowerCase();
    if (v === "1" || v === "true" || v === "on" || v === "yes") {
      document.body.classList.add("teacher-mode");
    }
  } catch (e) {}
})();
</script>

<div class="container" role="main">

  ${welcomeHtml}

  ${tabsHtml}

</div>

${helpModalHtml}

<!-- Sticky bottom actions bar -->
<div class="bottom-status-bar">
  <div class="status-bar-wrapper">
    <button class="sound-toggle-btn" id="sound_toggle" onclick="toggleSound()" title="Toggle Sound Effects">🔊</button>
    
    <div class="score-progress-container">
      <div class="score-text">
        Progress / Progreso: <span id="progress_text">0 / ${coreSelected.length} Completed</span>
      </div>
      <div class="progress-bar-outer">
        <div class="progress-bar-inner" id="progress_bar"></div>
      </div>
    </div>
    
    <div class="action-buttons">
      <button class="btn btn-secondary" onclick="resetWorksheet()">Reset / Reiniciar</button>
      <button class="btn btn-primary" onclick="checkWorksheet()">Check All / Revisar todo</button>
    </div>
  </div>
</div>

<script>
window.LESSON_ID = "${escAttr(lessonId)}";
window.LESSON_TITLE = "${escAttr(title)}";
${HOMEWORK_TABS_JS}
${HOMEWORK_GAME_JS}
${VISUAL_LABS_JS}
// Sound engine
let soundEnabled = true;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("sound_toggle");
  btn.textContent = soundEnabled ? "🔊" : "🔇";
  btn.title = soundEnabled ? "Mute Sound Effects" : "Unmute Sound Effects";
}

function playSuccessArpeggio() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 major chord
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.35);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playFailureSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const freqs = [180, 140]; // Two low warning blips
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now + i * 0.12);
      
      gain.gain.setValueAtTime(0.08, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Drag & Drop engine
function allowDrop(ev) {
  ev.preventDefault();
  const zone = ev.currentTarget;
  if (zone && zone.classList) {
    zone.classList.add("over");
  }
}

function handleDragStart(ev) {
  const card = ev.currentTarget.closest(".drag-card");
  if (!card) return;
  ev.dataTransfer.setData("text/plain", card.id);
  ev.dataTransfer.effectAllowed = "move";
  card.classList.add("dragging");
}

function handleDragEnd(ev) {
  const el = ev.currentTarget;
  if (el) el.classList.remove("dragging");
  clearDragOver();
}

function clearDragOver() {
  document.querySelectorAll(".drag-column.over, .drag-source-pile.over, .drag-column-slots.over")
    .forEach((el) => el.classList.remove("over"));
}

function handleDrop(ev, probIdx, categoryId) {
  ev.preventDefault();
  clearDragOver();
  const cardId = ev.dataTransfer.getData("text/plain") || ev.dataTransfer.getData("text");
  const card = document.getElementById(cardId);
  if (!card) return;

  document.querySelectorAll(".drag-card.dragging").forEach((el) => el.classList.remove("dragging"));

  const prefix = "card_" + probIdx + "_";
  if (!card.id.startsWith(prefix)) return;

  let targetContainer;
  if (categoryId) {
    targetContainer = document.getElementById("slots_" + probIdx + "_" + categoryId);
  } else {
    targetContainer = document.getElementById("pile_" + probIdx);
  }

  if (targetContainer) {
    targetContainer.appendChild(card);
    const select = card.querySelector(".mobile-cat-select");
    if (select) select.value = categoryId || "";
    saveState();
    updateProgress();
  }
}

function handleOrderDragStart(ev) {
  const row = ev.currentTarget.closest(".drag-order-row");
  if (!row) return;
  ev.dataTransfer.setData("text/plain", row.id);
  ev.dataTransfer.effectAllowed = "move";
  row.classList.add("dragging");
}

function handleOrderDrop(ev, probIdx) {
  ev.preventDefault();
  const list = document.getElementById("orderlist_" + probIdx);
  const rowId = ev.dataTransfer.getData("text/plain") || ev.dataTransfer.getData("text");
  const row = document.getElementById(rowId);
  if (!list || !row || !row.id.startsWith("order_" + probIdx + "_")) return;
  document.querySelectorAll(".drag-order-row.dragging").forEach((el) => el.classList.remove("dragging"));

  const afterEl = getOrderInsertBefore(list, ev.clientY);
  if (afterEl) {
    list.insertBefore(row, afterEl);
  } else {
    list.appendChild(row);
  }
  renumberOrderRows(probIdx);
  saveState();
  updateProgress();
}

function getOrderInsertBefore(list, clientY) {
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  for (const child of rows) {
    const box = child.getBoundingClientRect();
    if (clientY < box.top + box.height / 2) return child;
  }
  return null;
}

function moveOrderRowByEl(probIdx, btn, direction) {
  const row = btn.closest(".drag-order-row");
  const list = document.getElementById("orderlist_" + probIdx);
  if (!row || !list) return;
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  const rowIdx = rows.indexOf(row);
  const nextIdx = rowIdx + direction;
  if (nextIdx < 0 || nextIdx >= rows.length) return;
  const neighbor = rows[nextIdx];
  if (direction < 0) {
    list.insertBefore(row, neighbor);
  } else {
    list.insertBefore(neighbor, row.nextSibling);
  }
  renumberOrderRows(probIdx);
  saveState();
  updateProgress();
}

function renumberOrderRows(probIdx) {
  const list = document.getElementById("orderlist_" + probIdx);
  if (!list) return;
  list.querySelectorAll(".drag-order-row").forEach((row, idx) => {
    const num = row.querySelector(".drag-order-num");
    if (num) num.textContent = String(idx + 1);
  });
}

function restoreOrderList(probIdx, order) {
  const list = document.getElementById("orderlist_" + probIdx);
  if (!list || !Array.isArray(order)) return;
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  const byText = new Map(rows.map((row) => [row.dataset.stepText, row]));
  list.innerHTML = "";
  order.forEach((text) => {
    const row = byText.get(text);
    if (row) {
      list.appendChild(row);
      row.classList.remove("is-correct", "is-incorrect");
    }
  });
  rows.forEach((row) => {
    if (!list.contains(row)) list.appendChild(row);
  });
  renumberOrderRows(probIdx);
}

function resetDragOrder(probIdx) {
  const workspace = document.getElementById("dragorder_" + probIdx);
  if (!workspace) return;
  let initial = [];
  try {
    initial = JSON.parse(workspace.dataset.initialOrder || "[]");
  } catch (e) {
    initial = [];
  }
  if (!initial.length) {
    shuffleOrderRows(probIdx);
  } else {
    restoreOrderList(probIdx, initial);
  }
  const pCard = document.getElementById("problem_" + probIdx);
  if (pCard) pCard.classList.remove("correct", "incorrect");
}

function shuffleOrderRows(probIdx) {
  const list = document.getElementById("orderlist_" + probIdx);
  if (!list) return;
  const rows = Array.from(list.querySelectorAll(".drag-order-row"));
  if (rows.length < 2) return;
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  list.innerHTML = "";
  rows.forEach((row) => list.appendChild(row));
  if (rows.every((row, idx) => row.dataset.stepText === JSON.parse(document.getElementById("dragorder_" + probIdx).dataset.correctOrder || "[]")[idx])) {
    const last = rows.pop();
    rows.unshift(last);
    list.innerHTML = "";
    rows.forEach((row) => list.appendChild(row));
  }
  renumberOrderRows(probIdx);
}

function mobileMoveCard(select, cardId, probIdx) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const categoryId = select.value;
  let targetContainer;
  if (categoryId) {
    targetContainer = document.getElementById("slots_" + probIdx + "_" + categoryId);
  } else {
    targetContainer = document.getElementById("pile_" + probIdx);
  }
  if (targetContainer) {
    targetContainer.appendChild(card);
  }
}

function resetDragSort(probIdx) {
  const pile = document.getElementById("pile_" + probIdx);
  const slots = document.querySelectorAll("[id^='slots_" + probIdx + "_']");
  slots.forEach(slot => {
    const cards = Array.from(slot.children);
    cards.forEach(card => {
      pile.appendChild(card);
      const select = card.querySelector(".mobile-cat-select");
      if (select) select.value = "";
    });
  });
  
  // Clean all validation classes on items of this problem
  const allCards = pile.querySelectorAll(".drag-card");
  allCards.forEach(card => {
    card.classList.remove("is-correct", "is-incorrect");
  });
  
  const pCard = document.getElementById("problem_" + probIdx);
  if (pCard) pCard.classList.remove("correct", "incorrect");
}

// Open Response Word chip inserters
function insertWord(probIdx, word) {
  const textarea = document.getElementById("open_response_" + probIdx);
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const before = text.substring(0, start);
  const after = text.substring(end, text.length);
  
  // Insert word with trailing space
  textarea.value = before + (start > 0 && text[start - 1] !== " " ? " " : "") + word + " " + after;
  textarea.focus();
  
  // Move cursor after the inserted word
  const newPos = start + (start > 0 && text[start - 1] !== " " ? 1 : 0) + word.length + 1;
  textarea.setSelectionRange(newPos, newPos);
  
  saveState();
  updateProgress();
}

function insertSentenceStarter(probIdx, starter) {
  const textarea = document.getElementById("open_response_" + probIdx);
  if (!textarea) return;
  if (textarea.value.trim() === "") {
    textarea.value = starter + " ";
  } else {
    // Append at end if not empty
    textarea.value = textarea.value.trim() + " " + starter + " ";
  }
  textarea.focus();
  const len = textarea.value.length;
  textarea.setSelectionRange(len, len);
  saveState();
  updateProgress();
}

// State Persistence (localStorage)
const STORAGE_KEY = "hw_state_lesson_" + ${JSON.stringify(lessonId)};

function saveState() {
  const state = {
    inputs: {},
    dragPositions: {},
    orderPositions: {}
  };
  
  // Save text inputs, select dropdowns, textareas, and radios
  const inputs = document.querySelectorAll(".custom-input, .custom-select, .custom-textarea, input[type='radio']:checked");
  inputs.forEach(input => {
    if (input.type === "radio") {
      state.inputs[input.name] = input.value;
    } else {
      state.inputs[input.name || input.id] = input.value;
    }
  });
  
  // Save drag-sort item locations
  const dragCards = document.querySelectorAll(".drag-card");
  dragCards.forEach(card => {
    const parentContainer = card.parentElement;
    if (parentContainer) {
      state.dragPositions[card.id] = parentContainer.id;
    }
  });

  document.querySelectorAll(".drag-order-list").forEach((list) => {
    const probIdx = list.id.replace("orderlist_", "");
    state.orderPositions[probIdx] = Array.from(list.querySelectorAll(".drag-order-row")).map((row) => row.dataset.stepText);
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    
    // Restore text inputs, selects, textareas
    if (state.inputs) {
      for (const [id, val] of Object.entries(state.inputs)) {
        const input = document.getElementById(id) || document.querySelector("[name='" + id + "']");
        if (input) {
          if (input.type === "radio") {
            const rad = document.querySelector("input[name='" + id + "'][value='" + val + "']");
            if (rad) rad.checked = true;
          } else {
            input.value = val;
          }
        }
      }
    }
    
    // Restore drag card positions
    if (state.dragPositions) {
      for (const [cardId, parentId] of Object.entries(state.dragPositions)) {
        const card = document.getElementById(cardId);
        const parent = document.getElementById(parentId);
        if (card && parent) {
          parent.appendChild(card);
          const select = card.querySelector(".mobile-cat-select");
          if (select) {
            const parts = parentId.split("_");
            if (parts.length >= 3 && parts[0] === "slots") {
              select.value = parts.slice(2).join("_");
            } else {
              select.value = "";
            }
          }
        }
      }
    }

    if (state.orderPositions) {
      for (const [probIdx, order] of Object.entries(state.orderPositions)) {
        const list = document.getElementById("orderlist_" + probIdx);
        if (!list || !Array.isArray(order)) continue;
        const rows = Array.from(list.querySelectorAll(".drag-order-row"));
        const byText = new Map(rows.map((row) => [row.dataset.stepText, row]));
        list.innerHTML = "";
        order.forEach((text) => {
          const row = byText.get(text);
          if (row) list.appendChild(row);
        });
        rows.forEach((row) => {
          if (!list.contains(row)) list.appendChild(row);
        });
        renumberOrderRows(probIdx);
      }
    }
  } catch (e) {
    console.error("Error restoring state:", e);
  }
}

// Math normalization for scoring text entries
function normalizeMath(val) {
  return String(val || "")
    .toLowerCase()
    .trim()
    .replace(/\\s+/g, "")          // remove all whitespace
    .replace(/\\*/g, "×")          // asterisk to multiplication
    .replace(/x/g, "×")          // letter x to multiplication
    .replace(/\\^2/g, "²")
    .replace(/\\^3/g, "³")
    .replace(/\\^4/g, "⁴")
    .replace(/\\^5/g, "⁵")
    .replace(/\\^6/g, "⁶");
}

function updateProgress() {
  const problems = Array.from(document.querySelectorAll(".problem-section"))
    .filter((s) => !s.closest(".more-practice"));
  let completedCount = 0;

  problems.forEach((section, idx) => {
    const type = section.dataset.problemType;
    let hasValue = false;
    
    if (type === "multiple-choice") {
      const selected = section.querySelector("input[type='radio']:checked");
      if (selected) hasValue = true;
    } else if (type === "matching-game") {
      const selects = Array.from(section.querySelectorAll(".matching-select"));
      const answered = selects.filter(s => s.value !== "");
      if (answered.length > 0) hasValue = true;
    } else if (type === "drag-sort") {
      if (section.dataset.problemSubtype === "drag-order") {
        hasValue = true;
      } else {
        const itemsInColumns = Array.from(section.querySelectorAll(".drag-column-slots .drag-card"));
        if (itemsInColumns.length > 0) hasValue = true;
      }
    } else if (type === "fill-table") {
      const inputs = Array.from(section.querySelectorAll(".table-input"));
      const filled = inputs.filter(i => i.value.trim() !== "");
      if (filled.length > 0) hasValue = true;
    } else if (type === "error-analysis") {
      const sel = section.querySelector(".error-step-select");
      const txt = section.querySelector(".error-explain-textarea");
      if ((sel && sel.value !== "") || (txt && txt.value.trim() !== "")) hasValue = true;
    } else if (type === "open-response") {
      const txt = section.querySelector(".open-response-textarea");
      if (txt && txt.value.trim() !== "") hasValue = true;
    }
    
    if (hasValue) completedCount++;
  });
  
  const total = problems.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;
  document.getElementById("progress_bar").style.width = pct + "%";
  document.getElementById("progress_text").textContent = completedCount + " / " + total + " Completed";
}

function setProblemCheckResult(idx, isCorrect, message, tone) {
  const resultEl = document.getElementById("problem_result_" + idx);
  if (!resultEl) return;
  resultEl.textContent = message || "";
  resultEl.className = "problem-check-result";
  if (message) {
    resultEl.classList.add(tone || (isCorrect ? "is-correct" : "is-incorrect"));
  }
}

function playCheckSound(isCorrect) {
  if (isCorrect) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  } else {
    playFailureSound();
  }
}

function checkProblem(idx, options) {
  const silent = options && options.silent;
  const section = document.getElementById("problem_" + idx);
  if (!section) return { correct: false, message: "" };

  const type = section.dataset.problemType;
  let isProblemCorrect = true;
  let feedbackMessage = "";

  section.classList.remove("correct", "incorrect");
  const explanationBoxes = section.querySelectorAll(".explanation-box");
  explanationBoxes.forEach((b) => b.remove());

  if (type === "multiple-choice") {
      const container = section.querySelector(".mc-options");
      const selected = container.querySelector("input[type='radio']:checked");
      const correctIdx = container.dataset.correct;
      const explanation = container.dataset.explanation;
      
      // Reset radio option styles
      const labels = container.querySelectorAll(".mc-option-label");
      labels.forEach(l => l.classList.remove("is-correct", "is-incorrect"));
      
      if (!selected) {
        isProblemCorrect = false;
      } else {
        const val = selected.value;
        if (val === correctIdx) {
          // Highlight selected label as correct
          const correctLabel = document.getElementById("label_q_" + idx + "_" + val);
          if (correctLabel) correctLabel.classList.add("is-correct");
        } else {
          isProblemCorrect = false;
          // Highlight selected label as incorrect
          const incorrectLabel = document.getElementById("label_q_" + idx + "_" + val);
          if (incorrectLabel) incorrectLabel.classList.add("is-incorrect");
          // Highlight correct label as correct
          const correctLabel = document.getElementById("label_q_" + idx + "_" + correctIdx);
          if (correctLabel) correctLabel.classList.add("is-correct");
        }
      }
      
      // Append explanation if checked
      if (selected && explanation) {
        const expDiv = document.createElement("div");
        expDiv.className = "explanation-box";
        expDiv.innerHTML = "<strong>Concept Check:</strong> " + explanation;
        container.appendChild(expDiv);
      }
      
    } else if (type === "matching-game") {
      const rows = section.querySelectorAll(".matching-row");
      
      rows.forEach(row => {
        const select = row.querySelector(".matching-select");
        const correct = row.dataset.correct;
        const feedbackBadge = row.querySelector(".feedback-badge");
        
        select.classList.remove("is-correct", "is-incorrect");
        feedbackBadge.className = "feedback-badge";
        
        if (select.value === "") {
          isProblemCorrect = false;
          select.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        } else if (select.value === correct) {
          select.classList.add("is-correct");
          feedbackBadge.classList.add("success-check");
        } else {
          isProblemCorrect = false;
          select.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        }
      });
      
    } else if (type === "drag-sort") {
      if (section.dataset.problemSubtype === "drag-order") {
        const workspace = section.querySelector(".drag-order-workspace");
        const list = section.querySelector(".drag-order-list");
        let correct = [];
        try {
          correct = JSON.parse(workspace?.dataset.correctOrder || "[]");
        } catch (e) {
          correct = [];
        }
        const rows = Array.from(list?.querySelectorAll(".drag-order-row") || []);
        rows.forEach((row, i) => {
          row.classList.remove("is-correct", "is-incorrect");
          if (row.dataset.stepText === correct[i]) {
            row.classList.add("is-correct");
          } else {
            isProblemCorrect = false;
            row.classList.add("is-incorrect");
          }
        });
      } else {
        const dragCards = section.querySelectorAll(".drag-card");

        dragCards.forEach(card => {
          card.classList.remove("is-correct", "is-incorrect");
          const correctCat = card.dataset.correctCategory;
          const parentCol = card.parentElement;

          const column = card.closest(".drag-column");
          if (column) {
            const actualCat = column.dataset.categoryId;
            if (actualCat === correctCat) {
              card.classList.add("is-correct");
            } else {
              isProblemCorrect = false;
              card.classList.add("is-incorrect");
            }
          } else {
            isProblemCorrect = false;
            card.classList.add("is-incorrect");
          }
        });
      }

    } else if (type === "fill-table") {
      const inputs = section.querySelectorAll(".table-input");
      
      inputs.forEach(input => {
        input.classList.remove("is-correct", "is-incorrect");
        const wrapper = input.parentElement;
        const feedbackBadge = wrapper.querySelector(".feedback-badge");
        feedbackBadge.className = "feedback-badge";
        
        const correctVal = input.dataset.correct;
        const studentVal = input.value;
        
        if (studentVal.trim() === "") {
          isProblemCorrect = false;
          input.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        } else if (normalizeMath(studentVal) === normalizeMath(correctVal)) {
          input.classList.add("is-correct");
          feedbackBadge.classList.add("success-check");
        } else {
          isProblemCorrect = false;
          input.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        }
      });
      
    } else if (type === "error-analysis") {
      const select = section.querySelector(".error-step-select");
      const textarea = section.querySelector(".error-explain-textarea");
      const revealBox = section.querySelector(".reveal-box");
      
      // Clean select and textarea validation states
      select.classList.remove("is-correct", "is-incorrect");
      textarea.classList.remove("is-correct", "is-incorrect");
      
      const selectBadge = select.parentElement.querySelector(".feedback-badge");
      const textareaBadge = textarea.parentElement.querySelector(".feedback-badge");
      selectBadge.className = "feedback-badge";
      textareaBadge.className = "feedback-badge";
      
      const correctStep = select.dataset.correct;
      
      // Highlight worked steps inside paper clipboard based on selection
      const workedSteps = section.querySelectorAll(".worked-step");
      workedSteps.forEach(s => s.classList.remove("highlighted"));
      
      if (select.value !== "") {
        const stepElement = document.getElementById("step_q_" + idx + "_" + select.value);
        if (stepElement) stepElement.classList.add("highlighted");
      }
      
      // Check step selection
      if (select.value === correctStep) {
        select.classList.add("is-correct");
        selectBadge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        select.classList.add("is-incorrect");
        selectBadge.classList.add("error-cross");
      }
      
      // Check written explanation
      if (textarea.value.trim().length >= 15) {
        textarea.classList.add("is-correct");
        textareaBadge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        textarea.classList.add("is-incorrect");
        textareaBadge.classList.add("error-cross");
      }
      
      // Show correct work reference for reinforcement
      if (revealBox) {
        revealBox.style.display = "block";
      }
      
    } else if (type === "open-response") {
      const textarea = section.querySelector(".open-response-textarea");
      textarea.classList.remove("is-correct", "is-incorrect");
      const badge = textarea.parentElement.querySelector(".feedback-badge");
      badge.className = "feedback-badge";
      
      const minLen = parseInt(textarea.dataset.minLength) || 15;
      const text = textarea.value.trim();
      
      let keywordsList = [];
      try {
        keywordsList = JSON.parse(textarea.dataset.keywords || "[]");
      } catch (e) {}
      
      // Validate length and keywords
      const hasLength = text.length >= minLen;
      const matchedKeywords = keywordsList.filter(kw => text.toLowerCase().includes(kw.toLowerCase()));
      
      // If keywords list exists, require at least one keyword for green-check self-grading
      const hasKeywords = keywordsList.length === 0 || matchedKeywords.length > 0;
      
      if (hasLength && hasKeywords) {
        textarea.classList.add("is-correct");
        badge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        textarea.classList.add("is-incorrect");
        badge.classList.add("error-cross");
        
        // Add helpful dynamic guidance if they failed checking
        let msg = "Write a bit more explanation to explain your reasoning.";
        if (keywordsList.length > 0 && matchedKeywords.length === 0) {
          msg = "Try adding key vocabulary terms like: " + keywordsList.slice(0, 3).join(", ") + " to strengthen your response.";
        }
        
        const expDiv = document.createElement("div");
        expDiv.className = "explanation-box";
        expDiv.style.backgroundColor = "var(--error-bg)";
        expDiv.style.borderColor = "var(--error)";
        expDiv.style.color = "var(--error)";
        expDiv.innerHTML = "<strong>Hint:</strong> " + msg;
        textarea.parentElement.parentElement.appendChild(expDiv);
        feedbackMessage = msg;
      }
    }

  // Build per-problem feedback message
  if (!feedbackMessage) {
    if (type === "multiple-choice") {
      const container = section.querySelector(".mc-options");
      const explanation = container?.dataset.explanation || "";
      if (isProblemCorrect) {
        feedbackMessage = explanation
          ? "Correct! " + explanation
          : "Correct! Nice work on this one.";
      } else if (!section.querySelector("input[type='radio']:checked")) {
        feedbackMessage = "Choose an answer, then check again.";
      } else {
        feedbackMessage = explanation
          ? "Not quite — the correct choice is highlighted. " + explanation
          : "Not quite — the correct choice is highlighted in green.";
      }
    } else if (type === "matching-game") {
      const rows = section.querySelectorAll(".matching-row");
      const right = Array.from(rows).filter((row) => {
        const sel = row.querySelector(".matching-select");
        return sel && sel.value === row.dataset.correct;
      }).length;
      feedbackMessage = isProblemCorrect
        ? "All " + rows.length + " matches are correct!"
        : right + " of " + rows.length + " matches correct. Fix the red dropdowns and check again.";
    } else if (type === "drag-sort") {
      if (section.dataset.problemSubtype === "drag-order") {
        const rows = section.querySelectorAll(".drag-order-row");
        const right = Array.from(rows).filter((r) => r.classList.contains("is-correct")).length;
        feedbackMessage = isProblemCorrect
          ? "Perfect order! Every step is in the right sequence."
          : right + " of " + rows.length + " steps in the right spot. Use ▲ ▼ to rearrange.";
      } else {
        const cards = section.querySelectorAll(".drag-card");
        const right = Array.from(cards).filter((c) => c.classList.contains("is-correct")).length;
        feedbackMessage = isProblemCorrect
          ? "Every card is sorted into the correct column!"
          : right + " of " + cards.length + " cards in the right place. Move the highlighted cards.";
      }
    } else if (type === "fill-table") {
      const inputs = section.querySelectorAll(".table-input");
      const right = Array.from(inputs).filter((i) => i.classList.contains("is-correct")).length;
      feedbackMessage = isProblemCorrect
        ? "Table complete — all answers look good!"
        : right + " of " + inputs.length + " cells correct. Check the red boxes.";
    } else if (type === "error-analysis") {
      feedbackMessage = isProblemCorrect
        ? "Great detective work! You found the error and explained it."
        : "Check the step you selected and write a fuller explanation (at least 15 characters).";
    } else if (type === "open-response") {
      feedbackMessage = isProblemCorrect
        ? "Strong explanation! You included enough detail and vocabulary."
        : feedbackMessage || "Add more detail or key vocabulary, then check again.";
    }
  }

  if (isProblemCorrect) {
    section.classList.add("correct");
  } else {
    section.classList.add("incorrect");
  }

  setProblemCheckResult(idx, isProblemCorrect, feedbackMessage);

  if (!silent) {
    playCheckSound(isProblemCorrect);
    updateScoreSummary();
  }

  return { correct: isProblemCorrect, message: feedbackMessage };
}

function updateScoreSummary() {
  const problems = Array.from(document.querySelectorAll(".problem-section"))
    .filter((s) => !s.closest(".more-practice"));
  const checked = problems.filter((s) => s.classList.contains("correct") || s.classList.contains("incorrect"));
  const correctCount = problems.filter((s) => s.classList.contains("correct")).length;
  const total = problems.length;
  if (checked.length > 0) {
    document.getElementById("progress_text").textContent = "Score: " + correctCount + " / " + total + " Correct";
    document.getElementById("progress_bar").style.width = (correctCount / total * 100) + "%";
  } else {
    updateProgress();
  }
}

function checkWorksheet() {
  const problems = Array.from(document.querySelectorAll(".problem-section"));
  let correctCount = 0;

  problems.forEach((section) => {
    const idx = parseInt((section.id || "").replace("problem_", ""), 10);
    if (Number.isNaN(idx)) return;
    const result = checkProblem(idx, { silent: true });
    // Only core (non-optional) problems count toward the worksheet score.
    if (result.correct && !section.closest(".more-practice")) correctCount++;
  });

  const total = problems.filter((s) => !s.closest(".more-practice")).length;
  document.getElementById("progress_text").textContent = "Score: " + correctCount + " / " + total + " Correct";
  document.getElementById("progress_bar").style.width = (correctCount / total * 100) + "%";

  if (correctCount === total) {
    playSuccessArpeggio();
  } else {
    playFailureSound();
  }
}

function resetWorksheet() {
  if (confirm("Are you sure you want to reset all your work?")) {
    localStorage.removeItem(STORAGE_KEY);
    
    // Clear normal text inputs, textareas, dropdowns, and radios
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach(t => {
      t.value = "";
      t.classList.remove("is-correct", "is-incorrect");
    });
    
    const inputs = document.querySelectorAll("input[type='text']");
    inputs.forEach(i => {
      i.value = "";
      i.classList.remove("is-correct", "is-incorrect");
    });
    
    const selects = document.querySelectorAll("select:not(.mobile-cat-select)");
    selects.forEach(s => {
      s.value = "";
      s.classList.remove("is-correct", "is-incorrect");
    });
    
    const radios = document.querySelectorAll("input[type='radio']");
    radios.forEach(r => r.checked = false);
    
    const labels = document.querySelectorAll(".mc-option-label");
    labels.forEach(l => l.classList.remove("is-correct", "is-incorrect"));
    
    // Clear feedback badges and sections
    const badges = document.querySelectorAll(".feedback-badge");
    badges.forEach(b => b.className = "feedback-badge");
    
    const sections = document.querySelectorAll(".problem-section");
    document.querySelectorAll(".problem-check-result").forEach((el) => {
      el.textContent = "";
      el.className = "problem-check-result";
    });

    sections.forEach(s => {
      s.classList.remove("correct", "incorrect");
      const expBoxes = s.querySelectorAll(".explanation-box");
      expBoxes.forEach(b => b.remove());
      
      const workedSteps = s.querySelectorAll(".worked-step");
      workedSteps.forEach(ws => ws.classList.remove("highlighted"));
      
      const reveal = s.querySelector(".reveal-box");
      if (reveal) reveal.style.display = "none";
      
      const type = s.dataset.problemType;
      if (type === "drag-sort") {
        const parts = s.id.split("_");
        const idx = parts[1];
        if (s.dataset.problemSubtype === "drag-order") {
          resetDragOrder(idx);
          shuffleOrderRows(idx);
        } else {
          resetDragSort(idx);
        }
      }
    });
    
    // Save blank state
    saveState();
    updateProgress();
    
    // Play a reset click sound
    if (soundEnabled) {
      try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    }
  }
}

// ---- Interactive tap-to-graph widgets (number line / coordinate plane / grid) ----
// Progressive enhancement: hydrates the static .hw-visual-svg fallbacks into
// structured manipulatives. State persists via the hidden [data-graph-state] input,
// which rides the existing saveState()/loadState() pipeline.
var NeftGraph = (function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) { for (var k in attrs) e.setAttribute(k, attrs[k]); }
    return e;
  }
  function bi(en, es) {
    return '<span class="lang-en">' + en + '</span><span class="lang-es" lang="es">' + es + '</span>';
  }
  function readState(frame) {
    var inp = frame.querySelector("[data-graph-state]");
    if (!inp || !inp.value) return null;
    try { return JSON.parse(inp.value); } catch (e) { return null; }
  }
  function writeState(frame, state) {
    var inp = frame.querySelector("[data-graph-state]");
    if (inp) inp.value = state ? JSON.stringify(state) : "";
    if (typeof saveState === "function") saveState();
  }
  function setReadout(frame, html) {
    var r = frame.querySelector("[data-graph-readout]");
    if (r) r.innerHTML = html || "";
  }
  function makeBtn(html, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.innerHTML = html;
    b.addEventListener("click", onClick);
    return b;
  }

  // ----- Number line: tap a tick to set the boundary, toggle open/closed, shade a ray -----
  function initNumberLine(frame) {
    var MIN = -5, MAX = 5, x0 = 24, x1 = 320, y = 46;
    var stepX = (x1 - x0) / (MAX - MIN);
    var state = readState(frame) || { v: null, closed: true, dir: null };
    var oldSvg = frame.querySelector(".hw-visual-svg");
    var svg = el("svg", { viewBox: "0 0 344 96", "class": "hw-visual-svg", role: "img", "aria-label": "Interactive number line" });
    var rayLayer = el("g"), pointLayer = el("g");
    svg.appendChild(el("line", { x1: 14, y1: y, x2: 330, y2: y, stroke: "#12355b", "stroke-width": 2 }));
    svg.appendChild(el("polygon", { points: "330," + y + " 320," + (y - 5) + " 320," + (y + 5), fill: "#12355b" }));
    svg.appendChild(el("polygon", { points: "14," + y + " 24," + (y - 5) + " 24," + (y + 5), fill: "#12355b" }));
    function xFor(v) { return x0 + (v - MIN) * stepX; }
    for (var v = MIN; v <= MAX; v++) {
      var x = xFor(v);
      svg.appendChild(el("line", { x1: x, y1: y - 6, x2: x, y2: y + 6, stroke: "#12355b", "stroke-width": 1.5 }));
      var lbl = el("text", { x: x, y: y + 22, "text-anchor": "middle", "class": "ng-tick-lbl" });
      lbl.textContent = String(v);
      svg.appendChild(lbl);
      (function (val, cx) {
        var hit = el("rect", { x: cx - stepX / 2, y: 6, width: stepX, height: 60, "class": "ng-hit" });
        hit.addEventListener("click", function () { state.v = val; render(); });
        svg.appendChild(hit);
      })(v, x);
    }
    svg.appendChild(rayLayer);
    svg.appendChild(pointLayer);
    oldSvg.parentNode.replaceChild(svg, oldSvg);

    var controls = frame.querySelector("[data-graph-controls]");
    controls.innerHTML = "";
    var bCircle = makeBtn("", function () { state.closed = !state.closed; render(); });
    var bLeft = makeBtn(bi("◀ Shade left", "◀ Sombrear izq."), function () { state.dir = state.dir === "left" ? null : "left"; render(); });
    var bRight = makeBtn(bi("Shade right ▶", "Sombrear der. ▶"), function () { state.dir = state.dir === "right" ? null : "right"; render(); });
    controls.appendChild(bCircle); controls.appendChild(bLeft); controls.appendChild(bRight);

    function render() {
      while (rayLayer.firstChild) rayLayer.removeChild(rayLayer.firstChild);
      while (pointLayer.firstChild) pointLayer.removeChild(pointLayer.firstChild);
      bCircle.innerHTML = state.closed ? bi("● Closed", "● Cerrado") : bi("○ Open", "○ Abierto");
      bLeft.setAttribute("aria-pressed", state.dir === "left" ? "true" : "false");
      bRight.setAttribute("aria-pressed", state.dir === "right" ? "true" : "false");
      if (state.v != null) {
        var px = xFor(state.v);
        if (state.dir === "left") rayLayer.appendChild(el("line", { x1: 14, y1: y, x2: px, y2: y, "class": "ng-ray" }));
        if (state.dir === "right") rayLayer.appendChild(el("line", { x1: px, y1: y, x2: 330, y2: y, "class": "ng-ray" }));
        var pt = el("circle", { cx: px, cy: y, r: 7, "class": "ng-point" + (state.closed ? "" : " is-open") });
        pt.addEventListener("click", function () { state.closed = !state.closed; render(); });
        pointLayer.appendChild(pt);
      }
      if (state.v == null) {
        setReadout(frame, "");
      } else if (!state.dir) {
        setReadout(frame, bi("Point at " + state.v, "Punto en " + state.v));
      } else {
        var op = state.dir === "right" ? (state.closed ? "≥" : ">") : (state.closed ? "≤" : "<");
        setReadout(frame, bi("Your graph: x " + op + " " + state.v, "Tu gráfica: x " + op + " " + state.v));
      }
      writeState(frame, (state.v == null && state.dir == null) ? null : state);
    }
    frame.querySelector("[data-graph-reset]").addEventListener("click", function () {
      state = { v: null, closed: true, dir: null }; render();
    });
    render();
  }

  // ----- Coordinate plane: tap a lattice point to plot/remove an ordered pair -----
  function initCoordinatePlane(frame) {
    var MIN = -5, MAX = 5, O = 120, STEP = 20; // origin at (120,120); 5*20=100 -> 20..220
    var state = readState(frame) || { pts: [] };
    var oldSvg = frame.querySelector(".hw-visual-svg");
    var svg = el("svg", { viewBox: "0 0 240 240", "class": "hw-visual-svg", role: "img", "aria-label": "Interactive coordinate plane" });
    function sx(x) { return O + x * STEP; }
    function sy(yv) { return O - yv * STEP; }
    for (var i = MIN; i <= MAX; i++) {
      svg.appendChild(el("line", { x1: sx(i), y1: sy(MAX), x2: sx(i), y2: sy(MIN), stroke: "#d6e2ee", "stroke-width": 1 }));
      svg.appendChild(el("line", { x1: sx(MIN), y1: sy(i), x2: sx(MAX), y2: sy(i), stroke: "#d6e2ee", "stroke-width": 1 }));
    }
    svg.appendChild(el("line", { x1: O, y1: sy(MAX) - 6, x2: O, y2: sy(MIN) + 6, stroke: "#12355b", "stroke-width": 2 }));
    svg.appendChild(el("line", { x1: sx(MIN) - 6, y1: O, x2: sx(MAX) + 6, y2: O, stroke: "#12355b", "stroke-width": 2 }));
    var xlbl = el("text", { x: sx(MAX) + 2, y: O + 14, "class": "ng-axis-lbl" }); xlbl.textContent = "x"; svg.appendChild(xlbl);
    var ylbl = el("text", { x: O + 4, y: sy(MAX) + 2, "class": "ng-axis-lbl" }); ylbl.textContent = "y"; svg.appendChild(ylbl);
    var plotLayer = el("g");
    for (var gx = MIN; gx <= MAX; gx++) {
      for (var gy = MIN; gy <= MAX; gy++) {
        (function (px, py) {
          var hit = el("circle", { cx: sx(px), cy: sy(py), r: 9, "class": "ng-hit" });
          hit.addEventListener("click", function () { toggle(px, py); });
          svg.appendChild(hit);
        })(gx, gy);
      }
    }
    svg.appendChild(plotLayer);
    oldSvg.parentNode.replaceChild(svg, oldSvg);

    function toggle(x, y) {
      var idx = -1;
      for (var i = 0; i < state.pts.length; i++) { if (state.pts[i][0] === x && state.pts[i][1] === y) { idx = i; break; } }
      if (idx >= 0) state.pts.splice(idx, 1); else state.pts.push([x, y]);
      render();
    }
    function render() {
      while (plotLayer.firstChild) plotLayer.removeChild(plotLayer.firstChild);
      var parts = [];
      for (var i = 0; i < state.pts.length; i++) {
        var p = state.pts[i];
        plotLayer.appendChild(el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 4.5, "class": "ng-plot" }));
        var t = el("text", { x: sx(p[0]) + 6, y: sy(p[1]) - 5, "class": "ng-plot-lbl" });
        t.textContent = "(" + p[0] + ", " + p[1] + ")";
        plotLayer.appendChild(t);
        parts.push("(" + p[0] + ", " + p[1] + ")");
      }
      if (!parts.length) setReadout(frame, "");
      else setReadout(frame, bi("Points: " + parts.join("  "), "Puntos: " + parts.join("  ")));
      writeState(frame, state.pts.length ? state : null);
    }
    frame.querySelector("[data-graph-reset]").addEventListener("click", function () { state = { pts: [] }; render(); });
    render();
  }

  // ----- Grid: tap cells to shade a model / count square units -----
  function initGrid(frame) {
    var COLS = 12, ROWS = 6, CELL = 24, PAD = 6;
    var W = COLS * CELL + PAD * 2, H = ROWS * CELL + PAD * 2;
    var state = readState(frame) || { cells: [] };
    var on = {}; for (var i = 0; i < state.cells.length; i++) on[state.cells[i]] = true;
    var oldSvg = frame.querySelector(".hw-visual-svg");
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "hw-visual-svg", role: "img", "aria-label": "Interactive grid" });
    svg.appendChild(el("rect", { x: PAD, y: PAD, width: COLS * CELL, height: ROWS * CELL, fill: "#ffffff", stroke: "#12355b", "stroke-width": 1.5 }));
    var cellLayer = el("g");
    svg.appendChild(cellLayer);
    for (var c = 0; c <= COLS; c++) svg.appendChild(el("line", { x1: PAD + c * CELL, y1: PAD, x2: PAD + c * CELL, y2: PAD + ROWS * CELL, stroke: "#d6e2ee", "stroke-width": 1 }));
    for (var r = 0; r <= ROWS; r++) svg.appendChild(el("line", { x1: PAD, y1: PAD + r * CELL, x2: PAD + COLS * CELL, y2: PAD + r * CELL, stroke: "#d6e2ee", "stroke-width": 1 }));
    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        (function (row, col) {
          var key = row + "," + col;
          var rect = el("rect", { x: PAD + col * CELL, y: PAD + row * CELL, width: CELL, height: CELL, "class": "ng-cell" + (on[key] ? " is-on" : "") });
          rect.addEventListener("click", function () {
            if (on[key]) { delete on[key]; rect.setAttribute("class", "ng-cell"); }
            else { on[key] = true; rect.setAttribute("class", "ng-cell is-on"); }
            commit();
          });
          cellLayer.appendChild(rect);
        })(rr, cc);
      }
    }
    oldSvg.parentNode.replaceChild(svg, oldSvg);
    function commit() {
      var keys = Object.keys(on);
      if (!keys.length) setReadout(frame, "");
      else setReadout(frame, bi("Shaded: " + keys.length + " square units", "Sombreado: " + keys.length + " unidades cuadradas"));
      writeState(frame, keys.length ? { cells: keys } : null);
    }
    frame.querySelector("[data-graph-reset]").addEventListener("click", function () {
      on = {};
      var rects = cellLayer.querySelectorAll(".ng-cell");
      for (var i = 0; i < rects.length; i++) rects[i].setAttribute("class", "ng-cell");
      commit();
    });
    commit();
  }

  function initAll() {
    var frames = document.querySelectorAll(".hw-visual-frame.hw-interactive");
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (f.getAttribute("data-ng-ready")) continue;
      f.setAttribute("data-ng-ready", "1");
      var type = f.getAttribute("data-interactive");
      try {
        if (type === "number-line") initNumberLine(f);
        else if (type === "coordinate-plane") initCoordinatePlane(f);
        else if (type === "grid") initGrid(f);
      } catch (e) { /* fail safe: keep static fallback */ }
    }
  }
  return { initAll: initAll };
})();

// Initial configuration
window.onload = function() {
  const hadSavedState = !!localStorage.getItem(STORAGE_KEY);
  loadState();
  if (!hadSavedState) {
    document.querySelectorAll(".drag-order-workspace").forEach((workspace) => {
      const probIdx = workspace.id.replace("dragorder_", "");
      shuffleOrderRows(probIdx);
    });
  }
  updateProgress();
  NeftGraph.initAll();

  document.addEventListener("dragend", function() {
    document.querySelectorAll(".drag-card.dragging, .drag-order-row.dragging")
      .forEach((el) => el.classList.remove("dragging"));
    clearDragOver();
  });

  document.querySelectorAll(".drag-card").forEach((card) => {
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  // Tap-to-move fallback for touch devices
  let selectedDragCard = null;
  document.querySelectorAll(".drag-card").forEach((card) => {
    card.addEventListener("click", function(e) {
      if (e.target.tagName === "SELECT" || e.target.tagName === "OPTION") return;
      if (selectedDragCard === this) {
        this.style.borderColor = "var(--line)";
        selectedDragCard = null;
      } else {
        if (selectedDragCard) selectedDragCard.style.borderColor = "var(--line)";
        selectedDragCard = this;
        this.style.borderColor = "var(--teal)";
      }
    });
  });

  document.querySelectorAll(".drag-column, .drag-source-pile, .drag-column-slots").forEach((zone) => {
    zone.addEventListener("click", function() {
      if (!selectedDragCard) return;
      const probIdx = selectedDragCard.id.split("_")[1];
      if (!selectedDragCard.id.startsWith("card_" + probIdx + "_")) return;

      let targetContainer = null;
      let categoryId = "";
      if (this.classList.contains("drag-column")) {
        categoryId = this.dataset.categoryId || "";
        targetContainer = this.querySelector(".drag-column-slots");
      } else if (this.classList.contains("drag-column-slots")) {
        categoryId = this.id.split("_").slice(2).join("_");
        targetContainer = this;
      } else if (this.classList.contains("drag-source-pile")) {
        targetContainer = this;
      }

      if (targetContainer) {
        targetContainer.appendChild(selectedDragCard);
        const select = selectedDragCard.querySelector(".mobile-cat-select");
        if (select) select.value = categoryId;
        selectedDragCard.style.borderColor = "var(--line)";
        selectedDragCard = null;
        saveState();
        updateProgress();
      }
    });
  });

  document.querySelectorAll(".drag-order-list").forEach((list) => {
    const probIdx = list.id.replace("orderlist_", "");
    list.addEventListener("dragover", allowDrop);
    list.addEventListener("drop", (ev) => handleOrderDrop(ev, probIdx));
    list.querySelectorAll(".drag-order-row").forEach((row) => {
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
    });
  });
};
</script>
<script type="module" src="/assets/homework-lesson-models.js"></script>
<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js?v=20260714-v2" defer></script>
  <!-- nsr-injected:end -->
    <!-- canvas-bridge-injected:begin (Canvas grade bridge — tools/inject-canvas-bridge.js) -->
  <script src="/assets/canvas-bridge.js" defer></script>
  <!-- canvas-bridge-injected:end -->
<!-- mwb-injected:begin (Math Workbench launcher — tools/inject-math-workbench.js) -->
  <script src="/assets/math-workbench-launcher.js" defer></script>
  <!-- mwb-injected:end -->
</body>
</html>
`;
}

// Split an inline-bilingual label ("🔵 English / Español") into language spans so
// the existing language-mode toggle (body.lang-mode-es hides .lang-en, etc.) can
// show only the chosen language. A leading icon/symbol cluster is kept outside the
// spans so it stays visible in every mode. Text without a " / " separator is left
// untouched (nothing to split — e.g. content that has no Spanish counterpart).
function wrapBilingualLabel(raw) {
  if (!raw || !raw.includes(" / ")) return raw;
  const text = raw.trim();
  const iconMatch = text.match(/^([^\p{L}\p{N}]*)(.*)$/u);
  const icon = iconMatch[1] || "";
  const rest = iconMatch[2];
  const sep = rest.indexOf(" / ");
  if (sep === -1) return raw;
  const en = rest.slice(0, sep).trim();
  const es = rest.slice(sep + 3).trim();
  if (!en || !es) return raw;
  const iconHtml = icon ? `${icon.trim()} ` : "";
  return `${iconHtml}<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;
}

// Build-time pass over the assembled homework HTML. Each rule targets a stable
// class/handler so only known UI labels (never per-lesson math text) are rewritten.
function localizeBilingualLabels(html) {
  const rules = [
    // Section headings (h2/h3.section-title) — plain text, no nested markup.
    /(<h[23] class="section-title">)([^<]*)(<\/h[23]>)/g,
    // Guided-step badges, vocab flip prompt.
    /(<span class="step-badge">)([^<]*)(<\/span>)/g,
    /(<div class="flip-prompt">)([^<]*)(<\/div>)/g,
    // Bilingual action buttons, keyed on stable class or handler.
    /(<button[^>]*class="[^"]*print-all-btn[^"]*"[^>]*>)([^<]*)(<\/button>)/g,
    /(<button[^>]*class="[^"]*btn-check-one[^"]*"[^>]*>)([^<]*)(<\/button>)/g,
    /(<button[^>]*class="[^"]*hw-game-restart[^"]*"[^>]*>)([^<]*)(<\/button>)/g,
    /(<button[^>]*class="[^"]*help-pop-btn[^"]*"[^>]*>)([^<]*)(<\/button>)/g,
    /(<button[^>]*onclick="checkWorksheet\(\)"[^>]*>)([^<]*)(<\/button>)/g,
  ];
  let out = html;
  for (const re of rules) {
    out = out.replace(
      re,
      (_m, open, inner, close) => `${open}${wrapBilingualLabel(inner)}${close}`,
    );
  }
  return out;
}

function main() {
  const lessons = lessonConfigs();
  let count = 0;

  for (const { id, config } of lessons) {
    const homeworkHtml = localizeBilingualLabels(generateHtml(id, config));
    const lessonPath = join(lessonsDir, id, "homework.html");
    const normalizedHtml = `${homeworkHtml.replace(/^ {12}$/gm, "").trimEnd()}\n`;
    writeFileSync(lessonPath, normalizedHtml);
    count++;
  }

  console.log(`Successfully generated ${count} interactive homework HTML files.`);
}

main();
