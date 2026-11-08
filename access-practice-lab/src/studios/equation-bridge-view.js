import { esc } from "../util.js";

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

function inverseLabel(bridge, step, I) {
  if (bridge.form === "add") return I.T(`Subtract ${bridge.amount} from both sides`, `Resta ${bridge.amount} a ambos lados`);
  if (bridge.form === "subtract") return I.T(`Add ${bridge.amount} to both sides`, `Suma ${bridge.amount} a ambos lados`);
  if (bridge.form === "multiply") return I.T(`Divide both sides by ${bridge.amount}`, `Divide ambos lados entre ${bridge.amount}`);
  if (bridge.form === "divide") return I.T(`Multiply both sides by ${bridge.amount}`, `Multiplica ambos lados por ${bridge.amount}`);
  if (step === 0) return bridge.shift > 0
    ? I.T(`Subtract ${bridge.shift} from both sides`, `Resta ${bridge.shift} a ambos lados`)
    : I.T(`Add ${Math.abs(bridge.shift)} to both sides`, `Suma ${Math.abs(bridge.shift)} a ambos lados`);
  return I.T(`Divide both sides by ${bridge.amount}`, `Divide ambos lados entre ${bridge.amount}`);
}

function sameSideWrongLabel(bridge, step, I) {
  if (bridge.form === "add") return I.T(`Add ${bridge.amount} to both sides`, `Suma ${bridge.amount} a ambos lados`);
  if (bridge.form === "subtract") return I.T(`Subtract ${bridge.amount} from both sides`, `Resta ${bridge.amount} a ambos lados`);
  if (bridge.form === "multiply") return I.T(`Multiply both sides by ${bridge.amount}`, `Multiplica ambos lados por ${bridge.amount}`);
  if (bridge.form === "divide") return I.T(`Divide both sides by ${bridge.amount}`, `Divide ambos lados entre ${bridge.amount}`);
  if (step === 0) return bridge.shift > 0
    ? I.T(`Add ${bridge.shift} to both sides`, `Suma ${bridge.shift} a ambos lados`)
    : I.T(`Subtract ${Math.abs(bridge.shift)} from both sides`, `Resta ${Math.abs(bridge.shift)} a ambos lados`);
  return I.T(`Multiply both sides by ${bridge.amount}`, `Multiplica ambos lados por ${bridge.amount}`);
}

/** Interactive equation model: a wrong operation can be retried without losing the equation. */
export function equationBalanceModelHTML(bridge, state, I) {
  const complete = state.equationActionDone === true;
  const step = bridge.form === "two-step" ? Math.min(1, Number(state.equationModelStep) || 0) : 0;
  const equation = equationText(bridge, step, complete);
  const feedback = state.equationFeedback
    ? `<p class="mlb-feedback" role="status">${esc(state.equationFeedback)}</p>`
    : "";
  const controls = complete
    ? `<p class="mlb-equation-check" role="status">${substitutionText(bridge, I)}</p>`
    : `<p>${I.T(step === 0 ? "Choose an operation that moves the equation toward x while preserving equality." : "The constant is removed. Choose the inverse operation that isolates x.", step === 0 ? "Elige una operación que acerque la ecuación a x y conserve la igualdad." : "Se quitó la constante. Elige la operación inversa que despeja x.")}</p>
      <div class="mlb-equation-actions" role="group" aria-label="${esc(I.S("Choose an equation operation", "Elige una operación para la ecuación"))}">
        <button type="button" class="btn secondary" data-equation-action="correct">${inverseLabel(bridge, step, I)}</button>
        <button type="button" class="btn ghost" data-equation-action="same-wrong">${sameSideWrongLabel(bridge, step, I)}</button>
        <button type="button" class="btn ghost" data-equation-action="one-side">${I.T("Apply the inverse on the left side only", "Aplica la inversa solo al lado izquierdo")}</button>
      </div>${feedback}`;
  const alt = I.S(`Equation ${equation}. Apply the same inverse operation to both sides to preserve equality.`, `Ecuación ${equation}. Aplica la misma operación inversa a ambos lados para conservar la igualdad.`);
  return `<div class="mlb-model mlb-equation-model" data-equation-model>
    <h3>${I.T("Balance both sides", "Equilibra ambos lados")}</h3>
    <p>${I.T("An equation is like a balanced scale: changing one side alone changes the equality.", "Una ecuación es como una balanza equilibrada: cambiar un solo lado cambia la igualdad.")}</p>
    <div class="mlb-equation-display" role="group" aria-label="${esc(alt)}"><span>${I.T("Left side", "Lado izquierdo")}<strong>${esc(equation.split(" = ")[0])}</strong></span><b aria-hidden="true">=</b><span>${I.T("Right side", "Lado derecho")}<strong>${esc(equation.split(" = ")[1] || "")}</strong></span></div>
    ${controls}
  </div>`;
}
