// One grade-experience registry drives the Lab's visual language and instructional voice.
// The shared activity engines (skills, models, practice, writing and progress) remain common.
import { getLang } from "./i18n.js";
import { applyGradeSystem, gradeScene } from "./e8/grade-system.js";
const PROFILES = {
  0: {
    id: "wonder-starters", name: "Wonder Starters", kicker: "A tactile counting & subitizing studio",
    invitation: "Tap, listen, move the counters, and see how five and ten come together.",
    focus: "Five-frames · ten-frames · subitizing · hidden parts",
    es: { name: "Exploradores Iniciales", kicker: "Un estudio táctil para contar y descubrir", invitation: "Toca, escucha, mueve las fichas y mira cómo se forman el cinco y el diez.", focus: "Marcos de cinco · marcos de diez · partes escondidas" },
    colors: ["#d95f43", "#fff5ee", "#7c2d12"], font: '"Fraunces", Georgia, serif', radius: "26px", density: "1.18",
    art: '<rect x="18" y="34" width="104" height="52" rx="14" fill="#fff" stroke="currentColor" stroke-width="4"/><path d="M39 35v50M60 35v50M81 35v50M102 35v50" stroke="currentColor" stroke-width="2" opacity=".28"/><g fill="#d95f43"><circle cx="28.5" cy="60" r="8"/><circle cx="49.5" cy="60" r="8"/><circle cx="70.5" cy="60" r="8"/></g><g fill="#1fa6a2"><circle cx="91.5" cy="60" r="8"/><circle cx="112.5" cy="60" r="8"/></g>'
  },
  1: {
    id: "little-mathematicians", name: "Little Mathematicians", kicker: "A picture-book world for big ideas",
    invitation: "Look, tap, count, and tell what you notice. You can draw your idea, too.",
    focus: "One idea at a time · pictures first · talk it through",
    es: { name: "Pequeños matemáticos", kicker: "Un mundo de cuento para grandes ideas", invitation: "Mira, toca, cuenta y di lo que notas. También puedes dibujar tu idea.", focus: "Una idea a la vez · primero las imágenes · conversemos" },
    colors: ["#c94f64", "#fff0ec", "#7d2f42"], font: '"Fraunces", Georgia, serif', radius: "24px", density: "1.12",
    art: '<rect x="20" y="31" width="78" height="72" rx="14" fill="#fff" stroke="currentColor" stroke-width="4"/><path d="M59 32v70M21 67h76" stroke="currentColor" stroke-width="2" opacity=".28"/><g fill="#ef9b55"><circle cx="39" cy="50" r="7"/><circle cx="78" cy="50" r="7"/><circle cx="39" cy="84" r="7"/><circle cx="78" cy="84" r="7"/></g><path d="m114 67 9 10 19-23" fill="none" stroke="#1fa6a2" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  2: {
    id: "confident-explorers", name: "Confident Explorers", kicker: "A playful place-value workshop",
    invitation: "Build it, break it apart, and choose a strategy that makes sense to you.",
    focus: "Place-value blocks · regrouping · hundred-chart patterns",
    es: { name: "Exploradores seguros", kicker: "Un taller divertido de valor posicional", invitation: "Constrúyelo, desármalo y elige una estrategia que tenga sentido para ti.", focus: "Bloques de valor posicional · reagrupación · patrones en la tabla del cien" },
    colors: ["#ad681e", "#fff3dc", "#70400f"], font: '"Avenir Next", "Segoe UI", sans-serif', radius: "20px", density: "1.06",
    art: '<rect x="25" y="63" width="32" height="32" rx="5" fill="#f2c15b"/><rect x="66" y="38" width="17" height="57" rx="4" fill="#1fa6a2"/><path d="M94 48h38m-38 18h38m-38 18h38" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="116" cy="34" r="10" fill="#d8613c"/>'
  },
  3: {
    id: "math-discoverers", name: "Math Discoverers", kicker: "An illustrated discovery studio",
    invitation: "Find a pattern, test a conjecture, and connect the picture to your number sentence.",
    focus: "Arrays · equal groups · fractions · number lines",
    es: { name: "Descubridores de matemáticas", kicker: "Un estudio ilustrado para descubrir", invitation: "Encuentra un patrón, prueba una conjetura y conecta la imagen con tu oración numérica.", focus: "Arreglos · grupos iguales · fracciones · rectas numéricas" },
    colors: ["#43804b", "#edf6e8", "#2e5c35"], font: '"Avenir Next", "Segoe UI", sans-serif', radius: "17px", density: "1.02",
    art: '<g fill="#1fa6a2"><circle cx="36" cy="40" r="7"/><circle cx="62" cy="40" r="7"/><circle cx="88" cy="40" r="7"/><circle cx="36" cy="67" r="7"/><circle cx="62" cy="67" r="7"/><circle cx="88" cy="67" r="7"/><circle cx="36" cy="94" r="7"/><circle cx="62" cy="94" r="7"/><circle cx="88" cy="94" r="7"/></g><path d="M24 112h86m-71-5v10m43-10v10m43-10v10" stroke="currentColor" stroke-width="3"/><path d="m118 43 8 8 16-19" fill="none" stroke="#d8613c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  4: {
    id: "math-investigators", name: "Math Investigators", kicker: "A visual mathematics studio",
    invitation: "Compare representations, look for equivalence, and organize each step of your reasoning.",
    focus: "Fraction equivalence · area models · multi-step strategy",
    es: { name: "Investigadores de matemáticas", kicker: "Un estudio visual de matemáticas", invitation: "Compara representaciones, busca equivalencias y organiza cada paso de tu razonamiento.", focus: "Fracciones equivalentes · modelos de área · estrategias de varios pasos" },
    colors: ["#247568", "#e5f3ef", "#15564d"], font: '"Avenir Next", "Segoe UI", sans-serif', radius: "15px", density: "1",
    art: '<rect x="24" y="34" width="122" height="27" rx="5" fill="#dcebe5" stroke="currentColor" stroke-width="2"/><path d="M54 35v25m30-25v25m30-25v25" stroke="currentColor" stroke-width="2"/><rect x="24" y="74" width="122" height="27" rx="5" fill="#dcebe5" stroke="currentColor" stroke-width="2"/><path d="M44 75v25m20-25v25m21-25v25m20-25v25m21-25v25" stroke="currentColor" stroke-width="2"/><path d="M26 48h58m2 39h39" stroke="#d8613c" stroke-width="8" stroke-linecap="round"/>'
  },
  5: {
    id: "math-designers", name: "Math Designers", kicker: "A studio for building and testing models",
    invitation: "Choose a representation, solve a realistic problem, and show why your strategy works.",
    focus: "Decimal grids · fraction operations · volume models",
    es: { name: "Diseñadores de matemáticas", kicker: "Un estudio para construir y probar modelos", invitation: "Elige una representación, resuelve un problema realista y muestra por qué funciona tu estrategia.", focus: "Cuadrículas decimales · operaciones con fracciones · modelos de volumen" },
    colors: ["#326c9e", "#eaf2f8", "#21496a"], font: '"Avenir Next", "Segoe UI", sans-serif', radius: "14px", density: ".98",
    art: '<rect x="27" y="27" width="83" height="83" rx="7" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M43 28v81m16-81v81m17-81v81m17-81v81M28 44h81M28 60h81M28 77h81M28 94h81" stroke="currentColor" stroke-width="1.5" opacity=".45"/><path d="M29 29h31v31H29zm33 0h15v31H62zm-33 33h31v15H29z" fill="#1fa6a2" opacity=".78"/><path d="m119 92 14-14 13 14v16h-27z" fill="#f2c15b" stroke="currentColor" stroke-width="2"/>'
  },
  6: {
    id: "math-investigators-pro", name: "Math Investigators Pro", kicker: "A premium middle-school workspace",
    invitation: "Connect ratios, expressions, and data with models you can inspect and change.",
    focus: "Ratios · expressions · integers · geometry · data",
    es: { name: "Investigadores de matemáticas Pro", kicker: "Un espacio avanzado para la escuela intermedia", invitation: "Conecta razones, expresiones y datos con modelos que puedes examinar y cambiar.", focus: "Razones · expresiones · enteros · geometría · datos" },
    colors: ["#197e83", "#e3f2f1", "#12575a"], font: '"Avenir Next", "Segoe UI", sans-serif', radius: "13px", density: ".96",
    art: '<path d="M27 102h116M42 32v75" stroke="currentColor" stroke-width="3"/><path d="M45 91 66 77l21-3 19-27 26-17" fill="none" stroke="#1fa6a2" stroke-width="5" stroke-linecap="round"/><g fill="#f2c15b" stroke="currentColor" stroke-width="2"><circle cx="45" cy="91" r="5"/><circle cx="66" cy="77" r="5"/><circle cx="87" cy="74" r="5"/><circle cx="106" cy="47" r="5"/><circle cx="132" cy="30" r="5"/></g><path d="M44 116h89" stroke="#d8613c" stroke-width="2" stroke-dasharray="4 5"/>'
  },
  7: {
    id: "math-strategists", name: "Math Strategists", kicker: "A clear, focused problem-solving desk",
    invitation: "Select a strategy, defend your choices, and check whether your result fits the situation.",
    focus: "Rational numbers · proportional reasoning · probability",
    es: { name: "Estrategas de matemáticas", kicker: "Un espacio claro y enfocado para resolver problemas", invitation: "Elige una estrategia, justifica tus decisiones y comprueba si tu resultado corresponde a la situación.", focus: "Números racionales · razonamiento proporcional · probabilidad" },
    colors: ["#a64d35", "#faeee8", "#713522"], font: '"Avenir Next", "Segoe UI", sans-serif', radius: "12px", density: ".94",
    art: '<path d="M28 95h118M40 32v77" stroke="currentColor" stroke-width="3"/><path d="M43 89 66 71l19 8 23-38 27-10" fill="none" stroke="#d8613c" stroke-width="5" stroke-linecap="round"/><path d="M44 50h88" stroke="#1fa6a2" stroke-width="2" stroke-dasharray="6 5"/><path d="m56 113 13 13 25-29" fill="none" stroke="#1fa6a2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  8: {
    id: "algebra-modeling-studio", name: "Algebra & Modeling Studio", kicker: "A mature workspace for algebraic thinking",
    invitation: "Represent relationships, test a model, and justify what the mathematics says.",
    focus: "Linear relationships · systems · exponents · geometric proof",
    es: { name: "Estudio de álgebra y modelado", kicker: "Un espacio avanzado para pensar algebraicamente", invitation: "Representa relaciones, prueba un modelo y justifica lo que indican las matemáticas.", focus: "Relaciones lineales · sistemas · exponentes · demostración geométrica" },
    colors: ["#245573", "#e8f0f4", "#183c53"], font: '"Avenir Next", "Segoe UI", sans-serif', radius: "11px", density: ".92",
    art: '<path d="M24 103h126M39 26v91" stroke="currentColor" stroke-width="3"/><path d="M45 91 132 39M45 39 132 91" fill="none" stroke="#1fa6a2" stroke-width="4"/><circle cx="89" cy="65" r="7" fill="#f2c15b" stroke="currentColor" stroke-width="2"/><path d="M76 65h26M89 52v26" stroke="currentColor" stroke-width="2"/><path d="M114 24h27v21h-27z" fill="#f2c15b" stroke="currentColor" stroke-width="2"/><text x="127" y="40" text-anchor="middle" font-size="15" font-family="sans-serif" fill="#17324d">x</text>'
  },
};

// These settings are consumed by the shell and its existing grade-aware lesson, language,
// feedback and writing systems. They describe presentation choices, never a learner label.
const INSTRUCTION = {
  0: { navigation: "one-task", reading: "pre-reader-audio", model: "five-ten-frame-counters", explanation: "listen-tap-show", feedback: "warm-voice-burst", writing: "voice-and-stamp" },
  1: { navigation: "one-task", reading: "emerging", model: "counters-ten-frame", explanation: "say-draw-short-sentence", feedback: "warm-next-step", writing: "draw-label-one-sentence" },
  2: { navigation: "guided-steps", reading: "early-fluent", model: "base-ten-hundred-chart", explanation: "place-value-number-sentence", feedback: "strategy-nudge", writing: "short-reasoning" },
  3: { navigation: "visual-discovery", reading: "fluent-elementary", model: "arrays-groups-number-line", explanation: "sentence-supported-strategy", feedback: "strategy-and-check", writing: "equation-and-reason" },
  4: { navigation: "investigate-compare", reading: "fluent-elementary", model: "fraction-area-equivalence", explanation: "organized-multi-step", feedback: "compare-and-revise", writing: "organized-reasoning" },
  5: { navigation: "design-and-test", reading: "upper-elementary", model: "decimal-grid-volume", explanation: "multi-step-units", feedback: "model-and-reason", writing: "multi-part-response" },
  6: { navigation: "analytical-workspace", reading: "middle-school", model: "ratio-table-balance-line", explanation: "concept-connection", feedback: "diagnostic-coaching", writing: "claim-evidence-reasoning" },
  7: { navigation: "strategy-workspace", reading: "middle-school", model: "proportion-graph-probability", explanation: "strategy-justification", feedback: "compare-strategies", writing: "constructed-response" },
  8: { navigation: "modeling-studio", reading: "early-algebra", model: "coordinate-system-function", explanation: "algebraic-justification", feedback: "evidence-and-transfer", writing: "algebraic-constructed-response" },
};

const esc = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

export function gradeExperience(grade) {
  if (grade === null || grade === undefined || grade === "") return null;
  const number = grade === "K" || grade === "k" ? 0 : Number(grade);
  return Number.isInteger(number) && PROFILES[number] ? { ...PROFILES[number], instruction: INSTRUCTION[number] } : null;
}

export function applyGradeExperience(grade) {
  const profile = gradeExperience(grade);
  const root = document.documentElement;
  applyGradeSystem(profile ? grade : null);
  const banner = document.querySelector("#grade-experience-banner");
  if (!profile) {
    root.removeAttribute("data-grade-experience");
    for (const attribute of ["primaryFlow", "readingBand", "modelEmphasis", "explanationStyle", "feedbackStyle", "writingStyle"]) delete root.dataset[attribute];
    root.style.setProperty("--grade", "#e59b46");
    for (const token of ["--experience-wash", "--experience-ink", "--experience-font", "--experience-radius", "--experience-card-gap"]) root.style.removeProperty(token);
    if (banner) banner.innerHTML = "";
    return null;
  }
  root.dataset.gradeExperience = String(grade);
  root.dataset.primaryFlow = profile.instruction.navigation;
  root.dataset.readingBand = profile.instruction.reading;
  root.dataset.modelEmphasis = profile.instruction.model;
  root.dataset.explanationStyle = profile.instruction.explanation;
  root.dataset.feedbackStyle = profile.instruction.feedback;
  root.dataset.writingStyle = profile.instruction.writing;
  root.style.setProperty("--grade", profile.colors[0]);
  root.style.setProperty("--experience-wash", profile.colors[1]);
  root.style.setProperty("--experience-ink", profile.colors[2]);
  root.style.setProperty("--experience-font", profile.font);
  root.style.setProperty("--experience-radius", profile.radius);
  root.style.setProperty("--experience-card-gap", `${profile.density}rem`);
  if (banner) banner.innerHTML = gradeExperienceBanner(grade);
  document.querySelectorAll("[data-experience-grade]").forEach((node) => node.textContent = String(grade));
  return profile;
}

export function gradeExperienceBanner(grade) {
  const profile = gradeExperience(grade);
  if (!profile) return "";
  const isSpanish = getLang() === "es";
  const copy = isSpanish ? profile.es : profile;
  const label = isSpanish ? `Experiencia de aprendizaje de grado ${grade}` : `Grade ${grade} learning experience`;
  return `<section class="grade-experience-banner" aria-label="${esc(label)}"><div class="grade-experience-art" aria-hidden="true">${gradeScene(grade) || `<svg viewBox="0 0 170 140" focusable="false">${profile.art}</svg>`}</div><div class="grade-experience-copy"><p class="grade-experience-kicker">${esc(copy.kicker)}</p><h2>${esc(copy.name)}</h2><p>${esc(copy.invitation)}</p><span class="grade-experience-focus">${esc(copy.focus)}</span></div></section>`;
}

export const GRADE_EXPERIENCE_GRADES = Object.freeze(Object.keys(PROFILES).map(Number));
