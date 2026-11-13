// Representation Bridge UI: model values, equivalent representations, and predict-first experiments.
import { esc } from './model.mjs';
import { BRIDGE_STATIC_ES as fixedEs, describeBridgeEs, bridgeWhyEs } from './bridge-language-es.mjs';

const mfrac = (n, d) => `<mfrac><mn>${n}</mn><mn>${d}</mn></mfrac>`;
const bilingual = (en, es, spanish) => `${esc(en)}${spanish && es ? `<span class="es-line" lang="es">${esc(es)}</span>` : ''}`;
const key = (eq, noteEs, spanish) => {
  const wrap = (m) => (m ? `<p class="bridge-key">${m}</p>` : '');
  const label = esc(spanish ? noteEs : eq.note);
  if (eq.fraction) return wrap(`<math aria-label="${label}" lang="${spanish ? 'es' : 'en'}"><mrow>${mfrac(eq.fraction[0], eq.fraction[1])}</mrow></math>`);
  if (eq.power) return wrap(`<math aria-label="${label}" lang="${spanish ? 'es' : 'en'}"><mrow><msup><mn>${eq.power[0]}</mn><mn>${eq.power[1]}</mn></msup></mrow></math>`);
  if (eq.half) return wrap(`<math aria-label="${label}" lang="${spanish ? 'es' : 'en'}"><mrow><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>×</mo><mn>${eq.half[0]}</mn><mo>×</mo><mn>${eq.half[1]}</mn></mrow></math>`);
  return '';
};

export function mountBridge(host, { bridge, getValues, apply, record, lang = () => 'en' }) {
  const card = document.createElement('section');
  card.className = 'bridge-card';
  card.setAttribute('aria-labelledby', 'bridge-title');
  host.append(card);
  let stage = { phase: 'idle' };
  const es = () => lang() === 'es';
  const line = (en, esText) => bilingual(en, esText, es());

  const paint = () => {
    const values = getValues();
    let d;
    try { d = bridge.describe(values); } catch (error) {
      card.innerHTML = `<h3 id="bridge-title">${line('How the pieces connect', fixedEs.title)}</h3><p class="bridge-error" role="status">${line(error.message, 'Comprueba los valores del modelo e inténtalo de nuevo.')}</p>`;
      return;
    }
    const dEs = describeBridgeEs(bridge, values);
    const tone = (i) => (d.table.tones[i] ? ` class="bq-${d.table.tones[i]}"` : '');
    const head = d.table.head.map((h, i) => `<th scope="col"${tone(i)}>${line(h, dEs.table.head[i])}</th>`).join('');
    const rows = d.table.rows.map((r, ri) => `<tr><th scope="row"${tone(0)}>${line(r.label, dEs.table.rows[ri].label)}</th>${r.cells.map((c, i) => `<td${tone(i + 1)}>${c}${dEs.table.rows[ri].cells[i] !== c ? `<span class="es-line" lang="es">${esc(dEs.table.rows[ri].cells[i])}</span>` : ''}</td>`).join('')}</tr>`).join('');
    const ideas = bridge.transformations.map((t) => `<li class="bridge-idea"><label>${line(t.label, t.labelEs)}${t.param ? ` <input type="number" inputmode="decimal" data-param="${t.id}" min="${t.param.min}" max="${t.param.max}" step="${t.param.step || 1}" value="${t.param.value}" aria-label="${esc(es() ? t.param.labelEs : t.param.label)}" lang="${es() ? 'es' : 'en'}">` : ''}</label><button type="button" class="quiet" data-idea="${t.id}">${line('Test this idea', 'Prueba esta idea')}</button></li>`).join('');
    card.innerHTML = `<h3 id="bridge-title">${line('How the pieces connect', fixedEs.title)}</h3><p class="bridge-lede">${line('Everything below comes from the same numbers as the model above.', fixedEs.lede)}</p><div class="bridge-grid"><section class="bridge-panel"><h4>${line('Table', fixedEs.table)}</h4><div class="bridge-scroll" role="region" tabindex="0" aria-label="${esc(es() ? fixedEs.region : 'Table of equivalent values')}"><table><caption class="sr-only">${esc(d.a11y)}${es() ? `<span lang="es">${esc(dEs.a11y)}</span>` : ''}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></section><section class="bridge-panel"><h4>${line('Equation', fixedEs.equation)}</h4><p class="bridge-eq">${esc(d.equation.text)}</p>${key(d.equation, dEs.equation.note, es())}<p class="bridge-note">${line(d.equation.note, dEs.equation.note)}</p></section><section class="bridge-panel"><h4>${line('In words', fixedEs.words)}</h4><p>${line(d.words, dEs.words)}</p></section><section class="bridge-panel" data-holds="${d.invariant.holds}"><h4>${line('Check', fixedEs.check)}</h4><p><span class="bridge-badge">${d.invariant.holds ? '✓ Holds' : '✗ Does not hold'}${es() ? `<span class="es-line" lang="es">${d.invariant.holds ? '✓ Se cumple' : '✗ No se cumple'}</span>` : ''}</span> ${line(d.invariant.text, dEs.invariant)}</p></section></div><div class="bridge-test"><h4>${line('Test an idea', fixedEs.test)}</h4><ul class="bridge-ideas">${ideas}</ul><div class="bridge-stage" role="status" aria-live="polite" tabindex="-1"></div></div>`;
    card.querySelectorAll('[data-idea]').forEach((b) => (b.onclick = () => {
      const id = b.dataset.idea;
      const t = bridge.transformations.find((x) => x.id === id);
      const input = card.querySelector(`[data-param="${id}"]`);
      stage = { phase: 'predict', id, param: input ? Number(input.value) : undefined, before: getValues(), question: t.question };
      paintStage();
      card.querySelector('.bridge-stage').focus({ preventScroll: false });
    }));
    paintStage();
  };

  const paintStage = () => {
    const el = card.querySelector('.bridge-stage');
    if (!el) return;
    if (stage.phase === 'idle') { el.innerHTML = ''; return; }
    if (stage.phase === 'predict') {
      const t = bridge.transformations.find((x) => x.id === stage.id);
      el.innerHTML = `<p class="bridge-question"><strong>${line('Predict first.', fixedEs.predict)}</strong> ${line(stage.question, t.questionEs)}</p><div class="bridge-choices" role="group" aria-label="${esc(es() ? 'Tu predicción' : 'Your prediction')}"><button type="button" data-guess="yes">${line('Yes', fixedEs.yes)}</button><button type="button" data-guess="no">${line('No', fixedEs.no)}</button></div>`;
      el.querySelectorAll('[data-guess]').forEach((b) => (b.onclick = () => run(b.dataset.guess === 'yes')));
      return;
    }
    const r = stage.result;
    const miscon = r.misconception ? bridge.misconceptions.find((m) => m.id === r.misconception) : null;
    const changed = r.after.some((v, i) => v !== r.before[i]);
    const grid = changed ? `<table class="bridge-compare"><thead><tr><th scope="col"></th>${r.names.map((n, i) => `<th scope="col">${line(n, r.namesEs[i])}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">${line('Before', 'Antes')}</th>${r.before.slice(0, r.names.length).map((v) => `<td>${v}</td>`).join('')}</tr><tr><th scope="row">${line('After', 'Después')}</th>${r.after.slice(0, r.names.length).map((v) => `<td>${v}</td>`).join('')}</tr></tbody></table>` : '';
    const guessText = stage.guess ? 'yes' : 'no';
    const guessEs = stage.guess ? 'sí' : 'no';
    const whyEs = bridgeWhyEs(bridge, stage.before, stage.id, stage.param, r);
    el.innerHTML = `<p class="bridge-verdict" data-ok="${r.preserved}"><span class="bridge-badge">${line(r.preserved ? '✓ The relationship stayed the same' : '✗ The relationship changed', r.preserved ? '✓ La relación se mantuvo igual' : '✗ La relación cambió')}</span> ${line(`You predicted ${guessText}:`, `Predijiste ${guessEs}:`)} ${line(stage.guess === r.preserved ? 'that was right.' : 'not this time, and that is useful to know.', stage.guess === r.preserved ? fixedEs.right : fixedEs.useful)}</p>${grid}<p>${line(r.why, whyEs)}</p>${miscon ? `<p class="bridge-miscon"><strong>${line(miscon.name, miscon.nameEs)}.</strong> ${line(miscon.response, miscon.responseEs)}</p>` : ''}<div class="bridge-actions">${changed && r.fits ? `<button type="button" data-show>${line('Show this in the model', fixedEs.show)}</button>` : ''}<button type="button" class="quiet" data-again>${line('Test another idea', fixedEs.again)}</button></div>`;
    el.querySelector('[data-show]')?.addEventListener('click', () => apply(r.after));
    el.querySelector('[data-again]').onclick = () => { stage = { phase: 'idle' }; paintStage(); };
  };

  const run = (guess) => {
    let r;
    try { r = bridge.test(stage.before, stage.id, stage.param); } catch (error) {
      card.querySelector('.bridge-stage').innerHTML = `<p class="bridge-error">${line(error.message, 'Comprueba el intervalo de valores e inténtalo de nuevo.')}</p>`;
      return;
    }
    const dEs = describeBridgeEs(bridge, stage.before);
    const t = bridge.transformations.find((x) => x.id === stage.id);
    const whyEs = bridgeWhyEs(bridge, stage.before, stage.id, stage.param, r);
    r.namesEs = bridge.quantities.map((q) => q.nameEs);
    if (bridge.key === 'power:order') r.namesEs = ['Base', 'Factores'];
    if (bridge.key === 'balance:add') r.namesEs = ['Cantidad sumada', 'Lado derecho'];
    stage = { ...stage, phase: 'result', guess, result: r };
    record({
      source: 'bridge',
      prediction: { text: guess ? 'yes' : 'no', textEs: guess ? 'sí' : 'no', ok: guess === r.preserved },
      change: { text: `${t.label}${stage.param !== undefined ? ` ${stage.param}` : ''}`, textEs: `${t.labelEs}${stage.param !== undefined ? ` ${stage.param}` : ''}`, before: r.before, after: r.after },
      observed: { text: `${r.preserved ? 'The relationship stayed the same.' : 'The relationship changed.'} ${r.why}`, textEs: `${r.preserved ? 'La relación se mantuvo igual.' : 'La relación cambió.'} ${whyEs}`, ok: r.preserved },
      relation: bridge.describe(stage.before).invariant.text,
      relationEs: dEs.invariant,
    });
    paintStage();
    card.querySelector('.bridge-stage').focus({ preventScroll: true });
  };

  paint();
  return { update: paint };
}
