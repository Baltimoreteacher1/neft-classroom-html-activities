import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { interactiveVisualHost } from "../engine/core/interactive-visual.js";
import { augmentVocabWithGlossary } from "../engine/core/math-glossary.js";
import {
  hasRealVocabImage,
  resolveVocabImage,
  vocabImageAlt,
} from "../engine/core/vocab-images.js";
import { buildVocabMatcher } from "../engine/core/vocab-match.js";
import {
  detectVisualTopic,
  selectMorePracticeProblems,
  selectTieredQuickCheckProblems,
} from "./homework-alignment.mjs";
import { ANSWER_MATCH_JS } from "./homework-answer-match.mjs";
import { HOMEWORK_GAME_JS } from "./homework-games.mjs";
import {
  displayLessonId,
  GUIDED_NOTES_CSS,
  HOMEWORK_TABS_JS,
  homeworkPageLabel,
  renderArcadeTabPanel,
  renderCheckTab,
  renderDoneTab,
  renderHelpModal,
  renderHelpTab,
  renderHomeworkTabs,
  renderLearnTab,
  renderMoreTab,
  renderPlayTabPanel,
  renderProblemHintButton,
  renderQuickCheckIntro,
  renderTogetherTab,
  renderWelcomeBanner,
  renderWordsTab,
  renderWorkbenchTab,
  selectQuickCheckProblems,
} from "./homework-guided-notes.mjs";
import { getUnitTheme, renderUnitThemeCss } from "./homework-themes.mjs";
import { renderVisualMathLab, VISUAL_LABS_CSS, VISUAL_LABS_JS } from "./homework-visual-labs.mjs";
import { EDITORIAL_FONT_IMPORT, EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";
import { compareFamilyHomeworkIds, generatesFamilyHomework } from "./lib/lesson-scope.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";
import { toHomeworkShape } from "./lib/review-lesson-shape.mjs";

/** --check writes nothing and exits non-zero if any committed page has drifted. */
const CHECK = process.argv.includes("--check");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");

// Match core/flagship lessons like "3-2" or "3-2-flagship"
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;
// Folders this generator will consider at all. `generatesFamilyHomework` then
// decides: core lessons always, anything else only when its config opts in.
const HOMEWORK_DIR_RE = /^[0-9][0-9a-z-]*$/;

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

// Precompute the tap-to-define vocab glossary the family homework page ships as
// data. The page is standalone HTML, so it cannot import the engine: the match
// index is built here in Node with the SAME shared code the lesson pages use —
// `augmentVocabWithGlossary` (lesson words plus the grade-6 glossary and its
// acronyms) fed to `buildVocabMatcher` (longest-surface-first, plural-tolerant,
// alias-aware) — and handed to the browser as `regexSource` + `lookup`.
//
// This used to be a hand-copied subset of that matcher over `config.vocabulary`
// ALONE, which is why a family opening the homework never got a popup for
// "fraction": the word is in the shared glossary, not in any lesson's own list,
// so the homework page underlined it nowhere while the lesson page underlined it
// everywhere. The copy had also drifted — no "-ies" plural (so "identity
// properties" matched nothing), no property aliases, no case-sensitivity rule.
// Building from the shared index is what keeps the two in step.
//
// Returns null when nothing is matchable. `entries` is indexed to the AUGMENTED
// list so the lookup's stored indices resolve directly; the Word Wall tab keeps
// rendering the lesson's own vocabulary only, so family flashcards do not
// suddenly grow 96 glossary cards.
let _cachedBankItems = null;
function loadFullVocabBank() {
  if (_cachedBankItems) return _cachedBankItems;
  try {
    const bankPath = join(root, "vocab-hub/vocab-bank.json");
    if (existsSync(bankPath)) {
      const data = JSON.parse(readFileSync(bankPath, "utf8"));
      _cachedBankItems = Array.isArray(data.items) ? data.items : [];
      return _cachedBankItems;
    }
  } catch (_e) {}
  return [];
}

function buildVocabGlossary(vocab) {
  const lessonList = Array.isArray(vocab) ? vocab : [];
  let list = augmentVocabWithGlossary(lessonList);
  const fullBank = loadFullVocabBank();
  const seen = new Set(
    list.map((v) =>
      String((v && v.term) || "")
        .toLowerCase()
        .replace(/s$/, "")
        .trim(),
    ),
  );
  for (const item of fullBank) {
    if (!item || !item.term) continue;
    const key = String(item.term).toLowerCase().replace(/s$/, "").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      term: item.term,
      termEs: item.termEs || "",
      definition: item.definition || "",
      definitionEs: item.definitionEs || "",
      visual: item.visual || "",
      image: item.image || "",
      caseSensitive: !!item.caseSensitive,
    });
  }
  const matcher = buildVocabMatcher(list);
  if (!matcher) return null;

  const entries = list.map((v) => {
    const term = String((v && v.term) || "").trim();
    const img = hasRealVocabImage(term, v && v.image)
      ? resolveVocabImage(term, v && v.image)
      : v && v.image
        ? String(v.image)
        : "";
    const def = String((v && v.definition) || "").replace(/2³/g, "2^3");
    const defEs = String((v && v.definitionEs) || "").replace(/2³/g, "2^3");
    const example = String((v && v.visual) || "").replace(/2³/g, "2^3");
    return {
      term,
      termEs: v && v.termEs ? String(v.termEs) : "",
      def,
      defEs,
      example,
      img,
      imgAlt: img ? vocabImageAlt(term, def) : "",
      // Acronym entries ("MAD", "SA") answer only to their exact written form,
      // so the browser can tell them apart from the ordinary English word.
      cs: !!(v && v.caseSensitive),
    };
  });

  return { entries, match: { regexSource: matcher.regexSource, lookup: matcher.lookup } };
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
      labelEs:
        it.labelEs ||
        it.instructionsEs ||
        (it.label || it.instructions ? "" : "Pon los pasos en el orden correcto."),
      hints: it.hints || [],
      hintsEs: it.hintsEs || [],
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
    labelEs:
      it.labelEs ||
      it.instructionsEs ||
      (it.label || it.instructions ? "" : "Clasifica los elementos en los grupos correctos."),
    hints: it.hints || [],
    hintsEs: it.hintsEs || [],
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

// The problem-type chip was the last English-only UI string on the Check tab
// (the math stems themselves are still English — tracked separately). This is a
// closed set of 6 values, so each gets a hand-written Spanish label rather than
// a derived one.
const PROBLEM_TYPE_LABELS = {
  "multiple-choice": { en: "MULTIPLE CHOICE", es: "OPCIÓN MÚLTIPLE" },
  "drag-sort": { en: "DRAG SORT", es: "CLASIFICAR ARRASTRANDO" },
  "drag-order": { en: "DRAG ORDER", es: "ORDENAR ARRASTRANDO" },
  "fill-table": { en: "FILL TABLE", es: "COMPLETAR LA TABLA" },
  "matching-game": { en: "MATCHING GAME", es: "JUEGO DE PAREJAS" },
  "open-response": { en: "OPEN RESPONSE", es: "RESPUESTA ABIERTA" },
  "error-analysis": { en: "ERROR ANALYSIS", es: "ANÁLISIS DE ERRORES" },
};

function renderProblemTypeChip(displayType) {
  const fallback = String(displayType || "")
    .replace(/-/g, " ")
    .toUpperCase();
  const label = PROBLEM_TYPE_LABELS[displayType];
  if (!label) return `<div class="problem-type-badge">${esc(fallback)}</div>`;
  return `<div class="problem-type-badge"><span class="lang-en">${esc(label.en)}</span><span class="lang-es" lang="es">${esc(label.es)}</span></div>`;
}

function renderFamilyTip(typeKey) {
  const tip = FAMILY_TIPS_BY_TYPE[typeKey] || FAMILY_TIPS_BY_TYPE["multiple-choice"];
  return `<p class="family-problem-tip"><span class="lang-en">👪 ${esc(tip.en)}</span><span class="lang-es" lang="es">👪 ${esc(tip.es)}</span></p>`;
}

/* Bilingual problem text. Every other surface on the page uses the
   .lang-en / .lang-es span pair that the language selector toggles; the math
   problems themselves were the one place that emitted bare English, so
   "Solo Español" left the whole Check tab in English even for the problems
   whose config already carried curated Spanish.

   Falls back to English-only markup when no Spanish is authored — an
   untranslated stem must still be readable, never blank. Curated Spanish is
   the ONLY source: nothing here derives or machine-translates. */
function bi(en, es) {
  const enText = String(en ?? "");
  const esText = String(es ?? "").trim();
  if (!esText || esText === enText) return esc(enText);
  return `<span class="lang-en">${esc(enText)}</span><span class="lang-es" lang="es">${esc(esText)}</span>`;
}

/* True when a stem/choice carries no Spanish, so the page can mark itself for
   the coverage validator without changing what a family sees. */
function esMissing(en, es) {
  const enText = String(en ?? "").trim();
  const esText = String(es ?? "").trim();
  return !!enText && !esText;
}

// Deterministic 32-bit string hash → seed. Keeps the generator reproducible so a
// no-op regeneration produces a zero diff (Math.random() previously reshuffled
// ~23 files on every run, burying real changes in noise).
function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 — small, fast, well-distributed seeded PRNG.
function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSteps(steps, correctOrder, seedKey = "") {
  const out = [...steps];
  const rand = seededRandom(seedFrom(`${seedKey}|${steps.join("|")}`));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (correctOrder.length > 1 && out.every((s, i) => s === correctOrder[i])) {
    return [out[out.length - 1], ...out.slice(0, -1)];
  }
  return out;
}

function _isPrintable(it) {
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

function _selectProblems(practice = {}, config = {}) {
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
    if (!dir.isDirectory() || !HOMEWORK_DIR_RE.test(dir.name)) continue;
    const cfgPath = join(lessonsDir, dir.name, "config.json");
    if (!existsSync(cfgPath)) continue;
    try {
      const config = JSON.parse(readFileSync(cfgPath, "utf8"));
      if (!generatesFamilyHomework(dir.name, config)) continue;
      // A bridge/Apply-Day lesson states its practice as `groupLevels`; restate
      // it in the numbered-lesson shape every consumer below was written for.
      const shaped = toHomeworkShape(config);
      // Merge curated bilingual family-homework notes from sidecar data file.
      // Sidecar keeps lesson configs lean; inline config.familyNotes wins on conflict.
      const notesPath = join(root, "data", "family-homework-notes", `${dir.name}.json`);
      if (existsSync(notesPath)) {
        try {
          const notes = JSON.parse(readFileSync(notesPath, "utf8"));
          shaped.familyNotes = { ...notes, ...(shaped.familyNotes || {}) };
        } catch (e) {
          console.error(`Bad family-homework sidecar for ${dir.name}: ${e.message}`);
        }
      }
      out.push({ id: dir.name, config: shaped });
    } catch (err) {
      console.error(`Skipping ${dir.name}: ${err.message}`);
    }
  }
  out.sort((a, b) => compareFamilyHomeworkIds(a.id, b.id));
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
    en: "The small top number tells how many copies of the base multiply together (e.g. 2³ = 2 × 2 × 2 = 8, NOT 2 × 3).",
    es: "El número pequeño de arriba dice cuántas copias de la base se multiplican (ej. 2³ = 2 × 2 × 2 = 8, NO 2 × 3).",
    draw: "Write out the repeated multiplication chain.",
    drawEs: "Escribe la cadena de multiplicación repetida.",
    coach: "Ask: 'Are we multiplying by the top number, or multiplying copies together?'",
    coachEs: "Pregunta: '¿Multiplicamos por el número de arriba, o multiplicamos copias juntas?'",
  },
  ratios: {
    en: "A ratio is like a recipe: if you double or scale one amount, multiply or divide the other by the exact same number.",
    es: "Una razón es como una receta: si duplicas una cantidad, multiplica o divide la otra por el mismo número.",
    draw: "Use a simple two-column table to scale both quantities together.",
    drawEs: "Usa una tabla de dos columnas para escalar ambas cantidades juntas.",
    coach: "Ask: 'What happened to the first number? Can we do that same action to the second?'",
    coachEs: "Pregunta: '¿Qué le pasó al primer número? ¿Podemos hacerle lo mismo al segundo?'",
  },
  area: {
    en: "Count how many 1×1 square floor tiles cover the flat shape (multiply base × height).",
    es: "Cuenta cuántos cuadrados cubren la figura plana (multiplica base × altura).",
    draw: "Outline the flat floor and multiply base by height.",
    drawEs: "Delinea el piso plano y multiplica la base por la altura.",
    coach: "Ask: 'Are we counting the outside border or the square tiles inside?'",
    coachEs: "Pregunta: '¿Estamos contando el borde de afuera o los cuadrados de adentro?'",
  },
  volume: {
    en: "Imagine packing unit cubes into a box: multiply length × width × height to find total cubic units inside.",
    es: "Imagina llenar una caja con cubos: multiplica largo × ancho × alto para hallar los cubos totales adentro.",
    draw: "Label the three box dimensions: length, width, and height.",
    drawEs: "Rotula las tres dimensiones de la caja: largo, ancho y alto.",
    coach: "Ask: 'How many cubes fit on the bottom floor, and how many floors high is the box?'",
    coachEs: "Pregunta: '¿Cuántos cubos caben en la base y cuántos pisos de alto tiene la caja?'",
  },
  "surface-area": {
    en: "Unfold the 3D shape like a cardboard box. Find the flat area of each face, then add them all together.",
    es: "Desdobla la figura 3D como una caja de cartón. Halla el área de cada cara y súmalas todas.",
    draw: "Draw the unfolded net and label each of the flat faces.",
    drawEs: "Dibuja la plantilla desdoblada y rotula cada una de las caras planas.",
    coach: "Ask: 'How many flat faces does this box have? Did we find the area of each one?'",
    coachEs: "Pregunta: '¿Cuántas caras planas tiene esta caja? ¿Hallamos el área de cada una?'",
  },
  "coordinate-plane": {
    en: "Think of an elevator: walk down the hallway right or left (x) first, then take the elevator up or down (y).",
    es: "Piensa en un elevador: camina por el pasillo (x) primero, luego sube o baja en el elevador (y).",
    draw: "Start at (0,0), move across x, then up or down to y.",
    drawEs: "Empieza en (0,0), avanza en x, luego sube o baja en y.",
    coach: "Ask: 'Did we move horizontally across the floor first, before going up or down?'",
    coachEs:
      "Pregunta: '¿Nos movimos primero por el piso horizontalmente, antes de subir o bajar?'",
  },
  "number-line": {
    en: "Numbers on the right are always greater; numbers on the left are always smaller. Negative means below zero.",
    es: "Los números a la derecha siempre son mayores; a la izquierda son menores. Negativo significa bajo cero.",
    draw: "Plot the numbers on the line in order from left (least) to right (greatest).",
    drawEs: "Marca los números en la recta en orden de izquierda (menor) a derecha (mayor).",
    coach: "Ask: 'Which number is further to the right? That one is always greater!'",
    coachEs: "Pregunta: '¿Cuál número está más a la derecha? ¡Ese siempre es mayor!'",
  },
  fractions: {
    en: "To compare, add, or divide fractions, make sure the pieces are cut to the exact same size (common denominator).",
    es: "Para comparar, sumar o dividir fracciones, asegúrate de que las partes tengan el mismo tamaño (denominador común).",
    draw: "Divide bars or lines into equal pieces to see the sizes clearly.",
    drawEs: "Divide barras o rectas en partes iguales para ver los tamaños con claridad.",
    coach:
      "Ask: 'Can we combine slices from different sized pizzas, or do we need equal slices first?'",
    coachEs:
      "Pregunta: '¿Podemos combinar rebanadas de pizzas de distinto tamaño, o necesitamos rebanadas iguales primero?'",
  },
  decimals: {
    en: "Line up the decimal points like buttons on a shirt so dollars stay with dollars and dimes stay with dimes.",
    es: "Alinea los puntos decimales como botones de camisa para que las unidades queden juntas.",
    draw: "Stack the numbers with their decimal dots aligned straight down.",
    drawEs: "Coloca los números uno sobre otro con los puntos decimales bien alineados.",
    coach: "Ask: 'Are our decimal dots lined up in a straight vertical line?'",
    coachEs: "Pregunta: '¿Están nuestros puntos decimales alineados en una línea vertical recta?'",
  },
  equations: {
    en: "Picture a balanced scale: whatever you do to one side (+, −, ×, ÷), do the exact same thing to the other side.",
    es: "Imagina una balanza equilibrada: lo que hagas en un lado (+, −, ×, ÷), haz exactamente lo mismo en el otro.",
    draw: "Draw a balance scale showing both sides equal.",
    drawEs: "Dibuja una balanza que muestre ambos lados iguales.",
    coach:
      "Ask: 'What operation is connected to the variable, and what is the opposite operation to undo it?'",
    coachEs:
      "Pregunta: '¿Qué operación acompaña a la variable y cuál es la operación opuesta para deshacerla?'",
  },
  inequalities: {
    en: "Solve like an equation, then test a number: shade all numbers that make the comparison true.",
    es: "Resuelve como una ecuación y prueba un número: sombrea todos los números que hagan verdadera la comparación.",
    draw: "Use an open circle for < or > and a solid filled circle for ≤ or ≥, then shade.",
    drawEs: "Usa círculo abierto para < o > y círculo relleno para ≤ o ≥, luego sombrea.",
    coach: "Ask: 'Is the endpoint included (solid dot) or not included (open circle)?'",
    coachEs:
      "Pregunta: '¿Está incluido el número límite (punto relleno) o no está incluido (círculo abierto)?'",
  },
  expressions: {
    en: "Combine matching parts together — letters with letters and regular numbers with regular numbers.",
    es: "Combina las partes iguales: letras con letras y números solos con números solos.",
    draw: "Put boxes around letter terms and circles around plain numbers.",
    drawEs: "Encierra en cajas los términos con letra y en círculos los números solos.",
    coach: "Ask: 'Can we add apples and oranges together, or do we group matching items together?'",
    coachEs: "Pregunta: '¿Podemos sumar peras con manzanas, o agrupamos lo que coincide junto?'",
  },
  statistics: {
    en: "Statistical questions expect answers that VARY from person to person; non-statistical questions have 1 fixed fact.",
    es: "Las preguntas estadísticas esperan respuestas que VARÍAN de una persona a otra; las no estadísticas tienen 1 solo dato fijo.",
    draw: "Line up values from least to greatest to see the spread and middle.",
    drawEs: "Ordena los valores de menor a mayor para ver la dispersión y el centro.",
    coach:
      "Ask: 'Would 10 classmates give 10 different answers, or would everyone give the exact same answer?'",
    coachEs:
      "Pregunta: '¿10 compañeros darían respuestas distintas, o todos darían exactamente la misma respuesta?'",
  },
  factors: {
    en: "Factors are the building blocks that multiply to make a number (e.g. 2 × 3 = 6). Multiples are skip-counting.",
    es: "Los factores son los bloques que se multiplican para formar un número (ej. 2 × 3 = 6). Los múltiplos son el conteo a saltos.",
    draw: "Make a factor rainbow or factor tree to see all the pairs.",
    drawEs: "Haz un arcoíris o árbol de factores para ver todas las parejas.",
    coach: "Ask: 'What two numbers can multiply together to make this number?'",
    coachEs: "Pregunta: '¿Qué dos números pueden multiplicarse para formar este número?'",
  },
  fallback: {
    en: "Take it one step at a time: find what the question gives you, what it asks for, and picture the action.",
    es: "Ve paso a paso: halla lo que te da la pregunta, lo que pide y visualiza la acción.",
    draw: "Sketch a quick picture, number line, or table.",
    drawEs: "Haz un dibujo rápido, una recta numérica o una tabla.",
    coach: "Ask: 'In your own words, what is happening in this problem?'",
    coachEs: "Pregunta: 'En tus propias palabras, ¿qué está pasando en este problema?'",
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

// Collapsible "How to solve it" routine — visual parent guidance, bilingual.
function renderStepGuide(topic) {
  const g = topicGuide(topic);
  return `
      <details class="hw-step-guide">
        <summary><span class="lang-en">👁️ How to solve it — Quick Visual Guide for Parents</span><span class="lang-es" lang="es">👁️ Cómo resolverlo — Guía Visual para Familias</span></summary>
        <div class="guide-grid">
          <div class="guide-card">
            <strong><span>💡 1. The Big Idea / La idea clave</span></strong>
            <p><span class="lang-en">${esc(g.en)}</span><span class="lang-es" lang="es">${esc(g.es)}</span></p>
          </div>
          <div class="guide-card">
            <strong><span>✏️ 2. Picture It / Dibújalo</span></strong>
            <p><span class="lang-en">${esc(g.draw)}</span><span class="lang-es" lang="es">${esc(g.drawEs)}</span></p>
          </div>
          <div class="guide-card" style="grid-column: 1 / -1;">
            <strong><span>💬 3. Ask Your Student / Pregúntale a tu estudiante</span></strong>
            <p><span class="lang-en"><strong>Parent prompt:</strong> ${esc(g.coach || "Ask: What is happening in this problem?")}</span><span class="lang-es" lang="es"><strong>Pregunta clave:</strong> ${esc(g.coachEs || "Pregunta: ¿Qué está pasando en este problema?")}</span></p>
          </div>
        </div>
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
    const stemEs = it.stemEs || "";
    const choices = it.choices || [];
    const choicesEs = Array.isArray(it.choicesEs) ? it.choicesEs : [];
    const correctIdx = it.correctIndex !== undefined ? it.correctIndex : 0;
    const explanation = it.explanation || "";
    const explanationEs = it.explanationEs || "";

    content = `
      <div class="problem-body">
        <p class="problem-stem"${esMissing(stem, stemEs) ? ' data-es-missing="stem"' : ""}>${bi(stem, stemEs)}</p>
        ${renderFamilyTip("multiple-choice")}
        <div class="mc-options" data-correct="${correctIdx}" data-explanation="${esc(explanation)}"${explanationEs ? ` data-explanation-es="${esc(explanationEs)}"` : ""} data-choice-feedback='${esc(JSON.stringify(it.choiceFeedback || []))}' data-topic="${esc(topic)}">
          ${choices
            .map(
              (choice, cIdx) => `
            <label class="mc-option-label" id="label_q_${pIdx}_${cIdx}">
              <input type="radio" name="q_${pIdx}" value="${cIdx}" onchange="saveState(); updateProgress();">
              <span class="custom-radio"></span>
              <span class="choice-text">${bi(choice, choicesEs[cIdx])}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (type === "matching-game") {
    const label = it.label || it.instructions || "Match each item to its correct partner.";
    const labelEs =
      it.labelEs ||
      it.instructionsEs ||
      (it.label || it.instructions ? "" : "Une cada elemento con su pareja correcta.");
    const pairs = it.pairs || [];

    // Get unique sorted matches for dropdown options
    const allMatches = pairs.map((p) => p.match);
    const sortedMatches = [...new Set(allMatches)].sort();

    content = `
      <div class="problem-body">
        <p class="problem-stem"${esMissing(label, labelEs) ? ' data-es-missing="stem"' : ""}>${bi(label, labelEs)}</p>
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
      const shuffledSteps = shuffleSteps(norm.steps, norm.correctOrder, `${pIdx}|${norm.label}`);
      content = `
      <div class="problem-body">
        <p class="problem-stem"${esMissing(norm.label, norm.labelEs) ? ' data-es-missing="stem"' : ""}>${bi(norm.label, norm.labelEs)}</p>
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
        <p class="problem-stem"${esMissing(norm.label, norm.labelEs) ? ' data-es-missing="stem"' : ""}>${bi(norm.label, norm.labelEs)}</p>
        ${renderFamilyTip(familyTipKey)}
        ${
          norm.hints?.length
            ? `<div class="family-hint-box">${norm.hints.map((h, hIdx) => `<p>💡 ${bi(h, norm.hintsEs?.[hIdx])}</p>`).join("")}</div>`
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
    const labelEs =
      it.labelEs || it.instructionsEs || (it.label || it.instructions ? "" : "Completa la tabla.");

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
        <p class="problem-stem"${esMissing(label, labelEs) ? ' data-es-missing="stem"' : ""}>${bi(label, labelEs)}</p>
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
    const titleEs = it.titleEs || (it.title ? "" : "Analiza los pasos resueltos");
    const workedExample = it.workedExample || [];
    const errorStep = it.errorStep !== undefined ? it.errorStep : 0;
    const correctWork = it.correctWork || "";
    const explanation = it.explanation || "";

    content = `
      <div class="problem-body">
        <h3 class="error-analysis-title"${esMissing(title, titleEs) ? ' data-es-missing="title"' : ""}>⚠️ ${bi(title, titleEs)}</h3>
        <p class="problem-stem">${bi(
          "Review the steps below. Identify which step contains the error, and explain why.",
          "Revisa los pasos de abajo. Identifica cuál paso tiene el error y explica por qué.",
        )}</p>
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
    const promptEs = it.promptEs || it.stemEs || "";
    const sentenceFrame = it.sentenceFrame || "";
    const _sentenceFrameEs = it.sentenceFrameEs || "";
    const keywords = it.keywords || [];
    const minLength = it.minLength || 15;

    content = `
      <div class="problem-body">
        <p class="problem-stem"${esMissing(prompt, promptEs) ? ' data-es-missing="stem"' : ""}>${bi(prompt, promptEs)}</p>
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
  const typeChip = renderProblemTypeChip(displayType);
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
        ${typeChip}
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
  const vocabGlossary = buildVocabGlossary(vocab);
  // Serialize for an inline <script>; escape "<" so authored text can never
  // break out with a literal "</script>".
  const jsonForScript = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

  // Two-tier Quick Check: easy "warm-up" problems first to practice the concept,
  // then a harder "level up" set — clearly sectioned. Indices stay contiguous so
  // per-problem checking/scoring keeps working across all sections.
  const { warmup, challenge } = selectTieredQuickCheckProblems(config.practice || {}, config);
  const coreSelected = [...warmup, ...challenge];
  const moreSelected = selectMorePracticeProblems(config.practice || {}, config, coreSelected);
  const topic = detectVisualTopic(config);
  const lessonModel = selectLessonInteractiveModel(config);

  const unitNum = parseInt(config.unit || String(lessonId).split("-")[0] || 1, 10);
  const theme = getUnitTheme(unitNum);
  const themeCss = renderUnitThemeCss(theme);

  const welcomeHtml = renderWelcomeBanner(config, lessonId);
  const quickCheckIntroHtml = renderQuickCheckIntro(coreSelected.length);
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
    renderWordsTab(vocab, resolveVocabImage, vocabImageAlt),
    renderTogetherTab(config, lessonId),
    renderWorkbenchTab(),
    renderCheckTab(quickCheckIntroHtml, warmupHtml, challengeHtml, morePracticeHtml),
    renderArcadeTabPanel(lessonId),
    renderPlayTabPanel(config),
    renderHelpTab(config),
    renderMoreTab(config, lessonId),
    renderDoneTab(),
  ].join("\n");

  const tabsHtml = renderHomeworkTabs(tabPanels);
  const helpModalHtml = renderHelpModal();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Help Your Student — ${esc(homeworkPageLabel(lessonId))}: ${esc(title)}</title>
<link href="/assets/fonts/outfit-hanken-grotesk-56e206.css" rel="stylesheet">
<style>
${EDITORIAL_FONT_IMPORT}
:root {
  --navy: #12355b;
  --navy-light: #18466f;
  --teal: #1fa6a2;
--teal-ink: #0c6f6b;
  /* Text-safe partner for --coral, which is a fill colour only (3.0:1 on white). */
  --coral-ink: #9c4326;
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

${themeCss}

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

/* A left rule rather than a third teal slab: the problem card already carries a
   teal hint button and a teal step guide, and three identical fills flattened
   the hierarchy into noise. */
.family-hint-box {
  margin-bottom: 14px;
  padding: 2px 0 2px 14px;
  background: none;
  border-left: 3px solid var(--teal);
  border-radius: 0;
  font-size: 14px;
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
  font-size: 12px;
  font-weight: 700;
  color: var(--teal-ink);
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
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--teal-ink);
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
  border: 1.5px solid var(--line); border-radius: 8px; padding: 6px 11px; min-height: 44px; cursor: pointer;
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
  /* The routine is collapsed on screen (it repeats on every problem). On paper
     there is nothing to click, so force the contents visible. */
  .hw-step-guide > * { display: block !important; }
  /* Flip cards print flat — otherwise only the English word reaches the paper
     and every definition prints as a blank box. */
  .vocab-card-inner { transform: none !important; }
  .vocab-card-front, .vocab-card-back {
    position: static !important;
    transform: none !important;
    -webkit-backface-visibility: visible !important;
    backface-visibility: visible !important;
  }
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
  color: var(--teal-ink);
  border: 1.5px solid var(--teal);
  border-radius: var(--radius-sm);
  padding: 11px 12px;
  font-size: 13.5px;
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
  /* Must track .container's max-width (set in the polish layer) or the sticky
     bar's controls sit inset from every card above it. */
  max-width: 840px;
  padding: 0 18px;
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

/* On a laptop the 840px column left half the viewport empty while single
   problem cards ran thousands of pixels tall. Give the reading column more
   room — and keep the sticky bar's inner column locked to it. */
@media (min-width: 1180px) {
  .container, .status-bar-wrapper { max-width: 1000px; }
}

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
  font-size: 11.5px;
  letter-spacing: .02em;
  padding: 4px 9px;
  border-radius: 999px;
  align-self: center;
}
.step-label { font-size: 15px; }

/* Bilingual text: Spanish is a primary language here, so it keeps full ink
   contrast. The separation is carried structurally by a teal rule, never by
   fading the text (that read as "English written twice, Spanish as a footnote"). */
.lang-es { color: var(--ink); }
.worked-step .lang-es, .lang-en + .lang-es {
  display: block;
  margin-top: 4px;
  padding-left: 10px;
  border-left: 2px solid var(--teal-light);
}

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

/* ============================================================
   FAMILY MISSION DESIGN SYSTEM — the last layer, and the one that
   decides how the page FEELS. Everything above grew one wave at a
   time: each addition brought its own badge colour, its own card
   weight and its own heading size, so a family met a pile of parts
   rather than one designed page. This layer states the shared rules
   once — surface, rhythm, type scale, accent, motion — and the
   sections inherit them.

   It uses !important only where the "Apple-Grade Pill" block above
   already does; specificity cannot win against a bare !important, and
   splitting that block apart is a bigger, riskier edit than owning
   the handful of properties this layer overrides.
   ============================================================ */

/* --- Paper: warm, with a whisper of the classroom's graph texture --- */
body {
  background-color: var(--cream);
  background-image:
    linear-gradient(rgba(18,53,91,.030) 1px, transparent 1px),
    linear-gradient(90deg, rgba(18,53,91,.030) 1px, transparent 1px);
  background-size: 26px 26px;
  background-attachment: fixed;
}

/* --- Control deck: the tab row and the progress rail are ONE object,
       not two floating bars stacked on each other. --- */
.homework-tab-chrome {
  background: rgba(255,255,255,.96) !important;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--line);
  border-radius: 22px;
  box-shadow: 0 10px 30px -14px rgba(15,23,42,.22);
  overflow: hidden;
  margin-bottom: 26px !important;
}
.homework-tab-bar {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 9px 12px !important;
}
/* The five stops a family is asked to walk read as primary; the five
   optional surfaces read as what they are. */
.homework-tab-btn.is-bonus { opacity: .72; font-weight: 600 !important; }
.homework-tab-btn.is-bonus:hover { opacity: 1; }
.homework-tab-btn.is-bonus.is-active { opacity: 1; }
.homework-tab-btn.is-core.is-active {
  background: linear-gradient(135deg, #14406e, #0f2b50) !important;
}
.homework-tab-divider {
  flex: 0 0 auto;
  width: 1px;
  align-self: stretch;
  margin: 4px 6px;
  background: var(--line);
}
.homework-tab-bonus-label {
  flex: 0 0 auto;
  font-family: var(--font-display);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  padding-right: 2px;
}
.homework-tab-bonus-label .lang-es { color: var(--muted); }
.homework-tab-bonus-label .lang-en + .lang-es { border-left: 0; padding-left: 0; margin-top: 0; }
.hw-rail { background: linear-gradient(180deg, rgba(247,244,236,.5), rgba(255,255,255,0)); }

/* --- Section headings: one confident scale, an accent dot instead of
       five different coloured pills, Spanish as a full-ink partner line. --- */
.section-title {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.5vw, 25px);
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.2;
  color: var(--navy);
  align-items: baseline;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.section-title::before {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 0 4px rgba(242,193,91,.22);
  align-self: center;
}

/* --- Cards: one surface, one radius, one shadow. --- */
.guided-section.card,
.card-ish,
.card {
  border-radius: 20px !important;
  border: 1px solid var(--line) !important;
  box-shadow: 0 1px 2px rgba(18,53,91,.04), 0 18px 40px -30px rgba(18,53,91,.55) !important;
}

/* --- One badge shape. Waves added a teal pill, a coral pill, a purple
       pill and an amber pill for the same job; the shape now carries the
       meaning and colour is reserved for the accent. --- */
.fam-act-badge,
.fam-game-badge,
.math-talk-badge,
.spotlight-badge {
  display: inline-flex !important;
  align-items: center;
  gap: 7px;
  font-family: var(--font-display) !important;
  font-size: 11.5px !important;
  font-weight: 800 !important;
  letter-spacing: .09em !important;
  text-transform: uppercase;
  color: var(--navy) !important;
  background: linear-gradient(135deg, #fdf3dc, #f7f4ec) !important;
  border: 1px solid rgba(242,193,91,.55) !important;
  border-radius: 999px !important;
  padding: 6px 14px !important;
}

/* --- Bilingual, two ways.
   Spanish keeps FULL ink everywhere — the separation is structural, never a
   fade (a faded Spanish read as "English written twice"). But the structure
   has to fit the container: in prose the two languages stack with a teal rule,
   while inside a chip, a tab or a rail label they must sit on ONE line with a
   visible separator, or "5 stops" and "5 paradas" run together into nonsense. */
.hw-stat .lang-es,
.hw-hero-kicker .lang-es,
.hw-rail-title .lang-es,
.hw-rail-bonus .lang-es,
.homework-tab-bonus-label .lang-es,
.fam-act-meta .lang-es,
.hw-quickplan-summary .lang-es {
  display: inline !important;
}
.hw-stat .lang-en + .lang-es::before,
.hw-hero-kicker .lang-en + .lang-es::before,
.hw-rail-title .lang-en + .lang-es::before,
.hw-rail-bonus .lang-en + .lang-es::before,
.homework-tab-bonus-label .lang-en + .lang-es::before,
.hw-quickplan-summary .lang-en + .lang-es::before {
  content: "·";
  margin: 0 7px;
  opacity: .6;
}
/* The same rule, stated once for every control: inside a button or a summary,
   the two languages share one line with a separator. Stacking them there
   doubled the height of every chip and filter and read as one garbled string
   ("All Todos", "Needs Review Por repasar"). Prose is unaffected — it keeps
   the stacked treatment with the teal rule. */
button .lang-en + .lang-es,
summary .lang-en + .lang-es {
  display: inline;
  border-left: 0;
  padding-left: 0;
  margin-top: 0;
}
button .lang-en + .lang-es::before,
summary .lang-en + .lang-es::before {
  content: "·";
  margin: 0 6px;
  opacity: .6;
}
/* Two controls read better stacked and keep it: the rail's five stops (a map,
   where the label sits under its dot) and the tab bar (which shows one
   language at a time already). */
.hw-rail-label .lang-en + .lang-es,
.tab-label .lang-en + .lang-es { display: block; }
.hw-rail-label .lang-en + .lang-es::before,
.tab-label .lang-en + .lang-es::before { content: none; }

/* On the dark hero, every Spanish line inherits the hero's light ink rather
   than the global dark --ink, which was rendering it near-invisible. */
.hw-hero .lang-es { color: inherit; }
.hw-hero .lang-en + .lang-es { border-left-color: rgba(242,193,91,.5); }

/* Section headings: English line, Spanish line beneath at full ink — a
   partner line, not a second competing title on the same row. */
.section-title { flex-wrap: wrap; row-gap: 2px; }
.section-title .lang-es {
  /* The heading is a flex row, so the partner line needs a full-width basis to
     drop beneath the English rather than sit beside it as a second title. */
  flex: 0 0 100%;
  margin-top: 1px;
  padding-left: 18px;
  border-left: 0;
  font-size: .66em;
  font-weight: 600;
  color: var(--teal-ink);
  letter-spacing: 0;
}

/* The Listen button now renders INSIDE the heading (see renderLearnTab), so it
   sits on the heading row instead of alone in a band of dead space. */
.btn-listen-concept {
  margin-left: auto;
  align-self: center;
  flex: 0 0 auto;
  font-size: 12.5px;
}
/* The concept figure is the point of that section — frame it instead of
   letting it drift in the middle of an empty card. */
.concept-visual-wrap {
  display: flex;
  justify-content: center;
  margin: 4px 0 20px;
  padding: 22px 18px;
  background: linear-gradient(180deg, #fbfdff, var(--cream));
  border: 1px solid var(--line);
  border-radius: 16px;
}
/* The figure is the point of that card — let it use the width it has instead
   of sitting small in the middle of it. */
.concept-visual-wrap > svg { width: 100%; max-width: 560px; height: auto; }

/* --- Motion: one orchestrated reveal when a family lands on a stop.
       Respects reduced-motion via the global rule already in this file. --- */
@keyframes hwRise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
/* Gated on a class JS adds after boot. An entrance animation whose start
   state is opacity:0 hides the page's content until it runs — if the script
   never runs, a family gets a blank page, which is the one failure this site
   spends a whole gate on. No class, no animation, everything visible. */
body.hw-motion-ready [data-tab-panel]:not([hidden]) > * {
  animation: hwRise .5s cubic-bezier(.22,.9,.3,1) both;
}
body.hw-motion-ready [data-tab-panel]:not([hidden]) > *:nth-child(1) { animation-delay: .02s; }
body.hw-motion-ready [data-tab-panel]:not([hidden]) > *:nth-child(2) { animation-delay: .08s; }
body.hw-motion-ready [data-tab-panel]:not([hidden]) > *:nth-child(3) { animation-delay: .14s; }
body.hw-motion-ready [data-tab-panel]:not([hidden]) > *:nth-child(4) { animation-delay: .20s; }
body.hw-motion-ready [data-tab-panel]:not([hidden]) > *:nth-child(n+5) { animation-delay: .26s; }
body.hw-motion-ready .hw-hero { animation: hwRise .6s cubic-bezier(.22,.9,.3,1) both; }

/* --- Interactive surfaces lift on hover, so a family can tell what is
       tappable from what is text. --- */
.fam-act-card, .fam-game-card, .vocab-card, .problem-card {
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.fam-act-card:hover, .fam-game-card:hover {
  transform: translateY(-2px);
  border-color: var(--teal);
}

@media (prefers-reduced-motion: reduce) {
  body.hw-motion-ready [data-tab-panel]:not([hidden]) > *,
  body.hw-motion-ready .hw-hero { animation: none !important; }
}

/* --- The floating launchers sit ABOVE the sticky status bar.
   Save/Resume (#nsr-root) and the Math Workbench launcher (#mwb-launcher) are
   shared, runtime-injected widgets pinned to the bottom-right of every page.
   This page also has a fixed status bar there, so on a phone — where that bar
   wraps to two rows — the Save/Resume pill landed on top of the progress
   readout ("1 / 6 Completed"). They are lifted by the bar's own measured
   height (--hw-status-height, set by syncHomeworkChromeHeights) rather than a
   guessed constant, so the clearance stays right when the bar wraps.

   The body prefix is deliberate: the shared stylesheet is linked AFTER this
   block, so a bare id selector would lose the tie on source order. Scoped to
   this page only — the widgets keep their position everywhere else. --- */
body #nsr-root,
body #mwb-launcher,
body .mwb-launcher {
  /* Clamped on purpose. --hw-status-height is measured by script and can be
     read while the bar is mid-layout — it reported 381px for a bar that
     renders 121px, which threw the launchers up into the tab deck. The clamp
     keeps a wrong-high reading from moving them off the bottom of the page;
     150px still clears the tallest real bar (two wrapped rows). */
  bottom: calc(min(var(--hw-status-height, 104px), 150px) + 14px) !important;
}

/* --- Phone: the briefing has to fit the screen a family actually holds.
   At 390px the hero ran 797px — a screen and a half of chrome before any
   mathematics — because the stat chips wrapped to three rows, the language
   control to two, and the kicker to two. Same content, tighter frame. --- */
@media (max-width: 700px) {
  .hw-hero-kicker { font-size: 10.5px; padding: 5px 11px 5px 6px; margin-bottom: 12px; gap: 6px; }
  .hw-hero-kicker-icon { width: 20px; height: 20px; font-size: 11px; }
  .hw-hero-lesson { margin-top: 14px; padding-top: 12px; }
  .hw-hero-lead { margin-top: 10px; font-size: 14px; }
  .hw-hero-stats {
    margin-top: 14px;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .hw-hero-stats::-webkit-scrollbar { display: none; }
  .hw-stat { flex: 0 0 auto; padding: 6px 12px; font-size: 12px; }
  .hw-hero-controls { margin-top: 14px; }
  .hw-hero .lang-selector-card { gap: 8px; }
  .hw-hero .lang-selector-title { flex: 0 0 100%; font-size: 10.5px; }
  /* One row of three, never a stacked column: the three modes are a choice
     between peers and reading them as a vertical list says otherwise. */
  /* flex-direction is set to column by an older mobile rule for the standalone
     selector; inside the hero the three modes stay a row. */
  .hw-hero .lang-selector-buttons {
    display: flex;
    width: 100%;
    flex-direction: row;
    flex-wrap: nowrap;
  }
  .hw-hero .lang-toggle-btn {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
    justify-content: center;
    min-height: 44px;
    padding: 8px 6px;
    font-size: 12px;
    white-space: nowrap;
  }
  /* The full "Bilingual / Bilingüe" cannot fit a third of a phone; the flag
     pair already carries it, and the label returns above 700px. */
  .hw-hero .lang-toggle-btn[data-lang-mode="bilingual"] span { display: none; }
  .hw-hero .hw-quickplan { margin-top: 14px; }
  /* The opacity difference already says which tabs are optional; the divider
     and its label cost a whole extra row at this width. */
  .homework-tab-divider, .homework-tab-bonus-label { display: none; }
}

@media print {
  body { background-image: none; }
  .homework-tab-chrome, .hw-rail { display: none; }
  .hw-hero { background: #fff !important; color: #000 !important; box-shadow: none; }
  .hw-hero .welcome-title-en, .hw-hero-lesson-title { color: #000 !important; }
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
  <meta name="description" content="Neft Teacher Grade 6 Reveal Math resource — Help Your Student — ${esc(homeworkPageLabel(lessonId))}: ${esc(title)}.">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Neft Teacher">
  <meta property="og:title" content="Help Your Student — ${esc(homeworkPageLabel(lessonId))}: ${esc(title)}">
  <meta property="og:description" content="Neft Teacher Grade 6 Reveal Math resource — Help Your Student — ${esc(homeworkPageLabel(lessonId))}: ${esc(title)}.">
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
window.__HW_VOCAB__ = ${vocabGlossary ? jsonForScript(vocabGlossary.entries) : "[]"};
window.__HW_VOCAB_MATCH__ = ${vocabGlossary ? jsonForScript(vocabGlossary.match) : "null"};
${HOMEWORK_TABS_JS}
${HOMEWORK_GAME_JS}
${VISUAL_LABS_JS}
// Sound engine
let soundEnabled = true;
let audioCtx = null;
let currentStreak = 0;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("sound_toggle");
  if (btn) {
    btn.textContent = soundEnabled ? "🔊" : "🔇";
    btn.title = soundEnabled ? "Mute Sound Effects" : "Unmute Sound Effects";
  }
}

function playTabSwitchSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {}
}

function playMatchSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    [440, 659.25].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.22);
    });
  } catch (e) {}
}

function playFanfareSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      gain.gain.setValueAtTime(0.09, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  } catch (e) {}
}

function speakMathWord(termEn, termEs) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const isEs = document.body.classList.contains("lang-mode-es");
    const text = isEs && termEs ? termEs : termEn;
    const lang = isEs && termEs ? "es-US" : "en-US";
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

// Confetti Particle Engine
function triggerConfettiBurst(originX, originY, count = 50) {
  try {
    let canvas = document.getElementById("hw_confetti_canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "hw_confetti_canvas";
      canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
      document.body.appendChild(canvas);
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    const colors = ["#1fa6a2", "#f2c15b", "#d9795d", "#12355b", "#10b981", "#8b5cf6"];
    const particles = [];
    const startX = originX || window.innerWidth / 2;
    const startY = originY || window.innerHeight / 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.016 + Math.random() * 0.016,
      });
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      for (let p of particles) {
        if (p.life > 0) {
          active = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.22;
          p.rotation += p.rSpeed;
          p.life -= p.decay;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (active) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(frame);
  } catch (e) {}
}

// Skill Power-Up Challenge Engine
function checkSkillPowerUp(btn, choiceIdx, correctIdx) {
  const container = document.getElementById("powerup_choices");
  const feedbackBox = document.getElementById("powerup_feedback_box");
  const contentEl = document.getElementById("powerup_feedback_content");
  if (!container || !feedbackBox || !contentEl) return;

  const buttons = container.querySelectorAll(".powerup-choice-btn");
  const isCorrect = choiceIdx === correctIdx;

  if (isCorrect) {
    btn.classList.add("is-correct");
    btn.classList.remove("is-wrong");
    buttons.forEach((b) => {
      if (b !== btn) b.disabled = true;
    });
    feedbackBox.className = "powerup-feedback-box is-success";
    feedbackBox.hidden = false;
    contentEl.innerHTML = '<span class="lang-en">🎉 <strong>Power-Up Unlocked!</strong> You earned +1 Star and mastered the key concept.</span><span class="lang-es" lang="es">🎉 <strong>¡Poder Desbloqueado!</strong> Ganaste +1 Estrella y dominaste el concepto clave.</span>';
    const badge = document.getElementById("tab_badge_learn");
    if (badge) badge.textContent = "★";
    if (typeof playFanfareSound === "function") playFanfareSound();
    if (typeof triggerConfettiBurst === "function") triggerConfettiBurst();
    try {
      localStorage.setItem(STORAGE_KEY + "_powerup_solved", "1");
    } catch (e) {}
  } else {
    btn.classList.add("is-wrong");
    feedbackBox.className = "powerup-feedback-box is-hint";
    feedbackBox.hidden = false;
    const hintEn = btn.dataset.hintEn || "Think carefully about the visual model!";
    const hintEs = btn.dataset.hintEs || "¡Piensa cuidadosamente en el modelo visual!";
    contentEl.innerHTML = '<span class="lang-en">💡 <strong>Almost!</strong> ' + hintEn + ' Give it another shot!</span><span class="lang-es" lang="es">💡 <strong>¡Casi!</strong> ' + hintEs + ' ¡Inténtalo de nuevo!</span>';
    if (typeof playFailureSound === "function") playFailureSound();
    setTimeout(() => btn.classList.remove("is-wrong"), 600);
  }
}

// Vocab Match & Master Challenge Engine
let selectedVocabChip = null;
let matchedVocabCount = 0;

function selectVocabMatchChip(chip) {
  if (chip.classList.contains("is-matched")) return;

  if (!selectedVocabChip) {
    selectedVocabChip = chip;
    chip.classList.add("is-selected");
    if (typeof playTabSwitchSound === "function") playTabSwitchSound();
    return;
  }

  if (selectedVocabChip === chip) {
    chip.classList.remove("is-selected");
    selectedVocabChip = null;
    return;
  }

  if (selectedVocabChip.dataset.side === chip.dataset.side) {
    selectedVocabChip.classList.remove("is-selected");
    selectedVocabChip = chip;
    chip.classList.add("is-selected");
    return;
  }

  const id1 = selectedVocabChip.dataset.vocabId;
  const id2 = chip.dataset.vocabId;
  const c1 = selectedVocabChip;
  const c2 = chip;
  selectedVocabChip = null;
  c1.classList.remove("is-selected");

  if (id1 === id2) {
    c1.classList.add("is-matched");
    c2.classList.add("is-matched");
    c1.disabled = true;
    c2.disabled = true;
    matchedVocabCount++;
    const countEl = document.getElementById("vocab_match_count");
    if (countEl) countEl.textContent = matchedVocabCount;
    if (typeof playMatchSound === "function") playMatchSound();

    const shell = document.getElementById("vocab_match_shell");
    const total = parseInt(shell?.dataset.vocabTotal || "0", 10);
    if (matchedVocabCount >= total && total > 0) {
      const winEl = document.getElementById("vocab_match_win");
      if (winEl) winEl.hidden = false;
      const badge = document.getElementById("tab_badge_words");
      if (badge) badge.textContent = "★";
      if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 70);
      if (typeof playSuccessArpeggio === "function") playSuccessArpeggio();
      try {
        localStorage.setItem(STORAGE_KEY + "_vocab_won", "1");
      } catch (e) {}
    }
  } else {
    c1.classList.add("is-mismatch");
    c2.classList.add("is-mismatch");
    if (typeof playFailureSound === "function") playFailureSound();
    setTimeout(() => {
      c1.classList.remove("is-mismatch");
      c2.classList.remove("is-mismatch");
    }, 600);
  }
}

function resetVocabMatchGame() {
  matchedVocabCount = 0;
  selectedVocabChip = null;
  const countEl = document.getElementById("vocab_match_count");
  if (countEl) countEl.textContent = "0";
  const winEl = document.getElementById("vocab_match_win");
  if (winEl) winEl.hidden = true;
  document.querySelectorAll(".vocab-match-chip").forEach((c) => {
    c.classList.remove("is-matched", "is-selected", "is-mismatch");
    c.disabled = false;
  });
}

function toggleVocabCardMastery(idx) {
  const btn = document.querySelector('.vocab-master-toggle[data-term-idx="' + idx + '"]');
  if (!btn) return;
  const isMastered = btn.classList.toggle("is-mastered");
  if (isMastered && typeof playTabSwitchSound === "function") playTabSwitchSound();
  try {
    localStorage.setItem(STORAGE_KEY + "_vocab_mastered_" + idx, isMastered ? "1" : "0");
  } catch (e) {}
}

function markVocabCardKnown(idx, known) {
  const card = document.getElementById("vocab_card_" + idx);
  const toggle = document.querySelector('.vocab-master-toggle[data-term-idx="' + idx + '"]');
  if (known) {
    if (card) card.classList.add("is-known");
    if (toggle) toggle.classList.add("is-mastered");
    if (typeof playMatchSound === "function") playMatchSound();
  } else {
    if (card) card.classList.remove("is-known");
    if (toggle) toggle.classList.remove("is-mastered");
  }
  try {
    localStorage.setItem(STORAGE_KEY + "_vocab_known_" + idx, known ? "1" : "0");
  } catch (e) {}
}

// Scratchpad Engine
let scratchpadCanvas = null;
let scratchpadCtx = null;
let isDrawing = false;
let scratchpadColor = "#12355b";
let isEraser = false;

function initScratchpad() {
  scratchpadCanvas = document.getElementById("hw_scratchpad_canvas");
  if (!scratchpadCanvas) return;
  scratchpadCtx = scratchpadCanvas.getContext("2d");

  function getPos(e) {
    const rect = scratchpadCanvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * scratchpadCanvas.width,
      y: ((cy - rect.top) / rect.height) * scratchpadCanvas.height,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    scratchpadCtx.beginPath();
    scratchpadCtx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    scratchpadCtx.lineCap = "round";
    scratchpadCtx.lineJoin = "round";
    if (isEraser) {
      scratchpadCtx.strokeStyle = "#ffffff";
      scratchpadCtx.lineWidth = 18;
    } else {
      scratchpadCtx.strokeStyle = scratchpadColor;
      scratchpadCtx.lineWidth = 3.5;
    }
    scratchpadCtx.lineTo(pos.x, pos.y);
    scratchpadCtx.stroke();
  }

  function stopDraw() {
    if (isDrawing) {
      isDrawing = false;
      scratchpadCtx.closePath();
    }
  }

  scratchpadCanvas.addEventListener("pointerdown", startDraw);
  scratchpadCanvas.addEventListener("pointermove", draw);
  scratchpadCanvas.addEventListener("pointerup", stopDraw);
  scratchpadCanvas.addEventListener("pointercancel", stopDraw);
  scratchpadCanvas.addEventListener("pointerleave", stopDraw);
}

function toggleScratchpad() {
  const wrap = document.getElementById("hw_scratchpad_wrapper");
  if (!wrap) return;
  const isHidden = wrap.hidden;
  wrap.hidden = !isHidden;
  if (!wrap.hidden) {
    if (!scratchpadCtx) initScratchpad();
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function setScratchpadColor(color, btn) {
  scratchpadColor = color;
  isEraser = false;
  document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const eraserBtn = document.getElementById("scratchpad_eraser_btn");
  if (eraserBtn) eraserBtn.classList.remove("is-active");
}

function toggleScratchpadEraser() {
  isEraser = !isEraser;
  const eraserBtn = document.getElementById("scratchpad_eraser_btn");
  if (eraserBtn) eraserBtn.classList.toggle("is-active", isEraser);
  if (isEraser) {
    document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("is-active"));
  } else {
    const defaultDot = document.querySelector('.color-dot[data-color="' + scratchpadColor + '"]');
    if (defaultDot) defaultDot.classList.add("is-active");
  }
}

function clearScratchpad() {
  if (!scratchpadCanvas || !scratchpadCtx) return;
  scratchpadCtx.clearRect(0, 0, scratchpadCanvas.width, scratchpadCanvas.height);
}

// Celebration & High-Five Engine
function triggerHighFive() {
  if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 90);
  if (typeof playSuccessArpeggio === "function") playSuccessArpeggio();
  const btn = document.querySelector(".btn-high-five");
  if (btn) {
    btn.classList.add("is-celebrating");
    setTimeout(() => btn.classList.remove("is-celebrating"), 1000);
  }
}

function updateCelebrationTab() {
  const problems = Array.from(document.querySelectorAll(".problem-section")).filter(
    (s) => !s.closest(".more-practice"),
  );
  const correctCount = problems.filter((s) => s.classList.contains("correct")).length;

  const bLearn = document.getElementById("badge_achieve_learn");
  const bVocab = document.getElementById("badge_achieve_vocab");
  const bPractice = document.getElementById("badge_achieve_practice");
  const bArcade = document.getElementById("badge_achieve_arcade");

  if (bLearn) bLearn.classList.add("is-unlocked");
  if (bArcade) bArcade.classList.add("is-unlocked");
  if (bPractice && correctCount >= 3) bPractice.classList.add("is-unlocked");
  try {
    if (bVocab && localStorage.getItem(STORAGE_KEY + "_vocab_won")) {
      bVocab.classList.add("is-unlocked");
    }
  } catch (e) {}

  if (correctCount >= 3) {
    if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 60);
  }
}

function updateCertStudentName(val) {
  try {
    localStorage.setItem(STORAGE_KEY + "_student_name", val);
  } catch (e) {}
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

  const studentNameInput = document.getElementById("student_name_input");
  if (studentNameInput && studentNameInput.value) {
    state.studentName = studentNameInput.value;
  }
  state.currentStreak = currentStreak;
  
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

    if (state.studentName) {
      const studentNameInput = document.getElementById("student_name_input");
      if (studentNameInput) studentNameInput.value = state.studentName;
    }
    if (typeof state.currentStreak === "number") {
      currentStreak = state.currentStreak;
      const streakBanner = document.getElementById("hw_streak_banner");
      const streakCount = document.getElementById("hw_streak_count");
      const streakCountEs = document.getElementById("hw_streak_count_es");
      if (streakBanner && streakCount && currentStreak >= 2) {
        streakCount.textContent = currentStreak;
        if (streakCountEs) streakCountEs.textContent = currentStreak;
        streakBanner.hidden = false;
      }
    }
    try {
      if (localStorage.getItem(STORAGE_KEY + "_powerup_solved") === "1") {
        const badge = document.getElementById("tab_badge_learn");
        if (badge) badge.textContent = "★";
        const btn = document.querySelector(".powerup-choice-btn[data-is-correct='true']");
        if (btn) btn.classList.add("is-correct");
      }
      if (localStorage.getItem(STORAGE_KEY + "_vocab_won") === "1") {
        const badge = document.getElementById("tab_badge_words");
        if (badge) badge.textContent = "★";
      }
      document.querySelectorAll(".vocab-master-toggle").forEach((btn) => {
        const idx = btn.dataset.termIdx;
        if (localStorage.getItem(STORAGE_KEY + "_vocab_mastered_" + idx) === "1") {
          btn.classList.add("is-mastered");
        }
      });
    } catch(e) {}
    
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

${ANSWER_MATCH_JS}

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

/* Feedback text is built in JS, so it cannot use the .lang-en/.lang-es span
   pair the rest of the page toggles. Pick the language the family is actually
   reading; fall back to English whenever no Spanish was authored. */
function pickLangText(en, es) {
  const esText = (es || "").trim();
  if (esText && document.body.classList.contains("lang-mode-es")) return esText;
  return en || "";
}


// Speech Rate & Big Idea Narration
let vocabSpeechRate = 0.9;
function toggleVocabSpeed() {
  const btn = document.getElementById("vocab_speed_btn");
  const label = document.getElementById("vocab_speed_label");
  if (vocabSpeechRate === 0.9) {
    vocabSpeechRate = 0.65;
    if (label) label.textContent = "Slow";
  } else {
    vocabSpeechRate = 0.9;
    if (label) label.textContent = "Normal";
  }
}

function speakBigIdea(textEn, textEs) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const isEs = document.body.classList.contains("lang-mode-es");
    const text = isEs && textEs ? textEs : textEn;
    const lang = isEs && textEs ? "es-US" : "en-US";
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = vocabSpeechRate;
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

// Math Talk Prompt Spinner
const mathTalkList = [
  {
    qEn: "Can you show me how you see that in the picture above?",
    qEs: "¿Puedes mostrarme cómo ves eso en el dibujo de arriba?",
    fEn: "Follow-up: Point to where the numbers match the visual model.",
    fEs: "Seguimiento: Señala dónde los números coinciden con el modelo visual.",
  },
  {
    qEn: "What would happen if we doubled the numbers in this problem?",
    qEs: "¿Qué pasaría si duplicamos los números de este problema?",
    fEn: "Follow-up: Does the relationship stay the same or change?",
    fEs: "Seguimiento: ¿La relación se mantiene igual o cambia?",
  },
  {
    qEn: "What is another way we could solve or explain this together?",
    qEs: "¿De qué otra forma podríamos resolverlo o explicarlo juntos?",
    fEn: "Follow-up: Can we check it using another model or tool?",
    fEs: "Seguimiento: ¿Podemos comprobarlo usando otra herramienta o modelo?",
  },
  {
    qEn: "How would you explain this step to a 5th grader?",
    qEs: "¿Cómo le explicarías este paso a un estudiante de 5.º grado?",
    fEn: "Follow-up: What vocabulary word makes the explanation clearest?",
    fEs: "Seguimiento: ¿Qué palabra de vocabulario hace más clara la explicación?",
  },
  {
    qEn: "Before we calculate, what is a reasonable estimate for the answer?",
    qEs: "¿Antes de calcular, cuál es una estimación razonable para la respuesta?",
    fEn: "Follow-up: Should the answer be bigger or smaller than the starting numbers?",
    fEs: "Seguimiento: ¿La respuesta debe ser mayor o menor que los números iniciales?",
  }
];
let currentTalkIdx = 0;

function spinMathTalkPrompt() {
  currentTalkIdx = (currentTalkIdx + 1) % mathTalkList.length;
  const item = mathTalkList[currentTalkIdx];
  const qEn = document.getElementById("math_talk_en");
  const qEs = document.getElementById("math_talk_es");
  const fEn = document.getElementById("math_talk_follow_en");
  const fEs = document.getElementById("math_talk_follow_es");
  if (qEn) qEn.textContent = item.qEn;
  if (qEs) qEs.textContent = item.qEs;
  if (fEn) fEn.textContent = item.fEn;
  if (fEs) fEs.textContent = item.fEs;
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
  const card = document.getElementById("math_talk_card");
  if (card) {
    card.classList.add("is-spinning");
    setTimeout(() => card.classList.remove("is-spinning"), 300);
  }
}

// Vocabulary Filter Engine
function filterVocabCards(filter, btn) {
  document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const cards = document.querySelectorAll(".vocab-card");
  cards.forEach(card => {
    const isMastered = card.querySelector(".vocab-master-toggle.is-mastered") !== null;
    if (filter === "all") {
      card.style.display = "";
    } else if (filter === "mastered") {
      card.style.display = isMastered ? "" : "none";
    } else if (filter === "review") {
      card.style.display = isMastered ? "none" : "";
    }
  });
}

// In-Page Workbench Tools
function switchWorkbenchTool(tool) {
  document.querySelectorAll(".wb-tool-tab").forEach(t => t.classList.remove("is-active"));
  document.querySelectorAll(".wb-panel").forEach(p => p.hidden = true);
  const activeTab = document.getElementById("wb_tab_" + tool);
  const activePanel = document.getElementById("wb_panel_" + tool);
  if (activeTab) activeTab.classList.add("is-active");
  if (activePanel) activePanel.hidden = false;
  if (tool === "coords") drawCoordGrid();
  if (tool === "tapes") updateTapeDiagram();
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
}

function addFractionBar(denom) {
  const stage = document.getElementById("fraction_stage_canvas");
  if (!stage) return;
  const row = document.createElement("div");
  row.className = "fraction-row";
  for (let i = 0; i < denom; i++) {
    const tile = document.createElement("div");
    tile.className = "frac-tile tile-" + denom;
    tile.textContent = "1/" + denom;
    row.appendChild(tile);
  }
  stage.appendChild(row);
  if (typeof playMatchSound === "function") playMatchSound();
}

function clearFractionBars() {
  const stage = document.getElementById("fraction_stage_canvas");
  if (!stage) return;
  stage.innerHTML = '<div class="fraction-row ref-row"><div class="frac-tile tile-1">1 Whole / Entero (1.0)</div></div>';
}

function drawCoordGrid() {
  const svg = document.getElementById("interactive_coord_svg");
  if (!svg || svg.dataset.drawn) return;
  svg.dataset.drawn = "1";
  let content = "";
  for (let i = -5; i <= 5; i++) {
    const pos = i * 20;
    content += '<line x1="' + pos + '" y1="-100" x2="' + pos + '" y2="100" stroke="#e2e8f0" stroke-width="1" />';
    content += '<line x1="-100" y1="' + pos + '" x2="100" y2="' + pos + '" stroke="#e2e8f0" stroke-width="1" />';
  }
  content += '<line x1="-105" y1="0" x2="105" y2="0" stroke="#1e293b" stroke-width="2" />';
  content += '<line x1="0" y1="-105" x2="0" y2="105" stroke="#1e293b" stroke-width="2" />';
  content += '<circle id="coord_plot_dot" cx="0" cy="0" r="5" fill="#e11d48" />';
  svg.innerHTML = content;
}

function clickCoordGrid(e) {
  const svg = document.getElementById("interactive_coord_svg");
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  const gridX = Math.round(((rawX / rect.width) * 240 - 120) / 20);
  const gridY = Math.round(-(((rawY / rect.height) * 240 - 120) / 20));
  const clampedX = Math.max(-5, Math.min(5, gridX));
  const clampedY = Math.max(-5, Math.min(5, gridY));
  const dot = document.getElementById("coord_plot_dot");
  if (dot) {
    dot.setAttribute("cx", clampedX * 20);
    dot.setAttribute("cy", -clampedY * 20);
  }
  let quad = "Axes / Ejes";
  if (clampedX > 0 && clampedY > 0) quad = "Quadrant I (+, +)";
  else if (clampedX < 0 && clampedY > 0) quad = "Quadrant II (−, +)";
  else if (clampedX < 0 && clampedY < 0) quad = "Quadrant III (−, −)";
  else if (clampedX > 0 && clampedY < 0) quad = "Quadrant IV (+, −)";
  else if (clampedX === 0 && clampedY === 0) quad = "Origin (0, 0)";
  const readout = document.getElementById("coord_readout");
  if (readout) readout.textContent = "(x: " + clampedX + ", y: " + clampedY + ") — " + quad;
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
}

function updateTapeDiagram() {
  const a = parseInt(document.getElementById("tape_slider_a")?.value || "3", 10);
  const b = parseInt(document.getElementById("tape_slider_b")?.value || "4", 10);
  const f = parseInt(document.getElementById("tape_slider_factor")?.value || "2", 10);
  const valA = document.getElementById("tape_val_a");
  const valB = document.getElementById("tape_val_b");
  const valF = document.getElementById("tape_val_factor");
  if (valA) valA.textContent = a * f + " (" + a + "×" + f + ")";
  if (valB) valB.textContent = b * f + " (" + b + "×" + f + ")";
  if (valF) valF.textContent = "×" + f;

  const render = document.getElementById("tape_diagram_render");
  if (!render) return;
  let html = '<div class="tape-bar-row"><span class="tape-label">Part A (' + (a*f) + '):</span><div class="tape-blocks">';
  for (let i = 0; i < a; i++) html += '<div class="tape-block tape-block-a">' + f + '</div>';
  html += '</div></div><div class="tape-bar-row"><span class="tape-label">Part B (' + (b*f) + '):</span><div class="tape-blocks">';
  for (let j = 0; j < b; j++) html += '<div class="tape-block tape-block-b">' + f + '</div>';
  html += '</div></div>';
  render.innerHTML = html;
}

function setScratchpadGrid(gridType, btn) {
  document.querySelectorAll(".grid-btn").forEach(b => b.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const canvas = document.getElementById("hw_scratchpad_canvas");
  if (!canvas) return;
  canvas.classList.remove("canvas-bg-graph", "canvas-bg-dots");
  if (gridType === "graph") canvas.classList.add("canvas-bg-graph");
  if (gridType === "dots") canvas.classList.add("canvas-bg-dots");
}

function setCertRibbon(theme, btn) {
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  const cert = document.querySelector(".print-cert-card");
  if (!cert) return;
  cert.classList.remove("theme-emerald", "theme-sapphire", "theme-ruby");
  if (theme !== "gold") cert.classList.add("theme-" + theme);
  if (typeof playTabSwitchSound === "function") playTabSwitchSound();
}

function updateCertParentName(val) {
  const pName = document.getElementById("cert_parent_name");
  if (pName) pName.textContent = val || "Family Coach";
}

function checkProblem(idx, options) {
  const silent = options && options.silent;
  const section = document.getElementById("problem_" + idx);
  if (!section) return { correct: false, message: "" };

  const type = section.dataset.problemType;
  let isProblemCorrect = true;
  let feedbackMessage = "";

  section.classList.remove("correct", "incorrect");
  const explanationBoxes = section.querySelectorAll(".explanation-box, .visual-explanation-card");
  explanationBoxes.forEach((b) => b.remove());

  if (type === "multiple-choice") {
      const container = section.querySelector(".mc-options");
      const selected = container.querySelector("input[type='radio']:checked");
      const correctIdx = container.dataset.correct;
      const explanation = pickLangText(container.dataset.explanation, container.dataset.explanationEs);
      let choiceFeedback = [];
      try {
        choiceFeedback = JSON.parse(container.dataset.choiceFeedback || "[]");
      } catch (e) {
        choiceFeedback = [];
      }
      
      // Reset radio option styles
      const labels = container.querySelectorAll(".mc-option-label");
      labels.forEach(l => l.classList.remove("is-correct", "is-incorrect"));
      
      let selectedFeedback = "";
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
          selectedFeedback = choiceFeedback[val] || "";
        }
      }
      
      // Append visual explanation if checked
      if (selected) {
        const expDiv = document.createElement("div");
        expDiv.className = "visual-explanation-card explanation-box";
        let html = '<div class="exp-header"><span>' + (isProblemCorrect ? '✅ Solved! How to understand it / Por qué funciona' : '🔍 Walkthrough / Repaso visual') + '</span></div>';
        if (!isProblemCorrect && selectedFeedback) {
          html += '<div class="exp-trap"><strong>⚠️ Common Trap / Trampa común:</strong> ' + selectedFeedback + '</div>';
        }
        if (explanation) {
          html += '<div class="exp-why"><strong>💡 Key Step:</strong> ' + explanation + '</div>';
        }
        html += '<div class="exp-coach"><strong>💬 Parent Coach Tip:</strong> Ask your student: <em>“In your own words, why does the highlighted green choice fit best?”</em></div>';
        expDiv.innerHTML = html;
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
        } else if (NTAnswerMatch.isRight(studentVal, correctVal)) {
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
      const explanation = pickLangText(container?.dataset.explanation, container?.dataset.explanationEs);
      if (isProblemCorrect) {
        feedbackMessage = "✓ Correct! Nice work — see the explanation above.";
      } else if (!section.querySelector("input[type='radio']:checked")) {
        feedbackMessage = "Choose an answer, then check again.";
      } else {
        feedbackMessage = "Not quite — the correct choice is highlighted in green. Review the visual walkthrough above!";
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
    currentStreak++;
  } else {
    section.classList.add("incorrect");
    currentStreak = 0;
  }

  // Update live streak banner
  const streakBanner = document.getElementById("hw_streak_banner");
  const streakCount = document.getElementById("hw_streak_count");
  const streakCountEs = document.getElementById("hw_streak_count_es");
  if (streakBanner && streakCount) {
    if (currentStreak >= 2) {
      streakCount.textContent = currentStreak;
      if (streakCountEs) streakCountEs.textContent = currentStreak;
      streakBanner.hidden = false;
    } else {
      streakBanner.hidden = true;
    }
  }

  setProblemCheckResult(idx, isProblemCorrect, feedbackMessage);

  if (!silent) {
    playCheckSound(isProblemCorrect);
    if (isProblemCorrect) {
      triggerConfettiBurst(null, null, 40);
    }
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

  // 3-Star Milestone Check
  if (correctCount >= 3) {
    const goalBanner = document.getElementById("goal_reached_banner");
    if (goalBanner && goalBanner.hidden) {
      goalBanner.hidden = false;
      if (typeof playFanfareSound === "function") playFanfareSound();
      if (typeof triggerConfettiBurst === "function") triggerConfettiBurst(null, null, 100);
      const checkBadge = document.getElementById("tab_badge_check");
      if (checkBadge) checkBadge.textContent = "★★★";
    }
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

  if (correctCount >= 3) {
    const goalBanner = document.getElementById("goal_reached_banner");
    if (goalBanner && goalBanner.hidden) {
      goalBanner.hidden = false;
      const checkBadge = document.getElementById("tab_badge_check");
      if (checkBadge) checkBadge.textContent = "★★★";
    }
    triggerConfettiBurst(null, null, 100);
    playFanfareSound();
  } else if (correctCount === total && total > 0) {
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

  const staleHomework = [];
  for (const { id, config } of lessons) {
    const homeworkHtml = localizeBilingualLabels(generateHtml(id, config));
    const lessonPath = join(lessonsDir, id, "homework.html");
    const normalizedHtml = `${homeworkHtml.replace(/^ {12}$/gm, "").trimEnd()}\n`;
    // --check: report drift, write nothing. This page does NOT run in
    // `npm run build`, so it rots whenever a config field it renders is added
    // later — which is exactly how 18 pages ended up missing the vocabulary
    // `visual` hints two enrichment waves had already authored.
    if (CHECK) {
      if (!isGeneratedFresh(lessonPath, normalizedHtml))
        staleHomework.push(`lessons/${id}/homework.html`);
      continue;
    }
    // writeGenerated, NOT writeFileSync: this generator rebuilds the page from
    // the config alone, so a raw write drops every sentinel layer injected into
    // it afterwards. Each homework.html carries five (mobile-access, nsr, mwb,
    // enthead, canvas-bridge), and losing them is invisible here — the page
    // still renders — but `npm run validate:injection` fails with "N page(s)
    // lost a layer" and the Canvas/mobile/save-resume wiring is gone in class.
    writeGenerated(lessonPath, normalizedHtml);
    count++;
  }

  if (CHECK) {
    if (staleHomework.length) {
      console.error(
        `${staleHomework.length} homework page(s) are STALE — the committed HTML no longer matches its config.json:\n  ${staleHomework
          .slice(0, 20)
          .join("\n  ")}\n\nFix: node scripts/generate-homework-html.mjs`,
      );
      process.exit(1);
    }
    console.log(`Homework pages up to date (${lessons.length} lessons).`);
    return;
  }
  console.log(`Successfully generated ${count} interactive homework HTML files.`);
}

main();
