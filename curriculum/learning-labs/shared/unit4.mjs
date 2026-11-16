// Unit 4 source-data centerpieces. Percent work stays in whole-number hundredths.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function wholePercent(part, percent) {
  if (!Number.isSafeInteger(part) || !Number.isSafeInteger(percent) || percent <= 0 || percent > 100) throw new RangeError('Invalid source percent and part.');
  const numerator = part * 100;
  if (!Number.isSafeInteger(numerator) || numerator % percent) throw new RangeError('The source whole must be exact.');
  return numerator / percent;
}

export function unit4Challenge(lab) {
  if (lab.unit !== 4) return null;
  const ownModel = {
    'hundred-square-studio': 'percent:grid',
    'sale-signals': 'percent:discount',
    'missing-whole': 'percent:whole',
  }[lab.id];
  if (!ownModel || `${lab.model.kind}:${lab.model.mode}` !== ownModel) return null;
  const [first, second] = lab.model.values;
  if (lab.id === 'hundred-square-studio') {
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(second) || second !== 100 || first < 0 || first > 100) throw new RangeError('The source grid must have 100 squares.');
    const open = second - first;
    return {
      id: lab.id,
      title: 'Read the other part of the hundred-square',
      titleEs: 'Lee la otra parte de la cuadrícula de cien',
      prompt: 'The marked squares show one part. What percent of the grid is unmarked?',
      promptEs: 'Los cuadros marcados muestran una parte. ¿Qué porcentaje de la cuadrícula no está marcado?',
      answer: String(open),
      scene: `<div class="u4-grid" role="img" aria-label="100-square grid with ${first} squares marked">${Array.from({ length: second }, (_, i) => `<span class="${i < first ? 'u4-marked' : 'u4-open'}" aria-hidden="true"></span>`).join('')}</div><p>${first} marked out of ${second}. How many hundredths are left?</p>`,
      sceneEs: `<div class="u4-grid" role="img" aria-label="Cuadrícula de cien con ${first} cuadros marcados">${Array.from({ length: second }, (_, i) => `<span class="${i < first ? 'u4-marked' : 'u4-open'}" aria-hidden="true"></span>`).join('')}</div><p>${first} marcados de ${second}. ¿Cuántos centésimos faltan?</p>`,
    };
  }
  if (lab.id === 'sale-signals') {
    const [percent, price] = [first, second];
    if (![percent, price].every(Number.isSafeInteger) || percent < 0 || percent > 100 || price < 0) throw new RangeError('Invalid source sale.');
    const discountedHundredths = price * percent;
    if (!Number.isSafeInteger(discountedHundredths) || discountedHundredths % 100) throw new RangeError('The source discount must be exact.');
    const discount = discountedHundredths / 100;
    return {
      id: lab.id,
      title: 'Finish the sale tag',
      titleEs: 'Completa la etiqueta de oferta',
      prompt: 'Find the discount, then subtract it from the original price. What is the sale price?',
      promptEs: 'Halla el descuento y réstalo del precio original. ¿Cuál es el precio de oferta?',
      answer: String(price - discount),
      scene: `<div class="u4-sale"><span>Original price <strong>$${price}</strong></span><span>Discount <strong>${percent}%</strong></span><span>Sale price <strong>?</strong></span></div>`,
      sceneEs: `<div class="u4-sale"><span>Precio original <strong>$${price}</strong></span><span>Descuento <strong>${percent}%</strong></span><span>Precio de oferta <strong>?</strong></span></div>`,
    };
  }
  if (lab.id === 'missing-whole') {
    const [percent, part] = [first, second];
    const whole = wholePercent(part, percent);
    return {
      id: lab.id,
      title: 'Complete the equivalent-ratio table',
      titleEs: 'Completa la tabla de razones equivalentes',
      prompt: 'The given part is not the whole. What amount matches 100%?',
      promptEs: 'La parte dada no es el total. ¿Qué cantidad corresponde al 100%?',
      answer: String(whole),
      scene: `<table class="u4-ratio"><caption>Matching percent and amount</caption><thead><tr><th scope="col">Percent</th><th scope="col">Amount</th></tr></thead><tbody><tr><th scope="row">${percent}%</th><td>${part}</td></tr><tr><th scope="row">100%</th><td>?</td></tr></tbody></table>`,
      sceneEs: `<table class="u4-ratio"><caption>Porcentaje y cantidad correspondientes</caption><thead><tr><th scope="col">Porcentaje</th><th scope="col">Cantidad</th></tr></thead><tbody><tr><th scope="row">${percent}%</th><td>${part}</td></tr><tr><th scope="row">100%</th><td>?</td></tr></tbody></table>`,
    };
  }
  return null;
}

export function checkUnit4(challenge, input) {
  if (!challenge || !['hundred-square-studio', 'sale-signals', 'missing-whole'].includes(challenge.id)) return false;
  const value = String(input ?? '').trim().replace(/^\$/, '').replace(/%$/, '').trim();
  return /^\d+$/.test(value) && Number(value) === Number(challenge.answer);
}

export function mountUnit4(host, lab, state, save, game = false) {
  const challenge = unit4Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es';
  state.unit4 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  host.innerHTML = `<section class="u2-centerpiece u4-centerpiece" ${es ? 'lang="es"' : ''} aria-label="${es ? game ? 'Misión matemática' : 'Investiga el porcentaje' : game ? 'Math mission' : 'Investigate the percent'}"><p class="studio-eyebrow">${es ? game ? 'Misión matemática' : 'Investiga el porcentaje' : game ? 'Math mission' : 'Investigate the percent'}</p><h3>${esc(es ? challenge.titleEs : challenge.title)}</h3><p>${esc(es ? challenge.promptEs : challenge.prompt)}</p><div>${es ? challenge.sceneEs : challenge.scene}</div><form><label>${es ? 'Tu respuesta' : 'Your answer'}<input name="unit4-answer" type="text" inputmode="numeric" autocomplete="off" required></label><button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u4-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form');
  const input = form.elements['unit4-answer'];
  const result = host.querySelector('.u4-result');
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit4(challenge, input.value)) {
      state.unit4[key] = { solved: true, answer: challenge.answer };
      save();
      result.textContent = es ? 'Esa relación funciona. Explica cómo lo muestra el modelo.' : 'That relationship works. Explain how the model shows it.';
      result.dataset.result = 'correct';
    } else {
      result.textContent = es ? 'Eso todavía no coincide con el modelo. Revisa las cantidades e inténtalo otra vez.' : 'That does not fit the model yet. Recheck the quantities and try again.';
      result.dataset.result = 'retry';
    }
  };
  if (state.unit4[key]?.solved) result.textContent = es ? 'Resolviste este desafío. Explica tu método o inténtalo de nuevo.' : 'You solved this challenge. Explain your method or try it again.';
  return true;
}
