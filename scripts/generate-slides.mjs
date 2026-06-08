import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildTptSlideDeckV3 } from './lib/tpt-slide-deck-v3.mjs';
import { getUnitPalette, paletteToCssVars } from './lib/slide-theme-palettes.mjs';
import { REFERENCE_CSS, tokensToCssVars } from './lib/slide-reference-theme.mjs';

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

function generateInteractiveWidgetHtml(lessonId, standard) {
  const std = (standard || '').toUpperCase();
  const isRatio = std.includes('6.RP.1') || std.includes('6.RP.2') || std.includes('6.RP.3');
  const isCoord = std.includes('6.NS.6') || std.includes('6.NS.8');
  const isBalance = std.includes('6.EE.5') || std.includes('6.EE.7');
  
  if (isRatio) {
    return `
      <div class="interactive-widget-container" style="position:relative; width:440px; height:240px; background:white; border-radius:8px; overflow:hidden; font-family:'Outfit',sans-serif; user-select:none;">
        <div style="position:absolute; top:8px; left:0; width:100%; display:flex; justify-content:center; gap:6px; z-index:10;">
          <span style="font-size:10px; font-weight:700; color:var(--navy); align-self:center; margin-right:4px;">SCALE FACTOR:</span>
          <button class="assess-btn px-btn active" id="btn-scale-1" onclick="adjustRatioScale(1)" style="padding:2px 8px; font-size:10px; height:20px; width:auto; font-weight:bold; border-radius:4px; cursor:pointer; background:white;">1x</button>
          <button class="assess-btn px-btn" id="btn-scale-2" onclick="adjustRatioScale(2)" style="padding:2px 8px; font-size:10px; height:20px; width:auto; font-weight:bold; border-radius:4px; cursor:pointer; background:white;">2x</button>
          <button class="assess-btn px-btn" id="btn-scale-3" onclick="adjustRatioScale(3)" style="padding:2px 8px; font-size:10px; height:20px; width:auto; font-weight:bold; border-radius:4px; cursor:pointer; background:white;">3x</button>
          <button class="assess-btn px-btn" id="btn-scale-4" onclick="adjustRatioScale(4)" style="padding:2px 8px; font-size:10px; height:20px; width:auto; font-weight:bold; border-radius:4px; cursor:pointer; background:white;">4x</button>
          <button class="assess-btn px-btn" id="btn-scale-5" onclick="adjustRatioScale(5)" style="padding:2px 8px; font-size:10px; height:20px; width:auto; font-weight:bold; border-radius:4px; cursor:pointer; background:white;">5x</button>
        </div>
        <svg id="ratio-widget-svg" width="440" height="240" style="background:white; border-radius:8px; display:block;">
          <g id="ratio-dynamic-content"></g>
        </svg>
      </div>
    `;
  }
  
  if (isCoord) {
    return `
      <div class="interactive-widget-container" style="position:relative; width:440px; height:240px; background:white; border-radius:8px; overflow:hidden; font-family:'Outfit',sans-serif; user-select:none;">
        <svg id="coord-plane-svg" width="220" height="220" style="position:absolute; top:10px; left:10px; background:white; border:1px solid #ddd; border-radius:4px; cursor:crosshair;" onclick="handleCoordinatePlaneClick(event)">
          <g id="coord-dynamic-content"></g>
        </svg>
        <div style="position:absolute; top:10px; left:240px; width:190px; height:220px; display:flex; flex-direction:column; justify-content:space-between; font-family:'Outfit',sans-serif;">
          <div>
            <div style="font-size:10px; font-weight:700; color:var(--navy); margin-bottom:4px;">SELECT MARKER:</div>
            <div style="display:flex; gap:4px; margin-bottom:8px;">
              <button class="assess-btn px-btn active" id="btn-marker-dot" onclick="setCoordinateMarker('🔴', this)" style="padding:2px 6px; font-size:10px; height:22px; width:auto; border-radius:4px; cursor:pointer; background:white;">🔴 Dot</button>
              <button class="assess-btn px-btn" id="btn-marker-star" onclick="setCoordinateMarker('⭐', this)" style="padding:2px 6px; font-size:10px; height:22px; width:auto; border-radius:4px; cursor:pointer; background:white;">⭐ Star</button>
              <button class="assess-btn px-btn" id="btn-marker-cross" onclick="setCoordinateMarker('❌', this)" style="padding:2px 6px; font-size:10px; height:22px; width:auto; border-radius:4px; cursor:pointer; background:white;">❌ Cross</button>
            </div>
            <div style="font-size:10px; font-weight:700; color:var(--navy); margin-bottom:4px;">COORDINATE LOG:</div>
            <div id="coord-points-log" style="font-size:10px; line-height:1.3; color:var(--body-text); background:#f5f7f8; border-radius:4px; padding:4px 6px; height:105px; overflow-y:auto; border:1px solid #e1eaef; box-sizing:border-box;">
              <span style="color:var(--gray); font-style:italic;">Click on coordinate plane to plot custom markers...</span>
            </div>
          </div>
          <button class="assess-btn" onclick="clearCoordinatePoints()" style="width:100%; height:24px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; background:transparent; border:1px solid var(--gray); color:var(--gray);">🔄 Clear Points</button>
        </div>
      </div>
    `;
  }
  
  if (isBalance) {
    return `
      <div class="interactive-widget-container" style="position:relative; width:440px; height:240px; background:white; border-radius:8px; overflow:hidden; font-family:'Outfit',sans-serif; user-select:none;">
        <svg id="balance-scale-svg" width="440" height="240" style="background:white; border-radius:8px; display:block;">
          <g id="balance-dynamic-content"></g>
        </svg>
        
        <!-- Left Pan Controls -->
        <div style="position:absolute; bottom:8px; left:8px; display:flex; flex-direction:column; gap:4px; z-index:10; background:rgba(255,255,255,0.85); padding:4px; border-radius:6px; border:1px solid #ddd;">
          <div style="font-size:8px; font-weight:bold; text-align:center; color:var(--navy);">LEFT PAN</div>
          <div style="display:flex; gap:3px;">
            <button class="assess-btn px-btn" onclick="adjustBalanceLeft('x', 1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">+x</button>
            <button class="assess-btn px-btn" onclick="adjustBalanceLeft('x', -1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">-x</button>
          </div>
          <div style="display:flex; gap:3px;">
            <button class="assess-btn px-btn" onclick="adjustBalanceLeft('one', 1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">+1</button>
            <button class="assess-btn px-btn" onclick="adjustBalanceLeft('one', -1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">-1</button>
          </div>
        </div>
        
        <!-- Right Pan Controls -->
        <div style="position:absolute; bottom:8px; right:8px; display:flex; flex-direction:column; gap:4px; z-index:10; background:rgba(255,255,255,0.85); padding:4px; border-radius:6px; border:1px solid #ddd;">
          <div style="font-size:8px; font-weight:bold; text-align:center; color:var(--navy);">RIGHT PAN</div>
          <div style="display:flex; gap:3px;">
            <button class="assess-btn px-btn" onclick="adjustBalanceRight('x', 1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">+x</button>
            <button class="assess-btn px-btn" onclick="adjustBalanceRight('x', -1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">-x</button>
          </div>
          <div style="display:flex; gap:3px;">
            <button class="assess-btn px-btn" onclick="adjustBalanceRight('one', 1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">+1</button>
            <button class="assess-btn px-btn" onclick="adjustBalanceRight('one', -1)" style="padding:0 4px; font-size:9.5px; height:18px; width:30px; font-weight:bold; cursor:pointer; background:white;">-1</button>
          </div>
        </div>
      </div>
    `;
  }
  
  return null;
}

// Generate the self-contained slides HTML
function generateSlidesHtml(lessonId, data, googleSlidesUrl) {
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
      exampleStepsHtml += `<div class="worked-step" id="worked-step-${idx + 1}" style="font-size:11px; padding:6px 12px; border-bottom: 1px solid #e1eaeef8; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; color:var(--navy);">${esc(step.label)}:</span>
        <span style="font-family:monospace; background:var(--google-gray); padding:2px 6px; border-radius:3px; font-weight:700;">${esc(step.work)}</span>
      </div>`;
    });
    
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%; position:relative;">
          <div>
            <div class="slide-badge-row" style="display:flex; align-items:center; margin-bottom:8px;">
              <span class="slide-badge" style="background:var(--amber); color:var(--navy); font-weight:800; font-size:10px; padding:3px 8px; border-radius:99px; font-family:'Outfit'; text-transform:uppercase; letter-spacing:0.05em; display:inline-flex; align-items:center; gap:4px;">⚠️ ERROR ANALYSIS</span>
            </div>
            <h2 class="card-title" style="font-size:16px; margin: 4px 0 6px;">${esc(pTitle)}</h2>
            <p class="card-desc" style="font-size:11.5px; margin-bottom:8px; line-height:1.4;">Analyze the worked steps on the clipboard. Hover over a step button below to highlight its line, select the incorrect step, and justify your fix.</p>
            
            <!-- Clipboard Frame with Wood kraft backboard and paper sheet sheet inside -->
            <div class="clipboard">
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
            <strong style="font-size:10px; color:var(--navy); text-transform:uppercase;">Identify Error Step:</strong>
            <div style="display:flex; gap:6px;">
              ${workedExample.map((s, idx) => `<button class="assess-btn px-btn" id="btn-errstep-${idx + 1}" onmouseover="highlightWorkedStep(${idx + 1})" onmouseout="clearStepHighlight(${idx + 1})" onclick="checkErrorStep(${idx + 1}, ${errorStep})">${idx + 1}</button>`).join('')}
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
          <div id="practice-solution-box" style="display:none; background:var(--white); border:1px solid #D9795D; border-radius:6px; padding:6px 10px; font-size:10px; line-height:1.4; color:var(--body-text); margin-top:6px; box-shadow:var(--shadow);">
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
      choicesHtml += `<button class="assess-btn mc-btn" id="btn-choice-${idx}" onclick="checkMCQuestion(${idx}, ${correctIndex})" style="text-align:left; padding:8px 12px; font-size:12px; margin-bottom:6px; display:flex; align-items:center; width:100%; font-weight:600; line-height:1.4; gap:10px;">
        <span style="background:var(--google-gray); color:var(--navy); width:20px; height:20px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px;">${String.fromCharCode(65 + idx)}</span>
        <span style="flex:1;">${esc(choice)}</span>
      </button>`;
    });
    
    practiceHtml = `
      <div class="slide-grid-2">
        <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
          <div>
            <div class="slide-badge-row" style="display:flex; align-items:center; margin-bottom:8px;">
              <span class="slide-badge" style="background:var(--teal); color:var(--white); font-weight:800; font-size:10px; padding:3px 8px; border-radius:99px; font-family:'Outfit'; text-transform:uppercase; letter-spacing:0.05em; display:inline-flex; align-items:center; gap:4px;">📝 PRACTICE CHALLENGE</span>
            </div>
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
      exitChoicesHtml += `<button class="assess-btn exit-btn" id="btn-exit-${idx}" onclick="checkExitTicket(${idx}, ${exitCorrectIndex})" style="text-align:left; padding:6px 10px; font-size:11px; margin-bottom:4px; display:flex; align-items:center; width:100%; font-weight:600; line-height:1.3; gap:8px;">
        <span style="background:var(--google-gray); color:var(--navy); width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:9px;">${String.fromCharCode(65 + idx)}</span>
        <span style="flex:1;">${esc(choice)}</span>
      </button>`;
    });
    exitTicketHtml = `
      <div style="margin-top:2px;">
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
        <p style="font-size:12px; margin-bottom:6px; line-height:1.4; font-weight:700; color:var(--navy);">${esc(exitStem)}</p>
        <textarea id="exit-ticket-text-work" class="slide-input-placeholder" rows="4" placeholder="Type your final answer and explanation here..."></textarea>
      </div>
    `;
  }

  const svgVisual = generateMathVisualSvg(lessonId, data);
  const interactiveWidget = generateInteractiveWidgetHtml(lessonId, standard);

  const drawingToolbarHtml = `
              <div>
                <p class="card-desc" style="font-size:12px; line-height:1.4; margin:0;">Use the drawing tray below to annotate the visual model. Teacher: say &quot;Click to reveal&quot; on key steps.</p>
              </div>
              <div class="drawing-toolbar">
                <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">
                  <button class="assess-btn px-btn" id="btn-interact" onclick="setDrawingTool('interact')" title="Interact Mode" style="width:26px; height:26px; font-size:11px;">👆</button>
                  <button class="assess-btn px-btn active" id="btn-draw" onclick="setDrawingTool('draw')" title="Pen" style="width:26px; height:26px; font-size:11px;">✏️</button>
                  <button class="assess-btn px-btn" id="btn-highlight" onclick="setDrawingTool('highlight')" title="Highlighter" style="width:26px; height:26px; font-size:11px;">🖍️</button>
                  <button class="assess-btn px-btn" id="btn-erase" onclick="setDrawingTool('erase')" title="Eraser" style="width:26px; height:26px; font-size:11px;">🧽</button>
                </div>
                <div style="display:flex; gap:5px; align-items:center; margin-top:4px;">
                  <div class="color-picker-dot active" style="background:#17324D;" onclick="setDrawingColor('#17324D', this)"></div>
                  <div class="color-picker-dot" style="background:#1FA6A2;" onclick="setDrawingColor('#1FA6A2', this)"></div>
                  <div class="color-picker-dot" style="background:#F2C15B;" onclick="setDrawingColor('#F2C15B', this)"></div>
                  <button class="tool-btn-clear" onclick="clearDrawingCanvas()" style="height:26px; margin-left:auto;">Clear</button>
                </div>
              </div>`;

  const exploreHtml = `
    ${''}
    <div class="slide-badge-row">
      <span class="slide-badge" style="background:var(--theme-color); color:var(--white);">${themeEmoji} ${esc(themeName)}</span>
    </div>
    <h3 class="slide-main-title" style="font-family:'Outfit'; font-size:24px; color:var(--navy); font-weight:800; margin: 8px 0 12px;">Explore Activity</h3>
    <div class="slide-grid-2">
      <div class="slide-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
        <div>
          <div class="sorting-progress-container"><div id="sorting-progress-bar" class="sorting-progress-bar"></div></div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <p class="card-desc" style="font-size:12px; margin:0;" id="explore-instructions">${esc(exploreInstructions)}</p>
            <button class="assess-btn" onclick="resetSortingGame()" style="font-size:9.5px; padding:2px 6px;">🔄 Reset</button>
          </div>
          <div id="sorting-game-container" style="background:var(--google-gray); padding:8px; border-radius:8px; border:1px solid #dadce0; min-height:100px;">
            <div id="confetti-container" class="confetti-overlay" style="display:none;"></div>
            <div id="sorting-card" class="index-card" style="width:95%; min-height:55px; margin:0 auto 6px;"></div>
            <div id="sorting-buttons" style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;"></div>
            <div id="sorting-feedback" style="font-size:10px; font-weight:700; min-height:12px;"></div>
          </div>
          <div id="sorting-pockets-log" style="display:flex; gap:8px; margin-top:8px; height:105px;"></div>
        </div>
        <div style="margin-top:4px;">${exploreVocabBankHtml}</div>
      </div>
      <div class="slide-card" style="background:var(--teal-light);">
        <h2 class="card-title">✍️ Explore Discourse</h2>
        <p style="font-size:11px; font-weight:600;">${esc(discoursePrompt)}</p>
        ${discourseFrame ? `<div style="font-size:9.5px; font-style:italic; margin-bottom:6px;">${esc(discourseFrame)}</div>` : ''}
        <textarea id="explore-discourse-work" class="slide-input-placeholder" rows="3" placeholder="Type your discourse explanation here..."></textarea>
      </div>
    </div>`;

  const exitOpenStem = data.reflect?.exitTicketOpen
    || data.reflect?.openPrompt
    || `Explain the key idea from today's lesson in your own words. Use at least one vocabulary word from: ${(vocabList.slice(0, 3).map((v) => v.term).filter(Boolean)).join(', ') || 'today\'s lesson'}.`;

  const unitPalette = getUnitPalette(unit);
  const deck = buildTptSlideDeckV3({
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
    vocabList,
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
    timeEstimate: data.timeEstimate,
  });

  // This HTML deck IS the primary "Google Slides" experience for students. Do not
  // surface a link out to the legacy Drive copy from inside the deck — it sends
  // teachers/students to an old, un-upgraded presentation and hides these slides.
  const googleSlidesLinkHtml = '';
  
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
    :root {${tokensToCssVars(unitPalette, getThemeColor(data.theme))}
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
    
    /* Slide Canvas: reference sand background */
    .slide-canvas {
      width: 960px;
      height: 540px;
      background-color: var(--ref-sand, #E8E4D8);
      border: 1px solid #dadce0;
      box-shadow: 0 10px 30px rgba(28, 46, 66, 0.15);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      padding: 0;
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
      font-size: 9px;
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
    .vocab-card-front h3 { margin: 0; font-size: 13.5px; font-weight: 800; letter-spacing: 0.05em; }
    .vocab-card-back {
      background: var(--teal-light);
      border: 1.5px solid var(--teal);
      color: var(--body-text);
      transform: rotateY(180deg);
      font-size: 11px;
      line-height: 1.4;
    }
    .click-hint { font-size: 9px; color: var(--gray); margin-top: 4px; font-weight: 600; }
    
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
      font-size: 11px;
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
      line-height: 22px !important;
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
    
    /* Drawing Wooden Pencil Tray Toolbar */
    .drawing-toolbar {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 10px;
      background: linear-gradient(180deg, #e6dfcf 0%, #d8cdb4 100%);
      border: 1px solid #c2b598;
      border-bottom: 3px solid #ab9d7f;
      box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
      padding: 8px 12px;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
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
      font-size: 12.5px;
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
      font-size: 14px;
      line-height: 22px !important;
      color: var(--navy);
      text-align: left;
      box-shadow: 0 8px 16px rgba(23,50,77,0.08);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
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
      font-size: 11px;
      font-weight: 800;
      color: var(--navy);
      margin-bottom: 6px;
    }
    .sticky-note input[type="text"] {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px dashed rgba(23,50,77,0.25);
      font-size: 11px;
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
    .presenter-hud.visible { display: flex; }
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
      font-size: 11.5px;
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
    
    .math-visual-container.tool-interact {
      border-color: var(--teal);
      box-shadow: 0 0 8px rgba(31, 166, 162, 0.25);
    }
    .math-visual-container.tool-line,
    .math-visual-container.tool-rect,
    .math-visual-container.tool-circle,
    .math-visual-container.tool-stamp {
      border-color: var(--navy);
      box-shadow: 0 0 8px rgba(23, 50, 77, 0.25);
    }
    
    .canvas-overlay.cursor-draw { cursor: crosshair; }
    .canvas-overlay.cursor-highlight { cursor: cell; }
    .canvas-overlay.cursor-erase { cursor: alias; }
    .canvas-overlay.cursor-line { cursor: crosshair; }
    .canvas-overlay.cursor-rect { cursor: crosshair; }
    .canvas-overlay.cursor-circle { cursor: crosshair; }
    .canvas-overlay.cursor-stamp { cursor: copy; }
    .canvas-overlay.cursor-interact { cursor: default; }

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

    /* ── V2 Premium Slide Engine ── */
    .lesson-progress-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: rgba(23,50,77,0.08);
      z-index: 20;
    }
    .lesson-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--teal), var(--theme-color));
      transition: width 0.35s ease;
      border-radius: 0 2px 2px 0;
    }
    .learning-target-bar {
      display: flex; align-items: center; gap: 8px;
      background: var(--teal-light);
      border-left: 4px solid var(--teal);
      padding: 6px 12px;
      margin-bottom: 8px;
      border-radius: 0 6px 6px 0;
      font-size: 10.5px; font-weight: 700; color: var(--navy);
    }
    .lt-icon { font-size: 14px; flex-shrink: 0; }
    .teacher-cue {
      display: flex; align-items: flex-start; gap: 6px;
      background: #eef6ff; border: 1px solid #c2d9f2;
      border-radius: 6px; padding: 6px 10px;
      margin-bottom: 6px; font-size: 10.5px; line-height: 1.4;
    }
    .teacher-cue-icon { flex-shrink: 0; }
    .teacher-cue-label { font-weight: 800; color: var(--navy); white-space: nowrap; }
    .teacher-cue-text { color: var(--body-text); }
    .slide-main-title {
      font-family: 'Outfit', sans-serif; font-size: 26px;
      color: var(--navy); font-weight: 800; margin: 8px 0 12px;
      letter-spacing: -0.02em; line-height: 1.2;
    }
    .title-slide { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; padding:20px; }
    .title-emoji { font-size:52px; margin-bottom:12px; }
    .title-heading { font-family:'Outfit'; font-size:34px; color:var(--navy); margin:0 0 8px; font-weight:800; }
    .title-meta { font-size:14px; color:var(--gray); font-weight:700; margin:0 0 16px; }
    .title-theme-badge { font-size:12px; padding:6px 14px; }
    .title-time { font-size:12px; color:var(--gray); margin-top:12px; }
    .how-to-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .how-to-item { background:var(--teal-light); border-radius:8px; padding:10px; font-size:10.5px; }
    .how-to-item span { font-size:18px; display:block; margin-bottom:4px; }
    .how-to-item strong { display:block; margin-bottom:2px; color:var(--navy); }
    .how-to-item p { margin:0; color:var(--body-text); line-height:1.3; }
    .agenda-timeline { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-top:8px; }
    .agenda-step { background:var(--teal-light); padding:8px 12px; border-radius:8px; text-align:center; min-width:80px; }
    .agenda-step-active { background:var(--teal); color:white; }
    .agenda-num { display:block; font-size:9px; font-weight:800; opacity:0.7; }
    .agenda-name { display:block; font-size:11px; font-weight:800; }
    .agenda-min { display:block; font-size:9px; opacity:0.7; }
    .section-divider { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; }
    .section-divider-emoji { font-size:40px; margin-bottom:8px; }
    .section-divider-title { font-family:'Outfit'; font-size:28px; color:var(--navy); font-weight:800; margin:0; }
    .section-divider-time { font-size:13px; color:var(--gray); font-weight:700; margin:8px 0; }
    .section-divider-bar { width:120px; height:4px; background:linear-gradient(90deg,var(--teal),var(--theme-color)); border-radius:99px; }
    .reveal-step { margin-bottom:8px; }
    .reveal-btn {
      display:flex; align-items:center; gap:8px; width:100%;
      padding:10px 14px; border:2px dashed var(--teal); border-radius:8px;
      background:var(--white); cursor:pointer; font-size:11px; font-weight:700;
      color:var(--navy); transition:all 0.2s;
    }
    .reveal-btn:hover { background:var(--teal-light); }
    .reveal-num { background:var(--teal); color:white; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; }
    .reveal-content { margin-top:6px; padding:10px 14px; background:var(--teal-light); border-radius:8px; border-left:4px solid var(--teal); }
    .reveal-content.hidden { display:none; }
    .reveal-line { font-size:12px; line-height:1.5; font-weight:600; }
    .vocab-rich-card { display:grid; grid-template-columns:200px 1fr; gap:16px; align-items:start; }
    .vocab-rich-visual { border-radius:10px; overflow:hidden; }
    .vocab-term { font-family:'Outfit'; font-size:22px; color:var(--navy); margin:0 0 4px; font-weight:800; }
    .vocab-definition { font-size:13px; font-weight:600; line-height:1.4; margin:0 0 8px; }
    .vocab-example-box { background:var(--amber); background:color-mix(in srgb, var(--amber) 30%, white); padding:8px 10px; border-radius:6px; font-size:11px; margin-bottom:8px; }
    .vocab-use-context { font-size:11px; }
    .vocab-context-input { margin-top:6px; }
    .turn-talk-timer { display:flex; align-items:center; gap:10px; margin-top:10px; }
    .tt-countdown { font-family:monospace; font-size:18px; font-weight:800; color:var(--navy); }
    .tt-countdown.running { color:var(--teal); animation:pulse 1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .drag-pool { display:flex; flex-wrap:wrap; gap:6px; padding:10px; background:var(--google-gray); border-radius:8px; min-height:50px; margin-bottom:10px; }
    .drag-item {
      display:inline-flex; align-items:center; gap:4px;
      padding:6px 10px; background:white; border:1.5px solid var(--teal);
      border-radius:6px; font-size:10.5px; font-weight:700; cursor:grab;
      user-select:none; touch-action:none;
    }
    .drag-item.dragging { opacity:0.5; cursor:grabbing; }
    .drag-zones { display:flex; gap:8px; flex-wrap:wrap; }
    .drag-drop-zone {
      flex:1; min-width:120px; min-height:80px;
      border:2px dashed var(--gray); border-radius:8px; padding:6px;
      background:rgba(255,255,255,0.6);
    }
    .drag-drop-zone.drag-over { border-color:var(--teal); background:var(--teal-light); }
    .drag-zone-label { font-size:9px; font-weight:800; text-transform:uppercase; color:var(--navy); margin-bottom:4px; text-align:center; }
    .drag-zone-items { display:flex; flex-wrap:wrap; gap:4px; min-height:40px; }
    .cfu-card { text-align:center; }
    .cfu-poll { display:flex; gap:8px; justify-content:center; margin:12px 0; }
    .cfu-btn { flex:none; min-width:100px; }
    .diff-paths-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
    .diff-path { border:2px solid var(--path-color, var(--teal)); border-radius:8px; padding:10px; }
    .diff-path-label { font-size:11px; font-weight:800; color:var(--navy); margin-bottom:6px; }
    .diff-path-stem { font-size:10px; line-height:1.4; margin:0; }
    .workspace-table { width:100%; border-collapse:collapse; font-size:11px; }
    .workspace-table th, .workspace-table td { border:1px solid #dadce0; padding:6px 8px; text-align:center; }
    .workspace-table th { background:var(--teal-light); font-weight:800; }
    .workspace-cell { width:60px; text-align:center; border:1px solid var(--teal); border-radius:4px; padding:4px; font-weight:700; }
    .workspace-cell.correct { background:var(--teal-light); border-color:var(--teal); }
    .workspace-cell.incorrect { background:var(--coral); border-color:#D9795D; }
    .sketch-canvas { width:100%; border:1.5px solid var(--gray); border-radius:8px; background:white; cursor:crosshair; }
    .mc-letter { background:var(--google-gray); color:var(--navy); width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; flex-shrink:0; }
    .mc-btn { text-align:left; padding:8px 12px; font-size:12px; margin-bottom:6px; display:flex; align-items:center; width:100%; font-weight:600; line-height:1.4; gap:10px; }
    .mc-btn.correct { animation:mcCorrect 0.4s ease; }
    @keyframes mcCorrect { 0%{transform:scale(1)} 50%{transform:scale(1.03)} 100%{transform:scale(1)} }
    .key-idea-box { background:var(--teal-light); border:2px solid var(--teal); border-radius:8px; padding:12px; margin-top:12px; }
    .key-idea-box p { margin:4px 0 0; font-weight:700; font-size:13px; }
    .badge-teal { background:var(--teal); color:white; font-size:10px; padding:3px 8px; border-radius:99px; font-weight:800; }
    .badge-amber { background:var(--amber); color:var(--navy); font-size:10px; padding:3px 8px; border-radius:99px; font-weight:800; }
    .card-teal-light { background:var(--teal-light); }
    .card-coral { background:var(--coral); }
    .activity-cta-slide { text-align:center; padding:24px; }
    .activity-cta-icon { font-size:42px; margin-bottom:10px; }
    .activity-cta-heading { font-family:'Outfit'; font-size:20px; color:var(--navy); margin:0 0 10px; }
    .activity-cta-buttons { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px; }
    .activity-cta-btn-secondary { background:var(--white)!important; color:var(--navy)!important; border:2px solid var(--teal)!important; text-decoration:none; }
    .presenter-notes-panel {
      display:none; position:fixed; right:0; top:64px; bottom:0; width:320px;
      background:rgba(255,255,255,0.97); border-left:1px solid #dadce0;
      padding:16px; overflow-y:auto; z-index:9999; box-shadow:-4px 0 20px rgba(0,0,0,0.1);
      font-size:11.5px; line-height:1.5;
    }
    .presenter-notes-panel.open { display:block; }
    .presenter-notes-panel h3 { font-family:'Outfit'; font-size:14px; color:var(--navy); margin:0 0 10px; }
    .notes-toolbar-btn {
      background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3);
      color:white; padding:4px 10px; border-radius:99px; font-size:11px;
      cursor:pointer; font-weight:700;
    }
    .slide-body { animation: slideFadeIn 0.25s ease; }
    @keyframes slideFadeIn { from{opacity:0.7} to{opacity:1} }

    /* ── V3 Reference-Quality Enhancements ── */
    .title-slide-v3 { background: linear-gradient(160deg, var(--bg-warm) 0%, var(--bg) 60%, var(--teal-light) 100%); border-radius:12px; padding:24px; }
    .title-session-badge { font-size:11px; font-weight:800; color:var(--teal); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
    .title-standard { font-size:13px; font-weight:700; color:var(--accent); margin:0 0 4px; }
    .title-objectives-preview { background:var(--white); border:2px solid var(--teal); border-radius:10px; padding:12px 16px; margin:12px 0; max-width:520px; text-align:left; }
    .title-objectives-preview p { margin:4px 0 0; font-size:12px; font-weight:600; line-height:1.4; }
    .choice-board-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:12px 0; }
    .choice-board-card {
      position:relative; text-align:left; padding:12px; border:2px solid var(--teal-light);
      border-radius:10px; background:var(--white); cursor:pointer; transition:all 0.2s;
      font-size:11px; line-height:1.3;
    }
    .choice-board-card:hover, .choice-board-card.selected { border-color:var(--teal); background:var(--teal-light); }
    .choice-board-card strong { display:block; font-size:12px; color:var(--navy); margin:4px 0; }
    .choice-board-card p { margin:0; color:var(--body-text); }
    .choice-icon { font-size:20px; display:block; margin-bottom:4px; }
    .choice-check { position:absolute; top:8px; right:8px; color:var(--teal); font-weight:800; opacity:0; }
    .choice-board-card.selected .choice-check { opacity:1; }
    .twr-frames { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
    .twr-frame { display:flex; gap:8px; background:var(--white); border:1px solid #e1eaef; border-radius:8px; padding:8px; }
    .twr-frame-num { background:var(--teal); color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; flex-shrink:0; }
    .twr-frame-body { flex:1; font-size:10px; }
    .twr-frame-body strong { display:block; color:var(--navy); margin-bottom:2px; }
    .twr-prompt { margin:0 0 4px; font-style:italic; color:var(--gray); }
    .twr-input { font-size:10px; min-height:36px; }
    .goal-tracker-card { text-align:center; }
    .goal-objective { background:var(--teal-light); border-radius:8px; padding:10px; margin-bottom:12px; font-size:12px; text-align:left; }
    .goal-levels { display:flex; flex-direction:column; gap:8px; }
    .goal-level {
      display:flex; align-items:center; gap:10px; text-align:left;
      padding:10px 12px; border:2px solid var(--teal-light); border-radius:10px;
      background:var(--white); cursor:pointer; transition:all 0.2s; width:100%;
    }
    .goal-level:hover, .goal-level.selected { border-color:var(--teal); background:var(--teal-light); }
    .goal-num { background:var(--navy); color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; flex-shrink:0; }
    .goal-text { flex:1; font-size:11px; }
    .goal-text p { margin:2px 0 0; color:var(--gray); }
    .goal-circle { font-size:18px; color:var(--teal); }
    .goal-level.selected .goal-circle { color:var(--teal); }
    .goal-level.selected .goal-circle::after { content:'●'; }
    .area-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:2px; margin:8px 0; }
    .area-cell { aspect-ratio:1; background:var(--white); border:1px solid #dadce0; cursor:pointer; border-radius:2px; transition:background 0.15s; }
    .area-cell.shaded { background:var(--teal); border-color:var(--navy); }
    .area-grid-controls { display:flex; justify-content:space-between; align-items:center; font-size:11px; }
    .stat-sort-widget .stat-card-bank { display:flex; flex-wrap:wrap; gap:6px; padding:8px; background:var(--google-gray); border-radius:8px; margin-bottom:8px; min-height:40px; }
    .stat-card { padding:6px 10px; background:white; border:1.5px solid var(--teal); border-radius:6px; font-size:10px; font-weight:600; cursor:grab; }
    .stat-columns { display:flex; gap:8px; }
    .stat-col { flex:1; min-height:80px; border:2px dashed var(--gray); border-radius:8px; padding:6px; }
    .stat-col-label { font-size:9px; font-weight:800; text-align:center; margin-bottom:4px; color:var(--navy); }
    .stat-col-items { display:flex; flex-direction:column; gap:4px; min-height:50px; }
    .treasure-svg { border:1px solid var(--teal); border-radius:8px; cursor:crosshair; }
    .treasure-log { font-size:10px; margin-top:6px; color:var(--gray); }
    .power-card-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
    .power-card { padding:10px; border:2px solid var(--teal-light); border-radius:8px; background:white; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; }
    .power-card.matched { background:var(--teal-light); border-color:var(--teal); }
    .power-card.selected-pair { background:var(--amber); border-color:var(--navy); }
    .workspace-card { background:linear-gradient(135deg, var(--white) 0%, var(--teal-light) 100%); }
    ${REFERENCE_CSS}

    @media (max-width: 768px) {
      .sidebar-slides { width: 120px; }
      .choice-board-grid, .twr-frames { grid-template-columns: 1fr; }
      .g-menu-bar { display: none; }
      .presenter-hud { font-size: 10px; padding: 6px 10px; }
    }
    
  </style>
</head>
<body>

  <!-- Google Slides Chrome Bar -->
  <header class="g-chrome">
    <div class="g-left">
      <div class="g-logo">M</div>
      <div class="g-title-block">
        <h1 class="g-doc-title">${esc(title)} <span>Reveal Math Grade 6</span></h1>
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
      ${googleSlidesLinkHtml}
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
${deck.thumbnailsHtml}
    </nav>

    <!-- Presentation Area -->
    <div class="presentation-container">
    
      <!-- The Presentation Slide -->
      <article class="slide-canvas" id="slide-canvas-element">
        <div class="lesson-progress-bar"><div class="lesson-progress-fill" id="lesson-progress-fill" style="width:0%"></div></div>
      
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
      
        ${deck.slidesHtml}
        
        <!-- Subtle Slide Watermark -->
        <div class="slide-watermark">
          <span>Reveal Math · Unit ${unit} · Lesson ${lessonId}</span>
          <span>STANDARD: ${esc(standard)}</span>
        </div>
        
      </article>
      
    </div>
    
  </main>

  <!-- Presenter Notes Panel -->
  <aside class="presenter-notes-panel" id="presenter-notes-panel">
    <h3>📝 Teacher Notes — Slide <span id="notes-slide-num">1</span></h3>
    <div id="notes-slide-content">Loading notes...</div>
    <hr style="margin:12px 0; border:none; border-top:1px solid #e1eaef;" />
    <p style="font-size:10px; color:var(--gray);"><strong>Pacing:</strong> ${esc(data.timeEstimate || '~45 min')}</p>
    ${data.practice?.commonMistake ? `<p style="font-size:10px;"><strong>Common mistake:</strong> ${esc(data.practice.commonMistake)}</p>` : ''}
  </aside>

  <!-- Presenter Controls HUD (Visible in fullscreen Present Mode) -->
  <div class="presenter-hud" id="presenter-hud">
    <button class="hud-btn" onclick="prevSlide()" title="Previous (←)">◀</button>
    <span id="hud-page-indicator">1 / ${deck.totalSlides}</span>
    <button class="hud-btn" onclick="nextSlide()" title="Next (→)">▶</button>
    <button class="notes-toolbar-btn" onclick="toggleNotesPanel()" title="Notes (N)">📝 Notes</button>
    <button class="notes-toolbar-btn" onclick="window.print()" title="Print">🖨️</button>
    <div class="hud-timer" id="hud-timer-display">00:00</div>
    <button class="hud-btn" onclick="exitFullscreen()" title="Exit (Esc)">✕</button>
  </div>

  <script>
    let currentSlide = 1;
    const totalSlides = ${deck.totalSlides};
    
    const slideTitles = ${JSON.stringify(deck.slideTitles)};
    const teacherNotesMap = ${JSON.stringify(deck.teacherNotesMap || {})};
    
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
      initV3Widgets();
      currentSlide = num;
      
      document.querySelectorAll('.slide-body').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) === num);
      });
      
      document.querySelectorAll('.sidebar-slides .thumb-card').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) === num);
      });
      
      document.getElementById('hud-page-indicator').textContent = num + ' / ' + totalSlides;
      
      const progressFill = document.getElementById('lesson-progress-fill');
      if (progressFill) {
        progressFill.style.width = Math.round((num / totalSlides) * 100) + '%';
      }
      
      updateNotesPanel(num);
      updateRefFooterDots(num);
      setTimeout(resizeSlides, 50);
    }

    function updateRefFooterDots(num) {
      const maxDots = Math.min(totalSlides, 12);
      document.querySelectorAll('.ref-footer-dots').forEach((el) => {
        el.innerHTML = Array.from({ length: maxDots }, (_, i) => {
          const n = i + 1;
          const cls = n === num ? 'ref-dot ref-dot-active' : n < num ? 'ref-dot ref-dot-done' : 'ref-dot';
          return '<span class="' + cls + '"></span>';
        }).join('');
      });
    }

    function updateNotesPanel(num) {
      const notesNum = document.getElementById('notes-slide-num');
      const notesContent = document.getElementById('notes-slide-content');
      if (notesNum) notesNum.textContent = num;
      if (notesContent) {
        const activeSlide = document.getElementById('slide-' + num);
        const dataNotes = activeSlide ? activeSlide.getAttribute('data-teacher-notes') : '';
        const mapNotes = teacherNotesMap[num] || '';
        const title = slideTitles[num - 1] || 'Slide ' + num;
        notesContent.innerHTML = '<strong>' + title + '</strong><p style="margin:6px 0 0;">' + (dataNotes || mapNotes || 'No specific notes for this slide. Follow teacher cues on the slide.') + '</p>';
      }
    }

    function toggleNotesPanel() {
      const panel = document.getElementById('presenter-notes-panel');
      if (panel) panel.classList.toggle('open');
    }

    // Click-to-reveal worked example steps
    function revealStep(prefix, stepNum) {
      const step = document.getElementById(prefix + '-step-' + stepNum);
      if (!step) return;
      const content = step.querySelector('.reveal-content');
      const btn = step.querySelector('.reveal-btn');
      if (content) content.classList.remove('hidden');
      if (btn) btn.style.display = 'none';
      saveWork();
    }

    function revealAllSteps(prefix, total) {
      for (let i = 1; i <= total; i++) revealStep(prefix, i);
    }

    // Turn & Talk 90-second timer
    const ttTimers = {};
    function startTurnTalkTimer(id, seconds) {
      if (ttTimers[id]) clearInterval(ttTimers[id]);
      let remaining = seconds;
      const display = document.getElementById('tt-countdown-' + id);
      if (display) {
        display.textContent = remaining + 's';
        display.classList.add('running');
      }
      ttTimers[id] = setInterval(() => {
        remaining--;
        if (display) display.textContent = remaining + 's';
        if (remaining <= 0) {
          clearInterval(ttTimers[id]);
          if (display) {
            display.textContent = "Time's up! 🔔";
            display.classList.remove('running');
          }
        }
      }, 1000);
    }

    // CFU thumb responses
    const cfuResponses = {};
    function setCfuResponse(num, level) {
      cfuResponses[num] = level;
      const feedback = document.getElementById('cfu-feedback-' + num);
      if (feedback) {
        const labels = { up: '👍 Got it', side: '🤚 Almost', down: '👎 Need help' };
        feedback.textContent = 'Recorded: ' + (labels[level] || level);
        feedback.style.color = 'var(--teal)';
      }
      saveWork();
    }

    // Real drag-sort (mouse + touch)
    let draggedItem = null;
    document.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('drag-item')) {
        draggedItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.id);
      }
    });
    document.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('drag-item')) {
        e.target.classList.remove('dragging');
      }
    });
    function dragOverZone(e) {
      e.preventDefault();
      const zone = e.target.closest('.drag-drop-zone, .drag-pool');
      if (zone) zone.classList.add('drag-over');
    }
    function dropOnZone(e, sortId) {
      e.preventDefault();
      document.querySelectorAll('.drag-over').forEach(z => z.classList.remove('drag-over'));
      const itemId = e.dataTransfer.getData('text/plain');
      const item = document.getElementById(itemId);
      const zone = e.target.closest('.drag-drop-zone, .drag-pool');
      if (item && zone) {
        const itemsContainer = zone.querySelector('.drag-zone-items') || zone;
        itemsContainer.appendChild(item);
      }
      saveWork();
    }

    function checkDragSort(sortId) {
      const feedback = document.getElementById('drag-feedback-' + sortId);
      if (!feedback) return;
      let correct = 0, total = 0;
      document.querySelectorAll('[id^="drag-item-' + sortId + '"]').forEach(item => {
        total++;
        const parent = item.closest('.drag-drop-zone');
        if (parent) {
          const catId = parent.getAttribute('data-cat-id');
          const correctCat = item.getAttribute('data-correct-cat');
          if (catId === correctCat) {
            correct++;
            item.style.borderColor = 'var(--teal)';
          } else {
            item.style.borderColor = '#D9795D';
          }
        }
      });
      feedback.textContent = correct + '/' + total + ' correctly sorted.';
      feedback.style.color = correct === total ? 'var(--teal)' : '#D9795D';
    }

    // Workspace table check
    function checkWorkspaceCells() {
      const feedback = document.getElementById('workspace-feedback');
      let correct = 0, total = 0;
      document.querySelectorAll('.workspace-cell').forEach(cell => {
        total++;
        const ans = (cell.getAttribute('data-answer') || '').trim();
        const val = cell.value.trim();
        if (val === ans) {
          correct++;
          cell.classList.add('correct');
          cell.classList.remove('incorrect');
        } else if (val) {
          cell.classList.add('incorrect');
          cell.classList.remove('correct');
        }
      });
      if (feedback) {
        feedback.textContent = correct + '/' + total + ' cells correct.';
        feedback.style.color = correct === total ? 'var(--teal)' : '#D9795D';
      }
      saveWork();
    }

    // Sketch canvas
    const sketchCanvas = document.getElementById('sketch-canvas');
    const sketchCtx = sketchCanvas ? sketchCanvas.getContext('2d') : null;
    let sketchDrawing = false;
    if (sketchCanvas && sketchCtx) {
      sketchCanvas.addEventListener('mousedown', (e) => { sketchDrawing = true; sketchCtx.beginPath(); sketchCtx.moveTo(e.offsetX, e.offsetY); });
      sketchCanvas.addEventListener('mousemove', (e) => { if (!sketchDrawing) return; sketchCtx.lineTo(e.offsetX, e.offsetY); sketchCtx.strokeStyle = '#17324D'; sketchCtx.lineWidth = 2; sketchCtx.stroke(); });
      sketchCanvas.addEventListener('mouseup', () => { sketchDrawing = false; });
      sketchCanvas.addEventListener('mouseleave', () => { sketchDrawing = false; });
    }
    function clearSketchCanvas() {
      if (sketchCtx && sketchCanvas) sketchCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
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
      } else if (e.key === 'n' || e.key === 'N') {
        toggleNotesPanel();
        e.preventDefault();
      } else if (e.key === 'f' || e.key === 'F') {
        enterFullscreen();
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
      
      let contentHtml = '<h4 style="margin: 0 0 8px 0; color:var(--navy); font-size:13px; font-weight:800;">' + data.title + '</h4>';
      contentHtml += '<ul style="margin: 0; padding-left: 20px; font-size: 11.5px; line-height: 1.5; color: var(--body-text);">';
      data.lines.forEach(line => {
        contentHtml += '<li style="margin-bottom: 5px;">' + line + '</li>';
      });
      contentHtml += '</ul>';
      
      document.getElementById('concept-tab-content').innerHTML = contentHtml;
      activeConceptTab = tabId;
      saveWork();
    }
    
    // Explore Activity sorting game logic with index-card stack slide animations
    function initSortingGame() {
      const container = document.getElementById('sorting-game-container');
      if (!container) return;
      
      if (exploreItems.length === 0) {
        container.innerHTML = '<div style="font-size:12px; font-style:italic; color:var(--gray);">No sorting items defined for this explore activity.</div>';
        return;
      }
      
      renderActiveExploreCard();
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

    function updateSortingFolderLists() {
      const logContainer = document.getElementById('sorting-pockets-log');
      if (!logContainer) return;
      
      let html = "";
      exploreCats.forEach((cat, idx) => {
        const colors = ['#1FA6A2', '#D9795D', '#F2C15B', '#17324D'];
        const color = colors[idx % colors.length];
        
        html += '<div class="folder-pocket-column" style="flex:1; display:flex; flex-direction:column; border:1.5px solid ' + color + '; border-radius:6px; background:#fff; overflow:hidden; height:100%;">';
        html += '  <div class="folder-pocket-header" style="background:' + color + '; color:#fff; font-size:9.5px; font-weight:800; padding:4px 6px; text-transform:uppercase; text-align:center; letter-spacing:0.02em;">' + cat.label + '</div>';
        html += '  <div class="folder-pocket-list" style="flex:1; overflow-y:auto; padding:4px 6px; font-size:9.5px; line-height:1.2; background-image:linear-gradient(rgba(31,166,162,0.03) 1px, transparent 1px); background-size:100% 16px;">';
        
        const sortedItemsInCat = [];
        exploreItems.forEach(item => {
          if (studentExploreSorted[item.id] === cat.id) {
            sortedItemsInCat.push(item);
          }
        });
        
        if (sortedItemsInCat.length === 0) {
          html += '    <div style="font-style:italic; color:var(--gray); font-size:8.5px; text-align:center; margin-top:20px;">Empty Folder</div>';
        } else {
          sortedItemsInCat.forEach(item => {
            const isCorrect = (item.catId === "" || item.catId === cat.id);
            const badge = isCorrect ? '<span style="color:var(--teal); font-weight:bold;">✓</span>' : '<span style="color:#D9795D; font-weight:bold;">✕</span>';
            const itemBg = isCorrect ? 'rgba(31, 166, 162, 0.05)' : 'rgba(217, 121, 93, 0.05)';
            html += '    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f3f4; padding:2px 4px; margin-bottom:2px; background:' + itemBg + '; border-radius:3px;">';
            html += '      <span style="font-weight:700; color:var(--navy);">' + item.text + '</span>';
            html += '      <span>' + badge + '</span>';
            html += '    </div>';
          });
        }
        
        html += '  </div>';
        html += '</div>';
      });
      logContainer.innerHTML = html;
    }

    function renderActiveExploreCard() {
      const card = document.getElementById('sorting-card');
      const buttonsDiv = document.getElementById('sorting-buttons');
      const feedbackDiv = document.getElementById('sorting-feedback');
      const progressBar = document.getElementById('sorting-progress-bar');
      if (!card) return;
      
      // Update persistent pocket contents
      updateSortingFolderLists();
      
      // Update progress bar
      const progressPercent = (currentExploreIdx / exploreItems.length) * 100;
      if (progressBar) progressBar.style.width = progressPercent + '%';
      
      if (currentExploreIdx >= exploreItems.length) {
        card.innerHTML = "🎉 Sorting Activity Complete!";
        card.className = "index-card"; // remove animations
        card.style.borderColor = "var(--teal)";
        card.style.background = "var(--teal-light)";
        buttonsDiv.innerHTML = '<button class="assess-btn" onclick="resetSortingGame()" style="max-width:120px; padding:6px; font-size:11px;">Reset Sort</button>';
        feedbackDiv.textContent = "Great job sorting all items!";
        feedbackDiv.style.color = "var(--teal)";
        triggerConfettiCelebration();
        return;
      }
      
      const activeItem = exploreItems[currentExploreIdx];
      card.innerHTML = activeItem.text;
      card.className = "index-card slide-in-next";
      card.style.borderColor = "var(--teal)";
      card.style.background = "var(--white)";
      feedbackDiv.textContent = "";
      
      let btnsHtml = "";
      const binColors = ['var(--teal)', 'var(--theme-color)', '#D9795D', 'var(--navy)'];
      exploreCats.forEach((cat, idx) => {
        const color = binColors[idx % binColors.length];
        btnsHtml += '<button class="sorting-bin" style="--bin-color: ' + color + ';" onclick="sortActiveItem(\\\'' + cat.id + '\\\')">' + cat.label + '</button>';
      });
      buttonsDiv.innerHTML = btnsHtml;
    }
    
    function sortActiveItem(catId) {
      const activeItem = exploreItems[currentExploreIdx];
      const feedbackDiv = document.getElementById('sorting-feedback');
      const card = document.getElementById('sorting-card');
      
      studentExploreSorted[activeItem.id] = catId;
      
      const isCorrect = (activeItem.catId === "" || activeItem.catId === catId);
      
      if (isCorrect) {
        feedbackDiv.textContent = "Correct! ✓";
        feedbackDiv.style.color = "var(--teal)";
        card.style.background = "var(--teal-light)";
        card.className = "index-card slide-out-right";
      } else {
        feedbackDiv.textContent = "Incorrect! ✕";
        feedbackDiv.style.color = "#D9795D";
        card.style.background = "var(--coral)";
        card.className = "index-card slide-out-left";
      }
      
      saveWork();
      
      setTimeout(() => {
        currentExploreIdx++;
        renderActiveExploreCard();
      }, 450);
    }
    
    function resetSortingGame() {
      currentExploreIdx = 0;
      exploreItems.forEach(item => {
        delete studentExploreSorted[item.id];
      });
      renderActiveExploreCard();
      saveWork();
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
        btn.style.borderColor = '';
      });
      
      const btn = document.getElementById('btn-choice-' + selected);
      if (selected === correct) {
        if (btn) btn.classList.add('correct');
        feedback.textContent = 'Correct! Great job. ✓';
        feedback.style.color = 'var(--teal)';
      } else {
        if (btn) btn.classList.add('incorrect');
        feedback.textContent = 'Incorrect. Review your calculation and try again. ✕';
        feedback.style.color = '#D9795D';
        const correctBtn = document.getElementById('btn-choice-' + correct);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      saveWork();
    }

    function checkMCQuestionByPrefix(prefix, selected, correct) {
      studentPracticeMCIndex = selected;
      const feedback = document.getElementById(prefix + '-feedback') || document.getElementById('mc-question-feedback');
      if (!feedback) return;
      
      document.querySelectorAll('[id^="btn-' + prefix + '-"]').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
        btn.style.borderColor = '';
      });
      
      const btn = document.getElementById('btn-' + prefix + '-' + selected);
      if (selected === correct) {
        if (btn) btn.classList.add('correct');
        feedback.textContent = 'Correct! Great job. ✓';
        feedback.style.color = 'var(--teal)';
      } else {
        if (btn) btn.classList.add('incorrect');
        feedback.textContent = 'Incorrect. Review your calculation and try again. ✕';
        feedback.style.color = '#D9795D';
        const correctBtn = document.getElementById('btn-' + prefix + '-' + correct);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      saveWork();
    }

    function checkVocabMatch(idx, isCorrect) {
      const feedback = document.getElementById('vocab-match-feedback');
      const btn = document.getElementById('vocab-match-' + idx);
      if (!feedback || !btn) return;
      if (isCorrect) {
        btn.classList.add('correct');
        feedback.textContent = 'Correct usage! ✓';
        feedback.style.color = 'var(--teal)';
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = 'That statement is incorrect. Try again. ✕';
        feedback.style.color = '#D9795D';
      }
      saveWork();
    }

    function checkVocabCloze(idx, correctIdx) {
      const feedback = document.getElementById('vocab-cloze-feedback');
      if (!feedback) return;
      feedback.textContent = idx === correctIdx ? 'Correct word! ✓' : 'Try another word. ✕';
      feedback.style.color = idx === correctIdx ? 'var(--teal)' : '#D9795D';
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
      
      // Save widget state variables
      data.ratioScale = ratioScale;
      data.coordPoints = coordPoints;
      data.activeCoordinateMarker = activeCoordinateMarker;
      data.balanceLeft = balanceLeft;
      data.balanceRight = balanceRight;
      
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

    // ── V3 Interactive Widgets ──
    function selectChoiceBoard(idx) {
      document.querySelectorAll('.choice-board-card').forEach((c, i) => c.classList.toggle('selected', i === idx));
      saveWork();
    }
    function selectGoalLevel(num) {
      document.querySelectorAll('.goal-level').forEach((l, i) => l.classList.toggle('selected', i + 1 === num));
      saveWork();
    }
    function toggleAreaCell(idx) {
      const cell = document.querySelector('.area-cell[data-idx="' + idx + '"]');
      if (cell) {
        cell.classList.toggle('shaded');
        const count = document.querySelectorAll('.area-cell.shaded').length;
        const el = document.getElementById('area-count');
        if (el) el.textContent = count;
        saveWork();
      }
    }
    function clearAreaGrid() {
      document.querySelectorAll('.area-cell').forEach(c => c.classList.remove('shaded'));
      const el = document.getElementById('area-count');
      if (el) el.textContent = '0';
      saveWork();
    }
    let powerFirst = null;
    function flipPowerCard(id) {
      const card = document.getElementById('power-' + id);
      if (!card || card.classList.contains('matched')) return;
      if (!powerFirst) {
        powerFirst = card;
        card.classList.add('selected-pair');
      } else {
        if (powerFirst.dataset.match === card.dataset.match && powerFirst !== card) {
          powerFirst.classList.add('matched');
          card.classList.add('matched');
          powerFirst.classList.remove('selected-pair');
          const fb = document.getElementById('power-match-feedback');
          if (fb) fb.textContent = '✓ Match found!';
        } else {
          powerFirst.classList.remove('selected-pair');
        }
        powerFirst = null;
      }
      saveWork();
    }
    const treasurePoints = [];
    function treasureHuntClick(e) {
      const svg = document.getElementById('treasure-grid');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / 28 - 1);
      const y = Math.round((e.clientY - rect.top) / 28 - 1);
      if (x < 0 || x > 9 || y < 0 || y > 9) return;
      treasurePoints.push({ x, y });
      const g = document.getElementById('treasure-markers');
      if (g) {
        const cx = 30 + x * 24;
        const cy = 30 + y * 24;
        g.innerHTML += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="var(--amber)" stroke="var(--navy)" stroke-width="1.5"/>';
      }
      const log = document.getElementById('treasure-log');
      if (log) log.textContent = 'Plotted: (' + x + ', ' + y + ')';
      saveWork();
    }
    function checkTreasureHunt() {
      const hit = treasurePoints.some(p => p.x === 4 && p.y === 3);
      const log = document.getElementById('treasure-log');
      if (log) log.textContent = hit ? '🎉 Treasure found at (4, 3)!' : 'Keep searching — target is (4, 3)';
    }
    function statDragOver(e) { e.preventDefault(); }
    function statDrop(e, cat) {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('text/plain');
      const card = document.getElementById(cardId);
      const col = document.getElementById('stat-col-' + cat);
      if (card && col) col.appendChild(card);
      saveWork();
    }
    function checkStatSort() {
      let correct = 0, total = 0;
      document.querySelectorAll('.stat-col').forEach(col => {
        const expected = col.dataset.cat;
        col.querySelectorAll('.stat-card').forEach(card => {
          total++;
          if (card.dataset.cat === expected) correct++;
        });
      });
      const fb = document.getElementById('stat-sort-feedback');
      if (fb) fb.textContent = correct === total && total > 0 ? '✓ All sorted correctly!' : correct + '/' + total + ' correct — keep trying!';
    }
    function initV3Widgets() {
      document.querySelectorAll('.stat-card').forEach(card => {
        if (!card.dataset.dragBound) {
          card.dataset.dragBound = '1';
          card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', card.id));
        }
      });
      const tg = document.getElementById('treasure-grid-lines');
      if (tg && !tg.dataset.initialized) {
        tg.dataset.initialized = '1';
        let lines = '';
        for (let i = 0; i <= 10; i++) {
          const p = 30 + i * 24;
          lines += '<line x1="' + p + '" y1="30" x2="' + p + '" y2="270" stroke="#e1eaef" stroke-width="0.5"/>';
          lines += '<line x1="30" y1="' + p + '" x2="270" y2="' + p + '" stroke="#e1eaef" stroke-width="0.5"/>';
        }
        tg.innerHTML = lines;
      }
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
          
          // Restore widget state variables
          if (data.ratioScale !== undefined) {
            ratioScale = data.ratioScale;
          }
          if (data.coordPoints !== undefined) {
            coordPoints = data.coordPoints;
          }
          if (data.activeCoordinateMarker !== undefined) {
            activeCoordinateMarker = data.activeCoordinateMarker;
            const markerBtnMap = {
              '🔴': 'btn-marker-dot',
              '⭐': 'btn-marker-star',
              '❌': 'btn-marker-cross'
            };
            const btnId = markerBtnMap[activeCoordinateMarker];
            if (btnId) {
              const el = document.getElementById(btnId);
              if (el) {
                document.querySelectorAll('[id^="btn-marker-"]').forEach(btn => btn.classList.remove('active'));
                el.classList.add('active');
              }
            }
          }
          if (data.balanceLeft !== undefined) {
            balanceLeft = data.balanceLeft;
          }
          if (data.balanceRight !== undefined) {
            balanceRight = data.balanceRight;
          }
        } else {
          switchConceptTab('ido');
          initSortingGame();
        }
        updateActiveWidget();
      } catch (e) {
        console.error('Failed to load saved work:', e);
        try { switchConceptTab('ido'); } catch(err){}
        try { initSortingGame(); } catch(err){}
        try { updateActiveWidget(); } catch(err){}
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
      
      // Paste Flash animation
      target.classList.remove('pasted-flash');
      void target.offsetWidth; // trigger reflow
      target.classList.add('pasted-flash');
    }
    
    // -----------------------------------------------------------------
    // HTML5 DRAWING CANVAS SYSTEM WITH UNDO STACK HISTORY & SHAPE TOOLS
    // -----------------------------------------------------------------
    const canvas = document.getElementById('math-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    
    let drawing = false;
    let drawMode = 'draw';
    let drawColor = '#17324D';
    let drawSize = 2; // Default to thin
    
    const drawHistory = [];
    const maxHistory = 15;
    
    let dragStartPos = null;
    let dragImageData = null;
    let activeStamp = '✓';
    
    // Interactive Widget state variables
    let ratioScale = 1;
    let coordPoints = [];
    let activeCoordinateMarker = '🔴';
    let balanceLeft = { x: 1, one: 4 };
    let balanceRight = { x: 0, one: 12 };
    
    // Adjust ratio scale helper
    function adjustRatioScale(scale) {
      ratioScale = Number(scale);
      updateRatioWidget();
      saveWork();
    }
    
    // Coordinate plane helpers
    function handleCoordinatePlaneClick(e) {
      const svg = document.getElementById('coord-plane-svg');
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const rawX = (clickX - 110) / 18;
      const rawY = (110 - clickY) / 18;
      
      const x = Math.round(rawX);
      const y = Math.round(rawY);
      
      if (Math.abs(x) <= 5 && Math.abs(y) <= 5) {
        const existingIdx = coordPoints.findIndex(pt => pt.x === x && pt.y === y);
        if (existingIdx !== -1) {
          coordPoints.splice(existingIdx, 1);
        } else {
          coordPoints.push({ x, y, marker: activeCoordinateMarker });
        }
        updateCoordinateWidget();
        saveWork();
      }
    }
    
    function setCoordinateMarker(marker, el) {
      activeCoordinateMarker = marker;
      document.querySelectorAll('[id^="btn-marker-"]').forEach(btn => {
        btn.classList.remove('active');
      });
      if (el) el.classList.add('active');
      saveWork();
    }
    
    function clearCoordinatePoints() {
      coordPoints = [];
      updateCoordinateWidget();
      saveWork();
    }
    
    // Equation balance scale helpers
    function adjustBalanceLeft(type, delta) {
      if (type === 'x') {
        balanceLeft.x = Math.max(0, balanceLeft.x + delta);
      } else {
        balanceLeft.one = Math.max(0, balanceLeft.one + delta);
      }
      updateBalanceScale();
      saveWork();
    }
    
    function adjustBalanceRight(type, delta) {
      if (type === 'x') {
        balanceRight.x = Math.max(0, balanceRight.x + delta);
      } else {
        balanceRight.one = Math.max(0, balanceRight.one + delta);
      }
      updateBalanceScale();
      saveWork();
    }
    
    function updateRatioWidget() {
      const svgGroup = document.getElementById('ratio-dynamic-content');
      if (!svgGroup) return;
      const S = ratioScale;
      
      // Update button highlights
      for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById('btn-scale-' + i);
        if (btn) {
          btn.classList.toggle('active', i === S);
        }
      }
      
      let html = '';
      
      // Title
      html += '<text x="15" y="22" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)">INTERACTIVE TAPE DIAGRAM (Ratio 2 : 3)</text>';
      
      // Tape Diagram - Row 1 (Juice: 2 parts)
      html += '<text x="15" y="52" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)">Juice</text>';
      for (let i = 0; i < 2; i++) {
        const rx = 65 + i * 55;
        html += '<rect x="' + rx + '" y="38" width="50" height="22" fill="var(--teal-light)" stroke="var(--navy)" stroke-width="1.5" rx="3"/>';
        html += '<text x="' + (rx + 25) + '" y="53" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)" text-anchor="middle">' + S + '</text>';
      }
      // Bracket and total for Row 1
      html += '<path d="M 65 32 L 65 28 L 120 28 L 120 32" fill="none" stroke="var(--navy)" stroke-width="1"/>';
      html += '<text x="180" y="52" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--teal)">Total: ' + (2 * S) + '</text>';
      
      // Tape Diagram - Row 2 (Water: 3 parts)
      html += '<text x="15" y="87" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)">Water</text>';
      for (let i = 0; i < 3; i++) {
        const rx = 65 + i * 55;
        html += '<rect x="' + rx + '" y="73" width="50" height="22" fill="var(--amber)" stroke="var(--navy)" stroke-width="1.5" rx="3"/>';
        html += '<text x="' + (rx + 25) + '" y="88" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)" text-anchor="middle">' + S + '</text>';
      }
      // Bracket and total for Row 2
      html += '<path d="M 65 67 L 65 63 L 175 63 L 175 67" fill="none" stroke="var(--navy)" stroke-width="1"/>';
      html += '<text x="235" y="87" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--teal)">Total: ' + (3 * S) + '</text>';
      
      // Double Number Line Title
      html += '<text x="15" y="122" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)">DOUBLE NUMBER LINE</text>';
      
      // Lines
      html += '<line x1="65" y1="142" x2="355" y2="142" stroke="var(--navy)" stroke-width="2"/>';
      html += '<line x1="65" y1="182" x2="355" y2="182" stroke="var(--navy)" stroke-width="2"/>';
      
      // Arrows
      html += '<path d="M 355 142 L 348 138 M 355 142 L 348 146" stroke="var(--navy)" stroke-width="2"/>';
      html += '<path d="M 355 182 L 348 178 M 355 182 L 348 186" stroke="var(--navy)" stroke-width="2"/>';
      
      // Ticks, Connectors, Labels
      for (let i = 0; i <= 5; i++) {
        const tx = 65 + i * 52;
        // Connector (dashed line)
        html += '<line x1="' + tx + '" y1="142" x2="' + tx + '" y2="182" stroke="var(--gray)" stroke-dasharray="3,3" stroke-width="1"/>';
        
        // Ticks
        html += '<line x1="' + tx + '" y1="138" x2="' + tx + '" y2="146" stroke="var(--navy)" stroke-width="1.5"/>';
        html += '<line x1="' + tx + '" y1="178" x2="' + tx + '" y2="186" stroke="var(--navy)" stroke-width="1.5"/>';
        
        // Values
        html += '<text x="' + tx + '" y="134" font-family="Outfit, sans-serif" font-size="9" font-weight="bold" fill="var(--navy)" text-anchor="middle">' + (i * 2 * S) + '</text>';
        html += '<text x="' + tx + '" y="196" font-family="Outfit, sans-serif" font-size="9" font-weight="bold" fill="var(--navy)" text-anchor="middle">' + (i * 3 * S) + '</text>';
      }
      
      // Line Labels
      html += '<text x="362" y="145" font-family="Outfit, sans-serif" font-size="9" font-weight="bold" fill="var(--navy)">Juice (c)</text>';
      html += '<text x="362" y="185" font-family="Outfit, sans-serif" font-size="9" font-weight="bold" fill="var(--navy)">Water (c)</text>';
      
      svgGroup.innerHTML = html;
    }
    
    function updateCoordinateWidget() {
      const svgGroup = document.getElementById('coord-dynamic-content');
      if (!svgGroup) return;
      
      let html = '';
      
      // Grid Lines
      for (let val = -5; val <= 5; val++) {
        if (val === 0) continue;
        const px = 110 + val * 18;
        const py = 110 - val * 18;
        
        // Vertical grid line
        html += '<line x1="' + px + '" y1="10" x2="' + px + '" y2="210" stroke="#f1f3f4" stroke-width="1"/>';
        // Horizontal grid line
        html += '<line x1="10" y1="' + py + '" x2="210" y2="' + py + '" stroke="#f1f3f4" stroke-width="1"/>';
        
        // Axis Ticks
        html += '<line x1="' + px + '" y1="107" x2="' + px + '" y2="113" stroke="var(--navy)" stroke-width="1"/>';
        html += '<line x1="107" y1="' + py + '" x2="113" y2="' + py + '" stroke="var(--navy)" stroke-width="1"/>';
        
        // Axis Labels
        html += '<text x="' + px + '" y="121" font-family="Outfit, sans-serif" font-size="7" fill="var(--navy)" text-anchor="middle">' + val + '</text>';
        html += '<text x="99" y="' + (py + 2.5) + '" font-family="Outfit, sans-serif" font-size="7" fill="var(--navy)" text-anchor="end">' + val + '</text>';
      }
      
      // Main Axes
      html += '<line x1="10" y1="110" x2="210" y2="110" stroke="var(--navy)" stroke-width="1.5"/>';
      html += '<line x1="110" y1="10" x2="110" y2="210" stroke="var(--navy)" stroke-width="1.5"/>';
      
      // Arrow heads
      html += '<path d="M 10 110 L 15 107 M 10 110 L 15 113" stroke="var(--navy)" stroke-width="1.5"/>';
      html += '<path d="M 210 110 L 205 107 M 210 110 L 205 113" stroke="var(--navy)" stroke-width="1.5"/>';
      html += '<path d="M 110 10 L 107 15 M 110 10 L 113 15" stroke="var(--navy)" stroke-width="1.5"/>';
      html += '<path d="M 110 210 L 107 205 M 110 210 L 113 205" stroke="var(--navy)" stroke-width="1.5"/>';
      
      // Axis Names
      html += '<text x="214" y="113" font-family="Outfit, sans-serif" font-size="8" font-weight="bold" fill="var(--navy)">x</text>';
      html += '<text x="110" y="8" font-family="Outfit, sans-serif" font-size="8" font-weight="bold" fill="var(--navy)" text-anchor="middle">y</text>';
      
      // Plot Points
      coordPoints.forEach(pt => {
        const cx = 110 + pt.x * 18;
        const cy = 110 - pt.y * 18;
        html += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="rgba(255,255,255,0.85)"/>';
        html += '<text x="' + cx + '" y="' + (cy + 3.5) + '" font-family="Outfit, sans-serif" font-size="10" text-anchor="middle">' + pt.marker + '</text>';
      });
      
      svgGroup.innerHTML = html;
      
      // Update coordinate log list
      const logDiv = document.getElementById('coord-points-log');
      if (logDiv) {
        if (coordPoints.length === 0) {
          logDiv.innerHTML = '<span style="color:var(--gray); font-style:italic;">Click on coordinate plane to plot custom markers...</span>';
        } else {
          let logHtml = '<div style="display:flex; flex-direction:column; gap:3px;">';
          coordPoints.forEach((pt, i) => {
            logHtml += '<div style="display:flex; justify-content:space-between; align-items:center; background:white; border:1px solid #e1eaef; padding:2px 6px; border-radius:4px;">';
            logHtml += '<span style="font-weight:bold; color:var(--navy);">Point ' + (i+1) + ': (' + pt.x + ', ' + pt.y + ')</span>';
            logHtml += '<span>' + pt.marker + '</span>';
            logHtml += '</div>';
          });
          logHtml += '</div>';
          logDiv.innerHTML = logHtml;
        }
      }
    }
    
    function updateBalanceScale() {
      const svgGroup = document.getElementById('balance-dynamic-content');
      if (!svgGroup) return;
      
      const wl = balanceLeft.x * 8 + balanceLeft.one;
      const wr = balanceRight.x * 8 + balanceRight.one;
      const weightDiff = wl - wr;
      const tiltAngle = Math.max(-15, Math.min(15, -weightDiff * 1.5));
      const rad = (tiltAngle * Math.PI) / 180;
      
      const lx = 220 - 120 * Math.cos(rad);
      const ly = 90 - 120 * Math.sin(rad);
      const rx = 220 + 120 * Math.cos(rad);
      const ry = 90 + 120 * Math.sin(rad);
      
      let html = '';
      
      // Title
      html += '<text x="15" y="24" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)">INTERACTIVE PAN BALANCE SCALE (x = 8 units)</text>';
      
      // Fulcrum
      html += '<polygon points="205,170 235,170 220,90" fill="#dadce0" stroke="var(--navy)" stroke-width="1.5"/>';
      html += '<rect x="120" y="170" width="200" height="10" fill="var(--navy)" rx="3"/>';
      
      // Balanced / Unbalanced Banner
      if (wl === wr) {
        html += '<rect x="140" y="10" width="160" height="22" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="1.5" rx="4"/>';
        html += '<text x="220" y="25" font-family="Outfit, sans-serif" font-size="9.5" font-weight="bold" fill="var(--navy)" text-anchor="middle">⚖️ BALANCED! (Total: ' + wl + ')</text>';
      } else {
        html += '<text x="75" y="24" font-family="Outfit, sans-serif" font-size="9.5" font-weight="bold" fill="var(--navy)" text-anchor="middle">Left: ' + wl + ' units</text>';
        html += '<text x="365" y="24" font-family="Outfit, sans-serif" font-size="9.5" font-weight="bold" fill="var(--navy)" text-anchor="middle">Right: ' + wr + ' units</text>';
      }
      
      // Strings Left
      html += '<line x1="' + lx + '" y1="' + ly + '" x2="' + (lx - 35) + '" y2="' + (ly + 50) + '" stroke="var(--gray)" stroke-width="1"/>';
      html += '<line x1="' + lx + '" y1="' + ly + '" x2="' + (lx + 35) + '" y2="' + (ly + 50) + '" stroke="var(--gray)" stroke-width="1"/>';
      
      // Strings Right
      html += '<line x1="' + rx + '" y1="' + ry + '" x2="' + (rx - 35) + '" y2="' + (ry + 50) + '" stroke="var(--gray)" stroke-width="1"/>';
      html += '<line x1="' + rx + '" y1="' + ry + '" x2="' + (rx + 35) + '" y2="' + (ry + 50) + '" stroke="var(--gray)" stroke-width="1"/>';
      
      // Pan Plates
      html += '<rect x="' + (lx - 40) + '" y="' + (ly + 50) + '" width="80" height="6" fill="var(--gray)" stroke="var(--navy)" stroke-width="1.5" rx="2"/>';
      html += '<rect x="' + (rx - 40) + '" y="' + (ry + 50) + '" width="80" height="6" fill="var(--gray)" stroke="var(--navy)" stroke-width="1.5" rx="2"/>';
      
      // Draw Left Blocks
      let leftBlocksHtml = '';
      let bx = lx - 32;
      let by = ly + 50 - 20;
      for (let i = 0; i < balanceLeft.x; i++) {
        leftBlocksHtml += '<rect x="' + bx + '" y="' + by + '" width="18" height="20" fill="var(--amber)" stroke="var(--navy)" stroke-width="1.2" rx="2"/>';
        leftBlocksHtml += '<text x="' + (bx + 9) + '" y="' + (by + 14) + '" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)" text-anchor="middle">x</text>';
        bx += 20;
        if (bx > lx + 15) {
          bx = lx - 32;
          by -= 22;
        }
      }
      let ux = bx;
      let uy = by + 8;
      if (ux > lx - 32 && ux + 12 > lx + 35) {
        ux = lx - 32;
        uy -= 14;
      }
      for (let i = 0; i < balanceLeft.one; i++) {
        leftBlocksHtml += '<rect x="' + ux + '" y="' + uy + '" width="12" height="12" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="1.2" rx="1"/>';
        leftBlocksHtml += '<text x="' + (ux + 6) + '" y="' + (uy + 9) + '" font-family="Outfit, sans-serif" font-size="8" font-weight="bold" fill="var(--teal)" text-anchor="middle">1</text>';
        ux += 14;
        if (ux > lx + 22) {
          ux = lx - 32;
          uy -= 14;
        }
      }
      html += leftBlocksHtml;
      
      // Draw Right Blocks
      let rightBlocksHtml = '';
      let rbx = rx - 32;
      let rby = ry + 50 - 20;
      for (let i = 0; i < balanceRight.x; i++) {
        rightBlocksHtml += '<rect x="' + rbx + '" y="' + rby + '" width="18" height="20" fill="var(--amber)" stroke="var(--navy)" stroke-width="1.2" rx="2"/>';
        rightBlocksHtml += '<text x="' + (rbx + 9) + '" y="' + (rby + 14) + '" font-family="Outfit, sans-serif" font-size="10" font-weight="bold" fill="var(--navy)" text-anchor="middle">x</text>';
        rbx += 20;
        if (rbx > rx + 15) {
          rbx = rx - 32;
          rby -= 22;
        }
      }
      let rux = rbx;
      let ruy = rby + 8;
      if (rux > rx - 32 && rux + 12 > rx + 35) {
        rux = rx - 32;
        ruy -= 14;
      }
      for (let i = 0; i < balanceRight.one; i++) {
        rightBlocksHtml += '<rect x="' + rux + '" y="' + ruy + '" width="12" height="12" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="1.2" rx="1"/>';
        rightBlocksHtml += '<text x="' + (rux + 6) + '" y="' + (ruy + 9) + '" font-family="Outfit, sans-serif" font-size="8" font-weight="bold" fill="var(--teal)" text-anchor="middle">1</text>';
        rux += 14;
        if (rux > rx + 22) {
          rux = rx - 32;
          ruy -= 14;
        }
      }
      html += rightBlocksHtml;
      
      // Beam Line
      html += '<line x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" stroke="var(--navy)" stroke-width="4" stroke-linecap="round"/>';
      
      // Center Pivot
      html += '<circle cx="220" cy="90" r="5" fill="var(--amber)" stroke="var(--navy)" stroke-width="1.5"/>';
      
      svgGroup.innerHTML = html;
    }
    
    function updateActiveWidget() {
      const std = "${standard}".toUpperCase();
      const isRatio = std.includes('6.RP.1') || std.includes('6.RP.2') || std.includes('6.RP.3');
      const isCoord = std.includes('6.NS.6') || std.includes('6.NS.8');
      const isBalance = std.includes('6.EE.5') || std.includes('6.EE.7');
      
      if (isRatio) {
        updateRatioWidget();
      } else if (isCoord) {
        updateCoordinateWidget();
      } else if (isBalance) {
        updateBalanceScale();
      }
    }
    
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
      const pos = getMousePos(e);
      dragStartPos = pos;
      dragImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (drawMode === 'stamp') {
        drawStamp(pos.x, pos.y);
        drawing = false;
        saveWork();
        return;
      }
      
      ctx.beginPath();
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
      
      if (drawMode === 'line' || drawMode === 'rect' || drawMode === 'circle') {
        ctx.putImageData(dragImageData, 0, 0);
        
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawSize;
        ctx.globalCompositeOperation = 'source-over';
        
        if (drawMode === 'line') {
          ctx.moveTo(dragStartPos.x, dragStartPos.y);
          ctx.lineTo(pos.x, pos.y);
        } else if (drawMode === 'rect') {
          const w = pos.x - dragStartPos.x;
          const h = pos.y - dragStartPos.y;
          ctx.strokeRect(dragStartPos.x, dragStartPos.y, w, h);
        } else if (drawMode === 'circle') {
          const radius = Math.sqrt(Math.pow(pos.x - dragStartPos.x, 2) + Math.pow(pos.y - dragStartPos.y, 2));
          ctx.arc(dragStartPos.x, dragStartPos.y, radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
      } else {
        ctx.lineTo(pos.x, pos.y);
        ctx.lineCap = drawMode === 'highlight' ? 'square' : 'round';
        ctx.lineJoin = 'round';
        
        if (drawMode === 'erase') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = drawSize * 2.5;
        } else if (drawMode === 'highlight') {
          ctx.globalCompositeOperation = 'source-over';
          let hlColor = drawColor;
          if (drawColor === '#17324D' || drawColor === '#000000') {
            hlColor = '#FFFF00';
          }
          ctx.strokeStyle = hexToRgba(hlColor, 0.4);
          ctx.lineWidth = drawSize * 3.5;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = drawSize;
        }
        ctx.stroke();
      }
      e.preventDefault();
    }
    
    function stopDrawing() {
      if (drawing && ctx) {
        ctx.closePath();
        drawing = false;
        dragStartPos = null;
        dragImageData = null;
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
      
      const tools = ['interact', 'draw', 'highlight', 'line', 'rect', 'circle', 'erase', 'stamp'];
      tools.forEach(t => {
        const btn = document.getElementById('btn-' + t);
        if (btn) {
          btn.classList.toggle('active', mode === t);
        }
      });
      
      if (mode !== 'stamp') {
        document.querySelectorAll('.stamp-btn').forEach(btn => btn.classList.remove('active'));
      }
      
      const container = document.getElementById('math-visual-container-element');
      const canvasEl = document.getElementById('math-canvas');
      if (container && canvasEl) {
        container.className = 'math-visual-container';
        canvasEl.className = 'canvas-overlay';
        
        container.classList.add('tool-' + mode);
        canvasEl.classList.add('cursor-' + mode);
        
        if (mode === 'interact') {
          canvasEl.style.pointerEvents = 'none';
        } else {
          canvasEl.style.pointerEvents = 'auto';
        }
      }
    }
    
    function selectStamp(stampSymbol, el) {
      activeStamp = stampSymbol;
      setDrawingTool('stamp');
      
      document.querySelectorAll('.stamp-btn').forEach(btn => btn.classList.remove('active'));
      if (el) el.classList.add('active');
    }
    
    function drawStamp(x, y) {
      if (!ctx) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = drawColor;
      
      let fontSize = 16;
      if (drawSize === 2) fontSize = 14;
      else if (drawSize === 5) fontSize = 24;
      else if (drawSize === 10) fontSize = 36;
      
      ctx.font = fontSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeStamp, x, y);
    }
    
    function setDrawingColor(color, el) {
      drawColor = color;
      if (drawMode !== 'highlight' && drawMode !== 'stamp' && drawMode !== 'line' && drawMode !== 'rect' && drawMode !== 'circle') {
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
      initV3Widgets();
      loadWork();
      resizeSlides();
      goToSlide(1);
      document.getElementById('presenter-hud')?.classList.add('visible');
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

  let urlMap = {};
  const urlsPath = path.join(root, 'data', 'google-slides-urls.json');
  if (fs.existsSync(urlsPath)) {
    try {
      urlMap = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));
      console.log(`Loaded ${Object.keys(urlMap).length} mapped Google Slides URLs.`);
    } catch (e) {
      console.error('Failed to parse google-slides-urls.json:', e);
    }
  }
    
  let count = 0;
  lessons.forEach(id => {
    try {
      const configPath = path.join(lessonsDir, id, 'config.json');
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const googleSlidesUrl = urlMap[id] || null;
      const html = generateSlidesHtml(id, data, googleSlidesUrl);
      
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
