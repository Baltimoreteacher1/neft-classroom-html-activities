(() => {
  'use strict';

  const STORAGE_KEY = 'nfe_gold_state_v5';
  const PROFILE_PREFIX = 'nfe_profile_';
  const PHASES = ['IDLE', 'CONFIGURING', 'VALIDATING', 'COMPUTING', 'SUCCESS', 'ERROR'];

  const TABS = {
    start: ['Start Here', 'A guided teacher workflow for classroom evidence.'],
    setup: ['Setup Class', 'Add class info, students, standards, and manual evidence.'],
    import: ['Import Data', 'Download a template, upload a file, or paste rows.'],
    quality: ['Review Data', 'Check missing records, duplicates, and readiness before forecasting.'],
    forecast: ['Forecast', 'Review planning estimates by student and standard.'],
    groups: ['Groups', 'Create flexible reteach groups.'],
    reports: ['Reports', 'Generate teacher-facing summaries and exports.'],
    settings: ['Settings', 'Manage local profiles, theme, and self-tests.']
  };

  const TEMPLATE = [
    'rowType,classId,className,grade,studentId,studentName,tags,standard,description,score,maxScore,date,assessment',
    'class,C1,Period 1 Math,Grade 6,,,,,,,,,',
    'student,C1,,,S001,Student Alpha,ML,,,,,,',
    'standard,,,,,,,6.G.A.1,Find area of polygons,,,,',
    'evidence,,,,S001,,,6.G.A.1,,8,10,2026-05-18,Exit Ticket'
  ].join('\n');

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const State = { current: null, worker: null, workerCache: null, saveTimer: null };

  function makeEvidence(student, standard, score, max, date, assessment) {
    const safeScore = Number(score);
    const safeMax = Number(max);
    return {
      id: `e_${Math.random().toString(36).slice(2)}`,
      student,
      standard,
      score: Number.isFinite(safeScore) ? safeScore : 0,
      max: Number.isFinite(safeMax) && safeMax > 0 ? safeMax : 100,
      pct: bound(Number.isFinite(safeScore) && Number.isFinite(safeMax) && safeMax > 0 ? (safeScore / safeMax) * 100 : 0),
      date: date || today(),
      assessment: assessment || 'Evidence'
    };
  }

  function seedState() {
    return {
      phase: 'IDLE', active: 'start', theme: window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', profile: 'Default',
      class: { id: 'C1', name: 'Period 1 Math', grade: 'Grade 6' },
      students: [['S001', 'Student Alpha', 'ML'], ['S002', 'Student Bravo', 'IEP'], ['S003', 'Student Charlie', ''], ['S004', 'Student Delta', 'Newcomer']].map(([id, name, tags]) => ({ id, name, tags })),
      standards: [['6.G.A.1', 'Find area of polygons'], ['6.G.A.2', 'Find volume of rectangular prisms'], ['6.G.A.4', 'Use nets and surface area'], ['6.SP.A.1', 'Recognize statistical questions']].map(([code, desc]) => ({ code, desc })),
      evidence: [makeEvidence('S001', '6.G.A.1', 8, 10, '2026-05-18', 'Exit Ticket'), makeEvidence('S002', '6.G.A.1', 6, 10, '2026-05-18', 'Exit Ticket'), makeEvidence('S003', '6.G.A.1', 7, 10, '2026-05-18', 'Exit Ticket'), makeEvidence('S004', '6.G.A.2', 5, 10, '2026-05-19', 'Quiz')],
      log: [], updatedAt: new Date().toISOString()
    };
  }

  function today() { return new Date().toISOString().slice(0, 10); }
  function bound(value) { const n = Number(value); return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0))); }
  function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

  function normalizeState(raw) {
    const base = seedState();
    const input = raw && typeof raw === 'object' ? raw : {};
    return {
      ...base,
      ...input,
      class: { ...base.class, ...(input.class || {}) },
      students: Array.isArray(input.students) ? input.students.map((s) => ({ id: String(s.id || '').trim(), name: String(s.name || s.id || 'Unnamed Student').trim(), tags: String(s.tags || '').trim() })) : base.students,
      standards: Array.isArray(input.standards) ? input.standards.map((s) => ({ code: String(s.code || '').trim(), desc: String(s.desc || 'Imported standard').trim() })) : base.standards,
      evidence: Array.isArray(input.evidence) ? input.evidence.map((r) => makeEvidence(r.student, r.standard, Number(r.score), Number(r.max), r.date, r.assessment)) : base.evidence,
      log: Array.isArray(input.log) ? input.log : []
    };
  }

  function loadState() { try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seedState()); } catch { return seedState(); } }

  function persist(renderAfter = true) {
    clearTimeout(State.saveTimer);
    State.saveTimer = setTimeout(() => {
      try { State.current.updatedAt = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(State.current)); $('#saveBadge').textContent = 'Saved locally'; }
      catch { State.current.phase = 'ERROR'; $('#saveBadge').textContent = 'Save failed'; alert('Local save failed. Export a backup before continuing.'); }
      if (renderAfter) render();
    }, 0);
  }

  function transition(phase, message) {
    State.current.phase = PHASES.includes(phase) ? phase : 'ERROR';
    State.current.log = [{ time: new Date().toLocaleTimeString(), phase: State.current.phase, message }, ...State.current.log].slice(0, 100);
    $('#phaseBadge').textContent = State.current.phase; $('#saveBadge').textContent = 'Saving…'; persist(false);
  }

  function validateState(state = State.current) {
    const issues = [], studentIds = new Set(), standardCodes = new Set(state.standards.map((standard) => standard.code)), seenEvidence = new Set();
    state.students.forEach((student) => { if (!student.id) issues.push(['bad', 'A student is missing an ID.']); if (studentIds.has(student.id)) issues.push(['bad', `Duplicate student ID: ${student.id}`]); studentIds.add(student.id); });
    state.standards.forEach((standard) => { if (!standard.code) issues.push(['bad', 'A standard is missing a code.']); if (!standard.desc) issues.push(['warn', `Standard ${standard.code} is missing a description.`]); });
    state.evidence.forEach((row) => {
      if (!studentIds.has(row.student)) issues.push(['warn', `Evidence uses unknown student: ${row.student}`]);
      if (!standardCodes.has(row.standard)) issues.push(['warn', `Evidence uses unknown standard: ${row.standard}`]);
      if (!Number.isFinite(Number(row.score)) || !Number.isFinite(Number(row.max)) || Number(row.max) <= 0) issues.push(['bad', 'An evidence row has an invalid score or max score.']);
      if (Number(row.score) > Number(row.max)) issues.push(['warn', `Score greater than max for ${row.student} on ${row.standard}.`]);
      const key = `${row.student}|${row.standard}|${row.date}|${row.assessment}`;
      if (seenEvidence.has(key)) issues.push(['warn', `Duplicate evidence row: ${key}`]);
      seenEvidence.add(key);
    });
    return issues;
  }

  function rowsFor(studentId, standardCode) { return State.current.evidence.filter((row) => (!studentId || row.student === studentId) && (!standardCode || row.standard === standardCode)); }
  function band(score) { const s = bound(score); if (s >= 85) return ['Strong', 'ok']; if (s >= 70) return ['Likely Ready', 'info']; if (s >= 60) return ['Approaching', 'warn']; return ['Needs Reteach', 'bad']; }
  function forecast(studentId, standardCode) { const rows = rowsFor(studentId, standardCode); if (!rows.length) return { n: 0, p: 0, lo: 0, hi: 0, label: 'No data', cls: 'warn', conf: 'Very Low' }; const center = average(rows.map((row) => bound(row.pct))); const spread = rows.length >= 4 ? 6 : rows.length >= 2 ? 10 : 14; const [label, cls] = band(center); return { n: rows.length, p: bound(center), lo: bound(center - spread), hi: bound(center + spread), label, cls, conf: rows.length >= 4 ? 'High' : rows.length >= 2 ? 'Medium' : 'Low' }; }

  function setTab(tabName) {
    const next = TABS[tabName] ? tabName : 'start';
    State.current.active = next;
    $$('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === next));
    $$('.nav button').forEach((button) => button.classList.toggle('active', button.dataset.tab === next));
    $('#pageTitle').textContent = TABS[next][0]; $('#pageSubtitle').textContent = TABS[next][1]; persist();
  }

  function render() {
    document.documentElement.dataset.theme = State.current.theme || 'light';
    $('#phaseBadge').textContent = State.current.phase || 'IDLE';
    renderHome(); renderSetupTables(); renderSelectors(); renderQuality(); renderEvidenceTable(); renderDiagnostics(); computeForecastsAsync();
  }

  function renderHome() {
    const mean = average(State.current.evidence.map((row) => row.pct));
    $('#metrics').innerHTML = [['Class', State.current.class.name || 'Unnamed', State.current.class.grade || ''], ['Students', State.current.students.length, 'local roster'], ['Evidence', State.current.evidence.length, 'records'], ['Average', `${bound(mean)}%`, 'current evidence']].map(([title, metric, note]) => `<article class="card"><h3>${escapeHtml(title)}</h3><div class="metric">${escapeHtml(metric)}</div><div class="muted">${escapeHtml(note)}</div></article>`).join('');
    $('#priorityStandards').innerHTML = State.current.standards.map((standard) => { const meanScore = average(rowsFor(null, standard.code).map((row) => row.pct)); const [label, cls] = band(meanScore); return `<p><strong>${escapeHtml(standard.code)}</strong> <span class="badge ${cls}">${label}</span><br><span class="muted">${escapeHtml(standard.desc)} • ${bound(meanScore)}%</span></p><div class="bar"><i style="width:${bound(meanScore)}%"></i></div>`; }).join('') || '<p class="muted">Add standards to begin.</p>';
    const moves = State.current.standards.map((standard) => [standard, average(rowsFor(null, standard.code).map((row) => row.pct)), rowsFor(null, standard.code).length]).filter((entry) => entry[2]).sort((a, b) => a[1] - b[1]).slice(0, 3);
    $('#teacherMoves').innerHTML = moves.map(([standard, meanScore]) => `<div class="step"><span class="num">→</span><p><strong>${escapeHtml(standard.code)}</strong>: Start with students under 70%. Class average: ${bound(meanScore)}%.</p></div>`).join('') || '<p class="muted">Add evidence to see next moves.</p>';
  }

  function renderSetupTables() {
    $('#studentTable').innerHTML = '<tr><th>ID</th><th>Name</th><th>Tags</th><th>Avg</th></tr>' + State.current.students.map((student) => `<tr><td>${escapeHtml(student.id)}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.tags || '')}</td><td>${bound(average(rowsFor(student.id).map((row) => row.pct)))}%</td></tr>`).join('');
    $('#standardTable').innerHTML = '<tr><th>Code</th><th>Description</th></tr>' + State.current.standards.map((standard) => `<tr><td>${escapeHtml(standard.code)}</td><td>${escapeHtml(standard.desc)}</td></tr>`).join('');
  }

  function renderSelectors() {
    const studentOptions = State.current.students.map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} (${escapeHtml(student.id)})</option>`).join('');
    const standardOptions = State.current.standards.map((standard) => `<option value="${escapeHtml(standard.code)}">${escapeHtml(standard.code)} — ${escapeHtml(standard.desc)}</option>`).join('');
    ['#manualStudent', '#forecastStudent'].forEach((selector) => { $(selector).innerHTML = studentOptions; });
    ['#manualStandard', '#forecastStandard'].forEach((selector) => { $(selector).innerHTML = standardOptions; });
  }

  function renderQuality() {
    const issues = validateState(), critical = issues.filter((issue) => issue[0] === 'bad').length;
    $('#qualityCards').innerHTML = [['Students', State.current.students.length, State.current.students.length ? 'ok' : 'bad'], ['Standards', State.current.standards.length, State.current.standards.length ? 'ok' : 'bad'], ['Issues', issues.length, critical ? 'bad' : issues.length ? 'warn' : 'ok']].map(([title, count, cls]) => `<article class="card"><h3>${title}</h3><div class="metric">${count}</div><span class="badge ${cls}">${cls === 'ok' ? 'OK' : cls === 'warn' ? 'Review' : 'Fix'}</span></article>`).join('');
    $('#qualityIssues').innerHTML = issues.length ? issues.map(([cls, message]) => `<p><span class="badge ${cls}">${cls}</span> ${escapeHtml(message)}</p>`).join('') : '<p class="muted">No critical issues found.</p>';
  }

  function renderEvidenceTable() { $('#evidenceTable').innerHTML = '<tr><th>Date</th><th>Student</th><th>Standard</th><th>Assessment</th><th>Score</th></tr>' + State.current.evidence.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.student)}</td><td>${escapeHtml(row.standard)}</td><td>${escapeHtml(row.assessment)}</td><td>${row.score}/${row.max} (${row.pct}%)</td></tr>`).join(''); }
  function renderForecastGrid(grid) { $('#forecastTable').innerHTML = '<tr><th>Student</th>' + State.current.standards.map((standard) => `<th>${escapeHtml(standard.code)}</th>`).join('') + '</tr>' + grid.map((row) => `<tr><td>${escapeHtml(row.student.name)}</td>${row.forecasts.map((cell) => { const f = cell.result; return `<td><span class="badge ${f.cls}">${f.n ? `${f.p}%` : 'No data'}</span><br><small>${escapeHtml(f.label)}</small></td>`; }).join('')}</tr>`).join(''); }
  function renderDiagnostics() { $('#diagText').textContent = JSON.stringify({ phase: State.current.phase, active: State.current.active, profile: State.current.profile, worker: Boolean(State.worker), counts: { students: State.current.students.length, standards: State.current.standards.length, evidence: State.current.evidence.length }, issues: validateState(), log: State.current.log.slice(0, 16) }, null, 2); }
  function computeSync() { return { grid: State.current.students.map((student) => ({ student, forecasts: State.current.standards.map((standard) => ({ standard, result: forecast(student.id, standard.code) })) })), groups: State.current.standards.map((standard) => ({ standard, kids: State.current.students.map((student) => ({ student, result: forecast(student.id, standard.code) })).filter((entry) => entry.result.n && entry.result.p < 70) })).filter((group) => group.kids.length) }; }

  function computeForecastsAsync() {
    const status = $('#workerStatus'); if (!status) return;
    if (!State.worker) { State.workerCache = computeSync(); renderForecastGrid(State.workerCache.grid); return; }
    status.classList.add('show');
    State.worker.onmessage = (event) => { State.workerCache = event.data; renderForecastGrid(State.workerCache.grid); status.classList.remove('show'); };
    State.worker.onerror = () => { State.workerCache = computeSync(); renderForecastGrid(State.workerCache.grid); status.classList.remove('show'); };
    State.worker.postMessage(JSON.parse(JSON.stringify(State.current)));
  }

  function detectDelimiter(line) { return [[',', (line.match(/,/g) || []).length], ['\t', (line.match(/\t/g) || []).length], ['|', (line.match(/\|/g) || []).length], [';', (line.match(/;/g) || []).length]].sort((a, b) => b[1] - a[1])[0][0] || ','; }
  function parseDelimitedRows(text) {
    const delimiter = detectDelimiter(text.split(/\r?\n/)[0] || ''); const rows = []; let row = [], cell = '', quote = false;
    for (let i = 0; i < text.length; i += 1) { const ch = text[i], next = text[i + 1]; if (ch === '"' && quote && next === '"') { cell += '"'; i += 1; continue; } if (ch === '"') { quote = !quote; continue; } if (ch === delimiter && !quote) { row.push(cell.trim()); cell = ''; continue; } if ((ch === '\n' || ch === '\r') && !quote) { if (ch === '\r' && next === '\n') i += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; continue; } cell += ch; }
    row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); if (rows.length < 2) return [];
    const headers = rows.shift().map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ''));
    return rows.map((values) => { const obj = {}; headers.forEach((header, index) => { obj[header] = values[index] || ''; }); return obj; });
  }
  function parseHtmlTableRows(text) { if (!/<table/i.test(text)) return parseDelimitedRows(text); const doc = new DOMParser().parseFromString(text, 'text/html'); const tableRows = Array.from(doc.querySelectorAll('tr')).map((tr) => Array.from(tr.children).map((td) => td.textContent.trim())); if (tableRows.length < 2) return []; const headers = tableRows.shift().map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, '')); return tableRows.map((values) => { const obj = {}; headers.forEach((header, index) => { obj[header] = values[index] || ''; }); return obj; }); }

  function importRows(rows) {
    transition('VALIDATING', 'Import started'); const add = { class: 0, students: 0, standards: 0, evidence: 0 }, warnings = [];
    rows.forEach((row, index) => {
      const type = String(row.rowtype || 'evidence').toLowerCase();
      if (type === 'class') { State.current.class = { id: row.classid || 'C1', name: row.classname || 'Math Class', grade: row.grade || '' }; add.class += 1; return; }
      if (type === 'student') { const id = row.studentid || row.id; if (!id) { warnings.push(`Row ${index + 2}: missing studentId`); return; } if (!State.current.students.some((student) => student.id === id)) { State.current.students.push({ id, name: row.studentname || `Student ${id}`, tags: row.tags || '' }); add.students += 1; } return; }
      if (type === 'standard') { const code = row.standard || row.code || row.ccss; if (!code) { warnings.push(`Row ${index + 2}: missing standard`); return; } if (!State.current.standards.some((standard) => standard.code === code)) { State.current.standards.push({ code, desc: row.description || 'Imported standard' }); add.standards += 1; } return; }
      const student = row.studentid || row.student, standard = row.standard || row.code || row.ccss, score = Number(row.score), max = Number(row.maxscore || row.max || 100);
      if (!student || !standard || !Number.isFinite(score) || !Number.isFinite(max) || max <= 0) { warnings.push(`Row ${index + 2}: missing student/standard/score/max`); return; }
      if (!State.current.students.some((item) => item.id === student)) State.current.students.push({ id: student, name: `Student ${student}`, tags: '' });
      if (!State.current.standards.some((item) => item.code === standard)) State.current.standards.push({ code: standard, desc: 'Imported standard' });
      const date = row.date || today(), assessment = row.assessment || 'Imported';
      if (State.current.evidence.some((entry) => entry.student === student && entry.standard === standard && entry.date === date && entry.assessment === assessment)) { warnings.push(`Row ${index + 2}: duplicate skipped`); return; }
      State.current.evidence.push(makeEvidence(student, standard, score, max, date, assessment)); add.evidence += 1;
    });
    transition('SUCCESS', 'Import complete');
    $('#importStatus').innerHTML = `<p><strong>Import complete.</strong> ${add.class} class, ${add.students} students, ${add.standards} standards, ${add.evidence} evidence rows.</p>${warnings.map((warning) => `<p class="muted">${escapeHtml(warning)}</p>`).join('') || '<p class="muted">No warnings.</p>'}`;
    render();
  }

  function downloadFile(name, text, type) { const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([text], { type })); anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(anchor.href); }
  function runSelfTest() { const tests = [], ok = (name, pass) => tests.push({ name, pass }); ok('Bound handles NaN', bound(NaN) === 0); ok('Empty forecast is safe', forecast('missing', '6.G.A.1').n === 0); const before = State.current.students.length; importRows(parseDelimitedRows('rowType,studentId,studentName\nstudent,T999,Test Student')); ok('Import adds a student', State.current.students.some((student) => student.id === 'T999')); State.current.students = State.current.students.filter((student) => student.id !== 'T999'); ok('State restores after test cleanup', State.current.students.length === before); transition(tests.every((test) => test.pass) ? 'SUCCESS' : 'ERROR', 'Self-test complete'); persist(); return tests; }

  function wireEvents() {
    document.addEventListener('click', (event) => { const target = event.target.closest('[data-tab],[data-go]'); if (target) setTab(target.dataset.tab || target.dataset.go); });
    $('#themeBtn').onclick = () => { State.current.theme = State.current.theme === 'dark' ? 'light' : 'dark'; persist(); };
    $('#saveClassBtn').onclick = () => { State.current.class.name = $('#className').value || State.current.class.name; State.current.class.grade = $('#gradeCourse').value || State.current.class.grade; transition('CONFIGURING', 'Class saved'); render(); };
    $('#addStudentBtn').onclick = () => { const id = $('#studentId').value.trim(); if (!id) return alert('Add a Student ID.'); if (State.current.students.some((student) => student.id === id)) return alert('Duplicate Student ID.'); State.current.students.push({ id, name: $('#studentName').value || `Student ${id}`, tags: $('#studentTags').value || '' }); transition('CONFIGURING', 'Student added'); render(); };
    $('#addStandardBtn').onclick = () => { const code = $('#standardCode').value.trim(); if (!code) return alert('Add a standard code.'); if (State.current.standards.some((standard) => standard.code === code)) return alert('Duplicate standard.'); State.current.standards.push({ code, desc: $('#standardDesc').value || 'Teacher-added standard' }); transition('CONFIGURING', 'Standard added'); render(); };
    $('#addEvidenceBtn').onclick = () => { const score = Number($('#manualScore').value), max = Number($('#manualMax').value || 10); if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) return alert('Enter a valid score and max.'); State.current.evidence.push(makeEvidence($('#manualStudent').value, $('#manualStandard').value, score, max, today(), $('#manualAssessment').value || 'Manual Evidence')); transition('SUCCESS', 'Evidence added'); render(); };
    $('#importPasteBtn').onclick = () => importRows(parseDelimitedRows($('#pasteBox').value));
    $('#importFileBtn').onclick = () => { const file = $('#fileInput').files[0]; if (!file) return alert('Choose a file.'); const reader = new FileReader(); reader.onload = () => importRows(parseHtmlTableRows(String(reader.result))); reader.readAsText(file); };
    $('#downloadCsvBtn').onclick = () => downloadFile('forecast-template.csv', TEMPLATE, 'text/csv');
    $('#runForecastBtn').onclick = () => { transition('COMPUTING', 'Forecast requested'); const result = forecast($('#forecastStudent').value, $('#forecastStandard').value); $('#forecastResult').innerHTML = result.n ? `<div class="metric">${result.lo}–${result.hi}%</div><p><span class="badge ${result.cls}">${result.label}</span> <span class="badge info">${result.conf} confidence</span></p><p class="muted">${result.n} evidence point(s). Use as a planning estimate, not a label.</p>` : '<p class="muted">Not enough evidence for this student and standard.</p>'; transition('SUCCESS', 'Forecast complete'); render(); };
    $('#buildGroupsBtn').onclick = () => { const data = State.workerCache || computeSync(); $('#groupOutput').innerHTML = data.groups.map((group) => `<article class="card"><h3>${escapeHtml(group.standard.code)}: ${escapeHtml(group.standard.desc)}</h3><p><span class="badge warn">Targeted reteach group</span></p><p>${group.kids.map((entry) => `${escapeHtml(entry.student.name)} (${entry.result.p}%)`).join('<br>')}</p><p class="muted">Suggested move: worked example → visual model → 3-question exit check.</p></article>`).join('') || '<article class="card"><p class="muted">No reteach groups detected.</p></article>'; transition('SUCCESS', 'Groups built'); renderDiagnostics(); };
    $('#reportBtn').onclick = () => { $('#report').textContent = ['NEFT LEARNING FORECAST ENGINE REPORT', `Generated: ${new Date().toLocaleString()}`, `Class: ${State.current.class.name}`, `Students: ${State.current.students.length}`, `Standards: ${State.current.standards.length}`, `Evidence records: ${State.current.evidence.length}`, `Class average: ${bound(average(State.current.evidence.map((row) => row.pct)))}%`, '', 'Priority next move:', 'Use Groups for standards with students below 70%. Reteach with a worked example, visual model, and short exit ticket.', '', 'Data quality notes:', validateState().map((issue) => `- ${issue[1]}`).join('\n') || '- No major issues found.', '', 'Safety note: Forecast needs. Do not label students. Use teacher judgment.'].join('\n'); };
    $('#csvBtn').onclick = () => downloadFile('forecast-evidence.csv', 'studentId,standard,score,maxScore,percent,date,assessment\n' + State.current.evidence.map((row) => [row.student, row.standard, row.score, row.max, row.pct, row.date, row.assessment].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
    $('#jsonBtn').onclick = () => downloadFile('forecast-backup.json', JSON.stringify(State.current, null, 2), 'application/json');
    $('#saveProfileBtn').onclick = () => { const profile = $('#profileName').value.trim() || State.current.profile || 'Default'; State.current.profile = profile; localStorage.setItem(PROFILE_PREFIX + profile, JSON.stringify(State.current)); transition('SUCCESS', `Profile saved: ${profile}`); render(); };
    $('#loadProfileBtn').onclick = () => { const profile = $('#profileName').value.trim(); const raw = localStorage.getItem(PROFILE_PREFIX + profile); if (!raw) return alert('Profile not found.'); State.current = normalizeState(JSON.parse(raw)); transition('SUCCESS', `Profile loaded: ${profile}`); persist(); };
    $('#sampleBtn').onclick = () => { State.current = seedState(); transition('SUCCESS', 'Sample data loaded'); persist(); };
    $('#clearBtn').onclick = () => { if (!confirm('Clear all local Forecast Engine data?')) return; State.current = { ...seedState(), students: [], standards: [], evidence: [], log: [] }; transition('SUCCESS', 'Local data cleared'); persist(); };
    $('#runSelfTestBtn').onclick = () => { $('#settingsStatus').innerHTML = runSelfTest().map((test) => `<p><span class="badge ${test.pass ? 'ok' : 'bad'}">${test.pass ? 'PASS' : 'FAIL'}</span> ${escapeHtml(test.name)}</p>`).join(''); render(); };
    let clicks = 0, timer = null;
    $('#diagnosticHotspot').onclick = () => { clicks += 1; clearTimeout(timer); timer = setTimeout(() => { clicks = 0; }, 800); if (clicks >= 3) { $('#diag').classList.add('open'); renderDiagnostics(); clicks = 0; } };
    $('#closeDiagBtn').onclick = () => $('#diag').classList.remove('open');
    $('#diagTestBtn').onclick = () => { $('#diagText').textContent = JSON.stringify(runSelfTest(), null, 2); render(); };
  }

  function bootWorker() { try { State.worker = new Worker('./forecast.worker.js'); } catch { State.worker = null; } }

  State.current = loadState();
  bootWorker();
  wireEvents();
  render();
})();
