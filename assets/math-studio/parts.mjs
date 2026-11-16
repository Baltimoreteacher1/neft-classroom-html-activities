// Parts of an Expression: an Explore model for lessons whose objective is writing and evaluating expressions. The
// student builds a·v ± b, sees each part named (coefficient, variable, term, constant), names parts themselves, and
// evaluates the expression for a value of the variable. Pure helpers are exported for tools/math-studio.test.mjs.
import { bi, esc } from './items.mjs';

export const PART_NAMES = {
  coefficient: ['coefficient', 'el coeficiente'],
  variable: ['variable', 'la variable'],
  term: ['term', 'un término'],
  constant: ['constant', 'la constante'],
};
const VARIABLES = ['x', 'n', 't', 'm', 'p'];
const LIMITS = { a: [1, 20], b: [0, 100], v: [0, 20] };
const fmt = (n) => String(n).replace('-', '−');

/** The expression as text and its value at the variable's value. a = 1 is written without the 1, as in class. */
export function describe({ a, variable, op, b, v }) {
  const varTerm = a === 1 ? variable : `${a}${variable}`;
  const text = b === 0 ? varTerm : `${varTerm} ${op === '-' ? '−' : '+'} ${b}`;
  const product = a * v;
  const value = b === 0 ? product : op === '-' ? product - b : product + b;
  const steps = b === 0 ? `${a} × ${v} = ${fmt(value)}` : `${a} × ${v} ${op === '-' ? '−' : '+'} ${b} = ${product} ${op === '-' ? '−' : '+'} ${b} = ${fmt(value)}`;
  return { text, varTerm, value, steps, terms: b === 0 ? 1 : 2 };
}

/** Questions from the current expression: two about its parts, one evaluation. */
export function partsQuestions(s, lessonId) {
  const d = describe(s);
  const id = `parts-${s.a}${s.variable}${s.op}${s.b}-${s.v}`;
  return [
    { id: `${id}-coef`, kind: 'num', lessonId, prompt: `In the expression ${d.text}, what is the coefficient?`, promptEs: `En la expresión ${d.text}, ¿cuál es el coeficiente?`, answer: s.a, hints: ['The coefficient is the number multiplied by the variable.', s.a === 1 ? `When no number is written in front of ${s.variable}, the coefficient is 1.` : `Look at the number written right before ${s.variable}.`], explanation: `${s.a} multiplies ${s.variable}, so the coefficient is ${s.a}.${s.a === 1 ? ' A coefficient of 1 is not written.' : ''}` },
    ...(s.b ? [{ id: `${id}-const`, kind: 'num', lessonId, prompt: `In the expression ${d.text}, what is the constant?`, promptEs: `En la expresión ${d.text}, ¿cuál es la constante?`, answer: s.b, hints: ['A constant is a term with no variable. Its value never changes.', `Find the term in ${d.text} that has no ${s.variable}.`], explanation: `${s.b} has no variable, so it is the constant. (The − or + in front is the operation.)` }] : []),
    { id: `${id}-eval`, kind: 'num', lessonId, prompt: `Evaluate ${d.text} when ${s.variable} = ${s.v}.`, promptEs: `Evalúa ${d.text} cuando ${s.variable} = ${s.v}.`, answer: d.value, hints: [`Substitute: write ${s.v} wherever you see ${s.variable}.`, `Multiply first: ${s.a} × ${s.v} = ${s.a * s.v}. Then ${s.op === '-' ? 'subtract' : 'add'} the constant.`], explanation: `${d.steps}.`, mistakes: s.b ? [{ answer: Number(`${s.a}${s.v}`), feedback: `${s.a}${s.variable} means ${s.a} × ${s.variable}, not the digits ${s.a} and ${s.v} side by side.` }] : [] },
  ];
}

/** Transfer: a new expression the student has not built, evaluated without the model. */
export function partsTransfer(s, round, lessonId) {
  const a = ((s.a + 3 * round) % 9) + 2;
  const variable = VARIABLES[(VARIABLES.indexOf(s.variable) + round) % VARIABLES.length];
  const b = ((s.b + 7 * round) % 30) + 1;
  const op = round % 2 ? '-' : '+';
  const v = ((s.v + 2 * round) % 8) + 3;
  const next = { a, variable, op, b, v };
  const d = describe(next);
  return { id: `parts-transfer-${a}${variable}${op}${b}-${v}`, kind: 'num', lessonId, prompt: `New expression, no model: ${d.text}. Name its coefficient and constant to yourself, then evaluate it when ${variable} = ${v}.`, promptEs: `Expresión nueva, sin el modelo: ${d.text}. Nombra su coeficiente y su constante, y luego evalúala cuando ${variable} = ${v}.`, answer: d.value, hints: [`Substitute ${v} for ${variable}.`, `Multiply ${a} × ${v} first, then ${op === '-' ? 'subtract' : 'add'} ${b}.`], explanation: `Coefficient ${a}, variable ${variable}, constant ${b}. ${d.steps}.` };
}

const clamp = (n, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));

/** Mount the explorer. `cfg` = { a, variable, op, b, v, context?, contextEs? }. Returns { state, set, result }. */
export function mountParts(host, cfg, { onChange = () => {} } = {}) {
  let s = { a: cfg.a, variable: cfg.variable, op: cfg.op || '+', b: cfg.b, v: cfg.v };
  let ask = 0;
  const order = ['coefficient', 'variable', 'constant', 'term'];
  host.innerHTML = `<div class="ms-parts">
    ${cfg.context ? `<p class="ms-parts__context">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-parts__stage" aria-live="polite"></div>
    <div class="ms-parts__name" role="group" aria-label="Name the parts"><p class="ms-parts__ask"></p><p class="ms-parts__fb" aria-live="polite"></p></div>
    <div class="ms-parts__controls">
      <label>${bi('Coefficient', 'Coeficiente')}<input type="number" data-k="a" min="1" max="20" step="1" inputmode="numeric"></label>
      <label>${bi('Variable', 'Variable')}<select data-k="variable">${VARIABLES.map((x) => `<option>${x}</option>`).join('')}</select></label>
      <label>${bi('Operation', 'Operación')}<select data-k="op"><option value="+">+</option><option value="-">−</option></select></label>
      <label>${bi('Constant', 'Constante')}<input type="number" data-k="b" min="0" max="100" step="1" inputmode="numeric"></label>
      <label class="ms-parts__eval-in"><span class="ms-parts__vlabel"></span><input type="number" data-k="v" min="0" max="20" step="1" inputmode="numeric"></label>
      <button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Reset', 'Reiniciar')}</button>
    </div>
    <div class="ms-parts__eval"></div>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const sync = () => { for (const el of host.querySelectorAll('[data-k]')) el.value = s[el.dataset.k]; };
  const draw = () => {
    const d = describe(s);
    const coefShown = s.a !== 1;
    const tok = (part, text, extra = '') => `<button type="button" class="ms-tok ms-tok--${part}" data-part="${part}"${extra}>${esc(text)}</button>`;
    const varTerm = `<span class="ms-term" data-term="1">${coefShown ? tok('coefficient', s.a) : ''}${tok('variable', s.variable)}<span class="ms-term__brace" aria-hidden="true"></span><span class="ms-term__label">${bi('term', 'término')}</span></span>`;
    const constTerm = s.b ? `<span class="ms-op" aria-hidden="true">${s.op === '-' ? '−' : '+'}</span><span class="ms-term" data-term="2">${tok('constant', s.b)}<span class="ms-term__brace" aria-hidden="true"></span><span class="ms-term__label">${bi('term', 'término')}</span></span>` : '';
    $('.ms-parts__stage').innerHTML = `<div class="ms-expr" role="group" aria-label="${esc(`${d.text}: coefficient ${s.a}${coefShown ? '' : ' (not written)'}, variable ${s.variable}${s.b ? `, constant ${s.b}` : ''}, ${d.terms} term${d.terms > 1 ? 's' : ''}`)}">${varTerm}${constTerm}</div>
      <ul class="ms-legend">
        <li class="ms-legend--coefficient"><strong>${bi('Coefficient', 'Coeficiente')}: ${s.a}</strong> — ${bi(coefShown ? `the number multiplied by ${s.variable}` : `${s.variable} means 1·${s.variable}, so the coefficient is 1 (not written)`, coefShown ? `el número que multiplica a ${s.variable}` : `${s.variable} significa 1·${s.variable}, así que el coeficiente es 1 (no se escribe)`)}</li>
        <li class="ms-legend--variable"><strong>${bi('Variable', 'Variable')}: ${s.variable}</strong> — ${bi('a letter that stands for a number that can change', 'una letra que representa un número que puede cambiar')}</li>
        ${s.b ? `<li class="ms-legend--constant"><strong>${bi('Constant', 'Constante')}: ${s.b}</strong> — ${bi('a number with no variable; its value stays the same', 'un número sin variable; su valor no cambia')}</li>` : ''}
        <li class="ms-legend--term"><strong>${bi(`Terms: ${d.terms}`, `Términos: ${d.terms}`)}</strong> — ${bi(`the parts joined by + or −: ${d.varTerm}${s.b ? ` and ${s.b}` : ''}`, `las partes unidas por + o −: ${d.varTerm}${s.b ? ` y ${s.b}` : ''}`)}</li>
      </ul>`;
    $('.ms-parts__vlabel').innerHTML = bi(`Value of ${s.variable}`, `Valor de ${s.variable}`);
    $('.ms-parts__eval').innerHTML = `<strong>${bi(`Evaluate when ${s.variable} = ${s.v}`, `Evalúa cuando ${s.variable} = ${s.v}`)}</strong><p class="ms-parts__steps">${esc(d.text.replace(new RegExp(`(\\d*)${s.variable}`), (_m, c) => (c ? `${c}(${s.v})` : `(${s.v})`)))} = ${esc(d.steps)}</p>`;
    const want = order[ask % order.length];
    if (want === 'constant' && !s.b) ask++;
    const w = order[ask % order.length];
    $('.ms-parts__ask').innerHTML = `${bi(`Name the parts: tap ${w === 'term' ? 'a' : 'the'} ${PART_NAMES[w][0]}.`, `Nombra las partes: toca ${PART_NAMES[w][1]}.`)}`;
    host.querySelectorAll('[data-part]').forEach((btn) => btn.addEventListener('click', () => {
      const target = order[ask % order.length];
      const part = btn.dataset.part;
      const right = target === 'term' ? true : part === target;
      const fb = $('.ms-parts__fb');
      if (target === 'term') {
        const term = btn.closest('.ms-term');
        host.querySelectorAll('.ms-term').forEach((t) => t.classList.toggle('is-picked', t === term));
        fb.innerHTML = bi(`Yes: ${term.dataset.term === '1' ? d.varTerm : s.b} is a term. Terms are the parts joined by + or −.`, `Sí: ${term.dataset.term === '1' ? d.varTerm : s.b} es un término. Los términos son las partes unidas por + o −.`);
      } else if (right) fb.innerHTML = bi(`Yes, that is the ${target}.`, `Sí, es ${PART_NAMES[target][1]}.`);
      else fb.innerHTML = bi(`That is the ${part}. Look for the ${target}.`, `Esa parte es ${PART_NAMES[part][1]}. Busca ${PART_NAMES[target][1]}.`);
      fb.className = `ms-parts__fb ${right ? 'is-ok' : 'is-no'}`;
      if (right) { ask++; setTimeout(draw, 900); }
    }));
    onChange({ ...s }, d);
  };
  host.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('input', () => {
    const k = el.dataset.k;
    if (k === 'variable' || k === 'op') s[k] = el.value;
    else if (el.value.trim() !== '') s[k] = clamp(el.value, LIMITS[k]);
    draw();
  }));
  host.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('change', sync));
  $('[data-reset]').addEventListener('click', () => { s = { a: cfg.a, variable: cfg.variable, op: cfg.op || '+', b: cfg.b, v: cfg.v }; sync(); draw(); });
  sync(); draw();
  return {
    get state() { return { ...s }; },
    set(next) { s = { ...s, ...next }; sync(); draw(); },
    result: () => describe(s),
  };
}
