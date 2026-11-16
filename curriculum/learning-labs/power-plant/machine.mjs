import { power } from './power-machine.mjs';

const key = 'ewl-power-plant-machine-v1';
const scenarios = [
  { title: 'Make a target', prompt: 'Find a power with a value of 64 using the controls.', test: (b, e, v) => v === 64, hint: 'Try repeated factors of 4. Count the factors, not the multiplications.' },
  { title: 'Change the exponent', prompt: 'Start with 3². Predict, then increase only the exponent to 3. What happens to the value?', test: (b, e) => b === 3 && e === 3, hint: 'Keep the base at 3 and use three factors.' },
  { title: 'Transfer: same value', prompt: 'Find a power other than 2⁴ that has the same value as 2⁴.', test: (b, e, v) => v === 16 && !(b === 2 && e === 4), hint: '2⁴ is 16. Think of another repeated factor that produces 16.' },
];
let state = { base: 3, exponent: 2, scenario: 0, prediction: '', explanation: '' };
try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && Number.isInteger(saved.base) && saved.base >= 2 && saved.base <= 5 && Number.isInteger(saved.exponent) && saved.exponent >= 1 && saved.exponent <= 4 && Number.isInteger(saved.scenario) && saved.scenario >= 0 && saved.scenario < scenarios.length) state = { ...state, ...saved }; } catch { /* Storage can be unavailable. */ }
let storageAvailable = true;
function save() { try { localStorage.setItem(key, JSON.stringify(state)); storageAvailable = true; } catch { storageAvailable = false; } }
function mount(panel) {
  if (!panel || panel.querySelector('[data-power-machine]')) return;
  const section = document.createElement('section'); section.className = 'power-machine'; section.dataset.powerMachine = '';
  section.innerHTML = `<div class="power-machine-head"><p>POWER PLANT · LESSONS 6.3–6.4</p><h2>Build a power</h2><p>Each stage multiplies by the base once. Predict what will happen, then change the machine and explain the evidence.</p></div><details lang="es"><summary>Ayuda en español</summary><p>Cada etapa multiplica una vez por la base. Predice qué sucederá, cambia la máquina y explica la evidencia. El exponente indica cuántas veces aparece la base como factor.</p><ol><li>Encuentra una potencia con valor 64 usando los controles.</li><li>Comienza con 3². Predice qué sucede si cambias solo el exponente a 3.</li><li>Encuentra otra potencia que tenga el mismo valor que 2⁴.</li></ol><p>Usa «Check this design» para comprobar tu diseño. Después explica y revisa tu idea.</p></details><label>Investigation <select data-scenario></select></label><p data-prompt></p><label>My prediction <textarea data-prediction rows="2" placeholder="I predict…"></textarea></label><div class="power-machine-controls"><label>Base <select data-base></select></label><label>Exponent <select data-exponent></select></label></div><div class="power-machine-stage" role="img" aria-label=""><div class="power-machine-track"></div></div><p class="power-machine-equation" data-equation></p><p data-compare></p><button type="button" data-machine-check>Check this design</button><p role="status" data-feedback></p><label>Explain and revise <textarea data-explanation rows="3" placeholder="The exponent tells me…"></textarea></label><p class="power-machine-save" data-save></p>`;
  panel.querySelector('.studio')?.prepend(section);
  if (!section.isConnected) return;
  const $ = (selector) => section.querySelector(selector);
  $('[data-scenario]').innerHTML = scenarios.map((s, i) => `<option value="${i}">${i + 1}. ${s.title}</option>`).join('');
  $('[data-base]').innerHTML = [2, 3, 4, 5].map(n => `<option>${n}</option>`).join('');
  $('[data-exponent]').innerHTML = [1, 2, 3, 4].map(n => `<option>${n}</option>`).join('');
  $('[data-scenario]').value = state.scenario; $('[data-base]').value = state.base; $('[data-exponent]').value = state.exponent;
  $('[data-prediction]').value = typeof state.prediction === 'string' ? state.prediction : '';
  $('[data-explanation]').value = typeof state.explanation === 'string' ? state.explanation : '';
  function render() {
    const { value, expanded, steps } = power(state.base, state.exponent);
    $('[data-prompt]').textContent = scenarios[state.scenario].prompt;
    $('[data-equation]').textContent = `${state.base}^${state.exponent} = ${expanded} = ${value}`;
    $('[data-compare]').textContent = `${state.base} × ${state.exponent} = ${state.base * state.exponent}. An exponent counts equal factors; it does not mean multiply the base by the exponent.`;
    $('.power-machine-track').innerHTML = steps.map((n, i) => `<span class="power-machine-node">${i ? `<small>× ${state.base}</small>` : '<small>Start</small>'}<strong>${n}</strong></span>`).join('<span class="power-machine-arrow" aria-hidden="true">→</span>');
    $('.power-machine-stage').setAttribute('aria-label', `Start with 1. ${steps.slice(1).map((n, i) => `Stage ${i + 1}: multiply by ${state.base} to get ${n}.`).join(' ')}`);
    $('[data-save]').textContent = storageAvailable ? 'Your machine and notes are saved in this browser.' : 'Browser storage is unavailable; copy your notes before leaving.';
  }
  for (const name of ['base', 'exponent', 'scenario']) $(`[data-${name}]`).addEventListener('change', e => { state[name] = Number(e.target.value); $('[data-feedback]').textContent = ''; save(); render(); });
  for (const name of ['prediction', 'explanation']) $(`[data-${name}]`).addEventListener('input', e => { state[name] = e.target.value; save(); $('[data-save]').textContent = storageAvailable ? 'Your machine and notes are saved in this browser.' : 'Browser storage is unavailable; copy your notes before leaving.'; });
  $('[data-machine-check]').addEventListener('click', () => { const result = power(state.base, state.exponent); $('[data-feedback]').textContent = scenarios[state.scenario].test(state.base, state.exponent, result.value) ? `Your design meets the condition: ${result.expanded} = ${result.value}. Explain why below, then compare another design.` : `This design gives ${result.value}. ${scenarios[state.scenario].hint} Change a control and check again.`; });
  render();
}
const root = document.getElementById('lab-root');
const observer = new MutationObserver(() => mount(document.getElementById('panel-investigate')));
observer.observe(root, { childList: true, subtree: true });
mount(document.getElementById('panel-investigate'));
