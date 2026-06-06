/**
 * Reference PPTX visual system — extracted from 5.2 Session 1.pptx
 * Navy header bars, sand backgrounds, sage side panels, notebook chrome.
 */

export const REFERENCE_TOKENS = {
  navy: '#1C2E42',
  teal: '#387F84',
  sand: '#E8E4D8',
  sage: '#EDF2E8',
  sagePanel: '#E0F0F1',
  mist: '#EAF2F7',
  warmCream: '#FCF5E0',
  coral: '#F5EAE7',
  amber: '#F2C15B',
  amberDark: '#C8A050',
  red: '#D9534F',
  redLight: '#FFF5F5',
  slate: '#5C656E',
  gray: '#A8B2BC',
  grayMid: '#D6DBDF',
  white: '#FFFFFF',
  bodyText: '#24323F',
  accentGreen: '#5C8A5A',
  accentCoral: '#C07070',
  cardBank: '#E8EDF3',
  ruledLine: 'rgba(56, 127, 132, 0.08)',
};

export function tokensToCssVars(palette, themeColor) {
  const p = palette || {};
  const t = REFERENCE_TOKENS;
  const navy = p.navy || t.navy;
  const teal = p.teal || t.teal;
  const sand = p.bg || t.sand;
  const sage = p.bgWarm || t.sage;
  const sagePanel = p.tealLight || t.sagePanel;
  const coral = p.coral || t.coral;
  const amber = p.amber || t.amber;
  const accent = p.accent || t.accentGreen;
  return `
      --ref-navy: ${navy};
      --ref-teal: ${teal};
      --ref-sand: ${sand};
      --ref-sage: ${sage};
      --ref-sage-panel: ${sagePanel};
      --ref-mist: ${t.mist};
      --ref-warm-cream: ${t.warmCream};
      --ref-coral: ${coral};
      --ref-amber: ${amber};
      --ref-red: ${t.red};
      --ref-red-light: ${t.redLight};
      --ref-slate: ${t.slate};
      --ref-card-bank: ${t.cardBank};
      --navy: ${navy};
      --teal: ${teal};
      --teal-light: ${sagePanel};
      --amber: ${amber};
      --bg: ${sand};
      --bg-warm: ${sage};
      --coral: ${coral};
      --accent: ${accent};
      --body-text: ${t.bodyText};
      --gray: ${t.gray};
      --white: ${t.white};
      --shadow: 0 4px 20px rgba(28, 46, 66, 0.08);
      --google-gray: #f1f3f4;
      --google-blue: #1a73e8;
      --theme-color: ${themeColor || teal};`;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Navy header bar — every content slide */
export function refHeaderBar(slideTitle, standard, brand = 'Reveal Math Grade 6') {
  return `
    <header class="ref-header-bar">
      <span class="ref-brand">${esc(brand)}</span>
      <span class="ref-header-title">${esc(slideTitle)}</span>
      <span class="ref-standard-pill">${esc(standard)}</span>
    </header>`;
}

/** White main + sage Talk It Over side panel (reference 65/32 split) */
export function refTwoColumn(mainHtml, sideHtml, sideTitle = '💬 Talk It Over') {
  return `
    <div class="ref-two-col">
      <div class="ref-main-panel">${mainHtml}</div>
      <aside class="ref-side-panel">
        <div class="ref-side-header">${esc(sideTitle)}</div>
        <div class="ref-side-body">${sideHtml || '<p class="ref-side-prompt">Turn and talk with your partner using today&apos;s vocabulary.</p>'}</div>
      </aside>
    </div>`;
}

/** Wrap slide inner content with reference chrome */
export function refSlideFrame(slideTitle, standard, innerHtml, opts = {}) {
  const { variant = 'content', hideHeader = false } = opts;
  if (variant === 'title') return innerHtml;
  if (variant === 'section') return innerHtml;
  return `
    <div class="ref-slide-frame ref-variant-${variant}">
      ${hideHeader ? '' : refHeaderBar(slideTitle, standard)}
      <div class="ref-slide-content">${innerHtml}</div>
    </div>`;
}

/** Session opener — navy left spine + notebook fields */
export function refTitleOpener(ctx) {
  const {
    sessionNum = 1,
    standard,
    unit,
    lessonId,
    title,
    subject = 'Mathematics',
    contentObj,
    themeEmoji,
    timeEstimate,
    googleSlidesUrl,
  } = ctx;

  return `
    <div class="ref-title-opener">
      ${refHeaderBar(`Session ${sessionNum} Notebook`, standard)}
      <div class="ref-title-body">
        <div class="ref-title-spine">
          <div class="ref-spine-standard">${esc(standard)}</div>
          <div class="ref-spine-unit">Unit ${unit}</div>
          <div class="ref-spine-subject">${esc(subject)}</div>
          <h1 class="ref-spine-title">${esc(title)}</h1>
          <div class="ref-spine-emoji">${esc(themeEmoji)}</div>
        </div>
        <div class="ref-title-main">
          <h2 class="ref-notebook-heading">My Math Notebook</h2>
          <div class="ref-notebook-fields">
            <div class="ref-field-row"><label>Name:</label><span class="ref-field-line"></span></div>
            <div class="ref-field-row"><label>Date:</label><span class="ref-field-line"></span></div>
          </div>
          <div class="ref-learning-target-box">
            <strong>🎯 Learning Target</strong>
            <p>${esc(contentObj)}</p>
          </div>
          <p class="ref-title-meta">Unit ${unit} · Lesson ${esc(lessonId)} · ⏱️ ${esc(timeEstimate || '~45 min')}</p>
          ${googleSlidesUrl ? `<a href="${esc(googleSlidesUrl)}" target="_blank" rel="noopener" class="ref-gs-link">↗ Open editable Google Slides copy</a>` : ''}
        </div>
      </div>
    </div>`;
}

/** Full-bleed navy section divider */
export function refSectionOpener(section, minutes, emoji = '') {
  return `
    <div class="ref-section-opener">
      ${emoji ? `<div class="ref-section-emoji">${emoji}</div>` : ''}
      <h2 class="ref-section-title">${section}</h2>
      <p class="ref-section-time">⏱️ ~${minutes} min</p>
      <div class="ref-section-line"></div>
    </div>`;
}

/** Choice board — 2×2 pastel cards with navy headers */
export function refChoiceBoardGrid(choices) {
  const palettes = ['ref-choice-mist', 'ref-choice-sage', 'ref-choice-cream', 'ref-choice-panel'];
  const cards = (choices || []).slice(0, 4).map((c, i) => `
    <button type="button" class="ref-choice-card ${palettes[i]}" onclick="selectChoiceBoard(${i})" id="choice-card-${i}">
      <div class="ref-choice-card-header">${esc(c.title)}</div>
      <span class="ref-choice-icon">${c.icon || '✓'}</span>
      <p>${esc(c.desc)}</p>
      <span class="choice-check" id="choice-check-${i}">✓</span>
    </button>`).join('');
  return `
    <p class="ref-instruction">Choose ONE to show what you know:</p>
    <div class="ref-choice-grid">${cards}</div>
    <textarea class="ref-lined-input" rows="2" placeholder="Record which choice you made and your response..."></textarea>`;
}

/** Think-Write-Respond — sage frames with teal label column */
export function refThinkWriteFrames(frames, instruction) {
  const frameHtml = (frames || []).map((f, i) => `
    <div class="ref-twr-frame">
      <div class="ref-twr-label">
        <span class="ref-twr-num">Frame ${i + 1}</span>
        <strong>${esc(f.title)}</strong>
      </div>
      <div class="ref-twr-body">
        <p class="ref-twr-prompt">${esc(f.prompt)}</p>
        <textarea class="ref-lined-input twr-input" rows="2" placeholder="Write your response..."></textarea>
      </div>
    </div>`).join('');
  return `
    <p class="ref-instruction">${esc(instruction || "Use evidence from today's lesson to complete each frame.")}</p>
    <div class="ref-twr-stack">${frameHtml}</div>`;
}

/** Sort It Out — card bank + colored bucket headers */
export function refSortLayout(instruction, bucketsHtml, cardBankHtml, sidePrompt) {
  return refTwoColumn(`
    <p class="ref-instruction">${esc(instruction)}</p>
    <div class="ref-card-bank-label">Card Bank — cut or drag these cards:</div>
    <div class="ref-card-bank">${cardBankHtml}</div>
    <div class="ref-sort-buckets">${bucketsHtml}</div>
  `, sidePrompt ? `<p class="ref-side-prompt">${esc(sidePrompt)}</p>` : '');
}

export function refSortBucket(label, colorClass, id) {
  return `
    <div class="ref-sort-bucket ${colorClass}" data-cat-id="${esc(id)}">
      <div class="ref-bucket-header">${esc(label)}</div>
      <div class="ref-bucket-items" id="zone-${esc(id)}"></div>
    </div>`;
}

/** Error Analysis — red badge + white/red zones */
export function refErrorLayout(scenarioHtml, studentWorkHtml, sidePrompt) {
  return refTwoColumn(`
    <span class="ref-error-badge">⚠ Find the Error</span>
    <div class="ref-error-scenario">${scenarioHtml}</div>
    <div class="ref-student-work-box">
      <div class="ref-work-label">Student&apos;s Work (labeled — contains an error):</div>
      ${studentWorkHtml}
    </div>
    <div class="ref-error-zone">
      <strong>What went wrong?</strong>
      <textarea class="ref-lined-input" rows="3" placeholder="Explain the mistake and how to fix it..."></textarea>
    </div>
  `, sidePrompt ? `<p class="ref-side-prompt">${esc(sidePrompt)}</p>` : '');
}

/** Goal tracker — 4 pastel level columns */
export function refGoalTrackerLayout(goal, levels) {
  const palettes = ['ref-goal-coral', 'ref-goal-cream', 'ref-goal-sage', 'ref-goal-panel'];
  const levelHtml = (levels || []).slice(0, 4).map((l, i) => `
    <button type="button" class="ref-goal-card ${palettes[i]}" onclick="selectGoalLevel(${l.num})" id="goal-level-${l.num}">
      <span class="ref-goal-num">${l.num}</span>
      <strong>${esc(l.label)}</strong>
      <p>${esc(l.desc)}</p>
      <span class="goal-circle" id="goal-circle-${l.num}">○</span>
    </button>`).join('');
  return `
    <div class="ref-goal-banner"><strong>My Goal:</strong> ${esc(goal)}</div>
    <div class="ref-goal-grid">${levelHtml}</div>`;
}

/** Exit ticket — teal reflection + coral quick ticket split */
export function refExitSplit(reflectionFields, ticketHtml) {
  return `
    <div class="ref-exit-split">
      <div class="ref-exit-reflection">
        <div class="ref-panel-header ref-header-teal">Reflection</div>
        <div class="ref-exit-body">${reflectionFields}</div>
      </div>
      <div class="ref-exit-quick">
        <div class="ref-panel-header ref-header-navy">Quick Exit Ticket</div>
        <div class="ref-exit-body">${ticketHtml}</div>
      </div>
    </div>`;
}

/** Vocabulary table — navy header row */
export function refVocabTable(rows) {
  const body = (rows || []).map((r) => `
    <tr>
      <td class="ref-vocab-term">${esc(r.term)}${r.termEs ? `<br/><em>${esc(r.termEs)}</em>` : ''}</td>
      <td>${esc(r.definition)}${r.definitionEs ? `<br/><em>${esc(r.definitionEs)}</em>` : ''}</td>
      <td>${esc(r.example || '')}</td>
      <td class="ref-vocab-visual">${r.visual || '📐'}</td>
    </tr>`).join('');
  return `
    <table class="ref-vocab-table">
      <thead>
        <tr>
          <th>Term / Término</th>
          <th>Meaning / Significado</th>
          <th>Example / Ejemplo</th>
          <th>Visual</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

/** Notice & Wonder — reference Be Curious layout */
export function refNoticeWonder(visualHtml, noticeStems, wonderStems) {
  return `
    <div class="ref-curious-layout">
      <div class="ref-visual-prompt">
        <span class="ref-prompt-badge">Visual Prompt</span>
        ${visualHtml}
      </div>
      <div class="ref-nw-stack">
        <div class="ref-nw-panel ref-nw-notice">
          <div class="ref-panel-header ref-header-teal">👁 I Notice...</div>
          <div class="ref-nw-stems">${noticeStems}</div>
          <textarea class="ref-lined-input" rows="2" placeholder="I notice..."></textarea>
        </div>
        <div class="ref-nw-panel ref-nw-wonder">
          <div class="ref-panel-header ref-header-amber">💭 I Wonder...</div>
          <div class="ref-nw-stems">${wonderStems}</div>
          <textarea class="ref-lined-input" rows="2" placeholder="I wonder..."></textarea>
        </div>
      </div>
    </div>`;
}

/** Teacher cue — compact, matches reference (not blue boxes) */
export function refTeacherNote(type, text) {
  const icons = { say: '👩‍🏫', ask: '❓', time: '⏱️', students: '👨‍🎓', materials: '📦' };
  return `<p class="ref-teacher-note ref-note-${type}"><span>${icons[type] || '•'}</span> ${esc(text)}</p>`;
}

/** Footer progress dots */
export function refFooterDots(current, total) {
  const dots = Array.from({ length: Math.min(total, 12) }, (_, i) => {
    const n = i + 1;
    const active = n === current ? ' ref-dot-active' : n < current ? ' ref-dot-done' : '';
    return `<span class="ref-dot${active}" data-slide="${n}"></span>`;
  }).join('');
  return `<div class="ref-progress-dots">${dots}</div>`;
}

export const REFERENCE_CSS = `
    /* ── Reference PPTX Visual System ── */
    .slide-canvas {
      background-color: var(--ref-sand, #E8E4D8) !important;
      background-image: none !important;
      padding: 0 !important;
      border-radius: 4px;
    }
    .notebook-spiral { left: 8px; top: 58px; bottom: 28px; }
    .slide-body {
      flex: 1;
      display: none;
      height: 100%;
      overflow: hidden;
      margin: 0;
    }
    .slide-body.active { display: flex; flex-direction: column; }
    .slide-watermark { display: none; }
    .lesson-progress-bar { display: none; }

    .ref-slide-frame {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--ref-sand);
    }
    .ref-header-bar {
      display: flex;
      align-items: center;
      height: 40px;
      min-height: 40px;
      background: var(--ref-navy);
      color: var(--ref-white);
      padding: 0 12px 0 48px;
      font-family: 'Outfit', sans-serif;
      gap: 12px;
      flex-shrink: 0;
    }
    .ref-brand {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      opacity: 0.85;
      white-space: nowrap;
    }
    .ref-header-title {
      flex: 1;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .ref-standard-pill {
      background: var(--ref-teal);
      color: white;
      font-size: 9px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .ref-slide-content {
      flex: 1;
      overflow: hidden;
      padding: 8px 12px 4px 48px;
      display: flex;
      flex-direction: column;
    }

    .ref-two-col {
      display: grid;
      grid-template-columns: 1.9fr 1fr;
      gap: 10px;
      height: 100%;
      flex: 1;
    }
    .ref-main-panel {
      background: var(--ref-white);
      border-radius: 4px;
      padding: 10px 12px;
      overflow-y: auto;
      box-shadow: 0 2px 8px rgba(28, 46, 66, 0.06);
    }
    .ref-side-panel {
      background: var(--ref-sage-panel);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ref-side-header {
      background: var(--ref-teal);
      color: white;
      font-size: 10px;
      font-weight: 800;
      padding: 6px 10px;
      font-family: 'Outfit', sans-serif;
    }
    .ref-side-body {
      padding: 10px;
      font-size: 10.5px;
      line-height: 1.45;
      flex: 1;
      overflow-y: auto;
    }
    .ref-side-prompt { margin: 0; color: var(--body-text); font-weight: 600; }
    .ref-instruction {
      font-size: 11px;
      font-weight: 700;
      color: var(--ref-navy);
      margin: 0 0 8px;
      line-height: 1.4;
    }

    /* Title opener */
    .ref-title-opener { display: flex; flex-direction: column; height: 100%; background: var(--ref-sand); }
    .ref-title-body {
      display: grid;
      grid-template-columns: 1.1fr 1.9fr;
      flex: 1;
      gap: 0;
      padding: 0 12px 8px 48px;
      overflow: hidden;
    }
    .ref-title-spine {
      background: var(--ref-navy);
      color: white;
      padding: 16px 14px;
      border-radius: 0 0 8px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ref-spine-standard { font-size: 11px; font-weight: 800; color: var(--ref-teal); }
    .ref-spine-unit { font-size: 10px; opacity: 0.8; }
    .ref-spine-subject { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; }
    .ref-spine-title { font-family: 'Outfit'; font-size: 18px; font-weight: 800; margin: 8px 0; line-height: 1.2; flex: 1; }
    .ref-spine-emoji { font-size: 32px; }
    .ref-title-main { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
    .ref-notebook-heading { font-family: 'Outfit'; font-size: 20px; color: var(--ref-navy); margin: 0; font-weight: 800; }
    .ref-notebook-fields { display: flex; flex-direction: column; gap: 8px; }
    .ref-field-row { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: var(--ref-navy); }
    .ref-field-row label { min-width: 42px; }
    .ref-field-line { flex: 1; border-bottom: 1.5px solid var(--ref-navy); height: 14px; opacity: 0.35; }
    .ref-learning-target-box {
      background: var(--ref-white);
      border: 2px solid var(--ref-teal);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 11px;
    }
    .ref-learning-target-box p { margin: 4px 0 0; font-weight: 600; line-height: 1.4; }
    .ref-title-meta { font-size: 10px; color: var(--gray); font-weight: 700; margin: 0; }
    .ref-gs-link { font-size: 10px; color: var(--ref-teal); font-weight: 700; }

    /* Section opener — full bleed navy */
    .ref-section-opener {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--ref-navy);
      color: white;
      text-align: center;
      padding: 0 48px;
    }
    .ref-section-emoji { font-size: 36px; margin-bottom: 8px; }
    .ref-section-title {
      font-family: 'Outfit';
      font-size: 32px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .ref-section-time { font-size: 13px; opacity: 0.75; margin: 10px 0; font-weight: 700; }
    .ref-section-line { width: 100px; height: 3px; background: var(--ref-teal); border-radius: 99px; }

    /* Choice board */
    .ref-choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .ref-choice-card {
      position: relative;
      text-align: left;
      border: none;
      border-radius: 6px;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      font-size: 10px;
      line-height: 1.35;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .ref-choice-card:hover, .ref-choice-card.selected { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(28,46,66,0.12); }
    .ref-choice-card-header {
      background: var(--ref-navy);
      color: white;
      font-size: 10px;
      font-weight: 800;
      padding: 5px 8px;
      font-family: 'Outfit', sans-serif;
    }
    .ref-choice-card p { margin: 0; padding: 8px; color: var(--body-text); }
    .ref-choice-icon { display: block; font-size: 18px; padding: 4px 8px 0; }
    .ref-choice-mist { background: var(--ref-mist); }
    .ref-choice-sage { background: var(--ref-sage); }
    .ref-choice-cream { background: var(--ref-warm-cream); }
    .ref-choice-panel { background: var(--ref-sage-panel); }

    /* Think-Write-Respond */
    .ref-twr-stack { display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; }
    .ref-twr-frame {
      display: grid;
      grid-template-columns: 130px 1fr;
      background: var(--ref-sage);
      border-radius: 4px;
      overflow: hidden;
      min-height: 72px;
    }
    .ref-twr-label {
      background: var(--ref-teal);
      color: white;
      padding: 8px;
      font-size: 9px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ref-twr-num { font-weight: 800; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.04em; }
    .ref-twr-body { padding: 8px 10px; background: var(--ref-sage); }
    .ref-twr-prompt { margin: 0 0 4px; font-size: 10px; font-style: italic; color: var(--ref-slate); }

    /* Sort It Out */
    .ref-card-bank-label { font-size: 9px; font-weight: 800; color: var(--ref-slate); text-transform: uppercase; margin-bottom: 4px; }
    .ref-card-bank {
      background: var(--ref-card-bank);
      border-radius: 4px;
      padding: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 8px;
      min-height: 36px;
    }
    .ref-sort-buckets { display: flex; gap: 6px; flex-wrap: wrap; }
    .ref-sort-bucket { flex: 1; min-width: 80px; border-radius: 4px; overflow: hidden; }
    .ref-bucket-header {
      font-size: 9px;
      font-weight: 800;
      color: white;
      padding: 5px 8px;
      text-align: center;
      font-family: 'Outfit', sans-serif;
    }
    .ref-bucket-teal .ref-bucket-header { background: var(--ref-teal); }
    .ref-bucket-navy .ref-bucket-header { background: var(--ref-navy); }
    .ref-bucket-slate .ref-bucket-header { background: var(--ref-slate); }
    .ref-bucket-items {
      background: var(--ref-white);
      min-height: 48px;
      padding: 6px;
      border: 1px solid var(--ref-gray-mid, #D6DBDF);
      border-top: none;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    /* Error Analysis */
    .ref-error-badge {
      display: inline-block;
      background: var(--ref-red);
      color: white;
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 3px;
      margin-bottom: 8px;
    }
    .ref-error-scenario { font-size: 10.5px; margin-bottom: 8px; line-height: 1.4; }
    .ref-student-work-box {
      background: var(--ref-card-bank);
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 8px;
      font-family: monospace;
      font-size: 11px;
    }
    .ref-work-label { font-size: 9px; font-weight: 800; color: var(--ref-slate); margin-bottom: 4px; font-family: 'Hanken Grotesk', sans-serif; }
    .ref-error-zone {
      background: var(--ref-red-light);
      border: 1px solid rgba(217, 83, 79, 0.25);
      border-radius: 4px;
      padding: 8px;
      font-size: 10px;
    }

    /* Goal Tracker */
    .ref-goal-banner {
      background: var(--ref-mist);
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 11px;
      margin-bottom: 10px;
      text-align: left;
    }
    .ref-goal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .ref-goal-card {
      border: none;
      border-radius: 4px;
      padding: 10px 8px;
      text-align: center;
      cursor: pointer;
      font-size: 9px;
      line-height: 1.35;
      transition: transform 0.15s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .ref-goal-card:hover, .ref-goal-card.selected { transform: scale(1.03); box-shadow: 0 4px 10px rgba(28,46,66,0.1); }
    .ref-goal-num {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 12px; color: white;
    }
    .ref-goal-coral { background: var(--ref-coral); }
    .ref-goal-coral .ref-goal-num { background: var(--ref-accent-coral, #C07070); }
    .ref-goal-cream { background: var(--ref-warm-cream); }
    .ref-goal-cream .ref-goal-num { background: var(--ref-amber-dark, #C8A050); }
    .ref-goal-sage { background: var(--ref-sage); }
    .ref-goal-sage .ref-goal-num { background: var(--ref-accent-green, #5C8A5A); }
    .ref-goal-panel { background: var(--ref-sage-panel); }
    .ref-goal-panel .ref-goal-num { background: var(--ref-teal); }

    /* Exit ticket split */
    .ref-exit-split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 100%; }
    .ref-exit-reflection, .ref-exit-quick { border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; }
    .ref-exit-reflection { background: var(--ref-sage-panel); }
    .ref-exit-quick { background: var(--ref-coral); }
    .ref-panel-header {
      font-size: 10px;
      font-weight: 800;
      color: white;
      padding: 6px 10px;
      font-family: 'Outfit', sans-serif;
    }
    .ref-header-teal { background: var(--ref-teal); }
    .ref-header-navy { background: var(--ref-navy); }
    .ref-header-amber { background: var(--ref-amber); }
    .ref-exit-body { padding: 10px; flex: 1; font-size: 10.5px; }

    /* Vocabulary table */
    .ref-vocab-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .ref-vocab-table thead tr { background: var(--ref-navy); color: white; }
    .ref-vocab-table th { padding: 6px 8px; text-align: left; font-weight: 800; font-family: 'Outfit', sans-serif; }
    .ref-vocab-table td { padding: 6px 8px; border-bottom: 1px solid var(--ref-gray-mid, #D6DBDF); vertical-align: top; }
    .ref-vocab-table tbody tr { background: white; }
    .ref-vocab-table tbody tr:nth-child(even) { background: var(--ref-mist); }
    .ref-vocab-term { font-weight: 800; color: var(--ref-navy); }

    /* Be Curious / Notice-Wonder */
    .ref-curious-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 100%; }
    .ref-visual-prompt {
      background: var(--ref-mist);
      border-radius: 4px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ref-prompt-badge {
      background: var(--ref-amber);
      color: var(--ref-navy);
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 3px;
      align-self: flex-start;
    }
    .ref-nw-stack { display: flex; flex-direction: column; gap: 8px; }
    .ref-nw-panel { border-radius: 4px; overflow: hidden; flex: 1; display: flex; flex-direction: column; }
    .ref-nw-notice { background: var(--ref-sage-panel); }
    .ref-nw-wonder { background: var(--ref-coral); }
    .ref-nw-stems { padding: 6px 10px; font-size: 10px; line-height: 1.4; }
    .ref-nw-stems div { margin-bottom: 2px; }

    /* Lined inputs — notebook feel */
    .ref-lined-input, .ref-main-panel .slide-input-placeholder {
      width: 100%;
      border: none;
      border-bottom: 1px solid rgba(28, 46, 66, 0.2);
      background: repeating-linear-gradient(transparent, transparent 21px, var(--ref-ruled-line, rgba(56,127,132,0.08)) 21px, var(--ref-ruled-line, rgba(56,127,132,0.08)) 22px);
      background-color: transparent;
      font-size: 10.5px;
      font-family: inherit;
      padding: 4px 2px;
      resize: none;
      outline: none;
      line-height: 22px;
    }
    .ref-lined-input:focus, .ref-main-panel .slide-input-placeholder:focus {
      border-bottom-color: var(--ref-teal);
      box-shadow: none;
      background-color: rgba(255,255,255,0.5);
    }

    /* Teacher notes — subtle, not blue boxes */
    .ref-teacher-note {
      font-size: 9px;
      color: var(--ref-slate);
      margin: 4px 0;
      line-height: 1.35;
      font-weight: 600;
      padding-left: 2px;
      border-left: 2px solid var(--ref-teal);
    }
    .learning-target-bar { display: none; }
    .slide-badge-row, .slide-main-title, .slide-badge { display: none; }
    .ref-slide-content > .slide-card,
    .ref-slide-content > .slide-grid-2,
    .ref-slide-content > .reveal-card,
    .ref-slide-content > .warmup-card,
    .ref-slide-content > .how-to-card,
    .ref-slide-content > .goal-tracker-card,
    .ref-slide-content > .cfu-card {
      background: var(--ref-white);
      border-radius: 4px;
      padding: 10px 12px;
      box-shadow: 0 2px 8px rgba(28, 46, 66, 0.06);
      flex: 1;
      overflow-y: auto;
    }
    .ref-slide-content > .slide-grid-2 {
      display: grid;
      grid-template-columns: 1.9fr 1fr;
      gap: 10px;
    }
    .ref-slide-content .slide-card {
      background: var(--ref-white);
      border: none;
      box-shadow: none;
      padding: 8px;
      height: auto;
    }
    .ref-slide-content .card-teal-light,
    .ref-slide-content .card-coral {
      background: var(--ref-sage-panel);
      border-radius: 4px;
    }
    .teacher-cue {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      background: transparent;
      border: none;
      border-left: 2px solid var(--ref-teal);
      border-radius: 0;
      padding: 3px 0 3px 8px;
      margin-bottom: 4px;
      font-size: 9px;
      line-height: 1.35;
      color: var(--ref-slate);
    }
    .teacher-cue-label { font-weight: 800; color: var(--ref-navy); }
    .teacher-cue-text { color: var(--ref-slate); font-weight: 600; }

    /* Footer dots */
    .ref-slide-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 12px 6px 48px;
      font-size: 7px;
      font-weight: 800;
      color: var(--ref-slate);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      flex-shrink: 0;
      opacity: 0.7;
    }
    .ref-progress-dots { display: flex; gap: 4px; }
    .ref-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--ref-gray-mid, #D6DBDF);
    }
    .ref-dot-active { background: var(--ref-teal); transform: scale(1.3); }
    .ref-dot-done { background: var(--ref-navy); opacity: 0.5; }

    /* Drag items in reference style */
    .ref-card-bank .drag-item, .drag-pool .drag-item {
      background: white;
      border: 1.5px solid var(--ref-teal);
      font-size: 9.5px;
      padding: 4px 8px;
      border-radius: 4px;
    }

    /* MC buttons in main panel */
    .ref-main-panel .mc-btn, .ref-main-panel .assess-btn {
      font-size: 10px;
      border-radius: 4px;
      border: 1px solid var(--ref-gray-mid, #D6DBDF);
    }
    .ref-main-panel .mc-btn:hover { border-color: var(--ref-teal); background: var(--ref-sage-panel); }

    @media (max-width: 768px) {
      .ref-two-col, .ref-curious-layout, .ref-exit-split, .ref-choice-grid, .ref-goal-grid { grid-template-columns: 1fr; }
      .ref-title-body { grid-template-columns: 1fr; }
    }
`;
