// Unit 9 missions connect the lab's starting growth model to tables and equations.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const whole = (value) => {
  if (!Number.isInteger(value) || value < 0) throw new RangeError('The growth model needs a nonnegative whole number.');
  return value;
};
const row = (x, y) => `<tr><th scope="row">${x}</th><td>${y}</td></tr>`;

export function unit9Challenge(lab) {
  if (lab.unit !== 9 || lab.model.kind !== 'growth') return null;
  const [rate, start, input] = lab.model.values.map(whole);
  if (lab.model.mode === 'weather' && lab.id === 'variable-weather') {
    return {
      id: lab.id,
      title: 'Put the two variables in order',
      titleEs: 'Ordena las dos variables',
      prompt: `After ${input} hours, what ordered pair (hours, water reading) belongs on the graph?`,
      promptEs: `Después de ${input} horas, ¿qué par ordenado (horas, lectura de agua) corresponde a la gráfica?`,
      answer: `${input},${rate * input + start}`,
      type: 'pair',
      scene: `<div class="u9-points"><p>Water starts at ${start} mm and rises ${rate} mm each hour.</p><table><caption>Hours and water reading</caption><thead><tr><th scope="col">Hours (x)</th><th scope="col">Water (y)</th></tr></thead><tbody>${row(0, start)}${row(1, rate + start)}${row(2, 2 * rate + start)}<tr><th scope="row">${input}</th><td>?</td></tr></tbody></table></div>`,
      sceneEs: `<div class="u9-points"><p>El agua comienza en ${start} mm y sube ${rate} mm cada hora.</p><table><caption>Horas y lectura de agua</caption><thead><tr><th scope="col">Horas (x)</th><th scope="col">Agua (y)</th></tr></thead><tbody>${row(0, start)}${row(1, rate + start)}${row(2, 2 * rate + start)}<tr><th scope="row">${input}</th><td>?</td></tr></tbody></table></div>`,
    };
  }
  if (lab.model.mode === 'fees' && lab.id === 'function-food-fair') {
    return {
      id: lab.id,
      title: 'Write the cost rule',
      titleEs: 'Escribe la regla del costo',
      prompt: 'Let x be the number of items and y the total cost. Write the equation shown by the table.',
      promptEs: 'Si x es el número de artículos y y es el costo total, escribe la ecuación que muestra la tabla.',
      answer: `y=${rate}x+${start}`,
      type: 'equation',
      scene: `<div class="u9-table"><table><caption>Items and total cost</caption><thead><tr><th scope="col">Items (x)</th><th scope="col">Cost (y)</th></tr></thead><tbody>${row(0, start)}${row(1, rate + start)}${row(2, 2 * rate + start)}${row(input, rate * input + start)}</tbody></table></div>`,
      sceneEs: `<div class="u9-table"><table><caption>Artículos y costo total</caption><thead><tr><th scope="col">Artículos (x)</th><th scope="col">Costo (y)</th></tr></thead><tbody>${row(0, start)}${row(1, rate + start)}${row(2, 2 * rate + start)}${row(input, rate * input + start)}</tbody></table></div>`,
    };
  }
  return null;
}

export function checkUnit9(challenge, input) {
  const value = String(input ?? '').trim().replace(/\s/g, '');
  if (challenge.type === 'pair') return /^\(?\d+,\d+\)?$/.test(value) && value.replace(/[()]/g, '') === challenge.answer;
  const [rate, start] = challenge.answer.slice(2).split('x+').map(Number);
  const standard = /^y=(\d+)x\+(\d+)$/.exec(value);
  if (standard) return Number(standard[1]) === rate && Number(standard[2]) === start;
  const reversed = /^y=(\d+)\+(\d+)x$/.exec(value);
  return !!reversed && Number(reversed[1]) === start && Number(reversed[2]) === rate;
}

export function mountUnit9(host, lab, state, save, game = false) {
  const challenge = unit9Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es';
  state.unit9 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  const label = es ? game ? 'Misión matemática' : 'Investiga las cantidades' : game ? 'Math mission' : 'Investigate the quantities';
  host.innerHTML = `<section class="u9-centerpiece" aria-label="${label}"><p class="studio-eyebrow">${label}</p><h3 ${es ? 'lang="es"' : ''}>${esc(es ? challenge.titleEs : challenge.title)}</h3><p ${es ? 'lang="es"' : ''}>${esc(es ? challenge.promptEs : challenge.prompt)}</p>${es ? challenge.sceneEs : challenge.scene}<form><label>${es ? 'Tu respuesta' : 'Your answer'}<input name="unit9-answer" type="text" inputmode="text" autocomplete="off" required></label><button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u9-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form'), input = form.elements['unit9-answer'], result = host.querySelector('.u9-result');
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit9(challenge, input.value)) {
      state.unit9[key] = { solved: true, answer: challenge.answer };
      save();
      result.textContent = es ? 'Esa relación funciona. Explica cómo la apoyan las cantidades mostradas.' : 'That relationship works. Explain how the displayed quantities support it.';
      result.dataset.result = 'correct';
    } else {
      result.textContent = es ? 'Eso todavía no coincide con estas cantidades. Revisa el modelo e intenta otra respuesta.' : 'That does not fit these quantities yet. Recheck the model and try another answer.';
      result.dataset.result = 'retry';
    }
  };
  if (state.unit9[key]?.solved) result.textContent = es ? 'Resolviste este desafío matemático. Explica tu método o inténtalo de nuevo.' : 'You solved this mathematical challenge. Explain your method or try it again.';
  return true;
}
