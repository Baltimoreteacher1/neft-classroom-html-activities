/**
 * TPT-quality slide deck builder (~28–34 slides per lesson).
 * Consumes lesson config + precomputed context from generate-slides.mjs.
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

function slideHeader(themeEmoji, themeName, title) {
  return `
    <div class="slide-badge-row">${badge(themeEmoji, themeName)}</div>
    <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:24px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">${title}</h3>`;
}

function wrapSlide(id, active, inner) {
  return `<div class="slide-body${active ? ' active' : ''}" id="slide-${id}">${inner}</div>`;
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

function buildMcSlide(problem, prefix, title, themeEmoji, themeName) {
  if (!problem) return null;
  const stem = problem.stem || 'Choose the best answer.';
  const choices = problem.choices || [];
  const correctIndex = problem.correctIndex ?? 0;
  const choicesHtml = choices
    .map(
      (choice, idx) =>
        `<button class="assess-btn mc-btn" id="btn-${prefix}-${idx}" onclick="checkMCQuestionByPrefix('${prefix}', ${idx}, ${correctIndex})" style="text-align:left; padding:8px 12px; font-size:12px; margin-bottom:6px; display:flex; align-items:center; width:100%; font-weight:600; line-height:1.4; gap:10px;">
        <span style="background:var(--google-gray); color:var(--navy); width:20px; height:20px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px;">${String.fromCharCode(65 + idx)}</span>
        <span style="flex:1;">${esc(choice)}</span>
      </button>`
    )
    .join('');

  return `
    ${slideHeader(themeEmoji, themeName, title)}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge" style="background:var(--teal); color:var(--white); font-size:10px; padding:3px 8px; border-radius:99px; font-weight:800;">📝 QUICK CHECK</span>
        <p class="card-desc" style="font-size:13px; font-weight:700; line-height:1.4; margin:10px 0 12px; color:var(--navy);">${esc(stem)}</p>
        ${choicesHtml}
        <div id="${prefix}-feedback" style="font-size:11px; font-weight:700; min-height:16px; margin-top:6px;"></div>
      </div>
      <div class="slide-card" style="background:var(--teal-light);">
        <h2 class="card-title">✍️ Show Your Work</h2>
        <p style="font-size:11px; color:var(--navy); margin:0 0 8px;">Explain why your answer is correct using today's vocabulary.</p>
        <textarea id="${prefix}-work" class="slide-input-placeholder" rows="7" placeholder="Type your reasoning here..."></textarea>
        ${problem.explanation ? `<div style="margin-top:8px; font-size:10px; background:var(--white); padding:6px 8px; border-radius:6px; border:1px dashed var(--teal);"><strong>Teacher reveal:</strong> ${esc(problem.explanation)}</div>` : ''}
      </div>
    </div>`;
}

function buildVocabCardsHtml(vocabList, start = 0, count = 2) {
  return vocabList
    .slice(start, start + count)
    .map((v) => {
      const term = v.term || '';
      const termEs = v.termEs || '';
      const definition = v.definition || '';
      const definitionEs = v.definitionEs || '';
      const visual = v.visual || '';
      const cloze = v.cloze || '';
      return `
      <div class="vocab-card" onclick="this.classList.toggle('flipped')">
        <div class="vocab-card-inner">
          <div class="vocab-card-front">
            <h3>${esc(term.toUpperCase())}</h3>
            ${termEs ? `<p style="font-size:10px; color:var(--gray); font-style:italic; margin: 4px 0 0;">${esc(termEs)}</p>` : ''}
            <p class="click-hint">Click to flip ➔</p>
          </div>
          <div class="vocab-card-back">
            <p style="font-weight:700; margin:0 0 6px; color:var(--navy); font-size:10.5px; line-height:1.3;">${esc(definition)}</p>
            ${definitionEs ? `<p style="font-size:9.5px; color:var(--gray); margin:0 0 8px; font-style:italic;">${esc(definitionEs)}</p>` : ''}
            ${visual ? `<div style="border-top:1px dashed var(--teal); padding-top:4px; font-size:9px; font-style:italic;"><strong>Ex:</strong> ${esc(visual)}</div>` : ''}
            ${cloze ? `<div style="margin-top:4px; font-size:9px; background:var(--white); padding:3px; border-radius:3px; border:1px solid #e1eaef;">📝 ${esc(cloze)}</div>` : ''}
          </div>
        </div>
      </div>`;
    })
    .join('');
}

function buildTurnAndTalkSlide(talk, title, themeEmoji, themeName) {
  if (!talk) return null;
  const stems = (talk.stems || [])
    .map((s) => `<div style="font-size:11px; margin-bottom:4px;">✍️ ${esc(s.en || s)}</div>`)
    .join('');
  const wordBank = (talk.wordBank || [])
    .map((w) => `<span class="vocab-pill" onclick="insertAtCursor(this.textContent)">${esc(w)}</span>`)
    .join('');

  return `
    ${slideHeader(themeEmoji, themeName, title)}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge" style="background:var(--amber); color:var(--navy); font-size:10px; padding:3px 8px; border-radius:99px; font-weight:800;">🗣️ TURN &amp; TALK · 2 MIN</span>
        <p class="card-desc" style="font-size:13px; font-weight:700; line-height:1.5; margin:10px 0;">${esc(talk.question || '')}</p>
        <div style="background:var(--teal-light); border-radius:8px; padding:8px; margin-top:8px;">
          <strong style="font-size:10px; color:var(--navy);">Sentence stems:</strong>
          ${stems || '<div style="font-size:11px;">Partner A shares first, then Partner B.</div>'}
        </div>
        ${wordBank ? `<div style="margin-top:8px;"><strong style="font-size:9px; color:var(--gray);">WORD BANK:</strong><div style="margin-top:4px;">${wordBank}</div></div>` : ''}
      </div>
      <div class="slide-card" style="background:var(--coral);">
        <h2 class="card-title">👂 Listen For</h2>
        <p style="font-size:11.5px; line-height:1.5; margin:0 0 10px;">${esc(talk.listenFor || 'Strong answers use precise math vocabulary and connect to the key idea.')}</p>
        <textarea class="slide-input-placeholder" rows="5" placeholder="Record one strong idea you heard from your partner..."></textarea>
        ${talk.extend ? `<p style="font-size:10px; margin-top:8px; font-style:italic;"><strong>Extend:</strong> ${esc(talk.extend)}</p>` : ''}
      </div>
    </div>`;
}

function buildDragSortSlide(problem, themeEmoji, themeName) {
  if (!problem) return null;
  const items = problem.items || [];
  const categories = problem.categories || [];
  const itemButtons = items
    .slice(0, 6)
    .map(
      (item, idx) =>
        `<button class="assess-btn" style="font-size:10px; padding:6px 8px; margin:3px;" onclick="this.classList.toggle('correct')">${esc(item.text || item)}</button>`
    )
    .join('');
  const catLabels = categories.map((c) => `<span class="slide-badge" style="background:var(--teal-light); color:var(--navy); margin-right:6px;">${esc(c.label || c)}</span>`).join('');

  return `
    ${slideHeader(themeEmoji, themeName, 'Sort &amp; Categorize')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge" style="background:var(--teal); color:var(--white); font-size:10px; padding:3px 8px; border-radius:99px; font-weight:800;">↕️ DRAG-SORT</span>
        <p class="card-desc" style="font-size:12px; line-height:1.4; margin:8px 0;">${esc(problem.instructions || 'Sort each item into the correct category.')}</p>
        <div style="margin:10px 0;">${catLabels}</div>
        <div style="display:flex; flex-wrap:wrap; gap:4px;">${itemButtons}</div>
        <p style="font-size:10px; color:var(--gray); margin-top:10px;">Teacher: click items to mark correct placement, or use the HTML activity for full drag-sort.</p>
      </div>
      <div class="slide-card" style="background:var(--teal-light);">
        <h2 class="card-title">Justify Your Sort</h2>
        <textarea class="slide-input-placeholder" rows="6" placeholder="Explain how you decided which category each item belongs in..."></textarea>
      </div>
    </div>`;
}

function buildVocabMatchSlide(vocabList, themeEmoji, themeName) {
  const withSentences = vocabList.filter((v) => v.sentences && v.sentences.length);
  if (!withSentences.length) return null;
  const v = withSentences[0];
  const sentences = v.sentences.slice(0, 3);
  const rows = sentences
    .map(
      (s, idx) =>
        `<button class="assess-btn" id="vocab-match-${idx}" onclick="checkVocabMatch(${idx}, ${s.correct ? 'true' : 'false'})" style="display:block; width:100%; text-align:left; margin-bottom:6px; font-size:11px; padding:8px 10px;">${esc(s.text)}</button>`
    )
    .join('');

  return `
    ${slideHeader(themeEmoji, themeName, 'Vocabulary — True or False?')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge" style="background:var(--amber); color:var(--navy); font-size:10px; padding:3px 8px; border-radius:99px; font-weight:800;">✅ VOCAB CHECK</span>
        <p class="card-desc" style="font-size:12px; margin:8px 0;">Which statements correctly use <strong>${esc(v.term)}</strong>?</p>
        ${rows}
        <div id="vocab-match-feedback" style="font-size:10px; font-weight:700; min-height:14px;"></div>
      </div>
      <div class="slide-card" style="background:var(--teal-light);">
        <h2 class="card-title">Fix the False One</h2>
        <textarea class="slide-input-placeholder" rows="5" placeholder="Rewrite any incorrect statement so it uses the vocabulary word correctly..."></textarea>
      </div>
    </div>`;
}

function buildVocabClozeSlide(vocabList, themeEmoji, themeName) {
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
    ${slideHeader(themeEmoji, themeName, 'Which Word Fits?')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <span class="slide-badge" style="background:var(--teal); color:var(--white); font-size:10px; padding:3px 8px; border-radius:99px; font-weight:800;">❓ CLOZE POLL</span>
        <p class="card-desc" style="font-size:13px; font-weight:700; margin:10px 0;">${esc(target.cloze)}</p>
        ${buttons}
        <div id="vocab-cloze-feedback" style="font-size:10px; font-weight:700; min-height:14px;"></div>
      </div>
      <div class="slide-card" style="background:var(--coral);">
        <h2 class="card-title">Use It In a Sentence</h2>
        <textarea class="slide-input-placeholder" rows="5" placeholder="Write your own sentence using ${esc(target.term)}..."></textarea>
      </div>
    </div>`;
}

/**
 * Build full TPT slide deck HTML fragments.
 * @param {object} ctx - Precomputed lesson context from generate-slides.mjs
 */
export function buildTptSlideDeck(ctx) {
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
    svgVisual,
    interactiveWidget,
    drawingToolbarHtml,
    googleSlidesUrl,
    timeEstimate,
  } = ctx;

  const slides = [];
  const thumbs = [];
  let n = 0;

  const add = (preview, titleText, bodyHtml) => {
    n += 1;
    slides.push(wrapSlide(n, n === 1, bodyHtml));
    thumbs.push(thumb(n, `Slide ${n}`, preview, n === 1));
    return n;
  };

  const talks = data.turnAndTalk || [];
  const mcProblems = collectMcProblems(data);
  const dragSort = pickPractice(data.practice?.onLevel, 'drag-sort') || pickPractice(data.practice?.optional, 'drag-sort');
  const matchingGame = pickPractice(data.practice?.optional, 'matching-game');
  const activityUrl = `/lessons/${lessonId}/index.html`;
  const homeworkUrl = `/lessons/${lessonId}/homework.html`;

  // 1 Title
  add(
    '🏷️ Title',
    'Title',
    `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; padding:20px;">
      <div style="font-size:48px; margin-bottom:12px;">${esc(themeEmoji)}</div>
      <h1 style="font-family:'Outfit'; font-size:32px; color:var(--navy); margin:0 0 8px; font-weight:800;">${esc(data.title || title)}</h1>
      <p style="font-size:14px; color:var(--gray); font-weight:700; margin:0 0 16px;">Unit ${unit} · Lesson ${esc(lessonId)} · ${esc(standard)}</p>
      <span class="slide-badge" style="background:var(--theme-color); color:var(--white); font-size:12px; padding:6px 14px;">${esc(themeName)} THEME</span>
      ${googleSlidesUrl ? `<a href="${esc(googleSlidesUrl)}" target="_blank" rel="noopener" style="margin-top:16px; font-size:12px; color:var(--teal); font-weight:700;">↗ Open editable Google Slides copy</a>` : ''}
    </div>`
  );

  // 2 Learning targets
  add(
    '🎯 Targets',
    'Learning Targets',
    `
    ${slideHeader(themeEmoji, themeName, 'Learning Targets')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">🎯 Content Objective <span style="font-size:10px; color:var(--gray);">/ Objetivo de contenido</span></h2>
        <p style="font-size:14px; font-weight:600; line-height:1.5; margin:0;">${esc(contentObj)}</p>
      </div>
      <div class="slide-card">
        <h2 class="card-title">🗣️ Language Objective <span style="font-size:10px; color:var(--gray);">/ Objetivo de lenguaje</span></h2>
        <p style="font-size:14px; font-weight:600; line-height:1.5; margin:0;">${esc(langObj)}</p>
      </div>
    </div>`
  );

  // 3 Agenda
  add(
    '🗺️ Agenda',
    'Agenda',
    `
    ${slideHeader(themeEmoji, themeName, 'Today&apos;s Flow')}
    <div class="slide-card">
      <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:10px;">
        ${['Warm-Up', 'Vocabulary', 'I Do', 'We Do', 'Explore', 'Practice', 'Connect', 'Exit Ticket', 'Reflect']
          .map(
            (step, idx) =>
              `<div style="background:${idx === 0 ? 'var(--teal)' : 'var(--teal-light)'}; color:${idx === 0 ? 'white' : 'var(--navy)'}; padding:10px 14px; border-radius:8px; font-size:11px; font-weight:800; min-width:90px; text-align:center;">${idx + 1}. ${step}</div>`
          )
          .join('')}
      </div>
      <p style="text-align:center; font-size:11px; color:var(--gray); margin-top:14px;">Pacing: ${esc(timeEstimate || '~45 min')} · Click Present to start the timer</p>
    </div>`
  );

  // 4 Warm-up hook
  const warmupQ = talks[0]?.question || launchNarrative;
  add(
    '🔥 Warm-Up',
    'Warm-Up Hook',
    `
    ${slideHeader(themeEmoji, themeName, 'Warm-Up Hook')}
    <div class="slide-card" style="text-align:center; padding:24px;">
      <span class="slide-badge" style="background:var(--amber); color:var(--navy);">⏱️ 3 MIN · THINK-PAIR-SHARE</span>
      <p style="font-size:16px; font-weight:700; line-height:1.5; margin:16px 0; color:var(--navy);">${esc(warmupQ)}</p>
      <div style="max-width:520px; margin:0 auto;">${launchVocabBankHtml}</div>
    </div>`
  );

  // 5 Notice & Wonder
  add(
    '👀 Launch',
    'Notice &amp; Wonder',
    `
    ${slideHeader(themeEmoji, themeName, 'Scenario Launch')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">📋 ${esc(launchBadge)}</h2>
        <p class="card-desc" style="font-size:12.5px; line-height:1.5;">${esc(launchNarrative)}</p>
      </div>
      <div class="slide-card nw-container" style="border:none; background:transparent; box-shadow:none; padding:0;">
        <div class="nw-box nw-box-notice" style="transform:rotate(-1deg);">
          <h4>👀 Notice:</h4><div class="nw-box-stems">${noticeStemsHtml}</div>
          <textarea id="student-notice" class="slide-input-placeholder" rows="2" placeholder="Type what you notice..."></textarea>
        </div>
        <div class="nw-box nw-box-wonder" style="transform:rotate(1deg); margin-top:8px;">
          <h4>💭 Wonder:</h4><div class="nw-box-stems">${wonderStemsHtml}</div>
          <textarea id="student-wonder" class="slide-input-placeholder" rows="2" placeholder="Type what you wonder..."></textarea>
        </div>
      </div>
    </div>`
  );

  // 6 Concept launch
  add(
    '💡 Concept',
    'Concept Launch',
    `
    ${slideHeader(themeEmoji, themeName, 'Concept Launch')}
    <div class="slide-card">
      <h2 class="card-title">💡 ${esc(conceptHeading)}</h2>
      <p class="card-desc" style="font-size:13px; line-height:1.5;">${esc(conceptText)}</p>
      ${conceptKeyIdea ? `<div style="background:var(--teal-light); border:1.5px solid var(--teal); border-radius:8px; padding:10px; margin-top:12px;"><strong style="font-size:10px; text-transform:uppercase;">Key Idea:</strong><p style="margin:4px 0 0; font-weight:700;">${esc(conceptKeyIdea)}</p></div>` : ''}
    </div>`
  );

  // 7–9 I Do / We Do / You Do (separate slides)
  const renderLines = (lines) =>
    (lines || [])
      .map(
        (line, idx) =>
          `<div style="display:flex; gap:10px; margin-bottom:8px; align-items:flex-start;"><span style="background:var(--teal); color:white; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; flex-shrink:0;">${idx + 1}</span><span style="font-size:12px; line-height:1.4;">${esc(line)}</span></div>`
      )
      .join('');

  add('👁️ I Do', 'I Do — Watch Me', `${slideHeader(themeEmoji, themeName, esc(iDoTitle))}<div class="slide-card">${renderLines(iDoLines)}</div>`);
  add('🤝 We Do', 'We Do — Together', `${slideHeader(themeEmoji, themeName, esc(weDoTitle))}<div class="slide-card">${renderLines(weDoLines)}</div>`);
  add(
    '✋ You Do',
    'You Do — Your Turn',
    `
    ${slideHeader(themeEmoji, themeName, esc(youDoTitle))}
    <div class="slide-grid-2">
      <div class="slide-card">${renderLines(youDoLines)}</div>
      <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">🎮</div>
        <p style="font-size:13px; font-weight:700; margin:0 0 12px;">Open the interactive HTML activity to practice.</p>
        <a href="${activityUrl}" target="_blank" class="btn-present" style="text-decoration:none;">Launch Activity ↗</a>
      </div>
    </div>`
  );

  // Vocabulary slides — 2 terms per slide
  for (let v = 0; v < Math.min(vocabList.length, 8); v += 2) {
    const cards = buildVocabCardsHtml(vocabList, v, 2);
    if (!cards.trim()) continue;
    add('📝 Vocab', `Vocabulary ${v + 1}–${Math.min(v + 2, vocabList.length)}`, `${slideHeader(themeEmoji, themeName, 'Visual Vocabulary')}<div class="vocab-grid" style="grid-template-columns:1fr 1fr;">${cards}</div>`);
  }

  const vocabMatch = buildVocabMatchSlide(vocabList, themeEmoji, themeName);
  if (vocabMatch) add('✅ Vocab', 'Vocab Check', vocabMatch);

  const vocabCloze = buildVocabClozeSlide(vocabList, themeEmoji, themeName);
  if (vocabCloze) add('❓ Vocab', 'Which Word?', vocabCloze);

  const ttLaunch = buildTurnAndTalkSlide(talks.find((t) => t.phase === 'launch') || talks[0], 'Turn &amp; Talk — Launch', themeEmoji, themeName);
  if (ttLaunch) add('🗣️ Discuss', 'Turn & Talk', ttLaunch);

  // Visual model (reuse drawing workspace)
  add(
    '📐 Model',
    'Visual Model',
    `
    ${slideHeader(themeEmoji, themeName, 'Visual Modeling Workspace')}
    <div class="slide-grid-2">
      <div class="slide-card">${drawingToolbarHtml || '<p class="card-desc">Annotate the visual model.</p>'}</div>
      <div class="math-visual-container tool-draw" id="math-visual-container-element">
        <div style="position:absolute; inset:0; z-index:1;">${interactiveWidget || svgVisual}</div>
        <canvas id="math-canvas" width="440" height="240" class="canvas-overlay cursor-draw"></canvas>
      </div>
    </div>`
  );

  // Explore
  add(
    '🔍 Explore',
    'Explore',
    exploreHtml ||
      `${slideHeader(themeEmoji, themeName, 'Explore Activity')}<div class="slide-card"><p>${esc(exploreInstructions)}</p></div>`
  );

  const ttExplore = buildTurnAndTalkSlide(talks.find((t) => t.phase === 'explore'), 'Turn &amp; Talk — Explore', themeEmoji, themeName);
  if (ttExplore) add('🗣️ Explore', 'Discuss Explore', ttExplore);

  // Practice slides
  if (mcProblems[0]) {
    const body = buildMcSlide(mcProblems[0], 'mc1', 'Practice Check A', themeEmoji, themeName);
    if (body) add('📝 Practice', 'Practice A', body);
  }
  if (mcProblems[1]) {
    const body = buildMcSlide(mcProblems[1], 'mc2', 'Practice Check B', themeEmoji, themeName);
    if (body) add('📝 Practice', 'Practice B', body);
  }

  const dragHtml = buildDragSortSlide(dragSort, themeEmoji, themeName);
  if (dragHtml) add('↕️ Sort', 'Drag Sort', dragHtml);

  add('⚠️ Error', 'Error Analysis', `${slideHeader(themeEmoji, themeName, 'Practice Challenge')}${practiceHtml}`);

  // Connect / Math in the wild
  add(
    '🌍 Connect',
    'Math in the Wild',
    `
    ${slideHeader(themeEmoji, themeName, 'Real-World Connection')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">🌍 Math in the Wild</h2>
        <p class="card-desc" style="font-size:12.5px; line-height:1.5;">${esc(connectScenario)}</p>
        <div style="margin-top:8px;">${connectVocabBankHtml}</div>
      </div>
      <div class="slide-card" style="background:var(--teal-light);">
        <h2 class="card-title">✍️ Connection Reasoning</h2>
        <p style="font-size:11px; font-weight:600;">${esc(connectPrompt)}</p>
        ${connectFrame ? `<p style="font-size:10px; font-style:italic;">${esc(connectFrame)}</p>` : ''}
        <textarea id="rw-connect-work" class="slide-input-placeholder" rows="4" placeholder="Write your connection..."></textarea>
      </div>
    </div>`
  );

  const ttConnect = buildTurnAndTalkSlide(talks.find((t) => t.phase === 'connect'), 'Turn &amp; Talk — Connect', themeEmoji, themeName);
  if (ttConnect) add('🗣️ Connect', 'Discuss Connect', ttConnect);

  // Exit tickets
  add('📝 Exit', 'Exit Ticket', `${slideHeader(themeEmoji, themeName, 'Exit Ticket')}<div class="slide-card">${exitTicketHtml}</div>`);

  if (mcProblems[2]) {
    const body = buildMcSlide(mcProblems[2], 'exit2', 'Bonus Exit Check', themeEmoji, themeName);
    if (body) add('📝 Exit 2', 'Exit Ticket 2', body);
  }

  // Reflection 3-2-1
  add(
    '🤔 Reflect',
    'Reflection',
    `
    ${slideHeader(themeEmoji, themeName, 'Reflection &amp; Exit Ticket')}
    <div class="slide-grid-2">
      <div class="slide-card" style="border:none; background:transparent; box-shadow:none; padding:0;">
        <div class="post-it-grid">
          <div class="sticky-note post-it-3"><div class="post-it-title">3 Things I learned:</div>
            <input type="text" id="ref-3-1" placeholder="1." /><input type="text" id="ref-3-2" placeholder="2." /><input type="text" id="ref-3-3" placeholder="3." /></div>
          <div class="sticky-note post-it-2"><div class="post-it-title">2 Connections:</div>
            <input type="text" id="ref-2-1" placeholder="1." /><input type="text" id="ref-2-2" placeholder="2." /></div>
          <div class="sticky-note post-it-1"><div class="post-it-title">1 Question:</div>
            <input type="text" id="ref-1-1" placeholder="..." /></div>
        </div>
      </div>
      <div class="slide-card" style="background:var(--teal-light);">
        <strong style="font-size:10px;">Self-Assessment:</strong>
        <div class="assess-row">
          <button class="assess-btn" id="btn-gotit" onclick="setSelfAssessment('gotit')">Got it! 👍</button>
          <button class="assess-btn" id="btn-getting" onclick="setSelfAssessment('getting')">Almost 🧭</button>
          <button class="assess-btn" id="btn-help" onclick="setSelfAssessment('help')">Help 🆘</button>
        </div>
      </div>
    </div>`
  );

  // Family homework
  add(
    '🏠 Home',
    'Family Connection',
    `
    ${slideHeader(themeEmoji, themeName, 'Family Connection')}
    <div class="slide-card" style="text-align:center; padding:20px;">
      <p style="font-size:14px; font-weight:700; margin:0 0 12px;">Share tonight&apos;s family homework and discuss one vocabulary word at home.</p>
      <a href="${homeworkUrl}" target="_blank" class="btn-present" style="text-decoration:none; display:inline-flex;">Open Family Homework ↗</a>
    </div>`
  );

  // Teacher notes
  const listenFors = talks.map((t) => t.listenFor).filter(Boolean).slice(0, 3);
  add(
    '👩‍🏫 Notes',
    'Teacher Notes',
    `
    ${slideHeader(themeEmoji, themeName, 'Teacher Notes')}
    <div class="slide-grid-2">
      <div class="slide-card">
        <h2 class="card-title">⏱️ Pacing</h2>
        <ul style="font-size:11px; line-height:1.6; margin:0; padding-left:18px;">
          <li>Warm-up &amp; vocab: 10 min</li>
          <li>I Do / We Do / Explore: 15 min</li>
          <li>Practice &amp; connect: 12 min</li>
          <li>Exit ticket &amp; reflect: 8 min</li>
        </ul>
        <p style="font-size:10px; color:var(--gray); margin-top:8px;">Total: ${esc(timeEstimate || '~45 min')}</p>
      </div>
      <div class="slide-card" style="background:var(--coral);">
        <h2 class="card-title">🎯 Listen For</h2>
        ${listenFors.map((l) => `<p style="font-size:10.5px; line-height:1.4; margin:0 0 8px;">• ${esc(l)}</p>`).join('') || '<p style="font-size:11px;">Students use precise vocabulary and justify with the key idea.</p>'}
        ${data.practice?.commonMistake ? `<p style="font-size:10px; margin-top:8px;"><strong>Common mistake:</strong> ${esc(data.practice.commonMistake)}</p>` : ''}
      </div>
    </div>`
  );

  // Answer key appendix
  const answers = [];
  mcProblems.slice(0, 3).forEach((p, idx) => {
    if (p.choices && p.correctIndex !== undefined) {
      answers.push(`Practice ${idx + 1}: ${p.choices[p.correctIndex]} — ${p.explanation || ''}`);
    }
  });
  if (data.reflect?.exitTicket?.choices) {
    const et = data.reflect.exitTicket;
    answers.push(`Exit ticket: ${et.choices[et.correctIndex]} — ${et.explanation || ''}`);
  }

  add(
    '🔑 Key',
    'Answer Key',
    `
    ${slideHeader(themeEmoji, themeName, 'Answer Key (Teacher Appendix)')}
    <div class="slide-card">
      <p style="font-size:11px; color:var(--gray); margin:0 0 10px;">Hide this slide during presentation or move to the end of your copy.</p>
      ${answers.map((a) => `<p style="font-size:11px; line-height:1.4; margin:0 0 6px;">✓ ${esc(a)}</p>`).join('') || '<p style="font-size:11px;">See lesson config and HTML activity for full answer keys.</p>'}
    </div>`
  );

  const slideTitles = [
    'TITLE SLIDE',
    'LEARNING TARGETS',
    'LESSON AGENDA',
    'WARM-UP HOOK',
    'NOTICE & WONDER LAUNCH',
    'CONCEPT LAUNCH',
    'I DO — WATCH ME',
    'WE DO — TOGETHER',
    'YOU DO — YOUR TURN',
    ...Array(Math.max(0, n - 9)).fill(0).map((_, i) => `SLIDE ${10 + i}`),
  ];

  return {
    thumbnailsHtml: thumbs.join('\n'),
    slidesHtml: slides.join('\n\n        '),
    totalSlides: n,
    slideTitles: slideTitles.slice(0, n),
  };
}
