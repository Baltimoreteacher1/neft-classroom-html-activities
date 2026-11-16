// Like Terms Sorter (6-15): an expression of terms in two variables (and constants), shown as coloured terms; group
// the like terms and read the simplified expression, then check both forms give the same value. Explorer interface.
import { bi, esc } from './items.mjs';

/** "4m", "m" (coefficient 1), "3" (constant). */
const termText = (t) => (t.v ? (t.c === 1 ? t.v : `${t.c}${t.v}`) : String(t.c));
export const exprText = (terms) => terms.map(termText).join(' + ');
/** Combined coefficients per variable in first-seen order, constants last. */
export function simplify(terms) {
  const order = [...new Set(terms.map((t) => t.v).filter(Boolean))];
  const out = order.map((v) => ({ v, c: terms.filter((t) => t.v === v).reduce((a, t) => a + t.c, 0) }));
  const k = terms.filter((t) => !t.v).reduce((a, t) => a + t.c, 0);
  return [...out.filter((t) => t.c), ...(k ? [{ v: '', c: k }] : [])];
}
export const evalTerms = (terms, vals) => terms.reduce((a, t) => a + t.c * (t.v ? vals[t.v] : 1), 0);

export const initialState = (cfg) => ({ terms: cfg.terms.map((t) => ({ ...t })), grouped: false });

export function questions(s, lessonId) {
  const simp = simplify(s.terms);
  const [first, second] = simp.filter((t) => t.v);
  const qs = [first, second].filter(Boolean).map((t) => ({
    id: `lt-${exprText(s.terms)}-${t.v}`, kind: 'num', lessonId,
    prompt: `Simplify ${exprText(s.terms)}. What is the coefficient of ${t.v}?`, promptEs: `Simplifica ${exprText(s.terms)}. ¿Cuál es el coeficiente de ${t.v}?`,
    answer: t.c, hints: [`Like terms have the same variable. Find every ${t.v} term.`, `Add their coefficients: ${s.terms.filter((x) => x.v === t.v).map((x) => x.c).join(' + ')}.`],
    explanation: `${s.terms.filter((x) => x.v === t.v).map(termText).join(' + ')} = ${termText(t)}. Simplified: ${exprText(simp)}.`,
    mistakes: [{ answer: s.terms.reduce((a, x) => a + (x.v ? x.c : 0), 0), feedback: 'Only like terms combine: m terms with m terms, s terms with s terms.' }].filter((m) => m.answer !== t.c),
  }));
  return qs;
}

export function transfer(s, round, lessonId) {
  const a = 2 + (round % 6), b = 1 + ((round * 3) % 7), c = 3 + ((round * 5) % 6), d = 2 + (round % 4);
  const terms = [{ c: a, v: 'x' }, { c: b, v: '' }, { c: c, v: 'x' }, { c: d, v: '' }];
  return { id: `lt-t-${round}`, kind: 'num', lessonId, prompt: `New problem, no model: simplify ${exprText(terms)}. What is the constant term?`, promptEs: `Problema nuevo, sin el modelo: simplifica ${exprText(terms)}. ¿Cuál es el término constante?`, answer: b + d, hints: ['Constants are like terms with each other.', `Add the numbers with no variable: ${b} + ${d}.`], explanation: `${exprText(terms)} = ${a + c}x + ${b + d}.`, mistakes: [{ answer: a + b + c + d, feedback: 'The x terms and the constants are not like terms; combine each kind separately.' }] };
}

export function mount(host, cfg, { onChange = () => {} } = {}) {
  let s = initialState(cfg);
  const vars = cfg.vars;
  const check = Object.fromEntries(vars.map((v, i) => [v, i + 2]));
  host.innerHTML = `<div class="ms-x ms-like">
    ${cfg.context ? `<p class="ms-parts__context">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-like__row" aria-live="polite"></div>
    <div class="ms-row"><button type="button" class="ms-btn" data-group aria-pressed="false">${bi('Group like terms', 'Agrupa términos semejantes')}</button></div>
    <div class="ms-parts__eval ms-like__out"></div>
    <div class="ms-like__edit"></div>
    <div class="ms-row"><button type="button" class="ms-btn ms-btn--quiet" data-add>${bi('Add a term', 'Agrega un término')}</button><button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Reset', 'Reiniciar')}</button></div>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const cls = (t) => (t.v ? `ms-lt--v${vars.indexOf(t.v)}` : 'ms-lt--k');
  const draw = () => {
    const shown = s.grouped ? [...s.terms].sort((x, y) => (vars.indexOf(x.v) + 10 * !x.v) - (vars.indexOf(y.v) + 10 * !y.v)) : s.terms;
    $('.ms-like__row').innerHTML = `<p class="ms-like__expr" aria-label="${esc(exprText(shown))}">${shown.map((t, i) => `${i ? '<span class="ms-op" aria-hidden="true">+</span>' : ''}<span class="ms-lt ${cls(t)}">${esc(termText(t))}</span>`).join('')}</p>`;
    const simp = simplify(s.terms);
    $('.ms-like__out').innerHTML = `<strong>${bi('Simplified', 'Simplificada')}</strong><p class="ms-parts__steps">${esc(exprText(s.terms))} = ${esc(exprText(simp))}</p><p>${bi(`Check with ${vars.map((v) => `${v} = ${check[v]}`).join(', ')}: both forms equal ${evalTerms(s.terms, check)}.`, `Comprueba con ${vars.map((v) => `${v} = ${check[v]}`).join(', ')}: ambas formas valen ${evalTerms(s.terms, check)}.`)}</p>`;
    $('.ms-like__edit').innerHTML = `<div class="ms-like__terms">${s.terms.map((t, i) => `<div class="ms-like__term"><label>${bi(`Term ${i + 1}`, `Término ${i + 1}`)}<input type="number" data-c="${i}" min="1" max="12" value="${t.c}" inputmode="numeric"></label><label class="sr-only" for="ms-lt-v${i}">Variable</label><select id="ms-lt-v${i}" data-v="${i}">${[...vars, ''].map((v) => `<option value="${v}"${v === t.v ? ' selected' : ''}>${v || '(number)'}</option>`).join('')}</select>${s.terms.length > 2 ? `<button type="button" class="ms-btn ms-btn--link" data-del="${i}" aria-label="Remove term ${i + 1}">×</button>` : ''}</div>`).join('')}</div>`;
    host.querySelectorAll('[data-c]').forEach((el) => el.addEventListener('change', () => { const v = Math.round(Number(el.value)); if (v >= 1 && v <= 12) { s.terms[el.dataset.c].c = v; draw(); } }));
    host.querySelectorAll('[data-v]').forEach((el) => el.addEventListener('change', () => { s.terms[el.dataset.v].v = el.value; draw(); }));
    host.querySelectorAll('[data-del]').forEach((el) => el.addEventListener('click', () => { s.terms.splice(Number(el.dataset.del), 1); draw(); }));
    $('[data-group]').setAttribute('aria-pressed', String(s.grouped));
    onChange({ terms: s.terms.map((t) => ({ ...t })), grouped: s.grouped });
  };
  $('[data-group]').addEventListener('click', () => { s.grouped = !s.grouped; draw(); });
  $('[data-add]').addEventListener('click', () => { if (s.terms.length < 8) { s.terms.push({ c: 1, v: vars[0] }); draw(); } });
  $('[data-reset]').addEventListener('click', () => { s = initialState(cfg); draw(); });
  draw();
  return { get state() { return { terms: s.terms.map((t) => ({ ...t })), grouped: s.grouped }; }, set(next) { s = { terms: (next.terms || s.terms).map((t) => ({ ...t })), grouped: Boolean(next.grouped) }; draw(); } };
}
