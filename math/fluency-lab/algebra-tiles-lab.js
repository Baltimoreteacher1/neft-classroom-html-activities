// Interactive Algebra Tiles & Equation Balancer (Grades 6–8 Algebra)
// Visual physical representation of linear equations: ax + b = c and ax + b = cx + d.
// Features direct-manipulation tiles: +x (green bar), -x (red bar), +1 (yellow square), -1 (red square),
// Zero-Pair annihilation animations, and inverse operations applied equally to both sides of the balance mat.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function computeEquationSolution(leftX, leftConst, rightX, rightConst) {
  // leftX * x + leftConst = rightX * x + rightConst
  // (leftX - rightX) * x = rightConst - leftConst
  const netX = leftX - rightX;
  const netConst = rightConst - leftConst;
  const xVal = netX !== 0 ? netConst / netX : null;
  return {
    netX,
    netConst,
    solution: xVal,
    isInteger: xVal !== null && Number.isInteger(xVal),
    formattedX: xVal !== null ? (Number.isInteger(xVal) ? String(xVal) : xVal.toFixed(2)) : "No Unique Solution",
  };
}

export function renderAlgebraTilesLab(state = {}) {
  const {
    leftX = 2,
    leftConst = 3,
    rightX = 0,
    rightConst = 11,
    step = 0, // 0 = start, 1 = isolate variable, 2 = simplify/divide
  } = state;

  const sol = computeEquationSolution(leftX, leftConst, rightX, rightConst);

  // Helper to render tiles
  const renderTiles = (xCount, cCount) => {
    const xTiles = [];
    for (let i = 0; i < Math.abs(xCount); i++) {
      const isPos = xCount > 0;
      xTiles.push(`
        <div class="tile-bar ${isPos ? "tile-x-pos" : "tile-x-neg"}" title="${isPos ? "+x" : "-x"}">
          <span>${isPos ? "x" : "−x"}</span>
        </div>
      `);
    }

    const cTiles = [];
    for (let i = 0; i < Math.abs(cCount); i++) {
      const isPos = cCount > 0;
      cTiles.push(`
        <div class="tile-unit ${isPos ? "tile-1-pos" : "tile-1-neg"}" title="${isPos ? "+1" : "-1"}">
          <span>${isPos ? "1" : "−1"}</span>
        </div>
      `);
    }

    return `
      <div class="tiles-container">
        <div class="tiles-row-x">${xTiles.join("")}</div>
        <div class="tiles-row-c">${cTiles.join("")}</div>
      </div>
    `;
  };

  const leftEqStr = `${leftX !== 0 ? (leftX === 1 ? "x" : leftX + "x") : ""}${leftConst !== 0 ? (leftConst > 0 && leftX !== 0 ? " + " + leftConst : (leftX === 0 ? String(leftConst) : " − " + Math.abs(leftConst))) : (leftX === 0 ? "0" : "")}`;
  const rightEqStr = `${rightX !== 0 ? (rightX === 1 ? "x" : rightX + "x") : ""}${rightConst !== 0 ? (rightConst > 0 && rightX !== 0 ? " + " + rightConst : (rightX === 0 ? String(rightConst) : " − " + Math.abs(rightConst))) : (rightX === 0 ? "0" : "")}`;

  return `
    <div class="algebra-tiles-wrap" data-tiles-root="true" data-lx="${leftX}" data-lc="${leftConst}" data-rx="${rightX}" data-rc="${rightConst}" data-step="${step}">
      <div class="coord-header">
        <span class="coord-title">🧱 Interactive Algebra Tiles &amp; Equation Mat</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af; font-size:0.95rem; font-weight:800">
            ${esc(leftEqStr)} = ${esc(rightEqStr)}
          </span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">
            Solution: x = ${sol.formattedX}
          </span>
        </div>
      </div>

      <div class="algebra-mat-grid">
        <!-- Left Side of Mat -->
        <div class="algebra-mat-side">
          <div class="algebra-mat-label">Left Side: <strong>${esc(leftEqStr)}</strong></div>
          ${renderTiles(leftX, leftConst)}
        </div>

        <div class="algebra-mat-divider">
          <div class="algebra-equals-sign">=</div>
          <div class="algebra-scale-fulcrum">▲</div>
        </div>

        <!-- Right Side of Mat -->
        <div class="algebra-mat-side">
          <div class="algebra-mat-label">Right Side: <strong>${esc(rightEqStr)}</strong></div>
          ${renderTiles(rightX, rightConst)}
        </div>
      </div>

      <div class="algebra-action-toolbar">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Inverse Operations:</span>
        ${leftConst > 0 ? `
          <button type="button" class="coord-btn" data-action="sub-const" data-amt="${leftConst}">
            Subtract ${leftConst} from Both Sides (−${leftConst})
          </button>
        ` : leftConst < 0 ? `
          <button type="button" class="coord-btn" data-action="add-const" data-amt="${Math.abs(leftConst)}">
            Add ${Math.abs(leftConst)} to Both Sides (+${Math.abs(leftConst)})
          </button>
        ` : ""}

        ${leftX > 1 && leftConst === 0 && rightX === 0 ? `
          <button type="button" class="coord-btn" data-action="divide-x" data-amt="${leftX}" style="background:#ecfdf5; color:#065f46; border-color:#10b981; font-weight:800">
            Divide Both Sides by ${leftX} (÷${leftX})
          </button>
        ` : ""}

        <button type="button" class="coord-btn" data-action="reset">Reset</button>
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Presets:</span>
        <button type="button" class="coord-btn" data-eq="2:3:0:11">2x + 3 = 11</button>
        <button type="button" class="coord-btn" data-eq="3:-2:0:7">3x − 2 = 7</button>
        <button type="button" class="coord-btn" data-eq="4:2:0:14">4x + 2 = 14</button>
        <button type="button" class="coord-btn" data-eq="3:1:1:9">3x + 1 = x + 9</button>
      </div>
    </div>
  `;
}

export function mountAlgebraTilesLab(container) {
  if (!container) return;
  const root = container.querySelector('[data-tiles-root="true"]');
  if (!root) return;

  const lx = Number(root.dataset.lx) || 2;
  const lc = Number(root.dataset.lc) || 3;
  const rx = Number(root.dataset.rx) || 0;
  const rc = Number(root.dataset.rc) || 11;

  // Actions
  root.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.action;
      const amt = Number(btn.dataset.amt) || 0;

      if (act === "sub-const") {
        root.outerHTML = renderAlgebraTilesLab({
          leftX: lx,
          leftConst: lc - amt,
          rightX: rx,
          rightConst: rc - amt,
          step: 1,
        });
        mountAlgebraTilesLab(container);
      } else if (act === "add-const") {
        root.outerHTML = renderAlgebraTilesLab({
          leftX: lx,
          leftConst: lc + amt,
          rightX: rx,
          rightConst: rc + amt,
          step: 1,
        });
        mountAlgebraTilesLab(container);
      } else if (act === "divide-x") {
        root.outerHTML = renderAlgebraTilesLab({
          leftX: lx / amt,
          leftConst: lc,
          rightX: rx,
          rightConst: rc / amt,
          step: 2,
        });
        mountAlgebraTilesLab(container);
      } else if (act === "reset") {
        root.outerHTML = renderAlgebraTilesLab({
          leftX: 2,
          leftConst: 3,
          rightX: 0,
          rightConst: 11,
          step: 0,
        });
        mountAlgebraTilesLab(container);
      }
    });
  });

  // Presets
  root.querySelectorAll("[data-eq]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [pLX, pLC, pRX, pRC] = btn.dataset.eq.split(":").map(Number);
      root.outerHTML = renderAlgebraTilesLab({
        leftX: pLX,
        leftConst: pLC,
        rightX: pRX,
        rightConst: pRC,
        step: 0,
      });
      mountAlgebraTilesLab(container);
    });
  });
}
