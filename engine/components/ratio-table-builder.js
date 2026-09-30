// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// Pure DOM, no dependencies. Public API:
//   renderRatioTableBuilder(container, cfg) -> { destroy }
//     cfg.a, cfg.b       : starting ratio (default 2, 3)
//     cfg.labelA, labelB : column labels (default "A", "B")
//     cfg.steps          : how many multiples to show (default 6)
//     cfg.presets        : quick-pick "a:b" strings

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  headA: "#eef4ff",
  headB: "#f2fcfa",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * The same equivalent ratios the table just listed, drawn as a double number
 * line: two parallel scales whose tick k sits at the same x for both rows.
 *
 * A ratio table and a double number line are the two representations Grade 6
 * uses for exactly the same relationship, and a student who meets them in
 * separate lessons reads them as two procedures. Rendering both from one state
 * — same a, same b, same k — is what makes them one relationship: column ×3 of
 * the table IS the third pair of ticks, at the same place on both lines.
 *
 * Built as a string alongside the table so a single `stage.innerHTML` write
 * keeps them literally impossible to get out of sync.
 */
export function doubleNumberLineSVG(a, b, steps, labelA, labelB) {
  const W = 560;
  const PAD = 54;
  const usable = W - PAD - 16;
  const x = (k) => PAD + (usable * k) / steps;
  const yA = 42;
  const yB = 92;
  const esc2 = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  let ticks = "";
  for (let k = 0; k <= steps; k += 1) {
    const px = x(k);
    ticks +=
      `<line x1="${px}" y1="${yA - 7}" x2="${px}" y2="${yA + 7}" stroke="${C.navy}" stroke-width="2"/>` +
      `<line x1="${px}" y1="${yB - 7}" x2="${px}" y2="${yB + 7}" stroke="${C.navy}" stroke-width="2"/>` +
      // The vertical tie is the whole point: these two values are one pair.
      `<line x1="${px}" y1="${yA + 7}" x2="${px}" y2="${yB - 7}" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
      `<text x="${px}" y="${yA - 13}" text-anchor="middle" font-size="13" font-weight="700" fill="${C.navy}">${fmt(a * k)}</text>` +
      `<text x="${px}" y="${yB + 24}" text-anchor="middle" font-size="13" font-weight="700" fill="${C.navy}">${fmt(b * k)}</text>`;
  }

  const pairs = Array.from({ length: steps + 1 }, (_, k) => `${fmt(a * k)} to ${fmt(b * k)}`).join(
    ", ",
  );
  return (
    `<svg class="rtlab-dnl" viewBox="0 0 ${W} 120" role="img" ` +
    `aria-label="Double number line for ${esc2(labelA)} and ${esc2(labelB)}. Paired values: ${esc2(pairs)}.">` +
    `<text x="4" y="${yA + 5}" font-size="12" font-weight="800" fill="${C.muted}">${esc2(labelA)}</text>` +
    `<text x="4" y="${yB + 5}" font-size="12" font-weight="800" fill="${C.muted}">${esc2(labelB)}</text>` +
    `<line x1="${PAD}" y1="${yA}" x2="${W - 10}" y2="${yA}" stroke="${C.accent}" stroke-width="2.5"/>` +
    `<line x1="${PAD}" y1="${yB}" x2="${W - 10}" y2="${yB}" stroke="${C.teal}" stroke-width="2.5"/>` +
    ticks +
    `</svg>`
  );
}

/**
 * Coordinate plane graphing for equivalent ratio tables.
 * Plots table columns as ordered pairs (x, y) in Quadrant 1 (positive numbers only).
 * Connects the points with a straight proportional line starting at the origin (0, 0).
 */
export function ratioGraphSVG(a, b, steps, labelA, labelB, activeK = null, testPt = null) {
  const W = 560;
  const H = 340;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 50;
  const usableW = W - padLeft - padRight;
  const usableH = H - padTop - padBottom;

  const reqK =
    testPt && typeof testPt.x === "number" && typeof testPt.y === "number"
      ? Math.max(steps + 1, Math.ceil(testPt.x / a), Math.ceil(testPt.y / b))
      : steps + 1;
  const gridK = Math.min(14, Math.max(steps + 1, reqK));
  const axisXMax = a * gridK;
  const axisYMax = b * gridK;

  const sx = (x) => padLeft + (x / axisXMax) * usableW;
  const sy = (y) => H - padBottom - (y / axisYMax) * usableH;
  const ox = sx(0);
  const oy = sy(0);
  const esc2 = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  let gridLines = "";
  let xTicks = "";
  let yTicks = "";

  for (let k = 0; k <= gridK; k++) {
    const xVal = a * k;
    const px = sx(xVal);
    gridLines += `<line x1="${px.toFixed(1)}" y1="${sy(axisYMax).toFixed(1)}" x2="${px.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>`;
    xTicks += `<line x1="${px.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${px.toFixed(1)}" y2="${(oy + 5).toFixed(1)}" stroke="${C.navy}" stroke-width="1.5"/>`;
    xTicks += `<text x="${px.toFixed(1)}" y="${(oy + 18).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.navy}">${fmt(xVal)}</text>`;

    const yVal = b * k;
    const py = sy(yVal);
    gridLines += `<line x1="${ox.toFixed(1)}" y1="${py.toFixed(1)}" x2="${sx(axisXMax).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>`;
    if (k > 0) {
      yTicks += `<line x1="${(ox - 5).toFixed(1)}" y1="${py.toFixed(1)}" x2="${ox.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${C.navy}" stroke-width="1.5"/>`;
      yTicks += `<text x="${(ox - 8).toFixed(1)}" y="${(py + 4).toFixed(1)}" text-anchor="end" font-size="12" font-weight="700" fill="${C.navy}">${fmt(yVal)}</text>`;
    }
  }

  const endX = sx(axisXMax) + 12;
  const endY = sy(axisYMax) - 12;
  const axes =
    `<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${endX.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="${C.navy}" stroke-width="2.5"/>` +
    `<polygon points="${endX.toFixed(1)},${oy.toFixed(1)} ${(endX - 8).toFixed(1)},${(oy - 4).toFixed(1)} ${(endX - 8).toFixed(1)},${(oy + 4).toFixed(1)}" fill="${C.navy}"/>` +
    `<text x="${(endX - 10).toFixed(1)}" y="${(oy + 36).toFixed(1)}" text-anchor="end" font-size="13" font-weight="800" fill="${C.navy}">${esc2(labelA)} →</text>` +
    `<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${ox.toFixed(1)}" y2="${endY.toFixed(1)}" stroke="${C.navy}" stroke-width="2.5"/>` +
    `<polygon points="${ox.toFixed(1)},${endY.toFixed(1)} ${(ox - 4).toFixed(1)},${(endY + 8).toFixed(1)} ${(ox + 4).toFixed(1)},${(endY + 8).toFixed(1)}" fill="${C.navy}"/>` +
    `<text x="${ox.toFixed(1)}" y="${(endY - 8).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" fill="${C.navy}">↑ ${esc2(labelB)}</text>`;

  const propLine = `<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${sx(axisXMax).toFixed(1)}" y2="${sy(axisYMax).toFixed(1)}" stroke="${C.teal}" stroke-width="3" stroke-linecap="round"/>`;

  const originDot =
    `<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="5" fill="${C.navy}"/>` +
    `<text x="${(ox - 8).toFixed(1)}" y="${(oy + 18).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="${C.muted}">(0, 0)</text>`;

  let points = "";
  const pairDescriptions = [];
  for (let k = 1; k <= steps; k++) {
    const x = a * k;
    const y = b * k;
    const px = sx(x);
    const py = sy(y);
    const isActive = activeK === k;
    pairDescriptions.push(`(${fmt(x)}, ${fmt(y)})`);

    const pointColor = isActive ? C.accent : C.teal;
    const glow = isActive
      ? `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="13" fill="none" stroke="${C.accent}" stroke-width="2" stroke-dasharray="3 3"/>`
      : "";

    const lblX = (px + 8).toFixed(1);
    const lblY = (py - 8).toFixed(1);
    const unitBadge =
      k === 1 && a === 1
        ? `<text x="${lblX}" y="${(py + 16).toFixed(1)}" font-size="10" font-weight="800" fill="${C.teal}">UNIT RATE</text>`
        : "";

    const tagW = Math.max(48, (String(fmt(x)).length + String(fmt(y)).length) * 8 + 18);
    points +=
      `<g class="rtlab-point${isActive ? " is-active" : ""}" data-point-k="${k}" role="button" tabindex="0" aria-label="Point (${fmt(x)}, ${fmt(y)}) from column ×${k}">` +
      glow +
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${isActive ? 7 : 5.5}" fill="${pointColor}" stroke="#ffffff" stroke-width="2.5"/>` +
      `<rect x="${lblX}" y="${(py - 20).toFixed(1)}" width="${tagW}" height="17" rx="4" fill="rgba(255,255,255,0.92)" stroke="${isActive ? C.accent : C.line}" stroke-width="1"/>` +
      `<text x="${(px + 12).toFixed(1)}" y="${lblY}" font-size="11" font-weight="800" fill="${isActive ? C.accent : C.navy}">(${fmt(x)}, ${fmt(y)})</text>` +
      unitBadge +
      `</g>`;
  }

  let activeGuides = "";
  if (activeK && activeK >= 1 && activeK <= steps) {
    const actX = a * activeK;
    const actY = b * activeK;
    const actPx = sx(actX);
    const actPy = sy(actY);
    activeGuides =
      `<line x1="${actPx.toFixed(1)}" y1="${actPy.toFixed(1)}" x2="${actPx.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="${C.accent}" stroke-width="2" stroke-dasharray="4 3"/>` +
      `<line x1="${ox.toFixed(1)}" y1="${actPy.toFixed(1)}" x2="${actPx.toFixed(1)}" y2="${actPy.toFixed(1)}" stroke="${C.accent}" stroke-width="2" stroke-dasharray="4 3"/>` +
      `<circle cx="${actPx.toFixed(1)}" cy="${oy.toFixed(1)}" r="4" fill="${C.accent}"/>` +
      `<circle cx="${ox.toFixed(1)}" cy="${actPy.toFixed(1)}" r="4" fill="${C.accent}"/>`;
  }

  let testMarker = "";
  if (testPt && typeof testPt.x === "number" && typeof testPt.y === "number") {
    if (testPt.x >= 0 && testPt.x <= axisXMax && testPt.y >= 0 && testPt.y <= axisYMax) {
      const tpx = sx(testPt.x);
      const tpy = sy(testPt.y);
      const tcolor = testPt.onLine ? "#16a34a" : "#dc2626";
      const tstatus = testPt.onLine ? "✓ ON line" : "✗ OFF line";
      testMarker =
        `<g class="rtlab-test-pt">` +
        `<line x1="${tpx.toFixed(1)}" y1="${tpy.toFixed(1)}" x2="${tpx.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="${tcolor}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
        `<line x1="${ox.toFixed(1)}" y1="${tpy.toFixed(1)}" x2="${tpx.toFixed(1)}" y2="${tpy.toFixed(1)}" stroke="${tcolor}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
        `<circle cx="${tpx.toFixed(1)}" cy="${tpy.toFixed(1)}" r="8" fill="${tcolor}" stroke="#ffffff" stroke-width="2"/>` +
        `<rect x="${(tpx + 10).toFixed(1)}" y="${(tpy - 24).toFixed(1)}" width="115" height="20" rx="4" fill="#ffffff" stroke="${tcolor}" stroke-width="1.5"/>` +
        `<text x="${(tpx + 16).toFixed(1)}" y="${(tpy - 10).toFixed(1)}" font-size="11" font-weight="800" fill="${tcolor}">(${fmt(testPt.x)}, ${fmt(testPt.y)}) ${tstatus}</text>` +
        `</g>`;
    }
  }

  const aria = `Coordinate graph of equivalent ratios for ${esc2(labelA)} and ${esc2(labelB)}. Plotted ordered pairs: ${pairDescriptions.join(", ")}. All points form a straight line passing through the origin (0, 0).`;

  return (
    `<svg class="rtlab-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc2(aria)}">` +
    `<rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="#ffffff"/>` +
    gridLines +
    axes +
    xTicks +
    yTicks +
    propLine +
    originDot +
    activeGuides +
    points +
    testMarker +
    `</svg>`
  );
}

export function renderRatioTableBuilder(container, cfg = {}) {
  const labelA = cfg.labelA || "x";
  const labelB = cfg.labelB || "y";
  const STEPS = Math.max(3, Math.min(8, cfg.steps || 6));
  let a = clamp(cfg.a ?? 1);
  let b = clamp(cfg.b ?? 4);
  let activeK = null;
  let testPt = null;
  let currentView = "graph";

  function clamp(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(1, Math.min(99, v));
  }

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length ? cfg.presets : ["1:4", "2:5", "1:3", "3:5"];

  injectStyles();

  const root = document.createElement("div");
  root.className = "rtlab";
  root.innerHTML =
    `<div class="rtlab-title">Determine Equivalent Ratios Using Graphs</div>` +
    `<p class="rtlab-hint">Build an equivalent ratio table with positive numbers, then plot the ordered pairs on the coordinate graph. Notice how they form a straight line through the origin (0, 0).</p>` +
    `<div class="rtlab-controls">` +
    `<label class="rtlab-field"><span>${esc(labelA)} (x)</span><input type="number" min="1" max="99" value="${a}" data-inp="a" aria-label="${esc(labelA)} (x) part of the ratio"/></label>` +
    `<span class="rtlab-colon">:</span>` +
    `<label class="rtlab-field"><span>${esc(labelB)} (y)</span><input type="number" min="1" max="99" value="${b}" data-inp="b" aria-label="${esc(labelB)} (y) part of the ratio"/></label>` +
    `<button type="button" class="rtlab-go">Build &amp; graph →</button></div>` +
    `<div class="rtlab-presets" role="group" aria-label="Quick-pick ratios">` +
    presets
      .map((p) => `<button type="button" class="rtlab-chip" data-p="${esc(p)}">${esc(p)}</button>`)
      .join("") +
    `</div>` +
    `<div class="rtlab-stage"></div>` +
    `<div class="rtlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inA = root.querySelector('[data-inp="a"]');
  const inB = root.querySelector('[data-inp="b"]');
  const stage = root.querySelector(".rtlab-stage");
  const result = root.querySelector(".rtlab-result");

  function renderVisuals() {
    let head = `<tr><th class="rtlab-corner">×</th>`;
    let rowA = `<tr><th class="rtlab-rowlab" style="background:${C.headA}">${esc(labelA)} (x)</th>`;
    let rowB = `<tr><th class="rtlab-rowlab" style="background:${C.headB}">${esc(labelB)} (y)</th>`;
    let rowPair = `<tr><th class="rtlab-rowlab" style="background:#e0e7ff;color:#1e3a8a;">Pair (x, y)</th>`;
    for (let k = 1; k <= STEPS; k++) {
      const isColActive = activeK === k;
      const colClass = isColActive ? " rtlab-col-active" : "";
      head += `<th class="${colClass}" data-col-k="${k}" role="button" tabindex="0" title="Click to highlight point (${a * k}, ${b * k})">×${k}</th>`;
      rowA += `<td class="${k === 1 ? "rtlab-base" : ""}${colClass}" data-col-k="${k}">${a * k}</td>`;
      rowB += `<td class="${k === 1 ? "rtlab-base" : ""}${colClass}" data-col-k="${k}">${b * k}</td>`;
      rowPair += `<td class="${k === 1 ? "rtlab-base" : ""}${colClass}" data-col-k="${k}">(${a * k}, ${b * k})</td>`;
    }
    head += `</tr>`;
    rowA += `</tr>`;
    rowB += `</tr>`;
    rowPair += `</tr>`;

    const detailText = activeK
      ? `<strong>Column ×${activeK}:</strong> (${a * activeK}, ${b * activeK}) → ${a * activeK} ${esc(labelA)} pairs with ${b * activeK} ${esc(labelB)}. (${a * activeK} ÷ ${activeK} = ${a}, ${b * activeK} ÷ ${activeK} = ${b}).`
      : `💡 Tap any column or point on the graph to inspect its ordered pair (x, y).`;

    const testFeedbackHtml = testPt
      ? testPt.onLine
        ? `<div class="rtlab-test-feedback is-on">✓ <strong>(${testPt.x}, ${testPt.y}) is an EQUIVALENT RATIO!</strong> It lies directly on the straight line through (0, 0). Rate: ${testPt.y} ÷ ${testPt.x} = ${fmt(testPt.y / testPt.x)} (matches ${b} ÷ ${a} = ${fmt(b / a)}).</div>`
        : `<div class="rtlab-test-feedback is-off">✗ <strong>(${testPt.x}, ${testPt.y}) is NOT equivalent to ${a}:${b}!</strong> It does not lie on the proportional line through the origin. Rate: ${testPt.y} ÷ ${testPt.x} = ${fmt(testPt.y / testPt.x)} ≠ ${fmt(b / a)}.</div>`
      : "";

    stage.innerHTML =
      `<div class="rtlab-table-wrap"><table class="rtlab-table"><thead>${head}</thead><tbody>${rowA}${rowB}${rowPair}</tbody></table></div>` +
      `<div class="rtlab-view-tabs" role="tablist">` +
      `<button type="button" class="rtlab-tab${currentView === "graph" ? " is-active" : ""}" data-view="graph" role="tab" aria-selected="${currentView === "graph"}">📈 Coordinate Graph</button>` +
      `<button type="button" class="rtlab-tab${currentView === "dnl" ? " is-active" : ""}" data-view="dnl" role="tab" aria-selected="${currentView === "dnl"}">📏 Double Number Line</button>` +
      `</div>` +
      `<div class="rtlab-visual-area">` +
      `<div class="rtlab-view-graph"${currentView === "graph" ? "" : ' style="display:none;"'}>` +
      ratioGraphSVG(a, b, STEPS, labelA, labelB, activeK, testPt) +
      `</div>` +
      `<div class="rtlab-view-dnl"${currentView === "dnl" ? "" : ' style="display:none;"'}>` +
      doubleNumberLineSVG(a, b, STEPS, labelA, labelB) +
      `</div>` +
      `</div>` +
      `<div class="rtlab-point-detail">${detailText}</div>` +
      `<div class="rtlab-test-panel">` +
      `<div class="rtlab-test-header">` +
      `<span class="rtlab-test-icon">🧪</span>` +
      `<strong>Test Any Point on the Graph:</strong> ` +
      `<span class="rtlab-test-sub">Does (x, y) form an equivalent ratio with ${a} : ${b}?</span>` +
      `</div>` +
      `<div class="rtlab-test-controls">` +
      `<label class="rtlab-test-input-lbl"><span>x</span><input type="number" min="0" max="99" data-test-inp="x" value="${testPt ? testPt.x : ""}" placeholder="x" aria-label="Test x value" /></label>` +
      `<span class="rtlab-test-comma">,</span>` +
      `<label class="rtlab-test-input-lbl"><span>y</span><input type="number" min="0" max="99" data-test-inp="y" value="${testPt ? testPt.y : ""}" placeholder="y" aria-label="Test y value" /></label>` +
      `<button type="button" class="rtlab-test-btn">Check Point on Graph →</button>` +
      `${testPt ? `<button type="button" class="rtlab-test-clear">Clear</button>` : ""}` +
      `</div>` +
      `<div class="rtlab-test-quick" role="group" aria-label="Quick test points">` +
      `<span class="rtlab-quick-lbl">Quick test:</span>` +
      `<button type="button" class="rtlab-test-chip" data-tx="${a * 2}" data-ty="${b * 2}">(${a * 2}, ${b * 2}) [2×]</button>` +
      `<button type="button" class="rtlab-test-chip" data-tx="${a * 4}" data-ty="${b * 4 + 3}">(${a * 4}, ${b * 4 + 3}) [Off line]</button>` +
      `<button type="button" class="rtlab-test-chip" data-tx="${a * 5}" data-ty="${b * 5}">(${a * 5}, ${b * 5}) [5×]</button>` +
      `</div>` +
      testFeedbackHtml +
      `</div>`;

    // Wire view switcher
    stage.querySelectorAll(".rtlab-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        currentView = tab.dataset.view;
        renderVisuals();
      });
    });

    // Wire table column clicks
    stage.querySelectorAll("[data-col-k]").forEach((cell) => {
      cell.addEventListener("click", () => {
        const k = Number(cell.dataset.colK);
        activeK = activeK === k ? null : k;
        renderVisuals();
      });
    });

    // Wire graph point clicks
    stage.querySelectorAll(".rtlab-point").forEach((pt) => {
      pt.addEventListener("click", () => {
        const k = Number(pt.dataset.pointK);
        activeK = activeK === k ? null : k;
        renderVisuals();
      });
      pt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const k = Number(pt.dataset.pointK);
          activeK = activeK === k ? null : k;
          renderVisuals();
        }
      });
    });

    // Wire test point controls
    const testBtn = stage.querySelector(".rtlab-test-btn");
    const testInpX = stage.querySelector('[data-test-inp="x"]');
    const testInpY = stage.querySelector('[data-test-inp="y"]');
    const clearBtn = stage.querySelector(".rtlab-test-clear");

    function runTest(tx, ty) {
      if (!Number.isFinite(tx) || !Number.isFinite(ty) || tx < 0 || ty < 0) return;
      const onLine = tx > 0 && Math.abs(ty * a - b * tx) < 0.0001;
      testPt = { x: tx, y: ty, onLine };
      renderVisuals();
    }

    if (testBtn && testInpX && testInpY) {
      testBtn.addEventListener("click", () => {
        const tx = Number(testInpX.value);
        const ty = Number(testInpY.value);
        runTest(tx, ty);
      });
      [testInpX, testInpY].forEach((inp) => {
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            runTest(Number(testInpX.value), Number(testInpY.value));
          }
        });
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        testPt = null;
        renderVisuals();
      });
    }

    stage.querySelectorAll(".rtlab-test-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const tx = Number(chip.dataset.tx);
        const ty = Number(chip.dataset.ty);
        runTest(tx, ty);
      });
    });
  }

  function build() {
    a = clamp(inA.value);
    b = clamp(inB.value);
    inA.value = a;
    inB.value = b;
    activeK = null;
    testPt = null;

    renderVisuals();

    const unit = fmt(b / a);
    result.innerHTML =
      `<div class="rtlab-answer">${a} : ${b}  →  (1, ${unit})</div>` +
      `<p class="rtlab-explain">Every column in the table forms an ordered pair <strong>(x, y)</strong>. When plotted, equivalent ratios always form a <strong>straight line that passes through the origin (0, 0)</strong>. The <strong>unit rate point</strong> is (1, ${unit}).</p>`;
  }

  root.querySelector(".rtlab-go").addEventListener("click", build);
  root.querySelectorAll(".rtlab-chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      const [x, y] = chip.dataset.p.split(":");
      inA.value = x;
      inB.value = y;
      build();
    }),
  );
  [inA, inB].forEach((inp) =>
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        build();
      }
    }),
  );

  build();
  return { destroy: () => root.remove() };
}

let injected = false;
function injectStyles() {
  if (injected || document.getElementById("rtlab-styles")) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "rtlab-styles";
  s.textContent = `
  .rtlab{max-width:620px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .rtlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:700;color:${C.navy};font-size:1.1rem;}
  .rtlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .rtlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .rtlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:600;color:${C.muted};text-transform:uppercase;}
  .rtlab-field input{width:76px;padding:8px 10px;font-size:1.1rem;font-weight:600;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .rtlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .rtlab-colon{align-self:center;padding-bottom:9px;font-weight:700;color:${C.navy};font-size:1.2rem;}
  .rtlab-go{padding:9px 16px;font-size:.95rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#1d4ed8,#0d7a76);border:0;border-radius:10px;cursor:pointer;transition:transform .1s;}
  .rtlab-go:hover{filter:brightness(1.08);transform:translateY(-1px);}
  .rtlab-go:focus-visible,.rtlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .rtlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .rtlab-chip{padding:5px 12px;font-size:.9rem;font-weight:600;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .rtlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .rtlab-stage{margin:14px 0 8px;padding:10px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;overflow-x:auto;}
  .rtlab-table-wrap{overflow-x:auto;padding-bottom:4px;}
  .rtlab-table{width:100%;border-collapse:collapse;font-size:.95rem;text-align:center;min-width:340px;}
  .rtlab-table th{padding:6px 8px;font-size:.8rem;color:${C.muted};font-weight:600;cursor:pointer;user-select:none;}
  .rtlab-corner{color:${C.navy};cursor:default;}
  .rtlab-rowlab{color:${C.navy};font-weight:700;cursor:default;}
  .rtlab-table td{padding:7px 8px;border:1px solid ${C.line};font-weight:600;color:${C.navy};cursor:pointer;user-select:none;}
  .rtlab-base{background:#eef4ff;color:${C.accent};}
  .rtlab-col-active{background:#dbeafe!important;color:${C.accent}!important;outline:2px solid ${C.accent};}
  .rtlab-view-tabs{display:flex;gap:8px;margin:12px 0 8px;justify-content:center;}
  .rtlab-tab{padding:6px 14px;font-size:.85rem;font-weight:700;border:1.5px solid ${C.line};border-radius:999px;background:#ffffff;color:${C.muted};cursor:pointer;}
  .rtlab-tab.is-active{background:${C.navy};color:#ffffff;border-color:${C.navy};}
  .rtlab-visual-area{display:flex;justify-content:center;}
  .rtlab-graph{display:block;width:100%;max-width:560px;height:auto;border-radius:8px;}
  .rtlab-dnl{display:block;width:100%;height:auto;margin-top:6px;}
  .rtlab-point{cursor:pointer;transition:transform .12s;}
  .rtlab-point:hover{filter:brightness(1.15);}
  .rtlab-point:focus-visible{outline:2px solid ${C.accent};outline-offset:2px;}
  .rtlab-point-detail{margin-top:8px;padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:.85rem;color:#166534;text-align:center;}
  .rtlab-test-panel{margin-top:12px;padding:12px 14px;background:#ffffff;border:1.5px solid ${C.line};border-radius:12px;}
  .rtlab-test-header{font-size:.9rem;color:${C.navy};display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
  .rtlab-test-sub{color:${C.muted};font-size:.82rem;}
  .rtlab-test-controls{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap;}
  .rtlab-test-input-lbl{display:flex;align-items:center;gap:4px;font-size:.85rem;font-weight:700;color:${C.navy};}
  .rtlab-test-input-lbl input{width:56px;padding:6px 8px;font-size:1rem;font-weight:700;border:1.5px solid ${C.line};border-radius:8px;text-align:center;}
  .rtlab-test-comma{font-weight:800;color:${C.navy};font-size:1.1rem;}
  .rtlab-test-btn{padding:7px 14px;font-size:.85rem;font-weight:700;color:#fff;background:${C.navy};border:0;border-radius:8px;cursor:pointer;}
  .rtlab-test-btn:hover{background:${C.accent};}
  .rtlab-test-clear{padding:6px 10px;font-size:.8rem;font-weight:600;color:${C.muted};background:#f1f5f9;border:1px solid ${C.line};border-radius:6px;cursor:pointer;}
  .rtlab-test-quick{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap;}
  .rtlab-quick-lbl{font-size:.78rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .rtlab-test-chip{padding:3px 10px;font-size:.82rem;font-weight:600;color:${C.navy};background:#f8fafc;border:1px solid ${C.line};border-radius:999px;cursor:pointer;}
  .rtlab-test-chip:hover{background:#e2e8f0;border-color:${C.navy};}
  .rtlab-test-feedback{margin-top:10px;padding:8px 12px;border-radius:8px;font-size:.88rem;line-height:1.45;}
  .rtlab-test-feedback.is-on{background:#f0fdf4;border:1.5px solid #86efac;color:#166534;}
  .rtlab-test-feedback.is-off{background:#fef2f2;border:1.5px solid #fca5a5;color:#991b1b;}
  .rtlab-result{text-align:center;margin-top:8px;}
  .rtlab-answer{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.2rem;color:${C.teal};}
  .rtlab-explain{margin:6px auto 0;max-width:520px;color:${C.ink};font-size:.9rem;line-height:1.5;}
  `;
  document.head.appendChild(s);
}

export default renderRatioTableBuilder;
