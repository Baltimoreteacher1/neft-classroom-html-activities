// Box-and-Whisker Plot & 5-Number Summary Studio (Grades 6–8 Statistics)
// Direct-manipulation statistical distribution visualizer.
// Computes Min, Q1 (Lower Quartile), Median (Q2), Q3 (Upper Quartile), Max,
// and Interquartile Range (IQR = Q3 - Q1) with 1.5 × IQR outlier boundaries.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function compute5NumberSummary(data) {
  if (!data || data.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, iqr: 0, outliers: [] };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  const getMedian = (arr) => {
    const len = arr.length;
    if (len === 0) return 0;
    const mid = Math.floor(len / 2);
    return len % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  const min = sorted[0];
  const max = sorted[n - 1];
  const median = getMedian(sorted);

  const mid = Math.floor(n / 2);
  const lowerHalf = n % 2 !== 0 ? sorted.slice(0, mid) : sorted.slice(0, mid);
  const upperHalf = n % 2 !== 0 ? sorted.slice(mid + 1) : sorted.slice(mid);

  const q1 = getMedian(lowerHalf);
  const q3 = getMedian(upperHalf);
  const iqr = q3 - q1;

  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter((x) => x < lowerFence || x > upperFence);

  return {
    sorted,
    min,
    q1,
    median,
    q3,
    max,
    iqr,
    lowerFence,
    upperFence,
    outliers,
  };
}

export function renderBoxWhiskerPlot(state = {}) {
  const {
    data = [12, 14, 15, 18, 19, 20, 22, 25, 28, 30, 32],
    rangeMin = 10,
    rangeMax = 35,
  } = state;

  const stats = compute5NumberSummary(data);

  // SVG dimensions
  const svgWidth = 380;
  const plotLeft = 40;
  const plotRight = 350;
  const plotWidth = plotRight - plotLeft;

  const xPos = (val) => {
    const clamped = Math.max(rangeMin, Math.min(rangeMax, val));
    return plotLeft + ((clamped - rangeMin) / (rangeMax - rangeMin)) * plotWidth;
  };

  const boxY = 60;
  const boxHeight = 45;
  const whiskerY = boxY + boxHeight / 2;

  const xMin = xPos(stats.min);
  const xQ1 = xPos(stats.q1);
  const xMed = xPos(stats.median);
  const xQ3 = xPos(stats.q3);
  const xMax = xPos(stats.max);

  // Axis ticks every 5 units
  const ticks = [];
  for (let v = rangeMin; v <= rangeMax; v += 5) {
    const tx = xPos(v);
    ticks.push(`
      <line x1="${tx}" y1="140" x2="${tx}" y2="148" stroke="#64748b" stroke-width="1.5"/>
      <text x="${tx}" y="162" text-anchor="middle" font-size="10" font-weight="600" fill="#475569">${v}</text>
    `);
  }

  // Dot plot row of raw points
  const dots = stats.sorted.map((val) => {
    const dx = xPos(val);
    return `<circle cx="${dx}" cy="130" r="4.5" fill="#3b82f6" fill-opacity="0.8" stroke="#1d4ed8" stroke-width="1.5"/>`;
  });

  return `
    <div class="box-plot-wrap" data-boxplot-root="true" data-count="${data.length}">
      <div class="coord-header">
        <span class="coord-title">📊 Box-and-Whisker Plot &amp; 5-Number Summary</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Min: ${stats.min}</span>
          <span class="coord-badge" style="background:#fef3c7; color:#92400e">Q1: ${stats.q1}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">Median: ${stats.median}</span>
          <span class="coord-badge" style="background:#fef3c7; color:#92400e">Q3: ${stats.q3}</span>
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Max: ${stats.max}</span>
          <span class="coord-badge" style="background:#f3e8ff; color:#6b21a8; font-weight:800">IQR = ${stats.iqr}</span>
        </div>
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 380 190" role="img" aria-label="Box and whisker plot">
          <!-- Left Whisker -->
          <line x1="${xMin}" y1="${whiskerY}" x2="${xQ1}" y2="${whiskerY}" stroke="#334155" stroke-width="2.5"/>
          <line x1="${xMin}" y1="${whiskerY - 12}" x2="${xMin}" y2="${whiskerY + 12}" stroke="#334155" stroke-width="2.5"/>

          <!-- Right Whisker -->
          <line x1="${xQ3}" y1="${whiskerY}" x2="${xMax}" y2="${whiskerY}" stroke="#334155" stroke-width="2.5"/>
          <line x1="${xMax}" y1="${whiskerY - 12}" x2="${xMax}" y2="${whiskerY + 12}" stroke="#334155" stroke-width="2.5"/>

          <!-- IQR Box -->
          <rect x="${xQ1}" y="${boxY}" width="${Math.max(2, xQ3 - xQ1)}" height="${boxHeight}" fill="rgba(147, 197, 253, 0.35)" stroke="#2563eb" stroke-width="2.5" rx="3"/>

          <!-- Median Line -->
          <line x1="${xMed}" y1="${boxY}" x2="${xMed}" y2="${boxY + boxHeight}" stroke="#dc2626" stroke-width="3"/>
          <text x="${xMed}" y="${boxY - 8}" text-anchor="middle" font-size="11" font-weight="900" fill="#dc2626">Median: ${stats.median}</text>

          <!-- Raw Data Points on Dot-Line -->
          <line x1="${plotLeft}" y1="130" x2="${plotRight}" y2="130" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3"/>
          ${dots.join("")}

          <!-- Number Line Axis -->
          <line x1="${plotLeft - 10}" y1="140" x2="${plotRight + 10}" y2="140" stroke="#1e293b" stroke-width="2"/>
          ${ticks.join("")}
        </svg>
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Sample Datasets:</span>
        <button type="button" class="coord-btn" data-dataset="scores">Test Scores</button>
        <button type="button" class="coord-btn" data-dataset="symmetric">Symmetric</button>
        <button type="button" class="coord-btn" data-dataset="skewed">Right-Skewed</button>
        <button type="button" class="coord-btn" data-dataset="outlier">With Outlier</button>
      </div>
    </div>
  `;
}

export const DATASET_PRESETS = {
  scores: [12, 14, 15, 18, 19, 20, 22, 25, 28, 30, 32],
  symmetric: [10, 15, 20, 20, 25, 30],
  skewed: [10, 11, 12, 13, 14, 16, 20, 32],
  outlier: [12, 13, 14, 15, 16, 17, 34],
};

export function mountBoxWhiskerPlot(container) {
  if (!container) return;
  const root = container.querySelector('[data-boxplot-root="true"]');
  if (!root) return;

  root.querySelectorAll("[data-dataset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.dataset;
      const data = DATASET_PRESETS[key] || DATASET_PRESETS.scores;
      root.outerHTML = renderBoxWhiskerPlot({ data });
      mountBoxWhiskerPlot(container);
    });
  });
}
