import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const lessonsDir = join(root, 'lessons');

// Define color tokens matching v5.1 Design System
const COLOR_BG = '#F7F4EC';
const COLOR_NAVY = '#17324D';
const COLOR_TEAL = '#1FA6A2';
const COLOR_TEAL_LIGHT = '#DFF2EE';
const COLOR_AMBER = '#F2C15B';
const COLOR_BODY_TEXT = '#24323F';
const COLOR_WHITE = '#FFFFFF';
const COLOR_CORAL = '#FCE6DE';
const COLOR_GRAY = '#8A96A3';

// Helper to escape HTML strings
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate the math SVG diagram for the visual model slide
function generateMathVisualSvg(lessonId, data) {
  const width = 320;
  const height = 220;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="background:white; border-radius:8px;">`;
  
  // Outer frame
  svg += `<rect x="5" y="5" width="${width - 10}" height="${height - 10}" fill="#F9FBFC" stroke="${COLOR_TEAL}" stroke-width="2"/>`;
  
  // Grid Lines
  for (let x = 20; x < width - 10; x += 30) {
    svg += `<line x1="${x}" y1="5" x2="${x}" y2="${height - 5}" stroke="#E1EAEF" stroke-width="1"/>`;
  }
  for (let y = 20; y < height - 10; y += 30) {
    svg += `<line x1="5" y1="${y}" x2="${width - 5}" y2="${y}" stroke="#E1EAEF" stroke-width="1"/>`;
  }
  
  const standard = data.standard || '';
  const isGeometry = standard.includes('.G.') || lessonId.startsWith('5-') || lessonId.startsWith('10-');
  const isProportional = standard.includes('.RP.') || lessonId.startsWith('3-') || lessonId.startsWith('4-');
  
  if (isGeometry) {
    // Area triangle/parallelogram/polygon representation
    svg += `<polygon points="60,160 160,50 260,160" fill="${COLOR_TEAL_LIGHT}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
    svg += `<line x1="60" y1="175" x2="260" y2="175" stroke="${COLOR_NAVY}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
    svg += `<text x="140" y="192" font-family="Calibri" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">Base (b)</text>`;
    svg += `<line x1="160" y1="50" x2="160" y2="160" stroke="${COLOR_AMBER}" stroke-width="1.5" stroke-dasharray="4,4"/>`;
    svg += `<text x="170" y="105" font-family="Calibri" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">Height (h)</text>`;
  } else if (isProportional) {
    // Coordinate grid quadrant representation
    svg += `<line x1="50" y1="170" x2="270" y2="170" stroke="${COLOR_NAVY}" stroke-width="2"/>`; // X axis
    svg += `<line x1="60" y1="30" x2="60" y2="180" stroke="${COLOR_NAVY}" stroke-width="2"/>`; // Y axis
    // Axis labels
    svg += `<text x="240" y="190" font-family="Calibri" font-size="11" fill="${COLOR_NAVY}" font-weight="bold">Input (x)</text>`;
    svg += `<text x="15" y="45" font-family="Calibri" font-size="11" fill="${COLOR_NAVY}" font-weight="bold">Output (y)</text>`;
    // Linear plot line
    svg += `<line x1="60" y1="170" x2="240" y2="60" stroke="${COLOR_AMBER}" stroke-width="3"/>`;
    svg += `<circle cx="150" cy="115" r="4.5" fill="${COLOR_TEAL}"/>`;
    svg += `<circle cx="240" cy="60" r="4.5" fill="${COLOR_TEAL}"/>`;
  } else {
    // General Number Line representation
    svg += `<line x1="30" y1="110" x2="290" y2="110" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
    // Arrows
    svg += `<line x1="30" y1="110" x2="38" y2="104" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
    svg += `<line x1="30" y1="110" x2="38" y2="116" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
    svg += `<line x1="290" y1="110" x2="282" y2="104" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
    svg += `<line x1="290" y1="110" x2="282" y2="116" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
    // Ticks and labels
    const ticks = [70, 110, 150, 190, 230];
    const labels = ['-2', '-1', '0', '1', '2'];
    for (let t = 0; t < ticks.length; t++) {
      svg += `<line x1="${ticks[t]}" y1="102" x2="${ticks[t]}" y2="118" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      svg += `<text x="${ticks[t] - 4}" y="136" font-family="Calibri" font-size="11" fill="${COLOR_NAVY}" font-weight="bold">${labels[t]}</text>`;
    }
    // Highlight dot
    svg += `<circle cx="190" cy="110" r="5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
  }
  
  svg += '</svg>';
  return svg;
}

// Generate the self-contained slides HTML
function generateSlidesHtml(lessonId, data) {
  const title = `Lesson ${lessonId}: ${data.title || 'Math Lesson'}`;
  const standard = data.standard || '6.EE';
  const unit = data.unit || 1;
  const contentObj = data.contentObjective || 'Understand the mathematical connections in this lesson.';
  const langObj = data.languageObjective || 'Discuss findings using math vocab terms.';
  
  let launchText = 'Solve the problem and record your observations.';
  let noticeStemsHtml = '<div>🔹 I notice that...</div><div>🔹 Another observation...</div>';
  let wonderStemsHtml = '<div>🔹 I wonder if...</div><div>🔹 Why does...</div>';
  let vocabBankHtml = '';
  
  if (data.turnAndTalk && data.turnAndTalk.length > 0) {
    const talk = data.turnAndTalk[0];
    launchText = talk.question || launchText;
    if (talk.stems) {
      noticeStemsHtml = talk.stems.map(s => `<div>🔹 ${esc(s.en || s)}</div>`).join('');
    }
    if (talk.extendStems) {
      wonderStemsHtml = talk.extendStems.map(s => `<div>🔹 ${esc(s.en || s)}</div>`).join('');
    }
    if (talk.wordBank) {
      vocabBankHtml = talk.wordBank.map(v => `<span class="vocab-pill">${esc(v)}</span>`).join('');
    }
  }
  
  // Vocabulary cards
  let vocabTerms = ['ratio', 'relationship', 'variable', 'quantity'];
  if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].wordBank) {
    vocabTerms = data.turnAndTalk[0].wordBank;
  }
  
  let vocabCardsHtml = '';
  vocabTerms.slice(0, 4).forEach(term => {
    let def = 'Explain this vocabulary concept using real-world context.';
    if (term.toLowerCase().includes('prime')) def = 'A number greater than 1 with only factors 1 and itself.';
    if (term.toLowerCase().includes('composite')) def = 'A number with factors other than 1 and itself.';
    if (term.toLowerCase().includes('factor')) def = 'A number multiplied by another to get a product.';
    if (term.toLowerCase().includes('ratio')) def = 'A comparison of two quantities by division.';
    
    vocabCardsHtml += `
      <div class="vocab-card" onclick="this.classList.toggle('flipped')">
        <div class="vocab-card-inner">
          <div class="vocab-card-front">
            <h3>${esc(term.toUpperCase())}</h3>
            <p class="click-hint">Click to see definition ➔</p>
          </div>
          <div class="vocab-card-back">
            <p>${esc(def)}</p>
          </div>
        </div>
      </div>
    `;
  });
  
  // Guided problem
  let guidedText = 'Explain your reasoning and calculations with your partner.';
  let guidedStemsHtml = '<div>🔹 First, we need to... because...</div><div>🔹 Therefore, we can find...</div>';
  if (data.turnAndTalk && data.turnAndTalk.length > 1) {
    const talk = data.turnAndTalk[1];
    guidedText = talk.question || guidedText;
    if (talk.stems) {
      guidedStemsHtml = talk.stems.map(s => `<div>🔹 ${esc(s.en || s)}</div>`).join('');
    }
  }
  
  // Real world
  let realWorldText = 'Apply the math from today to understand this context.';
  if (data.projects && data.projects.length > 0) {
    realWorldText = `${data.projects[0].title}: ${data.projects[0].desc}`;
  }
  
  const svgVisual = generateMathVisualSvg(lessonId, data);
  
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — Google Slides</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --navy: #17324D;
      --teal: #1FA6A2;
      --teal-light: #DFF2EE;
      --amber: #F2C15B;
      --bg: #F7F4EC;
      --white: #FFFFFF;
      --coral: #FCE6DE;
      --body-text: #24323F;
      --gray: #8A96A3;
      --shadow: 0 4px 12px rgba(23, 50, 77, 0.08);
      --google-gray: #f1f3f4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef1f4;
      font-family: "Hanken Grotesk", sans-serif;
      color: var(--body-text);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    /* Google Slides Header Chrome */
    .g-chrome {
      background: var(--white);
      border-bottom: 1px solid #dadce0;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .g-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .g-logo {
      width: 40px;
      height: 40px;
      background: #f89b1c;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-weight: 800;
      font-size: 20px;
      font-family: "Outfit", sans-serif;
    }
    .g-title-block {
      display: flex;
      flex-direction: column;
    }
    .g-doc-title {
      font-weight: 700;
      font-size: 15px;
      color: var(--navy);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .g-doc-title span {
      background: var(--teal-light);
      color: var(--teal);
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 99px;
    }
    .g-menu-bar {
      display: flex;
      gap: 14px;
      font-size: 12px;
      color: var(--body-text);
      margin-top: 4px;
      font-weight: 600;
    }
    .g-menu-item { cursor: pointer; }
    .g-menu-item:hover { color: var(--teal); }
    
    .g-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .btn-present {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--teal);
      color: var(--white);
      border: none;
      padding: 8px 16px;
      border-radius: 99px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      font-family: "Outfit", sans-serif;
      box-shadow: 0 2px 6px rgba(31, 166, 162, 0.2);
      transition: all 0.2s;
    }
    .btn-present:hover {
      background: var(--navy);
      transform: translateY(-1px);
    }
    .btn-present:active {
      transform: translateY(0);
    }
    
    /* Layout Workspace */
    .workspace {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    
    /* Left Slide Thumbnail Navigation */
    .sidebar-slides {
      width: 180px;
      background: var(--white);
      border-right: 1px solid #dadce0;
      overflow-y: auto;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .thumb-card {
      border: 2px solid transparent;
      border-radius: 6px;
      padding: 2px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.2s;
    }
    .thumb-card:hover {
      background: var(--google-gray);
    }
    .thumb-card.active {
      border-color: var(--teal);
      background: var(--teal-light);
    }
    .thumb-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--gray);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .thumb-preview {
      background: var(--bg);
      border: 1px solid #dadce0;
      height: 80px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      color: var(--navy);
      text-align: center;
      padding: 6px;
    }
    
    /* Center Presentation Area */
    .presentation-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
    }
    
    /* Slide Canvas */
    .slide-canvas {
      width: 100%;
      max-width: 800px;
      aspect-ratio: 4 / 3;
      background: var(--bg);
      border: 1px solid #dadce0;
      box-shadow: 0 10px 30px rgba(23, 50, 77, 0.15);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    /* Header & Footer bars inside slide */
    .slide-header {
      background: var(--navy);
      color: var(--amber);
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
      font-family: "Outfit", sans-serif;
      letter-spacing: 0.02em;
    }
    .slide-footer {
      background: var(--navy);
      color: var(--white);
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-top: auto;
    }
    
    /* Slide Content Frames */
    .slide-body {
      flex: 1;
      padding: 24px;
      display: none;
      height: calc(100% - 84px);
    }
    .slide-body.active {
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.25s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Cards and Layout structures */
    .slide-card {
      background: var(--white);
      border: 2px solid var(--teal-light);
      border-radius: 8px;
      padding: 20px;
      box-shadow: var(--shadow);
      flex: 1;
      overflow-y: auto;
    }
    .slide-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      height: 100%;
    }
    
    h2.card-title {
      font-family: "Outfit", sans-serif;
      font-size: 18px;
      color: var(--navy);
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    p.card-desc {
      font-size: 14px;
      line-height: 1.6;
      color: var(--body-text);
      margin: 0 0 16px;
    }
    
    /* Notice and Wonder boxes */
    .nw-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .nw-box {
      border-radius: 8px;
      padding: 14px;
    }
    .nw-box-notice {
      background: var(--teal-light);
      border-left: 4px solid var(--teal);
    }
    .nw-box-wonder {
      background: var(--coral);
      border-left: 4px solid #D9795D;
    }
    .nw-box h4 { margin: 0 0 6px; font-size: 13px; color: var(--navy); font-weight: 700; }
    .nw-box-stems { font-size: 12px; color: var(--body-text); line-height: 1.5; }
    .nw-box-stems div { margin-bottom: 4px; }
    
    .vocab-pill {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      color: var(--teal);
      background: var(--teal-light);
      padding: 4px 10px;
      border-radius: 99px;
      margin-right: 6px;
      margin-top: 6px;
    }
    
    /* Vocab Flip Cards */
    .vocab-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .vocab-card {
      height: 90px;
      perspective: 1000px;
      cursor: pointer;
    }
    .vocab-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.5s;
      transform-style: preserve-3d;
    }
    .vocab-card.flipped .vocab-card-inner {
      transform: rotateY(180deg);
    }
    .vocab-card-front, .vocab-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px;
      box-shadow: var(--shadow);
    }
    .vocab-card-front {
      background: var(--white);
      border: 1px solid var(--teal);
      color: var(--navy);
    }
    .vocab-card-front h3 { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 0.05em; }
    .vocab-card-back {
      background: var(--teal-light);
      border: 1px solid var(--teal);
      color: var(--body-text);
      transform: rotateY(180deg);
      font-size: 11px;
      line-height: 1.4;
    }
    .click-hint { font-size: 9px; color: var(--gray); margin-top: 4px; font-weight: 600; }
    
    /* Math Flow Diagram */
    .flow-diagram {
      background: var(--teal-light);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      font-weight: 700;
      font-size: 12px;
      color: var(--navy);
    }
    .flow-box {
      background: var(--white);
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid var(--teal);
      text-align: center;
    }
    .flow-arrow { color: var(--amber); font-size: 18px; }
    
    /* Visual Math Container */
    .math-visual-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--white);
      border: 1px solid #dadce0;
      border-radius: 8px;
      padding: 10px;
    }
    
    /* Input Fields for Students */
    .student-input-area {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .input-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .input-row label {
      font-size: 11px;
      font-weight: 700;
      color: var(--gray);
      text-transform: uppercase;
    }
    .input-row textarea, .input-row input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--gray);
      border-radius: 6px;
      font-family: inherit;
      font-size: 13px;
      background: var(--bg);
      color: var(--body-text);
      resize: none;
    }
    .input-row textarea:focus, .input-row input:focus {
      outline: 2px solid var(--teal);
      border-color: transparent;
      background: var(--white);
    }
    
    /* Fullscreen Present Mode */
    .slide-canvas:-webkit-full-screen {
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
      aspect-ratio: auto !important;
      border-radius: 0 !important;
      border: none !important;
    }
    .slide-canvas:fullscreen {
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
      aspect-ratio: auto !important;
      border-radius: 0 !important;
      border: none !important;
    }
    
    /* Present mode visual adjustments */
    .slide-canvas:fullscreen .slide-header { height: 70px; font-size: 24px; }
    .slide-canvas:fullscreen .slide-footer { height: 40px; font-size: 14px; }
    .slide-canvas:fullscreen .slide-body { padding: 40px; }
    .slide-canvas:fullscreen h2.card-title { font-size: 22px; }
    .slide-canvas:fullscreen p.card-desc { font-size: 16px; }
    
    /* Presenter Controls Overlay */
    .presenter-controls {
      position: absolute;
      bottom: 24px;
      background: rgba(23, 50, 77, 0.95);
      backdrop-filter: blur(8px);
      border-radius: 99px;
      padding: 6px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      color: var(--white);
      z-index: 100;
      font-weight: 700;
      font-size: 13px;
    }
    .control-btn {
      background: transparent;
      border: none;
      color: var(--white);
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      transition: background 0.2s;
    }
    .control-btn:hover { background: rgba(255,255,255,0.15); }
    .control-btn:active { transform: scale(0.95); }
    
  </style>
</head>
<body>

  <!-- Google Slides Chrome Bar -->
  <header class="g-chrome">
    <div class="g-left">
      <div class="g-logo">M</div>
      <div class="g-title-block">
        <h1 class="g-doc-title">${esc(title)} <span>Grade 6 Math</span></h1>
        <div class="g-menu-bar">
          <div class="g-menu-item" onclick="window.print()">File</div>
          <div class="g-menu-item" onclick="alert('Student work is automatically saved to local browser storage.')">Edit</div>
          <div class="g-menu-item" onclick="document.querySelector('.slide-canvas').requestFullscreen()">View</div>
          <div class="g-menu-item">Format</div>
          <div class="g-menu-item" onclick="alert('Lesson: ${esc(lessonId)} | Unit: ${unit}')">Slide</div>
          <div class="g-menu-item" style="color:var(--teal)">Saved to Browser ✓</div>
        </div>
      </div>
    </div>
    <div class="g-right">
      <button class="btn-present" onclick="document.querySelector('.slide-canvas').requestFullscreen()">
        ▶ Present
      </button>
      <div style="width: 36px; height: 36px; background: var(--teal); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 15px; box-shadow: var(--shadow);">
        JN
      </div>
    </div>
  </header>

  <!-- Workspace Area -->
  <main class="workspace">
  
    <!-- Sidebar Thumbnails -->
    <nav class="sidebar-slides">
      <!-- Slide 1 -->
      <div class="thumb-card active" data-slide="1" onclick="goToSlide(1)">
        <span class="thumb-label">Slide 1</span>
        <div class="thumb-preview">🎯 Objectives</div>
      </div>
      <!-- Slide 2 -->
      <div class="thumb-card" data-slide="2" onclick="goToSlide(2)">
        <span class="thumb-label">Slide 2</span>
        <div class="thumb-preview">👀 Be Curious</div>
      </div>
      <!-- Slide 3 -->
      <div class="thumb-card" data-slide="3" onclick="goToSlide(3)">
        <span class="thumb-label">Slide 3</span>
        <div class="thumb-preview">📝 Vocabulary</div>
      </div>
      <!-- Slide 4 -->
      <div class="thumb-card" data-slide="4" onclick="goToSlide(4)">
        <span class="thumb-label">Slide 4</span>
        <div class="thumb-preview">📐 Visual Model</div>
      </div>
      <!-- Slide 5 -->
      <div class="thumb-card" data-slide="5" onclick="goToSlide(5)">
        <span class="thumb-label">Slide 5</span>
        <div class="thumb-preview">📖 Guided</div>
      </div>
      <!-- Slide 6 -->
      <div class="thumb-card" data-slide="6" onclick="goToSlide(6)">
        <span class="thumb-label">Slide 6</span>
        <div class="thumb-preview">👥 Activity A</div>
      </div>
      <!-- Slide 7 -->
      <div class="thumb-card" data-slide="7" onclick="goToSlide(7)">
        <span class="thumb-label">Slide 7</span>
        <div class="thumb-preview">⚠️ Activity B</div>
      </div>
      <!-- Slide 8 -->
      <div class="thumb-card" data-slide="8" onclick="goToSlide(8)">
        <span class="thumb-label">Slide 8</span>
        <div class="thumb-preview">🌍 Connection</div>
      </div>
      <!-- Slide 9 -->
      <div class="thumb-card" data-slide="9" onclick="goToSlide(9)">
        <span class="thumb-label">Slide 9</span>
        <div class="thumb-preview">🤔 Reflection</div>
      </div>
    </nav>

    <!-- Presentation Area -->
    <div class="presentation-container">
    
      <!-- The Presentation Slide -->
      <article class="slide-canvas">
      
        <!-- Inside Slide Header -->
        <header class="slide-header" id="slide-title-bar">LESSON ${esc(lessonId)} · OBJECTIVES</header>
        
        <!-- SLIDE 1: OBJECTIVES -->
        <div class="slide-body active" id="slide-1">
          <div class="slide-card">
            <h2 class="card-title">🎯 Lesson Objectives</h2>
            <div style="font-size: 16px; line-height: 1.6; display: flex; flex-direction: column; gap: 16px;">
              <div>
                <strong style="color:var(--navy);">Content Objective:</strong>
                <p style="margin: 4px 0 0; color:var(--body-text);">${esc(contentObj)}</p>
              </div>
              <div>
                <strong style="color:var(--navy);">Language Objective:</strong>
                <p style="margin: 4px 0 0; color:var(--body-text);">${esc(langObj)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 2: BE CURIOUS -->
        <div class="slide-body" id="slide-2">
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <h2 class="card-title">📋 Scenario Launch</h2>
                <p class="card-desc" style="font-size:13.5px;">${esc(launchText)}</p>
              </div>
              <div>
                <strong style="font-size:11px; color:var(--gray); text-transform:uppercase;">Word Bank:</strong>
                <div style="margin-top:4px;">${vocabBankHtml}</div>
              </div>
            </div>
            <div class="slide-card nw-container">
              <div class="nw-box nw-box-notice">
                <h4>👀 Things I Notice:</h4>
                <div class="nw-box-stems">${noticeStemsHtml}</div>
              </div>
              <div class="nw-box nw-box-wonder">
                <h4>💭 Things I Wonder:</h4>
                <div class="nw-box-stems">${wonderStemsHtml}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 3: VOCABULARY -->
        <div class="slide-body" id="slide-3">
          <div class="slide-grid-2">
            <div style="display: flex; flex-direction: column; gap: 12px; justify-content: center;">
              <h2 class="card-title">📝 Core Vocabulary</h2>
              <p class="card-desc">Click each term card to flip and verify its definition and meaning.</p>
              <div class="flow-diagram">
                <div class="flow-box">INPUT</div>
                <div class="flow-arrow">➔</div>
                <div class="flow-box" style="border-color:var(--amber);">PROCESS</div>
                <div class="flow-arrow">➔</div>
                <div class="flow-box">OUTPUT</div>
              </div>
            </div>
            <div class="vocab-grid">
              ${vocabCardsHtml}
            </div>
          </div>
        </div>
        
        <!-- SLIDE 4: VISUAL MODEL -->
        <div class="slide-body" id="slide-4">
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:center;">
              <h2 class="card-title">📐 Visual Modeling</h2>
              <p class="card-desc">Observe the visual model for this concept. Practice labeling or drawing the components with your partner.</p>
            </div>
            <div class="math-visual-container">
              ${svgVisual}
            </div>
          </div>
        </div>
        
        <!-- SLIDE 5: GUIDED PRACTICE -->
        <div class="slide-body" id="slide-5">
          <div class="slide-grid-2">
            <div class="slide-card">
              <h2 class="card-title">📖 Guided Practice</h2>
              <p class="card-desc" style="font-size:13.5px;">${esc(guidedText)}</p>
            </div>
            <div class="slide-card" style="background:var(--teal-light);">
              <h2 class="card-title">✍️ TWR Sentence Expansion</h2>
              <div class="nw-box-stems" style="font-size:13px; font-style:italic;">${guidedStemsHtml}</div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 6: INTERACTIVE WORKSHOP A -->
        <div class="slide-body" id="slide-6">
          <div class="slide-grid-2">
            <div class="slide-card">
              <h2 class="card-title" style="color:var(--teal);">👥 Partner A</h2>
              <p class="card-desc">Explain how you can approach solving this problem. What steps will you perform first, and what tools will you use?</p>
              <div class="student-input-area">
                <div class="input-row">
                  <label for="work-a">Partner A Work:</label>
                  <textarea id="work-a" rows="3" placeholder="Type your explanation here..."></textarea>
                </div>
              </div>
            </div>
            <div class="slide-card">
              <h2 class="card-title">👥 Partner B</h2>
              <p class="card-desc">Respond to your partner's explanation. Do you agree with their approach? How would you verify their final calculations?</p>
              <div class="student-input-area">
                <div class="input-row">
                  <label for="work-b">Partner B Work:</label>
                  <textarea id="work-b" rows="3" placeholder="Type your response here..."></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 7: INTERACTIVE WORKSHOP B -->
        <div class="slide-body" id="slide-7">
          <div class="slide-grid-2">
            <div class="slide-card">
              <h2 class="card-title" style="color:var(--amber);">⚠️ Incorrect Claim</h2>
              <p class="card-desc">A student claims that when solving this problem, they should add the values instead of multiplying. Why is this reasoning incorrect?</p>
            </div>
            <div class="slide-card" style="background:var(--coral);">
              <h2 class="card-title">🛠️ Fix & Justify</h2>
              <div class="student-input-area">
                <div class="input-row">
                  <label for="fix-error">Write your correction:</label>
                  <textarea id="fix-error" rows="4" placeholder="Explain the mistake and show the correct calculations..."></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 8: REAL-WORLD CONNECTION -->
        <div class="slide-body" id="slide-8">
          <div class="slide-grid-2">
            <div class="slide-card">
              <h2 class="card-title">🌍 Math in the Wild</h2>
              <p class="card-desc">${esc(realWorldText)}</p>
            </div>
            <div class="slide-card" style="background:var(--teal-light);">
              <h2 class="card-title">✍️ Connection Reasoning</h2>
              <div class="student-input-area">
                <div class="input-row">
                  <label for="connect-reasoning">This applies because:</label>
                  <input type="text" id="connect-reasoning" placeholder="Type your reasoning..." />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 9: REFLECTION -->
        <div class="slide-body" id="slide-9">
          <div class="slide-grid-2">
            <div class="slide-card">
              <h2 class="card-title">🤔 3-2-1 Reflection</h2>
              <div style="font-size:12px; display:flex; flex-direction:column; gap:8px;">
                <div><strong>📝 3 Things I learned:</strong> <input type="text" placeholder="1. ..." /></div>
                <div><strong>💡 2 Connections I made:</strong> <input type="text" placeholder="1. ..." /></div>
                <div><strong>❓ 1 Question I still have:</strong> <input type="text" placeholder="1. ..." /></div>
              </div>
            </div>
            <div class="slide-card" style="background:var(--teal-light);">
              <h2 class="card-title">📝 Exit Ticket</h2>
              <div class="student-input-area">
                <div class="input-row">
                  <label for="exit-ticket-solution">Solution:</label>
                  <textarea id="exit-ticket-solution" rows="4" placeholder="Record your final solution and reasoning here..."></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Inside Slide Footer -->
        <footer class="slide-footer">Neft Teacher · Grade 6 Math · Unit ${unit} · Lesson ${esc(lessonId)}</footer>
        
      </article>
      
      <!-- Presenter Controls -->
      <div class="presenter-controls">
        <button class="control-btn" onclick="prevSlide()">◀</button>
        <span id="control-page-num">1 / 9</span>
        <button class="control-btn" onclick="nextSlide()">▶</button>
      </div>
      
    </div>
    
  </main>

  <script>
    let currentSlide = 1;
    const totalSlides = 9;
    
    const slideTitles = [
      "LESSON ${esc(lessonId)} · OBJECTIVES",
      "BE CURIOUS · LAUNCH",
      "KEY VOCABULARY & FLOW",
      "VISUAL MODELING WORKSPACE",
      "GUIDED PRACTICE",
      "INTERACTIVE WORKSHOP A",
      "INTERACTIVE WORKSHOP B · ERROR ANALYSIS",
      "REAL-WORLD CONNECTION · MATH IN THE WILD",
      "REFLECTION & EXIT TICKET"
    ];
    
    function goToSlide(num) {
      if (num < 1 || num > totalSlides) return;
      
      // Update state
      currentSlide = num;
      
      // Update main panels
      document.querySelectorAll('.slide-body').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) === num);
      });
      
      // Update sidebar thumbnails
      document.querySelectorAll('.thumb-card').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) === num);
      });
      
      // Update title text
      document.getElementById('slide-title-bar').textContent = slideTitles[num - 1];
      
      // Update presenter controls page indicator
      document.getElementById('control-page-num').textContent = num + ' / ' + totalSlides;
    }
    
    function prevSlide() {
      if (currentSlide > 1) goToSlide(currentSlide - 1);
    }
    
    function nextSlide() {
      if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
    }
    
    // Wire arrow keys for slide navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        nextSlide();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
        e.preventDefault();
      }
    });
    
    // Save student work to localStorage
    const storageKey = 'neft_slides_work_${esc(lessonId)}';
    const inputs = document.querySelectorAll('textarea, input[type="text"]');
    
    function saveWork() {
      const data = {};
      inputs.forEach((input, index) => {
        data[input.id || 'input_' + index] = input.value;
      });
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
    
    function loadWork() {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const data = JSON.parse(saved);
          inputs.forEach((input, index) => {
            const val = data[input.id || 'input_' + index];
            if (val !== undefined) input.value = val;
          });
        }
      } catch (e) {
        console.error('Failed to load saved work:', e);
      }
    }
    
    inputs.forEach(input => {
      input.addEventListener('input', saveWork);
    });
    
    window.addEventListener('load', loadWork);
  </script>

</body>
</html>
`;
}

// Main execution block
function main() {
  console.log('Generating interactive Google Slides clones for all lessons...');
  const lessons = readdirSync(lessonsDir)
    .filter(d => /^(\d+)-(\d+)(-flagship)?$/.test(d))
    .filter(d => existsSync(join(lessonsDir, d, 'config.json')));
    
  let count = 0;
  lessons.forEach(id => {
    try {
      const configPath = join(lessonsDir, id, 'config.json');
      const data = JSON.parse(readFileSync(configPath, 'utf8'));
      const html = generateSlidesHtml(id, data);
      
      const outputPath = join(lessonsDir, id, 'slides.html');
      writeFileSync(outputPath, html, 'utf8');
      count++;
    } catch (e) {
      console.error(`Failed to generate slides for lesson ${id}:`, e);
    }
  });
  
  console.log(`Successfully generated slides.html for ${count} lessons.`);
}

main();
