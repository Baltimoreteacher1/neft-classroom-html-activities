// Background knowledge in the Learning Lab: the one or two skills today's lesson stands on, from the same content the
// family homework page uses (data/family-background/<lesson>.json, via #ms-data). Built for students still learning
// English: one skill at a time, a picture of the example, steps revealed one by one, every line in English with Spanish
// beside it (the page's language switch), a Listen button that reads the card aloud, and a quick check with feedback
// for every choice (the same question card as the rest of the studio).
import { bi, renderItem } from './items.mjs';

let models = null;
const loadModels = () => (models ||= import('/assets/design/family/art/math-models.mjs'));

/** Read a skill aloud in the page's language. Speech is a support, never required: no voice means no button. */
function speaker(btn, text, lang) {
  if (!('speechSynthesis' in window)) { btn.hidden = true; return; }
  btn.addEventListener('click', () => {
    speechSynthesis.cancel();
    const es = lang() === 'es';
    const u = new SpeechSynthesisUtterance(es ? text.es : text.en);
    u.lang = es ? 'es-US' : 'en-US';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  });
}

function asItem(s, i, lessonId) {
  const c = s.check;
  return {
    id: `bg-${lessonId}-${i}`,
    kind: 'mc',
    prompt: c.q.en,
    promptEs: c.q.es,
    choices: c.options,
    correct: c.correctIdx,
    feedback: c.feedback.map((f, j) => (j === c.correctIdx ? '' : f.en)),
    feedbackEs: c.feedback.map((f, j) => (j === c.correctIdx ? null : f.es)),
    hints: s.steps.map((st) => st.en),
    hintsEs: s.steps.map((st) => st.es),
    explanation: c.feedback[c.correctIdx].en,
    explanationEs: c.feedback[c.correctIdx].es,
  };
}

function skillCard(s, i, total, lessonId, { lang, onCheck, records }) {
  const card = document.createElement('section');
  card.className = 'ms-bg-skill';
  card.dataset.skill = String(i);
  card.setAttribute('aria-labelledby', `ms-bg-h-${i}`);
  card.innerHTML = `
    <p class="ms-eyebrow">${bi(`Skill ${i + 1} of ${total}`, `Destreza ${i + 1} de ${total}`)}</p>
    <h3 id="ms-bg-h-${i}" tabindex="-1"><span class="ms-bg-num" aria-hidden="true">${i + 1}</span>${bi(s.name.en, s.name.es)}</h3>
    <p class="ms-bg-why">${bi(s.why.en, s.why.es)}</p>
    ${s.model ? `<figure class="ms-bg-figure" aria-busy="true"></figure>` : ''}
    <div class="ms-bg-steps">
      <h4>${bi('Steps', 'Pasos')}</h4>
      <ol>${s.steps.map((st) => `<li>${bi(st.en, st.es)}</li>`).join('')}</ol>
      <p class="ms-row"><button type="button" class="ms-btn" data-bg-next>${bi('Show the next step', 'Mostrar el siguiente paso')}</button></p>
    </div>
    <p class="ms-bg-example" hidden><strong>${bi('Example', 'Ejemplo')}</strong> ${bi(s.example.en, s.example.es)}</p>
    <p class="ms-row"><button type="button" class="ms-btn ms-btn--quiet" data-bg-listen>${bi('🔊 Listen', '🔊 Escuchar')}</button></p>
    <div class="ms-bg-check" hidden></div>`;
  // Steps one at a time, then the example, then the quick check.
  const items = [...card.querySelectorAll('.ms-bg-steps li')];
  let shown = 1;
  const next = card.querySelector('[data-bg-next]');
  const example = card.querySelector('.ms-bg-example');
  const check = card.querySelector('.ms-bg-check');
  const walk = () => {
    items.forEach((li, k) => { li.hidden = k >= shown; });
    const done = shown >= items.length;
    next.hidden = done;
    example.hidden = !done;
    check.hidden = !done;
  };
  next.addEventListener('click', () => { shown += 1; walk(); });
  walk();
  speaker(card.querySelector('[data-bg-listen]'), {
    en: [s.name.en, s.why.en, ...s.steps.map((x) => x.en), `Example. ${s.example.en}`].join('. '),
    es: [s.name.es, s.why.es, ...s.steps.map((x) => x.es), `Ejemplo. ${s.example.es}`].join('. '),
  }, lang);
  const item = asItem(s, i, lessonId);
  renderItem(check, item, {
    label: ['Quick check', 'Pregunta rápida'],
    rec: records[item.id],
    onChange: (rec) => onCheck(item.id, rec),
  });
  if (s.model) {
    const fig = card.querySelector('.ms-bg-figure');
    loadModels()
      .then((m) => {
        fig.innerHTML = `<span class="t-en">${m.renderModel(s.model, { lang: 'en' })}</span><span class="t-es" lang="es">${m.renderModel(s.model, { lang: 'es' })}</span>`;
        fig.removeAttribute('aria-busy');
      })
      .catch(() => fig.remove());
  }
  return card;
}

/**
 * Mount the Background knowledge button and dialog. `data` is the lesson's skills; `state.background` keeps the
 * check records so a reload remembers them.
 */
// The content is shared with the family homework page, which speaks of "tonight"; in class it is today.
const today = (t) => (typeof t === 'string' ? t.replace(/\bTonight\b/g, 'Today').replace(/\btonight\b/g, 'today') : t);
const inClass = (v) => (Array.isArray(v) ? v.map(inClass) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'en' ? today(x) : inClass(x)])) : v);

export function mountBackground({ skills: shared, lessonId, lang, state, save }) {
  const skills = inClass(shared);
  // Looked up by id on each tap and wired by delegation: the studio's vocabulary pass rewrites "Start here" (it
  // underlines the words), which replaces the button node, so a listener on the node itself would be lost.
  if (!document.getElementById('ms-bg-dialog') || !skills?.length) return;
  state.background ||= {};
  let dialog = null;
  let body = null;
  let tabs = null;
  let built = false;
  let at = 0;
  const show = (i, focus) => {
    at = i;
    body.querySelectorAll('.ms-bg-skill').forEach((c) => { c.hidden = Number(c.dataset.skill) !== i; });
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.to) === i)));
    if (focus) body.querySelector(`#ms-bg-h-${i}`)?.focus({ preventScroll: true });
  };
  const build = () => {
    const current = document.getElementById('ms-bg-dialog');
    if (built && current === dialog) return;
    dialog = current;
    body = dialog.querySelector('[data-bg-body]');
    tabs = dialog.querySelector('[data-bg-tabs]');
    body.innerHTML = '';
    built = true;
    dialog.querySelector('[data-bg-close]')?.addEventListener('click', () => {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      dialog.close?.();
      document.getElementById('ms-bg-open')?.focus();
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close?.(); });
    tabs.innerHTML = skills.length > 1
      ? skills.map((s, i) => `<button type="button" class="ms-btn ms-btn--quiet" data-to="${i}" aria-pressed="false">${bi(`${i + 1}. ${s.name.en}`, `${i + 1}. ${s.name.es}`)}</button>`).join('')
      : '';
    tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.to), true)));
    skills.forEach((s, i) => body.append(skillCard(s, i, skills.length, lessonId, {
      lang,
      records: state.background,
      onCheck: (id, rec) => {
        state.background[id] = rec;
        save();
        // A right answer on skill 1 offers skill 2.
        if ((rec.result === 'independent' || rec.result === 'supported') && i < skills.length - 1) {
          const card = body.querySelector(`[data-skill="${i}"]`);
          if (!card.querySelector('[data-bg-go]')) {
            const p = document.createElement('p');
            p.className = 'ms-row';
            p.innerHTML = `<button type="button" class="ms-btn" data-bg-go>${bi('Next skill →', 'Siguiente destreza →')}</button>`;
            p.querySelector('button').addEventListener('click', () => show(i + 1, true));
            card.append(p);
          }
        }
      },
    })));
    show(0, false);
  };
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('#ms-bg-open')) return;
    build();
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    body.querySelector(`#ms-bg-h-${at}`)?.focus({ preventScroll: true });
  });
}
