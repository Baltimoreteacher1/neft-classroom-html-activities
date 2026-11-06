// Stage 4: Wonder City & Tessellation Architect
// Generative geometric construction studio integrating regular polygons, isometric voxels, and dynamic symmetry.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const TILES = [
  { id: "square", name: "Unit Square", area: 1, color: "#3b82f6", stroke: "#1d4ed8" },
  { id: "triangle", name: "Equilateral Triangle", area: 0.433, color: "#10b981", stroke: "#047857" },
  { id: "hexagon", name: "Regular Hexagon", area: 2.598, color: "#f59e0b", stroke: "#b45309" },
  { id: "rhombus", name: "Symmetric Rhombus", area: 0.866, color: "#8b5cf6", stroke: "#6d28d9" },
  { id: "cube", name: "Isometric 3D Cube", area: 1, color: "#06b6d4", stroke: "#0e7490" },
];

const STORAGE_KEY = "fluency_wonder_city_state";

export function loadWonderCity() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveWonderCity(placedTiles) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(placedTiles));
  } catch (e) {}
}

export function calculateMetrics(placedTiles) {
  let totalArea = 0;
  const countByType = {};

  placedTiles.forEach((tile) => {
    const spec = TILES.find((t) => t.id === tile.type) || TILES[0];
    totalArea += spec.area;
    countByType[spec.name] = (countByType[spec.name] || 0) + 1;
  });

  return {
    tileCount: placedTiles.length,
    totalArea: totalArea.toFixed(2),
    composition: countByType,
  };
}

export function renderWonderCityStudio() {
  const tiles = loadWonderCity();
  const metrics = calculateMetrics(tiles);

  const paletteHtml = TILES.map((t, idx) => `
    <button type="button" class="wonder-tile-btn ${idx === 0 ? "is-selected" : ""}" data-tile-type="${t.id}" aria-label="Select ${t.name}">
      <svg class="wonder-tile-icon" viewBox="0 0 32 32">
        <rect x="4" y="4" width="24" height="24" rx="4" fill="${t.color}" stroke="${t.stroke}" stroke-width="2"/>
      </svg>
      <span>${esc(t.name)}</span>
    </button>
  `).join("");

  return `
    <div class="wonder-city-container" data-wonder-city-root="true">
      <div class="wonder-city-header">
        <div class="wonder-city-title-group">
          <h3>🏛️ Wonder City &amp; Geometric Architect</h3>
          <p>Assemble mathematical tiles into symmetrical tessellations and isometric structures.</p>
        </div>
        <div class="wonder-city-toolbar">
          <button type="button" class="wonder-city-tool-btn is-active" data-tool-mode="place">✏️ Place</button>
          <button type="button" class="wonder-city-tool-btn" data-tool-mode="erase">🧹 Erase</button>
          <button type="button" class="wonder-city-tool-btn" data-tool-action="mirror">🪞 4-Way Symmetry</button>
          <button type="button" class="wonder-city-tool-btn" data-tool-action="clear">🗑️ Clear Grid</button>
        </div>
      </div>

      <div class="wonder-city-stage-layout">
        <div class="wonder-city-canvas-box" id="wonder-canvas-viewport">
          <svg id="wonder-city-svg" viewBox="0 0 500 350" role="img" aria-label="Wonder city interactive canvas">
            <!-- Grid lines -->
            <defs>
              <pattern id="wonder-grid-pattern" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e2e8f0" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wonder-grid-pattern)" />
            <!-- Rendered Tiles -->
            <g id="wonder-city-tiles-group">
              ${renderTilesSvg(tiles)}
            </g>
          </svg>
        </div>

        <div class="wonder-city-sidebar">
          <div class="wonder-city-palette" role="group" aria-label="Geometric tile palette">
            ${paletteHtml}
          </div>

          <div class="wonder-metrics-card">
            <h5>📐 Math Inspector</h5>
            <div class="wonder-metric-item">
              <span>Tiles Placed:</span>
              <strong id="wonder-metric-count">${metrics.tileCount}</strong>
            </div>
            <div class="wonder-metric-item">
              <span>Total Area:</span>
              <strong id="wonder-metric-area">${metrics.totalArea} sq units</strong>
            </div>
            <div class="wonder-metric-item">
              <span>Symmetry:</span>
              <strong id="wonder-metric-symm">Bilateral</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTilesSvg(tiles) {
  return tiles.map((tile) => {
    const spec = TILES.find((t) => t.id === tile.type) || TILES[0];
    if (tile.type === "triangle") {
      return `<polygon points="${tile.x},${tile.y + 25} ${tile.x + 12.5},${tile.y} ${tile.x + 25},${tile.y + 25}" fill="${spec.color}" stroke="${spec.stroke}" stroke-width="1.5" data-tile-idx="${tile.id}"/>`;
    }
    if (tile.type === "hexagon") {
      return `<polygon points="${tile.x + 6},${tile.y} ${tile.x + 19},${tile.y} ${tile.x + 25},${tile.y + 12.5} ${tile.x + 19},${tile.y + 25} ${tile.x + 6},${tile.y + 25} ${tile.x},${tile.y + 12.5}" fill="${spec.color}" stroke="${spec.stroke}" stroke-width="1.5" data-tile-idx="${tile.id}"/>`;
    }
    return `<rect x="${tile.x}" y="${tile.y}" width="24" height="24" rx="3" fill="${spec.color}" stroke="${spec.stroke}" stroke-width="1.5" data-tile-idx="${tile.id}"/>`;
  }).join("");
}

export function mountWonderCityStudio(container) {
  if (!container) return;
  const root = container.matches("[data-wonder-city-root]") ? container : container.querySelector("[data-wonder-city-root]");
  if (!root) return;

  let currentTileType = "square";
  let mode = "place";
  let tiles = loadWonderCity();

  // Palette selection
  root.querySelectorAll(".wonder-tile-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".wonder-tile-btn").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      currentTileType = btn.dataset.tileType;
      mode = "place";
      updateToolModeBtns();
    });
  });

  // Tool mode buttons
  const updateToolModeBtns = () => {
    root.querySelectorAll("[data-tool-mode]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.toolMode === mode);
    });
  };

  root.querySelectorAll("[data-tool-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.toolMode;
      updateToolModeBtns();
    });
  });

  const svgStage = root.querySelector("#wonder-city-svg");
  const tilesGroup = root.querySelector("#wonder-city-tiles-group");

  const refreshMetrics = () => {
    const metrics = calculateMetrics(tiles);
    const countEl = root.querySelector("#wonder-metric-count");
    const areaEl = root.querySelector("#wonder-metric-area");
    if (countEl) countEl.textContent = String(metrics.tileCount);
    if (areaEl) areaEl.textContent = `${metrics.totalArea} sq units`;
    if (tilesGroup) tilesGroup.innerHTML = renderTilesSvg(tiles);
    saveWonderCity(tiles);
  };

  if (svgStage) {
    svgStage.addEventListener("click", (e) => {
      const rect = svgStage.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Snap to 25px grid
      const snapX = Math.floor(clickX / 25) * 25;
      const snapY = Math.floor(clickY / 25) * 25;

      if (mode === "place") {
        // Avoid duplicate in same spot
        const existingIdx = tiles.findIndex((t) => t.x === snapX && t.y === snapY);
        if (existingIdx >= 0) {
          tiles[existingIdx].type = currentTileType;
        } else {
          tiles.push({ id: Date.now() + Math.random(), type: currentTileType, x: snapX, y: snapY });
        }
        refreshMetrics();
      } else if (mode === "erase") {
        tiles = tiles.filter((t) => Math.abs(t.x - snapX) > 12 || Math.abs(t.y - snapY) > 12);
        refreshMetrics();
      }
    });
  }

  // Action buttons: Clear & Mirror
  root.querySelector('[data-tool-action="clear"]')?.addEventListener("click", () => {
    tiles = [];
    refreshMetrics();
  });

  root.querySelector('[data-tool-action="mirror"]')?.addEventListener("click", () => {
    // Mirror across center X (250px)
    const mirrored = [];
    tiles.forEach((t) => {
      const mirrorX = 500 - (t.x + 25);
      if (!tiles.some((existing) => existing.x === mirrorX && existing.y === t.y)) {
        mirrored.push({ id: Date.now() + Math.random(), type: t.type, x: mirrorX, y: t.y });
      }
    });
    tiles.push(...mirrored);
    refreshMetrics();
  });
}
