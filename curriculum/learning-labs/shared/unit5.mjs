// Unit 5 math centerpieces. All starting quantities come from each lab's model.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
const whole = (value) => Number.isSafeInteger(value) && value >= 0;
const pair = (a, b) => `${a},${b}`;

export function unit5Challenge(lab) {
  if (lab.unit !== 5) return null;
  const ownModel = {
    'shape-shift-garden': 'area:triangle',
    'festival-floorplan': 'area:trapezoid',
    'packaging-workshop': 'solid:net',
    'wrap-lab': 'solid:surface',
    'polygon-pavilion': 'area:polygon',
  }[lab.id];
  if (!ownModel || `${lab.model.kind}:${lab.model.mode}` !== ownModel) return null;
  const [a, b, c] = lab.model.values;
  if (![a, b, c].every(whole)) throw new RangeError('Unit 5 model needs whole-number measures.');
  if (lab.id === 'shape-shift-garden') {
    const doubleArea = a * b;
    if (!whole(doubleArea) || doubleArea % 2) throw new RangeError('Triangle area must be exact.');
    return {
      id: lab.id, title: 'Fold the parallelogram into halves', titleEs: 'Divide el paralelogramo en mitades',
      prompt: 'A triangle has the same base and perpendicular height as this parallelogram. What is its area?',
      promptEs: 'Un triángulo tiene la misma base y altura perpendicular que este paralelogramo. ¿Cuál es su área?',
      answer: String(doubleArea / 2), type: 'buttons', options: [String(a + b), String(doubleArea / 2), String(doubleArea)],
      scene: `<div class="u5-double"><p>Parallelogram: base <strong>${a}</strong>, perpendicular height <strong>${b}</strong></p><div class="u5-double-parts" aria-label="Two equal triangular halves"><span>Half A</span><span>Half B</span></div></div>`,
      sceneEs: `<div class="u5-double"><p>Paralelogramo: base <strong>${a}</strong>, altura perpendicular <strong>${b}</strong></p><div class="u5-double-parts" aria-label="Dos mitades triangulares iguales"><span>Mitad A</span><span>Mitad B</span></div></div>`,
    };
  }
  if (lab.id === 'festival-floorplan') {
    const doubledArea = (a + b) * c;
    if (!whole(doubledArea) || doubledArea % 2 || (a + b) % 2) throw new RangeError('Trapezoid measures must give whole-number areas.');
    return {
      id: lab.id, title: 'Plan the trapezoid floor', titleEs: 'Diseña el piso trapezoidal',
      prompt: 'Find the average length of the two parallel bases, then the floor area. Enter both values in that order.',
      promptEs: 'Halla el promedio de las dos bases paralelas y después el área del piso. Escribe ambos valores en ese orden.',
      answer: pair((a + b) / 2, doubledArea / 2), type: 'pair',
      scene: `<div class="u5-trapezoid" role="group" aria-label="Trapezoid measures"><span>Parallel base <strong>${a}</strong></span><span>Parallel base <strong>${b}</strong></span><span>Perpendicular height <strong>${c}</strong></span></div>`,
      sceneEs: `<div class="u5-trapezoid" role="group" aria-label="Medidas del trapecio"><span>Base paralela <strong>${a}</strong></span><span>Base paralela <strong>${b}</strong></span><span>Altura perpendicular <strong>${c}</strong></span></div>`,
    };
  }
  if (lab.id === 'packaging-workshop') {
    const base = a * b, volume = base * c;
    if (!whole(volume)) throw new RangeError('Prism volume is outside the exact range.');
    return {
      id: lab.id, title: 'Stack the package layers', titleEs: 'Apila las capas del paquete',
      prompt: 'Each layer has length × width cubes. How many cubes fill all the layers?',
      promptEs: 'Cada capa tiene largo × ancho cubos. ¿Cuántos cubos llenan todas las capas?',
      answer: String(volume), type: 'number',
      scene: `<div class="u5-layers" role="group" aria-label="Rectangular prism layers"><span>Length <strong>${a}</strong></span><span>Width <strong>${b}</strong></span><span>Layers <strong>${c}</strong></span></div>`,
      sceneEs: `<div class="u5-layers" role="group" aria-label="Capas del prisma rectangular"><span>Largo <strong>${a}</strong></span><span>Ancho <strong>${b}</strong></span><span>Capas <strong>${c}</strong></span></div>`,
    };
  }
  if (lab.id === 'wrap-lab') {
    const surface = 2 * (a * b + a * c + b * c);
    if (!whole(surface)) throw new RangeError('Prism surface area is outside the exact range.');
    return {
      id: lab.id, title: 'Cover every matching face', titleEs: 'Cubre cada par de caras iguales',
      prompt: 'The wrapping covers each of the three opposite face pairs. What is the total surface area?',
      promptEs: 'La envoltura cubre cada uno de los tres pares de caras opuestas. ¿Cuál es el área total de la superficie?',
      answer: String(surface), type: 'number',
      scene: `<div class="u5-faces" role="group" aria-label="Three opposite face pairs"><span>Top and bottom: ${a} × ${b}</span><span>Front and back: ${a} × ${c}</span><span>Left and right: ${b} × ${c}</span></div>`,
      sceneEs: `<div class="u5-faces" role="group" aria-label="Tres pares de caras opuestas"><span>Arriba y abajo: ${a} × ${b}</span><span>Frente y atrás: ${a} × ${c}</span><span>Izquierda y derecha: ${b} × ${c}</span></div>`,
    };
  }
  if (lab.id === 'polygon-pavilion') {
    // The source model starts at four equal sides, so its regular polygon is a square.
    // The unused third model value is deliberately ignored; the apothem is side / 2.
    if (a !== 4 || b % 2) throw new RangeError('The exact square decomposition needs four sides of even length.');
    const apothem = b / 2, triangleArea = b * apothem / 2, area = a * triangleArea;
    if (!whole(triangleArea) || !whole(area)) throw new RangeError('Polygon triangles must have exact areas.');
    return {
      id: lab.id, title: 'Build area from center triangles', titleEs: 'Forma el área con triángulos desde el centro',
      prompt: 'The four-sided regular polygon divides into equal center triangles. Enter one triangle’s area, then the polygon’s total area.',
      promptEs: 'El polígono regular de cuatro lados se divide en triángulos iguales desde el centro. Escribe el área de uno y después el área total.',
      answer: pair(triangleArea, area), type: 'pair',
      scene: `<div class="u5-fan" role="group" aria-label="Four equal center triangles"><span>Equal sides: <strong>${a}</strong></span><span>Each base: <strong>${b}</strong></span><span>Center-to-side height: <strong>${apothem}</strong></span></div>`,
      sceneEs: `<div class="u5-fan" role="group" aria-label="Cuatro triángulos iguales desde el centro"><span>Lados iguales: <strong>${a}</strong></span><span>Cada base: <strong>${b}</strong></span><span>Altura del centro al lado: <strong>${apothem}</strong></span></div>`,
    };
  }
  return null;
}

export function checkUnit5(challenge, input) {
  if (!challenge) return false;
  const value = String(input ?? '').trim().replace(/\s/g, '');
  if (challenge.type === 'pair') return /^\d+,\d+$/.test(value) && value === challenge.answer;
  return /^\d+$/.test(value) && value === challenge.answer;
}

export function mountUnit5(host, lab, state, save, game = false) {
  const challenge = unit5Challenge(lab);
  if (!challenge) return false;
  const es = state.lang === 'es', lang = es ? ' lang="es"' : '';
  state.unit5 ||= {};
  const key = `${lab.id}:${game ? 'game' : 'investigate'}`;
  host.innerHTML = `<section class="u5-centerpiece"${lang} aria-label="${es ? game ? 'Misión matemática' : 'Investiga la geometría' : game ? 'Math mission' : 'Investigate the geometry'}"><p class="studio-eyebrow">${es ? game ? 'Misión matemática' : 'Investiga el modelo' : game ? 'Math mission' : 'Investigate the model'}</p><h3>${es ? challenge.titleEs : challenge.title}</h3><p>${es ? challenge.promptEs : challenge.prompt}</p>${es ? challenge.sceneEs : challenge.scene}<form><label>${es ? challenge.type === 'pair' ? 'Dos respuestas, separadas por coma' : 'Tu respuesta' : challenge.type === 'pair' ? 'Two answers, separated by a comma' : 'Your answer'}<input name="unit5-answer" type="text" inputmode="${challenge.type === 'buttons' ? 'none' : challenge.type === 'pair' ? 'decimal' : 'numeric'}" autocomplete="off" required></label>${challenge.options ? `<div class="u5-options" role="group" aria-label="${es ? 'Elige un área' : 'Choose an area'}">${challenge.options.map((option) => `<button type="button" data-u5-option="${esc(option)}">${esc(option)}</button>`).join('')}</div>` : ''}<button type="submit">${es ? 'Comprueba mi cálculo' : 'Check my math'}</button><p class="u5-result" role="status" aria-live="polite"></p></form></section>`;
  const form = host.querySelector('form'), input = form.elements['unit5-answer'], result = host.querySelector('.u5-result');
  host.querySelectorAll('[data-u5-option]').forEach((button) => button.onclick = () => { input.value = button.dataset.u5Option; form.requestSubmit(); });
  form.onsubmit = (event) => {
    event.preventDefault();
    if (checkUnit5(challenge, input.value)) {
      state.unit5[key] = { solved: true };
      save();
      result.textContent = es ? 'Esa relación funciona. Explica cómo lo muestran las medidas.' : 'That relationship works. Explain how the measures show it.';
      result.dataset.result = 'correct';
    } else {
      result.textContent = es ? 'Eso todavía no coincide con las medidas. Revisa las piezas e inténtalo de nuevo.' : 'That does not fit the measures yet. Recheck the pieces and try again.';
      result.dataset.result = 'retry';
    }
  };
  if (state.unit5[key]?.solved) result.textContent = es ? 'Ya resolviste este desafío. Explica tu método o inténtalo de nuevo.' : 'You solved this challenge. Explain your method or try it again.';
  return true;
}
