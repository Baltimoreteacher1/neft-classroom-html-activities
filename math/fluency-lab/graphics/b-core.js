// Shared scaffolding for the graphics-b components: element builders, the component shell (title, toolbar, stage,
// readout, help, polite live region), keyed handle sync, pointer drag on an SVG, and keyboard arrow decoding.
import { getLang, setLang, t } from "../i18n.js";

export { t };
const SVG_NS = "http://www.w3.org/2000/svg";
export const MODES = Object.freeze(["explore", "build", "check"]);
export const clone = (value) => JSON.parse(JSON.stringify(value));

function applyAttrs(node, attrs) {
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (name === "text") node.textContent = value;
    else if (name === "on")
      for (const [event, fn] of Object.entries(value)) node.addEventListener(event, fn);
    else node.setAttribute(name, value === true ? "" : String(value));
  }
  return node;
}
const fill = (node, kids) => {
  for (const kid of kids.flat())
    if (kid !== null && kid !== undefined && kid !== false) node.append(kid);
  return node;
};
export const s = (tag, attrs = {}, ...kids) =>
  fill(applyAttrs(document.createElementNS(SVG_NS, tag), attrs), kids);
export const h = (tag, attrs = {}, ...kids) =>
  fill(applyAttrs(document.createElement(tag), attrs), kids);

export function createShell(container, config, kind, { defaultLabel, help }) {
  if (config.lang && config.lang !== getLang()) setLang(config.lang, { persist: false });
  const mode = MODES.includes(config.mode) ? config.mode : "explore";
  const label = config.label || defaultLabel;
  const toolbar = h("div", { class: "gb-toolbar", role: "toolbar", "aria-label": t("Controls") });
  const controls = h("div", { class: "gb-controls" });
  const readout = h("div", { class: "gb-readout", role: "group", "aria-label": t("Working") });
  const live = h("div", {
    class: "gb-sr",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
  const svg = s("svg", { class: "gb-svg", role: "group", "aria-label": label });
  const stage = h("div", { class: "gb-stage" }, svg);
  const root = h(
    "section",
    { class: `gb gb-${kind}`, "data-mode": mode, "data-kind": kind, "aria-label": label },
    config.label ? h("p", { class: "gb-title", text: label }) : null,
    toolbar,
    stage,
    controls,
    readout,
    h("p", { class: "gb-help", text: help }),
    live,
  );
  container.replaceChildren(root);

  let timer = 0;
  let flip = false;
  const announce = (text) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      live.textContent = flip ? `${text} ` : text;
      flip = !flip;
    }, 120);
  };

  let observer = null;
  let lastWidth = 0;
  const measure = () => Math.max(280, Math.min(760, Math.round(stage.clientWidth || 0))) || 560;
  const onResize = (cb) => {
    lastWidth = measure();
    cb(lastWidth);
    if (typeof ResizeObserver === "undefined") return;
    observer = new ResizeObserver(() => {
      const width = measure();
      if (Math.abs(width - lastWidth) > 1) {
        lastWidth = width;
        cb(width);
      }
    });
    observer.observe(stage);
  };

  const emit = (state, correct) => {
    if (typeof config.onChange === "function")
      config.onChange(clone(state), { correct: mode === "check" ? Boolean(correct) : null, kind });
  };
  const destroy = () => {
    clearTimeout(timer);
    observer?.disconnect();
    root.remove();
  };
  return {
    root,
    svg,
    stage,
    toolbar,
    controls,
    readout,
    announce,
    onResize,
    emit,
    destroy,
    mode,
    label,
  };
}

export function button(label, onClick, attrs = {}) {
  return h("button", { type: "button", class: "gb-btn", ...attrs, on: { click: onClick } }, label);
}

// A labelled number control: [-] name value [+]. Returns the element and a setter for the value text.
export function stepper(name, { onDec, onInc }) {
  const value = h("output", { class: "gb-step-value" });
  const el = h(
    "div",
    { class: "gb-stepper", role: "group", "aria-label": name },
    button("−", onDec, {
      "aria-label": t("Decrease {name}", { name }),
      class: "gb-btn gb-btn--icon",
    }),
    h("span", { class: "gb-step-name", text: name }),
    value,
    button("+", onInc, {
      "aria-label": t("Increase {name}", { name }),
      class: "gb-btn gb-btn--icon",
    }),
  );
  return { el, set: (text) => (value.textContent = text) };
}

export function segmented(name, options, current, onPick) {
  const wrap = h("div", { class: "gb-seg", role: "group", "aria-label": name });
  for (const [id, text] of options) wrap.append(button(text, () => onPick(id), { "aria-pressed": String(id === current), "data-id": id }));
  wrap.refresh = (now) => {
    for (const b of wrap.children) b.setAttribute("aria-pressed", String(b.dataset.id === String(now)));
  };
  return wrap;
}

// Keyed reconcile: reuse existing nodes (so focus and pointer capture survive a redraw), add new, drop stale.
export function syncList(layer, cache, items, { key, create, update }) {
  const seen = new Set();
  items.forEach((item, index) => {
    const id = key(item, index);
    seen.add(id);
    let node = cache.get(id);
    if (!node) {
      node = create(item, id);
      cache.set(id, node);
      layer.append(node);
    }
    update(node, item, id);
  });
  for (const [id, node] of cache)
    if (!seen.has(id)) {
      node.remove();
      cache.delete(id);
    }
  items.forEach((item, index) => {
    const node = cache.get(key(item, index));
    if (layer.children[index] !== node) layer.insertBefore(node, layer.children[index] || null);
  });
}

export function svgPoint(svg, event) {
  const ctm = svg.getScreenCTM?.();
  if (!ctm) return { x: event.clientX, y: event.clientY };
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
  return { x: point.x, y: point.y };
}

// Pointer drag for any element carrying data-drag="<id>" inside the svg. Pointer capture sits on the svg root, so
// redrawing the handles mid-drag does not drop the gesture. Touch works through the same pointer events.
export function enableDrag(svg, { onStart, onMove, onEnd, onBackground }) {
  let drag = null;
  svg.addEventListener("pointerdown", (event) => {
    if (event.button > 0) return;
    const node = event.target.closest?.("[data-drag]");
    const point = svgPoint(svg, event);
    if (!node) {
      onBackground?.(point, event);
      return;
    }
    event.preventDefault();
    drag = { id: node.dataset.drag, pointerId: event.pointerId };
    svg.setPointerCapture?.(event.pointerId);
    node.focus?.({ preventScroll: true });
    onStart?.(drag.id, point, event);
  });
  svg.addEventListener("pointermove", (event) => {
    if (drag && event.pointerId === drag.pointerId) onMove(drag.id, svgPoint(svg, event), event);
  });
  const end = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { id } = drag;
    drag = null;
    onEnd?.(id, svgPoint(svg, event), event);
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
}

// Arrow keys as a grid delta; Shift or PageUp/PageDown move five steps. Returns null for any other key.
export function arrowDelta(event) {
  const big = event.shiftKey ? 5 : 1;
  switch (event.key) {
    case "ArrowRight":
      return { dx: big, dy: 0 };
    case "ArrowLeft":
      return { dx: -big, dy: 0 };
    case "ArrowUp":
      return { dx: 0, dy: big };
    case "ArrowDown":
      return { dx: 0, dy: -big };
    case "PageUp":
      return { dx: 5, dy: 0 };
    case "PageDown":
      return { dx: -5, dy: 0 };
    default:
      return null;
  }
}

export const plural = (n, one, many) => (n === 1 ? one : many);
export const num = (value) => String(value).replace("-", "−");
