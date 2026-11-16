// Fair Share (2-8): each value is a stack of counters; "Even it out" levels the stacks so every bar holds the mean
// (total ÷ count). A target mean then fixes one missing value. Explorer interface.
import { bi, esc } from './items.mjs';

const r2 = (n) => Math.round(n * 100) / 100;
export const mean = (vals) => r2(vals.reduce((a, b) => a + b, 0) / vals.length);
/** The value a new observation needs so the mean becomes `target`. */
export const missingFor = (vals, target) => target * (vals.length + 1) - vals.reduce((a, b) => a + b, 0);

export const initialState = (cfg) => ({ values: [...cfg.values], level: false, target: cfg.target });

export function questions(s, lessonId) {
  const total = s.values.reduce((a, b) => a + b, 0), m = mean(s.values), need = missingFor(s.values, s.target);
  return [
    { id: `fs-mean-${s.values.join('_')}`, kind: 'num', lessonId, prompt: `The data are ${s.values.join(', ')}. What is the mean?`, promptEs: `Los datos son ${s.values.join(', ')}. ¿Cuál es la media?`, answer: m, tolerance: 0.006, hints: ['Find the total first.', `Share the total, ${total}, equally among ${s.values.length} values.`], explanation: `Total ${total} ÷ ${s.values.length} values = ${m}. Each value would be ${m} if the total were shared equally.`, mistakes: [{ answer: total, feedback: 'That is the total. The mean shares the total equally: divide by how many values there are.' }] },
    ...(need >= 0 ? [{ id: `fs-miss-${s.values.join('_')}-${s.target}`, kind: 'num', lessonId, prompt: `One more value is added to ${s.values.join(', ')}. What must it be so the mean is ${s.target}?`, promptEs: `Se agrega un valor más a ${s.values.join(', ')}. ¿Cuál debe ser para que la media sea ${s.target}?`, answer: need, hints: [`With ${s.values.length + 1} values and a mean of ${s.target}, the total must be ${s.target} × ${s.values.length + 1} = ${s.target * (s.values.length + 1)}.`, `Subtract the total you already have, ${total}.`], explanation: `${s.target} × ${s.values.length + 1} = ${s.target * (s.values.length + 1)}; ${s.target * (s.values.length + 1)} − ${total} = ${need}.` }] : []),
  ];
}

export function transfer(s, round, lessonId) {
  const n = 4 + (round % 2);
  const m = 6 + (round % 7);
  const vals = Array.from({ length: n }, (_, i) => m + [(-3), 2, 1, 0, 3][i % 5] * (i < n - 1 ? 1 : 0));
  vals[n - 1] = m * n - vals.slice(0, n - 1).reduce((a, b) => a + b, 0);
  return { id: `fs-t-${vals.join('_')}`, kind: 'num', lessonId, prompt: `New data, no model: ${vals.join(', ')}. What is the mean?`, promptEs: `Datos nuevos, sin el modelo: ${vals.join(', ')}. ¿Cuál es la media?`, answer: mean(vals), tolerance: 0.006, hints: ['Add all the values.', `Divide the total by ${n}.`], explanation: `${vals.join(' + ')} = ${m * n}; ${m * n} ÷ ${n} = ${mean(vals)}.`, mistakes: [{ answer: m * n, feedback: 'That is the total; divide it by how many values there are.' }] };
}

export function mount(host, cfg, { onChange = () => {} } = {}) {
  let s = initialState(cfg);
  host.innerHTML = `<div class="ms-x ms-fair">
    ${cfg.context ? `<p class="ms-parts__context">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-fair__chart" aria-live="polite"></div>
    <div class="ms-row"><button type="button" class="ms-btn" data-level aria-pressed="false">${bi('Even it out', 'Repártelo por igual')}</button></div>
    <div class="ms-parts__eval ms-fair__out"></div>
    <div class="ms-parts__controls ms-fair__inputs"></div>
    <div class="ms-fair__target"></div>
    <div class="ms-row"><button type="button" class="ms-btn ms-btn--quiet" data-add>${bi('Add a value', 'Agrega un valor')}</button><button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Reset', 'Reiniciar')}</button></div>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const draw = () => {
    const m = mean(s.values), total = s.values.reduce((a, b) => a + b, 0), top = Math.max(...s.values, 1);
    const W = 360, H = 180, bw = Math.min(56, (W - 20) / s.values.length - 10);
    const bars = s.values.map((v, i) => { const h = ((s.level ? m : v) / top) * (H - 30), x = 20 + i * (bw + 10); return `<rect x="${x}" y="${H - 10 - h}" width="${bw}" height="${h}" rx="4" class="${s.level ? 'ms-bar--even' : 'ms-bar'}"/><text x="${x + bw / 2}" y="${H - 14 - h}" text-anchor="middle" class="ms-svgnum">${s.level ? m : v}</text>`; }).join('');
    const my = H - 10 - (m / top) * (H - 30);
    $('.ms-fair__chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.level ? `All ${s.values.length} bars levelled at the mean, ${m}` : `Values ${s.values.join(', ')}; mean ${m}`)}">${bars}<line x1="12" x2="${W - 6}" y1="${my}" y2="${my}" class="ms-meanline"/><text x="${W - 6}" y="${my - 5}" text-anchor="end" class="ms-svglabel">mean ${m}</text></svg>`;
    $('.ms-fair__out').innerHTML = `<strong>${bi('Mean = total ÷ number of values', 'Media = total ÷ número de valores')}</strong><p class="ms-parts__steps">(${s.values.join(' + ')}) ÷ ${s.values.length} = ${total} ÷ ${s.values.length} = ${m}</p>`;
    $('.ms-fair__inputs').innerHTML = s.values.map((v, i) => `<label>${bi(`Value ${i + 1}`, `Valor ${i + 1}`)}<input type="number" data-i="${i}" min="0" max="40" value="${v}" inputmode="numeric"></label>`).join('');
    const need = missingFor(s.values, s.target);
    $('.ms-fair__target').innerHTML = `<label class="ms-label" for="ms-fair-t">${bi('Target mean for one more value', 'Media deseada con un valor más')}</label><input id="ms-fair-t" class="ms-input" type="number" min="0" max="40" value="${s.target}" inputmode="numeric"><p>${need >= 0 ? bi(`To make the mean ${s.target} with ${s.values.length + 1} values, the total must be ${s.target * (s.values.length + 1)}, so the new value must be ${need}.`, `Para que la media sea ${s.target} con ${s.values.length + 1} valores, el total debe ser ${s.target * (s.values.length + 1)}; el valor nuevo debe ser ${need}.`) : bi('That target is too low: the new value would have to be negative.', 'Esa media es demasiado baja: el valor nuevo tendría que ser negativo.')}</p>`;
    host.querySelectorAll('[data-i]').forEach((el) => el.addEventListener('change', () => { const v = Math.round(Number(el.value)); if (v >= 0 && v <= 40) { s.values[el.dataset.i] = v; draw(); } }));
    $('#ms-fair-t').addEventListener('change', (e) => { const v = Math.round(Number(e.target.value)); if (v >= 0 && v <= 40) { s.target = v; draw(); } });
    $('[data-level]').setAttribute('aria-pressed', String(s.level));
    onChange({ values: [...s.values], level: s.level, target: s.target });
  };
  $('[data-level]').addEventListener('click', () => { s.level = !s.level; draw(); });
  $('[data-add]').addEventListener('click', () => { if (s.values.length < 7) { s.values.push(s.values.at(-1)); draw(); } });
  $('[data-reset]').addEventListener('click', () => { s = initialState(cfg); draw(); });
  draw();
  return { get state() { return { values: [...s.values], level: s.level, target: s.target }; }, set(next) { s = { ...s, ...next, values: [...(next.values || s.values)] }; draw(); } };
}
