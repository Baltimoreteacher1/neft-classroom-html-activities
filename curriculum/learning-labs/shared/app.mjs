import { esc, mountModel } from './model.mjs';
import { numericAnswer } from './math.mjs';
import { mountGames } from './games.mjs';

const tabs = [['brief','Your mission'],['learn','Learn'],['investigate','Investigate'],['practice','Practice'],['create','Create'],['games','Games']];
const levels = { support: { label: 'Support', detail: 'More guidance, visible connections, and a place to build confidence.' }, core: { label: 'Core', detail: 'Grade-level practice with hints available whenever you need them.' }, stretch: { label: 'Stretch', detail: 'Explain, compare, and justify. Look for more than one way to solve a problem.' } };
const root = document.getElementById('lab-root');
let lab, state, storeKey, memoryOnly = false;
const fresh = () => ({ version: 1, level: 'core', tab: 'brief', practice: {}, notes: {}, steps: {}, games: {}, models: {}, created: '', checklist: [] });
function save() {
  try { localStorage.setItem(storeKey, JSON.stringify(state)); memoryOnly = false; }
  catch { memoryOnly = true; }
  const el = document.getElementById('save-status');
  if (el) el.textContent = memoryOnly ? 'Browser save unavailable. Download your work before leaving.' : 'Saved in this browser';
}
const writeNote = (key, value) => { state.notes[key] = value; save(); };
const textArea = (key, label, hint = '') => `<label class="writing" for="note-${esc(key)}">${esc(label)}${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}<textarea id="note-${esc(key)}" data-note="${esc(key)}" rows="3">${esc(state.notes[key] || '')}</textarea></label>`;
function bindNotes(host) { host.querySelectorAll('[data-note]').forEach(el => el.addEventListener('input', () => writeNote(el.dataset.note, el.value))); }
function lessonLinks() { return lab.lessons.map(l => `<a href="/lessons/${l.id}/">${l.id.replace('-', '.')}: ${esc(l.title)}</a>`).join(''); }

function shell() {
  document.documentElement.style.setProperty('--accent', lab.accent);
  root.innerHTML = `<div class="page-shell"><nav class="crumbs" aria-label="Breadcrumb"><a href="/curriculum/">Curriculum</a><a href="/curriculum/learning-labs/#unit-${lab.unit}">Learning labs</a><span>Unit ${lab.unit}</span></nav><header class="lab-header"><div class="lab-emblem" aria-hidden="true">${lab.icon}</div><div><p class="lesson-label">Lessons ${lab.lessons.map(l => l.id.replace('-', '.')).join(' & ')}</p><h1>${esc(lab.title)}</h1><p class="mission-lead">${esc(lab.mission)}</p></div></header><div class="toolbar"><label for="level">Choose your level<select id="level">${Object.entries(levels).map(([id, l]) => `<option value="${id}">${l.label}</option>`).join('')}</select></label><p id="level-detail">${levels[state.level].detail}</p><div class="save-tools"><span id="save-status" role="status"></span><div><button type="button" class="quiet" id="download">Download work</button><button type="button" class="quiet" id="print">Print work</button></div></div></div><nav class="tabs" role="tablist" aria-label="Lab activities">${tabs.map(([id, title]) => `<button type="button" id="tab-${id}" role="tab" aria-controls="panel-${id}" aria-selected="${state.tab === id}" tabindex="${state.tab === id ? 0 : -1}" data-tab="${id}">${title}</button>`).join('')}</nav><main id="workspace">${tabs.map(([id]) => `<section id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0" ${state.tab === id ? '' : 'hidden'}></section>`).join('')}</main><div class="bottom-nav"><button type="button" class="quiet" id="previous">Previous activity</button><p id="activity-position"></p><button type="button" id="next">Next activity</button></div><footer><p>Progress is local to this browser and device. No name or account needed.</p><details><summary>Connected lessons and teaching notes</summary><div class="lesson-links">${lessonLinks()}</div><p>Suggested timing: Learn 8–12 min; Investigate 8–10 min; Practice 10–15 min; Create 5–10 min; Games 5–10 min. Split across two sessions when useful. Levels are choices, not labels for students.</p><p>${esc(lab.source)}</p><button type="button" class="quiet" id="reset">Start fresh</button><span id="reset-area"></span></details></footer><section id="print-report" class="print-only"></section></div>`;
  document.getElementById('level').value = state.level;
  document.getElementById('level').addEventListener('change', event => { state.level = event.target.value; document.getElementById('level-detail').textContent = levels[state.level].detail; save(); showTab(state.tab); });
  root.querySelectorAll('[data-tab]').forEach(button => {
    button.onclick = () => showTab(button.dataset.tab);
    button.onkeydown = event => {
      let i = tabs.findIndex(([id]) => id === button.dataset.tab);
      if (event.key === 'ArrowRight') i = (i + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') i = (i + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') i = 0;
      else if (event.key === 'End') i = tabs.length - 1;
      else return;
      event.preventDefault(); showTab(tabs[i][0]); document.getElementById(`tab-${tabs[i][0]}`).focus();
    };
  });
  document.getElementById('previous').onclick = () => move(-1);
  document.getElementById('next').onclick = () => move(1);
  document.getElementById('download').onclick = download;
  document.getElementById('print').onclick = () => { makeReport(); window.print(); };
  document.getElementById('reset').onclick = () => {
    const area = document.getElementById('reset-area');
    area.innerHTML = '<p>Clear only this lab’s saved work on this device?</p><button type="button" id="confirm-reset">Yes, clear this lab</button> <button type="button" class="quiet" id="cancel-reset">Keep my work</button>';
    document.getElementById('confirm-reset').onclick = () => { state = fresh(); save(); shell(); };
    document.getElementById('cancel-reset').onclick = () => { area.innerHTML = ''; document.getElementById('reset').focus(); };
    document.getElementById('confirm-reset').focus();
  };
  showTab(state.tab); save();
}
function move(direction) {
  const i = tabs.findIndex(([id]) => id === state.tab), next = tabs[i + direction];
  if (next) { showTab(next[0]); document.getElementById(`panel-${next[0]}`).focus(); document.getElementById('workspace').scrollIntoView({ block: 'start', behavior: 'instant' }); }
}
function showTab(id) {
  if (!tabs.some(t => t[0] === id)) id = 'brief';
  state.tab = id;
  root.querySelectorAll('[role="tabpanel"]').forEach(panel => { panel.hidden = panel.id !== `panel-${id}`; });
  root.querySelectorAll('[data-tab]').forEach(button => { const selected = button.dataset.tab === id; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
  const host = document.getElementById(`panel-${id}`);
  ({ brief, learn, investigate, practice, create, games })[id](host);
  const i = tabs.findIndex(t => t[0] === id);
  document.getElementById('previous').disabled = i === 0;
  document.getElementById('next').disabled = i === tabs.length - 1;
  document.getElementById('activity-position').textContent = `${i + 1} of ${tabs.length} activities`;
  save();
}
function brief(host) {
  host.innerHTML = `<div class="brief-layout"><div><h2>Your mission</h2><p class="large-copy">${esc(lab.mission)}</p><h3>What you will be able to do</h3><ul class="objectives">${lab.lessons.map(l => `<li>${esc(l.objective)}</li>`).join('')}</ul><div class="ready-note"><h3>Before you begin</h3><p>Have paper and a pencil nearby. Use the model to test an idea, but write down a prediction before changing it. Mistakes are a reason to investigate.</p><p>Every tab is available. If you get stuck, choose Support, open a hint, or return to a worked example.</p></div></div><aside class="route-card"><h3>Your route through the lab</h3><ol><li>Learn with worked examples.</li><li>Investigate a live mathematical model.</li><li>Practice and use feedback.</li><li>Create something and explain it.</li><li>Finish with ${esc(lab.finale)} and Connection Quest.</li></ol><button type="button" data-start>Start with Learn</button></aside></div>${textArea('prediction', 'What do you already know that might help?', 'A word, sketch description, example, or question is a useful start.')}`;
  host.querySelector('[data-start]').onclick = () => showTab('learn'); bindNotes(host);
}
function learn(host) {
  host.innerHTML = `<h2>Learn the ideas</h2><p>Read one step, predict what comes next, then reveal it. Use the vocabulary whenever a word is unfamiliar.</p><div class="lesson-switch" role="group" aria-label="Choose a connected lesson">${lab.lessons.map((l,i) => `<button type="button" data-lesson="${i}" aria-pressed="${i === 0}">${l.id.replace('-','.')} · ${esc(l.title)}</button>`).join('')}</div><div class="learn-stage"></div><details class="vocab"><summary>Math word bank (${lab.vocabulary.length} words)</summary><dl>${lab.vocabulary.map(v => `<div><dt>${esc(v.term)}</dt><dd>${esc(v.definition)}${v.example ? `<span class="vocab-example">${esc(v.example)}</span>` : ''}</dd></div>`).join('')}</dl></details>`;
  const render = (i) => {
    const lesson = lab.lessons[i], c = lesson.concept;
    host.querySelectorAll('[data-lesson]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.lesson) === i)));
    state.steps[lesson.id] ||= 1;
    const lines = c.worked.lines, count = Math.min(lines.length, state.steps[lesson.id]);
    const stage = host.querySelector('.learn-stage');
    stage.innerHTML = `<h3>${esc(c.heading)}</h3><p class="large-copy">${esc(c.intro)}</p><div class="worked-example"><h4>${esc(c.worked.title || 'Worked example')}</h4><ol>${lines.slice(0,count).map(line => `<li>${esc(line)}</li>`).join('')}</ol><p>Step ${count} of ${lines.length}</p><button type="button" data-reveal ${count === lines.length ? 'disabled' : ''}>Reveal next step</button><button type="button" class="quiet" data-all>Show all steps</button></div>${c.together?.lines?.length ? `<details class="together"><summary>Try a second worked example</summary><h4>${esc(c.together.title)}</h4><ol>${c.together.lines.map(line => `<li>${esc(line)}</li>`).join('')}</ol></details>` : ''}${textArea(`learn-${lesson.id}`, 'Explain the idea in your own words', lesson.languageObjective)}<p><a href="/lessons/${lesson.id}/">Open the complete connected lesson</a></p>`;
    stage.querySelector('[data-reveal]').onclick = () => { state.steps[lesson.id] = count + 1; save(); render(i); stage.querySelector('[data-reveal]').focus(); };
    stage.querySelector('[data-all]').onclick = () => { state.steps[lesson.id] = lines.length; save(); render(i); stage.querySelector('[data-all]').focus(); };
    bindNotes(stage);
  };
  host.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => render(Number(b.dataset.lesson)));
  render(0);
}
function investigate(host) {
  host.innerHTML = `<div class="section-intro"><h2>Investigate: ${esc(lab.title)}</h2><p>Predict, change one thing, and explain what happens. Use the controls with your keyboard or tap the number to edit it.</p></div><div id="investigation-model"></div><div class="investigation-prompts">${lab.investigate.map((p, i) => `<article><h3>Investigation ${i + 1}</h3><p>${esc(p)}</p>${textArea(`investigate-${i}`, 'My prediction, test, and evidence', state.level === 'support' ? 'I predict ___. I changed ___. The model showed ___. This makes sense because ___.' : '')}</article>`).join('')}</div>${state.level === 'stretch' ? '<div class="stretch-task"><h3>Push the idea further</h3><p>Find two different settings that produce the same result. Explain what the settings have in common, or show why that cannot happen when only one quantity changes.</p></div>' : ''}`;
  mountModel(host.querySelector('#investigation-model'), lab.model, { initial: state.models.investigate || lab.model.values, onChange: values => { state.models.investigate = values; save(); }, level: state.level }); bindNotes(host);
}
function practice(host) {
  const bank = lab.practice[state.level]; state.practiceIndex ||= {}; const index = Math.min(state.practiceIndex[state.level] || 0, bank.length - 1), q = bank[index];
  const record = state.practice[q.id] ||= { input: '', hints: 0, attempts: 0, correct: false, reviewed: false };
  const scored = bank.filter(p => p.type !== 'explain'), correct = scored.filter(p => state.practice[p.id]?.correct).length;
  const choices = q.type === 'choice' ? q.choices : q.type === 'repair' ? q.steps : null;
  host.innerHTML = `<div class="section-intro"><h2>${levels[state.level].label} practice</h2><p>${correct} of ${scored.length} checked items solved. Written explanations are saved for review.</p></div><div class="question-nav" role="group" aria-label="Choose practice activity">${bank.map((p,i) => `<button type="button" data-question="${i}" aria-pressed="${i === index}" aria-label="Activity ${i+1}${state.practice[p.id]?.correct ? ', solved' : ''}">${state.practice[p.id]?.correct ? '✓' : i + 1}</button>`).join('')}</div><form class="question"><p class="lesson-label">Activity ${index + 1} of ${bank.length}${q.lesson ? ` · Lesson ${q.lesson.replace('-','.')}` : ' · Lab model'}</p><h3>${q.type === 'repair' ? 'Find the first step that needs repair' : q.type === 'explain' ? 'Explain your thinking' : q.type === 'number' ? 'Make a prediction' : 'Choose and justify'}</h3><p class="question-prompt">${esc(q.prompt)}</p>${q.parameters ? `<ul class="parameter-list">${q.parameters.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>` : ''}${choices ? `<fieldset><legend>${q.type === 'repair' ? 'Select the first incorrect step.' : 'Choose one answer.'}</legend>${choices.map((choice,i)=>`<label class="choice"><input type="radio" name="answer" value="${i}" ${String(record.input) === String(i) ? 'checked' : ''}><span>${esc(choice)}</span></label>`).join('')}</fieldset>` : q.type === 'number' ? `<label class="number-answer">Your answer<input name="answer" type="text" inputmode="text" autocomplete="off" value="${esc(record.input)}"><span class="field-hint">Decimals, fractions (3/4), and mixed numbers (1 1/2) are accepted.</span></label>` : `<label class="writing">Your reasoning${q.frame ? `<span class="field-hint">${esc(q.frame)}</span>` : ''}<textarea name="answer" rows="5">${esc(record.input)}</textarea></label>`}<div class="actions"><button type="submit">${q.type === 'explain' ? 'Save and compare reasoning' : 'Check my answer'}</button><button type="button" class="quiet" data-hint>Get a hint</button><button type="button" class="quiet" data-explain ${record.attempts || record.reviewed ? '' : 'hidden'}>Study the explanation</button></div><div class="practice-feedback" role="status"></div><div class="hint-area"></div><div class="explanation" hidden></div></form><div class="practice-pagination"><button type="button" class="quiet" data-back ${index === 0 ? 'disabled' : ''}>Previous problem</button><button type="button" data-next ${index === bank.length - 1 ? 'disabled' : ''}>Next problem</button></div>`;
  const form = host.querySelector('form'), status = host.querySelector('.practice-feedback'), explanation = host.querySelector('.explanation');
  const explain = () => { explanation.hidden = false; explanation.innerHTML = `<h4>${q.type === 'explain' ? 'Compare your reasoning' : 'Why it works'}</h4><p>${esc(q.explanation)}</p>${q.type === 'explain' ? '<p>This is a model or review guide, not an automatic grade. Does your response name the quantities, show evidence, and explain why the result makes sense?</p>' : ''}`; };
  const getInput = () => choices ? form.querySelector('input:checked')?.value ?? '' : form.elements.answer.value;
  form.addEventListener('input', () => { record.input = getInput(); save(); });
  const hints = q.hints?.length ? q.hints : ['Read the question again and identify what is known and what you need to find.', 'Try a worked example or the live model, then return to this problem.'];
  const drawHints = () => { host.querySelector('.hint-area').innerHTML = hints.slice(0,record.hints).map((h,i)=>`<p><strong>Hint ${i+1}:</strong> ${esc(h)}</p>`).join(''); };
  host.querySelector('[data-hint]').onclick = () => { record.hints = Math.min(hints.length, record.hints + 1); drawHints(); save(); };
  host.querySelector('[data-explain]').onclick = explain;
  form.onsubmit = event => {
    event.preventDefault(); record.input = getInput();
    if (!String(record.input).trim()) { status.textContent = 'Enter your response first. You can use a hint whenever you need one.'; return; }
    if (q.type === 'explain') { record.reviewed = true; status.textContent = 'Your writing is saved. Compare the reasoning below, then revise if needed.'; explain(); save(); return; }
    const number = q.type === 'number' ? numericAnswer(record.input) : Number(record.input);
    if (!Number.isFinite(number)) { status.textContent = 'Use a number, fraction, or mixed number. For example: 0.5, 1/2, or 2 1/2.'; return; }
    const ok = q.type === 'number' ? Math.abs(number - q.answer) <= q.tolerance : number === q.answer;
    record.attempts++; record.correct ||= ok; record.lastCorrect = ok;
    host.querySelector('[data-explain]').hidden = false;
    status.className = `practice-feedback ${ok ? 'correct' : 'retry'}`;
    status.textContent = ok ? 'That works. Read the explanation and check it against your strategy.' : q.feedback?.[number] || 'That response needs another look. Use a hint, check the quantities, and try again.';
    if (ok) explain(); save();
    const button = host.querySelector(`[data-question="${index}"]`);
    if (ok) { button.textContent = '✓'; button.setAttribute('aria-label', `Activity ${index + 1}, solved`); }
    host.querySelector('.section-intro p').textContent = `${scored.filter(p => state.practice[p.id]?.correct).length} of ${scored.length} checked items solved. Written explanations are saved for review.`;
  };
  const go = i => { state.practiceIndex[state.level] = i; save(); practice(host); host.querySelector('.question').scrollIntoView({block:'nearest'}); host.querySelector('.question-prompt').setAttribute('tabindex','-1'); host.querySelector('.question-prompt').focus(); };
  host.querySelectorAll('[data-question]').forEach(b => b.onclick = () => go(Number(b.dataset.question)));
  host.querySelector('[data-back]').onclick = () => go(index - 1);
  host.querySelector('[data-next]').onclick = () => go(index + 1);
  if (record.correct) { status.textContent = 'You solved this item earlier. Try it again or study the explanation.'; }
  drawHints();
}
function create(host) {
  const criteria = ['I named and labeled the quantities and units.', 'I showed a representation or calculation someone else can follow.', 'I explained why the result makes sense and checked it.'];
  host.innerHTML = `<h2>Create something worth explaining</h2><p class="large-copy">${esc(lab.create)}</p><div class="create-layout"><div><label class="writing" for="creation">My design and explanation<textarea id="creation" rows="12">${esc(state.created)}</textarea></label><p>Use paper for a drawing, then describe its labels and reasoning here. Include enough detail for someone else to reconstruct your idea.</p></div><aside class="review-card"><h3>Check your work</h3>${criteria.map((c,i)=>`<label class="check-item"><input type="checkbox" data-criterion="${i}" ${state.checklist.includes(i) ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}<h3>${state.level === 'support' ? 'A useful starting frame' : state.level === 'stretch' ? 'Stretch your explanation' : 'Partner check'}</h3><p>${state.level === 'support' ? 'My plan is ___. The quantities are ___. My model shows ___. I checked by ___.' : state.level === 'stretch' ? 'Create a second valid solution, or a convincing counterexample to an incorrect claim. Explain the condition that makes your argument work.' : 'Ask a partner to follow your reasoning without your help. Which step needs another label, example, or explanation?'}</p></aside></div>${textArea('revision', 'One thing I revised, or one question I still have')}<p>Use Download work or Print work to keep your design and reflections.</p>`;
  host.querySelector('#creation').oninput = event => { state.created = event.target.value; save(); };
  host.querySelectorAll('[data-criterion]').forEach(el => el.onchange = () => { state.checklist = [...host.querySelectorAll('[data-criterion]:checked')].map(c => Number(c.dataset.criterion)); save(); }); bindNotes(host);
}
function games(host) { host.innerHTML = `<h2>Finish with a game</h2><p>Use the same mathematics in two different ways: construct a solution, then connect ideas. Neither game uses a countdown.</p><div class="games-root"></div>`; mountGames(host.querySelector('.games-root'), lab, state, save, state.level); }
function reportText() {
  const lines = [lab.title, `Lessons: ${lab.lessons.map(l=>l.id).join(', ')}`, `Level: ${levels[state.level].label}`, '', 'My creation', state.created || '(No creation recorded)', '', 'Notes'];
  for (const [key, value] of Object.entries(state.notes)) if (value) lines.push(`${key}: ${value}`);
  lines.push('', 'Practice responses');
  for (const [id, response] of Object.entries(state.practice)) if (String(response.input).trim()) {
    const q = Object.values(lab.practice).flat().find(q=>q.id===id);
    const answer = q?.type === 'choice' ? q.choices[Number(response.input)] : q?.type === 'repair' ? q.steps[Number(response.input)] : response.input;
    lines.push(q?.prompt || id, String(answer), q?.type === 'explain' ? 'Written response: review needed' : response.correct ? 'Solved at least once' : 'Still practicing', '');
  }
  lines.push('Games', ...Object.entries(state.games).map(([level,g]) => `${levels[level]?.label || level}: ${g.rounds || 0}/3 construction puzzles; ${g.matches?.length || 0} connections.`));
  return lines.join('\n');
}
function download() {
  const blob = new Blob([reportText()], {type:'text/plain;charset=utf-8'}), url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `${lab.id}-my-work.txt`; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function makeReport() { document.getElementById('print-report').innerHTML = `<h1>${esc(lab.title)}</h1><pre>${esc(reportText())}</pre>`; }

try {
  const id = root.dataset.lab;
  const response = await fetch(`./content.json`); if (!response.ok) throw new Error(`Content unavailable (${response.status})`);
  lab = await response.json(); storeKey = `eduwonderlab:learning-lab:v1:${id}`;
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch { memoryOnly = true; }
  state = stored?.version === 1 ? { ...fresh(), ...stored } : fresh();
  if (!levels[state.level]) state.level = 'core';
  if (!tabs.some(t=>t[0]===state.tab)) state.tab = 'brief';
  for (const key of ['practice','notes','steps','games','models']) if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
  if (!Array.isArray(state.checklist)) state.checklist = [];
  const hash = location.hash.slice(1); if (tabs.some(t=>t[0]===hash)) state.tab = hash;
  shell(); window.addEventListener('beforeprint', makeReport);
} catch (error) {
  root.innerHTML = `<main class="load-error"><h1>This lab could not finish loading</h1><p>Your saved work has not been cleared. Check your connection, then reload.</p><button type="button" id="reload">Reload lab</button><p><a href="/curriculum/learning-labs/">Return to learning labs</a></p></main>`;
  document.getElementById('reload').onclick = () => location.reload(); console.error(error);
}
