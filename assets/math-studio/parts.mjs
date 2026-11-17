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

/** The walkthrough: one part at a time, in the order the lesson names them. */
export function learnSteps({ a, variable, b }) {
  const varTerm = a === 1 ? variable : `${a}${variable}`;
  return [
    { part: 'coefficient', en: `${a} is the coefficient: the number multiplied by the variable. ${varTerm} means ${a} × ${variable}.`, es: `${a} es el coeficiente: el número que multiplica a la variable. ${varTerm} significa ${a} × ${variable}.` },
    { part: 'variable', en: `${variable} is the variable: a letter that stands for a number that can change.`, es: `${variable} es la variable: una letra que representa un número que puede cambiar.` },
    { part: 'constant', en: `${b} is the constant: a number with no variable. It stays ${b} no matter what ${variable} is.`, es: `${b} es la constante: un número sin variable. Sigue siendo ${b} sin importar el valor de ${variable}.` },
    { part: 'term', en: `${varTerm} and ${b} are the terms: the parts joined by + or −. This expression has 2 terms.`, es: `${varTerm} y ${b} son los términos: las partes unidas por + o −. Esta expresión tiene 2 términos.` },
  ];
}

/**
 * Mount the explorer. `cfg` = { a, variable, op, b, v, context?, contextEs? }. Returns { state, set, result }.
 * Three phases, one thing at a time: learn (meet each part), name (tap the parts), build (change and evaluate).
 * `onPhase(phase)` lets the page widen the model while the student is still learning the parts.
 */
export function mountParts(host, cfg, { onChange = () => {}, onPhase = () => {} } = {}) {
  let s = { a: cfg.a, variable: cfg.variable, op: cfg.op || '+', b: cfg.b, v: cfg.v, phase: 'learn' };
  let step = 0;
  let ask = 0;
  const order = ['coefficient', 'variable', 'constant', 'term'];
  host.innerHTML = `<div class="ms-parts">
    ${cfg.context ? `<p class="ms-parts__context" data-phase="build">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-parts__stage" aria-live="polite"></div>
    <div class="ms-parts__learn" data-phase="learn"><p class="ms-parts__count"></p><p class="ms-parts__say"></p><div class="ms-row"><button type="button" class="ms-btn ms-btn--quiet" data-step="-1">${bi('Back', 'Atrás')}</button><button type="button" class="ms-btn" data-step="1"></button></div></div>
    <div class="ms-parts__name" data-phase="name" role="group" aria-label="Name the parts"><p class="ms-parts__ask"></p><p class="ms-parts__fb" aria-live="polite"></p><div class="ms-row"><button type="button" class="ms-btn" data-to="build" hidden>${bi('Next: build your own', 'Siguiente: construye la tuya')}</button><button type="button" class="ms-btn ms-btn--link" data-to="learn">${bi('See the parts again', 'Ver las partes otra vez')}</button></div></div>
    <div class="ms-parts__controls" data-phase="build">
      <label>${bi('Coefficient', 'Coeficiente')}<input type="number" data-k="a" min="1" max="20" step="1" inputmode="numeric"></label>
      <label>${bi('Variable', 'Variable')}<select data-k="variable">${VARIABLES.map((x) => `<option>${x}</option>`).join('')}</select></label>
      <label>${bi('Operation', 'Operación')}<select data-k="op"><option value="+">+</option><option value="-">−</option></select></label>
      <label>${bi('Constant', 'Constante')}<input type="number" data-k="b" min="0" max="100" step="1" inputmode="numeric"></label>
      <label class="ms-parts__eval-in"><span class="ms-parts__vlabel"></span><input type="number" data-k="v" min="0" max="20" step="1" inputmode="numeric"></label>
      <button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Reset', 'Reiniciar')}</button>
    </div>
    <div class="ms-parts__eval" data-phase="build"></div>
    <p data-phase="build"><button type="button" class="ms-btn ms-btn--link" data-to="learn">${bi('See the parts again', 'Ver las partes otra vez')}</button></p>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const sync = () => { for (const el of host.querySelectorAll('[data-k]')) el.value = s[el.dataset.k]; };
  const setPhase = (phase) => {
    s.phase = phase;
    if (phase === 'learn') step = 0;
    if (phase === 'name') ask = 0;
    draw();
    onPhase(phase);
  };
  const draw = () => {
    // The walkthrough and the naming game use the lesson's own expression; building uses the student's.
    const e = s.phase === 'build' ? s : { ...s, a: cfg.a, variable: cfg.variable, op: cfg.op || '+', b: cfg.b };
    const d = describe(e);
    const coefShown = e.a !== 1;
    const learn = learnSteps(e);
    const focus = s.phase === 'learn' ? learn[step].part : null;
    const dim = (part) => (focus && focus !== 'term' && focus !== part ? ' is-dim' : '');
    const tok = (part, text) => `<button type="button" class="ms-tok ms-tok--${part}${dim(part)}" data-part="${part}">${esc(text)}</button>`;
    const termCls = focus === 'term' ? ' is-picked' : focus ? ' is-quiet' : '';
    const varTerm = `<span class="ms-term${termCls}" data-term="1">${coefShown ? tok('coefficient', e.a) : ''}${tok('variable', e.variable)}<span class="ms-term__brace" aria-hidden="true"></span><span class="ms-term__label">${bi('term', 'término')}</span></span>`;
    const constTerm = e.b ? `<span class="ms-op${focus && focus !== 'term' ? ' is-dim' : ''}" aria-hidden="true">${e.op === '-' ? '−' : '+'}</span><span class="ms-term${termCls}" data-term="2">${tok('constant', e.b)}<span class="ms-term__brace" aria-hidden="true"></span><span class="ms-term__label">${bi('term', 'término')}</span></span>` : '';
    const legend = s.phase !== 'build' ? '' : `<ul class="ms-legend">
        <li class="ms-legend--coefficient"><strong>${bi('Coefficient', 'Coeficiente')}: ${e.a}</strong> — ${bi(coefShown ? `the number multiplied by ${e.variable}` : `${e.variable} means 1·${e.variable}, so the coefficient is 1 (not written)`, coefShown ? `el número que multiplica a ${e.variable}` : `${e.variable} significa 1·${e.variable}, así que el coeficiente es 1 (no se escribe)`)}</li>
        <li class="ms-legend--variable"><strong>${bi('Variable', 'Variable')}: ${e.variable}</strong> — ${bi('a letter that stands for a number that can change', 'una letra que representa un número que puede cambiar')}</li>
        ${e.b ? `<li class="ms-legend--constant"><strong>${bi('Constant', 'Constante')}: ${e.b}</strong> — ${bi('a number with no variable; its value stays the same', 'un número sin variable; su valor no cambia')}</li>` : ''}
        <li class="ms-legend--term"><strong>${bi(`Terms: ${d.terms}`, `Términos: ${d.terms}`)}</strong> — ${bi(`the parts joined by + or −: ${d.varTerm}${e.b ? ` and ${e.b}` : ''}`, `las partes unidas por + o −: ${d.varTerm}${e.b ? ` y ${e.b}` : ''}`)}</li>
      </ul>`;
    $('.ms-parts__stage').innerHTML = `<div class="ms-expr" role="group" aria-label="${esc(`${d.text}: coefficient ${e.a}${coefShown ? '' : ' (not written)'}, variable ${e.variable}${e.b ? `, constant ${e.b}` : ''}, ${d.terms} term${d.terms > 1 ? 's' : ''}`)}">${varTerm}${constTerm}</div>${legend}`;
    host.querySelectorAll('[data-phase]').forEach((el) => { el.hidden = el.dataset.phase !== s.phase; });
    host.querySelector('.ms-parts').dataset.mode = s.phase;
    if (s.phase === 'learn') {
      const st = learn[step];
      $('.ms-parts__count').innerHTML = bi(`Part ${step + 1} of ${learn.length}`, `Parte ${step + 1} de ${learn.length}`);
      $('.ms-parts__say').className = `ms-parts__say ms-legend--${st.part}`;
      $('.ms-parts__say').innerHTML = bi(st.en, st.es);
      $('[data-step="-1"]').disabled = step === 0;
      $('[data-step="1"]').innerHTML = step === learn.length - 1 ? bi('Now you name them', 'Ahora nómbralas tú') : bi('Next part', 'Siguiente parte');
    }
    if (s.phase === 'name') {
      const done = ask >= order.length;
      $('[data-to="build"]', host).hidden = !done;
      $('.ms-parts__ask').innerHTML = done
        ? bi('You named all four parts.', 'Nombraste las cuatro partes.')
        : bi(`Tap ${order[ask] === 'term' ? 'a' : 'the'} ${PART_NAMES[order[ask]][0]}. (${ask + 1} of ${order.length})`, `Toca ${PART_NAMES[order[ask]][1]}. (${ask + 1} de ${order.length})`);
    }
    if (s.phase === 'build') {
      $('.ms-parts__vlabel').innerHTML = bi(`Value of ${s.variable}`, `Valor de ${s.variable}`);
      $('.ms-parts__eval').innerHTML = `<strong>${bi(`Evaluate when ${s.variable} = ${s.v}`, `Evalúa cuando ${s.variable} = ${s.v}`)}</strong><p class="ms-parts__steps">${esc(d.text.replace(new RegExp(`(\\d*)${s.variable}`), (_m, c) => (c ? `${c}(${s.v})` : `(${s.v})`)))} = ${esc(d.steps)}</p>`;
    }
    host.querySelectorAll('[data-part]').forEach((btn) => btn.addEventListener('click', () => {
      const part = btn.dataset.part;
      if (s.phase === 'learn') { step = order.indexOf(part); draw(); return; }
      if (s.phase !== 'name' || ask >= order.length) return;
      const target = order[ask];
      const right = target === 'term' || part === target;
      const fb = $('.ms-parts__fb');
      if (target === 'term') {
        const term = btn.closest('.ms-term');
        host.querySelectorAll('.ms-term').forEach((t) => t.classList.toggle('is-picked', t === term));
        fb.innerHTML = bi(`Yes: ${term.dataset.term === '1' ? d.varTerm : e.b} is a term. Terms are the parts joined by + or −.`, `Sí: ${term.dataset.term === '1' ? d.varTerm : e.b} es un término. Los términos son las partes unidas por + o −.`);
      } else if (right) fb.innerHTML = bi(`Yes, that is the ${target}.`, `Sí, es ${PART_NAMES[target][1]}.`);
      else fb.innerHTML = bi(`That is the ${part}. Look for the ${target}.`, `Esa parte es ${PART_NAMES[part][1]}. Busca ${PART_NAMES[target][1]}.`);
      fb.className = `ms-parts__fb ${right ? 'is-ok' : 'is-no'}`;
      if (right) { ask++; setTimeout(draw, 900); }
    }));
    onChange({ ...s }, d);
  };
  host.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const next = step + Number(b.dataset.step);
    if (next >= order.length) { setPhase('name'); $('.ms-parts__fb').innerHTML = ''; return; }
    step = Math.max(0, next);
    draw();
  }));
  host.querySelectorAll('[data-to]').forEach((b) => b.addEventListener('click', () => setPhase(b.dataset.to)));
  host.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('input', () => {
    const k = el.dataset.k;
    if (k === 'variable' || k === 'op') s[k] = el.value;
    else if (el.value.trim() !== '') s[k] = clamp(el.value, LIMITS[k]);
    draw();
  }));
  host.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('change', sync));
  $('[data-reset]').addEventListener('click', () => { s = { a: cfg.a, variable: cfg.variable, op: cfg.op || '+', b: cfg.b, v: cfg.v, phase: 'build' }; sync(); draw(); });
  sync(); draw(); onPhase(s.phase);
  return {
    get state() { return { ...s }; },
    set(next) { s = { ...s, ...next }; sync(); draw(); onPhase(s.phase); },
    result: () => describe(s),
  };
}

// The shared explorer interface (studio.mjs EXPLORERS).
export const initialState = (cfg) => ({ a: cfg.a, variable: cfg.variable, op: cfg.op || '+', b: cfg.b, v: cfg.v, phase: 'learn' });
export const mount = mountParts;
export const questions = partsQuestions;
export const transfer = partsTransfer;
