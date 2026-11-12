// Makes a coordinate-plane picture touchable. A plane drawn by engine-geo carries a hidden
// <g data-plane="cx,cy,k,R"> (centre, pixels per unit, range). Tapping or clicking the plane drops a point on the
// nearest whole-number coordinate and reads it back in words; arrow keys move it. The point survives the next
// frame because the panels call bindPlane() after every morph.
const NS = "http://www.w3.org/2000/svg";
const minus = (n) => String(n).replace("-", "−");
const quadrantOf = (x, y) =>
  x === 0 || y === 0 ? null : x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III";
const ARROWS = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };

function geometry(stage) {
  const marker = stage.querySelector("[data-plane]");
  if (!marker) return null;
  const [cx, cy, k, R] = marker.dataset.plane.split(",").map(Number);
  return { cx, cy, k, R, svg: marker.ownerSVGElement };
}

export function describePoint(x, y, lang) {
  const q = quadrantOf(x, y);
  const pair = `(${minus(x)}, ${minus(y)})`;
  if (lang === "es") {
    const dx = x > 0 ? "a la derecha del" : x < 0 ? "a la izquierda del" : "sobre el";
    const dy = y > 0 ? "arriba del" : y < 0 ? "abajo del" : "sobre el";
    const where = q ? `cuadrante ${q}` : "sobre un eje, no está en un cuadrante";
    return `${pair}: x está ${dx} eje y, y está ${dy} eje x. Es ${where}.`;
  }
  const dx = x > 0 ? "right of" : x < 0 ? "left of" : "on";
  const dy = y > 0 ? "above" : y < 0 ? "below" : "on";
  const where = q ? `quadrant ${q}` : "on an axis, so not in a quadrant";
  return `${pair}: x is ${dx} the y-axis, y is ${dy} the x-axis. That is ${where}.`;
}

function drawProbe(stage, g, point) {
  g.svg.querySelector(".sd-probe")?.remove();
  if (!point) return;
  const x = g.cx + point.x * g.k;
  const y = g.cy - point.y * g.k;
  const probe = stage.ownerDocument.createElementNS(NS, "g");
  probe.setAttribute("class", "sd-probe");
  probe.setAttribute("pointer-events", "none");
  const dot = stage.ownerDocument.createElementNS(NS, "circle");
  for (const [name, value] of Object.entries({
    cx: x,
    cy: y,
    r: 7,
    fill: "#c2410c",
    stroke: "#fff",
    "stroke-width": 2.5,
  }))
    dot.setAttribute(name, value);
  const label = stage.ownerDocument.createElementNS(NS, "text");
  // Below the dot, centred, so it never sits on top of a label the picture already drew beside a plotted point.
  for (const [name, value] of Object.entries({
    x,
    y: y + 24,
    "text-anchor": "middle",
    "font-size": 13,
    "font-weight": 700,
    fill: "#9a3412",
    stroke: "#fff",
    "stroke-width": 3,
    "paint-order": "stroke",
  }))
    label.setAttribute(name, value);
  label.textContent = `(${minus(point.x)}, ${minus(point.y)})`;
  probe.append(dot, label);
  g.svg.append(probe);
}

function readoutFor(stage, lang) {
  const wrap = stage.closest(".sd-stage-wrap");
  let out = wrap?.nextElementSibling?.matches(".sd-probe-read") ? wrap.nextElementSibling : null;
  if (!out && wrap) {
    out = Object.assign(stage.ownerDocument.createElement("p"), {
      className: "sd-cap sd-probe-read",
    });
    out.setAttribute("role", "status");
    out.setAttribute("aria-live", "polite");
    wrap.after(out);
  }
  if (out && !out.textContent) {
    out.textContent =
      lang() === "es"
        ? "Toca el plano para colocar un punto. Con el teclado, enfoca el plano y usa las flechas."
        : "Tap the plane to place a point. With a keyboard, focus the plane and use the arrow keys.";
  }
  return out;
}

// Call after every morph. `onPick({ x, y, quadrant, commit })` fires when a point is placed (commit is true for a
// tap or Enter). `keys` is "plain" when the arrows are free (Build) or "shift" when they step frames (Watch).
export function bindPlane(stage, { lang, onPick = null, keys = "plain" }) {
  const g = geometry(stage);
  if (g) readoutFor(stage, lang);
  if (!g) {
    const next = stage.closest(".sd-stage-wrap")?.nextElementSibling;
    if (next?.matches(".sd-probe-read")) next.remove();
    stage.removeAttribute("data-plane-live");
    return;
  }
  const state = stage.planeState || (stage.planeState = { point: null });
  drawProbe(stage, g, state.point);
  stage.dataset.planeLive = "1";
  if (stage.dataset.planeBound) return;
  stage.dataset.planeBound = "1";
  const place = (point, commit) => {
    const cur = geometry(stage);
    if (!cur) return;
    state.point = {
      x: Math.max(-cur.R, Math.min(cur.R, point.x)),
      y: Math.max(-cur.R, Math.min(cur.R, point.y)),
    };
    drawProbe(stage, cur, state.point);
    const text = describePoint(state.point.x, state.point.y, lang());
    const live = readoutFor(stage, lang);
    if (live) live.textContent = text;
    onPick?.({ ...state.point, quadrant: quadrantOf(state.point.x, state.point.y), commit });
  };
  stage.addEventListener("pointerdown", (event) => {
    const cur = geometry(stage);
    if (!cur || !event.target.closest("svg") || event.target.closest(".sd-token")) return;
    const pt = cur.svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const local = pt.matrixTransform(cur.svg.getScreenCTM().inverse());
    event.preventDefault();
    place(
      { x: Math.round((local.x - cur.cx) / cur.k), y: Math.round((cur.cy - local.y) / cur.k) },
      true,
    );
  });
  stage.addEventListener(
    "keydown",
    (event) => {
      if (!geometry(stage)) return;
      if (event.key === "Enter" && state.point && keys === "plain") {
        event.preventDefault();
        place(state.point, true);
        return;
      }
      const step = ARROWS[event.key];
      if (!step || (keys === "shift") !== event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      const from = state.point || { x: 0, y: 0 };
      place({ x: from.x + step[0], y: from.y + step[1] }, false);
    },
    true,
  );
  if (keys === "plain" && !stage.hasAttribute("tabindex")) {
    stage.setAttribute("tabindex", "0");
    stage.setAttribute(
      "aria-label",
      lang() === "es"
        ? "Plano. Usa las flechas para mover un punto y Intro para elegir su cuadrante."
        : "Coordinate plane. Use the arrow keys to move a point and Enter to choose its quadrant.",
    );
  }
}
