/**
 * The family experience layer for a homework page: what a family sees first and
 * what makes finishing feel good.
 *
 *   - the "tonight" strip (time, what you need, the goal) that replaces the stop count
 *   - the goal of four: an honest, reachable target with a visible meter
 *   - the mystery challenge: tonight's hardest problem, shown first, unlocked by finishing the goal
 *   - the confidence check: a plant that grows, asked before and after, kept on the device
 *   - teach-it-back: the one routine every route ends with, in any language first
 *   - share the win, and bilingual in-page toasts/dialogs (no native alert/confirm)
 *
 * Everything here is written for English and Spanish only. Client behavior lives in
 * homework-experience-js.mjs, styles in homework-experience-css.mjs; this file is markup.
 */

export const GOAL_TARGET = 4;
export const GOAL_QUICK = 2;

/** Route times, one source for the strip, the route chooser and the hub. */
export const ROUTE_TIMES = { quick: "5–10", full: "20–30" };

/** The route a first visit lands on. Keep in step with HOMEWORK_ROUTE_DEFAULT in homework-guided-notes.mjs. */
export const DEFAULT_ROUTE = "quick";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;

/** Stems that point at a picture, table or graph cannot stand alone as a teaser. */
const POINTS_ELSEWHERE =
  /\b(below|above|shown|table|graph|figure|picture|diagram|chart|plot|number line|grid|model|look at|following)\b/i;

/**
 * The mystery challenge is the page's hardest problem, so the last Level-up
 * item. Its stem is quoted only when it reads on its own; otherwise the card
 * still renders (every page has one) and names the problem without quoting it.
 */
export function pickMystery(challenge, offset) {
  const items = Array.isArray(challenge) ? challenge : [];
  if (!items.length) return null;
  const standalone = (it) => {
    const en = String(it?.stem ?? "").trim();
    const es = String(it?.stemEs ?? "").trim();
    return en.length > 0 && en.length <= 170 && es.length > 0 && !POINTS_ELSEWHERE.test(en);
  };
  for (let i = items.length - 1; i >= 0; i--) {
    if (standalone(items[i])) {
      return { index: offset + i, stemEn: items[i].stem.trim(), stemEs: items[i].stemEs.trim() };
    }
  }
  return { index: offset + items.length - 1, stemEn: "", stemEs: "" };
}

export function renderMysteryChallenge(mystery) {
  if (!mystery) return "";
  const stem = mystery.stemEn
    ? `<p class="hw-mystery-stem"><span class="lang-en">${esc(mystery.stemEn)}</span><span class="lang-es" lang="es">${esc(mystery.stemEs)}</span></p>`
    : `<p class="hw-mystery-stem">${bi(
        "It is the last problem in Level up. It is the hardest one — and you can do it.",
        "Es el último problema de «Sube de nivel». Es el más difícil, y tú puedes resolverlo.",
      )}</p>`;
  return `
      <section class="hw-mystery" id="hw_mystery" data-problem="problem_${mystery.index}" aria-labelledby="hw_mystery_title">
        <span class="hw-mystery-lock" id="hw_mystery_lock" aria-hidden="true">🔒</span>
        <div class="hw-mystery-body">
          <p class="hw-eyebrow hw-inline">${bi("Tonight's mystery challenge", "El reto misterioso de hoy")}</p>
          <h3 id="hw_mystery_title">${bi("Can you crack this before tonight is over?", "¿Puedes resolver esto antes de terminar hoy?")}</h3>
          ${stem}
          <p class="hw-mystery-status" id="hw_mystery_status" role="status" aria-live="polite">
            <span class="lang-en">Locked. Finish <span data-hw-goal-count>${GOAL_TARGET}</span> problems and it opens.</span>
            <span class="lang-es" lang="es">Bloqueado. Termina <span data-hw-goal-count>${GOAL_TARGET}</span> problemas y se abre.</span>
          </p>
          <button type="button" class="hw-mystery-open" id="hw_mystery_open" hidden onclick="hwOpenMystery()">
            ${bi("Open the mystery challenge ➔", "Abrir el reto misterioso ➔")}
          </button>
        </div>
      </section>`;
}

const PLANT = [
  { level: 1, icon: "🌱", en: "Just starting", es: "Empezando" },
  { level: 2, icon: "🌿", en: "Getting there", es: "Casi lo logro" },
  { level: 3, icon: "🌳", en: "I could teach it", es: "Lo puedo explicar" },
];

/** `phase` is "before" (top of Learn) or "after" (Done). One widget, two moments. */
export function renderConfidence(phase) {
  const before = phase === "before";
  const question = before
    ? bi(
        "How sure do you feel about today's math?",
        "¿Qué tan seguro o segura te sientes con la matemática de hoy?",
      )
    : bi("How sure do you feel now?", "¿Qué tan seguro o segura te sientes ahora?");
  const note = before
    ? bi(
        "Just for you. It stays on this device. We ask again at the end.",
        "Solo para ti. Se queda en este dispositivo. Preguntamos otra vez al final.",
      )
    : bi("Compare it with how you felt at the start.", "Compáralo con cómo te sentías al empezar.");
  const buttons = PLANT.map(
    (
      p,
    ) => `<button type="button" class="hw-conf-btn" aria-pressed="false" data-conf-level="${p.level}" data-conf-phase="${phase}" onclick="hwSetConfidence('${phase}', ${p.level})">
            <span class="hw-conf-icon" aria-hidden="true">${p.icon}</span>
            <span class="hw-conf-label hw-stack">${bi(p.en, p.es)}</span>
          </button>`,
  ).join("");
  return `
      <section class="hw-confidence" id="hw_conf_${phase}" data-conf-phase="${phase}" aria-labelledby="hw_conf_${phase}_title">
        <h3 id="hw_conf_${phase}_title">${question}</h3>
        <div class="hw-conf-row" role="group" aria-labelledby="hw_conf_${phase}_title">${buttons}</div>
        <p class="hw-conf-note">${note}</p>
        ${before ? "" : '<p class="hw-conf-growth" id="hw_conf_growth" role="status" aria-live="polite"></p>'}
      </section>`;
}

/** Teach-it-back replaces the one-line "explain an answer" paragraph at the top of Done. */
export function renderTeachBack(config) {
  const words = (config?.vocabulary || []).filter((v) => v?.term).slice(0, 3);
  const chips = words.length
    ? `<ul class="hw-teach-words" aria-label="Words to use">${words
        .map(
          (v) =>
            `<li><strong>${esc(v.term)}</strong><span class="lang-es" lang="es"> · ${esc(v.termEs || v.translation || v.term)}</span></li>`,
        )
        .join("")}</ul>`
    : "";
  return `
      <section class="hw-teach" aria-labelledby="hw_teach_title">
        <p class="hw-eyebrow hw-inline">${bi("The last step", "El último paso")}</p>
        <h3 id="hw_teach_title">${bi("Teach it to someone", "Enséñaselo a alguien")}</h3>
        <ol class="hw-teach-steps">
          <li>${bi("Pick one problem you solved.", "Elige un problema que resolviste.")}</li>
          <li>${bi(
            "Explain it out loud. Use any language first.",
            "Explícalo en voz alta. Usa primero el idioma que prefieras.",
          )}</li>
          <li>${bi("Say it again with the English math words:", "Dilo otra vez con las palabras de matemáticas en inglés:")}${chips}</li>
          <li>${bi(
            "Your partner asks: “How do you know?” Answer with: “I got ___ because ___. I checked by ___.”",
            "Tu acompañante pregunta: “¿Cómo lo sabes?” Responde: “Obtuve ___ porque ___. Comprobé usando ___.”",
          )}</li>
        </ol>
      </section>`;
}

/** Family nights: a Monday–Friday row and a school-night streak, kept only on this device. */
export function renderFamilyNights() {
  return `
      <section class="hw-nights" id="hw_nights" aria-labelledby="hw_nights_title">
        <h3 id="hw_nights_title">${bi("Our family math nights", "Nuestras noches de matemáticas en familia")}</h3>
        <ol class="hw-nights-week" id="hw_nights_week" aria-label="This week"></ol>
        <p class="hw-nights-streak" id="hw_nights_streak" role="status" aria-live="polite"></p>
        <p class="hw-nights-note">${bi(
          "Weekends never break it. Saved only on this device.",
          "Los fines de semana no la interrumpen. Se guarda solo en este dispositivo.",
        )}</p>
      </section>`;
}

export function renderShareWin() {
  return `
      <div class="hw-share">
        <button type="button" class="btn btn-secondary hw-share-win" onclick="hwShareWin()">
          🎉 ${bi("Share our win", "Compartir nuestro logro")}
        </button>
        <p class="hw-share-note">${bi(
          "Shares only the lesson name and a link. No answers, no names.",
          "Comparte solo el nombre de la lección y un enlace. Sin respuestas ni nombres.",
        )}</p>
      </div>`;
}

/** The "tonight" strip: time, what you need, the goal. Times follow the chosen route. */
export function renderTonightStrip() {
  return `
        <ul class="hw-tonight hw-inline" aria-label="Tonight at a glance">
          <li><span aria-hidden="true">⏱</span> <strong><span data-hw-tonight-time>${ROUTE_TIMES[DEFAULT_ROUTE]}</span> min</strong></li>
          <li><span aria-hidden="true">✏️</span> ${bi("Pencil and paper", "Lápiz y papel")}</li>
          <li><span aria-hidden="true">🎯</span> ${bi("Goal:", "Meta:")} <strong><span data-hw-goal-count>${GOAL_TARGET}</span> ${bi("problems", "problemas")}</strong></li>
        </ul>`;
}

/** The meter: one pip per goal problem. Drawn by hwRenderGoal(). */
export function renderGoalPips(extraClass = "") {
  return `<span class="hw-pips ${extraClass}" role="img" aria-label="Tonight's goal progress"></span>`;
}

/** Toast region and the confirm dialog that replace native alert()/confirm(). */
export function renderExperienceDialogs() {
  return `
<div class="hw-toast" id="hw_toast" aria-hidden="true" hidden></div><div class="hw-sr-only" id="hw_toast_live" role="status" aria-live="polite"></div>
<dialog class="hw-dialog" id="hw_dialog" aria-labelledby="hw_dialog_text">
  <form method="dialog">
    <p id="hw_dialog_text"></p>
    <div class="hw-dialog-actions">
      <button type="submit" value="no" class="btn btn-secondary" id="hw_dialog_no"></button>
      <button type="submit" value="yes" class="btn btn-primary" id="hw_dialog_yes"></button>
    </div>
  </form>
</dialog>`;
}

/**
 * Compact inline programmatic SVG model + everyday explanation for the 60-Second
 * Dinner Conversation Card, Student Visual Bridge, and Refrigerator Sheet 3.0.
 */
export function renderMiniConceptSvg(topic = "general") {
  const t = String(topic || "general").toLowerCase();
  if (t.includes("ratio") || t.includes("rate")) {
    return {
      svg: `<svg class="hw-mini-model-svg" viewBox="0 0 420 120" width="420" height="120" style="background:white" role="img" aria-label="Ratio table scaling batches equally" data-aria-en="Ratio table scaling batches equally" data-aria-es="Tabla de razones escalando partes por igual">
        <rect x="8" y="8" width="404" height="104" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        <text x="24" y="34" font-size="14" font-weight="800" fill="#12355b">1 batch: 2 cups flour : 3 cups water</text>
        <rect x="24" y="44" width="48" height="24" rx="5" fill="#1fa6a2"/><rect x="78" y="44" width="48" height="24" rx="5" fill="#1fa6a2"/>
        <rect x="142" y="44" width="48" height="24" rx="5" fill="#0284c7"/><rect x="196" y="44" width="48" height="24" rx="5" fill="#0284c7"/><rect x="250" y="44" width="48" height="24" rx="5" fill="#0284c7"/>
        <text x="24" y="92" font-size="14" font-weight="800" fill="#0c6f6b">×2 both sides → 4 : 6 (same balance!)</text>
      </svg>`,
      en: "Scaling a ratio is like making a double batch of a recipe: multiply both parts by the same number so the balance stays the same.",
      es: "Escalar una razón es como hacer el doble de una receta: multiplica ambas partes por el mismo número para mantener el mismo equilibrio.",
    };
  }
  if (t.includes("percent")) {
    return {
      svg: `<svg class="hw-mini-model-svg" viewBox="0 0 420 120" width="420" height="120" style="background:white" role="img" aria-label="100 percent bar split into four 25 percent parts" data-aria-en="100 percent bar split into four 25 percent parts" data-aria-es="Barra del 100 por ciento dividida en cuatro partes de 25 por ciento">
        <rect x="8" y="8" width="404" height="104" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        <text x="24" y="32" font-size="14" font-weight="800" fill="#12355b">Whole = 100% (4 equal quarters of 25%)</text>
        <rect x="24" y="44" width="90" height="30" rx="4" fill="#1fa6a2" stroke="#0c6f6b" stroke-width="1.5"/>
        <rect x="118" y="44" width="90" height="30" rx="4" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
        <rect x="212" y="44" width="90" height="30" rx="4" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
        <rect x="306" y="44" width="90" height="30" rx="4" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
        <text x="52" y="64" font-size="14" font-weight="800" fill="#ffffff">25%</text>
        <text x="24" y="98" font-size="14" font-weight="700" fill="#0c6f6b">Percent means "out of 100" — benchmark blocks make it easy to see.</text>
      </svg>`,
      en: "Percent means 'out of 100'. Breaking a whole bar into 10% or 25% blocks lets you find parts and totals mentally.",
      es: "Porcentaje significa «de cada 100». Dividir la barra total en bloques de 10% o 25% permite hallar partes y totales mentalmente.",
    };
  }
  if (t.includes("fraction") || t.includes("decimal") || t.includes("division")) {
    return {
      svg: `<svg class="hw-mini-model-svg" viewBox="0 0 420 120" width="420" height="120" style="background:white" role="img" aria-label="Fraction bar divided into equal parts" data-aria-en="Fraction bar divided into equal parts" data-aria-es="Barra de fracciones dividida en partes iguales">
        <rect x="8" y="8" width="404" height="104" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        <text x="24" y="32" font-size="14" font-weight="800" fill="#12355b">1 Whole = 4 Fourths (each part is 1/4 or 0.25)</text>
        <rect x="24" y="44" width="90" height="30" fill="#1fa6a2" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="114" y="44" width="90" height="30" fill="#1fa6a2" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="204" y="44" width="90" height="30" fill="#1fa6a2" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="294" y="44" width="90" height="30" fill="#f1f5f9" stroke="#0f172a" stroke-width="1.5"/>
        <text x="24" y="98" font-size="14" font-weight="700" fill="#0c6f6b">How many 1/4 pieces fit in 3/4? Exactly 3 pieces!</text>
      </svg>`,
      en: "Equal-sized pieces show why fraction and decimal operations work: count how many equal parts fit into the total.",
      es: "Las partes del mismo tamaño muestran por qué funcionan las fracciones y los decimales: cuenta cuántas partes iguales caben en el total.",
    };
  }
  if (t.includes("equation") || t.includes("expression") || t.includes("inequal")) {
    return {
      svg: `<svg class="hw-mini-model-svg" viewBox="0 0 420 120" width="420" height="120" style="background:white" role="img" aria-label="Balanced hanger model showing x plus 3 equals 7" data-aria-en="Balanced hanger model showing x plus 3 equals 7" data-aria-es="Modelo de balanza mostrando x más 3 igual a 7">
        <rect x="8" y="8" width="404" height="104" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        <line x1="80" y1="42" x2="340" y2="42" stroke="#12355b" stroke-width="4"/>
        <polygon points="210,22 200,42 220,42" fill="#12355b"/>
        <rect x="86" y="50" width="96" height="32" rx="6" fill="#1fa6a2"/>
        <text x="112" y="71" font-size="15" font-weight="800" fill="#ffffff">x + 3</text>
        <rect x="238" y="50" width="96" height="32" rx="6" fill="#0284c7"/>
        <text x="278" y="71" font-size="15" font-weight="800" fill="#ffffff">7</text>
        <text x="72" y="102" font-size="14" font-weight="700" fill="#0c6f6b">Keep the scale balanced: do the same move on both sides.</text>
      </svg>`,
      en: "An equation is like a balanced scale: whatever you add, subtract, multiply, or divide on one side, do the same to the other side.",
      es: "Una ecuación es como una balanza en equilibrio: lo que sumes, restes, multipliques o dividas en un lado, hazlo también en el otro.",
    };
  }
  if (
    t.includes("number-line") ||
    t.includes("integer") ||
    t.includes("coordinate") ||
    t.includes("rational") ||
    t.includes("absolute")
  ) {
    return {
      svg: `<svg class="hw-mini-model-svg" viewBox="0 0 420 120" width="420" height="120" style="background:white" role="img" aria-label="Number line from negative 4 to positive 4 centered at zero" data-aria-en="Number line from negative 4 to positive 4 centered at zero" data-aria-es="Recta numérica de menos 4 a más 4 centrada en cero">
        <rect x="8" y="8" width="404" height="104" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        <line x1="36" y1="60" x2="384" y2="60" stroke="#12355b" stroke-width="3"/>
        <circle cx="210" cy="60" r="6" fill="#d97706"/>
        <circle cx="110" cy="60" r="6" fill="#0284c7"/>
        <circle cx="310" cy="60" r="6" fill="#1fa6a2"/>
        <text x="98" y="44" font-size="14" font-weight="800" fill="#0284c7">-3</text>
        <text x="205" y="44" font-size="14" font-weight="800" fill="#d97706">0</text>
        <text x="300" y="44" font-size="14" font-weight="800" fill="#0c6f6b">+3</text>
        <text x="56" y="98" font-size="14" font-weight="700" fill="#12355b">Distance from 0 is the same on both sides (|-3| = |+3| = 3).</text>
      </svg>`,
      en: "Zero is the mirror point on a number line: numbers to the right grow greater, and opposite numbers share the same distance from 0.",
      es: "El cero es el punto espejo en la recta numérica: hacia la derecha los números son mayores y los opuestos están a igual distancia de 0.",
    };
  }
  return {
    svg: `<svg class="hw-mini-model-svg" viewBox="0 0 420 120" width="420" height="120" style="background:white" role="img" aria-label="Part-part-whole visual bar model" data-aria-en="Part-part-whole visual bar model" data-aria-es="Modelo de barras de partes y total">
      <rect x="8" y="8" width="404" height="104" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="24" y="32" font-size="14" font-weight="800" fill="#12355b">Visual Bar Model · Modelo Visual de Barras</text>
      <rect x="24" y="44" width="220" height="30" rx="5" fill="#1fa6a2"/>
      <rect x="248" y="44" width="144" height="30" rx="5" fill="#0284c7"/>
      <text x="96" y="64" font-size="14" font-weight="800" fill="#ffffff">Known Part</text>
      <text x="285" y="64" font-size="14" font-weight="800" fill="#ffffff">Part 2</text>
      <text x="24" y="98" font-size="14" font-weight="700" fill="#0c6f6b">Sketching the parts and the whole makes the math step clear.</text>
    </svg>`,
    en: "Drawing a quick picture or bar model shows how the parts connect to the whole before you calculate.",
    es: "Dibujar un esquema rápido o modelo de barras muestra cómo se conectan las partes con el total antes de calcular.",
  };
}

/**
 * V3.0 Feature A: The 60-Second Family Dinner Conversation Card ("La Pregunta de la Noche").
 */
export function renderDinnerTalkCard(question, topic = "general") {
  const qEn =
    question?.en ||
    "How does the picture or diagram on this page show why your answer makes sense?";
  const qEs =
    question?.es ||
    "¿Cómo muestra el dibujo o diagrama de esta página por qué tiene sentido tu respuesta?";
  const model = renderMiniConceptSvg(topic);
  const speakEn = `Tonight's 60-Second Math Talk. Ask your child: ${qEn}`;
  const speakEs = `Charla matemática de 60 segundos. Pregúntale a tu hijo o hija: ${qEs}`;
  return `
      <section class="hw-dinner-talk" id="hw_dinner_talk" data-no-vocab data-no-listen aria-labelledby="hw_dinner_talk_title">
        <div class="hw-dinner-head">
          <div>
            <p class="hw-eyebrow hw-inline">🍽️ ${bi("La Pregunta de la Noche · 60-Second Dinner Talk", "La Pregunta de la Noche · Charla de 60 Segundos")}</p>
            <h3 id="hw_dinner_talk_title">${bi("Tonight's 60-Second Math Talk", "Charla Matemática de 60 Segundos")}</h3>
          </div>
          <button type="button" class="btn-read-aloud hw-listen" data-speak-en="${esc(speakEn)}" data-speak-es="${esc(speakEs)}" aria-label="Listen to tonight's dinner question" data-aria-en="Listen to tonight's dinner question" data-aria-es="Escuchar la pregunta de la noche">🔊 ${bi("Listen", "Escuchar")}</button>
        </div>
        <p class="hw-dinner-prompt">
          <span class="lang-en"><strong>Ask at dinner or bedtime:</strong> “${esc(qEn)}”</span>
          <span class="lang-es" lang="es"><strong>Pregunta en la cena o antes de dormir:</strong> «${esc(qEs)}»</span>
        </p>
        <p class="hw-dinner-reassure">
          ${bi(
            "No pen or paper needed — just listen to how your student explains their thinking in any language.",
            "No necesitan papel ni lápiz: solo escuchen cómo su estudiante explica su razonamiento en cualquier idioma.",
          )}
        </p>
        <details class="hw-dinner-visual">
          <summary>
            <span>🔍 ${bi("See the 30-second visual explainer (plain everyday terms)", "Ver el modelo visual en 30 segundos (en palabras sencillas)")}</span>
          </summary>
          <div class="hw-dinner-visual-body">
            ${model.svg}
            <p class="hw-dinner-visual-copy">${bi(model.en, model.es)}</p>
          </div>
        </details>
      </section>`;
}

/**
 * V3.0 Feature B: Student-Controlled Routing & Adaptive Pathways.
 * Preserves existing route chooser buttons while giving students an explicit
 * 3-pathway selector ("I've Got This", "Just Right", "Boost My Foundation").
 */
export function renderStudentPathwayBar(topic = "general", bridge = null) {
  const model = renderMiniConceptSvg(topic);
  const bridgeNoteEn = bridge?.class?.en
    ? `${bridge.class.en} ${bridge.why?.en || ""}`.trim()
    : model.en;
  const bridgeNoteEs = bridge?.class?.es
    ? `${bridge.class.es} ${bridge.why?.es || ""}`.trim()
    : model.es;
  return `
      <section class="hw-pathway-bar" id="hw_pathway_bar" data-no-vocab data-no-listen aria-labelledby="hw_pathway_title">
        <div class="hw-pathway-header">
          <p class="hw-eyebrow hw-inline">🧭 ${bi("Student-Owned Learning Path", "Ruta elegida por el estudiante")}</p>
          <h3 id="hw_pathway_title">${bi("Choose your depth for tonight (switch anytime, zero work lost)", "Elige tu nivel de profundidad para hoy (cambia cuando quieras sin perder tus respuestas)")}</h3>
        </div>
        <div class="hw-pathway-grid" role="group" aria-labelledby="hw_pathway_title">
          <button type="button" class="hw-pathway-btn" data-pathway="express" aria-pressed="false" onclick="hwSetPathway('express')">
            <span class="hw-pathway-icon" aria-hidden="true">⚡</span>
            <strong class="hw-stack">${bi("I've Got This", "¡Ya lo domino!")}</strong>
            <span class="hw-pathway-desc hw-stack">${bi("Express & Challenge: 2 quick checks → family puzzle", "Rápido y reto: 2 preguntas rápidas → acertijo familiar")}</span>
          </button>
          <button type="button" class="hw-pathway-btn is-active" data-pathway="standard" aria-pressed="true" onclick="hwSetPathway('standard')">
            <span class="hw-pathway-icon" aria-hidden="true">🎯</span>
            <strong class="hw-stack">${bi("Just Right", "A mi medida")}</strong>
            <span class="hw-pathway-desc hw-stack">${bi("Standard Companion: Model → Practice with hints → Family Talk", "Estándar: Modelo → Práctica con pistas → Charla familiar")}</span>
          </button>
          <button type="button" class="hw-pathway-btn" data-pathway="foundation" aria-pressed="false" onclick="hwSetPathway('foundation')">
            <span class="hw-pathway-icon" aria-hidden="true">🧱</span>
            <strong class="hw-stack">${bi("Boost My Foundation", "Reforzar mi base")}</strong>
            <span class="hw-pathway-desc hw-stack">${bi("Visual Bridge: Open the prerequisite visual model first", "Puente visual: Abre primero el modelo visual paso a paso")}</span>
          </button>
        </div>
        <div class="hw-foundation-bridge" id="hw_foundation_bridge" hidden>
          <div class="hw-foundation-head">
            <strong>🧱 ${bi("Visual Prerequisite Bridge", "Puente Visual de Base")}</strong>
            <span class="hw-foundation-tag">${bi("Step-by-step visual foundation", "Base visual paso a paso")}</span>
          </div>
          ${model.svg}
          <p class="hw-foundation-copy">${bi(bridgeNoteEn, bridgeNoteEs)}</p>
          <div class="hw-foundation-actions">
            <a class="btn btn-sm btn-secondary" href="#hw_learn_idea">${bi("1. Walk through the worked model ↓", "1. Ver el modelo resuelto paso a paso ↓")}</a>
            <button type="button" class="btn btn-sm btn-primary" onclick="switchHomeworkTab('check')">${bi("2. Try Warm-Up Question 1 with hints ➔", "2. Probar la Pregunta 1 de calentamiento con pistas ➔")}</button>
          </div>
        </div>
      </section>`;
}
