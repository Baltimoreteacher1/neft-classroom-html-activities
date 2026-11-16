// Will the Answers Vary? (2-1): the lesson's own question cards, one at a time. The student decides whether different
// people or cases would give different answers, then sees whether that makes it a statistical question. Explorer
// interface; the cards and their answers come from the lesson config (explore.cards).
import { bi, esc } from './items.mjs';

const YES = ['Yes: the answers would vary', 'Sí: las respuestas variarían'];
const NO = ['No: there is one fixed answer', 'No: hay una sola respuesta fija'];
const isStat = (card) => card.correct === 0;

export const initialState = () => ({ i: 0, picks: {} });

const mc = (card, id, lessonId, prefix = '') => ({
  id, kind: 'mc', lessonId,
  prompt: `${prefix}Is this a statistical question? “${card.text}”`, promptEs: card.textEs ? `${prefix ? 'Problema nuevo, sin el modelo: ' : ''}¿Es una pregunta estadística? “${card.textEs}”` : undefined,
  choices: ['Yes: the answers vary, so it is statistical', 'No: it has one fixed answer'], choicesEs: ['Sí: las respuestas varían, así que es estadística', 'No: tiene una sola respuesta fija'],
  correct: isStat(card) ? 0 : 1,
  feedback: isStat(card) ? ['', 'Imagine asking different people or cases. Would every answer be the same?'] : ['Is there more than one possible answer here, or just one fact?', ''],
  hints: ['Ask: would different people, days or items give different answers?'],
  explanation: isStat(card) ? 'Different people or cases give different answers, so you would collect data: it is a statistical question.' : 'There is one fixed answer, so you do not need to collect varied data: it is not a statistical question.',
});

export function questions(s, lessonId, cards = questions.cards) {
  const pick = (k) => cards[(s.i + k) % cards.length];
  return [mc(pick(0), `sq-${s.i}`, lessonId), mc(pick(1), `sq-${s.i + 1}`, lessonId)];
}
export function transfer(s, round, lessonId, cards = questions.cards) {
  return mc(cards[(s.i + 2 + round) % cards.length], `sq-t-${(s.i + 2 + round) % cards.length}`, lessonId, 'New problem, no model: ');
}

export function mount(host, cfg, { onChange = () => {} } = {}) {
  const cards = cfg.cards;
  questions.cards = cards; // questions()/transfer() read the lesson's cards
  let s = initialState();
  host.innerHTML = `<div class="ms-x ms-sq">
    <div class="ms-sq__card" aria-live="polite"></div>
    <ol class="ms-sq__list"></ol>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const draw = () => {
    const card = cards[s.i % cards.length], picked = s.picks[s.i];
    const verdict = picked === undefined ? '' : (picked === 'yes') === isStat(card)
      ? `<p class="ms-parts__fb is-ok">${bi(isStat(card) ? 'Right: the answers vary, so this IS a statistical question. You would collect data.' : 'Right: one fixed answer, so this is NOT a statistical question.', isStat(card) ? 'Correcto: las respuestas varían, así que SÍ es una pregunta estadística. Recogerías datos.' : 'Correcto: una sola respuesta fija, así que NO es una pregunta estadística.')}</p>`
      : `<p class="ms-parts__fb is-no">${bi(isStat(card) ? 'Look again: different people or cases would answer differently, so it IS statistical.' : 'Look again: this has one fixed answer, so it is NOT statistical.', isStat(card) ? 'Vuelve a mirar: distintas personas o casos responderían diferente, así que SÍ es estadística.' : 'Vuelve a mirar: tiene una sola respuesta fija, así que NO es estadística.')}</p>`;
    $('.ms-sq__card').innerHTML = `<p class="ms-eyebrow">${bi(`Question ${s.i % cards.length + 1} of ${cards.length}`, `Pregunta ${s.i % cards.length + 1} de ${cards.length}`)}</p><p class="ms-sq__q">“${bi(card.text, card.textEs)}”</p><p>${bi('If you asked this of different people or cases, would the answers vary?', 'Si hicieras esta pregunta a distintas personas o casos, ¿variarían las respuestas?')}</p><div class="ms-row"><button type="button" class="ms-btn ms-btn--quiet" data-pick="yes" aria-pressed="${picked === 'yes'}">${bi(...YES)}</button><button type="button" class="ms-btn ms-btn--quiet" data-pick="no" aria-pressed="${picked === 'no'}">${bi(...NO)}</button></div>${verdict}<div class="ms-row"><button type="button" class="ms-btn" data-next${picked === undefined ? ' disabled' : ''}>${bi('Next question', 'Siguiente pregunta')}</button></div>`;
    $('.ms-sq__list').innerHTML = cards.map((c, i) => (s.picks[i] === undefined ? '' : `<li class="${(s.picks[i] === 'yes') === isStat(c) ? 'is-ok' : 'is-no'}">${esc(c.text)} — <strong>${bi(isStat(c) ? 'statistical' : 'not statistical', isStat(c) ? 'estadística' : 'no estadística')}</strong></li>`)).join('');
    host.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { s.picks[s.i] = b.dataset.pick; draw(); }));
    $('[data-next]').addEventListener('click', () => { s.i = (s.i + 1) % cards.length; draw(); });
    onChange({ i: s.i, picks: { ...s.picks } });
  };
  draw();
  return { get state() { return { i: s.i, picks: { ...s.picks } }; }, set(next) { s = { i: next.i ?? 0, picks: { ...(next.picks || {}) } }; draw(); } };
}
