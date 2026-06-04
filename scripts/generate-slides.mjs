import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const lessonsDir = path.join(root, 'lessons');

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

// Maps lesson theme to curated non-purple hex colors
function getThemeColor(theme) {
  const themes = {
    'space-station': '#17324D',     // Navy
    'detective-agency': '#8A96A3',   // Slate Gray
    'sports-analytics': '#1FA6A2',   // Teal
    'treasure-map': '#D9795D',       // Terracotta/Coral
    'culinary-academy': '#E4C050',   // Warm Gold
    'architecture-firm': '#17324D',  // Navy
    'time-capsule': '#8A96A3',       // Slate Gray
    'music-studio': '#1FA6A2',       // Teal
    'arcade-builder': '#D9795D',     // Warm Coral
  };
  return themes[theme] || '#1FA6A2'; // Default to teal
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

// Generate high-fidelity vocabulary SVG diagram based on term
function generateVocabularyVisualSvg(term) {
  const t = String(term || '').toLowerCase().trim();
  const width = 110;
  const height = 65;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:white; border-radius:4px; display:block; margin:2px auto; border:1px solid #e1eaef; flex-shrink:0;">`;
  
  if (t.includes('prime number')) {
    svg += `<text x="55" y="12" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">PRIME: 7</text>`;
    for (let i = 0; i < 7; i++) {
      svg += `<circle cx="${10 + i * 15}" cy="32" r="3.5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    }
    svg += `<text x="55" y="54" font-family="Hanken Grotesk, sans-serif" font-size="7" fill="${COLOR_NAVY}" text-anchor="middle">Only 1 row of 7</text>`;
  } else if (t.includes('composite number')) {
    svg += `<text x="55" y="12" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">COMPOSITE: 12</text>`;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        svg += `<circle cx="${28 + c * 18}" cy="${24 + r * 11}" r="3" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
      }
    }
    svg += `<text x="55" y="60" font-family="Hanken Grotesk, sans-serif" font-size="7" fill="${COLOR_NAVY}" text-anchor="middle">Grid: 3 × 4</text>`;
  } else if (t.includes('factor tree') || t.includes('prime factorization')) {
    svg += `<line x1="55" y1="12" x2="35" y2="30" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<line x1="55" y1="12" x2="75" y2="30" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<line x1="75" y1="30" x2="60" y2="48" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<line x1="75" y1="30" x2="90" y2="48" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    
    svg += `<circle cx="55" cy="12" r="6" fill="${COLOR_TEAL_LIGHT}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<text x="55" y="15" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">12</text>`;
    
    svg += `<circle cx="35" cy="30" r="6" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<text x="35" y="33" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">2</text>`;
    
    svg += `<circle cx="75" cy="30" r="6" fill="${COLOR_TEAL_LIGHT}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<text x="75" y="33" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">6</text>`;
    
    svg += `<circle cx="60" cy="48" r="6" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<text x="60" y="51" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">2</text>`;
    
    svg += `<circle cx="90" cy="48" r="6" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<text x="90" y="51" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">3</text>`;
  } else if (t.includes('exponent')) {
    svg += `<text x="30" y="44" font-family="Outfit, sans-serif" font-size="28" fill="${COLOR_NAVY}" font-weight="bold">5</text>`;
    svg += `<text x="48" y="24" font-family="Outfit, sans-serif" font-size="16" fill="${COLOR_AMBER}" font-weight="bold">3</text>`;
    svg += `<text x="72" y="24" font-family="Outfit" font-size="7" fill="${COLOR_NAVY}">Exponent</text>`;
    svg += `<text x="72" y="44" font-family="Outfit" font-size="7" fill="${COLOR_NAVY}">Base</text>`;
    svg += `<path d="M70,22 L58,22" stroke="${COLOR_NAVY}" stroke-width="0.8" marker-end="url(#arrow)"/>`;
    svg += `<path d="M70,42 L48,42" stroke="${COLOR_NAVY}" stroke-width="0.8" marker-end="url(#arrow)"/>`;
    svg += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${COLOR_NAVY}"/></marker></defs>`;
  } else if (t.includes('ratio')) {
    svg += `<text x="55" y="12" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">Ratio 2:3</text>`;
    svg += `<circle cx="25" cy="32" r="5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<circle cx="38" cy="32" r="5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<rect x="52" y="26" width="11" height="11" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<rect x="67" y="26" width="11" height="11" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<rect x="82" y="26" width="11" height="11" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
  } else if (t.includes('rate') || t.includes('unit rate')) {
    svg += `<rect x="10" y="10" width="90" height="32" fill="white" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<line x1="10" y1="26" x2="100" y2="26" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<line x1="55" y1="10" x2="55" y2="42" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<text x="32" y="20" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">Miles</text>`;
    svg += `<text x="77" y="20" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">Hours</text>`;
    svg += `<text x="32" y="36" font-family="Outfit" font-size="7" fill="${COLOR_TEAL}" font-weight="bold" text-anchor="middle">60</text>`;
    svg += `<text x="77" y="36" font-family="Outfit" font-size="7" fill="${COLOR_TEAL}" font-weight="bold" text-anchor="middle">1</text>`;
    svg += `<text x="55" y="55" font-family="Hanken Grotesk, sans-serif" font-size="6.5" fill="${COLOR_NAVY}" text-anchor="middle">60 mph (Unit Rate)</text>`;
  } else if (t.includes('percent')) {
    svg += `<text x="25" y="36" font-family="Outfit, sans-serif" font-size="14" fill="${COLOR_TEAL}" font-weight="bold" text-anchor="middle">25%</text>`;
    svg += `<g transform="translate(56, 10)">`;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const fill = (r === 0) ? COLOR_TEAL_LIGHT : 'white';
        svg += `<rect x="${c * 10}" y="${r * 10}" width="10" height="10" fill="${fill}" stroke="${COLOR_NAVY}" stroke-width="0.7"/>`;
      }
    }
    svg += `</g>`;
    svg += `<text x="55" y="58" font-family="Hanken Grotesk, sans-serif" font-size="6.5" fill="${COLOR_NAVY}" text-anchor="middle">25 out of 100</text>`;
  } else if (t.includes('coordinate') || t.includes('quadrant')) {
    svg += `<line x1="10" y1="50" x2="100" y2="50" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<line x1="20" y1="8" x2="20" y2="58" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<line x1="20" y1="50" x2="90" y2="15" stroke="${COLOR_AMBER}" stroke-width="1.5"/>`;
    svg += `<circle cx="62" cy="29" r="2.5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<text x="70" y="27" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" font-weight="bold">(x, y)</text>`;
  } else if (t.includes('variable') || t.includes('equation')) {
    svg += `<text x="55" y="10" font-family="Outfit, sans-serif" font-size="7" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">${t.includes('equation') ? 'x + 2 = 5' : 'Variable: x'}</text>`;
    svg += `<line x1="55" y1="16" x2="55" y2="46" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
    svg += `<line x1="40" y1="46" x2="70" y2="46" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
    svg += `<line x1="25" y1="22" x2="85" y2="22" stroke="${COLOR_NAVY}" stroke-width="2"/>`;
    svg += `<line x1="25" y1="22" x2="25" y2="34" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<line x1="15" y1="34" x2="35" y2="34" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
    svg += `<rect x="20" y="27" width="10" height="7" fill="${COLOR_AMBER}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<text x="25" y="33" font-family="Outfit" font-weight="bold" font-size="6" fill="${COLOR_NAVY}" text-anchor="middle">x</text>`;
    svg += `<line x1="85" y1="22" x2="85" y2="34" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<line x1="75" y1="34" x2="95" y2="34" stroke="${COLOR_NAVY}" stroke-width="1.5"/>`;
    svg += `<circle cx="82" cy="31" r="2.5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
    svg += `<circle cx="88" cy="31" r="2.5" fill="${COLOR_TEAL}" stroke="${COLOR_NAVY}" stroke-width="0.8"/>`;
  } else if (t.includes('inequality')) {
    svg += `<text x="55" y="12" font-family="Outfit, sans-serif" font-size="8" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">x &gt; 3</text>`;
    svg += `<line x1="10" y1="34" x2="100" y2="34" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    for (let i = 0; i < 5; i++) {
      svg += `<line x1="${20 + i * 17}" y1="31" x2="${20 + i * 17}" y2="37" stroke="${COLOR_NAVY}" stroke-width="0.7"/>`;
      svg += `<text x="${20 + i * 17}" y="47" font-family="Outfit" font-size="6" fill="${COLOR_NAVY}" text-anchor="middle">${i + 1}</text>`;
    }
    svg += `<circle cx="54" cy="34" r="3" fill="white" stroke="${COLOR_TEAL}" stroke-width="1.5"/>`;
    svg += `<line x1="57" y1="34" x2="96" y2="34" stroke="${COLOR_TEAL}" stroke-width="2"/>`;
    svg += `<path d="M96,34 L92,31 L92,37 z" fill="${COLOR_TEAL}"/>`;
  } else {
    // Default abstract geometry icon
    svg += `<circle cx="55" cy="32" r="20" fill="none" stroke="${COLOR_TEAL_LIGHT}" stroke-width="4" opacity="0.6"/>`;
    svg += `<polygon points="55,16 68,44 42,44" fill="none" stroke="${COLOR_TEAL}" stroke-width="1"/>`;
    svg += `<line x1="30" y1="32" x2="80" y2="32" stroke="${COLOR_NAVY}" stroke-width="1"/>`;
    svg += `<circle cx="55" cy="32" r="3" fill="${COLOR_NAVY}"/>`;
    svg += `<text x="55" y="58" font-family="Outfit" font-size="6.5" fill="${COLOR_NAVY}" font-weight="bold" text-anchor="middle">Math Visual</text>`;
  }
  
  svg += `</svg>`;
  return svg;
}

// Generate the self-contained slides HTML
function generateSlidesHtml(lessonId, data) {
  const title = `Lesson ${lessonId}: ${data.title || 'Math Lesson'}`;
  const standard = data.standard || '6th Grade Common Core';
  const unit = data.unit || 1;
  const contentObj = data.contentObjective || 'Understand the mathematical connections in this lesson.';
  const langObj = data.languageObjective || 'Discuss findings using math vocab terms.';
  
  // Theme Emoji / Badging
  const themeEmoji = data.themeEmoji || '🚀';
  const themeName = data.theme ? data.theme.toUpperCase().replace('-', ' ') : 'MATH CORE';

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
      <div class="vocab-card" onclick="this.classList.toggle('flipped'); try{playClickSound();}catch(e){}">
        <div class="vocab-card-inner">
          <div class="vocab-card-front" style="padding: 6px 8px; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
            <h3 style="margin: 0; font-size:13.5px; font-weight:800; color:var(--navy); letter-spacing:0.02em;">${esc(term.toUpperCase())}</h3>
            ${termEs ? `<p style="font-size:10px; color:var(--gray); font-style:italic; margin: 1px 0 2px;">${esc(termEs)}</p>` : ''}
            ${generateVocabularyVisualSvg(term)}
            <p class="click-hint" style="margin: 2px 0 0; font-size:8.5px; font-weight:700; color:var(--gray); text-transform:uppercase;">Click to flip ➔</p>
          </div>
          <div class="vocab-card-back" style="padding: 10px; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
            <p style="font-weight:800; margin:0 0 4px; color:var(--navy); font-size:13px; line-height:1.3;">${esc(definition)}</p>
            ${definitionEs ? `<p style="font-size:11px; color:var(--gray); margin:0 0 6px; font-style:italic; line-height:1.25;">${esc(definitionEs)}</p>` : ''}
            ${visual ? `<div style="border-top: 1.5px dashed var(--teal); padding-top:4px; font-size:10px; font-style:italic; color:var(--body-text); text-align:left; margin-top:auto;"><strong>Ex:</strong> ${esc(visual)}</div>` : ''}
            ${cloze ? `<div style="margin-top:4px; font-size:10px; background:var(--white); padding:3.5px; border-radius:3px; border:1px solid #e1eaeef8; text-align:left;">📝 ${esc(cloze)}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  let vocabMatcherHtml = '';
  const matcherCount = Math.min(4, vocabList.length);
  if (matcherCount > 0) {
    vocabMatcherHtml += `<div class="vocab-matcher-container" style="display:flex; flex-direction:column; gap:8px; height:100%; justify-content:center;">`;
    
    let optionsHtml = `<option value="">-- Choose Term --</option>`;
    vocabList.slice(0, matcherCount).forEach(v => {
      optionsHtml += `<option value="${esc(v.term.toLowerCase())}">${esc(v.term)}</option>`;
    });
    
    vocabList.slice(0, matcherCount).forEach((v, idx) => {
      const promptText = v.cloze ? v.cloze.replace(/___+/g, '______') : v.definition;
      
      vocabMatcherHtml += `
        <div class="vocab-matcher-row" style="display:flex; justify-content:space-between; align-items:center; background:var(--white); border:1px solid #e1eaeef8; padding:6px 12px; border-radius:6px; font-size:13.5px; line-height:1.35; gap:10px; box-shadow:0 1px 3px rgba(23,50,77,0.02);">
          <div style="flex:1; font-weight:600; color:var(--body-text); text-align:left;">${esc(promptText)}</div>
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
            <select class="vocab-matcher-select" id="vocab-select-${idx}" data-correct="${esc(v.term.toLowerCase())}" onchange="checkVocabMatch(${idx})" style="padding:4px 8px; border-radius:4px; border:1px solid var(--gray); font-family:inherit; font-size:12.5px; background:var(--bg); font-weight:700; outline:none; transition:all 0.2s; max-width: 140px;">
              ${optionsHtml}
            </select>
            <span id="vocab-feedback-${idx}" style="font-size:15px; font-weight:bold; width:12px; text-align:center;"></span>
          </div>
        </div>
      `;
    });
    
    vocabMatcherHtml += `
      <div id="vocab-matcher-score" style="font-size:13.5px; font-weight:800; text-align:center; color:var(--teal); margin-top:4px;">0 / ${matcherCount} Matched Correctly</div>
    </div>`;
  } else {
    vocabMatcherHtml = `<div style="font-style:italic; color:var(--gray); text-align:center; margin-top:40px; font-size:14px;">No vocabulary items defined.</div>`;
  }
  
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
      exampleStepsHtml += `<div class="worked-step" id="worked-step-${idx + 1}" style="font-size:13.5px; padding:6px 12px; border-bottom: 1px solid #e1eaeef8; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; color:var(--navy);">${esc(step.label)}:</span>
        <span style="font-family:monospace; background:var(--google-gray); padding:2px 6px; border-radius:3px; font-weight:700;">${esc(step.work)}</span>
      </div>`;
    });
    
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%; position:relative;">
          <div>
            <div class="slide-badge-row" style="display:flex; align-items:center; margin-bottom:6px;">
              <span class="slide-badge" style="background:var(--amber); color:var(--navy); font-weight:800; font-size:12px; padding:3px 8px; border-radius:99px; font-family:'Outfit'; text-transform:uppercase; letter-spacing:0.05em; display:inline-flex; align-items:center; gap:4px;">⚠️ ERROR ANALYSIS</span>
            </div>
            <h2 class="card-title" style="font-size:20px; margin: 4px 0 6px;">${esc(pTitle)}</h2>
            <p class="card-desc" style="font-size:14.5px; margin-bottom:8px; line-height:1.45;">Analyze the worked steps. Select the incorrect step below, and write or sketch your correction.</p>
            
            <div class="clipboard" style="padding-top:28px; margin-top:4px;">
              <div class="clipboard-rivets">
                <div class="clipboard-rivet"></div>
                <div class="clipboard-rivet"></div>
              </div>
              <div class="clipboard-paper">
                ${exampleStepsHtml}
              </div>
            </div>
          </div>
          
          <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px;">
            <strong style="font-size:12px; color:var(--navy); text-transform:uppercase;">Identify Error Step:</strong>
            <div style="display:flex; gap:6px;">
              ${workedExample.map((s, idx) => `<button class="assess-btn px-btn" id="btn-errstep-${idx + 1}" onmouseover="highlightWorkedStep(${idx + 1})" onmouseout="clearStepHighlight(${idx + 1})" onclick="checkErrorStep(${idx + 1}, ${errorStep})" style="font-size:14px; width:28px; height:28px;">${idx + 1}</button>`).join('')}
            </div>
            <div id="error-step-feedback" style="font-size:13px; font-weight:700; min-height:14px; margin-top:2px;"></div>
          </div>
        </div>
        
        <div class="slide-card" style="background:var(--coral); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0;">
              <h2 class="card-title" style="font-size:22px; margin:0; color:var(--navy);">🛠️ Fix &amp; Justify</h2>
              <div class="tabs-container" style="margin:0; gap:2px; height:22px; padding-left:0;">
                <button class="tab-btn active" id="btn-pfix-write" onclick="switchPfixMode('write')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Write</button>
                <button class="tab-btn" id="btn-pfix-sketch" onclick="switchPfixMode('sketch')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Sketch</button>
              </div>
            </div>
            
            <div id="pfix-mode-write" style="display:block; flex:1; height:calc(100% - 30px);">
              <textarea id="practice-fix-work" class="slide-input-placeholder" rows="5" placeholder="Explain the error and write the correct calculation steps here..." style="height:100%; font-size:15px;"></textarea>
            </div>
            
            <div id="pfix-mode-sketch" style="display:none; flex:1; flex-direction:column; justify-content:space-between; height:calc(100% - 30px);">
              <div class="math-visual-container" style="flex:1; min-height:110px; border:1.5px dashed var(--navy); border-radius:6px; background:white; position:relative;">
                <canvas id="practice-fix-canvas" width="400" height="130" style="width:100%; height:100%; cursor:crosshair;"></canvas>
              </div>
              <div style="display:flex; gap:6px; margin-top:4px; align-items:center; flex-shrink:0;">
                <button class="assess-btn px-btn active" id="btn-pfix-draw" onclick="setCanvasTool('practice-fix-canvas', 'draw')" style="width:20px; height:20px; font-size:10px; padding:0;">✏️</button>
                <button class="assess-btn px-btn" id="btn-pfix-erase" onclick="setCanvasTool('practice-fix-canvas', 'erase')" style="width:20px; height:20px; font-size:10px; padding:0;">🧽</button>
                <button class="assess-btn px-btn" id="btn-pfix-undo" onclick="undoCanvas('practice-fix-canvas')" style="width:20px; height:20px; font-size:10px; padding:0;">↩️</button>
                <button class="assess-btn px-btn" id="btn-pfix-grid" onclick="toggleCanvasGrid('practice-fix-canvas', this)" style="width:20px; height:20px; font-size:10px; padding:0;" title="Toggle Graph Paper Grid">🌐</button>
                <button class="tool-btn-clear" onclick="clearCanvas('practice-fix-canvas')" style="padding:2px 6px; font-size:9.5px; margin-left:auto; height:20px; line-height:1;">Clear</button>
              </div>
            </div>
          </div>
          
          <button class="btn-present" onclick="revealPracticeSolution()" style="align-self:flex-end; padding:6px 12px; font-size:12px; margin-top:6px; flex-shrink:0;">Reveal Solution</button>
          <div id="practice-solution-box" style="display:none; background:var(--white); border:1px solid #D9795D; border-radius:6px; padding:6px 10px; font-size:12.5px; line-height:1.4; color:var(--body-text); margin-top:6px; box-shadow:var(--shadow); flex-shrink:0;">
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
      choicesHtml += `<button class="assess-btn mc-btn" id="btn-choice-${idx}" onclick="checkMCQuestion(${idx}, ${correctIndex})" style="text-align:left; padding:8px 12px; font-size:14px; margin-bottom:6px; display:flex; align-items:center; width:100%; font-weight:600; line-height:1.4; gap:10px;">
        <span style="background:var(--google-gray); color:var(--navy); width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px;">${String.fromCharCode(65 + idx)}</span>
        <span style="flex:1;">${esc(choice)}</span>
      </button>`;
    });
    
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <div class="slide-badge-row" style="display:flex; align-items:center; margin-bottom:6px;">
              <span class="slide-badge" style="background:var(--teal); color:var(--white); font-weight:800; font-size:12px; padding:3px 8px; border-radius:99px; font-family:'Outfit'; text-transform:uppercase; letter-spacing:0.05em; display:inline-flex; align-items:center; gap:4px;">📝 PRACTICE CHALLENGE</span>
            </div>
            <p class="card-desc" style="font-size:16px; font-weight:700; line-height:1.4; margin-bottom:12px; color:var(--navy);">${esc(stem)}</p>
            <div style="margin-top:10px;">
              ${choicesHtml}
            </div>
          </div>
          <div id="mc-question-feedback" style="font-size:13.5px; font-weight:700; min-height:16px;"></div>
        </div>
        
        <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0;">
              <h2 class="card-title" style="font-size:22px; margin:0; color:var(--navy);">✍️ Work &amp; Justify</h2>
              <div class="tabs-container" style="margin:0; gap:2px; height:22px; padding-left:0;">
                <button class="tab-btn active" id="btn-pmc-write" onclick="switchPmcMode('write')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Write</button>
                <button class="tab-btn" id="btn-pmc-sketch" onclick="switchPmcMode('sketch')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Sketch</button>
              </div>
            </div>
            <p style="font-size:13px; margin-top:0; color:var(--navy); line-height:1.4; flex-shrink:0;">Use this workspace to calculate or explain your thinking.</p>
            
            <div id="pmc-mode-write" style="display:block; flex:1; height:calc(100% - 30px);">
              <textarea id="practice-mc-work" class="slide-input-placeholder" rows="6" placeholder="Type your calculation steps or reasoning here..." style="height:100%; font-size:15px;"></textarea>
            </div>
            
            <div id="pmc-mode-sketch" style="display:none; flex:1; flex-direction:column; justify-content:space-between; height:calc(100% - 30px);">
              <div class="math-visual-container" style="flex:1; min-height:110px; border:1.5px dashed var(--navy); border-radius:6px; background:white; position:relative;">
                <canvas id="practice-mc-canvas" width="400" height="130" style="width:100%; height:100%; cursor:crosshair;"></canvas>
              </div>
              <div style="display:flex; gap:6px; margin-top:4px; align-items:center; flex-shrink:0;">
                <button class="assess-btn px-btn active" id="btn-pmc-draw" onclick="setCanvasTool('practice-mc-canvas', 'draw')" style="width:20px; height:20px; font-size:10px; padding:0;">✏️</button>
                <button class="assess-btn px-btn" id="btn-pmc-erase" onclick="setCanvasTool('practice-mc-canvas', 'erase')" style="width:20px; height:20px; font-size:10px; padding:0;">🧽</button>
                <button class="assess-btn px-btn" id="btn-pmc-undo" onclick="undoCanvas('practice-mc-canvas')" style="width:20px; height:20px; font-size:10px; padding:0;">↩️</button>
                <button class="assess-btn px-btn" id="btn-pmc-grid" onclick="toggleCanvasGrid('practice-mc-canvas', this)" style="width:20px; height:20px; font-size:10px; padding:0;" title="Toggle Graph Paper Grid">🌐</button>
                <button class="tool-btn-clear" onclick="clearCanvas('practice-mc-canvas')" style="padding:2px 6px; font-size:9.5px; margin-left:auto; height:20px; line-height:1;">Clear</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <h2 class="card-title" style="font-size:22px;">📖 Practice Activity</h2>
            <p class="card-desc" style="font-size:15px; line-height:1.5;">Apply what you have learned to solve this math challenge. Double check calculations with your partner.</p>
          </div>
          <textarea id="practice-generic-work" class="slide-input-placeholder" rows="6" placeholder="Type your step-by-step calculations here..." style="font-size:15px;"></textarea>
        </div>
        <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0;">
              <h2 class="card-title" style="font-size:22px; margin:0; color:var(--navy);">✍️ Reasoning &amp; Check</h2>
              <div class="tabs-container" style="margin:0; gap:2px; height:22px; padding-left:0;">
                <button class="tab-btn active" id="btn-pgen-write" onclick="switchPgenMode('write')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Write</button>
                <button class="tab-btn" id="btn-pgen-sketch" onclick="switchPgenMode('sketch')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Sketch</button>
              </div>
            </div>
            <p style="font-size:13.5px; margin-top:0; color:var(--navy); line-height:1.4; flex-shrink:0;">Write a sentence explaining why your answer makes sense.</p>
            
            <div id="pgen-mode-write" style="display:block; flex:1; height:calc(100% - 30px);">
              <textarea id="practice-generic-reasoning" class="slide-input-placeholder" rows="6" placeholder="Explain your mathematical logic here..." style="height:100%; font-size:15px;"></textarea>
            </div>
            
            <div id="pgen-mode-sketch" style="display:none; flex:1; flex-direction:column; justify-content:space-between; height:calc(100% - 30px);">
              <div class="math-visual-container" style="flex:1; min-height:110px; border:1.5px dashed var(--navy); border-radius:6px; background:white; position:relative;">
                <canvas id="practice-gen-canvas" width="400" height="130" style="width:100%; height:100%; cursor:crosshair;"></canvas>
              </div>
              <div style="display:flex; gap:6px; margin-top:4px; align-items:center; flex-shrink:0;">
                <button class="assess-btn px-btn active" id="btn-pgen-draw" onclick="setCanvasTool('practice-gen-canvas', 'draw')" style="width:20px; height:20px; font-size:10px; padding:0;">✏️</button>
                <button class="assess-btn px-btn" id="btn-pgen-erase" onclick="setCanvasTool('practice-gen-canvas', 'erase')" style="width:20px; height:20px; font-size:10px; padding:0;">🧽</button>
                <button class="assess-btn px-btn" id="btn-pgen-undo" onclick="undoCanvas('practice-gen-canvas')" style="width:20px; height:20px; font-size:10px; padding:0;">↩️</button>
                <button class="assess-btn px-btn" id="btn-pgen-grid" onclick="toggleCanvasGrid('practice-gen-canvas', this)" style="width:20px; height:20px; font-size:10px; padding:0;" title="Toggle Graph Paper Grid">🌐</button>
                <button class="tool-btn-clear" onclick="clearCanvas('practice-gen-canvas')" style="padding:2px 6px; font-size:9.5px; margin-left:auto; height:20px; line-height:1;">Clear</button>
              </div>
            </div>
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
      exitChoicesHtml += `<button class="assess-btn exit-btn" id="btn-exit-${idx}" onclick="checkExitTicket(${idx}, ${exitCorrectIndex})" style="text-align:left; padding:6px 12px; font-size:14.5px; margin-bottom:6px; display:flex; align-items:center; width:100%; font-weight:600; line-height:1.35; gap:10px;">
        <span style="background:var(--google-gray); color:var(--navy); width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px;">${String.fromCharCode(65 + idx)}</span>
        <span style="flex:1;">${esc(choice)}</span>
      </button>`;
    });
    exitTicketHtml = `
      <div style="margin-top:2px;">
        <p style="font-size:15px; font-weight:700; margin:0 0 8px; color:var(--navy); line-height:1.4;">${esc(exitStem)}</p>
        <div style="margin-top:6px;">
          ${exitChoicesHtml}
        </div>
        <div id="exit-ticket-feedback" style="font-size:13.5px; font-weight:700; min-height:14px; margin-top:2px;"></div>
      </div>
    `;
  } else {
    exitTicketHtml = `
      <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0;">
          <p style="font-size:14.5px; margin:0; font-weight:700; color:var(--navy); line-height:1.35; flex:1; text-align:left;">${esc(exitStem)}</p>
          <div class="tabs-container" style="margin:0; gap:2px; height:22px; padding-left:0; flex-shrink:0;">
            <button class="tab-btn active" id="btn-exit-write" onclick="switchExitMode('write')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Write</button>
            <button class="tab-btn" id="btn-exit-sketch" onclick="switchExitMode('sketch')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Sketch</button>
          </div>
        </div>
        
        <div id="exit-mode-write" style="display:block; flex:1; height:calc(100% - 30px);">
          <textarea id="exit-ticket-text-work" class="slide-input-placeholder" rows="4" placeholder="Type your final answer and explanation here..." style="height:100%; font-size:15px;"></textarea>
        </div>
        
        <div id="exit-mode-sketch" style="display:none; flex:1; flex-direction:column; justify-content:space-between; height:calc(100% - 30px);">
          <div class="math-visual-container" style="flex:1; min-height:110px; border:1.5px dashed var(--navy); border-radius:6px; background:white; position:relative;">
            <canvas id="exit-canvas" width="400" height="130" style="width:100%; height:100%; cursor:crosshair;"></canvas>
          </div>
          <div style="display:flex; gap:6px; margin-top:4px; align-items:center; flex-shrink:0;">
            <button class="assess-btn px-btn active" id="btn-exit-draw" onclick="setCanvasTool('exit-canvas', 'draw')" style="width:20px; height:20px; font-size:10px; padding:0;">✏️</button>
            <button class="assess-btn px-btn" id="btn-exit-erase" onclick="setCanvasTool('exit-canvas', 'erase')" style="width:20px; height:20px; font-size:10px; padding:0;">🧽</button>
            <button class="assess-btn px-btn" id="btn-exit-undo" onclick="undoCanvas('exit-canvas')" style="width:20px; height:20px; font-size:10px; padding:0;">↩️</button>
            <button class="assess-btn px-btn" id="btn-exit-grid" onclick="toggleCanvasGrid('exit-canvas', this)" style="width:20px; height:20px; font-size:10px; padding:0;" title="Toggle Graph Paper Grid">🌐</button>
            <button class="tool-btn-clear" onclick="clearCanvas('exit-canvas')" style="padding:2px 6px; font-size:9.5px; margin-left:auto; height:20px; line-height:1;">Clear</button>
          </div>
        </div>
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
      --theme-color: ${getThemeColor(data.theme)};
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
      font-size: 18px;
      color: var(--navy);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .g-doc-title span {
      background: var(--teal-light);
      color: var(--teal);
      font-size: 12px;
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
    
    /* Slide Canvas: Fixed 16:9 Aspect Ratio (960x540) with subtle math grid background */
    .slide-canvas {
      width: 960px;
      height: 540px;
      background-color: var(--bg);
      background-image: 
        linear-gradient(rgba(31, 166, 162, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(31, 166, 162, 0.06) 1px, transparent 1px);
      background-size: 20px 20px;
      border: 1px solid #dadce0;
      box-shadow: 0 10px 30px rgba(23, 50, 77, 0.15);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      padding: 24px 24px 24px 60px;
    }
    
    /* Notebook Spiral Binder Gutter */
    .notebook-spiral {
      position: absolute;
      left: 14px;
      top: 24px;
      bottom: 24px;
      width: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      pointer-events: none;
    }
    .spiral-ring {
      width: 16px;
      height: 32px;
      background: linear-gradient(90deg, #999 0%, #e0e0e0 25%, #fff 50%, #999 75%, #555 100%);
      border-radius: 8px;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.18), -1px 1px 2px rgba(0,0,0,0.15) inset;
      position: relative;
    }
    .spiral-ring::before {
      content: "";
      position: absolute;
      left: -8px;
      top: 8px;
      width: 10px;
      height: 16px;
      background: #1e1e1e;
      border-radius: 50%;
      box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5);
      z-index: -1;
    }
    .spiral-ring::after {
      content: "";
      position: absolute;
      right: -8px;
      top: 8px;
      width: 10px;
      height: 16px;
      background: #1e1e1e;
      border-radius: 50%;
      box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5);
      z-index: -1;
    }
    
    /* Inner Slide Content Frames (No solid colored headers, fully integrated) */
    .slide-body {
      flex: 1;
      display: none;
      height: calc(100% - 40px);
      overflow: hidden;
      margin-top: 10px;
    }
    .slide-body.active {
      display: flex;
      flex-direction: column;
    }
    
    .slide-badge-row {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .slide-badge {
      background: var(--theme-color);
      color: var(--white);
      font-weight: 800;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 99px;
      font-family: "Outfit", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 4px rgba(31, 166, 162, 0.12);
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
      font-size: 17px;
      color: var(--navy);
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
    }
    
    p.card-desc {
      font-size: 13.5px;
      line-height: 1.5;
      color: var(--body-text);
      margin: 0 0 12px;
    }
    
    /* Notice and Wonder boxes */
    .nw-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .nw-box {
      border-radius: 6px;
      padding: 16px 12px 12px;
      flex: 1;
      position: relative;
      box-shadow: 0 4px 10px rgba(23,50,77,0.06);
      border: 1px solid #dadce0;
      margin-top: 10px;
    }
    .nw-box-notice {
      background: #F4FAF8;
      border-color: var(--teal);
    }
    .nw-box-wonder {
      background: #FFF8F6;
      border-color: #D9795D;
    }
    .nw-box h4 { margin: 4px 0 6px; font-size: 12.5px; color: var(--navy); font-weight: 800; }
    .nw-box-stems { font-size: 11px; color: var(--body-text); line-height: 1.4; }
    .nw-box-stems div { margin-bottom: 3px; }
    
    .vocab-pill {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 700;
      color: var(--teal);
      background: var(--teal-light);
      padding: 3px 9px;
      border-radius: 99px;
      margin-right: 5px;
      margin-top: 5px;
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
      transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .vocab-card:hover {
      transform: translateY(-2px);
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
    .vocab-card-front h3 { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.05em; }
    .vocab-card-back {
      background: var(--teal-light);
      border: 1.5px solid var(--teal);
      color: var(--body-text);
      transform: rotateY(180deg);
      font-size: 13.5px;
      line-height: 1.4;
    }
    .click-hint { font-size: 11px; color: var(--gray); margin-top: 4px; font-weight: 600; }
    
    /* File Folder Notebook Concept Tabs */
    .tabs-container {
      display: flex;
      gap: 6px;
      margin-bottom: 0px;
      padding-left: 10px;
      position: relative;
      z-index: 10;
    }
    .tab-btn {
      background: #EBE7DB;
      border: 1px solid #dadce0;
      border-bottom: none;
      font-family: "Outfit", sans-serif;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--gray);
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--navy);
      background: #F1ECE0;
    }
    .tab-btn.active {
      color: var(--navy);
      background: var(--white);
      border-color: #dadce0;
      border-bottom: 2px solid var(--white);
      padding-top: 10px;
      margin-top: -2px;
      box-shadow: 0 -2px 10px rgba(23,50,77,0.05);
    }
    .tab-content {
      background-color: var(--white);
      background-image: linear-gradient(rgba(31, 166, 162, 0.06) 1px, transparent 1px);
      background-size: 100% 22px;
      background-position: 0 12px;
      border: 1px solid #dadce0;
      border-radius: 8px;
      padding: 20px 20px 20px 24px;
      height: calc(100% - 32px);
      overflow-y: auto;
      box-shadow: var(--shadow);
      position: relative;
      z-index: 5;
      font-size: 14.5px;
      line-height: 1.5 !important;
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
      box-shadow: var(--shadow);
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
    .canvas-grid-bg {
      background-size: 20px 20px;
      background-image: 
        linear-gradient(to right, rgba(23, 50, 77, 0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(23, 50, 77, 0.08) 1px, transparent 1px);
    }
    
    /* Drawing Wooden Pencil Tray Toolbar */
    .drawing-toolbar {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      background: linear-gradient(180deg, #e6dfcf 0%, #d8cdb4 100%);
      border: 1px solid #c2b598;
      border-bottom: 3px solid #ab9d7f;
      box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
      padding: 6px 12px;
      border-radius: 8px;
      align-items: center;
      width: 100%;
    }
    .color-picker-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid var(--white);
      box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      transition: all 0.2s;
    }
    .color-picker-dot:hover {
      transform: scale(1.15);
    }
    .color-picker-dot.active {
      transform: scale(1.2);
      box-shadow: 0 0 0 2px var(--teal);
    }
    
    .size-picker-dot {
      border-radius: 50%;
      background: var(--navy);
      cursor: pointer;
      transition: all 0.2s;
      display: inline-block;
    }
    .size-picker-dot:hover {
      transform: scale(1.2);
    }
    .size-picker-dot.active {
      box-shadow: 0 0 0 2px var(--teal);
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
      transition: transform 0.1s;
    }
    .tool-btn-clear:active {
      transform: scale(0.95);
    }
    
    /* Custom input elements styled as Google Slides text placeholders */
    .slide-input-placeholder {
      border: 1px dashed var(--gray);
      border-radius: 4px;
      padding: 8px;
      font-size: 15px;
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
    
    /* Explore Ruled Index Card with Blue/Red Lines */
    .index-card {
      background-color: var(--white);
      background-image: 
        linear-gradient(rgba(31, 166, 162, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(217, 121, 93, 0.25) 1px, transparent 1px);
      background-size: 100% 22px, 100% 100%;
      background-position: 0 10px, 40px 0;
      border: 1px solid #dadce0;
      border-radius: 6px;
      padding: 16px 16px 16px 52px !important;
      min-height: 100px;
      font-family: 'Hanken Grotesk', sans-serif;
      font-size: 16px;
      line-height: 24px !important;
      color: var(--navy);
      text-align: left;
      box-shadow: 0 8px 16px rgba(23,50,77,0.08);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    
    .index-card-mini {
      background-color: var(--white);
      background-image: 
        linear-gradient(rgba(31, 166, 162, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(217, 121, 93, 0.15) 1px, transparent 1px);
      background-size: 100% 16px, 100% 100%;
      background-position: 0 4px, 25px 0;
      border: 1px solid #dadce0;
      border-radius: 6px;
      padding: 6px 8px 6px 32px !important;
      font-size: 12.5px;
      line-height: 1.3;
      color: var(--navy);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(23,50,77,0.04);
      position: relative;
      min-height: 62px;
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .index-card-mini:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(23,50,77,0.08);
      border-color: var(--teal);
    }
    
    /* Explore Game slide-off animations */
    @keyframes slideOutLeft {
      0% { transform: translateX(0) rotate(0); opacity: 1; }
      100% { transform: translateX(-120px) rotate(-10deg); opacity: 0; }
    }
    @keyframes slideOutRight {
      0% { transform: translateX(0) rotate(0); opacity: 1; }
      100% { transform: translateX(120px) rotate(10deg); opacity: 0; }
    }
    @keyframes slideInNext {
      0% { transform: translateY(10px) scale(0.95); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    .slide-out-left { animation: slideOutLeft 0.3s forwards; }
    .slide-out-right { animation: slideOutRight 0.3s forwards; }
    .slide-in-next { animation: slideInNext 0.3s forwards; }
    
    /* Progress bar */
    .sorting-progress-container {
      width: 100%;
      height: 5px;
      background: #E1EAEF;
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .sorting-progress-bar {
      height: 100%;
      width: 0%;
      background: var(--teal);
      border-radius: 99px;
      transition: width 0.3s ease;
    }
    
    /* Sorting Bins */
    .sorting-bin {
      border: 2px solid var(--bin-color, var(--teal));
      background: var(--white);
      border-radius: 8px 8px 12px 12px;
      padding: 18px 14px 12px;
      font-size: 11px;
      font-weight: 800;
      color: var(--navy);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
      flex: 1;
      min-width: 100px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(23,50,77,0.06);
      position: relative;
      overflow: hidden;
    }
    .sorting-bin::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: var(--bin-color, var(--teal));
    }
    @keyframes binPulse {
      0% { transform: translateY(0); box-shadow: 0 4px 8px rgba(23,50,77,0.06); }
      100% { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(23,50,77,0.12); }
    }
    .sorting-bin:hover {
      animation: binPulse 0.4s forwards;
      background: var(--white);
    }
    
    /* Clipboard Worked Example layout */
    .clipboard {
      background: linear-gradient(135deg, #c5b59a 0%, #ab9a7d 100%);
      border: 3px solid #8e7d61;
      border-radius: 8px;
      padding: 36px 12px 12px 12px;
      position: relative;
      box-shadow: 0 10px 25px rgba(23,50,77,0.12);
    }
    .clipboard::before {
      content: "";
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 20px;
      background: linear-gradient(180deg, #e6e8ea 0%, #b2b6b9 45%, #7f8c8d 100%);
      border: 1px solid #7f8c8d;
      border-radius: 4px;
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.8);
      z-index: 15;
    }
    .clipboard::after {
      content: "";
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 12px;
      background: transparent;
      border: 3px solid #7f8c8d;
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      z-index: 14;
    }
    .clipboard-rivets {
      position: absolute;
      top: 13px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 calc(50% - 32px);
      z-index: 16;
      pointer-events: none;
    }
    .clipboard-rivet {
      width: 6px;
      height: 6px;
      background: radial-gradient(circle at 2px 2px, #fff, #999 50%, #444 100%);
      border-radius: 50%;
      border: 0.5px solid #555;
      box-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }
    .clipboard-paper {
      background: var(--white);
      border: 1px solid #dadce0;
      box-shadow: 0 4px 8px rgba(0,0,0,0.06);
      border-radius: 2px;
      padding: 12px 0;
      position: relative;
    }
    .worked-step.highlighted {
      background: linear-gradient(100deg, rgba(242, 193, 91, 0.6) 0%, rgba(242, 193, 91, 0.45) 90%, rgba(242, 193, 91, 0.1) 100%) !important;
      border-radius: 4px 2px 6px 3px;
      transform: scale(1.02);
      transition: all 0.15s ease-in-out;
      box-shadow: inset 0 -2px 0 rgba(242, 193, 91, 0.2);
    }
    
    /* Realistic sticky notes with random skew and tape effect */
    .post-it-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      justify-content: center;
    }
    .sticky-note {
      padding: 14px;
      border-radius: 4px;
      box-shadow: 0 5px 12px rgba(0,0,0,0.08);
      position: relative;
      transition: transform 0.2s;
    }
    .post-it-3 {
      background-color: #FDF1B8;
      border-left: 3px solid #E4C050;
    }
    .post-it-2 {
      background-color: #D5F3ED;
      border-left: 3px solid #1FA6A2;
    }
    .post-it-1 {
      background-color: #FCDCD4;
      border-left: 3px solid #D9795D;
    }
    .post-it-title {
      font-family: "Outfit", sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      color: var(--navy);
      margin-bottom: 6px;
    }
    .sticky-note input[type="text"] {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px dashed rgba(23,50,77,0.25);
      font-size: 13.5px;
      font-family: inherit;
      color: var(--navy);
      outline: none;
      padding: 2px 0;
    }
    .sticky-note input[type="text"]::placeholder {
      color: rgba(23,50,77,0.4);
      font-style: italic;
    }
    .washi-tape {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%) rotate(-2deg);
      width: 60px;
      height: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      pointer-events: none;
      z-index: 15;
      clip-path: polygon(
        0% 20%, 5% 0%, 95% 0%, 100% 20%, 97% 40%, 100% 60%, 98% 80%, 100% 100%, 95% 90%, 5% 100%, 0% 80%, 2% 60%, 0% 40%, 2% 20%
      );
    }
    
    /* Presenter HUD */
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
    :fullscreen ~ .presenter-hud { display: flex; }
    :-webkit-full-screen ~ .presenter-hud { display: flex; }
    
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
    .hud-btn:hover { background: rgba(255,255,255,0.15); }
    .hud-timer {
      font-family: monospace;
      font-size: 14px;
      border-left: 1px solid rgba(255,255,255,0.3);
      padding-left: 14px;
    }
    
    /* Assessment & Practice Buttons */
    .assess-row {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .assess-btn {
      flex: 1;
      padding: 7px;
      border-radius: 6px;
      border: 1.5px solid var(--gray);
      background: var(--white);
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .assess-btn:hover {
      background: var(--google-gray);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(23,50,77,0.08);
      border-color: var(--teal);
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
      width: 30px;
      height: 30px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Subtle watermark style for slides */
    .slide-watermark {
      position: absolute;
      bottom: 12px;
      left: 24px;
      right: 24px;
      font-family: "Outfit", sans-serif;
      font-size: 8px;
      font-weight: 800;
      color: var(--gray);
      opacity: 0.65;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      pointer-events: none;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(23, 50, 77, 0.06);
      padding-top: 6px;
    }
    
    /* Slide 5 Canvas Active Borders & cursors */
    .math-visual-container {
      transition: all 0.25s ease-in-out;
    }
    .math-visual-container.tool-draw {
      border-color: var(--navy);
      box-shadow: 0 0 8px rgba(23, 50, 77, 0.25);
    }
    .math-visual-container.tool-highlight {
      border-color: var(--amber);
      box-shadow: 0 0 8px rgba(242, 193, 91, 0.35);
    }
    .math-visual-container.tool-erase {
      border-color: #D9795D;
      box-shadow: 0 0 8px rgba(217, 121, 93, 0.25);
    }
    
    .canvas-overlay.cursor-draw { cursor: crosshair; }
    .canvas-overlay.cursor-highlight { cursor: cell; }
    .canvas-overlay.cursor-erase { cursor: alias; }

    /* Paste Flash animations for textareas */
    @keyframes flashPasted {
      0% { outline: 3px solid rgba(31, 166, 162, 0.6); background: rgba(31, 166, 162, 0.08); }
      100% { outline: 3px solid transparent; background: #FDFDFB; }
    }
    .pasted-flash {
      animation: flashPasted 0.8s ease-out;
    }

    /* Confetti Particle Overlay */
    .confetti-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 50;
    }
    .confetti-particle {
      position: absolute;
      top: -10px;
      width: 6px;
      height: 10px;
      opacity: 0.85;
      border-radius: 2px;
      animation: confettiFall 2.5s linear infinite;
    }
    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(220px) rotate(360deg); }
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
      
        <!-- Notebook Spiral Gutter -->
        <div class="notebook-spiral">
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
          <div class="spiral-ring"></div>
        </div>
      
        <!-- SLIDE 1: OBJECTIVES -->
        <div class="slide-body active" id="slide-1">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
            <span style="font-size:10px; color:var(--gray); font-weight:700; margin-left:auto; font-family:'Outfit';">STANDARD: ${esc(standard)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Objectives &amp; Targets</h3>
          
          <div class="slide-card">
            <div style="font-size: 16px; line-height: 1.6; display: flex; flex-direction: column; gap: 16px; justify-content: center; height: 100%;">
              <div>
                <strong style="color:var(--navy); font-size:16px; font-family:'Outfit';">Content Objective:</strong>
                <p style="margin: 4px 0 0; color:var(--body-text); font-size:14.5px; font-weight:600;">${esc(contentObj)}</p>
              </div>
              <div style="margin-top:4px;">
                <strong style="color:var(--navy); font-size:16px; font-family:'Outfit';">Language Objective:</strong>
                <p style="margin: 4px 0 0; color:var(--body-text); font-size:14.5px; font-weight:600;">${esc(langObj)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 2: SCENARIO LAUNCH -->
        <div class="slide-body" id="slide-2">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Scenario Launch</h3>
          
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title" style="font-size:15px; margin-bottom:8px; font-weight:800; color:var(--teal);">📋 ${esc(launchBadge)}</h2>
                <p class="card-desc" style="font-size:12.5px; line-height:1.5; margin-bottom:8px; color:var(--body-text);">${esc(launchNarrative)}</p>
              </div>
              <div style="margin-top:auto;">
                <strong style="font-size:10px; color:var(--gray); text-transform:uppercase;">Vocabulary Bank:</strong>
                <div style="margin-top:4px; max-height: 60px; overflow-y: auto;">${launchVocabBankHtml}</div>
              </div>
            </div>
            <div class="slide-card nw-container" style="border:none; background:transparent; box-shadow:none; padding:0;">
              <div class="nw-box nw-box-notice" style="display:flex; flex-direction:column; justify-content:space-between; transform: rotate(-1deg);">
                <div class="washi-tape" style="background: repeating-linear-gradient(45deg, rgba(31,166,162,0.3), rgba(31,166,162,0.3) 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px);"></div>
                <div>
                  <h4>👀 Notice Prompts:</h4>
                  <div class="nw-box-stems" style="margin-bottom:4px;">${noticeStemsHtml}</div>
                </div>
                <textarea id="student-notice" class="slide-input-placeholder" rows="2" placeholder="Type what you notice here..."></textarea>
              </div>
              <div class="nw-box nw-box-wonder" style="display:flex; flex-direction:column; justify-content:space-between; transform: rotate(1deg);">
                <div class="washi-tape" style="background: repeating-linear-gradient(45deg, rgba(217,121,93,0.3), rgba(217,121,93,0.3) 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px);"></div>
                <div>
                  <h4>💭 Wonder Prompts:</h4>
                  <div class="nw-box-stems" style="margin-bottom:4px;">${wonderStemsHtml}</div>
                </div>
                <textarea id="student-wonder" class="slide-input-placeholder" rows="2" placeholder="Type what you wonder here..."></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 3: CONCEPT INTRO & FLOW -->
        <div class="slide-body" id="slide-3">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Concept Introduction</h3>
          
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title" style="font-size:15px; margin-bottom:8px; font-weight:800; color:var(--teal);">💡 ${esc(conceptHeading)}</h2>
                <p class="card-desc" style="font-size:12.5px; line-height:1.5; margin-bottom:8px;">${esc(conceptText)}</p>
              </div>
              ${conceptKeyIdea ? `
              <div style="background:var(--teal-light); border:1.5px solid var(--teal); border-radius:8px; padding:10px; margin-top:auto;">
                <strong style="font-size:9.5px; color:var(--navy); text-transform:uppercase; letter-spacing:0.02em;">Key Idea:</strong>
                <p style="margin:2px 0 0; font-size:12px; font-weight:700; color:var(--navy); line-height:1.3;">${esc(conceptKeyIdea)}</p>
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
        
        <!-- SLIDE 4: VOCABULARY CARD GRID & MATCHER -->
        <div class="slide-body" id="slide-4">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Visual Vocabulary</h3>
          
          <div class="slide-grid-2">
            <div style="display: flex; flex-direction: column; gap: 12px; justify-content: center; height: 100%;">
              <p class="card-desc" style="font-size:16px; line-height:1.6; margin:0;">Master the vocabulary keys. Flip the flashcards to see Spanish translations and visual diagrams, or play the matcher game!</p>
              <div style="background:var(--teal-light); border-radius:8px; padding:12px; font-size:14px; color:var(--navy); font-weight:700; line-height:1.5; border: 1.5px solid var(--teal);">
                💡 Tip: Use these core vocabulary terms during your partner work and team explanations!
              </div>
            </div>
            
            <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
              <div class="tabs-container" style="flex-shrink:0;">
                <button class="tab-btn active" id="btn-vocab-study" onclick="switchVocabTab('study')">Study Cards</button>
                <button class="tab-btn" id="btn-vocab-match" onclick="switchVocabTab('match')">Vocab Matcher</button>
              </div>
              
              <!-- Study Cards Tab Panel -->
              <div id="vocab-tab-study" class="tab-content" style="flex:1; padding: 10px; line-height: normal !important; background-image: none; height: calc(100% - 32px);">
                <div class="vocab-grid">
                  ${vocabCardsHtml}
                </div>
              </div>
              
              <!-- Matcher Tab Panel -->
              <div id="vocab-tab-match" class="tab-content" style="flex:1; padding: 10px; line-height: normal !important; background-image: none; display: none; height: calc(100% - 32px);">
                ${vocabMatcherHtml}
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 5: VISUAL MODEL WITH CANVAS OVERLAY -->
        <div class="slide-body" id="slide-5">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Visual Modeling Workspace</h3>
          
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <p class="card-desc" style="font-size:12px; line-height:1.4; margin:0;">Use the drawing tray below to select pen colors, size, or erase. Draw directly on the visual math card to annotate findings.</p>
              </div>
              
              <!-- TpT Stylized Wooden Pencil Tray Toolbar -->
              <div class="drawing-toolbar">
                <div style="display:flex; gap:5px; align-items:center;">
                  <button class="assess-btn px-btn active" id="btn-draw" onclick="setDrawingTool('draw')" title="Pen" style="width:26px; height:26px; font-size:11px;">✏️</button>
                  <button class="assess-btn px-btn" id="btn-highlighter" onclick="setDrawingTool('highlight')" title="Highlighter" style="width:26px; height:26px; font-size:11px;">🖍️</button>
                  <button class="assess-btn px-btn" id="btn-erase" onclick="setDrawingTool('erase')" title="Eraser" style="width:26px; height:26px; font-size:11px;">🧽</button>
                  <button class="assess-btn px-btn" id="btn-undo" onclick="undoLast()" title="Undo" style="width:26px; height:26px; font-size:11px;">↩️</button>
                  <button class="assess-btn px-btn" id="btn-math-grid" onclick="toggleCanvasGrid('math-canvas', this)" title="Toggle Grid" style="width:26px; height:26px; font-size:11px; margin-left:4px;">🌐</button>
                </div>
                
                <!-- Color Picker Dots -->
                <div style="display:flex; gap:5px; align-items:center; border-left:1px solid #d3cbb5; padding-left:8px;">
                  <div class="color-picker-dot active" style="background:#17324D;" onclick="setDrawingColor('#17324D', this)"></div>
                  <div class="color-picker-dot" style="background:#1FA6A2;" onclick="setDrawingColor('#1FA6A2', this)"></div>
                  <div class="color-picker-dot" style="background:#F2C15B;" onclick="setDrawingColor('#F2C15B', this)"></div>
                  <div class="color-picker-dot" style="background:#D9795D;" onclick="setDrawingColor('#D9795D', this)"></div>
                  <div class="color-picker-dot" style="background:#000000;" onclick="setDrawingColor('#000000', this)"></div>
                </div>
                
                <!-- Size Dots -->
                <div style="display:flex; gap:6px; align-items:center; border-left:1px solid #d3cbb5; padding-left:8px;">
                  <div class="size-picker-dot active" style="width:6px; height:6px;" onclick="setDrawingSize(2, this)" title="Thin"></div>
                  <div class="size-picker-dot" style="width:10px; height:10px;" onclick="setDrawingSize(5, this)" title="Medium"></div>
                  <div class="size-picker-dot" style="width:14px; height:14px;" onclick="setDrawingSize(10, this)" title="Thick"></div>
                </div>
                
                <button class="tool-btn-clear" onclick="clearDrawingCanvas()">Clear</button>
              </div>
            </div>
            
            <div class="math-visual-container tool-draw" id="math-visual-container-element">
              <div style="position: absolute; inset: 0; z-index: 1;">
                ${svgVisual}
              </div>
              <canvas id="math-canvas" width="440" height="240" class="canvas-overlay cursor-draw"></canvas>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 6: INTERACTIVE EXPLORE ACTIVITY -->
        <div class="slide-body" id="slide-6">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 6px 0 10px; letter-spacing:-0.02em;">Explore Activity</h3>
          
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%; overflow:hidden;">
              <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
                <!-- Progress Container -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-shrink:0;">
                  <div style="flex:1;">
                    <div style="font-size:13.5px; font-weight:800; color:var(--navy); margin-bottom:2px;" id="explore-progress-text">0 / ${normalizedItems.length} Sorted Correctly</div>
                    <div class="sorting-progress-container" style="margin-bottom:0; height:6px;">
                      <div id="sorting-progress-bar" class="sorting-progress-bar"></div>
                    </div>
                  </div>
                  <button class="assess-btn" onclick="resetSortingGame()" style="flex:none; width:auto; padding:3px 10px; font-size:12px; height:24px; border-radius:4px; font-weight:800; background:transparent; border-color:var(--gray); color:var(--gray); cursor:pointer; margin-left:12px;">🔄 Reset All</button>
                </div>
                
                <p class="card-desc" style="font-size:14px; margin:0 0 8px; line-height:1.4; flex-shrink:0;" id="explore-instructions">${esc(exploreInstructions)}</p>
                
                <!-- Grid of Mini Index Cards -->
                <div id="explore-grid-container" style="flex:1; overflow-y:auto; padding:6px; background:var(--google-gray); border-radius:6px; border:1px solid #dadce0; position:relative;">
                  <!-- Confetti Container -->
                  <div id="confetti-container" class="confetti-overlay" style="display:none;"></div>
                  
                  <div id="explore-cards-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <!-- Populated dynamically with mini index cards -->
                  </div>
                </div>
              </div>
              
              <div style="margin-top:6px; flex-shrink:0;">
                <strong style="font-size:11px; color:var(--gray); text-transform:uppercase;">Keyword Bank:</strong>
                <div style="margin-top:2px; max-height: 45px; overflow-y: auto;">${exploreVocabBankHtml}</div>
              </div>
            </div>
            
            <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title" style="font-size:22px; margin-bottom:6px; color:var(--navy);">✍️ Explore Discourse</h2>
                <p style="font-size:14.5px; margin-top:0; color:var(--navy); font-weight:600; line-height:1.4;">${esc(discoursePrompt)}</p>
                ${discourseFrame ? `<div style="font-size:12px; font-style:italic; color:var(--body-text); background:var(--white); padding:6px 8px; border-radius:4px; border:1px solid #e1eaeef8; margin-bottom:6px; line-height:1.35;"><strong>Sentence Starter:</strong><br/>${esc(discourseFrame)}</div>` : ''}
              </div>
              <textarea id="explore-discourse-work" class="slide-input-placeholder" rows="3" placeholder="Type your discourse explanation here..."></textarea>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 7: PRACTICE PROBLEM -->
        <div class="slide-body" id="slide-7">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Practice Challenge</h3>
          ${practiceHtml}
        </div>
        
        <!-- SLIDE 8: REAL-WORLD CONNECTION -->
        <div class="slide-body" id="slide-8">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Real-World Connection</h3>
          
          <div class="slide-grid-2">
            <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height:100%;">
              <div>
                <h2 class="card-title" style="font-size:22px; margin-bottom:8px; font-weight:800; color:var(--teal);">🌍 Math in the Wild</h2>
                <p class="card-desc" style="font-size:15px; line-height:1.5; margin-bottom:8px; color:var(--body-text);">${esc(connectScenario)}</p>
              </div>
              <div style="margin-top:auto;">
                <strong style="font-size:11px; color:var(--gray); text-transform:uppercase;">Keyword Bank:</strong>
                <div style="margin-top:2px; max-height: 45px; overflow-y: auto;">${connectVocabBankHtml}</div>
              </div>
            </div>
            <div class="slide-card" style="background:var(--teal-light); display:flex; flex-direction:column; justify-content:space-between; height:100%;">
              <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0;">
                  <h2 class="card-title" style="font-size:22px; margin:0; color:var(--navy);">✍️ Connection Reasoning</h2>
                  <div class="tabs-container" style="margin:0; gap:2px; height:22px; padding-left:0;">
                    <button class="tab-btn active" id="btn-rw-write" onclick="switchRwMode('write')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Write</button>
                    <button class="tab-btn" id="btn-rw-sketch" onclick="switchRwMode('sketch')" style="padding:2px 8px; font-size:9.5px; height:22px; border-radius:4px 4px 0 0;">Sketch</button>
                  </div>
                </div>
                <p style="font-size:14.5px; margin-top:0; color:var(--navy); font-weight:600; line-height:1.35; flex-shrink:0;">${esc(connectPrompt)}</p>
                ${connectFrame ? `<div style="font-size:12px; font-style:italic; color:var(--body-text); background:var(--white); padding:5px 8px; border-radius:4px; border:1px solid #e1eaeef8; margin-bottom:6px; line-height:1.35; flex-shrink:0;"><strong>Sentence Starter:</strong><br/>${esc(connectFrame)}</div>` : ''}
                
                <div id="rw-mode-write" style="display:block; flex:1; height:calc(100% - 30px);">
                  <textarea id="rw-connect-work" class="slide-input-placeholder" rows="4" placeholder="Write your connection explanation here..." style="height:100%; font-size:15px;"></textarea>
                </div>
                
                <div id="rw-mode-sketch" style="display:none; flex:1; flex-direction:column; justify-content:space-between; height:calc(100% - 30px);">
                  <div class="math-visual-container" style="flex:1; min-height:110px; border:1.5px dashed var(--navy); border-radius:6px; background:white; position:relative;">
                    <canvas id="rw-canvas" width="400" height="130" style="width:100%; height:100%; cursor:crosshair;"></canvas>
                  </div>
                  <div style="display:flex; gap:6px; margin-top:4px; align-items:center; flex-shrink:0;">
                    <button class="assess-btn px-btn active" id="btn-rw-draw" onclick="setCanvasTool('rw-canvas', 'draw')" style="width:20px; height:20px; font-size:10px; padding:0;">✏️</button>
                    <button class="assess-btn px-btn" id="btn-rw-erase" onclick="setCanvasTool('rw-canvas', 'erase')" style="width:20px; height:20px; font-size:10px; padding:0;">🧽</button>
                    <button class="assess-btn px-btn" id="btn-rw-undo" onclick="undoCanvas('rw-canvas')" style="width:20px; height:20px; font-size:10px; padding:0;">↩️</button>
                    <button class="assess-btn px-btn" id="btn-rw-grid" onclick="toggleCanvasGrid('rw-canvas', this)" style="width:20px; height:20px; font-size:10px; padding:0;" title="Toggle Graph Paper Grid">🌐</button>
                    <button class="tool-btn-clear" onclick="clearCanvas('rw-canvas')" style="padding:2px 6px; font-size:9.5px; margin-left:auto; height:20px; line-height:1;">Clear</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SLIDE 9: REFLECTION & EXIT TICKET -->
        <div class="slide-body" id="slide-9">
          <div class="slide-badge-row">
            <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
          </div>
          <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin: 8px 0 12px; letter-spacing:-0.02em;">Reflection &amp; Exit Ticket</h3>
          
          <div class="slide-grid-2">
            <div class="slide-card" style="justify-content:space-between; height: 100%; border:none; background:transparent; box-shadow:none; padding:0;">
              <!-- TpT Cozy Overlapping Sticky Notes -->
              <div class="post-it-grid">
                <div class="sticky-note post-it-3" style="transform: rotate(-1.5deg);">
                  <div class="washi-tape" style="background: repeating-linear-gradient(45deg, rgba(242,193,91,0.4), rgba(242,193,91,0.4) 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px);"></div>
                  <div class="post-it-title">3 Things I learned:</div>
                  <div style="display:flex; flex-direction:column; gap:4px;">
                    <input type="text" id="ref-3-1" placeholder="1. ..." />
                    <input type="text" id="ref-3-2" placeholder="2. ..." />
                    <input type="text" id="ref-3-3" placeholder="3. ..." />
                  </div>
                </div>
                <div class="sticky-note post-it-2" style="transform: rotate(2deg); margin-top: -5px;">
                  <div class="washi-tape" style="background: repeating-linear-gradient(45deg, rgba(31,166,162,0.4), rgba(31,166,162,0.4) 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px);"></div>
                  <div class="post-it-title">2 Connections I made:</div>
                  <div style="display:flex; flex-direction:column; gap:4px;">
                    <input type="text" id="ref-2-1" placeholder="1. ..." />
                    <input type="text" id="ref-2-2" placeholder="2. ..." />
                  </div>
                </div>
                <div class="sticky-note post-it-1" style="transform: rotate(-1deg); margin-top: -5px;">
                  <div class="washi-tape" style="background: repeating-linear-gradient(45deg, rgba(217,121,93,0.4), rgba(217,121,93,0.4) 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px);"></div>
                  <div class="post-it-title">1 Question I still have:</div>
                  <input type="text" id="ref-1-1" placeholder="1. ..." />
                </div>
              </div>
            </div>
            
            <div class="slide-card" style="background:var(--teal-light); justify-content:space-between; height: 100%;">
              <div>
                <h2 class="card-title" style="font-size:22px; margin-bottom:4px; font-weight:800; color:var(--navy);">📝 Exit Ticket</h2>
                ${exitTicketHtml}
              </div>
              
              <div style="margin-top:4px; border-top: 1px dashed var(--teal); padding-top:4px;">
                <strong style="font-size:12px; color:var(--navy); text-transform:uppercase;">Self-Assessment:</strong>
                <div class="assess-row">
                  <button class="assess-btn" id="btn-gotit" onclick="setSelfAssessment('gotit')">Got it! 👍</button>
                  <button class="assess-btn" id="btn-getting" onclick="setSelfAssessment('getting')">Almost 🧭</button>
                  <button class="assess-btn" id="btn-help" onclick="setSelfAssessment('help')">Help 🆘</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Subtle Slide Watermark -->
        <div class="slide-watermark">
          <span>Grade 6 Unit ${unit} · Lesson ${lessonId}</span>
          <span>STANDARD: ${esc(standard)}</span>
        </div>
        
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
      
      document.getElementById('hud-page-indicator').textContent = num + ' / ' + totalSlides;
      
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
    
    // Browser synthesized audio arpeggio chime for correct answers and click sounds
    let audioCtx = null;
    function playChimeSound() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const now = audioCtx.currentTime;
        
        // Note 1 (E5, 659.25Hz)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.12, now + 0.04);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
        
        // Note 2 (A5, 880Hz) with short delay
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, now + 0.1);
        gain2.gain.setValueAtTime(0, now + 0.1);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.5);
      } catch (e) {
        console.warn('Web Audio chime sound failed:', e);
      }
    }

    function playClickSound() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {}
    }

    // Toggle background graph grid overlay on sketch pads
    function toggleCanvasGrid(canvasId, btn) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      canvas.classList.toggle('canvas-grid-bg');
      if (btn) {
        btn.classList.toggle('active', canvas.classList.contains('canvas-grid-bg'));
      }
      saveWork();
    }

    // Concept tabs sequential reveal stepper
    let activeConceptStep = 0;
    
    function switchConceptTab(tabId) {
      const data = conceptData[tabId];
      if (!data) return;
      
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(tabId)) {
          btn.classList.add('active');
        } else if (onclickAttr && (onclickAttr.includes('ido') || onclickAttr.includes('wedo') || onclickAttr.includes('youdo'))) {
          btn.classList.remove('active');
        }
      });
      
      activeConceptTab = tabId;
      activeConceptStep = 0;
      renderConceptStep();
      saveWork();
    }
    
    function renderConceptStep() {
      const tabId = activeConceptTab;
      const data = conceptData[tabId];
      if (!data) return;
      
      const container = document.getElementById('concept-tab-content');
      if (!container) return;
      
      const totalSteps = data.lines.length;
      const stepIdx = Math.min(activeConceptStep, totalSteps - 1);
      
      let html = '<div class="concept-stepper-container" style="display:flex; flex-direction:column; justify-content:space-between; height:100%;">';
      
      // Header
      html += '  <div class="stepper-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px dashed var(--line); padding-bottom:6px;">';
      html += '    <h4 style="margin:0; color:var(--navy); font-size:13.5px; font-weight:800;">' + data.title + '</h4>';
      html += '    <span style="font-size:11px; font-weight:700; color:var(--gray); font-family:\\\'Outfit\\\';">Step ' + (stepIdx + 1) + ' of ' + totalSteps + '</span>';
      html += '  </div>';
      
      // Step Text card
      html += '  <div class="stepper-body" style="flex:1; display:flex; align-items:center; justify-content:center; padding:12px; background:var(--white); border-radius:6px; border:1px solid #e1eaeef8; box-shadow:0 2px 5px rgba(23,50,77,0.02); min-height:85px; margin-bottom:10px; position:relative;">';
      html += '    <p style="margin:0; font-size:13px; line-height:1.5; color:var(--navy); font-weight:700; text-align:center;">' + data.lines[stepIdx] + '</p>';
      html += '  </div>';
      
      // Dot Indicators & Controls
      html += '  <div class="stepper-controls" style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">';
      
      // Prev button
      const prevDisabled = stepIdx === 0;
      html += '    <button class="assess-btn" onclick="prevConceptStep()" ' + (prevDisabled ? \'disabled style="opacity:0.3; cursor:not-allowed;"\' : \'style="cursor:pointer;"\') + ' style="flex:none; width:auto; padding:3px 10px; font-size:11.5px; height:24px; border-radius:4px; font-weight:800; border-color:var(--gray); color:var(--navy);">◀ Back</button>';
      
      // Dot indicators
      html += '    <div style="display:flex; gap:5px; align-items:center;">';
      for (let i = 0; i < totalSteps; i++) {
        const dotColor = i === stepIdx ? \'var(--teal)\' : \'var(--gray)\';
        const dotSize = i === stepIdx ? \'7px\' : \'5px\';
        html += '      <div style="width:\\\'\' + dotSize + \'\\\'; height:\\\'\' + dotSize + \'\\\'; border-radius:50%; background:\\\'\' + dotColor + \'\\\'; transition:all 0.2s;"></div>';
      }
      html += '    </div>';
      
      // Next button
      const isLastStep = stepIdx === totalSteps - 1;
      const nextText = isLastStep ? \'Done ✓\' : \'Next Step ➔\';
      html += '    <button class="assess-btn" onclick="nextConceptStep()" style="flex:none; width:auto; padding:3px 10px; font-size:11.5px; height:24px; border-radius:4px; font-weight:800; border-color:var(--teal); background:var(--teal-light); color:var(--navy); cursor:pointer;">\' + nextText + \'</button>';
      
      html += '  </div>';
      html += '</div>';
      
      container.innerHTML = html;
    }
    
    function prevConceptStep() {
      if (activeConceptStep > 0) {
        activeConceptStep--;
        renderConceptStep();
        saveWork();
      }
    }
    
    function nextConceptStep() {
      const data = conceptData[activeConceptTab];
      if (!data) return;
      if (activeConceptStep < data.lines.length - 1) {
        activeConceptStep++;
        renderConceptStep();
      } else {
        // Switch to the next tab sequentially
        if (activeConceptTab === \'ido\') {
          switchConceptTab(\'wedo\');
        } else if (activeConceptTab === \'wedo\') {
          switchConceptTab(\'youdo\');
        }
      }
      saveWork();
    }

    function switchVocabTab(tabId) {
      const studyBtn = document.getElementById('btn-vocab-study');
      const matchBtn = document.getElementById('btn-vocab-match');
      if (studyBtn && matchBtn) {
        studyBtn.classList.toggle('active', tabId === 'study');
        matchBtn.classList.toggle('active', tabId === 'match');
      }
      
      const studyTab = document.getElementById('vocab-tab-study');
      const matchTab = document.getElementById('vocab-tab-match');
      if (studyTab) studyTab.style.display = tabId === 'study' ? 'block' : 'none';
      if (matchTab) matchTab.style.display = tabId === 'match' ? 'block' : 'none';
      
      if (tabId === 'study') {
        document.querySelectorAll('.vocab-card').forEach(card => card.classList.remove('flipped'));
      }
      saveWork();
    }
    
    function checkVocabMatch(idx) {
      const select = document.getElementById('vocab-select-' + idx);
      const feedback = document.getElementById('vocab-feedback-' + idx);
      if (!select || !feedback) return;
      
      const val = select.value.toLowerCase().trim();
      const correct = select.getAttribute('data-correct').toLowerCase().trim();
      
      if (val === "") {
        feedback.textContent = "";
        select.style.borderColor = "var(--gray)";
        select.style.background = "var(--bg)";
      } else if (val === correct) {
        feedback.textContent = "✓";
        feedback.style.color = "var(--teal)";
        select.style.borderColor = "var(--teal)";
        select.style.background = "var(--teal-light)";
      } else {
        feedback.textContent = "✕";
        feedback.style.color = "#D9795D";
        select.style.borderColor = "#D9795D";
        select.style.background = "var(--coral)";
      }
      
      updateVocabScore();
      saveWork();
    }
    
    function updateVocabScore() {
      const selects = document.querySelectorAll('.vocab-matcher-select');
      let score = 0;
      selects.forEach(select => {
        const val = select.value.toLowerCase().trim();
        const correct = select.getAttribute('data-correct').toLowerCase().trim();
        if (val === correct && val !== "") {
          score++;
        }
      });
      const scoreDiv = document.getElementById('vocab-matcher-score');
      if (scoreDiv) {
        scoreDiv.textContent = score + ' / ' + selects.length + ' Matched Correctly';
      }
    }

    // Slide 6 Explore Card Grid rendering & selection logic
    function initSortingGame() {
      renderExploreGrid();
    }
    
    function renderExploreGrid() {
      const grid = document.getElementById('explore-cards-grid');
      if (!grid) return;
      
      let html = "";
      exploreItems.forEach((item) => {
        const selectedCat = studentExploreSorted[item.id];
        
        let cardStyle = "border: 1px solid #dadce0; background: var(--white);";
        let badgeHtml = "";
        
        if (selectedCat !== undefined) {
          const isCorrect = (item.catId === "" || item.catId === selectedCat);
          if (isCorrect) {
            cardStyle = "border: 1.5px solid var(--teal); background: var(--teal-light);";
            badgeHtml = '<span style="color:var(--teal); font-weight:800; font-size:14px; position:absolute; right:8px; top:6px;">✓</span>';
          } else {
            cardStyle = "border: 1.5px solid #D9795D; background: var(--coral);";
            badgeHtml = '<span style="color:#D9795D; font-weight:800; font-size:14px; position:absolute; right:8px; top:6px;">✕</span>';
          }
        }
        
        html += '<div class="index-card-mini" style="' + cardStyle + ' position:relative; padding: 8px 24px 8px 12px; display:flex; flex-direction:column; justify-content:space-between; border-radius:6px; min-height:68px; box-shadow:0 2px 4px rgba(23,50,77,0.03);">';
        html += badgeHtml;
        html += '  <div style="font-weight:700; font-size:12.5px; color:var(--navy); line-height:1.25; margin-bottom:4px; text-align:left;">' + item.text + '</div>';
        
        // Pills container
        html += '  <div style="display:flex; gap:4px; margin-top:auto; flex-wrap:wrap;">';
        exploreCats.forEach((cat, cIdx) => {
          const isThisSelected = (selectedCat === cat.id);
          const activeColors = ['var(--teal)', '#D9795D', 'var(--amber)', 'var(--navy)'];
          const activeBgColors = ['var(--teal-light)', 'var(--coral)', '#FDF1B8', '#f1f3f4'];
          const activeColor = activeColors[cIdx % activeColors.length];
          const activeBgColor = activeBgColors[cIdx % activeBgColors.length];
          
          let pillStyle = "padding:2px 6px; font-size:9px; font-weight:800; border-radius:4px; border:1px solid #c2b598; background:#F1ECE0; color:var(--navy); cursor:pointer; transition:all 0.15s;";
          if (isThisSelected) {
            pillStyle = "padding:2px 6px; font-size:9px; font-weight:800; border-radius:4px; border:1.5px solid " + activeColor + "; background:" + activeBgColor + "; color:" + activeColor + "; cursor:pointer; transition:all 0.15s;";
          }
          
          html += '    <button style="' + pillStyle + '" onclick="selectExploreItemCategory(' + item.id + ', \\\'' + cat.id + '\\\')">' + cat.label + '</button>';
        });
        html += '  </div>';
        html += '</div>';
      });
      
      grid.innerHTML = html;
      updateExploreProgress();
    }
    
    function selectExploreItemCategory(itemId, catId) {
      studentExploreSorted[itemId] = catId;
      saveWork();
      renderExploreGrid();
    }
    
    function updateExploreProgress() {
      let correctCount = 0;
      exploreItems.forEach(item => {
        const sorted = studentExploreSorted[item.id];
        if (sorted !== undefined) {
          const isCorrect = (item.catId === "" || item.catId === sorted);
          if (isCorrect) correctCount++;
        }
      });
      
      const progressText = document.getElementById('explore-progress-text');
      if (progressText) {
        progressText.textContent = correctCount + ' / ' + exploreItems.length + ' Sorted Correctly';
      }
      
      const progressBar = document.getElementById('sorting-progress-bar');
      if (progressBar) {
        const pct = exploreItems.length > 0 ? (correctCount / exploreItems.length) * 100 : 0;
        progressBar.style.width = pct + '%';
      }
      
      if (correctCount === exploreItems.length && exploreItems.length > 0) {
        triggerConfettiCelebration();
        try { playChimeSound(); } catch (e) {}
      }
    }
    
    function triggerConfettiCelebration() {
      const container = document.getElementById('confetti-container');
      if (!container) return;
      
      container.innerHTML = "";
      container.style.display = "block";
      
      const colors = ['#1FA6A2', '#F2C15B', '#D9795D', '#17324D', '#ff6b6b', '#4dadf7'];
      for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
        container.appendChild(particle);
      }
      
      setTimeout(() => {
        container.style.display = "none";
        container.innerHTML = "";
      }, 5000);
    }
    
    function resetSortingGame() {
      exploreItems.forEach(item => {
        delete studentExploreSorted[item.id];
      });
      saveWork();
      renderExploreGrid();
    }
    
    // Toggles for Solve / Sketch panels (Slide 7, 8, 9)
    function switchPfixMode(mode) {
      const wBtn = document.getElementById('btn-pfix-write');
      const sBtn = document.getElementById('btn-pfix-sketch');
      if (wBtn && sBtn) {
        wBtn.classList.toggle('active', mode === 'write');
        sBtn.classList.toggle('active', mode === 'sketch');
      }
      const wPanel = document.getElementById('pfix-mode-write');
      const sPanel = document.getElementById('pfix-mode-sketch');
      if (wPanel) wPanel.style.display = mode === 'write' ? 'block' : 'none';
      if (sPanel) sPanel.style.display = mode === 'sketch' ? 'flex' : 'none';
      saveWork();
    }
    
    function switchPmcMode(mode) {
      const wBtn = document.getElementById('btn-pmc-write');
      const sBtn = document.getElementById('btn-pmc-sketch');
      if (wBtn && sBtn) {
        wBtn.classList.toggle('active', mode === 'write');
        sBtn.classList.toggle('active', mode === 'sketch');
      }
      const wPanel = document.getElementById('pmc-mode-write');
      const sPanel = document.getElementById('pmc-mode-sketch');
      if (wPanel) wPanel.style.display = mode === 'write' ? 'block' : 'none';
      if (sPanel) sPanel.style.display = mode === 'sketch' ? 'flex' : 'none';
      saveWork();
    }
    
    function switchPgenMode(mode) {
      const wBtn = document.getElementById('btn-pgen-write');
      const sBtn = document.getElementById('btn-pgen-sketch');
      if (wBtn && sBtn) {
        wBtn.classList.toggle('active', mode === 'write');
        sBtn.classList.toggle('active', mode === 'sketch');
      }
      const wPanel = document.getElementById('pgen-mode-write');
      const sPanel = document.getElementById('pgen-mode-sketch');
      if (wPanel) wPanel.style.display = mode === 'write' ? 'block' : 'none';
      if (sPanel) sPanel.style.display = mode === 'sketch' ? 'flex' : 'none';
      saveWork();
    }
    
    function switchRwMode(mode) {
      const wBtn = document.getElementById('btn-rw-write');
      const sBtn = document.getElementById('btn-rw-sketch');
      if (wBtn && sBtn) {
        wBtn.classList.toggle('active', mode === 'write');
        sBtn.classList.toggle('active', mode === 'sketch');
      }
      const wPanel = document.getElementById('rw-mode-write');
      const sPanel = document.getElementById('rw-mode-sketch');
      if (wPanel) wPanel.style.display = mode === 'write' ? 'block' : 'none';
      if (sPanel) sPanel.style.display = mode === 'sketch' ? 'flex' : 'none';
      saveWork();
    }
    
    function switchExitMode(mode) {
      const wBtn = document.getElementById('btn-exit-write');
      const sBtn = document.getElementById('btn-exit-sketch');
      if (wBtn && sBtn) {
        wBtn.classList.toggle('active', mode === 'write');
        sBtn.classList.toggle('active', mode === 'sketch');
      }
      const wPanel = document.getElementById('exit-mode-write');
      const sPanel = document.getElementById('exit-mode-sketch');
      if (wPanel) wPanel.style.display = mode === 'write' ? 'block' : 'none';
      if (sPanel) sPanel.style.display = mode === 'sketch' ? 'flex' : 'none';
      saveWork();
    }

    // Generic secondary canvases registry & helpers
    const canvases = {};

    function initCanvas(canvasId, containerId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      
      canvases[canvasId] = {
        canvas: canvas,
        ctx: ctx,
        drawing: false,
        mode: 'draw',
        color: '#17324D',
        size: 4,
        history: [],
        maxHistory: 15
      };
      
      function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      }
      
      function saveHistory() {
        const state = canvases[canvasId];
        if (state.history.length >= state.maxHistory) {
          state.history.shift();
        }
        state.history.push(canvas.toDataURL());
      }
      
      function startDrawing(e) {
        const state = canvases[canvasId];
        saveHistory();
        state.drawing = true;
        ctx.beginPath();
        const pos = getMousePos(e);
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
      }
      
      function draw(e) {
        const state = canvases[canvasId];
        if (!state.drawing) return;
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (state.mode === 'erase') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = state.size * 2.5;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = state.color;
          ctx.lineWidth = state.size;
        }
        
        ctx.stroke();
        e.preventDefault();
      }
      
      function stopDrawing() {
        const state = canvases[canvasId];
        if (state.drawing) {
          ctx.closePath();
          state.drawing = false;
          saveWork();
        }
      }
      
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDrawing);
      
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stopDrawing);
      
      canvases[canvasId].setTool = function(tool) {
        const state = canvases[canvasId];
        state.mode = tool;
        const toolbar = canvas.parentElement.nextElementSibling;
        if (toolbar) {
          const drawBtn = toolbar.querySelector('[id$="-draw"]');
          const eraseBtn = toolbar.querySelector('[id$="-erase"]');
          if (drawBtn && eraseBtn) {
            drawBtn.classList.toggle('active', tool === 'draw');
            eraseBtn.classList.toggle('active', tool === 'erase');
          }
        }
      };
      
      canvases[canvasId].undo = function() {
        const state = canvases[canvasId];
        if (state.history.length === 0) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const prevState = state.history.pop();
        if (state.history.length > 0) {
          const prevImg = new Image();
          prevImg.src = state.history[state.history.length - 1];
          prevImg.onload = () => {
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(prevImg, 0, 0);
            saveWork();
          };
        } else {
          saveWork();
        }
      };
      
      canvases[canvasId].clear = function() {
        saveHistory();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveWork();
      };
    }

    function setCanvasTool(canvasId, tool) {
      if (canvases[canvasId]) canvases[canvasId].setTool(tool);
    }
    function undoCanvas(canvasId) {
      if (canvases[canvasId]) canvases[canvasId].undo();
    }
    function clearCanvas(canvasId) {
      if (canvases[canvasId]) canvases[canvasId].clear();
    }
    
    // Practice slide checking & dynamic step highlighting
    function highlightWorkedStep(stepNum) {
      const line = document.getElementById('worked-step-' + stepNum);
      if (line) line.classList.add('highlighted');
    }
    
    function clearStepHighlight(stepNum) {
      const line = document.getElementById('worked-step-' + stepNum);
      if (line) line.classList.remove('highlighted');
    }
    
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
        feedback.textContent = 'Correct step identified! Click Reveal Solution to check reasoning. ✓';
        feedback.style.color = 'var(--teal)';
        try { playChimeSound(); } catch (e) {}
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = 'Incorrect step. Try again! ✕';
        feedback.style.color = '#D9795D';
        try { playClickSound(); } catch (e) {}
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
        btn.style.borderColor = '';
      });
      
      const btn = document.getElementById('btn-choice-' + selected);
      if (selected === correct) {
        btn.classList.add('correct');
        feedback.textContent = 'Correct! Great job. ✓';
        feedback.style.color = 'var(--teal)';
        try { playChimeSound(); } catch (e) {}
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = 'Incorrect. Review your calculation and try again. ✕';
        feedback.style.color = '#D9795D';
        const correctBtn = document.getElementById('btn-choice-' + correct);
        if (correctBtn) correctBtn.classList.add('correct');
        try { playClickSound(); } catch (e) {}
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
        try { playChimeSound(); } catch (e) {}
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = 'Response recorded. ✕';
        feedback.style.color = '#D9795D';
        const correctBtn = document.getElementById('btn-exit-' + correct);
        if (correctBtn) correctBtn.classList.add('correct');
        try { playClickSound(); } catch (e) {}
      }
      saveWork();
    }

    // Save/Restore student work
    const storageKey = 'neft_slides_work_${esc(lessonId)}';
    
    function saveWork() {
      const data = {};
      document.querySelectorAll('textarea, input[type="text"], select').forEach((input) => {
        const key = input.id || input.placeholder;
        if (key) data[key] = input.value;
      });
      
      const canvas = document.getElementById('math-canvas');
      if (canvas) {
        data.canvasData = canvas.toDataURL();
      }
      
      // Save all active canvas drawings
      data.canvases = {};
      const canvasIds = ['math-canvas', 'practice-fix-canvas', 'practice-mc-canvas', 'practice-gen-canvas', 'rw-canvas', 'exit-canvas'];
      canvasIds.forEach(id => {
        const c = document.getElementById(id);
        if (c) {
          data.canvases[id] = c.toDataURL();
        }
      });

      // Save all active grid background states
      data.grids = {};
      canvasIds.forEach(id => {
        const c = document.getElementById(id);
        if (c) {
          data.grids[id] = c.classList.contains('canvas-grid-bg');
        }
      });
      
      data.assessment = activeAssessment;
      
      data.activeConceptTab = activeConceptTab;
      data.activeConceptStep = activeConceptStep;
      data.currentExploreIdx = currentExploreIdx;
      data.studentExploreSorted = studentExploreSorted;
      data.studentErrStep = studentErrStep;
      data.solutionRevealed = solutionRevealed;
      data.studentPracticeMCIndex = studentPracticeMCIndex;
      data.studentExitChoiceIndex = studentExitChoiceIndex;
      
      data.pfixMode = document.getElementById('btn-pfix-sketch')?.classList.contains('active') ? 'sketch' : 'write';
      data.pmcMode = document.getElementById('btn-pmc-sketch')?.classList.contains('active') ? 'sketch' : 'write';
      data.pgenMode = document.getElementById('btn-pgen-sketch')?.classList.contains('active') ? 'sketch' : 'write';
      data.rwMode = document.getElementById('btn-rw-sketch')?.classList.contains('active') ? 'sketch' : 'write';
      data.exitMode = document.getElementById('btn-exit-sketch')?.classList.contains('active') ? 'sketch' : 'write';
      data.vocabTab = document.getElementById('btn-vocab-match')?.classList.contains('active') ? 'match' : 'study';
      
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
          document.querySelectorAll('textarea, input[type="text"], select').forEach((input) => {
            const key = input.id || input.placeholder;
            if (key) {
              const val = data[key];
              if (val !== undefined) {
                input.value = val;
                if (input.id && input.id.startsWith('vocab-select-')) {
                  const idx = parseInt(input.id.replace('vocab-select-', ''));
                  checkVocabMatch(idx);
                }
              }
            }
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
          
          // Restore all secondary canvases
          if (data.canvases) {
            Object.keys(data.canvases).forEach(id => {
              const canvas = document.getElementById(id);
              if (canvas && data.canvases[id]) {
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.src = data.canvases[id];
                img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                };
              }
            });
          }
          
          if (data.assessment) {
            setSelfAssessment(data.assessment);
          }
          
          // Restore all active grid background states
          if (data.grids) {
            Object.keys(data.grids).forEach(id => {
              const canvas = document.getElementById(id);
              if (canvas && data.grids[id]) {
                canvas.classList.add('canvas-grid-bg');
                const btn = document.querySelector('[onclick*="toggleCanvasGrid(\\\'' + id + '\\\'"]');
                if (btn) btn.classList.add('active');
              }
            });
          }

          if (data.activeConceptTab) {
            activeConceptTab = data.activeConceptTab;
          } else {
            activeConceptTab = 'ido';
          }
          
          if (data.activeConceptStep !== undefined) {
            activeConceptStep = data.activeConceptStep;
          } else {
            activeConceptStep = 0;
          }
          
          // Update concept tab buttons and render active step
          document.querySelectorAll('.tab-btn').forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(activeConceptTab)) {
              btn.classList.add('active');
            } else if (onclickAttr && (onclickAttr.includes('ido') || onclickAttr.includes('wedo') || onclickAttr.includes('youdo'))) {
              btn.classList.remove('active');
            }
          });
          renderConceptStep();
          
          if (data.currentExploreIdx !== undefined) {
            currentExploreIdx = data.currentExploreIdx;
          }
          if (data.studentExploreSorted) {
            Object.assign(studentExploreSorted, data.studentExploreSorted);
          }
          initSortingGame();
          
          if (data.pfixMode) switchPfixMode(data.pfixMode);
          if (data.pmcMode) switchPmcMode(data.pmcMode);
          if (data.pgenMode) switchPgenMode(data.pgenMode);
          if (data.rwMode) switchRwMode(data.rwMode);
          if (data.exitMode) switchExitMode(data.exitMode);
          if (data.vocabTab) switchVocabTab(data.vocabTab);
          
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
    
    document.querySelectorAll('textarea, input[type="text"], select').forEach(input => {
      input.addEventListener('input', saveWork);
      input.addEventListener('change', saveWork);
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
      
      // Paste Flash animation
      target.classList.remove('pasted-flash');
      void target.offsetWidth; // trigger reflow
      target.classList.add('pasted-flash');
    }
    
    // -----------------------------------------------------------------
    // HTML5 DRAWING CANVAS SYSTEM WITH UNDO STACK HISTORY
    // -----------------------------------------------------------------
    const canvas = document.getElementById('math-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    
    let drawing = false;
    let drawMode = 'draw';
    let drawColor = '#17324D';
    let drawSize = 4;
    
    const drawHistory = [];
    const maxHistory = 15;
    
    function saveHistory() {
      if (!canvas || !ctx) return;
      if (drawHistory.length >= maxHistory) {
        drawHistory.shift();
      }
      drawHistory.push(canvas.toDataURL());
    }
    
    function undoLast() {
      if (!canvas || !ctx || drawHistory.length === 0) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const prevState = drawHistory.pop();
      
      if (drawHistory.length > 0) {
        const prevImg = new Image();
        prevImg.src = drawHistory[drawHistory.length - 1];
        prevImg.onload = () => {
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(prevImg, 0, 0);
          saveWork();
        };
      } else {
        saveWork();
      }
    }
    
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
      saveHistory(); // Save state before starting stroke
      drawing = true;
      ctx.beginPath();
      const pos = getMousePos(e);
      ctx.moveTo(pos.x, pos.y);
      e.preventDefault();
    }
    
    function hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    function draw(e) {
      if (!drawing || !ctx) return;
      const pos = getMousePos(e);
      
      ctx.lineTo(pos.x, pos.y);
      ctx.lineCap = drawMode === 'highlight' ? 'square' : 'round';
      ctx.lineJoin = 'round';
      
      if (drawMode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = drawSize * 2.5;
      } else if (drawMode === 'highlight') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = hexToRgba(drawColor, 0.45);
        ctx.lineWidth = drawSize * 3.5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawSize;
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
      const hBtn = document.getElementById('btn-highlighter');
      const eBtn = document.getElementById('btn-erase');
      if (dBtn && eBtn) {
        dBtn.classList.toggle('active', mode === 'draw');
        if (hBtn) hBtn.classList.toggle('active', mode === 'highlight');
        eBtn.classList.toggle('active', mode === 'erase');
      }
      
      const container = document.getElementById('math-visual-container-element');
      const canvasEl = document.getElementById('math-canvas');
      if (container && canvasEl) {
        container.classList.remove('tool-draw', 'tool-highlight', 'tool-erase');
        canvasEl.classList.remove('cursor-draw', 'cursor-highlight', 'cursor-erase');
        
        if (mode === 'draw') {
          container.classList.add('tool-draw');
          canvasEl.classList.add('cursor-draw');
        } else if (mode === 'highlight') {
          container.classList.add('tool-highlight');
          canvasEl.classList.add('cursor-highlight');
        } else if (mode === 'erase') {
          container.classList.add('tool-erase');
          canvasEl.classList.add('cursor-erase');
        }
      }
    }
    
    function setDrawingColor(color, el) {
      drawColor = color;
      if (drawMode !== 'highlight') {
        setDrawingTool('draw');
      }
      document.querySelectorAll('.color-picker-dot').forEach(dot => dot.classList.remove('active'));
      if (el) el.classList.add('active');
    }
    
    function setDrawingSize(size, el) {
      drawSize = Number(size);
      document.querySelectorAll('.size-picker-dot').forEach(dot => dot.classList.remove('active'));
      if (el) el.classList.add('active');
    }
    
    function clearDrawingCanvas() {
      if (ctx && canvas) {
        saveHistory();
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
      initCanvas('practice-fix-canvas', 'pfix-mode-sketch');
      initCanvas('practice-mc-canvas', 'pmc-mode-sketch');
      initCanvas('practice-gen-canvas', 'pgen-mode-sketch');
      initCanvas('rw-canvas', 'rw-mode-sketch');
      initCanvas('exit-canvas', 'exit-mode-sketch');
      loadWork();
      resizeSlides();
      
      // Tactile click sounds for premium experience
      document.addEventListener('click', function(e) {
        if (e.target.closest('.tab-btn') || e.target.closest('.color-picker-dot') || e.target.closest('.size-picker-dot') || e.target.closest('.tool-btn-clear') || e.target.closest('.assess-btn') || e.target.closest('.vocab-card')) {
          try { playClickSound(); } catch(err) {}
        }
      });
    });
    
  </script>

</body>
</html>
`;
}

// Main execution block
function main() {
  console.log('Generating high-fidelity slides.html files...');
  const lessons = fs.readdirSync(lessonsDir)
    .filter(d => /^(\d+)-(\d+)(-flagship)?$/.test(d))
    .filter(d => fs.existsSync(path.join(lessonsDir, d, 'config.json')));
    
  let count = 0;
  lessons.forEach(id => {
    try {
      const configPath = path.join(lessonsDir, id, 'config.json');
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const html = generateSlidesHtml(id, data);
      
      const outputPath = path.join(lessonsDir, id, 'slides.html');
      fs.writeFileSync(outputPath, html, 'utf8');
      count++;
    } catch (e) {
      console.error(`Failed to generate slides for lesson ${id}:`, e);
    }
  });
  
  console.log(`Successfully generated premium slides.html for ${count} lessons.`);
}

main();
