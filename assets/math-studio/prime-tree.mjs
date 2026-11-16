// Factor Tree (6-13): split a number into a factor pair, keep splitting any composite branch, and read the prime
// factorization in exponent form. Any choice of splits ends at the same primes. Explorer interface.
import { bi, esc } from './items.mjs';

export const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
/** Prime factors with exponents, smallest first: 60 -> [[2, 2], [3, 1], [5, 1]]. */
export function factorize(n) {
  const out = [];
  for (let d = 2, m = n; m > 1; d++) {
    if (d * d > m) { out.push([m, 1]); break; }
    let e = 0;
    while (m % d === 0) { m /= d; e++; }
    if (e) out.push([d, e]);
  }
  return out.reduce((acc, [p, e]) => { const f = acc.find((x) => x[0] === p); if (f) f[1] += e; else acc.push([p, e]); return acc; }, []).sort((x, y) => x[0] - y[0]);
}
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const expForm = (f) => f.map(([p, e]) => (e > 1 ? `${p}${String(e).replace(/\d/g, (d) => SUP[d])}` : String(p))).join(' × ');
export const longForm = (f) => f.flatMap(([p, e]) => Array(e).fill(p)).join(' × ');
const pairs = (n) => { const out = []; for (let a = 2; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]); return out; };

export const initialState = (cfg) => ({ n: cfg.n, splits: {} });

export function questions(s, lessonId) {
  const f = factorize(s.n);
  const [p, e] = f[0];
  const largest = f[f.length - 1][0];
  return [
    { id: `pt-${s.n}-count`, kind: 'num', lessonId, prompt: `In the prime factorization of ${s.n}, how many times does ${p} appear as a factor?`, promptEs: `En la factorización prima de ${s.n}, ¿cuántas veces aparece ${p} como factor?`, answer: e, hints: [`Keep dividing ${s.n} by ${p} while the result is a whole number.`, `Count the ${p}s at the ends of the branches.`], explanation: `${s.n} = ${longForm(f)} = ${expForm(f)}, so ${p} appears ${e} time${e > 1 ? 's' : ''} (the exponent).` },
    { id: `pt-${s.n}-largest`, kind: 'num', lessonId, prompt: `What is the largest prime factor of ${s.n}?`, promptEs: `¿Cuál es el factor primo más grande de ${s.n}?`, answer: largest, hints: ['Finish the tree until every branch ends in a prime.', 'Look at the largest number at the end of a branch.'], explanation: `${s.n} = ${expForm(f)}; the largest prime is ${largest}.`, mistakes: pairs(s.n).length ? [{ answer: pairs(s.n).at(-1)[1], feedback: `${pairs(s.n).at(-1)[1]} is a factor, but is it prime? Keep splitting until every branch ends in a prime.` }].filter((m) => !isPrime(m.answer)) : [] },
  ];
}

export function transfer(s, round, lessonId) {
  const opts = [[[2, 3], [3, 1], [5, 1]], [[2, 2], [3, 2]], [[2, 1], [3, 1], [7, 1]], [[2, 4], [5, 1]], [[3, 2], [5, 1]]];
  const f = opts[(round + s.n) % opts.length];
  const n = f.reduce((a, [p, e]) => a * p ** e, 1);
  return { id: `pt-t-${n}`, kind: 'num', lessonId, prompt: `New problem, no model: a number has the prime factorization ${expForm(f)}. What is the number?`, promptEs: `Problema nuevo, sin el modelo: un número tiene la factorización prima ${expForm(f)}. ¿Cuál es el número?`, answer: n, hints: ['An exponent tells how many times the prime is a factor.', `Write it out: ${longForm(f)}.`], explanation: `${longForm(f)} = ${n}.`, mistakes: f.some(([, e]) => e > 1) ? [{ answer: f.reduce((a, [p, e]) => a * p * e, 1), feedback: 'An exponent means repeated multiplication: 2³ is 2 × 2 × 2 = 8, not 2 × 3.' }] : [] };
}

export function mount(host, cfg, { onChange = () => {} } = {}) {
  let s = initialState(cfg);
  host.innerHTML = `<div class="ms-x ms-tree">
    ${cfg.context ? `<p class="ms-parts__context">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-tree__view" aria-live="polite"></div>
    <div class="ms-parts__controls">
      <label>${bi('Number', 'Número')}<input type="number" data-n min="4" max="200" step="1" inputmode="numeric"></label>
      <button type="button" class="ms-btn ms-btn--quiet" data-finish>${bi('Finish the tree for me', 'Termina el árbol por mí')}</button>
      <button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Start over', 'Empezar de nuevo')}</button>
    </div>
    <div class="ms-parts__eval ms-tree__result"></div>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const node = (n, path) => {
    if (isPrime(n)) return `<li><span class="ms-node is-prime">${n}<span class="sr-only"> (prime)</span></span></li>`;
    const split = s.splits[path];
    if (split) return `<li><span class="ms-node">${n}</span><ul>${node(split[0], `${path}0`)}${node(split[1], `${path}1`)}</ul></li>`;
    return `<li><span class="ms-node is-open">${n}</span><div class="ms-split" role="group" aria-label="${esc(`Split ${n}`)}">${pairs(n).map(([a, b]) => `<button type="button" class="ms-btn ms-btn--quiet" data-path="${path}" data-a="${a}" data-b="${b}">${a} × ${b}</button>`).join('')}</div></li>`;
  };
  const leaves = (n, path) => (isPrime(n) ? [n] : s.splits[path] ? [...leaves(s.splits[path][0], `${path}0`), ...leaves(s.splits[path][1], `${path}1`)] : null);
  const draw = () => {
    $('.ms-tree__view').innerHTML = `<ul class="ms-treelist">${node(s.n, 'r')}</ul>`;
    host.querySelectorAll('[data-path]').forEach((b) => b.addEventListener('click', () => { s.splits[b.dataset.path] = [Number(b.dataset.a), Number(b.dataset.b)]; draw(); }));
    const leafs = (() => { try { return leaves(s.n, 'r'); } catch { return null; } })();
    const f = factorize(s.n);
    $('.ms-tree__result').innerHTML = leafs && !leafs.includes(null) && leafs.every(isPrime)
      ? `<strong>${bi('Every branch ends in a prime.', 'Cada rama termina en un primo.')}</strong><p class="ms-parts__steps">${s.n} = ${esc(longForm(f))} = ${esc(expForm(f))}</p><p>${bi('Start over and split a different way: you get the same primes.', 'Empieza de nuevo y divide de otra manera: obtienes los mismos primos.')}</p>`
      : isPrime(s.n) ? `<strong>${bi(`${s.n} is prime: its only factors are 1 and ${s.n}.`, `${s.n} es primo: sus únicos factores son 1 y ${s.n}.`)}</strong>`
        : `<strong>${bi('Choose a factor pair for each number that is not prime.', 'Elige un par de factores para cada número que no es primo.')}</strong>`;
    onChange({ n: s.n, splits: { ...s.splits } });
  };
  const finish = (n, path) => { if (isPrime(n)) return; if (!s.splits[path]) { const [a, b] = pairs(n)[0]; s.splits[path] = [a, b]; } finish(s.splits[path][0], `${path}0`); finish(s.splits[path][1], `${path}1`); };
  $('[data-n]').addEventListener('input', (e) => { const v = Math.round(Number(e.target.value)); if (v >= 4 && v <= 200) { s = { n: v, splits: {} }; draw(); } });
  $('[data-finish]').addEventListener('click', () => { finish(s.n, 'r'); draw(); });
  $('[data-reset]').addEventListener('click', () => { s = { n: s.n, splits: {} }; draw(); });
  $('[data-n]').value = s.n; draw();
  return { get state() { return { n: s.n, splits: { ...s.splits } }; }, set(next) { s = { n: next.n ?? s.n, splits: { ...(next.splits || {}) } }; $('[data-n]').value = s.n; draw(); } };
}
