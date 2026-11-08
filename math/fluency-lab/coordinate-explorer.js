// Interactive coordinate plane used by the explanation tools and model drawer.
// The main SVG coordinate-grid remains the general skill model; this focused view adds
// a two-point investigation with exact coordinate, slope, reflection, and distance feedback.
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const MIN = -10;
const MAX = 10;
const W = 480;
const H = 420;
const LEFT = 54;
const RIGHT = 426;
const TOP = 28;
const BOTTOM = 392;
const X = (x) => LEFT + ((x - MIN) / (MAX - MIN)) * (RIGHT - LEFT);
const Y = (y) => TOP + ((MAX - y) / (MAX - MIN)) * (BOTTOM - TOP);
const safePoint = (p, fallback) => ({
  x: Math.max(MIN, Math.min(MAX, Math.round(Number(p?.x ?? fallback.x) || 0))),
  y: Math.max(MIN, Math.min(MAX, Math.round(Number(p?.y ?? fallback.y) || 0))),
});
const signed = (n) => (n > 0 ? `+${n}` : String(n));
const pair = (p) => `(${p.x}, ${p.y})`;

function cleanState(state = {}) {
  return {
    p1: safePoint(state.p1, { x: 3, y: 4 }),
    p2: safePoint(state.p2, { x: -2, y: -1 }),
    active: state.active === "B" ? "B" : "A",
    showSlope: state.showSlope !== false,
    singlePoint: state.singlePoint === true,
    target: state.target ? safePoint(state.target, { x: 0, y: 0 }) : null,
    referencePoints: (state.referencePoints || []).map((p) => safePoint(p, { x: 0, y: 0 })),
    showRelationships: state.showRelationships ?? state.singlePoint !== true,
    showConnector: state.showConnector ?? state.singlePoint !== true,
  };
}

function planeSvg(s) {
  const { p1, p2 } = s;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const slope = dx === 0 ? "undefined (vertical line)" : `${dy}/${dx}${dy % dx === 0 ? ` = ${dy / dx}` : ""}`;
  const grid = [];
  for (let n = MIN; n <= MAX; n += 1) {
    const major = n % 3 === 0;
    grid.push(`<line class="coord-gridline${major ? " is-major" : ""}" x1="${X(n)}" y1="${TOP}" x2="${X(n)}" y2="${BOTTOM}" />`);
    grid.push(`<line class="coord-gridline${major ? " is-major" : ""}" x1="${LEFT}" y1="${Y(n)}" x2="${RIGHT}" y2="${Y(n)}" />`);
    if (n !== 0 && n % 3 === 0) {
      grid.push(`<text class="coord-tick" x="${X(n)}" y="${Y(0) + 19}" text-anchor="middle">${n}</text>`);
      grid.push(`<text class="coord-tick" x="${X(0) - 10}" y="${Y(n) + 4}" text-anchor="end">${n}</text>`);
    }
  }
  const line = s.singlePoint ? "" : `<line class="coord-connector" x1="${X(p1.x)}" y1="${Y(p1.y)}" x2="${X(p2.x)}" y2="${Y(p2.y)}" />`;
  const slopeTriangle = s.showSlope && !s.singlePoint
    ? `<path class="coord-slope-triangle" d="M${X(p1.x)},${Y(p1.y)} H${X(p2.x)} V${Y(p2.y)}" />
       <text class="coord-delta" x="${(X(p1.x) + X(p2.x)) / 2}" y="${Y(p1.y) + (dy >= 0 ? 18 : -8)}" text-anchor="middle">Δx ${signed(dx)}</text>
       <text class="coord-delta" x="${X(p2.x) + (dx >= 0 ? 7 : -7)}" y="${(Y(p1.y) + Y(p2.y)) / 2}" text-anchor="${dx >= 0 ? "start" : "end"}">Δy ${signed(dy)}</text>`
    : "";
  const targetPoint = s.target
    ? `<circle class="coord-target-point" cx="${X(s.target.x)}" cy="${Y(s.target.y)}" r="8"/><text class="coord-point-label" x="${X(s.target.x) + 12}" y="${Y(s.target.y) + 20}">Image ${esc(pair(s.target))}</text>`
    : "";
  const references = s.referencePoints.map((p, index) => `<circle class="coord-reference" cx="${X(p.x)}" cy="${Y(p.y)}" r="6"/><text class="coord-point-label" x="${X(p.x) + 10}" y="${Y(p.y) - 8}">${String.fromCharCode(67 + index)} ${esc(pair(p))}</text>`).join("");
  const point = (name, p, active, color) => `<g class="coord-handle${active ? " is-active" : ""}" data-point="${name}" tabindex="0" role="button" aria-label="Point ${name} at ${esc(pair(p))}. Use arrow keys to move one unit." transform="translate(${X(p.x)} ${Y(p.y)})" style="--point-color:${color}">
    <circle class="coord-hit" r="19"/><circle class="coord-halo" r="10"/><circle class="coord-dot" r="6"/>
    <text class="coord-point-label" x="12" y="-11">${name} ${esc(pair(p))}</text></g>`;
  return `<svg class="coord-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Interactive coordinate plane. Drag a point, click to move the selected point, or use arrow keys.">
    <rect class="coord-plane-bg" x="${LEFT}" y="${TOP}" width="${RIGHT - LEFT}" height="${BOTTOM - TOP}" rx="8"/>
    <g>${grid.join("")}
      <text class="coord-quadrant" x="${X(5)}" y="${Y(7)}">I</text><text class="coord-quadrant" x="${X(-5)}" y="${Y(7)}">II</text>
      <text class="coord-quadrant" x="${X(-5)}" y="${Y(-7)}">III</text><text class="coord-quadrant" x="${X(5)}" y="${Y(-7)}">IV</text>
      <line class="coord-axis" x1="${LEFT}" y1="${Y(0)}" x2="${RIGHT + 10}" y2="${Y(0)}"/>
      <path class="coord-arrowhead" d="M${RIGHT + 10},${Y(0)} l-7,-4 v8 z"/>
      <line class="coord-axis" x1="${X(0)}" y1="${BOTTOM}" x2="${X(0)}" y2="${TOP - 8}"/>
      <path class="coord-arrowhead" d="M${X(0)},${TOP - 8} l-4,7 h8 z"/>
      <text class="coord-axis-label" x="${RIGHT + 12}" y="${Y(0) + 4}">x</text><text class="coord-axis-label" x="${X(0) + 7}" y="${TOP - 9}">y</text>
      ${s.showConnector ? line : ""}${slopeTriangle}${references}${targetPoint}${point("A", p1, s.active === "A", "#1463c5")}${s.singlePoint ? "" : point("B", p2, s.active === "B", "#087f65")}
    </g>
  </svg>`;
}

function content(s) {
  const dx = s.p2.x - s.p1.x;
  const dy = s.p2.y - s.p1.y;
  const dist2 = dx * dx + dy * dy;
  const dist = Number.isInteger(Math.sqrt(dist2)) ? String(Math.sqrt(dist2)) : `√${dist2} ≈ ${Math.sqrt(dist2).toFixed(2)}`;
  const slope = dx === 0 ? "Undefined (vertical line)" : `${dy}/${dx}${dy % dx === 0 ? ` = ${dy / dx}` : ` ≈ ${(dy / dx).toFixed(2)}`}`;
  const quadrant = s.p1.x === 0 && s.p1.y === 0 ? "the origin" : s.p1.x === 0 ? "the y-axis" : s.p1.y === 0 ? "the x-axis" : `quadrant ${s.p1.x > 0 ? (s.p1.y > 0 ? "I" : "IV") : (s.p1.y > 0 ? "II" : "III")}`;
  return `<header class="coord-header"><div><p class="coord-eyebrow">Coordinate plane · x across, y up</p><h2 class="coord-title">${s.singlePoint ? "Place a point" : "Explore points, slope, and distance"}</h2></div>
      <div class="coord-badges" aria-label="Current values"><span class="coord-badge point-a">A ${esc(pair(s.p1))}</span>${s.singlePoint ? "" : `<span class="coord-badge point-b">B ${esc(pair(s.p2))}</span>`}${s.target ? `<span class="coord-badge target">Image ${esc(pair(s.target))}</span>` : ""}</div></header>
    <p class="coord-instruction">Drag A or B. You can also select a point and click the grid, or move a focused point with the arrow keys.</p>
    <div class="coord-stage-box">${planeSvg(s)}</div>
    <div class="coord-point-controls" role="group" aria-label="Choose which point to move">
      <button type="button" class="coord-btn point-a${s.active === "A" ? " is-selected" : ""}" data-active-point="A" aria-pressed="${s.active === "A"}">Move point A</button>
      ${s.singlePoint ? "" : `<button type="button" class="coord-btn point-b${s.active === "B" ? " is-selected" : ""}" data-active-point="B" aria-pressed="${s.active === "B"}">Move point B</button>`}
      ${s.showRelationships ? `<button type="button" class="coord-btn" data-coord-act="slope" aria-pressed="${s.showSlope}">${s.showSlope ? "Hide" : "Show"} rise and run</button>` : ""}
    </div>
    <div class="coord-coordinate-inputs" role="group" aria-label="Edit ordered pairs">
      <label class="coord-input-pair point-a"><span>Point A <span class="visually-hidden">x and y</span></span><span>(</span><input type="number" min="${MIN}" max="${MAX}" step="1" value="${s.p1.x}" data-coord-in="x1" aria-label="Point A x-coordinate"/><span>,</span><input type="number" min="${MIN}" max="${MAX}" step="1" value="${s.p1.y}" data-coord-in="y1" aria-label="Point A y-coordinate"/><span>)</span></label>
      ${s.singlePoint ? "" : `<label class="coord-input-pair point-b"><span>Point B <span class="visually-hidden">x and y</span></span><span>(</span><input type="number" min="${MIN}" max="${MAX}" step="1" value="${s.p2.x}" data-coord-in="x2" aria-label="Point B x-coordinate"/><span>,</span><input type="number" min="${MIN}" max="${MAX}" step="1" value="${s.p2.y}" data-coord-in="y2" aria-label="Point B y-coordinate"/><span>)</span></label>`}
    </div>
    <section class="coord-readout" aria-label="${s.showRelationships && !s.singlePoint ? "Relationship between points" : "Point locations"}">${s.showRelationships && !s.singlePoint ? `<p><span>Horizontal change</span><strong>Δx = ${signed(dx)}</strong></p><p><span>Vertical change</span><strong>Δy = ${signed(dy)}</strong></p><p><span>Slope (rise ÷ run)</span><strong>${slope}</strong></p><p><span>Distance A to B</span><strong>${dist}</strong></p>` : `<p><span>Point A · ordered pair</span><strong>${esc(pair(s.p1))}</strong></p><p><span>Point A · location</span><strong>${quadrant}</strong></p>${s.singlePoint ? "" : `<p><span>Point B · ordered pair</span><strong>${esc(pair(s.p2))}</strong></p>`}${s.target ? `<p><span>Target image</span><strong>${esc(pair(s.target))}</strong></p>` : ""}`}</section>
    <div class="coord-controls-row"><button type="button" class="coord-btn" data-coord-act="reflect-x">Reflect A over the x-axis</button><button type="button" class="coord-btn" data-coord-act="reflect-y">Reflect A over the y-axis</button><button type="button" class="coord-btn" data-coord-act="reset">Reset points</button></div>
    <p class="coord-live visually-hidden" role="status" aria-live="polite"></p>`;
}

export function renderCoordinateExplorer(state = {}) {
  const s = cleanState(state);
  return `<section class="coord-explorer-wrap" data-coord-root="true" data-x1="${s.p1.x}" data-y1="${s.p1.y}" data-x2="${s.p2.x}" data-y2="${s.p2.y}" data-active="${s.active}" data-show-slope="${s.showSlope}" data-single-point="${s.singlePoint}" data-target="${esc(JSON.stringify(s.target))}" data-reference-points="${esc(JSON.stringify(s.referencePoints))}" data-show-relationships="${s.showRelationships}" data-show-connector="${s.showConnector}">${content(s)}</section>`;
}

export function mountCoordinateExplorer(container, onChange) {
  if (!container) return () => {};
  const roots = container.matches?.("[data-coord-root]")
    ? [container]
    : [...(container.querySelectorAll?.("[data-coord-root]") || [])];
  if (roots.length > 1) {
    const cleanups = roots.map((root) => mountCoordinateExplorer(root, onChange));
    return () => cleanups.forEach((cleanup) => cleanup());
  }
  let root = roots[0];
  if (!root) return () => {};
  let state = cleanState({
    p1: { x: root.dataset.x1, y: root.dataset.y1 },
    p2: { x: root.dataset.x2, y: root.dataset.y2 },
    active: root.dataset.active,
    showSlope: root.dataset.showSlope !== "false",
    singlePoint: root.dataset.singlePoint === "true",
    target: JSON.parse(root.dataset.target || "null"),
    referencePoints: JSON.parse(root.dataset.referencePoints || "[]"),
    showRelationships: root.dataset.showRelationships !== "false",
    showConnector: root.dataset.showConnector !== "false",
  });
  let dragging = null;

  const emit = () => onChange?.({ p1: { ...state.p1 }, p2: { ...state.p2 }, active: state.active });
  const draw = (preserveInput) => {
    const activeInput = preserveInput && root.contains(root.ownerDocument.activeElement) ? root.ownerDocument.activeElement.dataset.coordIn : null;
    const activeValue = activeInput ? root.querySelector(`[data-coord-in="${activeInput}"]`)?.value : null;
    root.dataset.x1 = state.p1.x;
    root.dataset.y1 = state.p1.y;
    root.dataset.x2 = state.p2.x;
    root.dataset.y2 = state.p2.y;
    root.dataset.active = state.active;
    root.dataset.showSlope = String(state.showSlope);
    root.dataset.singlePoint = String(state.singlePoint);
    root.dataset.target = JSON.stringify(state.target);
    root.dataset.referencePoints = JSON.stringify(state.referencePoints);
    root.dataset.showRelationships = String(state.showRelationships);
    root.dataset.showConnector = String(state.showConnector);
    root.innerHTML = content(state);
    if (activeInput) {
      const input = root.querySelector(`[data-coord-in="${activeInput}"]`);
      if (input) {
        input.value = activeValue;
        input.focus({ preventScroll: true });
      }
    }
  };
  const setPoint = (name, point, announce = true, preserveInput = false) => {
    state[name === "A" ? "p1" : "p2"] = safePoint(point, state[name === "A" ? "p1" : "p2"]);
    draw(preserveInput);
    emit();
    if (announce) root.querySelector(".coord-live")?.replaceChildren(root.ownerDocument.createTextNode(`Point ${name} is now ${pair(state[name === "A" ? "p1" : "p2"])}.`));
  };
  const pointerPoint = (event) => {
    const svg = root.querySelector(".coord-svg");
    const box = svg.getBoundingClientRect();
    let x;
    let y;
    if (svg.createSVGPoint && svg.getScreenCTM?.()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(svg.getScreenCTM().inverse());
      x = local.x;
      y = local.y;
    } else {
      x = ((event.clientX - box.left) / box.width) * W;
      y = ((event.clientY - box.top) / box.height) * H;
    }
    return safePoint({ x: MIN + ((x - LEFT) / (RIGHT - LEFT)) * (MAX - MIN), y: MAX - ((y - TOP) / (BOTTOM - TOP)) * (MAX - MIN) }, { x: 0, y: 0 });
  };

  const onPointerDown = (event) => {
    const handle = event.target.closest?.("[data-point]");
    const svg = event.target.closest?.(".coord-svg");
    if (handle) {
      dragging = handle.dataset.point;
      state.active = dragging;
      root.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      setPoint(dragging, pointerPoint(event), false);
    } else if (svg) {
      event.preventDefault();
      root.setPointerCapture?.(event.pointerId);
      setPoint(state.active, pointerPoint(event));
    }
  };
  const onPointerMove = (event) => {
    if (dragging) setPoint(dragging, pointerPoint(event), false);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    const name = dragging;
    dragging = null;
    const point = name === "A" ? state.p1 : state.p2;
    root.querySelector(".coord-live")?.replaceChildren(root.ownerDocument.createTextNode(`Point ${name} is now ${pair(point)}.`));
  };
  const onClick = (event) => {
    const button = event.target.closest?.("[data-active-point], [data-coord-act]");
    if (!button || button.matches("[data-point]")) return;
    if (button.dataset.activePoint) {
      state.active = button.dataset.activePoint;
      draw();
    } else if (button.dataset.coordAct === "slope") {
      state.showSlope = !state.showSlope;
      draw();
    } else if (button.dataset.coordAct === "reflect-x") {
      setPoint("A", { x: state.p1.x, y: -state.p1.y });
    } else if (button.dataset.coordAct === "reflect-y") {
      setPoint("A", { x: -state.p1.x, y: state.p1.y });
    } else if (button.dataset.coordAct === "reset") {
      state = cleanState({ singlePoint: state.singlePoint, target: state.target, referencePoints: state.referencePoints, showRelationships: state.showRelationships, showConnector: state.showConnector });
      draw();
      emit();
    }
  };
  const onInput = (event) => {
    const input = event.target.closest?.("[data-coord-in]");
    if (!input || input.value === "" || !Number.isFinite(Number(input.value))) return;
    const key = input.dataset.coordIn;
    const p = key.endsWith("1") ? "A" : "B";
    const coord = key.startsWith("x") ? "x" : "y";
    const current = p === "A" ? state.p1 : state.p2;
    const next = { ...current, [coord]: Number(input.value) };
    if (p === "A") state.p1 = safePoint(next, current); else state.p2 = safePoint(next, current);
    input.value = String(state[p === "A" ? "p1" : "p2"][coord]);
    draw(true);
    emit();
  };
  const onKeyDown = (event) => {
    const handle = event.target.closest?.("[data-point]");
    if (!handle) return;
    const delta = { x: 0, y: 0 };
    if (event.key === "ArrowRight") delta.x = 1;
    else if (event.key === "ArrowLeft") delta.x = -1;
    else if (event.key === "ArrowUp") delta.y = 1;
    else if (event.key === "ArrowDown") delta.y = -1;
    else return;
    event.preventDefault();
    const name = handle.dataset.point;
    const point = name === "A" ? state.p1 : state.p2;
    state.active = name;
    setPoint(name, { x: point.x + delta.x, y: point.y + delta.y });
    root.querySelector(`[data-point="${name}"]`)?.focus({ preventScroll: true });
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerUp);
  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKeyDown);
  return () => {
    root?.removeEventListener("pointerdown", onPointerDown);
    root?.removeEventListener("pointermove", onPointerMove);
    root?.removeEventListener("pointerup", onPointerUp);
    root?.removeEventListener("pointercancel", onPointerUp);
    root?.removeEventListener("click", onClick);
    root?.removeEventListener("input", onInput);
    root?.removeEventListener("keydown", onKeyDown);
  };
}
