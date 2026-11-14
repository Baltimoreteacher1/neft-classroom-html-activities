// Unit 2 centerpieces and math missions. All quantities come from each lab's starting model.
const sorted = (values) => [...values].sort((a, b) => a - b);
const middleTwice = (values) => {
  const s = sorted(values), n = s.length;
  return n % 2 ? 2 * s[(n - 1) / 2] : s[n / 2 - 1] + s[n / 2];
};
const halfText = (twice) => twice % 2 ? `${Math.floor(twice / 2)}.5` : String(twice / 2);
const cents = (value) => {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new RangeError('Price must use dollars and cents.');
  return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
};
const money = (value) => `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function unit2Challenge(lab) {
  if (lab.unit !== 2) return null;
  const v = lab.model.values, id = lab.id;
  if (id === 'data-newsroom') {
    const bins = new Map();
    for (const n of v) bins.set(Math.floor(n / 5) * 5, (bins.get(Math.floor(n / 5) * 5) || 0) + 1);
    const entries = [...bins].sort((a, b) => a[0] - b[0]);
    const winner = entries.reduce((best, row) => row[1] > best[1] ? row : best);
    return { id, title: 'Build the headline from the bars', titleEs: 'Crea el titular con las barras', prompt: 'Which interval holds the most observations? Choose its starting value.', promptEs: '¿Qué intervalo contiene más observaciones? Elige su valor inicial.', answer: String(winner[0]), type: 'buttons', options: entries.map(([start]) => String(start)), scene: `<div class="u2-bars" role="img" aria-label="Histogram intervals with dots for each observation">${entries.map(([start, count]) => `<div><span class="u2-stack" aria-hidden="true">${'●'.repeat(count)}</span><span>${start}–${start + 4}</span></div>`).join('')}</div>` };
  }
  if (id === 'middle-ground') return { id, title: 'Find the center of the sorted line', titleEs: 'Encuentra el centro de los datos ordenados', prompt: 'What is the median of these observations?', promptEs: '¿Cuál es la mediana de estas observaciones?', answer: halfText(middleTwice(v)), type: 'number', scene: `<div class="u2-dots" aria-label="Sorted observations">${sorted(v).map((n) => `<span>${n}</span>`).join('')}</div>` };
  if (id === 'consistency-cup') {
    const s = sorted(v), mid = s.length / 2, q1 = middleTwice(s.slice(0, mid)), q3 = middleTwice(s.slice(mid));
    return { id, title: 'Measure the middle-half spread', titleEs: 'Mide la dispersión de la mitad central', prompt: 'Find Q1 and Q3 from the lower and upper halves. What is the IQR?', promptEs: 'Halla Q1 y Q3 en las mitades inferior y superior. ¿Cuál es el rango intercuartílico?', answer: halfText(q3 - q1), type: 'number', scene: `<div class="u2-spread"><strong>Lower half</strong><span>${s.slice(0, mid).join(', ')}</span><strong>Upper half</strong><span>${s.slice(mid).join(', ')}</span></div>` };
  }
  if (id === 'delivery-dispatch') {
    const [total, each] = v;
    if (!Number.isInteger(total / each)) throw new RangeError('The source shipment must divide evenly.');
    return { id, title: 'Load equal shipments', titleEs: 'Organiza envíos iguales', prompt: 'How many equal shipments can this supply fill?', promptEs: '¿Cuántos envíos iguales se pueden llenar con esta cantidad?', answer: String(total / each), type: 'number', scene: `<div class="u2-delivery"><span>Supply: <strong>${total}</strong></span><span>In each shipment: <strong>${each}</strong></span></div>` };
  }
  if (id === 'fair-share-festival') {
    const sum = v.reduce((a, b) => a + b, 0);
    if (sum % v.length) throw new RangeError('The source mean must be a whole number.');
    const mean = sum / v.length, distance = v.reduce((a, b) => a + Math.abs(b - mean), 0);
    if (distance % v.length) throw new RangeError('The source MAD must be a whole number.');
    return { id, title: 'Balance the fair share', titleEs: 'Equilibra el reparto justo', prompt: 'Enter the mean, then the mean absolute deviation (MAD).', promptEs: 'Escribe la media y después la desviación absoluta media (MAD).', answer: `${mean},${distance / v.length}`, type: 'pair', scene: `<div class="u2-shares" aria-label="Festival observations">${v.map((n) => `<span>${n}</span>`).join('')}</div>` };
  }
  if (id === 'outlier-investigation') {
    const s = sorted(v), sum = s.reduce((a, b) => a + b, 0), removed = s.slice(0, -1);
    const meanNumerator = Math.abs(sum * removed.length - (sum - s.at(-1)) * s.length);
    const medianTwiceDiff = Math.abs(middleTwice(s) - middleTwice(removed));
    const meanMovesMore = 2 * meanNumerator > medianTwiceDiff * s.length * removed.length;
    return { id, title: 'Investigate the unusual value', titleEs: 'Investiga el valor inusual', prompt: 'If the largest observation is removed, which measure moves more?', promptEs: 'Si se quita la observación mayor, ¿qué medida cambia más?', answer: meanMovesMore ? 'mean' : 'median', type: 'buttons', options: ['mean', 'median'], scene: `<div class="u2-outlier" aria-label="Observations with largest value marked">${s.map((n, i) => `<span ${i === s.length - 1 ? 'class="unusual"' : ''}>${n}${i === s.length - 1 ? ' · largest' : ''}</span>`).join('')}</div>` };
  }
  if (id === 'decimal-design-shop') {
    const [price, count] = v, totalCents = cents(price) * count;
    return { id, title: 'Check the exact receipt', titleEs: 'Comprueba el recibo exacto', prompt: 'What is the total cost in dollars and cents?', promptEs: '¿Cuál es el costo total en dólares y centavos?', answer: money(totalCents), type: 'number', scene: `<div class="u2-receipt"><span>Price per item <strong>$${money(cents(price))}</strong></span><span>Items <strong>${count}</strong></span></div>` };
  }
  return null;
}

export function checkUnit2(challenge, input) {
  const value = String(input ?? '').trim().replace(/^\$/, '');
  if (challenge.type === 'pair') return /^\d+\s*,\s*\d+$/.test(value) && value.replace(/\s/g, '') === challenge.answer;
  if (challenge.id === 'decimal-design-shop') {
    try { return cents(value) === cents(challenge.answer); } catch { return false; }
  }
  if (challenge.type === 'buttons') return value.toLowerCase() === challenge.answer;
  const decimal = value.replace(',', '.');
  return /^(?:\d+|\d+\.5)$/.test(decimal) && decimal === challenge.answer;
}

/** Mounts a distinct math interaction in Investigate or Games; a miss never prints the answer. */
export function mountUnit2(host, lab, state, save, game = false) {
  const challenge = unit2Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es';
  state.unit2 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  const scene = es ? challenge.scene.replaceAll('Lower half', 'Mitad inferior').replaceAll('Upper half', 'Mitad superior').replaceAll('Supply:', 'Cantidad:').replaceAll('In each shipment:', 'En cada envío:').replaceAll('Price per item', 'Precio por artículo').replaceAll('Items', 'Artículos').replaceAll(' · largest', ' · mayor') : challenge.scene;
  host.innerHTML = `<section class="u2-centerpiece" aria-label="${game ? 'Math mission' : 'Mathematics centerpiece'}"><p class="studio-eyebrow">${es ? game ? 'Misión matemática' : 'Investiga los datos del modelo' : game ? 'Math mission' : 'Investigate the source data'}</p><h3 ${es ? 'lang="es"' : ''}>${es ? challenge.titleEs : challenge.title}</h3><p ${es ? 'lang="es"' : ''}>${es ? challenge.promptEs : challenge.prompt}</p>${scene}<form><label>${es ? challenge.type === 'pair' ? 'Media, MAD' : 'Tu respuesta' : challenge.type === 'pair' ? 'Mean, MAD' : 'Your answer'}<input name="unit2-answer" type="text" inputmode="${challenge.type === 'buttons' ? 'none' : 'decimal'}" autocomplete="off" required></label>${challenge.options ? `<div class="u2-options" role="group" aria-label="${es ? 'Elige una respuesta' : 'Choose an answer'}">${challenge.options.map((option) => `<button type="button" data-u2-option="${esc(option)}">${es && option === 'mean' ? 'media' : es && option === 'median' ? 'mediana' : esc(option)}</button>`).join('')}</div>` : ''}<button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u2-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form'), input = form.elements['unit2-answer'], result = host.querySelector('.u2-result');
  host.querySelectorAll('[data-u2-option]').forEach((button) => button.onclick = () => { input.value = button.dataset.u2Option; form.requestSubmit(); });
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit2(challenge, input.value)) { state.unit2[key] = { solved: true, answer: challenge.answer }; save(); result.textContent = es ? 'Esa relación funciona. Explica cómo la apoyan las cantidades mostradas.' : 'That relationship works. Explain how the displayed quantities support it.'; result.dataset.result = 'correct'; }
    else { result.textContent = es ? 'Eso todavía no coincide con estas cantidades. Revisa el modelo e intenta otra respuesta.' : 'That does not fit these quantities yet. Recheck the model and try another answer.'; result.dataset.result = 'retry'; }
  };
  if (state.unit2[key]?.solved) result.textContent = es ? 'Resolviste este desafío matemático. Explica tu método o inténtalo de nuevo.' : 'You solved this mathematical challenge. Explain your method or try it again.';
  return true;
}
