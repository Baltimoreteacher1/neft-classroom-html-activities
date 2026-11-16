// Line Up the Decimal Points (2-11): two decimals in a place-value grid with the points aligned, annexed zeros shown,
// then the sum or difference. Exact arithmetic in thousandths. Explorer interface: initialState/mount/questions/transfer.
import { bi, esc } from './items.mjs';

const OK = /^\d{1,3}(\.\d{1,3})?$/;
const places = (s) => (s.includes('.') ? s.split('.')[1].length : 0);
const milli = (s) => Math.round(Number(s) * 1000);
/** A decimal string with exactly `p` places (annexing zeros). */
const pad = (s, p) => (p ? `${s.split('.')[0]}.${(s.split('.')[1] || '').padEnd(p, '0')}` : s.split('.')[0]);
const show = (m, p) => (m / 1000).toFixed(p);

export function compute({ a, b, op }) {
  const p = Math.max(places(a), places(b));
  const raw = op === '-' ? milli(a) - milli(b) : milli(a) + milli(b);
  return { p, value: raw / 1000, text: show(raw, p), a: pad(a, p), b: pad(b, p), negative: raw < 0 };
}
/** The classic slip: the shorter decimal's digits lined up on the right, as if the points did not matter. */
export function misaligned({ a, b, op }) {
  const p = Math.max(places(a), places(b));
  if (places(a) === places(b)) return null;
  const shift = (s) => Number(s.replace('.', '')) / 10 ** p;
  const [x, y] = places(a) < p ? [shift(a), Number(b)] : [Number(a), shift(b)];
  return Math.round((op === '-' ? x - y : x + y) * 1000) / 1000;
}

export const initialState = (cfg) => ({ a: cfg.a, b: cfg.b, op: cfg.op || '+' });

export function questions(s, lessonId) {
  const r = compute(s);
  const slip = misaligned(s);
  const sym = s.op === '-' ? '−' : '+';
  const est = Math.round(Number(s.a)) + (s.op === '-' ? -1 : 1) * Math.round(Number(s.b));
  return [
    { id: `dec-${s.a}${s.op}${s.b}`, kind: 'num', lessonId, prompt: `Compute ${s.a} ${sym} ${s.b}.`, promptEs: `Calcula ${s.a} ${sym} ${s.b}.`, answer: r.value, tolerance: 1e-9, hints: ['Line up the decimal points first.', `Annex zeros so both numbers have ${r.p} decimal places: ${r.a} and ${r.b}.`], explanation: `${r.a} ${sym} ${r.b} = ${r.text}. Lining up the points lines up tenths with tenths and hundredths with hundredths.`, mistakes: slip === null ? [] : [{ answer: slip, feedback: 'You lined up the last digits instead of the decimal points, so tenths were combined with hundredths.' }] },
    { id: `dec-est-${s.a}${s.op}${s.b}`, kind: 'num', lessonId, prompt: `Estimate first: round each number to the nearest whole number and ${s.op === '-' ? 'subtract' : 'add'}. What is your estimate?`, promptEs: `Primero estima: redondea cada número al entero más cercano y ${s.op === '-' ? 'resta' : 'suma'}. ¿Cuál es tu estimación?`, answer: est, hints: [`${s.a} rounds to ${Math.round(Number(s.a))}.`, `${s.b} rounds to ${Math.round(Number(s.b))}.`], explanation: `${Math.round(Number(s.a))} ${sym} ${Math.round(Number(s.b))} = ${est}. The exact answer ${r.text} should be close to it.` },
  ];
}

export function transfer(s, round, lessonId) {
  const a = `${(Number(s.a.split('.')[0]) % 90) + 10 + round}.${String((round * 37) % 100).padStart(2, '0')}`;
  const b = `${(round * 7) % 40 + 3}.${(round * 3) % 10}`;
  const op = round % 2 ? '-' : '+';
  const r = compute({ a, b, op });
  const sym = op === '-' ? '−' : '+';
  return { id: `dec-t-${a}${op}${b}`, kind: 'num', lessonId, prompt: `New problem, no model: ${a} ${sym} ${b}.`, promptEs: `Problema nuevo, sin el modelo: ${a} ${sym} ${b}.`, answer: r.value, tolerance: 1e-9, hints: ['Line up the decimal points.', `Write ${b} as ${r.b}.`], explanation: `${r.a} ${sym} ${r.b} = ${r.text}.`, mistakes: misaligned({ a, b, op }) === null ? [] : [{ answer: misaligned({ a, b, op }), feedback: 'Line up the decimal points, not the last digits.' }] };
}

const COLS = [['hundreds', 'centenas'], ['tens', 'decenas'], ['ones', 'unidades'], ['.', '.'], ['tenths', 'décimos'], ['hundredths', 'centésimos'], ['thousandths', 'milésimos']];
function row(str, p, orig, sign = '') {
  const [whole, frac = ''] = str.replace('-', '').split('.');
  const w = whole.padStart(3, ' ').slice(-3).split('');
  const given = places(orig);
  const cells = [...w.map((d) => `<td>${d.trim() ? esc(d) : ''}</td>`), `<td class="ms-dp">${p ? '.' : ''}</td>`];
  for (let i = 0; i < 3; i++) cells.push(i < p ? `<td class="${i >= given ? 'is-annexed' : ''}">${esc(frac[i] || '0')}</td>` : '<td class="is-off"></td>');
  return `<tr><th scope="row">${sign}</th>${cells.join('')}</tr>`;
}

export function mount(host, cfg, { onChange = () => {} } = {}) {
  let s = initialState(cfg);
  host.innerHTML = `<div class="ms-x ms-dec">
    ${cfg.context ? `<p class="ms-parts__context">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-dec__grid" aria-live="polite"></div>
    <div class="ms-parts__controls">
      <label>${bi('First number', 'Primer número')}<input data-k="a" inputmode="decimal" autocomplete="off"></label>
      <label>${bi('Operation', 'Operación')}<select data-k="op"><option value="+">+</option><option value="-">−</option></select></label>
      <label>${bi('Second number', 'Segundo número')}<input data-k="b" inputmode="decimal" autocomplete="off"></label>
      <button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Reset', 'Reiniciar')}</button>
    </div>
    <p class="ms-x__err" role="alert"></p>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const sync = () => host.querySelectorAll('[data-k]').forEach((el) => { el.value = s[el.dataset.k]; });
  const draw = () => {
    const r = compute(s);
    const sym = s.op === '-' ? '−' : '+';
    const p = Math.max(r.p, 0);
    $('.ms-dec__grid').innerHTML = r.negative
      ? `<p class="ms-warn">${bi('Put the larger number first for this lesson.', 'Para esta lección, pon primero el número mayor.')}</p>`
      : `<table class="ms-pv"><caption class="sr-only">${esc(`${s.a} ${sym} ${s.b} = ${r.text}`)}</caption><thead><tr><td></td>${COLS.map(([en, es], i) => `<th scope="col"${i === 3 ? ' class="ms-dp"' : i > 3 && i - 4 >= p ? ' class="is-off"' : ''}>${i === 3 ? '' : bi(en, es)}</th>`).join('')}</tr></thead><tbody>${row(r.a, p, s.a)}${row(r.b, p, s.b, sym)}<tr class="ms-pv__sum">${row(r.text, p, r.text, '=').slice(4)}</tbody></table>
      <ol class="ms-dec__steps"><li>${bi('Line up the decimal points (the shaded column).', 'Alinea los puntos decimales (la columna sombreada).')}</li><li>${bi(`Annex zeros so both numbers have ${p} decimal place${p === 1 ? '' : 's'}${r.a !== s.a || r.b !== s.b ? `: ${r.a !== s.a ? `${s.a} → ${r.a}` : `${s.b} → ${r.b}`}` : ''}. An annexed zero does not change the value.`, `Agrega ceros para que ambos números tengan ${p} lugar${p === 1 ? '' : 'es'} decimal${p === 1 ? '' : 'es'}. Un cero agregado no cambia el valor.`)}</li><li>${bi(`${s.op === '-' ? 'Subtract' : 'Add'} column by column from the right, regrouping as needed: ${r.a} ${sym} ${r.b} = ${r.text}.`, `${s.op === '-' ? 'Resta' : 'Suma'} columna por columna desde la derecha, reagrupando cuando haga falta: ${r.a} ${sym} ${r.b} = ${r.text}.`)}</li></ol>`;
    onChange({ ...s }, r);
  };
  host.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('input', () => {
    const k = el.dataset.k, v = el.value.trim();
    if (k === 'op') { s.op = v; $('.ms-x__err').textContent = ''; draw(); return; }
    if (!OK.test(v)) { el.setAttribute('aria-invalid', 'true'); $('.ms-x__err').textContent = 'Use a number from 0 to 999.999 with up to three decimal places.'; return; }
    el.removeAttribute('aria-invalid'); $('.ms-x__err').textContent = ''; s[k] = v; draw();
  }));
  $('[data-reset]').addEventListener('click', () => { s = initialState(cfg); sync(); draw(); });
  sync(); draw();
  return { get state() { return { ...s }; }, set(next) { s = { ...s, ...next }; sync(); draw(); } };
}
