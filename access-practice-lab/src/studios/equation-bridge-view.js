import { esc } from "../util.js";
import { build as balanceBuild } from "../../../math/fluency-lab/studio/engine-balance.js";
import {
  applyEquationMove,
  equationMoves,
  formatLinearEquation,
  parseLinearEquation,
} from "../../../shared/math/equation-balance.js";

function equationText(bridge, step, complete) {
  if (complete) return `x = ${bridge.solution}`;
  if (bridge.form === "add") return `x + ${bridge.amount} = ${bridge.result}`;
  if (bridge.form === "subtract") return `x − ${bridge.amount} = ${bridge.result}`;
  if (bridge.form === "multiply") return `${bridge.amount}x = ${bridge.result}`;
  if (bridge.form === "divide") return `x ÷ ${bridge.amount} = ${bridge.result}`;
  if (step === 0) return `${bridge.amount}x ${bridge.shift > 0 ? "+" : "−"} ${Math.abs(bridge.shift)} = ${bridge.result}`;
  return `${bridge.amount}x = ${bridge.result - bridge.shift}`;
}

export function equationTextForBridge(bridge, result = bridge.result) {
  return equationText({ ...bridge, result }, 0, false);
}

function substitutionText(bridge, I) {
  const { amount, shift, solution, result, form } = bridge;
  const left = form === "add"
    ? `${solution} + ${amount}`
    : form === "subtract"
      ? `${solution} − ${amount}`
      : form === "multiply"
        ? `${amount} × ${solution}`
        : form === "divide"
          ? `${solution} ÷ ${amount}`
          : `${amount} × ${solution} ${shift > 0 ? "+" : "−"} ${Math.abs(shift)}`;
  return I.T(`Substitute x = ${solution}: ${left} = ${result}. Both sides are equal.`, `Sustituye x = ${solution}: ${left} = ${result}. Ambos lados son iguales.`);
}

function currentModel(bridge, state) {
  const spec = parseLinearEquation(equationTextForBridge(bridge));
  if (!spec) return null;
  const steps = equationMoves(spec.eq);
  const step = Math.max(0, Math.min(steps.length, Number(state.equationModelStep) || 0));
  let equation = { ...spec.eq };
  for (const move of steps.slice(0, step)) {
    equation = applyEquationMove(equation, move);
    if (!equation) return null;
  }
  const view = balanceBuild.render(
    { e: equation, log: steps.slice(0, step) },
    spec,
    { tilt: Number(state.equationModelTilt) || 0 },
  );
  return { equation, steps, step, view };
}

export function equationBalanceStepCount(bridge) {
  const spec = bridge ? parseLinearEquation(equationTextForBridge(bridge)) : null;
  return spec ? equationMoves(spec.eq).length : 0;
}

/** Interactive equation model: a wrong operation can be retried without losing the equation. */
export function equationBalanceModelHTML(bridge, state, I) {
  const model = currentModel(bridge, state);
  if (!model) return `<p role="alert">${I.T("This equation cannot be shown in the balance model.", "Esta ecuación no se puede mostrar en el modelo de equilibrio.")}</p>`;
  const complete = state.equationActionDone === true || model.step >= model.steps.length;
  const equation = formatLinearEquation(model.equation);
  const feedback = state.equationFeedback
    ? `<p class="mlb-feedback" role="status">${esc(state.equationFeedback)}</p>`
    : "";
  const actions = model.view.controls.map((control, index) => {
    const action = control.id === "one" ? "one-side" : index === 0 ? "correct" : "same-wrong";
    const style = action === "correct" ? "secondary" : "ghost";
    const label = action === "one-side"
      ? I.T("Apply the inverse on the left side only", "Aplica la inversa solo al lado izquierdo")
      : I.T(control.label.en, control.label.es);
    return `<button type="button" class="btn ${style}" data-equation-action="${action}">${label}</button>`;
  }).join("");
  const controls = complete
    ? `<p class="mlb-equation-check" role="status">${substitutionText(bridge, I)}</p>`
    : `<p>${I.T(model.step === 0 ? "Choose an operation that moves the equation toward x while preserving equality." : "The constant is removed. Choose the inverse operation that isolates x.", model.step === 0 ? "Elige una operación que acerque la ecuación a x y conserve la igualdad." : "Se quitó la constante. Elige la operación inversa que despeja x.")}</p>
      <div class="mlb-equation-actions" role="group" aria-label="${esc(I.S("Choose an equation operation", "Elige una operación para la ecuación"))}">${actions}</div>${feedback}`;
  const alt = I.S(`Equation ${equation}. Apply the same inverse operation to both sides to preserve equality.`, `Ecuación ${equation}. Aplica la misma operación inversa a ambos lados para conservar la igualdad.`);
  return `<div class="mlb-model mlb-equation-model" data-equation-model data-total-steps="${model.steps.length}" data-current-step="${model.step}">
    <h3>${I.T("Balance both sides", "Equilibra ambos lados")}</h3>
    <p>${I.T("An equation is like a balanced scale: changing one side alone changes the equality.", "Una ecuación es como una balanza equilibrada: cambiar un solo lado cambia la igualdad.")}</p>
    <div class="mlb-equation-display" role="group" aria-label="${esc(alt)}"><span>${I.T("Left side", "Lado izquierdo")}<strong>${esc(equation.split(" = ")[0])}</strong></span><b aria-hidden="true">=</b><span>${I.T("Right side", "Lado derecho")}<strong>${esc(equation.split(" = ")[1] || "")}</strong></span></div>
    <div class="mlb-equation-scale" aria-label="${esc(I.S(model.view.alt.en, model.view.alt.es))}">${model.view.svg}</div>
    ${controls}
  </div>`;
}
