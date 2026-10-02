// Learn, Investigate, Practice, and Create activities. Each receives the shared lab context.
import { esc, guidance, mountModel } from './model.mjs';
import { numericAnswer } from './math.mjs';
import { activityStatus, levels, parseKeyIdea } from './progress.mjs';

const lessonNumber = (id) => id.replace('-', '.');

const copy = {
  en: { step: ['Step', 'step', 'steps'], question: ['Question', 'question', 'questions'], all: (n, w) => `All ${n} ${w} shown`, of: 'of', reveal: (w) => `Reveal next ${w}`, showAll: 'Show all' },
  es: { step: ['Paso', 'paso', 'pasos'], question: ['Pregunta', 'pregunta', 'preguntas'], all: (n, w) => `Se muestran los ${n} ${w}`, of: 'de', reveal: (w) => `Mostrar el siguiente ${w}`, showAll: 'Mostrar todo' },
};
function stepper(host, lines, count, { onReveal, onAll, label = 'step', lang = 'en' }) {
  const t = copy[lang] || copy.en, [Title, single, plural] = t[label];
  host.innerHTML = `<ol>${lines.slice(0, count).map((line, i) => `<li ${i === count - 1 && count > 1 ? 'class="just-revealed"' : ''}>${esc(line)}</li>`).join('')}</ol><div class="step-row"><p class="step-count">${count === lines.length ? t.all(lines.length, plural) : `${Title} ${count} ${t.of} ${lines.length}`}</p><button type="button" data-reveal ${count === lines.length ? 'disabled' : ''}>${t.reveal(single)}</button><button type="button" class="quiet" data-all ${count === lines.length ? 'disabled' : ''}>${t.showAll}</button></div>`;
  host.querySelector('[data-reveal]').onclick = onReveal;
  host.querySelector('[data-all]').onclick = onAll;
}

export function learn(ctx, host) {
  const { lab, state, save, textArea, bindNotes } = ctx;
  state.lang ||= 'en';
  host.innerHTML = `<div class="section-intro"><h2>Learn the ideas</h2><p>Read one step, predict what comes next, then reveal it. Open the word bank whenever a word is new.</p></div><div class="learn-toolbar"><div class="lesson-switch" role="group" aria-label="Choose a connected lesson">${lab.lessons.map((l, i) => `<button type="button" data-lesson="${i}" aria-pressed="${i === 0}"><span class="switch-number">Lesson ${lessonNumber(l.id)}</span><span class="switch-title">${esc(l.title)}</span></button>`).join('')}</div><div class="lang-switch" role="group" aria-label="Worked example language"><button type="button" class="quiet" data-lang="en" aria-pressed="${state.lang === 'en'}">English</button><button type="button" class="quiet" data-lang="es" aria-pressed="${state.lang === 'es'}" lang="es">Español</button></div></div><div class="learn-stage"></div><details class="vocab" ${state.level === 'support' ? 'open' : ''}><summary>Math word bank (${lab.vocabulary.length} words)</summary><dl>${lab.vocabulary.map((v) => `<div><dt>${esc(v.term)}</dt><dd>${esc(v.definition)}${v.example ? `<span class="vocab-example">Example: ${esc(v.example)}</span>` : ''}</dd></div>`).join('')}</dl></details>`;
  let current = 0;
  const render = () => {
    const lesson = lab.lessons[current], c = lesson.concept, es = state.lang === 'es';
    host.querySelectorAll('[data-lesson]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.lesson) === current)));
    host.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    const workedLines = es && c.worked.linesEs?.length ? c.worked.linesEs : c.worked.lines;
    const togetherLines = es && c.together?.linesEs?.length ? c.together.linesEs : c.together?.lines || [];
    state.steps[lesson.id] ||= 1; state.steps[`${lesson.id}-together`] ||= 1;
    const key = parseKeyIdea(c.keyIdea);
    const stage = host.querySelector('.learn-stage');
    stage.innerHTML = `<div class="lesson-meta"><span class="lesson-chip">Lesson ${lessonNumber(lesson.id)}</span>${lesson.standard ? `<span class="lesson-chip quiet-chip">Standard ${esc(lesson.standard)}</span>` : ''}</div><h3>${esc(c.heading)}</h3><p class="large-copy">${esc(c.intro)}</p>${key.points.length ? `<aside class="key-idea"><h4>Key idea${key.title ? `: ${esc(key.title)}` : ''}</h4><ol>${key.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></aside>` : ''}<div class="worked-example" ${es ? 'lang="es"' : ''}><h4>${esc(es ? c.worked.titleEs || c.worked.title : c.worked.title || 'Worked example')}</h4><div data-worked></div></div>${togetherLines.length ? `<div class="worked-example together" ${es ? 'lang="es"' : ''}><h4>${esc(es ? c.together.titleEs || c.together.title : c.together.title || 'Try it together')}</h4><p class="field-hint">${es ? 'Responde cada pregunta en papel antes de mostrar la siguiente.' : 'Answer each question on paper before revealing the next one.'}</p><div data-together></div></div>` : ''}<div class="objective-box"><h4>Lesson goal</h4><p>${esc(lesson.objective)}</p></div>${textArea(`learn-${lesson.id}`, 'Explain the idea in your own words', state.level === 'support' ? `Start with: "The main idea is ___ because ___." ${lesson.languageObjective}` : lesson.languageObjective)}<p><a href="/lessons/${lesson.id}/">Open the complete Lesson ${lessonNumber(lesson.id)}</a></p>`;
    const drawWorked = () => {
      const count = Math.min(workedLines.length, state.steps[lesson.id]);
      stepper(stage.querySelector('[data-worked]'), workedLines, count, {
        lang: state.lang,
        onReveal: () => { state.steps[lesson.id] = count + 1; save(); drawWorked(); stage.querySelector('[data-worked] [data-reveal], [data-worked] [data-all]').focus(); },
        onAll: () => { state.steps[lesson.id] = workedLines.length; save(); drawWorked(); stage.querySelector('[data-worked] .step-count').setAttribute('tabindex', '-1'); stage.querySelector('[data-worked] .step-count').focus(); },
      });
    };
    drawWorked();
    if (togetherLines.length) {
      const drawTogether = () => {
        const count = Math.min(togetherLines.length, state.steps[`${lesson.id}-together`]);
        stepper(stage.querySelector('[data-together]'), togetherLines, count, {
          label: 'question', lang: state.lang,
          onReveal: () => { state.steps[`${lesson.id}-together`] = count + 1; save(); drawTogether(); stage.querySelector('[data-together] [data-reveal], [data-together] [data-all]').focus(); },
          onAll: () => { state.steps[`${lesson.id}-together`] = togetherLines.length; save(); drawTogether(); },
        });
      };
      drawTogether();
    }
    bindNotes(stage);
  };
  host.querySelectorAll('[data-lesson]').forEach((b) => (b.onclick = () => { current = Number(b.dataset.lesson); render(); }));
  host.querySelectorAll('[data-lang]').forEach((b) => (b.onclick = () => { state.lang = b.dataset.lang; save(); render(); }));
  render();
}

export function investigate(ctx, host) {
  const { lab, state, save, textArea, bindNotes } = ctx;
  const tips = guidance(lab.model);
  const frames = {
    support: 'I predict ___. I changed ___ from ___ to ___. The model showed ___. This makes sense because ___.',
    core: 'Prediction → change → evidence from the readout → why it makes sense.',
    stretch: 'State your claim, give the evidence from the model, and explain the mathematics that makes it true in general.',
  };
  state.investigated ||= [];
  host.innerHTML = `<div class="section-intro"><h2>Investigate: ${esc(lab.title)}</h2><p>Predict, change one thing, and explain what happens. Type a number or use the arrow keys inside any control.</p></div><ol class="method-strip" aria-label="How to investigate"><li><strong>Predict</strong> what will change before you touch a control.</li><li><strong>Change one thing</strong> and read the picture and readout.</li><li><strong>Explain</strong> with evidence, then record it below.</li></ol><div class="watch-card"><p><strong>What the picture shows.</strong> ${esc(tips.show)}</p><p><strong>Try this first.</strong> ${esc(tips.tip)}</p></div><div id="investigation-model"></div><div class="investigation-prompts">${lab.investigate.map((p, i) => `<article class="${state.investigated.includes(i) ? 'is-done' : ''}" data-investigation="${i}"><div class="investigation-head"><h3>Investigation ${i + 1} of ${lab.investigate.length}</h3><label class="check-item done-check"><input type="checkbox" data-done="${i}" ${state.investigated.includes(i) ? 'checked' : ''}><span>Done</span></label></div><p class="question-prompt">${esc(p)}</p>${textArea(`investigate-${i}`, 'My prediction, test, and evidence', frames[state.level])}<button type="button" class="quiet small" data-capture="${i}">Add what the model shows now</button></article>`).join('')}</div>${state.level === 'stretch' ? '<div class="stretch-task"><h3>Push the idea further</h3><p>Find two different settings that produce the same result. Explain what the settings have in common, or show why that cannot happen when only one quantity changes.</p></div>' : ''}`;
  let latest = null;
  mountModel(host.querySelector('#investigation-model'), lab.model, {
    initial: state.models.investigate || lab.model.values,
    onChange: (values, result) => { latest = { values, result }; state.models.investigate = values; save(); },
    level: state.level,
  });
  bindNotes(host);
  host.querySelectorAll('[data-capture]').forEach((button) => (button.onclick = () => {
    const i = button.dataset.capture, area = host.querySelector(`#note-investigate-${i}`);
    if (!latest) return;
    const line = `Model: ${latest.result.equation}`;
    area.value = `${area.value.trim()}${area.value.trim() ? '\n' : ''}${line}\n`;
    area.dispatchEvent(new Event('input', { bubbles: true }));
    area.focus(); area.setSelectionRange(area.value.length, area.value.length);
  }));
  host.querySelectorAll('[data-done]').forEach((box) => (box.onchange = () => {
    const i = Number(box.dataset.done);
    state.investigated = box.checked ? [...new Set([...state.investigated, i])] : state.investigated.filter((n) => n !== i);
    box.closest('article').classList.toggle('is-done', box.checked); save(); ctx.refreshProgress();
  }));
}

export function practice(ctx, host) {
  const { lab, state, save } = ctx;
  const bank = lab.practice[state.level]; state.practiceIndex ||= {};
  const index = Math.min(state.practiceIndex[state.level] || 0, bank.length - 1), q = bank[index];
  const record = (state.practice[q.id] ||= { input: '', hints: 0, attempts: 0, correct: false, reviewed: false });
  const choices = q.type === 'choice' ? q.choices : q.type === 'repair' ? q.steps : null;
  const titles = { repair: 'Find the first step that needs repair', explain: 'Explain your thinking', number: 'Calculate and predict', choice: 'Choose and justify' };
  const summary = () => activityStatus(lab, state, 'practice');
  const s = summary();
  const nextLevel = state.level === 'support' ? 'core' : state.level === 'core' ? 'stretch' : null;
  host.innerHTML = `<div class="section-intro"><h2>${levels[state.level].label} practice</h2><p>${bank.length} activities from Lessons ${lab.lessons.map((l) => lessonNumber(l.id)).join(' and ')} and the lab model. Hints never cost progress. Written explanations are saved for a teacher or partner to review.</p></div><div class="practice-progress"><div class="progress-bar" role="progressbar" aria-label="Practice progress" aria-valuemin="0" aria-valuemax="${s.scored}" aria-valuenow="${s.solved}"><span style="width:${s.scored ? (100 * s.solved) / s.scored : 0}%"></span></div><p class="progress-text">${esc(s.summary)}</p></div>${s.status === 'done' ? `<div class="practice-complete"><strong>All ${levels[state.level].label} activities complete.</strong> ${nextLevel ? `Ready for more? Choose ${levels[nextLevel].label} from the level menu.` : 'Try the Create challenge or the games next.'}</div>` : ''}<div class="question-nav" role="group" aria-label="Choose practice activity">${bank.map((p, i) => { const r = state.practice[p.id]; const done = r?.correct || (p.type === 'explain' && r?.reviewed); const tried = r?.attempts > 0 && !done; return `<button type="button" data-question="${i}" class="${done ? 'is-done' : tried ? 'is-tried' : ''}" aria-pressed="${i === index}" aria-label="Activity ${i + 1}${done ? ', complete' : tried ? ', in progress' : ''}">${done ? '✓' : i + 1}</button>`; }).join('')}</div><form class="question"><div class="question-meta"><span class="lesson-chip">Activity ${index + 1} of ${bank.length}</span><span class="lesson-chip quiet-chip">${q.lesson ? `Lesson ${lessonNumber(q.lesson)}` : 'Lab model'}</span><span class="lesson-chip quiet-chip">${titles[q.type]}</span></div><p class="question-prompt">${esc(q.prompt)}</p>${q.parameters ? `<ul class="parameter-list">${q.parameters.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}${choices ? `<fieldset><legend>${q.type === 'repair' ? 'Select the first incorrect step.' : 'Choose one answer.'}</legend>${choices.map((choice, i) => `<label class="choice"><input type="radio" name="answer" value="${i}" ${String(record.input) === String(i) ? 'checked' : ''}><span>${q.type === 'repair' ? `<strong>Step ${i + 1}.</strong> ` : ''}${esc(choice)}</span></label>`).join('')}</fieldset>` : q.type === 'number' ? `<label class="number-answer">Your answer<input name="answer" type="text" inputmode="text" autocomplete="off" value="${esc(record.input)}"><span class="field-hint">Decimals, fractions (3/4), and mixed numbers (1 1/2) are accepted.</span></label>` : `<label class="writing">Your reasoning${q.frame ? `<span class="field-hint">${esc(q.frame)}</span>` : ''}<textarea name="answer" rows="5">${esc(record.input)}</textarea></label>`}<div class="actions"><button type="submit">${q.type === 'explain' ? 'Save and compare reasoning' : 'Check my answer'}</button><button type="button" class="quiet" data-hint></button><button type="button" class="quiet" data-explain ${record.attempts || record.reviewed ? '' : 'hidden'}>Study the explanation</button></div><div class="practice-feedback" role="status"></div><div class="hint-area" aria-live="polite"></div><div class="explanation" hidden></div></form><div class="practice-pagination"><button type="button" class="quiet" data-back ${index === 0 ? 'disabled' : ''}>Previous problem</button><button type="button" data-next ${index === bank.length - 1 ? 'disabled' : ''}>Next problem</button></div>`;
  const form = host.querySelector('form'), status = host.querySelector('.practice-feedback'), explanation = host.querySelector('.explanation');
  const explain = () => { explanation.hidden = false; explanation.innerHTML = `<h4>${q.type === 'explain' ? 'Compare your reasoning' : 'Why it works'}</h4><p>${esc(q.explanation)}</p>${q.type === 'explain' ? '<p>This is a model response, not an automatic grade. Does your response name the quantities, show evidence, and explain why the result makes sense?</p>' : ''}`; };
  const getInput = () => (choices ? (form.querySelector('input:checked')?.value ?? '') : form.elements.answer.value);
  form.addEventListener('input', () => { record.input = getInput(); save(); });
  const hints = q.hints?.length ? q.hints : ['Read the question again and identify what is known and what you need to find.', 'Try a worked example or the live model, then return to this problem.'];
  const hintButton = host.querySelector('[data-hint]');
  const drawHints = () => {
    host.querySelector('.hint-area').innerHTML = hints.slice(0, record.hints).map((h, i) => `<p><strong>Hint ${i + 1}:</strong> ${esc(h)}</p>`).join('');
    hintButton.textContent = record.hints >= hints.length ? 'All hints shown' : record.hints ? `Next hint (${record.hints} of ${hints.length} shown)` : `Get a hint (${hints.length} available)`;
    hintButton.disabled = record.hints >= hints.length;
  };
  hintButton.onclick = () => { record.hints = Math.min(hints.length, record.hints + 1); drawHints(); save(); };
  host.querySelector('[data-explain]').onclick = explain;
  const refresh = () => {
    const now = summary();
    host.querySelector('.progress-text').textContent = now.summary;
    const bar = host.querySelector('.progress-bar'); bar.setAttribute('aria-valuenow', now.solved); bar.firstElementChild.style.width = `${now.scored ? (100 * now.solved) / now.scored : 0}%`;
    ctx.refreshProgress();
  };
  form.onsubmit = (event) => {
    event.preventDefault(); record.input = getInput();
    if (!String(record.input).trim()) { status.className = 'practice-feedback'; status.textContent = 'Enter your response first. You can use a hint whenever you need one.'; return; }
    if (q.type === 'explain') { record.reviewed = true; status.className = 'practice-feedback saved'; status.textContent = 'Your writing is saved. Compare the reasoning below, then revise if needed.'; explain(); save(); host.querySelector(`[data-question="${index}"]`).textContent = '✓'; refresh(); return; }
    const number = q.type === 'number' ? numericAnswer(record.input) : Number(record.input);
    if (!Number.isFinite(number)) { status.className = 'practice-feedback'; status.textContent = 'Use a number, fraction, or mixed number. For example: 0.5, 1/2, or 2 1/2.'; return; }
    const ok = q.type === 'number' ? Math.abs(number - q.answer) <= q.tolerance : number === q.answer;
    record.attempts++; record.correct ||= ok; record.lastCorrect = ok;
    host.querySelector('[data-explain]').hidden = false;
    status.className = `practice-feedback ${ok ? 'correct' : 'retry'}`;
    status.textContent = ok ? 'That works. Read the explanation and check it against your strategy.' : q.feedback?.[number] || 'That response needs another look. Use a hint, check the quantities, and try again.';
    if (ok) explain(); save();
    const button = host.querySelector(`[data-question="${index}"]`);
    if (ok) { button.textContent = '✓'; button.className = 'is-done'; button.setAttribute('aria-label', `Activity ${index + 1}, complete`); }
    else if (!record.correct) { button.className = 'is-tried'; }
    refresh();
    if (ok && index < bank.length - 1) host.querySelector('[data-next]').focus();
  };
  const go = (i) => { state.practiceIndex[state.level] = i; save(); practice(ctx, host); host.querySelector('.question').scrollIntoView({ block: 'nearest' }); host.querySelector('.question-prompt').setAttribute('tabindex', '-1'); host.querySelector('.question-prompt').focus(); };
  host.querySelectorAll('[data-question]').forEach((b) => (b.onclick = () => go(Number(b.dataset.question))));
  host.querySelector('[data-back]').onclick = () => go(index - 1);
  host.querySelector('[data-next]').onclick = () => go(index + 1);
  if (record.correct) { status.className = 'practice-feedback saved'; status.textContent = 'You solved this item earlier. Try it again or study the explanation.'; }
  else if (q.type === 'explain' && record.reviewed) { status.className = 'practice-feedback saved'; status.textContent = 'Your writing is saved. You can revise it and save again.'; }
  drawHints();
}

export function create(ctx, host) {
  const { lab, state, save, textArea, bindNotes } = ctx;
  const criteria = ['I named and labeled the quantities and units.', 'I showed a representation or calculation someone else can follow.', 'I explained why the result makes sense and checked it.'];
  const starters = ['My design is', 'The quantities are', 'My model shows', 'I calculated', 'I checked by', 'This makes sense because'];
  const level = state.level;
  host.innerHTML = `<div class="section-intro"><h2>Create something worth explaining</h2><p class="large-copy">${esc(lab.create)}</p></div><div class="create-layout"><div><div class="starter-row" role="group" aria-label="Sentence starters"><span>Add a starter:</span>${starters.map((s) => `<button type="button" class="quiet small" data-starter="${esc(s)}">${esc(s)}…</button>`).join('')}</div><label class="writing" for="creation">My design and explanation<textarea id="creation" rows="12">${esc(state.created)}</textarea></label><p class="progress-text" data-words></p><p>Use paper for a drawing, then describe its labels and reasoning here. Include enough detail for someone else to reconstruct your idea.</p></div><aside class="review-card"><h3>Check your work</h3>${criteria.map((c, i) => `<label class="check-item"><input type="checkbox" data-criterion="${i}" ${state.checklist.includes(i) ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}<p class="share-status" data-share></p><h3>${level === 'support' ? 'A useful starting frame' : level === 'stretch' ? 'Stretch your explanation' : 'Partner check'}</h3><p>${level === 'support' ? 'My plan is ___. The quantities are ___. My model shows ___. I checked by ___.' : level === 'stretch' ? 'Create a second valid solution, or a convincing counterexample to an incorrect claim. Explain the condition that makes your argument work.' : 'Ask a partner to follow your reasoning without your help. Which step needs another label, example, or explanation?'}</p></aside></div>${textArea('revision', 'One thing I revised, or one question I still have')}<p>Use Download work or Print work to keep your design and reflections.</p>`;
  const area = host.querySelector('#creation');
  const refresh = () => {
    const s = activityStatus(lab, state, 'create');
    host.querySelector('[data-words]').textContent = s.words ? `${s.words} words${s.words < 40 ? ' · aim for at least 40 so a reader can follow every step' : ''}` : 'Nothing written yet.';
    host.querySelector('[data-share]').textContent = s.status === 'done' ? 'Ready to share: every check is complete and the explanation has enough detail.' : `${state.checklist.length} of 3 checks complete.`;
    host.querySelector('[data-share]').classList.toggle('is-ready', s.status === 'done');
    ctx.refreshProgress();
  };
  area.oninput = () => { state.created = area.value; save(); refresh(); };
  host.querySelectorAll('[data-starter]').forEach((b) => (b.onclick = () => {
    const text = area.value, starter = `${b.dataset.starter} `;
    area.value = text.trim() ? `${text.replace(/\s*$/, '')}\n${starter}` : starter;
    state.created = area.value; save(); refresh(); area.focus(); area.setSelectionRange(area.value.length, area.value.length);
  }));
  host.querySelectorAll('[data-criterion]').forEach((el) => (el.onchange = () => { state.checklist = [...host.querySelectorAll('[data-criterion]:checked')].map((c) => Number(c.dataset.criterion)); save(); refresh(); }));
  bindNotes(host); refresh();
}
