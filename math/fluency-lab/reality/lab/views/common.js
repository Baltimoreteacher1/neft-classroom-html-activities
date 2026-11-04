// Shared drawing and control helpers for the model views: SVG and button factories, a drag handle that always has a
// keyboard twin, and a labelled stepper. Views never change state themselves; they call ctx.act(action).
import { h, s } from "../../../graphics/graphics-a-ui.js";

export { h, s };

export const VB_W = 640;

export function svgRoot(height, label, extra = {}) {
  return s("svg", { viewBox: `0 0 ${VB_W} ${height}`, class: "mr-svg", role: "group", "aria-label": label, preserveAspectRatio: "xMidYMid meet", ...extra });
}

export const text = (x, y, str, cls = "", anchor = "middle") => s("text", { x, y, class: `mr-t ${cls}`, "text-anchor": anchor }, String(str));

export function btn(label, onClick, { cls = "", aria, disabled = false, key, pressed } = {}) {
  return h("button", { type: "button", class: `mr-btn ${cls}`.trim(), "aria-label": aria, disabled, "data-key": key, "aria-pressed": pressed === undefined ? null : String(pressed), on: { click: onClick } }, label);
}

export const group = (label, ...kids) => h("div", { class: "mr-group", role: "group", "aria-label": label }, ...kids);
export const row = (...kids) => h("div", { class: "mr-row" }, ...kids);
export const fieldLabel = (str) => h("span", { class: "mr-field-label" }, str);

// A number control with minus and plus buttons; the value is announced politely by the workspace live region.
export function stepper(label, value, { onMinus, onPlus, minDisabled, plusDisabled, key }) {
  return h("div", { class: "mr-stepper", role: "group", "aria-label": label },
    h("span", { class: "mr-field-label" }, label),
    btn("−", onMinus, { aria: `${label}: −`, disabled: minDisabled, cls: "mr-step", key: `${key}-minus` }),
    h("output", { class: "mr-step-val", "aria-live": "off" }, String(value)),
    btn("+", onPlus, { aria: `${label}: +`, disabled: plusDisabled, cls: "mr-step", key: `${key}-plus` }),
  );
}

// Convert a pointer event to SVG user-space coordinates.
export function svgPoint(svg, event) {
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const m = svg.getScreenCTM();
  return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
}

// A draggable handle. onMove receives SVG coordinates; arrow keys call onKey(dx, dy) so the same change is available
// without a pointer. The element needs a visible focus style (the .mr-handle class draws one).
export function makeHandle(el, svg, { onMove, onKey, label, valueText, key }) {
  el.classList.add("mr-handle");
  el.setAttribute("tabindex", "0");
  el.setAttribute("role", "slider");
  // The view is redrawn after every move; the key lets the workspace put keyboard focus back on the same handle.
  if (key) el.setAttribute("data-key", key);
  if (label) el.setAttribute("aria-label", label);
  if (valueText) el.setAttribute("aria-valuetext", valueText);
  let dragging = false;
  el.addEventListener("pointerdown", (event) => {
    dragging = true;
    el.setPointerCapture?.(event.pointerId);
    el.classList.add("is-dragging");
    event.preventDefault();
  });
  el.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    onMove(svgPoint(svg, event));
  });
  const stop = () => {
    dragging = false;
    el.classList.remove("is-dragging");
  };
  el.addEventListener("pointerup", stop);
  el.addEventListener("pointercancel", stop);
  el.addEventListener("keydown", (event) => {
    const step = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
    if (!step || !onKey) return;
    event.preventDefault();
    onKey(step[0], step[1]);
  });
  return el;
}

export const frac = (n, d) => h("span", { class: "mr-frac", role: "math", "aria-label": `${n} over ${d}` }, h("span", { class: "mr-num" }, String(n)), h("span", { class: "mr-den" }, String(d)));
export const minus = (str) => String(str).replace(/-/g, "−");

// Colors are CSS custom properties so each grade band can restyle the same drawing.
export const fill = (name) => `var(--mr-${name})`;
