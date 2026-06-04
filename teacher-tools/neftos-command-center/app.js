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
    initCurriculumHub();
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
    if (typeof renderPlaylistOptions === 'function') {
      renderPlaylistOptions();
    }
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

  // ── Curriculum Hub Upgrade Functions ──
  function initCurriculumHub() {
    var uploader = document.getElementById('rosterFileUploader');
    if (uploader) {
      uploader.addEventListener('change', handleRosterUpload);
    }
    
    if (localStorage.getItem('neftos.roster.v1')) {
      try {
        var cachedRoster = JSON.parse(localStorage.getItem('neftos.roster.v1'));
        if (Array.isArray(cachedRoster)) {
          displayRosterSummary(cachedRoster);
          renderDiagnosticsMatrix(cachedRoster);
        }
      } catch(e) {}
    }
    
    renderPlaylistOptions();
    switchGeneratorTab('lesson');
    renderWeeklyCalendar();
  }

  window.switchGeneratorTab = function(tabName) {
    var tabs = ['lesson', 'worksheet', 'playlist'];
    tabs.forEach(function(t) {
      var content = document.getElementById('tabContent' + capitalize(t));
      var btn = document.getElementById('tabBtn' + capitalize(t));
      if (content) {
        content.style.display = (t === tabName) ? 'block' : 'none';
      }
      if (btn) {
        if (t === tabName) {
          btn.className = 'primary-action small';
          btn.style.boxShadow = 'none';
        } else {
          btn.className = 'secondary-action small';
        }
      }
    });
  };

  window.loadSampleRoster = function() {
    var sample = [
      { name: "Sofia R.", wida: "Level 1: Entering", struggling: "MGSE6.NS.4, MGSE6.NS.2" },
      { name: "Mateo L.", wida: "Level 2: Emerging", struggling: "MGSE6.NS.4, MGSE6.EE.1" },
      { name: "An C.", wida: "Level 1: Entering", struggling: "MGSE6.NS.4, MGSE6.EE.2" },
      { name: "Yusuf M.", wida: "Level 3: Developing", struggling: "MGSE6.NS.4, MGSE6.NS.3" },
      { name: "Li Wei T.", wida: "Level 2: Emerging", struggling: "MGSE6.NS.4, MGSE6.NS.1" }
    ];
    localStorage.setItem('neftos.roster.v1', JSON.stringify(sample));
    displayRosterSummary(sample);
    toast("Loaded sample student roster!");
  };

  function handleRosterUpload(event) {
    var file = event.target.files?.[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function() {
      var text = reader.result;
      var parsedRoster = [];
      
      try {
        var data = JSON.parse(text);
        if (Array.isArray(data)) {
          parsedRoster = data;
        } else if (data && Array.isArray(data.students)) {
          parsedRoster = data.students;
        } else if (data && typeof data === 'object') {
          for (var key in data) {
            if (Array.isArray(data[key])) {
              parsedRoster = data[key];
              break;
            }
          }
        }
      } catch(e) {
        parsedRoster = parseCsvRoster(text);
      }
      
      if (parsedRoster.length > 0) {
        parsedRoster = parsedRoster.map(function(s) {
          return {
            name: s.name || s.student || s.Student || s.Name || "Unknown Student",
            wida: s.wida || s.level || s.Wida || s.Level || s.WIDALevel || "Level 3: Developing",
            struggling: s.struggling || s.standards || s.standard || s.Struggling || ""
          };
        });
        localStorage.setItem('neftos.roster.v1', JSON.stringify(parsedRoster));
        displayRosterSummary(parsedRoster);
        toast("Successfully imported " + parsedRoster.length + " students from roster!");
      } else {
        toast("Could not parse student roster. Ensure it is a valid CSV or JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function parseCsvRoster(text) {
    var lines = text.split('\n').map(function(l){return l.trim();}).filter(Boolean);
    if (lines.length < 2) return [];
    
    var headers = lines[0].split(',').map(function(h){return h.replace(/^["']|["']$/g, '').trim();});
    
    var nameIdx = headers.findIndex(function(h){return /name|student/i.test(h);});
    var widaIdx = headers.findIndex(function(h){return /wida|level|elp/i.test(h);});
    var standardIdx = headers.findIndex(function(h){return /standard|struggling|topic/i.test(h);});
    
    if (nameIdx === -1) nameIdx = 0;
    if (widaIdx === -1) widaIdx = 1 < headers.length ? 1 : 0;
    if (standardIdx === -1) standardIdx = 2 < headers.length ? 2 : 0;
    
    var roster = [];
    for (var i = 1; i < lines.length; i++) {
      var row = splitCsvLine(lines[i]);
      if (row.length === 0) continue;
      roster.push({
        name: row[nameIdx] || "Student " + i,
        wida: row[widaIdx] || "Level 2: Emerging",
        struggling: row[standardIdx] || ""
      });
    }
    return roster;
  }

  function splitCsvLine(line) {
    var result = [];
    var cell = "";
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cell.trim().replace(/^["']|["']$/g, ''));
        cell = "";
      } else {
        cell += ch;
      }
    }
    result.push(cell.trim().replace(/^["']|["']$/g, ''));
    return result;
  }

  function displayRosterSummary(roster) {
    var summaryPanel = document.getElementById('rosterSummaryPanel');
    if (!summaryPanel) return;
    
    summaryPanel.style.display = 'grid';
    document.getElementById('rosterTotalCount').textContent = roster.length + " students";
    
    var riskList = roster.filter(function(s) {
      return /level\s*[1-2]/i.test(s.wida) || /entering|emerging/i.test(s.wida);
    });
    document.getElementById('rosterRiskCount').textContent = riskList.length + " targeted";
    
    var standardsMap = {};
    roster.forEach(function(s) {
      if (s.struggling) {
        var stds = s.struggling.split(/,|;/).map(function(x){return x.trim();}).filter(Boolean);
        stds.forEach(function(std) {
          standardsMap[std] = (standardsMap[std] || 0) + 1;
        });
      }
    });
    var uniqueStandards = Object.keys(standardsMap);
    document.getElementById('rosterStandardCount').textContent = uniqueStandards.length + " unique";
    
    renderDiagnosticsMatrix(roster);
  }

  window.generateLessonPrompt = function() {
    var standard = document.getElementById('lpStandard').value.trim() || 'MGSE6.NS.4';
    var topic = document.getElementById('lpTopic').value.trim() || 'Greatest Common Factor (GCF) visual models';
    
    var roster = [];
    if (localStorage.getItem('neftos.roster.v1')) {
      try { roster = JSON.parse(localStorage.getItem('neftos.roster.v1')); } catch(e) {}
    }
    
    var targetStudents = [];
    roster.forEach(function(s) {
      var isTarget = /level\s*[1-2]/i.test(s.wida) || /entering|emerging/i.test(s.wida);
      var strugglesWithStandard = s.struggling && s.struggling.toLowerCase().indexOf(standard.toLowerCase()) !== -1;
      if (isTarget || strugglesWithStandard) {
        targetStudents.push(s.name);
      }
    });
    
    var smallGroupSection = "";
    if (targetStudents.length > 0) {
      smallGroupSection = "Target Small Group Students for Scaffolded Support:\n" +
        targetStudents.map(function(name) { return "- " + name + " (Level 1-2 Support)"; }).join("\n") + "\n\n" +
        "WIDA Scaffold Level Directives:\n" +
        "- Use explicit vocabulary cards with visual pillars for terms like 'factor', 'greatest', and 'common'.\n" +
        "- Integrate interactive visual GCF Venn diagrams to show overlapping common factors.\n" +
        "- Implement bilingual sentence starters (e.g., 'Therefore, the GCF of [A] and [B] is...') to build academic oral practice.";
    } else {
      smallGroupSection = "Target Small Group Students:\n" +
        "- Fallback Group: All entering and emerging bilingual learners.\n\n" +
        "WIDA Scaffold Level Directives:\n" +
        "- Use explicit vocabulary columns, simple math models, and sequence transition starters.";
    }
    
    var prompt = "Act as an expert ESOL Curriculum Planner & Mathematics Creative Developer.\n" +
      "Create an enterprise-grade WIDA ACCESS scaffolded lesson plan for standard " + standard + ".\n\n" +
      "Lesson Topic: " + topic + "\n\n" +
      smallGroupSection + "\n\n" +
      "Required Lesson Deliverables:\n" +
      "1. Standards Mapping & 'I Can' Objectives: Write a student-friendly objective in Sora/Outfit style.\n" +
      "2. Vocabulary Word Wall: Define required target words and provide Spanish/Arabic/Vietnamese multilingual column translations.\n" +
      "3. Classroom Sequence: Detailed outline of 'Notice and Wonder' Do-Now, direct instruction using visual SVG models, small-group practice worksheets, and independent reflection.\n" +
      "4. Exit Assessment Ticket: Design a clean exit ticket aligned to the objective to check student understanding.\n\n" +
      "Execute this plan with zero placeholders, complete and publication-ready, matching the EduWonderLab QA Harness standards.";
      
    document.getElementById('lpOutputPrompt').value = prompt;
    toast("Lesson plan prompt compiled!");
  };

  window.copyLessonPrompt = function() {
    var txt = document.getElementById('lpOutputPrompt').value;
    if (!txt) return toast("Compile a prompt first.");
    copyText(txt);
  };

  window.generateDoNowWorksheet = function() {
    var a = parseInt(document.getElementById('wsNumA').value) || 12;
    var b = parseInt(document.getElementById('wsNumB').value) || 18;
    
    document.getElementById('wsValA').textContent = a;
    document.getElementById('wsValB').textContent = b;
    document.getElementById('wsValA_row').textContent = a;
    document.getElementById('wsValB_row').textContent = b;
    
    var factorsA = calculateFactors(a);
    var factorsB = calculateFactors(b);
    
    document.getElementById('wsFactorsA').textContent = factorsA.join(', ');
    document.getElementById('wsFactorsB').textContent = factorsB.join(', ');
    
    var common = factorsA.filter(function(x) { return factorsB.indexOf(x) !== -1; });
    var gcf = common[common.length - 1];
    
    document.getElementById('wsGcfResult').textContent = gcf;
    
    var uniqueA = factorsA.filter(function(x) { return common.indexOf(x) === -1; });
    var uniqueB = factorsB.filter(function(x) { return common.indexOf(x) === -1; });
    
    var svgContainer = document.getElementById('svgVennContainer');
    if (svgContainer) {
      svgContainer.innerHTML = drawGCFVennSVG(a, b, uniqueA, uniqueB, common, gcf);
    }
    
    document.getElementById('worksheetDisplayArea').style.display = 'block';
    toast("Print-ready Do-Now worksheet & GCF Venn diagram generated!");
  };

  function calculateFactors(num) {
    var factors = [];
    for (var i = 1; i <= num; i++) {
      if (num % i === 0) factors.push(i);
    }
    return factors;
  }

  function drawGCFVennSVG(numA, numB, uniqueA, uniqueB, common, gcf) {
    var width = 450;
    var height = 250;
    
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" style="background:white; border: 1px solid var(--neft-line); border-radius: 8px;">' +
      '<!-- Background Rect -->' +
      '<rect width="' + width + '" height="' + height + '" fill="#ffffff" />' +
      
      '<!-- Left Circle (Value A) -->' +
      '<circle cx="175" cy="120" r="85" fill="rgba(15, 118, 110, 0.12)" stroke="#0f766e" stroke-width="2.5" />' +
      
      '<!-- Right Circle (Value B) -->' +
      '<circle cx="275" cy="120" r="85" fill="rgba(183, 121, 31, 0.12)" stroke="#b7791f" stroke-width="2.5" />' +
      
      '<!-- Circle Labels -->' +
      '<text x="135" y="30" font-family="\'Sora\', \'Segoe UI\', sans-serif" font-size="11" font-weight="800" fill="#0f766e" text-anchor="middle">Factors of ' + numA + '</text>' +
      '<text x="315" y="30" font-family="\'Sora\', \'Segoe UI\', sans-serif" font-size="11" font-weight="800" fill="#b7791f" text-anchor="middle">Factors of ' + numB + '</text>';
      
    uniqueA.forEach(function(f, idx) {
      var x = 125 + (idx % 2 === 0 ? -12 : 12);
      var y = 80 + idx * 24;
      if (y > 180) y = 140;
      svg += '<text x="' + x + '" y="' + y + '" font-family="\'Sora\', \'Segoe UI\', sans-serif" font-size="13" font-weight="bold" fill="#0f766e" text-anchor="middle">' + f + '</text>';
    });
    
    uniqueB.forEach(function(f, idx) {
      var x = 325 + (idx % 2 === 0 ? -12 : 12);
      var y = 80 + idx * 24;
      if (y > 180) y = 140;
      svg += '<text x="' + x + '" y="' + y + '" font-family="\'Sora\', \'Segoe UI\', sans-serif" font-size="13" font-weight="bold" fill="#b7791f" text-anchor="middle">' + f + '</text>';
    });
    
    common.forEach(function(f, idx) {
      var x = 225;
      var y = 75 + idx * 26;
      if (y > 175) y = 165;
      var isGcf = (f === gcf);
      var fill = isGcf ? '#c2410c' : '#1e293b';
      var weight = isGcf ? '900' : 'bold';
      var size = isGcf ? '15' : '12';
      svg += '<text x="' + x + '" y="' + y + '" font-family="\'Sora\', \'Segoe UI\', sans-serif" font-size="' + size + '" font-weight="' + weight + '" fill="' + fill + '" text-anchor="middle">' + f + (isGcf ? ' (GCF)' : '') + '</text>';
    });
    
    svg += '<!-- Callout Banner -->' +
      '<rect x="145" y="200" width="160" height="30" rx="15" fill="#fef3c7" stroke="#c2410c" stroke-width="1" />' +
      '<text x="225" y="219" font-family="\'Sora\', \'Segoe UI\', sans-serif" font-size="11" font-weight="800" fill="#c2410c" text-anchor="middle">🎯 Greatest Common GCF = ' + gcf + '</text>';
      
    svg += '</svg>';
    return svg;
  }

  window.renderPlaylistOptions = function() {
    var wrap = document.getElementById('playlistSelectionWrap');
    if (!wrap) return;
    
    wrap.innerHTML = state.links.map(function(link) {
      return '<label style="display: flex; align-items: center; gap: 8px; font-weight: normal; text-transform: none; font-size: 0.9rem; color: var(--neft-navy); cursor: pointer; margin: 0;">' +
        '<input type="checkbox" class="playlist-link-checkbox" data-label="' + escapeAttr(link.label) + '" data-url="' + escapeAttr(link.url) + '" style="width: auto; margin: 0;" />' +
        '<span><strong>' + escapeHtml(link.label) + '</strong> (' + escapeHtml(link.url) + ')</span>' +
        '</label>';
    }).join('') || '<p style="margin:0; font-size:0.86rem; color:var(--neft-muted);">No classroom fast links available. Add links in the Launchpad first!</p>';
  };

  window.compileClassroomPlaylist = function() {
    var checkboxes = document.querySelectorAll('.playlist-link-checkbox');
    var selected = [];
    checkboxes.forEach(function(cb) {
      if (cb.checked) {
        selected.push({
          label: cb.dataset.label,
          url: cb.dataset.url
        });
      }
    });
    
    if (selected.length === 0) {
      return toast("Select at least one classroom activity checkbox first.");
    }
    
    var md = "# 📋 Classroom URL Playlist Sequence\n" +
      "Sequence prepared on: " + new Date().toLocaleDateString() + "\n\n" +
      "Please execute the following learning activities in order:\n\n";
      
    selected.forEach(function(item, idx) {
      md += (idx + 1) + ". 🌟 **Step " + (idx + 1) + ": " + item.label + "**\n" +
        "   - URL Route: [" + item.url + "](" + item.url + ")\n" +
        "   - Objective: Complete WIDA simulated practice standards on this workstation route.\n\n";
    });
    
    md += "Prepared by NeftOS Curriculum Playlist System.\n";
    document.getElementById('playlistOutputMarkdown').value = md;
    toast("Playlist sequence compiled!");
  };

  window.copyPlaylistMarkdown = function() {
    var txt = document.getElementById('playlistOutputMarkdown').value;
    if (!txt) return toast("Compile a playlist first.");
    copyText(txt);
  };

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  function renderWeeklyCalendar() {
    const wrap = document.getElementById('weeklyCalendarWrap');
    if (!wrap) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let cached = {};
    try {
      cached = JSON.parse(localStorage.getItem('neftos.planner.v1')) || {};
    } catch(e) {}

    wrap.innerHTML = days.map(day => {
      const dayKey = day.toLowerCase();
      const std = cached[dayKey + '_std'] || '';
      const obj = cached[dayKey + '_obj'] || '';
      const play = cached[dayKey + '_play'] || '';

      return `
        <div style="background: white; border: 1px solid var(--neft-line); padding: 12px; border-radius: 12px; display: grid; gap: 8px;">
          <span style="font-weight: 800; font-size: 0.85rem; color: var(--neft-teal-dark); border-bottom: 1px solid var(--neft-line); padding-bottom: 4px; display: block;">📅 ${day}</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <label style="font-size: 0.78rem; font-weight: normal; margin:0; display: block;">Standard
              <input type="text" class="planner-input" data-day="${dayKey}" data-field="std" value="${escapeHtml(std)}" placeholder="MGSE6.NS.4" style="min-height:30px; padding:4px 8px; font-size:0.8rem; margin-top:2px; box-sizing: border-box; width: 100%; border: 1px solid var(--neft-line); border-radius: 6px; background: white; color: var(--neft-navy);" />
            </label>
            <label style="font-size: 0.78rem; font-weight: normal; margin:0; display: block;">Objective
              <input type="text" class="planner-input" data-day="${dayKey}" data-field="obj" value="${escapeHtml(obj)}" placeholder="Find GCF of whole numbers" style="min-height:30px; padding:4px 8px; font-size:0.8rem; margin-top:2px; box-sizing: border-box; width: 100%; border: 1px solid var(--neft-line); border-radius: 6px; background: white; color: var(--neft-navy);" />
            </label>
          </div>
          <label style="font-size: 0.78rem; font-weight: normal; margin:0; display: block;">Playlist / Sequence
            <input type="text" class="planner-input" data-day="${dayKey}" data-field="play" value="${escapeHtml(play)}" placeholder="Do-Now Worksheet -> Playlist Sequence" style="min-height:30px; padding:4px 8px; font-size:0.8rem; margin-top:2px; box-sizing: border-box; width: 100%; border: 1px solid var(--neft-line); border-radius: 6px; background: white; color: var(--neft-navy);" />
          </label>
        </div>
      `;
    }).join('');

    wrap.querySelectorAll('.planner-input').forEach(input => {
      input.addEventListener('input', () => {
        const day = input.dataset.day;
        const field = input.dataset.field;
        let data = {};
        try {
          data = JSON.parse(localStorage.getItem('neftos.planner.v1')) || {};
        } catch(e) {}
        data[day + '_' + field] = input.value;
        localStorage.setItem('neftos.planner.v1', JSON.stringify(data));
      });
    });
  }

  function renderDiagnosticsMatrix(roster) {
    const body = document.getElementById('diagnosticsMatrixBody');
    if (!body) return;

    if (!roster || roster.length === 0) {
      body.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 12px; text-align: center; color: var(--neft-muted);">No student data connector active. Click "Load Sample" or import a file above to view diagnostics.</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = roster.map(student => {
      const isHighRiskWida = /level\s*[1-2]/i.test(student.wida) || /entering|emerging/i.test(student.wida);
      const strugglesFactoring = student.struggling && student.struggling.includes('NS.4');
      const strugglesDecimals = student.struggling && student.struggling.includes('NS.3');
      
      let tag = '<span class="tag" style="background:#e0f2fe; color:#0369a1; font-weight:800; padding:2px 6px; border-radius:6px; font-size:0.72rem;">DEVELOPING</span>';
      if (isHighRiskWida) {
        tag = '<span class="tag" style="background:#fef2f2; color:#b91c1c; font-weight:800; padding:2px 6px; border-radius:6px; font-size:0.72rem;">HIGH ESOL RISK</span>';
      } else if (strugglesFactoring || strugglesDecimals) {
        tag = '<span class="tag" style="background:#fef3c7; color:#b45309; font-weight:800; padding:2px 6px; border-radius:6px; font-size:0.72rem;">STANDARDS AT RISK</span>';
      }

      return `
        <tr style="border-bottom: 1px solid var(--neft-line); transition: background 0.15s ease;" onmouseover="this.style.background='var(--neft-sage)'" onmouseout="this.style.background='none'">
          <td style="padding: 10px; font-weight: bold; color: var(--neft-navy);">${escapeHtml(student.name)}</td>
          <td style="padding: 10px;">${escapeHtml(student.wida)}</td>
          <td style="padding: 10px; color: ${strugglesFactoring ? 'var(--neft-coral)' : '#16a34a'}; font-weight: bold;">
            ${strugglesFactoring ? '⚠️ Struggling' : '✓ Proficient'}
          </td>
          <td style="padding: 10px; color: ${strugglesDecimals ? 'var(--neft-coral)' : '#16a34a'}; font-weight: bold;">
             ${strugglesDecimals ? '⚠️ Struggling' : '✓ Proficient'}
          </td>
          <td style="padding: 10px;">${tag}</td>
        </tr>
      `;
    }).join('');
  }

  window.auditAppsScript = function() {
    const code = document.getElementById('appsScriptInput').value;
    const feedback = document.getElementById('appsScriptFeedback');
    if (!code.trim()) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.borderColor = '#fca5a5';
      feedback.style.color = '#991b1b';
      feedback.innerHTML = '<strong>Error:</strong> Please paste some Google Apps Script code to audit.';
      return;
    }

    const stack = [];
    const matching = { '}': '{', ']': '[', ')': '(' };
    let lines = code.split('\n');
    let braceError = null;
    
    for (let lNum = 0; lNum < lines.length; lNum++) {
      let line = lines[lNum];
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        let char = line[charIdx];
        if (char === '{' || char === '[' || char === '(') {
          stack.push({ char, line: lNum + 1, col: charIdx + 1 });
        } else if (char === '}' || char === ']' || char === ')') {
          if (stack.length === 0) {
            braceError = `Unexpected closed bracket '${char}' at line ${lNum + 1}, column ${charIdx + 1}.`;
            break;
          }
          let top = stack.pop();
          if (top.char !== matching[char]) {
            braceError = `Mismatch: opened '${top.char}' at line ${top.line} but closed with '${char}' at line ${lNum + 1}, column ${charIdx + 1}.`;
            break;
          }
        }
      }
      if (braceError) break;
    }

    if (!braceError && stack.length > 0) {
      let top = stack.pop();
      braceError = `Unclosed bracket '${top.char}' opened at line ${top.line}, column ${top.col}.`;
    }

    let hazards = [];
    let batchCheck = true;
    
    let hasLoop = /for\s*\(|while\s*\(|\.forEach\s*\(/.test(code);
    let hasSingleCell = /\.getValue\(|\.setValue\(|\.setComment\(|\.setFont\(/.test(code);
    if (hasLoop && hasSingleCell) {
      hazards.push("⚠️ <strong>Runtime Hazard:</strong> Single-cell write/read (.getValue/.setValue) inside a loop. Please batch your data using <code>getValues()</code> and <code>setValues()</code> to avoid massive script slowing or timeouts.");
      batchCheck = false;
    }

    let hasConfig = /CONFIG\s*=/.test(code);
    let hasValidateConfig = /validateConfig\s*\(/.test(code);
    let hasSelfTest = /selfTest\s*\(/.test(code);

    let suggestions = [];
    if (!hasConfig) suggestions.push("Consider defining a centralized <code>CONFIG</code> block for your properties.");
    if (!hasValidateConfig) suggestions.push("Add a <code>validateConfig()</code> routine to verify parameters at startup.");
    if (!hasSelfTest) suggestions.push("Implement a <code>selfTest()</code> function to verify spreadsheet or doc schema stability.");

    let passed = !braceError && batchCheck;
    feedback.style.display = 'block';
    
    if (passed) {
      feedback.style.background = '#f0fdf4';
      feedback.style.borderColor = '#86efac';
      feedback.style.color = '#166534';
      let html = `<strong>🟢 Preflight Audit: PASS</strong><br>Brace balancing looks complete! Structure is clean.`;
      if (suggestions.length > 0) {
        html += `<br><br><strong>Architecture Recommendations:</strong><ul>` + suggestions.map(s => `<li>${s}</li>`).join('') + `</ul>`;
      }
      feedback.innerHTML = html;
    } else {
      feedback.style.background = '#fef2f2';
      feedback.style.borderColor = '#fca5a5';
      feedback.style.color = '#991b1b';
      let html = `<strong>🔴 Preflight Audit: FAIL</strong><br>`;
      if (braceError) {
        html += `<strong>Syntax / Bracket Mismatch:</strong><br>${braceError}<br><br>`;
      }
      if (hazards.length > 0) {
        html += `<strong>Critical Hazards Identified:</strong><br>` + hazards.map(h => `<p style="margin:4px 0;">${h}</p>`).join('') + `<br>`;
      }
      feedback.innerHTML = html;
    }
  };
})();
