// Unit 8 equations and inequalities, using only each lab's starting model values.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
const safeWhole = (value) => Number.isSafeInteger(value) && value >= 0;

export function unit8Challenge(lab) {
  if (lab.unit !== 8) return null;
  const ownModel = {
    'balance-bureau': 'balance:add',
    'vault-division': 'balance:multiply',
    'entry-rules': 'inequality:entry',
    'budget-boundaries': 'inequality:budget',
  }[lab.id];
  if (!ownModel || `${lab.model.kind}:${lab.model.mode}` !== ownModel) return null;
  const [a, b, test] = lab.model.values;
  if (![a, b, ...(test === undefined ? [] : [test])].every(safeWhole)) throw new RangeError('Unit 8 model needs whole-number quantities.');
  if (lab.id === 'balance-bureau') {
    const x = b - a;
    if (!safeWhole(x)) throw new RangeError('The balance solution must be a whole number.');
    return {
      id: lab.id, title: 'Rebalance the unknown', titleEs: 'Vuelve a equilibrar lo desconocido',
      prompt: 'The left side has an unknown amount plus the known amount. What value makes the sides equal?',
      promptEs: 'El lado izquierdo tiene una cantidad desconocida más la cantidad conocida. ¿Qué valor equilibra los lados?',
      answer: String(x), type: 'number',
      scene: `<div class="u8-balance" role="group" aria-label="Addition equation on a balance"><span>Left: x + <strong>${a}</strong></span><span class="u8-balance-sign" aria-hidden="true">=</span><span>Right: <strong>${b}</strong></span></div>`,
      sceneEs: `<div class="u8-balance" role="group" aria-label="Ecuación de suma en una balanza"><span>Izquierda: x + <strong>${a}</strong></span><span class="u8-balance-sign" aria-hidden="true">=</span><span>Derecha: <strong>${b}</strong></span></div>`,
    };
  }
  if (lab.id === 'vault-division') {
    if (!a || b % a) throw new RangeError('The vault must divide into equal whole-number groups.');
    const each = b / a;
    return {
      id: lab.id, title: 'Open equal vault compartments', titleEs: 'Abre compartimentos iguales de la bóveda',
      prompt: 'The total is shared equally among the compartments. What is in one compartment?',
      promptEs: 'El total se reparte en partes iguales entre los compartimentos. ¿Cuánto hay en uno?',
      answer: String(each), type: 'number',
      scene: `<div class="u8-vault" role="group" aria-label="Equal compartments with a shared total"><span>Total: <strong>${b}</strong></span><span>Equal compartments: <strong>${a}</strong></span><div class="u8-vault-boxes" aria-hidden="true">${Array.from({ length: a }, () => '<span>?</span>').join('')}</div></div>`,
      sceneEs: `<div class="u8-vault" role="group" aria-label="Compartimentos iguales con un total compartido"><span>Total: <strong>${b}</strong></span><span>Compartimentos iguales: <strong>${a}</strong></span><div class="u8-vault-boxes" aria-hidden="true">${Array.from({ length: a }, () => '<span>?</span>').join('')}</div></div>`,
    };
  }
  if (lab.id === 'entry-rules') {
    if (b > a) throw new RangeError('The source test must be below the entry minimum.');
    return {
      id: lab.id, title: 'Reach the entry line', titleEs: 'Llega a la línea de entrada',
      prompt: 'The entry rule is “at least” the boundary. How much must the test value increase to qualify?',
      promptEs: 'La regla de entrada es “al menos” el límite. ¿Cuánto debe aumentar el valor de prueba para cumplirla?',
      answer: String(a - b), type: 'buttons', options: [String(a), String(b), String(a - b)],
      scene: `<div class="u8-entry" role="group" aria-label="Inclusive entry boundary and test value"><span>Entry minimum: <strong>${a}</strong> (included)</span><span>Test value: <strong>${b}</strong></span></div>`,
      sceneEs: `<div class="u8-entry" role="group" aria-label="Límite de entrada incluido y valor de prueba"><span>Mínimo de entrada: <strong>${a}</strong> (incluido)</span><span>Valor de prueba: <strong>${b}</strong></span></div>`,
    };
  }
  if (lab.id === 'budget-boundaries') {
    if (b > a) throw new RangeError('The source test must be within the budget boundary.');
    const values = Array.from({ length: a - b + 1 }, (_, i) => b + i);
    if (values.length > 30) throw new RangeError('The boundary display exceeds its whole-number range.');
    return {
      id: lab.id, title: 'Count the allowed values', titleEs: 'Cuenta los valores permitidos',
      prompt: 'The rule is “at most” the boundary. How many whole-number values from the test value through the boundary qualify?',
      promptEs: 'La regla es “como máximo” el límite. ¿Cuántos números enteros desde el valor de prueba hasta el límite cumplen la regla?',
      answer: String(values.length), type: 'number',
      scene: `<div class="u8-budget" role="group" aria-label="Whole-number values up to and including the budget boundary"><span>Test value <strong>${b}</strong></span><div class="u8-budget-line">${values.map((n) => `<span>${n}</span>`).join('')}</div><span>Boundary <strong>${a}</strong> (included)</span></div>`,
      sceneEs: `<div class="u8-budget" role="group" aria-label="Números enteros hasta el límite del presupuesto inclusive"><span>Valor de prueba <strong>${b}</strong></span><div class="u8-budget-line">${values.map((n) => `<span>${n}</span>`).join('')}</div><span>Límite <strong>${a}</strong> (incluido)</span></div>`,
    };
  }
  return null;
}

export function checkUnit8(challenge, input) {
  if (!challenge) return false;
  const value = String(input ?? '').trim();
  return /^\d+$/.test(value) && value === challenge.answer;
}

export function mountUnit8(host, lab, state, save, game = false) {
  const challenge = unit8Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es';
  state.unit8 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  host.innerHTML = `<section class="u8-centerpiece" ${es ? 'lang="es"' : ''} aria-label="${es ? game ? 'Misión matemática' : 'Investiga la relación' : game ? 'Math mission' : 'Investigate the relationship'}"><p class="studio-eyebrow">${es ? game ? 'Misión matemática' : 'Investiga el modelo' : game ? 'Math mission' : 'Investigate the model'}</p><h3>${es ? challenge.titleEs : challenge.title}</h3><p>${es ? challenge.promptEs : challenge.prompt}</p>${es ? challenge.sceneEs : challenge.scene}<form><label>${es ? 'Tu respuesta' : 'Your answer'}<input name="unit8-answer" type="text" inputmode="${challenge.type === 'buttons' ? 'none' : 'numeric'}" autocomplete="off" required></label>${challenge.options ? `<div class="u8-options" role="group" aria-label="${es ? 'Elige una cantidad' : 'Choose an amount'}">${challenge.options.map((option) => `<button type="button" data-u8-option="${esc(option)}">${esc(option)}</button>`).join('')}</div>` : ''}<button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u8-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form'), input = form.elements['unit8-answer'], result = host.querySelector('.u8-result');
  host.querySelectorAll('[data-u8-option]').forEach((button) => button.onclick = () => { input.value = button.dataset.u8Option; form.requestSubmit(); });
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit8(challenge, input.value)) {
      state.unit8[key] = { solved: true };
      save();
      result.textContent = es ? 'Esa relación funciona. Explica cómo la muestra el modelo.' : 'That relationship works. Explain how the model shows it.';
      result.dataset.result = 'correct';
    } else {
      result.textContent = es ? 'Eso todavía no coincide con las cantidades. Revisa el modelo e inténtalo de nuevo.' : 'That does not fit these quantities yet. Recheck the model and try again.';
      result.dataset.result = 'retry';
    }
  };
  if (state.unit8[key]?.solved) result.textContent = es ? 'Ya resolviste este desafío. Explica tu método o inténtalo de nuevo.' : 'You solved this challenge. Explain your method or try it again.';
  return true;
}
