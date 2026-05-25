(() => {
  'use strict';

  const STORAGE_KEY = 'neftos.commandCenter.v1';
  const DEFAULT_STREAMS = [
    { id: 'ready', name: 'Ready Lesson Plans', mode: 'school' },
    { id: 'notebooks', name: 'Student Notebooks', mode: 'school' },
    { id: 'pd', name: 'PD + Teacher Resources', mode: 'school' },
    { id: 'apps', name: 'HTML Apps + Data Studio', mode: 'technical' },
    { id: 'deploy', name: 'GitHub / Cloudflare', mode: 'technical' },
    { id: 'noam', name: 'Noam / Family Learning', mode: 'personal' },
    { id: 'life', name: 'Personal Admin', mode: 'personal' }
  ];

  const WORKFLOWS = [
    {
      id: 'ready-lp',
      tag: 'Lesson Plan',
      title: 'Ready + Date Lesson Plan',
      description: 'Runs your locked Ready lesson-plan workflow with source fidelity and the EduWonderLab QA Harness.',
      placeholder: 'Paste date, lesson title, source file, and any must-keep constraints.',
      template: context => `Ready ${context || '[DATE]'}\n\nUse the uploaded/source lesson as the source of truth. Apply the full EduWonderLab Ready Lesson Plan workflow and QA Harness: extract source fingerprint, map lesson flow, build teacher-ready plan, audit for standards/objectives/task alignment, repair issues, and output the final polished lesson plan. Objectives must use student-friendly “I can…” language.`
    },
    {
      id: 'student-notebook',
      tag: 'Notebook',
      title: 'Student Notebook BOTH',
      description: 'Builds both Session 1 and Session 2 notebooks in the locked PPTX-native benchmark style.',
      placeholder: 'Paste lesson deck name/date and any session constraints.',
      template: context => `Student Notebook BOTH ${context || '[SOURCE / DATE]'}\n\nUse the uploaded lesson slides as source of truth. Generate two complete PPTX-native editable student notebooks, Session 1 and Session 2. Preserve source problems and lesson sequence. Include objective slide, vocabulary with visual column, dedicated Be Curious / Notice-Wonder slide, guided notes, practice/workspaces, reflection, exit ticket, and simple ESOL/SPED supports only where instructional. Run final content-accuracy and visual-polish QA before export.`
    },
    {
      id: 'html-upgrade',
      tag: 'HTML App',
      title: 'Gold-Standard HTML Upgrade',
      description: 'Turns a classroom HTML tool into an accessible, engaging, deployable version without breaking working parts.',
      placeholder: 'Paste app name, broken areas, must-keep features, and target student/teacher audience.',
      template: context => `Upgrade this HTML app to a gold-standard deployable version: ${context || '[APP DETAILS]'}\n\nPreserve all working features. Do not remove content the user liked. Improve accessibility, navigation, responsiveness, clarity, student engagement, local-first behavior, and code organization. Add only features that improve understanding or usability. Before output, run a senior engineering/design/content audit and repair issues. Output the final complete HTML/CSS/JS package without truncation.`
    },
    {
      id: 'apps-script-audit',
      tag: 'Apps Script',
      title: 'Apps Script Preflight Audit',
      description: 'Checks Google Apps Script for platform correctness before paste/run.',
      placeholder: 'Paste script purpose, host app, and function names.',
      template: context => `Audit this Google Apps Script before final output: ${context || '[SCRIPT / PURPOSE]'}\n\nCheck platform/API correctness, host service assumptions, syntax/brace balance, required scopes/services, function-name alignment, runtime hazards, paste readiness, validation helpers, and self-test path. Repair before final. Warn if the script would fail in the wrong Google environment.`
    },
    {
      id: 'deploy-check',
      tag: 'Deploy',
      title: 'GitHub → Cloudflare Deploy Check',
      description: 'Creates a simple deployment verification checklist for your static apps.',
      placeholder: 'Paste repo, branch, path, and Cloudflare project if known.',
      template: context => `Deployment check for ${context || '[REPO / BRANCH / APP PATH]'}\n\nVerify: files are committed to the correct repo path, index route works, relative assets resolve, Cloudflare build settings match the project, branch is connected, preview/production deploy is current, old links are preserved, mobile layout works, and no console errors appear. Give exact next terminal/GitHub/Cloudflare steps only where needed.`
    },
    {
      id: 'family-learning',
      tag: 'Family',
      title: 'Noam Learning Sprint',
      description: 'Creates a short practical support plan for Hebrew, Grade 7 readiness, or study routines.',
      placeholder: 'Paste subject, timeframe, strengths, struggle points, and available time.',
      template: context => `Build a practical Noam learning sprint: ${context || '[SUBJECT / TIMEFRAME]'}\n\nKeep it manageable, encouraging, and specific. Include daily/weekly routine, short practice tasks, parent moves, easy progress checks, and a low-pressure way to celebrate growth. Prioritize consistency over volume.`
    }
  ];

  const QA_CHECKS = [
    ['sourceFidelity', 'Source fidelity', 'The output preserves source facts, tasks, sequence, examples, and intent.'],
    ['objectiveAlignment', 'Objective alignment', 'Objectives, activities, supports, and assessment match the learning target.'],
    ['readerUsability', 'Reader usability', 'A teacher, student, family member, or viewer can use it without confusion.'],
    ['accessibility', 'Accessibility', 'Language, layout, contrast, navigation, and supports reduce barriers without lowering demand.'],
    ['visualPolish', 'Visual polish', 'Spacing, hierarchy, typography, and formatting feel professional and uncluttered.'],
    ['technicalSafety', 'Technical safety', 'Code/scripts are platform-safe, syntax-checked, and deployable.'],
    ['completion', 'Completion integrity', 'No missing sections, placeholders, broken links, truncated content, or dangling references.'],
    ['benchmark', 'Benchmark comparison', 'It is closer to premium teacher-product quality than a generic draft.']
  ];

  const DEFAULT_DATA = {
    mission: 'Build one finished thing today, then make it reusable.',
    settings: { highContrast: false, compact: false },
    qa: {},
    tasks: [
      { id: uid(), title: 'Run Ready lesson-plan workflow on next source deck', stream: 'ready', mode: 'school', priority: 'high', impact: 5, effort: 2, status: 'todo', due: '', notes: 'Use source slides as truth; apply EduWonderLab QA Harness.' },
      { id: uid(), title: 'Turn strongest student activity into reusable template', stream: 'apps', mode: 'technical', priority: 'high', impact: 5, effort: 3, status: 'doing', due: '', notes: 'Preserve working features; add accessibility, localStorage, QA, and deploy checks.' },
      { id: uid(), title: 'Create Noam 15-minute Hebrew practice routine', stream: 'noam', mode: 'personal', priority: 'medium', impact: 4, effort: 1, status: 'todo', due: '', notes: 'Small wins, reading-first, record/playback where useful.' },
      { id: uid(), title: 'Check GitHub / Cloudflare link visibility after deploy', stream: 'deploy', mode: 'technical', priority: 'medium', impact: 4, effort: 1, status: 'blocked', due: '', notes: 'Confirm route, homepage card, Teacher Tools card, and mobile rendering.' }
    ],
    links: [
      { id: uid(), label: 'Teacher Tools', url: '/teacher-tools/', category: 'Hub' },
      { id: uid(), label: 'Neft Learning Forecast Engine', url: '/teacher-tools/forecast-engine/', category: 'Teacher Tool' },
      { id: uid(), label: 'Data Studio', url: '/statistics-data/data-studio/', category: 'Data' },
      { id: uid(), label: 'Math Section', url: '/math/', category: 'Classroom' },
      { id: uid(), label: 'Blood on the River', url: '/blood-on-the-river/', category: 'Reading' },
      { id: uid(), label: 'Noam Hebrew Review', url: '/esol-reading-writing/noamhebrewreview/', category: 'Family' }
    ]
  };

  let state = loadState();
  let editingTaskId = null;

  const els = {};
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindElements();
    setDate();
    applySettings();
    populateStreams();
    bindEvents();
    renderAll();
    registerServiceWorker();
  }

  function bindElements() {
    ['globalSearch', 'modeFilter', 'priorityFilter', 'missionInput', 'captureInput', 'taskTitle', 'taskStream', 'taskMode', 'taskPriority', 'taskImpact', 'taskEffort', 'taskDue', 'taskStatus', 'taskNotes', 'linkLabel', 'linkUrl', 'linkCategory', 'importFile'].forEach(id => els[id] = document.getElementById(id));
    els.taskForm = document.querySelector('[data-task-form]');
    els.linkForm = document.querySelector('[data-link-form]');
    els.kanban = document.querySelector('[data-kanban]');
    els.rankedList = document.querySelector('[data-ranked-list]');
    els.workflowGrid = document.querySelector('[data-workflow-grid]');
    els.qaGrid = document.querySelector('[data-qa-grid]');
    els.launchGrid = document.querySelector('[data-launch-grid]');
    els.toast = document.querySelector('[data-toast]');
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const action = button.dataset.action;
      if (action && actions[action]) actions[action](button, event);
      if (button.dataset.taskMove) moveTask(button.dataset.taskId, button.dataset.taskMove);
      if (button.dataset.taskEdit) editTask(button.dataset.taskEdit);
      if (button.dataset.taskDelete) deleteTask(button.dataset.taskDelete);
      if (button.dataset.linkDelete) deleteLink(button.dataset.linkDelete);
      if (button.dataset.copyWorkflow) copyWorkflow(button.dataset.copyWorkflow);
    });

    [els.globalSearch, els.modeFilter, els.priorityFilter].forEach(el => el && el.addEventListener('input', renderAll));
    els.taskForm.addEventListener('submit', saveTaskFromForm);
    els.linkForm.addEventListener('submit', saveLinkFromForm);
    els.missionInput.addEventListener('input', debounce(() => { state.mission = els.missionInput.value.trim(); persist(); }, 350));
    els.importFile.addEventListener('change', importJson);
  }

  const actions = {
    generateBrief() { renderBrief(true); toast('Command brief refreshed.'); },
    openCapture() { document.getElementById('capture-title').scrollIntoView({ behavior: 'smooth', block: 'start' }); els.captureInput.focus(); },
    exportMarkdown() { downloadText('neftos-command-brief.md', buildMarkdownBrief(), 'text/markdown'); toast('Markdown briefing exported.'); },
    saveMission() { state.mission = els.missionInput.value.trim(); persist(); renderBrief(true); toast('Mission saved.'); },
    missionToTasks() { missionToTasks(); },
    resetDemo() { if (confirm('Reset to the starter NeftOS sample system?')) { state = clone(DEFAULT_DATA); persist(); applySettings(); renderAll(); toast('Starter system restored.'); } },
    showTaskForm() { editingTaskId = null; clearTaskForm(); els.taskForm.hidden = false; els.taskTitle.focus(); },
    cancelTaskForm() { els.taskForm.hidden = true; clearTaskForm(); },
    toggleHighContrast(button) { state.settings.highContrast = !state.settings.highContrast; button.setAttribute('aria-pressed', String(state.settings.highContrast)); persist(); applySettings(); },
    toggleCompact(button) { state.settings.compact = !state.settings.compact; button.setAttribute('aria-pressed', String(state.settings.compact)); persist(); applySettings(); },
    copyQaReport() { copyText(buildQaReport()); },
    clearQa() { state.qa = {}; persist(); renderQa(); toast('QA checks cleared.'); },
    showLinkForm() { els.linkForm.hidden = false; els.linkLabel.focus(); },
    cancelLinkForm() { els.linkForm.hidden = true; clearLinkForm(); },
    captureTasks() { captureTasks(); },
    clearCapture() { els.captureInput.value = ''; },
    exportJson() { downloadText(`neftos-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state, null, 2), 'application/json'); toast('JSON backup downloaded.'); },
    clearAllData() { if (confirm('Clear all NeftOS local data on this browser?')) { localStorage.removeItem(STORAGE_KEY); state = clone(DEFAULT_DATA); applySettings(); renderAll(); toast('Local data cleared.'); } }
  };

  function renderAll() {
    els.missionInput.value = state.mission || '';
    renderMetrics();
    renderBrief();
    renderKanban();
    renderWorkflows();
    renderQa();
    renderLinks();
  }

  function renderMetrics() {
    const tasks = state.tasks;
    setText('[data-open-count]', tasks.filter(t => t.status !== 'done').length);
    setText('[data-high-count]', tasks.filter(t => t.priority === 'high' && t.status !== 'done').length);
    setText('[data-blocked-count]', tasks.filter(t => t.status === 'blocked').length);
    setText('[data-done-count]', tasks.filter(t => t.status === 'done').length);
  }

  function renderBrief(force = false) {
    const ranked = filteredTasks().filter(t => t.status !== 'done').sort((a, b) => scoreTask(b) - scoreTask(a)).slice(0, 5);
    els.rankedList.innerHTML = ranked.length ? ranked.map(t => `<li><strong>${escapeHtml(t.title)}</strong><br><span>${streamName(t.stream)} · ${capitalize(t.priority)} · score ${scoreTask(t)}</span></li>`).join('') : '<li>No open tasks match the current filters.</li>';
    if (force) document.getElementById('brief-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderKanban() {
    const columns = [
      ['todo', 'To do'],
      ['doing', 'Doing'],
      ['blocked', 'Blocked'],
      ['done', 'Done']
    ];
    const tasks = filteredTasks().sort((a, b) => scoreTask(b) - scoreTask(a));
    els.kanban.innerHTML = columns.map(([status, label]) => {
      const items = tasks.filter(t => t.status === status);
      return `<section class="kanban-column" aria-labelledby="col-${status}">
        <h3 id="col-${status}">${label} <span class="column-count">${items.length}</span></h3>
        ${items.map(renderTask).join('') || '<p class="empty-note">No tasks here.</p>'}
      </section>`;
    }).join('');
    renderMetrics();
    renderBrief();
  }

  function renderTask(task) {
    const nextButtons = ['todo', 'doing', 'blocked', 'done']
      .filter(status => status !== task.status)
      .map(status => `<button type="button" data-task-id="${task.id}" data-task-move="${status}">${statusLabel(status)}</button>`)
      .join('');
    return `<article class="task-card">
      <header><h3>${escapeHtml(task.title)}</h3><span class="tag">${scoreTask(task)}</span></header>
      <div class="tag-row">
        <span class="tag">${streamName(task.stream)}</span>
        <span class="tag">${capitalize(task.mode)}</span>
        <span class="tag">${capitalize(task.priority)}</span>
        ${task.due ? `<span class="tag">Due ${escapeHtml(task.due)}</span>` : ''}
      </div>
      ${task.notes ? `<p>${escapeHtml(task.notes)}</p>` : ''}
      <div class="task-actions">${nextButtons}<button type="button" data-task-edit="${task.id}">Edit</button><button type="button" data-task-delete="${task.id}">Delete</button></div>
    </article>`;
  }

  function renderWorkflows() {
    const template = document.getElementById('workflowTemplate');
    els.workflowGrid.innerHTML = '';
    WORKFLOWS.forEach(workflow => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.querySelector('.card-kicker').textContent = workflow.tag;
      node.querySelector('h3').textContent = workflow.title;
      node.querySelector('p').textContent = workflow.description;
      const textarea = node.querySelector('textarea');
      const code = node.querySelector('code');
      const copyButton = node.querySelector('.copy-button');
      textarea.placeholder = workflow.placeholder;
      textarea.addEventListener('input', () => code.textContent = workflow.template(textarea.value.trim()));
      code.textContent = workflow.template('');
      copyButton.dataset.copyWorkflow = workflow.id;
      copyButton.addEventListener('click', () => copyText(workflow.template(textarea.value.trim())));
      els.workflowGrid.append(node);
    });
  }

  function renderQa() {
    els.qaGrid.innerHTML = QA_CHECKS.map(([id, title, detail]) => `<label class="qa-item">
      <input type="checkbox" data-qa-id="${id}" ${state.qa[id] ? 'checked' : ''} />
      <span><strong>${title}</strong><span>${detail}</span></span>
    </label>`).join('');
    els.qaGrid.querySelectorAll('input').forEach(input => input.addEventListener('change', () => {
      state.qa[input.dataset.qaId] = input.checked;
      persist();
      renderQaScore();
    }));
    renderQaScore();
  }

  function renderQaScore() {
    const passed = QA_CHECKS.filter(([id]) => state.qa[id]).length;
    const score = Math.round((passed / QA_CHECKS.length) * 100);
    setText('[data-qa-score]', `${score}%`);
  }

  function renderLinks() {
    const term = searchTerm();
    const links = state.links.filter(link => [link.label, link.url, link.category].join(' ').toLowerCase().includes(term));
    els.launchGrid.innerHTML = links.map(link => `<article class="launch-card">
      <span class="card-kicker">${escapeHtml(link.category || 'Link')}</span>
      <h3>${escapeHtml(link.label)}</h3>
      <div class="launch-actions"><a href="${escapeAttr(link.url)}">Open</a><button type="button" data-link-delete="${link.id}">Delete</button></div>
      <small>${escapeHtml(link.url)}</small>
    </article>`).join('') || '<p>No links match the current search.</p>';
  }

  function filteredTasks() {
    const term = searchTerm();
    const mode = els.modeFilter.value;
    const priority = els.priorityFilter.value;
    return state.tasks.filter(task => {
      const matchesText = [task.title, task.notes, streamName(task.stream), task.mode, task.priority, task.status].join(' ').toLowerCase().includes(term);
      const matchesMode = mode === 'all' || task.mode === mode;
      const matchesPriority = priority === 'all' || task.priority === priority;
      return matchesText && matchesMode && matchesPriority;
    });
  }

  function saveTaskFromForm(event) {
    event.preventDefault();
    const title = els.taskTitle.value.trim();
    if (!title) return toast('Add a task title first.');
    const task = {
      id: editingTaskId || uid(),
      title,
      stream: els.taskStream.value,
      mode: els.taskMode.value,
      priority: els.taskPriority.value,
      impact: Number(els.taskImpact.value),
      effort: Number(els.taskEffort.value),
      due: els.taskDue.value,
      status: els.taskStatus.value,
      notes: els.taskNotes.value.trim()
    };
    const existing = state.tasks.findIndex(t => t.id === task.id);
    if (existing >= 0) state.tasks[existing] = task;
    else state.tasks.unshift(task);
    persist();
    els.taskForm.hidden = true;
    clearTaskForm();
    editingTaskId = null;
    renderAll();
    toast('Task saved.');
  }

  function saveLinkFromForm(event) {
    event.preventDefault();
    const label = els.linkLabel.value.trim();
    const url = els.linkUrl.value.trim();
    if (!label || !url) return toast('Add both a label and URL.');
    state.links.unshift({ id: uid(), label, url, category: els.linkCategory.value.trim() || 'Link' });
    persist();
    els.linkForm.hidden = true;
    clearLinkForm();
    renderLinks();
    toast('Link saved.');
  }

  function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    els.taskTitle.value = task.title;
    els.taskStream.value = task.stream;
    els.taskMode.value = task.mode;
    els.taskPriority.value = task.priority;
    els.taskImpact.value = task.impact;
    els.taskEffort.value = task.effort;
    els.taskDue.value = task.due || '';
    els.taskStatus.value = task.status;
    els.taskNotes.value = task.notes || '';
    els.taskForm.hidden = false;
    els.taskTitle.focus();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    persist();
    renderAll();
    toast('Task deleted.');
  }

  function moveTask(id, status) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.status = status;
    persist();
    renderAll();
  }

  function deleteLink(id) {
    state.links = state.links.filter(link => link.id !== id);
    persist();
    renderLinks();
    toast('Link deleted.');
  }

  function missionToTasks() {
    const text = els.missionInput.value.trim();
    if (!text) return toast('Add a mission first.');
    const parts = text.split(/\n|;|\./).map(s => s.trim()).filter(Boolean).slice(0, 8);
    parts.forEach(part => state.tasks.unshift(taskFromText(part)));
    persist();
    renderAll();
    toast(`${parts.length} mission item${parts.length === 1 ? '' : 's'} converted to tasks.`);
  }

  function captureTasks() {
    const lines = els.captureInput.value.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) return toast('Paste at least one line first.');
    lines.forEach(line => state.tasks.unshift(taskFromText(line)));
    persist();
    els.captureInput.value = '';
    renderAll();
    toast(`${lines.length} captured item${lines.length === 1 ? '' : 's'} added.`);
  }

  function taskFromText(text) {
    const lower = text.toLowerCase();
    const stream = lower.includes('ready') ? 'ready' : lower.includes('notebook') ? 'notebooks' : lower.includes('cloudflare') || lower.includes('github') || lower.includes('deploy') ? 'deploy' : lower.includes('noam') || lower.includes('hebrew') || lower.includes('family') ? 'noam' : lower.includes('pd') || lower.includes('teacher') ? 'pd' : 'apps';
    const mode = DEFAULT_STREAMS.find(s => s.id === stream)?.mode || 'school';
    const priority = lower.includes('urgent') || lower.includes('today') || lower.includes('blocked') || lower.includes('ready') ? 'high' : 'medium';
    return { id: uid(), title: text, stream, mode, priority, impact: priority === 'high' ? 5 : 4, effort: lower.includes('build') || lower.includes('generate') ? 3 : 2, due: '', status: lower.includes('blocked') ? 'blocked' : 'todo', notes: '' };
  }

  function scoreTask(task) {
    const priorityBoost = task.priority === 'high' ? 6 : task.priority === 'medium' ? 3 : 1;
    const statusPenalty = task.status === 'blocked' ? 5 : task.status === 'done' ? 99 : 0;
    const dueBoost = task.due ? Math.max(0, 5 - Math.ceil((new Date(task.due) - startOfToday()) / 86400000)) : 0;
    return Math.max(0, (Number(task.impact) * 4) + priorityBoost + dueBoost - (Number(task.effort) * 2) - statusPenalty);
  }

  function buildMarkdownBrief() {
    const top = state.tasks.filter(t => t.status !== 'done').sort((a, b) => scoreTask(b) - scoreTask(a)).slice(0, 8);
    const qaPassed = QA_CHECKS.filter(([id]) => state.qa[id]).map(([, title]) => title);
    return `# NeftOS Command Brief\n\nGenerated: ${new Date().toLocaleString()}\n\n## Mission\n${state.mission || 'No mission set.'}\n\n## Top Actions\n${top.map((t, i) => `${i + 1}. **${t.title}** — ${streamName(t.stream)} / ${t.priority} / ${t.status} / score ${scoreTask(t)}${t.notes ? `\n   - ${t.notes}` : ''}`).join('\n')}\n\n## QA Checks Passed\n${qaPassed.length ? qaPassed.map(x => `- ${x}`).join('\n') : '- None yet'}\n\n## Open Links\n${state.links.map(link => `- [${link.label}](${link.url}) — ${link.category}`).join('\n')}\n`;
  }

  function buildQaReport() {
    return `EduWonderLab QA Harness Report\nReady Score: ${document.querySelector('[data-qa-score]').textContent}\n\n${QA_CHECKS.map(([id, title, detail]) => `${state.qa[id] ? 'PASS' : 'TODO'} — ${title}: ${detail}`).join('\n')}`;
  }

  function copyWorkflow(id) {
    const workflow = WORKFLOWS.find(w => w.id === id);
    if (workflow) copyText(workflow.template(''));
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard.');
    } catch {
      downloadText('neftos-copy.txt', text, 'text/plain');
      toast('Clipboard unavailable; downloaded text instead.');
    }
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        state = normalizeState(imported);
        persist();
        applySettings();
        renderAll();
        toast('Backup imported.');
      } catch {
        toast('That file was not a valid NeftOS JSON backup.');
      }
    };
    reader.readAsText(file);
  }

  function populateStreams() {
    els.taskStream.innerHTML = DEFAULT_STREAMS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }

  function applySettings() {
    document.body.classList.toggle('high-contrast', Boolean(state.settings.highContrast));
    document.body.classList.toggle('compact-mode', Boolean(state.settings.compact));
    const contrastButton = document.querySelector('[data-action="toggleHighContrast"]');
    const compactButton = document.querySelector('[data-action="toggleCompact"]');
    if (contrastButton) contrastButton.setAttribute('aria-pressed', String(Boolean(state.settings.highContrast)));
    if (compactButton) compactButton.setAttribute('aria-pressed', String(Boolean(state.settings.compact)));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : clone(DEFAULT_DATA);
    } catch {
      return clone(DEFAULT_DATA);
    }
  }

  function normalizeState(value) {
    const base = clone(DEFAULT_DATA);
    return {
      mission: typeof value?.mission === 'string' ? value.mission : base.mission,
      settings: { ...base.settings, ...(value?.settings || {}) },
      qa: { ...(value?.qa || {}) },
      tasks: Array.isArray(value?.tasks) ? value.tasks.map(t => ({ ...taskFromText(t.title || 'Untitled task'), ...t, id: t.id || uid() })) : base.tasks,
      links: Array.isArray(value?.links) ? value.links.map(l => ({ id: l.id || uid(), label: l.label || 'Link', url: l.url || '#', category: l.category || 'Link' })) : base.links
    };
  }

  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function uid() { return `n${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`; }
  function streamName(id) { return DEFAULT_STREAMS.find(s => s.id === id)?.name || 'General'; }
  function statusLabel(status) { return ({ todo: 'To do', doing: 'Doing', blocked: 'Blocked', done: 'Done' })[status] || status; }
  function capitalize(value) { return String(value || '').slice(0, 1).toUpperCase() + String(value || '').slice(1); }
  function searchTerm() { return (els.globalSearch?.value || '').trim().toLowerCase(); }
  function setText(selector, value) { const el = document.querySelector(selector); if (el) el.textContent = value; }
  function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function setDate() { const el = document.querySelector('[data-today-title]'); if (el) el.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function clearTaskForm() { els.taskForm.reset(); els.taskImpact.value = '4'; els.taskEffort.value = '2'; }
  function clearLinkForm() { els.linkForm.reset(); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }
  function debounce(fn, wait) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); }; }

  function downloadText(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('visible'), 2600);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }
})();
