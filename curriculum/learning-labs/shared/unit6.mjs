// Unit 6 math missions use only the starting quantities in the lab models.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const whole = (value) => {
  if (!Number.isInteger(value) || value < 0) throw new RangeError('Expected a nonnegative whole number from the source model.');
  return value;
};
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const fraction = (numerator, denominator) => {
  if (!denominator) throw new RangeError('A fraction needs a nonzero denominator.');
  const common = gcd(numerator, denominator);
  const top = numerator / common, bottom = denominator / common;
  return bottom === 1 ? String(top) : `${top}/${bottom}`;
};
const decimalFraction = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value));
  if (!match) throw new RangeError('The source length must be a nonnegative decimal.');
  const denominator = 10 ** (match[2]?.length || 0);
  return [Number(match[1]) * denominator + Number(match[2] || 0), denominator];
};
const divisors = (value) => Array.from({ length: value }, (_, i) => i + 1).filter((n) => value % n === 0);
const multiples = (value, count) => Array.from({ length: count }, (_, i) => (i + 1) * value);
const card = (label, value) => `<span><strong>${esc(label)}</strong> ${esc(value)}</span>`;

export function unit6Challenge(lab) {
  if (lab.unit !== 6) return null;
  const ownModel = {
    'fraction-food-truck': 'fraction:servings',
    'power-plant': 'power:order',
    'expression-remix': 'expression:equivalence',
    'factor-factory': 'factors:gcf',
    'ribbon-rescue': 'fraction:ribbon',
    'fraction-field-team': 'fraction:field',
    'synchronization-station': 'factors:lcm',
    'algebra-workshop': 'expression:distribute',
  }[lab.id];
  if (!ownModel || `${lab.model.kind}:${lab.model.mode}` !== ownModel) return null;
  const [a, b, c] = lab.model.values;
  switch (lab.id) {
    case 'fraction-food-truck': {
      const supply = whole(a), top = whole(b), bottom = whole(c);
      return {
        id: lab.id,
        title: 'Count the equal servings',
        titleEs: 'Cuenta las porciones iguales',
        prompt: 'How many servings of the shown fraction fit in the whole supply?',
        promptEs: '¿Cuántas porciones de la fracción mostrada caben en la cantidad total?',
        answer: fraction(supply * bottom, top),
        type: 'fraction',
        scene: `<div class="u6-pieces">${card('Supply:', supply)}${card('Each serving:', `${top}/${bottom}`)}</div>`,
        sceneEs: `<div class="u6-pieces">${card('Cantidad:', supply)}${card('Cada porción:', `${top}/${bottom}`)}</div>`,
      };
    }
    case 'power-plant': {
      const base = whole(a), exponent = whole(b), after = whole(c);
      return {
        id: lab.id,
        title: 'Power before addition',
        titleEs: 'La potencia antes de sumar',
        prompt: 'Evaluate the power first, then add the final amount. What is the expression value?',
        promptEs: 'Calcula primero la potencia y luego suma la cantidad final. ¿Cuál es el valor de la expresión?',
        answer: String(base ** exponent + after),
        type: 'whole',
        scene: `<div class="u6-chain">${card('Repeated factor:', base)}${card('Number of factors:', exponent)}${card('Add after:', after)}</div>`,
        sceneEs: `<div class="u6-chain">${card('Factor repetido:', base)}${card('Número de factores:', exponent)}${card('Sumar después:', after)}</div>`,
      };
    }
    case 'expression-remix': {
      const factor = whole(a), constant = whole(b), x = whole(c);
      return {
        id: lab.id,
        title: 'Test equivalent expressions',
        titleEs: 'Comprueba expresiones equivalentes',
        prompt: 'Substitute the shown value of x into a(x + b). What value should the expanded expression also make?',
        promptEs: 'Sustituye el valor mostrado de x en a(x + b). ¿Qué valor debe dar también la expresión desarrollada?',
        answer: String(factor * (x + constant)),
        type: 'whole',
        scene: `<div class="u6-terms">${card('Expression:', `${factor}(x + ${constant})`)}${card('x =', x)}${card('Expanded:', `${factor}x + ${factor * constant}`)}</div>`,
        sceneEs: `<div class="u6-terms">${card('Expresión:', `${factor}(x + ${constant})`)}${card('x =', x)}${card('Desarrollada:', `${factor}x + ${factor * constant}`)}</div>`,
      };
    }
    case 'factor-factory': {
      const first = whole(a), second = whole(b);
      return {
        id: lab.id,
        title: 'Find the largest shared factor',
        titleEs: 'Encuentra el factor común mayor',
        prompt: 'Which greatest number divides both source quantities without a remainder?',
        promptEs: '¿Cuál es el mayor número que divide ambas cantidades sin dejar residuo?',
        answer: String(gcd(first, second)),
        type: 'whole',
        scene: `<div class="u6-factors">${card(`Factors of ${first}:`, divisors(first).join(', '))}${card(`Factors of ${second}:`, divisors(second).join(', '))}</div>`,
        sceneEs: `<div class="u6-factors">${card(`Factores de ${first}:`, divisors(first).join(', '))}${card(`Factores de ${second}:`, divisors(second).join(', '))}</div>`,
      };
    }
    case 'ribbon-rescue': {
      const [supplyTop, supplyBottom] = decimalFraction(a), sizeTop = whole(b), sizeBottom = whole(c);
      return {
        id: lab.id,
        title: 'Divide the mixed-length ribbon',
        titleEs: 'Divide la cinta de longitud mixta',
        prompt: 'Divide the total length by the length of one piece. Write the exact quotient as an improper fraction.',
        promptEs: 'Divide la longitud total entre la longitud de una pieza. Escribe el cociente exacto como fracción impropia.',
        answer: fraction(supplyTop * sizeBottom, supplyBottom * sizeTop),
        type: 'fraction',
        scene: `<div class="u6-ribbon">${card('Ribbon length:', a)}${card('Piece length:', `${sizeTop}/${sizeBottom}`)}</div>`,
        sceneEs: `<div class="u6-ribbon">${card('Longitud de la cinta:', a)}${card('Longitud de la pieza:', `${sizeTop}/${sizeBottom}`)}</div>`,
      };
    }
    case 'fraction-field-team': {
      const [supplyTop, supplyBottom] = decimalFraction(a), sizeTop = whole(b), sizeBottom = whole(c);
      return {
        id: lab.id,
        title: 'Plan exact field portions',
        titleEs: 'Planifica porciones exactas para el campo',
        prompt: 'How many portions of the shown size fit in the total? Write the exact quotient as an improper fraction.',
        promptEs: '¿Cuántas porciones del tamaño mostrado caben en el total? Escribe el cociente exacto como fracción impropia.',
        answer: fraction(supplyTop * sizeBottom, supplyBottom * sizeTop),
        type: 'fraction',
        scene: `<div class="u6-groups">${card('Total supply:', a)}${card('One portion:', `${sizeTop}/${sizeBottom}`)}</div>`,
        sceneEs: `<div class="u6-groups">${card('Cantidad total:', a)}${card('Una porción:', `${sizeTop}/${sizeBottom}`)}</div>`,
      };
    }
    case 'synchronization-station': {
      const first = whole(a), second = whole(b), common = first * second / gcd(first, second);
      return {
        id: lab.id,
        title: 'Find the first shared stop',
        titleEs: 'Encuentra la primera parada común',
        prompt: 'What is the first positive multiple both source numbers share?',
        promptEs: '¿Cuál es el primer múltiplo positivo que comparten ambos números?',
        answer: String(common),
        type: 'whole',
        scene: `<div class="u6-multiples">${card(`Multiples of ${first}:`, `${multiples(first, 2).join(', ')}, …`)}${card(`Multiples of ${second}:`, `${multiples(second, 1).join(', ')}, …`)}</div>`,
        sceneEs: `<div class="u6-multiples">${card(`Múltiplos de ${first}:`, `${multiples(first, 2).join(', ')}, …`)}${card(`Múltiplos de ${second}:`, `${multiples(second, 1).join(', ')}, …`)}</div>`,
      };
    }
    case 'algebra-workshop': {
      const outside = whole(a), inside = whole(b), x = whole(c);
      return {
        id: lab.id,
        title: 'Build the equivalent expression',
        titleEs: 'Construye la expresión equivalente',
        prompt: 'Distribute the outside factor to both terms. Write the expanded expression using x.',
        promptEs: 'Distribuye el factor exterior a ambos términos. Escribe la expresión desarrollada con x.',
        answer: `${outside}x+${outside * inside}`,
        type: 'expression',
        scene: `<div class="u6-tiles">${card('Before:', `${outside}(x + ${inside})`)}${card('Check with x =', x)}</div>`,
        sceneEs: `<div class="u6-tiles">${card('Antes:', `${outside}(x + ${inside})`)}${card('Comprueba con x =', x)}</div>`,
      };
    }
    default:
      return null;
  }
}

export function checkUnit6(challenge, input) {
  const value = String(input ?? '').trim();
  if (challenge.type === 'expression') return value.replace(/\s/g, '').replace(/\*/g, '') === challenge.answer;
  if (challenge.type === 'fraction') {
    const match = /^(\d+)(?:\s*\/\s*(\d+))?$/.exec(value);
    if (!match || Number(match[2] || 1) === 0) return false;
    return fraction(Number(match[1]), Number(match[2] || 1)) === challenge.answer;
  }
  return /^\d+$/.test(value) && value === challenge.answer;
}

export function mountUnit6(host, lab, state, save, game = false) {
  const challenge = unit6Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es';
  state.unit6 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  const label = es ? game ? 'Misión matemática' : 'Investiga las cantidades' : game ? 'Math mission' : 'Investigate the quantities';
  host.innerHTML = `<section class="u6-centerpiece" aria-label="${label}"><p class="studio-eyebrow">${label}</p><h3 ${es ? 'lang="es"' : ''}>${esc(es ? challenge.titleEs : challenge.title)}</h3><p ${es ? 'lang="es"' : ''}>${esc(es ? challenge.promptEs : challenge.prompt)}</p>${es ? challenge.sceneEs : challenge.scene}<form><label>${es ? 'Tu respuesta' : 'Your answer'}<input name="unit6-answer" type="text" inputmode="${challenge.type === 'whole' ? 'numeric' : 'text'}" autocomplete="off" required></label><button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u6-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form'), input = form.elements['unit6-answer'], result = host.querySelector('.u6-result');
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit6(challenge, input.value)) {
      state.unit6[key] = { solved: true, answer: challenge.answer };
      save();
      result.textContent = es ? 'Esa relación funciona. Explica cómo la apoyan las cantidades mostradas.' : 'That relationship works. Explain how the displayed quantities support it.';
      result.dataset.result = 'correct';
    } else {
      result.textContent = es ? 'Eso todavía no coincide con estas cantidades. Revisa el modelo e intenta otra respuesta.' : 'That does not fit these quantities yet. Recheck the model and try another answer.';
      result.dataset.result = 'retry';
    }
  };
  if (state.unit6[key]?.solved) result.textContent = es ? 'Resolviste este desafío matemático. Explica tu método o inténtalo de nuevo.' : 'You solved this mathematical challenge. Explain your method or try it again.';
  return true;
}
