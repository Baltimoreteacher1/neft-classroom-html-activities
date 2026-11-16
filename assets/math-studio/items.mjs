// One question card for every Math Studio item kind (mc, num, ea), with the support ladder from core.mjs: an attention
// cue, the model or a visual hint, structured guidance, then a complete worked example and a different question.
import { checkChoice, checkNumber, checkStep, freshRecord, nextSupport, recordAttempt, revealWorked } from './core.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const bi = (en, es) => `<span class="t-en">${esc(en)}</span>${es ? `<span class="t-es" lang="es">${esc(es)}</span>` : ''}`;
let uid = 0;

/**
 * Render `item` into `host`. `rec` is the saved record (or null). Options:
 *   misconceptions  tag -> { name, fix } for the lesson
 *   onChange(rec)   called after every attempt, hint or reveal (the caller saves)
 *   onModel(item, rec)  practice -> model hand-off; offered only when item.model exists
 *   onNext()        "Try a new question" after a worked example or a correct answer
 *   independentOnly first answer is the evidence (Reflect): no hints offered before the first attempt
 *   label           eyebrow text such as "Question 2 of 8"
 */
export function renderItem(host, item, opts = {}) {
  let rec = { ...freshRecord(), ...(opts.rec || {}) };
  const n = ++uid;
  const hints = item.hints || [];
  const hasModel = Boolean(item.model && opts.onModel);
  const body =
    item.kind === 'mc'
      ? `<fieldset class="ms-choices"><legend class="sr-only">Choose one answer</legend>${item.choices
          .map((c, i) => `<label class="ms-choice"><input type="radio" name="ms-q${n}" value="${i}"><span>${bi(c, item.choicesEs?.[i])}</span></label>`)
          .join('')}</fieldset>`
      : item.kind === 'ea'
        ? `<fieldset class="ms-choices ms-steps"><legend>${bi('Which step has the mistake?', '¿Qué paso tiene el error?')}</legend>${item.steps
            .map((s, i) => `<label class="ms-choice"><input type="radio" name="ms-q${n}" value="${i}"><span><strong>${bi(`Step ${i + 1}: ${s.label}`, s.labelEs ? `Paso ${i + 1}: ${s.labelEs}` : '')}</strong> ${bi(s.work, s.workEs)}</span></label>`)
            .join('')}</fieldset>`
        : `<label class="ms-label" for="ms-in${n}">${bi('Your answer', 'Tu respuesta')}${item.unit ? ` <span class="ms-muted">(${esc(item.unit)})</span>` : ''}</label><input id="ms-in${n}" class="ms-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  host.innerHTML = `<article class="ms-item" data-item="${esc(item.id)}">
    ${opts.label ? `<p class="ms-eyebrow">${esc(opts.label)}</p>` : ''}
    <p class="ms-prompt">${bi(item.prompt, item.promptEs)}</p>
    ${body}
    <div class="ms-row ms-item__actions">
      <button type="button" class="ms-btn" data-act="check">${bi('Check', 'Revisar')}</button>
      <button type="button" class="ms-btn ms-btn--quiet" data-act="hint">${bi('Hint', 'Pista')}</button>
      ${hasModel ? `<button type="button" class="ms-btn ms-btn--quiet" data-act="model">${bi('See it in the model', 'Míralo en el modelo')}</button>` : ''}
      <button type="button" class="ms-btn ms-btn--link" data-act="worked" hidden>${bi('Show me a worked example', 'Muéstrame un ejemplo resuelto')}</button>
    </div>
    <div class="ms-feedback" role="status" aria-live="polite"></div>
    <div class="ms-hints"></div>
    <div class="ms-workedout" hidden></div>
  </article>`;
  const $ = (s) => host.querySelector(s);
  const fb = $('.ms-feedback');
  const hintBtn = $('[data-act="hint"]');
  const workedBtn = $('[data-act="worked"]');

  const response = () => {
    if (item.kind === 'num') return $('input').value.trim();
    const picked = host.querySelector('input[type=radio]:checked');
    return picked ? Number(picked.value) : null;
  };
  const say = (cls, html) => { fb.className = `ms-feedback ${cls}`; fb.innerHTML = html; };
  const lockIfDone = () => {
    if (!rec.result) return;
    host.querySelectorAll('input').forEach((el) => { el.disabled = true; });
    $('[data-act="check"]').disabled = true;
    hintBtn.disabled = true;
    $('.ms-item').dataset.result = rec.result;
    if (opts.onNext && !$('[data-act="next"]')) {
      const next = document.createElement('button');
      next.type = 'button'; next.className = 'ms-btn'; next.dataset.act = 'next';
      next.innerHTML = bi('Try a new question', 'Prueba una pregunta nueva');
      next.addEventListener('click', () => opts.onNext());
      $('.ms-item__actions').append(next);
    }
  };
  const syncSupport = () => {
    const s = nextSupport(rec, item, hasModel);
    hintBtn.hidden = !hints.length || rec.hints >= hints.length || (opts.independentOnly && rec.attempts === 0);
    hintBtn.querySelector('.t-en').textContent = rec.hints ? `Next hint (${rec.hints + 1} of ${hints.length})` : 'Hint';
    workedBtn.hidden = Boolean(rec.result) || !(rec.wrong >= 2 || rec.hints >= hints.length && rec.hints > 0 || s.level === 'worked');
  };
  const showHints = () => {
    $('.ms-hints').innerHTML = hints.slice(0, rec.hints).map((h, i) => `<p class="ms-hint"><span class="ms-hint__n">${i + 1}</span>${bi(h, item.hintsEs?.[i])}</p>`).join('');
  };
  const showWorked = () => {
    const box = $('.ms-workedout');
    const fix = item.kind === 'ea' && item.correctWork ? `<p><strong>${bi('Corrected work:', 'Trabajo corregido:')}</strong> ${bi(item.correctWork, item.correctWorkEs)}</p>` : '';
    const key = item.kind === 'mc' ? `<p><strong>${bi('Answer:', 'Respuesta:')}</strong> ${bi(item.choices[item.correct], item.choicesEs?.[item.correct])}</p>` : item.kind === 'ea' ? `<p><strong>${bi(`The mistake is in step ${item.errorStep + 1}.`, `El error está en el paso ${item.errorStep + 1}.`)}</strong></p>` : `<p><strong>${bi('Answer:', 'Respuesta:')}</strong> ${esc(item.answer)}</p>`;
    box.innerHTML = `<h4>${bi('Worked example', 'Ejemplo resuelto')}</h4>${key}<p>${bi(item.explanation || '', item.explanationEs)}</p>${fix}<p class="ms-muted">${bi('Read it through, then try a new question so you can use the idea yourself.', 'Léelo y luego prueba una pregunta nueva para usar la idea tú mismo.')}</p>`;
    box.hidden = false;
  };
  const restore = () => {
    if (rec.response !== null && rec.response !== undefined) {
      if (item.kind === 'num') $('input').value = rec.response;
      else host.querySelector(`input[value="${rec.response}"]`)?.setAttribute('checked', '');
    }
    showHints();
    if (rec.result === 'independent' || rec.result === 'supported') say('ms-ok', `<strong>${bi(rec.result === 'independent' ? 'Correct on your own.' : 'Correct with support.', rec.result === 'independent' ? 'Correcto por tu cuenta.' : 'Correcto con apoyo.')}</strong> ${bi(item.explanation || '', item.explanationEs)}`);
    if (rec.worked) showWorked();
    (rec.ruledOut || []).forEach((v) => host.querySelector(`input[value="${v}"]`)?.closest('.ms-choice')?.classList.add('is-wrong'));
    lockIfDone(); syncSupport();
  };
  const change = () => { syncSupport(); opts.onChange?.(rec); };

  $('[data-act="check"]').addEventListener('click', () => {
    const r = response();
    if (r === null || r === '') { say('ms-warn', bi('Choose or type an answer first.', 'Primero elige o escribe una respuesta.')); return; }
    let res;
    if (item.kind === 'mc') res = checkChoice(item, r, opts.misconceptions || {});
    else if (item.kind === 'ea') res = checkStep(item, r);
    else {
      res = opts.check ? opts.check(item, r) : checkNumber(item, r);
      if (!res.parsed) { say('ms-warn', bi('Type a number, such as 12, 2.5 or 3/4.', 'Escribe un número, como 12, 2.5 o 3/4.')); return; }
    }
    rec = recordAttempt(rec, res.correct, r);
    if (res.correct) {
      say('ms-ok', `<strong>${bi(rec.result === 'independent' ? 'Correct on your own.' : 'Correct with support.', rec.result === 'independent' ? 'Correcto por tu cuenta.' : 'Correcto con apoyo.')}</strong> ${bi(item.explanation || '', item.explanationEs)}`);
      lockIfDone();
    } else {
      if (item.kind !== 'num') {
        rec.ruledOut = [...new Set([...(rec.ruledOut || []), r])];
        host.querySelector(`input[value="${r}"]`)?.closest('.ms-choice')?.classList.add('is-wrong');
      }
      if (res.misconception?.id) rec.tags = [...new Set([...(rec.tags || []), res.misconception.id])];
      const s = nextSupport(rec, item, hasModel);
      const parts = [];
      // Specific feedback only from what was authored for this answer; otherwise an honest prompt to look again.
      if (res.feedback) parts.push(`<p>${bi(res.feedback, res.feedbackEs)}</p>`);
      if (res.misconception) parts.push(`<p class="ms-trap"><strong>${bi(`Possible mix-up: ${res.misconception.name}.`, res.misconception.nameEs ? `Posible confusión: ${res.misconception.nameEs}.` : '')}</strong> ${bi(res.misconception.fix || '', res.misconception.fixEs)}</p>`);
      if (!parts.length) parts.push(`<p>${bi('Not yet. Look at the question again and check each quantity.', 'Todavía no. Vuelve a leer la pregunta y revisa cada cantidad.')}</p>`);
      if (s.level === 'visual') parts.push(`<p>${bi('Try the model: it opens with this question’s numbers.', 'Prueba el modelo: se abre con los números de esta pregunta.')}</p>`);
      else if (s.level === 'guide' && s.text && rec.hints < hints.length) { rec.hints = Math.min(hints.length, Math.max(rec.hints, rec.wrong)); showHints(); }
      else if (s.level === 'worked') parts.push(`<p>${bi('Let’s look at a complete worked example.', 'Veamos un ejemplo resuelto completo.')}</p>`);
      say('ms-no', parts.join(''));
    }
    change();
  });
  hintBtn.addEventListener('click', () => { rec = { ...rec, hints: Math.min(hints.length, rec.hints + 1) }; showHints(); change(); });
  workedBtn.addEventListener('click', () => { rec = revealWorked(rec); showWorked(); lockIfDone(); change(); });
  $('[data-act="model"]')?.addEventListener('click', () => { rec = { ...rec, model: true }; change(); opts.onModel(item, rec); });
  restore();
  return { get rec() { return rec; } };
}
