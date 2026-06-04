import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const lessonsDir = join(root, 'lessons');

// Define color tokens matching Design System
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

// Generate high-fidelity math SVG diagram based on data.launch.visual
function generateMathVisualSvg(lessonId, data) {
  const width = 440;
  const height = 240;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="background:white; border-radius:8px;">`;
  
  // Outer frame
  svg += `<rect x="5" y="5" width="${width - 10}" height="${height - 10}" fill="#F9FBFC" stroke="${COLOR_TEAL}" stroke-width="2"/>`;
  
  // Background Grid Lines
  for (let x = 20; x < width - 10; x += 30) {
    svg += `<line x1="${x}" y1="5" x2="${x}" y2="${height - 5}" stroke="#E1EAEF" stroke-width="1"/>`;
  }
  for (let y = 20; y < height - 10; y += 30) {
    svg += `<line x1="5" y1="${y}" x2="${width - 5}" y2="${y}" stroke="#E1EAEF" stroke-width="1"/>`;
  }

  const visual = data.launch && data.launch.visual;
  
  if (visual && visual.kind) {
    const kind = visual.kind;
    
    if (kind === 'data-chips') {
      const title = visual.title || 'Data Visual Model';
      const values = visual.values || [];
      const unit = visual.unit || '';
      
      svg += `<text x="20" y="32" font-family="Outfit, sans-serif" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">${esc(title)}</text>`;
      
      const startX = 40;
      const count = values.length;
      const spacing = count > 1 ? Math.min(80, (width - 80) / (count - 1)) : 60;
      
      values.forEach((val, idx) => {
        const cx = startX + idx * spacing;
        const cy = 110;
        svg += `<circle cx="${cx}" cy="${cy}" r="20" fill="${COLOR_TEAL_LIGHT}" stroke="${COLOR_TEAL}" stroke-width="2" />`;
        svg += `<text x="${cx}" y="${cy + 5}" font-family="Outfit, sans-serif" font-size="13" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${esc(val)}</text>`;
      });
      
      if (unit) {
        svg += `<text x="20" y="195" font-family="Hanken Grotesk, sans-serif" font-size="11" fill="${COLOR_NAVY}" font-weight="bold">${esc(unit)}</text>`;
      }
      
    } else if (kind === 'number-line') {
      const title = visual.title || 'Number Line Model';
      const min = visual.min !== undefined ? visual.min : 0;
      const max = visual.max !== undefined ? visual.max : 10;
      const step = visual.step || 1;
      const points = visual.points || visual.targets || [];
      const caption = visual.caption || '';
      
      svg += `<text x="20" y="32" font-family="Outfit, sans-serif" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">${esc(title)}</text>`;
      
      const startX = 40;
      const endX = width - 40;
      const lineY = 120;
      
      svg += `<line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="${startX}" y1="${lineY}" x2="${startX + 8}" y2="${lineY - 6}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="${startX}" y1="${lineY}" x2="${startX + 8}" y2="${lineY + 6}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="${endX}" y1="${lineY}" x2="${endX - 8}" y2="${lineY - 6}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="${endX}" y1="${lineY}" x2="${endX - 8}" y2="${lineY + 6}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      
      const range = max - min;
      const startTickX = startX + 15;
      const tickSpacing = (endX - startX - 30) / (range || 1);
      
      for (let v = min; v <= max; v += step) {
        const tx = startTickX + (v - min) * tickSpacing;
        svg += `<line x1="${tx}" y1="${lineY - 6}" x2="${tx}" y2="${lineY + 6}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
        svg += `<text x="${tx}" y="${lineY + 18}" font-family="Outfit, sans-serif" font-size="9" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${v}</text>`;
      }
      
      points.forEach(pt => {
        const val = pt.value !== undefined ? pt.value : pt;
        const label = pt.label || '';
        const tx = startTickX + (val - min) * tickSpacing;
        
        svg += `<circle cx="${tx}" cy="${lineY}" r="5" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="1.2"/>`;
        if (label) {
          svg += `<text x="${tx}" y="${lineY - 12}" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${esc(label)}</text>`;
        }
      });
      
      if (caption) {
        svg += `<text x="20" y="210" font-family="Hanken Grotesk, sans-serif" font-size="10" fill="${COLOR_BODY_TEXT}" font-style="italic">${esc(caption)}</text>`;
      }
      
    } else if (kind === 'tape-diagram') {
      const title = visual.title || 'Tape Diagram Model';
      const rows = visual.rows || [];
      const caption = visual.caption || '';
      
      svg += `<text x="20" y="32" font-family="Outfit, sans-serif" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">${esc(title)}</text>`;
      
      let currentY = 55;
      rows.forEach((row, rowIdx) => {
        const parts = row.parts || [];
        const totalVal = parts.reduce((sum, p) => sum + (p.value || 0), 0);
        const rowWidth = width - 80;
        const startX = 40;
        
        if (row.label) {
          svg += `<text x="${startX}" y="${currentY - 6}" font-family="Outfit, sans-serif" font-size="10" fill="${COLOR_NAVY}" font-weight="bold">${esc(row.label)}</text>`;
        }
        
        let currentX = startX;
        parts.forEach((part, pIdx) => {
          const partVal = part.value || 0;
          const partWidth = totalVal > 0 ? (partVal / totalVal) * rowWidth : rowWidth / (parts.length || 1);
          const partHeight = 35;
          const fill = pIdx % 2 === 0 ? COLOR_TEAL_LIGHT : COLOR_AMBER;
          
          svg += `<rect x="${currentX}" y="${currentY}" width="${partWidth}" height="${partHeight}" fill="${fill}" stroke="${COLOR_NAVY}" stroke-width="1.5" rx="3" ry="3"/>`;
          
          const textX = currentX + partWidth / 2;
          const textY = currentY + 22;
          const displayLabel = part.label || String(partVal);
          svg += `<text x="${textX}" y="${textY}" font-family="Outfit, sans-serif" font-size="9" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${esc(displayLabel)}</text>`;
          
          currentX += partWidth;
        });
        currentY += 65;
      });
      
      if (caption) {
        svg += `<text x="20" y="210" font-family="Hanken Grotesk, sans-serif" font-size="10" fill="${COLOR_BODY_TEXT}" font-style="italic">${esc(caption)}</text>`;
      }
      
    } else if (kind === 'dot-plot') {
      const title = visual.title || 'Dot Plot Model';
      const values = visual.values || [];
      const xLabel = visual.xLabel || '';
      const caption = visual.caption || '';
      
      svg += `<text x="20" y="32" font-family="Outfit, sans-serif" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">${esc(title)}</text>`;
      
      let minVal = Math.min(...values);
      let maxVal = Math.max(...values);
      if (minVal === Infinity || isNaN(minVal)) { minVal = 0; maxVal = 10; }
      if (minVal === maxVal) { minVal = Math.max(0, minVal - 2); maxVal = maxVal + 2; }
      
      const range = maxVal - minVal;
      const startX = 50;
      const endX = width - 50;
      const lineY = 160;
      const spacing = (endX - startX) / (range || 1);
      
      svg += `<line x1="${startX - 10}" y1="${lineY}" x2="${endX + 10}" y2="${lineY}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      
      for (let v = minVal; v <= maxVal; v++) {
        const tx = startX + (v - minVal) * spacing;
        svg += `<line x1="${tx}" y1="${lineY}" x2="${tx}" y2="${lineY + 5}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
        svg += `<text x="${tx}" y="${lineY + 15}" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${v}</text>`;
      }
      
      const counts = {};
      values.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
        const countIdx = counts[val];
        const tx = startX + (val - minVal) * spacing;
        const dotY = lineY - countIdx * 10 + 3;
        svg += `<circle cx="${tx}" cy="${dotY}" r="4" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
      });
      
      if (xLabel) {
        svg += `<text x="${width / 2}" y="${lineY + 28}" font-family="Outfit, sans-serif" font-size="9" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${esc(xLabel)}</text>`;
      }
      
      if (caption) {
        svg += `<text x="20" y="210" font-family="Hanken Grotesk, sans-serif" font-size="10" fill="${COLOR_BODY_TEXT}" font-style="italic">${esc(caption)}</text>`;
      }
      
    } else if (kind === 'box-plot') {
      const title = visual.title || 'Box Plot Model';
      const min = visual.min !== undefined ? visual.min : 0;
      const q1 = visual.q1 !== undefined ? visual.q1 : 2;
      const median = visual.median !== undefined ? visual.median : 5;
      const q3 = visual.q3 !== undefined ? visual.q3 : 8;
      const max = visual.max !== undefined ? visual.max : 10;
      const axisMin = visual.axisMin !== undefined ? visual.axisMin : 0;
      const axisMax = visual.axisMax !== undefined ? visual.axisMax : 10;
      const caption = visual.caption || '';
      
      svg += `<text x="20" y="32" font-family="Outfit, sans-serif" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">${esc(title)}</text>`;
      
      const startX = 50;
      const endX = width - 50;
      const axisY = 160;
      const axisRange = axisMax - axisMin;
      const scale = (endX - startX) / (axisRange || 1);
      
      // Draw axis
      svg += `<line x1="${startX}" y1="${axisY}" x2="${endX}" y2="${axisY}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      const step = axisRange > 20 ? 5 : (axisRange > 10 ? 2 : 1);
      for (let v = axisMin; v <= axisMax; v += step) {
        const tx = startX + (v - axisMin) * scale;
        svg += `<line x1="${tx}" y1="${axisY}" x2="${tx}" y2="${axisY + 5}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
        svg += `<text x="${tx}" y="${axisY + 15}" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${v}</text>`;
      }
      
      const plotY = 90;
      const xMin = startX + (min - axisMin) * scale;
      const xQ1 = startX + (q1 - axisMin) * scale;
      const xMed = startX + (median - axisMin) * scale;
      const xQ3 = startX + (q3 - axisMin) * scale;
      const xMax = startX + (max - axisMin) * scale;
      
      // Whiskers
      svg += `<line x1="${xMin}" y1="${plotY}" x2="${xQ1}" y2="${plotY}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      svg += `<line x1="${xQ3}" y1="${plotY}" x2="${xMax}" y2="${plotY}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      svg += `<line x1="${xMin}" y1="${plotY - 10}" x2="${xMin}" y2="${plotY + 10}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      svg += `<line x1="${xMax}" y1="${plotY - 10}" x2="${xMax}" y2="${plotY + 10}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      
      // Box
      svg += `<rect x="${xQ1}" y="${plotY - 20}" width="${Math.max(2, xQ3 - xQ1)}" height="40" fill="${COLOR_TEAL_LIGHT}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      // Median line
      svg += `<line x1="${xMed}" y1="${plotY - 20}" x2="${xMed}" y2="${plotY + 20}" stroke="${COLOR_NAVY}" stroke-width="2.5"/>`;
      
      // Labels
      svg += `<text x="${xMin}" y="${plotY - 14}" font-family="Outfit, sans-serif" font-size="7" fill="${COLOR_NAVY}" text-anchor="middle">Min (${min})</text>`;
      svg += `<text x="${xQ1}" y="${plotY - 24}" font-family="Outfit, sans-serif" font-size="7" fill="${COLOR_NAVY}" text-anchor="middle">Q1 (${q1})</text>`;
      svg += `<text x="${xMed}" y="${plotY + 31}" font-family="Outfit, sans-serif" font-size="7" fill="${COLOR_NAVY}" text-anchor="middle">Med (${median})</text>`;
      svg += `<text x="${xQ3}" y="${plotY - 24}" font-family="Outfit, sans-serif" font-size="7" fill="${COLOR_NAVY}" text-anchor="middle">Q3 (${q3})</text>`;
      svg += `<text x="${xMax}" y="${plotY - 14}" font-family="Outfit, sans-serif" font-size="7" fill="${COLOR_NAVY}" text-anchor="middle">Max (${max})</text>`;
      
      if (caption) {
        svg += `<text x="20" y="210" font-family="Hanken Grotesk, sans-serif" font-size="9" fill="${COLOR_BODY_TEXT}" font-style="italic">${esc(caption)}</text>`;
      }
      
    } else if (kind === 'histogram') {
      const title = visual.title || 'Histogram Model';
      const xLabel = visual.xLabel || '';
      const yLabel = visual.yLabel || '';
      const bars = visual.bars || [];
      const highlightIndex = visual.highlightIndex !== undefined ? visual.highlightIndex : -1;
      const caption = visual.caption || '';
      
      svg += `<text x="20" y="32" font-family="Outfit, sans-serif" font-size="12" fill="${COLOR_NAVY}" font-weight="bold">${esc(title)}</text>`;
      
      const maxVal = Math.max(...bars.map(b => b.value || 0), 1);
      const startX = 60;
      const endX = width - 40;
      const axisY = 165;
      const chartHeight = 110;
      const barWidth = (endX - startX) / (bars.length || 1);
      
      bars.forEach((bar, idx) => {
        const val = bar.value || 0;
        const bHeight = (val / maxVal) * chartHeight;
        const bx = startX + idx * barWidth;
        const by = axisY - bHeight;
        const fill = idx === highlightIndex ? COLOR_AMBER : COLOR_TEAL_LIGHT;
        
        svg += `<rect x="${bx}" y="${by}" width="${barWidth - 2}" height="${bHeight}" fill="${fill}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
        svg += `<text x="${bx + barWidth / 2}" y="${axisY + 12}" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${esc(bar.label)}</text>`;
        svg += `<text x="${bx + barWidth / 2}" y="${by - 4}" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" text-anchor="middle">${val}</text>`;
      });
      
      svg += `<line x1="${startX - 5}" y1="${axisY}" x2="${endX}" y2="${axisY}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      svg += `<line x1="${startX - 5}" y1="${axisY - chartHeight - 5}" x2="${startX - 5}" y2="${axisY}" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
      
      if (xLabel) {
        svg += `<text x="${(startX + endX) / 2}" y="${axisY + 26}" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${esc(xLabel)}</text>`;
      }
      if (yLabel) {
        svg += `<text x="${startX - 35}" y="${axisY - chartHeight / 2}" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle" transform="rotate(-90 ${startX - 35} ${axisY - chartHeight / 2})">${esc(yLabel)}</text>`;
      }
      
      if (caption) {
        svg += `<text x="20" y="212" font-family="Hanken Grotesk, sans-serif" font-size="9" fill="${COLOR_BODY_TEXT}" font-style="italic">${esc(caption)}</text>`;
      }
    }
  } else {
    // Standard based geometric / proportional fallback
    const standard = data.standard || '';
    const isGeometry = standard.includes('.G.') || lessonId.startsWith('5-') || lessonId.startsWith('10-');
    const isProportional = standard.includes('.RP.') || lessonId.startsWith('3-') || lessonId.startsWith('4-');
    
    if (isGeometry) {
      svg += `<polygon points="80,180 220,50 360,180" fill="${COLOR_TEAL_LIGHT}" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="80" y1="195" x2="360" y2="195" stroke="${COLOR_NAVY}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
      svg += `<text x="200" y="212" font-family="Outfit, sans-serif" font-size="11" fill="${COLOR_NAVY}" font-weight="bold">Base (b)</text>`;
      svg += `<line x1="220" y1="50" x2="220" y2="180" stroke="${COLOR_AMBER}" stroke-width="1.5" stroke-dasharray="4,4"/>`;
      svg += `<text x="230" y="115" font-family="Outfit, sans-serif" font-size="11" fill="${COLOR_NAVY}" font-weight="bold">Height (h)</text>`;
    } else if (isProportional) {
      svg += `<line x1="60" y1="190" x2="380" y2="190" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="80" y1="30" x2="80" y2="200" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<text x="340" y="210" font-family="Outfit, sans-serif" font-size="10" fill="${COLOR_NAVY}" font-weight="bold">Input (x)</text>`;
      svg += `<text x="25" y="45" font-family="Outfit, sans-serif" font-size="10" fill="${COLOR_NAVY}" font-weight="bold">Output (y)</text>`;
      svg += `<line x1="80" y1="190" x2="340" y2="60" stroke="${COLOR_AMBER}" stroke-width="3"/>`;
      svg += `<circle cx="210" cy="125" r="4.5" fill="${COLOR_TEAL}"/>`;
      svg += `<circle cx="340" cy="60" r="4.5" fill="${COLOR_TEAL}"/>`;
    } else {
      svg += `<line x1="40" y1="120" x2="400" y2="120" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="40" y1="120" x2="48" y2="114" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="40" y1="120" x2="48" y2="126" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="400" y1="120" x2="392" y2="114" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      svg += `<line x1="400" y1="120" x2="392" y2="126" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
      
      const ticks = [100, 160, 220, 280, 340];
      const labels = ['-2', '-1', '0', '1', '2'];
      for (let t = 0; t < ticks.length; t++) {
        svg += `<line x1="${ticks[t]}" y1="112" x2="${ticks[t]}" y2="128" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
        svg += `<text x="${ticks[t]}" y="${142}" font-family="Outfit, sans-serif" font-size="9" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${labels[t]}</text>`;
      }
      svg += `<circle cx="280" cy="120" r="5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    }
  }
  
  svg += '</svg>';
  return svg;
}

// Generate the self-contained slides HTML
function generateSlidesHtml(lessonId, data) {
  const title = `Lesson ${lessonId}: ${data.title || 'Math Lesson'}`;
  const standard = data.standard || '6th Grade Common Core';
  const unit = data.unit || 1;
  const contentObj = data.contentObjective || 'Understand the mathematical connections in this lesson.';
  const langObj = data.languageObjective || 'Discuss findings using math vocab terms.';
  
  // Slide 2 Narrative Launch Bindings
  const launchBadge = data.launch ? (data.launch.badge || 'Scenario Launch') : 'Scenario Launch';
  const launchNarrative = data.launch ? (data.launch.narrative || 'Solve the problem and record observations.') : 'Solve the problem and record observations.';
  const noticePrompts = data.launch ? (data.launch.noticePrompts || []) : [];
  const wonderPrompts = data.launch ? (data.launch.wonderPrompts || []) : [];
  const noticeStemsHtml = noticePrompts.map(p => `<div>🔹 ${esc(p)}</div>`).join('');
  const wonderStemsHtml = wonderPrompts.map(p => `<div>🔹 ${esc(p)}</div>`).join('');
  
  let launchVocabBankHtml = '';
  if (data.turnAndTalk && data.turnAndTalk.length > 0) {
    const talk = data.turnAndTalk[0];
    if (talk.wordBank) {
      launchVocabBankHtml = talk.wordBank.map(v => `<span class="vocab-pill" onclick="insertAtCursor(this.textContent)">${esc(v)}</span>`).join('');
    }
  }
  
  // Slide 3 Concept Intro Bindings
  const conceptIntro = data.launch ? data.launch.conceptIntro : null;
  const conceptHeading = conceptIntro ? (conceptIntro.heading || 'Concept Introduction') : 'Concept Introduction';
  const conceptText = conceptIntro ? (conceptIntro.intro || 'Review the core concept of this lesson.') : 'Review the core concept of this lesson.';
  const conceptKeyIdea = conceptIntro ? (conceptIntro.keyIdea || '') : '';
  const iDoTitle = conceptIntro && conceptIntro.iDo ? (conceptIntro.iDo.title || 'Watch me (I Do)') : 'Watch me (I Do)';
  const iDoLines = conceptIntro && conceptIntro.iDo ? (conceptIntro.iDo.lines || []) : [];
  const weDoTitle = conceptIntro && conceptIntro.weDo ? (conceptIntro.weDo.title || 'Let\'s try together (We Do)') : 'Let\'s try together (We Do)';
  const weDoLines = conceptIntro && conceptIntro.weDo ? (conceptIntro.weDo.lines || []) : [];
  const youDoTitle = conceptIntro && conceptIntro.youDo ? (conceptIntro.youDo.title || 'Now it\'s your turn (You Do)') : 'Now it\'s your turn (You Do)';
  const youDoLines = conceptIntro && conceptIntro.youDo ? (conceptIntro.youDo.lines || []) : [];

  // Slide 4 Vocabulary cards (dynamic)
  const vocabList = data.vocabulary || [];
  let vocabCardsHtml = '';
  vocabList.slice(0, 4).forEach((v, idx) => {
    const term = v.term || '';
    const termEs = v.termEs || '';
    const definition = v.definition || 'No definition available.';
    const definitionEs = v.definitionEs || '';
    const visual = v.visual || '';
    const cloze = v.cloze || '';
    
    vocabCardsHtml += `
      <div class="vocab-card" onclick="this.classList.toggle('flipped')">
        <div class="vocab-card-inner">
          <div class="vocab-card-front">
            <h3>${esc(term.toUpperCase())}</h3>
            ${termEs ? `<p style="font-size:10px; color:var(--gray); font-style:italic; margin: 4px 0 0;">${esc(termEs)}</p>` : ''}
            <p class="click-hint">Click to flip ➔</p>
          </div>
          <div class="vocab-card-back">
            <p style="font-weight:700; margin:0 0 6px; color:var(--navy); font-size:10.5px; line-height:1.3;">${esc(definition)}</p>
            ${definitionEs ? `<p style="font-size:9.5px; color:var(--gray); margin:0 0 8px; font-style:italic; line-height:1.2;">${esc(definitionEs)}</p>` : ''}
            ${visual ? `<div style="border-top: 1px dashed var(--teal); padding-top:4px; font-size:9px; font-style:italic; color:var(--body-text); text-align:left;"><strong>Ex:</strong> ${esc(visual)}</div>` : ''}
            ${cloze ? `<div style="margin-top:4px; font-size:9px; background:var(--white); padding:3px; border-radius:3px; border:1px solid #e1eaeef8; text-align:left;">📝 ${esc(cloze)}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  // Slide 6 Explore Game Bindings
  const explore = data.explore || {};
  const exploreInstructions = explore.instructions || explore.label || 'Sort the items into the correct categories.';
  
  let normalizedCats = [];
  if (explore.categories) {
    normalizedCats = explore.categories.map((c, idx) => {
      if (typeof c === 'string') {
        return { id: String(idx), label: c };
      }
      return { id: String(c.id || idx), label: c.label || String(c) };
    });
  } else {
    normalizedCats = [
      { id: 'cat-a', label: 'Category A' },
      { id: 'cat-b', label: 'Category B' }
    ];
  }
  
  let normalizedItems = [];
  const rawItems = explore.items || explore.cards || [];
  rawItems.forEach((item, idx) => {
    let text = item.text || String(item);
    let catId = '';
    
    if (item.category !== undefined) {
      catId = String(item.category);
    } else if (item.correct !== undefined) {
      catId = String(item.correct);
    }
    
    normalizedItems.push({ id: idx, text: text, catId: catId });
  });

  const discourse = explore.discourse || {};
  const discoursePrompt = discourse.prompt || 'Explain your strategy and reasoning.';
  const discourseFrame = discourse.sentenceFrame || '';
  const discourseKeywords = discourse.keywords || [];
  
  let exploreVocabBankHtml = '';
  if (discourseKeywords && discourseKeywords.length > 0) {
    exploreVocabBankHtml = discourseKeywords.map(k => `<span class="vocab-pill" onclick="insertAtCursor(this.textContent)">${esc(k)}</span>`).join('');
  }
  
  // Slide 7 Practice Problem Bindings
  let practiceProblem = null;
  let practiceType = 'generic'; // 'error-analysis', 'multiple-choice', 'generic'
  
  if (data.practice && data.practice.extending) {
    const errProb = data.practice.extending.find(p => p.type === 'error-analysis');
    if (errProb) {
      practiceProblem = errProb;
      practiceType = 'error-analysis';
    }
  }
  
  if (!practiceProblem && data.practice) {
    const mcProb = []
      .concat(data.practice.onLevel || [])
      .concat(data.practice.approaching || [])
      .concat(data.practice.optional || [])
      .find(p => p.type === 'multiple-choice');
    if (mcProb) {
      practiceProblem = mcProb;
      practiceType = 'multiple-choice';
    }
  }
  
  let practiceHtml = '';
  
  if (practiceType === 'error-analysis') {
    const pTitle = practiceProblem.title || 'Find the Error';
    const workedExample = practiceProblem.workedExample || [];
    const errorStep = practiceProblem.errorStep || 1;
    const correctWork = practiceProblem.correctWork || 'Review and write the correct steps.';
    
    let exampleStepsHtml = '';
    workedExample.forEach((step, idx) => {
      exampleStepsHtml += `<div class="worked-step" style="font-size:11px; padding:4px 8px; border-bottom: 1px solid #e1eaeef8; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; color:var(--navy);">${esc(step.label)}:</span>
        <span style="font-family:monospace; background:var(--google-gray); padding:2px 6px; border-radius:3px;">${esc(step.work)}</span>
      </div>`;
    });
    
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <h2 class="card-title" style="color:var(--amber);">⚠️ ${esc(pTitle)}</h2>
            <p class="card-desc" style="font-size:12px; margin-bottom:8px; line-height:1.4;">Analyze the student's work on the right. Which step contains the error, and how would you correct it?</p>
            <div style="border:1.5px solid #dadce0; border-radius:6px; background:var(--white); overflow:hidden;">
              ${exampleStepsHtml}
            </div>
          </div>
          
          <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px;">
            <strong style="font-size:10px; color:var(--navy); text-transform:uppercase;">Identify Error Step:</strong>
            <div style="display:flex; gap:6px;">
              ${workedExample.map((s, idx) => `<button class="assess-btn px-btn" id="btn-errstep-${idx + 1}" onclick="checkErrorStep(${idx + 1}, ${errorStep})">${idx + 1}</button>`).join('')}
            </div>
            <div id="error-step-feedback" style="font-size:10px; font-weight:700; min-height:14px; margin-top:2px;"></div>
          </div>
        </div>
        
        <div class="slide-card" style="background:var(--coral); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <h2 class="card-title">🛠️ Fix & Justify</h2>
            <textarea id="practice-fix-work" class="slide-input-placeholder" rows="5" placeholder="Explain the error and write the correct calculation steps here..."></textarea>
          </div>
          <button class="btn-present" onclick="revealPracticeSolution()" style="align-self:flex-end; padding:6px 12px; font-size:11px; margin-top:6px;">Reveal Solution</button>
          <div id="practice-solution-box" style="display:none; background:var(--white); border:1px solid #D9795D; border-radius:6px; padding:6px 10px; font-size:10px; line-height:1.4; color:var(--body-text); margin-top:6px;">
            <strong>Correct Work:</strong> ${esc(correctWork)}
          </div>
        </div>
      </div>
    `;
  } else if (practiceType === 'multiple-choice') {
    const stem = practiceProblem.stem || 'Solve this practice problem.';
    const choices = practiceProblem.choices || [];
    const correctIndex = practiceProblem.correctIndex !== undefined ? practiceProblem.correctIndex : 0;
    
    let choicesHtml = '';
    choices.forEach((choice, idx) => {
      choicesHtml += `<button class="assess-btn mc-btn" id="btn-choice-${idx}" onclick="checkMCQuestion(${idx}, ${correctIndex})" style="text-align:left; padding:8px 12px; font-size:12px; margin-bottom:6px; display:block; width:100%; font-weight:600; line-height:1.4;">
        ${String.fromCharCode(65 + idx)}) ${esc(choice)}
      </button>`;
    });
    
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <h2 class="card-title">📝 Practice Challenge</h2>
            <p class="card-desc" style="font-size:13px; font-weight:700; line-height:1.4; margin-bottom:12px; color:var(--navy);">${esc(stem)}</p>
            <div style="margin-top:10px;">
              ${choicesHtml}
            </div>
          </div>
          <div id="mc-question-feedback" style="font-size:11px; font-weight:700; min-height:16px;"></div>
        </div>
        
        <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <h2 class="card-title">✍️ Work & Justification</h2>
            <p style="font-size:11.5px; margin-top:0; color:var(--navy); line-height:1.4;">Use this workspace to calculate the answer or explain why your selected choice is correct.</p>
            <textarea id="practice-mc-work" class="slide-input-placeholder" rows="6" placeholder="Type your calculation steps or reasoning here..."></textarea>
          </div>
        </div>
      </div>
    `;
  } else {
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <h2 class="card-title">📖 Practice Activity</h2>
            <p class="card-desc" style="font-size:13px; line-height:1.5;">Apply what you have learned to solve this math challenge. Make sure to double check your calculations with your partner.</p>
          </div>
          <textarea id="practice-generic-work" class="slide-input-placeholder" rows="6" placeholder="Type your step-by-step calculations here..."></textarea>
        </div>
        <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <h2 class="card-title">✍️ Reasoning & Check</h2>
            <p style="font-size:12px; margin-top:0; color:var(--navy);">Write a sentence explaining why your answer makes sense in this mathematical context.</p>
            <textarea id="practice-generic-reasoning" class="slide-input-placeholder" rows="6" placeholder="Explain your mathematical logic here..."></textarea>
          </div>
        </div>
      </div>
    `;
  }
  
  // Slide 8 Real-world Connection Bindings
  const connect = data.connect || {};
  const connectScenario = connect.scenario || 'Apply the math from today to understand this real-world context.';
  const connectPrompt = connect.promptQuestion || connect.prompt || 'How does this math apply to this scenario?';
  const connectFrame = connect.prompt || '';
  const connectKeywords = connect.keywords || [];
  
  let connectVocabBankHtml = '';
  if (connectKeywords && connectKeywords.length > 0) {
    connectVocabBankHtml = connectKeywords.map(k => `<span class="vocab-pill" onclick="insertAtCursor(this.textContent)">${esc(k)}</span>`).join('');
  }
  
  // Slide 9 Exit Ticket Bindings
  const exitTicket = data.reflect ? data.reflect.exitTicket : null;
  const exitStem = exitTicket ? (exitTicket.stem || 'Record your final answer and explanation to show mastery of this standard.') : 'Record your final answer and explanation to show mastery of this standard.';
  const exitChoices = exitTicket ? (exitTicket.choices || []) : [];
  const exitCorrectIndex = exitTicket ? (exitTicket.correctIndex !== undefined ? exitTicket.correctIndex : 0) : 0;
  
  let exitTicketHtml = '';
  if (exitChoices && exitChoices.length > 0) {
    let exitChoicesHtml = '';
    exitChoices.forEach((choice, idx) => {
      exitChoicesHtml += `<button class="assess-btn exit-btn" id="btn-exit-${idx}" onclick="checkExitTicket(${idx}, ${exitCorrectIndex})" style="text-align:left; padding:6px 10px; font-size:11px; margin-bottom:4px; display:block; width:100%; font-weight:600; line-height:1.3;">
        ${String.fromCharCode(65 + idx)}) ${esc(choice)}
      </button>`;
    });
    exitTicketHtml = `
      <div style="margin-top:6px;">
        <p style="font-size:11.5px; font-weight:700; margin:0 0 6px; color:var(--navy); line-height:1.3;">${esc(exitStem)}</p>
        <div style="margin-top:4px;">
          ${exitChoicesHtml}
        </div>
        <div id="exit-ticket-feedback" style="font-size:10px; font-weight:700; min-height:14px; margin-top:2px;"></div>
      </div>
    `;
  } else {
    exitTicketHtml = `
      <div>
        <p style="font-size:12px; margin-bottom:8px; line-height:1.4; font-weight:700; color:var(--navy);">${esc(exitStem)}</p>
        <textarea id="exit-ticket-text-work" class="slide-input-placeholder" rows="4" placeholder="Type your final answer and explanation here..."></textarea>
      </div>
    `;
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
      --shadow: 0 4px 20px rgba(23, 50, 77, 0.08);
      --google-gray: #f1f3f4;
      --google-blue: #1a73e8;
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
      user-select: none;
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
      flex-shrink: 0;
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
    
    /* Layout Workspace */
    .workspace {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
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
      flex-shrink: 0;
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
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    
    /* Center Presentation Area */
    .presentation-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    
    /* Slide Canvas: Fixed 16:9 Aspect Ratio (960x540) */
    .slide-canvas {
      width: 960px;
      height: 540px;
      background: var(--bg);
      border: 1px solid #dadce0;
      box-shadow: 0 10px 30px rgba(23, 50, 77, 0.15);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
    }
    
    /* Header & Footer bars inside slide */
    .slide-header {
      background: var(--navy);
      color: var(--amber);
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
      font-family: "Outfit", sans-serif;
      letter-spacing: 0.02em;
      flex-shrink: 0;
      border-bottom: 3px solid var(--teal);
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
      flex-shrink: 0;
    }
    
    /* Slide Content Frames */
    .slide-body {
      flex: 1;
      padding: 24px;
      display: none;
      height: calc(100% - 86px);
      overflow: hidden;
    }
    .slide-body.active {
      display: flex;
      flex-direction: column;
    }
    
    /* Cards and Layout structures */
    .slide-card {
      background: var(--white);
      border: 1px solid #e1eaeef8;
      border-radius: 8px;
      padding: 20px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .slide-grid-2 {
      display: grid;
      grid-template-columns: 14fr 13fr;
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
      flex: 1;
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
      cursor: pointer;
      transition: all 0.2s;
    }
    .vocab-pill:hover {
      background: var(--teal);
      color: var(--white);
    }
    
    /* Vocab Flip Cards */
    .vocab-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      height: 100%;
    }
    .vocab-card {
      height: 100%;
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
      border: 1.5px dashed var(--teal);
      color: var(--navy);
    }
    .vocab-card-front h3 { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 0.05em; }
    .vocab-card-back {
      background: var(--teal-light);
      border: 1.5px solid var(--teal);
      color: var(--body-text);
      transform: rotateY(180deg);
      font-size: 11px;
      line-height: 1.4;
    }
    .click-hint { font-size: 9px; color: var(--gray); margin-top: 4px; font-weight: 600; }
    
    /* Concept Instruction Tab Styling */
    .tabs-container {
      display: flex;
      gap: 4px;
      margin-bottom: 10px;
      border-bottom: 2px solid var(--google-gray);
      padding-bottom: 2px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      color: var(--gray);
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 4px 4px 0 0;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--navy);
      background: rgba(23, 50, 77, 0.05);
    }
    .tab-btn.active {
      color: var(--teal);
      border-bottom: 3.5px solid var(--teal);
      background: var(--teal-light);
    }
    .tab-content {
      background: var(--white);
      border: 1px solid #dadce0;
      border-radius: 6px;
      padding: 12px;
      height: calc(100% - 35px);
      overflow-y: auto;
      box-shadow: var(--shadow);
    }
    
    /* Visual Math Container with Canvas Overlay */
    .math-visual-container {
      position: relative;
      width: 100%;
      height: 100%;
      background: var(--white);
      border: 1.5px solid #dadce0;
      border-radius: 8px;
      overflow: hidden;
    }
    .canvas-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
      cursor: crosshair;
    }
    
    /* Drawing Toolbar */
    .drawing-toolbar {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      background: var(--google-gray);
      padding: 4px;
      border-radius: 6px;
      align-items: center;
    }
    .tool-btn {
      background: var(--white);
      border: 1px solid #dadce0;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      color: var(--body-text);
    }
    .tool-btn.active {
      background: var(--teal);
      color: var(--white);
      border-color: var(--teal);
    }
    .tool-btn-clear {
      background: #D9795D;
      color: var(--white);
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      margin-left: auto;
    }
    .drawing-toolbar select {
      border: 1px solid #dadce0;
      border-radius: 4px;
      padding: 3px;
      font-size: 11px;
      background: var(--white);
    }
    
    /* Custom input elements styled as Google Slides text placeholders */
    .slide-input-placeholder {
      border: 1px dashed var(--gray);
      border-radius: 4px;
      padding: 10px;
      font-size: 13px;
      font-family: inherit;
      background: #FDFDFB;
      color: var(--body-text);
      width: 100%;
      outline: none;
      resize: none;
      transition: all 0.2s;
    }
    .slide-input-placeholder::placeholder {
      color: var(--gray);
      font-style: italic;
    }
    .slide-input-placeholder:focus {
      border: 1.5px solid var(--teal);
      box-shadow: 0 0 0 3px var(--teal-light);
      background: var(--white);
    }
    
    /* Fullscreen present mode pacing timer & controls */
    .presenter-hud {
      display: none;
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(23, 50, 77, 0.95);
      border-radius: 99px;
      padding: 8px 24px;
      align-items: center;
      gap: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      color: var(--white);
      z-index: 10000;
    }
    :fullscreen ~ .presenter-hud {
      display: flex;
    }
    :-webkit-full-screen ~ .presenter-hud {
      display: flex;
    }
    
    .hud-btn {
      background: transparent;
      border: none;
      color: var(--white);
      font-size: 16px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .hud-btn:hover {
      background: rgba(255,255,255,0.15);
    }
    .hud-timer {
      font-family: monospace;
      font-size: 14px;
      border-left: 1px solid rgba(255,255,255,0.3);
      padding-left: 14px;
    }
    
    /* Standard Reflection Post-It notes */
    .post-it-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .post-it {
      padding: 10px;
      border-radius: 6px;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .post-it-3 { background: var(--teal-light); }
    .post-it-2 { background: var(--amber); opacity: 0.85; }
    .post-it-1 { background: var(--coral); }
    .post-it-title { font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--navy); margin-bottom: 4px; }
    .post-it input {
      width: 100%;
      border: none;
      background: transparent;
      outline: none;
      font-family: inherit;
      font-size: 12px;
      border-bottom: 1px dotted rgba(23, 50, 77, 0.2);
    }
    
    /* Assessment & Practice Buttons */
    .assess-row {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .assess-btn {
      flex: 1;
      padding: 8px;
      border-radius: 6px;
      border: 1.5px solid var(--gray);
      background: var(--white);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .assess-btn:hover {
      background: var(--google-gray);
    }
    .assess-btn.active {
      border-color: var(--teal);
      background: var(--teal-light);
      color: var(--navy);
    }
    .assess-btn.correct {
      border-color: var(--teal) !important;
      background: var(--teal-light) !important;
      color: var(--navy) !important;
    }
    .assess-btn.incorrect {
      border-color: #D9795D !important;
      background: var(--coral) !important;
      color: #D9795D !important;
    }
    .px-btn {
      flex: none;
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
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
          <div class="g-menu-item" onclick="enterFullscreen()">View</div>
          <div class="g-menu-item">Format</div>
          <div class="g-menu-item" onclick="alert('Lesson: ${esc(lessonId)} | Unit: ${unit}')">Slide</div>
          <div class="g-menu-item" style="color:var(--teal)">Saved to Browser ✓</div>
        </div>
      </div>
    </div>
    <div class="g-right">
      <button class="btn-present" onclick="enterFullscreen()">
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
        <div class="thumb-preview">👀 Launch</div>
      </div>
      <!-- Slide 3 -->
      <div class="thumb-card" data-slide="3" onclick="goToSlide(3)">
        <span class="thumb-label">Slide 3</span>
        <div class="thumb-preview">💡 Concept</div>
      </div>
      <!-- Slide 4 -->
      <div class="thumb-card" data-slide="4" onclick="goToSlide(4)">
        <span class="thumb-label">Slide 4</span>
        <div class="thumb-preview">📝 Vocabulary</div>
      </div>
      <!-- Slide 5 -->
      <div class="thumb-card" data-slide="5" onclick="goToSlide(5)">
        <span class="thumb-label">Slide 5</span>
        <div class="thumb-preview">📐 Model</div>
      </div>
      <!-- Slide 6 -->
      <div class="thumb-card" data-slide="6" onclick="goToSlide(6)">
        <span class="thumb-label">Slide 6</span>
        <div class="thumb-preview">👥 Explore</div>
      </div>
      <!-- Slide 7 -->
      <div class="thumb-card" data-slide="7" onclick="goToSlide(7)">
        <span class="thumb-label">Slide 7</span>
        <div class="thumb-preview">⚠️ Practice</div>
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
      <article class="slide-canvas" id="slide-canvas-element">
      
        <!-- Inside Slide Header -->
        <header class="slide-header" id="slide-title-bar">LESSON ${esc(lessonId)} · OBJECTIVES &amp; TOPIC</header>
        
        <!-- SLIDE 1: OBJECTIVES -->
        <div class="slide-body active" id="slide-1">
          <div class="slide-card">
            <h2 class="card-title">🎯 Lesson Objectives</h2>
            <div style="font-size: 16px; line-height: 1.6; display: flex; flex-direction: column; gap: 16px; justify-content: center; height: 100%;">
              <div>
                <strong style="color:var(--navy); font-size:18px;">Content Objective:</strong>
                <p style="margin: 6px 0 0; color:var(--body-text); font-size:16px;">${esc(contentObj)}</p>
              </div>
              <div style="margin-top:12px;">
                <strong style="color:var(--navy); font-size:18px;">Language Objective:</strong>
                <p style="margin: 6px 0 0; color:var(--body-text); font-size:16px;">${esc(langObj)}</p>
              </div>
              <div style="margin-top:12px; border-top:1px dashed var(--teal); padding-top:12px; font-size:12px; color:var(--gray); font-weight:700;">
                STANDARD: ${esc(standard)}
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 2: SCENARIO LAUNCH -->
        <div class="slide-body" id="slide-2">
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title">📋 ${esc(launchBadge)}</h2>
                <p class="card-desc" style="font-size:12.5px; line-height:1.5; margin-bottom:8px;">${esc(launchNarrative)}</p>
              </div>
              <div style="margin-top:auto;">
                <strong style="font-size:11px; color:var(--gray); text-transform:uppercase;">Vocabulary Bank (Click to insert):</strong>
                <div style="margin-top:4px;">${launchVocabBankHtml}</div>
              </div>
            </div>
            <div class="slide-card nw-container">
              <div class="nw-box nw-box-notice" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <h4>👀 Notice Prompts:</h4>
                  <div class="nw-box-stems" style="margin-bottom:6px;">${noticeStemsHtml}</div>
                </div>
                <textarea id="student-notice" class="slide-input-placeholder" rows="2" placeholder="Type what you notice here..."></textarea>
              </div>
              <div class="nw-box nw-box-wonder" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <h4>💭 Wonder Prompts:</h4>
                  <div class="nw-box-stems" style="margin-bottom:6px;">${wonderStemsHtml}</div>
                </div>
                <textarea id="student-wonder" class="slide-input-placeholder" rows="2" placeholder="Type what you wonder here..."></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 3: CONCEPT INTRO & FLOW -->
        <div class="slide-body" id="slide-3">
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title">💡 ${esc(conceptHeading)}</h2>
                <p class="card-desc" style="font-size:12.5px; line-height:1.5; margin-bottom:12px;">${esc(conceptText)}</p>
              </div>
              ${conceptKeyIdea ? `
              <div style="background:var(--teal-light); border:1.5px solid var(--teal); border-radius:8px; padding:12px; margin-top:auto;">
                <strong style="font-size:11px; color:var(--navy); text-transform:uppercase;">Key Idea:</strong>
                <p style="margin:4px 0 0; font-size:12.5px; font-weight:700; color:var(--navy); line-height:1.4;">${esc(conceptKeyIdea)}</p>
              </div>` : ''}
            </div>
            
            <div style="display:flex; flex-direction:column; height: 100%;">
              <div class="tabs-container">
                <button class="tab-btn active" onclick="switchConceptTab('ido')">Watch Me</button>
                <button class="tab-btn" onclick="switchConceptTab('wedo')">Try Together</button>
                <button class="tab-btn" onclick="switchConceptTab('youdo')">Your Turn</button>
              </div>
              <div id="concept-tab-content" class="tab-content">
                <!-- Tab contents populated dynamically by Javascript -->
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 4: VOCABULARY CARD GRID -->
        <div class="slide-body" id="slide-4">
          <div class="slide-grid-2">
            <div style="display: flex; flex-direction: column; gap: 12px; justify-content: center; height: 100%;">
              <h2 class="card-title">📝 Lesson Vocabulary</h2>
              <p class="card-desc" style="font-size:13px; line-height:1.5;">Click each card to flip and review its definition, Spanish translation, and visual examples. Compare notes with your partner.</p>
              <div style="background:var(--teal-light); border-radius:8px; padding:12px; font-size:11.5px; color:var(--navy); font-weight:600; line-height:1.4;">
                💡 Multi-language terms included. Discuss how each concept works in a math sentence!
              </div>
            </div>
            <div class="vocab-grid">
              ${vocabCardsHtml}
            </div>
          </div>
        </div>
        
        <!-- SLIDE 5: VISUAL MODEL WITH CANVAS OVERLAY -->
        <div class="slide-body" id="slide-5">
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title">📐 Modeling Workspace</h2>
                <p class="card-desc" style="font-size:12.5px; line-height:1.4;">Use the drawing tools to annotate, label axes, partition lines, or write equations directly onto the math model representation.</p>
              </div>
              
              <!-- Draw Toolbar -->
              <div class="drawing-toolbar">
                <button class="tool-btn active" id="btn-draw" onclick="setDrawingTool('draw')">✏️ Draw</button>
                <button class="tool-btn" id="btn-erase" onclick="setDrawingTool('erase')">🧽 Erase</button>
                <select id="select-color" onchange="setDrawingColor(this.value)">
                  <option value="#17324D">Navy</option>
                  <option value="#1FA6A2">Teal</option>
                  <option value="#F2C15B">Amber</option>
                  <option value="#D9795D">Coral</option>
                  <option value="#000000">Black</option>
                </select>
                <select id="select-size" onchange="setDrawingSize(this.value)">
                  <option value="2">Thin</option>
                  <option value="4" selected>Medium</option>
                  <option value="8">Thick</option>
                </select>
                <button class="tool-btn-clear" onclick="clearDrawingCanvas()">Clear</button>
              </div>
            </div>
            <div class="math-visual-container">
              <!-- Background SVG visual -->
              <div style="position: absolute; inset: 0; z-index: 1;">
                ${svgVisual}
              </div>
              <!-- Transparent overlay canvas for student drawing -->
              <canvas id="math-canvas" width="440" height="240" class="canvas-overlay"></canvas>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 6: INTERACTIVE EXPLORE ACTIVITY -->
        <div class="slide-body" id="slide-6">
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title">👥 Explore Activity</h2>
                <p class="card-desc" style="font-size:12.5px; margin-bottom:8px;" id="explore-instructions">${esc(exploreInstructions)}</p>
                
                <!-- Interactive Sorting Game -->
                <div id="sorting-game-container" style="background:var(--google-gray); padding:12px; border-radius:8px; border:1px solid #dadce0; text-align:center; min-height:130px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:8px;">
                  <div id="sorting-card" style="background:var(--white); padding:8px 14px; border-radius:6px; border:1.5px solid var(--teal); font-weight:700; font-size:13.5px; color:var(--navy); box-shadow:var(--shadow); width:90%; min-height:48px; display:flex; align-items:center; justify-content:center; text-align:center; line-height:1.3;">
                    <!-- Active Card Text -->
                  </div>
                  <div id="sorting-buttons" style="display:flex; gap:8px; justify-content:center; width:100%; flex-wrap:wrap;">
                    <!-- Category buttons loaded dynamically -->
                  </div>
                  <div id="sorting-feedback" style="font-size:11px; font-weight:700; min-height:16px;"></div>
                </div>
              </div>
              
              <div style="margin-top:6px;">
                <strong style="font-size:10px; color:var(--gray); text-transform:uppercase;">Keyword Bank (Click to insert):</strong>
                <div style="margin-top:4px;">${exploreVocabBankHtml}</div>
              </div>
            </div>
            
            <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title">✍️ Explore Discourse</h2>
                <p style="font-size:11.5px; margin-top:0; color:var(--navy); font-weight:600; line-height:1.4;">${esc(discoursePrompt)}</p>
                ${discourseFrame ? `<div style="font-size:10px; font-style:italic; color:var(--body-text); background:var(--white); padding:5px 8px; border-radius:4px; border:1px solid #e1eaeef8; margin-bottom:8px; line-height:1.3;"><strong>Sentence Starter:</strong><br/>${esc(discourseFrame)}</div>` : ''}
              </div>
              <textarea id="explore-discourse-work" class="slide-input-placeholder" rows="3" placeholder="Type your discourse explanation here..."></textarea>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 7: PRACTICE PROBLEM -->
        <div class="slide-body" id="slide-7">
          ${practiceHtml}
        </div>
        
        <!-- SLIDE 8: REAL-WORLD CONNECTION -->
        <div class="slide-body" id="slide-8">
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height:100%;">
              <div>
                <h2 class="card-title">🌍 Math in the Wild</h2>
                <p class="card-desc" style="font-size:12.5px; line-height:1.5; margin-bottom:8px;">${esc(connectScenario)}</p>
              </div>
              <div style="margin-top:auto;">
                <strong style="font-size:10px; color:var(--gray); text-transform:uppercase;">Keyword Bank (Click to insert):</strong>
                <div style="margin-top:4px;">${connectVocabBankHtml}</div>
              </div>
            </div>
            <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height:100%;">
              <div>
                <h2 class="card-title">✍️ Connection Reasoning</h2>
                <p style="font-size:12px; margin-top:0; color:var(--navy); font-weight:600; line-height:1.3;">${esc(connectPrompt)}</p>
                ${connectFrame ? `<div style="font-size:10px; font-style:italic; color:var(--body-text); background:var(--white); padding:5px 8px; border-radius:4px; border:1px solid #e1eaeef8; margin-bottom:8px; line-height:1.3;"><strong>Sentence Starter:</strong><br/>${esc(connectFrame)}</div>` : ''}
              </div>
              <textarea id="rw-connect-work" class="slide-input-placeholder" rows="4" placeholder="Write your connection explanation here..."></textarea>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 9: REFLECTION & EXIT TICKET -->
        <div class="slide-body" id="slide-9">
          <div class="slide-grid-2">
            <div class="slide-card" style="justify-content:space-between; height: 100%;">
              <h2 class="card-title">🤔 3-2-1 Reflection</h2>
              <div class="post-it-grid">
                <div class="post-it post-it-3">
                  <div class="post-it-title">3 Things I learned:</div>
                  <input type="text" id="ref-3-1" placeholder="1. ..." />
                </div>
                <div class="post-it post-it-2">
                  <div class="post-it-title">2 Connections I made:</div>
                  <input type="text" id="ref-2-1" placeholder="1. ..." />
                </div>
                <div class="post-it post-it-1">
                  <div class="post-it-title">1 Question I still have:</div>
                  <input type="text" id="ref-1-1" placeholder="1. ..." />
                </div>
              </div>
            </div>
            
            <div class="slide-card" style="background:var(--teal-light); justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title">📝 Exit Ticket</h2>
                ${exitTicketHtml}
              </div>
              
              <div style="margin-top:6px; border-top: 1px dashed var(--teal); padding-top:6px;">
                <strong style="font-size:10px; color:var(--navy); text-transform:uppercase;">Self-Assessment:</strong>
                <div class="assess-row">
                  <button class="assess-btn" id="btn-gotit" onclick="setSelfAssessment('gotit')">Got it! 👍</button>
                  <button class="assess-btn" id="btn-getting" onclick="setSelfAssessment('getting')">Almost There 🧭</button>
                  <button class="assess-btn" id="btn-help" onclick="setSelfAssessment('help')">Need Help 🆘</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Inside Slide Footer -->
        <footer class="slide-footer">Neft Teacher · Grade 6 Math · Unit ${unit} · Lesson ${esc(lessonId)}</footer>
        
      </article>
      
    </div>
    
  </main>

  <!-- Presenter Controls HUD (Visible only when in fullscreen Present Mode) -->
  <div class="presenter-hud">
    <button class="hud-btn" onclick="prevSlide()">◀</button>
    <span id="hud-page-indicator">1 / 9</span>
    <button class="hud-btn" onclick="nextSlide()">▶</button>
    <div class="hud-timer" id="hud-timer-display">Pacing: 00:00</div>
    <button class="hud-btn" onclick="exitFullscreen()" title="Exit Presentation" style="margin-left: 8px;">✕</button>
  </div>

  <script>
    let currentSlide = 1;
    const totalSlides = 9;
    
    const slideTitles = [
      "LESSON ${esc(lessonId)} · OBJECTIVES & TOPIC",
      "BE CURIOUS · SCENARIO LAUNCH",
      "CONCEPT INTRODUCTION · Watch / Try / Apply",
      "KEY VOCABULARY · Flashcards",
      "VISUAL MODELING WORKSPACE",
      "EXPLORE ACTIVITY · Card Sorting & Discourse",
      "TIERED PRACTICE CHALLENGE",
      "REAL-WORLD CONNECTION · Math in the Wild",
      "REFLECTION & EXIT TICKET"
    ];
    
    // Concept Intro Tab Data
    const conceptData = {
      ido: { title: "${esc(iDoTitle)}", lines: ${JSON.stringify(iDoLines)} },
      wedo: { title: "${esc(weDoTitle)}", lines: ${JSON.stringify(weDoLines)} },
      youdo: { title: "${esc(youDoTitle)}", lines: ${JSON.stringify(youDoLines)} }
    };
    
    let activeConceptTab = 'ido';
    
    // Explore Sorting Game Data
    const exploreItems = ${JSON.stringify(normalizedItems)};
    const exploreCats = ${JSON.stringify(normalizedCats)};
    let currentExploreIdx = 0;
    const studentExploreSorted = {};
    
    // Practice Checking Variables
    let studentErrStep = -1;
    let solutionRevealed = false;
    let studentPracticeMCIndex = -1;
    
    // Exit Ticket Variables
    let studentExitChoiceIndex = -1;
    
    // Timer variables for present mode
    let timerInterval = null;
    let secondsElapsed = 0;
    
    function startTimer() {
      secondsElapsed = 0;
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const secs = String(secondsElapsed % 60).padStart(2, '0');
        document.getElementById('hud-timer-display').textContent = 'Pacing: ' + mins + ':' + secs;
      }, 1000);
    }
    
    function stopTimer() {
      clearInterval(timerInterval);
    }
    
    function enterFullscreen() {
      const container = document.getElementById('slide-canvas-element');
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    }
    
    function exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = document.fullscreenElement !== null;
      if (isFullscreen) {
        startTimer();
      } else {
        stopTimer();
      }
      setTimeout(resizeSlides, 100);
    });
    
    function goToSlide(num) {
      if (num < 1 || num > totalSlides) return;
      
      currentSlide = num;
      
      document.querySelectorAll('.slide-body').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) === num);
      });
      
      document.querySelectorAll('.sidebar-slides .thumb-card').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) === num);
      });
      
      document.getElementById('slide-title-bar').textContent = slideTitles[num - 1];
      document.getElementById('hud-page-indicator').textContent = num + ' / ' + totalSlides;
      
      // Delay redraw canvas context
      if (num === 5) {
        setTimeout(resizeSlides, 50);
      }
    }
    
    function prevSlide() {
      if (currentSlide > 1) goToSlide(currentSlide - 1);
    }
    
    function nextSlide() {
      if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
    }
    
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        nextSlide();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
        e.preventDefault();
      }
    });
    
    // Concept tabs sequential reveal switcher
    function switchConceptTab(tabId) {
      const data = conceptData[tabId];
      if (!data) return;
      
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(tabId)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      let contentHtml = '<h4 style="margin: 0 0 8px 0; color:var(--navy); font-size:13.5px; font-weight:700;">' + data.title + '</h4>';
      contentHtml += '<ul style="margin: 0; padding-left: 20px; font-size: 11.5px; line-height: 1.5; color: var(--body-text);">';
      data.lines.forEach(line => {
        contentHtml += '<li style="margin-bottom: 6px;">' + line + '</li>';
      });
      contentHtml += '</ul>';
      
      document.getElementById('concept-tab-content').innerHTML = contentHtml;
      activeConceptTab = tabId;
      saveWork();
    }
    
    // Explore Activity sorting game logic
    function initSortingGame() {
      const container = document.getElementById('sorting-game-container');
      if (!container) return;
      
      if (exploreItems.length === 0) {
        container.innerHTML = '<div style="font-size:12px; font-style:italic; color:var(--gray);">No sorting items defined for this explore activity.</div>';
        return;
      }
      
      renderActiveExploreCard();
    }
    
    function renderActiveExploreCard() {
      const card = document.getElementById('sorting-card');
      const buttonsDiv = document.getElementById('sorting-buttons');
      const feedbackDiv = document.getElementById('sorting-feedback');
      if (!card) return;
      
      if (currentExploreIdx >= exploreItems.length) {
        card.innerHTML = "🎉 Sorting Complete!";
        card.style.borderColor = "var(--teal)";
        card.style.background = "var(--teal-light)";
        buttonsDiv.innerHTML = '<button class="assess-btn" onclick="resetSortingGame()" style="max-width:120px; padding:6px; font-size:11px;">Reset Game</button>';
        feedbackDiv.textContent = "Great job sorting all items!";
        feedbackDiv.style.color = "var(--teal)";
        return;
      }
      
      const activeItem = exploreItems[currentExploreIdx];
      card.innerHTML = activeItem.text;
      card.style.borderColor = "var(--teal)";
      card.style.background = "var(--white)";
      feedbackDiv.textContent = "";
      
      let btnsHtml = "";
      exploreCats.forEach(cat => {
        btnsHtml += '<button class="assess-btn" onclick="sortActiveItem(\\'' + cat.id + '\\')" style="font-size:11px; padding:6px 12px; flex:1; min-width:85px; font-weight:700;">' + cat.label + '</button>';
      });
      buttonsDiv.innerHTML = btnsHtml;
    }
    
    function sortActiveItem(catId) {
      const activeItem = exploreItems[currentExploreIdx];
      const feedbackDiv = document.getElementById('sorting-feedback');
      
      studentExploreSorted[activeItem.id] = catId;
      
      if (activeItem.catId === "" || activeItem.catId === catId) {
        feedbackDiv.textContent = "Correct! ✓";
        feedbackDiv.style.color = "var(--teal)";
        document.getElementById('sorting-card').style.background = "var(--teal-light)";
      } else {
        feedbackDiv.textContent = "Incorrect. Try again! ✕";
        feedbackDiv.style.color = "#D9795D";
        document.getElementById('sorting-card').style.background = "var(--coral)";
      }
      
      saveWork();
      
      setTimeout(() => {
        currentExploreIdx++;
        renderActiveExploreCard();
      }, 750);
    }
    
    function resetSortingGame() {
      currentExploreIdx = 0;
      exploreItems.forEach(item => {
        delete studentExploreSorted[item.id];
      });
      renderActiveExploreCard();
      saveWork();
    }
    
    // Practice slide checking
    function checkErrorStep(selected, correct) {
      studentErrStep = selected;
      const feedback = document.getElementById('error-step-feedback');
      if (!feedback) return;
      
      document.querySelectorAll('[id^="btn-errstep-"]').forEach(btn => {
        btn.classList.remove('active', 'correct', 'incorrect');
      });
      
      const btn = document.getElementById('btn-errstep-' + selected);
      if (selected === correct) {
        btn.classList.add('correct');
        feedback.textContent = 'Correct step identified! Click Reveal Solution to see details. ✓';
        feedback.style.color = 'var(--teal)';
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = 'Incorrect step. Try again! ✕';
        feedback.style.color = '#D9795D';
      }
      saveWork();
    }
    
    function revealPracticeSolution() {
      solutionRevealed = true;
      const box = document.getElementById('practice-solution-box');
      if (box) box.style.display = 'block';
      saveWork();
    }
    
    function checkMCQuestion(selected, correct) {
      studentPracticeMCIndex = selected;
      const feedback = document.getElementById('mc-question-feedback');
      if (!feedback) return;
      
      document.querySelectorAll('.mc-btn').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
      });
      
      const btn = document.getElementById('btn-choice-' + selected);
      if (selected === correct) {
        btn.classList.add('correct');
        feedback.textContent = 'Correct! Great job. ✓';
        feedback.style.color = 'var(--teal)';
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = 'Incorrect. Review your calculation and try again. ✕';
        feedback.style.color = '#D9795D';
        const correctBtn = document.getElementById('btn-choice-' + correct);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      saveWork();
    }
    
    // Exit ticket checking
    function checkExitTicket(selected, correct) {
      studentExitChoiceIndex = selected;
      const feedback = document.getElementById('exit-ticket-feedback');
      if (!feedback) return;
      
      document.querySelectorAll('.exit-btn').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
      });
      
      const btn = document.getElementById('btn-exit-' + selected);
      if (selected === correct) {
        btn.classList.add('correct');
        feedback.textContent = 'Response recorded. Correct! ✓';
        feedback.style.color = 'var(--teal)';
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = 'Response recorded. ✕';
        feedback.style.color = '#D9795D';
        const correctBtn = document.getElementById('btn-exit-' + correct);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      saveWork();
    }

    // Save/Restore student work
    const storageKey = 'neft_slides_work_${esc(lessonId)}';
    
    function saveWork() {
      const data = {};
      document.querySelectorAll('textarea, input[type="text"]').forEach((input) => {
        data[input.id || input.placeholder] = input.value;
      });
      
      const canvas = document.getElementById('math-canvas');
      if (canvas) {
        data.canvasData = canvas.toDataURL();
      }
      
      data.assessment = activeAssessment;
      
      data.activeConceptTab = activeConceptTab;
      data.currentExploreIdx = currentExploreIdx;
      data.studentExploreSorted = studentExploreSorted;
      data.studentErrStep = studentErrStep;
      data.solutionRevealed = solutionRevealed;
      data.studentPracticeMCIndex = studentPracticeMCIndex;
      data.studentExitChoiceIndex = studentExitChoiceIndex;
      
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
    
    let activeAssessment = '';
    function setSelfAssessment(level) {
      activeAssessment = level;
      document.querySelectorAll('.assess-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === 'btn-' + level);
      });
      saveWork();
    }
    
    function loadWork() {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const data = JSON.parse(saved);
          document.querySelectorAll('textarea, input[type="text"]').forEach((input) => {
            const val = data[input.id || input.placeholder];
            if (val !== undefined) input.value = val;
          });
          
          if (data.canvasData) {
            const canvas = document.getElementById('math-canvas');
            if (canvas) {
              const img = new Image();
              img.src = data.canvasData;
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
              };
            }
          }
          
          if (data.assessment) {
            setSelfAssessment(data.assessment);
          }
          
          if (data.activeConceptTab) {
            switchConceptTab(data.activeConceptTab);
          } else {
            switchConceptTab('ido');
          }
          
          if (data.currentExploreIdx !== undefined) {
            currentExploreIdx = data.currentExploreIdx;
          }
          if (data.studentExploreSorted) {
            Object.assign(studentExploreSorted, data.studentExploreSorted);
          }
          initSortingGame();
          
          if (data.studentErrStep !== undefined && data.studentErrStep !== -1) {
            const errCheckBtn = document.getElementById('btn-errstep-1');
            if (errCheckBtn) {
              const errorStepVal = ${practiceProblem && practiceProblem.errorStep || 1};
              checkErrorStep(data.studentErrStep, errorStepVal);
            }
          }
          if (data.solutionRevealed) {
            revealPracticeSolution();
          }
          if (data.studentPracticeMCIndex !== undefined && data.studentPracticeMCIndex !== -1) {
            const mcCheckBtn = document.getElementById('btn-choice-0');
            if (mcCheckBtn) {
              const correctMCIdxVal = ${practiceProblem && practiceProblem.correctIndex !== undefined ? practiceProblem.correctIndex : 0};
              checkMCQuestion(data.studentPracticeMCIndex, correctMCIdxVal);
            }
          }
          
          if (data.studentExitChoiceIndex !== undefined && data.studentExitChoiceIndex !== -1) {
            const exitCheckBtn = document.getElementById('btn-exit-0');
            if (exitCheckBtn) {
              checkExitTicket(data.studentExitChoiceIndex, ${exitCorrectIndex});
            }
          }
        } else {
          switchConceptTab('ido');
          initSortingGame();
        }
      } catch (e) {
        console.error('Failed to load saved work:', e);
        try { switchConceptTab('ido'); } catch(err){}
        try { initSortingGame(); } catch(err){}
      }
    }
    
    document.querySelectorAll('textarea, input[type="text"]').forEach(input => {
      input.addEventListener('input', saveWork);
    });
    
    // Insert Word Bank pill text at the cursor position
    let lastActiveTextarea = null;
    document.querySelectorAll('textarea').forEach(textarea => {
      textarea.addEventListener('focus', () => {
        lastActiveTextarea = textarea;
      });
    });
    
    function insertAtCursor(text) {
      const target = lastActiveTextarea || document.getElementById('student-notice') || document.querySelector('textarea');
      if (!target) return;
      
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      
      target.value = val.substring(0, start) + text + val.substring(end);
      target.focus();
      target.selectionStart = target.selectionEnd = start + text.length;
      saveWork();
    }
    
    // -----------------------------------------------------------------
    // HTML5 DRAWING CANVAS SYSTEM
    // -----------------------------------------------------------------
    const canvas = document.getElementById('math-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    
    let drawing = false;
    let drawMode = 'draw';
    let drawColor = '#17324D';
    let drawSize = 4;
    
    function getMousePos(e) {
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }
    
    function startDrawing(e) {
      if (!ctx) return;
      drawing = true;
      ctx.beginPath();
      const pos = getMousePos(e);
      ctx.moveTo(pos.x, pos.y);
      e.preventDefault();
    }
    
    function draw(e) {
      if (!drawing || !ctx) return;
      const pos = getMousePos(e);
      
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = drawMode === 'erase' ? '#FFFFFF' : drawColor;
      ctx.lineWidth = drawSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (drawMode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.stroke();
      e.preventDefault();
    }
    
    function stopDrawing() {
      if (drawing && ctx) {
        ctx.closePath();
        drawing = false;
        saveWork();
      }
    }
    
    if (canvas) {
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDrawing);
      
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      window.addEventListener('touchend', stopDrawing);
    }
    
    function setDrawingTool(mode) {
      drawMode = mode;
      const dBtn = document.getElementById('btn-draw');
      const eBtn = document.getElementById('btn-erase');
      if (dBtn && eBtn) {
        dBtn.classList.toggle('active', mode === 'draw');
        eBtn.classList.toggle('active', mode === 'erase');
      }
    }
    
    function setDrawingColor(color) {
      drawColor = color;
      setDrawingTool('draw');
    }
    
    function setDrawingSize(size) {
      drawSize = Number(size);
    }
    
    function clearDrawingCanvas() {
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveWork();
      }
    }
    
    // -----------------------------------------------------------------
    // RESPONSIVE 16:9 VIEWPORT SCALING
    // -----------------------------------------------------------------
    function resizeSlides() {
      const container = document.querySelector('.presentation-container');
      const canvasEl = document.getElementById('slide-canvas-element');
      if (!container || !canvasEl) return;
      
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      
      const scaleX = containerWidth / 960;
      const scaleY = containerHeight / 540;
      let scale = Math.min(scaleX, scaleY);
      
      scale = Math.max(0.3, Math.min(1.5, scale));
      
      canvasEl.style.transform = 'scale(' + scale + ')';
    }
    
    window.addEventListener('resize', resizeSlides);
    window.addEventListener('load', () => {
      loadWork();
      resizeSlides();
    });
    
  </script>

</body>
</html>
`;
}

// Main execution block
function main() {
  console.log('Generating high-fidelity slides.html files...');
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
  
  console.log(`Successfully generated premium slides.html for ${count} lessons.`);
}

main();
