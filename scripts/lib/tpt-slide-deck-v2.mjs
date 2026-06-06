/**
 * TPT Top 1% slide deck builder v2 (~38–44 slides per lesson).
 * Premium teacher cues, real interactivity, scaffolded I/We/You, CFU cadence.
 */

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function badge(themeEmoji, themeName) {
  return `<span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${esc(themeEmoji)} ${esc(themeName)}</span>`;
}

function teacherCue(type, text) {
  const icons = { say: '👩‍🏫', ask: '❓', time: '⏱️', students: '👨‍🎓', materials: '📦' };
  const labels = { say: 'Say', ask: 'Ask', time: 'Time', students: 'Students', materials: 'Materials' };
  return `<div class="teacher-cue teacher-cue-${type}">
    <span class="teacher-cue-icon">${icons[type] || '👩‍🏫'}</span>
    <span class="teacher-cue-label">${labels[type] || type}:</span>
    <span class="teacher-cue-text">${text}</span>
  </div>`;
}

function learningHeader(contentObj) {
  return `<div class="learning-target-bar">
    <span class="lt-icon">🎯</span>
    <span class="lt-text">${esc(contentObj)}</span>
  </div>`;
}

function wrapSlide(id, active, inner, meta = {}) {
  const section = meta.section ? ` data-section="${esc(meta.section)}"` : '';
  const type = meta.type ? ` data-slide-type="${esc(meta.type)}"` : '';
  const notes = meta.notes ? ` data-teacher-notes="${esc(meta.notes)}"` : '';
  return `<div class="slide-body${active ? ' active' : ''}" id="slide-${id}"${section}${type}${notes}>${inner}</div>`;
}

function thumb(id, label, preview, active = false) {
  return `
      <div class="thumb-card${active ? ' active' : ''}" data-slide="${id}" onclick="goToSlide(${id})">
        <span class="thumb-label">Slide ${id}</span>
        <div class="thumb-preview">${preview}</div>
      </div>`;
}

function pickPractice(problems, type) {
  if (!problems) return null;
  return problems.find((p) => p.type === type) || null;
}

function collectMcProblems(data) {
  const pools = [
    ...(data.practice?.onLevel || []),
    ...(data.practice?.approaching || []),
    ...(data.practice?.optional || []),
    ...(data.practice?.extending || []),
  ];
  return pools.filter((p) => p.type === 'multiple-choice');
}

function vocabSvgIllustration(term, visual, themeEmoji) {
  const display = visual ? esc(visual) : esc(term);
  return `<svg class="vocab-illustration" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="120" rx="10" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="2"/>
    <text x="100" y="35" text-anchor="middle" font-size="28">${themeEmoji}</text>
    <text x="100" y="72" text-anchor="middle" font-family="Outfit,sans-serif" font-size="11" font-weight="700" fill="var(--navy)">${display}</text>
    <line x1="30" y1="88" x2="170" y2="88" stroke="var(--teal)" stroke-width="1" stroke-dasharray="4,3"/>
    <text x="100" y="105" text-anchor="middle" font-family="Hanken Grotesk,sans-serif" font-size="9" fill="var(--gray)">Use in context ↓</text>
  </svg>`;
}

function buildRevealSteps(lines, prefix, title, themeEmoji, themeName, contentObj) {
  const steps = (lines || []).map((line, idx) => {
    const stepNum = idx + 1;
    return `<div class="reveal-step" id="${prefix}-step-${stepNum}">
      <button class="reveal-btn" onclick="revealStep('${prefix}', ${stepNum})">
        <span class="reveal-num">${stepNum}</span> Click to reveal step ${stepNum}
      </button>
      <div class="reveal-content hidden">
        <div class="reveal-line">${esc(line)}</div>
      </div>
    </div>`;
  }).join('');

  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, title)}
    <div class="slide-card reveal-card">
      ${teacherCue('say', 'Reveal one step at a time. Pause after each step for students to process.')}
      ${teacherCue('time', '3–4 min')}
      <div class="reveal-steps-container">${steps || '<p class="card-desc">No steps defined.</p>'}</div>
      <button class="assess-btn reveal-all-btn" onclick="revealAllSteps('${prefix}', ${(lines || []).length})" style="margin-top:10px; font-size:10px;">Reveal All Steps</button>
    </div>`;
}

function slideHeader(themeEmoji, themeName, title) {
  return `
    <div class="slide-badge-row">${badge(themeEmoji, themeName)}</div>
    <h3 class="slide-main-title">${title}</h3>`;
}

function buildMcSlide(problem, prefix, title, themeEmoji, themeName, contentObj, teacherSay) {
  if (!problem) return null;
  const stem = problem.stem || 'Choose the best answer.';
  const choices = problem.choices || [];
  const correctIndex = problem.correctIndex ?? 0;
  const choicesHtml = choices
    .map(
      (choice, idx) =>
        `<button class="assess-btn mc-btn mc-animate" id="btn-${prefix}-${idx}" onclick="checkMCQuestionByPrefix('${prefix}', ${idx}, ${correctIndex})">
        <span class="mc-letter">${String.fromCharCode(65 + idx)}</span>
        <span class="mc-choice-text">${esc(choice)}</span>
      </button>`
    )
    .join('');

  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, title)}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge badge-teal">📝 QUICK CHECK</span>
        ${teacherCue('ask', teacherSay || 'Give students 30 seconds, then poll A B C D.')}
        ${teacherCue('time', '2 min')}
        <p class="card-desc mc-stem">${esc(stem)}</p>
        <div class="mc-choices">${choicesHtml}</div>
        <div id="${prefix}-feedback" class="mc-feedback"></div>
      </div>
      <div class="slide-card card-teal-light">
        <h2 class="card-title">✍️ Show Your Work</h2>
        <p class="card-desc-sm">Explain why your answer is correct using today's vocabulary.</p>
        <textarea id="${prefix}-work" class="slide-input-placeholder" rows="6" placeholder="Type your reasoning here..."></textarea>
        ${problem.explanation ? `<div class="teacher-reveal-box"><strong>Teacher reveal:</strong> ${esc(problem.explanation)}</div>` : ''}
      </div>
    </div>`;
}

function buildVocabRichCard(v, themeEmoji) {
  const term = v.term || '';
  const termEs = v.termEs || '';
  const definition = v.definition || '';
  const definitionEs = v.definitionEs || '';
  const visual = v.visual || '';
  const cloze = v.cloze || '';
  const exampleSentence = visual || `We use ${term} when we solve today's problems.`;

  return `
    <div class="vocab-rich-card">
      <div class="vocab-rich-visual">${vocabSvgIllustration(term, visual, themeEmoji)}</div>
      <div class="vocab-rich-content">
        <h2 class="vocab-term">${esc(term)}</h2>
        ${termEs ? `<p class="vocab-term-es">${esc(termEs)}</p>` : ''}
        <p class="vocab-definition">${esc(definition)}</p>
        ${definitionEs ? `<p class="vocab-definition-es">${esc(definitionEs)}</p>` : ''}
        <div class="vocab-example-box">
          <strong>Example:</strong> ${esc(exampleSentence)}
        </div>
        ${cloze ? `<div class="vocab-use-context">
          <strong>Use in context:</strong> ${esc(cloze)}
          <textarea class="slide-input-placeholder vocab-context-input" rows="2" placeholder="Write your own sentence using ${esc(term)}..."></textarea>
        </div>` : ''}
      </div>
    </div>`;
}

function buildTurnAndTalkSlide(talk, title, themeEmoji, themeName, contentObj, timerId, seconds = 90) {
  if (!talk) return null;
  const stems = (talk.stems || [])
    .map((s) => `<div class="tt-stem">✍️ ${esc(s.en || s)}</div>`)
    .join('');
  const wordBank = (talk.wordBank || [])
    .map((w) => `<span class="vocab-pill" onclick="insertAtCursor(this.textContent)">${esc(w)}</span>`)
    .join('');

  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, title)}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge badge-amber">🗣️ TURN &amp; TALK</span>
        ${teacherCue('say', 'Partner A shares first for 45 seconds, then Partner B.')}
        ${teacherCue('students', 'Turn to your elbow partner. Use the sentence stems.')}
        ${teacherCue('time', `${seconds} sec`)}
        <p class="card-desc tt-question">${esc(talk.question || '')}</p>
        <div class="tt-stems-box">
          <strong>Sentence stems:</strong>
          ${stems || '<div class="tt-stem">Partner A shares first, then Partner B.</div>'}
        </div>
        ${wordBank ? `<div class="tt-wordbank"><strong>WORD BANK:</strong><div>${wordBank}</div></div>` : ''}
        <div class="turn-talk-timer" id="tt-timer-${timerId}">
          <button class="assess-btn tt-start" onclick="startTurnTalkTimer('${timerId}', ${seconds})">▶ Start ${seconds}s Timer</button>
          <span class="tt-countdown" id="tt-countdown-${timerId}">${seconds}s</span>
        </div>
      </div>
      <div class="slide-card card-coral">
        <h2 class="card-title">👂 Listen For</h2>
        <p class="card-desc-sm">${esc(talk.listenFor || 'Strong answers use precise math vocabulary and connect to the key idea.')}</p>
        <textarea class="slide-input-placeholder" rows="5" placeholder="Record one strong idea you heard from your partner..."></textarea>
        ${talk.extend ? `<p class="tt-extend"><strong>Extend:</strong> ${esc(talk.extend)}</p>` : ''}
      </div>
    </div>`;
}

function buildRealDragSortSlide(problem, themeEmoji, themeName, contentObj, sortId) {
  if (!problem) return null;
  const items = (problem.items || []).slice(0, 8);
  const categories = problem.categories || [];
  const itemButtons = items
    .map(
      (item, idx) =>
        `<div class="drag-item" draggable="true" data-item-idx="${idx}" data-correct-cat="${esc(item.category || '')}" id="drag-item-${sortId}-${idx}">
          <span class="drag-grip">⠿</span>${esc(item.text || item)}
        </div>`
    )
    .join('');
  const dropZones = categories
    .map(
      (c) =>
        `<div class="drag-drop-zone" data-cat-id="${esc(c.id || c.label || c)}" ondragover="dragOverZone(event)" ondrop="dropOnZone(event, '${sortId}')">
          <div class="drag-zone-label">${esc(c.label || c)}</div>
          <div class="drag-zone-items" id="zone-${sortId}-${esc(c.id || c.label || c)}"></div>
        </div>`
    )
    .join('');

  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Sort &amp; Categorize')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge badge-teal">↕️ DRAG-SORT</span>
        ${teacherCue('students', 'Drag each card into the correct category. Touch or mouse both work.')}
        ${teacherCue('time', '4 min')}
        <p class="card-desc">${esc(problem.instructions || 'Sort each item into the correct category.')}</p>
        <div class="drag-pool" id="drag-pool-${sortId}" ondragover="dragOverZone(event)" ondrop="dropOnZone(event, '${sortId}')">${itemButtons}</div>
        <div class="drag-zones">${dropZones}</div>
        <div id="drag-feedback-${sortId}" class="drag-feedback"></div>
        <button class="assess-btn" onclick="checkDragSort('${sortId}')" style="margin-top:8px; font-size:10px;">Check My Sort ✓</button>
      </div>
      <div class="slide-card card-teal-light">
        <h2 class="card-title">Justify Your Sort</h2>
        <textarea class="slide-input-placeholder" rows="6" placeholder="Explain how you decided which category each item belongs in..."></textarea>
      </div>
    </div>`;
}

function buildCfuSlide(cfuNum, themeEmoji, themeName, prompt) {
  return `
    ${slideHeader(themeEmoji, themeName, `Check for Understanding #${cfuNum}`)}
    <div class="slide-card cfu-card">
      <span class="slide-badge badge-amber">✋ CFU · THUMBS</span>
      ${teacherCue('ask', prompt || 'Thumbs up if you can explain the key idea. Thumbs sideways if you need one more example. Thumbs down if you need help.')}
      ${teacherCue('time', '30 sec')}
      <div class="cfu-poll">
        <button class="assess-btn cfu-btn" onclick="setCfuResponse(${cfuNum}, 'up')">👍 Got it</button>
        <button class="assess-btn cfu-btn" onclick="setCfuResponse(${cfuNum}, 'side')">🤚 Almost</button>
        <button class="assess-btn cfu-btn" onclick="setCfuResponse(${cfuNum}, 'down')">👎 Need help</button>
      </div>
      <div id="cfu-feedback-${cfuNum}" class="cfu-feedback"></div>
      <p class="cfu-teacher-tip"><strong>Teacher:</strong> If &gt;30% thumbs down, re-teach with a fresh example before moving on.</p>
    </div>`;
}

function buildWhiteboardCfu(themeEmoji, themeName, contentObj) {
  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Whiteboard Moment')}
    <div class="slide-card cfu-card">
      <span class="slide-badge badge-teal">🖊️ WHITEBOARD CFU</span>
      ${teacherCue('students', 'On your whiteboard or paper, solve ONE quick problem using today\'s strategy. Hold it up when done.')}
      ${teacherCue('time', '2 min')}
      <div class="whiteboard-prompt">
        <p>Show your work clearly. Be ready to explain your thinking to a partner.</p>
      </div>
      <textarea class="slide-input-placeholder" rows="4" placeholder="Teacher: jot a sample student response or note common errors here..."></textarea>
    </div>`;
}

function buildDifferentiationSlide(data, themeEmoji, themeName) {
  const approaching = (data.practice?.approaching || [])[0];
  const onLevel = (data.practice?.onLevel || [])[0];
  const extending = (data.practice?.extending || [])[0];

  const path = (label, color, problem, desc) => {
    const stem = problem?.stem || desc || 'Practice at this level.';
    return `<div class="diff-path" style="--path-color:${color}">
      <div class="diff-path-label">${label}</div>
      <p class="diff-path-stem">${esc(stem)}</p>
    </div>`;
  };

  return `
    ${slideHeader(themeEmoji, themeName, 'Differentiation Paths')}
    <div class="slide-card">
      <span class="slide-badge badge-teal">🎯 THREE PATHS</span>
      ${teacherCue('say', 'All students work on math — choose the path that matches readiness.')}
      ${teacherCue('time', '8–10 min independent or partner')}
      <div class="diff-paths-grid">
        ${path('🌱 Approaching', 'var(--amber)', approaching, 'Scaffolded practice with visual supports.')}
        ${path('🎯 On-Level', 'var(--teal)', onLevel, 'Core practice aligned to the standard.')}
        ${path('🚀 Challenge', 'var(--navy)', extending, 'Extension with error analysis or multi-step reasoning.')}
      </div>
    </div>`;
}

function buildStudentWorkspaceSlide(explore, themeEmoji, themeName, contentObj) {
  const headers = explore.headers || ['Column A', 'Column B'];
  const rawRows = explore.rows || [['', ''], ['', ''], ['', '']];
  const rows = rawRows.map((row) => (Array.isArray(row) ? row : [row]));
  const editable = explore.editableCells || [];

  let tableHtml = '<table class="workspace-table"><thead><tr>';
  headers.forEach((h) => { tableHtml += `<th>${esc(h)}</th>`; });
  tableHtml += '</tr></thead><tbody>';
  rows.forEach((row, rIdx) => {
    tableHtml += '<tr>';
    row.forEach((cell, cIdx) => {
      const edit = editable.find((e) => e.row === rIdx && e.col === cIdx);
      if (edit) {
        tableHtml += `<td><input type="text" class="workspace-cell" data-answer="${esc(edit.answer)}" placeholder="?" /></td>`;
      } else {
        tableHtml += `<td class="workspace-fixed">${esc(cell)}</td>`;
      }
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</tbody></table>';

  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Student Workspace')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge badge-teal">📊 FILL THE TABLE</span>
        ${teacherCue('students', 'Complete the missing cells. Check with a partner before we discuss.')}
        ${teacherCue('time', '5 min')}
        <p class="card-desc-sm">${esc(explore.instructions || 'Fill in the table using today\'s strategy.')}</p>
        ${tableHtml}
        <button class="assess-btn" onclick="checkWorkspaceCells()" style="margin-top:8px; font-size:10px;">Check Answers ✓</button>
        <div id="workspace-feedback" class="workspace-feedback"></div>
      </div>
      <div class="slide-card card-sketch">
        <h2 class="card-title">✏️ Sketch Your Strategy</h2>
        <canvas id="sketch-canvas" class="sketch-canvas" width="400" height="200"></canvas>
        <button class="assess-btn" onclick="clearSketchCanvas()" style="margin-top:6px; font-size:10px;">Clear Sketch</button>
      </div>
    </div>`;
}

function buildErrorAnalysisSlide(practiceHtml) {
  return practiceHtml;
}

function buildVocabMatchSlide(vocabList, themeEmoji, themeName, contentObj) {
  const withSentences = vocabList.filter((v) => v.sentences && v.sentences.length);
  if (!withSentences.length) return null;
  const v = withSentences[0];
  const sentences = v.sentences.slice(0, 3);
  const rows = sentences
    .map(
      (s, idx) =>
        `<button class="assess-btn vocab-match-btn" id="vocab-match-${idx}" onclick="checkVocabMatch(${idx}, ${s.correct ? 'true' : 'false'})">${esc(s.text)}</button>`
    )
    .join('');

  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Vocabulary — True or False?')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge badge-amber">✅ VOCAB CHECK</span>
        ${teacherCue('ask', 'Which statements correctly use the vocabulary word?')}
        <p class="card-desc">Which statements correctly use <strong>${esc(v.term)}</strong>?</p>
        ${rows}
        <div id="vocab-match-feedback" class="mc-feedback"></div>
      </div>
      <div class="slide-card card-teal-light">
        <h2 class="card-title">Fix the False One</h2>
        <textarea class="slide-input-placeholder" rows="5" placeholder="Rewrite any incorrect statement..."></textarea>
      </div>
    </div>`;
}

function buildVocabClozeSlide(vocabList, themeEmoji, themeName, contentObj) {
  const withCloze = vocabList.filter((v) => v.cloze);
  if (!withCloze.length) return null;
  const options = withCloze.slice(0, 4);
  const target = options[0];
  const buttons = options
    .map(
      (v, idx) =>
        `<button class="assess-btn" onclick="checkVocabCloze(${idx}, 0)" style="display:block; width:100%; text-align:left; margin-bottom:6px; font-size:11px; padding:8px 10px;">${esc(v.term)}</button>`
    )
    .join('');

  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Which Word Fits?')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge badge-teal">❓ CLOZE POLL</span>
        ${teacherCue('ask', 'Vote A B C D — then defend your choice.')}
        <p class="card-desc mc-stem">${esc(target.cloze)}</p>
        ${buttons}
        <div id="vocab-cloze-feedback" class="mc-feedback"></div>
      </div>
      <div class="slide-card card-coral">
        <h2 class="card-title">Use It In a Sentence</h2>
        <textarea class="slide-input-placeholder" rows="5" placeholder="Write your own sentence using ${esc(target.term)}..."></textarea>
      </div>
    </div>`;
}

function buildSectionDivider(section, minutes, themeEmoji) {
  return `
    <div class="section-divider">
      <div class="section-divider-emoji">${themeEmoji}</div>
      <h2 class="section-divider-title">${section}</h2>
      <p class="section-divider-time">⏱️ ~${minutes} min</p>
      <div class="section-divider-bar"></div>
    </div>`;
}

function buildExitTicketOpen(stem, themeEmoji, themeName, contentObj) {
  return `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Exit Ticket — Explain')}
    <div class="slide-card">
      <span class="slide-badge badge-teal">📝 EXIT #2</span>
      ${teacherCue('students', 'Answer in 2–3 sentences. Use at least one vocabulary word.')}
      ${teacherCue('time', '3 min')}
      <p class="card-desc mc-stem">${esc(stem)}</p>
      <textarea id="exit-open-response" class="slide-input-placeholder" rows="5" placeholder="Type your explanation here..."></textarea>
    </div>`;
}

/**
 * Build full TPT v2 slide deck HTML fragments.
 */
export function buildTptSlideDeckV2(ctx) {
  const {
    lessonId,
    data,
    themeEmoji,
    themeName,
    standard,
    unit,
    title,
    contentObj,
    langObj,
    launchNarrative,
    launchBadge,
    noticeStemsHtml,
    wonderStemsHtml,
    launchVocabBankHtml,
    conceptHeading,
    conceptText,
    conceptKeyIdea,
    iDoTitle,
    iDoLines,
    weDoTitle,
    weDoLines,
    youDoTitle,
    youDoLines,
    vocabList = [],
    exploreInstructions,
    exploreHtml,
    practiceHtml,
    connectScenario,
    connectPrompt,
    connectFrame,
    connectVocabBankHtml,
    exitTicketHtml,
    exitOpenStem,
    svgVisual,
    interactiveWidget,
    drawingToolbarHtml,
    googleSlidesUrl,
    timeEstimate,
  } = ctx;

  const slides = [];
  const thumbs = [];
  const slideTitles = [];
  const teacherNotesMap = {};
  let n = 0;
  let cfuCount = 0;
  let slidesSinceCfu = 0;

  const add = (preview, titleText, bodyHtml, meta = {}) => {
    n += 1;
    slides.push(wrapSlide(n, n === 1, bodyHtml, meta));
    thumbs.push(thumb(n, `Slide ${n}`, preview, n === 1));
    slideTitles.push(titleText.toUpperCase());
    if (meta.notes) teacherNotesMap[n] = meta.notes;
    slidesSinceCfu += 1;
    return n;
  };

  const maybeCfu = (prompt) => {
    if (slidesSinceCfu >= 4) {
      cfuCount += 1;
      add('✋ CFU', `CFU ${cfuCount}`, buildCfuSlide(cfuCount, themeEmoji, themeName, prompt), { type: 'cfu', section: 'check' });
      slidesSinceCfu = 0;
    }
  };

  const talks = data.turnAndTalk || [];
  const mcProblems = collectMcProblems(data);
  const dragSort = pickPractice(data.practice?.onLevel, 'drag-sort')
    || pickPractice(data.practice?.optional, 'drag-sort')
    || pickPractice(data.practice?.approaching, 'drag-sort');
  const activityUrl = `/lessons/${lessonId}/index.html`;
  const homeworkUrl = `/lessons/${lessonId}/homework.html`;
  const langObjEs = data.languageObjectiveEs || '';

  // 1 Title
  add('🏷️ Title', 'Title', `
    <div class="title-slide">
      <div class="title-emoji">${esc(themeEmoji)}</div>
      <h1 class="title-heading">${esc(data.title || title)}</h1>
      <p class="title-meta">Unit ${unit} · Lesson ${esc(lessonId)} · ${esc(standard)}</p>
      <span class="slide-badge title-theme-badge">${esc(themeName)} THEME</span>
      <p class="title-time">⏱️ ${esc(timeEstimate || '~45 min')}</p>
      ${googleSlidesUrl ? `<a href="${esc(googleSlidesUrl)}" target="_blank" rel="noopener" class="title-gs-link">↗ Open editable Google Slides copy</a>` : ''}
    </div>`, { type: 'title', notes: 'Display while students enter. Start presenter mode with ▶ Present.' });

  // 2 How to use
  add('📖 Guide', 'How to Use', `
    ${slideHeader(themeEmoji, themeName, 'How to Use This Deck')}
    <div class="slide-card how-to-card">
      <div class="how-to-grid">
        <div class="how-to-item"><span>▶</span><strong>Present</strong><p>Click Present or press F11 for fullscreen. Use arrow keys to advance.</p></div>
        <div class="how-to-item"><span>👩‍🏫</span><strong>Teacher cues</strong><p>Blue boxes show exactly what to say, ask, and how long to spend.</p></div>
        <div class="how-to-item"><span>👨‍🎓</span><strong>Student work</strong><p>Text boxes, polls, and drag-sort save automatically in the browser.</p></div>
        <div class="how-to-item"><span>📝</span><strong>Notes</strong><p>Press N or click 📝 in the toolbar for pacing tips and answers.</p></div>
        <div class="how-to-item"><span>🎮</span><strong>Activity link</strong><p>Launch the full HTML activity for independent practice.</p></div>
        <div class="how-to-item"><span>🖨️</span><strong>Print</strong><p>File → Print or the print button for handout copies.</p></div>
      </div>
      ${teacherCue('time', '30 sec — read aloud, then advance')}
    </div>`, { type: 'how-to', notes: 'First day with deck? Spend 30 sec here. Skip on repeat lessons.' });

  // 3 Learning targets
  add('🎯 Targets', 'Learning Targets', `
    ${slideHeader(themeEmoji, themeName, 'Learning Targets')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">🎯 Content Objective <span class="bilingual-tag">/ Objetivo de contenido</span></h2>
        <p class="objective-text">${esc(contentObj)}</p>
        ${teacherCue('say', 'Read the content objective aloud. Ask: "What will you be able to do by the end of class?"')}
      </div>
      <div class="slide-card">
        <h2 class="card-title">🗣️ Language Objective <span class="bilingual-tag">/ Objetivo de lenguaje</span></h2>
        <p class="objective-text">${esc(langObj)}</p>
        ${langObjEs ? `<p class="objective-text-es">${esc(langObjEs)}</p>` : ''}
        ${teacherCue('ask', 'Which vocabulary words do you already know? Which are new?')}
      </div>
    </div>`, { type: 'learning-targets', notes: 'Post objectives on board. Return to these at closure.' });

  // 4 Agenda
  const agendaSteps = [
    { name: 'Warm-Up', min: 5 },
    { name: 'Vocabulary', min: 8 },
    { name: 'I Do', min: 5 },
    { name: 'We Do', min: 5 },
    { name: 'Explore', min: 8 },
    { name: 'Practice', min: 10 },
    { name: 'Connect', min: 5 },
    { name: 'Exit Ticket', min: 5 },
  ];
  add('🗺️ Agenda', 'Agenda', `
    ${slideHeader(themeEmoji, themeName, 'Today&apos;s Flow')}
    <div class="slide-card">
      <div class="agenda-timeline">
        ${agendaSteps.map((step, idx) =>
          `<div class="agenda-step${idx === 0 ? ' agenda-step-active' : ''}">
            <span class="agenda-num">${idx + 1}</span>
            <span class="agenda-name">${step.name}</span>
            <span class="agenda-min">${step.min}m</span>
          </div>`
        ).join('')}
      </div>
      <p class="agenda-total">Total pacing: ${esc(timeEstimate || '~45 min')} · Progress bar at top tracks your place</p>
    </div>`, { type: 'agenda', notes: 'Adjust minutes based on your block schedule.' });

  // 5 Section: Launch
  add('🚀 Launch', 'Launch Section', buildSectionDivider('LAUNCH', 10, themeEmoji), { type: 'section', section: 'launch' });

  // 6 Warm-up
  const warmupQ = talks[0]?.question || launchNarrative;
  add('🔥 Warm-Up', 'Warm-Up Hook', `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Warm-Up Hook')}
    <div class="slide-card warmup-card">
      <span class="slide-badge badge-amber">⏱️ 3 MIN · THINK-PAIR-SHARE</span>
      ${teacherCue('say', 'Think silently for 30 seconds, then share with your partner.')}
      ${teacherCue('ask', esc(warmupQ))}
      ${teacherCue('time', '3 min')}
      <p class="warmup-question">${esc(warmupQ)}</p>
      <div class="warmup-vocab">${launchVocabBankHtml}</div>
      <textarea class="slide-input-placeholder" rows="2" placeholder="Jot one idea from your partner..."></textarea>
    </div>`, { type: 'hook', section: 'launch', notes: talks[0]?.listenFor || 'Listen for prior knowledge connections.' });

  maybeCfu('Can you restate the warm-up question in your own words?');

  // 7 Notice & Wonder
  add('👀 Launch', 'Notice &amp; Wonder', `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Scenario Launch')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">📋 ${esc(launchBadge)}</h2>
        ${teacherCue('say', 'Read the scenario aloud slowly. Give students 10 seconds of think time.')}
        <p class="card-desc">${esc(launchNarrative)}</p>
      </div>
      <div class="slide-card nw-container">
        <div class="nw-box nw-box-notice">
          <h4>👀 Notice:</h4><div class="nw-box-stems">${noticeStemsHtml}</div>
          <textarea id="student-notice" class="slide-input-placeholder" rows="2" placeholder="Type what you notice..."></textarea>
        </div>
        <div class="nw-box nw-box-wonder">
          <h4>💭 Wonder:</h4><div class="nw-box-stems">${wonderStemsHtml}</div>
          <textarea id="student-wonder" class="slide-input-placeholder" rows="2" placeholder="Type what you wonder..."></textarea>
        </div>
      </div>
    </div>`, { type: 'notice-wonder', section: 'launch' });

  // 8 Concept
  add('💡 Concept', 'Concept Launch', `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Concept Launch')}
    <div class="slide-card">
      <h2 class="card-title">💡 ${esc(conceptHeading)}</h2>
      ${teacherCue('say', 'This is the big idea for today. Students should be able to repeat it by the end.')}
      <p class="card-desc">${esc(conceptText)}</p>
      ${conceptKeyIdea ? `<div class="key-idea-box"><strong>Key Idea:</strong><p>${esc(conceptKeyIdea)}</p></div>` : ''}
    </div>`, { type: 'concept', section: 'launch', notes: conceptKeyIdea || '' });

  maybeCfu('Can you state the key idea in one sentence?');

  // 9–11 I Do / We Do / You Do with reveals
  add('👁️ I Do', 'I Do — Watch Me', buildRevealSteps(iDoLines, 'ido', esc(iDoTitle), themeEmoji, themeName, contentObj), { type: 'worked-example', section: 'instruction', notes: 'Reveal one step at a time. Do NOT show all steps at once.' });

  add('👁️ I Do 2', 'I Do — Key Step', buildRevealSteps(iDoLines.slice(-2).length ? iDoLines.slice(-2) : iDoLines.slice(0, 2), 'ido2', 'I Do — Focus Step', themeEmoji, themeName, contentObj), { type: 'worked-example', section: 'instruction', notes: 'Second reveal sequence — focus on the most critical step.' });

  add('🤝 We Do', 'We Do — Together', buildRevealSteps(weDoLines, 'wedo', esc(weDoTitle), themeEmoji, themeName, contentObj), { type: 'worked-example', section: 'instruction', notes: 'Call on students to predict each step before revealing.' });

  maybeCfu('Can you explain what we did in the We Do example?');

  add('✋ You Do', 'You Do — Your Turn', `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, esc(youDoTitle))}
    <div class="slide-grid-2">
      <div class="slide-card">
        ${teacherCue('students', 'Work independently first, then check with a partner.')}
        ${teacherCue('time', '5 min')}
        ${(youDoLines || []).map((line, idx) => `<div class="you-do-line"><span class="you-do-num">${idx + 1}</span>${esc(line)}</div>`).join('')}
      </div>
      <div class="slide-card card-activity-cta">
        <div class="activity-cta-icon">🎮</div>
        <p class="activity-cta-text">Open the interactive HTML activity for full practice.</p>
        <a href="${activityUrl}" target="_blank" class="btn-present activity-cta-btn">Launch Activity ↗</a>
      </div>
    </div>`, { type: 'you-do', section: 'instruction' });

  // Section: Vocabulary
  add('📚 Vocab', 'Vocabulary Section', buildSectionDivider('VOCABULARY', 8, '📚'), { type: 'section', section: 'vocabulary' });

  // Rich vocab — 1 term per slide (up to 4)
  for (let v = 0; v < Math.min(vocabList.length, 4); v++) {
    const term = vocabList[v];
    add('📝 Vocab', `Vocabulary — ${term.term || v + 1}`, `
      ${learningHeader(contentObj)}
      ${slideHeader(themeEmoji, themeName, 'Visual Vocabulary')}
      ${buildVocabRichCard(term, themeEmoji)}
      ${teacherCue('say', `Say the term, definition, and example. Students repeat.`)}
    `, { type: 'vocab-card', section: 'vocabulary', notes: term.definition || '' });
  }

  const vocabMatch = buildVocabMatchSlide(vocabList, themeEmoji, themeName, contentObj);
  if (vocabMatch) add('✅ Vocab', 'Vocab Check', vocabMatch, { type: 'vocab-card', section: 'vocabulary' });

  const vocabCloze = buildVocabClozeSlide(vocabList, themeEmoji, themeName, contentObj);
  if (vocabCloze) add('❓ Vocab', 'Which Word?', vocabCloze, { type: 'interactive-mc', section: 'vocabulary' });

  maybeCfu('Use one vocabulary word in a sentence about today\'s topic.');

  // Turn & Talk Launch with timer
  const ttLaunch = buildTurnAndTalkSlide(talks.find((t) => t.phase === 'launch') || talks[0], 'Turn &amp; Talk — Launch', themeEmoji, themeName, contentObj, 'launch', 90);
  if (ttLaunch) add('🗣️ Discuss', 'Turn & Talk', ttLaunch, { type: 'turn-talk-timer', section: 'discuss', notes: talks.find((t) => t.phase === 'launch')?.listenFor || '' });

  // Section: Explore
  add('🔍 Explore', 'Explore Section', buildSectionDivider('EXPLORE &amp; PRACTICE', 18, '🔍'), { type: 'section', section: 'explore' });

  // Visual model
  add('📐 Model', 'Visual Model', `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Visual Modeling Workspace')}
    <div class="slide-grid-2">
      <div class="slide-card">${drawingToolbarHtml || '<p class="card-desc">Annotate the visual model.</p>'}</div>
      <div class="math-visual-container tool-draw" id="math-visual-container-element">
        <div class="math-visual-inner">${interactiveWidget || svgVisual}</div>
        <canvas id="math-canvas" width="440" height="240" class="canvas-overlay cursor-draw"></canvas>
      </div>
    </div>`, { type: 'worked-example', section: 'explore' });

  // Explore
  add('🔍 Explore', 'Explore', exploreHtml || `${slideHeader(themeEmoji, themeName, 'Explore Activity')}<div class="slide-card"><p>${esc(exploreInstructions)}</p></div>`, { type: 'explore', section: 'explore', notes: exploreInstructions });

  add('🖊️ CFU', 'Whiteboard CFU', buildWhiteboardCfu(themeEmoji, themeName, contentObj), { type: 'cfu', section: 'check' });
  slidesSinceCfu = 0;

  const ttExplore = buildTurnAndTalkSlide(talks.find((t) => t.phase === 'explore'), 'Turn &amp; Talk — Explore', themeEmoji, themeName, contentObj, 'explore', 90);
  if (ttExplore) add('🗣️ Explore', 'Discuss Explore', ttExplore, { type: 'turn-talk-timer', section: 'discuss' });

  // Practice MC
  if (mcProblems[0]) {
    const body = buildMcSlide(mcProblems[0], 'mc1', 'Practice Check A', themeEmoji, themeName, contentObj, 'Give students 1 minute. Cold-call one student to defend their answer.');
    if (body) add('📝 Practice', 'Practice A', body, { type: 'interactive-mc', section: 'practice' });
  }
  if (mcProblems[1]) {
    const body = buildMcSlide(mcProblems[1], 'mc2', 'Practice Check B', themeEmoji, themeName, contentObj, 'Partner discussion first, then vote.');
    if (body) add('📝 Practice', 'Practice B', body, { type: 'interactive-mc', section: 'practice' });
  }

  maybeCfu('Can you solve a similar problem without help?');

  // Real drag sort
  const dragHtml = buildRealDragSortSlide(dragSort, themeEmoji, themeName, contentObj, lessonId.replace(/[^a-z0-9]/gi, ''));
  if (dragHtml) add('↕️ Sort', 'Drag Sort', dragHtml, { type: 'drag-sort', section: 'practice' });

  // Error analysis
  add('⚠️ Error', 'Error Analysis', `${learningHeader(contentObj)}${slideHeader(themeEmoji, themeName, 'Find the Mistake')}${buildErrorAnalysisSlide(practiceHtml)}`, { type: 'error-analysis', section: 'practice', notes: data.practice?.commonMistake || '' });

  // Student workspace
  add('📊 Workspace', 'Student Workspace', buildStudentWorkspaceSlide(data.explore || {}, themeEmoji, themeName, contentObj), { type: 'student-workspace', section: 'practice' });

  // Differentiation
  add('🎯 Diff', 'Differentiation', buildDifferentiationSlide(data, themeEmoji, themeName), { type: 'differentiation', section: 'practice' });

  // Partner activity
  add('🤝 Partner', 'Partner Activity', `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Partner Activity')}
    <div class="slide-card">
      <span class="slide-badge badge-amber">🤝 PARTNER WORK</span>
      ${teacherCue('materials', 'Whiteboards or paper, pencils, vocabulary reference cards')}
      ${teacherCue('students', 'Partner A solves, Partner B coaches. Switch roles on the next problem.')}
      ${teacherCue('time', '6 min')}
      <p class="card-desc">Work with your partner on the practice problems at your differentiation path level. Explain each step using math vocabulary.</p>
      <textarea class="slide-input-placeholder" rows="4" placeholder="Partners: write one thing you learned from each other..."></textarea>
    </div>`, { type: 'partner-activity', section: 'practice' });

  maybeCfu('Thumbs up if you and your partner agree on your answer.');

  // Connect
  add('🌍 Connect', 'Math in the Wild', `
    ${learningHeader(contentObj)}
    ${slideHeader(themeEmoji, themeName, 'Real-World Connection')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">🌍 Math in the Wild</h2>
        ${teacherCue('say', 'Read the scenario. Ask: where else have you seen this kind of math?')}
        <p class="card-desc">${esc(connectScenario)}</p>
        <div class="connect-vocab">${connectVocabBankHtml}</div>
      </div>
      <div class="slide-card card-teal-light">
        <h2 class="card-title">✍️ Connection Reasoning</h2>
        <p class="card-desc-sm">${esc(connectPrompt)}</p>
        ${connectFrame ? `<p class="connect-frame">${esc(connectFrame)}</p>` : ''}
        <textarea id="rw-connect-work" class="slide-input-placeholder" rows="4" placeholder="Write your connection..."></textarea>
      </div>
    </div>`, { type: 'real-world', section: 'connect' });

  const ttConnect = buildTurnAndTalkSlide(talks.find((t) => t.phase === 'connect'), 'Turn &amp; Talk — Connect', themeEmoji, themeName, contentObj, 'connect', 90);
  if (ttConnect) add('🗣️ Connect', 'Discuss Connect', ttConnect, { type: 'turn-talk-timer', section: 'connect' });

  // Section: Closure
  add('✅ Close', 'Closure Section', buildSectionDivider('CLOSURE &amp; REFLECT', 8, '✅'), { type: 'section', section: 'closure' });

  // Exit tickets
  add('📝 Exit', 'Exit Ticket', `${learningHeader(contentObj)}${slideHeader(themeEmoji, themeName, 'Exit Ticket')}<div class="slide-card">${exitTicketHtml}</div>`, { type: 'exit-ticket', section: 'closure' });

  add('📝 Exit 2', 'Exit Ticket Explain', buildExitTicketOpen(exitOpenStem || `Explain the key idea from today's lesson in your own words. Use at least one vocabulary word.`, themeEmoji, themeName, contentObj), { type: 'exit-ticket', section: 'closure' });

  if (mcProblems[2]) {
    const body = buildMcSlide(mcProblems[2], 'exit3', 'Bonus Exit Check', themeEmoji, themeName, contentObj, 'Optional for early finishers.');
    if (body) add('📝 Bonus', 'Bonus Check', body, { type: 'interactive-mc', section: 'closure' });
  }

  // Reflection
  add('🤔 Reflect', 'Reflection', `
    ${slideHeader(themeEmoji, themeName, 'Reflection &amp; Self-Assessment')}
    <div class="slide-grid-2">
      <div class="slide-card post-it-container">
        <div class="post-it-grid">
          <div class="sticky-note post-it-3"><div class="post-it-title">3 Things I learned:</div>
            <input type="text" id="ref-3-1" placeholder="1." /><input type="text" id="ref-3-2" placeholder="2." /><input type="text" id="ref-3-3" placeholder="3." /></div>
          <div class="sticky-note post-it-2"><div class="post-it-title">2 Connections:</div>
            <input type="text" id="ref-2-1" placeholder="1." /><input type="text" id="ref-2-2" placeholder="2." /></div>
          <div class="sticky-note post-it-1"><div class="post-it-title">1 Question:</div>
            <input type="text" id="ref-1-1" placeholder="..." /></div>
        </div>
      </div>
      <div class="slide-card card-teal-light">
        <strong class="self-assess-label">Self-Assessment:</strong>
        <div class="assess-row">
          <button class="assess-btn" id="btn-gotit" onclick="setSelfAssessment('gotit')">Got it! 👍</button>
          <button class="assess-btn" id="btn-getting" onclick="setSelfAssessment('getting')">Almost 🧭</button>
          <button class="assess-btn" id="btn-help" onclick="setSelfAssessment('help')">Help 🆘</button>
        </div>
      </div>
    </div>`, { type: 'exit-ticket', section: 'closure' });

  // Activity CTA
  add('🎮 Activity', 'Digital Activity', `
    ${slideHeader(themeEmoji, themeName, 'Continue Learning')}
    <div class="slide-card activity-cta-slide">
      <div class="activity-cta-icon">🎮</div>
      <h2 class="activity-cta-heading">Launch the Full Interactive Activity</h2>
      <p class="card-desc">Students continue practice in the HTML lesson engine with auto-check, hints, and differentiation.</p>
      <div class="activity-cta-buttons">
        <a href="${activityUrl}" target="_blank" class="btn-present activity-cta-btn">Open Lesson Activity ↗</a>
        <a href="${homeworkUrl}" target="_blank" class="btn-present activity-cta-btn-secondary">Family Homework ↗</a>
      </div>
      ${teacherCue('say', 'Early finishers: open the activity. Everyone else: start homework tonight.')}
    </div>`, { type: 'activity-link', section: 'closure' });

  // Family homework
  add('🏠 Home', 'Family Connection', `
    ${slideHeader(themeEmoji, themeName, 'Family Connection')}
    <div class="slide-card family-card">
      <p class="family-prompt">Share tonight&apos;s family homework and discuss one vocabulary word at home.</p>
      <a href="${homeworkUrl}" target="_blank" class="btn-present activity-cta-btn">Open Family Homework ↗</a>
      ${teacherCue('say', 'Tell families: "Ask your student to teach you one thing from today\'s lesson."')}
    </div>`, { type: 'activity-link', section: 'closure' });

  // Teacher notes
  const listenFors = talks.map((t) => t.listenFor).filter(Boolean).slice(0, 4);
  add('👩‍🏫 Notes', 'Teacher Notes', `
    ${slideHeader(themeEmoji, themeName, 'Teacher Notes')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">⏱️ Pacing Guide</h2>
        <ul class="notes-list">
          <li><strong>Launch &amp; vocab:</strong> 12 min</li>
          <li><strong>I Do / We Do / You Do:</strong> 15 min</li>
          <li><strong>Explore &amp; practice:</strong> 15 min</li>
          <li><strong>Connect &amp; closure:</strong> 8 min</li>
        </ul>
        <p class="notes-total">Total: ${esc(timeEstimate || '~45 min')}</p>
      </div>
      <div class="slide-card card-coral">
        <h2 class="card-title">🎯 Listen For · Common Errors</h2>
        ${listenFors.map((l) => `<p class="notes-listen">• ${esc(l)}</p>`).join('') || '<p class="notes-listen">Students use precise vocabulary and justify with the key idea.</p>'}
        ${data.practice?.commonMistake ? `<p class="notes-mistake"><strong>Common mistake:</strong> ${esc(data.practice.commonMistake)}</p>` : ''}
      </div>
    </div>`, { type: 'teacher-notes', notes: 'Hide during presentation — use Notes panel (N key).' });

  // Answer key
  const answers = [];
  mcProblems.slice(0, 4).forEach((p, idx) => {
    if (p.choices && p.correctIndex !== undefined) {
      answers.push(`Practice ${idx + 1}: ${p.choices[p.correctIndex]} — ${p.explanation || ''}`);
    }
  });
  if (data.reflect?.exitTicket?.choices) {
    const et = data.reflect.exitTicket;
    answers.push(`Exit ticket: ${et.choices[et.correctIndex]} — ${et.explanation || ''}`);
  }

  add('🔑 Key', 'Answer Key', `
    ${slideHeader(themeEmoji, themeName, 'Answer Key (Teacher Appendix)')}
    <div class="slide-card">
      <p class="answer-key-note">Hide this slide during presentation or move to the end of your copy.</p>
      ${answers.map((a) => `<p class="answer-key-item">✓ ${esc(a)}</p>`).join('') || '<p>See lesson config and HTML activity for full answer keys.</p>'}
    </div>`, { type: 'teacher-notes', notes: 'CONFIDENTIAL — do not display to students.' });

  // Activity counts for reporting
  const activityCounts = {
    clickReveal: 3,
    dragSort: dragSort ? 1 : 0,
    mcPoll: Math.min(mcProblems.length, 3) + (vocabCloze ? 1 : 0),
    turnTalk: talks.length,
    errorAnalysis: practiceHtml ? 1 : 0,
    studentWorkspace: 1,
    exitTicket: 2,
    cfu: cfuCount + 1,
  };

  return {
    thumbnailsHtml: thumbs.join('\n'),
    slidesHtml: slides.join('\n\n        '),
    totalSlides: n,
    slideTitles,
    teacherNotesMap,
    activityCounts,
    sections: ['launch', 'vocabulary', 'explore', 'practice', 'connect', 'closure'],
  };
}
