/**
 * Learn-stop co-learning modules, rendered from the lesson's OWN authored `v3` block
 * (data/family-homework-notes/<id>.json, contract docs/specs/family-homework-v3.md).
 *
 * There is no unit-level fallback: a lesson without a `v3` block fails the build. Until v3.0 this
 * content came from a topic bank that defaulted to "ratios", so 89 of 166 pages printed another
 * lesson's smoothie recipe. Pure functions: data in, markup out.
 */
import { renderModelFigure } from "./homework-v3-model.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** One piece of bilingual text. The page shows one language at a time (class toggles). */
export const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;
const pair = (p) => bi(p?.en, p?.es);
const isPart2Lesson = (id) => /-part[23]$/i.test(String(id || ""));
const NUDGE = `<p class="hw-v3-nudge" role="status" hidden>${bi("Not yet. Try another look.", "Todavía no. Intenta otra mirada.")}</p>`;

/** The lesson's v3 block, or a build failure naming the file to author. */
export function v3Of(config, lessonId) {
  const v3 = config?.familyNotes?.v3;
  if (!v3 || typeof v3 !== "object") {
    throw new Error(
      `family homework ${lessonId}: data/family-homework-notes/${lessonId}.json has no "v3" block. ` +
        "v3.0 has no unit-level fallback; author it (docs/specs/family-homework-v3.md).",
    );
  }
  return v3;
}

/** Compact top bar: the grown-up layer switch and the theme switch. Replaces the legacy dev-style bar. */
export function renderTopBar() {
  return `
    <nav class="hw-topbar" id="hw_topbar" aria-label="${esc("Page options")}">
      <div class="hw-persona-switcher" id="hw_persona_switcher" role="group" aria-label="${esc("Who is reading")}">
        <button type="button" class="hw-persona-btn is-active" data-persona-btn="student" aria-pressed="true">${bi("Student view", "Vista del estudiante")}</button>
        <button type="button" class="hw-persona-btn" data-persona-btn="copilot" aria-pressed="false">${bi("Grown-up tips", "Consejos para adultos")}</button>
      </div>
      <button type="button" id="hw_theme_toggle_btn" aria-pressed="false">${bi("Dark mode", "Modo oscuro")}</button>
    </nav>`;
}

function renderModelStage(v3, lessonId) {
  if (v3.kind === "mindset") return "";
  const figure = renderModelFigure(v3.model, lessonId);
  return `
    <section class="hw-colearn-card card-ish" id="hw_family_bridge_60s" data-colearn-section="model-stage" aria-labelledby="hw_model_title">
      <h3 class="hw-colearn-title" id="hw_model_title">${bi("The picture for tonight", "El dibujo de hoy")}</h3>
      <p class="hw-colearn-lead">${bi("In class we used", "En clase usamos")} <strong>${pair(v3.classModel.name)}</strong>.</p>
      <figure class="hw-colearn-svg-stage">${figure}</figure>
    </section>`;
}

function renderTransfer(t) {
  if (!t) return "";
  return `
      <div class="hw-subcard" id="hw_part2_application">
        <h4 class="hw-subcard-tag">${bi("A new situation", "Una situación nueva")}</h4>
        <p class="hw-colearn-stem">${pair(t.stem)}</p>
        <div class="hw-transfer-choices" role="group" aria-label="${esc("Choices")}">
          ${t.choices
            .map(
              (c, i) => `
          <button type="button" class="hw-transfer-choice-btn" data-correct="${c.correct ? "1" : "0"}">
            <span class="hw-choice-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
            <span class="hw-choice-copy">${pair(c)}</span>
          </button>`,
            )
            .join("")}
        </div>
        ${NUDGE}
        <div class="hw-transfer-feedback" id="hw_transfer_feedback" role="status" aria-live="polite" hidden>
          <p>${pair(t.reasoning)}</p>
        </div>
      </div>`;
}

function renderGlitch(g) {
  if (!g) return "";
  return `
      <div class="hw-subcard" id="hw_spot_the_glitch">
        <h4 class="hw-subcard-tag">${bi("Be the teacher: find the mistake", "Sé el maestro: encuentra el error")}</h4>
        <p class="hw-colearn-stem">${pair(g.scenario)}</p>
        <p class="hw-glitch-instruction">${bi("Tap the step where the thinking went off track. Then explain why.", "Toca el paso donde el razonamiento se desvió. Luego explica por qué.")}</p>
        <div class="hw-glitch-steps" role="group" aria-label="${esc("Steps")}">
          ${g.steps
            .map(
              (st) => `
          <button type="button" class="hw-glitch-step-btn" data-is-glitch="${st.isGlitch ? "1" : "0"}">${pair(st)}</button>`,
            )
            .join("")}
        </div>
        ${NUDGE}
        <div class="hw-glitch-feedback" id="hw_glitch_feedback" role="status" aria-live="polite" hidden>
          <p><strong>${bi("How to fix it:", "Cómo corregirlo:")}</strong> ${pair(g.fix)}</p>
          <p class="hw-glitch-frame"><strong>${bi("Say it out loud:", "Dilo en voz alta:")}</strong> <em>${pair(g.frame)}</em></p>
        </div>
      </div>`;
}

function renderSpiral(items) {
  if (!items?.length) return "";
  return `
      <div class="hw-subcard" id="hw_spiral_remember">
        <h4 class="hw-subcard-tag">${bi("Remember these?", "¿Recuerdas esto?")}</h4>
        <div class="hw-spiral-grid">
          ${items
            .map(
              (sp, i) => `
          <div class="hw-spiral-item" id="hw_spiral_item_${i}">
            <p class="hw-colearn-stem">${pair(sp.q)}</p>
            <div class="hw-spiral-options">
              ${sp.options
                .map(
                  (opt, o) =>
                    `<button type="button" class="hw-spiral-opt-btn" data-correct="${o === sp.correctIdx ? "1" : "0"}">${esc(opt)}</button>`,
                )
                .join("")}
            </div>
            ${NUDGE}
            <p class="hw-spiral-exp" id="hw_spiral_exp_${i}" hidden>${pair(sp.exp)}</p>
          </div>`,
            )
            .join("")}
        </div>
      </div>`;
}

function renderKitchenTable(k) {
  return `
      <div class="hw-subcard hw-kitchen-offline-card" id="hw_kitchen_table_prompt" data-kitchen-table-prompt="true">
        <h4 class="hw-subcard-tag">${bi("At the table", "En la mesa")}</h4>
        <p class="hw-kitchen-offline-text">${pair(k)}</p>
      </div>`;
}

/** Model stage and the stretch suite (transfer, glitch on Part 2, spiral, kitchen table). */
export function renderLearnModules(config, lessonId) {
  const v3 = v3Of(config, lessonId);
  const part2 = isPart2Lesson(lessonId);
  const suite = [
    part2 ? renderGlitch(v3.glitch) : "",
    renderTransfer(v3.transfer),
    renderSpiral(v3.spiral),
    renderKitchenTable(v3.kitchenTable),
  ]
    .filter(Boolean)
    .join("");
  return `
    ${renderModelStage(v3, lessonId)}
    <section class="hw-colearn-card card-ish hw-part2-suite${part2 ? " is-part2-primary" : ""}" id="hw_part2_deepening_suite" data-colearn-section="part2-suite" aria-labelledby="hw_stretch_title">
      <h3 class="hw-colearn-title" id="hw_stretch_title">${bi("Stretch and connect", "Ve más allá y conecta")}</h3>
      ${suite}
    </section>`;
}

/** Per-problem "ask" line for the grown-up. Nothing when the problem authored none. */
export function renderProblemAsk(it, pIdx, levels) {
  const en = levels?.ask?.en || it.coach;
  const es = levels?.ask?.es || it.coachEs;
  if (!en) return "";
  return `
    <aside class="hw-copilot-card hw-problem-copilot" id="hw_copilot_prob_${pIdx}" data-copilot-for="${pIdx}">
      <p class="hw-copilot-socratic-line"><strong>${bi("Ask if stuck:", "Pregunta si se detiene:")}</strong> <em>${bi(en, es || en)}</em></p>
    </aside>`;
}

/** The page's print footer: this lesson's own questions for the grown-up and its table challenge. */
export function renderPrintFooter(config, lessonId) {
  const v3 = v3Of(config, lessonId);
  const asks = config.familyNotes?.stuckTips?.say || [];
  return `
    <footer class="hw-print-socratic-footer" id="hw_print_socratic_footer" aria-label="${esc("Questions for the grown-up")}">
      <div class="hw-print-socratic-inner">
        <h4>${bi("Questions for the grown-up", "Preguntas para el adulto")}</h4>
        <ul>
          ${asks.map((a) => `<li>${pair(a)}</li>`).join("")}
          <li><strong>${bi("At the table:", "En la mesa:")}</strong> ${pair(v3.kitchenTable)}</li>
        </ul>
      </div>
    </footer>`;
}
