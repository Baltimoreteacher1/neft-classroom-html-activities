import { esc } from './model.mjs';
import { mountGames } from './games.mjs';
import { create, investigate, learn, practice } from './activities.mjs';
import { levels, noteLabels, overview, tabs, timing } from './progress.mjs';

const root = document.getElementById('lab-root');
let lab, state, storeKey, memoryOnly = false;
const fresh = () => ({ version: 1, level: 'core', tab: 'brief', practice: {}, notes: {}, steps: {}, games: {}, models: {}, created: '', checklist: [], investigated: [], lang: 'en' });
function save() {
  try { localStorage.setItem(storeKey, JSON.stringify(state)); memoryOnly = false; }
  catch { memoryOnly = true; }
  const el = document.getElementById('save-status');
  if (el) el.textContent = memoryOnly ? 'Browser save unavailable. Download your work before leaving.' : 'Saved in this browser';
}
const writeNote = (key, value) => { state.notes[key] = value; save(); refreshProgress(); };
const textArea = (key, label, hint = '') => `<label class="writing" for="note-${esc(key)}">${esc(label)}${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}<textarea id="note-${esc(key)}" data-note="${esc(key)}" rows="3">${esc(state.notes[key] || '')}</textarea></label>`;
function bindNotes(host) { host.querySelectorAll('[data-note]').forEach((el) => el.addEventListener('input', () => writeNote(el.dataset.note, el.value))); }
const lessonNumber = (id) => id.replace('-', '.');
const ctx = { get lab() { return lab; }, get state() { return state; }, save, textArea, bindNotes, refreshProgress, showTab };

const statusIcon = { done: '✓', started: '•', new: '' };
const statusWord = { done: 'complete', started: 'in progress', new: 'not started' };
function refreshProgress() {
  const o = overview(lab, state);
  for (const item of o.items) {
    const button = document.getElementById(`tab-${item.id}`);
    if (!button) continue;
    button.dataset.status = item.status;
    button.querySelector('.tab-mark').textContent = statusIcon[item.status];
    button.setAttribute('aria-label', `${item.title}, ${statusWord[item.status]}`);
  }
  const summary = document.getElementById('progress-summary');
  if (summary) summary.textContent = `${o.done} of ${o.total} activities complete`;
  const route = document.querySelector('.route-list');
  if (route) route.querySelectorAll('li').forEach((li, i) => { const item = o.items[i]; li.dataset.status = item.status; li.querySelector('.route-status').textContent = item.summary; });
}

function shell() {
  document.documentElement.style.setProperty('--accent', lab.accent);
  root.innerHTML = `<div class="page-shell"><nav class="crumbs" aria-label="Breadcrumb"><a href="/curriculum/">Curriculum</a><a href="/curriculum/learning-labs/#unit-${lab.unit}">Learning labs</a><span>Unit ${lab.unit}: ${esc(lab.unitName)}</span></nav><header class="lab-header"><div class="lab-emblem" aria-hidden="true">${lab.icon}</div><div><p class="lesson-label">Unit ${lab.unit} · Lessons ${lab.lessons.map((l) => lessonNumber(l.id)).join(' & ')}</p><h1>${esc(lab.title)}</h1><p class="mission-lead">${esc(lab.mission)}</p><ul class="lesson-chips" aria-label="Connected lessons">${lab.lessons.map((l) => `<li><a class="lesson-chip" href="/lessons/${l.id}/">${lessonNumber(l.id)} ${esc(l.title)}</a></li>`).join('')}<li><span class="lesson-chip quiet-chip">About 45 minutes</span></li></ul></div></header><div class="toolbar"><label for="level">Choose your level<select id="level">${Object.entries(levels).map(([id, l]) => `<option value="${id}">${l.label}</option>`).join('')}</select></label><p id="level-detail">${levels[state.level].detail}</p><div class="save-tools"><span id="progress-summary" class="progress-pill"></span><span id="save-status" role="status"></span><div><button type="button" class="quiet" id="download">Download work</button><button type="button" class="quiet" id="print">Print work</button></div></div></div><nav class="tabs" role="tablist" aria-label="Lab activities">${tabs.map(([id, title], i) => `<button type="button" id="tab-${id}" role="tab" aria-controls="panel-${id}" aria-selected="${state.tab === id}" tabindex="${state.tab === id ? 0 : -1}" data-tab="${id}"><span class="tab-step">${i + 1}</span><span class="tab-title">${title}</span><span class="tab-mark" aria-hidden="true"></span></button>`).join('')}</nav><main id="workspace">${tabs.map(([id]) => `<section id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0" ${state.tab === id ? '' : 'hidden'}></section>`).join('')}</main><div class="bottom-nav"><button type="button" class="quiet" id="previous">Previous activity</button><p id="activity-position"></p><button type="button" id="next">Next activity</button></div><footer><p>Progress is saved in this browser on this device. No name or account is needed. Use Download work to keep a copy.</p><details><summary>For teachers: connected lessons and timing</summary><div class="lesson-links">${lab.lessons.map((l) => `<a href="/lessons/${l.id}/">${lessonNumber(l.id)}: ${esc(l.title)}${l.standard ? ` (${esc(l.standard)})` : ''}</a>`).join('')}</div><p>Suggested timing: ${tabs.map(([id, title]) => `${title} ${timing[id]}`).join('; ')}. Split across two sessions when useful. Levels are choices students make, not labels.</p><p>${esc(lab.source)}</p><button type="button" class="quiet" id="reset">Start fresh</button><span id="reset-area"></span></details></footer><section id="print-report" class="print-only"></section></div>`;
  document.getElementById('level').value = state.level;
  document.getElementById('level').addEventListener('change', (event) => { state.level = event.target.value; document.getElementById('level-detail').textContent = levels[state.level].detail; save(); showTab(state.tab); });
  root.querySelectorAll('[data-tab]').forEach((button) => {
    button.onclick = () => showTab(button.dataset.tab);
    button.onkeydown = (event) => {
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
  if (!tabs.some((t) => t[0] === id)) id = 'brief';
  state.tab = id;
  root.querySelectorAll('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel.id !== `panel-${id}`; });
  root.querySelectorAll('[data-tab]').forEach((button) => { const selected = button.dataset.tab === id; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
  const host = document.getElementById(`panel-${id}`);
  if (id === 'brief') brief(host); else if (id === 'games') games(host); else ({ learn, investigate, practice, create })[id](ctx, host);
  const i = tabs.findIndex((t) => t[0] === id);
  document.getElementById('previous').disabled = i === 0;
  document.getElementById('next').disabled = i === tabs.length - 1;
  document.getElementById('activity-position').textContent = `Activity ${i + 1} of ${tabs.length}: ${tabs[i][1]}`;
  save(); refreshProgress();
}
function brief(host) {
  const o = overview(lab, state), started = o.done > 0 || o.items.some((i) => i.status === 'started');
  host.innerHTML = `<div class="brief-layout"><div><h2>Your mission</h2><p class="large-copy">${esc(lab.mission)}</p><h3>What you will be able to do</h3><ul class="objectives">${lab.lessons.map((l) => `<li><strong>Lesson ${lessonNumber(l.id)}.</strong> ${esc(l.objective)}</li>`).join('')}</ul><div class="ready-note"><h3>Before you begin</h3><p>Have paper and a pencil nearby. Use the model to test an idea, but write down a prediction before changing it. Mistakes are a reason to investigate.</p><p>Every activity is open. If you get stuck, choose Support, open a hint, or return to a worked example.</p></div></div><aside class="route-card"><h3>${started ? 'Your progress' : 'Your route through the lab'}</h3><ol class="route-list">${o.items.map((item) => `<li data-status="${item.status}"><span class="route-title">${item.title}<span class="route-time">${timing[item.id]}</span></span><span class="route-status">${esc(item.summary)}</span></li>`).join('')}</ol><button type="button" data-start>${started && o.next !== 'brief' ? `Continue with ${tabs.find((t) => t[0] === o.next)[1]}` : 'Start with Learn'}</button></aside></div>${textArea('prediction', 'What do you already know that might help?', 'A word, sketch description, example, or question is a useful start.')}`;
  host.querySelector('[data-start]').onclick = () => showTab(started && o.next !== 'brief' ? o.next : 'learn'); bindNotes(host);
}
function games(host) {
  host.innerHTML = `<div class="section-intro"><h2>Finish with a game</h2><p>Use the same mathematics in two different ways: construct a solution, then connect ideas. Neither game uses a countdown, and retries never cost progress.</p></div><details class="how-to-play"><summary>How to play</summary><ol><li>Choose a level, then select ${esc(lab.finale)} or Connection Quest.</li><li>In ${esc(lab.finale)}, read the goal, change the unlocked control, and submit your solution. The readout shows your current value next to the goal.</li><li>In Connection Quest, match each term with its meaning. Arrow keys move between cards; Enter selects. Completed puzzles and pairs are saved on this device.</li></ol></details><div class="games-root"></div>`;
  mountGames(host.querySelector('.games-root'), lab, state, () => { save(); refreshProgress(); }, state.level);
}
function reportText() {
  const labels = noteLabels(lab), o = overview(lab, state);
  const lines = [lab.title, `Unit ${lab.unit} · Lessons: ${lab.lessons.map((l) => lessonNumber(l.id)).join(', ')}`, `Level: ${levels[state.level].label}`, `Progress: ${o.done} of ${o.total} activities complete`, ...o.items.map((i) => `  ${i.title}: ${i.summary}`), '', 'MY CREATION', state.created || '(No creation recorded)', '', 'NOTES'];
  for (const [key, value] of Object.entries(state.notes)) if (value) lines.push(labels[key] || key, value, '');
  lines.push('PRACTICE RESPONSES');
  for (const [id, response] of Object.entries(state.practice)) if (String(response.input).trim()) {
    const q = Object.values(lab.practice).flat().find((item) => item.id === id);
    const answer = q?.type === 'choice' ? q.choices[Number(response.input)] : q?.type === 'repair' ? q.steps[Number(response.input)] : response.input;
    lines.push(q?.prompt || id, `Response: ${answer}`, q?.type === 'explain' ? 'Written response: review needed' : response.correct ? 'Solved at least once' : 'Still practicing', '');
  }
  lines.push('GAMES', ...Object.entries(state.games).map(([level, g]) => `${levels[level]?.label || level}: ${Math.min(3, g.rounds || 0)}/3 construction puzzles; ${g.matches?.length || 0} connections.`));
  return lines.join('\n');
}
function download() {
  const blob = new Blob([reportText()], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `${lab.id}-my-work.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function makeReport() { document.getElementById('print-report').innerHTML = `<h1>${esc(lab.title)}</h1><pre>${esc(reportText())}</pre>`; }

try {
  const id = root.dataset.lab;
  const response = await fetch('./content.json'); if (!response.ok) throw new Error(`Content unavailable (${response.status})`);
  lab = await response.json(); storeKey = `eduwonderlab:learning-lab:v1:${id}`;
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch { memoryOnly = true; }
  state = stored?.version === 1 ? { ...fresh(), ...stored } : fresh();
  if (!levels[state.level]) state.level = 'core';
  if (!tabs.some((t) => t[0] === state.tab)) state.tab = 'brief';
  for (const key of ['practice', 'notes', 'steps', 'games', 'models']) if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
  for (const key of ['checklist', 'investigated']) if (!Array.isArray(state[key])) state[key] = [];
  if (!['en', 'es'].includes(state.lang)) state.lang = 'en';
  const hash = location.hash.slice(1); if (tabs.some((t) => t[0] === hash)) state.tab = hash;
  shell(); window.addEventListener('beforeprint', makeReport);
} catch (error) {
  root.innerHTML = `<main class="load-error"><h1>This lab could not finish loading</h1><p>Your saved work has not been cleared. Check your connection, then reload.</p><button type="button" id="reload">Reload lab</button><p><a href="/curriculum/learning-labs/">Return to learning labs</a></p></main>`;
  document.getElementById('reload').onclick = () => location.reload(); console.error(error);
}
