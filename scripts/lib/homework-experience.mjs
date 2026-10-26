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
