// Representation Bridge UI: the model's table, equation and plain-language sentence, all drawn from the model's current
// values (bridge-math.mjs), plus "Test an idea": predict first, then see whether the relationship survives and why.
import { esc } from './model.mjs';

const mfrac = (n, d) => `<mfrac><mn>${n}</mn><mn>${d}</mn></mfrac>`;
const key = (eq) => {
  const wrap = (m) => (m ? `<p class="bridge-key">${m}</p>` : '');
  if (eq.fraction) return wrap(`<math aria-label="${esc(eq.note)}"><mrow>${mfrac(eq.fraction[0], eq.fraction[1])}</mrow></math>`);
  if (eq.power) return wrap(`<math aria-label="${esc(eq.note)}"><mrow><msup><mn>${eq.power[0]}</mn><mn>${eq.power[1]}</mn></msup></mrow></math>`);
  if (eq.half) return wrap(`<math aria-label="${esc(eq.note)}"><mrow><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>×</mo><mn>${eq.half[0]}</mn><mo>×</mo><mn>${eq.half[1]}</mn></mrow></math>`);
  return '';
};

export function mountBridge(host, { bridge, getValues, apply, record }) {
  const card = document.createElement('section');
  card.className = 'bridge-card';
  card.setAttribute('aria-labelledby', 'bridge-title');
  host.append(card);
  let stage = { phase: 'idle' };

  const paint = () => {
    const values = getValues();
    let d;
    try { d = bridge.describe(values); } catch (error) {
      card.innerHTML = `<h3 id="bridge-title">How the pieces connect</h3><p class="bridge-error" role="status">${esc(error.message)}</p>`;
      return;
    }
    const tone = (i) => (d.table.tones[i] ? ` class="bq-${d.table.tones[i]}"` : '');
    const head = d.table.head.map((h, i) => `<th scope="col"${tone(i)}>${esc(h)}</th>`).join('');
    const rows = d.table.rows.map((r) => `<tr><th scope="row"${tone(0)}>${esc(r.label)}</th>${r.cells.map((c, i) => `<td${tone(i + 1)}>${esc(c)}</td>`).join('')}</tr>`).join('');
    const ideas = bridge.transformations.map((t) => `<li class="bridge-idea"><label>${esc(t.label)}${t.param ? ` <input type="number" inputmode="decimal" data-param="${t.id}" min="${t.param.min}" max="${t.param.max}" step="${t.param.step || 1}" value="${t.param.value}" aria-label="${esc(t.param.label)}">` : ''}</label><button type="button" class="quiet" data-idea="${t.id}">Test this idea</button></li>`).join('');
    card.innerHTML = `<h3 id="bridge-title">How the pieces connect</h3><p class="bridge-lede">Everything below comes from the same numbers as the model above.</p><div class="bridge-grid"><section class="bridge-panel"><h4>Table</h4><div class="bridge-scroll" role="region" tabindex="0" aria-label="Table of equivalent values"><table><caption class="sr-only">${esc(d.a11y)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></section><section class="bridge-panel"><h4>Equation</h4><p class="bridge-eq">${esc(d.equation.text)}</p>${key(d.equation)}<p class="bridge-note">${esc(d.equation.note)}</p></section><section class="bridge-panel"><h4>In words</h4><p>${esc(d.words)}</p></section><section class="bridge-panel" data-holds="${d.invariant.holds}"><h4>Check</h4><p><span class="bridge-badge">${d.invariant.holds ? '✓ Holds' : '✗ Does not hold'}</span> ${esc(d.invariant.text)}</p></section></div><div class="bridge-test"><h4>Test an idea</h4><ul class="bridge-ideas">${ideas}</ul><div class="bridge-stage" role="status" aria-live="polite" tabindex="-1"></div></div>`;
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
      el.innerHTML = `<p class="bridge-question"><strong>Predict first.</strong> ${esc(stage.question)}</p><div class="bridge-choices" role="group" aria-label="Your prediction"><button type="button" data-guess="yes">Yes</button><button type="button" data-guess="no">No</button></div>`;
      el.querySelectorAll('[data-guess]').forEach((b) => (b.onclick = () => run(b.dataset.guess === 'yes')));
      return;
    }
    const r = stage.result;
    const miscon = r.misconception ? bridge.misconceptions.find((m) => m.id === r.misconception) : null;
    const changed = r.after.some((v, i) => v !== r.before[i]);
    const grid = changed ? `<table class="bridge-compare"><thead><tr><th scope="col"></th>${r.names.map((n) => `<th scope="col">${esc(n)}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">Before</th>${r.before.slice(0, r.names.length).map((v) => `<td>${v}</td>`).join('')}</tr><tr><th scope="row">After</th>${r.after.slice(0, r.names.length).map((v) => `<td>${v}</td>`).join('')}</tr></tbody></table>` : '';
    el.innerHTML = `<p class="bridge-verdict" data-ok="${r.preserved}"><span class="bridge-badge">${r.preserved ? '✓ The relationship stayed the same' : '✗ The relationship changed'}</span> You predicted ${stage.guess ? 'yes' : 'no'}: ${stage.guess === r.preserved ? 'that was right.' : 'not this time, and that is useful to know.'}</p>${grid}<p>${esc(r.why)}</p>${miscon ? `<p class="bridge-miscon"><strong>${esc(miscon.name)}.</strong> ${esc(miscon.response)}</p>` : ''}<div class="bridge-actions">${changed && r.fits ? '<button type="button" data-show>Show this in the model</button>' : ''}<button type="button" class="quiet" data-again>Test another idea</button></div>`;
    el.querySelector('[data-show]')?.addEventListener('click', () => apply(r.after));
    el.querySelector('[data-again]').onclick = () => { stage = { phase: 'idle' }; paintStage(); };
  };

  const run = (guess) => {
    let r;
    try { r = bridge.test(stage.before, stage.id, stage.param); } catch (error) {
      card.querySelector('.bridge-stage').innerHTML = `<p class="bridge-error">${esc(error.message)}</p>`;
      return;
    }
    stage = { ...stage, phase: 'result', guess, result: r };
    const t = bridge.transformations.find((x) => x.id === stage.id);
    const rel = bridge.describe(stage.before).invariant.text;
    record({
      source: 'bridge',
      prediction: { text: guess ? 'yes' : 'no', ok: guess === r.preserved },
      change: { text: `${t.label}${stage.param !== undefined ? ` ${stage.param}` : ''}`, before: r.before, after: r.after },
      observed: { text: `${r.preserved ? 'The relationship stayed the same.' : 'The relationship changed.'} ${r.why}`, ok: r.preserved },
      relation: rel,
    });
    paintStage();
    card.querySelector('.bridge-stage').focus({ preventScroll: true });
  };

  paint();
  return { update: paint };
}
