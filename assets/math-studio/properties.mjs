// Properties Machine (6-8): rewrite a three-part sum or product with the Commutative, Associative and Identity
// properties. Each move names its property and the value is re-checked, so students see the form change and the
// value stay. Explorer interface: initialState/mount/questions/transfer.
import { bi, esc } from './items.mjs';

export const PROPS = {
  commutative: ['Commutative Property', 'Propiedad conmutativa', 'Order changes; the value does not.', 'El orden cambia; el valor no.'],
  associative: ['Associative Property', 'Propiedad asociativa', 'Grouping changes; the value does not.', 'La agrupación cambia; el valor no.'],
  identity: ['Identity Property', 'Propiedad de identidad', 'Adding 0 or multiplying by 1 keeps the value.', 'Sumar 0 o multiplicar por 1 mantiene el valor.'],
};
const SYM = { '+': '+', '×': '×' };
/** (a op b) op c, a op (b op c), or a op b op c; identity appends op 0/1. */
export function text(s) {
  const [a, b, c] = s.items, o = ` ${SYM[s.op]} `;
  const core = s.group === 'left' ? `(${a}${o}${b})${o}${c}` : s.group === 'right' ? `${a}${o}(${b}${o}${c})` : `${a}${o}${b}${o}${c}`;
  return s.identity ? `${core}${o}${s.op === '+' ? 0 : 1}` : core;
}
export const value = (s) => s.items.map(Number).reduce((x, y) => (s.op === '+' ? x + y : x * y), s.op === '+' ? 0 : 1);

/** The moves, each a pure function of the state, and the property it uses. */
export const MOVES = {
  swapInside: { prop: 'commutative', label: ['Swap inside the parentheses', 'Intercambia dentro del paréntesis'], ok: (s) => s.group !== 'none', run: (s) => { const it = [...s.items]; const [i, j] = s.group === 'left' ? [0, 1] : [1, 2]; [it[i], it[j]] = [it[j], it[i]]; return { ...s, items: it }; } },
  swapSides: { prop: 'commutative', label: ['Swap the group and the single number', 'Intercambia el grupo y el número solo'], ok: (s) => s.group !== 'none', run: (s) => (s.group === 'left' ? { ...s, items: [s.items[2], s.items[0], s.items[1]], group: 'right' } : { ...s, items: [s.items[1], s.items[2], s.items[0]], group: 'left' }) },
  regroup: { prop: 'associative', label: ['Move the parentheses', 'Mueve el paréntesis'], ok: (s) => s.group !== 'none', run: (s) => ({ ...s, group: s.group === 'left' ? 'right' : 'left' }) },
  identity: { prop: 'identity', label: ['Add 0 / multiply by 1', 'Suma 0 / multiplica por 1'], ok: () => true, run: (s) => ({ ...s, identity: !s.identity }) },
};

export const initialState = (cfg) => ({ op: cfg.op || '+', items: cfg.items.map(String), group: 'left', identity: false, history: [] });

const choices = [PROPS.commutative[0], PROPS.associative[0], PROPS.identity[0]];
const choicesEs = [PROPS.commutative[1], PROPS.associative[1], PROPS.identity[1]];
export function questions(s, lessonId) {
  const base = { ...s, group: 'left', identity: false };
  const regrouped = MOVES.regroup.run(base), swapped = MOVES.swapInside.run(base);
  return [
    { id: `prop-a-${text(base)}`, kind: 'mc', lessonId, prompt: `Which property changes ${text(base)} into ${text(regrouped)}?`, promptEs: `¿Qué propiedad cambia ${text(base)} en ${text(regrouped)}?`, choices, choicesEs, correct: 1, feedback: ['The numbers are in the same order. Look at what moved.', '', 'Nothing was added or multiplied by 1.'], hints: ['Compare the order of the numbers, then the parentheses.'], explanation: `Only the parentheses moved: that is the Associative Property. Both equal ${value(base)}.` },
    { id: `prop-c-${text(base)}`, kind: 'mc', lessonId, prompt: `Which property changes ${text(base)} into ${text(swapped)}?`, promptEs: `¿Qué propiedad cambia ${text(base)} en ${text(swapped)}?`, choices, choicesEs, correct: 0, feedback: ['', 'The parentheses are in the same place. Look at the order.', 'Nothing was added or multiplied by 1.'], hints: ['Compare the order of the numbers inside the parentheses.'], explanation: `The order inside the parentheses changed: that is the Commutative Property. Both equal ${value(base)}.` },
    { id: `prop-v-${text(base)}`, kind: 'num', lessonId, prompt: `What is the value of ${text(regrouped)}?`, promptEs: `¿Cuál es el valor de ${text(regrouped)}?`, answer: value(base), hints: ['Work inside the parentheses first.'], explanation: `${text(regrouped)} = ${value(base)}, the same as ${text(base)}: rewriting with a property never changes the value.` },
  ];
}

export function transfer(s, round, lessonId) {
  const n = 3 + ((round * 5) % 17);
  const forms = [
    [`${n} × 1 = ${n}`, 2], [`${n} + 0 = ${n}`, 2], [`${n} + 4 = 4 + ${n}`, 0], [`(2 × ${n}) × 5 = 2 × (${n} × 5)`, 1],
  ];
  const [eq, correct] = forms[round % forms.length];
  return { id: `prop-t-${eq}`, kind: 'mc', lessonId, prompt: `New problem, no model: which property does ${eq} show?`, promptEs: `Problema nuevo, sin el modelo: ¿qué propiedad muestra ${eq}?`, choices, choicesEs, correct, feedback: choices.map((_, i) => (i === correct ? '' : ['Look at whether the order changed.', 'Look at whether the grouping changed.', 'Look for + 0 or × 1.'][i])), hints: ['Order changed → commutative. Grouping changed → associative. + 0 or × 1 → identity.'], explanation: `${eq} shows the ${choices[correct]}.` };
}

export function mount(host, cfg, { onChange = () => {} } = {}) {
  let s = initialState(cfg);
  host.innerHTML = `<div class="ms-x ms-props">
    ${cfg.context ? `<p class="ms-parts__context">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-props__expr" aria-live="polite"></div>
    <div class="ms-props__moves" role="group" aria-label="Rewrite the expression"></div>
    <ol class="ms-props__history"></ol>
    <div class="ms-parts__controls">
      <label>${bi('Operation', 'Operación')}<select data-op><option value="+">+ (sum)</option><option value="×">× (product)</option></select></label>
      <button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Start over', 'Empezar de nuevo')}</button>
    </div>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const draw = () => {
    $('.ms-props__expr').innerHTML = `<p class="ms-props__big">${esc(text(s))} = ${value(s)}</p>`;
    $('.ms-props__moves').innerHTML = Object.entries(MOVES).map(([k, m]) => `<button type="button" class="ms-btn ms-btn--quiet" data-move="${k}"${m.ok(s) ? '' : ' disabled'}>${bi(...m.label)}</button>`).join('');
    host.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', () => {
      const m = MOVES[b.dataset.move], before = text(s);
      s = { ...m.run(s), history: [...s.history, { from: before, prop: m.prop }] };
      s.history.at(-1).to = text(s);
      draw();
    }));
    $('.ms-props__history').innerHTML = s.history.slice(-5).map((h) => `<li><span class="ms-props__eq">${esc(h.from)} → ${esc(h.to)}</span> <strong>${bi(PROPS[h.prop][0], PROPS[h.prop][1])}</strong> — ${bi(PROPS[h.prop][2], PROPS[h.prop][3])}</li>`).join('');
    $('[data-op]').value = s.op;
    onChange({ ...s });
  };
  $('[data-op]').addEventListener('change', (e) => { s = { ...initialState(cfg), op: e.target.value }; draw(); });
  $('[data-reset]').addEventListener('click', () => { s = { ...initialState(cfg), op: s.op }; draw(); });
  draw();
  return { get state() { return { ...s }; }, set(next) { s = { ...s, ...next }; draw(); } };
}
