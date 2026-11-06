// Interactive Coordinate Plane & Vector Explorer (Grade 6–8 Geometry & Algebra)
// Draggable points, 4-quadrant Cartesian grid, reflection over axes, slope triangles, and distance calculations.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderCoordinateExplorer(state = {}) {
  const {
    p1 = { x: 3, y: 4 },
    p2 = { x: -2, y: -1 },
    showSlope = true,
    showReflection = false,
  } = state;

  const width = 360;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const scale = 14; // pixels per unit (range -10 to +10)

  const toSvgX = (x) => cx + x * scale;
  const toSvgY = (y) => cy - y * scale;

  // Grid lines
  let gridLines = "";
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    const gx = toSvgX(i);
    const gy = toSvgY(i);
    gridLines += `<line x1="${gx}" y1="15" x2="${gx}" y2="${height - 15}" stroke="#f1f5f9" stroke-width="1"/>`;
    gridLines += `<line x1="15" y1="${gy}" x2="${width - 15}" y2="${gy}" stroke="#f1f5f9" stroke-width="1"/>`;
  }

  // Points
  const x1 = toSvgX(p1.x);
  const y1 = toSvgY(p1.y);
  const x2 = toSvgX(p2.x);
  const y2 = toSvgY(p2.y);

  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);
  const slope = dx !== 0 ? (dy / dx).toFixed(2) : "Undefined (Vertical)";

  // Slope triangle (run along bottom, rise vertical)
  let slopeTriangle = "";
  if (showSlope) {
    const cornerX = toSvgX(p1.x);
    const cornerY = toSvgY(p2.y);
    slopeTriangle = `
      <polygon points="${x2},${y2} ${cornerX},${cornerY} ${x1},${y1}" fill="rgba(59, 130, 246, 0.08)" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="${(x2 + cornerX) / 2}" y="${cornerY + (p2.y >= p1.y ? -6 : 14)}" text-anchor="middle" font-size="10" font-weight="700" fill="#2563eb">Δx = ${Math.abs(dx)}</text>
      <text x="${cornerX + (p1.x >= p2.x ? 8 : -8)}" y="${(y1 + cornerY) / 2 + 4}" text-anchor="${p1.x >= p2.x ? "start" : "end"}" font-size="10" font-weight="700" fill="#2563eb">Δy = ${Math.abs(dy)}</text>
    `;
  }

  return `
    <div class="coord-explorer-wrap" data-coord-root="true" data-x1="${p1.x}" data-y1="${p1.y}" data-x2="${p2.x}" data-y2="${p2.y}">
      <div class="coord-header">
        <span class="coord-title">📍 Interactive 4-Quadrant Coordinate Plane</span>
        <div class="coord-badges">
          <span class="coord-badge point-a">A(${p1.x}, ${p1.y})</span>
          <span class="coord-badge point-b">B(${p2.x}, ${p2.y})</span>
          <span class="coord-badge slope-badge">Slope: ${slope}</span>
          <span class="coord-badge dist-badge">Distance: ${dist}</span>
        </div>
      </div>

      <div class="coord-stage-box">
        <svg class="coord-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Coordinate grid with Point A at ${p1.x}, ${p1.y} and Point B at ${p2.x}, ${p2.y}">
          <!-- Grid Background -->
          <rect width="100%" height="100%" fill="#ffffff" />
          ${gridLines}

          <!-- Main Axes -->
          <line x1="15" y1="${cy}" x2="${width - 15}" y2="${cy}" stroke="#64748b" stroke-width="2"/>
          <line x1="${cx}" y1="15" x2="${cx}" y2="${height - 15}" stroke="#64748b" stroke-width="2"/>

          <!-- Axis Arrows & Labels -->
          <text x="${width - 12}" y="${cy - 6}" font-size="11" font-weight="800" fill="#334155">x</text>
          <text x="${cx + 8}" y="18" font-size="11" font-weight="800" fill="#334155">y</text>

          <!-- Slope triangle -->
          ${slopeTriangle}

          <!-- Line connecting A and B -->
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Point A -->
          <circle cx="${x1}" cy="${y1}" r="6" fill="#2563eb" stroke="#ffffff" stroke-width="2" class="coord-point-handle" data-point="A"/>
          <text x="${x1 + 8}" y="${y1 - 8}" font-size="11" font-weight="800" fill="#1e40af">A(${p1.x}, ${p1.y})</text>

          <!-- Point B -->
          <circle cx="${x2}" cy="${y2}" r="6" fill="#10b981" stroke="#ffffff" stroke-width="2" class="coord-point-handle" data-point="B"/>
          <text x="${x2 + 8}" y="${y2 + 14}" font-size="11" font-weight="800" fill="#047857">B(${p2.x}, ${p2.y})</text>
        </svg>
      </div>

      <div class="expl-inputs-bar">
        <span>A: (</span>
        <input type="number" min="-9" max="9" value="${p1.x}" class="expl-num-in" data-coord-in="x1" aria-label="Point A X"/>
        <span>,</span>
        <input type="number" min="-9" max="9" value="${p1.y}" class="expl-num-in" data-coord-in="y1" aria-label="Point A Y"/>
        <span>) &nbsp; B: (</span>
        <input type="number" min="-9" max="9" value="${p2.x}" class="expl-num-in" data-coord-in="x2" aria-label="Point B X"/>
        <span>,</span>
        <input type="number" min="-9" max="9" value="${p2.y}" class="expl-num-in" data-coord-in="y2" aria-label="Point B Y"/>
        <span>)</span>
        <button type="button" class="expl-update-btn" data-coord-update="true">Plot</button>
      </div>

      <div class="coord-controls-row">
        <button type="button" class="coord-btn" data-coord-act="reflect-x">🪞 Reflect A over X-Axis</button>
        <button type="button" class="coord-btn" data-coord-act="reflect-y">🪞 Reflect A over Y-Axis</button>
        <button type="button" class="coord-btn" data-coord-act="reset">🔄 Reset Points</button>
      </div>
    </div>
  `;
}

export function mountCoordinateExplorer(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-coord-root]") ? container : container.querySelector("[data-coord-root]");
  if (!root) return;

  let p1 = { x: Number(root.dataset.x1) || 3, y: Number(root.dataset.y1) || 4 };
  let p2 = { x: Number(root.dataset.x2) || -2, y: Number(root.dataset.y2) || -1 };

  root.querySelector('[data-coord-act="reflect-x"]')?.addEventListener("click", () => {
    p1 = { x: p1.x, y: -p1.y };
    root.outerHTML = renderCoordinateExplorer({ p1, p2 });
    const updated = container.querySelector("[data-coord-root]") || container;
    mountCoordinateExplorer(updated, onChange);
    if (onChange) onChange({ p1, p2 });
  });

  root.querySelector('[data-coord-act="reflect-y"]')?.addEventListener("click", () => {
    p1 = { x: -p1.x, y: p1.y };
    root.outerHTML = renderCoordinateExplorer({ p1, p2 });
    const updated = container.querySelector("[data-coord-root]") || container;
    mountCoordinateExplorer(updated, onChange);
    if (onChange) onChange({ p1, p2 });
  });

  root.querySelector('[data-coord-act="reset"]')?.addEventListener("click", () => {
    p1 = { x: 3, y: 4 };
    p2 = { x: -2, y: -1 };
    root.outerHTML = renderCoordinateExplorer({ p1, p2 });
    const updated = container.querySelector("[data-coord-root]") || container;
    mountCoordinateExplorer(updated, onChange);
    if (onChange) onChange({ p1, p2 });
  });

  root.querySelector('[data-coord-update]')?.addEventListener("click", () => {
    const x1 = Number(root.querySelector("[data-coord-in='x1']")?.value || p1.x);
    const y1 = Number(root.querySelector("[data-coord-in='y1']")?.value || p1.y);
    const x2 = Number(root.querySelector("[data-coord-in='x2']")?.value || p2.x);
    const y2 = Number(root.querySelector("[data-coord-in='y2']")?.value || p2.y);
    p1 = { x: x1, y: y1 };
    p2 = { x: x2, y: y2 };
    root.outerHTML = renderCoordinateExplorer({ p1, p2 });
    const updated = container.querySelector("[data-coord-root]") || container;
    mountCoordinateExplorer(updated, onChange);
    if (onChange) onChange({ p1, p2 });
  });
}
