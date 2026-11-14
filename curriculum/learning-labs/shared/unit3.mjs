// Unit 3 math missions use the starting quantities in each lab's model.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const whole = (value) => {
  if (!Number.isInteger(value) || value < 0) throw new RangeError('The source quantity must be a nonnegative whole number.');
  return value;
};
const hundredths = (value) => {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new RangeError('The source quantity must have at most two decimal places.');
  return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
};
const decimal = (value) => `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
const cups = (n, noun) => `${n} ${noun} ${n === 1 ? 'cup' : 'cups'}`;

export function unit3Challenge(lab) {
  if (lab.unit !== 3) return null;
  const ownModel = {
    'recipe-remix': 'ratio:mixer',
    'ratio-railway': 'growth:ratio-graph',
    'mixture-matchup': 'ratio:compare',
    'world-expedition': 'conversion:expedition',
    'best-buy-boulevard': 'rate:shopping',
    'scale-and-sail': 'conversion:scale',
  }[lab.id];
  if (!ownModel || `${lab.model.kind}:${lab.model.mode}` !== ownModel) return null;
  const [a, b, c] = lab.model.values;
  switch (lab.id) {
    case 'recipe-remix': {
      const juice = whole(a), water = whole(b);
      return {
        id: lab.id,
        title: 'Name the part and the whole',
        titleEs: 'Nombra la parte y el total',
        prompt: 'Write the ratio of juice cups to all drink cups. Keep that order.',
        promptEs: 'Escribe la razón de tazas de jugo al total de tazas de bebida. Conserva ese orden.',
        answer: `${juice}:${juice + water}`,
        type: 'ratio',
        scene: `<div class="u3-delivery"><span>${cups(juice, 'juice')}</span><span>${cups(water, 'water')}</span><span>Whole drink: ${juice + water} cups</span></div>`,
        sceneEs: `<div class="u3-delivery"><span>${juice} tazas de jugo</span><span>${water} tazas de agua</span><span>Bebida total: ${juice + water} tazas</span></div>`,
      };
    }
    case 'ratio-railway': {
      const per = whole(a), start = whole(b), carriages = whole(c);
      if (start !== 0) throw new RangeError('This proportional table must start at zero.');
      return {
        id: lab.id,
        title: 'Complete the carriage table',
        titleEs: 'Completa la tabla de vagones',
        prompt: `There are ${per} passengers per carriage. How many passengers ride in ${carriages} carriages?`,
        promptEs: `Hay ${per} pasajeros por vagón. ¿Cuántos pasajeros viajan en ${carriages} vagones?`,
        answer: String(per * carriages),
        type: 'whole',
        scene: `<div class="u3-dots" aria-label="Carriage input and passenger output"><span>1 carriage → ${per} passengers</span><span>${carriages} carriages → ?</span></div>`,
        sceneEs: `<div class="u3-dots" aria-label="Vagones y pasajeros"><span>1 vagón → ${per} pasajeros</span><span>${carriages} vagones → ?</span></div>`,
      };
    }
    case 'mixture-matchup': {
      const color = whole(a), white = whole(b);
      // The fixed 3:5 reference is part of the existing ratio:compare model.
      const cross = color * 5 - white * 3;
      return {
        id: lab.id,
        title: 'Compare paint with equal white',
        titleEs: 'Compara la pintura con igual cantidad de blanco',
        prompt: 'Which mix has more color paint for each cup of white paint?',
        promptEs: '¿Qué mezcla tiene más pintura de color por cada taza de pintura blanca?',
        answer: cross > 0 ? 'your' : cross < 0 ? 'reference' : 'equal',
        type: 'buttons',
        options: [
          { value: 'your', en: 'Your mix', es: 'Tu mezcla' },
          { value: 'reference', en: 'Reference mix', es: 'Mezcla de referencia' },
          { value: 'equal', en: 'Same amount per white cup', es: 'La misma cantidad por taza blanca' },
        ],
        scene: `<div class="u3-delivery"><span>Your mix: ${color} color : ${white} white</span><span>Reference: 3 color : 5 white</span></div>`,
        sceneEs: `<div class="u3-delivery"><span>Tu mezcla: ${color} de color : ${white} de blanco</span><span>Referencia: 3 de color : 5 de blanco</span></div>`,
      };
    }
    case 'world-expedition': {
      const inches = whole(a), factor = hundredths(b);
      return {
        id: lab.id,
        title: 'Convert across measurement systems',
        titleEs: 'Convierte entre sistemas de medida',
        prompt: 'How many centimeters match the shown inches? Enter a decimal.',
        promptEs: '¿Cuántos centímetros corresponden a las pulgadas mostradas? Escribe un decimal.',
        answer: decimal(inches * factor),
        type: 'hundredths',
        scene: `<div class="u3-delivery"><span>${inches} inches</span><span>1 inch = ${decimal(factor)} centimeters</span></div>`,
        sceneEs: `<div class="u3-delivery"><span>${inches} pulgadas</span><span>1 pulgada = ${decimal(factor)} centímetros</span></div>`,
      };
    }
    case 'best-buy-boulevard': {
      const dollars = whole(a), items = whole(b);
      if (!items || (dollars * 100) % items) throw new RangeError('The source unit price must be exact to a cent.');
      return {
        id: lab.id,
        title: 'Find the one-item price',
        titleEs: 'Encuentra el precio de un artículo',
        prompt: 'What is the price per item in dollars and cents?',
        promptEs: '¿Cuál es el precio por artículo en dólares y centavos?',
        answer: decimal(dollars * 100 / items),
        type: 'hundredths',
        scene: `<div class="u3-receipt"><span>${items} items cost $${dollars}</span><span>1 item costs ?</span></div>`,
        sceneEs: `<div class="u3-receipt"><span>${items} artículos cuestan $${dollars}</span><span>1 artículo cuesta ?</span></div>`,
      };
    }
    case 'scale-and-sail': {
      const feet = whole(a), inchesPerFoot = whole(b);
      return {
        id: lab.id,
        title: 'Cancel the feet',
        titleEs: 'Cancela los pies',
        prompt: 'How many inches represent the shown length in feet?',
        promptEs: '¿Cuántas pulgadas representan la longitud mostrada en pies?',
        answer: String(feet * inchesPerFoot),
        type: 'whole',
        scene: `<div class="u3-delivery"><span>${feet} feet</span><span>1 foot = ${inchesPerFoot} inches</span></div>`,
        sceneEs: `<div class="u3-delivery"><span>${feet} pies</span><span>1 pie = ${inchesPerFoot} pulgadas</span></div>`,
      };
    }
    default:
      return null;
  }
}

export function checkUnit3(challenge, input) {
  const value = String(input ?? '').trim().replace(/^\$/, '');
  if (challenge.type === 'buttons') return value === challenge.answer;
  if (challenge.type === 'ratio') return /^\d+\s*:\s*\d+$/.test(value) && value.replace(/\s/g, '') === challenge.answer;
  if (challenge.type === 'hundredths') {
    try { return hundredths(value.replace(',', '.')) === hundredths(challenge.answer); } catch { return false; }
  }
  return /^\d+$/.test(value) && value === challenge.answer;
}

export function mountUnit3(host, lab, state, save, game = false) {
  const challenge = unit3Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es';
  state.unit3 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  const options = challenge.options
    ? `<div class="u3-options" role="group" aria-label="${es ? 'Elige una respuesta' : 'Choose an answer'}">${challenge.options.map((option) => `<button type="button" data-u3-option="${esc(option.value)}">${esc(es ? option.es : option.en)}</button>`).join('')}</div>`
    : '';
  host.innerHTML = `<section class="u3-centerpiece" aria-label="${es ? game ? 'Misión matemática' : 'Investiga las cantidades' : game ? 'Math mission' : 'Investigate the quantities'}"><p class="studio-eyebrow">${es ? game ? 'Misión matemática' : 'Investiga las cantidades' : game ? 'Math mission' : 'Investigate the quantities'}</p><h3 ${es ? 'lang="es"' : ''}>${esc(es ? challenge.titleEs : challenge.title)}</h3><p ${es ? 'lang="es"' : ''}>${esc(es ? challenge.promptEs : challenge.prompt)}</p>${es ? challenge.sceneEs : challenge.scene}<form><label>${es ? 'Tu respuesta' : 'Your answer'}<input name="unit3-answer" type="text" inputmode="${challenge.type === 'buttons' ? 'none' : challenge.type === 'ratio' ? 'text' : 'decimal'}" autocomplete="off" required></label>${options}<button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u3-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form'), input = form.elements['unit3-answer'], result = host.querySelector('.u3-result');
  host.querySelectorAll('[data-u3-option]').forEach((button) => button.onclick = () => { input.value = button.dataset.u3Option; form.requestSubmit(); });
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit3(challenge, input.value)) {
      state.unit3[key] = { solved: true, answer: challenge.answer };
      save();
      result.textContent = es ? 'Esa relación funciona. Explica cómo la apoyan las cantidades mostradas.' : 'That relationship works. Explain how the displayed quantities support it.';
      result.dataset.result = 'correct';
    } else {
      result.textContent = es ? 'Eso todavía no coincide con estas cantidades. Revisa el modelo e intenta otra respuesta.' : 'That does not fit these quantities yet. Recheck the model and try another answer.';
      result.dataset.result = 'retry';
    }
  };
  if (state.unit3[key]?.solved) result.textContent = es ? 'Resolviste este desafío matemático. Explica tu método o inténtalo de nuevo.' : 'You solved this mathematical challenge. Explain your method or try it again.';
  return true;
}
