// Unit 7 source-data centerpieces. Every calculation uses signed whole numbers.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const known = {
  'elevation-expedition': ['line', 'opposites', 2],
  'deep-sea-order': ['line', 'absolute', 2],
  'coordinate-couriers': ['coordinates', 'distance', 4],
  'grid-architects': ['coordinates', 'rectangle', 4],
  'mirror-mission': ['coordinates', 'reflect', 4],
};

export function unit7Challenge(lab) {
  if (lab.unit !== 7) return null;
  const match = known[lab.id];
  if (!match || lab.model.kind !== match[0] || lab.model.mode !== match[1]) return null;
  const v = lab.model.values;
  if (v.length !== match[2] || !v.every(Number.isSafeInteger)) throw new RangeError('Unit 7 source coordinates must be whole numbers.');
  const [a, b, c, d] = v;
  if (lab.id === 'elevation-expedition') {
    return {
      id: lab.id,
      title: 'Place the opposite elevation',
      titleEs: 'Ubica la elevación opuesta',
      prompt: 'What is the opposite of the first elevation?',
      promptEs: '¿Cuál es el opuesto de la primera elevación?',
      answer: String(-a),
      scene: `<div class="u7-opposite"><span>First elevation <strong>${a}</strong></span><span>Zero <strong>0</strong></span><span>Opposite elevation <strong>?</strong></span></div>`,
      sceneEs: `<div class="u7-opposite"><span>Primera elevación <strong>${a}</strong></span><span>Cero <strong>0</strong></span><span>Elevación opuesta <strong>?</strong></span></div>`,
    };
  }
  if (lab.id === 'deep-sea-order') {
    return {
      id: lab.id,
      title: 'Measure the gap between locations',
      titleEs: 'Mide la distancia entre lugares',
      prompt: 'How many units apart are these two positions on the number line?',
      promptEs: '¿Cuántas unidades separan estas dos posiciones en la recta numérica?',
      answer: String(Math.abs(a - b)),
      scene: `<div class="u7-distance"><span>Position A <strong>${a}</strong></span><span>Distance <strong>?</strong></span><span>Position B <strong>${b}</strong></span></div>`,
      sceneEs: `<div class="u7-distance"><span>Posición A <strong>${a}</strong></span><span>Distancia <strong>?</strong></span><span>Posición B <strong>${b}</strong></span></div>`,
    };
  }
  if (lab.id === 'coordinate-couriers') {
    if (b !== d) throw new RangeError('The source courier route must be horizontal.');
    return {
      id: lab.id,
      title: 'Measure a horizontal courier route',
      titleEs: 'Mide una ruta horizontal',
      prompt: 'The points share a y-coordinate. What is their distance in grid units?',
      promptEs: 'Los puntos tienen la misma coordenada y. ¿Cuál es la distancia entre ellos en unidades de la cuadrícula?',
      answer: String(Math.abs(c - a)),
      scene: `<div class="u7-route"><span>A (${a}, ${b})</span><span class="u7-route-gap" aria-hidden="true">— ? —</span><span>B (${c}, ${d})</span></div>`,
      sceneEs: `<div class="u7-route"><span>A (${a}, ${b})</span><span class="u7-route-gap" aria-hidden="true">— ? —</span><span>B (${c}, ${d})</span></div>`,
    };
  }
  if (lab.id === 'grid-architects') {
    const width = Math.abs(c - a), height = Math.abs(d - b);
    return {
      id: lab.id,
      title: 'Find the rectangle inside the corners',
      titleEs: 'Encuentra el rectángulo entre las esquinas',
      prompt: 'A and B are opposite corners. What is the rectangle’s area in square units?',
      promptEs: 'A y B son esquinas opuestas. ¿Cuál es el área del rectángulo en unidades cuadradas?',
      answer: String(width * height),
      scene: `<div class="u7-rectangle"><span>A (${a}, ${b})</span><span>Width: |${c} − (${a})|</span><span>Height: |${d} − (${b})|</span><span>B (${c}, ${d})</span></div>`,
      sceneEs: `<div class="u7-rectangle"><span>A (${a}, ${b})</span><span>Ancho: |${c} − (${a})|</span><span>Alto: |${d} − (${b})|</span><span>B (${c}, ${d})</span></div>`,
    };
  }
  if (lab.id === 'mirror-mission') {
    return {
      id: lab.id,
      title: 'Reflect across the y-axis',
      titleEs: 'Refleja sobre el eje y',
      prompt: 'Reflect point A across the y-axis. Enter the new ordered pair as x,y.',
      promptEs: 'Refleja el punto A sobre el eje y. Escribe el nuevo par ordenado como x,y.',
      answer: `${-a},${b}`,
      type: 'pair',
      scene: `<div class="u7-reflect"><span>Point A <strong>(${a}, ${b})</strong></span><span>Across the y-axis: x changes sign, y stays the same.</span><span>Reflected A <strong>(?, ?)</strong></span></div>`,
      sceneEs: `<div class="u7-reflect"><span>Punto A <strong>(${a}, ${b})</strong></span><span>Sobre el eje y: x cambia de signo; y permanece igual.</span><span>A reflejado <strong>(?, ?)</strong></span></div>`,
    };
  }
  return null;
}

export function checkUnit7(challenge, input) {
  if (!challenge || !known[challenge.id]) return false;
  const value = String(input ?? '').trim().replace(/\u2212/g, '-');
  if (challenge.type === 'pair') {
    const pair = /^\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?$/.exec(value);
    if (!pair) return false;
    const [x, y] = challenge.answer.split(',').map(Number);
    return Number(pair[1]) === x && Number(pair[2]) === y;
  }
  return /^-?\d+$/.test(value) && Number(value) === Number(challenge.answer);
}

export function mountUnit7(host, lab, state, save, game = false) {
  const challenge = unit7Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es';
  state.unit7 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  host.innerHTML = `<section class="u2-centerpiece u7-centerpiece" ${es ? 'lang="es"' : ''} aria-label="${es ? game ? 'Misión matemática' : 'Investiga el modelo' : game ? 'Math mission' : 'Investigate the model'}"><p class="studio-eyebrow">${es ? game ? 'Misión matemática' : 'Investiga el modelo' : game ? 'Math mission' : 'Investigate the model'}</p><h3>${esc(es ? challenge.titleEs : challenge.title)}</h3><p>${esc(es ? challenge.promptEs : challenge.prompt)}</p>${es ? challenge.sceneEs : challenge.scene}<form><label>${es ? 'Tu respuesta' : 'Your answer'}<input name="unit7-answer" type="text" inputmode="${challenge.type === 'pair' ? 'text' : 'numeric'}" autocomplete="off" required></label><button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u7-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form'), input = form.elements['unit7-answer'], result = host.querySelector('.u7-result');
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit7(challenge, input.value)) {
      state.unit7[key] = { solved: true, answer: challenge.answer };
      save();
      result.textContent = es ? 'Esa relación funciona. Explica cómo lo muestra el modelo.' : 'That relationship works. Explain how the model shows it.';
      result.dataset.result = 'correct';
    } else {
      result.textContent = es ? 'Eso todavía no coincide con el modelo. Revisa las posiciones e inténtalo otra vez.' : 'That does not fit the model yet. Recheck the positions and try again.';
      result.dataset.result = 'retry';
    }
  };
  if (state.unit7[key]?.solved) result.textContent = es ? 'Resolviste este desafío. Explica tu método o inténtalo de nuevo.' : 'You solved this challenge. Explain your method or try again.';
  return true;
}
