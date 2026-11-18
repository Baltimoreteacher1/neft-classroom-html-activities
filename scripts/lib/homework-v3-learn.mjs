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

function renderExprInspector(model) {
  const kind = model?.kind;
  const d = model?.data;
  if (!d || (kind !== "exprparts" && kind !== "eqparts")) return "";
  const items =
    kind === "exprparts"
      ? [
          {
            id: "coef",
            en: "Coefficient",
            es: "Coeficiente",
            descEn: `${d.coef} is the coefficient — the number multiplied by the variable ${d.variable}.`,
            descEs: `${d.coef} es el coeficiente: el número que multiplica a la variable ${d.variable}.`,
          },
          {
            id: "variable",
            en: "Variable",
            es: "Variable",
            descEn: `${d.variable} is the variable — a letter standing for a number that can change.`,
            descEs: `${d.variable} es la variable: una letra que representa un número que puede cambiar.`,
          },
          {
            id: "op",
            en: "Operator",
            es: "Operador",
            descEn: `${d.op} is the operator — the math sign showing how the terms combine.`,
            descEs: `${d.op} es el operador: el signo matemático que muestra cómo se combinan los términos.`,
          },
          {
            id: "constant",
            en: "Constant",
            es: "Constante",
            descEn: `${d.constant} is the constant — a fixed number that stays the same on its own.`,
            descEs: `${d.constant} es la constante: un número fijo que no cambia por sí solo.`,
          },
          {
            id: "term",
            en: `Variable term: ${d.coef}${d.variable}`,
            es: `Término variable: ${d.coef}${d.variable}`,
            descEn: `${d.coef}${d.variable} is the variable term — the coefficient and variable working together.`,
            descEs: `${d.coef}${d.variable} es el término variable: el coeficiente y la variable trabajando juntos.`,
          },
        ]
      : [
          {
            id: "lhs",
            en: "Left side",
            es: "Lado izquierdo",
            descEn: `${d.lhs} is the left expression of the equation.`,
            descEs: `${d.lhs} es la expresión del lado izquierdo de la ecuación.`,
          },
          {
            id: "eq",
            en: "Equals",
            es: "Igual",
            descEn: `${d.op} means both sides have the exact same value.`,
            descEs: `${d.op} significa que ambos lados tienen exactamente el mismo valor.`,
          },
          {
            id: "rhs",
            en: "Right side",
            es: "Lado derecho",
            descEn: `${d.rhs} is the right expression that balances the left side.`,
            descEs: `${d.rhs} es la expresión del lado derecho que equilibra al lado izquierdo.`,
          },
          {
            id: "equation",
            en: "Balanced equation",
            es: "Ecuación balanceada",
            descEn: `Together, ${d.lhs} ${d.op} ${d.rhs} is an equation: two expressions joined by ${d.op}.`,
            descEs: `En conjunto, ${d.lhs} ${d.op} ${d.rhs} es una ecuación: dos expresiones unidas por ${d.op}.`,
          },
        ];
  const coefN = kind === "exprparts" ? Number(d.coef) : Number.NaN;
  const constN = kind === "exprparts" ? Number(d.constant) : Number.NaN;
  const canTry =
    kind === "exprparts" &&
    Number.isFinite(coefN) &&
    Number.isFinite(constN) &&
    (d.op === "+" || d.op === "-" || d.op === "−");
  const tryHtml = canTry
    ? `
        <div class="hw-expr-try" data-expr-coef="${esc(coefN)}" data-expr-var="${esc(d.variable)}" data-expr-op="${esc(d.op)}" data-expr-const="${esc(constN)}">
          <span class="hw-expr-try-label">${bi(`Plug in ${d.variable}:`, `Prueba ${d.variable}:`)}</span>
          ${[1, 3, 5]
            .map(
              (v) =>
                `<button type="button" class="hw-expr-val-btn" data-expr-val="${v}" aria-pressed="false">${esc(d.variable)} = ${v}</button>`,
            )
            .join("")}
        </div>
        <p class="hw-expr-val-result" role="status" aria-live="polite" hidden></p>`
    : "";
  return `
      <div class="hw-expr-inspect" data-expr-inspect>
        <p class="hw-expr-inspect-prompt">${bi("Tap a part above or below to see what it does:", "Toca una parte arriba o abajo para ver qué hace:")}</p>
        <div class="hw-expr-chips" role="group" aria-label="${esc("Parts to inspect")}">
          ${items.map((it) => `<button type="button" class="hw-expr-chip" data-expr-chip="${esc(it.id)}" aria-pressed="false">${bi(it.en, it.es)}</button>`).join("")}
        </div>
        <div class="hw-expr-explain" role="status" aria-live="polite" hidden>
          ${items.map((it) => `<p class="hw-expr-explain-item" data-expr-explain="${esc(it.id)}" hidden>${bi(it.descEn, it.descEs)}</p>`).join("")}
        </div>${tryHtml}
      </div>`;
}

function renderModelStage(v3, lessonId) {
  if (v3.kind === "mindset") return "";
  const figure = renderModelFigure(v3.model, lessonId);
  return `
    <section class="hw-colearn-card card-ish" id="hw_family_bridge_60s" data-colearn-section="model-stage" aria-labelledby="hw_model_title">
      <h3 class="hw-colearn-title" id="hw_model_title">${bi("The picture for tonight", "El dibujo de hoy")}</h3>
      <p class="hw-colearn-lead">${bi("In class we used", "En clase usamos")} <strong>${pair(v3.classModel.name)}</strong>.</p>
      <figure class="hw-colearn-svg-stage">${figure}</figure>
      ${renderExprInspector(v3.model)}
      <div class="hw-colearn-actions">
        <button type="button" class="fm-btn hw-try-model-btn" data-act="switchHomeworkTab" data-args='["explore"]'>${bi("Try the interactive model →", "Probar el modelo interactivo →")}</button>
      </div>
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

/**
 * The lesson's authored v3 pieces, one per Mission stage: the model picture (Explore), the
 * prerequisite check (Connect), the error analysis (Talk Together) and the transfer problem and
 * table prompt (Apply). Each piece is "" when the lesson authored none.
 */
export function renderLearnPieces(config, lessonId) {
  const v3 = v3Of(config, lessonId);
  const part2 = isPart2Lesson(lessonId);
  const card = (id, title, inner) =>
    inner
      ? `
    <section class="hw-colearn-card card-ish hw-part2-suite${part2 ? " is-part2-primary" : ""}" id="${id}" data-colearn-section="${id}" aria-labelledby="${id}_title">
      <h3 class="hw-colearn-title" id="${id}_title">${title}</h3>
      ${inner}
    </section>`
      : "";
  return {
    model: renderModelStage(v3, lessonId),
    spiral: card("hw_part2_remember", bi("Remember", "Recuerda"), renderSpiral(v3.spiral)),
    glitch: card(
      "hw_part2_error",
      bi("Find the mistake", "Encuentra el error"),
      part2 ? renderGlitch(v3.glitch) : "",
    ),
    apply: card(
      "hw_part2_deepening_suite",
      bi("A new situation", "Una situación nueva"),
      renderTransfer(v3.transfer) + renderKitchenTable(v3.kitchenTable),
    ),
  };
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
